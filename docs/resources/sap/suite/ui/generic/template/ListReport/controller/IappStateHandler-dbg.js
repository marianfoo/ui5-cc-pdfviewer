sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/mvc/ControllerExtension",
	"sap/ui/generic/app/navigation/service/NavError",
	"sap/suite/ui/generic/template/listTemplates/listUtils",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/ui/comp/state/UIState",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/deepEqual",
	"sap/base/util/extend",
	"sap/base/util/isEmptyObject",
	"sap/suite/ui/generic/template/genericUtilities/FeError",
	"sap/ui/Device",
	"sap/suite/ui/generic/template/listTemplates/semanticDateRangeTypeHelper",
	"sap/suite/ui/generic/template/ListReport/controller/LegacyStateHandler",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/js/StableIdHelper"
	], function(BaseObject, ControllerExtension, NavError, listUtils, SelectionVariant, UIState, FeLogger, deepEqual, extend,
			isEmptyObject, FeError, Device, semanticDateRangeTypeHelper, LegacyStateHandler, testableHelper, StableIdHelper) {
	"use strict";

	var	sClassName = "ListReport.controller.IappStateHandler";
	var oFeLogger = new FeLogger(sClassName);
	var oLogger = oFeLogger.getLogger();
	var oLevel = oFeLogger.Level;
	// Constants which are used as property names for storing custom filter data and generic filter data
	var dataPropertyNameCustom = "sap.suite.ui.generic.template.customData",
	dataPropertyNameExtension = "sap.suite.ui.generic.template.extensionData",
	dataPropertyNameGeneric = "sap.suite.ui.generic.template.genericData";

	function fnLogInfo(sMessage, vDetails){
		if (sap.ui.support) { //only if support assistant is loaded
			var iLevel = oLogger.getLevel();
			if (iLevel < oLevel.INFO) {
				oLogger.setLevel(oLevel.INFO);
			}
		}
		var sDetails;
		if (typeof vDetails === "string"){
			sDetails = vDetails;
		} else {
			sDetails = "";
			var sDelim = "";
			for (var sKey in vDetails){
				sDetails = sDetails + sDelim + sKey + ": " + vDetails[sKey];
				sDelim = "; ";
			}
		}
		oLogger.info(sMessage, sDetails, "sap.suite.ui.generic.template.ListReport.controller.IappStateHandler");
	}

	function getMethods(oState, oController, oTemplateUtils) {
		var oLegacyStateHandler = new LegacyStateHandler(oController);


		// don't apply any results from appstate analysis to SFB before this event
		// -> should actually be handled by (wrapper for) SFB
		var onSmartFilterBarInitialized;
		var oSmartFilterBarInitializedPromise = new Promise(function(fnResolve){
			onSmartFilterBarInitialized = fnResolve;
		});

		// *** setup wrappers for control states (start)


		// 3 categories:
		// - things always controlled by the page vm (the vm on top next to sfb): SFBs state, custom filters, selected key in case of multi tables (or whatever multipleViewsHandler
		//		returns as SFBVariantContent) => add to aPageVariantControlStateWrappers (after analysis of third situation)
		// - things never being part of that vm: dynamic page (header collapsed or expanded), data to be loaded => add to aControlStateWrappers
		// - things being part of vm only in case of page vm (setting smartVariantManagement): SmartTable's state, selected key in case of mutliple views with single table, state of
		//		tables in case of multi tables (or whatever multipleViewsHandler returns as general content), searchfield

		// Create wrappers for controls carrying a state
		var aControlStateWrappers = []; // array of those wrappers, that should be handled directly, i.e. are only part of iAppState, but not of any variant
		var aPageVariantControlStateWrappers = []; // controls handled from page variant management if used: smartTable, searchfield, partly multiple views

		// SmartTable state: Table Settings and (in case of control level variant management) selected variant and whether it's dirty
		// In case of multipleViews with multiple tables (mode "multi"), each tab has an own table or chart, which has an own state, so multipleViewsHandler has to take care of 
		// storing/restoring their states (in its part of the appState stored in genericData.tableTabData)
		// In this case, mutliViewsHandler exchanges oState.oPresentationControlHandler (setting it always to the current visible one), so don't rely on that to get the wrapper. 
		// Using the id (without providing optional parameter sQuickVariantKey) returns the smartTable only in single table case.
		var oSmartTable = oController.byId(StableIdHelper.getStableId({type: "ListReportTable", subType: "SmartTable"}));
		if (oSmartTable){ // in multipleViews case (with multiple tables) currently multipleViews handler handles complete state information 
			aControlStateWrappers.push(oTemplateUtils.oCommonUtils.getControlStateWrapper(oSmartTable));
		}

		// SearchField state: Value of searchfield
		// Exists only in case of worklist. In case of worklist with multiple views with multiple tables, same is true as for SmartTable
		var oSearchField = oController.byId(StableIdHelper.getStableId({type: "ListReportAction", subType: "SearchField"}));
		if (oSearchField){
			aControlStateWrappers.push(oTemplateUtils.oCommonUtils.getControlStateWrapper(oSearchField));
		}

		var oMultipleViewsGeneralContentStateWrapper = oState.oMultipleViewsHandler.getGeneralContentStateWrapper();
		if (oMultipleViewsGeneralContentStateWrapper){
			oMultipleViewsGeneralContentStateWrapper.getLocalId = function(){
				return "$multipleViewsGeneralContent";
			};
			aControlStateWrappers.push(oMultipleViewsGeneralContentStateWrapper);
		}

		// state information not belonging to the SFB needs to be added to the variant management, if page variant management is used (setting smartVariantManagment) and not
		// hidden (setting variantManagementHidden) - otherwise, it needs to be stored directly in the appState

		if (oController.getOwnerComponent().getSmartVariantManagement() && !oController.getOwnerComponent().getVariantManagementHidden()){
			// if no page variant management or page variant hidden, everything up to here is stored directly in the iAppState (only). In that case, only SFBs state is relevant for
			// variant managment
			aPageVariantControlStateWrappers = aControlStateWrappers;
			aControlStateWrappers = [];
		}

		var oMultipleViewsSFBVariantContentStateWrapper = oState.oMultipleViewsHandler.getSFBVariantContentStateWrapper();
		if (oMultipleViewsSFBVariantContentStateWrapper){
			oMultipleViewsSFBVariantContentStateWrapper.getLocalId = function(){
				return "$multipleViewsSFBVariantContent";
			};
			aPageVariantControlStateWrappers.push(oMultipleViewsSFBVariantContentStateWrapper);
		}

		// List of handlers to react on (app or adaptation) extension state changes. Only one entry expected (handler in  SFB wrapper). Currently, extensions are only possible in
		// SFB - if extensions at other places are needed, the similar handler might differ depending on whether page variant management is used.
		var aExtensionStateChangeHandlers = []; 
		function customAppStateChange() {
			aExtensionStateChangeHandlers.forEach(function(fnHandler) {
				fnHandler();
			});
		}

		var oCustomFiltersWrapper = {
				getLocalId: function(){
					return "$customFilters";
				},
				getState: function(){
					var oState = {
							appExtension: Object.create(null),
							adaptationExtensions: Object.create(null) // collects all extension state information (as map extension-namespace -> state). Initialized on demand
					};

					if (oTemplateUtils.oComponentUtils.isDraftEnabled()){
						var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
						oState.editState = oTemplatePrivateModel.getProperty("/listReport/vDraftState");
					}

					oController.getCustomAppStateDataExtension(oState.appExtension);

					var bIsAllowed = true; // check for synchronous calls
					// the following function will be passed to all extensions. It gives them the possibility to provide their state as oAppState
					// Therefore, they must identify themselves via their instance of ControllerExtension.
					var fnSetSingleAdaptationExtensionState = function(oControllerExtension, oSingleAdaptationExtensionState){
						if (!(oControllerExtension instanceof ControllerExtension)){
							throw new FeError(sClassName, "State must always be set with respect to a ControllerExtension");
						}
						if (!bIsAllowed){
							throw new FeError(sClassName, "State must always be provided synchronously");
						}
						oState.adaptationExtensions[oControllerExtension.getMetadata().getNamespace()] = oSingleAdaptationExtensionState;
					};
					oController.templateBaseExtension.provideExtensionAppStateData(fnSetSingleAdaptationExtensionState);
					bIsAllowed = false;

					return oState;
				},
				setState: function(oState){
					if (oTemplateUtils.oComponentUtils.isDraftEnabled()){
						var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
						oTemplatePrivateModel.setProperty("/listReport/vDraftState", oState.editState);
					}

					oController.restoreCustomAppStateDataExtension(oState.appExtension);

					var bIsAllowed = true; // check for synchronous calls
					// the following function will be passed to all extensions. It gives them the possibility to retrieve their state.
					// Therefore, they must identify themselves via their instance of ControllerExtension.
					var fnGetSingleAdaptationExtensionState = function(oControllerExtension){
						if (!(oControllerExtension instanceof ControllerExtension)){
							throw new FeError(sClassName, "State must always be retrieved with respect to a ControllerExtension");
						}
						if (!bIsAllowed){
							throw new FeError(sClassName, "State must always be restored synchronously");
						}
						return oState.adaptationExtensions[oControllerExtension.getMetadata().getNamespace()];
					};
					oController.templateBaseExtension.restoreExtensionAppStateData(fnGetSingleAdaptationExtensionState);
					bIsAllowed = false;
				},
				attachStateChanged: function(fnHandler){
					if (oController.byId("editStateFilter")){
						// Remark:
						// - checking for isDraftEnabled is not enough - if filtering on draft is not supported, editStateFilter would also not be created
						// - Cleaner from architectural point of view, but not strictly needed, as SFB registers for the same event and fires filterChanged
						oController.byId("editStateFilter").attachChange(fnHandler);
					}
					// For extensionFilters, registration is needed for extension using controls not known to the SFB implementation (which is a fundamental purpose of extension!)
					// Same is valid for appExtensions and adaptationExtensions.
					aExtensionStateChangeHandlers.push(fnHandler);
				}
		};

		var oSmartFilterBarWrapper = oTemplateUtils.oCommonUtils.getControlStateWrapper(oState.oSmartFilterbar, {oCustomFiltersWrapper: oCustomFiltersWrapper});

		// theoretically, SFB's state is part of VM. But due to the direct connection between SFB and SVM, applying a variant would lead to an endless loop (selection variant as
		// part of UiState object applied to SFB also contains a variant id, which is then applied to SVM). The same connection ensures that the part of SFB's state known to the SFB
		// (standard filters) get applied automatically - we only need to take care for custom filters. Therefore, oCustomFiltersWrapper is added to aPageVariantControlStateWrappers
		// (which is used to get and set the state if variant is saved/loaded)
		// However, for iAppState case, SVM wrapper also needs to contain SFB wrapper (and not oCustomFiltersWrapper directly)


		// DynamicPage state: header pinned
		var oDynamicPage = oController.byId(StableIdHelper.getStableId({type: "ListReportPage", subType: "DynamicPage"}));
		// TODO: Discuss: should this state (header pinned) be part of variant (only page variant or SFB variant)? Assumption: no
		var oDynamicPageWrapper = oTemplateUtils.oCommonUtils.getControlStateWrapper(oDynamicPage);
		aControlStateWrappers.push(oDynamicPageWrapper);

		// SmartVariantManagement state: Selected Variant and whether it's dirty, including wrappers for managed controls (all controls, for which the corresponding state
		// information should be part of the variant)
		// Due to direct connection between SVM and SFB, also their wrappers need to each other directly. Remarks:
		// - The connection between the controls is established on SFB side (which is easier, as one property is sufficient), the connection between the wrappers is established on
		//		SVM side (which is cleaner architecture, as the SVM rather manages the SFB)
		// - Here, only the connection is established. All workarounds needed due to the broken connection should be build into the wrappers
		var oSmartVariantManagement = oState.oSmartFilterbar.getSmartVariant();
		if (oSmartVariantManagement){
			var oSmartVariantManagementWrapper = oTemplateUtils.oCommonUtils.getControlStateWrapper(oSmartVariantManagement, {
				managedControlWrappers: aPageVariantControlStateWrappers.concat([oSmartFilterBarWrapper]),
				dynamicPageWrapper: oDynamicPageWrapper
			});
			aControlStateWrappers.push(oSmartVariantManagementWrapper);
		} else {
			aControlStateWrappers.push(oSmartFilterBarWrapper);
		}


		// Wrapper to control whether data is loaded
		
		function fnGetDataLoadedWrapper(){
			// Wrapper to control whether data is expected to be loaded - controls the state, but does not trigger loading data on restore!
			var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
			// initial state:
			// - startup with iAppState: anyway setState will be called
			// - other startup cases: applyInitialLoadBehavior calls setState explicitly
			// - navigation
			
			function fnSetState(bState){
				oTemplatePrivateModel.setProperty("/generic/bDataAreShownInTable", bState);
			}
			
			function fnGetState(){
				return oTemplatePrivateModel.getProperty("/generic/bDataAreShownInTable");
			}
			
			function fnSetDataShown(bDataShown, fnHandler){
				if (bDataShown === fnGetState()){
					return;
				}
				fnSetState(bDataShown);
				fnHandler();
			}
			
			return {
				getLocalId: function(){
					return "$dataLoaded";
				},
				setState: fnSetState,
				getState: fnGetState,
				attachStateChanged: function(fnHandler){
					// changing from data not loaded to data loaded: 
					// - when SFB triggers search
					oState.oSmartFilterbar.attachSearch(fnSetDataShown.bind(null, true, fnHandler));

					// changing from data loaded to not loaded:
					// - when filter changes
					//		Todo: check necessity to check for livemode - apparently, search event would always be triggered...
					//		TODO: rethink, whether attaching to event of SmartFilterBarWrapper would be better
					//			pro: 	- also for custom filters (the SFB does not know about)
					//					- not when applying state to SFB
					//			contra: could there be other changes from SFB?
					oState.oSmartFilterbar.attachFilterChange(fnSetDataShown.bind(null, false, fnHandler));
				}
			};
		}
		
		var oDataLoadedWrapper = fnGetDataLoadedWrapper();
		aControlStateWrappers.push(oDataLoadedWrapper);
//		oDataLoadedWrapper.attachStateChanged(changeIappState);

		// attach to change event of all wrappers handled directly - others should be propagated through the managing control wrapper (currently a SmartVariantManagementWrapper)
		aControlStateWrappers.forEach(function(oWrapper){
			oWrapper.attachStateChanged(changeIappState);
		});

		// *** setup wrappers for control states (end)

		var oNavigationHandler = oTemplateUtils.oServices.oApplication.getNavigationHandler();
		var bSmartVariantManagement = oController.getOwnerComponent().getSmartVariantManagement();

		var oSettings = oTemplateUtils.oComponentUtils.getSettings();

		oState.oSmartFilterbar.setSuppressSelection(true);
		var bInitialisation = true; // This flag depicts the initial state of the application. It would be changed once the appState is added to the application.

		function fnSetDataShownInTable(bDataShown) {
			oDataLoadedWrapper.setState(bDataShown);
		}

		function areDataShownInTable(){
			var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
			return oTemplatePrivateModel.getProperty("/generic/bDataAreShownInTable");
		}

		// trigger loading data
		// This method is NOT intended to do any checks to analyze, whether loading data is actually needed - that should be done before
		function loadData(){
			oState.oSmartFilterbar.search();
		}

		function getCurrentAppState() {

			var mControlStates = {};
			aControlStateWrappers.forEach(function(oWrapper){
				if (oWrapper.getLocalId()){
					mControlStates[oWrapper.getLocalId()] = oWrapper.getState();
				}
			});

			return {
				version: sap.ui.version, // storing creation version of appState to allow better mapping for future structure changes
				controlStates: mControlStates
			};
		}

		function handleEditingStatusFilterPassedViaURLParams(oNewUrlParameters) {
			// to handle editing status FE generated custom filter
			if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
				var aDraftState = oNewUrlParameters['IsActiveEntity'];
				if (aDraftState && aDraftState[0]) {
					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					oTemplatePrivateModel.setProperty("/listReport/vDraftState", aDraftState[0]);
				}
			}
		}

		function handleVariantIdPassedViaURLParams(oNewUrlParameters) {
			if (bSmartVariantManagement) {
				var sPageVariantId = oNewUrlParameters['sap-ui-fe-variant-id'];
				if (sPageVariantId && sPageVariantId[0]) {
					oSmartVariantManagement.setCurrentVariantId(sPageVariantId[0]);
				}
			} else {
				var aPageVariantId = oNewUrlParameters['sap-ui-fe-variant-id'],
				aFilterBarVariantId = oNewUrlParameters['sap-ui-fe-filterbar-variant-id'],
				aChartVariantId = oNewUrlParameters['sap-ui-fe-chart-variant-id'],
				aTableVariantId = oNewUrlParameters['sap-ui-fe-table-variant-id'];

				applyControlVariantId(aFilterBarVariantId && aFilterBarVariantId[0], aChartVariantId && aChartVariantId[0], aTableVariantId && aTableVariantId[0], aPageVariantId && aPageVariantId[0]);
			}
		}
		function applyControlVariantId(sFilterBarVariantId, sChartVariantId, sTableVariantId, sPageVariantId) {
			if (sFilterBarVariantId || sPageVariantId) {
				oSmartVariantManagement.setCurrentVariantId(sFilterBarVariantId || sPageVariantId);
			}

			if (sTableVariantId || sPageVariantId) {
				oState.oPresentationControlHandler.setCurrentVariantId(sTableVariantId || sPageVariantId);
				oState.oMultipleViewsHandler.setControlVariant(sChartVariantId, sTableVariantId);
			}
		}

		// method is responsible for retrieving custom filter state. The corresponding extension-method has a more generic name
		// for historical reasons (change would be incompatible).
		function fnRestoreCustomFilterState(oCustomData) {
			oController.restoreCustomAppStateDataExtension(oCustomData || {});
		}

		// the search is automatically performed by the SmartTable so we only need to
		// - ensure that all cached data for the object pages are refreshed, too
		// - update our internal state (data are shown in table) - ideally should be done in oDataLoadedWrapper, but currently not possible for keyboard shortcut usage
		// - Collapse of filter bar once user press Go (only for phone device)
		function onSearchPressed() {
			// if SFB does not allow search, no need to adapt anything
			if (!isSearchAllowed()){
				return;
			}
			oState.refreshModel();
			// TODO: should this be handled by dynamicPageWrapper solely?
			if (Device.system.phone) {
				collapseHeader();
			}
			// Ideally, oDataLoadedWrapper should ensure to keep its state correct. However, currently we have no means to attach to the command - i.e. oDataLoadedWrapper only 
			// attaches to SFB's search event, which is only triggered when user presses the go button. When keyboard shortcut is used instead, this handler would be called (as it
			// is attached to the command), but SFB's search event would not be triggered. As workaround, we additionally set data loaded state to true here and inform explicitly
			// the the state has changed.
			// TODO: remove this workaround, if a better solution (to attach to the command in the wrapper) is available
			// Remark: The same reason also causes a problem in multiple tables case: Here the shortcut currently does not trigger the search at all!
			oDataLoadedWrapper.setState(true);
			changeIappState();
		}

		// It is responsible for:
		// - triggering the creation of a new appState
		function changeIappState(){
			fnLogInfo("changeIappState called", {
				bDataAreShownInTable: areDataShownInTable()
			});
			// don't consider filter changes while the dialog is open or the application is in initial state
			if (oState.oSmartFilterbar.isDialogOpen() || bInitialisation) {
				return;
			}
			oTemplateUtils.oComponentUtils.stateChanged();
		}

		/*
		The function is to add default values in Display Currency parameter if it is not there in the Selection Variant
        @param {object} Selection Variant
`		@param {object} App data
		 */
		function addDisplayCurrency(oAppData) {
			var aMandatoryFilterItems = oState.oSmartFilterbar.determineMandatoryFilterItems(),
			sDisplayCurrency;
			for (var item = 0; item < aMandatoryFilterItems.length; item++) {
				if (aMandatoryFilterItems[item].getName().indexOf("P_DisplayCurrency") !== -1) {
					if (oAppData.oDefaultedSelectionVariant.getSelectOption("DisplayCurrency") && oAppData.oDefaultedSelectionVariant.getSelectOption("DisplayCurrency")[0]
						&& oAppData.oDefaultedSelectionVariant.getSelectOption("DisplayCurrency")[0].Low) {
						sDisplayCurrency = oAppData.oDefaultedSelectionVariant.getSelectOption("DisplayCurrency")[0].Low;
						if (sDisplayCurrency) {
							oAppData.oSelectionVariant.addParameter("P_DisplayCurrency", sDisplayCurrency);
						}
					}
					break;
				}
			}
		}

		// Checks, whether search is allowed from SFB point of view, i.e. if calling the search on SFB will actually trigger a request
		function isSearchAllowed() {
			// Unfortunately, SFB's method verifySearchAllowed does not only check, but also marks filters as erroneous. This is not wanted here - we need to know beforehand, whether
			// triggering a search would be possible or not.
			
			// Workaround: Checking ourselves, whether all mandatory filters are filled
			// Drawback:
			// - duplicate implementation
			// - missing to check any other (existing or future) possible reason for prohibiting the search
			// TODO: should be replaced, as soon as functionality is provided from SFB (either via checkOnly-parameter in verifySearchAllowed, or as a new method isSearchAllowed)
			var aMandatoryFilterItems = oState.oSmartFilterbar.determineMandatoryFilterItems();
			var aFiltersWithValues = oState.oSmartFilterbar.getFiltersWithValues();

			return aMandatoryFilterItems.every(function(sItem) {
				return aFiltersWithValues.includes(sItem);
			});
		}
		
		/*
			This method is called when an LR app is the target of an external navigation and the XAppState data contains a presentationVariant.
			The sorting from this presentationVariant is then applied to the table.

			To achieve this, we fetch the UiState of the table and add the sort order from the app state to the presentationvariant in the UiState.
			All the other information in the PresentationVariant(ex. RequestAtLeast, Visualizations etc) remains as is.
		 */
		function setControlSortOrder(vPresentationVariant) {
			//PresentationVariant coming from the navigation context could either be a string or an object.
			var oPresentationVariant = typeof vPresentationVariant === "string" ? JSON.parse(vPresentationVariant) : vPresentationVariant;
			var aNavigationSortOrder = oPresentationVariant && oPresentationVariant.SortOrder;
			oState.oPresentationControlHandler.applyNavigationSortOrder(aNavigationSortOrder);
		}

		function fnAdaptToAppStateIappState(oAppData){

			fnAdaptOtherControlsToAppState(oAppData.controlStates);
			if (areDataShownInTable()){
				// fnAdaptOtherControlsToAppState only (synchronously) sets the state including the information whether data should be loaded - if this is the case, the actual loading
				// (which happens asynchronous of course) still needs to be triggered 
				loadData();
			} else {
				// hide placeholder already here, if no data is to be loaded - in case data is loaded, it will be hidden in data received event
				oTemplateUtils.oComponentUtils.hidePlaceholder();
			} 
			
			// special case: when restoring an old app state with data loaded, but in the meantime a filter not set in that state has been changed to mandatory, SFB.search would not
			// trigger a request (but instead only mark that filter) - thus hiding placeholder now to avoid it to stay forever
			// TODO: refactor: Still in that case our internal data shows data are loaded - ideally, that should not be the case
			if (!isSearchAllowed()){
				oTemplateUtils.oComponentUtils.hidePlaceholder();
			}

		}

		function fnAdaptToAppStateNavigation(oAppData, oURLParameters, sPreferredQuickVariantSelectionKey){
			handleVariantIdPassedViaURLParams(oURLParameters);
			handleEditingStatusFilterPassedViaURLParams(oURLParameters);
			//Apply sort order coming from the XAppState to the smart table.
			if (oAppData.presentationVariant !== undefined) {
				setControlSortOrder(oAppData.presentationVariant);
			}
			if ((oAppData.oSelectionVariant.getSelectOptionsPropertyNames().indexOf("DisplayCurrency") === -1) && (oAppData.oSelectionVariant.getSelectOptionsPropertyNames().indexOf("P_DisplayCurrency") === -1) && (oAppData.oSelectionVariant.getParameterNames().indexOf("P_DisplayCurrency") === -1)) {
				addDisplayCurrency(oAppData);
			}
			var oStartupObject = {
					viaExternalNavigation: true,
					selectionVariant: oAppData.oSelectionVariant,
					urlParameters: oURLParameters,
					selectedQuickVariantSelectionKey: sPreferredQuickVariantSelectionKey,
					// incase semantic date field is present, parseNavigation returns semanticDates in stringified format and otherwise an empty object
					semanticDates: (typeof oAppData.semanticDates === "string" ? JSON.parse(oAppData.semanticDates) : oAppData.semanticDates) || {}
			};
			// if there is a navigation from external application to worklist,
			// the filters from external application should not be applied since the worklist does not show smartfilterbar
			// and there is no way for the user to modify the applied filters. Hence not applying the filters only if it is worklist
			if (!oState.oWorklistData.bWorkListEnabled) {
				// Call the extension to modify selectionVariant or semanticDates or set tab for NavType !== iAppState as iAppState would have the modified SV values
				// or saved selected tab and hence there is no need to modify them again
				oController.modifyStartupExtension(oStartupObject);

				if (oState.oSmartFilterbar.isCurrentVariantStandard()) {
					oStartupObject.semanticDates = semanticDateRangeTypeHelper.addSemanticDateRangeDefaultValue(oSettings, oState.oSmartFilterbar, oStartupObject.semanticDates, oStartupObject.urlParameters || {});
					// Smart filter bar all the filters will be replaced by the one which are coming from oUiState build base of oSelectionVariant where the Semantic Date Default Values
					// is missing and because of that the values are replaced. Hence adding the semantic Dates to oSelectionVariant as mentioned by the Smart Control Colleague in the mentioned BCP
					oStartupObject.semanticDates.Dates.forEach(function(oSelectDateOption){
						oStartupObject.selectionVariant.addSelectOption(oSelectDateOption.PropertyName, "I", "EQ", "");
					});
				}
				fnApplySelectionVariantToSFB(oStartupObject.selectionVariant, oAppData.selectionVariant || "", true, oStartupObject.semanticDates, false);
			}

			// ensure to call restoreCustomAppStateDataExtension for compatibility
			fnRestoreCustomFilterState();

			oState.oMultipleViewsHandler.handleStartUpObject(oStartupObject);

			// In navigation case, data should be loaded in general unless variant is provided in navigation parameters - in that case, setting of that variant should win.
			// Remark: Implemented logic does not fully reflect this: If navigation parameter exists but points to the standard variant, still the initial startup logic applies.
			applyInitialLoadBehavior(/* bDataLoadCausedByNavigation = */ oState.oSmartFilterbar.isCurrentVariantStandard());
		}


		function fnAdaptToAppStateStartUpInitial(oURLParameters, sPreferredQuickVariantSelectionKey){
			handleVariantIdPassedViaURLParams(oURLParameters);

			//oStartupObject to be passed to the extension where urlParameters and selectedQuickVariantSelectionKey are optional
			var oStartupObject = {
					viaExternalNavigation: false,
					selectionVariant: "",
					urlParameters: oURLParameters, // can only contain "technical" parameters (starting with "sap-")
					selectedQuickVariantSelectionKey: sPreferredQuickVariantSelectionKey,
					// in case semantic date field is present, parseNavigation returns semanticDates in stringified format and otherwise an empty object
					semanticDates:  {}
			};
			var oSFBUiState = oState.oSmartFilterbar.getUiState();
			var oSFBSelectionVariant = new SelectionVariant(JSON.stringify(oSFBUiState.getSelectionVariant()));

			// this condition is used to modify selection variant or semantic date when sNavType is initial.
			// do not expose generic and custom data through ext for modification
			fnRemoveCustomAndGenericData(oSFBSelectionVariant);
			var oSFBSelectionVariantCopy = JSON.parse(JSON.stringify(oSFBSelectionVariant));

			var oSFBSemanticDates = oSFBUiState.getSemanticDates();
			oStartupObject.selectionVariant = oSFBSelectionVariant;
			oStartupObject.semanticDates = oSFBSemanticDates;
			oController.modifyStartupExtension(oStartupObject);
			if (!(deepEqual(JSON.parse(JSON.stringify(oStartupObject.selectionVariant)), oSFBSelectionVariantCopy) && deepEqual(oStartupObject.semanticDates, oSFBSemanticDates))) {
				fnApplySelectionVariantToSFB(oStartupObject.selectionVariant, "", true, oStartupObject.semanticDates, true);
			}

			// ensure to call restoreCustomAppStateDataExtension for compatibility
			fnRestoreCustomFilterState();

			oState.oMultipleViewsHandler.handleStartUpObject(oStartupObject);

			// first two parts of condition are probably wrong here and just happened to be considered because logic to set default values for semantic date range fields was added
			// here because of third part of condition. Anyway this is wrong - defaults need to be set in onSmartFilterBarInitialise
			if (!oState.oWorklistData.bWorkListEnabled && !oState.oSmartFilterbar.getLiveMode() && oState.oSmartFilterbar.isCurrentVariantStandard()) {
				// Todo: This logic seems to be broken for 3 reasons:
				// - changing oStartuoObject here does not have any effect - the places where it's used are above (modifyStartupExtension and
				//		oMultipleViewsHandler.handleStartUpObject)
				// - semanticDateRangeTypeHelper.addSemanticDateRangeDefaultValue does not only return sth., but also sets sth. to the SFB - so what's the (single!) purpose of that
				//		method?
				// - setting default values to the SFB (which appears to be the case here) has to be done in onSmartFilterBarInitialise - otherwise, they don't get part of the
				//		standard variant (but it gets rather marked as modified - obviously not expected in initial startup)


				// check for the default value if set on semantic data range
				oStartupObject.semanticDates = semanticDateRangeTypeHelper.addSemanticDateRangeDefaultValue(oSettings, oState.oSmartFilterbar, oStartupObject.semanticDates || {}, oStartupObject.urlParameters);

				// Smart filter bar all the filters will be replaced by the one which are coming from oUiState build base of oSelectionVariant where the Semantic Date Default Values
				// is missing and because of that the values are replaced. Hence adding the semantic Dates to oSelectionVariant as mentioned by the Smart Control Colleague in the mentioned BCP
				oStartupObject.semanticDates.Dates.forEach(function(oSelectDateOption){
					oStartupObject.selectionVariant.addSelectOption(oSelectDateOption.PropertyName, "I", "EQ", "");
				});
			}

			applyInitialLoadBehavior();

			//Set the variant to clean when the user has not altered the filters on the initial load of the app(no navigation context).
			oSmartVariantManagement && oSmartVariantManagement.currentVariantSetModified(false);
		}

		function fnArrayContainsSameEnteries(aFirstComparate, aSecondComparate) {
			return deepEqual(aFirstComparate.map(JSON.stringify).sort(), aSecondComparate.map(JSON.stringify).sort());
		}

		function fnAdaptToAppStateStartUpWithParameters(oAppData, oURLParameters, sPreferredQuickVariantSelectionKey){
			handleVariantIdPassedViaURLParams(oURLParameters);

			//oStartupObject to be passed to the extension where urlParameters and selectedQuickVariantSelectionKey are optional
			var oStartupObject = {
					viaExternalNavigation: false,
					selectionVariant: oAppData.oSelectionVariant,
					urlParameters: oURLParameters,
					selectedQuickVariantSelectionKey: sPreferredQuickVariantSelectionKey,
					// incase semantic date field is present, parseNavigation returns semanticDates in stringified format and otherwise an empty object
					semanticDates: (typeof oAppData.semanticDates === "string" ? JSON.parse(oAppData.semanticDates) : oAppData.semanticDates) || {}
			};
			//Apply sort order coming from the XAppState to the smart table.
			if (oAppData.presentationVariant !== undefined) {
				setControlSortOrder(oAppData.presentationVariant);
			}
			var oSFBUiState = oState.oSmartFilterbar.getUiState();
			var oSFBSelectionVariant = new SelectionVariant(JSON.stringify(oSFBUiState.getSelectionVariant()));
			fnRemoveCustomAndGenericData(oSFBSelectionVariant);
			var oSFBSelectionVariantCopy = JSON.parse(JSON.stringify(oSFBSelectionVariant));
			var oSFBSemanticDates = oSFBUiState.getSemanticDates();
			if ((oAppData.oSelectionVariant.getSelectOptionsPropertyNames().indexOf("DisplayCurrency") === -1) && (oAppData.oSelectionVariant.getSelectOptionsPropertyNames().indexOf("P_DisplayCurrency") === -1) && (oAppData.oSelectionVariant.getParameterNames().indexOf("P_DisplayCurrency") === -1)) {
				addDisplayCurrency(oAppData);
			}
			// if there is a navigation from external application to worklist,
			// the filters from external application should not be applied since the worklist does not show smartfilterbar
			// and there is no way for the user to modify the applied filters. Hence not applying the filters only if it is worklist
			if (!oState.oWorklistData.bWorkListEnabled) {
				// Call the extension to modify selectionVariant or semanticDates or set tab for NavType !== iAppState as iAppState would have the modified SV values
				// or saved selected tab and hence there is no need to modify them again
				if (oState.oSmartFilterbar.isCurrentVariantStandard()) {
					// given variant has only default values (set by user in FLP), and variant (already loaded) is not user specific
					// => default values have to be added without removing existing values (but overriding them if values for the same filter exist)
					// in case of modify extension, if given variant has only default values, if these values are modified through extension,
					// then they will be replaced in the filterbar accordingly
					oController.modifyStartupExtension(oStartupObject);

					oStartupObject.semanticDates = semanticDateRangeTypeHelper.addSemanticDateRangeDefaultValue(oSettings, oState.oSmartFilterbar, oStartupObject.semanticDates, oStartupObject.urlParameters);
					// Smart filter bar all the filters will be replaced by the one which are coming from oUiState build base of oSelectionVariant where the Semantic Date Default Values
					// is missing and because of that the values are replaced. Hence adding the semantic Dates to oSelectionVariant as mentioned by the Smart Control Colleague in the mentioned BCP
					oStartupObject.semanticDates.Dates.forEach(function(oSelectDateOption){
						oStartupObject.selectionVariant.addSelectOption(oSelectDateOption.PropertyName, "I", "EQ", "");
					});

					/* If there are user default value(s) set from FLP settings, standard variant should be set to dirty.
					   However, in cases where standard variant's properties has the same value as in the startup parameters, then user default value(s) would
					   have no effect on the standard variant and thus, it should be clean. */
					var aFilterItemNames = oState.oSmartFilterbar.getAllFilterItems().map(function (oFilterItem) {
						return oFilterItem.getName();
					});

					var fnFilterItemExists = function (oSelectOption) {
						return aFilterItemNames.includes(oSelectOption.PropertyName);
					};
					var aParameterNames = oState.oSmartFilterbar.getAnalyticalParameters().map(function (oParameter) {
						return oParameter.name;
					});

					var fnParameterExists = function (oParameter) {
						return aParameterNames.includes(oParameter.PropertyName);
					};

					var oTargetSelectionVariant = listUtils.getMergedVariants([oSFBSelectionVariant, oStartupObject.selectionVariant]);
					var aTargetSelectionVariantJSON = oTargetSelectionVariant.toJSONObject();

					var oSFBSelectionVariantJSON = oSFBSelectionVariant.toJSONObject();
					if (
							!fnArrayContainsSameEnteries(oSFBSelectionVariantJSON.SelectOptions.filter(fnFilterItemExists), aTargetSelectionVariantJSON.SelectOptions.filter(fnFilterItemExists)) ||
							!fnArrayContainsSameEnteries(oSFBSelectionVariantJSON.Parameters.filter(fnParameterExists), aTargetSelectionVariantJSON.Parameters.filter(fnParameterExists))
					) {
						fnApplySelectionVariantToSFB(oTargetSelectionVariant, oAppData.selectionVariant, true, oStartupObject.semanticDates, false);
						oSmartVariantManagement.currentVariantSetModified(true);
					}
				} else {
					oStartupObject.selectionVariant = oSFBSelectionVariant;
					oStartupObject.semanticDates = oSFBSemanticDates;
					oController.modifyStartupExtension(oStartupObject);
					// only if the extension modifies the selection variant or the semanticDates, then set it to smart filter bar again
					if (!(deepEqual(JSON.parse(JSON.stringify(oStartupObject.selectionVariant)), oSFBSelectionVariantCopy) && deepEqual(oStartupObject.semanticDates, oSFBSemanticDates))) {
						fnApplySelectionVariantToSFB(oStartupObject.selectionVariant, oAppData.selectionVariant, true, oStartupObject.semanticDates, false);
					}
				}
			}

			// ensure to call restoreCustomAppStateDataExtension for compatibility
			fnRestoreCustomFilterState();

			oState.oMultipleViewsHandler.handleStartUpObject(oStartupObject);

			applyInitialLoadBehavior();
		}


		// This method is called asynchronously from fnParseUrlAndApplyAppState in case of external navigation (xAppState or UrlParameters) or initial startup
		// as soon as the appstate-information from the url has been parsed completely.
		// In case of  restoring from iAppState, it's called by applyState, which is in turn called from statePreserver, that
		// already takes care of not trying to apply an appstate that is not valid anymore.
		// task of this method is (now always when it's called!) only to adapt the state of all relevant controls to the provided one
		function fnAdaptToAppState(oAppData, oURLParameters, sNavType){
			fnLogInfo("fnAdaptToAppState called", {
				sNavType: sNavType
			});

			// Remark: within SVM Wrapper, setSuppressSelection is also used - be aware, that this must not be overlapping (as in both cases we set back to fixed-value false)
			oState.oSmartFilterbar.setSuppressSelection(false);
			bInitialisation = false;
			// separate 3 different cases
			// - restore from iAppState
			// - adapt to navigation parameters
			// - initial startup from scratch (including parameters provided from FLP!)
			if (sNavType === sap.ui.generic.app.navigation.service.NavType.iAppState){ // first case is the simplest -> take everything from IappState
				fnAdaptToAppStateIappState(oAppData);
				return;
			}
			// Now come to the two other use-cases
			// First determine the preferred key for multi view scenarios. This may depend on the entity set the main object page was opened berfore (if this is the case).
			var oSelectionInfo = oTemplateUtils.oComponentUtils.getSelectionInfo();
			var sPreferredEntitySet = oSelectionInfo && oSelectionInfo.pageEntitySet;
			var sPreferredQuickVariantSelectionKey = oState.oMultipleViewsHandler.getPreferredKey(sPreferredEntitySet);

			switch (sNavType){
			case sap.ui.generic.app.navigation.service.NavType.initial:
				// "technical" URL parameters are possible even in that case. NavigationHandler treats everything starting with "sap-" as technical.
				// some of them (at least 'sap-ui-fe*variant-id') are relevant
				fnAdaptToAppStateStartUpInitial(oURLParameters, sPreferredQuickVariantSelectionKey);
				break;
			case sap.ui.generic.app.navigation.service.NavType.xAppState:
			case sap.ui.generic.app.navigation.service.NavType.URLParams:
				if (oAppData.bNavSelVarHasDefaultsOnly){
					fnAdaptToAppStateStartUpWithParameters(oAppData, oURLParameters, sPreferredQuickVariantSelectionKey);
				} else {
					fnAdaptToAppStateNavigation(oAppData, oURLParameters, sPreferredQuickVariantSelectionKey);
				}
				break;
			default:
				throw new FeError(sClassName, "Invalid navigation type: " + sNavType);
			}
			
			// common to all startup cases (except iAppState)
			if (areDataShownInTable()){
				// trigger search if needed
				oState.oSmartFilterbar.search();
				// For desktop devices, expand the header for Standard and Custom variants and for tablet and mobile devices, 
				// collapse the header only if search is triggered.
				if (Device.system.desktop) {
					oTemplateUtils.oCommonUtils.getControlStateWrapper(oController.byId(StableIdHelper.getStableId({type: "ListReportPage", subType: "DynamicPage"}))).setHeaderState(oController, true);
				} else {
					collapseHeader();
				}
			} else {
				// if no data are loaded, place holder has to be hidden now - otherwise it will be hidden when data is received 
				oTemplateUtils.oComponentUtils.hidePlaceholder();
			}
			
			// ensure first iAppState is created
			changeIappState();
		}

		function fnAdaptOtherControlsToAppState(mControlsStates) {
			// adapt controls according to current implementation
			// Information in state could actually differ (if state originates from old release, change in FE or app layer). Additional information in state should be ignored,
			// missing information should lead to set initial state (which wrappers should do if called with undefined)
			aControlStateWrappers.forEach(function(oWrapper){
				oWrapper.setState(mControlsStates[oWrapper.getLocalId()]);
			});
		}

		function applyState(oState){
			if (!oState) {
				// no iAppState key in Url, that means
				// - we are definitely in startUp case (while navigating inside the app, there's always an appState - even if it cannot be stored)
				// - there might be other parameters (URL parameters or xAppSate), so we need to call navigationHandler to parse the URL
				// Remark: in case of an appState key in the URL, that could not be analyzed, we should NOT call navigationHandler to parse. In this case, we get an empty object
				// (in contrast to undefined when there's no appstate key)

				return oSmartFilterBarInitializedPromise.then(fnParseUrlAndApplyAppState); // return promise to inform controller, when startup is finished
			}

			var sNavType;
			if (isEmptyObject(oState)){
				sNavType = sap.ui.generic.app.navigation.service.NavType.initial;
			} else {
				sNavType = sap.ui.generic.app.navigation.service.NavType.iAppState;
				// transfer state to most current version - assuming overriding here will not harm
				oState = oLegacyStateHandler.getStateInCurrentFormat(oState);
			}

			// enhance appData to the format needed by fnAdaptToAppState
			var oAppData = extend({
				oDefaultedSelectionVariant: new SelectionVariant(), // only accessed to check for P_DisplayCurrency - can this be relevant?
				oSelectionVariant: new SelectionVariant(oState && oState.selectionVariant)  // -> oSelectionVariant
			}, oState);
			oSmartFilterBarInitializedPromise.then(function(){
				// fallback to navType initial, if appState is given in URL, but could not be analyzed => oState is an empty Object
				fnAdaptToAppState(oAppData, {} /* URLparameter are irrelevant if restoring from iAppState */, sNavType);
			});
			return oSmartFilterBarInitializedPromise; // to inform controller, when startup is finished
		}

		function fnParseUrlAndApplyAppState(){
			var oRet = new Promise(function(fnResolve){
				try {
					var oParseNavigationPromise = oNavigationHandler.parseNavigation();
					oParseNavigationPromise.done(function(oAppData, oURLParameters, sNavType){
						if (sNavType !== sap.ui.generic.app.navigation.service.NavType.iAppState) { // handled via state preserver
							// navType initial has also to be handled here, as in that case the call from state preserver happens to early (we don't even know
							// at that time, whether navtype is initial, URLparams or xAppState when started from FLP with user default values set)
							fnAdaptToAppState(oAppData, oURLParameters, sNavType);
						}
						fnResolve();
					});
					oParseNavigationPromise.fail(function(oNavError, oURLParameters, sNavType){
						/* Parsing app state has failed, so we cannot set the correct state
						 * But at least we should get into a consistent state again, so the user can continue using the app
						 */
						oLogger.warning(oNavError.getErrorCode() + "app state could not be parsed - continuing with empty state");
						 // Use NavType initial, as this will enforce selection in case auto-binding is true.
						fnAdaptToAppState({}, oURLParameters, sap.ui.generic.app.navigation.service.NavType.initial);
						fnResolve();
					});
				} catch (oError){
					// method is called only, if no iAppState key in URL
					// possible error case could be a URL with xAppState key, but no iAppState key (navigation from non FE-app, or very old bookmark), and no ushell-Service available
					// TODO: verify, whether this can happen and how to deal with it
					fnAdaptToAppState({}, {}, sap.ui.generic.app.navigation.service.NavType.initial); // Use NavType initial, as this will enforce selection in case auto-binding is true.
					fnResolve();
				}
			});
			return oRet;
		}

		function fnRestoreExtendedFilterDataOnAfterSFBVariantLoad(oEvent){
			// Only difference in worklist: any change, i.e. also loading a variant, has to directly trigger a new request.
			// If we apply variant (as per appState), don't trigger search here, but later from appState restoring itself
			if (oState.oWorklistData.bWorkListEnabled && oEvent.getParameter("context") !== "SET_VM_ID") {
				loadData();
			}
		}

		function onAfterSFBVariantLoad(oEvent) {
			// event is fired whenever SFB needs to load a variant, which can happen in different situations. According to SFB, these can be differentiated by the parameter "context"
			// in the following way:
			// context			situation (according to SFB)														own observation
			// "CANCEL"			user uses cancel in adapt filters dialog											only when changes done before, also in UI adaptation
			// "RESET"			user uses reset in adapt filters dialog
			// "SET_VM_ID"		API SmartVariantManagemnet.setCurrentVariantId is called
			// "DATA_SUITE"		API SFB.setUiState is called														only if selection variant in ui state has an id (different from "")
			// "INIT"			initialization of SmartVariantMAnagement if default variant is not standard
			// "KEY_USER"		UI adaptation																		when user leaves adapt filter dialog with "ok" in UI adaptation
			// undefined		all other cases																		when user selects a different variant

			// VM takes part in appState in two roles
			// a) controlling the state of different controls (SFB)
			// b) with its own state (selected variant and dirty indicator) being part of iAppState

			// regarding a), while SFB takes care to set the data for standard filters (created via annotation), for others (extension filters, edit state filter, anything else that
			// should be controlled by VM (currently anything else we add to iAppState, but maybe that's only correct in case of page variant management)) we have to set it
			// (independent of the context).
			fnRestoreExtendedFilterDataOnAfterSFBVariantLoad(oEvent);
		}

		// collapse dynamic header - conditions are checked at calling places
		function collapseHeader(){
			var oTemplatePrivateModel = oController.getOwnerComponent().getModel("_templPriv");
			// Remark: this property is never set to true programmatically - only if user expands the header explicitly via 2-way-binding
			oTemplatePrivateModel.setProperty("/listReport/isHeaderExpanded", false);
		}

		/* This function calls the setUiState API of smartfilterbar to set the Ui State
		 * @param  {object} oSelectionVariant -  Selection variant object
		 * @param {boolean} bReplace -  Property bReplace decides whether to replace existing filter data
		 * @param {boolean} bStrictMode - Defines the filter/parameter determination, based on the name.
		 */
		function fnSetFiltersUsingUIState(oSelectionVariant, bReplace, bStrictMode, oSemanticDates) {
			var oUiState = new UIState({
				selectionVariant : oSelectionVariant,
				semanticDates: oSemanticDates
			});
			oState.oSmartFilterbar.setUiState(oUiState, {
				replace: bReplace,
				strictMode: bStrictMode
			});
		}

		/*
		The function removes superfluos Custom and Generic data from the SelectVariant (these dataproperies are meant only for the _custom data in iAppState)
		@param {object} Selection Variant
		 */
		function fnRemoveCustomAndGenericData(oSelectionVariant) {
			[dataPropertyNameExtension, dataPropertyNameCustom, dataPropertyNameGeneric].forEach(oSelectionVariant.removeSelectOption.bind(oSelectionVariant));
		}

		/**
		 * This function apply selection properties to the smart filter bar
		 * @param  {object} oSelectionVariant
		 * @param  {string} sSelectionVariant
		 * @return {void}
		 */
		function applySelectionProperties(oSelectionVariant, sSelectionVariant, bNavTypeInitial) {
			// even when the nav type is initial, due to modifystartup extension,new fields can be added to smartfilterbar
			if (oSelectionVariant && (sSelectionVariant !== "" || bNavTypeInitial)){
				var aSelectionVariantProperties = oSelectionVariant.getParameterNames().concat(
						oSelectionVariant.getSelectOptionsPropertyNames());
				for (var i = 0; i < aSelectionVariantProperties.length; i++) {
					oState.oSmartFilterbar.addFieldToAdvancedArea(aSelectionVariantProperties[i]);
				}
			}
		}

		// map property values for property with name sFirstProperty to values for property with name sSecondProperty in oSelectionVariant
		function fnAlignSelectOptions(oSelectionVariant, sFirstProperty, sSecondProperty){
			if (oSelectionVariant.getParameter(sFirstProperty) && !oSelectionVariant.getParameter(sSecondProperty)){
				oSelectionVariant.addParameter(sSecondProperty, oSelectionVariant.getParameter(sFirstProperty));
			}
			if (oSelectionVariant.getSelectOption(sFirstProperty) && !oSelectionVariant.getSelectOption(sSecondProperty)){
				var aSelectOption = oSelectionVariant.getSelectOption(sFirstProperty);
				aSelectOption.forEach(function(oSelectOption){
					oSelectionVariant.addSelectOption(sSecondProperty, oSelectOption.Sign, oSelectOption.Option, oSelectOption.Low, oSelectOption.High);
				});
			}
		}

		function fnMapEditableFieldFor(oSelectionVariant){
			var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();
			var sEntitySet = oController.getOwnerComponent().getEntitySet();
			var oEntityType = oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(sEntitySet).entityType);
			oEntityType.property.forEach(function(oProperty){
				if (oProperty["com.sap.vocabularies.Common.v1.EditableFieldFor"]){
					// annotation property names follow their type, so PropertyPath is the right property to look at - String has to be supported for compatibility reasons
					var sKeyProperty = oProperty["com.sap.vocabularies.Common.v1.EditableFieldFor"].PropertyPath || oProperty["com.sap.vocabularies.Common.v1.EditableFieldFor"].String;
					var sForEditProperty = oProperty.name;
					// map key fields to corresponding for edit properties to provide values in SFB (without mapping in FLP)
					fnAlignSelectOptions(oSelectionVariant, sKeyProperty, sForEditProperty);
					// and vice versa if field is mapped in FLP (formerly recommended), but original field used in SFB (never recommended)
					fnAlignSelectOptions(oSelectionVariant, sForEditProperty, sKeyProperty);
				}
			});
		}

		function fnApplySelectionVariantToSFB(oSelectionVariant, sSelectionVariant, bReplace, oSemanticDates, bNavTypeInitial){
			fnMapEditableFieldFor(oSelectionVariant);
			if (bReplace) {
				oState.oSmartFilterbar.clearVariantSelection();
			}
			applySelectionProperties(oSelectionVariant, sSelectionVariant, bNavTypeInitial);
			fnSetFiltersUsingUIState(oSelectionVariant.toJSONObject(), bReplace, /* bStrictMode = */ false, oSemanticDates);
		}

		// provide data load settings including defaulting
		// ideally, this should be implemented in a generic way in template assembler, so that generated getters also return default values for objects if not explicitely set in 
		// manifest (i.e. it should be sufficient to define the default in component - no need to individually implement defaulting!)
		function getDataLoadSettings(){
			// general default
			var oDefaultDataLoadSettings = {loadDataOnAppLaunch: "ifAnyFilterExist"};

			// intension is boolean, but unfortunately faulty values are (historically) not treated consistently
			var bEnableAutoBindingMultiViews = oState.oMultipleViewsHandler.getOriginalEnableAutoBinding(); 

			// if multiple views settings is not defined (also the case in single views case), general default is taken. Unlike other faulty values, null is treated like undefined
			if (bEnableAutoBindingMultiViews !== undefined && bEnableAutoBindingMultiViews !== null){
				// multiple views setting overrules general default
				oDefaultDataLoadSettings.loadDataOnAppLaunch = bEnableAutoBindingMultiViews ? "always" : "never";
			}

			var oManifestDataLoadSettings = oController.getOwnerComponent().getDataLoadSettings();
			// (historically) explicit setting empty string (not an allowed value according to definition in component!) is treated like undefined (including adopting multiple views
			// settings. Other not allowed values (any other sting) were ignored, i.e. returning undefined from getInitialLoadBehaviourSettings, thus setting undefined to 
			// oSmartVariantManagement.setExecuteOnStandard (which actually only sets the default) and finally using the value returned from 
			// oSmartVariantManagement.getExecuteOnStandard (only different from overall default (false), if user has explicitly set it)
			if (oManifestDataLoadSettings && oManifestDataLoadSettings.loadDataOnAppLaunch === ""){
				oManifestDataLoadSettings.loadDataOnAppLaunch = undefined;
			}
			
			// explicit setting has highest priority
			return extend(oDefaultDataLoadSettings, oManifestDataLoadSettings);
		}

		// analyze all input determining whether data should be loaded initially and accordingly
		// - sets default value for flag whether standard variant should be execute on select
		// - determines whether we actually should load data
		function applyInitialLoadBehavior(bDataLoadCausedByNavigation){
			// cases definitely determining to load data initially 
			// - worklist
			// - livemode
			// - master detail (i.e. bLoadListAndFirstEntryOnStartup is set)
			var bShouldDataBeLoaded = oState.oWorklistData.bWorkListEnabled || oState.oSmartFilterbar.getLiveMode() || oState.bLoadListAndFirstEntryOnStartup ;

			var sLoadBehaviour = getDataLoadSettings().loadDataOnAppLaunch;
			if (!oSmartVariantManagement || oController.getOwnerComponent().getVariantManagementHidden()){
				// No VM -> 
				bShouldDataBeLoaded = bShouldDataBeLoaded || sLoadBehaviour === "always";
				bShouldDataBeLoaded = bShouldDataBeLoaded || (sLoadBehaviour === "ifAnyFilterExist" && oState.oSmartFilterbar.getFiltersWithValues().length > 0);
				// behavior of last patch set would translate to the following - seems not to be correct (in case of setting ifAnyFilterExist but no filters provided)
				//				bShouldDataBeLoaded = bShouldDataBeLoaded || sLoadBehaviour !== "never";
			} else {
				// in case of a (visible) SVM, we need to set the default value 
				// default value for standard variant 
				// - true if one of the conditions above is fulfilled
				// - or for any manifest setting but "never" 
				//		(Remark: "ifAnyFilterExist" leads to mark the standard variant true, even if no filter is provided - this looks ok for startup, as the text shown to the user 
				//		contains the condition, but if reselecting the standard variant, it  will also select without filters!
				//		TODO: check, how to solve that inconsistency)
				// - but in both cases not, if a mandatory filter is missing
				var bDefaultExecuteOnStandard = (bShouldDataBeLoaded || sLoadBehaviour !== "never") && isSearchAllowed();
				oSmartVariantManagement && oSmartVariantManagement.setExecuteOnStandard(bDefaultExecuteOnStandard);

				// determine final setting according to user's variant settings
				if (oState.oSmartFilterbar.isCurrentVariantStandard()){
					var bExecuteOnStandard = oSmartVariantManagement.getExecuteOnStandard();
					if (bDefaultExecuteOnStandard !== bExecuteOnStandard){
						// user has overruled setting, so user's choice wins
						bShouldDataBeLoaded = bExecuteOnStandard;
					} else {
						// no possibility for the user to make standard variant also load data initially if no filters exist - although at runtime, it will
						bShouldDataBeLoaded = bShouldDataBeLoaded || sLoadBehaviour === "always";
						bShouldDataBeLoaded = bShouldDataBeLoaded || (sLoadBehaviour === "ifAnyFilterExist" && oState.oSmartFilterbar.getFiltersWithValues().length > 0);
					}
				} else {
					bShouldDataBeLoaded = bShouldDataBeLoaded || oState.oSmartFilterbar.isCurrentVariantExecuteOnSelectEnabled();
				}
			}

			// In navigation case, data should be loaded (in general) even if none of the other criteria induces this. However, this must not influence the default setting for the
			// standard variant, thus this is taken into account only here
			bShouldDataBeLoaded = bShouldDataBeLoaded || bDataLoadCausedByNavigation;

			// finally: is data load possible at all (all mandatory filters filled)?
			// If bShouldDataBeLoaded is true up to here, that means, according to the circumstances we would actually like to load data. However, if mandatory filters exist, and not
			// all of them are provided with data, that means, we cannot load data: SFB.search would just mark the missing filters (which is not wanted here) and not even trigger a
			// request. Thus, this question overrules everything else.
			bShouldDataBeLoaded = bShouldDataBeLoaded && isSearchAllowed();

			oDataLoadedWrapper.setState(!!bShouldDataBeLoaded);
		}

		return {
			areDataShownInTable: areDataShownInTable,
			setDataShownInTable: fnSetDataShownInTable,
			onSearchPressed: onSearchPressed,
			customAppStateChange: customAppStateChange,
			changeIappState: changeIappState,
			onSmartFilterBarInitialized: onSmartFilterBarInitialized,
			onAfterSFBVariantLoad: onAfterSFBVariantLoad,
			applyState: applyState,
			getCurrentAppState: getCurrentAppState, // separation of concerns - only provide state, statePreserver responsible for storing it
			setFiltersUsingUIState : fnSetFiltersUsingUIState
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.IappStateHandler", {
		constructor: function(oState, oController, oTemplateUtils) {
			extend(this, getMethods(oState, oController, oTemplateUtils));
		}
	});
});
