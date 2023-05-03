// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * @fileOverview Card UserRecent
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
     * Constructor for the user recents service used by the sap.ui.integration.widgets.Card control.
     *
     * @class
     * A cards data service to get the recent activities of the user.
     * @extends sap.ushell.services._CardUserRecents.CardUserRecentsBase
     *
     * @constructor
     * @private
     * @name sap.ushell.services.CardUserRecents
     * @since 1.64
     */
    var CardUserRecents = CardUserRecentsBase.extend("sap.ushell.ui5service.CardUserRecents");

    /**
     * Overwrites getData to get an array of recent user activities which will get displayed inside a card.
     * When tracking activity is not enabled, no request should be sent to the UserRecents service.
     * @private
     * @returns {promise} A promise that resolves with an array of recent activities formatted
     * as sap.ui.integration.widget.Card items.
     * @since 1.64
     */
    CardUserRecents.prototype.getData = function () {
        if (!Config.last("/core/shell/model/enableTrackingActivity")) {
            return Promise.resolve([]);
        }

        return this.oUserRecentsPromise.then(function (oUserRecents) {
            return new Promise(function (resolve, reject) {
                oUserRecents.getRecentActivity()
                    .done(function (aRecentActivities) {
                        resolve(this._getActivitiesAsCardItems(aRecentActivities));
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
    CardUserRecents.prototype.attachDataChanged = function (updateCardContent) {
        EventHub.on("newUserRecentsItem").do(function (aRecentActivities) {
            var aUsageArray = aRecentActivities.recentUsageArray;
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
     * Overwrites detachDataChanged to unsubscribe from the 'newUserRecentsItem' and
     * 'userRecentsCleared' event of the EventHub.
     *
     * @private
     * @since 1.64
     */
    CardUserRecents.prototype.detachDataChanged = function () {
        EventHub.on("newUserRecentsItem").off();
        EventHub.on("userRecentsCleared").off();
    };

    CardUserRecents.hasNoAdapter = true;
    return CardUserRecents;

});
