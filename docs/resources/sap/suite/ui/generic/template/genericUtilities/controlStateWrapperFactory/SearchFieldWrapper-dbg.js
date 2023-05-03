sap.ui.define([
], function() {
	"use strict";

	function SearchFieldWrapper(vTarget) {
		var oSearchField, oControlAssignedResolve, oPreliminaryState;
        var oControlAssignedPromise = new Promise(function(resolve) {
            oControlAssignedResolve = resolve;
        });

        if (typeof vTarget !== "string") {
            fnSetControl(vTarget);
        }

		function fnGetState() {
			if (!oSearchField) {
				return oPreliminaryState;
			}

			return {
				searchString: oSearchField.getValue()
			};
		}

		function fnSetState(oState) {
			oPreliminaryState = oState;
			oControlAssignedPromise.then(function() {
				oSearchField.setValue(oState.searchString);
				// original implementation also called fireSearch. Seems to be superfluous (would fire the search event, on which worklisthandler is registered and finally calls rebindTable
				// when restoring from an appState of a worklist, always data should be shown at time of saving the state and thus automatically search would be triggered again
				// oSearchField.fireSearch();
			});
		}

		function fnAttachStateChanged(fnHandler) {
			oControlAssignedPromise.then(function() {
				oSearchField.attachLiveChange(fnHandler);
			});
		}

		function fnSetControl(oControl) {
            oSearchField = oControl;
            oControlAssignedResolve(oSearchField);
        }

		return {
			getState: fnGetState,
			setState: fnSetState,
			setControl: fnSetControl,
			attachStateChanged: fnAttachStateChanged
		};
	}

	return SearchFieldWrapper;
});