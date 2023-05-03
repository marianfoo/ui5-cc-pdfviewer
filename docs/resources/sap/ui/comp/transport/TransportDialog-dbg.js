/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.transport.TransportDialog.

sap.ui.define(["sap/ui/fl/transport/TransportDialog"], function(FlTransportDialog) {
	"use strict";

	/**
	 * Constructor for a new transport/TransportDialog.
	 *
	 * @class
	 * The Transport Dialog Control can be used to implement a value help for selecting an ABAP package and transport request. It is not a generic utility, but part of the VariantManagement and therefore cannot be used in any other application.
	 * @extends sap.ui.fl.transport.TransportDialog
	 *
	 * @constructor
	 * @public
	 * @deprecated
	 * @alias sap.ui.comp.transport.TransportDialog
	 */
	var TransportDialog = FlTransportDialog.extend("sap.ui.comp.transport.TransportDialog", {
		metadata: {
			library: "sap.ui.comp",
			deprecated: true
		},
		renderer: {
			apiVersion: 2
		}
	});

	return TransportDialog;
}, true);

