/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/model/odata/v2/ODataModel"],function(e){var r={};function t(r){var t=r.filterService;var a=t&&t.uri;var n=t&&t.settings;var i=[];if(n){n.annotations.forEach(function(e){var t=r[e];var a=t.uri;i.push(a)});if(n.odataVersion==="2.0"){return new e(a,{annotationURI:i,loadAnnotationsJoined:true})}}}function a(e){var a=e.filterService.uri;var n=t(e);r[a]={oData:n,loaded:undefined};return new Promise(function(e){if(n){n.attachMetadataLoaded(function(t){return t.getSource().getMetaModel().loaded().then(function(){r[a].loaded=true;e(r[a])})});n.attachMetadataFailed(function(){r[a].loaded=false;e(r[a])})}else{e(r[a])}})}function n(e){if(e.filterService&&e.filterService.uri){var t=e.filterService.uri;if(r[t]){return Promise.resolve(r[t])}else{return a(e)}}else{return Promise.resolve(undefined)}}return{getOdataModel:n}});
//# sourceMappingURL=oDataModelProvider.js.map