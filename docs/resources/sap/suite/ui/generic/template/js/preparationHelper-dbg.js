sap.ui.define([
	"sap/base/util/deepExtend",	
	"sap/suite/ui/generic/template/genericUtilities/FeError",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/js/StableIdHelper"
], function(deepExtend, FeError, FeLogger, StableIdHelper) {
	"use strict";
	var	sClassName = "js.preparationHelper";
	var oLogger = new FeLogger(sClassName).getLogger();

	function getNormalizedTableSettings(oMetaModel, oOriginalSettings, Device, sEntitySet, oExtensionActions, aLineItem, fnGetSearchFieldId){
		var oSettings = deepExtend({}, oOriginalSettings);
		// 1. map boolean settings gridTable and treeTable to tableType
		oSettings.tableType = oSettings.tableType || (oSettings.gridTable ? "GridTable" : undefined);
		oSettings.tableType = oSettings.tableType || (oSettings.treeTable ? "TreeTable" : undefined);

		// 2. map flat settings to structured ones
		oSettings.tableSettings = oSettings.tableSettings || {};
		oSettings.tableSettings.type = oSettings.tableSettings.type || oSettings.tableType;
		oSettings.tableSettings.multiSelect = (oSettings.tableSettings.multiSelect === undefined ? oSettings.multiSelect : oSettings.tableSettings.multiSelect);

		// 3. set defaults, as suggested in Component.js
		oSettings.tableSettings.inlineDelete = !!oSettings.tableSettings.inlineDelete;
		oSettings.tableSettings.multiSelect = !!oSettings.tableSettings.multiSelect;
		oSettings.tableSettings.selectionLimit = oSettings.tableSettings.selectionLimit || 200;

		var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
		var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);

		// 4. determine type
		if (oSettings.tableSettings.type !== "StandardList" && oSettings.tableSettings.type !== "ObjectList") {
			if (Device.system.phone) {
				oSettings.tableSettings.type = "ResponsiveTable";
			} else if (sEntitySet){
				oSettings.tableSettings.type = oSettings.tableSettings.type || (oEntityType["sap:semantics"] === "aggregate" ? "AnalyticalTable" : "ResponsiveTable");
				if (oSettings.tableSettings.type === "AnalyticalTable" && !(oEntityType["sap:semantics"] === "aggregate")){
					oSettings.tableSettings.type = "GridTable";
				}
			}
		}

		// 6. Set Search Configuration
		if (fnGetSearchFieldId) {
			var oSearchRestrictions = oEntitySet["Org.OData.Capabilities.V1.SearchRestrictions"];
			if (!oSearchRestrictions || !oSearchRestrictions.Searchable || oSearchRestrictions.Searchable.Bool !== "false") {
				var sId = fnGetSearchFieldId();
				oSettings.tableSettings.searchSettings = {};
				oSettings.tableSettings.searchSettings.enabled = true;
				oSettings.tableSettings.searchSettings.id = sId;
			}
		}

		if (oEntityType["com.sap.vocabularies.UI.v1.HeaderInfo"]) {
			oSettings.tableSettings.headerInfo = oEntityType["com.sap.vocabularies.UI.v1.HeaderInfo"];
		}

		// check for invalid combinations
		if (oSettings.tableSettings.multiSelect && oSettings.tableSettings.inlineDelete) {
			throw new FeError(sClassName, "Both inlineDelete and multiSelect options for table are not possible");
		}

		if (oSettings.tableSettings.type !== "ResponsiveTable" && oSettings.tableSettings.inlineDelete) {
			throw new FeError(sClassName, "InlineDelete property is not supported for " + oSettings.tableSettings.type + " type table");
		}


		if (oSettings.tableSettings.inlineDelete){
			oSettings.tableSettings.mode = "Delete";
			oSettings.tableSettings.onlyForDelete = true;
		} else {
			// check whether there is a button (Besides the Delete button) which requires Selection possibility. Start with the annotated actions.
			// Note: DataFieldForAction requires a selection possibility even if it is not bound, since selected rows would still be passed to the function import.
			// Note: For DataFieldForIntentBasedNavigation we currently do not support the case that RequiresContext is determined by Path
			var bHasButtonWhichRequiresSelection = Array.isArray(aLineItem) && aLineItem.some(function(oRecord) { // first condition is needed to be robust against incorrect annotations which provide LineItem not as an array
	
				return !(oRecord.Inline && oRecord.Inline.Bool) && // exclude actions that do not belong to the toolbar
						(oRecord.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" // exclude DatafieldForAction
						|| (oRecord.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && oRecord.RequiresContext && oRecord.RequiresContext.Bool === "true"));
			});
			// If no annotated action proves that there is a button which requires selection check the extension buttons
			if (!bHasButtonWhichRequiresSelection){
				for (var sAction in oExtensionActions){
					if (oExtensionActions[sAction].requiresSelection !== false){
						bHasButtonWhichRequiresSelection = true;
						break;
					}
				}
			}			
			if (!bHasButtonWhichRequiresSelection && oEntitySet["Org.OData.Capabilities.V1.DeleteRestrictions"] && oEntitySet["Org.OData.Capabilities.V1.DeleteRestrictions"].Deletable && oEntitySet["Org.OData.Capabilities.V1.DeleteRestrictions"].Deletable.Bool === "false"){
				oSettings.tableSettings.mode = "None";
				oSettings.tableSettings.onlyForDelete = false;
			} else {
				if (oSettings.tableSettings.type === "ResponsiveTable"){
					oSettings.tableSettings.mode = (oSettings.tableSettings.multiSelect ? "MultiSelect" : "SingleSelectLeft");
				} else {
					oSettings.tableSettings.mode = (oSettings.tableSettings.multiSelect ? "MultiToggle" : "Single");
				}
				// check whether there is a button (Besides the Delete button) which requires Selection. Start with the annotated actions
				oSettings.tableSettings.onlyForDelete = !bHasButtonWhichRequiresSelection;
			}
		}

		// 5. remove deprecated settings (to avoid new code to rely on them)
		delete oSettings.gridTable;
		delete oSettings.treeTable;
		delete oSettings.tableType;
		delete oSettings.multiSelect;
		return oSettings.tableSettings;
	}

	function getAnnotation(oMetaModel, sEntityType, sAnnotation, sQualifier){
		var aParts = [sAnnotation];
		if (sQualifier) {
			aParts.push(sQualifier);
		}
		var sFullAnnotation = aParts.join("#");
		return oMetaModel.getODataEntityType(sEntityType)[sFullAnnotation];
	}

	function getLineItemFromVariant(oMetaModel, sEntityType, sQualifier){
		function getObject(sPath){
			if (sPath[0] !== "/"){
				// relative path - add path of annotation target, i.e. EntityType
				sPath = oMetaModel.getODataEntityType(sEntityType, true) + "/" + sPath;
			}
			// assumption: absolute paths in annotations are equal to corresponding paths in metaModel
			// any "@" are removed in the metaModel
			return oMetaModel.getObject(sPath.replace(/@/g, ""));
		}

		function getPresentationVariant(oSelectionPresentationVariant){
			// PresentationVariant must be defined (according to vocabulary) either via "Path" or inline (i.e. Path is not defined).
			// For compatibilty, just ignore if not provided (leading to fallback to use LineItem without qualifier)
			return oSelectionPresentationVariant.PresentationVariant && oSelectionPresentationVariant.PresentationVariant.Path ? getObject(oSelectionPresentationVariant.PresentationVariant.Path) : oSelectionPresentationVariant.PresentationVariant;
		}

		function getLineItem(oPresentationVariant){
			// Visualizations must be defined (according to vocabulary)
			// however, this is not given at least in all demokit apps (presenetationVariant consisting only of sortOrder)
			var oVisualization = oPresentationVariant.Visualizations && oPresentationVariant.Visualizations.find(function(oVisualization){
				return oVisualization.AnnotationPath.includes("com.sap.vocabularies.UI.v1.LineItem");
			});
			return oVisualization && getObject(oVisualization.AnnotationPath);
		}

		// Qualifier could be for a SelectionPresentationVariant or for a PresentationVariant. SelectionPresentationVariant has precendence
		// check for SelectionPresentationVariant with given qualifier
		var oSelectionPresentationVariant = getAnnotation(oMetaModel, sEntityType,  "com.sap.vocabularies.UI.v1.SelectionPresentationVariant", sQualifier);

		// if found, use PresentationVariant given by that SelectionPresentationVariant, otherwise check for PresentationVariant with given qualifier
		var oPresentationVariant = oSelectionPresentationVariant ? getPresentationVariant(oSelectionPresentationVariant) : getAnnotation(oMetaModel, sEntityType, "com.sap.vocabularies.UI.v1.PresentationVariant", sQualifier);

		// if found, use Lineitem given by that PresentationVariant, otherwise use default LineItem (without qualifier - sQualifier is not interpreted as being the qualifier for the LineItem itself!)

		// according to vocabulary, "A reference to `UI.Lineitem` should always be part of the collection"
		// however this is not given for existing applications - in that case fall back to default LineItem as if no PresentationVariant was given
		return oPresentationVariant && getLineItem(oPresentationVariant) || getAnnotation(oMetaModel, sEntityType, "com.sap.vocabularies.UI.v1.LineItem");
	}
	/*
	This method resolves the quickview Target Entity information. This methods resolves all the properties which have semanticObject annotation in a entity and also 
	stores in a private variable. This ensures the complex and costly logic is executed only once.
	* @param {object} {oModel} Model Object
	* @param {object} {oEntitySet} EntitySet object
	* @return {object} 
	* Sample Output: {
	*	mTargetEntityInformationPerProperty: {
	*		Currency: {
	*			entityType: "STTA_PROD_MAN.I_CurrencyType"
	*			navName: "to_Currency"
	*		},
	*		ProductId: {
	*			entityType: "STTA_PROD_MAN.I_CurrencyType"
	*			navName: "to_Currency"
	*		}
	*	},
	*	sForceLinkRendering: '{"Currency":"true", "ProductId":"true"}'
	* }
	*/
	function getTargetEntityForQuickView(oModel, oEntitySet) {
		var oTargetEntitityInfo = {
			mTargetEntities: {},
			mProperty: {}
		};
		function formatTargetEntity() {
			return {
				mTargetEntities: oTargetEntitityInfo.mTargetEntities,
				sForceLinkRendering: JSON.stringify(oTargetEntitityInfo.mProperty) 
			};
		}
		
		var oEntityType = oModel.getODataEntityType(oEntitySet.entityType);
		var aPropertyListWithSemanticObject = []; //Array to hold all properties with SemanticObject annotation
		var oPropertyListWithSemanticObject = {}; //Object to hold targetEntity information
		
		if (!oEntityType || !oEntityType.navigationProperty) {
			return formatTargetEntity();
		}

		// Step 1: Check if property has a semantic object annotated. If not, then link cannot be force - rendered
		var aProperties = oEntityType.property || [];
		aProperties.forEach(function(oProperty) {
			if (oProperty["com.sap.vocabularies.Common.v1.SemanticObject"]) {
				aPropertyListWithSemanticObject.push(oProperty.name);
				oPropertyListWithSemanticObject[oProperty.name] = {
					name: oProperty.name,
					targetEntitiesWithSemanticObject: [],
					targetEntitiesWithDependent: []
				};
			}
		});

		if (aPropertyListWithSemanticObject.length == 0) {
			return formatTargetEntity();
		}

		// step 2: Loop through navigationProperty and create a map of property and target annotation
		var fnFindSchema = function(sNamespace, oSchema) {return oSchema.namespace === sNamespace;};
		var fnFindAssociation = function(sName, oAssociation) {return oAssociation.name === sName;};
		oEntityType.navigationProperty.forEach(function(oNavProp) {
			//We are unsure whether this is really needed. We will revisit this condition for SiblingEntity
			if (oNavProp.name === "SiblingEntity"){
				return;
			}

			var sQualifiedName = oNavProp.relationship;
			var iSeparatorPos = sQualifiedName.lastIndexOf(".");
			var sNamespace = sQualifiedName.slice(0, iSeparatorPos);
			var sName = sQualifiedName.slice(iSeparatorPos + 1);
			var oSchema = oModel.getObject("/dataServices/schema").find(fnFindSchema.bind(null, sNamespace));
			var oAssociation = oSchema.association.find(fnFindAssociation.bind(null, sName));

			var oReferentialConstraint = oAssociation && oAssociation.referentialConstraint;
			if (oReferentialConstraint && oReferentialConstraint.dependent && oReferentialConstraint.dependent.propertyRef) {
				var oAssociationEnd = oModel.getODataAssociationEnd(oEntityType, oNavProp.name); 
				var oTargetEntityType = oModel.getODataEntityType(oAssociationEnd.type);
				//null check added to support Reducing EntitySet
				if (oTargetEntityType && oTargetEntityType["com.sap.vocabularies.UI.v1.QuickViewFacets"]) {
					for (var index in oReferentialConstraint.dependent.propertyRef) {
						var oProperty = oReferentialConstraint.dependent.propertyRef[index];
						//Ignore dependent properties not configured as SemanticObject in source entity
						if (oPropertyListWithSemanticObject.hasOwnProperty(oProperty.name)) {
							//Give higher preference where property is a single dependent
							if (oReferentialConstraint.dependent.propertyRef.length == 1) {
								oPropertyListWithSemanticObject[oProperty.name].targetEntitiesWithDependent.unshift({entityType: oTargetEntityType.namespace + "." + oTargetEntityType.name, navName: oNavProp.name});
							} else {
								oPropertyListWithSemanticObject[oProperty.name].targetEntitiesWithDependent.push({entityType: oTargetEntityType.namespace + "." + oTargetEntityType.name, navName: oNavProp.name});
							}
						}
					}
				}
			}
		});

			

		// step 3: Loop through the entity container to find the targetEntity
		var oEntityContainer = oModel.getODataEntityContainer();
		oEntityContainer.entitySet.forEach(function(oEntitySet) {
			// Skip the source entitySet
			if (oEntityType.name !== oEntitySet.entityType) {
				var oTargetEntityType = oModel.getODataEntityType(oEntitySet.entityType);
				if (oTargetEntityType["com.sap.vocabularies.UI.v1.QuickViewFacets"]) {
					var aTargetProperties = oTargetEntityType.property || [];
					//Loop through the target properties
					for (var j = 0; j < aTargetProperties.length; j++) {
						//if propety has a semantic object annotation
						if (aTargetProperties[j]["com.sap.vocabularies.Common.v1.SemanticObject"]) {
							for (var k = 0; k < aPropertyListWithSemanticObject.length; k++) {
								//If there is a match in both source and target entity, store the entity
								if (aTargetProperties[j].name == aPropertyListWithSemanticObject[k]) {
									oPropertyListWithSemanticObject[aPropertyListWithSemanticObject[k]].targetEntitiesWithSemanticObject.push({entityType: oTargetEntityType.namespace + '.' + oTargetEntityType.name});
									break;
								}
							}
						}
					}
				}
			}
		});

		// step 4: Resolve the Target Quick View entity

		//Function to Resolve Target Entity with compatibility logic - pick the first property match in dependent propertyref of association's referential constraint
		function getTargetEntityFromDependent(sProperty) {
			return oPropertyListWithSemanticObject[sProperty].targetEntitiesWithDependent[0];
		}
		aPropertyListWithSemanticObject.forEach(function(sProperty) {
			var oTargetEntity;
			
			//Logic if property is listed in Target Quick View entity(es). This is potentially wrong configuration but needs to be allowed for compatibility reasons.
			if (oPropertyListWithSemanticObject[sProperty].targetEntitiesWithSemanticObject.length > 0) {
				if (oPropertyListWithSemanticObject[sProperty].targetEntitiesWithSemanticObject.length > 1) {
					oLogger.warning("Quick View property " + sProperty + "found in multiple Target Entities.");
				}
				//check for each entity where property is listed
				for (var i = 0; i < oPropertyListWithSemanticObject[sProperty].targetEntitiesWithSemanticObject.length; i++) {
					//Loop and break if dependent matches to the target entity
					for (var j = 0; j < oPropertyListWithSemanticObject[sProperty].targetEntitiesWithDependent.length; j++) {
						if (oPropertyListWithSemanticObject[sProperty].targetEntitiesWithSemanticObject[i].entityType == 
							oPropertyListWithSemanticObject[sProperty].targetEntitiesWithDependent[j].entityType) {
								//If there is a match, select the target
								oTargetEntity = oPropertyListWithSemanticObject[sProperty].targetEntitiesWithDependent[j];
								break;
							}
					}
					if (oTargetEntity) {
						break;
					}
				}
				if (!oTargetEntity) {
					oTargetEntity = getTargetEntityFromDependent(sProperty);
				}
			} else {
				oTargetEntity = getTargetEntityFromDependent(sProperty);
			}
			if (oTargetEntity) {
				oTargetEntitityInfo.mTargetEntities[sProperty] = oTargetEntity;
				oTargetEntitityInfo.mProperty[sProperty] = true;
			}
		});
		// step 5: Save and retrurn
		return formatTargetEntity();
	}


	return {
		getNormalizedTableSettings: getNormalizedTableSettings,
		getAnnotation: getAnnotation,
		getLineItemFromVariant: getLineItemFromVariant,
		getTargetEntityForQuickView: getTargetEntityForQuickView
	};
});
