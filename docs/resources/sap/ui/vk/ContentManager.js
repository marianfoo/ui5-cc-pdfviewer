/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/base/ManagedObject"],function(t){"use strict";var e=t.extend("sap.ui.vk.ContentManager",{metadata:{abstract:true,library:"sap.ui.vk",events:{contentChangesStarted:{parameters:{}},contentChangesFinished:{parameters:{content:{type:"any"},failureReason:{type:"object"}}},contentChangesProgress:{parameters:{phase:{type:"string"},percentage:{type:"float"},source:{type:"any"}}},contentLoadingFinished:{parameters:{source:{type:"any"},node:{type:"any"}}}}}});var n=e.getMetadata().getParent().getClass().prototype;e.prototype.init=function(){if(n.init){n.init.call(this)}this._decryptionHandler=null;this._authorizationHandler=null;this._retryCount=1};e.prototype.destroyContent=function(t){return this};e.prototype.collectGarbage=function(){return this};e.prototype.createOrthographicCamera=function(){return null};e.prototype.createPerspectiveCamera=function(){return null};e.prototype.destroyCamera=function(t){return this};e.prototype.setDecryptionHandler=function(t){this._decryptionHandler=t;return this};e.prototype.setAuthorizationHandler=function(t){this._authorizationHandler=t;return this};e.prototype.setRetryCount=function(t){this._retryCount=Math.max(t,0);return this};return e});
//# sourceMappingURL=ContentManager.js.map