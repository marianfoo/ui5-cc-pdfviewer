/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/LoaderExtensions","sap/base/i18n/ResourceBundle","sap/base/util/includes"],function(e,n,u){"use strict";var r=function(){var r,s,a;e.loadResource("sap/ui/integration/editor/languages.json",{dataType:"json",failOnError:false,async:true}).then(function(e){s=e});function t(){r=[];for(var e in s){var t;if(a){var i=[e];if(e.indexOf("-")>-1){i.push(e.substring(0,e.indexOf("-")))}if(!u(i,"en")){i.push("en")}t=n.create({url:a,async:false,locale:e,supportedLocales:i})}r[e]={language:s[e],resourceBundle:t}}return r}return{getResourceBundleURL:function(){return a},setResourceBundleURL:function(e){a=e},getInstance:function(){if(!r){r=t()}return r}}}();return r});
//# sourceMappingURL=EditorResourceBundles.js.map