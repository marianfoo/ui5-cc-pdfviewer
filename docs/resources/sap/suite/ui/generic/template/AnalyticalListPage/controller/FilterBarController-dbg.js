
sap.ui.define(["sap/m/SegmentedButtonItem", "sap/m/Button", "sap/m/Text", "sap/m/Dialog", "sap/m/SegmentedButton",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/VisualFilterDialogController",
	"sap/ui/core/mvc/Controller", "sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/ui/Device", "sap/suite/ui/generic/template/AnalyticalListPage/util/CommonUtil"
	],
	function(
		SegmentedButtonItem, Button, Text,
		Dialog, SegmentedButton, VisualFilterDialogController,
		Controller, FilterUtil,
		Device, CommonUtil) {
		"use strict";

		var FILTER_MODE_VISUAL = "visual",
			FILTER_DIALOG_MODE_COMPACT = "group",
			customDataPropertyName  = "sap.suite.ui.generic.template.customData",
			genericDataPropertyName = "sap.suite.ui.generic.template.genericData",
			dataPropertyNameExtension = "sap.suite.ui.generic.template.extensionData";

		var fbController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.FilterBarController", {
			init: function(oState) {
				this.compactFilterData = {};
				var me = this;

				me.oState = oState;
				//Make bShowGoButtonOnFilter always true on launching the app in S Size devices. In other devices, take the value from manifest.
				var bShowGoButtonOnFilter;
				if (Device.system.phone) {
					bShowGoButtonOnFilter = true;
				} else {
					bShowGoButtonOnFilter = me.oState.oController.getOwnerComponent().getShowGoButtonOnFilterBar() ? true : false;
				}
				oState.oSmartFilterbar.setShowGoOnFB(bShowGoButtonOnFilter);
				//live mode on when go button is disabled
				//TODO: should be moved to view fragment
				oState.oSmartFilterbar.setLiveMode(!bShowGoButtonOnFilter);
				//Show messages only if GO button is enabled
				//oState.oSmartFilterbar.setShowMessages(bShowGoButtonOnFilter);
				//load data on initial launch for live mode
				//TODO: should be moved to view fragment
				if (oState.oSmartTable) {
					oState.oSmartTable.setEnableAutoBinding(!bShowGoButtonOnFilter);
				}
				//Enable "AdaptFilter" beside the "Go" button
				if (!bShowGoButtonOnFilter) {
					//TODO:Hiding "AdaptFilter" button using private API , public API to be used when available
					me.oState.oSmartFilterbar._oFiltersButton.setVisible(false);
				}

				oState.oHeader = oState.oPage.getHeader();
				oState.oTitle = oState.oPage.getTitle();

				// if (oState.oKpiTagContainer) {
				// 	oState.alr_filterContainer.removeContent(oState.oKpiTagContainer);
				// 	oState.oKpiTagContainer.addStyleClass("sapSmartTemplatesAnalyticalListPageKpiTagContainer");
				// }

				if (oState.alr_visualFilterBar) {
					oState.alr_visualFilterBar.setSmartFilterContext(this.oState.oSmartFilterbar);
					oState.alr_visualFilterBar.attachFilterChange(this._onVisualFilterChange.bind(this));
				}
				oState.oSmartFilterbar.attachAfterVariantLoad(this._afterVariantLoad.bind(this));
			},
			_updateFilterLink: function () {
				 var oFilterDataCount = this._getFilterDataCount(),
				 oTemplatePrivate = this.oState.oController.getOwnerComponent().getModel("_templPriv");
				 oTemplatePrivate.setProperty('/alp/filtersLink', oFilterDataCount);
			},
			/**
			* Return the filter count
			* @returns {integer}
			* @private
			*/
			_getFilterDataCount: function() {
				var aFilter = this.oState.oSmartFilterbar.retrieveFiltersWithValues(),
				iFilterCount = aFilter.length,
				//Check if there are values in the basic search field
				oBasicSearchField = this.oState.oSmartFilterbar.getBasicSearchControl();
				if (oBasicSearchField && oBasicSearchField.getValue && oBasicSearchField.getValue()) {
					iFilterCount++;
				}
				return iFilterCount;
			},
			/**
			 * Filter bar callback after variant load
			 *
			 * @returns {void}
			 * @private
			 */
			_afterVariantLoad : function (oEvent) {
				if (this.oState.alr_visualFilterBar && oEvent.mParameters.context !== "CANCEL") {
					var bIsDialogOpen = this.oState.oSmartFilterbar.isDialogOpen();
					if (bIsDialogOpen) {
						this.oState.alr_visualFilterBar.updateVisualFilterBindings.apply(this.oState.visualFilterDialogContainer, [true, true]);
					} else {
						this.oState.alr_visualFilterBar.updateVisualFilterBindings(true);
					}
				}
				//in live mode manually trigger search after setting filterData to the compactFilter
				if (this.oState.oSmartFilterbar.isLiveMode() && oEvent.mParameters.context != "INIT") {
					// call search
					this.oState.oSmartFilterbar.search();
				}
			},
			_afterSFBVariantLoad: function () {
				var oData = this.oState.oSmartFilterbar.getFilterData();
					if (oData._CUSTOM !== undefined) {
						this.oState.oIappStateHandler.fnRestoreFilterState(oData._CUSTOM);
					} else {
						// make sure that the custom data are nulled for the STANDARD variant
						var oCustomAndGenericData = this.oState.oIappStateHandler.getFilterState();
						CommonUtil.nullify(oCustomAndGenericData[customDataPropertyName]);
						CommonUtil.nullify(oCustomAndGenericData[genericDataPropertyName]);
						CommonUtil.nullify(oCustomAndGenericData[dataPropertyNameExtension]);
						this.oState.oIappStateHandler.fnRestoreFilterState(oCustomAndGenericData);
					}
					this.oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
			},
			/**
			 * Callback for visual filter change event
			 *
			 * @param {object} oEvent - object generated by the visual filter filterChange event
			 * @returns {void}
			 * @private
			 */
			 _onVisualFilterChange : function (oEvent) {
				if (oEvent.getParameter('propertyName') && oEvent.getParameter('bVisible') !== undefined) {
					var oFilterItem = this.oState.oSmartFilterbar.determineFilterItemByName(oEvent.getParameter('propertyName'));
					if (oEvent.getParameter('bVisible')) {
						//setting corresponding filterItem visible/hidden in compact filter bar and dialog
						if (!oFilterItem.getPartOfCurrentVariant()) {
							oFilterItem.setPartOfCurrentVariant(true);
							oFilterItem.setVisibleInFilterBar(true);
						}
					} else {
						oFilterItem.setPartOfCurrentVariant(false);
						oFilterItem.setVisibleInFilterBar(false);
					}
				}
				var bIsDialogOpen = this.oState.oSmartFilterbar.isDialogOpen();
				if (bIsDialogOpen && this.oState.visualFilterDialogContainer) {//check for presence of vf dialog as it is absent in case of hideVisualfilter=true
					var filterDialogModel = this.oState.visualFilterDialogContainer.oVerticalBox.getModel("_dialogFilter");
					var oFilterDialogData = filterDialogModel.getData();
					//retaining the custom filter Data
					if (this.oState.oSmartFilterbar.getFilterData()._CUSTOM !== undefined) {
						oFilterDialogData._CUSTOM = this.oState.oSmartFilterbar.getFilterData()._CUSTOM;
					}
					this.oState.oSmartFilterbar.setFilterData(oFilterDialogData, true);
				} else {
					var filterbarModel = this.oState.oController.getOwnerComponent().getModel("_filter");
					var oFilterBarData = filterbarModel.getData();
					//retaining the custom filter Data
					if (this.oState.oSmartFilterbar.getFilterData()._CUSTOM !== undefined) {
						oFilterBarData._CUSTOM = this.oState.oSmartFilterbar.getFilterData()._CUSTOM;
					}
					this.oState.oSmartFilterbar.setFilterData(oFilterBarData, true);
				}
				//in live mode manually trigger search after setting filterData to the compactFilter
				if (this.oState.oSmartFilterbar.isLiveMode()) {
					if (!bIsDialogOpen) {
						this.oState.oSmartFilterbar.search();
					} else {
						this.oState.visualFilterDialogContainer.bSearchPendingAfterDialogFilterChange = true;
					}
					
				}
			},
			//go button search event handler
			onGoFilter: function(){
				this.oState.oSmartFilterbar.search();
			},
			setDefaultFilter:function(mode) {
				var oTemplatePrivate = this.oState.oController.getOwnerComponent().getModel("_templPriv");
				oTemplatePrivate.setProperty('/alp/filterMode', mode);
				this.handleFilterSwitch(mode); // Don't want to trigger a mode change event, this will cause the data to be reloaded too earlier, the reload will happen when variants are processed
			},
			/**
			 * press handler for filter switch button
			 *
			 * @param {string} mode - compact or visual
			 * @param {boolean} bApplyingVariant - true is variant is being applied
			 *
			 * @returns {void}
			 */
			handleFilterSwitch:function(mode, bApplyingVariant) {
				var oComponent = this.oState.oController.getOwnerComponent();
				var oTemplatePrivate = oComponent.getModel("_templPriv");

				//in case app loading in compact filter mode
				if (this.oState.alr_visualFilterBar && !this.oState.alr_visualFilterBar.getAssociateValueListsCalled()) {
					this.oState.alr_visualFilterBar.setAssociateValueListsCalled(true);
					this.oState.oSmartFilterbar.associateValueLists();
				}

				if (oTemplatePrivate.getProperty('/alp/filterMode') === FILTER_MODE_VISUAL) {
					if (oComponent.getLazyLoadVisualFilter() && !this.oState.oSmartFilterbar.isDialogOpen()) {
						this.oState.alr_visualFilterBar.updateVisualFilterBindings(true);
					}
					//this.fnCheckMandatory();
				}
			},
			// If filter mode is visual and if mandatory fields/params are not filled launch CompactFilter Dialog.
			fnCheckMandatory: function(){
				this.oState.oSmartFilterbar.checkSearchAllowed(this.oState);
				var oTemplatePrivate = this.oState.oController.getOwnerComponent().getModel("_templPriv");
				if (this.oState.alr_visualFilterBar && this.oState.alr_visualFilterBar.bIsInitialised && oTemplatePrivate.getProperty('/alp/searchable') === false && oTemplatePrivate.getProperty('/alp/filterMode') === FILTER_MODE_VISUAL) {
					this.oState.oSmartFilterbar.showAdaptFilterDialog(FILTER_DIALOG_MODE_COMPACT);
				}
			},
			//check the filter mode and then show the corresponding filter dialog
			showDialog: function(){
				var oTemplatePrivate = this.oState.oController.getOwnerComponent().getModel("_templPriv");
				if (oTemplatePrivate.getProperty('/alp/filterMode') === FILTER_MODE_VISUAL) {
					if (this.oState.alr_visualFilterBar && this.oState.alr_visualFilterBar.bIsInitialised && oTemplatePrivate.getProperty("/alp/searchable") === false) { //If missing mandatory or parameters
						this.oState.oSmartFilterbar.showAdaptFilterDialog(FILTER_DIALOG_MODE_COMPACT);
					} else {
						this.oState.oSmartFilterbar.showAdaptFilterDialog(FILTER_MODE_VISUAL);
					}
				} else {
					this.oState.oSmartFilterbar.showAdaptFilterDialog();
				}
			},
			clearFilters:function(){
				var oFilterData = this.oState.oSmartFilterbar.getFilterData();
				for (var prop in oFilterData) {
					if (oFilterData.hasOwnProperty( prop ) ) {
						delete oFilterData[prop];
					}
				}
				this.oState.oSmartFilterbar.setFilterData(oFilterData, true);
				//clear the table selections
				if (this.oState.chartController) {
					this.oState.chartController._updateTable();
				}
			},
			/*
			* @public
			* Function to update shownInFilterBar/shownInFilterDialog according to visibility of filteritems/checkbox selection in CFD
			* @param {object} oEvent - Event object that containes thee filterItem whose visibility has been changed and added/deleted object
			*/
			changeVisibility: function(oEvent) {
				var oFilterItem = oEvent.getParameters().filterItem.filterItem,
				bVisible = oEvent.getParameters().added ? true : false,
				oVisualFilterDialogContainer = this.oState.visualFilterDialogContainer;
				var aFilterItemList = oVisualFilterDialogContainer.oVerticalBox.getModel('_visualFilterDialogModel').getData().filterCompList;
				for (var i = 0; i < aFilterItemList.length; i++) {
					if (oFilterItem && oFilterItem.getName() === aFilterItemList[i].component.properties.parentProperty) {
						//Updating the properties shownInFilterBar and shownInFilterDialog to be in sync with CompactFilter
						//Update in filterCompList and _visualFilterConfigModel
						//Update shownInFilterDialog
						oVisualFilterDialogContainer.oConfig.filterCompList[i].shownInFilterDialog = bVisible;
						oVisualFilterDialogContainer.oConfig.filterCompList[i].shownInFilterBar = bVisible;
						oVisualFilterDialogContainer._updateVisualFilterConfigModel(i, '/shownInFilterDialog', bVisible);
						//For the checkbox in the chart toolbar in VFD
						//Update shownInFilterBar
						oVisualFilterDialogContainer.selectCheckBox(i, bVisible);
						break;
					}
				}
				oVisualFilterDialogContainer._reloadForm();
			}
		});
		return fbController;
	});
