sap.ui.define([
		"sap/ui/core/mvc/Controller"
	],
    function(Controller) {
		"use strict";
		var vfbController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterBarController", {
			init: function(oState) {
				this.oState = oState;

				var ownerComp = this.oState.oController.getOwnerComponent();

				this._filterBar = this.oState.alr_visualFilterBar;
				this._filterBar.setEntitySet(ownerComp.getEntitySet());
			}
		});
		return vfbController;
	}
);
