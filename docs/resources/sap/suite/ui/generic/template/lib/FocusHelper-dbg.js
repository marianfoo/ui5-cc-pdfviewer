sap.ui.define(["sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
	], function(BaseObject, extend, controlHelper, FeLogger) {
		"use strict";
		var	sClassName = "lib.FocusHelper";

	    var oFeLogger = new FeLogger(sClassName);
	    var oLogger = oFeLogger.getLogger();

		// This is a helper class of Application which exposes method setNextFocus of this class.
		// By calling this function you can specify a logic which will be executed when a busy session ends the next time.
		// Note that this applies to the already running busy session in case there is one. Otherwise it applies to the busy session started next.
		// The specified logic should be used to set the focus as good as possible (for the user to proceed with his work).
		// Note that there is a default logic already implemented within this class (see fnFallback).
		// The default logic will be called at the end of the busy session if no specific logic has been registered for the busy session.
		// Moreover, the default logic will also be made available to the specific logic registered here in case it wants to use the default logic.
		function getMethods(oTemplateContract) {
			
			// Called at the beginning of a busy session. Returns the oBeforeData object which is passed to the functions that should set the focus at the end
			// of a busy session.
			// The returned object has the following properties:
			// # avtiveComponents: sorted list of (ids of) active components when the busy session was started
			// # currentKeys: array of keys valid when the busys session was started (resp. a faulty value for the initial busys session)
			// # currentFocus: the id of the control which has focus at the beginning of the busys session (if it can be determined)
			// # currentFocusComponent: id of the component which contains the currentFocus control (if focus is within one component)
			// As a side effect the lastFocus property of the corresponding registry entry is set
			function getBeforeData(){
				var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy && oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
				var oRet = {
					activeComponents: oTemplateContract.oNavigationControllerProxy ? oTemplateContract.oNavigationControllerProxy.getActiveComponents() : [],
					currentKeys: oCurrentIdentity && oCurrentIdentity.keys
				};
				oRet.currentFocus = oRet.activeComponents.length > 0 && controlHelper.getControlWithFocus();
				if (oRet.currentFocus){
					var sFocusId = oRet.currentFocus.getId();
					for (var i = oRet.activeComponents.length - 1; i >= 0; i--){
						var sComponentId = oRet.activeComponents[i];
						var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
						var oView = oRegistryEntry.oController.getView();
						if (controlHelper.isElementVisibleOnView(sFocusId, oView)){
							oRet.currentFocusComponent = sComponentId;
							oRegistryEntry.lastFocus = oRet.currentFocus;
							break;
						}
					}
				}
				return oRet;
			}
			
			// Implements the fallback logic for setting a focus when the busy session has ended.
			// For this purpose it checks for the active component with highest level and
			// calls the setFocus method defined for this component (if available).
			// oBeforeData is the data that have been collected at the beginning of the busy session (see above).
			// oAdditionalData can be filled when fnFallback is called by a function that was registered via setNextFocus.
			function fnFallback(oBeforeData, oAdditionalData){
				var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
				var sMainComponentId = aActiveComponents[aActiveComponents.length - 1];
				var oRegistryEntry = oTemplateContract.componentRegistry[sMainComponentId];
				if (oRegistryEntry.methods.setFocus){
					oRegistryEntry.methods.setFocus(oBeforeData, oAdditionalData);
				}
			}
			
			var oFocusTopic = {
				getBeforeData: getBeforeData,
				fallback: fnFallback
			};
			oTemplateContract.mBusyTopics.focus = oFocusTopic; // register for focus handling

			// This function is exposed to the controllers via class Application.
			// It should be used to specify the logic for setting the focus when the busy session ends next time
			// setFocus(oBeforeData, fnFallback) should be a function that implements this logic.
			// Thereby, oBeforeData will be the data that has been collected by function getBeforeData (see above) when the busy session was started.
			// fnFallback will implement the fallback logic. It will be identical to fnFallback from above, but first parameter (oBeforeData) already set.
			// Note: If no focus handling should happen at the end of the busy session (e.g. in error scenarios) call setNextFocus(Function.prototype)
			function setNextFocus(setFocus){
				if (oFocusTopic.oneTimer){
					oLogger.warning("Existing focus oneTimer replaced");
				} else {
					oLogger.info("Set focus oneTimer");
				}
				oFocusTopic.oneTimer = setFocus;                                                  
			}
		
			return {
				setNextFocus: setNextFocus
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.lib.FocusHelper", {
			constructor: function(oTemplateContract) {
				extend(this, getMethods(oTemplateContract));
			}
		});
	});
