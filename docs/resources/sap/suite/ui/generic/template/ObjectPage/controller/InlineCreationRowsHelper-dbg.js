
sap.ui.define([
    "sap/ui/base/Object",
    "sap/suite/ui/generic/template/genericUtilities/controlHelper",
    "sap/ui/dom/getFirstEditableInput",
    "sap/base/util/extend"
], function (BaseObject, controlHelper, getFirstEditableInput, extend) {
        "use strict";

        /**
         * This class handles the creation of multiple empty rows (inline creation rows) in the table. 
         * The empty rows are created when the table receives the data.
         * 
         * The code flow starts from "fnOnBeforeRebindControl" method. 
         * This method attaches listener for "dataReceived" event for the table.
         * 
         * --------------------
         * Pre-conditions
         * --------------------
         * In order to create empty rows, the following conditions should be met
         * 1. The application is draft enabled
         * 2. The table type should be either Responsive Table or Grid Table
         * 3. In the table's manifest setting, the value of "createMode" should be "creationRows"
         * 4. The object page should be in either "Create" or "Edit" mode
         * 
         * 
         * --------------------
         * Creation phase
         * --------------------
         * 1. The inline creation rows are created at
         *  a. The top of Responsive Table
         *  b. The bottom of Grid Table
         * 2. When the current inline creation row is edited, a new inline creation row will be created below the current one
         * 
         * --------------------
         * Post process
         * --------------------
         * This class also makes the following changes after inline creation rows are added to the table.
         * In both Responsive & Grid tables,
         *      a. Navigation & inline delete icons are hidden from the newly created inline creation rows (Row is in "inactive" state)
         *      b. Navigation & inline delete icons are restored when the the inline creation rows are edited (Row is in "transient" state)
         * In Responsive table,
         *      The "Create" button is hidden in the table toolbar
         * In Grid table,
         *      When the "Create" button in the toolbar is clicked, it scrolls down to the bottom of the table
         */

        function getMethods(oObjectPage, oTemplateUtils) {

            var BINDING_PATH_TRANSIENT_CONTEXT = "@$ui5.context.isTransient";

            var mTablesWithDataReceived;
            var oBindingSet;
            var mDefaultRowTypeByTableId = new Map(); 
            var bUIModelChangeEventPresent;
            var iInlineCreationRowCount = 2; //Hardcoding the count

            function fnOnBeforeRebindObjectPage(){
                //Refresh the cache
                mTablesWithDataReceived = new Map();
            }

            /***
             * Utility functions
             */
            function fnIsInlineCreationRowsEnabled (oSmartTable) {
                return oSmartTable.data("inlineCreationRows") === "true";
            }

            function fnIsCreationAllowed (oSmartTable) {
                return oSmartTable.data("isEntityCreatableUsingBooleanRestrictions") === "true" && 
                    oSmartTable.data("isEntityCreatableUsingPathRestrictions");
            }
            // Should be called by the outside in the onBeforeRebind event of any of the affected smart controls.
            function fnOnBeforeRebindControl (oEvent) {
                var oSmartTable = oEvent.getSource();
                var oBindingParams = oEvent.getParameters().bindingParams;
                var fnOldDataReceived = oBindingParams.events.dataReceived || Function.prototype;
                oBindingParams.events.dataReceived = function (onDataReceivedEvent) {
                    fnOldDataReceived.call(this, onDataReceivedEvent);
                    fnSmartTableDataReceived(oSmartTable);
                };
            }

            //Checks for the conditions to create inline creation rows
            function fnSmartTableDataReceived (oSmartTable) {
                var oUIModel = oObjectPage.getModel("ui");
                var oTable = oSmartTable.getTable();
                var bIsResponsiveOrGridTable = controlHelper.isMTable(oTable) || controlHelper.isUiTable(oTable);
                var bIsDraftEnabled = oTemplateUtils.oComponentUtils.isDraftEnabled();
                var bIsInlineCreateEnabled = fnIsInlineCreationRowsEnabled(oSmartTable);
                /**
				 * Create inline rows only when
				 * 1. The table type is either Responsive or Grid table AND
				 * 2. Draft is enabled AND
				 * 3. Inline creation row is enabled for the table
				 */
                if (bIsResponsiveOrGridTable && bIsDraftEnabled && bIsInlineCreateEnabled) {
                   fnHandleInlineCreationRows(oSmartTable, oUIModel);
                }

            }

            /**
             * If the page is in edit mode, this method fetches the default values for the smart table. 
             * Then, invokes the logic of creating inline creation rows
             */
            function fnHandleInlineCreationRows(oSmartTable, oUIModel) {
                mTablesWithDataReceived.set(oSmartTable.getId(), true);
                if (oUIModel.getProperty("/editable")) {
                    fnFetchDefaultValues(oSmartTable).then(function (oDefaultValues){
                        fnAddCreationRowsImpl(oSmartTable, oDefaultValues);
                    });
                }
                //Additionally, ensure the required registration of "onEditablePropertyChanged". See more there
                if (!bUIModelChangeEventPresent) {
                    oUIModel.bindProperty("/editable").attachChange(onEditablePropertyChanged.bind(null));
                    bUIModelChangeEventPresent = true;
                }
            }

            /**
             * This method is invoked when "editable" property of the UI model is changed.
             * When the page becomes editable, this method invokes the logic of creating inline rows
             * Note: This method is registered at the UI model once in function "fnHandleInlineCreationRows" 
             *  when that method is called at the first time
             */
            function onEditablePropertyChanged(oEvent) {
                if (oEvent.getSource().getValue()) { // called by the change of UI Model
                    mTablesWithDataReceived.forEach(function (bValue, sKey) {
                        if (bValue) {
                            var oControl = sap.ui.getCore().byId(sKey);
                            fnFetchDefaultValues(oControl).then(function (oDefaultValues){
                                fnAddCreationRowsImpl(oControl, oDefaultValues);
                            });
                        }
                    });
                }

            }

            /***
             * Invokes "createInactiveLineItem" method to create inline rows.
             * 
             * If the table is "Responsive Table", the inline rows are created at the beginning of the table. 
             * But for "Grid Table", rows are created at the end
             */
            function fnAddCreationRowsImpl(oSmartTable, oDefaultValues) {
                var oTable = oSmartTable.getTable();
                var bResponsiveTable = controlHelper.isMTable(oTable);
                var oItemsBinding = oTable.getBinding(bResponsiveTable ? "items" : "rows");
                // for grid table, all creations are at the end. only add creation rows when list binding's length is final
                var bIsLengthFinal = bResponsiveTable || oItemsBinding.isLengthFinal();
                var bIsCreationAllowed = fnIsCreationAllowed(oSmartTable);
                if (oItemsBinding.isFirstCreateAtEnd() === undefined && bIsLengthFinal && oItemsBinding.getContext() && bIsCreationAllowed) { // no inline creation rows have been added yet
                    var i;
                    for (i = 0; i < iInlineCreationRowCount; i++) {
                        // for responsive table, the very first creation is at the start and the following at the end
                        createInactiveLineItem(oItemsBinding, oDefaultValues, bResponsiveTable ? (i !== 0) : true);
                    }
                    
                    mTablesWithDataReceived.set(oSmartTable.getId(), false);
                }

                var fnAfterRenderCallback = fnUpdateTableRows.bind(null, oTable);
                fnInvokeCallbackAfterRendering(oTable, fnAfterRenderCallback);

                //Attaching "createActivate" event to items binding. 
                // So that when the inline creation rows are updated, a new inline row is getting created
                oBindingSet = oBindingSet || new Set();
                if (!oBindingSet.has(oItemsBinding)) {
                    fnAttachCreateActivateEventOnItemsBinding(oSmartTable, oItemsBinding);
                    oBindingSet.add(oItemsBinding);
                }
            }

            /**
             * This method creates a new inline creation row when the current inline row is updated.
             * The new row will be created below the current row
             */
            function fnAttachCreateActivateEventOnItemsBinding(oSmartTable, oItemsBinding) {
                oItemsBinding.attachCreateActivate(function () {
                    fnFetchDefaultValues(oSmartTable).then(function(oDefaultValues){
                        createInactiveLineItem(oItemsBinding, oDefaultValues, true);
                        fnUpdateTableRows(oSmartTable.getTable());
                    });
                }); 
            }

            /**
             * Actual implementation of creating inline rows.
             * It invokes the ODataListBinding#create method with the parameter "inactive" as true. 
             * 
             * @param {*} oItemsBinding Items binding of the table
             * @param {*} oDefaultValues Default values 
             * @param {*} bAtEnd Flag determines whether the new row should be added at the beginning or end
             */
            function createInactiveLineItem(oItemsBinding, oDefaultValues, bAtEnd) {                
				oItemsBinding.create(oDefaultValues, bAtEnd, { inactive: true });
            }

            /***
             * Fetches the default values for the table.
             * 
             * @param {*} oSmartTable Smart table 
             */
            function fnFetchDefaultValues (oSmartTable) {
                return new Promise(function (fnResolve) {
                    var oGetDefaultValuesPromise = oTemplateUtils.oServices.oCRUDManager.getDefaultValues(oSmartTable, null, true);

                    if (oGetDefaultValuesPromise instanceof Promise) {
                        oGetDefaultValuesPromise.then(function (aResponse){
                            var oDefaultValues = aResponse[0];
                            fnResolve(oDefaultValues);
                        }).catch(function(){
                            fnResolve(null);
                        });
                    } else {
                        fnResolve(null);
                    }
                });
            }

            
            /**
             * When the component is already rendered, immediately invokes the callback.
             * Otherwise, invokes the callback after the first render.
             * 
             * @param {sap.ui.core.Control} oControl Control to be rendered
             * @param {Function} fnCallback Callback function to be invoked after render
             */
            function fnInvokeCallbackAfterRendering (oControl, fnCallback) {
                var oEventDelegate;

                if (oControl.getDomRef()) {
                    fnCallback();
                } else {
                    oEventDelegate = oControl.addEventDelegate({
                        onAfterRendering: function () {
                            fnCallback();
                            oControl.removeEventDelegate(oEventDelegate);
                        }
                    });
                }
            }

            //Based on the table type, this method invokes the appropriate method to update table rows
            function fnUpdateTableRows(oTable) {
                if (controlHelper.isMTable(oTable)) {
                    fnUpdateResponsiveTableRows(oTable);
                }
            }

            /**
             * Filters out the transient rows which are not yet bounded with the "Context.isTransient" path.
             * And, invokes "fnHideInlineControlsOnTransientRow" for each rows
             * @param {sap.m.Table} oTable 
             */
            function fnUpdateResponsiveTableRows(oTable) {
                var sDefaultRowType,
                    sTableId = oTable.getId(),
                    aTransientRows = oTable.getItems().filter(function (oCurrentRow){
                        var bIsTransient = oCurrentRow.getBindingContext().isTransient();
                        var bIsCurrentRowAlreadyBound = oCurrentRow.getBinding("type") && oCurrentRow.getBinding("type").getPath() === BINDING_PATH_TRANSIENT_CONTEXT;
                        return bIsTransient && !bIsCurrentRowAlreadyBound;
                    });

                if (aTransientRows.length === 0) {
                    return;
                }    
                // Preserving the default row type into "mDefaultRowTypeByTableId".
                // sDefaultRowType is used by "fnHideInlineControlsOnTransientRow" to restore the row type when the row is peristed 
                if (mDefaultRowTypeByTableId.get(sTableId)) {
                    sDefaultRowType = mDefaultRowTypeByTableId.get(sTableId);
                } else {
                    sDefaultRowType = aTransientRows.at(0).getProperty("type");
                    mDefaultRowTypeByTableId.set(sTableId, sDefaultRowType);
                }

                aTransientRows.forEach(function(oCurrentRow){
                    var fnAfterRenderCallback = fnHideInlineControlsOnTransientRow.bind(null, oCurrentRow, sDefaultRowType);
                    fnInvokeCallbackAfterRendering(oCurrentRow, fnAfterRenderCallback);
                });
            }

            /**
             * This method binds the row type and the visibility of delete control with row's binding context
             * 1. When the binding context is transient ($context.isTransient = true)
             *  a. Row type becomes inactive. So that, the navigation icon is hidden
             *  b. Delete control becomes invisible
             * 2. When the binding context is persisted ($context.isTransient = false)
             *  a. Restores the List Type (i.e., restores the navigation icon)
             *  b. Restores the delete control
             * 3. When the transient row becomes draft row and the row is selected, enables the relevant toolbar buttons 
             * @param {sap.m.ColumnListItem} oTableRow Responsive table row
             * @param {sap.m.ListType} sDefaultRowType Default row type
             */
            function fnHideInlineControlsOnTransientRow (oTableRow, sDefaultRowType) {
                var oDeleteControl = oTableRow.getDeleteControl();

                oTableRow.bindProperty("type", {
                    path: BINDING_PATH_TRANSIENT_CONTEXT,
                    formatter: function (bIsTransient) {
                        return bIsTransient ? "Inactive" : sDefaultRowType;
                    }
                });
                oDeleteControl && oDeleteControl.bindProperty("visible", {
                    path: BINDING_PATH_TRANSIENT_CONTEXT,
                    formatter: function (bIsTransient) {
                        return !bIsTransient;
                    }
                });

                //The "created" method returns a promise and it's resolved when the transient row becomes a draft row
                var oConextCreationPromise = oTableRow.getBindingContext().created();
                oConextCreationPromise && oConextCreationPromise.then(function(){
                    //If the row is selected, enable the relevant toolbar buttons
                    oTableRow.isSelected() && oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oTableRow);
                });
            }

            //Accepts row context in Grid Table and returns the Grid table row
			function fnGetGridTableRowByContext (oContext, oTable) {
				var iFirstVisibleRowIndex = oTable.getFirstVisibleRow();
				var iVisibleRowCount = oTable.getVisibleRowCount();
				var sRowPath = oContext.getPath();
				for (var i = 0; i < iVisibleRowCount; i++) {
					if (oTable.getContextByIndex(iFirstVisibleRowIndex + i).getPath() === sRowPath) {
						return oTable.getRows()[i];
					}
				}
			}

            /***
			 * As part of inline-creation-rows feature, when the "Create" button is pressed on Grid Table
			 *  - The table should scroll down to display the last persisted record
			 *  - The first editable field in the first inactive record should be focused
             * 
             * @param {sap.ui.table.Table} oGridTable Grid Table
			 */
			function fnScrollToLastPersistedRecord (oGridTable) {
				var iRowCount = oGridTable.getBinding("rows").getLength(),
					aRowContexts = [],
					aIsContextInactive = [];

				for (var i = 0; i < iRowCount; i++) {
					var oCurrentRowContext = oGridTable.getContextByIndex(i);
					aRowContexts.push(oCurrentRowContext);
					aIsContextInactive.push(oCurrentRowContext.isInactive());
				}

				var iLastPersistedRowIndex = aIsContextInactive.lastIndexOf(false);
				var iFirstInactiveRowIndex = aIsContextInactive.indexOf(true);

				//Scrolls to the last persisted record
				if (iLastPersistedRowIndex !== -1) {
					oGridTable.setFirstVisibleRow(iLastPersistedRowIndex);
				}

				//Focuses the first editable field in the first inactive record
				if (iFirstInactiveRowIndex !== -1) {
					setTimeout(function () {
						var oContextOfFirstInactiveRow = aRowContexts[iFirstInactiveRowIndex];
						//Getting the table row from context
						var oTableRow = fnGetGridTableRowByContext(oContextOfFirstInactiveRow, oGridTable);
						//Find the first editable field
						var firstEditableInputElement = oTableRow && getFirstEditableInput(oTableRow.getDomRef());
						if (firstEditableInputElement) {
							firstEditableInputElement.focus();
						}
					}, 0);
				}
			}

            return {
                onBeforeRebindObjectPage: fnOnBeforeRebindObjectPage,
                addCreationRowsImpl: fnAddCreationRowsImpl,
                onBeforeRebindControl: fnOnBeforeRebindControl,
                isInlineCreationRowsEnabled: fnIsInlineCreationRowsEnabled,
                scrollToLastPersistedRecord: fnScrollToLastPersistedRecord
            };

        }

        return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.InlineCreationRowsHelper", {
            constructor: function (oObjectPage, oTemplateUtils) {
                extend(this, getMethods(oObjectPage, oTemplateUtils));
            }
        });
    });
