sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/lib/MessageStripHelper"
], function (BaseObject, extend, MessageStripHelper) {
	"use strict";

	// Adapter class to make sap.suite.ui.generic.template.lib.MessageStripHelper usable for list type templactes (LR and ALP).
	// oPresentationControlHandler represents the "main" smart control. It will only be used in the non-multi view case.
	// oMultipleViewsHandler is the MultipleViewsHandler of the LR/ALP. 
	// sModelSection indicates ALP/LR based on which in template model custom message type is set
	function getMethods(oPresentationControlHandler, oMultipleViewsHandler, oController, oTemplateUtils, sModelSection) {
		// Prepare input for constructor of the generic MessageStripHelper.
		var mTabToGetPresentationControlHandler = oMultipleViewsHandler.getKeyToPresentationControlHandler();
		var bHasTabs = !!mTabToGetPresentationControlHandler;
		if (!bHasTabs){
			mTabToGetPresentationControlHandler = {
				"": function(){
					return oPresentationControlHandler;
				}
			};				
		}
		// Create the instance of the generic MessageStripHelper 
		var oImplementingHelper = new MessageStripHelper(mTabToGetPresentationControlHandler, oController, oTemplateUtils, sModelSection + "/customMessageType");
		if (bHasTabs){ // Make sure that oImplementingHelper is updated on changes of the selcted key 
			oMultipleViewsHandler.getInitializationPromise().then(function() {
				oImplementingHelper.setCurrentTab(oMultipleViewsHandler.getSelectedKey());
				oMultipleViewsHandler.registerKeyChange(oImplementingHelper.setCurrentTab);
			});
		} else {
			oImplementingHelper.setCurrentTab("");	
		}
		
		function setCustomMessage(oMessage, vTab, onClose) {
			oImplementingHelper.setCustomMessage(oMessage, vTab, onClose);
		}
		
		function fnDataStateFilter(oMessage, oTable){
			return oImplementingHelper.dataStateFilter(oMessage, oTable);
		}
		
		function onBeforeRebindControl(oEvent){
			oImplementingHelper.onBeforeRebindControl(oEvent);
		}
		
		function isCustomMessage(oMessage){
			return oImplementingHelper.isCustomMessage(oMessage);	
		}
		
		function onClose(){
			oImplementingHelper.onClose();
		}

		return {
			setCustomMessage: setCustomMessage,
			dataStateFilter: fnDataStateFilter,
			onBeforeRebindControl: onBeforeRebindControl,
			isCustomMessage: isCustomMessage,
			onClose: onClose
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.listTemplates.controller.MessageStripHelper", {
		constructor: function (oPresentationControlHandler, oMultipleViewsHandler, oController, oTemplateUtils, sModelSection) {
			extend(this, getMethods(oPresentationControlHandler, oMultipleViewsHandler, oController, oTemplateUtils, sModelSection));
		}
	});
});
