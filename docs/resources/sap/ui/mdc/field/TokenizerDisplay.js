/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/Tokenizer","sap/ui/mdc/field/TokenizerDisplayRenderer","sap/ui/events/KeyCodes","sap/m/library"],function(e,t,i,n){"use strict";var o=n.EmptyIndicatorMode;var r=e.extend("sap.ui.mdc.field.TokenizerDisplay",{metadata:{library:"sap.ui.mdc",properties:{emptyIndicatorMode:{type:"sap.m.EmptyIndicatorMode",group:"Appearance",defaultValue:o.Off}}},renderer:t});r.prototype.init=function(){e.prototype.init.apply(this,arguments);this.allowTextSelection(true);this.addStyleClass("sapUiMdcTokenizerDisplay")};r.prototype.onkeydown=function(t){e.prototype.onkeydown.call(this,t);if(!this.getEnabled()){return}if(t.which===i.ENTER){if(this.getHiddenTokensCount()>0){this._handleNMoreIndicatorPress()}}};r.prototype.getAccessibilityInfo=function(){var e=this.getTokens().map(function(e){return e.getText()}).join(" ");return{description:e}};return r});
//# sourceMappingURL=TokenizerDisplay.js.map