sap.ui.define([
	"sap/m/HeaderContainer",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/VisualFilterDialogController",
	"sap/ui/comp/odata/ODataModelUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/VisualFilterProvider",
	"sap/ui/comp/smartvariants/PersonalizableInfo",
	"sap/ui/comp/smartvariants/SmartVariantManagement",
	"sap/ui/model/Filter",
	"sap/m/OverflowToolbar",
	"sap/m/ToolbarSpacer",
	"sap/ui/comp/odata/MetadataAnalyser",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",
	"sap/m/VBox",
	"sap/m/Button",
	"sap/m/Title",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/DropDownController",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/DynamicDateRangeController",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/FilterItemMicroBar",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/FilterItemMicroLine",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/FilterItemMicroDonut",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/CustomData",
	"sap/m/Text",
	"sap/m/OverflowToolbarLayoutData",
	"sap/ui/model/FilterOperator",
	"sap/ui/Device",
	"sap/ui/model/SimpleType",
	"sap/ui/core/library",
	"sap/m/library",
	"sap/m/DatePicker",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/ui/core/InvisibleText",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/base/util/deepExtend",
	"sap/m/DynamicDateRange"
], function(HeaderContainer, VisualFilterDialogController,
		ODataModelUtil,
		VisualFilterProvider,
		PersonalizableInfo, SmartVariantManagement,
		Filter,
		OverflowToolbar, ToolbarSpacer, MetadataAnalyser, FilterUtil, V4Terms, VBox, Button, Title,
		DropDownController, DynamicDateRangeController, FilterItemMicroBar, FilterItemMicroLine, FilterItemMicroDonut, JSONModel,
		CustomData, Text, OverflowToolbarLayoutData, FilterOperator, Device, SimpleType, SapCoreLibrary, SapMLibrary, DatePicker, FeLogger, InvisibleText, StableIdHelper, deepExtend, DynamicDateRange) {
	"use strict";
	var oLogger = new FeLogger("AnalyticalListPage.visualfilterbar.SmartVisualFilterBar").getLogger();

	var CHART_TYPE_DONUT = "Donut";
	var CHART_TYPE_LINE = "Line";
	var CHART_TYPE_BAR = "Bar";
	// create simple type to handle two-way binding (model -> view and view -> model)
	var oDimensionFilterType = SimpleType.extend("sap.ui.model.DimensionFilterType", {
	    formatValue: function(oValue) {
			// handles model -> view changes
			return oValue;
	    },
	    parseValue: function(oValue) {
			// handles view -> model changes
			return oValue;
	    },
	    validateValue: function(oValue) {
			// can extra validation on the value after successful parsing
			// not doing anything for now
	    }
	});

	var SmartVisualFilterBar = HeaderContainer.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.SmartVisualFilterBar", {
		metadata: {
			designTime: true,
			properties: {
				entitySet: { type: "string", group: "Misc", defaultValue: null },
				config: { type: "object", group: "Misc", defaultValue: null },
				persistencyKey: { type: "string", group: "Misc", defaultValue: null },
				lazyLoadVisualFilter: { type: "boolean", group: "Misc", defaultValue: true },
				displayCurrency: { type: "string", group: "Misc", defaultValue: null },
				smartFilterId: { type: "string", group: "Misc", defaultValue: null },
				allFiltersAsInParameters: { type: "boolean", group: "Misc", defaultValue: true },
				associateValueListsCalled: { type: "boolean", group: "Misc", defaultValue: false },
				filterSettings: { type: "object", group: "Misc", defaultValue: null }
			},
			associations: {
				smartVariant: { type: "sap.ui.core.Control", multiple: false }
			},
			events: {
				filterChange: {},
				Initialized: {},
				onFilterItemAdded: {}
			}
		},
		renderer: {}
	});

	SmartVisualFilterBar.prototype.init = function() {
		if (HeaderContainer.prototype.init) {
			HeaderContainer.prototype.init.apply(this, arguments);
		}
		//bIsCozyMode is true when launched in cozy form factor. This check is to increase the height of the charts to make it interactive in cozy mode
		var bIsCozyMode = document.body.classList.contains("sapUiSizeCozy");		// Default settings
		//TODO: Get this through CSS rather than hard coding
		this._cellItemHeightNorth = bIsCozyMode ? "3rem" : "2rem";
		this._cellItemHeightSouth = bIsCozyMode ? "9.9rem" : "7.5rem";
		Device.system.phone ? this._cellItemHeightSouth = "9rem" : "";
		this._cellHeight = bIsCozyMode ? "12rem" : "11rem";
		this._cellWidth = "20rem";
		this.labelHeight = 2.0;
		this.compHeight = bIsCozyMode ? 9.9 : 7.9;
		this.cellHeightPadding = 1;
		this.cellHeight = (this.labelHeight + this.compHeight + this.cellHeightPadding) + "rem";  // Add cell padding due to the focus on the chart being clipped by the outer cell container, shouldn't have to do this
		this.cellWidth = 320;
		this._dialogFilters = {};
		this._compactFilters = {};
		this._oVariantConfig = {};
		//this._smartFilterContext;
		//this._oMetadataAnalyser;
		this.setModel(new JSONModel(), '_visualFilterConfigModel');
		if (bIsCozyMode) {
			if (Device.system.phone) { //Apply the style class specific to phone and change orientation of header container to "vertical"
				this.setOrientation("Vertical");
				this.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterBarCozyPhone");
			} else { //Apply the style class specific to tablet
				this.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterBarCozy");
			}
		} else {
			this.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterBar");
		}
	};

	/**
	 * It could happen that the entity type information is set already in the view, but there is no model attached yet. This method is called once the
	 * model is set on the parent and can be used to initialise the metadata, from the model, and finally create the visual filter bar.
	 *
	 * @private
	 */
	SmartVisualFilterBar.prototype.propagateProperties = function() {
		HeaderContainer.prototype.propagateProperties.apply(this, arguments);
		this._initMetadata();
	};

	/**
	 * Initialises the OData metadata necessary to create the visual filter bar
	 *
	 * @private
	 */
	SmartVisualFilterBar.prototype._initMetadata = function() {
		if (!this.bIsInitialised) {
			ODataModelUtil.handleModelInit(this, this._onMetadataInit);
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 *
	 * @private
	 */
	SmartVisualFilterBar.prototype._onMetadataInit = function() {
		var oModel = this.getModel();
		if (oModel.mMetadataUrlParams && oModel.mMetadataUrlParams["sap-value-list"] === "none"){
			this._smartFilterContext.attachEvent("valueListAnnotationLoaded", function(oEvent){
				this._initiateVisualFilterLoad();
			}.bind(this));
		} else {
			this._smartFilterContext.attachInitialized(this._initiateVisualFilterLoad, this);
		} 
	};

	SmartVisualFilterBar.prototype._initiateVisualFilterLoad = function () {
		if (this.bIsInitialised) {
			return;
		}

		this._annoProvider = this._createVisualFilterProvider();
		if (!this._annoProvider) {
			return;
		}

		this._oMetadataAnalyser = this._annoProvider.getMetadataAnalyser();
		this.bIsInitialised = true;

		this._updateFilterBar();
	};

	/**
	 * Creates an instance of the visual filter provider
	 *
	 * @private
	 */
	SmartVisualFilterBar.prototype._createVisualFilterProvider = function() {
		var model = this.getModel();
		var entitySet = this.getEntitySet();

		if (!model || !entitySet) {// Model and entity set must be available
			return null;
		}

		return new VisualFilterProvider(this);
	};

	/*
	* @private
	* obtains the string for '_BASIC' group from i18n property
	* @return {string}
	*/
	SmartVisualFilterBar.prototype._getBasicGroupTitle = function() {
		return this.getModel("i18n").getResourceBundle().getText("VIS_FILTER_GRP_BASIC_TITLE");
	};

	SmartVisualFilterBar.prototype._getFieldGroupForProperty = function(oEntityType,sCurrentPropName) {
		return this._annoProvider ? this._annoProvider._getFieldGroupForProperty(oEntityType,sCurrentPropName) : undefined;
	};

	SmartVisualFilterBar.prototype._getGroupList = function() {
		return this._annoProvider ? this._annoProvider.getGroupList() : [];
	};

	SmartVisualFilterBar.prototype._getGroupMap = function() {
		return this._annoProvider ? this._annoProvider.getGroupMap() : {};
	};

	SmartVisualFilterBar.prototype._getMeasureMap = function() {
		return this._annoProvider ? this._annoProvider.getMeasureMap() : {};
	};

	SmartVisualFilterBar.prototype._getDimensionMap = function() {
		return this._annoProvider ? this._annoProvider.getDimensionMap() : {};
	};

	/*
	* @public
	* sets the smart filter bar reference in the visual filter
	* so that it can be accessed if required
	* @param {object} oContext reference to smart filter bar
	* @return {void}
	*/
	SmartVisualFilterBar.prototype.setSmartFilterContext = function(oContext) {
		this._smartFilterContext = oContext;
	};

	SmartVisualFilterBar.prototype._updateFilterBar = function() {
		// Centrally handle the various settings: Application Configuration, OData Annotations, Variant settings...
		// Order of precedence, highest to lowest, highest precedence overwrites the lower precedence:
		//   1. Variant
		//   2. OData Annotations


		var annoSettings = this._getAnnotationSettings();
		if (annoSettings && annoSettings.filterList) {
			var config = this._convertSettingsToConfig(annoSettings);
		} else {
			// Default, no filters
			config = {
				filterCompList: []
			};
			this.getModel('_visualFilterConfigModel').setData(config);
			return;
		}

		// Variant store the variables of a property (Measure, sort order, chart type, shown in filterbar)
		var variantJSON = this._getVariantConfig();
		if (variantJSON && variantJSON.config) {
			// merge variant into config based on property
			config.filterCompList.forEach(function (element) {
				// if parent property exists in variant json override config
				if (variantJSON.config[element.component.properties.parentProperty]) {
					deepExtend(element, variantJSON.config[element.component.properties.parentProperty]);
				}
			});
			// store config only for later use after smart filter bar variant load when mergeCompactFilters is called
			this._oVariantConfig = config;
			//return;
		}
		this.unbindAggregation('content', true);

		this.getModel('_visualFilterConfigModel').setData(config);
		this.bindAggregation('content', {
			path: "_visualFilterConfigModel>/filterCompList",
			factory: function (sId, oContext) {
				var oComponentProperties = oContext.getProperty('component'),
				oProperties = oComponentProperties ? oComponentProperties.properties : undefined,
				sChartType = this._resolveChartType(oComponentProperties ? oComponentProperties.type : undefined);
				// create header items
				return this._createHeaderItems(oContext.sPath, sChartType, oProperties);
			}.bind(this),
			//Filter the items based on shownInFilterBar=true
			filters: new Filter("shownInFilterBar", FilterOperator.EQ, true)
		});
		this.attachBrowserEvent("keyup",FilterUtil.onKeyUpVisualFilter.bind(FilterUtil));
		this.attachBrowserEvent("keydown",FilterUtil.onKeyDownVisualFilter.bind(FilterUtil, this._smartFilterContext));
		this.fireInitialized();
	};
	// spath - path to object in visual filter config model
	SmartVisualFilterBar.prototype._createHeaderItems = function (sPath, sType, oProperties) {
		// Component initialization, create chart
		var oFilterItem = this._createFilterItemOfType(sType, oProperties, true);
		oFilterItem.data("isDialogFilterItem", "false");
		var aSVOptions = oProperties.selectFilters && oProperties.selectFilters.SelectOptions,
		// aSVParameters = oProperties.selectFilters && oProperties.selectFilters.Parameters,
		aInParameters = oFilterItem.getInParameters(),
		aBindingParts = [],
		me = this;
		if (aInParameters && aInParameters.length > 0) {
			aInParameters.forEach(function (element) {
				aBindingParts.push({
					path: '_filter>/' + element.localDataProperty
				});
			});
		}
		oFilterItem.addCustomData(new CustomData({
			key: 'sPath',
			value: sPath
		}));
		if (oProperties.stringdate) {
			oFilterItem.addCustomData(new CustomData({
				key: 'stringdate',
				value: oProperties.stringdate
			}));
		}
		if (me.getEntitySet() === oFilterItem.getEntitySet()) {
			var aMandatoryFields = me._smartFilterContext.determineMandatoryFilterItems();
			if (aMandatoryFields && aMandatoryFields.length > 0) {
				aMandatoryFields.forEach(function (element) {
					if (!element.data("isCustomField")) {
					    aBindingParts.push({
					        path: '_filter>/' + element.getName()
					    });
					}
				});
			}
		}
		// set models on the filter items
		oFilterItem.bindProperty('dimensionFilter', {
			path: '_filter>/' + oFilterItem.getParentProperty(),
			// type ensure two-way data binding in case value has to be formatted
			type: new oDimensionFilterType()
		});
		oFilterItem.bindProperty('measureField', {
			path: '_visualFilterConfigModel>' + sPath + '/component/properties/measureField'
		});
		oFilterItem.bindProperty('sortOrder', {
			path: '_visualFilterConfigModel>' + sPath + '/component/properties/sortOrder'
		});
		oFilterItem.bindProperty('unitField', {
			path: '_visualFilterConfigModel>' + sPath + '/component/properties/measureField',
			formatter: function() {
				var measureMap = me._getMeasureMap();
				var measureField = measureMap[this.getEntitySet()][this.getMeasureField()];
				return measureField ? measureField.fieldInfo.unit : "";
			}
		});
		if (aBindingParts && aBindingParts.length > 0) {
			oFilterItem.bindProperty('dimensionFilterExternal', {
				parts: aBindingParts,
				formatter: function () {
					var	aInParameters = this.getInParameters() || [];
					var sParentProperty = this.getParentProperty();
					var oFilter, oCurrencyProperty;
					if (me.getEntitySet() === this.getEntitySet()) {
						var aMandatoryFields = me._smartFilterContext.determineMandatoryFilterItems();
						aMandatoryFields.forEach(function (filterFieldObject) {
							var filterFieldProperty = filterFieldObject.getName();
							//checks if filterFieldProperty is already defined as InParameter
							var isAlreadyInParameter = aInParameters && aInParameters.some(function (e) {return e.localDataProperty === filterFieldProperty;});
							if (filterFieldProperty.indexOf("$Parameter") === -1 && !isAlreadyInParameter) {
								aInParameters.push({ localDataProperty: filterFieldProperty, valueListProperty: filterFieldProperty });
								//all mandatory filter field property are pushed here. If parent property and local data property of visual filter are same
								// it will be eliminated in the next function call "_getFiltersForFilterItem"
							}
						});
					}
					// If the Main EntitySet and the filterItem EntitySet is the same and the main EntitySet
					// is Parameterized, then we do not proceed. So we only procees in 3 cases.
					// 1. VH!=ME(Parameterized)
					// 2. VH=ME(Non-Parameterized)
					// 3. VH!=ME(Non-Paramterized)
					// Since we already have set a parameter, therefore
					// we do not need an explicit currency filter and the parameter takes care of the conversions.
					// Considering the above 3 cases, we proceed only if
					// 1. The ME is Non-Parameterized
					// 2. The ME is Parameterized but the parameter is only P_DisplayCurrency
					// Following case is also considered
					// If mandatory filter field is not defined as in paramter for the visual filter
					if (!(me.getEntitySet() === this.getEntitySet() && me._smartFilterContext.getAnalyticBindingPath() !== "") && (me._smartFilterContext.getAnalyticBindingPath() === "" || me._smartFilterContext.getAnalyticBindingPath().indexOf("P_DisplayCurrency") != -1)) {
						var measureField = this.getMeasureField();
						var oModel = me.getModel();
						var metaModel = oModel.getMetaModel();
						var oEntityType = metaModel.getODataEntityType(me._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.getEntitySet()));
						var oEntitySet = metaModel.getODataEntitySet(this.getEntitySet());
						var oProperty = metaModel.getODataProperty(oEntityType, measureField);
						// If displayCurrency and currencyPath is set only then we proceed.
						var displayCurrency = me.getProperty("displayCurrency");
						var sCurrencyPath = oProperty && oProperty[V4Terms.ISOCurrency];
						if (displayCurrency && sCurrencyPath) {
							// Check the cuurency property associated with the measure.
							var sCurrencyField = sCurrencyPath.Path;
							for (var key = (aInParameters.length - 1); key > -1; key--) {
								var sValueListProperty = aInParameters[key].valueListProperty;
								var sLocalDataProperty = aInParameters[key].localDataProperty;
								if (sValueListProperty === sCurrencyField) {
									var aFilterData = me._smartFilterContext.getFilterData();
									if (!aFilterData[sLocalDataProperty]) {
										oCurrencyProperty = metaModel.getODataProperty(oEntityType, sCurrencyField);
										var bisPropertyNonFilterable = oCurrencyProperty && FilterUtil.isPropertyNonFilterable(oEntitySet, oCurrencyProperty.name);
										if (!bisPropertyNonFilterable) {
											oFilter = new Filter({
												aFilters: [
													new Filter({ path: sCurrencyField, operator: "EQ", value1: displayCurrency, value2: undefined })
												],
												and: false
											});
										}
									}
									break;
								}
							}
						}
					}
					//to store in-paramters to be used for donut chart total calculation
					if (this._chart instanceof sap.suite.ui.microchart.InteractiveDonutChart) {
						this._inParameterFilterList = new Filter({
							aFilters: [],
							bAnd: true
						});
					}
					return me._getFiltersForFilterItem(aInParameters, sParentProperty, oFilter, sCurrencyField, aSVOptions, this._inParameterFilterList);
				}
			});
		} else if (aSVOptions && aSVOptions.length > 0) {
			var filters = new Filter({aFilters: [], bAnd: true});
			for (var i in aSVOptions) {
				var oOption = aSVOptions[i];
				filters = this.fnAddSelectOptionsToFilters(oOption, filters);
			}
			oFilterItem.setProperty('dimensionFilterExternal', filters);
		}

		// Attach events
		if (oFilterItem.attachFilterChange) {
			oFilterItem.attachFilterChange(this._onFilterChange, this);
		}

		if (oFilterItem.attachTitleChange) {
			oFilterItem.attachTitleChange(this._onTitleChange, this);
		}

		// Create title toolbar for the cell
		var oToolbar = this._createTitleToolbar(oProperties, oFilterItem),
		oHeaderTitleBar = new VBox({
			height: this._cellItemHeightNorth,
			items: [oToolbar]
		});

		var oHeaderChartBar = new VBox({
			height: this._cellItemHeightSouth,
			items: [oFilterItem],
			visible: {
				path: "_visualFilterConfigModel>" + sPath + "/showChartOverlay",
				formatter: function( bValue) {
					return !bValue;
				}
			}
		});


		var sParentProperty = oFilterItem.getParentProperty();
		if (oProperties.isParameter) {
			sParentProperty = FilterUtil.getParameter(sParentProperty);
		}

		var sId = "visualFilterBarInvisibleText" + sParentProperty;
		sId = this.getView().sId + "--" + sId;
		var oInvisibleText = new InvisibleText({id : sId});
		if (this.getAriaLabelledBy().indexOf(sId) === -1) {
			this.addAriaLabelledBy(sId);
		}
		sId = this.getView().sId + "--" + StableIdHelper.getStableId({type: "VisualFilterBar", subType: "FilterItemContainer", sProperty: sParentProperty});
		var oCell = new VBox({
			id: sId,
			fieldGroupIds: ["headerBar"],
			height: this._cellHeight,
			width: (this.cellWidth + 16) + "px",//to fix focus issue temporarily
			items:[
				oHeaderTitleBar,
				oHeaderChartBar,
				oInvisibleText
			]
		});
		oHeaderTitleBar.addStyleClass("sapSmartTemplatesAnalyticalListPageVFTitle");
		oHeaderChartBar.addStyleClass("sapSmartTemplatesAnalyticalListPageVFChart");
		//firing onFilterItemAdded event every time a filter item is created
		this.fireOnFilterItemAdded(oFilterItem);
		return oCell;
	};

	SmartVisualFilterBar.prototype.fnAddSelectOptionsToFilters = function(oOption, filters) {
		var	oSVFilters = new Filter({
			aFilters: [],
			bAnd: false
		});
		var me  = this,
			sProperty = oOption.PropertyName && oOption.PropertyName.PropertyPath;
		oOption.Ranges.forEach(function(oRange) {
			var	sLow = oRange.Low && oRange.Low.String,
				sSign = oRange.Sign && oRange.Sign.EnumMember && oRange.Sign.EnumMember.split("/")[1],
				sOption = oRange.Option && oRange.Option.EnumMember && oRange.Option.EnumMember.split("/")[1],
				sHigh = oRange.High && oRange.High.String;
			var oSelectFilter = me._getSelectOptionFilters(sProperty, sLow, sHigh, sOption, sSign);
			//one property can have multiple values under ranges; add them under a common filter
			oSVFilters.aFilters.push(oSelectFilter);
		});
		//add all properties from SV to the main filter list
		filters.aFilters.push(oSVFilters);
		return filters;
	};
	SmartVisualFilterBar.prototype._getAnnotationSettings = function() {
		return this._annoProvider ? this._annoProvider.getVisualFilterConfig() : null;
	};

	/*
	* @private
	* Convert setting from annotations to config for visual filter
	* @param {object} settings - parsed annotations data from visual filter provider
	* @param {boolean} bIsVariantConfig	- if called  by variant management to get variant config
	* @return {object} config used to render the charts or get variant management object based on bIsVariantConfig
	*/
	SmartVisualFilterBar.prototype._convertSettingsToConfig = function(settings, bIsVariantConfig) {
		var config = {
			filterCompList: []
		};

		// Include group information, prepare the group information by field
		var groupList = this._getGroupList();
		var groupByFieldName = {};
		for (var i = 0; i < groupList.length; i++) {
			var group = groupList[i];

			for (var j = 0; j < group.fieldList.length; j++) {
				var field = group.fieldList[j];
				groupByFieldName[field.name] = {
					name: group.name,
					label: group.label
				};
			}
		}

		// By default the basic group is all available in the filter dialog, so get all field names and in the shownInFilterDialog, set the value to true if in this list
		var groupMap = this._getGroupMap();
		var basicGroup = groupMap["_BASIC"];
		var basicFieldNameList = [];
		if (basicGroup && basicGroup.fieldList) {
			for (var i = 0; i < basicGroup.fieldList.length; i++) {
				basicFieldNameList.push(basicGroup.fieldList[i].name);
			}
		}

		var measureMap = this._getMeasureMap(),
			filterList = settings.filterList,
			oVariantConfig = {};
		for (var i = 0; i < filterList.length; i++) {
			var filterCfg = filterList[i];

			var dimField = filterCfg.dimension.field;

			var measureField = measureMap[filterCfg.collectionPath][filterCfg.measure.field];
			var bIsCurrency = false;

			if (measureField.fieldInfo[V4Terms.ISOCurrency]){
				bIsCurrency = true;
			}

			var oConfigObject = {
				shownInFilterBar: filterCfg.selected,
				component: {
					type: filterCfg.type,
					properties: {
						sortOrder : filterCfg.sortOrder,
						measureField: filterCfg.measure.field,
						parentProperty: filterCfg.parentProperty ? filterCfg.parentProperty : undefined
					}
				}
			};

			if (filterCfg.stringdate) {
				oConfigObject.component.properties.stringdate = filterCfg.stringdate;
			}

			if (!bIsVariantConfig) {
				// if not variant management add other properties to config object
				var oConfigExtendedObject = {
					shownInFilterDialog: filterCfg.selected || basicFieldNameList.indexOf(dimField) != -1,
					group: groupByFieldName[filterCfg.parentProperty],
					component: {
						properties: {
							selectFilters: filterCfg.selectionVariant ? filterCfg.selectionVariant : undefined,
							scaleFactor : filterCfg.scaleFactor,
							numberOfFractionalDigits: filterCfg.numberOfFractionalDigits,
							filterRestriction: filterCfg.filterRestriction,
							lazyLoadVisualFilter: this.getLazyLoadVisualFilter(),
							width: this.cellWidth + "px",
							height: this.compHeight + "rem",
							entitySet: filterCfg.collectionPath ? filterCfg.collectionPath : this.getEntitySet(),
							dimensionField: dimField,
							dimensionFieldDisplay: filterCfg.dimension.fieldDisplay,
							dimensionFilter: filterCfg.dimensionFilter,
							unitField: measureField ? measureField.fieldInfo.unit : "",
							isCurrency: bIsCurrency,
							isParameter: filterCfg.isParameter,
							isDropDown: filterCfg.isDropDown,
							isMandatory: filterCfg.isMandatory,
							outParameter: filterCfg.outParameter ? filterCfg.outParameter : undefined,
							inParameters: filterCfg.inParameters ? filterCfg.inParameters : undefined,
							textArrangement: filterCfg.displayBehaviour,
							chartQualifier: filterCfg.chartQualifier ? filterCfg.chartQualifier : undefined,
							dimensionFieldIsDateTime: filterCfg.dimensionFieldIsDateTime,
							dimensionFieldIsDateTimeOffset: filterCfg.dimensionFieldIsDateTimeOffset,
							activeVisualFilters: false
						}
					}
				};
				deepExtend(oConfigObject, oConfigExtendedObject);
				// convert the filter properties from the configuration (variant, annotation) into the control specific properties
				config.filterCompList.push(oConfigObject);
			} else {
				// create variant management object
				oVariantConfig[filterCfg.parentProperty] = oConfigObject;
			}
		}

		return bIsVariantConfig ? oVariantConfig : config;
	};

	SmartVisualFilterBar.prototype._setVariantModified = function() {
		if (this._oVariantManagement) {
			this._oVariantManagement.currentVariantSetModified(true);
		}
	};

	SmartVisualFilterBar.prototype._checkMandatoryFilters = function() {
		var oSmartFilterData = this._smartFilterContext.getFilterData();
		var aMandatoryItems = this._smartFilterContext.determineMandatoryFilterItems();
		var isMandatoryFieldEmpty = false;
		for (var i = 0; i < aMandatoryItems.length; i++) {
			if (oSmartFilterData[aMandatoryItems[i].getName()] === undefined) {
				//adding this to check values of custom filter if they are mandatory
				if (oSmartFilterData._CUSTOM["sap.suite.ui.generic.template.customData"][aMandatoryItems[i].getName()] === undefined) {
					isMandatoryFieldEmpty = true;
					break;
				}
			}
		}
		if (isMandatoryFieldEmpty) {
			this._smartFilterContext.showAdaptFilterDialog("group");
		}
	};

	SmartVisualFilterBar.prototype._onFilterChange = function(ev) {
		this._setVariantModified();
		// Fire the external filter change event
		// event handler should always call setCompactFilterData with compact filter data
		// handled in filter bar controller
		this.fireFilterChange();
		//Checking after change in visual filter, is it clearing the mandatory fields.
		// If so then showing the visual filter dialog box to enter the mandatory filter fields for proceeding further.
		this._checkMandatoryFilters();

	};

	/**
	 * @private
	 * Get AND query filters for all in parameters for a visual filter instance instance
	 *
	 * @param {array} inParams - array of in parameters
	 * @param {string} parentProperty - parent property of the visual filter instance
	 * @returns {array} filter query of the visual filter item
	 */
	SmartVisualFilterBar.prototype._getFiltersForFilterItem = function(inParams, parentProperty,oFilter, currencyField, selectOptions, inParameterFilterList) {
		var oPropertyFilters = {},
		mappedLocalDataProperty	= [], mappedSelectionVariant = [],
		filters = new Filter({
			aFilters: [],
			bAnd: true
		});
		if (inParams && inParams.length > 0) {
			var replaceSPath = function (element) {
				// change property path from local data property to value list property
				// since query for filter item will be made to collection path
				element.sPath = valueListProperty;
			};
			// reverse loop since for compact filters also the last in param is considered first
			for (var key = (inParams.length - 1); key > -1; key--) {
				var localDataProperty = inParams[key].localDataProperty,
				valueListProperty = inParams[key].valueListProperty;
				if (selectOptions) {
					for (var i = 0; i < selectOptions.length; i++) {
						var oOption = selectOptions[i];
						var sProperty = oOption.PropertyName && oOption.PropertyName.PropertyPath;
						//dont add twice
						if (mappedSelectionVariant.indexOf(sProperty) === -1) {
							//when value is given for the property in SV which is also chart dimension
							if (sProperty === parentProperty) {
								filters = this.fnAddSelectOptionsToFilters(oOption, filters);
								mappedSelectionVariant.push(sProperty);
							} else {
								var oVisibleFilterItem = this._smartFilterContext.determineFilterItemByName(sProperty);
								//if filter item is visible/partOfCurrentVariant and has SV and SFB values, then only SFB values are considered
								//if filter item is not visible and has an SV value, then consider the SV value
								if (oVisibleFilterItem && (oVisibleFilterItem.getVisibleInFilterBar() || oVisibleFilterItem.getPartOfCurrentVariant())) {
									var oFilterInFilterBar = this._smartFilterContext.getFilters([sProperty]);
									if ((oFilterInFilterBar && oFilterInFilterBar.length) || (mappedLocalDataProperty.indexOf(sProperty) !== -1)) {
										continue;
									} else {
										filters = this.fnAddSelectOptionsToFilters(oOption, filters);
										mappedSelectionVariant.push(sProperty);
									}
								} else {
									filters = this.fnAddSelectOptionsToFilters(oOption, filters);
									mappedSelectionVariant.push(sProperty);
								}
							}
						}
					}
				}
				// Build the set of filters
				if (localDataProperty !== parentProperty && mappedLocalDataProperty.indexOf(localDataProperty) === -1) {
					// get filters for property from smart filter bar
					var oVisibleFilterItem = this._smartFilterContext.determineFilterItemByName(localDataProperty);
					if (oVisibleFilterItem && (oVisibleFilterItem.getVisibleInFilterBar() || oVisibleFilterItem.getPartOfCurrentVariant())) {
						oPropertyFilters = this._smartFilterContext.getFilters([localDataProperty]);
						if (oPropertyFilters && oPropertyFilters.length > 0) {
							// since filter is for specific property hence
							// there will always be one global filter with index 0
							if (oPropertyFilters[0].aFilters) {
								// if in param property is filter-restriction=multi-value
								oPropertyFilters[0].aFilters.forEach(replaceSPath.bind(this));
							} else {
								// if in param property is filter-restriction=single-value or filter-restriction=interval
								replaceSPath(oPropertyFilters[0]);
							}
							// map of properties that have already been considered for in params
							mappedLocalDataProperty.push(localDataProperty);
							// add to main filter with and condition
							filters.aFilters.push(oPropertyFilters[0]);
							if (inParameterFilterList) {
								inParameterFilterList.aFilters.push(oPropertyFilters[0]);
							}
						}
					}
				}
			}
			if (oFilter) {
				filters.aFilters.push(oFilter);
			}
		} else { //if there are no in-params, but select options in SV are given
			if (selectOptions && selectOptions.length) {
				for (var i = 0; i < selectOptions.length; i++) {
					var oOption = selectOptions[i];
					filters = this.fnAddSelectOptionsToFilters(oOption, filters);
				}
			}
		}
		return filters;
	};
	/*
	*This function creates the filter for a property in the select option of SV
	*Also considers the exclude sign, and the CP operator
	* @param {string} sProperty - select option property
	* @param {string} sLow - low value
	* @param {string} sHigh - high value
	* @param {string} sOption - filter operator
	* @param {string} sSign - include/exclude
	*@return {object} select option filter
	*/
	SmartVisualFilterBar.prototype._getSelectOptionFilters = function(sProperty, sLow, sHigh, sOption, sSign) {
		if (sSign === "E") {
			if (sOption !== FilterOperator.EQ) {
				oLogger.error("Exclude sign is supported only with EQ operator");
				return;
			} else {
				sOption = FilterOperator.NE;
				sSign = "I";
			}
		}
		if (sOption === "CP") {
			sOption = FilterOperator.Contains;
			if (sLow.indexOf("*") !== -1) {
				var nIndexOf = sLow.indexOf('*');
				var nLastIndex = sLow.lastIndexOf('*');
				if (nIndexOf > -1) {
					if ((nIndexOf === 0) && (nLastIndex !== (sLow.length - 1))) {
						sOption = FilterOperator.EndsWith;
						sLow = sLow.substring(1, sLow.length);
					} else if ((nIndexOf !== 0) && (nLastIndex === (sLow.length - 1))) {
						sOption = FilterOperator.StartsWith;
						sLow = sLow.substring(0, sLow.length - 1);
					} else {
						sLow = sLow.substring(1, sLow.length - 1);
					}
				}
			}
		}
		var filter = new Filter({
			path: sProperty,
			sign: sSign,
			operator: sOption,
			value1: sLow,
			value2: sHigh
		});
		return filter;
	};
	SmartVisualFilterBar.prototype._createTitleToolbar = function(props, filterItem) {
		var oAppI18nModel = this.getModel("@i18n");
		var titleObject = filterItem.getTitle(oAppI18nModel);

		//First part of the title i.e. measure and dimension
		var titleMD = new Title({
			text: titleObject.titleMD,
			titleStyle: SapCoreLibrary.TitleLevel.H6
		});

		if (filterItem.getProperty("isMandatory")) {
			titleMD.addStyleClass("sapSmartTemplatesAnalyticalListPageRequired");
		}
		//second part of the title i.e unit and currency
		var titleUnitCurr = new Title({
				text: titleObject.titleUnitCurr.length > 1 ? "| " + titleObject.titleUnitCurr : "",
				titleStyle: SapCoreLibrary.TitleLevel.H6,
				width: titleObject.titleUnitCurr.length > 1 ? "4.15rem" : "0rem"
			});

		//adding CSS for phone device to the title text
		titleMD.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterTitleText");
		titleUnitCurr.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterTitleText");
		//Get the input control for corresponding property needed to fire valuehelp request
		var oInput = this._smartFilterContext.determineFilterItemByName(props.parentProperty).getControl();
		//ensure that value help annotations are loaded
		this._smartFilterContext.ensureLoadedValueHelp(props.parentProperty);
		//Value help button is needed only if input control is defined
		if (oInput) {
			var dimLabel = FilterUtil.getPropertyNameDisplay(this.getModel(), filterItem.getEntitySet(), filterItem.getDimensionField(), oAppI18nModel),
			rb = this.getModel("i18n").getResourceBundle(),
			bIsValuehelp = oInput.getShowValueHelp && oInput.getShowValueHelp() && !props.dimensionFieldIsDateTimeOffset, //disable valuehelp for multi-input date time fields
			bIsDateTimePicker = oInput.getMetadata && oInput.getMetadata().getName() === "sap.m.DateTimePicker",
			oDateSettings = this.getFilterSettings() && this.getFilterSettings().dateSettings ? this.getFilterSettings().dateSettings : null,
			bIsDatePicker = oInput instanceof DatePicker,
			bIsDynamicDateRange = false, oDynamicDateRange = null;
			if (props.isParameter) {
				sParentProperty = FilterUtil.getParameter(filterItem.getParentProperty());
			} else {
				sParentProperty = filterItem.getParentProperty();
			}
			if (!bIsDatePicker && oInput instanceof DynamicDateRange && oDateSettings && (Object.keys(oDateSettings).length > 0) &&  filterItem.getFilterRestriction() === 'single') {
				if (oDateSettings.useDateRange) {
					bIsDynamicDateRange = true;
				} else if (!oDateSettings.useDateRange && (oDateSettings.selectedValues || (oDateSettings.fields && (Object.keys(oDateSettings.fields).length > 0) && !oDateSettings.fields[sParentProperty]))) {
					bIsDynamicDateRange = true;
					var aControlOptions = this.getSmartFilterBarControlOptions(sParentProperty);
					oDynamicDateRange =  DynamicDateRangeController.createDynamicDateRange(aControlOptions);
				}
			}
			var sShowDateOrDynamicDate = "";
			if (bIsDatePicker && !bIsDateTimePicker) {
				sShowDateOrDynamicDate = "sap-icon://appointment-2";
			} else if (bIsDynamicDateRange) {
				sShowDateOrDynamicDate = "sap-icon://check-availability";
			}
			var sShowDropdown = (props.isDropDown) ? "sap-icon://slim-arrow-down" : "",
			sIcon = bIsValuehelp ? "sap-icon://value-help" : sShowDateOrDynamicDate || sShowDropdown, count, sParentProperty, sId;
			sId = this.getView().sId + "--" + StableIdHelper.getStableId({type: "VisualFilterBar", subType: "ValueHelpButton", sProperty: sParentProperty});
			var selectedBtn = new Button({
				id: sId,
				text: {
					path: "_filter>/" + filterItem.getParentProperty(),
					formatter: function(oContext) {
						var sFilterRestriction = filterItem.getFilterRestriction();
						count = 0;
						if (oContext) {
							if (sFilterRestriction === 'single' && !bIsDynamicDateRange) {
								count = 1;
							} else {
								if (typeof oContext === "object") {	//For multi value
									if (oContext.value) {	//Add single value
										count++;
									}
									//Add items
									if (oContext.items && oContext.items.length) {	//items can be null
										count += oContext.items.length;
									}
									//Add ranges
									if (oContext.ranges && oContext.ranges.length) {	//ranges can be null
										count += oContext.ranges.length;
									}
								} else {	//For single value, it can be string or int
									count++;
								}
							}
						}
						return count ? "(" + count + ")" : "";
					}
				},
				icon: (bIsValuehelp || props.isDropDown || bIsDatePicker || bIsDynamicDateRange) ? sIcon : "",
				customData: [
					new CustomData({
						key: 'isF4Enabled',
						value: (bIsValuehelp || props.isDropDown || bIsDatePicker || bIsDynamicDateRange) ? true : false
					})
				],
				visible: {
					path: "_filter>/" + filterItem.getParentProperty(),
					formatter: function(oContext) {
						if (bIsValuehelp || props.isDropDown || (bIsDatePicker && !bIsDateTimePicker) || bIsDynamicDateRange) { //for valuehelp & Drop Down
							return true;
						} else { //non value-help case
							if (!oContext) { //No filter set for this property
								return false;
							}
							//Handle multiple values
							if (typeof oContext === "object") {
								if (oContext instanceof Date) {
									return true;
								}
								return (oContext.value || (oContext.items && oContext.items.length) || (oContext.ranges && oContext.ranges.length)) ? true : false;
							}
							//Single value fields
							return true;
						}
					}
				},
				enabled: {
					path: '_visualFilterConfigModel>' + filterItem.data("sPath") + '/showChartOverlay',
					formatter: function(bValue) {
						return !bValue;
					}
				},
				press: function(oEvent) {
					if (bIsValuehelp) {
						if (oInput.getParent().getParent() === null) {
							this._smartFilterContext.addAggregation('dependents',oInput.getParent());
						}
						if (!this.getAssociateValueListsCalled()) {
							this.setAssociateValueListsCalled(true);
							this._smartFilterContext.attachEventOnce("valueListAnnotationLoaded", function() {
								oInput.fireValueHelpRequest();
							});
							this._smartFilterContext.associateValueLists();
						} else {
							oInput.fireValueHelpRequest();
						}
						//adding this aggregation will result in memory leak of the smart filter bar.
						//It will be added as dependents but won't be destroyed after VH dialog close
					} else if (props.isDropDown) {
						var bIsEntitySearchable = this._isDimensionFieldFilterable(this.getModel(), props.entitySet, props.dimensionField),
						oModel = this.getModel("visualFilter") || this.getModel();
						DropDownController.createDropdown(oEvent.getSource(), filterItem, oModel, dimLabel, props, bIsEntitySearchable);
					} else if (bIsDatePicker && !bIsDateTimePicker) {
						//DatePickerController._createDatePicker(oEvent.getSource(), filterItem);
					} else if (bIsDynamicDateRange) {
						DynamicDateRangeController.openDynamicDateRange(oEvent.getSource(), filterItem);
					} else {
						VisualFilterDialogController.launchAllFiltersPopup(selectedBtn, filterItem, oEvent.getSource().getModel('i18n'));
					}
				}.bind(this),
				layoutData: new OverflowToolbarLayoutData({
					priority: SapMLibrary.OverflowToolbarPriority.NeverOverflow
				}),
				tooltip: {
					path: "_filter>/" + filterItem.getParentProperty(),
					formatter: function() {
						return FilterUtil.getTooltipForValueHelp(bIsValuehelp, dimLabel, rb, count, bIsDatePicker || bIsDynamicDateRange);
					}
				},
				ariaHasPopup: SapCoreLibrary.aria.HasPopup.Dialog
			});
		}

		var toolbar = new OverflowToolbar({
			design: SapMLibrary.ToolbarDesign.Transparent,
			width: this.cellWidth + "px",
			content: [
				titleMD,titleUnitCurr,
				new ToolbarSpacer(),
				selectedBtn,
				oDynamicDateRange
			]
		});
		toolbar.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterTitleToolbar");

		return toolbar;
	};

	SmartVisualFilterBar.prototype._isDimensionFieldFilterable = function (oModel, oEntitySet, sDimensionField) {
		var oMetaModel = oModel.getMetaModel(),
				oODataEntitySet = oMetaModel.getODataEntitySet(oEntitySet),
				oEntityType = oMetaModel.getODataEntityType(oODataEntitySet.entityType),
				oDimensionProperty = oMetaModel.getODataProperty(oEntityType, sDimensionField);
		return (oDimensionProperty["sap:filterable"] === undefined) ? true : oDimensionProperty["sap:filterable"];
	};
	SmartVisualFilterBar.prototype.getTitleByFilterItemConfig = function(filterConfig, unitValue, scaleValue) { // used when the filter item + data is not present, ideally called on the filter item iteslf
		var props = filterConfig.component.properties;
		var entitySet = props.entitySet;
		var model = this.getModel();
		var oAppI18nModel = this.getModel("@i18n");
		if (!model) {
			return "";
		}
		var measureLabel = FilterUtil.getPropertyNameDisplay(model, entitySet, props.measureField, oAppI18nModel);
		var dimLabel = FilterUtil.getPropertyNameDisplay(model, entitySet, props.dimensionField, oAppI18nModel);

		// Get the Unit
		if (!unitValue) {
			unitValue = "";
		}

		// Get the Scale factor
		if (!scaleValue) {
			scaleValue = "";
		}
		//getting the i18n resource bundle
		var rb = this.getModel("i18n").getResourceBundle();
		//
		var titleMD = rb.getText("VIS_FILTER_TITLE_MD", [measureLabel, dimLabel]);
		var titleUnitCurr = scaleValue + " " + unitValue;
		titleUnitCurr = titleUnitCurr.trim();

		var titleObj = {
			titleMD:titleMD,
			titleUnitCurr:titleUnitCurr
		};

		return titleObj;
	};

	SmartVisualFilterBar.prototype._updateVisualFilterAria = function(oCell, oFilterItem, sOverlay) {
		var aItems = oCell.getItems();
		var oResourceBundle = this.getModel("i18n").getResourceBundle();
		var sText = oResourceBundle.getText("VIS_FILTER_ITEM_ARIA");
		var oTitle1 = aItems[0].getItems()[0].getContent()[0];
		var oTitle2 = aItems[0].getItems()[0].getContent()[1];

		sText += " " + (oTitle2.getText().length > 0 ? oTitle1.getText() + oTitle2.getText() : oTitle1.getText());
		if (oFilterItem.getProperty("isMandatory")) {
			sText += " " + oResourceBundle.getText("VIS_FILTER_MANDATORY_PROPERTY_ARIA_LABEL");
		}
		if (sOverlay === "true") {
			sText += " " + oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE") + " " + oFilterItem._chart.getProperty("errorMessage");
			sText += " " + oResourceBundle.getText("VIS_FILTER_BAR_NAVIGATE_ARIA");
		} else {
			sText += " " + oResourceBundle.getText("VIS_FILTER_BAR_NAVIGATE_ARIA") + " " + oResourceBundle.getText("VIS_FILTER_ACCESS_FIELDS_ARIA");
		}
		aItems[aItems.length - 1].setText(sText);
	};

	SmartVisualFilterBar.prototype._onTitleChange = function(ev) {
		var oCell = ev.getSource().getParent().getParent();
		var oFilterItem = oCell.getItems()[oCell.getItems().length - 2].getItems()[0];
		if (oFilterItem.data("sOverlay") !== "true") {
			//Select label from toolbar
			var oLabelMD = oCell.getItems()[0].getItems()[0].getContent()[0];
			var oLabelUnitCurr = oCell.getItems()[0].getItems()[0].getContent()[1];

			var i18nModel = this.getModel("i18n");
			var oAppI18nModel = this.getModel("@i18n");
			if (!i18nModel) {
				return "";
			}
			var rb = i18nModel.getResourceBundle();

			if (ev.getSource().getProperty("isMandatory")) {
				oLabelMD.addStyleClass("sapSmartTemplatesAnalyticalListPageRequired");
			}

			//getting title object having both measure dimension and unit currency
			var oTitleObj = ev.getSource().getTitle(oAppI18nModel);

			//setting label and tooltip to first part of the title
			oLabelMD.setText(oTitleObj.titleMD);
			//checking if second part i.e. unit currency is empty then setting tooltip as first part i.e. measure dimension
			var oTooltipMD = oTitleObj.titleUnitCurr == "" ? oTitleObj.titleQuickInfo || oTitleObj.titleMD : rb.getText("VIS_FILTER_TITLE_MD_WITH_UNIT_CURR", [ oTitleObj.titleQuickInfo || oTitleObj.titleMD, oTitleObj.titleUnitCurr]);
			oLabelMD.setTooltip(oTooltipMD);

			//setting label and tooltip to second part of the title
			oLabelUnitCurr.setText(oTitleObj.titleUnitCurr.length > 0 ? "| " + oTitleObj.titleUnitCurr : "");
			oLabelUnitCurr.setTooltip("");
			//setting the width of second part of the title based on unit and currency
			var oTitleObjSplitArr = oTitleObj.titleUnitCurr.split(" ");
			if (oTitleObj.titleUnitCurr == "") {
				oLabelUnitCurr.setVisible(false);
			} else {
				oLabelUnitCurr.setVisible(true);
				var oWidthUnitCurr = oTitleObjSplitArr.length > 1 ? "4.15rem" : "2.4rem";
				oLabelUnitCurr.setWidth(oWidthUnitCurr);
			}
		}
		this._updateVisualFilterAria(oCell, oFilterItem, oFilterItem.data("sOverlay"));
	};

	SmartVisualFilterBar.prototype._getSupportedFilterItemList = function() {
		// predefined set of controls, order preserved
		if (!this._supportedFilterItemList) {
			this._supportedFilterItemList = [{
					type: "Bar",
					//className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemChartBar",
					className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroBar",
					iconLink: "sap-icon://horizontal-bar-chart",
					textKey: "VISUAL_FILTER_CHART_TYPE_BAR"
				}, {
					type: "Donut",
					//className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemChartDonut",
					className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroDonut",
					iconLink: "sap-icon://donut-chart",
					textKey: "VISUAL_FILTER_CHART_TYPE_Donut"
				}, {
					type: "Line",
					//className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemChartLine",
					className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroLine",
					iconLink: "sap-icon://line-charts",
					textKey: "VISUAL_FILTER_CHART_TYPE_Line"
				}
			];
		}

		return this._supportedFilterItemList;
	};

	SmartVisualFilterBar.prototype._getSupportedFilterItemMap = function() {
		if (!this._supportedFilterItemMap) {
			this._supportedFilterItemMap = {};

			var compList = this._getSupportedFilterItemList();
			for (var i = 0; i < compList.length; i++) {
				var comp = compList[i];
				this._supportedFilterItemMap[comp.type] = comp;
			}
		}

		return this._supportedFilterItemMap;
	};

	SmartVisualFilterBar.prototype._resolveChartType = function(type) {
		var compMap = this._getSupportedFilterItemMap();

		var compInfo = compMap[type];
		if (!compInfo) {
			var aType;
			for (aType in compMap) {
				compInfo = compMap[aType];
				break;
			}

			oLogger.error("Could not resolve the filter component type: \"" + type + "\", falling back to " + aType);
			type = aType;
		}

		return type;
	};

	SmartVisualFilterBar.prototype._createFilterItemOfType = function(type, properties, bIsBar) {
		var compInst;
		var sId = StableIdHelper.getStableId({type: (bIsBar ? "VisualFilterBar" : "VisualFilterDialog"), subType: "FilterItemMicroChart", sProperty: properties.parentProperty});
		sId = this.getView().sId + "--" + sId;
		if (type === CHART_TYPE_BAR) {
			compInst  = new FilterItemMicroBar(sId,properties);
		} else if (type === CHART_TYPE_LINE) {
			compInst = new FilterItemMicroLine(sId,properties);
		} else if (type === CHART_TYPE_DONUT) {
			compInst = new FilterItemMicroDonut(sId,properties);
		}
		//var compInst = new compClass(properties); // Instantiate and apply properties
		compInst.setSmartFilterId(this.getSmartFilterId());	//Needed to fire parameterized query
		compInst.setModel(this.getModel('i18n'), 'i18n');
		compInst.setModel(this.getModel("_templPriv"), "_templPriv");
		if (!this._smartFilterContext.isDialogOpen()) {
			compInst.setModel(this.getModel('_filter'), '_filter');
			compInst.setModel(this.getModel('_visualFilterConfigModel'), "_visualFilterConfigModel");
		}
		compInst.setModel(this.getModel());
		var oVisualFilterModel = this.getModel("visualFilter");
		if (oVisualFilterModel) {
			compInst.setModel(oVisualFilterModel, "visualFilter");
		}
		//compInst._updateBinding();
		return compInst;
	};
	/**
	* Returns config for visual filter
	*
	* @param {boolean} bIsVariantConfig - if config should be for variant or not
	* @returns {object} config for the visual filter to determine behaviour of each filter item
	*/
	SmartVisualFilterBar.prototype.getConfig = function(bIsVariantConfig) {
		var config = this.getModel('_visualFilterConfigModel').getData(),
			oVariantConfig = {};

		if (!config) {
			return {filterCompList: []};
		}

		var itemIndex = 0;
		//var itemList = this.getContent();
		var itemList = sap.ui.getCore().byFieldGroupId("headerBar");
		for (var i = 0; i < config.filterCompList.length; i++) {
			var compConfig = config.filterCompList[i];
			if (bIsVariantConfig) {
				// generate config for variant management
				oVariantConfig[compConfig.component.properties.parentProperty] = {
					shownInFilterBar: compConfig.shownInFilterBar,
					shownInFilterDialog: compConfig.shownInFilterDialog,
					component: {
						type: compConfig.component.type,
						properties: {
							measureField: compConfig.component.properties.measureField,
							sortOrder: compConfig.component.properties.sortOrder,
							parentProperty: compConfig.component.properties.parentProperty
						}
					}
				};
			} else {
				// generate config for visual filter bar
				if (!compConfig.shownInFilterBar) {// If not shown, then no changes to collect, so go to the next
					continue;
				}

				// there will be a corresponding UI entry, ask for the latest configuration from each
				var item = itemList[itemIndex];
				if (!item) {
					oLogger.error("The configured selected filter bar items do not correspond to the actual filter bar items.  Could be an error during initialization, e.g. a chart class not found");
					return {filterCompList: []};
				}

				itemIndex++;
				if (item._chart) {
					var compInst = item;
					compConfig.component.properties = compInst.getP13NConfig();
				}
			}
		}

		return bIsVariantConfig ? oVariantConfig : config;
	};

	/////////////////////
	// Variant handling
	/////////////////////
	SmartVisualFilterBar.prototype.setSmartVariant = function(oSmartVariantId) {
		this.setAssociation("smartVariant", oSmartVariantId);

		if (oSmartVariantId) {
	        var oPersInfo = new PersonalizableInfo({
	            type: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.SmartVisualFilterBar",
	            keyName: "persistencyKey"
	        });
			oPersInfo.setControl(this);
		}

		this._oVariantManagement = this._getVariantManagementControl(oSmartVariantId);
		if (this._oVariantManagement) {
			this._oVariantManagement.addPersonalizableControl(oPersInfo);
			this._oVariantManagement.initialise(this._variantInitialised, this);
			this._oVariantManagement.attachSave(this._onVariantSave, this);
		} else if (oSmartVariantId) {
			if (typeof oSmartVariantId === "string") {
				oLogger.error("Variant with id=" + oSmartVariantId + " cannot be found");
			} else if (oSmartVariantId instanceof sap.ui.core.Control) {
				oLogger.error("Variant with id=" + oSmartVariantId.getId() + " cannot be found");
			}
		} else {
			oLogger.error("Missing SmartVariant");
		}
	};

	SmartVisualFilterBar.prototype._getVariantManagementControl = function(oSmartVariantId) {
		var oSmartVariantControl = null;
		if (oSmartVariantId) {
			oSmartVariantControl = typeof oSmartVariantId == "string" ? sap.ui.getCore().byId(oSmartVariantId) : oSmartVariantId;

			if (oSmartVariantControl && !(oSmartVariantControl instanceof SmartVariantManagement)) {
				oLogger.error("Control with the id=" + oSmartVariantId.getId ? oSmartVariantId.getId() : oSmartVariantId + " not of expected type");
				return null;
			}
		}
		return oSmartVariantControl;
	};

	SmartVisualFilterBar.prototype._variantInitialised = function() {
		if (!this._oCurrentVariant) {
			this._oCurrentVariant = "STANDARD";
		}
	};

	SmartVisualFilterBar.prototype._onVariantSave = function() {
		if (this._oCurrentVariant == "STANDARD") {// changes were made, so get the current configuration
			this._oCurrentVariant = {
				config: this.getConfig(true)
			};
		}
	};


	SmartVisualFilterBar.prototype.applyVariant = function(oVariantJSON, sContext) {
		this._oCurrentVariant = oVariantJSON;
		if (this._oCurrentVariant == "STANDARD") {
			this._oCurrentVariant = null;
		}
		// check if this is old variant
		// old variant used to store filterCompList in config
		if (this._oCurrentVariant && this._oCurrentVariant.config && this._oCurrentVariant.config.filterCompList) {
			// if old variant, set config to null so that annotations can be considered for the chart
			this._oCurrentVariant.config = null;
		}

		if (this._oCurrentVariant && this._oCurrentVariant.config == null) { // then STANDARD, but STANDARD variant was requested before annotations were ready
			var annoSettings = this._getAnnotationSettings();
			if (annoSettings && annoSettings.filterList) {
				this._oCurrentVariant.config = this._convertSettingsToConfig(annoSettings, true);
			}
		}

		this._updateFilterBar();

		//Need to unmark the dirty flag because this is framework
		//applying the variant and firing filter to update table/chart
		if (this._oVariantManagement) {
			this._oVariantManagement.currentVariantSetModified(false);
		}
	};

	SmartVisualFilterBar.prototype._getVariantConfig = function() {
		return this._oCurrentVariant;
	};

	SmartVisualFilterBar.prototype.fetchVariant = function() {
		if (!this._oCurrentVariant || this._oCurrentVariant == "STANDARD") {
			var annoSettings = this._getAnnotationSettings();
			if (annoSettings && annoSettings.filterList) {
				this._oCurrentVariant = {
					config: this._convertSettingsToConfig(annoSettings, true)
				};
				return this._oCurrentVariant;
			} else {
				return {
					config: null
				};
			}
		}

		return {
			config: this.getConfig(true)
		};
	};
	SmartVisualFilterBar.prototype._getStandardVariantConfig = function() {
		var oSettings = this._getAnnotationSettings();
		var oConfig = this._convertSettingsToConfig(oSettings);
		return oConfig;
	};
	/**
	 * Refresh the visual filter charts in SmartVisualFilterBar.
	 * Iterate over all the chart items in VisualFilters and call their _updateBinding methods.
	 */
	SmartVisualFilterBar.prototype.updateVisualFilterBindings = function(bAllowBindingUpdateOnPropertyChange, bUpdateBindingInDialog){
		//update chart bindings only in the dialog
		if (bUpdateBindingInDialog) {
			for (var i in this.filterChartList) {
				var chartItem = this.filterChartList[i];
				if (chartItem._chart) {
					chartItem._updateBinding();
					chartItem._bAllowBindingUpdateOnPropertyChange = bAllowBindingUpdateOnPropertyChange === true;
				}
			}
		} else {//update chart bindings in the filterbar
			var itemList = sap.ui.getCore().byFieldGroupId("headerBar");
			for (var i = 0; i < itemList.length; i++) {
				if (itemList[i]._chart) {
					itemList[i]._updateBinding();
					itemList[i]._bAllowBindingUpdateOnPropertyChange = bAllowBindingUpdateOnPropertyChange === true;
				}
			}
		}
	};

	/**
	 * searches for the controls view
	 *
	 * @returns {sap.ui.core.mvc.View} The found parental View
	 * @private
	 */
	SmartVisualFilterBar.prototype.getView = function () {
		if (!this._oView) {
			var oObj = this.getParent();
			while (oObj) {
				if (oObj instanceof sap.ui.core.mvc.View) {
					this._oView = oObj;
					break;
				}
				oObj = oObj.getParent();
			}
		}
		return this._oView;
	};

	/**
	* Function to update the visual filter bar
	*
	* @param {array} aProperties - array of properties for which visual filter item should be added to BasicArea
	* @return {boolean} true if filter successfully added to basic area else false
	*/
	SmartVisualFilterBar.prototype.addVisualFiltersToBasicArea = function(aProperties) {
		var config = deepExtend({}, this.getModel('_visualFilterConfigModel').getData()),
		iPropertiesLength = (aProperties && aProperties.constructor === Array && aProperties.length) ? aProperties.length : 0,
		iCountFiltersAddedtoBasicArea = 0;

		if (!config) {
			oLogger.error("Could not add filter to basic area. No config found!");
			return false;
		} else if (!iPropertiesLength) {
			oLogger.error("Improper parameter passed. Pass an array of properties.");
			return false;
		} else {
			for (var i = 0; i < config.filterCompList.length; i++) {
				var compConfig = config.filterCompList[i];
				if (aProperties.indexOf(FilterUtil.readProperty(compConfig.component.properties.parentProperty)) !== -1 && !compConfig.shownInFilterBar) {
					compConfig.shownInFilterBar = true;
					compConfig.shownInFilterDialog = true;
					iCountFiltersAddedtoBasicArea++;
				}
			}

			if (iCountFiltersAddedtoBasicArea) {
				// set the data
				this.getModel('_visualFilterConfigModel').setData(config);
				return true;
			} else {
				oLogger.info("Filters already present in visual filter basic area");
				return false;
			}
		}
	};

	/**
	 * Retrieves the list of options that needs to be fed into DynamicDateRange control
	 *
	 * @param {string} sFilterKey Current property
	 * @returns {array} The list of options that needs to be fed into DynamicDateRange control
	 * @public
	 */
	 SmartVisualFilterBar.prototype.getSmartFilterBarControlOptions = function (sFilterKey) {
		var oCtrlConf = this._smartFilterContext.getAggregation("filterGroupItems").filter(function (ctrlConf) {
			return ctrlConf.getName() === sFilterKey;
		})[0];
		return oCtrlConf.getControl().getOptions();
	};

	return SmartVisualFilterBar;
}, /* bExport= */true);
