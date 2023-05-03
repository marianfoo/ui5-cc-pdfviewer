/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Core"
], function(FragmentController, Core) {
	"use strict";

	/**
	 * @class Visualization Fragment Control
	 * @extends sap.ui.core.mvc.Controller
	 * @alias sap.ui.integration.editor.fields.fragment.Controller
	 * @author SAP SE
	 * @since 1.105.0
	 * @version 1.108.8
	 * @private
	 * @experimental since 1.105.0
	 * @ui5-restricted
	 */
	var Controller = FragmentController.extend("sap.ui.integration.editor.fields.fragment.Controller", {});

	Controller.prototype.init = function () {
	};

	Controller.prototype.setField = function (oField) {
		this._oField = oField;
	};

	Controller.prototype.saveValue = function (sValue) {
		var sLanguage =  Core.getConfiguration().getLanguage().replaceAll('_', '-');
		var oConfig = this._oField.getConfiguration();
		if (oConfig.type === "string" && oConfig.translatable) {
			this._oField.setTranslationValueInTexts(sLanguage, oConfig.manifestpath, sValue);
		} else {
			this._oField._settingsModel.setProperty(oConfig.manifestpath, sValue);
		}
	};

	return Controller;
});