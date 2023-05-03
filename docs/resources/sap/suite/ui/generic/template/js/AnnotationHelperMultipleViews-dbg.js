sap.ui.define(["sap/suite/ui/generic/template/js/AnnotationHelper"],
	function(GeneralAnnotationHelper) {
		"use strict";
		
	// formatter called at templating time to decide whether the 'Multiple views in Single Table' feature should be realized via a SegmentedButton or a Select.
	function useSegmentedButton(oManifestPart) {
		var iCount = 0;
		for (var i in (oManifestPart || {})) {
			if (oManifestPart.hasOwnProperty(i)) {
				++iCount;
				if (iCount > 3) {
					return false;
				}
			}
		}
		return true;
	}

	function useSegmentedButtonInOP(oFacet, oSections) {
		var oManifestPart = oSections && oSections.sections && oSections.sections[GeneralAnnotationHelper.getStableIdPartFromFacet(oFacet)];
		var oVariants = oManifestPart && oManifestPart.quickVariantSelection && oManifestPart.quickVariantSelection.variants;
		return useSegmentedButton(oVariants);
	}
	
	// Formatter called at templating time to create the runtime binding for the text on the items
	function getTextForItemImpl(sTemplate, oInterface, oQuickVariantSelection, oItemDef) {
		// in case of multi entity sets, counts have to be shown by default, otherwise only when requested explicitly
		var bDifferentEntitySets = oItemDef && oItemDef.entitySet;
		var bShowCountsForDifferentEntitySets = bDifferentEntitySets && oQuickVariantSelection.showCounts !== false;
		if (oQuickVariantSelection.showCounts || bShowCountsForDifferentEntitySets) {
			return "{path: '_templPriv>/" + sTemplate + "/multipleViews/items/" + oItemDef.key + "', formatter: '._templateFormatters.formatItemTextForMultipleView'}";
		}
		return GeneralAnnotationHelper.getIconTabFilterText(oInterface.getInterface(0), oItemDef);
	}	

	// Formatter called at templating time to create the runtime binding for the text on the items
	function getTextForItem(oInterface, oQuickVariantSelection, oItemDef) {
		return getTextForItemImpl("listReport", oInterface, oQuickVariantSelection, oItemDef);
	}
	getTextForItem.requiresIContext = true;

	function getTextForItemAnalyticalListPage(oInterface, oQuickVariantSelection, oItemDef) {
		return getTextForItemImpl("alp", oInterface, oQuickVariantSelection, oItemDef);
	}
	getTextForItemAnalyticalListPage.requiresIContext = true;

	function getTextForItemObjectPage(oInterface, oSections, oItemDef, oFacet, oTemp) {
		var sId = GeneralAnnotationHelper.getStableIdPartFromFacet(oFacet);
		var oCurrentSection = oSections[sId];
		var oQuickVariantSelection = oCurrentSection && oCurrentSection.quickVariantSelection;
		if (oQuickVariantSelection && oQuickVariantSelection.showCounts){
			return "{path: '_templPriv>/objectPage/multipleViews/" + sId + "/items/" + oItemDef.key + "', formatter: '._templateFormatters.formatItemTextForMultipleView'}";
		}
		return GeneralAnnotationHelper.getIconTabFilterText(oInterface, oItemDef, oTemp);
	}
	getTextForItemObjectPage.requiresIContext = true;
	
	function getVisibleForTableTabsImpl(sTemplate, oTabItem) {
		return "{= ${_templPriv>/" + sTemplate + "/multipleViews/mode} !== 'multi' || ${_templPriv>/" + sTemplate + "/multipleViews/selectedKey} === '" + (oTabItem && oTabItem.key) + "' }";
	}

	function getVisibleForTableTabs(oTabItem) {
		return getVisibleForTableTabsImpl("listReport", oTabItem);
	}

	function getVisibleForALPTableTabs(oTabItem) {
		return getVisibleForTableTabsImpl("alp", oTabItem);
	}

	function hasQuickVariantSelectionInObjectPageSection(oFacet, oSections) {
		var	oFacetSettings = oSections && oSections.sections && oSections.sections[GeneralAnnotationHelper.getStableIdPartFromFacet(oFacet)];
		return !!(oFacetSettings && oFacetSettings.quickVariantSelection);
	}

	function isCurrentSection(oItem, oFacet, oSections) {
		return oSections[GeneralAnnotationHelper.getStableIdPartFromFacet(oFacet)] === oItem;
	}

	function getSelectedKeyBinding(oFacet) {
		return "{_templPriv>/objectPage/multipleViews/" + GeneralAnnotationHelper.getStableIdPartFromFacet(oFacet) + "/selectedKey}";
	}

	return {
		useSegmentedButton: useSegmentedButton,
		useSegmentedButtonInOP: useSegmentedButtonInOP,
		getTextForItem: getTextForItem,
		getVisibleForTableTabs: getVisibleForTableTabs,
		getVisibleForALPTableTabs: getVisibleForALPTableTabs,
		hasQuickVariantSelectionInObjectPageSection: hasQuickVariantSelectionInObjectPageSection,
		isCurrentSection: isCurrentSection,
		getTextForItemObjectPage: getTextForItemObjectPage,
		getSelectedKeyBinding: getSelectedKeyBinding,
		getTextForItemAnalyticalListPage: getTextForItemAnalyticalListPage
	};
}, /* bExport= */ true);