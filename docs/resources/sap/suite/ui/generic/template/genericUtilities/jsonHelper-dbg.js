sap.ui.define([], function() {
		"use strict";
	
	var sVersionPropertyName = "sap.suite.ui.generic.template.genericUtils.jsonHelper.versionInfo";
	
	// Helper function for getStringifiable which adds replacement infos for a subtree
	// vObject is a nested subobject of the original object and aPath is the property path that has taken us to vObject
	// aReplaces is the array which accumulates the replace operations
	function fnAccumulateReplaceInfo(vObject, aReplaces, aPath){
		// Following cases need to be considered:
		// 1. vObject is undefined -> create a replacement for undefined and we are done
		// 2. vObject is an instance of Date -> create a replacement for the Date and we are done
		// 3. vObject is any other object -> recursively check the properties of vObject for replacements
		// 4. vObject is neither an object nor undefined -> vObject does not create any need for replacements
		if (typeof vObject !== "object"){ // case 1 or 4
			if (vObject === undefined){ // case 1
				aReplaces.push({
					type: "undefined",
					path: aPath
				});				
			}
			return;
		}
		if (vObject instanceof Date){ // case 2
			var oReplacement = {
				type: "Date",
				milliseconds: vObject.getTime(),
				path: aPath
			};
			// Edge case: Even instances of Date may have properties. These will not be serialized by JSON.stringify.
			// -> In order to be able to restore the properties of vObject they need to be stored within oReplacement, too.
			//    This is done by adding the representation provided by getStringifiable(), since this can be restored most easily.
			//    Thus a map: <property name> -> getStringifiable(<property value>) is created and added to oReplacement (in case it is not empty) as property 'childProps'.
			var oChildProps = Object.create(null);
			for (var sProperty in vObject){
				oChildProps[sProperty] = getStringifiable(vObject[sProperty]);
				oReplacement.childProps = oChildProps; // Note that this is only effective when being called the first time
			}
			aReplaces.push(oReplacement);
			return;
		}
		// case 3
		for (var sProperty in vObject){
			var vPart = vObject[sProperty];
			var aPathToProperty = aPath.concat(sProperty);
			fnAccumulateReplaceInfo(vPart, aReplaces, aPathToProperty);
		}
	}
	
	/*
	* This function is intended to work together with function fnDeStringify (see below).
	* The usage of these two functions allow to serialize/deserialize java script object containing instances of Date and undefined values without data loss.
	* To achieve this goal the functions should be used together with the standard serialization/deseriazation methods JSON.stringify/parse.
	* Note that when using those standard functions there might be a data loss if the object to be serialized contains instances of Date or properties which have value undefined.
	* In order to achieve this the following mimic should be used:
	* Before serializing a given java script object vObject1 pass it to this function.
	* The returned value will be an object vObject2 which might be identical to vObject1 or have a pointer to vObject1 (so do not modify vObject1 or one of its components before the next step).
	* Now serialize vObject2 via JSON.stringify or any other service which internally uses a logic similar to JSON.stringify.
	* When you want to obtain again a deserialized version of your object, take the serialized version you have received and deserialize it with JSON.parse resp. any other service which inverts the serialization applied beforehand.
	* This will provide another javascript object vObject3.
	* Pass vObject3 to fnDeStringify and receive another object vObject4.
	* vObject4 will be a cloned version of vObject1.
	* The following remarks apply:
	* - Any other restriction of the serialization/deserialization process implemented by JSON.stringify/parse still apply. In particular function objects will get lost by this process and trying to serialize a circular structure may fail.
	* - In order to be as robust as possible against a process which has missed to apply the getStringifiable function on the object to be serialized (meaning vObject2 will be taken as vObject1 in the description above) the following additional rules apply:
	*   # vObject2 will only differ from vObject1 if it contains (possibly nested) an object of type Date or an undefined value or it mimics to be a result of getStringifiable itself.
	*   # fnDeStringify will handle all kinds of objects. If the object passed to it cannot be identified as being a result of a process as described above it will simply return the instance passed to it
	* - The last step may perform changes on vObject3. vObject4 might be identical to vObject3 or have a reference to one of its components. Therefore, it is recommended to skip any reference to vObject3 after vObject4 has been obtained.
	*/
	function getStringifiable(vObject){
		if (vObject !== undefined && (!vObject || typeof vObject !== "object")){ // in all these cases JSON.stringify/parse does the job
			return vObject;
		}
		// In aReplaces we accumulate all necessary replacement operations that need to be applied in fnDeStringify.
		// Each entry contains properties:
		// - type: describes the type of replacement to be done (current values are 'Date' and 'undefined')
		// - path: an array of strings that describes how to step down to the property where the replacement needs to be done
		// - additional properties might be used depending on the replacement type
		var aReplaces = []; 
		fnAccumulateReplaceInfo(vObject, aReplaces, []);
		if (aReplaces.length === 0 && !vObject[sVersionPropertyName]){ // if no replacement is necessary the current object could still be an object that mimics to be a result of getStringifiable itself. Otherwise we can use the object itself.
			return vObject;
		}
		var oRet = { // If a replacement is necessary we put together the object itself and the replacement information
			data: vObject,
			replaces: aReplaces
		};
		oRet[sVersionPropertyName] = 1; // mark oRet as an object that is created by getStringifiable
		return oRet;
	}
	
	// See documentation of getStringifiable
	function fnDeStringify(vObject){
		if (!vObject || typeof vObject !== "object" || vObject[sVersionPropertyName] !== 1 || !Array.isArray(vObject.replaces)){
			return vObject; // in these cases either vObject is not a result of getStringifiable() or it is an object for which getStringifiable() acts as identity function
		}
		var aReplacers = []; // build an array of functions that execute the necessary replacements on vObject
		var oRootReplacement; // The replacement for vObject itself (if it exists)
		var bError = vObject.replaces.some(function(oReplaceInfo){ // bError will be true if any memeber of vObject.replaces proves that vObject is not "a valid vObject3" (see above)
			if (typeof oReplaceInfo !== "object" || !Array.isArray(oReplaceInfo.path)){
				return true; // oReplaceInfo is not a valid replacement description
			}
			if (oReplaceInfo.path.length === 0){ // oReplaceInfo defines a replacement for vObject itself -> vObject either represents undefined or a Date
				oRootReplacement = oReplaceInfo;
				return vObject.replaces.length > 1; // if vObject is either udefined or a Date there should be no other replacement info
			}
			var fnReplacer; // a function that executes the replacements defined by oReplaceInfo
			var vCurrent = vObject.data; // current position in vObject-data while navigating according to the path specified by oReplaceInfo.path
			var bRet = oReplaceInfo.path.some(function(sProp, i){ // navigate down in vObject.data. bRet will indicate whether something was found that indicates the oReplaceInfo is not valid 
				if (typeof vCurrent !== "object" || typeof sProp !== "string"){ // vCurrent should be an object that possesses a property with name sProp
					return true;
				}
				if (i === oReplaceInfo.path.length - 1){ // do not step down the last step in hierarchy, since we want to do a replacement for that property
					switch (oReplaceInfo.type){
						case "undefined":
							if (vCurrent.hasOwnProperty(sProp)){ // oReplaceInfo states that this property has value undefined -> JSON.stringify will have ignored it
								return true; // In case the property is there anyway oReplaceInfo cannot be valid (for vObject.data)
							}
							// looks ok -> Create a function that sets the property to undefined in vCurrent
							fnReplacer = function(){
								vCurrent[sProp] = undefined;
							};
							return false;
						case "Date":
							if (Number.isInteger(oReplaceInfo.milliseconds)){ // Check whether oReplaceInfo is really a replacement info for a Date
								var dReplace = new Date(oReplaceInfo.milliseconds); // This is the Date which should be put at vCurrent[sProp]
								if (JSON.stringify(dReplace) !== '"' + vCurrent[sProp] + '"'){
									return true; // dReplace and the current value do not fit to each other
								}							
								if (oReplaceInfo.childProps && typeof oReplaceInfo.childProps !== "object"){
									return true; // The childProps property is there but does not have the expected structure 
								}
								fnReplacer = function(){
									if (oReplaceInfo.childProps){
										for (var sChildProp in oReplaceInfo.childProps){
											dReplace[sChildProp] = fnDeStringify(oReplaceInfo.childProps[sChildProp]);
										}
									}
									vCurrent[sProp] = dReplace;
								};								
								return false; // everything looks fine -> a replacer implementing the defined replacement could be created
							}
							return true; // oReplaceInfo cannot be a valid replacement for a Date
						default: return true; // unknown type of ReplacementInfo
					}
				}
				// in any othe step then the last just move down the hierarchy
				vCurrent = vCurrent[sProp];
			});
			aReplacers.push(fnReplacer); // add the created replacer function to the list (might be undefined if bRet is true, but then it will be ignored anyway)
			return bRet;
		});
		if (bError){ // if vObject is not valid for vObject3, return it unchanged according to the contract 
			return vObject;
		}
		if (oRootReplacement){ // there is just one replacement info and that applies to the root itself -> The instance to be created is either undefined or a Date
			if (oRootReplacement.type === "undefined"){
				return undefined;
			} else if (oRootReplacement.type === "Date" && Number.isInteger(oRootReplacement.milliseconds)){
				var dRet = new Date(oRootReplacement.milliseconds); // the Date object to be returned
				if (JSON.stringify(dRet) === '"' + vObject.data + '"'){ // If dRet is consistent with the string representation expected in vObject.data
					if (oRootReplacement.childProps){ // if there are child properties to be added
						if (typeof oRootReplacement.childProps !== "object"){ // that would not be a valid childProps -> oRootReplacement would not be valid
							return vObject;
						}
						// add the properties to dRet as defined in oRootReplacement.childProps
						for (var sChildProp in oRootReplacement.childProps){
							dRet[sChildProp] = fnDeStringify(oRootReplacement.childProps[sChildProp]);
						}						
					}					
					return dRet; // return the Date which was created as decribed in oRootReplacement
				}
			}
			return vObject; // oRootReplacement is not a valid replacement
		}
		// vObject.data is the right object, but it needs to be adjusted by calling the collected replacers
		aReplacers.forEach(function(fnReplace){
			fnReplace();
		});
		// return the adjusted instance
		return vObject.data;
	}

	var oJsonHelper =  {
		getStringifiable: getStringifiable,
		deStringify: fnDeStringify
	};
	
	return oJsonHelper;
});