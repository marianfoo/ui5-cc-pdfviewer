/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
// Provides the design time metadata for the sap.suite.ui.generic.template.ObjectPage component

sap.ui.define(["sap/suite/ui/generic/template/designtime/utils/designtimeHelper", "sap/base/util/deepExtend"],
	function (designtimeHelper, deepExtend) {
		"use strict";

		// definiton of changes we want to allow. Structure/granularity to be clarified
		var mAllow = {};
		// allow list for designtime adaptation / level-0.  
		var mAllowLevel0 = {
				"sap.uxap.ObjectPageLayout": {
					properties: ["showAnchorBar", "useIconTabBar", "showHeaderContent", "alwaysShowContentHeader"]
				},
				"sap.uxap.ObjectPageHeaderActionButton": {
					actions: ["combine"],
					properties: ["visible"]					// Todo: check, whether setting visible should rather be allowed generically
				},
				"sap.m.Avatar": {
					properties: ["displayShape"]
				},
				"sap.m.VBox": {								// according to docu this is meant for VBox contained in sap.uxap.ObjectPageHeaderContent only. Todo: adapt structure of mAllow accordingly to be 
																	// able to express the same
					properties: ["visible"]
				},
				"sap.m.HBox": {								// meant in the VBox mentioned above, and for paginator buttons (todo: check exact place)
					properties: ["visible"]
				},
				"sap.ui.layout.Grid": {						// meant for Grid in subSection. Actually there are two grids - clarify whether both are needed and which is meant 
					properties: ["defaultSpan"]			// Todo: check, how this works at all
				},
				"sap.uxap.ObjectPageSection": {
					properties: ["showTitle", "titleUppercase", "title"]
				},
				"sap.uxap.ObjectPageSubSection": {
					properties: ["title"]
				},
				"sap.ui.comp.smarttable.SmartTable": {
					properties: ["useExportToExcel", "editable"]
				},
				"sap.m.Table": {
					properties: ["growingThreshold", "popinLayout", "includeItemInSelection"]		// growingThreshold should not be possible in single section with single subsection 
				},
				"sap.m.Column": {
					properties: ["width", "hAlign"]
				},
				"sap.ui.table.Column": {
					properties: ["width", "hAlign"]
				},
				"sap.m.Button": {								// meant for Save and Next in footer
					actions: ["combine"],
					properties: ["visible", "icon", "activeIcon", "type"]
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
				}
			};
		
		// grey list for designtime adaptation / level-0 (no technical difference too allow list, separated just for documentation  
		var mGreyLevel0 = {
				"sap.uxap.ObjectPageLayout": {
					properties: ["showAnchorBarPopover", "headerContentPinnable"]
				},
				"sap.uxap.ObjectPageHeader": {
					properties: ["objectTitle"]
				},
				"sap.uxap.ObjectPageHeaderActionButton": {
					properties: ["enabled", "icon", "text"]
				},
				"sap.m.VBox": {
					properties: ["width"]
				},
				"sap.m.Avatar": {
					properties: ["src"]
				},
				"sap.m.Label": {
					properties: ["width", "wrapping"]
				},
				"sap.m.Text": {
					properties: ["text", "wrapping"]
				},
				"sap.m.Title": {
					properties: ["text"]
				},
				"sap.ui.comp.smartmicrochart.SmartMicroChart": {
					properties: ["size"]
				},
				"sap.ui.comp.smartform.Group": {
					properties: ["label"]
				},
				"sap.ui.comp.smartfield.SmartField": {
					properties: ["textInEditModeSource", "showValueHelp"]
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
					properties: ["width", "minWidth"]
				},
				"sap.ui.comp.smartchart.SmartChart": {
					properties: ["showDownloadButton", "header", "ignoredChartTypes", "useTooltip"]
				},
				"sap.m.Button": {
					properties: ["enabled", "text", "blocked"]
				},
				"sap.m.OverflowToolbarButton": {
					properties: ["enabled", "text", "blocked"]
				}
		};

		// allow list for key user adaptation. 
		var mAllowKeyUser = {
				"sap.uxap.ObjectPageHeader": {
					aggregations: {
						actions: {								// remark to avoid confusion: in this line, "actions" is the name of the aggregation
							actions: ["move"]
						}
					}
				},
				"sap.uxap.ObjectPageDynamicHeaderTitle": {
					aggregations: {
						actions: {								// remark to avoid confusion: in this line, "actions" is the name of the aggregation
							actions: ["move"]
						}
					}
				},
				"sap.uxap.AnchorBar": {
					aggregations: {
						content: {
							actions: ["move"]   // needed to allow moving sections also from anchorBar
						}
					}
				},
				"sap.m.Button": {
					actions: ["remove", "reveal", "rename", "getResponsibleElement", "actionsFromResponsibleElement"] 
						/* rename needed to allow renaming of sections (but should not harm also for other buttons
						 * getResponsibleElement and actionsFromResponsibleElement (apparently) needed to ensure connection from anchor bar to sections 
						 */ 
				},
				"sap.m.MenuButton": { // used in anchorbar for sections with multiple subsections and possibly created by combining buttons
					actions: ["remove", "reveal", "rename", "getResponsibleElement", "actionsFromResponsibleElement", "split"] 
				},
				"sap.m.Toolbar": {
					actions: ["moveControls"]
				},
				"sap.uxap.ObjectPageLayout": {
					aggregations: {
						headerContent: {
							actions: ["addIFrame", "move"]
						},
						sections: {
							actions: ["addIFrame", "move"]
						}
					}
				},
				"sap.ui.fl.util.IFrame": { 
					// created only via adaptation viz. Embed content: as Section / in Header. Hence allowing all the actions
					actions: ["settings", "remove", "reveal"]
				},
				"sap.m.VBox": {
					actions: ["remove", "reveal"],
					aggregations: {
						items: {
							actions: ["move"]
						}
					}
				},
				"sap.m.FlexBox": {
					actions: ["remove", "reveal"],
					aggregations: {
						items: {
							actions: ["move"]
						}
					}
				},
				"sap.uxap.ObjectPageSection": {
					actions: ["rename", "remove", "reveal"],
					aggregations: {
						subSections: {
							actions: ["move"]
						}
					}
				},
				"sap.uxap.ObjectPageSubSection": {
					actions: ["rename", "remove", "reveal"]
				},
				"sap.ui.comp.smartform.SmartForm": {				// not documented in allow list, but checked by RTA OPA test
					aggregations: {
						groups: {
							actions: ["move", "createContainer", "remove"]	// actually, only move seems to be checked, but createContainer is needed to achieve the correct index in context menu
						}
					}
				},
				"sap.ui.comp.smartform.Group": {						// not documented in allow list, but checked by RTA OPA test
					actions: ["rename", "remove"],					// appearantly not checked directly, but indirect (selection of other checked actions by index)
					aggregations: {
						formElements: {
							actions: ["add", "move", "remove"]
						}
					}
				},
				"sap.ui.comp.smartform.GroupElement": {			// not documented in allow list, but checked by RTA OPA test
					actions: ["rename", "remove", "reveal", "combine", "split"] // combine/split is meant for grouping smartfield/links in sections
				},
				"sap.ui.comp.smartvariants.SmartVariantManagement": {
					actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
				},
				"sap.ui.comp.smarttable.SmartTable": {
					actions: ["compVariant"]		// allows table personalization (same as for end user)
				},
				"sap.ui.comp.smartchart.SmartChart": {
					actions: ["compVariant"]		// allows table personalization (same as for end user)
				},
				"sap.m.Title": {
					actions: ["rename"]
				}
			};
		
		// allow list for variant management: All changes done here are stored with a variant, and only applied when that variant is selected.
		// this mode is indicated by url parameter fiori-tools-rta-mode=true
		var mAllowVariantManagement = {
			"sap.ui.comp.smartvariants.SmartVariantManagement": {
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
		
