sap.ui.define([ ], function() {
		"use strict";
		/**
		 * This class contains all extension functions that can be implemented by Application 
		 * developers in their extension code. Application developers should not override any methods
		 * outside this documentation
		 * @namespace sap.suite.ui.generic.template.AnalyticalListPage.controllerFrameworkExtensions
		 * @public
		 */
		 return /** @lends sap.suite.ui.generic.template.AnalyticalListPage.controllerFrameworkExtensions */ {

			/**
			 * This method is called by Fiori elements on the initialization of View. Application developers  
			 * can override this method & perform internal setup in this hook. 
			 * 
			 * @protected
			 */
			 onInit: function() {},
			
			/**
			 * This method is called in the AppState creation lifecycle. Application developers can override this method,
			 * return an array of all selection fields set on SmartFilterBar using custom code as default and doesn't 
			 * really want to store as part of the AppState. SAP Fiori elements framework will remove these filter 
			 * properties from the selection variant.
			 * 
			 * @returns {Array} - Properties which are visible and should not be stored as part of the
			 * selection variant in the AppState
			 * @protected
			 */
			getVisibleSelectionsWithDefaults: function() {
				return [];
			},

			/**
			 * This method is called by SAP Fiori elements once the smart filter bar is initialized with a   
			 * variant. Application developers can override this method when there is a custom filter field 
			 * bound outside the standard model.
			 * 
			 * @param {sap.ui.base.Event} oEvent - The 
			 * {@link sap.ui.comp.filterbar.FilterBar.prototype.event:initialise initialise} event
			 * @protected
			 */
			onInitSmartFilterBarExtension: function(oEvent) {},
			
			/**
			 * This method is called by SAP Fiori elements before persisting the AppState. Application developers can
			 * override this method for persisting the state of custom controls. State of the custom control (controls) 
			 * should be stored in the oCustomData passed as a parameter to this method. To make a complete functionality,  
			 * this method should be overridden with <code>restoreCustomAppStateDataExtension</code>.
			 * 
			 * @param {object} oCustomData - Object to be enriched with the custom control state
			 * @protected
			 */
			 getCustomAppStateDataExtension: function(oCustomData) {},
			
			 /**
			 * This method is called by SAP Fiori elements while applying the AppState. This method should be overridden
			 * with <code>getCustomAppStateDataExtension</code>. The custom data retrieved from the AppState will be 
			 * passed as a parameter to this method. Application developers can use this custom data to restore the state 
			 * of the custom control.
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
			 * <b>Note: </b>This method is called only when a chart is rebound, and not when it is refreshed.
			 *
			 * @param {sap.ui.base.Event} oEvent - The 
			 * {@link sap.ui.comp.smartchart.SmartChart.prototype.event:beforeRebindChart beforeRebindChart} event
			 * @protected
			 */
			onBeforeRebindChartExtension: function(oEvent) {},
			
			/**
			 * This method is called by SAP Fiori elements when the Clear button on the filter dialog is clicked. Application 
			 * developers can override this method to clear custom filters.
			 *
			 * @param {sap.ui.base.Event} oEvent - The press event fired when the Clear button is pressed
			 * @protected
			 */
			onClearFilterExtension: function(oEvent) {},
			
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
			 * This method is called by SAP Fiori elements after creation of the custom model. Application developers 
			 * can override this method to modify the data in the custom model.
			 *
			 * @param {sap.ui.model.JSON.JSONModel} oCustomModel - The custom model
			 * @private
			 */
			onAfterCustomModelCreation: function(oCustomModel) {},
			
			/**
			 * This method is called by SAP Fiori elements before binding a filterable KPI. Application developers 
			 * can override this method to modify parameters or filters for a filterable KPI.
			 *
			 * @param {sap.ui.generic.app.navigation.service.SelectionVariant} oSelectionVariant - The SelectionVariant.
			 * @param {string} sEntityType - The filterable KPI's entity type.
			 * @param {string} sKPIId - The filterable KPI's Id.
			 * @protected
			 */
			onBeforeRebindFilterableKPIExtension: function(oSelectionVariant, sEntityType, sKPIId) {},
			
			/**
			 * This method is called by SAP Fiori elements whenever the busy state is switched off. Application developers can
			 * override this method, access the message model and adapt the transient messages related to the component.
			 * 
			 * @protected
			 */
			adaptTransientMessageExtension: function() {},
			
			/**
			 * This method is called by SAP Fiori elements when a chevron navigation is triggered from a table. Application 
			 * developers can override this method and perform conditional (internal or external) navigation from different 
			 * rows of a table. Such custom navigation should be triggered via corresponding methods of 
			 * {@link sap.suite.ui.generic.template.extensionAPI.NavigationController NavigationController}.
			 * 
			 * @param {sap.ui.base.Event} oEvent - The press event fired when navigating from a row in the SmartTable. It is recommended
			 * to ignore this parameter and use <code>oBindingContext</code> instead
			 * @param {sap.ui.model.Context} oBindingContext - The context of the corresponding table row
			 * @param {boolean} bReplaceInHistory - This parameter should be considered if the method triggers an internal navigation. Pass this
			 * parameter to <code>oNavigationData.replaceInHistory</code> in this case
			 * 
			 * @returns {boolean} Method should return <code>true</code> if framework navigation should be suppressed 
			 * (that means: extension code has taken over navigation)
			 * @protected
			 */
			onListNavigationExtension: function(oEvent, oBindingContext, bReplaceInHistory) {
				return false;
			},
			
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
			 * This method is called by SAP Fiori elements in the startup life cycle of a component. Application 
			 * developers can override this method and modify the startup object. For an example, when the 
			 * application is started, the selection variant might contain some properties that are not required   
			 * for this app. Such properties can be removed from the selection variant. The reverse use case is 
			 * also true, where some additional properties needs to be added with certain fixed values. This
			 * can be achieved by adding these values to the selection variant. 
			 * 
			 * @param {object} oStartupObject - Startup Object containing the initial contexts
			 * @param {sap.ui.generic.app.navigation.service.SelectionVariant} oStartupObject.selectionVariant - Selection 
			 * Variant containing the values which needs to be applied to the smart filter bar
			 * @param {object} oStartupObject.semanticDates - Semantic dates configuration in the manifest is read an assigned 
			 * in this object
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
			onLeaveAppExtension: function(bIsDestroyed){},
			
			/**
			 * This method is called by SAP Fiori elements before binding a visual filter. Application developers can 
			 * override this method  and programmatically modify parameters, filters, or influence sorting before the 
			 * chart triggers a query to retrieve data. Application developers can also access incoming navigation 
			 * contexts of the app through <code>getNavigationContext</code> API.
			 *
			 * @param {string} sEntityType - The visual filter entity type.
			 * @param {string} sDimension - The visual filter dimension.
			 * @param {string} sMeasure - The visual filter measure.
			 * @param {object} oContext - The context to modify for the custom filter/parameter, query parameter or sort order.
			 * @param {object} oContext.entityParameters - The object can be modified for the entity set parameters to be applied
			 *        to the visual filter call.
			 * @param {object} oContext.queryParameter -  The object can be modified for the custom query parameters to be applied
			 *        to the visual filter call.
			 * @param {sap.ui.model.Filter[]} oContext.filters - The combined filter array can be modified by users to influence
			 *        the filters applied to the visual filter call.
			 * @param {sap.ui.model.Sorter[]} oContext.sorters - The combined sorter array can be modified by users to influence
			 * 	      the sorting order of the visual filter.
			 * @protected
			 */
			onBeforeRebindVisualFilterExtension: function(sEntityType, sDimension, sMeasure, oContext) {},

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
			onChildOpenedExtension: function(oSelectionInfo, fnSetPath) {}
		};
	});