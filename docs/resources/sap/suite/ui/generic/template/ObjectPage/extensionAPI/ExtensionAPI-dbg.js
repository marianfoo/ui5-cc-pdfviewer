sap.ui.define(
	["sap/ui/base/Object", "sap/m/ListBase", "sap/ui/comp/smarttable/SmartTable",
		"sap/suite/ui/generic/template/ObjectPage/extensionAPI/DraftTransactionController",
		"sap/suite/ui/generic/template/ObjectPage/extensionAPI/NonDraftTransactionController",
		"sap/suite/ui/generic/template/extensionAPI/NavigationController", "sap/base/util/extend"],
	function(BaseObject, ListBase, SmartTable, DraftTransactionController, NonDraftTransactionController, NavigationController, extend) {
		"use strict";
		/**
		 * API to be used in extensions of ObjectPage. Breakout coding can access an instance of this class via
		 * <code>this.extensionAPI</code>. Do not instantiate yourself.
		 * @class
		 * @name sap.suite.ui.generic.template.ObjectPage.extensionAPI.ExtensionAPI
		 * @public
		 */

		function getMethods(oTemplateUtils, oController, oBase, oState) {
			return /** @lends sap.suite.ui.generic.template.ObjectPage.extensionAPI.ExtensionAPI.prototype */ {
				/**
				 * Get the entries currently selected in one ui element (table, chart, or list)
				 *
				 * @param {string} sUiElementId the id identifying the ui element the selected context is requested for
				 * @return {sap.ui.model.Context[]} contains one entry per entry selected
				 * @public
				 */
				getSelectedContexts: function(sUiElementId) {
					var oControl = oController.byId(sUiElementId);
					return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oTemplateUtils.oCommonUtils.getOwnerPresentationControl(oControl)).getSelectedContexts();
				},

				/**
				 * Rebinds the given SmartTable
				 *
				 * @param {string} sUiElementId the id identifying the control to refresh the binding
				 * @public
				 */
				rebind: function(sUiElementId){
					var oControl = oController.byId(sUiElementId);
					if (oControl instanceof SmartTable) {
						oControl.rebindTable();
					}
				},
				/**
				 * Refreshes the specified control from the backend. Currently only supported for tables.
				 *
				 * @param {string} sUiElementId the id identifying the control that should be refeshed. If the parameter is faulty the whole page is refreshed.
				 * @public
				 */
				refresh: function(sUiElementId) {
					if (!sUiElementId || sUiElementId === oController.getView().getId()){
						oTemplateUtils.oComponentUtils.refreshBinding(true);
						return;
					}
					var oControl = oController.byId(sUiElementId);
					if (oControl) {
						oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oTemplateUtils.oCommonUtils.getOwnerPresentationControl(oControl)).refresh();
					}
				},

				/**
				 *  This function returns the selected key of selected table of Object Page.
				 *
				 * @param {string} sSectionKey id of the section in Object Page mentioned in manifest of the application
				 * @returns {string} The key of variant item that is currently selected section.
				 * @public
				 * @experimental
				 */
				getQuickVariantSelectionKey: function(sSectionKey) {
					return oState.oMultipleViewsHandler.getSelectedKey(sSectionKey);
				},

				/**
				 *  This function sets the key in the selected section of the table of Object Page.
				 *
				 * @param {string} sSectionKey id of the section in Object Page mentioned in manifest of the application
				 * @param {string} sKey The key of variant item that is currently need to be set.
				 * @public
				 * @experimental
				 */
				setQuickVariantSelectionKey: function(sSectionKey, sKey) {
					oState.oMultipleViewsHandler.setSelectedKey(sSectionKey, sKey);
				},

				/**
				 * Get the transaction controller for editing actions on the page.
				 * Note that the methods provided by this transaction controller depend on whether the object supports drafts or not.
				 * @return {sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController|sap.suite.ui.generic.template.ObjectPage.extensionAPI.NonDraftTransactionController}
				 * the transaction controller
				 * @function
				 * @public
				 */
				getTransactionController: oBase.extensionAPI.getTransactionControllerFunction(),
				/**
				 * Attaches a control to the current View. Should be called whenever a new control is created and used in the
				 * context of this view. This applies especially for dialogs, action sheets, popovers, ... This method cares
				 * for defining dependency and handling device specific style classes
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
					oSettings = Object.assign((oSettings || {}), {bSetBusy: true});
					return oTemplateUtils.oCommonUtils.invokeActionsForExtensionAPI(sFunctionName, vContext, mUrlParameters, oSettings, oState);
				},
				/**
				 * Attach a handler to the PageDataLoaded event.
				 * This event is fired each time the object page is navigated to or the object to be displayed is changed
				 * Note, that the event will not be fired before:
				 * <ul compact>
				 * <li>the navigation to the page has been completed
				 * <li>the header data of the object are available
				 * </ul>
				 * @param {function} fnFunction the handler function. Note that the event passed to this function possesses an attribute <code>context</code>
				 * which contains the current header context
				 * @public
				 */
				attachPageDataLoaded: function(fnFunction) {
					oTemplateUtils.oComponentUtils.attach(oController, "PageDataLoaded", fnFunction);
				},
				/**
				 * Detach a handler from the PageDataLoaded event
				 *
				 * @param {function} fnFunction the handler function
				 * @public
				 */
				detachPageDataLoaded: function(fnFunction) {
					oTemplateUtils.oComponentUtils.detach(oController, "PageDataLoaded", fnFunction);
				},
				/**
				 * Registers a filter provider for the the message popover
				 *
				 * @param {function} fnProviderCallback function which will be called each time a new context
				 * is set for the object page. The function should return an instance of sap.ui.model.Filter,
				 * an array of sap.ui.model.Filter or a Promise which resolves to one of these.
				 * @public
				 */
				registerMessageFilterProvider: function(fnProvider) {
					oBase.state.messageButtonHelper.registerMessageFilterProvider(fnProvider);
				},
				/**
				 * Get the navigation controller for navigation actions
				 *
				 * @return {sap.suite.ui.generic.template.extensionAPI.NavigationController} the navigation controller
				 * @public
				 * @function
				 */
				getNavigationController: oBase.extensionAPI.getNavigationControllerFunction(),

				/**
				 * Get the id of the view this extension api belongs to
				 *
				 * @return {string} the view id
				 * @public
				 * @function
				 */
				getViewId: function(){
					return oController.getView().getId();
				},

				/**
				 * @experimental
				 */
				getCommunicationObject: function(iLevel){
					return oTemplateUtils.oComponentUtils.getCommunicationObject(iLevel);
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
					return oTemplateUtils.oCommonUtils.securedExecution(fnFunction, mParameters, oBase.state);
				},


				/**
				* Allow parent components to be refreshed on next activation
				* @param {int} iLevel - Number of parent components to be refreshed
								* 1 - Refresh the immediate parent component
								* Undefined or faulty - Refresh all parent components
				* @public
				*/
				refreshAncestors: function(iLevel) {
					var oComponent = oController.getOwnerComponent();
					if (iLevel < 0) {
						iLevel = null;
					}
					oTemplateUtils.oServices.oViewDependencyHelper.setParentToDirty(oComponent, undefined, iLevel);
				},

				/**
				 * Call this method to indicate that the state of custom controls has changed. This is only necessary when methods <code>provideCustomStateExtension</code>
				 * and <code>applyCustomStateExtension</code> have been overridden, such that the corresponding state can be stored and restored.
				 * @returns {Promise} A <code>Promise</code> that is resolved when the changed state is transferred to the URL and the corresponding busy session is ended.
				 * @public
				 * @see {@link topic:89fa878945294931b15a581a99043005 Custom State Handling for Extended Apps}
				 */
				onCustomStateChange: function(){
					return oTemplateUtils.oComponentUtils.stateChanged();
				},
				
				/**
				 * Provide an option for showing an own message in the message bar above an OP table
				 * @param {object} [oMessage] custom message along with type to set on table. If this parameter is faulty an existing message will be removed.
				 * @param {string} oMessage.message message string to display
				 * @param {string} oMessage.type indicates type of message (sap.ui.core.MessageType)
				 *  whether it's sap.ui.core.MessageType.Success, sap.ui.core.MessageType.Warning, sap.ui.core.MessageType.Error or sap.ui.core.MessageType.Information.
				 * @param {string} sSmartTableId Id of the table for which message should be set 				 
				 * @param {array |string} [vTabKey]  If switching between different table views is enabled, this parameter can be used to identify the views which
				 * are affected by this call. Faulty values indicate that all views should be affected. Otherwise the value should either be one string or an array of strings
				 * identifying the affected variant items.
				 * @param {function} [onClose] A function that is called when the user closes the message bar. Note that the messages for all tabs specified via <code>vTabKey</code>
				 * will be considered to be obsolete when the user closes the message bar while one of them is active. 
				 * @public
				 */
				 setCustomMessage: function (oMessage, sSmartTableId, vTabKey, onClose) {
					oState.oMessageStripHelper.setCustomMessage(oMessage, sSmartTableId, vTabKey, onClose);
				 }				
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.extensionAPI.ExtensionAPI", {
			constructor: function(oTemplateUtils, oController, oBase, oState) {
				extend(this, getMethods(oTemplateUtils, oController, oBase, oState));
			}
		});
	});
