sap.ui.define(["sap/ui/base/Object", "sap/base/util/extend", "sap/base/util/deepExtend"], function(BaseObject, extend, deepExtend) {
	"use strict";
	/**
	 * Non draft transaction controller to be used in extensions of ListReport. Breakout coding can access an instance of
	 * this class via <code>ExtensionAPI.getTransactionController</code>. Do not instantiate yourself.
	 *
	 * Note: Only one object can be edited at a given point in time.
	 *
	 * @class
	 * @name sap.suite.ui.generic.template.ListReport.extensionAPI.NonDraftTransactionController
	 * @public
	 */

	function getMethods(oTemplateUtils, oController, oState) {
		var sEditingStatus = "none";

		function fnEditFinished() {
			sEditingStatus = "none";
		}

		return /** @lends sap.suite.ui.generic.template.ListReport.extensionAPI.NonDraftTransactionController.prototype */ {
			/**
			 * Start editing one list entry
			 *
			 * @param {sap.ui.model.Context} oContext the context identifying the entry to be edited
			 * @public
			 */
			edit: function(oContext) {
				if (!oContext) {
					throw new Error("FioriElements: ListReport.extensionAPI.NonDraftTransactionController: Nothing to edit provided");
				}
				if (sEditingStatus !== "none") {
					throw new Error("FioriElements: ListReport.extensionAPI.NonDraftTransactionController: Attempt to edit multiple contexts (" + oContext + ")");
				}
				if (oController.getView().getModel().hasPendingChanges()) {
					throw new Error("FioriElements: ListReport.extensionAPI.NonDraftTransactionController: Attempt to edit while already pending changes exist");
				}
				sEditingStatus = "editing";
			},
			/**
			 * Cancel editing
			 *
			 * @public
			 */
			cancel: function() {
				if (sEditingStatus !== "editing") {
					throw new Error("FioriElements: ListReport.extensionAPI.NonDraftTransactionController: Nothing edited");
				}
				oTemplateUtils.oServices.oTransactionController.resetChanges();
				fnEditFinished();
			},
			/**
			 * Save the changes which have been applied to the OData model. Sets the application busy during execution
			 * and doesn't execute if application is already busy when called (i.e. don't use <code>ExtensionAPI.securedExecution</code>
			 * to call this method).
			 *
			 * @return {Promise} is resolved when entry is successfully saved and rejected when saving fails
			 * @public
			 */
			save: function() {

				var fnFunction = function() {
					if (sEditingStatus !== "editing") { throw new Error("FioriElements: ListReport.extensionAPI.NonDraftTransactionController: Nothing edited"); }
					sEditingStatus = "saving";
					var oPromise = oTemplateUtils.oServices.oTransactionController.triggerSubmitChanges();
					oPromise.then(fnEditFinished, function() {
						sEditingStatus = "editing";
					});
					return oPromise;
				};

				// set default values for parameters
				var mParameters = {};
				mParameters = deepExtend({
					busy: {
						set: true,
						check: true
					},
					dataloss: {
						popup: false,
						navigation: false
					}
				}, mParameters);

				return oTemplateUtils.oCommonUtils.securedExecution(fnFunction, mParameters, oState);
			},

			/**
			 * This method can be called when a new entry with predefined values should be created (e.g. in a copy scenario).
			 * @param vPredefinedValues an object containing predefined values for the new entity (see parameter <code>mParameters.properties</code> of {@link sap.ui.model.odata.v2.ODataModel#createEntry} for details)
			 * @param {string} [sEntitySet] this parameter only needs to be used in multi entitySet scenarios, in order to specify another entity set than the main entity set of the ListReport
			 * @return {sap.ui.model.Context} a context representing the object to be created. It can be passed to {@link sap.suite.ui.generic.template.extensionAPI.NavigationController#navigateInternal} in order to visit the corresponding object page.
			 * @public
			 */
			createEntry: function(vPredefinedValues, sEntitySet){
				sEntitySet = sEntitySet || oController.getOwnerComponent().getEntitySet();
				if (!oState.oMultipleViewsHandler.hasEntitySet(sEntitySet)){
					throw new Error("FioriElements: ListReport.extensionAPI.NonDraftTransactionController: Entity Set " + sEntitySet + " is not available and thus cannot be used for create");
				}
				return oTemplateUtils.oServices.oApplication.createNonDraft(sEntitySet, vPredefinedValues, oState);
			}
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ListReport.extensionAPI.NonDraftTransactionController", {
		constructor: function(oTemplateUtils, oController, oState) {
			extend(this, getMethods(oTemplateUtils, oController, oState));

		}
	});
});
