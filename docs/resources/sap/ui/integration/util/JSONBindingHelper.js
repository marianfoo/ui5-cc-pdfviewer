/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/BindingParser","sap/ui/integration/util/BindingHelper"],function(n,i){"use strict";var e=[["ESCAPED_BINDING_START",/\\{/g,"\\{"],["ESCAPED_BINDING_END",/\\}/g,"\\}"],["BINDING_START",/{/g,"{"],["BINDING_END",/}/g,"}"]];var r={};r.createJsonWithBindingInfos=function(n,e){if(!n){return n}var r=this._createBindableJson(n),t=i.createBindingInfos(r,e);if(typeof t==="string"){t=this._escape(t)}return t};r._createBindableJson=function(n){var i;i=JSON.stringify(n,function(n,i){if(typeof i==="string"){return this._encodeBindingString(i)}return i}.bind(this));i=this._escape(i);i=this._decodeBindingString(i);return i};r._escape=function(i){return n.complexParser.escape(i)};r._encodeBindingString=function(n){e.forEach(function(i){var e=i[0],r=i[1];n=n.replace(r,e)});return n};r._decodeBindingString=function(n){e.forEach(function(i){var e=i[0],r=i[2];n=n.replace(new RegExp(e,"g"),r)});return n};return r});
//# sourceMappingURL=JSONBindingHelper.js.map