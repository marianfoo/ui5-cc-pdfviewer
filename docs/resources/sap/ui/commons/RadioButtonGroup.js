/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","./library","sap/ui/core/Control","sap/ui/core/delegate/ItemNavigation","./RadioButton","./RadioButtonGroupRenderer","sap/ui/core/library"],function(e,t,i,s,a,n,h){"use strict";var o=h.ValueState;var r=i.extend("sap.ui.commons.RadioButtonGroup",{metadata:{interfaces:["sap.ui.core.IFormContent"],library:"sap.ui.commons",deprecated:true,properties:{width:{type:"sap.ui.core.CSSSize",group:"Dimension",defaultValue:null},columns:{type:"int",group:"Appearance",defaultValue:1},editable:{type:"boolean",group:"Behavior",defaultValue:true},valueState:{type:"sap.ui.core.ValueState",group:"Data",defaultValue:o.None},selectedIndex:{type:"int",group:"Data",defaultValue:0},enabled:{type:"boolean",group:"Behavior",defaultValue:true}},defaultAggregation:"items",aggregations:{items:{type:"sap.ui.core.Item",multiple:true,singularName:"item",bindable:"bindable"}},associations:{ariaDescribedBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaDescribedBy"},ariaLabelledBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaLabelledBy"}},events:{select:{parameters:{selectedIndex:{type:"int"}}}}}});r.prototype.exit=function(){this.destroyItems();if(this.oItemNavigation){this.removeDelegate(this.oItemNavigation);this.oItemNavigation.destroy();delete this.oItemNavigation}};r.prototype.onBeforeRendering=function(){if(this.getSelectedIndex()>this.getItems().length){e.warning("Invalid index, set to 0");this.setSelectedIndex(0)}};r.prototype.onAfterRendering=function(){this.initItemNavigation();for(var e=0;e<this.aRBs.length;e++){this.aRBs[e].getDomRef().setAttribute("aria-posinset",e+1);this.aRBs[e].getDomRef().setAttribute("aria-setsize",this.aRBs.length)}};r.prototype.initItemNavigation=function(){var e=[];this._aActiveItems=[];var t=this._aActiveItems;var i=false;for(var a=0;a<this.aRBs.length;a++){t[e.length]=a;e.push(this.aRBs[a].getDomRef());if(!i&&this.aRBs[a].getEnabled()){i=true}}if(i){i=this.getEnabled()}if(!i){if(this.oItemNavigation){this.removeDelegate(this.oItemNavigation);this.oItemNavigation.destroy();delete this.oItemNavigation}return}if(!this.oItemNavigation){this.oItemNavigation=new s;this.oItemNavigation.attachEvent(s.Events.AfterFocus,this._handleAfterFocus,this);this.addDelegate(this.oItemNavigation)}this.oItemNavigation.setRootDomRef(this.getDomRef());this.oItemNavigation.setItemDomRefs(e);this.oItemNavigation.setCycling(true);this.oItemNavigation.setColumns(this.getColumns());this.oItemNavigation.setSelectedIndex(this.getSelectedIndex());this.oItemNavigation.setFocusedIndex(this.getSelectedIndex())};r.prototype.setSelectedIndex=function(t){var i=this.getSelectedIndex();if(t<0){e.warning("Invalid index, will not be changed");return this}this.setProperty("selectedIndex",t,true);if(!isNaN(i)&&this.aRBs&&this.aRBs[i]){this.aRBs[i].setSelected(false)}if(this.aRBs&&this.aRBs[t]){this.aRBs[t].setSelected(true)}if(this.oItemNavigation){this.oItemNavigation.setSelectedIndex(t);this.oItemNavigation.setFocusedIndex(t)}return this};r.prototype.setSelectedItem=function(e){for(var t=0;t<this.getItems().length;t++){if(e.getId()==this.getItems()[t].getId()){this.setSelectedIndex(t);break}}};r.prototype.getSelectedItem=function(){return this.getItems()[this.getSelectedIndex()]};r.prototype.addItem=function(e){this.myChange=true;this.addAggregation("items",e);e.attachEvent("_change",this._handleItemChanged,this);this.myChange=undefined;if(!this._bUpdateItems){if(this.getSelectedIndex()===undefined){this.setSelectedIndex(0)}}if(!this.aRBs){this.aRBs=[]}var t=this.aRBs.length;this.aRBs[t]=this.createRadioButton(e,t);return this};r.prototype.insertItem=function(e,t){this.myChange=true;this.insertAggregation("items",e,t);e.attachEvent("_change",this._handleItemChanged,this);this.myChange=undefined;if(!this.aRBs){this.aRBs=[]}var i=this.aRBs.length;if(!this._bUpdateItems){if(this.getSelectedIndex()===undefined||i==0){this.setSelectedIndex(0)}else if(this.getSelectedIndex()>=t){this.setProperty("selectedIndex",this.getSelectedIndex()+1,true)}}if(t>=i){this.aRBs[t]=this.createRadioButton(e,t)}else{for(var s=i;s>t;s--){this.aRBs[s]=this.aRBs[s-1];if(s-1==t){this.aRBs[s-1]=this.createRadioButton(e,t)}}}return this};r.prototype.createRadioButton=function(e,t){if(this.iIDCount==undefined){this.iIDCount=0}else{this.iIDCount++}var i=new a(this.getId()+"-"+this.iIDCount);i.setText(e.getText());i.setTooltip(e.getTooltip());if(this.getEnabled()){i.setEnabled(e.getEnabled())}else{i.setEnabled(false)}i.setKey(e.getKey());i.setTextDirection(e.getTextDirection());i.setEditable(this.getEditable());i.setGroupName(this.getId());i.setValueState(this.getValueState());i.setParent(this);if(t==this.getSelectedIndex()){i.setSelected(true)}i.attachEvent("select",this.handleRBSelect,this);return i};r.prototype.removeItem=function(e){var t=e;if(typeof e=="string"){e=sap.ui.getCore().byId(e)}if(typeof e=="object"){t=this.indexOfItem(e)}this.myChange=true;var i=this.removeAggregation("items",t);i.detachEvent("_change",this._handleItemChanged,this);this.myChange=undefined;if(!this.aRBs){this.aRBs=[]}if(!this.aRBs[t]){return null}this.aRBs[t].destroy();this.aRBs.splice(t,1);if(!this._bUpdateItems){if(this.aRBs.length==0){this.setSelectedIndex(undefined)}else if(this.getSelectedIndex()==t){this.setSelectedIndex(0)}else if(this.getSelectedIndex()>t){this.setProperty("selectedIndex",this.getSelectedIndex()-1,true)}}return i};r.prototype.removeAllItems=function(){this.myChange=true;var e=this.removeAllAggregation("items");for(var t=0;t<e.length;t++){e[t].detachEvent("_change",this._handleItemChanged,this)}this.myChange=undefined;if(!this._bUpdateItems){this.setSelectedIndex(undefined)}if(this.aRBs){while(this.aRBs.length>0){this.aRBs[0].destroy();this.aRBs.splice(0,1)}return e}else{return null}};r.prototype.destroyItems=function(){this.myChange=true;var e=this.getItems();for(var t=0;t<e.length;t++){e[t].detachEvent("_change",this._handleItemChanged,this)}this.destroyAggregation("items");this.myChange=undefined;if(!this._bUpdateItems){this.setSelectedIndex(undefined)}if(this.aRBs){while(this.aRBs.length>0){this.aRBs[0].destroy();this.aRBs.splice(0,1)}}return this};r.prototype.updateItems=function(){var e=this.getSelectedIndex();this._bUpdateItems=true;this.updateAggregation("items");this._bUpdateItems=undefined;var t=this.getItems();if(e===undefined&&t.length>0){this.setSelectedIndex(0)}else if(e>=0&&t.length==0){this.setSelectedIndex(undefined)}else if(e>=t.length){this.setSelectedIndex(t.length-1)}};r.prototype.clone=function(){var e=this.getItems();var t=0;for(t=0;t<e.length;t++){e[t].detachEvent("_change",this._handleItemChanged,this)}var s=i.prototype.clone.apply(this,arguments);for(t=0;t<e.length;t++){e[t].attachEvent("_change",this._handleItemChanged,this)}return s};r.prototype.handleRBSelect=function(e){for(var t=0;t<this.aRBs.length;t++){if(this.aRBs[t].getId()==e.getParameter("id")){this.setSelectedIndex(t);this.oItemNavigation.setSelectedIndex(t);this.oItemNavigation.setFocusedIndex(t);this.fireSelect({selectedIndex:t});break}}};r.prototype.setEditable=function(e){this.setProperty("editable",e,false);if(this.aRBs){for(var t=0;t<this.aRBs.length;t++){this.aRBs[t].setEditable(e)}}return this};r.prototype.setEnabled=function(e){this.setProperty("enabled",e,false);if(this.aRBs){for(var t=0;t<this.aRBs.length;t++){this.aRBs[t].setEnabled(e)}}return this};r.prototype.setValueState=function(e){this.setProperty("valueState",e,false);if(this.aRBs){for(var t=0;t<this.aRBs.length;t++){this.aRBs[t].setValueState(e)}}return this};r.prototype._handleAfterFocus=function(e){var t=e.getParameter("index");var i=e.getParameter("event");if(t!=this.getSelectedIndex()&&!(i.ctrlKey||i.metaKey)&&this.aRBs[t].getEditable()&&this.aRBs[t].getEnabled()){this.setSelectedIndex(t);this.oItemNavigation.setSelectedIndex(t);this.fireSelect({selectedIndex:t})}};r.prototype._handleItemChanged=function(e){var t=e.oSource;var i=e.getParameter("name");var s=e.getParameter("newValue");var a=this.getItems();var n;for(var h=0;h<a.length;h++){if(a[h]==t){if(this.aRBs[h]){n=this.aRBs[h]}break}}switch(i){case"text":n.setText(s);break;case"tooltip":n.setTooltip(s);break;case"enabled":if(this.getEnabled()){n.setEnabled(s)}break;case"key":n.setKey(s);break;case"textDirection":n.setTextDirection(s);break;default:break}};return r});
//# sourceMappingURL=RadioButtonGroup.js.map