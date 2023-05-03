/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// Provides inactive support for controls
sap.ui.define([], function() {
    "use strict";
	/**
	 * Enumeration for uimode of SmartTemplates
	 * 
	 * The uimode describes the state of the UI in regards of the currently displayed
	 * object instance (e.g. a Sales Order, a Contact or a Purchasing Document)
	 * @readonly
	 * @enum {string}
	 */
	var UIMode = {
		//** The object instance has just been created */
		Create: "Create",
		//** The object instance is displayed read only
		Display: "Display",
		//** The object instance is open for editing
		Edit: "Edit"
	};

	return UIMode;
});