/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/fl/Change"
], function (
	Change
) {
	"use strict";

	/**
	 * Flexibility change class. Stores change content and related information.
	 * This class also be updated as well as reverted.
	 *
	 * @class sap.ui.fl.apply._internal.flexObjects.UpdatableChange
	 * @extends sap.ui.fl.Change
	 * @private
	 * @ui5-restricted
	 * @experimental Since 1.90.0
	 */
	var UpdatableChange = Change.extend("sap.ui.fl.apply._internal.flexObjects.UpdatableChange", /** @lends sap.ui.fl.apply._internal.flexObjects.UpdatableChange.prototype */ {
		metadata: {
			aggregations: {
				revertInfo: {
					type: "sap.ui.fl.apply._internal.flexObjects.RevertData",
					multiple: true,
					singularName: "revertInfo",
					defaultValue: []
				}
			}
		}
	});

	UpdatableChange.prototype.popLatestRevertInfo = function () {
		var oLatestRevertInfo = this.getRevertInfo().pop();
		this.removeRevertInfo(oLatestRevertInfo);
		return oLatestRevertInfo;
	};

	return UpdatableChange;
});
