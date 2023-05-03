/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

/**
 * Initialization Code and shared classes of library sap.ui.rta.
 */
sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/core/library",
	"sap/m/library",
	"sap/ui/fl/library",
	"sap/ui/dt/library"
],
function() {
	"use strict";

	/**
	 * SAPUI5 library with RTA controls.
	 *
	 * @namespace
	 * @alias sap.ui.rta
	 * @author SAP SE
	 * @version 1.108.8
	 * @since 1.50
	 * @private
	 * @experimental This class is experimental and provides only limited functionality. Also the API might be changed in future.
	 */
	var thisLib = sap.ui.getCore().initLibrary({
		name: "sap.ui.rta",
		version: "1.108.8",
		dependencies: ["sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.dt"],
		types: [],
		interfaces: [],
		controls: [],
		elements: []
	});

	thisLib.GENERATOR_NAME = "sap.ui.rta.command";

	return thisLib;
});