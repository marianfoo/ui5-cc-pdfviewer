/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(
  [
    "sap/ui/model/odata/v2/ODataModel"
  ],
  function (
    ODataModelV2
  ) {
    var oDataModel = {};

    function _createCardOdataModel(oCardDataSource) {
      var oFilterService = oCardDataSource.filterService;
      var uri = oFilterService && oFilterService.uri;
      var oTempSettings = oFilterService && oFilterService.settings;
      var annotations = [];
      if (oTempSettings) {
        oTempSettings.annotations.forEach(function (annotationName) {
          var annotation = oCardDataSource[annotationName];
          var annotationURI = annotation.uri;
          annotations.push(annotationURI);
        });
        if (oTempSettings.odataVersion === "2.0") {
          return new ODataModelV2(uri, {
            annotationURI: annotations,
            loadAnnotationsJoined: true
          });
        }
      }
    }

    function createOdataModelsforCard(oCardDataSource) {
      var index = oCardDataSource.filterService.uri;
      var oTempModel = _createCardOdataModel(oCardDataSource);
      oDataModel[index] = {
        oData: oTempModel,
        loaded: undefined
      };

      return new Promise(function (resolve) {
        if (oTempModel) {
          oTempModel.attachMetadataLoaded(function (oEvent) {
            return oEvent.getSource().getMetaModel().loaded().then(function () {
              oDataModel[index].loaded = true;
              resolve(oDataModel[index]);
            });
          });
          oTempModel.attachMetadataFailed(function () {
            oDataModel[index].loaded = false;
            resolve(oDataModel[index]);
          });
        } else {
          resolve(oDataModel[index]);
        }
      });
    }

    function getOdataModel(oCardDataSource) {
      if (oCardDataSource.filterService && oCardDataSource.filterService.uri) {
        var index = oCardDataSource.filterService.uri;
        if (oDataModel[index]) {
          return Promise.resolve(oDataModel[index]);
        } else {
          return createOdataModelsforCard(oCardDataSource);
        }
      } else {
        return Promise.resolve(undefined);
      }
    }

    return {
      getOdataModel: getOdataModel
    };
  });
