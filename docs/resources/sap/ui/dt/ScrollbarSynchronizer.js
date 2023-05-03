/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/ManagedObject","sap/ui/dt/DOMUtil","sap/ui/thirdparty/jquery"],function(t,e,jQuery){"use strict";var r=t.extend("sap.ui.dt.ScrollbarSynchronizer",{metadata:{library:"sap.ui.dt",properties:{scrollTop:{type:"float"},scrollLeft:{type:"float"},targets:{type:"any[]",defaultValue:[]}},events:{synced:{},destroyed:{}}},_bSyncing:false,constructor:function(){this._scrollEventHandler=this._scrollEventHandler.bind(this);t.apply(this,arguments)}});r.prototype.getTargets=function(){return this.getProperty("targets").slice(0)};r.prototype.setTargets=function(t){var e=Array.isArray(t)?t:[t];this.getTargets().forEach(this.removeTarget.bind(this));this.addTarget.apply(this,e)};r.prototype.removeTarget=function(t){this._detachScrollEvent(t);this.setProperty("targets",this.getTargets().filter(function(e){return e!==t}))};r.prototype.addTarget=function(){var t=Array.prototype.slice.call(arguments);if(!t.length){return}this._removeDeadNodes();t.forEach(this._attachScrollEvent,this);var e=this.getTargets().concat(t);this.setProperty("targets",e);this.sync(e[0])};r.prototype.hasTarget=function(t){return this.getTargets().indexOf(t)>-1};r.prototype._removeDeadNodes=function(){this.getTargets().forEach(function(t){if(!document.body.contains(t)){this.removeTarget(t)}},this)};r.prototype._attachScrollEvent=function(t){jQuery(t).on("scroll",this._scrollEventHandler)};r.prototype._detachScrollEvent=function(t){jQuery(t).off("scroll",this._scrollEventHandler)};r.prototype._scrollEventHandler=function(t){this.sync(t.target)};r.prototype.sync=function(t,r){if(r||this.getScrollTop()!==t.scrollTop||this.getScrollLeft()!==jQuery(t).scrollLeft()){this.setScrollTop(t.scrollTop);this.setScrollLeft(jQuery(t).scrollLeft());if(this._bSyncing){this._abortSync()}this._bSyncing=true;this.animationFrame=window.requestAnimationFrame(function(){this.getTargets().filter(function(e){return t!==e}).forEach(function(r){e.syncScroll(t,r)});this._bSyncing=false;this.fireSynced()}.bind(this))}};r.prototype._abortSync=function(){window.cancelAnimationFrame(this.animationFrame);this._bSyncing=false};r.prototype.destroy=function(){this.getTargets().forEach(function(t){this.removeTarget(t)},this);this._abortSync();this.fireDestroyed();t.prototype.destroy.apply(this,arguments)};r.prototype.isSyncing=function(){return this._bSyncing};r.prototype.refreshListeners=function(){this.getTargets().forEach(function(t){this._detachScrollEvent(t);this._attachScrollEvent(t)},this)};return r});
//# sourceMappingURL=ScrollbarSynchronizer.js.map