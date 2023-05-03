// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ushell/components/applicationIntegration/AppLifeCycle",
    "sap/ushell/Config",
    "sap/ushell/components/shell/MeArea/MeArea.controller"
], function (
    UIComponent,
    AppLifeCycle,
    Config,
    MeAreaController
) {
    "use strict";

    var _oRenderer;
    // Shortcut to sap.ushell.Container.getRenderer("fiori2")
    function _renderer () {
        if (!_oRenderer) {
            _oRenderer = sap.ushell.Container.getRenderer("fiori2");
        }
        return _oRenderer;
    }

    // MeArea Component
    return UIComponent.extend("sap.ushell.components.shell.MeArea.Component", {

        metadata: {
            version: "1.108.12",
            library: "sap.ushell",
            dependencies: {
                libs: ["sap.m"]
            }
        },

        createContent: function () {
            this._bIsMeAreaCreated = false;

            this.oMeAreaController = new MeAreaController();
            this.oMeAreaController.onInit();

            var that = this;

            // In state blank when no Action Items do not display MeArea.
            AppLifeCycle.getElementsModel().createTriggers([{
                fnRegister: function () {
                    if (!that.oActionsDoable) {
                        that.oActionsDoable = Config.on("/core/shell/model/currentState/actions").do(function (aActions) {
                            if (aActions && aActions.length > 0) {
                                _renderer().showHeaderEndItem(["meAreaHeaderButton"], true);
                            } else {
                                _renderer().hideHeaderEndItem(["meAreaHeaderButton"], true);
                            }
                        });
                    }
                },
                fnUnRegister: function () {
                    if (!that.oActionsDoable) {
                        that.oActionsDoable.off();
                        that.oActionsDoable = null;
                    }
                }
            }], false, ["blank-home", "blank"]);

            sap.ui.getCore().getEventBus().publish("shell", "meAreaCompLoaded", { delay: 0 });
        },

        exit: function () {
            if (this.oActionsDoable) {
                this.oActionsDoable.off();
            }
            this.oEventListener.off();
            this.oMeAreaController.onExit();
        }
    });

});
