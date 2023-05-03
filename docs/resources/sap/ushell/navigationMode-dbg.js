// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview The NavigationMode module
 *
 * <p>This module provides methods to get the navigation mode.</p>
 * The main method is #getNavigationMode that is used by
 * NavTargetResolution#resolveHashFragment and
 * indirectly by ClientSideTargetResolution#resolveTileIntent
 * It provides the navigationMode in LPA for CDM in method getTileView
 * Method Compute is used by ClientSide TargetResolution and takes not only the
 * next application but also the current application into account.
 *
 * @version 1.108.12
 */
sap.ui.define([
    "sap/base/Log",
    "sap/base/util/isPlainObject"
], function (Log, isPlainObject) {
    "use strict";

    /**
     * Checks whether the provided service configuration is valid and
     * logs an error message if not
     *
     * @param {object} oServiceConfiguration
     *  the service configuration object
     */
    var oExport = {};
    var _validateServiceConfiguration = function (oEnableInPlaceForClassicUIs) {
        var bIsValid = true;

        if (oEnableInPlaceForClassicUIs) {
            if (typeof oEnableInPlaceForClassicUIs !== "object") {
                bIsValid = false;
            } else {
                Object.keys(oEnableInPlaceForClassicUIs).forEach(function (sKey) {
                    if (["GUI", "WDA", "WCF"].indexOf(sKey) === -1) {
                        bIsValid = false;
                    } else if (typeof oEnableInPlaceForClassicUIs[sKey] !== "boolean") {
                        bIsValid = false;
                    }
                });
            }
        }

        if (!bIsValid) {
            Log.error("Invalid parameter: 'enableInPlaceForClassicUIs' must be an object; allowed properties: GUI|WDA, type boolean",
                "Actual parameter: " + JSON.stringify(oEnableInPlaceForClassicUIs),
                "sap.ushell.services.navigationMode");
        }
    };

    /**
     * Determines whether the given application type represents a legacy
     * application.
     *
     * @param {string} sApplicationType
     *   The application type to be checked
     * @returns {boolean}
     *   Whether the given application type represents a legacy application
     *   type.
     *
     * @private
     */
    oExport._isLegacyApplicationType = function (sApplicationType) {
        switch (sApplicationType) {
            case "WDA":
            case "TR":
            case "NWBC":
            case "WCF":
                // consider NWBC a legacy application type because this
                // method can be called with the resolutionResult returned
                // by ClientSideTargetResolution, for example,
                // via appConfiguration.getCurrentApplication().applicationType
                return true;
            default:
                return false;
        }
    };

    // enableInPlaceForClassicUIs
    var _getClassicUITechnologyForApplicationType = function (sApplicationType) {
        switch (sApplicationType) {
            case "TR":
                return "GUI";
            case "WDA":
                return "WDA";
            case "WCF":
                return "WCF";
            default:
                return undefined;
        }
    };

    var _isInplaceEnabledForApplicationType = function (oEnableInPlaceForClassicUIsConfig, sApplicationType) {
        if (isPlainObject(oEnableInPlaceForClassicUIsConfig)) {
            return oEnableInPlaceForClassicUIsConfig[_getClassicUITechnologyForApplicationType(sApplicationType)];
        }

        return false; // default
    };

    /**
     * Calculates information about the current and next navigation mode for a
     * given application type, based on the values of sap-ushell-next-navmode
     * and sap-ushell-navmode (intent or default) parameters.
     * <br />
     * This method may log debug information on the console.
     *
     * @param {string} sNextApplicationType
     *   The applicationType of the application to navigate to
     *
     * @param {string} sExternalNextNavigationMode
     *   The value of the sap-ushell-navmode parameter coming from the
     *   intent parameter or default value
     *
     * @param {string} sExternalNavigationMode
     *   The value of the sap-ushell-navmode to be propagated in the resolution
     *   result as the sap-ushell-next-navmode parameter. This parmeter will
     *   not be propagated for invalid values of
     *   <code>sExternalNavigationMode</code>.
     *
     * @param {string} sApplicationType
     *   The current applicationType the application is navigating from
     *
     * @param {object} oEnableInPlaceForClassicUIs
     *   The enableInPlaceForClassicUIs configuration setting for the
     *   ClientSideTargetResolution service configuration
     *
     * @returns {object}
     *   An object containing information about the next navigation mode and
     *   whether this is to pass through NavTargetResolution.
     *   <br />
     *   This is an object that can contain one or more of the followings:
     *   <pre>
     *   {
     *        explicitNavMode: true,      // use the specified navigationMode
     *        navigationMode: "embedded", // the (internal) navigation mode
     *                                    // used for the resolved target
     *        "sap-ushell-next-navmode": "explace"
     *   }
     *   </pre>
     */
    oExport.compute = function (sNextApplicationType, sExternalNextNavigationMode, sExternalNavigationMode, sApplicationType, oEnableInPlaceForClassicUIs) {
        var sInternalNavigationMode,
            bLegacyToLegacyNavigation;

        _validateServiceConfiguration(oEnableInPlaceForClassicUIs);
        var oNavigationMode = {};

        if (["inplace", "explace"].indexOf(sExternalNextNavigationMode) >= 0) {
            oNavigationMode["sap-ushell-next-navmode"] = sExternalNextNavigationMode;
        }

        if (["inplace", "explace", "frameless"].indexOf(sExternalNavigationMode) >= 0) {
            sInternalNavigationMode = oExport._getInternalNavigationMode(sExternalNavigationMode, sNextApplicationType);

            Log.debug(
                "Navigation mode was forced to " + sInternalNavigationMode,
                "because sap-ushell-navmode parameter was set to " + sExternalNavigationMode
                + " for target with applicationType: " + sApplicationType,
                "sap.ushell.navigationMode"
            );

            oNavigationMode.navigationMode = sInternalNavigationMode;
            oNavigationMode.explicitNavMode = true;

            return oNavigationMode;
        }

        bLegacyToLegacyNavigation =
            oExport._isLegacyApplicationType(sApplicationType) && oExport._isLegacyApplicationType(sNextApplicationType);

        if (_isInplaceEnabledForApplicationType(oEnableInPlaceForClassicUIs, sNextApplicationType) === true
            /* important */ && !bLegacyToLegacyNavigation) {
            oNavigationMode.navigationMode = "embedded";
        }

        return oNavigationMode;
    };

    /**
     * Determine the internal navigation mode for a given navigation mode.
     *
     * @param {string} sExternalNavigationMode
     *    A string identifying the external navigation mode. This is normally
     *    the value of the sap-ushell-next-navmode parameter configured in a
     *    matched inbound or provided in the intent.
     *
     *    This string can be one of:
     *    <ul>
     *       <li>explace</li>
     *       <li>inplace</li>
     *       <li>frameless</li>
     *    </ul>
     *
     * @param {string} sApplicationType
     *    The application type of the inbound that has
     *    <code>sExternalNavigationMode</code> configured.
     *
     * @return {string}
     *
     *    The corresponding internal navigation mode. Can be one of the followings:
     *
     *    <ul>
     *      <li>replace: "take the URL of this target and replace it with the FLP"</li>
     *      <li>newWindow: "open a new window and put the URL of this target in the address bar"</li>
     *      <li>embedded: "embed this target (not merely its URL) into the current FLP"</li>
     *      <li>newWindowThenEmbedded: "open an FLP in a new window and embed this target (not merely its URL) into it"</li>
     *    </ul>
     *
     *    Returns null and logs an error in case wrong input parameters were given.
     *
     * @private
     */
    oExport._getInternalNavigationMode = function (sExternalNavigationMode, sApplicationType) {
        var oInternalNavigationModeMap = {
            SAPUI5: {
                inplace: "embedded",
                explace: "newWindowThenEmbedded",
                frameless: "newWindowThenEmbedded"
            },
            WDA: {
                inplace: "embedded",
                explace: "newWindowThenEmbedded",
                frameless: "newWindow"
            },
            TR: {
                inplace: "embedded",
                explace: "newWindowThenEmbedded",
                frameless: "newWindow"
            },
            URL: {
                inplace: "embedded",
                explace: "newWindow",
                frameless: "newWindow"
            },
            WCF: {
                inplace: "embedded",
                explace: "newWindowThenEmbedded",
                frameless: "newWindow"
            }
        };

        if (!oInternalNavigationModeMap.hasOwnProperty(sApplicationType)) {
            Log.error(
                sApplicationType + " is not a valid application type",
                "expected one of " + Object.keys(oInternalNavigationModeMap).join(", "),
                "sap.ushell.navigationMode"
            );
            return null;
        }

        if (sExternalNavigationMode !== "inplace" && sExternalNavigationMode !== "explace" && sExternalNavigationMode !== "frameless") {
            Log.error(
                sExternalNavigationMode + " is not a valid external navigation mode",
                "expected one of 'inplace', 'explace' or 'frameless'",
                "sap.ushell.navigationMode"
            );
            return null;
        }

        if (sApplicationType === "SAPUI5" && sExternalNavigationMode === "frameless") {
            Log.error(
                "'" + sExternalNavigationMode + "' is not a valid external navigation mode for application type '" + sApplicationType + "'",
                "falling back to internal navigation mode '" + oInternalNavigationModeMap.SAPUI5.frameless + "'",
                "sap.ushell.navigationMode"
            );
        }

        return oInternalNavigationModeMap[sApplicationType][sExternalNavigationMode];
    };

    /**
     * Returns the external navigation mode corresponding to an internal
     * navigation node.
     *
     * @param {string} sInternalNavigationMode
     *  the navigation mode used at runtime, for example,
     *  "newWindowThenEmbedded".
     *
     * @return {string}
     *  the corresponding external navigation mode. Can be "inplace" or
     *  "explace".
     *
     * @private
     */
    oExport.getExternalNavigationMode = function (sInternalNavigationMode) {
        var oExternalNavigationModeMap = {
            embedded: "inplace",
            newWindowThenEmbedded: "explace",
            replace: "inplace",
            newWindow: "explace"
        };

        if (!oExternalNavigationModeMap.hasOwnProperty(sInternalNavigationMode)) {
            Log.error(
                sInternalNavigationMode + " is not a recognized internal navigation mode",
                "expected one of " + Object.keys(oExternalNavigationModeMap).join(","),
                "sap.ushell.navigationMode"
            );
            return null;
        }

        return oExternalNavigationModeMap[sInternalNavigationMode];
    };

    var aWDAGUIAppType = ["NWBC", "WDA", "TR", "WCF"];

    /**
     * Returns the navigation mode of a given resolved hash fragment
     *
     * @param {object} oResolvedHashFragment
     *     the hash fragment resolved by one of the registered resolvers
     *
     * @param {object} [oCurrentlyOpenedApp]
     *     an object describing the currently opened app
     *
     * @returns {string}
     *     the navigation mode for the given hash fragment. Returns the
     *     following values, each corresponding to a specific way the
     *     application should be navigated to:
     *
     *     <ul>
     *         <li><code>"embedded"</code>: the application should be
     *         opened in the current window, and rendered within the
     *         launchpad shell.</li>
     *
     *         <li><code>"newWindow"</code>: the application should be
     *         rendered in a new window, but no launchpad header must be
     *         present.</li>
     *
     *         <li><code>"newWindowThenEmbedded"</code>: the application
     *         should be opened in a new window but rendered within the
     *         launchpad shell.</li>
     *
     *         <li><code>undefined</code>: it was not possible to determine
     *         a navigation mode for the app. An error should be displayed
     *         in this case.</li>
     *     </ul>
     *
     * @private
     */
    oExport.getNavigationMode = function (oResolvedHashFragment, oCurrentlyOpenedApp) {
        var sAdditionalInformation = oResolvedHashFragment.additionalInformation,
            sApplicationType = oResolvedHashFragment.applicationType,
            sUi5ComponentPart,
            sUi5ComponentRegex;

        if (aWDAGUIAppType.indexOf((oCurrentlyOpenedApp || {}).applicationType) > -1
            && !(oCurrentlyOpenedApp || {}).explicitNavMode) {
            return "newWindowThenEmbedded";
        }

        if (oResolvedHashFragment.appCapabilities && oResolvedHashFragment.appCapabilities.navigationMode) {
            return oResolvedHashFragment.appCapabilities.navigationMode;
        }

        if ((sAdditionalInformation === null || typeof sAdditionalInformation === "string" || typeof sAdditionalInformation === "undefined") &&
            (sApplicationType === "URL" || sApplicationType === "SAPUI5")) {
            /*
             * NOTE: The "managed=" and "SAPUI5.Component=" cases are
             * skipped if the additionalInformation field does not start
             * exactly with the "managed=" and "SAPUI5.Component=" values;
             */

            // managed= case(s)
            if (sAdditionalInformation && sAdditionalInformation.indexOf("managed=") === 0) {
                if (sAdditionalInformation === "managed=FioriWave1") {
                    return "embedded";
                }

                if (sAdditionalInformation === "managed=") {
                    return "newWindow";
                }

                return undefined;
            }

            // UI5 component case
            if (sAdditionalInformation && sAdditionalInformation.indexOf("SAPUI5.Component=") === 0) {
                sUi5ComponentPart = "[a-zA-Z0-9_]+";
                sUi5ComponentRegex = [
                    "^SAPUI5.Component=", // starts with SAPUI5.Component=
                    sUi5ComponentPart, // at least one part
                    "([.]", sUi5ComponentPart, ")*$" // multiple dot-separated parts
                ].join("");

                if (!(new RegExp(sUi5ComponentRegex)).test(sAdditionalInformation)) {
                    Log.warning(["The UI5 component name in",
                        sAdditionalInformation, "is not valid.",
                        "Please use names satisfying", sUi5ComponentRegex
                    ].join(" "));
                }

                return "embedded";
            }

            return "newWindow";
        }

        // NWBC, WDA, TR
        if (aWDAGUIAppType.indexOf(sApplicationType) > -1) {
            return "newWindowThenEmbedded";
        }

        // default
        return undefined;
    };

    /**
     * Computes the navigation mode for all types of applications
     *
     * @param {string} sApplicationType
     *  the application type of the tile
     *
     * @param {string} sAdditionalInformation
     *  additional information about the tile
     *
     * @param {boolean} bIsApplicationTypeConfiguredInPlace
     *  configuration of Classic UI technology for this application type
     *
     * @returns {string}
     *  the computed navigation mode for homepage tiles
     *
     * @private
     */
    oExport.computeNavigationModeForHomepageTiles = function (sApplicationType, sAdditionalInformation, bIsApplicationTypeConfiguredInPlace) {
        var oResolvedHashFragment = {
            applicationType: sApplicationType,
            additionalInformation: sAdditionalInformation
        };

        if (aWDAGUIAppType.indexOf(sApplicationType) > -1 && bIsApplicationTypeConfiguredInPlace) {
            return "embedded";
        }

        return this.getNavigationMode(oResolvedHashFragment);
    };

    return oExport;
}, false);
