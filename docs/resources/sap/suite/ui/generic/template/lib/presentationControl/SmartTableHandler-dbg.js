sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/util/extend",
    "sap/ui/dom/getFirstEditableInput",
    "sap/suite/ui/generic/template/genericUtilities/controlHelper",
    "sap/suite/ui/generic/template/genericUtilities/testableHelper"
], function(BaseObject, extend, getFirstEditableInput, controlHelper, testableHelper) {
    "use strict";
    
	function getMethods(oController, oCommonUtils, oComponentUtils, oSmartTable) {
        // Immutable instance attributes
        var oInnerTable = oSmartTable.getTable();
		var bIsMTable = controlHelper.isMTable(oInnerTable);
		var bIsUiTable = controlHelper.isUiTable(oInnerTable);
		var bIsTreeTable = controlHelper.isTreeTable(oInnerTable);
		var sEntryAggregationName = bIsUiTable ? "rows" : "items";
        
        function fnGetBinding() {
            return oInnerTable.getBinding(sEntryAggregationName);
        }

        function fnGetBindingPath() {
            return oSmartTable.getTableBindingPath();
        }

        function fnGetVisibleProperties() {
            return oInnerTable.getColumns();
		}

		function fnGetSelectedContexts() {
			var aSelectedContexts = [];

			if (bIsMTable) {
				aSelectedContexts = oInnerTable.getSelectedContexts();
			} else if (bIsUiTable) {
				var oSelectionPlugin = oInnerTable.getPlugins().filter(function (oPlugin) {
					return oPlugin.isA("sap.ui.table.plugins.SelectionPlugin");
				})[0];
				var aIndex = oSelectionPlugin ? oSelectionPlugin.getSelectedIndices() : oInnerTable.getSelectedIndices();
				if (aIndex) { //Check added as getSelectedIndices() doesn't return anything if rows are not loaded
					var oContext;
					for (var i = 0; i < aIndex.length; i++) {
						oContext = oInnerTable.getContextByIndex(aIndex[i]);
						if (oContext) { // edge case handling where sap.ui.table maintains selection for a row when last item in the table is deleted
							aSelectedContexts.push(oContext);
						}
					}
				}
			}
			return aSelectedContexts;
		}
		
        // This is done on basis of best effort. If no list binding is there currently a faulty value is returned. For special table types (TreeTable, Analytical table) the result
        // might be problematic (could be faulty or an array containing faulty entries).
        function getCurrentContexts(){
			var oListBinding = fnGetBinding();			
			if (!oListBinding){
				return null;
			}
			if (bIsTreeTable) { // special handling for Tree tables
				var iContextsLength = (oListBinding.getLength() > 0 ) ? oListBinding.getLength() : 0;
				var aRet = [];
				for (var index = 0; index < iContextsLength; index++) {
					var oContext = oListBinding.getContextByIndex(index);
					aRet.push(oContext);
				}
				return aRet;
			}
			// possibly a bug in the UI5 framework itself .. getCurrentContexts() for UITable only returns the contexts of selected rows in the table
			return bIsUiTable ? oListBinding.getContexts() : oListBinding.getCurrentContexts();
        }

		function fnGetModel() {
			return oSmartTable.getModel();
		}

		function getTemplateSortOrder() {
			var aSortOrder = [];
			var oTemplateSortOrder = oSmartTable.getCustomData().find(function (element) {
				return element.getKey() === "TemplateSortOrder";
			});
			var sTemplateSortOrder = oTemplateSortOrder && oTemplateSortOrder.getValue();
			if (sTemplateSortOrder) {
				sTemplateSortOrder.split(", ").forEach(function (oSort) {
					var aSort = oSort.split(" ");
					aSortOrder.push({
						Property: aSort[0],
						Descending: aSort.length > 1
					});
				});
			}
			return aSortOrder;
		}
        
        function fnGetItems() {
			return oInnerTable.getAggregation(sEntryAggregationName);
        }

		function fnSetEnabledToolbarButtons() {
			/* TODO: the only information retrieved from the control itself is the selected contexts, its model and the toolbar. For this, we already have methods in this 
			   class, so ideally, this information should be passed to a corresponding method in commonUtils, that would not need to know the presentationControl.
			   So, setEnabledToolbarButtons method in commonUtils should be refactored accordingly. */
			return oCommonUtils.setEnabledToolbarButtons(oSmartTable);
		}

		function fnSetEnabledFooterButtons() {
			/* TODO: the only information retrieved from the control itself is the selected contexts and the entity set. So ideally, this information should be passed to a 
			   corresponding method in commonUtils, that would not need to know the presentationControl. So, setEnabledFooterButtons method in commonUtils should be refactored
			   accordingly.*/
			return oCommonUtils.setEnabledFooterButtons(oSmartTable);
		}

		function fnSetCurrentVariantId(sVariantId) {
			oSmartTable.attachAfterVariantInitialise(function () {
				oSmartTable.setCurrentVariantId(sVariantId);
			});
			// incase the control variant is already initialized
			oSmartTable.setCurrentVariantId(sVariantId);
		}

		function fnGetBindingInfo() {
			return oInnerTable.getBindingInfo(sEntryAggregationName);
		}
		
		function fnHandleReceivedEvent(fnResolve, fnReject, oEvent){
			fnResolve(oEvent);
		}

		/* @param {string} sBatchGroupId - Batch GroupId Id is used to merge the batch request
		   @param {boolean} bNoMessageRefresh - can be used to surpress the refresh of the header messages in edit mode. Used in lazy loading.*/
		function fnRefresh(sBatchGroupId, bNoMessageRefresh) {
			var oBindingInfo = fnGetBindingInfo();
			if (oBindingInfo && oBindingInfo.binding) {
				return new Promise(function(fnResolve, fnReject){
					var fnDataReceived = function(oEvent){
						oBindingInfo.binding.detachDataReceived(fnDataReceived);
						fnHandleReceivedEvent(fnResolve, fnReject, oEvent);
					};
					oBindingInfo.binding.attachDataReceived(fnDataReceived);
					// Pass the BatchGroupId only if it is being supplied
					if (sBatchGroupId) {
						oBindingInfo.binding.refresh(sBatchGroupId);
					} else {
						oBindingInfo.binding.refresh();
					}
					if (!bNoMessageRefresh && oController.getView().getModel("ui").getProperty("/editable")) {
						oComponentUtils.messagesRefresh();
					}					
				});
			} else {
				return fnRebind();
			}
		}

        function fnRebind() {
			return new Promise(function(fnResolve, fnReject){
				var fnBeforeRebindTable = function(oEvent){
					oSmartTable.detachBeforeRebindTable(fnBeforeRebindTable);
					var oBindingParams = oEvent.getParameters().bindingParams;
					var fnDataReceived = oBindingParams.events.dataReceived || Function.prototype;
					var fnDataReceivedExtended = function(oReceivedEvent){
						fnDataReceived.call(this, oReceivedEvent);
						fnHandleReceivedEvent(fnResolve, fnReject, oReceivedEvent);
					};
					oBindingParams.events.dataReceived = fnDataReceivedExtended;
				};
				oSmartTable.attachBeforeRebindTable(fnBeforeRebindTable);
				oSmartTable.rebindTable();
			});
		}

		function fnApplyNavigationSortOrder(aNavigationSortOrders) {
            var oOwnerComponent = oController.getOwnerComponent();
            var oMetaModel = oOwnerComponent.getModel().getMetaModel();
            var aNonSortableProperties = [];
            var oSortRestrictions = oMetaModel.getODataEntitySet(oOwnerComponent.getEntitySet())["Org.OData.Capabilities.V1.SortRestrictions"];
            if (oSortRestrictions && oSortRestrictions.NonSortableProperties) {
                aNonSortableProperties = oSortRestrictions.NonSortableProperties.map(function(oProperty) {
                    return oProperty.PropertyPath;
                });
            }
            var aRelevantSortOrders = aNavigationSortOrders.filter(function(oProperty) {
                return !aNonSortableProperties.includes(oProperty.Property);
            });
            var oUiState = oSmartTable.getUiState();
            var oPresentationVariant = oUiState.getPresentationVariant();
            if (!oPresentationVariant.SortOrder) {
                oPresentationVariant.SortOrder = getTemplateSortOrder();
            }
            oPresentationVariant.SortOrder = oPresentationVariant.SortOrder.concat(aRelevantSortOrders);
            oUiState.setPresentationVariant(oPresentationVariant);
            oSmartTable.setUiState(oUiState);
        }

        function fnScrollToSelectedItemAsPerChildContext(sCurrentChildContext) {
            if (bIsMTable){ // currently only mTable is supported
                var iIndex = oInnerTable.getItems().findIndex(function(oItem) {
                    return oItem.getBindingContextPath() === sCurrentChildContext;
                });
                if (iIndex > -1) {
                    oInnerTable.scrollToIndex(iIndex);
                }
            }
        }
        
		//Accepts row context object and returns the index of Grid Table row
		function getGridTableRowIndexFromContext(oContext) {
			var sRowPath = oContext.getPath();
			var iRet = -2;
			for (var iRowIndex = 0; iRet === -2; iRowIndex++) {
				var oRowContext = oInnerTable.getContextByIndex(iRowIndex); //Get the row context for each row starting from first
				var sCurrentPath = oRowContext && oRowContext.getPath();
				if (sCurrentPath === sRowPath) { //Check to find the row that matches with new row context by comparing path
					iRet = iRowIndex; //Row found. No further iterations required
				} else if (!oRowContext) {
					iRet = -1; //Row not found. Return -1 to indicate
				}
			}
			return iRet;
		}

		//Accepts row context in Grid Table and returns the Grid table row
		function getGridTableRow(oContext) {
			var iFirstVisibleRowIndex = oInnerTable.getFirstVisibleRow();
			var iVisibleRowCount = oInnerTable.getVisibleRowCount();
			var sRowPath = oContext.getPath();
			for (var i = 0; i < iVisibleRowCount; i++) {
				if (oInnerTable.getContextByIndex(iFirstVisibleRowIndex + i).getPath() === sRowPath) {
					return oInnerTable.getRows()[i];
				}
			}
		}
		
		// Expose selected private functions to unit tests
		/* eslint-disable */
		testableHelper.testable(getGridTableRow, "getGridTableRow");
		testableHelper.testable(getGridTableRowIndexFromContext, "getGridTableRowIndexFromContext");
		/* eslint-enable */

		function setFocusOnFirstEditableFieldInTableRowImpl(oTableRow){
			var oFirstEditableInputDom = oTableRow && getFirstEditableInput(oTableRow.getDomRef());
			var oFirstEditableUI5Control = oFirstEditableInputDom && controlHelper.getUI5ControlForDomElement(oFirstEditableInputDom);
			controlHelper.focusUI5Control(oFirstEditableUI5Control);
		}
		
		function fnSetFocusOnFirstEditableFieldInTableRow(oContext){
			if (bIsMTable) {
				var aItems = oInnerTable.getItems(); //Get all the rows of table
				var oTableRow = aItems.find(function(oItem){
					return oContext.getPath() === oItem.getBindingContext().getPath();
				});
				if (oTableRow) {
					setTimeout(function () {
						setFocusOnFirstEditableFieldInTableRowImpl(oTableRow);
					}, 0);
				}
			} else {
				var iRowIndex = getGridTableRowIndexFromContext(oContext);
				if (iRowIndex !== -1) { //If row found
					oInnerTable.setFirstVisibleRow(iRowIndex); //Make the Table row visible. This does not ensure position of row in the visible view port
					//setTimeout being a macrotask ensures event has propagated at all levels and screen has rendered with changes
					setTimeout(function () {
						var oTableRow = getGridTableRow(oContext);
						setFocusOnFirstEditableFieldInTableRowImpl(oTableRow);
					}, 0);
				}
			}
		}   
        
        function getThreshold(){
			return bIsMTable ? oInnerTable.getGrowingThreshold() : oInnerTable.getThreshold();
        }
        
        function getDataStateIndicator(){
			return oSmartTable.getDataStateIndicator();
        }
        
        function isMTable(){
			return bIsMTable;
        }

		function getToolbar(){
			return oSmartTable.getToolbar();
		}
		// public instance methods
		return {
            getBinding: fnGetBinding,
            getBindingPath: fnGetBindingPath,
            getSelectedContexts: fnGetSelectedContexts,
            getCurrentContexts: getCurrentContexts,
            getVisibleProperties: fnGetVisibleProperties,
            getItems: fnGetItems,
			getBindingInfo: fnGetBindingInfo,
			getModel: fnGetModel,
            setEnabledToolbarButtons: fnSetEnabledToolbarButtons,
            setEnabledFooterButtons: fnSetEnabledFooterButtons,
            setCurrentVariantId: fnSetCurrentVariantId,
            setCurrentTableVariantId: fnSetCurrentVariantId,
            setCurrentChartVariantId: Function.prototype,
            refresh: fnRefresh,
            rebind: fnRebind,
            applyNavigationSortOrder: fnApplyNavigationSortOrder,
            scrollToSelectedItemAsPerChildContext: fnScrollToSelectedItemAsPerChildContext,
            setFocusOnFirstEditableFieldInTableRow: fnSetFocusOnFirstEditableFieldInTableRow,
            getThreshold: getThreshold,
            getDataStateIndicator: getDataStateIndicator,
			getToolbar: getToolbar,
            isMTable: isMTable // for temporary use only. Maybe removed in future.
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.presentationControl.SmartTableHandler", {
		constructor: function(oController, oCommonUtils, oComponentUtils, oSmartTable) {
			extend(this, getMethods(oController, oCommonUtils, oComponentUtils, oSmartTable));
		}
	});
});