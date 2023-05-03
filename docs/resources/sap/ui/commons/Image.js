/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./library","sap/ui/core/Control","./ImageRenderer"],function(e,t,r){"use strict";var o=t.extend("sap.ui.commons.Image",{metadata:{interfaces:["sap.ui.commons.ToolbarItem","sap.ui.commons.FormattedTextViewControl","sap.ui.core.IFormContent"],library:"sap.ui.commons",deprecated:true,properties:{src:{type:"sap.ui.core.URI",group:"Data",defaultValue:null},width:{type:"sap.ui.core.CSSSize",group:"Appearance",defaultValue:null},height:{type:"sap.ui.core.CSSSize",group:"Appearance",defaultValue:null},decorative:{type:"boolean",group:"Accessibility",defaultValue:true},alt:{type:"string",group:"Accessibility",defaultValue:null},useMap:{type:"string",group:"Misc",defaultValue:null}},events:{press:{}}}});o.prototype.onclick=function(e){this.firePress({})};o.prototype.onsapenter=o.prototype.onclick;o.prototype.getFormDoNotAdjustWidth=function(){return true};return o});
//# sourceMappingURL=Image.js.map