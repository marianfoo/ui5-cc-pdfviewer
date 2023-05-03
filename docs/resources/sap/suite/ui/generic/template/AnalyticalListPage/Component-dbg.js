sap.ui.define(["sap/ui/core/mvc/OverrideExecution",
	"sap/suite/ui/generic/template/lib/TemplateAssembler",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/ControllerImplementation",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/AnalyticalListPage/controllerFrameworkExtensions",
	"sap/suite/ui/generic/template/js/preparationHelper",
	"sap/base/util/deepExtend",
	"sap/suite/ui/generic/template/listTemplates/filterSettingsPreparationHelper",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/js/AnnotationHelper",
	"sap/base/util/isEmptyObject",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/AnnotationHelper",
	"sap/insights/CardHelper"
], function(OverrideExecution, TemplateAssembler, ControllerImplementation, JSONModel, controllerFrameworkExtensions, preparationHelper, deepExtend,
	filterSettingsPreparationHelper, StableIdHelper, AnnotationHelper, isEmptyObject, ALPAnnotationHelper, CardHelper) {
	"use strict";

	function getMethods(oComponent, oComponentUtils) {
		var oViewProxy = {};

		return {
			oControllerSpecification: {
				getMethods: ControllerImplementation.getMethods.bind(null, oViewProxy),
				oControllerDefinition: controllerFrameworkExtensions,
				oControllerExtensionDefinition: { // callbacks for controller extensions
					metadata: {
						methods: {
							onInitSmartFilterBar: { "public": true, "final": false, overrideExecution: OverrideExecution.After},
							provideExtensionAppStateData: { "public": true, "final": false, overrideExecution: OverrideExecution.After},
							restoreExtensionAppStateData: { "public": true, "final": false, overrideExecution: OverrideExecution.After},
							ensureFieldsForSelect: { "public": true, "final": false, overrideExecution: OverrideExecution.After},
							addFilters: { "public": true, "final": false, overrideExecution: OverrideExecution.After}
						}
					},
					// will be called when the SmartFilterbar has been initialized
					onInitSmartFilterBar: function(oEvent) {},
					// allows extensions to strore their specific state. Therefore, the implementing controller extension must call fnSetAppStateData(oControllerExtension, oAppState).
					// oControllerExtension must be the ControllerExtension instance for which the state should be stored. oAppState is the state to be stored.
					// Note that the call is ignored if oAppState is faulty
					provideExtensionAppStateData: function(fnSetAppStateData){},
					// asks extensions to restore their state according to a state which was previously stored.
					// Therefore, the implementing controller extension can call fnGetAppStateData(oControllerExtension) in order to retrieve the state information which has been stored in the current state for this controller extension.
					// undefined will be returned by this function if no state or a faulty state was stored.
					restoreExtensionAppStateData: function(fnGetAppStateData){},
					// give extensions the possibility to make sure that certain fields will be contained in the select clause of the table binding. 
					// This should be used, when custom logic of the extension depends on these fields.
					// For each custom field the extension must call fnEnsureSelectionProperty(oControllerExtension, sFieldname).
					// oControllerExtension must be the ControllerExtension instance which ensures the field to be part of the select clause.
					// sFieldname must specify the field to be selected. Note that this must either be a field of the entity set itself or a field which can be reached via a :1 navigation property.
					// In the second case sFieldname must contain the relative path.
					ensureFieldsForSelect: function(fnEnsureSelectionProperty, sControlId){},
					// allow extension to add filters. They will be combined via AND with all other filters
					// For each filter the extension must call fnAddFilter(oControllerExtension, oFilter)
					// oControllerExtension must be the ControllerExtension instance which adds the filter
					// oFilter must be an instance of sap.ui.model.Filter
					addFilters: function(fnAddFilter, sControlId){}
				}
			},
			oComponentData: { // data defined by component (i.e. not to be overridden by manifest
				templateName: "sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage",
				designtimePath: "sap/suite/ui/generic/template/designtime/AnalyticalListPage.designtime"
			},
			init: function() {
				var oTemplatePrivate = oComponent.getModel("_templPriv");
				// Note that component properties are not yet available here
				oTemplatePrivate.setProperty("/listReport", {});
				// Property to store UI settings of ALP
				oTemplatePrivate.setProperty("/alp", {
					visualFilter: {}
				}); // Note that component properties are not yet available here

				//Filter model
				var filterModel = new JSONModel();
				//Model is bound to the component as it affects various controls
				oComponent.setModel(filterModel, "_filter");
			},
			//Adds Pageheader to the FIORI shell
			onActivate: function() {
				oViewProxy.onComponentActivate();
			},
			refreshBinding: function() {
				oViewProxy.refreshBinding();
			},
			onSuspend: function () {
				oViewProxy.onSuspend();
			},
			onRestore: function () {
				oViewProxy.onRestore();
			},
			getUrlParameterInfo: function() {
				return oViewProxy.getUrlParameterInfo();
			},
			getTemplateSpecificParameters: function(oMetaModel, oSettings, Device, sLeadingEntitySet, oInternalManifest, oModel){
				// gets smart table and smart chart's qualifiers
				function fnGetQualifiers(sTabIdentifier) {
					var oQualifier = {
						sLineItemQualifier: "",
						sChartQualifier: ""
					};
					var sAnnotation = "";
					
					if (oAlpSettings.quickVariantSelectionX) {
						var oVariant = oEntityType[oAlpSettings.quickVariantSelectionX.variants[sTabIdentifier].annotationPath];
						if (oVariant && oVariant.PresentationVariant) {
							var oPresentationVariantAnnotation;
							if (oVariant.PresentationVariant.Path) {
								var sPresentationVariantPath = oVariant.PresentationVariant.Path.split("@")[1];
								oPresentationVariantAnnotation = sPresentationVariantPath && oEntityType[sPresentationVariantPath];
							} else {
								oPresentationVariantAnnotation = oVariant.PresentationVariant;
							}
							sAnnotation = oPresentationVariantAnnotation.Visualizations && oPresentationVariantAnnotation.Visualizations[0].AnnotationPath;
						} else if (oVariant && oVariant.Visualizations) {
							sAnnotation = oVariant.Visualizations[0].AnnotationPath;
						}
						if (sAnnotation && sAnnotation.indexOf("com.sap.vocabularies.UI.v1.LineItem") > -1) {
							oQualifier.sLineItemQualifier = sAnnotation.split("#")[1] || "";
						}
					} else {
						var sAnnotationPath = oEntityType.$path + "/com.sap.vocabularies.UI.v1.SelectionPresentationVariant" + (oAlpSettings && oAlpSettings.qualifier ? "#" + oAlpSettings.qualifier : "");
						var oSelectionPresentationVariant = oMetaModel.getObject(sAnnotationPath);
						sAnnotationPath = ALPAnnotationHelper.getAnnotationfromSPV(oEntityType, sAnnotationPath, oSelectionPresentationVariant, sAnnotationPath, (oAlpSettings ? oAlpSettings.qualifier : ""), "PresentationVariant");
						var oPresentationVariant = oMetaModel.getObject(sAnnotationPath);
						if (oPresentationVariant && oPresentationVariant.Visualizations) {
							oPresentationVariant.Visualizations.forEach(function (visualization) {
								var sPath = "/" + visualization.AnnotationPath.slice(1);
								if (sPath.indexOf("com.sap.vocabularies.UI.v1.LineItem") > -1) {
									oQualifier.sLineItemQualifier = (oEntityType.$path + sPath).split("#")[1] || "";
								} else if (!oAlpSettings.chartPresentationQualifier && (sPath.indexOf("com.sap.vocabularies.UI.v1.Chart") > -1)) {
									oQualifier.sChartQualifier = (oEntityType.$path + sPath).split("#")[1] || "";
								}
							});
						}
					}

					return oQualifier;
				}

				// handle keyboard shortcut related manifest settings for actions defined via annotations e.g. DataFieldForAction and DataFieldForIBN
				function fnGetAnnotatedActionsCommandDetails(sTabIdentifier) {
					function fnGetCommandDetails(aControlAnnotations, bIsChart) {
						var oCommands = {
							mAnnotatedActionsWithCommand: Object.create(null),
							mOutboundActionsWithCommand: Object.create(null)
						};
						aControlAnnotations.forEach(function (oDataField) {
							switch (oDataField.RecordType) {
								case "com.sap.vocabularies.UI.v1.DataFieldForAction":
									var oCommandDetails = oComponentUtils.getToolbarDataFieldForActionCommandDetails(oDataField, oAlpSettings, oAlpSettings.quickVariantSelectionX ? oAlpSettings.quickVariantSelectionX.variants[sTabIdentifier] : undefined, undefined, bIsChart);
									if (!isEmptyObject(oCommandDetails)) {
										oCommands.mAnnotatedActionsWithCommand[oCommandDetails.id] = oCommandDetails;
									}
									break;
								case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
									var oCommandDetails = oComponentUtils.getToolbarDataFieldForIBNCommandDetails(oDataField, oAlpSettings, oInternalManifest, oAlpSettings.quickVariantSelectionX ? oAlpSettings.quickVariantSelectionX.variants[sTabIdentifier] : undefined, undefined, bIsChart);
									if (!isEmptyObject(oCommandDetails)) {
										oCommands.mOutboundActionsWithCommand[oCommandDetails.id] = oCommandDetails;
									}
									break;
								default:
									break;
							}
						});
						return oCommands;
					}

					var oQualifiers = fnGetQualifiers(sTabIdentifier);
					var oLineItemCommands = fnGetCommandDetails(oEntityType["com.sap.vocabularies.UI.v1.LineItem" + (oQualifiers.sLineItemQualifier ? "#" + oQualifiers.sLineItemQualifier : "")] || [], false);
					var oChartAnnotations = oEntityType["com.sap.vocabularies.UI.v1.Chart" + (oQualifiers.sChartQualifier ? "#" + oQualifiers.sChartQualifier : "")];
					/* Chart's actions object in the metamodel could be:
					   an empty object,  if empty Actions property has been defined
					   an array with objects, if atleast one action has been defined under Actions property
					   an empty array, if Actions property has been defined with an empty collection */
					var oChartCommands = fnGetCommandDetails(oChartAnnotations && !isEmptyObject(oChartAnnotations.Actions) ? oChartAnnotations.Actions : [], true);

					return {
						tableSettings: {
							commandExecution: deepExtend(oLineItemCommands.mAnnotatedActionsWithCommand, oLineItemCommands.mOutboundActionsWithCommand)
						}, chartSettings: {
							commandExecution: deepExtend(oChartCommands.mAnnotatedActionsWithCommand, oChartCommands.mOutboundActionsWithCommand)
						}
					};
				}

				var oExtensions = oComponentUtils.getControllerExtensions();
				var oEntitySet = oMetaModel.getODataEntitySet(sLeadingEntitySet);
				var oLineItem = preparationHelper.getLineItemFromVariant(oMetaModel, oEntitySet.entityType, oSettings.qualifier);
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var oAlpSettings = deepExtend({}, oSettings);
				oAlpSettings.targetEntities = {};
				// set Target Entities for Leading Entity
				oAlpSettings.targetEntities[oEntitySet.entityType] = preparationHelper.getTargetEntityForQuickView(oMetaModel, oEntitySet); 

				oAlpSettings.tableSettings = preparationHelper.getNormalizedTableSettings(oMetaModel, oSettings, Device, sLeadingEntitySet, oExtensions && oExtensions.Actions, oLineItem);
				oAlpSettings.isSelflinkRequired = false;
				oAlpSettings.isIndicatorRequired = false;
				oAlpSettings.isSemanticallyConnected = true;
				oAlpSettings.controlConfigurationSettings = filterSettingsPreparationHelper.getControlConfigurationSettings(oAlpSettings, oEntityType, oEntitySet,  oModel);

				function checkIfSmartChart(sEntitySet, oTabItem) {
					var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
					var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
					var sAnnotation, sAnnotationPath, oVariant;
					sAnnotationPath = oTabItem.annotationPath;
					oVariant = !!sAnnotationPath && oEntityType[sAnnotationPath];
					if (oVariant && oVariant.PresentationVariant) {
						// oVariant is SelectionPresentationVariant
						if (oVariant.PresentationVariant.Visualizations) {
							sAnnotation =  oVariant.PresentationVariant.Visualizations[0].AnnotationPath;
						} else if (oVariant.PresentationVariant.Path) {
							var sPresentationVariantPath = oVariant.PresentationVariant.Path.split("@")[1];
							var oPresentationVariantAnnotation = sPresentationVariantPath && oEntityType[sPresentationVariantPath];
							sAnnotation =  oPresentationVariantAnnotation.Visualizations[0].AnnotationPath;
						}

					} else if (oVariant && oVariant.Visualizations) {
						// oVariant is PresentationVariant
						sAnnotation =  oVariant.Visualizations[0].AnnotationPath;
					}
					return !!(sAnnotation && sAnnotation.indexOf("com.sap.vocabularies.UI.v1.Chart") > -1);
				}
				function setTargetEntity(oEntitySet) {
					if (!oAlpSettings.targetEntities[oEntitySet.entityType]) {
						oAlpSettings.targetEntities[oEntitySet.entityType] = preparationHelper.getTargetEntityForQuickView(oMetaModel, oEntitySet);
					}
				}

				// Creates CustomActions along with shortcut key commands for the Extensions Buttons of table/chart in Manifest
				function fnCustomActions (sTabKey, sTabIdentifier) {
					var oControllerExtensions = oComponentUtils.getControllerExtensions();
					var aTableExtensionActionsWithoutLogicalAction = [],  aChartExtensionActionsWithoutLogicalAction = [], mTableLevelCustomActionsWithCommand = Object.create(null),
					mChartLevelCustomActionsWithCommand = Object.create(null);

					Object.values(oControllerExtensions && oControllerExtensions.Actions || {}).forEach(function (oExtensionAction) {
						if (!oExtensionAction.global) {
							var oStableIdParameters = oExtensionAction.global ?
								{ type: "Action", subType: "Global", sAction: oExtensionAction.id } :
								{ type: "ALPAction", subType: "ExtensionAction", sAction: oExtensionAction.id, sQuickVariantKey: sTabKey };
							var sActionId = StableIdHelper.getStableId(oStableIdParameters);
							oExtensionAction.enabled = AnnotationHelper.getBreakoutActionEnabledKey(oExtensionAction, oAlpSettings.quickVariantSelectionX ? oAlpSettings.quickVariantSelectionX.variants[sTabIdentifier] : undefined);
							if (oExtensionAction.command) {
								var oCommandDefinition = {
									id: sActionId,
									action: oExtensionAction.command,
									callbackName: oExtensionAction.press
								};
								oExtensionAction.press = "cmd:" + oExtensionAction.command;
								oExtensionAction.id = sActionId;
							} 
							if (oExtensionAction.filter === "chart") {
								if (oCommandDefinition) {
									mChartLevelCustomActionsWithCommand[oExtensionAction.id] = oCommandDefinition;
								}
								aChartExtensionActionsWithoutLogicalAction.push(oExtensionAction);
							} else {
								if (oCommandDefinition) {
									mTableLevelCustomActionsWithCommand[oExtensionAction.id] = oCommandDefinition;
								}
								aTableExtensionActionsWithoutLogicalAction.push(oExtensionAction);
							}
						}
							
					});

					return {
						tableSettings : {
							commandExecution: mTableLevelCustomActionsWithCommand,
							extensionActions: aTableExtensionActionsWithoutLogicalAction
						}, chartSettings : {
							commandExecution: mChartLevelCustomActionsWithCommand,
							extensionActions: aChartExtensionActionsWithoutLogicalAction
						}
					};
				}

				if (oAlpSettings.quickVariantSelectionX) {
					// tableSettings for component used as default for variants
					var oDefaultTableSettings = preparationHelper.getNormalizedTableSettings(oMetaModel, oAlpSettings, Device, sLeadingEntitySet, oExtensions && oExtensions.Actions, oLineItem);
					//for multiple variants
					var oVariants = oAlpSettings.quickVariantSelectionX.variants || {};
					for (var sKey in oVariants) {
						var sEntitySet = oVariants[sKey].entitySet || sLeadingEntitySet;
						var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
						//support for reducing entitySet - Skip if entitySet not present in metadata
						if (!oEntitySet) {
							delete oVariants[sKey];
							continue;
						}
						//

						oVariants[sKey].isSmartChart = checkIfSmartChart(sEntitySet, oVariants[sKey]);
						if (!oVariants[sKey].isSmartChart) {
							// get LineItem for current variant by searching for SelectionPresentationVariant (variant is used as Qualifier)
							var oLineItem = preparationHelper.getLineItemFromVariant(oMetaModel, oMetaModel.getODataEntitySet(sEntitySet).entityType, oVariants[sKey].annotationPath && oVariants[sKey].annotationPath.split("#")[1]);
							oVariants[sKey].tableSettings = oVariants[sKey].tableSettings || oDefaultTableSettings;
							oVariants[sKey].tableSettings = preparationHelper.getNormalizedTableSettings(oMetaModel, oVariants[sKey], Device, sEntitySet, oExtensions && oExtensions.Actions, oLineItem);
							//default value of selectAll is different for LR/ALP from OP hence it is not calculated in preparationHelper but separately in respective components.
							oVariants[sKey].tableSettings.selectAll = (oVariants[sKey].tableSettings.selectAll === undefined ? false : oVariants[sKey].tableSettings.selectAll);
					
							if (oAlpSettings.isResponsiveTable === undefined){
								oAlpSettings.isResponsiveTable = oVariants[sKey].tableSettings.type === "ResponsiveTable";
							}
							var oVariantEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
							if (oVariantEntityType && oVariantEntityType.property && oVariants[sKey].tableSettings && oVariants[sKey].tableSettings.createWithParameterDialog) {
								oAlpSettings.quickVariantSelectionX.variants[sKey].tableSettings.createWithParameterDialog.id = StableIdHelper.getStableId({type: 'ALPAction', subType: 'CreateWithDialog', sQuickVariantKey: oVariants[sKey].key});
							}
							setTargetEntity(oEntitySet);
							// tableSettings in case of Multitable, it may contain chart or table settings.
							oVariants[sKey].tableSettings = deepExtend(oVariants[sKey].tableSettings, fnCustomActions(oVariants[sKey].key, sKey).tableSettings, fnGetAnnotatedActionsCommandDetails(sKey).tableSettings);
						}
					}

					delete oAlpSettings.tableSettings;
					//handle where variants contain only charts
					if (oAlpSettings.isResponsiveTable === undefined){
						oAlpSettings.isResponsiveTable = true;
					}
				} else {
					//for single  variant
					oAlpSettings.tableSettings = preparationHelper.getNormalizedTableSettings(oMetaModel, oSettings, Device, sLeadingEntitySet,oExtensions && oExtensions.Actions, oLineItem);
					//default value of selectAll is different for LR/ALP from OP hence it is not calculated in preparationHelper but separately in respective components.
					oAlpSettings.tableSettings.selectAll = (oAlpSettings.tableSettings.selectAll === undefined ? false : oAlpSettings.tableSettings.selectAll);
					oAlpSettings.isResponsiveTable = oAlpSettings.tableSettings.type === "ResponsiveTable";
					if (oAlpSettings.tableSettings.enableMultiEditDialog && oAlpSettings.isResponsiveTable && !oComponentUtils.isDraftEnabled() && !oAlpSettings.isWorklist && !oComponent.getAppComponent().getFlexibleColumnLayout()) {
						oAlpSettings.multiEdit = true;
						if (oEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"] && oEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"].Updatable && oEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"].Updatable.Bool === "false") {
							oAlpSettings.multiEdit = false;
						} else if (oAlpSettings.tableSettings.mode === "None") {
							oAlpSettings.tableSettings.mode = (oAlpSettings.tableSettings.multiSelect ? "MultiSelect" : "SingleSelectLeft");
						}
					}
					setTargetEntity(oEntitySet);
					var oCustomActions = fnCustomActions();
					var oAnnotatedActionsCommand = fnGetAnnotatedActionsCommandDetails();
					oAlpSettings.tableSettings = deepExtend(oAlpSettings.tableSettings, oCustomActions.tableSettings, oAnnotatedActionsCommand.tableSettings);
					oAlpSettings.chartSettings = deepExtend(oAlpSettings.chartSettings, oCustomActions.chartSettings, oAnnotatedActionsCommand.chartSettings);
				}

				oAlpSettings.bInsightsEnabled = false;
				CardHelper.getServiceAsync("UIService").then(function(oInstance){
					oAlpSettings.bInsightsEnabled = true;
					var oTemplatePrivate = oComponent.getModel("_templPriv");
					oTemplatePrivate.setProperty("/oInsightsInstance", oInstance);
				}).catch(function(response) {
					oAlpSettings.bInsightsEnabled = false;
				});

				return oAlpSettings;
			},
			overwrite: {
				updateBindingContext: function() {

					sap.suite.ui.generic.template.lib.TemplateComponent.prototype.updateBindingContext.apply(oComponent, arguments);

					//commented below as here we get the metamodel only if the oBindingContext is present.
					/*var oBindingContext = oComponent.getBindingContext();
					if (oBindingContext) {
						oComponent.getModel().getMetaModel().loaded()
						.then(
							function() {
								//var oUIModel = oComponent.getModel("ui");

									// set draft status to blank according to UI decision
									// oUIModel.setProperty("/draftStatus", "");

									var oActiveEntity = oBindingContext.getObject();
									if (oActiveEntity) {

										var oDraftController = oComponent.getAppComponent().getTransactionController()
										.getDraftController();
										var oDraftContext = oDraftController.getDraftContext();
										var bIsDraft = oDraftContext.hasDraft(oBindingContext) && !oActiveEntity.IsActiveEntity;
										//var bHasActiveEntity = oActiveEntity.HasActiveEntity;
										if (bIsDraft) {
											oUIModel.setProperty("/editable", true);
											oUIModel.setProperty("/enabled", true);
										}
									}
								});
						//fnBindBreadCrumbs();
					}*/
				}
			},
			executeBeforeInvokeActionFromExtensionAPI: function(oState, oCommonUtils) {
				if (oState.oSmartTable) {
					oState.oSmartTable.getTable().attachEventOnce("updateFinished", function () {
						oCommonUtils.setEnabledToolbarButtons(oState.oSmartTable);
						oCommonUtils.setEnabledFooterButtons(oState.oSmartTable);
					});
				}
				if (oState.oSmartChart) {
					oState.oSmartChart.getChartAsync().then(function(oChart) {
						oChart.attachEventOnce("updateFinished", function () {
							oCommonUtils.setEnabledToolbarButtons(oState.oSmartChart);
							oCommonUtils.setEnabledFooterButtons(oState.oSmartChart);
						});
					});
				}
			}
		};
	}

	return TemplateAssembler.getTemplateComponent(getMethods,
		"sap.suite.ui.generic.template.AnalyticalListPage", {
			metadata: {
				library: "sap.suite.ui.generic.template",
				properties: {
					"qualifier": {
						/*
							optional qualifier for a SelectionPresentationVariant or a PresentationVariant
							annotation. If no SelectionPresentationVariant exists with or without qualifier
							a PresentationVariant with the qualifier is searched. It always falls back to default
							of first SPV and than PV if qualifier can not be found
						 */
						"type": "string",
						"defaultValue": ""
					},
					"chartPresentationQualifier": {
						/*
							optional qualifier for a PresentationVariant
							annotation for chart in content area
						 */
						"type": "string",
						"defaultValue": ""
					},
					"gridTable": { // obsolete - use tableSettings.type instead
						/*
							This setting allows app developer to use GridTable in content area
							If sap:semantics=aggregate then AnalyticalTable is used and this setting have no effect
							If the display type is not desktop but mobile or tablet or other devices always responsive table is shown.
							Note: This Property is depricated. Use tableType Property to achieve the same henceforth.
							using tableType to get gridTable --> instead of using gridTable === true, use tableType === GridTable.
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"tableType": { // obsolete - use tableSettings.type instead
						/*
							This setting allows developer to define the table type of their choice.
							It takes more precedence from any other settings like gridTable.
							Eg : if gridTable == true and tableType === AnalyticalTable it takes more precedence and render Analytical table.
							@since 1711
							Valid values: AnalyticalTable, GridTable or ResponsiveTable
						 */
						"type": "string",
						"defaultValue": ""
					},
					"multiSelect": { // obsolete - use tableSettings.multiSelect instead
						/*
							This setting allows app developer to show checkbox for selecting multiple items in table.
							Only if there are Actions (annotation or manifest), this setting would come into effect.
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"tableSettings": {
						type: "object",
						properties: { 	// Unfortunately, managed object does not provide any specific support for type "object". We use just properties, and define everything below exactly like the properties of the component.
							type: { // Defines the type of table to be used. Possible values: ResponsiveTable, GridTable, TreeTable, AnalyticalTable. 
								type: "string",
								defaultValue: undefined // If sap:semantics:aggregate, and device is not phone, analyticalTable is used by default, otherwise responsiveTable
							},
							multiSelect: { // Defines, whether selection of multiple entries is possible. Only relevant, if actions exist.
								type: "boolean",
								defaultValue: false
							},
							selectAll: { // Defines, whether a button to select all entries is available. Only relevant for tableType gridTable and analyticalTable and if multiselect is true.
								type: "boolean",
								defaultValue: true
							},
							selectionLimit: { // Defines the maximal number of lines to be loaded by a range selection from the backend. Only relevant for tableType gridTable, if multiselect is true, and selectAll is false.  
								type: "int",
								defaultValue: 200
							}
						}
					},
					"chartSettings": {
						type: "object",
						properties: {
							showDataLabel: {
								type: "boolean",
								defaultValue: false
							}
						}
					},
					"smartVariantManagement": {
						/*
							This setting allows developer to choose Control level variant instead of Page Variant
							CAUTION: Change in this setting would require app developer to recreate all previously
							saved variants.
						 */
						"type": "boolean",
						"defaultValue": true
					},
					"defaultContentView":{
						/*
							This setting allows developer to set the content view which will be displayed on app launch
							If the end user has chosen any other view in their default variants then that will have priority
							over this setting.
							Default is hybrid view (charttable).
							Valid values "charttable", "chart", "table"
						 */
						"type": "string",
						"defaultValue": "charttable"
					},
					"lazyLoadVisualFilter":{
						/*
							This setting allows developer to delay the loading of visual filter.
							It ensure to make a oData request only when the user switches to visual filter or on initial load.
							If user clicks on adapt filter if the default mode is compact then the call is blocked unless user switches to visual filter.
						 */
						"type": "boolean",
						"defaultValue": true
					},
					"defaultFilterMode": {
						/*
							This setting allows developer to set the default filter mode which will be displayed on app launch
							If the end user has chosen a different filter mode in their default variants then that will have priority
							over this setting.
							Default is visual filter.
							Valid values "visual", "compact"
						 */
						"type": "string",
						"defaultValue": "visual"
					},
					/*
						This setting allows developer to define KPI Tags in ALP, e.g.
						"ActualCosts": {
							"model": "kpi",	//model defined in the manifest sap.ui5.models
							"entitySet": "CZ_PROJECTKPIS",	//name of the entity set, in case of parameterized set please mention result entity set name
							"qualifier": "ActualCosts",	//Qualifier of SelectionPresentationVariant which have a DataPoint and Chart visualization
							"detailNavigation": "ActualCostsKPIDetails"	//[Optional] Key of Outbound navigation defined in sap.app.crossNavigation.outbounds
						}
					*/
					"keyPerformanceIndicators": "array",
					"autoHide": {
						/*
							This setting allows developer to determine chart / table interaction. 'true' would mean chart act as
							filter for table, 'false' would mean that matching table rows are highlighted but table is not
							filtered.
						 */
						"type": "boolean",
						"defaultValue": true
					},
					"showAutoHide": {
						/*
							This setting allows developer to hide the autoHide segmented button. When the button is hidden, default
							chart/table interaction is filter.
						 */
						"type": "boolean",
						"defaultValue": true
					},
					"hideVisualFilter": {
						/*
							DEPRECATED:	This setting allows developer to hide the visual filters.
							PLEASE DO NOT USE THIS SETTING IN NEW PROJECTS
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"showGoButtonOnFilterBar": {
						/*
							This setting allows developer to run ALP in non live mode. When it is set to true, app have a "GO"
							button in the Filter Bar and the filter selections are not applied till Go is pressed.
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"uniqueHierarchyNodeIDForTreeTable": {
						/*
							This setting allows developer to define the unique parent tree node Id from which the parsing of hierarchy service takes place for tree table
							Taking uniqueHierarchyNodeIDForTreeTable, it's corresponding childs and properties are parsed and saved.
							All the dimension except which is linked to hierarchy service attributes are been put into ignoreFields.
						 */
						"type": "string",
						"defaultValue": ""
					},
					"showItemNavigationOnChart": {
						/*
							This setting allows developer to display a Item Navigation on SmartChart's "Detail" popover list.
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"condensedTableLayout": {
						/*
							This setting allows user to display SmartTable in condensed mode. More line items are visible
							in this mode compared to compact.
						 */
						"type": "boolean",
						"defaultValue": true
					},
					"contentTitle": {
						/*
							This setting allows developer to display Contentarea Title.
						 */
						"type": "string",
						"defaultValue": undefined
					},
					"enableTableFilterInPageVariant": {
						/*
							This setting allows developer to enable/disable filter option on table columns incase of Page level variant is enabled.
						 */
						"type": "boolean",
					"defaultValue": false
					},
					"dshQueryName" : {
						/*
							Setting to enable DSH crosstable
						*/
						"type" : "string",
						"defaultValue": undefined
					},
					"filterDefaultsFromSelectionVariant" : {
						/*
							This setting allows developer to choose SV from annotation
						*/
						"type": "boolean",
						"defaultValue": false
					},
					"allFiltersAsInParameters" : {
						/*
							This setting allows developer to pass all filter fields as InParameters
						*/
						"type": "boolean",
						"defaultValue": true
					},
					"dataLoadSettings": {
						type: "object",
						properties: {
							loadDataOnAppLaunch: {
								type:"string",
								defaultValue: "ifAnyFilterExist"  //can contain 3 values always/never/ifAnyFilterExist
							}
						}
					},
					filterSettings: filterSettingsPreparationHelper.getFilterSettingsMetadata(),
					"refreshIntervalInMinutes": {
						/*
							This setting allows developer to refresh entire content area (visualFilters,filterableKpis,chart and table every x milliseconds without any user input.
						*/
						"type": "int"
					},
					quickVariantSelection: {
						type: "object",
						properties: { // Currently, everything here is just for documentation, but has no functionality. In future, a mechanism to fill default values shall be added
							showCounts: {
								type: "boolean",
								defaultValue: false
							},
							variants: {
								type: "object",
								mapEntryProperties: {
									key: {
										type: "string",
										optional: true
									},
									annotationPath: { // annotation path pointing to SelectionVariant
										type: "string"
									}
								}
							}
						}
					},
					quickVariantSelectionX: {
						type: "object",
						properties: { // Currently, everything here is just for documentation, but has no functionality. In future, a mechanism to fill default values shall be added
							showCounts: {
								type: "boolean",
								defaultValue: false
							},
							variants: { // A map -  keys to be defined by the application.
								type: "object",
								mapEntryProperties: { // describes how the entries of the map should look like
									key: {
										type: "string",
										optional: true
									},
									annotationPath: { // annotation path pointing to SelectionPresentationVariant or SelectionVariant
										type: "string"
									},
									entitySet: {
										type: "string",
										optional: true
									},
									tableSettings: {
										type: "object",
										properties: { 	// Unfortunately, managed object does not provide any specific support for type "object". We use just properties, and define everything below exactly like the properties of the component.
														// Currently, everything here is just for documentation, but has no functionality. In future, a mechanism to fill default values shall be added
											type: { // Defines the type of table to be used. Possible values: ResponsiveTable, GridTable, TreeTable, AnalyticalTable.
												type: "string",
												defaultValue: undefined // If sap:semantics=aggregate, and device is not phone, AnalyticalTable is used by default, otherwise ResponsiveTable
											},
											multiSelect: { // Defines, whether selection of multiple entries is possible. Only relevant, if actions exist.
												type: "boolean",
												defaultValue: false
											},
											selectAll: { // Defines, whether a button to select all entries is available. Only relevant if multiSelect is true.
												type: "boolean",
												defaultValue: false
											},
											selectionLimit: { // Defines the maximal number of lines to be loaded by a range selection from the backend. Only relevant for table type <> ResponsiveTable, if multiSelect is true, and selectAll is false.
												type: "int",
												defaultValue: 200
											}
										}
									}
								}
							}
						}
					}
				},
				"manifest": "json"
			}
		});
});