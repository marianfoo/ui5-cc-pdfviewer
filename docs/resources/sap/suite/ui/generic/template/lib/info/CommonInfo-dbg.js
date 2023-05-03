sap.ui.define([
    "sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function (FeLogger) {
    "use strict";

    var sClassName = "lib.info.CommonInfo";
	var oLogger = new FeLogger(sClassName).getLogger();

    // Class Definition for CommonInfo object
    function CommonInfo(aSupportedCategories, fnControlAssignedCallback) {
        var oAssociatedControl;
        var fnResolveControlInstantiated;
        var oControlInstantiatedPromise = new Promise(function (resolve) {
            fnResolveControlInstantiated = resolve;
        });

        var aCategories = [];
        var aPendingExecutions = [];

        function fnSetControl(oControl) {
            if (!oControl || oAssociatedControl) {
                // An instance of the control is not passed or it is already initialized
                // nothing has to be done in this method & can just skip the call
                return;
            }
            oAssociatedControl = oControl;
            (fnControlAssignedCallback || Function.prototype)(oAssociatedControl);
            // Resolve Control instantiated promise. External consumers or inside
            // logic could run the control dependent logic on this resolution
            fnResolveControlInstantiated(oAssociatedControl);
        }

        function fnGetControlPromise() {
            return oControlInstantiatedPromise;
        }

        function fnPushCategory(sCategory, bSkipSupportedCategoryCheck) {
            if (!bSkipSupportedCategoryCheck && aSupportedCategories.indexOf(sCategory) < 0){
                oLogger.error("InfoObject does not support category '" + sCategory + "'");
                return;
            }
            
            if (aCategories.indexOf(sCategory) < 0) {
                aCategories.push(sCategory);
            }
        }

        function fnPushPendingExecution(oAsyncExecution) {
            // There are no pending execution created for this
            // infoObject instance. Such case insert the pending execution
            if (aPendingExecutions.length === 0) {
                aPendingExecutions.push(oAsyncExecution);
                return;
            }

            // In case there are pending execution already we need to ensure the newly added 
            // execution is not duplicate. Execution is considered duplicate in cae the category
            // mentioned & the callback are same.
            var bExist = aPendingExecutions.some(function (oPendingExecution) {
                if (oPendingExecution.category === oAsyncExecution.category
                    && oPendingExecution.functionToExecute === oAsyncExecution.functionToExecute) {
                    return true;
                }
            });

            if (!bExist) {
                aPendingExecutions.push(oAsyncExecution);
            }
        }

        return {
            /**
             * Method takes the control instance and associate with the information object. 
             * Control needs to be assigned to the information object using the setControl 
             * method & always after creation of the info object. Once setControl method is
             * executed successfully, promise returned by getControlAsync is resolved
             * @param {Object} oControl - Instance of the control which needs to assigned to this
             * information object.
             * @returns {void}
             */
            setControl: fnSetControl,
            /** 
             * Method returns a promise which will be resolved once the control is set to information 
             * object. As the info object supports lazy initialization of the control, a promise is 
             * returned which will be resolved as soon as the control is assigned
             * @returns {Promise}
             */
            getControlAsync: fnGetControlPromise,
            /**
             * Returns array of categories which are relevant for this information object. 
             * InfoObjectHandler uses this categories while filtering for execution of callback
             * method for specific category. Most of the specific categories are initialized while 
             * creating the information object. Framework also support consumers to add supported 
             * category to an information object
             * @returns {Array} Array of associated categories for this instance of information object
             */
            getCategories: function() { return aCategories; },
            /**
             * Returns all the categories which could be supported by this information object. 
             * Categories which are not in this array could not be added to this information object
             * @returns {Array} Array of all valid categories which could be supported by this type 
             * of information object 
             */
            getSupportedCategories: function() { return aSupportedCategories; },
            /**
             * 
             * Returns all the executions which were queued because an 
             * execution was requested when a supported category was not pushed in to the categories
             * for this instance. It could happen that this category gets assigned in a Lazy manner to
             * this object & execution which was requested in the past needs to be executed as soon as
             * this happen.
             * @returns {Array} Array of objects which contain the category & callback method as property
             */
            getPendingExecutions: function() { return aPendingExecutions; },
            /**
             * Push an execution to the info object as the category is not yet added to the info object 
             * as relevant. Execution will be triggered only if the category is pushed as a relevant 
             * category
             * @returns {void}
             */
            pushPendingExecutions: fnPushPendingExecution,
            /**
             * Push a supported category as a relevant category for this instance of information 
             * object. Execution will be triggered only if the category is pushed as a relevant 
             * category
             * @returns {void}
             */
            pushCategory: fnPushCategory
        };
    }

    return CommonInfo;
});