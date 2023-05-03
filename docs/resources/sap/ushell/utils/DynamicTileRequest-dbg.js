//Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * @fileOverview this module handles the creation of requests for the dynamic tile
 */

sap.ui.define([
    "sap/ushell/utils/HttpClient",
    "sap/ui/thirdparty/URI",
    "sap/base/util/isEmptyObject",
    "sap/base/util/UriParameters",
    "sap/base/Log"
], function (
    HttpClient,
    URI,
    isEmptyObject,
    UriParameters,
    Log
) {
    "use strict";

    /**
     * Creates a DynamicTileRequest and starts the request
     *
     * @param {string} sUrl The request url
     * @param {function} fnSuccess The success handler
     * @param {function} fnError The error handler
     * @param {string|undefined} [sContentProviderId] The contentProviderId
     *
     * @since 1.87.0
     * @private
     */
    function DynamicTileRequest (sUrl, fnSuccess, fnError, sContentProviderId) {
        this.fnSuccess = fnSuccess;
        this.fnError = fnError;
        this.sUrl = sUrl;

        this.oPromise = this._resolveDefaults(sUrl, sContentProviderId)
            .then(function (sResolvedUrl) {
                if (sResolvedUrl) {
                    var sSAPLogonLanguage = sap.ui.getCore().getConfiguration().getSAPLogonLanguage();
                    /* Set escapeQuerySpace to false to use "%20" encoding instead of "+" for spaces
                    The "+" encoding seems to fail for many OData services*/
                    var oUri = new URI(sResolvedUrl).escapeQuerySpace(false);

                    if (sSAPLogonLanguage && !oUri.hasQuery("sap-language")) {
                        oUri.addQuery("sap-language", sSAPLogonLanguage);
                    }

                    if (oUri.is("relative")) {
                        oUri = oUri.absoluteTo(location.href);
                    }

                    this.sBasePath = oUri.origin() + oUri.directory() + "/";
                    this.sRequestPath = oUri.relativeTo(this.sBasePath).href();

                    var oHeaders = this._getHeaders(sResolvedUrl);
                    this.oConfig = {
                        headers: oHeaders
                    };
                    this.oClient = new HttpClient(this.sBasePath, this.oConfig);

                    this.refresh();
                }
            }.bind(this))
            .catch(function (vErr) {
                Log.error("Was not able to create a DynamicTileRequest:", vErr);
            });
    }

    /**
     * Returns the current url to the service
     * This method is only used by the integration test and should not
     * be used productive
     *
     * @returns {string} the current url
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype._getRequestUrl = function () {
        return this.sBasePath + this.sRequestPath;
    };

    /**
     * Creates a request if no request is currently running
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype.refresh = function () {
        if (!this.oRequest && this.oClient) {
            this.oRequest = this.oClient.get(this.sRequestPath)
                .then(this._onSuccess.bind(this))
                .catch(this._onError.bind(this));
        }
    };

    /**
     * Aborts the running request
     * @returns {boolean} Whether a request was running or not
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype.abort = function () {
        if (this.oRequest && this.oClient) {
            this.oClient.abortAll();
            this.oRequest = null;
            return true;
        }
        return false;
    };

    /**
     * Converts the result of the request according to requirements of the dynamic tile
     * and reset the request
     *
     * @param {object} oResult Result of the request
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype._onSuccess = function (oResult) {
        var vResult;
        try {
            vResult = JSON.parse(oResult.responseText);
        } catch (err) {
            throw new Error("Was not able to parse response of dynamic tile request");
        }

        this.oRequest = null;
        var oData;

        if (typeof vResult === "object") {
            // OData v2 adds this additional "d" level
            vResult = vResult.d ? vResult.d : vResult;
            var oUriParameters = new UriParameters(this.sRequestPath);

            if (oUriParameters.get("$inlinecount") === "allpages") {
                oData = { number: vResult.__count };

            // OData v4 $count=true
            } else if (oUriParameters.get("$count") === "true") {
                oData = { number: vResult["@odata.count"] };

            } else {
                oData = this._extractData(vResult);
            }
        // plain result
        } else if (typeof vResult === "string" || typeof vResult === "number") {
            oData = { number: vResult };
        }

        this.fnSuccess(oData);
    };

    /**
     * Calls the error handler and reset of the request
     *
     * @param {object} oError The error
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype._onError = function (oError) {
        this.oRequest = null;
        this.fnError(oError);
    };

    /**
     * Converts and filters the data according to requirements of the dynamic tile
     *
     * @param {object} oData Result of the request
     * @returns {object} The converted object
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype._extractData = function (oData) {
        var aSupportedKeys = [
            "results",
            "icon",
            "title",
            "number",
            "numberUnit",
            "info",
            "infoState",
            "infoStatus",
            "targetParams",
            "subtitle",
            "stateArrow",
            "numberState",
            "numberDigits",
            "numberFactor"
        ];

        // Filters data
        var oResult = Object.keys(oData).reduce(function (oAcc, sKey) {
            if (aSupportedKeys.indexOf(sKey) > -1) {
                oAcc[sKey] = oData[sKey];
            }
            return oAcc;
        }, {});

        if (!isEmptyObject(oResult)) {
            return oResult;
        }

        // Allow deeper nesting by one level when there is only one key in the first level,
        // this is needed in order to support that OData service operations (function imports) can return the dynamic tile data.
        var sFirstKey = Object.keys(oData)[0];
        if (sFirstKey !== undefined && Object.keys(oData).length === 1) {
            return Object.keys(oData[sFirstKey]).reduce(function (oAcc, sKey) {
                if (aSupportedKeys.indexOf(sKey) > -1) {
                    oAcc[sKey] = oData[sFirstKey][sKey];
                }
                return oAcc;
            }, {});
        }
        return {};
    };

    /**
     * Creates the request headers
     *
     * @param {string} sUrl The request url
     * @returns {object} The required headers
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype._getHeaders = function (sUrl) {
        var oHeaders = {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            "Accept-Language": sap.ui.getCore().getConfiguration().getLanguage() || "",
            Accept: "application/json, text/plain"
        };

        var sSAPLogonLanguage = sap.ui.getCore().getConfiguration().getSAPLogonLanguage();
        if (sSAPLogonLanguage) {
            oHeaders["sap-language"] = sSAPLogonLanguage;
        }

        var oLogonSystem = sap.ushell.Container.getLogonSystem();
        var sSapClient = oLogonSystem && oLogonSystem.getClient();
        var oURI = new URI(sUrl);
        // Don't add the sap-client if tile url is an absolute url
        if (sSapClient && !oURI.protocol()) {
            oHeaders["sap-client"] = sSapClient;
        }
        return oHeaders;
    };

    /**
     * Resolves the user defaults values within the request url
     *
     * @param {string} sUrl The request url
     * @param {string} [sContentProviderId] The ContentProviderId
     * @returns {Promise<string>} The resolved url
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype._resolveDefaults = function (sUrl, sContentProviderId) {
        return sap.ushell.Container.getServiceAsync("ClientSideTargetResolution")
            .then(function (oCstrService) {
                return Promise.all([
                    oCstrService.getSystemContext(sContentProviderId),
                    sap.ushell.Container.getServiceAsync("ReferenceResolver")
                ]);
            })
            .then(function (oResults) {
                var oSystemContext = oResults[0];
                var oReferenceResolverService = oResults[1];
                return new Promise(function (resolve, reject) {
                    oReferenceResolverService.resolveUserDefaultParameters(sUrl, oSystemContext)
                        .done(resolve)
                        .fail(reject);
                });
            })
            .then(function (oResult) {
                if (oResult.defaultsWithoutValue && oResult.defaultsWithoutValue.length > 0) {
                    Log.error("The service URL contains User Default(s) with no set value: " + oResult.defaultsWithoutValue.join(", "));
                    return;
                }

                if (oResult.ignoredReferences && oResult.ignoredReferences.length > 0) {
                    Log.error("The service URL contains invalid Reference(s): " + oResult.ignoredReferences.join(", "));
                    return;
                }

                return oResult.url;
            });
    };

    /**
     * Aborts the running requests and destroys the handler references
     *
     * @since 1.87.0
     * @private
     */
    DynamicTileRequest.prototype.destroy = function () {
        this.abort();
        this.fnError = null;
        this.fnSuccess = null;
    };

    return DynamicTileRequest;

});
