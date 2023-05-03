// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/services/_AppState/WindowAdapter","sap/ushell/services/_AppState/SequentializingAdapter","sap/ushell/services/_AppState/AppState","sap/ushell/services/_AppState/Sequentializer","sap/ushell/services/_AppState/AppStatePersistencyMethod","sap/ushell/utils","sap/ui/thirdparty/jquery"],function(e,t,n,i,s,a,jQuery){"use strict";function r(e){return a.isDefined(e)&&a.isDefined(e.transient)?!!e.transient:true}function o(n,i,s,a){this._oConfig=a&&a.config;this._sSessionKey="";this._oAdapter=new t(n);this._oAdapter=new e(this,this._oAdapter,a)}o.prototype._getSessionKey=function(){if(!this._sSessionKey){this._sSessionKey=this._getGeneratedKey()}return this._sSessionKey};o.prototype.getAppState=function(e){var t=new jQuery.Deferred,i=this,s;this._loadAppState(e).done(function(e,a,r,o){s=new n(i,e,false,a,undefined,undefined,undefined,r,o);t.resolve(s)}).fail(function(){s=new n(i,e);t.resolve(s)});return t.promise()};o.prototype._getGeneratedKey=function(e){var t=a.generateRandomKey();if(e){t=("TAS"+t).substring(0,41)}else{t=("AS"+t).substring(0,40)}return t};o.prototype.createEmptyAppState=function(e,t,i,a){var o;var p="";var d="";var f=t||r(this._oConfig);var u=this._getGeneratedKey(f);if(i!==undefined&&!this.isPersistencyMethodSupported(i)){i=undefined;a=undefined}if(e){if(!(e instanceof sap.ui.core.UIComponent)){throw new Error("oComponent passed must be a UI5 Component")}if(e.getMetadata&&e.getMetadata()&&typeof e.getMetadata().getName==="function"){p=e.getMetadata().getName()||""}if(!p&&e.getMetadata&&e.getMetadata().getComponentName){p=e.getMetadata().getComponentName()}if(e.getMetadata&&e.getMetadata()&&typeof e.getMetadata().getManifest==="function"&&typeof e.getMetadata().getManifest()==="object"&&typeof e.getMetadata().getManifest()["sap.app"]==="object"){d=e.getMetadata().getManifest()["sap.app"].ach||""}}if(f===true){i=a=undefined}else if(i===undefined&&this.isPersistencyMethodSupported(s.PersonalState)){i=s.PersonalState;a=undefined}o=new n(this,u,true,undefined,p,d,f,i,a);return o};o.prototype.createEmptyUnmodifiableAppState=function(){var e=this._getGeneratedKey(),t;t=new n(this,e,false);return t};o.prototype._saveAppState=function(e,t,n,i,o,p,d){var f=this._getSessionKey(),u=a.isDefined(o)?o:r(this._oConfig);if(u){p=undefined;d=undefined}else if(p!==undefined){if(!this.isPersistencyMethodSupported(p)){if(this.isPersistencyMethodSupported(s.PersonalState)){p=s.PersonalState}else{p=undefined}d=undefined}}return this._oAdapter.saveAppState(e,f,t,n,i,u,p,d)};o.prototype._loadAppState=function(e){return this._oAdapter.loadAppState(e)};o.prototype.deleteAppState=function(e){return this._oAdapter.deleteAppState(e)};o._getSequentializer=function(){return new i};o.prototype.getSupportedPersistencyMethods=function(){if(this._oAdapter.getSupportedPersistencyMethods){return this._oAdapter.getSupportedPersistencyMethods()}return[]};o.prototype.isPersistencyMethodSupported=function(e){var t=this.getSupportedPersistencyMethods();if(t.length>0&&e!==undefined){return t.indexOf(e)>=0}return false};o.prototype.setAppStateToPublic=function(e){var t=p(e,"sap-xapp-state"),n=p(e,"sap-iapp-state"),i=(new jQuery.Deferred).resolve(),a=(new jQuery.Deferred).resolve(),r=new jQuery.Deferred,o,d;if(t!==undefined){i=this.makeStatePersistent(t,s.PublicState).done(function(n){if(t!==n){e=e.replace(t,n);o=n}}).fail(r.reject)}if(n!==undefined){a=this.makeStatePersistent(n,s.PublicState).done(function(t){if(n!==t){e=e.replace(n,t);d=t}}).fail(r.reject)}jQuery.when(i,a).done(function(){r.resolve(e,t,n,o,d)});return r.promise()};function p(e,t){var n=new RegExp("(?:"+t+"=)([^&/]+)"),i=n.exec(e),s;if(i&&i.length===2){s=i[1]}return s}o.prototype.makeStatePersistent=function(e,t,n){var i=new jQuery.Deferred;if(this.getSupportedPersistencyMethods().length===0){return i.resolve(e)}if(this.isPersistencyMethodSupported(t)){this.getAppState(e).done(function(s){if(s._iPersistencyMethod!==t){s.bTransient=false;s._iPersistencyMethod=t;s._oPersistencySettings=n;if(e.startsWith("TAS")){e=e.substring(1,e.length)}this._saveAppState(e,s._sData,s._sAppName,s._sACHComponent,false,t,n).done(function(){i.resolve(e)}).fail(i.reject)}else{i.resolve(e)}}.bind(this)).fail(i.reject)}else{i.reject("AppState.makeStatePersistent - adapter does not support persistence method: "+t)}return i.promise()};o.WindowAdapter=e;o.hasNoAdapter=false;return o},true);
//# sourceMappingURL=AppState.js.map