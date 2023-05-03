/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/core/UIComponent"
], function (UIComponent) {
	"use strict";

	return UIComponent.extend("sap.ui.rta.appContexts.Component", {

		metadata: {
			manifest: "json",
			library: "sap.ui.rta",
			properties: {
				layer: "string"
			}
		},

		/**
		 * Component is automatically initialized by UI5 at startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
		}
	});
});