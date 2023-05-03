// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/thirdparty/jquery"
], function (jQuery) {
    "use strict";

    /**
     * @class sap.ushell.ui.launchpad.LoadingDialogRenderer
     * @static
     * @private
     */
    var LoadingDialogRenderer = {
        apiVersion: 2,

        /**
         * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
         *
         * @param {sap.ui.core.RenderManager} rm the RenderManager that can be used for writing to the render output buffer
         * @param {sap.ui.core.Control} loadingDialog an object representation of the control that should be rendered
         * @private
         */
        render: function (rm, loadingDialog) {
            var sTooltip = loadingDialog.getTooltip_AsString();
            rm.openStart("div", loadingDialog);
            rm.class("sapUshellLoadingDialogControl");
            if (sTooltip) {
                rm.attr("title", sTooltip);
            }
            rm.openEnd(); // div - tag

            if (jQuery.os.ios || !loadingDialog._isPlatformDependent) {
                this.renderAppInfo(rm, loadingDialog);
                this.renderFioriFlower(rm);
            } else {
                this.renderFioriFlower(rm);
                this.renderAppInfo(rm, loadingDialog);
            }

            rm.close("div");
        },

        renderAppInfo: function (rm, loadingDialog) {
            rm.openStart("div");
            rm.class("sapUshellLoadingDialogAppData");
            rm.openEnd(); // div - tag
            if (loadingDialog.getIconUri()) {
                rm.renderControl(loadingDialog.oIcon);
            }
            rm.openStart("span", loadingDialog.getId() + "-accessibility-helper");
            rm.class("sapUshellAccessibilityHelper");
            rm.attr("aria-live", "rude");
            rm.attr("aria-relevant", "additions text");
            rm.openEnd(); // span - tag
            rm.close("span");
            rm.renderControl(loadingDialog._oLabel);
            rm.close("div");
        },

        renderFioriFlower: function (rm) {
            var oUserAgentRegex = /Android\s4\.2.+GT-I9505.+Chrome\/18/, // Chrome 18 on Android 4.2.x / Samsung Galaxy S4
                bReplaceFlower = navigator.userAgent && oUserAgentRegex.test(navigator.userAgent); // some browsers do not get the flower but the replacement

            // create either flowery code or busy indicator
            if (jQuery.support.cssAnimations && !bReplaceFlower) {
                rm.openStart("div", "fiori2-loader");
                rm.openEnd(); // div - tag

                rm.openStart("div");
                rm.class("fiori2-blossom");
                rm.openEnd(); // div - tag

                for (var i = 1; i < 6; ++i) {
                    rm.openStart("div");
                    rm.class("fiori2-leafContainer");
                    rm.class("fiori2-leafContainer" + i);
                    rm.openEnd(); // div - tag

                    rm.openStart("div");
                    rm.class("fiori2-leaf");
                    rm.class("fiori2-leaf" + i);
                    rm.openEnd(); // div - tag
                    rm.close("div");
                    // end leafContainer
                    rm.close("div");
                }

                // end blossom
                rm.close("div");
                // end fiori2-loader
                rm.close("div");
            }
        }
    };

    return LoadingDialogRenderer;
}, /* bExport= */ true);
