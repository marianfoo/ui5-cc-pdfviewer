/*
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/model/odata/type/Int16"],function(t){"use strict";var o=t.extend("sap.ui.comp.smartfield.type.Int16",{constructor:function(o,e){t.apply(this,arguments);this.oFieldControl=null}});o.prototype.parseValue=function(o,e){var p=t.prototype.parseValue.apply(this,arguments);if(typeof this.oFieldControl==="function"){this.oFieldControl(o,e)}return p};o.prototype.destroy=function(){t.prototype.destroy.apply(this,arguments);this.oFieldControl=null};o.prototype.getName=function(){return"sap.ui.comp.smartfield.type.Int16"};return o});
//# sourceMappingURL=Int16.js.map