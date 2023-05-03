/*!
* OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
*/
sap.ui.define(["sap/ui/integration/util/Utils","sap/base/strings/hyphenate","sap/base/strings/camelize"],function(t,e,i){"use strict";function n(){if(this.constructor===n){throw new TypeError('Abstract class "CustomElementBase" cannot be instantiated directly.')}return Reflect.construct(HTMLElement,[],this.constructor)}n.prototype=Object.create(HTMLElement.prototype);n.prototype.constructor=n;n.prototype.connectedCallback=function(){this._init();this._upgradeAllProperties();this._oControlInstance.placeAt(this.firstElementChild);this._attachEventListeners()};n.prototype.disconnectedCallback=function(){if(this._oControlInstance){this._oControlInstance.destroy();delete this._oControlInstance}if(this.firstElementChild){this.removeChild(this.firstElementChild)}};n.prototype.attributeChangedCallback=function(e,o,s){this._init();var r=i(e);if(t.isJson(s)){s=JSON.parse(s)}if(this._mAllProperties[r]){this._mAllProperties[r].set(this._oControlInstance,s)}else if(this._mAllAssociations[r]){var a=document.getElementById(s);if(a instanceof n){s=document.getElementById(s)._getControl()}this._mAllAssociations[r].set(this._oControlInstance,s)}};n.prototype._init=function(){if(!this._oControlInstance){this._oControlInstance=new this._ControlClass}if(!this.firstElementChild){var t=document.createElement("div");this.appendChild(t)}};n.prototype._getControl=function(){this._init();return this._oControlInstance};n.prototype._attachEventListeners=function(){Object.keys(this._oMetadata.getEvents()).map(function(t){this._oControlInstance.attachEvent(t,function(e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:true}))},this)}.bind(this))};n.prototype._upgradeAllProperties=function(){this._aAllProperties.forEach(this._upgradeProperty.bind(this))};n.prototype._upgradeProperty=function(t){if(this[t]){var e=this[t];delete this[t];this[t]=e}};n.generateAccessors=function(t,i){i.forEach(function(i){Object.defineProperty(t,i,{get:function(){return this.getAttribute(e(i))},set:function(t){if(typeof t==="object"){t=JSON.stringify(t)}this.setAttribute(e(i),t)}})})};n.define=function(t,e,i){i=i||[];n.awaitDependencies(i).then(function(){window.customElements.define(t,e)})};n.awaitDependencies=function(t){var e=t.map(function(t){return window.customElements.whenDefined(t)});return Promise.all(e)};n.extend=function(t,i){function o(){return n.apply(this,arguments)}o.prototype=Object.create(n.prototype);o.prototype.constructor=o;var s=o.prototype,r="";s._ControlClass=t;s._oMetadata=t.getMetadata();s._mAllAssociations=s._oMetadata.getAllAssociations();s._mAllProperties=s._oMetadata.getAllProperties();s._aAllProperties=[];if(i&&i.customProperties){s._mAllProperties=Object.assign(s._mAllProperties,i.customProperties)}for(r in s._mAllProperties){if(i&&i.privateProperties&&i.privateProperties.indexOf(r)!==-1){continue}s._aAllProperties.push(r)}for(r in s._mAllAssociations){s._aAllProperties.push(r)}Object.defineProperty(o,"observedAttributes",{get:function(){var t=s._aAllProperties.map(e);return t}});n.generateAccessors(s,s._aAllProperties);return o};return n});
//# sourceMappingURL=CustomElementBase.js.map