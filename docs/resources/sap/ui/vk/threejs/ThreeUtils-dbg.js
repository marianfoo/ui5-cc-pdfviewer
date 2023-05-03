/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

/**
 * Provides utility methods to dispose three.js geometries and materials.
 */
sap.ui.define([
	"../thirdparty/three",
	"sap/base/Log",
	"../ObjectType"
], function(
	THREE,
	Log,
	ObjectType
) {
	"use strict";

	var ThreeUtils = {};

	ThreeUtils._disposeMaterial = function(oMaterial) {
		if (oMaterial.map) {
			oMaterial.map.dispose();
		}
		if (oMaterial.lightMap) {
			oMaterial.lightMap.dispose();
		}
		if (oMaterial.bumpMap) {
			oMaterial.bumpMap.dispose();
		}
		if (oMaterial.normalMap) {
			oMaterial.normalMap.dispose();
		}
		if (oMaterial.specularMap) {
			oMaterial.specularMap.dispose();
		}
		if (oMaterial.envMap) {
			oMaterial.envMap.dispose();
		}
		if (oMaterial.alphaMap) {
			oMaterial.alphaMap.dispose();
		}
		if (oMaterial.emissiveMap) {
			oMaterial.emissiveMap.dispose();
		}
		if (oMaterial.aoMap) {
			oMaterial.aoMap.dispose();
		}

		oMaterial.dispose();
	};

	ThreeUtils.disposeMaterial = function(oMaterial) {
		if (oMaterial) {
			if (oMaterial instanceof THREE.MeshFaceMaterial) {
				oMaterial.materials.forEach(function(m) {
					ThreeUtils._disposeMaterial(m);
				});
			} else {
				ThreeUtils._disposeMaterial(oMaterial);
			}
		}
	};

	ThreeUtils.disposeObject = function(oThreeObject) {
		if (oThreeObject instanceof THREE.Mesh || oThreeObject instanceof THREE.Line || oThreeObject instanceof THREE.Box3Helper) {
			if (oThreeObject.geometry) {
				oThreeObject.geometry.dispose();
			}
			if (oThreeObject.material) {
				ThreeUtils._disposeMaterial(oThreeObject.material);
			}
		}
	};

	ThreeUtils.disposeGeometry = function(oThreeObject) {
		if (oThreeObject instanceof THREE.Mesh || oThreeObject instanceof THREE.Line || oThreeObject instanceof THREE.Box3Helper) {
			if (oThreeObject.geometry) {
				oThreeObject.geometry.dispose();
			}
		}
	};

	ThreeUtils.getAllTHREENodes = function(nodeList, all3DNodes, allGroupNodes) {
		if (!nodeList) {
			return;
		}

		if (!all3DNodes || !allGroupNodes) {
			Log.error("getAllTHREENodes input parameters - all3DNodes and/or allGroupNodes are undefined.");
			return;
		}

		nodeList.forEach(function(n) {
			if (n instanceof THREE.Mesh) {
				all3DNodes.push(n);
			} else if (n instanceof THREE.Light) {
				all3DNodes.push(n);
			} else if (n instanceof THREE.Camera) {
				all3DNodes.push(n);
			} else if (n instanceof THREE.Box3Helper) {
				all3DNodes.push(n);
			} else if (n instanceof THREE.Group) {
				allGroupNodes.push(n);
			}

			if (n.children && n.children.length > 0) {
				ThreeUtils.getAllTHREENodes(n.children, all3DNodes, allGroupNodes);
			}
		});
	};

	// Be careful not use this caching object in recursive calls.
	var vertex = new THREE.Vector3();

	var computeBoundingBoxExcludingHotSpotAndPMI = function(object, box) {
		box.makeEmpty();

		object.updateMatrixWorld(true);
		object.traverse(function(node) {
			if (node.userData.objectType === ObjectType.Hotspot || node.userData.objectType === ObjectType.PMI) {
				return;
			}

			var i;
			var count;
			var geometry = node.geometry;
			if (geometry != null) {
				if (geometry.isGeometry) {
					var vertices = geometry.vertices;

					for (i = 0, count = vertices.length; i < count; i++) {
						vertex.copy(vertices[i]);
						vertex.applyMatrix4(node.matrixWorld);
						box.expandByPoint(vertex);
					}
				} else if (geometry.isBufferGeometry) {
					var attribute = geometry.attributes.position;
					if (attribute != null) {
						for (i = 0, count = attribute.count; i < count; i++) {
							vertex.fromBufferAttribute(attribute, i).applyMatrix4(node.matrixWorld);
							box.expandByPoint(vertex);
						}
					}
				}
			}
		});

		return box;
	};

	ThreeUtils.computeObjectOrientedBoundingBox = function(object, box) {
		var parent = object.parent;
		var matrix = object.matrix.clone();
		var matrixAutoUpdate = object.matrixAutoUpdate;
		object.parent = null;
		object.matrix.identity();
		object.matrixAutoUpdate = false;
		computeBoundingBoxExcludingHotSpotAndPMI(object, box);
		object.matrixAutoUpdate = matrixAutoUpdate;
		object.matrix.copy(matrix);
		object.parent = parent;
		object.updateMatrixWorld(true);
		return box;
	};

	return ThreeUtils;
});
