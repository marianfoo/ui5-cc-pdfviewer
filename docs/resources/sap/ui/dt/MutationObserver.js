/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","sap/ui/dt/OverlayUtil","sap/ui/base/ManagedObject","sap/ui/dt/DOMUtil","sap/base/util/restricted/_intersection","sap/base/util/restricted/_uniq"],function(jQuery,t,e,i,n,o){"use strict";var s=e.extend("sap.ui.dt.MutationObserver",{metadata:{library:"sap.ui.dt",events:{domChanged:{parameters:{type:{type:"string"},targetNodes:{type:"element[]"}}}}}});s.prototype.init=function(){this._mutationOnTransitionend=this._callDomChangedCallback.bind(this,"MutationOnTransitionend");this._mutationOnAnimationEnd=this._callDomChangedCallback.bind(this,"MutationOnAnimationEnd");this._fireDomChangeOnScroll=this._fireDomChangeOnScroll.bind(this);this._mutationOnResize=this._callDomChangedOnResizeWithRoot.bind(this,"MutationOnResize");window.addEventListener("transitionend",this._mutationOnTransitionend,true);window.addEventListener("animationend",this._mutationOnAnimationEnd,true);window.addEventListener("scroll",this._fireDomChangeOnScroll,true);jQuery(window).on("resize",this._mutationOnResize);this._aIgnoredMutations=[];this._bHandlerRegistered=false;this._mMutationHandlers={};this._aRootIds=[];this._startMutationObserver()};s.prototype.exit=function(){this._stopMutationObserver();window.removeEventListener("transitionend",this._mutationOnTransitionend,true);window.removeEventListener("animationend",this._mutationOnAnimationEnd,true);window.removeEventListener("scroll",this._fireDomChangeOnScroll,true);jQuery(window).off("resize",this._mutationOnResize);this._aIgnoredMutations=[];this._bHandlerRegistered=false;this._mMutationHandlers={}};s.prototype.ignoreOnce=function(t){this._aIgnoredMutations.push(t)};s.prototype.registerHandler=function(t,e,i){if(!this._mMutationHandlers[t]){this._mMutationHandlers[t]=[];this._bHandlerRegistered=true}this._mMutationHandlers[t].push(e);if(i&&this._aRootIds.indexOf(t)===-1){this._aRootIds.push(t)}};s.prototype.deregisterHandler=function(t){delete this._mMutationHandlers[t];if(Object.keys(this._mMutationHandlers).length===0){this._bHandlerRegistered=false}this._aRootIds=this._aRootIds.filter(function(e){return e!==t})};s.prototype._hasScrollbar=function(t,e){return t||i.hasScrollBar(e)};s.prototype._getIdsWhenRegistered=function(t,e,i){var n;if(e&&this._mMutationHandlers[e]){n=e;if(!i.closestElementInWhitlist){i.closestElementInWhitlist=e}}i.result=t?n:i.closestElementInWhitlist;return i};s.prototype._getClosestParentIdForNodeRegisteredWithScrollbar=function(t,e){var i={closestElementInWhitlist:undefined,result:undefined};var n=false;var o=jQuery(e);var s=t;do{n=this._hasScrollbar(n,o);i=this._getIdsWhenRegistered(n,s,i);o=o.parent();s=o.attr("data-sap-ui")}while(!(i.result&&n)&&o.length&&o[0]!==document);return i.result||i.closestElementInWhitlist};s.prototype._isNodeOverlayRelated=function(t,e){var n="overlay-container";if(i.contains(n,t)){return true}if(t===document.body){return e&&e.addedNodes&&e.addedNodes[0]&&e.addedNodes[0].getAttribute&&e.addedNodes[0].getAttribute("id")===n}return false};s.prototype._getRelevantElementId=function(t,e){var n=t&&t.getAttribute&&t.getAttribute("id");var o;if(!this._isNodeOverlayRelated(t,e)&&document.body.contains(t)&&n!=="sap-ui-static"&&!i.contains("sap-ui-preserve",t)){var s=0;while(this._aRootIds.length>s&&!o){if(i.contains(this._aRootIds[s],t)||t.contains(document.getElementById(this._aRootIds[s]))){o=this._aRootIds[s]}s++}}return o};s.prototype._getRelevantElementIdsFromStaticArea=function(t){return t.target.id==="sap-ui-static"&&n([].concat(Array.prototype.slice.call(t.addedNodes),Array.prototype.slice.call(t.removedNodes)).map(function(t){return t.id}),Object.keys(this._mMutationHandlers))};s.prototype._ignoreMutation=function(t){return this._aIgnoredMutations.some(function(e,i,n){if(e.target===t.target&&(!e.type||e.type===t.type)){n.splice(i,1);return true}})};s.prototype._getTargetNode=function(t){var e=t.type==="characterData"?t.target.parentNode:t.target;if(e&&e.getRootNode()&&e.getRootNode().host){return e.getRootNode().host}return e};s.prototype._callRelevantCallbackFunctions=function(t,e){t=o(t);t.forEach(function(t){(this._mMutationHandlers[t]||[]).forEach(function(t){t({type:e})})}.bind(this))};function a(t){this._oMutationObserver.observe(t,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class","width","height","border"],characterData:true})}s.prototype._startMutationObserver=function(){this._oMutationObserver=new window.MutationObserver(function(t){if(this._bHandlerRegistered){var e=t.reduce(function(t,e){var i=[];var n=this._getTargetNode(e);var o=this._getRelevantElementId(n,e);if(o){i.push(o)}else{i=this._getRelevantElementIdsFromStaticArea(e)}if(i.length&&!this._ignoreMutation(e)){return t.concat(i)}return t}.bind(this),[]);if(e.length){this._callRelevantCallbackFunctions(e,"MutationObserver")}}}.bind(this));a.call(this,window.document)};s.prototype.addNode=function(t){a.call(this,t)};s.prototype._stopMutationObserver=function(){if(this._oMutationObserver){this._oMutationObserver.disconnect();delete this._oMutationObserver}};s.prototype._callDomChangedCallback=function(t,e){var i=e.target;if(this._bHandlerRegistered&&i!==window){var n=this._getRelevantElementId(i);if(n){this._callRelevantCallbackFunctions([n],t)}}};s.prototype._callDomChangedOnResizeWithRoot=function(t){if(this._aRootIds.length){if(this._iApplyStylesRequest){window.cancelAnimationFrame(this._iApplyStylesRequest)}this._iApplyStylesRequest=window.requestAnimationFrame(function(){this._callRelevantCallbackFunctions(this._aRootIds,t);delete this._iApplyStylesRequest}.bind(this))}};s.prototype._fireDomChangeOnScroll=function(e){var i=e.target;var n=[];if(this._bHandlerRegistered&&i!==document){var o=this._getRelevantElementId(i);if(o){n.push(o)}else if(i.getAttribute("id")!=="sap-ui-static"){n=this._aRootIds.filter(function(t){return i.contains(document.getElementById(t))})}if(n.length&&!t.getClosestOverlayForNode(i)){this._callRelevantCallbackFunctions(n,"MutationOnScroll")}}};return s});
//# sourceMappingURL=MutationObserver.js.map