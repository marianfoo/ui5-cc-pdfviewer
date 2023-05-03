/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/preprocessors/RegistrationDelegator","sap/ui/fl/Utils","sap/ui/fl/Layer","sap/ui/fl/Scenario","sap/ui/fl/changeHandler/condenser/Classification","sap/ui/core/Configuration","sap/ui/core/library","sap/m/library"],function(e,i,a,r,s,n){"use strict";var l=sap.ui.getCore().initLibrary({name:"sap.ui.fl",version:"1.108.8",controls:["sap.ui.fl.variants.VariantManagement","sap.ui.fl.util.IFrame"],dependencies:["sap.ui.core","sap.m"],designtime:"sap/ui/fl/designtime/library.designtime",extensions:{flChangeHandlers:{"sap.ui.fl.util.IFrame":"sap/ui/fl/util/IFrame"},"sap.ui.support":{publicRules:true}}});l.condenser={Classification:s};l.Scenario=r;e.registerAll();function t(){var e=i.getUshellContainer();if(e){return e.getLogonSystem().isTrial()}return false}if(t()){n.setFlexibilityServices([{connector:"LrepConnector",url:"/sap/bc/lrep",layers:[]},{connector:"LocalStorageConnector",layers:[a.CUSTOMER,a.PUBLIC,a.USER]}])}return l});
//# sourceMappingURL=library.js.map