/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/mdc/p13n/subcontroller/FilterController", "sap/ui/mdc/p13n/subcontroller/AdaptFiltersController", "sap/ui/mdc/filterbar/p13n/GroupContainer", "sap/ui/mdc/filterbar/p13n/FilterColumnLayout", "sap/ui/mdc/filterbar/p13n/FilterGroupLayout","sap/ui/mdc/filterbar/p13n/TableContainer", "sap/ui/mdc/filterbar/FilterBarBase", "sap/ui/mdc/filterbar/FilterBarBaseRenderer", "sap/base/util/merge", "sap/ui/core/Core", "sap/ui/mdc/enum/PersistenceMode"
], function(FilterController, AdaptFiltersController, GroupContainer, FilterColumnLayout, FilterGroupLayout, TableContainer, FilterBarBase, FilterBarBaseRenderer, merge, Core, PersistenceMode) {
	"use strict";

	/**
	 * Constructor for a new AdaptationFilterBar.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The <code>AdaptationFilterBar</code> control is used for a lightweight FilterBar implementation for p13n use cases.
	 * The <code>AdaptationFilterBar</code> should only be used if the consuming control implements atleast the <code>IFilterSource</code>
	 * interface to provide basic filter functionality.
	 *
	 * @extends sap.ui.mdc.filterbar.FilterBarBase
	 * @author SAP SE
	 * @version 1.108.8
	 * @constructor
	 * @private
	 * @since 1.80.0
	 * @alias sap.ui.mdc.filterbar.p13n.AdaptationFilterBar
	 */
	var AdaptationFilterBar = FilterBarBase.extend("sap.ui.mdc.filterbar.p13n.AdaptationFilterBar", {
		metadata: {
			library: "sap.ui.mdc",
			associations: {
				/**
				 * Determines the parent on which the condition changes should be applied on.
				 */
				adaptationControl: {
					type: "sap.ui.mdc.Control",
					multiple: false
				}
			},
			events: {
				/**
				 * Event which is only being thrown if the inner layout has a <code>change</code> event.
				 * This depends whether the inner layout supports the selection of FilterFields.
				 */
				change: {}
			}
		},
		renderer: FilterBarBaseRenderer
	});

	AdaptationFilterBar.prototype.init = function() {
		FilterBarBase.prototype.init.apply(this,arguments);
		this.addStyleClass("sapUIAdaptationFilterBar");
		this._bPersistValues = true;

		this.getEngine().defaultProviderRegistry.attach(this, PersistenceMode.Transient);
		this._fnResolveAdaptationControlPromise = null;
		this._oAdaptationControlPromise = new Promise(function(resolve, reject) {
			this._fnResolveAdaptationControlPromise = resolve;
		}.bind(this));
	};

	AdaptationFilterBar.prototype._onModifications = function() {
		var pModification = FilterBarBase.prototype._onModifications.apply(this, arguments);
		if (this._oFilterBarLayout.getInner().isA("sap.ui.mdc.p13n.panels.FilterPanel")) {
			var oP13nData = this._oFilterBarLayout.getInner().getP13nData();
			this._updateActiveStatus(oP13nData);
			this._oFilterBarLayout.setP13nData({items: oP13nData});
		}
		return pModification;
	};

	AdaptationFilterBar.prototype.applySettings = function() {
		FilterBarBase.prototype._applySettings.apply(this, arguments);
		this._waitForAdaptControlAndPropertyHelper().then(function() {
			this._initControlDelegate();
		}.bind(this));
	};

	AdaptationFilterBar.prototype.setVisibleFields = function(aVisibleKeys) {
		var oAdaptationControl = this._getAdaptationControlInstance();
		if (this._checkAdvancedParent(oAdaptationControl)) {
			throw new Error("Only supported for simple parents");
		}

		this._aVisibleKeys = aVisibleKeys;
	};

	// FIXME: currently the FilterBar key handling is tightly coupled to the path
	// as the FilterFields themselves are referenced through the path in the conditions binding path
	// of the according FilterField. In use cases as for the AdaptationFilterBar, the Table's propertyinfo
	// is being propagated to the FilterBar, where the name does not neessarily need to reflect the technical
	// path in the model. Once the key reference between FilterFields, Columns and property info object has been aligned,
	// the below fallback logic will become obsolete.
	AdaptationFilterBar.prototype._getPropertyByName = function(sName) {
		var oPropertyHelper = this.getPropertyHelper();
		if (oPropertyHelper) {
			var oProperty = oPropertyHelper.getProperties().find(function(oProp){
				return oProp.path === sName;
			});

			if (!oProperty) {
				oProperty = oPropertyHelper.getPropertyMap()[sName] || null;
			}
			return oProperty;
		}
	};

	AdaptationFilterBar.prototype._waitForAdaptControlAndPropertyHelper = function(){
		return this._oAdaptationControlPromise.then(function() {
			return this._getAdaptationControlInstance().awaitPropertyHelper().then(function(oPropertyHelper) {
				this._oPropertyHelper = oPropertyHelper;
			}.bind(this));
		}.bind(this));
	};

	AdaptationFilterBar.prototype._initControlDelegate = function() {
		return this.initControlDelegate().then(function() {
			//this.getTypeUtil();
			if (!this._bIsBeingDestroyed) {
				this._applyInitialFilterConditions();
			}
		}.bind(this));
	};

	AdaptationFilterBar.prototype.getControlDelegate = function() {
		return this._getAdaptationControlInstance().getControlDelegate();
	};

	AdaptationFilterBar.prototype.initControlDelegate = function() {
		return this._oAdaptationControlPromise.then(function() {
			return this._getAdaptationControlInstance().initControlDelegate();
		}.bind(this));
	};

	AdaptationFilterBar.prototype.initPropertyHelper = function() {
		return this._oAdaptationControlPromise.then(function() {
			return this._getAdaptationControlInstance().initPropertyHelper();
		}.bind(this));
	};

	AdaptationFilterBar.prototype.getTypeUtil = function() {
		if (!this._getAdaptationControlInstance()) {
			throw new Error("No adaptation control assigned yet.");
		}

		return this._getAdaptationControlInstance().getTypeUtil();
	};

	AdaptationFilterBar.prototype.setMessageStrip = function(oStrip) {
		this._oFilterBarLayout.setMessageStrip(oStrip);
	};

	AdaptationFilterBar.prototype.setLiveMode = function(bLive, bSuppressInvalidate) {
		FilterBarBase.prototype.setLiveMode.apply(this, arguments);

		//update adaptationModel while dialog is open
		this._oConditionModel.attachPropertyChange(function(oEvt){
			var sKey = oEvt.getParameter("path").substring(12);
			if (this.oAdaptationData){
				var aItems = this.oAdaptationData.items;
				var oItem = aItems.find(function(o){
					return o.name == sKey;
				});
				if (oItem && this._checkAdvancedParent(this._getAdaptationControlInstance()) ) {
					oItem.active = this._getConditionModel().getConditions(sKey).length > 0 ? true : false;
				}
			}
		}.bind(this));

		return this;
	};

	AdaptationFilterBar.prototype._retrieveMetadata = function() {

		return this._oAdaptationControlPromise.then(function() {
			return this._getAdaptationControlInstance().awaitPropertyHelper().then(function(oPropertyHelper) {
				this._oMetadataAppliedPromise = Promise.resolve();
				if (!this._getAdaptationControlInstance().isPropertyHelperFinal()) {
					return this.finalizePropertyHelper();
				}

				return FilterBarBase.prototype._retrieveMetadata.apply(this, arguments);
			}.bind(this));
		}.bind(this));
	};

	AdaptationFilterBar.prototype.createConditionChanges = function() {
		return Promise.all([this._oAdaptationControlPromise, this._getAdaptationControlInstance().awaitControlDelegate()]).then(function() {
			var mConditions = this._getModelConditions(this._getConditionModel(), false, true);
			if (this._bPersistValues) {
				//this._getAdaptationControlInstance(), "Filter", mConditions, true, true
				return this.getEngine().createChanges({
					control: this._getAdaptationControlInstance(),
					applyAbsolute: true,
					key: "Filter",
					state: mConditions,
					suppressAppliance: true
				});
			} else {
				//TODO: currently only required once the parent FilterBar has p13nMode 'value' disabled.
				this._getAdaptationControlInstance()._setXConditions(mConditions);
				return Promise.resolve(null);
			}
			}.bind(this));
	};

	/**
	 *
	 * Please note that the provided model should be created with sap.ui.mdc.p13n.P13nBuilder
	 *
	 * @param {object[]} aP13nData Necessary data to display and create <code>FilterColumnLayout</code> instances.
	 *
	 */
	AdaptationFilterBar.prototype.setP13nData = function(aP13nData) {
		this.oAdaptationData = aP13nData;
		this._getConditionModel().checkUpdate(true);
		this._updateActiveStatus(this.oAdaptationData.items);
		this._oFilterBarLayout.update(aP13nData);
	};

	AdaptationFilterBar.prototype._updateActiveStatus = function(oP13nData) {
		var mConditions = this.getFilterConditions();
		oP13nData.forEach(function(oP13nItem){
			var oFilterField = this.mFilterFields && this.mFilterFields[oP13nItem.name];
			if (oFilterField) {
				var sKey = oFilterField.getFieldPath();
				if (mConditions[sKey] && mConditions[sKey].length > 0) {
					oP13nItem.active = true;
				}
			}
		}.bind(this));
	};

	AdaptationFilterBar.prototype.getP13nData = function() {
		if (this._aVisibleKeys && this._aVisibleKeys.length > 0) {
			this.oAdaptationData.items.forEach(function(oItem){
				if (this._aVisibleKeys.indexOf(oItem.name) > -1) {
					oItem.active = true;
				}
			}, this);
		}
		return this.oAdaptationData;
	};

	AdaptationFilterBar.prototype._handleFilterItemSubmit = function() {
		return;
	};

	AdaptationFilterBar.prototype._getWaitForChangesPromise = function() {
		//Change is applied on parent --> wait for the parent promise not the child
		return this.getEngine().waitForChanges(this._getAdaptationControlInstance());
	};

	AdaptationFilterBar.prototype.applyConditionsAfterChangesApplied = function(oControl) {
		if (oControl === this._getAdaptationControlInstance()) {
			this._getWaitForChangesPromise()
			.then(function(){
				this.triggerSearch();
			}.bind(this));
		}
	};

	/**
	 * Method which will initialize the <code>AdaptationFilterBar</code> and create the required FilterFields
	 *
	 * @returns {Promise} A Promise which resolves once all FilterFields are ready and added to the <code>filterItems</code> aggregation
	 */
	AdaptationFilterBar.prototype.createFilterFields = function(){
		return this.initializedWithMetadata().then(function(){
			var mConditions = this._bPersistValues ? this._getAdaptationControlInstance().getFilterConditions() : this._getAdaptationControlInstance()._getXConditions();

			this.setFilterConditions(mConditions);
			this._setXConditions(mConditions);

			if (this._bFilterFieldsCreated) {
				this._oFilterBarLayout.setP13nData(this.getP13nData());
				return this;
			}

			var oAdaptationControl = this._getAdaptationControlInstance();
			var oDelegate = oAdaptationControl.getControlDelegate();
			var oFilterDelegate = this._checkAdvancedParent(oAdaptationControl) ? oDelegate : oDelegate.getFilterDelegate();

			//used to store the originals
			this._mOriginalsForClone = {};
			this.mFilterFields = {};
			var aFieldPromises = [];

			this.getP13nData().items.forEach(function(oItem, iIndex){
				var oFilterFieldPromise;

				oFilterFieldPromise = this._checkExisting(oItem, oFilterDelegate);

				oFilterFieldPromise.then(function(oFilterField){

					var oFieldForDialog;

					//Important: always use clones for the personalization dialog. The "originals" should never be shown in the P13n UI
					//Currently the IFilter interface is being used to identify if a more complex personalization is required, this is
					//as of now only part for the sap.ui.mdc.FilterBar, as the AdaptationFilterBar will allow to select FilterFields in advance.
					//This logic requires a cloning logic, as there is a mix of parent/child filterFields which is not the case if the adaptaitonControl
					//does only provide Filter capabilities via an inenr FilterBar (such as the Table inbuilt filtering)
					if (this._checkAdvancedParent(oAdaptationControl)) {
						if (oFilterField._bTemporaryOriginal) {
							delete oFilterFieldPromise._bTemporaryOriginal;
							this._mOriginalsForClone[oFilterField.getFieldPath()] = oFilterField;
						}
						oFieldForDialog = oFilterField.clone();
					} else {
						oFieldForDialog = oFilterField;
					}

					this.mFilterFields[oItem.name] = oFieldForDialog;

				}.bind(this));

				aFieldPromises.push(oFilterFieldPromise);

			}.bind(this));

			return Promise.all(aFieldPromises).then(function(){
				this.getP13nData().items.forEach(function(oItem){
					this.addAggregation("filterItems", this.mFilterFields[oItem.name]);
				}.bind(this));

				this._oFilterBarLayout.setP13nData(this.getP13nData());
				this._bFilterFieldsCreated = true;

				return this;
			}.bind(this));

		}.bind(this));
	};

	/**
	 * This method checks whether a FilterField is already present on the parent and will return this
	 * instead of requesting a new one.
	 *
	 * @param {object} oItem Corresponding item in the AdaptaitonModel
	 * @param {object} oFilterDelegate Parent filter delegate
	 *
	 * @returns {Promise} A Promise resolving in the corresponding FilterField
	 */
	AdaptationFilterBar.prototype._checkExisting = function(oItem, oFilterDelegate) {
		var oFilterFieldPromise;

		var oAdaptationControl = this._getAdaptationControlInstance();
		var aExistingItems = this._checkAdvancedParent(oAdaptationControl) ? oAdaptationControl.getFilterItems() : [];

		var mExistingFilterItems = aExistingItems.reduce(function(mMap, oField){
			mMap[oField.getFieldPath()] = oField;
			return mMap;
		},{});

		if (mExistingFilterItems[oItem.name]){
			oFilterFieldPromise = Promise.resolve(mExistingFilterItems[oItem.name]);
		} else  {

			oFilterFieldPromise = oFilterDelegate.addItem(oItem.name, this._getAdaptationControlInstance());

			oFilterFieldPromise = oFilterFieldPromise.then(function(oFilterField){

				if (!oFilterField) {
					throw new Error("No FilterField could be created for property: '" + oItem.name + "'.");
				}

				oFilterField._bTemporaryOriginal = true;
				return oFilterField;
			});
		}

		return oFilterFieldPromise;
	};

	AdaptationFilterBar.prototype.executeRemoves = function() {

		var aExistingItems = this._oFilterBarLayout.getInner().getSelectedFields();
		var aOriginalsToRemove = [];

		Object.keys(this._mOriginalsForClone).forEach(function(sKey){
			var oDelegate = this._getAdaptationControlInstance().getControlDelegate();

			if (aExistingItems.indexOf(sKey) < 0) {//Originals that have not been selected --> use continue similar to 'ItemBaseFlex'
				var oRemovePromise = oDelegate.removeItem.call(oDelegate, sKey, this._getAdaptationControlInstance()).then(function(bContinue){
					if (bContinue && this._mOriginalsForClone[sKey]) {
						// destroy the item
						this._mOriginalsForClone[sKey].destroy();
						delete this._mOriginalsForClone[sKey];
					}
				}.bind(this));
				aOriginalsToRemove.push(oRemovePromise);
			}

		}.bind(this));

		return Promise.all(aOriginalsToRemove);
	};

	AdaptationFilterBar.prototype._checkAdvancedParent = function(oControl) {
		if (!oControl.isA("sap.ui.mdc.IFilterSource") && !oControl.isA("sap.ui.mdc.IFilter")) {
			throw new Error("The 'adaptationControl' needs to implement the IFilterSource or IFilter interface");
		}

		return oControl.isA("sap.ui.mdc.IFilter");
	};

	/**
	 *
	 * @param {sap.ui.mdc.Control} oControl the mdc control instance
	 * @param {boolean} bSuppressInvalidate suppress invalidation
	 */
	AdaptationFilterBar.prototype.setAdaptationControl = function(oControl, bSuppressInvalidate) {

		if (this._fnResolveAdaptationControlPromise) {
			this._fnResolveAdaptationControlPromise();
			this._fnResolveAdaptationControlPromise = null;
		}

		this.setAssociation("adaptationControl", oControl, bSuppressInvalidate);

		this._cLayoutItem = FilterGroupLayout;
		this._oFilterBarLayout = this._checkAdvancedParent(oControl) ? new GroupContainer() : new TableContainer();

		this._oFilterBarLayout.getInner().setParent(this);
		this.setAggregation("layout", this._oFilterBarLayout, true);

		if (this._oFilterBarLayout.getInner().attachChange) {
			this._oFilterBarLayout.getInner().attachChange(function(oEvt){
				if (oEvt.getParameter("reason") === "Remove") {
					var oItem = oEvt.getParameter("item");
					var mConditions = {};
					mConditions[this.mFilterFields[oItem.name].getFieldPath()] = [];

					return this.getEngine().createChanges({
						control: this,
						applyAbsolute: true,
						key: "Filter",
						state: mConditions
					});
				}
				this.fireChange();
			}.bind(this));
		}
		return this;
	};

	/**
	 * Returns an instance of the associated adaptation control, if available.
	 * @private
	 * @ui5-restricted sap.ui.mdc
	 * @returns {sap.ui.mdc.Control} The adaptation control instance.
	 */
	AdaptationFilterBar.prototype._getAdaptationControlInstance = function () {
		var sAdaptationControlId = this.getAdaptationControl();
		return sAdaptationControlId && Core.byId(sAdaptationControlId);
	};

	AdaptationFilterBar.prototype.exit = function() {
		this.getEngine().defaultProviderRegistry.detach(this);
		FilterBarBase.prototype.exit.apply(this, arguments);
		for (var sKey in this._mOriginalsForClone) {
			this._mOriginalsForClone[sKey].destroy();
		}
		this._mOriginalsForClone = null;
		this.oAdaptationData = null;
		this.mFilterFields = null;
		this._fnResolveAdaptationControlPromise = null;
		this._oAdaptationControlPromise = null;
	};

	return AdaptationFilterBar;

});