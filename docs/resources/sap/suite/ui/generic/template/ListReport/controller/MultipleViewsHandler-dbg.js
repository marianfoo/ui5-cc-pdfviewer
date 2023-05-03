sap.ui.define([
	"sap/ui/base/Object",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/lib/multipleViews/MultipleViewsHandler",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/FeError"
], function(BaseObject, StableIdHelper, MultipleViewsHandler, extend, FeError) {
	"use strict";

	// This helper class handles multiple views in the List Report.
	// In case the enclosing List Report really supports the multiple views feature it instantiates an instance of
	// sap.suite.ui.generic.template.lib.multipleViews.MultipleViewsHandler which implements the main part of the logic.
	// This class only contains the glue code which is used to adapt the services provided by this generic class to the requirements of the List Report

	// oState is used as a channel to transfer data to the controller and back.
	// oController is the controller of the enclosing ListReport
	// oTemplateUtils are the template utils as passed to the controller implementation
	var	sClassName = "ListReport.controller.MultipleViewsHandler";
	function getMethods(oState, oController, oTemplateUtils) {
		// Begin: Instance variables
		var oGenericMultipleViewsHandler;   // the generic implementation of the multiple views feature. Will be instantiated if this List Report uses the multiple views feature.
		var oQuickVariantSelectionEffective;
		var oGetSwitchingControlPromise;
		// indicates either single or multi
		var sMode;
		var enableAutoBindingMultiView;



		function onDataRequested() {
			if (!oGenericMultipleViewsHandler) {
				return;
			}
			oGenericMultipleViewsHandler.updateCounts();
		}

		function onRebindContentControl(oBindingParams, aFiltersFromSmartTable) {
			if (!oGenericMultipleViewsHandler) {
				return;
			}
			oGenericMultipleViewsHandler.onRebindContentControl(oBindingParams, aFiltersFromSmartTable);
		}

		function fnResolveParameterizedEntitySet(oEntitySet, oParameterInfo) {
			if (!oGenericMultipleViewsHandler) {
				return null;
			}
			return oGenericMultipleViewsHandler.resolveParameterizedEntitySet(oEntitySet, oParameterInfo);
		}

		function fnFormatMessageStrip(aIgnoredFilters, sSelectedKey) {
			return oGenericMultipleViewsHandler ? oGenericMultipleViewsHandler.formatMessageStrip(aIgnoredFilters, sSelectedKey) : "";
		}

		function fnHasEntitySet(sEntitySet){
			if (!oGenericMultipleViewsHandler){
				return oController.getOwnerComponent().getEntitySet() === sEntitySet;
			}
			return oGenericMultipleViewsHandler.hasEntitySet(sEntitySet);
		}
		
		function fnGetPreferredKey(sEntitySet){
			return oGenericMultipleViewsHandler ? oGenericMultipleViewsHandler.getPreferredKey(sEntitySet) : "";
		}

		function fnFormatItemTextForMultipleView(oItemDataModel) {
			// if (!oGenericMultipleViewsHandler) {
			// 	return null;
			// }
			return oGenericMultipleViewsHandler && oGenericMultipleViewsHandler.formatItemTextForMultipleView(oItemDataModel);
		}

		function getSFBVariantContentStateWrapper() {
			return oGenericMultipleViewsHandler && oGenericMultipleViewsHandler.getSFBVariantContentStateWrapper();
		}

		function getGeneralContentStateWrapper() {
			return oGenericMultipleViewsHandler && oGenericMultipleViewsHandler.getGeneralContentStateWrapper();
		}

		function fnDetermineSortOrder() {
			// if (!oGenericMultipleViewsHandler) {
			// 	return null;
			// }
			return oGenericMultipleViewsHandler && oGenericMultipleViewsHandler.determineSortOrder();
		}

		function fnRefreshOperation(iRequest, vTabKey, mEntitySets) {
			if (!oGenericMultipleViewsHandler) {
				return false;
			}
			oGenericMultipleViewsHandler.refreshOperation(iRequest, vTabKey, mEntitySets);
			// tells caller there is generic multiple views handler which does the refresh
			return true;
		}

		function fnGetEnableAutoBinding() {
			// make it boolean value
			return !!(oQuickVariantSelectionEffective && oQuickVariantSelectionEffective.enableAutoBinding);
		}

		function fnGetOriginalEnableAutoBinding(){
			return enableAutoBindingMultiView;
		}

		function fnSetControlVariant(sChartVariantId, sTableVariantId) {
			if (!oGenericMultipleViewsHandler) {
				return;
			}
			oGenericMultipleViewsHandler.setControlVariant(sChartVariantId, sTableVariantId);
		}

		function fnHandleStartUpObject(oStartupObject) {
			if (!oGenericMultipleViewsHandler) {
				return;
			}
			if (oStartupObject.selectedQuickVariantSelectionKey) {
				oGenericMultipleViewsHandler.setSelectedKey(oStartupObject.selectedQuickVariantSelectionKey);
			}
		}

		function fnGetSelectedKeyPropertyName() {
			if (!sMode){
				return null;
			}
			return sMode === "single" ? "tableViewData" : "tableTabData";
		}

		function fnGetSelectedKey() {
			if (!sMode){
				return null;
			}
			return oGenericMultipleViewsHandler.getSelectedKey();
		}

		function fnSetSelectedKey(sKey) {
			return oGenericMultipleViewsHandler.setSelectedKey(sKey);
		}

		function fnOnDetailsActionPress(oEvent) {
			var oBindingContext = oEvent.getParameter("itemContexts") && oEvent.getParameter("itemContexts")[0];
			oTemplateUtils.oCommonEventHandlers.onListNavigate(oEvent, oState, oBindingContext);
		}


		function fnAdaptPresentationControl() {
			if (sMode === "multi") {
				var sKey = oGenericMultipleViewsHandler.getSelectedKey();
				oState.oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(
					oController.byId(StableIdHelper.getStableId( {type: "ListReportTable", subType: "SmartTable", sQuickVariantKey: sKey})));
				oState.oWorklistData.oSearchField = oController.byId(StableIdHelper.getStableId({type: "ListReportAction", subType: "SearchField", sQuickVariantKey: sKey}));
			}
		}
		
		// should ensure that all other smart controls that use the same entity set will refresh their data
		function fnRefreshSiblingControls(oPresentationControlHandler){
			if (sMode === "multi"){
				oGenericMultipleViewsHandler.refreshSiblingControls(oPresentationControlHandler);
			}
		}

		function fnGetMode() {
			return oGenericMultipleViewsHandler && oGenericMultipleViewsHandler.getMode();
		}
		
		// This function is only used when sMode is "multi". Note that it is called before oGenericMultipleViewsHandler has been initialized.
		// Thus, it cannot rely on the analysis done during the setup of that instance.
		// Therefore, the smart control implementing a given tab key is derived via a lookup by the id.
		// Note that the ids for SmartTable and SmartChart are built identical (so we do not need to know which case applies).
		// SmartList would use another id, but is currently disallowed for multi view scenarios.
		// If we would have to support that we would need to use oTemplateUtils.oComponentUtils.getParameterModelForTemplating() and take the templateSpecific
		// part of it.
		function getPresentationControlHandler(sKey){
			return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oController.byId(StableIdHelper.getStableId({
				type: "ListReportTable", 
				subType: "SmartTable", 
				sQuickVariantKey: sKey
			})));			
		}
		
		function getKeyToPresentationControlHandler(){
			if (!oQuickVariantSelectionEffective){
				return null;
			}
			var mRet = Object.create(null);
			var fnFixed = (sMode === "single") && function(){
				return oState.oPresentationControlHandler;
			};
			for (var sKey in oQuickVariantSelectionEffective.variants){
				var sKeyForId = oQuickVariantSelectionEffective.variants[sKey].key || sKey;
				mRet[sKeyForId] = fnFixed || getPresentationControlHandler.bind(null, sKeyForId);
			}
			return mRet;
		}
		
		function fnRegisterKeyChange(onKeyChange){
			if (oGenericMultipleViewsHandler){
				oGenericMultipleViewsHandler.registerKeyChange(onKeyChange);
			}
		}
		
		function fnGetSwitchingControlAsync() {
			if (!oGetSwitchingControlPromise) {
				oGetSwitchingControlPromise = new Promise(function(resolve) {
					var oSwitchingControl;
					if (sMode === "multi"){
						var sIdForIconTabBar =  StableIdHelper.getStableId({type:"QuickVariantSelectionX", subType: "IconTabBar"});
						oSwitchingControl = oController.byId(sIdForIconTabBar);
					} else {
						var sSegmentedButton = StableIdHelper.getStableId({type:"QuickVariantSelection", subType: "SegmentedButton"});
						var sVariantSelect = StableIdHelper.getStableId({type:"QuickVariantSelection", subType: "VariantSelect"});
						oSwitchingControl = oController.byId(sSegmentedButton) || oController.byId(sVariantSelect);
					}
	
					resolve(oSwitchingControl);
				});
			}
			return oGetSwitchingControlPromise;
		}

		function fnGetInitializationPromise() {
			return oGenericMultipleViewsHandler ? 
				oGenericMultipleViewsHandler.getInitializationPromise() : Promise.resolve();
		}

		(function() { // constructor coding encapsulated in order to reduce scope of helper variables
			var oSettings = oTemplateUtils.oComponentUtils.getSettings();
			var oQuickVariantSelectionX = oSettings.quickVariantSelectionX;
			var oQuickVariantSelection = oSettings.quickVariantSelection;
			if (oQuickVariantSelectionX && oQuickVariantSelection) {
				throw new FeError(sClassName, "Defining both QuickVariantSelection and QuickVariantSelectionX in the manifest is not allowed.");
			}
			oQuickVariantSelectionEffective = oQuickVariantSelectionX || oQuickVariantSelection;
			if (oQuickVariantSelectionX) {
				enableAutoBindingMultiView = oQuickVariantSelectionX.enableAutoBinding;		//Check if value of enableAutoBinding is being set from manifest
				if (enableAutoBindingMultiView === null || enableAutoBindingMultiView === undefined) {
					oQuickVariantSelectionX.enableAutoBinding = true;							//set the default value of enableAutoBinding to true
				}
			}
			if (!oQuickVariantSelectionEffective) {
				return;
			}
			
			sMode = oQuickVariantSelectionX ? "multi" : "single";

			// manifestSettings: indicates whether multiple tab multiview or multiple tab single view
			// pathInTemplatePrivateModel: path of the model to be read
			// presentationControlHandler: presentationControlHandler instance which contains smartControl which contains table
			// getPresentationControlHandler : function which returns the presentationControlHandler instance with the given smartcontrol's key
			// switchingControl: the control which is used to switch between the views. It must possess a getItems() method.
			// smartFilterBar: smartfilterbar which contains filter values
			var oConfiguration = {
				mode: sMode,
				manifestSettings: oQuickVariantSelectionEffective,
				pathInTemplatePrivateModel: "/listReport/multipleViews",
				presentationControlHandler: oQuickVariantSelection && oState.oPresentationControlHandler, // only in single views mode a single smart control is being transfered
				getPresentationControlHandler: oQuickVariantSelectionX && getPresentationControlHandler,
				getSwitchingControlAsync: fnGetSwitchingControlAsync,
				smartFilterBar: oState.oSmartFilterbar,
				getSearchValue: function () {
					return oState.oSmartFilterbar.getBasicSearchValue();
				},
				appStateChange: function(){
					if (oGenericMultipleViewsHandler) {
						// The following logic checks whether we need to rebind or refresh (or both) the SmartControl which is switched to.
						var bSearchButtonPressed = oState.oIappStateHandler.areDataShownInTable() || oState.oWorklistData.bWorkListEnabled;
						oState.oIappStateHandler.changeIappState(bSearchButtonPressed);
					}
				},
				isDataToBeShown: function () {
					return oState.oIappStateHandler.areDataShownInTable() || oState.oWorklistData.bWorkListEnabled;
				},
				adaptRefreshRequestMode: function(iRefreshRequest) {
					// worklist is always refreshed
					return iRefreshRequest + (oState.oWorklistData.bWorkListEnabled && iRefreshRequest < 2 ? 2 : 0);
				},
				refreshModelOnTableRefresh: true,
				adaptPresentationControl: fnAdaptPresentationControl
			};
			oGenericMultipleViewsHandler = new MultipleViewsHandler(oController, oTemplateUtils, oConfiguration);
			fnGetSwitchingControlAsync().then(fnAdaptPresentationControl);

		})();

		// public instance methods
		return {
			onDataRequested: onDataRequested,
			refreshOperation: fnRefreshOperation,
			onRebindContentControl: onRebindContentControl,
			formatMessageStrip: fnFormatMessageStrip,
			getSFBVariantContentStateWrapper: getSFBVariantContentStateWrapper,
			getGeneralContentStateWrapper: getGeneralContentStateWrapper,
			formatItemTextForMultipleView: fnFormatItemTextForMultipleView,
			getEnableAutoBinding: fnGetEnableAutoBinding,
			getOriginalEnableAutoBinding: fnGetOriginalEnableAutoBinding,
			determineSortOrder: fnDetermineSortOrder,
			setControlVariant: fnSetControlVariant,
			handleStartUpObject: fnHandleStartUpObject,
			onDetailsActionPress: fnOnDetailsActionPress,
			getSelectedKeyPropertyName: fnGetSelectedKeyPropertyName,
			getSelectedKey: fnGetSelectedKey,
			setSelectedKey: fnSetSelectedKey,
			hasEntitySet: fnHasEntitySet,
			getPreferredKey: fnGetPreferredKey,
			refreshSiblingControls: fnRefreshSiblingControls,
			resolveParameterizedEntitySet: fnResolveParameterizedEntitySet,
			getMode: fnGetMode,
			getKeyToPresentationControlHandler: getKeyToPresentationControlHandler,
			registerKeyChange: fnRegisterKeyChange,
			getInitializationPromise: fnGetInitializationPromise
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.MultipleViewsHandler", {
		constructor: function(oState, oController, oTemplateUtils) {
			extend(this, getMethods(oState, oController, oTemplateUtils));
		}
	});
});
