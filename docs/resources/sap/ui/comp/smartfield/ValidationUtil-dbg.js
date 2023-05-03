/*
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define("sap.ui.comp.smartfield.ValidationUtil", [
	"sap/ui/core/Core",
	"sap/ui/core/library",
	"sap/ui/comp/library",
	"sap/ui/core/message/Message",
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/ui/model/ValidateException"
], function(
	Core,
	CoreLibrary,
	CompLibrary,
	Message,
	ControlMessageProcessor,
	ValidateException
) {
	"use strict";

	var TextInEditModeSource = CompLibrary.smartfield.TextInEditModeSource;

	/**
	 * Creates a new instance.
	 *
	 * @param {sap.ui.comp.smartfield.SmartField} oSmartField control
	 * @author SAP SE
	 * @version 1.108.8
	 * @private
	 * @since 1.107.0
	 * @alias sap.ui.comp.smartfield.ValidationUtil
	 */
	var ValidationUtil = function(oSmartField) {
		this.oSmartField = oSmartField;
		this.oRB = Core.getLibraryResourceBundle("sap.ui.comp");
	};

	ValidationUtil.prototype._getPropertyName = function (oInput) {
		if (oInput.isA("sap.ui.comp.smartfield.ComboBox")) {
			return "enteredValue";
		} else if (oInput.isA("sap.m.ComboBox")) {
			return "selectedKey";
		} else {
			return "value";
		}
	};

	ValidationUtil.prototype._createMessage = function (sMessageID, oInput, sMessageType) {
		var sProperty = this._getPropertyName(oInput),
			oMessage;

		// Remove any old message
		this._removeMessage();

		oMessage = new Message({
			message: this.oRB.getText(sMessageID),
			type: sMessageType,
			target: oInput.getId() + "/" + sProperty,
			processor: this._getMessageProcessor()
		});

		this._oCurrentMessage = oMessage;
		Core.getMessageManager().addMessages(oMessage);
	};

	/**
	 * Remove previously created message
	 * @private
	 */
	ValidationUtil.prototype._removeMessage = function () {
		if (this._oCurrentMessage) {
			Core.getMessageManager().removeMessages(this._oCurrentMessage);
			this._oCurrentMessage.destroy();
			this._oCurrentMessage = null;
		}
	};

	/**
	 * Handles textInEditModeSource=ValueListWarning lifecycle
	 * @param {object} oResults oData result object
	 * @private
	 */
	ValidationUtil.prototype.handleValueListWarning = function (oResults) {
		var oInputField = this.oSmartField._oControl.edit;

		if (oInputField && this.oSmartField._isValueListWarning()) {

			if (oResults.length === 0) {
				this._createMessage("SMARTFIELD_NOT_FOUND", oInputField, CoreLibrary.MessageType.Warning);
			} else if (oResults.length > 1) {
				this._createMessage("SMARTFIELD_DUPLICATE_VALUES", oInputField, CoreLibrary.MessageType.Warning);
			} else {
				this._removeMessage();
			}

		}
	};

	/**
	 * Lazy instantiate and return the message processor
	 * @returns {sap.ui.core.message.ControlMessageProcessor} ControlMessageProcessor
	 * @private
	 */
	ValidationUtil.prototype._getMessageProcessor = function () {
		var oMessageProcessor;

		if (this._oMessageProcessor) {
			return this._oMessageProcessor;
		}

		// Create and register
		oMessageProcessor = new ControlMessageProcessor();
		Core.getMessageManager().registerMessageProcessor(oMessageProcessor);

		this._oMessageProcessor = oMessageProcessor;
		return this._oMessageProcessor;
	};

	ValidationUtil.prototype.handleComboValidation = function (oControl) {
		if (!this._isComboBoxValidationWarning()) {
			return;
		}

		if (oControl.getEnteredValue() && !oControl.getSelectedKey() && oControl.getValue() !== "") {
			this._createMessage("SMARTFIELD_NOT_FOUND", oControl, CoreLibrary.MessageType.Warning);
		} else {
			this._removeMessage();
		}
	};

	ValidationUtil.prototype.addValidationToType = function (oType) {
		var fnOriginalValidateValue;

		if (!oType || !this._isComboBoxValidationStrict()) {
			return; // Do not modify type
		}

		fnOriginalValidateValue = oType.validateValue;

		// Wrapper validation method
		oType.validateValue = function (sValue) {
			var oControl = this.oSmartField._oControl.edit;

			// Throw validation exception if no item is selected
			if (!oControl.getSelectedItem() && oControl.getValue()) {
				throw new ValidateException(this.oRB.getText("SMARTFIELD_NOT_FOUND"));
			}

			return fnOriginalValidateValue.apply(this, arguments);
		}.bind(this);
	};

	ValidationUtil.prototype._isLegacyMode = function () {
		var oSF = this.oSmartField;
		return oSF._isFixedValueList() && oSF.getFixedValueListValidationEnabled();
	};

	ValidationUtil.prototype._isComboBoxValidationStrict = function () {
		if (this._isLegacyMode()) {
			return false;
		}

		return this.oSmartField._getComputedTextInEditModeSource() === TextInEditModeSource.ValueList;
	};

	ValidationUtil.prototype._isComboBoxValidationWarning = function () {
		if (this._isLegacyMode()) {
			return false;
		}

		return this.oSmartField._isValueListWarning();
	};

	return ValidationUtil;

}, true);
