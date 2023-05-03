sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/thirdparty/d3",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",
	"sap/ui/generic/app/navigation/service/SelectionVariant", "sap/m/MessageBox",
	"sap/ui/model/analytics/odata4analytics"
], function(Fragment, Controller, JSONModel, D3, KpiUtil, V4Terms, SelectionVariant, MessageBox, oData4Analytics) {
	"use strict";

	var oNavigationHandler,
		oSTCommonUtils,
		oOvpCommonUtils,
		oSTController;

	var cController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.KpiCardController", {

		onInit: function(evt) {
			// CommonUtils will be taken from OVP lib
			sap.ui.require(["sap/ovp/cards/CommonUtils"], function(oOVPCommonUtils) {
				oOvpCommonUtils = oOVPCommonUtils;
			});
		},
		onExit: function() {
		},
		onBeforeRendering: function() {
			//get the view and other settings
			var oView = this.getView();
			var oSettings = oView.data("qualifierSettings");
			var oQualifier = oSettings.qualifier;
			var oModel = oView.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oSettings.entitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			var oFilterableKPISelectionVariant = oView.data("mergedSelectionVariant");
			var sKpiAnnotationPath  = oView.data("kpiAnnotationPath");
			var sSPVPath = oView.data("selectionPresentationVariantPath");
			var sDataPointPath = oView.data("dataPointPath");
			// create a card name for OVP
			var oCardName = "kpiCard" + oQualifier;
			// create a card settings to pass to OVP
			var oCardSettings = {
				"cards":{}
			};

			oCardSettings["cards"][oCardName] = {
				"model": oSettings.model,
				"template": "sap.ovp.cards.charts.analytical",
				"settings": {
					"title": oView.data("kpiTitle"),
					"entitySet": oSettings.entitySet,
					"showFilterInHeader": true,
					"navigation": "chartNav",
					//to fix the colors of the legends based on the dimension values
					"bEnableStableColors": oSettings.enableStableColors,
					"colorPalette": oSettings.colorPalette
				}
			};
			//to show datalabel for analytical cards
			var oComponent = oSTController.getOwnerComponent();
			var bShowDataLabel = oComponent && oComponent.getChartSettings() && oComponent.getChartSettings().showDataLabel;
			oCardSettings["cards"][oCardName]["settings"].showDataLabel = bShowDataLabel;
			//Below code ensure to add subtitle only when there is as Description as is not a mandatory child annotation of Data point
			//This could have been done in above while create a object,but if we do "subTitle" : if description ends up being " " or
			//or some other value this takes more priority and " " in UoM will displayed, hence to avoid that we are creating "subtitle"
			//only if has some val and not undefined.
			if (oEntityType[sDataPointPath] && oEntityType[sDataPointPath].hasOwnProperty("Description")) {
				oCardSettings["cards"][oCardName]["settings"].subTitle = oEntityType[sDataPointPath]["Description"].String;
			}
			if (sKpiAnnotationPath) {
				oCardSettings["cards"][oCardName].settings.kpiAnnotationPath = sKpiAnnotationPath;
				// create a card with OVP API
				oOvpCommonUtils.createCardComponent(oView, oCardSettings, "template::ALPcardContainer", oFilterableKPISelectionVariant);
			} else {
				oCardSettings["cards"][oCardName].settings.dataPointAnnotationPath = sDataPointPath;
				oCardSettings["cards"][oCardName].settings.selectionPresentationAnnotationPath = sSPVPath;
				var fnCheckNavigation = function () {
					var oNavModel = oView.getModel("detailNavigation");
					if (oNavModel) {
						var sTarget = oNavModel.getProperty("/target");
						var sAction = oNavModel.getProperty("/action");
						if (sTarget && sAction) {
							return true;
						}
					}
					return false;
				};
				// create a card with OVP API
				oOvpCommonUtils.createCardComponent(oView, oCardSettings, "template::ALPcardContainer", oFilterableKPISelectionVariant, fnCheckNavigation);
			}
			//Event handler on header clicked for navigation
			oOvpCommonUtils.onHeaderClicked = function(oEvent) {
				this.handleNavigationPress(oView);
			}.bind(this);
			oOvpCommonUtils.onContentClicked = function (oEvent) {
				var oChartSelection = oEvent.getObject();
				this.handleNavigationPress(oView, oChartSelection);
			}.bind(this);
		},
		/*@public
		* prepare SV and then use NavigationHandler to navigate to another app
		* @param {object} oView - kpi card view
		* @param {object} oChartSelection - kpi chart selection; undefined in case of headerclick event
		* @return {void}
		*/
		handleNavigationPress: function(oView, oChartSelection) {
			var oNavModel = oView.getModel("detailNavigation");
			if (oNavModel) {
				var sTarget = oNavModel.getProperty("/target");
				var sAction = oNavModel.getProperty("/action");
				var oPopover = oView.getParent();
				oPopover.setModal(true);
				if (sTarget && sAction) {
					var oObjectInfo = {
						semanticObject: sTarget,
						action: sAction
					};
					this._oSelectionVariant = new SelectionVariant();
					//get parameters defined in manifest for crossNavigation and add them to SV / get KPI ID in case of ui.kpi
					var appDescriptorParameters = JSON.parse(oNavModel.getProperty("/parameters"));
					this._createNavigationContext(appDescriptorParameters, true);
					//add parameters and select options from annotations to SV
					//parameters in annotations take precedence over parameters from app descriptor
					this._getSelectOptionsFromAnnotation(oView);
					if (oChartSelection) {
						//if chart selection exists, then add it to SV
						this._createNavigationContext(oChartSelection);
					}
					oSTController.adaptNavigationParameterExtension(this._oSelectionVariant, oObjectInfo);

					this._constructContextURL();

					if (this._sParameterContextURL) {
						this._oSelectionVariant.setParameterContextUrl(this._sParameterContextURL);
					}

					if (this._sFilterContextURL) {
						this._oSelectionVariant.setFilterContextUrl(this._sFilterContextURL);
					}
					// need to set the model incase KPI coming from different service inorder to
					// check the DP.IsPotentiallySenstive fields.
					oNavigationHandler.setModel(this.getView().getModel());
					//NavigationHandler.navigate accepts selection variant as a string
					this._oSelectionVariant = this._oSelectionVariant.toJSONString();
					oNavigationHandler.navigate(sTarget, sAction, this._oSelectionVariant, null, function (oError) {
						if (oError instanceof sap.ui.generic.app.navigation.service.NavError) {
							if (oError.getErrorCode() === "NavigationHandler.isIntentSupported.notSupported") {
								MessageBox.show(oSTCommonUtils.getText("ST_NAV_ERROR_NOT_AUTHORIZED_DESC"), {
									title: oSTCommonUtils.getText("ST_GENERIC_ERROR_TITLE"),
									onClose: function() {
										oPopover.setModal(false);
									}
								});
							} else {
								MessageBox.show(oError.getErrorCode(), {
									title: oSTCommonUtils.getText("ST_GENERIC_ERROR_TITLE"),
									onClose: function(){
										oPopover.setModal(false);
									}
								});
							}
						}

					});
				}
			}
		},
		_assignSmartTemplateDependencies: function(oTemplateUtils,oController) {
			oSTCommonUtils = oTemplateUtils.oCommonUtils;
			oSTController = oController;
			oNavigationHandler = oTemplateUtils.oServices.oApplication.getNavigationHandler();
		},
		/*
		* @private
		* add parameters from app descriptor, filter from KPI chart selection to selection variant
		* so that it can be consumed by the navigation handler
		* @param {object} oParameter - parsed annotations data from visual filter provider
		* @param {boolean} bIsParameter	- true if oParameter is paramter, undefined if oParameter is a filter
		* @return {void}
		*/
		_createNavigationContext: function(oParameter, bIsParameter) {
			var keys = Object.keys(oParameter);
			for (var i = 0; i < keys.length; i++) {
				var eachKey = keys[i];
				//SelectionVariant does not accept undefined/null values
				//dont add such values to SelectionVariant
				if (!oParameter[eachKey] && oParameter[eachKey] !== "") {
					return;
				}
				if (bIsParameter) {
					//SelectionVariant.addParameter accepts the property name and its value
					this._oSelectionVariant.addParameter(eachKey, oParameter[eachKey]);
				} else {
					//chart selection takes precedence over SV
					if (this._oSelectionVariant.getSelectOption(eachKey)) {
						this._oSelectionVariant.removeSelectOption(eachKey);
					}
					//SelectionVariant.addSelectOption accepts property name, sign [include or exclude the value - always I for chart selection],
					//option of the range [always "EQ" for chart selection], low value [chart selection value is low value],
					//high value [chart selection has no high value]
					this._oSelectionVariant.addSelectOption(eachKey, "I", "EQ", oParameter[eachKey]);
				}
			}
		},
		/*
		* @private
		* obtain parameters and select options from annotations and add them to selection variant
		* so that it can be consumed by the navigation handler
		* @param {object} oView - card view
		* @return {void}
		*/
		_getSelectOptionsFromAnnotation: function(oView) {
			var that = this;
			var bIsFilterableKPI = oView.data("qualifierSettings").filterable;
			//for a filterable kpi, consider the merged SV, taking into account the parameters from manifest
			if (bIsFilterableKPI) {
				var oMergedSelectionVariant = oView.data("mergedSelectionVariant");
				//_oSelectionVariant._mParameters holds manifest parameters
				//if not present in merged SV, add them in the navigation context
				var paramKeys = this._oSelectionVariant.getParameterNames();
				if (paramKeys) {
					for (var i = 0; i < paramKeys.length; i++) {
						if (!oMergedSelectionVariant.getParameter(paramKeys[i])) {
							oMergedSelectionVariant.addParameter(paramKeys[i], this._oSelectionVariant.getParameter(paramKeys[i]));
						}
					}
				}
				this._oSelectionVariant = oMergedSelectionVariant;
				return;
			}
			var oSelectionVariant = oView.data("selectionVariant");
			var aSelectOptions = oSelectionVariant.SelectOptions;
			var	aSVParameters = oSelectionVariant.Parameters;
			//if parameters are provided in the annotations, add them to SV after removing duplicates
			if (aSVParameters && aSVParameters.length) {
				aSVParameters.forEach(function(oParameter) {
					var sParameterName = oParameter.PropertyName.PropertyPath;
					var sParameterValue = oParameter.PropertyValue.String;
					if (that._oSelectionVariant.getParameter(sParameterName)) {
						that._oSelectionVariant.removeParameter(sParameterName);
					}
					that._oSelectionVariant.addParameter(sParameterName, sParameterValue);
				});
			}
			//if select options are present in annotations, add them to SV
			if (aSelectOptions && aSelectOptions.length) {
				aSelectOptions.forEach(function(oSelectOption) {
					var sPropertyName = oSelectOption.PropertyName.PropertyPath;
					var aRanges = oSelectOption.Ranges;
					//a property can have multiple ranges. add each of them to SV
					aRanges.forEach(function(oRange) {
						var sLowValue = oRange.Low.String;
						var sHighValue = (oRange.High &&  oRange.High.String) ? oRange.High.String : null;
						var sSign = oRange.Sign.EnumMember.split("/")[1];
						var sOption = oRange.Option.EnumMember.split("/")[1];
						that._oSelectionVariant.addSelectOption(sPropertyName, sSign, sOption, sLowValue, sHighValue);
					});
				});
			}
		},
		_constructContextURL: function() {
			// construct contextURL for first time only
			if (this._sFilterContextURL || this._sParameterContextURL) {
				return;
			}
			var oView = this.getView();
			var oSettings = oView.data("qualifierSettings");
			var oModel = oView.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oSettings.entitySet);
			var o4a = new oData4Analytics.Model(oData4Analytics.Model.ReferenceByModel(oModel));
			var queryResult = o4a.findQueryResultByName(oEntitySet.name);
			var parameterization = queryResult && queryResult.getParameterization();

			if (parameterization) {
				this._sParameterContextURL = oNavigationHandler.constructContextUrl(parameterization.getEntitySet().getQName(), oModel);
			}
			this._sFilterContextURL = oNavigationHandler.constructContextUrl(oEntitySet.name, oModel);
		}
	});
	return cController;

});
