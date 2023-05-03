/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/model/json/JSONModel","sap/ui/core/Core"],function(e,r,a){"use strict";var t={layers:{admin:0,content:5,translation:10,all:20},mergeManifestPathChanges:function(e,r){Object.keys(r).forEach(function(a){if(a.charAt(0)==="/"){var t=r[a];e.setProperty(a,t)}})},mergeDelta:function(a,n,o){var i=e({},a);if(typeof o==="undefined"){o="sap.card"}if(Array.isArray(n)&&n.length>0){var s;n.forEach(function(a){if(a.content){e(i[o],a.content)}else{s=s||new r(i);t.mergeManifestPathChanges(s,a)}})}return i},mergeDesigntimeMetadata:function(r,a){var t=e({},r);a.forEach(function(e){var r=e.content.entityPropertyChange||[];r.forEach(function(e){var r=e.propertyPath;switch(e.operation){case"UPDATE":if(t.hasOwnProperty(r)){t[r]=e.propertyValue}break;case"DELETE":delete t[r];break;case"INSERT":if(!t.hasOwnProperty(r)){t[r]=e.propertyValue}break;default:break}})});return t}};return t});
//# sourceMappingURL=Merger.js.map