/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/rta/command/BaseCommand"
], function(
	BaseCommand
) {
	"use strict";

	/**
	 * Switch Comp Variant
	 *
	 * @class
	 * @extends sap.ui.rta.command.BaseCommand
	 * @author SAP SE
	 * @version 1.108.8
	 * @constructor
	 * @private
	 * @since 1.87
	 * @alias sap.ui.rta.command.compVariant.CompVariantSwitch
	 */
	var CompVariantSwitch = BaseCommand.extend("sap.ui.rta.command.compVariant.CompVariantSwitch", {
		metadata: {
			library: "sap.ui.rta",
			properties: {
				sourceVariantId: {
					type: "string"
				},
				targetVariantId: {
					type: "string"
				}
			}
		}
	});

	/**
	 * Triggers the configuration of a variant.
	 * @public
	 * @returns {Promise} Returns resolve after execution
	 */
	CompVariantSwitch.prototype.execute = function() {
		this.getElement().activateVariant(this.getTargetVariantId());
		return Promise.resolve();
	};

	/**
	 * Undo logic for the execution.
	 * @public
	 * @returns {Promise} Resolves after undo
	 */
	CompVariantSwitch.prototype.undo = function() {
		this.getElement().activateVariant(this.getSourceVariantId());
		return Promise.resolve();
	};

	return CompVariantSwitch;
});
