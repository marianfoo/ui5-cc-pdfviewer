// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/*
 * This module provides a collection of utility functions.
 */
sap.ui.define([], function () {
    "use strict";

    /**
     * The method will fail if the given object has a cyclic reference.
     *
     * @param {Object} o Object to deep freeze; it should not contain a cyclic reference anywhere in its tree.
     * @returns {Object} The given object which is no longer mutable.
     *
     * @private
     */
    function deepFreeze (o) {
        Object.keys(o)
            .filter(function (sProperty) {
                return typeof o[sProperty] === "object";
            })
            .forEach(function (sProperty) {
                o[sProperty] = deepFreeze(o[sProperty]);
            });

        return Object.freeze(o);
    }

    /**
     * Returns the location's origin URL.
     * This is equivalent to reading the value of location.origin
     * (Needed for compatibility reasons)
     *
     * @returns {String} A String containing the canonical form of the origin of the specific location.
     *
     * @private
     */
    function getLocationOrigin () {
        // location.origin might not be supported by all browsers
        return location.protocol + "//" + location.host;
    }

    /**
     * Add trialing slash to the end of path if it is missing
     *
     * @param {String} sPath path
     *
     * @returns {String} The path with a trialing slash
     *
     * @private
     */
    function ensureTrailingSlash (sPath) {
        if ((typeof sPath === "string") && sPath.charAt(sPath.length - 1) !== "/") {
            return sPath + "/";
        }
        return sPath;
    }

    /**
     * Merge the object oConfigToMerge into oMutatedBaseConfig according to
     * sap-ushell-config merge rules. Note that the JSON serialized content of
     * oConfigToMerge is used, thus JSON serialization restrictions apply (e.g.
     * Infinity -> null ). Note that it is thus not possible to remove a
     * property definition or overriding with  {"propname" : undefined}. One
     * has to override with null or 0 etc.
     *
     * Note: Do not use this method for general merging of other objects, as
     * the rules may be enhanced/altered
     *
     * @param {object} oMutatedBaseConfig
     *     the configuration to merge into, modified in place
     * @param {object} oConfigToMerge
     *     the configuration to be merged with oMutatedBaseConfig
     * @param {boolean} bCloneConfigToMerge
     *     whether the oConfigToMerge must be cloned prior to the merge
     * @private
     */
    function mergeConfig (oMutatedBaseConfig, oConfigToMerge, bCloneConfigToMerge) {
        var oActualConfigToMerge;

        if (!oConfigToMerge) {
            return;
        }

        oActualConfigToMerge = bCloneConfigToMerge ? JSON.parse(JSON.stringify(oConfigToMerge)) : oConfigToMerge;

        Object.keys(oActualConfigToMerge).forEach(function (sKey) {
            if (typeof oMutatedBaseConfig[sKey] === "object" && typeof oActualConfigToMerge[sKey] === "object") {
                mergeConfig(oMutatedBaseConfig[sKey], oActualConfigToMerge[sKey], false);
                return;
            }

            oMutatedBaseConfig[sKey] = oActualConfigToMerge[sKey];
        });
    }

    return {
        deepFreeze: deepFreeze,
        getLocationOrigin: getLocationOrigin,
        ensureTrailingSlash: ensureTrailingSlash,
        mergeConfig: mergeConfig
    };
});
