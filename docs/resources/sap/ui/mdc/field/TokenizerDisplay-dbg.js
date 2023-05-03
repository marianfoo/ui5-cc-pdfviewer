/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'sap/m/Tokenizer',
	'sap/ui/mdc/field/TokenizerDisplayRenderer',
	'sap/ui/events/KeyCodes',
	'sap/m/library'
	], function(
		Tokenizer,
		TokenizerDisplayRenderer,
		KeyCodes,
		mLibrary
	) {
	"use strict";

	var EmptyIndicatorMode = mLibrary.EmptyIndicatorMode;

	/**
	 * Constructor for a new <code>TokenizerDisplay</code>.
	 *
	 * The <code>TokenizerDisplay</code> control enhances the {@link sap.m.Tokenizer Tokenizer} control to support diaply only tokens.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The <code>TokenizerDisplay</code> control is used to render a Tokenizer inside a control based on {@link sap.ui.mdc.field.FieldBase FieldBase}.
	 * @extends sap.m.Tokenizer
	 * @version 1.108.8
	 * @constructor
	 * @abstract
	 * @private
	 * @ui5-restricted sap.ui.mdc.field.TokenizerDisplay
	 * @since 1.99.0
	 * @alias sap.ui.mdc.field.TokenizerDisplay
	 */
	var TokenizerDisplay = Tokenizer.extend("sap.ui.mdc.field.TokenizerDisplay", /** @lends sap.ui.mdc.field.TokenizerDisplay.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {

				/**
				 * Specifies if an empty indicator should be displayed when there is no token.
				 */
				 emptyIndicatorMode: { type: "sap.m.EmptyIndicatorMode", group: "Appearance", defaultValue: EmptyIndicatorMode.Off }

			}
		},
		renderer: TokenizerDisplayRenderer
	});

	TokenizerDisplay.prototype.init = function() {
		Tokenizer.prototype.init.apply(this, arguments);

		this.allowTextSelection(true);
		this.addStyleClass("sapUiMdcTokenizerDisplay");
	};

	TokenizerDisplay.prototype.onkeydown = function(oEvent) {
		Tokenizer.prototype.onkeydown.call(this, oEvent);

		if (!this.getEnabled()) {
			return;
		}

		if (oEvent.which === KeyCodes.ENTER) {
			if (this.getHiddenTokensCount() > 0) {
				this._handleNMoreIndicatorPress();
			}
		}

	};

	TokenizerDisplay.prototype.getAccessibilityInfo = function () {
		// just concatenate token texts and return it as description
		var sText = this.getTokens().map(function (oToken) {
			return oToken.getText();
		}).join(" ");

		return { description: sText };
	};

	return TokenizerDisplay;

});
