sap.ui.define(["sap/ui/base/Object", "./AnnotationHelper",
		"sap/ui/model/odata/AnnotationHelper", "sap/ui/model/Context", "sap/base/util/each"
	],
	function(BaseObject, QCAnnotationHelper, ODataAnnoHelper, Context, each) {
		"use strict";


		/*eslint camelcase: [2, {properties: "never"}]*/
		var ODataModelHelper = BaseObject.extend("sap.suite.ui.generic.template.js.QuickTemplates.ODataModelHelper");

		ODataModelHelper.createKeyFromPath = function(sSourcePath, oTargetMetaModel, sTargetEntitySet) {

      try {
				var sourceKeyInfo = ODataModelHelper.parseEntityKeysFromContextPath(sSourcePath);
				var targetKeyInfo = ODataModelHelper.getKeyInfoForEntitySet(oTargetMetaModel, sTargetEntitySet);

				if (targetKeyInfo.entitySet === sourceKeyInfo.entitySet && sourceKeyInfo.keys.length === targetKeyInfo.keys.length) {
					if (sSourcePath.startsWith("/")) {
						return sSourcePath.substring(1);
					}

					return sSourcePath;
				}

				var retPath = "" + targetKeyInfo.entitySet + "(";

				each(targetKeyInfo.keys, function(i, targetKey) {

					// 1.) try exact name and type mapping
					if (!targetKey.mapped) {
						each(sourceKeyInfo.keys, function(j, sourceKey) {
							if (sourceKey.property === targetKey.property && sourceKey.type === targetKey.type) {
								targetKey.value = sourceKey.value;
								targetKey.mapped = true;
								return false;
							}
							return true;
						});
					}

					// 2.) try substring of name and exact type mapping
					if (!targetKey.mapped) {
						each(sourceKeyInfo.keys, function(j, sourceKey) {
							var sourceLower = sourceKey.property.toLowerCase();
							var targetLower = targetKey.property.toLowerCase();

							if (targetLower.indexOf(sourceLower) >= 0 && sourceKey.type === targetKey.type) {
								targetKey.value = sourceKey.value;
								targetKey.mapped = true;
								return false;
							}
							return true;
						});
					}

					// 3.) try exact name only
					if (!targetKey.mapped) {
						each(sourceKeyInfo.keys, function(j, sourceKey) {
							if (sourceKey.property === targetKey.property) {
								if (sourceKey.type === "Edm.String" && targetKey.type !== "Edm.String") {
									targetKey.value = sourceKey.value.substring(1, sourceKey.value.length - 1);
								} else if (sourceKey.type !== "Edm.String" && targetKey.type === "Edm.String") {
									targetKey.value = "'" + sourceKey.value + "'";
								} else {
									targetKey.value = sourceKey.value;
								}
								targetKey.mapped = true;
								return false;
							}
							return true;
						});
					}

					// 4.) try exact type only mapping
					if (!targetKey.mapped) {
						each(sourceKeyInfo.keys, function(j, sourceKey) {
							if (sourceKey.type === targetKey.type) {
								targetKey.value = sourceKey.value;
								targetKey.mapped = true;
								return false;
							}
							return true;
						});
					}

					retPath += targetKey.property + "=" + targetKey.value;

					if (i < targetKeyInfo.keys.length - 1) {
						retPath += ",";
					}


				});

				retPath += ")";

				return retPath;

			} catch (e) {
        if (sSourcePath && sSourcePath.startsWith("/")) {
          return sSourcePath.substring(1);
        }

        return sSourcePath;
			}
		};

		function isNumeric(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		}


		ODataModelHelper.parseEntityKeysFromContextPath = function(sPath) {
			var path = sPath;

			var ret = {
				entitySet: "",
				keys: []
			};

			if (!path) {
				return ret;
			}

			if (path.startsWith("/")) {
				path = path.substring(1);
			}
			var comps = path.split("(");
			if (comps.length > 1) {
				ret.entitySet = comps[0];

				var keyString = comps[1].split(")")[0];
				if (keyString) {
					var keyComps = keyString.split(",");
					each(keyComps, function(i, keyComp) {

						if (keyComp) {
							var fieldValue = keyComp.split("=");
							var key = {};
							if (fieldValue.length == 1) {
								key.value = fieldValue[0];
								key.property = "";
							} else if (fieldValue.length == 2) {
								key.property = fieldValue[0];
								key.value = fieldValue[1];
							}

							if (key.value) {
								if (key.value.indexOf("guid") == 0 && key.value.length == 42) {
									key.type = "Edm.Guid";
								} else if (key.value.charAt(0) === "'" && key.value.charAt(key.value.length - 1) === "'") {
									key.type = "Edm.String";
								} else if (key.value == "true" || key.value == "false") {
									key.type = "Edm.Boolean";
								} else if (isNumeric(key.value)) {
									key.type = "Edm.Int";
								} else {
									key.type = "";
								}
								ret.keys.push(key);
							}
						}
					});
				}
			}
			return ret;
		};

		ODataModelHelper.getKeyInfoForEntitySet = function(oMetaModel, sEntitySet) {

			var ret = {
				entitySet: "",
				keys: []
			};

			var keyNames = {};

			if (oMetaModel && sEntitySet) {
				var entitySetMeta = oMetaModel.getODataEntitySet(sEntitySet);
				ret.entitySet = entitySetMeta.name;
				var entityTypeMeta = oMetaModel.getODataEntityType(entitySetMeta.entityType);

				each(entityTypeMeta.key.propertyRef, function(i, propRef) {
					keyNames[propRef.name] = "1";
				});

				each(entityTypeMeta.property, function(i, prop) {
					if (keyNames[prop.name]) {
						var key = {
							property: prop.name,
							value: ODataModelHelper.getDefaultKeyValueForProperty(prop),
							type: (prop.type.indexOf("Edm.Int") >= 0 ? "Edm.Int" : prop.type)
						};

						ret.keys.push(key);
					}
				});

			}

			return ret;
		};

		ODataModelHelper.getDefaultKeyValueForProperty = function(oProperty) {

			if (oProperty.name.indexOf("IsActive") >= 0 && oProperty.type === "Edm.Boolean") {
				return "true";
			} else {
				switch (oProperty.type) {
					case "Edm.String":
						{
							return "''";
						}
					case "Edm.Guid":
						{
							return "guid'00000000-0000-0000-0000-000000000000'";
						}
					case "Edm.Boolean":
						{
							return "false";
						}
					default:
						{
							if (oProperty.type.indexOf("Int") >= 0) {
								return "0";
							}

							return "''";
						}
				}
			}
		};


		ODataModelHelper.initializeObjectProperties = function(oObjectContext, propertyPaths, createParams) {
			var targetObjects = [];
			var key = oObjectContext.getModel().getKey(oObjectContext.getObject());
			var oOrigObject = oObjectContext.getModel().oData[key];
			if (oOrigObject) {
				targetObjects.push(oOrigObject);
			}
			var oChangedObject = oObjectContext.getModel().mChangedEntities[key];
			if (oChangedObject) {
				targetObjects.push(oChangedObject);
			}
			var oContextMetaData = QCAnnotationHelper.getMetaDataForContext(oObjectContext);
			var i = 0;
			if (propertyPaths && Array.isArray(propertyPaths)) {
				each(propertyPaths, function(index, path) {
					var pathComps = path.split("/");
					var ownProperty = pathComps[0];
					var childPath = null;
					if (pathComps.length > 1) {
						childPath = pathComps.slice(1).join("/");
					}

					// if path component is a number, assume it is an index....just continue with next component
					if (isNumeric(ownProperty) && childPath) {
						ODataModelHelper.initializeObjectProperties(oObjectContext, [childPath], createParams);
						return;
					}

					i = 0;
					var isNavProp = false;
					if (oContextMetaData.entityType.navigationProperty) {
						for (; i < oContextMetaData.entityType.navigationProperty.length; i++) {
							if (oContextMetaData.entityType.navigationProperty[i].name === ownProperty) {
								isNavProp = true;
								break;
							}
						}
					}

					if (isNavProp && !oOrigObject[ownProperty]) {
						var createdContext = oObjectContext.getModel().createEntry(oObjectContext.getPath() + "/" + ownProperty, createParams);
						oOrigObject[ownProperty] = {
							__deferred: {}
						};
						ODataModelHelper.restoreNavigationPropertyReferences(oObjectContext, ownProperty, createdContext);
						if (childPath) {
							ODataModelHelper.initializeObjectProperties(createdContext, [childPath], createParams);
						}
					}
				});
			}

		};

		ODataModelHelper.restoreLineItemReferences = function(entityType, oContext) {
			var oInterface = QCAnnotationHelper.createFormatterInterface(oContext);

			var oMetaDataContext = QCAnnotationHelper.getMetaModelContextForFacetType(oInterface,
				entityType, "LineItem");

			if (oMetaDataContext) {
				var sChildPropertyPath = ODataAnnoHelper.getNavigationPath(oMetaDataContext);
				sChildPropertyPath = sChildPropertyPath.replace(/[{}]/g, '');
				ODataModelHelper.restoreNavigationPropertyReferences(oContext, sChildPropertyPath);
			}
		};

		ODataModelHelper.restoreNavigationPropertyReferences = function(oParentContext, navProp, oChildContext) {
			if (!navProp) {
				return;
			}


			if (!oParentContext.getObject()) {
				return;
			}

			var oMetaModel = oParentContext.getModel().getMetaModel();
			var sObjectKey = oParentContext.getModel().getKey(oParentContext.getObject());
			var oCurrentObject = oParentContext.getModel().oData[sObjectKey];
			var oEntityTypeMeta = oMetaModel.getODataEntityType(oCurrentObject.__metadata.type);


			var oNavPropAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityTypeMeta, navProp);

			var sNavPropEntitySetName = null;
			var oEntitySets = oMetaModel.getProperty(oMetaModel.getODataEntityContainer(oNavPropAssociationEnd.type)).entitySet;
			each(oEntitySets, function(i, eSet) {
				if (eSet.entityType === oNavPropAssociationEnd.type) {
					sNavPropEntitySetName = eSet.name;
				}
			});

			if (!oCurrentObject[navProp]) {
				oCurrentObject[navProp] = {};
			}
			if (oCurrentObject[navProp].__list) {
				oCurrentObject[navProp].__list = [];
			}


			var addChildEntity = function(key) {
				if (oCurrentObject[navProp].__deferred) {
					delete oCurrentObject[navProp].__deferred;
				}
				if (oNavPropAssociationEnd.multiplicity === "*") {
					if (!oCurrentObject[navProp].__list) {
						oCurrentObject[navProp].__list = [];
					}
					oCurrentObject[navProp].__list.push(key);
				} else {
					oCurrentObject[navProp].__ref = key;
				}
			};

			if (!oChildContext) {
				var modelKeys = Object.keys(oParentContext.getModel().oData);
				each(modelKeys, function(i, key) {
					if (key.indexOf(sNavPropEntitySetName) >= 0) {
						addChildEntity(key);
					}
				});
			} else {
				var key = oChildContext.getPath().substring(1);
				addChildEntity(key);
			}

		};

		ODataModelHelper.findObjects = function() {
			var parentObj, obj, params;
			if (arguments.length === 3) {
				parentObj = arguments[0];
				obj = arguments[1];
				params = arguments[2];
			} else if (arguments.length == 2) {
				obj = arguments[0];
				params = arguments[1];
			}

			var key = params.key || undefined,
				fnMatchCallBack = params.matchCallback || undefined,
				fnNonMatchCallback = params.noMatchCallback || undefined,
				maxNestedLevel = params.maxNestedLevel || 3;

			var doRecursion = true;

			if (!maxNestedLevel) {
				maxNestedLevel = 3;
			}

			if (!ODataModelHelper.findObjects._recursionCount) {
				ODataModelHelper.findObjects._recursionCount = 0;
			}
			ODataModelHelper.findObjects._recursionCount++;

			if (ODataModelHelper.findObjects._recursionCount > maxNestedLevel) {
				ODataModelHelper.findObjects._recursionCount--;
				return;
			}

			var isObject = function(o) {
				var s = Object.prototype.toString.call(o);
				return (s === '[object Array]' || s === '[object Object]');
			};
			var hasOwn = Object.prototype.hasOwnProperty.bind(obj);

			if (obj) {
				for (var i in obj) {
					if (hasOwn(i)) {

						var bIsObject = isObject(obj[i]);
						if (obj[i] && bIsObject) {
							obj[i].__nestedKey = i;
						}
						doRecursion = true;
						if (i === key && fnMatchCallBack) {
							doRecursion = fnMatchCallBack(parentObj, obj, obj[i]);
						} else if (fnNonMatchCallback) {
							doRecursion = fnNonMatchCallback(parentObj, obj, obj[i]);
						}
						if (doRecursion && bIsObject) {
							ODataModelHelper.findObjects(obj, obj[i], {
								key: key,
								matchCallback: fnMatchCallBack,
								noMatchCallback: fnNonMatchCallback,
								maxNestedLevel: maxNestedLevel
							});
						}
						if (obj[i] && bIsObject) {
							delete obj[i].__nestedKey;
						}
					}
				}
			}

			ODataModelHelper.findObjects._recursionCount--;
		};

		return ODataModelHelper;

	}, true);
