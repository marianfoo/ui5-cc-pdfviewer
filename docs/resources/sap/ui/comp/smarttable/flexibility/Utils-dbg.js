/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

sap.ui.define([
    "sap/ui/fl/Utils",
    "sap/ui/core/util/reflection/JsControlTreeModifier"
], function (Utils, JsControlTreeModifier) {
	"use strict";

    /**
     * @namespace Utilities which are useful to interact with flexibility.
     * @name sap.ui.comp.smarttable.flexibility.Utils
     * @author SAP SE
     * @version 1.108.8
     * @private
     * @since 1.104.0
     */

	var SmartTableFlexUtils = {

        /**
         * Returns the application component the given control belongs to, if exists.
         */
        getAppComponentForControl : function(oControl) {
            return Utils.getAppComponentForControl(oControl);
        },

        /**
         * Computes the flexibility selector for the given control.
         */
        getSelectorForControl : function(oControl, oAppComponent) {
            if (!oAppComponent && !(oAppComponent === null)) {
                oAppComponent = SmartTableFlexUtils.getAppComponentForControl(oControl);
            }
            return JsControlTreeModifier.getSelector(oControl, oAppComponent);
        },

        /**
         * Flexibility serialize objects for changes. This function inverts this serialization to get back the object.
         */
        parseChangeContent : function(vValue, fnAfterParse) {
            if (typeof vValue === "string") {
                try {
                    vValue = vValue.replace(/(\\{)/g, "{").replace(/(\\})/g, "}");
                    vValue = JSON.parse(vValue);
                    if (fnAfterParse) {
                        fnAfterParse(vValue);
                    }
                } catch (e) {
                    // Invalid JSON
                    vValue = null;
                }
            }
            return vValue;
        }

	};

    return SmartTableFlexUtils;

});