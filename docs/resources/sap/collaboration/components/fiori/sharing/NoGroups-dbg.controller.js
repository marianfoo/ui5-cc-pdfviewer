/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(["sap/ui/core/mvc/Controller"],
	function(Controller) {
	"use strict";

	sap.ui.controller("sap.collaboration.components.fiori.sharing.NoGroups", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * Initialize class variables
		 * memberOf NoGroups
		 */
		onInit: function() {
		},

		/**
		* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		* (NOT before the first rendering! onInit() is used for that one!).
		*/
		onBeforeRendering: function() {
		},

		/**
		* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		* This hook is the same one that SAPUI5 controls get after being rendered.
		*/
		onAfterRendering: function() {

		},

		/**
		* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		*/
		onExit: function() {
			this.getView().destroyContent();
		}

	});

});
