/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'sap/ui/mdc/enum/ProcessingStrategy', 'sap/ui/mdc/condition/FilterOperatorUtil', './BaseController', 'sap/ui/mdc/p13n/P13nBuilder', 'sap/ui/mdc/p13n/FlexUtil', 'sap/base/Log', 'sap/base/util/merge', 'sap/base/util/UriParameters'
], function (ProcessingStrategy, FilterOperatorUtil, BaseController, P13nBuilder, FlexUtil, Log, merge, SAPUriParameters) {
	"use strict";

    var FilterController = BaseController.extend("sap.ui.mdc.p13n.subcontroller.FilterController", {
        constructor: function() {
			BaseController.apply(this, arguments);
			this._bResetEnabled = true;
		}
    });

    FilterController.prototype.getStateKey = function() {
        return "filter";
    };

    FilterController.prototype.getUISettings = function() {
        return {
            title: sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc").getText("filter.PERSONALIZATION_DIALOG_TITLE"),
            tabText: sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc").getText("p13nDialog.TAB_Filter"),
            afterClose: function(oEvt) {
                var oDialog = oEvt.getSource();
                if (oDialog) {
                    var oDialogContent = oDialog.getContent()[0];
                    if (oDialogContent.isA("sap.m.p13n.Container")) {
                        oDialogContent.removeView("Filter");
                    } else {
                        oDialog.removeAllContent();
                    }
                }

                oDialog.destroy();
            }
        };
    };

    FilterController.prototype.getChangeOperations = function() {
        return {
            add: "addCondition",
            remove: "removeCondition"
        };
    };

    FilterController.prototype.getBeforeApply = function() {
        var oAdaptationFilterBar = this.getAdaptationControl().getInbuiltFilter();
        var pConditionPromise = oAdaptationFilterBar ? oAdaptationFilterBar.createConditionChanges() : Promise.resolve([]);
        return pConditionPromise;
    };

    FilterController.prototype.getFilterControl = function() {
        return this.getAdaptationControl().isA("sap.ui.mdc.IFilter") ? this.getAdaptationControl() : this.getAdaptationControl()._oP13nFilter;
    };

    FilterController.prototype.sanityCheck = function(oState) {
        FilterController.checkConditionOperatorSanity(oState);
        return oState;
    };

    /**
     * @private
     * @ui5-restricted sap.ui.mdc
     *
     * A sanity check that can be used for conditions by utilizing the FilterOperatorUtil.
     * This is being used to remove conditions that are using unknown operators.
     *
     * @param {object} mConditions The condition map.
     */
    FilterController.checkConditionOperatorSanity = function(mConditions) {
        //TODO: consider to harmonize this sanity check with 'getCurrentState' cleanups
        for (var sFieldPath in mConditions) {
            var aConditions = mConditions[sFieldPath];
            for (var i = 0; i < aConditions.length; i++) {
                var oCondition = aConditions[i];
                var sOperator = oCondition.operator;
                if (!FilterOperatorUtil.getOperator(sOperator)){
                    aConditions.splice(i, 1);
                    /*
                        * in case the unknown operator has been removed, we need to check
                        * if this caused the object to be empty to not create unnecessary remove changes
                        * this should only be done within this check, as empty objects have a special meaning in the 'filter'
                        * object within the external state to reset the given conditions for a single property
                        */
                    if (mConditions[sFieldPath].length == 0) {
                        delete mConditions[sFieldPath];
                    }
                    Log.warning("The provided conditions for field '" + sFieldPath + "' contain unsupported operators - these conditions will be neglected.");
                }
            }
        }
    };

    FilterController.prototype._getPresenceAttribute = function(bexternalAppliance){
        return "active";
    };

    FilterController.prototype.getAdaptationUI = function (oPropertyHelper, oWrapper) {
        var oAdaptationModel = this._getP13nModel(oPropertyHelper);

        return this.getAdaptationControl().retrieveInbuiltFilter().then(function(oAdaptationFilterBar){
            oAdaptationFilterBar.setP13nData(oAdaptationModel.oData);
            oAdaptationFilterBar.setLiveMode(false);
            this._oAdaptationFB = oAdaptationFilterBar;
            return oAdaptationFilterBar.createFilterFields().then(function(){
                return oAdaptationFilterBar;
            });
        }.bind(this));
    };

    FilterController.prototype.update = function(oPropertyHelper){
        BaseController.prototype.update.apply(this, arguments);
        var oAdaptationControl = this.getAdaptationControl();
        var oInbuiltFilter = oAdaptationControl && oAdaptationControl.getInbuiltFilter();

        if (oInbuiltFilter) {
            oInbuiltFilter.createFilterFields();
        }
    };

    FilterController.prototype.getDelta = function(mPropertyBag) {
        if (mPropertyBag.applyAbsolute === ProcessingStrategy.FullReplace) {
            Object.keys(mPropertyBag.existingState).forEach(function(sKey){
                if (!mPropertyBag.changedState.hasOwnProperty(sKey)) {
                    mPropertyBag.changedState[sKey] = [];
                }
            });
        }
        return FlexUtil.getConditionDeltaChanges(mPropertyBag);
    };

    FilterController.prototype.model2State = function() {
        var oItems = {},
            oFilter = this.getCurrentState();
            this._oAdaptationModel.getProperty("/items").forEach(function(oItem) {
            if (oItem.active && Object.keys(oFilter).includes(oItem.name)) {
                oItems[oItem.name] = oFilter[oItem.name];
            }
        });

        return oItems;
    };

    FilterController.prototype.mixInfoAndState = function(oPropertyHelper) {

        var mExistingFilters = this.getCurrentState() || {};

        var oP13nData = P13nBuilder.prepareAdaptationData(oPropertyHelper, function(mItem, oProperty){

            var aExistingFilters = mExistingFilters[mItem.name];
            mItem.active = aExistingFilters && aExistingFilters.length > 0 ? true : false;

            return !(oProperty.filterable === false);
        });

        P13nBuilder.sortP13nData({
            visible: new SAPUriParameters(window.location.search).getAll("sap-ui-xx-filterQueryPanel")[0] === "true" ? "active" : null,//FIXME: remove with URL parameter
            position: undefined
        }, oP13nData.items);

        return oP13nData;
    };

    FilterController.prototype.changesToState = function(aChanges, mOld, mNew) {

        var mStateDiff = {};

        aChanges.forEach(function(oChange){
            var oStateDiffContent = merge({}, oChange.changeSpecificData.content);
            var sName = oStateDiffContent.name;

            if (!mStateDiff[sName]) {
                mStateDiff[sName] = [];
            }

            //set the presence attribute to false in case of an explicit remove
            if (oChange.changeSpecificData.changeType === this.getChangeOperations()["remove"]) {
                oStateDiffContent.condition.filtered = false;
            }
            mStateDiff[sName].push(oStateDiffContent.condition);
        }.bind(this));

        return mStateDiff;
    };

	return FilterController;

});
