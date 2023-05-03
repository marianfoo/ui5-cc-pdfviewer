sap.ui.define(["sap/ui/model/odata/AnnotationHelper",
	"sap/ui/comp/smartfield/SmartField",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/strings/formatMessage",
	"sap/base/util/deepExtend",
	"sap/suite/ui/generic/template/js/RuntimeFormatters",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/ui/Device",
	"sap/m/library",
	"sap/ui/core/library",
	"sap/ui/core/IconPool",
	"sap/ui/core/ValueState",
	"sap/suite/ui/generic/template/genericUtilities/metadataAnalyser"
], function (AnnotationHelperModel, SmartField, FeLogger, formatMessage, deepExtend, RuntimeFormatters, StableIdHelper, testableHelper, Device,
	SapMLibrary, SapCoreLibrary, IconPool, ValueState, metadataAnalyser) {
	"use strict";

	var oLogger = new FeLogger("js.AnnotationHelper").getLogger();

	function fnGetFallbackId(oFacet) {
		// If the ID is missing a random value is returned because a duplicate ID error will be thrown as soon as there is
		// more than one form on the UI.
		// only necessary for ids still created by concatenation directly in xml, and only in case of erroneous annotations
		oLogger.error("Error creating stable id for facet with RecordType: " + oFacet.RecordType + " and Target: " + (oFacet.Target && oFacet.Target.AnnotationPath));

		var arr = new Uint32Array( 1 ), limit = Math.pow( 2, 32 );
		// to make it compatible in both IE and chrome
		var crypto = window.crypto || window.msCrypto;
		var nRandomNumber = crypto && crypto.getRandomValues( arr )[ 0 ] / limit;
		return Math.floor((nRandomNumber * 99999) + 1).toString();
	}

	function fnGetCommonShareVisibilityPath() {
		return "${_templPrivGlobal>/generic/isTeamsModeActive} || !${_templPrivGlobal>/generic/shareControlVisibility}";
	}

	function getAllRestrictions(oContextSet, oProperty) {
		var bNotSortable = false;
		if (oContextSet["Org.OData.Capabilities.V1.SortRestrictions"] && oContextSet["Org.OData.Capabilities.V1.SortRestrictions"].NonSortableProperties) {
			var aNonSortableProperties = oContextSet["Org.OData.Capabilities.V1.SortRestrictions"].NonSortableProperties;
			for (var i = aNonSortableProperties.length - 1; i >= 0; i--) {
				if (aNonSortableProperties[i].PropertyPath === oProperty) {
					bNotSortable = true;
					break;
				}
			}
		}
		var bNotFilterable = false;
		if (oContextSet["Org.OData.Capabilities.V1.FilterRestrictions"]) {
			if (oContextSet["Org.OData.Capabilities.V1.FilterRestrictions"].Filterable !== 'false') {
				if (oContextSet["Org.OData.Capabilities.V1.FilterRestrictions"].NonFilterableProperties) {
					var aNonFilterableProperties = oContextSet["Org.OData.Capabilities.V1.FilterRestrictions"].NonFilterableProperties;
					for (var j = aNonFilterableProperties.length - 1; j >= 0; j--) {
						if (aNonFilterableProperties[j].PropertyPath === oProperty) {
							bNotFilterable = true;
							break;
						}
					}
				}
			} else {
				bNotFilterable = true;
			}
		}
		var oRestrictions = {
			getFilterRestriction: function () {
				return bNotFilterable;
			},
			getSortRestriction: function () {
				return bNotSortable;
			}
		};
		return oRestrictions;
	}

	function hasSubObjectPage(oListEntitySet, aSubPages) {
		return !!(oListEntitySet.name && aSubPages && aSubPages.some(function (oSubPage) {
			return oListEntitySet.name === oSubPage.entitySet;
		}));
	}

	function getBindingForIntent(sSemanticObject, sAction, sPath, bInEditAllowed, sPositive, sNegative) {
		var sEditableCondition = bInEditAllowed ? "" : " && !${ui>/editable}";
		return "{= ${_templPriv>/generic/supportedIntents/" + sSemanticObject + "/" + sAction + "/" + sPath + "/supported}" + sEditableCondition + " ? " + sPositive + " : " + sNegative + "}";
	}

	function getSubObjectPageIntent(sListEntitySet, aSubPages, sAnnotationPath, sMode, hideChevronForUnauthorizedExtNav) {
		// if variable hideChevronForUnauthorizedExtNav is true, then sub object outbound target is returned only if hideChevronForUnauthorizedExtNav (manifest flag) is set to true for the corresponding table.
		var sNavigationProperty;
		if (sAnnotationPath) {
			//AnnotationPath is only filled on Object Page which contains facets->annotationPath
			sNavigationProperty = sAnnotationPath.split("/")[0];
		}
		if (sListEntitySet && aSubPages) {
			for (var i = 0; i < aSubPages.length; i++) {
				if (sListEntitySet === aSubPages[i].entitySet && (!sNavigationProperty || sNavigationProperty === aSubPages[i].navigationProperty) && aSubPages[i].navigation && aSubPages[i].navigation[sMode]) {
					if (hideChevronForUnauthorizedExtNav) {
						if (aSubPages[i].component && aSubPages[i].component.settings && aSubPages[i].component.settings.hideChevronForUnauthorizedExtNav) {
							return aSubPages[i].navigation[sMode].target;
						}
					} else {
						return aSubPages[i].navigation[sMode].target;
					}
				}
			}
		}
		return null;
	}

	// Returns a binding string for navigation.
	// bForActionCount determines, whether this is for property rowActionCount (in the Grid/ Analytical table, values 0 or 1) or type of ColumnListItem (values Navigation and Inactive)
	// bInEditAllowed determines wether navigation is allowed in edit mode (this is not the case in non-draft object pages)
	// bTrueForSure can be used to overrule the normal logic and always allow navigation
	function getNavigationBinding(oListEntitySet, aSubPages, oManifest, sAnnotationPath, bInEditAllowed, bForActionCount, bTrueForSure, bIsRoot) {
		var sPositive = bForActionCount ? "1" : "Navigation";
		var sEditFlow = oManifest["sap.ui.generic.app"].pages[0].component.settings && oManifest["sap.ui.generic.app"].pages[0].component.settings.editFlow;
		if (sEditFlow === "direct" && bIsRoot) {
			var bRestrictions = oAnnotationHelper.getUpdateRestrictions(oListEntitySet);
			if (typeof bRestrictions === "boolean"){
				return bRestrictions ? "Detail" : "Inactive";
			} else {
				return "{= ${" + bRestrictions + "}? 'Detail' : 'Inactive'}";
			}

		}
		if (bTrueForSure) {
			return sPositive;
		}
		var sNegative = bForActionCount ? "0" : "Inactive";
		var sApostrophe = bForActionCount ? "" : "'";
		// check if table has inline external navigation and hideChevronForUnauthorizedExtNav flag is set to true.
		var sOutboundTarget = getSubObjectPageIntent(oListEntitySet.name, aSubPages, sAnnotationPath, "display", true);
		if (sOutboundTarget) {
			var oCrossNavTarget = oManifest["sap.app"].crossNavigation.outbounds[sOutboundTarget];
			var sSemanticObject = oCrossNavTarget.semanticObject;
			var sAction = oCrossNavTarget.action;
			// sPath is the unique key corresponding to the table to bind chevron visibility for that table in templPrivModel.
			var sPath = oListEntitySet.name + (sAnnotationPath ? ("::" + sAnnotationPath.split("/")[0]) : "");
			return getBindingForIntent(sSemanticObject, sAction, sPath, bInEditAllowed, sApostrophe + sPositive + sApostrophe, sApostrophe + sNegative + sApostrophe);
		}
		if (hasSubObjectPage(oListEntitySet, aSubPages)) {
			return bInEditAllowed ? sPositive : "{= ${ui>/editable} ? " + sApostrophe + sNegative + sApostrophe + " : " + sApostrophe + sPositive + sApostrophe + " }";
		}
		return sNegative;
	}

	// Returns the expression binding/ value for the row action count in the Grid/ Analytical table for chevron display.
	function getRowActionCount(oListEntitySet, aSubPages, oManifest, sAnnotationPath, bInEditAllowed) {
		return getNavigationBinding(oListEntitySet, aSubPages, oManifest, sAnnotationPath, bInEditAllowed, true);
	}

	function isPropertyPathBoolean(oMetaModel, sEntityTypeName, sPropertyPath) {
		var sProperty = sPropertyPath;
		var oPathEntityType = oMetaModel.getODataEntityType(sEntityTypeName);
		if (sProperty.indexOf("/") > -1) { // if it's a navigation path, we have to expand to find the right entity type
			var aPathParts = sProperty.split("/");
			for (var j = 0; j < aPathParts.length - 1; j++) {  // go through the parts finding the last entity type;
				var oAssociationEnd = oMetaModel.getODataAssociationEnd(oPathEntityType, aPathParts[j]);
				oPathEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
			}
			sProperty = aPathParts[aPathParts.length - 1]; // last entry in array is a property
		}
		var oODataProperty = oMetaModel.getODataProperty(oPathEntityType, sProperty);
		return (!!oODataProperty && oODataProperty.type === "Edm.Boolean");
	}

	function getSmartTableControl(oElement){
		while (!oElement.getEntitySet){
			oElement = oElement.getParent();
		}
		return oElement;
	}

	function getLineItemQualifier(aControlCustomData) {
		for (var i = 0; i < aControlCustomData.length; i++) {
			if (aControlCustomData[i].getKey() === "lineItemQualifier") {
				var slineItemQualifier = aControlCustomData[i].getValue();
				if (slineItemQualifier) {
					return slineItemQualifier;
				}
			}
		}
	}

	function getCriticality(oRow, oRowContext){
		var oModel = oRowContext.getModel();
		var oMetaModel = oModel.getMetaModel();
		var oControl = getSmartTableControl(oRow.getParent());
		var oEntitySet = oMetaModel.getODataEntitySet(oControl.getEntitySet());
		var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
		var aControlCustomData = oControl.getCustomData();
			//getting the lineItem annotations for the current table
		var oLineItemAnnotation = oEntityType["com.sap.vocabularies.UI.v1.LineItem"];
			//getting the Criticality object.
		var oCriticalityAnnotation = oEntityType["com.sap.vocabularies.UI.v1.LineItem@com.sap.vocabularies.UI.v1.Criticality"];
			//checking if the given table's lineItem has a qualifier defined.
		var sLineItemQualifier = getLineItemQualifier(aControlCustomData);
		if (sLineItemQualifier) {
			oCriticalityAnnotation = oEntityType["com.sap.vocabularies.UI.v1.LineItem#" + sLineItemQualifier + "@com.sap.vocabularies.UI.v1.Criticality"];
		}
		if (oLineItemAnnotation && oCriticalityAnnotation){
			// Highlights the rows of tables with green/red/yellow if lineItem criticality is defined
			//check for setting dynamic highlight using Path
			if (oCriticalityAnnotation.Path){
				var sCriticalityPath = oCriticalityAnnotation.Path;
				var sRowCriticalityValue = oRowContext.getObject(sCriticalityPath);
				if (sRowCriticalityValue){
					switch (sRowCriticalityValue.toString()){
						case "0":
							return "None";
						case "1":
							return "Error";
						case "2":
							return "Warning";
						case "3":
							return "Success";
					}
				}
			} else if (oCriticalityAnnotation.EnumMember){
				//check for setting static highlight using EnumMember
				var sCriticalityEnum = oCriticalityAnnotation.EnumMember;
				if (sCriticalityEnum) {
					switch (sCriticalityEnum) {
						case "com.sap.vocabularies.UI.v1.CriticalityType/Neutral":
							return "None";
						case "com.sap.vocabularies.UI.v1.CriticalityType/Negative":
							return "Error";
						case "com.sap.vocabularies.UI.v1.CriticalityType/Critical":
							return "Warning";
						case "com.sap.vocabularies.UI.v1.CriticalityType/Positive":
							return "Success";
					}
				}
			}
		}
		return "None";
	}
	// retrieve sort or filter property
	function getSortOrFilterProperty(oInterface, oDataField, oContextSet, oDataFieldTarget, sAnnotationPath, bSort, bAnalytical){
		var aRecordType = ['com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation', 'com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation', 'com.sap.vocabularies.UI.v1.DataFieldForAction', 'com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath'];
		if (aRecordType.indexOf(oDataField.RecordType) !== -1) {
			if (oDataField && oDataField.Value && oDataField.Value.Path) {
				return getBindingForSortFilter(oContextSet, oDataField.Value.Path, bSort);
			}
		} else if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
			if (sAnnotationPath.indexOf('com.sap.vocabularies.Communication.v1.Contact') >= 0) {
				return getBindingForSortFilterContact(oInterface, oContextSet, oDataFieldTarget, sAnnotationPath, bSort, bAnalytical);
			} else if (sAnnotationPath.indexOf('com.sap.vocabularies.UI.v1.DataPoint') >= 0) {
				if (oDataFieldTarget && oDataFieldTarget.Value && oDataFieldTarget.Value.Path) {
					return getBindingForSortFilter(oContextSet, oDataFieldTarget.Value.Path, bSort);
				}
			}

		}
	}
	// For Contact determine if binding for a property is sortable or filterable
	// returns path - binding to be used for sort or filter
	function getBindingForSortFilterContact(oInterface, oContextSet, oDataFieldTarget, sAnnotationPath, bSort, bAnalytical) {
		var sNavigation = "";
		var oMetaModel = oInterface.getInterface(0).getModel();
		if (oMetaModel) {
			var oEntityType = oMetaModel.getODataEntityType(oContextSet.entityType);
			if (oEntityType) {
				sNavigation = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, sAnnotationPath);
			}
			if (oDataFieldTarget && oDataFieldTarget.fn && oDataFieldTarget.fn.Path) {
				if (sNavigation) {
					if (!bAnalytical) {
					   var oEndAssociationSet = oMetaModel.getODataAssociationSetEnd(oEntityType, sNavigation);
					   if (oEndAssociationSet && oEndAssociationSet.entitySet) {
						oContextSet = oMetaModel.getODataEntitySet(oEndAssociationSet.entitySet);
					   }
					return getBindingForSortFilter(oContextSet, oDataFieldTarget.fn.Path, bSort, sNavigation);
			        }
			    } else {
					return getBindingForSortFilter(oContextSet, oDataFieldTarget.fn.Path, bSort, sNavigation);
				}
			}
		}
	}
	// Determine if binding for a property is sortable or filterable
	// returns path - binding to be used for sort or filter
	function getBindingForSortFilter(oContextSet, sPath, bSort, sNavigation) {
		var oRestrictionModel = getAllRestrictions(oContextSet, sPath);
		if (sNavigation) {
			if (bSort) {
				var bNotSortable = oRestrictionModel.getSortRestriction();
				if (!bNotSortable) {
					return sNavigation + '/' + sPath;
				}
			} else {
				var bNotFilterable = oRestrictionModel.getFilterRestriction();
				if (!bNotFilterable) {
					return sNavigation + '/' + sPath;
				}
			}
		} else {
			if (bSort) {
				var bNotSortable = oRestrictionModel.getSortRestriction();
				if (!bNotSortable) {
					return sPath;
				}
			} else {
				var bNotFilterable = oRestrictionModel.getFilterRestriction();
				if (!bNotFilterable) {
					return sPath;
				}
			}
		}

	}
	// Expose selected private static functions to unit tests
	/* eslint-disable */
	var getSmartTableControl = testableHelper.testableStatic(getSmartTableControl, "AnnotationHelper_getSmartTableControl");
	var getLineItemQualifier = testableHelper.testableStatic(getLineItemQualifier, "AnnotationHelper_getLineItemQualifier");
	/* eslint-enable */

	var oAnnotationHelper = {
		formatMessage: formatMessage,
		getNewVariable: function (oContext){
/*			define variables that can be used more flexible than simply template:with, and still (more or less) safe in templating
			keeping values in global memory of formatters or in a model is unsafe due to asynchronous nature of templating

			usage:
			define a new variable by <template:with path="parameter>/variables" helper="AH.getNewVariable" var="MY_VARIABLE"> (where MY_VARIABLE is a name you can define. This variable can be used during the scope of that with-tag.)
			set the value by <template:if test="{:= ${MY_VARIABLE>}.set(MY_VALUE)}"/>
			- this should be the first thing after defining the variable
			- note, that the if-tag is closed immediately - it's only used to allow the function call
			- do not set a new value for the same variable (within the scope of the with), however, you can reuse the variable name templating (i.e. after the with-tag is closed, open a new one in the same way - esp. it can also be used inside a repeat)
			access the value by ${MY_VARIABLE>value}

			you can set the value in many different ways:
			- fixed (string) values can be set by <template:if test="{:= ${MY_VARIABLE>}.set('MY_FIXED_VALUE')}"/>
			- bindings can be used like <template:if test="{:= ${MY_VARIABLE>}.set(${MODEL>PATH})}"/>
			- also with formatters <template:if test="{:= ${MY_VARIABLE>}.set(${path: 'MODEL>PATH', formatter: 'MY_FORMATTER'})}"/>
			- unfortunately, composite seem not to work, but instead you can also call the formatter directly <template:if test="{:= ${MY_VARIABLE>}.set(MY_FORMATTER(${MODEL1>PATH1}, ${MODEL2>PATH2}))}"/>
			- you can also use formatters to determine (a part of) the path <template:if test="{:= ${MY_VARIABLE>}.set(${MODEL>PATH_PREFIX}[DETERMIne_PATH_INFIX(INPUT)]['PATH_SUFFIX])}"/>
			- you can also set objects as value <template:if test="{:= ${MY_VARIABLE>}.set('{PROPERTY1: VALUE1, PROPERTY2: VALUE2}')}"/> and access this later by ${MY_VARIABLE>value/PROPERTY}
			- you can also build (flat) objects step by step by providing name-value pairs <template:if test="{:= ${MY_VARIABLE>}.set(VALUE, PROPERTY_NAME)}"/>
*/
			var aVariables = oContext.getProperty();
			var	oVariable = {
					set: function(vValue, sProperty){
						// if an object is provided as value, make a deep copy. Otherwise, we would just keep the reference, and later attempts to override a single property
						// would also change the original object (which could be a binding to some model)
						// actually, deep is not needed, as long as we only deal with direct properties
						vValue = typeof vValue === "object" ? deepExtend({}, vValue) : vValue;
						if (sProperty){
							oVariable.value = oVariable.value || {};
							oVariable.value[sProperty] = vValue;
						} else {
							oVariable.value = vValue;
						}
						// allow direct access (i.e ${MY_VARIABLE>} instead of ${MY_VARIABLE>value}. Especially helpful, if same variable should be set directly (using template:with) in other cases but commonly accessed
						// only needed for objects currently
						if (typeof oVariable.value === "object"){
							deepExtend(oVariable, oVariable.value);
						}
					}
				};
			aVariables.push(oVariable);
			return "/variables/" + (aVariables.length - 1);
		},
		getMetaModelBinding: function(oContext){
			// oContext is expected to be a context in the parameterModel, evaluating to a string being a path in the metaModel
			var sMetaModelPath = oContext.getObject();
			var oMetaModel = oContext.getObject("/metaModel");
			// on block level, in case of FieldGroups a metaModelPath makes no sense (as we have to put all FieldGroups into 1 SmartForm, while
			// for other cases (e.g. lineitem) its needed
			// => relaxed handling needed if no (valid) path provided
			return sMetaModelPath && oMetaModel.createBindingContext(sMetaModelPath);
		},

		getBlockForEditableHeaderFacet: function (oInterface, oFacet){
			// clarify: how to deal with collectionFacet (on second level)


			// preliminary:
			// SmartForm fragment is used from Facet fragment and from EditableHeaderFacet fragment. In case of Facet fragment all necessary data is provided
			// in the parameters model within in templateSpecific at the place the variable block is pointing to
			// For EditableHeaderFacet, analysis is not yet transferred to templateSpecificPreparation. Instead with getNewVariable also a variable block is created,
			// this method provides the properties for this variable needed by SmartForm fragment
			// Note:
			// - usually variables created with getNewVariable need to be accessed with MY_VAR>value - which does not match for the pointer set in standard case (in Facet fragment) with
			//		<template:with>. To allow this mixed use case, the set method in getNewVariable has been enhanced to also extend the variable itself in case the value is an object.
			//		If the object should again contain a property value, this could break existing usages (but only an access like MY_VAR>value/value)
			// - in case of editableHeaderFacet, so far we create a separate SmartForm per referenceFacet (on 1. and 2. level - 3. level is ignored). This does not comply to the guidance
			//		from SmartForm colleagues (no parallel SmartForms next to each other), thus should be reworked

			// groups are the groups put into the SmartForm - here per referenceFacet one group should be created. As in case of editableHeaderFacet, we create one SmartForm per ReferenceFacet, each
			// SmartForm contains just one group

			var oResult = {
				controlProperties: {
					id: StableIdHelper.getStableId({
						type:'ObjectPageSection',
						subType:'SmartForm',
						sFacet: StableIdHelper.getStableId({
							type:'ObjectPage',
							subType:'EditableHeaderFacet',
							sRecordType: oFacet.RecordType,
							sAnnotationPath: oFacet.Target && oFacet.Target.AnnotationPath,
							sAnnotationId: oFacet.ID && oFacet.ID.String
						})
					})
				},
				aggregations: {
					groups: [{
						metaModelPath: oInterface.getPath()
					}]
				}
			};

			// In case of collectionFacet on 2nd level, fields (of fieldgroup referenceFacet on 3rd level is pointing to) are not shown in the header - so it seems to be very unlikely, that they are
			// to be shown in the editableHeader. To avoid visual garbage, we just ensure no groups will be put into the corresponding SmartForm.
			// Notes:
			// - with refactoring to avoid parallel SmartForms, a better solution should be achieved also here (not creating the SmartForm at all)
			// - in 1.84 and older, these fields were shown (but only in edit), and put together in one SmartForm. To achieve the same now, we could add the contained reference facets accordingly to the groups.
			if (!oFacet.Target){
				oResult.aggregations.groups = [];
			}

			return oResult;
		},

		getBindingForHiddenPath: function (oHidden) {
			if (oHidden["com.sap.vocabularies.UI.v1.Hidden"]) {
				if (oHidden["com.sap.vocabularies.UI.v1.Hidden"].hasOwnProperty("Path")) {
					return "{= !${" + oHidden["com.sap.vocabularies.UI.v1.Hidden"].Path + "} }"; // <Annotation Term="UI.Hidden" Path="Edit_ac"/>
				} else if (oHidden["com.sap.vocabularies.UI.v1.Hidden"].hasOwnProperty("Bool")) {
					if (oHidden["com.sap.vocabularies.UI.v1.Hidden"].Bool === "true") {
						return false; // <Annotation Term="UI.Hidden" Bool="true"/>
					} else if (oHidden["com.sap.vocabularies.UI.v1.Hidden"].Bool === "false") {
						return true; // <Annotation Term="UI.Hidden" Bool="false"/>
					} else {
						oLogger.error(oHidden["com.sap.vocabularies.UI.v1.Hidden"].Bool + " is not a boolean value");
						return true; // <Annotation Term="UI.Hidden" Bool="Value other than true or false"/>
					}
				} else {
					return false; // <Annotation Term="UI.Hidden"/>
				}
			} else {
				return true;
			}
		},

		getVisibiltyBasedOnImportance: function(oVisible) {
			if (oVisible['com.sap.vocabularies.UI.v1.Importance'] && oVisible['com.sap.vocabularies.UI.v1.Importance'].hasOwnProperty("EnumMember")) {
				if (oVisible['com.sap.vocabularies.UI.v1.Importance'].EnumMember === 'com.sap.vocabularies.UI.v1.ImportanceType/High') {
					return true;
				} else if ((oVisible['com.sap.vocabularies.UI.v1.Importance'].EnumMember === 'com.sap.vocabularies.UI.v1.ImportanceType/Medium') && (Device.system.tablet || Device.system.desktop)) {
					return true;
				} else if (Device.system.desktop) {
					return true;
				} else {
					return false;
				}
			}
		},
		getSeverityIconFromIconPool: function(messageType) {
			//This mapping is consistent with one used in sap/m/MessageView.
			switch (messageType) {
				case ValueState.Error:
					return IconPool.getIconURI("error");
				case ValueState.Warning:
					return IconPool.getIconURI("alert");
				case ValueState.Information: 
					return IconPool.getIconURI("information");
				case ValueState.Success:
					return IconPool.getIconURI("sys-enter-2");
				default:
					return "";
			}
		},
		getIconColor: function(messageType) {
			var coreIconColor = sap.ui.core.IconColor;
			switch (messageType) {
				case ValueState.Error:
					return coreIconColor.Negative;
				case ValueState.Warning:
					return coreIconColor.Critical;
				case ValueState.Success:
					return coreIconColor.Positive;
				default:
					return "";
			}
		},
		getVisibilityBasedOnHeaderInfoContent: function(oVisible) {
			if (oVisible){
				return this.getVisibiltyBasedOnImportance(oVisible);
			}
			return false;
		},

		getValueListReadOnly: function (oInterface, sEntityType, oDataField) {
			var oMetaModel = oInterface.getInterface(1).getModel();
			var sPath = oInterface.getInterface(1).getPath() + '/Value';
			var sTargetPropertyPath = sap.ui.model.odata.AnnotationHelper.resolvePath(oMetaModel.getContext(sPath));
			var oDataFieldValue = oMetaModel.getObject(sTargetPropertyPath);
			if (oDataFieldValue['com.sap.vocabularies.UI.v1.TextArrangement']) {
				// case 1 - text arrangement defined at property level
				return oDataFieldValue['com.sap.vocabularies.UI.v1.TextArrangement'].EnumMember !== 'com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate';
			} else if (oDataFieldValue['com.sap.vocabularies.Common.v1.Text']) {
				// case 2 - text arrangment defined for property via sap:text
				return true;
			} else {
				// case 3 - text arrangement defined at entity level
				var oEntityType = oMetaModel.getODataEntityType(sEntityType);
				if (oEntityType['com.sap.vocabularies.UI.v1.TextArrangement']) {
					return oEntityType['com.sap.vocabularies.UI.v1.TextArrangement'].EnumMember !== 'com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate';
				}
			}
		},
		getImportanceForTableColumns: function(oVisible) {
			return (oVisible['com.sap.vocabularies.UI.v1.Importance'] && oVisible['com.sap.vocabularies.UI.v1.Importance'].EnumMember && oVisible['com.sap.vocabularies.UI.v1.Importance'].EnumMember.split('/')[1]) || SapCoreLibrary.Priority.None;
		},

		getImportanceForTableColumnsWithSemanticKeyTitleAndDescription: function (oInterface, oEntitySet, oVisible){
			var oProperty = oVisible && oVisible.Value;
			var sImportance = oAnnotationHelper.getImportanceForTableColumns(oVisible);
			if (!oVisible['com.sap.vocabularies.UI.v1.Importance'] && oAnnotationHelper.isPropertySemanticKey(oInterface, oEntitySet, oProperty)){
				return SapCoreLibrary.Priority.High;
			}
			return sImportance;
		},
		getCustomDataForContactPopup: function (oContactDetails) {
			return ((JSON.stringify(oContactDetails)).replace(/\}/g, "\\}").replace(/\{/g, "\\{")); //check bindingParser.escape
		},

		// render only those column which have data to be displayed
		// if only inline=false actions; then do not render column
		renderColumnForConnectedFields: function (aConnectedDataFields) {
			var checkForInlineActions = function (oDataField) {
				return ((oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") && !(oDataField.Inline && oDataField.Inline.Bool === "true"));
			};
			if (aConnectedDataFields.length) {
				if (!aConnectedDataFields.every(checkForInlineActions)) {
					return "true";
				} else {
					return "false";
				}
			} else {
				return "false";
			}
		},

		renderColumnHeader: function (aConnectedDataFields) {
			var checkForInlineActions = function (oDataField) {
				return (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation");
			};
			if (aConnectedDataFields.length) {
				if (aConnectedDataFields.every(checkForInlineActions)) {
					return "true";
				} else {
					return "false";
				}
			}
		},

		createP13NColumnForConnectedFields: function (oInterface, oEntitySetContext, oConnectedColumn, oConnectedDataFields) {
			var sP13N = "",
				sColumnKey = "",
				oP13N = {},
				oEntityType = {},
				aProperties = [],
				iColumnIndex;
			var oContextSet = oInterface.getInterface(0);
			var oModel = oInterface.getInterface(1).getModel();
			// p13nData for Semantically Connected Columns
			var aLeadingPropertiesForSCColumn = [];
			var aNavigationPropertiesForSCColumn = [];
			var aAdditionalPropertiesForSCColumn = [];
			var sActionButton = "false";
			oConnectedDataFields = oConnectedDataFields && oConnectedDataFields.Data;
			for (var i = 0; i < oConnectedDataFields.length; i++) {
				var oDataField = oConnectedDataFields[i];
				oModel = oInterface.getInterface(0).getModel();
				oEntityType = oModel.getODataEntityType(oModel.getContext(oInterface.getInterface(0).getPath()).getObject().entityType);
				var oDataTarget; // only used when oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation"
				if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
					if (oDataField.Target.AnnotationPath.indexOf("/") > 0) {
						var sNavigationProperty = oDataField.Target.AnnotationPath.split("/")[0];
						var sAnnotationPath = oDataField.Target.AnnotationPath.split("/")[1].split("@")[1];
						oEntityType = oModel.getODataEntityType(oModel.getODataAssociationEnd(oEntityType, sNavigationProperty).type);
						oDataTarget = oEntityType[sAnnotationPath];
					} else {
						oDataTarget = oEntityType[oDataField.Target.AnnotationPath.split("@")[1]];
					}
				}

				if (((oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") && oDataField.Inline && oDataField.Inline.Bool === "true") || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
					sP13N = oAnnotationHelper.createP13NColumnForAction(oContextSet, oDataField);
				} else if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataField") {
					var oSmartFieldData = oAnnotationHelper.getRelevantDataForAnnotationRecord(oModel, oDataField.Value.Path, oEntityType);
					oEntityType = oSmartFieldData.entityType;
					var sDataFieldValuePath = oSmartFieldData.dataFieldValuePath;
					aProperties = (oEntityType && oEntityType.property) || [];
					var oDataFieldValue;
					for (var j = 0; j < aProperties.length; j++) {
						if (aProperties[j].name === sDataFieldValuePath) {
							oDataFieldValue = aProperties[j];
							break;
						}
					}
					sP13N = oAnnotationHelper.createP13N(oInterface, oEntitySetContext, oDataFieldValue, oDataField);
				} else if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
					if (oDataField.Target.AnnotationPath.indexOf("com.sap.vocabularies.Communication.v1.Contact") >= 0) {
						sP13N = oAnnotationHelper.createP13NColumnForContactPopUp(oInterface, oEntitySetContext, oDataField, oDataTarget, oDataField.Target.AnnotationPath);
					} else if (oDataField.Target.AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.Chart") >= 0) {
						sP13N = oAnnotationHelper.createP13NColumnForChart(oInterface, oEntitySetContext, oDataField, oDataTarget, oDataField.Target.AnnotationPath);
					} else if (oDataTarget.Visualization) {
						sP13N = oAnnotationHelper.createP13NColumnForIndicator(oInterface, oEntitySetContext, oDataField, oDataTarget, oDataTarget.Value, oDataField.Target.AnnotationPath);
					}
				}

				if (sP13N) {
					oP13N = JSON.parse(sP13N.replace(/\\/g, ""));
				}
				if (!aLeadingPropertiesForSCColumn.length && oP13N.leadingProperty) {
					aLeadingPropertiesForSCColumn.push(oP13N.leadingProperty);
				} else {
					oP13N.leadingProperty && (aAdditionalPropertiesForSCColumn.indexOf(oP13N.leadingProperty) === -1) ? aAdditionalPropertiesForSCColumn.push(oP13N.leadingProperty) : Function.prototype;
				}
				oP13N.navigationProperty && (aNavigationPropertiesForSCColumn.indexOf(oP13N.navigationProperty) === -1) ? aNavigationPropertiesForSCColumn.push(oP13N.navigationProperty) : Function.prototype;
				oP13N.additionalProperty && (aAdditionalPropertiesForSCColumn.indexOf(oP13N.additionalProperty) === -1) ? aAdditionalPropertiesForSCColumn.push(oP13N.additionalProperty) : Function.prototype;
				if (sActionButton === "false") {
					sActionButton = oP13N.actionButton;
				}
			}
			sP13N = "";
			sColumnKey = oAnnotationHelper.createP13NColumnKey(oConnectedColumn);
			iColumnIndex = oAnnotationHelper._determineColumnIndex(oInterface.getInterface(1));

			sP13N = '\\{"columnKey":"' + sColumnKey;
			sP13N += '", "columnIndex":"' + iColumnIndex;

			sP13N += '", "sortProperty":"' + "";
			sP13N += '", "filterProperty":"' + "";

			if (aLeadingPropertiesForSCColumn.length > 0) {
				sP13N += '", "leadingProperty":"' + aLeadingPropertiesForSCColumn.join();
			}
			if (aNavigationPropertiesForSCColumn.length > 0) {
				sP13N += '", "navigationProperty":"' + aNavigationPropertiesForSCColumn.join();
			}
			if (aAdditionalPropertiesForSCColumn.length > 0) {
				sP13N += '", "additionalProperty":"' + aAdditionalPropertiesForSCColumn.join();
			}

			sP13N += '", "actionButton":"' + sActionButton + '"';
			sP13N += ' \\}';
			return sP13N;
		},

		getDefaultWidthForTableColumn: function(oInterface, oDataFieldValue, oDataFieldForWidth, oContextEntitySet, sAnnotationPath, bEnableAuto){
			var oMetaModel = oInterface.getModel(0);
			var oEntityType = oMetaModel.getODataEntityType(oContextEntitySet.entityType);
			var sWidth = oAnnotationHelper.getDefaultWidthBasedOnAnnotation(oDataFieldForWidth, bEnableAuto);
			if (sWidth){
				return sWidth;
			} else if (oDataFieldValue && oAnnotationHelper.isImageUrl(oDataFieldValue)) {
				return "5rem";
			} else if (oDataFieldForWidth.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataFieldForWidth.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
				return "15rem";
			} else if (sAnnotationPath && sAnnotationPath.indexOf("com.sap.vocabularies.UI.v1.Chart") > -1) {
				return "20rem";
			} else if (oDataFieldValue && oDataFieldValue.Visualization) {
				return "6.875rem";
			} else if (sAnnotationPath && sAnnotationPath.indexOf("com.sap.vocabularies.Communication.v1.Contact") > -1) {
				var oEntityType = oMetaModel.getODataAssociationEnd(oEntityType, sAnnotationPath.split("/")[0]).type;
				oDataFieldValue = oMetaModel.getODataProperty(oMetaModel.getODataEntityType(oEntityType), oDataFieldValue.fn.Path);
			}
			var oDataFieldValuePath = oDataFieldForWidth && oDataFieldForWidth.Value && oDataFieldForWidth.Value.Path;
			if (oDataFieldValuePath && oDataFieldValuePath.indexOf('/') > -1) {
				var oAssociation;
				while (oDataFieldValuePath.indexOf('/') > -1) {
					var sNavigationProperty = oDataFieldValuePath.split("/")[0];
					oDataFieldValuePath = oDataFieldValuePath.split('/').slice(1).join('/');
					oAssociation = oMetaModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
					oEntityType = oMetaModel.getODataEntityType(oAssociation && oAssociation.type) || oEntityType;
				}
				oContextEntitySet = oEntityType;
			}
			oDataFieldValue = oDataFieldValue && oAnnotationHelper.getPropertyNameForText(oInterface, oDataFieldValue, oContextEntitySet);
			sWidth = oDataFieldValue && oDataFieldValue.maxLength && parseInt(oDataFieldValue.maxLength, 10) + 1;
			if (sWidth) {
				if (sWidth >= 20) {
					return "20rem"; // max width column
				} else if (sWidth <= 3) {
					return "3rem"; // min width column
				} else {
					return  sWidth + "rem";
				}
			}
			return "auto";
		},

		// Calculate the width of the column, which is rendered via FieldGroup Annotation
		// By interating all the field it determines the max column width
		// returns the rem value for the width of the column
		getColumnWidthForConnectedFields: function (oInterface, oDataFieldValue, oContextEntitySet, bEnableAuto) {
			var iMaxWidth = 0;
			var oModel = oInterface.getInterface(0).getModel();
			for (var i = 0; i < oDataFieldValue.length; i++ ) {
				if (oDataFieldValue[i].Value && oDataFieldValue[i].Value.Path) {
					var oDataFieldProperty = oModel.getODataProperty(oModel.getODataEntityType(oContextEntitySet.entityType), oDataFieldValue[i].Value.Path);
					var sWidth = oAnnotationHelper.getDefaultWidthForTableColumn(oInterface, oDataFieldProperty, oDataFieldValue[i], oContextEntitySet, undefined, bEnableAuto);
				} else {
					var oTargetLineItem = oModel.getContext(oInterface.getInterface(0).getPath() + "/" + i + "/Target");
					var sResolvedPath = sap.ui.model.odata.AnnotationHelper.resolvePath(oTargetLineItem);
					var oDataFieldProperty = oModel.getObject(sResolvedPath);
					var sTarget = oDataFieldValue[i] && oDataFieldValue[i].Target && oDataFieldValue[i].Target.AnnotationPath;
					var sWidth = oAnnotationHelper.getDefaultWidthForTableColumn(oInterface, oDataFieldProperty, oDataFieldValue[i], oContextEntitySet, sTarget, bEnableAuto);
				}
				if (sWidth === "auto") {
					continue;
				}
				sWidth = parseFloat(sWidth.split("rem", 1));
				if (sWidth > iMaxWidth) {
					iMaxWidth = sWidth;
				}
			}
			return iMaxWidth === 0 ? "auto" : iMaxWidth + "rem";
		},

		//If a property is annotated with valulist and ValueListForValidation
		//We set textInEditModeSource property of the Smartfield as "ValueList" or else "ValueListNoValidation"
		//Setting "ValueList" will check client side validation.
		//Setting "ValueListNoValidation" will check server Side validation.
		setValidationForValueList: function(oPropertyAnnotations) {
			return oPropertyAnnotations && oPropertyAnnotations["com.sap.vocabularies.Common.v1.ValueListForValidation"] !== undefined ? "ValueList" : "ValueListNoValidation";
		},

		getPropertyNameForText: function (oInterface, oDataFieldValue, oContextEntitySet) {
			var sDataFieldValuePath = oDataFieldValue["sap:text"];
			if (sDataFieldValuePath) {
				var oMetaModel = oInterface.getModel(0);
				var oEntityType = oMetaModel.getODataEntityType(oContextEntitySet.entityType);
				var oAssociation;
				if (sDataFieldValuePath.indexOf('/') > -1) {
					while (sDataFieldValuePath.indexOf('/') > -1) {
						var sNavigationProperty = sDataFieldValuePath.split("/")[0];
						sDataFieldValuePath = sDataFieldValuePath.split('/').slice(1).join('/');
						oAssociation = oMetaModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
						oEntityType = oMetaModel.getODataEntityType(oAssociation && oAssociation.type) || oEntityType;
					}
				}
				for (var i = 0; i <= oEntityType.property.length; i++) {
					if (oEntityType.property[i].name === sDataFieldValuePath) {
						oDataFieldValue = oEntityType.property[i];
						break;
					}
				}
			}
			return oDataFieldValue;
		},

		getDefaultWidthBasedOnAnnotation: function (oDataFieldForWidth, bEnableAuto) {
			if (bEnableAuto === false) { // if enableAutoColumnWidthForSmartTable is false then set width as "auto", if undefined or true return the calculated width
				return "auto";
			} else if (oDataFieldForWidth && oDataFieldForWidth["com.sap.vocabularies.HTML5.v1.CssDefaults"] && oDataFieldForWidth["com.sap.vocabularies.HTML5.v1.CssDefaults"].width && oDataFieldForWidth["com.sap.vocabularies.HTML5.v1.CssDefaults"].width.String) {
				return oDataFieldForWidth["com.sap.vocabularies.HTML5.v1.CssDefaults"].width.String;
			} else {
				return undefined;
			}
		},

		getShareButtonVisibility: function(bIsFlexibleColumnLayout, sTreeNodeLevel) {
			if (bIsFlexibleColumnLayout) {
				return "{= !(" + fnGetCommonShareVisibilityPath() + " || ${_templPrivGlobal>/generic/FCL/highestViewLevel} !== " + sTreeNodeLevel + " || ${ui>/createMode}) }";
			} else {
				return "{= !(" + fnGetCommonShareVisibilityPath() + " || ${ui>/createMode})}";
			}
		},

		getShareOptionVisibility: function(bFlexibleColumnLayout) {
            if (bFlexibleColumnLayout) {
                return "{= !(" + fnGetCommonShareVisibilityPath() + " || ${_templPrivGlobal>/generic/FCL/highestViewLevel})}";
            } else {
                return "{= !(" + fnGetCommonShareVisibilityPath() + ")}";
            }
        },

		tabItemHasPresentationVariant: function (oEntityType, sVariantAnnotationPath) {
			var oVariant = oEntityType[sVariantAnnotationPath];
			return !!(oVariant && (oVariant.PresentationVariant || oVariant.Visualizations || oVariant.SortOrder));
		},

		getPresentationVariant: function (oVariant, oEntityType) {
			if (oVariant.Visualizations || oVariant.SortOrder) {
				// oVariant is a PresentationVariant
				return oVariant;
			} else if (oVariant.PresentationVariant && (oVariant.PresentationVariant.Path || oVariant.PresentationVariant.AnnotationPath)) {
				// oVariant is a SelectionPresentationVariant referencing a PresentationVariant via Path
				var sAnnotationPath = oVariant.PresentationVariant.Path || oVariant.PresentationVariant.AnnotationPath;
				return oEntityType[sAnnotationPath.replace('@', '')];
			} else if (oVariant.PresentationVariant) {
				// oVariant is a SelectionPresentationVariant containing a PresentationVariant
				return oAnnotationHelper.getPresentationVariant(oVariant.PresentationVariant);
			}
		},

		getPresentationVariantVisualisation: function (oEntityType, sVariantAnnotationPath) {
			var oVariant = oEntityType[sVariantAnnotationPath];
			var oPresentationVariant = oAnnotationHelper.getPresentationVariant(oVariant, oEntityType);
			if (oPresentationVariant.Visualizations) {
				return oPresentationVariant.Visualizations[0].AnnotationPath.split('#')[1];
			}
		},

		getPresentationVariantSortOrder: function (oEntityType, sVariantAnnotationPath) {
			var oVariant = oEntityType[sVariantAnnotationPath];
			var oPresentationVariant = oAnnotationHelper.getPresentationVariant(oVariant, oEntityType);
			if (oPresentationVariant.SortOrder) {
				return oAnnotationHelper.getSortOrder(oPresentationVariant.SortOrder);
			}
		},

		// the following getXYId and getIconTabFilterKey/Text methods are needed for the table tab mode to correctly initialize the table instances
		// use same IDs as for non-table-tab mode and add a unique suffix (table tab filter key)
		// TODO move to list report annotation helper
		getSmartTableId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "listReport";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getAnalyticalTableId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "analyticalTable";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getGridTableId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "GridTable";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getTreeTableId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "TreeTable";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getRowActionsId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "rowActions";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getResponsiveTableId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "responsiveTable";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getAddEntryId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "addEntry";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getDeleteEntryId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "deleteEntry";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getShowDetailsId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "showDetails";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getDraftObjectMarkerId: function (oTabItem) {
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			var sResult = "DraftObjectMarker";
			if (sSuffix) {
				sResult = sResult.concat(sSuffix);
			}
			return sResult;
		},

		getBreakoutActionButtonId: function (oCustomAction, oTabItem) {
			if (oCustomAction.id) {
				var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
				var sResult = oCustomAction.id;
				if (sSuffix) {
					sResult = sResult.concat(sSuffix);
				}
				return sResult;
			}
		},

		getIconTabFilterKey: function (oTabItem) {
			if (oTabItem) {
				if (oTabItem.key) {
					return oTabItem.key;
				} else {
					return oAnnotationHelper.replaceSpecialCharsInId(oTabItem.annotationPath);
				}
			}
		},

		getSuffixFromIconTabFilterKey: function (oTabItem) {
			var sKey = oAnnotationHelper.getIconTabFilterKey(oTabItem);
			if (sKey) {
				return "-".concat(sKey);
			} else {
				return "";
			}
		},

		getVisibilityForRowActions: function(oListEntitySet, oParameter){
			if (oParameter.settings.editFlow === "direct") {
				var bRestrictions = oAnnotationHelper.getUpdateRestrictions(oListEntitySet);
				if (typeof bRestrictions === "boolean"){
					return bRestrictions;
				} else {
					return "{= ${" + bRestrictions + "}}";
				}
			} else {
				return true;
			}

		},

		getIconTabFilterText: function (oInterface, oManifestEntry, oTarget) {
			var oModel, oData, oMetaModel, oEntitySet, sEntityType, oEntityType, oMainEntityType, oAssociationEnd;
			if (oTarget) {
				//Called from MultipleViews in Object Page
				//In this case, the Annotation will be fetched from the associated entity which the Object Page table uses.
				var sTargetAnnotationPath = oTarget.AnnotationPath;
				var sTarget = sTargetAnnotationPath && sTargetAnnotationPath.substring(0, sTargetAnnotationPath.indexOf('/'));
				oModel = oInterface.getInterface(0).getModel();
				oData = oModel.getData();
				oMetaModel = oData.metaModel;
				oMainEntityType = oMetaModel.getODataEntityType(oData.entityType);
				oAssociationEnd = oMetaModel.getODataAssociationEnd(oMainEntityType, sTarget);
				oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type); //oEntityType here refers to the Associated Entity used by the OP Table
			} else {
				oModel = oInterface.getModel();
				oData = oModel.getData();
				oMetaModel = oData.metaModel;
				if (!!oManifestEntry.entitySet) { // that is true for table tabs with different entity sets
					oEntitySet = oMetaModel.getODataEntitySet(oManifestEntry.entitySet);
					sEntityType = oEntitySet.entityType;
				} else {
					sEntityType = oData.entityType;
				}
				oEntityType = oMetaModel.getODataEntityType(sEntityType);
			}
			var oSelectionVariant = oEntityType[oManifestEntry.annotationPath];
			if (oSelectionVariant && oSelectionVariant.Text) {
				return oSelectionVariant.Text.String;
			}
		},

		getAltTextForImage: function (oDataFieldValue) {
			if (oDataFieldValue["com.sap.vocabularies.Common.v1.Text"]) {
				return oDataFieldValue["com.sap.vocabularies.Common.v1.Text"].String;
			}
		},
		getActionButtonVisibility: function (oInterface, oDatafield) {
			var sAction = oDatafield["Action"] && oDatafield["Action"].String;
			sAction = sAction && sAction.split("/")[1];
			if (sAction) {
				var oAction = oInterface.getModel().getODataFunctionImport(sAction);
			}
			return !!oAction;

		},

		//Hide the group title if the subsection contains only one group and the subsection title is same as group title.
		isGroupFacetTitleRequired: function(oSubSectionData, oGroupData) {
			if (oSubSectionData.annotations.Facet.annotation.Facets.length === 1) {
				return oSubSectionData.annotations.Facet.annotation.Label.String !== oGroupData.String;
			}
			return true;
		},

		// returns the 'enabled' value for a button based on annotations
		buildAnnotatedActionButtonEnablementExpression: function (mInterface, mDataField, mFacet, mEntityType, bIsPhone, oTabItem, oChartItem) {
			var mFunctionImport, sButtonId, sAction, oMetaModel;

			// WORKAROUND: as analytical table/chart is not yet fully capable of supporting applicable path (issues with analytical binding), we always set enabled to true
			// Commenting down the below code, as we tested it now and it seems to have no issues now
			// if (mEntityType && mEntityType["sap:semantics"] === "aggregate" && !bIsPhone) {
			// 	return true;
			// }
			// END OF WORKAROUND

			sAction = mDataField && mDataField.Action && mDataField.Action.String;
			if (sAction) {
				sButtonId = oAnnotationHelper.getStableIdPartForDatafieldActionButton(mDataField, mFacet, oTabItem, oChartItem);
				// if RecordType is UI.DataFieldForIntentBasedNavigation and RequiresContext is "true" (default value is "false") then return binding expression
				// // Note: For DataFieldForIntentBasedNavigation we currently do not support the case that RequiresContext is determined by Path
				if (mDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
					if (mDataField.RequiresContext && mDataField.RequiresContext.Bool === "true") {
						return "{= !!${_templPriv>/generic/controlProperties/" + sButtonId + "/enabled}}";
					}
				} else if (mDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
					oMetaModel = mInterface.getInterface(0).getModel();
					mFunctionImport = oMetaModel.getODataFunctionImport(sAction);
					// if RecordType is UI.DataFieldForAction and if sap:action-for is defined then return binding expression
					if (!mFunctionImport) {
						oLogger.error("The function import " + sAction + " is not defined in the metadata. Buttons that call this function import will not behave as expected.");
						return false;
					} else if (mFunctionImport["sap:action-for"] && mFunctionImport["sap:action-for"].trim()) {
						return "{= !!${_templPriv>/generic/controlProperties/" + sButtonId + "/enabled}}";
					}
				}

				return true; // default enabled value for annotated actions
			}
		},

		buildActionButtonsCustomData: function (oInterface, oCollection, oFacet, quickVariantSelectionX, oTabItem, oChartItem) {
			var oDataField, oMetaModel, oResult;
			var aButtonsData = [];
			oInterface = oInterface.getInterface(0);
			oMetaModel = oInterface.getModel();

			if (oCollection) {
				for (var i = 0; i < oCollection.length; i++) {
					oDataField = oCollection[i];
					oResult = null;
					// if type is DataFieldForAnnotation, then loop over target annotations
					if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" &&
						oDataField.Target.AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.FieldGroup") >= 0) {
						// oDataField = oAnnotationHelper.getDataFieldFromDataFieldForAnnotation(oInterface, oDataField);
						var oTargetLineItem = oMetaModel.getContext(oInterface.getPath() + "/" + i + "/Target");
						var sResolvedPath = sap.ui.model.odata.AnnotationHelper.resolvePath(oTargetLineItem);
						var oDataFieldTarget = oMetaModel.getObject(sResolvedPath);

						if (oDataFieldTarget.Data && oDataFieldTarget.Data.length > 0) {
							for (var j = 0; j < oDataFieldTarget.Data.length; j++) {
								oResult = oAnnotationHelper.generateAnnotatedActionCustomData(oDataFieldTarget.Data[j], oFacet, oTabItem, oChartItem);
								if (oResult) {
									aButtonsData.push(oResult);
								}
							}
						}
					} else {
						oResult = oAnnotationHelper.generateAnnotatedActionCustomData(oDataField, oFacet, oTabItem, oChartItem);
						if (oResult) {
							aButtonsData.push(oResult);
						}
					}
				}
			}

			//TODO: find a better way of escaping the JSON string
			return btoa(JSON.stringify(aButtonsData));
		},

		generateAnnotatedActionCustomData: function (oDataField, oFacet, oTabItem, oChartItem) {
			var sId;
			if ((oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") &&
				!((oDataField.Inline && oDataField.Inline.Bool === true) || (oDataField.Determining && oDataField.Determining.Bool === true)) &&
				(oDataField.Action && (oDataField.Action.String || oDataField.Action.Path))) {
					sId = oAnnotationHelper.getStableIdPartForDatafieldActionButton(oDataField, oFacet, oTabItem, oChartItem);
					return {
						ID: sId,
						RecordType: oDataField.RecordType,
						Action: oDataField.Action && (oDataField.Action.String || oDataField.Action.Path)
					};
			}
		},

		getLabelForDFwithIBN: function (oInterface, oDataField, oEntitySet, oGroupFacet) {
			var oModel, oTargetEntitySet, oEntityType, oProperty, sResult, sDataFieldPath;
			if (oDataField.Label) {
				return oDataField.Label.String;
			} else {
				oModel = oInterface.getInterface(0).getModel();
				if (oModel && oEntitySet) {
					if (oGroupFacet && oGroupFacet.Target && oGroupFacet.Target.AnnotationPath) {
						oTargetEntitySet = oAnnotationHelper.getTargetEntitySet(oModel, oEntitySet, oGroupFacet.Target.AnnotationPath);
						oEntityType = oModel.getODataEntityType(oTargetEntitySet.entityType);
					} else {
						oEntityType = oModel.getODataEntityType(oEntitySet.entityType);
					}
					if ((oDataField.Value && oDataField.Value.Path) || (oDataField.IconUrl && oDataField.IconUrl.Path)) {
						sDataFieldPath = (oDataField.Value && oDataField.Value.Path) ? oDataField.Value.Path : oDataField.IconUrl.Path;
						oProperty = oModel.getODataProperty(oEntityType, sDataFieldPath);
						sResult = (oProperty["com.sap.vocabularies.Common.v1.Label"] || "").String || "";
						return sResult;
					}
				}
			}
		},

		getLinkTextForDFwithIBN: function (oInterface, oDataField, oEntitySet, oGroupFacet) {
			var oEntityType, oTargetEntitySet, oProperty, sResultPath;
			var oModel = oInterface.getInterface(0).getModel();
			if (oModel && oEntitySet) {
				if (oGroupFacet && oGroupFacet.Target && oGroupFacet.Target.AnnotationPath) {
					oTargetEntitySet = oAnnotationHelper.getTargetEntitySet(oModel, oEntitySet, oGroupFacet.Target.AnnotationPath);
					oEntityType = oModel.getODataEntityType(oTargetEntitySet.entityType);
				} else {
					oEntityType = oModel.getODataEntityType(oEntitySet.entityType);
				}
				if (oDataField.Value && oDataField.Value.Path) {
					oProperty = oModel.getODataProperty(oEntityType, oDataField.Value.Path) || {};
					sResultPath = (oProperty["com.sap.vocabularies.Common.v1.Text"] || oDataField.Value).Path || "";
					return "{" + sResultPath + "}";
				}
			}
		},

		getTargetEntitySet: function (oModel, oSourceEntitySet, sAnnotationPath) {
			var aNavigationProperty, sNavigationProperty, oEntityType, oAssociationEnd;
			aNavigationProperty = sAnnotationPath.split('/');
			if (aNavigationProperty.length > 1) {
				sNavigationProperty = aNavigationProperty[0];
			}
			if (sNavigationProperty) {
				oEntityType = oModel.getODataEntityType(oSourceEntitySet.entityType);
				oAssociationEnd = oModel.getODataAssociationSetEnd(oEntityType, sNavigationProperty);
				if (oAssociationEnd && oAssociationEnd.entitySet) {
					return oModel.getODataEntitySet(oAssociationEnd.entitySet);
				}
			}
			return oSourceEntitySet;
		},

		// returns the applicable-path - which is set to the property 'requestAtLeastFields' on the SmartChart
		// the requestAtLeastFields property will add to the $select OData parameter in order to get the necessary data
		getApplicablePathForChartToolbarActions: function (oInterface, mChartAnnotation, sEntityType) {
			var oMetaModel = oInterface.getInterface(0).getModel();
			var mEntityType = oMetaModel.getODataEntityType(sEntityType);
			var aActions = (mChartAnnotation && mChartAnnotation.Actions) || [];
			var sFunctionImport, mFunctionImport, mODataProperty, aFunctionImport = [], aApplicablePath = [], sApplicablePath;

			// check each annotation for UI.DataFieldForAction and verify that Inline & Determining are not set to true, which will imply that the Action is a toolbar action (based on Actions Concept)
			for (var i = 0; i < aActions.length; i++) {
				if (aActions[i].RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" &&
					(!aActions[i].Inline || aActions[i].Inline.Bool !== "true") && (!aActions[i].Determining || aActions[i].Determining.Bool !== "true")) {
					sFunctionImport = aActions[i].Action && aActions[i].Action.String;
					mFunctionImport = oMetaModel.getODataFunctionImport(sFunctionImport);
					if (mFunctionImport) {
						aFunctionImport.push(mFunctionImport);
					}
				}
			}

			for (var i = 0; i < aFunctionImport.length; i++) {
				// verify that both the sap:action-for and sap:applicable-path annotation are applied to the function import
				mFunctionImport = aFunctionImport[i];
				if (mFunctionImport &&
					mFunctionImport["sap:action-for"] && mFunctionImport["sap:action-for"] !== "" && mFunctionImport["sap:action-for"] !== " " &&
					mFunctionImport["sap:applicable-path"] && mFunctionImport["sap:applicable-path"] !== "" && mFunctionImport["sap:applicable-path"] !== " ") {
					sApplicablePath = mFunctionImport["sap:applicable-path"];
					mODataProperty = oMetaModel.getODataProperty(mEntityType, sApplicablePath);

					// the applicable-path needs to point to a property that has the annotation 'sap:aggregation-role' equal to 'dimension' (and not 'measure' for example)
					if (mODataProperty && mODataProperty["sap:aggregation-role"] === "dimension") {
						aApplicablePath.push(sApplicablePath);
					} else {
						oLogger.error("AnnotationHelper.js - method getApplicablePathForChartToolbarActions: the applicable-path " + sApplicablePath +
							" is either pointing to an entity type property which doesn't exist or does not have 'sap:aggregation-role' set to to 'dimension'.");
					}
				}
			}

			// if there are applicable paths in aApplicablePath, then return a comma separated string which contains each applicable path - e.g. ["property1", "property2"] -> "property1, property2"
			if (aApplicablePath.length > 0) {
				return aApplicablePath.join();
			}
		},

		formatSmartField : function(oInterface, oSmartField) {
			var oDataField = {"Path":oSmartField.path};
			return AnnotationHelperModel.simplePath(oInterface.getModel() ? oInterface : oInterface.getInterface(0), oDataField);
		},
		
		// build expression binding for bread crumbs
		buildBreadCrumbExpression: function (oContext, oTreeNode) {
			var oHeaderInfo = oTreeNode.entityTypeDefinition && oTreeNode.entityTypeDefinition["com.sap.vocabularies.UI.v1.HeaderInfo"];
			var oTitle = oHeaderInfo && oHeaderInfo.Title &&  oHeaderInfo.Title.Value;
			var sBindingTitle = oTitle && sap.ui.model.odata.AnnotationHelper.format(oContext, oTitle);
			var oTypeName = oHeaderInfo && oHeaderInfo.TypeName;                         
			// Revisit (AncestorFeature)
			//sBindingTitle = sBindingTitle.replace("{", "{" + oTreeNode.specificModelName + ">");
			if (oTitle && oTitle.Path && oTypeName && oTypeName.String) {
				var sTypeNameEscaped = oTypeName.String.replace(/'/g, "\\'");
				var sBinding = "{= $" + sBindingTitle + " || '" + sTypeNameEscaped + "' }";
				return sBinding;
			}
			// fallback
			return sBindingTitle || (oTypeName && oTypeName.String) || oTreeNode.headerTitle;
		},


		// builds the expression for the Rating Indicator Subtitle
		buildRatingIndicatorSubtitleExpression: function (mSampleSize) {
			if (mSampleSize) {
				return "{parts: [{path: '" + mSampleSize.Path + "'}], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.formatRatingIndicatorSubTitle'}";
			}
		},

		// returns the text for the Rating Indicator Subtitle (e.g. '7 reviews')
		formatRatingIndicatorSubTitle: function (iSampleSizeValue) {
			if (iSampleSizeValue) {
				var oResBundle = this.getModel("i18n").getResourceBundle();
				if (this.getCustomData().length > 0) {
					return oResBundle.getText("RATING_INDICATOR_SUBTITLE", [iSampleSizeValue, this.data("Subtitle")]);
				} else {
					var sSubTitleLabel = iSampleSizeValue > 1 ? oResBundle.getText("RATING_INDICATOR_SUBTITLE_LABEL_PLURAL") : oResBundle.getText("RATING_INDICATOR_SUBTITLE_LABEL");
					return oResBundle.getText("RATING_INDICATOR_SUBTITLE", [iSampleSizeValue, sSubTitleLabel]);
				}
			}
		},

		// builds the expression for the Rating Indicator footer
		buildRatingIndicatorFooterExpression: function (mValue, mTargetValue) {
			if (mTargetValue) {
				return "{parts: [{path: '" + mValue.Path + "'}, {path: '" + mTargetValue.Path + "'}], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.formatRatingIndicatorFooterText'}";
			}
			return "{parts: [{path: '" + mValue.Path + "'}], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.formatRatingIndicatorFooterText'}";
		},

		// returns the text for the Rating Indicator footer (e.g. '2 out of 5')
		// note: the second placeholder (e.g. "5") for the text "RATING_INDICATOR_FOOTER" can come one from the following:
		// i. if the Property TargetValue for the term UI.DataPoint is a Path then the value is resolved by the method buildRatingIndicatorFooterExpression and passed to this method as 'targetValue'
		// ii. if the Property TargetValue is not a Path (i.e. 'Decimal') then we get the value from the control's Custom Data
		// iii. if neither i. or ii. apply then we use the default max value for the sap.m.RatingIndicator control
		formatRatingIndicatorFooterText: function (value, targetValue) {
			if (value) {
				var oResBundle = this.getModel("i18n").getResourceBundle();
				if (targetValue) {
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, targetValue]);
				} else if (this.getCustomData().length > 0) {
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, this.data("Footer")]);
				} else {
					var iRatingIndicatorDefaultMaxValue = sap.m.RatingIndicator.getMetadata().getPropertyDefaults().maxValue;
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, iRatingIndicatorDefaultMaxValue]);
				}
			}
		},

		// builds the expression for the Rating Indicator aggregate Ccunt
		buildRatingIndicatorAggregateCountExpression: function (mValue) {
			return "{parts: [{path: '" + mValue.Path + "'}], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.formatRatingIndicatorAggregateCount'}";
		},

		// returns the text for the Rating Indicator aggregated count (e.g. (243))
		formatRatingIndicatorAggregateCount: function (value) {
			var oResBundle = this.getModel("i18n").getResourceBundle();
			var sText;
			if (value) {
				sText = oResBundle.getText("RATING_INDICATOR_AGGREGATE_COUNT", [value]);
			} else if (this.getCustomData().length > 0) {
				sText = oResBundle.getText("RATING_INDICATOR_AGGREGATE_COUNT", [this.data("AggregateCount")]);
			} else {
				sText = "";
			}

			return sText;
		},

		getIdForMoreBlockContent: function (oFacet) {
			if (oFacet["com.sap.vocabularies.UI.v1.PartOfPreview"] && oFacet["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "false") {
				return "::MoreContent";
			}
		},

		checkMoreBlockContent: function (oFacetContext) {
			return oAnnotationHelper.checkFacetContent(oFacetContext, false);
		},

		checkBlockContent: function (oFacetContext) {
			return oAnnotationHelper.checkFacetContent(oFacetContext, true);
		},

		checkFacetContent: function (oFacetContext, bBlock) {
			var sPath;
			var oInterface = oFacetContext.getInterface(0);
			var aFacets = oFacetContext.getModel().getProperty("", oFacetContext);

			//for Reference Facets directly under UI-Facets we need to check facets one level higher - by removing the last part of the path
			var aForPathOfFacetOneLevelHigher = oFacetContext.getPath().split("/Facets");
			var sContextOfFacetOneLevelHigher = oInterface.getModel().getContext(aForPathOfFacetOneLevelHigher[0]);
			if (oInterface.getModel().getProperty('', sContextOfFacetOneLevelHigher).RecordType === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
				return sContextOfFacetOneLevelHigher.getPath();
			} else {
				if (!aFacets) {
					return;
				}

				for (var iFacet = 0; iFacet < aFacets.length; iFacet++) {
					if (!bBlock) {
						if (aFacets[iFacet]["com.sap.vocabularies.UI.v1.PartOfPreview"] && aFacets[iFacet]["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "false") {
							sPath = oInterface.getPath() + "/" + iFacet;
							break;
						}
					} else {
						if (aFacets[iFacet].RecordType !== "com.sap.vocabularies.UI.v1.ReferenceFacet" || (!aFacets[iFacet]["com.sap.vocabularies.UI.v1.PartOfPreview"] || aFacets[iFacet]["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "true")) {
							sPath = oInterface.getPath() + "/" + iFacet;
							break;
						}
					}
				}
			}

			return sPath;
		},

		// Checks whether the given inline mode has been configured for the given facet
		isInlineMode: function (oFacet, oSections, sMode) {
			var oSettings = oSections && oSections[oAnnotationHelper.getStableIdPartFromFacet(oFacet)];
			return !!(oSettings && oSettings.createMode && oSettings.createMode === sMode);
		},

		//Hides the "Create" button when inline-creation-rows feature is enabled and table type is responsive table 
		isCreateButtonVisibleWithInlineCreationRows: function (oFacet, oSections, sTableType) {
			return !(oAnnotationHelper.isInlineMode(oFacet, oSections, "creationRows") && sTableType === "ResponsiveTable");
		},

		// Checks whether use of the preliminaryContext feature has been configured for the given facet
		usesPreliminaryContext: function (oFacet, oSections) {
			var oSettings = oSections[oAnnotationHelper.getStableIdPartFromFacet(oFacet)];
			return !!(oSettings && oSettings.preliminaryContext);
		},
		//check whether HasActityEntity sort order(Inline Create mode) has been configured for the given facet(table)
		isInlineCreateSorting: function (oFacet, oSections) {
			var oSettings = oSections && oSections[oAnnotationHelper.getStableIdPartFromFacet(oFacet)];
			return !!(oSettings && oSettings.disableDefaultInlineCreateSort);
		},

		isImageUrl: function (oPropertyAnnotations) {
			var oShowImage = oPropertyAnnotations["com.sap.vocabularies.UI.v1.IsImageURL"] || oPropertyAnnotations["com.sap.vocabularies.UI.v1.IsImageUrl"];
			if (oShowImage && oShowImage.Bool && oShowImage.Bool === "false") {
				return false;
			} else if (oShowImage) {
				return true;
			}
			return false;
		},

		isPropertySemanticKey: function (oInterface, oEntitySet, oProperty) {
			var oInterface = oInterface.getInterface(0);
			var oMetaModel = oInterface.getModel();
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			if (oEntityType) {
				var aSemKeyAnnotation = oEntityType["com.sap.vocabularies.Common.v1.SemanticKey"];
				if (aSemKeyAnnotation && aSemKeyAnnotation.length > 0) {
					for (var i = 0; i < aSemKeyAnnotation.length; i++) {
						if (aSemKeyAnnotation[i].PropertyPath === oProperty.Path) {
							return true;
						}
					}
				}
			}
			return false;
		},
		// Handling of image urls
		//
		// If images are included in the UI app they need to specify the path relatively (e.g. images/image.jpg) to support
		// different platforms like ABAP and HCP. The relative path has to be used because the absolute paths differ from platform
		// to platform. The rule is if the image url doesn't start with a / or sap-icon:// or http(s):// then it's a relative url and the absolute
		// path has to be added by the framework. This path can be retrieved with sap.ui.require.toUrl and the component name.

		_addFullPathToImageUrlIfNeeded: function (sImageUrl, sAppComponentName) {
			if (!sImageUrl) {
				return "";
			}
			if ((sImageUrl.substring(0, 1) === "/") || (sImageUrl.substring(0, 11) === "sap-icon://")
				|| (sImageUrl.substring(0, 7) === "http://") || (sImageUrl.substring(0, 8) === "https://")) {
				// Absolute URL, nothing has to be changed
				return sImageUrl;
			} else {
				// Relative URL, has to be adjusted
				return sap.ui.require.toUrl(sAppComponentName.replace(/\./g, "/")) + "/" + sImageUrl; //replacing dots by slashes before calling sap.ui.require.toUrl method. com.xyz.abc to com/xyz/abc
			}
		},

		isDescriptionInHeaderInfo: function(oDataField) {
			if (oDataField && oDataField.Description && oDataField.Description.Value) {
				return true;
			}
			return false;
		},

		formatImageUrl: function (oInterface, oImageUrl, sAppComponentName, bExpand) {
			if (oImageUrl && (oImageUrl.Path || oImageUrl.Apply) && bExpand) {
				oAnnotationHelper.formatWithExpandSimple(oInterface, oImageUrl);
			}
			if (oImageUrl && oImageUrl.Path) {
				return "{parts: [{path: '" + oImageUrl.Path + "'}, {path: '_templPrivGlobal>/generic/appComponentName'}], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.formatImageUrlRuntime'}";
			} else if (oImageUrl && oImageUrl.String) {
				return oAnnotationHelper._addFullPathToImageUrlIfNeeded(oImageUrl.String, sAppComponentName);
			} else if (oImageUrl && oImageUrl.Apply) {
				oImageUrl.Apply.Parameters[0].Value = oAnnotationHelper._addFullPathToImageUrlIfNeeded(oImageUrl.Apply.Parameters[0].Value, sAppComponentName);
				return sap.ui.model.odata.AnnotationHelper.format(oInterface, oImageUrl);
			} else {
				return "";
			}
		},

		hasImageUrl: function (oImageUrl) {
			if (oImageUrl && (oImageUrl.Path || oImageUrl.Apply || oImageUrl.String)) {
				return "sapSmartTemplatesObjectPageDynamicPageHeader sapSmartTemplatesObjectPageDynamicPageHeaderImageDiv";
			} else {
				return "sapSmartTemplatesObjectPageDynamicPageHeader";
			}
		},

		getAvatarInitials: function (oInitials) {
			return ((oInitials.Path && ("{" + oInitials.Path + "}")) || oInitials.String || "");
		},

		hasImageUrlForHeaderTitle: function (oImageUrl) {
			if (oImageUrl && (oImageUrl.Path || oImageUrl.Apply || oImageUrl.String)) {
				return "sapSmartTemplatesObjectPageDynamicPageHeaderTitle sapSmartTemplatesObjectPageDynamicPageHeaderTitleWithImage sapSmartTemplatesObjectPageDynamicPageHeaderImageDiv";
			} else {
				return "sapSmartTemplatesObjectPageDynamicPageHeaderTitle sapSmartTemplatesObjectPageDynamicPageHeaderTitleWithoutImage";
			}
		},

		formatImageOrTypeUrl: function (oInterface, oInputImageUrl, oTypeImageUrl, sAppComponentName, bExpand) {
			var oImageUrl = null;
			if (oInputImageUrl) {
				oImageUrl = oInputImageUrl;
			} else {
				oImageUrl = oTypeImageUrl;
			}
			return oAnnotationHelper.formatImageUrl(oInterface, oImageUrl, sAppComponentName, bExpand);
		},

		getPathWithExpandFromHeader: function (oInterface, oEntitySet, sNavigationProperty, oInputImageUrl, oTypeImageUrl) {
			var aExpand = [], sNavigationPath;
			if ((oInputImageUrl || oTypeImageUrl)) {
				var oInterface = oInterface.getInterface(0);
				var oMetaModel = oInterface.getModel();
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);

				//check for the image path
				var oImageUrl = null;
				if (oInputImageUrl) {
					oImageUrl = oInputImageUrl;
				} else {
					oImageUrl = oTypeImageUrl;
				}

				if (oImageUrl && oImageUrl.Path && oEntityType) {
					//var oMetaModel = oInterface.getInterface(0).getModel(); does not include the full metamodel
					var sExpand = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, oImageUrl.Path);
					if (sExpand) {
						aExpand.push(sExpand);
					}
				}
			}

			if (aExpand.length > 0) {
				if (aExpand.length > 1) {
					//remove duplicates
					aExpand = aExpand.filter(function (elem, index, self) {
						return index == self.indexOf(elem);
					});
				}
				sNavigationPath = "{ path : '" + sNavigationProperty + "', parameters : { expand : '" + aExpand.join(',') + "'} }";
			} else {
				sNavigationPath = "{ path : '" + sNavigationProperty + "' }";
			}
			//needed in Non Draft Case: binding="{}" NOT WORKING - the fields are NOT visible and editable after clicking + in List Report
			//XMLTemplateProcessor also supports empty string
			if (sNavigationPath === "{}") {
				sNavigationPath = "";
			}
			return sNavigationPath;
		},

		disableSemanticObjectLinksOnPopups: function (oQuickView, oDataField) {
			var sIgnoredFields = "";
			if (oQuickView && oQuickView.ignoredFields &&
				oDataField && oDataField.Value && oDataField.Value.Path) {
				if (oQuickView.ignoredFields[oDataField.Value.Path]) {
					sIgnoredFields = oDataField.Value.Path;
				}
			}
			return sIgnoredFields;
		},

		formatImageUrlRuntime: function (sImageUrl, sAppComponentName) {
			return oAnnotationHelper._addFullPathToImageUrlIfNeeded(sImageUrl, sAppComponentName);
		},

		formatHeaderImage: function (oInterface, oHeaderInfo, sAppComponentName) {
			if (oHeaderInfo.ImageUrl) {
				return oAnnotationHelper.formatImageUrl(oInterface, oHeaderInfo.ImageUrl, sAppComponentName, true);
			} else if (oHeaderInfo.TypeImageUrl) {
				return oAnnotationHelper.formatImageUrl(oInterface, oHeaderInfo.TypeImageUrl, sAppComponentName, true);
			} else {
				return "";
			}
		},

		// Handling of image urls - End

		getPersistencyKeyForSmartTable: function (oRouteConfig) {
			// ListReport
			return "listReportFloorplanTable";
		},
		getPersistencyKeyForDynamicPageTitle: function (oRouteConfig) {
			//Dynamic Page Title
			return "listReportDynamicPageTitle";
		},
		getCreateNavigationIntent: function (sListEntitySet, aSubPages, sAnnotationPath) {
			return getSubObjectPageIntent(sListEntitySet, aSubPages, sAnnotationPath, "create");
		},
		getDisplayNavigationIntent: function (sListEntitySet, aSubPages, sAnnotationPath) {
			return getSubObjectPageIntent(sListEntitySet, aSubPages, sAnnotationPath, "display");
		},
		extensionPointFragmentExists: function (oFacet, sFragmentId) {
			var sId = oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			if (sId === sFragmentId) {
				return true;
			} else {
				return false;
			}
		},
		setAriaText: function (oInterface, i18nKey, oDataField) {
			if (oDataField.Path) {
				return "{parts: [{path: '" + i18nKey + "'}, {path: '" + oDataField.Path + "'}], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.formatMessage'}";
			}
			oDataField = sap.ui.model.odata.AnnotationHelper.format(oInterface, oDataField);
			return "{parts: [{path: '" + i18nKey + "'}, {value: '" + oDataField + "'}], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.formatMessage'}";
		},
		formatWithExpandSimple: function (oInterface, oDataField, oEntitySet) {
			if (!oDataField) {
				return "";
			}
			var aExpand = [], sExpand, oEntityType;
			var oMetaModel = oInterface && oInterface.getModel && oInterface.getModel();
			if (!oMetaModel) {
				// called with entity set therefore use the correct interface
				oInterface = oInterface.getInterface(0);
				oMetaModel = oInterface.getModel();
			}

			if (oEntitySet) {
				oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			} else {
				// TODO: check with UI2 if helper to get entity type can be used, avoid using this path
				var aMatches = /^(\/dataServices\/schema\/\d+\/entityType\/\d+)(?:\/|$)/.exec(oInterface.getPath());
				if (aMatches && aMatches.length && aMatches[0]) {
					var oEntityTypeContext = oMetaModel.getProperty(aMatches[0]);
					var sNamespace = oMetaModel.getODataEntityContainer().namespace;
					oEntityType = oMetaModel.getODataEntityType(sNamespace + '.' + oEntityTypeContext.name);
				}
			}

			if (oEntityType) {
				// check if expand is needed
				if (oDataField && oDataField.Path) {
					sExpand = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, oDataField.Path);
					if (sExpand) {
						aExpand.push(sExpand);
					}

				} else if (oDataField && oDataField.Apply && oDataField.Apply.Name === "odata.concat") {
					oDataField.Apply.Parameters.forEach(function (oParameter) {
						if (oParameter.Type === "Path") {
							sExpand = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, oParameter.Value);
							if (sExpand) {
								if (aExpand.indexOf(sExpand) === -1) {
									aExpand.push(sExpand);
								}
							}
						}
					});
				}

				if (aExpand.length > 0) {
					// we analyze a facet that is part of the root context
					// set expand to expand data bag
					var oPreprocessorsData = oInterface.getSetting("preprocessorsData");
					if (oPreprocessorsData) {
						var aRootContextExpand = oPreprocessorsData.rootContextExpand || [];
						for (var j = 0; j < aExpand.length; j++) {
							if (aRootContextExpand.indexOf(aExpand[j]) === -1) {
								aRootContextExpand.push(aExpand[j]);
							}
						}
						oPreprocessorsData.rootContextExpand = aRootContextExpand;
					}

				}
			}

			return sap.ui.model.odata.AnnotationHelper.format(oInterface, oDataField);
		},

		// AnnotationHelper.simplePath used to generate view instead of AnnotationHelper.format as simplePath provides a reduced binding string
		// Change done only for SmartField
		// TODO : Change for other controls using AnnotationHelper.format
		formatWithExpandSimplePath: function (oInterface, oDataField, oEntitySet, oValueFormat) {
			oAnnotationHelper.getNavigationPathWithExpand(oInterface, oDataField, oEntitySet);
			oInterface = oInterface.getInterface(0);
			if (!!(oValueFormat && oValueFormat.NumberOfFractionalDigits && oValueFormat.NumberOfFractionalDigits.Int)) {
				var oValue = {};
				oValue.path = oDataField.Path;
				oValue.type = "sap.ui.model.odata.type.Decimal";
				oValue.constraints = {'scale': oValueFormat.NumberOfFractionalDigits.Int};
				return JSON.stringify(oValue);
			}
			oAnnotationHelper.formatWithExpandSimple(oInterface, oDataField, oEntitySet);
			return sap.ui.model.odata.AnnotationHelper.simplePath(oInterface, oDataField);
		},

		formatWithExpand: function (oInterface, oDataField, oEntitySet) {
			oAnnotationHelper.getNavigationPathWithExpand(oInterface, oDataField, oEntitySet);

			oInterface = oInterface.getInterface(0);
			oAnnotationHelper.formatWithExpandSimple(oInterface, oDataField, oEntitySet);
			return sap.ui.model.odata.AnnotationHelper.format(oInterface, oDataField);
		},

		_getNavigationPrefix: function (oMetaModel, oEntityType, sProperty) {
			var sExpand = "";
			var aParts = sProperty.split("/");

			if (aParts.length > 1) {
				for (var i = 0; i < (aParts.length - 1); i++) {
					var oAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityType, aParts[i]);
					if (oAssociationEnd) {
						oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
						if (sExpand) {
							sExpand = sExpand + "/";
						}
						sExpand = sExpand + aParts[i];
					} else {
						return sExpand;
					}
				}
			}

			return sExpand;
		},

		getCurrentPathWithExpand: function (oInterface, oContext, oEntitySetContext, sNavigationProperty) {
			//oContext is needed to be set for having the correct "context" for oInterface
			oInterface = oInterface.getInterface(0);
			var aExpand = [], sNavigationPath;
			var oMetaModel = oInterface.getModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oEntitySetContext.name || '');
			var sResolvedPath = sap.ui.model.odata.AnnotationHelper.resolvePath(oMetaModel.getContext(oInterface.getPath()));
			var oEntityType = oMetaModel.getODataEntityType(oEntitySetContext.entityType);

			aExpand = oAnnotationHelper.getFacetExpand(sResolvedPath, oMetaModel, oEntityType, oEntitySet);

			if (aExpand.length > 0) {
				sNavigationPath = "{ path : '" + sNavigationProperty + "', parameters : { expand : '" + aExpand.join(',') + "'} }";
			} else {
				sNavigationPath = "{ path : '" + sNavigationProperty + "' }";
			}
			//needed in Non Draft Case: binding="{}" NOT WORKING - the fields are NOT visible and editable after clicking + in List Report
			//XMLTemplateProcessor also supports empty string
			if (sNavigationPath === "{}") {
				sNavigationPath = "";
			}
			return sNavigationPath;
		},

		getCurrentPathWithExpandForContact: function (oInterface, oContext, oEntitySetContext, sNavigationProperty) {
			var aExpand = [], sNavigationPath;
			/*
			var sAnnotationPath = oContext && oContext.AnnotationPath;
			if (sAnnotationPath && sAnnotationPath.indexOf('/') > -1) {
				sNavigationProperty = sAnnotationPath.slice(0, sAnnotationPath.indexOf('/'));
			}*/

			//oContext is needed to be set for having the correct "context" for oInterface
			oInterface = oInterface.getInterface(0);

			var oMetaModel = oInterface.getModel();
			var sResolvedPath = sap.ui.model.odata.AnnotationHelper.resolvePath(oMetaModel.getContext(oInterface.getPath()));
			var oEntityType = oMetaModel.getODataEntityType(oEntitySetContext.entityType);

			aExpand = oAnnotationHelper.getFacetExpandForContact(sResolvedPath, oMetaModel, oEntityType);

			if (aExpand.length > 0) {
				sNavigationPath = "{ path : '" + sNavigationProperty + "', parameters : { expand : '" + aExpand.join(',') + "'} }";
			} else {
				sNavigationPath = "{ path : '" + sNavigationProperty + "' }";
			}
			//needed in Non Draft Case: binding="{}" NOT WORKING - the fields are NOT visible and editable after clicking + in List Report
			//XMLTemplateProcessor also supports empty string
			if (sNavigationPath === "{}") {
				sNavigationPath = "";
			}
			return sNavigationPath;
		},

		getFacetExpandForContact: function (sResolvedPath, oMetaModel, oEntityType) {
			var aExpand = [], oFacetContent;

			var fnGetDependents = function (sPath) {
				if (sPath) {
					var sExpand = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, sPath);
					if (sExpand) {
						// check if already in expand array - if not yet add it
						if (aExpand.indexOf(sExpand) === -1) {
							aExpand.push(sExpand);
						}
					}
				}
			};

			if (sResolvedPath && sResolvedPath.indexOf("com.sap.vocabularies.Communication.v1.Contact") > -1) {
				oFacetContent = oMetaModel.getObject(sResolvedPath) || {};
				for (var i in oFacetContent) {
					var sPath;
					var oFacetObject = oFacetContent[i];
					if (oFacetObject && oFacetObject.Path) {
						sPath = oFacetObject.Path;
						fnGetDependents(sPath);
					} else if (Object.prototype.toString.call(oFacetObject) === '[object Array]') {
						for (var j in oFacetObject) {
							var oArrayEntry = oFacetObject[j];
							if (oArrayEntry && oArrayEntry.uri && oArrayEntry.uri.Path) {
								sPath = oArrayEntry.uri.Path;
							}
							if (oArrayEntry && oArrayEntry.address && oArrayEntry.address.Path) {
								sPath = oArrayEntry.address.Path;
							}
							fnGetDependents(sPath);
						}
					}
				}
			}
			return aExpand;
		},

		getNavigationPathWithExpand: function (oInterface, oContext, oEntitySetContext, bWithPreliminaryContext) {
			oInterface = oInterface.getInterface(0);
			var oMetaModel = oInterface.getModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oEntitySetContext.name || '');
			var sResolvedPath = sap.ui.model.odata.AnnotationHelper.resolvePath(oMetaModel.getContext(oInterface.getPath()));

			var sNavigationPath = sap.ui.model.odata.AnnotationHelper.getNavigationPath(oInterface, oContext);
			var sNavigationProperty = sNavigationPath.replace("{", "").replace("}", "");
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			if (sNavigationProperty) {
				var aNavigationProperties = sNavigationProperty.split("/");
				for (var i = 0; i < aNavigationProperties.length; i++) {
					var oTarget = oAnnotationHelper.getNavigationPropertyTargetEntityInfo(oMetaModel, oEntityType, aNavigationProperties[i]);
					oEntitySet = oTarget.entitySet;
					oEntityType = oTarget.entityType;
				}
			} else {
				bWithPreliminaryContext = false; // root context does not need preliminary context
			}
			var bAddExpandsToParameters = false;
			var aExpand = oAnnotationHelper.getFacetExpand(sResolvedPath, oMetaModel, oEntityType, oEntitySet);
			var oPreprocessorsData = oInterface.getSetting("preprocessorsData") || {};
			var aRootContextExpand = oPreprocessorsData.rootContextExpand || [];
			if (aExpand.length > 0) {
				if (sNavigationProperty) {
					// add expand to navigation path
					bAddExpandsToParameters = true;
				} else {
					// we analyze a facet that is part of the root context
					// set expand to expand data bag
					for (var j = 0; j < aExpand.length; j++) {
						if (aRootContextExpand.indexOf(aExpand[j]) === -1) {
							aRootContextExpand.push(aExpand[j]);
						}
					}
					oPreprocessorsData.rootContextExpand = aRootContextExpand;
				}
			}
			// switch of the preliminary context if batch groups are used and navigation property and all expands are already part of the root context expand
			bWithPreliminaryContext = bWithPreliminaryContext && (aRootContextExpand.indexOf(sNavigationProperty) === -1 || aExpand.some(function (sExpand) {
				return aRootContextExpand.indexOf(sNavigationProperty + "/" + sExpand) === -1;
			}));

			if (bAddExpandsToParameters || bWithPreliminaryContext) {
				sNavigationPath = "{ path : '" + sNavigationProperty + "', parameters : { ";
				if (bAddExpandsToParameters) {
					sNavigationPath = sNavigationPath + "expand : '" + aExpand.join(",") + "'";
					if (bWithPreliminaryContext) {
						sNavigationPath = sNavigationPath + ", ";
					}
				}
				if (bWithPreliminaryContext) {
					sNavigationPath = sNavigationPath + "usePreliminaryContext: true, batchGroupId: 'facets'";
				}
				sNavigationPath = sNavigationPath + "} }";
			}
			//needed in Non Draft Case: binding="{}" NOT WORKING - the fields are NOT visible and editable after clicking + in List Report
			//XMLTemplateProcessor also supports empty string
			if (sNavigationPath === "{}") {
				sNavigationPath = "";
			}
			return sNavigationPath;
		},

		getNavigationPropertyTargetEntityInfo: function(oMetaModel, oEntityType, sNavigationProperty) {
			var oTarget = {};
			var oAssociationEnd = oMetaModel.getODataAssociationSetEnd(oEntityType, sNavigationProperty);
			if (oAssociationEnd && oAssociationEnd.entitySet) {
				oTarget.entitySet = oMetaModel.getODataEntitySet(oAssociationEnd.entitySet);
				oTarget.entityType = oMetaModel.getODataEntityType(oTarget.entitySet.entityType);
			}

			return oTarget;
		},

		getFormGroupBindingString: function(oInterface, oContext, oEntitySetContext) {
			var sRet = oAnnotationHelper.getNavigationPathWithExpand(oInterface, oContext, oEntitySetContext, true);
			return sRet;
		},

		getFacetExpand: function (sResolvedPath, oMetaModel, oEntityType, oEntitySet) {
			var aDependents = [], aExpand = [], oFacetContent, aFacetContent = [];

			if (sResolvedPath) {
				aFacetContent = oMetaModel.getObject(sResolvedPath) || [];
			}

			aFacetContent = aFacetContent.Data || aFacetContent;

			var fnGetDependents = function (sProperty, bIsValue) {
				var sExpand = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, sProperty);
				if (sExpand) {
					// check if already in expand array - if not yet add it
					if (aExpand.indexOf(sExpand) === -1) {
						aExpand.push(sExpand);
					}
				}
				if (bIsValue) {
					try {
						aDependents = SmartField.getSupportedAnnotationPaths(oMetaModel, oEntitySet, sProperty, true) || [];
					} catch (e) {
						aDependents = [];
					}
					for (var i = 0; i < aDependents.length; i++) {
						if (aExpand.indexOf(aDependents[i]) === -1) {
							aExpand.push(aDependents[i]);
						}
					}
				}
			};

			var fnAnalyzeApplyFunctions = function (oParameter) {
				if (oParameter.Type === "LabeledElement") {
					fnGetDependents(oParameter.Value.Path);
				} else if (oParameter.Type === "Path") {
					fnGetDependents(oParameter.Value);
				}
			};

			if (Array.isArray(aFacetContent)) {
				for (var i = 0; i < aFacetContent.length; i++) {
					oFacetContent = aFacetContent[i];

					if (oFacetContent.Value && oFacetContent.Value.Path) {
						fnGetDependents(oFacetContent.Value.Path, true);
					}

					if (oFacetContent.Value && oFacetContent.Value.Apply && oFacetContent.Value.Apply.Name === "odata.concat") {
						oFacetContent.Value.Apply.Parameters.forEach(fnAnalyzeApplyFunctions);
					}

					if (oFacetContent.Action && oFacetContent.Action.Path) {
						fnGetDependents(oFacetContent.Action.Path);
					}

					if (oFacetContent.Target) {
						if (oFacetContent.Target.Path) {
							fnGetDependents(oFacetContent.Target.Path);
						}
						if (oFacetContent.Target.AnnotationPath) {
							fnGetDependents(oFacetContent.Target.AnnotationPath);
						}
					}

					if (oFacetContent.SemanticObject && oFacetContent.SemanticObject.Path) {
						fnGetDependents(oFacetContent.SemanticObject.Path);
					}

					if (oFacetContent.Url && oFacetContent.Url.Path) {
						fnGetDependents(oFacetContent.Url.Path);
					}

					if (oFacetContent.Url && oFacetContent.Url.Apply && oFacetContent.Url.Apply.Parameters) {
						oFacetContent.Url.Apply.Parameters.forEach(fnAnalyzeApplyFunctions);
					}


					if (oFacetContent.UrlContentType && oFacetContent.UrlContentType.Path) {
						fnGetDependents(oFacetContent.UrlContentType.Path);
					}

				}
			} else {
				if (aFacetContent.name) {
					fnGetDependents(aFacetContent.name, true);
				}

				// CASE: Reference Facet points to DataPoint aFacetContent would be an
				// Object with Value, Title & Criticality as properties which needs to
				// be processed
				if (aFacetContent.Value && aFacetContent.Value.Path) {
					fnGetDependents(aFacetContent.Value.Path, true);
				}

				if (aFacetContent.Title && aFacetContent.Title.Path) {
					fnGetDependents(aFacetContent.Title.Path, true);
				}

				if (aFacetContent.Criticality && aFacetContent.Criticality.Path) {
					fnGetDependents(aFacetContent.Criticality.Path, true);
				}
			}

			return aExpand;
		},

		isSelf: function (sPath) {
			if (sPath === undefined || (sPath && sPath.indexOf('@') === 0 && sPath.indexOf('/') === -1)) {
				return true;
			}
			return false;
		},
		// Needed for analytics fragments
		number: function (val) {
			if (!val) {
				return NaN;
			} else if (val.Decimal) {
				return +val.Decimal;
			} else if (val.Path) {
				return '{' + val.Path + '}';
			} else {
				return NaN;
			}
		},
		// Needed for analytics fragments
		formatColor: (function () {
			function formatVal(val) {
				if (!val) {
					return NaN;
				} else if (val.Decimal) {
					return val.Decimal;
				} else if (val.EnumMember) {
					return '\'' + val.EnumMember + '\'';
				} else if (val.Path) {
					return '${' + val.Path + '}';
				} else {
					return NaN;
				}
			}

			function formatCriticality(oDataPoint) {
				var criticality = oDataPoint.Criticality;

				return '{= ' + formatVal(criticality) + ' === \'UI.CriticalityType/Negative\' ? \'Error\' : ' + formatVal(criticality) + '=== \'UI.CriticalityType/Critical\' ? \'Critical\' : \'Good\'}';
			}

			function formatCriticalityCalculation(oDataPoint) {
				var value = formatVal(oDataPoint.Value);
				var oCriticalityCalc = oDataPoint.CriticalityCalculation;

				return '{= (' + value + ' < ' + formatVal(oCriticalityCalc.DeviationRangeLowValue) + ' || ' + value + ' > ' + formatVal(oCriticalityCalc.DeviationRangeHighValue) + ') ? \'Error\' : (' + value
					+ ' < ' + formatVal(oCriticalityCalc.ToleranceRangeLowValue) + ' || ' + value + ' > ' + formatVal(oCriticalityCalc.ToleranceRangeHighValue) + ') ? \'Critical\' : \'Good\'}';
			}

			return function (oDataPoint) {
				if (oDataPoint.Criticality) {
					return formatCriticality(oDataPoint);
				} else if (oDataPoint.CriticalityCalculation) {
					return formatCriticalityCalculation(oDataPoint);
				}
			};
		})(),

		_determineColumnIndex: function (oContext) {
			var sColumn = oContext.getPath();
			var iColumnIndex = Number(sColumn.slice(sColumn.lastIndexOf("/") + 1));
			var sLineItem = sColumn.slice(0, sColumn.lastIndexOf("/"));
			var oLineItem = oContext.getModel().getObject(sLineItem);
			var index = 0;
			for (var iRecord = 0; iRecord < iColumnIndex; iRecord++) {
				if ((oLineItem[iRecord].RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" ||
					oLineItem[iRecord].RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") &&
					(!oLineItem[iRecord].Inline || oLineItem[iRecord].Inline.Bool === "false")) {
					//	iColumnIndex--;
					continue;
				} else {
					index++;
				}
			}
			return index;

		},

	    /**
		 * Return a csv file to the ignoreFromPersonalisation properties of the table in SmartTable fragment
		 *
		 * @param {object} [oInterface] Contains interface object
		 * @param {object} [oEntity] Object containing all the lineItems
		 * @return {string} String containing comma separated values
		 * @private
		 */

		suppressP13NDuplicateColumns: function (oInterface, oEntity) {
			// To suppress the duplicate column rendered by SmartTable
			var sIgnoreFromP13N = "";
			var oDataField = {};
			var sCommaSeparator = ",";
			var oMetaModel = oInterface.getModel();
			// Loop to get all the Properties of Datafield
			for (var i = 0; i < oEntity.length; i++) {
				if (oEntity[i].RecordType === "com.sap.vocabularies.UI.v1.DataField") {
					if (oEntity[i].Value && oEntity[i].Value.Path) {
						var oDataProperty = oEntity[i].Value.Path;
						oDataField[oDataProperty] = true;
					}
				}
			}
			for (var i = 0; i < oEntity.length; i++) {
				if (oEntity[i].RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || oEntity[i].RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
					if (oEntity[i].Value && oEntity[i].Value.Path) {
						var oDataProperty = oEntity[i].Value.Path;
						if (!oDataField[oDataProperty]) {
							sIgnoreFromP13N = sIgnoreFromP13N + sCommaSeparator + oDataProperty;
						}
					}
				} else if (oEntity[i].RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
					var oTargetLineItem = oMetaModel.getContext(oInterface.getPath() + "/" + i + "/Target");
					var sResolvedPath = sap.ui.model.odata.AnnotationHelper.resolvePath(oTargetLineItem);
					var oDataFieldForAnnotation = oMetaModel.getObject(sResolvedPath);
					if (sResolvedPath.indexOf('com.sap.vocabularies.Communication.v1.Contact') >= 0) {
						if (oDataFieldForAnnotation && oDataFieldForAnnotation.fn && oDataFieldForAnnotation.fn.Path) {
							var oDataProperty = oDataFieldForAnnotation.fn.Path;
							if (!oDataField[oDataProperty]) {
								sIgnoreFromP13N = sIgnoreFromP13N + sCommaSeparator + oDataProperty;
							}
						}
					} else if (sResolvedPath.indexOf('com.sap.vocabularies.UI.v1.DataPoint') >= 0) {
						if (oDataFieldForAnnotation && oDataFieldForAnnotation.Value && oDataFieldForAnnotation.Value.Path) {
							var oDataProperty = oDataFieldForAnnotation.Value.Path;
							if (!oDataField[oDataProperty]) {
								sIgnoreFromP13N = sIgnoreFromP13N + sCommaSeparator + oDataProperty;
							}
						}
					} else if (sResolvedPath.indexOf('com.sap.vocabularies.UI.v1.Chart') >= 0) {
						if (oEntity[i].Target && oEntity[i].Target.AnnotationPath) {
							var oDataProperty = oEntity[i].Target.AnnotationPath.split("com.sap.vocabularies.UI.v1.Chart#")[1];
							if (!oDataField[oDataProperty]) {
								sIgnoreFromP13N = sIgnoreFromP13N + sCommaSeparator + oDataProperty;
							}
						}
					}
				}
			}
			if (sIgnoreFromP13N.length > 0) {
				sIgnoreFromP13N = sIgnoreFromP13N.substring(1);
			}
			return sIgnoreFromP13N;
		},

		createP13NColumnForAction: function (iContext, oDataField) {
			//used by DataFieldForAction, DataFieldWithIntentBasedNavigation, DataFieldForIntentBasedNavigation
			var iColumnIndex = oAnnotationHelper._determineColumnIndex(iContext);
			var sColumnKey = oAnnotationHelper.createP13NColumnKey(oDataField);
			if (oDataField && oDataField.Value && oDataField.Value.Path) {
				var sP13N = '\\{"columnKey":"' + sColumnKey + '", "leadingProperty":"' + oDataField.Value.Path + '", "columnIndex":"' + iColumnIndex;
				var oRestrictionModel = getAllRestrictions(iContext, oDataField.Value.Path);
				var bNotFilterable = oRestrictionModel.getFilterRestriction();
				var bNotSortable = oRestrictionModel.getSortRestriction();
				if (!bNotSortable) {
					sP13N += '", "sortProperty":"' + oDataField.Value.Path;
				}
				if (!bNotFilterable) {
					sP13N += '", "filterProperty":"' + oDataField.Value.Path;
				}
			} else {
				var sP13N = '\\{"columnKey":"' + sColumnKey + '", "columnIndex":"' + iColumnIndex;
			}
			if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
				if (oDataField.EdmType === "Edm.String") {
					sP13N += '", "type":"string';
				}
				sP13N += '", "autoColumnWidth":\\{"min":2,"max":19\\}, "actionButton":"true" \\}';
			} else {
				sP13N += '", "actionButton":"true" \\}';
			}
			return sP13N;
		},

		// For Personalization and ContactPopUp for contact column
		createP13NColumnForContactPopUp: function (oInterface, oContextSet, oDataField, oDataFieldTarget, sAnnotationPath) {
			var sP13N = "";
			var sNavigation = "";
			var oMetaModel = oInterface.getInterface(0).getModel();
			if (oMetaModel) {
				var oEntityType = oMetaModel.getODataEntityType(oContextSet.entityType);
				if (oEntityType) {
					sNavigation = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, sAnnotationPath);
				}
			}
			// Make Column Key unique for contact in P13n.
			var sColumnKey = oAnnotationHelper.createP13NColumnKey(oDataField);
			sP13N += '\\{"columnKey":"' + sColumnKey;
			if (oDataFieldTarget && oDataFieldTarget.fn && oDataFieldTarget.fn.Path) {
				if (sNavigation) {
					var oEndAssociationSet = oMetaModel.getODataAssociationSetEnd(oEntityType, sNavigation);
					if (oEndAssociationSet && oEndAssociationSet.entitySet) {
						oContextSet = oMetaModel.getODataEntitySet(oEndAssociationSet.entitySet);
					}
					var oRestrictionModel = getAllRestrictions(oContextSet, oDataFieldTarget.fn.Path);
					var bNotFilterable = oRestrictionModel.getFilterRestriction();
					var bNotSortable = oRestrictionModel.getSortRestriction();
					// For the expand property of Navigation, add navigation to the AdditionalProperties of P13N.
					sP13N += '", "leadingProperty":"' + sNavigation + '/' + oDataFieldTarget.fn.Path +
						'", "additionalProperty":"' + sNavigation;
					if (!bNotSortable) {
						sP13N += '", "sortProperty":"' + sNavigation + '/' + oDataFieldTarget.fn.Path;
					}
					if (!bNotFilterable) {
						sP13N += '", "filterProperty":"' + sNavigation + '/' + oDataFieldTarget.fn.Path;
					}
					if (oDataFieldTarget.fn.EdmType === "Edm.String") {
						sP13N += '", "type":"' + "string";
					}
				} else {
					var oRestrictionModel = getAllRestrictions(oContextSet, oDataFieldTarget.fn.Path);
					var bNotFilterable = oRestrictionModel.getFilterRestriction();
					var bNotSortable = oRestrictionModel.getSortRestriction();
					sP13N += '", "leadingProperty":"' + oDataFieldTarget.fn.Path +
						'", "filterProperty":"' + oDataFieldTarget.fn.Path +
						'", "additionalProperty":"' + oDataFieldTarget.fn.Path;
					if (!bNotSortable) {
						sP13N += '", "sortProperty":"' + oDataFieldTarget.fn.Path;
					}
					if (!bNotFilterable) {
						sP13N += '", "filterProperty":"' + oDataFieldTarget.fn.Path;
					}
				}
			}

			sP13N += '", "navigationProperty":"' + sNavigation;
			// Determine column index
			var oContext = oInterface.getInterface(1);
			var iColumnIndex = oAnnotationHelper._determineColumnIndex(oContext);
			if (iColumnIndex) {
				sP13N += '", "columnIndex":"' + iColumnIndex;
			}
			sP13N += '", "autoColumnWidth":\\{"min":2,"max":19,"visibleField":"' + sNavigation + '/' + oDataFieldTarget.fn.Path + '"\\}\\}';
			return sP13N;
		},

		createP13NColumnForIndicator: function (oInterface, oContextSet, oDataField, oDataFieldTarget, oDataFieldTargetValue, sAnnotationPath) {
			var sP13N = "";
			var sNavigation = "";
			var aAdditionalProperties = [];
			var oMetaModel = oInterface.getInterface(0).getModel();
			if (oMetaModel) {
				var oEntityType = oMetaModel.getODataEntityType(oContextSet.entityType);
				if (oEntityType) {
					sNavigation = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, sAnnotationPath);
				}
			}
			var sColumnKey = oAnnotationHelper.createP13NColumnKey(oDataField);
			sP13N = '\\{"columnKey":"' + sColumnKey;
			if (sNavigation) {
				sNavigation = sNavigation + "/";
			}
			if (oDataFieldTarget.Value && oDataFieldTarget.Value.Path) {
				sP13N += '", "leadingProperty":"' + sNavigation + oDataFieldTarget.Value.Path;
				aAdditionalProperties.push(sNavigation + oDataFieldTarget.Value.Path);
			}
			if (oDataFieldTarget.TargetValue && oDataFieldTarget.TargetValue.Path) {
				aAdditionalProperties.push(sNavigation + oDataFieldTarget.TargetValue.Path);
			}
			if (oDataFieldTarget.Criticality && oDataFieldTarget.Criticality.Path) {
				aAdditionalProperties.push(sNavigation + oDataFieldTarget.Criticality.Path);
			}
			if (aAdditionalProperties.length > 0) {
				var sAdditionalProperties = "";
				aAdditionalProperties.forEach(function (oProperty) {
					if (sAdditionalProperties) {
						sAdditionalProperties = sAdditionalProperties + ",";
					}
					sAdditionalProperties = sAdditionalProperties + oProperty;
				});
				sP13N += '", "additionalProperty":"' + sAdditionalProperties;
			}

			// Determine column index
			var oContext = oInterface.getInterface(1);
			var iColumnIndex = oAnnotationHelper._determineColumnIndex(oContext);
			if (iColumnIndex) {
				sP13N += '", "columnIndex":"' + iColumnIndex;
			}
			if (oDataFieldTarget && oDataFieldTarget.Value && oDataFieldTarget.Value.Path) {
				var oRestrictionModel = getAllRestrictions(oContextSet, oDataFieldTarget.Value.Path);
				var bNotFilterable = oRestrictionModel.getFilterRestriction();
				var bNotSortable = oRestrictionModel.getSortRestriction();
				if (!bNotSortable) {
					sP13N += '", "sortProperty":"' + oDataFieldTarget.Value.Path; // for Sort Property
				}
				if (!bNotFilterable) {
					sP13N += '", "filterProperty":"' + oDataFieldTarget.Value.Path; // for Filter Property
				}
			}
			sP13N += '" \\}'; // add terminator string again
			return sP13N;
		},
		createP13NColumnForChart: function (oInterface, oContextSet, oDataField, oDataFieldTarget, sAnnotationPath) {
			var sP13N = "", aAdditionalProperties = [], sNavigation = "";
			var oMetaModel = oInterface.getInterface(0).getModel();
			if (oMetaModel) {
				var oEntityType = oMetaModel.getODataEntityType(oContextSet.entityType);
				if (oEntityType) {
					sNavigation = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, sAnnotationPath);
				}
			}
			var sColumnKey = oAnnotationHelper.createP13NColumnKey(oDataField);
			if (sNavigation) {
				sP13N = '\\{"columnKey":"' + sColumnKey + '", "leadingProperty":"' + sNavigation;
				sNavigation = sNavigation + "/";
			} else {
				sP13N = '\\{"columnKey":"' + sColumnKey;
			}
			if (Array.isArray(oDataFieldTarget.Dimensions)) {
				oDataFieldTarget.Dimensions.forEach(function (oDimension) {
					aAdditionalProperties.push(sNavigation + oDimension.PropertyPath);
				});
			}
			if (Array.isArray(oDataFieldTarget.Measures)) {
				oDataFieldTarget.Measures.forEach(function (oMeasure) {
					aAdditionalProperties.push(sNavigation + oMeasure.PropertyPath);
				});
			}

			if (aAdditionalProperties.length > 0) {
				sP13N += '", "additionalProperty":"' + aAdditionalProperties.join();
			}

			var oContext = oInterface.getInterface(1);
			var iColumnIndex = oAnnotationHelper._determineColumnIndex(oContext);
			if (iColumnIndex) {
				sP13N += '", "columnIndex":"' + iColumnIndex;
			}
			sP13N += '" \\}';

			return sP13N;
		},

		createP13NColumnKey: function (oDataField, oContextProp) {
			var sColumnKey = "";
			var sFioriTemplatePrefix = "template";
			var sSeperator = "::";
			if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataField") {
				/*
				if (oContextProp && oAnnotationHelper.isImageUrl(oContextProp)){
					//if the columnKey is defined like that, smart table renders an extra picture since it doesn't find the columnKey with only the oDataField.Value.Path
					sColumnKey = sFioriTemplatePrefix + sSeperator + "DataField" + sSeperator + "IsImageURL" + sSeperator + oDataField.Value.Path;
				} else {*/
				//compatible with Smart Table
				/* e.g.
				 * DataField "ProductCategory", "to_StockAvailability/StockAvailability"
				 */
				sColumnKey = oDataField.Value.Path;
				//}
			} else if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation") {
				sColumnKey = sFioriTemplatePrefix + sSeperator + "DataFieldWithIntentBasedNavigation" + sSeperator + oDataField.SemanticObject.String + sSeperator + oDataField.Action.String + sSeperator + oDataField.Value.Path;
			} else if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
				sColumnKey = sFioriTemplatePrefix + sSeperator + "DataFieldWithNavigationPath" + sSeperator + oDataField.Value.Path;
			} else if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
				sColumnKey = sFioriTemplatePrefix + sSeperator + "DataFieldForIntentBasedNavigation" + sSeperator + oDataField.SemanticObject.String + sSeperator + oDataField.Action.String;
			} else if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
				sColumnKey = sFioriTemplatePrefix + sSeperator + "DataFieldForAction" + sSeperator + oDataField.Action.String;
			} else if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
				if (oDataField.Target.AnnotationPath.indexOf('@com.sap.vocabularies.Communication.v1.Contact') >= 0 ||
					oDataField.Target.AnnotationPath.indexOf('@com.sap.vocabularies.UI.v1.DataPoint') >= 0 ||
					oDataField.Target.AnnotationPath.indexOf('@com.sap.vocabularies.UI.v1.FieldGroup') >= 0 ||
					oDataField.Target.AnnotationPath.indexOf('@com.sap.vocabularies.UI.v1.Chart') >= 0) {
					sColumnKey = sFioriTemplatePrefix + sSeperator + "DataFieldForAnnotation" + sSeperator + oDataField.Target.AnnotationPath;
					//since DataFieldForAnnotation can contain an @ and this is not working with SmartTable.prototype._addTablePersonalisationToToolbar, it is removed
					sColumnKey = sColumnKey.replace('@', '');
				}
			}
			return sColumnKey;
		},

		createP13NFileUploader: function(oInterface, oContextSet) {
			var oEntityType = oInterface.getModel(0).getODataEntityType(oContextSet.entityType);
			var sP13N = ""; 
			var oContentDisposition = oEntityType && oEntityType["Org.OData.Core.V1.ContentDisposition"];
			var sColumnKey = oContentDisposition && oContentDisposition.Filename && oContentDisposition.Filename.Path;
			if (sColumnKey){
				sP13N = '\\{"columnKey":"' + sColumnKey + '", "leadingProperty":"' + sColumnKey;
				sP13N += '", "autoColumnWidth":\\{"min":2,"max":19\\}\\}';
			}
			return sP13N;
		},

		createP13N: function (oInterface, oContextSet, oContextProp, oDataField, oDataFieldTarget, oDataFieldTargetValue) {
			var sP13N = "", aAdditionalProperties = [], sNavigation = "";
			if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataField" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" ||
				oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
				if (oDataField.Value.Path) {
					var sColumnKey = oAnnotationHelper.createP13NColumnKey(oDataField, oContextProp);
					sP13N = '\\{"columnKey":"' + sColumnKey + '", "leadingProperty":"' + oDataField.Value.Path;
					// get Navigation Prefix
					var oMetaModel = oInterface.getInterface(0).getModel();
					if (oMetaModel) {
						var oEntityType = oMetaModel.getODataEntityType(oContextSet.entityType);
						if (oEntityType) {
							if (oContextProp["com.sap.vocabularies.Common.v1.Text"] && oContextProp["com.sap.vocabularies.Common.v1.Text"].Path) {
								var sTextArrangement = oAnnotationHelper.getTextArrangement(oEntityType, oDataField);
								if (sTextArrangement) {
									sP13N += '", "description":"' + oContextProp["com.sap.vocabularies.Common.v1.Text"].Path + '", "displayBehaviour":"' + sTextArrangement;
								}
							}
							sNavigation = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, oDataField.Value.Path);
							if (sNavigation) {
								sNavigation = sNavigation + "/";
							}
						}
					}
				} else if (oDataField.Value.Apply && oDataField.Value.Apply.Name === "odata.concat") {
					oDataField.Value.Apply.Parameters.forEach(function (oParameter) {
						if (oParameter.Type === "Path") {
							if (!sP13N) {
								sP13N = '\\{"columnKey":"' + oParameter.Value + '", "leadingProperty":"' + oParameter.Value;
							} else {
								aAdditionalProperties.push(oParameter.Value);
							}
						}
					});
				}
				if ((oContextProp.type === "Edm.DateTime") && (oContextProp["sap:display-format"] === "Date")) {
					sP13N += '", "type":"date';
				} else if (oContextProp.type === "Edm.String") {
					sP13N += '", "type":"string';
				}
				if (oDataField.Criticality && oDataField.Criticality.Path) {
					aAdditionalProperties.push(oDataField.Criticality.Path);
				}
				if (oContextProp["com.sap.vocabularies.Common.v1.Text"] && oContextProp["com.sap.vocabularies.Common.v1.Text"].Path) {
					aAdditionalProperties.push(sNavigation + oContextProp["com.sap.vocabularies.Common.v1.Text"].Path);
				}
				if (oContextProp["Org.OData.Measures.V1.ISOCurrency"] && oContextProp["Org.OData.Measures.V1.ISOCurrency"].Path) {
					aAdditionalProperties.push(sNavigation + oContextProp["Org.OData.Measures.V1.ISOCurrency"].Path);
				}
				if (oContextProp["Org.OData.Measures.V1.Unit"] && oContextProp["Org.OData.Measures.V1.Unit"].Path) {
					aAdditionalProperties.push(sNavigation + oContextProp["Org.OData.Measures.V1.Unit"].Path);
				}
				if (oContextProp["com.sap.vocabularies.Common.v1.FieldControl"] && oContextProp["com.sap.vocabularies.Common.v1.FieldControl"].Path) {
					aAdditionalProperties.push(sNavigation + oContextProp["com.sap.vocabularies.Common.v1.FieldControl"].Path);
				}

				if ((oDataField["RecordType"] === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") && oDataField.Url && oDataField.Url.Apply && oDataField.Url.Apply.Parameters) {
					oDataField.Url.Apply.Parameters.forEach(function (oParameter) {
						if (oParameter.Type === "LabeledElement") {
							aAdditionalProperties.push(oParameter.Value.Path);
						}
					});
				}
				if ((oDataField["RecordType"] === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") && oDataField.Url && oDataField.Url.Path) {
					aAdditionalProperties.push(oDataField.Url.Path);
				}
				if (aAdditionalProperties.length > 0) {
					var sAdditionalProperties = "";
					aAdditionalProperties.forEach(function (oProperty) {
						if (sAdditionalProperties) {
							sAdditionalProperties = sAdditionalProperties + ",";
						}
						sAdditionalProperties = sAdditionalProperties + oProperty;
					});
					sP13N += '", "additionalProperty":"' + sAdditionalProperties;
				}
				var oRestrictionModel = getAllRestrictions(oContextSet, oContextProp.name);
				var bNotFilterable = oRestrictionModel.getFilterRestriction();
				var bNotSortable = oRestrictionModel.getSortRestriction();
				var bMultiNavigation = oAnnotationHelper.checkMultiplicityForDataFieldAssociationInTable(oInterface, oContextSet, oDataField);
				if (!bNotSortable) {
					if (bMultiNavigation) {
						sP13N += '", "sortProperty":"' + "";
					} else if (sNavigation) {
						sP13N += '", "sortProperty":"' + sNavigation + oContextProp.name;
					} else {
						sP13N += '", "sortProperty":"' + oContextProp.name;
					}
				}
				if (!bNotFilterable) {
					if (bMultiNavigation) {
						sP13N += '", "filterProperty":"' + "";
					} else {
						sP13N += '", "filterProperty":"' + oContextProp.name;
					}
				}
				var oContext = oInterface.getInterface(2);
				var iColumnIndex = oAnnotationHelper._determineColumnIndex(oContext);
				if (iColumnIndex >= 0) {
					sP13N += '", "columnIndex":"' + iColumnIndex;
				}
				sP13N += '", "autoColumnWidth":\\{"min":2,"max":19\\}\\}';
			}
			return sP13N;
		},
		getSortProperty: function (oInterface, oDataField, oContextSet, oDataFieldTarget, sAnnotationPath, bAnalytical) {
			var bSort = true; // retrieve binding for sort property
			return getSortOrFilterProperty(oInterface, oDataField, oContextSet, oDataFieldTarget, sAnnotationPath, bSort, bAnalytical);
		},
		getFilterProperty: function (oInterface, oDataField, oContextSet, oDataFieldTarget, sAnnotationPath, bAnalytical) {
			var bSort = false; // retrieve binding for filter property
			return getSortOrFilterProperty(oInterface, oDataField, oContextSet, oDataFieldTarget, sAnnotationPath, bSort, bAnalytical);
		},
		getSortOrder: function (Par) {
			var str = '';
			for (var i = 0; i < Par.length; i++) {
				if (!str) {
					str = Par[i].Property.PropertyPath;
				} else {
					str = str + ', ' + Par[i].Property.PropertyPath;
				}
				if (Par[i].Descending) {
					str = str + ' ' + Par[i].Descending.Bool;
				}
			}
			return str;
		},
		replaceSpecialCharsInId: function (sId) {
			if (sId.indexOf(" ") >= 0) {
				oLogger.error("Annotation Helper: Spaces are not allowed in ID parts. Please check the annotations, probably something is wrong there.");
			}
			return sId.replace(/@/g, "").replace(/\//g, "::").replace(/#/g, "::");
		},
		getStableIdPartFromDataField: function (oDataField) {
			var sPathConcat = "", sIdPart = "", sDataFieldString;
			if (oDataField.RecordType && oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
				return oAnnotationHelper.replaceSpecialCharsInId(oDataField.Action.String);
			} else if (oDataField.RecordType && (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation")) {
				if (oDataField.SemanticObject.String) {
					sIdPart = oAnnotationHelper.replaceSpecialCharsInId(oDataField.SemanticObject.String);
				} else if (oDataField.SemanticObject.Path) {
					sIdPart = oAnnotationHelper.replaceSpecialCharsInId(oDataField.SemanticObject.Path);
				}
				if (oDataField.Action && oDataField.Action.String) {
					sIdPart = sIdPart + "::" + oAnnotationHelper.replaceSpecialCharsInId(oDataField.Action.String);
				} else if (oDataField.Action && oDataField.Action.Path) {
					sIdPart = sIdPart + "::" + oAnnotationHelper.replaceSpecialCharsInId(oDataField.Action.Path);
				}
				return sIdPart;
			} else if (oDataField.RecordType && oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
				return oAnnotationHelper.replaceSpecialCharsInId(oDataField.Target.AnnotationPath);
			} else if (oDataField.IconUrl && (oDataField.IconUrl.Path || oDataField.IconUrl.String) ) {
				if (oDataField.IconUrl.Path) {
					sIdPart = oAnnotationHelper.replaceSpecialCharsInId(oDataField.IconUrl.Path);
				} else if (oDataField.IconUrl.String) {
					sDataFieldString = oDataField.IconUrl.String.replace("://", "-");
					sIdPart = oAnnotationHelper.replaceSpecialCharsInId(sDataFieldString);
				}
				return sIdPart;
			} else if (oDataField.Value && oDataField.Value.Path) {
				return oAnnotationHelper.replaceSpecialCharsInId(oDataField.Value.Path);
			} else if (oDataField.Value && oDataField.Value.Apply && oDataField.Value.Apply.Name === "odata.concat") {
				for (var i = 0; i < oDataField.Value.Apply.Parameters.length; i++) {
					if (oDataField.Value.Apply.Parameters[i].Type === "Path") {
						if (sPathConcat) {
							sPathConcat = sPathConcat + "::";
						}
						sPathConcat = sPathConcat + oAnnotationHelper.replaceSpecialCharsInId(oDataField.Value.Apply.Parameters[i].Value);
					}
				}
				return sPathConcat;
			} else {
				// In case of a string or unknown property
				oLogger.error("Annotation Helper: Unable to create a stable ID. Please check the annotations.");
			}
		},
		getStableIdPartFromDataPoint: function (oDataPoint) {
			var sPathConcat = "";
			if (oDataPoint.Value && oDataPoint.Value.Path) {
				return oAnnotationHelper.replaceSpecialCharsInId(oDataPoint.Value.Path);
			} else if (oDataPoint.Value && oDataPoint.Value.Apply && oDataPoint.Value.Apply.Name === "odata.concat") {
				for (var i = 0; i < oDataPoint.Value.Apply.Parameters.length; i++) {
					if (oDataPoint.Value.Apply.Parameters[i].Type === "Path") {
						if (sPathConcat) {
							sPathConcat = sPathConcat + "::";
						}
						sPathConcat = sPathConcat + oAnnotationHelper.replaceSpecialCharsInId(oDataPoint.Value.Apply.Parameters[i].Value);
					}
				}
				return sPathConcat;
			} else {
				// In case of a string or unknown property
				oLogger.error("Annotation Helper: Unable to create stable ID derived from annotations.");
			}
		},
		getStableIdPartFromFacet: function (oFacet) {
			return StableIdHelper.getStableId({
				type: "ObjectPage",
				subType: "Facet",
				bIsHeaderFacet: (typeof this.getContext === "function" && this.getContext() && this.getContext().getPath() && this.getContext().getPath().indexOf("com.sap.vocabularies.UI.v1.HeaderFacets") >= 0),
				sRecordType: oFacet.RecordType,
				sAnnotationPath: oFacet.Target && oFacet.Target.AnnotationPath,
				sAnnotationId: oFacet.ID && oFacet.ID.String
			}) || fnGetFallbackId(oFacet);
		},
		getVisibilityForExtensionPointReplaceHeader: function (sEntitySet, oManifestExtend) {
			var sExtensionPointId = "ReplaceHeaderExtensionFacet|" + sEntitySet;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointReplaceHeaderExists: function (sEntitySet, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "ReplaceHeaderExtensionFacet|" + sEntitySet;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		getVisibilityForExtensionPointNoImage: function (sEntitySet, oManifestExtend) {
			var sExtensionPointId = "NoImageExtensionFacet|" + sEntitySet;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointNoImageExists: function (sEntitySet, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "NoImageExtensionFacet|" + sEntitySet;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		getVisibilityForExtensionPointAfterImage: function (sEntitySet, oManifestExtend) {
			var sExtensionPointId = "AfterImageExtensionFacet|" + sEntitySet;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointAfterImageExists: function (sEntitySet, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "AfterImageExtensionFacet|" + sEntitySet;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		getVisibilityForExtensionPointBeforeSimpleHeaderFacet: function (sEntitySet, oFacet, oManifestExtend, oDataField) {
			var sSecondHalfIdPart;
			var sFirstHalfIdPart = oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			if (oFacet.Target.AnnotationPath.indexOf("DataPoint") > 0) {
				sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataPoint(oDataField);
			} else {
				sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataField(oDataField);
			}
			var sId = sFirstHalfIdPart + "::" + sSecondHalfIdPart;
			var sExtensionPointId = "BeforeSimpleHeaderFacet|" + sEntitySet + "|headerEditable::" + sId;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointBeforeSimpleHeaderFacetExists: function (sEntitySet, oFacet, oManifestExtend, oDataField) {
			if (oManifestExtend) {
				var sSecondHalfIdPart;
				var sFirstHalfIdPart = oAnnotationHelper.getStableIdPartFromFacet(oFacet);
				if (oFacet.Target.AnnotationPath.indexOf("DataPoint") > 0) {
					sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataPoint(oDataField);
				} else {
					sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataField(oDataField);
				}
				var sId = sFirstHalfIdPart + "::" + sSecondHalfIdPart;
				var sExtensionPointId = "BeforeSimpleHeaderFacet|" + sEntitySet + "|headerEditable::" + sId;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		getVisibilityForExtensionPointReplaceSimpleHeaderFacet: function (sEntitySet, oFacet, oManifestExtend, oDataField) {
			var sSecondHalfIdPart;
			var sFirstHalfIdPart = oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			if (oFacet.Target.AnnotationPath.indexOf("DataPoint") > 0) {
				sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataPoint(oDataField);
			} else {
				sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataField(oDataField);
			}
			var sId = sFirstHalfIdPart + "::" + sSecondHalfIdPart;
			var sExtensionPointId = "ReplaceSimpleHeaderFacet|" + sEntitySet + "|headerEditable::" + sId;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointReplaceSimpleHeaderFacetExists: function (sEntitySet, oFacet, oManifestExtend, oDataField) {
			if (oManifestExtend) {
				var sSecondHalfIdPart;
				var sFirstHalfIdPart = oAnnotationHelper.getStableIdPartFromFacet(oFacet);
				if (oFacet.Target.AnnotationPath.indexOf("DataPoint") > 0) {
					sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataPoint(oDataField);
				} else {
					sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataField(oDataField);
				}
				var sId = sFirstHalfIdPart + "::" + sSecondHalfIdPart;
				var sExtensionPointId = "ReplaceSimpleHeaderFacet|" + sEntitySet + "|headerEditable::" + sId;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		getVisibilityForExtensionPointAfterSimpleHeaderFacet: function (sEntitySet, oFacet, oManifestExtend, oDataField) {
			var sSecondHalfIdPart;
			var sFirstHalfIdPart = oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			if (oFacet.Target.AnnotationPath.indexOf("DataPoint") > 0) {
				sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataPoint(oDataField);
			} else {
				sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataField(oDataField);
			}
			var sId = sFirstHalfIdPart + "::" + sSecondHalfIdPart;
			var sExtensionPointId = "AfterSimpleHeaderFacet|" + sEntitySet + "|headerEditable::" + sId;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointAfterSimpleHeaderFacetExists: function (sEntitySet, oFacet, oManifestExtend, oDataField) {
			if (oManifestExtend) {
				var sSecondHalfIdPart;
				var sFirstHalfIdPart = oAnnotationHelper.getStableIdPartFromFacet(oFacet);
				if (oFacet.Target.AnnotationPath.indexOf("DataPoint") > 0) {
					sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataPoint(oDataField);
				} else {
					sSecondHalfIdPart = oAnnotationHelper.getStableIdPartFromDataField(oDataField);
				}
				var sId = sFirstHalfIdPart + "::" + sSecondHalfIdPart;
				var sExtensionPointId = "AfterSimpleHeaderFacet|" + sEntitySet + "|headerEditable::" + sId;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		getVisibilityForExtensionPointBeforeHeaderFacet: function (sEntitySet, oFacet, oManifestExtend) {
			var sExtensionPointId = "BeforeHeaderFacet|" + sEntitySet + "|headerEditable::" + oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointBeforeHeaderFacetExists: function (sEntitySet, oFacet, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "BeforeHeaderFacet|" + sEntitySet + "|headerEditable::" + oAnnotationHelper.getStableIdPartFromFacet(oFacet);
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		getVisibilityForExtensionPointReplaceHeaderFacet: function (sEntitySet, oFacet, oManifestExtend) {
			var sExtensionPointId = "ReplaceHeaderFacet|" + sEntitySet + "|headerEditable::" + oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointReplaceHeaderFacetExists: function (sEntitySet, oFacet, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "ReplaceHeaderFacet|" + sEntitySet + "|headerEditable::" + oAnnotationHelper.getStableIdPartFromFacet(oFacet);
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		getVisibilityForExtensionPointAfterHeaderFacet: function (sEntitySet, oFacet, oManifestExtend) {
			var sExtensionPointId = "AfterHeaderFacet|" + sEntitySet + "|headerEditable::" + oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['bVisibleOnEdit'] === false) {
				return false;
			}
			return true;
		},
		extensionPointAfterHeaderFacetExists: function (sEntitySet, oFacet, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "AfterHeaderFacet|" + sEntitySet + "|headerEditable::" + oAnnotationHelper.getStableIdPartFromFacet(oFacet);
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		extensionPointBeforeHeaderDataPointExists: function (sEntitySet, oDataPoint, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "BeforeHeaderDataPoint|" + sEntitySet + "|" + oAnnotationHelper.getStableIdPartFromDataPoint(oDataPoint);
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		extensionPointReplaceHeaderDataPointExists: function (sEntitySet, oDataPoint, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "ReplaceHeaderDataPoint|" + sEntitySet + "|" + oAnnotationHelper.getStableIdPartFromDataPoint(oDataPoint);
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		extensionPointAfterHeaderDataPointExists: function (sEntitySet, oDataPoint, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "AfterHeaderDataPoint|" + sEntitySet + "|" + oAnnotationHelper.getStableIdPartFromDataPoint(oDataPoint);
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		/**
		 * This function return manifest view extensions with "key" property in "sap.ui.generic.app" object if manifest entry contains 3 pipes for facet extensions
		 * @param {object} oContext
		 * @returns {string} returns manifest view extensions object path
		 */
		getObjectPageExtensions: function (oContext) {
			var oManifest = oContext.getObject();
			for (var key in oManifest) {
				if (key.split('|').length === 4 && !(oManifest[key]['sap.ui.generic.app'] && oManifest[key]['sap.ui.generic.app']['key'])) {
					deepExtend(oManifest[key], { 'sap.ui.generic.app': { 'key': key.split('|')[3] } });
				}
			}
			oContext.getModel().setProperty("/manifestViewExtensions", oManifest);
			return "/manifestViewExtensions";
		},
		extensionPointBeforeSubSectionExists: function (sEntitySet, sFacetId, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "BeforeSubSection|" + sEntitySet + "|" + sFacetId;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		extensionPointAfterSubSectionExists: function (sEntitySet, sFacetId, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "AfterSubSection|" + sEntitySet + "|" + sFacetId;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		extensionPointReplaceSubSectionExists: function (sEntitySet, sFacetId, oManifestExtend) {
			if (oManifestExtend) {
				var sExtensionPointId = "ReplaceSubSection|" + sEntitySet + "|" + sFacetId;
				return oManifestExtend[sExtensionPointId];
			}
			return false;
		},
		/**
		 * This function gets the facet title for extension sManifestKey
		 * @param {string} sManifestKey
		 * @param {object} oManifestExtend
		 * @returns {string} returns title for extension sManifest
		 */
		getExtensionPointFacetTitle: function (sManifestKey, oManifestExtend) {
			var oExtension = oManifestExtend[sManifestKey];
			if (oExtension && oExtension['sap.ui.generic.app'] && oExtension['sap.ui.generic.app'].title) {
				return oExtension['sap.ui.generic.app'].title;
			}
		},
		getExtensionPointAfterFacetTitle: function (sEntitySet, oFacet, oManifestExtend) {
			var sExtensionPointId = "AfterFacet|" + sEntitySet + "|" + oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['sap.ui.generic.app'] && oExtension['sap.ui.generic.app'].title) {
				return oExtension['sap.ui.generic.app'].title;
			}
		},
		getExtensionPointBeforeSubSectionTitle: function (sEntitySet, sFacetId, oManifestExtend) {
			var sExtensionPointId = "BeforeSubSection|" + sEntitySet + "|" + sFacetId;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['sap.ui.generic.app'] && oExtension['sap.ui.generic.app'].title) {
				return oExtension['sap.ui.generic.app'].title;
			}
		},
		getExtensionPointAfterSubSectionTitle: function (sEntitySet, sFacetId, oManifestExtend) {
			var sExtensionPointId = "AfterSubSection|" + sEntitySet + "|" + sFacetId;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['sap.ui.generic.app'] && oExtension['sap.ui.generic.app'].title) {
				return oExtension['sap.ui.generic.app'].title;
			}
		},
		getExtensionPointReplaceSubSectionTitle: function (sEntitySet, sFacetId, oManifestExtend) {
			var sExtensionPointId = "ReplaceSubSection|" + sEntitySet + "|" + sFacetId;
			var oExtension = oManifestExtend[sExtensionPointId];
			if (oExtension && oExtension['sap.ui.generic.app'] && oExtension['sap.ui.generic.app'].title) {
				return oExtension['sap.ui.generic.app'].title;
			}
		},
		// The result is either Navigation or Inactive or a binding string which resolve to one of these two possibilities
		getColumnListItemType: function (oListEntitySet, aSubPages, oManifest, oTreeNode, bIsDraftEnabled, sAnnotationPath) {
			var bIsRoot = !oTreeNode.level; // information, whether we are on the root pagee
			// check for special feature: navigation from list report to object page via navigationProperty
			var bIsListWithNavigationProperty = bIsRoot && aSubPages.some(function (oSubPage) {
				return oSubPage.navigationProperty;
			});
			var bAllowsNavigationInEditMode = bIsDraftEnabled || bIsRoot; // in non-draft mode forward navigation is disabled in edit mode
			return getNavigationBinding(oListEntitySet, aSubPages, oManifest, sAnnotationPath, bAllowsNavigationInEditMode, false, bIsListWithNavigationProperty, bIsRoot);
		},
		// Returns the expression binding/ value for the row action count in the Grid/ Analytical table in the Detail Page for chevron display.
		getRowActionCountForDetailPage: function (oListEntitySet, aSubPages, oManifest, sAnnotationPath, bIsDraftEnabled) {
			return getRowActionCount(oListEntitySet, aSubPages, oManifest, sAnnotationPath, bIsDraftEnabled);
		},
		// Returns the expression binding/value for the row action count in the Grid/ Analytical table in the List Report for chevron display.
		getRowActionCountForListReport: function (oListEntitySet, aSubPages, oManifest, oManifestSettings) {
			return getRowActionCount(oListEntitySet, aSubPages, oManifest, "", true);
		},

		hasSubObjectPage: function (oListEntitySet, aSubPages) {
			return hasSubObjectPage(oListEntitySet, aSubPages);
		},

        getUpdateRestrictions: function (oSourceEntitySet) {
			var oUpdateRestrictions = oSourceEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"];
			if (!oUpdateRestrictions){
				return true;
			}
			if (oUpdateRestrictions.Updatable.Bool === "false") {
				return false;
			} else {
				if (oUpdateRestrictions["Updatable"].Path) {
					return oUpdateRestrictions["Updatable"].Path;
				}
			}
			return true;
		},

		// Check for Creatable-Path. Returns either true, false, or creatable-path
		isRelatedEntityCreatable: function (oInterface, oSourceEntitySet, oRelatedEntitySet, aSubPages, oFacet, oSections, bIsDraftEnabled, oCreateWithParameterDialog) {

			var result = false;
			var oModel = oInterface.getInterface(0).getModel();
			var oInsertRestrictions = oSourceEntitySet["Org.OData.Capabilities.V1.InsertRestrictions"];
			var oSourceEntityType = oModel.getODataEntityType(oSourceEntitySet.entityType);
			var oRestrictionSetViaNavRestrictions;
			var sFullCreatablePath;
			var bIsInlineCreateEnabled;
			var bIsInlineCreationRowsEnabled;

			if (oSections) {
				bIsInlineCreateEnabled = oAnnotationHelper.isInlineMode(oFacet, oSections, "inline");
				bIsInlineCreationRowsEnabled = oAnnotationHelper.isInlineMode(oFacet, oSections, "creationRows");
			}

			if (oAnnotationHelper.hasSubObjectPage(oRelatedEntitySet, aSubPages) || bIsInlineCreateEnabled || bIsInlineCreationRowsEnabled || !!oCreateWithParameterDialog) {
				if (bIsDraftEnabled) {
					result = "{= ${ui>/editable}}";
				} else {
					result = "{= !${ui>/editable}}";
				}


				// check if there are Insert Restrictions.
				oRestrictionSetViaNavRestrictions = oAnnotationHelper.handleNavigationRestrictions(oModel, oSourceEntitySet, oRelatedEntitySet, "Insertable");
				if (oRestrictionSetViaNavRestrictions && oRestrictionSetViaNavRestrictions["Insertable"]) {
					if (oRestrictionSetViaNavRestrictions["Insertable"].Path) {
						sFullCreatablePath = oRestrictionSetViaNavRestrictions["Insertable"].Path;
						result = bIsDraftEnabled ? "{= ${ui>/editable} ? ${" + sFullCreatablePath + "} : false}" : "{= !${ui>/editable} ? ${" + sFullCreatablePath + "} : false}";
					}
				} else if (oInsertRestrictions && oInsertRestrictions.NonInsertableNavigationProperties && oInsertRestrictions.NonInsertableNavigationProperties.length > 0) {
					// find the Insert Restriction for the RelatedEntitySet if available
					for (var i = 0; i < oInsertRestrictions.NonInsertableNavigationProperties.length; i++) {
						var oNavigationProperty = oInsertRestrictions.NonInsertableNavigationProperties[i];
						var sNavigationPropertyPath = oAnnotationHelper._getNonInsertableNavigationPropertyPath(oNavigationProperty);

						if (sNavigationPropertyPath) {	// if Navigation Property Path is undefined, skip this iteration
							var oAssociationSetEnd = oModel.getODataAssociationSetEnd(oSourceEntityType, sNavigationPropertyPath); // get the association set end

							//check if entity set of the Navigation Property Path matches to the input parameter RelatedEntitySet.
							if (oAssociationSetEnd && oAssociationSetEnd.entitySet === oRelatedEntitySet.name) {
								if (oNavigationProperty.If && oNavigationProperty.If.length === 2) { // 2 entries: 1st is the condition and the 2nd is the navigation path
									var oIfCondition = oNavigationProperty.If[0]; // 1st entry is the If condition
									sFullCreatablePath = oIfCondition.Not ? oIfCondition.Not.Path : oIfCondition.Path;

									// Check if the creatable-path is valid.
									if (isPropertyPathBoolean(oModel, oSourceEntitySet.entityType, sFullCreatablePath)) {
										oAnnotationHelper._actionControlExpand(oInterface, sFullCreatablePath, oSourceEntityType.name); // expand the Creatable-Path
										if (bIsDraftEnabled) {
											if (oIfCondition.Not) {
												result = "{= ${ui>/editable} ? ${" + sFullCreatablePath + "} : false}";
											} else {
												result = "{= ${ui>/editable} ? !${" + sFullCreatablePath + "} : false}";
											}
										} else {
											if (oIfCondition.Not) {
												result = "{= !${ui>/editable} ? ${" + sFullCreatablePath + "} : false}";
											} else {
												result = "{= !${ui>/editable} ? !${" + sFullCreatablePath + "} : false}";
											}
										}
									} else {
										result = false; // if the creatable-path is not valid, disable creation; assuming error in the annotations
										oLogger.warning("Creatable-Path is not valid. Creation for " + oRelatedEntitySet.name + " is disabled");
									}
								} else {
									result = false; //there is no IF condition therefore the creation for the related entity is disabled
								}
								break; // stop loop
							}
						}
					}
				}
			}

			return result;
		},
		/***************************************************************
			Get the Navigation Property Path from the annotations with IF or not.
		 ***************************************************************/
		_getNonInsertableNavigationPropertyPath: function (oNavigationProperty) {
			var sNavigationPropertyPath;
			if (oNavigationProperty.NavigationPropertyPath) {
				sNavigationPropertyPath = oNavigationProperty.NavigationPropertyPath; // no IF annotation
			} else if (oNavigationProperty.If) {
				sNavigationPropertyPath = oNavigationProperty.If[1].NavigationPropertyPath; // 2nd entry in for the IF is the Navigation Property Path
			}
			return sNavigationPropertyPath;
		},

		areBooleanRestrictionsValidAndPossible: function (oInterface, mRestrictions, oRelatedEntitySet, sRestrictionType, sSourceEntitySet, bOnlyValidityCheck) {
			var oSourceEntitySet;
			var oModel = oInterface.getInterface(0).getModel();
			var sRelatedEntityType = oRelatedEntitySet.entityType;
			var oSection, sEntityType, sSourceEntityType;
			if (sSourceEntitySet) {
				oSourceEntitySet = oModel.getODataEntitySet(sSourceEntitySet);
				sSourceEntityType = oSourceEntitySet.entityType;
			}
			// Restrictions coming from the NavigationRestrictions of the Root Entity take the priority
			var oRestrictionSetViaNavRestrictions = oAnnotationHelper.handleNavigationRestrictions(oModel, oSourceEntitySet, oRelatedEntitySet, sRestrictionType);
			if (oRestrictionSetViaNavRestrictions) {
				oSection = oRestrictionSetViaNavRestrictions[sRestrictionType];
				sEntityType = sSourceEntityType;
			} else {
				oSection = mRestrictions && mRestrictions[sRestrictionType];
				sEntityType = sRelatedEntityType;
			}
			var bValid = !oSection || (
				oSection.Bool ? !oSection.Path : (!!oSection.Path && isPropertyPathBoolean(oModel, sEntityType, oSection.Path))
			);
			// if invalid annotation log error in the console
			if (!bValid) {
				oLogger.error("Service Broken: Restrictions annotations for entity type " + sRelatedEntityType + " for section '" + sRestrictionType + "' are invalid.");
			}
			return bValid && (!!bOnlyValidityCheck || !oSection || oSection.Bool !== "false");
		},

		//Generic Method to read the Insert, Delete and Update restrictions defined in the NavigationRestrictions of the root entity
		handleNavigationRestrictions: function(oModel, oSourceEntitySet, oRelatedEntitySet, sRestrictionType) {
			if (!oSourceEntitySet) {
				return false;
			}
			var oMap = {
				"Insertable": "InsertRestrictions",
				"Deletable": "DeleteRestrictions",
				"Updatable": "UpdateRestrictions"
			};
			var i, oNavigationProperty;
			var oNavigationRestrictions = oSourceEntitySet["Org.OData.Capabilities.V1.NavigationRestrictions"];

			if (oNavigationRestrictions && oNavigationRestrictions.RestrictedProperties) {
				var aRestrictedProperties = oNavigationRestrictions.RestrictedProperties;
				for (i in aRestrictedProperties) {
					oNavigationProperty = aRestrictedProperties[i];
					var oSourceEntityType = oModel.getODataEntityType(oSourceEntitySet.entityType);
					var sNavigationPropertyPath = oNavigationProperty.NavigationProperty.NavigationPropertyPath;
					var oAssociationSetEnd = oModel.getODataAssociationSetEnd(oSourceEntityType, sNavigationPropertyPath);
					if (oAssociationSetEnd && oAssociationSetEnd.entitySet === oRelatedEntitySet.name && oNavigationProperty[oMap[sRestrictionType]]) {
						return oNavigationProperty[oMap[sRestrictionType]];
					}
				}
			}
			return false;
		},

		_isPropertyPathBoolean: function (oMetaModel, sEntityTypeName, sPropertyPath) {
			return isPropertyPathBoolean(oMetaModel, sEntityTypeName, sPropertyPath);
		},

		_actionControlExpand: function (oInterface, sPath, sEntityType) {
			var aExpand = [], sExpand;
			oInterface = oInterface.getInterface(0);
			var oMetaModel = oInterface.getModel();
			var oEntityType = oMetaModel.getODataEntityType(sEntityType);
			// check if expand is needed
			if (sPath) {
				sExpand = oAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, sPath);
				if (sExpand) {
					aExpand.push(sExpand);
				}
			}
			if (aExpand.length > 0) {
				// we analyze a facet that is part of the root context
				// set expand to expand data bag
				var oPreprocessorsData = oInterface.getSetting("preprocessorsData");
				if (oPreprocessorsData) {
					var aRootContextExpand = oPreprocessorsData.rootContextExpand || [];
					for (var j = 0; j < aExpand.length; j++) {
						if (aRootContextExpand.indexOf(aExpand[j]) === -1) {
							aRootContextExpand.push(aExpand[j]);
						}
					}
					oPreprocessorsData.rootContextExpand = aRootContextExpand;
				}
			}
		},

		_mapTextArrangement4smartControl: function (sTextArrangementIn) {
			var sTextArrangement = "descriptionAndId";
			switch (sTextArrangementIn) {
				case "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast":
					sTextArrangement = "idAndDescription";
					break;
				case "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate":
					sTextArrangement = "idOnly";
					break;
				case "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly":
					sTextArrangement = "descriptionOnly";
					break;
				default:
					break;
			}
			return sTextArrangement;
		},

		getTextArrangementForSmartControl: function (oInterface, oField, refEntitySet, oEntitySet) {
			oInterface = oInterface.getInterface(0);
			var oEntityType;
			var oMetaModel = oInterface.getModel();

			if (refEntitySet.name == undefined) {
				oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			} else {
				oEntityType = oMetaModel.getODataEntityType(refEntitySet.entityType);
			}

			var sTextArrangement = "descriptionAndId";
			if (oMetaModel.getODataProperty(oEntityType, oField.Value.Path)) {
				var oPropertyTextModel = oMetaModel.getODataProperty(oEntityType, oField.Value.Path)["com.sap.vocabularies.Common.v1.Text"];
				// 1. check TextArrangement definition for property
				if (oPropertyTextModel && oPropertyTextModel["com.sap.vocabularies.UI.v1.TextArrangement"] && oPropertyTextModel["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember) {
					sTextArrangement = oAnnotationHelper._mapTextArrangement4smartControl(
						oPropertyTextModel["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember);
					return sTextArrangement;
				}
			}
			// 2. check TextArrangement definition for entity type
			if (oEntityType["com.sap.vocabularies.UI.v1.TextArrangement"] && oEntityType["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember) {
				sTextArrangement = oAnnotationHelper._mapTextArrangement4smartControl(
					oEntityType["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember);
				return sTextArrangement;
			}
			return sTextArrangement;
		},

		formatSubSectionHeader: function (sSubSectionTitle, sControlTitle) {
			return sSubSectionTitle != sControlTitle ? true : false;
		},

		getTitle: function (oSourceEntityType, oSourceClickedField, sNavigationProperty) {
			var sResult;
			var oTextArrangement = oAnnotationHelper.getTextArrangementObject(oSourceEntityType, oSourceClickedField, sNavigationProperty);
			if (oTextArrangement) {
				sResult = oAnnotationHelper.getTitleTextArrangementBindingPath(oTextArrangement.textArrangement, oTextArrangement.propertyPath, oTextArrangement.textPath);
			}
			return sResult;
		},

		getDescription: function (oSourceEntityType, oSourceClickedField, sNavigationProperty) {
			var sResult;
			var oTextArrangement = oAnnotationHelper.getTextArrangementObject(oSourceEntityType, oSourceClickedField, sNavigationProperty);
			if (oTextArrangement) {
				sResult = oAnnotationHelper.getDescriptionTextArrangementBindingPath(oTextArrangement.textArrangement, oTextArrangement.propertyPath, oTextArrangement.textPath);
			}
			return sResult;
		},
		getTextArrangementObject: function (oSourceEntityType, oSourceClickedField, sNavigationProperty) {
			var sTextArrangement, sPropertyPath, sTextPath;
			if (oSourceClickedField) {
				//title
				sPropertyPath = oSourceClickedField.name;
				//text
				var oPropertyTextModel = oSourceClickedField["com.sap.vocabularies.Common.v1.Text"];
				if (oPropertyTextModel) {
					sTextPath = oPropertyTextModel.Path;
				}
				//evaluate text arrangement
				sTextArrangement = oAnnotationHelper.getTextArrangement(oSourceEntityType, oSourceClickedField);
				return {
					textArrangement: sTextArrangement,
					propertyPath: sPropertyPath,
					textPath: sTextPath
				};
			}
		},
		getTextArrangement: function (oEntityType, oField) {
			var sTextArrangement;
			// 1. check TextArrangement definition for property directly - has prio 1
			if (oField["com.sap.vocabularies.UI.v1.TextArrangement"] && oField["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember) {
				sTextArrangement = oAnnotationHelper._mapTextArrangement4smartControl(oField["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember);
			}
			// 2. check TextArrangement definition under property/text - has prio 2
			if (!sTextArrangement) {
				var oPropertyTextModel = oField["com.sap.vocabularies.Common.v1.Text"];
				if (oPropertyTextModel && oPropertyTextModel["com.sap.vocabularies.UI.v1.TextArrangement"] && oPropertyTextModel["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember) {
					sTextArrangement = oAnnotationHelper._mapTextArrangement4smartControl(oPropertyTextModel["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember);
				}
			}
			// 3. check TextArrangement definition for entity type
			if (!sTextArrangement) {
				if (oEntityType && oEntityType["com.sap.vocabularies.UI.v1.TextArrangement"] && oEntityType["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember) {
					sTextArrangement = oAnnotationHelper._mapTextArrangement4smartControl(oEntityType["com.sap.vocabularies.UI.v1.TextArrangement"].EnumMember);
				}
			}
			if (!sTextArrangement) { //coming from the title should get a readable description and underneath is the id - the default
				sTextArrangement = "descriptionAndId";
			}
			return sTextArrangement;
		},
		getTitleTextArrangementBindingPath: function (sTextArrangement, sPropertyPath, sTextPath) {
			var sPropertyBinding = "{" + sPropertyPath + "}";
			var sTextBinding = "{" + sTextPath + "}";
			//in case the text is not annotated it can't be first, so the property will be displayed
			if (!sTextPath) {
				return sPropertyBinding;
			}

			if (sTextArrangement === "descriptionAndId") { 			//TEXTFIRST
				return sTextBinding;
			} else if (sTextArrangement === "descriptionOnly") {		//TEXTONLY
				return sTextBinding;
			} else if (sTextArrangement === "idAndDescription") {	//TEXTLAST
				return sPropertyBinding;
			} else if (sTextArrangement === "idOnly") {				//TEXTSEPERATE
				return sPropertyBinding;
			}
		},
		getDescriptionTextArrangementBindingPath: function (sTextArrangement, sPropertyPath, sTextPath) {
			var sPropertyBinding = "{" + sPropertyPath + "}";
			var sTextBinding = "{" + sTextPath + "}";
			//in case the text is not annotated it will be shown in the title only
			if (!sTextPath) {
				return "";
			}

			if (sTextArrangement === "descriptionAndId") { 			//TEXTFIRST
				return sPropertyBinding;
			} else if (sTextArrangement === "descriptionOnly") {		//TEXTONLY
				return "";
			} else if (sTextArrangement === "idAndDescription") {	//TEXTLAST
				return sTextBinding;
			} else if (sTextArrangement === "idOnly") {				//TEXTSEPERATE
				return "";
			}
		},

		doesFieldGroupContainOnlyOneMultiLineDataField: function (oFieldGroup, oFirstDataFieldProperties) {
			if (oFieldGroup.Data.length !== 1) {
				return false;
			}
			if ((oFirstDataFieldProperties['com.sap.vocabularies.UI.v1.MultiLineText'] === undefined)
				|| (oFieldGroup.Data[0].RecordType !== "com.sap.vocabularies.UI.v1.DataField")) {
				return false;
			}
			return true;
		},
		testFormatter: function (value) {
			return "formatted:" + value;
		},
		getFacetID: function (sEntitySet, oFacet) {
			return sEntitySet + "|" + oAnnotationHelper.getStableIdPartFromFacet(oFacet);
		},
		getStableIdPartForDatafieldActionButton: function (oDatafield, oFacet, oTabItem, oChartItem) {
			var sStableId = "";
			var sDatafieldStableId = "";
			var sFacetStableId = "";
			if (oFacet) {
				sFacetStableId = oAnnotationHelper.getStableIdPartFromFacet(oFacet);
			}
			if (oDatafield) {
				sDatafieldStableId = oAnnotationHelper.getStableIdPartFromDataField(oDatafield);
			}
			sStableId = (sFacetStableId !== "" ? sFacetStableId + "::" : "") + "action::" + sDatafieldStableId;
			var sSuffix = oAnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem);
			if (sSuffix) {
				sStableId = sStableId.concat(sSuffix);
			}
			if (oChartItem) {
				sStableId = sStableId + "::chart";
			}
			return sStableId;
		},
		_hasCustomDeterminingActionsInListReport: function (sEntitySet, oManifestExt) {
			if (oManifestExt && oManifestExt[sEntitySet]) {
				var oManifestExtEntitySet = oManifestExt[sEntitySet];
				if (oManifestExtEntitySet.Actions) {
					for (var action in oManifestExtEntitySet.Actions) {
						if (oManifestExtEntitySet.Actions[action].determining) {
							return true;
						}
					}
				}
			}
			return false;
		},

		hasDeterminingActionsRespectingApplicablePath: function (oContext, aTerm, aExtensionActions) {
			var sApplicablePaths = "";
			oContext = oContext.getInterface(0);
			if (aExtensionActions) {
				for (var i = 0; i < aExtensionActions.length; i++) {
					if (aExtensionActions[i].determining) {
						if (aExtensionActions[i].applicablePath) {
							if (sApplicablePaths.length > 0) {
									sApplicablePaths += " || ";
							}
							sApplicablePaths += "${path: '" + aExtensionActions[i].applicablePath + "'}";
						} else {
							return true;
						}
					}
				}
			}
			if (aTerm) {
				for (var iRecord = 0; iRecord < aTerm.length; iRecord++) {
					if ((aTerm[iRecord].RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction") &&
						aTerm[iRecord].Determining && aTerm[iRecord].Determining.Bool === "true") {
						var sFunctionImport = oContext.getModel().getODataFunctionImport(aTerm[iRecord].Action.String, true);
						var oFunctionImport = oContext.getModel().getObject(sFunctionImport);
						if (oFunctionImport["sap:applicable-path"]) {
							if (sApplicablePaths.length > 0) {
								sApplicablePaths += " || ";
							}
							sApplicablePaths += "${path: '" + oFunctionImport["sap:applicable-path"] + "'}";
						} else {
							return "true";
						}
					}
				}
			}
			if (sApplicablePaths.length > 0) {
				return "{= " + sApplicablePaths + " || ${ui>/editable}}";
			} else {
				return "{ui>/editable}";
			}
		},
		hasDeterminingActions: function (aTerm, sEntitySet, oManifestExt) {
			if (sEntitySet && oManifestExt && oManifestExt["sap.suite.ui.generic.template.ListReport.view.ListReport"] &&
				oAnnotationHelper._hasCustomDeterminingActionsInListReport(sEntitySet, oManifestExt["sap.suite.ui.generic.template.ListReport.view.ListReport"]["sap.ui.generic.app"])) {
				return "true";
			} else if (sEntitySet && oManifestExt && oManifestExt["sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage"] &&
				oAnnotationHelper._hasCustomDeterminingActionsInListReport(sEntitySet, oManifestExt["sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage"]["sap.ui.generic.app"])) { //Check for AnalyticalListPage
				return "true";
			}
			for (var iRecord = 0; iRecord < aTerm.length; iRecord++) {
				if ((aTerm[iRecord].RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || aTerm[iRecord].RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") &&
					aTerm[iRecord].Determining && aTerm[iRecord].Determining.Bool === "true") {
					return "true";
				}
			}

			return "false";
		},

		actionControlDetermining: function (oTreeNode, sActionApplicablePath, oDataField) {
			//If UI.Hidden annotation is used, UI.Hidden gets the highest priority
			if (oDataField["com.sap.vocabularies.UI.v1.Hidden"]) {
				return oAnnotationHelper.getBindingForHiddenPath(oDataField);
			} else if (oTreeNode.level === 0 || !sActionApplicablePath) { // on level 0 applicable path does not influence the visibility but the enablement of the buttons
				return true;
			} else {
				return "{path: '" + sActionApplicablePath + "'}";
			}
		},
		actionControlInline: function (sActionApplicablePath) {
			if (!sActionApplicablePath) {
				return true;
			} else {
				return "{path: '" + sActionApplicablePath + "'}";
			}
		},

		/**
		 * Build a binding expression that will executed at runtime to calculate the percent value for a datapoint, so it can be consumed in the Progress Indicator.
		 * Rules to calculate:
		 * If the UoM is % then use the value as the percent value
		 * If the UoM is not % or is not provided then build the expression to calculate the percent value = data point value / target * 100
		 * The expression will be then resolved at runtime by the view
		 * Responsibility, resolve paths at pre-processing
		 * @function
		 * @private
		 * @parameter {sap.ui.core.util.XMLPreprocessor.IContext|sap.ui.model.Context} oInterface Callback interface object
		 * @parameter {map} dataPoint A DataPoint map as per the vocabulary term com.sap.vocabularies.UI.v1.DataPoint
		 * @parameter {map} [mUoM] A map containg the unit of measure as per the vocabulary term Org.OData.Measures.V1.Unit or Org.OData.Measures.V1.ISOCurrency
		 * @returns {string} A binding expression containing the formula to calculate the Progress Indicator percent value
		 */
		buildExpressionForProgressIndicatorPercentValue: function (oInterface, dataPoint, mUoM) {
			var sPercentValueExpression = "0";

			if (dataPoint.Value && dataPoint.Value.Path) { // Value is mandatory and it must be a path
				var sValue = "$" + sap.ui.model.odata.AnnotationHelper.format(oInterface, dataPoint.Value); // Value is expected to be always a path. ${Property}
				var sTarget, sUoM;

				if (dataPoint.TargetValue) { // Target can be a path or Edm Primitive Type
					sTarget = sap.ui.model.odata.AnnotationHelper.format(oInterface, dataPoint.TargetValue);
					sTarget = dataPoint.TargetValue.Path ? "$" + sTarget : sTarget;
				}

				if (mUoM) { // UoM or Currency can be a path or directly in the annotation
					mUoM = mUoM['Org.OData.Measures.V1.Unit'] || mUoM["Org.OData.Measures.V1.ISOCurrency"];
					if (mUoM) {
						sUoM = sap.ui.model.odata.AnnotationHelper.simplePath(oInterface, mUoM);
						sUoM = sUoM && mUoM.Path ? "$" + sUoM : "'" + sUoM + "'";
					}
				}

				// The expression consists of the following parts:
				// 1) When UoM is '%' then percent = value (target is ignored), and check for boundaries (value > 100 and value < 0).
				// 2) When UoM is not '%' (or is not provided) then percent = value / target * 100, check for division by zero and boundaries:
				// percent > 100 (value > target) and percent < 0 (value < 0)
				// Where 0 is Value, 1 is Target, 2 is UoM
				var sExpressionForUoMPercent = "({0} > 100 ? 100 : {0} < 0 ? 0 : {0} * 1)";
				var sExpressionForUoMNotPercent = "(({1}*1 > 0) ? (({0}*1 > {1}*1) ? 100 : (({0}*1 < 0) ? 0 : ({0} / {1} * 100))) : 0)";
				var sExpressionTemplate = "'{'= ({2} === ''%'') ? " + sExpressionForUoMPercent + " : " + sExpressionForUoMNotPercent + " '}'";
				sPercentValueExpression = formatMessage(sExpressionTemplate, [sValue, sTarget, sUoM]);
			}

			return sPercentValueExpression;
		},

		/**
		 * The resposibility of this method is to build an expression and its parts to call the runtime formatter to display value
		 * This formatter is called at pre-processing time
		 * @function
		 * @private
		 * @parameter {sap.ui.core.util.XMLPreprocessor.IContext|sap.ui.model.Context} oInterface Callback interface object
		 * @parameter {map} dataPoint A DataPoint map as per the vocabulary term com.sap.vocabularies.UI.v1.DataPoint
		 * @parameter {map} [mUoM] A map containg the unit of measure as per the vocabulary term Org.OData.Measures.V1.Unit or Org.OData.Measures.V1.ISOCurrency
		 * @returns {string} A binding expression containing the formatter and parts to compute the Progress Indicator display value
		 */
		buildExpressionForProgressIndicatorDisplayValue: function (oInterface, dataPoint, mUoM) {
			var sParts;

			var buildPart = function (oInterface, oProperty) {
				var sPropertyPath = oAnnotationHelper.trimCurlyBraces(sap.ui.model.odata.AnnotationHelper.format(oInterface, oProperty));
				var sPart = "{path: '" + sPropertyPath + "'}";
				return sPart;
			};

			sParts = buildPart(oInterface, dataPoint.Value) + ", " + buildPart(oInterface, dataPoint.TargetValue) + ", " + buildPart(oInterface, mUoM);

			var sDisplayValueExpression = "{ parts: [" + sParts + "], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.formatDisplayValue' }";
			return sDisplayValueExpression;
		},

		/**
		 * The resposibility of this method is to get the progressBar tooltip value
		 * This formatter is called at pre-processing time
		 * @function
		 * @private
		 * @parameter {sap.ui.core.util.XMLPreprocessor.IContext|sap.ui.model.Context} oInterface Callback interface object
		 * @parameter {map} [mUoM] A map containing the unit of measure as per the vocabulary term Org.OData.Measures.V1.Unit or Org.OData.Measures.V1.ISOCurrency
		 * @returns {string} A binding expression containing the display value for the tooltip
		 */
		getProgressIndicatorTooltip: function (oInterface, mUoM) {
			if (mUoM && mUoM['com.sap.vocabularies.Common.v1.QuickInfo'] && mUoM['com.sap.vocabularies.Common.v1.QuickInfo'].String) {
				return mUoM['com.sap.vocabularies.Common.v1.QuickInfo'].String;
			} else {
				return '';
			}
		},

		/**
		 * This function is meant to run at runtime, so the control and resource bundle can be available
		 * @function
		 * @private
		 * @parameter {string} sValue A string containing the value
		 * @parameter {string} sTarget A string containing the target value
		 * @parameter {string} sUoM A string containing the unit of measure
		 * @returns {string} A string containing the text that will be used in the display value of the Progress Indicator
		 */
		formatDisplayValue: function (sValue, sTarget, sUoM) {
			var sDisplayValue = "";
			if (sValue !== null && sValue !== undefined) {
				sValue = sValue.toString();
			}
			if (sTarget !== null && sTarget !== undefined) {
				sTarget = sTarget.toString();
			}
			if (sValue) {
				var oControl = this;
				var oResourceBundle = oControl.getModel("i18n").getResourceBundle();
				var aCustomData = oControl.getCustomData();
				var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
				sValue = sap.ui.core.format.NumberFormat.getInstance(oLocale).format(sValue);
				sTarget = sTarget || aCustomData.filter(function (oObject) {
					if (oObject.getKey() === "Target") {
						return oObject;
					}
				});
				sTarget = typeof (sTarget) === "object" ? (sTarget[0] && sTarget[0].getValue()) : sTarget;

				sUoM = sUoM || aCustomData.filter(function (oObject) {
					if (oObject.getKey() === "UoM") {
						return oObject;
					}
				});
				sUoM = typeof (sUoM) === "object" ? (sUoM[0] && sUoM[0].getValue()) : sUoM;
				if (sUoM) {
					if (sUoM === '%') { // uom.String && uom.String === '%'
						sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_PERCENT", [sValue]);
					} else {// (uom.String and not '%') or uom.Path
						if (sTarget) {
							sTarget = sap.ui.core.format.NumberFormat.getInstance(oLocale).format(sTarget);
							sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_NOT_PERCENT", [sValue, sTarget, sUoM]);
						} else {
							sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_NOT_PERCENT_NO_TARGET_VALUE", [sValue, sUoM]);
						}
					}
				} else {
					if (sTarget) {
						sTarget = sap.ui.core.format.NumberFormat.getInstance(oLocale).format(sTarget);
						sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_NO_UOM", [sValue, sTarget]);
					} else {
						sDisplayValue = sValue;
					}
				}
			} else { // Cannot do anything
				oLogger.warning("Value property is mandatory, the default (empty string) will be returned");
			}

			return sDisplayValue;
		},

		/**
		 * Build a binding expression for criticality in the progress indicator data point.
		 * Step 1: Check if datapoint is annotated with CriticalityType or CriticalityCalculationType
		 * Step 2: For CriticalityType build the binding expression to check if the property contains, Name or Value of the enumType (Example: 'UI.CriticalityType/Neutral' or '0')
		 * Other cases are not valid and the default sap.ui.core.ValueState.None will be returned
		 * @parameter {sap.ui.core.util.XMLPreprocessor.IContext|sap.ui.model.Context} oInterface Callback interface object
		 * @parameter {map} dataPoint A DataPoint map as per the vocabulary term com.sap.vocabularies.UI.v1.DataPoint
		 * @returns {string} A binding expression for the criticality property of the Progress Indicator
		 */
		buildExpressionForProgressIndicatorCriticality: function (oInterface, dataPoint) {
			var sFormatCriticalityExpression = sap.ui.core.ValueState.None;
			var sExpressionTemplate;
			var oCriticalityProperty = dataPoint.Criticality;

			if (oCriticalityProperty) {
				sExpressionTemplate = "'{'= ({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Negative'') || ({0} === ''1'') || ({0} === 1) ? ''" + sap.ui.core.ValueState.Error + "'' : " +
					"({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Critical'') || ({0} === ''2'') || ({0} === 2) ? ''" + sap.ui.core.ValueState.Warning + "'' : " +
					"({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Positive'') || ({0} === ''3'') || ({0} === 3) ? ''" + sap.ui.core.ValueState.Success + "'' : " +
					"''" + sap.ui.core.ValueState.None + "'' '}'";
				if (oCriticalityProperty.Path) {
					var sCriticalitySimplePath = '$' + sap.ui.model.odata.AnnotationHelper.simplePath(oInterface, oCriticalityProperty);
					sFormatCriticalityExpression = formatMessage(sExpressionTemplate, sCriticalitySimplePath);
				} else if (oCriticalityProperty.EnumMember) {
					var sCriticality = "'" + oCriticalityProperty.EnumMember + "'";
					sFormatCriticalityExpression = formatMessage(sExpressionTemplate, sCriticality);
				} else {
					oLogger.warning("Case not supported, returning the default sap.ui.core.ValueState.None");
				}
			} else {
				// Any other cases are not valid, the default value of 'None' will be returned
				oLogger.warning("Case not supported, returning the default sap.ui.core.ValueState.None");
			}

			return sFormatCriticalityExpression;
		},
		// To build criticality for the action buttons based on the criticality annotation
		// Both path and enum values are considered
		buildExpressionForButtonCriticality: function(oDataPoint) {
				var sFormatCriticalityExpression = SapMLibrary.ButtonType.Default;
				var sExpressionTemplate;
				var oCriticalityProperty = oDataPoint.Criticality;
				if (oCriticalityProperty) {
					sExpressionTemplate = "'{'= ({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Negative'') || ({0} === ''1'') || ({0} === 1) ? ''" + SapMLibrary.ButtonType.Reject + "'' : " +
					"({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Positive'') || ({0} === ''3'') || ({0} === 3) ? ''" + SapMLibrary.ButtonType.Accept + "'' : " +
					"''" + SapMLibrary.ButtonType.Default + "'' '}'";
					if (oCriticalityProperty.Path) {
						var sCriticalitySimplePath = "${" + oCriticalityProperty.Path + "}";
						sFormatCriticalityExpression = formatMessage(sExpressionTemplate, sCriticalitySimplePath);
					} else if (oCriticalityProperty.EnumMember) {
						var sCriticality = "'" + oCriticalityProperty.EnumMember + "'";
						sFormatCriticalityExpression = formatMessage(sExpressionTemplate, sCriticality);
					} else {
						oLogger.warning("Case not supported, returning the default sap.m.ButtonType.Default");
					}
				} else {
					// Any other cases are not valid, the default value of 'Default' will be returned
					oLogger.warning("Case not supported, returning the default sap.m.ButtonType.Default");
				}

				return sFormatCriticalityExpression;
		},
		// To set emphasize of the primary action buttons on load, based on the availablity of critical action button
		// if the critical action button is hidden in the runtime, we don't emphasize back the primary action buttons as we do not know what could be the primary action buttons
		// this is inline with delete button not being emphasized if edit button becomes hidden during runtime.
		buildEmphasizedButtonExpression: function(aIdentification) {
			if (!aIdentification) {
				return SapMLibrary.ButtonType.Emphasized;
			}
			var sFormatEmphasizedExpression;
			var bIsAlwaysDefault;

			aIdentification.forEach(function(oDataField) {
				var oCriticalityProperty = oDataField.Criticality;
				var oDataFieldHidden = oDataField["com.sap.vocabularies.UI.v1.Hidden"];
				if (oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" && !bIsAlwaysDefault && oCriticalityProperty) {

					switch (oCriticalityProperty.EnumMember) {
						// supported criticality are [Positive/3/'3'] and [Negative/1/'1']
						case "com.sap.vocabularies.UI.v1.CriticalityType/Negative":
						case "com.sap.vocabularies.UI.v1.CriticalityType/Positive":
						case "1":
						case 1:
						case "3":
						case 3:
							if (!oDataFieldHidden) {
								sFormatEmphasizedExpression = SapMLibrary.ButtonType.Default;
								bIsAlwaysDefault = true;
							}
							sFormatEmphasizedExpression = sFormatEmphasizedExpression || SapMLibrary.ButtonType.Default;
							break;
						default:
							sFormatEmphasizedExpression = SapMLibrary.ButtonType.Emphasized;
					}
					if (oCriticalityProperty.Path) {
						// when Criticality is set using a path, use the path for deducing the Emphsized type for default Primary Action
						sFormatEmphasizedExpression =
							"{= ((${" +
							oCriticalityProperty.Path +
							"} === 'com.sap.vocabularies.UI.v1.CriticalityType/Negative') || (${" +
							oCriticalityProperty.Path +
							"} === '1') || (${" +
							oCriticalityProperty.Path +
							"} === 1) " +
							"|| (${" +
							oCriticalityProperty.Path +
							"} === 'com.sap.vocabularies.UI.v1.CriticalityType/Positive') || (${" +
							oCriticalityProperty.Path +
							"} === '3') || (${" +
							oCriticalityProperty.Path +
							"} === 3)) ? " +
							"'Default'" +
							" : " +
							"'Emphasized'" +
							" }";
					}
				}
			});
			return sFormatEmphasizedExpression || SapMLibrary.ButtonType.Emphasized;
		},

		trimCurlyBraces: function (value) {
			return value ? value.replace("{", "").replace("}", "") : undefined;
		},

		/**
		 * Get entity set name for Smart Chart and Smart Microchart.
		 * Returns the name of the main entity set (current node in the object page) or the referenced entity set (as per the target of the annotation path).
		 * @parameter {object} refEntitySet The referenced entity set
		 * @parameter {object} entitySet The entity set of the current object in the page
		 * @returns {string} sEntitySetName The entity set name for the main object type or the referenced entity set
		 */
		getEntitySetName: function (refEntitySet, entitySet) {
			var sEntitySetName = "";
			try {
				sEntitySetName = refEntitySet.name || entitySet.name;
			} catch (oError) {
				oLogger.warning("At least one of the input parameters is undefined. Returning default value for entity set name.");
			}
			return sEntitySetName;
		},

		getBreakoutActionEnabledKey: function (oAction, oTabItem) {
			var sButtonId = oAnnotationHelper.getBreakoutActionButtonId(oAction, oTabItem);
			var sEnabledKey = "{_templPriv>/generic/listCommons/breakoutActionsEnabled/" + sButtonId + "/enabled}";
			return sEnabledKey;
		},

		// get the real time visible binding expression of the control
		getControlVisibleTerm: function (sControlId){
			return "${_templPrivView>/#" + sControlId + "/visible}";
		},

		// get the real time enabled binding expression of the control
		getControlEnabledTerm: function (sControlId){
			return "${_templPrivView>/#" + sControlId + "/enabled}";
		},

		// applicable for both types of action i.e., standard and custom actions
		getActionCommandVisibility: function (sButtonId) {
			return !sButtonId || "{= " + oAnnotationHelper.getControlVisibleTerm(sButtonId) + " && " + oAnnotationHelper.getControlEnabledTerm(sButtonId) + "}";
		},
		
		buildVisibilityExprOfDataFieldForIntentBasedNaviButton: function (oDataField) {
			//If UI.Hidden annotation is used, UI.Hidden gets the highest priority
			if (oDataField["com.sap.vocabularies.UI.v1.Hidden"]) {
				return oAnnotationHelper.getBindingForHiddenPath(oDataField);
			} else if (!!oDataField.RequiresContext && oDataField.RequiresContext.Bool == "false" && (!oDataField.Inline || oDataField.Inline.Bool === "false")) {
				// oDataField.Inline is Nullable=true, i.e. it may be absent in the annotations
				// oDataField.RequiresContext is Nullable as well, its defaut value is "true"
				var sSemanticObject = oDataField.SemanticObject.String;
				var sAction = oDataField.Action.String;
				return "{= !!${_templPriv>/generic/supportedIntents/" + sSemanticObject + "/" + sAction + "/visible}}"; // maybe we can optimize it later and do one call for all buttons in the toolbar somewhere
			} else {
				return true; // if the button is inline or the button is in the toolbar and has requresContext=true the button is always visible and is enabled/disabled depending on the context
			}
		},

		/*
		 * oLineItem contains a path to the LineItem which can be with or without a qualifier
		 *
		 */
		searchForFirstSemKey_Title_Description: function (oLineItem) {
			var sLineItemPath, sTargetString, iLastOccurenceOfSlash, sEntityTypePath, sRelativeLineItemPath, oModel, bTitle, bDescr, iDescIndex, iTitleIndex, oEntityTypeAnnotations, sFirstSemKeyPropPath, aLineItemAnnotations, oHeaderInfoAnnotations, sHeaderTitle, sHeaderDescription, iLineItemsNumber, i;
			if (!oLineItem) {
				return;
			}
			sLineItemPath = oLineItem.getPath();
			if (sLineItemPath.indexOf("com.sap.vocabularies.UI.v1.LineItem") < 0) {
				return;
			}
			iLastOccurenceOfSlash = sLineItemPath && sLineItemPath.lastIndexOf("/");
			sEntityTypePath = sLineItemPath.substring(0, iLastOccurenceOfSlash);
			sRelativeLineItemPath = sLineItemPath.substring(iLastOccurenceOfSlash + 1); // we want to get 'com.sap.vocabularies.UI.v1.LineItem' part
			oModel = oLineItem.getModel();
			oEntityTypeAnnotations = oModel && oModel.getObject(sEntityTypePath);
			if (oEntityTypeAnnotations) {
				// we consider the first field of the semantic key only, the same way SmartTable does
				sFirstSemKeyPropPath = oEntityTypeAnnotations["com.sap.vocabularies.Common.v1.SemanticKey"] && oEntityTypeAnnotations["com.sap.vocabularies.Common.v1.SemanticKey"][0] && oEntityTypeAnnotations["com.sap.vocabularies.Common.v1.SemanticKey"][0].PropertyPath;
				aLineItemAnnotations = oEntityTypeAnnotations[sRelativeLineItemPath];
				oHeaderInfoAnnotations = oEntityTypeAnnotations["com.sap.vocabularies.UI.v1.HeaderInfo"];

				sHeaderTitle = "";
				sHeaderDescription = "";
				if (oHeaderInfoAnnotations) {
					sHeaderTitle = oHeaderInfoAnnotations && oHeaderInfoAnnotations["Title"] && oHeaderInfoAnnotations["Title"].Value && oHeaderInfoAnnotations["Title"].Value.Path;
					sHeaderDescription = oHeaderInfoAnnotations && oHeaderInfoAnnotations["Description"] && oHeaderInfoAnnotations["Description"].Value && oHeaderInfoAnnotations["Description"].Value.Path;
				}
				iLineItemsNumber = aLineItemAnnotations && aLineItemAnnotations.length;
				sTargetString = sLineItemPath + "/";
				for (i = 0; i < iLineItemsNumber; i++) {
					if (aLineItemAnnotations[i].RecordType === "com.sap.vocabularies.UI.v1.DataField" && aLineItemAnnotations[i].Value.Path === sFirstSemKeyPropPath) {
						if (oAnnotationHelper.isPropertyHidden(aLineItemAnnotations[i])) {
							continue;
						}
						sTargetString = sTargetString + i + '/Value/Path';
						return sTargetString;
					}
					if (aLineItemAnnotations[i].RecordType === "com.sap.vocabularies.UI.v1.DataField" && aLineItemAnnotations[i].Value.Path === sHeaderTitle) {
						if (oAnnotationHelper.isPropertyHidden(aLineItemAnnotations[i])) {
							continue;
						}
						bTitle = true;
						iTitleIndex = i;
					}
					if (aLineItemAnnotations[i].RecordType === "com.sap.vocabularies.UI.v1.DataField" && aLineItemAnnotations[i].Value.Path === sHeaderDescription) {
						if (oAnnotationHelper.isPropertyHidden(aLineItemAnnotations[i])) {
							continue;
						}
						bDescr = true;
						iDescIndex = i;
					}
				}
				if (bTitle) {
					sTargetString = sTargetString + iTitleIndex + '/Value/Path';
					return sTargetString;
				} else if (bDescr) {
					sTargetString = sTargetString + iDescIndex + '/Value/Path';
					return sTargetString;
				}
			} else { // Cannot do anything
				oLogger.warning("No entity type provided");
			}
		},

		isPropertyHidden: function (oLineItemAnnotations) {
			var bHidden = false;
			// "com.sap.vocabularies.Common.v1.FieldControl" annotation is deprecated but we check it here for compatibility reasons
			if (oLineItemAnnotations["com.sap.vocabularies.UI.v1.Hidden"] || (oLineItemAnnotations["com.sap.vocabularies.Common.v1.FieldControl"] &&
				oLineItemAnnotations["com.sap.vocabularies.Common.v1.FieldControl"].EnumMember &&
				oLineItemAnnotations["com.sap.vocabularies.Common.v1.FieldControl"].EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Hidden")) {
				bHidden = true;
			}
			return bHidden;
		},

		getColumnHeaderText: function (oDataFieldValue, oDataField) {
			var sResult;
			if (oDataField.Label) {
				return oDataField.Label.String;
			} else {
				sResult = oDataFieldValue["sap:label"] || (oDataFieldValue["com.sap.vocabularies.Common.v1.Label"] || "").String || "";
				return sResult;
			}
		},

		getColumnToolTip: function (oDataFieldValue, oDataField) {
			var sResult;
			if (oDataField.Label) {
				return oDataField.Label.String;
			} else {
				sResult = oDataFieldValue["sap:quickinfo"] || (oDataFieldValue["com.sap.vocabularies.Common.v1.QuickInfo"] || "").String
					|| oDataFieldValue["sap:label"] || (oDataFieldValue["com.sap.vocabularies.Common.v1.Label"] || "").String || "";
				return sResult;
			}
		},

		getTextForDataField: function (oDataFieldValue) {
			var sValue = oDataFieldValue["com.sap.vocabularies.Common.v1.Text"] && oDataFieldValue["com.sap.vocabularies.Common.v1.Text"].Path;
			return sValue;
		},

		getColumnCellFirstText: function (oDataFieldValue, oDataField, oEntityType, bCheckVisibility) {
			var sResult, sTextArrangement;
			sTextArrangement = oAnnotationHelper.getTextArrangement(oEntityType, oDataFieldValue);
			switch (sTextArrangement) {
				case "idAndDescription":
					sResult = oDataField.Value.Path;
					if (!sResult) {
						sResult = oAnnotationHelper.getTextForDataField(oDataFieldValue);
					}
					break;
				case "idOnly":
					sResult = oDataField.Value.Path;
					if (!sResult) {
						sResult = oAnnotationHelper.getTextForDataField(oDataFieldValue);
					}
					break;
				case "descriptionAndId":
				case "descriptionOnly":
				default:
					sResult = oAnnotationHelper.getTextForDataField(oDataFieldValue);
					if (!sResult) {
						sResult = oDataField.Value.Path;
					}
					break;
			}
			if (sResult) {
				if (bCheckVisibility) {
					return true;
				} else {
					if (oDataFieldValue.type === "Edm.DateTimeOffset" || oDataFieldValue.type === "Edm.DateTime" || oDataFieldValue.type === "Edm.Time") {
						var sFormattedDateTime = oAnnotationHelper.formatDateTimeForCustomColumn(oDataFieldValue.type, sResult);
						return sFormattedDateTime;
					} else {
						return "{" + sResult + "}";
					}
				}
			}
		},

		getColumnCellSecondText: function (oDataFieldValue, oDataField, oEntityType, bCheckVisibility) {
			var sResult;
			sResult = oAnnotationHelper.getTitlePath(oDataFieldValue, oDataField, oEntityType);

			if (sResult) {
				if (bCheckVisibility) {
					return "{= ${path: '" + sResult + "'} ? true : false}";
				} else {
					if (oDataFieldValue.type === "Edm.DateTimeOffset" || oDataFieldValue.type === "Edm.DateTime" || oDataFieldValue.type === "Edm.Time") {
						var sFormattedDateTime = oAnnotationHelper.formatDateTimeForCustomColumn(oDataFieldValue.type, sResult);
						return sFormattedDateTime;
					} else {
						return "{" + sResult + "}";
					}
				}
			} else {
				return bCheckVisibility ? false : undefined;
			}
		},

		getTitlePath: function (oDataFieldValue, oDataField, oEntityType) {
			var sResult, sTextArrangement;
			sTextArrangement = oAnnotationHelper.getTextArrangement(oEntityType, oDataFieldValue);
			switch (sTextArrangement) {
				case "idOnly":
				case "descriptionOnly":
					break;
				case "idAndDescription":
					// if the Value.Path does not exist the v1.Text has been used as the first text already
					if (!oDataField.Value.Path) {
						break;
					}
					sResult = oAnnotationHelper.getTextForDataField(oDataFieldValue);
					break;
				case "descriptionAndId":
				default:
					// if this text does not exist oDataField.Value.Path has been already used as the first text so it should not be set as the second text again
					if (!oAnnotationHelper.getTextForDataField(oDataFieldValue)) {
						break;
					}
					// if no text arrangement annotation is maintained the second text should be oDataField.Value.Path if available
					sResult = oDataField.Value.Path;
					break;
			}
			return sResult;
		},

		getHeaderVisibility: function (oDataFieldValue, oDataField, oEntityType) {
			var sTitlePath, sTextArrangement;
			sTitlePath = oAnnotationHelper.getTitlePath(oDataFieldValue, oDataField, oEntityType);
			if (!sTitlePath) {
				//Special Case for datafield value of type "Edm.DateTimeOffset", "Edm.DateTime" and "Edm.Time".
				//getColumnCellFirstCell returns value rather than path for these types.
				if (oDataFieldValue.type === "Edm.DateTimeOffset" || oDataFieldValue.type === "Edm.DateTime" || oDataFieldValue.type === "Edm.Time") {
					sTitlePath = oAnnotationHelper.getColumnCellFirstText(oDataFieldValue, oDataField, oEntityType);
					return "{= " + sTitlePath + " ? false : true}";
				} else {
					sTitlePath = oAnnotationHelper.getColumnCellFirstText(oDataFieldValue, oDataField, oEntityType).replace("{", "").replace("}", "");
				}
			} else {
				sTextArrangement = oAnnotationHelper.getTextArrangement(oEntityType, oDataFieldValue);
				if (!sTextArrangement || sTextArrangement === "descriptionAndId") {
					sTitlePath = oAnnotationHelper.getColumnCellFirstText(oDataFieldValue, oDataField, oEntityType).replace("{", "").replace("}", "");
				}
				if (sTextArrangement === "idAndDescription") {
					sTitlePath = oAnnotationHelper.getTitlePath(oDataFieldValue, oDataField, oEntityType);
				}
			}
			if (sTitlePath) {
				return "{= ${path: '" + sTitlePath + "'} ? false : true}";
			}
			return false;
		},


		// Formats Edm.DateTimeOffset, Edm.DateTime and Edm.Time type values to 'medium' format for custom column.
		formatDateTimeForCustomColumn: function (oDataFieldValueType, sResult) {
			if (oDataFieldValueType === "Edm.DateTimeOffset") {
				return "{ path: '" + sResult + "', type: 'sap.ui.model.odata.type.DateTimeOffset', formatOptions: { style: 'medium'}, constraints: {displayFormat: 'Date'}}";
			} else if (oDataFieldValueType === "Edm.DateTime") {
				return "{ path: '" + sResult + "', type: 'sap.ui.model.odata.type.DateTime', formatOptions: { style: 'medium'}, constraints: {displayFormat: 'Date'}}";
			} else {
				return "{ path: '" + sResult + "', type: 'sap.ui.model.odata.type.Time', formatOptions: { style: 'medium'}}";
			}
		},

		getAdditionalSemanticObjects: function (oDataFieldValue) {
			var oAnnotation;
			var aAdditionalSemObjects = [];
			for (oAnnotation in oDataFieldValue) {
				if (oAnnotation.indexOf("com.sap.vocabularies.Common.v1.SemanticObject#") != -1) {
					aAdditionalSemObjects.push(oDataFieldValue[oAnnotation].String);
				}
			}
			if (aAdditionalSemObjects.length > 0) {
				return aAdditionalSemObjects;
			}
		},

		getColumnCellFirstTextVisibility: function (oDataFieldValue, oDataField, oEntityType) {
			var bCheckVisibility = true;
			var bVisible = !!oAnnotationHelper.getColumnCellFirstText(oDataFieldValue, oDataField, oEntityType, bCheckVisibility);
			return bVisible;
		},

		getColumnCellSecondTextVisibility: function (oDataFieldValue, oDataField, oEntityType) {
			var bCheckVisibility = true;
			var bVisible = oAnnotationHelper.getColumnCellSecondText(oDataFieldValue, oDataField, oEntityType, bCheckVisibility);
			return bVisible;
		},

		isSmartLink: function (oDataFieldValue) {
			var oAnnotation;
			for (oAnnotation in oDataFieldValue) {
				if (oAnnotation.indexOf('com.sap.vocabularies.Common.v1.SemanticObject') >= 0) {
					return true;
				}
			}
			return false;
		},

		// return the binding for the highlight property of a Table
		// oTreeNode describes the hosting page
		// sListEntitySet is the name of the entity set for the table
		// fnCheckIsDraftEnabled is a function that can be used to check whether an entity set is draft enabled
		setRowHighlight: function (oEntityType, oTreeNode, sListEntitySet, fnCheckIsDraftEnabled) {
			// For detail pages we consider the list entity set to be draft enabled if itself is draft enabled an the same holds for the page it resides on
			// For LR we only have to check the given entity set. However, note that this might be different from the entity set of the treeNode in case of multi view scenarios
			var bListEntitySetIsDraft = (oTreeNode.entitySet === sListEntitySet) ? oTreeNode.isDraft : (oTreeNode.isDraft || oTreeNode.level === 0) && fnCheckIsDraftEnabled(sListEntitySet);
			var bCanBeEditable = oTreeNode.level > 0 && (bListEntitySetIsDraft || !oTreeNode.isDraft);
			var sDraftParts =  bListEntitySetIsDraft ? "{path: 'IsActiveEntity'}, {path: 'HasActiveEntity'}" : "{value: true}, {value: true}";
			var sMessageParts = bCanBeEditable ? "{path: 'ui>/editable'}, {path: '_templPrivMessage>/'}" : "{value: false}, {value: ''}";
			var oCriticalityDef = oEntityType["com.sap.vocabularies.UI.v1.LineItem@com.sap.vocabularies.UI.v1.Criticality"];
			var sCriticalityPiece = (oCriticalityDef && oCriticalityDef.Path) ? ", {path: '" + oCriticalityDef.Path + "'}" : "";
			// Note: The two or three last parameters will not be evaluated by the formatter. They are just contained to ensure that the formatter is called when necessary.
			// More precisely: {path: '_templPrivMessage>/'} is included to listen to changes of the Message model
			// {path: ''} is included tolistento change of the row context. This is in particular important for scrolling in grid tables (recommendation from ui5).
			// sCriticalityPiece is needed to listen to changes of the criticality property. Note that there is a gap in case the criticality actually should be evaluated from the lineItemQualifier
			return "{parts: [" + sDraftParts + ", " + sMessageParts + sCriticalityPiece + ", {path: ''}], formatter: 'sap.suite.ui.generic.template.js.AnnotationHelper.setInfoHighlight'}";
		},

		setInfoHighlight: function (isActiveEntity, hasActiveEntity, bEditable) {
			var oRowContext = this.getBindingContext();
			if (!oRowContext){
				return "None";
			}
			var sMessage = "None";
			var MessageType = sap.ui.core.MessageType; // for better access to the enum
			if (bEditable){
				var aMessage = oRowContext.getMessages();
				for (var i = 0; i < aMessage.length; i++){
					var oMessage = aMessage[i];
					var sType = oMessage.getType();
					if (sType === MessageType.Error){
						return "Error";
					}
					if (sType === MessageType.Warning){
						sMessage = "Warning";
					} else if (sType === MessageType.Information && sMessage !== MessageType.Warning){
						sMessage = "Information";
					}
				}
			}
			// Highlights the rows of tables with blue if it is a newly created draft item
			if (isActiveEntity === false && hasActiveEntity === false) {
				return sMessage === "None" ? "Information" : sMessage;
			}
			// merge message state (not error) and criticality
			var sCriticality = getCriticality(this, oRowContext);
			return (sCriticality === "Error" || sCriticality === "Warning" || sMessage === "None") ? sCriticality : sMessage;
		},

		getDataFieldLabel: function (oInterface, oDataFieldValue, oDataField) {
			var sResult;
			if (oDataField.Label) {
				return sap.ui.model.odata.AnnotationHelper.format(oInterface, oDataField.Label);
			} else {
				sResult = oDataFieldValue["sap:label"] || (oDataFieldValue["com.sap.vocabularies.Common.v1.Label"] || "").String || "";
				if (sResult === "") {
					var labelFromExtension = (oDataFieldValue.extensions) ? oDataFieldValue.extensions.find(function (extension) { return extension.name === "label"; }) : null;
					if (labelFromExtension !== undefined && labelFromExtension !== null) {
						if (labelFromExtension.length !== undefined && labelFromExtension.length > 0) {
							sResult = labelFromExtension[0].value;
						} else {
							sResult = labelFromExtension.value;
						}
					} else {
						sResult = "";
					}
				}
				return sResult;
			}
		},

		// Returns a binding string for the value property of the specified field.
		// sMode (optional) the binding mode
		getDataFieldValue: function (oInterface, oDataFieldValue, sMode) {
			if (oDataFieldValue && !oDataFieldValue.Path && !oDataFieldValue.Apply && !oDataFieldValue.String) {
				return "";
			}
			var sRet = AnnotationHelperModel.format(oInterface.getModel() ? oInterface : oInterface.getInterface(0), oDataFieldValue);
			if (sMode) { //UI5 does not (yet) provide an api for setting the mode in the binding string. So we have to do this manually.
				sRet = sRet.replace("{", "{ mode:'" + sMode + "', ");
			}
			return sRet;
		},

		getDataFieldValueSimplePath: function (oInterface, oDataFieldValue, sMode) {
			if (oDataFieldValue && !oDataFieldValue.Path && !oDataFieldValue.Apply && !oDataFieldValue.String) {
				return "";
			}
			var sRet = AnnotationHelperModel.simplePath(oInterface.getModel() ? oInterface : oInterface.getInterface(0), oDataFieldValue);
			if (sMode) { //UI5 does not (yet) provide an api for setting the mode in the binding string. So we have to do this manually.
				sRet = sRet.replace("{", "{ mode:'" + sMode + "', ");
			}
			return sRet;
		},

		setNoDataTextForSmartTable: function (sEntitySet, sSmartTableId) {
			sSmartTableId = "::" + sEntitySet + "--" + sSmartTableId;
			return "{parts: [{value: '" + sSmartTableId + "'}], formatter: '._templateFormatters.setNoDataTextForSmartTable'}";
		},

		// Returns the entityType and association of target in case of multiple navigation paths
		getRelevantDataForAnnotationRecord: function (oModel, sDataFieldValuePath, oEntityType) {
			var sNavigationProperty, oAssociationEnd;
			while (sDataFieldValuePath.indexOf('/') > -1) {
				sNavigationProperty = sDataFieldValuePath.split("/")[0];
				sDataFieldValuePath = sDataFieldValuePath.split('/').slice(1).join('/');
				oAssociationEnd = oModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
				oEntityType = oModel.getODataEntityType(oAssociationEnd && oAssociationEnd.type);
			}
			return {
				"entityType": oEntityType,
				"association": oAssociationEnd,
				"dataFieldValuePath": sDataFieldValuePath
			};
		},


		getTextArrangementForSCFields: function (oInterface, oField, oEntitySet, aConnectedDataFields) {
			var oModel = oInterface.getInterface(0).getModel();
			var oEntityType = oModel.getODataEntityType(oEntitySet.entityType);
			var sDataFieldValuePath = oField.Value.Path;
			oEntityType = oAnnotationHelper.getRelevantDataForAnnotationRecord(oModel, oField.Value.Path, oEntityType).entityType;
			var aProperties = oEntityType.property || [];
			var sDescriptionField, sTextArrangement;
			for (var i = 0; i < aProperties.length; i++) {
				if (sDataFieldValuePath === aProperties[i].name) {
					sDescriptionField = aProperties[i]["sap:text"];
					break;
				}
			}
			for (var j = 0; j < aConnectedDataFields.length; j++) {
				if (aConnectedDataFields[j].RecordType === "com.sap.vocabularies.UI.v1.DataField" && aConnectedDataFields[j].Value.Path === sDescriptionField) {
					return "idOnly";
				}
			}
			sTextArrangement = oAnnotationHelper.getTextArrangementForSmartControl(oInterface, oField, {}, oEntitySet);
			return sTextArrangement;
		},

		checkMultiplicityForDataFieldAssociation: function (oInterface, oEntitySet, oDataField) {
			if (oDataField.Value && oDataField.Value.Path) {
				var sDataFieldValuePath = oDataField.Value.Path;
				var oMetaModel = oInterface.getModel(0);
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var oAssociation;
				if (!(sDataFieldValuePath.indexOf('/') > -1)) {
					return true;
				}
				while (sDataFieldValuePath.indexOf('/') > -1) {
					var sNavigationProperty = sDataFieldValuePath.split("/")[0];
					sDataFieldValuePath = sDataFieldValuePath.split('/').slice(1).join('/');
					oEntityType = oMetaModel.getODataEntityType(oAssociation && oAssociation.type) || oEntityType;
					oAssociation = oMetaModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
				}
				if (oAssociation && oAssociation.multiplicity === "*") {
					return false;
				}
			}
			return true;
		},

		checkMultiplicityForDataFieldAssociationInTable: function (oInterface, oEntitySet, oDataField) {
			if (oDataField.Value && oDataField.Value.Path) {
				var sDataFieldValuePath = oDataField.Value.Path;
				var oMetaModel = oInterface && oInterface.getModel && oInterface.getModel(0);
				var oEntityType = oMetaModel && oMetaModel.getODataEntityType && oMetaModel.getODataEntityType(oEntitySet.entityType);
				var oAssociation;
				if (!(sDataFieldValuePath.indexOf('/') > -1) || !oEntityType) {
					return false;
				}
				while (sDataFieldValuePath.indexOf('/') > -1) {
					var sNavigationProperty = sDataFieldValuePath.split("/")[0];
					sDataFieldValuePath = sDataFieldValuePath.split('/').slice(1).join('/');
					oEntityType = oMetaModel.getODataEntityType(oAssociation && oAssociation.type) || oEntityType;
					oAssociation = oMetaModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
				}
				if (oAssociation && oAssociation.multiplicity === "*") {
					return true;
				}
			}
			return false;
		},

		checkIfDataFieldIsNotForStream: function (oDataField) {
			if (oDataField.Value && oDataField.Value.Path) {
				var sDataFieldValuePath = oDataField.Value.Path;
				//Check for '$value' in the end of the binding
				if (sDataFieldValuePath.endsWith("$value")) {
					return false;
				}
				return true;
			}
		},
		/*
		This function determines if a property has a quickViewFacet annotated, and if it does the property name is returned so that quickViewFacet can be rendered even
		 if navigation is not possible
		This function is called for forceLinkRendering in semanticObjectController which expects an object
		SmartLinks expect a boolean value for forceLinkRendering which is not covered in this function, as semanticObectController covers all cases
		*/
		hasQuickViewFacet: function (oEntitySet, oTargetEntities) {
			return oTargetEntities[oEntitySet.entityType].sForceLinkRendering; //Example return value '\\{"ProductForEdit":"true"\\}'
		},

		/*
			This function builds the custom data with the headerinfo annotation used to build the dialog text when deleting a record
			1. From List Report Table
			2. From Object Page (using header delete)
			3. From OP Section Table
		*/
		buildHeaderInfoCustomData: function(oInterface, oDataField) {
			var vHeaderTitle = "";
			var vHeaderSubTitle = "";
			var bIsHeaderTitlePath = false;
			var bIsHeaderSubTitlePath = false;

			if (oDataField && oDataField.Title && oDataField.Title.Value) {
				vHeaderTitle = oDataField.Title.Value.Path ? oDataField.Title.Value.Path : (oDataField.Title.Value.String || "");
				bIsHeaderTitlePath = oDataField.Title.Value.Path ? true : false;
				bIsHeaderSubTitlePath = false; //set it to false initially
				//Sub-Title is necessary only if Title is present.
				if (oDataField && oDataField.Description && oDataField.Description.Value) {
					vHeaderSubTitle = oDataField.Description.Value.Path ? oDataField.Description.Value.Path : (oDataField.Description.Value.String || "");
					bIsHeaderSubTitlePath = oDataField.Description.Value.Path ? true : false;
				}
			}
			return '\{"headerTitle":"' + vHeaderTitle + '"\,"isHeaderTitlePath":' + bIsHeaderTitlePath + '\,"headerSubTitle":"' + vHeaderSubTitle + '"\,"isHeaderSubTitlePath":' + bIsHeaderSubTitlePath + '\}';
		},
		/**
		 * Return the presentationVariantQualifier associated with the PV used for the presentation of the table
		 * @param {object} [oEntityType] Entity type object
		 * @param {string} [sVariantAnnotationPath] Annotation path associated with the tab item
		 * @return {string} Qualfier of the PV used
		 */
		getPresentationVariantQualifier: function (oEntityType, sVariantAnnotationPath) {
			var oVariant = oEntityType[sVariantAnnotationPath];
			if (oVariant.Visualizations || oVariant.SortOrder) {
				// oVariant is a PresentationVariant
				return sVariantAnnotationPath.split("#")[1] || "";
			} else if (oVariant.PresentationVariant && (oVariant.PresentationVariant.Path || oVariant.PresentationVariant.AnnotationPath)) {
				// oVariant is a SelectionPresentationVariant referencing a PresentationVariant via Path
				var sAnnotationPath = oVariant.PresentationVariant.Path || oVariant.PresentationVariant.AnnotationPath;
				return sAnnotationPath.split("#")[1] || "";
			} else if (oVariant.PresentationVariant) {
				// oVariant is a SelectionPresentationVariant containing a PresentationVariant
				return "";
			}
		},
		/**
		 * Return the InitialExpansionLevel value defined in the PV used for the presentation of the table
		 * @param {object} [oEntityType] Entity type object
		 * @param {string} [sVariantAnnotationPath] Annotation path associated with the tab item
		 * @return {string} Value of the InitialExpansionLevel annotation given in the associated PV
		 */
		getPresentationVariantInitialExpansionLevel: function (oEntityType, sVariantAnnotationPath) {
			var oVariant = oEntityType[sVariantAnnotationPath];
			var oPresentationVariant = oAnnotationHelper.getPresentationVariant(oVariant, oEntityType);
			if (oPresentationVariant.InitialExpansionLevel) {
				return oPresentationVariant.InitialExpansionLevel.Int;
			}
		},

		/**
		 * Return the semantic color of the icon as per the annotation's values
		 * @param {object} [oInterface] Entity type object
		 * @param {object} [oCriticalityAnnotation] Annotation associated with the criticality property
		 */
		getIconSemanticColor: function (oInterface, oCriticalityAnnotation) {
			var sIconColor = "";
			if (oCriticalityAnnotation.EnumMember) {
				sIconColor = oCriticalityAnnotation.EnumMember.split('/')[1];
			} else if (oCriticalityAnnotation.Value) {
				var coreIconColor = sap.ui.core.IconColor;
				switch (oCriticalityAnnotation.Value) {
					case "0": sIconColor = coreIconColor.Neutral; break;
					case "1": sIconColor = coreIconColor.Negative; break;
					case "2": sIconColor = coreIconColor.Critical; break;
					case "3": sIconColor = coreIconColor.Positive; break;
					default: sIconColor = "";
				}
			} else if (oCriticalityAnnotation.String) {
				sIconColor = oCriticalityAnnotation.String;
			} else if (oCriticalityAnnotation.Path) {
				sIconColor = "{= $" + sap.ui.model.odata.AnnotationHelper.simplePath(oInterface, oCriticalityAnnotation) + "}";
			}
			return sIconColor;
		},
        /**
         * Return the array of string which are present in template
         * @param {object} [oTemplateData] template object
        */
         getConnectedFieldsTemplateParts : function (oTemplateData) {
            var sTemplateParts = oTemplateData.String.trim().match(/{[A-Za-z0-9]*\w}/g);
            return sTemplateParts;
        },
        /**
         * Return the first string for delimiter of semantic group element
         * @param {object} [oTemplateData] template object
         */
        getConnectedFieldsDelimiter : function (oTemplateData) {
            var sTemplateParts = oAnnotationHelper.getConnectedFieldsTemplateParts(oTemplateData);
			var sTempString = oTemplateData.String.trim();
            var sDelimiter = sTempString.substring(sTemplateParts[0].length, sTempString.indexOf(sTemplateParts[1]));
            return sDelimiter;
        },

        /**
         * Return an empty string but rearrages the keys inside connectedfield object according to template string
         * @param {object} [oConnectedFieldElement] Data object
         */
        rearrangeConnectedFields: function (oConnectedFieldElement) {
            var oDataObject = oConnectedFieldElement.getObject();
            var aTempString = oAnnotationHelper.getConnectedFieldsTemplateParts(oDataObject.Template);
            var oNewData = {
                "Data": {}
            };
            for (var count = 0; count < aTempString.length; count++) {
                aTempString[count] = aTempString[count].replace("{", "").replace("}", "");
                oNewData['Data'][aTempString[count]] = oDataObject['Data'][aTempString[count]];
            }
            oDataObject['Data'] = oNewData['Data'];
            return ' ';
		},
		/*
		 * in case different entitySets are defined in the manifest for different tabs we have to change entityTypeContext which
		 * has been set in the function createXMLView (TemplateComponent.js)
		 */
		getEntityType: function(oTabItem) {
			var oModel, oData, oTabItemObject, sEntitySet, oMetaModel, oEntitySet, sEntityType, oEntityTypeContext;
			oModel = oTabItem.getModel();
			oData = oModel.getData();
			oTabItemObject = oTabItem.getObject();
			sEntitySet = oTabItemObject && oTabItemObject.entitySet;
			oMetaModel = oData.metaModel;
			if (!!sEntitySet) {
				oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
				sEntityType = oEntitySet && oEntitySet.entityType;
			} else {
				sEntityType = oData.entityType;
			}
			oEntityTypeContext = oMetaModel.createBindingContext(oMetaModel.getODataEntityType(sEntityType, true));

			return oEntityTypeContext;
		},

		/*
		 * in case different entitySets are defined in the manifest for different tabs we have to change entitySetContext which
		 * has been set in the function createXMLView (TemplateComponent.js)
		 */
		getEntitySet: function(oTabItem) {
			var oModel, oData, oTabItemObject, sEntitySet, oMetaModel, oEntitySetContext;
			oModel = oTabItem.getModel();
			oData = oModel.getData();
			oTabItemObject = oTabItem.getObject();
			sEntitySet = oTabItemObject && oTabItemObject.entitySet;
			oMetaModel = oData.metaModel;
			if (!sEntitySet) {
				sEntitySet = oData.entitySet;
			}
			oEntitySetContext = oMetaModel.createBindingContext(oMetaModel.getODataEntitySet(sEntitySet, true));
			return oEntitySetContext;
		},

		getTableAnnotationPath: function(iTabItem) {
			var sTableAnnotationPath, oModel, oObject, oWorkingContext, i, aTableTabs, sTableAnnotationPath;
			oModel = iTabItem.getModel();
			var oData = oModel.getData();
			var oMetaModel = oData.metaModel;
			oObject = oModel.getObject(iTabItem.sPath);
			oWorkingContext = oModel.getData("workingContext")["workingContext"];
			aTableTabs = oWorkingContext.tableChartTabs;
			for (i in aTableTabs) {
				if (aTableTabs[i].key === oObject.key) {
					sTableAnnotationPath = aTableTabs[i].lineItemPath;
					var oTableAnnotationPathContext = oMetaModel.createBindingContext(sTableAnnotationPath);
					return oTableAnnotationPathContext;
				}
			}
		},
		getChartAnnotationPath: function(iTabItem) {
			var sChartAnnotationPath, oModel, oObject, i, aTableTabs, sVariantAnnotationPath, sChartAnnotationPath, sChartActionsAnnotationPath, oBindingContextPath;
			oModel = iTabItem.getModel();
			var oMetaModel = oModel.getProperty("/metaModel");
			oObject = oModel.getObject(iTabItem.sPath);
			aTableTabs = oModel.getData("workingContext")["workingContext"].tableChartTabs;
			for (i in aTableTabs) {
				sVariantAnnotationPath = aTableTabs[i].variantAnnotationPath;
				if (sVariantAnnotationPath === oObject.annotationPath) {
					sChartAnnotationPath = aTableTabs[i].chartAbsolutePath;
					sChartActionsAnnotationPath = sChartAnnotationPath + '/Actions';
					oBindingContextPath = oMetaModel.createBindingContext(sChartActionsAnnotationPath);
					return oBindingContextPath;
				}
			}
		},
		checkIfChartQualifier: function(oWorkingContext, iTabItem) {
			return !!(oAnnotationHelper.getChartQualifier(oWorkingContext, iTabItem));
		},

		getChartQualifier: function(oWorkingContext, iTabItem) {
			var sChartQualifier, i, sKey;
			for (i in oWorkingContext.tableChartTabs) {
				sKey = oWorkingContext.tableChartTabs[i].key;
				if (sKey === iTabItem.key) {
					sChartQualifier = oWorkingContext.tableChartTabs[i].controlQualifier;
					break;
				}
			}
			return sChartQualifier;
		},

		getChartPresentationVariantQualifier: function(oWorkingContext, iTabItem) {
			var sVariantQualifier, i, sKey;
			for (i in oWorkingContext.tableChartTabs) {
				sKey = oWorkingContext.tableChartTabs[i].key;
				if (sKey === iTabItem.key) {
					sVariantQualifier = oWorkingContext.tableChartTabs[i].variantQualifier;
					break;
				}
			}
			return sVariantQualifier;
		},

		getFormattedAddress: function (oInterface, oAddress) {
			var sAddress = "";
			if (oAddress[0].street) {
				sAddress += (sap.ui.model.odata.AnnotationHelper.format(oInterface, oAddress[0].street) + ", ");
			}
			if (oAddress[0].code) {
				sAddress += (sap.ui.model.odata.AnnotationHelper.format(oInterface, oAddress[0].code) + ", ");
			}
			if (oAddress[0].locality) {
				sAddress += (sap.ui.model.odata.AnnotationHelper.format(oInterface, oAddress[0].locality) + ", ");
			} 
			if (oAddress[0].region) {
				sAddress += (sap.ui.model.odata.AnnotationHelper.format(oInterface, oAddress[0].region) + ", ");
			} 
			if (oAddress[0].country) {
				sAddress += (sap.ui.model.odata.AnnotationHelper.format(oInterface, oAddress[0].country) + ", ");
			} 
			return sAddress.slice(0,sAddress.length - 2);
		},

		checkIfChartNavigationIsEnabled: function(oItabItem, aSubPages, sChartEntitySet, oQuickVariantSelectionX) {
			var bTemp = oItabItem.showItemNavigationOnChart;
			if (!bTemp) {
				return false;
			}

			sChartEntitySet = !!oItabItem.entitySet ? oItabItem.entitySet : sChartEntitySet;

			//enable external navigation for both one entitySet and different entitySets use case
			for (var i = 0; i < aSubPages.length; i++) {
				if (aSubPages[i].entitySet === sChartEntitySet && aSubPages[i].navigation && aSubPages[i].navigation['display']) {
					return true;
				}
			}

			//internal navigation should be enabled for one entitySet use case only
			// Only one subpage is allowed in the list report that is why no loop over the aSubPages
				if (aSubPages && aSubPages[0] && aSubPages[0].entitySet === sChartEntitySet && (!aSubPages[0].navigation || aSubPages[0].navigation && !aSubPages[0].navigation['display'])) { // check that the internal navigation is not overwritten by the external one
					return true;
				}
			return false;
		},
		checkIfDiffEntitySetsMode: function(oQuickVariantSelectionX) {
			var i;
			var oVariants = oQuickVariantSelectionX && oQuickVariantSelectionX.variants;
			for (i in oVariants) {
				if (oVariants[i].entitySet) {
					return true;
				}
			}
		},

		getSaveAndNextButtonVisibility: function(oManifest) {
			var sEditFlow = oManifest["sap.ui.generic.app"].pages[0].component.settings && oManifest["sap.ui.generic.app"].pages[0].component.settings.editFlow;
			if (sEditFlow === "direct") {
				return "{ui>/editable}";
			} else {
				return false;

			}

		},

		checkCopyActionValidity: function(aCollection) {
			var aIsCopyAction = (aCollection || []).filter(function (oRecord) {
				return (oRecord.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" && (oRecord["com.sap.vocabularies.UI.v1.IsCopyAction"] && oRecord["com.sap.vocabularies.UI.v1.IsCopyAction"].Bool));
			});
		
			if (aIsCopyAction.length > 1) {
				oLogger.error("Multiple actions are annotated with isCopyAction. There can be only one standard copy action.");
			}
			return aIsCopyAction.length === 1;
		},

		/**
		 * This method reads the insertable navigation restrictions from parent entity and builds customize config object.
		 * The smart table reads the customize config and sets the editability of smart fields 
		 * 
		 * @param {*} oInterface Context
		 * @param {*} oSourceEntitySet Parent entity set (entity set of object page)
		 * @param {*} oRelatedEntitySet Entity set of smart table
		 */
		buildSmartTableCustomizeConfig: function (oInterface, oSourceEntitySet, oRelatedEntitySet) {
			var sCustomizeConfig = null;
			var oModel = oInterface.getInterface(0).getModel();
			var oRestrictionSetViaNavRestrictions = oAnnotationHelper.handleNavigationRestrictions(oModel, oSourceEntitySet, oRelatedEntitySet, "Insertable");
			
			if (oRestrictionSetViaNavRestrictions && oRestrictionSetViaNavRestrictions["Insertable"]) {
				var oCustomizeConfig = Object.create(null);
				var oIgnoreInsertRestrictionSettings = Object.create(null);
				var oNavRestrictionsInsertable = oRestrictionSetViaNavRestrictions["Insertable"];
				
				if (oNavRestrictionsInsertable.Bool) {
					oIgnoreInsertRestrictionSettings["*"] = (oNavRestrictionsInsertable.Bool === "true");
				} else if (oNavRestrictionsInsertable.Path) {
					oIgnoreInsertRestrictionSettings["*"] = true;
				}
				oCustomizeConfig["ignoreInsertRestrictions"] = oIgnoreInsertRestrictionSettings;
				sCustomizeConfig = JSON.stringify(oCustomizeConfig);
			}

			return sCustomizeConfig;
		},

		/**
		 * Get the press event handler of the action (DateFieldForAction or DataFieldForIBN)
		 * @param {object} oPageSettings manifest page level settings
		 * and for DataFieldForIBN, it would be the actions defined in the 'outbounds' settings.
		 * @param {object} oDataField Corresponding DataField for which press event handler needs to be determined
		 * @param {object} oManifest Manifest of the app
		 * @param {bool} bDeterminingAction represents whether the action is determining
		 * @param {string} sOpHeaderCallAction represents OP header title action press handler
		 * @returns Press event handler of the passed DataField
		 */
		getAnnotatedActionPress: function (oPageSettings, oDataField, oManifest, bDeterminingAction, sOpHeaderCallAction) {
			var sActionPress = "";
			switch (oDataField.RecordType) {
				case "com.sap.vocabularies.UI.v1.DataFieldForAction":
					var sFunctionImportName = oDataField.Action.String.split("/")[1];
					var oAnnotatedAction = oPageSettings.annotatedActions && oPageSettings.annotatedActions[sFunctionImportName];
					if (oAnnotatedAction) {
						sActionPress = "cmd:" + oAnnotatedAction.command;
					} else if (bDeterminingAction) {
						sActionPress = "._templateEventHandlers.onDeterminingDataFieldForAction";
					} else {
						sActionPress = sOpHeaderCallAction || "._templateEventHandlers.onCallActionFromToolBar";
					}
					break;
				case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
					var oNavigationOutbounds = oManifest["sap.app"].crossNavigation && oManifest["sap.app"].crossNavigation.outbounds;
					var sMatchingOutbound = Object.keys(oNavigationOutbounds || {}).find(function (sOutbound) {
						return oNavigationOutbounds[sOutbound].semanticObject === oDataField.SemanticObject.String && oNavigationOutbounds[sOutbound].action === oDataField.Action.String;
					});
					var oOutboundCommand = oPageSettings.outbounds && oPageSettings.outbounds[sMatchingOutbound];
					if (oOutboundCommand) {
						sActionPress = "cmd:" + oOutboundCommand.command;
					} else {
						sActionPress = bDeterminingAction ? "._templateEventHandlers.onDeterminingDataFieldForIntentBasedNavigation" : "._templateEventHandlers.onDataFieldForIntentBasedNavigation";
					}
					break;
				default:
					break;
			}
			return sActionPress;
		},
		
		/**
		 * A side effect should get triggered directly if a value is selected for a field like value help/combo box, checkbox, date picker, datetime picker
		 * provided a side effect is defined on this field. However this should be only done if the side effect has only one source property (the source property must
		 * be the property bound to the corresponding field) i.e., the corresponding field should not have been defined in combination with other input field(s).
		 * @param {string} sPropertyPath binding path of the property
		 * @param {boolean} isDraftEnabled draft or non draft scenario
		 * @param {object} oMetaModel metamodel
		 * @param {string} sEntityType entity type of the detail page to which property belongs
		 * @returns side effect source property's type which represents if the field is annotated as single source property in the side effect or is also used in 
		 * combination with other field(s).
		 */
		getSideEffectSourcePropertyType: function(sPropertyPath, isDraftEnabled, oMetaModel, sEntityType) {
			if (!isDraftEnabled) {
				return "";
			}
			return metadataAnalyser.getFieldSourcePropertiesType(sPropertyPath, oMetaModel, sEntityType);
		},

		/**
		 * From UI5 v1.109, variant management is going to be enabled (by default) for smart table/chart and it will lead to the the issue of having multiple 
		 * duplicate implicit variants created by SVM (named as Personlization), and in order to mitigate the issue, persistencyKey has to be changed in certian scenarios.
		 * scenarios. With this change, application(s) who has already enabled the variant management will continue to have the old persistencyKey and should have
		 * no impact whatsoever. However, application(s) should not enable it going forward because of two reasons:
		 * 1) Its enabled by default.
		 * 2) If they do, then variant management may show duplicate implict 'Personalization' variants as in this case, persistencyKey is set to be the
		 * 	  id the smartable which is the old persistencyKey.
		 * @param {string} sSmartControlId smart control (table/chart) id
		 * @param {string} sPersistencyKeyState action needed for persistency key which is defined at design time.
		 * @returns the value of the persistencyKey of the smart control
		 */
		getPersistencyKey: function(sSmartControlId, sPersistencyKeyState) {
			switch (sPersistencyKeyState) {
				case "Retain":
					return sSmartControlId;
				case "Remove":
					return "";
				case "New":
					return sSmartControlId + "::Personalization";
				default:
					break;
			}
		}
	};
	oAnnotationHelper.getBlockForEditableHeaderFacet.requiresIContext = true;
	oAnnotationHelper.setAriaText.requiresIContext = true;
	oAnnotationHelper.getLinkTextForDFwithIBN.requiresIContext = true;
	oAnnotationHelper.getLabelForDFwithIBN.requiresIContext = true;
	oAnnotationHelper.isPropertySemanticKey.requiresIContext = true;
	oAnnotationHelper.suppressP13NDuplicateColumns.requiresIContext = true;
	oAnnotationHelper.formatWithExpand.requiresIContext = true;
	oAnnotationHelper.formatWithExpandSimple.requiresIContext = true;
	oAnnotationHelper.getNavigationPathWithExpand.requiresIContext = true;
	oAnnotationHelper.getFormGroupBindingString.requiresIContext = true;
	oAnnotationHelper.getCurrentPathWithExpand.requiresIContext = true;
	oAnnotationHelper.getCurrentPathWithExpandForContact.requiresIContext = true;
	oAnnotationHelper.getTextArrangementForSmartControl.requiresIContext = true;
	oAnnotationHelper.createP13N.requiresIContext = true;
	oAnnotationHelper.createP13NColumnForConnectedFields.requiresIContext = true;
	oAnnotationHelper.createP13NColumnForIndicator.requiresIContext = true;
	oAnnotationHelper.createP13NColumnForAction.requiresIContext = true;
	oAnnotationHelper.createP13NColumnForContactPopUp.requiresIContext = true;
	oAnnotationHelper.createP13NColumnForChart.requiresIContext = true;
	oAnnotationHelper.getSortProperty.requiresIContext = true;
	oAnnotationHelper.getFilterProperty.requiresIContext = true;
	oAnnotationHelper.hasDeterminingActionsRespectingApplicablePath.requiresIContext = true;
	oAnnotationHelper.buildExpressionForProgressIndicatorPercentValue.requiresIContext = true;
	oAnnotationHelper.buildExpressionForProgressIndicatorDisplayValue.requiresIContext = true;
	oAnnotationHelper.getProgressIndicatorTooltip.requiresIContext = true;
	oAnnotationHelper.buildExpressionForProgressIndicatorCriticality.requiresIContext = true;
	oAnnotationHelper.areBooleanRestrictionsValidAndPossible.requiresIContext = true;
	oAnnotationHelper.isRelatedEntityCreatable.requiresIContext = true;
	oAnnotationHelper.buildBreadCrumbExpression.requiresIContext = true;
	oAnnotationHelper.getApplicablePathForChartToolbarActions.requiresIContext = true;
	oAnnotationHelper.buildAnnotatedActionButtonEnablementExpression.requiresIContext = true;
	oAnnotationHelper.getIconTabFilterText.requiresIContext = true;
	oAnnotationHelper.formatImageUrl.requiresIContext = true;
	oAnnotationHelper.getPathWithExpandFromHeader.requiresIContext = true;
	oAnnotationHelper.formatImageOrTypeUrl.requiresIContext = true;
	oAnnotationHelper.formatHeaderImage.requiresIContext = true;
	oAnnotationHelper.getDataFieldLabel.requiresIContext = true;
	oAnnotationHelper.getDataFieldValue.requiresIContext = true;
	oAnnotationHelper.getDataFieldValueSimplePath.requiresIContext = true;
	oAnnotationHelper.getActionButtonVisibility.requiresIContext = true;
	oAnnotationHelper.checkMultiplicityForDataFieldAssociation.requiresIContext = true;
	oAnnotationHelper.checkMultiplicityForDataFieldAssociationInTable.requiresIContext = true;
	oAnnotationHelper.getTextArrangementForSCFields.requiresIContext = true;
	oAnnotationHelper.buildActionButtonsCustomData.requiresIContext = true;
	oAnnotationHelper.buildHeaderInfoCustomData.requiresIContext = true;
	oAnnotationHelper.formatWithExpandSimplePath.requiresIContext = true;
	oAnnotationHelper.formatSmartField.requiresIContext = true;
	oAnnotationHelper.getIconSemanticColor.requiresIContext = true;
	oAnnotationHelper.getValueListReadOnly.requiresIContext = true;
	oAnnotationHelper.getImportanceForTableColumnsWithSemanticKeyTitleAndDescription.requiresIContext = true;
	oAnnotationHelper.getDefaultWidthForTableColumn.requiresIContext = true;
	oAnnotationHelper.getPropertyNameForText.requiresIContext = true;
	oAnnotationHelper.getColumnWidthForConnectedFields.requiresIContext = true;
	oAnnotationHelper.getFormattedAddress.requiresIContext = true;
	oAnnotationHelper.createP13NFileUploader.requiresIContext = true;
	oAnnotationHelper.buildSmartTableCustomizeConfig.requiresIContext = true;
	
	return oAnnotationHelper;
}, /* bExport= */ true);
