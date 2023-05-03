/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Core"
], function (Log, JSONModel, Core) {
    "use strict";

    /**
     * Provides functionality for Insight cards CRUD operations.
     *
     * @namespace
     * @since 1.102
     * @alias module:sap/insights/CardHelper
     * @public
     * @experimental Since 1.102
     */

    var BASE_URL = "/sap/opu/odata4/ui2/insights_srv/srvd/ui2/";
    var REPO_BASE_URL = BASE_URL + "insights_cards_repo_srv/0001/";
    var CARD_ENTITY_NAME = "INSIGHTS_CARDS";
    var CARD_READ_URL = BASE_URL + "insights_cards_read_srv/0001/" + CARD_ENTITY_NAME;
    var POST = "POST";
    var PUT = "PUT";
    var oLogger = Log.getLogger("sap.insights.CardHelper");
    var I18_BUNDLE = sap.ui.getCore().getLibraryResourceBundle("sap.insights");

    var PREVIEW_XML = "sap.insights.preview.Preview",
        SELECTION_XML = "sap.insights.selection.Selection",
        SELECTION_DIALOG_XML = "sap.insights.selection.SelectionDialog",
        COPY_XML = "sap.insights.copy.Copy";

    function getCardEntityUrl(sCardId) {
        return REPO_BASE_URL + CARD_ENTITY_NAME + "('" + sCardId + "')";
    }

    function fetchCSRFToken() {
        return fetch(REPO_BASE_URL, {
            method: "HEAD",
            headers: {
                "X-CSRF-Token": "Fetch"
            }
        }).then(function (resposne) {
            var token = resposne.headers.get("X-CSRF-Token");
            if (resposne.ok && token) {
                return token;
            }
            logAndThrowException(I18_BUNDLE.getText('tokenFetchError'));
        });
    }

    function merge(oPayload, sCSRFToken, sMethod) {
        if ([PUT, POST].indexOf(sMethod) === -1) {
            logAndThrowException("Method not supported.");
        }

        var sCardId = oPayload["sap.app"].id;
        var sUrl = sMethod === PUT ? getCardEntityUrl(sCardId) : REPO_BASE_URL + CARD_ENTITY_NAME;
        oPayload = {
            "descriptorContent": JSON.stringify(oPayload),
            "id": sCardId
        };

        var sPayload = JSON.stringify(oPayload);

        return fetch(sUrl, {
            method: sMethod,
            headers: {
                "X-CSRF-Token": sCSRFToken,
                "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
            },
            body: sPayload
        }).then(function (response) {
            return response.json();
        }).then(function (oResponse) {
            if (oResponse.error) {
                logAndThrowException(oResponse.error.message);
            }
            return JSON.parse(oResponse.descriptorContent);
        });
    }

    function setRank(oRank, sCSRFToken) {
        var sUrl = REPO_BASE_URL + CARD_ENTITY_NAME + "/com.sap.gateway.srvd.ui2.insights_cards_repo_srv.v0001.setRank?";
        var sPayload = JSON.stringify({ changedCards: JSON.stringify(oRank) });
        return fetch(sUrl, {
            method: POST,
            headers: {
                "X-CSRF-Token": sCSRFToken,
                "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
            },
            body: sPayload
        }).then(function (oResponse) {
            return oResponse.json();
        }).then(function (oResponse) {
            if (oResponse.error) {
                logAndThrowException(oResponse.error.message);
            }
            oResponse.value.forEach(function (oCard) {
                if (oCard.descriptorContent) {
                    oCard.descriptorContent = JSON.parse(oCard.descriptorContent);
                }
            });
            return oResponse.value;
        });
    }

    function validateCardId(sCardId) {
        var aTempArray = sCardId.split(".");
        if (aTempArray[0] !== "user") {
            logAndThrowException("sap.app.id value should start with user.<id>.");
        }
    }

    function deleteCard(sCardId, sCSRFToken) {
        return fetch(getCardEntityUrl(sCardId), {
            method: "DELETE",
            headers: {
                "X-CSRF-Token": sCSRFToken
            }
        }).then(function (oResponse) {
            return oResponse.ok ? {} : oResponse.json();
        }).then(function (oResponse) {
            if (oResponse.error) {
                logAndThrowException(oResponse.error.message);
            }
            return sCardId;
        });
    }

    function isSupported() {
        var DISABLED_ERR_MSG = "sap.insights is not enabled for this system.";
        var CUSTOM_HOME_COMP_ID = "ux.eng.s4producthomes1";
        try {
            var uShellConfig = window["sap-ushell-config"];
            var bInsightsEnabled = uShellConfig.apps.insights.enabled;
            var sCustomHomeComponentId = uShellConfig.ushell.homeApp.component.name;
            var bComponentIdCorrect = sCustomHomeComponentId === CUSTOM_HOME_COMP_ID;
            var bProductHomeSupported = uShellConfig.ushell.spaces.myHome.enabled;
            var bSpacesSupported = uShellConfig.ushell.spaces.enabled;
            return isTeamsModeActive().then(function(bIsActive) {
                if (!bIsActive && bInsightsEnabled && bProductHomeSupported && bComponentIdCorrect && bSpacesSupported) {
                    return Promise.resolve(true);
                }
                return Promise.reject(new Error(DISABLED_ERR_MSG));
            });
        } catch (oError) {
            return Promise.reject(new Error(DISABLED_ERR_MSG));
        }
    }

    function _getCurrentUrl() {
        var oUShellContainer = sap.ushell && sap.ushell.Container;
        return oUShellContainer ? new Promise(function (fnResolve) {
            oUShellContainer.getFLPUrlAsync(true).done(function (sFLPUrl) {
                fnResolve(sFLPUrl);
            });
        }) : Promise.resolve(document.URL);
    }

    /* returns bIsActive as true when app opened in Teams mode.
        This can be tested by adding following query parameter in url:
        appState=lean&sap-collaboration-teams=true (before semanticobject-action) */
    function isTeamsModeActive() {
        var bAppRunningInTeams = false;
        var oUshellContainer = sap.ushell && sap.ushell.Container;
        var oURLParsing = oUshellContainer && oUshellContainer.getService("URLParsing");
        return _getCurrentUrl().then(function (sCurrentUrl) {
            var sBeforeHashURL = sCurrentUrl.split("#")[0];
            if (sBeforeHashURL.indexOf('?') !== -1) {
                var oParsedUrl = oURLParsing && oURLParsing.parseParameters(sBeforeHashURL.substring(sBeforeHashURL.indexOf('?')));
                if (oParsedUrl &&
                    oParsedUrl["sap-collaboration-teams"] &&
                    oParsedUrl["sap-collaboration-teams"][0] &&
                    oParsedUrl["sap-collaboration-teams"][0] === "true") {
                    bAppRunningInTeams = true;
                }
                var bAppStateLean = false;
                if (oParsedUrl &&
                    oParsedUrl["appState"] &&
                    oParsedUrl["appState"][0] &&
                    oParsedUrl["appState"][0] === "lean") {
                    bAppStateLean = true;
                }
                return Promise.resolve(bAppRunningInTeams && bAppStateLean);
            } else {
                return Promise.resolve(false);
            }
        });
    }

    function logAndThrowException(sMsg) {
        oLogger.error(sMsg);
        throw new Error(sMsg);
    }

    function validateCardManifest(oCardManifest) {
        var bInvalidManifest = false;

        if (!oCardManifest["sap.app"]) {
            oLogger.error("Invalid card manifest. sap.app namespace do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.app"].id) {
            oLogger.error("Invalid card manifest. sap.app.id do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest) {
            validateCardId(oCardManifest["sap.app"].id, false);
        }
        if (!bInvalidManifest && !oCardManifest["sap.app"].type) {
            oLogger.error("Invalid card manifest. sap.app.type do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && oCardManifest["sap.app"].type.toLowerCase() !== "card") {
            oLogger.error("Invalid card manifest. invalid value for sap.app.type, expected card.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.card"]) {
            oLogger.error("Invalid card manifest. sap.card namespace do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.card"].type) {
            oLogger.error("Invalid card manifest. sap.card.type do not exists.");
            bInvalidManifest = true;
        }
        var aValidCardType = [
            // "AdaptiveCard",
            "Analytical",
            // "AnalyticsCloud",
            // "Calendar",
            // "Component",
            "List",
            // "Object",
            // "Timeline",
            // "WebPage",
            "Table"
        ];
        if (!bInvalidManifest && aValidCardType.indexOf(oCardManifest["sap.card"].type) === -1) {
            oLogger.error("Invalid card manifest. Invalid value for sap.card.type. Supported types: " + aValidCardType);
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.insights"]) {
            oLogger.error("Invalid card manifest. sap.insights namespace do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.insights"].parentAppId) {
            oLogger.error("Invalid card manifest. sap.insights.parentAppId do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.insights"].cardType) {
            oLogger.error("Invalid card manifest. sap.insights.cardType do not exists.");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && oCardManifest["sap.insights"].cardType !== "RT") {
            oLogger.error("Invalid card manifest. Invalid value for sap.insights.cardType, supported value is RT");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && !oCardManifest["sap.insights"].versions || !oCardManifest["sap.insights"].versions.ui5) {
            oLogger.error("Invalid card manifest. Invalid value for sap.insights version");
            bInvalidManifest = true;
        }
        if (!bInvalidManifest && oCardManifest["sap.insights"].templateName === "OVP") {
            var aContentActions,
                aHeaderActions,
                oParameters,
                bActionExists = false,
                sCardType = oCardManifest["sap.card"].type;

            // Analytical Card
            if (sCardType === "Analytical") {
                // Backward Compatilbility (For 2202 manifests)
                aContentActions = oCardManifest["sap.card"].content.actions || [];
                aHeaderActions = oCardManifest["sap.card"].header.actions || [];
                aContentActions = aContentActions.filter(function(oAction){
                    return oAction.type === "Navigation" && oAction.parameters && oAction.parameters.ibnTarget && oAction.parameters.ibnTarget.semanticObject && oAction.parameters.ibnTarget.action;
                });
                aHeaderActions = aHeaderActions.filter(function(oAction){
                    return oAction.type === "Navigation" && oAction.parameters && oAction.parameters.ibnTarget && oAction.parameters.ibnTarget.semanticObject && oAction.parameters.ibnTarget.action;
                });
                if (aContentActions.length > 0 || aHeaderActions.length > 0) {
                    bActionExists = true;
                }

                // For 2302 manifests
                if (oCardManifest["sap.card"].configuration.parameters.state && oCardManifest["sap.card"].configuration.parameters.state.value) {
                    oParameters = JSON.parse(oCardManifest["sap.card"].configuration.parameters.state.value);
                    if (oParameters.parameters
                        && oParameters.parameters.ibnTarget
                        && oParameters.parameters.ibnTarget.semanticObject
                        && oParameters.parameters.ibnTarget.action
                    ) {
                        bActionExists = true;
                    }
                }
            }

            // List or Table Card
            if (sCardType === "List" || sCardType === "Table") {
                aContentActions = (sCardType === "List" ? oCardManifest["sap.card"].content.item.actions : oCardManifest["sap.card"].content.row.actions) || [];
                aHeaderActions = oCardManifest["sap.card"].header.actions || [];
                aContentActions = aContentActions.filter(function(oAction){
                    return oAction.type === "Navigation";
                });
                aHeaderActions = aHeaderActions.filter(function(oAction){
                    return oAction.type === "Navigation";
                });
                if (aContentActions.length > 0 || aHeaderActions.length > 0) {
                    var oHeaderStateParameters = {},
                        oContentStateParameters = {};
                    // Check for HeaderState and lineItemState
                    if (oCardManifest["sap.card"].configuration.parameters.headerState && oCardManifest["sap.card"].configuration.parameters.headerState.value) {
                        oHeaderStateParameters = JSON.parse(oCardManifest["sap.card"].configuration.parameters.headerState.value);
                    }
                    if (oCardManifest["sap.card"].configuration.parameters.lineItemState && oCardManifest["sap.card"].configuration.parameters.lineItemState.value) {
                        oContentStateParameters = JSON.parse(oCardManifest["sap.card"].configuration.parameters.lineItemState.value);
                    }
                    var bHeaderAction = false,
                        bContentAction = false;

                    if (oHeaderStateParameters.parameters
                        && oHeaderStateParameters.parameters.ibnTarget
                        && oHeaderStateParameters.parameters.ibnTarget.semanticObject
                        && oHeaderStateParameters.parameters.ibnTarget.action
                    ) {
                        bHeaderAction = true;
                    }
                    if (oContentStateParameters.parameters
                        && oContentStateParameters.parameters.ibnTarget
                        && oContentStateParameters.parameters.ibnTarget.semanticObject
                        && oContentStateParameters.parameters.ibnTarget.action
                    ) {
                        bContentAction = true;
                    }
                    bActionExists = bHeaderAction || bContentAction;
                }
            }

            if (!bActionExists) {
                oLogger.error("Invalid card manifest. Card should have navigation.");
                bInvalidManifest = true;
            }
        }

        if (bInvalidManifest) {
            throw new Error(I18_BUNDLE.getText('invalidManifest'));
        }
    }


    var CardHelperService = {
        localCardCache: {},
        userCardModel: new JSONModel().setDefaultBindingMode("OneWay"),
        suggestedCardModel: new JSONModel().setDefaultBindingMode("OneWay"),
        parentAppDetailsCache: {},

        _mergeCard: function (oCardManifest, sMethod) {
            try {
                validateCardManifest(oCardManifest);
            } catch (oError) {
                return Promise.reject(oError);
            }

            return fetchCSRFToken().then(function (sCSRFToken) {
                return merge(oCardManifest, sCSRFToken, sMethod);
            }).then(function (oResponse) {
                this.localCardCache = {};
                this.suggestedCardModel.setProperty("/isLoading", false);
                return oResponse;
            }.bind(this));
        },
        /**
         * Support creation of the insight card in SAP Insights service.
         * @param {object} oCardManifest Card manifest which needs to be stored in the repository
         * @returns {Promise} Returns promise which is resolved to created card manifest
         * @public
         * @experimental Since 1.102
         * @static
         */
        createCard: function (oCardManifest) {
            this.suggestedCardModel.setProperty("/isLoading", true);
            return this._mergeCard(oCardManifest, POST);
        },

        /**
         * Support updation of  insight card in SAP Insights service.
         * @param {object} oCardManifest Card manifest which needs to be stored in the repository
         * @returns {Promise} Returns promise which is resolved to created card manifest
         * @public
         * @experimental Since 1.102
         * @static
         */
        updateCard: function (oCardManifest) {
            this.suggestedCardModel.setProperty("/isLoading", true);
            return this._mergeCard(oCardManifest, PUT);
        },

        /**
         * Support deletion the insight card from SAP Insights service.
         * @param {string} sCardId ID of the card manifest
         * @returns {Promise} Returns promise which is resolved card ID of the deleted card
         * @public
         * @experimental Since 1.102
         * @static
         */
        deleteCard: function (sCardId) {
            try {
                validateCardId(sCardId);
            } catch (oError) {
                return Promise.reject(oError);
            }
            this.suggestedCardModel.setProperty("/isLoading", true);
            return fetchCSRFToken().then(function (sCSRFToken) {
                return deleteCard(sCardId, sCSRFToken);
            }).then(function (sCardId) {
                this.localCardCache = {};
                this.suggestedCardModel.setProperty("/isLoading", false);
                return sCardId;
            }.bind(this));
        },

        /**
         * Retrieve the insight cards from SAP Insights service for the current user.
         *
         * @returns {array} Returns array of user cards
         * @public
         * @experimental Since 1.102
         * @static
         */
        getUserCards: function () {
            if (this.localCardCache.userCards) {
                return Promise.resolve(this.localCardCache.userCards);
            }
            var url = CARD_READ_URL + "?$orderby=rank";
            return this._readCard(url).then(function (aCards) {
                this.localCardCache.userCards = aCards;
                return aCards;
            }.bind(this));
        },

        /**
         * Retrieve the insight cards from SAP Insights service for the current user.
         *
         * @returns {JSONModel} Returns array of user cards
         * @public
         * @experimental Since 1.102
         * @static
         */
        getUserCardModel: function () {
            return this.getUserCards().then(function (aCards) {
                var aVisibleCards = aCards.filter(function (oCard) {
                    return oCard.visibility;
                });
                this.userCardModel.setProperty("/cards", aCards);
                this.userCardModel.setProperty("/cardCount", aCards.length);
                this.userCardModel.setProperty("/visibleCardCount", aVisibleCards.length);
                return this.userCardModel;
            }.bind(this));
        },

        /**
         * Retrieve the insight cards from SAP Insights service for the current user.
         *
         * @returns {Promise} Returns a promise which resolves to an array of suggested cards.
         * @public
         * @experimental Since 1.102
         * @static
         */
        getSuggestedCards: function () {
            if (this.localCardCache.suggestedCards) {
                return Promise.resolve(this.localCardCache.suggestedCards);
            }
            var url = CARD_READ_URL + "?$filter=visibility eq true&$select=descriptorUrl,visibility,rank&$orderby=rank&$skip=0&$top=10";
            return this._readCard(url).then(function (aCards) {
                this.localCardCache.suggestedCards = aCards;
                return aCards;
            }.bind(this));
        },

        /**
         * Retrieve the insight cards from SAP Insights service for the current user.
         *
         * @returns {Promise} Returns a promise which resolves to an array of suggested cards.
         * @public
         * @experimental Since 1.102
         * @static
         */
        getSuggestedCardModel: function () {
            return this.getSuggestedCards().then(function (aCards) {
                this.suggestedCardModel.setProperty("/cards", aCards);
                this.suggestedCardModel.setProperty("/cardCount", aCards.length);
                this.suggestedCardModel.setProperty("/isLoading", false);
                return this.suggestedCardModel;
            }.bind(this));
        },

        _readCard: function (url) {
            return fetch(url).then(function (response) {
                if (response.ok) {
                    return response.json();
                }
                logAndThrowException("Cannot read user's suggested cards.");
            }).then(function (oData) {
                oData.value.forEach(function (oCard) {
                    if (oCard.descriptorContent) {
                        oCard.descriptorContent = JSON.parse(oCard.descriptorContent);
                    }
                });
                return oData.value;
            });
        },
        /**
         * Sets the rank of the user cards.
         *
         * @param {Object} oRank .
         * @returns {Promise} Returns a promise which resolves to an array of user cards.
         * @public
         * @experimental Since 1.102
         * @static
         */
        setCardsRanking: function (oRank) {
            this.suggestedCardModel.setProperty("/isLoading", true);
            return fetchCSRFToken().then(function (sCSRFToken) {
                return setRank(oRank, sCSRFToken);
            }).then(function (aCards) {
                this.localCardCache = {};
                this.suggestedCardModel.setProperty("/isLoading", false);
                return aCards;
            }.bind(this));
        },

        /**
         * Refresh User Cards.
         *
         * @param {boolean} oFlag .
         * @returns {Promise} Returns a promise.
         * @public
         * @experimental Since 1.102
         * @static
         */
        _refreshUserCards: function (oFlag) {
            this.suggestedCardModel.setProperty("/isLoading", true);
            var oBody = oFlag ? {"deleteAllCards": "X"} : {};
            return new Promise(function (resolve) {
                fetch(REPO_BASE_URL, {
                    method: "HEAD",
                    headers: {
                        "X-CSRF-Token": "Fetch"
                    }
                }).then(function (resposne) {
                    var token = resposne.headers.get("X-CSRF-Token");
                    fetch(REPO_BASE_URL + CARD_ENTITY_NAME + "/com.sap.gateway.srvd.ui2.insights_cards_repo_srv.v0001.deleteCards?", {
                        method: "POST",
                        headers: {
                            "X-CSRF-Token": token,
                            "content-type": "application/json;odata.metadata=minimal;charset=utf-8"
                        },
                        body: JSON.stringify(oBody)
                    }).then(function(){
                        this.localCardCache = {};
                        this.suggestedCardModel.setProperty("/isLoading", false);
                        resolve();
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },

        /**
         * Get Cards parent app details.
         *
         * @param {Object} oCard .
         * @returns {Object} Returns a object with scemanticObject and title.
         * @public
         * @experimental Since 1.102
         * @static
         */
        getParentAppDetails: function (oCard) {
            if (this.parentAppDetailsCache[oCard.descriptorContent["sap.app"].id]) {
                return Promise.resolve(this.parentAppDetailsCache[oCard.descriptorContent["sap.app"].id]);
            }
            var oParentApp = {};
            return sap.ushell.Container.getServiceAsync("ClientSideTargetResolution").then(function(ClientSideTargetResolution) {
                var aAvailableApps = ClientSideTargetResolution._oAdapter._aInbounds || [];
                var oApp = aAvailableApps.find(function(oApp) {
                    return oApp.resolutionResult && oApp.resolutionResult.applicationDependencies && oApp.resolutionResult.applicationDependencies.name === oCard.descriptorContent["sap.insights"].parentAppId;
                });
                if (oApp){
                    oParentApp.semanticObject = oApp.semanticObject;
                    oParentApp.action = oApp.action;
                    oParentApp.semanticURL = "#" + oApp.semanticObject + "-" + oApp.action;
                    oParentApp.title = oCard.descriptorContent["sap.app"].title;

                    this.parentAppDetailsCache[oCard.descriptorContent["sap.app"].id] = oParentApp;
                }
                return oParentApp;
            }.bind(this));
        }
    };

    var UIService = {
        _oViewCache: {},
        _getLoadLibraryPromise: function (sViewName) {
            var aPromise;
            switch (sViewName) {
                case PREVIEW_XML:
                    aPromise = Promise.all([Core.loadLibrary("sap.m"),
                    Core.loadLibrary("sap.ui.integration"),
                    Core.loadLibrary("sap.viz")]);
                    break;
                case SELECTION_XML:
                case SELECTION_DIALOG_XML:
                    aPromise = Promise.all([Core.loadLibrary("sap.m"),
                    Core.loadLibrary("sap.ui.core"),
                    Core.loadLibrary("sap.f"),
                    Core.loadLibrary("sap.ui.integration"),
                    Core.loadLibrary("sap.ui.layout"),
                    Core.loadLibrary("sap.viz")]);
                    break;
                case COPY_XML:
                    aPromise = Promise.all([Core.loadLibrary("sap.m"),
                    Core.loadLibrary("sap.ui.core"),
                    Core.loadLibrary("sap.f"),
                    Core.loadLibrary("sap.ui.integration"),
                    Core.loadLibrary("sap.ui.layout")
                    ]);
                    break;
                default:
                    break;
            }
            return aPromise;

        },
        _getXMLView: function (sViewName) {
            return new Promise(function (resolve, reject) {
                if (this._oViewCache[sViewName]) {
                    return resolve(this._oViewCache[sViewName]);
                }
                return this._getLoadLibraryPromise(sViewName).then(function () {
                    return sap.ui.core.mvc.XMLView.create({
                        viewName: sViewName
                    }).then(function (oView) {
                        this._oViewCache[sViewName] = oView;
                        return resolve(this._oViewCache[sViewName]);
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },

        showCardPreview: function (oCard, calledInternally) {
            return this._getXMLView(PREVIEW_XML).then(function (oXMLView) {
                return oXMLView.getController().showPreview(oCard, calledInternally);
            });
        },

        _showCardSelectionDialog: function (oCard) {
            return this._getXMLView(SELECTION_DIALOG_XML).then(function (oXMLView) {
                return oXMLView.getController().showSelectionDialog(oCard);
            });
        }

    };

    /**
    * Method could be used to get an instance of CardHelper service.
    * @returns {Promise} Returns promise which is resolved to instance of CardHelper service.
    * @public
    * @experimental Since 1.102
    * @static
    */
    return {
        getServiceAsync: function (sServiceName) {
                return isSupported().then(function () {
                    if (sServiceName === "UIService") {
                        return UIService;
                    }
                    return CardHelperService;
                }).catch(function (oError) {
                    return Promise.reject(oError);
                });
            }
        };
});