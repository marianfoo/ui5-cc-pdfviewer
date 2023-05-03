sap.ui.define([
    "sap/ui/layout/DynamicSideContent",
    "sap/suite/ui/generic/template/js/StableIdHelper",
    "sap/suite/ui/generic/template/genericUtilities/controlHelper",
    "sap/suite/ui/generic/template/lib/info/CommonInfo",
    "sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function (DynamicSideContent, StableIdHelper, controlHelper, CommonInfo, FeLogger) {
    "use strict";

    // var sClassName = "lib.info.SubSectionInfo";
	// var oLogger = new FeLogger(sClassName).getLogger();

    // Create instance of LoadingBehavior Object
    function getSubSectionLoadingBehavior(bLayoutFinished, bEnteredToViewPort, bStateApplied, bRebindCompleted, activeHandler, inActiveHandler) {
        var loadingBehavior = {
            bWaitForViewportEnter: bEnteredToViewPort,
            waitFor: {
                bLayoutFinished: bLayoutFinished,
                bStateApplied: bStateApplied,
                bRebindCompleted: bRebindCompleted
            },
            activeHandler: activeHandler || function (oSubSection, oSubSectionInfo) {
                var aBlocks = getAllSubSectionBlocks(oSubSection);
                var bForceRefresh;
                if (aBlocks.length && aBlocks[0].getBindingContext() === null) {
                    fnChangeBindingContext(undefined, oSubSection);
                    // Refresh call made because of SubSection getting active for the first time 
                    // should do a ForceFull refresh.  
                    bForceRefresh = true;
                }

                // When View Lazy loading is enabled SubSection is rendered but the blocks under
                // the subsection is not. So when the inActiveHandler set the binding context to 
                // null there are no blocks & nothing happens there. When the SubSection
                // enters ViewPort, Block is rendered & binding context is propagated from the 
                // parent control (SubSection in this case). This means that binding context will
                // be non null value & subsequently will skip the refresh call in the active handler.
                // Therefore the Refresh handling is done based on the RefreshRequired of SubSectionInfo
                // and not based on the BindingContext of the Block
                if (bForceRefresh || oSubSectionInfo.getRefreshRequired()) {
                    oSubSectionInfo.refresh(null, true, true);
                }
            },
            inActiveHandler: inActiveHandler || function (oSubSection, oSubSectionInfo) {
                fnChangeBindingContext(null, oSubSection);
            }
        };
        return loadingBehavior;
    }

    // Helper method to find all the Blocks in a given SubSection
    function getAllSubSectionBlocks(oSubSection) {
        var aAllBlocks = oSubSection.getBlocks().concat(oSubSection.getMoreBlocks()).concat(oSubSection.getActions());
        return aAllBlocks;
    }

    // Helper method to change the BindingContext
    function fnChangeBindingContext(vTarget, oSubSection) {
        var aAllBlocks = getAllSubSectionBlocks(oSubSection);
        // Setting and resetting binding context at subSection level is not good, because subsections appear in the
        // tab bar of object page. Thus if, let's say subSection is hidden and we don't set proper binding context
        // it will still be visible in the tab-bar. Thus setting binding context on blocks of subsection is good.
        aAllBlocks.forEach(function (oBlock) {
            oBlock.setBindingContext(vTarget);
        });
    }

    // Class Definition for SubSectionInfo object
    function SubSectionInfo(oSubSectionSettings, oController, oTemplateUtils, oInfoObjectHandler) {
        var sId; // StableId of the control associated with this info object. Calculated first time fnGetId is called
        var oSubSection; // Associated SubSection control. Consumer could use setControl method to set the control to the info object
        var oSideContentInfo; // SideContentInfo object in case side content is available for the associated SubSection. Object is initialized based on the sideContentSettings in SubSectionSettings
        var oLoadingStrategy; // Loading strategy associated with the SubSection
        var bRefreshRequired = true; // SubSection can have contents which requires Refresh to be executed, therefore it is initialized as true
        var oCommonInfo = new CommonInfo(["subSection", "subSectionNotWaitingForViewPort"], fnInitializeBasedOnControl);

        /*
        * SubSection information object initialization code which is independent of
        * the control instance and could be done based on the SubSectionSettings created
        * at the time of templateSpecificPreparationHelper
        */
        function fnInitialize() {
            oCommonInfo.pushCategory("subSection", true);

            if (oSubSectionSettings.sideContentSettings) {
                oSideContentInfo = oTemplateUtils.oSideContentHandler.initSideContentInfoObject(oSubSectionSettings.sideContentSettings);
            }

            var aAllBlockSettings = oSubSectionSettings.blocks || [];
            aAllBlockSettings = aAllBlockSettings.concat(oSubSectionSettings.moreBlocks || []);

            // initialize information objects for blocks based manifest settings
            aAllBlockSettings.forEach(function (oBlockSettings) {
                if (oBlockSettings.tableSettings) {
                    oInfoObjectHandler.initializeSmartTableInfoObject(oBlockSettings);
                } else if (oBlockSettings.chartSettings) {
                    oInfoObjectHandler.initializeSmartChartInfoObject(oBlockSettings);
                }
            });

            // Initialize LoadingStrategy
            var sLoadingStrategy = oSubSectionSettings.loadingStrategy;
            switch (sLoadingStrategy) {
                case "lazyLoadingAfterHeader":
                    // In this strategy the criteria of lazyLoading is only Header data. We don't see the 
                    // visibility change of subsection, as soon as header data is received, we activate 
                    // section binding.
                    oLoadingStrategy = getSubSectionLoadingBehavior(true, true, false, true);
                    break;
                case "activateAfterHeaderDataReceived":
                    oLoadingStrategy = getSubSectionLoadingBehavior(true, false, false, true);
                    break;
                case "activateWithBindingChange":
                    // In is the last strategy, where we not at all lazyLoad subsection. We activate it as 
                    // soon as binding context changes
                    oLoadingStrategy = getSubSectionLoadingBehavior(false, false, false, true);
                    break;
                case "reuseComponent":
                    oLoadingStrategy = getSubSectionLoadingBehavior(true, true, false, true, fnReuseComponentActiveHandler, fnReuseComponentInactiveHandler);
                    break;
                case "lazyLoading":
                    oLoadingStrategy = getSubSectionLoadingBehavior(false, true, false, true);
                    break;
                default:
                    oLoadingStrategy = getSubSectionLoadingBehavior(false, false, false, false, Function.prototype, Function.prototype);
                    break;
            }

            if (!oLoadingStrategy.bWaitForViewportEnter) {
                oCommonInfo.pushCategory("subSectionNotWaitingForViewPort", true);
            }
        }

        /**
         * Initialization code which has dependency with the control
         * @param {sap.ui.core.Control} oControl - Instance of the associated control
         */
        function fnInitializeBasedOnControl(oControl) {
            oSubSection = oControl;

            // In case SideContent is configured, set control to the SideContentInfo
            // object
            if (oSideContentInfo) {
                var aBlocks = oSubSection.getBlocks();
                if (aBlocks && aBlocks.length > 0 && aBlocks[0] instanceof DynamicSideContent ) {
                    oSideContentInfo.setControl(aBlocks[0]);
                }
            }

            // SubSection Blocks/MoreBlocks actually contain the SmartTable/SmartChart Control
            // They are not initialized here as these controls has its own initialization lifecycle
            // & therefore they need to be set to the information objects from their onInit handlers
            // Please have a look at onTableInit/onChartInit methods of the controller
        }

        /*
        * Active handler for reuse component inside subsection
        */
        function fnReuseComponentActiveHandler(oControl) {
            var oComponentContainer = oControl.getBlocks()[0];
            oTemplateUtils.oComponentUtils.onVisibilityChangeOfReuseComponent(true, oComponentContainer);
        }
    
        /*
        * InActive handler for reuse component inside subsection
        */
        function fnReuseComponentInactiveHandler(oControl) {
            var oComponentContainer = oControl.getBlocks()[0];
            oTemplateUtils.oComponentUtils.onVisibilityChangeOfReuseComponent(false, oComponentContainer);
        }

        /* 
        *  Refresh a given block. This only affects the smart tables in the block.
        *  Two scenarios for this function distinguished by parameter bForceRefresh:
        *  If the parameter is false the call is coming from the refreshBinding-method in the Component. In this scenario mRefreshInfos might be used to
        *  reduce the set of SmartTables which need to be refreshed.
        *  Moreover, in this scenario executing the side-effects will be included.
        *  If the parameter is true the call is coming from activating the block due to lazy loading.
        *  In this scenario mRefreshInfos is ignored and no side-effects will be executed.
        * 
        *  Method expects oBlock control to be provided as an argument which means could be called only after
        * control is initialized
        */
        function fnRefreshBlock(mRefreshInfos, bForceRefresh, bNoMessageRefresh, oBlock) {
            if (oBlock instanceof DynamicSideContent) {
                oBlock = oBlock.getMainContent()[0];
            } else if (!oBlock.getContent) { // dummy-blocks need not to be refreshed
                return;
            }

            oBlock.getContent().forEach(function (oContent) {
                if (controlHelper.isSmartTable(oContent)) {
                    if (bForceRefresh || mRefreshInfos[oContent.getEntitySet()]) {
                        bRefreshRequired = false;
                        if (oContent.isInitialised()) {
                            oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oContent).refresh(null, bNoMessageRefresh);
                        } else {
                            oContent.attachInitialise(oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oContent).refresh.bind(null, null, bNoMessageRefresh));
                        }

                        if (!bForceRefresh && oController.getOwnerComponent().getBindingContext()) {
                            oTemplateUtils.oServices.oApplicationController.executeSideEffects(oController.getOwnerComponent().getBindingContext(), [], [oContent.getTableBindingPath()]);
                        }
                    }
                }
            });
        }

        function fnRefresh(mRefreshInfos, bForceRefresh, bNoMessageRefresh) {
            oCommonInfo.getControlAsync().then(function () {
                var aAllBlocks = oSubSection.getBlocks().concat(oSubSection.getMoreBlocks()).concat(oSubSection.getActions());
                var fnMyRefreshBlock = fnRefreshBlock.bind(null, mRefreshInfos, bForceRefresh, bNoMessageRefresh);
                aAllBlocks.forEach(fnMyRefreshBlock);
            });
        }

        function fnGetId() {
            if (!sId) {
                var sLocalId;
                if (oSubSectionSettings.loadingStrategy === "reuseComponent" || oSubSectionSettings.extensionPointNamePrefix) {
                    // In case of SubSection is created using a reuse component or an extension facet id
                    // is precalculated and doesn't have to be assigned using the StableIdHelper. All 
                    // other cases StableIdHelper is the correct approach

                    // TODO: Logic needs to be moved to templateSpecificHelper and in Sections.fragment.xml
                    // and EmbeddedComponentSubSection.fragment.xml & in this place should use the Id property
                    // directly. This would ensure the logic is consolidated in one place
                    sLocalId = oSubSectionSettings.id;
                } else {
                    sLocalId = StableIdHelper.getStableId({
                        type: "ObjectPage",
                        subType: "SubSection",
                        sFacet: oSubSectionSettings.additionalData.facetId
                    });
                }

                sId = oController.getView().createId(sLocalId);
            }
            return sId;
        }
        
        function fnGetLoadingStrategy() {
            return oLoadingStrategy;
        }

        fnInitialize();

        return {
            restrictedObject: {
                setControl: oCommonInfo.setControl,
                getControlAsync: oCommonInfo.getControlAsync,
                getId: fnGetId,
                refresh: fnRefresh,
                /**
                 * Returns the LoadingStrategy object. Default loading strategy is "lazyLoading". Method
                 * depends on the loading strategy which is initialized by the 
                 * templateSpecificPreparationHelper & doesn't  use the custom data of the control. This
                 * enables the fnGetLoadingStrategy return the relevant strategy even if the control is
                 * not initialized
                 * @returns {Object} Returns the loading strategy
                 */
                getLoadingStrategy: fnGetLoadingStrategy,
                /**
                 * Method returns the SubSection settings object associated with this information 
                 * object
                 * @returns {Object} SubSection Settings object associated with the instance
                 */
                getSettings: function() { return oSubSectionSettings; },
                /**
                 * SubSectionInfo object refresh should be called to load the data in all cases based on different 
                 * children. In case of View Lazy Loading scenario the block gets initialized at a later stage which
                 * causes the active handler not to execute the refresh method. One could use this method to detect
                 * whether Refresh still needs to be called or not
                 * @returns {Object} Returns true in case SubSectionInfo Refresh method should be called
                 */
                getRefreshRequired: function() { return bRefreshRequired; }
            },
            getCategories: oCommonInfo.getCategories,
            pushCategory: function(sCategory) { return oCommonInfo.pushCategory(sCategory); },
            getSupportedCategories: oCommonInfo.getSupportedCategories,
            getPendingExecutions: oCommonInfo.getPendingExecutions,
            pushPendingExecutions: oCommonInfo.pushPendingExecutions
        };
    }

    return SubSectionInfo;
});