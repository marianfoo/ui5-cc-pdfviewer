
/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/fl/requireAsync"
], function(
	requireAsync
) {
	"use strict";

	/**
	 * Loads and registers all descriptor change mergers for client-side merging.
	 *
	 * @namespace sap.ui.fl.apply._internal.changes.descriptor.Registration
	 * @experimental
	 * @since 1.74
	 * @version 1.108.8
	 * @private
	 * @ui5-restricted sap.ui.fl.apply._internal
	 */
	var Registration = {
		appdescr_ui5_addLibraries: requireAsync.bind(this, "sap/ui/fl/apply/_internal/changes/descriptor/ui5/AddLibrary"),
		appdescr_app_setTitle: requireAsync.bind(this, "sap/ui/fl/apply/_internal/changes/descriptor/app/SetTitle"),
		appdescr_ovp_changeCard: requireAsync.bind(this, "sap/ui/fl/apply/_internal/changes/descriptor/ovp/ChangeCard"),
		appdescr_ovp_addNewCard: requireAsync.bind(this, "sap/ui/fl/apply/_internal/changes/descriptor/ovp/AddNewCard"),
		appdescr_ovp_removeCard: requireAsync.bind(this, "sap/ui/fl/apply/_internal/changes/descriptor/ovp/DeleteCard"),
		appdescr_ui_generic_app_addNewObjectPage: requireAsync.bind(this, "sap/suite/ui/generic/template/manifestMerger/AddNewObjectPage"),
		appdescr_ui_generic_app_changePageConfiguration: requireAsync.bind(this, "sap/suite/ui/generic/template/manifestMerger/ChangePageConfiguration"),
		appdescr_fe_changePageConfiguration: requireAsync.bind(this, "sap/fe/core/manifestMerger/ChangePageConfiguration")
	};
	return Registration;
});