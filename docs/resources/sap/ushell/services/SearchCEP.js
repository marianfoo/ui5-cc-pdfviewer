// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([],function(){"use strict";function e(e,t,n,r){this.oAdapter=e}e.prototype.execSearch=function(e){var t=this;return new Promise(function(n){t.oAdapter.execSearch(e).then(n,function(){n({})})})};e.hasNoAdapter=false;return e},true);
//# sourceMappingURL=SearchCEP.js.map