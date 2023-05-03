/*global Promise */
sap.ui.define([
		"sap/ui/base/Object",
		"sap/ui/core/UIComponent",
		"sap/ui/model/resource/ResourceModel",
		"sap/ui/core/library",
		"sap/ui/model/json/JSONModel",
		"sap/ui/generic/app/ApplicationController",
	    "sap/suite/ui/generic/template/genericUtilities/FeLogger",
		"sap/base/util/extend",
		"sap/base/util/deepExtend",
		"sap/ui/core/mvc/View"
	],
	function(BaseObject, UIComponent, ResourceModel, coreLibrary, JSONModel, ApplicationController, FeLogger, extend, deepExtend) {
		"use strict";

		var oLogger = new FeLogger("js.QuickTemplates.QuickTemplateComponentFactory").getLogger();
		var ViewType = coreLibrary.mvc.ViewType;

		var factory = BaseObject.extend("sap.suite.ui.generic.template.js.QuickTemplates.QuickTemplateComponentFactory");

		function fnEnhanceI18nModel(oComponent) {
			var oI18NModel = new ResourceModel({
				bundleName: "sap/suite/ui/generic/template/QuickCreate/i18n/i18n"
			});
			var oQVI18nModel = new ResourceModel({
				bundleName: "sap/suite/ui/generic/template/QuickView/i18n/i18n"
			});
			oI18NModel.enhance(oQVI18nModel.getResourceBundle());

			var oTemplateModel = oComponent.getModel("i18n");
			if (oTemplateModel) {
				oI18NModel.enhance(oTemplateModel.getResourceBundle());
			}
			oComponent.setModel(oI18NModel, "i18n");
		}

		function fnDetermineStableViewID(oComponent) {
			return oComponent.getMetadata().getComponentName() + "::" + oComponent.getViewName() + "::" + oComponent.getEntitySet();
		}

		function fnCreateParameterModel(oComponent, sEntityType) {
			var isDraftEnabled = oComponent.getTransactionController().getDraftController().getDraftContext().isDraftEnabled(oComponent.getEntitySet());
			var oSettings = null;
			var oAllSettings = oComponent.oContainer.getSettings(); // this should have all settings passed to the component during creation

			// create settings section in parameter model with all settings passed to
			// the component
			oSettings = extend({}, oAllSettings);

			// remove properties not needed or available on the component itself
			delete oSettings.appComponent;
			delete oSettings.entitySet;
			delete oSettings.navigationProperty;

			return new JSONModel({
				entitySet: oComponent.getEntitySet(),
				entityType: sEntityType,
				"sap-ui-debug": window["sap-ui-debug"],
				isDraftEnabled: isDraftEnabled,
				settings: oSettings,
				manifest: oComponent.getManifest()
			});
		}

		function fnCreateXMLView(oComponent) {

			return new Promise(function(resolve, reject) {
				var oView = null;
				var oMetaModel = this.getModel().getMetaModel();
				oMetaModel.loaded().then(function() {

					var oEntitySet = oMetaModel.getODataEntitySet(this.getEntitySet());
					if (!oEntitySet || !oEntitySet.entityType) {
						oLogger.error("The specified entity set " + this.getEntitySet() + " was not found in loaded metadata of service");
						if (reject) {
							reject();
						}
						return;
					}


					var sStableId = fnDetermineStableViewID(this);

					oView = sap.ui.getCore().byId(sStableId);
					if (oView) {
						oLogger.warning("View with ID: " + sStableId + " already exists - old view is getting destroyed now!");
						try {
							oView.destroy();
						} catch (ex) {
							oLogger.warning("Error destroying view: " + ex);
						}
						oView = null;
					}

					var preprocessorsData = this.getComponentData() ? this.getComponentData().preprocessorsData : null;
					oView = sap.ui.view({
						async: true,
						viewData: {
							component: this
						},
						preprocessors: {
							xml: {
								bindingContexts: {
									meta: oMetaModel.createBindingContext(oMetaModel.getODataEntityType(oEntitySet.entityType, true)),
									entitySet: oMetaModel.createBindingContext(oMetaModel.getODataEntitySet(this.getEntitySet(), true))
								},
								models: {
									meta: oMetaModel,
									entitySet: oMetaModel,
									parameter: fnCreateParameterModel(this, oEntitySet.entityType)
								},
								preprocessorsData: preprocessorsData
							}
						},
						id: sStableId,
						type: ViewType.XML,
						viewName: this.getViewName(),
						height: "100%"
					});

					resolve(oView);
				}.bind(this));
			}.bind(oComponent));

		}



		function fnInit() {
			// call super init (will call function "create content")
			UIComponent.prototype.init.apply(this, arguments);
			this._oApplicationController = new ApplicationController(this.getModel());
		}

		function fnExit() {
			if (this._oApplicationController) {
				this._oApplicationController.destroy();
			}
			this._oApplicationController = null;
		}

		factory.createQuickTemplateComponent = function(oComponentName, oComponentDefinition) {
			var genericDefinition = {

				metadata: {
					library: "sap.suite.ui.generic.template",
					properties: {
						/**
						 * Name of template
						 */
						viewName: {
							type: "string",
							defaultValue: null
						},
						/**
						 * Entity Set
						 */
						entitySet: {
							type: "string",
							defaultValue: null
						}
					}
				},

				getAppComponent: function() {
					return this;
				},

				onBeforeRendering: function() {
					var oContainer = this.oContainer;
					var oModel = !this.createViewStarted && this.getModel();
					if (oModel) {
						oModel.getMetaModel().loaded().then(function() { // Do the templating once the metamodel is loaded
							if (!this.createViewStarted) {
								this.createViewStarted = true;
								fnCreateXMLView(this).then(function(oView) {
									this.setAggregation("rootControl", oView);
									if (this.oQuickCreateAPI) { // does not exist in a QuickView
										this.oQuickCreateAPI.fireQuickCreateViewCreated();
									}
									fnEnhanceI18nModel(this);
									var i18n = this.getModel("i18n");
									if (i18n) {
										oView.setModel(i18n, "i18n");
									}
									oContainer.invalidate();
								}.bind(this));
							}
						}.bind(this));
					}
				},



				getTransactionController: function() {
					return this._oApplicationController.getTransactionController();
				},


				getApplicationController: function() {
					return this._oApplicationController;
				}


			};

			var definedInit = oComponentDefinition.init;
			oComponentDefinition.init = function() {
				fnInit.apply(this, arguments);
				if (typeof definedInit === "function") {
					definedInit.apply(this, arguments);
				}

			};

			var definedExit = oComponentDefinition.exit;
			oComponentDefinition.exit = function() {
				fnExit.apply(this, arguments);
				if (typeof definedExit === "function") {
					definedExit.apply(this, arguments);
				}
			};

			deepExtend(genericDefinition, oComponentDefinition);
			return UIComponent.extend(oComponentName, genericDefinition);
		};

		return factory;

	});
