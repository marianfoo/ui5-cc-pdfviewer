sap.ui.define([
], function() {
	"use strict";

	/**
	 * Constructor for SmartVariantManagementWrapper
	 * @param {sap.ui.comp.smartvariants.SmartVariantManagement} vTarget - The SmartVariantManagement control 
	 * or the Id of control for which this wrapper is created
	 * @param {object} oController - the controller of the current component 
	 * @param {object} oFactory - the controlStateWrapperFactory
	 * @param {object} mParams 
	 * @param mParams.managedControlWrappers - array of controlStateWrappers for controls handled by the SVM 
	 * (currently also including SFB wrapper - to be removed) 
	 * @param mParams.dynamicPageWrapper - dynamicPageWrapper instance handled by SVM
	 * @returns
	 */
	
	function SmartVariantManagementWrapper(vTarget, oController, oFactory, mParams) {
		// Special handling of SmartFilterBarWrapper for several reasons:
		// - Suppress selection when restoring a variant. Selection is solely triggered according to information in appState. Otherwise, erroneous selection could be triggered in
		//		a few situations:
		//		- Variant marked as execute on select, but no data selected in appState (execute on select marked when saving variant without selecting, or changed after state was 
		//			stored)
		//		- Fallback to standard variant in case of dirty variant in state
		//		- Fallback to standard variant if variant cannot be read (logic of SVM)
		//	- Store and restore extension state (extension implemented in SFB instead of SVM, which would be more appropriate from architectural point of view)
		// flag to control whether we are currently in the process of applying a state to suppress the event to inform about a new state´
		// only needed when setting the variant itself - for managed controls, their wrappers should avoid firing the event themselves
		var oSmartVariantManagement, fnResolveControlAssigned, oPreliminaryState;
		var oControlAssignedPromise = new Promise(function (resolve) {
			fnResolveControlAssigned = resolve;
		});

		if (typeof vTarget !== "string") {
            fnSetControl(vTarget);
        }

		// Handles the state of the variant management itself (i.e. which variant is selected and whether it's dirty), including the state of the managed controls.
		// Is responsible esp. to restore this state with correct dependency resp. in correct order

		// Wrappers of managed controls need to be passed - getPersonalizableControls is not sufficient for two reasons:
		// - not available at this point in time, and no corresponding event to attach to available
		// - provides only those controls with directly connection to SVM implemented (i.e. with wrappers marked with bVMConnection)

		// ensure managed state wrappers do not trigger change event when applying state to them. 
		// Todo: rethink, whether this is the right place to do this (or rather when the wrappers get created)
		mParams.managedControlWrappers = mParams.managedControlWrappers.map(oFactory.getSuppressChangeEventWhenApplyingWrapper);

		// Any change of managed control should also mark variant as modified. However, this is not true for controls with direct connection to SVM (SFB, SmartTable, SmartChart). 
		// For these controls, a real user changes are already handled by the direct connection. On the other hand, these controls also fire their change events, if their state is
		// changed from SVM (by the same connection) - setting variant dirty here would be wrong.
		mParams.managedControlWrappers.forEach(function(oWrapper){
			if (!oWrapper.bVMConnection){
				oWrapper.attachStateChanged(function(){
					oSmartVariantManagement.currentVariantSetModified(true);
				});
			}
		});
		
		

		function fnSetControl(oControl) {
			oSmartVariantManagement = oControl;
			fnResolveControlAssigned(oSmartVariantManagement);
		}
		
		var oSmartFilterBarWrapper = mParams.managedControlWrappers.find(function(oWrapper){
			return oWrapper.setSVMWrapperCallbacks;
		});
		
		// provide callbacks needed for SFB wrapper to store/restore extnesion state with variant
		if (oSmartFilterBarWrapper){
			oSmartFilterBarWrapper.setSVMWrapperCallbacks({
				getManagedControlStates: function(){
					var mManagedControlStates = Object.create(null);
					mParams.managedControlWrappers.forEach(function(oWrapper){
						if (!oWrapper.bVMConnection){
							mManagedControlStates[oWrapper.getLocalId()] = oWrapper.getState();
						}
					});
					return mManagedControlStates;
				},
				setManagedControlStates: function(oState){
					mParams.managedControlWrappers.forEach(function(oWrapper){
						if (!oWrapper.bVMConnection){
							oWrapper.setState(oState[oWrapper.getLocalId()]);
						}
					});
				},
				setHeaderState: function(bHeaderToBeExpanded) {
					mParams.dynamicPageWrapper.setHeaderState(oController, bHeaderToBeExpanded);
				}
			});
		}

		// Wrapper is intended to set a state to the ui, but not to trigger a selection (which should happen only after all (relevant) parts of ui state is set to the correct state
		// are set correct. Therefore, setting variant from here should never trigger a selection. 
		function fnSetVariant(sVariantId){
			if (oSmartFilterBarWrapper){
				oSmartFilterBarWrapper.suppressSelection(true);
			}
			oSmartVariantManagement.setCurrentVariantId(sVariantId);
			if (oSmartFilterBarWrapper){
				oSmartFilterBarWrapper.suppressSelection(false);
			}
		}

		// Restore state of all managed controls 
		function fnSetManagedControlStates(oState){
			// Usually, looping through mParams.managedControlWrappers or through oState.managedControlStates should be equivalent, but in exceptional cases, their might be 
			// differences, if application has changed (changing the controls managed by the SVM - in LR, this could be achieved by changing setting SmartVariantManagement). 
			// mParams.managedControlWrappers reflects current state, while oState.managedControlStates reflects state at the time iAppState was written
			// - when adding a control (in LR changing setting SmartVariantManagement from false to true), state for that control would not be contained  - calling the wrapper with
			//		undefined to ensure initial state
			// - when removing a control, state would be contained that should not be applied here 
			mParams.managedControlWrappers.forEach(function(oWrapper){
				oWrapper.setState(oState.managedControlStates[oWrapper.getLocalId()]);
			});
		}

		function getState() {
			if (!oSmartVariantManagement) {
				return oPreliminaryState;
			}

			var mManagedControlStates = Object.create(null);
			mParams.managedControlWrappers.forEach(function(oWrapper){
				mManagedControlStates[oWrapper.getLocalId()] = oWrapper.getState();
			});
			return {
				variantId : oSmartVariantManagement.getCurrentVariantId(),
				modified : oSmartVariantManagement.currentVariantGetModified(),
				managedControlStates: mManagedControlStates
			};
		}

		function setState(oState) {
			oPreliminaryState = oState;
			oControlAssignedPromise.then(function() {
				if (!oPreliminaryState) {
					// if no state is provided set default variant (not modified)
					// use cases:
					// - LR: if appStateKey in the URL that cannot be read
					// - OP: if switching to different object instance (in discovery mode always, in persistency mode when page was not shown)
					fnSetVariant(oSmartVariantManagement.getDefaultVariantId());
					return;
				}
				if (oPreliminaryState.modified) {
					// Special logic according to UX: If variant was modified anyway, there's no benefit for the user to see the name (but it could be confusing), so standard variant (not default!) should be
					// set (which is achieved by empty string)
					fnSetVariant("");
					// Usually restoring the state of any of the managed controls should mark the variant as dirty, but there might be edge cases (state from an old release not containing information for any
					// managed control now relevant), so to be on the safe side, we set modified=true explicitly. 
					oSmartVariantManagement.currentVariantSetModified(true); 
					fnSetManagedControlStates(oPreliminaryState);
				} else {
					fnSetVariant(oPreliminaryState.variantId);
					// if managedControlStates is not provided (legacy or maybe broken state), applying VM state should not break
					// don't apply undefined to managedControlWrappers, but just leave them untouched
					if (oPreliminaryState.managedControlStates){
						if (oPreliminaryState.variantId !== oSmartVariantManagement.getCurrentVariantId()){
							// variant could not be set because it is not known, i.e. it could be private and URL was shared, or could be deleted after page was bookmarked. In this case, 
							// standard variant is set (by VM). Additionally, it should be marked as modified.
							oSmartVariantManagement.currentVariantSetModified(true);
						}
					}
				}
			});
		}

		function attachStateChanged(fnHandler) {
			// state of variant management itself can be changed directly (user selects a different variant or stores current state as (new) variant), or indirectly (user changes some
			// data of a control managed by VM, e.g. some filter values in SFB)

			oControlAssignedPromise.then(function() {
				// state change when user selects a different variant
				oSmartVariantManagement.attachSelect(fnHandler);
				
				// when user saves current state as a new variant, this is also a state change (as the variant id is part of the state)
				// note: Even if new (SFB) variant is marked as execute on select, and currently no data is selected, no need to select data here (and thus also not to collapse header).
				// This is one of the possible ways to get into a state with a clean variant with execute on select, but no data loaded - see also comment to identify SFB wrapper.  
				oSmartVariantManagement.attachAfterSave(fnHandler);
				
				// any change of a managed control is state change
				mParams.managedControlWrappers.forEach(function(oWrapper){
					oWrapper.attachStateChanged(fnHandler);
				});
			});
		}
		
		return {
			getState : getState,
			setState : setState,
			setControl: fnSetControl,
			attachStateChanged : attachStateChanged
		};
	}

	return SmartVariantManagementWrapper;
});