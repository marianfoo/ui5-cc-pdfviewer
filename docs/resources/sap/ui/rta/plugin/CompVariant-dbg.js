/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/m/MessageBox",
	"sap/base/util/restricted/_omit",
	"sap/base/util/isEmptyObject",
	"sap/ui/dt/OverlayRegistry",
	"sap/ui/dt/Util",
	"sap/ui/rta/plugin/Plugin",
	"sap/ui/rta/plugin/RenameHandler",
	"sap/ui/rta/Utils",
	"sap/ui/fl/write/api/ContextSharingAPI"
], function(
	MessageBox,
	_omit,
	isEmptyObject,
	OverlayRegistry,
	DtUtil,
	Plugin,
	RenameHandler,
	Utils,
	ContextSharingAPI
) {
	"use strict";


	var CompVariant = Plugin.extend("sap.ui.rta.plugin.CompVariant", /** @lends sap.ui.rta.plugin.CompVariant.prototype */ {
		metadata: {
			library: "sap.ui.rta",
			properties: {
				// needed for rename
				oldValue: {
					type: "string"
				}
			}
		}
	});

	function createCommandAndFireEvent(oOverlay, sName, mProperties, oElement) {
		var oDesignTimeMetadata = oOverlay.getDesignTimeMetadata();
		var oTargetElement = oElement || oOverlay.getElement();

		return this.getCommandFactory().getCommandFor(oTargetElement, sName, mProperties, oDesignTimeMetadata)

		.then(function(oCommand) {
			this.fireElementModified({
				command: oCommand
			});
		}.bind(this))

		.catch(function(oMessage) {
			throw DtUtil.createError(sName, oMessage, "sap.ui.rta.plugin.CompVariant");
		});
	}

	function getAllVariants(oOverlay) {
		return oOverlay.getElement().getAllVariants();
	}

	// ------ rename ------
	function renameVariant(aOverlays) {
		this.startEdit(aOverlays[0]);
	}

	CompVariant.prototype.startEdit = function(oOverlay) {
		var vDomRef = oOverlay.getDesignTimeMetadata().getData().variantRenameDomRef;
		RenameHandler.startEdit.call(this, {
			overlay: oOverlay,
			domRef: vDomRef,
			pluginMethodName: "plugin.CompVariant.startEdit"
		});
	};

	CompVariant.prototype.stopEdit = function(bRestoreFocus) {
		RenameHandler._stopEdit.call(this, bRestoreFocus, "plugin.CompVariant.stopEdit");
	};

	CompVariant.prototype._emitLabelChangeEvent = function() {
		var oOverlay = this._oEditedOverlay;
		var sVariantId = oOverlay.getElement().getPresentVariantId();
		var sText = RenameHandler._getCurrentEditableFieldText.call(this);
		var mPropertyBag = {
			newVariantProperties: {}
		};
		mPropertyBag.newVariantProperties[sVariantId] = {
			name: sText
		};
		createCommandAndFireEvent.call(this, oOverlay, "compVariantUpdate", mPropertyBag);
	};

	// ------ configure ------
	function configureVariants(aOverlays) {
		var oVariantManagementControl = aOverlays[0].getElement();
		var mSettings = Object.assign({isComp: true}, this.getCommandFactory().getFlexSettings());
		var mPropertyBag = {
			layer: this.getCommandFactory().getFlexSettings().layer,
			contextSharingComponentContainer: ContextSharingAPI.createComponent(mSettings),
			rtaStyleClass: Utils.getRtaStyleClassName()
		};
		oVariantManagementControl.openManageViewsDialogForKeyUser(mPropertyBag, function(oData) {
			if (!isEmptyObject(oData)) {
				createCommandAndFireEvent.call(this, aOverlays[0], "compVariantUpdate", {
					newVariantProperties: _omit(oData, ["default"]),
					newDefaultVariantId: oData.default,
					oldDefaultVariantId: oVariantManagementControl.getDefaultVariantId()
				});
			}
		}.bind(this));
	}

	// ------ switch ------
	function isSwitchEnabled(aOverlays) {
		return getAllVariants(aOverlays[0]).length > 1;
	}

	function switchVariant(aOverlays, mPropertyBag) {
		var oVariantManagementControl = aOverlays[0].getElement();

		createCommandAndFireEvent.call(this, aOverlays[0], "compVariantSwitch", {
			targetVariantId: mPropertyBag.eventItem.getParameters().item.getProperty("key"),
			sourceVariantId: oVariantManagementControl.getPresentVariantId()
		});
	}

	// ------ save ------
	function saveVariant(aOverlays) {
		var oVariantManagementControl = aOverlays[0].getElement();
		oVariantManagementControl.getPresentVariantContent().then(function(oContent) {
			var oPropertyBag = {
				onlySave: true,
				newVariantProperties: {}
			};
			oPropertyBag.newVariantProperties[oVariantManagementControl.getPresentVariantId()] = {
				content: oContent
			};
			createCommandAndFireEvent.call(this, aOverlays[0], "compVariantUpdate", oPropertyBag);
		}.bind(this));
	}

	function isSaveEnabled(aOverlays) {
		return aOverlays[0].getElement().currentVariantGetModified();
	}

	// ------ save as ------
	function saveAsNewVariant(aOverlays, bImplicitSaveAs) {
		var oVariantManagementControl = aOverlays[0].getElement();
		var mSettings = Object.assign({isComp: true}, this.getCommandFactory().getFlexSettings());
		var oContextSharingComponentContainer = ContextSharingAPI.createComponent(mSettings);
		return new Promise(function(resolve) {
			oVariantManagementControl.openSaveAsDialogForKeyUser(Utils.getRtaStyleClassName(), function(oReturn) {
				if (oReturn) {
					createCommandAndFireEvent.call(this, aOverlays[0], "compVariantSaveAs", {
						newVariantProperties: {
							"default": oReturn.default,
							executeOnSelection: oReturn.executeOnSelection,
							content: oReturn.content,
							type: oReturn.type,
							text: oReturn.text,
							contexts: oReturn.contexts
						},
						previousDirtyFlag: oVariantManagementControl.getModified(),
						previousVariantId: oVariantManagementControl.getPresentVariantId(),
						previousDefault: oVariantManagementControl.getDefaultVariantId(),
						activateAfterUndo: !!bImplicitSaveAs
					});
				}
				resolve(oReturn);
			}.bind(this), oContextSharingComponentContainer);
		}.bind(this));
	}

	// ------ change content ------
	function onWarningClose(oVariantManagementControl, sVariantId, sAction) {
		var oLibraryBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.rta");
		if (sAction === oLibraryBundle.getText("BTN_CREATE_NEW_VIEW")) {
			saveAsNewVariant.call(this, [OverlayRegistry.getOverlay(oVariantManagementControl)], true)
			.then(function(oReturn) {
				// in case the user cancels the save as the original variant is applied again and the changes are gone
				if (!oReturn) {
					oVariantManagementControl.activateVariant(sVariantId);
				}
			});
		} else {
			oVariantManagementControl.activateVariant(sVariantId);
		}
	}

	function changeContent(aOverlays) {
		var oLibraryBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.rta");
		var oElementOverlay = aOverlays[0];
		var oControl = oElementOverlay.getElementInstance();
		var oAction = this.getAction(oElementOverlay);

		return oAction.handler(oControl, {styleClass: Utils.getRtaStyleClassName()}).then(function(aChangeContentData) {
			if (aChangeContentData && aChangeContentData.length) {
				var sPersistencyKey = aChangeContentData[0].changeSpecificData.content.persistencyKey;
				var oVariantManagementControl = oControl.getVariantManagement();
				var aVariants = oVariantManagementControl.getAllVariants();
				var oCurrentVariant = aVariants.find(function(oVariant) {
					return oVariant.getVariantId() === oVariantManagementControl.getPresentVariantId();
				});

				// a variant that can't be overwritten must never get dirty,
				// instead the user needs to save the changes to a new variant
				if (oCurrentVariant.isEditEnabled(this.getCommandFactory().getFlexSettings().layer)) {
					createCommandAndFireEvent.call(this, oElementOverlay, "compVariantContent", {
						variantId: aChangeContentData[0].changeSpecificData.content.key,
						newContent: aChangeContentData[0].changeSpecificData.content.content,
						persistencyKey: sPersistencyKey
					}, oControl.getVariantManagement());
				} else {
					MessageBox.warning(oLibraryBundle.getText("MSG_CHANGE_READONLY_VARIANT"), {
						onClose: onWarningClose.bind(this, oVariantManagementControl, oCurrentVariant.getVariantId()),
						actions: [oLibraryBundle.getText("BTN_CREATE_NEW_VIEW"), MessageBox.Action.CANCEL],
						emphasizedAction: oLibraryBundle.getText("BTN_CREATE_NEW_VIEW"),
						styleClass: Utils.getRtaStyleClassName()
					});
				}
			}
		}.bind(this));
	}

	CompVariant.prototype._isEditable = function(oOverlay) {
		return this.hasStableId(oOverlay) && !!this.getAction(oOverlay);
	};

	CompVariant.prototype.getMenuItems = function(aElementOverlays) {
		var oElementOverlay = aElementOverlays[0];
		var oVariantManagementControl = oElementOverlay.getElement();
		var aMenuItems = [];
		if (this.isAvailable([oElementOverlay])) {
			if (this.getAction(oElementOverlay).changeType === "variantContent") {
				aMenuItems.push({
					id: "CTX_COMP_VARIANT_CONTENT",
					text: this.getActionText(oElementOverlay, this.getAction(oElementOverlay)),
					handler: changeContent.bind(this),
					enabled: true,
					rank: 250,
					icon: "sap-icon://key-user-settings"
				});
			} else {
				var sLayer = this.getCommandFactory().getFlexSettings().layer;
				var oLibraryBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.rta");
				var aVariants = getAllVariants(oElementOverlay);
				var oCurrentVariant = aVariants.find(function(oVariant) {
					return oVariant.getVariantId() === oVariantManagementControl.getPresentVariantId();
				});

				if (oCurrentVariant.isRenameEnabled(sLayer)) {
					aMenuItems.push({
						id: "CTX_COMP_VARIANT_RENAME",
						text: oLibraryBundle.getText("CTX_RENAME"),
						handler: renameVariant.bind(this),
						enabled: true,
						rank: 210,
						icon: "sap-icon://edit"
					});
				}

				if (oCurrentVariant.isEditEnabled(sLayer)) {
					aMenuItems.push({
						id: "CTX_COMP_VARIANT_SAVE",
						text: oLibraryBundle.getText("CTX_VARIANT_SAVE"),
						handler: saveVariant.bind(this),
						enabled: isSaveEnabled,
						rank: 220,
						icon: "sap-icon://save"
					});
				}

				aMenuItems.push({
					id: "CTX_COMP_VARIANT_SAVE_AS",
					text: oLibraryBundle.getText("CTX_VARIANT_SAVEAS"),
					handler: saveAsNewVariant.bind(this),
					enabled: true,
					rank: 230,
					icon: "sap-icon://duplicate"
				});

				aMenuItems.push({
					id: "CTX_COMP_VARIANT_MANAGE",
					text: oLibraryBundle.getText("CTX_VARIANT_MANAGE"),
					handler: configureVariants.bind(this),
					enabled: true,
					rank: 240,
					icon: "sap-icon://action-settings"
				});

				var aSubmenuItems = aVariants.map(function(oVariant) {
					var bCurrentItem = oVariantManagementControl.getPresentVariantId() === oVariant.getVariantId();
					var oItem = {
						id: oVariant.getVariantId(),
						text: oVariant.getText("variantName"),
						icon: bCurrentItem ? "sap-icon://accept" : "blank",
						enabled: !bCurrentItem
					};
					return oItem;
				});

				aMenuItems.push({
					id: "CTX_COMP_VARIANT_SWITCH",
					text: oLibraryBundle.getText("CTX_VARIANT_SWITCH"),
					handler: switchVariant.bind(this),
					enabled: isSwitchEnabled,
					submenu: aSubmenuItems,
					rank: 250,
					icon: "sap-icon://switch-views"
				});
			}
		}

		return aMenuItems;
	};

	CompVariant.prototype.getActionName = function() {
		return "compVariant";
	};

	return CompVariant;
});