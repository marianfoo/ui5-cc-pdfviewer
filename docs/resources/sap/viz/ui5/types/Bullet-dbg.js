/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Bullet.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Bullet
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Bullet
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
	 * @alias sap.viz.ui5.types.Bullet
	 */
	var Bullet = BaseStructuredType.extend("sap.viz.ui5.types.Bullet", /** @lends sap.viz.ui5.types.Bullet.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set the orientation of the plot area.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			orientation : {type : "sap.viz.ui5.types.Bullet_orientation", defaultValue : sap.viz.ui5.types.Bullet_orientation.vertical, deprecated: true},

			/**
			 * Set the color palette for the chart.
			 */
			colorPalette : {type : "string[]", defaultValue : ['#2479BC','#d6d6d6','#EACF5E','#F9AD79','#D16A7C','#8873A2','#3A95B3','#B6D949','#FDD36C','#F47958','#A65084','#0063B1','#0DA841','#FCB71D','#F05620','#B22D6E','#3C368E','#8FB2CF','#95D4AB','#EAE98F','#F9BE92','#EC9A99','#BC98BD','#1EB7B2','#73C03C','#F48323','#EB271B','#D9B5CA','#AED1DA','#DFECB2','#FCDAB0','#F5BCB4']},

			/**
			 * Set the color palette for axis 1 in dual charts.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			primaryValuesColorPalette : {type : "string[]", defaultValue : ['#8FBADD','#B8D4E9','#7AAED6','#A3C7E3','#3D88C4','#66A1D0','#297CBE','#5295CA','#005BA3','#146FB7','#005395','#0063B1'], deprecated: true},

			/**
			 * Set the color palette for axis 2 in dual chart.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			secondaryValuesColorPalette : {type : "string[]", defaultValue : ['#F6A09B','#F9C3C0','#F58E88','#F8B1AD','#F05B52','#F37D76','#EE4A40','#F16C64','#D92419','#ED382D','#C52117','#EB271B'], deprecated: true},

			/**
			 * Set the drawing effect for the plot area. If this value is set to 'glossy', the plot area is glossy. If this value is set to 'normal', the plot area is matte.
			 */
			drawingEffect : {type : "sap.viz.ui5.types.Bullet_drawingEffect", defaultValue : sap.viz.ui5.types.Bullet_drawingEffect.normal},

			/**
			 * Set whether bars have rounded corners
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isRoundCorner : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set the color palette reference value color in bullet chart.
			 */
			referenceValuesColorPalette : {type : "string[]", defaultValue : ['#FCDCDA','#FEECDA','#DDF3E4']}
		},

		aggregations: {

			/**
			 * Settings for tooltip related properties
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			toolTip : {type : "sap.viz.ui5.types.Bullet_tooltip", multiple : false, deprecated: true}
		}
	}});


	return Bullet;

});
