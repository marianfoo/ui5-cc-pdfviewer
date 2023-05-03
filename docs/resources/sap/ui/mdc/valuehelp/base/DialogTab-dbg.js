/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'sap/ui/core/Control'//,
	//'sap/ui/base/ManagedObjectObserver'
], function(
	Control//,
	//ManagedObjectObserver
) {
	"use strict";

	/**
	 * Constructor for a new <code>DialogTab</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Content for the <code>sap.ui.mdc.valuehelp.content.Dialog</code> element.
	 * @extends sap.ui.core.Control
	 * @version 1.108.8
	 * @constructor
	 * @abstract
	 * @private
	 * @ui5-restricted sap.ui.mdc
	 * @since 1.95.0
	 * @experimental As of version 1.95
	 * @alias sap.ui.mdc.valuehelp.base.DialogTab
	 */
	var DialogTab = Control.extend("sap.ui.mdc.valuehelp.base.DialogTab", /** @lends sap.ui.mdc.valuehelp.base.DialogTab.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * Content control
				 */
				content: {
					type: "object" // as a Control can officially not be a property
				}
			},
			// aggregations: {
			// },
			events: {
				/**
				 * Fired if the selected condition changed.
				 */
				 select: {
					parameters: {
						/**
						 * Type of the selection change (add, remove)
						 */
						type: { type: "sap.ui.mdc.enum.SelectType" },
						/**
						 * Changed conditions
						 *
						 * <b>Note:</b> A condition must have the structure of {@link sap.ui.mdc.condition.ConditionObject ConditionObject}.
						 */
						conditions: { type: "object[]" }
					}
				},
				/**
				 * Fired if a change on the content is confirmed
				 */
				 confirm: {
					parameters: {
						/**
						 * True if the value help need to be closed
						 */
						close: { type: "boolean" }
					}
				},
				/**
				 * Fired if the change is cancelled.
				 */
				cancel: {}
			}
		},
		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.class("sapUiMdcDialogTab");
				oRm.openEnd();
				var oContent = oControl.getContent();
				if (oContent) {
					oRm.renderControl(oContent);
				}
				oRm.close("div");
			}
		}
	});

	DialogTab.prototype.init = function() {

		Control.prototype.init.apply(this, arguments);

//		this._oObserver = new ManagedObjectObserver(_observeChanges.bind(this));
//
//		this._oObserver.observe(this, {
//			properties: ["content"]
//		});

	};

	DialogTab.prototype.exit = function () {
		if (this._displayContent) {
			this._displayContent = null;
		}

//		this._oObserver.disconnect();
//		this._oObserver = undefined;

		return Control.prototype.exit.apply(this, arguments);
	};

//	function _observeChanges(oChanges) {
//
//		if (oChanges.name === "content") {
//			if (oChanges.current) {
//				Promise.resolve(oChanges.current.getContent()).then(function (oResolvedContent) {
//					if (this._displayContent !== oResolvedContent) {
//						this._displayContent = oResolvedContent;
//						//this.invalidate(this);
//					}
//				}.bind(this));
//			} else {
//				this._displayContent = undefined;
//				this.invalidate(this);
//			}
//		}
//
//	}

	return DialogTab;

});
