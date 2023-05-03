sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/base/util/isEmptyObject"
], function(BaseObject, Device, Filter, testableHelper, extend, StableIdHelper, isEmptyObject) {
	"use strict";
	/*
	 * This class is a helper class for the generic class XltipleViewsHandler. More, precisely an instance of
	 * this class is created in the constructor of that class in case, that the multiple table mode of the multiple views feature
	 * has been switched on.
	 * The mode can be switched on and configured via the quickVariantSelectionX.variants section in the manifest.
	 * You can have either a SmartTable or a SmartChart per a tab.
	 * We check under the corresponding SelectionPresentationVariant/PresentationVariant/Vizualizations or PresentationVariant/Vizualizations the first entry in the collection.
	 *  If it is a UI.LineItem then a corresponding SmartTable will be generated. If it is a UI.Chart then a SmartChart is displayed.
	 */

	// This function performs an analysis on a filterable vFilter.
	// Thereby, a filterable is either an instance of Filter or an array of filterables.
	// fnHandlerForNonMultiFilters is a function that receives an instance of Filter, which is not a multi filter and returns
	// either an instance of Filter or null.
	// This function returns a filterable (or null) by applying fnHandlerForNonMultiFilters recursvely to all non-multi filters contained in vFilter.
	// Thereby, all non-multi filters for which fnHandlerForNonMultiFilters returns null are eliminated.
	// All other non-multi filters are replaced by their image under fnHandlerForNonMultiFilters.
	// In particular: When fnHandlerForNonMultiFilters returns null for all these non-multi filters, then this function returns
	// an empty array (when vFilter was an array) resp. null (when vFilter was an instance of Filter).
	// If fnHandlerForNonMultiFilters acts as identity function on all non-multi filters recursively contained in vFilter then this function acts as identity on vFilter.
	function fnHandleUnapplicableFilters(vFilter, fnHandlerForNonMultiFilters){
		// first handle the case that vFilter is an array of filterables
		if (Array.isArray(vFilter)){
			var bOriginalOk = true; // remains true as long as no entry of vFilter has been identified which needs to be modified by this function
			var aAlternativeFilters; // is used as soon as one entry in vFilter needs to be modified
			for (var i = 0; i < vFilter.length; i++){
				var oFilter = fnHandleUnapplicableFilters(vFilter[i], fnHandlerForNonMultiFilters);
				if (bOriginalOk){ // up to index i-1 no need for modofication was found
					if (oFilter === vFilter[i]){ // index i needs not to be modified, too
						continue;
					}
					bOriginalOk = false; // index i is the first one which shows a need for modification
					aAlternativeFilters = vFilter.slice(0, i); // create a copy which contains the first i-1 entries
				}
				if (oFilter){ // when this point is reached a modofication has been found -> add oFilter to aAlternativeFilters if applicable
					aAlternativeFilters.push(oFilter);
				}
			}
			return bOriginalOk ? vFilter : aAlternativeFilters; // if no modification is needed return the original, otherwise the copy
		}
		// if this point is reached vFilter is an instance of Filter
		if (vFilter.aFilters){ // if vFilter is a multiple filter perform a recursive analysis of the contained filters
			var aNewFilters = fnHandleUnapplicableFilters(vFilter.aFilters, fnHandlerForNonMultiFilters);
			if (aNewFilters === vFilter.aFilters){ // if nothing is modified return the original filter
				return vFilter;
			}
			if (aNewFilters.length === 0){ // all filters have been removed -> return null
				return null;
			}
			if (aNewFilters.length === 1){ // only one filter is left -> this filter can replace the original filter
				return aNewFilters[0];
			}
			return new Filter({ // return a new multi filter with the same operator and the new ingredients
				filters: aNewFilters,
				and: vFilter.bAnd
			});
		}
		return fnHandlerForNonMultiFilters(vFilter); // non-multi filters are directly handled by fnHandlerForNonMultiFilters
	}
	// oController is the controller of the enclosing ListReport
	// oTemplateUtils are the template utils as passed to the controller implementation
	// oConfiguration contains all the configuration information
	function getMethods(oController, oTemplateUtils, oConfiguration) {
		// initialized in fnInit
		var mSwitchingKeyToViewMeta;
		var oPreliminaryState;
		var fnResolveInitializationPromise;
		var oInitializationPromise = new Promise(function(resolve){
			fnResolveInitializationPromise = resolve;
		});
		var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
		var sPathInModel = oConfiguration.pathInTemplatePrivateModel + "/implementingHelper";
		var sIgnoredFiltersPath = sPathInModel + "/ignoredFilters";
		oTemplatePrivateModel.setProperty(sPathInModel, {ignoredFilters: []});

		var sMainEntitySet = oController.getOwnerComponent().getEntitySet();
		var oMainEntityType = oTemplateUtils.oCommonUtils.getMetaModelEntityType(sMainEntitySet);

		function fnGetDefaultShowCounts(){
			var sFirstEntitySet;
			for (var sSwitchingKey in mSwitchingKeyToViewMeta) {
				var oViewMeta = mSwitchingKeyToViewMeta[sSwitchingKey];
				/* getEntitySet should not be a method of PresentationControlHandler. For more details, refer to the comment mentioned before the 
				   method's definition in the class */
				var sEntitySet = oViewMeta.presentationControlHandler.getEntitySet();
				if (sFirstEntitySet && sFirstEntitySet !== sEntitySet) {
					// for different entity set showcount should be true
					return true;
				}
				sFirstEntitySet = sEntitySet;
			}
			return false;
		}

		function fnGetFiltersAdaptedFromItem(aFilters, oViewMeta, aFiltersFromSmartTable, bForCount){
			//	If bForCounts is true ignore the filters coming from the table settings,
			// since the counts should not be influenced by these filters, which are located hierarchically below the counts
			if (aFiltersFromSmartTable && bForCount) {
				fnRemoveTableSettingsFromFilters(aFilters, aFiltersFromSmartTable);
			}
			var oSmartFilterBar = oConfiguration.smartFilterBar;
			if (!oSmartFilterBar) {
				return aFilters;
			}
			var aSmartFilterBarFilters = oSmartFilterBar.getFilters();

			if (aSmartFilterBarFilters.length === 0) {
				if (!bForCount) {
					oTemplatePrivateModel.setProperty(sIgnoredFiltersPath, []);
					// storing all the ignored filters of selected tab
					oViewMeta.implementingHelperAttributes.ignoredLabels = [];
				}
				return aFilters;
			}

			aSmartFilterBarFilters = fnCleanupIrrelevantFilters(oViewMeta, aSmartFilterBarFilters, !bForCount);

			return aSmartFilterBarFilters.concat(aFilters);
		}

		/*
		 * returns the property name of the path
		 * the path can be a simple one like 'adress' or contain navigation properties like 'adress/street'
		 */
		function getPropertyName(sPath) {
			var aParts, sPropertyName;
			if (sPath.indexOf("/") !== -1) { // sPath contains at least one navigation property
				aParts = sPath.split("/");
				sPropertyName = aParts.pop(); // the last one will be the property name
			} else {
				sPropertyName = sPath;
			}
			return sPropertyName;
		}

		// This function gets the array of filters coming from the filterbar. It returns a possibly reduced array of filters where all filters applicable to properties not defined for the
		// tab represented by oViewMeta will be removed.
		// Moreover, if bUpdateIgnoredFilters is truthy, the information about the ignored filters in oViewMeta and in the template private model (model path is sIgnoredFiltersPath) is updated.
		function fnCleanupIrrelevantFilters(oViewMeta, aSmartFilterBarFilters, bUpdateIgnoredFilters) {
			var oPresentationControlHandler = oViewMeta.presentationControlHandler;
			var sEntitySet = oPresentationControlHandler.getEntitySet();
			if (sEntitySet === sMainEntitySet){ // as all filters from the filterbar belong to the main entity set there are no ignored filters in this case
				if (bUpdateIgnoredFilters) {
					oTemplatePrivateModel.setProperty(sIgnoredFiltersPath, []);
					// storing all the ignored filters of selected tab
					oViewMeta.implementingHelperAttributes.ignoredLabels = [];
				}
				return aSmartFilterBarFilters;				
			}
			var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();
			var oEntityType = oTemplateUtils.oCommonUtils.getMetaModelEntityType(sEntitySet);
			var mIgnoredFilters = bUpdateIgnoredFilters && Object.create(null); // if the teamplate private model should be updated, create a map which collects all properties which are ignored

			// This function checks whether the given non-multi filter is valid for oEntityType. If this is the case it returns the filter itself, otherwise null.
			// In the second case the path of the filter will be added to mIgnoredFilters (if mIgnoredFilters is truthy).
			var fnHandlerForNonMultiFilters = function(oFilter) {
				var sPath = oFilter.sPath;
				var bFilterToBeUsed = false;

				var sFilterPropertyName = getPropertyName(sPath);
				var aEntityPropertiesForPath = getEntityTypePropertiesOfPath(sPath, oMetaModel, oEntityType);
				// check if the filter field is part of the entity type
				if (aEntityPropertiesForPath){
					aEntityPropertiesForPath.some(function(oProperty) {
						var oHiddenProperty;
						if (oProperty.name === sFilterPropertyName) { // property is available for the entity set, still it could be hidden
							// Additionally check whether the property is not marked as hidden
							var oHiddenProperty = oProperty["com.sap.vocabularies.UI.v1.Hidden"];
							bFilterToBeUsed = !oHiddenProperty || oHiddenProperty.Bool !== "true";
							return true; // no need to search further, since property was found
						}
						return false; // property not found yet -> go on searching
					});
				}
				if (bFilterToBeUsed) {
					return oFilter;
				}
				if (mIgnoredFilters) {
					mIgnoredFilters[sPath] = true;
				}
				return null;
			};

			// The next call will recursively analyze the given filters. Via callback fnHandlerForNonMultiFilters it analyzes the contained non-multi filters and fills mIgnoredFilters if requested.
			var aRet = fnHandleUnapplicableFilters(aSmartFilterBarFilters, fnHandlerForNonMultiFilters);
			if (mIgnoredFilters) { // update the ignored filters information in oViewMeta and template private model if requested
				var aIgnoredFilters = Object.keys(mIgnoredFilters);
				var aIgnoredLabels = aIgnoredFilters.map(function(sPath) {
					var sFilterPropertyName = getPropertyName(sPath);
					var aMainEntityPropertiesForPath = getEntityTypePropertiesOfPath(sPath, oMetaModel, oMainEntityType);
					var oMainProperty = aMainEntityPropertiesForPath && aMainEntityPropertiesForPath.find(function(oProperty){
						return oProperty.name === sFilterPropertyName;
					});
					var sRet = (oMainProperty && (oMainProperty["sap:label"] || (oMainProperty["com.sap.vocabularies.Common.v1.Label"] && oMainProperty["com.sap.vocabularies.Common.v1.Label"].String))) || sFilterPropertyName;
					return sRet;
				});
				oTemplatePrivateModel.setProperty(sIgnoredFiltersPath, aIgnoredLabels);
				// storing all the ignored filters of selected tab
				oViewMeta.implementingHelperAttributes.ignoredLabels = aIgnoredLabels;
			}
			return aRet;
		}
		/*
		 * function returns all entity set properties to the given path
		 * the path can be just a property name, then the properties of the current entity set are returned
		 * the path can be a navigation property like navProp1/navProp2/navProp3/.../property
		 */
		function getEntityTypePropertiesOfPath(sPath, oMetaModel, oEntityType) {
			var aParts = sPath.split("/");
			for (var i = 0; oEntityType && (i < aParts.length - 1); i++) { // loop over the navigation properties, the last element of the aParts is the property name so do not consider it
				var sNavProperty = aParts[i];
				var aNavProperties = oEntityType.navigationProperty;
				var bFound = false;
				for (var j in aNavProperties) {
					if (aNavProperties[j].name === sNavProperty) {
						bFound = true;
						break;
					}
				}
				var oAssociationEnd = bFound && oMetaModel.getODataAssociationEnd(oEntityType, sNavProperty);
				oEntityType = oAssociationEnd && oMetaModel.getODataEntityType(oAssociationEnd.type);
			}
			return oEntityType && oEntityType.property;
		}

		function fnRemoveTableSettingsFromFilters(aFiltersToBeRemovedFrom, aFiltersToBeRemoved) {
			for (var i in aFiltersToBeRemoved) {
				var oFilterToBeRemoved = aFiltersToBeRemoved[i];
				for (var j = aFiltersToBeRemovedFrom.length; j--; j >= 0) {
					if (JSON.stringify(aFiltersToBeRemovedFrom[j]) === JSON.stringify(oFilterToBeRemoved)) {
						aFiltersToBeRemovedFrom.splice(j, 1);
						break;
					}
				}
			}
		}

		function fnGetImplementingHelperAttributes(oViewMeta) {
			return {
				/* getEntitySet should not be a method of PresentationControlHandler. For more details, refer to the comment mentioned before the 
				   method's definition in the class */
				entityTypeProperty: oTemplateUtils.oCommonUtils.getMetaModelEntityType(oViewMeta.presentationControlHandler.getEntitySet()).property,
				dirtyState: 0,
				controlStateWrapper: oTemplateUtils.oCommonUtils.getControlStateWrapper(oController.byId(StableIdHelper.getStableId( {type: "ListReportTable", subType: "SmartTable", sQuickVariantKey: oViewMeta.switchingKey}))),
				searchFieldWrapper: oTemplateUtils.oCommonUtils.getControlStateWrapper(oController.byId(StableIdHelper.getStableId({type: "ListReportAction", subType: "SearchField", sQuickVariantKey: oViewMeta.switchingKey})))
			};
		}

		function fnInit(mSwitchingKeyToViewMetaTmp, fnRefreshOperation, getCurrentViewMeta) {
			mSwitchingKeyToViewMeta = mSwitchingKeyToViewMetaTmp;
			for (var sKey in mSwitchingKeyToViewMeta) {
				var oViewMeta = mSwitchingKeyToViewMeta[sKey];
				oViewMeta.implementingHelperAttributes = fnGetImplementingHelperAttributes(oViewMeta);
				oViewMeta.implementingHelperAttributes.controlStateWrapper.attachStateChanged(oConfiguration.appStateChange);
				oViewMeta.implementingHelperAttributes.searchFieldWrapper.attachStateChanged(oConfiguration.appStateChange);
			}
			if (oConfiguration.smartFilterBar) {
				// register for the go button trigger
				oConfiguration.smartFilterBar.attachSearch(function(oEvent) {
					// refresh everything
						fnRefreshOperation(3);
				});
			}

			fnResolveInitializationPromise();
		}

		function fnFormatMessageStrip(aIgnoredLabels, sSelectedKey) {
			// at the time of start up no item is selected
			if (!sSelectedKey) {
				return "";
			}
			var sFinalMessage = "";
			var sSelectedTabText = mSwitchingKeyToViewMeta[sSelectedKey].text;
			if (aIgnoredLabels && aIgnoredLabels.length > 0) {
				if ((Device.system.tablet || Device.system.phone) && !Device.system.desktop) {
					if (aIgnoredLabels.length > 1) {
						// TODO: move message text to model
						sFinalMessage = oTemplateUtils.oCommonUtils.getText("MESSAGE_MULTIPLE_VALUES_S_FORM", [aIgnoredLabels.join(", "), sSelectedTabText]);
					} else {
						sFinalMessage = oTemplateUtils.oCommonUtils.getText("MESSAGE_SINGLE_VALUE_S_FORM", [aIgnoredLabels[0], sSelectedTabText]);
					}
				} else if (aIgnoredLabels.length > 1) {
					sFinalMessage = oTemplateUtils.oCommonUtils.getText("MESSAGE_MULTIPLE_VALUES_L_FORM", [aIgnoredLabels.join(", "), sSelectedTabText]);
				} else {
					sFinalMessage = oTemplateUtils.oCommonUtils.getText("MESSAGE_SINGLE_VALUE_L_FORM", [aIgnoredLabels[0], sSelectedTabText]);
				}
			}
			return sFinalMessage;
		}

		function fnOnSelectedKeyChanged(sNewKey) {
			var oViewMeta = mSwitchingKeyToViewMeta[sNewKey];
			var aNewIgnoredFilters = oViewMeta.implementingHelperAttributes.ignoredLabels || [];
			oTemplatePrivateModel.setProperty(sIgnoredFiltersPath, aNewIgnoredFilters);
			oConfiguration.adaptPresentationControl();
		}

		function fnGetSelectedKeyAndRestoreFromIappState(oState) {
			oPreliminaryState = oState;
			oInitializationPromise.then(function(){
				var oTmpPresentationControlHandler, sVariantId;
				if (oState.controlStates) {
					// appState created with 1.90 or later
					for (var sKey in  mSwitchingKeyToViewMeta) {
						mSwitchingKeyToViewMeta[sKey].implementingHelperAttributes.controlStateWrapper.setState(oState.controlStates[mSwitchingKeyToViewMeta[sKey].presentationControlHandler.getId()]);
						mSwitchingKeyToViewMeta[sKey].implementingHelperAttributes.searchFieldWrapper.setState(oState.controlStates[mSwitchingKeyToViewMeta[sKey].implementingHelperAttributes.searchFieldWrapper.getLocalId()]);
					}
				} else {
					// old appStates (created before 1.90) don't contain "controlStates" (complete state of table/chart), but "tableVariantIds" (only the id of the variant)
					// for compatibility reasons, we need to be able to restore also these old states
					for (var sKey in  mSwitchingKeyToViewMeta) {
						oTmpPresentationControlHandler = mSwitchingKeyToViewMeta[sKey].presentationControlHandler;
						sVariantId = oState.tableVariantIds[oTmpPresentationControlHandler.getId()];
						if (sVariantId) {
							oTmpPresentationControlHandler.setCurrentVariantId(sVariantId);
						}
					}
				}
				fnOnSelectedKeyChanged(oState.selectedTab);
			});
			return oState.selectedTab;
		}


		function fnGetContentForIappState(sSelectedKey) {
			var sKey, oTmpPresentationControlHandler, mControlStates = Object.create(null);
			if (isEmptyObject(mSwitchingKeyToViewMeta)) {
				// In case MultipleTablesModeHelper is not initialized the preliminary state
				// which is applied is returned back
				return oPreliminaryState;
			}

			for (sKey in mSwitchingKeyToViewMeta) {
				oTmpPresentationControlHandler = mSwitchingKeyToViewMeta[sKey].presentationControlHandler;
				mControlStates[oTmpPresentationControlHandler.getId()] = mSwitchingKeyToViewMeta[sKey].implementingHelperAttributes.controlStateWrapper.getState();
				if (mSwitchingKeyToViewMeta[sKey].implementingHelperAttributes.searchFieldWrapper.getLocalId()) {
					mControlStates[mSwitchingKeyToViewMeta[sKey].implementingHelperAttributes.searchFieldWrapper.getLocalId()] = mSwitchingKeyToViewMeta[sKey].implementingHelperAttributes.searchFieldWrapper.getState();
				}
			}
			var oRet = {
				selectedTab: sSelectedKey,
				controlStates: mControlStates
			};

			return oRet;
		}

		// to be discussed - maybe also selected key should not belong to SFB
		// in multiple table mode, selected key belongs to SFB (i.e. should be stored and restored with SFB's variant, even with separated Variant Management
		function getSFBVariantContentStateWrapper(oSelectedKeyWrapper) {
			return oSelectedKeyWrapper;
		}
		
		// everything else is general content (i.e. stored and restored with iAppState, but not with SFB's variant)
		// parameter oSelectedKeyWrapper only needed, if selected key should not belong to SFB
		function getGeneralContentStateWrapper(oSelectedKeyWrapper) {
			return {
				getState: function() {
					var mControlStates = Object.create(null);
					Object.values(mSwitchingKeyToViewMeta).forEach(function(oViewMeta){
						mControlStates[oViewMeta.implementingHelperAttributes.controlStateWrapper.getLocalId()] = oViewMeta.implementingHelperAttributes.controlStateWrapper.getState(); 
						var oSearchFieldWrapper = oViewMeta.implementingHelperAttributes.searchFieldWrapper;
						if (oSearchFieldWrapper.getLocalId()){
							mControlStates[oSearchFieldWrapper.getLocalId()] = oSearchFieldWrapper.getState();
						}
					});
					return {
//						selectedKey: oSelectedKeyWrapper.getState(),
						controlStates: mControlStates
					};
				},
				setState: function(oState){
//					oSelectedKeyWrapper.setState(oState.selectedKey);
					if (oState.controlStates){
						Object.values(mSwitchingKeyToViewMeta).forEach(function(oViewMeta){
							oViewMeta.implementingHelperAttributes.controlStateWrapper.setState(oState.controlStates[oViewMeta.implementingHelperAttributes.controlStateWrapper.getLocalId()]);
							oViewMeta.implementingHelperAttributes.searchFieldWrapper.setState(oState.controlStates[oViewMeta.implementingHelperAttributes.searchFieldWrapper.getLocalId()]);
						});
					} else {
						// deal with old states
						// - for LR: mapped via legacyStateHandler?
						// - for OP: no multipleTablesMode possible
						// - only maybe relevant for ALP
					}
				},
				attachStateChanged: function(fnHandler){
//					oSelectedKeyWrapper.attachStateChanged(fnHandler);
					oInitializationPromise.then(function() {
						Object.values(mSwitchingKeyToViewMeta).forEach(function(oViewMeta){
							oViewMeta.implementingHelperAttributes.controlStateWrapper.attachStateChanged(fnHandler);
							oViewMeta.implementingHelperAttributes.searchFieldWrapper.attachStateChanged(fnHandler);
						});
					});
				}
			};
		}
		
		// iRequest: 1 = rebind table use the new filter values, 2 = refresh - makes a call, 3 = both
		function fnRefreshOperation(iRequest, vTabKey, mEntitySets, sSelectedKey, bIsTabKeyArray, bIsComponentVisible, fnRefreshOperationOnCurrentSmartControl) {

			var fnRefreshOperationOnKey = function(sKey){
				if (sKey === sSelectedKey && bIsComponentVisible){ // if the tab is currently visible perform the operation immediately
					fnRefreshOperationOnCurrentSmartControl(iRequest);
					return;
				}
				// If the tab is currently not visible refresh its dirty state
				var oViewMeta = mSwitchingKeyToViewMeta[sKey];
				if (oViewMeta.implementingHelperAttributes.dirtyState > 0 && oViewMeta.implementingHelperAttributes.dirtyState !== iRequest){
					oViewMeta.implementingHelperAttributes.dirtyState = 3;
				} else {
					oViewMeta.implementingHelperAttributes.dirtyState = iRequest;
				}
			};

			if (vTabKey){
				if (bIsTabKeyArray){
					vTabKey.forEach(fnRefreshOperationOnKey);
					return;
				}
				fnRefreshOperationOnKey(vTabKey);
				return;
			}
			for (var sKey in  mSwitchingKeyToViewMeta){
				/* getEntitySet should not be a method of PresentationControlHandler. For more details, refer to the comment mentioned before the 
				   method's definition in the class */
				if (!mEntitySets || mEntitySets[mSwitchingKeyToViewMeta[sKey].presentationControlHandler.getEntitySet()]){
					fnRefreshOperationOnKey(sKey);
				}
			}
		}


		function fnGetMode() {
			return "multi";
		}


		function fnGetRefreshMode(sNewKey) {
			var oViewMeta = mSwitchingKeyToViewMeta[sNewKey];
			var iMode = oViewMeta.implementingHelperAttributes.dirtyState;
			// we rely on the caller is now refreshing according to the dirty state
			oViewMeta.implementingHelperAttributes.dirtyState = 0;
			return iMode;
		}

		function fnSetControlVariant(sChartVariantId, sTableVariantId){
			for (var sKey in  mSwitchingKeyToViewMeta) {
				var oControlHandler = mSwitchingKeyToViewMeta[sKey].presentationControlHandler;
				oControlHandler.setCurrentTableVariantId(sTableVariantId);
				oControlHandler.setCurrentChartVariantId(sChartVariantId);
			}
		}
		
		// Find all smart controls that have identical entity set as the given one (but are different) and make sure that they will be refreshed.
		// Note that this implicitly assumes that these other controls are currently not visble (as oSmartControl is).
		function fnRefreshSiblingControls(oPresentationControlHandler){
			var sEntitySet = oPresentationControlHandler.getEntitySet();
			for (var sKey in  mSwitchingKeyToViewMeta) {
				var oViewMeta = mSwitchingKeyToViewMeta[sKey];
				var oControlHandler = oViewMeta.presentationControlHandler;
				if (oControlHandler !== oPresentationControlHandler && oControlHandler.getEntitySet() === sEntitySet && oViewMeta.implementingHelperAttributes.dirtyState < 2){
					oViewMeta.implementingHelperAttributes.dirtyState += 2;
				}
			}
		}

		var fnCleanupIrrelevantFilters = testableHelper.testable(fnCleanupIrrelevantFilters, "fnCleanupIrrelevantFilters");
		// public instance methods
		return {
			init: fnInit,
			getDefaultShowCounts: fnGetDefaultShowCounts,
			getFiltersAdaptedFromItem: fnGetFiltersAdaptedFromItem,
			formatMessageStrip: fnFormatMessageStrip,
			onSelectedKeyChanged: fnOnSelectedKeyChanged,
			getContentForIappState: fnGetContentForIappState,
			getSelectedKeyAndRestoreFromIappState: fnGetSelectedKeyAndRestoreFromIappState,
			getSFBVariantContentStateWrapper: getSFBVariantContentStateWrapper,
			getGeneralContentStateWrapper: getGeneralContentStateWrapper,
			refreshOperation: fnRefreshOperation,
			getMode: fnGetMode,
			getRefreshMode: fnGetRefreshMode,
			setControlVariant: fnSetControlVariant,
			refreshSiblingControls: fnRefreshSiblingControls
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.multipleViews.MultipleTablesModeHelper", {
		constructor: function(oController, oTemplateUtils, oConfiguration) {
			extend(this, getMethods(oController, oTemplateUtils, oConfiguration));
		}
	});
});
