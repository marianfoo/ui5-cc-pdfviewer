// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["./common.debug.mode","./common.load.script"],function(e,i){"use strict";function o(o){var r=sap.ui.require.toUrl(o.replace(/\./g,"/")),u;if(e){sap.ui.require(["sap/ui/core/Core"],function(e){e.boot()})}else{for(u=0;u<4;u++){i(r+"/appruntime-min-"+u+".js")}}}return o});
//# sourceMappingURL=common.load.appruntime-min.js.map