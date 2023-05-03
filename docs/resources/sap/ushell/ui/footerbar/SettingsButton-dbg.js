// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

// Provides control sap.ushell.ui.footerbar.SettingsButton.
sap.ui.define([
    "sap/m/Button",
    "sap/m/ButtonRenderer", // will load the renderer async
    "sap/m/library",
    "sap/ushell/resources",
    "sap/ushell/ui/footerbar/AboutButton",
    "sap/ushell/ui/footerbar/LogoutButton",
    "sap/ushell/ui/footerbar/UserPreferencesButton"
], function (
    Button,
    ButtonRenderer,
    mobileLibrary,
    resources,
    AboutButton,
    LogoutButton,
    UserPreferencesButton
) {
    "use strict";

    // shortcut for sap.m.PlacementType
    var PlacementType = mobileLibrary.PlacementType;

    /**
     * Constructor for a new ui/footerbar/SettingsButton.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     * @class Add your documentation for the new ui/footerbar/SettingsButton
     * @extends sap.m.Button
     * @constructor
     * @public
     * @name sap.ushell.ui.footerbar.SettingsButton
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
     */
    var SettingsButton = Button.extend("sap.ushell.ui.footerbar.SettingsButton", /** @lends sap.ushell.ui.footerbar.SettingsButton.prototype */ {
        metadata: { library: "sap.ushell" },
        renderer: "sap.m.ButtonRenderer"
    });

    /**
     * SettingsButton
     *
     * @name sap.ushell.ui.footerbar.SettingsButton
     * @private
     * @since 1.16.0
     */
    SettingsButton.prototype.init = function () {
        // call the parent sap.m.Button init method
        if (Button.prototype.init) {
            Button.prototype.init.apply(this, arguments);
        }

        this.setIcon("sap-icon://action-settings");
        this.setTooltip(resources.i18n.getText("helpBtn_tooltip"));

        this.attachPress(this.showSettingsMenu);

        this.defaultMenuItems = [
            new AboutButton(),
            new UserPreferencesButton(),
            new LogoutButton()
        ];
    };

    SettingsButton.prototype.setMenuItems = function (buttons) {
        this.menuItems = buttons;
    };

    SettingsButton.prototype.showSettingsMenu = function () {
        sap.ui.require(["sap/m/ActionSheet"], function (ActionSheet) {
            var oActionSheet = new ActionSheet({
                id: "settingsMenu",
                showHeader: false,
                buttons: (this.menuItems || []).concat(this.defaultMenuItems)
            });

            oActionSheet.setPlacement(PlacementType.Vertical);
            oActionSheet.openBy(this);

            oActionSheet.attachAfterClose(function () {
                oActionSheet.removeAllButtons();
                oActionSheet.destroy();
            });
        }.bind(this));
    };
    return SettingsButton;
});
