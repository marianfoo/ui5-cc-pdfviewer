/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var e="sap.ui.fl";return{forEachObjectInStorage:function(r,t){var n=r.storage.getItems&&r.storage.getItems()||r.storage;return Promise.resolve(n).then(function(n){var a=Object.keys(n).map(function(a){var c=a.includes(e);if(!c){return}var i=n[a];var u=r.storage._itemsStoredAsObjects?i:JSON.parse(i);var f=true;if(r.reference){f=u.reference===r.reference||u.reference+".Component"===r.reference}var o=true;if(r.layer){o=u.layer===r.layer}if(!f||!o){return}return t({changeDefinition:u,key:a})});return Promise.all(a)})},getAllFlexObjects:function(e){var r=[];return this.forEachObjectInStorage(e,function(e){r.push(e)}).then(function(){return r})},createFlexKey:function(r){if(r){return e+"."+r}},createFlexObjectKey:function(e){return this.createFlexKey(e.fileName)}}});
//# sourceMappingURL=ObjectStorageUtils.js.map