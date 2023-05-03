sap.ui.define([
    "sap/base/util/ObjectPath",
    "sap/suite/ui/generic/template/genericUtilities/FeLogger",
    "sap/suite/ui/generic/template/manifestMerger/MergerUtil"
], function(ObjectPath,FeLogger, MergerUtil) {
    "use strict";
    var oLogger = new FeLogger("manifestMerger.ChangePageConfiguration").getLogger();

    /**
    * This class holds the function which will be invoked from the flex layer when the manifest.appdescr_variant has 
    * the changeType "appdescr_ui_generic_app_changePageConfiguration" to extend the Manifest settings
    * @namespace sap.suite.ui.generic.template.manifestMerger.ChangePageConfiguration
    * @private
    */

    var changePageConfiguration = {
        /**
         * @param {object} oManifest - Contains the existing Manifest of the application
         * @param {object} oChange - Contains the setting changes that the user wants to add to the oManifest
         * The oChange for changePageConfiguration should have the following structure:
         *
         *  {
         *      "changeType": "appdescr_ui_generic_app_changePageConfiguration", // the app descriptor change type name
         *      "layer": Layer.CUSTOMER, // The target layer, can have values  "CUSTOMER" , "CUSTOMER_BASE", "PARTNER" or "VENDOR"
         *      "content": {
         *          "parentPage" : { // source page details
         *              "component": "sap.suite.ui.generic.template.ObjectPage", // source page component where the new page will be added
         *              "entitySet": "C_STTA_SalesOrder_WD_20" // source page entityset name where the new page will be added
         *          },
         *          "entityPropertyChange": { // details of the configuration to be changed
         *              "propertyPath": "component/settings", // property pth where the change has to be added
         *              "operation": "UPSERT", // operation type 
         *              "propertyValue": { // contains the property details that has to be modified
         *                  "tableType": "ResponsiveTable"
         *              }
         *          }
         *      }
         *  }
         * @returns {object} the updated oManifest containing the oChange settings
         * @protected
         */
        applyChange:  function(oManifest, oChange) {
            oLogger.info("modifyPageConfiguration use case");
            var oChangeContent = oChange.getContent();
            MergerUtil.consistencyCheck(oChangeContent, "MODIFY");
            var sParentEntitySet = oChangeContent.parentPage.entitySet;
            var sParentComponent = oChangeContent.parentPage.component;
            var oPageStructure = MergerUtil.iterateAndFind(oManifest["sap.ui.generic.app"],sParentEntitySet, sParentComponent);
            var oPropertyChange = oChangeContent.entityPropertyChange;
            
            var aPropertyKeys = Object.keys(oPropertyChange.propertyValue);
            aPropertyKeys.forEach(function(sCurrentKey) {
                var aPropertyPath = oPropertyChange.propertyPath.split("/");
                aPropertyPath.push(sCurrentKey);
                var vVal = ObjectPath.get(aPropertyPath, oPageStructure);
                if (vVal && typeof vVal === "object") {
                    var oPropertyPathContent = ObjectPath.create(aPropertyPath, oPageStructure);
                    Object.assign(oPropertyPathContent, oPropertyChange.propertyValue[sCurrentKey]);
                } else {
                    ObjectPath.set(aPropertyPath, oPropertyChange.propertyValue[sCurrentKey], oPageStructure);
                }
            });
            return oManifest;
        }
     };
     return changePageConfiguration;
});