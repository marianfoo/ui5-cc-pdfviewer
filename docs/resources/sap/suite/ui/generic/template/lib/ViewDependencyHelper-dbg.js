sap.ui.define(["sap/ui/base/Object", "sap/suite/ui/generic/template/js/AnnotationHelper", "sap/suite/ui/generic/template/genericUtilities/testableHelper", "sap/base/util/extend"],
		function(BaseObject, AnnotationHelper, testableHelper, extend) {
	"use strict";

	// Class for dealing with view dependencies
	function getMethods(oTemplateContract) {

		function setAllPagesDirty(aExcludeComponentIds){
			aExcludeComponentIds = aExcludeComponentIds || [];
			for (var sId in oTemplateContract.componentRegistry){
				if (aExcludeComponentIds.indexOf(sId) === -1){
					var oComponentRegistryEntry = oTemplateContract.componentRegistry[sId];
					oComponentRegistryEntry.oComponent.setIsRefreshRequired(true);
				}
			}
		}

		/*
		 * Sets parent page to dirty
		 * @param {Object} oComponent - the component which parent shall be set to dirty
		 * @param {String} sEntitySet - only this entity set is set to dirty
		 * @param {Integer} iLevel - Number of components to be set as dirty
		 */
		function setParentToDirty(oComponent, sEntitySet, iLevel) {
			var sMyId = oComponent.getId();
			var oComponentRegistryEntry = oTemplateContract.componentRegistry[sMyId];
			var oTreeNode = oTemplateContract.mRoutingTree[oComponentRegistryEntry.route];
			for (var i = 0; (!iLevel || i < iLevel) && oTreeNode.level > 0; i++){
				var oParentNode = oTemplateContract.mRoutingTree[oTreeNode.parentRoute];  
				if (oParentNode.componentId){
					var oParentComponent = oTemplateContract.componentRegistry[oParentNode.componentId].oComponent;
					setMeToDirty(oParentComponent, sEntitySet);
				}
				oTreeNode = oParentNode;
			}
		}


		/*
		 * Sets the specified page to dirty
		 * @param {Object} oComponent - the component that shall be set to dirty
		 * @param {String} sEntitySet - only this navigation property is set to dirty
		 */
		function setMeToDirty(oComponent, sEntitySet) {
			if (sEntitySet) {
				var oRegistryEntry = oTemplateContract.componentRegistry[oComponent.getId()];
				var mRefreshInfos = oRegistryEntry.mRefreshInfos;
				mRefreshInfos[sEntitySet] = true;
				if (oRegistryEntry.utils.isComponentActive()){
					oRegistryEntry.utils.refreshBinding();
				}
			} else if (oComponent.setIsRefreshRequired){
				oComponent.setIsRefreshRequired(true);
			}
		}
		
		function addSuccessorComponents(oTreeNode, aSuccessorComponents){
			for (var i = 0; i < oTreeNode.children.length; i++){
				var oChildNode = oTemplateContract.mEntityTree[oTreeNode.children[i]];
				addSuccessorComponents(oChildNode, aSuccessorComponents);
				if (oChildNode.componentId){
					var oChildRegistryEntry = oTemplateContract.componentRegistry[oChildNode.componentId];
					aSuccessorComponents.push(oChildRegistryEntry.oComponent);
				}
			}			
		}

		function getSuccessors(oComponent) {
			var aRet = [];
			var oComponentRegistryEntry = oTemplateContract.componentRegistry[oComponent.getId()];
			var oTreeNode = oTemplateContract.mRoutingTree[oComponentRegistryEntry.route];
			addSuccessorComponents(oTreeNode, aRet);
			return aRet;
		}

		/*
		 * Unbind all children components
		 * @param {Object} oComponent - the component which children should be unbinded
		 * @param {boolean} bAndMe - information whether the provided component itself is also affected
		 */
		function unbindChildren(oComponent, bAndMe) {
			var aSuccessors = getSuccessors(oComponent);
			if (bAndMe){
				aSuccessors.push(oComponent);
			}
			for (var i = 0; i < aSuccessors.length; i++) {
				oTemplateContract.componentRegistry[aSuccessors[i].getId()].utils.unbind();
			}
		}

		function unbindChildrenUsingTreeNode(oTreeNode){
			var aSuccessorComponents = [];
			addSuccessorComponents(oTreeNode, aSuccessorComponents);
			for (var i = 0; i < aSuccessorComponents.length; i++) {
				oTemplateContract.componentRegistry[aSuccessorComponents[i].getId()].utils.unbind();
			}
		}

		/*
		 * Sets the root page to dirty
		 *
		 */
		function setRootPageToDirty() {
			var oRootNode = oTemplateContract.mRoutingTree.root;
			if (oRootNode.componentId){
				var oRegistryEntry = oTemplateContract.componentRegistry[oRootNode.componentId];
				var oInstance = oRegistryEntry.oComponent;
				if (oInstance && typeof oInstance.setIsRefreshRequired === "function") {
						oInstance.setIsRefreshRequired(true);
				}
			}
		}
		/*
		 * Sets all the active pages to dirty and refreshes them. Also resets any pending changes in the model
		 */
		function setActivePagesToDirty() {
			var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
			//Reset any pending changes before component refresh.
			oTemplateContract.oAppComponent.getModel().resetChanges();
			aActiveComponents.forEach(function(sComponentId) {
				var oComponentRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
                oComponentRegistryEntry.oComponent.setIsRefreshRequired(true);
			});
		}
		
		/*
		 * Sets the refresh behaviour for the components passed in the mComponentRefresh parameter on app
		 * restore after an external navigation. Used for sap-keep-alive feature
		 */
		function setRefreshBehaviour(mComponentRefresh) {
			/*
			 * For app with sap-keep-alive settings, we should refresh the content of the app we are navigating away from based on
			 * the outbound navigation's manifest settings and therefore, we set it to dirty in advance.
			 * However, we have to postpone this until the table is no longer visible, since otherwise the refresh of the table
			 * would be triggered immediately. In order to achieve this, setting this page to dirty is postponed until the leaveAppPromise is resolved.
			 */
			oTemplateContract.leaveAppPromise.then(function() {
				for (var sComponent in mComponentRefresh) {
					for (var nIndex in mComponentRefresh[sComponent].entitySets) {
						setMeToDirty(mComponentRefresh[sComponent].component, mComponentRefresh[sComponent].entitySets[nIndex]);
					}

					if (mComponentRefresh[sComponent].withoutAssociationsRefresh) {
						oTemplateContract.componentRegistry[sComponent].bWithoutAssociationsRefresh = true;
					}

					if (mComponentRefresh[sComponent].isRefreshRequired) {
						mComponentRefresh[sComponent].component.setIsRefreshRequired(true);
					}
				}
			});
		}

		return {
			setAllPagesDirty: setAllPagesDirty,
			setParentToDirty: setParentToDirty,
			setMeToDirty: setMeToDirty,
			unbindChildren: unbindChildren,
			unbindChildrenUsingTreeNode: unbindChildrenUsingTreeNode,
			setRootPageToDirty: setRootPageToDirty,
			setActivePagesToDirty: setActivePagesToDirty,
			setRefreshBehaviour: setRefreshBehaviour
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.ViewDependencyHelper", {
		constructor: function(oTemplateContract) {
			extend(this, getMethods(oTemplateContract));
		}
	});
});
