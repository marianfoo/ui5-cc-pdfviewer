sap.ui.define(["sap/ui/base/Object", "sap/base/util/deepExtend", "sap/base/util/extend", "sap/base/util/Version", "sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper"], function(BaseObject, deepExtend, extend, Version, SelectionVariant, testableHelper){
	"use strict";


	// Constants which are used as property names for storing custom filter data and generic filter data
	var dataPropertyNameCustom = "sap.suite.ui.generic.template.customData",
	dataPropertyNameExtension = "sap.suite.ui.generic.template.extensionData",
	dataPropertyNameGeneric = "sap.suite.ui.generic.template.genericData";



	// determines the version the state was written with (as far as possible)
	// return version as string or as Version object?
	function getVersionFromLegacyState(oLegacyState){
		// starting with 1.90, states carry version information of the release they were created => rely on that
		if (oLegacyState.version){
			var oVersion = Version(oLegacyState.version);
			if (oVersion.getSuffix()){
				// support for states created with snapshot versions: only relevant for development/test system
				// unfortunately, no chance to judge whether the state was created before or after a structure change intorduced with the same version 
				// if states was created with snapshot version before structure change, it still uses the structure of the previous version - thus we need to count back 1 version  
				// in case of a patch version, this means counting back one patch, otherwise counting back one minor 
				// e.g. if we introduce a structure change in 1.2.3, a state created with 1.2.3-SNAPSHOT could still use the structure we used in 1.2.2
				// if we introduce the structure change only with 1.3.0, a state created with 1.3.0-SNAPSHOT could still use the the structure we used in 1.2 
				// if we do both, we don't know whether the first structure change always was available in 1.3.0-SNAPSHOT - thus in second case we can only go back a full minor
				// version (and any structure changes introduced in patches must be at least as compatible to live with that)
				// additionally, this counting back requires all mapping functions not to break if the state has already the resulting format  
				return oVersion.getPatch() ? Version(oVersion.getMajor(), oVersion.getMinor(), oVersion.getPatch() - 1) : Version(oVersion.getMajor(), oVersion.getMinor() - 1);
			}
			return oLegacyState.version;
		}

		// in 1.86, dirty indicator for (SFB/Page) variant was introduced - if it exists, state is from 1.86 or newer
		// boolean flag - could be true or false, but not undefined
		if (oLegacyState.customData && oLegacyState.customData[dataPropertyNameGeneric] && oLegacyState.customData[dataPropertyNameGeneric].variantDirty !== undefined){
			return "1.86.0";
		}

		// with 1.60.1, activeStateFilter was added
		if (oLegacyState.customData && oLegacyState.customData[dataPropertyNameGeneric] && oLegacyState.customData[dataPropertyNameGeneric].activeStateFilter){
			return "1.60.1";
		}

		// in 1.58, extension data was introduced.
		// However, this was done compatible in the sense that a state would still look identical unless extensions are really used, thus it cannot be fully identified.
		// I.e. a state could have been created with 1.58 or later, but we'd assume it to be older - but that's not a problem
		if (oLegacyState.customData && oLegacyState.customData[dataPropertyNameExtension]){
			return "1.58.0";
		}

		// in 1.44.7 / 1.46.0, visibleCustomFields and information whether to data was added to generic data
		if (oLegacyState.customData && oLegacyState.customData[dataPropertyNameGeneric] && 
				(oLegacyState.customData[dataPropertyNameGeneric].visibleCustomFields || oLegacyState.customData[dataPropertyNameGeneric].suppressDataSelection !== undefined)){
			return "1.44.7";
		}

		// in 1.36, custom data where separated into FE part ("generic") and application part ("custom") - so if these parts exist, the state is from 1.36 or newer
		if (oLegacyState.customData && oLegacyState.customData[dataPropertyNameCustom] && oLegacyState.customData[dataPropertyNameGeneric]){
			return "1.36.0";
		}

		// first delivery of FE was in 1.28 - so any state is at least from that release
		return "1.28.0";
	}

	function isNewerThen(oLegacyState, sVersion){
		// Using compareTo requires creation of version object for one of the two versions to compare.
		// Number of possible values for sVersion is limited (only the versions before a structure change happened), while the one contained in oLegacyState could be anyone.
		return Version(sVersion).compareTo(getVersionFromLegacyState(oLegacyState)) < 0;
	}


	function getMethods(oController){
		function mapFrom1_34(oState){
			if (isNewerThen(oState, "1.34.0")){
				return oState;
			}
			// with 1.36, customData has been differentiated in generic (containing only editStateFilter at that point in time) and custom (filters from extensions)

			var oNewCustomData = {};
			oNewCustomData[dataPropertyNameCustom] = oState.customData || {};
			oNewCustomData[dataPropertyNameGeneric] = {};
			if (oState.customData && oState.customData._editStateFilter){
				oNewCustomData[dataPropertyNameGeneric].editStateFilter = oState.customData._editStateFilter;
			}
			delete oNewCustomData[dataPropertyNameCustom]._editStateFilter;
			oState.customData = oNewCustomData;

			return oState;
		}

		function mapFrom1_44_6(oState){
			if (isNewerThen(oState, "1.44.6")){
				return oState;
			}
			// with 1.44.7 (resp. 1.46.0), visibleCustomFields was added to generic data
			oState.customData[dataPropertyNameGeneric].visibleCustomFields = [];

			return oState;
		}

		function mapFrom1_60_0(oState){
			if (isNewerThen(oState, "1.60.0")){
				return oState;
			}
			// with 1.60.1, activeStateFilter was added
			oState.customData[dataPropertyNameGeneric].activeStateFilter = false;

			return oState;
		}

		function mapFrom1_85(oState){
			if (isNewerThen(oState, "1.85.0")){
				return oState;
			}
			// with 1.86, dirty indicator for (SFB/page) variant has been added

			// for all old states, variant should be seen as dirty
			oState.customData[dataPropertyNameGeneric].variantDirty = true;
			return oState;
		}

		function mapFrom1_89(oState){
			if (isNewerThen(oState, "1.89.0")){
				return oState;
			}
			// with 1.90
			// - controlStates is introduced (map containing states per control, using (global) control id as key)
			// - table state (personalization) has been added (exception: multiple views with different tables)
			// - table variant id (only if control level variant management is used) has been moved to controlStates (as part of table state) (in multipleViews part of multipleViews state)

			deepExtend(oState, {
				version: "1.90.0",
				controlStates: {}
			});

			if (oState.tableVariantId){
				oState.controlStates[oController.getView().getId() + "--listReport"] = {
						sVariantId: oState.tableVariantId
				};
				delete oState.tableVariantId;
			}

			return oState;
		}

		function mapFrom1_93(oState){
			if (isNewerThen(oState, "1.93.0")){
				return oState;
			}
			// with 1.94
			// - using local id in control states (global id is superfluous, as the state is related to one view anyway - and it blows up the size of the state and makes it less readable)
			// - state of VM is stored in controlStates
			deepExtend(oState, {
				version: "1.94.0",
				controlStates: {}
			});

			var oView = oController.getView();
			for (var sGlobalId in oState.controlStates){
				var sLocalId = oView.getLocalId(sGlobalId);
				if (sLocalId){
					oState.controlStates[sLocalId] = oState.controlStates[sGlobalId];
					delete oState.controlStates[sGlobalId];
				}
			}

			oState.controlStates["template::PageVariant"] = oState.controlStates["template::PageVariant"] || {
					variantId: new SelectionVariant(oState.selectionVariant).getID(),
					modified: oState.customData[dataPropertyNameGeneric].variantDirty
			};

			delete oState.customData[dataPropertyNameGeneric].variantDirty;

			return oState;
		}

		function mapFrom1_94(oState){
			if (isNewerThen(oState, "1.94.0")){
				return oState;
			}
			// with 1.95
			// - worklist state stored in controlStates (in case of single view or single table mode) or in tableTabData.controlStates (in case of multiView with multiple tables)
			deepExtend(oState, {
				version: "1.95.0"
			});

			if (oState.customData[dataPropertyNameGeneric].Worklist){
				// different logic depending on sinlge view (or multi view with single table) on the one hand or multi view with multi tables on the other hand
				// relying on provided appState for that decision
				if (oState.customData[dataPropertyNameGeneric].tableTabData){
					extend(oState.customData[dataPropertyNameGeneric].tableTabData, {controlStates: {}});
					// Old logic was broken in the sense that it could only carry one searchString, although multiple searchField (and thus multiple searchStrings) exist in that case.
					// Assumption when restoring was, that this belongs to the searchField on the tab that should be visible. Although even this was not always correct (if the user had
					// switched the tab after the last time changing any searchString or pressing any search button, but before storing the state), for old states we cannot do anything
					// better - needed information (which tab this really belongs to and searchStrings for all other tabs) is just missing. (For newly created states, we would of
					// course store this information.)
					oState.customData[dataPropertyNameGeneric].tableTabData.controlStates["Table::Toolbar::SearchField-" + oState.customData[dataPropertyNameGeneric].tableTabData.selectedTab] = {
							searchString: oState.customData[dataPropertyNameGeneric].Worklist.searchString
					};
				} else {
					deepExtend(oState, {controlStates: {}});
					oState.controlStates["Table::Toolbar::SearchField"] = {
							searchString: oState.customData[dataPropertyNameGeneric].Worklist.searchString
					};
				}
				delete oState.customData[dataPropertyNameGeneric].Worklist;
			}

			return oState;
		}

		function mapFrom1_97(oState){
			if (isNewerThen(oState, "1.97.0")){
				return oState;
			}
			// with 1.98, activeStateFilter is integrated in editStateFilter (but not removed yet)

			deepExtend(oState, {
				version: "1.98.0"
			});

			if (oState.customData[dataPropertyNameGeneric].editStateFilter === "0" && oState.customData[dataPropertyNameGeneric].activeStateFilter){
				oState.customData[dataPropertyNameGeneric].editStateFilter = "5";
			}

			return oState;
		}

		function mapFrom1_98(oState){
			if (isNewerThen(oState, "1.98.0")){
				return oState;
			}
			// with 1.99
			// - variant management state enabled to contain states of controlled controls (property managedControlStates introduced)
			// - state of table personalization as part of state of variant management in case of page variant management

			// TODO: currently, table state duplicated into vm, should be only moved in case of page vm
			deepExtend(oState, {
				version: "1.99.0"
			});

			if (oState.controlStates && oState.controlStates["template::PageVariant"]){
				oState.controlStates["template::PageVariant"].managedControlStates = {
						listReport: oState.controlStates.listReport
				};
			}

			return oState;
		}


		function mapFrom1_99(oState){
			if (isNewerThen(oState, "1.99.0")){
				return oState;
			}
			// with 1.100
			// - state of filterbar handled indirectly as part of state of variant management, which is part of controlStates (this includes selectOptions, parameters, and
			//		semanticDates)
			// - list of items added to the filterBar (Before, this was only stored for custom filters, which apparently was necessary some time back to restore from a variant. That
			//		use case in the meantime seems to work out of the box (i.e. handled by VM) for standard filters and custom filters as well, for restoring from iAppState however,
			//		the information is needed for both kind of filters (i.e. SFB does not handle either of them). However, for old states, the information for custom filters is the
			//		best possible basis.)
			// - list of items removed from filterBar (Not stored at all before - if restoring from iAppState after filters have been removed, they just were shown again.)
			deepExtend(oState, {
				version: "1.100.0"
			});

			var oSelectionVariant = (oState.selectionVariant && typeof oState.selectionVariant === "string") ? JSON.parse(oState.selectionVariant) : oState.selectionVariant;
			if (oState.controlStates && oState.controlStates["template::PageVariant"]){
				oState.controlStates["template::PageVariant"].managedControlStates.listReportFilter = 
					oState.controlStates["template::PageVariant"].managedControlStates.listReportFilter || {
						selectOptions: oSelectionVariant && oSelectionVariant.SelectOptions,
						parameters: oSelectionVariant && oSelectionVariant.Parameters,
						semanticDates: oState.semanticDates,
						addedFilterItems: oState.customData["sap.suite.ui.generic.template.genericData"].visibleCustomFields,
						removedFilterItems: []
					};
			}

			delete oState.selectionVariant;
			delete oState.semanticDates;

			return oState;
		}

		function mapFrom1_101(oState){
			if (isNewerThen(oState, "1.101.0")){
				return oState;
			}

			// with 1.102
			// - activeStateFilter is removed (introduced with toggle button show all/hid drafts in 1.60, obsolete since this was integrated in editStateFilter in 1.98)
			// - in mutli table, mEditButtonState (per tab) is removed (introduced in 1.74, obsolete since 1.98, as anyway replicated to activeStateFilter)
			deepExtend(oState, {
				version: "1.102.0"
			});

			delete oState.customData[dataPropertyNameGeneric].activeStateFilter;
			if (oState.customData[dataPropertyNameGeneric].tableTabData){
				delete oState.customData[dataPropertyNameGeneric].tableTabData.mEditButtonState;
			}

			return oState;
		}

		function mapFrom1_102(oState){
			if (isNewerThen(oState, "1.102.0")){
				return oState;
			}

			// with 1.103
			// - state of custom filters (from SFB point of view: editState, appExtension, adaptationExtension) are part of SFB's state
			deepExtend(oState, {
				version: "1.103.0"
			});

			oState.controlStates["template::PageVariant"].managedControlStates.listReportFilter.customFilters =
				extend(oState.controlStates["template::PageVariant"].managedControlStates.listReportFilter.customFilters, {
					editState: oState.customData && oState.customData[dataPropertyNameGeneric].editStateFilter,
					appExtension: oState.customData && oState.customData[dataPropertyNameCustom],
					adaptationExtensions: oState.customData && oState.customData[dataPropertyNameExtension]
				});

			var oTableTabData = oState.customData && oState.customData[dataPropertyNameGeneric].tableTabData;
			var bSuppressDataSelection = oState.customData && oState.customData[dataPropertyNameGeneric].suppressDataSelection;
			delete oState.customData;
			// todo:
			// - transfer data selection into wrapper/controlStates
			// - get rid of customData also in multi tab case
			if (oTableTabData || (bSuppressDataSelection !== undefined)){
				oState.customData = Object.create(null);
				oState.customData[dataPropertyNameGeneric] = {
						tableTabData: oTableTabData,
						suppressDataSelection: bSuppressDataSelection
				};
			}

			return oState;
		}

		function mapFrom1_104(oState){
			if (isNewerThen(oState, "1.104.0")){
				return oState;
			}

			// with 1.105
			// - information whether to load data moved to controlState
			deepExtend(oState, {
				version: "1.105.0"
			});

			if (oState.controlStates["$dataLoaded"] === undefined){
				oState.controlStates["$dataLoaded"] = !(oState.customData && oState.customData[dataPropertyNameGeneric].suppressDataSelection);
			}

			var oTableTabData = oState.customData && oState.customData[dataPropertyNameGeneric].tableTabData;
			delete oState.customData;
			// todo:
			// - get rid of customData also in multi tab case
			if (oTableTabData){
				oState.customData = Object.create(null);
				oState.customData[dataPropertyNameGeneric] = {
						tableTabData: oTableTabData
				};
			}

			return oState;
		}


		function getStateInCurrentFormat(oLegacyState){
			// whenever the structure of appState changes, a new mapping function can be added, that just realizes mapping for the latest step
			// note that the mapping functions per step modify the provided state object (and don't create a copy - but still return it to make use of reduce) - there's
			// no need to keep the intermediate versions, just the original provided state stays untouched

			return [mapFrom1_34, mapFrom1_44_6, mapFrom1_60_0, mapFrom1_85, mapFrom1_89, mapFrom1_93, mapFrom1_94, mapFrom1_97, mapFrom1_98, mapFrom1_99, mapFrom1_101, mapFrom1_102,
				mapFrom1_104].reduce(function(oState, fnMap){
					return fnMap(oState);
				}, deepExtend({}, oLegacyState));
		}

		// for productive use, only mapping to most current version makes sense
		// for testing however, testing mapping from one version to the next helps avoiding adoption all tests with every new version
		/* eslint-disable */
		testableHelper.testable(mapFrom1_34, "mapFrom1_34");
		testableHelper.testable(mapFrom1_44_6, "mapFrom1_44_6");
		testableHelper.testable(mapFrom1_60_0, "mapFrom1_60_0");
		testableHelper.testable(mapFrom1_85, "mapFrom1_85");
		testableHelper.testable(mapFrom1_89, "mapFrom1_89");
		testableHelper.testable(mapFrom1_93, "mapFrom1_93");
		testableHelper.testable(mapFrom1_94, "mapFrom1_94");
		testableHelper.testable(mapFrom1_97, "mapFrom1_97");
		testableHelper.testable(mapFrom1_98, "mapFrom1_98");
		testableHelper.testable(mapFrom1_99, "mapFrom1_99");
		testableHelper.testable(mapFrom1_101, "mapFrom1_101");
		testableHelper.testable(mapFrom1_102, "mapFrom1_102");
		testableHelper.testable(mapFrom1_104, "mapFrom1_104");
		/* eslint-disable */

		return {
			getStateInCurrentFormat: getStateInCurrentFormat
		};
	}


	return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.LegacyStateHandler", {
		constructor: function(oController) {
			extend(this, getMethods(oController));
		}
	});

});
