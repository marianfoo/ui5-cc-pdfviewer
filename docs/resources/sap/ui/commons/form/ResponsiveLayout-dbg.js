/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides control sap.ui.commons.form.ResponsiveLayout.
sap.ui.define([
 'sap/ui/commons/library',
 'sap/ui/layout/form/ResponsiveLayout',
 './ResponsiveLayoutRenderer'
],
	function(library, LayoutResponsiveLayout, ResponsiveLayoutRenderer) {
	"use strict";



	/**
	 * Constructor for a new form/ResponsiveLayout.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Renders a form with responsive layout. Internally the ResponsiveFlowLayout is used.
	 * @extends sap.ui.layout.form.ResponsiveLayout
	 *
	 * @author SAP SE
	 * @version 1.108.8
	 *
	 * @constructor
	 * @public
	 * @since 1.10.0
	 * @deprecated Since version 1.16.0.
	 * moved to sap.ui.layout library. Please use this one.
	 * @alias sap.ui.commons.form.ResponsiveLayout
	 */
	var ResponsiveLayout = LayoutResponsiveLayout.extend("sap.ui.commons.form.ResponsiveLayout", /** @lends sap.ui.commons.form.ResponsiveLayout.prototype */ { metadata : {

		deprecated : true,
		library : "sap.ui.commons"
	}});

	return ResponsiveLayout;

});
