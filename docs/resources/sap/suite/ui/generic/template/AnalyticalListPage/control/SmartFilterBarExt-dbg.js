sap.ui.define([
    "sap/ui/comp/smartfilterbar/SmartFilterBar",
    "sap/m/SegmentedButton",
    "sap/m/SegmentedButtonItem"
], function(SmartFilterBar, SegmentedButton, SegmentedButtonItem) {
    "use strict";

	// Need to integrate with the existing smart filter bar integration with the SmartChart and SmartTable.
	// Since we have no control over changing the SmartFilterBar, SmartTable and SmartChart, and we need the
	//   SmartVisualFilterBar to integrate with the SmartChart and SmartTable, it makes sense to extend the SmartFilterBar to act as a fascade.
	//   This fascade will return the correct set of filters when in either Visual Filter mode or the standard Compact filter mode.
	var SmartFilterBarExt = SmartFilterBar.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.SmartFilterBarExt", {
		metadata: {
			events: {
				switchToVisualFilter: {}
			}
		},
		renderer: {}
	});

	SmartFilterBarExt.prototype.getSuppressValueListsAssociation = function () {
		return true;
	};

	SmartFilterBarExt.prototype.checkSearchAllowed = function(oState) {
		if (oState && oState.oSmartFilterbar) {
			var aAllFields = oState.oSmartFilterbar.determineMandatoryFilterItems(),
			aFiltersWithValues = oState.oSmartFilterbar.getFiltersWithValues(),
			oTemplatePrivate = oState.oController.getView().getModel("_templPriv"),
			bIsSearchAllowed = true, count = 0;
			//checking if mandatory params are filled only when they are present in the app
			if (aAllFields.length) {
				// when mandatory params exist and no values or some values are filled, search is not allowed
				if (!aFiltersWithValues.length || (aFiltersWithValues.length < aAllFields.length)) {
					bIsSearchAllowed = false;
				} else {
					//when mandatory params exist and values are filled, make sure that apt fields are provided with values and then make search allowed.
					for (var i = 0; i < aAllFields.length; i++) {
						for (var j = 0; j < aFiltersWithValues.length; j++) {
							if (aFiltersWithValues[j].getName() === aAllFields[i].getName()) {
								count++;
							}
						}
					}
					bIsSearchAllowed = (count === aAllFields.length);
				}
			}
			if (bIsSearchAllowed) {
				// if fields have values check whether they are valid or not
				// if all mandatory fields have data
				var oSearchAllowed = SmartFilterBar.prototype.verifySearchAllowed.apply(this, arguments);
				if (oSearchAllowed.hasOwnProperty("error") || oSearchAllowed.hasOwnProperty("mandatory")) {
					bIsSearchAllowed = false;
				}
			}
			oTemplatePrivate.setProperty("/alp/searchable", bIsSearchAllowed);
		}
	};
	return SmartFilterBarExt;
}, true);