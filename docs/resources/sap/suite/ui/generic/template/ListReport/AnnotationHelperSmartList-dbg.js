sap.ui.define([
    "sap/ui/model/odata/AnnotationHelper",
    "sap/suite/ui/generic/template/genericUtilities/testableHelper",
    "sap/suite/ui/generic/template/js/AnnotationHelper"
], function (OdataAnnotationHelper, testableHelper, AnnotationHelper) {
    "use strict";
    /* Templating helper functions that are specific to the Smart List of ListReport Template */

    function generatePathForField(aParts, sFormatterName) {
        var sPath = "", sBinding = "", sBindingValue = "", iLength = aParts.length;
        if (iLength > 1) {
            sPath = "{parts:[";
            for (var i = 0; i < iLength; i++) {
                if (aParts[i].Path) {
                    sBinding = "path";
                    sBindingValue = aParts[i].Path;
                } else if (aParts[i].String) {
                    sBinding = "value";
                    sBindingValue = aParts[i].String;
                }
                sPath += ("{" + sBinding + ": '" + sBindingValue + "'}" + (((i === iLength - 1)) ? "]" : ", "));
            }
        } else {
            if (aParts[0].Path) {
                sBinding = "path";
                sBindingValue = aParts[0].Path;
            } else if (aParts[0].String) {
                sBinding = "value";
                sBindingValue = aParts[0].String;
            }
            sPath = "{" + sBinding + ": '" + sBindingValue + "'" + (aParts[0].type ? ", type: '" + aParts[0].type + "'" : "");
        }
        sPath += (sFormatterName ? (", formatter: '" + sFormatterName + "'") : "") + "}";
        return sPath;
    }

    function appendUnitOfMeasure(oEntityTypeProperty) {
        var result = "", oUnit = oEntityTypeProperty["Org.OData.Measures.V1.Unit"];
        if (oUnit) {
            result += " " + generatePathForField([oUnit]);
        }
        return result;
    }

    // Expose selected private functions to unit tests
    /* eslint-disable */
    generatePathForField = testableHelper.testableStatic(generatePathForField, "AnnotationHelperSmartList_generatePathForField");
    appendUnitOfMeasure = testableHelper.testableStatic(appendUnitOfMeasure, "AnnotationHelperSmartList_appendUnitOfMeasure");
    /* eslint-disable */

    var AnnotationHelperSmartList = {
        formatDataPointOrField: function (oInterface, oRecord) {
            if (!oRecord || !oRecord.Value) {
                return "";
            }
            var sRecordExpression = "", sFunctionName;
            var oModel = oInterface.getModel();
            var oMetaModel = oModel.getProperty("/metaModel");
            var oEntityType = oMetaModel.getODataEntityType(oModel.getProperty("/entityType"));
            var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oRecord.Value.Path);

            var aParts = [], oCurrency = oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"];
            if (oEntityTypeProperty["type"] === "Edm.DateTime" || oEntityTypeProperty["type"] === "Edm.DateTimeOffset") {
                var oDateForPath = oRecord.Value;
                oDateForPath.type = 'sap.ui.model.type.DateTime';
                aParts.push(oDateForPath);

                sFunctionName = "sap.ui.core.format.DateFormat.format";
                sRecordExpression = generatePathForField(aParts, sFunctionName);
            } else if (oCurrency) {
                aParts.push(oRecord.Value);
                aParts.push(oCurrency);

                sFunctionName = "sap.ui.core.format.NumberFormat.format";
                sRecordExpression = generatePathForField(aParts, sFunctionName);
            } else {
                sRecordExpression = OdataAnnotationHelper.format(oInterface, oRecord.Value);
            }

            return sRecordExpression + appendUnitOfMeasure(oEntityTypeProperty);
        },

        getSortedDataPointsAndFields: function (aCollection, sLineItemPath, oMetaModel, sEntityType) {
            function getImportance(oDataField) {
                var sImportance, iImportance;
                if (oDataField["com.sap.vocabularies.UI.v1.Importance"]) {
                    sImportance = oDataField["com.sap.vocabularies.UI.v1.Importance"].EnumMember;
                    switch (sImportance) {
                        case "com.sap.vocabularies.UI.v1.ImportanceType/High":
                            iImportance = 1;
                            break;
                        case "com.sap.vocabularies.UI.v1.ImportanceType/Medium":
                            iImportance = 2;
                            break;
                        case "com.sap.vocabularies.UI.v1.ImportanceType/Low":
                            iImportance = 3;
                            break;
                    }
                } else {
                    iImportance = 2;    // default importance to be considered as Medium
                }
                return iImportance;
            }

            function sortCollectionByImportance(aCollection) {
                aCollection.sort(function (oFirstData, oSecondData) {
                    var iFirstDataImportance = getImportance(oFirstData);
                    var iSecondDataImportance = getImportance(oSecondData);
                    return iFirstDataImportance < iSecondDataImportance ? -1 : 1;
                });
            }

            function getSortedDataPoints(aCollection) {
                var aSortedFields = aCollection.filter(function (oItem) {
                    return (oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && oItem.Target.AnnotationPath.match(/@com.sap.vocabularies.UI.v1.DataPoint.*/));
                });
                sortCollectionByImportance(aSortedFields);

                var aLineItemObjects = oMetaModel.getContext(sLineItemPath).getObject();
                for (var i = 0; i < aSortedFields.length; i++) {
                    var oSortedFieldContext = oMetaModel.getContext(sLineItemPath + "/" + aLineItemObjects.indexOf(aSortedFields[i]) + "/Target");
                    aSortedFields[i] = oMetaModel.getProperty(OdataAnnotationHelper.resolvePath(oSortedFieldContext));
                }
                return aSortedFields;
            }

            function isImageUrl(oItem) {
                return AnnotationHelper.isImageUrl(aEntityTypeProperties.filter(function (oProperty) {
                    return oProperty.name === oItem.Value.Path;
                })[0]);
            }

            var aDataPoints = getSortedDataPoints(aCollection);

            var aEntityTypeProperties = oMetaModel.getODataEntityType(sEntityType).property;

            var aSortedFields = aCollection.filter(function (oItem) {
                return (oItem.RecordType === "com.sap.vocabularies.UI.v1.DataField" && !isImageUrl(oItem));
            });
            sortCollectionByImportance(aSortedFields);

            // get the first DataField which is an image
            var oImageDataField = aCollection.filter(function (oItem) {
                return oItem.RecordType === "com.sap.vocabularies.UI.v1.DataField" ? isImageUrl(oItem) : false;
            })[0];

            return {
                dataFields: aSortedFields,
                dataPoints: aDataPoints,
                imageDataField: oImageDataField
            };

        },

        getObjectListProperty: function (oInterface, oLineItem) {
            var nDataPointsLength = oLineItem.dataPoints.length, sSecondAttribute, sFirstStatus, sFirstStatusState, sSecondStatus, sSecondStatusState;

            switch (true) {
                case (nDataPointsLength > 2):
                    sSecondAttribute = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[2]);
                    sFirstStatus = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataPoints[1]);
                    sSecondStatus = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataPoints[2]);
                    sFirstStatusState = AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataPoints[1]);
                    sSecondStatusState = AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataPoints[2]);
                    break;
                case (nDataPointsLength > 1):
                    sSecondAttribute = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[2]);
                    sFirstStatus = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataPoints[1]);
                    sFirstStatusState = AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataPoints[1]);
                    sSecondStatus = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[3]);
                    sSecondStatusState = AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataFields[3]);
                    break;
                case (nDataPointsLength > 0):
                    sSecondAttribute = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[3]);
                    sFirstStatus = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[2]);
                    sFirstStatusState = AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataFields[2]);
                    sSecondStatus = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[4]);
                    sSecondStatusState = AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataFields[4]);
                    break;
                default:
                    sSecondAttribute = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[4]);
                    sFirstStatus = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[3]);
                    sFirstStatusState = AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataFields[3]);
                    sSecondStatus = AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[5]);
                    sSecondStatusState = AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataFields[5]);
                    break;
            }

            return {
                title: AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[0]),
                number: oLineItem.dataPoints.length > 0 ? AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataPoints[0]) : AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[2]),
                numberState: oLineItem.dataPoints.length > 0 ? AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataPoints[0]) : AnnotationHelper.buildExpressionForProgressIndicatorCriticality(oInterface, oLineItem.dataFields[2]),
                firstAttribute: AnnotationHelperSmartList.formatDataPointOrField(oInterface, oLineItem.dataFields[1]),
                secondAttribute: sSecondAttribute,
                firstStatus: sFirstStatus,
                firstStatusState: sFirstStatusState,
                secondStatus: sSecondStatus,
                secondStatusState: sSecondStatusState
            };
        }
    };

    AnnotationHelperSmartList.formatDataPointOrField.requiresIContext = true;
    AnnotationHelperSmartList.getObjectListProperty.requiresIContext = true;

    return AnnotationHelperSmartList;
}, /* bExport= */ true);