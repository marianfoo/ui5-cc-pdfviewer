// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/services/AppConfiguration","sap/ushell/services/_CrossApplicationNavigation/utils","sap/ushell/utils/type","sap/ushell/TechnicalParameters","sap/ushell/components/applicationIntegration/AppLifeCycle","sap/base/util/isPlainObject","sap/base/util/UriParameters","sap/ui/thirdparty/jquery","sap/base/util/ObjectPath","sap/base/util/merge","sap/ushell/utils","sap/ushell/ApplicationType","sap/ushell/UI5ComponentType","sap/base/Log","sap/ushell/utils/UrlParsing","sap/base/util/deepClone"],function(e,t,n,a,i,r,s,jQuery,o,p,c,l,u,f,h,g){"use strict";function m(m,v,d){var A;if(d&&d.config){A=d.config}function y(a,i){var o,p,c,l,u;if(typeof a!=="string"&&!r(a)&&a!==undefined){f.error("Unexpected input type",null,"sap.ushell.services.CrossApplicationNavigation");return undefined}if(a===undefined){return undefined}o=e.getCurrentApplication();if(i){if(typeof i.getComponentData!=="function"||!r(i.getComponentData())||!i.getComponentData().startupParameters||!r(i.getComponentData().startupParameters)){f.error("Cannot call getComponentData on component","the component should be an application root component","sap.ushell.services.CrossApplicationNavigation")}else{u=i.getComponentData().startupParameters;if(u.hasOwnProperty("sap-system")){p=u["sap-system"][0]}if(u.hasOwnProperty("sap-ushell-next-navmode")){c=u["sap-ushell-next-navmode"][0]}}}else{if(o&&o["sap-system"]){p=o["sap-system"]}else if(o&&o.url){p=new s(o.url).get("sap-system")}if(o&&o["sap-ushell-next-navmode"]){c=o["sap-ushell-next-navmode"]}else if(o&&o.url){c=new s(o.url).get("sap-ushell-next-navmode")}}if(o){l=o.contentProviderId}var h=t._injectParameters({type:n,inject:{"sap-system":p,"sap-ushell-navmode":c,"sap-app-origin-hint":l},injectEmptyString:{"sap-app-origin-hint":true},args:a});return h}function S(e){var t,n,a;if(localStorage&&localStorage["sap-ushell-enc-test"]==="false"){return e}if(!A||!A["sap-ushell-enc-test"]){if(localStorage&&localStorage["sap-ushell-enc-test"]!=="true"){return e}}if(typeof e!=="string"&&!r(e)&&e!==undefined){f.error("Unexpected input type",null,"sap.ushell.services.CrossApplicationNavigation");return undefined}if(e===undefined){return undefined}if(r(e)){n=jQuery.extend(true,{},e);if(n.target&&n.target.shellHash){if(typeof n.target.shellHash==="string"){if(n.target.shellHash!=="#"&&n.target.shellHash!==""){n.target.shellHash=S(n.target.shellHash)}}return n}n.params=n.params||{};n.params["sap-ushell-enc-test"]=["A B%20C"];return n}a=e;if(!/[?&]sap-system=/.test(a)){t=a.indexOf("?")>-1?"&":"?";a+=t+"sap-ushell-enc-test="+encodeURIComponent("A B%20C")}return a}this._extractInnerAppRoute=function(e){var t=this,n,a;if(typeof e==="string"){n=e.split("&/");a=n.shift();return{intent:a,innerAppRoute:n.length>0?"&/"+n.join("&/"):""}}if(Object.prototype.toString.apply(e)==="[object Object]"){var i=o.get("target.shellHash",e);if(typeof i==="string"){var r=t._extractInnerAppRoute(i);e.target.shellHash=r.intent;return{intent:e,innerAppRoute:r.innerAppRoute}}if(e.hasOwnProperty("appSpecificRoute")){var s=e.appSpecificRoute;delete e.appSpecificRoute;var p=typeof s==="string"&&s.indexOf("&/")!==0&&s.length>0;return{innerAppRoute:p?"&/"+s:s,intent:e}}return{intent:e,innerAppRoute:""}}f.error("Invalid input parameter","expected string or object","sap.ushell.services.CrossApplicationNavigation");return{intent:e}};this._injectInnerAppRoute=function(e,t){var n,a=this;if(!t){return e}if(typeof e==="string"){return e+t}if(Object.prototype.toString.apply(e)==="[object Object]"){n=o.get("target.shellHash",e);if(typeof n==="string"){e.target.shellHash=a._injectInnerAppRoute(n,t);return e}e.appSpecificRoute=t}return e};this.hrefForExternal=function(e,r,s){if(typeof r!=="object"&&r!==undefined&&r!==null){s=r;r=undefined}if(s){var o=new jQuery.Deferred;this.hrefForExternalAsync(e,r).then(o.resolve).catch(o.reject);return o.promise()}f.error("Deprecated option 'bAsync=false'. Please use 'bAsync=true' instead",null,"sap.ushell.services.CrossApplicationNavigation");var c=p({},e);var l=this._extractInnerAppRoute(c);var u=l.intent;t.addXAppStateFromParameter(u,"sap-xapp-state-data");c=y(u,r);c=t.injectStickyParameters({args:c,appLifeCycle:i,technicalParameters:a,type:n});c=S(c);c=this._injectInnerAppRoute(c,l.innerAppRoute);var h=sap.ushell.Container.getService("ShellNavigation");if(!h){f.debug("Shell not available, no Cross App Navigation");return""}return h.hrefForExternal(c,undefined,r,s)};this.hrefForExternalAsync=function(e,r){var s=p({},e);var o=this._extractInnerAppRoute(s);var c=o.intent;return Promise.resolve().then(function(){return t.addXAppStateFromParameterAsync(c,"sap-xapp-state-data")}).then(function(){s=y(c,r);return t.injectStickyParametersAsync({args:s,appLifeCycle:i,technicalParameters:a,type:n})}).then(function(e){s=e;s=S(s);s=this._injectInnerAppRoute(s,o.innerAppRoute);return sap.ushell.Container.getServiceAsync("ShellNavigation")}.bind(this)).then(function(e){return new Promise(function(t,n){e.hrefForExternal(s,undefined,r,true).done(t).fail(n)})}).catch(function(){f.debug("Shell not available, no Cross App Navigation");return""})};this.expandCompactHash=function(e){var t=new jQuery.Deferred;sap.ushell.Container.getServiceAsync("NavTargetResolution").then(function(n){n.expandCompactHash(e).done(t.resolve).fail(t.reject)});return t.promise()};this.backToPreviousApp=function(){return this.isInitialNavigationAsync().then(function(e){if(e){return this.toExternal({target:{shellHash:"#"},writeHistory:false})}this.historyBack();return undefined}.bind(this))};this.historyBack=function(e){var t=-1;if(e&&typeof e==="number"){if(e<=0){f.warning("historyBack called with an argument <= 0 and will result in a forward navigation or refresh","expected was an argument > 0","sap.ushell.services.CrossApplicationNavigation#historyBack")}t=e*-1}window.history.go(t)};this.isInitialNavigation=function(){f.error("Deprecated API call of 'sap.ushell.CrossApplicationNavigation.isInitialNavigation'. Please use 'isInitialNavigationAsync' instead",null,"sap.ushell.services.CrossApplicationNavigation");var e=sap.ushell&&sap.ushell.Container&&typeof sap.ushell.Container.getService==="function"&&sap.ushell.Container.getService("ShellNavigation");if(!e){f.debug("ShellNavigation service not available","This will be treated as the initial navigation","sap.ushell.services.CrossApplicationNavigation");return true}var t=e.isInitialNavigation();if(typeof t==="undefined"){return true}return t};this.isInitialNavigationAsync=function(){return sap.ushell.Container.getServiceAsync("ShellNavigation").then(function(e){var t=e.isInitialNavigation();if(typeof t==="undefined"){return true}return t}).catch(function(){f.debug("ShellNavigation service not available","This will be treated as the initial navigation","sap.ushell.services.CrossApplicationNavigation");return true})};this.toExternal=function(e,r){var s=e.writeHistory;var o=p({},e);var c=p({},o);this._processShellHashWithParams(o);var l=this._extractInnerAppRoute(o);var u=l.intent;var h;var g;return Promise.all([sap.ushell.Container.getServiceAsync("AppLifeCycle"),sap.ushell.Container.getServiceAsync("ShellNavigation")]).then(function(e){var t=e[0];h=e[1];g=t.getCurrentApplication();return g&&g.getIntent()}).then(function(e){this._checkIfAppNeedsToBeReloaded(c,g,e,h.hashChanger);return t.addXAppStateFromParameterAsync(u,"sap-xapp-state-data")}.bind(this)).then(function(){o=y(u,r);return t.injectStickyParametersAsync({args:o,appLifeCycle:i,technicalParameters:a,type:n})}).then(function(e){o=e;o=S(o);delete o.writeHistory;o=this._injectInnerAppRoute(o,l.innerAppRoute);return h.toExternal(o,r,s)}.bind(this)).catch(function(e){f.warning("Shell not available, no Cross App Navigation")})};this._checkIfAppNeedsToBeReloaded=function(e,t,n,a){if(!t||!n||!e||!e.target){return}if(e.target.shellHash){var i=h.parseShellHash(e.target.shellHash)||{};e.target={semanticObject:i.semanticObject,action:i.action,contextRaw:i.contextRaw};e.appSpecificRoute=i.appSpecificRoute;e.params=Object.assign({},e.params,i.params)}if(e.appSpecificRoute){return}if(t.applicationType!=="UI5"){return}if(e.target.semanticObject!==n.semanticObject){return}if(e.target.action!==n.action){return}var r={};if(e.params){Object.keys(e.params).forEach(function(t){var n=e.params[t];var a=Array.isArray(n)?n:[n];r[t]=a.map(function(e){return e.toString()})})}if(!a.haveSameIntentParameters(r,n.params)){return}a.setReloadApplication(true)};this.hrefForAppSpecificHash=function(e){f.error("Deprecated API call of 'sap.ushell.CrossApplicationNavigation.hrefForAppSpecificHash'. Please use 'hrefForAppSpecificHashAsync' instead",null,"sap.ushell.services.CrossApplicationNavigation");if(sap.ushell&&sap.ushell.Container&&typeof sap.ushell.Container.getService==="function"){var t=sap.ushell.Container.getService("ShellNavigation");if(t){return t.hrefForAppSpecificHash(e)}}f.debug("Shell not available, no Cross App Navigation; fallback to app-specific part only");return"#"+encodeURI(e)};this.hrefForAppSpecificHashAsync=function(e){return sap.ushell.Container.getServiceAsync("ShellNavigation").then(function(t){return t.hrefForAppSpecificHash(e)}).catch(function(){f.debug("Shell not available, no Cross App Navigation; fallback to app-specific part only");return"#"+encodeURI(e)})};this.getPrimaryIntent=function(e,t){var n={},a,i=/^#\w+-displayFactSheet(?:$|\?.)/;n.tags=["primaryAction"];n.semanticObject=e;if(t){n.params=t}return this.getLinks(n).then(function(e){if(e.length===0){delete n.tags;n.action="displayFactSheet";a=function(e,t){var n;if(e.intent===t.intent){return 0}n=i.test(e.intent)^i.test(t.intent);if(n){return i.test(e.intent)?-1:1}return e.intent<t.intent?-1:1};return this.getLinks(n)}a=function(e,t){if(e.intent===t.intent){return 0}return e.intent<t.intent?-1:1};return e}.bind(this)).then(function(e){return e.length===0?null:e.sort(a)[0]})};this.getSemanticObjectLinks=function(e,r,s,o,p,l){var u=new jQuery.Deferred;Promise.resolve().then(function(){return t.injectStickyParametersAsync({args:{params:r},appLifeCycle:i,technicalParameters:a,type:n})}).then(function(t){t=y(t,o).params;t=S({params:t}).params;var n;if(Array.isArray(e)){n=[];e.forEach(function(e){n.push([{semanticObject:e[0],params:e[1],ignoreFormFactor:!!e[2],ui5Component:e[3],appStateKey:e[4],compactIntents:!!e[5]}])})}else{n={semanticObject:e,params:t,ignoreFormFactor:s,ui5Component:o,appStateKey:p,compactIntents:!!l}}return Promise.all([sap.ushell.Container.getServiceAsync("NavTargetResolution"),n])}).then(function(e){var t=e[0];var n=e[1];c.invokeUnfoldingArrayArguments(t.getLinks.bind(t),[n]).done(u.resolve).fail(u.reject)});return u.promise()};this.getLinks=function(e){var t;t=c.invokeUnfoldingArrayArguments(this._getLinks.bind(this),[e]);return t};this._getLinks=function(e){var r=new jQuery.Deferred;if(typeof e==="undefined"){e={}}var s=jQuery.extend(true,{},e);s.compactIntents=!!s.compactIntents;s.action=s.action||undefined;s.paramsOptions=t.extractGetLinksParameterOptions(s.params);Promise.resolve().then(function(){return t.injectStickyParametersAsync({args:s,appLifeCycle:i,technicalParameters:a,type:n})}).then(function(e){s=e;var n;if(s.params){n=t.extractGetLinksParameterDefinition(s.params)}else{n=s.params}var a=y({params:n},s.ui5Component).params;a=S({params:a}).params;if(s.appStateKey){a["sap-xapp-state"]=[s.appStateKey];delete s.appStateKey}s.params=a;return sap.ushell.Container.getServiceAsync("NavTargetResolution")}).then(function(e){e.getLinks(s).done(r.resolve).fail(r.reject)});return r.promise()};this.getDistinctSemanticObjects=function(){var e=new jQuery.Deferred;sap.ushell.Container.getServiceAsync("NavTargetResolution").then(function(t){t.getDistinctSemanticObjects().done(e.resolve).fail(e.reject)});return e.promise()};this.isIntentSupported=function(e,t){var n=new jQuery.Deferred,a={},i=e.map(function(e){var n=y(e,t);a[n]=e;return n});sap.ushell.Container.getServiceAsync("NavTargetResolution").then(function(e){e.isIntentSupported(i).done(function(e){var t={};Object.keys(e).forEach(function(n){t[a[n]]=e[n]});n.resolve(t)}).fail(n.reject.bind(n))});return n.promise()};this.isNavigationSupported=function(e,t){var n=new jQuery.Deferred;var a=g(e).map(function(e){var n=this._extractInnerAppRoute(e);return y(n.intent,t)}.bind(this));sap.ushell.Container.getServiceAsync("NavTargetResolution").then(function(e){e.isNavigationSupported(a).done(n.resolve).fail(n.reject)});return n.promise()};this.isUrlSupported=function(e){var t=new jQuery.Deferred;if(typeof e!=="string"){t.reject();return t.promise()}if(h.isIntentUrl(e)){var n=h.getHash(e);this.isIntentSupported(["#"+n]).done(function(e){if(e["#"+n]&&e["#"+n].supported){t.resolve()}else{t.reject()}}).fail(function(){t.reject()})}else{t.resolve()}return t.promise()};this.createComponentInstance=function(e,t,n){var a=new jQuery.Deferred,i=sap.ushell.Container,r;this.createComponentData(e,t).then(function(e){i.getServiceAsync("Ui5ComponentLoader").then(function(t){return t.modifyComponentProperties(e,u.Application).then(function(e){r=e;return t})}).then(function(e){if(n){n.runAsOwner(function(){t(r)})}else{t(r)}function t(t){t.loadDefaultDependencies=false;e.instantiateComponent(t).then(function(e){a.resolve(e.componentHandle.getInstance())},function(e){e=e||"";f.error("Cannot create UI5 component: "+e,e.stack,"sap.ushell.services.CrossApplicationNavigation");a.reject(e)})}})},function(e){a.reject(e)});return a.promise()};this.createComponentData=function(e,t){return new Promise(function(n,a){var i=sap.ushell.Container,r,s;if(!t){t={}}else{s=Object.keys(t).length;if(s>1||s===1&&!t.componentData){a("`oConfig` argument should either be an empty object or contain only the `componentData` property.");return}}if(t.componentData){delete t.componentData.startupParameters;delete t.componentData.config;delete t.componentData["sap-xapp-state"]}r=h.constructShellHash(h.parseShellHash(e));if(!r){a("Navigation intent invalid!");return}i.getServiceAsync("NavTargetResolution").then(function(s){s.resolveHashFragment("#"+r).then(function(r){function s(e){e=jQuery.extend(true,{},e,t);if(!e.ui5ComponentName){if(e.additionalInformation){e.ui5ComponentName=e.additionalInformation.replace(/^SAPUI5\.Component=/,"")}else if(e.name){e.ui5ComponentName=e.name}}return e}if(r.applicationType===l.URL.type&&r.appCapabilities&&r.appCapabilities.appFrameworkId==="UI5"&&sap.ushell.Container.inAppRuntime()){sap.ui.require(["sap/ushell/appRuntime/ui5/services/AppLifeCycleAgent"],function(t){t.getAppInfo(r.appCapabilities.technicalAppComponentId).then(function(t){t=s(t);if(t.url&&e.indexOf("?")>0){t.url+="?"+e.split("?")[1]}o({ui5ComponentName:r.appCapabilities.technicalAppComponentId,applicationDependencies:t,url:t.url})})})}else if(r.applicationType!==l.URL.type&&!/^SAPUI5\.Component=/.test(r.additionalInformation)){a("The resolved target mapping is not of type UI5 component.")}else{o(r)}function o(e){i.getServiceAsync("Ui5ComponentLoader").then(function(t){e=s(e);e.loadDefaultDependencies=false;t.createComponentData(e).then(function(e){n(e)},function(e){e=e||"";f.error("Cannot get UI5 component data: "+e,e.stack,"sap.ushell.services.CrossApplicationNavigation");a(e)})})}})})})};this.createEmptyAppState=function(e,t,n,a){f.error("Deprecated API call of 'sap.ushell.CrossApplicationNavigation.createEmptyAppState'. Please use 'createEmptyAppStateAsync' instead",null,"sap.ushell.services.CrossApplicationNavigation");var i=sap.ushell.Container.getService("AppState");if(!(e instanceof sap.ui.core.UIComponent)){throw new Error("The passed oAppComponent must be a UI5 Component.")}return i.createEmptyAppState(e,t,n,a)};this.createEmptyAppStateAsync=function(e,t,n,a){if(!(e instanceof sap.ui.core.UIComponent)){return Promise.reject("The passed oAppComponent must be a UI5 Component.")}return sap.ushell.Container.getServiceAsync("AppState").then(function(i){return i.createEmptyAppState(e,t,n,a)})};this.getStartupAppState=function(e){this._checkComponent(e);var t=e.getComponentData()&&e.getComponentData()["sap-xapp-state"]&&e.getComponentData()["sap-xapp-state"][0];return this.getAppState(e,t)};this._checkComponent=function(e){if(!(e instanceof sap.ui.core.UIComponent)){throw new Error("oComponent passed must be a UI5 Component")}};this.getAppState=function(e,t){var n;var a=new jQuery.Deferred;this._checkComponent(e);sap.ushell.Container.getServiceAsync("AppState").then(function(i){if(typeof t!=="string"){if(t!==undefined){f.error("Illegal Argument sAppStateKey ")}setTimeout(function(){n=i.createEmptyUnmodifiableAppState(e);a.resolve(n)},0);return}i.getAppState(t).done(a.resolve).fail(a.reject)});return a.promise()};this.getAppStateData=function(e){return c.invokeUnfoldingArrayArguments(this._getAppStateData.bind(this),[e])};this._getAppStateData=function(e){var t=new jQuery.Deferred;sap.ushell.Container.getServiceAsync("AppState").then(function(n){if(typeof e!=="string"){if(e!==undefined){f.error("Illegal Argument sAppStateKey ")}setTimeout(function(){t.resolve(undefined)},0)}else{n.getAppState(e).done(function(e){t.resolve(e.getData())}).fail(t.resolve.bind(t,undefined))}});return t.promise()};this.saveMultipleAppStates=function(e){var t=[],n=new jQuery.Deferred;e.forEach(function(e){t.push(e.save())});jQuery.when.apply(this,t).done(function(){n.resolve(t)}).fail(function(){n.reject("save failed")});return n.promise()};this._processShellHashWithParams=function(e){if(e&&e.processParams===true&&e.target&&e.target.shellHash&&e.params){var t=h.parseShellHash(e.target.shellHash);e.target={semanticObject:t.semanticObject,action:t.action,contextRaw:t.contextRaw};e.appSpecificRoute=t.appSpecificRoute;e.params=Object.assign({},e.params,t.params)}};this.getSupportedAppStatePersistencyMethods=function(){f.error("Deprecated API call of 'sap.ushell.CrossApplicationNavigation.getSupportedAppStatePersistencyMethods'. Please use 'getSupportedAppStatePersistencyMethodsAsync' instead",null,"sap.ushell.services.CrossApplicationNavigation");var e=sap.ushell.Container.getService("AppState");return e.getSupportedPersistencyMethods()};this.getSupportedAppStatePersistencyMethodsAsync=function(){return sap.ushell.Container.getServiceAsync("AppState").then(function(e){return e.getSupportedPersistencyMethods()})};this.makeStatePersistent=function(e,t,n){var a=new jQuery.Deferred;sap.ushell.Container.getServiceAsync("AppState").then(function(i){i.makeStatePersistent(e,t,n).done(a.resolve).fail(a.reject)});return a.promise()};this.resolveIntent=function(e){var t=new jQuery.Deferred;sap.ushell.Container.getServiceAsync("NavTargetResolution").then(function(n){n.resolveHashFragment(e).then(function(e){t.resolve({url:e.url})}).fail(function(e){t.reject(e)})});return t.promise()}}m.hasNoAdapter=true;return m},true);
//# sourceMappingURL=CrossApplicationNavigation.js.map