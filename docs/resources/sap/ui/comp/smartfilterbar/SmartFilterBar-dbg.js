/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartfilterbar.SmartFilterBar.
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/m/MessageBox",
	"sap/ui/comp/util/DateTimeUtil",
	"sap/ui/base/ManagedObjectObserver",
	"sap/ui/comp/filterbar/FilterBar",
	"sap/ui/comp/smartfilterbar/SmartFilterBarFilterGroupItem",
	"sap/ui/comp/filterbar/FilterItem",
	"sap/ui/comp/library",
	"./AdditionalConfigurationHelper",
	"./ControlConfiguration",
	"./FilterProvider",
	"sap/ui/comp/smartfilterbar/FilterProviderUtils",
	"./GroupConfiguration",
	"sap/ui/comp/util/FormatUtil",
	"sap/ui/comp/smartvariants/PersonalizableInfo",
	"sap/ui/comp/smartvariants/SmartVariantManagement",
	"sap/ui/comp/odata/ODataModelUtil",
	"sap/ui/core/library",
	"sap/ui/comp/variants/VariantItem",
	"sap/ui/model/odata/AnnotationHelper",
	"sap/ui/model/Context",
	"sap/ui/comp/filterbar/VariantConverterFrom",
	"sap/base/Log",
	"sap/base/util/merge",
	'sap/ui/Device'
], function(
	jQuery,
	MessageBox,
	DateTimeUtil,
	ManagedObjectObserver,
	FilterBar,
	SmartFilterBarFilterGroupItem,
	FilterItem,
	library,
	AdditionalConfigurationHelper,
	ControlConfiguration,
	FilterProvider,
	FilterProviderUtils,
	GroupConfiguration,
	FormatUtil,
	PersonalizableInfo,
	SmartVariantManagement,
	ODataModelUtil,
	coreLibrary,
	VariantItem,
	AnnotationHelper,
	Context,
	VariantConverterFrom,
	Log,
	merge,
	Device
) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;
	var FilterType = library.smartfilterbar.FilterType;
	var Analitical_Parameter_Prefix = library.ANALYTICAL_PARAMETER_PREFIX;

	/**
	 * Constructor for a new smartfilterbar/SmartFilterBar.
	 * @param {string} [sID] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class
	 * The <code>SmartFilterBar</code> control uses the OData metadata of an entity in order to create a FilterBar.<br>
	 * Whether a field is visible on the FilterBar, supports type-ahead and value help, for example, is automatically determined. When you use
	 * control configurations and group configurations it is possible to configure the FilterBar and adapt it according to your needs.<br>
	 * <b>Note:</b> Most of the attributes/properties are not dynamic and cannot be changed once the control has been initialized.
	 * <b>Note:</b> All internally created instances are considered as private.
	 *
	 * <b>Important:</b> Keep in mind that <code>SmartFilterBar</code>, like all SAPUI5 smart controls, retrieves and analyzes
	 * the metadata and annotations of OData services. <b>The OData metadata is its primary API. These OData services
	 * are not part of the SAPUI5 framework and are usually maintained by the backend developers of your application.</b>
	 *
	 * With time, <code>SmartFilterBar</code> can evolve and acquire new features. This means that its behavior or functionalities
	 * may change if the annotations that define this change are maintained in your backend metadata. To benefit from the new
	 * functionalities, your application should be able to adapt the backend metadata. <b>Therefore, we recommend
	 * using <code>SmartFilterBar</code> only if you have control over the metadata of your application.</b>
	 *
	 * @extends sap.ui.comp.filterbar.FilterBar
	 * @author SAP
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfilterbar.SmartFilterBar
	 * @see {@link topic:7bcdffc056a94731b4341db73251e32b Smart Filter Bar}
	 * @see {@link fiori:https://experience.sap.com/fiori-design-web/smart-filter-bar-annotations/ Smart Filter Bar}
	 */
	var SmartFilterBar = FilterBar.extend("sap.ui.comp.smartfilterbar.SmartFilterBar", /** @lends sap.ui.comp.smartfilterbar.SmartFilterBar.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartfilterbar/SmartFilterBar.designtime",
			properties: {

				/**
				 * The OData entity type whose metadata is used to create the <code>SmartFilterBar</code>. <b>Note:</b> Changing this value after the
				 * <code>SmartFilterBar</code> is initialized (<code>initialise</code> event was fired) has no effect.
				 * @deprecated Since 1.40. Use <code>entitySet</code> property instead of this one, to enable V4 annotation support
				 */
				entityType: {
					type: "string",
					group: "Misc",
					defaultValue: null,
					deprecated: true
				},
				/**
				 * The OData entity set whose metadata is used to create the <code>SmartFilterBar</code>. <b>Note:</b> Changing this value after the
				 * <code>SmartFilterBar</code> is initialized (<code>initialise</code> event was fired) has no effect.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Optional. The OData service URL. If it is not specified, the service URL from the OData model (this.getModel()) will be used.
				 * <b>Note:</b> Changing this value after the SmartFilterBar is initialized (initialise event was fired) has no effect.
				 * @deprecated Since 1.29. Set an ODataModel as the main model on your control/view instead
				 */
				resourceUri: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Name of the field that is the focus of the basic search.
				 */
				basicSearchFieldName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Enables the basic search field. The entered value can be accessed with
				 * {@link sap.ui.comp.smartfilterbar.SmartFilterBar#getParameters}. <b>Note:</b> When the <code>SmartFilterBar</code> control is used with a
				 * {@link sap.ui.comp.smarttable.SmartTable} control the parameters are handled automatically. Therefore, this must only be enabled
				 * for OData service entities that support basic search.
				 */
				enableBasicSearch: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If set the search will be automatically triggered, when a filter value was set via the <B>change</B> event.<br>
				 * <b>Note:</b> The liveMode only operates on non-mobile scenarios.<br>
				 * Additionally, if liveMode is set, the following applies:
				 * <ul>
				 * <li>The error messagebox is not displayed, and the <code>showMessages</code> property is ignored.</li>
				 * <li>The search is triggered after a variant has been selected.</li>
				 * <li>Execute on Select for <code>VariantManagement</code> is not shown and not taken into account</li>
				 * </ul>
				 * @since 1.40
				 */
				liveMode: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If set to <code>true</code>, any errors that occur during the search, are displayed in a message box in addition to the <code>valueState</code> with the error.
				 * <b>Note:</b> As of version 1.89, the default value has been changed from <code>true</code> to <code>false</code>.
				 * @since 1.40
				 */
				showMessages: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates if the analytical parameters (SelectionVariant) must be taken into consideration.
				 * @experimental since 1.42.0 This property is NOT stable yet. Use at your own risk.
				 * @since 1.42.0
				 */
				considerAnalyticalParameters: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If set to <code>true</code> all date fields with filter restriction <code>interval</code> will be treated as
				 * <code>DateTimeRange</code> filters. The <code>useDateRangeType</code> can be set only once during initialization. <b>Note:</b>
				 * If this property is set to <code>true</code> and any date filters with filter restriction <code>interval</code> were stored as
				 * part of a variant, the values of these filters cannot be applied. If this property is set to <code>false</code>, any previously
				 * stored filters which were treated as type <code>DateTimeRange</code> based on the former setting, cannot be converted back to the
				 * standard date interval.
				 * @since 1.46.0
				 */
				useDateRangeType: {
					type: "boolean",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to <code>true</code> all search requests will be ignored. This functionality is only intended to be used internally to
				 * enable an optimal solution when the filter bar is controlled by the smart templates. NOTE: As long as this property is set to
				 * <code>true</code>, all search requests will be neglected.
				 * @experimental since 1.44.0 This property is NOT stable yet. Use at your own risk.
				 * @since 1.44.0
				 */
				suppressSelection: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates if the annotation <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> is taken into account.<br>
				 * <b>Note</b>: Only relevant for control level personalization.
				 *
				 * @deprecated Since version 1.87. Please use the <code>com.sap.vocabularies.UI.v1.SelectionPresentationVariant</code> annotation through the {@link sap.ui.comp.smartvariants.SmartVariantManagement#setEntitySet}
				 */
				considerSelectionVariants: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Determines one specific variant that is based on the <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> annotation, which
				 * is then used as the default variant.<br>
				 * This property is only relevant in case <code>considerSelectionVariants</code> is set to <code>true</code> and will only be
				 * applied if there is no user-defined default variant specified.<br>
				 * <b>Note</b>: Only relevant for control level personalization.
				 *
				 * @deprecated Since version 1.87. Please use the <code>com.sap.vocabularies.UI.v1.SelectionPresentationVariant</code> annotation through the {@link sap.ui.comp.smartvariants.SmartVariantManagement#setEntitySet}
				 */
				defaultSelectionVariantName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to <code>true</code>, only the navigation properties mentioned in property
				 * {@link sap.ui.comp.smartfilterbar.SmartFilterBar#getNavigationProperties} are checked for further filters.
				 * @since 1.48
				 */
				useProvidedNavigationProperties: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * This property is only evaluated if the property
				 * {@link sap.ui.comp.smartfilterbar.SmartFilterBar#getUseProvidedNavigationProperties} is set to <code>true</code>. It contains a
				 * comma-separated list of navigation property names which are checked for filters.<br>
				 * @since 1.48
				 */
				navigationProperties: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				}
			},

			associations: {
				/**
				 * Identifies the SmartVariant control which should be used for the personalization.
				 * @since 1.38
				 */
				smartVariant: {
					type: "sap.ui.comp.smartvariants.SmartVariantManagement",
					multiple: false
				}
			},

			aggregations: {

				/**
				 * Using control configurations you can add additional configuration to filter fields, for example set custom labels, change the order
				 * of fields, or change the filter field control type. <b>Note:</b> Changing the values here after the SmartFilter is initialized (<code>initialise</code>
				 * event was fired) has no effect.
				 */
				controlConfiguration: {
					type: "sap.ui.comp.smartfilterbar.ControlConfiguration",
					multiple: true,
					singularName: "controlConfiguration"
				},

				/**
				 * Provides the possibility to add additional configuration to groups. Groups are used to show fields in the advanced area of the
				 * SmartFilterBar. With additional configuration, you can for example set custom labels or change the order of groups. <b>Note:</b>
				 * Changing the values here after the SmartFilter is initialized (<code>initialise</code> event was fired) has no effect.
				 */
				groupConfiguration: {
					type: "sap.ui.comp.smartfilterbar.GroupConfiguration",
					multiple: true,
					singularName: "groupConfiguration"
				}
			},

			events: {
				// fired from FilterProvider
				// _beforeOpenVHD: {
				// 	fieldName: { type: "string" }
				// },

				/**
				 * This event is fired after the pending state of the <code>FilterBar</code> control changes.
				 * @since 1.36
				 */
				pendingChange: {
					/**
					 * The current pending value.
					 */
					pendingValue: {
						type: "boolean"
					}
				}
			}
		},

		renderer: {
			apiVersion: 2
		}

	});

	SmartFilterBar.LIVE_MODE_INTERVAL = 300;
	SmartFilterBar.SELECTION_VARIANT_KEY_PREFIX = "#";

	/**
	 * Retrieves the currently visible filters and the values for storing them as variants. The result will be passed on as a JSON object to the
	 * callee smart variant control.
	 * @name sap.ui.comp.smartfilterbar.SmartFilterBar#fetchVariant
	 * @function
	 * @type object
	 * @public
	 * @returns {Object} An arbitrary Object with an example structure:<br><pre>{<br>  filterBarVariant: any,<br>  filterbar: [<br>    {<br>      group: string,<br>      name: string,<br>      partOfCurrentVariant: boolean,<br>      visible: boolean,<br>      visibleInFilterBar: boolean<br>    },<br>    ...<br>  ],<br>  orderedFilterItems: string,<br>  singleInputsTextArrangementData: string,<br>  version: string|undefined,<br>  basicSearch: string|undefined<br>}</pre>
	 */

	/**
	 * Applies the current variant as opposed to <code>fetchVariant</code>. The variant is retrieved via the flex layer.
	 * @name sap.ui.comp.smartfilterbar.SmartFilterBar#applyVariant
	 * @function
	 * @param {object} oVariant The variant that must be applied. oVariant must contain a valid JSON object.
	 * @type void
	 * @public
	 */

	SmartFilterBar.prototype.init = function() {
		if (!FilterProvider) {
			FilterProvider = sap.ui.require("sap/ui/comp/smartfilterbar/FilterProvider"); // because of cycle in define (via ValueHelpProvider)
		}

		this._bCreateFilterProviderCalled = false;
		this._aFilterBarViewMetadata = null;
		this._oFilterBarViewMetadataExtend = null;
		this._bSetFilterDataSuspended = false;
		this._oStoredFilterData = {};
		this._oObservers = [];
		FilterBar.prototype.init.apply(this); // Call base class

		sap.ui.getCore().getMessageManager().registerObject(this, true);

		this.getMetadata().addPublicMethods(["suspendSelection", "resumeSelection"]);
	};

	/**
	 * Initialises the OData metadata necessary to create the filter bar
	 * @private
	 */
	SmartFilterBar.prototype._initializeMetadata = function() {
		if (!this.bIsInitialised) {
			ODataModelUtil.handleModelInit(
				this,
				this._onMetadataInitialised,
				!this.getIsRunningInValueHelpDialog() // bWaitForFlexChanges if we are not running in VH Dialog
			);
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 * @private
	 */
	SmartFilterBar.prototype._onMetadataInitialised = function() {
		var sResourceUri,
			oModel,
			sEntityTypeName,
			sEntitySet;

		this._bMetaModelLoadAttached = false;
		if (!this.bIsInitialised && !this._bCreateFilterProviderCalled) {
			oModel = this.getModel();
			sResourceUri = this.getResourceUri();
			sEntityTypeName = this.getEntityType();
			sEntitySet = this.getEntitySet();

			if ((oModel || sResourceUri) && (sEntityTypeName || sEntitySet)) {
				this._bCreateFilterProviderCalled = true;

				this._createFilterProvider(oModel, sResourceUri, sEntityTypeName, sEntitySet).then(function(oFilterProvider) {
						if (!oFilterProvider) {
							return;
						}
						if (this.bIsDestroyed) {
							oFilterProvider.destroy();
							return;
						}
						this._oFilterProvider = oFilterProvider;
						this._aFilterBarViewMetadata = oFilterProvider.getFilterBarViewMetadata();
						this._oFilterBarViewMetadataExtend = oFilterProvider._getFilterBarViewMetadataExtend();
						if (this._aFilterBarViewMetadata) {
							this._attachAdditionalConfigurationChanged();
							// Indicates the control is initialised and can be used in the initialise event/otherwise!
							this.bIsInitialised = true;
							this.setModel(oFilterProvider.oModel, oFilterProvider.sFilterModelName);

							// required for the new UI-Design
							this.registerGetFiltersWithValues(this.getFiltersWithValues.bind(this));

							// Variant Handling - Registrations
							this.registerFetchData(function(sVersion) {
								return this.getFilterDataAsStringForVariant(true, sVersion);
							}.bind(this));

							this.registerApplyData(function(sJson, sVersion) {
								this.setFilterDataAsStringFromVariant(sJson, true, sVersion);
							}.bind(this));

							this._initializeVariantManagement();
						}

						oFilterProvider.attachPendingChange(function(oEvent) {
							this.firePendingChange({
								pendingValue: oEvent.getParameter("pending")
							});
						}.bind(this));
					}.bind(this));
			}
		}
	};

	/**
	 * Sets the initial focus.
	 * @private
	 */
	 SmartFilterBar.prototype._setInitialFocus = function () {
		var bAvailableVariantManagement = this.getAssociation("smartVariant") || this.getConsiderSelectionVariants(),
			oBasicSearchControl = this.getBasicSearchControl(),
			aVisibleFiltersFieldArray = this.getAllFilterItems(true),
			oFirstFilterFieldControl;

			if (!bAvailableVariantManagement) {
				if (this.getEnableBasicSearch()) {
					this._onAfterRenderingBasicSearchDelegate = {
						onAfterRendering: function () {
							setTimeout(function () {
								oBasicSearchControl.focus();
								oBasicSearchControl.removeDelegate(this._onAfterRenderingBasicSearchDelegate);
							}.bind(this));
						}.bind(this)
					};
					oBasicSearchControl.addDelegate(this._onAfterRenderingBasicSearchDelegate, this);
				} else if (aVisibleFiltersFieldArray.length > 0 ) {
						oFirstFilterFieldControl = aVisibleFiltersFieldArray[0]._getControl();
					this._onAfterRenderingFirstFilterVisibleFieldDelegate = {
						onAfterRendering: function () {
							setTimeout(function () {
								oFirstFilterFieldControl.focus();
								oFirstFilterFieldControl.removeDelegate(this._onAfterRenderingFirstFilterVisibleFieldDelegate);
							}.bind(this));
						}.bind(this)
					};
					oFirstFilterFieldControl.addDelegate(this._onAfterRenderingFirstFilterVisibleFieldDelegate, this);
				}
		}
	};

	/**
	 * Get the model data.
	 * @returns {map} of the model data.
	 * @protected
	 */
	SmartFilterBar.prototype.getModelData = function() {
		return this._oFilterProvider ? this._oFilterProvider.getModel().getData() : null;
	};

	/**
	 * Get the filter context url.
	 * @returns {string} Filter context url.
	 * @protected
	 */
	SmartFilterBar.prototype.getFilterContextUrl = function() {
		return this._oFilterProvider ? this._oFilterProvider.getFilterContextUrl() : null;
	};

	/**
	 * Get the parameter context url.
	 * @returns {string} Parameter context url.
	 * @protected
	 */
	SmartFilterBar.prototype.getParameterContextUrl = function() {
		return this._oFilterProvider ? this._oFilterProvider.getParameterContextUrl() : null;
	};

	/**
	 * Get the filterable fields.
	 * @returns {Array} array of filter view metadata containing filter fields
	 * @param {boolean} bAll
	 * @internal
	 */
	SmartFilterBar.prototype.getFilterBarViewMetadata = function(bAll) {
		var aFilterBarViewMetadata;

		if (this._aFilterBarViewMetadata === null){
			return [];
		}

		aFilterBarViewMetadata = Object.assign({}, this._aFilterBarViewMetadata);

		aFilterBarViewMetadata = this._aFilterBarViewMetadata.map(function(oGroup){
			var oGroupCopy = Object.assign({}, oGroup);
			if (bAll && this._oFilterBarViewMetadataExtend !== null) {
				oGroupCopy.fields = oGroupCopy.fields.map(function(oFieldViewMetadata){
					var oFieldViewMetadataCopy,
						sGroupName = oFieldViewMetadata.groupName,
						sFullName = oFieldViewMetadata.fullName,
						oFieldViewMetadataExtend = this._oFilterBarViewMetadataExtend[sGroupName] && this._oFilterBarViewMetadataExtend[sGroupName][sFullName];

					if (oFieldViewMetadataExtend !== undefined){
						oFieldViewMetadataCopy = Object.assign({}, oFieldViewMetadata, oFieldViewMetadataExtend);
					} else {
						oFieldViewMetadataCopy = Object.assign({}, oFieldViewMetadata);
					}
					return oFieldViewMetadataCopy;
				}.bind(this));
			}
			return oGroupCopy;
		}.bind(this));

		return aFilterBarViewMetadata;
	};

	/**
	 * Get the analytical parameters
	 * @returns {Array} array of analytical parameter metadata
	 * @internal
	 */
	SmartFilterBar.prototype.getAnalyticalParameters = function() {
		return this._oFilterProvider ? this._oFilterProvider.getAnalyticParameters() : [];
	};

	/**
	 * Get selection variant annotation
	 * @returns {array} of selection variants. Key is the qualifier.
	 * @internal
	 */
	SmartFilterBar.prototype.getSelectionVariants = function() {
		var mSelectionVariants = null;
		if (this._oFilterProvider) {
			mSelectionVariants = this._oFilterProvider.getSelectionVariants();
			if (Object.keys(mSelectionVariants).length < 1) {
				mSelectionVariants = null;
			}
		}

		return mSelectionVariants;

	};

	/**
	 * Creates an instance of the filter provider
	 * @private
	 */
	SmartFilterBar.prototype._createFilterProvider = function(oModel, sResourceUri, sEntityTypeName, sEntitySet) {
		return FilterProvider._createFilterProvider({
			basicSearchFieldName: this.getBasicSearchFieldName(),
			enableBasicSearch: this.getEnableBasicSearch(),
			entityType: sEntityTypeName,
			entitySet: sEntitySet,
			serviceUrl: sResourceUri,
			isRunningInValueHelpDialog: this.getIsRunningInValueHelpDialog(),
			model: oModel,
			additionalConfiguration: this.getAdditionalConfiguration(),
			defaultDropDownDisplayBehaviour: this.data("defaultDropDownDisplayBehaviour"),
			defaultTokenDisplayBehaviour: this.data("defaultTokenDisplayBehaviour"),
			defaultSingleFieldDisplayBehaviour: this.data("defaultSingleFieldDisplayBehaviour"),
			dateFormatSettings: this.data("dateFormatSettings"),
			useContainsAsDefaultFilter: this.data("useContainsAsDefaultFilter"),
			smartFilter: this,
			filterBarClass: SmartFilterBar,
			considerAnalyticalParameters: this.getConsiderAnalyticalParameters(),
			useDateRangeType: this.getUseDateRangeType(),
			considerSelectionVariants: this.getConsiderSelectionVariants(),
			considerNavigations: this.getUseProvidedNavigationProperties() ? this._createArrayFromString(this.getNavigationProperties()) : null,
			suppressValueListsAssociation: this.getSuppressValueListsAssociation()
		});
	};

	SmartFilterBar.prototype._createArrayFromString = function(sList) {
		return !sList ? [] : sList.split(",").filter(function(sField) {
			return sField !== "" ? sField.trim() : false;
		});
	};

	/**
	 * Attaches to events from the control configuration. For example the visibility of a filter field can be changed dynamically
	 * @private
	 */
	SmartFilterBar.prototype._attachAdditionalConfigurationChanged = function() {
		var aControlConfiguration, aGroupConfiguration, i, length;

		// Group Configuration
		aGroupConfiguration = this.getGroupConfiguration();
		length = aGroupConfiguration.length;
		for (i = 0; i < length; i++) {
			aGroupConfiguration[i].attachChange(this._handleGroupConfigurationChanged.bind(this));
		}

		// Control Configuration
		aControlConfiguration = this.getControlConfiguration();
		length = aControlConfiguration.length;
		for (i = 0; i < length; i++) {
			aControlConfiguration[i].attachChange(this._handleControlConfigurationChanged.bind(this));
		}
	};

	/**
	 * Event Handler for changed events from control configuration
	 * @private
	 * @param {Object} oEvent - then event object
	 */
	SmartFilterBar.prototype._handleControlConfigurationChanged = function(oEvent) {
		var sPropertyName, oControlConfiguration, oFilterItem, sKey, sValue;

		sPropertyName = oEvent.getParameter("propertyName");
		oControlConfiguration = oEvent.oSource;

		if (!oControlConfiguration) {
			return;
		}

		sKey = oControlConfiguration.getKey();
		oFilterItem = this._getFilterItemByName(sKey);
		if (!oFilterItem) {
			this._handleControlConfigurationChangedForDelayedFilterItems(sKey, oControlConfiguration, sPropertyName);
			return;
		}

		if (sPropertyName === "visible") {
			sValue = oControlConfiguration.getVisible();
			oFilterItem.setVisible(sValue);
		} else if (sPropertyName === "label") {
			sValue = oControlConfiguration.getLabel();
			oFilterItem.setLabel(sValue);
		} else if (sPropertyName === "visibleInAdvancedArea") {
			sValue = oControlConfiguration.getVisibleInAdvancedArea();
			if (oFilterItem.setVisibleInAdvancedArea) {
				oFilterItem.setVisibleInAdvancedArea(sValue);
			}
		}
	};

	SmartFilterBar.prototype._handleControlConfigurationChangedForDelayedFilterItems = function(sKey, oControlConfiguration, sPropertyName) {
		var sValue,
			oField;

		if (this._aFilterBarViewMetadata) {
			this._aFilterBarViewMetadata.some(function(oGroup) {
				oGroup.fields.some(function(oItem) {
					if (oItem.fieldName === sKey) {
						oField = oItem;
					}

					return !!oField;
				});

				return !!oField;
			});
		}

		if (oField) {
			if (sPropertyName === "visible") {
				sValue = oControlConfiguration.getVisible();
				oField.isVisible = sValue;
			} else if (sPropertyName === "label") {
				sValue = oControlConfiguration.getLabel();
				oField.label = sValue;
			} else if (sPropertyName === "visibleInAdvancedArea") {
				sValue = oControlConfiguration.getVisibleInAdvancedArea();
				oField.visibleInAdvancedArea = sValue;
			}
		}
	};

	/**
	 * Event Handler for changed events from control configuration
	 * @private
	 * @param {Object} oEvent - then event object
	 */
	SmartFilterBar.prototype._handleGroupConfigurationChanged = function(oEvent) {
		var sPropertyName, oGroupConfiguration;

		sPropertyName = oEvent.getParameter("propertyName");
		oGroupConfiguration = oEvent.oSource;
		if (sPropertyName === "label") {
			this._handleGroupConfigurationLabelChanged(oGroupConfiguration);
		}
	};

	/**
	 * Handle the event of a changed label of a group configuration. Find the corresponding FilterGroupItem and sets its label accordingly.
	 * @private
	 * @param {object} oGroupConfiguration - GroupConfiguration where the label as changed
	 */
	SmartFilterBar.prototype._handleGroupConfigurationLabelChanged = function(oGroupConfiguration) {
		var oFilterGroupItem, sKey, sLabel;

		if (!oGroupConfiguration) {
			return;
		}

		sLabel = oGroupConfiguration.getLabel();
		sKey = oGroupConfiguration.getKey();
		oFilterGroupItem = this._getFilterGroupItemByGroupName(sKey);
		if (oFilterGroupItem) {
			oFilterGroupItem.setGroupTitle(sLabel);
		} else {
			this._handleGroupConfigurationLabelChangedForDelayedFilterItems(sKey, sLabel);
		}
	};

	SmartFilterBar.prototype._handleGroupConfigurationLabelChangedForDelayedFilterItems = function(sKey, sLabel) {
		var oGroup = null;
		if (this._aFilterBarViewMetadata) {
			this._aFilterBarViewMetadata.some(function(oItem) {

				if (oItem.groupName === sKey) {
					oGroup = oItem;
				}

				return !!oGroup;
			});
		}

		if (oGroup) {
			oGroup.groupLabel = sLabel;
		}
	};

	/**
	 * Returns a filter item or filter group item having the specified name. Returns undefined if there are no filter items or filter group items
	 * having the specified name.
	 * @private
	 * @param {string} sName of the filter
	 * @returns {object} the found filter item
	 */
	SmartFilterBar.prototype._getFilterItemByName = function(sName) {
		return this.determineFilterItemByName(sName);
	};

	/**
	 * Returns a filter group item having the specified group name. Returns undefined if there is no filter group items having the specified name.
	 * @private
	 * @param {string} sName filter group name
	 * @returns {object} the found group item
	 */
	SmartFilterBar.prototype._getFilterGroupItemByGroupName = function(sName) {
		return this.determineFilterItemByName(sName);
	};

	/**
	 * Retrieves the control associated to the filter.
	 *
	 * @public
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem From the aggregations
	 * @param {boolean} bConsiderParameters check also analytics parameter
	 * @returns {sap.ui.core.Control} The corresponding control. If no match is found <code>null</code> is returned.
	 *
	 * @deprecated As of version 1.99. Use {@link sap.ui.core.Core.byId} instead.
	 * @ui5-not-supported
	 */
	SmartFilterBar.prototype.determineControlByFilterItem = function(oFilterItem, bConsiderParameters) {
		Log.warning("Using deprecated method: sap.ui.comp.smartfilterbar.SmartFilterBar#determinControlByFilterItem. Consider changing it with proper one.");
		return this._determineControlByFilterItem.apply(this, arguments);
	};

	/**
	 * Retrieves the control associated to the filter.
	 *
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem From the aggregations
	 * @param {boolean} bConsiderParameters check also analytics parameter
	 * @returns {sap.ui.core.Control} The corresponding control. If no match is found <code>null</code> is returned.
	 */
	SmartFilterBar.prototype._determineControlByFilterItem = function(oFilterItem, bConsiderParameters) {
		return FilterBar.prototype.determineControlByFilterItem.apply(this, arguments);
	};

	/**
	 * Retrieves the control based on the name and group name.
	 *
	 * @public
	 * @param {string} sName Name of the filter.
	 * @param {string} [sGroupName] Group name of the filter; <code>null</code> for filter that belongs to basic group.
	 * @returns {sap.ui.core.Control} The corresponding control, if no match is found, <code>null</code> is returned.
	 *
	 * @deprecated As of version 1.99. Use {@link sap.ui.core.Core.byId} instead.
	 * @ui5-not-supported
	 */
	SmartFilterBar.prototype.determineControlByName = function(sName, sGroupName) {
		Log.warning("Using deprecated method: sap.ui.comp.smartfilterbar.SmartFilterBar#determineControlByName. Consider changing it with proper one.");
		return this._determineControlByName.apply(this, arguments);
	};

	/**
	 * Retrieves the control based on the name and group name.
	 *
	 * @private
	 * @param {string} sName Name of the filter.
	 * @param {string} [sGroupName] Group name of the filter; <code>null</code> for filter that belongs to basic group.
	 * @returns {sap.ui.core.Control} The corresponding control, if no match is found, <code>null</code> is returned.
	 */
	SmartFilterBar.prototype._determineControlByName = function(sName, sGroupName) {
		return FilterBar.prototype.determineControlByName.apply(this, arguments);
	};

	/**
	 * Returns an Object containing all information from the additional configuration (controlConfiguration, groupConfiguration).
	 * @returns {object} the additional configuration
	 * @private
	 */
	SmartFilterBar.prototype.getAdditionalConfiguration = function() {
		return new AdditionalConfigurationHelper(this.getControlConfiguration(), this.getGroupConfiguration());
	};

	SmartFilterBar.prototype.setEntityType = function(sEntityTypeName) {
		this.setProperty("entityType", sEntityTypeName);
		this._initializeMetadata();
		return this;
	};

	/**
	 * Setter for property entitySet.
	 * @param {string} sEntitySetName Name of the EntitySet from which the filters are derived
	 * @returns {object} instance for further processing
	 * @private
	 */
	SmartFilterBar.prototype.setEntitySet = function(sEntitySetName) {
		this.setProperty("entitySet", sEntitySetName);
		this._initializeMetadata();
		return this;
	};

	/**
	 * Uses the provided resource URI to fetch the OData metadata instead of using the default ODataModel (getModel()). You should only set this if
	 * you intend to get the metadata for the filter bar from elsewhere!
	 * @param {string} sResourceUri - The URI of the oData service from which the metadata would be read
	 * @returns {this} <code>this</code> to allow method chaining
	 * @deprecated Since 1.29. Set an ODataModel as the main model on your control/view instead
	 * @public
	 */
	SmartFilterBar.prototype.setResourceUri = function(sResourceUri) {
		this.setProperty("resourceUri", sResourceUri);
		this._initializeMetadata();
		return this;
	};

	/**
	 * It could happen that the entity type information is set already in the view, but there is no model attached yet. This method is called once the
	 * model is set on the parent and can be used to initialise the metadata, from the model, and finally create the filter controls.
	 * @private
	 */
	SmartFilterBar.prototype.propagateProperties = function() {
		FilterBar.prototype.propagateProperties.apply(this, arguments);
		this._initializeMetadata();
	};

	/**
	 * Provides filter information for lazy instantiation (Overridden from FilterBar)
	 * @private
	 * @returns {array} of filter information
	 */
	SmartFilterBar.prototype._getFilterInformation = function() {
		var aHiddenFields = this.data("hiddenFields"), oFilterGroup, i, j, iLen = 0, iFieldLen = 0, aFilterFields, aFields = [], oField;
		if (this._aFilterBarViewMetadata) {
			iLen = this._aFilterBarViewMetadata.length;
			for (i = 0; i < iLen; i++) {
				oFilterGroup = this._aFilterBarViewMetadata[i];
				aFilterFields = oFilterGroup.fields;
				iFieldLen = aFilterFields.length;
				for (j = 0; j < iFieldLen; j++) {
					oField = aFilterFields[j];
					if (Array.isArray(aHiddenFields) && aHiddenFields.indexOf(oField.name) !== -1) {
						continue;
					} else if (oField.name === FilterProviderUtils.BASIC_SEARCH_FIELD_ID) {
						this.setBasicSearch(oField.control);
						this._attachToBasicSearch(oField.control);
						continue;
					} else if (oFilterGroup.groupName === FilterProviderUtils.BASIC_FILTER_AREA_ID) {
						// this._createFieldInBasicArea(oField);
						this._createFieldInAdvancedArea({
							groupName: FilterBar.INTERNAL_GROUP,
							groupLabel: ""
						}, oField);

					} else {
						this._createFieldInAdvancedArea(oFilterGroup, oField);
					}
					aFields.push(oField);
				}
			}

			var aParameters = this.getAnalyticalParameters();
			iLen = aParameters.length;
			for (i = 0; i < iLen; i++) {
				oField = aParameters[i];
				this._createAnalyticParameter(oField);
				aFields.push(oField);
			}
		}
		return aFields;
	};

	/**
	 * Check if any controls are in error state or if search has to be prevented and return a flag, if search can continue
	 * @private
	 * @returns {boolean} true when there are no errors or when search is not pending
	 */
	SmartFilterBar.prototype._validateState = function() {
		var aFilterItems,
			iLen,
			oControl,
			bInError = false;

		aFilterItems = this.getAllFilterItems(true);
		if (Array.isArray(aFilterItems)) {
			iLen = aFilterItems.length;
			while (iLen--) {
				oControl = this._determineControlByFilterItem(aFilterItems[iLen], true);
				if (oControl) {
					if (oControl.__bValidatingToken) {
						// If a token validation is pending hold back the search until validation is through
						this.bIsSearchPending = true;
						// Set dummy error flag to prevent search
						bInError = true;
						break;
					} else if (oControl.getValueState && oControl.getValueState() === ValueState.Error && !oControl.data("__mandatoryEmpty")) {
						bInError = true;
						break;
					}
				}
			}
		}
		if (this._oFilterProvider && this._oFilterProvider._mConditionTypeFields) {
			var aConditionTypeFields = Object.keys(this._oFilterProvider._mConditionTypeFields);
			for (var i = 0; i < aConditionTypeFields.length; i++) {
				var sConditionTypeFieldName = aConditionTypeFields[i];
				var oConditionType = this._oFilterProvider._mConditionTypeFields[sConditionTypeFieldName].conditionType;
				oControl = oConditionType && oConditionType._oInput;

				if (oControl && oControl.getValueState && oControl.getValueState() === ValueState.Error && !oControl.data("__mandatoryEmpty")) {
					bInError = true;
					break;
				}
			}
		}

		if (this._oFilterProvider) {
			return !bInError && !this._oFilterProvider._validateConditionTypeFields();
		} else {
			return !bInError;
		}
	};

	SmartFilterBar.prototype._isDateRangeTypeFilter = function(sFilterName) {
		return !!(this._oFilterProvider && this._oFilterProvider._mConditionTypeFields[sFilterName]);
	};

	SmartFilterBar.prototype._specialControls = function(oControl, sFilterName) {
		return !!(oControl.setValue && (this._isDateRangeTypeFilter(sFilterName) || oControl.isA("sap.m.DatePicker")));
	};

	/**
	 * For every control in error state, trigger <code>checkUpdate(true)</code>
	 * @private
	 */
	SmartFilterBar.prototype._clearErroneusControlValues = function() {
		var aFilterItems,
			iLen,
			oControl,
			oValueBinding;

		aFilterItems = this.getAllFilterItems(true);
		if (aFilterItems) {
			iLen = aFilterItems.length;
			while (iLen--) {
				oControl = this._determineControlByFilterItem(aFilterItems[iLen], true);
				if (oControl) {
					if (oControl.getValueState && oControl.getValueState() === ValueState.Error) {

						oValueBinding = oControl.getBinding("value");
						if (oValueBinding && !this._specialControls(oControl, aFilterItems[iLen].getName())) {
							oValueBinding.checkUpdate(true);
						} else if (oControl.setValue) {
							oControl.setValue("");
							oControl.setValueState(ValueState.None);
						}

					}
				}
			}
		}

	};

	/**
	 * Handling of change and search for Basic Search field (used in value helps)
	 * @private
	 * @param {Object} oBasicSearchControl the basic search control
	 */
	SmartFilterBar.prototype._attachToBasicSearch = function(oBasicSearchControl) {

		if (oBasicSearchControl) {
			oBasicSearchControl.attachSearch(function(oEvent) {
				if (oEvent && oEvent.getParameter("clearButtonPressed")) {
					return;
				}
				if (!this.isDialogOpen()) {
					this._searchFromFilterBar();
				}
			}.bind(this));

			oBasicSearchControl.attachChange(this._onChange.bind(this));
		}
	};

	/**
	 * Called when values where deleted from an MultiInput control, to remove the error value state.
	 * @private
	 * @param {Object} oEvent - then event object
	 */
	SmartFilterBar.prototype._onLiveChange = function(oEvent) {
		var oControl = oEvent.getSource();

		// Clear validation error when no value is in the input
		if (oControl.data("__validationError") && !oControl.getValue()) {
			oControl.data("__validationError", null);
			oControl.setValueState(ValueState.None);
			delete oControl.__sValidationText; // BCP: 1970006434
		}
	};

	/**
	 * Called when change need to be triggered on the Smart Filter
	 * @private
	 * @param {Object} oEvent - then event object
	 */
	SmartFilterBar.prototype._onChange = function(oEvent) {
		var oControl = oEvent.getSource();
		var bSkipChangeEvent = this._oFilterProvider._bUpdatingFilterData || this._oFilterProvider._bCreatingInitialModel;
		// Clear mandatory empty error state and flag, when control value changes
		if (oControl.data("__mandatoryEmpty")) {
			oControl.data("__mandatoryEmpty", null);
			oControl.setValueState(ValueState.None);
		}
		// Clear validation error when no value is in the input
		if (oControl.data("__validationError") && !oControl.getValue()) {
			oControl.data("__validationError", null);
			oControl.setValueState(ValueState.None);
		}

		if (oControl.isA("sap.m.ComboBox") && oControl.getValue()) {
			this._filterSetInErrorState(oControl);
			if (!oControl.getSelectedItem()) {
				oControl.data("__validationError", true);
				oControl.setValueState(ValueState.Error);
				if (!bSkipChangeEvent) {
					this.fireFilterChange(oEvent);
				}
				return;
			}

			if (oControl.data("__validationError")) {
				oControl.data("__validationError", null);
				oControl.setValueState(ValueState.None);
			}
		}

		// Don't fire change event while the filter data is being created/updated!
		if (bSkipChangeEvent) {
			return;
		}
		// If the token is being validated do not trigger the change event!
		if (!oControl || (oControl && !oControl.__bValidatingToken)) {
			this.fireFilterChange(oEvent);
			this._oFilterProvider._updateConditionTypeFields(oEvent.getParameter("filterChangeReason"));
		} else {
			this._filterSetInErrorState(oControl);
		}

		if (this.isLiveMode()) {
			// In LiveMode, fire directly search on a selection of MultiComboBox oder ComboBox
			if (oEvent.getSource().isA("sap.m.MultiComboBox") || oEvent.getSource().isA("sap.m.ComboBox")) {
				this.triggerSearch();
			} else {
				// For all other controls, wait the default 300 ms before search
				this._searchFromFilterBar();
			}
		}
	};

	/**
	 * Listen to the change event to set the search button state and raise an event
	 * @param {object} oControl - the control on which change would be triggered
	 * @private
	 */
	SmartFilterBar.prototype._handleChange = function(oControl) {
		if (oControl) {
			if (oControl.attachChange) {
				oControl.attachChange(this._onChange.bind(this));
			}

			if (oControl.attachLiveChange) {
				oControl.attachLiveChange(this._onLiveChange.bind(this));
			}
		}
	};

	/**
	 * Listen to the selectionChange event to set the search button state and raise an event
	 * @param {object} oControl - the control on which selectionChange would be triggered
	 * @private
	 */
	SmartFilterBar.prototype._handleSelectionChange = function(oControl) {
		if (oControl) {
			if (oControl.attachSelectionChange) {
				oControl.attachSelectionChange(this._onChange.bind(this));
			}
		}
	};

	/**
	 * Handles the enter event on the control to trigger Search
	 * @param {object} oControl - the control on which enter has to be handled
	 * @private
	 */
	SmartFilterBar.prototype._handleEnter = function(oControl) {

		/*
		 * do not trigger search in live mode, since it will be triggered via the change event
		 */
		if (this.isLiveMode()) {
			return;
		}

		/*
		 * @Hack: Search should not be triggered while a suggest is in progress (i.e. user presses enter key on the SuggestionList popup). Since the
		 * SuggestionPopup is always closed before the keyup event is raised and we cannot use the keydown event alone, we now listen to both key up
		 * and keydown events and set flags on the control to overcome the issue. Perhaps if sapUI5 provides a new event/does not propagate the keyUp
		 * event/sets a flag we can remove this hack TODO: Clarify this with sapUI5 colleagues.
		 */
		oControl.attachBrowserEvent("keydown", function(e) {
			if (e.which === 13) {
				oControl.__bSuggestInProgress = (oControl._oSuggestionPopup && oControl._oSuggestionPopup.isOpen());
			}
		});
		oControl.attachBrowserEvent("keyup", function(e) {
			if (e.which === 13 && !oControl.__bSuggestInProgress && (oControl.isA("sap.m.InputBase") || oControl.isA("sap.m.Select") || oControl.isA("sap.m.DynamicDateRange"))) {
				this._searchFromFilterBar();
			}
		}.bind(this));
	};

	/**
	 * Creates the control used in the filter item lazily
	 * @private
	 * @param {object} oField filter metadata
	 */
	SmartFilterBar.prototype._createFilterFieldControl = function(oField) {
		if (oField.conditionType) {
			oField.control = oField.conditionType.initializeFilterItem();
		} else if (!oField.control && oField.fCreateControl) {
			oField.fCreateControl(oField);
			delete oField.fCreateControl;
		}
		// The control might already be present e.g. for custom field - so also register for enter & change events!
		this._handleEnter(oField.control);
		this._handleChange(oField.control);

		// For multiComboBox added as custom field we need to attach  to the selectionChange event,
		// because when change event is fired the selected items and keys are not updated
		if (oField.isCustomFilterField && oField.control.isA("sap.m.MultiComboBox")) {
			this._handleSelectionChange(oField.control);
		}
	};

	/**
	 * Creates a new paramater and adds it to the filter bar Basic Area, based on the metadata provided by the FilterProvider
	 * @private
	 * @param {object} oParameter filter metadata
	 * @returns {object} oField filter metadata
	 */
	SmartFilterBar.prototype._createAnalyticParameter = function(oParameter) {
		oParameter.factory = function() {

			this._createFilterFieldControl(oParameter);
			if (!oParameter.control) {
				return;
			}
			var oParamItem = new SmartFilterBarFilterGroupItem({
				controlTooltip: oParameter.quickInfo,
				name: oParameter.fieldName,
				mandatory: oParameter.isMandatory,
				visible: oParameter.isVisible,
				control: oParameter.control,
				hiddenFilter: false
			});

			this._setLabel(oParamItem, oParameter.label);

			this._addParameter(oParamItem);
		}.bind(this);

		// FilterBar needs this information
		oParameter.groupName = FilterBar.INTERNAL_GROUP;

		return oParameter;
	};

	/**
	 * Creates a new field and adds it to the filter bar into the AdvancedSearchArea, based on the metadata provided by the FilterProvider
	 * @private
	 * @param {object} oFilterGroup metadata
	 * @param {object} oField filter metadata
	 * @returns {object} oField filter metadata
	 */
	SmartFilterBar.prototype._createFieldInAdvancedArea = function(oFilterGroup, oField) {
		oField.factory = function() {

			this._createFilterFieldControl(oField);
			var oFilterGroupItem = new SmartFilterBarFilterGroupItem({
				controlTooltip: oField.quickInfo,
				name: oField.fieldName,
				groupName: oFilterGroup.groupName,
				groupTitle: oFilterGroup.groupLabel,
				entitySetName: oField.groupEntitySet,
				entityTypeName: oField.groupEntityType,
				mandatory: oField.isMandatory,
				visible: oField.isVisible,
				visibleInAdvancedArea: oField.visibleInAdvancedArea || (oFilterGroup.groupName === FilterBar.INTERNAL_GROUP),
				control: oField.control,
				hiddenFilter: oField.hiddenFilter
			});

			if (oField.isCustomFilterField) {
				oFilterGroupItem.data("isCustomField", true);
				this._attachCustomControlCustomDataChange(oFilterGroupItem._getControl().getCustomData());
			}

			if (oField.control && oField.control.getTooltip && oField.control.getTooltip()) {
				oFilterGroupItem.setControlTooltip(oField.control.getTooltip());
			}

			if (oField.quickInfo) {
				this._setLabelTooltip(oFilterGroupItem, oField.quickInfo);
			}

			this._setLabel(oFilterGroupItem, oField.label);

			this.addFilterGroupItem(oFilterGroupItem);
		}.bind(this);

		// FilterBar needs this information
		oField.groupName = oFilterGroup.groupName;
		oField.groupTitle = oFilterGroup.groupLabel;

		return oField;
	};

	/**
	 * Creates a new field and adds it to the filter bar into the AdvancedSearchArea, based on the metadata provided by the FilterProvider
	 * @private
	 * @param {object} oFilterItem receiving the label text.
	 * @param {string} sLabel the new label text.
	 */
	SmartFilterBar.prototype._setLabel = function(oFilterItem, sLabel) {
		if (sLabel.match(/{@i18n>.+}/gi)) {
			oFilterItem.bindProperty("label", sLabel.substring(1, sLabel.length - 1));
		} else {
			oFilterItem.setLabel(sLabel);
		}
	};

	/**
	 * Creates a new field and adds it to the filter bar into the AdvancedSearchArea, based on the metadata provided by the FilterProvider
	 * @private
	 * @param {object} oFilterItem receiving the QuickInfo text.
	 * @param {string} sQuickInfo the new QuickInfo text.
	 */
	SmartFilterBar.prototype._setLabelTooltip = function(oFilterItem, sQuickInfo) {
		var aResult = /{(@?i18n>.+)}/i.exec(sQuickInfo);
		if (aResult && aResult[1]) {
			oFilterItem.bindProperty("labelTooltip", aResult[1]);
		} else {
			oFilterItem.setLabelTooltip(sQuickInfo);
		}
	};

	SmartFilterBar.prototype._logAccessWhenNotInitialized = function(sMethodName) {
		if (!this.bIsInitialised) {
			Log.error("SmartFilterBar." + sMethodName + ": called before the SmartFilterBar is initialized");
		}
	};

	/**
	 * Ensures the associated ValueHelpProvider is loaded.
	 * @param {string} sFieldName is the name of the property from the entity type which is associated with a Value Help.
	 * @public
	 */
	SmartFilterBar.prototype.ensureLoadedValueHelp = function(sFieldName) {

		this._logAccessWhenNotInitialized("ensureLoadedValueHelp");

		if (this._oFilterProvider) {
			this._oFilterProvider.getAssociatedValueHelpProviders().some(function(oValueHelpProvider) {
				if (oValueHelpProvider.sFieldName === sFieldName) {
					this._ensureLoadedValueHelpList(oValueHelpProvider);
					return true;
				}
			}.bind(this));
		}
	};

	SmartFilterBar.prototype.ensureLoadedValueList = function(sFieldName) {

		if (this._oFilterProvider) {
			this._oFilterProvider.getAssociatedValueListProviders().some(function(oValueListProvider) {
				if (oValueListProvider.sFieldName === sFieldName) {
					this._ensureLoadedValueHelpList(oValueListProvider);
					return true;
				}
			}.bind(this));
		}
	};

	SmartFilterBar.prototype._ensureLoadedValueHelpList = function(oBaseValueProvider) {
		if (!oBaseValueProvider._bValueListRequested) {
			oBaseValueProvider.loadAnnotation();
		}
	};


	SmartFilterBar.prototype._getValueListHelpProvider = function(sFieldName) {

		var oValueListHelpProvider = null;

		if (this._oFilterProvider) {
			this._oFilterProvider.getAssociatedValueListProviders().some(function(oValueListProvider) {
				if (oValueListProvider.sFieldName === sFieldName) {
					oValueListHelpProvider = oValueListProvider;
				}

				return oValueListHelpProvider != null;
			});

			if (!oValueListHelpProvider) {
				this._oFilterProvider.getAssociatedValueHelpProviders().some(function(oValueHelpProvider) {
					if (oValueHelpProvider.sFieldName === sFieldName) {
						oValueListHelpProvider = oValueHelpProvider;
					}

					return oValueListHelpProvider != null;
				});
			}

		}

		return oValueListHelpProvider;
	};

	/**
	 * Reads the descriptions for given filters and value keys.
	 * @protected
	 * @param {array} aFiltersWithKeyValues List of filters with value keys to be retrieved
	 * @since 1.75
	 */
	SmartFilterBar.prototype.getDescriptionForKeys = function(aFiltersWithKeyValues) {
		var aFilterKeys = [];

		if (aFiltersWithKeyValues) {
			aFiltersWithKeyValues.forEach(function(oInfoFilter) {

				var oBaseValueProvider = this._getValueListHelpProvider(oInfoFilter.filterName);
				if (oBaseValueProvider) {
					if (!oBaseValueProvider._bValueListRequested) {
						oBaseValueProvider.loadAnnotation();
					}

					oInfoFilter.provider = oBaseValueProvider;
					aFilterKeys.push(oInfoFilter);
				}

			}.bind(this));

			if (aFilterKeys && aFilterKeys.length > 0) {
				aFilterKeys.forEach(function(oInfoField) {
					if (oInfoField.provider) {
						oInfoField.provider.readData(oInfoField.keys);
					}
				});
			}
		}
	};

	SmartFilterBar.prototype.ensureLoadedValueHelpList = function(sFieldName) {
		this.ensureLoadedValueHelp(sFieldName);
		this.ensureLoadedValueList(sFieldName);
	};

	/**
	 * Returns an array of filters (sap.ui.model.Filter instances), for visible fields, that can be used to restrict the query result from OData.<br>
	 * The result of this method can directly be used during aggregation binding or OData read.
	 * @param {string[]} [aFieldNames] optional array of field names that filters should be returned, if not given all visible filters are returned
	 * @returns {sap.ui.model.Filter[]} array of sap.ui.model.Filter or multi-filters
	 * @public
	 */
	SmartFilterBar.prototype.getFilters = function(aFieldNames) {
		this._logAccessWhenNotInitialized("getFilters");

		if (!aFieldNames || !aFieldNames.length) {
			if (this.getIsRunningInValueHelpDialog()) {
				aFieldNames = this._getAllFieldNames();
			} else {
				aFieldNames = this._getVisibleFieldNames(true);
			}
		}

		return this._oFilterProvider ? this._oFilterProvider.getFilters(aFieldNames) : [];
	};

	/**
	 * Returns a parameter object that can be used to restrict the result of an OData service request if a basic search is performed. <caption>Example
	 * of a returned object:</caption>
	 *
	 * <pre>
	 * {
	 * 	&quot;custom&quot;: {
	 * 		&quot;search-focus&quot;: &quot;MySearchFocusFieldName&quot;,
	 * 		&quot;search&quot;: &quot;MySearchString&quot;
	 * 	}
	 * }
	 * </pre>
	 *
	 * These parameters can be handed over as custom parameters, for example, to the {@link sap.ui.model.odata.v2.ODataListBinding}.
	 * @returns {object} A parameter object containing OData query parameters
	 * @public
	 */
	SmartFilterBar.prototype.getParameters = function() {

		this._logAccessWhenNotInitialized("getParameters");

		return this._oFilterProvider ? this._oFilterProvider.getParameters() : {};
	};

	/**
	 * Returns the binding paths for the parameters.
	 * @experimental since 1.42.0 The API is NOT stable yet. Use at your own risk.
	 * @public
	 * @returns {string} Binding path of the parameters
	 */
	SmartFilterBar.prototype.getAnalyticBindingPath = function() {
		var sBindingPath = "";

		this._logAccessWhenNotInitialized("getAnalyticBindingPath");

		if (this._oFilterProvider) {
			sBindingPath = this._oFilterProvider.getAnalyticBindingPath();
		}

		return sBindingPath;
	};

	/**
	 * Returns the binding paths for the parameters. This API can be used for both analytical and non-analytical services. <b>Note</b>For analytical
	 * services, the API is NOT stable yet. Use at your own risk.
	 * @since 1.53.0
	 * @public
	 * @returns {string} Binding path of the parameters
	 */
	SmartFilterBar.prototype.getParameterBindingPath = function() {
		return this.getAnalyticBindingPath();
	};

	/**
	 * Returns the control (if any) with the specified key (Property name in OData entity). Use just the property name as the key when getting a
	 * control from the basic area. Example: "CompanyCode" & Use "EntityName/GroupName.FieldName" format to get controls from groups.
	 * Example:"Account.CompanyCode"
	 * @param {string} sKey The key as present in the OData property name/control configuration
	 * @returns {object|sap.ui.core.Control} The control in the filter bar, if any
	 * @public
	 *
	 * @deprecated As of version 1.99. Use {@link sap.ui.core.Core.byId} for custom controls provided by you. To modify data use {@link sap.ui.comp.smartfilterbar.SmartFilterBar#setFilterData} or {@link sap.ui.comp.filterbar.FilterBar#setUiState}.
	 * @ui5-not-supported
	 */
	SmartFilterBar.prototype.getControlByKey = function(sKey) {
		Log.warning("Using deprecated method: sap.ui.comp.smartfilterbar.SmartFilterBar#getControlByKey. Consider changing it with proper one.");
		this._logAccessWhenNotInitialized("getControlByKey");
		return this._determineControlByName(sKey);
	};

	/**
	 * Returns an array of all field names of a specific EntitySet
	 * including the names of the hidden fields
	 * @private
	 * @returns {Array} aFieldNames - array of field names
	 */
	SmartFilterBar.prototype._getAllFieldNames = function() {
		var aFields, aFieldNames = [], i, iLen, oItem;

		if (this._oFilterProvider && this._oFilterProvider._oMetadataAnalyser) {
			aFields = this._oFilterProvider._oMetadataAnalyser.getFieldsByEntitySetName(this.getEntitySet());
		}
		if (aFields) {
			iLen = aFields.length;
			for (i = 0; i < iLen; i++) {
				oItem = aFields[i];
				if (oItem) {
					aFieldNames.push(oItem.name);
				}
			}
		}

		return aFieldNames;
	};

	SmartFilterBar.prototype._getAllFilterAndParameterNames = function(bIgnoreParameters) {
		var aFieldNames = [],
			aVisibleFilterItems = this.getAllFilterItems(false),
			iLen = aVisibleFilterItems.length,
			oItem;

		// loop through all the visible filter items and get their names
		while (iLen--) {
			oItem = aVisibleFilterItems[iLen];
			if (oItem) {
				if (bIgnoreParameters && oItem._isParameter()) {
					continue;
				}

				aFieldNames.push(oItem.getName());
			}
		}
		return aFieldNames;
	};

	/**
	 * Returns an array of visible field names
	 * @private
	 * @param {boolean} [bIgnoreParameters=false] indication if the analytic parameters should be omitted
	 * @returns {Array} aFieldNames - array of field names
	 */
	SmartFilterBar.prototype._getVisibleFieldNames = function(bIgnoreParameters) {
		var aFieldNames = [],
			aVisibleFilterItems = this.getAllFilterItems(true),
			iLen = aVisibleFilterItems.length,
			oItem;

		// loop through all the visible filter items and get their names
		while (iLen--) {
			oItem = aVisibleFilterItems[iLen];
			if (oItem) {
				if (bIgnoreParameters && oItem._isParameter()) {
					continue;
				}

				aFieldNames.push(oItem.getName());
			}
		}
		return aFieldNames;
	};


	/**
	 * checks the value of the custom data
	 * @private
	 * @param {Object} oCustomData custom data
	 * @returns {boolean} has value/or not
	 */
	SmartFilterBar.prototype._checkHasValueData = function(oCustomData) {
		if (!oCustomData || oCustomData === "false") {
			return false;
		}

		if (typeof oCustomData === "boolean") {
			return oCustomData;
		} else if (typeof oCustomData === "string" && oCustomData.toLowerCase() === "true") {
			return true;
		}

		return false;
	};

	/**
	 * checks if the current filter has a value
	 * @param {Object} oData data as returned by the oData-service
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem representing the filter
	 * @param {sap.ui.core.Control} oControl the control as described by the oFilterItem
	 * @returns {boolean} true if the filter item has a value
	 * @private
	 */
	SmartFilterBar.prototype._checkForValues = function(oData, oFilterItem, oControl) {
		var sValue = null, oFieldMetadata;
		if (oData && oFilterItem && oControl) {
			if (!oFilterItem.data("isCustomField")) {
				// Check if Data exists in the filter model for internal fields
				sValue = oData[oFilterItem.getName()];

				if (!sValue && oControl.getSelectedItem && oControl.getSelectedItem()) { // CB or Select with a valid key === ""

					// BCP: 1980211559
					// consider boolean with key eq empty as not set
					oFieldMetadata = FilterProviderUtils._getFieldMetadata(this._aFilterBarViewMetadata, oFilterItem.getName());
					if (oFieldMetadata && (oFieldMetadata.type === "Edm.Boolean")) {
						if (oControl.getSelectedItem().getKey() === "") {
							return false;
						}
					}

					return true;
				}
				if (!sValue && oControl.getSelectedKey && oControl.getSelectedKey()) { // CB or Select with a valid key === ""
					return true;
				}

				// BCP: 2180295099 there is a selected key from selection variant but item with the same key does not exist
				if (
					sValue &&
					oControl.isA("sap.m.ComboBox") &&
					!oControl.getItemByKey(sValue.toString()) // Control has no item with the same key
				) {
					return false;
				}

				if (sValue === undefined) { // empty values are not passed to this method. So check first for special controls.
					return false;
				}
			} else {

				var oCustomData = oControl.data("hasValue");
				if ((oCustomData !== undefined) && (oCustomData != null)) {
					return this._checkHasValueData(oCustomData);
				} else {
					if (oControl.getValue) {
						// Check if getValue is present and filled
						if (oControl.getValue()) {
							return true;
						}
					}

					if (oControl.getSelectedItem && oControl.getSelectedItem()) {
						return true;
					}

					if (oControl.getSelectedKey && oControl.getSelectedKey()) { // new mechanism with 1.25. Has to be provided by the custom field
						return true;
					}

					if (oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
						return true;
					}

					if (oControl.getTokens && oControl.getTokens().length > 0) {
						return true;
					}
				}
			}
		}

		return !!sValue;
	};

	/**
	 * Returns all filter items
	 * <ul>
	 * <li>Containing a value</li>
	 * <li>With the <code>visible</code> property set to <code>true</code></li>
	 * <li>That are either flagged as <code>partOfCurrentVariant</code> or <code>visibleInFilterBar</code></li>
	 * <li>That are not custom filters</li>
	 * </ul>
	 * Even hidden filters will be considered as long as the mentioned criteria is fullfilled.
	 * @returns {sap.ui.comp.filterbar.FilterGroupItem[]} Filter items containing a value
	 * @public
	 */
	SmartFilterBar.prototype.getFiltersWithValues = function() {
		this._logAccessWhenNotInitialized("getFiltersWithValues");
		return this._getFiltersWithAssignedValues(true);
	};

	SmartFilterBar.prototype.getAllFiltersWithValues = function() {
		return this._getFiltersWithAssignedValues(false);
	};

	SmartFilterBar.prototype._getFiltersWithAssignedValues = function(bOnlyVisible) {
		var aFilterItemsWithValue = [];

		// logic from check _validateMandatoryFields
		var aFilterItems = this.getAllFilterItems(bOnlyVisible), oData, oFilterItem, iLen = 0, oControl;

		if (bOnlyVisible) {
			oData = this.getFilterData();
		} else if (this._oFilterProvider) {
			oData = this._bSetFilterDataSuspended ? this._oStoredFilterData : this._oFilterProvider.getFilledFilterData(this._getAllFilterAndParameterNames());
		}
		if (aFilterItems && oData) {
			iLen = aFilterItems.length;
			// Loop through the mandatory field names
			while (iLen--) {
				oFilterItem = aFilterItems[iLen];
				// Get the control from filter item name
				oControl = this._determineControlByFilterItem(oFilterItem, true);
				if (this._checkForValues(oData, oFilterItem, oControl)) {
					aFilterItemsWithValue.push(oFilterItem);
				}
			}
		}

		return aFilterItemsWithValue.reverse();
	};

	/**
	 * @param sFilterName filter name to be checked
	 * @param oSourceData optional. Source data to check for value. If omitted the data from the FilterProvider will be used
	 * @returns {boolean}
	 * @private
	 */
	SmartFilterBar.prototype._checkIfFilterHasValue = function (sFilterName, oSourceData) {
		var oData = oSourceData || this._oFilterProvider.getFilterData();
		var vFilterData = oData[sFilterName] || (oData._CUSTOM && oData._CUSTOM[sFilterName]);

		if (vFilterData === null || typeof vFilterData === "undefined") {
			return false;
		}

		if (typeof vFilterData === "string" && vFilterData) {
			return true;
		}

		if (typeof vFilterData === "number") {
			return true;
		}

		if (typeof vFilterData === "object" && Object.prototype.toString.call(vFilterData) === "[object Date]") {
			return true;
		}

		if (typeof vFilterData === "object" && (vFilterData.hasOwnProperty("low") || vFilterData.hasOwnProperty("high"))) {
			return !!vFilterData.low || !!vFilterData.high;
		}

		if (typeof vFilterData === "object" && (vFilterData.hasOwnProperty("value") || vFilterData.hasOwnProperty("items") || vFilterData.hasOwnProperty("ranges"))) {
			return !!vFilterData.value || (vFilterData.items && !!vFilterData.items.length) || (vFilterData.ranges && !!vFilterData.ranges.length);
		}

		return false;
	};

	/**
	 * @param oFilterItem filter item to be checked
	 * @returns {boolean}
	 * @private
	 */
	SmartFilterBar.prototype._checkIfCustomControlFilterHasValue = function (oFilterItem) {
		if (!oFilterItem.control) {
			return false;
		}

		return oFilterItem.control.data('hasValue');
	};

	SmartFilterBar.prototype._removeEmptyFilters = function(mStringifiedFilterValues) {
		var mFilterValues = JSON.parse(mStringifiedFilterValues);
		var mFiltersWithValues = {};

		Object.keys(mFilterValues).forEach(function(sFilterName) {
			if ((sFilterName === "_CUSTOM") || this._checkIfFilterHasValue(sFilterName)) {
				mFiltersWithValues[sFilterName] = mFilterValues[sFilterName];
			}
		}.bind(this));

		return JSON.stringify(mFiltersWithValues);
	};


	SmartFilterBar.prototype._removeValuesForNonPartOfCurrentVariants = function(aFilterNonPartOfCurrentVariant) {

		var aCondMetadataNonPart = [];

		if (this._oFilterProvider && aFilterNonPartOfCurrentVariant && (aFilterNonPartOfCurrentVariant.length > 0)) {

			var oData = this._oFilterProvider.getFilterData();

			aFilterNonPartOfCurrentVariant.forEach(function(oFilterItem) {
				var sFieldName = oFilterItem.getName();

				if (!oFilterItem.data("isCustomField")) {
					var oFieldMetadata = this._oFilterProvider._getFieldMetadata(sFieldName);
					if (oFieldMetadata.conditionType) {
						aCondMetadataNonPart.push(oFieldMetadata);
					}

					this._oFilterProvider._createInitialModelForField(oData, oFieldMetadata, false);
				} else if (oData._CUSTOM && oData._CUSTOM[sFieldName]) {
					delete oData._CUSTOM[sFieldName];
				}
			}, this);

			this.setFilterData(oData);

			aCondMetadataNonPart.forEach(function(oCondMetadata) {
				var sFieldName = oCondMetadata.fieldName;
				this._oFilterProvider._mConditionTypeFields[sFieldName].conditionType.initialize(oData[sFieldName]);
			}, this);
		}

	};


	SmartFilterBar.prototype.getFilterDataAsStringForVariant = function(bAllFilterData, sVersion) {
		var oJson = {},
			aDateTimeOffsetFilterNames = this._oFilterProvider._aFilterBarDateTimeFieldNames;

		if (aDateTimeOffsetFilterNames.length > 0) {

			oJson = merge(oJson, this.getFilterData(bAllFilterData));

			aDateTimeOffsetFilterNames.forEach(function(sField) {
				var aValue, oData, oFieldMetadata = FilterProviderUtils._getFieldMetadata(this._aFilterBarViewMetadata, sField);
				if (oFieldMetadata && (oFieldMetadata.type === "Edm.DateTimeOffset")) {
					oData = oJson[sField];
					if (oData && oData.low) {
						if (oFieldMetadata.filterRestriction === FilterType.interval) {
							aValue = FormatUtil.parseDateTimeOffsetInterval(oData.low);
							if (aValue && (aValue.length === 2)) {
								oData.low = oFieldMetadata.ui5Type.parseValue(aValue[0], "string");
								oData.high = oFieldMetadata.ui5Type.parseValue(aValue[1], "string");
							}
						}
					}
				}
			}.bind(this));

			if (sVersion === "V3") {

				this._oFilterProvider._aFilterBarDateFieldNames.concat(this._oFilterProvider._aFilterBarTimeFieldNames).forEach(function(sField) {
					var oData, oFieldMetadata = FilterProviderUtils._getFieldMetadata(this._aFilterBarViewMetadata, sField);
					if (!oFieldMetadata) {
						oFieldMetadata = this.getParameterMetadata(sField);
					}

					if (oFieldMetadata && (oFieldMetadata.filterType === "date" || oFieldMetadata.filterType === "time")) {
						oData = oJson[sField];
						var bSingleDateRangeType = this._oFilterProvider._isSingleDynamicDateEnabled(oFieldMetadata);
						if (oData) {
							if ((oFieldMetadata.filterRestriction === FilterType.multiple) || (oFieldMetadata.filterRestriction === FilterType.auto)) {
								this._processDateRanges(oData.ranges);
							} else if (oFieldMetadata.filterRestriction === FilterType.single && bSingleDateRangeType) {
								this._processDateRanges(oData.ranges);
							} else if (oFieldMetadata.filterRestriction === FilterType.single) {
								oJson[sField] = this._dateConvert(oData);
							} else if (oFieldMetadata.filterRestriction === FilterType.interval) {

								if (oData.ranges) {
									this._processDateRanges(oData.ranges);
								} else {
									if (oData.low) {
										oData.low = this._dateConvert(oData.low);
									}
									if (oData.high) {
										oData.high = this._dateConvert(oData.high);
									}
								}
							}
						}
					}
				}.bind(this));
			}

			return JSON.stringify(oJson);

		} else {

			return this.getFilterDataAsString(bAllFilterData);
		}
	};

	SmartFilterBar.prototype._dateConvert = function(oValue) {
		if (this.isInUTCMode()) {

			if (typeof oValue === "string") {
				oValue = new Date(oValue);
			}
			oValue = DateTimeUtil.localToUtc(oValue).toJSON();
		}

		if (oValue.indexOf && oValue.indexOf('Z') === (oValue.length - 1)) {
			oValue = oValue.substr(0, oValue.length - 1);
		}

		return oValue;
	};

	SmartFilterBar.prototype._processDateRanges = function (aRanges) {
		if (!Array.isArray(aRanges)) {
			return;
		}
		aRanges.forEach(function (oRange) {
			oRange.tokenText = null;
			if (oRange.value1) {
				oRange.value1 = this._dateConvert(oRange.value1);
			}
			if (oRange.value2) {
				oRange.value2 = this._dateConvert(oRange.value2);
			}
		}.bind(this));
	};

	/**
	 * Returns the data currently set in the filter data model.
	 * @param {boolean} [bAllFilterData=false] Also include empty/invisible fields filter data
	 * @returns {object} The JSON data in the filter bar
	 * @public
	 */
	SmartFilterBar.prototype.getFilterData = function(bAllFilterData) {
		if (this._bSetFilterDataSuspended) {
			return Object.assign({}, this._oStoredFilterData);
		}

		var oFP = this._oFilterProvider;
		this._logAccessWhenNotInitialized("getFilterData");

		if (!oFP) {
			return null;
		}

		return bAllFilterData ? oFP.getFilterData() : oFP.getFilledFilterData(this._getVisibleFieldNames());
	};

	/**
	 * Returns the data currently set in the filter data model as string.
	 * @param {boolean} bAllFilterData Also include empty/invisible fields filter data
	 * @returns {string|null} The JSON data string
	 * @public
	 */
	SmartFilterBar.prototype.getFilterDataAsString = function(bAllFilterData) {
		var oFP = this._oFilterProvider;
		this._logAccessWhenNotInitialized("getFilterDataAsString");

		if (!oFP) {
			return null;
		}

		return bAllFilterData ? oFP.getFilterDataAsString() : oFP.getFilledFilterDataAsString(this._getVisibleFieldNames());
	};

	SmartFilterBar.prototype.getParameterMetadata = function(sName) {
		var oParamMetadata = null,
			aParams = this.getAnalyticalParameters();

		if (sName.indexOf(library.ANALYTICAL_PARAMETER_PREFIX) === 0) {
			sName = sName.substring(library.ANALYTICAL_PARAMETER_PREFIX.length);
		}

		if (Array.isArray(aParams)) {
			aParams.some(function(oField) {
				if (oField.name === sName) {
					oParamMetadata = oField;
				}
				return oParamMetadata !== null;
			});
		}

		return oParamMetadata;
	};

	SmartFilterBar.prototype.setFilterDataAsStringFromVariant = function(sJson, bReplace, sVersion) {
		var oJson, aDateTimeOffsetFilterNames = this._oFilterProvider._aFilterBarDateTimeFieldNames;

		if (sJson) {

			if (aDateTimeOffsetFilterNames.length > 0) {
				oJson = JSON.parse(sJson);

				aDateTimeOffsetFilterNames.forEach(function(sField) {
					var oData, oFieldMetadata = FilterProviderUtils._getFieldMetadata(this._aFilterBarViewMetadata, sField);
					if (oFieldMetadata && (oFieldMetadata.type === "Edm.DateTimeOffset")) {
						oData = oJson[sField];
						if (oData && (oFieldMetadata.filterRestriction === FilterType.multiple || oFieldMetadata.filterRestriction === FilterType.auto)) {
							if (oData.ranges) {
								for (var i = 0; i < oData.ranges.length; i++) {
									delete oData.ranges[i].tokenText;
								}
							}
						}
					}
				}.bind(this));

				if (sVersion === "V3") {

					this._oFilterProvider._aFilterBarDateFieldNames.concat(this._oFilterProvider._aFilterBarTimeFieldNames).forEach(function(sField) {
						var oData, oFieldMetadata = FilterProviderUtils._getFieldMetadata(this._aFilterBarViewMetadata, sField);
						if (!oFieldMetadata) {
							oFieldMetadata = this.getParameterMetadata(sField);
						}

						if (oFieldMetadata && (oFieldMetadata.filterType === "date" || oFieldMetadata.filterType === "time")) {
							oData = oJson[sField];
							if (oData) {
								if (oData.ranges) {
									for (var i = 0; i < oData.ranges.length; i++) {
										delete oData.ranges[i].tokenText;
									}
								}
							}
						}
					}.bind(this));
				}

				this.setFilterData(oJson, bReplace);

			} else {

				this.setFilterDataAsString(sJson, bReplace);
			}
		}
	};

	/**
	 * Sets the data in the filter data model. The follow-on filterChange event is only triggered when none _CUSTOM data is set.
	 * @param {object} oJson The JSON data in the filter bar
	 * @param {boolean} bReplace Replace existing filter data
	 * @public
	 */
	SmartFilterBar.prototype.setFilterData = function (oJson, bReplace) {
		if (this._bSetFilterDataSuspended) {
			if (bReplace) {
				this._oStoredFilterData = oJson;
			} else {
				this._oStoredFilterData = Object.assign({}, this._oStoredFilterData, oJson);
			}
			return;
		}
		this._setFilterData(oJson, bReplace);
	};

	/**
	 * @private
	 * @experimental
	 * @ui5-restricted sap.suite.ui.generic.template
	 * @since 1.81
	 */
	SmartFilterBar.prototype.suspendSetFilterData = function () {
		this._bSetFilterDataSuspended = true;
	};

	/**
	 * @private
	 * @experimental
	 * @ui5-restricted sap.suite.ui.generic.template
	 * @since 1.81
	 */
	SmartFilterBar.prototype.resumeSetFilterData = function () {
		if (this._bSetFilterDataSuspended) {
			this._bSetFilterDataSuspended = false;

			this.setFilterData(this._oStoredFilterData, true);

			this._oStoredFilterData = {};
		}
	};

	/**
	 * @private
	 */
	SmartFilterBar.prototype._setFilterData = function(oJson, bReplace) {
		var oField;

		this._logAccessWhenNotInitialized("setFilterData");

		if (oJson) {
			Object.keys(oJson).forEach(function (sKey) {
				oField = this._getFilterMetadata(sKey);
				if (oField && this._checkIfFilterHasValue(sKey, oJson)) {
					this._instanciateFilterItem(oField);
				}
			}.bind(this));
		}

		if (this._oFilterProvider) {
			this._oFilterProvider.setFilterData(oJson, bReplace);
		}

		if (oJson && (Object.keys(oJson).length === 1) && oJson._CUSTOM) {
			// in case only _CUSTOM information is available do not trigger filterChange-event
			return;
		}

		// The internal controls do not fire change event in this scenario
		// So, we fire it manually once here
		this.fireFilterChange({
			afterFilterDataUpdate: true
		});
	};

	/**
	 * Sets the data in the filter data model as string.
	 * @param {string} sJson The JSON data in the filter bar
	 * @param {boolean} bReplace Replace existing filter data
	 * @public
	 */
	SmartFilterBar.prototype.setFilterDataAsString = function(sJson, bReplace) {
		if (sJson) {
			this.setFilterData(JSON.parse(sJson), bReplace);
		}
	};

	/**
	 * Overwrites method from base class. Called when user clicks the clear button of the FilterBar. Clears all filter fields and fires clear event.
	 * @private
	 */
	SmartFilterBar.prototype.fireClear = function() {
		this._clearFilterFields();
		this.fireEvent("clear", arguments);
	};

	/**
	 * Clears the values of all filter fields. Applies default values if applicable.
	 * @private
	 */
	SmartFilterBar.prototype._clearFilterFields = function() {
		if (this._oFilterProvider) {
			this._oFilterProvider.clear();

			this._clearErroneusControlValues();
		}
		// The internal controls do not fire change event in this scenario
		// So, we fire it manually once here
		this.fireFilterChange({
			afterFilterDataUpdate: true
		});
	};

	/**
	 * Overwrites method from base class. Called when user clicks the reset button of the FilterBar. Clears all filter fields and fires reset event.
	 * @private
	 */
	SmartFilterBar.prototype.fireReset = function() {
		this._resetFilterFields();
		this.fireEvent("reset", arguments);
	};

	/**
	 * Clears the values of all filter fields. Applies default values if applicable.
	 * @private
	 */
	SmartFilterBar.prototype._resetFilterFields = function() {
		if (this._oFilterProvider) {
			this._oFilterProvider.reset();

			this._clearErroneusControlValues();
		}
		// The internal controls do not fire change event in this scenario
		// So, we fire it manually once here
		this.fireFilterChange({
			afterFilterDataUpdate: true
		});
	};

	SmartFilterBar.prototype._suspendedTriggerSearch = function (iDelay) {
		if (this.getSuppressSelection()) {
			return;
		}

		this._oSuspendedTriggerSearch = {delay: iDelay}; // We take into account only the last request delay
		return true;
	};

	SmartFilterBar.prototype._regularTriggerSearch = function (iDelay) {
		if (this.getSuppressSelection()) {
			return;
		}

		this._clearDelayedSearch();
		this._iDelayedSearchId = setTimeout(function () {
			var aPromises = this._getVisibleControlsLoadingPromises();

			if (!this._bSearchTriggeredOnce && aPromises.length) {
				Promise.all(aPromises)
					.then(this._search.bind(this))
					.catch(this._search.bind(this)); // We still trigger the search if something fails
			} else {
				this._search();
			}

		}.bind(this), iDelay || 0);
	};

	/**
	 * Suspends calls to the <code>search</code> method when not called with the <code>bSync</code> parameter.
	 * @public
	 */
	SmartFilterBar.prototype.suspendSelection = function () {
		this.triggerSearch = this._suspendedTriggerSearch;
	};

	/**
	 * Resumes calls to the <code>search</code> method. If it was called during the suspension, the search
	 * will be triggered once regardless of how many times it was called during suspension.
	 * @public
	 */
	SmartFilterBar.prototype.resumeSelection = function () {
		this.triggerSearch = this._regularTriggerSearch;
		if (this._oSuspendedTriggerSearch) {
			this.triggerSearch(this._oSuspendedTriggerSearch.delay);
			this._oSuspendedTriggerSearch = undefined;
		}
	};

	/**
	 * Triggers a search with the specified timeout or simple in a 0 delayed call - so that, current execution stack is done before the search is
	 * executed
	 * @param {int} [iDelay=0] Delay time in milliseconds
	 * @private
	 */
	SmartFilterBar.prototype.triggerSearch = SmartFilterBar.prototype._regularTriggerSearch;

	/**
	 * This method returns promises for every visible filter in the control which, when resolved, guarantee
	 * that the control has its data loaded from binding and is in a state where it can be properly
	 * validated, if needed.
	 *
	 * NOTE: Currently this makes sure only mandatory ComboBox controls have received data if they have their items
	 * aggregation bound. In the future this method might get extended to handle other control types as needed.
	 * @returns {aPromises[]}
	 * @private
	 */
	SmartFilterBar.prototype._getVisibleControlsLoadingPromises = function () {
		// Wait for bindings from ComboBox to resolve.
		var aPromises = [];

		this.determineMandatoryFilterItems().forEach(function (oFilterItem) {
			var oControl = oFilterItem._getControl();
			if (
				oControl &&
				oControl.isA("sap.m.ComboBox") && // It is a ComboBox control
				!oControl.getItems().length // There are no items yet
			) {
				aPromises.push(new Promise(function (fnSuccess /*, fnReject */) {
					var oBinding = oControl.getBinding("items"),
						oObserver;

					// Scenario 1) Control binding is ready:
					if (oBinding) {
						// Resolve the promise on data received
						oBinding.attachEventOnce("dataReceived", fnSuccess);
						return;
					}

					// Scenario 2) Control binding is not ready (aggregation not bound yet BCP: 2170318143):
					oObserver = new ManagedObjectObserver(function (oMutation) {
						// Waiting for the items aggregation to be bound.
						if (oMutation && oMutation.mutation === "ready") {
							// Resolve the promise on data received
							oControl.getBinding("items").attachEventOnce("dataReceived", fnSuccess);

							// When the binding is ready we remove the observer
							oObserver.unobserve(oControl, {bindings: ["items"]});
						}
					});

					// Initiate the observer
					oObserver.observe(oControl, {bindings: ["items"]});

					// Store the instance so we can destroy it later
					this._oObservers.push(oObserver);
				}.bind(this)));
			}
		}.bind(this));

		return aPromises;
	};

	/**
	 * Overwrites method from base class. Called when user clicks the search button of the FilterBar. The search is executed asynchronously per
	 * default, but can be forced to synchronously execution by providing the <code>bSync</code> set to <code>true</code>. Synchronous mode is
	 * only supported for non live mode scenarios. In the synchronous mode a mandatory check prior to the search execution is made.
	 * @public
	 * @param {boolean} [bSync=false] Indicates if the search should be triggered synchronously
	 * @returns {boolean|undefined} Indicates if there are validation errors
	 */
	SmartFilterBar.prototype.search = function(bSync) {
		if (this.getSuppressSelection()) {
			return undefined;
		}

		this._logAccessWhenNotInitialized("search");

		if (bSync && !this.isLiveMode()) {
			return this._search();
		}

		this.triggerSearch(0);
		return true;
	};

	/**
	 * Executes the search.
	 * @private
	 * @returns {boolean | undefined} <code>true</code> indicates that there are no validation problems.
	 */
	SmartFilterBar.prototype._search = function() {
		var bContinue = true,
			bInValidationError = false,
			sErrorMessage,
			oIsSearchAllowed,
			fnHandler;

		this._bSearchTriggeredOnce = true;

		// First check for validation errors or if search should be prevented
		oIsSearchAllowed = this.verifySearchAllowed();
		if (oIsSearchAllowed.hasOwnProperty("pending")) {
			// if search is pending.. do nothing

			if (this._iDelayedSearchId && !this.getSuppressSelection()) {
				this.triggerSearch();
			}
			return undefined;
		} else if (oIsSearchAllowed.hasOwnProperty("error")) {
			// validation errors exist
			bContinue = false;
			bInValidationError = true;
		} else if (oIsSearchAllowed.hasOwnProperty("mandatory")) {
			// empty mandatory filters
			bContinue = false;
		}

		if (this.isPending() && !this._bIsPendingChangeAttached) {
			fnHandler = function(oEvent) {
				if (oEvent.getParameter("pendingValue") === false) {
					this.detachPendingChange(fnHandler);
					this._bIsPendingChangeAttached = false;
					// BCP: 1870054272
					// instead of a sync _search, we call the triggerSearch (async search) to give some pending DateRangeTypes the time to finish
					// their pending initialization
					this.triggerSearch();
				}
			}.bind(this);
			this._bIsPendingChangeAttached = true;
			this.attachPendingChange(fnHandler);
			return undefined;
		}

		// clear eventual delayed search
		this._clearDelayedSearch();

		if (bContinue) {

			if (this._isTablet() && this.getUseToolbar() && !this.getAdvancedMode()) {
				this.setFilterBarExpanded(false);
			}

			this.fireSearch([{
				selectionSet: this._retrieveCurrentSelectionSet(false, true),
				firedFromFilterBar: this._bSearchFiredFromFilterBar
			}]);
			this._bSearchFiredFromFilterBar = false;
		} else {
			if (!this._oResourceBundle) {
				this._oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");
			}

			if (!bInValidationError) {
				if (!this._sMandatoryErrorMessage) {
					this._sMandatoryErrorMessage = this._oResourceBundle.getText("EMPTY_MANDATORY_MESSAGE");
				}
				sErrorMessage = this._sMandatoryErrorMessage;
			} else {
				if (!this._sValidationErrorMessage) {
					this._sValidationErrorMessage = this._oResourceBundle.getText("VALIDATION_ERROR_MESSAGE");
				}
				sErrorMessage = this._sValidationErrorMessage;
			}

			if (this.getShowMessages() && !this.getLiveMode()) {
				try {
					MessageBox.error(sErrorMessage, {
						styleClass: (this.$() && this.$().closest(".sapUiSizeCompact").length) ? "sapUiSizeCompact" : "",
						onClose: this._setFocusOnFirstErroneousField.bind(this)
					});
				} catch (x) {
					return undefined;
				}
			} else {
				this._setFocusOnFirstErroneousField();
				Log.warning("search was not triggered. " + sErrorMessage);
				if (Device.system.desktop) {
					this.setFilterBarExpanded(true);
				}
			}

			// Opens the more area if error message is shown and if empty mandatory fields are present in the advanced filter area!
			if (this._bExpandAdvancedFilterArea && this.rerenderFilters) {
				this.rerenderFilters(true);
			}
		}
		return bContinue;
	};

	/**
	 * Verify if all mandatory filters or parameters have values.
	 * @public
	 * @returns {boolean} true indicates that all mandatory filters and parameters have values.
	 */
	SmartFilterBar.prototype.validateMandatoryFields = function() {
		this._logAccessWhenNotInitialized("validateMandatoryFields");
		return this._validateMandatoryFields();
	};

	/**
	 * Verifies if search is possible.
	 * @public
	 * @returns {object} an empty object indicates that all is fine and the search can be triggered. an object with the property mandatory indicates
	 *          that some mandatory filters or parameters are empty an object with the property pending indicates that a token validation is going on.
	 *          an object with the property error indicates that some filters or parameters are in error state.
	 */
	SmartFilterBar.prototype.verifySearchAllowed = function() {
		this._logAccessWhenNotInitialized("verifySearchAllowed");

		this.bIsSearchPending = false;
		// First check for validation errors or if search should be prevented
		if (this._validateState()) {
			if (this.validateMandatoryFields()) {
				return {};
			}

			return {
				mandatory: true
			};
		}
		if (this.bIsSearchPending) {
			return {
				pending: true
			};
		}

		return {
			error: true
		};

	};

	/**
	 * Sets focus on the first field having an error message
	 * @private
	 */
	SmartFilterBar.prototype._setFocusOnFirstErroneousField = function() {
		var aFilterItems,
			iLen,
			oControl,
			i;

		aFilterItems = this.getAllFilterItems(true);
		if (Array.isArray(aFilterItems)) {
			iLen = aFilterItems.length;
			for (i = 0; i < iLen; i++) {
				oControl = this._determineControlByFilterItem(aFilterItems[i], true);
				if (oControl && oControl.getValueState && oControl.getValueState() === ValueState.Error) {
					setTimeout(oControl["focus"].bind(oControl), 0);
					break;
				}
			}
		}
	};

	SmartFilterBar.prototype.setLiveMode = function(bFlag) {
		if (!this._isPhone()) {
			if (bFlag) {
				this.hideGoButton();
			} else {
				this.restoreGoButton();
			}
		}

		if (this._oSmartVariantManagement) {
			if (bFlag) {

				if (this._bShowShareState === undefined) {
					this._bShowShareState = this._oSmartVariantManagement.getShowExecuteOnSelection();
				}

				this._oSmartVariantManagement.setShowExecuteOnSelection(false);
			} else if (this._bShowShareState !== undefined) {
				this._oSmartVariantManagement.setShowExecuteOnSelection(this._bShowShareState);
			}
		}

		return this.setProperty("liveMode", bFlag);
	};

	SmartFilterBar.prototype.isLiveMode = function() {
		return this._isPhone() ? false : this.getLiveMode();
	};

	SmartFilterBar.prototype._clearDelayedSearch = function() {
		if (this._iDelayedSearchId) {
			clearTimeout(this._iDelayedSearchId);
			this._iDelayedSearchId = null;
		}
	};

	/**
	 * Checks the pending state of the FilterBar control
	 * @public
	 * @returns {boolean} true if at least one FilterItem element of the FilterBar control is pending
	 */
	SmartFilterBar.prototype.isPending = function() {
		return !this._oFilterProvider ? false : this._oFilterProvider.isPending();
	};

	/**
	 * Checks if the values of all mandatory filter fields are filled and returns true if they are; else returns false. If no fields and data exist
	 * true is returned! ErrorMessage/ErrorState is set on the fields accordingly.
	 * @private
	 * @returns {boolean} true when no errors exist
	 */
	SmartFilterBar.prototype._validateMandatoryFields = function() {
		var bFilled = true, aFilterItems = this.determineMandatoryFilterItems(), oFilterItem, oData = this.getFilterData(), iLen = 0, oControl;
		this._bExpandAdvancedFilterArea = false;
		if (aFilterItems && oData) {
			iLen = aFilterItems.length;
			// Loop through the mandatory field names
			while (iLen--) {
				oFilterItem = aFilterItems[iLen];

				// sField = oFilterItem.getName();
				// Get the control from filter item name
				oControl = this._determineControlByFilterItem(oFilterItem, true);
				if (oControl && oControl.setValueState) {

					if (this._checkForValues(oData, oFilterItem, oControl)) {
						// Clear error state only if it was set due to mandatory check
						if (oControl.data("__mandatoryEmpty")) {
							oControl.data("__mandatoryEmpty", null);
							oControl.setValueState(ValueState.None);
						}
					} else {
						bFilled = false;
						// If field has a value property and it is empty --> show error
						oControl.setValueState(ValueState.Error);
						// set flag if error state was set due to mandatory check
						oControl.data("__mandatoryEmpty", true);
						// GroupName method exists only on FilterGroupItem --> part of advanced filter area
						if (oFilterItem.getGroupName) {
							this._bExpandAdvancedFilterArea = true; // !!!! TODO: expand the filter area
						}
					}
				}
			}
		}
		return bFilled;
	};

	SmartFilterBar.prototype._setSmartVariant = function(sSmartVariant) {
		var oSmartVariantControl;

		if (!sSmartVariant) {
			return;
		}

		oSmartVariantControl = sap.ui.getCore().byId(sSmartVariant);
		if (oSmartVariantControl) {
			if (oSmartVariantControl.isA("sap.ui.comp.smartvariants.SmartVariantManagement")) {

				if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
					this._replaceVariantManagement(oSmartVariantControl);
					this._oSmartVariantManagement = oSmartVariantControl;
				}

			} else {
				Log.error("Control with the id=" + sSmartVariant + " not of expected type");
			}
		} else {
			Log.error("Control with the id=" + sSmartVariant + " not found");
		}
	};

	SmartFilterBar.prototype.setSmartVariant = function(sSmartVariant) {
		if (this.getAdvancedMode()) {
			Log.error("not supported for the advanced mode");
			return this;
		}

		this.setAssociation("smartVariant", sSmartVariant);
		this._setSmartVariant(sSmartVariant);

		return this;
	};

	SmartFilterBar.prototype.getSmartVariant = function() {
		if (this.getAdvancedMode()) {
			Log.error("not supported for the advanced mode");
			return null;
		}

		var sSmartVariantId = this.getAssociation("smartVariant");
		if (sSmartVariantId) {
			return sap.ui.getCore().byId(sSmartVariantId);

		}

		return this._oSmartVariantManagement;
	};

	/**
	 * creates the smart variant-management control
	 * @private
	 * @returns {SmartVariantManagement} the newly created variant control
	 */
	SmartFilterBar.prototype._createVariantManagement = function() {
		if (this.getAdvancedMode()) {
			return FilterBar.prototype._createVariantManagement.apply(this);
		}

		this._setSmartVariant(this.getSmartVariant());
		if (!this._oSmartVariantManagement) {
			this._oSmartVariantManagement = new SmartVariantManagement(this.getId() + "-variant", {
				showExecuteOnSelection: true,
				showShare: true
			});
		}

		return this._oSmartVariantManagement;
	};


	/**
	 * initializes the variant management, when the prerequisites are full filled. In this case the initialise-event will be triggered lated, after
	 * the variant management initialization. Triggers the initialise-event immediately, in case the pre-requisits are not full filled
	 * @private
	 */
	SmartFilterBar.prototype._initializeVariantManagement = function() {
		// initialise SmartVariant stuff only if it is necessary! (Ex: has a persistencyKey)
		if (!this.getIsRunningInValueHelpDialog() && this._oSmartVariantManagement && this.getPersistencyKey()) {
			var oPersInfo = new PersonalizableInfo({
				type: "filterBar",
				keyName: "persistencyKey",
				dataSource: this.getEntitySet() || this.getEntityType()
			});
			oPersInfo.setControl(this);

			if (this.getConsiderSelectionVariants() && !this._oSmartVariantManagement.isPageVariant()) {
				this._oSmartVariantManagement._createMetadataPromise();
				    this._prepareSelectionVariants();
				this._oSmartVariantManagement._resolveMetadataPromise();
			}

			this._oSmartVariantManagement.addPersonalizableControl(oPersInfo);

			if (this._checkHasValueData(this.data("executeStandardVariantOnSelect"))) {
				this._oSmartVariantManagement._executeOnSelectForStandardVariantByXML(true);
			}

			FilterBar.prototype._initializeVariantManagement.apply(this, arguments);
		} else {
			this.fireInitialise();
			this.fireInitialized();
		}
	};

	/**
	 * Is called whenever the filter bar is fully initialized. Especially the variant management control is initialized. Each oData metadata
	 * <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> annotation will be added as a variant item to the <code>VariantManagement</code>
	 * control. The key is the qualifier and is prefixed with a dedicated constant.
	 * @private
	 */
	SmartFilterBar.prototype.fireInitialized = function() {

		if (this.getConsiderSelectionVariants() && this._oSmartVariantManagement && !this._oSmartVariantManagement.isPageVariant()) {

			if (this._oStandardSelectionVariant) {
				this._oSmartVariantManagement._oStandardVariant = merge({}, this._defaultSelectionVariantHandling(this._oStandardSelectionVariant));
			}

			if (!this._oSmartVariantManagement._getDefaultVariantKey()) {
				if (this.getDefaultSelectionVariantName()) {
					var sDefaultKey = SmartFilterBar.SELECTION_VARIANT_KEY_PREFIX + this.getDefaultSelectionVariantName();
					this._oSmartVariantManagement.setInitialSelectionKey(sDefaultKey);
					this._oSmartVariantManagement.fireSelect({
						key: sDefaultKey
					});
				} else if (this._oStandardSelectionVariant) {
					this._oSmartVariantManagement.fireSelect({
						key: this._oSmartVariantManagement.STANDARDVARIANTKEY
					});
				}
			}

			this._oStandardSelectionVariant = null;
		}

		FilterBar.prototype.fireInitialized.apply(this, arguments);
	};

	SmartFilterBar.prototype._prepareSelectionVariants = function() {
		var aSelectionVariants,
			sKeyPrefix = SmartFilterBar.SELECTION_VARIANT_KEY_PREFIX,
			aVariants = [],
			oSVM = this._oSmartVariantManagement;

		aSelectionVariants = this.getSelectionVariants();
		if (aSelectionVariants) {

			var mRegister = {
				callback: this.getSelectionVariant,
				handler: this
			};

			aSelectionVariants.forEach(function(oSelectionVariant) {
				var sVariantKey = sKeyPrefix + oSelectionVariant.qualifier;
				if (oSelectionVariant.qualifier) {
					aVariants.push({id: sVariantKey,
						favorite: true,
						name: oSelectionVariant.annotation.Text.String});
				} else {
					this._oStandardSelectionVariant = oSelectionVariant;
				}
			}.bind(this));

			if (aVariants.length > 0 ) {
				mRegister.variants = aVariants;
				oSVM.registerSelectionVariantHandler(mRegister, sKeyPrefix);
			}

//			if (!oSVM._getDefaultVariantKey()) {
//				if (this.getDefaultSelectionVariantName()) {
//					sDefaultKey = sKeyPrefix + this.getDefaultSelectionVariantName();
//					oSVM.setInitialSelectionKey(sDefaultKey);
//					oSVM.fireSelect({
//						key: sDefaultKey
//					});
//				} else if (bNewStandard) {
//					oSVM.fireSelect({
//						key: oSVM.STANDARDVARIANTKEY
//					});
//				}
//			}
//
		}
	};

	SmartFilterBar.prototype._defaultSelectionVariantHandling = function(oSelectionVariant) {
		var oVariantContent = {},
			oSVM = this._oSmartVariantManagement,
			oStandardFilterData,
			oFilterData;

		if (
			!oSVM ||
			oSVM._sAppStandardVariantKey ||
			!(oSelectionVariant && oSelectionVariant.annotation)
		) {
			return oVariantContent;
		}

		oVariantContent = this.convertSelectionVariantToInternalVariant(oSelectionVariant.annotation);
		if (!oVariantContent) {
			return oVariantContent;
		}

		if (!oSVM.isPageVariant()) {
			oVariantContent.version = "V1";
			oFilterData = JSON.parse(oVariantContent.filterBarVariant);

			if (oSVM._oStandardVariant) {
				oStandardFilterData = JSON.parse(oSVM._oStandardVariant.filterBarVariant);
				if (oStandardFilterData._CUSTOM) {
					oFilterData._CUSTOM = oStandardFilterData._CUSTOM;
					oVariantContent.filterBarVariant = JSON.stringify(oFilterData);
				}
			}
		}

		return oVariantContent;
	};

	SmartFilterBar.prototype._adaptFilterVisibilityProperties = function(oFilterData) {
		var bFound,
			aFilters = [];

		if (
			this._oSmartVariantManagement &&
			this._oSmartVariantManagement._oStandardVariant &&
			this._oSmartVariantManagement._oStandardVariant.filterbar
		) {
			merge(aFilters, this._oSmartVariantManagement._oStandardVariant.filterbar);
		}

		Object.keys(oFilterData).forEach(function (sEntry) {
			bFound = false;
			/* eslint-disable no-loop-func */
			aFilters.some(function(oFilter) {
				if (oFilter.name === sEntry) {
					bFound = true;
					oFilter.partOfCurrentVariant = true;
				}
				return bFound;
			});
			/* eslint-enable no-loop-func */
			if (!bFound) {
				aFilters.push({
					group: this._determineGroupNameByName(sEntry),
					name: sEntry,
					partOfCurrentVariant: true,
					visibleInFilterBar: false,
					visible: true
				});
			}
		}.bind(this));

		return aFilters;

	};

	/**
	 * Returns a selection variant, which is based on odata metadata <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> annotation.
	 * @private
	 * @param {string} sKeyWithPrefix for the variant key.
	 * @returns {object} the variant object.
	 */
	SmartFilterBar.prototype.getSelectionVariant = function(sKeyWithPrefix) {
		var oVariantContent = null, oSelectionVariant = null, sKey = sKeyWithPrefix.substring(SmartFilterBar.SELECTION_VARIANT_KEY_PREFIX.length);

		this.getSelectionVariants().some(function(oItem) {
			if (oItem.qualifier === sKey) {
				oSelectionVariant = oItem;
				return true;
			}

			return false;
		});

		if (oSelectionVariant) {
			if (oSelectionVariant.variantContent) {
				oVariantContent = oSelectionVariant.variantContent;
			} else {
				oVariantContent = this.convertSelectionVariantToInternalVariant(oSelectionVariant.annotation);
				oSelectionVariant.variantContent = oVariantContent;
			}
		}

		return oVariantContent;
	};

	/**
	 * Converts a specific <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> annotation, to the internal variant format.
	 * @private
	 * @param {object} oSelectionVariant the content of a odata metadata selection variant.
	 * @returns {json} the internal variant content.
	 */
	SmartFilterBar.prototype.convertSelectionVariantToInternalVariant = function(oSelectionVariant) {
		var oContent = JSON.parse(JSON.stringify(oSelectionVariant)),
			oVariantContent,
			oPayload,
			oDummyContext,
			oSelectOptions = oContent.SelectOptions,
			oParameters = oContent.Parameters,
			oConverter;

		if (oSelectOptions || oParameters) {
			oDummyContext = new Context(null, "/");
		}

		if (oSelectOptions) {
			oSelectOptions.forEach(function(selectOption) {
				selectOption.PropertyName = selectOption.PropertyName.PropertyPath;
				selectOption.Ranges.forEach(function(range) {
					range.Sign = range.Sign.EnumMember.split("/")[1];
					range.Option = range.Option.EnumMember.split("/")[1];
					// AnnotationHelper can do the conversion
					range.Low = range.Low && AnnotationHelper.format(oDummyContext, range.Low) || null;
					range.High = range.High && AnnotationHelper.format(oDummyContext, range.High) || null;
				});
			});
		}

		if (oParameters) {
			oParameters.forEach(function(parameter) {
				parameter.PropertyName = parameter.PropertyName.PropertyPath.split("/")[1] || parameter.PropertyName.PropertyPath;
				parameter.PropertyValue = AnnotationHelper.format(oDummyContext, parameter.PropertyValue) || null;
			});
		}

		oConverter = new VariantConverterFrom();
		oVariantContent = oConverter.convert(JSON.stringify(oContent), this, true);
		oPayload = JSON.parse(oVariantContent.payload);

		oVariantContent = {
			"version": "V2", // V2 merges aka delta logic, V1 overwrites
			"filterbar": this._adaptFilterVisibilityProperties(oPayload),
			"filterBarVariant": JSON.stringify(oPayload)
		};

		return oVariantContent;
	};

	/**
	 * Returns an instance of the control for the basic search.
	 * @returns {object} Basic search control
	 * @public
	 */
	SmartFilterBar.prototype.getBasicSearchControl = function() {
		return sap.ui.getCore().byId(this.getBasicSearch());
	};

	/**
	 * Searches for the filter field having the specified OData key and adds this filter field to the advanced area. If there is no corresponding
	 * field in the OData metadata, this method has no effect.
	 * @param {string} sKey The key like specified in the OData metadata
	 * @public
	 */
	SmartFilterBar.prototype.addFieldToAdvancedArea = function(sKey) {
		var oFilterItem;

		this._logAccessWhenNotInitialized("addFieldToAdvancedArea");

		oFilterItem = this._getFilterItemByName(sKey);
		if (oFilterItem && oFilterItem.setVisibleInAdvancedArea) {
			oFilterItem.setVisibleInAdvancedArea(true);
		}
	};

	/**
	 * Handles change in the customData of custom controls
	 *
	 * @param {object} oEvent object
	 * @private
	 */
	SmartFilterBar.prototype._onCustomFieldCustomDataChange = function (oEvent) {
		var vNewValue = oEvent.getParameter("newValue"),
			vOldValue = oEvent.getParameter("oldValue"),
			sParamName = oEvent.getParameter("name");

		if (vOldValue !== vNewValue && sParamName === "value") {
			this._updateToolbarText();
		}
	};

	/**
	 * Attaches to the _change event of custom data with key 'hasValue'
	 *
	 * @param {array} aCustomData custom data
	 * @private
	 */
	SmartFilterBar.prototype._attachCustomControlCustomDataChange = function (aCustomData) {
		var oCustomData,
			i;

		for (i = 0; i < aCustomData.length; i++) {
			oCustomData = aCustomData[i];
			if (oCustomData.getKey() === "hasValue") {
				oCustomData.attachEvent("_change", this._onCustomFieldCustomDataChange, this);
				break;
			}
		}
	};

	SmartFilterBar.prototype.getConditionTypeByKey = function(sKey) {
		if (this._oFilterProvider && this._oFilterProvider._mConditionTypeFields[sKey]) {
			return this._oFilterProvider._mConditionTypeFields[sKey].conditionType;
		}

		if (this._oFilterProvider && sKey.indexOf(Analitical_Parameter_Prefix) === -1 && this._oFilterProvider._mConditionTypeFields[Analitical_Parameter_Prefix + sKey]) {
			return this._oFilterProvider._mConditionTypeFields[Analitical_Parameter_Prefix + sKey].conditionType;
		}
	};

	/**
	 * Returns the condition type object (if any) with the specified key (Property name in OData entity). Use just the property name as the
	 * key when getting a control from the basic area.
	 * @param {string} sKey The key as present in the OData property name/control configuration
	 * @returns {object} returns Promise with condition type object
	 * @protected
	 */
	SmartFilterBar.prototype.getDateRangeTypeByKey = function(sKey) {
		return this.getInitializedPromise().then(function () {
			if (this._oFilterProvider._mConditionTypeFields[sKey]) {
				return this._oFilterProvider._mConditionTypeFields[sKey].conditionType;
			}

			if (sKey.indexOf(Analitical_Parameter_Prefix) === -1 && this._oFilterProvider._mConditionTypeFields[Analitical_Parameter_Prefix + sKey]) {
				return this._oFilterProvider._mConditionTypeFields[Analitical_Parameter_Prefix + sKey].conditionType;
			}
		}.bind(this));
	};

	/**
	 * Sets the the Dynamic Date Option of condition type (if any) data in the filter data model.
	 * @param {string} sKey The key as present in the OData property name/control configuration
	 * @param {string} sOption The key of Dynamic Date Option
	 * @return {object} returns Promise
	 * @protected
	 */
	SmartFilterBar.prototype.setDateRangeTypeOperationByKey = function(sKey, sOption) {
		return this.getDateRangeTypeByKey(sKey).then(function (oConditionType) {
				if (oConditionType && typeof (oConditionType.setOperation) === "function") {
					oConditionType.setOperation(sOption);
				}
		});
	};

	/**
	 * Determines if the custom data 'dateFormatSettings' is set with UTC mode <code>true</code>
	 * @returns {boolean} returns whether the filter bar is running in UTC mode
	 * @protected
	 */
	SmartFilterBar.prototype.isInUTCMode = function() {
		if (this._oFilterProvider && this._oFilterProvider._oDateFormatSettings) {
			return this._oFilterProvider._oDateFormatSettings.UTC;
		}

		return false;
	};

	/**
	 * Checks whether the control is initialised
	 * @returns {boolean} returns whether control is already initialised
	 * @protected
	 */
	SmartFilterBar.prototype.isInitialised = function() {
		return !!this.bIsInitialised;
	};

	/*
	 * @private,
	 * @ui5-restricted sap.suite.ui.generic.template.AnalyticalListPage.control.SmartFilterBarExt
	 */
	SmartFilterBar.prototype.associateValueLists = function() {
		if (this.getSuppressValueListsAssociation() && this._oFilterProvider) {
			this._oFilterProvider._fireEvent(FilterProviderUtils.ASSOCIATE_VALUE_LISTS);
			this._oFilterProvider._bSuppressValueListsAssociation = false;
			this._valueListAnnotationsLoaded();

			if (typeof this._enhanceFilterItemsWithTextOnValueListAssociation === "function") {
				this._enhanceFilterItemsWithTextOnValueListAssociation();
			}
		}
	};

	/**
	 * Iterates over controls and adds event delegate on after rendering that invokes refreshing of filters count
	 *
	 * @private
	 */
	SmartFilterBar.prototype._refreshFiltersCountOnValueListAnnotationLoaded = function () {
		for (var i = 0; i < this._oFilterProvider._aFilterBarDropdownFieldMetadata.length; i++) {
			var oControl = this._oFilterProvider._aFilterBarDropdownFieldMetadata[i].control;
			if (oControl && oControl.isA("sap.m.ComboBox")) {
				oControl.addEventDelegate({
					onAfterRendering: function() {
						this.refreshFiltersCount();
					}.bind(this)
				});
			}
		}
	};

	/**
	 * @override
	 */
	SmartFilterBar.prototype._enhanceFilterItemsWithTextValue = function (oValueTexts, oSelectionVariant) {
		// If value list association is suppressed we store the function execution so we can execute it later
		// when this.associateValueLists is called.
		if (
			!this._enhanceFilterItemsWithTextOnValueListAssociation &&
			this.getSuppressValueListsAssociation()
		) {
			this._enhanceFilterItemsWithTextOnValueListAssociation = function () {
				// We retrieve texts only for the current state when the method is executed
				var oUiState = this.getUiState();
				FilterBar.prototype._enhanceFilterItemsWithTextValue.call(this,
					oUiState.getValueTexts(),
					oUiState.getSelectionVariant()
				);
			}.bind(this);
		} else {
			FilterBar.prototype._enhanceFilterItemsWithTextValue.apply(this, arguments);
		}
	};

	/**
	 * Extended FilterBar function <code>_createVisibleFilters</code> to fire <code>valueListAnnotationLoaded</code> correctly.
	 * @private
	 */
	SmartFilterBar.prototype._createVisibleFilters = function() {
		FilterBar.prototype._createVisibleFilters.apply(this, arguments);
		// We need to prevent firing of the event twice
		// from both SmartFilterBar.prototype.associateValueLists and SmartFilterBar.prototype._createVisibleFilters
		if (!this.getSuppressValueListsAssociation() && this._oFilterProvider){
			this._valueListAnnotationsLoaded();
		}
		this._setInitialFocus();
	};

	/**
	 *	Fires event on value list annotation loaded and then refreshes filter count
	 *
	 * @returns {Promise}
	 * @private
	 */
	SmartFilterBar.prototype._valueListAnnotationsLoaded = function () {
		return this._fireValueListAnnotationLoaded().then(this._refreshFiltersCountOnValueListAnnotationLoaded.bind(this));
	};

	/**
	 * @param {object} oData An object that will be passed to the handler along with the event object when the event is fired
	 * @param {function} fnFunction The handler function to call when the event occurs.
	 * @param {object} oListener The object that wants to be notified when the event occurs
	 * @private
	 * @ui5-restricted sap.suite.ui.generic.template.AnalyticalListPage.control.SmartFilterBarExt
	 */
	SmartFilterBar.prototype._attachValueListAnnotationLoaded = function(oData, fnFunction, oListener) {
		this.attachEvent("valueListAnnotationLoaded", oData, fnFunction, oListener);
	};

	SmartFilterBar.prototype._fireValueListAnnotationLoaded = function(oParameters) {
		var aFilterAnnotations = (this._oFilterProvider && Array.isArray(this._oFilterProvider.aFilterAnnotations)) ? this._oFilterProvider.aFilterAnnotations : [];

		return Promise.all(aFilterAnnotations).then(function(){
			this.fireEvent("valueListAnnotationLoaded", oParameters);
		}.bind(this));
	};

	/*
	 * This getter should be overwritten if a class such as sap.suite.ui.generic.template.AnalyticalListPage.control.SmartFilterBarExt that extends SmartFilterBar
	 * explicitly needs to handle the ValueLists association in the advanced area.
	 * If the getter returns <code>true</code>, the data requests to the backend service will be delayed until
	 * {@link sap.ui.comp.smartfilterbar.SmartFilterBar#associateValueLists} gets invoked.
	 * The ValueLists that are not initially visible don't need to be explicitly handled. They load their data when added to the advanced area.
	 * sap.suite.ui.generic.template.AnalyticalListPage.control.SmartFilterBarExt.
	 * @private,
	 * @ui5-restricted sap.suite.ui.generic.template.AnalyticalListPage.control.SmartFilterBarExt
	 */
	SmartFilterBar.prototype.getSuppressValueListsAssociation = function() {
		return false;
	};

	/**
	 * Sets the _CUSTOM data in the filter data model. The filterChange event is not triggered.
	 * @param {object} oJson The JSON data in the filter bar
	 * @return  void
	 * @private
	 * @ui5-restricted Fiori Elements
	 */
	SmartFilterBar.prototype.setCustomFilterData = function(oJson) {
		if (this._oFilterProvider && this._oFilterProvider.getModel()) {
			this._oFilterProvider.getModel().setProperty("/" + FilterProviderUtils.CUSTOM_FIELDS_MODEL_PROPERTY, oJson);
		}
	};

	/**
	 * Returns the _CUSTOM data currently set in the filter data model.
	 * @return  {object} The _CUSTOM JSON data in the filter bar
	 * @private
	 * @ui5-restricted Fiori Elements
	 */
	SmartFilterBar.prototype.getCustomFilterData = function() {
		if (this._oFilterProvider && this._oFilterProvider.getModel()) {
			return this._oFilterProvider.getModel().getProperty("/" + FilterProviderUtils.CUSTOM_FIELDS_MODEL_PROPERTY);
		}
	};

	/**
	 * Recalculates the filters count and updates their number in the UI. The {@link sap.ui.comp.filterbar.FilterBar#AssignedFiltersChanged} event will be triggered.
	 *
	 * @private
	 * @returns {Promise}
	 * @ui5-restricted Fiori Elements
	 */
	SmartFilterBar.prototype.refreshFiltersCount = function() {
		return Promise.all(this._oFilterProvider._getCurrentValidationPromises()).then(function () {
			return this._updateToolbarText();
		}.bind(this));
	};

	/**
	 *
	 * Returns if some <code>DateRangeType</code> field has a value.
	 *
	 * @private
	 * @returns {Promise}
	 * @ui5-restricted Fiori Elements
	 */
	SmartFilterBar.prototype.hasDateRangeTypeFieldsWithValue = function () {
		var oFilterProvider = this._oFilterProvider,
			oFilterData = this.getFilterData(),
			bResult = Object.keys(oFilterProvider._mConditionTypeFields).some(function (sConditionFieldName) {
				return !!oFilterData[sConditionFieldName];
			});

		return this.getInitializedPromise().then(function () {
			return bResult;
		});
	};

	SmartFilterBar.prototype.destroy = function() {
		this._clearDelayedSearch();

		if (this._oFilterProvider && this._oFilterProvider.destroy) {
			this._oFilterProvider.destroy();
		}
		this._oFilterProvider = null;

		if (this._oSmartVariantManagement && this.getConsiderSelectionVariants()) {
			this._oSmartVariantManagement.unregisterSelectionVariantHandler(this);
		}

		FilterBar.prototype.destroy.apply(this, arguments);

		sap.ui.getCore().getMessageManager().unregisterObject(this);

		this._oObservers.forEach(function (oObserver) {
			oObserver.disconnect();
			oObserver.destroy();
		});

		this._aFilterBarViewMetadata = null;
		this._oFilterBarViewMetadataExtend = null;
		this._bExpandAdvancedFilterArea = null;
		this._oResourceBundle = null;
		this._sMandatoryErrorMessage = null;
		this._sValidationErrorMessage = null;

		this._oSmartVariantManagement = null;
	};

	return SmartFilterBar;

});
