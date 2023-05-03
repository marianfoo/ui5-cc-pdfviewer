/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/write/_internal/connectors/BackendConnector","sap/ui/fl/initial/_internal/connectors/PersonalizationConnector"],function(e,n,r){"use strict";var t="/flex/personalization";var i="/v1";var a={isProductiveSystem:true};var o=e({},n,{layers:r.layers,ROUTES:{CHANGES:t+i+"/changes/",TOKEN:t+i+"/actions/getcsrftoken"},loadFeatures:function(){return Promise.resolve(a)}});o.initialConnector=r;return o});
//# sourceMappingURL=PersonalizationConnector.js.map