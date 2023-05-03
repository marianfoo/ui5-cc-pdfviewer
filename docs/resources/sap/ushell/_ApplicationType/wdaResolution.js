// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ui/thirdparty/URI","sap/ushell/_ApplicationType/utils","sap/ushell/_ApplicationType/systemAlias","sap/ui/thirdparty/jquery","sap/base/util/ObjectPath"],function(s,e,a,jQuery,t){"use strict";function n(s,a){return new Promise(function(t,n){var r=jQuery.extend(true,{},s);if(a.length>0){r["sap-ushell-defaultedParameterNames"]=[JSON.stringify(a)]}delete r["sap-system"];sap.ushell.Container.getServiceAsync("ShellNavigation").then(function(s){s.compactParams(r,["sap-xapp-state","sap-ushell-defaultedParameterNames","sap-intent-params","sap-iframe-hint","sap-keep-alive","sap-wd-configId"],undefined,true).fail(function(s){n(s)}).done(function(s){var a=e.getURLParsing().paramsToString(s);t(a)})}).catch(function(s){n(s)})})}function r(s,e){var a=s.search();if(e){a=a+(a.indexOf("?")<0?"?":"&")+e}return s.search(a).toString()}function i(t,n,r,i,o){var l,m,c,f,d,y=jQuery.extend(true,{},i);if(n){y["sap-wd-configId"]=n}if(y["sap-system"]){l=y["sap-system"][0];delete y["sap-system"]}if(y.hasOwnProperty("sap-system-src")){m=y["sap-system-src"][0];delete y["sap-system-src"]}d=e.getURLParsing().paramsToString(y);if(r){c=p(t,d)}else{c=u(t,d)}f=new s(c);return a.spliceSapSystemIntoURI(f,a.LOCAL_SYSTEM_ALIAS,l,m,"WDA",a.SYSTEM_ALIAS_SEMANTICS.apply,o)}function p(s,e){return"/ui2/nwbc/~canvas;window=app/wda/"+s+"/"+"?"+e}function u(s,e){var a=s.indexOf("/")!==0;if(a){s="sap/"+s}return"/webdynpro/"+s+"?"+e}function o(s,a,t,n){var r={"sap-system":t,url:a,text:s.title,applicationType:"NWBC"};if(typeof n==="string"){r["sap-system-src"]=n}e.setSystemAlias(r,s.resolutionResult);["additionalInformation","applicationDependencies"].forEach(function(e){if(s.resolutionResult.hasOwnProperty(e)){r[e]=s.resolutionResult[e]}});r.url=e.appendParametersToUrl("sap-iframe-hint="+(r.url.indexOf("/ui2/nwbc/")>=0?"NWBC":"WDA"),r.url);return r}function l(s,e,a){var p=t.get("inbound.resolutionResult",s),u=s.mappedIntentParamsPlusSimpleDefaults||{};var l=p.systemAlias;if(u["sap-system"]){l=u["sap-system"][0]}var m;if(u["sap-system-src"]){m=u["sap-system-src"][0]}var c={"sap-system":[l]};if(typeof m==="string"){c["sap-system-src"]=[m]}var f=p["sap.wda"].compatibilityMode;if(f===undefined){f=true}return new Promise(function(e,t){i(p["sap.wda"].applicationId,p["sap.wda"].configId,f,c,a).done(function(a){var i=s.mappedIntentParamsPlusSimpleDefaults;n(i,s.mappedDefaultedParamNames).then(function(t){var n=r(a,t);var p=i["sap-system"]&&i["sap-system"][0];var u=i["sap-system-src"]&&i["sap-system-src"][0];var l=o(s.inbound,n,p,u);e(l)},function(s){t(s)})}).fail(function(s){t(s)})})}function m(e,t,i){var p=e.inbound,u=p&&p.resolutionResult,l=e.mappedIntentParamsPlusSimpleDefaults;var m=new s(t);var c=l["sap-system"]&&l["sap-system"][0];var f=l["sap-system-src"]&&l["sap-system-src"][0];return Promise.all([new Promise(function(s,e){a.spliceSapSystemIntoURI(m,u.systemAlias,c,f,"WDA",u.systemAliasSemantics||a.SYSTEM_ALIAS_SEMANTICS.applied,i).fail(e).done(s)}),n(l,e.mappedDefaultedParamNames)]).then(function(s){var e=s[0];var a=s[1];var t=r(e,a);var n=o(p,t,c,f);return n},function(s){return Promise.reject(s)})}function c(s,a,n,r){var p=s.params["sap-ui2-wd-app-id"][0];var u=(t.get("params.sap-ui2-wd-conf-id",s)||[])[0];var o=Object.keys(s.params).reduce(function(e,a){if(a!=="sap-ui2-wd-app-id"&&a!=="sap-ui2-wd-conf-id"){e[a]=s.params[a]}return e},{});return new Promise(function(t,l){i(p,u,r,o,n).done(function(n){var r=s.params.hasOwnProperty("sap-system-src")&&s.params["sap-system-src"][0];var i=s.params.hasOwnProperty("sap-system")&&s.params["sap-system"][0];var u={url:n.toString(),applicationType:"NWBC",text:p,additionalInformation:"","sap-system":i};if(typeof r==="string"){u["sap-system-src"]=r}if(a&&a.inbound&&a.inbound.resolutionResult&&a.inbound.resolutionResult["sap.platform.runtime"]){u["sap.platform.runtime"]=a.inbound.resolutionResult["sap.platform.runtime"]}u.url=e.appendParametersToUrl("sap-iframe-hint="+(u.url.indexOf("/ui2/nwbc/")>=0?"NWBC":"WDA"),u.url);t(u)}).fail(function(s){l(s)})})}return{resolveEasyAccessMenuIntentWDA:c,constructFullWDAResolutionResult:l,constructWDAResolutionResult:m}},false);
//# sourceMappingURL=wdaResolution.js.map