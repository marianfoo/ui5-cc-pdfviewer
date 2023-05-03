/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/core/Element"],function(t){"use strict";var e=t.extend("sap.ui.vk.tools.ExplodeItemGroup",{metadata:{library:"sap.ui.vk",properties:{name:{type:"string"},magnitudeAdjustmentMultiplier:{type:"float",defaultValue:0}},aggregations:{items:{type:"sap.ui.vk.NodeProxy",multiple:true}}}});e.prototype.init=function(){this._magnitude=0;this._offset=0;this._deltaOffset=0;this._center=new THREE.Vector3};e.prototype.getBoundingBox=function(){var t=new THREE.Box3;this.getItems().forEach(function(e){e.getNodeRef()._expandBoundingBox(t,false,true,true)});return t};e.prototype.getMagnitude=function(){return this._magnitude*(this._offset+this._deltaOffset*this.getMagnitudeAdjustmentMultiplier())};return e});
//# sourceMappingURL=ExplodeItemGroup.js.map