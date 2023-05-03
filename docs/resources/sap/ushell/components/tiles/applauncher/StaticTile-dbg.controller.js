// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ushell/components/tiles/utils",
    "sap/ushell/components/applicationIntegration/AppLifeCycle",
    "sap/ushell/Config",
    "sap/ushell/utils/WindowUtils",
    "sap/m/library",
    "sap/ushell/library",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/ui/thirdparty/jquery",
    "sap/ushell/utils/UrlParsing"
], function (
    Controller,
    utils,
    AppLifeCycle,
    Config,
    WindowUtils,
    mobileLibrary,
    ushellLibrary,
    JSONModel,
    Log,
    jQuery,
    UrlParsing
) {
    "use strict";

    /* eslint-disable complexity */

    // shortcut for sap.m.GenericTileScope
    var GenericTileScope = mobileLibrary.GenericTileScope;

    var GenericTileMode = mobileLibrary.GenericTileMode;

    var AppType = ushellLibrary.AppType;

    /* global hasher */

    return Controller.extend("sap.ushell.components.tiles.applauncher.StaticTile", {
        _aDoableObject: {},

        onInit: function () {
            var oStaticTileView = this.getView(),
                oViewData = oStaticTileView.getViewData(),
                oTileApi = oViewData.chip, // instance specific CHIP API
                oConfig = utils.getAppLauncherConfig(oTileApi, oTileApi.configurationUi.isEnabled(), false),
                oModel,
                sKeywords,
                aKeywords,
                that = this,
                sNavigationTargetUrl = oConfig.navigation_target_url,
                sSystem,
                oHash;

            this.oShellModel = AppLifeCycle.getElementsModel();
            sSystem = oTileApi.url.getApplicationSystem();
            if (sSystem) { // propagate system to target application
                // when the navigation url is hash we want to make sure system parameter is in the parameters part
                if (UrlParsing.isIntentUrl(sNavigationTargetUrl)) {
                    oHash = UrlParsing.parseShellHash(sNavigationTargetUrl);
                    if (!oHash.params) {
                        oHash.params = {};
                    }
                    oHash.params["sap-system"] = sSystem;
                    sNavigationTargetUrl = "#" + UrlParsing.constructShellHash(oHash);
                } else {
                    sNavigationTargetUrl += ((sNavigationTargetUrl.indexOf("?") < 0) ? "?" : "&")
                        + "sap-system=" + sSystem;
                }
            } this.navigationTargetUrl = sNavigationTargetUrl;
            /*
            * Model of the applauncher tile consisting of config (tile configuration), nav (target URL set to '' in case of Admin UI), and search (highlight terms)
            */
            oModel = new JSONModel({
                sizeBehavior: Config.last("/core/home/sizeBehavior"),
                wrappingType: Config.last("/core/home/wrappingType"),
                mode: oConfig.display_mode,
                config: oConfig,
                nav: { navigation_target_url: (oTileApi.configurationUi && oTileApi.configurationUi.isEnabled() ? "" : sNavigationTargetUrl) },
                search: {
                    display_highlight_terms: []
                }
            });
            oStaticTileView.setModel(oModel);
            // listen for changes of the size behavior, as the end user can change it in the settings,(if enabled)
            this._aDoableObject = Config.on("/core/home/sizeBehavior").do(function (sSizeBehavior) {
                oModel.setProperty("/sizeBehavior", sSizeBehavior);
            });

            // implement types contact
            // default is Tile
            if (oTileApi.types) {
                oTileApi.types.attachSetType(function (sType) {
                    if (that.tileType !== sType) {
                        if (sType === "link") {
                            oModel.setProperty("/mode", GenericTileMode.LineMode);
                        } else {
                            oModel.setProperty("/mode", oModel.getProperty("/config/display_mode"));
                        }
                        that.tileType = sType;
                    }
                });
            }

            if (!this.tileType) {
                this.tileType = "tile";
            }

            // implement search contract
            if (oTileApi.search) {
                // split and clean keyword string (may be comma + space delimited)
                sKeywords = oStaticTileView.getModel().getProperty("/config/display_search_keywords");
                aKeywords = sKeywords
                    .split(/[, ]+/)
                    .filter(function (n) { return n && n !== ""; });

                // add title and subtitle (if present) to keywords for better FLP searching
                if (oConfig.display_title_text && oConfig.display_title_text !== "" &&
                    aKeywords.indexOf(oConfig.display_title_text) === -1) {
                    aKeywords.push(oConfig.display_title_text);
                }
                if (oConfig.display_subtitle_text && oConfig.display_subtitle_text !== "" &&
                    aKeywords.indexOf(oConfig.display_subtitle_text) === -1) {
                    aKeywords.push(oConfig.display_subtitle_text);
                }
                if (oConfig.display_info_text && oConfig.display_info_text !== "" &&
                    aKeywords.indexOf(oConfig.display_info_text) === -1) {
                    aKeywords.push(oConfig.display_info_text);
                }

                // defined in search contract:
                oTileApi.search.setKeywords(aKeywords);
                oTileApi.search.attachHighlight(
                    function (aHighlightWords) {
                        oStaticTileView.getModel().setProperty("/search/display_highlight_terms", aHighlightWords);
                    }
                );
            }

            // implement bag update handler
            if (oTileApi.bag && oTileApi.bag.attachBagsUpdated) {
                // is only called by the FLP for bookmark tiles which have been updated via bookmark service
                oTileApi.bag.attachBagsUpdated(function (aUpdatedBagIds) {
                    if (aUpdatedBagIds.indexOf("tileProperties") > -1) {
                        utils._updateTilePropertiesTexts(oStaticTileView, oTileApi.bag.getBag("tileProperties"));
                    }
                });
            }

            // implement configuration update handler
            if (oTileApi.configuration && oTileApi.configuration.attachConfigurationUpdated) {
                // is only called by the FLP for bookmark tiles which have been updated via bookmark service
                oTileApi.configuration.attachConfigurationUpdated(function (aUpdatedConfigKeys) {
                    if (aUpdatedConfigKeys.indexOf("tileConfiguration") > -1) {
                        utils._updateTileConfiguration(oStaticTileView, oTileApi.configuration.getParameterValueAsString("tileConfiguration"));
                    }
                });
            }

            // implement preview contract
            if (oTileApi.preview) {
                oTileApi.preview.setTargetUrl(sNavigationTargetUrl);
                oTileApi.preview.setPreviewIcon(oConfig.display_icon_url);
                oTileApi.preview.setPreviewTitle(oConfig.display_title_text);
                if (oTileApi.preview.setPreviewSubtitle && typeof oTileApi.preview.setPreviewSubtitle === "function") {
                    oTileApi.preview.setPreviewSubtitle(oConfig.display_subtitle_text);
                }
            }// implement configurationUi contract: setup configuration UI
            if (oTileApi.configurationUi.isEnabled()) {
                oTileApi.configurationUi.setAsyncUiProvider(function () {
                    return utils.getConfigurationUi(
                        oStaticTileView,
                        "sap.ushell.components.tiles.applauncher.Configuration"
                    ).then(function (oConfigurationUi) {
                        oTileApi.configurationUi.attachCancel(that.onCancelConfiguration.bind(null, oConfigurationUi));
                        oTileApi.configurationUi.attachSave(that.onSaveConfiguration.bind(null, oConfigurationUi));
                        return oConfigurationUi;
                    });

                });

                this.getView().getContent()[0].setTooltip(
                    utils.getResourceBundleModel().getResourceBundle()
                        .getText("edit_configuration.tooltip")
                );
            }

            // attach the tile actions provider for the actions contract
            if (oTileApi.actions) {
                var aActions = oConfig.actions, aExtendedActions;
                if (aActions) {
                    aExtendedActions = aActions.slice();
                } else {
                    aExtendedActions = [];
                }

                if (Config.last("/core/shell/enablePersonalization")) {
                    var sType = oModel.getProperty("/mode") === GenericTileMode.LineMode ? "link" : "tile",
                    tileSettingsAction = utils.getTileSettingsAction(oModel, this.onSaveRuntimeSettings.bind(this), sType);
                    aExtendedActions.push(tileSettingsAction);
                }

                oTileApi.actions.setActionsProvider(function () {
                    return aExtendedActions;
                });
            }
        },

        onExit: function () {
            this._aDoableObject.off();
        },

        // trigger to show the configuration UI if the tile is pressed in Admin mode
        onPress: function (oEvent) {
            var oStaticTileView = this.getView(),
                oViewData = oStaticTileView.getViewData(),
                oTileApi = oViewData.chip,
                oTileConfig = oStaticTileView.getModel().getProperty("/config");

            //scope is property of generic tile. It's default value is "Display"
            if (oEvent.getSource().getScope && oEvent.getSource().getScope() === GenericTileScope.Display) {
                if (oTileApi.configurationUi.isEnabled()) {
                    oTileApi.configurationUi.display();
                } else if (this.navigationTargetUrl) {
                    if (this.navigationTargetUrl[0] === "#") {
                        hasher.setHash(this.navigationTargetUrl);
                    } else {
                        var bLogRecentActivity = Config.last("/core/shell/enableRecentActivity") && Config.last("/core/shell/enableRecentActivityLogging");
                        if (bLogRecentActivity) {
                            var oRecentEntry = {
                                title: oTileConfig.display_title_text,
                                appType: AppType.URL,
                                url: oTileConfig.navigation_target_url,
                                appId: oTileConfig.navigation_target_url
                            };
                            sap.ushell.Container.getRenderer("fiori2").logRecentActivity(oRecentEntry);
                        }

                        WindowUtils.openURL(this.navigationTargetUrl, "_blank");
                    }
                }
            }
        },

        // tile settings action UI save handler
        onSaveRuntimeSettings: function (oSettingsView) {
            var oViewModel = oSettingsView.getModel(),
                oTileApi = this.getView().getViewData().chip,
                oConfigToSave = this.getView().getModel().getProperty("/config");

            oConfigToSave.display_title_text = oViewModel.getProperty("/title") || "";
            oConfigToSave.display_subtitle_text = oViewModel.getProperty("/subtitle") || "";
            oConfigToSave.display_info_text = oViewModel.getProperty("/info") || "";
            oConfigToSave.display_search_keywords = oViewModel.getProperty("/keywords") || "";

            // use bag contract in order to store translatable properties
            var tilePropertiesBag = oTileApi.bag.getBag("tileProperties");
            tilePropertiesBag.setText("display_title_text", oConfigToSave.display_title_text);
            tilePropertiesBag.setText("display_subtitle_text", oConfigToSave.display_subtitle_text);
            tilePropertiesBag.setText("display_info_text", oConfigToSave.display_info_text);
            tilePropertiesBag.setText("display_search_keywords", oConfigToSave.display_search_keywords);

            function logErrorAndReject (oError) {
                Log.error(oError, null, "sap.ushell.components.tiles.applauncher.StaticTile.controller");
            }

            // saving the relevant properteis
            tilePropertiesBag.save(
                // success handler
                function () {
                    Log.debug("property bag 'tileProperties' saved successfully");

                    // update tile's model
                    this.getView().getModel().setProperty("/config/display_title_text", oConfigToSave.display_title_text);
                    this.getView().getModel().setProperty("/config/display_subtitle_text", oConfigToSave.display_subtitle_text);
                    this.getView().getModel().setProperty("/config/display_info_text", oConfigToSave.display_info_text);
                    this.getView().getModel().setProperty("/config/display_search_keywords", oConfigToSave.display_search_keywords);

                    // call to refresh model which (due to the binding) will refresh the tile
                    this.getView().getModel().refresh();
                }.bind(this),
                logErrorAndReject // error handler
            );
        },

        // configuration save handler
        onSaveConfiguration: function (oConfigurationView) {
            // the deferred object required from the configurationUi contract
            var oDeferred = new jQuery.Deferred();
            var oModel = oConfigurationView.getModel();
            // tile model placed into configuration model by getConfigurationUi
            var oTileModel = oModel.getProperty("/tileModel");
            var oTileApi = oConfigurationView.getViewData().chip;
            var aTileNavigationActions = utils.tileActionsRows2TileActionsArray(oModel.getProperty("/config/tile_actions_rows"));
            // get the configuration to save from the model
            var configToSave = {
                display_icon_url: oModel.getProperty("/config/display_icon_url"),
                navigation_use_semantic_object: oModel.getProperty("/config/navigation_use_semantic_object"),
                navigation_target_url: oModel.getProperty("/config/navigation_target_url"),
                navigation_semantic_object: jQuery.trim(oModel.getProperty("/config/navigation_semantic_object")) || "",
                navigation_semantic_action: jQuery.trim(oModel.getProperty("/config/navigation_semantic_action")) || "",
                navigation_semantic_parameters: jQuery.trim(oModel.getProperty("/config/navigation_semantic_parameters")),
                display_search_keywords: oModel.getProperty("/config/display_search_keywords")
            };

            //If the input fields icon, semantic object and action are failing the input validations, then through an error message requesting the user to enter/correct those fields
            var bReject = utils.checkInputOnSaveConfig(oConfigurationView);
            if (!bReject) {
                bReject = utils.checkTileActions(oConfigurationView);
            }
            if (bReject) {
                oDeferred.reject("mandatory_fields_missing");
                return oDeferred.promise();
            }
            // overwrite target URL in case of semantic object navigation
            if (configToSave.navigation_use_semantic_object) {
                configToSave.navigation_target_url = utils.getSemanticNavigationUrl(configToSave);
                oModel.setProperty("/config/navigation_target_url", configToSave.navigation_target_url);
            }

            // use bag in order to store translatable properties
            var tilePropertiesBag = oTileApi.bag.getBag("tileProperties");
            tilePropertiesBag.setText("display_title_text", oModel.getProperty("/config/display_title_text"));
            tilePropertiesBag.setText("display_subtitle_text", oModel.getProperty("/config/display_subtitle_text"));
            tilePropertiesBag.setText("display_info_text", oModel.getProperty("/config/display_info_text"));
            tilePropertiesBag.setText("display_search_keywords", configToSave.display_search_keywords);

            var tileNavigationActionsBag = oTileApi.bag.getBag("tileNavigationActions");
            //forward populating of tile navigation actions array into the bag, to Utils
            utils.populateTileNavigationActionsBag(tileNavigationActionsBag, aTileNavigationActions);

            function logErrorAndReject (oError, oErrorInfo) {
                Log.error(oError, null, "sap.ushell.components.tiles.applauncher.StaticTile.controller");
                oDeferred.reject(oError, oErrorInfo);
            }

            // use configuration contract to write parameter values
            oTileApi.writeConfiguration.setParameterValues(
                { tileConfiguration: JSON.stringify(configToSave) },
                // success handler
                function () {
                    var oConfigurationConfig = utils.getAppLauncherConfig(oTileApi, false, false),
                        oTileConfig = utils.getAppLauncherConfig(oTileApi, true, false),
                        // switching the model under the tile -> keep the tile model
                        oModel = new JSONModel({
                            config: oConfigurationConfig,
                            // set empty target url in configuration mode
                            nav: { navigation_target_url: "" },
                            // keep tile model
                            tileModel: oTileModel
                        });
                    oConfigurationView.setModel(oModel);
                    // update tile model
                    oTileModel.setData({ config: oTileConfig, nav: { navigation_target_url: "" } }, false);

                    // update tile model
                    if (oTileApi.preview) {
                        oTileApi.preview.setTargetUrl(oConfigurationConfig.navigation_target_url);
                        oTileApi.preview.setPreviewIcon(oConfigurationConfig.display_icon_url);
                        oTileApi.preview.setPreviewTitle(oConfigurationConfig.display_title_text);
                        if (oTileApi.preview.setPreviewSubtitle && typeof oTileApi.preview.setPreviewSubtitle === "function") {
                            oTileApi.preview.setPreviewSubtitle(oConfigurationConfig.display_subtitle_text);
                        }
                    }
                    tilePropertiesBag.save(
                        // success handler
                        function () {
                            Log.debug("property bag 'tileProperties' saved successfully");
                            // update possibly changed values via contracts
                            if (oTileApi.title) {
                                oTileApi.title.setTitle(
                                    oConfigurationConfig.display_title_text,
                                    // success handler
                                    function () {
                                        oDeferred.resolve();
                                    },
                                    logErrorAndReject // error handler
                                );
                            } else {
                                oDeferred.resolve();
                            }
                        },
                        logErrorAndReject // error handler
                    );

                    tileNavigationActionsBag.save(
                        // success handler
                        function () {
                            Log.debug("property bag 'navigationProperties' saved successfully");
                        },
                        logErrorAndReject // error handler
                    );
                },
                logErrorAndReject // error handler
            );
            oConfigurationView.destroy();
            return oDeferred.promise();
        },

        // configuration cancel handler
        onCancelConfiguration: function (oConfigurationView) {
            // re-load old configuration and display
            var oViewData = oConfigurationView.getViewData(),
                oModel = oConfigurationView.getModel(),
                // tile model placed into configuration model by getConfigurationUi
                oTileModel = oModel.getProperty("/tileModel"),
                oTileApi = oViewData.chip,

                oCurrentConfig = utils.getAppLauncherConfig(oTileApi, oTileApi.configurationUi.isEnabled(), false);

            oConfigurationView.getModel().setData({
                config: oCurrentConfig,
                // set empty target url in configuration mode
                nav: { navigation_target_url: "" },
                tileModel: oTileModel
            }, false);

            oConfigurationView.destroy();
        },

        formatters: {
            leanURL: WindowUtils.getLeanURL.bind(WindowUtils)
        }
    });
}, /* bExport= */ false);
