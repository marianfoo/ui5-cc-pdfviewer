sap.ui.define(["sap/ui/base/Object", "sap/ui/layout/DynamicSideContent", "sap/base/util/extend"
	], function(BaseObject, DynamicSideContent, extend) {
		"use strict";

		/*
		 * This helper class of the ControllerImplementation handles all runtime logic which is connected to the use of the DynamicSideContentControl (side content feature).
		 */

		// oController is the controller of the enclosing ObjectPage
		// oTemplateUtils are the template utils as passed to the controller implementation
		// fnStateChanged is a function that should be called, when the storable state changes
		function getMethods(oController, oTemplateUtils, fnStateChanged) {

			// Initialize the info object for a block if it is actually a sideContent. Called during the initialization of the enclosing subsection info object.
			// In case that oBlock is actually a side content this ensures that:
			function fnInitSideContentInfoObject(oSideContentSettings){
				if (!oSideContentSettings){
					return;
				}

				return oTemplateUtils.oInfoObjectHandler.initializeSideContentInfoObject(oSideContentSettings, fnStateChanged);
			}
			// event handler for the breakpointChanged event of a SideContent. Note that this event might be called even before onInit() of the controller has been executed
			function fnSideContentBreakpointChanged(oEvent){
				var oSideContent = oEvent.getSource();
				oTemplateUtils.oComponentUtils.getViewInitializedPromise().then(function(){ // postpone further processing until onInit was executed
					var oSideContentInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(oSideContent.getId());
					setTimeout(function(){ // postpone the adaptation of the side content until oSideContent has done its internal adaptations
						oSideContentInfoObject.adaptToBreakPoint();
					}, 0);
				});
			}
			// event handler for the press event of the toggle button for a SideContent
			// sSideContentId is the id of the DynamicSideContent instance the toggle button belongs to
			function onToggleDynamicSideContent(sSideContentId) {
				var oSideContent = oController.byId(sSideContentId);
				var oSideContentInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(oSideContent.getId());
				oSideContentInfoObject.toggleVisibility();
			}

			// retrieve the current state information for all side content controls on the page.
			// More precisely: Return a state object, that maps the ids of all (logically) open side content controls to true. If no such control exists a faulty object is returned.
			function getCurrentState(){
				var mSideContentState; // maps the ids of the side controls that currently show side content onto true. Faulty, if no such control exists
				oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("sideContent", function(oSideContentInfoObject){ // iterate over all info objects for side content
					var bShowSideContent = oSideContentInfoObject.getShowSideContent();
					if (bShowSideContent){
						mSideContentState = mSideContentState || Object.create(null);
						mSideContentState[oSideContentInfoObject.getId()] = true;
					}
				});
				return mSideContentState;
			}

			// apply the state information that has been stored by this class
			function applyState(oState, bIsSameAsLast){
				oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("sideContent", function(oSideContentInfoObject){ // iterate over all info objects for side content
					oSideContentInfoObject.getControlAsync().then(function() {
						if (!bIsSameAsLast){ // state only needs to be applied, if we do not return to exactly the same page that we left
							// reset all side content controls to not show side content, unless the state contains the opposite information
							var bShowSideContent = !!oState && oState[oSideContentInfoObject.getId()];
							oSideContentInfoObject.setShowSideContent(bShowSideContent);
						}
						oSideContentInfoObject.adaptToBreakPoint(); // Since browser size might have been changed while we have been away from this page we still need to adapt
					});
				});
			}

			// Formatter for the text property of the side content action button
			function formatSideContentActionButtonText(sSideContentId, bVisible){ // Considering the custom Side Content Button Text as well
				var sGlobalSideContentId = oController.createId(sSideContentId);
				return bVisible ? oTemplateUtils.oCommonUtils.getContextText("HideSideContent", sGlobalSideContentId, "HIDE_SIDE_CONTENT") : oTemplateUtils.oCommonUtils.getContextText("ShowSideContent", sGlobalSideContentId, "SHOW_SIDE_CONTENT");
			}

			// public instance methods
			return {
				initSideContentInfoObject: fnInitSideContentInfoObject,
				onToggleDynamicSideContent: onToggleDynamicSideContent,
				sideContentBreakpointChanged: fnSideContentBreakpointChanged,
				getCurrentState: getCurrentState,
				applyState: applyState,
				formatSideContentActionButtonText: formatSideContentActionButtonText
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.SideContentHandler", {
			constructor: function(oController, oTemplateUtils, fnStateChanged) {
				extend(this, getMethods(oController, oTemplateUtils, fnStateChanged));
			}
		});
	});
