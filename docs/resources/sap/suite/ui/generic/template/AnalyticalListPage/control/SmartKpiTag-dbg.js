sap.ui.define([
	"sap/ui/core/Control",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/KpiTagController",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiAnnotationHelper",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",
	"sap/ui/comp/odata/ODataModelUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/KpiProvider",
	"sap/suite/ui/generic/template/listTemplates/listUtils",
	"sap/ui/Device",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Locale",
	"sap/m/ResponsivePopover",
	"sap/m/MessageStrip",
	"sap/ui/core/format/NumberFormat",
	"sap/m/library",
	"sap/ui/core/library",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/m/GenericTag",
	"sap/m/ObjectNumber",
	"sap/ui/events/KeyCodes"
], function (Control, KpiTagController, KpiUtil, KpiAnnotationHelper, FilterUtil, V4Terms,
	ODataModelUtil, KpiProvider, ListUtils, Device, SelectionVariant, Filter, JSONModel, Locale, ResponsivePopover, MessageStrip,
	NumberFormat, SapMLibrary, SapCoreLibrary, FeLogger, GenericTag, ObjectNumber, KeyCodes) {
	"use strict";
	var oFeLogger = new FeLogger("AnalyticalListPage.control.SmartKpiTag");
	var oLogger = oFeLogger.getLogger();
	var oLevel = oFeLogger.Level;
	var TARGET = "Target",
		MAXIMIZE = "Maximize",
		MINIMIZE = "Minimize";
	return GenericTag.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.SmartKpiTag", {
		metadata: {
			designTime: true,
			interfaces: ["sap.m.IOverflowToolbarContent"],
			properties: {
				entitySet: {
					type: "string",
					defaultValue: "",
					bindable: false
				},
				qualifier: {
					type: "string",
					defaultValue: "",
					bindable: false
				},
				modelName: {
					type: "string",
					defaultValue: undefined,
					bindable: false
				},
				groupId: {
					type: "string",
					defaultValue: "AlpKpiGroup",
					bindable: false
				},
				smartFilterId: {
					type: "string",
					defaultValue: undefined,
					bindable: false
				},
				shortDescription : {
					type: "string",
					defaultValue : "",
					bindable: "bindable"
				},
				enabled: {
					type : "boolean",
					defaultValue : true,
					bindable: false
				},
				error: {
					type : "boolean",
					defaultValue : false,
					bindable: false
				},
				errorType: {
					type : "sap.ui.core.MessageType",
					defaultValue : SapCoreLibrary.MessageType.Error
				},
				errorMessage: {
					type: "string",
					defaultValue: "",
					bindable: "bindable"
				},
				kpivalue: {
					type: "string",
					defaultValue: "",
					bindable: "bindable"
				},
				kpiunit: {
					type: "string",
					defaultValue: "",
					bindable: "bindable"
				},
				indicator: {
					type: "sap.m.ValueColor",
					defaultValue: undefined
				}
			},
			events: {
				beforeRebindFilterableKPI: {}
			}
		},
		renderer: {},
		_isPercent: false,
		_unScaledValue: "",
		_sUnitofMeasure: "",
		_relativeToProperties: [],
		_bStopDataLoad: true,
		bSearchTriggred: false,
		init: function () {
			//by default the log level is set to ERROR and warning messages dont appear in the console.
			//setting warning level only for KPI
			oLogger.setLevel(oLevel.WARNING, this);
		},

		/**
		 * This is called from ManagedObject before init
		 * @param mSettings
		 * @private
		 */
		_initCompositeSupport: function (mSettings) {
			KpiUtil.addToKpiList(mSettings, this);
		},

		propagateProperties: function () {
			Control.prototype.propagateProperties.apply(this, arguments);
			this._initialiseMetadata();
		},
		_initialiseMetadata: function () {
			ODataModelUtil.handleModelInit(this, this._onMetaDataInit);
		},

		/**
		 * Function to defer model group for current KPI
		 * @private
		 */
		_setDeferredGroups: function () {
			if (!this._oModel) {
				return;
			}
			var aDeferredGroups = this._oModel.getDeferredGroups();
			var sGroupId = this.getGroupId();
			if (aDeferredGroups.indexOf(sGroupId) < 0) {
				aDeferredGroups.push(sGroupId);
				this._oModel.setDeferredGroups(aDeferredGroups);
			}
		},
		_onMetaDataInit: function () {
			var sModelName = this.getModelName();
			if (!sModelName) {
				this._oModel = this.getModel(); //getModel() takes undefined or no parameter for default model
			} else {
				this._oModel = this.getModel(sModelName);
			}
			this._setDeferredGroups();
			this._oModel.getMetaModel().loaded().then(function () {
				this.kpiProvider = new KpiProvider(this);
				if (!this.kpiProvider) {
					this._kpiErrorHandler({}, false);
					this._updateKpiList(true);
					return;
				}
				this.kpiSettings = this.kpiProvider.getConfig();
				if (!this.kpiSettings) {
					oLogger.error("KPI Error details: incorrect KPI configuration");
					this._updateKpiList(true);
					return;
				}
				var sSmartFilterId = this.getSmartFilterId();
				if (sSmartFilterId) {
					if (sSmartFilterId && !this._oSmartFilter) {
						this._oSmartFilter = this._findControl(sSmartFilterId);
						this._oSmartFilter.attachSearch(function (oEvent) {
							this.bSearchTriggred = true;
							this._createFilterableKpi();
						}.bind(this));
						this._oSmartFilter.attachFilterChange(function (oEvent) {
							if (!this._oSmartFilter.isLiveMode() && !this._oSmartFilter.isDialogOpen()) {
								this.setEnabled(false);
							}
						}.bind(this));
						if (this._oSmartFilter.isInitialised()) {
							this._createFilterableKpi();
						} else {
							this._oSmartFilter.attachInitialized(this._createFilterableKpi, this);
						}
					}
				} else {
					this._createGlobalKpi();
				}
			}.bind(this));
		},
		_handleFilterableKpiInGoMode: function(oEvent) {
			var bIsVisible = true;
			if (!this._oSmartFilter.isLiveMode()) {
	            if (!this.bSearchTriggred) {
	                this.setProperty('visible', false);
	                bIsVisible = false;
	            } else {
					var errorMessage = this.getProperty('errorMessage');
					if (errorMessage !== "KPI_AUTHORIZATION_ISSUE" && errorMessage !== "KPI_DEFAULT_PV_ERROR_MESSAGE") {
						this.setProperty('visible', true);
					}
	            }
	        }
	        return bIsVisible;
		},
		_createFilterableKpi: function (oEvent) {
			if (!this._handleFilterableKpiInGoMode(oEvent)) {
				return;
			}
			try {
				this._updateKpiList(false); //false denotes not processed till end
				this.setBusy(true);
				var bIsSameEntitySet = false;
				//both the Entitysets are same then only check for mandatory fields
				if (this.getEntitySet() === this._oSmartFilter.getEntitySet()) {
					bIsSameEntitySet = true;
					//to check all the mandatory fields are filled in SFB
					if (!FilterUtil.checkManditoryFieldsFilled(this._oSmartFilter).bIsMandatoryFilter) {
						this._mandatoryfieldsErrorHandler(false, false, true);
						return;
					}
				} //need to handle else TBD
				var config = this.kpiSettings,
					aSelectOptions = config.selectOptions,
					aParameters = ListUtils.getSelectionVariantParameterNamesWithoutNavigation(config.parameters),
					oUiState = this._oSmartFilter.getUiState(),
					oUiStateSV = oUiState.getProperty("selectionVariant"),
					aUiStateSVSelectOptions = oUiStateSV ? oUiStateSV.SelectOptions : undefined,
					aUIStateSVParams = oUiStateSV ? oUiStateSV.Parameters : undefined,
					oSFBAllFilterData = this._oSmartFilter.getFilterData(true),
					oSFBSV = new SelectionVariant(oUiStateSV),
					oFilterableKPISelectionVariant = new SelectionVariant(),
					aFilters = [],
					oSelectOption, sPropertyName, oRange, oFilter, bIsDiffEntSetWithNoMatchFields = false,
					oParameter, sPropertyValue,
					oMetaModel = this._oModel.getMetaModel(),
					oEntitySet = oMetaModel.getODataEntitySet(this.getEntitySet()),
					entityDef = oMetaModel.getODataEntityType(oEntitySet.entityType),
					aKPIEntitySetProperties = config.entitySet["Org.OData.Capabilities.V1.FilterRestrictions"],
					aKPIEntitySetRequiredProperties = aKPIEntitySetProperties["RequiredProperties"];
				// add the Selectioption to oFilterableKPISelectionVariant
				if (aUiStateSVSelectOptions) {
					for (var i = 0; i < aUiStateSVSelectOptions.length; i++) {
						sPropertyName = aUiStateSVSelectOptions[i].PropertyName;
						oRange = aUiStateSVSelectOptions[i].Ranges;
						var entityProperty = oMetaModel.getODataProperty(entityDef, sPropertyName),
							bisPropertyNonFilterable = entityProperty && FilterUtil.isPropertyNonFilterable(oEntitySet, entityProperty.name);
						//bIsFilterable = entityProperty && entityProperty['sap:filterable'];

						//ignore the filter form KPI Entityset if it marked as 'sap:filterable'="false"
						//if (bIsFilterable === "false") { //ignore UI.Hidden fields as part of KPI entityset
						if (bisPropertyNonFilterable || FilterUtil.isPropertyHidden(entityProperty)) {
							continue;
						}
						if (entityProperty) {
							if (oRange) {
								for (var k = 0; k < oRange.length; k++) {
									if (oRange[k].Sign === "I" || oRange[k].Sign === "E") {
										if (oRange[k].Low !== undefined) {
											oFilter = KpiUtil.getFilter(oRange[k], aUiStateSVSelectOptions[i], sPropertyName);
											if (this._checkKPIMandatoryFields(aKPIEntitySetRequiredProperties, sPropertyName)) {
												if (!oFilter.value1) {
													this._mandatoryfieldsErrorHandler(false, false, true);
													return;
												}
											}
											if (entityProperty !== null && entityProperty['type'] === "Edm.DateTime") {
												if (oFilter.value1 && !(oFilter.value1.indexOf('Z') === (oFilter.value1.length - 1))) {
													oFilter.value1 = oFilter.value1.split('T')[0] + "T00:00:00Z";
												}
												if (oFilter.value2 && !(oFilter.value2.indexOf('Z') === (oFilter.value2.length - 1))) {
													oFilter.value2 = oFilter.value2.split('T')[0] + "T00:00:00Z";
												}
											}
											oFilterableKPISelectionVariant.addSelectOption(oFilter.path, oFilter.sign, oFilter.operator, oFilter.value1, oFilter.value2);

										}
									}
								}
							}
						}
					}
				}

				//add  parameters of SFB
				if (aUIStateSVParams) {
					for (var i = 0; i < aUIStateSVParams.length; i++) {
						oParameter = aUIStateSVParams[i];
						sPropertyName = oParameter.PropertyName;
						sPropertyValue = oParameter.PropertyValue;
						var bMandateParam = KpiAnnotationHelper.checkMandatoryParameter(this._oModel, oEntitySet, sPropertyName);
						if (bMandateParam) {
							if (!sPropertyValue) {
								this._mandatoryfieldsErrorHandler(false, false, true);
								return;
							}
						}
						if (sPropertyValue !== oFilterableKPISelectionVariant.getParameter(sPropertyName)) {
							if (sPropertyName && sPropertyValue && (sPropertyValue !== "")) {
								var bIsParam = KpiAnnotationHelper.checkParameterizedEntitySet(this._oModel, oEntitySet, sPropertyName);
								if (bIsParam) {
									if (KpiAnnotationHelper.checkForDateTimeParameter(this._oModel, this.getEntitySet(), sPropertyName)) {
										if (sPropertyValue && !(sPropertyValue.indexOf('Z') === (sPropertyValue.length - 1))) {
											sPropertyValue = sPropertyValue.split('T')[0] + "T00:00:00Z";
										}
									}
									oFilterableKPISelectionVariant.addParameter(sPropertyName, sPropertyValue);
								}
							}
						}
					}
				}

				// Add the select option from Annotation
				if (aSelectOptions) {
					for (var i = 0; i < aSelectOptions.length; i++) {
						oSelectOption = aSelectOptions[i];
						sPropertyName = oSelectOption.PropertyName.PropertyPath;
						oRange = oSelectOption.Ranges;

						var entityProperty = oMetaModel.getODataProperty(entityDef, sPropertyName),
							bisPropertyNonFilterable = entityProperty && FilterUtil.isPropertyNonFilterable(oEntitySet, entityProperty.name);
						//bIsFilterable = entityProperty && entityProperty['sap:filterable'];

						//ignore the filter form KPI Entityset if it marked as 'sap:filterable'="false"
						//if (bIsFilterable === "false") {
						if (bisPropertyNonFilterable) {
							continue;
						}
						if (entityProperty && oSFBAllFilterData && oSFBAllFilterData[sPropertyName] === undefined) {
							bIsDiffEntSetWithNoMatchFields = true;
							if (!oFilterableKPISelectionVariant.getSelectOption(sPropertyName)) {
								for (var k = 0; k < oRange.length; k++) {
									if (oRange[k].Sign.EnumMember === V4Terms.SelectionRangeSignType + "/I" || oRange[k].Sign.EnumMember === V4Terms.SelectionRangeSignType + "/E") {
										if (oRange[k].Low !== undefined) {
											oFilter = KpiUtil.getFilter(oRange[k], oSelectOption);
											if (this._checkKPIMandatoryFields(aKPIEntitySetRequiredProperties, sPropertyName)) {
												if (!oFilter.value1) {
													this._mandatoryfieldsErrorHandler(true, false, false);
													return;
												}
											}
											oFilterableKPISelectionVariant.addSelectOption(oFilter.path, oFilter.sign, oFilter.operator, oFilter.value1, oFilter.value2);
										}
									}
								}
							}
						}
					}
				}
				// add the Parameter to oFilterableKPISelectionVariant only if it present in KPI annotations
				// and also matches with SFB Parameters
				if (aParameters) {
					for (var i = 0; i < aParameters.length; i++) {
						oParameter = aParameters[i];
						sPropertyName = oParameter.PropertyName && oParameter.PropertyName.PropertyPath;
						sPropertyValue = oSFBSV.getParameter(sPropertyName) || oParameter.PropertyValue.String;
						var bMandateParam = KpiAnnotationHelper.checkMandatoryParameter(this._oModel, oEntitySet, sPropertyName);
						if (bMandateParam) {
							if (!sPropertyValue) {
								this._mandatoryfieldsErrorHandler(true, false, false);
								return;
							}
						}
						if (oSFBAllFilterData && oSFBAllFilterData["$Parameter." + sPropertyName] === undefined) {
							bIsDiffEntSetWithNoMatchFields = true;
							//If the parameter is present in the filter bar we should not do anything
							if (!oFilterableKPISelectionVariant.getParameter(sPropertyName)) {
								// parameter does not exist in SFB entityset
								// then use annotation selection variant
								if (sPropertyName && sPropertyValue && (sPropertyValue !== "")) {
									oFilterableKPISelectionVariant.addParameter(sPropertyName, sPropertyValue);
								}
							}
						}
					}
				}
				//Check for mandatory values for KPI entityset than main entityset with matching fields
				if (!bIsSameEntitySet || !bIsDiffEntSetWithNoMatchFields) {
					if (!FilterUtil.checkManditoryFieldsFilled(this._oSmartFilter).bIsMandatoryFilter) {
						this._mandatoryfieldsErrorHandler(false, false, true);
						return;
					}
				}
				// fire event to enable user modification of certain binding options (Ex: Filters)
				this.fireBeforeRebindFilterableKPI({
					selectionVariant: oFilterableKPISelectionVariant,
					entityType: oEntitySet.entityType
				});

				//to create Filters after SV is modified by extensions
				var aPropertyNames = oFilterableKPISelectionVariant.getSelectOptionsPropertyNames();
				for (var i = 0; i < aPropertyNames.length; i++) {
					oSelectOption = oFilterableKPISelectionVariant.getSelectOption(aPropertyNames[i]);
					for (var j = 0; j < oSelectOption.length; j++) {
						oRange = oSelectOption[j];
						if (oRange.Sign === "I" || oRange.Sign === "E") {
							if (oRange.Low !== undefined) {
								oFilter = KpiUtil.getFilter(oRange, null, aPropertyNames[i]);
								aFilters.push(new Filter(oFilter));
							}
						}
					}
				}

				//to access in KPITagController.js
				this._filterableKPISelectionVariant = oFilterableKPISelectionVariant;
				var sPath = KpiAnnotationHelper.resolveParameterizedEntitySet(this._oModel, config.entitySet, oFilterableKPISelectionVariant);
				this._applyFiltersToKpi.apply(this, [oFilterableKPISelectionVariant, aFilters, sPath]);
			} catch (oError) {
				this._updateKpiList(true);
				oLogger.error("KPI Error details: " + oError);
			}
		},
		_createGlobalKpi: function () {
			try {
				this._updateKpiList(false); //false denotes not processed till end
				this.setBusy(true);
				var config = this.kpiSettings;
				var aSelectOptions = config.selectOptions,
					oSelectOption, oRange, aFilters = [];
				if (aSelectOptions) {
					for (var i = 0; i < aSelectOptions.length; i++) {
						oSelectOption = aSelectOptions[i];
						for (var j = 0; j < oSelectOption["Ranges"].length; j++) {
							oRange = oSelectOption["Ranges"][j];
							if (oRange.Low) {
								aFilters.push(new Filter(KpiUtil.getFilter(oRange, oSelectOption)));
							}
						}
					}
				}
				var sPath = KpiAnnotationHelper.resolveParameterizedEntitySet(this._oModel, config.entitySet, config.selectionVariant);
				this._applyFiltersToKpi.apply(this, [config.selectionVariant, aFilters, sPath]);
			} catch (oError) {
				this._updateKpiList(true);
				oLogger.error("KPI Error details: " + oError);
			}
		},
		_applyFiltersToKpi: function (oSelectionVariant, aFilters, sPath) {
			this._relativeToProperties = [];
			var config = this.kpiSettings;
			var oDatapoint = config.dataPoint,
				aSelectFields;
			var sGroupId = this.getGroupId();
			this._getCriticalityRefProperties(oDatapoint);
			this._oConfig = {
				path: sPath,
				filterable: this.getSmartFilterId() ? true : false,
				properties: {
					value: config.props.value,
					valueFormat: config.dataPoint.ValueFormat,
					title: config.props.title,
					unitOfMeasure: config.props.unitOfMeasure,
					isInteger:config.dataPoint.Value && FilterUtil.isInteger(config.dataPoint.Value.EdmType) ? true : false
				}
			};
			this._oConfig.properties.shortDescription = config.props.shortDescription;
			this._checkForPercent(this._oConfig.properties.unitOfMeasure);
			if (this._relativeToProperties.length !== 0) {
				aSelectFields = (this._relativeToProperties.indexOf(this._oConfig.properties.value) === -1) ? [this._oConfig.properties.value].concat(this._relativeToProperties).join(",") : this._relativeToProperties;
			} else {
				aSelectFields = [this._oConfig.properties.value];
			}
			if (this._oConfig) {
				this._oModel.read(this._oConfig.path, {
					async: true,
					filters: aFilters,
					urlParameters: {
						"$select": aSelectFields,
						"$top": 1
					},
					success: this._kpiSuccessHandler.bind(this),
					error: this._kpiErrorHandler.bind(this),
					groupId: sGroupId
				});
			}
			if (this.getSmartFilterId()) {
				//for FilterableKPI this._bStopDataLoad = false after app state is resolved
				this._updateKpiList(!this._bStopDataLoad);
			} else {
				// for GlobalKPI
				this._updateKpiList(true);
			}
		},

		/**
		 * Function to update the processing status of current KPI in the global Kpi list and
		 * fire any pending model requests
		 * @param bProcessed
		 * @private
		 */
		_updateKpiList: function (bProcessed) {
			//Update list to processing completed after all KPIs in current thread
			//are processed. This has been specially done to correctly update filterable
			//KPIs after search is triggered
			Promise.resolve().then(function () {
				this._updateKpiListAsync(bProcessed);
			}.bind(this));
		},
		/**
		 * Function to update KPI list
		 * @param bProcessed
		 * @private
		 */
		_updateKpiListAsync: function (bProcessed) {
			var sGroupId = this.getGroupId();
			KpiUtil.updateKpiList(this, bProcessed);
			//Model submit check required only if processing is set true
			if (!bProcessed) {
				return;
			}
			//If all kpi under current model and group are processed, then submit request
			var oKpiListGroup = KpiUtil.getKpiList(this.getModelName(), sGroupId);
			for (var sKpi in oKpiListGroup) {
				if (!oKpiListGroup[sKpi].bProcessed) {
					return;
				}
			}
			this._oModel.submitChanges({
				groupId: sGroupId
			});
		},
		//filter KPI mandatory fields
		_checkKPIMandatoryFields: function (aKPIEntitySetRequiredProperties, sPropertyName) {
			if (aKPIEntitySetRequiredProperties && sPropertyName) {
				for (var i = 0; i < aKPIEntitySetRequiredProperties.length; i++) {
					if (aKPIEntitySetRequiredProperties[i].PropertyPath === sPropertyName) {
						return true;
					}
				}
			}

		},
		_mandatoryfieldsErrorHandler: function (bIsReqNotFilterPresent, bIsKPIData, bIsReqFilterbarData) {
			this._kpiErrorHandler({}, bIsReqNotFilterPresent, bIsKPIData, bIsReqFilterbarData);
			this._updateKpiList(true);
		},

		//check
		_checkKpiCriticality: function () {
			var config = this.kpiSettings;
			var oDatapoint = config.dataPoint;
			var mCriticalityIndicator;
			config.criticalityNotDefined = false;
			if (config.criticality) {
				if (config.criticality.criticalityPath) {
					mCriticalityIndicator = config.criticality.criticalityPath;
					this._oConfig.criticality = {
						criticalityPath: config.criticality.criticalityPath
					};
				} else if (config.criticality.criticalityType) {
					// if criticality is provided as enum
					mCriticalityIndicator = this._getCriticalityFromEnum(config.criticality.criticalityType);
					this._oConfig.criticality = {
						criticalityType: config.criticality.criticalityType
					};
				}
			} else if (config.criticalityCalculation) {
				var sImproveDirection = config.criticalityCalculation.improveDirection,
					sToleranceHigh = config.criticalityCalculation.toleranceHigh,
					sToleranceLow = config.criticalityCalculation.toleranceLow,
					sDeviationLow = config.criticalityCalculation.deviationLow,
					sDeviationHigh = config.criticalityCalculation.deviationHigh;
				var IndicatorParts = [];
				if (this.getError() || (this.getSmartFilterId() && this._checkCriticalityCalculationForNumber(oDatapoint.CriticalityCalculation, sImproveDirection))) {
					this._mCriticalityIndicator = "None";
				} else {
					IndicatorParts.push(this._getPathForIndicatorParts(sToleranceHigh));
					IndicatorParts.push(this._getPathForIndicatorParts(sToleranceLow));
					IndicatorParts.push(this._getPathForIndicatorParts(sDeviationLow));
					IndicatorParts.push(this._getPathForIndicatorParts(sDeviationHigh));
					IndicatorParts.push({
						path: "/" + config.props.value
					});
					mCriticalityIndicator = {
						parts: IndicatorParts,
						formatter: function (sDataToleranceHigh, sDataToleranceLow, sDataDeviationLow, sDataDeviationHigh, sValue) {
							var toleranceLow = sDataToleranceLow ? sDataToleranceLow : sToleranceLow,
								toleranceHigh = sDataToleranceHigh ? sDataToleranceHigh : sToleranceHigh,
								deviationLow = sDataDeviationLow ? sDataDeviationLow : sDeviationLow,
								deviationHigh = sDataDeviationHigh ? sDataDeviationHigh : sDeviationHigh;
							toleranceLow = toleranceLow && Number(toleranceLow);
							toleranceHigh = toleranceHigh && Number(toleranceHigh);
							deviationLow = deviationLow && Number(deviationLow);
							deviationHigh = deviationHigh && Number(deviationHigh);
							sValue = sValue && Number(sValue);
							return this._getImproveDirection(toleranceLow, toleranceHigh, deviationLow, deviationHigh, sValue);
						}.bind(this)
					};
					this._oConfig.criticalityCalculation = {
						improveDirection: config.criticalityCalculation.improveDirection,
						toleranceLow: config.criticalityCalculation.toleranceLow,
						toleranceHigh: config.criticalityCalculation.toleranceHigh,
						deviationLow: config.criticalityCalculation.deviationLow,
						deviationHigh: config.criticalityCalculation.deviationHigh
					};
				}
			} else {
				config.criticalityNotDefined = true;
			}
			this._oConfig.criticalityProps = {
				criticalityIndicator: mCriticalityIndicator,
				relativeProperties: this._relativeToProperties
			};
		},
		_getCriticalityRefProperties: function (oDataPoint) {
			var cCalc = oDataPoint.CriticalityCalculation;
			var crit = oDataPoint.Criticality;
			if (crit && crit.Path && this._relativeToProperties.indexOf(crit.Path) === -1) {
				this._relativeToProperties.push(crit.Path);
			} else if (cCalc) {
				if (cCalc.DeviationRangeLowValue && cCalc.DeviationRangeLowValue.Path && this._relativeToProperties.indexOf(cCalc.DeviationRangeLowValue.Path) === -1) {
					this._relativeToProperties.push(cCalc.DeviationRangeLowValue.Path);
				}
				if (cCalc.DeviationRangeHighValue && cCalc.DeviationRangeHighValue.Path && this._relativeToProperties.indexOf(cCalc.DeviationRangeHighValue.Path) === -1) {
					this._relativeToProperties.push(cCalc.DeviationRangeHighValue.Path);
				}
				if (cCalc.ToleranceRangeLowValue && cCalc.ToleranceRangeLowValue.Path && this._relativeToProperties.indexOf(cCalc.ToleranceRangeLowValue.Path) === -1) {
					this._relativeToProperties.push(cCalc.ToleranceRangeLowValue.Path);
				}
				if (cCalc.ToleranceRangeHighValue && cCalc.ToleranceRangeHighValue.Path && this._relativeToProperties.indexOf(cCalc.ToleranceRangeHighValue.Path) === -1) {
					this._relativeToProperties.push(cCalc.ToleranceRangeHighValue.Path);
				}
			}
		},
		_kpiSuccessHandler: function (data, response) {
			//Reset any previously set error
			this.setProperty("error", false);
			this.setProperty("errorMessage", "");
			if ((this.kpiProvider.kpiConfig.bIsKpiAnnotaion && !this.kpiProvider.kpiConfig.hasOwnProperty("navigation")) || this.kpiProvider.kpiConfig.oDefaultPV === false) {
				this._kpiErrorHandler(response);
			}
			try {
				var oKpiData = data.results[0];
				if (!oKpiData) {
					throw "no data";
				}
			} catch (oError) {
				//Check no data / incorrect format scenario, display warning for such cases
				this.setProperty("errorType", SapCoreLibrary.MessageType.Warning);
				var oRb = this.getModel("i18n").getResourceBundle();
				this.setProperty('errorMessage', oRb.getText("KPI_NO_DATA"));
				oLogger.warning("KPI error details: " + oRb.getText("KPI_NO_DATA"));
				return this._kpiErrorHandler(response, false, true, false);
			}
			this.setBusy(false);
			//Criticality is only considered after reading of data returns a success
			this._checkKpiCriticality();
			var oKpiTagModel = new JSONModel();
			oKpiTagModel.setData(oKpiData);
			this.setModel(oKpiTagModel);
			this._setKpiName();
			this._setKpiValue();
			this._setKpiIndicator();
			this._setKpiStatus(this.getIndicator());
			this._setTooltipForKPI();
			//to enable KPITag
			if (!this.getEnabled()) {
				this.setEnabled(true);
			}
		},
		_setKpiValue : function (){
			//set the number
			var value = new ObjectNumber({
				number : {
					path: "/" + this._oConfig.properties.value,
					formatter: function (sValue) {
						this._isPercent = this._oConfig.properties.isPercent;
						this._unScaledValue = NumberFormat.getFloatInstance({
							maxFractionDigits: 3,
							groupingEnabled: true,
							showScale: false
						}, new Locale(sap.ui.getCore().getConfiguration().getLanguage())).format(sValue);
						return this._oConfig.properties.isPercent ? KpiUtil.formatNumberForPresentation(sValue, this._getNumberOfFractionalDigits(), true) : KpiUtil.formatNumberForPresentation(sValue, this._getNumberOfFractionalDigits());
					}.bind(this)
				}
			});
			if (this._oConfig.properties.unitOfMeasure) {
				(this._oConfig.properties.unitOfMeasure.hasOwnProperty("Path")) ? value.bindProperty("unit", {
					path: "/" + this._oConfig.properties.unitOfMeasure.Path
				}) : value.setProperty("unit", this._oConfig.properties.unitOfMeasure.String || this._oConfig.properties.unitOfMeasure);
			}
			this.setValue(value);
		},
		_setKpiStatus: function(sIndicator){
			switch (sIndicator) {
				case "Good":
					this.setStatus("Success");
					this.getValue().setState("Success");
					break;
				case "Error":
					this.setStatus("Error");
					this.getValue().setState("Error");
					break;
				case "Critical":
					this.setStatus("Warning");
					this.getValue().setState("Warning");
					break;
				default:
					this.setStatus("None");
					this.getValue().setState("None");
					break;
			}
			this.setDesign("StatusIconHidden");
		},
		/*_kpiErrorHandler : this function is called when there is an authorization error or any other technical errors that caused the KPI not fit for rendering.
		This handles the cases mentioned in FIORITECHP1-6523
		parameters : error response.*/
		_kpiErrorHandler: function (response, bIsReqNotFilterPresent, bIsKPIData, bIsReqFilterbarData) {
			this._resetKpiValue();
			var oRb = this.getModel("i18n").getResourceBundle();
			//Hide the KPI id the it's authorization error
			if (response.statusCode === "401" || response.statusCode === "403" || response.authorizationError) {
				this.setProperty('visible', false);
				this.setProperty('errorMessage', oRb.getText("KPI_AUTHORIZATION_ISSUE"));
				oLogger.warning("KPI error details: " + oRb.getText("KPI_AUTHORIZATION_ISSUE"));
				return;
			}
			if (this.kpiProvider.kpiConfig.oDefaultPV === false) { //Hide KPI if the DefaultPV is not present
				this.setProperty('visible', false);
				this.setProperty('errorMessage', oRb.getText("KPI_DEFAULT_PV_ERROR_MESSAGE"));
				oLogger.warning("KPI error details: " + oRb.getText("KPI_DEFAULT_PV_ERROR_MESSAGE"));
				return;
			}
			if (bIsReqNotFilterPresent) {
				this.setProperty('errorMessage', oRb.getText("REQUIRED_VH_FIELDS_OVERLAY_MESSAGE"));
				oLogger.error("KPI error details: " + oRb.getText("REQUIRED_VH_FIELDS_OVERLAY_MESSAGE"));
				this.setStatus("Error");
			} else if (bIsReqFilterbarData) {
				this.setProperty("errorType", SapCoreLibrary.MessageType.Information);
				/*var oRb = this.getModel("i18n").getResourceBundle();*/
				this.setProperty('errorMessage', oRb.getText("KPI_INFO_FOR_MISSING_MANDATE_FILTPAR"));
				oLogger.info("KPI error details: " + oRb.getText("KPI_INFO_FOR_MISSING_MANDATE_FILTPAR"), " ", this);
				this.setStatus("Information");
			} else if (this.kpiProvider.kpiConfig.bIsKpiAnnotaion && !this.kpiProvider.kpiConfig.hasOwnProperty("navigation")) {
				oLogger.warning("KPI error details: " + oRb.getText("KPI_DRILLDOWN_NAVIGATION_MESSAGE"));
				this.setStatus("Warning");
				// Return only if bIsReqNotFilterPresent is false and bIsKPIData is false
				if (!bIsKPIData) {
					return;
				}
			}
			this.setBusy(false);
			if (!bIsReqNotFilterPresent && !this.getProperty("errorMessage")) {
				this.setProperty('errorMessage', oRb.getText("KPI_GENERIC_ERROR_MESSAGE"));
				this.setStatus("Error");
			}
			if (response && response.statusCode && response.message) {
				oLogger.error("KPI error details: " + response.statusCode + " " + response.message);
			}
			this._setKpiName();

			this.setProperty('error', true);

			//to enable KPITag
			if (!this.getEnabled()) {
				this.setEnabled(true);
			}
		},
		/**
		 * Function to reset the value information in the kpi
		 * @private
		 */
		_resetKpiValue: function () {
			this.setValue(new ObjectNumber({
				number:"",
				unit:""
			}));
			this._isPercent = false;
			this._unScaledValue = "";
		},
		_setKpiIndicator: function () {
			if (this._oConfig && this._oConfig.criticalityProps) {
				var criticalityIndicator = this._oConfig.criticalityProps.criticalityIndicator;
				if (typeof criticalityIndicator === "string") {
					this.setIndicator(criticalityIndicator);
				} else if (typeof criticalityIndicator === "object") {
					this.bindProperty("indicator", criticalityIndicator);
				}
			}
			this.setDesign("StatusIconHidden");
		},
		_checkCriticalityCalculationForNumber: function (criticalityAnno, sImproveDirection) {
			if (sImproveDirection === MAXIMIZE) {
				if ((criticalityAnno.DeviationRangeLowValue && !criticalityAnno.DeviationRangeLowValue.Path) || (criticalityAnno.ToleranceRangeLowValue && !criticalityAnno.ToleranceRangeLowValue.Path)) {
					return true;
				}
			} else if (sImproveDirection === MINIMIZE) {
				if ((criticalityAnno.DeviationRangeHighValue && !criticalityAnno.DeviationRangeHighValue.Path) || (criticalityAnno.ToleranceRangeHighValue && !criticalityAnno.ToleranceRangeHighValue.Path)) {
					return true;
				}
			} else if (sImproveDirection === TARGET) {
				if ((criticalityAnno.ToleranceRangeLowValue && !criticalityAnno.ToleranceRangeLowValue.Path) || (criticalityAnno.ToleranceRangeHighValue && !criticalityAnno.ToleranceRangeHighValue.Path)) {
					return true;
				}
			}
		},
		_setKpiName: function () {
			if (!this.kpiSettings || !this.kpiSettings.props || !this.kpiSettings.props.title) {
				return this.setProperty("shortDescription", "");
			}
			// get kpi title
			var nameFromPath = this.kpiSettings.props.title;
			//Handle cases where DataPoint.title may not be present
			if (nameFromPath === undefined || typeof nameFromPath !== "string") {
				nameFromPath = "";
			}
			var sKpiDisplayName = this._oConfig && this._oConfig.properties.shortDescription ? this._oConfig.properties.shortDescription : nameFromPath;
			if (sKpiDisplayName) {
				if (sKpiDisplayName.indexOf(">") > 0) { //to handle i18n strings
					this.bindProperty("shortDescription", {
						path: sKpiDisplayName,
						formatter: function (sValue) {
							return this._getKpiTagTitle(sValue);
						}.bind(this)
					});
				} else {
					this.setProperty("shortDescription", this._getKpiTagTitle(sKpiDisplayName));
				}
			}
			this.setText(this.getShortDescription());
		},
		_getPathForIndicatorParts: function (sValue) {
			//if the value is of number form (int/decimal) then add dummy paths so that
			//values can be set in formatter
			if (Number(sValue) || !sValue) {
				return {
					path: "/dummy"
				};
			}
			//already set to form {path: '/...'} in provider using kpiUtil
			return sValue;
		},
		_getKpiTagTitle: function (name) {
			return this.getShortDescription() ? this.getShortDescription() : this._getNameFromHeuristic(name);
		},
		_getCriticalityFromEnum: function (sCriticality) {
			return this.kpiProvider.getCriticalityFromEnum(sCriticality);
		},
		_getNumberOfFractionalDigits: function () {
			var decimalPoints = 0;

			if (!this._oConfig.properties.isInteger) {
				decimalPoints = this._oConfig.properties.valueFormat && this._oConfig.properties.valueFormat.NumberOfFractionalDigits.Int;
				if (decimalPoints != 0) {
					decimalPoints = 1;
				}
			}

			return decimalPoints;
		},
		_getImproveDirection: function (sDataToleranceLow, sDataToleranceHigh, sDataDeviationLow, sDataDeviationHigh, sValue) {
			return this.kpiProvider.getImproveDirection(sDataToleranceLow, sDataToleranceHigh, sDataDeviationLow, sDataDeviationHigh, sValue);
		},
		_onMouseClick: function (oEvent) {
			if (this.kpiSettings) {
				this._displayKpiErrorPopOverOrCard(oEvent);
			} else {
				oLogger.error("KPI error details - Incorrect KPI configuration. Unable to open card");
			}
		},
		_displayKpiErrorPopOverOrCard: function (oEvent) {
			if (this.getError()) {
				if (this._oPopoverDialog) {
					this._oPopoverDialog.getContent()[0].setProperty("text", this.getProperty("errorMessage"));
					this._oPopoverDialog.getContent()[0].mAggregations._text.setProperty("text", this.getProperty("errorMessage"));
					this._oPopoverDialog.getContent()[0].setProperty("type", this.getProperty("errorType"));
					this._oPopoverDialog.openBy(this);
				} else {
					this._oPopoverDialog = this._getResponsivePopOver(this.getErrorMessage());
					this._oPopoverDialog.openBy(this);
				}
			} else {
				KpiTagController.openKpiCard(oEvent);
			}
		},
		_getResponsivePopOver: function (text) {
			if (this._oPopoverDialog) {
				return this._oPopoverDialog;
			}
			var bShowHeader = Device.system.phone ? true : false;
			var oResponsivePopover = new ResponsivePopover({
				showHeader: bShowHeader,
				placement: SapMLibrary.PlacementType.Auto,
				content: [
					new MessageStrip({
						text: text,
						showIcon: true,
						type: this.getProperty("errorType")
					})
				]
			}).addStyleClass("sapSmartTemplatesAnalyticalListPageErrorPopOver");
			oResponsivePopover.setShowCloseButton(bShowHeader);
			return oResponsivePopover;
		},
		_onKeyUp: function (oEvent) {
			if (this.kpiSettings && oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.SPACE) {
				this._displayKpiErrorPopOverOrCard(oEvent);
			} else {
				oLogger.error("KPI error details - Incorrect KPI configuration. Unable to open card");
			}
		},
		/**
		 * @private
		 * this Methods checks if the returned unit of Measure is a percent
		 * @param  oEntityTypeProperty [Entity property which has the UoM]
		 * @return                     [returns true/false ]
		 */
		_checkForPercent: function (sUnitofMeasure) {
			if (sUnitofMeasure && sUnitofMeasure.hasOwnProperty("String")) {
				this._oConfig.properties.unitOfMeasure = (sUnitofMeasure.String) ? sUnitofMeasure.String : "";
			}
			//Pushing path to this._relativeToProperties(), only if Currency is mentioned via path & sent to query.
			if (sUnitofMeasure && sUnitofMeasure.hasOwnProperty("Path") && this._relativeToProperties.indexOf(sUnitofMeasure.Path) === -1) {
				this._relativeToProperties.push(sUnitofMeasure.Path);
			}
			//This also checks for this._sUnitofMeasure === "%" which ideally should be coming as this._sUnitofMeasure.String but, waiting for confirmation.
			this._oConfig.properties.isPercent = (sUnitofMeasure && sUnitofMeasure.hasOwnProperty("String")) ? (sUnitofMeasure.String === "%") : false;
		},
		_getNameFromHeuristic: function (sentence) {
			var parts = sentence.split(/\s/);
			return parts.length === 1 ? this._getNameFromSingleWordHeuristic(sentence) : this._getNameFromMultiWordHeuristic(parts);
		},
		/**
		 * [_getNameFromSingleWordHeuristic Extract logic for single word]
		 * @param  {String} word which needs to be changed to short title
		 * @return {String} KPI Short title
		 */
		_getNameFromSingleWordHeuristic: function (word) {
			return word.substr(0, 3).toUpperCase();
		},
		_getNameFromMultiWordHeuristic: function (words) {
			var parts = [];
			parts.push(words[0].charAt(0));
			parts.push(words[1].charAt(0));
			if (words.length >= 3) {
				parts.push(words[2].charAt(0));
			}
			return parts.join("").toUpperCase();
		},
		getFilterableKPISelectionVariant: function () {
			return this._filterableKPISelectionVariant;
		},
		/**
		 * searches for a certain control by its ID
		 *
		 * @param {string} sId the control's ID
		 * @returns {sap.ui.core.Control} The control found by the given Id
		 * @private
		 */
		_findControl: function (sId) {
			var oResultControl, oView;
			if (sId) {
				// Try to get SmartFilter from Id
				oResultControl = sap.ui.getCore().byId(sId);

				// Try to get SmartFilter from parent View!
				if (!oResultControl) {
					oView = this._getView();

					if (oView) {
						oResultControl = oView.byId(sId);
					}
				}
			}

			return oResultControl;
		},
		/**
		 * searches for the controls view
		 *
		 * @returns {sap.ui.core.mvc.View} The found parental View
		 * @private
		 */
		_getView: function () {
			if (!this._oView) {
				var oObj = this.getParent();
				while (oObj) {
					if (oObj instanceof sap.ui.core.mvc.View) {
						this._oView = oObj;
						break;
					}
					oObj = oObj.getParent();
				}
			}
			return this._oView;
		},
		exit: function () {
			this._relativeToProperties = [];
		},
		getToolTipForUndefinedIndicator: function() {
			if (this.kpiSettings.criticalityNotDefined) {
				return "NONE";
			} else {
				return "NEUTRAL";
			}
		},
		// @param {}
		_setTooltipForKPI: function () {
			var oKPIValue = this.getValue();
			if (oKPIValue === null) {  //setting it for now till the set tooltip api for generic tag is fixed
				return;
			}
			var sTooltip = (this._isPercent) ? oKPIValue.getNumber() + " " + oKPIValue.getUnit() : this._unScaledValue + " " + oKPIValue.getUnit();
			var sIndicator = this.getIndicator();
			var sKPITooltipKey = "KPI_TOOLTIP_" + (sIndicator ? sIndicator.toUpperCase() : this.getToolTipForUndefinedIndicator());
			var oRb = this.getModel("i18n").getResourceBundle();
			var nameFromPath;
			var sFinalTooltip = oRb.getText(sKPITooltipKey, [(this.kpiSettings && this.kpiSettings.props ? this.kpiSettings.props.title : ""), sTooltip]);

			if (this.kpiSettings && this.kpiSettings.props) {
				nameFromPath = this.kpiSettings.props.title;
			}
			//if the datapoint title is an i18n string
			if (nameFromPath && nameFromPath.indexOf(">") > 0) {
				this.bindProperty("tooltip", {
					path: nameFromPath,
					formatter: function (value) {
						this._oConfig.properties.title = value;
						this.kpiSettings.props.title = value;
						return oRb.getText(sKPITooltipKey, [value, sTooltip]);
					}.bind(this)
				});
			} else {
				this.setTooltip(sFinalTooltip);
			}
			// checkking if KPI is having error or warning in determining value and setting aria label accordingly.
			if (this.getError()) {
				sKPITooltipKey = this.getErrorType() == "Error" ? "KPI_DETERMINING_ERROR" : "KPI_DETERMINING_WARNING";
			}
			this._ariaLabel = oRb.getText(sKPITooltipKey, [(this.kpiSettings && this.kpiSettings.props ? this.kpiSettings.props.title : ""), sTooltip]);
		},

		onAfterRendering: function () {
			setTimeout(function () {
				this.detachBrowserEvent("click", this._onMouseClick).attachBrowserEvent("click", this._onMouseClick);
				this.detachBrowserEvent("keyup", this._onKeyUp).attachBrowserEvent("keyup", this._onKeyUp);
			}.bind(this), 1);
		},
		getSmartKpiConfig: function () {
			return this._oConfig;
		},
		getOverflowToolbarConfig: function () {
			return {
				canOverflow: true
			};
		},
		setShortDescription: function (value) {
			this.setProperty("shortDescription", this._getNameFromHeuristic(value));
		},
		setEnabled: function(bValue) {
			this.setProperty("enabled", bValue, true);
			if (bValue) {
				this.removeStyleClass("sapSmartTemplatesAnalyticalListPageKpiTagDisable");
			} else {
				this.addStyleClass("sapSmartTemplatesAnalyticalListPageKpiTagDisable");
			}
		}
	});
}, true);
