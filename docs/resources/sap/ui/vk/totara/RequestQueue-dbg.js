/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"./TotaraUtils",
	"./Command",
	"../IncludeUsageIdType",
	"sap/base/Log"
], function(
	TotaraUtils,
	Command,
	IncludeUsageIdType,
	Log
) {
	"use strict";

	function ResourceQueue(getBatchSize) {
		this.getBatchSize = getBatchSize;
		this.globalList = new Set();
		this.requestedList = [];
		// When fetchBatch is called it deletes the item from requestedList but keeps it in the waitingList
		// However, we need the requestData to figure out whether the request is part of the initialView
		// (determined by the isInitial property)
		// So, we make waitingList a map with id as key and requestData as val
		this.waitingList = new Map();
	}

	ResourceQueue.prototype.push = function(id, requestData) {
		if (!this.globalList.has(id)) {
			this.globalList.add(id);
			this.requestedList.push(requestData || id);
			this.waitingList.set(id, requestData);
		}
	};

	ResourceQueue.prototype.setBatchSizeInfo = function(batchSizeInfo) {
		this.batchSizeInfo = batchSizeInfo;
	};

	ResourceQueue.prototype.fetchBatch = function() {
		var batchSize = this.getBatchSize ? this.getBatchSize : 1;
		if (typeof this.getBatchSize === "function") {
			batchSize = this.getBatchSize();
		}
		var batchStringLength = 0;
		var batch = [];
		for (var i = 0; i < batchSize && this.requestedList.length > 0; i++) {
			var reqData = this.requestedList.pop();
			var id = reqData.id ? reqData.id : reqData;
			batchStringLength += id.toString().length + (i == 0 || !this.batchSizeInfo ? 0 : this.batchSizeInfo.separatorLength);
			if (this.batchSizeInfo && batchStringLength > this.batchSizeInfo.maxBatchStringLength) {
				this.requestedList.push(id);
				break;
			}
			batch.push(id);
		}
		return batch;
	};

	ResourceQueue.prototype.pop = function(id) {
		var index = this.requestedList.indexOf(id);
		if (index > -1) {
			this.requestedList.splice(index, 1);
		}
		return this.waitingList.delete(id);
	};

	ResourceQueue.prototype.isReady = function(id) {
		return this.globalList.has(id) && !this.waitingList.has(id);
	};

	ResourceQueue.prototype.clear = function(id) {
		this.globalList.clear();
		this.requestedList = [];
		this.waitingList.clear();
	};

	ResourceQueue.prototype.isEmpty = function() {
		return this.requestedList.length === 0;
	};

	ResourceQueue.prototype.isWaiting = function() {
		return this.waitingList.size > 0;
	};

	ResourceQueue.prototype.isInitialViewCompleted = function() {
		var initialRequests = this.requestedList.filter(function(li) {
			return li.isInitial;
		});

		var initialWaitingRequests = [];
		this.waitingList.forEach(function(val, key) {
			if (val && val.isInitial) {
				initialWaitingRequests.push(key);
			}
		});

		return (initialRequests.length === 0 && initialWaitingRequests.length === 0);
	};

	function PriorityResourceQueue(getBatchSize, getMaxBatchDataSize) {
		ResourceQueue.call(this, getBatchSize);
		this.getMaxBatchDataSize = getMaxBatchDataSize;
		this.priorityMap = new Map();
	}

	PriorityResourceQueue.prototype = Object.create(ResourceQueue.prototype);

	PriorityResourceQueue.prototype.constructor = PriorityResourceQueue;

	PriorityResourceQueue.prototype.push = function(id, priority, size, requestData) {
		if (!this.globalList.has(id)) {
			size = size || 1;
			// console.log("push", id, priority, size);
			this.globalList.add(id);
			this.requestedList.push(requestData || id);
			this.waitingList.set(id, requestData);
			this.priorityMap.set(id, { p: priority, s: size });
		}
	};

	PriorityResourceQueue.prototype.clear = function() {
		ResourceQueue.prototype.clear.call(this);
		this.priorityMap.clear();
	};

	PriorityResourceQueue.prototype.setBatchSizeInfo = function(batchSizeInfo) {
		this.batchSizeInfo = batchSizeInfo;
	};

	PriorityResourceQueue.prototype.fetchBatch = function() {
		var priorityMap = this.priorityMap;
		this.requestedList.sort(function(a, b) {
			return priorityMap.get(a.id ? a.id : a).p - priorityMap.get(b.id ? b.id : b).p;
		});

		var batch = [];
		var size = 0;
		var batchSize = this.getBatchSize ? this.getBatchSize() : 1;
		var batchStringLength = 0;
		var maxBatchDataSize = this.getMaxBatchDataSize ? this.getMaxBatchDataSize() : 1024 * 1024;
		var minBatchDataSize = maxBatchDataSize >> 1;
		for (var i = 0; i < batchSize && this.requestedList.length > 0; i++) {
			var reqData = this.requestedList.pop();
			var id = reqData.id ? reqData.id : reqData;
			batchStringLength += id.toString().length + (i == 0 || !this.batchSizeInfo ? 0 : this.batchSizeInfo.separatorLength);
			var resSize = priorityMap.get(id).s;
			if (this.batchSizeInfo && batchStringLength > this.batchSizeInfo.maxBatchStringLength || size > minBatchDataSize && size + resSize > maxBatchDataSize) {
				this.requestedList.push(id);
				break;
			}

			// console.log("id", id, "size", resSize, "priority", priorityMap.get(id).p);
			size += resSize;
			priorityMap.delete(id);
			batch.push(id);
		}
		// console.log(size, batch);
		return batch;
	};



	var RequestQueue = function(context, sceneId) {
		this.context = context; // SceneContext
		this.sceneId = sceneId;
		this.token = context.token || TotaraUtils.generateToken();
		var loader = context.loader;
		this.meshes = new ResourceQueue(loader.getMeshesBatchSize.bind(loader));
		this.materials = new ResourceQueue(loader.getMaterialsBatchSize.bind(loader));
		this.textures = new ResourceQueue();
		this.geometries = new PriorityResourceQueue(loader.getGeometriesBatchSize.bind(loader), loader.getGeometriesMaxBatchDataSize.bind(loader));
		this.geomMeshes = new PriorityResourceQueue(loader.getGeomMeshesBatchSize.bind(loader), loader.getGeomMeshesMaxBatchDataSize.bind(loader));
		this.annotations = new ResourceQueue(loader.getAnnotationsBatchSize.bind(loader));
		this.parametric = new ResourceQueue(loader.getParametricsBatchSize.bind(loader));
		this.views = new ResourceQueue();
		this.thumbnails = new ResourceQueue();
		this.tracks = new ResourceQueue(loader.getTracksBatchSize.bind(loader));
		this.sequences = new ResourceQueue(loader.getSequencesBatchSize.bind(loader));
		this.highlights = new ResourceQueue();
	};

	RequestQueue.prototype.isEmpty = function() {
		return this.meshes.isEmpty()
			&& this.annotations.isEmpty()
			&& this.parametric.isEmpty()
			&& this.materials.isEmpty()
			&& this.textures.isEmpty()
			&& this.geometries.isEmpty()
			&& this.geomMeshes.isEmpty()
			&& this.views.isEmpty()
			&& this.thumbnails.isEmpty()
			&& this.tracks.isEmpty()
			&& this.sequences.isEmpty()
			&& this.highlights.isEmpty();
	};

	RequestQueue.prototype.isWaitingForContent = function() {
		return this.meshes.isWaiting()
			|| this.textures.isWaiting()
			|| this.materials.isWaiting()
			|| this.geometries.isWaiting()
			|| this.geomMeshes.isWaiting()
			|| this.annotations.isWaiting()
			|| this.parametric.isWaiting()
			|| this.views.isWaiting()
			|| this.thumbnails.isWaiting()
			|| this.tracks.isWaiting()
			|| this.sequences.isWaiting()
			|| this.highlights.isWaiting();
	};

	RequestQueue.prototype.clearContent = function() {
		this.meshes.clear();
		this.annotations.clear();
		this.parametric.clear();
		this.materials.clear();
		this.textures.clear();
		this.geometries.clear();
		this.geomMeshes.clear();
		this.views.clear();
		this.thumbnails.clear();
		this.tracks.clear();
		this.sequences.clear();
		this.highlights.clear();
	};

	RequestQueue.prototype.createGetContentCommand = function(commandName, ids, extraOptions) {
		var options = {
			sceneId: this.sceneId,
			ids: ids.map(function(id) { return parseInt(id, 10); }),
			token: this.token
		};
		return TotaraUtils.createRequestCommand(commandName, extraOptions ? Object.assign(options, extraOptions) : options);
	};

	RequestQueue.prototype.generateRequestCommand = function() {
		var ids;
		var command = null;
		if (!this.meshes.isEmpty()) {
			// TODO: delete this branch.
			ids = this.meshes.fetchBatch();
			throw new Error("Command " + Command.getMesh + " is not implemented");
		} else if (!this.annotations.isEmpty()) {
			ids = this.annotations.fetchBatch();
			command = {
				method: Command.getAnnotation,
				parameters: {
					sceneId: this.sceneId,
					annotationIds: ids
				}
			};
		} else if (!this.parametric.isEmpty()) {
			// TODO: delete this branch.
			ids = this.parametric.fetchBatch();
			throw new Error("Command " + Command.getParametric + " is not implemented");
		} else if (!this.materials.isEmpty()) {
			ids = this.materials.fetchBatch();
			command = {
				method: Command.getMaterial,
				parameters: {
					sceneId: this.sceneId,
					materialIds: ids
				}
			};
		} else if (!this.geometries.isEmpty()) {
			// TODO: delete this branch.
			ids = this.geometries.fetchBatch();
			throw new Error("Command " + Command.getGeometry + " is not implemented");
		} else if (!this.geomMeshes.isEmpty()) {
			ids = this.geomMeshes.fetchBatch();
			var geomMeshIds = ids.map(function(i) { return (i.id ? i.id : i); });
			command = this.createGetContentCommand(Command.getGeomMesh, geomMeshIds);
			command.sceneId = this.sceneId;
			command.meshIds = geomMeshIds;
		} else if (!this.textures.isEmpty()) {
			ids = this.textures.requestedList.splice(0, 1);
			Log.info("Requesting texture: " + ids[0].imageId);
			command = this.createGetContentCommand(Command.getImage, [ids[0].imageId]);
			command.sceneId = this.sceneId;
			command = Object.assign(command, ids[0]);
		} else if (!this.sequences.isEmpty()) {
			// TODO: delete this branch.
			ids = this.sequences.fetchBatch();
			throw new Error("Command " + Command.getSequence + " is not implemented");
		} else if (!this.tracks.isEmpty()) {
			// TODO: delete this branch.
			ids = this.tracks.fetchBatch();
			throw new Error("Command " + Command.getTrack + " is not implemented");
		} else if (!this.views.isEmpty()) {
			ids = this.views.requestedList.splice(0, 1);

			command = {
				method: Command.getView,
				parameters: {
					sceneId: this.sceneId,
					viewId: ids[0].viewId,
					query: TotaraUtils.configureSceneViewQuery(this.context)
				}
			};
		} else if (!this.highlights.isEmpty()) {
			// TODO: delete this branch.
			ids = this.highlights.requestedList.splice(0, 1);
			throw new Error("Command " + Command.getHighlightStyle + " is not implemented");
		} else if (!this.thumbnails.isEmpty()) {
			ids = this.thumbnails.requestedList.splice(0, 1);
			command = this.createGetContentCommand(Command.getImage, [ids[0].imageId]);
			command.sceneId = this.sceneId;
			command = Object.assign(command, ids[0]);
		}

		return command;
	};

	return RequestQueue;
});
