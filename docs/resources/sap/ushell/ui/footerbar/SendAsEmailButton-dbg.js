// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

// Provides control sap.ushell.ui.footerbar.SendAsEmailButton.
sap.ui.define([
    "sap/base/Log",
    "sap/m/Button",
    "sap/m/ButtonRenderer", // will load the renderer async
    "sap/ushell/Config",
    "sap/ushell/resources"
], function (Log, Button, ButtonRenderer, Config, resources) {
    "use strict";

    /**
     * Constructor for a new ui/footerbar/SendAsEmailButton.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     *
     * @class
     * Add your documentation for the new ui/footerbar/SendAsEmailButton
     * @extends sap.m.Button
     *
     * @constructor
     * @public
     * @name sap.ushell.ui.footerbar.SendAsEmailButton
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
     */
    var SendAsEmailButton = Button.extend("sap.ushell.ui.footerbar.SendAsEmailButton", /** @lends sap.ushell.ui.footerbar.SendAsEmailButton.prototype */ {
        metadata: {
            library: "sap.ushell",
            properties: {
                beforePressHandler: { type: "any", group: "Misc", defaultValue: null },
                afterPressHandler: { type: "any", group: "Misc", defaultValue: null }
            }
        },
        renderer: "sap.m.ButtonRenderer"
    });

    /**
     * SendAsEmailButton
     *
     * @name sap.ushell.ui.footerbar.SendAsEmailButton
     * @private
     * @since 1.71.0
     */
    SendAsEmailButton.prototype.init = function () {
        // call the parent sap.m.Button init method
        if (Button.prototype.init) {
            Button.prototype.init.apply(this, arguments);
        }
        this.setIcon("sap-icon://email");
        this.setText(resources.i18n.getText("sendEmailBtn"));
        this.setTooltip(resources.i18n.getText("sendEmailBtn_tooltip"));

        this.attachPress(function () {
            if (this.getBeforePressHandler()) {
                this.getBeforePressHandler()();
            }
            this.sendAsEmailPressed(this.getAfterPressHandler());
        }.bind(this));
    };

    /**
     *
     * @param {function} [cb] callback function
     */
    SendAsEmailButton.prototype.sendAsEmailPressed = function (cb) {
        // If we're running over an IFrame...
        if (sap.ushell.Container.inAppRuntime()) {
            // DO NOT CHANGE the line below, this is to optimize the bundle build process
            sap.ui.require(["sap/ushell/appRuntime/ui5/AppRuntimeService"], function (AppRuntimeService) {
                AppRuntimeService.sendMessageToOuterShell(
                    "sap.ushell.services.ShellUIService.sendEmailWithFLPButton",
                    { bSetAppStateToPublic: true });
            });
        } else {
            var sURL = document.URL;
            var sAppName = Config.last("/core/shellHeader/application").title;
            var sSubject = (sAppName === undefined) ?
                resources.i18n.getText("linkToApplication") :
                resources.i18n.getText("linkTo") + " '" + sAppName + "'";
            sap.ushell.Container.getServiceAsync("AppState")
                .then(function (oAppStateService) {
                    oAppStateService.setAppStateToPublic(sURL)
                        .done(function (sNewURL) {
                            sap.m.URLHelper.triggerEmail(
                                null,
                                sSubject,
                                sNewURL
                            );
                        }).fail(Log.error);
                });
        }

        if (cb) {
            cb();
        }
    };

    return SendAsEmailButton;
}, true /* bExport */);
