/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

/* global THREE */

// Provides object sap.ui.vk.threejs.ContentManager.
sap.ui.define([
	"sap/base/Log",
	"../thirdparty/three",
	"../ContentManager",
	"./Scene",
	"../TransformationMatrix",
	"./PerspectiveCamera",
	"./OrthographicCamera",
	"../Messages",
	"../getResourceBundle",
	"./ContentDeliveryService",
	// The following modules are pulled in to avoid their synchronous loading in
	// `sap.ui.vk.Viewport` and `sap.ui.vk.ViewStateManager`. They go last in this list
	// to avoid declaration of unused parameters in the callback.
	"./Viewport",
	"./ViewStateManager"
], function(
	Log,
	threeJs,
	ContentManagerBase,
	Scene,
	TransformationMatrix,
	PerspectiveCamera,
	OrthographicCamera,
	Messages,
	getResourceBundle,
	ContentDeliveryService
) {
	"use strict";

	/**
	 * Constructor for a new ContentManager.
	 *
	 * @class
	 * Provides a content manager object that uses the three.js library to load 3D files.
	 *
	 * When registering a content manager resolver with {@link sap.ui.vk.ContentConnector.addContentManagerResolver sap.ui.vk.ContentConnector.addContentManagerResolver}
	 * you can pass a function that will load a model and merge it into the three.js scene.
	 *
	 * The loader function takes two parameters:
	 * <ul>
	 *   <li>parentNode - {@link https://threejs.org/docs/index.html#api/objects/Group THREE.Group} - a grouping node to merge the content into</li>
	 *   <li>contentResource - {@link sap.ui.vk.ContentResource sap.ui.vk.ContentResource} - a content resource to load</li>
	 * </ul>
	 * The loader function returns a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise Promise}
	 * object. If the loading the model succeeds the promise object resolves with a value with the following structure:
	 * <ul>
	 *   <li>node - {@link https://threejs.org/docs/index.html#api/objects/Group THREE.Group} - the grouping node to which the content
	 *       is merged into. It should be the <code>parentNode</code> parameter that was passed to the loader function.</li>
	 *   <li>contentResource - {@link sap.ui.vk.ContentResource sap.ui.vk.ContentResource} - the content resource that was loaded.</li>
	 * </ul>
	 *
	 * @see {@link sap.ui.vk.ContentConnector.addContentManagerResolver sap.ui.vk.ContentConnector.addContentManagerResolver} for an example.
	 *
	 * @param {string} [sId] ID for the new ContentManager object. Generated automatically if no ID is given.
	 * @param {object} [mSettings] Initial settings for the new ContentManager object.
	 * @protected
	 * @author SAP SE
	 * @version 1.108.1
	 * @extends sap.ui.vk.ContentManager
	 * @alias sap.ui.vk.threejs.ContentManager
	 * @since 1.50.0
	 */
	var ContentManager = ContentManagerBase.extend("sap.ui.vk.threejs.ContentManager", /** @lends sap.ui.vk.threejs.ContentManager.prototype */ {
		metadata: {
			library: "sap.ui.vk"
		}
	});

	var basePrototype = ContentManager.getMetadata().getParent().getClass().prototype;

	ContentManager.prototype.init = function() {
		if (basePrototype.init) {
			basePrototype.init.call(this);
		}
	};

	ContentManager.prototype.exit = function() {
		if (this.defaultCdsLoader) {
			this.defaultCdsLoader.destroy();
			this.defaultCdsLoader = null;
		}

		if (this.defaultMataiLoader) {
			this.defaultMataiLoader.destroy();
			this.defaultMataiLoader = null;
		}

		if (basePrototype.exit) {
			basePrototype.exit.call(this);
		}
	};

	ContentManager.prototype._handleContentChangesProgress = function(event) {
		this.fireContentChangesProgress({
			phase: event.getParameter("phase"),
			source: event.getParameter("source"),
			percentage: event.getParameter("percentage")
		});
	};

	ContentManager.prototype._handleContentLoadingFinished = function(event) {
		this.fireContentLoadingFinished({
			source: event.getParameter("source"),
			node: event.getParameter("node")
		});
	};

	function setCastShadow(object) {
		if (object && object.isMesh) {
			object.castShadow = true;
			object.receiveShadow = false;
		}
		if (object && object.children) {
			for (var ni = 0; ni < object.children.length; ni++) {
				setCastShadow(object.children[ni]);
			}
		}
	}

	function initLights(nativeScene, castShadow) {
		// temp measure to add light automatically. remove this later
		if (nativeScene) {
			var lightGroup = new THREE.Group();
			nativeScene.add(lightGroup);
			lightGroup.name = "DefaultLights";
			lightGroup.private = true;

			var bbox = new THREE.Box3().setFromObject(nativeScene);
			var size = new THREE.Vector3();
			bbox.getSize(size);
			var maxSize = size.length();

			var pointLight = new THREE.PointLight();
			pointLight.color.setRGB(0.72, 0.72, 0.81);
			bbox.getCenter(pointLight.position);
			pointLight.visible = true;
			pointLight.private = true;
			lightGroup.add(pointLight);

			var lightColors = [
				new THREE.Color(0.2, 0.2, 0.2),
				new THREE.Color(0.32, 0.32, 0.36),
				new THREE.Color(0.36, 0.36, 0.36)];

			var lightDirs = [
				new THREE.Vector3(2.0, 1.5, 0.5),
				new THREE.Vector3(-2.0, -1.1, 2.5),
				new THREE.Vector3(-0.04, -0.01, -2.0)];

			for (var l = 0, lMax = lightColors.length; l < lMax; l++) {
				var directionalLight = new THREE.DirectionalLight();
				directionalLight.color.copy(lightColors[l]);
				directionalLight.position.copy(lightDirs[l]);
				directionalLight.private = true;
				lightGroup.add(directionalLight);
			}

			if (castShadow) {
				setCastShadow(nativeScene);
				var topLight = new THREE.DirectionalLight();

				topLight.color.setRGB(0.5, 0.5, 0.5);
				topLight.position.set(0, 1, 0);

				topLight.castShadow = true;
				topLight.shadow.mapSize.width = 512;
				topLight.shadow.mapSize.height = 512;

				var d = 2000;
				topLight.shadow.camera.left = -d;
				topLight.shadow.camera.right = d;
				topLight.shadow.camera.top = d;
				topLight.shadow.camera.bottom = -d;

				topLight.shadow.camera.far = 3500;

				topLight.shadow.bias = -0.0001;
				topLight.private = true;
				lightGroup.add(topLight);

				// GROUND
				var groundGeo = new THREE.PlaneBufferGeometry(bbox.getSize().x, bbox.getSize().z);
				var groundMat = new THREE.ShadowMaterial();
				groundMat.opacity = 0.2;
				var ground = new THREE.Mesh(groundGeo, groundMat);
				ground.rotation.x = -Math.PI / 2;
				ground.position.x = bbox.getCenter().x;
				ground.position.y = bbox.min.y - maxSize * 0.1;
				ground.position.z = bbox.getCenter().z;

				nativeScene.add(ground);
				ground.receiveShadow = true;
			}
		}
	}

	/**
	 * Starts downloading and building or updating the content from the content resources.
	 *
	 * This method is asynchronous.
	 *
	 * @param {any}                         content          The current content to update. It can be <code>null</code> if this is an initial loading call.
	 * @param {sap.ui.vk.ContentResource[]} contentResources The content resources to load or update.
	 * @returns {sap.ui.vk.ContentManager} <code>this</code> to allow method chaining.
	 * @public
	 * @since 1.50.0
	 */
	ContentManager.prototype.loadContent = function(content, contentResources) {
		var that = this;
		var load = function() {
			that.fireContentChangesStarted();

			var nativeScene = new THREE.Scene(),
				scene = new Scene(nativeScene);

			that._loadContentResources(scene, contentResources).then(
				function(values) { // onFulfilled
					Log.info("Content loading resolved");
					if (values && values.length > 0 && values[0].initialView) {
						scene.setInitialView(values[0].initialView);
					}

					// add camera camera content
					for (var n = 0; n < values.length; n++) {
						if (values[n].camera) {
							// We grab camera from 1st resolved content which has camera
							scene.camera = values[n].camera;
							break;
						}
					}

					if (values.length > 0) {
						var value = values[0];
						scene.backgroundTopColor = value.backgroundTopColor; // hex color or undefined
						scene.backgroundBottomColor = value.backgroundBottomColor; // hex color or undefined
						scene.renderMode = value.renderMode; // sap.ui.vk.RenderMode or undefined
						scene.upAxis = value.upAxis; // (0 = +X, 1 = -X, 2 = +Y, 3 = -Y, 4 = +Z, 5 = -Z)
						scene.annotations = value.annotations;
					}

					// Add loader information to content to show who loaded it, if specified by the loader
					// This is useful if the loader is not something app writer registered.
					// For example, we need to do some extra stuff if the loader is content delivery service loader.
					for (var i = 0; i < values.length; i++) {
						if (values[i].loader) {
							scene.loaders = scene.loaders || [];
							scene.loaders.push(values[i].loader);
						}
						if (values[i].builder) {
							scene.builders = scene.builders || [];
							scene.builders.push(values[i].builder);
						}
					}

					if (scene.loaders) {
						that._initSceneWithCDSLoaderIfExists(scene, scene.loaders);
					}

					initLights(scene.getSceneRef(), false);

					that.fireContentChangesFinished({
						content: scene
					});
				},
				function(reason) { // onRejected
					Log.info("Content loading rejected:", reason);
					var errMsg;
					if (typeof reason === "string") {
						errMsg = reason;
					} else if (reason.errorText) {
						errMsg = reason.errorText;
					} else if (reason.message) {
						errMsg = reason.message;
					}
					errMsg = errMsg || getResourceBundle().getText(Messages.VIT37.summary);
					Log.error(getResourceBundle().getText("CONTENTMANAGER_MSG_CONTENTRESOURCESFAILEDTOLOAD"), errMsg);
					that.fireContentChangesFinished({
						content: null,
						failureReason: [
							{
								error: reason,
								errorMessage: errMsg
							}
						]
					});
				}
			);
		};

		load();

		return this;
	};

	ContentManager.prototype._findLoader = function(contentResource) {
		if (contentResource._contentManagerResolver
			&& contentResource._contentManagerResolver.settings
			&& contentResource._contentManagerResolver.settings.loader
		) {
			return Promise.resolve(contentResource._contentManagerResolver.settings.loader);
		}

		if (contentResource.getSource()) {
			// Try one of default loaders.
			var sourceType = contentResource.getSourceType().toLowerCase();

			var that = this;
			switch (sourceType) {
				case "stream": {
					if (this.defaultCdsLoader == null) {
						return new Promise(function(resolve) {
							var cdsModule = "sap/ui/vk/threejs/ContentDeliveryService";
							sap.ui.require([
								cdsModule
							], function(Class) {
								resolve(that.defaultCdsLoader = new Class({ authorizationHandler: that._authorizationHandler }));
							});
						});
					}
					return Promise.resolve(this.defaultCdsLoader);
				}
				case "vds4": {
					if (this.defaultMataiLoader == null) {
						return new Promise(function(resolve) {
							var mataiModule = "sap/ui/vk/matai/MataiLoader";
							sap.ui.require([
								mataiModule
							], function(Class) {
								resolve(that.defaultMataiLoader = new Class());
							});
						});
					}
					return Promise.resolve(this.defaultMataiLoader);
				}
				default:
					break;
			}
		}

		return Promise.resolve(null);
	};

	ContentManager.prototype._loadContentResources = function(scene, contentResources) {
		var promises = [];

		contentResources.forEach(function loadContentResource(parentNode, contentResource) {
			var node = new THREE.Group();
			node.name = contentResource.getName();
			node.sourceId = contentResource.getSourceId();
			contentResource._shadowContentResource = {
				nodeProxy: scene.getDefaultNodeHierarchy().createNodeProxy(node)
			};
			var localMatrix = contentResource.getLocalMatrix();
			if (localMatrix) {
				node.applyMatrix4(new THREE.Matrix4().fromArray(TransformationMatrix.convertTo4x4(localMatrix)));
			}
			parentNode.add(node);

			var that = this;
			promises.push(this._findLoader(contentResource).then(function(loader) {
				if (loader) {
					if (loader.attachContentChangesProgress) {
						loader.attachContentChangesProgress(that._handleContentChangesProgress, that);
					}
					if (loader.attachContentLoadingFinished) {
						loader.attachContentLoadingFinished(that._handleContentLoadingFinished, that);
					}
				}
				if (typeof loader === "function") {
					return loader(node, contentResource, that._authorizationHandler, that._retryCount);
				} else if (loader && loader.load) {
					return loader.load(node, contentResource, that._authorizationHandler, that._retryCount);
				} else {
					return Promise.resolve({
						node: node,
						contentResource: contentResource
					});
				}
			}));

			contentResource.getContentResources().forEach(loadContentResource.bind(this, node));
		}.bind(this, scene.getSceneRef()));

		return Promise.all(promises);
	};

	ContentManager.prototype._initSceneWithCDSLoaderIfExists = function(scene, loaders) {
		if (loaders) {
			var sceneBuilder;
			for (var i = 0; i < loaders.length; i++) {
				// if we find one, we return it as we can only have one CDS at the moment
				if (loaders[i] instanceof ContentDeliveryService) {
					sceneBuilder = loaders[i].getSceneBuilder();
					break;
				}
			}
			if (sceneBuilder) {
				scene.setSceneBuilder(sceneBuilder);

				// when things are removed from cds, we need to update the state
				// currently only author removes nodes and at TreeNode level.
				// If it is not tree node, we do nothing for now. We may have to revisit this.
				scene.getDefaultNodeHierarchy().attachNodeRemoving(function(event) {
					var removed = event.getParameter("nodeRef");
					if (removed.userData.treeNode && removed.userData.treeNode.sid) {
						// someone removed treeNode
						sceneBuilder.decrementResourceCountersForDeletedTreeNode(removed.userData.treeNode.sid);
					}
				});

				return true;
			}
		}
		return false;
	};

	/**
	 * Destroys the content.
	 *
	 * @function
	 * @name sap.ui.vk.threejs.ContentManager#destroyContent
	 * @param {any} content The content to destroy.
	 * @returns {sap.ui.vk.ContentManager} <code>this</code> to allow method chaining.
	 * @public
	 * @since 1.50.0
	 */
	ContentManager.prototype.destroyContent = function(content) {
		if (content) {
			content.destroy();
		}
		// we do not want the content (i.e Scene) to cleanup the SceneBuilder hence we do it here.
		// if the content was loaded by MataiLoader, it will have builders populated
		// if the content was loaded by TotaraLoader, it will have loaders populated with
		// only one element
		if (content.loaders && Array.isArray(content.loaders) && content.loaders.length > 0) {
			if (content.loaders[0]._loader && content.loaders[0]._loader.sceneBuilder) {
				content.loaders[0]._loader.removeContext(content.loaders[0]._loader.currentSceneInfo.id);
				content.loaders[0]._loader.sceneBuilder.cleanup();
			}

			if (content.loaders[0].detachContentChangesProgress) {
				content.loaders[0].detachContentChangesProgress(this._handleContentChangesProgress, this);
			}
			if (content.loaders[0].detachContentLoadingFinished) {
				content.loaders[0].detachContentLoadingFinished(this._handleContentLoadingFinished, this);
			}
		} else if (content.builders && Array.isArray(content.builders)) {
			content.builders.forEach(function(sb) {
				if (sb) {
					sb.cleanup();
				}
			});
		}
		return this;
	};

	/**
	 * Collects and destroys unused objects and resources.
	 *
	 * @function
	 * @name sap.ui.vk.threejs.ContentManager#collectGarbage
	 * @returns {sap.ui.vk.ContentManager} <code>this</code> to allow method chaining.
	 * @public
	 * @since 1.50.0
	 */

	/**
	 * Creates an Orthographic camera
	 *
	 * @returns {sap.ui.vk.OrthographicCamera} Created Camera.
	 * @public
	 * @since 1.52.0
	 */
	ContentManager.prototype.createOrthographicCamera = function() {
		return new OrthographicCamera();
	};

	/**
	 * Creates a Perspective camera
	 *
	 * @returns {sap.ui.vk.PerspectiveCamera} Created Camera.
	 * @public
	 * @since 1.52.0
	 */
	ContentManager.prototype.createPerspectiveCamera = function() {
		return new PerspectiveCamera();
	};

	return ContentManager;
});
