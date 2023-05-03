/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"../util/PropertyHelper"
], function(
	PropertyHelperBase
) {
	"use strict";

	/**
	 * Constructor for a new p13n property helper for compatibility with sap.ui.comp.
	 *
	 * @param {object[]} aProperties
	 *     The properties to process in this helper
	 * @param {sap.ui.base.ManagedObject} [oParent]
	 *     A reference to an instance that will act as the parent of this helper
	 *
	 * @class
	 * @extends sap.ui.mdc.util.PropertyHelper
	 *
	 * @author SAP SE
	 * @version 1.108.8
	 *
	 * @private
	 * @experimental
	 * @since 1.85
	 * @alias sap.ui.mdc.p13n.PropertyHelper
	 */
	var PropertyHelper = PropertyHelperBase.extend("sap.ui.mdc.p13n.PropertyHelper", {
		constructor: function(aProperties, oParent) {
			// Because this helper does not validate, this is only required for setting defaults.
			PropertyHelperBase.call(this, aProperties, oParent, {
				filterable: true,
				sortable: true
			});
		}
	});

	/**
	 * This helper does not validate properties.
	 *
	 * @override
	 */
	PropertyHelper.prototype.validateProperties = function() {};

	PropertyHelper.prototype.prepareProperty = function(oProperty) {
		PropertyHelperBase.prototype.prepareProperty.apply(this, arguments);
		oProperty.label = oProperty.label || oProperty.name; // label is optional in comp, but required in mdc
	};

	return PropertyHelper;
});