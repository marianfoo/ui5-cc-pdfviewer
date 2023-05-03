sap.ui.define([
    "sap/suite/ui/generic/template/genericUtilities/FeLogger",
    "sap/base/util/includes"
], function(FeLogger, includes) {
    "use strict";

    var oLogger = new FeLogger("manifestMerger.MergerUil").getLogger();
    /**
     * 
    * This class holds the helper functions that are invoked from the manifestMergers
    * @private
    */
    var mergerUtil = {

        /** 
         * Iterate through the pages object to find the page map that matches sEntityKey and sPageComponent value
         * @param {object} oPages - The pages object which is provided in the Manifest which will be iterated through 
         * to find the corresponding object which contains the keys entityset and component.name
         * @param {string} sEntityKey - EntitySet name of the parent page where the user would like to add new changes
         * @param {string} sPageComponent - Component name of parent page where the user would like to add new changes
         * @param {string} sChildPageId - The newly created page's id
         * @param {string} sParentKey - contains "pages" or pageId as the value
         * @returns {object} returns oPageStructure the page map where the new changes provided by the user has to be added
         * @private
         */
        iterateAndFind: function iterateFind(oPages, sEntityKey, sPageComponent, sChildPageId, sParentKey) {
            var oPageStructure;
            // throw error if sap.ui.generic.app.pages structure is array
            if (Array.isArray(oPages)) {
                throw new Error("Manifest should have sap.ui.generic.app.pages as Object structure and not array ");
            }
            for (var sKey in oPages) {
                if (sKey === "entitySet" && oPages.entitySet === sEntityKey) {
                    if (oPages.component && oPages.component.name === sPageComponent) {
                        if (oPages.pages) {
                            var aSiblingkeys = Object.keys(oPages.pages);
                            findDuplicate(aSiblingkeys);
                        }
                        oLogger.info(oPages);
                        return oPages;
                    }
                } else if (typeof oPages[sKey] === "object" && !Array.isArray(oPages[sKey])) { // if there are any property settings with Array structure skip it from iteration
                    // if value already found break
                    if (oPageStructure) {
                        break;
                    }
                    if (sKey === "pages" || sParentKey === "pages") { // iterate only through "pages" structure
                    oPageStructure = iterateFind(oPages[sKey], sEntityKey, sPageComponent, sChildPageId, sKey);
                    }
                } else if (sKey === "pages" && Array.isArray(oPages[sKey])) { // if sKey = pages and if oPages[sKey] has array structure throw error
                    throw new Error("Manifest should have sap.ui.generic.app.pages as Object structure and not array ");
                }
            }
            function findDuplicate(aSiblingkeys) {
                if (aSiblingkeys.length) {
                    aSiblingkeys.filter(function (sPageKey) {
                        if (sPageKey === sChildPageId) {
                            throw new Error("Adding duplicate pageKey " + sChildPageId + " is not supported.");
                        }
                    });
                }
            }
            return oPageStructure;
        },

         /** 
         * Function used to check the consistency of the oChangeContent structure to ensure all the 
         * mandatory parameters are provided and are of valid type
         * @param {object} oChangeContent - Contains the changes that the user wants to add to the oManifest
         * @param {string} sMergerType - The type of merger operation that is being executed, can hold value "ADD" or "MODIFY"
         * @param {Array} aSupportedProperties - Contains the array of supported properties
         * @private
         */
        consistencyCheck:  function (oChangeContent, sMergerType, aSupportedProperties) {
            if (!oChangeContent["parentPage"]) {
                throw new Error("Mandatory 'parentPage' parameter is not provided.");
            }
            if (!oChangeContent.parentPage.entitySet) {
                throw new Error("Mandatory 'parentPage.entitySet' parameter is not provided.");
            }
            if (!oChangeContent.parentPage.component) {
                throw new Error("Mandatory 'parentPage.component' parameter is not provided.");
            }
            if (sMergerType === "ADD") {

                if (!oChangeContent.childPage.id) {
                    throw new Error(" Add mandatory parameter 'childPage.id' ");
                }

                if (!oChangeContent.childPage.definition) {
                    throw new Error("Mandatory 'childPageDefinition' are not provided. Add 'childPage.definition' to add the new page. ");
                }

                var aChildkeys =  Object.keys(oChangeContent.childPage.definition);
                aChildkeys.forEach(function(sKey) {
                    // check if unsupported properties are defined by user in childPageDefinition
                    if (!includes(aSupportedProperties, sKey)) {
                        throw new Error("Changing " + sKey + " is not supported. The supported 'propertyPath' is: " + aSupportedProperties.join(","));
                    }
                });

                var aMandatoryParams =  aSupportedProperties.filter(function(sComponentKey) {
                    return !includes(aChildkeys, sComponentKey);
                });
                // check if all mandatory properties are defined by user in childPageDefinition
                if (aMandatoryParams.length) {
                    throw new Error("Mandatory parameter " + aMandatoryParams + " is not defined.");
                }
            } else if (sMergerType === "MODIFY") {
                if (!oChangeContent.entityPropertyChange) {
                    throw new Error("Changes for \"" + oChangeContent["pageId"] + "\" are not provided.");
                } else {
                    var oEntityPropertyChange = oChangeContent.entityPropertyChange;
                    if (!oEntityPropertyChange.propertyPath) {
                        throw new Error("Invalid change format: The mandatory 'propertyPath' is not defined. Please define the mandatory property 'propertyPath'");
                    }
                    if (!oEntityPropertyChange.operation || oEntityPropertyChange.operation  !== "UPSERT") {
                        throw new Error("Invalid change format: The mandatory 'operation' is not defined or is not valid type. Please define the mandatory property 'operation' with type 'UPSERT");
                    }
                    if (!oEntityPropertyChange.propertyValue) {
                        throw new Error("Invalid change format: The mandatory 'propertyValue' is not defined. Please define the mandatory property 'propertyValue'");
                    }
                }
            }
        }
    };
    return mergerUtil;
});

