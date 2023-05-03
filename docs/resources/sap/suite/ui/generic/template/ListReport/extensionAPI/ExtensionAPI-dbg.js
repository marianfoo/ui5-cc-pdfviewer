sap.ui.define(["sap/ui/base/Object",
		"sap/suite/ui/generic/template/ListReport/extensionAPI/NonDraftTransactionController",
		"sap/suite/ui/generic/template/extensionAPI/NavigationController", "sap/base/util/extend","sap/ui/core/message/Message"],
	function(BaseObject, NonDraftTransactionController, NavigationController, extend, Message) {
		"use strict";
		/**
		 * API to be used in extensions of ListReport. Breakout coding can access an instance of this class via
		 * <code>this.extensionAPI</code>. Do not instantiate yourself.
		 * @class
		 * @name sap.suite.ui.generic.template.ListReport.extensionAPI.ExtensionAPI
		 * @public
		 */

		function getMethods(oTemplateUtils, oController, oState) {
			var oTransactionController;
			var oNavigationController;
			return /** @lends sap.suite.ui.generic.template.ListReport.extensionAPI.ExtensionAPI.prototype */ {
				/**
				 * Get the list entries currently selected for smart table
				 *
				 * @return {sap.ui.model.Context[]} contains one entry per line selected
				 * @public
				 */
				getSelectedContexts: function() {
					return oState.oPresentationControlHandler.getSelectedContexts();
				},
				/**
				 * Get the transaction controller for editing actions on the list. Note: Currently implemented for non draft case
				 *
				 * @return {sap.suite.ui.generic.template.ListReport.extensionAPI.NonDraftTransactionController} the transaction controller
				 * @public
				 */
				getTransactionController: function() {
					if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
						throw new Error("FioriElements: ListReport.extensionAPI.ExtensionAPI : Transaction support on ListReport for draft case not implemented yet");
					}
					oTransactionController = oTransactionController ||
						new NonDraftTransactionController(oTemplateUtils, oController, oState);
					return oTransactionController;
				},

				/**
				 * Triggers rebinding on the list. </br>
				 * Note that in a multi table tab scenarios the situation is more complex:
				 * By default the rebinding is performed on all tabs as soon as they get visible the next time (immediately for the already visible one).
				 * This applies to charts as well as tables. </br>
				 * Optional parameter <code>vTabKey</code> can be used to restrict the set of affected tabs.
				 * @param {array|string} [vTabKey] in multiple table tab scenario keys for the tables that should be rebound
				 * @public
				 */
				rebindTable: function(vTabKey){
					if (oState.oMultipleViewsHandler.refreshOperation(1, vTabKey)){
						return; // the MultipleViewsHandler already performed the operation
					}
					oState.oPresentationControlHandler.rebind();
				},
				/**
				 * Refreshes the List from the backend
				 * Note that in a multi table tab scenarios the situation is more complex:
				 * By default the refresh is performed on all tabs as soon as they get visible the next time (immediately for the already visible one).
				 * This applies to charts as well as tables. </br>
				 * Optional parameter <code>vTabKey</code> can be used to restrict the set of affected tabs.
				 * @param {array|string} [vTabKey] in multiple table tab scenario keys for the tables that should be refreshed
				 * @public
				 */
				refreshTable: function(vTabKey) {
					if (oState.oMultipleViewsHandler.refreshOperation(2, vTabKey)){
						return; // the MultipleViewsHandler already performed the operation
					}
					oState.refreshModel();
					oState.oPresentationControlHandler.refresh();
				},
				/**
				 * Attaches a control to the current View. Should be called whenever a new control is created and used in the
				 * context of this view. This applies especially for dialogs, action sheets, popovers, ... This method cares for
				 * defining dependency and handling device specific style classes
				 *
				 * @param {sap.ui.core.Control} oControl the control to be attached to the view
				 * @public
				 */
				attachToView: function(oControl) {
					oTemplateUtils.oCommonUtils.attachControlToView(oControl);
				},
				/**
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
				 * @public
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
				 * @experimental
				 */
				getCommunicationObject: function(iLevel){
					return oTemplateUtils.oComponentUtils.getCommunicationObject(iLevel);
				},

				/**
				 * Secured execution of the given function. Ensures that the function is only executed when certain conditions
				 * are fulfilled. For more information, see {@link topic:6a39150ad3e548a8b5304d32d560790a Using the SecuredExecutionMethod}.
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
				 */
				securedExecution: function(fnFunction, mParameters) {
					return oTemplateUtils.oCommonUtils.securedExecution(fnFunction, mParameters, oState);
				},
				/**
				 * If switching between different table views is enabled, this function returns the selected key.
				 *
				 * @returns {string} The key of the variant item that is currently selected.
				 * @public
				 * @experimental
				 */
				getQuickVariantSelectionKey: function() {
					return oState.oMultipleViewsHandler.getSelectedKey();
				},

				/**
				 * If switching between different table views is enabled, this function sets the selected key.
				 * @param {string} sKey The key of the variant item that is currently selected.
				 * @public
				 * @experimental
				 */
				setQuickVariantSelectionKey: function(sKey) {
					oState.oMultipleViewsHandler.setSelectedKey(sKey);
				},
				/**
				 * This method should be called when any custom ui state handled by the get/restoreCustomAppStateDataExtension-methods changes.
				 * Note that changes applied to custom filters need not to be propagated this way, since the change event of the SmartFilterBar
				 * will automatically be handled by the smart template framework.
				 * @public
				 * 
				 * For more information, see {@link topic:5fb9f57fcf12401bbe39a635e9a32a4e Adding Custom Fields to the Filter Bar}.
				 * 
				 */
				onCustomAppStateChange: function(){
					oState.oIappStateHandler.customAppStateChange();
				},
				/**
				 * Provide an option for showing an own message in the message bar above the LR table
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

		return BaseObject.extend("sap.suite.ui.generic.template.ListReport.extensionAPI.ExtensionAPI", {
			constructor: function(oTemplateUtils, oController, oState) {
				extend(this, getMethods(oTemplateUtils, oController, oState));

			}
		});
	});
