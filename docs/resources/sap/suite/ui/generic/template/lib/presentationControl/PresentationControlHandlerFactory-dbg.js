sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/util/extend",
    "sap/suite/ui/generic/template/lib/presentationControl/SmartTableHandler",
    "sap/suite/ui/generic/template/lib/presentationControl/SmartListHandler",
    "sap/suite/ui/generic/template/lib/presentationControl/SmartChartHandler",
    "sap/suite/ui/generic/template/genericUtilities/controlHelper"
], function (BaseObject, extend, SmartTableHandler, SmartListHandler, SmartChartHandler, controlHelper) {
    "use strict";
    /* This factory class now primarily handles smart table or smart list or smart chart in the List Report but could also be extended to ALP and Object Page.
       It maintains the smart controls handlers in a map and when a handler is requested for any specific smart control, it checks whether the handler for the
       requested smart control already exists in the map and if it does, same is returned otherwise, a new handler instance for the requested smart control is
       created, put in the map (for future references) and returned to the caller.
       This class is instantiated per view i.e in the oServices object of TemplateAssembler class.
       The interface of each of the handlers is defined in the oDummyHandler object. */
    
    /* Dummy handler for not existing or not (yet) supported controls. Currently supported controls are:
       => SmartTable
       => SmartChart
       => SmartList 
    */
    var oDummyHandler = {
        // returns a binding object for a specific property (items or rows) of the smart control
        getBinding: Function.prototype,

        // returns a string representing binding path that is used during the binding of the smart control
        getBindingPath: Function.prototype,

        // returns an array containing the content of items aggregation
        getItems: Function.prototype,

        // returns an array of selected items contexts for each smart control.
        getSelectedContexts: function() {
            return [];
        },
        
        // used to get the currently shown contexts. Returns either a faulty value (not applicable/not possible) or an array of contexts. Note that the
        // returned array may itself contain some faulty members.
        getCurrentContexts: Function.prototype,

        // returns an array of the currently visible entities like columns of a smart table
        getVisibleProperties: Function.prototype,

        // returns the binding info for the given property (items or rows) which contains information about path, binding object, sorter, filter etc.
        getBindingInfo: Function.prototype,

        // returns the smart control's model
        getModel: Function.prototype,

        // returns the smart control's binding context
        getBindingContext: Function.prototype,

        // used to set the enablement of toolbar button on user's selection interaction on the smart control
        setEnabledToolbarButtons: Function.prototype,

        // used to set the enablement of footer button on user's selection interaction on the smart control
        setEnabledFooterButtons: Function.prototype,

        // used to set the variant of the smart control
        setCurrentVariantId: Function.prototype,

        // used to set the variant of the smart table
        setCurrentTableVariantId: Function.prototype,

        // used to set the variant of the smart table
        setCurrentChartVariantId: Function.prototype,

        // used to refresh the data of the smart control
        refresh: Function.prototype,

        /* used to trigger binding call on the inner control used in the smart control. The binding of a control represents the contexts
           which determines its overall content and presentation. Rebinding a control leads to an implicit call to refresh its data as well. */
        rebind: Function.prototype,

        // used to set a final sort order to the smart control in case of external navigation scenario
        applyNavigationSortOrder: Function.prototype
    };

    function getMethods(oController, oCommonUtils, oComponentUtils) {
        /* In case of multiple tables mode, the entitySet is actually derived from the manifest settings for the corresponding tab and in all other 
           cases, its derived from the component and thus getting the entity set from the control is just a detour as the same has been set by the 
           framework in the corresponding control's fragment.
           TODO: To adapt all the places wherein this method is being consumed and make sure to eliminate the dependency of getting the entity set from
           the control. 
           One such example is CreateWithDialogHandler. Instead of calling this method, fragments who calls the CreateWithDialog fragment has the information
           about its current control's entity set and it should be passed on the onPress event of the save button of the create with dialog popup which will
           remove the need to fetching the entity set from this method.
           Similary, all other instance should also get adapted accordingly */
        function getEntitySet(oControl) {
            return oControl.getEntitySet();
        }

        function getId(oControl) {
            return oControl.getId();
        }

        function fnGetBindingContext(oControl) {
            return oControl.getBindingContext();
        }

        // map of all handlers (for the given control) identified by local id
        var mImplementingHandlers = {};
        return {
            getPresentationControlHandler: function (oControl) {
                if (!oControl) {
                    return oDummyHandler;
                }
                
                var sId = oController.getView().getLocalId(oControl.getId());
                if (!mImplementingHandlers[sId]) {
                    var oHandler;
                    switch (true) {
                        case controlHelper.isSmartTable(oControl):
                            oHandler = new SmartTableHandler(oController, oCommonUtils, oComponentUtils, oControl);
                            break;
                        case controlHelper.isSmartChart(oControl):
                            oHandler = new SmartChartHandler(oController, oCommonUtils, oComponentUtils, oControl);
                            break;
                        case controlHelper.isSmartList(oControl):
                            oHandler = new SmartListHandler(oController, oCommonUtils, oComponentUtils, oControl);
                            break;
                        default:
                            return oDummyHandler;
                    }
                    oHandler.getEntitySet = getEntitySet.bind(null, oControl);
                    oHandler.getId = getId.bind(null, oControl);
                    oHandler.getBindingContext = fnGetBindingContext.bind(null, oControl);
                    mImplementingHandlers[sId] = oHandler;
                }
                return mImplementingHandlers[sId];
            }
        }; 
    }

    return BaseObject.extend("sap.suite.ui.generic.template.lib.presentationControl.PresentationControlHandlerFactory", {
        constructor: function (oController, oCommonUtils, oComponentUtils) {
            extend(this, getMethods(oController, oCommonUtils, oComponentUtils));
        }
    });
});