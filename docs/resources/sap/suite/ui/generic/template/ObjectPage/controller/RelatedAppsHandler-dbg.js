sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend"
], function (BaseObject, extend) {
	"use strict";

	function getMethods(oController, oTemplateUtils) {

		function getRelatedAppsSheet() {
			return oTemplateUtils.oCommonUtils.getDialogFragmentAsync(
				"sap.suite.ui.generic.template.ObjectPage.view.fragments.RelatedAppsSheet", {
					buttonPressed: function (oEvent) {
						var oButton = oEvent.getSource();
						var oButtonsContext = oButton.getBindingContext("buttons");
						var oLink = oButtonsContext.getProperty("link");
						var oParam = oButtonsContext.getProperty("param");
						var str = oLink.intent;
						var sSemanticObject = str.split("#")[1].split("-")[0];
						var sAction = str.split("-")[1].split("?")[0].split("~")[0];
						var oTarget = {
							semanticObject: sSemanticObject,
							action: sAction,
							parameters: oParam
						};
						oTemplateUtils.oCommonUtils.fnProcessDataLossOrDraftDiscardConfirmation(function () {
							var oContext = oController.getView().getBindingContext();
							oTemplateUtils.oCommonEventHandlers.onRelatedAppNavigation(oTarget, oContext);
						}, Function.prototype, "LeaveApp");
					}
				}, "buttons");
		}

		function getStructuredSemanticObjectActionLinks(oLink) {
			var sIntent = oLink.intent;
			var sSemanticObject = sIntent.split("-")[0].split("#")[1];
			var sAction = sIntent.split("-")[1].split("?")[0];
			return {
				link: oLink,
				semanticObject: sSemanticObject,
				action: sAction
			};
		}

		function getRelatedApps(oEvent) {
			var oButton = oEvent.getSource();
			oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(function () {
				var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
				var oOpenPromise = new Promise(function (fnResolve, fnReject) {
					var oMyIntentPromise = oTemplateUtils.oServices.oApplication.getIntentPromise();
					var oRelatedAppsSheetPromise = getRelatedAppsSheet();
					Promise.all([oMyIntentPromise, oRelatedAppsSheetPromise]).then(function (aResult) {
						var oMyIntent = aResult[0];
						var sCurrentSemObj = oMyIntent.semanticObject;
						var sCurrentAction = oMyIntent.action;
						var oActionSheet = aResult[1];
						var oViewBindingContext = oController.getView().getBindingContext();

						var oMetaModel = oViewBindingContext.getModel().getMetaModel();
						var oEntity = oViewBindingContext.getObject();
						var sEntityType = oEntity.__metadata.type;
						var oDataEntityType = oMetaModel.getODataEntityType(sEntityType);
						var aSemKey = oDataEntityType["com.sap.vocabularies.Common.v1.SemanticKey"];
						var oParam = {};
						if (aSemKey && aSemKey.length > 0) {
							for (var j = 0; j < aSemKey.length; j++) {
								var sSemKey = aSemKey[j].PropertyPath;
								if (!oParam[sSemKey]) {
									oParam[sSemKey] = oEntity[sSemKey];
								}
							}
						} else {
							// Fallback if no SemanticKey
							for (var k in oDataEntityType.key.propertyRef) {
								var sObjKey = oDataEntityType.key.propertyRef[k].name;
								if (!oParam[sObjKey]) {
									oParam[sObjKey] = oEntity[sObjKey];
								}
							}
						}
						var oUshellContainer = sap.ushell && sap.ushell.Container;
						var oXApplNavigation = oUshellContainer && oUshellContainer.getService("CrossApplicationNavigation");
						if (!oXApplNavigation){ // should not happen, as the option is only available when the availability of the service has been checked
							fnReject();
							return;
						}
						//Get all semantic object from manifest setting
						var oSettings = oTemplateUtils.oComponentUtils.getSettings();
						var oRelatedAppsSettings = oSettings.relatedAppsSettings;

						var oLinksDeferred;
						var bHasRelatedAppSettings = oRelatedAppsSettings && Object.keys(oRelatedAppsSettings).length > 0;
						if (bHasRelatedAppSettings) {
							var aSemanticObjects = [[{
								semanticObject: sCurrentSemObj
							}]];

							for (var sKey in oRelatedAppsSettings) {
								if (sKey) {
									aSemanticObjects.push([{
										semanticObject: oRelatedAppsSettings[sKey].semanticObject
									}]);
								}
							}
							oLinksDeferred = oXApplNavigation.getLinks(aSemanticObjects);
						} else {
							var oAppComponent = oController.getOwnerComponent().getAppComponent();
							oLinksDeferred = oXApplNavigation.getLinks({
								semanticObject: sCurrentSemObj,
								params: oParam,
								ui5Component: oAppComponent
							});
						}
						oLinksDeferred.done(function (aLinks) {
							var aSemObjWithLink = [];
							var fnAddLink = function(oLinkDef){
								var oLink = getStructuredSemanticObjectActionLinks(oLinkDef);
								aSemObjWithLink.push(oLink);								
							};
							aLinks.forEach(bHasRelatedAppSettings ? function(aLinks){
								aLinks[0].forEach(fnAddLink);
							} : fnAddLink);

							//Get All Semantic Object Unavailable action
							var getStringProperty = function (oAction) {
								return oAction.String;
							};
							var aSemanticObjectUnavailableActions = oDataEntityType["com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"] || [];
							var aUnavailableActions = aSemanticObjectUnavailableActions.map(getStringProperty);
							oDataEntityType.property.forEach(function (oProperty) {
								var aUnavailbaleActionsForProperty = oProperty["com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"] || [];
								aUnavailableActions = aUnavailableActions.concat(aUnavailbaleActionsForProperty.map(getStringProperty));
							});

							// Remove own semantic object and action
							aSemObjWithLink = aSemObjWithLink.filter(function (oObject) {
								return oObject.semanticObject !== sCurrentSemObj || oObject.action !== sCurrentAction;
							});

							/*
							If Related apps settings applied in manifest setting:
							    - Then It will check wheather user define any dedicated action for that Semantic Object & do filter accordingly using getFilteredListWithManifest funtion
							    - Otherwise It will filter from Unavailable list using getFilteredListWithoutUnavailableActions function.
							Else, If user doesn't define Related apps settings. Then it will filter using Unavailable list.
							Note - "" define self Semantic Object.
							*/
							aSemObjWithLink = aSemObjWithLink.filter(function(oObject){
								var sSettingsKey = oObject.semanticObject === sCurrentSemObj ? "" : oObject.semanticObject;
								var oSemanticObjectAction = bHasRelatedAppSettings && oRelatedAppsSettings[sSettingsKey] && oRelatedAppsSettings[sSettingsKey].semanticObjectAction;
								if (oSemanticObjectAction) {
									for (var sAction in oSemanticObjectAction) {
										if (oSemanticObjectAction[sAction].action === oObject.action) {
											return true;
										}
									}
									return false;
								} else {
									return aUnavailableActions.indexOf(oObject.action) === -1;
								}
							});

							// Sorting the related app links alphabetically to align with Navigation Popover in List Report - BCP(1770251716)
							aSemObjWithLink.sort(function (oElement1, oElement2) {
								if (oElement1.link.text < oElement2.link.text) {
									return -1;
								}
								if (oElement1.link.text > oElement2.link.text) {
									return 1;
								}
								return 0;
							});
							var oButtonsModel = oActionSheet.getModel("buttons");
							var aButtons = aSemObjWithLink.map(function (oSemObjWithLink) {
								return {
									enabled: true, // used in declarative binding
									text: oSemObjWithLink.link.text, // used in declarative binding
									link: oSemObjWithLink.link, // used by the event handler
									param: oParam // used by the event handler
								};
							});
							if (aButtons.length === 0) {
								aButtons.push({
									enabled: false, // used in declarative binding
									text: oTemplateUtils.oCommonUtils.getText("NO_RELATED_APPS") // used in declarative binding
								});
							}
							oButtonsModel.setProperty("/buttons", aButtons);
							fnResolve();
							oBusyHelper.getUnbusy().then(oActionSheet.openBy.bind(oActionSheet, oButton));
						});
						oLinksDeferred.fail(fnReject);
					}, fnReject);
				});
				oBusyHelper.setBusy(oOpenPromise);
			}, true);
		}

		return {
			getRelatedApps: getRelatedApps
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.RelatedAppsHandler", {
		constructor: function (oController, oTemplateUtils) {
			extend(this, getMethods(oController, oTemplateUtils));
		}
	});
});