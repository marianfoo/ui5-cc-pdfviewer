sap.ui.define([
    "sap/suite/ui/generic/template/lib/info/CommonInfo"
], function(CommonInfo) {
	"use strict";

    // Class Definition for SmartChartInfo
	function SmartChartInfo(oBlockSettings, oController, oTemplateUtils, oInfoObjectHandler) {
        var sId; // StableId of the control associated with this info object. Calculated first time fnGetId is called
        var oSmartChart; // Associated SmartChart control. Consumer could use setControl method to set the control to the info object
        var oControlStateWrapper; // State Wrapper is initialized by the info object even before control is assigned. Object manage state handling for the control
        var oCommonInfo = new CommonInfo(["smartChart", "smartControl", "searchField"], fnInitializeBasedOnControl);

        /*
        * SmartChart information object initialization code which is independent of
        * the control instance and could be done based on the oBlockSettings created
        * at the time of templateSpecificPreparationHelper.
        */
        function fnInitialize() {
            oCommonInfo.pushCategory("smartChart", true);
            oCommonInfo.pushCategory("smartControl", true);
            
            oControlStateWrapper = oTemplateUtils.oCommonUtils.getControlStateWrapperById(fnGetId(), "SmartChart");
            oControlStateWrapper.attachStateChanged(function(){
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
            oSmartChart = oControl;
            oControlStateWrapper.setControl(oSmartChart);
         }

        /*
        * Returns the globally unique id of the SmartChart control. As the info object
        * supports lazy initialization of the control, Id is calculated using BlockSettings 
        * object which is prepared by templateSpecificPreparationHelper
        */
        function fnGetId() {
            if (!sId) {
                var sLocalId = oBlockSettings.additionalData.facetId + "::Chart";
                sId = oController.getView().createId(sLocalId);
            }
            return sId;
        }

        fnInitialize();

		return {
            restrictedObject: {
                setControl: oCommonInfo.setControl,
                getControlAsync: oCommonInfo.getControlAsync,
                getId: fnGetId,
                getControlStateWrapper: function() { return oControlStateWrapper; }
            },
            getCategories: oCommonInfo.getCategories,
            pushCategory: function(sCategory) { return oCommonInfo.pushCategory(sCategory); },
            getSupportedCategories: oCommonInfo.getSupportedCategories,
            getPendingExecutions: oCommonInfo.getPendingExecutions,
            pushPendingExecutions: oCommonInfo.pushPendingExecutions
		};
	}

	return SmartChartInfo;
});