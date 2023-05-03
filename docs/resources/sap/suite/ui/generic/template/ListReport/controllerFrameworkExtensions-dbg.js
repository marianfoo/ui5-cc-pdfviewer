sap.ui.define([
	
], function() {
		"use strict";
		
		/**
		 * This class contains all extension functions that can be implemented by Application 
		 * developers in their extension code. Application developers should not override any methods
		 * outside this documentation.
		 * @namespace sap.suite.ui.generic.template.ListReport.controllerFrameworkExtensions
		 * @public
		 */
		
		return /** @lends sap.suite.ui.generic.template.ListReport.controllerFrameworkExtensions */ {

			/**
			 * This method is called by SAP Fiori elements on the initialization of View. Application 
			 * developers can override this method & perform internal setup in this hook, It is only 
			 * called once per View instance. 
			 * 
			 * @protected
			 */
			 onInit: function() {},

			/**
			 * Obsolete and not called anymore. 
			 * Kept here to avoid conflicts (in the very unlikely case, Fiori elements would come up with the idea to invent a new extension method with the exact same name some day
			 * in future, and any application would still have an implementation for this old extension).
			 * 
			 * (Original purpose: When (standard) filters (i.e. filters defined in annotations) are provided with default values (also from the annotation), and the user actively 
			 * removed the default without giving a new value, and later tried to restore from that state, the default values were reappearing. This was caused by the way the old API
			 * of SFB (getDataSuiteFormat and setDataSuiteFormat) worked: the get method returned only select options for the filters that actually had values (i.e. no select option
			 * for the filters the user removed the values from), and the set method only overrode those values, select options were provided for (i.e. the missing ones just kept 
			 * their default value set during initialization). To overcome this problem, the extension was created to inform Fiori elements about all fields potentially running into
			 * that problem, and we added a select option (I EQ "") for those fields. This workaround of course ahs two severe problems: A filter with eq "" is not the same as not
			 * having a filter for the same field (rather the opposite), and all applications were required to keep extension and annotations in sync (and missing to do that would 
			 * only be found in very exceptional cases).
			 * With the newer API of SFB (getUiState and setUiState), this problem has been overcome (esp. as setUiState overrides all filters, not only the ones provided).)
			 * @protected
			 */
			getVisibleSelectionsWithDefaults: Function.prototype,
			
			/**
			 * This method is called by SAP Fiori elements once the smart filter bar is initialized with a   
			 * variant. 
			 * 
			 * Application developers can override this method when there is a custom filter field 
			 * bound outside the standard model.
			 * 
			 * Use this method to provide initial values for your extension filters if they deviate from the initial value according to the data type and cannot be provided in the view fragment. 
			 *
			 * For more information, see {@link topic:5fb9f57fcf12401bbe39a635e9a32a4e Adding Custom Fields to the Filter Bar}.
			 * 
			 * @param {sap.ui.base.Event} oEvent - The 
			 * {@link sap.ui.comp.filterbar.FilterBar.prototype.event:initialise initialise} event
			 * @protected
			 * 
			 */
			onInitSmartFilterBarExtension: function(oEvent) {},
			
			/**
			 * This method is called by SAP Fiori elements before persisting the AppState. Application developers can
			 * override this method for persisting the state of custom controls. State of the custom control (controls) 
			 * should be stored in the oCustomData passed as a parameter to this method. To make a complete functionality,  
			 * this method should be overridden in combination with <code>restoreCustomAppStateDataExtension</code>.
			 * 
			 * In some cases, applications might need to inform the framework about changes to their state by calling 
			 * {@link sap.suite.ui.generic.template.ListReport.extensionAPI.onCustomAppStateChange onCustomAppStateChange}. For custom filters added to the filter bar, this should not be necessary.
			 * 
			 * Remark: The term AppState actually relates to the UI state of the List Report. It is usually stored in the layered repository, and can be retrieved via the key, that is added as value of
			 * the URL parameter iAppState. 
			 * (Although the value of the URL parameter xAppState used in navigation scenarios also points to data stored on the layered repository, in contrast to the 
			 * iAppState it has nothing to do with the state of the app - conceptually, it is just a container for passing data from source to target during navigation. The confusion arises from the 
			 * fact, that per definition the source app should provide all data available (to allow the target app to select the part it is interested in), and thus the structure contained looks quite 
			 * similar to the iAppState.)
			 *
			 * For more information, see {@link topic:5fb9f57fcf12401bbe39a635e9a32a4e Adding Custom Fields to the Filter Bar}.
			 * 
			 * @param {object} oCustomData - Object to be enriched with the custom control state
			 * @protected
			 */			
			getCustomAppStateDataExtension: function(oCustomData) {},
			
			/**
			 * This method is called by SAP Fiori elements while applying the AppState. This method should be overridden in combination
			 * with <code>getCustomAppStateDataExtension</code>. The custom data retrieved from the AppState will be 
			 * passed as a parameter to this method. Application developers can use this custom data to restore the state 
			 * of the custom control.
			 * 
			 * Note: Application developers need to be aware that this method is also called during startup without restoring from an iAppState (initial startup or navigation). In this case, an empty
			 * object is provided. Originally, this happened unintended, but needs to be kept for compatibility, as it has been used by some applications to enforce specific filter values (contradicting
			 * the defined way navigation should work). This usage is not recommended!
			 * Recommended: When called with an empty object, just return without doing anything.
			 *  
			 * For more information, see {@link topic:5fb9f57fcf12401bbe39a635e9a32a4e Adding Custom Fields to the Filter Bar}.
			 *
			 * @param {object} oCustomData - Custom data containing the information
			 * @protected
			 */
			restoreCustomAppStateDataExtension: function(oCustomData) {},
			
			/**
			 * This method is called by SAP Fiori elements before binding a table. Application developers can
			 * override this method and programmatically modify parameters or filters before the table triggers  
			 * a query to retrieve data.
			 *
			 * For more information, see {@link topic:5fb9f57fcf12401bbe39a635e9a32a4e Adding Custom Fields to the Filter Bar}.
			 * 
			 * <b>Note: </b>This method is called only when a table is rebound, and not when it is refreshed.
			 *
			 * @param {sap.ui.base.Event} oEvent - The 
			 * {@link sap.ui.comp.smarttable.SmartTable.prototype.event:beforeRebindTable beforeRebindTable} event
			 * @protected
			 */	
			onBeforeRebindTableExtension: function(oEvent) {},
			
			/**
			 * This method is called by SAP Fiori elements before binding a chart. Application developers can
			 * override this method and programmatically modify parameters or filters before chart triggers 
			 * a query to retrieve data. 
			 *
			 * For more information, see {@link topic:5fb9f57fcf12401bbe39a635e9a32a4e Adding Custom Fields to the Filter Bar}.
			 * 
			 * <b>Note: </b>This method is called only when a chart is rebound, and not when it is refreshed.
			 *
			 * @param {sap.ui.base.Event} oEvent - The 
			 * {@link sap.ui.comp.smartchart.SmartChart.prototype.event:beforeRebindChart beforeRebindChart} event
			 * @protected
			 */
			onBeforeRebindChartExtension: function(oEvent) {},
			
			/**
			 * This method is called by SAP Fiori elements before triggering an external navigation. Application developers 
			 * can override this method and programmatically adapt the parameters which are passed to the target application.
			 * Application developers can use the oObjectInfo parameter to identify the navigation context and
			 * modify the oSelectionVariant which contains the navigation parameters.
			 * 
			 * @param {sap.ui.generic.app.navigation.service.SelectionVariant} oSelectionVariant - Selection variant object 
			 * containing the information which needs to be passed to the target application
			 * @param {object} oObjectInfo - Context object based on which the intent based navigation is triggered
			 * @param {string} oObjectInfo.semanticObject - Semantic object used for the intend based navigation
			 * @param {string} oObjectInfo.action - Action on the context for which the navigation is triggered
			 * @protected
			 */
			adaptNavigationParameterExtension: function(oSelectionVariant, oObjectInfo) {},
			
			/**
			 * This method is called by SAP Fiori elements when a chevron navigation is triggered from a table. Application 
			 * developers can override this method and perform conditional (internal or external) navigation from different 
			 * rows of a table. Such custom navigation should be triggered via corresponding methods of 
			 * {@link sap.suite.ui.generic.template.extensionAPI.NavigationController NavigationController}.
			 * 
			 * @param {sap.ui.base.Event} oEvent - The press event fired when navigating from a row in the SmartTable. It 
			 * is recommended to ignore this parameter and use <code>oBindingContext</code> instead
			 * @param {sap.ui.model.Context} oBindingContext - The context of the corresponding table row
			 * @param {boolean} bReplaceInHistory - This parameter should be considered if the method triggers an internal 
			 * navigation. Pass this parameter to <code>oNavigationData.replaceInHistory</code> in this case
			 * 
			 * @returns {boolean} Method should return <code>true</code> if framework navigation should be suppressed 
			 * (that means: extension code has taken over navigation)
			 * @protected
			 */
			onListNavigationExtension: function(oEvent, oBindingContext, bReplaceInHistory) {
				return false;
			},
			
			/**
			 * This method is called by SAP Fiori elements when the Create with Filters is executed. Application developers
			 * can enable this feature in the LR component by adding createWithFilters in the settings object of the 
			 * List Report component & strategy needs to be set as <code>extension</code>. SmartFilterBar instance will be 
			 * passed as a parameter to the method. Application developers can access the properties, values and add it to 
			 * the returning object map. Application developers will have complete control on properties passed to the new
			 * instance creation.
			 * 
			 * @param {sap.ui.comp.smartfilterbar.SmartFilterBar} oSmartFilterBar - SmartFilterBar of the ListReport
			 * @param {object} oDefaultValues - Default values returned by backend when Common.v1.DefaultValuesFunction annotation has been configured
			 * @returns {Map} Key/Value map of the properties
			 * @protected
			 */
			getPredefinedValuesForCreateExtension: function(oSmartFilterBar, oDefaultValues){
				return {};
			},
			
			/**
			 * This method is called by SAP Fiori elements whenever the busy state is switched off. Application developers can
			 * override this method, access the message model and adapt the transient messages related to the component.
			 * 
			 * @protected
			 */
			adaptTransientMessageExtension: function(){},
			
			/**
			 * This method is called by SAP Fiori elements when the Share functionality is triggered. Application  
			 * developers can adapt the service URL passed as a parameter to this method. Adapted service URL will 
			 * be used in the 'Send Email' or 'Save as Tile' options.
			 * 
			 * @param {object} oShareInfo - Object containing the serviceURL
			 * @param {string} oShareInfo.serviceUrl - Service URL which is derived by SAP Fiori elements
			 * @protected
			 */
			onSaveAsTileExtension: function(oShareInfo) {},
			
			/**
			 * This method is called by SAP Fiori elements when the delete operation is triggered. Application developers 
			 * can override this method in controller extension & perform additional checks before executing the delete 
			 * operation. Method is expected to return a Promise. To veto the delete operation, promise needs to be rejected 
			 * else resolved.
			 * 
			 * @param {object} oBeforeDeleteProperties - Object containing the selected context for delete
			 * @param {Array} oBeforeDeleteProperties.aContexts - Array of the selected contexts
			 * @returns {Promise} - Promise object created by the extension, used for Delete operation chaining
			 * @protected
			 */
			beforeDeleteExtension: function(oBeforeDeleteProperties) {},
			
			/**
			 * This method is called by SAP Fiori elements in the startup life cycle of a component. Application 
			 * developers can override this method and modify the startup object. For an example, when the 
			 * application is started, the selection variant might contain some properties that are not required   
			 * for this app. Such properties can be removed from the selection variant. The reverse use case is 
			 * also true, where some additional properties needs to be added with certain fixed values. This
			 * can be achieved by adding these values to the selection variant. 
			 * 
			 * @param {object} oStartupObject - Startup Object containing the initial contexts
			 * @param {boolean} oStartupObject.viaExternalNavigation - information whether the application was triggered via external navigation
			 * @param {sap.ui.generic.app.navigation.service.SelectionVariant} oStartupObject.selectionVariant - Selection 
			 * Variant containing the values which needs to be applied to the smart filter bar
			 * @param {object} oStartupObject.semanticDates - Semantic dates configuration in the manifest is read an assigned 
			 * in this object
			 * @param {string} oStartupObject.selectedQuickVariantSelectionKey - if switching between different table views is enabled, the key which will be initially selected
			 * @protected
			 */
			modifyStartupExtension: function(oStartupObject) {},
			
			/**
			 * This method is called when the user leaves the app and this page has been displayed within the same app 
			 * session (this is the time since last opening the app) at least once.
			 * Moreover, it is called for all pages that have been displayed within some app session when the app is finally destroyed.
			 * @param {boolean} bIsDestroyed - If this parameter is true this app instance is destroyed. Otherwise it might
			 * be rewoken if the user navigates again to this app within the same FLP session
			 * @return {function} - Only relevant in case that <code>isDestroyed</code> is false. In this case Application
			 * developers can provide a function to be called when the same page is opened again (after the user has navigated back to the app).
			 * @protected
			 */
			onLeaveAppExtension: function(bIsDestroyed){ },

			/**
			 * This method should be implemented whenever application uses onListNavigationExtension for internal navigation. In this case the implementation of
			 * this method should provide an 'inverse' mapping to the transformation implemented within onListNavigationExtension.
			 * More precisely, the identification of a child page instance is passed to this function. The implementation of this function should provide information
			 * about the list item which has triggered the opening of the child page.
			 * @param {object} oSelectionInfo - Information about the child page instance opened last
			 * @param {string} [oSelectionInfo.pageEntitySet] The entity set identifying the child page which was opened last. 
			 * Note: In case the child page has been defined without reference to OData this will be the routeName taken from the routingSpec.   
			 * @param {string} [oSelectionInfo.path] The context path that was used for the last opened child page
			 * @param {string[]} [oSelectionInfo.keys] The array of keys (one on each hiearchy level) used for the last opened child page
			 * @param {function} fnSetPath - pass the binding path of the corresponding list item to this function if it is not identical to <code>oSelectionInfo.path</code>
			 * @protected
			 */
			onChildOpenedExtension: function(oSelectionInfo, fnSetPath) {},

			/**
			 * This method should be implemented whenever the application needs to have a custom save functionality for multi edit scenario.
			 * The logic for save should be defined here and this method should return a promise based on whose resolution or rejection the framework would perform cleanup tasks like
			 * closing the dialog and refreshing the table data.There will be no chaining of multi edit save from the framework, if the extension is implemented then the framework
			 * will only execute extension code for save.
			 * @param {Object[]} aContextsToBeUpdated - The array of objects containing the contexts to be updated and the updated value.
			 * @param {string} aContextsToBeUpdated[].sContextPath - The context path for the child to be updated.
			 * @param {Object} aContextsToBeUpdated[].oUpdateData - The Object with the updated values for the selected properties in the multi edit dialog.
			 * @returns {Promise} - Promise object created by the extension, used for cleanup after the promise is resolved or rejected.
			 * @protected
			 */
			beforeMultiEditSaveExtension:function(aContextsToBeUpdated) {}
		};
	});