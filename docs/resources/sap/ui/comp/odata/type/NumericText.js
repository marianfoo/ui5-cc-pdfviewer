/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Core","sap/ui/core/library","sap/ui/comp/smartfield/type/String"],function(t,e,o){"use strict";var r=o.extend("sap.ui.comp.odata.type.NumericText",{constructor:function(t,e){o.call(this,t,e);this.oCustomRegex=new RegExp("^[0]*$")}});r.prototype.parseValue=function(t,e,r){if(this.oCustomRegex.test(t)&&!r){if(typeof this.oFieldControl==="function"){this.oFieldControl(t,e)}if(this.oFormatOptions&&this.oFormatOptions.parseKeepsEmptyString){return""}return null}return o.prototype.parseValue.apply(this,arguments)};r.prototype.formatValue=function(t,e,r){if(this.oCustomRegex.test(t)){if(r){return"0"}return null}return o.prototype.formatValue.apply(this,arguments)};r.prototype.getName=function(){return"sap.ui.comp.odata.type.NumericText"};r.prototype.destroy=function(){o.prototype.destroy.apply(this,arguments)};return r});
//# sourceMappingURL=NumericText.js.map