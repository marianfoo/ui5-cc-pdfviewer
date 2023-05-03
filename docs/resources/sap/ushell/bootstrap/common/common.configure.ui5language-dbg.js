// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([], function () {
    "use strict";

    /**
     * Configures UI5 language based on the shell configuration.
     *
     * @param {object} oUshellConfig The ushell configuration.
     *
     * @private
     */
    function configureUI5Language (oUshellConfig) {
        var oUserProfile = oUshellConfig &&
            oUshellConfig.services &&
            oUshellConfig.services.Container &&
            oUshellConfig.services.Container.adapter &&
            oUshellConfig.services.Container.adapter.config &&
            oUshellConfig.services.Container.adapter.config.userProfile;

        var sLanguageBcp47 = oUserProfile &&
            oUserProfile.defaults &&
            oUserProfile.defaults.languageBcp47;

        var sSapLogonLanguage = oUserProfile &&
            oUserProfile.defaults &&
            oUserProfile.defaults.language;

        // note: the sap-language query parameter must be considered by the server
        // and will change the language defaults read above
        if (sLanguageBcp47) {
            sap.ui.getCore().getConfiguration()
                .setLanguage(sLanguageBcp47, sSapLogonLanguage);
        }
    }

    return configureUI5Language;
});
