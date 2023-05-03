sap.ui.define(["sap/suite/ui/generic/template/lib/StableIdDefinition", 	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function(StableIdDefinition, FeLogger) {
	"use strict";
	var oLogger = new FeLogger("js.StableIdHelper").getLogger();

	function handleError(sMessage){
		/* currently, just write message to log
		 * usually called with return handleError() to interrupt further processing
		 * for stable ids, return undefined is the best compatible way (actually does not create a stable
		 * id, but lets UI5 create a non-stable id - better than creating something non-stable, that UI5
		 * would assume to be stable)
		 * In future (when error handling for helpers is available), this could be the place to throw an error
		 */
		oLogger.error("Error determining stable id: " + sMessage);
		return undefined;
	}

	function preparePathForStableId(oContext){
		var aParameter = oContext.getProperty("/stableId/aParameter");
		var oParameter = {
			buildStableId: function(oInput){
				oParameter.id = getStableId(oInput);
				}
			};
		aParameter.push(oParameter);
		return "/stableId/aParameter/" + (aParameter.length - 1);
	}

	function replaceSpecialCharsForLegacyIds(sLegacyId){
		return sLegacyId && sLegacyId.replace(/@/g, "").replace(/[\/#]/g, "::");
	}

	function getLegacyStableId(oParameters){
		// optional and mandatory parameters can be treated identical - value function has to differetiate
		if (typeof StableIdDefinition.types[oParameters.type][oParameters.subType].value !== "function"){
			return StableIdDefinition.types[oParameters.type][oParameters.subType].value;
		} else {
			var aMandatoryParameters = StableIdDefinition.types[oParameters.type][oParameters.subType].parameters || [];
			var aOptionalParameters = StableIdDefinition.types[oParameters.type][oParameters.subType].optionalParameters || [];
			var aAllParameters = aMandatoryParameters.concat(aOptionalParameters);
			var oValueFunctionParams = {};
			StableIdDefinition.parameters.forEach(function(sParameter){
				if (aAllParameters.indexOf(sParameter) > -1 ) {
					oValueFunctionParams[sParameter] = oParameters[sParameter];
				}
			});
			return replaceSpecialCharsForLegacyIds(StableIdDefinition.types[oParameters.type][oParameters.subType].value(oValueFunctionParams));
		}
	}

	function escapeIdParameter(sParam){
		/* escape all characters not allowed in stable ids with :<hexcode>
		 * as we use : as escape character, also escape :
		 * Only 16 bit characters ("Base Multilingual Plane") expected in parameters for stable ids - no handling of "supplementary characters".   
		 */
		return sParam.replace(/[^A-Za-z0-9_.-]/g, function(c){
			var sCode = c.charCodeAt(0).toString(16);
			// error handling for supplementary characters (length > 2) could be added
			return ":" + (sCode.length === 1 ? "0" : "") + sCode;
		});
	}

	function getStableId(oParameters){
		if (!oParameters.type) {return handleError("No type provided");}
		if (!oParameters.subType) {return handleError("No subType provided");}
		if (!StableIdDefinition.types[oParameters.type]) {return handleError("Invalid type provided");}
		if (!StableIdDefinition.types[oParameters.type][oParameters.subType]) {return handleError("Invalid subType provided");}
		// check mandatory parameters
		if ((StableIdDefinition.types[oParameters.type][oParameters.subType].parameters || []).some(function(sParameter){
			return !oParameters[sParameter] && !handleError("No value for parameter " + sParameter + " provided (mandatory for type " + oParameters.type + "/Subtype " +  oParameters.subType + ")");
		})){
			return undefined;
		}
		// build legacy stable id
		if (StableIdDefinition.types[oParameters.type][oParameters.subType].value){
			// value function for legacy id can return undefined, in that case go on with standard id creation 
			try {
				var sLegacyId = getLegacyStableId(oParameters);
				if (sLegacyId) {
					return sLegacyId;
				}
			} catch (oError){
				return undefined;
			}
		}
		// build standard stable id
		var sStableId = "template:::" + oParameters.type + ":::" + oParameters.subType;
		// add parameters - order is defined according to oStableIdDefinition.parameters
		var aMandatoryParameters = StableIdDefinition.types[oParameters.type][oParameters.subType].parameters || [];
		var aOptionalParameters = StableIdDefinition.types[oParameters.type][oParameters.subType].optionalParameters || [];
		var aAllParameters = aMandatoryParameters.concat(aOptionalParameters);
		StableIdDefinition.parameters.forEach(function(sParameter){
			if (aAllParameters.indexOf(sParameter) > -1 && oParameters[sParameter]){
				sStableId += ":::" + sParameter + "::" + escapeIdParameter(oParameters[sParameter]);
			}
		});
		return sStableId;
	}

	return {
		preparePathForStableId: preparePathForStableId,
		getStableId: getStableId
	};
}, /* bExport= */ true);
