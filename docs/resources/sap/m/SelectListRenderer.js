/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element","sap/ui/core/library","sap/ui/core/IconPool","sap/ui/Device"],function(e,t,s,i){"use strict";var a=t.TextDirection;var n={apiVersion:2};n.CSS_CLASS="sapMSelectList";n.render=function(e,t){this.writeOpenListTag(e,t,{elementData:true});this.renderItems(e,t);this.writeCloseListTag(e,t)};n.writeOpenListTag=function(e,t,s){var i=n.CSS_CLASS,a=t.getProperty("_tabIndex");if(s.elementData){e.openStart("ul",t)}else{e.openStart("ul")}e.class(i);if(t.getShowSecondaryValues()){e.class(i+"TableLayout")}if(!t.getEnabled()){e.class(i+"Disabled")}if(a){e.attr("tabindex",a)}e.style("width",t.getWidth());this.writeAccessibilityState(e,t);e.openEnd()};n.writeCloseListTag=function(e,t){e.close("ul")};n.renderItems=function(e,t){var s=t._getNonSeparatorItemsCount(),i=t.getHideDisabledItems()?t.getEnabledItems():t.getItems(),a=t.getSelectedItem(),n=1,r,l;for(var o=0;o<i.length;o++){l=o===0&&!a;r={selected:a===i[o],setsize:s,elementData:true};if(!(i[o]&&i[o].isA("sap.ui.core.SeparatorItem"))&&i[o].getEnabled()){r.posinset=n++}this.renderItem(e,t,i[o],r,l)}};n.renderDirAttr=function(e,t){if(t!==a.Inherit){e.attr("dir",t.toLowerCase())}};n.renderItem=function(t,s,a,r,l){if(!(a instanceof e)){return}var o=a.getEnabled(),c=s.getSelectedItem(),d=n.CSS_CLASS,I=a.getTooltip_AsString(),f=a.getTextDirection(),p=s.getShowSecondaryValues(),S;t.openStart("li",r.elementData?a:null);if(!p){this.renderDirAttr(t,f)}if(a.getIcon&&a.getIcon()){t.class("sapMSelectListItemWithIcon")}if(a.isA("sap.ui.core.SeparatorItem")){t.class(d+"SeparatorItem");if(p){t.class(d+"Row")}}else{t.class(d+"ItemBase");if(p){t.class(d+"Row")}else{t.class(d+"Item")}if(a.bVisible===false){t.class(d+"ItemBaseInvisible")}if(!o){t.class(d+"ItemBaseDisabled")}if(o&&i.system.desktop){t.class(d+"ItemBaseHoverable")}if(a===c||l){t.class(d+"ItemBaseSelected")}if(o){t.attr("tabindex","0")}}if(I){t.attr("title",I)}this.writeItemAccessibilityState.apply(this,arguments);t.openEnd();if(p){S=s._getColumnsPercentages();t.openStart("span");t.class(d+"Cell");t.class(d+"FirstCell");if(S){t.style("width",S.firstColumn)}t.attr("disabled","disabled");this.renderDirAttr(t,f);t.openEnd();this._renderIcon(t,a);t.text(a.getText());t.close("span");t.openStart("span");t.class(d+"Cell");t.class(d+"LastCell");if(S){t.style("width",S.secondColumn)}t.attr("disabled","disabled");t.openEnd();if(typeof a.getAdditionalText==="function"){t.text(a.getAdditionalText())}t.close("span")}else{this._renderIcon(t,a);t.text(a.getText())}t.close("li")};n.writeAccessibilityState=function(e,t){e.accessibilityState(t,{role:"listbox"})};n.writeItemAccessibilityState=function(e,t,i,a){var n=i.isA("sap.ui.core.SeparatorItem")?"separator":"option";var r;if(!i.getText()&&i.getIcon&&i.getIcon()){var l=s.getIconInfo(i.getIcon());if(l){r=l.text||l.name}}e.accessibilityState(i,{role:n,selected:a.selected,setsize:a.setsize,posinset:a.posinset,label:r})};n._renderIcon=function(e,t){if(t.getIcon&&t.getIcon()){e.icon(t.getIcon(),n.CSS_CLASS+"ItemIcon",{id:t.getId()+"-icon"})}};return n},true);
//# sourceMappingURL=SelectListRenderer.js.map