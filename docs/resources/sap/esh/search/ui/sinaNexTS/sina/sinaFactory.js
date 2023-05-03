/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["../core/util","./Sina","../providers/abap_odata/Provider","../providers/hana_odata/Provider","../providers/sample/Provider","../providers/inav2/Provider","../providers/dummy/Provider","../providers/multi/Provider","../core/Log","../core/errors","./SinaConfiguration"],function(r,e,n,i,o,t,a,v,u,s,c){var d=e["Sina"];var f=n["Provider"];var l=i["Provider"];var p=o["Provider"];var P=t["Provider"];var g=a["Provider"];var A=v["MultiProvider"];var h=s["NoValidEnterpriseSearchAPIConfigurationFoundError"];var m=c["AvailableProviders"];var b=c["_normalizeConfiguration"];function w(r,e,n){if(n){return e?e(r):r}if(!r||!r.then){r=Promise.resolve(r)}return e?r.then(e):r}var y=function r(e){return E(M,function(r){if(!r){return}var n=false;for(var i=0;i<e.length;++i){var o=e[i];if(o.provider.indexOf("/dummy/Provider")<0&&o.provider!==r.provider){e.splice(i,1);i--;continue}if(o.provider===r.provider){n=true;S(o,r)}}if(!n){e.splice(0,0,r)}})};function L(r){return function(){for(var e=[],n=0;n<arguments.length;n++){e[n]=arguments[n]}try{return Promise.resolve(r.apply(this,e))}catch(r){return Promise.reject(r)}}}var _=L(function(r,e){var n=this;var i=new u.Log("sinaFactory");e=e||function(){return true};var o=[];var t=function(n){if(n>=r.length){return Promise.reject(new h(o.join(", ")))}var a=r[n];o.push(a.provider);return N(a).then(function(r){if(e(r)){return r}return t(n+1)},function(r){i.info(r);return t(n+1)})}.bind(n);return t(0)});function E(r,e,n){if(n){return e?e(r()):r()}try{var i=Promise.resolve(r());return e?i.then(e):i}catch(r){return Promise.reject(r)}}var M=L(function(){var e=r.getUrlParameter("sinaConfiguration");if(e){return b(e)}var n=r.getUrlParameter("sinaProvider");return n?b(n):Promise.resolve()});var N=L(function(r){return w(b(r),function(r){if(r.logTarget){u.Log.persistency=r.logTarget}if(typeof r.logLevel!=="undefined"){u.Log.level=r.logLevel}var e=new u.Log("sinaFactory");e.debug("Creating new eshclient instance using provider "+r.provider);var n;switch(r.provider){case m.HANA_ODATA:{n=new l;break}case m.ABAP_ODATA:{n=new f;break}case m.INAV2:{n=new P;break}case m.MULTI:{n=new A;break}case m.SAMPLE:{n=new p;break}case m.DUMMY:{n=new g;break}default:{throw new Error("Unknown Provider: '"+r.provider+"' - Available Providers: "+m.HANA_ODATA+", "+m.ABAP_ODATA+", "+m.INAV2+", "+m.MULTI+", "+m.SAMPLE+", "+m.DUMMY)}}var i=new d(n);return w(i.initAsync(r),function(){return i})})});if(typeof process!=="undefined"&&process.env&&process.env.NODE_ENV&&process.env.NODE_ENV==="debug"){var D=new u.Log;u.Log.level=u.Severity.DEBUG;D.debug("SINA log level set to debug!")}function T(r,e){var n;return Promise.all(r.map(b.bind(this))).then(function(r){n=r;return y(n)}.bind(this)).then(function(){return _(n,e)}.bind(this))}function S(r,e){for(var n in e){r[n]=e[n]}}var U={__esModule:true};U.createAsync=N;U.createByTrialAsync=T;return U})})();
//# sourceMappingURL=sinaFactory.js.map