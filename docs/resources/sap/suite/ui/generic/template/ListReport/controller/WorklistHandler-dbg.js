sap.ui.define(["sap/ui/base/Object", "sap/base/util/extend", "sap/suite/ui/generic/template/js/StableIdHelper"], function(BaseObject, extend, StableIdHelper) {
	"use strict";

	/*
	 * This helper class handles Worklist functionality in the List Report.
	 * this class is created in onInit of the ListReport controller.
	 *
	 * That controller forwards all tasks
	 * connected to the worklist feature to this instance.
	 * Worklist feature can be switched on through settings in the manifest.
	 *
	 */

	// oState is used as a channel to transfer data with the controller.
	// oController is the controller of the enclosing ListReport
	// oTemplateUtils are the template utils as passed to the controller implementation

	function getMethods(oState, oController, oTemplateUtils) {
		/*Worklist related functionality*/

		// this function performs search related functionality when worklist search is fired
		// this function rebinds worklist table sets the page variant to dirty when there is any change in searchfield
		function fnPerformWorklistSearch(oEvent) {
			var oPageVariant = oController.byId("template::PageVariant");
			if (oPageVariant) {
				if (oEvent && oEvent.getId() === "liveChange") {
					// set variant dirty for all cases when search string is applied except
					// when saved variant is applied
					oPageVariant.currentVariantSetModified(true);
				}
			}


			// currently, SFB is also created in worklist case (but whole header is hidden), thus, we can use SFB.search (as we do in all other cases)
			// if we should decide not to create a SFB (which would logically fit better), the correct logic probably would be to refresh the smartTable (i.e. using refresh on 
			// presentationControlHandler), not (like implemented here originally) calling rebind on the SmartTable.
			oState.oSmartFilterbar.search();

			// no need to trigger creation of iAppState here, as this anyway happens
			// - from search-event from SFB (all cases: startup, live change, explicit search, tab switch)
			// - from rebindTable as workaround in SmartTableWrapper (also all cases)
			// - from SearchFieldWrapper (in case of live change - this is also the only case, that really indicates a stateChange from worklist. tab switch is also a state change,
			//		but indicated from multiple views. In a worklist, all appStates should have suppressDataSelection = false, as always data should be shown. This should be ensured
			//		during startup when the first state is created.
		}

		function getSearchString(){
			// check needed for non-worklist case
			return oState.oWorklistData.oSearchField && oState.oWorklistData.oSearchField.getValue();
		}

		// initialization
		(function(){
			// could also be initialized from multipleViews - in that case don't override
			if (!oState.oWorklistData.oSearchField){
				oState.oWorklistData.oSearchField = oController.byId(StableIdHelper.getStableId({type: "ListReportAction", subType: "SearchField"}));
			}
		})();

		// public instance methods
		return {
			performWorklistSearch: fnPerformWorklistSearch,
			getSearchString: getSearchString

		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.WorklistHandler", {
		constructor: function(oState, oController, oTemplateUtils) {
			extend(this, getMethods(oState, oController, oTemplateUtils));
		}
	});
});