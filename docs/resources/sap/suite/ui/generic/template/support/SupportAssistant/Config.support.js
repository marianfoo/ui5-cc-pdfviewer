/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
/**
 * Defines support rules for the app configuration.
 */
sap.ui.define([
	"sap/ui/support/library"
], function(
	SupportLib) {
	"use strict";


	// shortcuts
	var Categories = SupportLib.Categories; // Accessibility, Performance, Memory, ...
	var Severity = SupportLib.Severity; // Hint, Warning, Error
	var Audiences = SupportLib.Audiences; // Control, Internal, Application*/

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/*modelPreloading -> (5.) app descriptor FE change -> preload property check, can be also checked more strict with "preload" === true (Metadata document in parallel to component)*/
	var oModelPreloading = {
		id: "modelPreloadingFioriElements",
		audiences: [Audiences.Application, Audiences.Internal],
		categories: [Categories.Performance],
		enabled: true,
		minversion: "1.38",
		title: "Default Model preloading required for Fiori Elements List Report applications",
		description: "Preloaded models, which load their data from extern locations, can start to load data earlier. This leads to an application performance improvement. For Fiori Elements List Report the default model (\"\") should be set to true.",
		resolution: "Adapt your application descriptor: set the default model (\"\") to \"preload\": true. Note: the \"preload\" attribute requires at least app descriptor version 1.4.0.",
		resolutionurls: [{
			text: 'Manifest Model Preload',
			href: 'https://openui5.hana.ondemand.com/#/topic/26ba6a5c1e5c417f8b21cce1411dba2c'
		}],
		check: function(oIssueManager, oCoreFacade, oScope) {
			//sap.ui5/models: for default model (""), set "preload": true (note: the "preload" attribute requires at least app descriptor version 1.4.0).
			var mComponents = oCoreFacade.getComponents();
			var bRelevantModelsUsed = false;
			var bModelPreload = false;
			var bFioriElementsApp = false;
			var bFioriElementsListReportApp = false;
			Object.keys(mComponents).forEach(function(sComponentId) {
				var oManifest = mComponents[sComponentId].getManifest();
				var mModels = oManifest['sap.ui5'].models || {};
				var mDataSources = oManifest['sap.app'].dataSources;

				var mFioriElements = oManifest && oManifest['sap.ui.generic.app'];
				if (mFioriElements){
					bFioriElementsApp = true;

					if (mFioriElements.pages && mFioriElements.pages instanceof Array){
						//pages is an array
						var oListReport = mFioriElements.pages[0];
						if (oListReport && oListReport.component && oListReport.component.name && oListReport.component.name === "sap.suite.ui.generic.template.ListReport"){
							bFioriElementsListReportApp = true;
						}
					} else {
						//pages structure contains objects
						for (var prop in mFioriElements.pages){
							if (prop.indexOf("ListReport") == 0){
								var oListReport = mFioriElements.pages[prop];
								if (oListReport && oListReport.component && oListReport.component.name && oListReport.component.name === "sap.suite.ui.generic.template.ListReport"){
									bFioriElementsListReportApp = true;
									break;
								}
							}

						}
					}

					if (mModels[""]){ //check only the default model
						var mModel = mModels[""];
						var mDataSource;
						if (mModel.dataSource) {
							mDataSource = mDataSources[mModel.dataSource];
						}
						if ((mModel.type && mModel.type === "sap.ui.model.odata.v2.ODataModel") ||
							mDataSource && mDataSource.type === "OData" && (mDataSource.settings === undefined ||
								(mDataSource.settings && (mDataSource.settings.odataVersion === undefined ||
									mDataSource.settings.odataVersion && mDataSource.settings.odataVersion === "2.0")))) {
							bRelevantModelsUsed = true;
							if (mModel.preload === true) {
								bModelPreload = true;
							}
						}
					}
				}
			});
			if (bFioriElementsApp && bFioriElementsListReportApp && ( !bRelevantModelsUsed || !bModelPreload )) {
				oIssueManager.addIssue({
					severity: Severity.Medium,
					details: "The used V2 ODataModels default model (\"\") doesn't make use of the preloading feature.",
					context: {
						id: "WEBPAGE"
					}
				});
			}
		}
	};

	return [
		oModelPreloading
	];

}, true);
