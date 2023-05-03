/*global sap,Promise*/
sap.ui.define(["../../js/QuickTemplates/QuickActionBaseController", "../../js/QuickTemplates/QuickCreateAPI", "sap/m/MessageToast",
    "../../js/QuickTemplates/AnnotationHelper", "sap/ui/model/odata/AnnotationHelper", "../../js/QuickTemplates/ODataModelHelper", "sap/ui/model/json/JSONModel", "sap/ui/model/Context", "sap/base/util/each",  "sap/suite/ui/generic/template/genericUtilities/polyFill"],
    function (BaseController, QuickCreateAPI, MessageToast, QCAnnotationHelper, ModelAnnotationHelper, ODataModelHelper, JSONModel, Context, each) {
    "use strict";

    var QCController = BaseController.extend("sap.suite.ui.generic.template.QuickCreate.view.QuickCreate", {

        onInit: function () {
            if (!this._bIsInitialized) {
                BaseController.prototype.onInit.apply(this);
                this._focusableElement = '';
                this.oQuickCreateAPI = this.oComponent.oQuickCreateAPI;

                this.oTransactionController = this.oComponent.getTransactionController();

                if (this.oQuickCreateAPI) {
                  this.oQuickCreateAPI.setRootView(this.getView());
                }

                this.sDraftEntityPath = this.oQuickCreateAPI ? this.oQuickCreateAPI.getQuickCreateItem().draftid : undefined;
                this.bIsCreator = this.oQuickCreateAPI ? this.oQuickCreateAPI.isCurrentUserCreator() : true;
                this.sQuickCreateUserName = this.oQuickCreateAPI ? this.oQuickCreateAPI.getQuickCreateItem().createdByName : "";

                this.bFormEnabled = this.bIsCreator;
                this._sDeferredGroupId = "QuickCreateChanges";

                var quickCreateModel = new JSONModel({});

                this._sQuickCreateUIModelName = "quickCreate";

                this.getView().setModel(quickCreateModel, this._sQuickCreateUIModelName);

                this.getView().getModel(this._sQuickCreateUIModelName).setProperty("/draftExists", true);
                this.getView().getModel(this._sQuickCreateUIModelName).setProperty("/quickCreateUser", this.sQuickCreateUserName);

                if (!this.bDraftEnabled) {
                    this.getView().getModel().setDeferredGroups([this._sDeferredGroupId]);
                }

                // subscribe to line items found on quick create
                if (this.oQuickCreateAPI) {
                    this.oQuickCreateAPI.attachAutofillLineItems(this._onLineItemsFound, this);
                }

                //Extension point: onQCViewInit
                if (typeof this.oComponent.onQCViewInit === "function") {
                  this.oComponent.onQCViewInit(this);
                }
            }
        },


        onExit: function () {

            if (this._bIsBeingDestroyed || this._bDestroyed) {
                return;
            }

            this._bIsBeingDestroyed = true;

            if (this.oQuickCreateAPI) {
                this.oQuickCreateAPI.destroy();
            }

            if (BaseController.prototype.onExit) {
                BaseController.prototype.onExit.apply(this);
            }

            this._bDestroyed = true;
            delete this._bIsBeingDestroyed;
        },

        onBeforeRendering: function () {
            BaseController.prototype.onBeforeRendering.apply(this);
            if (!this.getView().getModel("ui")) {
              var uiModel = new JSONModel({});
              this.getView().setModel(uiModel, "ui");
            }
            this.getView().getModel("ui").setProperty("/enabled", this.bFormEnabled);
            this.getView().getModel("ui").setProperty("/editable", true);
            //Extension point: onQCBeforeRendering
            if (typeof this.oComponent.onQCBeforeRendering === "function") {
              this.oComponent.onQCBeforeRendering(this.getView());
            }
        },

        onAfterRendering: function () {
            this.getView().getModel("ui").setProperty("/createenabled", true);
            this._checkForMandatoryFields(true);
            /*If List get rerender due to addition of line Item than onAfterRendering is called after addition of list*/
            if (this._focusableElement) {
                this._focusableElement.focus();
                this._clearFocusableElement();
            }
        },

        _clearFocusableElement: function() {
            this._focusableElement = '';
        },

        _onMetaModelLoaded: function () {
            var that = this;
            this.setBusy(true);

            if (this.sDraftEntityPath) {
                // Open Existing QuickCreate
                var oContext = new Context(this.getView().getModel(), this.sDraftEntityPath);

                if (this.bDraftEnabled && !this.bIsCreator) {
                    oContext._bLocalBinding = true;
                } else if (!this.bDraftEnabled) {
                    oContext._bLocalBinding = true;
                }

                if (oContext._bLocalBinding) {
                    if (this.oQuickCreateAPI) {
                        this.oQuickCreateAPI.loadQuickCreateModelFromJSON().then(function () {
                            if (oContext.getObject()) {
                                this.getView().getModel(this._sQuickCreateUIModelName).setProperty("/draftExists", true);
                            } else {
                                this.getView().getModel(this._sQuickCreateUIModelName).setProperty("/draftExists", false);
                            }
                            this.bindView(oContext);
                        }.bind(this));
                    }
                } else {
                    //check if draft still exists
                    this.getView().getModel().read(this.sDraftEntityPath, {

                        success: function (oData, oResponse) {
                            this.getView().getModel(this._sQuickCreateUIModelName).setProperty("/draftExists", true);
                            this.bindView(oContext);
                        }.bind(this),

                        error: function (oError) {
                            this.getView().getModel(this._sQuickCreateUIModelName).setProperty("/draftExists", false);
                            this.bindView(oContext);
                        }.bind(this)

                    });
                }
            } else if (this.bDraftEnabled) {
                    // create new Draft case
                    this.oDraftController.createNewDraftEntity(this.sEntitySet, "/" + this.sEntitySet).then(function (oResponse) {
                        if (that.oQuickCreateAPI) {
                            that.oQuickCreateAPI.updateDraftID(oResponse.context.getPath());
                        }

                        that.bindView(oResponse.context);

                    }, this.onError.bind(this));

             } else {
                    // create new non-Draft case
                    var context = this.getView().getModel().createEntry("/" + this.sEntitySet, {groupId: this._sDeferredGroupId});
                    context._bLocalBinding = true;
                    if (this.oQuickCreateAPI) {
                        this.oQuickCreateAPI.updateDraftID(context.getPath());
                    }
                    this._initializeObject(context, "FieldGroup");
                    this.bindView(context);
             }


        },

        // check for mandatory field value if empty("") then create button is disabled
        _checkForMandatoryFields: function(doFormCheck) {
            var visibility = true;
            var aSmartFields = this.getView().byId('QuickCreateSmartForm').getSmartFields();
            for (var i = 0; i < aSmartFields.length; i++) {
                if (aSmartFields[i].getMandatory() && aSmartFields[i].getValue() === "") {
                    visibility = false;
                    break;
                }
            }
            if (visibility && doFormCheck) {
                var aErrSmartField = this.getView().byId('QuickCreateSmartForm').check();
                if (aErrSmartField.length > 0) {
                    visibility = false;
                }
            }
            this.getView().getModel("ui").setProperty("/createenabled", visibility);
        },

        onChange: function (oEvent) {
            this._checkForMandatoryFields(false);
            if (this.bDraftEnabled) {
              var oBinding = this.getView().getElementBinding();
              var self = this;
              this.getView().getModel("ui").setProperty("/createenabled", false);
              var modifyPromise = new Promise(function(resolve, reject) {
                var sEntitySet = this.oComponent.getEntitySet();
                var sValue = oEvent.getSource().getBindingPath("value");
                var oControl = oEvent.getSource();
                var oServiceController = null;
                if (oControl) {
                  oServiceController = this.oComponent.getApplicationController();
                } else {
                  oServiceController = this.oComponent.getTransactionController();
                }

                oServiceController.propertyChanged(sEntitySet, sValue, oBinding, oControl).then(
                        function(){
                            if (resolve) {
                              resolve();
                            }
                        },
                        function(){
                            if (reject) {
                              reject();
                            }
                        });
              }.bind(this));

              modifyPromise.then(function(){
                self._checkForMandatoryFields(true);
                oBinding.refresh();
              });
            } else {
                this._checkForMandatoryFields(true);
            }
        },

        onCreatePress: function (evt) {
            var that = this;
            this._createButton = evt.getSource();
            this._createButton.setEnabled(false);
            this.setBusy(true);


            var resolve = function (oResponse) {
                that.setBusy(false);
                var context = null;

                // search for odata entities in response
                var objects = [];

                var params = {
                    key: "__metadata",
                    matchCallback: function (parent, current, match) {
                        objects.push(current);
                        return false;
                    }
                };

                ODataModelHelper.findObjects(oResponse, params);


                var entityType = that.oEntityTypeMeta.namespace + "." + that.oEntityTypeMeta.name;
                each(objects, function (i, obj) {
                    if (!context && obj.__metadata && obj.__metadata.type === entityType) {
                        var key = that.getView().getModel().getKey(obj);
                        context = new Context(that.getView().getModel(), "/" + key);
                    }
                });

                if (context) {
                    MessageToast.show(that.formatI18NMessage("QuickCreate_Success_CreateObject"));
                    if (that.oQuickCreateAPI) {
                        that.oQuickCreateAPI.objectCreated(context);
                    }
                } else {
                    this._showErrorMessage({message: that.formatI18NMessage("QuickCreate_No_Created_Object")});
                }
            };

            var reject = function (oError) {
                that.setBusy(false);
                if (that._createButton) {
                    that._createButton.setEnabled(true);
                }
                that.onError(oError);
            };

            var onQCBeforeCreatePromise;
            if (this.bDraftEnabled) {
              //Extension point: onQCBeforeCreate
              var doActivateDraft = function () {
                  that.oDraftController.activateDraftEntity(that.getView().getBindingContext()).then(resolve, reject);
              };

              if (typeof this.oComponent.onQCBeforeCreate === "function") {
                  onQCBeforeCreatePromise = this.oComponent.onQCBeforeCreate(this.getView().getBindingContext(), this.getView().getBindingContext().getObject());
              }
              if (onQCBeforeCreatePromise && onQCBeforeCreatePromise instanceof Promise) {
                  onQCBeforeCreatePromise.then(doActivateDraft, reject);
              } else {
                  doActivateDraft();
              }
            } else {

                var context = this.getView().getBindingContext();
                var oModelObject = this.getView().getModel().getProperty(context.getPath(), context, /* make sure to expand all nav properties */ true);


                // remove "results" arrays from object by setting the array directly as the navigation property
                var params = {
                    key: "results",
                    matchCallback: function(parent, current, match) {
                        if (current.__nestedKey && Array.isArray(match)) {
                            parent[current.__nestedKey] = match;
                        }
                        return true;
                    },
                    maxNestedLevel: 5
                };

                ODataModelHelper.findObjects(oModelObject, params);


                // delete all "__metadata" properties from objects
                params = {
                    key: "__metadata",
                    matchCallback: function(parent, current, match) {
                        delete current["__metadata"];
                        return true;
                    },
                    maxNestedLevel: 5
                };

                ODataModelHelper.findObjects(oModelObject, params);

                //Extension point: onQCBeforeCreate
                var doCreate = function () {
                    that.getView().getModel().create("/" + that.sEntitySet, oModelObject, {
                        success: resolve,
                        error: reject
                    });
                };

                if (typeof this.oComponent.onQCBeforeCreate === "function") {
                    onQCBeforeCreatePromise = this.oComponent.onQCBeforeCreate(context, oModelObject);
                }
                if (onQCBeforeCreatePromise && onQCBeforeCreatePromise instanceof Promise) {
                    onQCBeforeCreatePromise.then(doCreate, reject);
                } else {
                    doCreate();
                }
            }
        },

        onAddLineItemPress: function (oEvent) {
            this._getLineItemsTableFromEvent(oEvent);
            var that = this;
            /*Storing focusable element to be focuses after page has re-rendered*/
            this._focusableElement = oEvent.oSource;
            this.setBusy(true);
            var context = this.getView().getBindingContext();

            var createLineItem = function(submitChangesResponse) {
                that._createLineItem(context).then(function (oCreateResponse) {
                    that._refreshLineItems();

                    if (that.oQuickCreateAPI) {
                        that.oQuickCreateAPI.calculateViewHeight(that.getView(), true);
                    }
                    that.setBusy(false);
                }, that.onError.bind(that));
            };

            if (this.bDraftEnabled) {
                this.oTransactionController.triggerSubmitChanges().then(function (oSubmitResponse) {
                    createLineItem(oSubmitResponse);
                }, this.onError.bind(this));
            } else {
                createLineItem();
            }
        },

        onRemoveLineItemPress: function (oEvent) {
            var that = this;
            this.setBusy(true);
            var context = oEvent.getSource().getBindingContext();

            if (this.bDraftEnabled) {
                this.oTransactionController.triggerSubmitChanges().then(function (oResponse) {
                    that._deleteLineItem(context);
                }, function (oError) {
                    this.setBusy(false);
                    this.onError(oError);

                }.bind(this));
            } else {
                this.getView().getModel().deleteCreatedEntry(context);
                this.setBusy(false);
                if (this.oQuickCreateAPI) {
                    this.oQuickCreateAPI.calculateViewHeight(this.getView(), false);
                }
                this._refreshLineItems();

            }
        },


        bindView: function (oContext) {
            this.setBusy(false);

            if (this.getView().getModel(this._sQuickCreateUIModelName).getProperty("/draftExists") === false) {
                return;
            }

            if (oContext._bLocalBinding) {
                this._setBindingContext(oContext);
                this._refreshLineItems();
            } else {
                BaseController.prototype.bindView.apply(this, arguments);
            }

            this._updateFieldControl(oContext);

        },

        hasLineItemAnnotation: function () {
            var oInterface = this._getFormatterInterface();
            var oMetaDataContext = QCAnnotationHelper.getMetaModelContextForFacetType(oInterface,
                    this.oEntityTypeMeta.namespace + "." + this.oEntityTypeMeta.name, "LineItem");

            return oMetaDataContext !== null;
        },

        _onLineItemsFound: function (oEvent) {
            if (!this.hasLineItemAnnotation()) {
                return;
            }

            var numberLineItems = oEvent.getParameter("numberOfLineItems");
            if (numberLineItems <= 0) {
                return;
            }

            this.setBusy(true);
            var oMainEntityContext = this.getView().getBindingContext();
            var promises = [];
            for (var i = 0; i < numberLineItems; i++) {
                promises.push(this._createLineItem(oMainEntityContext));
            }

            Promise.all(promises).then(function (result) {
                this._refreshLineItems();
                this.setBusy(false);
            }.bind(this));
        },

        _createLineItem: function (oMainEntityContext) {
            var that = this;
            var oInterface = this._getFormatterInterface(oMainEntityContext);

            var oMetaModel = this.getView().getModel().getMetaModel();
            var oMetaDataContext = QCAnnotationHelper.getMetaModelContextForFacetType(oInterface,
                    this.oEntityTypeMeta.namespace + "." + this.oEntityTypeMeta.name, "LineItem");

            var sChildPropertyPath = ModelAnnotationHelper.getNavigationPath(oMetaDataContext);
            sChildPropertyPath = sChildPropertyPath.replace(/[{}]/g, '');
            var oListEntityAssociationEnd = oMetaModel.getODataAssociationEnd(this.oEntityTypeMeta, sChildPropertyPath);
            var oListEntityTypeMeta = oMetaModel.getODataEntityType(oListEntityAssociationEnd.type);


            if (this.bDraftEnabled) {
                return this.oDraftController.createNewDraftEntity(oListEntityTypeMeta.name, oMainEntityContext.sPath + "/" + sChildPropertyPath);
            } else {
                return new Promise(function (resolve, reject) {
                    var context = that.getView().getModel().createEntry(oMainEntityContext.sPath + "/" + sChildPropertyPath, {groupId: that._sDeferredGroupId});
                    that._initializeObject(context, "LineItem");
                    resolve(context);
                });
            }
        },

        _deleteLineItem: function (oContext) {
            this.oTransactionController.deleteEntity(oContext).then(function (oResponse) {
                this._refreshLineItems();
                this.setBusy(false);
                if (this.oQuickCreateAPI) {
                    this.oQuickCreateAPI.calculateViewHeight(this.getView(), false);
                }

            }.bind(this), function (oError) {
                this.setBusy(false);
                this.onError(oError);

            }.bind(this));
        },


        _onSmartFieldAfterRendering: function (oEvent) {
            if (typeof oEvent.srcControl.setEnabled == 'function') {
                oEvent.srcControl.setEnabled(this.bFormEnabled);
            }

            if (this.oQuickCreateAPI) {
                this.oQuickCreateAPI.calculateViewHeight(this.getView(), true);
            }

			// remove element style so that we can style it via the CSS classes
			// NodeList.forEach is not supported in IE11 so we are injecting polyFill as dependency
			document.querySelectorAll(".copilotQuickCreateContainerBox .sapQuickCreateFieldGroup label").forEach(function (element) { element.style.textAlign = "" ;});
			document.querySelectorAll(".sapQuickActionCreateButtonContainer > div").forEach(function (element) { element.classList.add("sapUiSmallMarginEnd");});
            document.querySelectorAll(".sapQuickActionCreateButtonContainer .sapMBtnInner").forEach(function (element) { element.style.padding = "0"; });
        },

        _refreshLineItems: function() {
          if (this._lineItemsTable) {
            var context = this.getView().getBindingContext();
            if (context && context._bLocalBinding) {
              ODataModelHelper.restoreLineItemReferences(this.oEntityTypeMeta.namespace + "." + this.oEntityTypeMeta.name, context);
              this._lineItemsTable.getModel().updateBindings();
            } else {
              this._lineItemsTable.getModel().refresh();
            }
          }
        },

        onTableUpdateStarted: function (oEvent) {
            this._getLineItemsTableFromEvent(oEvent);

        },

        _getLineItemsTableFromEvent: function(oEvent) {
            if (!this._lineItemsTable && oEvent && oEvent.getSource) {
              var current = oEvent.getSource();
              while (current) {
                if (current instanceof sap.m.Table) {
                  this._lineItemsTable = current;
                  return;
                }

                if (typeof current.getParent === 'function') {
                  current = current.getParent();
                } else {
                  return;
                }
              }
            }
        },


        onTableUpdateFinished: function (oEvent) {
            // ensure header fields are editable in case Field control is overwriting this
            this._updateFieldControl();
        },

        _initializeObject: function(oContext, facetType) {

            var oMainContext = this.getView().getBindingContext() ? this.getView().getBindingContext() : oContext;

            var propertyPaths = QCAnnotationHelper.getAllPropertyPathsFromFacet(oMainContext, facetType);
            if (propertyPaths && propertyPaths.length > 0) {
                ODataModelHelper.initializeObjectProperties(oContext, propertyPaths, {groupId: this._sDeferredGroupId});
            }

        },

        _updateFieldControl: function (oContext) {
            // Find out more how to handle this, for now make sure header fields are editable!
            var context = oContext ? oContext : this.getView().getBindingContext();
            if (context && this.getView().getModel().getProperty(context.getPath() + "/Update_mc") !== undefined) {
                this.getView().getModel().setProperty(context.getPath() + "/Update_mc", true);
            }
        }

    });

    return QCController;

}, /* bExports */ true);
