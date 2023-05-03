/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/base/ManagedObject"],function(e){"use strict";var u=e.extend("sap.ui.vk.Material",{metadata:{library:"sap.ui.vk",properties:{id:{type:"string"},name:{type:"string"},ambientColour:{type:"sap.ui.core.CSSColor",defaultValue:"rgba(0, 0, 0, 1)"},diffuseColour:{type:"sap.ui.core.CSSColor",defaultValue:"rgba(0, 0, 0, 1)"},specularColour:{type:"sap.ui.core.CSSColor",defaultValue:"rgba(0, 0, 0, 1)"},emissiveColour:{type:"sap.ui.core.CSSColor",defaultValue:"rgba(0, 0, 0, 1)"},opacity:{type:"float",defaultValue:1},glossiness:{type:"float",defaultValue:0},lineColour:{type:"sap.ui.core.CSSColor",defaultValue:"rgba(0, 0, 0, 1)"},lineWidth:{type:"float",defaultValue:0},textureDiffuse:{type:"sap.ui.vk.Texture",defaultValue:null},textureBump:{type:"sap.ui.vk.Texture",defaultValue:null},textureOpacity:{type:"sap.ui.vk.Texture",defaultValue:null},textureReflection:{type:"sap.ui.vk.Texture",defaultValue:null},textureEmissive:{type:"sap.ui.vk.Texture",defaultValue:null},textureAmbientOcclusion:{type:"sap.ui.vk.Texture",defaultValue:null}}}});u.prototype.getMaterialRef=function(){return null};return u});
//# sourceMappingURL=Material.js.map