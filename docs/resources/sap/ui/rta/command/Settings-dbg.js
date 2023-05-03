/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"], function(FlexCommand) {
	"use strict";

	/**
	 * Basic implementation for the command pattern.
	 *
	 * @class
	 * @extends sap.ui.rta.command.FlexCommand
	 * @author SAP SE
	 * @version 1.108.8
	 * @constructor
	 * @private
	 * @since 1.44
	 * @alias sap.ui.rta.command.Settings
	 * @experimental Since 1.44. This class is experimental and provides only limited functionality. Also the API might be
	 *               changed in future.
	 */
	var Settings = FlexCommand.extend("sap.ui.rta.command.Settings", {
		metadata: {
			library: "sap.ui.rta",
			properties: {
				content: {
					type: "any",
					group: "content"
				}
			},
			associations: {},
			events: {}
		}
	});

	/**
	 * @override
	 */
	Settings.prototype.execute = function() {
		if (this.getElement()) {
			return FlexCommand.prototype.execute.apply(this, arguments);
		}
		return Promise.resolve();
	};

	/**
	 * @override
	 */
	Settings.prototype.undo = function() {
		if (this.getElement()) {
			return FlexCommand.prototype.undo.apply(this, arguments);
		}
		return Promise.resolve();
	};

	return Settings;
});
