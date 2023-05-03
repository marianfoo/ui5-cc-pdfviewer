// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview A module that is responsible for creating the groups part (i.e. box) of the dashboard.<br>
 * Extends <code>sap.ui.base.Object</code><br>
 * Exposes the public function <code>createGroupsBox</code>
 * @see sap.ushell.components.homepage.DashboardContent.view
 *
 * @version 1.108.12
 * @name sap.ushell.components.homepage.DashboardGroupsBox
 * @since 1.35.0
 * @private
 */
sap.ui.define([
    "sap/ushell/Layout",
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ushell/ui/launchpad/Tile",
    "sap/ushell/ui/launchpad/DashboardGroupsContainer",
    "sap/ushell/Config",
    "sap/ushell/EventHub",
    "sap/ui/core/Component",
    "sap/ui/core/InvisibleMessage",
    "sap/ui/core/library",
    "sap/m/GenericTile",
    "sap/ui/Device",
    "sap/ushell/ui/launchpad/PlusTile",
    "sap/ushell/resources",
    "sap/ushell/ui/launchpad/TileContainer",
    "sap/ushell/ui/launchpad/LinkTileWrapper",
    "sap/m/Button",
    "sap/ushell/ui/launchpad/GroupHeaderActions",
    "sap/base/util/isEmptyObject",
    "sap/ui/thirdparty/jquery",
    "sap/ui/performance/Measurement",
    "sap/base/util/restricted/_zipObject"
], function (
    Layout,
    baseObject,
    Filter,
    FilterOperator,
    LaunchpadTile,
    DashboardGroupsContainer,
    Config,
    EventHub,
    Component,
    InvisibleMessage,
    coreLibrary,
    GenericTile,
    Device,
    PlusTile,
    resources,
    TileContainer,
    LinkTileWrapper,
    Button,
    GroupHeaderActions,
    isEmptyObject,
    jQuery,
    Measurement,
    _zipObject
) {
    "use strict";

    // shortcut for sap.ui.core.InvisibleMessageMode
    var InvisibleMessageMode = coreLibrary.InvisibleMessageMode;

    var DashboardGroupsBox = baseObject.extend("sap.ushell.components.homepage.DashboardGroupsBox", {
        metadata: {
            publicMethods: ["createGroupsBox"]
        },

        constructor: function (/*sId, mSettings*/) {
            // Make this class only available once
            if (sap.ushell.components.homepage.getDashboardGroupsBox && sap.ushell.components.homepage.getDashboardGroupsBox()) {
                return sap.ushell.components.homepage.getDashboardGroupsBox();
            }
            sap.ushell.components.homepage.getDashboardGroupsBox = (function (value) {
                return function () {
                    return value;
                };
            }(this.getInterface()));

            this.oController = undefined;
            this.oGroupsContainer = undefined;

            this._oInvisibleMessageInstance = InvisibleMessage.getInstance();

            sap.ui.getCore().getEventBus().subscribe("launchpad", "actionModeActive", this._handleActionModeChange, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "actionModeInactive", this._handleActionModeChange, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "GroupHeaderVisibility", this._updateGroupHeaderVisibility, this);

            return undefined;
        },

        destroy: function () {
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "actionModeActive", this._handleActionModeChange, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "actionModeInactive", this._handleActionModeChange, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "GroupHeaderVisibility", this._updateGroupHeaderVisibility, this);
            if (this.oGroupsContainer) {
                this.oGroupsContainer.destroy();
            }
            sap.ushell.components.homepage.getDashboardGroupsBox = undefined;
        },

        calculateFilter: function () {
            // get the homeGroupDisplayMode and do the filter accordingly
            var filters = [];
            var oFilter;
            var sGroupsMode = this.oModel.getProperty("/homePageGroupDisplay"),
                bEditMode = this.oModel.getProperty("/tileActionModeActive");

            if (!bEditMode) {
                if (sGroupsMode && sGroupsMode === "tabs") {
                    oFilter = new Filter("isGroupSelected", FilterOperator.EQ, true);
                } else {
                    oFilter = new Filter("isGroupVisible", FilterOperator.EQ, true);
                }
                filters.push(oFilter);
            }

            return filters;
        },

        /** like Promise.all but returns the resolved promises in an object
         * the purpose is to avoid lines like oService = a[0], etc.
         *
         * @param {array} aPromiseNames Names of the promises
         * @param {array} aPromises The array of promises that all have to be resolved
         * @returns {Promise} Resolves with an Object with all resolved promises
         */
        zipPromiseAll: function (aPromiseNames, aPromises) {
            return Promise.all(aPromises)
                .then(function (aResPromises) {
                    return _zipObject(aPromiseNames, aResPromises);
                });
        },

        loadCardModuleIfNeeded: function () {
            var that = this;
            if (Config.last("/core/home/featuredGroup/enable")) {
                return sap.ui.getCore().loadLibrary("sap.ui.integration", {async: true})
                .then(function () {
                    return new Promise(function (resolve) {
                        sap.ui.require(["sap/ui/integration/widgets/Card"], function (Card) {
                            that.Card = Card;
                            resolve();
                        });
                    });
                });
            }
            return Promise.resolve();
        },
        /**
         * Creating the groups part (i.e. box) of the dashboard
         *
         * @param {sap.ui.core.mvc.Controller} oController DashbaordContent controller
         * @param {sap.ui.model.json.JSONModel} oModel Model containing the data that is filled into the templates
         * @returns {sap.ushell.ui.launchpad.DashboardGroupsContainer} the group container of the dashboard
         */
        createGroupsBox: function (oController, oModel) {
            this.oController = oController;
            var that = this,
                fAfterLayoutInit,
                fGroupsContainerAfterRenderingHandler,

            getPlusTileFromGroup = function (oGroup) {
                var groupDomRef,
                    plusTileDomRef;
                if (oGroup && (groupDomRef = oGroup.getDomRef())) {
                    plusTileDomRef = groupDomRef.querySelector(".sapUshellPlusTile");
                    if (plusTileDomRef) {
                        return plusTileDomRef;
                    }
                }
                return null;
            },

            reorderTilesCallback = function (layoutInfo) {
                var plusTileStartGroup = getPlusTileFromGroup(layoutInfo.currentGroup),
                    plusTileEndGroup = getPlusTileFromGroup(layoutInfo.endGroup),
                    isPlusTileVanishRequired = (layoutInfo.tiles[layoutInfo.tiles.length - 2] === layoutInfo.item) || (layoutInfo.endGroup.getTiles().length === 0);
                if (isPlusTileVanishRequired) {
                    that._hidePlusTile(plusTileEndGroup);
                } else {
                    that._showPlusTile(plusTileEndGroup);
                }

                if (layoutInfo.currentGroup !== layoutInfo.endGroup) {
                    that._showPlusTile(plusTileStartGroup);
                }
            };

            //Since the layout initialization is async, we need to execute the below function after initialization is done
            fAfterLayoutInit = function () {
                //Prevent Plus Tile influence on the tiles reordering by exclude it from the layout matrix calculations
                Layout.getLayoutEngine().setExcludedControl(PlusTile);
                //Hide plus tile when collision with it
                Layout.getLayoutEngine().setReorderTilesCallback.call(Layout.layoutEngine, reorderTilesCallback);
            };

            fGroupsContainerAfterRenderingHandler = function () {
                if (!Layout.isInited) {
                    Layout.init({
                        getGroups: this.getGroups.bind(this),
                        getAllGroups: that.getAllGroupsFromModel.bind(that),
                        isTabBarActive: that.isTabBarActive.bind(that)
                    }).done(fAfterLayoutInit);

                    //when media is changed we need to rerender Layout
                    //media could be changed by SAPUI5 without resize, or any other events. look for internal Incident ID: 1580000668
                    Device.media.attachHandler(function () {
                        if (!this.bIsDestroyed) {
                            Layout.reRenderGroupsLayout(null);
                        }
                    }, this, Device.media.RANGESETS.SAP_STANDARD);

                    var oDomRef = this.getDomRef();
                    oController.getView().sDashboardGroupsWrapperId = !isEmptyObject(oDomRef) && oDomRef.parentNode ? oDomRef.parentNode.id : "";
                }

                EventHub.emit("CenterViewPointContentRendered");
                sap.ui.getCore().getEventBus().publish("launchpad", "contentRendered");
                sap.ui.getCore().getEventBus().publish("launchpad", "contentRefresh");
                if (this.getBinding("groups")) {
                    this.getBinding("groups").filter(that.calculateFilter());
                }
            };

            this.isTabBarActive = function () {
                return this.oModel.getProperty("/homePageGroupDisplay") === "tabs";
            };

            this.oModel = oModel;
            var filters = this.calculateFilter();

            this.oGroupsContainer = new DashboardGroupsContainer("dashboardGroups", {
                displayMode: "{/homePageGroupDisplay}",
                afterRendering: fGroupsContainerAfterRenderingHandler
            });

            this.zipPromiseAll(
                ["launchpadService", ""],
                [sap.ushell.Container.getServiceAsync("LaunchPage"), that.loadCardModuleIfNeeded()]
            ).then(function (oRes) {
                this.isLinkPersonalizationSupported = oRes.launchpadService.isLinkPersonalizationSupported();

                this.oGroupsContainer.bindAggregation("groups", {
                    filters: filters,
                    path: "/groups",
                    factory: function () {
                        return that._createTileContainer(oController, oModel);
                    }
                });
            }.bind(this));

            if (Device.system.desktop) {
                this.oGroupsContainer.addEventDelegate({
                    onBeforeFastNavigationFocus: function (oEvent) {
                        oEvent.preventDefault();
                        sap.ui.require(["sap/ushell/components/ComponentKeysHandler"], function (ComponentKeysHandler) {
                            ComponentKeysHandler.getInstance().then(function (ComponentKeysHandlerInstance) {
                                ComponentKeysHandlerInstance.goToLastVisitedTile();
                            }.bind(this));
                        }.bind(this));
                    },
                    onsaptabnext: function (oEvent) {
                        if (jQuery("#sapUshellFloatingContainerWrapper").is(":visible") && (oEvent.originalEvent.srcElement.id) !== "") {
                            oEvent.preventDefault();
                            sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsAccessible");
                        }
                    }
                });
            }
            return this.oGroupsContainer;
        },

        getAllGroupsFromModel: function () {
            return this.oModel.getProperty("/groups");
        },

        _createTileContainer: function (oController/*, oModel*/) {
            var that = this,
                oFilter = new Filter("isTileIntentSupported", FilterOperator.EQ, true),
                oTilesContainer = new TileContainer({
                    headerText: "{title}",
                    showEmptyLinksArea: {
                        parts: ["/tileActionModeActive", "links/length", "isGroupLocked", "/isInDrag", "/homePageGroupDisplay"],
                        formatter: function (tileActionModeActive, numOfLinks, isGroupLocked, bIsInDrag, sAnchorbarMode) {
                            if (numOfLinks) {
                                return true;
                            } else if (isGroupLocked) {
                                return false;
                            }
                            return tileActionModeActive || bIsInDrag && sAnchorbarMode === "tabs";
                        }
                    },
                    showMobileActions: {
                        parts: ["/tileActionModeActive"],
                        formatter: function (bIsActionModeActive) {
                            return bIsActionModeActive && !this.getDefaultGroup();
                        }
                    },
                    showIcon: {
                        parts: ["/isInDrag", "/tileActionModeActive"],
                        formatter: function (bIsInDrag, bIsActionModeActive) {
                            return (this.getIsGroupLocked() && (bIsInDrag || bIsActionModeActive));
                        }
                    },
                    deluminate: {
                        parts: ["/isInDrag"],
                        formatter: function (bIsInDrag) {
                            //  return oEvent.oSource.getIsGroupLocked() && bIsInDrag;
                            return this.getIsGroupLocked() && bIsInDrag;
                        }
                    },
                    transformationError: {
                        parts: ["/isInDrag", "/draggedTileLinkPersonalizationSupported"],
                        formatter: function (bIsInDrag, bDraggedTileLinkPersonalizationSupported) {
                            return bIsInDrag && !bDraggedTileLinkPersonalizationSupported;
                        }
                    },
                    showBackground: "{/tileActionModeActive}",
                    tooltip: "{title}",
                    tileActionModeActive: "{/tileActionModeActive}",
                    enableHelp: Config.last("/core/extension/enableHelp"),
                    groupId: "{groupId}",
                    defaultGroup: "{isDefaultGroup}",
                    isLastGroup: "{isLastGroup}",
                    isGroupLocked: "{isGroupLocked}",
                    isGroupSelected: "{isGroupSelected}",
                    showHeader: true,
                    showGroupHeader: "{showGroupHeader}",
                    homePageGroupDisplay: "{/homePageGroupDisplay}",
                    editMode: "{editMode}",
                    supportLinkPersonalization: this.isLinkPersonalizationSupported,
                    titleChange: function (oEvent) {
                        sap.ui.getCore().getEventBus().publish("launchpad", "changeGroupTitle", {
                            groupId: oEvent.getSource().getGroupId(),
                            newTitle: oEvent.getParameter("newTitle")
                        });
                    },
                    showEmptyLinksAreaPlaceHolder: {
                        parts: ["links/length", "/isInDrag", "/homePageGroupDisplay"],
                        formatter: function (numOfLinks, bIsInDrag, sAnchorbarMode) {
                            return bIsInDrag && sAnchorbarMode === "tabs" && !numOfLinks;
                        }
                    },
                    showPlaceholder: {
                        parts: ["/tileActionModeActive", "tiles/length"],
                        formatter: function (tileActionModeActive) {
                            return tileActionModeActive && !this.getIsGroupLocked();
                        }
                    },
                    visible: {
                        parts: ["/tileActionModeActive", "isGroupVisible", "visibilityModes"],
                        formatter: function (tileActionModeActive, isGroupVisible, visibilityModes) {
                            // Empty groups should not be displayed when personalization is off or
                            // if they are locked or default group not in action mode
                            if (!visibilityModes[tileActionModeActive ? 1 : 0]) {
                                return false;
                            }
                            return isGroupVisible || tileActionModeActive;
                        }
                    },
                    hidden: {
                        parts: ["/tileActionModeActive", "isGroupVisible"],
                        formatter: function (bIsActionModeActive, bIsGroupVisible) {
                            return bIsActionModeActive && !bIsGroupVisible;
                        }
                    },
                    links: this._getLinkTemplate(),
                    tiles: {
                        path: "tiles",
                        factory: this._itemFactory.bind(this),
                        filters: [oFilter]
                    },
                    add: /*oController._addTileContainer,*/ function (oEvent) {
                        that._handleAddTileToGroup(oEvent);
                    }
                });
            return oTilesContainer;
        },

        _getLinkTemplate: function () {
            var oFilter = new Filter("isTileIntentSupported", FilterOperator.EQ, true);

            if (!this.isLinkPersonalizationSupported) {
                return {
                    path: "links",
                    templateShareable: true,
                    template: new LinkTileWrapper({
                        uuid: "{uuid}",
                        tileCatalogId: "{tileCatalogId}",
                        target: "{target}",
                        isLocked: "{isLocked}",
                        tileActionModeActive: "{/tileActionModeActive}",
                        debugInfo: "{debugInfo}",
                        tileViews: {
                            path: "content",
                            factory: function (sId, oContext) {
                                return oContext.getObject();
                            }
                        },
                        afterRendering: function (oEvent) {
                            var jqHrefElement = jQuery(this.getDomRef().getElementsByTagName("a"));
                            // Remove tabindex from links
                            //  so that the focus will not be automatically set on the focusable link when returning to the launchpad
                            jqHrefElement.attr("tabindex", -1);
                        }
                    }),
                    filters: [oFilter]
                };
            }
            return {
                path: "links",
                factory: function (sId, oContext) {
                    var oControl = oContext.getObject().content[0];
                    if (oControl && oControl.bIsDestroyed) {
                        oControl = oControl.clone();
                        oContext.getModel().setProperty(oContext.getPath() + "/content/0", oControl);
                    }
                    return oControl;
                },
                filters: [oFilter]
            };
        },
_createCard: function (oManifest) {
    return new this.Card({
        manifest: oManifest
    });
},
        _itemFactory: function (sId, oContext) {
            var oTileOrCard = oContext.getProperty(oContext.sPath),
                aContent,
                oContent,
                oControl,
                oManifest;

            if (oTileOrCard) {
                if (oTileOrCard.isCard) {
                    aContent = oTileOrCard && oTileOrCard.content;
                    oContent = aContent && aContent.length && aContent[0];
                    if (oContent && oContent["sap.card"]) {
                        oManifest = oContent;
                    } else if (oTileOrCard.manifest) {
                        // Placeholder manifest for blind loading
                        oManifest = {
                            "sap.flp": oTileOrCard.manifest && oTileOrCard.manifest["sap.flp"],
                            "sap.card": { type: "List" }
                        };
                    } else {
                        return this._createErrorTile();
                    }
                    oControl = this._createCard(oManifest);
                } else {
                    oControl = this._createTile();
                }
                oTileOrCard.controlId = oControl && oControl.getId && oControl.getId();
            }
            return oControl;
        },

        /**
         * Creates a generic error tile. It will be displayed with a generic "Cannot load tile" subheader.
         *
         * @returns {sap.ushell.ui.launchpad.Tile} The Launchpad Tile containing a GenericTile in error mode
         *
         * @private
         */
        _createErrorTile: function () {
            return new LaunchpadTile({
                tileViews: {
                    path: "content",
                    factory: function () {
                        return new GenericTile({
                            state: "Failed"
                        });
                    }
                }
            });
        },

        _createTile: function () {
            var oTile = new LaunchpadTile({
                long: "{long}",
                // The model flag draggedInTabBarToSourceGroup was set for the tile in when it was dragged on TabBar between groups
                isDraggedInTabBarToSourceGroup: "{draggedInTabBarToSourceGroup}",
                uuid: "{uuid}",
                tileCatalogId: "{tileCatalogId}",
                isCustomTile: "{isCustomTile}",
                target: "{target}",
                isLocked: "{isLocked}",
                navigationMode: "{navigationMode}",
                tileActionModeActive: "{/tileActionModeActive}",
                showActionsIcon: "{showActionsIcon}",
                rgba: "{rgba}",
                debugInfo: "{debugInfo}",
                tileViews: {
                    path: "content",
                    factory: function (sId, oContext) {
                        return oContext.getObject();
                    }
                },
                coverDivPress: function (oEvent) {
                    // if this tile had just been moved and the move itself did not finish refreshing the tile's view
                    // we do not open the actions menu to avoid inconsistencies
                    if (!oEvent.oSource.getBindingContext().getObject().tileIsBeingMoved && sap.ushell.components.homepage.ActionMode) {
                        sap.ushell.components.homepage.ActionMode._openActionsMenu(oEvent);
                    }
                },
                showActions: function (oEvent) {
                    if (sap.ushell.components.homepage.ActionMode) {
                        sap.ushell.components.homepage.ActionMode._openActionsMenu(oEvent);
                    }
                },
                deletePress: [this.oController._dashboardDeleteTileHandler, this.oController],
                press: [this.oController.dashboardTilePress, this.oController]
            });
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            oTile.addEventDelegate({
                onclick: function (/*oEvent*/) {
                    Measurement.start("FLP:DashboardGroupsBox.onclick", "Click on tile", "FLP");
                    Measurement.start("FLP:OpenApplicationonClick", "Open Application", "FLP");
                    function endTileMeasurement () {
                        Measurement.end("FLP:DashboardGroupsBox.onclick");
                        oViewPortContainer.detachAfterNavigate(endTileMeasurement);
                    }
                    oViewPortContainer.attachAfterNavigate(endTileMeasurement);
                }
            });
            return oTile;
        },

        _updateGroupHeaderVisibility: function () {
            var aGroups = this.oGroupsContainer.getGroups(),
                bEditMode = this.oModel.getProperty("/tileActionModeActive"),
                bAnchorbar = this.oController.getView().oPage.getShowHeader(),
                iFirstVisible,
                iVisibleGroups = 0;

            for (var i = 0; i < aGroups.length; i++) {
                if (aGroups[i].getProperty("visible")) {
                    iVisibleGroups++;

                    if (iFirstVisible === undefined) {
                        iFirstVisible = i;
                    } else {
                        aGroups[i].setShowGroupHeader(true);
                    }
                }
            }

            if (iFirstVisible !== undefined) {
                var bVisible = bEditMode || (iVisibleGroups === 1 && !bAnchorbar);
                aGroups[iFirstVisible].setShowGroupHeader(bVisible);
            }
        },

        _handleActionModeChange: function () {
            var bActiveMode = this.oModel.getProperty("/tileActionModeActive");
            if (bActiveMode) {
                this._addTileContainersContent();
            } else {
                // in order to set groups again to their right position after closing edit mode, we will need to re-render
                // the groups layout. We need it for the Locked Groups Compact Layout feature
                Layout.reRenderGroupsLayout(null);
            }
        },

        _addTileContainersContent: function () {
            var aGroups = this.oGroupsContainer.getGroups();
            for (var i = 0; i < aGroups.length; i++) {
                var oGroup = aGroups[i];

                if (!oGroup.getBeforeContent().length) {
                    oGroup.addBeforeContent(new Button({
                        icon: "sap-icon://add",
                        text: resources.i18n.getText("add_group_at"),
                        visible: "{= !${isGroupLocked} && !${isDefaultGroup} && ${/tileActionModeActive}}",
                        enabled: "{= !${/editTitle}}",
                        press: [this._handleAddGroupButtonPress.bind(this)]
                    }).addStyleClass("sapUshellAddGroupButton"));
                }

                if (!oGroup.getAfterContent().length) {
                    oGroup.addAfterContent(new Button({
                        icon: "sap-icon://add",
                        text: resources.i18n.getText("add_group_at"),
                        visible: "{= ${isLastGroup} && ${/tileActionModeActive}}",
                        enabled: "{= !${/editTitle}}",
                        press: [this._handleAddGroupButtonPress.bind(this)]
                    }).addStyleClass("sapUshellAddGroupButton"));
                }

                if (!oGroup.getHeaderActions().length) {
                    oGroup.addHeaderAction(new GroupHeaderActions({
                        content: this._getHeaderActions(),
                        tileActionModeActive: "{/tileActionModeActive}",
                        isOverflow: "{/isPhoneWidth}"
                    }).addStyleClass("sapUshellOverlayGroupActionPanel"));
                }
            }
        },

        _handleAddGroupButtonPress: function (oData) {
            this.oController._addGroupHandler(oData);
            this._addTileContainersContent();
        },

        _getHeaderActions: function () {
            var aHeaderButtons = [];

            aHeaderButtons.push(new Button({
                text: {
                    path: "isGroupVisible",
                    formatter: function (bIsGroupVisible) {
                        return resources.i18n.getText(bIsGroupVisible ? "HideGroupBtn" : "ShowGroupBtn");
                    }
                },
                icon: {
                    path: "isGroupVisible",
                    formatter: function (bIsGroupVisible) {
                        if (Device.system.phone) {
                            return bIsGroupVisible ? "sap-icon://hide" : "sap-icon://show";
                        }
                        return "";
                    }
                },
                visible: "{= ${/enableHideGroups} && !${isGroupLocked} && !${isDefaultGroup}}",
                enabled: "{= !${/editTitle}}",
                press: function (oEvent) {
                    var oSource = oEvent.getSource(),
                        oGroupBindingCtx = oSource.getBindingContext(),
                        oModel = oGroupBindingCtx.getModel(),
                        sPath = oGroupBindingCtx.getPath(),
                        bValue = oModel.getProperty(sPath + "/isGroupVisible");

                    // temporary work around until sap.m.Button announces a label change to the user.
                    var oMResources = sap.ui.getCore().getLibraryResourceBundle("sap.m");
                    this._oInvisibleMessageInstance.announce([
                        resources.i18n.getText(bValue ? "Group.nowBeingHidden" : "Group.nowBeingShown"),
                        resources.i18n.getText("Section.ButtonLabelChanged"),
                        resources.i18n.getText(bValue ? "ShowGroupBtn" : "HideGroupBtn"),
                        oMResources.getText("ACC_CTR_TYPE_BUTTON")
                    ].join(" "), InvisibleMessageMode.Polite);

                    this.oController._changeGroupVisibility(oGroupBindingCtx);
                }.bind(this)
            }).addStyleClass("sapUshellHeaderActionButton"));

            aHeaderButtons.push(new Button({
                text: {
                    path: "removable",
                    formatter: function (bIsRemovable) {
                        return resources.i18n.getText(bIsRemovable ? "DeleteGroupBtn" : "ResetGroupBtn");
                    }
                },
                icon: {
                    path: "removable",
                    formatter: function (bIsRemovable) {
                        if (Device.system.phone) {
                            return bIsRemovable ? "sap-icon://delete" : "sap-icon://refresh";
                        }
                        return "";
                    }
                },
                visible: "{= !${isDefaultGroup}}",
                enabled: "{= !${/editTitle}}",
                press: function (oEvent) {
                    var oSource = oEvent.getSource(),
                        oGroupBindingCtx = oSource.getBindingContext();
                    this.oController._handleGroupDeletion(oGroupBindingCtx);
                }.bind(this)
            }).addStyleClass("sapUshellHeaderActionButton"));

            return aHeaderButtons;
        },

        _handleAddTileToGroup: function (oEvent) {
            //Fix internal incident #1780370222 2017
            if (document.toDetail) {
                document.toDetail();
            }
            Component.getOwnerComponentFor(this.oController.getView().parentComponent).getRouter().navTo("appfinder", {
                "innerHash*": "catalog/" + JSON.stringify({
                    targetGroup: encodeURIComponent(oEvent.getSource().getBindingContext().sPath)
                })
            });
        },

        _hidePlusTile: function (plusTileDomRef) {
            if (plusTileDomRef) {
                plusTileDomRef.classList.add("sapUshellHidePlusTile");
            }
        },

        _showPlusTile: function (plusTileDomRef) {
            if (plusTileDomRef) {
                plusTileDomRef.classList.remove("sapUshellHidePlusTile");
            }
        }
    });

    return DashboardGroupsBox;
});
