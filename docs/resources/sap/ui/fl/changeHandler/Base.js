/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/LoaderExtensions"],function(e){"use strict";var t={setTextInChange:function(e,t,n,r){if(!e.texts){e.texts={}}if(!e.texts[t]){e.texts[t]={}}e.texts[t].value=n;e.texts[t].type=r},instantiateFragment:function(t,n){var r=t.getModuleName();if(!r){return Promise.reject(new Error("The module name of the fragment is not set. This should happen in the backend"))}var a=n.viewId?n.viewId+"--":"";var i=t.getProjectId()||"";var o=t.getExtensionPointInfo&&t.getExtensionPointInfo()&&t.getExtensionPointInfo().fragmentId||"";var s=i&&o?".":"";var u=a+i+s+o;var f=n.modifier;var c=n.view;return Promise.resolve().then(function(){var t=e.loadResource(r,{dataType:"text"});return f.instantiateFragment(t,u,c).catch(function(e){throw new Error("The following XML Fragment could not be instantiated: "+t+" Reason: "+e.message)})})},markAsNotApplicable:function(e,t){var n={message:e};if(!t){throw n}return Promise.reject(n)}};return t},true);
//# sourceMappingURL=Base.js.map