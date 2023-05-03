sap.ui.define(["sap/ui/base/Object",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/extend",
	"sap/ui/model/Context"
], function(BaseObject, FeLogger, extend, Context) {
	"use strict";
	var oLogger = new FeLogger("extensionAPI.NavigationController").getLogger();
	/**
	 * API to be used for navigation in extensions of Smart Template Applications. Breakout coding can access an instance
	 * of this class via {@link sap.suite.ui.generic.template.ListReport.extensionAPI.ExtensionAPI} or
	 * {@link sap.suite.ui.generic.template.ObjectPage.extensionAPI.ExtensionAPI}. Do not instantiate yourself.
	 * @class
	 * @name sap.suite.ui.generic.template.extensionAPI.NavigationController
	 * @public
	 */

	function getMethods(oTemplateUtils, oController, oState) {

		return /** @lends sap.suite.ui.generic.template.extensionAPI.NavigationController.prototype */ {
			/**
			 * Navigates to the given intent
			 *
			 * @param {string} sOutbound The name of the outbound defined in the manifest
			 * @param {object} [mParameters] map with parameters for the navigation. If no parameters are provided, default are the parameters defined in the manifest
			 * @public
			 */
			navigateExternal: function(sOutbound, mParameters) {
				var oManifestEntry = oController.getOwnerComponent().getAppComponent().getManifestEntry("sap.app");
				var oOutbound = oManifestEntry.crossNavigation.outbounds[sOutbound];
				
				if (!oOutbound) {
					oLogger.error("navigateExternal: mandatory parameter 'Outbound' is missing, or different from manifest entry");
					return;
				}
				
				oOutbound.key = sOutbound;
				if (mParameters){
					oOutbound.parameters = mParameters;
				} else {
					// todo: evaluate parameters
					oOutbound.parameters = oTemplateUtils.oCommonEventHandlers.evaluateParameters(oOutbound.parameters);
				}
				oTemplateUtils.oCommonUtils.navigateExternal(oOutbound, oState);
			},

			/**
			 * Sets the refresh behaviour of the source application, before navigating away in sap-keep-alive scenarios using navPopover smart link
			 * The refreshStrategyOnAppRestore should be configured in the manifest
			 * This function should be called on the beforeNavigationCallBack method of the NavPopover Smart Link.
			 * This function only needs to be called in the exceptional case that the SmartLink control has been added in a custom fragment or a reuse component, since framework takes care for all other cases.
			 * @param {string} sOutbound the name of the outbound defined in the manifest
			 * @param {object} mParameters map with parameters for the navigation. If no parameters are provided, default are the parameters defined in the manifest
			 * @see {@link topic:3c65f2cc630c472da8328a6f3c193683 Refresh Entity Sets in keep alive mode}
			 */
			setRefreshBehaviour: function(sOutbound, mParameters){
				var oManifestEntry = oController.getOwnerComponent().getAppComponent().getManifestEntry("sap.app");
				var oOutbound = oManifestEntry.crossNavigation.outbounds[sOutbound];
				
				if (!oOutbound) {
					oLogger.error("navigateExternal: mandatory parameter 'Outbound' is missing, or different from manifest entry");
					return;
				}
				
				oOutbound.key = sOutbound;
				if (mParameters){
					oOutbound.parameters = mParameters;
				}
				oTemplateUtils.oCommonUtils.setComponentRefreshBehaviour(oOutbound);
			},
			/**
			 * Triggers a navigation to another page within the application
			 *
			 * @param {sap.ui.model.Context | string | sap.ui.model.Context[]} vContext The target context for the navigation.
			 *  vContext as string, to navigate to specified target
			 *  vContext as Array [hierarchyOfContext] target context being the last context of hierarchyOfContext
			 *  E.g to directly navigate from LR to Sub object page, the hierarchyOfContext would be [contextOfMainObjectPage, contextOfSubObjectPage]
			 *  vContext as sap.ui.model.Context if only one context has to be passed, send it as an Object instead of Array, to navigate to specified Target
			 * If the parameter is faulty (and oNavigationData does not specify a route itself) the root page of the app is considered to be the target of the application.
			 * @param {object} [oNavigationData] object containing navigation data
			 * @param {string} [oNavigationData.routeName] This property is used if the target of the navigation should be a page which is not configured via an entity set (thus it is a canvas page).
			 * In this case the value of this property should match the name of the route which was defined in the routingSpec of this page. If the page requires a key, this key should be added as
			 * content of <code>vContext</code>, which should be a string in this case.
			 * @param {boolean} [oNavigationData.replaceInHistory] If this is truthy the page navigated to will replace the current page in the browser history
			 * @param {sap.suite.ui.generic.template.displayMode} [oNavigationData.displayMode] This gives the provision to the application developer to chosse between "display"/"edit" mode for target page
			 * @param {boolean} [oNavigationData.isAbsolute] This property is only relevant if this instance is obtained from the extension api of a reuse component (on object page) or an 
			 * implementing component (of a canvas page) and property <i>routeName</i> is set. In this case the navigation triggered by this method is by default restricted to child pages of that component. If the target page of the navigation
			 * should be a page which is not a child page of that component this property should be set to <code>>true</code>. In this case the target of the navigation can also be a child of any of the hierarchical ancestors of the current page.
			 * Note that this establishes a strong dependency from the business logic of that component to the structure of the app. This is problematic if the component is defined
			 * independently of the app.
			 * @public
			 */
			navigateInternal: function(vContext, oNavigationData) {
				if (vContext && oState && oState.aCreateContexts){ // vContext might have been registered for create navigation
					for (var i = 0; i < oState.aCreateContexts.length; i++){
						var oCreateContextSpec = oState.aCreateContexts[i];
						if (oCreateContextSpec.context === vContext){
							oState.aCreateContexts.splice(i, 1);
							oTemplateUtils.oServices.oApplication.navigateToNonDraftCreateContext(oCreateContextSpec);
							return;
						}
					}
				}
				var bReplace = !!(oNavigationData && oNavigationData.replaceInHistory);
				// explicit route has been configured -> virtual context

				var iDisplayMode = 0;
				if (oNavigationData) {
					switch (oNavigationData.displayMode) {
						case "display":
							iDisplayMode = 1;
							break;
						case "edit":
							iDisplayMode = 2;
							break;
						case "create":
							iDisplayMode = 4;
							break;
						default:
							iDisplayMode = 0;
							break;						
					}
				}

				var sRouteName = oNavigationData && oNavigationData.routeName;
				if (sRouteName){
					oTemplateUtils.oComponentUtils.navigateRoute(sRouteName, vContext, null, bReplace, iDisplayMode);
					return;
				}
				// 'normal' navigation via context

				if (!vContext || Array.isArray(vContext) || vContext instanceof Context){
					oTemplateUtils.oServices.oApplication.navigateToSubContext(vContext, bReplace, iDisplayMode);
					return;
				}
				oLogger.warning("navigateToContext called without suitable context or route");
			},

			getCurrentKeys: function(){
				return oTemplateUtils.oComponentUtils.getCurrentKeys();
			}
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.extensionAPI.NavigationController", {
		constructor: function(oTemplateUtils, oController, oState) {
			extend(this, getMethods(oTemplateUtils, oController, oState));
		}
	});
});
