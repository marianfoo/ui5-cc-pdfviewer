/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */

sap.ui.define([
    "sap/ui/core/Control",
    "sap/f/GridContainer",
    "sap/f/GridContainerSettings",
    "sap/ushell/services/_VisualizationInstantiation/VizInstanceCdm",
    "sap/ushell/services/_VisualizationInstantiation/VizInstance",
    "sap/ushell/services/_VisualizationInstantiation/VizInstanceLink",
    "sap/ushell/adapters/cdm/v3/_LaunchPage/readUtils",
    "sap/ushell/adapters/cdm/v3/utilsCdm",
    "sap/f/GridContainerItemLayoutData",
    "sap/ushell/adapters/cdm/v3/_LaunchPage/readVisualizations",
    "sap/base/util/ObjectPath",
    "sap/m/VBox",
    "sap/m/Button",
    "sap/m/library",
    "sap/ushell/library",
    "sap/ushell/EventHub"
], function (
    Control,
    GridContainer,
    GridContainerSettings,
    VizInstanceCdm,
    VizInstance,
    VizInstanceLink,
    readUtils,
    utilsCdm,
    GridContainerItemLayoutData,
    readVisualizations,
    ObjectPath,
    VBox,
    Button,
    mobileLibrary,
    ushellLibrary,
    EventHub
) {
    "use strict";

    // shortcut for sap.m.TileSizeBehavior
    var TileSizeBehavior = mobileLibrary.TileSizeBehavior;

    var DisplayFormat = ushellLibrary.DisplayFormat;

    var LoadState = mobileLibrary.LoadState;

    /**
     * Constructor for a new WorkPageSection.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * The WorkPageSection represents a special control that is used to wrap visualization widgets.
     * The WorkPageSection is used if a WorkPageCell has the mode "Section".
     * @extends sap.ui.core.Control
     *
     *
     * @version 1.108.12
     *
     * @private
     * @experimental
     * @alias sap.ushell.components.workPageBuilder.controls.WorkPageSection
     */
    var WorkPageSection = Control.extend("sap.ushell.components.workPageBuilder.controls.WorkPageSection", /** @lends sap.ushell.components.workPageBuilder.controls.WorkPageSection.prototype */ {
        metadata: {
            library: "sap.ushell",
            properties: {
                /**
                 * Indicates in which size the visualizations should be rendered.
                 */
                sizeBehavior: { type: "sap.m.TileSizeBehavior", group: "Misc", defaultValue: TileSizeBehavior.Responsive },
                /**
                 * Indicates if the section is in edit mode.
                 */
                editMode: { type: "boolean", group: "Misc", defaultValue: false }
            },
            aggregations: {
                /**
                 * A set of visualizations that are rendered in the section.
                 */
                visualizations: {
                    type: "sap.ushell.services._VisualizationInstantiation.VizInstance",
                    multiple: true,
                    singularName: "visualization"
                },
                /**
                 * A private aggregation to store the "VBox" control.
                 */
                _sectionVbox: {
                    type: "sap.m.VBox",
                    multiple: false,
                    visibility: "hidden"
                },
                /**
                 * A private aggregation for the "Add Applications" button.
                 */
                _addVizInstanceButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" }
            },
            events: {
                /**
                 * Fired if a Visualization is deleted.
                */
                deleteVisualization: {}
            }
        },

        renderer: {
            apiVersion: 2,

            /**
             * Renders the HTML for the WorkPageSection, using the provided {@link sap.ui.core.RenderManager}.
             *
             * @param {sap.ui.core.RenderManager} rm The RenderManager.
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageSection} workPageSection The WorkPageSection to be rendered.
             */
            render: function (rm, workPageSection) {
                var bEditMode = workPageSection.getEditMode();
                var oSectionVBox = workPageSection.getAggregation("_sectionVbox");
                rm.openStart("div", workPageSection);
                rm.class("sapCepWorkPageSection");
                rm.openEnd(); // div - tag

                rm.renderControl(oSectionVBox);

                var aVizInstances = oSectionVBox.getItems()[0].getItems();
                aVizInstances.forEach(function (oVizInstance) {
                    oVizInstance.setEditable(bEditMode);
                });

                if (bEditMode) {
                    rm.openStart("div");
                    rm.class("sapCepColumnToolbar");
                    rm.openEnd(); // div - tag

                    rm.renderControl(workPageSection.getAddVizInstanceButton());

                    rm.close("div");
                }

                rm.close("div");
            }
        }
    });

    /**
     * Initializes the control, creates the VBox control and stores it in the aggregation.
     */
    WorkPageSection.prototype.init = function () {
        Control.prototype.init.apply(this, arguments);
        this.setAggregation("_sectionVbox", this._createSectionVbox());
    };

    /**
     * Creates a new VBox, containing a GridContainer
     * @return {sap.m.VBox} The VBox control.
     * @private
     */
    WorkPageSection.prototype._createSectionVbox = function () {
        return new VBox(this.getId() + "--sapCepWorkPageSectionVBox", {
            items: [
                this._createGridContainer()
            ]
        });
    };

    /**
     * Creates the Add Application button for this WorkPageSection.
     *
     * @return {sap.m.Button} The button control.
     * @private
     */
    WorkPageSection.prototype._createAddVizInstanceButton = function () {
        return new Button({
            text: this.getModel("i18n").getResourceBundle().getText("WorkPage.Section.AddVizInstanceButtonText"),
            visible: true,
            press: function () {
                this.fireEvent("addApplications");
            }.bind(this)
        });
    };

    /**
     * Checks if the button control already exists in the aggregation. If not, it will be created and saved in the aggregation.
     *
     * @return {sap.m.Button} The button control.
     */
    WorkPageSection.prototype.getAddVizInstanceButton = function () {
        if (!this.getAggregation("_addVizInstanceButton")) {
            this.setAggregation("_addVizInstanceButton", this._createAddVizInstanceButton());
        }
        return this.getAggregation("_addVizInstanceButton");
    };

    /**
     * Lifecycle method. Called after the control has been rendered.
     */
    WorkPageSection.prototype.onAfterRendering = function () {
        // Unfortunately this is required because the GridContainer control receives the resize
        // events before the DOM is updated.
        this.getAggregation("_sectionVbox").getItems()[0]._resize();
    };

    /**
     * Forwards the "visualizations" aggregation to the "items" aggregation of the GridContainer.
     * @param {string} sAggregationName The name of the aggregation.
     * @param {object} oBindingInfo The binding info object.
     * @return {sap.ushell.components.workPageBuilder.controls.WorkPageSection} The section instance.
     */
    WorkPageSection.prototype.bindAggregation = function (sAggregationName, oBindingInfo) {
        if (sAggregationName === "visualizations") {
            oBindingInfo.factory = this.visualizationFactory.bind(this);
            this.getAggregation("_sectionVbox").getItems()[0].bindAggregation("items", oBindingInfo);
            return this;
        }
        Control.prototype.bindAggregation.call(this, sAggregationName, oBindingInfo);
        return this;
    };

    /**
     * Factory for visualizations.
     * Creates a CDM VizInstance for each data entry.
     *
     * @param {string} sVizId The DOM id of the visualization.
     * @param {sap.ui.model.Context} oVizContext The context of the visualization instance.
     *
     * @return {sap.ushell.services._VisualizationInstantiation.VizInstanceCdm} The CDM VizInstance.
     */
    WorkPageSection.prototype.visualizationFactory = function (sVizId, oVizContext) {
        var oVizId = oVizContext.getObject();
        var oVizData = oVizContext.getModel().getProperty("/data/Visualizations/" + oVizId.Visualization.Id);
        var oVizInstance = this._instantiateVisualization(oVizData);

        oVizInstance.attachPress(this.onVisualizationPress, this);

        return oVizInstance;
    };

    /**
     * Press handler which is called upon visualization press
     *
     * @param {sap.ui.base.Event} oEvent SAPUI5 event object
     * @private
    */
    WorkPageSection.prototype.onVisualizationPress = function (oEvent) {
        var sScope = oEvent.getParameter("scope");
        var sAction = oEvent.getParameter("action");

        if (sScope === "Actions" && sAction === "Remove") {
            this.fireEvent("deleteVisualization", oEvent);
        }
    };

    /**
     * Creates a new GridContainer.
     *
     * @return {sap.f.GridContainer} The GridContainer instance.
     * @private
     */
    WorkPageSection.prototype._createGridContainer = function () {
        var sTileSize = this.getSizeBehavior() === TileSizeBehavior.Small ? "4.375rem" : "5rem";
        return new GridContainer(this.getId() + "--sapCepWorkPageSectionGridContainer", {
            containerQuery: true,
            minHeight: "0",
            visible: true,
            layout: new GridContainerSettings({
                gap: "1rem",
                rowSize: sTileSize,
                columnSize: sTileSize
            }),
            layoutXS: new GridContainerSettings({
                gap: "1rem",
                columns: 2,
                rowSize: "5rem",
                columnSize: "5rem"
            }),
            layoutS: new GridContainerSettings({
                gap: "1rem",
                columns: 4,
                rowSize: sTileSize,
                columnSize: sTileSize
            }),
            layoutM: new GridContainerSettings({
                gap: "1rem",
                columns: 0,
                rowSize: sTileSize,
                columnSize: sTileSize
            }),
            layoutL: new GridContainerSettings({
                gap: "1rem",
                columns: 12,
                rowSize: sTileSize,
                columnSize: sTileSize
            }),
            layoutXL: new GridContainerSettings({
                gap: "1rem",
                columns: 12,
                rowSize: sTileSize,
                columnSize: sTileSize
            })
        });
    };

    /**
     * Instantiates a VizInstance.
     *
     * @param {{Id, Type, Descriptor}} oVizData The Visualization object.
     * @return {sap.ushell.ui.launchpad.VizInstanceCdm|sap.ushell.ui.launchpad.VizInstanceLink} The viz instance.
     * @private
     */
    WorkPageSection.prototype._instantiateVisualization = function (oVizData) {
        var oVizInstance;
        var sPlatform = "CDM";
        var oIndicatorDataSource = ObjectPath.get(["Descriptor", "sap.flp", "indicatorDataSource"], oVizData);
        var oApplications = {};
        var sAppId = ObjectPath.get(["Descriptor", "sap.flp", "target", "appId"], oVizData);
        var oDataSource;
        var oDataSources;
        if (oIndicatorDataSource) {
            oDataSources = ObjectPath.get(["Descriptor", "sap.app", "dataSources"], oVizData);
            if (oDataSources) {
                oDataSource = oDataSources[oIndicatorDataSource.dataSource];
            }
        }

        if (ObjectPath.get("BusinessApp", oVizData)) {
            oApplications[sAppId] = ObjectPath.get("BusinessApp", oVizData);
        }

        var oVizInstanceData = {
            vizRefId: oVizData.Id,
            title: ObjectPath.get([ "Descriptor", "sap.app", "title"], oVizData),
            subtitle: ObjectPath.get(["Descriptor", "sap.app", "subTitle"], oVizData),
            info: ObjectPath.get(["Descriptor", "sap.app", "info"], oVizData),
            icon: ObjectPath.get(["Descriptor", "sap.ui", "icons", "icon"], oVizData),
            keywords: ObjectPath.get(["Descriptor", "sap.app", "tags", "keywords"], oVizData) || [],
            instantiationData: {
                platform: "CDM",
                vizType: oVizData.VizType
            },
            indicatorDataSource: oIndicatorDataSource,
            dataSource: oDataSource,
            contentProviderId: ObjectPath.get("BusinessApp", "sap.app", "contentProviderId", oVizData),
            vizConfig: ObjectPath.get(["Descriptor"], oVizData),
            supportedDisplayFormats: ObjectPath.get(["Descriptor", "sap.flp", "vizOptions", "displayFormats", "supported"], oVizData || {}),
            displayFormat: ObjectPath.get(["Descriptor", "sap.flp", "vizOptions", "displayFormats", "default"], oVizData || {}),
            numberUnit: ObjectPath.get(["Descriptor", "sap.flp", "numberUnit"], oVizData || {}),
            dataHelpId: oVizData.Id
        };

        if (oVizInstanceData.indicatorDataSource) {
            oVizInstanceData.indicatorDataSource.ui5object = true;
        }

        if (oVizInstanceData.displayFormat === DisplayFormat.Compact) {
            this._cleanInstantiationDataForLink(oVizInstanceData);
            sPlatform = "LINK";
        }

        switch (sPlatform) {
            case "CDM":
                oVizInstance = new VizInstanceCdm(oVizInstanceData);
                oVizInstance.setLayoutData(new GridContainerItemLayoutData(oVizInstance.getLayout()));
                break;
            case "LINK":
                oVizInstance = new VizInstanceLink(oVizInstanceData);
                break;
            default:
                return new VizInstance({
                    state: LoadState.Failed
                });
        }



        // we need to set these properties separately because it is likely that they contain stringified objects
        // which might be interpreted as complex binding
        // e.g. appSpecificRoute of search
        // BCP: 2070390842
        // BCP: 002075129400006346412020
        // BCP: 2180362150
        oVizInstance.setTitle(ObjectPath.get([ "Descriptor", "sap.app", "title"], oVizData));
        oVizInstance.setSubtitle(ObjectPath.get([ "Descriptor", "sap.app", "subTitle"], oVizData));
        oVizInstance.setActive(true);

        var oTarget = ObjectPath.get(["Descriptor", "sap.flp"], oVizData);

        if (oTarget) {
            oVizInstanceData.target = readUtils.harmonizeTarget(ObjectPath.get(["Descriptor", "sap.flp"], oVizData));
            oVizInstanceData.targetURL = utilsCdm.toHashFromVizData(ObjectPath.get(["Descriptor", "sap.flp"], oVizData), oApplications);

            oVizInstance.setTargetURL(oVizInstanceData.targetURL);
        }

        if (sPlatform !== "LINK") {
            oVizInstance.setInfo(oVizInstanceData.info);
        }

        if (readVisualizations.isStandardVizType(oVizData.Type)) {
            try {
                oVizInstance.load().then(function () {
                    // this event is currently only used to measure the TTI for which only standard VizTypes are relevant
                    EventHub.emit("VizInstanceLoaded", oVizData.Id);
                });
            } catch (error) {
                oVizInstance.setState(LoadState.Failed);
                // this event is currently only used to measure the TTI for which only standard VizTypes are relevant
                EventHub.emit("VizInstanceLoaded", oVizData.Id);
            }
        } else {
            oVizInstance.setState(LoadState.Loading);
            // load custom visualizations only after the core-ext modules have been loaded
            // to prevent that the custom visualizations trigger single requests
            EventHub.once("CoreResourcesComplementLoaded").do(function () {
                try {
                    // The parameter signals that this is a custom visualization.
                    // Only relevant for CDM
                    oVizInstance.load(true).then(function () {
                        oVizInstance.setState(LoadState.Loaded);
                    });
                } catch (error) {
                    oVizInstance.setState(LoadState.Failed);
                }
            });
        }

        return oVizInstance;
    };

    /**
     * Delete the properties not required for VizInstanceLink.
     * @param {object} oVizData The vizData.
     * @private
     */
    WorkPageSection.prototype._cleanInstantiationDataForLink = function (oVizData) {
        delete oVizData.info;
        delete oVizData.icon;
        delete oVizData.keywords;
        delete oVizData.instantiationData;
        delete oVizData.dataSource;
        delete oVizData.contentProviderId;
        delete oVizData.vizConfig;
        delete oVizData.numberUnit;
        delete oVizData.indicatorDataSource;
        delete oVizData.preview;
    };

    return WorkPageSection;
});
