/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"], function(FlexCommand) {
	"use strict";

	/**
	 * Create new container
	 *
	 * @class
	 * @extends sap.ui.rta.command.FlexCommand
	 * @author SAP SE
	 * @version 1.108.8
	 * @constructor
	 * @private
	 * @since 1.34
	 * @alias sap.ui.rta.command.CreateContainer
	 * @experimental Since 1.34. This class is experimental and provides only limited functionality. Also the API might be
	 *               changed in future.
	 */
	var CreateContainer = FlexCommand.extend("sap.ui.rta.command.CreateContainer", {
		metadata: {
			library: "sap.ui.rta",
			properties: {
				index: {
					type: "int",
					group: "content"
				},
				newControlId: {
					type: "string",
					group: "content"
				},
				label: { //legacy property => exposed in tests
					type: "string"
				},
				parentId: {
					type: "string",
					group: "content"
				}
			},
			associations: {},
			events: {}
		}
	});

	CreateContainer.prototype._getChangeSpecificData = function() {
		var mSpecificInfo = FlexCommand.prototype._getChangeSpecificData.apply(this);

		mSpecificInfo.newLabel = this.getLabel();

		return mSpecificInfo;
	};
	return CreateContainer;
});
