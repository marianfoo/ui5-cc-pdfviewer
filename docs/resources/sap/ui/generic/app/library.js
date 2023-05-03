/*!
 * SAPUI5

(c) Copyright 2009-2020 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Core","sap/ui/core/library","sap/m/library","sap/fe/navigation/library"],function(a){"use strict";var e=a.initLibrary({name:"sap.ui.generic.app",version:"1.108.0",dependencies:["sap.ui.core","sap.m","sap.fe.navigation"],types:["sap.ui.generic.app.navigation.service.NavType","sap.ui.generic.app.navigation.service.ParamHandlingMode","sap.ui.generic.app.navigation.service.SuppressionBehavior"],interfaces:[],controls:[],elements:[],noLibraryCSS:true});e.navigation.service.ParamHandlingMode={SelVarWins:"SelVarWins",URLParamWins:"URLParamWins",InsertInSelOpt:"InsertInSelOpt"};e.navigation.service.NavType={initial:"initial",URLParams:"URLParams",xAppState:"xAppState",iAppState:"iAppState"};e.navigation.service.SuppressionBehavior={standard:0,ignoreEmptyString:1,raiseErrorOnNull:2,raiseErrorOnUndefined:4};sap.ui.lazyRequire("sap.ui.generic.app.AppComponent","new extend getMetadata");return e});
//# sourceMappingURL=library.js.map