sap.ui.define(["sap/ui/thirdparty/jquery","sap/ui/base/ManagedObject"],function(jQuery,r){"use strict";var t=r.extend("sap.suite.ui.commons.CalculationBuilderValidationResult",{constructor:function(){r.prototype.constructor.apply(this,arguments);this._aErrors=[]}});t.prototype.addError=function(r){this._aErrors.push(r)};t.prototype.addErrors=function(r){jQuery.merge(this._aErrors,r)};t.prototype.getErrors=function(){return this._aErrors};return t});
//# sourceMappingURL=CalculationBuilderValidationResult.js.map