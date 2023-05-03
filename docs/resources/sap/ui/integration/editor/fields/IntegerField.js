/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/editor/fields/BaseField","sap/m/Input"],function(e,t){"use strict";var a=e.extend("sap.ui.integration.editor.fields.IntegerField",{metadata:{library:"sap.ui.integration"},renderer:e.getMetadata().getRenderer()});a.prototype.initVisualization=function(e){var a=e.visualization;var i=e.formatter;if(!a){a={type:t,settings:{value:{path:"currentSettings>value",type:"sap.ui.model.type.Integer",formatOptions:i},editable:e.editable,type:"Number",parseError:function(e){var t=e.getSource(),a=null;if(t.getValue()!==""){if(e.getParameters()&&e.getParameters().exception&&e.getParameters().exception.message){a=e.getParameters().exception.message}else{a=e.getId()}t.getParent()._showValueState("error",a)}else{t.getParent()._showValueState("none","")}}}}}else if(a.type==="Slider"){a.type="sap/m/Slider"}this._visualization=a};return a});
//# sourceMappingURL=IntegerField.js.map