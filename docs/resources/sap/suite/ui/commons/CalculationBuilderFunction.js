sap.ui.define(["./library","sap/ui/core/Control"],function(e,t){"use strict";var u=t.extend("sap.suite.ui.commons.CalculationBuilderFunction",{metadata:{library:"sap.suite.ui.commons",properties:{key:{type:"string",group:"Misc",defaultValue:null},label:{type:"string",group:"Misc",defaultValue:null},description:{type:"string",group:"Misc",defaultValue:null},useDefaultValidation:{type:"boolean",group:"Misc",defaultValue:false}},aggregations:{items:{type:"sap.suite.ui.commons.CalculationBuilderItem",multiple:true,singularName:"item"}}},renderer:null});u.prototype._getLabel=function(){return this.getLabel()||this.getKey()};return u});
//# sourceMappingURL=CalculationBuilderFunction.js.map