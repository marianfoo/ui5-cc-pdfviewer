/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","sap/ui/base/ManagedObject","sap/ui/test/_OpaLogger","sap/ui/test/_ControlFinder","sap/ui/core/Element","sap/ui/core/mvc/View","sap/ui/base/ManagedObjectMetadata"],function(e,t,r,n,i,a,s){"use strict";var o=t.extend("sap.ui.test.selectors._Selector",{constructor:function(){this._oLogger=r.getLogger(this.getMetadata().getName());return t.prototype.constructor.apply(this,arguments)},generate:function(t){var r=this._generate.apply(this,arguments);if(r){if(Array.isArray(r)){return r.filter(function(e){return e&&(!Array.isArray(e)||e.length)}).map(function(r){if(Array.isArray(r)){return r.map(function(r){return e.extend({},this._createSelectorBase(t,r),r)}.bind(this))}else{return e.extend({},this._createSelectorBase(t,r),r)}}.bind(this))}else{return e.extend(this._createSelectorBase(t,r),r)}}},_isAncestorRequired:function(){return false},_getAncestor:function(){return null},_isValidationRootRequired:function(){return false},_getValidationRoot:function(){return null},_createSelectorBase:function(t,r){if(n._isControlInStaticArea(t)){r.searchOpenDialogs=true}if(r.skipBasic){delete r.skipBasic;return r}else{var i={controlType:t.getMetadata()._sClassName};var a=this._getControlView(t);if(a){e.extend(i,this._getViewIdOrName(a))}return i}},_getControlView:function(e){if(!e){return undefined}if(e.getViewName){return e}else{return this._getControlView(e.getParent())}},_findAncestor:function(e,t,r){if(e){var n=e.getParent();if(n){if(t(n)){return n}else if(!r){return this._findAncestor(n,t)}}}},_getViewIdOrName:function(e){var t=e.getId();var r=e.getViewName();if(s.isGeneratedId(t)){var n=i.registry.filter(function(e){return e instanceof a}).filter(function(e){return e.getViewName()===r});return n.length>1?{}:{viewName:r}}else{return{viewId:t}}}});return o});
//# sourceMappingURL=_Selector.js.map