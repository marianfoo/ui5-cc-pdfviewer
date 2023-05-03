// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/m/SearchField",
    "sap/m/Button",
    "sap/m/ResponsivePopover",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ushell/components/shell/SearchCEP/SearchCEP.controller",
    "sap/base/Log",
    "sap/ushell/resources",
    "sap/ui/core/IconPool",
    "sap/ushell/renderers/fiori2/search/util",
    "sap/ushell/ui/shell/ShellHeadItem",
    "sap/ui/Device"
], function (UIComponent, SearchField, Button, ResponsivePopover, Fragment, JSONModel,
             SearchCEPController, Log, resources, IconPool, util, ShellHeadItem, Device
) {
    "use strict";

    return UIComponent.extend("sap.ushell.components.shell.SearchCEP.Component", {
        metadata: {
            version: "1.108.12",
            library: ["sap.ushell", "sap.ushell.components.shell"],
            dependencies: {
                libs: ["sap.m"]
            }
        },

        createContent: function () {
            try {
                this.oRenderer = sap.ushell.Container.getRenderer("fiori2");
                this.oShellHeader = sap.ui.getCore().byId("shell-header");
                // create search Icon
                this.oRenderer.addHeaderEndItem({
                    id: "sf",
                    tooltip: "{i18n>searchbox_tooltip}",
                    text: "{i18n>search}",
                    ariaLabel: "{i18n>searchbox_tooltip}",
                    icon: IconPool.getIconURI("search"),
                    visible: true,
                    showSeparator: false,
                    press: this.onShellSearchButtonPressed.bind(this)
                }, true, false);
                this.oShellSearchBtn = sap.ui.getCore().byId("sf");
                // create search field on shell header
                var oSearchConfig = {
                    width: "90%",
                    placeholder: resources.i18n.getText("search"),
                    tooltip: resources.i18n.getText("search"),
                    enableSuggestions: true,
                    suggest: this.onSuggest.bind(this),
                    search: this.onSearch.bind(this),
                    liveChange: this.onSuggest.bind(this)
                };
                this.oSF = new SearchField("PlaceHolderSearchField", oSearchConfig);
                this.oSF.addStyleClass("sapUiMediumMarginBeginEnd");

                var sScreenSize = this.getScreenSize();
                if (sScreenSize === "S") {
                    this.initSearchSSize();
                } else if (sScreenSize === "M" || sScreenSize === "L") {
                    this.initSearchMLSizes();
                } else if (sScreenSize === "XL") {
                    this.initSearchXLSize();
                }
                this.oShellHeader.setSearch(this.oSF);
                this.oSearchCEPController = new SearchCEPController();
            } catch (error) {
                Log.info("Failed to create CEP search field content" + error);
            }

            sap.ui.getCore().getEventBus().publish("shell", "searchCompLoaded", { delay: 0 });
        },

        initSearchSSize: function () {
            this.oSF.setWidth("60%");
            this.oShellHeader.setSearchState("COL", 35, false);
        },

        initSearchMLSizes: function () {
            this.oShellHeader.setSearchState("COL", 35, false);
        },

        initSearchXLSize: function () {
            this.oShellSearchBtn.setVisible(false);
            this.oShellHeader.setSearchState("EXP", 35, false);
        },

        onSuggest: function (event) {
            if (sap.ui.getCore().byId("CEPSearchField")) {
                this.oSearchCEPController.onSuggest(event);
            } else {
                this.oSearchCEPController.onInit();
            }
        },

        onSearch: function (event) {
            if (sap.ui.getCore().byId("CEPSearchField")) {
                this.oSearchCEPController.onSearch(event);
            }
        },

        exit: function () {
            this.oSearchCEPController.onExit();
        },

        expandSearch: function () {
            this.oShellHeader.setSearchState("EXP_S", 35, false);
            this.oSF.focus();
        },

        onShellSearchButtonPressed: function () {
            this.oShellSearchBtn.setVisible(false);
            this.expandSearch();
        },

        collapseSearch: function () {
            this.oShellHeader.setSearchState("COL", 35, false);
            this.oShellSearchBtn.setVisible(true);
        },

        getScreenSize: function () {
            var oScreenSize = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD_EXTENDED);
            if (oScreenSize.from >= 1440) {
                return "XL";
            } else if (oScreenSize.from >= 1024) {
                return "L";
            } else if (oScreenSize.from >= 600) {
                return "M";
            } else if (oScreenSize.from >= 0) {
                return "S";
            }
        }
    });
});
