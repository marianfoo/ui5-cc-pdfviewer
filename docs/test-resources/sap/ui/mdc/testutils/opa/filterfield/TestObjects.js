/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"./Actions",
	"./Assertions"
], function(
	Opa5,
	fieldActions,
	fieldAssertions
) {
	"use strict";

	/**
	 * @namespace onTheMDCFilterField
	 */
	Opa5.createPageObjects({
		onTheMDCFilterField: {
			actions: {
				/**
				 * OPA5 test action
				 * @memberof onTheMDCFilterField
				 * @method iEnterTextOnTheFilterField
				 * @param {string | Object} vIdentifier ID or a plain object providing properties identifying of the given <code>sap.ui.mdc.FilterField</code>
				 * @param {string} sValue Value that is entered in the <code>sap.ui.mdc.FilterField</code>
				 * @returns {Promise} OPA waitFor
				 */
				iEnterTextOnTheFilterField: function(vIdentifier, sValue) {
					return fieldActions.iEnterTextOnTheFilterField.call(this, vIdentifier, sValue);
				},
				/**
				 * OPA5 test action
				 * @memberof onTheMDCFilterField
				 * @method iPressKeyOnTheFilterField
				 * @param {string|object} vOptions Id or a plain object providing properties identifying the given <code>sap.ui.mdc.FilterField</code>
				 * @param {string} sValue Value of the key code that is pressed
				 * @returns {Promise} OPA waitFor
				 */
				 iPressKeyOnTheFilterField: function(vOptions, sValue) {
					return fieldActions.iPressKeyOnTheFilterField.apply(this, arguments);
				},
				/**
				 * OPA5 test action
				 * @memberof onTheMDCFilterField
				 * @method iOpenTheValueHelpForFilterField
				 * @param {Object | string} oFilterField ID or identifying properties of the <code>sap.ui.mdc.FilterField</code>
				 * @returns {Promise} OPA waitFor
				 * Opens the value help for a given <code>sap.ui.mdc.FilterField</code>.
				 */
				 iOpenTheValueHelpForFilterField: function(oFilterField) {
					return fieldActions.iOpenTheValueHelpForFilterField.call(this, oFilterField);
				}
			},
			assertions: {
				/**
				 * OPA5 test assertion
				 * @memberof onTheMDCFilterField
				 * @method iShouldSeeTheFilterField
				 * @param {string | Object} vIdentifier ID or a plain object providing properties identifying of the given <code>sap.ui.mdc.FilterField</code>
				 * @param {object} oValues Expected values
				 * @returns {Promise} OPA waitFor
				 */
				iShouldSeeTheFilterFieldWithValues: function(vIdentifier, oValues) {
					return fieldAssertions.iShouldSeeTheFilterField.call(this, vIdentifier, oValues);
				}
			}
		}
	});

});
