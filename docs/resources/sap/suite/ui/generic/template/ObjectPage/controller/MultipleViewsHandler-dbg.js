sap.ui.define([
	"sap/ui/base/Object",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/lib/multipleViews/MultipleViewsHandler",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function(BaseObject, StableIdHelper, MultipleViewsHandler, extend, FeLogger) {
	"use strict";

	var	sClassName = "ObjectPage.controller.MultipleViewsHandler";
	var oLogger = new FeLogger(sClassName).getLogger();

	// This helper class handles multiple views in the Object Page.
	// For each section which supports the multiple views feature it instantiates an instance of
	// sap.suite.ui.generic.template.lib.multipleViews.MultipleViewsHandler which implements the main part of the logic.
	// This class only contains the glue code which is used to adapt the services provided by this generic class to the requirements of the Object Page.

	// oController is the controller of the enclosing ListReport
	// oTemplateUtils are the template utils as passed to the controller implementation
	// fnStateChanged is a function that should be called, when the storable state changes
	function getMethods(oController, oTemplateUtils, fnStateChanged) {
		// Begin: Instance variables
		var mGenericMultipleViewsHandlers = Object.create(null); // maps the ids of the sections containing multiple views on the corresponding generic multiple views handler
		var mSmartControlToGenericMultipleViewHandlers = Object.create(null);
		var mSectionToSwitchingControl = Object.create(null);
		
		function onDataRequested(sSmartControlId){
			var oGenericMultipleViewsHandler =  fnGetGenericMultipleViewsHandler(sSmartControlId);
			if (oGenericMultipleViewsHandler) {
				oGenericMultipleViewsHandler.updateCounts();
			}
		}

		function onRebindContentControl(sSmartControlId, oBindingParams){
			var oGenericMultipleViewsHandler = fnGetGenericMultipleViewsHandler(sSmartControlId);
			if (oGenericMultipleViewsHandler) {
				oGenericMultipleViewsHandler.onRebindContentControl(oBindingParams);
			}
		}

		// returns an undefined value if the smartcontrolid doesn't use mutlipleview feature
		function fnGetGenericMultipleViewsHandler(sSmartControlId) {
			return mSmartControlToGenericMultipleViewHandlers[sSmartControlId];
		}

		function fnGetSearchValue(sSmartControlId) {
			var oInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(sSmartControlId);
			if (oInfoObject) {
				var sSearchFieldId = oInfoObject.getSearchFieldId();
				if (sSearchFieldId) {
					var oSearchField = oController.getView().byId(sSearchFieldId);
					return oSearchField && oSearchField.getValue();
				}
			}
		}

		function fnGetSelectedKey(sSectionKey) {
			return mGenericMultipleViewsHandlers[sSectionKey].getSelectedKey();
		}

		function fnSetSelectedKey(sSectionKey, sKey) {
			return mGenericMultipleViewsHandlers[sSectionKey].setSelectedKey(sKey);
		}

		function fnGetCurrentState(){
			var mMultipleViewState; // maps the ids of the side controls that currently show side content onto true. Faulty, if no such control exists
			for (var sSectionKey in mGenericMultipleViewsHandlers) {
				var oMultipleViewHandler = mGenericMultipleViewsHandlers[sSectionKey];
				var sSelectedKey = oMultipleViewHandler.getSelectedKey();
				mMultipleViewState = mMultipleViewState || Object.create(null);
				mMultipleViewState[sSectionKey] = sSelectedKey;
			}
			return mMultipleViewState;
		}

		function fnApplyState(oState, bIsSameAsLast) {
			if (bIsSameAsLast) {
				return;
			}
			for (var sSectionKey in mGenericMultipleViewsHandlers) {
				var oMultipleViewHandler = mGenericMultipleViewsHandlers[sSectionKey];
				var sSelectedKey =  oState && oState[sSectionKey];
				oMultipleViewHandler.setSelectedKey(sSelectedKey);
			}
		}

		function fnFormatItemTextForMultipleView(oItem) {
			var sFacetId = oItem.facetId;
			var sSmartControlId = fnGetSmartControlId(sFacetId);
			var oGenericMultipleViewsHandler = fnGetGenericMultipleViewsHandler(sSmartControlId);
			if (!oGenericMultipleViewsHandler) {
				return null;
			}
			return oGenericMultipleViewsHandler.formatItemTextForMultipleView(oItem);
		}

		function getPresentationControlHandler(oSmartTable){
			return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartTable);		
		}
		
		function getKeyToPresentationControlHandler(oSmartTable) {
			var oGenericMultipleViewsHandler = fnGetGenericMultipleViewsHandler(oSmartTable.getId(), true);
			if (!oGenericMultipleViewsHandler) {
				return null;
			}
			var mRet = Object.create(null);
			var aKeys = oGenericMultipleViewsHandler.getKeys();
			aKeys.forEach(function (sKey) {
				mRet[sKey] = function() {
					return getPresentationControlHandler(oSmartTable);
				};
			});
			return mRet;
		}
		
		function fnRegisterKeyChange(oSmartTable, onKeyChange){
			var oGenericMultipleViewsHandler = mSmartControlToGenericMultipleViewHandlers[oSmartTable.getId()];
			if (oGenericMultipleViewsHandler){
				oGenericMultipleViewsHandler.registerKeyChange(onKeyChange);
			}
		}

		function fnGetPresentationControlHandler(sStableIdForSmartControl) {
			var oSmartControl = oController.byId(sStableIdForSmartControl);
			return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartControl);
		}

		function isSmartControlMulti(oSmartControl){
			return !!mSmartControlToGenericMultipleViewHandlers[oSmartControl.getId()];
		}

		function fnGetSmartControlId(sSectionKey) {
			var sStableIdForSmartControl = StableIdHelper.getStableId({
				type: "ObjectPageTable",
				subType: "SmartTable",
				sFacet: sSectionKey
			});

			return oController.getView().createId(sStableIdForSmartControl);
		}

		function fnGetSwitchingControlAsync(sSectionKey) {
			return mSectionToSwitchingControl[sSectionKey].asyncPromise;
		}

		function fnInitializeSectionToSwitchingControl(sSectionKey) {
			var oSectionToSwitchingControl = {};
			oSectionToSwitchingControl.asyncPromise = new Promise(function(resolve) {
				oSectionToSwitchingControl.resolve = resolve;
			});
			mSectionToSwitchingControl[sSectionKey] = oSectionToSwitchingControl;
		}

		function fnSubSectionEntered(oSubSectionInfo) {
			var sSectionKey;
			var oSubSectionSettings = oSubSectionInfo.getSettings();
			var fnCheckAndResolvePromise = function(sKey) {
				var oSectionToSwitchingControl = mSectionToSwitchingControl[sKey];
				if (!oSectionToSwitchingControl) {
					// SubSection doesn't have any MultipleViewHandling
					return;
				}
				var sStableIdForSegmentedButton = StableIdHelper.getStableId({
					type: "ObjectPageTable",
					subType: "SegmentedButton",
					sFacet: sSectionKey
				});
				var sStableIdForVariantSelection = StableIdHelper.getStableId({
					type: "ObjectPageTable",
					subType: "VariantSelection",
					sFacet: sSectionKey
				});
				var oSwitchingControl = oController.byId(sStableIdForSegmentedButton) || oController.byId(sStableIdForVariantSelection);
				oSectionToSwitchingControl.resolve(oSwitchingControl);
			};
			
			if (oSubSectionSettings.blocks && oSubSectionSettings.blocks.length > 0) {
				oSubSectionSettings.blocks.forEach(function(oBlock) {
					sSectionKey = oBlock.additionalData.facetId;
					fnCheckAndResolvePromise(sSectionKey);
				});
			}

			sSectionKey = oSubSectionInfo.getSettings().additionalData.facetId;
			fnCheckAndResolvePromise(sSectionKey);
		}

		function fnGetInitializationPromise(sSectionKey) {
			var oGenericMultipleViewsHandler = mGenericMultipleViewsHandlers[sSectionKey];
			if (!oGenericMultipleViewsHandler) {
				oLogger.error("GenericMultipleViewsHandler doesn't exist for Section: '" + sSectionKey + "'");
				return Promise.resolve();
			}

			return oGenericMultipleViewsHandler.getInitializationPromise();
		}

		(function() { // constructor coding encapsulated in order to reduce scope of helper variables
			var mManifestSections = oController.getOwnerComponent().getSections();
			for (var sSectionKey in mManifestSections) { // loop over all sections specified in the manifest
				var oManifestSection = mManifestSections[sSectionKey];
				if (oManifestSection.quickVariantSelection){ // this section has a multiple views
					// Control is not created yet in case of View Lazy Loading. Therefore remove
					// the dependency with the control
					var sStableIdForSmartControl = fnGetSmartControlId(sSectionKey);
					fnInitializeSectionToSwitchingControl(sSectionKey);
					var oConfiguration = {
						mode: "single", // Object page SmartTable/SmartChart can only support Multiple Views Single Table mode
						manifestSettings: oManifestSection.quickVariantSelection,
						pathInTemplatePrivateModel: "/objectPage/multipleViews",
						getPresentationControlHandler: fnGetPresentationControlHandler.bind(null, sStableIdForSmartControl),
						sectionKey: sSectionKey,
						getSwitchingControlAsync: fnGetSwitchingControlAsync.bind(null, sSectionKey),
						appStateChange: fnStateChanged,
						isDataToBeShown: function() {
							return true;
						},
						adaptRefreshRequestMode: function(iRefreshRequest) {
							return iRefreshRequest;
						},
						refreshModelOnTableRefresh: false
					};
					oConfiguration.getSearchValue = fnGetSearchValue.bind(null, sStableIdForSmartControl);
					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					if (!oTemplatePrivateModel.getProperty(oConfiguration.pathInTemplatePrivateModel)) {
						oTemplatePrivateModel.setProperty(oConfiguration.pathInTemplatePrivateModel, Object.create(null));
					}
					oConfiguration.pathInTemplatePrivateModel = "/objectPage/multipleViews/" + sSectionKey;
					var oGenericMultipleViewsHandler = new MultipleViewsHandler(oController, oTemplateUtils, oConfiguration);
					mGenericMultipleViewsHandlers[sSectionKey] = oGenericMultipleViewsHandler;
					mSmartControlToGenericMultipleViewHandlers[sStableIdForSmartControl] = oGenericMultipleViewsHandler;
				}
			}
		})();

		// public instance methods
		return {
			onDataRequested: onDataRequested,
			onRebindContentControl: onRebindContentControl,
			getCurrentState: fnGetCurrentState,
			applyState: fnApplyState,
			formatItemTextForMultipleView: fnFormatItemTextForMultipleView,
			getSelectedKey: fnGetSelectedKey,
			setSelectedKey: fnSetSelectedKey,
			getKeyToPresentationControlHandler: getKeyToPresentationControlHandler,
			registerKeyChange: fnRegisterKeyChange,
			isSmartControlMulti: isSmartControlMulti,
			subSectionEntered: fnSubSectionEntered,
			getInitializationPromise: fnGetInitializationPromise
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.MultipleViewsHandler", {
		constructor: function(oController, oTemplateUtils, fnStateChanged) {
			extend(this, getMethods(oController, oTemplateUtils, fnStateChanged));
		}
	});
});
