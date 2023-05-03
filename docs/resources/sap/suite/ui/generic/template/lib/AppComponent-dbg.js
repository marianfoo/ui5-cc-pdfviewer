/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// ----------------------------------------------------------------------------------
// This abstract class is used as common base class for all Components implementing a Smart Template based application.
// More precisely, when generating a project for a Smart Template based App a subclass of this class is generated as root component for the project.
//
// An instance of this class represents the Smart Template Application as a whole. Note that this instance is accessible for Template developers, for Break-out developers and even for external tools (e.g. Co-pilot).
// Therefore, the set of (public) methods is reduced to a minimum.
// Note that there are two other instances that represent the application as a whole:
// - the TemplateContract is responsible for data interchange between objects on framework level. Note that no class has been modeled for the TemplateContract.
//   See documentation below for more information about TemplateContract.
// - the Application (instance of sap.suite.ui.generic.template.lib.Application) represents the App for Template developers.
//
// Note that there are additional helper classes which are instantiated once per App (during startup of this class):
// - sap.ui.generic.app.ApplicationController from Denver layer
// - NavigationController, BusyHelper, ViewDependencyHelper from namespace sap.suite.ui.generic.template.lib
// -----------------------------------------------------------------------------------------------------------------------------------------------------------------
sap.ui.define([
	"sap/base/util/extend",
	"sap/base/util/isPlainObject",
	"sap/m/NavContainer",
	"sap/f/FlexibleColumnLayout",
	"sap/ui/core/UIComponent",
	"sap/ui/model/base/ManagedObjectModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/MessageScope",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/generic/app/ApplicationController",
	"sap/suite/ui/generic/template/genericUtilities/ProcessObserver",
	"sap/suite/ui/generic/template/lib/Application",
	"sap/suite/ui/generic/template/lib/BusyHelper",
	"sap/suite/ui/generic/template/lib/DataLossHandler",
	"sap/suite/ui/generic/template/lib/navigation/NavigationController",
	"sap/suite/ui/generic/template/lib/TemplateAssembler",
	"sap/suite/ui/generic/template/lib/CRUDHelper",
	"sap/suite/ui/generic/template/lib/ViewDependencyHelper",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/support/lib/CommonMethods",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/lib/navigation/startupParameterHelper",
	"sap/suite/ui/generic/template/lib/PageLeaveHandler",
	"sap/suite/ui/generic/template/lib/ShareUtils",
	"sap/suite/ui/commons/collaboration/CollaborationHelper"
], function(
	extend, 
	isPlainObject,
	NavContainer,
	FlexibleColumnLayout,
	UIComponent,
	ManagedObjectModel,
	Filter,
	FilterOperator,
	JSONModel,
	MessageScope,
	ResourceModel,
	ApplicationController,
	ProcessObserver,
	Application,
	BusyHelper,
	DataLossHandler,
	NavigationController,
	TemplateAssembler,
	CRUDHelper,
	ViewDependencyHelper,
	testableHelper,
	CommonMethods,
	FeLogger,
	startupParameterHelper,
	PageLeaveHandler,
	ShareUtils,
	CollaborationHelper) {
	"use strict";
	var	sClassName = "lib.AppComponent";

	var oLogger = new FeLogger(sClassName).getLogger();
	ApplicationController = testableHelper.observableConstructor(ApplicationController); // make the constructor accessible for unit tests

	var DraftIndicatorState = sap.m.DraftIndicatorState; // namespace cannot be imported by sap.ui.define

	var fnRegisterAppComponent = TemplateAssembler.getRegisterAppComponent(); // Retrieve the possibility to register at TemplateAssembler
	var bShellConfigPlaceholderEnabled = true; 
	if (window["sap-ushell-config"] && window["sap-ushell-config"].apps && window["sap-ushell-config"].apps.placeholder) {
		bShellConfigPlaceholderEnabled =  window["sap-ushell-config"].apps.placeholder.enabled;
	}

	var oRB; // initialized on demand
	function getText() { // static method used to read texts from the i18n-file in the lib folder. Should only be used when no view is available.
		oRB = oRB || new ResourceModel({
			bundleName: "sap/suite/ui/generic/template/lib/i18n/i18n"
		}).getResourceBundle();
		return oRB.getText.apply(oRB, arguments);
	}

	function compoundObserver(){
		return new ProcessObserver({ processObservers: [] });
	}

	var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();
	var oValidationMessageFilter = new Filter({
		path: "validation",
		operator: FilterOperator.EQ,
		value1: true
	});

	// "Constructor": oAppComponent is the instance to be created. oAppId is an id provided by the testableHelper that can be used to end the productive mode
	function getMethods(oAppComponent, oAppId) {

		var fnLeaveAppResolve;
		var	oTemplateContract = { // template contract object which is used for data interchange between framework classes
			oAppComponent: oAppComponent,
			leaveAppPromise: Promise.resolve(),	// promise which is resolved once the user leaves the component
			ghostapp: (function(){
				var oGenericAppManifest = oAppComponent.getManifestEntry("sap.ui.generic.app"); // in edge cases not available at this point in time -> no ghost app
				return !!(oGenericAppManifest && oGenericAppManifest.settings && oGenericAppManifest.settings.ghostapp);
			})(), // if this is true, this app should not interfere with the environment
			componentRegistry: Object.create(null),	// registry for all TemplateComponents instantiated in the context of this App
													// maps the ids of these components on an object (called registry entry)
													// The registry entries are instantiated in function fnCreateTemplateComponent of NavigationController
													// They are inserted into the registry in method setContainer of TemplateComponent,
													// which can actually be found in TemplateAssembler
													// See documentation of function getComponentRegistryEntry in TemplateAssembler for the structure of the
													// registry entries
			aRunningSideEffectExecutions: [], // an array containing Promises for running side-effect executions
			getText: getText,
			oTemplatePrivateGlobalModel: (new JSONModel()).setDefaultBindingMode("TwoWay"), // a global model that can be used for declarative binding
			                                                                                // in the whole App as named model _templPrivGlobal.
			                                                                                // In function setGlobalTemplateModels it gets initial data
			                                                                                // and is attached to oAppComponent
			aStateChangers: [], // an array of agents that modify the url in order to store their state
			                   // a state changer can be added via Application.registerStateChanger.
			oPaginatorInfo: Object.create(null),	// Maps view levels onto paginator info objects that describe the paginator info
													// that is provided for the follow-up page.
													// The paginator objects are set in function storeObjectPageNavigationRelatedInformation of CommonEventHandlers.
													// Class sap.suite.ui.generic.template.detailTemplates.PaginatorButtonsHelper evaluates (and modifies) the content.
													// Function fnAdaptPaginatorInfoAfterNavigation of NavigationController does a cleanup of the content.
			oStatePreserversAvailablePromise: Promise.resolve(),	// a Promise that is resolved when all StatePreservers that are needed on the currently active pages are available
																	// Will be updated in ComponentUtils.setStatePreserverPromise
			oValidationMessageBinding: oMessageModel.bindList("/", null, null, oValidationMessageFilter), // a list binding that filters all validation messages
			mBusyTopics: Object.create(null), // This map is used by an infrastructure which allows to add functionality to busy sessions is a generic way.
			                                  // Each functionality must be identified by a "topic" (technically a string) which serves as key in this map.
			                                  // The corresponding value (the topic definition) is an object which specifies the functionality in more detail.
			                                  // More precisely the topic definition contains the following properties:
			                                  // # getBeforeData: An optional function that will be called at the beginning of each busy session. The value returned by this
			                                  //                  function will be passed to oneTimer resp. fallback (see below) as parameter oBeforeData at the end of the busy session.
			                                  // # fallback: An optional function(oBeforeData) that will be called at the end of each busy session when no oneTimer (see below)
			                                  //             is available.
			                                  // # oneTimer: An optional function(oBeforeData, fnFallback) that will be called at the end of a busy session. Afterwards it will
			                                  //             be removed from the topic definition. Hence, the code that uses this infrastructur has to add this property again (if needed).
			                                  //             Parameter fnFallback will be the fallback function (see above) with oBeforeData already set accordingly.
			                                  // Currently this infrastructure is used by one topic (namely 'focus', see class FocusHelper).
			                                  // The implementation of this infrastructure is done in class BusyHelper.
			bEnablePlaceholder: bShellConfigPlaceholderEnabled, //holds the value of placeholder enablement shell and URL
			bStateHandlingSuspended: false // holds the RTA or Key user mode
		};
		oTemplateContract.oDataLossHandler = new DataLossHandler(oTemplateContract); // an object which expose methods that can be used to bring data loss popup at app level
		oTemplateContract.oPageLeaveHandler = new PageLeaveHandler(oTemplateContract);
					
		// the following additional properties are added to TemplateContract later:
		// - appSettings a model representing the settings of the app (by function init()). These settings are derived from the settings section in the manifest, but also take in account the defaults.
		// - oBusyHelper (instance of BusyHelper) by function createContent
		// - fnAddSideEffectPromise function to add a promise indicating running side effects
		// - oNavigationHost (the navigation control hosting the App) by function createContent
		// - oNavigationControllerProxy an instance providing access to some internal methods of the NavigationController.
		//   It is added in the constructor of the NavigationController.
		// - function createContent adds several instances and arrays of class ProcessObserver, namely:
		//   # oNavigationObserver observes whether any navigation is currently running
		//   # aNavigationObservers only available if App runs in FCL. Contains an observer for each column.
		//   # oHeaderLoadingObserver observes whether any header data are currently loaded. It is started and stopped in ComponentUtils.
		//   # aHeaderLoadingObservers only available if App runs in FCL. Contains an observer for each column.
		//   # oPagesDataLoadedObserver observes whether header data are currently loaded or a navigation is currently running.
		// - oApplicationProxy an 'interface' provided by Application for the framework classes. It is added in the constructor of Application.
		// - oShellServicePromise a Promise that resolves to the ShellService. Added in init().
		//   Note that the following methods of the ShellService are used: setTitle, setBackNavigation, and setHierarchy.
		// - oViewDependencyHelper helper class for refreshing view content. Added in init().
		// - bCreateRequestsCanonical flag whether we need to ensure that requests are shortened to the canonical path. Added in init().
		// - mEntityTree and mRoutingTree are two maps which are initialized (generateRoutingMetadataAndGetRootEntitySet) and filled (function createRoutes) by the routingHelper,
		//   while creating the routes.
		//   They map the names of the entity sets resp. the routes onto objects (called TreeNodes) containing metadata about the target of the route for the entitySet.
		//   Note that mRoutingTree contains one entry which is not contained in mEntityTree, namely the entry for the root-route.
		//   A Treenode contains the following properties:
		//   # sRouteName: name of the route (as published to the UI5 router) -> key for mRoutingTree
		//   # page: the corresponding page section of the manifest
		//   # willBeDisplayed: A Promise that is resolved the page is going to be displayed fore the first time
		//   # display: A function to be called before the page is shown (resolves the willBeDisplayed Promise)
		//   # componentCreated: a Promise that resolves to the TemplateComponent realizing this TreeNode
		//   # componentCreatedResolve: function that resolves to the Promise above. Will be deleted after it has been called and replaced by:
		//   # componentId: Id of the TemplateComponent realizing this TreeNode, as soon as this component exists.
		//   # getPath: a function(iMode, aKeys) which returns a path needed in this view (for the root always an empty string is returned)
		//     iMode might have the following values:
		//     * 1: return the pattern which is used in the definition of the route
		//     * 2: return the binding path which is used to bind the component
		//     * 3: return the canonical path for the component (identical to the case 2, if bCreateRequestsCanonical is true)
		//     aKeys is optional. If it is faulty the result still contains the placeholders for the keys {key<n>}). Otherwise they are replaced.
		//   # parentRoute: name of the route of the parent page (if existing)
		//   # level: hierarchy level
		//   # fCLLevel: Determines in FCL cases, in which column the corresponding view will be displayed:
		//     0, 1, 2 correspond to begin, mid, and end column. 3 corresponds to end column with no FCL action buttons
		//   # defaultLayoutType: Only for FCL: an optional layout type which overrules the default from the FCL settings
		//   # children: array containing the names of the child entity sets
		//   # navigationProperty: Navigation property leading to this entity set (if existing)
		//   # entitySet: The entity set for this TreeNode -> key for  mEntityTree
		//     Note: In case the node is defined with a routingSpec the routeName contained in this routingSpec is used as (virtual) entitySet.
		//           Moreover, if hierarchy level is at least 2, the same value is also set as (virtual) navigationProperty.
		//           This is prepared by function fnNormalizeRoutingInformation in this class.
		//   # parent: name of parent entity set, if existing
		//   # embeddedComponents, leadingComponents, facetsWithEmbeddedComponents: Maps that map the ids of the embedded reuse components (resp. the facet id that contains the reuse component) defined on the corresponding page onto some metadata of these reuse components.
		//     These properties are filled in function fnHandleEmbeddedComponents.
		//   # parentEmbeddedComponent: If the TreeNode is (directly) contained in an embedded component this property contains the id of this embedded component
		//     (the id is 'implementation' for the implementing component of a canvas page). Otherwise the property is faulty.
		//   # communicationObject: For pages which are embedded via reuse components: An object which can be used for communication with other pages
		//     This object can be retrieved via method getCommunicationObject of class Application.
		//     Note that the communication object will be left empty for all TreeNodes which are not (directly or indirectly) added via a reuse component.
		//     Instance variable oGlobalObject of class Application is used for this. It is initialized on demand.
		//   # noOData: information, whether the entitySet is virtual
		//   # entitySetDefinition/entityTypeDefinition: Link to definition of entity set and entity type in the metamodel. Only available if entitySet is not virtual.
		//   # noKey: true, if this page does not require additional key information compared to its parent page
		//   # isDraft: information, whether this page is draft aware
		//   # semanticObject: Information of the sematicObject of the entitySet
		//   # headerTitle: Title of the corresponding page
		//   # titleIconUrl: url for the title icon of the corresponding page
		//   # specificModelName: global model name which points to the OData model but for which binding context is pointing to the object (implicitly or explicitly) shown on the corresponding page
		//   # bindElement: function(oElement, sBindingPath, bForSpecificModel, oEvents) which binds a given control to a given binding path
		//     for either the global model specified above or the default model. Events may be passed.
		//     Expands needed for this page are used as far as currently known.
		//   # unbindElement: function(oElement, bForSpecificModel)
		//     unbinding elements which have been bound by bindElement
		//   See fnPrepareModelSupportForTreeNode in class routingHelper for more details on bind/unbindElement
		//   The following properties of oTreeNode are set and modified during the runtime of the app
		//   # selectionInfo: Information about the the last child page instance of this page. It is set by fnUpdateParentModelsWithContext in class NavigationController.
		//   # text: display text for the the object (implicitly or explicitly) shown on the corresponding page, if different from headerTitle. Set by function setTextForTreeNode in class NavigationController
		// - oFlexibleColumnLayoutHandler (instance of FlexibleColumnLayoutHandler) only available if App runs in FCL. Added by function fnStartupRouter of routingHelper.

		oTemplateContract.oValidationMessageBinding.attachChange(Function.prototype); // initialization step required by UI5

		var oApplicationController; // instance of sap.ui.generic.app.ApplicationController
		var oNavigationController; // instance of NavigationController
		var fnDeregister; // function to be called to deregister at TemplateContract

		// Begin: Private helper methods called in init

		// This function instantiates the global private model that can be used as named model with name  _templPrivGlobal in all views and fragments.
		// Note: Only data which is shared across more than one page should be stored in this model.
		// Data which is used on one page only should be stored in the private model of the corresponding component.
		// Moreover, only data used for declarative binding should be stored in this model.
		// Data which is global, but is only needed in javascript coding, should be stored either in oTemplateContract or as instance variable in one
		// of the global helper classes (e.g. Application).
		// The content of this model may contain several 'sections'. The section with path '/generic' is already instantiated here.
		// Currently it is the only section being used.
		// The generic section contains the three parameters found below. Moreover, it contains two subsections, namely:
		// - FCL: only used in case the App runs in FCL. In this case the FlexibleColumnLayoutHandler instantiates and maintains this subsection
		// - messagePage: is used to control the MessagePage. It is set on demand by the NavigationController.
		// Moreover, this function attaches the ui5 message model as named model to the AppComponent with name _templPrivMessage
		function setGlobalTemplateModels(){
			var oParsingService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("URLParsing");
			oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic", {
					// Since draft saving is done globally, there is a global state which applies to all DraftIndicators
					draftIndicatorState: DraftIndicatorState.Clear,
					// if the ShellService is unavailable some of its tasks have to be done by ourselves. Assume that this is not the case.
					shellServiceUnavailable: false,
					// experimental: not yet used
					forceFullscreenCreate: false
			});
			oAppComponent.setModel(oTemplateContract.oTemplatePrivateGlobalModel, "_templPrivGlobal");
			oTemplateContract.oShellServicePromise.catch(function(){
				// it turns out that the ShellService is not available
				oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/shellServiceUnavailable", true);
			});
			var oCurrentUrlPromise = ShareUtils.getCurrentUrl();
			oCurrentUrlPromise.then(function(sURL) {
				// information whether cross app navigation is supported
				var oIsIntentUrlPromise = oParsingService && oParsingService.isIntentUrlAsync(sURL);
				if (oIsIntentUrlPromise){
					oIsIntentUrlPromise.then(function(bIsIntentUrlResponse){
						oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/crossAppNavSupport", bIsIntentUrlResponse);
					});
				} else {
					oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/crossAppNavSupport", false);
				}		
			}); 
			CollaborationHelper.isTeamsModeActive().then(function(bIsActive) {
                oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/isTeamsModeActive", bIsActive);
            });
			// Below code to check if Share MenuButton is visible from feEnvironment.getShareControlVisibility
			oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/shareControlVisibility", fnGetShareControlVisibility());
			var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();
			oAppComponent.setModel(oMessageModel, "_templPrivMessage");
		}

		function fnGetShareControlVisibility() {
			var oComponentData = oAppComponent.getComponentData();
			return !(oComponentData && oComponentData.feEnvironment && oComponentData.feEnvironment.getShareControlVisibility) ||
				oComponentData.feEnvironment.getShareControlVisibility();
		}

		function attachToApplicationController() {
			oTemplateContract.fnAddSideEffectPromise = function(oPromise){
				var i = 0;
				for (; oTemplateContract.aRunningSideEffectExecutions[i]; ){
					i++;
				}
				oTemplateContract.aRunningSideEffectExecutions[i] = oPromise;
				var fnRemovePromise = function(){
					oTemplateContract.aRunningSideEffectExecutions[i] = null;
				};
				oPromise.then(fnRemovePromise, fnRemovePromise);
			};

			oApplicationController.attachEvent("beforeSideEffectExecution", function (oEvent) {
				oTemplateContract.fnAddSideEffectPromise(oEvent.getParameter("promise"));
			});

			var oTemplatePrivateGlobal = oAppComponent.getModel("_templPrivGlobal");
			var sDraftIndicatorState = "/generic/draftIndicatorState";

			oApplicationController.attachBeforeQueueItemProcess(function (oEvent) {
				if (oEvent.draftSave) {
					oTemplatePrivateGlobal.setProperty(sDraftIndicatorState, DraftIndicatorState.Saving);
				}
			});
			oApplicationController.attachOnQueueCompleted(function () {
				if (oTemplatePrivateGlobal.getProperty(sDraftIndicatorState) === DraftIndicatorState.Saving) {
					oTemplatePrivateGlobal.setProperty(sDraftIndicatorState, DraftIndicatorState.Saved);
				}
			});
			oApplicationController.attachOnQueueFailed(function () {
				if (oTemplatePrivateGlobal.getProperty(sDraftIndicatorState) === DraftIndicatorState.Saving) {
					oTemplatePrivateGlobal.setProperty(sDraftIndicatorState, DraftIndicatorState.Clear);
				}
			});

			oTemplatePrivateGlobal.setProperty("/generic/appComponentName", oAppComponent.getMetadata().getComponentName());
		}

		// End private helper methods called in init

		// Begin: Implementation of standard lifecycle methods

		function init(){
			// redirect app with shorten URL to actual URL. Method returns promise and 
			// and resolved when redirection to full URL is complete.
			// If already full URL then it resolved immediately without any redirection. 
			var oExpandHashPromise = CollaborationHelper.processAndExpandHash();
			var sAppComponentId =  oAppComponent.getId();
			oLogger.info("Init called for AppComponent " + sAppComponentId);
			var oAppRegistryEntry = {
				appComponent: oAppComponent,
				oTemplateContract: oTemplateContract,
				application: new Application(oTemplateContract),
				oViewDependencyHelper: new ViewDependencyHelper(oTemplateContract)
			};
			oTemplateContract.oViewDependencyHelper = oAppRegistryEntry.oViewDependencyHelper;
			oTemplateContract.oShellServicePromise = oAppComponent.getService("ShellUIService").catch(function(){
				// fallback to old generic logic if service is not defined in manifest
				var oShellServiceFactory = sap.ui.core.service.ServiceFactoryRegistry.get("sap.ushell.ui5service.ShellUIService");
				return ((oShellServiceFactory && oShellServiceFactory.createInstance()) || Promise.reject());
			});
			oTemplateContract.oShellServicePromise.catch(function(){
				oLogger.warning("No ShellService available");
			});
			var mSettings = getConfig().settings;
			if (mSettings && mSettings.hasOwnProperty("ghostapp")){ // ghostapp information has already be passed to TemplateContract
				mSettings = extend({}, mSettings);     // but should not be passed as an "official" setting
				delete mSettings.ghostapp;
			} else {
				 mSettings = mSettings || Object.create(null);	
			}
			oAppComponent.applySettings(mSettings);
			(UIComponent.prototype.init || Function.prototype).apply(oAppComponent, arguments);
			oTemplateContract.appSettings = new ManagedObjectModel(oAppComponent);
			oTemplateContract.oBusyHelper.setBusy(oTemplateContract.oShellServicePromise, undefined, undefined, true);
			fnDeregister = fnRegisterAppComponent(oAppRegistryEntry);

			var oModel = oAppComponent.getModel();
			oTemplateContract.bCreateRequestsCanonical = true;
			var oMessageScopeSupportedPromise = oModel.messageScopeSupported();
			oTemplateContract.oBusyHelper.setBusy(oMessageScopeSupportedPromise, undefined, undefined, true);
			oTemplateContract.oBusyHelper.setBusy(oExpandHashPromise, undefined, undefined, true);
			Promise.all([oExpandHashPromise,oMessageScopeSupportedPromise]).then(function(aResolvedPromiseValue){
				var bMessageScopeSupported = aResolvedPromiseValue[1];
				if (bMessageScopeSupported){
					oModel.setPersistTechnicalMessages(true);
					oModel.setMessageScope(MessageScope.BusinessObject);
					oTemplateContract.bCreateRequestsCanonical = false; // in this scenario the creation of the canonical requests will be done by the model
				}
				// workaround until Modules Factory is available
				oApplicationController = new ApplicationController(oModel);
				setGlobalTemplateModels();
				oNavigationController = new NavigationController(oTemplateContract);

				attachToApplicationController();
				CRUDHelper.enableAutomaticDraftSaving(oTemplateContract);

				// Error handling for erroneous metadata request
				// TODO replace access to oModel.oMetadata with official API call when available (recheck after 03.2016)
				// TODO move error handling to central place (e.g. create new MessageUtil.js)
				if ( (!oModel.oMetadata || !oModel.oMetadata.isLoaded()) || oModel.oMetadata.isFailed()) {
					oModel.attachMetadataFailed(function() {
						oNavigationController.navigateToMessagePage({
							title: getText("ST_GENERIC_ERROR_TITLE"),
							text: getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE"),
							icon: "sap-icon://message-error",
							description: getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE_DESC")
						});
						/* When the application's OData service's metadata document
						 * can't be retrieved or loaded, then none of children components
						 * can load. It is therefore important to look through those components
						 * and resolve their promises to register themselves with a view. */
						for (var childComponent in oTemplateContract.componentRegistry) {
							oTemplateContract.componentRegistry[childComponent].fnViewRegisteredResolve(true);
						}
					});
				}

				// busy handling for Diagnostics Plugin
				if (oAppComponent && oAppComponent.getMetadata() && oAppComponent.getMetadata().getManifest()) {
					// Set component id to allow access to manifest even when app does not load successfully.
					CommonMethods.setAppComponent(oAppComponent);
				}
				// Application status needs to be handled here to support use cases where Diagnostics Tool gets loaded after the app itself.
				CommonMethods.setApplicationStatus(CommonMethods.mApplicationStatus.LOADING);
				// Publish event on global event bus which will trigger Diagnostics Tool plugin when plugin is loaded.
				// When plugin is not loaded already, it will check the application status at initialisation.
				CommonMethods.publishEvent("elements", "ViewRenderingStarted", {});

				// data loss popup by consuming shell service
				var oUshellContainer = sap.ushell && sap.ushell.Container;
				if (oUshellContainer) {
					oUshellContainer.registerDirtyStateProvider(fnGetShellDataLossPopup);
				}
			});
			setLeaveAppPromise();
			oLogger.info("Init done for AppComponent " + sAppComponentId);
		}

		function createContent(){
			// Method must only be called once
			if (oTemplateContract.oNavigationHost){
				return "";
			}
			if (oAppComponent.getFlexibleColumnLayout()){
				var oFCL = new FlexibleColumnLayout();
				oTemplateContract.oNavigationHost = oFCL;
				oTemplateContract.aNavigationObservers = [
					new ProcessObserver({
						processName: "BeginColumnNavigation",
						eventHandlers: {
							attachProcessStart: oFCL.attachBeginColumnNavigate.bind(oFCL),
							attachProcessStop: oFCL.attachAfterBeginColumnNavigate.bind(oFCL)
					}}),
					new ProcessObserver({
						processName: "MidColumnNavigation",
						eventHandlers: {
							attachProcessStart: oFCL.attachMidColumnNavigate.bind(oFCL),
							attachProcessStop: oFCL.attachAfterMidColumnNavigate.bind(oFCL)
					}}), new ProcessObserver({
						processName: "EndColumnNavigation",
						eventHandlers: {
							attachProcessStart: oFCL.attachEndColumnNavigate.bind(oFCL),
							attachProcessStop: oFCL.attachAfterEndColumnNavigate.bind(oFCL)
					}})
				];
				oTemplateContract.oNavigationObserver = new ProcessObserver({
					processObservers: oTemplateContract.aNavigationObservers
				});
				oTemplateContract.aHeaderLoadingObservers = [compoundObserver(), compoundObserver(), compoundObserver()];
			} else {
				var oNavContainer = new NavContainer({
					id: oAppComponent.getId() + "-appContent"
				});
				oTemplateContract.oNavigationHost = oNavContainer;
				oTemplateContract.oNavigationObserver = new ProcessObserver({
					processName: "Navigation",
					eventHandlers: {
						attachProcessStart: oNavContainer.attachNavigate.bind(oNavContainer),
						attachProcessStop: oNavContainer.attachAfterNavigate.bind(oNavContainer)
				}});
			}
			oTemplateContract.oHeaderLoadingObserver = new ProcessObserver({
				processObservers: oTemplateContract.aHeaderLoadingObservers || []
			});
			oTemplateContract.oPagesDataLoadedObserver = new ProcessObserver({
				processObservers: [oTemplateContract.oHeaderLoadingObserver, oTemplateContract.oNavigationObserver]
			});
			oTemplateContract.oNavigationHost.addStyleClass(oTemplateContract.oApplicationProxy.getContentDensityClass());
			oTemplateContract.oBusyHelper = new BusyHelper(oTemplateContract);
			oTemplateContract.oBusyHelper.setBusyReason("HashChange", true, true, undefined, true);
			oTemplateContract.oBusyHelper.getUnbusy().then(function(){
				oTemplateContract.oShellServicePromise.then(function(oShellService){
					oShellService.setBackNavigation(oTemplateContract.oApplicationProxy.onBackButtonPressed);
				});
			});
			return oTemplateContract.oNavigationHost;
		}
		
		function fnLeave(){
			for (var sComponentId in oTemplateContract.componentRegistry){
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				oRegistryEntry.utils.leaveApp(false);
			}
		}

		function exit() {
			oTemplateContract.oNavigationControllerProxy && oTemplateContract.oNavigationControllerProxy.leave();
			var sAppComponentId =  oAppComponent.getId();
			oLogger.info("Exit called for AppComponent " + sAppComponentId);
			var oUshellContainer = sap.ushell && sap.ushell.Container;
			if (oUshellContainer) {
				oUshellContainer.deregisterDirtyStateProvider(fnGetShellDataLossPopup);
			}
			oTemplateContract.ghostapp = true; // the component should not perform any actions after being exited
			if (oTemplateContract.oNavigationHost) {
				oTemplateContract.oNavigationHost.destroy();
			}
			if (oApplicationController) {
				oApplicationController.destroy();
			}
			if (oNavigationController) {
				oNavigationController.destroy();
			}
			if (oTemplateContract.oValidationMessageBinding){
				oTemplateContract.oValidationMessageBinding.destroy();
			}
			CommonMethods.setAppComponent(null);
			(UIComponent.prototype.exit || Function.prototype).apply(oAppComponent, arguments);
			fnDeregister();
			testableHelper.endApp(oAppId); // end of productive App
			/* In some scenarios, exit event is trigerred from FLP for app which is suspended in keep-alive mode. Since we have set
			fnLeaveAppResolve to null in the suspend event, we should check for the function existence before calling it. */
			if (fnLeaveAppResolve) {
				fnLeaveAppResolve();
			}
			oLogger.info("Exit done for AppComponent " + sAppComponentId);
		}

		function suspend(){
			for (var sComponentId in oTemplateContract.componentRegistry){
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				if (oRegistryEntry.methods.onSuspend) {
					oRegistryEntry.methods.onSuspend();
				}
			}
			fnLeave();
			var oUshellContainer = sap.ushell && sap.ushell.Container;
			if (oUshellContainer) {
				oUshellContainer.deregisterDirtyStateProvider(fnGetShellDataLossPopup);
			}
			oTemplateContract.ghostapp = true;
			oTemplateContract.aStateChangers.forEach(function(oStateChanger){
				oStateChanger.leaveApp();                         
			});
			oTemplateContract.oNavigationControllerProxy && oTemplateContract.oNavigationControllerProxy.suspend();
			fnLeaveAppResolve();
			fnLeaveAppResolve = null;
		}

		function restore(){
			oTemplateContract.oBusyHelper.setBusyReason("exiting", false);
			for (var sComponentId in oTemplateContract.componentRegistry){
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				if (oRegistryEntry.methods.onRestore) {
					oRegistryEntry.methods.onRestore();
				}
			}
			setLeaveAppPromise();
			var oUshellContainer = sap.ushell && sap.ushell.Container;
			if (oUshellContainer) {
				oUshellContainer.registerDirtyStateProvider(fnGetShellDataLossPopup);
			}
			oTemplateContract.ghostapp = false;
			oTemplateContract.oNavigationControllerProxy.restore();
		}

		// End: Implementation of standard lifecycle methods

		function setLeaveAppPromise() {
			oTemplateContract.leaveAppPromise = new Promise(function(fnResolve) {
				fnLeaveAppResolve = fnResolve;
			});
		}

		function pagesMap2Array(input) {
			var output = Object.keys(input).map(function(key) {
				var page = input[key];
				//add the key to the array for reference
				//page["id"] = key;
				//Recursive call for nested pages
				if (page.pages) {
					page.pages = pagesMap2Array(page.pages);
				}
				return input[key];
			});
			return output;
		}

		function fnNormalizePagesMapToArray(oConfig){
			// The pages object can have two possible structures: array (historic) or object (current).
			// Although the object version is preferable from the perspective of manifest changes we internally still rely on the array structure.
			// Therefore, we do the transformation into an array if it is actually an object.
			if (oConfig.pages && isPlainObject(oConfig.pages)) {
				oConfig.pages = (oConfig.pages && isPlainObject(oConfig.pages)) ? pagesMap2Array(oConfig.pages) : oConfig.pages;
			}
		}

		// This is a temporary solution. It maps routing information onto 'virtual OData information', since the implementation currently
		// derives routing information only from OData information.
		function fnNormalizeRoutingInformation(aPages, iLevel){
			if (!aPages){
				return;
			}
			for (var i = 0; i < aPages.length; i++){
				var oPage = aPages[i];
				if (oPage.routingSpec && oPage.routingSpec.noOData){
					oPage.entitySet = oPage.routingSpec.routeName;
					if (iLevel > 1){
						oPage.navigationProperty = oPage.routingSpec.routeName;
					}
				}
				fnNormalizeRoutingInformation(oPage.pages, iLevel + 1);
				if (oPage.embeddedComponents){
					for (var sComponentId in oPage.embeddedComponents){
						var oEmbeddedComponent = oPage.embeddedComponents[sComponentId];
						if (oEmbeddedComponent.pages){
							oEmbeddedComponent.pages = pagesMap2Array(oEmbeddedComponent.pages);
							fnNormalizeRoutingInformation(oEmbeddedComponent.pages, iLevel + 1);
						}
					}
				}
				if (oPage.implementingComponent && oPage.implementingComponent.pages){
					oPage.implementingComponent.pages = pagesMap2Array(oPage.implementingComponent.pages);
					fnNormalizeRoutingInformation(oPage.implementingComponent.pages, iLevel + 1);
				}
			}
		}

		function fnNormalizeRouting(oConfig){
			fnNormalizeRoutingInformation(oConfig.pages, 0);
		}

		function fnAddMissingEntitySetsToQuickVariantSelectionX(oPage) {
			if (oPage) {
				var sLeadingEntitySet = oPage.entitySet;
				var oVariants = (oPage.component && oPage.component.settings && oPage.component.settings.quickVariantSelectionX && oPage.component.settings.quickVariantSelectionX.variants) || {};
				var isDifferentEntitySets = function(oVariants) {
					for (var sKey in oVariants) {
						var oVariant = oVariants[sKey];
						if (oVariant.entitySet) {
							return true;
						}
					}
					return false;
				};
				if (isDifferentEntitySets(oVariants)) {
					for (var sKey in oVariants) {
						var oVariant = oVariants[sKey];
						if (oVariant.entitySet === undefined) {
							oVariant.entitySet = sLeadingEntitySet;
						}
					}
				}
			}
		}

		function fnNormalizeQuickVariantSelectionXEntitySets(oConfig){
			fnAddMissingEntitySetsToQuickVariantSelectionX(oConfig.pages[0]);
		}

		// handling of deprecated properties which are still supported for compatibility reasons
		function fnNormalizeSettings(oSettings){
			if (oSettings && oSettings.objectPageDynamicHeaderTitleWithVM){
				oSettings.objectPageHeaderType = oSettings.objectPageHeaderType || "Dynamic";
				oSettings.objectPageVariantManagement = oSettings.objectPageVariantManagement || "VendorLayer";
			}
		}

		var oConfig; // initialized on demand
		function getConfig() {
			if (!oConfig) {
				var oMeta = oAppComponent.getMetadata();
				oConfig = oMeta.getManifestEntry("sap.ui.generic.app");
				if (!oConfig){ // test scenario
					return Object.create(null);
				}

				fnNormalizePagesMapToArray(oConfig);
				fnNormalizeRouting(oConfig);
				fnNormalizeQuickVariantSelectionXEntitySets(oConfig);
				fnNormalizeSettings(oConfig.settings);

			}
			return oConfig;
		}

		var oInternalManifest;  // initialized on demand
		function getInternalManifest() {
			if (!oInternalManifest) {
				//We need to copy the original manifest due to read-only settings of the object
				oInternalManifest = extend({}, oAppComponent.getMetadata().getManifest());
				//Overwrite the part with our app. descriptor (see getConfig)
				oInternalManifest["sap.ui.generic.app"] = getConfig();
			}
			return oInternalManifest;
		}

		// Overriding private method _getRouterClassName of Component. We do not want to have router class derived from manifest settings, but derive it
		// from whether we use FCL or not.
		function getRouterClassName(){
			var sRoutingType = oAppComponent.getFlexibleColumnLayout() ? "f" : "m";
			return "sap." + sRoutingType + ".routing.Router";
		}

		function fnGetShellDataLossPopup(oShellContext) {
			return !oTemplateContract.ghostapp && oTemplateContract.oDataLossHandler.getShellDataLossPopup(oShellContext);
		}

		function uiAdaptationStarted() {
			oTemplateContract.bStateHandlingSuspended = true;
		}

		function uiAdaptationStopped() {
			oTemplateContract.bStateHandlingSuspended = false;
		}
		
		var oNextStartupParameters; // next target for function navigateBasedOnStartupParameter

		var oMethods = {
			/**
			 * 
			 * @private
			 */
			init: init,
			/**
			 * 
			 * @private
			 */
			createContent: createContent,
			/**
			 * 
			 * @private
			 */
			exit: exit,
			/**
			 * 
			 * @private
			 */
			suspend: suspend,
			/**
			 * 
			 * @private
			 */
			restore: restore,
			/**
			 * 
			 * @private
			 */
			_getRouterClassName: getRouterClassName,
			/**
			 * 
			 * @private
			 */
			getConfig: getConfig,
			/**
			 * 
			 * @private
			 */
			getInternalManifest: getInternalManifest,
			/**
			 * 
			 * @private
			 */
			uiAdaptationStarted: uiAdaptationStarted,
			/**
			 * 
			 * @private
			 */
			uiAdaptationStopped: uiAdaptationStopped,

			/**
			 * Method returns the associated Transaction Controller
			 * @returns {sap.ui.generic.app.transaction.BaseController} Returns instance of  
			 * {@link sap.ui.generic.app.transaction.DraftController DraftController} incase of 
			 * Draft enabled application. In case application is non-draft, instance of 
			 * {@link sap.ui.generic.app.transaction.TransactionController TransactionController} will be returned 
			 * @public
			 */
			getTransactionController: function() {
				return oApplicationController.getTransactionController();
			},

			/**
			 * Method returns the Application Controller
			 * @returns {sap.ui.generic.app.ApplicationController} Instance of ApplicationController
			 * @public
			 */
			getApplicationController: function() {
				return oApplicationController;
			},

			/**
			 * Returns the reference to the navigation controller instance that has been created by AppComponent.
			 *
			 * @returns {sap.suite.ui.generic.template.lib.NavigationController} Navigation controller instance
			 * @public
			 */
			getNavigationController: function() {
				return oNavigationController;
			},

			/**
			 * Navigate to the target component based on the startup parameters passed as input. Currently this API
			 * is exposed only for consumption of My Inbox integration and should not be consumed by other consumers 
			 * without consent from the Fiori element V2 team
			 * 
			 * @param {object} oStartupParameters Startup parameters for the application
			 * @internal
			 */
			navigateBasedOnStartupParameter: function(oStartupParameters) {
				// The implementation is done asynchronously, since myInbox might trigger new requests faster then we are able to fulfill them
				oNextStartupParameters = oStartupParameters;
				oTemplateContract.oBusyHelper.getUnbusy().then(function(){
					if (!oNextStartupParameters || oTemplateContract.oBusyHelper.isBusy()){
						oNextStartupParameters = null;
						return;
					}
					var oExecutionPromise = oTemplateContract.oNavigationControllerProxy.clearHistory().then(startupParameterHelper.parametersToNavigation.bind(null, oTemplateContract, oNextStartupParameters));
					oTemplateContract.oBusyHelper.setBusy(oExecutionPromise);
					oNextStartupParameters = null;
				});                         
			}
		};

		// Expose selected private functions to unit tests
		/* eslint-disable */
		var fnNormalizePagesMapToArray = testableHelper.testable(fnNormalizePagesMapToArray, "fnNormalizePagesMapToArray");
		getConfig = testableHelper.testable(getConfig, "getConfig");
		testableHelper.testable(setLeaveAppPromise, "AppComponent_setLeaveAppPromise");
		testableHelper.testable(fnGetShareControlVisibility, "AppComponent_fnGetShareControlVisibility");
		/* eslint-enable */

		return oMethods;
	}

	/**
	 * Main class used for Smart Template(Fiori elements V2) Application Component
	 * @class Smart Templates Application Component
	 * 
	 * @public
	 * @extends sap.ui.core.UIComponent
	 * @abstract
	 * @author SAP SE
	 * @version 1.108.9
	 * @name sap.suite.ui.generic.template.lib.AppComponent
	 */
	return UIComponent.extend("sap.suite.ui.generic.template.lib.AppComponent", {
		metadata: {
			config: {
				title: "SAP UI Application Component", // TODO: This should be set from App descriptor
				fullWidth: true
			},
			properties: {
				// ghostapp: a boolean property which is not used publicly but only used to identify the ghostapp
				forceGlobalRefresh: {
					type: "boolean",
					defaultValue: false //since the parameter is highly perfomance critical the default value is set to false
				},
				considerAnalyticalParameters: {
					type: "boolean",
					defaultValue: false
				},
				// showDraftToggle manifest setting is obsolete
				showDraftToggle: {
					type: "boolean",
					defaultValue: true
				},
				objectPageHeaderType: { // possible values are "Static" and "Dynamic"
					type: "string",
					defaultValue: "Static" // "Dynamic" is preferred, but for compatibility reasons "Static" is default
				},
				objectPageVariantManagement: { // possible values are "VendorLayer" and "None"
					type: "string",
					defaultValue: "None"
				},
				flexibleColumnLayout: {
					type: "object",
					defaultValue: null
				},
				inboundParameters: {
					type: "object",
					defaultValue: null
				},
				// "tableColumnVerticalAlignment" to set the vAlign property of columnListItem for responsive tables across LR,WL and OP
				tableColumnVerticalAlignment: {
					type: "string",
					defaultValue: "Middle"
				},
				//The column layout is used by default in the SmartForm on the object page
				useColumnLayoutForSmartForm: {
					type: "boolean",
					defaultValue: true
				},
				//The default no of columns in object page XL screens is 6 and allowed value to change is 4 or 6
				objectPageColumns: {
					type: "object",
					properties: {
						screenSizeXL: {
							type: "int",
							defaultValue: 6
						}
					}
				},
				statePreservationMode: { // possible values are "persistence" and "discovery"
					type: "string",
					defaultValue: "auto" // indicates that "persistence" should be used in FCL and "discovery" in non-FCL case
				},
				enableAutoColumnWidthForSmartTable: {
					type: "boolean",
					defaultValue: true
				},
				draftDiscardConfirmationSettings: {
					type:"object",
					defaultValue: {'enabled':'always'}
				}
			},
			events: {
				pageDataLoaded: {}
			},
			routing: {
				config: {
					async: true,
					viewType: "XML",
					viewPath: "",
					clearTarget: false
				},
				routes: [],
				targets: []
			},
			library: "sap.suite.ui.generic.template"
		},

		/**
		 * Method is overridden & returns as false
		 * @private
		 * @returns {boolean} Always returns false
		 * @final
		 */
		suppressDataLossPopup: function() {
			return false;
		},
		
		constructor: function() {
			var oAppId = testableHelper.startApp(); // suppress access to private methods in productive coding
			extend(this, getMethods(this, oAppId));
			(UIComponent.prototype.constructor || Function.prototype).apply(this, arguments);
		}
	});
});
