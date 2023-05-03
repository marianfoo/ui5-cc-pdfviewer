/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'sap/ui/mdc/util/loadModules',
	'sap/ui/mdc/valuehelp/base/ListContent',
	'sap/ui/mdc/condition/Condition',
	'sap/ui/mdc/enum/ConditionValidated',
	'sap/ui/mdc/util/Common',
	'sap/ui/mdc/enum/PersistenceMode',
	'sap/ui/mdc/p13n/Engine',
	'sap/base/util/merge',
	'sap/ui/mdc/p13n/StateUtil'
], function(
	loadModules,
	ListContent,
	Condition,
	ConditionValidated,
	Common,
	PersistenceMode,
	Engine,
	merge,
	StateUtil
) {
	"use strict";

	/**
	 * Constructor for a new <code>FilterableListContent</code>.
	 *
	 * @param {string} [sId] ID for the new element, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new element
	 * @class Content for the {@link sap.ui.mdc.valuehelp.base.Container Container} element.
	 * @extends sap.ui.mdc.valuehelp.base.ListContent
	 * @version 1.108.8
	 * @constructor
	 * @abstract
	 * @private
	 * @ui5-restricted sap.ui.mdc
	 * @since 1.95.0
	 * @experimental As of version 1.95
	 * @alias sap.ui.mdc.valuehelp.base.FilterableListContent
	 */
	var FilterableListContent = ListContent.extend("sap.ui.mdc.valuehelp.base.FilterableListContent", /** @lends sap.ui.mdc.valuehelp.base.FilterableListContent.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties:	{
				/**
				 * The fields based on which the table data is filtered. For filtering the value of the <code>filterValue</code> property is used.
				 *
				 * If set to <code>$search</code> and the used binding supports search requests, a $search request is used for filtering.
				 *
				 * If set to one or more properties, the filters for these properties are used for filtering.
				 * These filters are set on the <code>ListBinding</code> used.
				 * The properties need to be separated by commas and enclosed by "*" characters. (<code>"*Property1,Property2*"</code>)
				 *
				 * If it is empty, no suggestion is available.
				 */
				filterFields: {
					type: "string",
					defaultValue: ""
				},

				/**
				 * The path of the key field in the content binding.
				 * If a table is used as content, this is the binding path of the key of the items.
				 *
				 * If not set, the FieldPath of the assigned field is used.
				 */
				keyPath: {
					type: "string",
					defaultValue: ""
				},

				/**
				 * The path of the description field in the content binding.
				 * If a table is used as content, this is the binding path of the description of the items.
				 */
				descriptionPath: {
					type: "string",
					defaultValue: ""
				},

				group: {
					type: "string",
					defaultValue: ""
				}
			},
			aggregations: {
				/**
				 * FilterBar
				 */
				filterBar: {
					type: "sap.ui.mdc.filterbar.vh.FilterBar",
					multiple: false
				},
				/**
				 * Default FilterBar, ceated internally if none given.
				 */
				_defaultFilterBar: {
					type: "sap.ui.mdc.filterbar.vh.FilterBar",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {
				filters: {
					type: "sap.ui.mdc.IFilter",
					multiple: true
				}
			},
			events: {
			}
		}
	});

	FilterableListContent.prototype.init = function() {
		ListContent.prototype.init.apply(this, arguments);
		this._oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");
		this._oObserver.observe(this, {
			properties: ["filterFields"],
			aggregations: ["_defaultFilterBar", "filterBar"]
		});

		Engine.getInstance().defaultProviderRegistry.attach(this, PersistenceMode.Transient);

	};

	FilterableListContent.prototype._handleFilterValueUpdate = function (oChanges) {
		if (this.isContainerOpen()) { // TODO: only visible content if multiple contens on dialog
			this.applyFilters(this._getPriorityFilterValue());
		}
	};

	FilterableListContent.prototype._reduceIFilterConditions = function (oConditions) {
		var oDelegate = this._getValueHelpDelegate();
		var oPayload = this._getValueHelpDelegatePayload();
		return oDelegate ? oDelegate.reduceIFilterConditions(oPayload, this, oConditions) : oConditions;
	};

	FilterableListContent.prototype.applyFilters = function (sSearch) {

	};


	FilterableListContent.prototype._prettyPrintFilters = function (oFilter) {

		var sRes;
		if (!oFilter) {
			return "";
		}
		if (Array.isArray(oFilter)) {
			sRes = "";
			oFilter.forEach(function(oFilter, iIndex, aFilters) {
				sRes += this._prettyPrintFilters(oFilter);
				if (aFilters.length - 1 != iIndex) {
					sRes += " or ";
				}
			}, this);
			return "(" + sRes + ")";
		} else if (oFilter._bMultiFilter) {
			sRes = "";
			var bAnd = oFilter.bAnd;
			oFilter.aFilters.forEach(function(oFilter, iIndex, aFilters) {
				sRes += this._prettyPrintFilters(oFilter);
				if (aFilters.length - 1 != iIndex) {
					sRes += bAnd ? " and " : " or ";
				}
			}, this);
			return "(" + sRes + ")";
		} else {
			sRes = oFilter.sPath + " " + oFilter.sOperator + " '" + oFilter.oValue1 + "'";
			if (oFilter.sOperator === "BT") {
				sRes += "...'" + oFilter.oValue2 + "'";
			}
			return sRes;
		}
	};

	FilterableListContent.prototype._getItemFromContext = function (oBindingContext, oOptions) {

		var sKeyPath = (oOptions && oOptions.keyPath) || this.getKeyPath();
		var sDescriptionPath = (oOptions && oOptions.descriptionPath) || this.getDescriptionPath();
		var vKey;
		var sDescription;
		//var sPath;

		if (!sKeyPath) {
			throw new Error("KeyPath missing"); // as we cannot determine key without keyPath
		}

		if (oBindingContext) {
			vKey = sKeyPath ? oBindingContext.getProperty(sKeyPath) : undefined;
			sDescription = sDescriptionPath ? oBindingContext.getProperty(sDescriptionPath) : undefined;
		}

		if (vKey === null || vKey === undefined) {
			return false;
		}

		var oPayload = this._createConditionPayload([vKey, sDescription], oBindingContext);


		return {key: vKey, description: sDescription, payload: oPayload};
	};

	FilterableListContent.prototype._createConditionPayload = function(aValues, vContext) {
		var oConditionPayload;
		var oDelegate = this._getValueHelpDelegate();

		if (oDelegate) {
			var oDelegatePayload = this._getValueHelpDelegatePayload();
			oConditionPayload = {};
			oConditionPayload = oDelegate.createConditionPayload(oDelegatePayload, this, aValues, vContext);
		}
		return oConditionPayload;
	};

	FilterableListContent.prototype._isItemSelected = function (oItem, aConditions) {
		var oDelegate = this._isValueHelpDelegateInitialized() && this._getValueHelpDelegate();
		return oDelegate ? oDelegate.isFilterableListItemSelected(this._getValueHelpDelegatePayload(), this, oItem, aConditions) : false;
	};

	FilterableListContent.prototype._createDefaultFilterBar = function() {
		return loadModules([
			"sap/ui/mdc/filterbar/vh/FilterBar"
		]).then(function(aModules) {
			var FilterBar = aModules[0];
			var oFilterBar = new FilterBar(this.getId() + "-FB", {
				liveMode: false, // !oWrapper.isSuspended(), // if suspended, no live search
				showGoButton: false
			});
			_setBasicSearch.call(this, oFilterBar);
			this.setAggregation("_defaultFilterBar", oFilterBar, true);
			return oFilterBar;
		}.bind(this));
	};

	FilterableListContent.prototype._handleSearch = function (oEvent) {
		var oFilterBar = oEvent.getSource();
		this._setLocalFilterValue(oFilterBar.getSearch());
		this.applyFilters(this._getPriorityFilterValue());

	};

	function _setBasicSearch(oFilterBar) {
		var oExistingBasicSearchField = oFilterBar.getBasicSearchField();
		var sFilterFields =  this.getFilterFields();
		if (!oExistingBasicSearchField && sFilterFields) { // TODO: use isSearchSupported but here Delegate needs to be loaded
			if (!this._oSearchField) {
				return loadModules([
					"sap/ui/mdc/FilterField"
				]).then(function (aModules){
					if (!oFilterBar.bIsDestroyed) {
						var FilterField = aModules[0];
						this._oSearchField = new FilterField(this.getId() + "-search", {
							conditions: "{$filters>/conditions/" + sFilterFields + "}",
							placeholder:"{$i18n>filterbar.SEARCH}",
							label:"{$i18n>filterbar.SEARCH}", // TODO: do we want a label?
							maxConditions: 1,
							width: "50%"
						});
						this._oSearchField._bCreatedByValueHelp = true;
						_setBasicSearch.call(this, oFilterBar);
					}
				}.bind(this));
			}
			oFilterBar.setBasicSearchField(this._oSearchField);
		} else if (oExistingBasicSearchField) {
			if (sFilterFields) {
				oExistingBasicSearchField.setConditions([]); // initialize search field
			} else if (oExistingBasicSearchField._bCreatedByValueHelp) {
				oFilterBar.setBasicSearchField(); // remove to reuse on other FilterBar
			}
		}
	}

	FilterableListContent.prototype.onContainerClose = function () {
		this._setLocalFilterValue(undefined);
	};

	FilterableListContent.prototype._getPriorityFilterBar = function () {
		return this.getFilterBar() || this.getAggregation("_defaultFilterBar");
	};

	FilterableListContent.prototype._observeChanges = function (oChanges) {
		if (oChanges.object == this) {
			var oFilterBar;

			if (["_defaultFilterBar", "filterBar"].indexOf(oChanges.name) !== -1) {
				oFilterBar = oChanges.child;
				var oDefaultFilterBar;
				if (oChanges.mutation === "insert") {
					_setBasicSearch.call(this, oFilterBar);
					this._assignCollectiveSearchSelect();

					if (oChanges.name !== "_defaultFilterBar" || !this.getFilterBar()) { // DefaultFilterBar only used if no other FilterBar assigned
						oFilterBar.attachSearch(this._handleSearch, this);
					}
					if (oChanges.name === "filterBar") {
						oDefaultFilterBar = this.getAggregation("_defaultFilterBar");
						if (oDefaultFilterBar) {
							oDefaultFilterBar.detachSearch(this._handleSearch, this);
						}
					}
				} else { // remove case
					var oExistingBasicSearchField = oFilterBar.getBasicSearchField();
					if (oExistingBasicSearchField && oExistingBasicSearchField._bCreatedByValueHelp) {
						oFilterBar.setBasicSearchField(); // remove to reuse on other FilterBar
					}

					oFilterBar.detachSearch(this._handleSearch, this);

					if (oChanges.name === "filterBar") {
						oDefaultFilterBar = this.getAggregation("_defaultFilterBar");
						if (oDefaultFilterBar) {
							oDefaultFilterBar.attachSearch(this._handleSearch, this);
						} else {
							this._createDefaultFilterBar();
						}
					}
				}
			} else if (oChanges.name === "filterFields") {
				// check if search fields needs to be removed or added
				oFilterBar = this._getPriorityFilterBar();
				if (oFilterBar) {
					_setBasicSearch.call(this, oFilterBar);
				}
			}
		}
		ListContent.prototype._observeChanges.apply(this, arguments);
	};

	FilterableListContent.prototype.getCollectiveSearchKey = function () {
		return this._oCollectiveSearchSelect && this._oCollectiveSearchSelect.getSelectedItemKey();
	};

	FilterableListContent.prototype.getListBinding = function () {
		throw new Error("FilterableListContent: Every filterable listcontent must implement this method.");
	};

	FilterableListContent.prototype._getListBindingInfo = function () {
		throw new Error("FilterableListContent: Every filterable listcontent must implement this method.");
	};

	FilterableListContent.prototype._getListItemBindingContext = function (oItem) {
		var sModelName = this._getListBindingInfo().model;
		return oItem && oItem.getBindingContext(sModelName);
	};

	FilterableListContent.prototype._getTypesForConditions = function (oConditions) {
		var oDelegate = this._getValueHelpDelegate();
		var oDelegatePayload = this._getValueHelpDelegatePayload();
		return oDelegate ? oDelegate.getTypesForConditions(oDelegatePayload, this, oConditions) : {};
	};

	FilterableListContent.prototype.getFormattedTitle = function(iCount) {
		var sTitle = ListContent.prototype.getFormattedTitle.apply(this, arguments);
		if (!sTitle) {
			sTitle = this._oResourceBundle.getText(iCount ? "valuehelp.SELECTFROMLIST" : "valuehelp.SELECTFROMLISTNONUMBER", iCount);
		}
		return sTitle;
	};

	FilterableListContent.prototype.getFormattedShortTitle = function() {
		var sShortTitle = this.getShortTitle();
		if (!sShortTitle) {
			sShortTitle = this._oResourceBundle.getText("valuehelp.SELECTFROMLIST.Shorttitle");
		}
		return sShortTitle;
	};

	FilterableListContent.prototype.getFormattedTokenizerTitle = function(iCount) {
		var sTokenizerTitle = this.getTokenizerTitle();
		if (!sTokenizerTitle) {
			sTokenizerTitle = this._oResourceBundle.getText("valuehelp.SELECTFROMLIST.TokenizerTitle" + (iCount === 0 ? "NoCount" : ""), iCount);
		}
		return sTokenizerTitle;
	};

	FilterableListContent.prototype.isSearchSupported = function () {

		var sFilterFields = this.getFilterFields();
		var bSearchSupported = !!sFilterFields;
		if (sFilterFields === "$search") {
			var oListBinding = this.getListBinding();
			var oDelegate = this._getValueHelpDelegate();
			var oDelegatePayload = this._getValueHelpDelegatePayload();
			bSearchSupported = oDelegate && oDelegate.isSearchSupported(oDelegatePayload, this, oListBinding);
		}

		return bSearchSupported;
	};

	/**
	 * Sets the collective Search to the <code>FilterBar</code>
	 *
	 * @param {sap.ui.mdc.filterbar.vh.CollectiveSearchSelect} oCollectiveSearchSelect Collective search control
	 *
	 * @private
	 * @ui5-restricted sap.ui.mdc.valuehelp.Dialog
	 */
	FilterableListContent.prototype.setCollectiveSearchSelect = function (oCollectiveSearchSelect) {
		this._oCollectiveSearchSelect = oCollectiveSearchSelect;
		this._assignCollectiveSearchSelect();
	};

	FilterableListContent.prototype._assignCollectiveSearchSelect = function () {
		var oFilterBar = this._getPriorityFilterBar();
		if (oFilterBar.setCollectiveSearch) {
			oFilterBar.setCollectiveSearch(this._oCollectiveSearchSelect); // remove it if empty
		}
	};

	FilterableListContent.prototype.onBeforeShow = function(bInitial) {
		if (bInitial) {
			var oDelegate = this._getValueHelpDelegate();
			return Promise.resolve(oDelegate && oDelegate.getFilterConditions(this._getValueHelpDelegatePayload(), this)).then(function (oConditions) {
				this._oInitialFilterConditions = oConditions;

				var oFilterBar = this._getPriorityFilterBar();
				if (oFilterBar) {
					var sFilterFields =  this.getFilterFields();
					var oNewConditions = merge({}, this._oInitialFilterConditions), oStateBefore;
					return Promise.resolve(!oNewConditions[sFilterFields] && StateUtil.retrieveExternalState(oFilterBar).then(function (oState) {
						oStateBefore = oState;
						if (bInitial) {
							return StateUtil.diffState(oFilterBar, oState, {filter: oNewConditions});
						}
					})).then(function (oStateDiff) {
						_addSearchConditionToConditionMap(oStateDiff.filter, sFilterFields, this._getPriorityFilterValue(), oStateBefore.filter);
						return StateUtil.applyExternalState(oFilterBar, oStateDiff);
					}.bind(this));
				}
			}.bind(this));
		}
		return undefined;
	};

	FilterableListContent.prototype.onShow = function (bInitial) {
		ListContent.prototype.onShow.apply(this, arguments);

		if (bInitial) {
			var oListBinding = this.getListBinding();
			var oListBindingInfo = this._getListBindingInfo();
			var bBindingSuspended = oListBinding && oListBinding.isSuspended();
			var bBindingWillBeSuspended = !oListBinding && oListBindingInfo && oListBindingInfo.suspended;

			if ((bBindingSuspended || bBindingWillBeSuspended) && !this.isTypeahead()) {
				return; // in dialog case do not resume suspended table on opening
			}

			this.applyFilters(this._getPriorityFilterValue());
		}
	};

	FilterableListContent.prototype._fireSelect = function (oChange) {
		var oDelegate = this._getValueHelpDelegate();
		var oDelegatePayload = this._getValueHelpDelegatePayload();
		var oModifiedSelectionChange = oDelegate && oDelegate.modifySelectionBehaviour ? oDelegate.modifySelectionBehaviour(oDelegatePayload, this, oChange) : oChange;
		if (oModifiedSelectionChange) {
			this.fireSelect(oModifiedSelectionChange);
		}
	};

	FilterableListContent.prototype.exit = function () {

		Engine.getInstance().defaultProviderRegistry.detach(this);

		Common.cleanup(this, [
			"_oCollectiveSearchSelect", "_oInitialFilterConditions"
		]);

		if (this._oSearchField && !this._oSearchField.getParent()) {
			this._oSearchField.destroy();
			delete this._oSearchField;
		}


		ListContent.prototype.exit.apply(this, arguments);
	};

	FilterableListContent.prototype.getCount = function (aConditions, sGroup) {
		var oDelegate = this._isValueHelpDelegateInitialized() && this._getValueHelpDelegate();
		var oDelegatePayload = oDelegate && this._getValueHelpDelegatePayload();
		return oDelegate && oDelegate.getCount ? oDelegate.getCount(oDelegatePayload, this, aConditions, sGroup) : ListContent.prototype.getCount.apply(this, arguments);
	};

	FilterableListContent.prototype._getLocalFilterValue = function() {
		var oContainer = this.getParent();
		return oContainer && oContainer.getLocalFilterValue();
	};

	FilterableListContent.prototype._setLocalFilterValue = function(sValue) {
		var oContainer = this.getParent();
		return oContainer && oContainer.setLocalFilterValue(sValue);
	};

	FilterableListContent.prototype._getPriorityFilterValue = function() {
		var oContainer = this.getParent();
		var sLocalFilterValue = oContainer && oContainer.getLocalFilterValue();

		if (typeof sLocalFilterValue !== 'undefined') {
			return sLocalFilterValue;
		}

		return this.getFilterValue();
	};

	function _getSearchCondition (sFilterValue) {
		return Condition.createCondition("Contains", [sFilterValue], undefined, undefined, ConditionValidated.NotValidated);
	}

	function _addSearchConditionToConditionMap(oConditions, sFilterFields, sFilterValue, oCurrentConditions) {
		if (sFilterFields) {
			oCurrentConditions = oCurrentConditions || oConditions;
			var aCurrentSearchConditions = oCurrentConditions[sFilterFields];

			//1) Only create condition for truthy value (e.g. have a string) if no $search path exists in the CM
			if (!aCurrentSearchConditions) {
				if (sFilterValue) {
					oConditions[sFilterFields] = (oConditions[sFilterFields] || []).concat([_getSearchCondition(sFilterValue)]);
				}
				return;
			}

			//2) Only modifiy existing $search condition to new value if its value has changed --> there is an existing condition
			if (aCurrentSearchConditions.length === 1  && aCurrentSearchConditions[0].values[0] !== sFilterValue) {
				oConditions[sFilterFields] = (oConditions[sFilterFields] || []).concat([_getSearchCondition(sFilterValue)]);
				return;
			}

			//3) Path is existing, but its containing of an empty array --> if its still empty array, don't do anything
			if (aCurrentSearchConditions.length === 0) {
				oConditions[sFilterFields] = sFilterValue ? (oConditions[sFilterFields] || []).concat([_getSearchCondition(sFilterValue)]) : [];
				return;
			}
		}
		return;
	}

	return FilterableListContent;

});
