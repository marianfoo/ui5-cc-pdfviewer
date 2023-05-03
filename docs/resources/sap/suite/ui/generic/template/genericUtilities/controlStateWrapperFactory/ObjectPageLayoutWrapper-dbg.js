sap.ui.define([
], function() {
	"use strict";

    function ObjectPageLayoutWrapper(vTarget) {
        var oObjectPageLayout, oControlAssignedResolve, oPreliminaryState;
        var oControlAssignedPromise = new Promise(function(resolve) {
            oControlAssignedResolve = resolve;
        });

        if (typeof vTarget !== "string") {
            fnSetControl(vTarget);
        }

        // Returns the state of the ObjectPageLayout
        // Right now we only consider the pinned status of the ObjectPageLayout 
        function fnGetObjectPageLayoutState() {
            if (!oObjectPageLayout) {
                return oPreliminaryState;
            }

            var oControlState = {};
            oControlState.headerPinned = oObjectPageLayout.getHeaderContentPinned();
            return oControlState;
        }

        function fnSetObjectPageLayoutState(oState) {
            oPreliminaryState = oState;
            oControlAssignedPromise.then(function() {
                if (oPreliminaryState && oPreliminaryState.headerPinned) {
                    oObjectPageLayout.setHeaderContentPinned(true);
                } else {
                    oObjectPageLayout.setHeaderContentPinned(false);
                }
            });
        }

        function fnAttachStateChanged(fnHandler) {
            oControlAssignedPromise.then(function() {
                oObjectPageLayout.attachHeaderContentPinnedStateChange(fnHandler);
            });
        }

        function fnSetControl(oControl) {
            oObjectPageLayout = oControl;
            oControlAssignedResolve(oObjectPageLayout);
        }

        return {
            getState: fnGetObjectPageLayoutState,
            setState: fnSetObjectPageLayoutState,
            setControl: fnSetControl,
            attachStateChanged: fnAttachStateChanged
        };
    }

    return ObjectPageLayoutWrapper;
});