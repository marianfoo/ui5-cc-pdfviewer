/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"], function(FlexCommand) {
	"use strict";

	/**
	 * Remove a control/element
	 *
	 * @class
	 * @extends sap.ui.rta.command.FlexCommand
	 * @author SAP SE
	 * @version 1.108.8
	 * @constructor
	 * @private
	 * @since 1.42
	 * @alias sap.ui.rta.command.Remove
	 * @experimental Since 1.42. This class is experimental and provides only limited functionality. Also the API might be
	 *               changed in future.
	 */
	var Remove = FlexCommand.extend("sap.ui.rta.command.Remove", {
		metadata: {
			library: "sap.ui.rta",
			properties: {
				removedElement: {
					type: "any"
				}
			},
			associations: {},
			events: {}
		}
	});

	Remove.prototype._getChangeSpecificData = function() {
		var oElement = this.getRemovedElement() || this.getElement();

		var mSpecificInfo = {
			changeType: this.getChangeType(),
			removedElement: {
				id: oElement.getId()
			}
		};
		return mSpecificInfo;
	};

	return Remove;
});
