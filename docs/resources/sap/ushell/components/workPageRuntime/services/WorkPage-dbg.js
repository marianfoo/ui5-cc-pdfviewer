// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview This module exposes a model containing the work pages hierarchy to its clients.
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ushell/utils/HttpClient",
    "sap/ushell/utils/RestrictedJSONModel",
    "sap/ushell/components/workPageRuntime/services/NavigationResolver",
    "sap/base/util/ObjectPath",
    "sap/ushell/Config",
    "sap/base/Log"
], function (
    HttpClient,
    RestrictedJSONModel,
    NavigationResolver,
    ObjectPath,
    Config,
    Log
) {
    "use strict";

    /**
     * Service for loading WorkPages.
     *
     * @namespace sap.ushell.components.workPageRuntime.services.WorkPage
     *
     * @constructor
     * @class
     * @since 1.72.0
     *
     * @private
     */
    var WorkPage = function () {
        this.httpClient = new HttpClient();
        this._oNavigationResolver = new NavigationResolver();
        this._oCdmServicePromise = sap.ushell.Container.getServiceAsync("CommonDataModel");
        this._oCSTRServicePromise = sap.ushell.Container.getServiceAsync("ClientSideTargetResolution");
        this._sBaseUrl = Config.last("/core/workPages/contentApiUrl");
        this._oWorkPagesModel = new RestrictedJSONModel({
            editable: false,
            data: {
                WorkPage: null,
                Visualizations: null,
                Catalog: []
            }
        });
    };

    /**
     * Returns the workpages model instance.
     *
     * @return {sap.ui.model.json.JSONModel} The model.
     */
    WorkPage.prototype.getModel = function () {
        return this._oWorkPagesModel;
    };


    /**
     * Validates the given page data. Returns a rejected promise if validation fails.
     * @param {object} oPageData The page data.
     * @return {Promise} A promise, that is resolved if the page data is valid, else it is rejected.
     * @private
     */
    WorkPage.prototype._validateData = function (oPageData) {
        Log.debug("cep/editMode: load Page: validate", "Work Page service");
        if (oPageData.errors && oPageData.errors.length > 0) {
            return Promise.reject(oPageData.errors
                .map(function (oError) { return oError.message; })
                .join(",\n"));

        }
        if (!ObjectPath.get("data.WorkPage", oPageData)) {
            Log.debug("cep/editMode: load Page: validate: reject: data is empty", "Work Page service");
            return Promise.reject("Work Page data is empty");
        }
        return Promise.resolve(oPageData);
    };

    /**
     * Load the WorkPage data for the given page Id.
     * Additionally, load the visualizations used on that WorkPage.
     *
     * @param {string} sSiteId The site id.
     * @param {string} sPageId The WorkPage id.
     * @return {Promise<undefined>} A promise that resolves when the data is loaded.
     */
    WorkPage.prototype.loadWorkPageAndVisualizations = function (sSiteId, sPageId) {
        var sQuery = "{" +
                    "WorkPage(" +
                      "SiteId:\"" + sSiteId + "\"," +
                      "WorkPageId:\"" + sPageId + "\"" +
                    ") {" +
                        "Id," +
                        "Contents," +
                        "Editable," +
                        "UsedVisualizations{" +
                        "nodes{" +
                            "Id," +
                            "Type," +
                            "Descriptor," +
                            "DescriptorResources{" +
                                "BaseUrl," +
                                "DescriptorPath" +
                            "}" +
                        "}" +
                    "}" +
                "}" +
            "}";
        return this._doRequest(sQuery)
            .then(this._validateData)
            .then(function (oPageData) {
                var oWorkPageData = ObjectPath.get("data.WorkPage.Contents", oPageData);
                var aVizData = ObjectPath.get("data.WorkPage.UsedVisualizations.nodes", oPageData) || [];
                var bEditable = ObjectPath.get("data.WorkPage.Editable", oPageData) === true;
                return this._transformVizData(aVizData).then(function (aPreparedVizData) {
                    var oPreparedVizData = aPreparedVizData.reduce(function (mViz, oViz) {
                        mViz[oViz.Id] = oViz;
                        return mViz;
                    }, {});
                    this._oWorkPagesModel._setProperty("/data/WorkPage", oWorkPageData);
                    this._oWorkPagesModel._setProperty("/data/Visualizations", oPreparedVizData);
                    this._oWorkPagesModel._setProperty("/editable", bEditable);
                }.bind(this));
            }.bind(this));
    };

    /**
     * Resolves and replaces the IBN targets by calling the navigation service
     *
     * @param {object[]} aVizData Array of visualization data.
     * @return {Promise<Array<object>>} The modified array of visualization data.
     * @private
     */
    WorkPage.prototype._resolveAndReplaceIBNTargets = function (aVizData) {
        var sType, sInboundId, oParameters, fnTargetReplace;
        var aPromises = aVizData.reduce(function (aResolvePromises, oVizData) {
            sType = ObjectPath.get(["Descriptor", "sap.flp", "target", "type"], oVizData);
            if (sType === "IBN") {
                fnTargetReplace = this._replaceTarget(oVizData);
                sInboundId = ObjectPath.get(["Descriptor", "sap.flp", "target", "inboundId"], oVizData);
                oParameters = ObjectPath.get(["Descriptor", "sap.flp", "target", "parameters"], oVizData);

                if (sInboundId) {
                    aResolvePromises.push(fnTargetReplace(sInboundId, oParameters));
                }
            } else {
                aResolvePromises.push(Promise.resolve(oVizData));
            }
            return aResolvePromises;
        }.bind(this), []);

        return Promise.all(aPromises);
    };

    /**
     * Replaces the 'sap.flp' target property with the result of the navigation resolver.
     *
     * @param {object} oVizData The vizData object containing the Descriptor.
     * @return {Promise<object>} Promise resolving when the inbound was resolved.
     * @private
     */
    WorkPage.prototype._replaceTarget = function (oVizData) {
        return function (sInboundId, oParameters) {
            return this._oNavigationResolver.resolveByInbound(sInboundId, oParameters).then(function (oResolve) {
                ObjectPath.set(["Descriptor", "sap.flp", "target"], {
                    type: "URL",
                    url: oResolve.url
                }, oVizData);

                return oVizData;
            });
        }.bind(this);
    };

    /**
     * Load the WorkPage data for the given page Id.
     * @param {string} sSiteId The site id.
     * @param {string} sPageId The page id.
     * @return {Promise} Promise that resolves when the data is loaded and inserted into the model.
     */
    WorkPage.prototype.loadWorkPage = function (sSiteId, sPageId) {
        var sQuery = "{" +
                "WorkPage(" +
                "SiteId:\"" + sSiteId + "\"," +
                "WorkPageId:\"" + sPageId + "\"" +
                ") {" +
                    "Id," +
                    "Contents," +
                    "Editable" +
                "}" +
            "}";
        return this._doRequest(sQuery)
            .then(this._validateData)
            .then(function (oPageData) {
                var oWorkPageData = ObjectPath.get("data.WorkPage.Contents", oPageData);
                var bEditable = ObjectPath.get("data.WorkPage.Editable", oPageData) === true;
                this._oWorkPagesModel._setProperty("/data/WorkPage", oWorkPageData);
                this._oWorkPagesModel._setProperty("/editable", bEditable);
            }.bind(this));
    };

    /**
     * Save the WorkPage data for the given page Id.
     * @param {string} sPageId The page id.
     * @param {object} oPageData Data object with page data.
     * @return {Promise} Promise that resolves when the data is saved.
     */
    WorkPage.prototype.updateWorkPage = function (sPageId, oPageData) {

        // Workaround until the service is updated to correctly accept the DescriptorSchemaId field
        function _findDescriptorSchemaVersion (obj) {
            for (var i in obj) {
                if (obj[i] !== null && typeof obj[i] === "object") {
                    if (obj.DescriptorSchemaVersion) {
                        return obj.DescriptorSchemaVersion; // we believe it is always the same
                    }
                    return _findDescriptorSchemaVersion(obj[i]); // traverse recursively
                }
            }
            return "";
        }
        var sDescriptorSchemaVersion = _findDescriptorSchemaVersion(oPageData);
        function _fixPageData (obj, bCheckDescriptor) {
            if (obj && obj.DescriptorSchemaId) {
                delete obj.DescriptorSchemaId; // the DescriptorSchemaId field is not accepted by the server
            }
            for (var i in obj) {
                if (obj[i] !== null && typeof obj[i] === "object") {
                    _fixPageData(obj[i], !isNaN(i)); // traverse recursively, check descriptors for all array items
                }
            }
            if (obj && bCheckDescriptor) { // make sure the required fields are present
                obj.Descriptor = obj.Descriptor || {};
                obj.DescriptorSchemaVersion = obj.DescriptorSchemaVersion || sDescriptorSchemaVersion;
            }
        }

        // Workaround because the backend does not return an empty Cells array when querying the page, but expects one when saving the page.
        function _fixEmptyColumns (obj) {
            if (obj.Rows) {
                obj.Rows.forEach(function (oRow) {
                    if (oRow.Columns) {
                        oRow.Columns.forEach(function (oCol) {
                            if (!oCol.Cells) {
                                oCol.Cells = [];
                            }
                        });
                    }
                });
            }
        }
        _fixPageData(oPageData, true);
        _fixEmptyColumns(oPageData);
        // End of workarounds

        var sQuery = "mutation updateWorkPage($WorkPageId: String!, $Contents: JSON) {" +
                        "updateWorkPage(WorkPageId: $WorkPageId, Contents: $Contents ) {" +
                            // return Id and new Contents
                            "Id," +
                            "Contents," +
                            "Editable," +
                            "UsedVisualizations{" +
                                "nodes{" +
                                    "Id," +
                                    "Type," +
                                    "Descriptor," +
                                    "DescriptorResources{" +
                                        "BaseUrl," +
                                        "DescriptorPath" +
                                    "}" +
                                "}" +
                            "}" +
                        "}" +
                    "}";
        var oRequestData = {
            query: sQuery,
            variables: {
                WorkPageId: sPageId,
                Contents: oPageData
            }
        };

        var oPostRequest = this.httpClient.post(this._sBaseUrl, {
            data: oRequestData,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Accept-Language": sap.ui.getCore().getConfiguration().getLanguageTag()
            }
        }).then(function (oResponse) {
            if (oResponse.status !== 200) {
                return Promise.reject({
                    statusText: "HTTP request failed with status: " + oResponse.status,
                    responseText: oResponse.statusText
                });
            }
            var oResponseData = {};
            try {
                oResponseData = JSON.parse(oResponse.responseText || "{}");
            } catch (error) {
                return Promise.reject({
                    statusText: undefined,
                    responseText: oResponse.responseText
                });
            }
            var sTitle;
            var sErrorMsg;
            if (oResponseData.errors) {
                // Try to format the graphql error response to a more readable state
                try {
                    var aErr = oResponseData.errors[0].split("[");
                    sTitle = aErr[0];
                    var aErrors = JSON.parse("[" + aErr[1]);
                    sErrorMsg = JSON.stringify(aErrors, null, "  ");
                } catch (error) {
                    sTitle = null;
                    sErrorMsg = oResponseData.errors;
                }
                return Promise.reject({
                    statusText: sTitle,
                    responseText: sErrorMsg
                });
            }
            return oResponseData;
        }).then(function (pageData) {
            var oWorkPageData = ObjectPath.get("data.updateWorkPage.Contents", pageData);
            var aVizData = ObjectPath.get("data.updateWorkPage.UsedVisualizations.nodes", pageData) || [];
            var bEditable = ObjectPath.get("data.updateWorkPage.Editable", pageData) === true;
            return this._transformVizData(aVizData).then(function (aPreparedVizData) {
                var oPreparedVizData = aPreparedVizData.reduce(function (mViz, oViz) {
                    mViz[oViz.Id] = oViz;
                    return mViz;
                }, {});

                // Update model with new data
                this._oWorkPagesModel._setProperty("/data/Visualizations", oPreparedVizData);
                this._oWorkPagesModel._setProperty("/data/WorkPage", oWorkPageData);
                this._oWorkPagesModel._setProperty("/editable", bEditable);
            }.bind(this));
        }.bind(this));

        return oPostRequest;
    };

    /**
     * Load the visualizations for the given vizIds in the given siteId.
     * @param {string} sSiteId The site id.
     * @param {string[]} aVizIds An array of vizIds.
     * @return {Promise} Promise that resolves when the data is loaded and inserted into the mdoel.
     */
    WorkPage.prototype.loadVisualizations = function (sSiteId, aVizIds) {
        var sVizIds = aVizIds.map(function (sVizId) { return "\"" + sVizId + "\""; }).join(",");
        var sQuery = "{" +
                "Visualizations(" +
                    "SiteId:\"" + sSiteId + "\"," +
                    "QueryInput:{filter:{Id:{in:[" + sVizIds + "]}}}" +
                ") {" +
                    "nodes {" +
                        "Id," +
                        "Type," +
                        "Descriptor," +
                        "DescriptorResources{" +
                            "BaseUrl," +
                            "DescriptorPath" +
                        "}" +
                    "}" +
                "}" +
            "}";

        return this._doRequest(sQuery).then(function (oResult) {
            var aVizData = ObjectPath.get("data.Visualizations.nodes", oResult) || [];

            return this._transformVizData(aVizData).then(function (aPreparedVizData) {
                var oPreparedVizData = aPreparedVizData.reduce(function (mViz, oViz) {
                    mViz[oViz.Id] = oViz;
                    return mViz;
                }, {});
                this._oWorkPagesModel._setProperty("/data/Visualizations", oPreparedVizData);
            }.bind(this));
        }.bind(this));
    };

    /**
     * Load the visualizations for the given type in the given siteId.
     * @param {string} sSiteId The site id.
     * @param {string[]} aTypes The viz Types.
     * @return {Promise} Promise that resolves when the data is loaded and inserted into the mdoel.
     */

    WorkPage.prototype.loadCatalog = function (sSiteId, aTypes) {
        var sTypes = aTypes.map(function (sType) { return "\"" + sType + "\""; }).join(",");
            var sQuery = "{" +
                    "Visualizations(" +
                        "SiteId:\"" + sSiteId + "\"," +
                        "QueryInput:{filter:{Type:{in:[" + sTypes + "]}}}" +
                    ") {" +
                        "nodes{" +
                            "Id," +
                            "Type," +
                            "Descriptor," +
                            "DescriptorResources{" +
                                "BaseUrl," +
                                "DescriptorPath" +
                            "}" +
                        "}" +
                    "}" +
                "}";

            return this._doRequest(sQuery).then(function (oResult) {
                var aVizData = ObjectPath.get("data.Visualizations.nodes", oResult) || [];
                return this._transformVizData(aVizData).then(function (oPreparedVizData) {
                    this._oWorkPagesModel._setProperty("/data/Catalog", oPreparedVizData);
                }.bind(this));
            }.bind(this));
        };

    /**
     * Retrieve all vizId in the given page data object.
     *
     * @param {object} oPageData The WorkPage data object.
     * @return {string[]} An array of vizIds.
     */
    WorkPage.prototype.getAllVizIds = function (oPageData) {
        var aRows = ObjectPath.get("data.Rows", oPageData),
            aVizIds = [],
            iRowIndex = 0,
            iColumnIndex,
            iCellIndex,
            iWidgetIndex,
            aColumns, aCells, aWidgets, sVizId;
        if (!aRows || aRows.length === 0) { return []; }

        for (; iRowIndex < aRows.length; iRowIndex++) {
            aColumns = aRows[iRowIndex].Columns;
            if (!aColumns || aColumns.length === 0) { continue; }

            for (iColumnIndex = 0; iColumnIndex < aColumns.length; iColumnIndex++) {
                aCells = aColumns[iColumnIndex].Cells;
                if (!aCells || aCells.length === 0) { continue; }

                for (iCellIndex = 0; iCellIndex < aCells.length; iCellIndex++) {
                    aWidgets = aCells[iCellIndex].Widgets;
                    if (!aWidgets || aWidgets.length === 0) { continue; }

                    for (iWidgetIndex = 0; iWidgetIndex < aWidgets.length; iWidgetIndex++) {
                        sVizId = ObjectPath.get("Visualization.Id", aWidgets[iWidgetIndex]);
                        if (!sVizId) { continue; }
                        aVizIds.push(sVizId);
                    }
                }
            }
        }
        return aVizIds;
    };

    /**
     * Do the XHR request with the given query.
     *
     * @param {string} sQuery The query.
     * @return {Promise} Promise that resolves with the parsed JSON response if the request was successful, otherwise it is rejected.
     * @private
     */
    WorkPage.prototype._doRequest = function (sQuery) {
        return this.httpClient.get(this._sBaseUrl + "?query=" + sQuery, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Accept-Language": sap.ui.getCore().getConfiguration().getLanguageTag()
            }
        }).then(function (oResponse) {
            if (oResponse.status !== 200) {
                return Promise.reject("HTTP request failed with status: " + oResponse.status + " - " + oResponse.statusText);
            }
            return JSON.parse(oResponse.responseText || "{}");
        });
    };

    /**
     * This is an intermediate helper function to add some required site data to the visualizations.
     * Since the site request will be removed in the future, this function is only temporary.
     * To be removed once all of the required data from the site request can be retrieved via content API.
     *
     * @param {object[]} aVizData The array of visualizations.
     * @return {Promise<object>} The modified array of visualizations.
     * @private
     */
    WorkPage.prototype._addSiteDataToVisualizations = function (aVizData) {
        return this._oCdmServicePromise.then(function (oCdmService) {
            var sAppId, oApplication, oVizType;

            return Promise.all([
                oCdmService.getApplications(),
                oCdmService.getVizTypes()
            ]).then(function (aResults) {
                var oApplications = aResults[0];
                var oVizTypes = aResults[1];
                return aVizData.map(function (oVizData) {
                    oVizType = oVizTypes[oVizData.Type];
                    sAppId = ObjectPath.get(["Descriptor", "sap.flp", "target", "appId"], oVizData);
                    oApplication = oApplications[sAppId];
                    if (oApplication) {
                        ObjectPath.set("BusinessApp", oApplication, oVizData);
                    }
                    if (oVizType) {
                        ObjectPath.set("VizType", oVizType, oVizData);
                    }
                    return oVizData;
                });
            });
        });
    };


    /**
     * Replaces the indicatorDataSource path with the one returned by the system context, if required.
     *
     * @param {object[]} aVizData The visualization data.
     * @return {Promise<object[]>} A promise resolving with the modified vizData.
     * @private
     */
    WorkPage.prototype._replaceIndicatorDatasource = function (aVizData) {
        return Promise.all([
            this._oCSTRServicePromise,
            this._oCdmServicePromise
        ]).then(function (aResults) {
            var oCstrService = aResults[0];
            var oCdmService = aResults[1];
            return oCdmService.getApplications().then(function (oApplications) {
                return Promise.all(
                    aVizData.map(function (oVizData) {
                        var sAppId = ObjectPath.get(["Descriptor", "sap.flp", "target", "appId"], oVizData);
                        var oApplication = oApplications[sAppId];
                        var oIndicatorDataSource = ObjectPath.get(["Descriptor", "sap.flp", "indicatorDataSource"], oVizData);
                        var sContentProviderId;

                        if (oApplication) {
                            sContentProviderId = ObjectPath.get(["sap.app", "contentProviderId"], oApplication);

                            if (sContentProviderId && oIndicatorDataSource && oIndicatorDataSource.path) {
                                return oCstrService.getSystemContext(sContentProviderId).then(function (oSystemContext) {
                                    if (oSystemContext) {
                                        var sDataSourceId = oIndicatorDataSource.dataSource;
                                        var oDataSource = ObjectPath.get(["Descriptor", "sap.app", "dataSources", sDataSourceId], oVizData);
                                        var sFullyQualifiedXhrUrl;

                                        if (oDataSource) {
                                            sFullyQualifiedXhrUrl = oSystemContext.getFullyQualifiedXhrUrl(oDataSource.uri);
                                            ObjectPath.set(["Descriptor", "sap.app", "dataSources", sDataSourceId, "uri"],
                                                sFullyQualifiedXhrUrl, oVizData);
                                        } else {
                                            sFullyQualifiedXhrUrl = oSystemContext.getFullyQualifiedXhrUrl(oIndicatorDataSource.path);
                                            ObjectPath.set(["Descriptor", "sap.flp", "indicatorDataSource", "path"], sFullyQualifiedXhrUrl, oVizData);
                                        }
                                    }
                                    return oVizData;
                                }).catch(function (vError) {
                                    Log.error(vError);
                                    return oVizData;
                                });
                            }
                        }

                        return Promise.resolve(oVizData);
                    })
                );
            });
        });
    };

    /**
     * Applies preparatory transformation on the visualization data.
     *
     * @param {object[]} aVizData The visualization data
     * @return {Promise<object[]>} The modified visualization data.
     * @private
     */
    WorkPage.prototype._transformVizData = function (aVizData) {
        return this._addSiteDataToVisualizations(aVizData)
            .then(this._replaceIndicatorDatasource.bind(this));
    };

    return WorkPage;
}, /*export=*/ true);
