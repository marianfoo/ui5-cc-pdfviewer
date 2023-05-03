/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["../thirdparty/three"],function(e){"use strict";var n={generateSphere:function(e,n){var t=new THREE.SphereGeometry(e.radius,32,32);var r=new THREE.Mesh(t,n||undefined);r.name="sphere";return r},generateBox:function(e){},generatePlane:function(e,n){var t=new THREE.PlaneGeometry(e.length,e.width);var r=new THREE.Mesh(t,n||undefined);r.name="plane";r.rotation.x=Math.PI/2;r.position.set(-e.length/2,-e.width/2,0);return r}};return n});
//# sourceMappingURL=ParametricGenerators.js.map