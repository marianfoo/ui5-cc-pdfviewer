/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/lib/reuseComponentHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
	], function(UIComponent, JSONModel, reuseComponentHelper, FeLogger) {
		"use strict";

		var oLogger = new FeLogger("extensionAPI.ReuseComponentSupport").getLogger();

		/**
		 * Static access to a function that allows a regular UIComponent to be used as a Reuse Component within SmartTemplate applications
		 * @namespace sap.suite.ui.generic.template.extensionAPI.ReuseComponentSupport
		 * @public
		 */

		var sJQueryDebugLogName = "sap.suite.ui.generic.template.extensionAPI.ReuseComponentSupport";

		function fnHandleCallback(oComponentContext, bUnconditional) {
			if (!oComponentContext.extensionAPI){
				return;
			}
			var oDefaultModelBindingContext = oComponentContext.component.getBindingContext();
			var sDefaultModelBindingContextPath = oDefaultModelBindingContext && oDefaultModelBindingContext.getPath();
			if (!bUnconditional && (!oDefaultModelBindingContext || sDefaultModelBindingContextPath === oComponentContext.currentContextPath)){
				return;
			}
			oComponentContext.currentContextPath = sDefaultModelBindingContextPath;
			var	oModel = oComponentContext.component.getModel();
			var fnCurrentCallback = (oComponentContext.firstTime && oComponentContext.component.stStart) || oComponentContext.component.stRefresh;
			oComponentContext.firstTime = false;
			if (fnCurrentCallback){
				fnCurrentCallback.call(oComponentContext.component, oModel, oDefaultModelBindingContext, oComponentContext.extensionAPI);
			}
		}

		function mixInto(oComponent, sComponentModelName, bTwoWaySync) {
			/* Initialize smart template context */
			var oComponentContext =  {
				component: oComponent,
				firstTime: true,
				currentContextPath: null
			};
			var fnHandleCallbackLocalized = fnHandleCallback.bind(null, oComponentContext);
			var oReuseComponentProxy = {
				pathUnchangedCallBack: fnHandleCallbackLocalized,
				component: oComponent,
				isStarted: function(){
					return !oComponentContext.firstTime;
				},
				leaveApp: oComponent.stLeaveApp ? oComponent.stLeaveApp.bind(oComponent) : Function.prototype
			};
			oComponentContext.proxy = oReuseComponentProxy;

			var oRet = new Promise(function(fnResolve){
				oReuseComponentProxy.fnExtensionAPIAvailable = fnResolve;
				reuseComponentHelper.embeddedComponentMixInto(oComponent, oReuseComponentProxy);
			});
			oRet.then(function(oExtensionAPI){
				oComponentContext.extensionAPI = oExtensionAPI;
				fnHandleCallbackLocalized();
			});


			//Subscribe to context ready-events (only if the reuse components shows interest by defining at least one of the corresponding functions)
			if (oComponent.stRefresh || oComponent.stStart) {
				oComponent.attachEvent("modelContextChange", fnHandleCallbackLocalized.bind(null, false));
			}

			//Create component model in case specified
			if (sComponentModelName) {
				var oProperties = oComponent.getMetadata().getProperties();
				var oModelData = {}; // initial data for the component model
				for (var sProperty in oProperties){
					oModelData[sProperty] = oComponent.getProperty(sProperty);	// transfer property values to the model
				}
				var oComponentModel = new JSONModel(oModelData);
				oComponent.setModel(oComponentModel, sComponentModelName);
				var fnSetProperty = oComponent.setProperty || Function.prototype;
				//overwrite set property
				oComponent.setProperty = function(sName, value) {
					/* we overwrite the set property function of UI5 to automatically update the component model
					 * but first we need to call the original (aka super in other languages)
					 */
					fnSetProperty.apply(oComponent, arguments);
					oComponentModel.setProperty("/" + sName, value);
					oLogger.debug(oComponent.getId() + ":" + oComponent.getMetadata().getName() + ": setProperty " + sName + "=" + value, sJQueryDebugLogName);
				};
				oComponent.getComponentModel = oComponent.getComponentModel || function(){ return oComponentModel; };
				if (bTwoWaySync){
					var fnUpdateProperty = function(sProp, oBinding){
						var oValue = oBinding.getValue();
						if (oValue !== oComponent.getProperty(sProp)){
							fnSetProperty.call(oComponent, sProp, oValue);
						}
					};
					for (sProperty in oProperties){
						var oBinding = oComponentModel.bindProperty("/" + sProperty);
						oBinding.attachChange(fnUpdateProperty.bind(null, sProperty, oBinding));
					}
				}
			}
			return oRet;
		}

		return /** @lends sap.suite.ui.generic.template.extensionAPI.ReuseComponentSupport */ {

			/**
			 * Mixin function to transform a regular UIComponent instance into a reuse component for smart templates
			 *
			 * By using the mixInto method the existing component is checked if it implements the following functions:
			 * <ul>
			 *  <li><code>stStart(oModel, oBindingContext, oExtensionAPI)</code> - is called when the model and the context is set for the first time above the compoenent</li>
			 *  <li><code>stRefresh(oModel, oBindingContext, oExtensionAPI)</code> - is called everytime a new context is set above the component or the page context is forced to be refreshed</li>
			 * </ul>
			 * Note that both functions can be called with <code>oBindingContext</code> being empty. This happens in case the page the component is positioned on is opened for creating
			 * a new object in a non-draft scenario.
			 *
			 * @param {sap.ui.core.UIComponent} oComponent the component to be transformed. The following restrictions apply to this component:
			 * <ul>
			 *  <li>The object must not define or access any properties or methods starting with <code>_st</code>. This namespace is reserved for smart template specific coding.
			 *	<li>The object must not define any property or method starting with <code>st</code> with the exception of the methods described above.
			 * </ul>
			 *
			 * @param {string} [sComponentModelName] if this paramater is truthy a JSON model will created that contains the properties defined in the meatdata of <code>oComponent</code>.
			 * The model will be attached to the component with the given name. Moreover, a method <code>getComponentModel</code> will be added to <code>oComponent</code> giving access
			 * to this model.
			 * The properties in the <i>component model</i> will be automatically synced with the corresponding properties of <code>oComponent</code>.
			 * @param {boolean} [bTwoWaySync] This parameters specifies the synchronisation between the properties of the component and the corresponding properties
			 * of the component model. </br>
			 * Changes applied to a property of the component will always be forwarded to the corresponding property of the component model. </br>
			 * Changes applied to a property of the component model which corresponds to a property of the component will only be forwarded accordingly if the
			 * parameter <code>bTwoWaySync</code> is truthy.
			 * @public
			 */
			mixInto: function(oComponent, sComponentModelName, bTwoWaySync) {
			    if (!(oComponent instanceof UIComponent)){
					throw new Error("FioriElements: extensionAPI.ResuseComponentSupport: Reuse component must be an instance of sap.ui.core.UIComponent");
				}
				return mixInto(oComponent, sComponentModelName, bTwoWaySync);
			}
		};
	});
