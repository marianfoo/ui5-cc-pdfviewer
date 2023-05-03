sap.ui.define([
    "sap/ui/base/Object", 
    "sap/base/util/extend",
    "sap/suite/ui/generic/template/lib/info/SubSectionInfo",
    "sap/suite/ui/generic/template/lib/info/SmartTableInfo",
    "sap/suite/ui/generic/template/lib/info/SmartChartInfo",
    "sap/suite/ui/generic/template/lib/info/LinkInfo",
    "sap/suite/ui/generic/template/lib/info/SideContentInfo",
    "sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function(BaseObject, extend, SubSectionInfo, SmartTableInfo, SmartChartInfo, LinkInfo, SideContentInfo, FeLogger) {
	"use strict";
    
    var sClassName = "lib.info.SubSectionInfo";
	var oLogger = new FeLogger(sClassName).getLogger();

    /**
     * Information Object (represented as info objects) contains the proprietary information 
     * defined by the corresponding template for a specific control. Info Object do support
     * different categories. Based on the instance configuration specific category could be
     * added to info object instance. Consumers can request execution of a specific operation
     * for a given category & Framework ensures all the info objects which has the mentioned 
     * category, operation is performed on all these instances. Class contain all the methods 
     * which needs to be used by consumers while working with info objects like getControlInformation, 
     * executeForAllInformationObjects. This class provides methods for initialization of the 
     * information objects which needs to be used for creating information object instances
     */
	function getMethods(oController, oTemplateUtils) {
		// map of all information objects for controls
		var mControlToInformation = {};

        function fnInitializeControlInformation (oInfoObject) {
            mControlToInformation[oInfoObject.restrictedObject.getId()] = oInfoObject;
            return oInfoObject.restrictedObject;
        }

        function fnGetControlInformation(sControlId) {
            var oInfoObject = mControlToInformation[sControlId];
            return oInfoObject && oInfoObject.restrictedObject;
        }

        function fnInitializeSubSectionInfoObject(oSubSectionSettings) {
            var oSubSectionInfo = new SubSectionInfo(oSubSectionSettings, oController, oTemplateUtils, oInfoObjectHandler);
            return fnInitializeControlInformation(oSubSectionInfo);
        }

        function fnInitializeSmartTableInfoObject(oTableSettings) {
            var oSmartTableInfoObject = new SmartTableInfo(oTableSettings, oController, oTemplateUtils, oInfoObjectHandler);
            if (oSmartTableInfoObject.restrictedObject.isSearchSupported()) {
                mControlToInformation[oSmartTableInfoObject.restrictedObject.getSearchFieldId()] = oSmartTableInfoObject;
            }
            return fnInitializeControlInformation(oSmartTableInfoObject);
        }

        function fnInitializeSmartChartInfoObject(oChartSettings){
            var oSmartChartInfoObject = new SmartChartInfo(oChartSettings, oController, oTemplateUtils, oInfoObjectHandler);
            return fnInitializeControlInformation(oSmartChartInfoObject);
        }

        function fnInitializeSideContentInfoObject(oSideContentSettings, fnStateChanged) {
            var oSideContentInfo = new SideContentInfo(oSideContentSettings, fnStateChanged, oController, oTemplateUtils, oInfoObjectHandler);
            return fnInitializeControlInformation(oSideContentInfo);
        }

        function fnInitializeLinkInfoObject(oLinkSettings) {
            var oLinkInfo = new LinkInfo(oLinkSettings, oController, oTemplateUtils, oInfoObjectHandler);
            return fnInitializeControlInformation(oLinkInfo);
        }

        function fnSetInformationWithControl(oControl) {
            var sControlId = oControl.getId();
            var oInfoObject = mControlToInformation[sControlId];
            if (oInfoObject) {
                oInfoObject.restrictedObject.setControl(oControl);
                return oInfoObject.restrictedObject;
            }
        }

        function fnPushCategory(sControlId, sCategory) {
            if (!sControlId) {
                oLogger.error("Caller needs to pass id of control for which which Category needs to be added");
                return;
            }

            var oInfoObject = mControlToInformation[sControlId];
            oInfoObject.pushCategory(sCategory);

            // Check for this control & newly added Category if the execution was requested early
            // then trigger the execution now. Situation could occur in case of View Lazy Loading
            // as the control could be created much later in lifecycle
            var aPendingExecutions = oInfoObject.getPendingExecutions();
            if (aPendingExecutions && aPendingExecutions.length > 0) {
                aPendingExecutions.forEach(function(oAsyncExecution, iIndex) {
                    if (oAsyncExecution.category === sCategory) {
                        oAsyncExecution.functionToExecute.call(null, oInfoObject.restrictedObject);
                        // As pending execution is completed, needs to remove from the pending queue
                        aPendingExecutions.splice(iIndex, 1);
                    }
                });
            }
        }
        
        function fnExecuteForAllInformationObjects(sCategory, fnExecute, bSkipAddingToPendingQueue) {
			for (var sControlId in mControlToInformation){
				var oInfoObject = mControlToInformation[sControlId];
				if (oInfoObject.getCategories().indexOf(sCategory) >= 0) {
                    fnExecute.call(null, oInfoObject.restrictedObject);
                    continue;
				}

                if (!bSkipAddingToPendingQueue) {
                    if (oInfoObject.getSupportedCategories().indexOf(sCategory) >= 0) {
                        var oAsyncExecution = {
                            category: sCategory,
                            functionToExecute: fnExecute
                        };
                        
                        oInfoObject.pushPendingExecutions(oAsyncExecution);
                    }
                }
			}
		}

		var oInfoObjectHandler = {
            /**
             * Method is used to push a new category to an existing information object with
             * a specific id. Method does a safe check whether provided category is supported
             * by the info object or not. In case the category which is pushed is already part 
             * of the associated categories of the info object operation is skipped
             * @param  {string} sControlId - Id of the control to which info object is associated which
             * needs to be enhanced with additional category
             * @param {string} sCategory - Category which needs to be pushed into a specific category
             * @returns {void}
             */
            pushCategory: fnPushCategory,
            /**
             * Method is used to get information object associated with a control. In case the 
             * information object doesn't exist it returns undefined
             * @param  {string} sControlId - Id of the control to which info object is associated
             * @returns {Object} - Instance of the associated info object. In case info object is not
             * available for a given control id returns undefined
             */
            getControlInformation: fnGetControlInformation,
            /**
             * Method creates a information object for a SubSection object. Consumer could invoke
             * the method even before the SubSection control is created. Consumer is not expected to
             * call the this method second time for the same SubSectionSettings. In case it does the 
             * operation would result in error
             * @param  {Object} oSubSectionSettings - SubSection settings is an object created in the 
             * templateSpecificPreparationHelper based on the section details from manifest and annotations
             * @returns {Object} - Instance of the newly created info object
             */
            initializeSubSectionInfoObject: fnInitializeSubSectionInfoObject,
            /**
             * Method creates a information object for a SmartTable object. Consumer could invoke
             * the method even before the SmartTable control is constructed. Consumer is not expected
             * to call the this method second time for the same TableSettings. In case it does the 
             * operation would result in error
             * @param  {Object} oTableSettings - Table settings is an object created based on
             * table details from manifest and annotations
             * @returns {Object} - Instance of the newly created info object
             */
            initializeSmartTableInfoObject: fnInitializeSmartTableInfoObject,
            /**
             * Method creates a information object for a SmartChart object. Consumer could invoke
             * the method even before the SmartChart control is constructed. Consumer is not expected
             * to call the this method second time for the same TableSettings. In case it does the 
             * operation would result in error
             * @param  {Object} oChartSettings - Chart settings is an object created based on  
             * the table details from manifest and annotations
             * @returns {Object} - Instance of the newly created info object
             */
            initializeSmartChartInfoObject: fnInitializeSmartChartInfoObject,
            /**
             * Method creates a information object for a Link object. Consumer could invoke
             * the method even before the Link control is constructed. Consumer is not expected
             * to call the this method second time for the same LinkSettings. In case it does the 
             * operation would result in error
             * @param  {Object} oLinkSettings - Settings object is expected to have id property & 
             * navigate property containing callback.
             * @returns {Object} - Instance of the newly created info object
             */
            initializeLinkInfoObject: fnInitializeLinkInfoObject,
            /**
             * Method creates a information object for a SideContent object. Consumer could invoke
             * the method even before the SideContent control is constructed. Consumer is not expected
             * to call the this method second time for the same SideContentSettings. In case it does the 
             * operation would result in error
             * @param  {Object} SideContentSettings - SideContent settings is an object created based on  
             * the SideContent details from view extensions. SideContent can be achieved only as 
             * View extension
             * @returns {Object} - Instance of the newly created info object
             */
            initializeSideContentInfoObject: fnInitializeSideContentInfoObject,
            /**
             * Method assign the control instance to the information object associated allowing the
             * control association to the information object in a lazy manner
             * @param {Object} oControl - Instance of the control which needs to be assigned to the 
             * information object associated with the control
             * @returns {Object} Associated information object is returned on successful assignment 
             * else undefined
             */
            setInformationWithControl: fnSetInformationWithControl,
            /**
             * This method perform a certain action for all information objects which belong to a 
             * specified category
             * @param {Object} sCategory - Category of the information objects for which the execution needs to be triggered
             * @param {function} fnExecute - Callback function that will be called for all specified information objects. Callback
             *   should have a signature is fnExecute(oInfoObject, oControl) 
             * @param {boolean} bSkipAddingToPendingQueue - It is possible that some of the objects may support the category for
             *   which execution is requested but doesn't have the category at the moment & could get added at a 
             *   later point of time. In case the caller assumes it is relevant to execute the callback at time 
             *   when a category get added (default behavior) could pass false else true. In case of true information
             *   objects which satisfy the passed category will ne picked for execution 
             * @returns {void}
            */
            executeForAllInformationObjects: fnExecuteForAllInformationObjects
		};

		return oInfoObjectHandler;
	}
    
	return BaseObject.extend("sap.suite.ui.generic.template.lib.info.InfoObjectHandler", {
		constructor : function(oController, oCommonUtils) {
			extend(this, getMethods(oController, oCommonUtils));
		}
	});

});
