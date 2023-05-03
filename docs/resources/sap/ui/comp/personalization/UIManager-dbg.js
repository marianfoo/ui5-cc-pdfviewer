/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/mdc/p13n/UIManager",
	"sap/ui/base/Object"
], function (UIManagerBase, BaseObject) {
    "use strict";

    var COMPUIManager = UIManagerBase.extend("sap.ui.comp.personalization.UIManager", {
		constructor: function(oAdaptationProvider) {
			this.oAdaptationProvider = oAdaptationProvider;
			BaseObject.call(this);
		}
	});

	return COMPUIManager;

});
