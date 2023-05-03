sap.ui.define([
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/Filter',
		"sap/m/Button",
		"sap/m/StandardListItem",
		"sap/m/List",
		"sap/m/ToolbarSpacer",
		"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
		"sap/m/ResponsivePopover",
		"sap/m/Label", "sap/m/ToggleButton", "sap/m/SearchField", "sap/m/Toolbar",
		"sap/ui/core/Icon", "sap/ui/model/Sorter",
		"sap/ui/model/FilterOperator", "sap/m/library",
		"sap/base/util/extend",
		"sap/base/util/deepExtend"
	], function(Controller, Filter, Button, StandardListItem, List, ToolbarSpacer, FilterUtil, ResponsivePopover, Label, ToggleButton,
		SearchField, Toolbar, Icon, Sorter, FilterOperator, SapMLibrary, extend, deepExtend) {
	"use strict";

	var bShowOnlySelected = false, oToolbar = {}, oInfoLabel = {}, oUpdatedDimensionFilter = "",
	DropDownController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController", {});
	/**
	 * createMatchingConceptDropdown creates a drop down with pre filled from compact filter value entity set it's selections.
	 *
	 * @param {oControl, oChart, oModel, title, property}
	 * oControl - current element control
	 * oChart - chart
	 * oModel - _filter Model
	 * title - dimLabel
	 * property - property
	 * @returns {void}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.createDropdown = function(oControl, oChart, oModel, title, property, bIsEntitySearchable) {
		oUpdatedDimensionFilter = (property.filterRestriction == 'multiple') ? deepExtend({items: [], ranges: [], value: null}, oChart.getDimensionFilter()) : oChart.getDimensionFilter();
		var i18n = oControl.getModel('i18n'),
		oSmartFilterBar = sap.ui.getCore().byId(oChart.getSmartFilterId()),
		filterBy = {"descriptionAndId":property.dimensionFieldDisplay, "descriptionOnly":property.dimensionFieldDisplay, "idAndDescription":property.dimensionField, "idOnly":property.dimensionField},
		filterBy = (Object.keys(filterBy).indexOf(property.textArrangement) !== -1) ? filterBy[property.textArrangement] : property.dimensionFieldDisplay,
		oToolbarMenuButton = new ToggleButton({
			icon :"sap-icon://menu",
			type : "Transparent",
			iconFirst :true,
			enabled : (oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ? Boolean(oUpdatedDimensionFilter.items.length) : Boolean(oUpdatedDimensionFilter),
			tooltip :i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_SELECTED")
		}),
		oList = this.createStandardListItem(oModel, oChart, i18n, title, property, oToolbarMenuButton, oSmartFilterBar, filterBy),
		oDialog = this.createPopoverWithList(oModel, oChart, i18n, property, title, oList, filterBy, oToolbarMenuButton, bIsEntitySearchable, oSmartFilterBar),
		oOkButton = new Button({
							text: i18n.getResourceBundle().getText("OK"),
							press: function (oEvt) {
								oChart.setDimensionFilter(oUpdatedDimensionFilter);
								oChart.fireFilterChange();
								oDialog.close();
							},
							type: "Emphasized"
						}),
		oCancelButton = new Button({
							text: i18n.getResourceBundle().getText("CANCEL"),
							press: function () {
								oDialog.close();
							}
						});
		bShowOnlySelected = false;
		oDialog.addContent(oList);
		//Attaching the selection change of the list to update the selection accordingly.
		oList.attachSelectionChange(function(oEvt) {
			var currentSelectedItem = oList.getModel().getData(oEvt.mParameters.listItem.getBindingContext().sPath);
			currentSelectedItem = currentSelectedItem[property.dimensionField];
			var selected = oEvt.getParameters().listItem.mProperties.selected;
			if (property.filterRestriction === 'multiple') {
				if (oUpdatedDimensionFilter.items && oUpdatedDimensionFilter.items.length) {
					for (var j = 0; j < oUpdatedDimensionFilter.items.length; j++) {
						if (oUpdatedDimensionFilter.items[j].key === currentSelectedItem) {
							oUpdatedDimensionFilter.items.splice(j,1);
						} else if (selected) {
							oUpdatedDimensionFilter.items.push({
								key: currentSelectedItem
							});
							break;
						}
					}
				} else if (oUpdatedDimensionFilter.items) {
					oUpdatedDimensionFilter.items.push({
						key: currentSelectedItem
					});
				} else {
					oUpdatedDimensionFilter.items = [];
				}
				if (oUpdatedDimensionFilter.items.length) {
					oToolbar.setVisible(true);
					oInfoLabel.setText(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_SELECTED_COUNT", [title, oUpdatedDimensionFilter.items.length]));
				}
				oToolbar.setVisible(Boolean(oUpdatedDimensionFilter.items.length));
				oToolbarMenuButton.setEnabled(this.bUpdateToolbarButton || Boolean(oUpdatedDimensionFilter.items.length)); //Always enable toolbar button when on view selected or else show when number of selections > 1 (in view all)
			} else if (property.filterRestriction === 'single') {
				oUpdatedDimensionFilter = currentSelectedItem;
				if (oUpdatedDimensionFilter) {
					oToolbar.setVisible(true);
					oInfoLabel.setText(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_SELECTED_COUNT", [title, +Boolean(oUpdatedDimensionFilter)]));
				}
				oToolbarMenuButton.setEnabled(Boolean(oUpdatedDimensionFilter));
			}
		}.bind(this));
		oDialog.addStyleClass("sapSmartTemplatesAnalyticalListPageSelectedLinkDialog");
		oDialog.setBeginButton(oOkButton);
		oDialog.setEndButton(oCancelButton);
		oDialog.openBy(oControl);
	};
	//createPopoverWithList --  to create a popover dialog and add the search and menu tab.
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.createPopoverWithList = function(oModel, oChart, i18n, property, title, oList, filterBy, oToolbarMenuButton, bIsEntitySearchable, sfb) {
		//to avoid multiple popovers being created on each press event of the chart toolbar buttons
		//TO-Do need to look a way to optimise it rather than calling it every time.
		//Here popover needs to be returned to reuse the popover previous state as discussed and decided later.
		//Currently, commenting this code to ensure the close this BCP : 1780435016 as it's related to the fix suggested by popover team
		//in BCP : 1770526482(Set the initial focus on searchToolbar inside dropdown).
		//Will be fixing this code-reusability in BCP: 1780438085.

		if (this._oPopoverDialog && this._oPopoverDialog.isOpen) {
			// Since the popover is not destroyed it was creating a popup stack and a background
			// BCP: 1880145922 - will have the information on the target behavior of the dropdown
			this._oPopoverDialog.close();
		}
		if (oList) {
			var fnApplyFilterOnDropdown = function(oEvt) {
				// if clear button is pressed then this event is called twice - (liveChange and search)
				// so prevent the second call which will be duplicate
				if (oEvt.getParameter("clearButtonPressed")) {
					return;
				}
				var aFilters = this.fnApplyFilterFromSearchField(filterBy,oEvt.getSource().getValue());
				var binding = oList.getBinding("items");
				bShowOnlySelected = false;
				oToolbarMenuButton.setPressed(false);
				oToolbarMenuButton.setTooltip(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_SELECTED"));
				binding.filter(aFilters);
			}.bind(this);
			this.oSearchField = new SearchField({
				liveChange: fnApplyFilterOnDropdown,
				search: fnApplyFilterOnDropdown,
				enabled:bIsEntitySearchable,
				initialFocus : true
				});

			this._oPopoverDialog = new ResponsivePopover('',{
				placement: SapMLibrary.PlacementType.Bottom,
				verticalScrolling : true,
				title: title,
				subHeader: [new Toolbar({
					content : [this.oSearchField, oToolbarMenuButton]
				})],
				content: [oList]
				});
			if (sfb.isDialogOpen()) {
				this._oPopoverDialog.setModel(oChart.getModel("_dialogFilter"), "_dialogFilter");
			} else {
				this._oPopoverDialog.setModel(oChart.getModel("_filter"), "_filter");
			}
		}
		this._oPopoverDialog.setInitialFocus(this.oSearchField);
		this._oPopoverDialog.setContentWidth("320px");

		return this._oPopoverDialog;
	};
	//createStandardListItem -- create a Standard list item template.
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.createStandardListItem = function(oModel, oChart, i18n, title, property, oToolbarMenuButton, sfb, filterBy) {
		var sBindingPath = "/" + property.entitySet, that = this,
		template = that.standardListItemTemplateCreation(oChart, property, sfb);
		oInfoLabel = new Label({
				text : i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_SELECTED_COUNT", [title, typeof (oChart.getDimensionFilter()) === "object" && oChart.getDimensionFilter() !== null  ? oChart.getDimensionFilter().items.length : +Boolean(oChart.getDimensionFilter())])
			});
		oToolbar = new Toolbar({
			content : [
				oInfoLabel,
				new ToolbarSpacer(),
				new Icon({
					src :"sap-icon://sys-cancel",
					tooltip :i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_CLEAR_SELECTION"),
					decorative: false,
					press : function(oEvt) {
						oToolbar.setVisible(false);
						//Short term fix suggested for BCP: 1980057364
						//Set the focus on the popover so that hiding the toolbar doesn't shift focus to outside the popover in chrome thus resulting in close of the dialog
						oList.getParent().getDomRef().focus();
						oList.setRememberSelections(false);
						bShowOnlySelected = false;
						oToolbarMenuButton.setTooltip(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_SELECTED"));
						oToolbarMenuButton.setEnabled(false);
						oToolbarMenuButton.setPressed(false);
						oList.removeSelections(true);
						(oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ?  oUpdatedDimensionFilter.items = [] : oUpdatedDimensionFilter = "";
						oInfoLabel.setText(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_SELECTED_COUNT", [title, (oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ? oUpdatedDimensionFilter.items.length : +Boolean(oUpdatedDimensionFilter)]));
						//todo : to check if this is the correct way to trigger list rebind
						oList.getBinding("items").filter(this.fnApplyFilterFromSearchField(filterBy, this.oSearchField.getValue()));
					}.bind(this)
				}).addStyleClass("sapSmartTemplatesAnalyticalListPageDropdownDialogCancelButton")
				],
				"visible" :(oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ?  Boolean(oUpdatedDimensionFilter.items.length) : Boolean(oUpdatedDimensionFilter)
			});

		if (oChart.getSmartFilterId()) {
			var oSmartFilterBar = sap.ui.getCore().byId(oChart.getSmartFilterId());
			if (oSmartFilterBar && oSmartFilterBar.getEntitySet() === property.entitySet) {
				sBindingPath = oChart.considerAnalyticBinding(sBindingPath,oSmartFilterBar);
			}
		}
		var aSelectionFields = FilterUtil.getVisualFilterSelectFields(property.measureField, property.dimensionField, property.dimensionFieldDisplay), //Ensure a property is added only once to selectionfields
		navProperty = FilterUtil.IsNavigationProperty(oChart.getModel(), property.entitySet , property.dimensionFieldDisplay) ? property.dimensionFieldDisplay.split("/")[0] : null,
		oUrlParameters = {
			select: aSelectionFields.join(",")
		};
		if (navProperty) {
			extend(oUrlParameters, {"expand": navProperty});
		}
		var filters, filterList;
		filters = oChart.getDimensionFilterExternal();
		if (filters && filters.aFilters && filters.aFilters.length > 0) {
			filterList = [filters];
		}
		//Creating new List
		var oList = new List({
			mode: property.filterRestriction === "single" ? SapMLibrary.ListMode.SingleSelectMaster : SapMLibrary.ListMode.MultiSelect,
			growing: true,
			//compact filter shows two hundred records only , ALP should also move to that approach for dropdown
			growingThreshold: 15,
			//compact filter does not show this message
			showNoData: false,
			infoToolbar: oToolbar,
			items: {
			path: sBindingPath,
			template: template,
			filters: filterList,
			sorter: that.getSortObject(property),
			parameters: oUrlParameters
			}
		});
		if (sfb.isDialogOpen()) {
			template.setModel(oChart.getModel("_dialogFilter"), "_dialogFilter");
		} else {
			template.setModel(oChart.getModel("_filter"), "_filter");
		}
		oList.setModel(oModel);

		oToolbarMenuButton.attachPress(function(oEvt) {
			if (property.filterRestriction == "multiple" && oUpdatedDimensionFilter.items.length || oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty('items') && !oUpdatedDimensionFilter.items.length && bShowOnlySelected) {
				that.updateFilterWithListBindings(oList, oToolbarMenuButton, i18n, property.filterRestriction, property.dimensionField);
			} else if (property.filterRestriction == "single" && oUpdatedDimensionFilter != null || oUpdatedDimensionFilter == null && bShowOnlySelected) {
				that.updateFilterWithListBindings(oList, oToolbarMenuButton, i18n, property.filterRestriction, property.dimensionField);
			}
		});
		return oList;
	};
	//Formmater function to update the visiblity of the list based based on the current selection.
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.selectedVisibilityUpdateFormatter = function (oUpdatedDimensionFilter, currentElement) {
		for (var i = 0; i < oUpdatedDimensionFilter.items.length; i++) {
			if (oUpdatedDimensionFilter.items[i].key === currentElement) {
				return true;
			}
		}
		return false;
	};

	//StandardListItemCreation
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.standardListItemTemplateCreation = function (oChart, property, sfb) {
		var sTextArrangement = property.textArrangement,
		aDescriptionBindingParts = [];
		aDescriptionBindingParts.push({
			path : property.measureField
		});
		var aSelectedParts = sfb.isDialogOpen() ? ["_dialogFilter>/" + oChart.getParentProperty(), property.dimensionField] : ["_filter>/" + oChart.getParentProperty(), property.dimensionField];
		// send unit field part to the formatter only if unitField is present
		property.unitField ? aDescriptionBindingParts.push({ path : property.unitField }) : "" ;
		var template = new StandardListItem({
			title: {
				parts: [property.dimensionFieldDisplay, property.dimensionField],
				formatter: function(oDimFieldDisplay, sDimField) {
					return FilterUtil.getTextArrangement(oDimFieldDisplay, sDimField, sTextArrangement);
				}
			},
			description: {
				parts: aDescriptionBindingParts,
				formatter: function(dimValue, unitField) {
					return sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroChart.prototype._getFormattedNumberWithUoM(dimValue, unitField);
				}
			},
			selected: {
				parts: aSelectedParts,
				formatter: function(oDimensionFilter, currentElement) {
					//if the show selected menu is selected then we form a query to get only matching value hence, it's true always
					if (bShowOnlySelected) {
						return true;
					} else {
						// if the show All is true then only selected the values as per oUpdatedDimensionFilter
						if (typeof (oUpdatedDimensionFilter) === "object" && oUpdatedDimensionFilter !== null) {
							for (var i = 0; i < oUpdatedDimensionFilter.items.length; i++) {
								if (oUpdatedDimensionFilter.items[i].key === currentElement) {
									return true;
								}
							}
						} else {
							return (oUpdatedDimensionFilter !== null && oUpdatedDimensionFilter === currentElement) ? true : false;
						}
					}
				}
			}
		});
		return template;
	};

	/**
	 * getSortObject takes the property object to returns the sorted object.
	 *
	 * @param { property}
	 * @returns {sorter object}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.getSortObject = function (property) {
		if (property.sortOrder && property.sortOrder.length) {
			return new Sorter((property.sortOrder[0].Field) ? property.sortOrder[0].Field.String : "", property.sortOrder[0].Descending.Boolean);
		}
	};

	/**
	 * getSortObject takes the property object to returns the sorted object.
	 *
	 * @param { property}
	 * @returns {sorter object}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.updateFilterWithListBindings = function (oList, oToolbarMenuButton, i18n, filterRestriction, filterBy) {
		var aFilters = [];
		bShowOnlySelected = !bShowOnlySelected;
		this.bUpdateToolbarButton = bShowOnlySelected;
		if (bShowOnlySelected) {
			oToolbarMenuButton.setTooltip(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_ALL"));
			oToolbarMenuButton.setEnabled(true);
			if (filterRestriction === 'multiple') {
				for (var i = 0; i < oUpdatedDimensionFilter.items.length; i++) {
					var filter = new Filter(filterBy, FilterOperator.EQ, (filterRestriction === "multiple") ? oUpdatedDimensionFilter.items[i].key : oUpdatedDimensionFilter);
					aFilters.push(filter);
				}
			} else if (filterRestriction === 'single') {
				var filter = new Filter(filterBy, FilterOperator.EQ, oUpdatedDimensionFilter);
				aFilters.push(filter);
			}
			oList.getBinding("items").filter(aFilters);
		} else {
			oToolbarMenuButton.setTooltip(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_SELECTED"));
			oToolbarMenuButton.setEnabled((oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ? Boolean(oUpdatedDimensionFilter.items.length) : Boolean(oUpdatedDimensionFilter));
			oList.getBinding("items").filter(aFilters);
		}
	};

	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.fnApplyFilterFromSearchField = function (filterBy, sQuery) {
			var aFilters = [];
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter(filterBy, FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
			return aFilters;
			};

	return DropDownController;

});
