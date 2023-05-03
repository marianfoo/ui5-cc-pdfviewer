/*
	This class contains all functions (formatters) used during templating for side content feature.
*/
sap.ui.define(["sap/suite/ui/generic/template/js/AnnotationHelper", "sap/suite/ui/generic/template/js/StableIdHelper"], function(AnnotationHelper, StableIdHelper) {
	"use strict";
	
	/* Returns the name of the side content extension point for the specified facet, if one is configured.
	   Otherwise returns a faulty value. */
	function getSideContentExtensionPoint(sEntitySet, sFacetId, oManifestExtend) {
		if (oManifestExtend) {
			var sExtensionPointSuffix = sEntitySet + "|" + sFacetId;
			if (oManifestExtend["BeforeMainContent|" + sExtensionPointSuffix]) {
				return "BeforeMainContent|" + sExtensionPointSuffix;
			} else if (oManifestExtend["AfterMainContent|" + sExtensionPointSuffix]) {
				return "AfterMainContent|" + sExtensionPointSuffix;
			}
		}
		return false;
	}
	
	/* Returns the value of the sideContentPosition property of the side content control for the specified facet */
	function getSideContentPosition(sEntitySet, oFacet, oManifestExtend) {
		var sExtensionPointSuffix = sEntitySet + "|" + AnnotationHelper.getStableIdPartFromFacet(oFacet);
		return (oManifestExtend["BeforeMainContent|" + sExtensionPointSuffix]) ? "Begin" : "End";
	}
	
	/* Returns the binding string for the text property of the side content action button */
	function formatTextForSideContentButton(sFacetId) {
		var sSideContentId = StableIdHelper.getStableId({
			type: "ObjectPageSection",
			subType: "DynamicSideContent",
			sFacet: sFacetId
		});
		return "{parts: [{value: '" + sSideContentId + "'}, {path:'_templPriv>/generic/controlProperties/" + sSideContentId + "/visible'}], formatter: '._templateFormatters.sideContentActionButtonText'}";
	}
	
	/* Returns the press handler of the side content action button. Note that the press handler expects the id of the corresponding side content as first parameter. */
	function formatPressForSideContentButton(sFacetId){
		var sSideContentId = StableIdHelper.getStableId({
			type: "ObjectPageSection",
			subType: "DynamicSideContent",
			sFacet: sFacetId
		});	
		return "._templateEventHandlers.onToggleDynamicSideContent('" + sSideContentId + "')";
	}
	
	/* Returns the value for the equalSplit property of the side content */
	function getEqualSplitValue(sEntitySet, mFacet, oManifestExtend) {
		var sExtensionPointSuffix = sEntitySet + "|" + AnnotationHelper.getStableIdPartFromFacet(mFacet);
		var oExtension = oManifestExtend["BeforeMainContent|" + sExtensionPointSuffix] || oManifestExtend["AfterMainContent|" + sExtensionPointSuffix];
		return !!(oExtension && oExtension.equalSplit && oExtension.equalSplit === true);
	}
	
	/* Helper function that returns a binding string for the specified property (in the template private model) belonging to the SideContent 
	   Note that the template private model contains three properties for each side content control: 
	   - showSideContent: should side content be shown if there is enough space 
	   - visible: is side content currently be visible
	   - showBothContentsPossible: is there enough space to show side content and main content at the same time
	*/
	function buildSideContentExpression(mFacet, sProperty){
		var sSideContentId = StableIdHelper.getStableId({
			type: "ObjectPageSection",
			subType: "DynamicSideContent",
			sFacet: AnnotationHelper.getStableIdPartFromFacet(mFacet)
		});
		return "{_templPriv>/generic/controlProperties/" + sSideContentId + "/" + sProperty + "}";			
	}
	
	/* Returns the binding string for the showSideContent property of the side content control for the specified facet */ 
	function buildShowSideContentExpression(mFacet){
		return buildSideContentExpression(mFacet, "showSideContent");
	}
	
	/* Returns the binding string for the showMainContent property of the side content control for the specified facet */
	function buildShowMainContentExpression(mFacet){
		var sShowBothContentsPossibleExpression = buildSideContentExpression(mFacet, "showBothContentsPossible");
		var sVisibleExpression = buildSideContentExpression(mFacet, "visible");
		// main content is visible if there is enough space to show both contents or if side content is invisible
		return "{= $" + sShowBothContentsPossibleExpression + " || !$" + sVisibleExpression + " }";
	}		
	
	return {
		getSideContentExtensionPoint: getSideContentExtensionPoint,
		getSideContentPosition: getSideContentPosition,
		formatTextForSideContentButton: formatTextForSideContentButton,
		formatPressForSideContentButton: formatPressForSideContentButton,
		getEqualSplitValue: getEqualSplitValue,
		buildShowSideContentExpression: buildShowSideContentExpression,
		buildShowMainContentExpression: buildShowMainContentExpression
	};
}, /* bExport= */ true);