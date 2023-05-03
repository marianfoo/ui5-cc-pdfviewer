sap.ui.define([
	"sap/ui/core/support/Plugin",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/suite/ui/generic/template/support/lib/CommonChecks",
	"sap/suite/ui/generic/template/support/lib/CommonMethods",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/base/util/extend",
	"sap/ui/core/mvc/XMLView"
], function (Plugin, DateFormat, JSONModel, MessageToast, CommonChecks, CommonMethods, testableHelper, extend, XMLView) {
	"use strict";

	// ------------------------------------ Variables ------------------------------------
	var sPluginId = "sapUiSupportFioriElementsPluginALPLROP";	// plugin id
	// create a custom space for diagnostic tool and attach it to window for global use
	window.diagnosticToolSpace = {};

	function getMethods(oSupportStub) {
		var oPlugin,										// this plugin object
			sAppHash,										// URL hash for automatic refresh, relevant for IE11 only
			sViewId = sPluginId + "-View",					// plugin view id
			aData = [],										// data to display at tool instance
			oEventBus = sap.ui.getCore().getEventBus(), 	// global event bus instance
			sManifestPath,									// relative path to manifest.json
			sAbsoluteManifestURL,							// absolute URL to manifest.json
			sRootPath,										// absolute URL to applications root path
			oManifest,										// current manifest
			oIntervalTrigger,								// interval trigger
			iTimeout = 10,									// time in seconds until tool will show warning when app did not finish rendering
			iTimeLeft;										// time left until warning is shown

		// ------------------------------------ Miscellaneous ------------------------------------
		/**
		 * Returns sPluginId of "SAP Fiori Elements" plugin
		 *
		 * @returns {string} sPluginId
		 */
		function fnGetId() {
			return sPluginId;
		}

		/**
		 * Converts date given with format YYYYMMddHHss to users local date format
		 *
		 * @param {string} sTimestamp as timestamp with format YYYYMMddHHss
		 * @returns {string} date converted to users local format
		 */
		function fnFormatDate(sTimestamp) {
			var oDateFormat = DateFormat.getDateInstance({
				source: {pattern: "YYYYMMdd"},
				style: "short"
			});
			return oDateFormat.format(oDateFormat.parse(String(sTimestamp).substring(0, 8)));
		}

		/**
		 * Returns absolute URL to manifest.json of current viewed component.
		 *
		 * @param {string} [sId] component id
		 * @returns {string} absolute manifest.json URL
		 */
		function fnGenerateAbsoluteManifestURL(sId) {
			var sOrigin = window.location.origin;
			var sPathname = window.location.pathname;
			// If component id is known, use the given ID. Otherwise try to load component ID from application structure.
			var sComponentId = sId || CommonChecks.getComponentIDByStructure();
			if (sComponentId) {
				sManifestPath = CommonChecks.getManifestPath(sComponentId);
				if (sManifestPath) {
					var sManifestURL = CommonChecks.getManifestURL(sOrigin, sPathname, sManifestPath);
					if (sManifestURL) {
						return sManifestURL;
					}
				}
			}
			return "";
		}

		/**
		 * Adds given parameter as object to aData.
		 *
		 * @param {string} sType type of data, "string" or "link" are valid
		 * @param {string} sName name to display
		 * @param {int} iSortOrder index for ascending order, 1 is highest
		 * @param {string} sValue value to display
		 * @param {string} sTarget if type is link, sTarget is the target of the link
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddToData(sType, sName, iSortOrder, sValue, sTarget) {
			if (sType === "string") {
				aData.push({order: iSortOrder, name: sName, type: sType, value: sValue});
				return true;
			} else if (sType === "link") {
				aData.push({order: iSortOrder, name: sName, type: sType, value: sValue, target: sTarget});
				return true;
			} else if (sType === "group") {
				aData.push({order: iSortOrder, name: sName, type: sType});
				return true;
			}
			return false;
		}

		/**
		 * Wrapper function for function fnAddToData with sType "string"
		 *
		 * @param {string} sName name to display
		 * @param {int} iSortOrder index for ascending order, 1 is highest
		 * @param {string} sValue value to display
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddStringToData(sName, iSortOrder, sValue) {
			return fnAddToData("string", sName, iSortOrder, sValue, "");
		}

		/**
		 * Wrapper function for function fnAddToData with sType "link"
		 *
		 * @param {string} sName name to display
		 * @param {int} iSortOrder index for ascending order, 1 is highest
		 * @param {string} sValue value to display
		 * @param {string} sTarget if type is link, sTarget is the target of the link
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddLinkToData(sName, iSortOrder, sValue, sTarget) {
			return fnAddToData("link", sName, iSortOrder, sValue, sTarget);
		}

		/**
		 * Wrapper function for function fnAddToData with sType "group"
		 *
		 * @param {string} sName name to display
		 * @param {int} iSortOrder index for ascending order, 1 is highest
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddGroupHeaderToData(sName, iSortOrder) {
			return fnAddToData("group", sName, iSortOrder, "", "");
		}

		/**
		 * Returns manifest read from given app component.
		 *
		 * @param {object} oComponent app component
		 * @returns {object} manifest
		 */
		function fnGetManifestFromAppComponent(oComponent) {
			if (!(oComponent && CommonMethods.hasObjectContent(oComponent))) {
				return undefined;
			}
			if (!(oComponent.getMetadata() && CommonMethods.hasObjectContent(oComponent.getMetadata()))) {
				return undefined;
			}
			var oMetadata = oComponent.getMetadata();
			if (!(oMetadata.getManifest() && CommonMethods.hasObjectContent(oMetadata.getManifest()))) {
				return undefined;
			}
			return oMetadata.getManifest();
		}

		/**
		 * Adds error message to aData as single value. All other values will be cleared!
		 *
		 * @param {string} sMessage error message to display
		 */
		function fnDisplayError(sMessage) {
			aData = [];
			fnAddStringToData("Error", 0, sMessage);
			fnTriggerSetData();
		}

		// ------------------------------------ Add Data to Model ------------------------------------
		/**
		 * Adds OpenUI5 version info to aData
		 *
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if some version info was added, otherwise false
		 */
		function fnAddVersionInfo(iSortOrder) {
			try {
				var oUI5Version = CommonChecks.getUI5VersionInfo();
				if (oUI5Version && CommonMethods.hasObjectContent(oUI5Version)) {
					fnAddStringToData("OpenUI5 Version", iSortOrder, oUI5Version.version + " (built at " + fnFormatDate(oUI5Version.buildTimestamp) + ")");
					return true;
				} else {
					fnAddStringToData("OpenUI5 Version", iSortOrder, "ERROR: OpenUI5 version is not available!");
					return false;
				}
			} catch (ex) {
				fnAddStringToData("OpenUI5 Version", iSortOrder, sap.ui.version + ", detailed UI5 version info is not available! Possible reason: missing file \"sap-ui-version.json\"");
				return true;
			}
		}

		/**
		 * Adds application name (#semanticObject-action) to aData.
		 *
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddApplicationName(iSortOrder) {
			var sApplicationName = CommonMethods.getApplicationName(window.location.href);
			if (sApplicationName) {
				fnAddLinkToData("Application URL", iSortOrder, "#" + sApplicationName, window.location.href);
				return true;
			} else {
				fnAddStringToData("Application URL", iSortOrder, "ERROR: Could not extract application name (#semanticObject-action) from URL!");
				return false;
			}
		}

		/**
		 * Adds manifest.json link to aData
		 *
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddManifestLink(iSortOrder) {
			if (sManifestPath && sAbsoluteManifestURL) {
				// shorten relative path
				var sShortenedPath = sManifestPath;
				if (sManifestPath.indexOf("./") === 0) {
					sShortenedPath = sManifestPath.substring(2, sManifestPath.length);
				}
				fnAddLinkToData("Manifest", iSortOrder, sShortenedPath, sAbsoluteManifestURL);
				return true;
			} else {
				// can't load manifest.json URL => show error
				fnAddStringToData("Manifest", iSortOrder, "ERROR: Could not generate link to manifest.json! Possible reason: The application did not finish loading or is not a Fiori Elements application.");
				return false;
			}
		}

		/**
		 * Adds Fiori ID to aData.
		 *
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddFioriID(iSortOrder) {
			if (!(oManifest)) {
				return false;
			}

			var aFioriIDs = CommonChecks.getRegistrationIDsByManifest(oManifest);
			if (aFioriIDs && Array.isArray(aFioriIDs) && aFioriIDs.length > 0) {
				fnAddStringToData((aFioriIDs.length > 1 ? "Fiori IDs" : "Fiori ID"), iSortOrder, CommonMethods.concatStrings(aFioriIDs));
				return true;
			}
			// Notice: These cases should not appear in productive apps as they must have a Fiori ID. They may lead to
			// misunderstandings on test systems with demo apps, which don't have a Fiori ID.
			/*else if (aFioriIDs && Array.isArray(aFioriIDs) && aFioriIDs.length === 0) {
				fnAddStringToData("Fiori ID", iSortOrder, "ERROR: No Fiori ID found at /sap.fiori/registrationIds in manifest.json! Possible reason: Missing Fiori ID");
			} else {
				fnAddStringToData("Fiori ID", iSortOrder, "ERROR: Path /sap.fiori/registrationIds not found in manifest.json! Possible reason: Invalid manifest.json");
			}*/
			return false;
		}

		/**
		 * Adds application component to aData
		 *
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddApplicationComponent(iSortOrder) {
			var sApplicationComponent = CommonChecks.getApplicationComponentByManifest(oManifest);
			if (sApplicationComponent) {
				fnAddStringToData("Application Component (ACH)", iSortOrder, sApplicationComponent);
				return true;
			} else {
				fnAddStringToData("Application Component (ACH)", iSortOrder, "ERROR: Path /sap.app/ach not found in manifest.json! Possible reason: Invalid manifest.json");
				return false;
			}
		}

		/**
		 * Adds application ID to aData
		 *
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddApplicationID(iSortOrder) {
			var sApplicationID = CommonChecks.getApplicationIDByManifest(oManifest);
			if (sApplicationID) {
				fnAddStringToData("Application ID", iSortOrder, sApplicationID);
				return true;
			} else {
				fnAddStringToData("Application ID", iSortOrder, "ERROR: Path /sap.app/id not found in manifest.json! Possible reason: Invalid manifest.json");
				return false;
			}
		}

		/**
		 * Adds floorplan component of application to aData
		 *
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddFloorplanComponent(iSortOrder) {
			// Load floorplan directly from manifest if possible (better performance)
			if (oManifest) {
				var sFloorplan = CommonChecks.getFloorplanByManifest(oManifest);
			} else {
				sFloorplan = CommonChecks.getFloorplanByStructure();
			}

			if (!CommonChecks.isValidFloorplan(sFloorplan)) {
				sFloorplan = CommonChecks.mFloorplans.UNKNOWN;
			}

			if (sFloorplan === CommonChecks.mFloorplans.UNKNOWN) {
				fnAddStringToData("Floorplan Component (ACH)", iSortOrder, CommonChecks.getTicketComponentForFloorplan(sFloorplan) + " (ERROR: Unknown floorplan! Possible reason: Invalid manifest.json)");
				return false;
			} else {
				fnAddStringToData("Floorplan Component (ACH)", iSortOrder, CommonChecks.getTicketComponentForFloorplan(sFloorplan) + " (" + sFloorplan + ")");
				return true;
			}
		}

		/**
		 * Adds OData service metadata link to aData
		 *
		 * @param {string} sDataSourceName name of data source in manifest
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddODataServiceMetadataLink(sDataSourceName, iSortOrder) {
			if (!(oManifest && CommonMethods.hasObjectContent(oManifest))) {
				return false;
			}

			// data source not found in manifest
			if (!(oManifest["sap.app"]
				&& oManifest["sap.app"].dataSources
				&& oManifest["sap.app"].dataSources[sDataSourceName])) {
				fnAddStringToData("OData Service Metadata", iSortOrder, "ERROR: Data source " + sDataSourceName + " not found at /sap.app/dataSources/" + sDataSourceName + " in manifest.json! Possible reason: Invalid manifest.json");
				return false;
			}

			// invalid data source, missing uri
			if (!oManifest["sap.app"].dataSources[sDataSourceName].uri) {
				fnAddStringToData("OData Service Metadata", iSortOrder, "ERROR: Data source URI not found at /sap.app/dataSources/" + sDataSourceName + "/uri in manifest.json! Possible reason: Invalid manifest.json");
				return false;
			}

			// append $metadata to given uri and append link to aData
			var sODataUri = oManifest["sap.app"].dataSources[sDataSourceName].uri;
			if (sODataUri.lastIndexOf("/") !== sODataUri.length - 1) {
				sODataUri += "/";
			}
			sODataUri += "$metadata";
			fnAddLinkToData("OData Metadata", iSortOrder, sODataUri, window.location.origin + sODataUri);
			return true;
		}

		/**
		 * Adds annotation links to aData
		 *
		 * @param {string} sDataSourceName name of data source in manifest
		 * @param {int} iSortOrder Sorting order index
		 * @returns {boolean} true if successful, otherwise false
		 */
		function fnAddAnnotationsLinks(sDataSourceName, iSortOrder) {
			if (!(oManifest && CommonMethods.hasObjectContent(oManifest) && sRootPath)) {
				return false;
			}

			// data source not found in manifest
			if (!(oManifest["sap.app"]
				&& oManifest["sap.app"].dataSources
				&& oManifest["sap.app"].dataSources[sDataSourceName])) {
				fnAddStringToData("Annotations", iSortOrder, "ERROR: Data source " + sDataSourceName + " not found at /sap.app/dataSources/" + sDataSourceName + " in manifest.json! Possible reason: Invalid manifest.json");
				return false;
			}

			// invalid data source, missing annotations
			if (!(oManifest["sap.app"].dataSources[sDataSourceName].settings
				&& oManifest["sap.app"].dataSources[sDataSourceName].settings.annotations
				&& oManifest["sap.app"].dataSources[sDataSourceName].settings.annotations !== [])) {
				fnAddStringToData("Annotations", iSortOrder, "ERROR: Data source " + sDataSourceName + " has no annotations at /sap.app/dataSources/" + sDataSourceName + "/settings/annotations in manifest.json! Possible reason: Invalid manifest.json");
				return false;
			}

			var aDataSourceAnnotations = oManifest["sap.app"].dataSources[sDataSourceName].settings.annotations;
			// reverse array to have priority of annotations descending => Prio. 1 at top
			aDataSourceAnnotations = aDataSourceAnnotations.reverse();

			for (var iKey in aDataSourceAnnotations) {
				if (!aDataSourceAnnotations.hasOwnProperty(iKey)) {
					continue;
				}

				var sSourceName = aDataSourceAnnotations[iKey];
				if (oManifest["sap.app"].dataSources[sSourceName]) {
					var sUri = oManifest["sap.app"].dataSources[sSourceName].uri;

					// skip invalid annotations
					if (!sUri) {
						continue;
					}

					var sPrefix = "";
					var sName = "";
					if (sUri.indexOf("/") === 0) {
						// backend annotations are host-relative
						sName = "Backend Annotation";
						sPrefix = window.location.origin;
					} else {
						// local annotations are path-relative
						sName = "Local Annotation";
						sPrefix = sRootPath;
						if (sPrefix.lastIndexOf("/") !== sPrefix.length - 1) {
							sPrefix += "/";
						}
					}
					sName += " (Prio. " + parseInt(parseInt(iKey, 10) + 1, 10) + ")";
					fnAddLinkToData(sName, iSortOrder, oManifest["sap.app"].dataSources[sSourceName].uri, sPrefix + oManifest["sap.app"].dataSources[sSourceName].uri);
				}
			}
			return true;
		}

		/**
		 * Adds links to annotations and link to OData service metadata document to aData.
		 *
		 * @param {int} iSortOrder Sorting order index
		 */
		function fnAddDataSources(iSortOrder) {
			if (!(oManifest)) {
				return;
			}

			// allow more detailed sorting by doing smaller steps in sorting order
			var fSubSort = 0;
			// increase fSubSort by 0.01 => 99 sub sort steps possible
			// returns "main order" + "sub step"
			function increaseSubSort(iOrder) {
				fSubSort += 0.01;
				return iOrder + fSubSort;
			}

			// check if models are available
			if (!(oManifest["sap.ui5"]
				&& oManifest["sap.ui5"].models)) {
				fnAddStringToData("Data Sources", iSortOrder, "ERROR: Path /sap.ui5/models not found in manifest.json! Possible reason: Invalid manifest.json");
				return;
			}
			var oModels = oManifest["sap.ui5"].models;

			// load data sources
			var aDataSources = [];
			for (var sModelName in oModels) {
				if (!oModels.hasOwnProperty(sModelName)) {
					continue;
				}

				if (oModels[sModelName]
					&& oModels[sModelName].dataSource
					&& oModels[sModelName].dataSource !== "") {

					// check if dataSource is already part of aDataSources
					var bAlreadyContains = false;
					for (var iSourceIndex in aDataSources) {
						if (!aDataSources.hasOwnProperty(iSourceIndex)) {
							continue;
						}

						if (aDataSources[iSourceIndex].dataSource === oModels[sModelName].dataSource) {
							bAlreadyContains = true;
							break;
						}
					}

					// add support for unnamed model of ALP and LR
					var sFormattedName = (sModelName === "" ? "mainService" : sModelName);

					if (!bAlreadyContains) {
						aDataSources.push({models: [sFormattedName], dataSource: oModels[sModelName].dataSource});
					} else {
						// iSourceIndex contains index of last read data source as loop gets interrupted via break when
						// data source is duplicated.
						aDataSources[iSourceIndex].models.push(sFormattedName);
					}
				}
			}

			// check if data sources were found at all
			if (aDataSources.length === 0) {
				fnAddStringToData("Data Sources", iSortOrder, "ERROR: No models with data sources found in manifest.json! Possible reason: Invalid manifest.json");
				return;
			}

			// Loop through data sources, group by data source and add links to OData Service metadata and annotations
			// which are sorted by priority.
			for (var iGroupIndex in aDataSources) {
				if (!aDataSources.hasOwnProperty(iGroupIndex)) {
					continue;
				}

				// no data sources found at all
				if (!(oManifest["sap.app"]
					&& oManifest["sap.app"].dataSources)) {
					fnAddStringToData("Data Sources", iSortOrder, "ERROR: No data sources found at /sap.app/dataSources in manifest.json! Possible reason: Invalid manifest.json");
					return;
				}

				// specific data source not found
				if (!oManifest["sap.app"].dataSources[aDataSources[iGroupIndex].dataSource]) {
					fnAddStringToData("Data Sources", iSortOrder, "ERROR: Data source " + aDataSources[iGroupIndex].dataSource + " not found at /sap.app/dataSources/" + aDataSources[iGroupIndex].dataSource + " in manifest.json! Possible reason: Invalid manifest.json");
					return;
				}

				// add group header and links to data
				fnAddGroupHeaderToData(CommonMethods.concatStrings(aDataSources[iGroupIndex].models), increaseSubSort(iSortOrder));
				fnAddODataServiceMetadataLink(aDataSources[iGroupIndex].dataSource, increaseSubSort(iSortOrder));
				fnAddAnnotationsLinks(aDataSources[iGroupIndex].dataSource, increaseSubSort(iSortOrder));
			}
		}

		// ------------------------------------ Lifecycle & Rendering ------------------------------------
		/**
		 * Returns XML view object with the specified ID if it already exists in the document. Otherwise a new XML view
		 * will be created from XML view DiagnosticsTool for tool instance.
		 *
		 * @param {string} sId view id
		 * @returns {object} XML view
		 */
		function fnGetView(sId) {
			var oView = sap.ui.getCore().byId(sId);
			if (oView) {
				return Promise.resolve(oView);
			}

			return XMLView.create({
				id: sId,
				viewName: "sap.suite.ui.generic.template.support.DiagnosticsTool.view.DiagnosticsTool",
				viewData: {
					plugin: oPlugin
				}
			});
		}

		/**
		 * Creates XML view for tool instance, appends it to the DOM and binds new JSONModel to it.
		 */
		function fnRenderToolInstance() {
			fnGetView(sViewId)
				.then(function (oView) {
					oView.placeAt(sPluginId);
					var oModel = new JSONModel();
					oView.setModel(oModel, "data");
				});
		}

		/**
		 * Initializes the different plugin instances (tool instance & window instance) and triggers the first event
		 * to get corresponding data from window instance. In case of tool instance the view rendering gets started.
		 */
		function fnInit() {
			oPlugin = this;
			sAppHash = window.location.hash.slice(1);

			if (oSupportStub.isToolStub()) {
				// tool instance

				// attach event listener for communication between tool and window instance but only if this handler is not
				// already attached from a previous loaded instance of the tool instance.
				if (!oSupportStub.hasListeners(sPluginId + "SetData")) {
					oSupportStub.attachEvent(sPluginId + "SetData", fnOnSetData);
				}
				if (!oSupportStub.hasListeners(sPluginId + "UpdateStatus")) {
					oSupportStub.attachEvent(sPluginId + "UpdateStatus", fnOnUpdateStatus);
				}
				if (!oSupportStub.hasListeners(sPluginId + "ShowDataRefreshed")) {
					oSupportStub.attachEvent(sPluginId + "ShowDataRefreshed", fnOnShowDataRefreshed);
				}

				// make plugin id available to controller
				window.diagnosticToolSpace.fioriElementsPluginID = sPluginId;

				// initial tool rendering at tool instance
				fnRenderToolInstance();
			} else {
				// window instance

				// attach event listener for communication between tool and window instance but only if this handler is not
				// already attached from a previous loaded instance of the tool instance.
				if (!oSupportStub.hasListeners(sPluginId + "GetData")) {
					oSupportStub.attachEvent(sPluginId + "GetData", fnOnGetData);
				}

				// In the class EventBus is no method available to check whether a function is already attached as event
				// handler like their is hasListeners() from Support class. As a workaround you can detach the event listener
				// before you attach it again. This is only important when the tool instance gets initialised for the second
				// or more time (e.g. after page refresh of tool instance) to avoid duplicate data requests.
				oEventBus.unsubscribe("elements", "ViewRendered", fnHandleBusyState);
				oEventBus.unsubscribe("elements", "ViewRenderingStarted", fnHandleBusyState);

				// attach event listeners for communication between Fiori Elements Framework and application
				oEventBus.subscribe("elements", "ViewRendered", fnHandleBusyState);
				oEventBus.subscribe("elements", "ViewRenderingStarted", fnHandleBusyState);

				// attach event listener for navigation outside of Fiori Elements applications (e.g. Fiori Launchpad)
				if ("onhashchange" in window) {
					window.addEventListener("hashchange", fnHandleHashChange);
				}
			}

			// initial data request
			fnOnGetData();
		}

		/**
		 * Deregisters event listeners to avoid duplicate entries.
		 *
		 * @param {object} oSupportStub instance of Support stub
		 */
		function fnExit() {
			if (oSupportStub.isToolStub()) {
				// tool instance
				window.diagnosticToolSpace.fnFEPluginToolInstanceExit = undefined;
				oSupportStub.detachEvent(sPluginId + "SetData", fnOnSetData);
				oSupportStub.detachEvent(sPluginId + "UpdateStatus", fnOnUpdateStatus);
				oSupportStub.detachEvent(sPluginId + "ShowDataRefreshed", fnOnShowDataRefreshed);
				fnGetView(sViewId).then(function(oView) { oView.destroy(); });
			} else {
				// window instance
				window.diagnosticToolSpace.fnFEPluginAppInstanceExit = undefined;
				oSupportStub.detachEvent(sPluginId + "GetData", fnOnGetData);
				oEventBus.unsubscribe("elements", "ViewRendered", fnHandleBusyState);
				oEventBus.unsubscribe("elements", "ViewRenderingStarted", fnHandleBusyState);
				if ("onhashchange" in window) {
					window.removeEventListener("hashchange", fnHandleHashChange);
				}
			}
		}

		// ------------------------------------ Event Handling ------------------------------------
		/**
		 * Triggers an event called {plugin id}GetData forcing data update at window instance.
		 */
		function fnTriggerGetData() {
			oSupportStub.sendEvent(sPluginId + "GetData", {});
		}

		/**
		 * Triggers an event called {plugin id}SetData causing rerendering at tool instance.
		 */
		function fnTriggerSetData() {
			var oModelData =  {};
			oModelData.origin = window.location.origin;
			oModelData.url = window.location.href;
			var oModel = new JSONModel();

			// sort aData by property order
			aData.sort(CommonMethods.getDynamicComparator("order"));
			oModelData.properties = aData;

			// set time of retrieval
			var sTime = new Date().toLocaleTimeString([], {
				hour12: false,
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit"
			});
			oModelData.retrieval = sTime;

			// copy button enabled?
			var bCopyEnabled = true;
			if (!aData || aData.length === 0) {
				bCopyEnabled = false;
			}
			oModelData.copyEnabled = bCopyEnabled;

			// show warning if application status equals FAILED
			var sApplicationStatus = CommonMethods.getApplicationStatus();
			if (!sApplicationStatus) {
				CommonMethods.setApplicationStatus(CommonMethods.mApplicationStatus.UNKNOWN);
				sApplicationStatus = CommonMethods.mApplicationStatus.UNKNOWN;
			}
			oModelData.status = sApplicationStatus;

			var sMessage = "";
			if (sApplicationStatus === CommonMethods.mApplicationStatus.FAILED) {
				sMessage = "The application did not finish loading or is no Fiori Elements application! The shown data below could be collected anyway. If the application finishes loading, the data will be updated automatically.";
			}
			oModelData.statusMessage = sMessage;

			// update properties for table and current URL/time of retrieval for copy button
			oModel.setData(oModelData);
			oSupportStub.sendEvent(sPluginId + "SetData", oModelData);
		}

		/**
		 * Triggers an event called {plugin id}UpdateStatus causing tool instance to update timeout timer.
		 *
		 * @param {int} iTime time left until timeout is triggered
		 * @param {string} sStatus application status of application
		 */
		function fnTriggerUpdateStatus(iTime, sStatus) {
			oSupportStub.sendEvent(sPluginId + "UpdateStatus", {timeLeft: iTime, status: sStatus});
		}

		/**
		 * Triggers an event called {plugin id}ShowDataRefreshed causing tool instance to show message toast.
		 */
		function fnTriggerShowDataRefreshed() {
			oSupportStub.sendEvent(sPluginId + "ShowDataRefreshed", {});
		}

		/**
		 * Adds content to aData. Requires exact evaluation of current situation before => must only be called by fnOnGetData.
		 *
		 * @private
		 * @param {boolean} bRecoveryMode true if recovery mode is active, otherwise false
		 */
		function addContent(bRecoveryMode) {
			if (sAbsoluteManifestURL) {
				sRootPath = CommonChecks.getRootPath(sAbsoluteManifestURL);
			}

			// clear old data
			aData = [];
			fnTriggerSetData();

			// extract data from core and data about runtime environment
			fnAddVersionInfo(1);
			fnAddApplicationName(2);
			fnAddManifestLink(3);
			fnTriggerSetData();

			if (bRecoveryMode && oManifest && CommonMethods.hasObjectContent(oManifest)) {
				fnAddFioriID(3);
				fnAddApplicationComponent(4);
				fnAddFloorplanComponent(5);
				fnAddDataSources(6);
				fnTriggerSetData();
				fnTriggerShowDataRefreshed();
			} else if (sAbsoluteManifestURL) {
				CommonMethods.getFileFromURI(sAbsoluteManifestURL)
				.then(function (oValue) {
					oManifest = oValue;
					fnAddFioriID(3);
					fnAddApplicationID(4);
					fnAddApplicationComponent(5);
					fnAddFloorplanComponent(6);
					fnAddDataSources(7);
				}).catch(function () {
					fnAddStringToData("Manifest", 3, "ERROR: Could not access manifest.json even though link could be generated! Possible reason: missing permission to access file.");
				}).finally(function () {
					fnTriggerSetData();
					fnTriggerShowDataRefreshed();
				});
			}
		}

		/**
		 * Event handler for event {plugin id}GetData when running at window instance. Collects data from running
		 * application and formats it to display in tool instance. Triggers event {plugin id}SetData to render
		 * collected data in tool instance afterwards.
		 */
		function fnOnGetData() {
			oManifest = undefined;
			sAbsoluteManifestURL = undefined;
			sRootPath = undefined;
			var sApplicationStatus = CommonMethods.getApplicationStatus();
			var oAppComponent = CommonMethods.getAppComponent();
			var bRecoveryMode = false;

			// default application status is UNKNOWN
			if (!(sApplicationStatus && CommonMethods.isValidApplicationStatus(sApplicationStatus))) {
				sApplicationStatus = CommonMethods.mApplicationStatus.UNKNOWN;
			}

			if (sApplicationStatus === CommonMethods.mApplicationStatus.LOADING) {
				// Scenario: App is still loading => show busy indicator
				fnHandleBusyState();
				return;
			} else if (sApplicationStatus === CommonMethods.mApplicationStatus.FAILED) {
				// Scenario: App failed loading in time
				// app component & manifest are known => use recovery mode (load data from core instance)
				// app component is unknown => cancel data request
				var oResult = fnGetManifestFromAppComponent(oAppComponent);
				if (oResult && CommonMethods.hasObjectContent(oResult)) {
					oManifest = oResult;
					if (oManifest && oManifest["sap.app"] && oManifest["sap.app"].id) {
						sAbsoluteManifestURL = fnGenerateAbsoluteManifestURL(oManifest["sap.app"].id);
						if (!sAbsoluteManifestURL) {
							// Application did not finish loading! Some data could still be collected because corresponding component is known!
							bRecoveryMode = true;
						}
					} else {
						// Application did not finish loading! Some data can still be collected because corresponding component is known!
						bRecoveryMode = true;
					}
				} else {
					// Application did not finish loading! No application specific data can be collected because corresponding component is unknown!
					fnDisplayError("Could not load any data because manifest and component of current application are unknown!");
					fnTriggerShowDataRefreshed();
					return;
				}
			} else if (sApplicationStatus === CommonMethods.mApplicationStatus.RENDERED) {
				// Scenario: App loaded successfully
				// - manifest link is available => load data via AJAX from manifest
				// - manifest link is not available => try to generate link to manifest from manifest or use recovery mode (load data from core instance)
				sAbsoluteManifestURL = fnGenerateAbsoluteManifestURL();
				if (!sAbsoluteManifestURL) {
					oResult = fnGetManifestFromAppComponent(oAppComponent);
					if (oResult && CommonMethods.hasObjectContent(oResult)) {
						oManifest = oResult;
						if (oManifest && oManifest["sap.app"] && oManifest["sap.app"].id) {
							sAbsoluteManifestURL = fnGenerateAbsoluteManifestURL(oManifest["sap.app"].id);
							if (!sAbsoluteManifestURL) {
								// Application did finish loading, but the root path to the application is unknown! Some data could still be collected because corresponding component is known!
								bRecoveryMode = true;
							}
						} else {
							// Application did finish loading, but the root path to the application is unknown! Some data could still be collected because corresponding component is known!
							bRecoveryMode = true;
						}
					} else {
						// Application did not finish loading! No application specific data can be collected because corresponding component is unknown!
						fnDisplayError("Could not load any data because manifest and component of current application are unknown!");
						fnTriggerShowDataRefreshed();
						return;
					}
				}
			} else if (sApplicationStatus === CommonMethods.mApplicationStatus.UNKNOWN) {
				// Scenario: Application status is unknown (can have different reasons, e.g. plugin did not load correctly,
				// library does not trigger events at view rendering, ...)
				if (CommonChecks.getFloorplanByStructure() !== CommonChecks.mFloorplans.UNKNOWN) {
					oManifest = CommonChecks.getManifestByStructure();
					if (oManifest && CommonMethods.hasObjectContent(oManifest)) {
						if (oManifest && oManifest["sap.app"] && oManifest["sap.app"].id) {
							// application state is unknown, but manifest and app id are known. Most of the data can still be collected.
							sAbsoluteManifestURL = fnGenerateAbsoluteManifestURL(oManifest["sap.app"].id);
							if (!sAbsoluteManifestURL) {
								// Application state and link to manifest are unknown, but manifest content is known. Some data can still be collected.
								bRecoveryMode = true;
							}
						} else {
							// Application state is unknown, but manifest content is known. Some data can still be collected.
							bRecoveryMode = true;
						}
					}
				} else {
					// Application state is unknown! No application specific data can be collected because corresponding component is unknown!
					fnDisplayError("Could not load any data because manifest and component of current application are unknown!");
					fnTriggerShowDataRefreshed();
					return;
				}
			}

			addContent(bRecoveryMode);
		}

		/**
		 * Event handler for event {plugin id}SetData when running at tool instance. Updates model which is bound to
		 * tool instances to display data in tool instance. Must not be called directly, use event {plugin id}GetData
		 * instead to refresh data.
		 *
		 * @param {object} oEvent contains data for tool instance
		 */
		function fnOnSetData(oEvent) {
			var oModel = new JSONModel();
			oModel.setJSON(JSON.stringify(oEvent.getParameters()));
			fnGetView(sViewId).then(function (oView) {
				oView.setModel(oModel, "data");
				// invalidate view to trigger rerendering and apply custom changes
				oView.invalidate();
			});
		}

		/**
		 * Event handler for event {plugin id}UpdateStatus when running at tool instance. Updates time left until
		 * timeout and current application status.
		 *
		 * @param {object} oEvent contains status for tool instance
		 */
		function fnOnUpdateStatus(oEvent) {
			var mParameters = oEvent.getParameters();
			fnGetView(sViewId).then(function (oView) {
				oView.getController().updateStatus(mParameters.timeLeft, mParameters.status);
			});
		}

		/**
		 * Event handler for event {plugin id}ShowDataRefreshed when running at tool instance. Shows MessageToast to user
		 * which indicates updated data.
		 */
		function fnOnShowDataRefreshed() {
			fnGetView(sViewId).then(function (oView) {
				oView.getController().showDataRefreshed();
			});
		}

		/**
		 * Interval handler. Manages application status and time left until timeout will be triggered. If still time is
		 * left, tool instance will be updated with new time left. If there is no time left, application status will be set
		 * to FAILED and the plugin will try to get as much data as possible from the app. At tool instance a hint will be
		 * shown that the app timed out.
		 */
		function fnHandleInterval() {
			var sCurrentState = CommonMethods.getApplicationStatus();
			if (iTimeLeft > 0) {
				fnTriggerUpdateStatus(iTimeLeft, sCurrentState);
			} else {
				iTimeLeft = iTimeout;
				CommonMethods.setApplicationStatus(CommonMethods.mApplicationStatus.FAILED);
				fnTriggerUpdateStatus(0, CommonMethods.mApplicationStatus.FAILED);
				oIntervalTrigger.removeListener(fnHandleInterval);
				// Destroying the IntervalTrigger via method .destroy() will lead to an error. Dereferencing is a simple
				// workaround which does work fine.
				oIntervalTrigger = undefined;
				fnOnGetData();
			}
			iTimeLeft--;
		}

		/**
		 * Event handler for handling busy status of tool instance.
		 *
		 * @param {string} sChannel channel the event got published on
		 * @param {string} sEventName name of published event
		 */
		function fnHandleBusyState(sChannel, sEventName) {
			// app started loading (triggered by framework) or app is already loading (triggered by plugin at initialisation)
			if (sEventName === "ViewRenderingStarted" || (!sEventName && CommonMethods.getApplicationStatus() === CommonMethods.mApplicationStatus.LOADING)) {
				CommonMethods.setApplicationStatus(CommonMethods.mApplicationStatus.LOADING);
				// Add new timer only if no timer already exists. This gets important if the tool instance becomes reloaded
				// during a running timeout countdown.
				if (!oIntervalTrigger) {
					iTimeLeft = iTimeout;
					oIntervalTrigger = new sap.ui.core.IntervalTrigger(1000);
					oIntervalTrigger.addListener(fnHandleInterval);
				}
			} else if (sEventName === "ViewRendered") {
				// app finished loading (triggered by framework)
				CommonMethods.setApplicationStatus(CommonMethods.mApplicationStatus.RENDERED);
				iTimeLeft = iTimeout;
				if (oIntervalTrigger) {
					oIntervalTrigger.removeListener(fnHandleInterval);
					// Destroying the IntervalTrigger via method .destroy() will lead to an error. Dereferencing is a simple
					// workaround which does work fine.
					oIntervalTrigger = undefined;
				}
				fnOnGetData();
			}
		}

		/**
		 * Event handler for handling hash change in browser window.
		 *
		 * @param {object} oEvent event parameters
		 */
		function fnHandleHashChange(oEvent) {
			function getFirstParameterDividingCharacter(sString) {
				for (var i = 0; i < sString.length; i++) {
					if (sString[i] === "/" || sString[i] === "&" || sString[i] === "?" || sString[i] === "~") {
						return i;
					}
				}
				return sString.length;
			}

			function equalsAppNameByHash(sShorterHash, sLongerHash) {
				if (!sShorterHash || !sLongerHash) {
					return false;
				}
				if (sShorterHash === sLongerHash) {
					return true;
				}
				var iShortDivider = getFirstParameterDividingCharacter(sShorterHash);
				var iLongDivider = getFirstParameterDividingCharacter(sLongerHash);
				if (iShortDivider !== iLongDivider) {
					// dividing character is at a different position in both hashes
					return false;
				} else if (sShorterHash.substr(0, iShortDivider) === sLongerHash.substr(0, iLongDivider)) {
					// dividing character is the same position and first parts in front of divider are equal
					return true;
				}
				// dividing character is the same position and first parts in front of divider are not equal
				return false;
			}

			var sOldHash,
				sNewHash,
				bSameApp = false;
			if (oEvent.originalEvent.oldURL && oEvent.originalEvent.newURL) {
				sOldHash = oEvent.originalEvent.oldURL.split("#")[1];
				sNewHash = oEvent.originalEvent.newURL.split("#")[1];
			} else {
				// IE only: IE does not support hashchange event properties oldURL and newURL
				sOldHash = sAppHash;
				sNewHash = window.location.hash.slice(1);
				sAppHash = sNewHash;
			}

			if (sOldHash.length >= sNewHash.length) {
				bSameApp = equalsAppNameByHash(sNewHash, sOldHash);
			} else {
				bSameApp = equalsAppNameByHash(sOldHash, sNewHash);
			}

			if (!bSameApp) {
				CommonMethods.setApplicationStatus(CommonMethods.mApplicationStatus.LOADING);
				CommonMethods.setAppComponent(undefined);
				fnHandleBusyState();
				iTimeLeft = (iTimeout / 2);
			}
		}

	// ------------------------------------ Functions for Unit Tests ------------------------------------
	function fnGetSupportStub() {
		return oSupportStub;
	}

	function fnGetData() {
		return aData;
	}

	function fnResetData() {
		aData = [];
	}

	function fnSetManifest(oNewManifest) {
		oManifest = oNewManifest;
	}

	function fnSetManifestURL(sURL) {
		sAbsoluteManifestURL = sURL;
	}

	function fnSetManifestPath(sPath) {
		sManifestPath = sPath;
	}

	function fnSetsRootPath(sPath) {
		sRootPath = sPath;
	}

	/* eslint-disable */
	// Provide access to private methods to helper class testableHelper for unit tests
	// static
	var fnFormatDate = testableHelper.testable(fnFormatDate, "DiagnosticsTool_fnFormatDate");

	// "instance"
	var fnGetManifestFromAppComponent = testableHelper.testable(fnGetManifestFromAppComponent, "fnGetManifestFromAppComponent");
	var fnAddToData = testableHelper.testable(fnAddToData, "fnAddToData");
	var fnAddStringToData = testableHelper.testable(fnAddStringToData, "fnAddStringToData");
	var fnAddLinkToData = testableHelper.testable(fnAddLinkToData, "fnAddLinkToData");
	var fnAddGroupHeaderToData = testableHelper.testable(fnAddGroupHeaderToData, "fnAddGroupHeaderToData");
	var fnDisplayError = testableHelper.testable(fnDisplayError, "fnDisplayError");

	var fnAddVersionInfo = testableHelper.testable(fnAddVersionInfo, "fnAddVersionInfo");
	var fnAddManifestLink = testableHelper.testable(fnAddManifestLink, "fnAddManifestLink");
	var fnAddApplicationComponent = testableHelper.testable(fnAddApplicationComponent, "fnAddApplicationComponent");
	var fnAddFloorplanComponent = testableHelper.testable(fnAddFloorplanComponent, "fnAddFloorplanComponent");
	var fnAddODataServiceMetadataLink = testableHelper.testable(fnAddODataServiceMetadataLink, "fnAddODataServiceMetadataLink");
	var fnAddAnnotationsLinks = testableHelper.testable(fnAddAnnotationsLinks, "fnAddAnnotationsLinks");
	var fnAddDataSources = testableHelper.testable(fnAddDataSources, "fnAddDataSources");
	var fnAddFioriID = testableHelper.testable(fnAddFioriID, "fnAddFioriID");
	var fnAddApplicationID = testableHelper.testable(fnAddApplicationID, "fnAddApplicationID");

	// Methods which are only created for unit tests
	var fnGetSupportStub = testableHelper.testable(fnGetSupportStub, "fnGetSupportStub");
	var fnGetData = testableHelper.testable(fnGetData, "fnGetData");
	var fnResetData = testableHelper.testable(fnResetData, "fnResetData");
	var fnSetManifest = testableHelper.testable(fnSetManifest, "fnSetManifest");
	var fnSetManifestURL = testableHelper.testable(fnSetManifestURL, "fnSetManifestURL");
	var fnSetManifestPath = testableHelper.testable(fnSetManifestPath, "fnSetManifestPath");
	var fnSetsRootPath = testableHelper.testable(fnSetsRootPath, "fnSetsRootPath");
	/* eslint-enable */


		return {
			init: fnInit,
			exit: fnExit,
			getId: fnGetId,
			onRefresh: fnTriggerGetData
		};
	}  // getMethods

	// ------------------------------------ Registration ------------------------------------
	/**
	 * The plugin "SAP Fiori Elements" for UI5 Diagnostics Tool exposes ticket relevant information of the currently
	 * running Fiori Elements application to the user.
	 */
	return Plugin.extend("sap.suite.ui.generic.template.support.DiagnosticsTool.DiagnosticsTool", {
		constructor: function (oSupportStub) {
			Plugin.apply(this, [sPluginId, "SAP Fiori Elements", oSupportStub]);
			extend(this, getMethods(oSupportStub));
		}
	});
});
