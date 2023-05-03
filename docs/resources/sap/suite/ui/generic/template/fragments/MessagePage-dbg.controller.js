sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";
	
	// Controller of the EmptyPage view
	return Controller.extend("sap.suite.ui.generic.template.fragments.MessagePage", {
		navButtonPress: function() {
			window.history.back();
		}
	});
});