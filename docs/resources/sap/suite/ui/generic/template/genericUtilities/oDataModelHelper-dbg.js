sap.ui.define([], function() {
		"use strict";

	// A canonical path is split into an object containing two (string) properties: 'entitySet' and 'key'
	function fnSplitCanonicalPath(sPath){
		if (sPath.indexOf("/") === 0){
			sPath = sPath.substring(1); // remove leading "/" is present
		}
		var aPath = sPath.split("(");
		var sEntitySet = aPath.shift(); // entity set is the first component without leading "/"
		var sRest = aPath.join("("); // concatenate the rest again in case it has contained additional (s
		var sKey = sRest.substring(0, sRest.length - 1); // remove the closing )
		return {
			entitySet: sEntitySet,
			key: sKey,
			canonicalPath: "/" + sPath
		};
	}

	// For a given context path this returns some information about it.
	// Up to now result has same format as fnSplitCanonicalPath	
	function fnAnalyseContextPath(sPath, oModel){
		if (sPath.lastIndexOf("/") !== 0){ // might be a deep path
			var oMetaModel = oModel.getMetaModel();
			sPath = oMetaModel.oMetadata._calculateCanonicalPath(sPath);  // temporary use of private UI5 function
			if (!sPath){
				return {};
			}
		}
		return fnSplitCanonicalPath(sPath);		
	}
	
	// For a given instance of sap.ui.model.Context this returns some information about it.
	// Information is same as given by fnAnalyseContextPath
	function fnAnalyseContext(oContext){
		return fnAnalyseContextPath(oContext.getPath(), oContext.getModel());
	}

	return {
		splitCanonicalPath: fnSplitCanonicalPath,
		analyseContextPath: fnAnalyseContextPath,
		analyseContext: fnAnalyseContext
	};
});