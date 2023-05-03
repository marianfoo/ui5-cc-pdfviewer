/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var e={};e.getParam=function(r){return e.getParams()[r]};e.getParams=function(){return document.location.search.replace(/^\?/,"").split("&").reduce(function(e,r){var t=r.split("=");var a=t[1];switch(a){case"true":a=true;break;case"false":a=false;break}e[t[0]]=a;return e},{})};return e},true);
//# sourceMappingURL=UrlParser.js.map