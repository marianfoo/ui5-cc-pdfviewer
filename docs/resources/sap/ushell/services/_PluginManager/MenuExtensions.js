// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([],function(){"use strict";function n(n){return function e(r){return sap.ushell.Container.getServiceAsync("Menu").then(function(e){return e.getEntryProvider(n,r)})}}return function(e){return{getMenuEntryProvider:n(e)}}});
//# sourceMappingURL=MenuExtensions.js.map