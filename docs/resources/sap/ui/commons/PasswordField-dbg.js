/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides control sap.ui.commons.PasswordField.
sap.ui.define(['sap/ui/thirdparty/jquery', './TextField', './library', './PasswordFieldRenderer', 'sap/ui/Device'],
	function(jQuery, TextField, library, PasswordFieldRenderer, Device) {
	"use strict";



	/**
	 * Constructor for a new PasswordField.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * A text field with masked characters which borrows its properties and methods from TextField.
	 * @extends sap.ui.commons.TextField
	 *
	 * @author SAP SE
	 * @version 1.108.8
	 *
	 * @constructor
	 * @public
	 * @deprecated Since version 1.38. Instead, use the <code>sap.m.Input</code> control.
	 * @alias sap.ui.commons.PasswordField
	 */
	var PasswordField = TextField.extend("sap.ui.commons.PasswordField", /** @lends sap.ui.commons.PasswordField.prototype */ { metadata : {

		library : "sap.ui.commons",
		deprecated: true
	}});

	PasswordField.prototype.onfocusin = function(oEvent) {

		TextField.prototype.onfocusin.apply(this, arguments);

		if (!Device.support.input.placeholder && this.getPlaceholder()) {
			// if browser not supports placeholder on input tag, set the password type if focused
			jQuery(this.getInputDomRef()).attr("type", "password");
		}

	};

	PasswordField.prototype.onsapfocusleave = function(oEvent) {

		if (!Device.support.input.placeholder && this.getPlaceholder()) {
			// if browser not supports placeholder on input tag, remove the password type if placeholder is there and not focused
			var $Input = jQuery(this.getInputDomRef());
			if (!$Input.val()) {
				$Input.removeAttr("type");
			}
		}

		TextField.prototype.onsapfocusleave.apply(this, arguments);

	};

	return PasswordField;

});
