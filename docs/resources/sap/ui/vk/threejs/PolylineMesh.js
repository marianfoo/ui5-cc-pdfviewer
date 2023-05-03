/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["../thirdparty/three","./PolylineGeometry","./PolylineMaterial"],function(e,t,r){"use strict";function a(e,a){var i=e!==undefined?e:new t;var l=a!==undefined?a:new r;THREE.Mesh.call(this,i,l);this.type="PolylineMesh"}a.prototype=Object.assign(Object.create(THREE.Mesh.prototype),{constructor:a,isPolylineMesh:true,computeLineDistances:function(){var e=new THREE.Vector4;var t=new THREE.Vector4;var r=new THREE.Vector2;var a=new THREE.Vector2;return function(i,l,n){var c=this.geometry;var o=c.attributes.instanceDistance.data;var s=o.array;var p=c.vertices;var y=0,u;e.copy(p[0]).applyMatrix4(i);for(var w=0,d=0,f=o.count;w<f;w++,d+=2){t.copy(p[w+1]).applyMatrix4(i);if(n!==undefined){if(e.w>=n){r.copy(e).multiplyScalar(1/e.w);if(t.w>=n){a.copy(t).multiplyScalar(1/t.w)}else{u=(e.w-n)/(e.w-t.w);a.copy(t).sub(e).multiplyScalar(u).add(e).multiplyScalar(1/n)}}else if(t.w>=n){a.copy(t).multiplyScalar(1/t.w);u=(t.w-n)/(t.w-e.w);r.copy(e).sub(t).multiplyScalar(u).add(t).multiplyScalar(1/n)}else{r.set(0,0,0);a.set(0,0,0)}}else{r.copy(e);a.copy(t)}s[d]=y;y+=a.sub(r).multiply(l).length()*.5;s[d+1]=y;e.copy(t)}this.material.lineLength=y;o.needsUpdate=true;return this}}()});return a});
//# sourceMappingURL=PolylineMesh.js.map