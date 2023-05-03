// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["./common.constants"],function(t){"use strict";var e;var a=/[?&]sap-ui-debug=(true|x|X)(&|$)/.test(window.location.search);if(!a){try{e=window.localStorage.getItem(t.uiDebugKey);a=!!e&&/^(true|x|X)$/.test(e)}catch(t){}}return a});
//# sourceMappingURL=common.debug.mode.js.map