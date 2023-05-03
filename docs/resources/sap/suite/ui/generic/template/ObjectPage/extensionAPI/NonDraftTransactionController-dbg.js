sap.ui.define(["sap/ui/base/Object", "sap/base/util/extend"], function(BaseObject, extend) {
	"use strict";
	/**
	 * Non Draft transaction controller to be used in extensions of ObjectPage. Breakout coding can access an instance of this
	 * class via <code>ExtensionAPI.getTransactionController</code>. Do not instantiate yourself.
	 *
	 * @class
	 * @name sap.suite.ui.generic.template.ObjectPage.extensionAPI.NonDraftTransactionController
	 * @public
	 */

	function getMethods(oTemplateUtils, oController, oState) {
		return /** @lends sap.suite.ui.generic.template.ObjectPage.extensionAPI.NonDraftTransactionController.prototype */	{
			/**
			 * Attach a handler to the save event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			attachAfterSave: function(fnFunction) {
				oTemplateUtils.oComponentUtils.attach(oController, "AfterSave", fnFunction);
			},
			/**
			 * Detach a handler from the save event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			detachAfterSave: function(fnFunction) {
				oTemplateUtils.oComponentUtils.detach(oController, "AfterSave", fnFunction);
			},
			/**
			 * Attach a handler to the delete event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			attachAfterDelete: function(fnFunction) {
				oTemplateUtils.oComponentUtils.attach(oController, "AfterDelete", fnFunction);
			},
			/**
			* Attach a handler to the line item delete event (for smart tables in object page)
			*
			* @param {function} fnFunction the handler function
			* @public
			*/
			attachAfterLineItemDelete: function(fnFunction) {
				oTemplateUtils.oComponentUtils.attach(oController, "AfterLineItemDelete", fnFunction);
			},
			/**
			 * Detach a handler from the delete event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			detachAfterDelete: function(fnFunction) {
				oTemplateUtils.oComponentUtils.detach(oController, "AfterDelete", fnFunction);
			},
			/**
			 * Attach a handler to the cancel event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			attachAfterCancel: function(fnFunction) {
				oTemplateUtils.oComponentUtils.attach(oController, "AfterCancel", fnFunction);
			},
			/**
			 * Detach a handler from the cancel event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			detachAfterCancel: function(fnFunction) {
				oTemplateUtils.oComponentUtils.detach(oController, "AfterCancel", fnFunction);
			},
			/**
			 * Registers a function that provides information whether there are unsaved custom data
			 *
			 * This method must be used when an extension ui may contain user input that is <b>not</b> bound to
			 * the standard OData model of the app.
			 * In this case a function must be provided that returns the information whether the extension ui still
			 * contains unsaved user changes.
			 * @param {function} fnHasUnsavedData Callback function returning either true or false
			 * @public
			 */
			registerUnsavedDataCheckFunction: function(fnHasUnsavedData) {
				oState.aUnsavedDataCheckFunctions = oState.aUnsavedDataCheckFunctions || [];
				oState.aUnsavedDataCheckFunctions.push(fnHasUnsavedData);
				oTemplateUtils.oComponentUtils.registerUnsavedDataCheckFunction(fnHasUnsavedData);
			},
			
			/**
			 * This method can be called when a new entry with predefined values should be created (e.g. in a copy scenario).
			 * @param vPredefinedValues an object containing predefined values for the new entity (see parameter <code>mParameters.properties</code> of {@link sap.ui.model.odata.v2.ODataModel#createEntry} for details)
			 * @return {sap.ui.model.Context} a context representing the object to be created. It can be passed to {@link sap.suite.ui.generic.template.extensionAPI.NavigationController#navigateInternal} in order to visit the corresponding object page.
			 * @public
			 */
			createEntry: function(vPredefinedValues){
				var sEntitySet = oController.getOwnerComponent().getEntitySet();
				return oTemplateUtils.oServices.oApplication.createNonDraft(sEntitySet, vPredefinedValues, oState);
			}
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.extensionAPI.NonDraftTransactionController", {
		constructor: function(oTemplateUtils, oController, oState) {
			extend(this, getMethods(oTemplateUtils, oController, oState));

		}
	});
});
