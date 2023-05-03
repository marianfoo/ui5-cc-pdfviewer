sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/ui/core/message/Message",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function (BaseObject, extend, Message, FeLogger) {
	"use strict";
	
	var	sClassName = "lib.MessageStripHelper";

    var oFeLogger = new FeLogger(sClassName);
    var oLogger = oFeLogger.getLogger();

	var oMessageManager = sap.ui.getCore().getMessageManager();

	// This class is implementing a facility of a message strip attached to a smart control or a accumulation of smart controls.
	// More precisely, the class can be used in the following three different scnearios
	// - There is exactly one smart control for which the corresponding message strip should be displayed
	// - There is exactly one smart control for which the corresponding message strip should be displayed, but the user may switch
	//   between different views on this control. For each view a different message (resp. no message) may be shown in the message strip
	// - There is a collection of smart controls for which are shown exclusively (only one smart control is shown at a time). The user
	//   may switch between these smart controls. For each of these smart controls a different message (resp. no message) may be
	//   shown in the message strip.
	// Thereby scenario 1 will be considered as a trivial case of scenario 2 (or equivalent: of scenario 3).
	//
	// Technically the smart controls are represented by their PresentationControlHandlers and the message strips are realized via
	// the DataStateIndicator. Hence, no messages will be shown for smart controls which have a PresentationControlHandler that does
	// not support the getDataStateIndicator() method or for which this method does not return a corresponding instance.
	//
	// The scenarios are unified in a way that a map mTabToGetPresentationControlHandler is passed to the constructor of this class.
	// The keys of this map are called "tabs" and represent the differrent views (second scenario) resp. the differrent smart controls (third scenario).
	// The corresponding value is a function that returns the corresponding smart control (identical for all in scenario 2).
	// Note that this map is transferred to a more general map mApplicationCustomMessageInfo which has the same keys but holds an object
	// as a value. This object has a method getPresentationControlHandler which is exactly the function named above.
	// In adddition to this immutable member the object will have two properties which change during runtime:
	// - bindingPath: the binding path which is currently valid for the corresponding smart control
	// - message: An instance of sap.ui.core.message.Message implementing the content of the message strip.
	//   This property is faulty if no message should be displayed for the corresponding key.
	//
	// Technically, the messages will be added to the global message model as soon as the binding path for the smart control is known.
	// The binding path is used as target and fullTarget for the corresponding messages. This way they are automatically detected as
	// potential content of the message strip.
	// It is assumed that the DataStateIndicator defines a filter function which is forwarded to the dataStateFilter method of this class.
	// This will ensure that only the message belonging to the currently selected tab will be accepted for the DataStateIndicator.
	// In order to achieve this method setCurrentTab of this class must be called whenever the selected tab changes.
	// Moreover, it must also be ensured that this class is informed about changes of the binding path of the smart controls. Therefore,
	// method onBeforeRebindControl of this class must be called in the onBeforeRebind event of the corresponding control.
	// sPropertyForType param indicates for which component message type is set whether it's alp/listReport
	function getMethods(mApplicationCustomMessageInfo, oController, oTemplateUtils, sPropertyForType) {
		var sCurrentTab; // the key of the current view (scenario 2) resp. current smart control (scenario3)

		var oModel = oController.getOwnerComponent().getModel(); // the OData model acts as a processor for all messages

		var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();

		// This is a private method to set the type of message into template private model
		// If type is present then hide filter bar and if type is null then show filter bar
		function setCustomMessageType(){
			if (sPropertyForType) {
				var oApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sCurrentTab];
				var sPropertyForTypePath = "/" + sPropertyForType;
				var oPresentationControlHandler = oApplicationCustomMessageInfo && oApplicationCustomMessageInfo.getPresentationControlHandler();
				var oDataStateIndicator = oPresentationControlHandler && oPresentationControlHandler.getDataStateIndicator && oPresentationControlHandler.getDataStateIndicator();
				oTemplatePrivateModel.setProperty(sPropertyForTypePath, (oDataStateIndicator && oApplicationCustomMessageInfo.message) ? oApplicationCustomMessageInfo.message.type : null);
			}
		}
		
		// Add message to message manager only if data state indicator is present
		function fnAddMessageToMessageManager(oApplicationCustomMessageInfo) {
			var oPresentationControlHandler = oApplicationCustomMessageInfo && oApplicationCustomMessageInfo.getPresentationControlHandler();
			var oDataStateIndicator = oPresentationControlHandler && oPresentationControlHandler.getDataStateIndicator && oPresentationControlHandler.getDataStateIndicator();
			if (oDataStateIndicator) {   //Only add message if there is Data state indicator to display it
				oApplicationCustomMessageInfo.message.target = oApplicationCustomMessageInfo.bindingPath;
				oApplicationCustomMessageInfo.message.fullTarget = oApplicationCustomMessageInfo.bindingPath;
				oMessageManager.addMessages(oApplicationCustomMessageInfo.message);
				oApplicationCustomMessageInfo.isAddedToMessageManager = true;
			}
		}

		// This is the public method that can be used to set or remove the message which is currently displayed for a tab or a collection of tabs.
		// oMessage: The object which represents the message that should currently be displayed. If it is faulty no message should be shown for the specified tabs.
		//           Otherwise it should be an object containing properties message (text of the message) and type (instance of sap.ui.core.MessageType).
		// vTab: Specifies the affected tabs: faulty -> all tabs affected, string -> identifies the affected tab, array -> lists the affected tabs
		//       If more than one tab is specified in this way these tabs will be considered to belong together for the close feature of the message strip.
		//       This means, that the message will be removed for all these tabs when the user closes the message strip.
		// onClose: An optional function that will be called when the message strip is closed by the user
		function setCustomMessage(oMessage, vTab, onClose) {
			var fnCloseFunction = oMessage && function(){  // The function which will be called when the user closes the message strip.
				(onClose || Function.prototype)();
			}; // The function will alo be used to identify all tabs which belong to the same closing group. Therefore we cannot use onClose || Function.prototype directly.
			for (var sTab in mApplicationCustomMessageInfo) {
				if (vTab && (Array.isArray(vTab) ? vTab.indexOf(sTab) < 0 : vTab !== sTab)) {
					continue; // entry is not affected
				}
				var oApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sTab];
				oApplicationCustomMessageInfo.onClose = fnCloseFunction;
				if (oApplicationCustomMessageInfo.isAddedToMessageManager) { // if there is already a message added to the MessageManager
					if (oMessage && oMessage.message === oApplicationCustomMessageInfo.message.message && oMessage.type === oApplicationCustomMessageInfo.message.type){
						continue; // the same message has been added again -> no need to act
					}
					 // existing message differs from new message and should be removed from the message model (garbage collection)
					oMessageManager.removeMessages(oApplicationCustomMessageInfo.message);
					oApplicationCustomMessageInfo.isAddedToMessageManager = false;
				}
				oApplicationCustomMessageInfo.message = null; // currently we have no message
				if (oMessage) { // if a new message has been specified create the instance of sap.ui.core.message.Message and store it
					oApplicationCustomMessageInfo.message = new Message({
						message: oMessage.message,
						type: oMessage.type,
						processor: oModel,
						persistent: true
					});
					if (oApplicationCustomMessageInfo.bindingPath) { // if table already has a binding path set it as target and add message to MessageModel
						fnAddMessageToMessageManager(oApplicationCustomMessageInfo);
					}
				}
				if (sTab === sCurrentTab) {
					setCustomMessageType();
				}
			}
		}
		
		// Private methos that triggers a new calculation of the content of the message strip
		function fnRefresh(){
			var oApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sCurrentTab];
			var oPresentationControlHandler = oApplicationCustomMessageInfo && oApplicationCustomMessageInfo.getPresentationControlHandler();
			var oDataStateIndicator = oPresentationControlHandler && oPresentationControlHandler.getDataStateIndicator && oPresentationControlHandler.getDataStateIndicator();
			if (oDataStateIndicator){
				oLogger.info("Refresh data state indicator for table " + oDataStateIndicator.getParent().getId());
				oDataStateIndicator.refresh();
			}
		}
		
		// Align to a newly selected tab
		function setCurrentTab(sTab){
			if (sTab === sCurrentTab){
				return;
			}
			sCurrentTab = sTab;
			fnRefresh();   
			setCustomMessageType();          
		}
		
		// Filter for the DataStateIndicator. Ensures that only the message for the currently selected tab will be accepted.
		function fnDataStateFilter(oMessage, oTable){
			var oApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sCurrentTab];
			return !!oApplicationCustomMessageInfo && oApplicationCustomMessageInfo.message === oMessage;
		}
		
		// Will be attached as change handler to all bindings of the smart controls. Ensures that the book-keeping for the binding path is always kept in sync and replaces
		// the message in the message model in case the binding path is changed
		function fnChangeBinding(oPresentationControlHandler, oChangeEvent) {
			var sBindingPath = oChangeEvent.getSource().getPath();
			var sContextPath = oTemplateUtils.oComponentUtils.getBindingPath();
			if (sContextPath) {
				sBindingPath = sContextPath + "/" + sBindingPath;
			}			
			for (var sTab in mApplicationCustomMessageInfo) {
				var	oApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sTab];
				if (oPresentationControlHandler === oApplicationCustomMessageInfo.getPresentationControlHandler() &&
					sBindingPath !== oApplicationCustomMessageInfo.bindingPath) {
					oApplicationCustomMessageInfo.bindingPath = sBindingPath;
					if (oApplicationCustomMessageInfo.message) {
						oMessageManager.removeMessages(oApplicationCustomMessageInfo.message);
						fnAddMessageToMessageManager(oApplicationCustomMessageInfo);
					}
				}
			}
			
		}
		
		// Should be called by the outside in the onBeforeRebind event of any of the affected smart controls.
		// "Adds" fnChangeBinding to the change event of the binding.
		function onBeforeRebindControl(oEvent){
			var oSmartControl = oEvent.getSource();
			var oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartControl);
			var oBindingParams = oEvent.getParameters().bindingParams;
			var fnChangeOld = oBindingParams.events.change || Function.prototype;
			oBindingParams.events.change = function(oChangeEvent){
				fnChangeOld.call(this, oChangeEvent);
				fnChangeBinding(oPresentationControlHandler, oChangeEvent);
			};
		}
		
		// Public method that can be used to distinguish between messages that are handled via this class (true is returned) and messages that come from
		// different (probably backend) sources (false is returned).
		function isCustomMessage(oMessage){
			for (var sTab in mApplicationCustomMessageInfo) {
				var	oApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sTab];
				if (oApplicationCustomMessageInfo.message === oMessage){
					return true;
				}
			}
			return false;
		}
		
		function getCurrentCustomMessage(){
			var oApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sCurrentTab];
			return oApplicationCustomMessageInfo && oApplicationCustomMessageInfo.message;			
		}
		
		// Event handler for the close function of the message strip
		function onClose(){
			var oCurrentApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sCurrentTab];
			if (!oCurrentApplicationCustomMessageInfo.onClose){
				return; // no custom message available for the current tab (message strip has shown backend message)
			}
			var fnOnClose = oCurrentApplicationCustomMessageInfo.onClose;
			for (var sTab in mApplicationCustomMessageInfo) {
				var	oApplicationCustomMessageInfo = mApplicationCustomMessageInfo[sTab];
				if (oApplicationCustomMessageInfo.onClose === fnOnClose){ // if the tab belongs to the same closing group
					oMessageManager.removeMessages(oApplicationCustomMessageInfo.message);
					oApplicationCustomMessageInfo.message = null;
					oApplicationCustomMessageInfo.isAddedToMessageManager = false;
					oApplicationCustomMessageInfo.onClose = null;
				}
			}
			fnOnClose();
			setCustomMessageType();
		}

		return {
			setCurrentTab: setCurrentTab,
			setCustomMessage: setCustomMessage,
			dataStateFilter: fnDataStateFilter,
			onBeforeRebindControl: onBeforeRebindControl,
			isCustomMessage: isCustomMessage,
			getCurrentCustomMessage: getCurrentCustomMessage,
			refresh: fnRefresh,
			onClose: onClose
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.MessageStripHelper", {
		constructor: function (mTabToGetPresentationControlHandler, oController, oTemplateUtils, sPropertyForType) {
			var mApplicationCustomMessageInfo = Object.create(null);
			for (var sTab in mTabToGetPresentationControlHandler){
				var oApplicationCustomMessageInfo = {
					getPresentationControlHandler: mTabToGetPresentationControlHandler[sTab]
				};
				mApplicationCustomMessageInfo[sTab] = oApplicationCustomMessageInfo;
			}					
			extend(this, getMethods(mApplicationCustomMessageInfo, oController, oTemplateUtils, sPropertyForType));
			oTemplateUtils.oServices.oApplication.registerCustomMessageProvider(this);
		}
	});
});
