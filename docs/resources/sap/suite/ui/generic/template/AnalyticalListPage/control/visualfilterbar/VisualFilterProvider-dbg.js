// -----------------------------------------------------------------------------
// Generates the data-model required for SmartFilter using SAP-Annotations metadata
// -----------------------------------------------------------------------------
sap.ui.define([
	"sap/ui/comp/odata/MetadataAnalyser",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function(MetadataAnalyser, FilterUtil, V4Terms, FeLogger) {
	"use strict";
	var oFeLogger = new FeLogger("AnalyticalListPage.control.visualfilterbar.VisualFilterProvider");
	var oLogger = oFeLogger.getLogger();
	var oLevel = oFeLogger.Level;

	var VisualFilterProvider = function(filter) {
		oLogger.setLevel(oLevel.WARNING, "VisualFilter");

		this._filter = filter;
		this._oMetadataAnalyser = new MetadataAnalyser(filter.getModel());

		this._groupList = [];
		this._groupListByName = {};
		this._groupMap = {};
		this._measureList = [];
		this._measureMap = {};
		this._dimensionMap = {};
		this._selectionFieldsLength = 0;
		this._selectionFieldsParsed = 0;
		this._annotationData = {Filters: []};
		//this._allSelectionFields;

		this._initMetadata();
	};

	VisualFilterProvider.prototype._initMetadata = function() {
		var entitySet = this._filter.getEntitySet();
		var entityNameFull = this._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(entitySet);

		this._getFieldAnnotations(entitySet, entityNameFull);

		this._getVisualFilterAnnotation(entityNameFull);
	};

	VisualFilterProvider.prototype.getVisualFilterConfig = function() {
		return JSON.parse(JSON.stringify(this._filterConfig));
	};

	VisualFilterProvider.prototype.getMetadataAnalyser = function() {
		return this._oMetadataAnalyser;
	};

	// Group Related
	VisualFilterProvider.prototype._getFieldAnnotations = function(entitySet, entityNameFull) {
		if (!entitySet) {
			return;
		}

		var entityType = this._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(entitySet);
		if (!entityType) {
			return;
		}

		var model = this._filter.getModel();
		var metaModel = model.getMetaModel();
		if (!entityNameFull || !metaModel) {
			return;
		}

		// Go through the field group list and build up the group map
		var groupMapByField = {};
		var groupByName = {};

		var fieldGroupList = this._oMetadataAnalyser.getFieldGroupAnnotation(entityType);
		for (var i = 0; i < fieldGroupList.length; i++) {
			var fieldGroup = fieldGroupList[i];

			var group = {
				name: fieldGroup.groupName,
				label: fieldGroup.groupLabel,
				fieldList: fieldGroup.fields
			};

			groupByName[group.name] = group;

			for (var j = 0; j < fieldGroup.fields.length; j++) {
				groupMapByField[fieldGroup.fields[j]] = group;
			}
		}


		// Get all the selection fields, if selected and not part of a group, then in the _BASIC group
		var entityDef = metaModel.getODataEntityType(entityNameFull);
		var selFieldList = entityDef[V4Terms.SelectionFields];
		var selFieldMap = {};
		if (selFieldList) {
			for (var i = 0; i < selFieldList.length; i++) {
				var selField = selFieldList[i];
				selFieldMap[selField.PropertyPath] = selField;
			}
		}

		// Go through all the fields, check if they are dimensions or measures and add them to the groups for later sorting
		var usedGroupsByName = {};
		//var entityTypeName = this._oMetadataAnalyser.removeNamespace(entityType);
		var fieldList = this._oMetadataAnalyser.getFieldsByEntityTypeName(entityType);
		for (var i = 0; i < fieldList.length; i++) {
			var field = fieldList[i];
			var name = field.name;

			var prop = metaModel.getODataProperty(entityDef, name);
			var role = prop["sap:aggregation-role"];

			if (role == "dimension") { // only add dimensions to the possible groups
				var dim = { // Dimension definition
					name: name,
					fieldInfo: field,
					propInfo: prop
				};

				// Add to group for ordering purposes, e.g. in the dialog and display order in the filterbar
				var group = groupMapByField[name];

				if (group) {
					// if the field is stored as a string, replace it with the dim structure
					for (var j = 0; j < group.fieldList.length; j++) {
						if (group.fieldList[j] == name) {
							group.fieldList[j] = dim;
							break;
						}
					}
				} else {
					var sLabel = entityDef[V4Terms.Label] ? entityDef[V4Terms.Label].String : undefined;
					var groupName = selFieldMap[name] ? "_BASIC" : (entityDef[sLabel] || entityDef.name); // _BASIC is the standard used by the smart filter bar

					var group = groupByName[groupName];
					if (!group) { // if no group, then either use the _BASIC (if field in the selection list) or fallback EntityType.
						group = {
							name: groupName,
							label: groupName == "_BASIC" ? this._filter.getModel("i18n").getResourceBundle().getText("VIS_FILTER_GRP_BASIC_TITLE") : groupName,
							fieldList: []
						};

						groupByName[groupName] = group;
					}

					group.fieldList.push(dim);
					groupMapByField[name] = group;
				}

				usedGroupsByName[group.name] = true;
			}
		}

		// Reorder the fields by the group list
		var groupList = [];
		if (usedGroupsByName["_BASIC"]) { // Make sure _BASIC is always first
			groupList.push(groupByName["_BASIC"]);
			delete groupByName["_BASIC"];
		}

		// Preferred order based on group list  Will need to check once getting group information from annotation
		for (var i = 0; i < fieldGroupList.length; i++) {
			var groupName = fieldGroupList[i].groupName;

			if (groupName == "_BASIC") {// already accounted for
				continue;
			}

			if (usedGroupsByName[groupName]) {
				groupList.push(groupByName[groupName]);
			}

			delete groupByName[groupName];
		}

		// Now add the remaining, e.g. the entity type
		for (var groupName in groupByName) {
			if (usedGroupsByName[groupName]) {
				groupList.push(groupByName[groupName]);
			}

			delete groupByName[groupName];
		}

		// Rebuild the group by name based on the used groupNames
		groupByName = {};
		for (var i = 0; i < groupList.length; i++) {
			var group = groupList[i];
			groupByName[group.name] = group;
		}
	};

	VisualFilterProvider.prototype.getGroupList = function() {
		return this._groupList ? this._groupList : [];
	};

	VisualFilterProvider.prototype.getGroupMap = function() {
		return this._groupMap ? this._groupMap : {};
	};

	VisualFilterProvider.prototype.getMeasureMap = function() {
		return this._measureMap;
	};

	VisualFilterProvider.prototype.getDimensionMap = function() {
		return this._dimensionMap;
	};

	VisualFilterProvider.prototype.getEntityType = function(entitySet) {
		return this._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(entitySet);
	};

	VisualFilterProvider.prototype._updateGroupList = function(entityFullName, entityTypePath, parentProperty, dimension) {
		var isPartOfSelectionFields = function (element) {
			return element.PropertyPath === parentProperty;
		};
		var isPartOfSelectionField;
		//when SelectionFields has no property under it in annotations, 'this._allSelectionFields' is undefined.
		if (this._allSelectionFields) {
			isPartOfSelectionField = this._allSelectionFields.filter(isPartOfSelectionFields);
		}
		isPartOfSelectionField = (isPartOfSelectionField && isPartOfSelectionField.length) ? true : false;

		var metaModel = this._filter.getModel().getMetaModel();
		var mainEntityType = metaModel.getODataEntityType(entityFullName);
		mainEntityType = mainEntityType[V4Terms.Label] ? mainEntityType[V4Terms.Label].String : mainEntityType.name;

		var updateGroup = function (groupName, context) {
			for (var key in context._groupList) {
				var group = context._groupList[key],
					dimExistsInGroup = false;

				if (group.name === groupName) {
					var fieldList = group.fieldList;
					for (var fieldKey in fieldList) {
						if (fieldList[fieldKey].name === dimension) {
							dimExistsInGroup = true;
						} else {
							continue;
						}
					}

					if (!dimExistsInGroup) {

						var entityType = metaModel.getODataEntityType(entityTypePath);
						var allProps = context._oMetadataAnalyser.getFieldsByEntityTypeName(entityTypePath);

						for (var key in allProps) {

							if (allProps[key].name === dimension) {
								var prop = metaModel.getODataProperty(entityType, allProps[key].name);

								fieldList.push({ // Dimension definition
									name: allProps[key].name,
									fieldInfo: allProps[key],
									propInfo: prop
								});
								//dimMap[allProps[key].name] = dim;
								//dimMap[allProps[key].name] = dim;
							}
						}

						/*fieldList.push({
							name: dimension
						});*/
					}
				} else {
					continue;
				}
			}
		};

		// TODO: need to take care of field group
		if (isPartOfSelectionField) {
			updateGroup('_BASIC', this);
		} else {
			updateGroup(mainEntityType, this);
		}

	};

	VisualFilterProvider.prototype._createDimensionMap = function(entitySet, entityTypePath) {
		var allProps,
			model = this._filter.getModel(),
			metaModel = model.getMetaModel(),
			entityType,
			dimMap = {},
			prop,
			dim,
			measure,
			measureMap = {};
		if (!metaModel) {
			return false;
		}
		entityType = metaModel.getODataEntityType(entityTypePath);
		allProps = this._oMetadataAnalyser.getFieldsByEntityTypeName(entityTypePath);
		if (!this._dimensionMap[entitySet] || !this._measureMap[entitySet]) {
			for (var key in allProps) {
				var oDataProperty = allProps[key];
				prop = metaModel.getODataProperty(entityType, oDataProperty.name);
				if (oDataProperty['aggregationRole'] === 'dimension') {
					dim = { // Dimension definition
						name: oDataProperty.name,
						fieldInfo: oDataProperty,
						propInfo: prop
					};
					dimMap[oDataProperty.name] = dim;
				} else if (oDataProperty['aggregationRole'] === 'measure') {
					measure = {
						name: oDataProperty.name,
						label: oDataProperty.fieldLabel,
						fieldInfo: oDataProperty,
						propInfo: prop
					};
					measureMap[oDataProperty.name] = measure;
				}
			}
			if (Object.keys(dimMap).length) {
				this._dimensionMap[entitySet] = dimMap;
			}
			if (Object.keys(measureMap).length) {
				this._measureMap[entitySet] = measureMap;
			}
		}
	};

	VisualFilterProvider.prototype._createGroupList = function(fieldInfo, propInfo, isBasic, sGroupName) {

		var groupLabel;
		// if property is part of seelction fields then it should be in BASIC group
		if (isBasic) {
			groupLabel = this._filter.getModel("i18n").getResourceBundle().getText("VIS_FILTER_GRP_BASIC_TITLE");
			this._addToGroupListByName('_BASIC', groupLabel, fieldInfo, propInfo);
		} else {
			//if property is part of a field group or entity type
			groupLabel = fieldInfo.groupTitle;
			this._addToGroupListByName(sGroupName, groupLabel, fieldInfo, propInfo);
		}

	};

	VisualFilterProvider.prototype._addToGroupListByName = function (groupName, groupLabel, fieldInfo, propInfo) {
		if (this._groupListByName[groupName] === undefined) {
			this._groupListByName[groupName] = [];
			this._groupListByName[groupName].push({
				name: groupName,
				label: groupLabel,//
				fieldList: []
			});
			var sName = fieldInfo.name;
			if (fieldInfo.isParameter) {
				sName = "$Parameter." + sName;
			}
			this._groupListByName[groupName][0].fieldList.push({
				name: sName,
				fieldInfo: fieldInfo,
				propInfo: propInfo
			});
		} else {
			this._groupListByName[groupName][0].fieldList.push({
				name: fieldInfo.name,
				fieldInfo: fieldInfo,
				propInfo: propInfo
			});
		}
	};

	/**
	 * @private
	 * This function sets the field groups to be displayed in the visual filter dialog
	 * @param  {string} sEntityGroupName - entity type name
	 * @return {void}
	 */
	VisualFilterProvider.prototype._setGroupListForDialog = function() {
		// check if any groups exists or not
		//removed the check for BASIC as the order of groups is maintained in the
		//array returned by getFilterBarViewMetadata()
		if (Object.keys(this._groupListByName).length) {
			for (var key in this._groupListByName) {
				this._groupList.push(this._groupListByName[key][0]);
			}
		}
		var groupByName = {};
		for (var i = 0; i < this._groupList.length; i++) {
			var group = this._groupList[i];
			groupByName[group.name] = group;
		}
		this._groupMap = groupByName;
	};

	/**@private
	 *This function is to obtain scale factor from annotations
	 *@param  {object} oEntityType  entity object
	 *@param  {string} sAnnotationPath  Annotation path containing scale factor
	 *@return {string} [scale factor value]
	 */

	VisualFilterProvider.prototype._getScaleFactor = function(oEntityType,sAnnotationPath){
		if (!sAnnotationPath) {
			return "";
		}
		//check if property has a Data point defined in annotation
		if (sAnnotationPath.indexOf("com.sap.vocabularies.UI.v1.DataPoint") > -1) {
			sAnnotationPath =  sAnnotationPath.toString();
			if (sAnnotationPath.charAt(0) === "@"){
				sAnnotationPath = sAnnotationPath.slice(1);
			}
			var oElem = oEntityType[sAnnotationPath];
			if (oElem && oElem.ValueFormat && oElem.ValueFormat.ScaleFactor) {
				return FilterUtil.getPathOrPrimitiveValue(oElem.ValueFormat.ScaleFactor);
			} else {
				return "";
			}
		}
	};

	/**@private
	 *This function is to obtain scale factor from annotations
	 *@param  {object} oEntityType  entity object
	 *@param  {string} sAnnotationPath  Annotation path containing scale factor
	 *@return {string} [scale factor value]
	 */

	VisualFilterProvider.prototype._getNumberOfFractionalDigits = function(oEntityType,sAnnotationPath){
		if (!sAnnotationPath) {
			return "";
		}
		//check if property has a Data point defined in annotation
		if (sAnnotationPath.indexOf("com.sap.vocabularies.UI.v1.DataPoint") > -1) {
			sAnnotationPath =  sAnnotationPath.toString();
			if (sAnnotationPath.charAt(0) === "@"){
				sAnnotationPath = sAnnotationPath.slice(1);
			}
			var oElem = oEntityType[sAnnotationPath];
			//return oElem.ValueFormat.ScaleFactor.Decimal;
			if (oElem && oElem.ValueFormat && oElem.ValueFormat.NumberOfFractionalDigits) {
				return FilterUtil.getPathOrPrimitiveValue(oElem.ValueFormat.NumberOfFractionalDigits);
			} else {
				return "";
			}
		}
	};

	/**
	 * @private
	 * This function read the filter annotation for visual filter and set the filter configuration
	 * @param  {string} sEntityNameFull full name of the entity
	 * @return {void}
	 */
	VisualFilterProvider.prototype._getVisualFilterAnnotation = function(sEntityNameFull) {
		var model = this._filter.getModel();
		var metaModel = model.getMetaModel();
		if (!sEntityNameFull || !metaModel) {
			return null;
		}
		var entityType = metaModel.getODataEntityType(sEntityNameFull);
		if (!entityType) {
			return null;
		}
		this._allSelectionFields = entityType[V4Terms.SelectionFields];
		////USING getFilterBarViewMetadata() to read the filter annotation for visual filter and set the filter configuration
		var allGroups = this._filter._smartFilterContext.getFilterBarViewMetadata(true),
			isFilterable, filterRestriction, isMandatory, sGroupName, isRequired, valueList, currentPropName, isSelected, isDropDown, aFields = [],
			fieldInfo, propInfo, displayBehaviour, isParameter;

		var aParameters = this._filter._smartFilterContext.getAnalyticalParameters();
		var iLen = aParameters.length;
		for (var i = 0; i < iLen; i++) {
			var oField = aParameters[i];
			var oGroup = {};
			oGroup.fields = [];
			oGroup.fields.push(oField);
			allGroups.unshift(oGroup);
		}

		for (var oGroup in allGroups) {
			aFields = allGroups[oGroup].fields;
			sGroupName = allGroups[oGroup].groupName;
			for (var oProperty in aFields) {
				isFilterable = aFields[oProperty].filterable;
				filterRestriction = aFields[oProperty].filterRestriction;
				isDropDown = aFields[oProperty].hasFixedValues === true;
				displayBehaviour = aFields[oProperty].displayBehaviour; // Property Level Text Arrangement
				//sap:filter-restriction : undefined (default = "multi-value"), filterRestriction = "auto"
				//sap:filter-restriction : "multi-value", filterRestriction = "multiple"
				//sap:filter-restriction: "single-value", filterRestriction = "single"
				//sap:filter-restriction: "interval", filterRestriction = "interval"
				if (filterRestriction === "auto") {
					filterRestriction = "multiple";
				}
				if (filterRestriction !== "interval" && isFilterable !== "false") {
					fieldInfo = aFields[oProperty];
					var bIsFieldHidden = (fieldInfo[V4Terms.Hidden] && fieldInfo[V4Terms.Hidden].Bool === "true") || (fieldInfo[V4Terms.HiddenFilter] && fieldInfo[V4Terms.HiddenFilter].Bool === "true");
					isParameter = aFields[oProperty].isParameter;
					currentPropName = aFields[oProperty].fieldName;
					isMandatory = aFields[oProperty].isMandatory;
					isRequired = aFields[oProperty].requiredFilterField;
					for (var propertyFields in aFields[oProperty]) {
						//checking if property has valuelist annotation defined along with a PV
						if (propertyFields.indexOf(V4Terms.ValueList) > -1 && aFields[oProperty][propertyFields].PresentationVariantQualifier) {
							if (bIsFieldHidden) {
								oLogger.warning("The dimension " + currentPropName + " is set to UI.Hidden in the collection " + fieldInfo.groupEntitySet + ". Corresponding chart cannot be displayed as VisualFilter.");
								break;
							}
							isSelected = (sGroupName === "_BASIC") || isMandatory || isRequired;
							propInfo = metaModel.getODataProperty(entityType, currentPropName);
							valueList = aFields[oProperty][propertyFields];
							this._createGroupList(fieldInfo, propInfo, isSelected, sGroupName);
							this._getAnnotationFromValueList(sEntityNameFull, isSelected, valueList, currentPropName, filterRestriction, isDropDown, isMandatory, displayBehaviour, isParameter);
						}
					}
				}
			}
		}
		this._setGroupListForDialog();
		this._filterConfig = this._getConfig(this._annotationData);
	};
	/* 	Success Callback for valueList promise
		Checks if valueList and presentationVariantQaulifier exists
		then and only then add chart to the config
	*/
	VisualFilterProvider.prototype._getAnnotationFromValueList = function (entityFullName, isSelected, valueListProperties, parentProperty, filterRestriction, isDropDown, bIsMandatoryProp, displayBehaviour, isParameter) {
		var sPath = entityFullName;
		if (valueListProperties !== undefined) {
			//valueListProperties = valueListProperties[""] ? valueListProperties[""] : undefined;

			var annotationData = {Filters: []}, selectionVariantObject,
				presentationVariantQualifierString = FilterUtil.readProperty(valueListProperties,"PresentationVariantQualifier.String"),
				selectionVariantQualifierString = FilterUtil.readProperty(valueListProperties,"SelectionVariantQualifier.String"),
				collectionPath = FilterUtil.readProperty(valueListProperties,"CollectionPath"),
				parameters = FilterUtil.readProperty(valueListProperties,"Parameters"),
				collectionPathString = FilterUtil.readProperty(collectionPath,"String"),
				sPath = this.getEntityType(collectionPathString),
				model = this._filter.getModel(),
				metaModel = model.getMetaModel(),
				entityTypeCollectionPath = metaModel.getODataEntityType(sPath);

			if (selectionVariantQualifierString) {
				var selectionVariantAnnotation = this._oMetadataAnalyser.getSelectionVariantAnnotationList(sPath);
				selectionVariantObject = this._getFiltersAndParamsFromSV(selectionVariantAnnotation, selectionVariantQualifierString);
			}

			if (presentationVariantQualifierString) {
				var sQualifier = presentationVariantQualifierString,
					presentationVariantAnnotation = this._oMetadataAnalyser.getPresentationVariantAnnotation(sPath, sQualifier),
					annotationObject = {},
					dimension = FilterUtil.readProperty(presentationVariantAnnotation, "chartAnnotation.annotation.Dimensions.0.PropertyPath");
				if (dimension) {
					this._createDimensionMap(collectionPath.String, sPath);
					this._updateGroupList(entityFullName, sPath, parentProperty, dimension);

					// if display behaviour is undefined
					// get textArrangement from Entity Set
					if (!displayBehaviour) {
						var sEntityTextArragement = this._oMetadataAnalyser.getTextArrangementValue(entityFullName);
						if (isDropDown) {
							displayBehaviour = sEntityTextArragement ? sEntityTextArragement : sap.ui.comp.smartfilterbar.DisplayBehaviour.descriptionOnly;
						} else {
							displayBehaviour = sEntityTextArragement ? sEntityTextArragement : sap.ui.comp.smartfilterbar.DisplayBehaviour.descriptionAndId;
						}

					}
					// TODO: Saurabh, below function acts as a parser bewteen here and  _getConfig()
					// maybe change logic in _getConfig() to parse presentationVariant Object and form config
					// Needs to be done
					annotationObject = this._createConsumeableObjectFromAnnotation(presentationVariantAnnotation, collectionPath, isSelected, parameters, parentProperty, filterRestriction, isDropDown, bIsMandatoryProp, displayBehaviour, entityTypeCollectionPath, selectionVariantObject, isParameter);
					if (annotationObject) {
						annotationData.Filters.push(annotationObject);
						this._annotationData.Filters.push(annotationObject);
					}
				}
			}
		}
	};
	/**
	 * @private
	 * This function creates a default Sort Order for the charts, when sort order is not given in the annotations
	 * For Bar/Donut - Default sort order is measure descending
	 * For Line - 	If dimension field is DateTime, default sort order is dimension descending
	 * 				If dimension field is non DateTime, default sort order is dimension ascending
	 * @param  {string} sChartType chart type
	 * @param  {string} sMeasure Measure of the chart
	 * @param  {string} sDimension Dimension of the chart
	 * @param  {boolean} bDimensionIsDateTime whether field is date time or not
	 * @return {object} SortOrder object with property Field and Descending
	 */
	VisualFilterProvider.prototype._createSortObject = function(sChartType, sMeasure, sDimension, bDimensionIsDateTime) {
		var sSortOrderProperty = sMeasure,
		bSortOrderDescending = true;
		if (sChartType === "Line") {
			sSortOrderProperty = sDimension;
			if (!bDimensionIsDateTime) {
				// if type of dimension is not date time
				// then sort order is ascending, else it is descending
				bSortOrderDescending = false;
			}
		}
		//To include Field and Descending  Property to sortOrder
		var oSortObject = {};
		oSortObject.Field = {
			"String" : sSortOrderProperty
		};
		oSortObject.Descending = {
			"Boolean" : bSortOrderDescending
		};
		return oSortObject;
	};
	/**
	 * @private
	 * This function returns annotationObject with a new property SortOrder
	 * @param  {object} oPresentationVariantAnnotation  PresentationVariantAnnotation from annotation
	 * @param  {string} sMeasure Measure of the chart
	 * @param  {string} sDimension Dimension of the chart
	 * @param  {string} sChartType chart type
	 * @param  {object} oAnnotationObject objec to be modified
	 * @param  {boolean} bDimensionIsDateTime whether field is date time or not
	 * @return {object} returns annotationObject with property SortOrder
	*/
	VisualFilterProvider.prototype._createSortOrderFromAnnotation = function(oPresentationVariantAnnotation, sMeasure, sDimension, sChartType, oAnnotationObject, bDimensionIsDateTime) {
		/*
		* As per requirements
		* Bar/Donut - Should sort on measure descending, unless order is provided in annotaions
		* Line (time based) - Should always sort on dimension descending (Display should be ascending), sort order in annotations should be ignored in this case
		* Line (non-time based) - Should sort on dimension ascending, unless order is provide in annotations
		*/

		oAnnotationObject.SortOrder = [];
		var aSortOrderFields = oPresentationVariantAnnotation.annotation.SortOrder,
		bSortOrderDescending,
		sSortOrderProperty;
		// if annotation has sort order
		if (aSortOrderFields !== undefined && aSortOrderFields.length) {
			for (var i = 0; i < aSortOrderFields.length; i++) {
				var sSortOrderField = FilterUtil.readProperty(aSortOrderFields, i + ".Property.PropertyPath"),
				sIsDescending = FilterUtil.readProperty(aSortOrderFields, i + ".Descending.Bool");
				if (sSortOrderField && sIsDescending) {
					if (sChartType === "Line") {
						if (!bDimensionIsDateTime) {
							// if chart is line and dimension is not time based
							// then sort should be on dimension and order should be taken from annotations
							// sort order for line chart with time based dimension is defaulted to dimension descending later
							// via _createSortObject
							if (sSortOrderField === sDimension) {
								sSortOrderProperty = sDimension;
								bSortOrderDescending = !(sIsDescending === "false");
								break;
							}
						}
					} else if (sSortOrderField === sMeasure) {
						// if chart is not line it should always sort on measure
						// and order should be taken from annotations
						sSortOrderProperty = sMeasure;
						bSortOrderDescending = !(sIsDescending === "false");
						break;
					}
				}
			}
			// if sort order property is defined then only add sort
			// else default sort order
			if (sSortOrderProperty) {
				var oSortObject = {};
				oSortObject.Field = {
					"String": sSortOrderProperty
				};
				oSortObject.Descending = {
					"Boolean" : bSortOrderDescending
				};
				oAnnotationObject.SortOrder.push(oSortObject);
			}
		}
		// if sort order is not defined in annotations
		// or sort order is defined in annotations but chart sort order could not be determined
		// or Chart is line and dimension is time based (in this case only descending sort makes sense)
		// then sort order should be defaulted
		if (!oAnnotationObject.SortOrder.length) {
			oAnnotationObject.SortOrder.push(this._createSortObject(sChartType, sMeasure, sDimension, bDimensionIsDateTime));
		}

		return oAnnotationObject;
	};
	/**
	*Function returns the chart Qualifier
	*params {presentationVariantAnnotation} Presentation Variant Annottaion object
	*return {sAnnotationPath} String value of the chart Qualifier
	*/
	VisualFilterProvider.prototype._getChartQualifier = function(presentationVariantAnnotation) {
		var aVisualizations = presentationVariantAnnotation.annotation.Visualizations, sAnnotationPath;
		sAnnotationPath = aVisualizations ? (aVisualizations[0].AnnotationPath).substring(1) : undefined;
		return sAnnotationPath;
	};
	/**
	*Function to check if dimension is date time or not
	*params {string} Entity set of the property
	*params {string} dimension in the entity set
	*return {sAnnotationPath} String value of the chart Qualifier
	*/
	VisualFilterProvider.prototype._IsDimensionDateTime = function(sEntitySet, sDimension) {
		var oDimensionMap = this.getDimensionMap(),
		oDimensionFieldInfo = FilterUtil.readProperty(oDimensionMap, sEntitySet + "." + sDimension + ".fieldInfo"),
		bDimensionIsDateTime = false,
		sFieldSemantics;

		if (oDimensionFieldInfo.type === "Edm.DateTime" || oDimensionFieldInfo.type === "Edm.Time") {
			bDimensionIsDateTime = true;
		} else {
			// check V4 and V2. If V2 is present then it is directly converted to V4
			sFieldSemantics = oDimensionFieldInfo[V4Terms.CalendarYear] || oDimensionFieldInfo[V4Terms.CalendarYearMonth] || oDimensionFieldInfo[V4Terms.CalendarYearMonthDay]
								|| oDimensionFieldInfo[V4Terms.CalendarYearWeek] || oDimensionFieldInfo[V4Terms.CalendarYearQuarter] || oDimensionFieldInfo[V4Terms.FiscalYear]
								|| oDimensionFieldInfo[V4Terms.FiscalYearPeriod];
			if (sFieldSemantics && sFieldSemantics.Bool && sFieldSemantics.Bool === "true") {
				bDimensionIsDateTime = true;
			}
		}
		return bDimensionIsDateTime;
	};
	/**
	*Function to check if dimension is of type Edm.DateTimeOffset
	*params {string} Entity set of the property
	*params {string} dimension in the entity set
	*return {boolean} true if field is of type Edm.DateTimeOffset, false otherwise
	*/
	VisualFilterProvider.prototype._IsDimensionDateTimeOffset = function(sEntitySet, sDimension) {
		var oDimensionMap = this.getDimensionMap(),
		oDimensionFieldInfo = FilterUtil.readProperty(oDimensionMap, sEntitySet + "." + sDimension + ".fieldInfo"),
		bDimensionIsDateTimeOffset = false;
		if (oDimensionFieldInfo.type === "Edm.DateTimeOffset") {
			bDimensionIsDateTimeOffset = true;
		}
		return bDimensionIsDateTimeOffset;
	};
	/**
	*Function to check if dimension is date is Edm.String and sap:semantics="yearmonthday" or "yearmonth" or "year"
	*params {string} Entity set of the property
	*params {string} dimension in the entity set
	*return {boolean} returns "yearmonthday" if date is Edm.String and sap:semantics="yearmonthday"
						or "yearmonth" if date is Edm.String and sap:semantics="yearmonth"
						or "year" if date is Edm.String and sap:semantics="year"
	*/
	VisualFilterProvider.prototype._isDimensionDateFilterStringType = function(sEntitySet, sDimension) {
		var oDimensionMap = this.getDimensionMap(),
		oDimensionFieldInfo = oDimensionMap && FilterUtil.readProperty(oDimensionMap, sEntitySet + "." + sDimension + ".fieldInfo"),
		sDimensionIsDateStringType = "";

		if (oDimensionFieldInfo && oDimensionFieldInfo.type === "Edm.String") {
			var sFieldSemantics = oDimensionFieldInfo && oDimensionFieldInfo[V4Terms.CalendarYearMonthDay];
			if (sFieldSemantics && sFieldSemantics.Bool && sFieldSemantics.Bool === "true") {
				sDimensionIsDateStringType = "yearmonthday";
				return sDimensionIsDateStringType;
			}
			sFieldSemantics = oDimensionFieldInfo && oDimensionFieldInfo[V4Terms.CalendarYearMonth];
			if (sFieldSemantics && sFieldSemantics.Bool && sFieldSemantics.Bool === "true") {
				sDimensionIsDateStringType = "yearmonth";
				return sDimensionIsDateStringType;
			}
			sFieldSemantics = oDimensionFieldInfo && oDimensionFieldInfo[V4Terms.CalendarYearWeek];
			if (sFieldSemantics && sFieldSemantics.Bool && sFieldSemantics.Bool === "true") {
				sDimensionIsDateStringType = "yearweek";
				return sDimensionIsDateStringType;
			}
			sFieldSemantics = oDimensionFieldInfo && oDimensionFieldInfo[V4Terms.CalendarYearQuarter];
			if (sFieldSemantics && sFieldSemantics.Bool && sFieldSemantics.Bool === "true") {
				sDimensionIsDateStringType = "yearquarter";
				return sDimensionIsDateStringType;
			}
			sFieldSemantics = oDimensionFieldInfo && oDimensionFieldInfo[V4Terms.CalendarYear] || oDimensionFieldInfo[V4Terms.FiscalYear];
			if (sFieldSemantics && sFieldSemantics.Bool && sFieldSemantics.Bool === "true") {
				sDimensionIsDateStringType = "year";
				return sDimensionIsDateStringType;
			}
			sFieldSemantics = oDimensionFieldInfo && oDimensionFieldInfo[V4Terms.FiscalYearPeriod];
			if (sFieldSemantics && sFieldSemantics.Bool && sFieldSemantics.Bool === "true") {
				sDimensionIsDateStringType = "fiscalyearperiod";
				return sDimensionIsDateStringType;
			}
		}
		return sDimensionIsDateStringType;
	};
	/*
		Function to parse new annotation format
		and create object similar to experimental annotation so that it can be consumed here.
		TODO: It would be good to change logic in _getConfig() to parse the presentationVariantAnnotation object
		and form the config.
	*/
	VisualFilterProvider.prototype._createConsumeableObjectFromAnnotation = function (presentationVariantAnnotation, collectionPath, isSelected, parameters, parentProperty, filterRestriction, isDropDown, bIsMandatoryProp, displayBehaviour, entityType, selectionVariant, isParameter) {
		//commenting the unused variables due to the eslint issue
		//	var annotationData = {Filters: []};
		//	var allMeasureFields = presentationVariantAnnotation.chartAnnotation.mesaureFields;
		//	var allDimensionFields = presentationVariantAnnotation.chartAnnotation.dimensionFields;
		var annotationObject = {},
		sEntitySet = this._oMetadataAnalyser.getEntitySetNameFromEntityTypeName(this.getEntityType(collectionPath.String)),
		// TODO: Saurabh check if there is a chart then proceed
		parts = presentationVariantAnnotation.chartAnnotation.annotation.ChartType.EnumMember.split("/"),
		chartType = parts[parts.length - 1],
		bDimensionIsDateTime, bDimensionIsDateStringType, bDimensionIsDateTimeOffset = false;

		if (chartType) {
			annotationObject.Type = {
				"String": chartType
			};
		}

		// assuming there will be only one dimension
		var dimension = FilterUtil.readProperty(presentationVariantAnnotation, "chartAnnotation.annotation.Dimensions.0.PropertyPath");

		// assuming there will be only one measure
		var measure = FilterUtil.readProperty(presentationVariantAnnotation, "chartAnnotation.annotation.Measures.0.PropertyPath");

		//check for valid dimension and measure
		var bIsValid = this._isValidDimensionandMeasure(sEntitySet, dimension, measure);
		if (!bIsValid) {
			return bIsValid;
		}

		bDimensionIsDateTime = this._IsDimensionDateTime(sEntitySet, dimension);
		if (bDimensionIsDateTime) {
			bDimensionIsDateStringType = this._isDimensionDateFilterStringType(sEntitySet, dimension);
			annotationObject.stringdate = bDimensionIsDateStringType;
		} else {
			bDimensionIsDateTimeOffset = this._IsDimensionDateTimeOffset(sEntitySet, dimension);
		}
		annotationObject.dimensionFieldIsDateTime = bDimensionIsDateTime;
		annotationObject.dimensionFieldIsDateTimeOffset = bDimensionIsDateTimeOffset;
		//To add the new propert SortOrder in annotationObject
		annotationObject = this._createSortOrderFromAnnotation(presentationVariantAnnotation, measure, dimension, chartType, annotationObject, bDimensionIsDateTime);

		var sDataPoint = "";
		if (presentationVariantAnnotation.chartAnnotation.measureAttributes[measure]) {
			sDataPoint = presentationVariantAnnotation.chartAnnotation.measureAttributes[measure].dataPoint;
		}

		var scaleFactor = this._getScaleFactor(entityType, sDataPoint);
		var numberOfFractionalDigits = this._getNumberOfFractionalDigits(entityType, sDataPoint);
		var chartQualifier = this._getChartQualifier(presentationVariantAnnotation);

		annotationObject.scaleFactor = {
			"String": scaleFactor
		};
		annotationObject.numberOfFractionalDigits = {
			"String": numberOfFractionalDigits
		};
		annotationObject.chartQualifier = chartQualifier;
		//adding filterRestiction property to annotationObject
		if (filterRestriction){
			annotationObject.filterRestriction = {
			"String" : filterRestriction
			};
		} else {
			annotationObject.filterRestriction = {
			"String" : undefined
			};
		}

		annotationObject.isDropDown = isDropDown;

		//if (dimension) {
			annotationObject.Dimensions = [];
			var dimObject = {};

			dimObject.Field = {
				"String": dimension
			};

			annotationObject.Dimensions.push(dimObject);
		//}

		//if (measure) {
			annotationObject.Measures = [];
			var measureObject = {};

			measureObject.Field = {
				"String": measure
			};

			annotationObject.Measures.push(measureObject);
		//}

		if (isSelected) {
			annotationObject.Selected = {
				"Boolean" : "true"
			};
		} else {
			annotationObject.Selected = {
				"Boolean" : "false"
			};
		}

		if (collectionPath) {
			annotationObject.CollectionPath = collectionPath;
		}

		if (parameters && parameters.length) {
			annotationObject.InParameters = [];

			for (var key in parameters) {
				var param = parameters[key] ? parameters[key] : undefined,
					recordType = (param && param.RecordType) ? param.RecordType : undefined,
					valueListProperty = (param.ValueListProperty && param.ValueListProperty.String) ? param.ValueListProperty.String : undefined,
					localDataProperty = (param.LocalDataProperty && param.LocalDataProperty.PropertyPath) ? param.LocalDataProperty.PropertyPath : undefined;

				if (param && recordType && valueListProperty && localDataProperty) {
					// take the parameter where valueListproperty matches the dimension
					if (annotationObject.OutParameter === undefined && (recordType === V4Terms.ValueListParameterOut || recordType === V4Terms.ValueListParameterInOut) && valueListProperty === dimension && localDataProperty === parentProperty) {
						annotationObject.OutParameter = localDataProperty;
						//break;
					}

					if (localDataProperty !== parentProperty && (recordType === V4Terms.ValueListParameterIn || recordType === V4Terms.ValueListParameterInOut)) {
						var metaModel = this._filter.getModel().getMetaModel(),
						entityFullName = this.getEntityType(collectionPath.String),
						entityDef = metaModel.getODataEntityType(entityFullName),
						entitySet = metaModel.getODataEntitySet(sEntitySet),
						entityProperty = metaModel.getODataProperty(entityDef, valueListProperty);
						var bisPropertyNonFilterable = FilterUtil.isPropertyNonFilterable(entitySet, entityProperty.name);
						if (bisPropertyNonFilterable) {
						//if (entityProperty['sap:filterable'] === undefined || entityProperty['sap:filterable'] == "true") {
							oLogger.error('IN Parameter valueListProperty: ' + valueListProperty + ' is non filterable');
						} else {
							if (!FilterUtil.isPropertyHidden(entityProperty)) {
								// push InParams only field is not Hidden
								annotationObject.InParameters.push({
								localDataProperty: localDataProperty,
								valueListProperty: valueListProperty
								});
							}
						}
					}
				}
			}
		}

		if (parentProperty) {
			annotationObject.ParentProperty = parentProperty;
		}

		if (!isParameter) {
			// to push all SFB properties as inParams
			this._addAllFiltersAsInParameters(sEntitySet, annotationObject);
		} else {
			annotationObject.isParameter = isParameter;
		}

		annotationObject.isMandatoryProperty = bIsMandatoryProp;
		annotationObject.displayBehaviour = displayBehaviour;
		if (selectionVariant) {
			annotationObject.selectionVariant = selectionVariant;
		}
		return annotationObject;
	};
	VisualFilterProvider.prototype._getConfig = function(annotationData) {
		var config = {filterList: []};
		if (!annotationData) {
			return config;
		}

		// Convert into the configuration format for the Visual Filter Bar
		var filterByDimName = {};
		var filterByParentPropName = {};
		var filterList = annotationData.Filters;
		for (var i = 0; i < filterList.length; i++) {
			var filter = filterList[i];

			var parentProperty = filter.ParentProperty;

			var dimField = filter.Dimensions[0].Field.String;
			var entitySet = filter.CollectionPath.String;
			var dim = this._dimensionMap[entitySet][dimField];
			if (!dim) {
				oLogger.error("Unknown Dimension :" + dimField);
				continue;
			}

			var measureField = filter.Measures[0].Field.String;
			var measure = this._measureMap[entitySet][measureField];
			if (!measure) {
				oLogger.error("Unknown Measure :" + measureField);
				continue;
			}

			var dispField = dim.fieldInfo.description; // Use the description/sap:text annotation to determine the display value for the field.  E.g. Want to display "Sales Northern Region", not "100-00010"
			if (!dispField) {
				dispField = dimField; // if no display field, just use the technical field as a fallback
			}

			if (!filterByDimName[dimField]) {
				filterByDimName[dimField] = [];
			}

			if (!filterByParentPropName[parentProperty]) {
				filterByParentPropName[parentProperty] = [];
			}

			var configObject = {
				type: filter.Type.String,
				selected: filter.Selected.Boolean == "true",
				dimension: { // for now only supporting a single dimension (although the annotations allow for a collection)
					field: dimField,
					fieldDisplay: dispField
				},
				measure: { // for now only supporting a single measure (although the annotations allow for a collection)
					field: filter.Measures[0].Field.String
				},
				sortOrder : filter.SortOrder,
				scaleFactor : filter.scaleFactor.String,
				numberOfFractionalDigits : filter.numberOfFractionalDigits.String,
				chartQualifier : filter.chartQualifier,
				dimensionFieldIsDateTime: filter.dimensionFieldIsDateTime,
				dimensionFieldIsDateTimeOffset: filter.dimensionFieldIsDateTimeOffset,
				stringdate: filter.stringdate,
				selectionVariant: filter.selectionVariant
			};

			configObject.collectionPath = filter.CollectionPath.String;
			configObject.outParameter = filter.OutParameter;
			configObject.inParameters = filter.InParameters;
			configObject.parentProperty = filter.ParentProperty;

			//adding filterRestriction property to configObject
			configObject.filterRestriction = filter.filterRestriction.String;

			//adding required-in-field property to configObject
			configObject.isMandatory = filter.isMandatoryProperty;
			configObject.isDropDown = filter.isDropDown;
			configObject.displayBehaviour = filter.displayBehaviour;
			configObject.isParameter = filter.isParameter;

			filterByParentPropName[parentProperty].push(configObject);
			filterByDimName[dimField].push(configObject);
		}
		// Now add the filter to the config's filterList
		// Special note: groups determine the 1st level order of the filters.
		// E.g. If ordered in the VisualFilterSet as A B C, and B is part of the 1st group, then the order will show like: B A C
		// The second level ordering is based on the order within the VisualFilterSet
		var usedGroupsByName = {};
		for (var i = 0; i < this._groupList.length; i++) {
			var group = this._groupList[i];
			for (var j = 0; j < group.fieldList.length; j++) {
				var field = group.fieldList[j];
				var filterList = filterByParentPropName[field.name]; // One dimension can have multiple filters

				if (!filterList) {// Then no visual filters defined for that dimension
					continue;
				}

				usedGroupsByName[group.name] = true;
				for (var k = 0; k < filterList.length; k++) {
					config.filterList.push(filterList[k]);
				}
			}
		}

		// Remove unused groups
		for (var i = this._groupList.length - 1; i >= 0; i--) {
			var group = this._groupList[i];
			if (usedGroupsByName[group.name]) {
				continue;
			}

			// Unused
			this._groupList.splice(i, 1);
			delete this._groupMap[group.name];
		}
		return config;
	};

	/**
	 * @private
	 * This function is used to ignore VF items which do not have dimensions and measures
	 * @param  {string} sEntitySet Entity set of the property
	 * @param  {string} sDimension Dimension of the chart
	 * @param  {string} sMeasure Measure of chart
	 * @param  {boolean} return dimension and measure are valid or not
	*/
	VisualFilterProvider.prototype._isValidDimensionandMeasure = function(sEntitySet, sDimension, sMeasure) {
		if (!(sDimension && sMeasure)) {
			return false;
		}

		var oDimensionMap = this.getDimensionMap(),
			oDimensionFieldInfo = FilterUtil.readProperty(oDimensionMap, sEntitySet + "." + sDimension + ".fieldInfo", "", "VisualFilter");

		var oMeasureMap = this.getMeasureMap(),
			oMeasureFieldInfo = FilterUtil.readProperty(oMeasureMap, sEntitySet + "." + sMeasure + ".fieldInfo", "", "VisualFilter"),
			measureList = oMeasureMap[sEntitySet], count = 0;

		if (!(oDimensionFieldInfo && oMeasureFieldInfo)) {
			oLogger.error("The dimension " + sDimension + " or the measure " + sMeasure + " or both are either NOT given in the chart, or IS given but undefined in metadata. Corresponding chart cannot be displayed as VisualFilter.");
			return false;
		}

		for (var item in measureList) {
			var oMeaureInfo = measureList[item].fieldInfo;
			if (oMeaureInfo[V4Terms.Hidden] && oMeaureInfo[V4Terms.Hidden].Bool === "true") {
				oLogger.warning("The measure " + oMeaureInfo.name + " is set to UI.Hidden in the collection " + sEntitySet + ". Chart configured with this measure cannot be rendered.");
				count++;
			}
		}

		var bIsDimensionHidden = oDimensionFieldInfo[V4Terms.Hidden] && oDimensionFieldInfo[V4Terms.Hidden].Bool === "true";
		if (oDimensionFieldInfo && bIsDimensionHidden) {
			oLogger.warning("The dimension " + sDimension + " is set to UI.Hidden in the collection " + sEntitySet + ". Corresponding chart cannot be displayed as VisualFilter.");
			return false;
		}

		if (!(oDimensionFieldInfo['aggregationRole'] === "dimension" && oMeasureFieldInfo['aggregationRole'] === "measure")) {
			oLogger.error("The dimension " + sDimension + " or the measure " + sMeasure + " or both have NO 'sap:aggregation-role' defined in metadata. Corresponding chart cannot be displayed as VisualFilter.");
			return false;
		}

		if (Object.keys(measureList).length === count) {
			oLogger.warning("All the measures in the collection " + sEntitySet + " are set to UI.Hidden. Corresponding chart cannot be displayed as VisualFilter.");
			return false;
		}
		return true;
	};

	VisualFilterProvider.prototype._getFiltersAndParamsFromSV = function (oSVObject, svQual) {
		for (var index in oSVObject) {
			if (oSVObject[index].qualifier === svQual) {
				return oSVObject[index].annotation;
			}
		}
	};

	VisualFilterProvider.prototype._addAllFiltersAsInParameters = function (sValueListEntitySet, annotationObject) {
		if (!this._filter.getAllFiltersAsInParameters()) {
			return;
		}
		var oDimensionMap = this.getDimensionMap(),
		sSFBEntitySet = this._filter.getEntitySet(),
		sSFBEntityType = this.getEntityType(sSFBEntitySet),
		aInParameters = annotationObject.InParameters || [],
		parentProperty = annotationObject.ParentProperty;

		if (sSFBEntitySet !== sValueListEntitySet) {
			this._createDimensionMap(sSFBEntitySet, sSFBEntityType);
		}

		if (Object.keys(oDimensionMap).length) {
			oDimensionMap = oDimensionMap[sSFBEntitySet];
		}

		if (sSFBEntitySet !== sValueListEntitySet) {
			var oMetaModel = this._filter.getModel().getMetaModel(),
			oEntitySet = oMetaModel.getODataEntitySet(sValueListEntitySet),
			entityDef = oMetaModel.getODataEntityType(oEntitySet.entityType),
			sPropertyName, entityProperty, bIsValidInParam, bIsParentProperty, bIsPropertyNonFilterable, bIsHidden, isAlreadyInParameter;
			for (var sPropertyName in oDimensionMap) {
				if (oDimensionMap.hasOwnProperty(sPropertyName)) {
					bIsParentProperty = parentProperty === sPropertyName;
					entityProperty = oMetaModel.getODataProperty(entityDef, sPropertyName);
					bIsPropertyNonFilterable = bIsHidden = isAlreadyInParameter = true;
					if (entityProperty) {
						bIsPropertyNonFilterable = FilterUtil.isPropertyNonFilterable(oEntitySet, entityProperty.name);
						bIsHidden = FilterUtil.isPropertyHidden(entityProperty);
					}
					//checks if filterFieldProperty is already defined as InParameter
					isAlreadyInParameter = FilterUtil.isAlreadyInParameter(aInParameters, sPropertyName);
					bIsValidInParam = !bIsParentProperty && !isAlreadyInParameter && !bIsPropertyNonFilterable && !bIsHidden;
					if (bIsValidInParam) {
						aInParameters.push({localDataProperty: sPropertyName, valueListProperty: sPropertyName});
					}
				}
			}
		} else {
			for (var sPropertyName in oDimensionMap) {
				if (oDimensionMap.hasOwnProperty(sPropertyName)) {
					//checks if filterFieldProperty is already defined as InParameter
					var isAlreadyInParameter = FilterUtil.isAlreadyInParameter(aInParameters, sPropertyName);
					if (!isAlreadyInParameter && parentProperty !== sPropertyName) {
						aInParameters.push({localDataProperty: sPropertyName, valueListProperty: sPropertyName});
					}
				}
			}
		}
		// updating existing InParameters(via annotations) with all SFB Filters
		annotationObject.InParameters = aInParameters;
	};

	return VisualFilterProvider;

}, /* bExport= */true);
