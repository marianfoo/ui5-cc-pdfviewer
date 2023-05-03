// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/*
 * This module is the root of the CDM bootstrap.
 *
 * In summary, it configures the ushell, UI5 and loads the core-min-x libs.
 */
sap.ui.define([
    "./cdm.constants",
    "../common/common.configure.ui5",
    "../common/common.configure.ushell",
    "../common/common.override.registermodulepath",
    "../common/common.load.core-min",
    "../common/common.configure.ui5.extractLibs",
    "../common/common.load.bootstrapExtension",
    "./cdm.boot.task"
], function (
    oConstants,
    fnConfigureUI5,
    fnConfigureUShell,
    fnOverrideRegisterModulePath,
    fnLoadCoreMin,
    fnExtractUi5LibsFromUshellConfig,
    fnLoadBootstrapExtension,
    fnBootTask
) {
    "use strict";
    if (performance && performance.mark) {
        performance.mark("FLP first paint!");
    }

    // Initially the CDM platform was using the "local" bootstrap, but now the "cdm" bootstrap is used.
    // As only for some of the ushell services a CDM adapter exists, all other need to be configured to
    // use the corresponding local adapter, otherwise the FLP bootstrap is going to fail.
    // Because of that set an default configuration, which sets the missing adapters to local, in order
    // to stay compatible on all platforms.
    var oUShellConfig = fnConfigureUShell({
        defaultUshellConfig: oConstants.defaultConfig
    });

    fnConfigureUI5({
        ushellConfig: oUShellConfig,
        libs: fnExtractUi5LibsFromUshellConfig(oUShellConfig),
        platform: "cdm",
        bootTask: fnBootTask
    });

    fnOverrideRegisterModulePath();
    fnLoadBootstrapExtension(oUShellConfig);
    fnLoadCoreMin.load("sap.ushell.bootstrap");
});
