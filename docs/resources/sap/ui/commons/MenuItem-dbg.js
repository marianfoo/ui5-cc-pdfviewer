/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides control sap.ui.commons.MenuItem.
sap.ui.define(['./MenuItemBase', './library', 'sap/ui/unified/MenuItem'],
	function(MenuItemBase, library, UnifiedMenuItem) {
	"use strict";


	/**
	 * Constructor for a new MenuItem element.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Standard item to be used inside a menu. A menu item represents an action which can be selected by the user in the menu or
	 * it can provide a submenu to organize the actions hierarchically.
	 * @extends sap.ui.unified.MenuItem
	 *
	 * @author SAP SE
	 * @version 1.108.8
	 * @since 1.0.0
	 *
	 * @constructor
	 * @public
	 * @deprecated as of version 1.21.0, replaced by {@link sap.ui.unified.MenuItem}
	 * @alias sap.ui.commons.MenuItem
	 */
	var MenuItem = UnifiedMenuItem.extend("sap.ui.commons.MenuItem", /** @lends sap.ui.commons.MenuItem.prototype */ { metadata : {

		deprecated : true,
		library : "sap.ui.commons"
	}});

	/*Ensure MenuItemBase is loaded (incl. loading of unified library)*/

	return MenuItem;

});
