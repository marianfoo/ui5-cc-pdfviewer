/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/write/_internal/connectors/LrepConnector","sap/ui/fl/initial/_internal/connectors/NeoLrepConnector","sap/ui/fl/initial/_internal/connectors/Utils"],function(e,t,n,i){"use strict";var r={SETTINGS:"/flex/settings"};return e({},t,{initialConnector:n,layers:n.layers,isContextSharingEnabled:function(){return Promise.resolve(false)},loadContextDescriptions:function(){return Promise.reject("loadContextsDescriptions is not implemented")},getContexts:function(){return Promise.reject("getContexts is not implemented")},contextBasedAdaptation:{create:function(){return Promise.reject("contextBasedAdaptation.create is not implemented")}},loadFeatures:function(e){if(n.settings){return Promise.resolve(n.settings)}var t={};var s=i.getUrl(r.SETTINGS,e,t);return i.sendRequest(s,"GET",{initialConnector:n}).then(function(e){e.response.isContextSharingEnabled=false;return e.response})}})});
//# sourceMappingURL=NeoLrepConnector.js.map