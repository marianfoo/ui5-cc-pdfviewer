/* Static helper class of NavigationController used to initialize the routing of the app during startup
 * More precisely the following tasks are performed:
 * - Create routes from the pages-section of the manifest
 * - Process startup parameters
 * - Finally, initialize router
 */

sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/ui/core/mvc/XMLView",
	"sap/suite/ui/generic/template/lib/FlexibleColumnLayoutHandler",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/extend",
    "sap/suite/ui/generic/template/genericUtilities/FeError"
], function(Controller, XMLView, FlexibleColumnLayoutHandler, testableHelper, StableIdHelper, FeLogger, extend, FeError){
		"use strict";
	var	sClassName = "lib.navigation.routingHelper";
	var oLogger = new FeLogger(sClassName).getLogger();
	
	var mFloorplanBehaviourPromises = Object.create(null);
	var oStandardBehaviour = { 
		getPlaceholderInfo: Function.prototype
	};

		var oCrossAppNavService = (sap && sap.ushell && sap.ushell.Container) ? sap.ushell.Container.getService("CrossApplicationNavigation") : (function(){
			var i = 0;
			var oResolved = {
				done: function (callback){
					callback({
						getData: function(){
							return Object.create(null);
						}	
					});
				},
				fail: function () {
				}
			};
			return {
				createEmptyAppState: function(){
					return {
						getKey: function(){
							i++;
							return "" + i;
						},
						setData: Function.prototype,
						getData: function(){
							return {'historicalEntries':['']};
						},
						save: function(){
							return Promise.resolve();
						}
					};
				},
				getAppState: function(){
					return oResolved;
				},
				isInitialNavigation: function(){
					return true;
				}
			};
		})();

		// creates a router target according to the spec with the given name and returns the created target
		function createTarget(oNavigationControllerProxy, sTargetName, sHostId, sHostAggregation, oBehaviour, oTargetControlSpec){
			var oPlaceholderInfo = oNavigationControllerProxy.oTemplateContract.bEnablePlaceholder ? (oBehaviour && oBehaviour.getPlaceholderInfo()) : null;
			var oTarget = extend({
				controlId: sHostId,
				controlAggregation: sHostAggregation,
				placeholder: oPlaceholderInfo
			}, oTargetControlSpec);
			var oTargets = oNavigationControllerProxy.oRouter.getTargets();
			oTargets.addTarget(sTargetName, oTarget);
			return oTargets.getTarget(sTargetName);
		}
		
		// creates a view target as specified and returns the created target
		function createViewTarget(oNavigationControllerProxy, sHostId, sViewName, sTargetName, sHostAggregation, oBehaviour) {
			return createTarget(oNavigationControllerProxy, sTargetName, sHostId, sHostAggregation, oBehaviour, {
				viewName: sViewName
			});
		}

		function createMessagePageTargets(oNavigationControllerProxy, sTargetControlId) {
			if (oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler) {
				oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler.createMessagePageTargets(createViewTarget.bind(null,
					oNavigationControllerProxy, sTargetControlId, "sap.suite.ui.generic.template.fragments.MessagePage"));
			} else {
				createViewTarget(oNavigationControllerProxy, sTargetControlId, "sap.suite.ui.generic.template.fragments.MessagePage",
					"messagePage", "pages");
			}
		}
		
		function createTargetForTreeNode(oNavigationControllerProxy, oTreeNode, sHostId, sHostAggregation){
			var oTarget = createViewTarget(oNavigationControllerProxy, sHostId, oTreeNode.sRouteName, oTreeNode.sRouteName, sHostAggregation, oTreeNode.behaviour);
			var fnRegisterTreeNodeFirstDisplay = function(){
				oNavigationControllerProxy.treeNodeFirstDisplay(oTreeNode);
				oTarget.detachDisplay(fnRegisterTreeNodeFirstDisplay);
			};
			oTarget.attachDisplay(fnRegisterTreeNodeFirstDisplay);			
		}
		
		function fnDetemineDraftForTreeNode(oNavigationControllerProxy, oTreeNode, oParentNode){
			// Source of draft information: If there is no routingSpec always "OData", otherwise the draftSpec component of routingSpec which is defaulted to "parent".
			var vDraftSpec = oTreeNode.page.routingSpec ? oTreeNode.page.routingSpec.draftSpec : "OData";
			if (vDraftSpec === undefined){ // can only happen if oTreeNode.page has a routingSpec with no (or undefined) draftSpec
				vDraftSpec = "parent";
			}
			switch (vDraftSpec){
				case "parent":
					oTreeNode.isDraft = oParentNode.isDraft;
					return;
				case "OData":
					var oDraftController = oNavigationControllerProxy.oAppComponent.getTransactionController().getDraftController();
					var oDraftContext = oDraftController.getDraftContext();
					try {
						oTreeNode.isDraft = oDraftContext.isDraftEnabled(oTreeNode.entitySet);
					} catch (oError){
						oLogger.warning("Could not determine draft info for entity set " + oTreeNode.entitySet);
						oTreeNode.isDraft = oParentNode && oParentNode.isDraft; // fall back to parent if determining of draft info fails
					} 
					return;
			}
			oTreeNode.isDraft = vDraftSpec; // vDraftSpec should be an explicit boolean value now
		}
		
		function getPreparationPromise(oTreeNode){
		var sTemplate = oTreeNode.page.component.name;
		var oPreparePromise = mFloorplanBehaviourPromises[sTemplate];
			if (!oPreparePromise){
				oPreparePromise = new Promise(function(fnResolve){
					var sBehaviourName = sTemplate.replace(/\./g, "/") + "/behaviour";
					sap.ui.require([sBehaviourName], function(oBehaviour){
						var oMyBehaviour = extend({}, oStandardBehaviour);
						extend(oMyBehaviour, oBehaviour);
						fnResolve(oMyBehaviour);
					}, function(){
						fnResolve(oStandardBehaviour);
					});	
				});
				mFloorplanBehaviourPromises[sTemplate] = oPreparePromise;
			}
			return oPreparePromise.then(function(oBehaviour){
				oTreeNode.behaviour = oBehaviour;	
			});
		}
		
		
		// This function adds those properties to the treeNode which are identical for
		// top tree node and detail tree nodes on initialization.
		// For convenience the tree node is returned.
		function fnAddInitialTreeNodeProperties(oTreeNode){
			oTreeNode.children = [];
			oTreeNode.text = "";
			oTreeNode.willBeDisplayed = new Promise(function(fnResolve){
				oTreeNode.display = function(){
					fnResolve();
					oTreeNode.display = Function.prototype;
				};
			});
			return oTreeNode;	
		}

		/**
		 * Creates necessary routing metadata from configuration and adds it to the Router
		 * Also builds the TreeNodes strcutures in template contract (mEntityTree and mRoutingTree).
		 * Note that metamodel is already loaded when this method is called.
		 *
		 * @public
		 * @param {String} sNavigationTargetId - the navigation target ID
		 * @returns {String} sEntitySet - the root EntitySet
		 */
		function generateRoutingStructure(oTemplateContract) {
			// check the manifest.json for the flexibleColumnLayout
			var oFCLSettings = oTemplateContract.oAppComponent.getFlexibleColumnLayout();
			if (oFCLSettings) {
				oTemplateContract.oFlexibleColumnLayoutHandler = new FlexibleColumnLayoutHandler(
					oTemplateContract.oNavigationHost, oTemplateContract.oNavigationControllerProxy
				);
			}
			var oHostViewPrepared = XMLView.create({
				viewName: "sap.suite.ui.generic.template.fragments.TemplateHost"
			}).then(function(oHostViewTemplate){
				oTemplateContract.oNavigationControllerProxy.createHostView = function(){
					return oHostViewTemplate.clone();	
				};				
			});
			var oModel = oTemplateContract.oAppComponent.getModel();
			var oPreparationDone = Promise.all([oHostViewPrepared, oModel.getMetaModel().loaded()]);
			return oPreparationDone.then(function(){
				var sTargetControlId = oTemplateContract.oNavigationHost.getId();
				var oConfig = oTemplateContract.oAppComponent.getConfig();
				if (!oConfig.pages || !oConfig.pages.length) {
					throw new FeError(sClassName, "Route Configuration missing");
				}
				if (oConfig.pages.length > 1) {
					throw new FeError(sClassName, "Currently only one Top route supported");
				}
	
				// create Top-Route
				// currently only one top route supported
				var oTopPage = oConfig.pages[0];
	
				oTemplateContract.mEntityTree = Object.create(null);
				oTemplateContract.mRoutingTree = Object.create(null);
	
				var oTopTreeNode = fnAddInitialTreeNodeProperties({
					sRouteName: "root",
					entitySet: oTopPage.entitySet,
					page: oTopPage,
					getPath: function(){
						return "";
					},
					level: 0,
					fCLLevel: 0,
					headerTitle: oTemplateContract.oAppComponent.getManifestEntry("sap.app").title
				});
				
				fnDetemineDraftForTreeNode(oTemplateContract.oNavigationControllerProxy, oTopTreeNode, null);
				
				/* The following functions are asynchronous to accomodate placeholder details during target creation, while making the implementation
				floorplan agnositic, also the subsequent functions would be asynchrounous */
				var createRoutePromise = createRoute([], oTopPage, oTopTreeNode, null, oTemplateContract.oNavigationControllerProxy, sTargetControlId);
				
				return createRoutePromise.then(function(){
					var oChildRoutesPromise =  createChildRoutes("root", oTopPage, 0, oTopTreeNode, oTemplateContract.oNavigationControllerProxy, sTargetControlId, oTopTreeNode.children);
					return oChildRoutesPromise.then(function(){
						createMessagePageTargets(oTemplateContract.oNavigationControllerProxy, sTargetControlId);
					});
				});

			});
		}

		/**
		 * Creates child route from the specified route configuration
		 *
		 * @private
		 * @param {Object} oRoute - the route configuration
		 * @param {Number} iLevel - the level
		 * @param {Object} oParentNode - the parent TreeNode (if any)
		 * @param {Array} aNodes - optional: Add the names of entity sets for the created roots to this array
		 * @returns {promise} A promise is returned
		 */
		function createChildRoutes(vPredecessorTargets, oPage, iLevel, oParentNode, oNavigationControllerProxy, sTargetControlId, aNodes,
			oCommunicationObject, iParentFCLDistanceToRoot) {
			return oPage.pages ? Promise.all(oPage.pages.map(function(oSubPage){
				return createRoutes(vPredecessorTargets, oSubPage, iLevel + 1, oParentNode, oNavigationControllerProxy, sTargetControlId, aNodes, oCommunicationObject, iParentFCLDistanceToRoot || 0);
			})) : Promise.resolve();
		}
		
		function getEmbeddedComponentsPatternDelimiter(){
			return "---";
		}
		
		function fnHandleEmbeddedComponentPages(vPredecessorTargets, sEmbeddedComponentKey, oEmbeddedComponent, iLevel, oParentNode, oNavigationControllerProxy, sTargetControlId, aNodes,
			oCommunicationObject, iParentFCLDistanceToRoot) {
			vPredecessorTargets = oParentNode.target || vPredecessorTargets;
			var oPseudoRoot = {
				pages: oEmbeddedComponent.pages
			};
			var oPseudoParentNode = {
				entitySet: oParentNode.entitySet,
				sRouteName: oParentNode.sRouteName,
				isDraft: oParentNode.isDraft,
				embeddedComponent: sEmbeddedComponentKey,
				getPath: function(iMode){
					return oParentNode.getPath(iMode) + (iMode === 1 ? ("/" + sEmbeddedComponentKey) : "");
				},
				patternDelimiter: getEmbeddedComponentsPatternDelimiter()
			};
			return createChildRoutes(vPredecessorTargets, oPseudoRoot, iLevel, oPseudoParentNode, oNavigationControllerProxy, sTargetControlId, aNodes, oCommunicationObject, iParentFCLDistanceToRoot);
		}

		function fnHandleEmbeddedComponent(vPredecessorTargets, oTreeNode, iLevel, oNavigationControllerProxy, sTargetControlId, iParentFCLDistanceToRoot,
			sEmbeddedComponentKey, oEmbeddedComponent, sContainerId, sSectionId, sSubSectionId, sComponentId) {
			var oCommunicationObject = {};
			var oEmbeddedComponentInfo = {
				key: sEmbeddedComponentKey,
				definition: oEmbeddedComponent,
				componentName: oEmbeddedComponent.componentName,
				componentUsage: oEmbeddedComponent.componentUsage,
				hiddenByDefault: oEmbeddedComponent.hiddenByDefault,
				containerId: sContainerId,
				sectionId: sSectionId, // at this point in time only filled if this is a leading embedding component
				subSectionId: sSubSectionId,
				componentId: sComponentId,
				pages: oEmbeddedComponent.pages || [],
				children: [],
				communicationObject: oCommunicationObject
			};
			oTreeNode.embeddedComponents[sEmbeddedComponentKey] = oEmbeddedComponentInfo;
			return oEmbeddedComponent.pages ?
				fnHandleEmbeddedComponentPages(vPredecessorTargets, sEmbeddedComponentKey, oEmbeddedComponent, iLevel, oTreeNode, oNavigationControllerProxy, sTargetControlId, oEmbeddedComponentInfo.children, oCommunicationObject, iParentFCLDistanceToRoot) :
		        Promise.resolve();
		}

		function fnHandleEmbeddedComponents(vPredecessorTargets, oTreeNode, oPage, iLevel, oNavigationControllerProxy, sTargetControlId, iParentFCLDistanceToRoot) {
			oTreeNode.embeddedComponents = Object.create(null);
			oTreeNode.leadingComponents = Object.create(null);
			oTreeNode.facetsWithEmbeddedComponents = Object.create(null);
			if (oPage.implementingComponent) {
				var sContainerId = StableIdHelper.getStableId({
					type: "Canvas",
					subType: "ImplementingComponentContainer"
				});
				var sImplementingComponentId = StableIdHelper.getStableId({
					type: "Canvas",
					subType: "ImplementingComponentContainerContent"
				});				
				return fnHandleEmbeddedComponent(vPredecessorTargets, oTreeNode, iLevel, oNavigationControllerProxy, sTargetControlId, iParentFCLDistanceToRoot, "implementation", oPage.implementingComponent, sContainerId, null, null, sImplementingComponentId);
			}
			var aEmbeddedPromises = [];
			if (oPage.embeddedComponents) {
				// first we analyze the grouping structure of the embedded components.
				// Note that there are three kinds of reuse components: 1. "leading" -> defining an own group of reuse components 2. "following" -> added to a group of another leading component 3. "facet" -> added to an already existing facet
				var mLeadingComponents = Object.create(null);
				var mFollowingComponents = Object.create(null);
				var sEmbeddedComponentKey;
				var oEmbeddedComponent;
				var aSiblings;
				for (sEmbeddedComponentKey in oPage.embeddedComponents) {
					oEmbeddedComponent = oPage.embeddedComponents[sEmbeddedComponentKey];
					if (!oEmbeddedComponent.leadingSectionIdOrPath || oEmbeddedComponent.leadingSectionIdOrPath === sEmbeddedComponentKey){ // this is considered as a well-defined leading component
						mLeadingComponents[sEmbeddedComponentKey] = [sEmbeddedComponentKey];
					} else if (oPage.embeddedComponents[oEmbeddedComponent.leadingSectionIdOrPath]){ // this seems to be a following component
						mFollowingComponents[sEmbeddedComponentKey] = oEmbeddedComponent.leadingSectionIdOrPath;
					} else { // a facet component
						aSiblings = oTreeNode.facetsWithEmbeddedComponents[oEmbeddedComponent.leadingSectionIdOrPath];
						if (aSiblings){
							aSiblings.push(sEmbeddedComponentKey);
						} else {
							oTreeNode.facetsWithEmbeddedComponents[oEmbeddedComponent.leadingSectionIdOrPath] = [sEmbeddedComponentKey];
						}
					}
				}
				var aInconsitencies = [];
				for (sEmbeddedComponentKey in mFollowingComponents) {
					var sLeadingComponentKey = mFollowingComponents[sEmbeddedComponentKey];
					aSiblings = mLeadingComponents[sLeadingComponentKey]; // list of reuse components belonging to the same leading component already identified (should at least contain the leading component itself)
					if (aSiblings){ // expected result
						aSiblings.push(sEmbeddedComponentKey); // add this reuse component to the list of following components of the leading component
					} else { // sEmbeddedComponentKey is a following component which points to another component which is not leading either. For robustness we consider such an inconsitent component as a group of its own.
						aInconsitencies.push(sEmbeddedComponentKey);
						delete mFollowingComponents[sEmbeddedComponentKey];
					}
				}
				for (var i = 0; i < aInconsitencies.length; i++){ // transfer all inconsistent components to the set of leading components
					mLeadingComponents[aInconsitencies[i]] = [aInconsitencies[i]];
				}
				for (sEmbeddedComponentKey in oPage.embeddedComponents) {
					oEmbeddedComponent = oPage.embeddedComponents[sEmbeddedComponentKey];
					var sSectionId = mLeadingComponents[sEmbeddedComponentKey] && StableIdHelper.getStableId({
						type: "ObjectPageSection",
						subType: "ReuseComponentSection",
						sReuseComponentName: oEmbeddedComponent.componentName,
						sReuseComponentUsage: oEmbeddedComponent.componentUsage,
						sReuseComponentKey: sEmbeddedComponentKey
					});
					var sSubSectionId = StableIdHelper.getStableId({
						type: "ObjectPageSection",
						subType: "ReuseComponentSubSection",
						sReuseComponentName: oEmbeddedComponent.componentName,
						sReuseComponentUsage: oEmbeddedComponent.componentUsage,
						sReuseComponentKey: sEmbeddedComponentKey
					});
					var sContainerId = StableIdHelper.getStableId({
						type: "ObjectPageSection",
						subType: "ReuseComponentContainer",
						sReuseComponentName: oEmbeddedComponent.componentName,
						sReuseComponentUsage: oEmbeddedComponent.componentUsage,
						sReuseComponentKey: sEmbeddedComponentKey
					});
					var sReuseComponentId = StableIdHelper.getStableId({
						type: "ObjectPageSection",
						subType: "ReuseComponentContainerContent",
						sReuseComponentName: oEmbeddedComponent.componentName,
						sReuseComponentUsage: oEmbeddedComponent.componentUsage,
						sReuseComponentKey: sEmbeddedComponentKey
					});
					var oEmbeddedPromise = fnHandleEmbeddedComponent(vPredecessorTargets, oTreeNode, iLevel, oNavigationControllerProxy, sTargetControlId, iParentFCLDistanceToRoot, sEmbeddedComponentKey,
						oEmbeddedComponent, sContainerId, sSectionId, sSubSectionId, sReuseComponentId);
					aEmbeddedPromises.push(oEmbeddedPromise);
				}
				// Transfer information from mLeadingComponents to oTreeNode.leadingComponents.
				Object.keys(mLeadingComponents).forEach(function(sLeadingComponentKey){
					var oLeadingComponentMeta = oTreeNode.embeddedComponents[sLeadingComponentKey];
					oTreeNode.leadingComponents[sLeadingComponentKey] = {
						sectionId: oLeadingComponentMeta.sectionId,
						title: oLeadingComponentMeta.definition.groupTitle || oLeadingComponentMeta.definition.title,
						followingComponents: mLeadingComponents[sLeadingComponentKey].map(function(sFollowingKey){
							var oFollowingComponentMeta = oTreeNode.embeddedComponents[sFollowingKey];
							oFollowingComponentMeta.sectionId = oLeadingComponentMeta.sectionId;
							return oFollowingComponentMeta;
						})
					};
				});
			}
			return Promise.all(aEmbeddedPromises);
		}

		/**
		 * Creates all necessary route(s) metadata from configuration and adds it to the Router instance
		 *
		 * @private
		 * @param {Object} oRoute - the route configuration
		 * @param {Number} iLevel - the level
		 * @param {Object} oParentNode - the parent TreeNode (if any)
		 * @param {Array} aNodes - optional: Add the names of entity sets for the created roots to this array
		 * @returns {promise} A promise is returned and this function is made async
		 */
		function createRoutes(vPredecessorTargets, oPage, iLevel, oParentNode, oNavigationControllerProxy, sTargetControlId, aNodes,
			oCommunicationObject, iParentFCLDistanceToRoot) {
			var bNoOData = oPage.routingSpec && oPage.routingSpec.noOData;
			var oModel = oNavigationControllerProxy.oAppComponent.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oModelEntitySet = oMetaModel.getODataEntitySet(oPage.entitySet);
			//in case of intent there is no internal route to be created
			//support for reducing entitySet - check if entitySet is present in metadata
			if (oPage.component && (bNoOData || oModelEntitySet)) {
				var iMaxColumnCountInFCL = oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler ? oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler.getMaxColumnCountInFCL() : 1;
				var iFCLDistanceToRoot = (iMaxColumnCountInFCL === 1) || (oPage.defaultLayoutType === "OneColumn") ? 0 : iParentFCLDistanceToRoot + 1;
				var oTreeNode = fnAddInitialTreeNodeProperties({
					parent: oParentNode && oParentNode.entitySet,
					parentRoute: oParentNode ? oParentNode.sRouteName : "root",
					parentEmbeddedComponent: oParentNode && oParentNode.embeddedComponent,
					entitySet: oPage.entitySet,
					navigationProperty: oPage.navigationProperty,
					level: iLevel,
					fCLLevel: iFCLDistanceToRoot >= iMaxColumnCountInFCL ?  3 : iFCLDistanceToRoot,
					communicationObject: oCommunicationObject,
					page: oPage,
					defaultLayoutType: oPage.defaultLayoutType,
					noKey: oPage.routingSpec && oPage.routingSpec.noKey,
					noOData: bNoOData
				});
				if (oModelEntitySet){
					oTreeNode.entitySetDefinition = oModelEntitySet;
					oTreeNode.entityTypeDefinition = oMetaModel.getODataEntityType(oModelEntitySet.entityType);
				}
				fnDetemineDraftForTreeNode(oNavigationControllerProxy, oTreeNode, oParentNode);
				addPathFunctionToTreeNode(oTreeNode, oParentNode, oNavigationControllerProxy.oTemplateContract.bCreateRequestsCanonical);
				fnPrepareModelSupportForTreeNode(oTreeNode, oNavigationControllerProxy.oTemplateContract);
				var oNewRoutePromise = createRoute(vPredecessorTargets, oPage, oTreeNode, oParentNode, oNavigationControllerProxy, sTargetControlId);
				
				return oNewRoutePromise.then(function(oResults){
					var oNewRoute = oResults;
					var oModel = oNavigationControllerProxy.oAppComponent.getModel();
					var oEntitySet = oModel.getMetaModel().getODataEntitySet(oPage.entitySet);
					oTreeNode.semanticObject = oEntitySet && oEntitySet["com.sap.vocabularies.Common.v1.SemanticObject"] && oEntitySet["com.sap.vocabularies.Common.v1.SemanticObject"].String;
					if (aNodes) {
						aNodes.push(oPage.entitySet);
					}
					var oExistingTreeNode = oNavigationControllerProxy.oTemplateContract.mEntityTree[oPage.entitySet];
					// Expected: oExistingTreeNode is faulty. However, there are scenarios with circular page structures.
					if (!oExistingTreeNode || oExistingTreeNode.level > oTreeNode.level) {
						oNavigationControllerProxy.oTemplateContract.mEntityTree[oPage.entitySet] = oTreeNode;
					}
					addTitleInfoToTreeNode(oNavigationControllerProxy, oTreeNode, oPage);
					var createChildRoutesPromise = createChildRoutes(oNewRoute.target, oPage, iLevel, oTreeNode, oNavigationControllerProxy, sTargetControlId, oTreeNode.children, oCommunicationObject, iFCLDistanceToRoot);
					return createChildRoutesPromise.then(function(){
						return fnHandleEmbeddedComponents(oNewRoute.target, oTreeNode, oPage, iLevel, oNavigationControllerProxy, sTargetControlId, iFCLDistanceToRoot);
					});
				});
			}
			return Promise.resolve();
		}

		/**
		 * Creates a Query route from the specified route and adds it to the router
		 * @private
		 * @param {Object} oRoute - the route configuration
		 */
		function createQueryRoute(oRoute, oNavigationControllerProxy) {
			var oQueryRoute = extend({}, oRoute);
			oQueryRoute.name = oRoute.name + "query";
			oQueryRoute.pattern = oRoute.pattern + "{?query}";
			oNavigationControllerProxy.oRouter.addRoute(oQueryRoute);
		}

		function addTitleInfoToTreeNode(oNavigationControllerProxy, oTreeNode, oPage) {
			if (oTreeNode.noOData) {
				oTreeNode.headerTitle = oPage.routingSpec.headerTitle;
				oTreeNode.titleIconUrl = oPage.routingSpec.titleIconUrl;
			} else {
				var oModel = oNavigationControllerProxy.oAppComponent.getModel();
				var oMetaModel = oModel.getMetaModel();
				oMetaModel.loaded().then(function() {
					var oModelEntitySet = oMetaModel.getODataEntitySet(oTreeNode.entitySet);
					var oDataEntityType = oMetaModel.getODataEntityType(oModelEntitySet.entityType);
					var oHeaderInfo = oDataEntityType["com.sap.vocabularies.UI.v1.HeaderInfo"];
					var sHeaderTitle = (oHeaderInfo && oHeaderInfo.TypeName && oHeaderInfo.TypeName.String) || "";
					if (sHeaderTitle.substr(0, 7) === "{@i18n>") {
						var sSubstr = sHeaderTitle.substring(1, sHeaderTitle.length - 1);
						var aString = sSubstr.split(">");
						sHeaderTitle = oNavigationControllerProxy.oAppComponent.getModel(aString[0]).getResourceBundle().getText(aString[1]);
					}
					oTreeNode.headerTitle = sHeaderTitle;
					var sTitleIconUrl = (oHeaderInfo && oHeaderInfo.Title && oHeaderInfo.Title.IconUrl && oHeaderInfo.Title.IconUrl.String) || "";
					oTreeNode.titleIconUrl = sTitleIconUrl;
				});
			}
		}

		function addPathFunctionToTreeNode(oTreeNode, oParentNode, bCreateRequestsCanonical){
			var sPathPattern = (oTreeNode.level === 1 || !oTreeNode.page.navigationProperty) ? oTreeNode.page.entitySet : oTreeNode.page.navigationProperty;
			var sKeySpec = oTreeNode.noKey ? "" : "({keys" + oTreeNode.level + "})";
			var sRoutePattern = sPathPattern + sKeySpec;
			var sParentRoutePattern = oParentNode && oParentNode.getPath(1);
			if (sParentRoutePattern){
				sRoutePattern = sParentRoutePattern + (oParentNode.patternDelimiter || "/") + sRoutePattern;
			}
			var sCanonicalPath;
			var sBindingPath;
			if (oTreeNode.noOData){
				var sSuffix = oTreeNode.page.routingSpec.binding ? ("/" + oTreeNode.page.routingSpec.binding) : "";
				sCanonicalPath = oParentNode.getPath(3) + sSuffix;
				sBindingPath = oParentNode.getPath(2) + sSuffix;
			} else {
				sCanonicalPath = "/" + oTreeNode.entitySet + sKeySpec;
				sBindingPath = bCreateRequestsCanonical || (!oTreeNode.page.navigationProperty || oTreeNode.level === 1) ? sCanonicalPath : oParentNode.getPath(2) + "/" + oTreeNode.page.navigationProperty + sKeySpec;
			}
			oTreeNode.getPath = function(iMode, aKeys){
				var sRet;
				switch (iMode){
					case 1:
						sRet = sRoutePattern;
						break;
					case 2:
						sRet = sBindingPath;
						break;
					case 3:
						sRet = sCanonicalPath;
					   break;
				    default:
				}
				if (aKeys){
					for (var i = 1; i <= oTreeNode.level; i++){
						sRet = sRet.replace("{keys" + i + "}", aKeys[i]);
					}
				}
				return sRet;
			};
		}
		
		// This function has the following tasks:
		// 1. Create a JSON model that is attached as named model with a name specific to this TreeNode to the AppComponent
		// 2. Enhance OTreeNode by two functions (bindElement/unbindElement) that set and remove element bindings for
		//    a) the specific model defined in 1 (bForSpecificModel is truthy) and b) the global model (bForSpecificModel is faulty)
		//    Note for use-case b) it is important that the element (oElement) that is used belongs to the TreeNode, because otherwise there might be conflicts.
		function fnPrepareModelSupportForTreeNode(oTreeNode, oTemplateContract){
			oTreeNode.specificModelName = "_templPrivGlobaleODESM_" + oTreeNode.entitySet;
			oTemplateContract.oAppComponent.setModel(oTemplateContract.oAppComponent.getModel(), oTreeNode.specificModelName);
			var mSpecificBindings = Object.create(null);
			var mStandardBindings = Object.create(null);
			// Define a function that binds oElement to the given binding path. Note that an existing binding which already exists
			// would be reused. Therefore, the object oEvents (if provided) given for an element should not be changed.
			// sBindingPath should be a valid binding path for the page belonging to the tree node.
			// If it is faulty the path is derived from the current identity which is supposed to belong to this tree node or one of its successors.
			// The expand will automatically be added.
			oTreeNode.bindElement = function(oElement, sBindingPath, bForSpecificModel, oEvents){
				var oComponentRegistryEntry = oTreeNode.componentId && oTemplateContract.componentRegistry[oTreeNode.componentId];
				var oNonDraftCreateContext = oComponentRegistryEntry && !sBindingPath && oComponentRegistryEntry.nonDraftCreateContext;
				if (oNonDraftCreateContext){ // non-draft create contexts cannot be bound via bindElement but must be set via setBindingContext
					oElement.setBindingContext(oNonDraftCreateContext, bForSpecificModel ? oTreeNode.specificModelName : undefined);
					return;
				}
				var mBindings = bForSpecificModel ? mSpecificBindings : mStandardBindings;
				var sElementId = oElement.getId();
				sBindingPath = sBindingPath || oTreeNode.getPath(2, oTemplateContract.oNavigationControllerProxy.getCurrentKeys(oTreeNode.level));
				var sRootExpand = oComponentRegistryEntry && oComponentRegistryEntry.utils.getRootExpand();
				// top level draft nodes should always include the draft administrative data. If the rootExpand is already there we expect that this already includes it. Otherwise:
				if (!sRootExpand && oTreeNode.level === 1 && oTreeNode.isDraft){ 
					sRootExpand = "DraftAdministrativeData";
				}
				var oCurrentBindingInfo = mBindings[sElementId];
				if (oCurrentBindingInfo && oCurrentBindingInfo.bindingPath === sBindingPath && oCurrentBindingInfo.expand === sRootExpand){
					if (oCurrentBindingInfo.binding.isSuspended()){
						oCurrentBindingInfo.binding.resume();                         
					}
					return;
				}
				var oParameter = {
					createPreliminaryContext: true,
					canonicalRequest: !oTemplateContract.bCreateRequestsCanonical // either we or the framework must set the requests to be canonical
				};
				if (sRootExpand) {
					oParameter.expand = sRootExpand;
				}
				oCurrentBindingInfo = {
					bindingPath: sBindingPath,
					expand: sRootExpand
				};
				var oPathSpec = {
					path: sBindingPath,
					events: oEvents || {},
					parameters: oParameter,
					batchGroupId: "Changes", // get navigation controller constant?
					changeSetId: "Changes"
				};
				if (bForSpecificModel){
					oPathSpec.model = oTreeNode.specificModelName;
				}
				oElement.bindElement(oPathSpec);
				oCurrentBindingInfo.binding = oElement.getElementBinding(oPathSpec.model);
				mBindings[sElementId] = oCurrentBindingInfo;
			};
			
			// Define the unbind method. If no element is specified then all bindings which have been defined via the above method for the specified model are removed.
			oTreeNode.unbindElement = function(oElement, bForSpecificModel){
				var mBindings = bForSpecificModel ? mSpecificBindings : mStandardBindings;
				var sModelname = bForSpecificModel ? oTreeNode.specificModelName : undefined;
				var fnUnbind = function(oElem, sId){
					oElem.unbindElement(sModelname);
					delete mBindings[sId];						
				};
				if (oElement){
					fnUnbind(oElement, oElement.getId());				
				} else {
					var oCore = sap.ui.getCore();
					for (var sElementId in mBindings){
						fnUnbind(oCore.byId(sElementId), sElementId);
					}
				}
			};
		}

		/**
		 * Creates and returns a route metadata from configuration
		 *
		 * @private
		 * @param {Object} oRoute - the route configuration
		 * @param {string} sOperation - the operation for which the route has to be created
		 * @param {Object} oTreeNode- the tree node representing the route
		 * @param {Object} oParentRoute - the parent route (if any)
		 * @returns {promise} aPreparationPromise
		 */
		function createRoute(vPredecessorTargets, oPage, oTreeNode, oParentNode, oNavigationControllerProxy, sTargetControlId) {
			oTreeNode.componentCreated = new Promise(function(fnResolve){
				oTreeNode.componentCreatedResolve = fnResolve;	
			});
			var iLevel = oTreeNode.level;
			var aPredecessorTargets = Array.isArray(vPredecessorTargets) ? vPredecessorTargets : [vPredecessorTargets];

			var oNewRoute = {};
			switch (iLevel){
				case 0:
					oTreeNode.sRouteName = "root";
					break;
				case 1:
					oTreeNode.sRouteName = oPage.entitySet;
					break;
				default:
					oTreeNode.sRouteName = oParentNode.sRouteName + "/" + (oParentNode.embeddedComponent ? oParentNode.embeddedComponent + "/" : "") + (oPage.navigationProperty || oPage.entitySet);
			}
			oNavigationControllerProxy.oTemplateContract.mRoutingTree[oTreeNode.sRouteName] = oTreeNode;
			oNewRoute.name = oTreeNode.sRouteName;
			var sHostAggregation;
			if (oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler) { // In this case the view is hosted by the FCL
				sHostAggregation = oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler.adaptRoutingInfo(oNewRoute,
					oTreeNode.sRouteName, aPredecessorTargets, oTreeNode);
			} else { // In this case the view is hosted by the NavContainer
				sHostAggregation = "pages";
				oNewRoute.target = oTreeNode.sRouteName;
			}
			var aPreparationPromise = getPreparationPromise(oTreeNode);
			return aPreparationPromise.then(function(){
				createTargetForTreeNode(oNavigationControllerProxy, oTreeNode, sTargetControlId, sHostAggregation);
				oNewRoute.pattern = oTreeNode.getPath(1);
				oNavigationControllerProxy.oRouter.addRoute(oNewRoute);
				createQueryRoute(oNewRoute, oNavigationControllerProxy);
				return oNewRoute;            
			});
		}


		function getCrossAppNavService(){
			return oCrossAppNavService;
		}

		return {
			generateRoutingStructure: generateRoutingStructure,
			getCrossAppNavService: getCrossAppNavService,
			getEmbeddedComponentsPatternDelimiter: getEmbeddedComponentsPatternDelimiter
		};
	});
