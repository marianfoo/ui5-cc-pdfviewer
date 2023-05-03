sap.ui.define(["sap/ui/base/Object",
		"sap/suite/ui/generic/template/extensionAPI/NavigationController",
		"sap/base/util/extend"],
		function(BaseObject, NavigationController, extend) {
	"use strict";
	/**
	 * API to be used in extensions of AnalyticalListPage. Breakout coding can access an instance of this class via
	 * <code>this.extensionAPI</code>. Do not instantiate yourself.
	 * @class
	 * @name sap.suite.ui.generic.template.AnalyticalListPage.extensionAPI.ExtensionAPI
	 * @public
	 */

	function getMethods(oTemplateUtils, oController, oState) {
		var oNavigationController;
		return /** @lends sap.suite.ui.generic.template.AnalyticalListPage.extensionAPI.ExtensionAPI.prototype */ {
			/**
			 * Get the list entries currently selected
			 * @param {string} sUiElementId the id identifying the ui element the selected context is requested for
			 * @return {sap.ui.model.Context[]} contains the entries selected
			 * @public
			 */
			getSelectedContexts: function(sUiElementId) {
				// Incase no ElementId is passed from the function call, we default oControl to smartTable and fetch the context of smartTable
				var oControl = oState.oSmartTable;
				if (sUiElementId) {
					oControl = oController.byId(sUiElementId);
				}
				return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oTemplateUtils.oCommonUtils.getOwnerPresentationControl(oControl)).getSelectedContexts();
			},
			/**
			 * Triggers rebinding on the list
			 *
			 * @public
			 */
			rebindTable: function(){
				oState.oSmartTable.rebindTable();
			},
			/**
			 * Refreshes the SmartTable
			 *
			 * @public
			 */
			refreshTable: function() {
				if (oState.oSmartTable) {
					//Filters from SmartChart should be considered by table
					oState.oController.getOwnerComponent().getModel("_templPriv").setProperty('/alp/_ignoreChartSelections', false);
					oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oState.oSmartTable).refresh();
				}
			},
			/**
			* Refreshes the SmartChart Binding
			*
			* @private
			*/
			_refreshChart: function() {
				// Rebind chart
				if (oState.oSmartChart && oState.oSmartChart.rebindChart) {
					oState.oSmartChart.rebindChart();
				}
			},
			/**
			* Refreshes chart Items in SmartVisualFilterBar
			*
			* @private
			*/
			_refreshFilters: function() {
				//Update Binding in chart Items in Smart Filter Bar
				if (oState.alr_visualFilterBar && oState.alr_visualFilterBar.updateVisualFilterBindings) {
					oState.alr_visualFilterBar.updateVisualFilterBindings(true);
				}
			},
			/**
			* Refreshes KPI tags
			*
			* @private
			*/
			_refreshKpi: function() {

				if (oState.oKpiTagContainer) {
					var aContent = oState.oKpiTagContainer.mAggregations.content;
					for (var i in aContent){
						if (aContent[i]._createGlobalKpi) {
							aContent[i]._createGlobalKpi();
						}
					}
				}

				if (oState.oFilterableKpiTagContainer) {
					var aContent = oState.oFilterableKpiTagContainer.mAggregations.content;
					for (var i in aContent){
						if (aContent[i]._createFilterableKpi) {
							aContent[i]._createFilterableKpi();
						}
					}
				}
			},
			/**
			* Refreshes All controls in ALP
			*
			* @public
			*/
			refresh: function() {
				oTemplateUtils.oCommonUtils.refreshModel(oState.oSmartTable.getEntitySet());
				this._refreshFilters();
				this._refreshChart();
				this.refreshTable();
				this._refreshKpi();
			},
			/**
			* provides incoming navigation context of the app
			* @returns {Object} Navigation context object
			* @public
			*/
			getNavigationContext: function() {
				var oNavigationContext = oState.oIappStateHandler.getInitialNavigationContext();
				return oNavigationContext;
			},

			/**
			 * Attaches a control to the current View. Should be called whenever a new control is created and used in the
			 * context of this view. This applies especially for dialogs, action sheets, popovers, ... This method cares for
			 * defining dependency and handling device specific style classes
			 *
			 * @param {sap.ui.core.Control} oControl the control to be attached to the view
			 * @public
			 */
			attachToView: function(oControl){
				oTemplateUtils.oCommonUtils.attachControlToView(oControl);
			},
			/**
			 * TODO : Need to bring this to same level as LR
			 * Invokes multiple time the action with the given name and submits changes to the back-end.
			 *
			 * @param {string} sFunctionName The name of the function or action
			 * @param {array|sap.ui.model.Context} vContext The given binding contexts
			 * @param {map} [mUrlParameters] The URL parameters (name-value pairs) for the function or action. This is not in oSettings for backward compatibility
			 * @param {object} oSettings Parameters that are set for invoking Application controller's invokeActions method
			 * @param {boolean} oSettings.bInvocationGroupingChangeSet Determines whether the common or unique changeset gets sent in batch
			 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the action, resolving to the same result as the <code>Promise</code>
			 * returned from {@link sap.ui.generic.app.ApplicationController}
			 * @throws {Error} Throws an error if the OData function import does not exist or the action input parameters are invalid
			 */
			invokeActions: function(sFunctionName, vContext, mUrlParameters, oSettings) {
				return oTemplateUtils.oCommonUtils.invokeActionsForExtensionAPI(sFunctionName, vContext, mUrlParameters, oSettings, oState);
			},
			/**
			 * Get the navigation controller for navigation actions
			 *
			 * @return {sap.suite.ui.generic.template.extensionAPI.NavigationController} the navigation controller
			 * @public
			 */
			getNavigationController: function() {
				if (!oNavigationController) {
					oNavigationController = new NavigationController(oTemplateUtils, oController, oState);
				}
				return oNavigationController;
			},

			/**
			 * Secured execution of the given function. Ensures that the function is only executed when certain conditions
			 * are fulfilled.
			 *
			 * @param {function} fnFunction The function to be executed. Should return a promise that is settled after completion
			 * of the execution. If nothing is returned, immediate completion is assumed.
			 * @param {object} [mParameters] Parameters to define the preconditions to be checked before execution
			 * @param {object} [mParameters.busy] Parameters regarding busy indication
			 * @param {boolean} [mParameters.busy.set=true] Triggers a busy indication during function execution. Can be set to
			 * false in case of immediate completion.
			 * @param {boolean} [mParameters.busy.check=true] Checks whether the application is currently busy. Function is only
			 * executed if not. Has to be set to false, if function is not triggered by direct user interaction, but as result of
			 * another function, that set the application busy.
			 * @param {object} [mParameters.dataloss] Parameters regarding dataloss prevention
			 * @param {boolean} [mParameters.dataloss.popup=true] Provides a dataloss popup before execution of the function if
			 * needed (i.e. in non-draft case when model or registered methods contain pending changes).
			 * @param {boolean} [mParameters.dataloss.navigation=false] Indicates that execution of the function leads to a navigation,
			 * i.e. leaves the current page, which induces a slightly different text for the dataloss popup.
			 * @param {map} [mParameters.mConsiderObjectsAsDeleted] Tells the framework that objects will be deleted by <code>fnFunction</code>.
			 * Use the BindingContextPath as a key for the map. Fill the map with a <code>Promise</code> for each object which is to be deleted.
			 * The <code>Promise</code> must resolve after the deletion of the corresponding object or reject if the deletion is not successful.
			 * @param {string} [mParameters.sActionLabel] In case of custom actions, the title of the message popup is set to sActionLabel.
			 * @returns {Promise} A <code>Promise</code> that is rejected, if execution is prohibited, and settled equivalent to the one returned by fnFunction.
			 * @public
			 * @see {@link topic:6a39150ad3e548a8b5304d32d560790a Using the SecuredExecutionMethod}
			 */
			securedExecution: function(fnFunction, mParameters) {
				return oTemplateUtils.oCommonUtils.securedExecution(fnFunction, mParameters, oState);
			},
			/**
			* This method should be called when any custom ui state handled by the getCustomAppStateDataExtension method changes.
			* Note that changes applied to custom filters need not to be propagated this way, since the change event of the SmartFilterBar
			* will automatically be handled by the smart template framework.
			* @public
			*/
			onCustomAppStateChange: function(){
				oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
			},
			/**
			 * Provide an option for showing an own message in the message bar above the ALP table
			 * @param {object} [oMessage] custom message along with type to set on table. If this parameter is faulty an existing message will be removed.
			 * @param {string} oMessage.message message string to display
			 * @param {string} oMessage.type indicates type of message (sap.ui.core.MessageType)
			 *  whether it's sap.ui.core.MessageType.Success, sap.ui.core.MessageType.Warning, sap.ui.core.MessageType.Error or sap.ui.core.MessageType.Information.
			 * @param {array |string} [vTabKey]  If switching between different table views is enabled, this parameter can be used to identify the views which
			 * are affected by this call. Faulty values indicate that all views should be affected. Otherwise the value should either be one string or an array of strings
			 * identifying the affected variant items.
			 * @param {function} [onClose] A function that is called when the user closes the message bar. Note that the messages for all tabs specified via <code>vTabKey</code>
			 * will be considered to be obsolete when the user closes the message bar while one of them is active.
			 * @public
			 */
			 setCustomMessage: function (oMessage, vTabKey, onClose) {
				oState.oMessageStripHelper.setCustomMessage(oMessage, vTabKey, onClose);
			 }
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.extensionAPI.ExtensionAPI", {
		constructor: function(oTemplateUtils, oController, oState) {
			extend(this, getMethods(oTemplateUtils, oController, oState));

		}
	});
});
