sap.ui.define(["sap/ui/base/Object", "sap/f/FlexibleColumnLayoutSemanticHelper", "sap/f/library", "sap/base/util/extend", "sap/suite/ui/generic/template/genericUtilities/controlHelper"],
	function(BaseObject, FlexibleColumnLayoutSemanticHelper, fioriLibrary, extend, controlHelper) {
		"use strict";

		// shortcut for sap.f.LayoutType
		var LayoutType = fioriLibrary.LayoutType;

		var iDefaultColumn = 2;

		var aColumnNames = ["begin", "mid", "end"];
		
		var aActionButtons = ["fullScreen", "exitFullScreen", "closeColumn"];

		var aMessagePageTargets = ["messagePageBeginColumn", "messagePageMidColumn", "messagePageEndColumn"];

		function tVL(iFCLLevel){
			return aColumnNames[iFCLLevel] ? iFCLLevel : iDefaultColumn;
		}

		function getPagesAggregation(iFCLLevel){
			return 	aColumnNames[tVL(iFCLLevel)] + "ColumnPages";
		}

		function createMessagePageTargets(fnCreateAdditionalMessageTarget){
			for (var i = 0; i < aColumnNames.length; i++){
				fnCreateAdditionalMessageTarget(aMessagePageTargets[i], getPagesAggregation(i));
			}
		}

		function getTargetForMessagePage(iViewLevel){
			return aMessagePageTargets[tVL(iViewLevel)];
		}

		function getColumnForFCLLevel(iFCLLevel){
			return aColumnNames[tVL(iFCLLevel)];
		}

		// Gets the items for a smart table or a smart list
		function getItemsArrayFromControl(oControl) {
			var aItems;
			if (oControl instanceof sap.ui.table.Table) {
				aItems = oControl.getRows();
			} else if (oControl instanceof sap.m.Table || oControl instanceof sap.m.List) {
				aItems = oControl.getItems();
			}
			return aItems;
		}

		function getFirstItemInControl(oControl) {
			// Returns the first item of the list which is not a grouping item. Returns a faulty value if list is empty.
			var aItems = getItemsArrayFromControl(oControl);
			var vRet = aItems ? aItems[0] : false;
			return vRet;
		}

		function getFCLLayoutFromStateObject(oStateObject){
			return (oStateObject && (Array.isArray(oStateObject.FCLLayout) ? oStateObject.FCLLayout.sort()[0] : oStateObject.FCLLayout)) || "";
		}

		function getMethods(oFlexibleColumnLayout, oNavigationControllerProxy) {
			var oTemplateContract =	oNavigationControllerProxy.oTemplateContract;
			var oFCLSettings  = oTemplateContract.oAppComponent.getFlexibleColumnLayout();
			var oFlexibleColumnLayoutSemanticHelper = FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFlexibleColumnLayout, oFCLSettings);

			var oUiState;
			var sCurrentLayout;
			var sStoredTargetLayout;
			var mComponentsToLayouts = Object.create(null); // Maps ids of components to the layouts they have been last shown in

			// it is possible to use the FCL with 3 columns which is the default. But you can also have 2 columns as maximum. Further views are displayed in fullscreen mode
			var iMaxColumnCountInFCL = sap.ui.Device.system.phone ? 1 : (oFCLSettings.maxColumnsCount || 3);

			// if this is true we trigger a search in list report on startup and load the first entry for the second column. This is basically the master/detail mode.
			var bLoadListAndFirstEntryOnStartup = iMaxColumnCountInFCL > 1 && oFCLSettings.initialColumnsCount === 2;
			var sDetailRoute4MD; // will be initialized in fnAdaptRoutingInfo if master/detail is active               

			var aDefaultLayouts = (function(){
				var oDefaultUiLayouts = oFlexibleColumnLayoutSemanticHelper.getDefaultLayouts();
				return [bLoadListAndFirstEntryOnStartup ? oDefaultUiLayouts.defaultTwoColumnLayoutType : oDefaultUiLayouts.defaultLayoutType, oDefaultUiLayouts.defaultTwoColumnLayoutType, oDefaultUiLayouts.defaultThreeColumnLayoutType];
			})();


			// if this is true we load the next item in the second column after the current object is deleted. If this is false we close the column.
			var bDisplayNextObjectAfterDelete = oFCLSettings.displayNextObjectAfterDelete === true;

			function isMultipleColumn(oTreeNode){
				return oTreeNode.fCLLevel === 1 || oTreeNode.fCLLevel === 2 || (oTreeNode.level === 0 && bLoadListAndFirstEntryOnStartup);
			}

			function getPreferedColumnCount(oTreeNode){
				if (oTreeNode.fCLLevel === 3 || iMaxColumnCountInFCL === 1 || (oTreeNode.fCLLevel === 0 && oTreeNode.level > 0)) { // if oTreeNode.fCLLevel === oTreeNode.level === 0 we still have to consider initialColumnsCount
					return 1;
				}
				var initialColumnsCount = oFCLSettings.initialColumnsCount || 1;
				var iRet = Math.max(oTreeNode.fCLLevel + 1, initialColumnsCount);
				return sap.ui.Device.system.tablet && iRet > 2 ? 2 : iRet;
			}

			// Adapts the route and returns the control aggregation. Called during startup.
			function fnAdaptRoutingInfo(oRoute, sTargetName, aPredecessorTargets, oTreeNode) {
				var iPreferedColumnCount = getPreferedColumnCount(oTreeNode);
				// Note: If oTreeNode.fCLLevel === 2 and iPreferredColumnCount === 2 (tablet case)
				// still all 3 columns should be available although only 2 of them will be visible at the same time.
				oRoute.showBeginColumn = oTreeNode.fCLLevel === 0 || iPreferedColumnCount > 1;
				oRoute.showMidColumn = oTreeNode.fCLLevel === 1 || iPreferedColumnCount > 1;
				oRoute.showEndColumn = oTreeNode.fCLLevel > 1;

				if (iPreferedColumnCount === 1){
					oRoute.target = sTargetName;
				} else if (oTreeNode.level === 0){ // master detail case
					sDetailRoute4MD = oTreeNode.page.pages[0].entitySet; // note that children have not been set at this point in time
					oRoute.target = [sTargetName, sDetailRoute4MD]; // Note that oTreeNode.children has not been filled at this point in time
				} else {
					oRoute.target = aPredecessorTargets.concat([sTargetName]);
				}

				return getPagesAggregation(oTreeNode.fCLLevel);
			}

			function isLayoutDefault(sLayout, sRoute){
				// temporary solution
				if (sLayout === LayoutType.OneColumn && bLoadListAndFirstEntryOnStartup){
					return false;
				}

				var oTreeNode = sRoute && oTemplateContract.mRoutingTree[sRoute];

				var sDefaulLayout = oTreeNode && oTreeNode.defaultLayoutType;
				if (sDefaulLayout){
					return sLayout === sDefaulLayout;
				}
				return sLayout === aDefaultLayouts[0] || sLayout === aDefaultLayouts[1] || sLayout === aDefaultLayouts[2];
			}

			function activateView(oActivationInfo, sPath, sRoute) {
				var oTreeNode = oTemplateContract.mRoutingTree[sRoute];
				return oTreeNode.componentCreated.then(function(oComponent) {
					return oNavigationControllerProxy.activateOneComponent(sPath, oActivationInfo, oComponent);
				});
			}

			// Returns an object that may have the following three attributes: begin, middle, end.
			// The availability of the attributes depends on the availability of the corresponding column according to the current view level.
			// Each of the attributes will be an object with the following attributes:
			// - route: Name of the route leading to the view in this column
			// - path: The OData path that this view should be bound to
			// - isVisible: The information whether this column is really visible
			// Note that this function relies on the fact that oUiState already has been set correctly.
			function fnDetermineRoutesAndPathes(bIsNonDraftCreate){
				var oCurrentIdentity = oNavigationControllerProxy.getCurrentIdentity();
				if (!oCurrentIdentity){ //this is the case if this method is called before first route matched (due to resize)
					return null;
				}
				var oRet = {};
				var bPerformAnalysis = true;
				for (var oTreeNode = oCurrentIdentity.treeNode; bPerformAnalysis; oTreeNode = oTemplateContract.mRoutingTree[oTreeNode.parentRoute]){
					var iFCLLevel = oTreeNode.fCLLevel;
					var sPar = getColumnForFCLLevel(iFCLLevel);
					oRet[sPar] = {
						route: oTreeNode.sRouteName,
						path: bIsNonDraftCreate ? "-" : oTreeNode.getPath(2, oCurrentIdentity.keys),
						isVisible: iFCLLevel > 2 || oUiState.columnsVisibility[sPar + "Column"]
					};
					bPerformAnalysis = iFCLLevel === 1 || iFCLLevel === 2;
					bIsNonDraftCreate = false; // only last column can be the create column
				}
				return oRet;
			}

			// This function is called in two scenarios:
			// 1. The visibility of at least one column has changed without change of a route (oVisibilityChanged truthy). In this case the layout is also unchanged.
			// 2. The route has changed (oVisibilityChanged faulty)
			// The function returns a Promise which is resolved when all visible components (scenario 2) resp. all components that have become visible (scenario 1) have been activated
			function fnAdaptToRouteOrVisibilityChange(oActivationInfo, oVisibilityChanged){
				var oRoutesAndPathes = fnDetermineRoutesAndPathes(oActivationInfo.isNonDraftCreate);
				if (!oRoutesAndPathes){
					return Promise.resolve();
				}
				var aActivationPromises = [];
				// If oVisibilityChanged is truthy, we consider the columns in oVisibilityChanged which map to true as task list for the following analysis.
				// Note that these columns all appear in oRoutesAndPathes as well, since they are valid for the current layout.
				// If oVisibilityChanged is faulty, oRoutesAndPathes will serve as a task list.
				var oColumns = oVisibilityChanged || oRoutesAndPathes;
				for (var sColumn in oColumns){
					if (oColumns[sColumn]){
						var oColumnInfo = oRoutesAndPathes[sColumn];
						if (oColumnInfo.isVisible){
							aActivationPromises.push(activateView(oActivationInfo, oColumnInfo.path, oColumnInfo.route));
						} else {
							var iRouteLevel = oTemplateContract.oTemplatePrivateGlobalModel.getProperty("/generic/routeLevel");
							var oTreeNode = oTemplateContract.mRoutingTree[oColumnInfo.route];
							var iVisibility = (iRouteLevel === oTreeNode.level) ? 2 : (3 + isFullscreenLayout(sCurrentLayout));
							oNavigationControllerProxy.setVisibilityOfRoute(oColumnInfo.route, iVisibility);
						}
					}
				}
				return Promise.all(aActivationPromises).then(oNavigationControllerProxy.afterActivation);
			}
			
			function isVisuallyFullscreen(){
				return !(oUiState.columnsVisibility.beginColumn ? oUiState.columnsVisibility.midColumn :  oUiState.columnsVisibility.midColumn && oUiState.columnsVisibility.endColumn);
			}

			// This method is called in two different scenarios:
			// 1. In each route matched event which is not a state change (oActivationInfo truthy): Note that in this case the new route may have changed the layout name which would have been triggered in fnHandleBeforeRouteMatched.
			//    Note that in this case sCurrentLayout is already consistent with the new UIState
			// 2. Changes in layout due to other user actions (oActivationInfo faulty): Browser resizing, change between portrait and landscape mode (on mobile devices), use of FCL arrow buttons.
			// The task of this function is to update oUiState and the content of the (FCL specific part of the) TemplatePrivateGlobalModel.
			// In scenario 2 sCurrentLayout can be inconsistent with the new UIState (if the FCL arrow buttons have been used). In this case the url needs to be adapted to this state. 
			function fnAdaptLayout(oActivationInfo){
				if (!oUiState && !oActivationInfo){ // ignore resize events before the first route matched is handled
					return;
				}
				var oNewUiState = oFlexibleColumnLayoutSemanticHelper.getCurrentUIState();
				var oCurrentIdentity = oNavigationControllerProxy.getCurrentIdentity();
				var oCurrentTreeNode = oCurrentIdentity && oCurrentIdentity.treeNode;
				if (oCurrentIdentity && sCurrentLayout !== oNewUiState.layout){ // scenario 2, FCL arrow buttons have been used. Note that we assume that this does not change the visibility of any column 
					var sLayoutInAppState = isLayoutDefault(oNewUiState.layout, oCurrentTreeNode.sRouteName) ? null : oNewUiState.layout;
					oNavigationControllerProxy.navigateByExchangingQueryParam("FCLLayout", sLayoutInAppState); // Note that this will trigger a second call of this function for scenario 1
					return; // so we can return for now
				}				
				// Analyze visibility changes of columns (only in scenario 2) and set visibility of FCL action buttons
				var oVisibilityChanged = !oActivationInfo && {}; // maps the column names onto the information whether the visibility of the column has changed. Only for scenario 2.
				var bHasVisibilityChange = false; // has at least one column changed visibility
				aColumnNames.forEach(function(sColumnName){
					var sFullColumnName = sColumnName + "Column";
					if (oVisibilityChanged){ // if requested determine it
						var bVisibilityChanged = oUiState && (oUiState.columnsVisibility[sFullColumnName] !== oNewUiState.columnsVisibility[sFullColumnName]);
						oVisibilityChanged[sColumnName] = bVisibilityChanged;
						bHasVisibilityChange = bHasVisibilityChange || bVisibilityChanged;
					}
					// set visibility of action buttons for this column
					if (sColumnName !== "begin"){ // no action buttons in the begin column
						var oActionButtonVisibility = {};
						aActionButtons.forEach(function(sActionButton){
							oActionButtonVisibility[sActionButton] = oNewUiState.actionButtonsInfo[sFullColumnName][sActionButton] !== null;
						});
						oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/FCL/" + sColumnName + "ActionButtons", oActionButtonVisibility);
					}
				});
				// Set the new UIState			
				oUiState = oNewUiState;
				// Set additional properties in TemplatePrivateGlobalModel
				if (oCurrentIdentity){
					var bIsVisuallyFullscreen = isVisuallyFullscreen();
					var iHighestViewLevel = oCurrentTreeNode.level - (oCurrentTreeNode.fCLLevel === 2 && !oUiState.columnsVisibility.endColumn);
					var iLowestDetailViewLevel = iHighestViewLevel - (iHighestViewLevel > 1 && !bIsVisuallyFullscreen) - (oUiState.columnsVisibility.endColumn && oUiState.columnsVisibility.beginColumn && iHighestViewLevel > 2);
					oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/FCL/isVisuallyFullScreen", bIsVisuallyFullscreen);
					oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/FCL/highestViewLevel", iHighestViewLevel);
					oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/FCL/lowestDetailViewLevel", iLowestDetailViewLevel);
				}

				// All active components get the chance to adapt, if the layout has changed for them
				var aActiveComponents = oNavigationControllerProxy.getActiveComponents();
				aActiveComponents.forEach(function(sComponentId){
					var sLastLayout = mComponentsToLayouts[sComponentId];
					var sApplicapleLayout = sCurrentLayout;
					var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
					// the difference between ThreeColumnsMidExpanded and ThreeColumnsEndExpanded does not affect begin column -> we do a normalization here
					if (sApplicapleLayout === LayoutType.ThreeColumnsMidExpanded){
						var oTreeNode = oTemplateContract.mRoutingTree[oRegistryEntry.route];
						if (oTreeNode.fCLLevel === 0){
							sApplicapleLayout = LayoutType.ThreeColumnsEndExpanded;
						}
					}
					if (sLastLayout !== sApplicapleLayout){
						mComponentsToLayouts[sComponentId] = sApplicapleLayout;
						if (sLastLayout){
							oRegistryEntry.utils.layoutChanged();
						}
					}
				});
				if (bHasVisibilityChange || oActivationInfo){
					return fnAdaptToRouteOrVisibilityChange(oActivationInfo || oNavigationControllerProxy.getActivationInfo(), oVisibilityChanged);
				}				
			}

			// Handler for the beforeRouteMatched event of the router.
			// Returns a Promise which is resolved as soon as all necessary steps have been taken
			var bSemanticHelperReady = false; // is set to true as soon as the instance of oFlexibleColumnLayoutSemanticHelper declares itself to be ready to use
			function fnHandleBeforeRouteMatched(oCurrentIdentity){
				for (var oPredecessorNode = oCurrentIdentity.treeNode; oPredecessorNode.fCLLevel === 1 || oPredecessorNode.fCLLevel === 2; ){
					oPredecessorNode = oTemplateContract.mRoutingTree[oPredecessorNode.parentRoute];
					oNavigationControllerProxy.prepareHostView(oPredecessorNode);
				}
				if (bLoadListAndFirstEntryOnStartup && oCurrentIdentity.treeNode.level === 0){ // master detail
					var oSuccessorNode = oTemplateContract.mRoutingTree[sDetailRoute4MD];
					oNavigationControllerProxy.prepareHostView(oSuccessorNode);
				}
				var fnImpl = function(){ // implementation on what needs to be done. Relies on oFlexibleColumnLayoutSemanticHelper being ready to use
					if (isMultipleColumn(oCurrentIdentity.treeNode)){
						sCurrentLayout = getFCLLayoutFromIdentity(oCurrentIdentity);
						if (!sCurrentLayout){
							switch (oCurrentIdentity.treeNode.fCLLevel){
								case 0: // since isMultiColumn this means master detail mode
									var oColumnsVisibility = oFlexibleColumnLayoutSemanticHelper.getNextUIState(0).columnsVisibility;
									if (oColumnsVisibility.midColumn) { // normal case
										sCurrentLayout = aDefaultLayouts[1];
									} else { // this is the case if we have a desktop browser in size S
										sCurrentLayout = aDefaultLayouts[0];
										oNavigationControllerProxy.navigateByExchangingQueryParam("FCLLayout", sCurrentLayout);
									}
									break;
								case 1:
									sCurrentLayout = aDefaultLayouts[1];
									break;
								case 2:
									sCurrentLayout = aDefaultLayouts[2];
								   break;
							    default:
							}
						}
					} else {
						sCurrentLayout = oCurrentIdentity.treeNode.fCLLevel === 0 ? aDefaultLayouts[0] : LayoutType.EndColumnFullScreen;
					}
					oFlexibleColumnLayout.setLayout(sCurrentLayout);
					oFlexibleColumnLayout.setAutoFocus(false);
					if (oCurrentIdentity.treeNode.fCLLevel === 1 || oCurrentIdentity.treeNode.fCLLevel === 2){
						var oNewUiState = oFlexibleColumnLayoutSemanticHelper.getCurrentUIState();
						if (oNewUiState.columnsVisibility.midColumn){
							var iDownto = 1 - oNewUiState.columnsVisibility.beginColumn;
							for (var oPredecessorNode = oCurrentIdentity.treeNode; oPredecessorNode.fCLLevel > iDownto;){
								oPredecessorNode = oTemplateContract.mRoutingTree[oPredecessorNode.parentRoute];
								oCurrentIdentity.componentsDisplayed[oPredecessorNode.sRouteName] = 1;
								oPredecessorNode.display();
							}
						}
					}
				};
				if (bSemanticHelperReady){ // in all scenarios except startup fnImpl is executed synchronously
					fnImpl();
					return Promise.resolve();
				}
				// During startup wait with execution of fnImpl until oFlexibleColumnLayoutSemanticHelper is ready to use
				return oFlexibleColumnLayoutSemanticHelper.whenReady().then(function(){
					bSemanticHelperReady = true;
					fnImpl();
				});
			}

			// This function returns a Promise that indicates when the context pathes have been set for the columns
			function fnHandleRouteMatched(oActivationInfo) {
				return fnAdaptLayout(oActivationInfo);
			}

			// returns the layout which is used when this identity is active
			function getFCLLayoutFromIdentity(oIdentity){
				return getFCLLayoutFromStateObject(oIdentity.appStates) || oIdentity.treeNode.defaultLayoutType || aDefaultLayouts[tVL(oIdentity.treeNode.fCLLevel)];
			}

			function addLayoutToAppState(mAppStates, sLayout, sRoute){
				if (!isLayoutDefault(sLayout, sRoute)){
					mAppStates.FCLLayout = sLayout;
				}
			}

			function isFullscreenLayout(sLayout){
				return sLayout === LayoutType.EndColumnFullScreen || sLayout === LayoutType.MidColumnFullScreen;
			}

			function isHidingLayout(sLayout){
				return sLayout === LayoutType.ThreeColumnsBeginExpandedEndHidden || sLayout === LayoutType.ThreeColumnsMidExpandedEndHidden;
			}

			function addStatePromiseForTreeNode(oTreeNode, aKeys, aPromises, mAppStates){
				var oIdentity = {
					treeNode: oTreeNode,
					keys: aKeys,
					appStates: mAppStates
				};
				var oHelperPromise = oNavigationControllerProxy.getApplicableStateForIdentityAddedPromise(oIdentity);
				aPromises.push(oHelperPromise);
			}

			// This function returns a Promise for navigating to the specified target node with the given keys. Thereby, the target layout is already specified.
			// The Promise is resolved when mAppStates has been filled with all necessary appStates.
			// The necessary appstates are:
			// - Parameter FCLLayout if needed
			// - local appstates for all views which will be shown in the target layout (if needed)
			function getAppStatePromiseForTargetLayout(mAppStates, oTargetNode, sTargetLayout, aKeys){
				addLayoutToAppState(mAppStates, sTargetLayout, oTargetNode.sRouteName);
				var aRet = [];
				if (!isHidingLayout(sTargetLayout)){
					addStatePromiseForTreeNode(oTargetNode, aKeys, aRet, mAppStates);
				}
				if (!isFullscreenLayout(sTargetLayout)){
					for (var oCurrentTreeNode = oTargetNode; oCurrentTreeNode.fCLLevel > 0;){
						oCurrentTreeNode = oTemplateContract.mRoutingTree[oCurrentTreeNode.parentRoute];
						addStatePromiseForTreeNode(oCurrentTreeNode, aKeys, aRet, mAppStates);
					}
				}
				return Promise.all(aRet);
			}

			function getTargetLayoutForTreeNode(oTreeNode){
				return isFullscreenLayout(sCurrentLayout) ? getFullscreenLayout(oTreeNode.fCLLevel) : (oTreeNode.defaultLayoutType || oFlexibleColumnLayoutSemanticHelper.getNextUIState(oTreeNode.fCLLevel).layout);
			}

			// This method fills the appStates component of oTargetIdentity and returns a Promise which is resolved as soon as this is done.
			// oCurrentIdentity is the current navigation identity. oTargetIdentity the identity which is navigated to.
			function getAppStatesPromiseForNavigation(oCurrentIdentity, oTargetIdentity){
				var sTargetLayout = (oTargetIdentity.treeNode.fCLLevel === 1 && oCurrentIdentity && oCurrentIdentity.treeNode.parentRoute === oTargetIdentity.treeNode.sRouteName && oCurrentIdentity.treeNode.fCLLevel === 2) ? oUiState.actionButtonsInfo.endColumn.closeColumn : getTargetLayoutForTreeNode(oTargetIdentity.treeNode);
				return getAppStatePromiseForTargetLayout(oTargetIdentity.appStates, oTargetIdentity.treeNode, sTargetLayout, oTargetIdentity.keys);
			}

			// This function is called when a draft is cancelled and as consequence the app should navigate back to the identity that was there
			// before the draft was created. This identity is given by oIdentityBefore. However, the appstates might be different from this state.
			// Returns a Promise that is resolved when mAppStates has been filled accordingly.
			// This method will only be called when the oIdentityBefore.treeNode.fCLLevel is either 1 or 2.
			function getSpecialDraftCancelPromise(oCurrentIdentity, oIdentityBefore, mAppStates){
				var sTargetLayout;
				if (oCurrentIdentity.treeNode.fCLLevel === oIdentityBefore.treeNode.fCLLevel){
					sTargetLayout = sCurrentLayout;
				} else if (oCurrentIdentity.treeNode.fCLLevel === 2){
					sTargetLayout = oUiState.actionButtonsInfo.endColumn.closeColumn;
				} else {
					sTargetLayout = getTargetLayoutForTreeNode(oIdentityBefore.treeNode);
				}
				return getAppStatePromiseForTargetLayout(mAppStates, oIdentityBefore.treeNode, sTargetLayout, oIdentityBefore.keys);
			}

			function getFullscreenLayout(iViewLevel){
				if (iViewLevel === 0){
					return LayoutType.OneColumn;
				} else if (iViewLevel === 1){
					return LayoutType.MidColumnFullScreen;
				} else if (iViewLevel === 2){
					return LayoutType.EndColumnFullScreen;
				} else {
					return "";
				}
			}

			function getFCLAppStatesPromise(sRoute, oAppStates){
				var oTreeNode = oTemplateContract.mRoutingTree[sRoute];
				if (!isMultipleColumn(oTreeNode)) {
					return null;
				}
				var sNextUiLayout = sStoredTargetLayout
					|| oTreeNode.defaultLayoutType
					|| oFlexibleColumnLayoutSemanticHelper.getNextUIState(oTreeNode.fCLLevel).layout;


				addLayoutToAppState(oAppStates, sNextUiLayout, sRoute);
				sStoredTargetLayout = null;
				if (isFullscreenLayout(sNextUiLayout)){
					return null;
				}
				var aRet = [];
				for (var i = oTreeNode.fCLLevel; i > 0; i--){
					var sCurrentRoute = oTreeNode.parentRoute;
					aRet.push(oNavigationControllerProxy.addUrlParameterInfoForRoute(sCurrentRoute, oAppStates));
					oTreeNode = oTemplateContract.mRoutingTree[sCurrentRoute];
				}
				return Promise.all(aRet);
			}

			// This function checks whether the two given identities are equivalent from the FCL layout perspective
			function areIdentitiesLayoutEquivalent(oHistoricIdentity, oNewIdentity){
				if (oHistoricIdentity.treeNode.fCLLevel === 0 ||  oHistoricIdentity.treeNode.fCLLevel === 3){
					return true;
				}
				var sHistoricLayout = getFCLLayoutFromIdentity(oHistoricIdentity);
				var sNewLayout = getFCLLayoutFromIdentity(oNewIdentity);
				return isFullscreenLayout(sHistoricLayout) === isFullscreenLayout(sNewLayout);
			}

			// Common Event Handlers fon FCL Action Buttons
			function onActionButtonPressed(oTreeNode, sActionName, bCloseColumn) {
				var fnProcessFunction = function () {
					oTemplateContract.oApplicationProxy.performAfterSideEffectExecution(function () {
						var sAffectedColumn = getColumnForFCLLevel(oTreeNode.fCLLevel);
						var sTargetLayout = oUiState.actionButtonsInfo[sAffectedColumn + "Column"][sActionName];
						var oTargetNode = bCloseColumn ? oTemplateContract.mRoutingTree[oTreeNode.parentRoute] : oTreeNode;
						var oCurrentIdentity = oNavigationControllerProxy.getCurrentIdentity();
						var mAppStates = Object.create(null);
						// if Full Screen or ExitFullScreen is clicked the opposite button should get focus afterwards
						if (sActionName === "fullScreen" || sActionName === "exitFullScreen") {
							oTemplateContract.oApplicationProxy.setNextFocus(function(){
								var sOtherButtonId = sActionName === "fullScreen" ? "exitFullScreen" : "fullScreen";
								var oRegistryEntry = oTemplateContract.componentRegistry[oCurrentIdentity.treeNode.componentId];
								setTimeout(function () {
									controlHelper.focusControl(oRegistryEntry.oController.createId(sOtherButtonId));
								});
							});
						}
						var oAppStatePromise = getAppStatePromiseForTargetLayout(mAppStates, oTargetNode, sTargetLayout, oCurrentIdentity.keys);
						var oNavigatePromise = oAppStatePromise.then(function () {
							oNavigationControllerProxy.navigateToIdentity({
								treeNode: oTargetNode,
								keys: (oTargetNode === oCurrentIdentity.treeNode) ? oCurrentIdentity.keys : oCurrentIdentity.keys.slice(0, oTargetNode.level + 1),
								appStates: mAppStates
							});
						});
						oTemplateContract.oBusyHelper.setBusy(oNavigatePromise);
					}, true);
				};
				if (bCloseColumn) {
					var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
					if (oCurrentIdentity.treeNode.isDraft && oCurrentIdentity.treeNode.level === 1){
						oTemplateContract.oPageLeaveHandler.performAfterDiscardOrKeepDraft(fnProcessFunction, Function.prototype, "LeavePage");
					} else {
						oTemplateContract.oDataLossHandler.performIfNoDataLoss(fnProcessFunction, Function.prototype, "LeavePage");
					}	
				} else {
					fnProcessFunction();
				}
			}

			function getActionButtonHandlers(oTreeNode) {
				return {
					onCloseColumnPressed: onActionButtonPressed.bind(null, oTreeNode, "closeColumn", true),
					onFullscreenColumnPressed: onActionButtonPressed.bind(null, oTreeNode, "fullScreen", false),
					onExitFullscreenColumnPressed: onActionButtonPressed.bind(null, oTreeNode, "exitFullScreen", false)
				};
			}

			/******************************************
			 * end: Event Handlers for common FCL Action Buttons
			 *******************************************/

			oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/FCL", { });

			function fnCloseRightColumns(iViewLevel) {
				sCurrentLayout = oFlexibleColumnLayoutSemanticHelper.getNextUIState(iViewLevel).layout;
				oFlexibleColumnLayout.setLayout(sCurrentLayout);
			}

			function isAppTitlePrefered(){
				return !isVisuallyFullscreen();
			}

			function fnDisplayMessagePage(mParameters, mComponentsDisplayed){
				var iFCLMessageLevel = 0;
				for (var sRoute in mComponentsDisplayed){
					var oTreeNode = oTemplateContract.mRoutingTree[sRoute];
					if (oTreeNode.level >= mParameters.viewLevel && mComponentsDisplayed[sRoute] === 1){
						if (oTreeNode.level === mParameters.viewLevel){
							iFCLMessageLevel = oTreeNode.fCLLevel;
						}
						mComponentsDisplayed[sRoute] = 5 + (oTreeNode.level > mParameters.viewLevel);
					}
				}
				fnCloseRightColumns(iFCLMessageLevel);
				var oTargets = oNavigationControllerProxy.oRouter.getTargets();
				var sTarget = getTargetForMessagePage(iFCLMessageLevel);
				oTargets.display(sTarget);
			}

			function fnAdaptBreadCrumbUrlParameters(oAppStates, oTreeNode){
				if (!isMultipleColumn(oTreeNode)){
					return;
				}
				var sLayout = getFullscreenLayout(oTreeNode.fCLLevel);
				if (isLayoutDefault(sLayout, oTreeNode.sRouteName)){
					return;
				}
				oAppStates.FCLLayout = sLayout;
			}

			// set the preferred layout when navigating to the given tree node. Note that mAppStates might already contain a different layout.
			// oLastIdentity is the last identity which was used for that treeNode
			function fnAdaptPreferredLayout(oAppStates, oTreeNode, oLastIdentity){
				if (oLastIdentity && oLastIdentity.appStates && oLastIdentity.appStates.FCLLayout){
					oAppStates.FCLLayout = oLastIdentity.appStates.FCLLayout;
				} else {
						delete oAppStates.FCLLayout;
				}
			}

			// This function is called when the app is started via external navigation. oTreeNode specifies the target node of the initial navigation.
			// oAppStates will be adpated for that situation
			function fnAdaptAppStatesForExternalNavigation(oTreeNode, oAppStates){
				if (oTreeNode.page.defaultLayoutTypeIfExternalNavigation && !isLayoutDefault(oTreeNode.page.defaultLayoutTypeIfExternalNavigation, oTreeNode.sRouteName)){
					oAppStates.FCLLayout = oTreeNode.page.defaultLayoutTypeIfExternalNavigation;
				} else {
					delete oAppStates.FCLLayout;					
				}
			}
			
			function hasIdentityFullscreenLayout(oIdentity){
				return oIdentity.treeNode.fCLLevel == 0 || oIdentity.treeNode.fCLLevel == 3 || isFullscreenLayout(getFCLLayoutFromIdentity(oIdentity));
			}

			function hasNavigationMenuSelfLink(oIdentity){
				return !hasIdentityFullscreenLayout(oIdentity);
			}

			function getMaxColumnCountInFCL(){
				return iMaxColumnCountInFCL;
			}

			function handleListReceived(oItem, fnNavigateToItem){
				if (!bLoadListAndFirstEntryOnStartup) {
					return;
				}
				var bNavigateToFirstListItem = false;
				var oColumnsVisibility = oFlexibleColumnLayoutSemanticHelper.getNextUIState(0).columnsVisibility;
				if (oColumnsVisibility.midColumn) {
					var oCurrentIdentity = oNavigationControllerProxy.getCurrentIdentity();
					var oCurrentTreeNode = oCurrentIdentity && oCurrentIdentity.treeNode;
					bNavigateToFirstListItem = oCurrentTreeNode && oCurrentTreeNode.level === 0 && getFCLLayoutFromStateObject(oCurrentIdentity.appStates) !== LayoutType.OneColumn;
				}
				if (bNavigateToFirstListItem) {
					if (oItem) {
						fnNavigateToItem(oItem);
					} else { // closeSecondColumn
						oNavigationControllerProxy.navigateByExchangingQueryParam("FCLLayout", LayoutType.OneColumn);
					}
				}
			}

			function isNextObjectLoadedAfterDelete(){
				return bDisplayNextObjectAfterDelete;
			}

			function isListAndFirstEntryLoadedOnStartup(){
				return bLoadListAndFirstEntryOnStartup;
			}

			function handleDataReceived(oControl, fnNavigateToListItemProgrammatically) {
				// then the list was refreshed or the app has been started
				if (controlHelper.isSmartTable(oControl)) {
					oControl = oControl.getTable();
				} else if (controlHelper.isSmartList(oControl)) {
					oControl = oControl.getList();
				}
				var oItem = getFirstItemInControl(oControl);
				handleListReceived(oItem, fnNavigateToListItemProgrammatically);
			}

			function setStoredTargetLayoutToFullscreen(iLevel){
				if (iLevel > 2){
					sStoredTargetLayout = "";
				} else {
					sStoredTargetLayout = getFullscreenLayout(iLevel);
				}
			}

			function getFclProxy(oTreeNode) {
				var oRet = {};
				if (oTreeNode.fCLLevel === 1 || oTreeNode.fCLLevel === 2){
					oRet.oActionButtonHandlers = getActionButtonHandlers(oTreeNode);
				}
				if (oTreeNode.level === 0){
					oRet.handleDataReceived = (isListAndFirstEntryLoadedOnStartup && isListAndFirstEntryLoadedOnStartup()) ? handleDataReceived : Function.prototype;
					oRet.isListAndFirstEntryLoadedOnStartup = isListAndFirstEntryLoadedOnStartup;
				}
				oRet.isNextObjectLoadedAfterDelete = isNextObjectLoadedAfterDelete;
				return oRet;
			}

			// Hides placeholders in
			// a) all currently visible columns, if oTreeNode is faulty
			// b) the column which shows oTreeNode if it is truthy
			function fnHidePlaceholder(oTreeNode){
				var bOnlyOneNode = oTreeNode || isFullscreenLayout(sCurrentLayout);
				for (var oCurrentNode = oTreeNode || oNavigationControllerProxy.getCurrentIdentity().treeNode; oCurrentNode; oCurrentNode = !bOnlyOneNode && oCurrentNode.fCLLevel && oTemplateContract.mRoutingTree[oCurrentNode.parentRoute]){
					var oTargetSpec = {
						aggregation: getPagesAggregation(oCurrentNode.fCLLevel)	
					};
					oTemplateContract.oNavigationHost.hidePlaceholder(oTargetSpec);
				}
			}

			oFlexibleColumnLayout.attachStateChange(fnAdaptLayout.bind(null, false));

			return {
				hidePlaceholder: fnHidePlaceholder,
				adaptRoutingInfo: fnAdaptRoutingInfo,
				createMessagePageTargets: createMessagePageTargets,
				displayMessagePage: fnDisplayMessagePage,
				handleBeforeRouteMatched: fnHandleBeforeRouteMatched,
				handleRouteMatched: fnHandleRouteMatched,
				areIdentitiesLayoutEquivalent: areIdentitiesLayoutEquivalent,
				getAppStatesPromiseForNavigation: getAppStatesPromiseForNavigation,
				getSpecialDraftCancelPromise: getSpecialDraftCancelPromise,
				getFCLAppStatesPromise: getFCLAppStatesPromise,
				adaptBreadCrumbUrlParameters: fnAdaptBreadCrumbUrlParameters,
				adaptPreferredLayout: fnAdaptPreferredLayout,
				isAppTitlePrefered: isAppTitlePrefered,
				hasIdentityFullscreenLayout: hasIdentityFullscreenLayout,
				hasNavigationMenuSelfLink: hasNavigationMenuSelfLink,
				getMaxColumnCountInFCL: getMaxColumnCountInFCL,
				isNextObjectLoadedAfterDelete: isNextObjectLoadedAfterDelete,
				getFclProxy: getFclProxy,
				isListAndFirstEntryLoadedOnStartup: isListAndFirstEntryLoadedOnStartup,
				setStoredTargetLayoutToFullscreen:setStoredTargetLayoutToFullscreen,
				adaptAppStatesForExternalNavigation: fnAdaptAppStatesForExternalNavigation
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.lib.FlexibleColumnLayoutHandler", {
			constructor: function(oFlexibleColumnLayout, oNavigationControllerProxy) {
				extend(this, getMethods(oFlexibleColumnLayout, oNavigationControllerProxy));
			}
		});
	});
