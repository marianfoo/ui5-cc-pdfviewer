sap.ui.define(["sap/suite/ui/generic/template/genericUtilities/FeError"],function(FeError){
	"use strict";

	/* This class aims to provide the structure of all stable ids created by Fiori elements.
	 * Currently still missing: Legacy ids not yet migrated.
	 * 
	 * In Fiori elements apps, the controls created depend on the annotations and manifest settings. Therefore, stable ids given by Fiori elements cannot be just fixed strings in all cases, but must 
	 * be generated out of annotations and manifest settings. When these settings are changed, this can be considered as a change to the app, that might allow a change of the generated ids. However, 
	 * some changes should be considered as being compatible, e.g. adding a new section to the ObjectPage. In such a case, the ids of any controls not related to the change, e.g. controls on other 
	 * sections, must not be changed.
	 * To achieve this, all possible ids are classified as types and subtypes corresponding to Fiori elements features, using parameters for all input derived from annotations or manifest settings.
	 * 
	 * Originally, the stable ids were created within the xml fragments, sometimes using different formatters (AnnotationHelpers). With the library growing more and more, this made it quite cumbersome
	 * to understand which possible ids might be created (and in fact, several unwanted possibilities of clashes were introduced).
	 * Therefore, the so-called stable id concept introduced a more generic approach to build stable ids. With this, all stable ids should be generated using the StableIdHelper method getStableId,
	 * which in turn uses this class as definition for the rules how to create the ids.
	 * 
	 * Of course, all ids used before must not be changed. Therefore, this class allows to describe how those ids were created. All these ids are referred to as legacy ids, while all newer ids are 
	 * referred to as standard ids.
	 *
	 * 
	 * The returned JSON object contains two properties:
	 * 1. parameters: An array of all possible parameters. First character of the parameter describes the type - as in most cases (for standard always) they become directly part of the generated id,
	 * 	most parameter names start with s. In case of new (standard) ids with multiple parameters the order here defines the order used in the generated id, therefore new parameters may only be
	 * 	added to the end. 
	 * 2. types: JSON-object. Its properties define the types. New property names can be added (for new ids), but existing ones must not be changed.  
	 * 		subTypes: JSON-object. The properties of the type object are the possible subTypes. The same rules as for types apply for subTypes. (subTyoes are only introduced to create better
	 * 				structure. However, depth is fixed, i.e. each stable id belongs to one type and subType). 
	 * 				The subType object describes the actual definition of the stable id. It has the properties (all of them optional):
	 * 			parameters: parameter names relevant (and mandatory) for this id. Only names defined in the parameters array are allowed.
	 * 			optionalParameters: optional parameter names relevant for this id. Only names defined in the parameters array are allowed.
	 * 			value: Only relevant for legacy ids!
	 * 				Can be a string (in case of legacy ids without parameters) used as id or a function returning the stable id. In this case, the function is called with a json object as parameter, 
	 * 				with properties according to the parameters and optionalParameters defined. 
	 * 				The function may return undefined, in this case the id is created as standard id. (This may be used for legacy ids enhanced with optional parameters for new feature - e.g. multiple 
	 * 				views on ALP: Single view existed before the stable id concept, so ids for single table are legacy, but multiple views (with optional parameter sQuickVariantKey) was only 
	 * 				introduced later, so new ids used here should be standard.)
	 * 				If the function needs to indicate that no stable id could be generated (and it should also not be generated as standard id), it may throw an error. Currently, in this case the id
	 * 				would be undefined, which would make UI5 generate an id which is not stable (and tools would know that it's not stable).
	 * 
	 * Some ids are also used as parameters for other ids. This makes sense especially in case of nested collections (e.g. columns of tables on OP: To avoid clashes for tables in different section,
	 * some information of the section must be part of the id for the table. Now, several tables could have columns for properties with same name (esp. for were common names - like "id") - to avoid 
	 * clashes here, we need to take the section information into account. But we don't want to think of this explicitly over and again, therefore we just take the id of the smart table as parameter 
	 * for the id of the column.
	 * Parameters in ids currently using other ids [type/subType] as values: 
	 * - sSmartTableId: ListReportTable/SmartTable, ALPTable/SmartTable, ObjectPageTable/SmartTable, all also used directly
	 * - sFacet: ObjectPage/HeaderFacet, ObjectPage/EditableHeaderFacet, ObjectPage/StandardFacet, ObjectPage/Facet, not used directly
	 * - sDataField: 
	 * 		- ObjectPage/DataField: not used directly
	 * 		- MultiEditDialog/DataField: currently no direct usage under investigation, if id for smartMultiEdit.Field becomes necessary, this id must be used there directly (see also comment in 
	 * 			MultiEditDialog.fragment)  
	 * 		- Remark: TableColumn/DataField in contrast is the (directly used) id of a table column build from a DataField
	 * 
	 */
	
	
	// Ids for facets are constructed in a very special way, therefore the needed functions are separated here. Don't do the same for other ids!
	// Actually there are no controls using these ids directly as there id, but only as a part (i.e. as parameter sFacet)
	
	// getHeaderFacets provides the ids for facets pointed to from annotation UI.HeaderFacets 
	// In header (i.e. in display mode), ids start always with header::headerEditable::
	// In edit mode, in the section to edit the header fields, ids start with headerEditable:: 
	function getHeaderFacetId(oParams){
		if (oParams.sAnnotationId) {
			return "headerEditable::" + oParams.sAnnotationId;
		} else {
			if (oParams.sRecordType !== "com.sap.vocabularies.UI.v1.ReferenceFacet" ) {
				throw new FeError();
			}
			return "headerEditable::" + oParams.sAnnotationPath;
		}
	}
	
	function getStandardFacetId(oParams){
		if (oParams.sAnnotationId) {
			return oParams.sAnnotationId;
		}
		if (oParams.sRecordType !== "com.sap.vocabularies.UI.v1.ReferenceFacet") {
			throw new FeError();
		} 
		return oParams.sAnnotationPath;
	}
	
	// getFacetId is only a wrapper for headerFacets (pointed to from annotation UI.HeaderFacets) and normal facets (pointed to from annotation UI.Facets)
	function getFacetId(oParams){
		return oParams.bIsHeaderFacet ? getHeaderFacetId(oParams) : getStandardFacetId(oParams);
	}

	return {
		parameters: ["sQuickVariantKey", "sFacet", "sSmartTableId", "sProperty", "sTarget", "sSemanticObject", "sAction", "sEntitySet", "sFacetExtensionKey", "sRecordType", "sAnnotationPath", "sAnnotationId", "sReuseComponentName", "sReuseComponentUsage", "sReuseComponentKey", "bIsHeaderFacet", "sIsPartOfPreview", "sDataField"],
		types: {
			ListReportPage: {
				DynamicPage: {
					value: "page"
				},
				DynamicPageTitle: {},
				DynamicPageHeader: {}
			},
			ListReportTable: {
				SmartTable: { // note that this pattern will also be used for SmartChart (for SmartList see below)
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "listReport-" + oParams.sQuickVariantKey : "listReport";}
				},
				// the following ids are used for the inner table wrapped by the SmartTable
				ResponsiveTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "responsiveTable-" + oParams.sQuickVariantKey : "responsiveTable";}
				},
				ColumnListItem: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){
						return oParams.sQuickVariantKey ? "template:::ListReportTable:::QuickVariantSelectionXColumnListItem:::sQuickVariantKey::" + oParams.sQuickVariantKey
																						: "template:::ListReportTable:::ColumnListItem";
					}
				},
				GridTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "GridTable-" + oParams.sQuickVariantKey : "GridTable";}
				},
				AnalyticalTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "analyticalTable-" + oParams.sQuickVariantKey : "analyticalTable";}
				},
				TreeTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "TreeTable-" + oParams.sQuickVariantKey : "TreeTable";}
				},
				// end of ids used for the inner table
				SmartList: {} // alternative for the SmartTable case
			},
			ListReportAction: {
				Create: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "addEntry-" + oParams.sQuickVariantKey : "addEntry";}
				},
				CreateWithFilter: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "template:::ListReportAction:::CreateWithFilter:::sQuickVariantKey::" + oParams.sQuickVariantKey : "template::addEntryWithFilter";}
				},
				CreateWithDialog: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "CreateWithDialog-" + oParams.sQuickVariantKey : "CreateWithDialog";}
				},
				CreateMenu: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "template:::ListReportAction:::CreateMenu:::sQuickVariantKey::" + oParams.sQuickVariantKey : "template::ListReport::AddEntry";}
				},
				Delete: {
					optionalParameters: ["sQuickVariantKey"],
					value: function (oParams) { return oParams.sQuickVariantKey ? "deleteEntry-" + oParams.sQuickVariantKey : "deleteEntry"; }
				},
				Filter: {
					optionalParameters: ["sQuickVariantKey"]
				},
				Sort: {
					optionalParameters: ["sQuickVariantKey"]
				},
				Group: {
					optionalParameters: ["sQuickVariantKey"]
				},
				Personalize: {
					optionalParameters: ["sQuickVariantKey"]
				},
				MultiEdit: {
					optionalParameters: ["sQuickVariantKey"]
				},
				SearchField: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? "Table::Toolbar::SearchField-" + oParams.sQuickVariantKey : "Table::Toolbar::SearchField";}
				},
				MultiEditDialog: {
					optionalParameters: ["sQuickVariantKey"]
				},
				TableExtension: {
					parameters: ["sAction"],
					optionalParameters: ["sQuickVariantKey"],
					value: function (oParams) { return oParams.sAction + (oParams.sQuickVariantKey ? "-" + oParams.sQuickVariantKey : ""); }
				},
				Share: {
					value: "template::Share"
				},
				AddCardtoInsights: {
					value: "template::AddCardtoInsights"
				}
			},
			ALPAction: {
				ExtensionAction: {
					parameters: ["sAction"],
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : oParams.sAction;}
				},
				Share: {
					value: "template::Share"
				}
			},
			QuickVariantSelectionX: {
				IconTabBar: {
					value: "template::IconTabBar"
				},
				IconTabFilter: {
					parameters: ["sQuickVariantKey"],
					value: function(oParams){return "template::IconTabFilter-" + oParams.sQuickVariantKey;}
				}
			},
			QuickVariantSelection: {
				SegmentedButton: {
					value: "template::SegmentedButton"
				},
				VariantSelect: {
					value: "template::VariantSelect"
				}
			},
			ALPTable: {
				SmartTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "table";}
				},
				SmartTableToolbar:{
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "template::TableToolbar";}
				},
				ResponsiveTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "responsiveTable";}
				},
				GridTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "gridTable";}
				},
				AnalyticalTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "analyticalTable";}
				},
				TreeTable: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "treeTable";}
				},
				ColumnListItem: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "template::responsiveHightlightCol";}
				}
			},
			ALPChart: {
				SmartChart: {
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "chart";}
				},
				SmartChartToolbar:{
					optionalParameters: ["sQuickVariantKey"],
					value: function(oParams){return oParams.sQuickVariantKey ? undefined : "template::ChartToolbar";}
				},
				AddCardtoInsights: {
					value: "template::AddCardtoInsights"
				}
			},
			ObjectPage: {
				HeaderFacet: {
					parameters: ["sRecordType"],
					optionalParameters: ["sAnnotationPath", "sAnnotationId"],
					value: function(oParams){
						if (oParams.sAnnotationId){
							return "header::headerEditable::" + oParams.sAnnotationId;
						} else {
							if (oParams.sRecordType !== "com.sap.vocabularies.UI.v1.ReferenceFacet"){
								throw new FeError();
							} 
							return "header::headerEditable::" + oParams.sAnnotationPath;
						}
					}
				},
				EditableHeaderFacet: {
					parameters: ["sRecordType"],
					optionalParameters: ["sAnnotationPath", "sAnnotationId"],
					value: getHeaderFacetId 
				},
				StandardFacet: {
					parameters: ["sRecordType"],
					optionalParameters: ["sAnnotationPath", "sAnnotationId"],
					value: getStandardFacetId
				},
				Facet: {
					parameters: ["sRecordType"],
					optionalParameters: ["bIsHeaderFacet", "sAnnotationPath", "sAnnotationId"],
					value: getFacetId
				},
				Section: {
					parameters: ["sFacet"],
					value: function(oParams){return oParams.sFacet + "::Section";}
				},
				SubSection: {
					parameters: ["sFacet"],
					value: function(oParams){return oParams.sFacet + "::SubSection";}
				},
				SubSectionLazyLoader: {
					parameters: ["sFacet"]
				},
				DataField: {
					parameters: ["sRecordType"],
					optionalParameters: ["sSemanticObject", "sAction"],
					value: function(oParams){
						switch (oParams.sRecordType){
						case "com.sap.vocabularies.UI.v1.DataFieldForAction": return oParams.sAction;
						case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation": // same as WithIBN (next line)
						case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation": return oParams.sSemanticObject + (oParams.sAction && "::" + oParams.sAction);
						// other cases (e.g. WithUrl or WithNavigationPath to be added - further optional prameters might be required
						default: return undefined;
						}
					}
				}
			},
			ObjectPageHeader: {
				DynamicHeaderContentFlexBox: {},
				InitialsAvatar: {},
				SnappedHeaderInitialsAvatar: {},
				HeaderTitle: {
					parameters: ["sFacet"]
				},
				SnappedTitleOnMobile: {}
			},
			ObjectPageAction: {
				Create: {
					parameters: ["sFacet"],
					value: function(oParams){return oParams.sFacet + "::addEntry";}
				},
				Delete: {
					parameters: ["sFacet"],
					value: function(oParams){return oParams.sFacet + "::deleteEntry";}
				},
				DisplayActiveVersion: {},
				ContinueEditing: {},
				EditText: {},
				SaveAndEdit: {},
				SaveAndNext: {},
				CreateWithDialog: {
					parameters: ["sFacet"]
				},
				AnnotatedAction: {
					parameters: ["sFacet", "sDataField"],
					value: function(oParams){return "action::" + oParams.sDataField + "::" + oParams.sFacet + "::FormAction";}
				},
				// applicable for all those actions (standard and custom) which follows a common pattern
				CommonAction: {
					parameters: ["sAction"],
					value: function (oParams) { return oParams.sAction; }
				},
				HeaderExtensionAction: {
					parameters: ["sAction"],
					value: function (oParams) { return "action::" + oParams.sAction; }
				},
				RelatedApps: {
					value: "relatedApps"
				},
				Share: {
					value: "template::Share"
				}
			},
			ObjectPageSection: {
				SmartForm: {
					parameters: ["sFacet"],
					optionalParameters: ["sIsPartOfPreview"],
					value: function(oParams){return oParams.sFacet + "::Form" + ( oParams.sIsPartOfPreview === "false" ? "::MoreContent" : "");}
				},
//				Seems not to be needed. If GridData is needed (the control at all, and its stable id), id generation should be adapted:
//				GridData: {
//					parameters: ["sFacet"],
//					optionalParameters: ["sIsPartOfPreview"],
//					value: function(oParams){return oParams.sFacet + "::Form::GridData" + ( oParams.sIsPartOfPreview === "false" ? "::MoreContent" : "");}
//				},
				Group: {
					parameters: ["sFacet"],
					optionalParameters: ["sIsPartOfPreview"],
					value: function(oParams){return oParams.sFacet + "::FormGroup" + ( oParams.sIsPartOfPreview === "false" ? "::MoreContent" : "");}
				},
				DynamicSideContent: {
					parameters: ["sFacet"],
					value: function(oParams){return oParams.sFacet + "::DynamicSideContent";}
				},
				SideContentButton: {
					parameters: ["sFacet"],
					value: function(oParams){return oParams.sFacet + "::SideContentButton";}
				},
				BeforeFacetExtensionSection: {
					parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "BeforeFacet::" + oParams.sEntitySet  + "::" +  oParams.sFacet + "::Section";}
				},
				BeforeFacetExtensionSubSection: {
					parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "BeforeFacet::" + oParams.sEntitySet  + "::" +  oParams.sFacet + "::SubSection";}
				},
				BeforeFacetExtensionSectionWithKey: {
					parameters: ["sEntitySet", "sFacet", "sFacetExtensionKey"]
				},
				BeforeFacetExtensionSubSectionWithKey: {
					parameters: ["sEntitySet", "sFacet", "sFacetExtensionKey"]
				},
				AfterFacetExtensionSection: {
					parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "AfterFacet::" + oParams.sEntitySet  + "::" +  oParams.sFacet + "::Section";}
				},
				AfterFacetExtensionSubSection: {
					parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "AfterFacet::" + oParams.sEntitySet  + "::" +  oParams.sFacet + "::SubSection";}
				},
				AfterFacetExtensionSectionWithKey: {
					parameters: ["sEntitySet", "sFacet", "sFacetExtensionKey"]
				},
				AfterFacetExtensionSubSectionWithKey: {
					parameters: ["sEntitySet", "sFacet", "sFacetExtensionKey"]
				},
				BeforeSubSectionExtensionSubSection: {
					parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "BeforeSubSection::" + oParams.sEntitySet  + "::" + oParams.sFacet + "::SubSection";}
				},
				AfterSubSectionExtensionSubSection: {
					parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "AfterSubSection::" + oParams.sEntitySet  + "::" + oParams.sFacet + "::SubSection";}
				},
				AfterSubSectionExtensionLazyloader: {
                    parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "AfterSubSection::" + oParams.sEntitySet  + "::" + oParams.sFacet + "::SubSectionLazyLoader";}
                },
                BeforeSubSectionExtensionLazyloader: {
                    parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "BeforeSubSection::" + oParams.sEntitySet  + "::" + oParams.sFacet + "::SubSectionLazyLoader";}
                },
                ReplaceSubSectionExtensionLazyloader: {
                    parameters: ["sEntitySet", "sFacet"],
					value: function(oParams){return "ReplaceSubSection::" + oParams.sEntitySet  + "::" + oParams.sFacet + "::SubSectionLazyLoader";}
                },
				AddressLabel: {
					parameters: ["sFacet"]
				},
				AddressValue: {
					parameters: ["sFacet"]
				},
				AddressDataField: {
					parameters: ["sFacet", "sAnnotationPath"]
				},
				SemanticConnectedField: {
                    parameters: ["sFacet", "sAnnotationPath"]
                },
				ReuseComponentSection: {
					parameters: ["sReuseComponentKey"],
					optionalParameters: ["sReuseComponentName", "sReuseComponentUsage"],
					value: function(oParams){ return (oParams.sReuseComponentName || oParams.sReuseComponentUsage) + "::" + oParams.sReuseComponentKey + "::ComponentSection"; }
				},
				ReuseComponentSubSection: {
					parameters: ["sReuseComponentKey"],
					optionalParameters: ["sReuseComponentName", "sReuseComponentUsage"],
					value: function(oParams){ return (oParams.sReuseComponentName || oParams.sReuseComponentUsage) + "::" + oParams.sReuseComponentKey + "::ComponentSubSection"; }
				},
				ReuseComponentContainer: {
					parameters: ["sReuseComponentKey"],
					optionalParameters: ["sReuseComponentName", "sReuseComponentUsage"],
					value: function(oParams){ return (oParams.sReuseComponentName || oParams.sReuseComponentUsage) + "::" + oParams.sReuseComponentKey + "::ComponentContainer"; }
				},
				ReuseComponentContainerContent: {
					parameters: ["sReuseComponentKey"],
					optionalParameters: ["sReuseComponentName", "sReuseComponentUsage"],
					value: function(oParams){ return (oParams.sReuseComponentName || oParams.sReuseComponentUsage) + "::" + oParams.sReuseComponentKey + "::ComponentContainerContent"; }
				}
			},
			ObjectPageTable: {
				SmartTable: {
					parameters: ["sFacet"],
					value: function(oParams){return oParams.sFacet + "::Table";}
				},
				ColumnListItem: {
					parameters: ["sFacet"],
					value: function(oParams){return "template:::ObjectPageTable:::ColumnListItem:::sFacet::" + oParams.sFacet;}
				},
				SegmentedButton: {
					parameters: ["sFacet"]
				},
				VariantSelection: {
					parameters: ["sFacet"]
				},
				SegmentedButtonItem: {
					parameters: ["sFacet", "sQuickVariantKey"]
				},
				VariantSelectionItem: {
					parameters: ["sFacet", "sQuickVariantKey"]
				}
			},
			TableColumn: {
				DataField: {
					parameters: ["sSmartTableId", "sProperty"],
					value: function(oParams){return oParams.sSmartTableId + "-" + oParams.sProperty.replace("/", "_");}
				},
				DataFieldWithNavigationPath: {
					parameters: ["sSmartTableId", "sProperty", "sTarget"]
				},
				DataFieldWithIntentBasedNavigation: {
					parameters: ["sSmartTableId", "sProperty", "sSemanticObject", "sAction"]
				},
				DataFieldForAnnotation: {
					parameters: ["sSmartTableId", "sTarget"]
				},
				DataFieldForAction: {
					parameters: ["sSmartTableId", "sAction"]
				},
				DataFieldForIntentBasedNavigation: {
					parameters: ["sSmartTableId", "sSemanticObject", "sAction"]
				}
			},
			QuickView: {
				Avatar: {}
			},
			VisualFilterBar: {
				FilterItemMicroChart: {
					parameters: ["sProperty"]
				},
				ValueHelpButton: {
					parameters: ["sProperty"]
				},
				FilterItemContainer: {
					parameters: ["sProperty"]
				}
			},
			VisualFilterDialog: {
				FilterItemMicroChart: {
					parameters: ["sProperty"]
				},
				ValueHelpButton: {
					parameters: ["sProperty"]
				},
				FilterItemContainer: {
					parameters: ["sProperty"]
				}
			},
			MultiEditDialog: {
				SmartForm: {
					optionalParameters: ["sQuickVariantKey"]
				},
				Group:  {
					optionalParameters: ["sQuickVariantKey"]
				},
				GroupExtension:  {
					optionalParameters: ["sQuickVariantKey"]
				},
				DataField: {
					// Currently we support only RecordType = "com.sap.vocabularies.UI.v1.DataField" in the multiEdit dialog. Hence parameter sRecordType would always have same value.
					// Though parameter sRecordType seems superfluous here, we provided it so that in future when we start supporting other recordTypes in multiEdit dialog, we can still achieve consistent stable ids.
					// For same reason though currently sProperty is always provided but it's kept optional, so that in future we can support other recordTypes with different optional parameters.
					parameters: ["sRecordType"],
					optionalParameters: ["sProperty", "sQuickVariantKey"]
				},
				GroupElement: {
					parameters: ["sDataField"]
				}
			},
			Canvas: {
				ImplementingComponentContainer: {
					value: function(){ return "template::ImplementingComponent"; }
				},
				ImplementingComponentContainerContent: {
					value: function(){ return "template::ImplementingComponentContent"; }
				}				
			},
			Action: {
				Global: {
					parameters: ["sAction"],
					value: function (oParams) { return "action::" + oParams.sAction; }
				}
			}
		}
	};
});
