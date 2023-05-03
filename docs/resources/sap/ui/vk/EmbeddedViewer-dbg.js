/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

/* global URLSearchParams, location */

sap.ui.define([
	"./Viewer",
	"./ContentResource"
], function(
	Viewer,
	ContentResource
) {
	"use strict";

	sap.ui.getCore().attachInit(function() {
		var sp = new URLSearchParams(location.search);
		new Viewer({
			toolbarTitle: sp.get("title"),
			showSceneTree: false,
			contentResources: [
				new ContentResource({
					sourceType: sp.get("sourceType"),
					source: sp.get("source"),
					veid: sp.get("veid")
				})
			]
		}).placeAt("content");
	});
});
