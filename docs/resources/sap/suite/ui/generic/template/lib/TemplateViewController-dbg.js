sap.ui.define(["sap/ui/core/mvc/Controller"], function(mvcController) {
	"use strict";

	// Common superclass of all controllers for all templates. Actually, all common functionality is injected into the template controllers when they are assembled by class
	// TemplateAssembler. Therefore, this class serves as a pure marker class.
	return mvcController.extend("sap.suite.ui.generic.template.lib.TemplateViewController", {

		metadata: {
			library: "sap.suite.ui.generic.template"
		}
	});
}, /* bExport= */true);