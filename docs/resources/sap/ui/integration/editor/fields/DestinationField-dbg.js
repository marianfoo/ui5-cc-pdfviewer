/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/integration/editor/fields/BaseField",
	"sap/m/Select",
	"sap/ui/core/ListItem"

], function (
	BaseField, Select, ListItem
) {
	"use strict";

	/**
	 * @class
	 * @extends sap.ui.integration.editor.fields.BaseField
	 * @alias sap.ui.integration.editor.fields.DestinationField
	 * @author SAP SE
	 * @since 1.83.0
	 * @version 1.108.8
	 * @private
	 * @experimental since 1.83.0
	 * @ui5-restricted
	 */
	var DestinationField = BaseField.extend("sap.ui.integration.editor.fields.DestinationField", {
		metadata: {
			library: "sap.ui.integration"
		},
		renderer: BaseField.getMetadata().getRenderer()
	});

	DestinationField.prototype.initVisualization = function (oConfig) {
		var oVisualization = oConfig.visualization;
		if (!oVisualization) {
			oVisualization = {
				type: Select,
				settings: {
					busy: { path: 'currentSettings>_loading' },
					selectedKey: { path: 'currentSettings>value' },
					forceSelection: false,
					width: "100%",
					items: {
						path: "currentSettings>_values", template: new ListItem({
							text: "{currentSettings>name}",
							key: "{currentSettings>name}"
						})
					}
				}
			};
		}
		this._visualization = oVisualization;
	};

	return DestinationField;
});