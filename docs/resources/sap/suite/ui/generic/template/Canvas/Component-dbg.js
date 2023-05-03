sap.ui.define(["sap/suite/ui/generic/template/lib/TemplateAssembler",
	"sap/suite/ui/generic/template/lib/TemplateComponent", "sap/suite/ui/generic/template/detailTemplates/detailUtils",
	"sap/suite/ui/generic/template/Canvas/controller/ControllerImplementation",
	"sap/base/util/extend"
], function(TemplateAssembler, TemplateComponent, detailUtils, ControllerImplementation, extend) {
	"use strict";

	function getMethods(oComponent, oComponentUtils) {
		var oViewProxy = {};

		var oBase = detailUtils.getComponentBase(oComponent, oComponentUtils, oViewProxy);

		var oSpecific =  {
			oControllerSpecification: {
				getMethods: ControllerImplementation.getMethods.bind(null, oViewProxy),
				oControllerDefinition: {
				},
				oControllerExtensionDefinition: { // callbacks for controller extensions
					// allows extensions to store their specific state. Therefore, the implementing controller extension must call fnSetExtensionStateData(oControllerExtension, oExtensionState).
					// oControllerExtension must be the ControllerExtension instance for which the state should be stored. oExtensionState is the state to be stored.
					// Note that the call is ignored if oExtensionState is faulty
					// Note that the Lifecycle Object is the part of return from the function getCurrentState(where fnSetExtensionStateData is defined). Values for the Lifecycle Object parameters(Page, Permanent etc.) should be provided in extension implementation
					provideExtensionStateData: function(fnSetExtensionStateData){},
					// asks extensions to restore their state.
					// Therefore, the implementing controller extension can call fnGetExtensionStateData(oControllerExtension) in order to retrieve the state information which has been stored in the current state for this controller extension.
					// undefined will be returned by this function if no state or a faulty state was stored.
					restoreExtensionStateData: function(fnGetExtensionStateData){}
				}
			},
			oComponentData: { // data defined by component (i.e. not to be overridden by manifest
				templateName: "sap.suite.ui.generic.template.Canvas.view.Canvas"
			}
		};
		return extend(oBase, oSpecific);
	}

	return TemplateAssembler.getTemplateComponent(getMethods,
		"sap.suite.ui.generic.template.Canvas", {

			metadata: {
				library: "sap.suite.ui.generic.template",
				properties: {
					"requiredControls": "object"
				},
				// app descriptor format
				"manifest": "json"
			}
		});
});
