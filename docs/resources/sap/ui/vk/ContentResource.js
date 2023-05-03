/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/base/ManagedObject","./ContentResourceSourceTypeToCategoryMap"],function(e,t){"use strict";var o=e.extend("sap.ui.vk.ContentResource",{metadata:{library:"sap.ui.vk",properties:{source:"any",sourceType:"string",sourceId:"string",localMatrix:"sap.ui.vk.TransformationMatrix",name:"string",password:"string",useSecureConnection:{type:"boolean",defaultValue:true},veid:"string",includeHidden:{type:"boolean",defaultValue:true},includeAnimation:{type:"boolean",defaultValue:true},pushPMI:{type:"boolean",defaultValue:false},metadataFilter:"string",activateView:"string",enableLogger:{type:"boolean",defaultValue:false},pushViewGroups:{type:"boolean",defaultValue:true},includeBackground:{type:"boolean",defaultValue:true},includeParametric:{type:"boolean",defaultValue:true},includeUsageId:{type:"sap.ui.vk.IncludeUsageIdType",defaultValue:false},dependencyLoader:"any"},aggregations:{contentResources:"sap.ui.vk.ContentResource"}},constructor:function(t,o,r){e.apply(this,arguments)}});o.prototype.isTreeBinding=function(e){return e==="contentResources"};o.prototype.destroy=function(){e.prototype.destroy.call(this)};o.prototype.setLocalMatrix=function(e){var t=this.getNodeProxy();if(t){t.setLocalMatrix(e)}this.setProperty("localMatrix",e,true);return this};o.prototype.getSourceProperties=function(){return this._shadowContentResource&&this._shadowContentResource.sourceProperties||{}};o.prototype.getNodeProxy=function(){return this._shadowContentResource&&this._shadowContentResource.nodeProxy||null};o.collectCategories=function(e){var o=[];var r={};function n(e){var a=(e.getSourceType()||"").toLowerCase();if(a){var u=t[a]||"unknown";if(!r.hasOwnProperty(u)){r[u]=true;o.push(u)}}e.getContentResources().forEach(n)}e.forEach(n);return o};return o});
//# sourceMappingURL=ContentResource.js.map