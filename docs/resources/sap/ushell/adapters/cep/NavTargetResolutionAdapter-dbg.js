// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileoverview The NavTargetResolution adapter for SAP MyHome
 * @version 1.108.12
 */

 sap.ui.define([
    "sap/ushell/services/_ClientSideTargetResolution/VirtualInbounds",
    "sap/base/util/ObjectPath",
    "sap/base/Log",
    "sap/ushell/utils",
    "sap/ui/thirdparty/jquery",
    "sap/ushell/Container"
], function (
    oVirtualInbounds,
    ObjectPath,
    Log,
    utils,
    jQuery
    /*Container*/
) {
    ("use strict");
    /** Constructs a new instance of  The NavTargetResolution adapter for SAP MyHome.
     * It calls the backend service to retrieve navigation data.
     * @class
     * @constructor
     * @param {object} oUnused unused
     * @param {string} sParameter parameters
     * @param {object} oAdapterConfiguration configuration, holds endpoint for service
     * @since 1.101.0
     * @private
     */
    var NavTargetResolutionAdapter = function (
        oUnused,
        sParameter,
        oAdapterConfiguration
    ) {
        this.oAdapterConfiguration = oAdapterConfiguration;
        this._addVirtualInboundsToApplications();
        this.sCsrfToken = "";
    };

    /**
     * Adds virtual inbounds to applications
     * @since 1.101.0
     * @private
     */
    NavTargetResolutionAdapter.prototype._addVirtualInboundsToApplications =
        function () {
            var oApplications = ObjectPath.create(
                "config.applications",
                this.oAdapterConfiguration
            );
            var aVirtualInbounds = oVirtualInbounds.getInbounds();
            aVirtualInbounds.forEach(function (oInbound) {
                var sIntent = oInbound.semanticObject + "-" + oInbound.action;
                oApplications[sIntent] = oInbound.resolutionResult;
            });
        };

    /**
     * Gets the intent object that can be passed to the resolve service
     * used to call the backend service.
     * It uses the default launchStrategy which is launch type 'standalone'
     * and matching strategy 'first'.
     * The site id is taken from the window object.
     * @param {String} sHashFragment Fragment with semantic object and action and intent parameters,
     * @returns {Promise} Promise that resolves with an intent object
     * @private
     * @since 1.101.0
     */
    NavTargetResolutionAdapter.prototype._getIntentForService = function (
        sHashFragment
    ) {
        return sap.ushell.Container.getServiceAsync("URLParsing").then(
            function (URLParsing) {
                var oHashFragment = URLParsing.parseShellHash(sHashFragment);

                var oIntentForService = {
                    semanticObject: oHashFragment.semanticObject,
                    semanticObjectAction: oHashFragment.action,
                    intentParameters: oHashFragment.params,
                    queryParameters: {
                        siteId: ObjectPath.get("sap.cf.config.siteId") || ""
                    }
                };
                return oIntentForService;
            }
        );
    };

    /**
     * Fetches the csrf token from the approuter with a HEAD request if not already retrieved
     * @returns {Promise} Promise that resolves with the csrf token
     * @private
     * @since 1.101.0
     */
    NavTargetResolutionAdapter.prototype._fetchCsrfToken = function () {
        var that = this;
        if (that.sCsrfToken) {
            return Promise.resolve(that.sCsrfToken);
        }
        return fetch(this.oAdapterConfiguration.config.navServiceUrl, {
            method: "HEAD",
            headers: {
                "x-csrf-token": "fetch",
                "Accept-Language": sap.ui.getCore().getConfiguration().getLanguageTag()
            }
        }).then(function (response) {
            that.sCsrfToken = response.headers.get("x-csrf-token");
            return that.sCsrfToken;
        });
    };

    /**
     * wrapper function to convert ES6 promise into jQuery promise
     * @param {function} fn function to wrap
     * @return {fn} wrapped function
     */
    NavTargetResolutionAdapter.prototype.toPromise = function (fn) {
        var that = this;
        return function (mArg) {
            var oDeferred = new jQuery.Deferred();
            fn.call(that, mArg)
                .then(oDeferred.resolve)
                .catch(oDeferred.reject)
                .finally(oDeferred.always);

            return oDeferred.promise();
        };
    };

    /**
     * Resolves hash fragment by calling backend service
     * @param {*} sHashFragment hash fragment
     * @returns {jQuery.Promise} a promise that resolves with a resolution result
     * @since 1.101.0
     */
    NavTargetResolutionAdapter.prototype.resolveHashFragment =
    function (sHashFragment) {
       return this.toPromise(
            this._resolveHashFragment
        ).call(this, sHashFragment);
    };

    /**
     * Resolves hash fragment by calling backend service
     * @param {*} sHashFragment hash fragment
     * @returns {Promise} a promise that resolves with a resolution result
     * @since 1.101.0
     */
    NavTargetResolutionAdapter.prototype._resolveHashFragment = function (
        sHashFragment
    ) {
        var that = this;
        return this._fetchCsrfToken()
        .then(function () {
            return that._getIntentForService(sHashFragment);
        })
        .then(function (oIntentForService) {
            var sResolvePath = that.oAdapterConfiguration.config.navServiceUrl + "/resolve";
            return fetch(
                sResolvePath,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; utf-8",
                        Accept: "application/json",
                        "x-csrf-token": that.sCsrfToken,
                        "Accept-Language": sap.ui.getCore().getConfiguration().getLanguageTag()
                    },
                    body: JSON.stringify(oIntentForService)
                }
            ).then(function (response) {
                if (response.ok === false) {
                    return Promise.reject(response.statusText);
                }
                return response.json();
            }).then(function (responseData) {
                var oData = responseData.value || responseData;
                var sUrl = Array.isArray(oData) ? oData[0].url : oData.url;

                return {
                    additionalInformation: "",
                    url: sUrl,
                    applicationType: "URL",
                    navigationMode: "newWindow"
                };
            });
        });
    };
    return NavTargetResolutionAdapter;
}, /* bExport= */ false);
