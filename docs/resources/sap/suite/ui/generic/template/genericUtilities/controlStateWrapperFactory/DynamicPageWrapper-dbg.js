sap.ui.define([
], function() {
	"use strict";

    function DynamicPageWrapper(vTarget) {
        var oDynamicPage;
        var oPreliminaryState;
        var oControlAssignedResolve;
        var oControlAssignedPromise = new Promise(function(resolve) {
            oControlAssignedResolve = resolve;
        });

        if (typeof vTarget !== "string") {
            fnSetControl(vTarget);
        }
        
        // Returns the state of the dynamic page
        // Right now we only consider the pinned status of the dynamic page header 
        function fnGetState() {
            if (oDynamicPage) {
                var oControlState = {};
                oControlState.headerPinned = oDynamicPage.getHeaderPinned();
                return oControlState;
            }

            return oPreliminaryState;
        }

        function fnSetState(oState) {
            // Store the state till the control is initialized
            oPreliminaryState = oState;
            oControlAssignedPromise.then(function() {
                if (oPreliminaryState && oPreliminaryState.headerPinned) {
                    // There is a possibility that the header is collapsed at this point. Make sure it is expanded if we know the header is to be pinned.
                    oDynamicPage.setHeaderExpanded(true);
                    oDynamicPage.setHeaderPinned(true);
                } else {
                    oDynamicPage.setHeaderPinned(false);
                }
            });
        }

        function fnAttachStateChanged(fnHandler) {
            oControlAssignedPromise.then(function() {
                oDynamicPage.attachPinnedStateChange(fnHandler);
            });
        }

        function fnSetControl(oControl) {
            oDynamicPage = oControl;
            oControlAssignedResolve(oDynamicPage);
        }

        function fnSetHeaderState(oController, bHeaderToBeExpanded) {
            oController.getOwnerComponent().getModel("_templPriv").setProperty("/listReport/isHeaderExpanded", bHeaderToBeExpanded);
        }

        return {
            getState: fnGetState,
            setState: fnSetState,
            setControl: fnSetControl,
            attachStateChanged: fnAttachStateChanged,
            setHeaderState: fnSetHeaderState
        };
    }

    return DynamicPageWrapper;
});