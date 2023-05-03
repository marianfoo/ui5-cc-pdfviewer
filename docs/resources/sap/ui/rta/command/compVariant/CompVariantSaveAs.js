/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/write/api/SmartVariantManagementWriteAPI","sap/ui/rta/command/BaseCommand","sap/ui/rta/library"],function(t,e,a){"use strict";var i=e.extend("sap.ui.rta.command.compVariant.CompVariantSaveAs",{metadata:{library:"sap.ui.rta",properties:{newVariantProperties:{type:"object"},previousDirtyFlag:{type:"boolean"},previousVariantId:{type:"string"},previousDefault:{type:"string"},activateAfterUndo:{type:"boolean"}}}});i.prototype.prepare=function(t,e,i){this.mInformation={layer:t.layer,command:i,generator:a.GENERATOR_NAME};return true};i.prototype.getPreparedChange=function(){return this._oVariant};i.prototype.execute=function(){var e=this.getNewVariantProperties();var a={changeSpecificData:{id:this._oVariant?this._oVariant.getVariantId():undefined,type:e.type,texts:{variantName:e.text},content:e.content,executeOnSelection:e.executeOnSelection,favorite:true,contexts:e.contexts,layer:this.mInformation.layer},control:this.getElement(),command:this.mInformation.command,generator:this.mInformation.generator};this._oVariant=t.addVariant(a);if(e.default){t.setDefaultVariantId(Object.assign({},this.mInformation,{control:this.getElement(),defaultVariantId:this._oVariant.getVariantId()}))}this.getElement().addVariant(this._oVariant,e.default);this.getElement().activateVariant(this._oVariant.getVariantId());return Promise.resolve()};i.prototype.undo=function(){t.removeVariant({id:this._oVariant.getVariantId(),control:this.getElement(),revert:true});if(this.getNewVariantProperties().default){t.setDefaultVariantId(Object.assign({},this.mInformation,{control:this.getElement(),defaultVariantId:this.getPreviousDefault()}))}this.getElement().removeWeakVariant({previousDirtyFlag:this.getPreviousDirtyFlag(),previousVariantId:this.getPreviousVariantId(),previousDefault:this.getPreviousDefault(),variantId:this._oVariant.getVariantId()});if(this.getActivateAfterUndo()){this.getElement().activateVariant(this.getPreviousVariantId())}return Promise.resolve()};return i});
//# sourceMappingURL=CompVariantSaveAs.js.map