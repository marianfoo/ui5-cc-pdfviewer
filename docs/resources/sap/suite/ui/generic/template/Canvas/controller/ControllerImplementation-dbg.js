sap.ui.define([
	"sap/ui/core/mvc/ControllerExtension",
	"sap/suite/ui/generic/template/detailTemplates/detailUtils",
	"sap/suite/ui/generic/template/Canvas/extensionAPI/ExtensionAPI",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/FeError"
], function(ControllerExtension, detailUtils, ExtensionAPI, extend, FeError) {
		"use strict";
	   var	sClassName = "Canvas.controller.ControllerImplementation";

		return {
			getMethods: function(oViewProxy, oTemplateUtils, oController) {

				var oBase = detailUtils.getControllerBase(oViewProxy, oTemplateUtils, oController);
				// Generation of Event Handlers
				var oControllerImplementation = {
					onInit: function() {
						var oComponent = oController.getOwnerComponent();
						var oRequiredControls = oComponent.getRequiredControls();
						oBase.onInit(oRequiredControls);
					},

					handlers: {

					},
					extensionAPI: new ExtensionAPI(oTemplateUtils, oController, oBase)
				};

				oControllerImplementation.handlers = extend(oBase.handlers, oControllerImplementation.handlers);
				oViewProxy.onComponentActivate = oBase.onComponentActivate;

				oControllerImplementation.getCurrentState = function() {
					var oRet = Object.create(null);
					// store state from adaptation extensions
					var bIsAllowed = true; // check for synchronous calls
					var fnSetExtensionStateData = function (oControllerExtension, oExtensionState) {
						if (!(oControllerExtension instanceof ControllerExtension)){
							throw new FeError(sClassName, "State must always be set with respect to a ControllerExtension");
						}
						if (!bIsAllowed){
							throw new FeError(sClassName, "State must always be provided synchronously");
						}
						var sExtensionId = oControllerExtension.getMetadata().getNamespace(); // extension is identified by its namespace
						if (oExtensionState) {
							for (var sExtensionKey in oExtensionState) {
								oRet["$extension$" + sExtensionId + "$" + sExtensionKey] = oExtensionState[sExtensionKey];
							}
						}
					};
					oController.templateBaseExtension.provideExtensionStateData(fnSetExtensionStateData);
					bIsAllowed = false;
					return oRet;
				};

				oControllerImplementation.applyState = function(oState, bIsSameAsLast) {
					var mExtensionState = Object.create(null);
					// apply state from adaptation extensions
					var bIsAllowed = true;
					var fnGetExtensionStateData = function (oControllerExtension) {
						if (!(oControllerExtension instanceof ControllerExtension)){
							throw new FeError(sClassName, "State must always be retrieved with respect to a ControllerExtension");
						}
						if (!bIsAllowed){
							throw new FeError(sClassName, "State must always be restored synchronously");
						}
						var sExtensionId = oControllerExtension.getMetadata().getNamespace(); // extension is identified by its namespace

						return mExtensionState[sExtensionId];
					};
					oController.templateBaseExtension.restoreExtensionStateData(fnGetExtensionStateData, bIsSameAsLast);
					bIsAllowed = false;
				};

				return oControllerImplementation;
			}
		};
	});
