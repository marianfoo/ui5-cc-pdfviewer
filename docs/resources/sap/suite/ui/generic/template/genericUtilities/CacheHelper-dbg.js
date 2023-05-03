/*
* SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
*/
sap.ui.define([
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
    "sap/suite/ui/generic/template/genericUtilities/metadataAnalyser"
], function(FeLogger, metadataAnalyser) {
    "use strict";

	var oFeLogger = new FeLogger("genericUtilities.CacheHelper");
	var oLogger = oFeLogger.getLogger();
	var oLevel = oFeLogger.Level;
	oLogger.setLevel(oLevel.ALL);

    var S_TIMESTAMP_SEPARATOR = "####";

    function writeToLocalStorage (oKey, sValue) {
        try {
                if (window.localStorage) {
                    window.localStorage.removeItem(oKey.key);
                    sValue = oKey.timestamp + S_TIMESTAMP_SEPARATOR + sValue;
                    window.localStorage.setItem(oKey.key, sValue);
                    return true;
                }
            } catch (e) {
                oLogger.error("Locale Storage access resulted into an error");
            }
        return false;
    }
    
    function readFromLocalStorage (oKey) {
        var sValue;
        if (window.localStorage) {
            sValue = window.localStorage.getItem(oKey.key);
            if (sValue) {
                var aParticles = sValue.split(S_TIMESTAMP_SEPARATOR);
                sValue = aParticles[0] === oKey.timestamp ? aParticles[1] : undefined;
            }
        }
        return sValue;
    }
    
    function getCacheKeyPartsAsyc (oModel) {
        var aCacheKeys = [];
        var pGetMetadataLastModified = oModel.metadataLoaded().then(function(mParams) {
            var sCacheKey;
            if (mParams && mParams.lastModified) {
                sCacheKey = new Date(mParams.lastModified).getTime() + "";
            } else {
                oLogger.warning("TemplateComponent: no valid cache key segment last modification date provided by the OData Model");
                sCacheKey = new Date().getTime() + ""; //to keep the application working the current timestamp is used
            }
            return sCacheKey;
        });
        aCacheKeys.push(pGetMetadataLastModified);
    
        var pGetAnnotationsLastModified = oModel.annotationsLoaded().then(function(mParams) {
            var iCacheKey = 0;
            if (mParams) {
                for (var i = 0; i < mParams.length; i++) {
                    if (mParams[i].lastModified) {
                        var iLastModified = new Date(mParams[i].lastModified).getTime();
                        if (iLastModified > iCacheKey) {
                            iCacheKey = iLastModified;
                        }
                    } else {
                        oLogger.warning("No valid cache key segment last modification date provided by OData annotations");                            iCacheKey = new Date().getTime() + ""; //to keep the application working the current timestamp is used
                    }
                }
            }
            if (iCacheKey === 0) {
                oLogger.warning("TemplateComponent: no valid cache key segment last modification date provided by OData annotations");
                iCacheKey = new Date().getTime(); //to keep the application working the current timestamp is used
            }
    
            return iCacheKey + "";
        });
        aCacheKeys.push(pGetAnnotationsLastModified);
    
        return aCacheKeys;
    }
    
    function getCacheKey (sAppId, sEntitySet, aKeys) {
        return {
            key: sAppId + "-" + sEntitySet,
            timestamp: aKeys.join("-")
        };
    }
    
    function writeToLocalStorageAsync(sAppId, sEntitySet, aKeyPromises, sContent) {
        return Promise.all(aKeyPromises).then(function(aKeys) {
            var oKey = getCacheKey(sAppId, sEntitySet, aKeys);
            writeToLocalStorage(oKey, sContent);
        });
    }
    
    /**
    * This method encapsulates both the cases of with or without Content-ID referencing and returns back a promise
    * which on resolve yields an object containing a boolean value contentIdRequestPossible and dependeing
    * on it's assertive value a comma seperated expand nodes.
    * @param:  {string} sEntitySet -  Entity set name
    * @param:  {object} oModel -  Model Object
    * @param:  {string} sAppId - Id for the targetted application
    * @return: {object} Promise Object which on resolve yields an object containing a boolean value 
    * contentIdRequestPossible and dependeing on it's assertive value a comma seperated expand nodes.
    */
    function getInfoForContentIdPromise (sEntitySet, oModel, sAppId) {
        if (metadataAnalyser.isContentIdReferencingAllowed(oModel)) {
            var aCacheKeys = getCacheKeyPartsAsyc(oModel);
            return Promise.all(aCacheKeys).then(function(aRetriveKeys) {
                var oKey = getCacheKey(sAppId, sEntitySet, aRetriveKeys);
                return {
                    contentIdRequestPossible: true,
                    parametersForContentIdRequest: {
                        sRootExpand : readFromLocalStorage(oKey)
                    } 
                };
            });
        }
        return Promise.resolve({contentIdRequestPossible: false});
    }
    
    return {
        writeToLocalStorageAsync: writeToLocalStorageAsync,
        getInfoForContentIdPromise: getInfoForContentIdPromise,
        getCacheKey: getCacheKey,
        getCacheKeyPartsAsyc: getCacheKeyPartsAsyc,
        readFromLocalStorage: readFromLocalStorage,
        writeToLocalStorage: writeToLocalStorage
    };

});
