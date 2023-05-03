/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

/**
 * @namespace reserved for Smart Templates
 * @name sap.suite.ui.generic.template
 * @public
 */

/**
 * Initialization Code and shared classes of library sap.suite.ui.generic.template.
 */
sap.ui.define(['sap/ui/core/Core', 'sap/ui/core/library','sap/fe/placeholder/library'
], function(Core,library1,placeholderLibrary) {
	"use strict";

	/**
	 * Library with generic Suite UI templates.
	 *
	 * @namespace
	 * @alias sap.suite.ui.generic.template
	 * @public
	 */

	// library dependencies
	// delegate further initialization of this library to the Core
	var thisLib = Core.initLibrary({
		name: "sap.suite.ui.generic.template",
		dependencies: [
			"sap.ui.core",
			"sap.fe.placeholder"
		],
		types: [],
		interfaces: [],
		controls: [],
		elements: [],
		version: "1.108.9",
		extensions: {
			//Configuration used for rule loading of Support Assistant
			"sap.ui.support": {
				publicRules: true,
				internalRules: false,
				diagnosticPlugins: [
					"sap/suite/ui/generic/template/support/DiagnosticsTool/DiagnosticsTool"
				]
			}
		}
	});

	/**
	 * A static enumeration type which indicates the mode of targeted page while using navigateInternal extensionAPI
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	thisLib.displayMode = {
		
		/**
		 * Navigating with a mode which is not yet decided (fallback condition)
		 * @public
		 */
		undefined : "undefined",
		
		/**
		 * Navigating in read-only mode
		 * @public
		 */
		display : "display",

		/**
		 * Navigating in draft mode
		 * @public
		 */
		edit : "edit",

		/**
		 * Navigating in create mode
		 * @public
		 */
		create : "create"
	};

	return thisLib;

}, /* bExport= */false);
