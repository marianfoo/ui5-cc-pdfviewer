/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"./Adaptation"
],
function(
	Adaptation
) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.rta.toolbar.FioriLike control
	 *
	 * @class
	 * Contains implementation of Fiori specific toolbar
	 * @extends sap.ui.rta.toolbar.Adaptation
	 *
	 * @author SAP SE
	 * @version 1.108.8
	 *
	 * @constructor
	 * @private
	 * @since 1.84
	 * @alias sap.ui.rta.toolbar.FioriLike
	 * @experimental Since 1.84. This class is experimental. API might be changed in future.
	 */
	var FioriLike = Adaptation.extend("sap.ui.rta.toolbar.FioriLike", {
		metadata: {
			library: "sap.ui.rta"
		},
		renderer: "sap.ui.rta.toolbar.AdaptationRenderer",
		type: "fiori"
	});

	return FioriLike;
});