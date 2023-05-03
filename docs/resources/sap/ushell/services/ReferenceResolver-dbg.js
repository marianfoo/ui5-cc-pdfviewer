// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview TODO
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ushell/User",
    "sap/ui/model/odata/ODataUtils",
    "sap/ui/thirdparty/jquery",
    "sap/base/util/isEmptyObject",
    "sap/base/Log"
], function (User, ODataUtils, jQuery, isEmptyObject, Log) {
    "use strict";

    function UserEnvReferenceResolver () {
        /**
         * Resolves the value of the given user env reference.
         *
         * @param {string} sReference
         *    A reference name like <code>User.env.sap-theme</code>
         * @returns {jQuery.Deferred.Promise}
         *    A promise that is always resolved.
         *    resolved, the promise resolves with a rich object like:
         *    <pre>
         *    { value: "some value" }
         *    </pre>
         *    . Otherwise, the promise resolves with an empty object.
         *
         *    The values this resolves to is a string value,which may be undefined
         *    sap-ui-legacy-date-format a value of Domain XUDATFM "1"|"2"|.."9"|"A"|"B"|"C" or undefined
         *    sap-ui-legacy-time-format a value of Domain XUTIMFM "0"|"1"|"2"|"3"|"4"| or undefined
         *    sap-ui-legacy-number-format a value of Domain XUCPFM " "|"X"|"X" or undefined
         *    (for these three, undefined shoudl not occur within a Fiori Launchpad instance,this would indicate a lacking
         *     configuration of the UI5 core).
         *
         *    sap-language  : Two character code representing a SAP Logon language code
         *    sap-languagebcp47 : A bcp47 language/locale settng (e.g "en-GB")
         *    sap-accessiblity: "X" or undefined        (Note: no "false", " " or similar returned, if falsy, return undefined indicating parameter should not be filled on propagation!)
         *    sap-statistics:   "true" or undefined          (Note: no "false" or similar returned! return undefined indicating parameter should not be filled on propagation(
         *
         *    a return value of undefined indicates the parameter should not be added to the url/appstate or similar!
         *
         *
         * @private
         * @since 1.42.0
         */
        this.getValue = function (sReference) {
            var oDeferred = new jQuery.Deferred();
            var sValue;

            if (sReference === "User.env.sap-ui-legacy-date-format") {
                sValue = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyDateFormat();
            }
            if (sReference === "User.env.sap-ui-legacy-number-format") {
                sValue = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyNumberFormat();
            }
            if (sReference === "User.env.sap-ui-legacy-time-format") {
                sValue = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyTimeFormat();
            }
            if (sReference === "User.env.sap-language") {
                sValue = sap.ushell.Container.getUser().getLanguage();
            }
            if (sReference === "User.env.sap-languagebcp47") {
                sValue = sap.ushell.Container.getUser().getLanguageBcp47();
            }
            if (sReference === "User.env.sap-accessibility") {
                sValue = (sap.ushell.Container.getUser().getAccessibilityMode()) ? "X" : undefined;
            }
            if (sReference === "User.env.sap-statistics") {
                sValue = (sap.ui.getCore().getConfiguration().getStatistics()) ? "true" : undefined;
            }
            if (sReference === "User.env.sap-theme") {
                sValue = sap.ushell.Container.getUser().getTheme(User.prototype.constants.themeFormat.THEME_NAME_PLUS_URL);
            }
            if (sReference === "User.env.sap-theme-name") {
                sValue = sap.ushell.Container.getUser().getTheme();
            }
            if (sReference === "User.env.sap-theme-NWBC") {
                sValue = sap.ushell.Container.getUser().getTheme(User.prototype.constants.themeFormat.NWBC);
            }
            oDeferred.resolve({ value: sValue });

            return oDeferred.promise();
        };
    }

    function ReferenceResolver (oContainerInterface, sParameter, oConfig) {
        /**
         * Returns an instance of UserEnvReferenceResolver.
         *
         * @returns {object}
         *    An instance of UserEnvReferenceResolver. The instance is created
         *    only once and stored in this service. This method should be called
         *    at the time the instance is used to avoid creating the instance
         *    if not required.
         *
         * @private
         * @since 1.42.0
         */
        this._getUserEnvReferenceResolver = function () {
            if (!this.oUserEnvReferenceResolver) {
                this.oUserEnvReferenceResolver = new UserEnvReferenceResolver();
            }
            return this.oUserEnvReferenceResolver;
        };

        /**
         * This resolves (finds the value of) all the given reference names.
         *
         * @param {string[]} aReferences
         *    An array of reference names, like <code>["UserDefault.currency", "User.env.sap-theme-name"... ]</code>.
         * @param {object} [oSystemContext] The systemContext
         * @returns {jQuery.Deferred.promise}
         *    <p>A promise that resolves with an object containing all the
         *    resolved references, or is rejected with an error message if it
         *    was not possible to resolve all the references.</p>
         *
         *    <p>The object this promise resolves to maps the full (with prefix)
         *    reference name to its value:</p>
         *    <pre>
         *    {
         *        UserDefault.currency: "EUR",
         *        User.env.sap-theme-name: "sap-belize"
         *        ...
         *    }
         *    </pre>
         *
         * @private
         * @since 1.42.0
         */
        this.resolveReferences = function (aReferences, oSystemContext) {
            var that = this;
            var oDeferred = new jQuery.Deferred();
            var aReferencePromises = [];
            var bAllRefsResolvable = true;
            var oDistinctRefs = {};
            var oDistinctEnvRefs = {};
            var oUserDefaultParametersSrvcPromise = sap.ushell.Container.getServiceAsync("UserDefaultParameters");
            var oResolver,
                oSystemContextPromise;

            if (!oSystemContext) {
                oSystemContextPromise = sap.ushell.Container.getServiceAsync("ClientSideTargetResolution")
                    .then(function (oCstr) {
                        return oCstr.getSystemContext();
                    });
            } else {
                oSystemContextPromise = Promise.resolve(oSystemContext);
            }

            var aRichRefs = aReferences
                .map(function (sRefWithPrefix) {
                    var sRefName;

                    if (sRefWithPrefix.indexOf("User.env.") === 0) {
                        sRefName = sRefWithPrefix;
                        oDistinctEnvRefs[sRefName] = 1;
                    }
                    if (sRefWithPrefix.indexOf("UserDefault.") === 0) {
                        sRefName = that._extractAnyUserDefaultReferenceName(sRefWithPrefix);
                        oDistinctRefs[sRefName] = 1;
                    }

                    if (typeof sRefName !== "string") {
                        bAllRefsResolvable = false;
                        Log.error(
                            "'" + sRefWithPrefix + "' is not a legal reference name", null,
                            "sap.ushell.services.ReferenceResolver"
                        );
                    }
                    return {
                        full: sRefWithPrefix,
                        name: sRefName
                    };
                });

            if (!bAllRefsResolvable) {
                return oDeferred
                    .reject("One or more references could not be resolved")
                    .promise();
            }

            Promise.all([
                oSystemContextPromise,
                oUserDefaultParametersSrvcPromise
            ]).then(function (aResults) {
                var oResolvedSystemContext = aResults[0];
                var oUserDefaultParametersSrvc = aResults[1];

                Object.keys(oDistinctRefs).forEach(function (sName) {
                    aReferencePromises.push(oUserDefaultParametersSrvc.getValue(sName, oResolvedSystemContext));
                });

                Object.keys(oDistinctEnvRefs).forEach(function (sName) {
                    oResolver = oResolver || that._getUserEnvReferenceResolver();
                    aReferencePromises.push(oResolver.getValue(sName));
                });

                jQuery.when.apply(jQuery, aReferencePromises)
                    .done(function () {
                        var oKnownRefs = {};
                        var iIndex = 0,
                            aRefValues = arguments;
                        Object.keys(oDistinctRefs).forEach(function (sName) {
                            oDistinctRefs[sName] = aRefValues[iIndex];
                            iIndex = iIndex + 1;
                        });
                        Object.keys(oDistinctEnvRefs).forEach(function (sName) {
                            oDistinctEnvRefs[sName] = aRefValues[iIndex];
                            iIndex = iIndex + 1;
                        });

                        /*
                        * All parameters retrieved successfully and
                        * stored in arguments.
                        */
                        aRichRefs.forEach(function (oRef) {
                            var oMergedValue;
                            if (oRef.full.indexOf("UserDefault.extended.") === 0) {
                                oMergedValue = that.mergeSimpleAndExtended(oDistinctRefs[oRef.name]);
                                if (!isEmptyObject(oMergedValue)) {
                                    oKnownRefs[oRef.full] = oMergedValue;
                                } else {
                                    // even if no value is provided, the property must exist to indicate that the
                                    // reference could be resolved
                                    oKnownRefs[oRef.full] = undefined;
                                }
                            } else if (oRef.full.indexOf("UserDefault.") === 0) {
                                oKnownRefs[oRef.full] = oDistinctRefs[oRef.name].value;
                            } else if (oRef.full.indexOf("User.env.") === 0) {
                                oKnownRefs[oRef.full] = oDistinctEnvRefs[oRef.name].value;
                            } // one of the above branches must have been hit, there can be no else here,
                            // else  { assert(0); }
                        });
                        oDeferred.resolve(oKnownRefs);
                    });
            });

            return oDeferred.promise();
        };

        /**
         * Extracts the name of a full reference parameter.
         * For example, returns <code>value</code> from
         * <code>UserDefault.value</code> or <code>UserDefault.extended.value</code>.
         *
         * @param {string} sRefParamName
         *    Name of a full reference parameter
         * @returns {string}
         *    The name of the reference parameter extracted from
         *    sRefParamName, or undefined in case this cannot be extracted.
         *
         * @private
         * @since 1.42.0
         */
        this._extractAnyUserDefaultReferenceName = function (sRefParamName) {
            var sParamName = this.extractExtendedUserDefaultReferenceName(sRefParamName);
            if (typeof sParamName === "string") {
                return sParamName;
            }
            return this.extractUserDefaultReferenceName(sRefParamName);
        };

        /**
         * Extracts an extended user default reference name from a reference parameter
         * name. For example, returns <code>value</code> from
         * <code>UserDefault.extended.value</code>, but returns <code>undefined</code>
         * for <code>UserDefault.value</code>.
         *
         * @param {string} sRefParamName
         *    Name of a reference parameter
         * @returns {string}
         *    The name of the user default parameter extracted from
         *    sRefParamName, or undefined in case this cannot be extracted.
         *
         * @private
         * @since 1.42.0
         */
        this.extractExtendedUserDefaultReferenceName = function (sRefParamName) {
            if (typeof sRefParamName !== "string" || sRefParamName.indexOf("UserDefault.extended.") !== 0) {
                return undefined;
            }
            return sRefParamName.replace(/^UserDefault[.]extended[.]/, "");
        };

        /**
         * Extracts the user default reference name from a reference parameter
         * name. For example, returns <code>value</code> from
         * <code>UserDefault.value</code>, but returns <code>undefined</code>
         * for <code>MachineDefault.value</code> or <code>UserDefault.extended.value</code>.
         *
         * @param {string} sRefParamName
         *    Name of a reference parameter
         * @returns {string}
         *    The name of the user default parameter extracted from
         *    sRefParamName, or undefined in case this cannot be extracted.
         *
         * @private
         * @since 1.42.0
         */
        this.extractUserDefaultReferenceName = function (sRefParamName) {
            if (typeof sRefParamName !== "string"
                || sRefParamName.indexOf("UserDefault.") !== 0
                || sRefParamName.indexOf("UserDefault.extended.") === 0) {
                return undefined;
            }
            return sRefParamName.replace(/^UserDefault[.]/, "");
        };

        /**
         * Merges a simple user default value (if present) and the extended value object into a new object.
         * A simple value will even be converted if no extended value is present.
         *
         * @param {object} oValueObject
         *  The value object as returned by {@link sap.ushell.services.UserDefaultParameters#getValue}.
         * @returns {object}
         *  The new object containing the merged values. If no values are present, an empty object is returned.
         * @private
         * @since 1.42.0
         */
        this.mergeSimpleAndExtended = function (oValueObject) {
            var oMergedExtendedObject = jQuery.extend(true, {}, oValueObject.extendedValue);
            if (typeof oValueObject.value === "string") {
                if (!Array.isArray(oMergedExtendedObject.Ranges)) {
                    oMergedExtendedObject.Ranges = [];
                }
                // add simple value as range
                oMergedExtendedObject.Ranges.push({ Sign: "I", Option: "EQ", Low: oValueObject.value, High: null });
            }
            return oMergedExtendedObject;
        };

        /**
         * finds all references in sUrl and returns their edmTypes (if known) and names
         * @param {string} sUrl
         *  Url containing references like
         *  /some/url/?param1={Edm.String%%UserDefault.CompanyCode%%}&param2={Edm.String%%ABC%%}&param2={%%Test%%}
         * @returns {Array<{edmType:string,name:string}>}
         *  array of all found reference edmTypes and names like
         *  <pre>
         *  [
         *      {
         *          edmType: "Edm.String",
         *          name: "UserDefault.CompanyCode",
         *      },
         *      {
         *          edmType: "Edm.String",
         *          name: "ABC",
         *      },
         *      {
         *          name: "Test",
         *      }
         *  ]
         *  </pre>
         *
         * @private
         */
        function findReferences (sUrl) {
            var reReferenceNames = /{([^}%]*%%[^%]+%%)}?/g,
                reGetEdmType = /([^%]*)%%/,
                reGetName = /%%([^%]+)%%/,
                oCurrentMatch,
                oCurrentEdmType,
                oCurrentName,
                aFoundReferences = [];

            // search and collect all found references user default references in the URL
            oCurrentMatch = reReferenceNames.exec(sUrl);
            while (oCurrentMatch) {
                oCurrentEdmType = reGetEdmType.exec(oCurrentMatch[1]);
                oCurrentName = reGetName.exec(oCurrentMatch[1]);

                aFoundReferences.push({ edmType: oCurrentEdmType[1], name: oCurrentName[1] });

                oCurrentMatch = reReferenceNames.exec(sUrl);
            }

            return aFoundReferences;
        }
        /**
         * Resolves Simple User Default Parameter references within the given URL with
         * the users default values. In case the user maintained a value,
         * it is injected (encoded). In case there is no value maintained
         * the value will be empty.
         *
         * @param  {string} sUrl
         *  URL containing User Default parameter names like
         *  /some/url/?param1={%%UserDefault.CompanyCode%%}&param2={Edm.String%%UserDefault.CostCenter%%}&param3={%%abc%%}
         * @param {object} [oSystemContext] The systemContext
         * @returns {jQuery.Deferred} promise
         *  The first argument of the resolved promise is an Object
         *  like:
         *  <pre>
         *  {
         *      url: "/some/url/?param1=1100&param2=&param3={%%abc%%}", // url with resolved User Default parameters like
         *      defaultsWithoutValue: ["UserDefault.CostCenter"], // simple user default which do not have a value
         *      ignoredReferences: ["abc"] // references which are not simple User Defaults
         *  }
         *  </pre>
         *  <p>
         *  In case there is not a value maintained for a simple User Default Reference,
         *  the value becomes an empty ("param2={Edm.String%%UserDefault.CostCenter%%}" becomes "param2=").
         *  In case a references is not a simple User Default, it stays unchanged in
         *  the returned URL ("param3={%%abc%%}" stays unchanged)
         *
         * @methodOf sap.ushell.services.ReferenceResolver#
         * @name resolveUserDefaultParameters
         * @private
         * @alias sap.ushell.services.ReferenceResolver#resolveUserDefaultParameters
         */
        this.resolveUserDefaultParameters = function (sUrl, oSystemContext) {
            var oDeferred = new jQuery.Deferred(),
                aReferences,
                aSimpleUserDefaultReferences,
                aIgnoredReferences = [],
                oUrl;

            /* A typical oDataV2 call:
            *
            * https://services.odata.org/OData/OData.svc/Category(1)/Products?$top=2&$orderby=name
            * _________________________________________/ ___________________/ ___________________/
            *                    |                               |                    |
            *             service root URI                 resource path        query options
            *
            * Only the last two parts are allowed to have UserDefaults in them.
            * If the 2nd part has UserDefaults in it, it uses them inside of brackets.
            * If the 3rd part has UserDefaults in it, it has a questionmark infront.
            * Normal service root URI don't use brackets or questionmarks.
            */

            // if (sUrl === "/some/url?a=20&sap-client={%%UserDefault.client%%}&b={%%UserDefault.client%%}") debugger;
            // checking if the servce root URI conatins and UserDefault references. These will lead to ignored references.
            oUrl = /[^(?]*/.exec(sUrl);
            aReferences = (oUrl === null) ? [] : findReferences(oUrl[0]);

            aReferences.forEach(function (oReference) {
                aIgnoredReferences.push(oReference.name);
            });

            // checking if the resource path or the query path have UserDefault references. These will try to be resolved.
            oUrl = /[(?][^]*/.exec(sUrl);
            aReferences = (oUrl === null) ? [] : findReferences(oUrl[0]);

            var aReferenceNames = [],
                oReferenceEdmTypes = {};

            aReferences.forEach(function (oReference) {
                aReferenceNames.push(oReference.name);
                oReferenceEdmTypes[oReference.name] = oReference.edmType;
            });

            aSimpleUserDefaultReferences = aReferenceNames.filter(function (sReference) {
                if (/^UserDefault\.(?!extended\.).+/.test(sReference)) {
                    return true;
                }
                aIgnoredReferences.push(sReference);
                return false;
            });

            if (aSimpleUserDefaultReferences.length > 0) {
                this.resolveReferences(aSimpleUserDefaultReferences, oSystemContext)
                    .done(function (oResolvedDefaults) {
                        var sResolvedUrl = sUrl,
                            aDefaultsWithoutValue = [];

                        Object.keys(oResolvedDefaults).forEach(function (sDefaultName) {
                            var sOldResolvedUrl,
                                bDefaultWithoutValue = false;

                            // incase the reference is present multiple times (replace all)
                            while (sOldResolvedUrl != sResolvedUrl) {
                                sOldResolvedUrl = sResolvedUrl;

                                if (oResolvedDefaults[sDefaultName] !== undefined) {
                                    // replace the references with the actual value, encoding is required
                                    // to form a valid URL

                                    var sFormattedValue = ODataUtils.formatValue(oResolvedDefaults[sDefaultName], oReferenceEdmTypes[sDefaultName]);

                                    sResolvedUrl = sResolvedUrl.replace("{" + oReferenceEdmTypes[sDefaultName] + "%%" + sDefaultName + "%%}",
                                        window.encodeURIComponent(sFormattedValue));
                                } else {
                                    bDefaultWithoutValue = true;
                                    sResolvedUrl = sResolvedUrl.replace("{" + oReferenceEdmTypes[sDefaultName] + "%%" + sDefaultName + "%%}", "");
                                }
                            }

                            if (bDefaultWithoutValue) {
                                aDefaultsWithoutValue.push(sDefaultName);
                            }
                        });
                        oDeferred.resolve({
                            url: sResolvedUrl,
                            defaultsWithoutValue: aDefaultsWithoutValue,
                            ignoredReferences: aIgnoredReferences
                        });
                    });
            } else {
                oDeferred.resolve({
                    url: sUrl,
                    defaultsWithoutValue: [],
                    ignoredReferences: aIgnoredReferences
                });
            }
            return oDeferred.promise();
        };
    }

    ReferenceResolver.hasNoAdapter = true;
    return ReferenceResolver;
}, true /* bExport */);
