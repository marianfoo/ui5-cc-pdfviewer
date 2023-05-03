sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/util/extend"
], function (BaseObject, extend) {
    "use strict";

    function getMethods(oController, oCommonUtils, oComponentUtils, oSmartList) {
        function fnGetBinding() {
            return oSmartList.getList().getBinding("items");
        }

        function fnGetBindingInfo() {
            // items array contain toolbar and smart list controls
            return oSmartList.getAggregation("items")[1].getBindingInfo("items");
        }

        function fnGetItems() {
            return oSmartList.getItems();
        }

        function fnRefresh() {
            var oBindingInfo = fnGetBindingInfo();
            if (oBindingInfo && oBindingInfo.binding) {
                oBindingInfo.binding.refresh();
            }
        }

        function getCurrentContexts(){
			var oListBinding = fnGetBinding();
			return oListBinding && oListBinding.getCurrentContexts();
        }

        function getToolbar(){
			return oSmartList.getToolbar();
		}
        
		// public instance methods
		return {
            getBinding: fnGetBinding,
            getBindingPath: Function.prototype,
            getSelectedContexts: Function.prototype,
            getCurrentContexts: getCurrentContexts,
            getVisibleProperties: Function.prototype,
            getItems: fnGetItems,
            getBindingInfo: fnGetBindingInfo,
            getModel: Function.prototype,
            setEnabledToolbarButtons: Function.prototype,
            setEnabledFooterButtons: Function.prototype,
            setCurrentVariantId: Function.prototype,
            setCurrentTableVariantId: Function.prototype,
            setCurrentChartVariantId: Function.prototype,
            refresh: fnRefresh,
            rebind: Function.prototype,
            getToolbar: getToolbar,
            applyNavigationSortOrder: Function.prototype,  // no way to set the sort order in the smart list
            scrollToSelectedItemAsPerChildContext: Function.prototype
		};
	}

    return BaseObject.extend("sap.suite.ui.generic.template.lib.presentationControl.SmartListHandler", {
        constructor: function (oController, oCommonUtils, oComponentUtils, oSmartList) {
            extend(this, getMethods(oController, oCommonUtils, oComponentUtils, oSmartList));
        }
    });
});