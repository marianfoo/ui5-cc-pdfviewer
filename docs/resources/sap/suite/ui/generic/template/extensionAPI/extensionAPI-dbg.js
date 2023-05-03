sap.ui.define(["sap/suite/ui/generic/template/lib/TemplateAssembler",
    "sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/ui/core/mvc/Controller"
], function(TemplateAssembler, FeLogger) {
	"use strict";
	var oLogger = new FeLogger("extensionAPI.extensionAPI").getLogger();

	/**
	 * Static access to extension API for Smart Template Application development
	 * @namespace sap.suite.ui.generic.template.extensionAPI.extensionAPI
	 * @public
	 */

	return /** @lends sap.suite.ui.generic.template.extensionAPI.extensionAPI */ {
		/**
		 * @deprecated use <code>getExtensionAPIPromise</code> instead.
		 */
		getExtensionAPI: function(oControl) {
			return TemplateAssembler.getExtensionAPI(oControl);
		},

		/**
		 * Get the extension API valid for the specified control embedded in a SAP Fiori elements view.  Note that extension API
		 * can also be retrieved directly from the controller of the SAP Fiori elements view. Therefore, this method only needs to
		 * be called in scenarios where this controller is not directly accessible. The most prominent use case for this would be
		 * the context of a controller of a view extension. In this case, it is recommended to pass the extending view to this method. </br>
		 * Note that this method does not return the extension API directly, but a Promise that resolves to the extension API.
		 * Thus, a typical use of this method might look as follows: </br>
		 * <code>sap.ui.define(["sap/suite/ui/generic/template/extensionAPI/extensionAPI"], function(extensionAPI){</br>
		 *   ...</br>
		 *   extensionAPI.getExtensionAPIPromise(oView).then(function(oExtensionAPI){</br>
		 *     oExtensionAPI.someMethod();</br>
		 *   });</br>
		 *   ...</br>
		 * });</code>
		 *
		 * @param {sap.ui.core.Control} oControl a control which is embedded into a SAP Fiori elements view.
		 * @return {Promise} A <code>Promise</code> which resolves to the extension API for the embedding SAP Fiori elements view
		 * @public
		 */
		getExtensionAPIPromise: function(oControl) {
			return TemplateAssembler.getExtensionAPIPromise(oControl);
		},

		/**
		 * This method can be used to define specific controller extension(s) for a template which is used more than once within a SAP Fiori elements application.
		 * More precisely: In the manifest of a SAP Fiori elements application, you can register a controller extension.
		 * This controller extension is defined at <code>sap.ui5/extends/extensions/sap.ui.controllerExtensions/{template}</code>.
		 * This means that {template} identifies the template to be extended, e.g. <code>sap.suite.ui.generic.template.ObjectPage.view.Details</code> for the standard object page.
		 * Property <i>controllerName</i> of the manifest entry specifies the controller extension to be used.
		 * Even if the same template is used more than once, this single controller extension will be instantiated once for each page based on this template.
		 * As a consequence, the extension code for all these pages needs to be collected in one controller extension, which results in code that is difficult to maintain. </br>
		 * <code>registerControllerExtensions</code> provides a tool to distribute the extension code according to pages they are actually used on. </br>
		 * To use this tool, you should create separate classes implementing the logic for each single page. </br>
		 * All event handlers and formatters used in the view extensions of the corrsponding page should be defined as public instance methods of this class. The same applies to
		 * all extension functions that should be overridden by extension code.
		 * Each of these classes can contain an optional method <code>onInit(oController)</code>. </br>
		 * This method can be used to initialize the class as usual. Moreover, it is possible to store <code>oController</code> in a member variable. This variable can be used
		 * whenever standard controller functionality is needed (e.g. <code>oController.byId()</code> or <code>oController.extensionAPI</code>. </br>
		 * In the definition of the controller extension specified in the manifest, simply call <code>registerControllerExtensions</code>.
		 * @param sControllerExtensionName the name of the controller extension as specified in the manifest
		 * @param mEntitySetToImplementation a map. As a key, use the name of the entity set for which the (controller of the) page should be extended. As a value, use an
		 * instance of the corresponding class as described above.
		 * @public
		 */
		registerControllerExtensions: function(sControllerExtensionName, mEntitySetToImplementation){
			var oControllerDefinition = {
				onInit: function(){
					var sEntitySet = this.getOwnerComponent().getEntitySet();
					var oImplementation = mEntitySetToImplementation[sEntitySet];
					var fnInit = (oImplementation && oImplementation.onInit) || Function.prototype;
					fnInit.call(oImplementation, this);
				}
			};
			var mMethodNameToImplementations = Object.create(null);
			var sMethodName, mEntitySetToFunction;
			for (var sEntitySet in mEntitySetToImplementation){
				var oImplementation = mEntitySetToImplementation[sEntitySet];
				for (sMethodName in oImplementation){
					if (sMethodName !== "onInit" && sMethodName !== "getMetadata"){
						var fnFunction = oImplementation[sMethodName];
						if (typeof fnFunction === "function"){
							mEntitySetToFunction = mMethodNameToImplementations[sMethodName];
							if (!mEntitySetToFunction){
								mEntitySetToFunction = Object.create(null);
								mMethodNameToImplementations[sMethodName] = mEntitySetToFunction;
							}
							mEntitySetToFunction[sEntitySet] = fnFunction.bind(oImplementation);
						}
					}
				}
			}
			var fnCreateControllerMethod = function(sMethod){
				var mEntitySetToImpl = mMethodNameToImplementations[sMethod];
				return function(){
					var sEntitySetName = this.getOwnerComponent().getEntitySet();
					var fnImplementation = mEntitySetToImpl[sEntitySetName] || function(){
						oLogger.error("No implementation for function " + sMethod + " for entity set " + sEntitySetName);
					};
					return fnImplementation.apply(null, arguments);
				};
			};
			for (sMethodName in mMethodNameToImplementations){
				oControllerDefinition[sMethodName] = fnCreateControllerMethod(sMethodName);
			}
			sap.ui.controller(sControllerExtensionName, oControllerDefinition);
		}
	};
});
