// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/base/util/ObjectPath","sap/ui/core/Control","sap/ui/core/IconPool","sap/ui/core/InvisibleText","sap/ushell/library","sap/ushell/resources"],function(e,t,a,i,r,o){"use strict";var n=r.FloatingNumberType;var l=t.extend("sap.ushell.ui.shell.ShellHeadItem",{metadata:{library:"sap.ushell",properties:{startsSection:{type:"boolean",group:"Appearance",defaultValue:false,deprecated:true},showSeparator:{type:"boolean",group:"Appearance",defaultValue:false,deprecated:true},enabled:{type:"boolean",group:"Appearance",defaultValue:true},selected:{type:"boolean",group:"Appearance",defaultValue:false},showMarker:{type:"boolean",group:"Appearance",defaultValue:false,deprecated:true},icon:{type:"sap.ui.core.URI",group:"Appearance",defaultValue:null},target:{type:"sap.ui.core.URI",group:"Appearance",defaultValue:null},ariaLabel:{type:"string",group:"Accessibility",defaultValue:null},ariaHidden:{type:"boolean",group:"Accessibility",defaultValue:false},ariaHaspopup:{type:"string",group:"Accessibility",defaultValue:""},text:{type:"string",group:"Appearance",defaultValue:null},floatingNumber:{type:"int",group:"Appearance",defaultValue:null},floatingNumberMaxValue:{type:"int",group:"Appearance",defaultValue:999},floatingNumberType:{type:"string",group:"Appearance",defaultValue:n.None}},events:{press:{}}},renderer:{apiVersion:2,render:function(e,t){var i=t.getTarget();e.openStart("a",t);e.attr("tabindex","0");if(i){e.attr("href",i)}e.attr("role",i?"link":"button");var r=t.getAriaLabel();if(r){e.attr("aria-label",r)}var o=t.getAriaHidden();if(o){e.attr("aria-hidden",o)}var n=t.getAriaHaspopup();if(n){e.attr("aria-haspopup",n)}e.attr("aria-describedby",t._oAriaDescribedbyText.getId());if(t.getTooltip_AsString()){e.attr("title",t.getTooltip_AsString())}if(t.getFloatingNumber()>0){e.attr("data-counter-content",t.floatingNumberFormatter());e.class("sapUshellShellHeadItmCounter")}e.class("sapUshellShellHeadItm");if(!t.getEnabled()){e.class("sapUshellShellHeadItmDisabled")}if(t.getSelected()){e.class("sapUshellShellHeadItmSel")}var l=t.getText();var s=t.getTooltip_AsString();if(l&&s&&l!==s){e.attr("title",l+" "+s)}else if(l||s){e.attr("title",l||s)}e.openEnd();e.openStart("span");e.class("sapUshellShellHeadItmCntnt");var u=t.getIcon();var p=a.isIconURI(u)&&a.getIconInfo(u);if(p){e.style("font-family",p.fontFamily);e.openEnd();e.text(p.content)}else{e.openEnd();e.voidStart("img");e.attr("id",t.getId()+"-img-inner");e.attr("src",u);e.voidEnd()}e.close("span");e.close("a")}}});l.prototype.init=function(){this._oAriaDescribedbyText=new i(this.getId()+"-describedby").toStatic();this.addDependent(this._oAriaDescribedbyText)};l.prototype.onBeforeRendering=function(){switch(this.getFloatingNumberType()){case n.None:this._oAriaDescribedbyText.setText("");break;default:var e=this.getFloatingNumber();if(!e){this._oAriaDescribedbyText.setText("")}else{var t=this.getFloatingNumberMaxValue();this._oAriaDescribedbyText.setText(e>t?o.i18n.getText("NotificationToggleButton.NewNotifications.MaxExceeded",t):o.i18n.getText("NotificationToggleButton.NewNotifications",e))}break}};l.prototype.tooltipFormatter=function(e){var t=typeof e!=="undefined"?e:this.getFloatingNumber();var a=this.getFloatingNumberMaxValue();switch(this.getFloatingNumberType()){default:case n.None:return"";case n.Notifications:if(!t){return o.i18n.getText("NotificationToggleButton.NoNewNotifications")}return t>a?o.i18n.getText("NotificationToggleButton.NewNotifications.MaxExceeded",a):o.i18n.getText("NotificationToggleButton.NewNotifications",t);case n.OverflowButton:var i=o.i18n.getText("shellHeaderOverflowBtn_tooltip");if(!t){return i}i+=" ("+(t>a?o.i18n.getText("NotificationToggleButton.NewNotifications.MaxExceeded",a):o.i18n.getText("NotificationToggleButton.NewNotifications",t))+")";return i}};l.prototype.floatingNumberFormatter=function(e){var t=typeof e!=="undefined"?e:this.getFloatingNumber();var a=this.getFloatingNumberMaxValue();return t>a?a+"+":t.toString()};l.prototype.onclick=function(e){if(this.getEnabled()){this.firePress();if(!this.getTarget()){e.preventDefault()}}};l.prototype.onkeyup=function(e){var t=e.originalEvent;var a=t.key;var i=t.shiftKey;if(["Enter"," "].includes(a)&&!i){this.onclick(e)}};e.set("sap.ui.unified.ShellHeadItem",l);return l},true);
//# sourceMappingURL=ShellHeadItem.js.map