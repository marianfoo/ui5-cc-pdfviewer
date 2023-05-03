sap.ui.define(["sap/base/security/encodeXML",
	"sap/ui/model/odata/AnnotationHelper"
	], function (encodeXML, AnnotationHelperModel) {
	"use strict";

	/* Very specific case of formatters: Only put formatters here, that
	 * - are intended to run at runtime
	 * - need to know the control they are bound to (provided as this)
	 * 
	 * Currently, the only (correct) example is setRowNavigated: This formatter is called for each table line, and checks, whether this row
	 * is the one which should be marked as navigated (the latter information is kept in the _templPriv model and provided as parameter)
	 * 
	 * Another valid example would be setInfoHighlight, which is very similar, but currently still (inappropriatly) located in general AnnotationHelper
	 * 
	 * In general, formatters should be located
	 * - in (general or better use case specific) AnnotationHelper, if they are intended to be used at templating time (i.e. they depend only on information available at that time,
	 * 		like device, metaModel (incl. annotations), manifest (or more general, anything part of the parameter model) 
	 * - in controllerImplementation (formatters in return structure of getMethods), if they are intended to run at runtime (i.e. they depend on information only available and possibly
	 * 		changeable at runtime, like OData model, ui model, _templPriv model)
	*/	
	
	var oRuntimeFormatters = {

		/**
		* Return the value for the navigated property of the row. Works for both FCL and non-FCL apps.
		* @param {string} sBindingPath of the row that is used to navigate to OP or Sub-OP
		* @return {boolean} true/false to set/unset the property
		*/
		setRowNavigated: function(sBindingPath) {
            // In case of UI tables, get the parent 'row' aggregation before fetching the binding context
			var oContext = this.getBindingContext() || this.getParent().getBindingContext();
			var sPath = oContext && oContext.getPath();
			return !!sPath && (sPath === sBindingPath);
		},

		encodeHTML: function (HTMLString) {
			return encodeXML(HTMLString);
		}
	};

	return oRuntimeFormatters;
}, /* bExport= */ true);
