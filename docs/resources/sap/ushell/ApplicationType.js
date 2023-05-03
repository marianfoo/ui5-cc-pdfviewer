// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ui/thirdparty/URI","sap/base/Log","sap/ushell/utils","sap/ushell/URLTemplateProcessor","sap/ushell/_ApplicationType/utils","sap/ushell/_ApplicationType/systemAlias","sap/ushell/_ApplicationType/wdaResolution","sap/ushell/_ApplicationType/guiResolution","sap/ushell/Config","sap/base/util/deepExtend","sap/ui/core/routing/History","sap/base/util/ObjectPath","sap/ushell/User","sap/ui/thirdparty/jquery"],function(e,t,n,a,s,r,i,o,p,u,l,c,f,jQuery){"use strict";var m=new e(document.URL).search(true)["iframe-url"];function d(e,t,n){var a=e.inbound,s=a&&a.resolutionResult,r;if(!(!a||!s||!s["sap.wda"])){r=i.constructFullWDAResolutionResult(e,t,n)}else if(!(!a||!s)){r=i.constructWDAResolutionResult(e,t,n)}if(r){r.then(function(t){L(e,t);return t})}return r}function h(e,t,n){return o.generateTRResolutionResult(e,t,n).then(function(t){L(e,t);return t})}function y(t,n,a){var i=new e(n),o=t.inbound,p=o&&o.resolutionResult,l=u({},t.mappedIntentParamsPlusSimpleDefaults),c,f;if(l["sap-system"]){c=l["sap-system"][0];delete l["sap-system"]}if(l["sap-system-src"]){f=l["sap-system-src"][0];delete l["sap-system-src"]}return new Promise(function(e,n){r.spliceSapSystemIntoURI(i,p.systemAlias,c,f,"WCF",p.systemAliasSemantics||r.SYSTEM_ALIAS_SEMANTICS.applied,a).done(function(n){var a=s.getURLParsing().paramsToString(l),r=s.appendParametersToUrl(a,n.toString());var i={url:r,text:p.text||"",additionalInformation:p.additionalInformation||"",applicationType:"WCF",fullWidth:true};L(t,i);T(i,"WCF");e(i)}).fail(function(e){n(e)})})}function g(e,n,a){var r=e.inbound,i,o,p,l,c={};["applicationType","additionalInformation","applicationDependencies"].forEach(function(e){if(r.resolutionResult.hasOwnProperty(e)){c[e]=r.resolutionResult[e]}});c.url=n;if(c.applicationDependencies&&typeof c.url==="undefined"){c.url=""}if(typeof c.url==="undefined"){c.url="";t.warning("The component url is undefined. We set it to empty string avoid rejection of the promise")}l=u({},e.mappedIntentParamsPlusSimpleDefaults);c.reservedParameters={};var f={"sap-ui-fl-max-layer":true,"sap-ui-fl-control-variant-id":true,"sap-ui-fl-version":true};Object.keys(f).forEach(function(e){var t=l[e];if(t){delete l[e];c.reservedParameters[e]=t}});e.mappedDefaultedParamNames=e.mappedDefaultedParamNames.filter(function(e){return!f[e]});if(e.mappedDefaultedParamNames.length>0){l["sap-ushell-defaultedParameterNames"]=[JSON.stringify(e.mappedDefaultedParamNames)]}o=l["sap-system"]&&l["sap-system"][0];p=l["sap-system-src"]&&l["sap-system-src"][0];c["sap-system"]=o;if(typeof p==="string"){c["sap-system-src"]=p}e.effectiveParameters=l;i=s.getURLParsing().paramsToString(l);if(i){c.url=c.url+(c.url.indexOf("?")<0?"?":"&")+i}if(typeof r.resolutionResult.ui5ComponentName!=="undefined"){c.ui5ComponentName=r.resolutionResult.ui5ComponentName}c.text=r.title;return Promise.resolve(c)}function v(e){var n=undefined,a=window.hasher.getHash(),s=a.lastIndexOf("&/"),r=1;if(s>0){if(e&&e.capabilities&&e.capabilities.appFrameworkId==="UI5"){r=2}n=a.substring(s+r);try{if(n&&n.length>0){n=decodeURIComponent(n)}}catch(e){t.warning("inner route should be double encoded",e,"sap.ushell.sap.ushell.ApplicationType.getInnerAppRoute")}}return n}function P(e){var t=e.targetNavigationMode;if(t===undefined||t===""){t="inplace"}return t}function S(){var e=window.hasher&&window.hasher.getHash(),t="",n;if(e&&e.length>0&&e.indexOf("sap-iapp-state=")>0){n=/(?:sap-iapp-state=)([^&/\\]+)/.exec(e);if(n&&n.length===2){t=n[1]}}return t}function A(){return new Promise(function(e){Promise.all([sap.ushell.Container.getServiceAsync("UserInfo"),sap.ushell.Container.getServiceAsync("PluginManager"),n.getUi5VersionAsync()]).then(function(t){var n=t[0],a=t[1],s=t[2];var r=n.getUser();var i=sap.ui.getCore().getConfiguration();var o=r.getContentDensity()||(jQuery("body").hasClass("sapUiSizeCompact")?"compact":"cozy");var u=r.getTheme();if(u.indexOf("sap_")!==0){var c=f.prototype.constants.themeFormat.THEME_NAME_PLUS_URL;u=r.getTheme(c)}var m;var d;if(i){d=i.getLanguage&&i.getLanguage();m=i.getSAPLogonLanguage&&i.getSAPLogonLanguage()}var h=window.location.protocol+"//"+window.location.host+"/comsapuitheming.runtime/themeroot/v1";var y=0;if(p.last("/core/shell/sessionTimeoutIntervalInMinutes")>0){y=p.last("/core/shell/sessionTimeoutIntervalInMinutes")}e({language:d,logonLanguage:m,theme:u,themeServiceRoot:h,isDebugMode:!!window["sap-ui-debug"],ui5Version:s,contentDensity:o,sapPlugins:a._getNamesOfPluginsWithAgents(),innerAppState:S(),sessionTimeout:y,historyDirection:l.getInstance().getDirection()||""})})})}function R(e){var t;switch(e){case"inplace":t="embedded";break;case"explace":t="newWindow";break;default:t=e||"newWindow"}return t}function I(e,a){var s=R(e);var r=n.getMember(a,"sap|integration.navMode");switch(r){case"inplace":return"embedded";case"explace":if(s==="embedded"){return"newWindowThenEmbedded"}if(["newWindowThenEmbedded","newWindow"].indexOf(s)>=0){return s}t.error("App-defined navigation mode was ignored","Application requests to be opened in a new window but no expected navigation mode was defined on the template","sap.ushell.ApplicationType");default:return s}}function w(e,t,a){var s=n.clone(e);s.navigationMode=I(e.navigationMode,t);s.appId=a(e.appId||"");s.technicalAppComponentId=a(e.technicalAppComponentId||"");s.appSupportInfo=t["sap.app"]&&t["sap.app"].ach;s.appFrameworkId=e.appFrameworkId;delete s.urlTransformation;return s}function b(e,t,a){var s={appParams:{},system:undefined},r;if(a.mappedIntentParamsPlusSimpleDefaults){s.appParams=JSON.parse(JSON.stringify(a.mappedIntentParamsPlusSimpleDefaults))}r=n.getMember(t,"sap|app.destination");if(typeof r==="string"&&r.length>0){s.system=e.systemAliases[r]&&JSON.parse(JSON.stringify(e.systemAliases[r]));if(typeof s.system==="object"){s.system.alias=r}}return s}function U(t,n,a){return new Promise(function(s,r){var i=new e(t);var o=i.query(true);var p=true;var u=["sap-language","sap-theme","sap-shell","sap-ui-app-id","transaction","sap-iframe-hint","sap-keep-alive","sap-ui-versionedLibCss","sap-wd-configId"];if(a&&a.mandatoryUrlParams){u=u.concat(a.mandatoryUrlParams.split(","));u=u.filter(function(e,t){return u.indexOf(e)===t})}if(n==="explace"){p=false}sap.ushell.Container.getServiceAsync("ShellNavigation").then(function(e){e.compactParams(o,u,undefined,p).done(function(e){if(!e.hasOwnProperty("sap-intent-param")){s(t);return}var n;if(e["sap-theme"]){var a="sap-theme="+e["sap-theme"];e["sap-theme"]="sap-theme-temp-placeholder";i.query(e);n=i.toString();n=n.replace("sap-theme=sap-theme-temp-placeholder",a)}else{i.query(e);n=i.toString()}s(n)}).fail(function(e){r(e)})})})}function T(e,t){if(t){D(e,"sap-iframe-hint",t)}}function L(e,t){var n=e.intentParamsPlusAllDefaults;if(n&&n["sap-post"]&&n["sap-post"][0]==="false"){t.openWithPostByAppParam=false}}function C(e){var t=e.extendedInfo.appParams["sap-keep-alive"];if(t!==undefined){D(e,"sap-keep-alive",t[0])}}function M(e){var t=p.last("/core/spaces/enabled");if(t===true){D(e,"sap-spaces",t)}}function x(e,t,a){var s=n.getMember(t,"sap|integration.urlTemplateId");if(s==="urltemplate.url-dynamic"&&e.url.indexOf("sap-language=")===-1){D(e,"sap-language",a.env.language)}}function D(e,t,n){if(e.url){var a=e.url.indexOf("#"),s=e.url,r="";if(a>0){s=e.url.slice(0,a);r=e.url.slice(a)}e.url=s+(s.indexOf("?")>=0?"&":"?")+t+"="+n+r}}function O(e,s,r){return new Promise(function(s){var r=e.inbound,i=r.templateContext,o=i.payload.capabilities||{};if(e.mappedIntentParamsPlusSimpleDefaults&&e.mappedIntentParamsPlusSimpleDefaults.hasOwnProperty("sap-ushell-innerAppRoute")){var p=window.hasher.getHash();if(e.mappedIntentParamsPlusSimpleDefaults["sap-ushell-innerAppRoute"].length>0&&p.indexOf("&/")===-1){p+="&/"+e.mappedIntentParamsPlusSimpleDefaults["sap-ushell-innerAppRoute"];window.hasher.replaceHash(p)}}var u={innerAppRoute:v(i.payload)||e.parsedIntent.appSpecificRoute,targetNavMode:P(e),defaultParameterNames:e.mappedDefaultedParamNames,startupParameter:e.mappedIntentParamsPlusSimpleDefaults};A().then(function(p){u.env=p;if(o.appFrameworkId==="UI5"&&u.startupParameter){for(var l in u.startupParameter){if(l!=="sap-ushell-innerAppRoute"){u.startupParameter[l][0]=encodeURIComponent(u.startupParameter[l][0])}}if(e.mappedDefaultedParamNames&&e.mappedDefaultedParamNames.length>0){u.startupParameter["sap-ushell-defaultedParameterNames"]=[JSON.stringify(e.mappedDefaultedParamNames)]}}var c="/universal_search/search?query=",f=u.innerAppRoute&&u.innerAppRoute.indexOf(c),d;if(f===0){d=u.innerAppRoute.substring(c.length);u.innerAppRoute="/JAMSEARCHPATHH?JAMSEARCHVALUEE=VALUEE"}var h=a.expand(i.payload,i.site,u,i.siteAppSection,"startupParameter");if(f===0){h=h.replace("/JAMSEARCHPATHH?JAMSEARCHVALUEE=VALUEE",c+encodeURIComponent(d))}if(o.appFrameworkId==="UI5"&&document.URL.indexOf("#")>0){var y=h.split("#"),g=y[1].split("&/"),v=sap.ushell.Container.getFLPUrl(true).split("#"),P=v[1].split("&/");h=y[0]+"#"+P[0]+(g.length>1?"&/"+g[1]:"");t.debug("- created URL with fixed hash: "+h,"sap.ushell.ApplicationType")}var S=function(e){var t=n.clone(i.payload);t.urlTemplate=e;return a.expand(t,i.site,u,i.siteAppSection,"startupParameter")};var A={applicationType:"URL",text:r.title,appCapabilities:w(o,i.siteAppSection,S),url:h,extendedInfo:b(i.site,i.siteAppSection,e),contentProviderId:r.contentProviderId||"",systemAlias:i.siteAppSection["sap.app"]&&i.siteAppSection["sap.app"].destination||i.siteAppSection.destination||""};T(A,A.appCapabilities.appFrameworkId);C(A);M(A);x(A,i.siteAppSection,u);var R=new Promise(function(e){sap.ushell.Container.getServiceAsync("URLTemplate").then(function(t){sap.ui.require(["sap/ushell/components/applicationIntegration/application/BlueBoxesCache"],function(n){var a=n.get(A.url)===undefined;t.handlePostTemplateProcessing(A.url,i.siteAppSection,a).then(e)})})});R.then(function(e){if(m&&e.indexOf("ui5appruntime.html")>0){var t=e.split("?");t[0]=m;e=t.join("?")}A.url=e;E(A.url,o,i).then(function(e){A.url=e;if(A.url&&typeof A.url==="string"&&A.url.indexOf("sap-iframe-hint=GUI")>0){s(A)}else{U(A.url,u.targetNavMode,o).then(function(e){A.url=e;s(A)},function(){s(A)})}})})})})}function E(n,s,r){return new Promise(function(i){var o=s.urlTransformation||{enabled:false},p,u,l;var f=W(o,r);if(f===true){l=new e(n);p=o.transformations[0].service.uri;var m=a.prepareExpandData({urlTemplate:"",parameters:{names:p.queryOptions}},{},{urlComponent:{query:l.query(),fragment:l.fragment()}},r.siteAppSection,"");u=e.expand("{+rootPath}/{+resourcePath}{?queryParams*}",{rootPath:p.rootPath,resourcePath:p.resourcePath,queryParams:m.oResolvedParameters}).toString();sap.ui.require(["sap/ui/thirdparty/datajs"],function(e){e.read({requestUri:u,headers:{"Cache-Control":"no-cache, no-store, must-revalidate",Pragma:"no-cache",Expires:"0"}},function(e){var a=c.get("transformAppLaunchQueryString.value",e);if(a===undefined){a=c.get("transformAppLaunchIntent.value",e)}if(a===undefined){a=c.get("transformAppLaunchQueryString.queryString",e)}t.info("URL Transformation Succeeded",JSON.stringify({URLBeforeTransformation:n,URLAfterTransformation:a}),"sap.ushell.ApplicationType");if(o.transformations[0].sourceURLComponent===undefined){o.transformations[0].sourceURLComponent="query"}if(o.transformations[0].sourceURLComponent==="query"||o.transformations[0].sourceURLComponent==="fragment"){n=l[o.transformations[0].sourceURLComponent].apply(l,[a]).toString()}else{t.error("The "+o.transformations[0].sourceURLComponent+" component of the URL in URI.js is not transformed","","sap.ushell.ApplicationType")}i(n)},function(e){t.error("URL Transformation Failed",JSON.stringify(e),"sap.ushell.ApplicationType");i(n)})})}else{i(n)}})}function W(e,t){if(typeof e.enabled==="boolean"){return e.enabled}var n=a.prepareExpandData({urlTemplate:"",parameters:{names:{enabled:e.enabled}}},{},{},t.siteAppSection,"");return typeof n.oResolvedParameters.enabled==="boolean"?n.oResolvedParameters.enabled:false}function N(t,n,a){var i=t.inbound,o=i&&i.resolutionResult,l={};var c=new e(n);var f=u({},t.mappedIntentParamsPlusSimpleDefaults);if(t.inbound&&t.inbound.action==="launchURL"&&t.inbound.semanticObject==="Shell"){delete f["sap-external-url"]}var m=f["sap-system"]&&f["sap-system"][0];var d=f["sap-system-src"]&&f["sap-system-src"][0];l["sap-system"]=m;delete f["sap-system"];if(typeof d==="string"){l["sap-system-src"]=d;delete f["sap-system-src"]}return new Promise(function(e,t){if(s.absoluteUrlDefinedByUser(c,o.systemAlias,o.systemAliasSemantics)){e(n)}else{r.spliceSapSystemIntoURI(c,o.systemAlias,m,d,"URL",o.systemAliasSemantics||r.SYSTEM_ALIAS_SEMANTICS.applied,a).fail(t).done(function(t){var n=t.toString();e(n)})}}).then(function(e){var t=false,n,a=p.last("/core/navigation/flpURLDetectionPattern"),r=new RegExp(a);if(f&&f.hasOwnProperty("sap-params-append")){delete f["sap-params-append"];t=true}n=s.getURLParsing().paramsToString(f);return r.test(e)||t===true?s.appendParametersToIntentURL(f,e):s.appendParametersToUrl(n,e)},Promise.reject.bind(Promise)).then(function(e){["additionalInformation","applicationDependencies","systemAlias"].forEach(function(e){if(i.resolutionResult.hasOwnProperty(e)){l[e]=i.resolutionResult[e]}});l.url=e;l.text=i.title;l.applicationType="URL";return Promise.resolve(l)},Promise.reject.bind(Promise))}var F={URL:{type:"URL",defaultFullWidthSetting:true,generateResolutionResult:function(e){var t=e.inbound.hasOwnProperty("templateContext");return t?O.apply(null,arguments):N.apply(null,arguments)},easyAccessMenu:{intent:"Shell-startURL",resolver:null,showSystemSelectionInUserMenu:true,showSystemSelectionInSapMenu:false,systemSelectionPriority:1}},WDA:{type:"WDA",defaultFullWidthSetting:true,enableWdaCompatibilityMode:p.last("/core/navigation/enableWdaCompatibilityMode"),generateResolutionResult:d,easyAccessMenu:{intent:"Shell-startWDA",resolver:i.resolveEasyAccessMenuIntentWDA,showSystemSelectionInUserMenu:true,showSystemSelectionInSapMenu:true,systemSelectionPriority:2}},TR:{type:"TR",defaultFullWidthSetting:true,generateResolutionResult:h,easyAccessMenu:{intent:"Shell-startGUI",resolver:o.resolveEasyAccessMenuIntentWebgui,showSystemSelectionInUserMenu:true,showSystemSelectionInSapMenu:true,systemSelectionPriority:3}},NWBC:{type:"NWBC",defaultFullWidthSetting:true},WCF:{type:"WCF",generateResolutionResult:y,defaultFullWidthSetting:true},SAPUI5:{type:"SAPUI5",generateResolutionResult:g,defaultFullWidthSetting:false}};function j(){return Object.keys(F).map(function(e){return F[e]}).filter(function(e){return typeof e.easyAccessMenu==="object"})}function q(){var e={};j().forEach(function(t){e[t.easyAccessMenu.intent]=t.easyAccessMenu.resolver});return function(t,n){if(e[t]&&(!n||n!=="SAPUI5")){return e[t]}return null}}function k(e){if(!F[e]){return false}return F[e].defaultFullWidthSetting}Object.defineProperty(F,"enum",{value:Object.keys(F).reduce(function(e,t){if(F[t].type){e[t]=F[t].type}return e},{})});var H={getEasyAccessMenuResolver:q(),getEasyAccessMenuDefinitions:j,getDefaultFullWidthSetting:k,handleURLTransformation:E};Object.keys(H).forEach(function(e){Object.defineProperty(F,e,{value:H[e]})});return F},false);
//# sourceMappingURL=ApplicationType.js.map