sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/ui/model/Filter",
	"sap/suite/ui/generic/template/lib/MessageStripHelper",
	"sap/suite/ui/generic/template/lib/MessageUtils"
], function (BaseObject, extend, Filter, MessageStripHelper, MessageUtils) {
	"use strict";

	// Adapter class to make sap.suite.ui.generic.template.lib.MessageStripHelper usable for object page.
	// oMultipleViewsHandler is the MultipleViewsHandler of the OP. 
	function getMethods(oMultipleViewsHandler, oController, oTemplateUtils, oMessageButtonHelper) {

		var mSmartControlIdToMeta = Object.create(null);
		
		var oUIModel = oController.getOwnerComponent().getModel("ui");
		// Ensure that all necessary actions are taken care of when edit mode changes.
		// This is currently to ensure that all DataStateIndicators will be refreshed.		
		oUIModel.bindProperty("/editable").attachChange(fnRefreshDataStateIndicatorsOfTables);
		oMessageButtonHelper.registerExternalListener(fnRefreshDataStateIndicatorsOfTables);

		function getMeta(sSmartTableId){
			var oRet = mSmartControlIdToMeta[sSmartTableId];
			if (!oRet){
				oRet = {
					maxBackendSeverity: -1,
					customSeverity: -2,
					waiting: []
				};
				mSmartControlIdToMeta[sSmartTableId] = oRet;
			}
			return oRet;
		}
		
		function setCustomMessage(oMessage, sSmartTableId, vTabKey, onClose){
			var oMeta = getMeta(sSmartTableId);
			if (oMeta.implementingHelper) {
				oMeta.customSeverity = -2;
				oMeta.implementingHelper.setCustomMessage(oMessage, vTabKey, onClose);
			} else {
				oMeta.waiting.push({
					message: oMessage,
					tabKey: vTabKey,
					onClose: onClose
				});
			}
		}

		function initSmartTable(oSmartTable, sCurrentFacet) {
			var sSmartTableId = oSmartTable.getId();
			var oMeta = getMeta(sSmartTableId);
			var mTabToGetPresentationControlHandler = oMultipleViewsHandler.getKeyToPresentationControlHandler(oSmartTable);
			var bHasTabs = !!mTabToGetPresentationControlHandler;
			if (!bHasTabs) {
				mTabToGetPresentationControlHandler = {
					"": function () {
						return oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartTable);
					}
				};
			}
			oMeta.implementingHelper = new MessageStripHelper(mTabToGetPresentationControlHandler, oController, oTemplateUtils);
			if (bHasTabs) { // Make sure that oImplementingHelper is updated on changes of the selcted key 
				var sSectionKey = sCurrentFacet;
				oMultipleViewsHandler.getInitializationPromise(sSectionKey).then(function() {
					oMeta.implementingHelper.setCurrentTab(oMultipleViewsHandler.getSelectedKey(sSectionKey));
					oMultipleViewsHandler.registerKeyChange(oSmartTable, oMeta.implementingHelper.setCurrentTab);
				});
			} else {
				oMeta.implementingHelper.setCurrentTab("");
			}
			oMeta.waiting.forEach(function(oWaiting){
				oMeta.implementingHelper.setCustomMessage(oWaiting.message, oWaiting.tabKey, oWaiting.onClose);
			});
			delete oMeta.waiting;
		}

		function onBeforeRebindControl(oEvent){
			var oSmartTable = oEvent.getSource();
			var sSmartTableId = oSmartTable.getId();
			var oMeta = mSmartControlIdToMeta[sSmartTableId];
			if (oMeta) {
				oMeta.implementingHelper.onBeforeRebindControl(oEvent);
			}
		}

		function fnTriggerRefresh(oMeta){
			if (oMeta.maxBackendSeverity !== -1){
				oMeta.refreshTriggered = true;
				setTimeout(function(){
					if (oMeta.refreshTriggered){
						oMeta.refreshTriggered = false;
						var oCurrentCustomMessage = oMeta.implementingHelper.getCurrentCustomMessage();
						oMeta.customSeverity = oCurrentCustomMessage ? MessageUtils.getSeverityAsNumber(oCurrentCustomMessage) : -2;						
						oMeta.implementingHelper.refresh();
					}
				}, 0);
			}
		}
		
		function dataStateFilter(oMessage, oSmartTable) {
			var sSmartTableId = oSmartTable.getId();
			var oMeta = mSmartControlIdToMeta[sSmartTableId];
			if (oMeta.refreshTriggered) {
				return false;
			}
			if (oUIModel.getProperty("/editable")) {
				var oCurrentCustomMessage = oMeta.implementingHelper.getCurrentCustomMessage();
				var bIsCurrentCustomMessage = oMessage === oCurrentCustomMessage;
				var bIsOtherCustomMessage = !bIsCurrentCustomMessage && oMessage.persistent;
				if (bIsOtherCustomMessage){ // a custom message which is currently not valid
					return false;
				}
				if (!oCurrentCustomMessage){ // oMessage is a backend message and there is no message which overshadows it 
					return true;
				}
				var iMessageSeverity = MessageUtils.getSeverityAsNumber(oMessage);
				if (bIsCurrentCustomMessage){
					var bSeverityChanged = iMessageSeverity !== oMeta.customSeverity;
					if (bSeverityChanged){
						fnTriggerRefresh(oMeta);
					}
					return iMessageSeverity >= oMeta.maxBackendSeverity;
				} else { // backend message
					if (oMeta.maxBackendSeverity > oMeta.customSeverity){ // there is already one backend message that justifies all backend messages to be shown OR there is no custom message known yet
						oMeta.maxBackendSeverity = Math.max(oMeta.maxBackendSeverity, iMessageSeverity); // just for the book-keeping
						return true;
					}
					if (iMessageSeverity <= oMeta.customSeverity){ // we assume backend messages must be suppressed and this message does not change this assumption
						oMeta.maxBackendSeverity = Math.max(oMeta.maxBackendSeverity, iMessageSeverity); // just for the book-keeping
						return false;
					}
					// When we come here our decision has changed from assuming that backend messages will be suppressed to assuming custom message should be suppressed
					fnTriggerRefresh(oMeta); 
					oMeta.maxBackendSeverity = iMessageSeverity;
					return true;
				}
			} else {			
				return  oMeta.implementingHelper.dataStateFilter(oMessage, oSmartTable);
			}
		}
		
		function fnRefreshDataStateIndicatorsOfOneTable(oMeta){
			if (oMeta.implementingHelper){
				oMeta.maxBackendSeverity = -1;
				var oCurrentCustomMessage = oMeta.implementingHelper.getCurrentCustomMessage();
				oMeta.customSeverity = oCurrentCustomMessage ? MessageUtils.getSeverityAsNumber(oCurrentCustomMessage) : -2;
				oMeta.refreshTriggered = false;
				oMeta.implementingHelper.refresh();
			}
		}
		
		// Refreshes the Data state indicators for all tables for which at least one message has been reported
		function fnRefreshDataStateIndicatorsOfTables(){
			for (var sTabId in mSmartControlIdToMeta) {
				var oMeta = mSmartControlIdToMeta[sTabId];
				fnRefreshDataStateIndicatorsOfOneTable(oMeta);
			}				
		}
		
		function isCustomMessage(oMessage){
			for (var sTabId in mSmartControlIdToMeta){
				var oMeta = mSmartControlIdToMeta[sTabId];
				if (oMeta.implementingHelper && oMeta.implementingHelper.isCustomMessage(oMessage)){
					return true;
				}
			}
			return false;
		}
		
		function onClose(oEvent){
			var oDataStateIndicator = oEvent.getSource();
			var oSmartTable = oDataStateIndicator.getParent();
			var sSmartTableId = oSmartTable.getId();
			var oMeta = mSmartControlIdToMeta[sSmartTableId];
			oMeta.implementingHelper.onClose();
		}

		return {
			setCustomMessage: setCustomMessage,
			initSmartTable: initSmartTable,
			onBeforeRebindControl: onBeforeRebindControl,
			dataStateFilter: dataStateFilter,
			isCustomMessage: isCustomMessage,
			onClose: onClose
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.listTemplates.controller.MessageStripHelper", {
		constructor: function (oMultipleViewsHandler, oController, oTemplateUtils, oMessageButtonHelper) {
			extend(this, getMethods(oMultipleViewsHandler, oController, oTemplateUtils, oMessageButtonHelper));
		}
	});
});
