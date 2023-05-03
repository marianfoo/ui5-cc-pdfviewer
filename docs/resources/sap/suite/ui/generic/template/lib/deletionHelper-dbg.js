/**
 *   This class provides static helper methods that are used for delete operations.
 *   More precisely, the class provides methods that ensure that the navigation which possibly should be performed after an object has been
 *   deleted is executed.
 *   The methods provided for this purpose must be called, before the deletion is actually performed, since the correct navigation to be performed
 *   after deletion can possibly depend on the ui state before the deletion.
 *   Promises are used to trigger the after delete action.
 */
sap.ui.define(["sap/base/util/extend"], function(extend) {
		"use strict";

	// returns a sparse array that maps the view levels currently active onto the binding parthes currently used for them.
	// Active views which are not bound will not appear in the array.
	function fnGetPathesCurrentlyShown(oTemplateContract){
		var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
		var aRet = [];
		for (var i = 0; i < aActiveComponents.length; i++){
			var sComponentId = aActiveComponents[i];
			var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
			var iViewLevel = oRegistryEntry.viewLevel;
			if (iViewLevel > 0){
				var oContext = oRegistryEntry.oComponent.getBindingContext();
				if (oContext){
					aRet[iViewLevel] = oContext.getPath();
				}
			}
		}
		return aRet;
	}

	function getRegistryEntryIfActiveForLevel(oTemplateContract, iTargetLevel){
		var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
		for (var i = 0; i < aActiveComponents.length; i++){
			var sComponentId = aActiveComponents[i];
			var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
			var iViewLevel = oRegistryEntry.viewLevel;
			if (iViewLevel === iTargetLevel){
				return oRegistryEntry;
			}
		}
	}

	function fnDisplayNextObject(oTemplateContract, aOrderObjectShownAfterDelete){
		var oRegistryEntry = getRegistryEntryIfActiveForLevel(oTemplateContract, 0);
		if (oRegistryEntry && oRegistryEntry.methods.displayNextObject){
			return oRegistryEntry.methods.displayNextObject(aOrderObjectShownAfterDelete);
		}
		return Promise.reject();
	}

	function fnGetItemsForDisplayNextObjectAfterDelete(oTemplateContract, bIsCreateDraft){
		var bIsConfigured = oTemplateContract.oFlexibleColumnLayoutHandler && oTemplateContract.oFlexibleColumnLayoutHandler.isNextObjectLoadedAfterDelete(); // is it configured?
		if (bIsConfigured){ // if it is configured, check for the list available
			var oRegistryEntry = getRegistryEntryIfActiveForLevel(oTemplateContract, 0);
			if (oRegistryEntry){
				if (bIsCreateDraft){
					return [oTemplateContract.oApplicationProxy.getPathOfLastShownDraftRoot()];
				}
				return oRegistryEntry.methods.getItems && oRegistryEntry.methods.getItems();
			}
		}
		return null;
	}

	function fnNavigateToPosition(oTemplateContract, iKeepPosition){
		oTemplateContract.oNavigationControllerProxy.navigateUpAfterDeletion(iKeepPosition);
	}

	function fnPrepareForDisplayNextObjectAfterDelete(oTemplateContract, sPathToPrepare, aItemsForPrepare, oPromise){
		var aOrderObjectShownAfterDelete = [];
		var iPositionOfCurrentObject;
		var aContextBindingPathsFromItems = [];
		var sContextBindingPath;

		for (var k = 0; k < aItemsForPrepare.length; k++) {
			sContextBindingPath = aItemsForPrepare[k].getBindingContextPath();
			aContextBindingPathsFromItems.push(sContextBindingPath);
		}
		for (var j = 0; j < aContextBindingPathsFromItems.length; j++) {
			if (aContextBindingPathsFromItems[j] === sPathToPrepare){
				aOrderObjectShownAfterDelete.push(aContextBindingPathsFromItems[j]);
				iPositionOfCurrentObject = j;
				break;
			}
		}
		if (iPositionOfCurrentObject >= 0) {
			var aItemsAfterObject = aContextBindingPathsFromItems.slice(iPositionOfCurrentObject + 1, aContextBindingPathsFromItems.length);
			var aItemsBeforeObject;
			if (iPositionOfCurrentObject > 0) {
				aItemsBeforeObject = aContextBindingPathsFromItems.slice(0, iPositionOfCurrentObject);
				aItemsBeforeObject.reverse();
			}
			aOrderObjectShownAfterDelete = aOrderObjectShownAfterDelete.concat(aItemsAfterObject, aItemsBeforeObject);
		} else {
			aOrderObjectShownAfterDelete = aContextBindingPathsFromItems;
		}
		oPromise.then(function(){	// if object was deleted successfully, we need to switch to next object
			var oNextObjectDisplayedPromise = fnDisplayNextObject(oTemplateContract, aOrderObjectShownAfterDelete);
			oNextObjectDisplayedPromise.catch(function(){
				fnNavigateToPosition(oTemplateContract, 0);
			});
		});
	}

	function getNavigateAfterDeletionOfCreateDraft(oTemplateContract){
		return function(){
			var bForceFullscreenCreate = oTemplateContract.oTemplatePrivateGlobalModel.getProperty("/generic/forceFullscreenCreate");
			if (bForceFullscreenCreate){
				oTemplateContract.oNavigationControllerProxy.navigateBack(); // this should lead us back to the App where we have come from
			} else {
				var aOrderObjectShownAfterDelete = fnGetItemsForDisplayNextObjectAfterDelete(oTemplateContract, true);
				if (aOrderObjectShownAfterDelete){
					fnDisplayNextObject(oTemplateContract, aOrderObjectShownAfterDelete);
				} else {
					fnNavigateToPosition(oTemplateContract, 0);
				}
			}
		};
	}

	/*
	* Prepares deletion of a bunch of objects
	* @param {object} oTemplateContract
	* @param {map} mObjectsToDelete maps the canonical pathes of the objects that are planned to be deleted onto Promises that are resolved, resp. rejected when the deletion was successfull resp. failed.
	* @param {boolean} bRefreshAllComponentsPostDelete Refresh all the active components after delete promise is resolved
	* */
	function fnPrepareDeletion(oTemplateContract, mObjectsToDelete, bSuppressRefreshAllComponents){
		var aCurrentlyShownPathes = fnGetPathesCurrentlyShown(oTemplateContract);
		var aDonePromises = [];
		var sPathToPrepare = null;    // starting point for displayNextObjectAfterDelete
		var aItemsForPrepare;
		var sPath;
		var oDeletePromise;
		var sComponentId;
		var oRegistryEntry;

		// prepare to unbind components (and their children) that are bound to objects that are going to be deleted
		for (sComponentId in oTemplateContract.componentRegistry){
			oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
			var oBindingContext = oRegistryEntry.viewLevel && oRegistryEntry.oComponent.getBindingContext();
			sPath = oBindingContext && oBindingContext.getPath(); // note that this provides the cannonical path even if we do not use cannonical pathes for the element binding of the component
			oDeletePromise = sPath && mObjectsToDelete[sPath];
			if (oDeletePromise){
				var fnUnbind = oTemplateContract.oViewDependencyHelper.unbindChildren.bind(null, oRegistryEntry.oComponent, true);
				oDeletePromise.then(fnUnbind);
			}
		}

		var mAffectedEntitySets = Object.create(null);
		var fnHandle = function(iPosition, sEntitySet){
			if (sEntitySet){
				mAffectedEntitySets[sEntitySet] = true;
			}
			return {
				deleted: !!sEntitySet,
				position: iPosition
			};
		};
		for (sPath in mObjectsToDelete){
			var sEntitySet = sPath.substring(1, sPath.indexOf("("));
			oDeletePromise = mObjectsToDelete[sPath];
			oTemplateContract.oApplicationProxy.prepareDeletion(sPath, oDeletePromise);
			var iPosition = aCurrentlyShownPathes.indexOf(sPath);
			if (iPosition === 1){
				aItemsForPrepare = fnGetItemsForDisplayNextObjectAfterDelete(oTemplateContract);
				if (aItemsForPrepare){
					sPathToPrepare = sPath;
				}
			}
			var oDonePromise = oDeletePromise.then(fnHandle.bind(null, iPosition, sEntitySet), fnHandle.bind(null, iPosition, null));
			aDonePromises.push(oDonePromise);
		}
		if (sPathToPrepare){
			fnPrepareForDisplayNextObjectAfterDelete(oTemplateContract, sPathToPrepare, aItemsForPrepare, mObjectsToDelete[sPathToPrepare]);
		} else {
			Promise.all(aDonePromises).then(function(aResults){
				var iKeepPosition = -1;
				for (var i = 0; i < aResults.length; i++){
					var oResult = aResults[i];
					if (oResult.deleted && oResult.position > 0){
						if (iKeepPosition < 0 || iKeepPosition >= oResult.position){
							iKeepPosition = oResult.position - 1;
						}
					}
				}
				if (iKeepPosition >= 0){
					fnNavigateToPosition(oTemplateContract, iKeepPosition);
				}
			});
		}
		// Skip the referesh
		if (!bSuppressRefreshAllComponents) {
			Promise.all(aDonePromises).then(function (aResults) {
				// Inform all components that they should update tables that belong to entity sets which objects have been deleted from
				for (sComponentId in oTemplateContract.componentRegistry){
					oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
					var mRefreshInfos = oRegistryEntry.mRefreshInfos;
					// Add the affected entity sets to those already stored with the component
					extend(mRefreshInfos, mAffectedEntitySets);
					// If the component is active refresh immediately
					if (oRegistryEntry.utils.isComponentActive()) {
						oRegistryEntry.utils.refreshBinding();
					}
				}
			});
		}
	}

	return {
		prepareDeletion: fnPrepareDeletion,
		getNavigateAfterDeletionOfCreateDraft: getNavigateAfterDeletionOfCreateDraft
	};
});
