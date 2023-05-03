/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/plugin/Plugin","sap/ui/dt/OverlayRegistry","sap/ui/dt/OverlayUtil","sap/base/util/includes","sap/base/util/restricted/_debounce","sap/ui/thirdparty/jquery"],function(e,t,n,i,a,jQuery){"use strict";var r=e.extend("sap.ui.rta.plugin.Stretch",{metadata:{library:"sap.ui.rta",properties:{},associations:{stretchCandidates:{type:"sap.ui.core.Control",multiple:true}},events:{}}});r.STRETCHSTYLECLASS="sapUiRtaStretchPaddingTop";function s(e,t){return e&&e.getGeometry()&&t.getGeometry()&&e.getGeometry().position.top===t.getGeometry().position.top&&e.getGeometry().position.left===t.getGeometry().position.left}function l(e,t){var n=e.getElement();if(n.addStyleClass&&n.removeStyleClass){if(t){n.addStyleClass(r.STRETCHSTYLECLASS)}else{n.removeStyleClass(r.STRETCHSTYLECLASS)}}else{var i=e.getAssociatedDomRef();if(i){if(t){i.addClass(r.STRETCHSTYLECLASS)}else{i.removeClass(r.STRETCHSTYLECLASS)}}}}function o(e,t,i){var a=e.getGeometry();if(!a){return false}var r=a.size.height;if(i){r-=parseInt(jQuery(a.domRef).css("padding-top"))}var s=Math.round(a.size.width)*Math.round(r);t=t||n.getAllChildOverlays(e);var l=t.map(function(e){return e.getGeometry()});var o=n.getGeometry(l);if(!o){return false}var d=Math.round(o.size.width)*Math.round(o.size.height);return d===s}function d(e,t){var i=t.some(function(e){return e.getEditable()&&e.getGeometry()});if(i){return true}var a=[];t.forEach(function(e){a=a.concat(n.getAllChildOverlays(e))});if(!a.length){return false}if(o(e,a)){return d(e,a)}return false}r.prototype.setDesignTime=function(t){e.prototype.setDesignTime.apply(this,arguments);if(t){t.attachEventOnce("synced",this._onDTSynced,this)}};r.prototype.exit=function(){if(this.getDesignTime()){this.getDesignTime().detachEvent("elementOverlayAdded",this._onElementOverlayChanged);this.getDesignTime().detachEvent("elementOverlayMoved",this._onElementOverlayChanged);this.getDesignTime().detachEvent("elementPropertyChanged",this._onElementPropertyChanged);this.getDesignTime().detachEvent("elementOverlayEditableChanged",this._onElementOverlayEditableChanged);this.getDesignTime().detachEvent("elementOverlayDestroyed",this._onElementOverlayDestroyed)}};r.prototype.addStretchCandidate=function(e){var t=e.getElement();if(!i(this.getStretchCandidates(),t.getId())){this.addAssociation("stretchCandidates",t)}};r.prototype.removeStretchCandidate=function(e){this.removeAssociation("stretchCandidates",e.getElement());l(e,false)};r.prototype.registerElementOverlay=function(t){this._checkParentAndAddToStretchCandidates(t);t.attachElementModified(this._onElementModified,this);e.prototype.registerElementOverlay.apply(this,arguments)};r.prototype.deregisterElementOverlay=function(t){l(t,false);e.prototype.deregisterElementOverlay.apply(this,arguments)};r.prototype._isEditable=function(){return false};r.prototype._onDTSynced=function(){this._setStyleClassForAllStretchCandidates();this.getDesignTime().attachEvent("elementOverlayAdded",this._onElementOverlayChanged,this);this.getDesignTime().attachEvent("elementOverlayMoved",this._onElementOverlayChanged,this);this.getDesignTime().attachEvent("elementPropertyChanged",this._onElementPropertyChanged,this);this.getDesignTime().attachEvent("elementOverlayEditableChanged",this._onElementOverlayEditableChanged,this);this.getDesignTime().attachEvent("elementOverlayDestroyed",this._onElementOverlayDestroyed,this)};r.prototype._onElementModified=function(e){if(this.getDesignTime().getBusyPlugins().length){return}var t=e.getParameters();var n=e.getSource();if(t.type==="afterRendering"){if(!this.fnDebounced){this.fnDebounced=a(function(){this._setStyleClassForAllStretchCandidates(this._getNewStretchCandidates(this._aOverlaysCollected));this._aOverlaysCollected=[];this.fnDebounced=undefined}.bind(this),16)}if(!this._aOverlaysCollected){this._aOverlaysCollected=[]}if(!i(this._aOverlaysCollected,n)){this._aOverlaysCollected.push(n);this.fnDebounced()}}};r.prototype._onElementOverlayDestroyed=function(e){if(this.getDesignTime().getBusyPlugins().length){return}var t=[];var n=e.getParameters().elementOverlay.getParentElementOverlay();if(n&&!n._bIsBeingDestroyed){var i=this._getRelevantOverlays(n).filter(function(e){return e.getElement()});t=this._getNewStretchCandidates(i)}this._setStyleClassForAllStretchCandidates(t)};r.prototype._onElementOverlayEditableChanged=function(e){var n=t.getOverlay(e.getParameters().id);if(this.getDesignTime().getBusyPlugins().length||!n){return}var i=this._getRelevantOverlaysOnEditableChange(n);this._setStyleClassForAllStretchCandidates(i)};r.prototype._onElementPropertyChanged=function(e){var n=t.getOverlay(e.getParameters().id);if(this.getDesignTime().getBusyPlugins().length||!n){return}var i=this._getRelevantOverlays(n);var r=a(function(){if(!this.bIsDestroyed&&!n.bIsDestroyed){var e=this._getNewStretchCandidates(i).concat(this._getRelevantOverlaysOnEditableChange(n));e=e.filter(function(e,t,n){return n.indexOf(e)===t});this._setStyleClassForAllStretchCandidates(e)}}.bind(this));i.forEach(function(e){e.attachEventOnce("geometryChanged",r)})};r.prototype._onElementOverlayChanged=function(e){var n=t.getOverlay(e.getParameters().id);if(this.getDesignTime().getBusyPlugins().length||!n){return}var i=this._getRelevantOverlays(n);var a=this._getNewStretchCandidates(i);this._setStyleClassForAllStretchCandidates(a)};r.prototype._getRelevantOverlaysOnEditableChange=function(e){var t=i(this.getStretchCandidates(),e.getElement().getId())?[e.getElement().getId()]:[];var n=e.getParentAggregationOverlay();if(!n){return t}var a=n.getChildren();a.splice(a.indexOf(e),1);var r=a.some(function(e){return e.getEditable()&&e.getGeometry()});if(r){return t}return t.concat(this._getRelevantParents(e))};r.prototype._getRelevantParents=function(e){var t=[];for(var n=0;n<25;n++){e=e.getParentElementOverlay();if(!e){return t}if(!i(this.getStretchCandidates(),e.getElement().getId())){return t}t.push(e.getElement().getId())}};r.prototype._getNewStretchCandidates=function(e){var t=[];e.forEach(function(e){if(this._reevaluateStretching(e)){t.push(e.getElement().getId())}},this);return t};r.prototype._reevaluateStretching=function(e){if(!e.bIsDestroyed){var t=e.getAssociatedDomRef();if(t){var n=t.hasClass(r.STRETCHSTYLECLASS);var i=o(e,undefined,n);if(n&&!i){this.removeStretchCandidate(e)}else if(!n&&i){this.addStretchCandidate(e);return true}}}};r.prototype._checkParentAndAddToStretchCandidates=function(e){var t=e.getParentElementOverlay();var n=t&&t.getAssociatedDomRef();if(n){if(s(t,e)){if(o(t)){this.addStretchCandidate(t)}}}};r.prototype._setStyleClassForAllStretchCandidates=function(e){if(!Array.isArray(e)){e=this.getStretchCandidates()}e.forEach(function(e){var i=t.getOverlay(e);var a=n.getAllChildOverlays(i);var r=i.getEditable()&&d(i,a);l(i,r)},this)};return r});
//# sourceMappingURL=Stretch.js.map