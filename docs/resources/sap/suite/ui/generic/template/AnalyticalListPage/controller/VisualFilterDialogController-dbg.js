sap.ui.define([
		"sap/m/Button", "sap/m/Label", "sap/m/Dialog", "sap/m/Bar", "sap/m/SearchField", "sap/m/Text",
		"sap/m/Toolbar", "sap/m/ToolbarSpacer", "sap/m/Title", "sap/m/VBox", "sap/m/HBox", "sap/m/CheckBox",
		"sap/m/Link", "sap/m/List", "sap/m/CustomListItem", "sap/m/StandardListItem", "sap/m/Popover",
		"sap/ui/layout/GridData",
		"sap/ui/core/mvc/Controller", "sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
		"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",'sap/ui/model/Filter',
		"sap/suite/ui/generic/template/AnalyticalListPage/controller/DropDownController",
		"sap/suite/ui/generic/template/AnalyticalListPage/controller/DynamicDateRangeController",
		"sap/m/OverflowToolbarButton",
		"sap/ui/model/json/JSONModel",
		"sap/m/OverflowToolbar", "sap/m/OverflowToolbarLayoutData",
		"sap/ui/core/CustomData",
		"sap/ui/Device", "sap/m/library", "sap/ui/core/library",
	    "sap/ui/model/FilterOperator", "sap/m/DatePicker", "sap/suite/ui/generic/template/genericUtilities/FeLogger",
        "sap/ui/core/InvisibleText",
		"sap/base/util/deepEqual",
		"sap/suite/ui/generic/template/js/StableIdHelper",
		"sap/base/util/extend",
		"sap/base/util/deepExtend",
		"sap/m/DynamicDateRange"
	], function(Button, Label, Dialog, Bar, SearchField, Text, Toolbar, ToolbarSpacer, Title,
			VBox, HBox, CheckBox, Link, List, CustomListItem, StandardListItem, Popover,
			GridData, Controller, FilterUtil, V4Terms, Filter, DropDownController, DynamicDateRangeController, OverflowToolbarButton, JSONModel,
			OverflowToolbar, OverflowToolbarLayoutData, CustomData, Device, SapMLibrary, SapCoreLibrary, FilterOperator, DatePicker, FeLogger, InvisibleText, deepEqual, StableIdHelper, extend, deepExtend, DynamicDateRange) {
	"use strict";

	var ListSeparators = SapMLibrary.ListSeparators;
	var oFeLogger = new FeLogger("AnalyticalListPage.controller.VisualFilterDialogController");
	var oLogger = oFeLogger.getLogger();
	var oLevel = oFeLogger.Level;

	var BASIC_GROUP = "_BASIC";

	// Chart Default Settings
	var chartWidth = "100%";
	var labelWidthPercent = 0.33;
	var labelWidthPercentDonut = 0.5; //Donut should cover half the area

	var vfdController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController", {
		/**
		 * Initialize the control
		 *
		 * @public
		 * @param {oState} oState - state of the application
		 */
		init: function(oState) {
			oLogger.setLevel(oLevel.WARNING, "VisualFilter");
			this.oState = oState;
			this.oRb = oState.alr_visualFilterContainer.getModel('i18n').getResourceBundle();
			//this.bIsTimeBasedLine;
			//this.bSortOrder;
		},
		_createForm: function() {
			// store as a string to parse later ad restore
			// since cloning via jquery extend is not working on json model
			this._searchTriggered = false;
			this._restoreTriggered = false;
			var oVisualFilterDialogModel = new JSONModel();
			var visualFilterBarConfigModel = this.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel');
			this._initialFilters = this.oState.alr_visualFilterBar.getModel("_filter").getJSON();
			this.oConfig =  JSON.parse(visualFilterBarConfigModel.getJSON());
			oVisualFilterDialogModel.setData(this.oConfig);
			this.filterCompList = [];
			this.filterChartList = [];
			this._buildFiltersFromConfig(true);
			// set active filters to true depending on smart filter bar selection
			this._setVisualFiltersToActive();
			var _filterModel = new JSONModel();
			_filterModel.setData(JSON.parse(this._initialFilters));
			this.oVerticalBox = new VBox();
			this.oVerticalBox.setModel(this.oState.oController.getView().getModel("_templPriv"), "_templPriv");
			this.oVerticalBox.setModel(this.oState.oController.getView().getModel());
			this.oVerticalBox.setModel(this.oState.oController.getView().getModel("i18n"), "i18n");
			//use separate model in dialog from that of filterbar to update filters
			this.oVerticalBox.setModel(_filterModel, "_dialogFilter");
			//use separate model in dialog from that of filterbar to update vf configuration
			this.oVerticalBox.setModel(oVisualFilterDialogModel, '_visualFilterDialogModel');
			this._addGroupsAndFilters();
			this.oVerticalBox.addEventDelegate({
				onAfterRendering : function(oEvent) {
					if (oEvent.srcControl && oEvent.srcControl.getParent()) {
						oEvent.srcControl.getParent().isPopupAdaptationAllowed = function() { return true; };
					}
				}
			});
			return this.oVerticalBox;
		},

		_toggle: function(sMode) {
			var oTemplatePrivate = this.oState.oController.getView().getModel("_templPriv");
			if (sMode && (sMode === "visual")) {
				oTemplatePrivate.setProperty("/alp/filterDialogMode", "visual");
				if (this.oState.alr_visualFilterBar.getLazyLoadVisualFilter()) {
					this.oState.alr_visualFilterBar.updateVisualFilterBindings.apply(this, [true, true]);
				}
			} else {
				oTemplatePrivate.setProperty("/alp/filterDialogMode", "group");
				if (!this.oState.alr_visualFilterBar.getAssociateValueListsCalled()) {
					this.oState.alr_visualFilterBar.setAssociateValueListsCalled(true);
					this.oState.oSmartFilterbar.associateValueLists();
				}
			}
		},

		_searchDialog: function() {
			//only update the flag on search event and update visual filters on close of the dialog
			this._searchTriggered = true;
			if (this.bSearchPendingAfterDialogFilterChange) {
				this.bSearchPendingAfterDialogFilterChange = false;
				this.oState.oSmartFilterbar.search();
			}
		},
		/*
			called on go and save to update the filter bar with the changes made in dialog
		*/
		_updateFilterBarFromDialog: function() {
			var	oFilterBarFilterModel = this.oState.alr_visualFilterBar.getModel('_filter'),
				oDialogFilterModel = this.oVerticalBox.getModel('_dialogFilter'),
				isFiltersSame = deepEqual(oFilterBarFilterModel.getJSON(), oDialogFilterModel.getJSON());
			if (!isFiltersSame) {
				oFilterBarFilterModel.setData(JSON.parse(oDialogFilterModel.getJSON()));
			}
			var oVisualFilterConfigModel = this.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel'),
				oDialogConfigModel = this._getDialogConfigModel(),
				isConfigSame = deepEqual(oVisualFilterConfigModel.getJSON(), oDialogConfigModel.getJSON());
			if (!isConfigSame) {
				oVisualFilterConfigModel.setData(JSON.parse(oDialogConfigModel.getJSON()));
				this.oState.alr_visualFilterBar.updateVisualFilterBindings(true);
			}
			if (this.oState.alr_visualFilterBar.getLazyLoadVisualFilter()) {
				this.oState.alr_visualFilterBar.updateVisualFilterBindings(true);
			}
		},
		_closeDialog: function(oEvent) {
			if (oEvent.getParameter("context") === "SEARCH") {
				this._updateFilterBarFromDialog();
				if (this._restoreTriggered) {
					//restore the app to the standard / saved variant state
					//only after Go.
					this._restoreTriggered = false;
					this.oState.filterBarController._afterSFBVariantLoad();
				}
			}
			this.oVerticalBox.destroyItems();
		},
		_restoreDialog: function() {
			// restore visual filter bar
			var oVariantConfig = this.oState.alr_visualFilterBar._oCurrentVariant.config;
			//in case of saved variant
			if (oVariantConfig) {
				//this.oConfig = this.oState.alr_visualFilterBar.getConfig();
				this.oConfig.filterCompList.forEach(function (element) {
					// if parent property exists in variant json override config
					if (oVariantConfig[element.component.properties.parentProperty]) {
						deepExtend(element, oVariantConfig[element.component.properties.parentProperty]);
					}
				});
			} else {
				//in case of standard variant
				this.oConfig = this.oState.alr_visualFilterBar._getStandardVariantConfig();
			}
			this._getDialogConfigModel().setData(this.oConfig);
			this._reloadForm();
			this._restoreTriggered = true;
			this.bSearchPendingAfterDialogFilterChange = false;
		},
		_cancelDialog: function() {
			if (this.bSearchPendingAfterDialogFilterChange) {
				this.bSearchPendingAfterDialogFilterChange = false;
			}
		},
		_buildFiltersFromConfig: function(bIsVisible) {
			var i;
			this.filterCompList = [];
			this.filterChartList = [];
			for (i = 0; i < this.oConfig.filterCompList.length; i++) {
				var aSortOrder = this.oConfig.filterCompList[i].component.properties.sortOrder;

				if (aSortOrder.constructor === Object && aSortOrder.value) {
					this.oConfig.filterCompList[i].component.properties.sortOrder = aSortOrder.value;
				}

				this.filterCompList.push({
					obj: {
						shownInFilterBar: this.oConfig.filterCompList[i].shownInFilterBar,
						shownInFilterDialog: this.oConfig.filterCompList[i].shownInFilterDialog,
						cellHeight: this.oConfig.filterCompList[i].cellHeight,
						component: {
							type: this.oConfig.filterCompList[i].component.type,
							cellHeight: this.oConfig.filterCompList[i].component.cellHeight
						},
						group: {
							label: this.oConfig.filterCompList[i].group.label,
							name: this.oConfig.filterCompList[i].group.name
						}
					},
					//Update searchVisible based on results of search in filter dialog
					searchVisible: bIsVisible === true || this.oConfig.filterCompList[i].searchVisible === undefined || this.oConfig.filterCompList[i].searchVisible
				});
			}
		},

		_setVisualFiltersToActive: function() {
			var oInitialFilters = JSON.parse(this._initialFilters);
			for (var i = 0; i < this.oConfig.filterCompList.length; i++) {
				var oFilterComp = this.oConfig.filterCompList[i];
				var sParentProperty = oFilterComp.component.properties.parentProperty;
				if (typeof oInitialFilters[sParentProperty] === "string" && oInitialFilters[sParentProperty]) {
					oFilterComp.component.properties.activeVisualFilters = true;
				} else if (typeof oInitialFilters[sParentProperty] === "object" && oInitialFilters[sParentProperty] && oInitialFilters[sParentProperty].items.length) {
					oFilterComp.component.properties.activeVisualFilters = true;
				} else {
					oFilterComp.component.properties.activeVisualFilters = false;
				}
			}
		},

		_rebuildConfig: function() {
			var i;
			var config = {
					filterCompList: []
				};
			for (i = 0; i < this.filterCompList.length; i++) {
				config.filterCompList.push({
					shownInFilterBar: this.filterCompList[i].obj.shownInFilterBar && this.filterCompList[i].obj.shownInFilterDialog,
					shownInFilterDialog: this.filterCompList[i].obj.shownInFilterDialog,
					cellHeight: this.filterCompList[i].obj.cellHeight,
					group: {
						label: this.filterCompList[i].obj.group.label,
						name: this.filterCompList[i].obj.group.name
					},
					component: {
						type: this.filterCompList[i].obj.component.type,
						cellHeight: this.filterCompList[i].obj.component.cellHeight,
						properties: {
							scaleFactor: this.filterChartList[i].getScaleFactor(),
							numberOfFractionalDigits: this.filterChartList[i].getNumberOfFractionalDigits(),
							sortOrder: this.filterChartList[i].getSortOrder(),
							filterRestriction: this.oConfig.filterCompList[i].component.properties.filterRestriction,
							entitySet: this.filterChartList[i].getEntitySet(),
							isDropDown: this.oConfig.filterCompList[i].component.properties.isDropDown,
							width: this.oConfig.filterCompList[i].component.properties.width,
							height: this.oConfig.filterCompList[i].component.properties.height,
							dimensionField: this.filterChartList[i].getDimensionField(),
							dimensionFieldDisplay: this.filterChartList[i].getDimensionFieldDisplay(),
							dimensionFieldIsDateTime: this.filterChartList[i].getDimensionFieldIsDateTime(),
							dimensionFilter: this.filterChartList[i].getDimensionFilter(),
							unitField: this.filterChartList[i].getUnitField(),
							isCurrency: this.filterChartList[i].getIsCurrency(),
							isMandatory: this.oConfig.filterCompList[i].component.properties.isMandatory,
							measureField: this.filterChartList[i].getMeasureField(),
							outParameter: this.oConfig.filterCompList[i].component.properties.outParameter,
							inParameters: this.oConfig.filterCompList[i].component.properties.inParameters,
							parentProperty: this.oConfig.filterCompList[i].component.properties.parentProperty,
							chartQualifier: this.oConfig.filterCompList[i].component.properties.chartQualifier
						}
					}
				});
			}
			return config;
		},
		/*
		* @private
		* Destroys all the items in the verticalBox and recreates filters and groups it.
		*/
		_reloadForm : function () {
			this.oVerticalBox.destroyItems();
			this._buildFiltersFromConfig();
			this._addGroupsAndFilters();
		},
		/*
		* @private
		* adds group containers and filters based on visual filters and hidden filters that exists
		*/
		_addGroupsAndFilters: function() {
			var i;
			var groupName;
			var groupContainer;
			var groupList = [];
			var filtersGroupCount = 0;
			//this._mergeFilters();
			for (i = 0; i < this.filterCompList.length; i++) {
				if (!Array.isArray(this.filterCompList[i])) {
					if (this.filterCompList[i].searchVisible === false) {
						continue;
					}
					//get the group name of the filter and add it to appropriate group container
					if (!(groupList.indexOf(this.filterCompList[i].obj.group.name) > -1)) {
						if (groupContainer) {
							this.oVerticalBox.addItem(groupContainer);
						}
						groupName = this.filterCompList[i].obj.group.name;
						groupList.push(groupName);
						groupContainer = new List({showSeparators: "None", showNoData: false});
						groupContainer.setWidth("100%");
						groupContainer.setLayoutData(new GridData({
							span: "L12 M12 S12"
						}));
						groupContainer.addStyleClass("sapUiSmallMarginTop");
						filtersGroupCount++;
						this._addGroupToolbar(groupContainer,  this.filterCompList[i].obj.group.label, this.filterCompList[i].obj.group.name);
					}
					if (this.filterCompList[i].obj.shownInFilterDialog) {
						// Add toolbar and chart only if filters are visible
						this.filterCompList[i].toolbar = this._addChartCustomToolbar(this.oConfig.filterCompList[i], i);
						//this.filterChartList[i] = this._addChart(this.oConfig.filterCompList[i].component.type, this.oConfig.filterCompList[i].component.properties, i);

						var that = this,
						oFilterItemBox = new VBox(),
						sParentProperty = this.oConfig.filterCompList[i].component.properties.parentProperty;

						oFilterItemBox.setModel(this._getDialogConfigModel(), '_visualFilterDialogModel');
						oFilterItemBox.bindAggregation('items', {
							path: "_visualFilterDialogModel>/filterCompList",
							factory: function (sId, oContext) {
								var sChartType = oContext.getProperty('component/type'),
								oProperties = oContext.getProperty('component/properties'),
								iIndex = oContext.getPath().split("/")[2];
								this.filterChartList[iIndex] = this._addChart(sChartType, oProperties, iIndex);
								return this.filterChartList[iIndex];
							}.bind(this),
							//Filter the items based on shownInFilterBar=true
							filters: new Filter("component/properties/parentProperty", FilterOperator.EQ, sParentProperty)
						});
						sParentProperty = FilterUtil.getParameter(sParentProperty);
						var sId = "visualFilterDialogInvisibleText" + sParentProperty;
						var oInvisibleText = new InvisibleText({id : sId});
						var sShowInFBCheckBoxId = this.filterChartList[i].getParentProperty().replace(/[^\w]/gi, '') + "checkBox";
						var item = [
							new VBox({
								items: [
									that.filterCompList[i].toolbar,
									oFilterItemBox,
									oInvisibleText
								]
							}).setWidth("100%").addStyleClass("sapUiSmallMarginBegin")
						];
						//Create a new Vbox for ShowOnFilterBar only in case of Desktop
						if (Device.system.desktop) {
							//moving the checkbox vbox to the 0th index and visualfilter vbox to 1th index
							item.splice(0,0,
							new VBox({
								items: [
								new Label({
									text: "{i18n>SHOW_ON_FILTER_BAR}",
									labelFor: sShowInFBCheckBoxId,
									wrapping: true
								}).addStyleClass("sapUiTinyMarginTop"),
								new CheckBox({
									id: sShowInFBCheckBoxId,
									text: "",
									selected: that.oConfig.filterCompList[i].shownInFilterBar
								}).data("idx", i).attachSelect(null, that._onCheckBoxSelect, that)
								]
							}).setAlignItems("Center"));
							item[0].setWidth("20%");
							item[1].setWidth("80%");
						}
						var oChartBox = new HBox({
							items : item
						}).addStyleClass("sapUiSmallMarginTop").setWidth("100%");
						if (Device.system.desktop) {
							FilterUtil._updateVisualFilterAria(oChartBox && oChartBox.getItems()[1]);
						} else {
							FilterUtil._updateVisualFilterAria(oChartBox && oChartBox.getItems()[0]);
						}
						var oCustomListItem = new CustomListItem({
							id: StableIdHelper.getStableId({type: "VisualFilterDialog", subType: "FilterItemContainer", sProperty: sParentProperty}),
							content: oChartBox
						});
						oCustomListItem.attachBrowserEvent("keyup",FilterUtil.onKeyUpVisualFilter.bind(FilterUtil));
						oCustomListItem.attachBrowserEvent("keydown",FilterUtil.onKeyDownVisualFilter.bind(FilterUtil, this.oState.oSmartFilterbar));
						groupContainer.addItem(oCustomListItem);
					}
				}
				//add to dialog
				if (groupContainer) {
					this.oVerticalBox.addItem(groupContainer);
				}
			}
			if (filtersGroupCount == 1 && groupName === BASIC_GROUP) {
				//this method is used to hide the ToolBar if it is the only one and its title is BASIC_GROUP
				FilterUtil.executeFunction(groupContainer, "mAggregations.headerToolbar.setVisible", [false]);
			}
			if (this.oVerticalBox.getItems() && !this.oVerticalBox.getItems().length) {
				// add a No Data Div to VisualFilterDialog
				var noDataText = new Text({text: "{i18n>NODATA_ADAPTFILTERDIALOG}", width: "100%", textAlign: SapCoreLibrary.TextAlign.Center}).addStyleClass("sapUiSmallMarginTopBottom");
				this.oVerticalBox.addItem(noDataText);
			}
		},

		_onCheckBoxSelect: function(oEvent) {
			var idx = oEvent.getSource().data("idx");
			this.selectCheckBox(idx, oEvent.getSource().getSelected());
			if (this.currentDropdownSelection === "visible" || this.currentDropdownSelection === "visibleactive") {
				this._reloadForm();
			}
		},

		/*
		* @private
		* adds a group container for the group to which visual filter belongs
		* @param {object} groupContainer - box containing all visual filters under a group
		* @param {string} groupTitle - title for the groupContainer
		* @param {string} groupName - name of the group
		*/
		_addGroupToolbar: function(groupContainer, groupTitle, groupName) {
			var oGroupTitle = new Title({text: groupTitle}).addStyleClass("sapSmartTemplatesAnalyticalListPageVFDialogGroupTitle");
			var groupToolbar = new Toolbar({
				content: [
					oGroupTitle,
					new ToolbarSpacer()
				]
			});
			if (groupName != BASIC_GROUP) {
				groupToolbar.addContent(this._createMoreFiltersLink(groupName, oGroupTitle));
			}
			groupContainer.setHeaderToolbar(groupToolbar);
		},
		/*
		* @public
		* Function to update shownInFilterBar according to visibility of filteritems/checkbox selection
		* @param {number} idx - index of the filterCompList[]
		* @param {boolean} bVisible - true or false value for vilibility
		*/
		selectCheckBox : function (idx, bVisible) {
			var oVisualFilterDialogModel = this._getDialogConfigModel();
			var oVisualFilterDialogModelClone = deepExtend({}, oVisualFilterDialogModel);
			oVisualFilterDialogModelClone.setProperty('/filterCompList/' + idx + '/shownInFilterBar', bVisible);
			// Remove card from dialog
			oVisualFilterDialogModelClone.setProperty('/filterCompList/' + idx + '/searchVisible', bVisible);
			oVisualFilterDialogModel.setData(oVisualFilterDialogModelClone.getData());
			//update config object when VFConfig model is updated
			this.oConfig = oVisualFilterDialogModel.getData();
			//to enable Restore button on change of chart type, sort order, measure field and  show in filter bar changes
			this.oState.oSmartFilterbar._oVariantManagement.currentVariantSetModified(true);
		},

		_formatTitle: function(titleObj, type){
			var rb = this.oVerticalBox.getModel("i18n").getResourceBundle();
			var titleMD = titleObj.titleMD;
			var titleUnitCurr = titleObj.titleUnitCurr;
			if (type === "tooltipMD") {
				return titleUnitCurr == "" ? titleMD : rb.getText("VIS_FILTER_TITLE_MD_WITH_UNIT_CURR", [titleMD, titleUnitCurr]);
			} else if (type === "titleUnitCurr") {
				return titleUnitCurr.length > 0 ? "| " + titleUnitCurr : "";
			}
		},

		_addChartCustomToolbar: function(obj, idx) {
			var that = this;
			//This var would be needed to distinguish option button on line chart
			//var isItLineChart = (obj.component.type === "Line");
			var oAppI18nModel = this.oState.oController.getView().getModel("@i18n");
			var sParentProperty = obj.component.properties.parentProperty,
			props = obj.component.properties,
			dimLabel = FilterUtil.getPropertyNameDisplay(this.oState.alr_visualFilterBar.getModel(), obj.component.properties.entitySet, obj.component.properties.dimensionField, oAppI18nModel),
			sToolbarButtonsIdParentProperty = sParentProperty.replace(/[^\w]/gi, ''),
			sToolbarButtonsIdEntityType = this.oState.alr_visualFilterBar._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(obj.component.properties.entitySet),
			sortDescending = obj.component.properties.sortOrder[0].Descending.Boolean, //Inorder to consider the sort Order of only the first property
			bIsSortOrderButtonHidden = FilterUtil.readProperty(obj, "component.type") === "Line" && FilterUtil.readProperty(obj, "component.properties.dimensionFieldIsDateTime"),
			chartType = this.oState.alr_visualFilterBar._resolveChartType(obj.component.type),
			chartTypeIcon = this._getChartTypeIconLink(chartType),
			rb = this.oVerticalBox.getModel("i18n").getResourceBundle(),
			titleObj = that._getChartTitle(obj, idx),
			titleMD = new Title({
				text: titleObj.titleMD,
				tooltip: this._formatTitle(titleObj, "tooltipMD"),
				titleStyle: SapCoreLibrary.TitleLevel.H6
			}),
			titleUnitCurr = new Title({
				text: this._formatTitle(titleObj, "titleUnitCurr"),
				tooltip: "",
				titleStyle: SapCoreLibrary.TitleLevel.H6
			});
			if (this.oConfig.filterCompList[idx].component.properties.isMandatory) {
				titleMD.addStyleClass("sapSmartTemplatesAnalyticalListPageRequired");
			}
			var getMeasuresButtonEnablement = function() {
				var collectionPath = this.oConfig.filterCompList[idx].component.properties.entitySet,
					hiddenMeasures = this._getVisibleMeasureList(collectionPath),
					bEnable = Object.keys(hiddenMeasures).length > 1;
				if (!bEnable) {
					oLogger.warning("Change measure button has been disabled in the dialog as only one visible measure exists in the collection " + collectionPath);
				}
				return bEnable;
			};
			//Get the input control for corresponding property needed to fire valuehelp request
			var oInput = this.oState.oSmartFilterbar.determineFilterItemByName(obj.component.properties.parentProperty).getControl();
			//ensure that value help annotations are loaded
			this.oState.oSmartFilterbar.ensureLoadedValueHelp(obj.component.properties.parentProperty);
			//Value help button is needed only if input control is defined
			var bIsValuehelp = oInput.getShowValueHelp && oInput.getShowValueHelp() && !props.dimensionFieldIsDateTimeOffset, //disable valuehelp for multi-input date time fields
			bIsDatePicker = oInput instanceof DatePicker,
			bIsDateTimePicker = oInput.getMetadata && oInput.getMetadata().getName() === "sap.m.DateTimePicker",
			oDateSettings = this.oState.alr_visualFilterBar.getFilterSettings() && this.oState.alr_visualFilterBar.getFilterSettings().dateSettings ? this.oState.alr_visualFilterBar.getFilterSettings().dateSettings : null, 
			bIsDatePicker = oInput instanceof DatePicker,
			bIsDynamicDateRange = false, oDynamicDateRange = null;
			if (!bIsDatePicker && oInput instanceof DynamicDateRange && oDateSettings && (Object.keys(oDateSettings).length > 0) &&  props["filterRestriction"] === 'single') {
				if (oDateSettings.useDateRange) {
					bIsDynamicDateRange = true;
				} else if (!oDateSettings.useDateRange && (oDateSettings.selectedValues || (oDateSettings.fields && (Object.keys(oDateSettings.fields).length > 0) && !oDateSettings.fields[sParentProperty]))) {
					bIsDynamicDateRange = true;
					var aControlOptions = that.oState.alr_visualFilterBar.getSmartFilterBarControlOptions(sParentProperty);
					oDynamicDateRange = DynamicDateRangeController.createDynamicDateRange(aControlOptions);
				}
			}
			var sShowDateOrDynamicDate = "";
			if (bIsDatePicker && !bIsDateTimePicker) {
				sShowDateOrDynamicDate = "sap-icon://appointment-2";
			} else if (bIsDynamicDateRange) {
				sShowDateOrDynamicDate = "sap-icon://check-availability";
			}
			var sShowDropdown = (props.isDropDown) ? "sap-icon://slim-arrow-down" : "",
			sIcon = bIsValuehelp ? "sap-icon://value-help" : sShowDateOrDynamicDate || sShowDropdown,
			sPrefixId = this.oState.alr_visualFilterBar.getView().sId,parentProperty;
			if (props.isParameter) {
				parentProperty = FilterUtil.getParameter(sParentProperty);
			} else {
				parentProperty = props.parentProperty;
			}
			var sId = sPrefixId + "--" + StableIdHelper.getStableId({type: "VisualFilterDialog", subType: "ValueHelpButton", sProperty: parentProperty}),
			count,
			items = [
					new Button({
						type: "Transparent",
						icon: "sap-icon://line-chart-time-axis",
						visible: false, //isItLineChart To drop support for this button in Wave 15
						press: function(oEvent) {
							that._showLineChartTimeAxisPopup(oEvent);
						}
					}).data("idx", idx),
					new Button({
						id: sId,
						type: "Transparent",
						icon: (bIsValuehelp || props.isDropDown || bIsDatePicker || bIsDynamicDateRange) ? sIcon : "",
						customData: [
							new CustomData({
								key: 'isF4Enabled',
								value: (bIsValuehelp || props.isDropDown || bIsDatePicker || bIsDynamicDateRange) ? true : false
							})
						],
						visible: {
							path: "_dialogFilter>/" + sParentProperty,
							formatter: function(oContext) {
								if (bIsValuehelp || props.isDropDown || (bIsDatePicker && !bIsDateTimePicker) || bIsDynamicDateRange) { //for valuehelp,Drop Down & DatePicker
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
						text: {
							path: "_dialogFilter>/" + sParentProperty,
							formatter: function(oContext) {
								var filterItem = that.filterChartList[idx];
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
											if (oContext.items) {	//items can be null
												count += oContext.items.length;
											}
											//Add ranges
											if (oContext.ranges) {	//ranges can be null
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
						enabled: {
							path: '_visualFilterDialogModel>/filterCompList/' + idx + '/showChartOverlay',
							formatter: function(bValue) {
								return !bValue;
							}
						},
						press: function(oEvent) {
							if (bIsValuehelp) {
								if (!that.oState.alr_visualFilterBar.getAssociateValueListsCalled()) {
									that.oState.alr_visualFilterBar.setAssociateValueListsCalled(true);
									that.oState.oSmartFilterbar.attachEventOnce("valueListAnnotationLoaded", function() {
										oInput.fireValueHelpRequest();
									});
									that.oState.oSmartFilterbar.associateValueLists();
								} else {
									oInput.fireValueHelpRequest();
								}
							} else if (props.isDropDown) {
								var bIsEntitySearchable = that.oState.alr_visualFilterBar._isDimensionFieldFilterable(this.getModel(), props.entitySet, props.dimensionField),
								oModel = this.getModel("visualFilter") || this.getModel();
								DropDownController.createDropdown(oEvent.getSource(), that.filterChartList[oEvent.getSource().data("idx")], oModel, dimLabel, props, bIsEntitySearchable);
							} else if (bIsDatePicker && !bIsDateTimePicker) {
								//DatePickerController._createDatePicker(oEvent.getSource(), that.filterChartList[oEvent.getSource().data("idx")]);
							} else if (bIsDynamicDateRange) {
								DynamicDateRangeController.openDynamicDateRange(oEvent.getSource(), that.filterChartList[oEvent.getSource().data("idx")]);
							} else {
								sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController.launchAllFiltersPopup(oEvent.getSource(), that.filterChartList[oEvent.getSource().data("idx")], oEvent.getSource().getModel('i18n'));
							}
						},
						tooltip: {
							path: "_dialogFilter>/" + sParentProperty,
							formatter: function() {
								return FilterUtil.getTooltipForValueHelp(bIsValuehelp, dimLabel, rb, count, bIsDatePicker || bIsDynamicDateRange);
							}
						},
						layoutData: new OverflowToolbarLayoutData({
							priority: SapMLibrary.OverflowToolbarPriority.NeverOverflow
						}),
						ariaHasPopup: SapCoreLibrary.aria.HasPopup.Dialog
					}).data("idx",idx),
					new OverflowToolbarButton({
						//Stable ID for Sort Order
						id: sPrefixId + "--template::VisualFilterDialog::SortOrderChangeButton::" + sToolbarButtonsIdEntityType + "::" + sToolbarButtonsIdParentProperty,
						type: "Transparent",
						icon: (sortDescending ? "sap-icon://sort-descending" : "sap-icon://sort-ascending"),
						visible: !bIsSortOrderButtonHidden,
						tooltip:"{i18n>VISUAL_FILTER_SORT_ORDER}",
						text:"{i18n>VISUAL_FILTER_SORT_ORDER}",
						press: function(oEvent) {
							that._showChartSortPopup(oEvent);
						},
						layoutData: new OverflowToolbarLayoutData({
							closeOverflowOnInteraction: false,
							priority: (!Device.system.desktop) ? SapMLibrary.OverflowToolbarPriority.AlwaysOverflow : SapMLibrary.OverflowToolbarPriority.High
						}),
						ariaHasPopup: SapCoreLibrary.aria.HasPopup.Dialog
					}).data("idx", idx),
					new OverflowToolbarButton({
						//Stable ID for Chart Type
						id: sPrefixId + "--template::VisualFilterDialog::ChartTypeChangeButton::" + sToolbarButtonsIdEntityType + "::" + sToolbarButtonsIdParentProperty,
						type: "Transparent",
						icon: chartTypeIcon,
						tooltip:"{i18n>VISUAL_FILTER_CHART_TYPE}",
						text:"{i18n>VISUAL_FILTER_CHART_TYPE}",
						press: function(oEvent) {
							that._showChartTypesPopup(oEvent);
						},
						layoutData: new OverflowToolbarLayoutData({
							closeOverflowOnInteraction: false,
							priority: (!Device.system.desktop) ? SapMLibrary.OverflowToolbarPriority.AlwaysOverflow : SapMLibrary.OverflowToolbarPriority.High
						}),
						ariaHasPopup: SapCoreLibrary.aria.HasPopup.Dialog
					}).data("idx", idx),
					new OverflowToolbarButton({
						//Stable ID for measure field
						id: sPrefixId + "--template::VisualFilterDialog::MeasureChangeButton::" + sToolbarButtonsIdEntityType + "::" + sToolbarButtonsIdParentProperty,
						type: "Transparent",
						icon: "sap-icon://measure",
						tooltip:"{i18n>VISUAL_FILTER_MEASURE}",
						text:"{i18n>VISUAL_FILTER_MEASURE}",
						enabled: getMeasuresButtonEnablement.apply(that),
						press: function(oEvent) {
							that._showChartMeasuresPopup(oEvent);
						},
						layoutData: new OverflowToolbarLayoutData({
							closeOverflowOnInteraction: false,
							priority: (!Device.system.desktop) ? SapMLibrary.OverflowToolbarPriority.AlwaysOverflow : SapMLibrary.OverflowToolbarPriority.High
						}),
						ariaHasPopup: SapCoreLibrary.aria.HasPopup.Dialog
					}).data("idx", idx)
			];
			if ((Device.system.tablet || Device.system.phone) && !Device.system.desktop) { //Makes sure ShowOnFilterBar Checkbox goes into overflow only for Mobile and Tablet and not for Desktop
				items.splice(2,0,
					new CheckBox({
						tooltip: "{i18n>SHOW_ON_FILTER_BAR}",
						text: "{i18n>SHOW_ON_FILTER_BAR}",
						selected: that.oConfig.filterCompList[idx].shownInFilterBar,
						layoutData: new OverflowToolbarLayoutData({
							closeOverflowOnInteraction: false,
							priority: SapMLibrary.OverflowToolbarPriority.AlwaysOverflow
						})
					}).data("idx", idx).attachSelect(null, that._onCheckBoxSelect, that));
				items[2].addStyleClass("sapSmartTemplatesAnalyticalListPageVFDShowInFilterBarCozy");
			}
			var customToolbar = new OverflowToolbar({
				design: SapMLibrary.ToolbarDesign.Transparent,
				content: [
					titleMD, titleUnitCurr,
					new ToolbarSpacer(),
					items, oDynamicDateRange
				]
			}).addStyleClass("sapSmartTemplatesAnalyticalListPageFilterDialogTitleToolbar");
			customToolbar.getContent()[0].addStyleClass("sapUiTinyMarginTop");
			customToolbar.getContent()[0].addStyleClass("sapSmartTemplatesAnalyticalListPageVFDialogChartTitle");
			customToolbar.getContent()[1].addStyleClass("sapUiTinyMarginTop");
			customToolbar.setWidth("100%");

			return customToolbar;
		},
		_addChart: function (chartType, prop, idx) {
			var chart;
			var that = this;
			var aSVOptions = prop.selectFilters && prop.selectFilters.SelectOptions;
			var oProp = {
					selectFilters: prop.selectFilters,
					scaleFactor : prop.scaleFactor,
					numberOfFractionalDigits: prop.numberOfFractionalDigits,
					sortOrder: prop.sortOrder,
					filterRestriction: prop.filterRestriction,
					isDropDown: prop.isDropDown,
					width: chartWidth,
					height: prop.height,
					labelWidthPercent: labelWidthPercent,
					entitySet: prop.entitySet,
					dimensionField: prop.dimensionField,
					dimensionFieldDisplay: prop.dimensionFieldDisplay,
					dimensionFieldIsDateTime: prop.dimensionFieldIsDateTime,
					dimensionFieldIsDateTimeOffset: prop.dimensionFieldIsDateTimeOffset,
					unitField: prop.unitField,
					isCurrency: prop.isCurrency,
					isMandatory: prop.isMandatory,
					measureField: prop.measureField,
					dimensionFilter: prop.dimensionFilter,
					outParameter: prop.outParameter,
					inParameters: prop.inParameters,
					parentProperty: prop.parentProperty,
					textArrangement: prop.textArrangement,
					chartQualifier: prop.chartQualifier,
					lazyLoadVisualFilter: this.oState.alr_visualFilterBar.getLazyLoadVisualFilter()
			};

			var sPath = "/filterCompList/" + idx;

			if (chartType === "Donut") {
				oProp.labelWidthPercent = labelWidthPercentDonut;
			}

			chartType = this.oState.alr_visualFilterBar._resolveChartType(chartType);

			var chart = this.oState.alr_visualFilterBar._createFilterItemOfType(chartType, oProp, false);
			chart.data("isDialogFilterItem", "true");
			chart.setModel(this.oVerticalBox.getModel('_dialogFilter'), '_dialogFilter');
			chart.setModel(this._getDialogConfigModel(), '_visualFilterDialogModel');
			chart.data("idx", idx);
			chart.addCustomData(new CustomData({
				key: 'sPath',
				value: sPath
			}));
			if (oProp.dimensionFieldIsDateTime) {
				chart.addCustomData(new CustomData({
					key: 'stringdate',
					value: prop.stringdate
				}));
			}
			chart.bindProperty('visible', {
				path: '_visualFilterDialogModel>/filterCompList/' + idx + '/showChartOverlay',
				formatter: function(bValue) {
					return !bValue;
				}
			});
			// bind dimension filter property for seletions on the chart
			chart.bindProperty('dimensionFilter', {
				path: '_dialogFilter>/' + chart.getParentProperty()
			});
			var aInParameters = chart.getInParameters(),
			aBindingParts = [];

			if (aInParameters && aInParameters.length > 0) {
				aInParameters.forEach(function (element) {
					aBindingParts.push({
						path: "_dialogFilter>/" + element.localDataProperty
					});
				});
			}

			if (that.oState.alr_visualFilterBar.getEntitySet() === chart.getEntitySet()) {
				var aMandatoryFields = that.oState.alr_visualFilterBar._smartFilterContext.determineMandatoryFilterItems();
				if (aMandatoryFields && aMandatoryFields.length > 0) {
					aMandatoryFields.forEach(function (element) {
						if (!element.data("isCustomField")) {
						    aBindingParts.push({
						        path: '_dialogFilter>/' + element.getName()
						    });
						}
					});
				}
			}

			if (aBindingParts && aBindingParts.length > 0) {
				// create property binding to handle In parameter changes
				chart.bindProperty('dimensionFilterExternal', {
					parts: aBindingParts,
					formatter: function () {
						var aInParameters = this.getInParameters() || [], //incase of no InParams causing console error while aInParameters.push
						sParentProperty = this.getParentProperty();
						var oFilter, oCurrencyProperty;
						if (that.oState.alr_visualFilterBar.getEntitySet() === this.getEntitySet()) {
							var aMandatoryFields = that.oState.alr_visualFilterBar._smartFilterContext.determineMandatoryFilterItems();
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
						if (!(that.oState.alr_visualFilterBar.getEntitySet() === this.getEntitySet() && that.oState.alr_visualFilterBar._smartFilterContext.getAnalyticBindingPath() !== "") && (that.oState.alr_visualFilterBar._smartFilterContext.getAnalyticBindingPath() === "" || that.oState.alr_visualFilterBar._smartFilterContext.getAnalyticBindingPath().indexOf("P_DisplayCurrency") != -1)) {
							var measureField = this.getMeasureField();
							var oModel = that.oState.alr_visualFilterBar.getModel();
							var metaModel = oModel.getMetaModel();
							var oEntityType = metaModel.getODataEntityType(that.oState.alr_visualFilterBar._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.getEntitySet()));
							var oEntitySet = metaModel.getODataEntitySet(this.getEntitySet());
							var oProperty = metaModel.getODataProperty(oEntityType, measureField);
							// If displayCurrency and currencyPath is set only then we proceed.
							var displayCurrency = that.oState.alr_visualFilterBar.getProperty("displayCurrency");
							var sCurrencyPath = oProperty && oProperty[V4Terms.ISOCurrency];
							if (displayCurrency && sCurrencyPath) {
								// Check the cuurency property associated with the measure.
								var sCurrencyField = sCurrencyPath.Path;
								for (var key = (aInParameters.length - 1); key > -1; key--) {
									var sValueListProperty = aInParameters[key].valueListProperty;
									var sLocalDataProperty = aInParameters[key].localDataProperty;
									if (sValueListProperty === sCurrencyField) {
										var aFilterData = that.oState.alr_visualFilterBar._smartFilterContext.getFilterData();
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
						return that.oState.alr_visualFilterBar._getFiltersForFilterItem(aInParameters, sParentProperty, oFilter, sCurrencyField, aSVOptions, this._inParameterFilterList);
					}
				});
			} else if (aSVOptions && aSVOptions.length > 0) {
				var filters = new Filter({aFilters: [], bAnd: true});
				for (var i in aSVOptions) {
					var oOption = aSVOptions[i];
					filters = this.oState.alr_visualFilterBar.fnAddSelectOptionsToFilters(oOption, filters);
				}
				chart.setProperty('dimensionFilterExternal', filters);
			}


			//attaching before friring update binding event so that it will be called first time also
			chart.attachBeforeRebindVisualFilter(function(oEvt) {
				var mParams = oEvt.getParameters();
				var sEntityType = mParams.sEntityType;
				var sDimension = mParams.sDimension;
				var sMeasure = mParams.sMeasure;
				var oContext = mParams.oContext;

				var oExtController = that.oState.oController;
				oExtController.onBeforeRebindVisualFilterExtension(sEntityType, sDimension, sMeasure, oContext);
			});

			chart._updateBinding();
			chart._bAllowBindingUpdateOnPropertyChange = true;

			//chart click handler
			chart.attachFilterChange(function(oEvent) {
				// fire visual filter change event to get compact filter data for in params
				// so that other visual filter items can react
				that.oState.alr_visualFilterBar.fireFilterChange();
			});

			chart.attachTitleChange(function(oEvent) {
				var idx = oEvent.getSource().data("idx");
				if (that.filterCompList[idx].toolbar.getContent().length > 0) {
					// If Mandatory property then add an (*)
					if (oProp.isMandatory) {
						that.filterCompList[idx].toolbar.getContent()[0].addStyleClass("sapSmartTemplatesAnalyticalListPageRequired");
					}
					var titleMD = that.filterCompList[idx].toolbar.getContent()[0];
					var titleUnitCurr = that.filterCompList[idx].toolbar.getContent()[1];
					//getting the title obj
					var titleObj = that._getChartTitle(that.filterCompList[idx].obj, idx);

					titleMD.setText(titleObj.titleMD);
					//checking if second part i.e. unit currency is empty then setting tooltip as first part i.e. measure dimension
					var oTooltipMD = that._formatTitle(titleObj, "tooltipMD");
					titleMD.setTooltip(oTooltipMD);
					titleUnitCurr.setText(that._formatTitle(titleObj, "titleUnitCurr"));

					//setting the width of second part of the title based on unit and currency
					var oTitleObjSplitArr = titleObj.titleUnitCurr.split(" ");
					if (titleObj.titleUnitCurr == "") {
						titleUnitCurr.setVisible(false);
					} else {
						titleUnitCurr.setVisible(true);
						var oWidthUnitCurr = oTitleObjSplitArr.length > 1 ? "4.15rem" : "2.4rem";
						titleUnitCurr.setWidth(oWidthUnitCurr);
					}
				}
				if (that.filterChartList[idx].data("needsToUpdateAria") === "true") {
					FilterUtil._updateVisualFilterAria(that.filterChartList[idx].getParent().getParent());
				}
			});
			return chart;
		},
		_createMoreFiltersLink: function(groupName, oGroupTitle) {
			var that = this;
			var count = 0;
			var i;
			var oLink = new Link();

			for (i = 0; i < this.filterCompList.length; i++) {
				if (this.filterCompList[i].searchVisible &&
						this.filterCompList[i].obj.group.name === groupName &&
						!this.filterCompList[i].obj.shownInFilterDialog) {
					count++;
				}
			}
			if (count > 0) {
				oLink.setText(this.oRb.getText("FILTER_BAR_SHOW_MORE_FILTERS", [count]));
			} else {
				oLink.setText(this.oRb.getText("FILTER_BAR_SHOW_CHANGE_FILTERS"));
			}

			oLink.attachPress(function(evnt) {
				that._createAddRemoveFiltersDialog(groupName, oLink);
			});
			//BCP: 1780364662 accessibility support for reading out group title in the visual filter dialog when the focus is on it's groupContainer element.
			if (oGroupTitle) {
				oLink.addAriaLabelledBy(oGroupTitle);
			}

			return oLink;
		},
		_showChartMeasuresPopup: function(oEvent) {
			var that = this;
			var idx = oEvent.getSource().data("idx");
			var collectionPath = this.filterChartList[idx].getProperty("entitySet");
			var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(oEvent.getSource().getModel('i18n'), "VISUAL_FILTER_MEASURES");
			var oI18nModel = oEvent.getSource().getModel("@i18n");
			if (oI18nModel) {
				oDialog.setModel(oI18nModel, "@i18n");
			}
			var oList = new List({
				mode: SapMLibrary.ListMode.SingleSelectLeft,
				includeItemInSelection: true
			});
			oList.data("idx", idx);
			oDialog.addContent(oList);
			var measures = this._getVisibleMeasureList(collectionPath);
			oList.addStyleClass("sapUiSizeCompact");
			//measures will be undefined if collectionPath does not exist in measures.
			if (measures) {
				for (var item in measures) {
					var oListItem = new StandardListItem({
						title: measures[item].label ? measures[item].label : measures[item].name,
						tooltip: (measures[item].fieldInfo && measures[item].fieldInfo.quickInfo) || measures[item].label || measures[item].name
					}).data("measureName", measures[item].name);
					oList.addItem(oListItem);
					if (this.filterChartList[idx].getMeasureField() === measures[item].name) {
						oList.setSelectedItem(oListItem);
					}
				}
			}

			oList.attachSelectionChange(function (oEvent) {
				var idx = oEvent.getSource().data("idx"),
				sMeasureName = oEvent.getSource().getSelectedItem().data("measureName");
				that.filterChartList[idx].setProperty("unitField", measures[sMeasureName].fieldInfo.unit);

				var titleMD = that.filterCompList[idx].toolbar.getContent()[0];
				var titleUnitCurr = that.filterCompList[idx].toolbar.getContent()[1];
				var titleObj = that._getChartTitle(that.filterCompList[idx].obj, idx);
				titleMD.setText(titleObj.titleMD);
				titleUnitCurr.setText(that._formatTitle(titleObj, "titleUnitCurr"));

				that.oConfig.filterCompList[idx].component.properties.measureField = sMeasureName;

				// if chart is line sort order should not change on measure change
				if (!that.filterChartList[idx]._chart.getPoints) {
					// set Sort Order without updating vf items
					var aSortProperty = deepExtend([], that.filterChartList[idx].getSortOrder());
					//We consider only first sortProperty, hence 0 index is used
					aSortProperty[0].Field.String = sMeasureName;
					that.filterChartList[idx].setSortOrder(aSortProperty);
					that._updateVisualFilterConfigModel(idx, '/component/properties/sortOrder', aSortProperty);
				}

				var oMeasureProperty = {
					bUpdateBinding: true,
					value: sMeasureName
				};
				that.filterChartList[idx].setMeasureField(oMeasureProperty);
				// This triggers setMeasure for the filter item on the bar
				// passed as an oject so that update binding can be called
				that._updateVisualFilterConfigModel(idx, '/component/properties/measureField', oMeasureProperty);
				// set measure as string in the model so that it can be normally used at other places
				that._updateVisualFilterConfigModel(idx, '/component/properties/measureField', sMeasureName);
				that._updateVisualFilterConfigModel(idx, '/component/properties/unitField', measures[sMeasureName].fieldInfo.unit);
				if (oDialog) {
					oDialog.close();
				}
			});

			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.openBy(oEvent.getSource());

		},

		_showChartTypesPopup: function(oEvent) {
			var that = this,
			button = oEvent.getSource(),
			i18nModel = button.getModel('i18n'),
			oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(i18nModel, "VISUAL_FILTER_CHART_TYPES"),
			compList = this.oState.alr_visualFilterBar._getSupportedFilterItemList(),
			listItems = [];
			for (var i = 0; i < compList.length; i++) {
				var comp = compList[i];
				var listItem = new StandardListItem({
						title: "{i18n>" + comp.textKey + "}",
						icon: comp.iconLink,
						selected: button.getIcon() === comp.iconLink
					}).data("type", comp.type);
				listItems.push(listItem);
			}
			var oList = new List({
				mode: SapMLibrary.ListMode.SingleSelectMaster,
				items: listItems
			});
			oList.data("button", button);
			oList.addStyleClass("sapUiSizeCompact");
			oList.setModel(i18nModel, "i18n");
			oDialog.addContent(oList);

			oList.attachSelectionChange(function (oEvent) {
				var idx = oEvent.getSource().data("button").data("idx"),
				chartType = oEvent.getSource().getSelectedItem().data("type"),
				oFilterItem = that.filterChartList[idx],
				sDimension = oFilterItem.getDimensionField(),
				sMeasure = oFilterItem.getMeasureField(),
				bDimensionIsDateTime = oFilterItem.getDimensionFieldIsDateTime(),
				sSortField = FilterUtil.readProperty(that.oConfig, "filterCompList." + idx + ".component.properties.sortOrder.0.Field.String"),
				oVisualFilterDialogModel = that._getDialogConfigModel(),
				oModelData = oVisualFilterDialogModel.getProperty('/filterCompList/'),
				oModelDataItem = deepExtend({}, oModelData[idx]),
				sModelSortField = FilterUtil.readProperty(oModelDataItem, "component.properties.sortOrder.0.Field.String");

				oEvent.getSource().data("button").setIcon(that._getChartTypeIconLink(chartType));

				// change sort order based on chart selected
				if (sSortField && sModelSortField) {
					if (chartType === "Line") {
						// for line chart sort should always be on dimension
						that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Field.String = sDimension;
						oModelDataItem.component.properties.sortOrder[0].Field.String = sDimension;

						if (bDimensionIsDateTime) {
							// in case dimension is date time the order should be descending
							// else previous order should prevail
							// Store the value of previous sort order so that when chart type is changed back, sort order is correct
							that.bSortOrder = that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Descending.Boolean;
							that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Descending.Boolean = true;
							oModelDataItem.component.properties.sortOrder[0].Descending.Boolean = true;
							// Making this.bLine = true to indicate that sortorder is changed for Time based Line chart
							that.bIsTimeBasedLine = true;
						}
					} else {
						// for line chart sort should always be on measure
						that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Field.String = sMeasure;
						oModelDataItem.component.properties.sortOrder[0].Field.String = sMeasure;
						if (that.bIsTimeBasedLine) { // if sort order is changed for time based line chart, we have to revert back to old sort order when chart type is changed
							that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Descending.Boolean = that.bSortOrder;
							oModelDataItem.component.properties.sortOrder[0].Descending.Boolean = that.bSortOrder;
							that.bIsTimeBasedLine = false;
						}
						// no change in sort order required here
					}
				}

				oModelDataItem.component.type = chartType;
				oVisualFilterDialogModel.setProperty('/filterCompList/' + idx, oModelDataItem);
				that.oState.oSmartFilterbar._oVariantManagement.currentVariantSetModified(true);
				that.oState.alr_visualFilterBar.updateVisualFilterBindings.apply(that, [true, true]);

				if (oDialog) {
					oDialog.close();
				}
			});
			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.openBy(oEvent.getSource());
		},
		_showLineChartTimeAxisPopup: function(oEvent) {
			var idx = oEvent.getSource().data("idx");
			var button = oEvent.getSource();
			var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(oEvent.getSource().getModel('i18n'), "VISUAL_FILTER_LINE_CHART_TIME_LINE");
			var oList = new List({
				mode: SapMLibrary.ListMode.SingleSelectLeft,
				items: [
					new StandardListItem({
						title: "{i18n>VISUAL_FILTER_LINE_CHART_TIME_LINE_DAYS}"
					}).data("idx", idx),
					new StandardListItem({
						title: "{i18n>VISUAL_FILTER_LINE_CHART_TIME_LINE_MONTH}"
					}).data("idx", idx),
					new StandardListItem({
						title: "{i18n>VISUAL_FILTER_LINE_CHART_TIME_LINE_QUARTERS}"
					}).data("idx", idx),
					new StandardListItem({
						title: "{i18n>VISUAL_FILTER_LINE_CHART_TIME_LINE_YEARS}"
					}).data("idx", idx)
				]
			});
			oList.data("button", button);
			oList.addStyleClass("sapUiSizeCompact");
			oDialog.addContent(oList);

			oList.attachSelectionChange(function (oEvent) {
				// add logic
				oDialog.close();
			});

			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.openBy(oEvent.getSource());
		},
		_showChartSortPopup: function(oEvent) {
			var that = this;
			var idx = oEvent.getSource().data("idx");
			var button = oEvent.getSource();
			var i18n = oEvent.getSource().getModel('i18n');
			var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(i18n, "VISUAL_FILTER_SORTING");
			var oList = new List({
				mode: SapMLibrary.ListMode.SingleSelectLeft,
				includeItemInSelection: true,
				items: [
					new StandardListItem({
						title: i18n.getResourceBundle().getText("VISUAL_FILTER_SORTING_ASCENDING")
					}).data("idx", idx),
					new StandardListItem({
						title: i18n.getResourceBundle().getText("VISUAL_FILTER_SORTING_DESCENDING")
					}).data("idx", idx)
				]
			});
			oList.data("button", button);
			oList.addStyleClass("sapUiSizeCompact");
			if (this.filterChartList[idx].getSortOrder()[0].Descending.Boolean) {
				oList.setSelectedItem(oList.getItems()[1], true);
			} else {
				oList.setSelectedItem(oList.getItems()[0], true);
			}
			oDialog.addContent(oList);

			oList.attachSelectionChange(function (oEvent) {
				var button = oEvent.getSource().data("button");
				var idx = button.data("idx");
				var aSortProperty = deepExtend([], that.filterChartList[idx].getSortOrder());
				//We consider only first sortProperty, hence 0 index is used
				aSortProperty[0].Descending.Boolean = oEvent.getSource().getItems()[1].isSelected();
				if (aSortProperty[0].Descending.Boolean) {
					button.setIcon("sap-icon://sort-descending");
				} else {
					button.setIcon("sap-icon://sort-ascending");
				}
				var oSortProperty = {
					bUpdateBinding: true,
					value: aSortProperty
				};
				that.filterChartList[idx].setSortOrder(oSortProperty);
				// This triggers setSortOrder for the filter item on the bar
				// passed as an oject so that update binding can be called
				that._updateVisualFilterConfigModel(idx, '/component/properties/sortOrder', oSortProperty);
				// set sortOrder as array in the model so that it can be normally used at other places
				that._updateVisualFilterConfigModel(idx, '/component/properties/sortOrder', aSortProperty);
				if (oDialog) {
					oDialog.close();
				}
			});
			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.openBy(oEvent.getSource());
		},
		/**
		 * Creates the 'Add/Remove Filters' - dialog.
		 *
		 * @private
		 * @param {string} groupName filter group name
		 * @param {sap.m.Link} oLink more/clear filters link
		 */

		_createAddRemoveFiltersDialog: function(groupName, oLink) {
			var i; //, oDialog,
			var that = this;

			var oDialog = new Dialog();
			oDialog.setTitle(this.oRb.getText("SELECT_FILTER_FIELDS"));
			oDialog.addStyleClass("sapUiPopupWithPadding");
			oDialog.addStyleClass("sapUiCompAddRemoveFilterDialog");
			oDialog.addStyleClass("sapUiSizeCompact");
			oDialog.setVerticalScrolling(true);

			var oSubHeader = new Bar();
			var oSearchField = new SearchField({
				placeholder: this.oRb.getText("FILTER_BAR_SEARCH")
			});

			this._oSearchField = oSearchField;
			oSearchField.attachLiveChange(function(oEvent) {
				that._onAddRemoveFiltersSearch(oEvent);
			});

			oSubHeader.addContentRight(oSearchField);
			oDialog.setSubHeader(oSubHeader);

			this.addRemoveList = new List({
				mode: SapMLibrary.ListMode.MultiSelect
			});
			this.addRemoveList.setShowSeparators(ListSeparators.None);
			oDialog.addContent(this.addRemoveList);

			for (i = 0; i < this.filterCompList.length; i++) {
				if (this.filterCompList[i].obj.group.name === groupName && this.filterCompList[i].searchVisible) {
					var oTitleObj = this._getChartTitle(this.filterCompList[i].obj, i, true);
					var oListItem = new StandardListItem({
						title: oTitleObj.titleMD
					}).data("idx", i);
					this.addRemoveList.addItem(oListItem);
					if (this.filterCompList[i].obj.shownInFilterDialog) {
						this.addRemoveList.setSelectedItem(oListItem, true);
					}
				}
			}
			//on selection Change of filters in more filters link
			this.addRemoveList.attachSelectionChange(function(oEvent) {
				if (oEvent) {
					var oParams = oEvent.getParameters();
					if (oParams) {
						var oListItem = oParams.listItem;
						var idx = oListItem.data("idx");
						if (oListItem) {
							var oVisibilityChange = {
								bVisible : oParams.selected,
								propertyName : that.oConfig.filterCompList[idx].component.properties.parentProperty
							};
							that.oState.alr_visualFilterBar.fireFilterChange(oVisibilityChange);
						}
					}
				}
			});
			// OK button
			var oOKButton = new Button({
				text: this.oRb.getText("OK")
			});
			oOKButton.attachPress(function() {
				var i;
				var items = that.addRemoveList.getItems();
				var oVisualConfigModel = that._getDialogConfigModel(),
					oVisualConfigModelClone = deepExtend({}, oVisualConfigModel);
				for (i = 0; i < items.length; i++) {
					var idx = items[i].data("idx");
					var bSelected = items[i].isSelected();
					//if the chart is deselected in 'change filters' dialog of a field group, update VFConfigModel to hide the chart..
					//.. in dialog and VF bar.
					oVisualConfigModelClone.setProperty('/filterCompList/' + idx + '/shownInFilterBar', bSelected);
					oVisualConfigModelClone.setProperty('/filterCompList/' + idx + '/shownInFilterDialog', bSelected);
				}
				oVisualConfigModel.setData(oVisualConfigModelClone.getData());
				//update config object when VFConfig model is updated
				that.oConfig = JSON.parse(oVisualConfigModel.getJSON());
				that.oState.alr_visualFilterBar.updateVisualFilterBindings.apply(this, [true, true]);
				//to enable Restore button on change of chart type, sort order, measure field and  show in filter bar changes
				that.oState.oSmartFilterbar._oVariantManagement.currentVariantSetModified(true);
				that._reloadForm();
				oDialog.close();
			});
			oDialog.addAggregation("buttons", oOKButton);
			oDialog.setInitialFocus(this._oSearchField);
			oDialog.setContentHeight("23.25rem"); // 30.25 - 2*2.5rem - 2rem

			// Cancel button
			var oCancelButton = new Button({
				text: this.oRb.getText("FORM_PERS_DIALOG_CANCEL"),
				press: function() {
					oDialog.close();
				}
			});
			oDialog.addAggregation("buttons", oCancelButton);

			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.open();
		},
		_onAddRemoveFiltersSearch : function (oEvent) {
			var i;

			if (!oEvent) {
				return;
			}

			var parameters = oEvent.getParameters();
			if (!parameters) {
				return;
			}

			var sValue = (parameters.newValue ? parameters.newValue : "").toLowerCase();
			var items = this.addRemoveList.getItems();
			for (i = 0; i < items.length; i++) {
				var sText = (items[i].getTitle()).toLowerCase();
				items[i].setVisible(sText.indexOf(sValue) >= 0);
			}
		},
		_getChartTypeIconLink: function(icon) {
			var compMap = this.oState.alr_visualFilterBar._getSupportedFilterItemMap();
			var comp = compMap[icon];
			return !comp ? "" : comp.iconLink;
		},
		_getChartTitle: function (obj, idx, useConfig) {
			var oAppI18nModel = this.oState.oController.getView().getModel("@i18n");
			var title = "";
			if (this.filterChartList[idx]) {
				if (useConfig) {
					obj.component.properties = this.filterChartList[idx].getP13NConfig();
					title = this.oState.alr_visualFilterBar.getTitleByFilterItemConfig(obj);
				} else {
					title = this.filterChartList[idx].getTitle(oAppI18nModel);
				}
			} else {
				//Provide properties from config when chart is not created (hidden)
				obj.component.properties = this.oConfig.filterCompList[idx].component.properties;
				title = this.oState.alr_visualFilterBar.getTitleByFilterItemConfig(obj);
			}
			return title;
		},
		_adjustToolbarIcons: function(idx) {
			if (this.filterCompList[idx].obj.component.type === "Line") {
				this.filterCompList[idx].toolbar.getContent()[1].getItems()[1].setVisible(true);
				this.filterCompList[idx].toolbar.getContent()[1].getItems()[2].setVisible(false);
			} else {
				this.filterCompList[idx].toolbar.getContent()[1].getItems()[1].setVisible(false);
				this.filterCompList[idx].toolbar.getContent()[1].getItems()[2].setVisible(true);
			}
		},
		_updateVisualFilterConfigModel: function(idx, path, value, bIsUpdate) {
			var oVisualConfigModel = this._getDialogConfigModel();
			oVisualConfigModel.setProperty('/filterCompList/' + idx + path, value);
			if (bIsUpdate) {
				//To reload the aggregation,so that the chart will be rendered
				var oModelData = deepExtend({}, oVisualConfigModel.getProperty('/filterCompList/' + idx));
				oVisualConfigModel.setProperty('/filterCompList/' + idx, oModelData);
				this.oState.alr_visualFilterBar.updateVisualFilterBindings.apply(this, [true, true]);
			}
			//update config object when VFConfig model is updated
			this.oConfig = oVisualConfigModel.getData();
			//to enable Restore button on change of chart type, sort order, measure field and  show in filter bar changes
			this.oState.oSmartFilterbar._oVariantManagement.currentVariantSetModified(true);
		},

		_getVisibleMeasureList: function(entitySet) {
			var visibleMeasureList = {},
				measureMap = this.oState.alr_visualFilterBar._getMeasureMap()[entitySet];
			for (var prop in measureMap) {
				var elem = measureMap[prop];
				if (!(elem.fieldInfo[V4Terms.Hidden] && elem.fieldInfo[V4Terms.Hidden].Bool === "true")) {
					visibleMeasureList[elem.name] = elem;
				}
			}
			return visibleMeasureList;
		},
		/**
		 * Reacts to search from 'Filters'- dialog.
		 *
		 * @private
		 * @param {object} oEvent containing the search string
		 */
		_triggerSearchInFilterDialog: function (oEvent) {
			var sValue = (oEvent ? oEvent : "").toLowerCase();
			for (var i = 0; i < this.oConfig.filterCompList.length; i++) {
				var obj = this.oConfig.filterCompList[i].component.properties;
				var sTitle = this._getChartTitle(this.oConfig.filterCompList[i], i).titleMD.toLowerCase();
				var sDimLabel = this._getLabelForDimensionsAndMeasures(obj, obj.parentProperty),
					sMeasureLabel = this._getLabelForDimensionsAndMeasures(obj, obj.measureField),
					//search 1)dimension consists search string 2) measure consists search string 3) chart title consists search string
					bSearchedItem = (sDimLabel.indexOf(sValue) >= 0) || (sMeasureLabel.indexOf(sValue) >= 0) || (sTitle.indexOf(sValue) >= 0);
				this.oConfig.filterCompList[i].searchVisible = bSearchedItem;
			}
			this._reloadForm();
		},
		_triggerDropdownSearch: function (oEvent) {
			this.currentDropdownSelection = oEvent;
			for (var i = 0; i < this.oConfig.filterCompList.length; i++) {
				var oFilterComp = this.oConfig.filterCompList[i];
				if ((oEvent === "all") ||
				   (oEvent === "visible" && oFilterComp.shownInFilterBar) ||
				   (oEvent === "active" && oFilterComp.component.properties.activeVisualFilters) ||
				   (oEvent === "visibleactive" && oFilterComp.shownInFilterBar && oFilterComp.component.properties.activeVisualFilters) ||
				   (oEvent === "mandatory" && oFilterComp.component.properties.isMandatory)) {
					oFilterComp.searchVisible = true;
				} else {
					oFilterComp.searchVisible = false;
				}
			}
			this._reloadForm();
		},
		_getDialogConfigModel: function() {
			return this.oVerticalBox.getModel('_visualFilterDialogModel');
		},
		_getLabelForDimensionsAndMeasures: function(obj, prop) {
			var oMetadataAnalyser = this.oState.alr_visualFilterBar._oMetadataAnalyser,
				oMetaModel = this.oVerticalBox.getModel().getMetaModel(),
				sEntityTypeName = oMetadataAnalyser.getEntityTypeNameFromEntitySetName(obj.entitySet),
				oEntityTypeDefinition = oMetaModel.getODataEntityType(sEntityTypeName),
				propLabel = oMetaModel.getODataProperty(oEntityTypeDefinition, prop) && oMetaModel.getODataProperty(oEntityTypeDefinition, prop)[V4Terms.Label];
			propLabel = propLabel && propLabel.String ? propLabel.String : "";
			return propLabel;
		}
	});
	/**
	 * @private
	 * [_createPopoverDialog description]
	 * @param  {object} i18n object
	 * @param  {object} title string to display in dialog
	 * @return {object} oDialog object
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog = function(i18n, title) {
		//to avoid multiple popovers being created on each press event of the chart toolbar buttons
		if (this._oPopoverDialog) {
			this._oPopoverDialog.destroy();
		}
		this._oPopoverDialog = new Popover();
		this._oPopoverDialog.setTitle(i18n.getResourceBundle().getText(title));
		this._oPopoverDialog.setPlacement(sap.m.PlacementType.PreferredBottomOrFlip);
		this._oPopoverDialog.addStyleClass("sapUiPopupWithPadding");
		return this._oPopoverDialog;
	};

	sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createFilterItemSelectedList = function(oChart, oDialog) {
		var oList = new List({
			mode: SapMLibrary.ListMode.Delete
		}),
		// get a clone of dimension filter so that _filter model is not updated yet
		oFilters,
		sFilterRestriction = oChart.getFilterRestriction();

		oList.data("chart", oChart);

		if (sFilterRestriction === 'multiple') {
			// multi-value
			oFilters = deepExtend({}, oChart.getDimensionFilter());
			var aFilterItems = (oFilters && oFilters.items) ? oFilters.items : undefined,
			aFilterRanges = (oFilters && oFilters.ranges) ? oFilters.ranges : undefined,
			aFilterValue = (oFilters && oFilters.value) ? oFilters.value : null;
			oFilters = deepExtend({}, oChart.getDimensionFilter());
			if (aFilterItems) {
				for (var i = 0; i < aFilterItems.length; i++) {
					var oListItem = new StandardListItem({
						title: aFilterItems[i].text ? aFilterItems[i].text : aFilterItems[i].key
					});
					// add custom data to determine whether value is part of items/ranges/value
					if ( oListItem ) {
						oListItem.addCustomData(new CustomData({
							key: 'items',
							value: i
						}));
					}
					oList.addItem(oListItem);
				}
			}


			if (aFilterRanges) {
				for (var i = 0; i < aFilterRanges.length; i++) {
					var oListItem = new StandardListItem({
						title: aFilterRanges[i].tokenText ? aFilterRanges[i].tokenText : FilterUtil.createTitleFromCode(aFilterRanges[i])
					});
					// add custom data to determine whether value is part of items/ranges/value
					// so that accessing the filter is easier while it is removed from the list
					oListItem.addCustomData(new CustomData({
						key: 'ranges',
						value: i
					}));
					oList.addItem(oListItem);
				}
			}

			// consider user typed in values
			if (aFilterValue) {
				var oListItem = new StandardListItem({
					title: aFilterValue
				});
				// add custom data to determine whether value is part of items/ranges/value
				// so that accessing the filter is easier while it is removed from the list
				oListItem.addCustomData(new CustomData({
					key: 'value'
				}));
				oList.addItem(oListItem);
			}
		} else {
			// single-value
			oList.addItem( new StandardListItem({ title: oChart.getDimensionFilter() }));
		}

		oList.attachDelete(function (oEvent) {
			var oItem = oEvent.getParameter("listItem"),
			chart = oList.data('chart'),
			oDimensionFilters;

			if (sFilterRestriction === 'single') {
				oDimensionFilters = null;
			} else {
				oDimensionFilters = deepExtend({}, chart.getDimensionFilter());
				var aCustomData = oItem.getCustomData()[0],
				sFilterType = aCustomData.getKey(),
				aFilters = oDimensionFilters[sFilterType];
				if (sFilterType !== 'value') {
					// if type is items or ranges get index for filter
					var sIndex = aCustomData.getValue();
					// and remove index from filters
					aFilters.splice(sIndex, 1);
				} else {
					oDimensionFilters.value = null;
				}
			}
			oList.removeItem(oItem);
			chart.setDimensionFilter(oDimensionFilters);
			chart.fireFilterChange();
			// remove content from Dialog and add alist to dialog again
			// so that custom data (items/ranges/value) of list item
			// is always in sync with indexes of dimension filter
			oDialog.removeContent(oList);
			var oNewList = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createFilterItemSelectedList(chart, oDialog);
			// add new list to dialog only if list has list items
			if (oNewList.getItems().length > 0) {
				oDialog.addContent(oNewList);
				// setting the focus to dialog keeps the dialog open
				oDialog.focus();
			} else {
				oDialog.close();
			}
		});

		return oList;
	};

	/**
	 * Launches the All Filters Popup
	 *
	 * @public
	 * @param {Control}  oControl the control requesting the popup
	 * @param {Chart}    oChart the selected chart
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController.launchAllFiltersPopup = function(oControl, oChart, i18n) {
		var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(i18n, "VISUAL_FILTER_ALL_SELECTED_FILTERS"),
		oList = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createFilterItemSelectedList(oChart, oDialog);
		oDialog.addContent(oList);
		oDialog.addStyleClass("sapUiSizeCompact");
		oDialog.addStyleClass("sapSmartTemplatesAnalyticalListPageSelectedLinkDialog");

		//Adding a footer bar with a clear all button
		var oFooter = new Bar();
		var oClearButton = new Button({
			text: i18n.getResourceBundle().getText("CLEAR_FILTERS_ALL"),
			press: function(oEvent) {
				// reset all filters to default
				var chart = oList.data('chart'),
				sFilterRestriction = chart.getFilterRestriction(),
				oDimensionFilters;
				if (sFilterRestriction === 'multiple') {
					oDimensionFilters = deepExtend({}, chart.getDimensionFilter());
					oDimensionFilters.items = [];
					oDimensionFilters.ranges = [];
					oDimensionFilters.value = null;
				} else {
					oDimensionFilters = null;
				}
				// remove filter list from the dialog
				oDialog.removeContent(oList);
				// set dimension filter to trigger two-way binding
				chart.setDimensionFilter(oDimensionFilters);
				chart.fireFilterChange();
				// setting the focus to dialog keeps the dialog open
				oDialog.close();
			}
		});
		oFooter.addContentRight(oClearButton);
		oDialog.setFooter(oFooter);
		oDialog.attachAfterClose(function() {
			oDialog.destroy();
			oDialog = null;
		});

		oDialog.openBy(oControl);
	};

	return vfdController;
});
