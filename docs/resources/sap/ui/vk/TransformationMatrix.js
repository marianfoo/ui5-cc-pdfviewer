/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/base/DataType","sap/base/assert"],function(n,r){"use strict";var t=n.getType("float[]");t.parseValue=function(n){var r=t.getComponentType();return n.split(/\s*,\s*|\s+/).map(r.parseValue.bind(r))};t.convertTo4x4=function(n){var r=n;return[r[0],r[1],r[2],0,r[3],r[4],r[5],0,r[6],r[7],r[8],0,r[9],r[10],r[11],1]};t.canConvertTo4x3=function(n){var r=function(n,r){return Math.abs(n-r)<1e-5};return r(n[3],0)&&r(n[7],0)&&r(n[11],0)&&r(n[15],1)};t.convertTo4x3=function(n){var e=n;r(t.canConvertTo4x3(e),"The transformation matrix is invalid. The last column must be [0, 0, 0, 1].");return[e[0],e[1],e[2],e[4],e[5],e[6],e[8],e[9],e[10],e[12],e[13],e[14]]};t.convert3x2To4x3=function(n){return[n[0],n[1],0,n[2],n[3],0,0,0,1,n[4],n[5],0]};t.convert4x3To3x2=function(n){return new Float32Array([n[0],n[1],n[3],n[4],n[9],n[10]])};t.convert4x4To3x2=function(n){return new Float32Array([n[0],n[1],n[4],n[5],n[12],n[13]])};t.convertTo3x2=function(n){if(n){if(n.length===12){return t.convert4x3To3x2(n)}else if(n.length===16){return t.convert4x4To3x2(n)}}return new Float32Array([1,0,0,1,0,0])};return t},true);
//# sourceMappingURL=TransformationMatrix.js.map