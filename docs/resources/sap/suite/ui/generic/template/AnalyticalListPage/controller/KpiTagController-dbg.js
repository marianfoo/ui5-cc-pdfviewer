sap.ui.define([
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/KpiCardController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/library",
	"sap/ui/Device",
	"sap/m/ResponsivePopover",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function (KpiCardController, JSONModel, coreLibrary, Device, ResponsivePopover, FeLogger) {
	"use strict";
	var oLogger = new FeLogger("AnalyticalListPage.controller.KpiTagController").getLogger();
	var OVPLoaded, ViewType;
	ViewType = coreLibrary.mvc.ViewType;

	var KpiTagController = {
		_kpiCards: [],
		init: function (oState) {
			var me = this;
			me.oState = oState;
			// create JSON model instance
			me.oGenericModel = new JSONModel();

			// JSON sample data

			var mGenericData = {
				header: "Some Header",
				title: "Some Title",
				titleUrl: "",
				icon: "sap-icon://camera"
			};

			// set the data for the model
			me.oGenericModel.setData(mGenericData);
			if (OVPLoaded === undefined) {
				OVPLoaded = sap.ui.getCore().loadLibrary("sap.ovp", { async: true });
			}
		},

		openKpiCard: function (oEvent) {
			var me = this;
			var oSource;
			if (typeof oEvent.currentTarget != "undefined") {
				oSource = sap.ui.getCore().byId(oEvent.currentTarget.id);
			} else {
				oSource = oEvent.getSource();
			}
			// if OVP is loaded then Open the KPI card
			OVPLoaded.then(function () {
				me.createPopover(function () {
					me._openCard(oSource);
				}.bind(me, oSource), oSource);
			});
		},

		_openCard: function (oSource) {
			var me = this;

			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.

			setTimeout(function () {
				me._kpiCards[oSource.getQualifier()].openBy(oSource);
			}, 0);

		},

		handleKpiPress: function (oEvent) {
			this.openKpiCard(oEvent);
		},

		createPopover: function (fnOpenOnSucces, oSource) {
			var me = this;
			var sQualifier = oSource.getQualifier();
			var oComponent = me.oState.oController.getOwnerComponent();
			//Find the KPI setting based on qualifier
			var oKPISettings = oComponent.getKeyPerformanceIndicators();
			var oQualifierSettings;
			for (var sKey in oKPISettings) {

				if (oKPISettings[sKey].hasOwnProperty("qualifier") && oKPISettings[sKey].qualifier === sQualifier) {
					oQualifierSettings = oKPISettings[sKey];
					break;
				}
			}
			if (!oQualifierSettings) {
				oLogger.error("KPI settings not found with qualifier.");
				return;
			}
			var outboundTarget = oComponent.getAppComponent().getManifestEntry("/sap.app/crossNavigation/outbounds/" + oQualifierSettings.detailNavigation);
			var oModel = oComponent.getModel(oQualifierSettings.model);

			oModel.getMetaModel().loaded().then(function () {
				var me = this;
				var oParamModel = new JSONModel();
				var oQualifierSettings = arguments[0];
				me._oCardController = new KpiCardController();
				var oComponent = me.oState.oController.getOwnerComponent();
				var oModel = oComponent.getModel(oQualifierSettings.model);
				var oMetaModel = oModel.getMetaModel();
				var oEntitySet = oMetaModel.getODataEntitySet(oQualifierSettings.entitySet);
				oQualifierSettings.metaModel = oMetaModel;
				oParamModel.setData(oQualifierSettings);
				var oFilterableKPISelectionVariant = oSource.getFilterableKPISelectionVariant();

				// create a new view with template processing
				sap.ui.core.mvc.View.create({
					preprocessors: {
						xml: {
							bindingContexts: {
								entityType: oMetaModel.createBindingContext(oMetaModel.getODataEntityType(oEntitySet.entityType, true)),
								entitySet: oMetaModel.createBindingContext(oMetaModel.getODataEntitySet(oQualifierSettings.entitySet, true))
							},
							models: {
								entitySet: oMetaModel,
								entityType: oMetaModel,
								parameter: oParamModel

							},
							dataModel: oModel,
							settings: oParamModel,
							preprocessorsData: oComponent.getComponentData().preprocessorsData
						}
					},

					type: ViewType.XML,
					viewName: "sap.suite.ui.generic.template.AnalyticalListPage.view.KpiCardSizeM",
					height: "100%"
				}).then(function(oView) {
					var paths = oSource.kpiSettings.kpiPropertyPath;
					oView.data({
						"kpiTitle": oSource.getSmartKpiConfig().properties.title,
						"qualifierSettings": oQualifierSettings
					});
					if (paths.selectionPresentationVariantPath) {
						oView.data({
							"dataPointPath": paths.dataPointPath,
							"selectionPresentationVariantPath": paths.selectionPresentationVariantPath
						});
					} else {
						oView.data({
							"kpiAnnotationPath": paths.kpiAnnotationPath
						});
					}
					if (oQualifierSettings.filterable) {
						oView.data({
							"mergedSelectionVariant": oFilterableKPISelectionVariant
						});
					} else {
						oView.data({
							"selectionVariant": oSource.kpiSettings.selectionVariant
						});
					}
					oView.setModel(oComponent.getModel(oQualifierSettings.model));

					//Set model for detail action
					var actionModel = new JSONModel();
					var actionData = { "visible": oQualifierSettings.detailNavigation ? true : false };
					if (oSource.kpiSettings.navigation) { //pick semantic object, action and KPI ID from annotation for kpi created from ui.kpi
						actionData.target = oSource.kpiSettings.navigation.semanticObject;
						actionData.action = oSource.kpiSettings.navigation.action;
						//kpi id is passed as EvaluaitionId as this parameter is mandatory for a smart business app
						actionData.parameters = JSON.stringify({ "EvaluationId": oSource.kpiSettings.navigation.kpiId });
					} else if (oQualifierSettings.detailNavigation && outboundTarget) { //pick SO and action from manifest for kpi created from ui.SPV
						actionData.target = outboundTarget.semanticObject;
						actionData.action = outboundTarget.action;
						actionData.parameters = JSON.stringify(outboundTarget.parameters ? outboundTarget.parameters : {});
					} else {
						//Have to hide the button, no where to navigate
						actionData.visible = false;
					}
					actionModel.setData(actionData);
					oView.setModel(actionModel, "detailNavigation");

					if (typeof me._kpiCards[sQualifier] != "undefined") {
						me._kpiCards[sQualifier].destroy();
					}
					me._kpiCards[sQualifier] = new ResponsivePopover();
					//Responsive Popover behaves as a popover in tablet and desktop wherein the card does not render over the whole screen.
					//Hence header with close button should be enabled only in phone where it occupies whole screen
					var bShowHeader = Device.system.phone ? true : false;
					me._kpiCards[sQualifier].setShowHeader(bShowHeader);
					if (!bShowHeader) {
						me._kpiCards[sQualifier].addStyleClass("sapSmartTemplatesAnalyticalListPageKpiCardStyle");
					}
					me._kpiCards[sQualifier].setPlacement("Auto");
					me._kpiCards[sQualifier].addContent(oView);
					me._oKpiCardController = oView.getController();
					me._oKpiCardController._assignSmartTemplateDependencies(me.oState.oTemplateUtils, me.oState.oController);
					me.oState.oController.getView().addDependent(me._kpiCards[sQualifier]);

					fnOpenOnSucces();
				});

			}.bind(this, oQualifierSettings));


		},

		onExit: function () {
			if (this._oKpiCard) {
				this._oKpiCard.destroy();
			}
		},

		_setModel: function (oModel) {
			this._oKpiCard.setModel(oModel);
		}
	};

	return KpiTagController;
});
