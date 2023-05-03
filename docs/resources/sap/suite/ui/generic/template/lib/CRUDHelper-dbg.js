sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Context", "sap/suite/ui/generic/template/lib/MessageUtils", "sap/ui/model/Filter", "sap/ui/model/FilterOperator",  "sap/m/MessageBox", "sap/suite/ui/generic/template/genericUtilities/CacheHelper", "sap/suite/ui/generic/template/genericUtilities/metadataAnalyser"],
	function(BaseObject, Context, MessageUtils, Filter, FilterOperator, MessageBox, CacheHelper, metadataAnalyser) {
		"use strict";

		var oRejectedPromise = Promise.reject();
		oRejectedPromise.catch(Function.prototype);
		
		function createNonDraft(oParentContext, sBindingPath, oModel, vPredefinedValues, bMakeRequestsCanonical) {
			var oCreateContext = oModel.createEntry(sBindingPath, {
				properties: vPredefinedValues,
				context: oParentContext,
				batchGroupId: "Changes",
				changeSetId: "Changes",
				canonicalRequest: bMakeRequestsCanonical
			});
			return oCreateContext;
		}

		// create a new instance for the specified draft enabled entity set with the given binding path.
		// Returns a promise that resolves to the context.
		// If the creation fails the returned Promise is rejected.
		function create(oDraftController, sEntitySet, sBindingPath, oModel, oApplication, vPredefinedValues, oParameters, oCommonUtils) {
			sBindingPath = sBindingPath || "/" + sEntitySet;
			var bCreateRequestsCanonical = oApplication.mustRequireRequestsCanonical();
			oParameters.oFunctionImportDialogInfo = {
				getTitleText: function () {
					return oCommonUtils.getText("DIALOG_TITLE_NEW_ACTION_FOR_CREATE");
				},
				getActionButtonText: function () {
					return oCommonUtils.getText("DIALOG_ACTION_BUTTON_NEW_ACTION_FOR_CREATE");
				}
			};
			return oDraftController.createNewDraftEntity(sEntitySet, sBindingPath, vPredefinedValues, bCreateRequestsCanonical, oParameters).then(function(oResponse){
				return oResponse.context; // map response onto the contained context
			});
		}

		function fnReadDraftAdminstrativeData(oModel, sBindingPath, oBusyHelper) {
			var oPromise = new Promise(function(resolve, reject) {
				oModel.read(sBindingPath, {
					urlParameters: {
						"$expand": "DraftAdministrativeData"
					},
					success: function(oResponse) {
						resolve(oResponse);
					},
					error: function(oResponse) {
						reject(oResponse);
					}
				});
			});
			// not really needed for navigation (as there is always another promise still running), but maybe for internal
			// edit - and it doesn't hurt anyway
			oBusyHelper.setBusy(oPromise, true);
			return oPromise;
		}
		/*
		 * functionality similar to routingHelper - START - refactoring
		 * */
		function fnReadDraftAdminstrativeDataWithSemanticKey(oTransactionController, sEntitySet, aKeys, oStartupParameters, oModel, oTemplateContract) {
			var oPromise = new Promise(function(resolve, reject) {
				var i, iLen, sProperty, sValue, aFilters = [];
				if (aKeys && oStartupParameters && oModel) {
					iLen = aKeys.length;
					for (i = 0; i < iLen; i++) {
						// get property from property path
						sProperty = aKeys[i].PropertyPath;
						// get value from parameter array (should have only 1)
						sValue = oStartupParameters[sProperty][0];
						aFilters.push(new Filter(sProperty, FilterOperator.EQ, sValue));
					}
					if (oTransactionController.getDraftController()
							.getDraftContext().isDraftEnabled(sEntitySet)) {
						var oDraftFilter = new Filter({
							filters: [new Filter("IsActiveEntity", "EQ", false),
							          new Filter("SiblingEntity/IsActiveEntity", "EQ", null)],
							          and: false
						});
						aFilters.push(oDraftFilter);
					}
					var oCompleteFilter = new Filter(aFilters, true);
					oModel.read("/" + sEntitySet, {
						urlParameters: {
							"$expand": "DraftAdministrativeData"
						},
						filters: [oCompleteFilter],
						success: function(oResult) {
							var oRowResult = fnReadObjectProcessResults(oResult, oModel, oStartupParameters);
							if (oRowResult) {
								resolve(oRowResult);
							} else {
								reject(oResult);
							}
						},
						error: function(oResponse) {
							reject(oResponse);
						}
					});
				}
			});
			// not really needed for navigation (as there is always another promise still running), but maybe for internal
			// edit - and it doesn't hurt anyway
			oTemplateContract.oBusyHelper.setBusy(oPromise, true);
			return oPromise;
		}

		function fnReadObjectProcessResults(oResult, oModel, oStartupParameters) {


			var oRow, i, iLength, oRowResult;
			if (oResult && oResult.results){
				iLength = oResult.results.length;
				if (iLength == 0) {
					oRowResult = null;
				} else if (iLength == 1) {
					oRowResult = oResult.results[0];
				} else if (iLength >= 1) {
					var aDrafts  = [];
					var aActive = [];
					for (i = 0; i < iLength; i++) {
						oRow = oResult.results[i];
						if (oRow && oRow.IsActiveEntity) {
							aActive.push(oRow);
						} else if (oRow && oRow.IsActiveEntity == false) {
							aDrafts.push(oRow);
						}
					}
					if (aActive.length == 0 && aDrafts.length >= 2){
						//DraftUUID match?
						var oDraftRow;
						for (var j = 0; j < aDrafts.length; j++) {
							oDraftRow = aDrafts[j];
							if (oDraftRow.DraftUUID == oStartupParameters.DraftUUID){
								//show corresponding object
								oRowResult = oDraftRow;
								break;
							}
						}
						if (!oRowResult){
							oRowResult = aDrafts[0];
						}
					} else if (aActive.length == 1 && aDrafts.length == 1){
						//no DraftUUID check
						oRowResult = aActive[0];
					} else if (aActive.length == 1 && aDrafts.length >= 2){
						oRowResult = aActive[0];
					}
				}
			}
			return oRowResult;
		}


		/*
		 * functionality similar to routingHelper - END
		 * */

		/*
		 * This method is called during startup and ensures that all changes performed on draft objects are
		 * automatically saved.
		 * This is done by registering to the propertyChange-event of the OData model of the app.
		 * Note that this affects even changes that are done in breakouts or reuse componentgs as long as they use the standard OData model.
		 * Components using different channels (e.g. another OData model) for storing the data need to use method
		 * sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController.saveDraft()
		*/
		function enableAutomaticDraftSaving(oTemplateContract){
			var oAppComponent = oTemplateContract.oAppComponent;
			var oModel = oAppComponent.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oNavigationController = oAppComponent.getNavigationController();
			var oApplicationController = oAppComponent.getApplicationController(); // instance of sap.ui.generic.app.ApplicationController
			var oDraftContext = oApplicationController.getTransactionController().getDraftController().getDraftContext();
			var fnErrorHandler = function(oError){
					/* TODO: change handleError API
				 we anyway want to modify the API for the handleError method. Until then we use the
				 mParameters to pass the needed resourceBundle and navigation Controller
				*/
				oTemplateContract.oApplicationProxy.getResourceBundleForEditPromise().then(function(oResourceBundle){
					MessageUtils.handleError(MessageUtils.operations.modifyEntity, null, null, oError, {
						resourceBundle: oResourceBundle,
						navigationController: oNavigationController,
						model: oModel
					});
					MessageUtils.handleTransientMessages(oTemplateContract);
				});
			};
			var fnPropertyChanged = function(oEvent){
				var oContext = oEvent.getParameter("context");
				// Ignore all cases which are non-draft
				if (!oDraftContext.hasDraft(oContext)){
					return;
				}
				// for parameters of function imports special paths are introduced in the model, that are not known in the metamodel
				// as we don't need a merge call for changes to these properties, we can just ignore them
				if (!oMetaModel.getODataEntitySet(oContext.getPath().split("(")[0].substring(1))){
					return;
				}
				var sPath = oEvent.getParameter("path");
				// delegate the draft saving to the ApplicationController
				oApplicationController.propertyChanged(sPath, oContext).catch(fnErrorHandler);
				//update the draft has modified information in ContextBookKeeping Map
				oTemplateContract.oApplicationProxy.markCurrentDraftAsModified();
			};
			oModel.attachPropertyChange(fnPropertyChanged); // ensure that the handler is called whenever a user input (affecting the OData model) is performed
		}

		function fnUnsavedChangesDialog(oTemplateContract, oDraftAdministrativeData, oCommonUtils, oViewProxy, bOpenInEditMode) {
			var oResourceObject = oTemplateContract || oCommonUtils;
			return new Promise(function(resolve, reject) {
				var sWarningText = oResourceObject.getText("DRAFT_LOCK_EXPIRED", [oDraftAdministrativeData.LastChangedByUserDescription ||
							oDraftAdministrativeData.LastChangedByUser
						]);
				var sEdit =  oResourceObject.getText("Edit");
				var sCancel =  oResourceObject.getText("CANCEL");
					MessageBox.warning(sWarningText, {
					title: oResourceObject.getText("ST_UNSAVED_CHANGES_TITLE"),
					actions: [sEdit, sCancel],
					emphasizedAction: sEdit,
					onClose: function (sAction) {
						if (sAction === sEdit) {
							resolve();
						} else if (sAction === sCancel) {
							if (bOpenInEditMode) {
								oViewProxy.navigateUp();
							}
						}
						reject();
					}
				});
			});
		}

		function edit(oTransactionController, sEntitySet, sBindingPath, oModel, oTemplateContract,
			fnBeforeDialogCallback, aKeys, oStartupParameters) {
			//refactoring needed
			if (sBindingPath === "" && aKeys && oStartupParameters ){
				return new Promise(function(resolve, reject) {
					var oInfoForContentIdPromise = CacheHelper.getInfoForContentIdPromise(sEntitySet, oModel, oTemplateContract.oAppComponent.getId());
					Promise.all([oInfoForContentIdPromise, fnReadDraftAdminstrativeDataWithSemanticKey(oTransactionController, sEntitySet, aKeys, oStartupParameters, oModel, oTemplateContract)])
					.then(function(aParameters) {
						var oResponse = aParameters[1];
						var sRootExpand = aParameters[0].contentIdRequestPossible ? aParameters[0].parametersForContentIdRequest.sRootExpand : null;
						var sResponseBindingPath = "/" + oModel.createKey(sEntitySet, oResponse);
						oModel.createBindingContext(sBindingPath, null, null, function(oBindingContext){
							var oBindingContext = new Context(oModel, sResponseBindingPath);
							if (!oResponse.DraftAdministrativeData || oResponse.DraftAdministrativeData.DraftIsCreatedByMe) {
								// no or own draft
								resolve(oTransactionController.editEntity(oBindingContext, false, sRootExpand));
							} else if (oResponse.DraftAdministrativeData.InProcessByUser) { // locked
								reject({
									lockedByUser: oResponse.DraftAdministrativeData.InProcessByUserDescription || oResponse.DraftAdministrativeData.InProcessByUser
								});
							} else { // unsaved changes
								fnUnsavedChangesDialog(oTemplateContract, oResponse.DraftAdministrativeData,
									fnBeforeDialogCallback).then(
									function() {
										resolve(oTransactionController.editEntity(oBindingContext, false));
									},
									function() {
										reject({
											lockedByUser: oResponse.DraftAdministrativeData.LastChangedByUserDescription || oResponse.DraftAdministrativeData.LastChangedByUser
										});
									});
							}
						});
					},
						function(oResponse) {
							// DraftAdminData read failed
							reject({
								draftAdminReadResponse: oResponse
							});
						}
					);
				});
			}
			var oDraftContext = oTransactionController.getDraftController().getDraftContext();
			var oPromise = new Promise(function(resolve,reject) {
				oModel.createBindingContext(sBindingPath, null, null, function(oBindingContext){
					if (oDraftContext.isDraftEnabled(sEntitySet)) {
						// todo: enable preserveChanges
						if (true || !oDraftContext.hasPreserveChanges(oBindingContext)) {
							fnReadDraftAdminstrativeData(oModel, sBindingPath, oTemplateContract.oBusyHelper).then(
								function(oResponse) {
									if (!oResponse.DraftAdministrativeData || oResponse.DraftAdministrativeData.DraftIsCreatedByMe) {
										// no or own draft
										resolve(oTransactionController.editEntity(oBindingContext, false));
									} else if (oResponse.DraftAdministrativeData.InProcessByUser) { // locked
										reject({
											lockedByUser: oResponse.DraftAdministrativeData.InProcessByUserDescription || oResponse.DraftAdministrativeData.InProcessByUser
										});
									} else { // unsaved changes
										var editConfirmation = function(){
												resolve(oTransactionController.editEntity(oBindingContext, false));
											};
										var editRejection = function(){
											reject({
													lockedByUser: oResponse.DraftAdministrativeData.LastChangedByUserDescription || oResponse.DraftAdministrativeData.LastChangedByUser
												});
										};
										var unSavedChangesDialogPromise = fnUnsavedChangesDialog(oTemplateContract, oResponse.DraftAdministrativeData,
											fnBeforeDialogCallback);
										unSavedChangesDialogPromise.then(editConfirmation, editRejection);
									}
								},
								function(oResponse) {
									// DraftAdminData read failed
									reject({
										draftAdminReadResponse: oResponse
									});
								});
							oTemplateContract.oBusyHelper.setBusy(oPromise, true);
						}
					} else {
						resolve({
							context: oBindingContext
						});
					}
				});
			});
			return oPromise;
		}
		
		/* 
		Allows direct edit on the entires on the list, unlike the method 'edit'above, this method first edit the entry with preserveChanges as true
		If the response indicates an unsaved change or locked record, a corresponding dialog is shown to proceed or cancel with the edit.
		*/
		function directEdit(oTransactionController, sEntitySet, sBindingPath, oModel, oApplication, oCommonUtils, oViewDependencyHelper, oViewProxy, bOpenInEditMode){
			var oDraftContext = oTransactionController.getDraftController().getDraftContext();
			var oPromise = new Promise(function(resolve,reject) {
				oModel.createBindingContext(sBindingPath, null, null, function(oBindingContext){
					if (oDraftContext.isDraftEnabled(sEntitySet)) {
						oTransactionController.editEntity(oBindingContext, true).then(function(oResponse) {
							oBindingContext.getModel().invalidateEntry(oBindingContext);
							oViewDependencyHelper.setRootPageToDirty();
							resolve({
								context: oResponse.context
							});		
						}, function(oResponse) {
							if (oResponse && oResponse.response && oResponse.response.statusCode === "409") {
								//remove transient message associated with rc 409 in order to prevent message pop-up
								oApplication.removeTransientMessages();
								fnReadDraftAdminstrativeData(oModel, sBindingPath, oApplication.getBusyHelper()).then(
									function(oResponse) {
										if (oResponse.DraftAdministrativeData.InProcessByUser) {
											reject({
												lockedByUser: oResponse.DraftAdministrativeData.InProcessByUserDescription || oResponse.DraftAdministrativeData.InProcessByUser
											});
										} else { //unsaved changes
											var editConfirmation = function(){
											var oUnsavedChangesEditPromise = oTransactionController.editEntity(oBindingContext, false).then(function(oResponse){
													oBindingContext.getModel().invalidateEntry(oBindingContext);
													oViewDependencyHelper.setRootPageToDirty();
													resolve({
														context: oResponse.context
													});	
												});
												oApplication.getBusyHelper().setBusy(oUnsavedChangesEditPromise, true);
											};
											var editRejection = Function.prototype;
											var unSavedChangesDialogPromise = fnUnsavedChangesDialog(undefined, oResponse.DraftAdministrativeData,oCommonUtils, oViewProxy, bOpenInEditMode);
											unSavedChangesDialogPromise.then(editConfirmation,editRejection);
										}
									},
									function(oResponse) {
										// DraftAdminData read failed
										reject({
											draftAdminReadResponse: oResponse
										});
									});
									oApplication.getBusyHelper().setBusy(oPromise, true);
							} else {
								reject(oResponse);
							}
						});
				} else {
					return resolve({
						context: oBindingContext
					});
				}
				});
			});
			return oPromise;
		}
		
		function deleteEntity(oDraftController, fnExecuteDelete, oApplicationProxy, oContext, bIsActiveEntity, sActionType){
			var bHasActiveEntity = oDraftController.hasActiveEntity(oContext);
			var oSiblingPromise = bHasActiveEntity && !bIsActiveEntity ? oApplicationProxy.getDraftSiblingPromise(oContext) : Promise.resolve();
			return oSiblingPromise.then(function(oActive){
				var oDeletePromise = fnExecuteDelete(bIsActiveEntity, bHasActiveEntity, oContext);
				if (!bIsActiveEntity) { // cancellation of a draft
					var fnTransformActiveContext = function(){
						return  { context: oActive };
					};
					var oCancellationPromise = oDeletePromise.then(fnTransformActiveContext);
					oApplicationProxy.cancellationStarted(oContext, oCancellationPromise, sActionType, oActive);					
				}
				return oDeletePromise;
			});			
		}

		function discardDraft(oDraftController, oTransactionController, oApplicationProxy, oContext){
			var fnExecuteDelete = function(bIsActiveEntity, bHasActiveEntity, oContext){
				return oTransactionController.deleteEntity(oContext);
			};
			return deleteEntity(oDraftController, fnExecuteDelete, oApplicationProxy, oContext, false, "discardAction");
		}
		
		function fnGetMessagesFromContextFilter(oContextFilter, oMessageManager, bExcludeETagMessages) {
			var oMessageModel = oMessageManager.getMessageModel();
			var oMessageBinding = oMessageModel.bindList("/", null, null, [oContextFilter]); // Note: It is necessary to create this binding each time, since UI5 does not update it (because there is no change handler)
			var aRet = oMessageBinding.getCurrentContexts().map(function(oContext) {
				return oContext.getObject();
			});
			if (bExcludeETagMessages){
				aRet = aRet.filter(function(oMessage){
					return !MessageUtils.isMessageETagMessage(oMessage);	
				});
			}
			return aRet;
		}

		function activateDraftEntity(oCreateDialogContext, oCreateWithDialogFilter, oBusyHelper, oServices, oController, oComponentUtils) {
			if (oBusyHelper.isBusy()) {
				return oRejectedPromise;
			}
			var oRet = new Promise(function(resolve, reject) {
				var oContext = oCreateDialogContext ? oCreateDialogContext : oController.getView().getBindingContext();
				var oContextFilter = oCreateWithDialogFilter ? oCreateWithDialogFilter : oServices.oTemplateCapabilities.oMessageButtonHelper && oServices.oTemplateCapabilities.oMessageButtonHelper.getContextFilter(true);
				var oMessageManager = sap.ui.getCore().getMessageManager();
				var bWarningOccured = false;
				var oModel = oController.getView().getModel();
				var sRootExpand = metadataAnalyser.isContentIdReferencingAllowed(oModel) ? oComponentUtils.getRootExpand() : undefined;
				var fnHandleWarning = function(aStateMessages) {
					bWarningOccured = true;
					var fnForceActivate = function() {
						var oActivationPromise = oServices.oDraftController.activateDraftEntity(oContext, true, sRootExpand);
						oServices.oApplication.activationStarted(oContext, oActivationPromise);
						oActivationPromise.then(function(oResponse) {
							resolve(oResponse);
							},function(oError){
								var aStateMessageAfterSave = fnGetMessagesFromContextFilter(oContextFilter, oMessageManager).filter(function(oMessage){
									// during force activation ignore state messages that are no error messages (i.e. warning). Application should have removed them anyway.
									return oMessage.type === "Error";
								});
								if (aStateMessageAfterSave.length) {
									// compare first message of the after save and compare it with beforesave message
									var oNewMessage = aStateMessageAfterSave[0];
									var bMessagesUnChanged = aStateMessages.some(function(oOldMessage) {
										return oNewMessage === oOldMessage;
									});
									if (!bMessagesUnChanged) {
										var bHasStateError = aStateMessageAfterSave.some(function(oMessage){
											return oMessage.type === "Error";
										});
										if (bHasStateError){ // as the fail is justified by a state message we do not need the transient messages
											oServices.oApplication.removeTransientMessages();
										}
									}
								}
								MessageUtils.handleError(MessageUtils.operations.activateDraftEntity, oController, oServices, oError, null);
								reject();
							});
						oBusyHelper.setBusy(oActivationPromise);
					};
					var mParameters = {
						messagesForUserDecison: aStateMessages
					};
					if (aStateMessages.length === 0){// warnings have come as transient messages -> they might be relevant in exceptional cases
						var aTransientMessages = oServices.oApplication.getTransientMessages();
						bWarningOccured = aTransientMessages.some(function(oMessage){
							return oMessage.type === "Warning" && oMessage.technicalDetails && oMessage.technicalDetails.statusCode === "412"
							&& oMessage.technicalDetails.headers && oMessage.technicalDetails.headers["preference-applied"] === "handling=strict";
						});
						if (!bWarningOccured){
							return;
						}
						mParameters.messagesForUserDecison = aTransientMessages;
						oServices.oApplication.removeTransientMessages();							
					}
					var oCRUDActionHandler = oComponentUtils.getCRUDActionHandler();
					oCRUDActionHandler.handleCRUDScenario(4, fnForceActivate, reject, "Activate", mParameters);
				};
				oServices.oApplication.getDraftSiblingPromise(oContext).then(function(oSiblingContext){
					if (oSiblingContext){
						oController.getOwnerComponent().getModel().invalidateEntry(oSiblingContext);
					}
					var aStateMessagesBeforeSave = fnGetMessagesFromContextFilter(oContextFilter, oMessageManager);
					var oActivationPromise = oServices.oDraftController.activateDraftEntity(oContext, false, sRootExpand);
					// Prepare promise object to fetch the header of the active entity

					oBusyHelper.setBusy(oActivationPromise);
					oServices.oApplication.activationStarted(oContext, oActivationPromise);
					oActivationPromise.then(function(oResponse) {
						// clean the message model
						oMessageManager.removeMessages(aStateMessagesBeforeSave);
						resolve(oResponse);
					}, function(oError) {
						var aStateMessageAfterSave = fnGetMessagesFromContextFilter(oContextFilter, oMessageManager);
						var iHighestStateMessageLevel = 0;  // 2 if an error is present in aStateMessageAfterSave, otherwise 1 if a warning is present
						if (aStateMessageAfterSave.length) {
							// compare first message of the after save and compare it with beforesave message
							var oNewMessage = aStateMessageAfterSave[0];
							var bMessagesUnChanged = aStateMessagesBeforeSave.some(function(oOldMessage) {
								return oNewMessage === oOldMessage;
							});
							if (!bMessagesUnChanged) {
								aStateMessageAfterSave.some(function(oMessage){
									if (oMessage.type === "Error"){
										iHighestStateMessageLevel = 2;
										return true;
									}
									if (oMessage.type === "Warning"){
										iHighestStateMessageLevel = 1;
									}								
								});
								if (iHighestStateMessageLevel === 2){ // we have at least one error state message which justifies the issue => transient messages are not needed
									oServices.oApplication.removeTransientMessages();
								}
							}
						}
						if (!oCreateDialogContext) {
							MessageUtils.handleError(MessageUtils.operations.activateDraftEntity, oController, oServices, oError, null, {
								"412": fnHandleWarning.bind(null, aStateMessageAfterSave)
							});
							if (!bWarningOccured) {
								reject();
							} else if (iHighestStateMessageLevel === 1){ // we have at least one warning state message which justifies the issue => transient messages are not needed
								oServices.oApplication.removeTransientMessages();	
							}
						}
					});
				});
			});
			return oRet;
		}

		return {
			createNonDraft: createNonDraft,
			create: create,
			edit: edit,
			directEdit:directEdit,
			enableAutomaticDraftSaving: enableAutomaticDraftSaving,
			discardDraft: discardDraft,
			deleteEntity: deleteEntity,
			activateDraftEntity: activateDraftEntity,
			fnGetMessagesFromContextFilter: fnGetMessagesFromContextFilter
		};
	}
);
