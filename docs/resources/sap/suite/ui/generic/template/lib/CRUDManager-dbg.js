sap.ui.define(["sap/ui/base/Object",
	"sap/ui/generic/app/util/ModelUtil",
	"sap/ui/generic/app/util/ActionUtil",
	"sap/suite/ui/generic/template/lib/MessageUtils",
	"sap/suite/ui/generic/template/lib/CRUDHelper",
	"sap/suite/ui/generic/template/genericUtilities/CacheHelper",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/base/util/extend",
	"sap/base/util/isEmptyObject",
	"sap/suite/ui/generic/template/genericUtilities/FeError",
	"sap/ui/model/Context",
	"sap/m/MessageBox",
	"sap/suite/ui/generic/template/genericUtilities/oDataModelHelper",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/ui/core/message/Message",
	"sap/suite/ui/generic/template/genericUtilities/metadataAnalyser"
], function(BaseObject, ModelUtil, ActionUtil, MessageUtils, CRUDHelper, CacheHelper, testableHelper, extend, isEmptyObject, FeError, Context, MessageBox, oDataModelHelper, controlHelper, Message, metadataAnalyser) {
		"use strict";
        var	sClassName = "lib.CRUDManager";

		var oRejectedPromise = Promise.reject();
		oRejectedPromise.catch(Function.prototype);
		function setResetModelHeader (oModel, sKey, vValue) {
			var mHeaders = oModel.getHeaders();
			var mHeadersCopy = extend({}, mHeaders);
			if (vValue === undefined) {
				delete mHeadersCopy[sKey];
			} else {
				mHeadersCopy[sKey] = vValue;
			}
			oModel.setHeaders(mHeadersCopy);
		}
		function mapToArray (mObj){
			return  Object.keys(mObj).map(function (key){
				return mObj[key];
			});
		}
		/**
		 *
		 * @param {Array} aInput , input array
		 * @returns {Array} having entry as index from 0 to length-1 of aInput
		 */
		function getIndexArray (aInput) {
			if (aInput) {
				return aInput.map(function(input, index) {
					return index;
				});
			}
		}

		function getMethods(oController, oComponentUtils, oServices, oCommonUtils, oBusyHelper) {

			function handleError(sOperation, reject, oError, mParameters) {
				//oError is undefined in case ActionUtil popup's cancel button is clicked
				if (oError) {
					MessageUtils.handleError(sOperation, oController, oServices, oError, mParameters);
				}
				return (reject || Function.prototype)(oError);
			}

			var fnEditEntityImpl; // declare function already here, to avoid usage before declaration
			// This method is called to check about drafts of other users for the entity to be edited.
			// It returns a promise that is settled when this question has been clarified.
			// Actually there are two scenarios in which this method can be called:
			// - If oError is faulty the method is called at the beginning of the editing process. In this case this method
			//   must find out whether
			//   a) Another user possesses a locking draft for the entity -> promise is rejected
			//   b) Another user possesses a non-locking draft for the entity -> promise is resolved as described for function editEntity (see below)
			//   c) No draft exists for this object -> promise is resolved to an empty object
			// - If oError is truthy the back-end has already been called in order to create an edit draft. Thereby the preserveChange-mode was used (see below).
			//   This backend call returned the information that another user possesses a (locking or non-locking) draft for the entity.
			//   oError is the object that was returned from the backend. In this case this method must find out whether
			//   a) The corresponding draft is locking -> promise is rejected
			//   b) The corresponding draft is non-locking -> promise is resolved as described for function editEntity (see below)
			//   c) The draft has meanwhile disappeared (edge case) -> in this case the promise should also resolve as described for function editEntity. Therefore, the function is called once more.
			// In both scenarios in case a) this method is also responsible for error handling. Note that there is a subtle difference between these scenarios in this case.
			// In the second scenario the error message that should be presented to the user can be taken from oError (and thus comes from the backend)
			// In the first scenario the error message is created locally.
			function checkForForeignUserLock(oError) {
				return new Promise(function(resolve, reject) {
					var oComponent = oController.getOwnerComponent();
					// check whether Draft exists
					var oBindingContext = oComponent.getBindingContext();
					var oModel = oComponent.getModel();
					oModel.read(oBindingContext.getPath(), {
						urlParameters: {
							"$expand": "DraftAdministrativeData"
						},
						success: function(oResponseData) {
							if (!oResponseData.DraftAdministrativeData) { // no draft exists for the object at all
								if (oError) { // It seems that the draft that was responsible for producing oError has meanwhile vanished -> Restart the process (edge case)
									//return fnEditEntityImpl(false).then(resolve);
									return handleError(MessageUtils.operations.editEntity, reject, oError);
								}
								return resolve({});
							}
							if (oResponseData.DraftAdministrativeData.InProcessByUser) { // locked by other user
								var sUserDescription = oResponseData.DraftAdministrativeData.InProcessByUserDescription || oResponseData.DraftAdministrativeData
									.InProcessByUser;
								var oErrorPromise = Promise.resolve(oError ||
									oComponentUtils.getMainComponentUtils().then(function(oMainUtils) {
										var sLockText = oMainUtils.getText("ST_GENERIC_DRAFT_LOCKED_BY_USER", [" ", sUserDescription]);
										return new FeError(sLockText);
									}));
								return oErrorPromise.then(function(oError) {
									handleError(MessageUtils.operations.editEntity, reject, oError, oError);
								});
							}
							return resolve({
								draftAdministrativeData: oResponseData.DraftAdministrativeData
							}); // draft for other user exists but is no lock anymore
						},
						error: handleError.bind(null, MessageUtils.operations.editEntity, reject)
					});
				});
			}

			// returns a promise which resolve to the expand parameters of the Main Object( level 1)
			function expandRootIfAllowed() {
				return new Promise( function(fnResolve) {
					var oModel = oController.getView().getModel();
					if (metadataAnalyser.isContentIdReferencingAllowed(oModel)) {
						oComponentUtils.getMainComponentUtils().then(function(oMainUtils) {
							fnResolve(oMainUtils.getRootExpand());
						});
					} else {
						fnResolve(null);
					}
				});
			}

			// This method is called in order to call method editEntity on the TransactionController. It returns a promise as described
			// in the description of method editEntity (see below).
			// Parameter oPrereadData is an object that possily contains administrative data which have already been retrieved.
			// More precisely this object is either empty or contains a property draftAdministrativeData.
			// In this second case the promise returned by this method should just resolve to oPrereadData.
			// oDraftMainTreeDetails holds the binding context, view and entityset info. of the Main TreeNode (level 1)
			function fnCallEdit(oDraftMainTreeDetails, bUnconditional, oPrereadData) {
				var oMainTreeBindingContext = oDraftMainTreeDetails.bindingContext;
				if (oPrereadData && oPrereadData.draftAdministrativeData) {
					return Promise.resolve(oPrereadData);
				}

				return expandRootIfAllowed().then(function(sExpand) {
					return new Promise(function(resolve, reject) {
						oServices.oTransactionController.editEntity(oMainTreeBindingContext, !bUnconditional, sExpand)
							.then(function(oResponse) { //success

								// The active context is invalidated as the DraftAdministrativeData of the context(the active context) has changed after draft creation.
								// This is done to keep the DraftAdministrativeData of the record updated.
								// Direct invalidation of the active context may
								//     a) lead to strange behaviour on the UI.
								//     b) lead to immediate reload of the data.
								// With modelContextChange we wait till the object page is not bound to the active context.
								var oTreeLevelOneView;
								oTreeLevelOneView = oDraftMainTreeDetails.view;
								var fnInvalidateActiveContext = function() {
									oMainTreeBindingContext.getModel().invalidateEntry(oMainTreeBindingContext);
									oTreeLevelOneView.detachEvent("modelContextChange", fnInvalidateActiveContext);
								};
								if (oTreeLevelOneView) {
									oTreeLevelOneView.attachEvent("modelContextChange", fnInvalidateActiveContext);
								}

								return resolve({
									context: oResponse.context
								});
							}, function(oResponse) { // error handler
								if (oResponse && oResponse.response && oResponse.response.statusCode === "409" && !bUnconditional) { //there might be unsaved changes
									//remove transient message associated with rc 409 in order to prevent message pop-up
									oServices.oApplication.removeTransientMessages();
									return checkForForeignUserLock(oResponse).then(resolve, reject);
								} else {
									handleError(MessageUtils.operations.editEntity, reject, oResponse, oResponse);
								}
							}
						);
					});
				});
			}

			// This method implements main functionality of  editEntity (see below). Only busy handling is not done in this function.
			// The function returns a promise that gets resolved to an object when Edit request and target key info. both are retrieved.
			// For draft application, the promise resolve to object with the response context object from editEntity call and the sibling target key information
			// For non-draft application, the promise resolve to object having current View's binding context object and undefined
			fnEditEntityImpl = function(bUnconditional) {
				var bIsDraftEnabled = oComponentUtils.isDraftEnabled();
				var oRet, oTargetKeyPromise;
				if (bIsDraftEnabled) {
					var iViewLevel = oComponentUtils.getViewLevel();
					var oMainTreeLevelOneDetails;
					if (iViewLevel > 0) {
						oMainTreeLevelOneDetails = oComponentUtils.getMainComponentDetails();
						var bContextRegistered = oServices.oApplication.checkContextData(oMainTreeLevelOneDetails.bindingContext);
						if (!bContextRegistered) {
							oServices.oApplication.registerContext(oMainTreeLevelOneDetails.bindingContext, 1, oMainTreeLevelOneDetails.entitySet, oServices.oApplication.getCurrentKeys(1));
						}
						oTargetKeyPromise = oComponentUtils.getTargetKeyFromLevel(2);
					}
					if (!bUnconditional) {
						// In this case we must ensure that a non-locking draft of another user is not overwritten without notice.
						// There are two strategies for that:
						// - First read the draft administrative data in order to check for this information
						// - Call backend to create draft in a mode where every draft of another user is consideres as a lock
						// The second possibility is preferred. However it is only suitable when the OData Service supports this mode (called preserveChange-mode)
						var oDraftContext = oServices.oDraftController.getDraftContext();
						var bPreserveChanges = oDraftContext.hasPreserveChanges(oMainTreeLevelOneDetails.bindingContext);
						if (!bPreserveChanges) { // Must use strategy 1 -> first check for Foreign user locks then start editing
							oRet = checkForForeignUserLock().then(fnCallEdit.bind(null, oMainTreeLevelOneDetails, true));
						}
					}
					// in draft cases with strategy 2 call edit functionality directly,
					oRet = oRet || fnCallEdit(oMainTreeLevelOneDetails, bUnconditional, {});
					oServices.oApplication.editingStarted(oMainTreeLevelOneDetails.bindingContext, oRet);
				} else {
					// in case of NonDraft resolve to the current view's binding context
					var oCurrentBindingContext = oController.getView().getBindingContext();
					oRet = Promise.resolve({
						context: oCurrentBindingContext
					});
				}
				var oEditResponseTargetKey = Promise.all([oRet, oTargetKeyPromise]);
                return oEditResponseTargetKey.then(function(aResult) {
					var oResponse = {};
					// editContextKey can be either "context" (when the editing can start) or "draftAdministrativeData" (when there exists a non-locking draft of another user)
					var editContextKey = Object.keys(aResult[0])[0];
					oResponse[editContextKey] = aResult[0][editContextKey];
                    oResponse.targetSiblingKey = aResult[1];
                    return oResponse;
                });
			};

			// This method is called when a user starts to edit the active entity.
			// This method deals with busy handling and sensing error messages, but not with other dialogs.
			// Parameter bUnconditional specifies whether the user has already confirmed that he is willing to overwrite other users non-locking drafts.
			// The method returns a promise which resolves to an object holding the response context and target treenode and sibling key information.
			// The promise is rejected when the user must not edit the object (which may be caused by technical or semantical problems).
			// In this case error handling has been performed by this method.
			// The resulting object may contain properties context/draftAdministrativeData and targetSiblingKey
			// The object contains property 'draftAdministrativeData' when there exists a non-locking draft of another user (this can only be the case when bUnconditional is false)
			// The property, 'draftAdministrativeData' contains the draft administrative data of the non-locking draft.
			// When the editing can start, the object contains the property 'context',this property contains the context of the entity to be edited. 
			// The object also holds 'targetSiblingKey' property containing the target sibling keys and treeNode info. in case of draft application and for non-draft application this property will hold value undefined
			function editEntity(bUnconditional) {
				if (oBusyHelper.isBusy()) {
					return oRejectedPromise;
				}
				var oRet = fnEditEntityImpl(bUnconditional);
				oBusyHelper.setBusy(oRet);
				return oRet;
			}

			function getDeleteEntityPromise(bIsActiveEntity, bHasActiveEntity, oContext) {
				var oRet = new Promise(function(resolve, reject) {
					var fnHandleSuccess = function() {
						var sEntitySet = ModelUtil.getEntitySetFromContext(oContext);
						var oDraftContext = oServices.oDraftController.getDraftContext();
						var bRoot = oDraftContext.isDraftRoot(sEntitySet);
						var iViewLevel = oComponentUtils.getViewLevel();
						var sMessageText = iViewLevel >= 2 ? oCommonUtils.getText("ITEM_DELETED") : oCommonUtils.getText("ST_GENERIC_OBJECT_DELETED");

						// replace the message only for the root.
						if (!bIsActiveEntity && bRoot) {
							sMessageText = oCommonUtils.getText(bHasActiveEntity ? "ST_GENERIC_DRAFT_WITH_ACTIVE_DOCUMENT_DELETED" : "ST_GENERIC_DRAFT_WITHOUT_ACTIVE_DOCUMENT_DELETED");
						}
						MessageUtils.showSuccessMessageIfRequired(sMessageText, oServices);
					};
					var fnHandleResponse = function (aFailedPathes){
						// If there is no failed path means it is success case
						if (aFailedPathes.length === 0) {
							fnHandleSuccess();
							resolve();
						} else {
							MessageUtils.handleError(MessageUtils.operations.deleteEntity, oController, oServices, aFailedPathes[0].oError, null);
							reject();
						}
					};
					var oDeletePromise = deleteEntities({
						pathes: [oContext.getPath()],
						withWarningDialog: true
					});
					oDeletePromise.then(fnHandleResponse, reject);
				});
				return oRet;
			}

			/*
			 * Deletes current OData entity. The entity can either be a
			 * non-draft document or a draft document. *
			 * Note: This method does not care for busy handling. So this has to be done by the caller.
			 * @returns {Promise} A <code>Promise</code> for asynchronous
			 *          execution
			 * @public
			 */
			function deleteEntity(){
				var oContext = oController.getView().getBindingContext();
				var bIsActiveEntity = oServices.oDraftController.isActiveEntity(oContext);
				return CRUDHelper.deleteEntity(oServices.oDraftController, getDeleteEntityPromise, oServices.oApplication, oContext, bIsActiveEntity, "deleteAction");
			}
			/**
			 *
			 * @param {Array} aPath, Array of vPaths, vPaths can be String or Number
			 * @param {Array} aDeleteResults, Array of Responses to be parsed
			 * @param {Boolean} bWithWarningDialog, flag to decied, whether to extract messages from message model or not
			 */

			function fnParseResponse(aPath, aResponses, bWithWarningDialog) {
				var mResult = {
					mFailed: Object.create(null),
					mSuccess: Object.create(null),
					mWarning: Object.create(null),
					aMessagesForUserDecision: []
				};
				// Filtering of Results in groups
				for (var i = 0; i < aPath.length; i++){
					var vPath = aPath[i];
					var oResult = aResponses[i];
					var oParsedResult = MessageUtils.parseError(oResult);
					var iStatusCode = parseInt(oParsedResult.httpStatusCode, 10);
					var mHttpHeaders = oResult && oResult.response && oResult.response.headers;
					if ((iStatusCode >= 200 && iStatusCode < 300) || iStatusCode === 304){
						mResult.mSuccess[vPath] = oResult;
					} else if (iStatusCode === 412 && mHttpHeaders && mHttpHeaders["preference-applied"]) {
						// When status code is 412, with header is preferenced applied, we treat this special scenrio as
						// warning case. A special handling of showing confirmation popup is done in this case.
						mResult.mWarning[vPath] = oResult;
					} else {
						mResult.mFailed[vPath] = oResult;
					}
				}
				if (!isEmptyObject(mResult.mWarning) && bWithWarningDialog){
					mResult.aMessagesForUserDecision = oServices.oApplication.getTransientMessages();
					oServices.oApplication.removeTransientMessages();
				}
				return mResult;
			}

			/**
			 * Deletes current OData entity. The entity can either be a non-draft document or a draft document. *
			 *
			 * @param {Object} oSettings: has following information
			 * oSettings.smartTable: smart table the entries are coming from
			 * oSettings.pathes: paths (strings) which identify the entities
			 * oSettings.onlyOneDraftPlusActive: this flag tells that when 2 items is request for deleteion one of
			 * them is draft and other is active of that draft, so that we can handle 412 warning case . Currently only this
			 * scenario is supported in delete. This flag will be replace or removed when we start handling multiselect delete
			 * with 412 scenario.
			 * @returns {Promise} A <code>Promise</code> for asynchronous execution
			 * If the Promise is rejected all necessary dialogs have been performed by this function. If the Promise is resolved
			 * it is the task of the caller to give feedback to the user.
			 * Therefore, the Promise resolves to an array which contains an entry for every failed delete request. The corresponding entry is
			 * an object with the following attributes: sPath (corresponding entry from oSettings.pathes), oError (the error response), isWarning (indicates whether delete was refused with a 412 warning)
			 * @public
			 */
			function deleteEntities(oSettings) {
				var oRet = new Promise(function(outerResolver, outerReject) {
					var mObjectsToDelete = Object.create(null);
					var mResolveInfo = Object.create(null);
					var fnPromiseFunction = function(sPath, resolveSingle, rejectSingle){
						mResolveInfo[sPath] = {
							resolve: resolveSingle,
							reject: rejectSingle
						};
					};
					for (var k = 0; k < oSettings.pathes.length; k++){
						var sPath = oSettings.pathes[k];
						mObjectsToDelete[sPath] = new Promise(fnPromiseFunction.bind(null, sPath));
					}
					oServices.oApplication.prepareDeletion(mObjectsToDelete, oSettings.suppressRefreshAllComponents);
					// Three maps of pathes to repsonses:
					var mSuccess = Object.create(null); // Collects all successfull deletions
					var mFailed = Object.create(null);  // Collects all objects that cannot be deleted at all
					var mWarning; // Contains the objects which have been rejected with a 412 in the last attempt
					var fnDone = function(bShouldReject){ // will be called when the final result of the deletion process is known
						if (!isEmptyObject(mSuccess)){
							oServices.oApplication.markCurrentDraftAsModified();
						}
						for (var sPath in mResolveInfo){
							var oResolveInfo = mResolveInfo[sPath];
							oResolveInfo[mSuccess[sPath] ? "resolve" : "reject"]();
						}
						if (bShouldReject){
							return outerReject();
						}
						// outerResolver should be called. Build the array representing the failed requests as specified above.
						var aFailedPathes = oSettings.pathes.map(function(sPath){
							return {
								sPath: sPath,
								oError: mFailed[sPath] || mWarning[sPath],
								isWarning: !!mWarning[sPath]

							};
						}).filter(function(oErrorInfo){
							return !!oErrorInfo.oError;
						});
						outerResolver(aFailedPathes);
					};
					var fnShowConfirmationOrResolve = function(aMessagesForUserDecision){
						if (aMessagesForUserDecision.length > 0){
							var oCRUDActionHandler = oComponentUtils.getCRUDActionHandler();
							var mParameters = {messagesForUserDecison: aMessagesForUserDecision};
							oCRUDActionHandler.handleCRUDScenario(4, fnInvokeDeletion.bind(null, Object.keys(mWarning), false, false), fnDone.bind(null, true), "Delete", mParameters);
							return;
						}
						fnDone();
					};
					var fnInvokeDeletion = function(aPath, bStrict, bWithWarningDialog){ // Note that this method might be called twice: First with all objects to be deleted. Second with confirmed 412s.
						if (oSettings.suppressRefreshAllComponents && oSettings.smartTable){
							// Referesh the table with same batch group Id to merge the get call with above delete action
							oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSettings.smartTable).refresh("Changes");
						}
						var fnHandleResponse = function(aDeleteResults){
							var oParsedDeleteResult = fnParseResponse(aPath, aDeleteResults, bWithWarningDialog, oSettings.onlyOneDraftPlusActive);
							mFailed = extend(mFailed, oParsedDeleteResult.mFailed);
							mSuccess = extend(mSuccess, oParsedDeleteResult.mSuccess);
							mWarning = oParsedDeleteResult.mWarning;
							fnShowConfirmationOrResolve(oParsedDeleteResult.aMessagesForUserDecision);
						};
						var oDeletePromise = oServices.oTransactionController.deleteEntities(aPath, {
							bIsStrict: bStrict
						}).then(fnHandleResponse, fnHandleResponse);
						oBusyHelper.setBusy(oDeletePromise);
					};
					// We only support warning dialog in following cases:
					// 1. One items is selected from LR table( either active or draft)
					// 2. One item is selectd which is draft and its active also exist, tested by condition: oSettings.onlyOneDraftPlusActive
					// Also caller should tell specifically by flag oSettings.withWarningDialog, that they want this delete to be performed with possibility to warn
					var bWithWarningDialog = oSettings.withWarningDialog && (oSettings.pathes.length === 1 || oSettings.onlyOneDraftPlusActive);
					fnInvokeDeletion(oSettings.pathes, true, bWithWarningDialog);
				});
				return oRet;
			}

			function discardDraft(oContext){
				return CRUDHelper.discardDraft(oServices.oDraftController, oServices.oTransactionController, oServices.oApplication, oContext);                       
			}

			/*
			 * Update multiple Enities.
			 *
			 * @param {Array} aContextToBeUpdated: context path and data to be updated
			 * @returns {Promise} A <code>Promise</code> for asynchronous execution
			 * @public
			 */
			function updateMultipleEntities(aContextToBeUpdated) {
				var fnHandleResponse = function(aUpdateResults) {
					var aSelectedContextPath = [];
					aContextToBeUpdated.forEach(function (oContext) {
						aSelectedContextPath.push(oContext.sContextPath);
					});
					var oParsedUpdateResult = fnParseResponse(aSelectedContextPath, aUpdateResults);
					// The error and warning scenarios are handled via transient handling. 
					// We only need to show message to user regarding records that are updated, Hence returning only successfull responses.
					// In future if we need to show/use info about error and warning cases, oParsedUpdateResult contains that info as well.
					var aSuccess = mapToArray(oParsedUpdateResult.mSuccess);
					return aSuccess;
				};
				var oUpdatePromise = oServices.oTransactionController.updateMultipleEntities(aContextToBeUpdated).then(fnHandleResponse, fnHandleResponse);
				oBusyHelper.setBusy(oUpdatePromise);
				return oUpdatePromise;
			}

			/**
			 * This method return all the mandatory field that are not field after clicking save
			 * @returns return all mandatory field as a property path that are not fill else return empty array
			 */
			function fnGetUnfilledMandatoryFields(oModel) {
				var oInsertRestrictionObject = oModel.getMetaModel().getODataEntitySet(oController.getOwnerComponent().getEntitySet())["Org.OData.Capabilities.V1.InsertRestrictions"],
					aUnfilledMandatoryFields = [];
				if (oInsertRestrictionObject && oInsertRestrictionObject.RequiredProperties){
					var oObjectPageValues = oController.getView().getBindingContext().getObject();
					oInsertRestrictionObject.RequiredProperties.forEach(function(oProperty){
						if (!oObjectPageValues[oProperty["PropertyPath"]]){
							aUnfilledMandatoryFields.push(oProperty["PropertyPath"]);
						}
					});
				}
				return aUnfilledMandatoryFields;
			}

			function getMetaDataProperties(oModel) {
				var	oEntityType = oModel.oMetaModel.getODataEntitySet(oController.getOwnerComponent().getEntitySet()),
					oMetaDataProperties = oModel.oMetaModel.getODataEntityType(oEntityType.entityType);
					return oMetaDataProperties;
			}

			function fnShowUnfilledMandatoryFieldsMessage(aUnfilledMandatoryFields, oMessageManager, oTargetInfo, oModel) {

				oMessageManager.removeAllMessages(); //Clear all previous message
				var oMetaDataProperties = getMetaDataProperties(oModel);

				aUnfilledMandatoryFields.forEach(function(sMandatory){

					var sTarget = oTargetInfo.target,
						sFullTarget = oTargetInfo.fullTarget,
						sLabel = oModel.oMetaModel.getODataProperty(oMetaDataProperties, sMandatory) && oModel.oMetaModel.getODataProperty(oMetaDataProperties, sMandatory)["sap:label"];

					if (sLabel) {
						var oMessage = new Message({
							message: oCommonUtils.getSpecializedText("ENTER_MANDATORY", sMandatory, null, [sLabel]),
							persistent: false,
							technical: false,
							target: sTarget + "/" + sMandatory,
							fullTarget: sFullTarget + "/" + sMandatory,
							type: sap.ui.core.MessageType.Error,
							processor: oModel
						});
						oMessageManager.addMessages(oMessage);
					}
				});
				oServices.oTemplateCapabilities.oMessageButtonHelper.showMessagePopover();
			}

			/**
			 * Implementation of save for non-draft entities. This method also takes care of warning sent with 412 HTTPStausCode.
			 * Will reject the caller promise if, during save backend throws error. If, backend throws warning with 412 HTTPStatusCode,
			 * it will wait for user's decision before rejecting or redoing the save.
			 * @param {Function} resolve: is resolver of caller function
			 * @param {Function} reject: is resolver of caller function
			 * @param {Object} oCreateWithDialogFilters: context filters, when we create object using Dialog in LR and save.
			 */

			function saveEntityImpl(resolve, reject, oCreateWithDialogFilters) {
				if (oBusyHelper.isBusy()) {
					reject();
					return;
				}
				// Prepare message handling by storing information which messages have been available before saving
				var oMessageManager, aMessagesBeforeSave, mMessagesBeforeSave = Object.create(null), aMessagesBeforeSave;
				oMessageManager = sap.ui.getCore().getMessageManager();
				var oContextFilter =  oCreateWithDialogFilters ? oCreateWithDialogFilters : oServices.oTemplateCapabilities.oMessageButtonHelper && oServices.oTemplateCapabilities.oMessageButtonHelper.getContextFilter(false);
				aMessagesBeforeSave = CRUDHelper.fnGetMessagesFromContextFilter(oContextFilter, oMessageManager, true);
				aMessagesBeforeSave = aMessagesBeforeSave.map(function(oMessage){
					mMessagesBeforeSave[oMessage.getId()] = oMessage;
					return oMessage;
				});
				var oModel = oController.getView().getModel();
				
				//Create mandatory check is not performed in case of Create with dialogue.
				if (!oCreateWithDialogFilters) {
					var aUnfilledMandatoryFields = fnGetUnfilledMandatoryFields(oModel);
					if (aUnfilledMandatoryFields.length > 0) {
						fnShowUnfilledMandatoryFieldsMessage(aUnfilledMandatoryFields, oMessageManager, oServices.oTemplateCapabilities.oMessageButtonHelper.getTargetInfo(oModel), oModel);
						reject();
						return;
					}
				}

				// Handles the 412 Warning case.
				var fnHandleWarning = function(){
					var oCRUDActionHandler = oComponentUtils.getCRUDActionHandler();
					oCRUDActionHandler.handleCRUDScenario(4, fnSaveInternal.bind(null, false), reject, "Activate");
				};
				var fnSaveInternal = function(bStrict){
					if (bStrict) {
						setResetModelHeader(oModel, "Prefer", "handling=strict");
					} else {
						setResetModelHeader(oModel, "Prefer", "handling=lenient");
					}
					var oSubmitChange = oServices.oTransactionController.triggerSubmitChanges();
					oSubmitChange.then(function(oResponse) {
							setResetModelHeader(oModel, "Prefer");
							// clean the message model
							oMessageManager.removeMessages(aMessagesBeforeSave);
							resolve(oResponse.context);
					}, function(oError) {
						var bWarningOccured = false;
						setResetModelHeader(oModel, "Prefer");
						var aNewMessages = [];
						var aMessagesAfterSave = CRUDHelper.fnGetMessagesFromContextFilter(oContextFilter, oMessageManager, true);
						var aAllMessages = aMessagesAfterSave.map(function(oMessage){
							if (!mMessagesBeforeSave[oMessage.getId()]) { // if this is a new message
								oMessage.persistent = false;
								oMessage.technical = false;
								bWarningOccured = bWarningOccured || oMessage.technicalDetails.statusCode === "412" && oMessage.technicalDetails.headers["preference-applied"] === "handling=strict";
								aNewMessages.push(oMessage);
							}
							return oMessage;
						});
						// Now aAllMessages contains all messages (according to the oContextFilter) and aNewMessages only those which have been added by the current attempt to save.
						// If no new message is there (but we are in an error scenario anyway) we assume that a technical error occured that prevented the backend to test the current state.
						// Therefore, we just keep the state of the message model as it is.
						// If there is at least one new message we assume that the backend has checked the object (and found business errors). Thus, the old messages can be removed and only the new messages
						// have to stay. However, we delete all messages and then add the new ones. This ensures, that the message model gets a change event even if no message has been there before.
						// This will trigger the follow-up activities.
						if (aNewMessages.length) {
							oMessageManager.removeMessages(aAllMessages);
							oMessageManager.addMessages(aNewMessages);
							if (bWarningOccured && bStrict) {
								// If warning occured in strict mode, show the confimation popup and wait for user's decision.
								fnHandleWarning();
								return;
							}
							if (!oCreateWithDialogFilters) {
								oServices.oTemplateCapabilities.oMessageButtonHelper.showMessagePopover();
							}
						}
						reject();
					});
					oBusyHelper.setBusy(oSubmitChange);
				};
				fnSaveInternal(true);
			}

			/*
			 * Saves current OData entity. Only used in non-draft scenario.
			 *
			 * @param {object} oCreateWithDialogFilters filters to handle error scenario if create with dialog enabled on LR
			 * @returns {Promise} A <code>Promise</code> for asynchronous execution
			 * @public
			 */
			function saveEntity(oCreateWithDialogFilters) {
				var oFilterForCreateWithDialog = oCreateWithDialogFilters;
				var oRet = new Promise(function(fnResolve, fnReject) {
					oServices.oApplication.performAfterSideEffectExecution(saveEntityImpl.bind(null, fnResolve, fnReject, oFilterForCreateWithDialog));
				});
				return oRet;
			}

			/*
			 * Activates a draft OData entity. Only the root entity can be activated.
			 *
			 * @returns {Promise} A <code>Promise</code> for asynchronous execution
			 * @public
			 */
			function activateDraftEntity(oCreateDialogContext, oCreateWithDialogFilter) {
				return CRUDHelper.activateDraftEntity(oCreateDialogContext, oCreateWithDialogFilter, oBusyHelper, oServices, oController, oComponentUtils);
			}

			function getActionUtil(mParameters){
				return new ActionUtil(mParameters);
			}

			/*
			 * Calls generic app layer to get default values. If oPredefinedValues are passed then it overrides the values returned from the default values function.
			 * Default value function is invoked when the application is non-draft (or) inline creation rows feature enabled	
			 * @param {object} oEventSource to extract context and entityset
			 * @param {object} oPredefinedValues existing predefined values
			 * @param {boolean} bIsInlineCreationRowsEnabled is inline creation rows feature enabled
			 * @returns {Promise} A <code>Promise</code> for default value function predefined values are returned if no default values function exists. If both are not available then an empty object is returned.
			 * @public
			 */
			function getDefaultValues(oEventSource, oPredefinedValues, bIsInlineCreationRowsEnabled) {
				if (!oComponentUtils.isDraftEnabled() || bIsInlineCreationRowsEnabled) {
					var oContext, sNavigationProperty;
					var oPresentationControlHandler = oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oCommonUtils.getOwnerPresentationControl(oEventSource));
					var sEntitySet = oPresentationControlHandler.getEntitySet();

					// For tables in Object page binding context will be present and the binding path will be different from the table entity set.
					// In this case navigation property of the table should be passed to get function import annotated under the default values function (which will be annotated under object page entity type / navigation property)
					var oPresentationControlBindingContext = oPresentationControlHandler.getBindingContext();
					if (oPresentationControlBindingContext && (oPresentationControlBindingContext.getPath() !== sEntitySet)) {
						oContext = oPresentationControlBindingContext;
						sNavigationProperty = oPresentationControlHandler.getBindingPath();
					} else {
						oContext = new Context(oPresentationControlHandler.getModel(), "/" + sEntitySet);
					}
					return oServices.oTransactionController.getDefaultValues([oContext], [oPredefinedValues], sNavigationProperty);
				} else {
					return oPredefinedValues;
				}
			}

			function callActionImpl(mParameters, oState, fnResolve, fnReject){
				if (oBusyHelper.isBusy()){
					fnReject();
					return;
				}
				var aSuccess = [];
				var aFailed = [];
				var aWarning = [];
				var bSuccess = false;
				var mAdditionalParmsData;
				var aWarningIndex = [];
				var sFunctionImportPath = mParameters.functionImportPath;
				var aCurrentContexts = mParameters.contexts || [];
				var oSourceControlHandler = mParameters.sourceControlHandler;
				// Code to support context Independent actions with parameter
				// If the context is not present then a new context will be created.
				if (aCurrentContexts.length === 0 && oSourceControlHandler) {
					var oModelForContext = oSourceControlHandler.getModel();
					var sPath = "/";
					var sEntitySetForContext = oSourceControlHandler.getEntitySet();
					var sEntityPath = sPath.concat(sEntitySetForContext);
					aCurrentContexts.push(new Context(oModelForContext, sEntityPath));
				}
				var sFunctionImportLabel = mParameters.label;
				var sOperationGrouping = mParameters.operationGrouping;
				var oSkipProperties = mParameters.skipProperties;
				var fnCleanUpContext =  function(){
					// remove pending request from the last change of the model
					// actually, this should rather be done by ActionUtil itself
					if (aCurrentContexts[0]){
						var oModel = aCurrentContexts[0].oModel;
						if (oModel && oModel.hasPendingChanges()){
							oModel.resetChanges();
						}
					}
				};

				var fnActionPopUpReject = function(oError){
					// function is called, when the user cancels the action (on the popup to enter parameters - before sending a request to the backend)
					fnCleanUpContext();
					fnReject(oError);
				};

				var fnShowWarningPopupIfRequired = function (aMessagesForUserDecision, fnDone){
					if (aMessagesForUserDecision.length > 0){
						var oCRUDActionHandler = oComponentUtils.getCRUDActionHandler();
						var fnBoundAction;
						if (aCurrentContexts.length === 0){
							fnBoundAction = fnInvokeAction.bind(null, false, false, aCurrentContexts);
						} else {
							var aWarningContext = aCurrentContexts.filter(function (oContext, index){
								return aWarningIndex.includes("" + index);
							});
							fnBoundAction = fnInvokeAction.bind(null, false, false, aWarningContext);
						}
						var mParameters = {
							messagesForUserDecison: aMessagesForUserDecision,
							actionName: sFunctionImportLabel
						};
						oCRUDActionHandler.handleCRUDScenario(4, fnBoundAction, fnDone, "BOPFAction", mParameters);
						return;
					}
					fnDone();
				};

				// For now we are only supporting warning handling in case of single selection.
				var bWithWarningDialog = aCurrentContexts.length <= 1;

				var fnInvokeAction = function (bIsStrict, bWithWarningDialog, aContexts){
					if (!bIsStrict){
						// if bIsStrict is false means we are coming after accepting warnings, Thus we should be cleaning the pervious
						// context
						fnCleanUpContext();
					}
					var oActionProcessor = getActionUtil({
						controller: oController,
						contexts: aContexts,
						applicationController: oServices.oApplicationController,
						operationGrouping: sOperationGrouping
					});
					oActionProcessor.call(sFunctionImportPath, sFunctionImportLabel, oComponentUtils.isDraftEnabled(), oSkipProperties, bIsStrict, mAdditionalParmsData).then(function(oResult){
						var oSessionParams = {};
						oSessionParams.actionLabel = sFunctionImportLabel;
						oBusyHelper.setBusy(oResult.executionPromise, null, oSessionParams);
						oResult.executionPromise.then(fnHandleResponse,fnHandleResponse);
					}, fnActionPopUpReject);

					var fnHandleResponse = function(vResponse) {
						var aResponse = Array.isArray(vResponse) ? vResponse : [vResponse];
						var aPaths = getIndexArray(aResponse);
						// We need to properly formate response in order to correctly parse it
						var aFormattedResponse = aResponse.map(function (oResp){
						    var resp = oResp.error || oResp.response;
						    if (resp){
							   resp.actionContext = oResp.actionContext;
							}
						  return resp;
						});
						// userEnteredAdditionalParams represents the parameter that user has entered in parameter dialog,
						// We get back these param in order to fill the parameter dialog, when user accepts the warning and proceeds.
						// We do this to avoid reentering the same data again in paramater dialog.
						mAdditionalParmsData = aResponse[0].userEnteredAdditionalParams;
						var oParsedResult = fnParseResponse(aPaths, aFormattedResponse, bWithWarningDialog);
						aFailed = aFailed.concat(mapToArray(oParsedResult.mFailed));
						aSuccess = aSuccess.concat(mapToArray(oParsedResult.mSuccess));
						aWarningIndex = Object.keys(oParsedResult.mWarning);
						aWarning = mapToArray(oParsedResult.mWarning);
						fnShowWarningPopupIfRequired(oParsedResult.aMessagesForUserDecision, fnDone.bind(null, aResponse));
					};
					var fnDone = function(aResponses){
						var aTotalResp = aFailed.concat(aSuccess.concat(aWarning));
						if (aTotalResp.length > 1){
							// case for multiple selection. Some of them may fail or throw warning, so show a hint if any warning occurs.
							var bWarningOccured = aWarning.length > 0;
							var aTotalFailed = aFailed.concat(aWarning);
							var iTotalResponse = aTotalResp.length;
							var iTotalFailed = aTotalFailed.length;
							if (iTotalFailed > 0){
								var sMessageText;
								if (iTotalResponse === iTotalFailed){
									sMessageText = oCommonUtils.getText("ST_GENERIC_NOT_PROCESSED_RECORDS_PLURAL");
								} else {
									sMessageText = oCommonUtils.getText("ST_GENERIC_NOT_PROCESSED_RECORDS", [iTotalFailed, iTotalResponse]);
								}
								if (bWarningOccured){
									sMessageText = sMessageText + '\n';
									if (iTotalFailed === 1){
										sMessageText = sMessageText + oCommonUtils.getText("ST_GENERIC_ACTION_WITH_WARNING_SUGGESTION_SINGULAR");
									} else {
										sMessageText = sMessageText + oCommonUtils.getText("ST_GENERIC_ACTION_WITH_WARNING_SUGGESTION_PLURAL");
									}
								}
								oBusyHelper.getUnbusy().then(function (){
									if (aFailed.length > 1){
										MessageBox.error(sMessageText);
									} else {
										MessageBox.warning(sMessageText);
									}
								});
							}
						}
						var oResponse, oResponseContext;
						bSuccess = bSuccess || oActionProcessor.getExecutedSuccessfully();
						if (bSuccess){
							var oActionContext;
							if (aSuccess.length === 1 && aWarning.length === 0 && aFailed.length === 0){
								// only one context, handle as single action call
								oResponse = aSuccess[0];
								oActionContext = aResponses[0].actionContext;
							}
							oResponseContext = oResponse && oResponse.context;
							var oContextInfo;
							if (oResponseContext && oResponseContext.getObject()){
								oContextInfo = oServices.oApplication.registerContext(oResponseContext);
							}

							if (oResponseContext && oResponseContext !== oActionContext && oResponseContext.getPath() !== "/undefined"){
								oServices.oApplication.navigateToDetailContextIfPossible(oResponseContext, false, oContextInfo.bIsDraft ? 2 * (1 + oContextInfo.bIsCreate) : 1, oContextInfo);
							}
							var oTableBindingInfo = oSourceControlHandler && oSourceControlHandler.getBindingInfo();
							var oListBinding = oTableBindingInfo && oTableBindingInfo.binding;
							if (oListBinding && oListBinding.oEntityType){
								// update the enablement of toolbar buttons
								oSourceControlHandler.setEnabledToolbarButtons();

								// update the enablement of footer button if on the List Report/ALP
								if (oComponentUtils.getViewLevel() === 0){
									oSourceControlHandler.setEnabledFooterButtons();
								}
							}
							fnResolve(aTotalResp);
						} else {
							fnCleanUpContext();
							fnReject(aTotalResp);
						}
					};
				};
				fnInvokeAction(true, bWithWarningDialog, aCurrentContexts);
			}

			/*
			 * Calls an OData action (also called OData function import). Afterwards the message handling
			 * is triggered for the returned messages.
			 *
			 * @param {object} mParameters Parameters which are used to identify and fire action
			 * @param {array} mParameters.contexts Contexts relevant for action
			 * @param {string} mParameters.functionImportPath Path to the OData function import
			 * @param {object} [mParameters.sourceControlHandler] Control handler where a navigation starts (e.g. table)
			 * @param {object} [mParameters.navigationProperty] Property to navigate after action
			 * @param {string} [mParameters.label] Text for the confirmation popup
			 *
			 * @returns {Promise} A Promise that resolves if the action has been executed successfully
			 *
			 * @public
			 */
			function callAction(mParameters, oState) {
				var oRet = new Promise(function(fnResolve, fnReject){
					oServices.oApplication.performAfterSideEffectExecution(callActionImpl.bind(null, mParameters, oState, fnResolve, fnReject));
				});
				return oRet;
			}

			/*
			 * Adds an entry to a table. Only called in draft scenarios.
			 *
			 * @param {sap.ui.table.Table|sap.m.Table|sap.ui.comp.smarttable.SmartTable} oTable The table to which an entry has been added
			 */
			function addEntry(oTable, oPredefinedValues) {
				if (!oTable) {
					throw new FeError(sClassName, "Unknown Table");
				}

				var sBindingPath = "";
				var sTableBindingPath = "";
				var sEntitySet;
				var oComponent = oController.getOwnerComponent();
				var oAppComponent = oComponent.getAppComponent();
				if (oComponent.getMetadata().getName() === "sap.suite.ui.generic.template.ListReport.Component") { // ToDo: OPAs for the inline create in object page and sub object page, as the current OPA mockserver setup has to be enhanced we have planned to do in using a internal backlog - LROPBANGALORE5-1093
					sEntitySet = (oComponent.getCreationEntitySet && oComponent.getCreationEntitySet()) || (oTable.getEntitySet && oTable.getEntitySet());
				} else {
					sEntitySet = (oComponent.getCreationEntitySet && oComponent.getCreationEntitySet()) ||  oComponent.getEntitySet();
				}
				var oView = oController.getView();
				var oModel = oView.getModel();
				var oViewContext = oView.getBindingContext();
				if (oViewContext) {
					// Detail screen
					sTableBindingPath = oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oCommonUtils.getOwnerPresentationControl(oTable)).getBindingInfo().path;

					// get entityset of navigation property
					var oMetaModel = oModel.getMetaModel();
					var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
					var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
					var oNavigationEnd = oMetaModel.getODataAssociationSetEnd(oEntityType, sTableBindingPath);
					if (oNavigationEnd) {
						sEntitySet = oNavigationEnd.entitySet;
					}

					// create binding path
					sTableBindingPath = "/" + sTableBindingPath;
					sBindingPath = oComponent.getComponentContainer().getElementBinding().getPath() + sTableBindingPath;
				} else {
					// on list, support only one entityset mapped to the root component
					sBindingPath = "/" + sEntitySet;
				}

				return new Promise(function(fnResolve, fnReject) {
					var fnSetBusy = function(oBusyPromise){
						var oBusyHelper = oServices.oApplication.getBusyHelper();
						oBusyHelper.setBusy(oBusyPromise);
						oServices.oApplication.setNextFocus(Function.prototype); // Prevent default handling in error case. Focus for success should be set there. 
					};
					// Method will be called in case the create has to be performed on a DraftEntity. For better performance Fe would check
					// whether the expand information in the PreProcessor data is stored in the localStorage. In case this is available Fe
					// will pass the expand nodes and read the newly created instance information. PreProcessor data is always stored with
					// a cache key which ensures Fe don't work with stale data
					var oInfoForContentIdPromise = CacheHelper.getInfoForContentIdPromise(sEntitySet, oModel, oAppComponent.getId());
					fnSetBusy(oInfoForContentIdPromise);
					oInfoForContentIdPromise.then(function(oInfoObject) {
						var oSettings = oComponentUtils.getSettings();
						var sRootExpand = oInfoObject.contentIdRequestPossible ? oInfoObject.parametersForContentIdRequest.sRootExpand : null;
						var oParameters = {
							sRootExpand: sRootExpand,
							oController: oController,
							oApplicationController: oServices.oApplicationController,
							bUseNewActionForCreate: oSettings && oSettings.useNewActionForCreate,
							fnSetBusy: fnSetBusy
						};
						var oCreatePromise = CRUDHelper.create(oServices.oDraftController,
							sEntitySet,
							sBindingPath,
							oModel,
							oServices.oApplication,
							oPredefinedValues,
							oParameters,
							oCommonUtils
						);

						oCreatePromise.catch(
							handleError.bind(null,
								MessageUtils.operations.addEntry,
								function(oError){
									fnReject();
									if (oError) {
										throw oError;
									}
								}
							)
						);
						oCreatePromise.then(function(oContext) {
							oServices.oApplication.markCurrentDraftAsModified();
							var aKeys = oComponentUtils.getCurrentKeys();
							aKeys.push(oDataModelHelper.analyseContext(oContext).key);
							var iLevel = aKeys.length - 1;
							oServices.oApplication.registerContext(oContext, iLevel, sEntitySet, aKeys);
							fnResolve(oContext);
						});

						oComponentUtils.preloadComponent(sEntitySet);
					});
				});
			}
			

			/* eslint-disable */
			var handleError = testableHelper.testable(handleError, "handleError");
			var getActionUtil = testableHelper.testable(getActionUtil, "getActionUtil");
			/* eslint-enable */

			return {
				editEntity: editEntity,
				deleteEntity: deleteEntity,
				deleteEntities: deleteEntities,
				saveEntity: saveEntity,
				activateDraftEntity: activateDraftEntity,
				discardDraft: discardDraft,
				callAction: callAction,
				addEntry: addEntry,
				updateMultipleEntities: updateMultipleEntities,
				getDefaultValues: getDefaultValues
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.lib.CRUDManager", {
				constructor: function(oController, oComponentUtils, oServices, oCommonUtils, oBusyHelper) {
					extend(this, getMethods(oController, oComponentUtils, oServices, oCommonUtils, oBusyHelper));
				}
			});
	});
