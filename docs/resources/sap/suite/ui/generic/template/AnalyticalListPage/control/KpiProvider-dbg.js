sap.ui.define([
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/CriticalityUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function(KpiUtil, CriticalityUtil, FilterUtil, FeLogger) {
	"use strict";
	var oLogger = new FeLogger("AnalyticalListPage.controller.KpiProvider").getLogger();
	var KpiProvider = function(kpiConfig) {
		// this.kpiConfig = kpiConfig;
		this._getDataFromAnnotations(kpiConfig);
	};
	KpiProvider.prototype._getDataFromAnnotations = function(oConfig) {
		var me = this;
		var oModel = oConfig._oModel;
		var oMetaModel = oModel.getMetaModel();
		var oEntitySet = oMetaModel.getODataEntitySet(oConfig.getEntitySet());
		if (!oEntitySet) {
			oLogger.error("KPI error details - Incorrect entity set");
			return;
		}
		var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
		var sQualifier = oConfig.getQualifier();
		var oSelectionVariant, oDataPoint, sSelectionVariantPath, sDataPointPath;
		var paths = {};
		var sKpiAnnotationPath = "com.sap.vocabularies.UI.v1.KPI#" + sQualifier;
		var oKpiAnnotation = oEntityType[sKpiAnnotationPath];
		if (oKpiAnnotation) {
			if (oKpiAnnotation["DataPoint"]) { // DATAPOINT PATH
				sDataPointPath = this.getPathOrAnnotationPath(oKpiAnnotation["DataPoint"], true);
			}
			if (oKpiAnnotation["SelectionVariant"]) { //SELECTIONVARIANT PATH
				sSelectionVariantPath = this.getPathOrAnnotationPath(oKpiAnnotation["SelectionVariant"], true);
			}
			if (oKpiAnnotation["ShortDescription"]) {
				var sShortDescription = KpiUtil.getPrimitiveValue(oKpiAnnotation["ShortDescription"]);
			}
			var oKpiID = oKpiAnnotation.ID;
			var oSemanticObject = oKpiAnnotation.Detail && oKpiAnnotation.Detail.SemanticObject;
			var oDefaultPV = oKpiAnnotation.Detail && oKpiAnnotation.Detail.DefaultPresentationVariant;
			var oAction = oKpiAnnotation.Detail && oKpiAnnotation.Detail.Action;
			paths.kpiAnnotationPath = sKpiAnnotationPath;
		} else {
			var selectionPresentationVariantPath = "com.sap.vocabularies.UI.v1.SelectionPresentationVariant#" + sQualifier;
			paths.selectionPresentationVariantPath = selectionPresentationVariantPath;
			var oSelectionPresentationVariant = oEntityType[selectionPresentationVariantPath];
			if (!oSelectionPresentationVariant) {
				oLogger.error("KPI error details - SelectionPresentationVariant does not have Path.");
				return;
			}

			// SELECTION VARIANT PATH
			if (oSelectionPresentationVariant.SelectionVariant) {
				sSelectionVariantPath = this.getPathOrAnnotationPath(oSelectionPresentationVariant.SelectionVariant);
			}
			//PRESENTATION VARIANT PATH
			if (oSelectionPresentationVariant.PresentationVariant) {
				var sPresentationVariantPath = this.getPathOrAnnotationPath(oSelectionPresentationVariant.PresentationVariant);
			}
			if (!sPresentationVariantPath) {
				oLogger.error("KPI error details - PresentationVariant does not have Path.");
				return;
			}
			var oPresentationVariant = oEntityType[sPresentationVariantPath];
			//DATAPOINT PATH
			var oVisualizations = oPresentationVariant && oPresentationVariant.Visualizations;
			if (oVisualizations) {
				oVisualizations.forEach(function(oAnno) {
					if (oAnno.AnnotationPath.indexOf("DataPoint") > 0) {
						sDataPointPath = me.getPathOrAnnotationPath(oAnno);
					}
				});
			}
		}
		if (!sDataPointPath) {
			oLogger.error("KPI error details - DataPoint does not have Path.");
			return;
		}
		//DATAPOINT
		oDataPoint = oEntityType[sDataPointPath];
		if (!sSelectionVariantPath) {
			oLogger.error("KPI error details - SelectionVariant does not have a path");
		}
		//SELECTIONVARIANT PATH
		oSelectionVariant = oEntityType[sSelectionVariantPath];
		paths.dataPointPath = sDataPointPath;
		paths.selectionVariantPath = sSelectionVariantPath;
		var sDataPointValue = oDataPoint.Value.Path;
		//SELECT OPTIONS AND PARAMETERS
		var	aSelectOptions = oSelectionVariant && oSelectionVariant.SelectOptions,
		aParameters = oSelectionVariant && oSelectionVariant.Parameters;
		//KPI PROPERTIES
		var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oDataPoint.Value.Path);
		var sUnitofMeasure = KpiUtil.getUnitofMeasure(oModel, oEntityTypeProperty);
		var titlePath = oDataPoint.Title,
		nameFromPath = KpiUtil.getPrimitiveValue(titlePath);
		if ( nameFromPath === undefined ) {
			nameFromPath = "";
		}
		this.kpiConfig = {
			entityTypeProperty: oEntityTypeProperty,
			props: {
				title: nameFromPath,
				value: sDataPointValue,
				unitOfMeasure: sUnitofMeasure
			},
			entitySet: oEntitySet,
			dataPoint: oDataPoint,
			selectionVariant: oSelectionVariant,
			selectOptions: aSelectOptions,
			parameters: aParameters,
			kpiPropertyPath: paths
		};
		if (oKpiAnnotation) {
			this.kpiConfig.bIsKpiAnnotaion = true;
		}
		if (oSemanticObject && oAction && oKpiID) {
			this.kpiConfig.navigation = {
				semanticObject : oSemanticObject.String,
				action : oAction.String,
				kpiId: oKpiID.String
			};
		}
		if (oKpiAnnotation && !oDefaultPV) {
			this.kpiConfig.oDefaultPV = false;
		}
		if (sShortDescription) {
			this.kpiConfig.props.shortDescription = sShortDescription;
		}
		//KPI CRITICALITY
		var oCriticality = FilterUtil.readProperty(oDataPoint, "Criticality"),
		sCriticality = oCriticality && (oCriticality.EnumMember) ? KpiUtil.getPrimitiveValue(oCriticality) : undefined,
		sCriticalityPath = (oCriticality && oCriticality.Path) ?  this._getCriticalityParameters(oCriticality) : undefined;
		if (sCriticality) {
			this.kpiConfig.criticality = {
				criticalityType: sCriticality
			};
		} else if (sCriticalityPath) {
			this.kpiConfig.criticality = {
				criticalityPath: sCriticalityPath
			};
		} else {
			var sImproveDirection = (!sCriticality && FilterUtil.readProperty(oDataPoint, "CriticalityCalculation.ImprovementDirection.EnumMember")) ? KpiUtil.getPrimitiveValue(oDataPoint.CriticalityCalculation.ImprovementDirection) : undefined;
			if (sImproveDirection) {
				var sToleranceLow = this._getCriticalityParameters(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue),
				sToleranceHigh = this._getCriticalityParameters(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue),
				sDeviationLow = this._getCriticalityParameters(oDataPoint.CriticalityCalculation.DeviationRangeLowValue),
				sDeviationHigh = this._getCriticalityParameters(oDataPoint.CriticalityCalculation.DeviationRangeHighValue);
				this.kpiConfig.criticalityCalculation = {
					improveDirection: sImproveDirection,
					toleranceLow: sToleranceLow,
					toleranceHigh: sToleranceHigh,
					deviationLow: sDeviationLow,
					deviationHigh: sDeviationHigh
				};
			}
		}
	};
	KpiProvider.prototype._getCriticalityParameters = function(oCriticalityParameter) {
		if (oCriticalityParameter) {
			if (oCriticalityParameter.Path) {
				return {path: "/" + oCriticalityParameter.Path};
			} else {
				return KpiUtil.getPrimitiveValue(oCriticalityParameter);
			}
		}
	};
	KpiProvider.prototype.getCriticalityFromEnum = function(sCriticality) {
		return CriticalityUtil.getCriticalityIndicatorFromEnum(sCriticality);
	};
	KpiProvider.prototype.getConfig = function() {
		return this.kpiConfig;
	};
	KpiProvider.prototype.getImproveDirection = function(sDataToleranceLow, sDataToleranceHigh, sDataDeviationLow, sDataDeviationHigh, sValue) {
		CriticalityUtil.setVals(sDataToleranceLow, sDataToleranceHigh, sDataDeviationLow, sDataDeviationHigh, sValue);
		return (CriticalityUtil[this.kpiConfig.criticalityCalculation.improveDirection]());
	};
	KpiProvider.prototype.getPathOrAnnotationPath = function(oEntityTypeObject, bIsPathOnly) {
		var sPath = bIsPathOnly ? oEntityTypeObject.Path : (oEntityTypeObject.Path || oEntityTypeObject.AnnotationPath);
		if (/^@/.test(sPath)) {
			sPath = sPath.slice(1);
		}
		return sPath;
	};
	return KpiProvider;
}, true);
