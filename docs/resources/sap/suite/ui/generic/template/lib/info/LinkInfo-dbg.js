sap.ui.define([
    "sap/suite/ui/generic/template/genericUtilities/FeLogger",
    "sap/suite/ui/generic/template/lib/info/CommonInfo"
], function (FeLogger, CommonInfo) {
    "use strict";

    // Class Definition for LinkInfo object
    function LinkInfo(oLinkSettings, oController, oTemplateUtils, oInfoObjectHandler) {
        var oCommonInfo = new CommonInfo(["breadCrumbLinks"]);
        oCommonInfo.pushCategory("breadCrumbLinks", true);

        function fnGetId() {
            return oLinkSettings ? oLinkSettings.id : "";
        }

        return {
            restrictedObject: {
                setControl: oCommonInfo.setControl,
                getControlAsync: oCommonInfo.getControlAsync,
                getId: fnGetId,
                navigate: oLinkSettings.navigate
            },
            getCategories: function() { return oCommonInfo.getCategories(); },
            pushCategory: function(sCategory) { return oCommonInfo.pushCategory(sCategory); },
            getSupportedCategories: function() { return oCommonInfo.getSupportedCategories(); },
            getPendingExecutions: function() { return oCommonInfo.getPendingExecutions(); },
            pushPendingExecutions: oCommonInfo.pushPendingExecutions
        };
    }

    return LinkInfo;
});