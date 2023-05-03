sap.ui.define(["sap/ui/base/Object",
    "sap/base/util/extend",
    "sap/suite/ui/generic/template/genericUtilities/testableHelper"
], function (BaseObject, extend, testableHelper) {
    "use strict";

    /* This class is a helper class for Application with repect to sap-keep-alive features.
     * More precisely, for each App an instance of this class is created.
     */
    function getMethods(oTemplateContract) {

        /**
         * By default, refresh on app restore after external navigation done via smart table's chevron, is done for apps 
         * having sap-keep-alive settings. However, if the refresh strategy is explicitly defined in the manifest (even as, 
         * an empty object), then we can say that the refresh strategy is overriden by the app.
         */
        function getChevronNavigationRefreshBehaviour(sTableEntitySet) {
            function isRefreshOverriddenForExternalChevronNavigation() {
                var oEntity = oTemplateContract.mEntityTree[sTableEntitySet];
                return oEntity.page.navigation
                    && oEntity.page.navigation.display
                    && oEntity.page.navigation.display.refreshStrategyOnAppRestore
                    && oEntity.page.navigation.display.refreshStrategyOnAppRestore.entitySets;
            }

            var oSelfRefreshStrategy = Object.create(null);
            oSelfRefreshStrategy[sTableEntitySet] = "self";
            return fnComputeRefreshBehaviour(isRefreshOverriddenForExternalChevronNavigation() ? oTemplateContract.mEntityTree[sTableEntitySet].page.navigation.display.refreshStrategyOnAppRestore.entitySets : oSelfRefreshStrategy);
        }

        /**
         * The function determines the list of entity set which needs to be refreshed on app restore, based on
         * the configurations set in the manifest.
         * <EntitySet> : "self" => Only the mentioned entity set should get refreshed. Morover, it would mean
         *      that for root page and cases where component entity set is not same as <EntitySet>, we should
         *      do a complete refresh i.e. refresh of the entity set and its associations. Othwrwise, refresh
         *      should be done only on the entity set and not on any of its associations.
         * <EntitySet> : "includingDependents" => Entity sets should be refreshed. Moreover, for non list report pages and
         *      cases where component entity set is same as <EntitySet>, then we should do a complete refresh
         *      for the corresponding component.
         * @param {object} oRefreshStrategyEntitySets refresh strategy object defined for a particular external
         *      navigation.
         * Returns a map which contains all the active component instance along with an array of entity sets 
         * which need to be refreshed.
         */
        function fnComputeRefreshBehaviour(oRefreshStrategyEntitySets) {
            var mRefreshBehaviour = Object.create(null);
            for (var sComponent in oTemplateContract.componentRegistry) {
                var oRegistryEntry = oTemplateContract.componentRegistry[sComponent];
                var oRefreshBehaviour = {
                    entitySets: [],
                    component: oRegistryEntry.oComponent
                };
                mRefreshBehaviour[sComponent] = oRefreshBehaviour;
                var nViewLevel = oRegistryEntry.viewLevel;
                for (var sEntitySet in oRefreshStrategyEntitySets) {
                    var bAreEntitySetsSame = oRegistryEntry.oComponent.getEntitySet() === sEntitySet;
                    switch (oRefreshStrategyEntitySets[sEntitySet]) {
                        case "self":
                            if (nViewLevel === 0 || !bAreEntitySetsSame) {
                                oRefreshBehaviour.entitySets.push(sEntitySet);
                            } else {
                                oRefreshBehaviour.withoutAssociationsRefresh = true;
                            }
                            break;
                        case "includingDependents":
                            oRefreshBehaviour.entitySets.push(sEntitySet);

                            if (nViewLevel > 0 && bAreEntitySetsSame) {
                                oRefreshBehaviour.isRefreshRequired = true;
                            }
                            break;
                        default:
                            break;
                    }
                }
            }

            return mRefreshBehaviour;
        }

        /**
         * The function is used to figure out the corresponding refresh strategy defined in the manifest
         * for a given semantic object and action
         * @param {object} oIntentNavigation object containing semantic object and action
         */
        function getComponentRefreshBehaviour(oIntentNavigation) {
            var sMatchedOutbound;
            if (oIntentNavigation.key) {    // navigation via extension API
                sMatchedOutbound = oIntentNavigation.key;
            } else {
                var oOutbounds = getAllOutboundNavigation();
                /* First we check for the exact match of semantic object and action.
                   If not found, we fallback to the default settings for all external navigation. */
                for (var sOutbound in oOutbounds) {
                    var oOutbound = oOutbounds[sOutbound];
                    if (oOutbound.semanticObject === oIntentNavigation.semanticObject && oOutbound.action === oIntentNavigation.action) {
                        sMatchedOutbound = sOutbound;
                        break;
                    }
                }
            }

            return fnComputeRefreshBehaviour(getOutboundRefreshStrategy(sMatchedOutbound) || getDefaultRefreshStrategy());
        }

        function getOutboundRefreshStrategy(sOutbound) {
            var oExternalNavigationSettings = getExternalNavigationSettings();
            return oExternalNavigationSettings
                && oExternalNavigationSettings.outbounds
                && oExternalNavigationSettings.outbounds[sOutbound]
                && oExternalNavigationSettings.outbounds[sOutbound].refreshStrategyOnAppRestore
                && oExternalNavigationSettings.outbounds[sOutbound].refreshStrategyOnAppRestore.entitySets;
        }

        function getDefaultRefreshStrategy() {
            var oExternalNavigationSettings = getExternalNavigationSettings();
            return oExternalNavigationSettings
                && oExternalNavigationSettings.defaultOutboundSettings
                && oExternalNavigationSettings.defaultOutboundSettings.refreshStrategyOnAppRestore
                && oExternalNavigationSettings.defaultOutboundSettings.refreshStrategyOnAppRestore.entitySets;
        }

        function getAllOutboundNavigation() {
            var oAppConfigFromManifest = oTemplateContract.oAppComponent.getInternalManifest()["sap.app"];
            return oAppConfigFromManifest.crossNavigation && oAppConfigFromManifest.crossNavigation.outbounds;
        }

        function getExternalNavigationSettings() {
            var oAppComponentConfig = oTemplateContract.oAppComponent.getConfig();
            return oAppComponentConfig.settings && oAppComponentConfig.settings.externalNavigationSettings;
        }

        /* eslint-disable */
        fnComputeRefreshBehaviour = testableHelper.testableStatic(fnComputeRefreshBehaviour, "KeepAliveHelper_fnComputeRefreshBehaviour");
        /* eslint-disable */

        return {
            getChevronNavigationRefreshBehaviour: getChevronNavigationRefreshBehaviour,
            getComponentRefreshBehaviour: getComponentRefreshBehaviour
        };
    }

    return BaseObject.extend("sap.suite.ui.generic.template.lib.KeepAliveHelper", {
        constructor: function (oTemplateContract) {
            extend(this, getMethods(oTemplateContract));
        }
    });
});