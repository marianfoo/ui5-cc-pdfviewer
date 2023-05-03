sap.ui.define(["sap/ui/base/Object", "sap/base/util/each", "sap/base/util/extend", "sap/suite/ui/generic/template/genericUtilities/oDataModelHelper"], function (BaseObject, each, extend, oDataModelHelper) {
		"use strict";

		/* This class is a helper class for supporting navigation to contexts.
		 * More precisely, for each App an instance of this class is created.
		 * This instance stores information about all 'header contexts' of entities which are loaded within the lifetime of the App.
		 * The public methods of this class can be divided into two categories:
		 * - registration methods: Contexts and actions on contexts are registered at this class in order to update the bookkeeping
		 * - retrieval methods: Methods that exploit the information which is stored in this registry
		 */
		function getMethods(oTemplateContract) {

			// This is the central registry for all the contexts. It maps the path for this context onto a registry entry containing some metadata for this context.
			// More precisely, the entry contains the following properties:
			// - oContext: the context. Note that it is removed, when the entity is deleted.
			// - oContextInfo: information about the context. This object has the following attributes:
			//                 - bIsDraftSupported: Does the entity this context belongs to support draft at all
			//                 - bIsDraft: is this context representing a draft (only possible when bIsDraftSupported is true)
			//                 - bIsCreate: Is this a create context
			//                 - bIsDraftModified: Is this a draft which has been modified
			//                 - bOwnDraftExists: Does the active version/context have an own draft.
			// - oSiblingPromise: This property is only valid for non-create drafts. In this case it contains a Promise that resolves to the context of the
			//   active sibling. The property is filled when this Promise is requested the first time (via getDraftSiblingPromise).
			// - oEditingPromise: This property is only valid for top-level active contexts that support draft. In this case it is available, as soon as an editing
			//   session for this object has started. It is removed again, when the editing session ends.
			//   The promise resolves to EditingInfo when the editing really takes place. Thereby, EditingInfo has a property 'context' which contains the
			//   context of the editing draft.
			//   The promise is rejected, when the editing session could not become active (e.g. because the object is currently locked by another user).
			// - oRemovalPromise: This property is available as soon as a cancellation (only for edit drafts) or activation session for the draft root of this
			//   draft has started. If this session fails (e.g. because the activation is rejected) the Promise is rejected and oRemovalPromise is set to be faulty again.
			//   If the session succeeds the Promise resolves to the context of the active version.
			// - bReplaceByActive: This property can only be truthy for edit(not for Create) drafts. "bReplaceByActive" is set(!isDraft) after registering Context(registerContext) is called.
			//   In the case with bReplaceActive set true, when Alternate context is requested the draft is surpressed and the corresponding active version is displayed.
			//   And vice-versa, when set to false, active versions will be redirected to draft.
			// - sActiveContextPath: Holds the active object's context path. For draft context registry entries, a reference to the active context is kept in case the edit
			// 	 is executed on the same session to avoid additional backend request
			// Note that this registry only contains contexts that belong to existing backend entries. Thus, contexts being created in non-draft create scenarios
			// are not stored in this registry (since they do not yet exist on the server).
			var mPath2ContextData = {}; // currently only used for draft scenarios
			var aPathOfLastShownDraftRoots = []; // Is used if displayNextObjectAfterDelete is set in manifest to return to the last ObjectPage

			var mActiveDraftRoots = Object.create(null);

			/* Begin of registration methods */

			// Private method that creates the ContextInfo for a given context
			function fnCreateDraftInfo(oContext) {
				var oDraftController = oTemplateContract.oAppComponent.getTransactionController().getDraftController();
				var oDraftContext = oDraftController.getDraftContext();
				var oActiveEntity = oContext.getObject();
				// check whether we are draft enabled AND the current context represents a draft
				var bIsDraftSupported = oDraftContext.hasDraft(oContext);
				var bIsDraft = bIsDraftSupported && !oActiveEntity.IsActiveEntity;
				var bIsCreate = bIsDraft && !oActiveEntity.HasActiveEntity;
				var bIsDraftModified = false;
				var bOwnDraftExists = oActiveEntity.HasDraftEntity ? oContext.getObject("DraftAdministrativeData/DraftIsCreatedByMe") : false;
				if (oActiveEntity.DraftEntityCreationDateTime && oActiveEntity.DraftEntityLastChangeDateTime) {
					bIsDraftModified = oActiveEntity.DraftEntityCreationDateTime.getTime() !== oActiveEntity.DraftEntityLastChangeDateTime.getTime();
				}
				return {
					bIsDraft: bIsDraft,
					bIsDraftSupported: bIsDraftSupported,
					bIsCreate: bIsCreate,
					bIsDraftModified: bIsDraftModified,
					bOwnDraftExists: bOwnDraftExists
				};
			}

			// Public method that registers a context at this instance
			// Note this is the only method which can also be called in non draft scenarios
			function registerContext(oContext, iViewLevel, sEntitySet, aKeysFromIdentity) {
				var sPath = oContext.getPath();
				var oContextInfo = fnCreateDraftInfo(oContext);
				if (iViewLevel === 1 && !oContextInfo.bIsCreate) {
					aPathOfLastShownDraftRoots.push(sPath);
				}
				
				// When edit of the an active context starts in the session, "oEditingPromise" is added to the contextData of the active context.
				// As a result, old contextData(mPath2ContextData[sPath]) is extended with the new contextData so that "oEditingPromise" is not cleared.
				var oContextData = extend(mPath2ContextData[sPath] || {}, {
					oContextInfo: oContextInfo,
					oContext: oContext
				});
				// Now store the newly build object
				mPath2ContextData[sPath] = oContextData;

				// Update the bReplaceByActive info. Note that this should be done after the entry has been made in mPath2ContextData.
				// This way getDraftSiblingPromise already knows where to cache the Promise
				if (oContextInfo.bIsDraft && !oContextInfo.bIsCreate){
					// Updating "bReplaceByActive" when the new context is draft.
					oContextData.bReplaceByActive = false;
				} else if (oContextInfo.bOwnDraftExists && !oContextInfo.bIsCreate){
					// Updating "bReplaceByActive" when the new context is active context.
					if (oContextData.oEditingPromise){
						// When edit of the active version has started in the same session.
						oContextData.oEditingPromise.then(function(oDraftContext){
							var sDraftPath = oDraftContext.context.getPath();
							mPath2ContextData[sDraftPath].bReplaceByActive = true;
						});
					} else {
						// When the corresponding draft was not created in the same session.
						getDraftSiblingPromise(oContext).then(function(oDraftContext){
							var sDraftPath = oDraftContext.getPath();
							var oEditingContextData = mPath2ContextData[sDraftPath];
							if (oEditingContextData) {
								mPath2ContextData[sDraftPath].bReplaceByActive = true;
							}
						});
					}
				}
				
				var aSemanticKeysValues = null;
				var oRootContextInfo;
				if (oContextInfo.bIsDraftSupported && !oContextInfo.bIsCreate && sEntitySet){
					var oTreeNode = oTemplateContract.mEntityTree[sEntitySet];
					if (oTreeNode && !oTreeNode.noOData){
						if (aKeysFromIdentity){
							if (oContextInfo.bIsDraft){
								var aActiveKeys = [];
								var oActiveFoundPromise = oTemplateContract.oApplicationProxy.fillSiblingKeyPromise(oTreeNode, aKeysFromIdentity, aActiveKeys);
								oActiveFoundPromise.then(function(oReplaceNode){
									var sReplacePath = oReplaceNode.getPath(3, aActiveKeys);
									if (!mPath2ContextData[sReplacePath]){
										mPath2ContextData[sReplacePath] = {
											oContextInfo: {
												bIsDraft: false,
												bIsDraftSupported: true,
												bIsCreate: false,
												bIsDraftModified: false,
												bOwnDraftExists: true
											},
											aKeysFromIdentity: aActiveKeys
										};
									}
								});	
							}
							if (oTreeNode && !oTreeNode.noOData){
								var oMainObjectNode = oTemplateContract.oApplicationProxy.getAncestralNode(oTreeNode, 1);
								var oActiveDraftInfoForDraftRoot = mActiveDraftRoots[oMainObjectNode.entitySet];
								if (!oActiveDraftInfoForDraftRoot){
									oActiveDraftInfoForDraftRoot = {
										treeNode: oMainObjectNode,
										draftRoots: Object.create(null)
									};
									mActiveDraftRoots[oMainObjectNode.entitySet] = oActiveDraftInfoForDraftRoot;
								}
								var sRootKey = aKeysFromIdentity[1];
								oRootContextInfo = oActiveDraftInfoForDraftRoot[sRootKey];
								if (!oRootContextInfo){
									oRootContextInfo = {
										treeNode: oMainObjectNode,
										key: sRootKey,
										childContexts: Object.create(null)
									};
									oActiveDraftInfoForDraftRoot[sRootKey] = oRootContextInfo;
								}
							}
						}
						var oModel = oContext.getModel();
						var oMetaModel = oModel.getMetaModel();
						var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
						var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
						var aSemanticKey = oEntityType["com.sap.vocabularies.Common.v1.SemanticKey"];
						if (aSemanticKey) {
							aSemanticKeysValues = [];
							for (var i = 0; i < aSemanticKey.length; i++) {
								aSemanticKeysValues.push(oContext.getProperty(aSemanticKey[i].PropertyPath));
							}
						}
					}
				}

				if (aSemanticKeysValues){
					oContextData.aSemanticKeysValues = aSemanticKeysValues;
				}
				if (aKeysFromIdentity){
					oContextData.aKeysFromIdentity = aKeysFromIdentity;
				}
				if (oRootContextInfo){
					oContextData.oRootContextInfo = oRootContextInfo;
					oRootContextInfo.childContexts[sPath] = oContextData;
				}
				if (oContextInfo.bIsDraftSupported && oContextData.oRootContextInfo) {
					for (var sChildPath in oContextData.oRootContextInfo.childContexts){
						var oChildContextData = oContextData.oRootContextInfo.childContexts[sChildPath];
						delete oChildContextData.oRemovalPromise; // this is needed for scenarios the keys of removed drafts may be reused for new drafts
					}
				}
				
				return oContextInfo;
			}

			function getPathOfLastShownDraftRoot() {
				for (var i = aPathOfLastShownDraftRoots.length - 1; i >= 0; i--) {
					var oContext = mPath2ContextData[aPathOfLastShownDraftRoots[i]].oContext;
					if (oContext) {
						return aPathOfLastShownDraftRoots[i];
					}
				}
			}

			// Private method that retrieves the information for the given context. If the context is not yet registered, this happens now.
			function getContextData(oContext) {
				var sPath = oContext.getPath();
				var oRet = mPath2ContextData[sPath];
				return oRet;
			}

			// method to check if the oContext is yet registered in mPath2ContextData
			function checkmPath2ContextData(oContext) {
				var oRet = getContextData(oContext);
				return !!(oRet && (oRet.oContext || oRet.oRemovalPromise));
			}
			
			function fnSetRemovalPromiseForChild(oContextData, oRemovalPromise, bIsCancellation, bIsRoot){
				if (!oContextData.oContextInfo.bIsCreate || !bIsCancellation) {
					if (bIsRoot) {
						oContextData.oRemovalPromise = oRemovalPromise.then(function(oResponse){
							return oResponse.context;
						});
					} else {
						oContextData.oRemovalPromise = oContextData.oSiblingPromise || (oContextData.oContext && getDraftSiblingPromise(oContextData.oContext));
					}
				}
				oRemovalPromise.then(function(){
					oContextData.oContext = null;  // remove deleted context
				}, function(){
					delete oContextData.oRemovalPromise; // if removal has failed forget that it was even tried
				});
			}

			// Private method that is called when the removal (activation, cancellation) of top-level draft oContext is started.
			// bIsCancellation contains the information which case applies
			// oRemovalPromise must be a Promise that is resolved when the removal is executed successfully.
			// If there exists an active version of the draft afterwards (i.e. the operation was activation or the draft was an edit-draft) oRemovalPromise
			// must resolve to an object with property 'context' representing this active version.
			// If the removal fails oRemovalPromise must be rejected.
			// Cancellation of draft can happen in two cases either during delete action or discard of the draft,
			// sActionType holds value of action type that lead to the cancellation, during a Delete(sActionType = deleteAction) and during Discard Action(sActionType = discardAction)
			function draftRemovalStarted(oContext, oRemovalPromise, bIsCancellation, sActionType) {
				// When the removal is successfull, property oContext of the context info is set to be faulty.
				// When we have an active version of the entity after the removal (i.e. we are not cancelling a create draft) the stored Promises need to be updated
				var oContextData = getContextData(oContext);
				var aEditableChildContextsPathes = []; // Collect pathes to contexts which should be invalidated
				// if deletion of  record no need to add oRemovalPromise to other childcontexts
				if (sActionType === "deleteAction" && !oContextData.oContextInfo.bIsCreate) {
					oContextData.oRemovalPromise = oRemovalPromise.then(function(oResponse){
						oContextData.oContext = null;
						return oResponse.context;
					}, function(){
						delete oContextData.oRemovalPromise; // if removal has failed forget that it was even tried
					});
				} else if (oContextData.oRootContextInfo) {
					for (var sChildPath in oContextData.oRootContextInfo.childContexts){
						var oChildContextData = oContextData.oRootContextInfo.childContexts[sChildPath];
						if (oChildContextData.oContextInfo.bIsDraftSupported){ // Note that not all children of a draft root support draft themselves
							fnSetRemovalPromiseForChild(oChildContextData, oRemovalPromise, bIsCancellation, oContextData === oChildContextData);
							if (oContextData.oContext){
								aEditableChildContextsPathes.push(oContextData.oContext.getPath());
							}
						}
					}
				} else { // create drafts do not possess a rootContextInfo, still RemovalPromise should be set for the draft itself
					fnSetRemovalPromiseForChild(oContextData, oRemovalPromise, bIsCancellation, true);	
				}
				var oModel = oContext.getModel();
				oRemovalPromise.then(function (oResponse) {
					if (!oContextData.oContextInfo.bIsCreate || !bIsCancellation) { // on success remove Edit Promise from the active version
						var sDisplayPath = oResponse.context.getPath();
						var oDisplayContextInfo = mPath2ContextData[sDisplayPath];
						if (oDisplayContextInfo) {
							delete oDisplayContextInfo.oEditingPromise;
							setDraftExists(oDisplayContextInfo, false);
						}
					}
					// There are scenarios in which the model has not received the information that the draft context is removed, namely
					// - when the draft is removed due to an activation
					// - when the draft is removed with a discard action
					// In these cases we actively invalidate the information in the model. This will ensure that a new read is triggered if the same key
					// is used for another draft.
					// In addition we also need to invalidate model entries which belong to child entries. Note that this may even affect entries which are
					// not accessible by thgis class, as they might have been retrieved via a navigation property.
					// In order to find all contexts that should be invalidated we loop over the list of all contexts in the model (actually a private property)
					// and compare their deep path (another private property) with the path of all known child contexts.
					// Note: The invalidaton is postponed to the end of the busy session to ensure that no view is bound to the draft context
					// anymore (which possibly could trigger a reload of the non-existing draft).
					oTemplateContract.oBusyHelper.getUnbusy().then(function(){
						oModel.invalidateEntry(oContext);
						if (aEditableChildContextsPathes.length > 0){
							var mContexts = oModel.mContexts;
							var fnCheckContextPath = function(sDeepPathOfPotentialChildContext, sChildPath){
								return sDeepPathOfPotentialChildContext.startsWith(sChildPath);
							};
							for (var sContextKey in mContexts) {
								var oPotentialChildContext = mContexts[sContextKey];
								if (oPotentialChildContext !== oContext){
									var sDeepPathOfPotentialChildContext = oPotentialChildContext.sDeepPath;
									var bIsChildContext = sDeepPathOfPotentialChildContext && aEditableChildContextsPathes.some(fnCheckContextPath.bind(null, sDeepPathOfPotentialChildContext));
									if (bIsChildContext){
										oModel.invalidateEntry(oPotentialChildContext);
									}
								}
							}
						}
						delete oContextData.oRootContextInfo;
					});					
				});
			}

			// Public method that is called, when the activation of oContext is started. oActivationPromise must be a RemovalPromise like described in draftRemovalStarted
			function activationStarted(oContext, oActivationPromise) {
				draftRemovalStarted(oContext, oActivationPromise, false);
			}

			// Public method that is called, when the cancellation of oContext is started. oCancellationPromise must be a RemovalPromise like described in draftRemovalStarted
			// Cancellation can happen in two cases either during delete action or discard of the draft, sActionType is used to differentiate 
			// between whether the cancellation is invoked during a Delete(sActionType = deleteAction) or Discard Action(sActionType = discardAction).
			// oActive would be a context containing the key of the active version (if existing)
			function cancellationStarted(oContext, oCancellationPromise, sActionType, oActive) {
				draftRemovalStarted(oContext, oCancellationPromise, true, sActionType);
				if (oActive){
					var oModel = oActive.getModel();
					var sKey = "/" + oModel.getKey(oActive);
					var oActiveContextInfo = mPath2ContextData[sKey];
					if (oActiveContextInfo){ // as the draft is cancelled the already known active version is again correct. However, draft related info needs to be updated in the cache
						oModel.read(sKey, {
							urlParameters: {
								"$expand": "DraftAdministrativeData,SiblingEntity"	
							},
							groupId: "Changes" // trigger this with the same request as the cancellation itself. It will be performed afterwards.
						});						
					}
				}
			}
			
			function setDraftExists(oContextData, bDraftExists){
				if (oContextData.oRootContextInfo){
					each(oContextData.oRootContextInfo.childContexts, function(){
						this.oContextInfo.bOwnDraftExists = bDraftExists;             
					});
				} else {
					oContextData.oContextInfo.bOwnDraftExists = bDraftExists;
				}
			}

			// Public method called when the user has started an editing procedure (of a draft based object)
			// oContext: the context of the object to be edited
			// oEditingPromise: A promise that behaves as the Promise returned by function editEntity of CRUDManager
			function editingStarted(oContext, oEditingPromise) {
				var oContextData = getContextData(oContext);
				oContextData.oEditingPromise = new Promise(function (fnResolve, fnReject) {
					var fnNoEdit = function(){
						delete oContextData.oEditingPromise;
						setDraftExists(oContextData, false);
						fnReject();
					};
					oEditingPromise.then(function (oEditInfo) {
						if (oEditInfo.draftAdministrativeData) {
							fnNoEdit();
						} else {
							setDraftExists(oContextData, true);
							// create the contextData object for the edit draft.
							// Note: In case that draft keys are reused this might replace an outdated entry.
							// Since the draft will be navigated to shortly afterwards, this entry will be updated. However, sActiveContextPath will stay.
							var sPath = oEditInfo.context.getPath();
							mPath2ContextData[sPath] = {
								sActiveContextPath: oContext.getPath(),
								oContext: oEditInfo.context,
								oContextInfo: {
									bIsDraft: true,
									bIsDraftSupported: true,
									bIsCreate: false,
									bIsDraftModified: false,
									bOwnDraftExists: false
								}
							};
							fnResolve(oEditInfo);
						}
					}, fnNoEdit);
				});
				oContextData.oEditingPromise.catch(Function.prototype); // avoid ugly console messages
			}

			// Private method that is called when the object with path sPath has been deleted
			function fnAdaptAfterObjectDeleted(sPath) {
				var oContextData = mPath2ContextData[sPath];
				if (oContextData) {
					oContextData.oContext = null;
				}
			}

			/* End of registration methods */

			/* Begin of retrieval methods */

			// Private method that creates and returns a Promise that resolves to the context for the sibling of the specified context.
			// If the determination of the sibling information fails or no sibling currently exists, the Promise is rejected.
			// More precisely: If the determination of the sibling fails due to an error the Promise is rejected with the corresponding error object.
			// If no sibling exists, the Promise is rejected to nothing.
			// sBatchGroup holds value for the groupId. The sBatchGroup is passed with a truthy value like "Changes", if the requests belonging to the same group 
			// needs to be bundled in one batch request, and the caller of this function has to ensure that this sibling request is submitted to backend. 
			// If sBatchGroup value is not available, the request will be triggered immediately
			function createDraftSiblingPromise(oModel, sPath, sBatchGroup) {
				return new Promise(function (fnResolve, fnReject) {
					oModel.read(sPath + "/SiblingEntity", {
						success: function (oResponseData) {
							if (oResponseData) {
								var sSiblingPath = "/" + oModel.getKey(oResponseData);
								//var oActive = oModel.createBindingContext(sSiblingPath);
								var oActive = oModel.getContext(sSiblingPath);
								fnResolve(oActive);
							} else {
								fnReject();
							}
						},
						error: function (oError) {
							fnReject(oError);
						}, 
						groupId: sBatchGroup
					});
				});
			}

			// Public method that returns a Promise that resolves to the sibling of the given context.
			// More precisely:
			// - The Promise resolves to nothing, when oContext is a Create-draft
			// - The Promise resolves to oContext, if oContext does not support drafts
			// - The Promise is rejected if an error occurs
			// - The Promise is rejected if oContext is active, supports drafts, but does not have a sibling
			// - The Promise resolves to the sibling context of oContext if it has one (and the sibling context can be determined).
			//   DraftContext has a reference to the ActiveContext path it is retrieved using the same and backend request is not send
			// sBatchGroup holds value for the groupId. sBatchGroup is passed with a truthy value like "Changes", if the requests belonging to the same group 
			// needs to be bundled in one batch request, and the caller of this function has to ensure that this sibling request is submitted to backend. 
			// If sBatchGroup value is not available, the request will be triggered immediately
			function getDraftSiblingPromise(oContext, sBatchGroup) {
				var oContextData = getContextData(oContext);
				if (oContextData.oContextInfo.bIsCreate) {
					return Promise.resolve();
				} else if (oContextData.sActiveContextPath) {
					var oActiveContextData = mPath2ContextData[oContextData.sActiveContextPath];
					return Promise.resolve(oActiveContextData.oContext);
				}
				var oSiblingPromise = oContextData.oSiblingPromise;
				if (!oSiblingPromise) {
					if (oContextData.oContextInfo.bIsDraftSupported && oContextData.oEditingPromise) {
						oSiblingPromise = oContextData.oEditingPromise.then(function(oDraftContext) {
							var sEditPath = oDraftContext.context.getPath();
							var oEditData = sEditPath && mPath2ContextData[sEditPath];
							if (oEditData && !oEditData.oRemovalPromise) {
								return Promise.resolve(oDraftContext.context);
							} else {
								 return createDraftSiblingPromise(oContext.getModel(), oContext.getPath());
							}
						});
					} else {
						oSiblingPromise = oContextData.oContextInfo.bIsDraftSupported ?
						createDraftSiblingPromise(oContext.getModel(), oContext.getPath(), sBatchGroup) : Promise.resolve(oContext);
						// For active draft supporting contexts the sibling can change over time. Therefore, the Promise can only be cached
						// for later reuse, when oContext is either a draft or does not support drafts
						if (oContextData.oContextInfo.bIsDraft || !oContextData.oContextInfo.bIsDraftSupported) {
							oContextData.oSiblingPromise = oSiblingPromise;
						}
					}
				}
				return oSiblingPromise;
			}

			// This function returns a Promise that resolves to the sibling of the given context path, sContextPath
			// If oContextData is not available, then we try to determine the sibling context via createDraftSiblingPromise (this may get rejected in case of errors 
			// or if sibling context info couldn't be determined ). If resolved we check if oContextData info is registered in mPath2ContextData,if not we update mPath2ContextData with oContextData
			// The Promise resolves to oContextData.oSiblingPromise, if its already available.
			// If reference to the ActiveContext path is available, it resolves to the oContext of the active object
			// If oContextData is available we try to fetch the sibling info via getDraftSiblingPromise method
			// sBatchGroup holds value for the groupId, when sBatchGroup is passed with a truthy value like "Changes", requests belonging to the same group 
			// will be bundled in one batch request and when sBatchGroup value is not available, the request will be triggered immediately
			function getSiblingPromise(sContextPath, sBatchGroup) {
				var oContextData = mPath2ContextData[sContextPath];
				// return oSiblingPromise if its is available in the context data
				if (oContextData && oContextData.oSiblingPromise) {
					return oContextData.oSiblingPromise;
				} else if (oContextData && oContextData.sActiveContextPath) {
					var oActiveContextData = mPath2ContextData[oContextData.sActiveContextPath];
					return Promise.resolve(oActiveContextData.oContext);
				} else {
					var oSiblingPromise = oContextData && oContextData.oContext ? getDraftSiblingPromise(oContextData.oContext, sBatchGroup) : createDraftSiblingPromise(oTemplateContract.oAppComponent.getModel(), sContextPath, sBatchGroup);
					// exploit the information obtained for our book-keeping
					oSiblingPromise.then(function(oSiblingContext) {
						if (oSiblingContext){ // Add information obtained about the sibling to book-keeping
							var sSiblingCanonicalPath = oDataModelHelper.analyseContext(oSiblingContext).canonicalPath;
							if (!mPath2ContextData[sSiblingCanonicalPath]) {
								mPath2ContextData[sSiblingCanonicalPath] = {
									oContextInfo: fnCreateDraftInfo(oSiblingContext),
									oContext: oSiblingContext
								};
							}
						}
						var oContext = oContextData && oContextData.oContext;
						if (!oContext) { // Even if we do not have the context for the given path in our book-keeping yet, it might be available in the model
							var oModel = oTemplateContract.oAppComponent.getModel();
							oContext = oModel.createBindingContext(sContextPath);
							if (oContext){
								oContextData = oContextData || { };
								oContextData.oContext = oContext;
								oContextData.oContextInfo = fnCreateDraftInfo(oContext);
								mPath2ContextData[sContextPath] = oContextData;
							}
						}
						// If both siblings are available in the book-keeping we can link them via the sActiveContextPath property 
						if (oContext && oSiblingContext && oContextData.oContextInfo.bIsDraftSupported) {
							var sDraftPath = oContextData.oContextInfo.bIsDraft ? sContextPath : sSiblingCanonicalPath;
							var sActivePath = oContextData.oContextInfo.bIsDraft ? sSiblingCanonicalPath : sContextPath;
							mPath2ContextData[sDraftPath].sActiveContextPath = sActivePath;
						}
					});
					return oSiblingPromise;
                }
			}

			function getAlternativeIdentityPromise(oIdentity){
				if (oIdentity.treeNode.level === 0){
					return Promise.resolve();
				}
				var oMainObjectNode = oTemplateContract.oApplicationProxy.getAncestralNode(oIdentity.treeNode, 1);
				if (oMainObjectNode.noOData || !oMainObjectNode.isDraft){
					return Promise.resolve();
				}
				var sMainPath = oMainObjectNode.getPath(3, oIdentity.keys.slice(0, 2));
				return getAlternativeContextPromise(sMainPath).then(function(oAlternativeContext){
					if (!oAlternativeContext){
						return null;
					}
					var iDisplayMode = oAlternativeContext.iDisplayMode || 1;
					var bDisplayChecked = false;
					var aTargetKeys = oAlternativeContext.context ?  ["", oDataModelHelper.analyseContext(oAlternativeContext.context).key] : [""];
					var fnCreateReturn = function(oTargetNode){
						if (!bDisplayChecked && iDisplayMode === 2){
							iDisplayMode = oTargetNode.isDraft ? 6 : 1;	
						}
						var oTargetIdentity = {
							treeNode: oTargetNode,
							keys: aTargetKeys
						};
						var oRet = {
							identity: oTargetIdentity,
							displayMode: iDisplayMode
						};
						return oTemplateContract.oNavigationControllerProxy.adaptAppStates(oIdentity, oTargetIdentity).then(function(){
							return oRet;	
						});
					};
					if (!oAlternativeContext.context){ // The identity points to a not-existing main object => navigate to root
						return fnCreateReturn(oTemplateContract.mRoutingTree.root);	
					}
					var fnHandleTargetNode = function(oTargetNode){
						if (oTargetNode === oIdentity.treeNode){
							return fnCreateReturn(oTargetNode);
						}
						var oCandidateNode = oTemplateContract.oApplicationProxy.getAncestralNode(oIdentity.treeNode, oTargetNode.level + 1);
						var aCandidiateKeys = oIdentity.keys.slice(0, oCandidateNode.level + 1);
						var sCandidatePath = oCandidateNode.getPath(3, aCandidiateKeys);
						return getAlternativeContextPromise(sCandidatePath).then(function(oCandidateContextInfo){
							if (!oCandidateContextInfo || !oCandidateContextInfo.context){
								return fnCreateReturn(oTargetNode);
							}
							aTargetKeys.push(oDataModelHelper.analyseContext(oCandidateContextInfo.context).key);
							iDisplayMode = oCandidateContextInfo.iDisplayMode;
							bDisplayChecked = true;
							return fnHandleTargetNode(oCandidateNode);
						});
					};
					return oTemplateContract.oApplicationProxy.fillSiblingKeyPromise(oIdentity.treeNode, oIdentity.keys, aTargetKeys).then(fnHandleTargetNode);
				});
			}
			
			
			// Private method that is used to check whether navigation to a context should be forwarded to another context.
			// sPath describes the path that is navigated to
			// Returns a Promise that either returns to faulty (no forwarding needed) or to an AlternativeContextInfo
			// AlternativeContextInfo is an object containing the following properties:
			// - context: The context that should be navigated to. If this component is faulty the target does not exist any more. In this case the navigation
			//            should be forwarded to a parent.
			// - iDisplayMode: the display mode to be used as described in function fnNavigateToRoute in sap.suite.ui.generic.lib.navigation.NavigationController
			function getAlternativeContextPromise(sPath){
				var oContextData = mPath2ContextData[sPath];
				if (!oContextData) { // nothing known about this context -> no forwarding needed
					return Promise.resolve();
				}
				if (!oContextData.oContext){ // entity identified by sPath has been deleted meanwhile
					return Promise.resolve({ });
				}
				return new Promise(function (fnResolve) {
					var oAlternativeContextInfo = null; // the object that will be resolved to -> current assumption: no forwarding needed
					var fnResolveToAlternativeContext = function () { // execute the resolution
						fnResolve(oAlternativeContextInfo);
					};
					var fnHandleEditingPromise = function (oEditingPromise) { // function to be called when there is an EditingPromise for the object to be displayed
						oEditingPromise.then(function (oEditingInfo) { // oEditingInfo contains the context for the draft that currently replaces the object
							// There are two scenarios in which we would not replace the active version by the editing version:
							// 1. Currently we have the following problem: A delete operation on the draft does not delete the whole object, but only the draft.
							//    However, in this case draftRemovalStarted is not called, but only fnAdaptAfterObjectDeleted.
							//    This function does NOT remove the EditingPromise from the active version. Thus, although the EditingPromise is present
							//    it still might be correct to show the active object.
							//    Therefore, we check for the corresponsing entry of the draft. If this entry exists, but no context is available anymore
							//    the draft has meanwhile been deleted -> do not (try to) navigate to the draft
							// 2. The draft of the active version is created in the same session and the user is now navigating to active. "bReplaceByActive" is checked to redirect to draft if required.
							var sEditingPath = oEditingInfo.context.getPath();
							var oEditingContextData = mPath2ContextData[sEditingPath];
							if (oEditingContextData && oEditingContextData.oContext && !oEditingContextData.bReplaceByActive) {
								oAlternativeContextInfo = {
									context: oEditingInfo.context,
									iDisplayMode: 2
								};
							}
							fnResolveToAlternativeContext();
						}, fnResolveToAlternativeContext);
					};

					if (oContextData.oRemovalPromise){ // sPath describes a draft for which an activation/cancellation has been started
						oContextData.oRemovalPromise.then(function(oActiveContext){ // activation was successfull
							oAlternativeContextInfo = { // forward to active entity
								context: oActiveContext,
								iDisplayMode: 1
							};
							var sDisplayPath = oActiveContext.getPath();
							var oDisplayData = mPath2ContextData[sDisplayPath];
							var oEditingPromise = oDisplayData && oDisplayData.oEditingPromise;
							if (oEditingPromise) { // active entity might already be in (another) draft
								fnHandleEditingPromise(oEditingPromise);
							} else {
								fnResolveToAlternativeContext();
							}
						}, fnResolveToAlternativeContext);
					} else if (oContextData.bReplaceByActive) { // sPath describes a draft and needs to be redirected to active version.
						getDraftSiblingPromise(oContextData.oContext).then(function (oActiveContext) {
							oAlternativeContextInfo = { // forward to active entity
								context: oActiveContext,
								iDisplayMode: 1
							};
							fnResolveToAlternativeContext();
						});
					} else if (!oContextData.oContextInfo.bIsDraft && oContextData.oContextInfo.bOwnDraftExists) { // sPath describes an active object for which a draft is being created (and not surpressed)
						if (oContextData.oEditingPromise) {
							// If draft is created in the same session.
							fnHandleEditingPromise(oContextData.oEditingPromise);
						} else if (oContextData.oContext) {
							getDraftSiblingPromise(oContextData.oContext).then(function (oDraftContext) {
								var sDraftPath = oDraftContext.getPath();
								var oEditingContextData = mPath2ContextData[sDraftPath];
								if (!oEditingContextData || !oEditingContextData.bReplaceByActive) {
									oAlternativeContextInfo = {
										context: oDraftContext,
										iDisplayMode: 2
									};
								}
								fnResolveToAlternativeContext();
							});
						} else {
							fnResolveToAlternativeContext();
						}
					} else {
						fnResolveToAlternativeContext();
					}
				});
			}
			
			// returns the identity key for a context, if it can be derived by the information known within this class.
			// Otherwise it returns a faulty value
			function getIdentityKeyForContext(oContext){
				var oContextData = getContextData(oContext);
				return oContextData && oContextData.aKeysFromIdentity;
			}

			// sPath1 is the old one, sPath2 should be the current one
			function areTwoKnownPathesIdentical(sPath1, sPath2, bIsRoot, oHistoricIdentity, oNewIdentity) {
				return new Promise(function (fnResolve, fnReject) {
					var oModel = oTemplateContract.oAppComponent.getModel();
					var sCanonicalPath1 = sPath1 && oDataModelHelper.analyseContextPath(sPath1, oModel).canonicalPath;     
					var sCanonicalPath2 = sPath2 && oDataModelHelper.analyseContextPath(sPath2, oModel).canonicalPath;
					if (sCanonicalPath1 === sCanonicalPath2) {
						fnResolve(true);
						return;
					}
					if (!sCanonicalPath1 || !sCanonicalPath2) {
						fnResolve(false);
						return;
					}
					var oContextData1 = mPath2ContextData[sCanonicalPath1];
					if (!oContextData1 || !oContextData1.oContextInfo.bIsDraftSupported) {
						fnResolve(false);
						return;
					}
					var oContextData2 = mPath2ContextData[sCanonicalPath2];
					var oContext2, aKeysFromIdentity;

					//swap, if oContextData1 either doesn't hold a value or doesn't have oContext and oContextData2 is available and is an active object
					if ((!oContextData1 || !oContextData1.oContext) && (oContextData2 && !oContextData2.oContextInfo.bIsDraft)) {
						// a = fnSwap(b, b = a);this function is used to swap the values of variables a and b
						var fnSwap = function (vSwapWith) {return vSwapWith; };

						oContextData1 = fnSwap(oContextData2, oContextData2 = oContextData1);
						sCanonicalPath1 = fnSwap(sCanonicalPath2, sCanonicalPath2 = sCanonicalPath1);
						oHistoricIdentity = fnSwap(oNewIdentity, oNewIdentity = oHistoricIdentity);
					}
					function fnTestEquivalence (oContextData1, oContextData2) {
						if (!oContextData1 || !oContextData2) {
							fnResolve(false);
							return;
						}
						// If both are active they cannot represent the same object
						if (!oContextData1.oContextInfo.bIsDraft && !oContextData2.oContextInfo.bIsDraft) {
							fnResolve(false);
							return;
						}
						// // If both are create they cannot be the same object
						if (oContextData1.oContextInfo.bIsCreate && oContextData2.oContextInfo.bIsCreate) {
							fnResolve(false);
							return;
						}
						if (bIsRoot) {
							getAlternativeContextPromise(sCanonicalPath1).then(function (oAlternativeContextInfo) {
								fnResolve(!!(oAlternativeContextInfo && oAlternativeContextInfo.context) && oAlternativeContextInfo.context.getPath() === sCanonicalPath2);
							}, fnReject);
							return;
						}
						if (oContextData1.aSemanticKeysValues) {
							var bIsEqual =  !!oContextData2.aSemanticKeysValues;
							for (var i = 0; bIsEqual && i < oContextData1.aSemanticKeysValues.length; i++) {
								bIsEqual = oContextData1.aSemanticKeysValues[i] === oContextData2.aSemanticKeysValues[i];
							}
							fnResolve(bIsEqual);
							return;
						}
						fnResolve(false);
					}
					//if oContextData1 is available and it holds context data of an active object and if oContextData2 is not available, get draftInfo of oContextData2, and if 
					// oContextData2 contains context of draft and this draft is not yet registered then check whether sCanonicalPath2 is path of
					// oContextData1 object's sibling i.e. check whether oHistoricIdentity and oNewIdentity are sibling to each other
					if (oContextData1.oContext && !oContextData1.oContextInfo.bIsDraft && (!oContextData2 || !oContextData2.oContext)) {
						// if we have removal information in oContextData2 check whether it resolves to the given active version
						if (oContextData2 && oContextData2.oRemovalPromise) {
							oContextData2.oRemovalPromise.then(function(oReplaceContext){
								var sReplacePath = oDataModelHelper.analyseContext(oReplaceContext).canonicalPath;
								fnResolve(sReplacePath === sCanonicalPath1);
							});
							return;
						}
						if (oHistoricIdentity && oNewIdentity && oHistoricIdentity.treeNode.entitySet === oNewIdentity.treeNode.entitySet) {
							aKeysFromIdentity = oNewIdentity && oNewIdentity.keys;
							var oNewIdentityContext = oModel.getContext(sCanonicalPath2) || oModel.createBindingContext(sCanonicalPath2);
							var oNewIdentityContextInfo = oNewIdentityContext && fnCreateDraftInfo(oNewIdentityContext);
							// if both oContextData1 and oContextData2 are active object then they are not identical as their canonicalPath didn't match 
							if (oNewIdentityContext && !oNewIdentityContextInfo.bIsDraft) {
								fnResolve(false);
							} else { // check whether oContextData1 and sCanonicalPath2 context are siblings
								var oSiblingPromise = getDraftSiblingPromise(oContextData1.oContext);
								oSiblingPromise.then(function(oSiblingContext) {
									if (oSiblingContext.sPath && sCanonicalPath2 === oSiblingContext.sPath) {
										oContext2 = oSiblingContext;
										oContextData2 = mPath2ContextData[sCanonicalPath2];
										if (!oContextData2 || !oContextData2.oContext) {
											registerContext(oContext2, oNewIdentity.treeNode.level, oNewIdentity.treeNode.entitySet, aKeysFromIdentity);
											mPath2ContextData[sCanonicalPath2].sActiveContextPath = oContextData1.oContext.getPath();
										}
										fnTestEquivalence(oContextData1, mPath2ContextData[sCanonicalPath2]);
									} else {
										fnResolve(false);
									}
								}, function(){
									fnResolve(false); // if siblingpromise failed resolve to false, temporary soln.
								});
							}
						} else {
							fnResolve(false);
							return;
						}
					} else {
						fnTestEquivalence(oContextData1, oContextData2);
					}
				});
			}

			//method to provide IsDraftModified info for a given draft
			function getIsDraftModified(sPath) {
				return mPath2ContextData[sPath].oContextInfo.bIsDraftModified;
			}

			/* End of retrieval methods */

			// method which update existing map's IsDraftModified Information when draft changed
			function markDraftAsModified(sPath) {
				if (mPath2ContextData[sPath]) {
					mPath2ContextData[sPath].oContextInfo.bIsDraftModified = true;
				}
			}

			function checkIfObjectIsADraftInstance(sPath){
				if (mPath2ContextData[sPath]) {
					return mPath2ContextData[sPath].oContextInfo.bIsDraft;
				}
			}

			function getContextForPath(sPath){
				if (mPath2ContextData[sPath]) {
					return mPath2ContextData[sPath].oContext;
				}
			}

			return {
				registerContext: registerContext,
				adaptAfterObjectDeleted: fnAdaptAfterObjectDeleted,
				activationStarted: activationStarted,
				cancellationStarted: cancellationStarted,
				editingStarted: editingStarted,
				getDraftSiblingPromise: getDraftSiblingPromise,
				getSiblingPromise: getSiblingPromise,
				getAlternativeIdentityPromise: getAlternativeIdentityPromise,
				getPathOfLastShownDraftRoot: getPathOfLastShownDraftRoot,
				areTwoKnownPathesIdentical: areTwoKnownPathesIdentical,
				markDraftAsModified: markDraftAsModified,
				getIsDraftModified: getIsDraftModified,
				getIdentityKeyForContext: getIdentityKeyForContext,
				checkmPath2ContextData: checkmPath2ContextData,
				checkIfObjectIsADraftInstance: checkIfObjectIsADraftInstance,
				getContextForPath: getContextForPath
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.lib.ContextBookkeeping", {
			constructor: function (oTemplateContract) {
				extend(this, getMethods(oTemplateContract));
			}
		});
	});
