sap.ui.define(["sap/ui/core/library",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/ui/model/odata/AnnotationHelper",
	"sap/base/util/extend",
	"sap/ui/model/Context"],
	function(coreLibrary, SelectionVariant, ODataAnnotationHelper, extend, Context) {
		"use strict";

		// shortcut for sap.ui.core.MessageType
		var MessageType = coreLibrary.MessageType;

		var sLocalModelName = "msg";

		// Method to be called in onBeforeRebindTable or onBeforeRebindChart to ensure that errors are handled accordingly
		function fnHandleErrorsOnTableOrChart(oTemplateUtils, oEvent, oState){
			var oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.events = oBindingParams.events || {};
			oBindingParams.events.aggregatedDataStateChange = function(oChangeEvent){
				var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
				// Do not show the messages in the following situations:
				// a) app is busy: Transient messages will be shown at the end of the busy session anyway
				// b) the binding contains entries: In this case the request was successfull -> error messages coming with the request would be state messages
				if (oBusyHelper.isBusy() || oChangeEvent.getSource().getLength()){
					return;
				}
				var oDataState = oChangeEvent.getParameter("dataState");
				var aErrors = oDataState.getMessages().filter(function(oMessage){
					var bIsCustomMessage = !oState.oMessageStripHelper || !oState.oMessageStripHelper.isCustomMessage(oMessage);
					return (oMessage.target === oChangeEvent.getSource().getPath() && oMessage.getType() === MessageType.Error && bIsCustomMessage);
				});
				if (aErrors.length){
					var oMessageManager = sap.ui.getCore().getMessageManager();
					oMessageManager.removeMessages(aErrors);
					var oPopup, oLocalModel, oMessageView;
					oTemplateUtils.oCommonUtils.getDialogFragmentAsync("sap.suite.ui.generic.template.listTemplates.fragments.MessagesOnRetrieval", {
						itemSelected: function(){
							oLocalModel.setProperty("/backbtnvisibility", true);
						},
						onBackButtonPress: function(){
							oMessageView.navigateBack();
							oLocalModel.setProperty("/backbtnvisibility", false);
						},
						onReject: function(){
							oMessageView.navigateBack();
							oPopup.close();
						}
					}, sLocalModelName, function(oFragment){
						oMessageView = oFragment.getContent()[0];
					}).then(function (oDialog) {
						oPopup = oDialog;
						oLocalModel = oPopup.getModel(sLocalModelName);
						oLocalModel.setProperty("/messages", aErrors);
						oLocalModel.setProperty("/backbtnvisibility", false);
						oPopup.open();
					});
				}
			};
		}

		/**
		 * This function merges multiple selection variants
		 *
		 * @param {array} aVariants Array of variants to be merged. It is merged in reverse order of their precedence.
		 *
		 * @returns {object} A new merged selection variant. The last variant in aVariants gets the highest priority.
		 */
		function fnMergeVariants(aVariants) {

			var oMergedVariant = new SelectionVariant();
			var aVariantOptions, aVariantParameters;
			aVariants.forEach(function (oVariant) {
				// copy selection options
				aVariantOptions = oVariant.getSelectOptionsPropertyNames();
				aVariantOptions.forEach(function (sProperty) {
					oMergedVariant.removeParameter(sProperty);
					oMergedVariant.removeSelectOption(sProperty);
					oMergedVariant.massAddSelectOption(sProperty, oVariant.getSelectOption(sProperty));
				});
				// copy parameters
				aVariantParameters = oVariant.getParameterNames();
				aVariantParameters.forEach(function (sParam) {
					oMergedVariant.removeParameter(sParam);
					oMergedVariant.removeSelectOption(sParam);
					oMergedVariant.addParameter(sParam, oVariant.getParameter(sParam));
				});
			});

			return oMergedVariant;
		}

		/** 
		* Invoked when the filter defaults are to be picked up from the Selection Variant Annotation.

		* @param {object} oSelectionVariantFromAnnotation
		* @param {object} oSmartFilterbar
		* @returns {object} A selection variant object with the defaults from the annotations.
		*/
		function fnCreateSVObject (oSelectionVariantFromAnnotation, oSmartFilterbar) { //TODO: Revisit this and discuss with the FilterBar the possibility of setting UIState with SV that you get from annotation
			var aSelectOptions = oSelectionVariantFromAnnotation.SelectOptions;
			var aParameters = oSelectionVariantFromAnnotation.Parameters ? fnGetSelectionVariantParameterNamesWithoutNavigation(oSelectionVariantFromAnnotation.Parameters) : [];
			var oDummyContext = new Context(null, "/");
			var oDefaultSV = {};

			if (aSelectOptions) {
				aSelectOptions.forEach(function(selectOption) {
					selectOption.PropertyName = selectOption.PropertyName.PropertyPath;
					selectOption.Ranges.forEach(function(range) {
						range.Sign = range.Sign.EnumMember.split("/")[1];
						range.Option = range.Option.EnumMember.split("/")[1];
						range.Low = range.Low && ODataAnnotationHelper.format(oDummyContext, range.Low);
						range.High = range.High && ODataAnnotationHelper.format(oDummyContext, range.High);
					});
				});
				oDefaultSV.SelectOptions = aSelectOptions;
			}
			//All ALP apps are analytical apps but not all LR apps are analytical. Hence, the check for the property "considerAnalyticalParameters" before adding parameters.
			if (oSmartFilterbar.getConsiderAnalyticalParameters()) {
				aParameters.forEach(function(parameter) {
					parameter.PropertyName = parameter.PropertyName.PropertyPath;
					parameter.PropertyValue = ODataAnnotationHelper.format(oDummyContext, parameter.PropertyValue) || null;
				});
				oDefaultSV.Parameters = aParameters;
			}
			return new SelectionVariant(oDefaultSV);
		}

		/**
		 * This function will return the correct paramter name
		 * @param {Array} aSelectionVariantParameters array of SV parameter objects
		 * @returns {Array} array of parameter objects with correct parameter name
		 */
		function fnGetSelectionVariantParameterNamesWithoutNavigation(aSelectionVariantParameters) {
			var aParameters = aSelectionVariantParameters && aSelectionVariantParameters.map(function(oParam) {
				return extend({}, oParam, {
					PropertyName: {
						PropertyPath: oParam.PropertyName.PropertyPath.split("/").pop()
						}
					}
				);
			});
			return aParameters;
		}

		return {
			handleErrorsOnTableOrChart: fnHandleErrorsOnTableOrChart,
			getMergedVariants: fnMergeVariants,
			createSVObject: fnCreateSVObject,
			getSelectionVariantParameterNamesWithoutNavigation: fnGetSelectionVariantParameterNamesWithoutNavigation
		};
	});
