// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * @fileOverview Card UserFrequents
 *
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ushell/ui5service/_CardUserRecents/CardUserRecentsBase",
    "sap/ushell/EventHub",
    "sap/ushell/Config"
], function (CardUserRecentsBase, EventHub, Config) {
    "use strict";

    /**
     * Constructor for the user frequents service used by the sap.ui.integration.widgets.Card control.
     *
     * @class
     * A cards data service to get the frequently used apps of the user.
     * @extends sap.ushell.services._CardUserRecents.CardUserRecentsBase
     *
     * @constructor
     * @private
     * @name sap.ushell.services.CardUserFrequents
     * @since 1.64
     */
    var CardUserFrequents = CardUserRecentsBase.extend("sap.ushell.ui5service.CardUserFrequents");

    /**
     * Overwrites getData to get an array of frequent user activities which will get displayed inside a card.
     * When tracking activity is not enabled, no request should be sent to the service.
     * @private
     * @returns {promise} A promise that resolves with an array of frequent activities formatted or an empty array
     * as sap.ui.integration.widget.Card items.
     * @since 1.64
     */
    CardUserFrequents.prototype.getData = function () {
        if (!Config.last("/core/shell/model/enableTrackingActivity")) {
            return Promise.resolve([]);
        }
        return this.oUserRecentsPromise.then(function (oUserRecents) {
            return new Promise(function (resolve, reject) {
                oUserRecents.getFrequentActivity()
                    .done(function (aFrequentActivities) {
                        resolve(this._getActivitiesAsCardItems(aFrequentActivities));
                    }.bind(this))
                    .fail(function (error) {
                        reject(error);
                    });
            }.bind(this));
        }.bind(this));
    };

    /**
     * @callback updateCardContent
     * @param {object} oEvent The event object.
     * @param {object} oEvent.data The data.
     */

    /**
     * Overwrites attachDataChanged to subscribe to the 'newUserRecentsItem' and
     * 'userRecentsCleared' event of the EventHub, which notifies the service
     * when a new activity was created or all activities were cleared.
     * This is used to refresh the cards content accordingly.
     *
     * @private
     * @param {function} updateCardContent The handler function to call when new content is retrieved.
     * @since 1.64
     */
    CardUserFrequents.prototype.attachDataChanged = function (updateCardContent) {
        EventHub.on("newUserRecentsItem").do(function (aRecentActivities) {
            var aUsageArray = this._sortAsFrequentActivities(aRecentActivities.recentUsageArray);
            var aUpdatedRecentActivities = [];
            for (var i = 0; i < aUsageArray.length; i++) {
                aUpdatedRecentActivities.push(aUsageArray[i].oItem);
            }
            var aParsedRecentActivities = this._getActivitiesAsCardItems(aUpdatedRecentActivities);
            updateCardContent({ data: aParsedRecentActivities });
        }.bind(this));

        EventHub.on("userRecentsCleared").do(function () {
            updateCardContent({ data: [] });
        });
    };

    /**
     * Formats recent activities into frequent ones. Copied from sap.ushell.services.UserRecents
     * 'getFrequentItems' function.
     *
     * @todo Refactor sap.ushell.services.UserRecents to expose this function and make it available as an API.
     *
     * @private
     * @param {object[]} aRecentActivities An array of recent activities.
     * @returns {object[]} An array of recent activities formatted as frequently used ones.
     * @since 1.64
     */
    CardUserFrequents.prototype._sortAsFrequentActivities = function (aRecentActivities) {
        var iActivityIndex,
            iWorkingDaysCounter = 0,
            aFrequentActivity = [],
            oActivity,
            oPreviousActivityDate = aRecentActivities[0] ? new Date(aRecentActivities[0].iTimestamp) : undefined,
            oCurrentActivityDate;

        for (iActivityIndex = 0; iActivityIndex < aRecentActivities.length && iWorkingDaysCounter < 30; iActivityIndex++) {
            oActivity = aRecentActivities[iActivityIndex];
            if (oActivity.iCount > 1) {
                aFrequentActivity.push(oActivity);
            }
            oCurrentActivityDate = new Date(oActivity.iTimestamp);
            if (oPreviousActivityDate.toDateString() !== oCurrentActivityDate.toDateString()) {
                iWorkingDaysCounter++;
                oPreviousActivityDate = oCurrentActivityDate;
            }
        }

        aFrequentActivity.sort(function (a, b) {
            return b.iCount - a.iCount;
        });

        return aFrequentActivity.slice(0, 30);
    };

    /**
     * Overwrites detachDataChanged to unsubscribe from the 'newUserRecentsItem' and
     * 'userRecentsCleared' event of the EventHub.
     *
     * @private
     * @since 1.64
     */
    CardUserFrequents.prototype.detachDataChanged = function () {
        EventHub.on("newUserRecentsItem").off();
        EventHub.on("userRecentsCleared").off();
    };

    CardUserFrequents.hasNoAdapter = true;
    return CardUserFrequents;

}, true /* bExport */);
