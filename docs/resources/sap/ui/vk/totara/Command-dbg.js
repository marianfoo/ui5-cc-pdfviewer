/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([], function() {
	"use strict";

	/**
	 * Streaming protocol commands.
	 *
	 * @enum {string}
	 * @readonly
	 * @alias sap.ui.vk.totara.Command
	 * @private
	 */
	var Command = {
		addClientLog: "addClientLog",
		getAnnotation: "getAnnotation",
		getDynamicView: "getDynamicView",
		getGeometry: "getGeometry",
		getHighlightStyle: "getHighlightStyle",
		getImage: "getImage",
		getImageDetails: "getImageDetails",
		getMaterial: "getMaterial",
		getMesh: "getMesh",
		getParametric: "getParametric",
		getGeomMesh: "getGeomMesh",
		getScene: "getScene",
		getSequence: "getSequence",
		getTrack: "getTrack",
		getTree: "getTree",
		getView: "getView",
		getViewAnimations: "getViewAnimations",
		getViewGroups: "getViewGroups",
		notifyError: "notifyError",
		notifyFinishedTree: "notifyFinishedTree",
		notifyFinishedView: "notifyFinishedView",
		requestScene: "requestScene",
		setAnnotation: "setAnnotation",
		setCamera: "setCamera",
		setGeometry: "setGeometry",
		setHighlightStyle: "setHighlightStyle",
		setImage: "setImage",
		setMaterial: "setMaterial",
		setMesh: "setMesh",
		setLineStyle: "setLineStyle",
		setFillStyle: "setFillStyle",
		setTextStyle: "setTextStyle",
		setParametric: "setParametric",
		setScene: "setScene",
		setPlayback: "setPlayback",
		setSequence: "setSequence",
		setStreamingToken: "setStreamingToken",
		setTrack: "setTrack",
		setTree: "setTree",
		setTreeNode: "setTreeNode",
		setView: "setView",
		setViewGroup: "setViewGroup",
		setViewNode: "setViewNode",
		timestamp: "timestamp",
		performanceTiming: "performanceTiming",
		suppressSendRequests: "suppressSendRequests",
		unsuppressSendRequests: "unsuppressSendRequests",
		setMaxActiveRequests: "setMaxActiveRequests"
	};

	return Command;
});
