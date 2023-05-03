/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/base/ManagedObject",
	"sap/ui/core/Fragment",
	"sap/ui/fl/Layer",
	"sap/ui/fl/write/api/ContextSharingAPI",
	"sap/ui/rta/Utils",
	"sap/ui/model/Binding"
], function (
	ManagedObject,
	Fragment,
	Layer,
	ContextSharingAPI,
	Utils,
	Binding
) {
	"use strict";

	/**
	 * Controller for the <code>sap.ui.rta.toolbar.contextBased.SaveAsContextBasedAdaptation</code> controls.
	 * Contains implementation of context-based-adaptation functionality.
	 *
	 * @class
	 *
	 * @author SAP SE
	 * @version 1.108.8
	 *
	 * @constructor
	 * @private
	 * @since 1.106
	 * @alias sap.ui.rta.toolbar.contextBased.SaveAsContextBasedAdaptation
	 */
	var SaveAsContextBasedAdaptation = ManagedObject.extend("sap.ui.rta.toolbar.contextBased.SaveAsContextBasedAdaptation", {
		metadata: {
			properties: {
				toolbar: {
					type: "any" // "sap.ui.rta.toolbar.Base"
				}
			}
		},
		constructor: function () {
			ManagedObject.prototype.constructor.apply(this, arguments);
			this.oTextResources = this.getToolbar().getTextResources();
		}
	});

	SaveAsContextBasedAdaptation.prototype.openAddAdaptationDialog = function (sLayer) {
		if (!this._oAddAdaptationDialogPromise) {
			this._oAddAdaptationDialogPromise = Fragment.load({
				name: "sap.ui.rta.toolbar.contextBased.SaveAsContextBasedAdaptationDialog",
				id: this.getToolbar().getId() + "_fragment--sapUiRta_addAdaptationDialog",
				controller: {
					onAdaptationTitleChange: _onAdaptationTitleChange.bind(this),
					onSaveAsContextBasedAdaptation: _onSaveAsContextBasedAdaptation.bind(this),
					onCancelContextBasedAdaptationDialog: _onCancelContextBasedAdaptationDialog.bind(this)
				}
			}).then(function (oDialog) {
				this._oAddAdaptationDialog = oDialog;
				this._oAddAdaptationDialog.attachBeforeClose(_clearComponent.bind(this));
				oDialog.addStyleClass(Utils.getRtaStyleClassName());
				this.getToolbar().addDependent(this._oAddAdaptationDialog);
			}.bind(this));
		} else {
			this.getToolbar().getControl("addAdaptationDialog--saveContextBasedAdaptation-title-input").setValue("");
		}
		return this._oAddAdaptationDialogPromise.then(function () {
			return createContextSharingComponent.call(this, sLayer);
		}.bind(this)).then(function () {
			this._oContextComponentInstance.showMessageStrip(false);
			return this._oAddAdaptationDialog.open();
		}.bind(this));
	};

	function _onAdaptationTitleChange(oEvent) {
		this.sAdaptationTitle = oEvent.getParameter("value");
		_enableSaveAsButton.call(this);
	}

	function _onCancelContextBasedAdaptationDialog() {
		this._oAddAdaptationDialog.close();
	}

	function _onSaveAsContextBasedAdaptation() {
		var oContextBasedAdaptation = {};
		oContextBasedAdaptation.title = getAdaptationTitle.call(this);
		oContextBasedAdaptation.contexts = this._oContextComponentInstance.getSelectedContexts();
		this.getToolbar().fireEvent("saveAsContextBasedAdaptation", oContextBasedAdaptation);
	}

	function createContextSharingComponent(sLayer) {
		var mPropertyBag = { layer: sLayer || Layer.CUSTOMER };
		return ContextSharingAPI.createComponent(mPropertyBag).then(function (oContextSharingComponent) {
			this._oContextComponent = oContextSharingComponent;
			this._oContextComponentInstance = oContextSharingComponent.getComponentInstance();
			this._oContextComponentInstance.resetSelectedContexts();
			this._oAddAdaptationDialog.addContent(this._oContextComponent);
			var oSelectedContextsModel = this._oContextComponentInstance.getSelectedContextsModel();
			this.oSelectedContextsBinding = new Binding(oSelectedContextsModel, "/", oSelectedContextsModel.getContext("/"));
			this.oSelectedContextsBinding.attachChange(_enableSaveAsButton.bind(this));
		}.bind(this));
	}

	function getAdaptationTitle() {
		return this.sAdaptationTitle || "";
	}

	function _enableSaveAsButton() {
		var bEnable = getAdaptationTitle.call(this).length > 0 && this._oContextComponentInstance.getSelectedContexts().role.length > 0;
		this.getToolbar().getControl("addAdaptationDialog--saveContextBasedAdaptation-saveButton").setEnabled(bEnable);
	}

	function _clearComponent() {
		if (this._oContextComponentInstance) {
			this._oContextComponentInstance.showMessageStrip(true);
			this._oContextComponentInstance.resetSelectedContexts();
		}
	}
	return SaveAsContextBasedAdaptation;
});