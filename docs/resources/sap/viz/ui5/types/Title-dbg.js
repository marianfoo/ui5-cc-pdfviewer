/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Title.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Title
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Title
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 * @alias sap.viz.ui5.types.Title
	 */
	var Title = BaseStructuredType.extend("sap.viz.ui5.types.Title", /** @lends sap.viz.ui5.types.Title.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set the visibility of the main title
			 */
			visible : {type : "boolean", defaultValue : false},

			/**
			 * Set the text of the main title
			 */
			text : {type : "string", defaultValue : null},

			/**
			 * Set the alignment of the main title
			 */
			alignment : {type : "sap.viz.ui5.types.Title_alignment", defaultValue : sap.viz.ui5.types.Title_alignment.center}
		},

		aggregations: {

			/**
			 * Settings for layout of title
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			layout : {type : "sap.viz.ui5.types.Title_layout", multiple : false, deprecated: true}
		}
	}});


	return Title;

});
