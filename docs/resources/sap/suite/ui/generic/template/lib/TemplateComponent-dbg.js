sap.ui.define(["sap/ui/core/library",
	"sap/ui/core/Component",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/Device",
	"sap/suite/ui/generic/template/lib/reuseComponentHelper",
	"sap/ui/core/CustomData",
	"sap/suite/ui/generic/template/lib/StableIdDefinition",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/js/AnnotationHelper",
	"sap/base/util/extend",
	"sap/base/util/deepExtend",
	"sap/suite/ui/generic/template/genericUtilities/CacheHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeError",
	"sap/ui/core/mvc/XMLView"
], function(coreLibrary, Component, UIComponent, JSONModel, ResourceModel, Device,
			reuseComponentHelper, CustomData, StableIdDefinition, StableIdHelper, FeLogger, AnnotationHelper, extend, deepExtend, CacheHelper, FeError, XMLView) {
		"use strict";
        var	sClassName = "lib.TemplateComponent";
	    var oLogger = new FeLogger(sClassName).getLogger();
		// shortcut for sap.ui.core.mvc.ViewType
		var ViewType = coreLibrary.mvc.ViewType;

		// This method enhances the i18n model which has been attached to the template component via the manifest.
		// For this purpose the following enhancement chain is built:
		// Generic Template texts <- Template specific texts <- Application specific texts
		// Note that the i18n model is actually replaced since the generic template texts are used as basis for this enhacement chain.
		function fnEnhanceI18nModel(oComponent) {
			var oI18NModel = new ResourceModel({ bundleName: "sap/suite/ui/generic/template/lib/i18n/i18n" });
			var aChildModels = [];
			var oModelApplication = oComponent.getAppComponent().getModel("i18n|" + oComponent.getMetadata().getComponentName() + "|" + oComponent.getEntitySet());
			if (oModelApplication) {
				aChildModels.push(oModelApplication);
			}
			var oTemplateModel = oComponent.getModel("i18n");
			if (oTemplateModel){
				aChildModels.push(oTemplateModel);
			}
			var oTemplateModelAppi18n = oComponent.getModel("@i18n");
			if (oTemplateModelAppi18n){
				aChildModels.push(oTemplateModelAppi18n);
			}
			var oParentModel = true;
			for (var sParentName = "i18n"; oParentModel; ){
				sParentName = sParentName + "||Parent";
				oParentModel = oComponent.getModel(sParentName);
				if (oParentModel){
					aChildModels.push(oParentModel);
				}
			}
			for (var i = aChildModels.length - 1; i >= 0; i--){
				oI18NModel.enhance(aChildModels[i].getResourceBundle());
			}
			oComponent.setModel(oI18NModel, "i18n");
		}

		function fnEnhanceTemplPrivForBreakoutActions(oComponentRegistryEntry, oModel) {
			var oManifest = oComponentRegistryEntry.oComponent.getAppComponent().getManifestEntry("sap.ui5");
			var oExtensions = oManifest.extends && oManifest.extends.extensions && oManifest.extends.extensions["sap.ui.controllerExtensions"];
			var sExtensionId = oComponentRegistryEntry.methods.oComponentData.templateName + "#" + oComponentRegistryEntry.oComponent.getAppComponent().getMetadata().getComponentName() + "::" + oComponentRegistryEntry.methods.oComponentData.templateName + "::" + oComponentRegistryEntry.oComponent.getEntitySet();
			//If instance specific Controller extension exists then pick it else pick the generic extension
			oExtensions = oExtensions && (oExtensions[sExtensionId] || oExtensions[oComponentRegistryEntry.methods.oComponentData.templateName]);
			var oTemplateExtensions = oExtensions && oExtensions["sap.ui.generic.app"];
			var sEntitySet = oComponentRegistryEntry.oComponent.getEntitySet();
			var oBreakoutActions = oTemplateExtensions && oTemplateExtensions[sEntitySet] && oTemplateExtensions[sEntitySet].Actions;
			var oBreakOutActionEnabled = {};
			var oTableTabs = fnGetTableTabs(oComponentRegistryEntry.oComponent);
			if (oBreakoutActions) {
				if (oTableTabs) {
					fnAddBreakoutEnablementForTableTabs(oBreakOutActionEnabled, oBreakoutActions, oTableTabs);
				} else {
					fnAddBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions);
				}
			} else {
				var mSections = oTemplateExtensions && oTemplateExtensions[sEntitySet] && oTemplateExtensions[sEntitySet]["Sections"];
					for (var sSection in mSections) {
						oBreakoutActions = mSections[sSection]["Actions"];
						if (oBreakoutActions) {
							fnAddBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions);
						}
					}
			}
			oComponentRegistryEntry.oComponent.getModel("_templPriv").setProperty("/generic/listCommons/breakoutActionsEnabled", oBreakOutActionEnabled);
		}

		function fnGetTableTabs(oComponent) {
			var oResult;
			var oConfig = oComponent.getAppComponent().getConfig();
			var oSettings = oConfig && oConfig.pages[0] && oConfig.pages[0].component && oConfig.pages[0].component.settings;
			if (oSettings && oSettings.quickVariantSelectionX) {
				oResult = oSettings.quickVariantSelectionX.variants;
			}
			return oResult;
		}

		function fnAddBreakoutEnablementForTableTabs(oBreakOutActionEnabled, oBreakoutActions, oTableTabs) {
			var bEnabled;
			for (var sAction in oBreakoutActions) {
				bEnabled = true;
				if (oBreakoutActions[sAction].requiresSelection) {
					bEnabled = false;
				}
				for (var i in oTableTabs) {
					var sActionId = oBreakoutActions[sAction].id;
					var oTabItem = oTableTabs[i];
					var sSuffix = AnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
					if (sSuffix) {
						sActionId = sActionId.concat(sSuffix);
					}
					oBreakOutActionEnabled[sActionId] = {
							enabled: bEnabled
					};
				}
			}
		}

		function fnAddBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions) {
			var bEnabled;
			for (var sAction in oBreakoutActions) {
				bEnabled = true;
				if (oBreakoutActions[sAction].requiresSelection) {
					bEnabled = false;
				}
				oBreakOutActionEnabled[oBreakoutActions[sAction].id] = {
						enabled: bEnabled
				};
			}
		}

		function fnDetermineViewId(oComponentRegistryEntry) {
			if (oComponentRegistryEntry.oComponent.getAppComponent().getMetadata().getComponentName() === "" || oComponentRegistryEntry.methods.oComponentData.templateName === "" || oComponentRegistryEntry.oComponent.getEntitySet() === "") {
				// TODO: Error Handling
			}
			return oComponentRegistryEntry.oComponent.getAppComponent().getMetadata().getComponentName() + "::" + oComponentRegistryEntry.methods.oComponentData.templateName + "::" + oComponentRegistryEntry.oComponent.getEntitySet();
		}

		function getTreeNodeAncestors(oTreeNode, mRoutingTree){
			if (oTreeNode.level === 0){
				return [];
			}
			var oParent = mRoutingTree[oTreeNode.parentRoute];
			var aRet = getTreeNodeAncestors(oParent, mRoutingTree);
			aRet.push(oParent);
			return aRet;
		}

		function createParameterModel(sEntityType, oComponentRegistryEntry, oMetaModel, fnTemplateSpecificParameters) {
			var oComponent = oComponentRegistryEntry.oComponent;
			var oAppComponent = oComponentRegistryEntry.oAppComponent;
			var oTreeNode = oComponentRegistryEntry.oTemplateContract.mRoutingTree[oComponentRegistryEntry.route];
			var sEntitySet = oComponent.getEntitySet();
			var isDraftEnabled = oComponentRegistryEntry.utils.isDraftEnabled();
			var oDraftController = oAppComponent.getTransactionController().getDraftController();
			var oDraftContext = oDraftController.getDraftContext();
			var oModel = oAppComponent.getModel();
			var fnCheckIsDraftEnabled = function(sEntitySet){
				return oDraftContext.isDraftEnabled(sEntitySet);
			};

			// create settings section in parameter model with all settings passed to the component
			var oSettings = extend({}, oTreeNode.page.component.settings);

			// remove properties not needed or available on the component itself
			delete oSettings.appComponent;
			delete oSettings.entitySet;
			delete oSettings.navigationProperty;

			// move non public settings into the settings object for templating
			oSettings.subPages = oTreeNode.page.pages;
			oSettings.routeConfig = oComponentRegistryEntry.routeConfig;

			var oInternalManifest = oAppComponent.getInternalManifest();

			return new JSONModel({
				entitySet: sEntitySet,
				entityType: sEntityType,
				treeNode: oTreeNode,
				treeNodeAncestors: getTreeNodeAncestors(oTreeNode, oComponentRegistryEntry.oTemplateContract.mRoutingTree),
				routingSpec: oComponentRegistryEntry.routingSpec,
				"sap-ui-debug": window["sap-ui-debug"],
				isDraftEnabled: isDraftEnabled,
				checkIsDraftEnabled: fnCheckIsDraftEnabled,
				settings: oSettings,
				manifest: oInternalManifest,
				//Needed for annotation helper that resolve annotation paths or qualifier from the manifest
				metaModel: oMetaModel,
				templateSpecific: fnTemplateSpecificParameters && fnTemplateSpecificParameters(oMetaModel, oSettings, Device, sEntitySet, oInternalManifest, oModel, oDraftContext),
				appComponentName: oAppComponent.getMetadata().getComponentName(),
				stableId: {
					definition: StableIdDefinition,
					aParameter: [],
					getStableId: StableIdHelper.getStableId
				},
				variables: [] // to enable usage of variables in a more generic way then template:with allows
			});
		}

		/*
		 * Creates the XMLView based on some models.
		 * @param {object} oComponent current instance of the template component
		 * @param {string} sCacheKey represents application part of the cache key
		 *
		 * @return {sap.ui.core.mvc.View} A asnyc <code>View</code> object is returned that can be
		 * chained with the <code>Promise</code> returned by the view's loaded() function
		 *
		 * @private
		 */
		function createXMLView(oComponentRegistryEntry, aCacheKeys) {
			var oComponent = oComponentRegistryEntry.oComponent,
				fnCreateViewController = oComponentRegistryEntry.createViewController,
				fnTemplateSpecificParameters = oComponentRegistryEntry.methods && oComponentRegistryEntry.methods.getTemplateSpecificParameters,
				oModel = oComponentRegistryEntry.oAppComponent.getModel(),
				oMetaModel, sEntitySet, sEntityType, oEntitySetContext, oEntityTypeContext,
				bNoOData = oComponentRegistryEntry.routingSpec && oComponentRegistryEntry.routingSpec.noOData;
			if (bNoOData){
				oMetaModel = new JSONModel({
					entitySet: {},
					entityType: {}
				});
				oEntitySetContext = oMetaModel.createBindingContext("/entitySet");
				oEntityTypeContext = oMetaModel.createBindingContext("/entityType");

			} else {
				oMetaModel = oModel && oModel.getMetaModel();
				sEntitySet = oModel && oComponent.getEntitySet();
				var oEntitySet = sEntitySet && oMetaModel.getODataEntitySet(sEntitySet);
				sEntityType = oEntitySet && oEntitySet.entityType;
				if (!sEntityType) {
					return Promise.reject(new FeError(sClassName, "Unknown entityset " + sEntitySet));
				}
				oEntitySetContext = oMetaModel.createBindingContext(oMetaModel.getODataEntitySet(sEntitySet, true));
				oEntityTypeContext = oMetaModel.createBindingContext(oMetaModel.getODataEntityType(sEntityType, true));
			}

			fnEnhanceI18nModel(oComponent);
			fnEnhanceTemplPrivForBreakoutActions(oComponentRegistryEntry, oModel);

			// TODO: how to get the helpers from a template definition

			var sViewId = fnDetermineViewId(oComponentRegistryEntry);

			var oView = sap.ui.getCore().byId(sViewId);
			if (oView){
				oLogger.warning("View with ID: " + sViewId + " already exists - old view is getting destroyed now!");
				try {
					oView.destroy();
				} catch (ex) {
					oLogger.warning("Error destroying view: " + ex);
				}
				oView = null;
			}

			// device model
			var oDeviceModel = new JSONModel(Device);
			oDeviceModel.setDefaultBindingMode("OneWay");

			// This model will also be used in the templating for SmartFormSimpleView -> Therefore, it needs to be stored
			oComponentRegistryEntry.oParameterModel = createParameterModel(sEntityType, oComponentRegistryEntry, oMetaModel, fnTemplateSpecificParameters);

			return oComponent.runAsOwner(function() {
				// implement the interface provided by UI5 for adding additional data to the cache.
				// Note: depending on whether viewCache is used or not, oComponentRegistryEntry.preprocessorsData might
				// change its class(from the class defined in NavigationController to Object).
				// This is not an issue since we dont rely on any special features of that class.
				var oPreprocessorsDataProvider = {
					setAdditionalCacheData: function(oCacheData) {
						oComponentRegistryEntry.preprocessorsData  = oCacheData;
					},
					getAdditionalCacheData: function() {
						return oComponentRegistryEntry.preprocessorsData;
					}
				};
				var oViewSettings = {
					preprocessors: {
						xml: {
							bindingContexts: {
								entitySet: oEntitySetContext,
								entityType: oEntityTypeContext
							},
							models: {
								device: oDeviceModel,
								appSettings: oComponentRegistryEntry.oTemplateContract.appSettings,
								entitySet: oMetaModel,
								entityType: oMetaModel,
								parameter: oComponentRegistryEntry.oParameterModel
							},
							preprocessorsData: oComponentRegistryEntry.preprocessorsData
						}
					},
					id: sViewId,
					type: ViewType.XML,
					viewName: oComponentRegistryEntry.methods.oComponentData.templateName,
					height: "100%",
					cache: {
						keys: aCacheKeys,
						additionalData: oPreprocessorsDataProvider
					}
				};
				var oCustomSettings =  {
					key : "sap-ui-custom-settings",
					value : {
						"sap.ui.dt": {
							"designtime": oComponentRegistryEntry.methods.oComponentData.designtimePath
						}
					}
				};
				oViewSettings.customData =  [new CustomData(oCustomSettings)];
				oViewSettings.controller = fnCreateViewController();
				return XMLView.create(oViewSettings);
			});
		}

		function getExtensionAPIEmbeddedComponent(oComponentRegistryEntry, sEmbeddedKey, oEmbeddedComponentMeta){
			var oExtensionAPI = oComponentRegistryEntry.oController.extensionAPI;
			var oRet = extend({}, oExtensionAPI);
			if (oExtensionAPI.getNavigationController){
				var oNavigationController = extend({}, oExtensionAPI.getNavigationController());
				var fnNavigateInternal = oNavigationController.navigateInternal;
				oNavigationController.navigateInternal = function(vContext, oNavigationData){
					var sRoutename = oNavigationData && !oNavigationData.isAbsolute && oNavigationData.routeName;
					if (sRoutename){
						oComponentRegistryEntry.utils.navigateRoute(sRoutename, vContext, sEmbeddedKey, oNavigationData && oNavigationData.replaceInHistory);
					} else {
						fnNavigateInternal(vContext, oNavigationData);
					}
				};
				oRet.getNavigationController = function(){
					return oNavigationController;
				};
			}
			oRet.getCommunicationObject = function(iLevel){
				return iLevel === 1 ? oEmbeddedComponentMeta.communicationObject : oComponentRegistryEntry.utils.getCommunicationObject(iLevel);
			};
			(oComponentRegistryEntry.methods.enhanceExtensionAPI4Reuse || Function.prototype)(oRet, oEmbeddedComponentMeta);
			return oRet;
		}

		function fnPlaceEmbeddedComponent(oComponentRegistryEntry, mReuseComponentProxies, sEmbeddedKey, oEmbeddedComponentMeta, oEmbeddedComponent){
			oEmbeddedComponentMeta.extensionAPI = getExtensionAPIEmbeddedComponent(oComponentRegistryEntry, sEmbeddedKey, oEmbeddedComponentMeta);
			reuseComponentHelper.transferEmbeddedComponentProxy(oComponentRegistryEntry, mReuseComponentProxies, sEmbeddedKey, oEmbeddedComponentMeta, oEmbeddedComponent);
			var oContainer = oComponentRegistryEntry.oController.byId(oEmbeddedComponentMeta.containerId);
			var mSettings = oContainer && oContainer.getSettings();
			var mProperties = oEmbeddedComponent.getMetadata().getAllProperties();
			for (var sProperty in mSettings){
				if ((sProperty === "uiMode" || sProperty === "semanticObject" || sProperty.startsWith("st")) && !mProperties[sProperty]){
					delete mSettings[sProperty];
				}
			}
			oEmbeddedComponent.applySettings(mSettings);
			oContainer.setComponent(oEmbeddedComponent);
		}

		// returns a Promise that resolves to the specified embedded component
		function fnCreateEmbeddedComponent(oAppComponent, sComponentId, oEmbeddedComponentMeta){
			return oEmbeddedComponentMeta.componentUsage ? oAppComponent.createComponent({
				usage: oEmbeddedComponentMeta.componentUsage,
				id: sComponentId
			}) : oAppComponent.runAsOwner(function(){
				return Component.create({ name: oEmbeddedComponentMeta.componentName, id: sComponentId });
			});
		}

		function fnCreateEmbeddedComponents(oComponentRegistryEntry){
			var oTreeNode = oComponentRegistryEntry.oTemplateContract.mRoutingTree[oComponentRegistryEntry.route];
			oComponentRegistryEntry.reuseComponentsReady = new Promise(function(fnResolve, fnReject){
				var mReuseComponentProxies = Object.create(null);
				var fnReuseComponentsReady = fnResolve.bind(null, mReuseComponentProxies);
				var fnLoadError = function(sEmbeddedKey, oError){
					oLogger.error("Failed to load reuse component for key " + sEmbeddedKey, oError instanceof Error ? oError.message : "", "sap.suite.ui.generic.template.lib.TemplateComponent");
				};
				oComponentRegistryEntry.viewRegistered.then(function(){
					var aEmbeddedPromises = [];
					for (var sEmbeddedKey in oTreeNode.embeddedComponents){
						var oEmbeddedComponentMeta = oTreeNode.embeddedComponents[sEmbeddedKey];
						var oSection = oEmbeddedComponentMeta.sectionId && oComponentRegistryEntry.oController.byId(oEmbeddedComponentMeta.sectionId);
						if (oSection && oSection.isStashed()){
							delete oTreeNode.embeddedComponents[sEmbeddedKey];
						} else {
							var sComponentId = oComponentRegistryEntry.oController.createId(oEmbeddedComponentMeta.componentId);
							var oEmbeddedComponentPromise = fnCreateEmbeddedComponent(oComponentRegistryEntry.oAppComponent, sComponentId, oEmbeddedComponentMeta);
							oComponentRegistryEntry.oComponent.registerForDestroy(oEmbeddedComponentPromise);
							aEmbeddedPromises.push(oEmbeddedComponentPromise);
							oEmbeddedComponentPromise.catch(fnLoadError.bind(null, sEmbeddedKey));
							oEmbeddedComponentPromise.then(fnPlaceEmbeddedComponent.bind(null, oComponentRegistryEntry, mReuseComponentProxies, sEmbeddedKey, oEmbeddedComponentMeta));
						}
					}
					Promise.all(aEmbeddedPromises).then(fnReuseComponentsReady, function(oError){
						var oNavigationController = oComponentRegistryEntry.oAppComponent.getNavigationController();
						oNavigationController.navigateToMessagePage({
							text: oComponentRegistryEntry.oTemplateContract.getText("ST_ERROR")                         ,
							description: oError instanceof Error ? oError.message : ""
						});
						fnReject();
					});
				}, fnReject);
			});
			oTreeNode.willBeDisplayed.then(oComponentRegistryEntry.oTemplateContract.oBusyHelper.setBusy.bind(null, oComponentRegistryEntry.reuseComponentsReady, undefined, undefined, true));
			// Make it a synchronous thenable as soon as the prerequisite is fulfilled in order to make sure that this does not modify the order of execution after the page has been initialized.
			oComponentRegistryEntry.reuseComponentsReady.then(function(mReuseComponentProxies){
				oComponentRegistryEntry.reuseComponentsReady = {
					then: function(fnExecute){
						return Promise.resolve(fnExecute(mReuseComponentProxies));
					}
				};
			});
		}

		var TemplateComponent = UIComponent.extend("sap.suite.ui.generic.template.lib.TemplateComponent", {

			metadata: {
				properties: {
					/**
					 * Entity Set
					 */
					entitySet: {
						type: "string",
						defaultValue: null
					},
					/**
					 * Navigation property of the current component
					 */
					navigationProperty: {
						type: "string",
						defaultValue: null
					},
					/**
					 * Instance of AppComponent
					 */
					appComponent: {
						type: "object",
						defaultValue: null
					},
					/**
					 * Refresh required when the component is activated.
					 * Moreover, a new flag 'bWithoutAssociationsRefresh' has been introduced in the TemplateAssembler which takes
					 * care of refreshing the corresponding component without any of its associations. More details about the flag
					 * and expected behaviour of combinations of these two flags can be found within TemplateAssembler's documentation.
					 */
					isRefreshRequired: {
						type: "boolean",
						defaultValue: false
					},
					isLeaf: {
						type: "boolean"
					}
				},
				library: "sap.suite.ui.generic.template"
			},

			init: function() {

				(UIComponent.prototype.init || Function.prototype).apply(this);

				// Creates the public local model (for this page).
				// This model can be used by framework, templates, breakouts and reuse components (write access only permitted for framework and templates) as named model with name ui
				// The following properties are contained in this model:
				// - createMode true, if there exists no active version of the entity instance handled by this page
				// - editable   true, when input fields should be editable. Mainly used on detail pages. Here it is equivalent to the fact
				//                    that a) the page is in edit mode and b) the header data for the page are available
				// - enabled    true, when the controls used for user interaction (such as buttons) should be enabled. This is the case when
				//                    the header data for the page are available.
				// Note that individual controls might have additional conditions that prevent them being enabled resp. editable.
				// All properties are mainly relevant for detail pages.
				// Adding another property to this model would be an architecural decision.
				var oUIModel = new JSONModel({
					editable: false,
					enabled: false
				});
				this.setModel(oUIModel, "ui");
				var oComponentData = this.getComponentData();
				var oComponentRegistryEntry = oComponentData.registryEntry;
				var oTreeNode = oComponentRegistryEntry.oTemplateContract.mRoutingTree[oComponentRegistryEntry.route];

				// Prepare all embeded reuse components. This means:
				// Create a section for the template private model (see below) that contains an entry for each embedded reuse component.
				// Currently these entries only contain one property, namely 'hidden', which can be used to hide the component itself.
				var mEmbeddedComponents = Object.create(null);
				for (var sKey in oTreeNode.embeddedComponents){
					mEmbeddedComponents[sKey] = {
						hidden: !!oTreeNode.embeddedComponents[sKey].definition.hiddenByDefault
					};
				}


				// Creates the private local model for this page. Framework and templates can use it as named model with name _templPriv.
				// The model contains several sections. Section /generic is used by framwork coding.
				// In addition there exist sections /alp, /listReport, and /objectPage used and initialized by the specific templates.
				// Only data used for declarative binding should be stored in this model (same as for the global private model).
				var oTemplatePrivate = new JSONModel({
					generic: {
						isActive: false,  // information, whether the component is currently active
						listCommons : {},			// This subsection contains properties used by list/table-fragments contained in more than one template
													// Up to now it only contains the subsubsection breakoutActionsEnabled being initialized by fnEnhanceTemplPrivForBreakoutActions
													// Note: this subsubsection should be migrated into the more generic controlProperties section denoted below
						viewLevel: oComponentRegistryEntry.viewLevel, // distance of this view to the root (LR/ALP) view in the hierarchy
						controlProperties: {},      // This subsection can be used to determine the properties of arbitrary controls placed on this view
													// Therefore, it maps the (local) id of the control to an object containing the relevant properties
													// Currently this is only used for the enabled property of certain buttons.
						supportedIntents: {},   	// This subsection contains information about possible links for external navigation available on this page
													// The subsection contins a map having the ids of the possible semantic objects as keys. The values in this map are again maps
													// having the possible actions for these semantic objects as keys. Conceptually, this two-level map represents a map that has
													// intents for external navigation as key.
													// The corresponding values are objects with the following properties:
													// - visible: is true, if the corresponding intent should be shown for external navigation.
													//   function fnCheckToolbarIntentsSupported in CommonUtils sets these values on startup
													// - for each table on the page a property is created. This property has as name identifying the table. The value of this property
													//   is an object which contains the boolean property "supported" which indicates, whether external navigation to this intent is
													//   supported for the entries of this table.
													//   Check function displayChevronIfExtNavigationSupported in CommonEventHandlers for more details.
						embeddedComponents: mEmbeddedComponents		// This subsection contains information about the embedded reuse components. The content is a map which has the ids of the reuse components
																	// as keys. The values are objects being initialized above.
																	// Currently only property "hidden" is contained in this object, which can be used by the reuse component to hide itself.
																	// Note that implementing components of the Canvas are not covered by this.
					}
				});

				oTemplatePrivate.setDefaultBindingMode("TwoWay");
				this.setModel(oTemplatePrivate, "_templPriv");
				fnCreateEmbeddedComponents(oComponentRegistryEntry);
			},

			// This method is called by UI5 core to access to the component containing the customizing configuration.
			// as controller extensions are defined in the manifest for the app component and not for the
			// template component we return the app component.
			getExtensionComponent: function() {
				return this.getAppComponent();
			},

			// Monkey Patch for Services & Component Usage
			getManifestEntry: function(sKey) {
				var oValue = UIComponent.prototype.getManifestEntry.apply(this, arguments);
				// special handling for /sap.ui5/componentUsages:
				//   - merges the configuration of the TemplateComponent and the AppComponent (AppComponent wins)
				if (/^\/sap\.ui5\/componentUsages(\/.+)?$/.test(sKey)) {
					oValue = deepExtend({}, oValue, UIComponent.prototype.getManifestEntry.apply(this.getAppComponent(), arguments));
				}
				return oValue;
			},

			// TODO: clarify with Marcel: this.oContainer
			getComponentContainer: function() {
				// TODO: align with UI5 - how to access component container
				return this.oContainer;
			},

			// oComponentRegistryEntry will be provided by TemplateAssembler
			onBeforeRendering: function(oComponentRegistryEntry) {
				// if Component is assembled without TemplateAssembler it could be that oComponentRegistryEntry is undefined
				// e.g. an application has an own implementation of Component
				if (oComponentRegistryEntry){
					var oContainer = oComponentRegistryEntry.oComponent.getComponentContainer();
					var oAppComponent = oComponentRegistryEntry.oAppComponent;
					var oModel = !oComponentRegistryEntry.createViewStarted && oContainer && oContainer.getModel();
					if (oModel && !oComponentRegistryEntry.oComponent.isDestroyed()) {
						var aCacheKeys = CacheHelper.getCacheKeyPartsAsyc(oModel);
						oComponentRegistryEntry.createViewStarted = true;
						var oViewCreationPromise = createXMLView(oComponentRegistryEntry, aCacheKeys);
						var oViewRegisteredPromise = oViewCreationPromise.then(function(oView) {
							oLogger.debug("Creation of view " + oView.getId() + " finished");
							// PERF: Storing the RootExpands in the localStorage for early usage
							if (oComponentRegistryEntry.utils.isDraftEnabled()) {
								var sRootExpand = oComponentRegistryEntry.utils.getRootExpand();
								if (sRootExpand) {
									var sEntitySet = oComponentRegistryEntry.oComponent.getEntitySet();
									CacheHelper.writeToLocalStorageAsync(oAppComponent.getId(), sEntitySet, aCacheKeys, sRootExpand);
								}
							}
							if (!oComponentRegistryEntry.oComponent.isDestroyed()){
								oComponentRegistryEntry.oComponent.setAggregation("rootControl", oView);
								oComponentRegistryEntry.fnViewRegisteredResolve();
								oContainer.invalidate();
							}
							return oView;
						});
						oViewCreationPromise.catch(function(oError){
							if (!oComponentRegistryEntry.oComponent.isDestroyed()){
								oComponentRegistryEntry.fnViewRegisteredResolve(oError || {});
							}
						});
						oComponentRegistryEntry.oComponent.registerForDestroy(oViewRegisteredPromise); // ensure that the view is destroye when the Component is destroyed
					}
				}
			},

			// Overwrite method of UIComponent
			getRouter: function() {
				if (this.getAppComponent()) {
					return this.getAppComponent().getRouter();
				}
				return UIComponent.prototype.getRouter.apply(this, arguments);
			}

		});
		return TemplateComponent;

	});
