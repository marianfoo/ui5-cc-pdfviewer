sap.ui.define([
	"sap/ui/base/Object",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/lib/multipleViews/MultipleViewsHandler",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/FeError",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/ui/model/analytics/odata4analytics",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/each",
	"sap/suite/ui/generic/template/genericUtilities/metadataAnalyser"
], function(BaseObject, StableIdHelper, MultipleViewsHandler, extend, FeError, SelectionVariant, OData4Analytics, FeLogger, each, metadataAnalyser) {
	"use strict";

	// This helper class handles multiple views in the AnalyticalListPage.
	// In case the enclosing AnalyticalListPage really supports the multiple views feature it instantiates an instance of
	// sap.suite.ui.generic.template.lib.multipleViews.MultipleViewsHandler which implements the main part of the logic.
	// This class only contains the glue code which is used to adapt the services provided by this generic class to the requirements of the AnalyticalListPage
    // In AnalyticalListPage only single table mode is supported.

	// oState is used as a channel to transfer data to the controller and back.
	// oController is the controller of the enclosing AnalyticalListPage
	// oTemplateUtils are the template utils as passed to the controller implementation
	var	sClassName = "AnalyticalListPage.controller.MultipleViewsHandler";
	var oLogger = new FeLogger(sClassName).getLogger();
	function getMethods(oState, oController, oTemplateUtils) {
		// Begin: Instance variables
		var oGenericMultipleViewsHandler;   // the generic implementation of the multiple views feature. Will be instantiated if this ALP uses the multiple views feature.
		var oQuickVariantSelectionEffective;
		// indicates either single or multi
		var sMode;
		var enableAutoBindingMultiView;
		var oGetSwitchingControlPromise;

		var oDataModel = oController.getOwnerComponent().getModel();

		function onDataRequested() {
			if (!oGenericMultipleViewsHandler) {
				return;
			}
			oGenericMultipleViewsHandler.updateCounts();
		}

		function onRebindContentControl(oBindingParams, aFiltersFromSmartTable) {
			if (!oGenericMultipleViewsHandler) {
				return;
			}
			oGenericMultipleViewsHandler.onRebindContentControl(oBindingParams, aFiltersFromSmartTable);
		}

		function fnResolveParameterizedEntitySet(oEntitySet, oParameterInfo) {
			if (!oGenericMultipleViewsHandler) {
				return null;
			}
			return fnResolveParameterizedEntitySetforAggregatedService(oEntitySet, oParameterInfo);
		}

		function getPropertyFromParametersMetadata(aParametersMetadata, sPropertyPath) {
            return aParametersMetadata.filter(function (oProperty) {
                if (oProperty.name === sPropertyPath) {
                    return oProperty;
                }
            });
        }

		function fnResolveParameterizedEntitySetforAggregatedService(oEntitySet, oParameterInfo){
			var path = "";
			var o4a = new OData4Analytics.Model(OData4Analytics.Model.ReferenceByModel(oDataModel));
			var queryResult = o4a.findQueryResultByName(oEntitySet.name);
			var queryResultRequest = new OData4Analytics.QueryResultRequest(queryResult);
			var parameterization = queryResult && queryResult.getParameterization();
			var aFilterParams = oState.oSmartFilterbar && oState.oSmartFilterbar.getAnalyticalParameters();
			if (aFilterParams && aFilterParams.length > 0) {
				//Read the parameters from the smartfilterbar and build the binding path
				var oUiState = oState.oSmartFilterbar && oState.oSmartFilterbar.getUiState({
					allFilters: false
				});
			var sSelectionVariant = oUiState ? JSON.stringify(oUiState.getSelectionVariant()) : "{}";
			var oSelectionVariant = new SelectionVariant(sSelectionVariant);
			}
			if (parameterization) {
				var param;
				queryResultRequest.setParameterizationRequest(new OData4Analytics.ParameterizationRequest(parameterization));
				if (oSelectionVariant.getParameterNames) {
					var aAllParams = oSelectionVariant.getParameterNames();
					aAllParams.forEach(function (oParam) {
						param = oSelectionVariant.getParameter(oParam);
						queryResultRequest.getParameterizationRequest().setParameterValue(
							oParam,
							param
						);
					});
				} else {
					each(oSelectionVariant.Parameters, function () {
						if (this.RecordType === "com.sap.vocabularies.UI.v1.IntervalParameter") {
							param = this.PropertyValueFrom.PropertyPath.split("/");
							queryResultRequest.getParameterizationRequest().setParameterValue(
								param[param.length - 1],
								this.PropertyValueFrom.String,
								this.PropertyValueTo.String
							);
						} else {
							param = this.PropertyName.PropertyPath.split("/");
							queryResultRequest.getParameterizationRequest().setParameterValue(
								param[param.length - 1],
								this.PropertyValue.String
							);
						}
					});
				}

				/*If there is an optional parameter for a parameterized OData Service and there is
				no selection variant defined for that paramter, send empty string as the parameter value
				Current support is limited to Edm.String type parameters */
				var aSVParameters;
				if (oSelectionVariant.getParameterNames) {
					aSVParameters =  oSelectionVariant.getParameterNames();
				} else {
					aSVParameters = oSelectionVariant && oSelectionVariant.Parameters && oSelectionVariant.Parameters.map(function (oParameter) {
						return oParameter && oParameter.PropertyName && oParameter.PropertyName.PropertyPath;
					});
				}
                var oParametersInfo = metadataAnalyser.getParametersByEntitySet(oDataModel, oEntitySet.name);
                if (oParametersInfo.entitySetName) {
                    var aParametersMetadata = metadataAnalyser.getPropertyOfEntitySet(oDataModel, oParametersInfo.entitySetName);
                    var aMissingSV = oParametersInfo.parameters.filter(function (sParam) {
                        return !aSVParameters.includes(sParam);
                    });

                    for (var i = 0; i < aMissingSV.length; i++) {
                        param = aMissingSV[i].split("/");
                        var sPropertyPath = param[param.length - 1];
                        var aPropertyMetadata = getPropertyFromParametersMetadata(aParametersMetadata, sPropertyPath);
                        var bOptionalAnalyticParameter = false;
                        if (aPropertyMetadata.length > 0) {
                            var oProperty = aPropertyMetadata[0];
                            bOptionalAnalyticParameter = oProperty.type === "Edm.String" &&
                                                         oProperty["sap:parameter"] === "optional";
                        }
                        /*
                         * If the parameter is optional and there is no selection variant than set empty property value.
                        **/
                        if (bOptionalAnalyticParameter) {
                            queryResultRequest.getParameterizationRequest().setParameterValue(sPropertyPath, "");
                        }
                    }
                }
			}

			try {
				path = queryResultRequest.getURIToQueryResultEntitySet();
			} catch (exception) {
				queryResult = queryResultRequest.getQueryResult();
				path = "/" + queryResult.getEntitySet().getQName();
				oLogger.error("getEntitySetPathWithParameters", "binding path with parameters failed - " + exception || exception.message);
			}
			return path;
		}

		function fnFormatMessageStrip(aIgnoredFilters, sSelectedKey) {
			return oGenericMultipleViewsHandler ? oGenericMultipleViewsHandler.formatMessageStrip(aIgnoredFilters, sSelectedKey) : "";
		}

		function fnGetContentForIappState(){
			if (oGenericMultipleViewsHandler) {
				var sSelectedKey = oGenericMultipleViewsHandler.getSelectedKey();
				var oTableState = oGenericMultipleViewsHandler.getContentForIappState(sSelectedKey);
				return {
					state: oTableState
				};
			}
			return null;
		}
		function fnHasEntitySet(sEntitySet){
			if (!oGenericMultipleViewsHandler){
				return oController.getOwnerComponent().getEntitySet() === sEntitySet;
			}
			return oGenericMultipleViewsHandler.hasEntity(sEntitySet);
		}

		function fnFormatItemTextForMultipleView(oItemDataModel) {
			// if (!oGenericMultipleViewsHandler) {
			// 	return null;
			// }
			return oGenericMultipleViewsHandler && oGenericMultipleViewsHandler.formatItemTextForMultipleView(oItemDataModel);
		}

		function fnRestoreFromIappState(oState) {
			if (oGenericMultipleViewsHandler) {
				oGenericMultipleViewsHandler.restoreFromIappState(oState);
				fnAdaptPresentationControl();
			}
		}

		function fnDetermineSortOrder() {
			// if (!oGenericMultipleViewsHandler) {
			// 	return null;
			// }
			return oGenericMultipleViewsHandler && oGenericMultipleViewsHandler.determineSortOrder();
		}

		function fnRefreshOperation(iRequest, vTabKey, mEntitySets) {
			if (!oGenericMultipleViewsHandler) {
				return false;
			}
			oGenericMultipleViewsHandler.refreshOperation(iRequest, vTabKey, mEntitySets);
			// tells caller there is generic multiple views handler which does the refresh
			return true;
		}

		function fnGetEnableAutoBinding() {
			// make it boolean value
			return !!(oQuickVariantSelectionEffective && oQuickVariantSelectionEffective.enableAutoBinding);
		}

		function fnGetOriginalEnableAutoBinding(){
			return enableAutoBindingMultiView;
		}

		function fnSetControlVariant(sChartVariantId, sTableVariantId, sPageVariantId) {
			if (!oGenericMultipleViewsHandler) {
				return;
			}
			oGenericMultipleViewsHandler.setControlVariant(sChartVariantId, sTableVariantId, sPageVariantId);
		}

		function fnHandleStartUpObject(oStartupObject) {
			if (!oGenericMultipleViewsHandler) {
				return;
			}
			if (oStartupObject.selectedQuickVariantSelectionKey) {
				oGenericMultipleViewsHandler.setSelectedKey(oStartupObject.selectedQuickVariantSelectionKey);
			}
		}

		function fnGetSelectedKeyPropertyName() {
			if (!sMode){
				return null;
			}
			return sMode === "single" ? "tableViewData" : "tableTabData";
		}

		function fnGetSelectedKey() {
			return oGenericMultipleViewsHandler.getSelectedKey();
		}

		function fnSetSelectedKey(sKey) {
			return oGenericMultipleViewsHandler.setSelectedKey(sKey);
		}

		function fnOnDetailsActionPress(oEvent) {
			var oBindingContext = oEvent.getParameter("itemContexts") && oEvent.getParameter("itemContexts")[0];
			oTemplateUtils.oCommonEventHandlers.onListNavigate(oEvent, oState, oBindingContext);
		}
		
		function fnAdaptPresentationControl() {
			if (sMode === "multi") {
				var sKey = oGenericMultipleViewsHandler.getSelectedKey();
				var sSmartTableId = StableIdHelper.getStableId( {type: "ALPTable", subType: "SmartTable", sQuickVariantKey: sKey});
				var sSmartChartId = StableIdHelper.getStableId({type: "ALPChart", subType: "SmartChart", "sQuickVariantKey": sKey});
				oState.oSmartTable = oController.byId(sSmartTableId);
				oState.oSmartChart = oController.byId(sSmartChartId);
			}
		}
		
		// should ensure that all other smart controls that use the same entity set will refresh their data
		function fnRefreshSiblingControls(oSmartControl){
			if (sMode === "multi"){
				oGenericMultipleViewsHandler.refreshSiblingControls(oSmartControl);
			}
		}

		function getPresentationControlHandler(sKey){
			var sTableSId = StableIdHelper.getStableId({type: "ALPTable", subType: "SmartTable", "sQuickVariantKey": sKey});
			var sChartSId = StableIdHelper.getStableId({type: "ALPChart", subType: "SmartChart", "sQuickVariantKey": sKey});
			var oSmartTable = oController.byId(sTableSId);
			return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartTable || oController.byId(sChartSId));
		}
		
		function getKeyToPresentationControlHandler(){
			if (!oQuickVariantSelectionEffective){
				return null;
			}
			var mRet = Object.create(null);
			var fnFixed = (sMode === "single") && function(){
				return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oState.oSmartTable);
			};
			for (var sKey in oQuickVariantSelectionEffective.variants){
				var sKeyForId = oQuickVariantSelectionEffective.variants[sKey].key || sKey;
				mRet[sKeyForId] = fnFixed || getPresentationControlHandler.bind(null, sKeyForId);
			}
			return mRet;
		}
		
		function fnRegisterKeyChange(onKeyChange){
			if (oGenericMultipleViewsHandler){
				oGenericMultipleViewsHandler.registerKeyChange(onKeyChange);
			}
		}

		function fnGetMode() {
			return oGenericMultipleViewsHandler && oGenericMultipleViewsHandler.getMode();
		}
		
		function fnGetSwitchingControlAsync() {
			if (!oGetSwitchingControlPromise) {
				oGetSwitchingControlPromise = new Promise(function(resolve) {
					var oSwitchingControl;
					if (sMode === "multi") {
						var sIdForIconTabBar = StableIdHelper.getStableId({ type: "QuickVariantSelectionX", subType: "IconTabBar" });
						oSwitchingControl = oController.byId(sIdForIconTabBar);
					} else {
						var sSegmentedButton = StableIdHelper.getStableId({ type: "QuickVariantSelection", subType: "SegmentedButton" });
						var sVariantSelect = StableIdHelper.getStableId({ type: "QuickVariantSelection", subType: "VariantSelect" });
						oSwitchingControl = oController.byId(sSegmentedButton) || oController.byId(sVariantSelect);
					}
					resolve(oSwitchingControl);
				});
			}

			return oGetSwitchingControlPromise;
		}

		function fnGetInitializationPromise() {
			return oGenericMultipleViewsHandler ? 
				oGenericMultipleViewsHandler.getInitializationPromise() : Promise.resolve();
		}

		(function() { // constructor coding encapsulated in order to reduce scope of helper variables
			var oSettings = oTemplateUtils.oComponentUtils.getSettings();
			var oQuickVariantSelectionX = oSettings.quickVariantSelectionX;
			var oQuickVariantSelection = oSettings.quickVariantSelection;
			if (oQuickVariantSelectionX && oQuickVariantSelection) {
				throw new FeError(sClassName, "Defining both QuickVariantSelection and QuickVariantSelectionX in the manifest is not allowed.");
			}
			oQuickVariantSelectionEffective = oQuickVariantSelectionX || oQuickVariantSelection;
			if (oQuickVariantSelectionX) {
				enableAutoBindingMultiView = oQuickVariantSelectionX.enableAutoBinding;		//Check if value of enableAutoBinding is being set from manifest
				if (enableAutoBindingMultiView === null || enableAutoBindingMultiView === undefined) {
					oQuickVariantSelectionX.enableAutoBinding = true;							//set the default value of enableAutoBinding to true
				}
			}
			if (!oQuickVariantSelectionEffective) {
				return;
			}

			sMode = oQuickVariantSelectionX ? "multi" : "single";

			// manifestSettings: indicates multiple tab single view
			// pathInTemplatePrivateModel: path of the model to be read
			// presentationControlHandler: presentationControlHandler instance which contains smartControl which contains table
			// getPresentationControlHandler : function which returns the presentationControlHandler instance with the given smartcontrol's key
			// switchingControl: the control which is used to switch between the views. It must possess a getItems() method.
			// smartFilterBar: smartfilterbar which contains filter values
			var oConfiguration = {
				mode: sMode,
				manifestSettings: oQuickVariantSelectionEffective,
				pathInTemplatePrivateModel: "/alp/multipleViews",
				presentationControlHandler: oQuickVariantSelection && oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oState.oSmartTable), // only in single views mode a single smart control is being transfered
				getPresentationControlHandler: oQuickVariantSelectionX && getPresentationControlHandler,
				getSwitchingControlAsync: fnGetSwitchingControlAsync,
				smartFilterBar: oState.oSmartFilterbar,
				resolveParameterizedEntitySet: fnResolveParameterizedEntitySetforAggregatedService,
				getSearchValue: function () {
					return oState.oSmartFilterbar.getBasicSearchValue();
				},
				appStateChange: function(){
					if (oGenericMultipleViewsHandler) {
						fnAdaptPresentationControl();
						// The following logic checks whether we need to rebind or refresh (or both) the SmartControl which is switched to.
						//var bSearchButtonPressed = oState.oIappStateHandler.areDataShownInTable(); //|| oState.oWorklistData.bWorkListEnabled;
						//oState.oIappStateHandler.changeIappState(bSearchButtonPressed);
					}
				},
				isDataToBeShown: function () {
					return true;
					//Needs to be implemented
					//return oState.oIappStateHandler.areDataShownInTable();
				},
				adaptRefreshRequestMode: function(iRefreshRequest) {
					return iRefreshRequest;
					//Needs to be implemented
					//return iRefreshRequest + (oState.oWorklistData.bWorkListEnabled && iRefreshRequest < 2 ? 2 : 0);
				},
				refreshModelOnTableRefresh: true,
				adaptPresentationControl: fnAdaptPresentationControl
			};
			oGenericMultipleViewsHandler = new MultipleViewsHandler(oController, oTemplateUtils, oConfiguration);
			fnGetSwitchingControlAsync().then(fnAdaptPresentationControl);

		})();

		// public instance methods
		return {
			onDataRequested: onDataRequested,
			refreshOperation: fnRefreshOperation,
			onRebindContentControl: onRebindContentControl,
			formatMessageStrip: fnFormatMessageStrip,
			getContentForIappState: fnGetContentForIappState,
			restoreFromIappState: fnRestoreFromIappState,
			formatItemTextForMultipleView: fnFormatItemTextForMultipleView,
			getEnableAutoBinding: fnGetEnableAutoBinding,
			getOriginalEnableAutoBinding: fnGetOriginalEnableAutoBinding,
			determineSortOrder: fnDetermineSortOrder,
			setControlVariant: fnSetControlVariant,
			handleStartUpObject: fnHandleStartUpObject,
			onDetailsActionPress: fnOnDetailsActionPress,
			getSelectedKeyPropertyName: fnGetSelectedKeyPropertyName,
			getSelectedKey: fnGetSelectedKey,
			setSelectedKey: fnSetSelectedKey,
			hasEntitySet: fnHasEntitySet,
			refreshSiblingControls: fnRefreshSiblingControls,
			resolveParameterizedEntitySet: fnResolveParameterizedEntitySet,
			getMode: fnGetMode,
			resolveParameterizedEntitySetforAggregatedService: fnResolveParameterizedEntitySetforAggregatedService,
			getKeyToPresentationControlHandler: getKeyToPresentationControlHandler,
			registerKeyChange: fnRegisterKeyChange,
			getInitializationPromise: fnGetInitializationPromise
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.MultipleViewsHandler", {
		constructor: function(oState, oController, oTemplateUtils) {
			extend(this, getMethods(oState, oController, oTemplateUtils));
		}
	});
});
