/*
 * Static class with reusable checks to collect data from Fiori Elements application.
 */
sap.ui.define([
	"sap/suite/ui/generic/template/support/lib/CommonMethods",
	"sap/ui/Global",
	"sap/suite/ui/generic/template/genericUtilities/polyFill"
], function (CommonMethods) {
	"use strict";

	// ------------------------------------ Variables & Constants ------------------------------------
	// map for different supported application floorplans
	var mFloorplans = {
		UNKNOWN: "Unknown",
		LISTREPORT: "sap.suite.ui.generic.template.ListReport",
		ANALYTICALLISTPAGE: "sap.suite.ui.generic.template.AnalyticalListPage",
		OVERVIEWPAGE: "sap.ovp"
	};

	var mTicketComponents = {
		UNKNOWN: "CA-UI5-ST",
		LISTREPORT: "CA-UI5-ST",
		ANALYTICALLISTPAGE: "CA-UI5-ST-ALP",
		OVERVIEWPAGE: "CA-UI5-ST-OVP"
	};

	// ------------------------------------ Checks ------------------------------------
	/**
	 * Returns current version of loaded UI5 instance
	 *
	 * @returns {object} UI5 versioninfo
	 */
	function fnGetUI5VersionInfo() {
		return sap.ui.getVersionInfo();
	}

	/**
	 * Returns application component read from given manifest.
	 *
	 * @param {object} oManifest manifest as object
	 * @returns {string} application component name
	 */
	function fnGetApplicationComponentByManifest(oManifest) {
		return (oManifest && oManifest["sap.app"] && oManifest["sap.app"].ach) ? oManifest["sap.app"].ach : "";
	}

	/**
	 * Returns application ID read from given manifest.
	 *
	 * @param {object} oManifest manifest as object
	 * @returns {string} application ID
	 */
	function fnGetApplicationIDByManifest(oManifest) {
		if (oManifest && oManifest["sap.app"] && oManifest["sap.app"].id) {
			if (oManifest["sap.app"].id === "${project" + ".artifactId}") {
				return fnGetComponentIDByStructure();
			}
			return oManifest["sap.app"].id;
		}
		return "";
	}

	/**
	 * Returns registered IDs read from given manifest and empty array if no registered IDs were found.
	 *
	 * @param {object} oManifest manifest as object
	 * @returns {array} registered IDs
	 */
	function fnGetRegistrationIDsByManifest(oManifest) {
		return (oManifest && oManifest["sap.fiori"] && oManifest["sap.fiori"].registrationIds && oManifest["sap.fiori"].registrationIds.length > 0) ? oManifest["sap.fiori"].registrationIds : [];
	}

	/**
	 * Returns id read from given XML view. Must only be used as workaorund for local demo apps which do not have
	 * a real application id.
	 *
	 * @private
	 * @param {jQuery} $View view reference
	 * @param {string} sPattern pattern which should match view ID
	 * @returns {string} application id
	 */
	function getIdFromView($View, sPattern) {
		for (var i = 0; i < $View.length; i++) {
			if ($View[i] && $View[i].id && $View[i].id.indexOf(sPattern) !== -1) {
				return $View[i].id.split("::")[0];
			}
		}
		return "";
	}

	/**
	 * Returns manifest loaded from core.
	 *
	 * @returns {object} oManifest
	 */
	function fnGetManifestByStructure() {
		var xmlView = document.querySelectorAll(".sapUiXMLView"),				// jQuery object: all XML views in current application
			ovpWrapper = document.querySelectorAll(".ovpWrapper"),			// jQuery object: OVP wrapper, only set in OVP applications
			sPattern = "::sap.suite.ui.generic.template",	// id pattern which only occurs in ALP/LR applications
			oManifest;										// manifest object

		if (ovpWrapper && ovpWrapper.length && ovpWrapper.length > 0) {
			// OVP
			xmlView = [];
			// Function NodeList.forEach is not supported in IE11 so we are
			// Using polyFill which we have injected as dependency.
			ovpWrapper.forEach(
				function (ovpWrapperObj){
					if (ovpWrapperObj.closest(".sapUiXMLView")) {
						xmlView.push(ovpWrapperObj.closest(".sapUiXMLView"));
					}
			}
				);// TODO: replace 'closest' for IE11 compatibility, use e.g. jQuery.parents or jQuery.parent instead
			if (xmlView
				&& xmlView.length
				&& xmlView.length > 0
				&& xmlView[0]
				&& xmlView[0].id
				&& sap.ui.getCore().byId(xmlView[0].id)
				&& sap.ui.getCore().byId(xmlView[0].id).getController()
				&& sap.ui.getCore().byId(xmlView[0].id).getController().getOwnerComponent()
				&& sap.ui.getCore().byId(xmlView[0].id).getController().getOwnerComponent().getMetadata()
				&& sap.ui.getCore().byId(xmlView[0].id).getController().getOwnerComponent().getMetadata().getManifest()) {

				oManifest = sap.ui.getCore().byId(xmlView[0].id).getController().getOwnerComponent().getMetadata().getManifest();
			} else {
				// Detected OVP structure in DOM but could not load manifest from core!
				return undefined;
			}
		} else if (xmlView && xmlView.length && xmlView.length > 0) {
			// ALP or LR
			for (var i = 0; i < xmlView.length; i++) {
				if (xmlView[i].id.indexOf(sPattern) !== -1) {
					if (sap.ui.getCore().byId(xmlView[i].id)
						&& sap.ui.getCore().byId(xmlView[i].id).getController()
						&& sap.ui.getCore().byId(xmlView[i].id).getController().getOwnerComponent()
						&& sap.ui.getCore().byId(xmlView[i].id).getController().getOwnerComponent().getAppComponent()
						&& sap.ui.getCore().byId(xmlView[i].id).getController().getOwnerComponent().getAppComponent().getMetadata()
						&& sap.ui.getCore().byId(xmlView[i].id).getController().getOwnerComponent().getAppComponent().getMetadata().getManifest()) {

						oManifest = sap.ui.getCore().byId(xmlView[i].id).getController().getOwnerComponent().getAppComponent().getMetadata().getManifest();
						break;
					}
				}
			}

			// component with this id is not registered at core instance
			if (!oManifest || !CommonMethods.hasObjectContent(oManifest)) {
				// Detected ALP or LR structure in DOM but could not load manifest from core!
				return undefined;
			}

			// replace placeholder id's from demo apps
			if (oManifest
				&& CommonMethods.hasObjectContent(oManifest)
				&& oManifest["sap.app"]
				&& oManifest["sap.app"].id
				&& oManifest["sap.app"].id === "${project" + ".artifactId}") {
				oManifest["sap.app"].id = getIdFromView(xmlView, sPattern);
			}
		} else {
			return undefined;
		}

		return oManifest;
	}

	/**
	 * Returns id of current viewed application at window instance. If no valid XML view found, empty string is returned.
	 *
	 * @returns {string} id of current viewed application at window instance
	 */
	function fnGetComponentIDByStructure() {
		var oManifest = fnGetManifestByStructure(),
			xmlView, ovpWrapper,
			sPattern = "::sap.suite.ui.generic.template"; 		// id pattern which only occurs in ALP/LR applications
		if (oManifest && CommonMethods.hasObjectContent(oManifest) && oManifest["sap.app"] && oManifest["sap.app"].id) {
			xmlView = document.querySelectorAll(".sapUiXMLView");				// jQuery object: all XML views in current application
			ovpWrapper = document.querySelectorAll(".ovpWrapper");				// jQuery object: OVP wrapper, only set in OVP applications
			if (ovpWrapper && ovpWrapper.length && ovpWrapper.length > 0) {
				xmlView = [];
				ovpWrapper.forEach(
					function (ovpWrapper ){
						if (ovpWrapper.closest(".sapUiXMLView")) {
							xmlView.push(ovpWrapper.closest(".sapUiXMLView"));
						}
				});
			}
			if (xmlView && xmlView.length && xmlView.length > 0) {
				return getIdFromView(xmlView, sPattern);
			}
		}
		return "";
	}

	/**
	 * Returns local path to manifest.json of the component which is identified by its id
	 *
	 * @param {string} sAppId id of app
	 * @returns {string} local path
	 */
	function fnGetManifestPath(sAppId) {
		if (!sAppId) {
			return "";
		}
		return sap.ui.require.toUrl(sAppId) + "/manifest.json";
	}

	/**
	 * Returns absolute URL to manifest.json for given parameters.
	 * When sManifestPath is path-relative (starts with "./" or "../"), the full pathname to current file will be included.
	 * Otherwise sManifestPath is host-relative (starts with "/") so sPathname will be ignored.
	 *
	 * @param {string} sOrigin protocol & hostname of window instance
	 * @param {string} sPathname local logical folder path on host
	 * @param {string} sManifestPath path to manifest.json from local logical folder path on host
	 * @returns {string} complete URL to manifest.json
	 */
	function fnGetManifestURL(sOrigin, sPathname, sManifestPath) {
		// check if mandatory values are not empty
		if (!sOrigin || !sManifestPath) {
			return "";
		}

		// sManifestPath is relative to current file
		if (sManifestPath.indexOf("./") === 0 || sManifestPath.indexOf("../") === 0) {
			// check if sPathname is not empty
			if (!sPathname) {
				return "";
			}
			return sOrigin + sPathname.substring(0, sPathname.lastIndexOf("/") + 1) + sManifestPath;
		}

		// sManifestPath is absolute
		if (sManifestPath.indexOf("/") === 0) {
			return sOrigin + sManifestPath;
		}

		// sManifestPath is not a valid path
		return "";
	}

	/**
	 * Returns root path of application be removing "manifest.json" from given absolute manifest.json URL.
	 *
	 * @param {string} sManifestPath absolute URL to manifest.json, can be received by using public method sap.suite.ui.generic.template.support.lib.CommonChecks.getManifestURL()
	 * @returns {string} absolute URL to applications root folder, if any
	 */
	function fnGetRootPath(sManifestPath) {
		if (sManifestPath) {
			return sManifestPath.replace("manifest.json", "");
		}
		return "";
	}

	/**
	 * Returns whether given floorplan is valid floorplan.
	 *
	 * @param {sap.suite.ui.generic.template.support.lib.CommonChecks.mFloorplans} sFloorplan floorplan
	 * @returns {boolean} true if given floorplan is valid, otherwise false
	 */
	function fnIsValidFloorplan(sFloorplan) {
		if (!sFloorplan) {
			return false;
		}

		for (var iKey in mFloorplans) {
			if (!mFloorplans.hasOwnProperty(iKey)) {
				continue;
			}
			if (mFloorplans[iKey] === sFloorplan) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Returns ticket component for given floorplan.
	 *
	 * @see sap.suite.ui.generic.template.support.lib.CommonChecks.mFloorplans
	 * @param {sap.suite.ui.generic.template.support.lib.CommonChecks.mFloorplans} sFloorplan floorplan
	 * @returns {string} ticket component
	 */
	function fnGetTicketComponentForFloorplan(sFloorplan) {
		if (sFloorplan === mFloorplans.UNKNOWN) {
			return mTicketComponents.UNKNOWN;
		} else if (sFloorplan === mFloorplans.LISTREPORT) {
			return mTicketComponents.LISTREPORT;
		} else if (sFloorplan === mFloorplans.ANALYTICALLISTPAGE) {
			return mTicketComponents.ANALYTICALLISTPAGE;
		} else if (sFloorplan === mFloorplans.OVERVIEWPAGE) {
			return mTicketComponents.OVERVIEWPAGE;
		} else {
			return mTicketComponents.UNKNOWN;
		}
	}

	/**
	 * Returns whether application is based on OverviewPage template by parsing manifest.
	 *
	 * @param {object} oManifest manifest object
	 * @returns {boolean} true if OverviewPage, otherwise false
	 */
	function fnIsOverviewPageByManifest(oManifest) {
		return oManifest && oManifest.hasOwnProperty("sap.ovp") && Object.keys(oManifest["sap.ovp"]).length !== 0;
	}

	/**
	 * Returns whether application is based on ListReport template by parsing manifest.
	 *
	 * @param {object} oManifest manifest object
	 * @returns {boolean} true if ListReport, otherwise false
	 */
	function fnIsListReportByManifest(oManifest) {
		if (!(oManifest
			&& oManifest["sap.ui.generic.app"]
			&& oManifest["sap.ui.generic.app"].pages
			&& oManifest["sap.ui.generic.app"].pages !== [])) {
			return false;
		}
		var aPages = oManifest["sap.ui.generic.app"].pages;

		for (var iKey in aPages) {
			if (aPages.hasOwnProperty(iKey)) {
				if (aPages[iKey]
					&& aPages[iKey].component
					&& aPages[iKey].component.name
					&& aPages[iKey].component.name === "sap.suite.ui.generic.template.ListReport") {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Returns whether application is based on AnalyticalListPage template by parsing manifest.
	 *
	 * @param {object} oManifest manifest object
	 * @returns {boolean} true if AnalyticalListPage, otherwise false
	 */
	function fnIsAnalyticalListPageByManifest(oManifest) {
		if (!(oManifest
			&& oManifest["sap.ui.generic.app"]
			&& oManifest["sap.ui.generic.app"].pages
			&& oManifest["sap.ui.generic.app"].pages !== [])) {
			return false;
		}
		var aPages = oManifest["sap.ui.generic.app"].pages;

		for (var iKey in aPages) {
			if (aPages.hasOwnProperty(iKey)) {
				if (aPages[iKey]
					&& aPages[iKey].component
					&& aPages[iKey].component.name
					&& aPages[iKey].component.name === "sap.suite.ui.generic.template.AnalyticalListPage") {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Returns floorplan used by current application by parsing manifest.
	 *
	 * @param {object} oManifest manifest object
	 * @returns {string} mApplicationType
	 */
	function fnGetFloorplanByManifest(oManifest) {
		if (oManifest) {
			if (fnIsOverviewPageByManifest(oManifest)) {
				return mFloorplans.OVERVIEWPAGE;
			} else if (fnIsListReportByManifest(oManifest)) {
				return mFloorplans.LISTREPORT;
			} else if (fnIsAnalyticalListPageByManifest(oManifest)) {
				return mFloorplans.ANALYTICALLISTPAGE;
			}
		}
		return mFloorplans.UNKNOWN;
	}

	/**
	 * Returns whether application is based on OverviewPage template by loading manifest from DOM structure and parsing it.
	 *
	 * @returns {boolean} true if OverviewPage, otherwise false
	 */
	function fnIsOverviewPageByStructure() {
		return fnIsOverviewPageByManifest(fnGetManifestByStructure());
	}

	/**
	 * Returns whether application is based on ListReport template by loading manifest from DOM structure and parsing it.
	 *
	 * @returns {boolean} true if ListReport, otherwise false
	 */
	function fnIsListReportByStructure() {
		return fnIsListReportByManifest(fnGetManifestByStructure());
	}

	/**
	 * Returns whether application is based on AnalyticalListPage template by loading manifest from DOM structure and parsing it.
	 *
	 * @returns {boolean} true if AnalyticalListPage, otherwise false
	 */
	function fnIsAnalyticalListPageByStructure() {
		return fnIsAnalyticalListPageByManifest(fnGetManifestByStructure());
	}

	/**
	 * Returns floorplan used by current application by loading manifest from DOM structure and parsing it.
	 *
	 * @returns {string} mApplicationType
	 */
	function fnGetFloorplanByStructure() {
		var oManifest = fnGetManifestByStructure();
		// Use "loading by manifest" because "loading by structure" would call getManifest() 3x times (performance).
		if (fnIsOverviewPageByManifest(oManifest)) {
			return mFloorplans.OVERVIEWPAGE;
		} else if (fnIsListReportByManifest(oManifest)) {
			return mFloorplans.LISTREPORT;
		} else if (fnIsAnalyticalListPageByManifest(oManifest)) {
			return mFloorplans.ANALYTICALLISTPAGE;
		}
		return mFloorplans.UNKNOWN;
	}

	return {
		mFloorplans: mFloorplans,
		mTicketComponents: mTicketComponents,

		getUI5VersionInfo: fnGetUI5VersionInfo,
		getApplicationComponentByManifest: fnGetApplicationComponentByManifest,
		getApplicationIDByManifest: fnGetApplicationIDByManifest,
		getRegistrationIDsByManifest: fnGetRegistrationIDsByManifest,
		getComponentIDByStructure: fnGetComponentIDByStructure,
		getManifestByStructure: fnGetManifestByStructure,
		getManifestPath: fnGetManifestPath,
		getManifestURL: fnGetManifestURL,
		getRootPath: fnGetRootPath,
		isValidFloorplan: fnIsValidFloorplan,
		getTicketComponentForFloorplan: fnGetTicketComponentForFloorplan,

		isOverviewPageByManifest: fnIsOverviewPageByManifest,
		isListReportByManifest: fnIsListReportByManifest,
		isAnalyticalListPageByManifest: fnIsAnalyticalListPageByManifest,
		getFloorplanByManifest: fnGetFloorplanByManifest,

		isOverviewPageByStructure: fnIsOverviewPageByStructure,
		isListReportByStructure: fnIsListReportByStructure,
		isAnalyticalListPageByStructure: fnIsAnalyticalListPageByStructure,
		getFloorplanByStructure: fnGetFloorplanByStructure
	};
});
