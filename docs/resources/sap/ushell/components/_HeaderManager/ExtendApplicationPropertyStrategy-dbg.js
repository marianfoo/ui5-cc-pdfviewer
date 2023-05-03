// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/thirdparty/jquery"
], function (jQuery) {
    "use strict";

    function execute (currentValue, valueToAdjust) {
        if (!valueToAdjust) {
            valueToAdjust = {};
        }
        return jQuery.extend(true, {}, currentValue, valueToAdjust);
    }

    return {
        execute: execute
    };
});
