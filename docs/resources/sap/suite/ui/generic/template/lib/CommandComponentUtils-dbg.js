/**
 * A helper class of the ComponentUtils class which is specifically designed to encapsulate all the logic related to commands/keyboard shortcut for
 * all the eligible actions.
 */

sap.ui.define(["sap/ui/base/Object",
    "sap/base/util/extend",
    "sap/suite/ui/generic/template/js/AnnotationHelper"
], function (BaseObject, extend, AnnotationHelper) {
    "use strict";
    function getMethods(oComponentRegistryEntry) {
        // Get the stable id of the annotated action i.e. DataForAction and DataFieldForIBN.
        function fnGetAnnotatedActionId(oDataField, oTabItem, oFacet, bChartItem) {
            return AnnotationHelper.getStableIdPartForDatafieldActionButton(oDataField, oFacet) +
                (oTabItem ? AnnotationHelper.getSuffixFromIconTabFilterKey(oTabItem) : "") +
                (bChartItem ? "::chart" : "");
        }

        // used for smart table and smart chart's toolbar
        function fnGetToolbarDataFieldForActionCommandDetails(oDataField, oPageSettings, oTabItem, oFacet, bChartItem) {
            var oCommandDetails = Object.create(null);
            var sFunctionImportName = oDataField.Action.String.split("/")[1];
            if ((!oDataField.Inline || oDataField.Inline.Bool === "false") && oPageSettings.annotatedActions && oPageSettings.annotatedActions[sFunctionImportName]) {
                oCommandDetails = {
                    id: fnGetAnnotatedActionId(oDataField, oTabItem, oFacet, bChartItem),
                    action: oPageSettings.annotatedActions[sFunctionImportName].command,
                    callbackName: "._templateEventHandlers.onCallActionFromToolBar",
                    annotatedAction: true
                };
            }
            return oCommandDetails;
        }

        // used for smart table and smart chart's toolbar
        function fnGetToolbarDataFieldForIBNCommandDetails(oDataField, oPageSettings, oInternalManifest, oTabItem, oFacet, bChartItem) {
            if (!oDataField.Inline || oDataField.Inline.Bool === "false") {
                var sMatchingOutbound = Object.keys(oPageSettings.outbounds || {}).find(function (sOutbound) {
                    var oNavigationIntent = oComponentRegistryEntry.utils.getOutboundNavigationIntent(oInternalManifest, sOutbound);
                    return oNavigationIntent.semanticObject === oDataField.SemanticObject.String && oNavigationIntent.action === oDataField.Action.String;
                });
                if (sMatchingOutbound) {
                    return {
                        id: fnGetAnnotatedActionId(oDataField, oTabItem, oFacet, bChartItem),
                        action: oPageSettings.outbounds[sMatchingOutbound].command,
                        callbackName: "._templateEventHandlers.onDataFieldForIntentBasedNavigation",
                        outboundAction: true
                    };
                }
            }
            return Object.create(null);
        }

        return {
            getToolbarDataFieldForActionCommandDetails: fnGetToolbarDataFieldForActionCommandDetails,
            getToolbarDataFieldForIBNCommandDetails: fnGetToolbarDataFieldForIBNCommandDetails
        };
    }

    return BaseObject.extend("sap.suite.ui.generic.template.lib.CommandComponentUtils", {
        constructor: function (oComponentRegistryEntry) {
            extend(this, getMethods(oComponentRegistryEntry));
        }
    });
});