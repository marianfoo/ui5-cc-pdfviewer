/*!
* OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
*/

sap.ui.require([
	"sap/ui/integration/editor/Editor",
	"sap/ui/integration/customElements/CustomElementBase"
], function (
	Editor,
	CustomElementBase
) {
	"use strict";

	/**
	 * Constructor for a new <code>CustomElementEditor</code>.
	 *
	 * @class
	 * @extends sap.ui.integration.customElements.CustomElementBase
	 * @alias sap.ui.integration.customElements.CustomElementEditor
	 * @private
	 */
	var CustomElementEditor = CustomElementBase.extend(Editor, {});
	CustomElementEditor.prototype.getCurrentSettings = function () {
		return this._getControl().getCurrentSettings();
	};
	CustomElementBase.define("ui-integration-editor", CustomElementEditor);
});
