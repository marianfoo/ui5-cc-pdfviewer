sap.ui.define([
    "sap/base/util/ObjectPath",
    "sap/suite/ui/generic/template/genericUtilities/FeLogger",
    "sap/suite/ui/generic/template/manifestMerger/MergerUtil",
    "sap/ui/fl/util/DescriptorChangeCheck"
], function(ObjectPath,FeLogger, MergerUtil, DescriptorChangeCheck) {
	"use strict";
    var oLogger = new FeLogger("manifestMerger.AddNewObjectPage").getLogger();
    /**
    * This class holds the function which will be invoked from the flex layer when the manifest.appdescr_variant has 
    * the changeType "appdescr_ui_generic_app_addNewObjectPage" to extend the Manifest with new page
    * @namespace sap.suite.ui.generic.template.manifestMerger.AddNewObjectPage
    * @private
    */
    
    var addNewObjectPage = {
        /**
         * @param {object} oManifest - Contains the existing Manifest of the application
         * @param {object} oChange - Contains the Page details which the user would like to add for the newly created node
         * The oChange for AddNewObjectPage should have the following structure : 
         *  {
         *      "changeType": "appdescr_ui_generic_app_addNewObjectPage", // the app descriptor change type name
         *      "layer": "CUSTOMER",  // The target layer, can have values  "CUSTOMER" , "CUSTOMER_BASE", "PARTNER" or "VENDOR"
         *      "content": {
         *          "parentPage" : {    // source page details
         *              "component": "sap.suite.ui.generic.template.ObjectPage", // source page component where the new page will be added
         *              "entitySet": "C_STTA_SalesOrder_WD_20"                  // source page entityset name where the new page will be added
         *          },
         *          "childPage": { // newly being added page's details
         *              "id": "customer.ObjectPage|to_extendedNode", // pageId of the new page being added
         *              "definition": {
         *                  "navigationProperty": "to_extendedNode", // navigation property of the new page being added
         *                  "entitySet": "C_STTA_ExtendedNode"       // entityset name of the new page being added
         *              }
         *          }
         *      }
         *  }
        
         * @returns {object} updated oManifest containing the new page added
         * @protected
         */
        applyChange : function(oManifest, oChange) {
            oLogger.info("addNewPage use case");
            var aSupportedProperties = ["navigationProperty", "entitySet"];
            var oChangeContent = oChange.getContent();
            var sChildPageId = oChangeContent.childPage && oChangeContent.childPage.id;
            if (sChildPageId) {
                DescriptorChangeCheck.checkIdNamespaceCompliance(sChildPageId, oChange);
            }
            MergerUtil.consistencyCheck(oChangeContent, "ADD", aSupportedProperties);
            var sParentEntitySet = oChangeContent.parentPage.entitySet;
            var sParentComponent = oChangeContent.parentPage.component;
            var oPageStructure = MergerUtil.iterateAndFind(oManifest["sap.ui.generic.app"],sParentEntitySet, sParentComponent, sChildPageId);
            var oComponentContent  =  {
                "name": "sap.suite.ui.generic.template.ObjectPage"
            };
            if (oPageStructure) {
                if (oPageStructure.pages && Array.isArray(oPageStructure.pages)) {
                throw Error("Manifest should have sap.ui.generic.app.pages as Object structure and not array");
                }
                ObjectPath.create(["pages", sChildPageId], oPageStructure);
                ObjectPath.set(["pages", sChildPageId], oChangeContent.childPage.definition , oPageStructure);
                ObjectPath.set(["pages", sChildPageId, "component"], oComponentContent, oPageStructure);
            } else {
                throw Error("The target content definition is invalid");
            }
            return oManifest;
        }
    };
    return addNewObjectPage;
});