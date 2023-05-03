// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/resources","sap/ushell/Config"],function(e,n){"use strict";var t=function(){};t.prototype._getPageAndSpaceId=function(e){return sap.ushell.Container.getServiceAsync("URLParsing").then(function(n){if(e===undefined){e=window.hasher.getHash()}var t=n.parseShellHash(e)||{};var i={semanticObject:t.semanticObject||"",action:t.action||""};var a=t.params||{};var r=a.pageId||[];var s=a.spaceId||[];return this._parsePageAndSpaceId(r,s,i)}.bind(this))};t.prototype._parsePageAndSpaceId=function(n,t,i){return new Promise(function(a,r){this.getUserMyHomeEnablement().then(function(){if(n.length<1&&t.length<1){var s=i.semanticObject==="Shell"&&i.action==="home";var c=i.semanticObject===""&&i.action==="";if(s||c){this._getUserDefaultSpaceAndPage().then(function(e){a(e)}).catch(function(e){r(e)});return}r(e.i18n.getText("PageRuntime.NoPageIdAndSpaceIdProvided"))}if(n.length===1&&t.length===0){r(e.i18n.getText("PageRuntime.OnlyPageIdProvided"))}if(n.length===0&&t.length===1){r(e.i18n.getText("PageRuntime.OnlySpaceIdProvided"))}if(n.length>1||t.length>1){r(e.i18n.getText("PageRuntime.MultiplePageOrSpaceIdProvided"))}if(n[0]===""){r(e.i18n.getText("PageRuntime.InvalidPageId"))}if(t[0]===""){r(e.i18n.getText("PageRuntime.InvalidSpaceId"))}a({pageId:n[0],spaceId:t[0]})}.bind(this))}.bind(this))};t.prototype.getUserMyHomeEnablement=function(){return new Promise(function(e,t){var i=sap.ushell.Container.getUser().getShowMyHome();n.emit("/core/spaces/myHome/userEnabled",i);e(i)})};t.prototype._getUserDefaultSpaceAndPage=function(){return new Promise(function(n,t){Promise.all([sap.ushell.Container.getServiceAsync("Menu"),this.getUserMyHomeEnablement()]).then(function(i){var a=i[0];a.getDefaultSpace().then(function(i){if(!i){t(e.i18n.getText("PageRuntime.NoAssignedSpace"));return}var a=i&&i.children&&i.children[0];if(!a){t(e.i18n.getText("PageRuntime.NoAssignedPage"));return}n({spaceId:i.id,pageId:a.id})})}).catch(function(e){t(e)})}.bind(this))};return new t});
//# sourceMappingURL=PagesAndSpaceId.js.map