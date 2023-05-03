sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/ui/model/Sorter",
	"sap/ui/core/MessageType",
	"sap/suite/ui/generic/template/lib/MessageUtils",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper"
], function(BaseObject, extend, Sorter, MessageType, MessageUtils, controlHelper) {
	"use strict";

	// This class is responsible for grouping and sorting of messages in the message popover.
	// Each object page controller will use an instance of this class for this purpose.
	function getMethods(oController, oTemplateUtils, oObjectPage) {
		
		var bTraditional = true;
		
		// Maps message ids to information where these messages are placed on the page.
		// It is a cash storing the information that is used for grouping and sorting of the messages.
		var mMessageToPlacementInfo;
		
		var mTableIdToTableInfo;
		
		function fnBeforeRebind(){
			// refresh the cashes for every new object instance to avoid accumulation of garbage
			mMessageToPlacementInfo = Object.create(null);
			mTableIdToTableInfo = Object.create(null); 
		}
		
		// This function retrieves placement info for a message on the object page. The placement info is an object possessing the following properties:
		// - controlIds -> the array of control ids (aControlIds) which was given when the placement info was created
		// - controlId -> one of the entries within aControlIds which has been identified as the right placement of the message (that means that it is visible), resp. faulty if no control could be found
		// - pathToControlId -> an array of controlIds starting with the id of the view down to controlId representing the path via a parent-child relationship (empty if controlId is faulty)
		// - groupers -> an array of controls representing the group the message should belong to.
		//   Currently this array consists of the section that contains the control identified by controlId or is an empty array
		// Note that mMessageToPlacementInfo is used as a cash, so that the corresponding information can be reused when the same message id with the same (relevant) list of control ids is passed again.
		function getMessagePlacementInfo(sMsgId, aControlIds) {
			var oRet = mMessageToPlacementInfo[sMsgId];
			if (oRet) { // check whether if is needs to be invalidated due to change of aControlIds
				aControlIds.some(function (sControlId, i) {
					if (sControlId !== oRet.controlIds[i]) { // a difference in the control ids was found -> invalidate the result
						oRet = null;
						return true;
					}
					return sControlId === oRet.controlId; // if the control id responsible up to now was found -> keep old result
				});
			}
			if (!oRet) { // need to determine the placement info
				oRet = {};
				var mChildToParent = Object.create(null);
				var onElementVisited = function (sElementId, oControl, oChild) { // will be called for sElementId being a member of aControlIds and oControl being one of its ancestors, oChild is a child of oControl and was visited previously
					if (oChild) {
						mChildToParent[oChild.getId()] = oControl;
					}
				};
				oRet.controlId = oTemplateUtils.oCommonUtils.getPositionableControlId(aControlIds, true, onElementVisited);
				var aPathToControlId = [];
				var oSection, oTable;
				for (var sControlId = oRet.controlId; sControlId;) {
					aPathToControlId.push(sControlId);
					var oParent = mChildToParent[sControlId];
					oSection = oSection || (oParent && controlHelper.isObjectPageSection(oParent) && oParent);
					oTable = oTable || (oParent && controlHelper.isSmartTable(oParent) && oParent);
					sControlId = oParent && oParent.getId();
				}
				aPathToControlId.reverse();
				oRet.pathToControlId = aPathToControlId;
				if (oRet.controlId) {
					var oTarget = oController.byId(oRet.controlId);
					if (!oSection) {
						oTable = null;
						oSection = controlHelper.isObjectPageSection(oTarget) && oTarget;
					} else {
						oTable = oTable || (controlHelper.isSmartTable(oTarget) && oTarget);
					}
				}
				oRet.groupers = oSection ? [oSection] : [];
				if (oTable) {
					var oPresentationControl = oTemplateUtils.oCommonUtils.getOwnerPresentationControl(oTable);
					var oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oPresentationControl);
					var sViewBindingPath = oTemplateUtils.oComponentUtils.getBindingPath();
					var sTableBindingPath = oPresentationControlHandler.getBindingPath();
					var sFullTableBindingPath = sViewBindingPath + "/" + sTableBindingPath;
					oRet.groupers.push(oTable);
					oRet.getItemBindingPath = bTraditional ? Function.prototype : function(){
						var oMessage = MessageUtils.getMessageById(sMsgId);
						if (!oMessage){
							return null;
						}
						var sFullTarget = oMessage.aFullTargets.find(function(sCandidate){
							return sCandidate.startsWith(sFullTableBindingPath);
						});
						if (!sFullTarget){
							return null;
						}
						var sTail = sFullTarget.substring(sFullTableBindingPath.length);
						var sKey = sTail.split("/")[0];
						return sFullTableBindingPath + sKey;
					};
				} else {
					oRet.getItemBindingPath = Function.prototype;
				}
				oRet.controlIds = aControlIds;
				mMessageToPlacementInfo[sMsgId] = oRet; // add to the cash	
			}
			return oRet;
		}
		
		function getTableInfo(oTable){
			var sTableId = oTable.getId();
			var oRet = mTableIdToTableInfo[sTableId];
			if (!oRet){
				oRet = createTableInfo(oTable);
				mTableIdToTableInfo[sTableId] = oRet;	
			}
			return oRet;
		}
		
		function createTableInfo(oTable){
			var mRet = {};
			var oPresentationControl = oTemplateUtils.oCommonUtils.getOwnerPresentationControl(oTable);
			var oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oPresentationControl);
			var aContexts = oPresentationControlHandler.getCurrentContexts() || [];
			aContexts.forEach(function(oContext, i){
				var aMessages = (oContext && oContext.getMessages()) || [];
				aMessages.forEach(function(oMessage){
					mRet[oMessage.id] = {
						context: oContext,
						index: i
					};
				});
			});
			return mRet;
		}

		// Function to get group title of a message. Messages are grouped based on section names, means it will return the section name,
		// to which a message belongs to. If a messages does not belong to any of section a default group name is returned
		function getGroupTitle(sMsgId, aControlIds) {
			if (!mMessageToPlacementInfo) { // call of grouper before initialization has happened -> can be ignored
				return "";
			}
			var oPlacementInfo = aControlIds && getMessagePlacementInfo(sMsgId, aControlIds);
			var aGroupers = oPlacementInfo ? oPlacementInfo.groupers : [];
			switch (aGroupers.length) {
				case 0:
					return oTemplateUtils.oCommonUtils.getText("GENERIC_MESSAGE_GROUP_NAME");
				case 1:
					return aGroupers[0].getTitle();
				default:
					var sTitle = aGroupers[0].getTitle();
					var oTable = aGroupers[1];
					var sTableHeader = oTable.getHeader();
					return oTemplateUtils.oCommonUtils.getText("MESSAGE_GROUP_TABLE", [sTitle, sTableHeader]);
			}
		}
		var oMessageSorter = new Sorter("");

		// This function returns bias value based on the type of message
		function getBiasForMessageType(sMessageType) {
			switch (sMessageType) {
				case MessageType.Error:
					return 1;
				case MessageType.Warning:
					return 2;
				case MessageType.Success:
					return 3;
				case MessageType.Information:
					return 4;
				case MessageType.None:
					return 5;
				default:
					return 6;
			}
		}

		// Sorter that compares the position of two child controls which have a common parent. One (but not both) of the children might be faulty (which would make it the larger one).
		// Returns a positive integer when oChild1 is larger, a negative number if oChild2 is larger, and 0 if they are identical
		function fnControlSorter(oCommonParent, oChild1, oChild2) {
			if (!oChild1) {
				return oChild2 ? 1 : 0;
			}
			if (!oChild2) {
				return -1;
			}
			return controlHelper.sortChildControls(oCommonParent, oChild1, oChild2);
		}

		// Sorting is done based on the loaction of control, like in which section control is present
		oMessageSorter.fnCompare = function (oMsgObj1, oMsgObj2) {
			var oPlacementInfo1 = getMessagePlacementInfo(oMsgObj1.id, oMsgObj1.controlIds);
			var oPlacementInfo2 = getMessagePlacementInfo(oMsgObj2.id, oMsgObj2.controlIds);
			var bSameGroup = oPlacementInfo1.groupers.length === oPlacementInfo2.groupers.length && oPlacementInfo1.groupers.every(function (oControl, i) {
				return oPlacementInfo2.groupers[i] === oControl;
			});
			if (bSameGroup) {
				var sItemBindingPath1 = oPlacementInfo1.getItemBindingPath();
				var sItemBindingPath2 = oPlacementInfo2.getItemBindingPath();
				if (sItemBindingPath1 !== sItemBindingPath2){
					var oTable = oPlacementInfo1.groupers[1];
					var mTableInfo = getTableInfo(oTable);
					var oTableInfo1 = mTableInfo[oMsgObj1.id];
					var oTableInfo2 = mTableInfo[oMsgObj2.id];
					if (oTableInfo1 && oTableInfo2){
						return oTableInfo1.index - oTableInfo2.index;
					}
					if (oTableInfo1 || oTableInfo2){
						return 1 - 2 * !oTableInfo2;
					}
					return ("" + sItemBindingPath1).localeCompare("" + sItemBindingPath2);
				}
				var iRet = getBiasForMessageType(oMsgObj1.type) - getBiasForMessageType(oMsgObj2.type); // check whether they can be sorted by severity
				if (iRet || !(oPlacementInfo1.controlId || oPlacementInfo2.controlId)) { // if yes, we are done. We are also done, if both messages could not be assigned to a place on the UI
					return iRet;
				}
			}
			if (!bSameGroup && (oPlacementInfo1.groupers.length === 1 || oPlacementInfo2.groupers.length === 1) && oPlacementInfo1.groupers[0] === oPlacementInfo2.groupers[0]) {
				// message belong to the same section, but one belongs to a table and one canot be associated to a table
				return oPlacementInfo1.groupers.length - oPlacementInfo2.groupers.length;
			}
			var aPath1 = oPlacementInfo1.pathToControlId;
			var aPath2 = oPlacementInfo2.pathToControlId;
			var iMaxPathLength = Math.max(aPath1.length, aPath2.length);
			var oCore = sap.ui.getCore();
			for (var i = 0; i < iMaxPathLength; i++) {
				if (aPath1[i] !== aPath2[i]) {
					if (i === 0) {
						return fnControlSorter(oObjectPage, oPlacementInfo1.groupers[0], oPlacementInfo2.groupers[0]);
					}
					return fnControlSorter(oCore.byId(aPath1[i - 1]), (i < aPath1.length) && oCore.byId(aPath1[i]), (i < aPath2.length) && oCore.byId(aPath2[i]));
				}
			}
			return 0;
		};
		
		function getMessageSorter(){
			return oMessageSorter;
		}
		
		function getSubtitle(sMsgId, aControlIds, sAdditionalText, fnNewHeartbeat){
			var oPlacementInfo = getMessagePlacementInfo(sMsgId, aControlIds);
			var oTable = oPlacementInfo.groupers[1];
			if (!oTable){
				return sAdditionalText;
			}
/*			var mTableInfo = getTableInfo(oTable);
			var oTableInfo = mTableInfo[sMsgId];
			if (oTableInfo){
				var oContext = oTableInfo.context;
			}
*/			return sAdditionalText;
		}

		// public instance methods
		return {
			beforeRebind: fnBeforeRebind,
			getMessageSorter: getMessageSorter,
			getGroupTitle: getGroupTitle,
			getSubtitle: getSubtitle
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.MessageSortingHandler", {
		constructor: function(oController, oTemplateUtils, oObjectPage) {
			extend(this, getMethods(oController, oTemplateUtils, oObjectPage));
		}
	});
});
