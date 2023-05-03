/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the Scene class.
sap.ui.define([
	"../Scene",
	"./NodeHierarchy",
	"../RenderMode",
	"./ThreeExtensions",
	"./ThreeUtils",
	"sap/base/util/uid"
], function(
	SceneBase,
	NodeHierarchy,
	RenderMode,
	ThreeExtensions,
	ThreeUtils,
	uid
) {
	"use strict";

	/**
	 * Constructor for a new Scene.
	 *
	 * @class Provides the interface for the 3D model.
	 *
	 * The objects of this class should not be created directly.
	 *
	 * @param {THREE.Scene} scene The three.js scene object.
	 * @public
	 * @author SAP SE
	 * @version 1.108.1
	 * @extends sap.ui.vk.Scene
	 * @alias sap.ui.vk.threejs.Scene
	 */
	var Scene = SceneBase.extend("sap.ui.vk.threejs.Scene", /** @lends sap.ui.vk.threejs.Scene.prototype */ {
		metadata: {
			library: "sap.ui.vk"
		},

		constructor: function(scene) {
			SceneBase.call(this);

			this._id = uid();
			this._scene = scene;
			this._sceneBuilder = null;
			this._defaultNodeHierarchy = null;
			this._currentViewStateManager = null;
			this._animationSequenceMap = new Map();
			this._initialView = null;
			this._materialMap = new Map();
		}
	});

	Scene.prototype.init = function() {

		this._outlineColor = new THREE.Vector4(0, 0, 0, 1);
		this._outlineMaterial = new THREE.ShaderMaterial({
			uniforms: {
				color: {
					value: this._outlineColor
				}
			},

			vertexShader: [
				"attribute vec3 normal1;",
				"attribute vec3 normal2;",
				"#include <clipping_planes_pars_vertex>",
				"uniform vec4 color;",
				"varying vec4 vColor;",
				"void main() {",
				"	#include <begin_vertex>",
				"	#include <project_vertex>",
				"	#include <clipping_planes_vertex>",
				"	vec3 eyeDirection = mvPosition.xyz;",
				"	vec3 n1 = normalMatrix * normal1;",
				"	vec3 n2 = normalMatrix * normal2;",
				"	vColor = color;",
				"	vColor.a *= step(dot(eyeDirection, n1) * dot(eyeDirection, n2), 0.0);",
				"}"
			].join("\n"),

			fragmentShader: [
				"#include <clipping_planes_pars_fragment>",
				"varying vec4 vColor;",
				"void main() {",
				"	#include <clipping_planes_fragment>",
				"	if (vColor.a < ALPHATEST) discard;",
				"	gl_FragColor = vColor;",
				"}"
			].join("\n"),

			depthWrite: false,
			depthFunc: THREE.LessEqualDepth,
			polygonOffset: true,
			polygonOffsetFactor: -4,
			blending: THREE.NormalBlending,
			alphaTest: 0.01,
			clipping: true
		});

		this._solidWhiteMaterial = new THREE.MeshBasicMaterial({
			color: 0xFFFFFF
		});
	};

	Scene.prototype.clearThreeScene = function() {
		if (!this._scene) {
			return;
		}

		var all3DNodes = [];
		var allGroupNodes = [];

		ThreeUtils.getAllTHREENodes([this._scene], all3DNodes, allGroupNodes);

		var disposedBufferGeometries = new Map();
		var disposedMaterials = new Map();

		all3DNodes.forEach(function(n3d) {
			if (n3d instanceof THREE.Mesh) {
				if (!disposedBufferGeometries.has(n3d.geometry.uuid)) {
					ThreeUtils.disposeGeometry(n3d);
					disposedBufferGeometries.set(n3d.geometry.uuid, true);
				}

				if (n3d.material) {
					if (!disposedMaterials.has(n3d.material.uuid)) {
						ThreeUtils.disposeMaterial(n3d.material);
						disposedMaterials.set(n3d.material.uuid, true);
					}
				}

				if (n3d.userData &&
					n3d.userData.originalMaterial &&
					n3d.userData.originalMaterial.uuid !== n3d.material.uuid &&
					!disposedMaterials.has(n3d.userData.originalMaterial.uuid)) {
					ThreeUtils.disposeMaterial(n3d.userData.originalMaterial);
					disposedMaterials.set(n3d.userData.originalMaterial.uuid, true);
				}
			}
			n3d.parent.remove(n3d);
		});

		allGroupNodes.forEach(function(gn) {
			gn.parent.remove(gn);
		});

		disposedBufferGeometries.clear();
		disposedMaterials.clear();
	};

	Scene.prototype.destroy = function() {
		this.clearThreeScene();
		// if (this._sceneBuilder) {
		// 	this._sceneBuilder.cleanup();
		// }

		if (this._defaultNodeHierarchy) {
			this._defaultNodeHierarchy.destroy();
			this._defaultNodeHierarchy = null;
		}

		ThreeUtils.disposeMaterial(this._solidWhiteMaterial);
		ThreeUtils.disposeMaterial(this._outlineMaterial);

		this._sceneBuilder = null;
		if (this._scene) {
			this._scene.dispose();
		}
		this._scene = null;
		this._currentViewStateManager = null;

		this._animationSequenceMap.clear();
		this._materialMap.clear();

		SceneBase.prototype.destroy.call(this);
	};

	Scene.prototype.setDoubleSided = function(value) {
		this.setProperty("doubleSided", value, true);

		this._scene.traverse(function(node) {
			if (node.material !== undefined) {
				var userData = node.userData;
				var originalMaterialSide = THREE.FrontSide;
				var materialUserData;
				if (userData.originalMaterial) {
					if (userData.originalMaterial.userData === undefined) {
						userData.originalMaterial.userData = {};
					}
					materialUserData = userData.originalMaterial.userData;
					if (materialUserData.originalMaterialSide === undefined) {
						materialUserData.originalMaterialSide = userData.originalMaterial.side;
					}
					originalMaterialSide = materialUserData.originalMaterialSide;
				} else {
					if (node.material.userData === undefined) {
						node.material.userData = {};
					}
					materialUserData = node.material.userData;
					if (materialUserData.originalMaterialSide === undefined) {
						materialUserData.originalMaterialSide = node.material.side;
					}
					originalMaterialSide = materialUserData.originalMaterialSide;
				}
				node.material.side = value ? THREE.DoubleSide : originalMaterialSide;
			}
		});

		return this;
	};

	Scene.prototype.setViewStateManager = function(value) {
		this._currentViewStateManager = value;
		return this;
	};

	Scene.prototype.getViewStateManager = function() {
		return this._currentViewStateManager;
	};

	/**
	 * Gets the unique ID of the Scene object.
	 * @returns {string} The unique ID of the Scene object.
	 * @public
	 */
	Scene.prototype.getId = function() {
		return this._id;
	};

	/**
	 * Gets the default node hierarchy in the Scene object.
	 * @returns {sap.ui.vk.NodeHierarchy} The default node hierarchy in the Scene object.
	 * @public
	 */
	Scene.prototype.getDefaultNodeHierarchy = function() {
		if (!this._defaultNodeHierarchy) {
			this._defaultNodeHierarchy = new NodeHierarchy(this);
		}
		return this._defaultNodeHierarchy;
	};

	Scene.prototype._computeBoundingBox = function(visibleOnly, ignoreDynamicObjects, ignore2DObjects) {
		var boundingBox = new THREE.Box3();
		if (this._scene) {
			this._scene._expandBoundingBox(boundingBox, visibleOnly, ignoreDynamicObjects, ignore2DObjects);
		}
		return boundingBox;
	};

	/**
	 * Gets the scene reference for the Scene object.
	 * @returns {THREE.Scene} The three.js scene.
	 * @public
	 */
	Scene.prototype.getSceneRef = function() {
		return this._scene;
	};

	Scene.prototype.setSceneBuilder = function(sceneBuilder) {
		this._sceneBuilder = sceneBuilder;
	};

	Scene.prototype.getSceneBuilder = function() {
		return this._sceneBuilder;
	};

	/**
	 * Gets the persistent ID from node reference.
	 *
	 * @param {THREE.Object3D|THREE.Object3D[]} nodeRefs The reference to the node or the array of references to the nodes.
	 * @returns {string|string[]} The persistent ID or the array of the persistent IDs.
	 * @public
	 */
	Scene.prototype.nodeRefToPersistentId = function(nodeRefs) {
		return Array.isArray(nodeRefs) ?
			nodeRefs.map(function(nodeRef) { return nodeRef._vkPersistentId(); }) :
			nodeRefs._vkPersistentId();
	};

	/**
	 * Gets the node reference from persistent ID.
	 *
	 * @param {string|string[]} pIDs The persistent ID or the array of the persistent IDs.
	 * @returns {THREE.Object3D|THREE.Object3D[]} The reference to the node or the array of references to the nodes.
	 * @public
	 */
	Scene.prototype.persistentIdToNodeRef = function(pIDs) {
		var sceneBuilder = this._sceneBuilder;

		if (Array.isArray(pIDs)) {
			return pIDs.map(function(pID) { return sceneBuilder ? sceneBuilder.getNode(pID) : null; });
		} else {
			return sceneBuilder ? sceneBuilder.getNode(pIDs) : null;
		}
	};

	/**
	 * Assign persistent id to node
	 *
	 * @param {THREE.Object3D} nodeRef the reference to the node
	 * @param {string} sid The persistent id
	 * @param {string} sceneId scene id
	 * @returns {boolean} true if assignment is successful, false if persistent id cannot be assigned
	 * @private
	 */
	Scene.prototype.setNodePersistentId = function(nodeRef, sid, sceneId) {
		return this._sceneBuilder ? this._sceneBuilder.setNodePersistentId(nodeRef, sid, sceneId) : false;
	};

	/**
	 * Assign persistent id to annotation
	 *
	 * @param {any} annotation the reference to the annotation
	 * @param {string} sid The persistent id
	 * @param {string} sceneId scene id
	 * @returns {boolean} true if assignment is successful, false if persistent id cannot be assigned
	 * @private
	 */
	Scene.prototype.setAnnotationPersistentId = function(annotation, sid, sceneId) {
		return this._sceneBuilder ? this._sceneBuilder.setAnnotationPersistentId(annotation, sid, sceneId) : false;
	};

	/**
	 * Gets all materials defined in scene nodes
	 *
	 * @returns {sap.ui.vk.Material[]} the array of materials.
	 * @public
	 */
	Scene.prototype.enumerateMaterials = function() {
		if (!this._defaultNodeHierarchy) {
			return [];
		}

		var topNode = this._defaultNodeHierarchy.createNodeProxy(this._scene);
		if (topNode) {
			return topNode.enumerateMaterials(true);
		} else {
			return [];
		}
	};

	var distEpsilon = 0;

	function compare(a, b) {
		var dx = a.x - b.x;
		if (dx < -distEpsilon) {
			return true;
		}
		if (dx > distEpsilon) {
			return false;
		}

		var dy = a.y - b.y;
		if (dy < -distEpsilon) {
			return true;
		}
		if (dy > distEpsilon) {
			return false;
		}

		return a.z - b.z < -distEpsilon;
	}

	function quickSort(array, beginIndex, endIndex) {
		if (beginIndex < endIndex) {
			var partitionIndex = partition(array, beginIndex, endIndex);
			quickSort(array, beginIndex, partitionIndex - 1);
			quickSort(array, partitionIndex + 1, endIndex);
		}
		return array;
	}

	function partition(array, beginIndex, endIndex) {
		var pivotValue = array[endIndex],
			partitionIndex = beginIndex;

		for (var i = beginIndex; i < endIndex; i++) {
			if (compare(array[i], pivotValue)) {
				swap(array, i, partitionIndex);
				partitionIndex++;
			}
		}
		swap(array, endIndex, partitionIndex);
		return partitionIndex;
	}

	function swap(array, i, j) {
		if (i != j) {
			var temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
	}

	var size = new THREE.Vector3();

	function mergeVertices(geom) {
		geom.computeBoundingBox();
		geom.boundingBox.getSize(size);
		distEpsilon = Math.max(size.x, size.y, size.z) * 1e-4;
		// console.log("distEpsilon", distEpsilon);

		var vertices = geom.vertices,
			vertexCount = vertices.length,
			faceCount = geom.faces.length;
		if (vertexCount === 0 || faceCount === 0) {
			return;
		}
		var i, faceCount2;
		for (i = 0; i < vertexCount; i++) {
			vertices[i].index = i;
		}

		quickSort(vertices, 0, vertices.length - 1);

		var unique = [], changes = [];
		unique.push(vertices[0]);
		changes[vertices[0].index] = unique.length - 1;
		for (i = 1; i < vertexCount; i++) {
			if (compare(unique[unique.length - 1], vertices[i])) {
				unique.push(vertices[i]);
			}
			changes[vertices[i].index] = unique.length - 1;
		}
		// console.log(vertexCount, "->", unique.length);
		geom.vertices = unique;

		for (i = 0, faceCount = geom.faces.length, faceCount2 = 0; i < faceCount; i++) {
			var faceSrc = geom.faces[i];
			var face = geom.faces[faceCount2];
			face.a = changes[faceSrc.a];
			face.b = changes[faceSrc.b];
			face.c = changes[faceSrc.c];

			if (face.a !== face.b && face.b !== face.c && face.c !== face.a) {
				faceCount2++;
			}
		}
		geom.faces.length = faceCount2;
	}

	function OutlineGeometry(geometry, thresholdAngle) {
		THREE.BufferGeometry.call(this);

		this.type = "OutlineGeometry";

		// helper variables
		var thresholdDot = Math.cos(THREE.Math.DEG2RAD * ((thresholdAngle !== undefined) ? thresholdAngle : 1));
		var edges = {},
			edge1, edge2;
		var key, keys = ["a", "b", "c"];
		var v = new THREE.Vector3();

		// prepare source geometry
		var geometry2;
		if (geometry.isBufferGeometry) {
			geometry2 = new THREE.Geometry();
			geometry2.fromBufferGeometry(geometry);
		} else {
			geometry2 = geometry.clone();
		}

		mergeVertices(geometry2);
		geometry2.computeFaceNormals();

		var sourceVertices = geometry2.vertices;
		var faces = geometry2.faces;

		// now create a data structure where each entry represents an edge with its adjoining faces
		for (var fi = 0, l = faces.length; fi < l; fi++) {
			var face = faces[fi];

			for (var i = 0, j = 2; i < 3; j = i++) {
				edge1 = face[keys[j]];
				edge2 = face[keys[i]];
				key = Math.min(edge1, edge2) + "," + Math.max(edge1, edge2);

				if (edges[key] === undefined) {
					edges[key] = {
						index1: edge1,
						index2: edge2,
						face1: fi,
						face2: undefined
					};
				} else {
					edges[key].face2 = fi;
				}
			}
		}

		// generate vertices
		var vertices = [];
		var normals1 = [];
		var normals2 = [];
		for (key in edges) {
			var e = edges[key];

			// an edge is only rendered if the angle (in degrees) between the face normals of the adjoining faces exceeds this value. default = 1 degree.
			if (e.face2 === undefined || (faces[e.face1].normal.dot(faces[e.face2].normal) <= thresholdDot &&
				v.copy(sourceVertices[e.index2]).sub(sourceVertices[e.index1]).cross(faces[e.face1].normal).dot(faces[e.face2].normal) > 0)) {

				var vertex = sourceVertices[e.index1];
				vertices.push(vertex.x, vertex.y, vertex.z);

				vertex = sourceVertices[e.index2];
				vertices.push(vertex.x, vertex.y, vertex.z);

				var normal1 = faces[e.face1].normal;
				normals1.push(normal1.x, normal1.y, normal1.z);
				normals1.push(normal1.x, normal1.y, normal1.z);

				if (e.face2 !== undefined) {
					var normal2 = faces[e.face2].normal;
					normals2.push(normal2.x, normal2.y, normal2.z);
					normals2.push(normal2.x, normal2.y, normal2.z);
				} else {
					normals2.push(0, 0, 0);
					normals2.push(0, 0, 0);
				}
			}
		}

		// build geometry
		this.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
		this.setAttribute("normal1", new THREE.Float32BufferAttribute(normals1, 3));
		this.setAttribute("normal2", new THREE.Float32BufferAttribute(normals2, 3));
	}

	OutlineGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
	OutlineGeometry.prototype.constructor = OutlineGeometry;

	function box3IsNull(box) {
		// callouts and billboards have empty bounding box, we need to ignore them
		return (box === null) || (box.min.x >= box.max.x && box.min.y >= box.max.y && box.min.z >= box.max.z);
	}

	function createMergedGeometry(node) {
		var geometry = null;
		if (node.isMesh && node.geometry && !box3IsNull(node.geometry.boundingBox) && !node.userData.skipIt) {
			geometry = node.geometry;
			if (geometry.isBufferGeometry) {
				geometry = new THREE.Geometry().fromBufferGeometry(geometry);
			}
		}

		for (var i = 0, l = node.children.length; i < l; i++) {
			var child = node.children[i];
			if (child.isMesh && child.geometry && !box3IsNull(child.geometry.boundingBox) && child.userData.skipIt) {
				if (geometry === null) {
					geometry = new THREE.Geometry();
				}
				var childGeometry = child.geometry;
				if (childGeometry.isBufferGeometry) {
					childGeometry = new THREE.Geometry().fromBufferGeometry(childGeometry);
				}
				geometry.merge(childGeometry, child.matrix);
			}
		}

		return geometry;
	}

	function setMeshMaterial(node, newMaterial) {
		var userData = node.userData;
		if (userData.defaultMaterial === undefined) {// save default material
			userData.defaultMaterial = userData.originalMaterial || node.material;
		}
		node.material = newMaterial;

		// apply highlighting on the updated material
		userData.originalMaterial = null;
		node._vkUpdateMaterialColor();
		node._vkUpdateMaterialOpacity();
	}

	function restoreMeshMaterial(node) {
		var userData = node.userData;
		if (userData.defaultMaterial) {
			node.material = userData.defaultMaterial;
			delete userData.defaultMaterial;

			// apply highlighting on the updated material
			userData.originalMaterial = null;
			node._vkUpdateMaterialColor();
			node._vkUpdateMaterialOpacity();
		}
	}

	Scene.prototype._createOutlineGeometry = function(renderMode) {
		if (this._scene) {
			// var totalCount = 0, count = 0, time1 = Date.now();
			// this._scene._vkTraverseMeshNodes(function(node) {
			// 	if (!node.isOutline) {
			// 		totalCount += 1;
			// 	}
			// });
			// console.log("!!!", totalCount);
			this._scene._vkTraverseMeshNodes(function(node) {
				if (node.isOutline) {
					node.visible = true;
				} else {
					// count += 1;
					// if (count % 100 === 0) {
					// 	console.log(count * 100 / totalCount, (Date.now() - time1) * 1e-3);
					// }

					if (!node.hasOutline) {// create outline
						var mergedGeometry;
						try {
							mergedGeometry = createMergedGeometry(node);
						} catch (err) {
							mergedGeometry = null;
						}
						if (mergedGeometry !== null) {
							node.hasOutline = true;
							var geometry = new OutlineGeometry(mergedGeometry);
							geometry.boundingBox = new THREE.Box3(); // set empty bounding box, disable hit testing
							var line = new THREE.LineSegments(geometry, this._outlineMaterial);
							line.isOutline = true;
							line.renderOrder = node.renderOrder + 0.5;
							node.add(line);
						}
					}
					if (node.isMesh && node.material && !node.material.isLineBasicMaterial && !node.material.isLineMaterial) {// update material
						switch (renderMode) {
							case RenderMode.LineIllustration:
								setMeshMaterial(node, this._solidWhiteMaterial);
								break;
							case RenderMode.ShadedIllustration:
								// create whited material
								var material = (node.userData.defaultMaterial || node.userData.originalMaterial || node.material).clone();
								if (material.emissive) {
									material.color.multiplyScalar(0.5);
									material.emissive.multiplyScalar(0.5).addScalar(0.5);
								} else {
									material.color.multiplyScalar(0.5).addScalar(0.5);
								}
								setMeshMaterial(node, material);
								break;
							default:
								restoreMeshMaterial(node);
								break;
						}
					}
				}
			}.bind(this));
		}
	};

	Scene.prototype._hideOutlineGeometry = function() {
		if (this._scene) {
			this._scene._vkTraverseMeshNodes(function(node) {
				if (node.isOutline) {
					node.visible = false;
				}

				if (node.isMesh) {
					restoreMeshMaterial(node);
				}
			});
		}
	};

	/**
	 * Get initial view
	 *
	 * @function
	 * @name sap.ui.vk.Scene#getInitialView
	 *
	 * @returns {sap.ui.vk.View} initial view
	 * @public
	 */
	Scene.prototype.getInitialView = function() {
		return this._initialView;
	};

	/**
	 * Set initial view
	 *
	 * @function
	 * @name sap.ui.vk.Scene#setInitialView
	 *
	 * @param {sap.ui.vk.View} view Initial view
	 *
	 * @public
	 */
	Scene.prototype.setInitialView = function(view) {
		this._initialView = view;
	};

	/**
	 * Get material
	 *
	 * @function
	 * @name sap.ui.vk.Scene#getMaterial
	 *
	 * @param {string} materialId material id
	 *
	 * @return {sap.ui.vk.threejs.Material} material
	 *
	 * @private
	 */
	Scene.prototype.getMaterial = function(materialId) {
		return this._materialMap.get(materialId);
	};

	/**
	 * Set material
	 *
	 * @function
	 * @name sap.ui.vk.Scene#setMaterial
	 *
	 * @param {string} materialId material id
	 * @param {sap.ui.vk.threejs.Material} material to be stored
	 *
	 * @private
	 */
	Scene.prototype.setMaterial = function(materialId, material) {
		this._materialMap.set(materialId, material);
	};

	/**
	 * Clear materials
	 *
	 * @function
	 * @name sap.ui.vk.Scene#clearMaterials
	 *
	 * @private
	 */
	Scene.prototype.clearMaterials = function() {
		this._materialMap.forEach(function(value, key) {
			value.destroy();
		});
		this._materialMap.clear();
	};

	Scene.prototype._getNativeMaterial = function(materialId) {
		var material = materialId ? this._materialMap.get(materialId) : null;
		return material ? material.getMaterialRef() : null;
	};

	Scene.prototype._setNodeMaterial = function(node, materialId) {
		var material = this._getNativeMaterial(materialId);
		node.children.forEach(function(child) {
			if (child.material) {
				if (material) {// replace submesh material
					if (child.userData.materialId !== materialId) {
						this._sceneBuilder._setSubmeshMaterial(child, material, materialId);
					}
				} else {// restore submesh initial material
					var initialMaterialId = child.userData.initialMaterialId;
					if (initialMaterialId && child.userData.materialId !== initialMaterialId) {
						var initialMaterial = this._getNativeMaterial(initialMaterialId);
						if (initialMaterial) {
							this._sceneBuilder._setSubmeshMaterial(child, initialMaterial, initialMaterialId);
						}
					}
				}
			}
		}.bind(this));
	};

	return Scene;
});
