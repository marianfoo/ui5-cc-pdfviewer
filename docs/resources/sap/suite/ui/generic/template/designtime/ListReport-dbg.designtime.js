/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
// Provides the design time metadata for the sap.suite.ui.generic.template.ListReport component

sap.ui.define(["sap/suite/ui/generic/template/designtime/utils/designtimeHelper", "sap/base/util/deepExtend"],
	function (designtimeHelper, deepExtend) {
		"use strict";

		// definiton of changes we want to allow. Structure/granularity to be clarified
		var mAllow = {};
		// allow list for designtime adaptation / level-0.  
		var mAllowLevel0 = {
				"sap.f.DynamicPage": {
					properties: ["fitContent"]
				},
				"sap.ui.comp.smartfilterbar.SmartFilterBar": {
					properties: ["liveMode"]
				},
				"sap.ui.comp.smarttable.SmartTable": {
					properties: ["useExportToExcel"]
				},
				"sap.m.Table": {
					properties: ["sticky", "popinLayout", "includeItemInSelection", "growingThreshold"]
				},
				"sap.m.Column": {
					properties: ["width", "hAlign"]
				},
				"sap.ui.table.Column": {
					properties: ["width", "hAlign"]
				},
				"sap.m.Button": {
					actions: ["combine"],
					properties: ["visible", "icon", "activeIcon", "type", "text"]
														// remark: don't confuse with action "remove" - property is only relevant for level 0, action for key user
				},
				"sap.m.MenuButton": {
					properties: ["text"]
				},
				"sap.m.OverflowToolbarButton": {
					properties: ["visible", "icon", "activeIcon", "type"]
				},
				"sap.m.OverflowToolbar": {
					aggregations: {
						content: {
							actions: ["move"]
						}
					}
				},
				"sap.m.IconTabFilter": {
					properties: ["text"]
				}
			};
		
		// grey list for designtime adaptation / level-0 (no technical difference too allow list, separated just for documentation  
		var mGreyLevel0 = {
				"sap.f.DynamicPage": {
					properties: ["headerExpanded"]
				},
				"sap.m.VBox": {
					properties: ["width"]
				},
				"sap.ui.comp.smartfilterbar.SmartFilterBar": {
					properties: ["showClearOnFB", "showFilterConfiguration", "showRestoreOnFB", "useDateRangeType", "filterBarExpanded", "showGoOnFB"]
				},
				"sap.m.Label": {						// not created by us, but by SFB
					properties: ["width", "wrapping"]
				},
				"sap.m.Text": {
					properties: ["text", "wrapping"]
				},
				"sap.m.Title": {
					properties: ["text"]
				},
				"sap.m.MultiInput": {						// not created by us, but by SFB
					properties: ["showSuggestion", "editable", "value", "showValueHelp", "enabled"]
				},
				"sap.m.IconTabFilter": {
					properties: ["icon", "count", "iconColor"]
				},
				"sap.ui.comp.smarttable.SmartTable": {
					properties: ["header", "ignoreFromPersonalisation", "showTablePersonalisation", "editable", "showRowCount", "wrap", "ignoredFields", "exportType", "width", "demandPopin"]
				},
				"sap.m.Table": {
					properties: ["noDataText", "growingScrollToLoad", "growing"]
				},
				"sap.ui.table.Table": {
					properties: ["selectionMode"]
				},
				"sap.ui.table.AnalyticalTable": {
					properties: ["selectionMode", "minAutoRowCount", "visibleRowCountMode"]
				},
				"sap.ui.table.AnalyticalColumn": {
					properties: ["width", "minWidth", "showFilterMenuEntry", "summed"]
				},
				"sap.ui.comp.smartmicrochart.SmartMicroChart": {
					properties: ["size"]
				},
				"sap.ui.comp.smartchart.SmartChart": {
					properties: ["showDownloadButton", "header", "ignoredChartTypes", "useTooltip"]
				},
				"sap.m.Button": {
					properties: ["enabled", "blocked"]
				},
				"sap.m.OverflowToolbarButton": {
					properties: ["enabled", "text", "blocked"]
				},
				"sap.m.MenuButton": {
					properties: ["type"]
				}
		};
		
		// allow list for key user adaptation. 
		var mAllowKeyUser = {
				"sap.ui.comp.smartform.SmartForm": {				// used in multiedit dialog
					aggregations: {
						groups: {
							actions: ["move", "createContainer"]
						}
					}
				},
				"sap.ui.comp.smartform.Group": {						// used in multiedit dialog
					actions: ["rename", "remove"],
					aggregations: {
						formElements: {
							actions: ["add", "move"]
						}
					}
				},
				"sap.ui.comp.smartform.GroupElement": {			// used in multiedit dialog
					actions: ["rename", "remove", "reveal"]
				},
				"sap.m.MenuButton": { // used for create and create with filters and possibly created by combining of buttons
					actions: ["split", "rename"]
				},	
				"sap.m.Button": {
					actions: ["remove", "reveal", "rename"]
				},
				"sap.m.Toolbar": {
					actions: ["moveControls"]
				},
				"sap.ui.comp.smartvariants.SmartVariantManagement": {
					actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
				},
				"sap.ui.comp.smartfilterbar.SmartFilterBar": {
					actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
				},
				"sap.ui.comp.smarttable.SmartTable": {
					actions: ["compVariant"]		// allows table personalization (same as for end user)
				},
				"sap.ui.comp.smartchart.SmartChart": {
					actions: ["compVariant"]		// allows table personalization (same as for end user)
				},
				"sap.m.IconTabFilter": {
					actions: ["rename"]
				}
			};
		
		// allow list for variant management: All changes done here are stored with a variant, and only applied when that variant is selected.
		// this mode is indicated by url parameter fiori-tools-rta-mode=true
		var mAllowVariantManagement = {
			"sap.ui.comp.smartvariants.SmartVariantManagement": {
				actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
			},
			"sap.ui.comp.smartfilterbar.SmartFilterBar": {
				actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
			},
			"sap.ui.comp.smarttable.SmartTable": {
				actions: ["compVariant"]		// allows table personalization (same as for end user)
			},
			"sap.ui.comp.smartchart.SmartChart": {
				actions: ["compVariant"]		// allows table personalization (same as for end user)
			}
		};
		// there's no reliable way to differentiate designtime adaptation and key user adaptation. However
		// - property changes are possible only in designtime adaptation
		// - for any other changes (using change handlers), we anyway need to be prepared for the change if it is allowed in one mode, so it shouldn't matter if it's also possible in the other mode
		if (designtimeHelper.getRtaModeValue("fiori-tools-rta-mode") === "true") {
			mAllow = mAllowVariantManagement;
		} else {
			mAllow = designtimeHelper.getMergedAllowList([mAllowLevel0, mGreyLevel0, mAllowKeyUser]);
		}

		return designtimeHelper.getViewDesignTime(mAllow);
		
});
		
