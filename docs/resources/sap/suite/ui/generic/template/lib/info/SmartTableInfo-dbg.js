sap.ui.define([
    "sap/base/util/isEmptyObject",
    "sap/suite/ui/generic/template/js/StableIdHelper",
    "sap/suite/ui/generic/template/js/AnnotationHelper",
    "sap/suite/ui/generic/template/lib/info/CommonInfo"
], function (isEmptyObject, StableIdHelper, AnnotationHelper, CommonInfo) {
    "use strict";

    // Class Definition for SmartTableInfo object
    function SmartTableInfo(oBlockSettings, oController, oTemplateUtils, oInfoObjectHandler) {
        var sId; // StableId of the control associated with this info object. Calculated first time fnGetId is called
        var oSmartTable; // Associated SmartTable control. Consumer could use setControl method to set the control to the info object
        var sSearchFieldId; // StableId of the search field associated to the smart table. Relevant only in case of OP. LR/ALP Search field is associated with SmartFilterBar
        var oControlStateWrapper; // State Wrapper is initialized by the info object even before control is assigned. Object manage state handling for the control
        
        var aHiddenColumnInfo = {
            staticHiddenColumns: [],
            columnKeyToHiddenPath: undefined
        };

        var oCommonInfo = new CommonInfo(["smartTable", "smartControl", "searchField", "smartTableWithColumnHide"], fnInitializeBasedOnControl);

        /*
        * SmartTable information object initialization code which is independent of
        * the control instance and could be done based on the oBlockSettings created
        * at the time of templateSpecificPreparationHelper. Some part of the initialization
        * is depend on the control initialization & it will be done as soon as the control
        * initialization promise is resolved
        */
        function fnInitialize() {
            oCommonInfo.pushCategory("smartTable", true);
            oCommonInfo.pushCategory("smartControl", true);

            oControlStateWrapper = oTemplateUtils.oCommonUtils.getControlStateWrapperById(fnGetId(), "SmartTable");
            oControlStateWrapper.attachStateChanged(function () {
                /*
                 * Avoid conflict caused by state change while applying a state is still running
                 * 
                 * Conflict caused by:
                 * - hiding table columns dynamically using deactivate columns (see applyHeaderContextToSmartTablesDynamicColumnHide) when OP is bound and header data available
                 * - this causes SmartTable to rebind (in some cases - probably when columns hidden before now are not hidden anymore)
                 * - workaround to take beforeRebindTable event as indicator for state change, as no specific event is provided when user changes personalization (see SmartTableWrapper)
                 * 	Update: In the meantime, specific event (UiStateChange) is provided and used, however, this event is also triggered when deactivating columns programmatically
                 * - subSection waiting for state being applied before restoring binding to avoid table using variant management to load data before correct variant is applied
                 * 
                 * Cannot be handled generically by state preserver 
                 * - state change could be caused by a different process (as here) or maybe by applying the state itself (no known example) - in those cases, postponing the state change after the 
                 * 	apply is finished would just store the resulting state, which is fine
                 * - but it could also be caused by the user interacting with a (stateful) control, before the original state has even been applied. In that case, postponing just the state change
                 * 	would let the apply override the users change, and later just store that state. To overcome that problem, the state of that control would have to be kept and reapplied after	the
                 * 	original apply process has finished (not implemented, as no known issues caused by that theoretical problem)
                 * 
                 * (For comparison, other conflicts that can be handled internally be statePreserver:
                 * - a second state change while still processing the first one: The last state change should win, intermediate steps only needed for the first one (including writing the generated app
                 * 	state key to the URL) can be skipped
                 * - a second apply state while still processing the first one: The last apply state should win, intermediate steps only needed for the first one (including applying the state on 
                 * 	controls) can be skipped
                 * - an apply state while a state change is still being processed (e.g. user has first changed a control, and then immediately opened a bookmark on the same page): The apply state 
                 * 	should win, no need to finish processing of state change. Exception: state change triggered programmatically (by extension API) to store specific information before a navigation
                 * 	to be used in case the user decides to navigate back later. For that case, a promise is provided to allow waiting for state change being fully applied before triggering the next
                 * 	step.) 
                 * )
                 */
                oTemplateUtils.initialStateAppliedPromise.then(oTemplateUtils.oComponentUtils.stateChanged);
            });
        }

        /**
         * Initialization code which has dependency with the control
         * @param {sap.ui.core.Control} oControl - Instance of the associated control
         */
        function fnInitializeBasedOnControl(oControl) {
            oSmartTable = oControl;

            // Initialization which needs the control to be created
            var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel(); // prepare metadata
            var oEntitySet = oMetaModel.getODataEntitySet(oSmartTable.getEntitySet());
            var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
            var aLineItems = oEntityType["com.sap.vocabularies.UI.v1.LineItem"];
            var aCustomData = oSmartTable.getCustomData();
            for (var i = 0; i < aCustomData.length; i++) {
                if (aCustomData[i].getKey() === "lineItemQualifier") {
                    aLineItems = oEntityType["com.sap.vocabularies.UI.v1.LineItem#" + aCustomData[i].getValue()];
                    break;
                }
            }

            // add information about hidden columns
            fnHandleSmartTableColumnHideAtInit(oMetaModel, oEntityType, aLineItems || []);

            // Assign the control to the StateWrapper
            oControlStateWrapper.setControl(oSmartTable);
        }

        /* 
        *  This method is called in the initialization phase of the specified SmartTable.
        *  It handles everything which can be done regarding hiding columns at this point in time.
        *  This is:
        *     - Check for columns which are hidden statically or dynamically
        *     - Immediately hide the columns which are statically hidden
        *       Note: This is actually a side effect of this function called implicitly via SmartTableInfoObject.
        *             Therefore, it is essential that SmartTableInfoObject is created during initialization. On the
        *			  controller init SusbSectionInfo needs to be created which would create internally 
        *			  SmartTableInfoObject wherever it is relevant
        *     - Add a columnHideInfos object to the specified info object. The columnHideInfos object
        *       contains information about the columns which are statically and which are dynamically hidden.
        *       In this case the category 'smartTableWithColumnHide' will be set for this info object. This will be used by
        *       oViewProxy.applyHeaderContextToSmartTablesDynamicColumnHide.
        *       Note: this is another side-effect of this function. 
        */
        function fnHandleSmartTableColumnHideAtInit(oMetaModel, oEntityType, aLineItems) {
            var aStaticHiddenColumns = []; // list of keys of columns that are always hidden
            var mColumnKeyToDynamicHiddenPath = Object.create(null); // map of column keys to pathes that determine whether the column is shown
            for (var i = 0; i < aLineItems.length; i++) {
                var oLineItem = aLineItems[i];
                fnAnalyzeColumnHideInfoForLineItem(aStaticHiddenColumns, mColumnKeyToDynamicHiddenPath, oMetaModel, oEntityType, oLineItem);
            }
            if (!isEmptyObject(mColumnKeyToDynamicHiddenPath) || aStaticHiddenColumns.length) { // if there is at least one column with hide info we store this analysis in the info object
                aHiddenColumnInfo.staticHiddenColumns = aStaticHiddenColumns;
                aHiddenColumnInfo.columnKeyToHiddenPath = mColumnKeyToDynamicHiddenPath;
                // Note: Should not use the commonInfo pushCategory method as it will not execute in case there 
                // were already executions which are added to pending execution queue
                oInfoObjectHandler.pushCategory(fnGetId(), "smartTableWithColumnHide"); 
            }
        }

        /*
        * Add the information derived from the UI:Hidden annotation for one line item to either 
        * aStaticHiddenColumns or mColumnKeyToDynamicHiddenPath, or none.
        */
        function fnAnalyzeColumnHideInfoForLineItem(aStaticHiddenColumns, mColumnKeyToDynamicHiddenPath, oMetaModel, oEntityType, oLineItem) {
            // regular expression for ?
            var rPath = /[A-Za-z].*[A-Za-z]/;

            var sColumnKey = AnnotationHelper.createP13NColumnKey(oLineItem);
            var vExpression = AnnotationHelper.getBindingForHiddenPath(oLineItem);
            if (vExpression === "{= !${} }") {
                aStaticHiddenColumns.push(sColumnKey);
            }
            if (typeof (vExpression) === "string") {
                var sPath = vExpression.match(rPath) && vExpression.match(rPath)[0];
                if (sPath && sPath.indexOf("/") > 0 && oEntityType.navigationProperty) {
                    var sParentEntitySet = oController.getOwnerComponent().getEntitySet();
                    var sColumnNavigationProperty = sPath.split("/", 1)[0];
                    // Check if column's navigation property and table's navigation property refers to same relationship between parent entity set and child entity set.
                    // If it is same, then add hidden path for column. Otherwise, ignore UI.Hidden
                    if (oTemplateUtils.oCommonUtils.checkInverseNavigation(sParentEntitySet, oSmartTable.getTableBindingPath(), oSmartTable.getEntitySet(), sColumnNavigationProperty)) {
                        mColumnKeyToDynamicHiddenPath[sColumnKey] = sPath.split("/").slice(1).join("/");
                    }
                }
            } else if (!vExpression) {
                aStaticHiddenColumns.push(sColumnKey);
            }
        }

       /*
        * Returns the globally unique id of the SmartChart control. As the info object
        * supports lazy initialization of the control, Id is calculated using BlockSettings 
        * object which is prepared by templateSpecificPreparationHelper
        */
        function fnGetId() {
            if (!sId) {
                var sLocalId = StableIdHelper.getStableId({ type: "ObjectPageTable", subType: "SmartTable", sFacet: oBlockSettings.additionalData.facetId });
                sId = oController.getView().createId(sLocalId);
            }
            return sId;
        }

        // prepare handling of erroneous rows
        function fnOnSaveWithError() {
            // Execute the filtering once the control is created
            oCommonInfo.getControlAsync().then(function() {
                var oDataStateIndicator = oSmartTable.getDataStateIndicator();
                var bIsFiltering = oDataStateIndicator.isFiltering();
                if (bIsFiltering) {
                    oDataStateIndicator.refresh();
                }
            });
        }

        function fnSearchFieldId() {
            if (!sSearchFieldId && fnIsSearchSupported()) {
                sSearchFieldId = oController.getView().createId(oBlockSettings.tableSettings.searchSettings.id);
            }
            return sSearchFieldId;
        }

        function fnIsSearchSupported() {
            return oBlockSettings.tableSettings.searchSettings && oBlockSettings.tableSettings.searchSettings.enabled;
        }

        function fnRebindTable() {
            oCommonInfo.getControlAsync().then(function() {
                oSmartTable.rebindTable();
                var oHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartTable);
                oHandler.refresh();
            });
        }

        fnInitialize();

        return {
            restrictedObject: {
                setControl: oCommonInfo.setControl,
                getControlAsync: oCommonInfo.getControlAsync,
                getId: fnGetId,
                getSearchFieldId: fnSearchFieldId,
                isSearchSupported: fnIsSearchSupported,
                onSaveWithError: fnOnSaveWithError,
                rebindTable: fnRebindTable,
                getControlStateWrapper: function() { return oControlStateWrapper; },
                getHiddenColumnInfo : function() { return aHiddenColumnInfo; }
            },
            getCategories: oCommonInfo.getCategories,
            pushCategory: function(sCategory) { return oCommonInfo.pushCategory(sCategory); },
            getSupportedCategories: oCommonInfo.getSupportedCategories,
            getPendingExecutions: oCommonInfo.getPendingExecutions,
            pushPendingExecutions: oCommonInfo.pushPendingExecutions
        };
    }

    return SmartTableInfo;
});