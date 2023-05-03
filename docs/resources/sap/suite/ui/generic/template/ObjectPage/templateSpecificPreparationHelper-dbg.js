sap.ui.define([
	"sap/base/util/extend",
	"sap/base/util/deepExtend",
	"sap/ui/model/odata/AnnotationHelper",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/js/staticChecksHelper",
	"sap/suite/ui/generic/template/js/preparationHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/js/AnnotationHelper",
	"sap/suite/ui/generic/template/ObjectPage/annotationHelpers/AnnotationHelperActionButtons",
	"sap/suite/ui/generic/template/genericUtilities/FeError",
	"sap/base/util/isEmptyObject",
	"sap/suite/ui/generic/template/ObjectPage/annotationHelpers/AnnotationHelperSideContent"
], function (extend, deepExtend, AHModel, StableIdHelper, staticChecksHelper, preparationHelper, FeLogger, AnnotationHelper, AHActionButtons, FeError, isEmptyObject, AHSideContent) {
	"use strict";
	var oLogger = new FeLogger("ObjectPage.templateSpecificPreparationHelper").getLogger();
	var	sClassName = "ObjectPage.templateSpecificPreparationHelper";

	/* This method returns an object with the following properties:
	 * 	sections: See method fnGetSections for description
	 * 	...: todo 
	*/
	function fnGetTemplateSpecificParameters(oComponentUtils, oMetaModel, oOriginalSettings, oDevice, sLeadingEntitySet, oInternalManifest) {
		
		function fnGetAnnotationWithDefaults(sAnnotationName, oAnnotation) {
			// Provide optional properties of annotation with defaults according to vocabulary
			// should best be done in metaModel itself
			// if they don't agree:
			// - move at least to a central place in our library (-> preparationHelper? MetaDataAnalyzer?)
			// - don't change original data in metaModel, but create a copy
			var oResult = extend({}, oAnnotation);
			switch (sAnnotationName) {
			case "com.sap.vocabularies.UI.v1.ReferenceFacet":
				if (!oResult["com.sap.vocabularies.UI.v1.PartOfPreview"] || oResult["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool !== "false") {
					oResult["com.sap.vocabularies.UI.v1.PartOfPreview"] = {
							Bool: "true"
					};
				}
				break;
			default:
				break;
			}
			return oResult;
		}
	
		function fnGetTargetAnnotation(oReferenceFacetContext) {
			if (!oReferenceFacetContext.getObject().Target) {
				// clarify how to deal with reference facet without target
				return undefined;
			}
			var sMetaModelPath = AHModel.resolvePath(oMetaModel.getContext(oReferenceFacetContext.sPath + "/Target"));
			return sMetaModelPath && oMetaModel.getContext(sMetaModelPath).getObject();
		}
	
		function fnEnsureSectionAsSubsection(oSection){
			// ensures, that the Section has a SubSection pointing to the same annotation and with the same data, except:
			// - the subSection should not contain subSections again
			// - the subSection should contain an (empty) array of blocks (that the section does not contain)
			// This is needed for:
			// - referenceFacet on 2nd level (subSection should be created refering to the collectionFacet on top level)
			// - empty collectionFacet on top level, that should be replaced with ReplaceFacet extension (although this is rather
			//   replacing the whole section, we expect the extension not to contain a subSection, but we create the subSection)
	
			oSection.subSections = oSection.subSections || [];
			// if subSection already exists, do nothing
			if (oSection.subSections.find(function(oSubSection){
				return oSection.additionalData.facetId === oSubSection.additionalData.facetId;
			})) {
				return;
			}
	
			var oSubSection = extend({}, oSection);
			delete oSubSection.subSections;
			oSubSection.blocks = [];
			oSection.subSections.push(oSubSection);
		}
	
		var iMissingIdCounter = 0;
		function fnGetSectionsFromAnnotations(sPath, bHeaderFacet, iLevel, oParentFacet) {
			// Analysis of facets. Needs to be tolerant, as sometimes facets are defined in a way that seems to be meaningless,
			// (sometimes used just to be able to replace them in an extension, not clear, whether this is the only reason)
			// known case:
			// collection facet without any facets
			// reference facet without a target (but with an ID)
			// reference facet with a target pointing to an arbitrary string (without special characters, not pointing to sth. within the service)
			// reference facet with a target pointing to a not existing navigation property
			var aResult = [];
			var aLevelNames = ["sections", "subSections", "blocks"];
			iLevel = iLevel || 0;
			var aFacets = oMetaModel.getObject(sPath);
			if (!Array.isArray(aFacets)) {
				// in case of empty collection facet, metaModel returns {} (instead of [] as would be expected)
				// for anything else, meaning would currently not be clear
				return [];
			}
			aFacets.forEach(function (oFacet, i) {
				var oFacetCurrentLevel = {
						additionalData: {
							facetId: StableIdHelper.getStableId({
								type: "ObjectPage",
								subType: "Facet",
								sRecordType: oFacet.RecordType,
								bIsHeaderFacet: bHeaderFacet,
								sAnnotationPath: oFacet.Target && oFacet.Target.AnnotationPath,
								sAnnotationId: oFacet.ID && oFacet.ID.String
							})
						},
						// not to be returned outside this class
						temporaryData: {},
						annotations: {
							Facet: {
								annotation: deepExtend({}, oFacet)
							}
						},
						metaModelPath: sPath + "/" + i
				};
	
				// as intermediate step provide id also as an object with property id to simplify switching from generating facetId during templating
				oFacetCurrentLevel.facetIdAsObject = {
						id: oFacetCurrentLevel.additionalData.facetId 
				};
	
				// Note: fallbackIdByEnumerationForRuntime is not guaranteed to be stable, even from one session to the other, so don't use it in the view (as in
				// view cache it would be kept, but in next session, a different one could be created). In fact, as this class is static, the missingIdCounter is shared
				// between OPs, so depending on the order OP instances are loaded, the ids are different.
				// If it becomes necessary to store an id in the view (e.g. in custom data) - i.e. have an id being stable from one session to the other, though still not over
				// releases, this needs to be changed (either be using separate counters per OP instance, or maybe a completely different approach, e.g. stringifying the corresponding
				// subObject in metaModel). This might make sense to be able to create all infoObjects upfront, or to get rid of infoobjects completely.
				oFacetCurrentLevel.fallbackIdByEnumerationForRuntime = oFacetCurrentLevel.additionalData.facetId || "missingStableId#" + iMissingIdCounter++;
	
				if (oFacet.RecordType === "com.sap.vocabularies.UI.v1.CollectionFacet") {
					var aNextLevel = fnGetSectionsFromAnnotations(sPath + "/" + i + "/Facets", bHeaderFacet, iLevel + 1, oFacetCurrentLevel);
					// in case of empty collectionFacet at top level, create also subSection to be used for ReplaceFacet extension
					if (iLevel === 0 && !oFacetCurrentLevel.subSections && aNextLevel.length === 0) {
						fnEnsureSectionAsSubsection(oFacetCurrentLevel);
					} else {
						var sNextLevel = aLevelNames[iLevel + 1] || "unsupportedNestingLevel";
						oFacetCurrentLevel[sNextLevel] = oFacetCurrentLevel[sNextLevel] || [];
						oFacetCurrentLevel[sNextLevel] = oFacetCurrentLevel[sNextLevel].concat(aNextLevel);
					}
				} else if (oFacet.RecordType === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
					// Id that would would be generated if no id is provided in annotations: Since in the past for some cases sections could be identified in manifest by this id
					// even if a real id was provided in annotation, we need to know this id to be able to merge also manifest settings provided there.
					// This kind of id is only defined for reference facets (and calculated by using the annotation path of the target annotation)
					oFacetCurrentLevel.fallbackIdByAnnotationPathForManifest = StableIdHelper.getStableId({
						type: "ObjectPage",
						subType: "Facet",
						sRecordType: oFacet.RecordType,
						bIsHeaderFacet: bHeaderFacet,
						sAnnotationPath: oFacet.Target && oFacet.Target.AnnotationPath
					});
	
					oFacetCurrentLevel.annotations.Facet.annotation = fnGetAnnotationWithDefaults("com.sap.vocabularies.UI.v1.ReferenceFacet", oFacet);
					// oBlock describes what is actually build out of the reference facet (except the section/subsection structure). Naming comes from ObjectPageSubSections default aggregation
					// - think of whether this is the best naming here
					var oBlock = extend({}, oFacetCurrentLevel);
	
					// Todo: targetAnnotation is not really needed here (when jsut analyzing sections structure), but only later, when normalizing specific properties. Thus, it should be moved there.
					// Currently, we keep it here, as we use fnNormalizeSections on all levels (-> should be split, targetAnnotation only needed on block level)
					oBlock.targetAnnotation = fnGetTargetAnnotation(oMetaModel.getContext(sPath + "/" + i));
					// if facet annotation is inconsistent, targetAnnotation would be undefined. Keep it here anyway, as extension might refer to it
	
					var oSubSection;
	
					switch (iLevel) {
					case 0:
						// ignore reference facet with wrong target on first level (compatibility)
						// don't ignore facet without any target - can be used for replaceFacet extension (if it has an ID) and was not ignored in past
						if (oFacet.Target && !oFacet.Target.AnnotationPath){
							return;
						}
						// if reference facet is defined directly, it's used to create Section, SubSection and Block
						oSubSection = extend({}, oFacetCurrentLevel);
						oSubSection.blocks = [oBlock];
						oFacetCurrentLevel.subSections = [oSubSection];
						break;
					case 1:
						// in case of collection facet on top containing reference facet, create only one subsection also using collectionFacet id, and push reference facets down as blocks
						// be aware: top level collection facet could contain both, reference facets and collection facets
						fnEnsureSectionAsSubsection(oParentFacet);
						oSubSection = oParentFacet.subSections.find(function(oSubSection){
							return oSubSection.additionalData.facetId === oParentFacet.additionalData.facetId;
						});
						oSubSection.blocks.push(oBlock);
						return;
					case 2:
						oFacetCurrentLevel.targetAnnotation = oBlock.targetAnnotation;
						// only in a 3 level hierarchy, even before 1.84 it was possible to get separated sibling SmartForms (depending on sibling reference Facets)
						oParentFacet.temporaryData.potentiallySeparateForms = true;
						break;
					default:
						oLogger.warning("UnSupported Nesting of Collectionfacets");
					break;
					}
				} else {
					oLogger.warning("UnSupported Facet annotation record type: " + oFacet.RecordType);
					// to ignore wrong facet record types, just don't add them to sections
					return;
				}
				aResult.push(oFacetCurrentLevel);
			});
			return aResult;
		}
	
		var mTargetEntities = {};
		function fnSetTargetEntity(oEntitySet, oSettings) {
			//Process only if not already processed
			if (!mTargetEntities[oEntitySet.entityType]) {
				mTargetEntities[oEntitySet.entityType] = preparationHelper.getTargetEntityForQuickView(oMetaModel, oEntitySet); 
			}
		}

		fnSetTargetEntity(oMetaModel.getODataEntitySet(sLeadingEntitySet));

		/**
		 * Returns the persistencyKeyState for a smart control (table/chart) which represents the action which should be taken WRT its persistencyKey property. From
		 * UI5 v1.109, variant management is enabled (by default) and thus, to avoid the issue of having multiple duplicate implicit variants created by SVM (named as 
		 * Personalization), persistencyKey has to be changed in certian scenarios.
		 * 		New: New persistencyKey required.
		 * 		Retain: No change required i.e., it will continue to be the id of the smarttable.
		 * 		Remove: Remove the persistencyKey i.e., set an empty string.
		 */
		function fnGetPersistencyKeyState(oSmartControlSettings) {
			switch (oSmartControlSettings && oSmartControlSettings.variantManagement) {
				case undefined:
					return "New";
				case true:
					return "Retain";
				case false:
					return "Remove";
				default:
					break;
			}
		}

		function fnGetNormalizedTableSettings(oSettings) {
			function fnGetTableLevelStandardActions() {
				/*  Collection of standard actions available on OP at table level. Maps the logical action name to an object containing the relevant properties i.e.
						action => action name corresponding to the standard action
						callbackName => standard button's press event handler used in the command execution
						text => button's text
						id => button's ID
						press => triggers the action defined in the command execution
						enabled => button's enablement
						isStandardAction =>	represents whether the action is a standard action or overridden by the custom action

					If a custom action is defined with a valid 'logicalAction', then there could be two cases:

					Case 1: Custom action has an ID
						In this case, the corresponding standard button does not get created and instead an extension button 
						gets created, which takes over some standard functionality, especially the keyboard shortcut and the following properties:
							enabled, text, importance, callbackName (if not defined in the manifest)

					Case 2: Custom action does not have an ID
						Here, the corresponding standard button gets created and takes over everything defined explicitly in the manifest. 
						
					In both the cases, isStandardAction is set to false. 
					TODO: isStandardAction is only used to set different types of CustomData and OverflowToolbarLayoutData in the respective fragments.
						However, additional CustomData should not harm, and regarding OverflowToolbarLayoutData, importance should always be the default
						(if not defined otherwise) and so, it should be removed and the places where these CustomData are being consumed should be refactored (if required). */
				var sDeleteId = StableIdHelper.getStableId({ type: 'ObjectPageAction', subType: 'Delete', sFacet: oSettings.additionalData.facetId });
				return {
					Create: {
						id: StableIdHelper.getStableId({ type: 'ObjectPageAction', subType: 'Create', sFacet: oSettings.additionalData.facetId }),
						text: "{i18n>CREATE_OBJECT}",
						press: "cmd:TableEntryAdd",
						action: "TableEntryAdd",
						callbackName: "._templateEventHandlers.addEntry('" + oSettings.additionalData.facetId + "')",
						isStandardAction: true,
						enabled: true
					},
					Delete: {
						id: sDeleteId,
						text: "{i18n>DELETE}",
						press: "cmd:TableEntryDelete",
						ariaHasPopup: sap.ui.core.aria.HasPopup.Dialog,
						action: "TableEntryDelete",
						callbackName: "._templateEventHandlers.deleteEntries('" + oSettings.additionalData.facetId + "')",
						isStandardAction: true,
						enabled: "{_templPriv>/generic/controlProperties/" + sDeleteId + "/enabled" + "}"
					}
				};
			}
			
			// for ObjectPage, unfortunately an additional settings allTableMultiSelect had been introduced, that just has the same meaning as setting
			// multiSelect on component level, but needs to be supported for compatibility
			oSettings.multiSelect = oSettings.multiSelect || oSettings.allTableMultiSelect;
	
			// tolerance if reference facet points to a not existent navigation property: assume no navigation, i.e. use entiyset of page
			var sTargetMetaModelPath = AHModel.gotoEntitySet(oMetaModel.getContext(oSettings.metaModelPath + "/Target"));
			var sEntitySet = sTargetMetaModelPath && oMetaModel.getObject(sTargetMetaModelPath).name || sLeadingEntitySet;
	
			var oExtensions = oComponentUtils.getControllerExtensions();
			// todo: check, whether fallbackIdByAnnotationPathForManifest could also be used for oExtensions.Sections
			var oExtensionActions = oExtensions && oExtensions.Sections && oExtensions.Sections[oSettings.additionalData.facetId] && oExtensions.Sections[oSettings.additionalData.facetId].Actions;
			var fnGetSearchFieldId = function() {
				return oSettings.additionalData.facetId + "::Table::Toolbar::SearchField";
			};
			
			var oResult = preparationHelper.getNormalizedTableSettings(oMetaModel, oSettings, oDevice, sEntitySet, oExtensionActions, oSettings.targetAnnotation, fnGetSearchFieldId);
			// By default, variant management is enabled but corresponding manifest settings (if defined) would also be respected
			oResult.variantManagement = !(oSettings.tableSettings && oSettings.tableSettings.variantManagement) || oSettings.tableSettings.variantManagement;
			//default value of selectAll is different for OP from LR/ALP hence it is not calculated in preparationHelper but separately in respective components.
			oResult.selectAll = oSettings.tableSettings && oSettings.tableSettings.selectAll === false ? false : true;
			// if selection is only needed for delete (button in toolbar), it should be only set when deletion is actually possible
			// in draft, deletion is possible only in edit case, in non-draft, only in display case
			if (oResult.onlyForDelete) {
				oResult.mode = oComponentUtils.isDraftEnabled() ? "{= ${ui>/editable} ? '" + oResult.mode + "' : 'None'}"
						: "{= ${ui>/editable} ? 'None' : '" + oResult.mode + "'}";
			}
			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			if (oResult && oResult.createWithParameterDialog && oResult.createWithParameterDialog.fields) {
				staticChecksHelper.checkErrorforCreateWithDialog(oMetaModel.getODataEntityType(oEntitySet.entityType), oResult);
				oResult.createWithParameterDialog.id = StableIdHelper.getStableId({ type: 'ObjectPageAction', subType: 'CreateWithDialog', sFacet: oSettings.additionalData.facetId });
			}
	
			// set quickview Target Entity
			fnSetTargetEntity(oEntitySet);

			var bToolbarButtonVisible = fnGetTableToolbarButtonVisibility(oSettings, oEntitySet, oResult.type);
			var sPathforInsertRestriction = fnGetInsertRestrictionForPasteButton(oEntitySet);
			/* Workaround fix for non draft apps with no section settings defined in the manifest. In UI5v1.93, the export to excel button is displayed by default because of a code gap in
			   FE which later got fixed with a change related to paste button in UI5v1.96 wherein the export button is not diplayed by default. This looks like a regression issue to customers
			   for which we have provided this temporary solution which shall get removed soon. */
			oResult.bExportToExcel = !oComponentUtils.isDraftEnabled() && !oSettings.sections ? true : bToolbarButtonVisible;
			if (sPathforInsertRestriction) {
				oResult.vShowPasteButton = bToolbarButtonVisible ? "{= ${ui>/editable} && ${" + sPathforInsertRestriction + "}}" : false;
			} else {
				oResult.vShowPasteButton = bToolbarButtonVisible ? "{ui>/editable}" : false;
			}

			oResult.commandExecution = fnGetTableLevelStandardActions();
			oResult.persistencyKeyState = fnGetPersistencyKeyState(oSettings.tableSettings);

			return oResult;
		}
		
		function fnGetInsertRestrictionForPasteButton(oEntitySet) {
			var oLeadingEntitySet = oMetaModel.getODataEntitySet(sLeadingEntitySet);
			var oInsertableAnnotation, oSectionInsertRestriction;
			var oRestrictionSetViaNavRestrictions = AnnotationHelper.handleNavigationRestrictions(oMetaModel, oLeadingEntitySet, oEntitySet, 'Insertable');
			if (oRestrictionSetViaNavRestrictions) {
				oInsertableAnnotation = oRestrictionSetViaNavRestrictions['Insertable'];
			} else {
				oSectionInsertRestriction = oEntitySet['Org.OData.Capabilities.V1.InsertRestrictions'];
				oInsertableAnnotation = oSectionInsertRestriction && oSectionInsertRestriction['Insertable'];
			}
			if (oInsertableAnnotation && oInsertableAnnotation.Path) {
				return oInsertableAnnotation.Path;
			}
			return false;
		}
		// used in the process of determining the visibility of export to excel and paste button depending on certain restrictions/conditions.
		function fnGetTableToolbarButtonVisibility(oSettings, oEntitySet, sTableType) {
			if (!oComponentUtils.isDraftEnabled() || ["inline", "creationRows"].indexOf(oSettings.createMode) === -1) {
				return false;
			}
	
			var oInsertableAnnotation, sEntityType, oSectionInsertRestriction;
			var sSemantics = oMetaModel.getODataEntityType(oEntitySet.entityType) && oMetaModel.getODataEntityType(oEntitySet.entityType)["sap:semantics"];
			// if tabletype is treetable or analyticaltable return false
			if (sTableType === 'TreeTable' || (sTableType === 'AnalyticalTable' && sSemantics === "aggregate")) {
				return false;
			}
			// Check for insertRestrictions
			var oLeadingEntitySet = oMetaModel.getODataEntitySet(sLeadingEntitySet);
			// Restrictions coming from the NavigationRestrictions of the Root Entity take the priority
			var oRestrictionSetViaNavRestrictions = AnnotationHelper.handleNavigationRestrictions(oMetaModel, oLeadingEntitySet, oEntitySet, 'Insertable');
			if (oRestrictionSetViaNavRestrictions) {
				oInsertableAnnotation = oRestrictionSetViaNavRestrictions['Insertable'];
				sEntityType = oLeadingEntitySet.entityType;
			} else {
				oSectionInsertRestriction = oEntitySet['Org.OData.Capabilities.V1.InsertRestrictions'];
				oInsertableAnnotation = oSectionInsertRestriction && oSectionInsertRestriction['Insertable'];
				sEntityType = oEntitySet.entityType;
			}
			if (!oInsertableAnnotation) {
				return true;
			}
	
			// bValidAnnotation is true, if annotion has either Bool or Path property(path must resolve to boolean). bValidAnnotation is false if both Bool & Path exists or both does not exists or Path doesn't resolve to boolean.
			var bValidAnnotation = oInsertableAnnotation.Bool ? !oInsertableAnnotation.Path : !!(oInsertableAnnotation.Path && AnnotationHelper._isPropertyPathBoolean(oMetaModel, sEntityType, oInsertableAnnotation.Path));
			
			// if invalid annotation log error in the console
			if (!bValidAnnotation) {
				oLogger.error("Service Broken: Restrictions annotations for entity type " + oEntitySet.entityType + " for section Insertable are invalid.");
			}
	
			if (oInsertableAnnotation.Bool === "false") {
				return false;
			}
			return bValidAnnotation;
		}
	
		function fnGetNormalizedChartSettings(oSettings) {
			return {
				// By default, variant management is enabled but corresponding manifest settings (if defined) would also be respected
				variantManagement: !(oSettings.chartSettings && oSettings.chartSettings.variantManagement) || oSettings.chartSettings.variantManagement,
				chartTitle: oSettings.targetAnnotation && oSettings.targetAnnotation.Title,
				persistencyKeyState: fnGetPersistencyKeyState(oSettings.chartSettings)
			};
		}
		
		function fnIsAction(oDataField){
			return oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation";
		}
		
		function fnNegate(fnTest){
			// expects a function returning a boolean and negates the result - useful for array functions like find or filter, if test function returning the opposite exists
			// -> can be used like array.find(fnNegate.bind(this, fnTest)) to find the first entry, where fnTest returns false. "this" is not needed here, but passed to fnTest
			
			// call fnTest with the same arguments except the first one. As arguments is not a real array, we cannot call slice directly.
			return !fnTest.apply(this, Array.prototype.slice.apply(arguments, [1]));
		}

		function fnNormalizeSectionSettings(oFacetData) {
			// To avoid the inconsistency introduced in the past to read section settings, the framework now merges the settings coming from id generated from annotations
			// and the id framework generates thus avoid breaking the possibility to define the settings either way.
			var oMergedSectionSettings = oOriginalSettings.sections &&
			extend({}, oOriginalSettings.sections[oFacetData.additionalData.facetId], oOriginalSettings.sections[oFacetData.fallbackIdByAnnotationPathForManifest]);
	
			extend(oFacetData, oMergedSectionSettings, oFacetData);

			// Prio 3: any settings on page level: Maybe only relevant depending on annotation (e.g. tableSettings only relevant for LineItem annotation)
			// With valid target, the Block is of course relevant.
			// In case of broken target (i.e. reference facet pointing to non-existent lineitem or chart annotation), it depends on whether the navigation path exists, and qualifies for a table/chart
			// (that means: last segment has multiplicity *, and all segments before have multiplicity 0..1 or 1). If this is given, we create a SmartTable or SmartChart. As the target is broken, this would 
			// of course not show anything meaningful, but this could be healed by use of extensions (at least in case of SmartTable by column extensions).
			// Todo:
			// - check, whether this is really also relvant for smartChart
			// - check, whether this also relevant for other types (contacts?)			
			if (oFacetData.targetAnnotation || ((oFacetData.additionalData.type === "SmartTable" || oFacetData.additionalData.type === "SmartChart") && AHModel.isMultiple(oMetaModel.getContext(oFacetData.metaModelPath + "/Target")))){
				var oSettings = deepExtend({}, oOriginalSettings, oFacetData);
	
				/*
				 *	To be checked - where is this needed?
				 *
				 * 					var oLoadingBehavior = oSettings && oSettings.loadingBehavior;
		                            if (!oLoadingBehavior) {
		                                // default LoadingBehavior
		                                oSettings.loadingStrategy = "lazyLoading";
		                            } else if (oLoadingBehavior.waitForViewportEnter) {
		                                oSettings.loadingStrategy = oLoadingBehavior.waitForHeaderData ? "lazyLoadingAfterHeader" : "lazyLoading";
		                             } else {
		                                oSettings.loadingStrategy = oLoadingBehavior.waitForHeaderData ? "activateAfterHeaderDataReceived" : "activateWithBindingChange";
		                             }
				 */
		
				// specific analysis for anything defined in the annotation a reference facet is refering to
				// only needed on block level - on sections and subSections level, targetAnnotation is not defined
		
				switch (oFacetData.additionalData.type) {
					case "SmartTable":
						oFacetData.tableSettings = fnGetNormalizedTableSettings(oSettings);
						break;
					case "SmartChart":
						oFacetData.chartSettings = fnGetNormalizedChartSettings(oSettings);
						break;
					case "SmartForm":
						// FieldGroup and Identification are very similar, except Fieldgroup has a property "Data" containing the content
						// use common format to treat them equally
						// unfortunately, FieldGroup is sometimes (at least in our demokit) used like if it was identification
						// this contradicts the vocabulary, but changing might be incompatible - keep it for now
						// therefore, we just check for targetAnnotation being an array (correct in case of identification, misuse in case of fieldgroup)
						oFacetData.temporaryData.content = Array.isArray(oFacetData.targetAnnotation) ? oFacetData.targetAnnotation.filter(fnNegate.bind(null, fnIsAction)) : oFacetData.targetAnnotation.Data;
						break;
					default: break;
				}
			}
		}
	
		function fnGetTitleVisibility(oSectionData, oSubSectionData) {
			// Based on the Visibility of the subsection title, adding heading level for the subsection title dynamically.
			// If Sub-Section Title is visible, then heading level is set to H4 or slse "Auto".
			// For Table/Chart if Sub-Section title is visible then heading level is set to "H5" or else "H4".
			if (oSubSectionData.blocks.length === 1 && oSubSectionData.blocks[0].targetAnnotation) {
				var oFacetData = oSubSectionData.blocks[0];
				// as targetAnnotation is found, we can rely on correct facetAnnotation
				var sSectionTitleLabel = oSectionData.annotations.Facet.annotation.Label && oSectionData.annotations.Facet.annotation.Label.String;
				var sAnnotation = oFacetData.annotations.Facet.annotation.Target.AnnotationPath.split("@")[1].split("#")[0];
				var sSubsectionTitleLabel = oSubSectionData.annotations.Facet.annotation.Label && oSubSectionData.annotations.Facet.annotation.Label.String;
				var bIsNotSameTitle;
				switch (sAnnotation) {
					case "com.sap.vocabularies.UI.v1.LineItem":
							bIsNotSameTitle = sSubsectionTitleLabel !== (oFacetData.tableSettings.headerInfo && oFacetData.tableSettings.headerInfo.TypeNamePlural && oFacetData.tableSettings.headerInfo.TypeNamePlural.String);
							if (!bIsNotSameTitle) {
								oSectionData.bShowTitle = sSectionTitleLabel !== (oFacetData.tableSettings.headerInfo && oFacetData.tableSettings.headerInfo.TypeNamePlural && oFacetData.tableSettings.headerInfo.TypeNamePlural.String);
								oFacetData.tableSettings.bHeadingLevel = oSectionData.bShowTitle ? "H4" : "H3";
							} else {
								oSubSectionData.bHeadingLevel = bIsNotSameTitle ? "H4" : "Auto";
								oFacetData.tableSettings.bHeadingLevel = bIsNotSameTitle ? "H5" : "H4";
							}
						return bIsNotSameTitle;
					case "com.sap.vocabularies.UI.v1.Chart":
							bIsNotSameTitle = sSubsectionTitleLabel !== (oFacetData.chartSettings.chartTitle && oFacetData.chartSettings.chartTitle.String);
							if (!bIsNotSameTitle) {
								oSectionData.bShowTitle = sSectionTitleLabel !== (oFacetData.chartSettings.chartTitle && oFacetData.chartSettings.chartTitle.String);
								oFacetData.chartSettings.bHeadingLevel = oSectionData.bShowTitle ? "H4" : "H3";
							} else {
								oSubSectionData.bHeadingLevel = bIsNotSameTitle ? "H4" : "Auto";
								oFacetData.chartSettings.bHeadingLevel = bIsNotSameTitle ? "H5" : "H4";
							}
						return bIsNotSameTitle;
					default:
							oSubSectionData.bHeadingLevel = "H4";
						return true;
				}
			}
			// if there are more number of blocks return true
			oSubSectionData.bHeadingLevel = "H4";
			oSectionData.bShowTitle = true;
			return true;
		}
	
		function getExtensionSectionAndSubsection(sExtensionPointNamePrefix, oFacetViewExtension) {
			var oStableIdTypesAndSubTypeForFacetExtensionSectionsAndSubSections = {
					BeforeFacet: {
						withKey: {
							section: {
								type: "ObjectPageSection",
								subType: "BeforeFacetExtensionSectionWithKey"
							},
							subSection: {
								type: "ObjectPageSection",
								subType: "BeforeFacetExtensionSubSectionWithKey"
							}
						},
						withoutKey: {
							section: {
								type: "ObjectPageSection",
								subType: "BeforeFacetExtensionSection"
							},
							subSection: {
								type: "ObjectPageSection",
								subType: "BeforeFacetExtensionSubSection"
							}
						}
					},
					AfterFacet: {
						withKey: {
							section: {
								type: "ObjectPageSection",
								subType: "AfterFacetExtensionSectionWithKey"
							},
							subSection: {
								type: "ObjectPageSection",
								subType: "AfterFacetExtensionSubSectionWithKey"
							}
						},
						withoutKey: {
							section: {
								type: "ObjectPageSection",
								subType: "AfterFacetExtensionSection"
							},
							subSection: {
								type: "ObjectPageSection",
								subType: "AfterFacetExtensionSubSection"
							}
						}
					}
			};
	
			var oStableIdParameterDefinition = oStableIdTypesAndSubTypeForFacetExtensionSectionsAndSubSections[sExtensionPointNamePrefix][oFacetViewExtension.sKey ? "withKey" : "withoutKey"];
			
			var oStableIdParameter = extend({}, oStableIdParameterDefinition.section);
			oStableIdParameter.sEntitySet = oFacetViewExtension.sEntitySet;
			oStableIdParameter.sFacet = oFacetViewExtension.sFacetId;
			// in case key is explicitly defined by application, use that one - otherwise use key derived from extension point name (4th part of split by |)
			oStableIdParameter.sFacetExtensionKey = oFacetViewExtension.oExtensionDefinition.key || oFacetViewExtension.sKey;
			var sSectionId = StableIdHelper.getStableId(oStableIdParameter);
			
			oStableIdParameter.type = oStableIdParameterDefinition.subSection.type;
			oStableIdParameter.subType = oStableIdParameterDefinition.subSection.subType;
			var sSubSectionId = StableIdHelper.getStableId(oStableIdParameter);
			
			return {
				id: sSectionId,
				additionalData: {
					facetId: oFacetViewExtension.sFacetId
				},
				extensionPointName: oFacetViewExtension.sExtensionPointName,
				extensionPointNamePrefix: oFacetViewExtension.sExtensionPointNamePrefix,
				subSections: [{
					id: sSubSectionId,
					additionalData: {
						facetId: oFacetViewExtension.sFacetId
					},
					temporaryData: {},
					extensionPointName: oFacetViewExtension.sExtensionPointName,
					extensionPointNamePrefix: oFacetViewExtension.sExtensionPointNamePrefix,
					blocks: []
				}]
			}; 
		}
	
		var aViewExtensions;
		function fnGetViewExtensions(){
			if (!aViewExtensions) {
				// get all the extensions
				var mViewExtensions = oComponentUtils.getViewExtensions() || {};
				aViewExtensions = Object.keys(mViewExtensions).map(function(sExtensionPointName) {
					var aKeyParts = sExtensionPointName.split("|");
					return {
						sExtensionPointNamePrefix: aKeyParts[0],
						sEntitySet: aKeyParts[1],
						sFacetId: aKeyParts[2],
						sKey: aKeyParts[3],
						oExtensionDefinition: mViewExtensions[sExtensionPointName],
						sExtensionPointName: sExtensionPointName
					};
				}).filter(function(oViewExtension) {
					// get the current object page instance extension
					return oViewExtension.sEntitySet === sLeadingEntitySet;
				});
			}

			return aViewExtensions;
		}

		function fnGetExtensionAction(sFacetId, sHeaderOrSection){
			var oControllerExtensions = oComponentUtils.getControllerExtensions(); // all "structured" controller extensions for this OP instance, possibly undefined
			if (sHeaderOrSection === "Section") {
				return oControllerExtensions && oControllerExtensions.Sections && oControllerExtensions.Sections[sFacetId] && oControllerExtensions.Sections[sFacetId].Actions;
			}
			if (sHeaderOrSection === "Header") {
				return oControllerExtensions && oControllerExtensions.Header && oControllerExtensions.Header.Actions || [];
			}
		} 
		
		function fnAddSectionsFromExtensions(aSectionsFromAnnotations){
			var aViewExtensions = fnGetViewExtensions();
			
			var aResultSections = [];
			aSectionsFromAnnotations.forEach(function (oSectionData) {
				var aBeforeFacetExtensions = aViewExtensions.filter(function(oViewExtension){
					return oViewExtension.sFacetId === oSectionData.additionalData.facetId && oViewExtension.sExtensionPointNamePrefix === "BeforeFacet";
				});
				var aAfterFacetExtensions = aViewExtensions.filter(function(oViewExtension){
					return oViewExtension.sFacetId === oSectionData.additionalData.facetId && oViewExtension.sExtensionPointNamePrefix === "AfterFacet";
				});
				// keep the order
				aResultSections = aResultSections.concat(aBeforeFacetExtensions.map(getExtensionSectionAndSubsection.bind(null, "BeforeFacet")));
				aResultSections.push(oSectionData);
				aResultSections = aResultSections.concat(aAfterFacetExtensions.map(getExtensionSectionAndSubsection.bind(null, "AfterFacet")));
			});
			return aResultSections;
		}
	
		function fnAddSmartFormExtensions(oBlockData){
			var aViewExtensions = fnGetViewExtensions();
			
			var oSmartFormExtension = aViewExtensions.find(function(oViewExtension){
				return oViewExtension.sFacetId === oBlockData.additionalData.facetId && oViewExtension.sExtensionPointNamePrefix === "SmartFormExtension";
			});
			if (oSmartFormExtension){
				oBlockData.extensionPointName = oSmartFormExtension.sExtensionPointName;
				oBlockData.extensionPointNamePrefix = "SmartFormExtension";
				// SmartFormExtension requires type = SmartForm, but possibly not set yet if reference facet points to not existent target
				// If annotation term is not FieldGroup or Identification, but target exists, it could either be a different type (then SmartFormExtension would be ignored in xml)
				// or sth. completely unknwon (not allowed from vocabulary (e.g. UI.Facets) or at least not impemted by us.
				// In that case, we would create a SmartForm just to enable the SmartFormExtension.
				// If however the target is an array (like UI.Facets - this is actually an existing example from an app!) this would lead to trying us to create SmartFields per entry 
				// - if the entries do not fit, that would break (if multiple entries have no value property, we would create duplicate (broken) ids)
				// This could be again avoided if also a replaceFacet extension exists for this facet (like in the app using UI.Facets here) - then the SmartForm (including extension)
				// would be ignored anyway, we just should make sure not to filter the block completely (as replaceFacet is still evaluated in xml) 
				oBlockData.additionalData.type = oBlockData.additionalData.type || "SmartForm"; 
			}
		}
		
		function fnNormalizeBlock(oBlockData){
			// determine type of Block
			// oBlockData.annotations.Facet.annotation definitely is an object, as build by us in fnGetSections
			// Target should be an object with property AnnotationPath being a string - but this we cannot rely on as it's defined by applications
			// wrong defined annotations are (mis)used by applications as anchor for extensions
			// known misuse (these are taken car of now):
			// - reference facet without Target
			// - reference facet with Target, but without AnnotationPath
			// - AnnotationPath being a string not containing an @ (defining the target annotation term)
			// additional possible (no occurence known and not taken care of so far):
			// - AnnotationPath not being a string (but an object)
			var sTargetAnnotationTerm = oBlockData.annotations.Facet.annotation.Target && oBlockData.annotations.Facet.annotation.Target.AnnotationPath && oBlockData.annotations.Facet.annotation.Target.AnnotationPath.split("@")[1];
			sTargetAnnotationTerm = sTargetAnnotationTerm && sTargetAnnotationTerm.split("#")[0]; 
			
			switch (sTargetAnnotationTerm){
			case "com.sap.vocabularies.UI.v1.FieldGroup":
			case "com.sap.vocabularies.UI.v1.Identification":
				oBlockData.additionalData.type = "SmartForm";
				break;
			case "com.sap.vocabularies.UI.v1.LineItem":
				oBlockData.additionalData.type = "SmartTable";
				break;
			case "com.sap.vocabularies.UI.v1.Chart":
				oBlockData.additionalData.type = "SmartChart";
				break;
			case "com.sap.vocabularies.Communication.v1.Address":
				oBlockData.additionalData.type = "Address";
				break;
			case "com.sap.vocabularies.Communication.v1.Contact":
				oBlockData.additionalData.type = "Contact";
				break;
			default:
				// todo: 
				// - check other possible annotations, e.g.
				//						case "com.sap.vocabularies.UI.v1.DataPoint":
				// - check how to correctly react on unknown (or maybe wrong spelled) annotations in target - could they (like non-existent ones) be used
				//   as anchor for extensions? (Assumption: yes, for SmartFormExtension - but maybe also depending on (existent) navigation property for columns?)
				//oBlockData.additionalData.type = "SmartForm"; 
			}
			
			fnNormalizeSectionSettings(oBlockData);
			fnAddSmartFormExtensions(oBlockData);
		}
		
		function fnIsBlockRelevant(oBlockData){
			if (oBlockData.annotations.Facet.annotation.RecordType !== "com.sap.vocabularies.UI.v1.ReferenceFacet"){
				// no reference facet
				return false;
			}

			// invalid or empty targets should be ignored, but how to identify these differs
			switch (oBlockData.additionalData.type){
			case "SmartForm":
				if (oBlockData.extensionPointName){
					// extension block is always relevant
					return true;
				}
				if (!oBlockData.targetAnnotation || !oBlockData.temporaryData.content){
					// invalid or empty target (fieldgroup without data)
					return false;
				}
				// treat fieldgroups containing only actions as empty, as actions (DatafieldForAction, DataFieldForIBN) are moved to subSection
				return oBlockData.temporaryData.content.find(function(oDataField){
					return (oDataField.RecordType !== "com.sap.vocabularies.UI.v1.DataFieldForAction" && oDataField.RecordType !== "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation");
				});
			case "SmartTable":
				return oBlockData.tableSettings;
			case "SmartChart":
				return oBlockData.chartSettings;
			default:
				// specific code for other types to be added
				// for the time being: assume blocks are relevant, if target is valid
				return oBlockData.targetAnnotation;
			}
		}

		function fnPointsToSmartForm(oBlockData){
			return oBlockData.additionalData.type === "SmartForm";
		}

		function fnGetOverridenTableLevelStandardAction(oStandardActionToBeOverridden, oExtensionAction) {
			if (!oStandardActionToBeOverridden) {
				throw new FeError(sClassName, "Identified an invalid value of 'logicalAction' i.e., '" + oExtensionAction.logicalAction + "' for a custom action in the manifest.");
			}
			return deepExtend({}, oStandardActionToBeOverridden, {
				id: oExtensionAction.id && StableIdHelper.getStableId({ type: "ObjectPageAction", subType: "CommonAction", sAction: oExtensionAction.id }),
				text: oExtensionAction.text,
				enabled: oExtensionAction.applicablePath && AnnotationHelper.getBreakoutActionEnabledKey(oExtensionAction),
				importance: oExtensionAction.importance,
				callbackName: oExtensionAction.press,
				isStandardAction: false,
				ariaHasPopup: sap.ui.core.aria.HasPopup.None
			});
		}

		/* Returns the passed DataField (DataFieldForAction/DataFieldForIntentBasedNavigation which belongs to a sub-section) details required 
		   to put in the corresponding sub-section template settings */
		function fnGetDataFieldDetails(oDataField, sMetaModelPathContentPrefix, nIndex, oOpSettings, sActionId) {
			var oActionDataFieldDetails = {};
			var sPressHandler = "._templateEventHandlers.";
			// calling AHModel.format is needed, as action could be defined as string or path
			// as AHModel.format is defined to require interface context, we need to provide the context (not just the value). This works for formatters with requiresIContext = true and only 1 additional parameter. 
			var sDataFieldAction = AHModel.format(oMetaModel.getContext(sMetaModelPathContentPrefix + nIndex + "/Action"));
			switch (oDataField.RecordType) {
				case "com.sap.vocabularies.UI.v1.DataFieldForAction":
					var aParameters = [];
					aParameters.push("'" + sDataFieldAction + "'");
					aParameters.push("'" + sActionId + "'");
					var sInvocationGrouping = (oDataField.InvocationGrouping && oDataField.InvocationGrouping.EnumMember) || "";
					aParameters.push("'" + sInvocationGrouping + "'");
					sPressHandler += "onCallAction(" + aParameters.join(", ") +  ")";
					oActionDataFieldDetails.sPressHandler = sPressHandler;

					var oPageAnnotatedAction = oOpSettings.annotatedActions && oOpSettings.annotatedActions[sDataFieldAction.split("/")[1]];
					if (oPageAnnotatedAction) {
						oActionDataFieldDetails.sDataFieldCommand = oPageAnnotatedAction.command;
					}
					break;
				case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
					sPressHandler += "onDataFieldForIntentBasedNavigation";
					oActionDataFieldDetails.sPressHandler = sPressHandler;

					oActionDataFieldDetails.oIntent = {
						semanticObject: AHModel.format(oMetaModel.getContext(sMetaModelPathContentPrefix + nIndex + "/SemanticObject")),
						action: sDataFieldAction
					};

					var sMatchingOutbound = Object.keys(oOpSettings.outbounds || {}).find(function(sOutbound) {
						var oNavigationIntent = oComponentUtils.getOutboundNavigationIntent(oInternalManifest, sOutbound);
						return oNavigationIntent.semanticObject === oDataField.SemanticObject.String && oNavigationIntent.action === oDataField.Action.String;
					});
					if (sMatchingOutbound) {
						oActionDataFieldDetails.sDataFieldCommand = oOpSettings.outbounds[sMatchingOutbound].command;
					}
					break;
				default:
					break;
			}
			return oActionDataFieldDetails;
		}

		function fnGetTableAnnotatedActionCommandDetails(oBlock, oOpSettings) {
			var aCommandsDetails = [], oCommandDetails;
			(oBlock.targetAnnotation || []).forEach(function(oDataField) {
				switch (oDataField.RecordType) {
					case "com.sap.vocabularies.UI.v1.DataFieldForAction":
						oCommandDetails = oComponentUtils.getToolbarDataFieldForActionCommandDetails(oDataField, oOpSettings, undefined, oMetaModel.getObject(oBlock.metaModelPath));
						if (!isEmptyObject(oCommandDetails)) {
							aCommandsDetails.push(oCommandDetails);
						}
						break;
					case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
						oCommandDetails = oComponentUtils.getToolbarDataFieldForIBNCommandDetails(oDataField, oOpSettings, oInternalManifest, undefined, oMetaModel.getObject(oBlock.metaModelPath));
						if (!isEmptyObject(oCommandDetails)) {
							aCommandsDetails.push(oCommandDetails);
						}
						break;
					default:
						break;
				}
			});
			return aCommandsDetails;
		}

		function fnNormalizeSubSection(oSectionData, oSubSectionData){
			fnNormalizeSectionSettings(oSubSectionData);
			oSubSectionData.blocks.forEach(fnNormalizeBlock);

			// Check whether SideContent is maintained for the SubSection in manifest
			var sSideContentExtensionName = AHSideContent.getSideContentExtensionPoint(sLeadingEntitySet, 
									oSubSectionData.additionalData.facetId, oComponentUtils.getViewExtensions());
			if (sSideContentExtensionName) {
				oSubSectionData.sideContentSettings = {
					id: StableIdHelper.getStableId({ 
						type: "ObjectPageSection",
						subType: "DynamicSideContent",
						sFacet: oSubSectionData.additionalData.facetId
					})
				};
			}
			
			// add actions to subsection
			oSubSectionData.actions = [];
			var oOpSettings = oComponentUtils.getSettings();

			oSubSectionData.blocks.forEach(function(oBlock){
				// add extension actions to subsection
				// only in case of SmartForm (in other cases (like Table or Chart) actions are put into toolbar of the corresponding control)
				if (oBlock.additionalData.type === "SmartForm"){
					var oExtensionsActions = fnGetExtensionAction(oBlock.additionalData.facetId, "Section");
					Object.values(oExtensionsActions || {}).forEach(function(oExtensionAction){
						var oFormAction = {
							id: StableIdHelper.getStableId({
								type: "ObjectPageAction",
								subType: "CommonAction",
								sAction: oExtensionAction.id
							}),
							text: oExtensionAction.text,
							press: oExtensionAction.press
						};
						if (oExtensionAction.command) {
							oFormAction.command = oExtensionAction.command;
						}
						oSubSectionData.actions.push(oFormAction);
					});
				}
				
				if (oBlock.additionalData.type === "SmartTable" && oBlock.tableSettings) {
					var oExtensionsTableActions = fnGetExtensionAction(oBlock.additionalData.facetId, "Section");
					if (oExtensionsTableActions) {
						oBlock.tableSettings.extensionActions = [];
						Object.values(oExtensionsTableActions).forEach(function (oExtensionAction) {
							if (oExtensionAction.logicalAction) {
								oBlock.tableSettings.commandExecution[oExtensionAction.logicalAction] = fnGetOverridenTableLevelStandardAction(oBlock.tableSettings.commandExecution[oExtensionAction.logicalAction], oExtensionAction);
							} else {
								oExtensionAction.enabled = AnnotationHelper.getBreakoutActionEnabledKey(oExtensionAction);
								oBlock.tableSettings.extensionActions.push(oExtensionAction);
								if (oExtensionAction.command) {
									oBlock.tableSettings.commandExecution[oExtensionAction.id] = {
										id: oExtensionAction.id,
										action: oExtensionAction.command,
										callbackName: oExtensionAction.press
									};
									oExtensionAction.press = "cmd:" + oExtensionAction.command;
								}
							}
						});
					}

					// handle annotated action keyboard shortcuts
					var aAnnotatedActionsCommandDetails = fnGetTableAnnotatedActionCommandDetails(oBlock, oOpSettings);
					aAnnotatedActionsCommandDetails.forEach(function (oAnnotatedActionCommandDetails) {
						oBlock.tableSettings.commandExecution[oAnnotatedActionCommandDetails.id] = oAnnotatedActionCommandDetails;
					});
				}

				// add actions annotated as DataFieldForAction / ForIBN in fieldgroups or identification
				if (!oBlock.targetAnnotation || !oBlock.temporaryData.content){
					return;
				}

				var sMetaModelPathTarget = AHModel.resolvePath(oMetaModel.getContext(oBlock.metaModelPath + "/Target"));
				// FieldGroup has a Property "Data" containing the content, while Identification consist only of the content - so metaModelPath looks slightly different
				// beginning part can be build here, last segment (position in array) can only be added inside the loop 
				var sMetaModelPathContentPrefix = sMetaModelPathTarget + (oBlock.targetAnnotation.Data ? "/Data/" : "/" );
				oBlock.temporaryData.content.forEach(function(oDataField, iIndex){
					if (!oDataField || !oDataField.Action || (oDataField.RecordType !== "com.sap.vocabularies.UI.v1.DataFieldForAction" && oDataField.RecordType !== "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation")){
						return;
					}

					var sDataFieldId = StableIdHelper.getStableId({
						type: "ObjectPage",
						subType: "DataField",
						sRecordType: oDataField.RecordType,
						sSemanticObject: oDataField.SemanticObject && (oDataField.SemanticObject.String || oDataField.SemanticObject.Path),
						sAction: oDataField.Action && (oDataField.Action.String || oDataField.Action.Path)
					});
					var sActionId = StableIdHelper.getStableId({
						type: "ObjectPageAction",
						subType: "AnnotatedAction",
						sFacet: oBlock.additionalData.facetId,
						sDataField: sDataFieldId
					});
					var oActionDataField = fnGetDataFieldDetails(oDataField, sMetaModelPathContentPrefix, iIndex, oOpSettings, sActionId);
					oSubSectionData.actions.push({
						id: sActionId,
						press: oActionDataField.sPressHandler,
						semanticObject: oActionDataField.oIntent && oActionDataField.oIntent.semanticObject,
						action: oActionDataField.oIntent && oActionDataField.oIntent.action,
						metaModelPath: sMetaModelPathContentPrefix + iIndex, // metaModelPath of DataFieldForAction - not the one of the functionImport itself!
						command: oActionDataField.sDataFieldCommand,
						actionPress: oActionDataField.sDataFieldCommand ? "cmd:" + oActionDataField.sDataFieldCommand : oActionDataField.sPressHandler
					});
				});
			});
			
			// remove superfluous blocks
			oSubSectionData.blocks = oSubSectionData.blocks.filter(fnIsBlockRelevant);
			
			// restore behaviour from 1.84 and before: only separate SmartForms is 3 level hierarchy and at least 1 reference Facet pointing to sth. not feasable for SmartForm (lineItem or chart)
			// otherwise, create only one SmartForm containing groups per referenceFacet
			if (oSubSectionData.temporaryData.potentiallySeparateForms && !oSubSectionData.blocks.every(fnPointsToSmartForm)){
				// keep separated SmartForms, distribute properties on needed level
				oSubSectionData.blocks = oSubSectionData.blocks.map(function(oBlockData){
					if (fnPointsToSmartForm(oBlockData)){
						// move everything one level down (to group) 
						return {
							additionalData: {
								type: oBlockData.additionalData.type,
								facetId: oBlockData.additionalData.facetId
							},
							metaModelPath: oBlockData.metaModelPath,
							controlProperties: {
								id: StableIdHelper.getStableId({
									type: "ObjectPageSection",
									subType: "SmartForm",
									sFacet: oBlockData.additionalData.facetId,
									sIsPartOfPreview: oBlockData.annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool
								})
							},
							aggregations: {
								groups: [oBlockData]
							}
						};
					} else {
						// keep like it is
						return oBlockData;
					}
				});
				oSubSectionData.moreBlocks = oSubSectionData.blocks.filter(function (oBlockData) {
					if (oBlockData.additionalData.type === "SmartForm"){
						return oBlockData.aggregations.groups[0].annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "false";
					} else {
						return oBlockData.annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "false";
					}
				});
				oSubSectionData.blocks = oSubSectionData.blocks.filter(function (oBlockData) {
					if (oBlockData.additionalData.type === "SmartForm"){
						return oBlockData.aggregations.groups[0].annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "true";
					} else {
						return oBlockData.annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "true";
					}
				});
				
				
			} else {
				// aggregate all blocks pointing to FieldGroup or similar to one, but keep others 
				var oSmartFormData = {
					additionalData: {
						type: "SmartForm",
						facetId: oSubSectionData.additionalData.facetId
					},
					controlProperties: {
						id: StableIdHelper.getStableId({
							type: "ObjectPageSection",
							subType: "SmartForm",
							sFacet: oSubSectionData.additionalData.facetId,
							sIsPartOfPreview: "true"
						})
					},
					aggregations: {
						groups: oSubSectionData.blocks.filter(function(oBlockData){
							return fnPointsToSmartForm(oBlockData) && oBlockData.annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "true";
						})
					}
				};

				var oSmartFormMoreBlocksData = {
						additionalData: {
							type: "SmartForm",
							facetId: oSubSectionData.additionalData.facetId
						},
						controlProperties: {
							id: StableIdHelper.getStableId({
								type: "ObjectPageSection",
								subType: "SmartForm",
								sFacet: oSubSectionData.additionalData.facetId,
								sIsPartOfPreview: "false"
							})
						},
						aggregations: {
							groups: oSubSectionData.blocks.filter(function(oBlockData){
								return fnPointsToSmartForm(oBlockData) && oBlockData.annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "false";
							})
						}
					};
				
				oSubSectionData.moreBlocks = oSubSectionData.blocks.filter(function(oBlockData){
					return !fnPointsToSmartForm(oBlockData) && oBlockData.annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "false";
				});
				oSubSectionData.blocks = oSubSectionData.blocks.filter(function(oBlockData){
					return !fnPointsToSmartForm(oBlockData) && oBlockData.annotations.Facet.annotation["com.sap.vocabularies.UI.v1.PartOfPreview"].Bool === "true";
				});
				
				// add SmartForm as first entry
				// clarify: add SmartForm even when no content? (1.84: in 2 level hierarchy yes, in 3 level hierarchy no)
				// if yes: also for facet-extensions? Not really meaningful there...
				if (oSmartFormData.aggregations.groups.length > 0){
					oSubSectionData.blocks.unshift(oSmartFormData);
				}
				if (oSmartFormMoreBlocksData.aggregations.groups.length > 0){
					oSubSectionData.moreBlocks.unshift(oSmartFormMoreBlocksData);
				}
			}
			
			// Todo: check, whether it's correct to analyze visibility here (after building additional hierarchy level groups incl. segregating blocks and more blocks)
			// Title is hidden only, when there's only one block, this one is showing a table or a chart, and this control shows the same title as the subsection
			// Questionable edge cases:
			// - only e block, it matches the criteria, but is not partOfPreview => title would not be shown before user presses show more
			// - multiple blocks, but only one being partOfPreview, that one matches the criteria => title would be shown twice, which seems to be superfluous until user presses show more
			
			/*
			in case of subsection having single block with either a table or chart and subsection title matches table title
			then hide subsection and section title and show only table title
			*/
			oSubSectionData.bShowTitle = fnGetTitleVisibility(oSectionData, oSubSectionData);

			/*
			Store the RenderingBehavior which currently support enabling of View Lazy Loading. No configuration would
			mean View Lazy Loading is disabled 
			*/
			oSubSectionData.additionalData.useViewLazyLoading = oComponentUtils.isRenderingWaitingForViewportEntered();
			/*
			Set the LazyLoading behavior for SubSection object
			TODO: Avoid recalculation of the same & assign it as custom data 
			*/
			fnSetLoadingStrategy(oSectionData, oSubSectionData);
		}

		function fnSetLoadingStrategy(oSectionData, oSubSectionData) {
			// Embedded Component based sections already have the loadingStrategy
			// assigned as reuseComponent. Therefore skip further processing
			if (!oSubSectionData.isEmbeddedSubSection) {
				// SubSection is not EmbeddedComponent & not annotated
				// check whether SubSection is coming from the extension
				if (!oSubSectionData.annotations) {
					var aViewExtensions = fnGetViewExtensions();
					var oViewExtension = aViewExtensions.find(function(oViewExtension){
						return oViewExtension.sFacetId === oSubSectionData.additionalData.facetId;
					});

					if (oViewExtension) {
						// SubSection has extension view defined. LoadingStrategy needs to be determined
						// from the extension data
						var oExtensionGenericInfo = oViewExtension.oExtensionDefinition 
							&& oViewExtension.oExtensionDefinition["sap.ui.generic.app"];

						if (oExtensionGenericInfo && oExtensionGenericInfo.enableLazyLoading) {
							oSubSectionData.loadingStrategy = "lazyLoadingAfterHeader";
						}
						// Extension Views has enableLazyLoading set then LoadingStrategy is set
						// to lazyLoadingAfterHeader. In all other cases it should return empty
						// loadingStrategy
						return;
					}
				}
				
				// SubSection is an annotated section. Check whether a loading strategy is configured
				// else return the default loading strategy (LazyLoading).
				if (oSectionData) {
					if (oSectionData.loadingBehavior) {
						var oLoadingBehavior = oSectionData.loadingBehavior;
						if (oLoadingBehavior.waitForViewportEnter) {
							oSubSectionData.loadingStrategy = oLoadingBehavior.waitForHeaderData ? "lazyLoadingAfterHeader" : "lazyLoading";
							return;
						}

						oSubSectionData.loadingStrategy = oLoadingBehavior.waitForHeaderData ? "activateAfterHeaderDataReceived" : "activateWithBindingChange";
						return;
					}
				}

				// Set default Loading Strategy
				oSubSectionData.loadingStrategy = "lazyLoading";
			}
		}
		
		function fnIsSubSectionRelevant(){
			return true;
		}
	
		function fnNormalizeSection(oSectionData){
			fnNormalizeSectionSettings(oSectionData);
			oSectionData.subSections.forEach(fnNormalizeSubSection.bind(null, oSectionData));
			oSectionData.subSections = oSectionData.subSections.filter(fnIsSubSectionRelevant);
		}
		
		function fnIsSectionRelevant(){
			return true;
		}
	
		/* This method returns an array describing relevant information for (nearly) all the sections to be created on the OP. The order is the order in which we create the 
		 * sections, but be aware that UI adaptation could change the visible order in the final UI.
		 * 
		 * Exception: currently, in case of editable header one special section is created in section fragment, that is not reflected in this array.
		 * 
		 * Ideal structure: Ideally, we expect a deep nested structure. It does not need to reflect the full control tree, but can build an abstraction, i.e. controls added with
		 * hard coded properties (like grid in facet fragment) can be left out. On each level, data related to one control should be described by the following common properties:
		 * 	id: the local stable id for that control. Can be used to lookup the entry in the structure (e.g. in an event handler of that control), or to find the control using 
		 * 			byId when iterating through this structure
		 * 	metaModelPath: Path in the metamodel pointing to the annotation responsible for creating the control. Can be used with helper getMetaModelBinding to get a reference to
		 * 			the annotation. Remark: There is no clear 1:1 relationship between annotations and controls. However, original implementation was based on iterating through
		 * 			annotations, thus there's always one most specific annotation. This path should point to that annotation to allow stepwise transformation of fragments. Once no 
		 * 			direct evaluation of annotations is done within the fragments, but everything is prepared into this structure, metaModelPath would not be needed anymore.  
		 * 	controlName: Name of the control to be put. Esp. useful in aggregations, where we put different controls in different situations (e.g. aggregation blocks of 
		 * 			SubSections). 
		 * 	controlProperties: Map of fully prepared properties to be set to this control. (Key = PropertyName, value can be a fixed value or a binding string to be evaluated at
		 * 			runtime)
		 * 	aggregations: Map of those aggregations of the control used by us (i.e. we put controls to in our fragments). Key should be the name of the corresponding aggregation,
		 * 			value should be an (array of) object(s) of the same structure. (In most cases, the relevant aggregation are of cardinality 0..n - in case of cardinality 0..1, 
		 * 			value could just be an object of the given structure.
		 * 	additionalData: Any further data to be provided in relation to that control. Structure to be defined case by case. Can be used in two ways:
		 * 		- during template processing: In case of partial preanalysis. Should not be needed, once analysis is completely transferred. Typical example could be tableSettings
		 * 					or facetId (to be used to generate ids for aggregated controls)
		 * 		- to replace customData so far filled during template processing to be used at runtime.
		 * 
		 * Unfortunately, what is described above is currently not reality - currently the structure looks like following:
		 * Properties of elements in this array:
		 * 	metaModelPath: Path in the metamodel pointing to the facet annotation being for this section. Can be used with helper getMetaModelBinding to get a reference to
		 * 			the annotation
		 * 	id: local stable Id of the section control to be created. Currently only used in ExtensionFacetLayout.fragment.
		 * 			Ideally, id should always be provided, and then also be used in ControllerImplementation to lookup entry in this structure from given control or vice versa.  
		 * 	extensionPointName
		 * 	facetIdAsObject: Object with same structure as built be StableIdHelper.preparePathForStableId, i.e. with only one property id for easier transition from pure templating based approach 
		 * 		id: facetId (see below)
		 * 	additionalData
		 * 		facetId: Id created for the facet either defined in facet annotation or created out of target annotation path, used as parameter for controls put on this section 
		 * 	annotations
		 * 		Facet
		 * 	subSections: an array describing relevant information for all the subSections in the current section. Properties of elements:
		 * 		id
		 * 		metaModelPath
		 * 		facetIdAsObject
		 *  		additionalData
		 *  			facetId
		 *  			useViewLazyLoading
		 * 		annotations
		 * 			Facet
		 * 		bShowTitle
		 * 		blocks: an array describing relevant information for all the blocks in the current subSection. Properties of elements:
		 * 			metaModelPath
		 * 			tableSettings
		 * 			chartSettings
		 * 			controlProperties: Should contain all those properties of the control we put into the block, that are already fully prepared, i.e. in the view we should just see an element binding {block>controlProperties/<PropertyName>}
		 * 						Currently only used for the id of SmartForm. 
		 * 				id
		 * 			aggregations
		 * 				groups: an array describing relevant information for all the groups in the current block (if its type is SmartForm). Properties of elements:
		 * 			additionalData
		 * 				type: Type of the block to be created. Currently possible types are SmartForm, SmartTable, SmartChart, Address, Contact. 
		 * 		moreBlocks: an array describing relevant information for the blocks not being part of preview. Elements are structured like the one in blocks
		 * 		actions: an array describing relevant information for all the actions for the current subSection. Properties of elements:
		 * 			command
		 * 			press
		 * 			id
		 * 			action
		 * 			metaModelPath
		 * 			actionPress
		 * 			semanticObject
		 * 			text
		 * 	extensionPointNamePrefix
		 * 
		 */
		
		function fnGetSections(){
			var sEntityTypePath = oMetaModel.getMetaContext("/" + sLeadingEntitySet).getPath();
			var aSectionsFromAnnotations = fnGetSectionsFromAnnotations(sEntityTypePath + "/com.sap.vocabularies.UI.v1.Facets", false);
			var aAllSections = fnAddSectionsFromExtensions(aSectionsFromAnnotations);
			aAllSections.forEach(fnNormalizeSection);
			return aAllSections.filter(fnIsSectionRelevant);
		}

		function fnGetStream(){
			var oStreamEnabledAssociatedEntites = [];
			var oDataField;
			var oEntitySet = oMetaModel.getODataEntitySet(sLeadingEntitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			var aKeys = Object.keys(oEntityType);
			var aTargetAnnotation = aKeys.filter(function(sKey) {
									return sKey.includes("com.sap.vocabularies.UI.v1.FieldGroup") || sKey.includes("com.sap.vocabularies.UI.v1.Identification");
									});
			for (var i = 0; i < aTargetAnnotation.length; i++){
				var aTargetDataFields = oEntityType[aTargetAnnotation[i]].Data || oEntityType[aTargetAnnotation[i]];
				for (var k = 0; k < aTargetDataFields.length; k++) {
					oDataField = aTargetDataFields[k];
					if (checkIfAssociatedEntityHasStreamEnabled(oEntityType, oDataField)) {
						oStreamEnabledAssociatedEntites.push(getNavigationPropertyOfStream(oDataField, oEntityType));
					}
				}
			}
			return oStreamEnabledAssociatedEntites;
		}

		function getNavigationPropertyOfStream(oDataField, oEntityType){
			if (oDataField.Value && oDataField.Value.Path) {
				var sDataFieldValuePath = oDataField.Value.Path;
				var oAssociation;
				
				if (sDataFieldValuePath.indexOf('/') > -1) {
					var sNavigationProperty = sDataFieldValuePath.split("/")[0];
					oAssociation = oMetaModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
					oEntityType = oMetaModel.getODataEntityType(oAssociation && oAssociation.type) || oEntityType;	
					return sNavigationProperty;
				} 
				return;
			}
		}

		function checkIfAssociatedEntityHasStreamEnabled (oEntityType, oDataField) {
			if (oDataField.Value && oDataField.Value.Path) {
				var sDataFieldValuePath = oDataField.Value.Path;
				var oAssociation;
				//Check for '$value' in the end of the binding
				if (sDataFieldValuePath.endsWith("$value")) {
					var aDataFieldValuePathArray = sDataFieldValuePath.split("/");
					var iLength = aDataFieldValuePathArray.length;
					if (iLength > 1) {
						//Stream EntitySet is associated through navigation properties. Parse path to retrieve the entity
						for (var index = 0; index < iLength - 1; index++) {
							var sNavigationProperty = aDataFieldValuePathArray[index];
							var oAssociation = oMetaModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
							oEntityType = oMetaModel.getODataEntityType(oAssociation && oAssociation.type);
						}
						return oEntityType && oEntityType.hasStream === "true";		
					} 			
				}			 
					
			}
			return false;
		}

		function fnGetPageLevelActions() {
			function fnGetPageLevelStandardActions(oEntityType) {
				/*  Collection of standard actions available on OP at page level. Maps the logical action name to an object containing the relevant properties i.e.
						action => action name corresponding to the standard action
						callbackName => standard button's press event handler used in the command execution
						text => button's text
						id => button's ID
						press => triggers the action defined in the command execution
						isStandardAction =>	represents whether the action is a standard action or overridden by the custom action,
						determining => represents whether action is determining i.e., displayed in the footer
						
					If a custom action is defined with a valid 'logicalAction', then there could be two cases:

					Case 1: Custom action has an ID
						In this case, the corresponding standard button does not get created and instead an extension button 
						gets created, which takes over some standard functionality, especially the keyboard shortcut and the following properties:
							visible, text, importance, callbackName (if not defined in the manifest)

					Case 2: Custom action does not have an ID
						Here, the corresponding standard button gets created and takes over everything defined explicitly in the manifest. 
						
					In both the cases, isStandardAction is set to false.
					TODO: isStandardAction is only used to set different types of CustomData and OverflowToolbarLayoutData in the respective fragments.
						However, additional CustomData should not harm, and regarding OverflowToolbarLayoutData, importance should always be the default
						(if not defined otherwise) and so, it should be removed and the places where these CustomData are being consumed should be refactored (if required). */
				var sEmphasiedButtonType = AnnotationHelper.buildEmphasizedButtonExpression(oEntityType["com.sap.vocabularies.UI.v1.Identification"]);
				return {
					Delete: {
						action: "Delete",
						callbackName: "._templateEventHandlers.onDelete",
						id: StableIdHelper.getStableId({ type: "ObjectPageAction", subType: "CommonAction", sAction: "delete" }),
						text: "{i18n>DELETE}",
						press: "cmd:Delete",
						ariaHasPopup: sap.ui.core.aria.HasPopup.Dialog,
						isStandardAction: true,
						determining: false
					},
					Edit: {
						action: "Edit",
						callbackName: "._templateEventHandlers.onEdit",
						id: StableIdHelper.getStableId({ type: "ObjectPageAction", subType: "CommonAction", sAction: "edit" }),
						text: "{i18n>EDIT}",
						type: sEmphasiedButtonType,
						press: "cmd:Edit",
						isStandardAction: true,
						determining: false
					},
					Share: {
						action: "Share",
						callbackName: "._templateEventHandlers.onShareObjectPageActionButtonPress",
						isStandardAction: true,
						overrideForbidden: true,
						determining: false
					},
					NavigateForward: {
						action: "NavigateForward",
						callbackName: "._templateEventHandlers.onSwitchTabs(true)",
						isStandardAction: true,
						overrideForbidden: true,
						determining: false
					},
					NavigateBackward: {
						action: "NavigateBackward",
						callbackName: "._templateEventHandlers.onSwitchTabs(false)",
						isStandardAction: true,
						overrideForbidden: true,
						determining: false
					},
					Save: {
						action: "Save",
						callbackName: "._templateEventHandlers.onSave",
						id: StableIdHelper.getStableId({
							type: "ObjectPageAction",
							subType: "CommonAction",
							sAction: oComponentUtils.isDraftEnabled() ? "activate" : "save"
						}),
						text: "{= ${ui>/createMode} ? ${i18n>CREATE} : ${i18n>SAVE}}",
						type: sEmphasiedButtonType,
						press: "cmd:Save",
						visible: "{ui>/editable}",
						isStandardAction: true,
						determining: true
					}
				};
			}

			function fnGetOverridenStandardAction(oStandardActionToBeOverridden, oExtensionAction) {
				if (!oStandardActionToBeOverridden || oStandardActionToBeOverridden.overrideForbidden) {
					throw new FeError(sClassName, "Identified an invalid value of 'logicalAction' i.e., '" + oExtensionAction.logicalAction + "' for a custom action in the manifest.");
				}

				return deepExtend({}, oStandardActionToBeOverridden, {
					id: oExtensionAction.id && StableIdHelper.getStableId({
						type: "ObjectPageAction",
						subType: oExtensionAction.logicalAction === "Save" ? "CommonAction" : "HeaderExtensionAction",
						sAction: oExtensionAction.id
					}),
					text: oExtensionAction.text,
					visible: oExtensionAction.applicablePath && AHActionButtons.getActionControlBreakoutVisibility(oExtensionAction.applicablePath),
					importance: oExtensionAction.importance,
					callbackName: oExtensionAction.press,
					isStandardAction: false,
					ariaHasPopup: sap.ui.core.aria.HasPopup.None,
					type: sap.m.ButtonType.Default
				});
			}

			function getDataFieldForActionCommandDetails(oDataField) {
				var oCommandDetails = Object.create(null);
				var sFunctionImportName = oDataField.Action.String.split("/")[1];
				if (oOpSettings.annotatedActions && oOpSettings.annotatedActions[sFunctionImportName]) {
					var sActionStableId;
					if (!oDataField.Determining || oDataField.Determining.Bool === "false") {
						sActionStableId = "action::" + AnnotationHelper.getStableIdPartFromDataField(oDataField);
						oCommandDetails.callbackName = AHActionButtons.getCallAction(oDataField, sActionStableId);
					} else {
						sActionStableId = AnnotationHelper.getStableIdPartForDatafieldActionButton(oDataField) + "::Determining";
						oCommandDetails.callbackName = "._templateEventHandlers.onDeterminingDataFieldForAction";
					}
					oCommandDetails.id = sActionStableId;
					oCommandDetails.action = oOpSettings.annotatedActions[sFunctionImportName].command;
					oCommandDetails.annotatedAction = true;
				}
				return oCommandDetails;
			}

			function getDataFieldForIBNCommandDetails(oDataField) {
				if (oDataField.Determining && oDataField.Determining.Bool === "true") {
					var sMatchingOutbound = Object.keys(oOpSettings.outbounds || {}).find(function(sOutbound) {
						var oNavigationIntent = oComponentUtils.getOutboundNavigationIntent(oInternalManifest, sOutbound);
						return oNavigationIntent.semanticObject === oDataField.SemanticObject.String && oNavigationIntent.action === oDataField.Action.String;
					});
					if (sMatchingOutbound) {
						return {
							id: AnnotationHelper.getStableIdPartForDatafieldActionButton(oDataField) + "::Determining",
							action: oOpSettings.outbounds[sMatchingOutbound].command,
							callbackName: "._templateEventHandlers.onDeterminingDataFieldForIntentBasedNavigation",
							outboundAction: true
						};
					}
				}
				return Object.create(null);
			}

			var oPageLevelStandardActions = fnGetPageLevelStandardActions(oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(sLeadingEntitySet).entityType));
			var oControllerExtensions = oComponentUtils.getControllerExtensions();

			var aExtensionActionsWithoutLogicalAction = [],
				mCustomActionsWithCommand = Object.create(null),
				mAnnotatedActionsWithCommand = Object.create(null),
				mOutboundActionsWithCommand = Object.create(null);

			Object.values(oControllerExtensions && oControllerExtensions.Header && oControllerExtensions.Header.Actions || {}).forEach(function (oExtensionAction) {
				if (oExtensionAction.logicalAction) {
					oPageLevelStandardActions[oExtensionAction.logicalAction] = fnGetOverridenStandardAction(oPageLevelStandardActions[oExtensionAction.logicalAction], oExtensionAction);
				} else {
					oExtensionAction.id = StableIdHelper.getStableId({
						type: "ObjectPageAction",
						subType: oExtensionAction.determining ? "CommonAction" : "HeaderExtensionAction",
						sAction: oExtensionAction.id
					});
					aExtensionActionsWithoutLogicalAction.push(oExtensionAction);
					if (oExtensionAction.command) {
						mCustomActionsWithCommand[oExtensionAction.id] = {
							id: oExtensionAction.id,
							action: oExtensionAction.command,
							callbackName: oExtensionAction.press
						};
						oExtensionAction.press = "cmd:" + oExtensionAction.command;
					}
				}
			});

			// handle keyboard shortcut related manifest settings for actions defined via annotations e.g. DataFieldForAction and DataFieldForIBN
			var oEntityType = oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(sLeadingEntitySet).entityType);
			var oOpSettings = oComponentUtils.getSettings();
			(oEntityType["com.sap.vocabularies.UI.v1.Identification"] || []).forEach(function (oDataField) {
				switch (oDataField.RecordType) {
					case "com.sap.vocabularies.UI.v1.DataFieldForAction":
						var oCommandDetails = getDataFieldForActionCommandDetails(oDataField);
						if (!isEmptyObject(oCommandDetails)) {
							mAnnotatedActionsWithCommand[oCommandDetails.id] = oCommandDetails;
						}
						break;
					case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
						var oCommandDetails = getDataFieldForIBNCommandDetails(oDataField);
						if (!isEmptyObject(oCommandDetails)) {
							mOutboundActionsWithCommand[oCommandDetails.id] = oCommandDetails;
						}
						break;
					default:
						break;
				}
			});

			return {
				commandExecution: deepExtend(oPageLevelStandardActions, mCustomActionsWithCommand, mAnnotatedActionsWithCommand, mOutboundActionsWithCommand),
				extensionActions: aExtensionActionsWithoutLogicalAction
			};
		}

		return {
			streamEnabledAssociatedEntites: fnGetStream(),
			sections: fnGetSections(),
			breadCrumb: oComponentUtils.getBreadCrumbInfo(),
			isSelflinkRequired: true,
			isIndicatorRequired: true,
			isSemanticallyConnected: false,
			targetEntities: mTargetEntities,
			pageLevelActions: fnGetPageLevelActions()
		};
	}

	return {
		getTemplateSpecificParameters: fnGetTemplateSpecificParameters
	};
});
