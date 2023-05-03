sap.ui.define(["sap/m/p13n/Popup",
	"sap/m/p13n/SelectionPanel",
	"sap/suite/ui/generic/template/genericUtilities/metadataAnalyser",
	"sap/suite/ui/generic/template/lib/filterHelper",
	"sap/fe/navigation/SelectionVariant"
], function (Popup, SelectionPanel, metadataAnalyser, filterHelper, SelectionVariant) {
	"use strict";

	var AddCardsHelper = {};

	AddCardsHelper.showColumnsForCardGeneration = function (oCardDefinition, oButton) {
		return new Promise(function (fnResolve, fnReject) {
			var oEntityType = oCardDefinition['entityType'];
			var oMetaModel = oCardDefinition['currentControlHandler'].getModel().getMetaModel();
			var aColumns = [];
			oCardDefinition['currentControlHandler'].getVisibleProperties().filter(function (oColumn) {
				var sColumnKey = oColumn.data("p13nData") && oColumn.data("p13nData").columnKey;
				var oProperty = oMetaModel.getODataProperty(oEntityType, oColumn.data("p13nData").leadingProperty);
				if (oProperty && (oProperty.type === 'Edm.Date' || oProperty.type === 'Edm.DateTime' || oProperty.type === 'Edm.DateTimeOffset')) {
					return;
				}
				if (oProperty &&  oProperty["sap:label"]) {
					if (oColumn.getVisible() && ((sColumnKey.indexOf("DataFieldForAnnotation") < 0) && !oColumn.data("p13nData").actionButton && !!oColumn.data("p13nData").leadingProperty)) {
						var oColumnObject = {
							visible: false,
							name: oProperty.name,
							label: oProperty["sap:label"]
						};
						aColumns.push(oColumnObject);
					}
				}
			});
			fnCreateP13nDialogBeforeCardGeneration(aColumns, oButton, oCardDefinition, fnResolve);
		});
	};

	AddCardsHelper.createAnalyticalCardForPreview = function (oCardDefinition) {
		return createCardManifest(oCardDefinition);
	};

	var createCardManifest = function (oCardDefinition, aSelectedColumns) {
		var oComponent = oCardDefinition['component'];
		var oMetadata = oComponent.getAppComponent().getMetadata();
		var oUIManifest = oMetadata.getManifestEntry("sap.ui");
		var oAppManifest = oMetadata.getManifestEntry("sap.app");
		var oManifest = {};
		var sSapAppId = "user." + oAppManifest.id + "." + Date.now();
		oAppManifest.type = "card";
		oAppManifest.id = sSapAppId;
		oManifest["sap.app"] = oAppManifest;
		oManifest["sap.ui"] = oUIManifest;
		oManifest["sap.card"] = fnCreateManifestSapCard(oCardDefinition, aSelectedColumns);
		oManifest["sap.insights"] = fnCreateManifestSapInsight(oCardDefinition);
		return oManifest;
	};

	var fnCreateManifestSapCard = function (oCardDefinition, aSelectedColumns) {
		var oCardConfig = {};
		var sComponentName = oCardDefinition['component'].getMetadata().getName();
		oCardConfig["type"] = getCardType(sComponentName);
		oCardConfig["configuration"] = fnCreateManifestSapCardConfig(oCardDefinition);
		oCardConfig["data"] = fnCreateManifestSapCardData(oCardDefinition, oCardConfig);
		oCardConfig["header"] = fnCreateManifestSapCardHeader(oCardDefinition, oCardConfig);
        oCardConfig["extension"] = "module:sap/insights/CardExtension";
		if (oCardConfig.type === "Analytical") {
			oCardConfig["content"] = fnCreateManifestSapAnalyticalCardContent(oCardDefinition, oCardConfig);
		} else {
			oCardConfig["content"] = fnCreateManifestSapTableCardContent(oCardDefinition, oCardConfig, aSelectedColumns);
		}
        AddCardsHelper.getCardActions(oCardDefinition, oCardConfig);
		return oCardConfig;
	};

	/**
		 * Create Manifest for Sap.insight component with the given card defination
		 *
		 * @param {Object} oCardDefinition
		 * @returns {Object}
		 */
	var fnCreateManifestSapInsight = function (oCardDefinition) {
		var oComponent = oCardDefinition['component'],
			oMetadata = oComponent.getAppComponent().getMetadata(),
			oAppManifest = oMetadata.getManifestEntry("sap.app"),
			sAppId = oAppManifest.id,
			bRTMode = "RT";

		return {
			parentAppId: sAppId,
			cardType: bRTMode,
			"versions": {
				"ui5": sap.ui.version + "-" + sap.ui.getVersionInfo().buildTimestamp
			}
		};
	};

	var getCardType = function (sComponentName) {
		switch (sComponentName) {
			case "sap.suite.ui.generic.template.ListReport.Component":
				return "Table";
			case "sap.suite.ui.generic.template.AnalyticalListPage.Component":
				return "Analytical";
			default:
				return "List";
		}
	};

	var fnCreateManifestSapCardConfig = function (oCardDefinition) {
		var oCardConfiguration = {};
		var oComponent = oCardDefinition['component'];
		var sServiceUrl = oComponent.getModel().sServiceUrl;
		oCardConfiguration["parameters"] = getFilterDetails(oCardDefinition)["filters"];
		oCardConfiguration["destinations"] = { service: { name: "(default)", defaultUrl: "/" } };
		oCardConfiguration["csrfTokens"] = {
			token1: {
				data: {
					request: {
						url: "{{destinations.service}}" + sServiceUrl,
						method: "HEAD",
						headers: {
							"X-CSRF-Token": "Fetch"
						}
					}
				}
			}
		};
		return oCardConfiguration;
	};

	/**
     * Create the configuration parameters for the generated card
     *  - Evaluate all the parameters to get the value for the manifest configuration.
     *  - Evaluate all filter properties which are common between both card and smart filter bar entity type.
     *  - Evaluate the SelectionAnnotation given for card.
     *  - Add all filters to '_relevantODataFilters', all parameters to '_relevantODataParameters' [ All means including mandatory ].
     *  - Add mandatory filters to '_mandatoryODataFilters' and mandatory parameters to '_mandatoryODataParameters'.
     *
     * @param {Object} oCardDefinition
     * @returns {Object} oFinalSet The final configuration parameters
     */
	 var getFilterDetails = function (oCardDefinition) {
        var oFinalSet = { filters: {} },
            oFinal = oFinalSet.filters,
            oSmartFilterbar = oCardDefinition.oSmartFilterbar,
            oFiltermodel = oSmartFilterbar && oSmartFilterbar.getModel(),
            oEntityModel = oCardDefinition.view.getModel(),
            oEntityType = oCardDefinition.entityType,
            aParameterSet = [],
            aRelevantFilter = [],
            aMandatoryParamSet = [],
            aMandatoryFilterSet = [],
            oSelectionVariant,
            aParameterKeys = [],
            aCommonFilterProperties = [],
            aParameterProperties = [];

        if (oFiltermodel) {
            var bParameterised = metadataAnalyser.checkAnalyticalParameterisedEntitySet(oFiltermodel, oEntityType && oEntityType.name);
            if (bParameterised) {
                var oParametersInfo = metadataAnalyser.getParametersByEntitySet(oFiltermodel, oEntityType && oEntityType.name);
                if (oParametersInfo.entitySetName) {
                    aParameterProperties = oParametersInfo.parameters || [];
                }
            }
        }
        var aParams = metadataAnalyser.getParametersByEntitySet(oEntityModel, oCardDefinition.entitySet.name, true).parameters;
        var sParamLabel = "";
        aParams.forEach(function (oParameter) {
            var sMandatoryProp = mandatoryParamCheck(oParameter);
            var sFilterParamDefaultValue = filterHelper.getParameterDefaultValue(oFiltermodel, oEntityType, sMandatoryProp, oCardDefinition);
            var sCardParamDefaultValue = filterHelper.getParameterDefaultValue(oEntityModel, oCardDefinition.entitySet, sMandatoryProp, oCardDefinition);
            var sDefaultValue = sFilterParamDefaultValue || sCardParamDefaultValue || oParameter.defaultValue || "";
            var sParamActualValue = filterHelper.getParameterActualValue(oParameter.name, oSmartFilterbar);
            sParamLabel = filterHelper.getLabelForConfigParams(oParameter.name, oSmartFilterbar, oFinal, oCardDefinition, sDefaultValue);

            var bIsValidSemanticDateRange = filterHelper.IsSemanticDateRangeValid(oCardDefinition, oParameter);
            if (bIsValidSemanticDateRange) {
                filterHelper.setFilterRestrictionToSemanticDateRange(oParameter, true);
                sDefaultValue = filterHelper.getDateRangeDefaultValue(oCardDefinition, oParameter.name) || sDefaultValue;
                sParamActualValue = filterHelper.getDateRangeValue(sParamActualValue, oParameter, true) || sParamActualValue;

                if (sParamLabel && typeof sParamLabel === 'string') {
                    sParamLabel = sParamLabel.substring(0, sParamLabel.indexOf("(") - 1);
                } else if (sDefaultValue) {
                    sParamLabel = sDefaultValue;
                    filterHelper.getLabelForConfigParams(oParameter.name, oSmartFilterbar, oFinal, oCardDefinition, sDefaultValue, true);
                }
            }

            if (sMandatoryProp) {
                aMandatoryParamSet.push(oParameter.name);
            }
            oFinal[oParameter.name] = {
                value: sParamActualValue ? sParamActualValue : sDefaultValue,
                type: filterHelper.getPropertyType(oParameter),
                description: oParameter && oParameter.description,
                label: sParamLabel
            };
            oFinal[oParameter.name]["description"] = propertyExtensionData(oParameter, "description");
            aParameterSet.push(oParameter.name);
            aParameterKeys.push(oParameter.name);
        });
        aParameterProperties = aParameterProperties.filter(function(key) {
            return !aParameterKeys.includes(key);
        });
        if (oEntityType && oEntityType.property) {
            aCommonFilterProperties = getCommonFilterProperties(oEntityType.property, aParameterProperties);
        }
        for (var i = 0; i < aCommonFilterProperties.length; i++) {
            var oFilterProp = aCommonFilterProperties[i],
                sFilterVal = "";
            var oRelatedEntityProperty = getRelatedEntityProperty(oFilterProp, oEntityType.property);
            var sMandatoryParam = mandatoryParamCheck(oRelatedEntityProperty);
            var sDefaultValue = filterHelper.getFilterDefaultValue(oFilterProp.name, oEntityType) || oFilterProp.defaultValue || "";
            var sParamActualValue = filterHelper.getParameterActualValue(oFilterProp.name, oSmartFilterbar);

            if (aParameterKeys.includes(oFilterProp.name)) {
                sParamLabel = filterHelper.getLabelForConfigParams(oFilterProp.name, oSmartFilterbar, oFinal, oCardDefinition, sDefaultValue);

                var bIsValidSemanticDateRange = filterHelper.IsSemanticDateRangeValid(oCardDefinition, oFilterProp);
                if (bIsValidSemanticDateRange) {
                    filterHelper.setFilterRestrictionToSemanticDateRange(oFilterProp, true);
                    sDefaultValue = filterHelper.getDateRangeDefaultValue(oCardDefinition, oFilterProp.name) || sDefaultValue;
                    sParamActualValue = filterHelper.getDateRangeValue(sParamActualValue, oFilterProp, true) || sParamActualValue;

                    if (sParamLabel && typeof sParamLabel === 'string') {
                        sParamLabel = sParamLabel.substring(0, sParamLabel.indexOf("(") - 1);
                    } else if (sDefaultValue) {
                        sParamLabel = sDefaultValue;
                        filterHelper.getLabelForConfigParams(oFilterProp.name, oSmartFilterbar, oFinal, oCardDefinition, sDefaultValue, true);
                    }
                }
                oFinal[oFilterProp.name] = {
                    value: sParamActualValue ? sParamActualValue : sDefaultValue,
                    type: filterHelper.getPropertyType(oFilterProp),
                    description: oFilterProp && oFilterProp.description,
                    label: sParamLabel
                };
                if (sMandatoryParam) {
                    aMandatoryParamSet.push(sMandatoryParam);
                }
                aParameterSet.push(oFilterProp.name);
            } else {
                oSelectionVariant = new SelectionVariant();
                var aFilterLabel = filterHelper.getLabelForConfigParams(oFilterProp.name, oSmartFilterbar, oFinal, oCardDefinition, sDefaultValue);
                var bIsValidSemanticDateRange = filterHelper.IsSemanticDateRangeValid(oCardDefinition, oFilterProp);
                if (bIsValidSemanticDateRange) {
                    filterHelper.setFilterRestrictionToSemanticDateRange(oFilterProp, false);
                    filterHelper.addDateRangeValueToSV(oCardDefinition, oFilterProp, sDefaultValue, oSelectionVariant, aFilterLabel);
                } else {
                    if (sParamActualValue) {
                        filterHelper.addFiltervalues(oSmartFilterbar, oFilterProp.name, oSelectionVariant, aFilterLabel);
                    } else if (sDefaultValue) {
                        var sText = filterHelper.getRelatedTextToRange({Low : sDefaultValue}, aFilterLabel, oSmartFilterbar, oFilterProp.name);
                        oSelectionVariant.addSelectOption(oFilterProp.name, "I", "EQ", sDefaultValue, null, sText);
                    } else {
                        oSelectionVariant.addSelectOption(oFilterProp.name, "I", "EQ", sFilterVal);
                    }
                }

                oFinal[oFilterProp.name] = {
                    value: oSelectionVariant.toJSONString(),
                    type: filterHelper.getPropertyType(oFilterProp),
                    description: oFilterProp && oFilterProp.description
                };

                oFinal[oFilterProp.name].value = filterHelper.enhanceVariant(oFinal[oFilterProp.name].value);

                if (sMandatoryParam) {
                    aMandatoryFilterSet.push(sMandatoryParam);
                }
                aRelevantFilter.push(oFilterProp.name);
            }
            oFinal[oFilterProp.name]["description"] = propertyExtensionData(oFilterProp, "description");
        }
		// Handle Custom Filters set from FE
		var oFECustomFilterData = oCardDefinition['oFECustomFilterData'];
		if (oFECustomFilterData) {
			oSelectionVariant = new SelectionVariant();
			oSelectionVariant.addSelectOption(oFECustomFilterData.name, "I", "EQ", oFECustomFilterData.value);
			oFinal[oFECustomFilterData.name] = {
				value: oSelectionVariant.toJSONString(),
				type: "string",
				description: ""
			};
			oFinal[oFECustomFilterData.name].value = filterHelper.enhanceVariant(oFinal[oFECustomFilterData.name].value);
			aRelevantFilter.push(oFECustomFilterData.name);
		}
		// Handle Basic Search set from FE
		var sBasicSearchName = oSmartFilterbar.getBasicSearchName(), sBasicSearchValue = oSmartFilterbar.getBasicSearchValue();
		if (sBasicSearchValue) {
			oSelectionVariant = new SelectionVariant();
			oSelectionVariant.addSelectOption(sBasicSearchName, "I", "EQ", sBasicSearchValue);
			oFinal[sBasicSearchName] = {
				value: oSelectionVariant.toJSONString(),
				type: "string",
				description: ""
			};
			oFinal[sBasicSearchName].value = filterHelper.enhanceVariant(oFinal[sBasicSearchName].value);
			aRelevantFilter.push(sBasicSearchName);
		}
        var aRelevant = aUniqueArray(aRelevantFilter);
        var aParameter = aUniqueArray(aParameterSet);
        var aMandatoryParam = aUniqueArray(aMandatoryParamSet);
        var aMandatoryFilter = aUniqueArray(aMandatoryFilterSet);
        filterHelper.updateRangeValue(oFinal);
        oFinal["_relevantODataFilters"] = { value: aRelevant };
        oFinal["_relevantODataParameters"] = { value: aParameter };
        oFinal["_mandatoryODataParameters"] = { value: aMandatoryParam };
        oFinal["_mandatoryODataFilters"] = { value: aMandatoryFilter };
        return oFinalSet;
    };

	var aUniqueArray = function (aArr) {
        return aArr && aArr.filter(function (element, index) {
            return aArr.indexOf(element) === index;
        });
    };

	var getCommonFilterProperties = function (aEntityProp, aParameters) {
		var aCommonPropKeys = aEntityProp.filter(function(oProperty) {
            return isPropertyFilterable(oProperty);
        }) || [];
        if (aParameters && aParameters.length > 0) {
            aEntityProp.forEach(function(oEntityProp){
                var sPropertyNameWithPrefix = "P_" + oEntityProp.name;
                if (aParameters.includes(sPropertyNameWithPrefix)) {
                    aCommonPropKeys.push(oEntityProp);
                }
            });
        }
        return aCommonPropKeys;
    };

	var isPropertyFilterable = function (oProperty) {
        return oProperty["sap:filterable"] ? oProperty["sap:filterable"] !== "false" : true;
    };

	var getRelatedEntityProperty = function(oFilterProp, aEntityProperties) {
        if (aEntityProperties && aEntityProperties.length) {
            var aEntityProperty = aEntityProperties.filter(function(oEntityProperty) {
                return oEntityProperty.name === oFilterProp.name;
            });

            return aEntityProperty && aEntityProperty[0];
        }
    };

	var mandatoryParamCheck = function (oPropertyTest) {
        var aDataValues = [];
        if (oPropertyTest && oPropertyTest.extensions) {
            aDataValues = oPropertyTest.extensions;
            for (var i = 0; i < aDataValues.length; i++) {
                if (aDataValues[i].name === "parameter" && aDataValues[i].value === "mandatory") {
                    return oPropertyTest.name;
                } else if (aDataValues[i].name === "required-in-filter" && aDataValues[i].value === "true") {
                    return oPropertyTest.name;
                }
            }
        }
    };

	var propertyExtensionData = function (oPropertyTest, sProperty) {
        var oDataValues;
        if (oPropertyTest && oPropertyTest[sProperty]) {
            return oPropertyTest[sProperty];
        } else if (oPropertyTest && oPropertyTest.extensions) {
            oDataValues = oPropertyTest.extensions;
            for (var i = 0; i < oDataValues.length; i++) {
                if (oDataValues[i].name === sProperty) {
                    return oDataValues[i].value;
                }
            }
        }
        return undefined;
    };

	/**
     * adds parameter to the request url
     * @param {string} url
     * @param {string} sQueryParamUrl
     * @returns {string} The request url after adding query parameters
     */

	var addQueryParam = function (sUrl, sQueryParamUrl) {
        if (sUrl && sQueryParamUrl) {
            if (sUrl.indexOf("?") === -1) {
                sUrl += "?" + sQueryParamUrl;
            } else {
                sUrl += "&" + sQueryParamUrl;
            }
        }
        return sUrl;
	};

	/**
	* Create Manifest for Data Property of Sap.Card component with the given card defination
	*
	* @param {Object} oCardDefinition
	* @param {Object} oSapCard
	* @returns {Object} oSapCardData Data property for Sap.Card component of the Manifest
	*/
	var fnCreateManifestSapCardData = function (oCardDefinition, oSapCard) {
		var oSapCardData = {};
		// var oBatchObject = BatchHelper.getBatchObject(oCardDefinition, oSapCard["configuration"]);
		var oComponent = oCardDefinition['component'], sComponentName = oCardDefinition['component'].getMetadata().getName();
		var sServiceUrl = oComponent.getModel().sServiceUrl;
		var dataSource = sServiceUrl;
		var oCurrentControlHandler = oCardDefinition['currentControlHandler'];
		//  var isMTable = oCurrentControlHandler.isMTable();
		var sContentURL = '';
		if (oCurrentControlHandler.getBinding()) {
			sContentURL = oCurrentControlHandler.getBinding().getDownloadUrl();
		}

		if (sComponentName === "sap.suite.ui.generic.template.ListReport.Component") {
			var sTopQuery = "$top=15";
			sContentURL = addQueryParam(sContentURL, sTopQuery);
		}
		var sInlineCountQuery = "$inlinecount=allpages";
		sContentURL = addQueryParam(sContentURL, sInlineCountQuery);
		var oBatch = {};
		oBatch.content = {
			method: "GET",
			url: sContentURL,
			headers: {
				Accept: "application/json"
			}
		};
		oSapCardData["request"] = {
			url: "{{destinations.service}}" + dataSource + "/$batch",
			method: "POST",
			headers: {
				"X-CSRF-Token": "{{csrfTokens.token1}}"
			},
			batch: oBatch
		};
		return oSapCardData;
	};

	/**
	* Create Manifest for Header property of Sap.Card component with the given card defination
	*
	* @param {Object} oCardDefinition
	* @param {Object} oSapCard
	* @returns {Object} oSapCardHeader Header property for Sap.Card component of the Manifest
	*/
	var fnCreateManifestSapCardHeader = function (oCardDefinition, oSapCard) {
		var oToolbar = oCardDefinition['currentControlHandler'].getToolbar();
		var sComponentName = oCardDefinition['component'].getMetadata().getName(), sTitleText = oToolbar.getTitleControl() && oToolbar.getTitleControl().getText();

		if (sTitleText && sTitleText.indexOf('(') > -1 && sComponentName === "sap.suite.ui.generic.template.ListReport.Component") {
			var aTitleText = sTitleText.split('(');
			sTitleText = aTitleText[0].trim();
		}
		var sCountPath = "__count";
		var sText = {
			text: "{= ${" + sCountPath + "} === '0' ? '' : ${" + sCountPath + "} }"
		};
		var oSapCardHeader = {
			"title": sTitleText,
			"subTitle": "",
			"actions": {},
			"status": sText,
            "data": {
				"path": "/content/d"
			}
		};
		return oSapCardHeader;
	};

	/**
  * Create Manifest for Content property of Sap.Card component with the given card defination
  *
  * @param {Object} oCardDefinition
  * @param {Object} oSapCard
  * @returns {Object} oSapCardContent Header property for Sap.Card component of the Manifest
  */
	var fnCreateManifestSapTableCardContent = function (oCardDefinition, oSapCard, aSelectedColumns) {
		var aColumns = fnGetColumnsToShow(oCardDefinition, aSelectedColumns);
		var oSapCardContent = {
			"data": {
				"path": "/content/d/results"
			},
			"maxItems": 15,
			"row": {
				"columns": aColumns,
				"actions": {}
			}
		};
		return oSapCardContent;
	};

	/**
 * Create Manifest for Content property of Sap.Card component with the given card defination
 *
 * @param {Object} oCardDefinition
 * @param {Object} oSapCard
 * @returns {Object} oSapCardContent Header property for Sap.Card component of the Manifest
 */
	var fnCreateManifestSapAnalyticalCardContent = function (oCardDefinition, oCardConfig) {
		var oSapCardContent = {},
			oCurrentControlHandler = oCardDefinition['currentControlHandler'],
			oInnerChart = oCurrentControlHandler.getInnerChart(),
			oMeasureDetails = oCurrentControlHandler.getBinding().getMeasureDetails(),
			oDimensionDetails = oCurrentControlHandler.getBinding().getDimensionDetails();
		oSapCardContent["data"] = {
			path: "/content/d/results"
		};
		oSapCardContent["chartType"] = fnResolveChartType(oInnerChart);
		oSapCardContent["measures"] = fnResolveChartMeasures(oMeasureDetails);
		oSapCardContent["dimensions"] = fnResolveChartDimensions(oDimensionDetails);
		oSapCardContent["feeds"] = fnResolveChartFeeds(oSapCardContent);
		oSapCardContent["chartProperties"] = fnResolveChartProperties(oInnerChart);
		oSapCardContent["actionableArea"] = "Chart";
		oSapCardContent["actions"] = {};
		return oSapCardContent;
	};

	var fnResolveChartProperties = function (oInnerChart) {
		var oChartVizProperties = oInnerChart.mProperties.vizProperties;
		oChartVizProperties["categoryAxis"]["title"]["visible"] = true;
		oChartVizProperties["valueAxis"]["title"]["visible"] = true;
		return oChartVizProperties;
	};

	var fnResolveChartFeeds = function (oSapCardContent) {
		var aMeasureValues = [], aDimensionValues = [];

		for (var sKey in oSapCardContent["measures"]) {
			aMeasureValues.push(oSapCardContent["measures"][sKey].name);
		}

		for (var sKey in oSapCardContent["dimensions"]) {
			aDimensionValues.push(oSapCardContent["dimensions"][sKey].name);
		}

		return [
			{
				"type": "Dimension",
				"uid": oSapCardContent.chartType === 'Donut' ? "color" : "categoryAxis",
				"values": aDimensionValues
			},
			{
				"type": "Measure",
				"uid": oSapCardContent.chartType === 'Donut' ? "size" : "valueAxis",
				"values": aMeasureValues
			}
		];
	};

	var fnResolveChartType = function (oInnerChart) {
		var sResultChartType;
		switch (oInnerChart.getChartType()) {
			case "line":
				sResultChartType = "Line";
				break;
			case "donut":
				sResultChartType = "Donut";
				break;
			case "stacked_column":
				sResultChartType = "stacked_column";
				break;
			default:
				sResultChartType = "Line";
				break;
		}
		return sResultChartType;
	};

	var fnResolveChartMeasures = function (oMeasureDetails) {
		var aMeasures = [];
		for (var prop in oMeasureDetails) {
			var elem = oMeasureDetails[prop];
			aMeasures.push({ "name": elem.analyticalInfo.name, "value": "{" + elem.analyticalInfo.measurePropertyName + "}" });
		}
		return aMeasures;
	};

	var fnResolveChartDimensions = function (oDimensionDetails) {
		var aDimensions = [];
		for (var prop in oDimensionDetails) {
			var elem = oDimensionDetails[prop];
			aDimensions.push({ "name": elem.name, "value": "{" + elem.analyticalInfo.name + "}" });
		}
		return aDimensions;
	};

    AddCardsHelper.getCardActions = function (oCardDefinition, oSapCard) {
        var sHash = window.hasher.getHash(), aSemanticObjAction = sHash.split('&/')[0];

        if (aSemanticObjAction.includes('?')) {
            aSemanticObjAction = aSemanticObjAction.split('?')[0].split('-');
        } else {
            aSemanticObjAction = aSemanticObjAction.split('-');
        }

        var oHeaderParams = {
			"parameters": {
				"ibnTarget": {
					"semanticObject": aSemanticObjAction[0],
					"action": aSemanticObjAction[1]
				},
				"sensitiveProps": [],
				"ibnParams": {}
			}
        };

        var oHeaderParameterValue = [{
            "type": "Navigation",
            "parameters": "{= extension.formatters.getNavigationContext(${parameters>/headerState/value})}"
        }];

        var oContentParams = JSON.parse(JSON.stringify(oHeaderParams));

        var oContentParameterValue = [{
            "type": "Navigation",
            "parameters": "{= extension.formatters.getNavigationContext(${parameters>/contentState/value}, ${})}"
        }];

        oSapCard.configuration.parameters.headerState = {
            value : JSON.stringify(oHeaderParams)
        };
        oSapCard.configuration.parameters.contentState = {
            value : JSON.stringify(oContentParams)
        };

        oSapCard.header.actions = oHeaderParameterValue;
        if (oSapCard.type === "Analytical") {
            oSapCard.content.actions = oContentParameterValue;
		} else {
			var oTemplatePrivateModel = oCardDefinition['component'].getModel("_templPriv");
			if (!oTemplatePrivateModel.getProperty("/listReport/bSupressCardRowNavigation")) {
				oSapCard.content.row.actions = oContentParameterValue;
			}
		}
	};

	var fnGetColumnsToShow = function (oCardDefinition, aSelectedColumns) {
		var oEntityType = oCardDefinition['entityType'];
		var oMetaModel = oCardDefinition['currentControlHandler'].getModel().getMetaModel();
		var aColumns = [];
		oCardDefinition['currentControlHandler'].getVisibleProperties().filter(function (oColumn) {
			var sColumnKey = oColumn.data("p13nData") && oColumn.data("p13nData").columnKey;
			var sColumnKeyDescription = (oColumn.data("p13nData") && oColumn.data("p13nData").description) || "";
			var oProperty = oMetaModel.getODataProperty(oEntityType, oColumn.data("p13nData").leadingProperty);
			if (oProperty && aSelectedColumns.indexOf(oProperty.name) > -1) {
				if (oColumn.getVisible() && ((sColumnKey.indexOf("DataFieldForAnnotation") < 0) && !oColumn.data("p13nData").actionButton && !!oColumn.data("p13nData").leadingProperty)) {
					var oColumnObject = {};
                    sColumnKeyDescription = "{" + sColumnKeyDescription + "}";
					var sColumnValue = "{" + oProperty.name + "}";
					var sNavigation = ""; //need to improve
					// if (oProperty["com.sap.vocabularies.Common.v1.Text"] && oProperty["com.sap.vocabularies.Common.v1.Text"].Path) {
					//     sColumnValue = sColumnValue.concat(" " + "{" + sNavigation + oProperty["com.sap.vocabularies.Common.v1.Text"].Path + "}");
					// }
					if (oProperty["Org.OData.Measures.V1.ISOCurrency"] && oProperty["Org.OData.Measures.V1.ISOCurrency"].Path) {
						sColumnValue = sColumnValue.concat(" " + "{" + sNavigation + oProperty["Org.OData.Measures.V1.ISOCurrency"].Path + "}");
					}
					if (oProperty["Org.OData.Measures.V1.Unit"] && oProperty["Org.OData.Measures.V1.Unit"].Path) {
						sColumnValue = sColumnValue.concat(" " + "{" + sNavigation + oProperty["Org.OData.Measures.V1.Unit"].Path + "}");
					}

					if (oProperty['com.sap.vocabularies.Common.v1.Text'] && oProperty['com.sap.vocabularies.Common.v1.Text'].Path) {
						var sTextArragement = oProperty['com.sap.vocabularies.Common.v1.Text']['com.sap.vocabularies.UI.v1.TextArrangement'];
						var sTextArrangementType = sTextArragement && sTextArragement.EnumMember.split("/")[1];
						if (sTextArrangementType === "TextOnly") {
                            sColumnValue = "{= $" + sColumnKeyDescription + " === '' ? '' : $" + sColumnKeyDescription + "}";
						} else if (sTextArrangementType === "TextLast") {
                            sColumnValue = "{= $" + sColumnValue + " === '' ? '' : $" + sColumnValue + "}" + "{= $" + sColumnKeyDescription + " === '' ? '' : ' (' + ($" + sColumnKeyDescription + ") + ')'}";
						} else if (sTextArrangementType === "TextSeparate") {
                            sColumnValue = "{= $" + sColumnValue + " === '' ? '' : $" + sColumnValue + "}";
						} else { // Default case
							sColumnValue = "{= $" + sColumnKeyDescription + " === '' ? '' : $" + sColumnKeyDescription + "}" + "{= $" + sColumnValue + " === '' ? '' : ' (' + ($" + sColumnValue + ") + ')'}";
						}
					}

					if (oProperty['com.sap.vocabularies.UI.v1.IsImageURL'] && oProperty['com.sap.vocabularies.UI.v1.IsImageURL'].Bool === "true") {
						oColumnObject['title'] = oProperty['com.sap.vocabularies.Common.v1.Label'].String || oProperty['sap:label'];
						oColumnObject['icon'] = {
							src: "{" + oProperty.name + "}"
						};
					} else {
						oColumnObject['title'] = oProperty['com.sap.vocabularies.Common.v1.Label'].String || oProperty['sap:label'];
						oColumnObject['value'] = sColumnValue;
					}
					aColumns[aSelectedColumns.indexOf(oProperty.name)] = oColumnObject;
				}
			}
		});
		return aColumns;
	};

	function fnCreateP13nDialogBeforeCardGeneration(aColumns, oButton, oCardDefinition, fnResolve) {
		var oResourceModel = oCardDefinition['component'].getModel("i18n").getResourceBundle();
		var oSelectionPanel = new SelectionPanel({
			title: oResourceModel.getText("ST_CARDS_SELECTIONPANEL_TITLE"),
			showHeader: true,
			messageStrip: new sap.m.MessageStrip({
				text: oResourceModel.getText("ST_CARDS_SELECTIONPANEL_MESSAGESTRIP")
			}),
			change: function (oEvt) {					
				var aItems = oSelectionPanel.getP13nData();
				var iSelectedItems = oSelectionPanel.getP13nData(true).length;
					
				if (iSelectedItems > 3) {
					var oAffectedItem = aItems.find(function(oItem) {
						return oItem.name === oEvt.getParameter("item").name;
					});
					oAffectedItem.visible = false;
				}	
				oSelectionPanel.setP13nData(aItems);		
			}
		});
		oSelectionPanel.setP13nData(aColumns);
		var oPopup = new Popup({
			title: oResourceModel.getText("ST_CARDS_SELECTIONPOPUP_TITLE"),
			panels: [
				oSelectionPanel
			],
			close: function (oEvent) {
				if (oEvent.getParameter("reason") === "Ok") {
					var aSelectedColumns = oEvent.getSource().getPanels()[0].getSelectedFields();
					fnResolve(createCardManifest(oCardDefinition, aSelectedColumns));
				}
			}
		});
		oPopup.open(oButton);
	}

	return AddCardsHelper;
});