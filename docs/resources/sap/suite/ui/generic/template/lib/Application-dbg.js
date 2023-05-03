sap.ui.define(["sap/ui/base/Object",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/ActionSheet",
	"sap/m/Dialog",
	"sap/m/Popover",
	"sap/suite/ui/generic/template/lib/deletionHelper",
	"sap/suite/ui/generic/template/lib/navigation/routingHelper",
	"sap/suite/ui/generic/template/lib/ContextBookkeeping",
	"sap/suite/ui/generic/template/lib/CRUDHelper",
	"sap/suite/ui/generic/template/lib/FocusHelper",
	"sap/suite/ui/generic/template/lib/MessageUtils",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/genericUtilities/oDataModelHelper",
	"sap/ui/core/syncStyleClass",
	"sap/base/util/extend",
	"sap/ui/core/Fragment",
	"sap/ui/generic/app/navigation/service/NavigationHandler",
	"sap/suite/ui/generic/template/lib/KeepAliveHelper",
	"sap/m/MessageBox"
	],
	function(BaseObject, Device, JSONModel, MessageToast, ActionSheet, Dialog, Popover, deletionHelper,
		routingHelper, ContextBookkeeping, CRUDHelper, FocusHelper, MessageUtils, testableHelper, FeLogger, oDataModelHelper,
		syncStyleClass, extend, Fragment, NavigationHandler, KeepAliveHelper, MessageBox) {
		"use strict";
		
		var GHOSTNAVIGATIONHANDLER = {
			storeInnerAppStateWithImmediateReturn: function(){
				return {
					promise: {
						fail: Function.prototype
					}
				};
			},
			parseNavigation: function(){
				return {
					done: function(fnHandler){
						setTimeout(fnHandler.bind(null, {}, {}, sap.ui.generic.app.navigation.service.NavType.initial), 0);	
					},
					fail: Function.prototype
				};
			}
		}; // mocked NavigationHandler used by ghost app

		var oLogger = new FeLogger("lib.Application").getLogger();
		var sContentDensityClass = (testableHelper.testableStatic(function(bTouch, oBody) {
			var sCozyClass = "sapUiSizeCozy",
				sCompactClass = "sapUiSizeCompact";
				if (oBody && (oBody.classList.contains(sCozyClass) || oBody.classList.contains(sCompactClass))) { // density class is already set by the FLP
					return "";
			} else {
				return bTouch ? sCozyClass : sCompactClass;
			}
		}, "Application_determineContentDensityClass")(Device.support.touch, document.body));

		function getContentDensityClass() {
			return sContentDensityClass;
		}

		// defines a dependency from oControl to a parent
		function fnAttachControlToParent(oControl, oParent) {
			syncStyleClass(sContentDensityClass, oParent, oControl);
			oParent.addDependent(oControl);
		}
		// Indicates whether the object should be used in edit mode - used predominantly in non-draft case of "save and Edit" feature.
		// Also set and reset during direct edit from LR table, to make sure object is openend in edit mode.
		var bObjectInEditMode = false;
		// Expose selected private static functions to unit tests
		/* eslint-disable */
		var fnAttachControlToParent = testableHelper.testableStatic(fnAttachControlToParent, "Application_attachControlToParent");
		/* eslint-enable */

		/* An instance of this class represents a Smart Template based application. Thus, there is a one-to-one relationship between
		 * instances of this class and instances of sap.suite.ui.generic.template.lib.AppComponent.
		 * However, this class is only used inside the sap.suite.ui.generic.template.lib package. It is not accessible to template developers
		 * or breakout developers.
		 * Instances of this class are generated in sap.suite.ui.generic.template.lib.TemplateAssembler.
		 * Note that TemplateAssembler also possesses a reference to the instance of this class which represents the app currently
		 * running.
		 * oTemplateContract: An object which is used for communication between this class and the AppComponent and its helper classes.
		 *                    See documentation of AppComponent for more details.
		 * Note that this class injects its api to these classes into the template contract object.
		 */
		function getMethods(oTemplateContract) {

			var oFocusHelper = new FocusHelper(oTemplateContract);
			var oContextBookkeeping = new ContextBookkeeping(oTemplateContract);
			var mEntitySetToETagInfo = Object.create(null); // maps the name of the entity sets which have been already checked for eTag
			var mNavigationProperties = Object.create(null);   // filled on demand
			var oKeepAliveHelper = new KeepAliveHelper(oTemplateContract);

			function isComponentActive(oComponent){
				var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
				return aActiveComponents.indexOf(oComponent.getId()) >= 0;
			}

			var bIsWaitingForSideEffectExecution = false;

			function fnAddSideEffectPromise(oPromise){
				oTemplateContract.fnAddSideEffectPromise(oPromise);
			}

			// Executes fnFunction as soon as all side-effects have been executed.
			// If vBusyCheck is truthy the execution is supressed in case that the app is still busy.
			// If vBusyCheck is even a function, this function is called in case the app is still busy.
			function fnPerformAfterSideEffectExecution(fnFunction, vBusyCheck){
				if (bIsWaitingForSideEffectExecution){
					return;   // do not let two operation wait for side effect execution
				}
				var aRunningSideEffectExecutions = oTemplateContract.aRunningSideEffectExecutions.filter(function(oEntry){return !!oEntry;});
				if (aRunningSideEffectExecutions.length){
					bIsWaitingForSideEffectExecution = true;
					Promise.all(aRunningSideEffectExecutions).then(function(){
						bIsWaitingForSideEffectExecution = false;
						fnPerformAfterSideEffectExecution(fnFunction, vBusyCheck);
					});
				} else if (vBusyCheck && oTemplateContract.oBusyHelper.isBusy()){
					if (typeof vBusyCheck === "function"){
						vBusyCheck();	
					}
				} else {
					fnFunction();
				}
			}

			function fnMakeBusyAware(oControl) {
				var sOpenFunction;
				if (oControl instanceof Dialog) {
					sOpenFunction = "open";
				} else if (oControl instanceof Popover || oControl instanceof ActionSheet) {
					sOpenFunction = "openBy";
				}
				if (sOpenFunction) {
					var fnOpenFunction = oControl[sOpenFunction];
					oControl[sOpenFunction] = function() {
						var myArguments = arguments;
						fnPerformAfterSideEffectExecution(function(){
							if (!oTemplateContract.oBusyHelper.isBusy()) { // suppress dialogs while being busy
								oTemplateContract.oBusyHelper.getUnbusy().then(function() { // but the busy dialog may still not have been removed
									fnOpenFunction.apply(oControl, myArguments);
								});
							}
						});
					};
				}
			}

			var mFragmentStores = {};

			function getDialogFragmentForView(oView, sName, oFragmentController, sModel, fnOnFragmentCreated) {
				oView = oView || oTemplateContract.oNavigationHost;
				var sViewId = oView.getId();
				var mFragmentStore = mFragmentStores[sViewId] || (mFragmentStores[sViewId] = {});
				var oFragment = mFragmentStore[sName];

				if (!oFragment) {
					return Fragment.load({
						id: sViewId,
						name: sName,
						controller: oFragmentController
					}).then(function (oXMLFragment) {
						fnAttachControlToParent(oXMLFragment, oView);
						var oModel;
						if (sModel) {
							oModel = new JSONModel();
							oXMLFragment.setModel(oModel, sModel);
						}
						(fnOnFragmentCreated || Function.prototype)(oFragment, oModel);
						mFragmentStore[sName] = oXMLFragment;
						fnMakeBusyAware(oXMLFragment);
						return oXMLFragment;
					});
				}
				return Promise.resolve(oFragment);
			}

			function getDialogFragmentForViewAsync(oView, sName, oFragmentController, sModel, fnOnFragmentCreated, bAlwaysGetNew, bNoBusyAware) {
				return new Promise(function (fnResolve) {
					oView = oView || oTemplateContract.oNavigationHost;
					var sViewId = oView.getId();
					var mFragmentStore = mFragmentStores[sViewId] || (mFragmentStores[sViewId] = {});
					var oFragment = mFragmentStore[sName];
					if (!oFragment || bAlwaysGetNew) {
						if (oFragment) {
							oFragment.destroy();
						}
						Fragment.load({id: sViewId, name: sName, controller: oFragmentController, type:  "XML"})
						.then(function (oNewFragment) {
							oFragment = oNewFragment;
							fnAttachControlToParent(oNewFragment, oView);
							var oModel;
							if (sModel) {
								oModel = new JSONModel();
								oNewFragment.setModel(oModel, sModel);
							}
							(fnOnFragmentCreated || Function.prototype)(oNewFragment, oModel);
							mFragmentStore[sName] = oNewFragment;
							if (!bNoBusyAware){
								fnMakeBusyAware(oNewFragment);
							}
							fnResolve(oFragment);
						});
						return;
					}
					fnResolve(oFragment);
				});


			}

			function getOperationEndedPromise() {
				return new Promise(function(fnResolve) {
					oTemplateContract.oNavigationObserver.getProcessFinished(true).then(function(){
						oTemplateContract.oBusyHelper.getUnbusy().then(fnResolve);
					});
				});
			}

			function fnOnBackButtonPressed(){
				if (oTemplateContract.oNavigationControllerProxy.isBackLeavingTheEditScope()){
					var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
					var fnSafetyFunction = oCurrentIdentity.treeNode.isDraft ? oTemplateContract.oPageLeaveHandler.performAfterDiscardOrKeepDraft : oTemplateContract.oDataLossHandler.performIfNoDataLoss;
					fnSafetyFunction(oTemplateContract.oNavigationControllerProxy.navigateBack, Function.prototype, "LeavePage");
				} else {
					fnPerformAfterSideEffectExecution(oTemplateContract.oNavigationControllerProxy.navigateBack, true);	
				}
			}

			// Returns a create context for the specified entity set which is already filled with the given predefined values
			function createNonDraft(sEntitySet, vPredefinedValues, oState) {
				var oRet = CRUDHelper.createNonDraft(null, "/" + sEntitySet, oTemplateContract.oAppComponent.getModel(), vPredefinedValues, mustRequireRequestsCanonical());
				// register this context at oState (if provided) such that it can be used correctly in the navigateInternal method
				if (oState){
					oState.aCreateContexts = oState.aCreateContexts || [];
					oState.aCreateContexts.push({
						entitySet: sEntitySet,
						context: oRet,
						predefinedValues: vPredefinedValues
					});
				}
				return oRet;
			}

			function fnNavigateToNonDraftCreateContext(oCreateContextSpec){
				oTemplateContract.oNavigationControllerProxy.navigateForNonDraftCreate(oCreateContextSpec.entitySet, oCreateContextSpec.predefinedValues, oCreateContextSpec.context);
			}

			// This function will be called before any draft transfer (that is edit/cancel/save in a draft base app is called).
			// oTransferEnded is a Promise that will be resolved/rejected as soon as this draft transfer has finished sucessfully/unsuccessfully
			function onBeforeDraftTransfer(oTransferEnded){
				var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
				for (var i = 0; i < aActiveComponents.length; i++){
					var oRegistryEntry = oTemplateContract.componentRegistry[aActiveComponents[i]];
					oRegistryEntry.utils.onBeforeDraftTransfer(oTransferEnded);
				}
			}

			// Public method that is called, when the activation of oContext is started. oActivationPromise must be a RemovalPromise like described in draftRemovalStarted
			function activationStarted(oContext, oActivationPromise) {
				onBeforeDraftTransfer(oActivationPromise);
				oContextBookkeeping.activationStarted(oContext, oActivationPromise);

			}

			// Public method that is called, when the cancellation of oContext is started. oCancellationPromise must be a RemovalPromise like described in draftRemovalStarted
			function cancellationStarted(oContext, oCancellationPromise, sActionType, oActive) {
				onBeforeDraftTransfer(oCancellationPromise);
				oContextBookkeeping.cancellationStarted(oContext, oCancellationPromise, sActionType, oActive);
			}

			// Public method called when the user has started an editing procedure (of a draft based object)
			// oContext: the context of the object to be edited
			// oEditingPromise: A promise that behaves as the Promise returned by function editEntity of CRUDManager
			function editingStarted(oContext, oEditingPromise) {
				onBeforeDraftTransfer(oEditingPromise);
				oContextBookkeeping.editingStarted(oContext, oEditingPromise);
			}

			function checkContextData(oContext) {
				return oContextBookkeeping.checkmPath2ContextData(oContext);
			}

			function fnRegisterStateChanger(oStateChanger){
				oTemplateContract.aStateChangers.push(oStateChanger);
			}

			// Note: This is the prepareDeletion-method exposed by the ApplicationProxy
			// The prepareDeletion-method of Application is actually the same as the prepareDeletion-method of deletionHelper.
			// That method internally calls the prepareDeletion-method of ApplicationProxy (i.e. this function).
			function fnPrepareDeletion(sPath, oPromise){
				oPromise.then(function(){
					oContextBookkeeping.adaptAfterObjectDeleted(sPath);
				}, Function.prototype);
			}

			function getLinksToUpperLayers(){
				return oTemplateContract.oNavigationControllerProxy.getLinksToUpperLayers();
			}

			function getResourceBundleForEditPromise(){
				var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
				var iMinViewLevel = 0;
				var oComponent;
				for (var i = 0; i < aActiveComponents.length; i++){
					var oRegistryEntry = oTemplateContract.componentRegistry[aActiveComponents[i]];
					if (oRegistryEntry.viewLevel > 0 && (iMinViewLevel === 0 || oRegistryEntry.viewLevel < iMinViewLevel)){
						iMinViewLevel = oRegistryEntry.viewLevel;
						oComponent = oRegistryEntry.oComponent;
					}
				}
				var oComponentPromise = oComponent ? Promise.resolve(oComponent) : oTemplateContract.oNavigationControllerProxy.getRootComponentPromise();
				return oComponentPromise.then(function(oComp){
					return oComp.getModel("i18n").getResourceBundle();
				});
			}

			function getAppTitle() {
				return oTemplateContract.oNavigationControllerProxy.getAppTitle();
			}

			function getCurrentKeys(iViewLevel){
				return oTemplateContract.oNavigationControllerProxy.getCurrentKeys(iViewLevel);
			}
			
			/*
             * Check if OP is open in edit mode or not
             * @param {string} sEntitySet the name of the entity set
             * @param {string} sKey Unique key to identify each row
             * @returns {boolean} returns false if OP is not edit mode 
             * @public
             * 
             */
            function isObjectInEditMode(sEntitySet, sKey) {
                var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
                var oTreeNode = oCurrentIdentity.treeNode;
                if (oTreeNode.level !== 1 || oTreeNode.entitySet !== sEntitySet || oCurrentIdentity.keys[1] !== sKey) {
                    return false;
                }
                var oComponentRegistryEntry = oTemplateContract.componentRegistry[oTreeNode.componentId];
                var oUiModel = oComponentRegistryEntry.oComponent.getModel("ui");
                return oUiModel.getProperty("/editable");
            }

			// get the ancestral node of a given node node with the given level
			function getAncestralNode(oTreeNode, iTargetLevel){
				var oRet = oTreeNode;
				for (; oRet.level > iTargetLevel;){
					oRet = oTemplateContract.mRoutingTree[oRet.parentRoute];
				}
				return oRet;
			}

			var oGlobalObject;
			function getCommunicationObject(oComponent, iLevel){
				var i = iLevel || 0;
				if (i > 0){
					// This is only allowed for ReuseComponents, which is not handled here
					return null;
				}
				var sComponentId = oComponent.getId();
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				var oTreeNode = oTemplateContract.mRoutingTree[oRegistryEntry.route];
				var oRet = oTreeNode.communicationObject;
				for (; i < 0 && oRet; ){
					oTreeNode = oTemplateContract.mRoutingTree[oTreeNode.parentRoute];
					if (oTreeNode.communicationObject !== oRet){
						i++;
						oRet = oTreeNode.communicationObject;
					}
				}
				if (i < 0 || oRet){
					return oRet;
				}
				oGlobalObject = oGlobalObject || {};
				return oGlobalObject;
			}

			function getForwardNavigationProperty(iViewLevel){
				for (var sKey in oTemplateContract.mEntityTree) {
					if (oTemplateContract.mEntityTree[sKey].navigationProperty && (oTemplateContract.mEntityTree[sKey].level === iViewLevel + 1)) {
						return oTemplateContract.mEntityTree[sKey].navigationProperty;
					}
				}
			}

			// This method is called when a draft modification is done. It sets the root draft to modified.
			function fnMarkCurrentDraftAsModified(){
				var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
				for (var oTreeNode = oCurrentIdentity.treeNode; oTreeNode.level > 0; oTreeNode = oTemplateContract.mRoutingTree[oTreeNode.parentRoute]){
					if (oTreeNode.level === 1 && oTreeNode.isDraft){
						var sModifiedPath = oTreeNode.getPath(3, oCurrentIdentity.keys);
						oContextBookkeeping.markDraftAsModified(sModifiedPath);
						return;
					}
				}
			}

			/**
			 * Check if entity set passed is etag enabled
			 * @param {string} sEntitySet - Name of the entitySet
			 * @returns {boolean} There are particularly 3 scenarios
			 * a) EntitySet is found & ETag is enabled then returns true
			 * b) EntitySet is found & ETag is disabled then returns false
			 * c) EntitySet information is not found (may be it is not loaded) then returns true
			 * @private
			 */

			// in cases a) and b) the information is cached in mEntitySetToETagInfo whereas in 
			// case c) this is not happening
			
			function fnCheckEtags(sEntitySet) {
				if (mEntitySetToETagInfo[sEntitySet] === undefined) {
					var oModel = oTemplateContract.oAppComponent.getModel();
					var oMetaModel = oModel.getMetaModel();
					var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
					
					if (oEntitySet) { // oEntitySet is not loaded then there is no point checking for the ETag				
						var mContexts = oModel.mContexts; // this is actually an access to an internal property and should be replaced by an official api.
						var sContextKey;
						for (sContextKey in mContexts) {
							var oContext = mContexts[sContextKey];
							var sCurrentEntitySet = oDataModelHelper.analyseContext(oContext).entitySet;
							// If the current EntitySet match with the passed in EntitySet only then it is
							// relevant otherwise skip the execution
							if (sCurrentEntitySet === sEntitySet) {
								var sPath = oContext.getPath();
								var oEntity = oModel.getProperty(sPath);
								var sEtag = oModel.getETag(undefined, undefined, oEntity);
								mEntitySetToETagInfo[sEntitySet] = !!sEtag;
								break;
							}
						}
					}
				}
				return mEntitySetToETagInfo[sEntitySet] || mEntitySetToETagInfo[sEntitySet] === undefined;
			}

			function fnRefreshAllComponents(mExceptions) {
				var i, sId, oRegistryEntry;
				var aAllComponents = oTemplateContract.oNavigationControllerProxy.getAllComponents(); // get all components
				for (i = 0; i < aAllComponents.length; i++) {
					sId = aAllComponents[i];
					if (!mExceptions || !mExceptions[sId]){
						oRegistryEntry = oTemplateContract.componentRegistry[sId];
						oRegistryEntry.utils.refreshBinding(true);
					}
				}
			}

			function setStoredTargetLayoutToFullscreen(iLevel){
				if (oTemplateContract.oFlexibleColumnLayoutHandler){
					oTemplateContract.oFlexibleColumnLayoutHandler.setStoredTargetLayoutToFullscreen(iLevel);
				}
			}

			// Call this function, when paginator info is no longer reliable due to some cross navigation
			function fnInvalidatePaginatorInfo(){
				oTemplateContract.oPaginatorInfo = {};
			}

			// returns meta data of the specified navigation property for the specified entity set if it exists. Otherwise it returns a faulty value.
			function getNavigationProperty(sEntitySet, sNavProperty){
				var mMyNavigationProperties = mNavigationProperties[sEntitySet];
				if (!mMyNavigationProperties){
					mMyNavigationProperties = Object.create(null);
					mNavigationProperties[sEntitySet] = mMyNavigationProperties;
					var oModel = oTemplateContract.oAppComponent.getModel();
					var oMetaModel = oModel.getMetaModel();
					var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
					var oEntityType = oEntitySet && oMetaModel.getODataEntityType(oEntitySet.entityType);
					var aNavigationProperty = (oEntityType && oEntityType.navigationProperty) || [];
					for (var i = 0; i < aNavigationProperty.length; i++){
						var oNavigationProperty = aNavigationProperty[i];
						mMyNavigationProperties[oNavigationProperty.name] = oNavigationProperty;
					}
				}
				return mMyNavigationProperties[sNavProperty];
			}

			// oDraftContext holds the context information of the object whose sibling information needs to be fetched
			// oTargetInfo is an object holding target sibling context's partial key information and the target's treenode
			function fnSwitchToDraft(oDraftContext, oTargetInfo){
				var oSwitchToSiblingPromise = oTemplateContract.oNavigationControllerProxy.getSwitchToSiblingPromise(oDraftContext, 2, oTargetInfo);
				oTemplateContract.oBusyHelper.setBusy(oSwitchToSiblingPromise.then(function(fnNavigate) {
					fnNavigate();
				}));
			}

			// returns a Promise that resolves to a function that
			// performs the navigation which has to be done after cancelling a draft
			// the returned function itself returns a Promise which is resolved as soon as the navigation has been started
			function getNavigateAfterDraftCancelPromise(oContext, bAsNavigationOptions){
				var oSpecialPromise = oTemplateContract.oNavigationControllerProxy.getSpecialDraftCancelOptionPromise(oContext);
				if (oSpecialPromise){
					return bAsNavigationOptions ? oSpecialPromise : oSpecialPromise.then(function(oNavigationOptions){
						return oTemplateContract.oNavigationControllerProxy.getNavigationFunction(oNavigationOptions);
					});
				}
				var oSiblingPromise = oContextBookkeeping.getDraftSiblingPromise(oContext);
				var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
				var oRegistryEntry = oTemplateContract.componentRegistry[oCurrentIdentity.treeNode.componentId];
				var oTargetKeyPromise = oRegistryEntry && oRegistryEntry.utils.getTargetKeyFromLevel(2); // get TargetInfo from level 2

				return Promise.all([oSiblingPromise, oTargetKeyPromise]).then(function(aActiveAndKey){
					var oActive = aActiveAndKey[0];
					var oActiveObject = oActive && oActive.getObject();
					var bIsActiveEntity = oActiveObject && oActiveObject.IsActiveEntity;
					if (!bIsActiveEntity){ // create draft
						if (bAsNavigationOptions){
							var oRootIdentityPromise = oTemplateContract.oNavigationControllerProxy.getRootIdentityPromise();
							return oRootIdentityPromise.then(function(oRootIdentity){
								return {
									identity: oRootIdentity,
									mode: 1,
									displayMode: 1
								};
							});
						}
						return deletionHelper.getNavigateAfterDeletionOfCreateDraft(oTemplateContract);
					}
					return oTemplateContract.oNavigationControllerProxy.getSwitchToSiblingPromise(oActive, 1, aActiveAndKey[1], bAsNavigationOptions).then(function(vNavigationInfo) {
						return bAsNavigationOptions ? {
							identity: vNavigationInfo,
							mode: 1,
							displayMode: 1						
						} : function() {
							// The active context is invalidated as the DraftAdministrativeData of the context(the active context) has changed after draft deletion.
							// This is done to keep the DraftAdministrativeData of the record updated.
							var oModel = oActive.getModel();
							oModel.invalidateEntry(oActive);
							return vNavigationInfo();
						};
					});
				});
			}

			// This function loops through the parent nodes of oTreeNode and returns an array having oTreeNode and all ancestor treeNodes upto the level provided in iFromLevel
			function getAncestorTreeNodePath(oTreeNode, iFromLevel){
				var aRet = [];
				for (var oNode = oTreeNode; oNode.level >= iFromLevel; oNode = oTemplateContract.mRoutingTree[oNode.parentRoute]){
					aRet.push(oNode);
					if (oNode.level === 0){
						break;
					}
				}
				return aRet.reverse();
			}

			// This function determines Treenode and keys which should be used for a sibling for a given combination of Treenode and keys.
			// More precisely: oTreeNode and aKeys describe the instance the sibling should be found for.
			// aResultKeys is an array which will be filled with the sibling keys.
			// Note that the caller might have already filled aResultKeys with some first elements known to him.
			// sBatchGroup holds the groupId value, when sBatchGroup is passed with a truthy value like "Changes", requests belonging to the same group 
			// will be bundled in one batch request and when sBatchGroup value is not available, the request will be triggered immediately
			// The function returns a Promise which is resolved as soon as the keys have been determined. This Promise resolves to a Treenode which
			// is the original Treenode or one of its parents (in case that no sibling exists for the last entries of aKeys)
			function fnFillSiblingKeyPromise(oTreeNode, aKeys, aResultKeys, sBatchGroup){
				if (aResultKeys.length === 0){
					aResultKeys.push("");  // first key is always the empty string	
				}
				if (oTreeNode.level < aResultKeys.length){ // in this case the keys must actually be shortened (or kept) to fit for oTreeNode
					aResultKeys.splice(oTreeNode.level + 1, aResultKeys.length - oTreeNode.level - 1);
					return Promise.resolve(oTreeNode);
				}
				// Here we really have missing keys
				var aTreeNodes = getAncestorTreeNodePath(oTreeNode, aResultKeys.length); // aTreeNodes is the array of those TreeNodes that miss a key in natural order
				var aSiblingKeysPromises = aTreeNodes.map(function(oAncestorNode){ // an array of Promises corresponding to aTreeNodes. The Promises resolve to the keys to be used for that tree node (resp true if no key is needed and undefined if there is no sibling key)
					if (oAncestorNode.noKey || oAncestorNode.level === 0){
						return Promise.resolve(true);
					}
					if (!oAncestorNode.isDraft){
						return Promise.resolve(aKeys[oAncestorNode.level]);
					}
					var sContextPath = oAncestorNode.getPath(3, aKeys);
					var oSiblingPromise = oContextBookkeeping.getSiblingPromise(sContextPath, sBatchGroup);
					return oSiblingPromise.then(function(oSiblingContext){
						var oTarget = oSiblingContext && oDataModelHelper.analyseContext(oSiblingContext);
						return oTarget && oTarget.key; // if no sibling exists for the given TreeNode (would be the case for create drafts) hierarchy ends one level above
					}, Function.prototype);
				});
				return Promise.all(aSiblingKeysPromises).then(function(aSiblingKeys){
					var oResultTreeNode = oTemplateContract.mRoutingTree[aTreeNodes[0].parentRoute];                     
					aSiblingKeys.every(function(vKey, i){
						if (vKey){
							aResultKeys.push(vKey === true ? "" : vKey);
							oResultTreeNode = aTreeNodes[i];
						}
						return vKey;
					});
					return oResultTreeNode;
				});
			}
			
			// Returns a Promise that resolves to a function which triggers a replace-navigation to the sibling path of the current path
			// bIsTargetEdit denotes whether the target is expected to be a draft (or the active version)
			// sBatchGroup if sBatchGroup is truthy this is used to read sibling information if needed.
			function getSwitchToSiblingFunctionPromise(bIsTargetEdit, sBatchGroup){
				return oTemplateContract.oNavigationControllerProxy.getSwitchToSiblingFunctionPromise(bIsTargetEdit, sBatchGroup);
			}

			function fnNavigateAfterActivation(oActiveContext){
				return oTemplateContract.oNavigationControllerProxy.navigateAfterActivation(oActiveContext);
			}

			function fnNavigateToSubContext(oContext, bReplace, iDisplayMode, oContextInfo){
				oTemplateContract.oNavigationControllerProxy.navigateToSubContext(oContext, bReplace, iDisplayMode, oContextInfo);
			}
			
			function fnNavigateToDetailContextIfPossible(oContext, bReplace, iDisplayMode, oContextInfo){
				return oTemplateContract.oNavigationControllerProxy.navigateToDetailContextIfPossible(oContext, bReplace, iDisplayMode, oContextInfo);	
			}
			
			function fnNavigateByExchangingQueryParam(sQueryParam, vValue){
				oTemplateContract.oNavigationControllerProxy.navigateByExchangingQueryParam(sQueryParam, vValue);
			}

			function needsToSuppressTechnicalStateMessages(){
				return !oTemplateContract.bCreateRequestsCanonical;
			}

			// returns the information whether we must set the createRequestsCanonical flag for all requests
			function mustRequireRequestsCanonical(){
				return !oTemplateContract.bCreateRequestsCanonical; // this is the fact if we do not do it ourselves
			}

			function checkIfObjectIsADraftInstance(sPath){
				return oContextBookkeeping.checkIfObjectIsADraftInstance(sPath);
			}

			function getContextForPath(sPath){
				return oContextBookkeeping.getContextForPath(sPath);
			}

			function getStatePreservationMode() {
				var sStatePreservationMode = oTemplateContract.oAppComponent.getStatePreservationMode();
				if (sStatePreservationMode === "auto") {
					return oTemplateContract.oFlexibleColumnLayoutHandler ? "persistence" : "discovery";
				} 
				return sStatePreservationMode;
			}

			var oNavigationHandler; // initialized on demand
			function getNavigationHandler() {
				if (!oNavigationHandler){
					oNavigationHandler = new NavigationHandler(oTemplateContract.oAppComponent);
					if (oNavigationHandler.registerNavigateCallback){
						oNavigationHandler.registerNavigateCallback(function(oNavigationFinishedPromise){
							var callbackFunc = function() {
								oTemplateContract.oBusyHelper.setBusyReason("exiting", false); // remove busy when we are informed that navigation has finished. Important in case that navigation was expad.
							};
							oNavigationFinishedPromise.then ? oNavigationFinishedPromise.then(callbackFunc) : oNavigationFinishedPromise.done(callbackFunc);	
						});
					}
				}
				return oTemplateContract.ghostapp ? GHOSTNAVIGATIONHANDLER : oNavigationHandler;
			}
			
			// This function wraps the NavigationHandler.navigate method. It ensures that the source app is busy until the app is really left.
			// This is done in order to protect from additional user actions which might be triggered while the app is still in process of being left.
			function fnNavigateExternal(sSemanticObject, sActionName, vNavigationParameters, oInnerAppData, fnOnError, oExternalAppData, sNavMode){
				var oCurrentNavigationHandler = getNavigationHandler();
				if (oCurrentNavigationHandler === GHOSTNAVIGATIONHANDLER){
					return;
				}
				oTemplateContract.oNavigationControllerProxy.leave();
				var fnOnErrorWrapper = function(){
					oFocusHelper.setNextFocus(Function.prototype); // Do not change focus in case exiting the application fails
					oTemplateContract.oBusyHelper.setBusyReason("exiting", false);  // in error case we are not navigating away         
					if (fnOnError){
						fnOnError.apply(this, arguments);
					}
				};
				oTemplateContract.oBusyHelper.setBusyReason("exiting", true); // as we are navigating away we are setting the app to busy immediately. This will be reset if navigation is broken or app is reentered 
				oCurrentNavigationHandler.navigate(sSemanticObject, sActionName, vNavigationParameters, oInnerAppData, fnOnErrorWrapper, oExternalAppData, sNavMode);
			}

			function fnSetObjectInEditMode(bValue) {
				bObjectInEditMode = bValue;
			}

			function fnGetObjectInEditMode() {
				return bObjectInEditMode;
			}

			function fnGetEditFlowOfRoot(){
				return oTemplateContract.mRoutingTree.root.page.component.settings && oTemplateContract.mRoutingTree.root.page.component.settings.editFlow;
			}
			
			function fnPrepareForControlNavigation(oComponent, sControlId){
				var sComponentId = oComponent.getId();
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				return Promise.resolve(oRegistryEntry.methods.prepareForControlNavigation && oRegistryEntry.methods.prepareForControlNavigation(sControlId));
			}
			
			// A function that checks whether there is a child page of the current page that fits better to the given message.
			// Thereby sFullTarget is one of the full targets of the message, which should be used for navigation.
			// Returns a Promise that resolves to a truthy value exactly if such a navigation is possible and has been already triggered.
			// Thereby it is also ensured that focussing on the message will be tried once more after the navigation has happened.
			function fnNavigateToMessageTarget(oMessage, sFullTarget){
				return oTemplateContract.oNavigationControllerProxy.navigateToMessageTarget(oMessage, sFullTarget);
			}
			
			// The following functions are used to cover the case that we want to navigate to a control related to a message
			// on a certain view, but no control (on that view) is attached to this message yet.
			// In this case fnRegisterForMessageNavigation is being called. This function registers itself for the change of
			// the property controlIds contained in that message. After a change it triggers a retry of the navigation.
			// Note that this will result in another call of the same function if again no control id could be found.
			var oMessageNavigation; // information about the navigation currently waiting. Contains a deregister method which can be called if the navigation is obsolete.
			var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();
			function fnRegisterForMessageNavigation(oTemplateUtils, oMessage, oComponent){
				fnDeregisterForMessageNavigation(); // previous registration (if existing) have become obsolete
				var oMessageBinding; // check whether the message is really in the message model and create a binding
				if (!oMessage || !oMessageModel.getProperty("/").some(function(oMessageCandidate, i){
					if (oMessage === oMessageCandidate){
						var sPath = "/" + i + "/controllIds"; // the path needs to be built based on the index :-(
						oMessageBinding = oMessageModel.bindProperty(sPath);
						return true;
					}
				})){
					return;	
				}
				oMessageNavigation = { };
				var fnOnBindingChange = function(){
					fnDeregisterForMessageNavigation(); // this registration is processed
					MessageUtils.navigateFromMessageTitleEvent(oTemplateUtils, oMessage, oComponent, false); // try again to navigate to that message 
				};
				oMessageBinding.attachChange(fnOnBindingChange);
				oMessageNavigation.deregister = function(){
					oMessageBinding.detachChange(fnOnBindingChange);
					oMessageBinding.destroy();
					oMessageNavigation = null;
				};
			}
			
			function fnDeregisterForMessageNavigation(){
				if (oMessageNavigation){
					oMessageNavigation.deregister();
				}
			}
			
			// a list of objects possessing a method "isCustomMessage". Transient messages fulfilling this consition for at least one provider are excluded from the
			// standard handling of transient messages.
			var aCustomMessageProviders = [];			
			
			function fnRegisterCustomMessageProvider(oCustomMessageProvider){
				 aCustomMessageProviders.push(oCustomMessageProvider);
			}
			
			function isTransientMessageNoCustomMessage(oMessage){
				return !aCustomMessageProviders.some(function(oCustomMessageProvider){
					return oCustomMessageProvider.isCustomMessage(oMessage);
				});
			}
			
			function fnRemoveTransientMessages(){
				MessageUtils.removeTransientMessages(isTransientMessageNoCustomMessage);
			}
			
			function getTransientMessages(){
				return MessageUtils.getTransientMessages(false, isTransientMessageNoCustomMessage);
			}
			
			function getIntentPromise(){
				return oTemplateContract.myIntentPromise;
			}
		
			oTemplateContract.oApplicationProxy = { // inject own api for AppComponent into the Template Contract. Other classes (NavigationController, BusyHelper) will call these functions accordingly.
				getDraftSiblingPromise: oContextBookkeeping.getDraftSiblingPromise,
				getSiblingPromise: oContextBookkeeping.getSiblingPromise,
				fillSiblingKeyPromise: fnFillSiblingKeyPromise,
				getAlternativeIdentityPromise: oContextBookkeeping.getAlternativeIdentityPromise,
				getPathOfLastShownDraftRoot: oContextBookkeeping.getPathOfLastShownDraftRoot,
				areTwoKnownPathesIdentical: oContextBookkeeping.areTwoKnownPathesIdentical,
				getIdentityKeyForContext: oContextBookkeeping.getIdentityKeyForContext,
				getNavigateAfterDraftCancelPromise: getNavigateAfterDraftCancelPromise,
				getAncestralNode: getAncestralNode,
				getResourceBundleForEditPromise: getResourceBundleForEditPromise,

				getContentDensityClass: getContentDensityClass,
				getDialogFragment: getDialogFragmentForView.bind(null, null),
				getDialogFragmentAsync: getDialogFragmentForViewAsync.bind(null, null),
				destroyView: function(sViewId){
					delete mFragmentStores[sViewId];
				},
				markCurrentDraftAsModified: fnMarkCurrentDraftAsModified,
				prepareDeletion: fnPrepareDeletion,
				performAfterSideEffectExecution: fnPerformAfterSideEffectExecution,
				onBackButtonPressed: fnOnBackButtonPressed,
				mustRequireRequestsCanonical: mustRequireRequestsCanonical,
				cancellationStarted: cancellationStarted,
				checkIfObjectIsADraftInstance: checkIfObjectIsADraftInstance,
				getContextForPath: getContextForPath,
				invalidatePaginatorInfo: fnInvalidatePaginatorInfo,
				deregisterForMessageNavigation: fnDeregisterForMessageNavigation,
				isTransientMessageNoCustomMessage: isTransientMessageNoCustomMessage,
				removeTransientMessages: fnRemoveTransientMessages,
				getTransientMessages: getTransientMessages,
				setNextFocus: oFocusHelper.setNextFocus
			};

			return {
				createNonDraft: createNonDraft,
				navigateToNonDraftCreateContext: fnNavigateToNonDraftCreateContext,
				getContentDensityClass: getContentDensityClass,
				attachControlToParent: fnAttachControlToParent,
				getDialogFragmentForView: getDialogFragmentForView,
				getDialogFragmentForViewAsync: getDialogFragmentForViewAsync,
				getBusyHelper: function() {
					return oTemplateContract.oBusyHelper;
				},
				addSideEffectPromise: fnAddSideEffectPromise,
				performAfterSideEffectExecution: fnPerformAfterSideEffectExecution,
				isComponentActive: isComponentActive,
				showMessageToast: function() {
					var myArguments = arguments;
					var fnMessageToast = function() {
						oLogger.info("Show message toast");
						MessageToast.show.apply(MessageToast, myArguments);
					};
					Promise.all([getOperationEndedPromise(true), oTemplateContract.oBusyHelper.getUnbusy()]).then(fnMessageToast);
				},
				showMessageBox: function() {
					var myArguments = arguments;
					var fnMessageBox = function() {
						oLogger.info("Show message box");
						MessageBox.show.apply(MessageBox, myArguments);
					};
					Promise.all([getOperationEndedPromise(true), oTemplateContract.oBusyHelper.getUnbusy()]).then(fnMessageBox);
				},
				registerStateChanger: fnRegisterStateChanger,
				getDraftSiblingPromise: oContextBookkeeping.getDraftSiblingPromise,
				registerContext: oContextBookkeeping.registerContext,
				activationStarted: activationStarted,
				cancellationStarted: cancellationStarted,
				editingStarted: editingStarted,
				checkContextData: checkContextData,
				getLinksToUpperLayers: getLinksToUpperLayers,
				getAppTitle: getAppTitle,
				getCurrentKeys: getCurrentKeys,
				isObjectInEditMode :isObjectInEditMode,
				getCommunicationObject: getCommunicationObject,
				getForwardNavigationProperty: getForwardNavigationProperty,
				markCurrentDraftAsModified: fnMarkCurrentDraftAsModified,
				checkEtags: fnCheckEtags,
				refreshAllComponents: fnRefreshAllComponents,
				getIsDraftModified: oContextBookkeeping.getIsDraftModified,
				prepareDeletion: deletionHelper.prepareDeletion.bind(null, oTemplateContract),
				setStoredTargetLayoutToFullscreen: setStoredTargetLayoutToFullscreen,
				invalidatePaginatorInfo: fnInvalidatePaginatorInfo,
				getNavigationProperty: getNavigationProperty,
				switchToDraft: fnSwitchToDraft,
				getNavigateAfterDraftCancelPromise: getNavigateAfterDraftCancelPromise,
				getSwitchToSiblingFunctionPromise: getSwitchToSiblingFunctionPromise,
				navigateAfterActivation: fnNavigateAfterActivation,
				navigateToSubContext: fnNavigateToSubContext,
				navigateToDetailContextIfPossible: fnNavigateToDetailContextIfPossible,
				navigateByExchangingQueryParam: fnNavigateByExchangingQueryParam,
				navigateToMessageTarget: fnNavigateToMessageTarget,
				registerForMessageNavigation: fnRegisterForMessageNavigation,
				onBackButtonPressed: fnOnBackButtonPressed,
				needsToSuppressTechnicalStateMessages: needsToSuppressTechnicalStateMessages,
				mustRequireRequestsCanonical: mustRequireRequestsCanonical,
				getNavigationHandler: getNavigationHandler,
				navigateExternal: fnNavigateExternal,
				getStatePreservationMode: getStatePreservationMode,
				setObjectInEditMode: fnSetObjectInEditMode,
				getObjectInEditMode: fnGetObjectInEditMode,
				getEditFlowOfRoot : fnGetEditFlowOfRoot,
				getLeaveAppPromise: function() {
					return oTemplateContract.leaveAppPromise;
				},
				getComponentRefreshBehaviour: function(oIntentNavigation) {
					return oKeepAliveHelper.getComponentRefreshBehaviour(oIntentNavigation);
				},
				getChevronNavigationRefreshBehaviour: function(sTableEntitySet) {
					return oKeepAliveHelper.getChevronNavigationRefreshBehaviour(sTableEntitySet);
				},
				prepareForControlNavigation: fnPrepareForControlNavigation,
				registerCustomMessageProvider: fnRegisterCustomMessageProvider,
				removeTransientMessages: fnRemoveTransientMessages,
				getTransientMessages: getTransientMessages,
				setNextFocus: oFocusHelper.setNextFocus,
				getIntentPromise: getIntentPromise
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.lib.Application", {
			constructor: function(oTemplateContract) {
				extend(this, getMethods(oTemplateContract));
			}
		});
	});
