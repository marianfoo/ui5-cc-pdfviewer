/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./Base","sap/m/Button"],function(t,e){"use strict";var n=t.extend("sap.ui.rta.toolbar.Personalization",{renderer:"sap.ui.rta.toolbar.BaseRenderer",type:"personalization",metadata:{library:"sap.ui.rta",events:{exit:{},restore:{}}},constructor:function(){t.apply(this,arguments);this.setJustifyContent("End")}});n.prototype.buildContent=function(){[new e("sapUiRta_restore",{type:"Transparent",text:"{i18n>BTN_RESTORE}",visible:true,press:this.eventHandler.bind(this,"Restore")}).data("name","restore"),new e("sapUiRta_exit",{type:"Emphasized",text:"{i18n>BTN_DONE}",press:this.eventHandler.bind(this,"Exit")}).data("name","exit")].forEach(function(t){this.addItem(t)}.bind(this));return Promise.resolve()};return n});
//# sourceMappingURL=Personalization.js.map