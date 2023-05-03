/*global sap,Promise*/
sap.ui.define(["sap/ui/base/ManagedObject",
    "sap/ui/generic/app/transaction/DraftContext",
    "sap/m/MessageToast",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/extend",
	"sap/base/util/each"
], function (ManagedObject, DraftContext, MessageToast, FeLogger, extend, each) {
    "use strict";

	var oLogger = new FeLogger("js.QuickTemplates.QuickCreateAPI").getLogger();

    var QuickCreateAPI = ManagedObject.extend("sap.suite.ui.generic.template.js.QuickTemplates.QuickCreateAPI", {

        metadata : {
            library : "sap.suite.ui.generic.template",
            properties : {

            },
            events:
            {
                objectCreated:
                {
                    parameters:
                    {
                        context: { type : "sap.ui.model.Context"}
                    }
                },

                destroyed:
                {
                    parameters:
                    {
                        collectionItemGuid: { type : "String"}
                    }
                },

                autofillLineItems:
                {
                    parameters:
                    {
                        numberOfLineItems: { type : "Number" }
                    }
                }

            }
        }
    });

    QuickCreateAPI.EVENT_CONSTANTS = {
        EventChannel : "sap.fiori.cp.quickactions.EventChannel",
        QUICKCREATE_LINE_ITEMS_FOUND : "LineItemsFound",
        QUICKCREATE_VIEW_CREATED: "QuickCreateViewCreated"
    };

    var ACCESS_COLL_CONSTANTS_ITEMS = "items",
        ACCESS_COLL_CONSTANTS_PARTICIPANTS = "participants";

    QuickCreateAPI.CopilotModelName = "FioriCopilotODataModel";

    QuickCreateAPI._Instances = {};

    QuickCreateAPI.getInstance = function(oCollItem) {

        if (!oCollItem) {
            return undefined;
        }

        if (oCollItem.copilotEntity) {
            return QuickCreateAPI._Instances[oCollItem.copilotEntity.getODataKey()];
        } else {
            return QuickCreateAPI._Instances[oCollItem];
        }

    };

    QuickCreateAPI.createAPI = function(oComponentContainer, oComponentInstance, oCopilotController) {

        function getCollectionItem() {
            return oCopilotController.getView().getBindingContext().getObject();
        }

        function getQuickCreateItem() {
            return oCopilotController.getQuickCreateItem();
        }


        function getComponentInstance() {
            return oComponentInstance;
        }

        function getComponentContainer() {
            return oComponentContainer;
        }

        function getCopilotModel() {
            return sap.ui.getCore().getModel(QuickCreateAPI.CopilotModelName);
        }

        function updateDraftID(draftid) {
            if (this._bDestroyed) {
                return;
            }
            var qcObject = this.getQuickCreateItem();

            if (qcObject.draftid === draftid) {
                return;
            }
            qcObject.draftid = draftid;

            qcObject.copilotEntity.update(qcObject, {

              error: function (oError) {
				       oLogger.error(oError);
                     }

            });
        }


        function getRootControl() {
            return oComponentInstance.getAggregation("rootControl");
        }

        function getRootView() {
            return this.oRootView;
        }

        function setRootView(view) {
          this.oRootView = view;
          this.calculateViewHeight(this.oRootView, true);
        }

        function isDraftEnabled() {

            if (this.oRootView && this.oRootView.getController() && this.oRootView.getController().bDraftEnabled !== undefined) {
                return this.oRootView.getController().bDraftEnabled;
            }

            if (!this.oRootView || !this.oRootView.getBindingContext()) {
                return undefined;
            }


            var draftContext = new DraftContext(this.getQuickCreateModel());
            return draftContext.hasDraft(this.oRootView.getBindingContext());
        }

        function getQuickCreateModel() {
            var oModel = this.getComponentInstance().getModel();
            if (!oModel && this.oRootView) {
                oModel = this.oRootView.getModel();
            }

            return oModel;
        }

        function isCurrentUserCreator() {
            return oCopilotController.isCurrentUserCreator();
        }


        function getQuickCreateRootBindingContext() {
            if (!this.oRootView) {
                return undefined;
            }

            return this.oRootView.getBindingContext();
        }


        function getQuickCreateRootEntityType() {
            var context = this.getQuickCreateRootBindingContext();
            if (context && context.getObject()) {
                return context.getObject().__metadata.type;
            }

            return undefined;
        }

        function _onLineItemsFound(sChannel, sEventName, oParameters) {
            var numberLineItems = oParameters.numberOfLineItems;
            if (numberLineItems <= 0) {
                return;
            }

            this.fireAutofillLineItems({numberOfLineItems: numberLineItems});
        }

        function _onComponentContainerAfterRendering () {
            this._attachToModelBindingChanges();
            if (!this.oRootView) {
                var oView = oCopilotController.oViewUtils.findFirstViewFromControlHierarchy(this.getRootControl());
                if (oView) {
                    this.setRootView(oView);
                }
            }
        }

        function _attachToModelBindingChanges() {
          if (!this._bBindingChangeAttached) {
            var oModel = oComponentInstance.getModel();
            if (oModel) {
              var origAddBinding = oModel.addBinding.bind(oModel);
              var that = this;
              oModel.addBinding = function(binding) {
                origAddBinding(binding);
                binding.attachEvent("change", that._onDataBindingChanged);
              };
              this._bBindingChangeAttached = true;
            }
          }
        }

        function loadQuickCreateModelFromJSON() {

            return new Promise(function(resolve, reject) {

                var oDataModel = this.getCopilotModel();

                oDataModel.read("/" + oDataModel.getKey(this.getQuickCreateItem()), {
                    success: function (oData, oResponse) {
                        if (oData.modeljson) {
                            var oModel = this.getQuickCreateModel();
                            this._loadingJSON = true;
                            if (this.isDraftEnabled()) {
                                oModel.oData = JSON.parse(oData.modeljson);
                            } else {
                                var oModelState = JSON.parse(oData.modeljson);
                                oModel.mChangedEntities = oModelState.mChangedEntities;
                                oModel.mChangeHandles = oModelState.mChangeHandles;
                                oModel.mDeferredRequests = oModelState.mDeferredRequests;
                                oModel.oData = oModelState.oData;
                            }
                            oModel.updateBindings();
                        }
                        if (resolve) {
                            resolve();
                        }
                        delete this._loadingJSON;
                    }.bind(this),
                    error: function (oError) {

                        if (reject) {
                            reject(oError);
                        }

                    }
                });

            }.bind(this));
        }



        function _onDataBindingChanged() {
            if (!this._oUpdateModelJSONTimer) {
                this._oUpdateModelJSONTimer = setTimeout(this._updateModelJSON, 2000);
            }
        }



        function _updateModelJSON() {
            if (this._loadingJSON || this._bDestroyed || !this.isCurrentUserCreator()) {
                return;
            }

            this._oUpdateModelJSONTimer = null;

            var qcObject = this.getQuickCreateItem();

            var oModel = this.getQuickCreateModel();

            var newJSON = "";

            if (this.isDraftEnabled()) {
                var oEntities = {};

                var changedKeys = Object.keys(oModel.mChangedEntities);
                var keys = Object.keys(oModel.oData);
                var mergedEntity = {};
                each(keys, function(i, key) {

                    if (oModel.mChangedEntities[key]) {
                        mergedEntity = {};
                        extend(mergedEntity, oModel.oData[key]);
                        extend(mergedEntity, oModel.mChangedEntities[key]);
                        oEntities[key] = mergedEntity;
                    } else {
                        oEntities[key] = oModel.oData[key];
                    }

                });

                each(changedKeys, function(i, key) {
                    if (!oEntities[key]) {
                        oEntities[key] = oModel.mChangedEntities[key];
                    }
                });

                newJSON = JSON.stringify(oEntities);
            } else {
                var oModelState = {};

                oModelState.mChangedEntities = oModel.mChangedEntities;
                oModelState.mChangeHandles = oModel.mChangeHandles;
                oModelState.mDeferredRequests = oModel.mDeferredRequests;
                oModelState.oData = oModel.oData;

                newJSON = JSON.stringify(oModelState);
            }

            if (newJSON === qcObject.modeljson) {
                return;
            }


            qcObject.modeljson = newJSON;

            qcObject.copilotEntity.update(qcObject, {

              error: function (oError) {
				        oLogger.error(oError);
                     }

            });
        }

        function discardQuickCreateDraft() {

            return new Promise(function(resolve, reject) {

                var oModel = this.getQuickCreateModel();

                if (this.oRootView && this.oRootView.getBindingContext()) {

                    if (this.isDraftEnabled()) {

                        oModel.remove(this.oRootView.getBindingContext().getPath(), {

                            success: function () {
                                MessageToast.show("Draft has been discarded");
                                resolve();
                            },

                            error: function (oError) {
                                reject(oError);
                            }

                        });
                    } else {
                        oModel.resetChanges();
                        resolve();
                    }
                } else {
                    resolve();
                }

            }.bind(this));
        }


        function calculateViewHeight(oView, bIncrease) {
            if (oView) {
                oCopilotController.calculateViewHeight(oView, bIncrease);
            }
        }

        function setComponentContainerHeight(height) {
            oCopilotController.setComponentContainerHeight(height);
        }

        function objectCreated(oContext) {
            if (this._bDestroyed) {
                return;
            }
            this.fireObjectCreated({context: oContext});
        }

        function fireQuickCreateViewCreated() {
          // fire embedded view created event
          sap.ui.getCore().getEventBus().publish(
              QuickCreateAPI.EVENT_CONSTANTS.EventChannel,
              QuickCreateAPI.EVENT_CONSTANTS.QUICKCREATE_VIEW_CREATED,
              {
                  api: this
              }
          );
        }

        function destroy() {
            if (this._bDestroyed) {
                return;
            }
            if (this._oUpdateModelJSONTimer) {
                clearTimeout(this._oUpdateModelJSONTimer);
                this._oUpdateModelJSONTimer = null;
            }
            delete QuickCreateAPI._Instances[this._InstanceKey];
            if (oComponentContainer && !oComponentContainer._bIsBeingDestroyed && !oComponentContainer.bIsDestroyed) {
                oComponentContainer.destroy();
            }

            this.oRootView = undefined;

            // subscribe to line items found on quick create
            sap.ui.getCore().getEventBus().unsubscribe(
                QuickCreateAPI.EVENT_CONSTANTS.EventChannel,
                QuickCreateAPI.EVENT_CONSTANTS.QUICKCREATE_LINE_ITEMS_FOUND,
                this._onLineItemsFound,
                this);

            this.fireDestroyed({collectionItemGuid: this._InstanceKey});

            ManagedObject.prototype.destroy.call(this);

            this._bDestroyed = true;
        }

        function _getCollectionParts (sPart, aItemTypes) {

            if (this.getCollectionItem()
                && this.getCollectionItem().copilotEntity
                && this.getCollectionItem().copilotEntity.getParentEntity()
                && this.getCollectionItem().copilotEntity.getParentEntity().copilotEntity) {

                if (sPart === ACCESS_COLL_CONSTANTS_ITEMS) {
                    return this.getCollectionItem().copilotEntity.getParentEntity().copilotEntity.getItemsPublic(aItemTypes);
                } else if (sPart === ACCESS_COLL_CONSTANTS_PARTICIPANTS) {
                    return this.getCollectionItem().copilotEntity.getParentEntity().copilotEntity.getParticipantsPublic();
                } else {
                    return new Promise(function(resolve, reject){
                        if (reject) {
                            reject("Error: " + sPart + " is not a valid part of a collection.");
                        } else {
                            resolve([]);
                        }
                    });
                }
            }
            return new Promise(function(resolve, reject){
                if (reject) {
                    reject("Error: Cannot load collection " + sPart + ". Copilot collection entity cannot be accessed");
                } else {
                    resolve([]);
                }
            });
        }

        function getCollectionItems (aItemTypes) {
            return _getCollectionParts.call(this, ACCESS_COLL_CONSTANTS_ITEMS, aItemTypes);
        }

        function getCollectionParticipants () {
            return _getCollectionParts.call(this, ACCESS_COLL_CONSTANTS_PARTICIPANTS);
        }

        var api = new QuickCreateAPI();

        api.COLLECTION_ITEM_TYPES = {};
        api.COLLECTION_ITEM_TYPES.ITEM_TYPE_NOTE = "NOTE";
        api.COLLECTION_ITEM_TYPES.ITEM_TYPE_RELOBJ = "RO";
        api.COLLECTION_ITEM_TYPES.ITEM_TYPE_SCREENSHOT = "SCRS";
        api.COLLECTION_ITEM_TYPES.ITEM_TYPE_IMAGE = "IMG";
        api.COLLECTION_ITEM_TYPES.ITEM_TYPE_DOCUMENT = "DOC";
        api.COLLECTION_ITEM_TYPES = Object.freeze(api.COLLECTION_ITEM_TYPES);


        extend(api, {

            getCollectionItem: getCollectionItem.bind(api),
            getQuickCreateItem: getQuickCreateItem.bind(api),
            updateDraftID: updateDraftID.bind(api),
            getRootControl: getRootControl.bind(api),
            isDraftEnabled: isDraftEnabled.bind(api),
            isCurrentUserCreator: isCurrentUserCreator.bind(api),
            getQuickCreateRootBindingContext: getQuickCreateRootBindingContext.bind(api),
            getQuickCreateRootEntityType: getQuickCreateRootEntityType.bind(api),
            _onComponentContainerAfterRendering: _onComponentContainerAfterRendering.bind(api),
            calculateViewHeight: calculateViewHeight.bind(api),
            setComponentContainerHeight: setComponentContainerHeight.bind(api),
            getQuickCreateModel: getQuickCreateModel.bind(api),
            objectCreated: objectCreated.bind(api),
            destroy: destroy.bind(api),
            getRootView: getRootView.bind(api),
            setRootView: setRootView.bind(api),
            getComponentInstance: getComponentInstance.bind(api),
            getComponentContainer: getComponentContainer.bind(api),
            _onDataBindingChanged: _onDataBindingChanged.bind(api),
            _attachToModelBindingChanges: _attachToModelBindingChanges.bind(api),
            loadQuickCreateModelFromJSON: loadQuickCreateModelFromJSON.bind(api),
            _updateModelJSON: _updateModelJSON.bind(api),
            getCopilotModel: getCopilotModel.bind(api),
            discardQuickCreateDraft: discardQuickCreateDraft.bind(api),
            _onLineItemsFound: _onLineItemsFound.bind(api),
            fireQuickCreateViewCreated:fireQuickCreateViewCreated.bind(api),
            getCollectionItems: getCollectionItems.bind(api),
            getCollectionParticipants: getCollectionParticipants.bind(api)
        });

        oComponentContainer.addEventDelegate({
            onAfterRendering: api._onComponentContainerAfterRendering
        });

        api._InstanceKey = api.getCollectionItem().copilotEntity.getODataKey();
        if (QuickCreateAPI._Instances[api._InstanceKey]) {
            QuickCreateAPI._Instances[api._InstanceKey].destroy();
        }
        delete QuickCreateAPI._Instances[api._InstanceKey];
        QuickCreateAPI._Instances[api._InstanceKey] = api;

        // subscribe to line items found on quick create
        sap.ui.getCore().getEventBus().subscribe(
            QuickCreateAPI.EVENT_CONSTANTS.EventChannel,
            QuickCreateAPI.EVENT_CONSTANTS.QUICKCREATE_LINE_ITEMS_FOUND,
            api._onLineItemsFound,
            api);

        oComponentInstance.oQuickCreateAPI = api;

        return oComponentInstance.oQuickCreateAPI;

    };

    return QuickCreateAPI;

}, true);
