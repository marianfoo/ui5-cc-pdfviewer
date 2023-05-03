/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","sap/ui/core/Configuration"],function(jQuery,r){"use strict";var e={};e.loadStyles=function(e){return jQuery.get(sap.ui.require.toUrl(("sap.ui.rta.assets."+e).replace(/\./g,"/"))+".css").then(function(e){if(r.getRTL()){return e.replace(/right/g,"left")}return e})};return e},true);
//# sourceMappingURL=StylesLoader.js.map