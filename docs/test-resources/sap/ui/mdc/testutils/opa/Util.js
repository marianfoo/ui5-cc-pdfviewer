/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/PropertyStrictEquals",
    "sap/ui/test/actions/Press"
], function(
	Opa5,
	PropertyStrictEquals,
	Press
) {
	"use strict";

	// Util.getTextFromResourceBundle = function(sLibraryName, sTextKey) {
	// 	var oCore = Opa5.getWindow().sap.ui.getCore();
	// 	return oCore.getLibraryResourceBundle(sLibraryName).getText(sTextKey);
	// };

	Opa5.createPageObjects({
		util: {
			actions: {
				iPressButton: function(sTitle){
					return this.waitFor({
						controlType: "sap.m.Button",
						matchers: [
							// new Ancestor(aVHDialogs[0], false),
							new PropertyStrictEquals({
								name: "text",
								value: sTitle
							})
						],
						actions: new Press()
				   });
				}

			}
		}
	});

});
