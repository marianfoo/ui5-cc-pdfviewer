/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2021 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/core/Core","sap/ui/core/library"],function(){"use strict";var a=sap.ui.getCore().initLibrary({name:"sap.fe.navigation",version:"1.108.10",dependencies:["sap.ui.core"],types:["sap.fe.navigation.NavType","sap.fe.navigation.ParamHandlingMode","sap.fe.navigation.SuppressionBehavior"],interfaces:[],controls:[],elements:[],noLibraryCSS:true});a.ParamHandlingMode={SelVarWins:"SelVarWins",URLParamWins:"URLParamWins",InsertInSelOpt:"InsertInSelOpt"};a.NavType={initial:"initial",URLParams:"URLParams",xAppState:"xAppState",iAppState:"iAppState"};a.SuppressionBehavior={standard:0,ignoreEmptyString:1,raiseErrorOnNull:2,raiseErrorOnUndefined:4};a.Mode={ODataV2:"ODataV2",ODataV4:"ODataV4"};return a});
//# sourceMappingURL=library.js.map