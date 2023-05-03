/*
	This class contains all functions used during templating for action buttons.
*/
sap.ui.define([
	"sap/suite/ui/generic/template/js/AnnotationHelper",
	"sap/ui/Device"
], function(AnnotationHelper, Device) {
	"use strict";
	
	// This method takes a binding string and returns a binding string that represents the same term, but can be put as part into an expression binding.
	// Note that binding strings which represent a composite binding witch concatenation (like "abc{myModel>/myParameter}") are not supported.
	function fnMakeBindingCombinable(sBindingString){
		if (!sBindingString.startsWith("{")){ // if it does not start with a "{" it should be a constant
			return sBindingString;
		}
		if (sBindingString.startsWith("{=")){ // an expression binding. Get the real expression out of it and 
			var sRet = sBindingString.slice(2, -1).trim(); // get the real expression out of it
			return sRet.indexOf(" ") < 0 ? sRet : "(" + sRet + ")"; // if it contains a space we assume that it contains an operator. Hence, we put it into brackets.
		}
		return "$" + sBindingString; // if it was not already an expression binding, prepare it to be contained in one
	}
	
	// This function combines an array of expression by a given associcative operator to one binding. Thereby all members of aExpressions which are empty strings are ignored.
	// sNeutral should be the neutral element for the associative operator.
	// sZero might be a zero element for the associative operator (that is an element which fixes the value of the operation to itself if present in the list of operands)
	function fnCombineByOperator(sOperator, aExpressions, sNeutral, sZero){
		var bIsZero = false;
		var aRealExpressions = aExpressions.filter(function(sExpression){
			bIsZero = bIsZero || sExpression === sZero;
			return sExpression !== ""  && sExpression !== sNeutral;
		});
		if (bIsZero){ // one expression was a zero -> result is zero
			return sZero;
		}
		if (aRealExpressions.length === 0){
			return sNeutral;
		}
		if (aRealExpressions.length === 1 && aRealExpressions[0].indexOf("${") < 0){ // only one binding that is not an expression
			return aRealExpressions[0];
		}
		return "{= " + aRealExpressions.map(fnMakeBindingCombinable).join(" " + sOperator + " ") + " }";
	}
	
	// This function combines the expressions given by AND and returns a corresponding binding string
	function fnCombineByAnd(){
		return fnCombineByOperator("&&", Array.from(arguments), "true", "false");
	}

	function getParentPathExpression(oInterface, oEntitySet, mRestrictions, sSection, oTreeNode){
		var oPath =  mRestrictions && mRestrictions[sSection];
		var sPath = oPath && oPath.Path;
		if (sPath) { // if there is a path, add it to the condition
			AnnotationHelper._actionControlExpand(oInterface, sPath, oEntitySet.entityType); // ensure that the fields used in the path are part of the binding string
			return "{= !!${" + oTreeNode.specificModelName + ">" + sPath + "}}";
		}
		return "";
	}

	function getPathExpression(oInterface, oEntitySet, mRestrictions, sSection){
		var oPath =  mRestrictions && mRestrictions[sSection];
		var sPath = oPath && oPath.Path;
		if (sPath) { // if there is a path, add it to the condition
			AnnotationHelper._actionControlExpand(oInterface, sPath, oEntitySet.entityType); // ensure that the fields used in the path are part of the binding string
			return "!!${" + sPath + "}";
		}
		return "";
	}

	/**
	 * In case of non-draft FCL application hide the edit and delete button when 3rd column is open.
	 * @param {Object} oAppComponent - the app component
	 * @param {Object} oTreeNode - node contains all the information about the navigation and other settings which help in navigation.
	 * @returns {String} return the expression for the FCL non-draft case
	 */
	function getFCLPathExpression(oAppComponent, oTreeNode, sActionType) {
		// if the application is non-draft and in fcl layout with 3rd column opened
		// and the device is not phone
		// hide the edit and delete button of the 2nd column
		var oNonDraftFCLSettings = !oTreeNode.isDraft && oTreeNode.children.length && !Device.system.phone && oAppComponent.getFlexibleColumnLayout();	
		if (oNonDraftFCLSettings && oTreeNode.fCLLevel < ((oNonDraftFCLSettings.maxColumnsCount || 3) - 1)) {
			return "${_templPrivGlobal>/generic/FCL/highestViewLevel} === " + oTreeNode.level;
		}
		//in draft apps show Edit action when fullscreen
		if (sActionType === "Edit" && oTreeNode.isDraft && oTreeNode.level > 1 && oAppComponent.getFlexibleColumnLayout()) {
			return "${_templPrivGlobal>/generic/FCL/isVisuallyFullScreen}";
		}

		return "";
	}

	// Returns whether the Edit button is needed at all
	// bParameterEdit is true, when an external edit has been specified in the manifest. This would overrule a boolean constant in mRestrictions, but not a path.
	function isEditButtonRequired(oInterface, mRestrictions, oEntitySet, bParameterEdit, aAncestorTreeNodes, bIsDraftEnabled) {
		var bForbiddenByAncestors = bIsDraftEnabled && aAncestorTreeNodes.some(function(oAncestorNode){
			if (oAncestorNode.level > 0) {
				var oParentEntitySet = oAncestorNode.entitySetDefinition;
				var mParentUpdateRestriction = oParentEntitySet && oParentEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"];
				var bUpdateRestriction = AnnotationHelper.areBooleanRestrictionsValidAndPossible(oInterface, mParentUpdateRestriction, oParentEntitySet, "Updatable", undefined, bParameterEdit);
				// if parent pages has update restriction do not show Edit button in child page
				return mParentUpdateRestriction && !bUpdateRestriction; 
			}
		});
		return !bForbiddenByAncestors && AnnotationHelper.areBooleanRestrictionsValidAndPossible(oInterface, mRestrictions, oEntitySet, "Updatable", undefined, bParameterEdit);
	}
	isEditButtonRequired.requiresIContext = true;

	// Returns the visibility for the EDIT button on the object page
	function getEditActionButtonVisibility(oInterface, mRestrictions, oEntitySet, oAppComponent, oTreeNode, aAncestortreeNodes) {
		var sGeneralExpression = "!${ui>/editable}";  // logical condition for the edit button
		
		//oTreeNode.isDraft is use to show "Hide Draft Values" or "Show Draft Values" button in List Report table toolbar and "Display Saved version/Return to Draft" button in Object page header for a draft application.
		var sToggleExpression = "";
		if (oTreeNode.isDraft && oTreeNode.level === 1){ // Exclude the situation that there is already a draft for this user (in this case the CONTINUE_EDITING-button would be shown).
			sToggleExpression = "!${DraftAdministrativeData/DraftIsCreatedByMe}";
			AnnotationHelper.formatWithExpandSimple(oInterface, {Path : "DraftAdministrativeData/DraftIsCreatedByMe"}, oEntitySet);// This is to add navigation parameters to the request.
		}
		var sFCLExpression = getFCLPathExpression(oAppComponent, oTreeNode, "Edit");
		var sPathExpression = getPathExpression(oInterface, oEntitySet, mRestrictions, "Updatable"); // if there is an updatable path, add it to the condition
		var aParentPath = [], sParentPath = "";
		// for Draft enabled application, check if any parent entity set has update restriction
		if (oTreeNode.isDraft) {
			aAncestortreeNodes.forEach( function (oAncestorNode) {
				if (oAncestorNode.level > 0) {
					var oParentEntitySet = oAncestorNode.entitySetDefinition;
					var mParentUpdateRestriction = oParentEntitySet && oParentEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"];
					aParentPath.push(getParentPathExpression(oInterface, oParentEntitySet, mParentUpdateRestriction, "Updatable", oAncestorNode));
					if (oAncestorNode.level === 1){
						sToggleExpression = "!${" + oAncestorNode.specificModelName + ">DraftAdministrativeData/DraftIsCreatedByMe}";
					}
				}
			});
			sParentPath = fnCombineByAnd.apply(null, aParentPath);
		}
		return fnCombineByAnd(sGeneralExpression, sToggleExpression, sFCLExpression, sPathExpression, sParentPath);
	}
	getEditActionButtonVisibility.requiresIContext = true;

	// Returns the visibility for the DELETE button on main object page
	function getDeleteActionButtonVisibility(oInterface, mRestrictions, oEntitySet, oAppComponent, oTreeNode){
		var sGeneralExpression; // logical condition for the delete button
		if (oTreeNode.isDraft){ // on main object page the delete button is shown in display mode on subobject pages in edit mode
			sGeneralExpression = oTreeNode.level === 1 ? "!${ui>/editable}" : "{ui>/editable}";
		} else { // in non-draft case the button is always shown with exception of create mode
			sGeneralExpression = "!${ui>/createMode}";
		}
		var sFCLExpression = getFCLPathExpression(oAppComponent, oTreeNode, "Delete");
		var sPathExpression = getPathExpression(oInterface, oEntitySet, mRestrictions, "Deletable"); // if there is a deletable path, add it to the condition
		return fnCombineByAnd(sGeneralExpression, sFCLExpression, sPathExpression);
	}
	getDeleteActionButtonVisibility.requiresIContext = true;

	function getActionControlBreakoutVisibility(sActionApplicablePath){
		return !sActionApplicablePath || "{path: '" + sActionApplicablePath + "'}";
	}

	function getCallAction(oDataField, sActionId) {
		var sAction = oDataField.Action.String;
		var sInvocationGrouping = (oDataField.InvocationGrouping && oDataField.InvocationGrouping.EnumMember) || "";
		var bIsCopyAction = (oDataField["com.sap.vocabularies.UI.v1.IsCopyAction"] && oDataField["com.sap.vocabularies.UI.v1.IsCopyAction"].Bool === "true") || false;
		
		return "._templateEventHandlers.onCallAction('" + sAction + "', '" + sActionId + "', '" + sInvocationGrouping + "', " + bIsCopyAction + ")";
	}
	
	function getDatafieldForActionVisibility(oInterface, sActionApplicablePath, sEntityType, oDataField, bIsDraftEnabled){
		var sConditionFromDraft = bIsDraftEnabled ? "" : "!${ui>/createMode}";
		var sConditionFromPath = "";
		//If UI.Hidden annotation is used, UI.Hidden gets the highest priority
		if (oDataField["com.sap.vocabularies.UI.v1.Hidden"]) { //If UI.Hidden annotation is used, UI.Hidden gets the highest priority
			var vConditionFromPath = AnnotationHelper.getBindingForHiddenPath(oDataField); // Could be string or boolean
			sConditionFromPath = vConditionFromPath.toString();
		} else if (sActionApplicablePath) {
			AnnotationHelper._actionControlExpand(oInterface, sActionApplicablePath, sEntityType); // ensure that necessary expands are collected
			sConditionFromPath = "{" + sActionApplicablePath + "}";
		}
		// Combine the conditions. Note that the visible property takes true as default, which will also be used if this expression evaluates
		// to something faulty which is not exactly false (e.g. ""). Therefore, (and because && is not commutative) it is important to
		// put sConditionFromDraft first. This surely evaluates to a boolean value. If it evaluartes to true and sConsitionFromDraft evaluates
		// to anything not equal false the control will be visible.
		return fnCombineByAnd(sConditionFromDraft, sConditionFromPath);		
	}
	getDatafieldForActionVisibility.requiresIContext = true;

	return {
		isEditButtonRequired: isEditButtonRequired,
		getEditActionButtonVisibility: getEditActionButtonVisibility,
		getDeleteActionButtonVisibility: getDeleteActionButtonVisibility,
		getActionControlBreakoutVisibility: getActionControlBreakoutVisibility,
		getCallAction: getCallAction,
		getDatafieldForActionVisibility: getDatafieldForActionVisibility
	};
}, /* bExport= */ true);
