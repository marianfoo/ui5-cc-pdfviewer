/*
	Formatters used during templating for reuse components and during application startup.
*/
sap.ui.define(["sap/suite/ui/generic/template/extensionAPI/UIMode",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/js/AnnotationHelper"
], function(UIMode, extend, AnnotationHelper) {
	"use strict";

	var BINDING_FOR_ISACTIVE = "{_templPriv>/generic/isActive}";

	function getVisibleTerm(oReuseComponent){
		return "!${_templPriv>/generic/embeddedComponents/" + oReuseComponent.id + "/hidden}";
	}

	function getIsAreaVisibleBindingForSubsection(oReuseComponent, sSectionId, sSubSectionId){
		return "{= $" + BINDING_FOR_ISACTIVE + " && !!${_templPriv>/generic/embeddedComponents/" + 
			oReuseComponent.id + "/isInVisibleArea} && " + AnnotationHelper.getControlVisibleTerm(sSectionId) + " && " + 
			AnnotationHelper.getControlVisibleTerm(sSubSectionId) + " }";
	}

	function formatComponentSettings(oInterface, oEntitySet, oReuseComponent, oRoutingSpec, bAsSubSection, sSectionId, sSubSectionId)	{
		var oThisInterface = oInterface.getInterface(0),
			oMetaModel = oThisInterface.getModel(),
			oEntityType = oEntitySet.entityType ? oMetaModel.getODataEntityType(oEntitySet.entityType) : oRoutingSpec.oEntityType;
		var sNavigationProperty = oReuseComponent.binding;
		if (sNavigationProperty) {
			// from now on we need to set the entity set to the target
			var oAssociationEnd = oMetaModel.getODataAssociationSetEnd(oEntityType, sNavigationProperty);
			if (oAssociationEnd && oAssociationEnd.entitySet) {
				oEntitySet = oMetaModel.getODataEntitySet(oAssociationEnd.entitySet);
				// fix the type to the target type
				oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			}
		}
		var sSemanticObject = oEntitySet ? sap.ui.model.odata.AnnotationHelper.format(oThisInterface, oEntitySet["com.sap.vocabularies.Common.v1.SemanticObject"]) : oRoutingSpec.semanticObject;
		var	settings = {
			"uiMode": "{= ${ui>/createMode} ? '" +
			    UIMode.Create +
			    "' : ( ${ui>/editable} ? '" +
			    UIMode.Edit +
			    "' : '" +
			    UIMode.Display +
			    "') }", //Bind the UI mode to the component. For allowed states see com.sap.suite.ui.generic.template.externsionAPI.UIMode
			"semanticObject": sSemanticObject || "", // The semantic object is constant for this context
			"stIsAreaVisible": bAsSubSection ? getIsAreaVisibleBindingForSubsection(oReuseComponent, sSectionId, sSubSectionId) : BINDING_FOR_ISACTIVE
		};

		extend(settings, oReuseComponent.settings);
		var sValue = JSON.stringify(settings);
		sValue = sValue.replace(/\}/g, "\\}").replace(/\{/g, "\\{"); // check bindingparser.js escape function
		return sValue;
	}

	// oSectionId is an object that contains the id of the section hosting the reuse component either in property id or in property value
	// oSubSectionId is the id of the sub section hosting the reuse component
	function formatComponentSettingsSubSection(oInterface, oEntitySet, oReuseComponent, oRoutingSpec, sSectionId, sSubSectionId){
		return formatComponentSettings(oInterface, oEntitySet, oReuseComponent, oRoutingSpec, true, sSectionId, sSubSectionId);
	}
	formatComponentSettingsSubSection.requiresIContext = true;

	function formatComponentSettingsCanvas(oInterface, oEntitySet, oReuseComponent, oRoutingSpec){
		return formatComponentSettings(oInterface, oEntitySet, oReuseComponent, oRoutingSpec, false);
	}

	formatComponentSettingsCanvas.requiresIContext = true;

	function getFollowingComponentsForFacet(oFacet, mFacetsWithEmbeddedComponents, mEmbeddedComponents, sSectionId){
		var sPath = oFacet && (oFacet.ID && oFacet.RecordType === "com.sap.vocabularies.UI.v1.CollectionFacet") ? oFacet.ID.String : !oFacet.ID && oFacet.RecordType === "com.sap.vocabularies.UI.v1.ReferenceFacet" && oFacet.Target.AnnotationPath;
		var aEmbeddedComponents = (sPath && mFacetsWithEmbeddedComponents[sPath]) || [];
		var aRet = aEmbeddedComponents.map(function(sComponentKey){
			var oEmbeddedComponentMeta = mEmbeddedComponents[sComponentKey];
			oEmbeddedComponentMeta.sectionId = sSectionId;
			return oEmbeddedComponentMeta;
		});
		return aRet;
	}

	return {
		formatVisibleComponentSection: function(oReuseComponent){
			return "{= " + getVisibleTerm(oReuseComponent) + " }";
		},

		formatComponentSettingsSubSection: formatComponentSettingsSubSection,

		formatComponentSettingsCanvas: formatComponentSettingsCanvas,
		
		getFollowingComponentsForFacet: getFollowingComponentsForFacet
	};
}, /* bExport= */ true);
