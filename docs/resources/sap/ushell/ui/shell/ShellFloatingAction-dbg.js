// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @name sap.ushell.ui.shell.ShellFloatingAction
 *
 * @private
 */
sap.ui.define([
    "sap/ui/thirdparty/jquery",
    "sap/m/Button",
    "sap/ushell/library", // css style dependency
    "./ShellFloatingActionRenderer"
], function (jQuery, Button) {
    "use strict";

    var ShellFloatingAction = Button.extend("sap.ushell.ui.shell.ShellFloatingAction", {
        metadata: {
            library: "sap.ushell"
        }
    });

    ShellFloatingAction.prototype.init = function () {
        this.addStyleClass("sapUshellShellFloatingAction");
        //call the parent sap.m.Button init method
        if (Button.prototype.init) {
            Button.prototype.init.apply(this, arguments);
        }
    };

    ShellFloatingAction.prototype.exit = function () {
        Button.prototype.exit.apply(this, arguments);
    };

    ShellFloatingAction.prototype.onAfterRendering = function () {
        if (this.data("transformY")) {
            this.removeStyleClass("sapUshellShellFloatingActionTransition");
            jQuery(this.getDomRef()).css("transform", "translateY(" + this.data("transformY") + ")");
        } else {
            this.addStyleClass("sapUshellShellFloatingActionTransition");
        }
    };

    return ShellFloatingAction;

});
