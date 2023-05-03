/*
 * Static class with reusable methods for Fiori Elements application.
 */
sap.ui.define([	"sap/suite/ui/generic/template/genericUtilities/FeLogger", "sap/suite/ui/generic/template/genericUtilities/AjaxHelper"], function (FeLogger, AjaxHelper) {
	"use strict";
	var oLogger = new FeLogger("support.lib.CommonMethods").getLogger();

	// ------------------------------------ Variables & Constants ------------------------------------
	// map for possible applications statuses
	var mApplicationStatus = {
		UNKNOWN: "Unknown",
		FAILED: "Failed",
		LOADING: "Loading",
		RENDERED: "Rendered"
	};

	// current application status
	var oApplicationStatus = mApplicationStatus.UNKNOWN;

	// current app component
	var oAppComponent = {};

	// ------------------------------------ Methods ------------------------------------
	/**
	 * Returns function to compare two generic properties. Use this method to sort an array by parameter sProperty
	 * ascending. To order descending, prepend sProperty with "-". If element[sProperty] == 0, other element becomes
	 * more important.
	 *
	 * @param {string} sProperty name of property to compare elements with
	 * @returns {Function} compares two objects by specified property
	 */
	function fnGetDynamicComparator(sProperty) {
		// ascending: iSortOrder = 1, descending: iSortOrder = -1
		var iSortOrder = 1;
		if (sProperty[0] === "-") {
			iSortOrder = -1;
			sProperty = sProperty.substr(1);
		}

		// compare function for obj.sort(fnCompare())
		return function (a, b) {
			if (!a[sProperty]) {
				// sort order of object a is not given (falsy)
				// => ascending: return 1 to sort to the end
				// => descending: return -1 to sort to the end
				return (iSortOrder === 1 ? 1 : -1);
			} else if (!b[sProperty]) {
				// sort order of object b is not given (falsy)
				// => ascending: return -1 to sort to the end
				// => descending: return 1 to sort to the end
				return (iSortOrder === 1 ? -1 : 1);
			}

			// sort order of a and b are available and truthy => sort normal
			var iResult = 0;
			if (a[sProperty] < b[sProperty]) {
				iResult = -1;
			} else if (a[sProperty] > b[sProperty]) {
				iResult = 1;
			}
			return iResult * iSortOrder;
		};
	}

	/**
	 * Loads file from given uri (local path or URL) sPath via AJAX call and returns promise.
	 *
	 * @param {string} sPath path to manifest.json
	 * @returns {object} promise
	 */
	function fnGetFileFromURI(sPath) {
		if (sPath) {
			return AjaxHelper.getJSON(sPath);
		}
		return undefined;
	}

	/**
	 * Returns whether given application status is valid or not.
	 *
	 * @param {string} sStatus application status
	 * @returns {boolean} true if application status is valid, otherwise false
	 */
	function fnIsValidApplicationStatus(sStatus) {
		for (var iIndex in mApplicationStatus) {
			if (mApplicationStatus[iIndex] === sStatus) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Returns current application status.
	 *
	 * @returns {sap.suite.ui.generic.template.support.lib.CommonMethods.mApplicationStatus} application status
	 */
	function fnGetApplicationStatus() {
		return oApplicationStatus;
	}

	/**
	 * Sets current application status and returns success.
	 *
	 * @param {string} sStatus application status
	 * @see sap.suite.ui.generic.template.support.lib.CommonMethods.mApplicationStatus
	 */
	function fnSetApplicationStatus(sStatus) {
		oApplicationStatus = fnIsValidApplicationStatus(sStatus) ? sStatus : mApplicationStatus.UNKNOWN;
	}

	/**
	 * Returns current app component.
	 *
	 * @returns {object} app component
	 */
	function fnGetAppComponent() {
		return oAppComponent;
	}

	/**
	 * Sets current app component.
	 *
	 * @param {object} oComponent current app component
	 * @returns {boolean} true if successful
	 */
	function fnSetAppComponent(oComponent) {
		oAppComponent = oComponent;
		return true;
	}

	/**
	 * This function sends the specified global event at core level in application instance.
	 *
	 * @param {string} sChannel channel the event should be send on
	 * @param {string} sEvent event which should be send
	 * @param {object} oData data which should be send with the event
	 */
	function fnPublishEvent(sChannel, sEvent, oData) {
		oLogger.info("Global event '" + sEvent + "' published on channel '" + sChannel + "'");
		sap.ui.getCore().getEventBus().publish(sChannel, sEvent, oData);
	}

	/**
	 * Concatenates strings given as array by separating these with ", ".
	 *
	 * @param {array} aStrings strings to concatenate
	 * @returns {string} concatenated strings
	 */
	function fnConcatStrings(aStrings) {
		if (!aStrings || aStrings.length < 1) {
			return "";
		}

		var sConcatenated = "";
		for (var iIndex = 0; iIndex < aStrings.length; iIndex++) {
			// ignore empty strings
			if (!aStrings[iIndex] || !(typeof aStrings[iIndex] === "string")) {
				continue;
			}
			if (sConcatenated) {
				sConcatenated += ", ";
			}
			sConcatenated += aStrings[iIndex];
		}
		return sConcatenated;
	}

	/**
	 * Returns whether given object is empty or not.
	 *
	 * @param {object} oObject object to check
	 * @returns {boolean} true if object is not empty, false if object is empty
	 */
	function fnHasObjectContent(oObject) {
		if (!oObject) {
			return false;
		}
		return Object.keys(oObject).length > 0;
	}

	/**
	 * Returns application name read from hash part of given URL. Name is divided in hash by characters "/", "?", "&" or "~".
	 *
	 * @param {string} sURL URL
	 * @returns {string} application name
	 */
	function fnGetApplicationName(sURL) {
		if (!sURL) {
			return "";
		}
		var aParts = sURL.split("#");
		if (aParts.length < 2) {
			return "";
		} else {
			var sHash = aParts[1];
			var iPosTilde = sHash.indexOf("~");
			var iPosQuestion = sHash.indexOf("?");
			var iPosSlash = sHash.indexOf("/");
			var iPosAmp = sHash.indexOf("&");
			if (iPosTilde && iPosTilde !== -1 && (iPosTilde < iPosQuestion || iPosQuestion === -1) && (iPosTilde < iPosSlash || iPosSlash === -1) && (iPosTilde < iPosAmp || iPosAmp === -1)) {
				return sHash.substr(0, iPosTilde);
			} else if (iPosQuestion && iPosQuestion !== -1 && (iPosQuestion < iPosTilde || iPosTilde === -1) && (iPosQuestion < iPosSlash || iPosSlash === -1) && (iPosQuestion < iPosAmp || iPosAmp === -1)) {
				return sHash.substr(0, iPosQuestion);
			} else if (iPosSlash && iPosSlash !== -1 && (iPosSlash < iPosTilde || iPosTilde === -1) && (iPosSlash < iPosQuestion || iPosQuestion === -1) && (iPosSlash < iPosAmp || iPosAmp === -1)) {
				return sHash.substr(0, iPosSlash);
			} else if (iPosAmp && iPosAmp !== -1 && (iPosAmp < iPosTilde || iPosTilde === -1) && (iPosAmp < iPosQuestion || iPosQuestion === -1) && (iPosAmp < iPosSlash || iPosSlash === -1)) {
				return sHash.substr(0, iPosAmp);
			} else {
				return sHash;
			}
		}
	}

	/**
	 * Shortens URL by cutting off parameters in Hash part of URL.
	 *
	 * @param {string} sURL URL to be shortend
	 * @returns {string} shortened URL
	 */
	function fnShortenURL(sURL) {
		if (!sURL) {
			return "";
		}

		var aParts = sURL.split("#");
		if (aParts.length <= 0) {
			// invalid return value, minimum is 1
			return "";
		} else if (aParts.length === 1) {
			// no hash in URL
			return aParts[0];
		} else {
			// hash found in URL, return host + application name
			return aParts[0] + "#" + fnGetApplicationName(sURL);
		}
	}

	return {
		mApplicationStatus: mApplicationStatus,

		getDynamicComparator: fnGetDynamicComparator,
		getFileFromURI: fnGetFileFromURI,
		isValidApplicationStatus: fnIsValidApplicationStatus,
		getApplicationStatus: fnGetApplicationStatus,
		setApplicationStatus: fnSetApplicationStatus,
		getAppComponent: fnGetAppComponent,
		setAppComponent: fnSetAppComponent,
		publishEvent: fnPublishEvent,
		concatStrings: fnConcatStrings,
		hasObjectContent: fnHasObjectContent,
		getApplicationName: fnGetApplicationName,
		shortenURL: fnShortenURL
	};
});
