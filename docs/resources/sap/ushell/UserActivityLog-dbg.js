// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview Implementation of FLP User Activity Log.
 * Records the User's last _maxLoggedMessages (currently set to 30) Actions and Errors,
 *  and last Navigation action details.
 * Implementing API for adding a message (either ACTION or ERROR) and retrieving the logged data
 *  or the enhanced logged data.
 *
 * The data is kept on sessionStorage, hence it is session-based and is cleaned on browser refresh action
 *
 * Logged Errors and actions:
 * Kept on the sessionStorage in sap.ushell.UserActivityLog.loggingQueue
 *  - Any call to Log.fatal, Log.error or Log.warning is logged using a LogListener
 *  - Any Error Message is logged using Log.error call in the "error" function of Message Service
 *  - User Actions that invoke any of the events in _observedLaunchpadActions or _observedGeneralActions are logged
 *     using and additional listener (i.e. _handleAction) that is subscribed to those events
 *  - Failure in functions of LaunchPage that return Deffered.promise are logged using an additional fail handler
 *     that call Log.error
 *
 *  Last navigation action's details are kept on the sessionStorage in sap.ushell.UserActivityLog.lastNavigationActionData
 *  and collected using:
 *   - Decorator function (i.e. _tileOnTapDecorator) of sap.ushell.ui.tile.TileBase.prototype.ontap event of TileBase
 *   - Event handler subscribed to openApp event
 */
sap.ui.define([
    "sap/ushell/utils",
    "sap/ushell/utils/UrlParsing",
    "sap/ushell/ui/launchpad/Tile",
    "sap/ushell/EventHub",
    "sap/base/Log",
    "sap/base/util/extend"
], function (
    utils,
    urlParsing,
    Tile,
    EventHub,
    Log,
    extend
) {
    "use strict";

    /* global hasher */

    // Constructor
    var UserActivityLogClass = function () { };

    UserActivityLogClass.prototype = {
        _maxLoggedMessages: 50,
        _maxMessageByteSize: 2048,
        _maxQueueByteSize: 30720,
        _isActive: false,

        // Launchpad action events that should trigger logging
        _observedLaunchpadActions: [
            "createGroupAt",
            "deleteGroup",
            "resetGroup",
            "changeGroupTitle",
            "moveGroup",
            "addTile",
            "deleteTile",
            "movetile",
            "externalSearch",
            "addBookmarkTile"
        ],

        _observedGeneralActions: ["openApp"],
        _observedEventHubEvents: ["showCatalog"],
        _aDoableObjects: [],

        // API - Begin
        messageType: { ACTION: 0, ERROR: 1 },

        _tileOntapOrigFunc: undefined,

        activate: function (/*clean*/) {
            if (this._isActive) {
                return;
            }

            this._isActive = true;

            var oEventBus = sap.ui.getCore().getEventBus(),
                that = this;

            // Action logging: Subscribe to all the events in  _observedLaunchpadActions - User actions
            this._observedLaunchpadActions.forEach(function (item, i, arr) {
                oEventBus.subscribe("launchpad", item, that._handleAction, that);
            });

            oEventBus.subscribe("sap.ushell", "appOpened", that._handleAction, that);

            // Action logging: Subscribe to all the events in  _observedGeneralActions - User actions
            this._observedGeneralActions.forEach(function (item, i, arr) {
                oEventBus.subscribe(item, that._handleAction, that);
            });

            // Action logging: Subscribe to all the events in  _observedEventHubEvents - User actions
            this._observedEventHubEvents.forEach(function (item, i, arr) {
                that._aDoableObjects.push(EventHub.on(item).do(that._handleActionEventHub.bind(that)));
            });

            Log.addLogListener(this);

            that._tileOntapOrigFunc = Tile.prototype.ontap;
            sap.ushell.ui.launchpad.Tile.prototype.ontap = that._tileOnTapDecorator(that._tileOntapOrigFunc);
        },

        deactivate: function () {
            if (!this._isActive) {
                return;
            }

            this._isActive = false;

            var oEventBus = sap.ui.getCore().getEventBus(),
                that = this;

            // Action logging: Unsubscribe to all the events in  _observedLaunchpadActions - User actions
            this._observedLaunchpadActions.forEach(function (item, i, arr) {
                oEventBus.unsubscribe("launchpad", item, that._handleAction, that);
            });

            oEventBus.unsubscribe("sap.ushell", "appOpened", that._handleAction, that);

            // Action logging: Unsubscribe to all the events in  _observedGeneralActions - User actions
            this._observedGeneralActions.forEach(function (item, i, arr) {
                oEventBus.unsubscribe(item, that._handleAction, that);
            });

            // Action logging: Unsubscribe to all the events in  _observedEventHubEvents - User actions
            // The doable objects were stored in _aDoableObjects
            this._aDoableObjects.forEach(function (oDoable) {
                oDoable.off();
            });

            Log.removeLogListener(this);

            sap.ushell.ui.launchpad.Tile.prototype.ontap = this._tileOntapOrigFunc;
        },

        addMessage: function (type, messageText, messageID) {
            if (this._isActive) {
                this._addMessageInternal(type, messageText, messageID);
            }
        },

        /**
         * Returns the queue that contains the last user actions and errors
         *
         * @returns {Array} Log queue
         */
        getLog: function () {
            // return this._loggingQueue;
            return this._getLoggingQueueFromStorage();
        },

        /**
         * Returns a JSON that contains the last _maxLoggedMessages user actions and errors,
         * the details of the last navigation actions, user details and shell state
         *
         * @returns {Object} MessageInfo object
         */
        getMessageInfo: function (/*sUserText*/) {
            var result = {
                userDetails: this._getUserDetails(),
                shellState: this._getShellState(),
                navigationData: this._getLastNavActionFromStorage(),
                userLog: this.getLog(),
                formFactor: utils.getFormFactor()
            };
            return result;
        },

        /**
         * Returns a JSON as String that contains the last _maxLoggedMessages (currently - 30) user actions and errors,
         * the details of the last navigation actions, user details and shell state
         *
         * @param {String} sUserText Text
         * @returns {String} JSONString
         */
        getMessageInfoAsString: function (sUserText) {
            return JSON.stringify(this.getMessageInfo(sUserText));
        },

        // API - End

        // Functions for log listener - Begin
        onLogEntry: function (oData) {
            // track only log levels "fatal", "error", "warning"
            if (oData.level <= 2) {
                var sErrorMes = oData.message;
                if (typeof oData.details !== "undefined" && (oData.details !== "")) {
                    sErrorMes = sErrorMes + ", " + oData.details;
                }
                this.addMessage(this.messageType.ERROR, sErrorMes);
            }
        },

        onAttachToLog: function () { },

        onDetachFromLog: function () { },

        // For log listener - End

        // Navigation/ClickOnTile action listener - Begin

        /**
         * Decorator for click-on-Tile action for getting Navigation and Tile details
         *
         * @param {function} origFunc Original function
         * @returns {function} TabDecorator
         */
        _tileOnTapDecorator: function (origFunc) {
            var that = this,
                navigationHash,
                lastNavigationActionData,
                tileObj,
                tileModel,
                bindingCtx,
                tileModelPath;

            return function (/*event, ui*/) {
                var tileTypeName = this.getMetadata().getName();

                // If the Tile that was clicked is a PlusTile
                if (tileTypeName === "sap.ushell.ui.launchpad.PlusTile") {
                    that.addMessage(that.messageType.ACTION, "Open Catalog for empty group " + this.getGroupId());

                    // If the Tile that was clicked is a regular Tile
                } else if (tileTypeName === "sap.ushell.ui.launchpad.Tile") {
                    // Get the href of the anchor of the clicked tile
                    navigationHash = hasher.getHash();

                    /*
                    according to wiki PSSEC/SEC-222
                    we need to make sure we don't store sensitive data in the
                    sessionStorage, therefore we remove the application parameters
                    which might contains sensitive data like account number
                     */
                    if (navigationHash) {
                        var navObj = urlParsing.parseShellHash(navigationHash);
                        navigationHash = "#" + urlParsing.constructShellHash({
                            target: {
                                semanticObject: navObj.semanticObject,
                                action: navObj.action
                            }
                        });
                    }

                    lastNavigationActionData = that._getLastNavActionFromStorage();
                    lastNavigationActionData.time = new Date();
                    lastNavigationActionData.navigationHash = navigationHash;
                    lastNavigationActionData.tileDebugInfo = this.getDebugInfo();

                    // Get tile title
                    tileObj = sap.ui.getCore().byId(this.getId());
                    tileModel = tileObj.getModel();
                    bindingCtx = this.getBindingContext();
                    tileModelPath = bindingCtx.getPath();

                    lastNavigationActionData.tileTitle = bindingCtx.getModel().getProperty(tileModelPath).title;

                    that._putInSessionStorage(
                        "sap.ushell.UserActivityLog.lastNavigationActionData",
                        JSON.stringify(lastNavigationActionData)
                    );

                    that.addMessage(
                        that.messageType.ACTION,
                        "Click on Tile: " + tileModel.getData().title + " Tile debugInfo: " + this.getDebugInfo()
                    );
                }
                origFunc.apply(this, arguments);
            };
        },
        // Navigation/ClickOnTile action listener - End

        /**
         * Adds a new message to the sessionStorage (sap.ushell.UserActivityLog.loggingQueue)
         *  after validating the message Type and keeping the queue's size limits
         *
         * @param {Integer} type either ACTION (0) or ERROR (1)
         * @param {String} messageText Text that is added to the log
         * @param {String} messageID an ID...
         */
        _addMessageInternal: function (type, messageText, messageID) {
            var loggingQueue = this._getLoggingQueueFromStorage(),
                loggedMessage = { type: null },
                prop;
            for (prop in this.messageType) {
                if (type === this.messageType[prop]) {
                    loggedMessage.type = prop;
                    break;
                }
            }
            if (loggedMessage.type === null) {
                return;
            }
            extend(loggedMessage, {
                messageID: messageID,
                messageText: messageText,
                time: new Date(),
                toString: function () {
                    var arr = [this.type, this.time];
                    if (typeof this.messageID !== "undefined") {
                        arr.push(this.messageID);
                    }
                    arr.push(this.messageText);
                    return arr.join(" :: ");
                }
            });
            loggingQueue.push(loggedMessage);
            if (loggingQueue.length > this._maxLoggedMessages) {
                loggingQueue.shift();
            }
            this._putInSessionStorage("sap.ushell.UserActivityLog.loggingQueue", JSON.stringify(loggingQueue));
        },

        /**
         * A wrapper for _handleAction to be used when calling through the EventHub.
         * It translates the data from the EventHub to the syntax of the EventBus,
         * as expected by _handleAction
         *
         * @private
         * @param {object} oEventData The data passed to the EventHub.
         * @param {string} oEventData.sId must contain the name of the EventBus event being replaced.
         * @param {object} oEventData.oData The data as sent by the EventHub.
         */
        _handleActionEventHub: function (oEventData) {
            this._handleAction("", oEventData.sId, oEventData.oData);
        },

        /**
         * Event Handler for user actions.
         * For each action - preparing the appropriate message that is passed to addMessage
         * Expected to be called by the EventBus, not directly.
         *
         * @private
         * @param {string} sChannelId The channel the event was emitted on.
         * @param {string} sEventId The name of the emitted event.
         * @param {object} oData The data sent with the event.
         */
        // eslint-disable-next-line complexity
        _handleAction: function (sChannelId, sEventId, oData) {
            var sMessage;

            switch (sEventId) {
                case "deleteTile":
                    sMessage = "Delete Tile " + (oData.tileId || "");
                    break;
                case "moveTile":
                    sMessage = "Move Tile " + (oData.sTileId || "") + " to Group " + (oData.toGroupId || "");
                    break;
                case "createGroupAt":
                    sMessage = "Create Group";
                    break;
                case "changeGroupTitle":
                    sMessage = "Change Group Title of " + (oData.groupId || "") + " to " + (oData.newTitle || "");
                    break;
                case "deleteGroup":
                    sMessage = "Delete Group " + (oData.groupId || "");
                    break;
                case "addTile":
                    var oTilesModel = oData.catalogTileContext.oModel.oData,
                        sTilesPath = oData.catalogTileContext.sPath,
                        tile = this._findInModel(sTilesPath, oTilesModel),
                        tileID = tile.id,

                        group = oData.groupContext.getObject(),
                        groupID = group.groupId;
                    sMessage = "Add Tile " + (tileID || "") + " to Group " + (groupID || "");
                    break;
                case "moveGroup":
                    sMessage = "Move Group from index " + (oData.fromIndex || "") + " to index " + (oData.toIndex || "");
                    break;
                case "appOpened":
                    sMessage = "Open application " + oData.action;
                    var lastNavigationActionData = this._getLastNavActionFromStorage();

                    // TODO, clone, we are mutating an present object?
                    // Add the applicationInformation to the navigation data that was collected before the openApp event
                    lastNavigationActionData.applicationInformation = {};
                    ["applicationType", "ui5ComponentName", "url", "additionalInformation", "text"].forEach(function (sProp) {
                        lastNavigationActionData.applicationInformation[sProp] = oData[sProp];
                    });

                    // Check if the hash kept in lastNavigationActionData (the hash of the last app launching action)
                    // equals the current hash.
                    // If the application was launched as a result of clicking on a tile - then the hashes should match,
                    // but if the application was launched by right_click + open_in_new _tab -
                    // then the hashed probably don't match since the hash in lastNavigationActionData is from previous launching action
                    // of a different application, in this case tileDebugInfo does not match the current opened tile/application
                    // because it describes the tile. so it should be removed
                    if (!this._hashSegmentsEqual(lastNavigationActionData.navigationHash, oData.sShellHash)) {
                        lastNavigationActionData.tileDebugInfo = "";
                    }
                    // Anyway the hash of the current opened application is the most relevant one
                    // and should be in lastNavigationActionData.navigationHash
                    lastNavigationActionData.navigationHash = oData.sShellHash;
                    this._putInSessionStorage(
                        "sap.ushell.UserActivityLog.lastNavigationActionData",
                        JSON.stringify(lastNavigationActionData)
                    );
                    break;
                case "addBookmarkTile":
                    sMessage = "Add Bookmark " + (oData.title || "") + " " + (oData.subtitle || "") + " for URL: " + (oData.url || "");
                    break;
                case "showCatalog":
                    sMessage = "Show Catalog";
                    break;
                default:
                    break;
            } // End of switch

            this.addMessage(this.messageType.ACTION, sMessage);
        },

        _findInModel: function (sPath, oModel) {
            var pathArr,
                pointer = oModel,
                i,
                curPath;
            try {
                pathArr = sPath.split("/");
                for (i = 0; i < pathArr.length; i = i + 1) {
                    if (curPath !== pathArr[i]) {
                        continue;
                    }
                    pointer = pointer[curPath];
                }
            } catch (e) {
                return undefined;
            }
            return pointer;
        },

        _getUserDetails: function (/*sUserText*/) {
            var user = sap.ushell.Container.getUser();
            return {
                fullName: user.getFullName() || "",
                userId: user.getId() || "",
                eMail: user.getEmail() || "",
                Language: user.getLanguage() || ""
            };
        },

        _getShellState: function () {
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer"),
                oModel,
                result = "";
            if (oViewPortContainer !== undefined) {
                oModel = oViewPortContainer.getModel();
                result = oModel.getProperty("/currentState/stateName");
            }
            return result;
        },

        _getLoggingQueueFromStorage: function () {
            var loggingQueue = this._getFromSessionStorage("sap.ushell.UserActivityLog.loggingQueue");
            var queue = [];
            if (loggingQueue) {
                try {
                    queue = JSON.parse(loggingQueue);
                } catch (e) {
                    //ignore cases where its not a valid JSON
                }
            }
            return queue;
        },

        _getLastNavActionFromStorage: function () {
            var lastNavigationActionData = this._getFromSessionStorage("sap.ushell.UserActivityLog.lastNavigationActionData");
            return (lastNavigationActionData ? JSON.parse(lastNavigationActionData) : {});
        },

        _hashSegmentsEqual: function (url1, url2) {
            // Check if both URLs are not empty
            if ((!url1) || (!url2)) {
                return false;
            }
            return (this._getHashSegment(url1) === this._getHashSegment(url2));
        },

        /**
         * Gets a url (or hash part of a url) and returns the intent,
         * which is the section between the hash and the "~" or the "?" (the first between the two)
         *
         * @param {String} url Url
         *
         * @returns {String} Url
         */
        _getHashSegment: function (url) {
            var indexOfTilde = url.indexOf("~"),
                indexOfQuestionMark;
            if (indexOfTilde > -1) {
                return url.substring(0, indexOfTilde);
            }

            indexOfQuestionMark = url.indexOf("?");
            if (indexOfQuestionMark > -1) {
                return url.substring(0, indexOfQuestionMark);
            }
            return url;
        },

        _getFromSessionStorage: function (key) {
            var returnedValue = null;
            try {
                returnedValue = sessionStorage.getItem(key);
            } catch (err) {
                // continue regardless of error
            }
            return returnedValue;
        },

        _putInSessionStorage: function (key, value) {
            try {
                sessionStorage.setItem(key, value);
            } catch (err) {
                // continue regardless of error
            }
        }
    };

    var UserActivityLog = new UserActivityLogClass();

    return UserActivityLog;
}, /* bExport= */ false);
