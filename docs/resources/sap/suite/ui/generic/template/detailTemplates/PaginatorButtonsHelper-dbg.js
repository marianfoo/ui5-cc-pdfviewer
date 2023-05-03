sap.ui.define(["sap/ui/base/Object", "sap/base/util/extend", "sap/suite/ui/generic/template/genericUtilities/controlHelper", "sap/suite/ui/generic/template/genericUtilities/oDataModelHelper", "sap/suite/ui/generic/template/genericUtilities/testableHelper"], function(BaseObject,
	extend, controlHelper, oDataModelHelper, testableHelper) {
	"use strict";

	var oTooltips = (function() {
		var oResource = sap.ui.getCore().getLibraryResourceBundle("sap.m");
		return {
			navDownTooltip: oResource.getText("FACETFILTER_NEXT"),
			navUpTooltip: oResource.getText("FACETFILTER_PREVIOUS")
		};
	})();

	function getMethods(oControllerBase, oController, oTemplateUtils, oViewProxy) {
		var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
		var oTemplatePrivateGlobalModel = oTemplateUtils.oComponentUtils.getTemplatePrivateGlobalModel();

		function computeAndSetVisibleParamsForNavigationBtns() {
			var oPaginatorInfo = oTemplateUtils.oComponentUtils.getPaginatorInfo();
			var bPaginatorAvailable = !!oPaginatorInfo && !oPaginatorInfo.suppressButtons && (!oControllerBase.fclInfo.isContainedInFCL || oTemplatePrivateGlobalModel.getProperty(
				"/generic/FCL/isVisuallyFullScreen"));
			var iLength = bPaginatorAvailable && oPaginatorInfo.objectPageNavigationContexts.length;
			var bNavDownEnabled = bPaginatorAvailable && (oPaginatorInfo.selectedRelativeIndex !== (iLength - 1));
			var bNavUpEnabled = bPaginatorAvailable && oPaginatorInfo.selectedRelativeIndex > 0;
			oTemplatePrivateModel.setProperty("/objectPage/navButtons/navUpEnabled", bNavUpEnabled);
			oTemplatePrivateModel.setProperty("/objectPage/navButtons/navDownEnabled", bNavDownEnabled);
		}

		function fnHandleNavigateToObject(oPaginatorInfo, index, oButton){
			var oContext = oPaginatorInfo.objectPageNavigationContexts[index];
			oPaginatorInfo.selectedRelativeIndex = index;
			if (oContext) {
				if (oButton){
					// if oButton is set it will have the focus and should keep it, unless it gets disabled (we have reached the end of the list).
					// If the button is disabled now, then the inverse button should get the focus (if it is enabled).
					// Otherwise perform the fallback logic.
					oTemplateUtils.oServices.oApplication.setNextFocus(function(oTopicsData, fnFallback){
						setTimeout(function(){
							if (!oButton.getEnabled()){
								var oHBox = oButton.getParent();
								var aButtons = oHBox.getItems();
								oButton = aButtons.find(function(oItem){
									return oItem.getEnabled();
								});
								if (!oButton){
									fnFallback();
									return;
								}
							}
							controlHelper.focusUI5Control(oButton);
						}, 0);
					});
				}
				oPaginatorInfo.paginate(oContext, oViewProxy);
			} else {
				oViewProxy.navigateUp();
			}	
		}

		function handleShowOtherObject(iStep, oButton) {
			var oPaginatorInfo = oTemplateUtils.oComponentUtils.getPaginatorInfo();
			if (oButton && oTemplateUtils.oComponentUtils.isDraftEnabled() && oTemplateUtils.oComponentUtils.getViewLevel() === 1) {
				oTemplateUtils.oCommonUtils.fnProcessDataLossOrDraftDiscardConfirmation(function() {
					fnHandleShowOtherObjectImpl(iStep, oPaginatorInfo, oButton);
				}, Function.prototype);
			} else {
				fnHandleShowOtherObjectImpl(iStep, oPaginatorInfo, oButton);
			}
		}

		function fnHandleShowOtherObjectImpl(iStep, oPaginatorInfo, oButton) {
			var oListBinding = oPaginatorInfo.listBinding;
			var iNextIdx = oPaginatorInfo.selectedRelativeIndex + iStep;
			var aAllContexts = oPaginatorInfo.objectPageNavigationContexts;
			var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
			var iCurrentIdx = oPaginatorInfo.selectedRelativeIndex;
			var oContext = oDataModelHelper.analyseContext(aAllContexts[iCurrentIdx]);
			var oEntitySet = aAllContexts[iCurrentIdx].getModel().getMetaModel().getODataEntitySet(oContext.entitySet);
			var oUpdateInfo = oEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"] && oEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"].Updatable;
			while (iNextIdx < aAllContexts.length && !oButton) {
				if (oUpdateInfo && oUpdateInfo.Path) {
					if (aAllContexts[iNextIdx].getModel().getProperty(oUpdateInfo.Path, aAllContexts[iNextIdx])) {
						break;
					}
					iNextIdx++;
					continue;
				}
			}
			if (aAllContexts && aAllContexts[iNextIdx]) {
				fnHandleNavigateToObject(oPaginatorInfo, iNextIdx, oButton);
			} else {
				var oFetchNewRecordsPromise = new Promise(function(fnResolve, fnReject) {
					var iTableGrowingIncrement = oPaginatorInfo.growingThreshold || Math.ceil(oListBinding.getLength() / 5);
					var iStartingPoint = aAllContexts ? aAllContexts.length : iNextIdx;
					var newEndIdx = iStartingPoint + iTableGrowingIncrement;
					var fetchAndUpdateRecords = function(mParameters) {
						// get new fetched contexts and do stuff
						var aNewAllContexts = mParameters.getSource().getContexts(0, newEndIdx);
						// filter the active contexts
						var aActiveContexts = oTemplateUtils.oCommonUtils.filterActiveContexts(aNewAllContexts);
						oPaginatorInfo.objectPageNavigationContexts = aActiveContexts;
						oListBinding.detachDataReceived(fetchAndUpdateRecords);
						// also.. navigate
						fnHandleNavigateToObject(oPaginatorInfo, iNextIdx, oButton);
						fnResolve();
					};
					oListBinding.attachDataReceived(fetchAndUpdateRecords);
					oListBinding.loadData(0, newEndIdx);
				});
				oBusyHelper.setBusy(oFetchNewRecordsPromise);
			}
		}

		function handleShowNextObject(oEvent) {
			fnDataLossOrDraftDiscardConfirmation(1, oEvent);
		}

		function handleShowPrevObject(oEvent) {
			fnDataLossOrDraftDiscardConfirmation(-1, oEvent);
		}

		function fnDataLossOrDraftDiscardConfirmation(iStep, oEvent) {
			var oButton = oEvent.getSource();
			oTemplateUtils.oServices.oDataLossHandler.performIfNoDataLoss(function() {
				handleShowOtherObject(iStep, oButton);
			}, Function.prototype, "LeavePage");
		}

		oTemplatePrivateModel.setProperty("/objectPage/navButtons", extend({
			navDownEnabled: false,
			navUpEnabled: false
		}, oTooltips));
		if (oControllerBase.fclInfo.isContainedInFCL) {
			var oFullscreenBinding = oTemplatePrivateGlobalModel.bindProperty("/generic/FCL/isVisuallyFullScreen");
			oFullscreenBinding.attachChange(computeAndSetVisibleParamsForNavigationBtns);
		}
		
		function fnSwitchToNextObject(){
			handleShowOtherObject(1);
		}

		return {
			computeAndSetVisibleParamsForNavigationBtns: computeAndSetVisibleParamsForNavigationBtns,
			handleShowNextObject: handleShowNextObject,
			handleShowPrevObject: handleShowPrevObject,
			switchToNextObject: fnSwitchToNextObject
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.detailTemplates.PaginatorButtonsHelper", {
		constructor: function(oControllerBase, oController, oTemplateUtils, oViewProxy) {
			extend(this, (testableHelper.testableStatic(getMethods, "PaginatorButtonsHelper"))(oControllerBase, oController,
				oTemplateUtils, oViewProxy));
		}
	});
});
