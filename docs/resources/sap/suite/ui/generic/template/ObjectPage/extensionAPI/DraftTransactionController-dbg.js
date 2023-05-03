sap.ui.define(["sap/ui/base/Object", "sap/base/util/extend", "sap/base/util/isEmptyObject"], function(BaseObject, extend, isEmptyObject) {
	"use strict";
	/**
	 * Draft transaction controller to be used in extensions of ObjectPage. Breakout coding can access an instance of this
	 * class via <code>ExtensionAPI.getTransactionController</code>. Do not instantiate yourself.
	 *
	 * @class
	 * @name sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController
	 * @public
	 */

	function getMethods(oTemplateUtils, oController, oState) {
		return /** @lends sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController.prototype */	{
			/**
			 * Attach a handler to the activate event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			attachAfterActivate: function(fnFunction) {
				oTemplateUtils.oComponentUtils.attach(oController, "AfterActivate", fnFunction);
			},
			/**
			 * Detach a handler from the activate event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			detachAfterActivate: function(fnFunction) {
				oTemplateUtils.oComponentUtils.detach(oController, "AfterActivate", fnFunction);
			},
			/**
			 * Attach a handler to the discard event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			attachAfterCancel: function(fnFunction) {
				oTemplateUtils.oComponentUtils.attach(oController, "AfterCancel", fnFunction);
			},
			/**
			 * Detach a handler from the discard event
			 *
			 * @param {function} fnFunction the handler function
			 * @public
			 */
			detachAfterCancel: function(fnFunction) {
				oTemplateUtils.oComponentUtils.detach(oController, "AfterCancel", fnFunction);
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
			 * Perform a draft saving operation.
			 * This method only needs to be used, when more than one OData model is used to handle the data for the current draft.
			 * Using more than one OData models is only sensible, when more than one OData service is being used to store the data for the object.
			 * The Fiori Elements framework cares for all changes being applied to the standard OData model (even if they are applied within breakouts).
			 * However, if additional OData models are in place the breakout implementation which has introduced these models also needs to take care
			 * for saving the data in these models as soon as possible. </br>
			 * In these rare cases this method should be used to intergate the saving operation into the general draft saving process. </br>
			 * Note that this method may be enhanced in the future in order to introduce a better error handling.
			 * @param {function} fnFunction function that saves the draft in the additional OData model(s). This method must return a Promise that is
			 * resolved, when the draft saving is finished successfully. Otherwise the Promise should be rejected.
			 * @public
			 */
			saveDraft: function(fnFunction) {
				oTemplateUtils.oServices.oApplication.markCurrentDraftAsModified();
				oTemplateUtils.oServices.oApplicationController.addOperationToQueue(fnFunction, {draftSave : true});
			},
			/**
			 * Cancel the draft. Note that this method only works when you are on the root of a draft.
			 * The normal navigation which follows the cancellation of a draft is executed.
			 * Moreover, note that executing this method will set the App to be busy. However, it does not ensure, that
			 * the method is only called, when the App is currently unbusy. If you want to ensure that, you have to use
			 * {@link sap.suite.ui.generic.template.ObjectPage.extensionAPI.ExtensionAPI#securedExecution}.
			 *
			 * @return {function} a promise that is resolved when the draft is cancelled, rejected when this is not possible.
			 * @public
			 * @experimental
			 */
			discardDraft: function(){
				return oState.onCancel();
			},
			/**
			 * checks if side effects exist for the given properties or entities and executes them. if there are
			 *  pending changes in the model those pending changes are sent as a patch request with the side effect
			 *  batch request. If no source property and no source entity is passed a global side effect is executed
			 *
			 * @param {object} [oSideEffects] object containing any of the following properties:
			 * @param {array}  oSideEffects.sourceProperties array with property paths
			 * @param {array}  oSideEffects.sourceEntities array with navigation property paths
			 * @public
			 * @experimental
			 */
			executeSideEffects: function(oSideEffects) {
				oSideEffects = oSideEffects || {};
				var bForceGlobalRefresh = isEmptyObject(oSideEffects);
				oTemplateUtils.oServices.oApplicationController.executeSideEffects(oController.getView().getBindingContext(), oSideEffects.sourceProperties, oSideEffects.sourceEntities, bForceGlobalRefresh);
			}
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController", {
		constructor: function(oTemplateUtils, oController, oState) {
			extend(this, getMethods(oTemplateUtils, oController, oState));

		}
	});
});
