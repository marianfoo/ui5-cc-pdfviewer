sap.ui.define([
    "sap/ui/layout/library",
    "sap/suite/ui/generic/template/lib/info/CommonInfo"
], function (LayoutLibrary, CommonInfo) {
    "use strict";

    var SideContentVisibility = LayoutLibrary.SideContentVisibility;

    // Class Definition for SideContentInfo object
    function SideContentInfo(oSideContentSettings, fnStateChanged, oController, oTemplateUtils, oInfoObjectHandler) {
        var sId; // StableId of the control associated with this info object. Calculated first time fnGetId is called
        var oSideContent; // Associated SideContent control. Consumer could use setControl method to set control to the info object
        var sSideContentId; // Local Id of the control
        var oTemplatePrivateModel; // Reference to TemplatePrivateModel 
        var oCommonInfo = new CommonInfo(["sideContent"], fnInitializeBasedOnControl);

        var fnSetShowBothContentsPossible, fnAdaptToBreakPointImpl, fnGetShowSideContent, fnSetShowSideContent, fnSetVisible;

        function fnInitialize() {
            oCommonInfo.pushCategory("sideContent", true);
            oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();

            // Initialization which could be done once control is created
            sSideContentId = oSideContentSettings.id;

            // We introduce an object in the template private model reflecting the state of oSideContent. 
            // This will contain three properties, which are used in property bindings in XML.
            // See document of function buildSideContentExpression in 
            // sap.suite.ui.generic.template.ObjectPage.annotationHelpers.AnnotationHelperSideContent 
            // for the properties that are held in this object.
            var sModelPath = "/generic/controlProperties/" + sSideContentId; // path to this object

            // Prepare the object
            oTemplatePrivateModel.setProperty(sModelPath, {});

            // Functions that update properties showBothContentsPossible and visible in the template private model
            fnSetShowBothContentsPossible = oTemplatePrivateModel.setProperty.bind(oTemplatePrivateModel,
                sModelPath + "/showBothContentsPossible");
            fnSetVisible = oTemplatePrivateModel.setProperty.bind(oTemplatePrivateModel, sModelPath + "/visible");

            // Define setter and getter methods for the property showSideContent showSideContent in the template private 
            // model. These functions are added to the info object of the side content. This is needed for getCurrentState 
            // resp. applyState (see below).
            var sShowSideContentPropertyPath = sModelPath + "/showSideContent";
            fnGetShowSideContent = oTemplatePrivateModel.getProperty.bind(oTemplatePrivateModel, sShowSideContentPropertyPath);
            fnSetShowSideContent = oTemplatePrivateModel.setProperty.bind(oTemplatePrivateModel, sShowSideContentPropertyPath);
        }

        /**
         * Initialization code which has dependency with the control
         * @param {sap.ui.core.Control} oControl - Instance of the associated control
         */
        function fnInitializeBasedOnControl(oControl) {
            oSideContent = oControl;

            // First we check for the configuration of oSideContent, regarding the possibility to 
            // show both contents. We currently assume that this is static. Therefore, we read it only once.
            var oSideContentVisibility = oSideContent.getSideContentVisibility();

            // Ensure that property showBothContentsPossible is always up to date. Therefore, function 
            // adaptToBreakPoint is added to the info object of the side content.
            // It will be called whenever the breakpointChanged event of the side content is triggered.
            switch (oSideContentVisibility) {
                case SideContentVisibility.AlwaysShow:
                    fnAdaptToBreakPointImpl = Function.prototype; // no need to adapt
                    fnSetShowBothContentsPossible(true); // initialize
                    break;
                case SideContentVisibility.NeverShow:
                    fnAdaptToBreakPointImpl = Function.prototype; // no need to adapt
                    fnSetShowBothContentsPossible(false); // initialize
                    break;
                default: // if none of the above edge cases applies we have to prepare method oSideContentInfoObject.adaptToBreakPoint a bit more specific
                    var mBreakpointsWithBothContentsPossible = Object.create(null); // maps all breakpoints for which main content and side content may be visible at the same time.
                    mBreakpointsWithBothContentsPossible.XL = true;
                    mBreakpointsWithBothContentsPossible.L = oSideContentVisibility !== SideContentVisibility.ShowAboveL;
                    mBreakpointsWithBothContentsPossible.M = oSideContentVisibility === SideContentVisibility.ShowAboveS;
                    mBreakpointsWithBothContentsPossible.S = false;
                    fnAdaptToBreakPointImpl = function () { // prepare to adapt
                        // keep track on the automatic visibility changes of the side content on resize
                        fnSetVisible(oSideContent.isSideContentVisible());
                        // adapt the showBothContentsPossible property in the template private model
                        var sCurrentBreakpoint = oSideContent.getCurrentBreakpoint();
                        fnSetShowBothContentsPossible(mBreakpointsWithBothContentsPossible[sCurrentBreakpoint]);
                    };

                    oSideContent.addEventDelegate({ // initialize. According to BCP 1980349967 this must be done in onAfterRendering of the Side content
                        onAfterRendering: fnAdaptToBreakPointImpl
                    });
            }

            // Initializations
            fnSetShowSideContent(false);
        }

        function fnGetId() {
            if (!sId) {
                sId = oController.getView().createId(sSideContentId);
            }
            return sId;
        }

        function fnToggleVisibility() {
            // the task is to toggle the visible property
            var bNewVisibility = !oSideContent.isSideContentVisible();
            fnSetVisible(bNewVisibility);
            // actually the showSideContent property is what really triggers an adaptation of the visibility of the side content
            fnSetShowSideContent(bNewVisibility);
            fnStateChanged(); // actively changing the visibility of the side content should be considered as a state change of the page
        }

        function fnAdaptToBreakPoint() {
            if (fnAdaptToBreakPointImpl) {
                fnAdaptToBreakPointImpl();
            }
        }

        fnInitialize();

        return {
            restrictedObject: {
                setControl: oCommonInfo.setControl,
                getControlAsync: oCommonInfo.getControlAsync,
                getId: fnGetId,
                getShowSideContent: fnGetShowSideContent,
                setShowSideContent: fnSetShowSideContent,
                toggleVisibility: fnToggleVisibility,
                adaptToBreakPoint: fnAdaptToBreakPoint
            },
            getCategories: oCommonInfo.getCategories,
            pushCategory: function(sCategory) { return oCommonInfo.pushCategory(sCategory); },
            getSupportedCategories: oCommonInfo.getSupportedCategories,
            getPendingExecutions: oCommonInfo.getPendingExecutions,
            pushPendingExecutions: oCommonInfo.pushPendingExecutions
        };
    }

    return SideContentInfo;
});