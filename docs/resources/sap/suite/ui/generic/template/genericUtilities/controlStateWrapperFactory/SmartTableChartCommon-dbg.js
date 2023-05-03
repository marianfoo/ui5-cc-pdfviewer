sap.ui.define([
], function () {
    "use strict";

    /**
     * Constructor for SmartTableChartCommon
     * ...
     * @param {object} mParams 
     * @param mParams.oCustomFiltersWrapper - wrapper for custom filters (from SFB point of view)
     *   (currently containing: generic (currently only editState), app extension, and adaptation extension - but this is knowledge of LR, i.e. of iAppStateHandler, not of SFB) 
     * @returns
     */

    // deals with state of SFB itself, without SVM (see SmartVariantManagementWrapper) and go-button 
    // (does not contain a state from SFB point of view - however, we remember whether it was pressed once
    // to restore data - this information is not considered being part of SFB)
    function SmartTableChartCommon(vTarget, oController, oFactory, sInitializationEvent) {
        var oSmartControl, oVariantManagementControl, bVariantManagementActive;
        var oControlAssignedResolve, oPreliminaryState, bSmartControlInitialized;
        var oSmartControlStateWrapper;
        var oVariantManagementStateWrapper;

        var oControlAssignedPromise = new Promise(function (resolve) {
            oControlAssignedResolve = resolve;
        });

        if (typeof vTarget !== "string") {
            fnSetControl(vTarget);
        }

        // creates a simple wrapper for a SmartTable or SmartChart (a control using UIState) (ignoring initialization and vm)
        function getControlWrapper(oControl) {
            var bIsApplying = false;		// avoid forwarding change event when caused by us applying a state
            function fnGetState() {
                var oUiState = oControl.getUiState(); // unfortunately not serializable, but a managed object
                return {
                    oUiState: {
                        oPresentationVariant: oUiState.getPresentationVariant(),
                        oSelectionVariant: oUiState.getSelectionVariant()
                    }
                };
            }

            function fnSetState(oState) {
                if (oState) {
                    if (!oState.oUiState) {
                        // Legacy handling for state without additional level oUiState (created with 1.99.0 - 1.99.3). Could be relevant on LR and OP, and independent of VM 
                        oState = {
                            oUiState: oState
                        };
                    }
                    bIsApplying = true;
                    // don't create UiState (managed object) from scratch, but fetch it from control and only apply known properties from state - thus, if any other properties would be added, we don't
                    // interfere with them
                    var oUiState = oControl.getUiState();
                    oUiState.setPresentationVariant(oState.oUiState.oPresentationVariant);
                    oUiState.setSelectionVariant(oState.oUiState.oSelectionVariant);
                    oControl.setUiState(oUiState);
                    bIsApplying = false;
                } else {
                    // set standard variant to overcome "implicit personalization" (esp. for OP when navigating to different object in discovery mode)
                    // todo: check interference with LR (assumption: no interference, should only be called when no vm - neither page nor control level)
                    oControl.setCurrentVariantId("");
                }
            }

            function fnAttachStateChanged(fnHandler) {
                oControl.attachUiStateChange(function () {
                    if (!bIsApplying) {
                        fnHandler();
                    }
                });
            }

            function fnGetLocalId() {
                return oController.getView().getLocalId(oControl.getId());
            }

            return {
                getState: fnGetState,
                setState: fnSetState,
                getLocalId: fnGetLocalId,
                bVMConnection: false,
                attachStateChanged: fnAttachStateChanged
            };
        }

        function fnGetState() {
            if (bSmartControlInitialized) {
                if (oVariantManagementStateWrapper) {
                    // oVariantManagementStateWrapper would be undefined only in cases SmartControl is not yet initialized 
                    // or VariantManagement is not enabled. 
                    return oVariantManagementStateWrapper.getState();
                }
                
                if (oSmartControlStateWrapper && !bVariantManagementActive) {
                    // VariantManagement is not turned on & SmartControlStateWrapper instance 
                    return oSmartControlStateWrapper.getState();
                }
            }
            
            // Control is not available and StateWrapper is not initialized 
            return oPreliminaryState;
        }

        function fnSetState(oState) {
            oPreliminaryState = oState;
            oControlAssignedPromise.then(function () {
                // map legacy states - before separating VM state from state of managed control, inner state information 
                // (presentation variant and selection variant) were put as oUiState on the same level as VM state 
                // information (variant id and dirty indicator), now they are contained in map managedControlStates
                if (oState && oState.oUiState && !oState.managedControlStates){
                    oState.managedControlStates = Object.create(null);
                    oState.managedControlStates[oSmartControlStateWrapper.getLocalId()] = {oUiState: oState.oUiState};
                    oState.modified = oState.bVariantModified;
                    oState.variantId = oState.sVariantId;
                }

                if (bVariantManagementActive) {
                    // In case VariantManagement is configured
                    oVariantManagementStateWrapper.setState(oPreliminaryState);
                    return;
                }

                // SmartTable/Chart shall be used 
                oSmartControlStateWrapper.setState(oPreliminaryState);
            });
        }

        function fnSetControl(oControl) {
            oSmartControl = oControl;
            oSmartControlStateWrapper = getControlWrapper(oSmartControl);
            if (!oSmartControl.isInitialised()) {
                // In case Smart Chart/Table is not yet initialized
                // listen to the initialize event & then resolve the control
                oSmartControl.attachEvent(sInitializationEvent, fnControlInitialized);
                return;
            }

            fnControlInitialized();
        }

        function fnControlInitialized() {
            bSmartControlInitialized = true;

            // deal with VM
            // 3 possibilties with respect to VM
            // a) no VM (relevant for this control) at all
            // b) control managed as part of page wide variant management
            // c) control creates own VM
            // In first two cases, we just need a wrapper for the control's state itself (which is either be used for appState directly or being passed to a VM wrapper from caller). In the third case
            // however, although the latter would also be possible, it would lead to recreating the same logic at several places (LR, ALP (as long as not unified), and OP, and for SmartTable and SmartChart
            // in each case) -thus, we better create and return a vm wrapper here, passing the inner wrapper (the same, we would create in the other cases).
            // Additionally, this simplifies the adaptation to the change of format (formerly, variant data and control data were mixed on same level)

            // to identify the situation, check properties smartVariant and useVariantManagement. (In LR/ALP, we could directly check component settings controlling these properties, but not 
            // in OP, as they could be different per section. Checking control's properties would also incorporate UI changes, however, these properties are anyway not allowed to be changed.)
            // values:	smartVariant	useVariantManagement
            // a)			null			false				on LR currently: truthy (id of VM) and true - but PageVM is not created, and thus being ignored => adapt how properties are set in xml
            // b)			truthy 			true				smartVariant = id of pageVM
            // c)			null			true
            if (!oSmartControl.getSmartVariant() && oSmartControl.getUseVariantManagement()) {
                oVariantManagementControl = oSmartControl.getVariantManagement();
                oSmartControlStateWrapper.bVMConnection = true;
                bVariantManagementActive = true;
                if (oVariantManagementControl) {
                    // VariantManagement is already initialized
                    oVariantManagementStateWrapper = oFactory.getControlStateWrapper(oVariantManagementControl, {
                        managedControlWrappers: [ oSmartControlStateWrapper ]
                    });
                    oControlAssignedResolve();
                } else {
                    // Resolve the ControlAssignedPromise only once the VariantManagement is
                    // also initialized
                    oSmartControl.attachAfterVariantInitialise(fnControlInitialized);
                }

                return;
            }
            // There is no VariantManagement configured for this SmartChart/SmartTable
            oControlAssignedResolve(oSmartControl);
        }

        function fnAttachStateChanged(fnHandler) {
            oControlAssignedPromise.then(function () {
                if (bVariantManagementActive) {
                    oVariantManagementStateWrapper.attachStateChanged(fnHandler);
                    return;
                }

                oSmartControlStateWrapper.attachStateChanged(fnHandler);

            });
        }

        return {
            getState: fnGetState,
            setState: fnSetState,
            setControl: fnSetControl,
            attachStateChanged: fnAttachStateChanged,
            bVMConnection: bVariantManagementActive
        };
    }

    return SmartTableChartCommon;
});