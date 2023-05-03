/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/ui/dt/Plugin",
	"sap/ui/dt/Overlay",
	"sap/ui/dt/OverlayRegistry",
	// jQuery custom selectors ":focusable"
	"sap/ui/dom/jquery/Selectors"
], function(
	jQuery,
	Plugin,
	Overlay,
	OverlayRegistry
) {
	"use strict";

	/**
	 * Constructor for a new TabHandling.
	 *
	 * @param {string} [sId] id for the new object, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new object
	 * @class The TabHandling plugin adjusts the tabindex for the elements.
	 * @extends sap.ui.dt.Plugin
	 * @author SAP SE
	 * @version 1.108.8
	 * @constructor
	 * @private
	 * @since 1.38
	 * @alias sap.ui.dt.plugin.TabHandling
	 * @experimental Since 1.38. This class is experimental and provides only limited functionality. Also the API might be changed in future.
	 */
	var TabHandling = Plugin.extend("sap.ui.dt.plugin.TabHandling", /** @lends sap.ui.dt.plugin.TabHandling.prototype */ {
		metadata: {
			library: "sap.ui.dt",
			properties: {},
			associations: {},
			events: {}
		}
	});

	TabHandling.prototype.registerElementOverlay = function(oOverlay) {
		if (oOverlay.isRoot()) {
			this.removeTabIndex();
		}
	};

	/**
	 * Deregister an overlay
	 *
	 * @param {sap.ui.dt.Overlay} oOverlay overlay object
	 * @override
	 */
	TabHandling.prototype.deregisterElementOverlay = function(oOverlay) {
		if (oOverlay.isRoot()) {
			this.restoreTabIndex();
		}
	};

	TabHandling.prototype.setDesignTime = function(oDesignTime) {
		Plugin.prototype.setDesignTime.apply(this, arguments);
		if (oDesignTime) {
			if (!this._oMutationObserver) {
				this._oMutationObserver = Overlay.getMutationObserver();
				this._oMutationObserver.attachDomChanged(this._onDomChanged, this);
			}
		} else {
			if (this._oMutationObserver) {
				this._oMutationObserver.detachDomChanged(this._onDomChanged, this);
				delete this._oMutationObserver;
			}
			this.restoreTabIndex();
		}
	};

	/**
	 * Traverse the whole DOM tree and set tab indices to -1 for all elements
	 */
	TabHandling.prototype.removeTabIndex = function() {
		var aRootOverlays = this._getRootOverlays();
		aRootOverlays.forEach(function(oRootOverlay) {
			var $RootElement = oRootOverlay.getAssociatedDomRef();
			if ($RootElement) {
				$RootElement.find(":focusable:not([tabIndex=-1], #overlay-container *)").each(function(iIndex, oNode) {
					oNode.setAttribute("data-sap-ui-dt-tabindex", oNode.tabIndex);
					oNode.setAttribute("tabindex", -1);
				});
			}
		});
	};

	/**
	 * Traverse the whole DOM tree and set tab indices to -1 for all overlays
	 */
	TabHandling.prototype.removeOverlayTabIndex = function() {
		var aRootOverlays = this._getRootOverlays();
		aRootOverlays.forEach(function(oRootOverlay) {
			var $RootOverlay = jQuery(oRootOverlay.getDomRef());
			if ($RootOverlay) {
				$RootOverlay.find("[tabindex]:not([tabindex='-1']").each(function(iIndex, oNode) {
					oNode.setAttribute("data-sap-ui-overlay-tabindex", oNode.tabIndex);
					oNode.setAttribute("tabindex", -1);
				});
			}
		});
	};

	TabHandling.prototype._getRootOverlays = function() {
		var oDesignTime = this.getDesignTime();
		var aRootElements = oDesignTime.getRootElements();
		return aRootElements.map(function(oRootElement) {
			return OverlayRegistry.getOverlay(oRootElement);
		});
	};

	/**
	 * Restore the tab indices of all elements of the DOM tree
	 */
	TabHandling.prototype.restoreTabIndex = function() {
		jQuery("[data-sap-ui-dt-tabindex]").each(function(iIndex, oNode) {
			oNode.setAttribute("tabindex", oNode.getAttribute("data-sap-ui-dt-tabindex"));
			oNode.removeAttribute("data-sap-ui-dt-tabindex");
		});
	};

	/**
	 * Restore the tab indices of all Overlays of the DOM tree
	 */
	TabHandling.prototype.restoreOverlayTabIndex = function() {
		jQuery("[data-sap-ui-overlay-tabindex]").each(function(iIndex, oNode) {
			oNode.setAttribute("tabindex", oNode.getAttribute("data-sap-ui-overlay-tabindex"));
			oNode.removeAttribute("data-sap-ui-overlay-tabindex");
		});
	};

	/**
	 * @private
	 */
	TabHandling.prototype._onDomChanged = function() {
		if (this.getDesignTime().getEnabled()) {
			this.removeTabIndex();
		}
	};

	return TabHandling;
});
