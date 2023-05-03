// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview Card UserRecents Base
 *
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ui/core/service/Service",
    "sap/ushell/resources",
    "sap/ushell/library",
    "sap/ushell/utils/AppType",
    "sap/ushell/utils/UrlParsing"
], function (Service, resources, ushellLibrary, AppTypeUtils, UrlParsing) {
    "use strict";

    var AppType = ushellLibrary.AppType;

    /**
     * Formats a title string based on the app type.
     *
     * @param {string} sTitle Title to be formatted.
     * @param {string} sAppType The app type.
     * @returns {string} The formatted title.
     *
     * @private
     */
    function _titleFormatter (sTitle, sAppType) {
        if (sAppType === AppType.SEARCH) {
            return "\"" + sTitle + "\"";
        }
        return sTitle;
    }

    /**
     * Formats the description based on the app type.
     *
     * @param {string} sAppType The app type.
     * @returns {string} The formatted description.
     *
     * @private
     */
    function _descriptionFormatter (sAppType) {
        if (sAppType === AppType.SEARCH) {
            return resources.i18n.getText("recentActivitiesSearchDescription");
        }
        return AppTypeUtils.getDisplayName(sAppType);
    }

    /**
     * Constructor for the user recents service base which serves as a base class for CardUserRecents and CardUserFrequents.
     *
     * @class A base class for CardUserRecents and CardUserFrequents.
     * @extends sap.ui.core.service.Service
     * @constructor
     * @private
     * @name sap.ushell.services.CardUserRecentsBase
     * @since 1.64
     */
    var CardUserRecentsBase = Service.extend("sap.ushell.ui5service._CardUserRecents.CardUserRecentsBase", {
        constructor: function () {
            Service.apply(this);
            // The UserRecents service is used in the classes extending this base class
            this.oUserRecentsPromise = sap.ushell.Container.getServiceAsync("UserRecents");
        }
    });

    /**
     * A function to format an array of activities from the sap.ushell.services.UserRecents service
     * into a format that the sap.ui.integration.widgets.Card control uses to display list items.
     *
     * @private
     * @param {object[]} aActivities An array of sap.ushell.services.UserRecents activities.
     * @returns {object[]} An array of activity objects from the sap.ushell.services.UserRecents service formatted as card items.
     * @since 1.64
     */
    CardUserRecentsBase.prototype._getActivitiesAsCardItems = function (aActivities) {
        var aCardItems = [],
            oShellHash = {},
            oCardItem;
        for (var i = 0; i < aActivities.length; i++) {
            if (aActivities[i].url && aActivities[i].url !== "") {
                oShellHash = UrlParsing.parseShellHash(aActivities[i].url);

                oCardItem = {
                    Name: _titleFormatter(aActivities[i].title, aActivities[i].appType),
                    Description: _descriptionFormatter(aActivities[i].appType),
                    Icon: aActivities[i].icon || "sap-icon://product"
                };

                if (oShellHash) {
                    oCardItem.Intent = {
                        SemanticObject: oShellHash.semanticObject,
                        Action: oShellHash.action,
                        Parameters: oShellHash.params,
                        AppSpecificRoute: oShellHash.appSpecificRoute
                    };
                } else {
                    oCardItem.Url = aActivities[i].url;
                }
                aCardItems.push(oCardItem);
            }
        }
        return aCardItems;
    };

    return CardUserRecentsBase;
}, true /* bExport */);
