sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/util/extend"
], function (BaseObject, extend) {
    "use strict";

    function getMethods(oController, oCommonUtils, oComponentUtils, oSmartChart) {
        // Immutable instance attributes
        var oInnerChart;
        oSmartChart.getChartAsync().then(function(oChart){
            oInnerChart = oChart;
        });

        function fnGetBinding() {
            return oInnerChart.getBinding('data');
        }

        function fnGetInnerChart() {
            return oInnerChart;
        }
        
        function fnGetBindingPath() {
            return oSmartChart.getChartBindingPath();
        }

        function fnGetItems() {
            /* TODO: This needs to be checked and if required then changed. Probably we need to call getItems of inner chart, but
               retrieving inner chart from SmartChart should be done asynchronously */
            return oSmartChart.getItems();
        }

        function fnGetSelectedContexts() {
            /* TODO: Current implementation of this method does not seem to work properly as it retrieves the
               inner chart (that is needed to get the selected contexts) only asynchroneously, but returns the result synchronously,
               thus the result is always empty. The way to get the selected contexts should be refactored. */
            var aSelectedContexts = [];
            oSmartChart.getChartAsync().then(function (oChart) {
                var oInnerChart = oChart;
                if (oInnerChart && oInnerChart.getMetadata().getName() === "sap.chart.Chart") {
                    var isContext = false;
                    var sSelectionBehavior = oInnerChart.getSelectionBehavior();
                    var mDataPoints = oCommonUtils.getSelectionPoints(oInnerChart, sSelectionBehavior);
                    if (mDataPoints && mDataPoints.count > 0) {
                        if (sSelectionBehavior === "DATAPOINT") {
                            isContext = true;
                        }
                        var aDataPoints = mDataPoints.dataPoints;
                        var paramList = [];
                        for (var i = 0; i < aDataPoints.length; i++) {
                            if (isContext) {
                                if (aDataPoints[i].context) {
                                    aSelectedContexts.push(aDataPoints[i].context);
                                }
                            } else {
                                //if context does not exist it is selection behavior category or series
                                paramList.push(aDataPoints[i].dimensions);
                            }
                        }
                        if (!isContext) {
                            aSelectedContexts[0] = paramList;
                        }
                    }
                }
            });

            return aSelectedContexts;
        }

		function fnGetModel() {
			return oSmartChart.getModel();
		}

        function fnSetEnabledToolbarButtons() {
			/* TODO: the only information retrieved from the control itself is the selected contexts, its model and the toolbar. For this, we already have methods in this 
			   class, so ideally, this information should be passed to a corresponding method in commonUtils, that would not need to know the presentationControl.
			   So, setEnabledToolbarButtons method in commonUtils should be refactored accordingly. */
            return oCommonUtils.setEnabledToolbarButtons(oSmartChart);
        }

        function fnSetEnabledFooterButtons() {
			/* TODO: the only information retrieved from the control itself is the selected contexts and the entity set. So ideally, this information should be passed to a 
			   corresponding method in commonUtils, that would not need to know the presentationControl. So, setEnabledFooterButtons method in commonUtils should be refactored
			   accordingly.*/
            return oCommonUtils.setEnabledFooterButtons(oSmartChart);
        }

		function fnSetCurrentVariantId(sVariantId) {
			oSmartChart.attachAfterVariantInitialise(function () {
				oSmartChart.setCurrentVariantId(sVariantId);
			});
			// incase the control variant is already initialized
			oSmartChart.setCurrentVariantId(sVariantId);
		}

        function fnRebind() {
            oSmartChart.rebindChart();
        }

        function isPropertyAvailableInEntityType(oSortOrder) {
            var oMetaModel = oSmartChart.getModel().getMetaModel();
            var oEntitySet = oMetaModel.getODataEntitySet(oSmartChart && oSmartChart.getEntitySet());
            var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
            var aEntityProperties = oEntityType.property;
            return aEntityProperties.some(function(oProperty) { return oProperty.name === oSortOrder.Property;});
        }

		function fnApplyNavigationSortOrder(aNavigationSortOrder) {
			var oUiState = oSmartChart.getUiState();
			var oPresentationVariant = oUiState.getPresentationVariant();
			var aValidSortOrder = aNavigationSortOrder.filter(function(oSortOrder) {
				return isPropertyAvailableInEntityType(oSortOrder);
			});
            var aMergedSorters = oPresentationVariant && oPresentationVariant.SortOrder ? aValidSortOrder.concat(oPresentationVariant.SortOrder) : aValidSortOrder;
            oPresentationVariant.SortOrder = aMergedSorters;
            oUiState.setPresentationVariant(oPresentationVariant);
			oSmartChart.setUiState(oUiState);
		}

        function getToolbar(){
			return oSmartChart.getToolbar();
		}
        // public instance methods
        return {
            getBinding: fnGetBinding,
            getBindingPath: fnGetBindingPath,
            getInnerChart: fnGetInnerChart,
            getItems: fnGetItems,
            getSelectedContexts: fnGetSelectedContexts,
            getCurrentContexts: Function.prototype,
            getVisibleProperties: Function.prototype,
			getBindingInfo: Function.prototype,
			getModel: fnGetModel,
            setEnabledToolbarButtons: fnSetEnabledToolbarButtons,
            setEnabledFooterButtons: fnSetEnabledFooterButtons,
            setCurrentVariantId: fnSetCurrentVariantId,
            setCurrentTableVariantId: Function.prototype,
            setCurrentChartVariantId: fnSetCurrentVariantId,
            refresh: Function.prototype,	// should have been ideally implemented but that isn't the case
            rebind: fnRebind,
            applyNavigationSortOrder: fnApplyNavigationSortOrder,
            getToolbar: getToolbar,
            scrollToSelectedItemAsPerChildContext: Function.prototype
        };
    }

    return BaseObject.extend("sap.suite.ui.generic.template.lib.presentationControl.SmartChartHandler", {
        constructor: function (oController, oCommonUtils, oComponentUtils, oSmartChart) {
            extend(this, getMethods(oController, oCommonUtils, oComponentUtils, oSmartChart));
        }
    });
});