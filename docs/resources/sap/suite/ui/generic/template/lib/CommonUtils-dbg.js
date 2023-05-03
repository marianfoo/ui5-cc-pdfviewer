sap.ui.define(["sap/ui/base/Object",
	"sap/ui/base/Event",
	"sap/ui/core/mvc/ControllerExtension",
	"sap/ui/model/Context",
	"sap/ui/model/Filter",
	"sap/m/Table",
	"sap/m/MessageBox",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/ui/generic/app/navigation/service/NavError",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/genericUtilities/metadataAnalyser",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/ui/model/analytics/odata4analytics",
	"sap/base/util/extend",
	"sap/base/util/deepExtend",
	"sap/suite/ui/generic/template/genericUtilities/FeError",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/genericUtilities/ControlStateWrapperFactory",
	"sap/suite/ui/generic/template/genericUtilities/oDataModelHelper",
	"sap/ui/core/IconPool"
], function(BaseObject, Event, ControllerExtension, Context, Filter, ResponsiveTable, MessageBox, SelectionVariant, NavError, controlHelper, metadataAnalyser,
			testableHelper, FeLogger, odata4analytics, extend, deepExtend, FeError, StableIdHelper, ControlStateWrapperFactory, oDataModelHelper, IconPool) {
	"use strict";
	var	sClassName = "lib.CommonUtils";

	var oCore = sap.ui.getCore();
	var oLogger = new FeLogger(sClassName).getLogger();

	function getMethods(oController, oServices, oComponentUtils) {

		var oNavigationHandler; // initialized on demand

		var oControlStateWrapperFactory = new ControlStateWrapperFactory(oController);

		// This map stores the buttons' ID, type and action. It is read from OverflowToolbar's custom data.
		// It is mapped with the ID of the smart chart or smart table
		var mOverflowToolbarCustomData = Object.create(null);

		/**
		 * Pre-loads a map of all overflow toolbars and their custom data
		 */
		function fnPopulateActionButtonsCustomData(oControl) {
			var oToolbar;

			if (controlHelper.isSmartTable(oControl)) {
				oToolbar = oControl.getCustomToolbar();
			} else if (controlHelper.isSmartChart(oControl)) {
				oToolbar = oControl.getToolbar();
			}

			if (oToolbar) {
				var mCustomData = getElementCustomData(oToolbar);
				if (mCustomData && mCustomData.annotatedActionIds) {
					mOverflowToolbarCustomData[oControl.getId()] = JSON.parse(atob(mCustomData.annotatedActionIds));
				}
				if (mCustomData && mCustomData.deleteButtonId) {
					mOverflowToolbarCustomData[oControl.getId()].push({
						ID: mCustomData.deleteButtonId,
						RecordType: "CRUDActionDelete"
					});
				}
				if (mCustomData && mCustomData.multiEditButtonId) {
					mOverflowToolbarCustomData[oControl.getId()].push({
						ID: mCustomData.multiEditButtonId,
						RecordType: "CRUDActionMultiEdit"
					});
				}
			}
		}

		/**
		 * Get toolbar customData by Id
		 * @private
		 */
		function fnGetToolbarCustomData(oControl) {
			var sControlId = oControl.getId();
			if (!mOverflowToolbarCustomData[sControlId]) {
				fnPopulateActionButtonsCustomData(oControl);
			}
			return mOverflowToolbarCustomData[sControlId] || [];
		}

		function getMetaModelEntityType(sEntitySet) {
			var oMetaModel, oEntitySet, oEntityType;
			oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();
			oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			return oEntityType;
		}

		// defines a dependency from oControl to the view
		function fnAttachControlToView(oControl) {
		    oServices.oApplication.attachControlToParent(oControl, oController.getView());
		}

		// aElementIds is an array of element ids.
		// The function returns the first of the given ids which identifies an element that this view can scroll to.
		// Therefore, the element must fulfill the following conditions
		// 1.It is placed on this view
		// 2. It is visible
		// If no such id exists a faulty value is returned.
		// onElementVisited is an optional function. It will be called several times while traversing the control tree upwards from the controls specified in aElementIds.
		// Two parameters will be passed to this function: First parameters is the memeber of aElementIds currently investigated, second is the predecessor control currently analyzed.
		function getPositionableControlId(aElementIds, bPreferNonTables, onElementVisited){
			var sFallBack = "";
			var oView = oController.getView();
			var sRet = aElementIds.find(function(sElementId){
				var oChild;
				var fnCallback = onElementVisited && function(oControl){
					onElementVisited(sElementId, oControl, oChild);
					oChild = oControl;
				};
				if (controlHelper.isElementVisibleOnView(sElementId, oView, fnCallback)){
					if (bPreferNonTables){
						var oControl = oCore.byId(sElementId);
						if (controlHelper.isTable(oControl)){
							sFallBack = sFallBack || sElementId;
							return false;
						}
					}
					return true;
				}
			});
			return sRet || sFallBack;
		}

		// See documentation of
		// sap.suite.ui.generic.template.lib.CommonUtils.prototype.getSelectedContexts.getDialogFragment below
		function getDialogFragment(sName, oFragmentController, sModel, fnOnFragmentCreated) {
		    return oServices.oApplication.getDialogFragmentForView(oController.getView(), sName, oFragmentController, sModel, fnOnFragmentCreated);
		}

		// sap.suite.ui.generic.template.lib.CommonUtils.prototype.getSelectedContexts.getDialogFragment below
		function getDialogFragmentAsync(sName, oFragmentController, sModel, fnOnFragmentCreated, bAlwaysGetNew) {
		    return oServices.oApplication.getDialogFragmentForViewAsync(oController.getView(), sName, oFragmentController, sModel, fnOnFragmentCreated, bAlwaysGetNew);
		}

		var oResourceBundle; // initialized on first use
		function getText(sKey, aArguments, bIgnoreKeyFallback) {
			var oComponent = oController.getOwnerComponent();
			oResourceBundle = oResourceBundle || oComponent.getModel("i18n").getResourceBundle();
			// with  bIgnoreKeyFallback =true, resourceBundle does not write a console error and returns undefined instead of the key, if the text doesn't exist
			// currently only used for the texts that can be overridden more specific than per page in getContextText
			return oResourceBundle.getText(sKey, aArguments, bIgnoreKeyFallback);
		}

		// Get the specialized text is used to override the i18n text which is set by application devloper or else it will return generic text provided by framework
		// - Key: key of the text which could be overridden by Application developer.
		// - sSpecificKey: It is a key which in some way identifies the specialized text Like Property name of the control.
		// - sFrameworkKey: Optional. Key of the Framework text. Specify only in case it is different from the sKey
		// - aParameters: Optional. Array of parameters which needs to be replaced in the text place holders
		function getSpecializedText(sKey, sSpecificKey, sFrameworkKey, aParameters) {

			var sFallbackKey = sFrameworkKey || sKey,
				sContextKey = sSpecificKey && sSpecificKey != '|' ? sKey + "|" + sSpecificKey : sFallbackKey;

			// try to read specific text with bIgnoreKeyFallback =true to avoid console error if it does not exist
			var sText = getText(sContextKey, aParameters, true);

			if (!sText && sContextKey != sFallbackKey) {
				//getText method will return the key passed as argument as result in case it doesn't find the text.
				//In case of missing context based text, try to retrieve the framework text.
				// generic text should always exist (if not overridden by application, default provided by us)
				sText = getText(sFallbackKey, aParameters);
			}

			return sText;
		}

		//Get the text context specific overridden text, in case of not existing try to get the text with the
		//framework key. Method should be used when there is a possibility of overriding text based on the context Stable ID
		// - sKey: key of the text which could be overridden by Application developer.
		// - sSmartControlId: Stable ID of smart control for which context specific text needs to be found (<View ID>--<Local ID>)
		// - sFrameworkKey - Optional. Key of the Framework text. Specify only in case it is different from the sKey
		// - aParameters - Optional. Array of parameters which needs to be replaced in the text place holders
		function getContextText(sKey, sSmartControlId, sFrameworkKey, aParameters) {

			/* 	Smart Template ID logic ensures that <View ID> is generated by <APP ID>::<Floorplan>::<Entity Set>
				Context ID format should be "<EntitySet>|<Local ID*>"
				<Local ID*> = Omit the last part of the Local ID after :: then replace all :: & -- by |.
				For an example sSmartControlId is "STTA_MP::sap.suite.ui.generic.template.ObjectPage.view.Details::STTA_C_MP_Product--to_ProductText::com.sap.vocabularies.UI.v1.LineItem::Table"
				App ID = STTA_MP
				Floorplan = sap.suite.ui.generic.template.ObjectPage.view.Details
				EntitySet = STTA_C_MP_Product
				Local ID = to_ProductText::com.sap.vocabularies.UI.v1.LineItem::Table
				Context ID = "STTA_C_MP_Product|to_ProductText|com.sap.vocabularies.UI.v1.LineItem" */
			var oComponent = oController.getOwnerComponent();
			var iEntitySetName = sSmartControlId.indexOf("::" + oComponent.getEntitySet() + "--") + 2; //Ensure only Entity set is picked up for processing
			var sId = sSmartControlId.substring(iEntitySetName, sSmartControlId.lastIndexOf("::")),
				sId = sId.replace(/--/g, "|").replace(/::/g, "|"); //sId = "STTA_C_MP_Product|to_ProductText|com.sap.vocabularies.UI.v1.LineItem"

			return getSpecializedText(sKey, sId, sFrameworkKey, aParameters);
		}

		// This functions intends to give selection from different selection behavior
		function getSelectionPoints(oInnerChart, sSelectionBehavior) {
			var sSelectionBehavior = sSelectionBehavior || oInnerChart.getSelectionBehavior();
			if (sSelectionBehavior === "DATAPOINT") {
				return {
					"dataPoints": oInnerChart.getSelectedDataPoints().dataPoints,
					"count": oInnerChart.getSelectedDataPoints().count
				};
			} else if (sSelectionBehavior === "CATEGORY") {
				return {
					"dataPoints": oInnerChart.getSelectedCategories().categories,
					"count": oInnerChart.getSelectedCategories().count
				};
			} else if (sSelectionBehavior === "SERIES") {
				return {
					"dataPoints": oInnerChart.getSelectedSeries().series,
					"count": oInnerChart.getSelectedSeries().count
				};
			}
		}

		function getElementCustomData(oElement) {
			var oCustomData = {};
			if (oElement instanceof sap.ui.core.Element) {
				oElement.getCustomData().forEach(function(oCustomDataElement) {
					oCustomData[oCustomDataElement.getKey()] = oCustomDataElement.getValue();
				});
			}
			return oCustomData;
		}

		/*
		 * Sets the enabled value for Toolbar buttons
		 * @param {object} oSubControl
		 */
		function fnSetEnabledToolbarButtons (oSubControl) {
			var aToolbarControlsData, oToolbarControlData;
			var oControl = getOwnerControl(oSubControl);  // look for parent table or chart
			if (!controlHelper.isSmartTable(oControl) && !controlHelper.isSmartChart(oControl)) {
				oControl = oControl.getParent();
			}
			var aContexts = oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oControl).getSelectedContexts();
			var oModel = oControl.getModel();

			// Handle custom action buttons (added in manifest)
			fnFillEnabledMapForBreakoutActions(aContexts, oModel, oControl);

			// Handle annotated action buttons
			aToolbarControlsData = fnGetToolbarCustomData(oControl);
			for (var i = 0; i < aToolbarControlsData.length; i++) {
				oToolbarControlData = aToolbarControlsData[i];
				fnHandleToolbarButtonsEnablement(oToolbarControlData, oModel, aContexts, oControl);
			}
		}

		function fnHandleToolbarButtonsEnablement (oToolbarControlData, oModel, aContexts, oControl) {
			var oEnabledPromise;
			// 1. Type = "CRUDActionDelete" -> Delete button
			// 2. Type = "com.sap.vocabularies.UI.v1.DataFieldForAction" or "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" -> Annotated Action button
			// 3. Type = "CRUDActionMultiEdit" -> Edit button
			// Other cases are not possible:
			// oToolBarControlData is extracted in fnPopulateActionButtonsCustomData from custom data of the toolbar. It's encapsulated in AnnotationHelper buildActionButtonsCustomData
			// using generateAnnotatedActionCustomData which treats DataFieldForAction and DataFieldForIntentBasedNavigation.
			// CRUDActionDelete and CRUDActionMultiEdit are added directly in fnPopulateActionButtonsCustomData.
			if (oToolbarControlData.RecordType === "CRUDActionDelete") {
				var bEnabled = fnShouldDeleteButtonGetEnabled(oModel, aContexts, oControl);
				// ListReport uses a special property for delete button
				oComponentUtils.getTemplatePrivateModel().setProperty("/listReport/deleteEnabled", bEnabled);
				// but ObjectPage uses the generic/controlProperties
				oEnabledPromise = Promise.resolve(bEnabled);
			} else if (oToolbarControlData.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oToolbarControlData.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
				var oMetaModel = oModel.getMetaModel();
				oEnabledPromise = fnShouldAnnotatedActionButtonGetEnabled(oModel, oMetaModel, aContexts, oToolbarControlData.RecordType, oToolbarControlData.Action, oControl);
			} else if (oToolbarControlData.RecordType === "CRUDActionMultiEdit") {
				oComponentUtils.getTemplatePrivateModel().setProperty("/listReport/multiEditEnabled", aContexts.filter(fnIsContextEditable).length > 0);
			}
			// check if "enabled" is bound to the path '/generic/controlProperties/' in the model - otherwise it's bound to another path or has a hard coded true/false
			var oButtonId = oController.getView().byId(oToolbarControlData.ID);
			if (oButtonId && /generic\/controlProperties/.test(oButtonId.getBindingPath("enabled"))) {
				oEnabledPromise.then(fnSetPrivateModelControlProperty.bind(null, oToolbarControlData.ID, "enabled"));
			}
		}

		function fnSetEnabledFooterButtons (oEventSource) {
			var oSmartControl = fnGetOwnerPresentationControl(oEventSource);
			fnFillEnabledMapForBreakoutActions(oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartControl).getSelectedContexts(), oEventSource.getModel(), oSmartControl);
		}

		/*
		 * Updates the private model control property
		 * @param {string} sId - the id of the button in the private model
		 * @param {string} sProperty - the name of the property in the private model
		 * @param {string} sValue - the value of the property
		 */
		function fnSetPrivateModelControlProperty (sId, sProperty, sValue) {
			var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
			var mModelProperty = oTemplatePrivateModel.getProperty("/generic/controlProperties/" + sId);
			// check if the id exists in the model
			if (!mModelProperty) {
				mModelProperty = {};
				mModelProperty[sProperty] = sValue;
				oTemplatePrivateModel.setProperty("/generic/controlProperties/" + sId, mModelProperty);
			} else {
				oTemplatePrivateModel.setProperty("/generic/controlProperties/" + sId + "/" + sProperty, sValue);
			}
		}

		/*
		 * Determines whether an Annotated Action should be enabled or disabled
		 * @returns  {Promise<boolean>}
		 * @private
		 */
		function fnShouldAnnotatedActionButtonGetEnabled (oModel, oMetaModel, aContexts, sType, sAction, oControl) {
			var mFunctionImport, mData, sActionFor, sApplicablePath;
			// In most cases, the result can be determined synchronously. In these cases, the flag bEnabled is used and a
			// Promise already resolved is returned.
			// Only exception is the SmartChart for DataFieldForIntentBasedNavigation - here the result can only be determined after the
			// inner chart is initialized
			var bEnabled = false;

			if (sType === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
				mFunctionImport = oMetaModel.getODataFunctionImport(sAction);
				sActionFor = mFunctionImport && mFunctionImport["sap:action-for"];
				// check if 'sap:action-for' is defined
				if (sActionFor && sActionFor !== "" && sActionFor !== " ") {
					if (aContexts.length > 0) {
						sApplicablePath = mFunctionImport["sap:applicable-path"];
						// check if 'sap:applicable-path' is defined
						if (sApplicablePath && sApplicablePath !== "" && sApplicablePath !== " ") {
							for (var j = 0; j < aContexts.length; j++) {
								if (!aContexts[j] || aContexts[j].isTransient()) {
									continue;
								}
								mData = oModel.getObject(aContexts[j].getPath()); // get the data
								if (mData && mData[sApplicablePath]) {
									bEnabled = true;  //  'sap:action-for' defined, 'sap:applicable-path' defined, 'sap-applicable-path' value is true, more than 1 selection -> enable button
									break;
								}
							}
						} else {
							bEnabled = true; // 'sap:action-for' defined, 'sap:applicable-path' not defined, more than 1 selection -> enable button
						}
					}
				} else {
					bEnabled = true; // 'sap:action-for' not defined, no selection required -> enable button
				}
			} else if (sType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") { // to enable UI.DataFieldForIntentBasedNavigation action button at least one selection is required
				// enable the button to true if any chart selection is made or any drill down is performed with some selections already being present
				if (fnFilterActiveContexts(aContexts).length > 0 ){
					bEnabled = true;
				} else if (controlHelper.isSmartChart(oControl)){
					// in case of a SmartChart we can check the required condition only asynchronously after the chart is initialized
					return oControl.getChartAsync().then(function(){
						return oControl.getDrillStackFilters().length > 0;
					});
				}
			}

			return Promise.resolve(bEnabled);
		}

		/*
		 * Determines whether the Delete button should be enabled or disabled
		 * @private
		 */
		function fnShouldDeleteButtonGetEnabled (oModel, aContexts, oControl) {
			if (aContexts.length === 0){ // if nothing is selected the delete button should be disabled
				return false;
			}

			// Get the DeleteRestrictions for the entity set
			var mDeleteRestrictions = fnGetDeleteRestrictions(oControl);
			var sDeletablePath = mDeleteRestrictions && mDeleteRestrictions.Deletable && mDeleteRestrictions.Deletable.Path;
			return aContexts.some(function(oContext) {
				var oDraftAdministrativeData = oModel.getObject(oContext.getPath() + "/DraftAdministrativeData");
				var bIsObjectNotLocked = !(oDraftAdministrativeData && oDraftAdministrativeData.InProcessByUser && !oDraftAdministrativeData.DraftIsProcessedByMe);
				/*
				 * The object is deletable if
				 * 	1. it is not locked and
				 *  2. the context is not transient and
				 *	3. we do not have a deleteable path that disallows the deletion of that object
				 */
				return bIsObjectNotLocked && !oContext.isTransient() && !(sDeletablePath && !oModel.getProperty(sDeletablePath, oContext));
			});
		}

		/*
		 * Returns the Deletable Restrictions
		 * @param {object} oControl - must be of a Smart Control (e.g. SmartTable, SmartChart)
		 */
		function fnGetDeleteRestrictions(oControl) {
			var oMetaModel = oControl.getModel() && oControl.getModel().getMetaModel();
			var mEntitySet = oMetaModel && oMetaModel.getODataEntitySet(oControl.getEntitySet());
			var mDeleteRestrictions = mEntitySet && mEntitySet["Org.OData.Capabilities.V1.DeleteRestrictions"];
			return mDeleteRestrictions;
		}

		/*
		 * Determines whether a context is editable through LR dialog or not.
		 * Context is editable through LR dialog only if it is active, OP(FCL two column mode) is not in edit mode and have no updateRestrictions
		 */
		function fnIsContextEditable(oContext) {
			var oModel = oContext.getModel();
			var oDraftAdministrativeData = oModel.getObject(oContext.getPath() + "/DraftAdministrativeData");
			var oContextInfo = oDataModelHelper.analyseContext(oContext);
			var bIsOPinEditMode = oServices.oApplication.isObjectInEditMode(oContextInfo.entitySet, oContextInfo.key);
			// Check if draft exists and OP is in edit mode
			if (!oDraftAdministrativeData && !bIsOPinEditMode) {
				// Check the UpdateRestrictions for the entity set
				var oEntitySet = oModel.getMetaModel().getODataEntitySet(oDataModelHelper.analyseContext(oContext).entitySet);
				var oUpdateInfo = oEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"] && oEntitySet["Org.OData.Capabilities.V1.UpdateRestrictions"].Updatable;
				if (oUpdateInfo) {
					if (oUpdateInfo.Path) {
						return !!oModel.getProperty(oUpdateInfo.Path, oContext);
					} else if (oUpdateInfo.Bool !== "false") {
						return true;
					}
				} else {
					return true;
				}
			}
		}

		/*
		* Update map /generic/listCommons/breakoutActionsEnabled from selected context,
		* considering the applicable path and action-for
		*/
		function fnFillEnabledMapForBreakoutActions(aContexts, oModel, oControl) {
			var oBreakoutActions = fnGetBreakoutActions(oControl);
			var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
			var oBreakOutActionEnabled = oTemplatePrivateModel.getProperty("/generic/listCommons/breakoutActionsEnabled");
			if (oBreakoutActions) {
				var oIconTabBar = oController.byId("template::IconTabBar");
				var sSelectedTabKey = "";
				if (oIconTabBar) {
					sSelectedTabKey = oIconTabBar.getSelectedKey();
				}
				fnUpdateBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions, aContexts, oModel, sSelectedTabKey, oControl);
			}
			oTemplatePrivateModel.setProperty("/generic/listCommons/breakoutActionsEnabled", oBreakOutActionEnabled);
		}

		function fnUpdateBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions, aContexts, oModel, sSelectedTabKey, oControl) {
			var bEnabled;
			for (var sActionId in oBreakoutActions) {
				bEnabled = true;
				var sControlId = oBreakoutActions[sActionId].id + ((sSelectedTabKey && !oBreakoutActions[sActionId].determining) ? "-" + sSelectedTabKey : "");
				if (oControl && oControl.getId().indexOf("AnalyticalListPage") > -1) {
					bEnabled = !!oBreakOutActionEnabled[sControlId].enabled;
				}
				if (oBreakoutActions[sActionId].requiresSelection) {
					if (aContexts.length > 0) { // context selected
						if (oControl && controlHelper.isSmartChart(oControl)) {
							if (oBreakoutActions[sActionId].filter === "chart") {
								bEnabled = true;
							}
						} else if (oControl && controlHelper.isSmartTable(oControl)) {
							if (oBreakoutActions[sActionId].filter !== "chart") {
								bEnabled = true;
							}
						}
						if (oBreakoutActions[sActionId].applicablePath !== undefined && oBreakoutActions[sActionId].applicablePath !== "") {
							// loop on all selected contexts: at least one must be selected with applicablePath = true
							bEnabled = false;
							for (var iContext = 0; iContext < aContexts.length; iContext++) {
								// check if applicablePath is true
								var sNavigationPath = "";
								var aPaths = oBreakoutActions[sActionId].applicablePath.split("/");
								if (aPaths.length > 1) {
									for (var iPathIndex = 0; iPathIndex < aPaths.length - 1; iPathIndex++) {
										sNavigationPath +=  "/" + aPaths[iPathIndex];
									}
								}
								var oObject = oModel.getObject(aContexts[iContext].getPath() + sNavigationPath);
								var sApplicablePath = aPaths[aPaths.length - 1];
								if (oObject[sApplicablePath] === true) {
									bEnabled = true;
									break;
								}
							}
						}
					} else if (controlHelper.isSmartChart(oControl)) {
						//table btuuon chart ondata received
						if ((oControl.getId().indexOf("AnalyticalListPage") > -1 ? oBreakoutActions[sActionId].filter === "chart" : true)) {
							if (oControl.getDrillStackFilters().length > 0) {
								//Selection is made on the chart but drilldown is performed later.
								bEnabled = true;
							} else { //chart deselect
								bEnabled = false;
							}
						}
					} else {
						// requiresSelection is defined, but no row is selected
						if (oBreakoutActions[sActionId].filter !== "chart") { //table ondatareceived when chart selected
							bEnabled = false;
						}
					}
				}
				oBreakOutActionEnabled[sControlId] = {
						enabled: bEnabled
				};
			}
		}

		/*
		 * Returns the names of all relevant breakout actions. Only actions for the current component and the current section (if applicable) are returned.
		 */
		function fnGetBreakoutActions(oControl) {
			// oControl must be SmartTable or SmartChart!
			var oExtensions = oComponentUtils.getControllerExtensions();

			var sSectionId = getElementCustomData(oControl).sectionId;
			if (!sSectionId){
				// actions related to the page
				return oExtensions && oExtensions["Actions"];
			} else {
				// actions related to one section
				return oExtensions && oExtensions.Sections && oExtensions.Sections[sSectionId] && oExtensions.Sections[sSectionId].Actions;
			}
		}

		/*
		 * Returns an ancestoral table/chart/list of the given element or null
		 *
		 * @param {sap.ui.core.Element} oSourceControl The element where to start searching for a ancestoral table/chart/list
		 * @returns {sap.ui.table.Table|sap.m.Table|sap.ui.comp.smarttable.SmartTable|sap.ui.comp.smartchart.SmartChart|sap.ui.comp.smartlist.SmartList} The ancestoral table/chart or null
		 * @public
		 */
		function getOwnerControl(oSourceControl){
			/* TODO: Seems that all callers of this method has to build a workaround to check if its smart control or its inner control.
			   A new method fnGetOwnerPresentationControl has been introduced which only returns the smart control instance. It should be checked
			   to see if all callers of this method can be adapted to use the new method.  */
			var oCurrentControl = oSourceControl;
			while (oCurrentControl) {
				if (oCurrentControl instanceof ResponsiveTable || controlHelper.isUiTable(oCurrentControl) || controlHelper.isSmartTable(oCurrentControl) ||
					controlHelper.isSmartChart(oCurrentControl) || controlHelper.isSmartList(oCurrentControl)) {
					return oCurrentControl;
				}
				oCurrentControl = oCurrentControl.getParent && oCurrentControl.getParent();
			}
			return null;
		}

		/* Returns an ancestoral PresentationControl i.e. either SmartTable or SmartList or SmartChart, if present. If the provided instance itself is either of the
		   previously mentioned control, then the same is returned without any change. */
		function fnGetOwnerPresentationControl(oControl) {
			var oCurrentControl = oControl;
			while (oCurrentControl) {
				if (controlHelper.isSmartTable(oCurrentControl) || controlHelper.isSmartChart(oCurrentControl) || controlHelper.isSmartList(oCurrentControl)) {
					return oCurrentControl;
				}
				oCurrentControl = oCurrentControl.getParent && oCurrentControl.getParent();
			}
			return null;
		}

		/*
		 * Refresh based on etags only. Else, whole model content will be invalidated.
		 * The required content will automatically loaded again by UI5.
		 * The method returns the information whether it has triggered the refresh. The caller might take this information
		 * in order to decide that all other smart table instances on the same view using the same entity set also need to be updated.
		 *@public
		*/
		function fnRefreshModel(sEntitySet) {
			//ALP have to check their coding themselves
			if (!oServices.oApplication.checkEtags(sEntitySet)) {
				var oComponent = oController.getOwnerComponent();
				var oModel = oComponent.getModel();
				var oEntitySet = oModel.getMetaModel().getODataEntitySet(sEntitySet);
				if (oController.getMetadata().getName() === 'sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage' && isParameterizedEntitySet(oModel, oEntitySet)) {
					oModel.invalidateEntityType(oEntitySet.entityType);
				} else {
					var fnCheckEntry = function(sKey) {
						return oDataModelHelper.analyseContextPath(sKey, oModel).entitySet === sEntitySet;
					};
					oModel.invalidate(fnCheckEntry);
				}
				var sComponentId = oComponent.getId();
				var mExceptions = Object.create(null);
				mExceptions[sComponentId] = true;
				oServices.oApplication.refreshAllComponents(mExceptions);
				// There can also be other instances of SmartTable on the same view which also need to be updated.
				// Currently we only do this for the root page
				return true;
			}
			return false;
		}
		/*
		  Check if the entitySet is parameterized or not
		 */
		function isParameterizedEntitySet(oModel,oEntitySet) {
			var o4a = new odata4analytics.Model(odata4analytics.Model.ReferenceByModel(oModel));
			var queryResult = o4a.findQueryResultByName(oEntitySet.name);
			var parameterization = queryResult && queryResult.getParameterization();
			return !!parameterization;
		}

		/*
		 * Triggers navigation from a given list item.
		 *
		 * @param {sap.ui.model.context} selected context for navigation
		 * @param {object} oTable The table from which navigation was triggered
		 *        control in the table
		 * @public
		 */
		function fnNavigateFromListItem(oContext, bReplace, bOpenInEditMode) {
			var iDisplayMode;
			if (oComponentUtils.isDraftEnabled()){
				iDisplayMode = oServices.oDraftController.isActiveEntity(oContext) ? 1 : 6;
			} else {
				var oComponent = oController.getOwnerComponent();
				iDisplayMode = oComponent.getModel("ui").getProperty("/editable") ? 6 : 1;
			}
			if (bOpenInEditMode) {
				oServices.oApplication.setObjectInEditMode(true);
			}
			oComponentUtils.navigateAccordingToContext(oContext, iDisplayMode, bReplace);
		}

		// Fix for BCP 1770053414 where error message is displayed instead of error code
		function fnHandleError(oError) {
			if (oError instanceof NavError) {
				if (oError.getErrorCode() === "NavigationHandler.isIntentSupported.notSupported") {
					MessageBox.show(getText("ST_NAV_ERROR_NOT_AUTHORIZED_DESC"), {
						title: getText("ST_GENERIC_ERROR_TITLE")
					});
			} else {
					MessageBox.show(oError.getErrorCode(), {
						title: getText("ST_GENERIC_ERROR_TITLE")
					});
				}
			}
		}

		function fnNavigateExternal(oOutbound, oState) {
			fnProcessDataLossOrDraftDiscardConfirmation(function() {
				oNavigationHandler = oServices.oApplication.getNavigationHandler();
				var oObjectInfo = {
					semanticObject: oOutbound.semanticObject,
					action: oOutbound.action
				};
				var oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant(oOutbound.parameters);
				//Adding the null check as the canvas floorplan does not have the "adaptNavigationParameterExtension" method.
				if (typeof oController.adaptNavigationParameterExtension === "function") {
					oController.adaptNavigationParameterExtension(oSelectionVariant, oObjectInfo);
				}

				setComponentRefreshBehaviour(oOutbound);

				oServices.oApplication.navigateExternal(oOutbound.semanticObject, oOutbound.action, oSelectionVariant.toJSONString(),
						null, fnHandleError);
				//null object has to be passed to the NavigationHandler as an
				//indicator that the state should not be overwritten
				//if draft enabled then passing NavigateExternal else on back button passing LeavePage
			}, Function.prototype, "LeaveApp");
		}

		function fnGetNavigationKeyProperties(sTargetEntitySet) {
			var aPageKeys = [], oKeyInfo, oEntityType, sEntityType;
			var oComponent = oController.getOwnerComponent();
			var oMetaModel = oComponent.getModel().getMetaModel();
			if (!sTargetEntitySet) {
				return {};
			}
			var oPages = oComponent.getAppComponent().getConfig().pages[0];
			if (!oPages) {
				return {};
			}
			var fnPrepareKeyInfo = function(oPage) {
				sEntityType = oMetaModel.getODataEntitySet(oPage.entitySet).entityType; //oPages.pages[i].entitySet).entityType;
				oEntityType = oMetaModel.getODataEntityType(sEntityType);
				oKeyInfo = {};
				oKeyInfo = {
					entitySet: oPage.entitySet,// sEntitySet, //oPages.pages[i].entitySet,
					aKeys: oMetaModel.getODataEntityType(sEntityType).key.propertyRef,
					navigationProperty: oPage.navigationProperty
				};
				for (var j = 0, jlength = oKeyInfo.aKeys.length; j < jlength; j++) {
					var k = 0, klength = oEntityType.property.length;
					for (k; k < klength; k++) {
						if (oKeyInfo.aKeys[j].name === oEntityType.property[k].name) {
							oKeyInfo.aKeys[j].type = oEntityType.property[k].type;
							break;
						}
					}
				}
			};
			var fnGetPathKeys = function(sTargetEntitySet, oPages) {
				if (!oPages.pages) {
					return aPageKeys;
				}
				for (var i = 0, ilength = oPages.pages.length; i < ilength; i++) {
					if (!oPages.pages[i]) {
						break;
					}
					if (sTargetEntitySet === oPages.pages[i].entitySet) {
						fnPrepareKeyInfo(oPages.pages[i]);
						aPageKeys.splice(0, 0, oKeyInfo);
						break;
					}
					aPageKeys = fnGetPathKeys(sTargetEntitySet, oPages.pages[i]);
					if (aPageKeys.length > 0) {
						fnPrepareKeyInfo(oPages.pages[i]);
						aPageKeys.splice(0, 0, oKeyInfo);
					}
				}
				return aPageKeys;
			};
			return fnGetPathKeys(sTargetEntitySet, oPages);
		}

		function fnMergeNavigationKeyPropertiesWithValues(aKeys, Response) {
			var sKeySeparator, sRoute, i, ilength;
			for (i = 0, ilength = aKeys.length; i < ilength; i++) {
				if (aKeys[i].navigationProperty) {
					sRoute += "/" + aKeys[i].navigationProperty;
				} else {
					sRoute = "/" + aKeys[i].entitySet;
				}
				for (var j = 0, jlength = aKeys[i].aKeys.length; j < jlength; j++) {
					if (j === 0) {
						sRoute += "(";
						sKeySeparator = "";
					} else {
						sKeySeparator = ",";
					}

					switch (aKeys[i].aKeys[j].type) {
						case "Edm.Guid":
							if (Response.DraftAdministrativeData && Response.DraftAdministrativeData.DraftIsCreatedByMe) {
								//DraftDraftAdministrativeData.DraftUUID is passed as Guid (not the ideal keys to be passed but just a fix for the time being)
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "guid'" + Response.DraftAdministrativeData.DraftUUID + "'";
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "guid'" + Response[aKeys[i].aKeys[j].name] + "'";
							}
							break;
						case "Edm.Boolean":
							if (Response.DraftAdministrativeData && Response.DraftAdministrativeData.DraftIsCreatedByMe) {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + false;
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + Response[aKeys[i].aKeys[j].name];
							}
							break;
						default:
							if (typeof Response[aKeys[i].aKeys[j].name] === "string") {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "'" + Response[aKeys[i].aKeys[j].name] + "'";
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + Response[aKeys[i].aKeys[j].name];
							}
							break;
						}
						if (j === (jlength - 1)) {
							sRoute += ")";
						}
					}
				}
			return sRoute;
		}

		// This function combines the properties (parameters and selectOptions) from the semanticObject in oEventParameters with the selectOptions from sSelectionVariant.
		// The extension adaptNavigationParameterExtension is called where parameters and selectOptions can be removed by the app.
		// In the end, oEventParameters contains only parameters that were not removed by the extension call,
		// sSelectionVariantPrepared contains a flat list of the same parameters plus the selectOptions that were not removed by the extension call.
		function fnSemanticObjectLinkNavigation(oEvent, sSelectionVariant, oController, oState) {
			var oSelectionVariant, sSelectionVariantPrepared, sParameter, sSemanticObject, aSelVariantPropertyNames, aSelOptionPropertyNames, aParameterNames;
			var oObjectInfo = {
				semanticObject : "",
				action : ""
			};
			var oEventParameters = oEvent.getParameters();
			oNavigationHandler = oServices.oApplication.getNavigationHandler();
			// fill oSelectionVariant with the selectOptions from sSelectionVariant
			oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant({}, sSelectionVariant);
			// loop through all semanticObjects
			for (sSemanticObject in oEventParameters.semanticAttributesOfSemanticObjects) {
				// add all parameters from semanticObject to oSelectionVariant, with empty values
				for (sParameter in oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject]) {
					if (!oSelectionVariant.getSelectOption(sParameter)) {
						oSelectionVariant.addParameter(sParameter, "");
					}
				}
				// oSelectionVariant now contains all selectOptions and parameters from semanticObject, store these in aSelVariantPropertyNames before calling extension
				aSelVariantPropertyNames = oSelectionVariant.getPropertyNames();
				oObjectInfo.semanticObject = sSemanticObject;
				aSelOptionPropertyNames = oSelectionVariant.getSelectOptionsPropertyNames();
				aParameterNames = oSelectionVariant.getParameterNames();
				//remove not selected parameters from oEventParameters and not selected selectOptions from oSelectionVariant
				for (var i = 0, length = aSelVariantPropertyNames.length; i < length; i++) {
					if (aSelOptionPropertyNames.indexOf(aSelVariantPropertyNames[i]) < 0 && aParameterNames.indexOf(aSelVariantPropertyNames[i]) < 0) {
						delete oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject][aSelVariantPropertyNames[i]];
						oSelectionVariant.removeSelectOption(aSelVariantPropertyNames[i]);
					}
				}
				if (sSemanticObject === oEventParameters.semanticObject){
					// get the empty semanticObject with all its parameters
					var oSemObjEmpty = oEventParameters.semanticAttributesOfSemanticObjects[""];
					for (var j = 0, length = aParameterNames.length; j < length; j++ ) {
						// remove all parameters from oSelectionVariant
						oSelectionVariant.removeParameter(aParameterNames[j]);
						// add only these parameters again that are not contained in the empty semanticObject (why?)
						if (!(aParameterNames[j] in oSemObjEmpty)) {
							var sParameterValue = oEventParameters.semanticAttributesOfSemanticObjects[oEventParameters.semanticObject][aParameterNames[j]];
							sParameterValue = (typeof sParameterValue === "undefined" || sParameterValue === null) ? "" : String(sParameterValue);
							oSelectionVariant.addParameter(aParameterNames[j], sParameterValue);
						}
					}
					// add the resulting selectOptions and parameters (if any!) in oSelectionVariant with the ones of the semanticObject in oEventParameters as selectOptions to oSelectionVariant
					oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant(oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject], oSelectionVariant.toJSONString());
					// Remove sensitive data from the context
					oSelectionVariant = fnRemovePropertiesFromNavigationContext(oSelectionVariant, oEvent.getSource(), oState);
					// call extension
					oController.adaptNavigationParameterExtension(oSelectionVariant, oObjectInfo);
					sSelectionVariantPrepared = oSelectionVariant.toJSONString();
				}
			}
			delete oEventParameters.semanticAttributes;
			oNavigationHandler.processBeforeSmartLinkPopoverOpens(oEventParameters, sSelectionVariantPrepared);
		}

		/**
		 * Removes properties marked with UI.ExcludeFromNavigationContext or PersonalData.IsPotentiallySensitive annotations and returns the updated SV object.
		 *
		 * @param {object} oSelectionVariant - Contains context information which needs to be passed to the target application while navigating
		 * @param {object} oControl - Control that is used to trigger the navigation
		 * @param {object} oState - State object of the template currently active
		 * @return {object} oSelectionVariant - Updated SV object without the properties marked with UI.ExcludeFromNavigationContext or PersonalData.IsPotentiallySensitive
		 */
		function fnRemovePropertiesFromNavigationContext(oSelectionVariant, oControl, oState) {
			/* Different cases of Navigation with context
				1. DataFieldForIBN - SmartTable (Inline/Toolbar Action), Determining Action
				2. DataFieldWithIBN - SmartTable, OP Section Form, OP Header Form
				3. Common.SemanticObject(SmartLink) - SmartTable, OP Section Form, OP Header Form
			*/
			var sControlEntitySet;
			var aEntities = [];
			var sOwnerComponentEntitySet = oController.getOwnerComponent().getEntitySet();
			if (!controlHelper.isSemanticObjectController(oControl) && !controlHelper.isSmartTable(oControl)) {
				// When navigation from table is triggered from an OP Table, oControl is not a smart table but a link or a button in the table.
				var oParentControl = getOwnerControl(oControl) && getOwnerControl(oControl).getParent();
				if (controlHelper.isSmartTable(oParentControl)) {
					oControl = oParentControl;
					sControlEntitySet = oControl.getEntitySet();
				} else {
					// The control is neither a smart link nor a smart table but just a link. Ex: DataFieldWithIBN OP section or OP Header Facet
					// We fetch the entitySet from the owner component.
					sControlEntitySet = sOwnerComponentEntitySet;
				}
			} else {
				sControlEntitySet = oControl.getEntitySet();
			}
			aEntities.push(sControlEntitySet);
			var bMultiTableMode = oState && oState.oMultipleViewsHandler && oState.oMultipleViewsHandler.getMode && oState.oMultipleViewsHandler.getMode() === "multi";
			if ((sControlEntitySet !== sOwnerComponentEntitySet) && !bMultiTableMode) {
				// Navigation triggered from the ObjectPage table. The SelectionVariant would now contain properties from the OP's entity along with those from the table's entity.
				// Properties marked with UI.ExcludeFromNavigationContext or PersonalData.IsPotentiallySensitive in both entities have to be removed from the navigation context.
				aEntities.push(sOwnerComponentEntitySet);
			}
			aEntities.forEach(function(sEntitySet) {
				if (oControl) {
					var oMetaModel = oControl.getModel().getMetaModel();
					var oEntityType = oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(sEntitySet).entityType);
					oSelectionVariant.getPropertyNames().forEach(function(sProperty) {
						var oEntityProperty = oMetaModel.getODataProperty(oEntityType, sProperty);
						// Null check is important as oEntityProperty is null for navigation properties.
						if (oEntityProperty && ((oEntityProperty["com.sap.vocabularies.UI.v1.ExcludeFromNavigationContext"] && oEntityProperty["com.sap.vocabularies.UI.v1.ExcludeFromNavigationContext"].Bool !== "false") ||
							(oEntityProperty["com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"] && oEntityProperty["com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"].Bool !== "false"))) {
								oSelectionVariant.removeSelectOption(sProperty);
						}
					});
				}
			});

			return oSelectionVariant;
		}

		// Begin: helper functions for onBeforeRebindTable/Chart

		// This function collects all mandatory fields needed for the specified entity set. The names of these fields are passed to the callback fnHandleMandatoryField.
		// It is assumed that this callback is able to deal with duplicate calls for the same field.
		// the additional fields are: semantic key, technical key + IsDraft / HasTwin
		function fnHandleMandatorySelectionFields(sEntitySet, fnHandleMandatoryField){
			var fnHandleKeyFields = function(aMandatoryFields){
				for (var i = 0; i < aMandatoryFields.length; i++) {
					fnHandleMandatoryField(aMandatoryFields[i].name);
				}
			};//Come back to this for ALP
			var oMetaModel = oController.getView().getModel().getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet, false);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType, false);
			fnHandleKeyFields(oEntityType.key.propertyRef);

			var oDraftContext = oServices.oDraftController.getDraftContext();
			if (oDraftContext.isDraftEnabled(sEntitySet)) {
				fnHandleKeyFields(oDraftContext.getSemanticKey(sEntitySet));
				fnHandleMandatoryField("IsActiveEntity");
				fnHandleMandatoryField("HasDraftEntity");
				fnHandleMandatoryField("HasActiveEntity");
			}
		}

		function fnSetAnalyticalBindingPath(oSmartTableOrChart, fnResolveParameterizedEntitySet, oSmartFilterBar, fnSetBindingPath){
			// still open
			// support for analytical parameters comming from the backend
			//Make sure views with paramters are working and change the tableBindingPath to the pattern parameterSet(params)/resultNavProp
			if (fnSetBindingPath && oSmartFilterBar && oSmartFilterBar.getAnalyticBindingPath && oSmartFilterBar.getConsiderAnalyticalParameters()) {
				//catching an exception if no values are yet set.
				//TODO: This event actually shoudn't be called before mandatory fields are populated
				try {
					var sAnalyticalPath = oSmartFilterBar.getAnalyticBindingPath();
					var sTableEntitySet = oSmartTableOrChart.getEntitySet();
					var oModel = oSmartTableOrChart.getModel();
					var oMetaModel = oModel.getMetaModel();
					var oEntitySet = oMetaModel.getODataEntitySet(sTableEntitySet);
					var oComponent = oController.getOwnerComponent();
					var oAppComponent = oComponent.getAppComponent();
					var oParameterInfo = metadataAnalyser.getParametersByEntitySet(oAppComponent.getModel(), sTableEntitySet);
					// Fix for the bcp 1980440309. fnResolveParameterizedEntitySet must be removed to commonutils.js
					// if only parameterised entity set no need to update the sAnalyticalPath
					if (oMetaModel.getODataEntityType(oEntitySet.entityType)["sap:semantics"] !== "aggregate") {
						if (fnResolveParameterizedEntitySet) {
							var sParameterizedEntitySetPath = fnResolveParameterizedEntitySet(oEntitySet, oParameterInfo);
							sAnalyticalPath = sParameterizedEntitySetPath || sAnalyticalPath;
						}
					}
					if (sAnalyticalPath) {
						fnSetBindingPath(sAnalyticalPath);
					}
				} catch (e) {
					oLogger.warning("Mandatory parameters have no values");
				}
			}
		}

		// add the expands derived from aPaths to aExpands
		function fnExpandOnNavigationProperty (sEntitySet, aPath, aExpands) {
			// check if any expand is neccessary
			for (var i = 0; i < aPath.length; i++) {
				var sPath = aPath[i];
				var iPos = sPath.lastIndexOf("/");
				var sNavigation;
				if (iPos < 0){ // sPath contains no / but still could be a navigationProperty
					if (oServices.oApplication.getNavigationProperty(sEntitySet, sPath)){
						sNavigation = sPath;
					} else {
						continue;
					}
				} else {
					sNavigation = sPath.substring(0, iPos);
				}
				if (aExpands.indexOf(sNavigation) === -1) {
					aExpands.push(sNavigation);
				}
			}
		}

		function onBeforeRebindTableOrChart(oEvent, oCallbacks, oSmartFilterBar){
			var oBindingParams = oEvent.getParameter("bindingParams"),
			sControlId = oEvent.getSource().getId();
			oBindingParams.parameters = oBindingParams.parameters || {};
			// State messages should
			oBindingParams.parameters.transitionMessagesOnly = oComponentUtils.getNoStateMessagesForTables();

			// Generic helper for extension functions
			var fnPerformExtensionFunction = function(sExtensionName, fnExtensionCallback, sControlId){
				if (oCallbacks && oCallbacks[sExtensionName]){
					var bIsAllowed = true; // check for synchronous calls
					var fnPerformExtensionCallback = function(){
						var oControllerExtension = arguments[0];
						if (!(oControllerExtension instanceof ControllerExtension)){
							throw new FeError(sClassName, "Please provide a valid ControllerExtension in order to execute extension " + sExtensionName);
						}
						if (!bIsAllowed){
							throw new FeError(sClassName, "Extension " + sExtensionName + " must be executed synchronously");
						}
						var aArgumentsWithoutFirst = Array.prototype.slice.call(arguments, 1); // use array function slice for array-like object arguments
						fnExtensionCallback.apply(null, aArgumentsWithoutFirst); // call fnExtensionCallback leaving out the first argument (the ControllerExtension)
					};
					oCallbacks[sExtensionName](fnPerformExtensionCallback, sControlId);
					bIsAllowed = false;
				}
			};

			// Begin: Filter handling
			var fnAddFilter = function(oFilter){
				if (!sControlId || oController.byId(sControlId) === oEvent.getSource()) {
					oBindingParams.filters.push(oFilter);
				}
			};
			if (oCallbacks.addTemplateSpecificFilters){ // currently only used for the edit state filter on LR
				oCallbacks.addTemplateSpecificFilters(oBindingParams.filters);
			}
			fnPerformExtensionFunction("addExtensionFilters", fnAddFilter, sControlId);
			// End Filter handling
			var oSmartTableOrChart = oEvent.getSource();
			if (oController.getMetadata().getName() !== 'sap.suite.ui.generic.template.ObjectPage.view.Details') {
				fnSetAnalyticalBindingPath(oSmartTableOrChart, oCallbacks.resolveParamaterizedEntitySet, oSmartFilterBar, oCallbacks.setBindingPath);
			}

			var sEntitySet = oSmartTableOrChart.getEntitySet();

			//--- begin: expand binding --------------------------------------------------------------------------------------
			var aSelects = oBindingParams.parameters.select && oBindingParams.parameters.select.split(",") || [];
			var aExpands = oBindingParams.parameters.expand && oBindingParams.parameters.expand.split(",") || [];

			// This function adds the given property sProperty to aSelect if it is not contained already. If sProperty is faulty, the function does nothing.
			var fnEnsureSelectionProperty = function(sProperty, sControlId){
				// check if the correct stable id if is passed or not
				if (sProperty && (!sControlId || oController.byId(sControlId) === oEvent.getSource())) {
					var aPropertyArray = sProperty.split(',');
					aPropertyArray.forEach(function (sElement) {
						if (sElement && aSelects.indexOf(sElement) === -1) {
							aSelects.push(sElement);
						}
					});
				}
			};
			// ALP has not been adding any mandatory filters and hence this is ignored
			if (oCallbacks.isMandatoryFiltersRequired) {
				fnHandleMandatorySelectionFields(sEntitySet, fnEnsureSelectionProperty);
			}

			// Allow extensions to (synchronously) ensure selection fields
			fnPerformExtensionFunction("ensureExtensionFields", fnEnsureSelectionProperty, sControlId);

			// Add fields specific to the control
			(oCallbacks.addNecessaryFields || Function.prototype)(aSelects, fnEnsureSelectionProperty, sEntitySet);

			fnExpandOnNavigationProperty(sEntitySet, aSelects, aExpands);

			if (aExpands.length > 0) {
				oBindingParams.parameters.expand = aExpands.join(",");
			}
			if (aSelects.length > 0) {
				oBindingParams.parameters.select = aSelects.join(",");
			}
		}

		// End: helper functions for onBeforeRebindTable/Chart

		function formatDraftLockText(IsActiveEntity, HasDraftEntity, LockedBy) {
			if (!IsActiveEntity) {
				// current assumption: is my Draft as I don't see other's draft -> TODO: to be checked
				return getText("DRAFT_OBJECT");
			} else if (HasDraftEntity) {
				return getText(LockedBy ? "LOCKED_OBJECT" : "UNSAVED_CHANGES");
			} else {
				return ""; // not visible
			}
		}

		function getDraftPopover() {
			return new Promise(function (fnResolve) {
				var oDraftPopover;
				getDialogFragmentAsync("sap.suite.ui.generic.template.fragments.DraftAdminDataPopover", {
					formatText: function() {
						var aArgs = Array.prototype.slice.call(arguments, 1);
						var sKey = arguments[0];
						if (!sKey) {
							return "";
						}
						if (aArgs.length > 0 && (aArgs[0] === null || aArgs[0] === undefined || aArgs[0] === "")) {
							if (aArgs.length > 3 && (aArgs[3] === null || aArgs[3] === undefined || aArgs[3] === "")) {
								return (aArgs.length > 2 && (aArgs[1] === null || aArgs[1] === undefined || aArgs[1] === ""))
										? ""
										: aArgs[2];
							} else {
								return getText(sKey, aArgs[3]);
							}
						} else {
							return getText(sKey, aArgs[0]);
						}
					},
					closeDraftAdminPopover: function() {
						oDraftPopover.close();
					},
					formatDraftLockText: formatDraftLockText
				}, "admin").then(function (oFragment) {
					oDraftPopover = oFragment;
					fnResolve(oDraftPopover);
				});
			});
		}

		function fnProcessDataLossTechnicalErrorConfirmation(fnProcessFunction, fnCancelFunction, oState, sMode) {
			return oServices.oDataLossHandler.performIfNoDataLoss(fnProcessFunction, fnCancelFunction, sMode, true, true);
		}

		// parameter sMode can have the following values:
		// "Proceed": stays on the same page
		// "LeaveApp": leave the app via a forward navigation
		// "LeavePage": leave the page via an internal navigation or a backward navigation (which may or may not be internal)
		// Note: if sMode is faulty it will be considered as "LeavePage"
		function fnProcessDataLossOrDraftDiscardConfirmation(fnProcessFunction, fnCancelFunction, sMode, bNoBusyCheck){
			sMode = sMode || "LeavePage";
			if (oComponentUtils.isDraftEnabled()){
				return oServices.oPageLeaveHandler.performAfterDiscardOrKeepDraft(fnProcessFunction, fnCancelFunction, sMode, bNoBusyCheck, false);
			} else {
				return oServices.oDataLossHandler.performIfNoDataLoss(fnProcessFunction, fnCancelFunction, sMode, bNoBusyCheck, false);
			}
		}

		function fnSecuredExecution(fnFunction, mParameters) {
			mParameters = deepExtend({
				busy: {set: true, check: true},
				dataloss: {popup: true, navigation: false}
			}, mParameters);
			var fnResolve, fnReject;
			var oResultPromise = new Promise(function(resolve, reject){
				fnResolve = resolve;
				fnReject = reject;
			});
			var fnExecute1 = mParameters.busy.set ? function(){
				oServices.oApplication.getBusyHelper().setBusy(oResultPromise, false, { actionLabel: mParameters.sActionLabel });
				return fnFunction();
			} : fnFunction;

			var fnExecute2 = mParameters.mConsiderObjectsAsDeleted ? function(oParameter){
				oServices.oApplication.prepareDeletion(mParameters.mConsiderObjectsAsDeleted);
				return fnExecute1();
			} : fnExecute1;

			var fnExecute3 = function(){
				var oRet;
				if (oComponentUtils.isDraftEnabled()){
					oRet = fnExecute2();
				} else {
					oRet = (mParameters.dataloss.popup ? fnProcessDataLossOrDraftDiscardConfirmation(fnExecute2, fnReject,
					null, (mParameters.dataloss.navigation ? "LeavePage" : "Proceed"), true) : fnExecute2());
				}

				if (oRet instanceof Promise) {
					oRet.then(fnResolve, fnReject);
				} else {
					fnResolve(oRet);
				}
			};
			oServices.oApplication.performAfterSideEffectExecution(fnExecute3, mParameters.busy.check && fnReject);
			return oResultPromise;
		}

		/*
		These functions (fnGetSmartTableDefaultVariant and fnGetSmartChartDefaultVariant) should be replaced by an official API from SmartTable/SmartChart
		 */
		function fnGetSmartTableDefaultVariant(oSmartTable) {
				var tableVariantId = oSmartTable.getId() + "-variant";
				var oVM = sap.ui.getCore().byId(tableVariantId);
				var sVariantKey = oVM.getDefaultVariantKey();
				return sVariantKey === oVM.STANDARDVARIANTKEY ? "" : sVariantKey;
		}

		// Return the default variant id for SmartChart
		function fnGetSmartChartDefaultVariant(oSmartChart) {
			var chartVariantId = oSmartChart.getId() + "-variant";
			var oVM = sap.ui.getCore().byId(chartVariantId);
			var sVariantKey = oVM.getDefaultVariantKey();
			return sVariantKey === oVM.STANDARDVARIANTKEY ? "" : sVariantKey;
		}

		/*
		 * Visible property of toolbar buttons annotated with DataFieldForIntentBasedNavigation can be bound to certain paths in "_templPriv" Model during templating (see method buildVisibilityExprOfDataFieldForIntentBasedNaviButton in AnnotationHelper.js)
		 * The function checks if the navigation targets ( semanticObject+ action) are supported in the system and updates the corresponding paths of the model. Thus the visibility of buttons is updated.
		 */
		function fnCheckToolbarIntentsSupported(oSmartControl) {
			var oToolbar;
			var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
			var oComponent = oController.getOwnerComponent();
			var oAppComponent, oXApplNavigation, oSupportedIntents, aToolbarContent, iButtonsNumber, aLinksToCheck = [], aInternalLinks = [], i, oCustomData, sSemObj, sAction, oLink, oInternalLink, oDeferredLinks;
			var iLinksNumber, oSemObjProp;
			oAppComponent = oComponent.getAppComponent();
			oXApplNavigation = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation");
			oSupportedIntents = oTemplatePrivateModel.getProperty("/generic/supportedIntents/");
			//handle toolbar buttons
			if (controlHelper.isSmartChart(oSmartControl)) {
				oToolbar = oSmartControl.getToolbar();
			} else if (controlHelper.isSmartTable(oSmartControl)) {
				oToolbar = oSmartControl.getCustomToolbar();
			}
			aToolbarContent = oToolbar.getContent();
			iButtonsNumber = aToolbarContent.length;
			for (i = 0; i < iButtonsNumber; i++) {
				oCustomData = getElementCustomData(aToolbarContent[i]);
				if (oCustomData.hasOwnProperty("SemanticObject") && oCustomData.hasOwnProperty("Action")) {
					sSemObj = oCustomData.SemanticObject;
					sAction = oCustomData.Action;
					oLink = {
						semanticObject: sSemObj,
						action: sAction,
						ui5Component: oAppComponent
					};
					aLinksToCheck.push([oLink]);
					oInternalLink = extend({}, oLink);
					oInternalLink.bLinkIsSupported = false;
					aInternalLinks.push(oInternalLink);
				}
			}

			if (aLinksToCheck.length > 0 && oXApplNavigation) {
				oDeferredLinks = oXApplNavigation.getLinks(aLinksToCheck);
				oDeferredLinks.done(function(aLinks) {
					oSupportedIntents = oTemplatePrivateModel.getProperty("/generic/supportedIntents/");
					iLinksNumber = aLinks.length;
					//entries in aLinks should correspond to aInternalLinks: if a link is not supported an empty object is returned by the method getLinks
					for (i = 0; i < iLinksNumber; i++) {
						if (aLinks[i][0].length > 0) {
							aInternalLinks[i].bLinkIsSupported = true;
						}
						// add the value to the model
						sSemObj = aInternalLinks[i].semanticObject;
						sAction = aInternalLinks[i].action;

						oSemObjProp = oTemplatePrivateModel.getProperty("/generic/supportedIntents/" + sSemObj);
						if (!oSemObjProp) {  // no semantic object in the model yet
							oSupportedIntents[sSemObj] = {};
							oSupportedIntents[sSemObj][sAction] =
							{
								"visible" :aInternalLinks[i].bLinkIsSupported
							};
						} else if (!oSemObjProp[sAction]) {  // no action in the model yet
							oSemObjProp[sAction] =
							{
								"visible" :aInternalLinks[i].bLinkIsSupported
							};
						} else {
							oSemObjProp[sAction]["visible"] = aInternalLinks[i].bLinkIsSupported;
						}
					}
					oTemplatePrivateModel.updateBindings();
				});
			}
		}

		// This function executes the given handler fnHandler if preconditions are given
		// The execution is postponed until all side effects are executed.
		// Therefore, the execution is done asynchronously.
		// The method returns a Promise R. The behaviour of R is determined by the return value of fnHandler
		// If fnHandler itself returns a Promise P, then R resolves (or rejects) the same way as P (and the application is set busy until this has happened).
		// If fnHandler returns something else, then R resolves to the return value of fnHandler.
		// fnHandler is NOT executed if any of the following conditions is fulfilled:
		// - the app is still busy after the side-effects have been executed
		// - sControlId is truthy but does not specify a visible control (on this view)
		// - sControlId is truthy and specifies a visible control which possesses a getEnabled() method which returns a faulty value
		// In all these cases R is rejected (with empty value).
		// If sControlId specified a control this control will be passed as first parameter to fnHandler. Otherwise no parameters will be passed to fnHandler.
		function fnExecuteIfControlReady(fnHandler, sControlId){
			var oControl = sControlId && oController.byId(sControlId);
			var oRet = (sControlId && !oControl) ?  Promise.reject() : new Promise(function(fnResolve, fnReject){
				oServices.oApplication.performAfterSideEffectExecution(function(){
					var oBusyHelper = oServices.oApplication.getBusyHelper();
					if (oBusyHelper.isBusy()){
						fnReject();
						return;
					}
					if (oControl && (!oControl.getVisible() || (oControl.getEnabled && !oControl.getEnabled()))){
						fnReject();
						return;
					}
					var oRet = oControl ? fnHandler(oControl) : fnHandler();
					if (oRet instanceof Promise){
						oRet.then(fnResolve, fnReject);
						oBusyHelper.setBusy(oRet);
					} else {
						fnResolve(oRet);
					}
				});
			});
			oRet.catch(Function.prototype); // avoid errors in console
			return oRet;
		}

		/**
		 * Invokes multiple time the action with the given name and submits changes to the back-end.
		 *
		 * @param {string} sFunctionName The name of the function or action
		 * @param {array|sap.ui.model.Context} vContext The given binding contexts
		 * @param {map} [mUrlParameters] The URL parameters (name-value pairs) for the function or action. This is not in oSettings for backward compatibility
		 * @param {object} oSettings Parameters that are set for invoking Application controller's invokeActions method
		 * @param {boolean} oSettings.bInvocationGroupingChangeSet Determines whether the common or unique changeset gets sent in batch
		 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the action, resolving to the same result as the <code>Promise</code>
		 * returned from {@link sap.ui.generic.app.ApplicationController}
		 * @throws {Error} Throws an error if the OData function import does not exist or the action input parameters are invalid
		 * @public
		 */
		function fnInvokeActionsForExtensionAPI (sFunctionName, vContext, mUrlParameters, oSettings, oState) {
			var aContext, mParameters = {};
			if (!vContext) {
				aContext = [];
			} else if (Array.isArray(vContext)) {
				aContext = vContext;
			} else {
				aContext = [ vContext ];
			}
			if (mUrlParameters) {
				mParameters.urlParameters = mUrlParameters;
			}
			if (oSettings && oSettings.bInvocationGroupingChangeSet) {
				mParameters.operationGrouping = "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet";
			}
			mParameters.triggerChanges = oComponentUtils.isDraftEnabled();
			//Execute floorplan specific logic before invokeaction is executed
			oComponentUtils.executeBeforeInvokeActionFromExtensionAPI(oState);
			//call invokeActions method
			var oPromise = oServices.oApplicationController.invokeActions(sFunctionName, aContext, mParameters);
			if (oSettings && oSettings.bSetBusy) {
				oComponentUtils.getBusyHelper().setBusy(oPromise);
			}
			//Execute floorplan specific logic after invokeaction is executed
			oPromise.then(oComponentUtils.executeAfterInvokeActionFromExtensionAPI.bind(null, oState));
			return oPromise;
		}

		// Sets the refresh behaviour for the table's component from where navigation has happened. Used for sap-keep-alive refresh feature.
		function setExternalChevronRefreshBehaviour(sTableEntitySet) {
			var mTableComponentRefresh = oServices.oApplication.getChevronNavigationRefreshBehaviour(sTableEntitySet);
			if (mTableComponentRefresh !== Object.create(null)) {	// refresh behaviour is not turned off in the manifest
				oServices.oViewDependencyHelper.setRefreshBehaviour(mTableComponentRefresh);
			}
		}

		// Sets the refresh behaviour for all active components. Used for sap-keep-alive refresh feature.
		function setComponentRefreshBehaviour(oOutbound) {
			var mComponentRefresh = oServices.oApplication.getComponentRefreshBehaviour(oOutbound);
			oServices.oViewDependencyHelper.setRefreshBehaviour(mComponentRefresh);
		}

		function getStreamData(sNavigationProperty, oContext){
			var oModel = oContext.getModel();
			var sPath = oContext.getPath().split("/")[1];
			var oPageContext = oModel.oData[sPath];
			if (sNavigationProperty) {
				var sStreamPath = oPageContext && oPageContext[sNavigationProperty] && oPageContext[sNavigationProperty].__ref;
				var oStreamContext = oModel.oData[sStreamPath];
				return oStreamContext;
			} else {
				return oPageContext;
			}
		}

		function setStreamData(oStreamData, sNavigationProperty){
			if (oStreamData && oStreamData.__metadata){
				var edit_media = oStreamData.__metadata.edit_media;
				var content_type = oStreamData.__metadata.content_type;
				var url = edit_media && new URL(edit_media);
				var urlPath = url && url.pathname;
				var bIcon = IconPool.getIconForMimeType(content_type);
				var obj = {
					url : urlPath,
					fileType: content_type,
					icon: bIcon
				};
				var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
				var sEntitySet = oController.getOwnerComponent().getEntitySet();
				if (!oTemplatePrivateModel.getProperty("/generic/controlProperties/fileUploader")){
					oTemplatePrivateModel.setProperty("/generic/controlProperties/" + "fileUploader" , {});
				}
				if (sNavigationProperty) {
					oTemplatePrivateModel.setProperty("/generic/controlProperties/" + "fileUploader/" + sNavigationProperty , obj);
				} else {
					oTemplatePrivateModel.setProperty("/generic/controlProperties/" + "fileUploader/" + sEntitySet , obj);
				}
			}
		}

		/***
		 * This function filters the active contexts from the array of table row contexts.
		 * Note: for some table types, aContexts might contain undefined entries. The undefined entries will remain untouched.
		 */
		function fnFilterActiveContexts(aContexts) {
			return aContexts.filter(function(oContext){
				return !oContext || !oContext.isTransient();
			});
		}

		// Check if 2 navigation properties refers to same relationship between parent entity set and child entity set.
		function fnCheckInverseNavigation(sParentEntitySet, sParentToChildNavigationProperty, sChildEntitySet, sChildToParentNavigationProperty) {
			var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();
			var oParentToChildNavRelationship = metadataAnalyser.getNavigationPropertyRelationship(oMetaModel, sParentEntitySet, sParentToChildNavigationProperty);
			var oChildToParentNavRelationship = metadataAnalyser.getNavigationPropertyRelationship(oMetaModel, sChildEntitySet, sChildToParentNavigationProperty);
			return (oParentToChildNavRelationship.relationship === oChildToParentNavRelationship.relationship &&
					oParentToChildNavRelationship.fromRole === oChildToParentNavRelationship.toRole &&
					oParentToChildNavRelationship.toRole === oChildToParentNavRelationship.fromRole);
		}

		/* The method is specifically used for keyboard shortcut feature, in order to to get custom data from event (from two diferrent sources).
		   In case the action has a command associated to it, then the event would originate from its corresponding command execution and otherwise,
		   from the button itself.  */
		function fnGetCustomDataFromEvent(oEvent) {
			var oEventSource = oEvent.getSource();
			return controlHelper.isButton(oEventSource) ?
				oEventSource.data() :
				sap.ui.getCore().byId(oController.createId(getElementCustomData(oEventSource)["ActionId"])).data();
		}

		// Expose selected private functions to unit tests
		// etBreakoutActionsForTable
		/* eslint-disable */
		var fnFillEnabledMapForBreakoutActions = testableHelper.testable(fnFillEnabledMapForBreakoutActions, "fillEnabledMapForBreakoutActions");
		var getOwnerControl = testableHelper.testable(getOwnerControl, "getOwnerControl");
		var fnGetToolbarCustomData = testableHelper.testable(fnGetToolbarCustomData, "fnGetToolbarCustomData");
		var fnRemovePropertiesFromNavigationContext = testableHelper.testable(fnRemovePropertiesFromNavigationContext, "removePropertiesFromNavigationContext");
		/* eslint-enable */

		return {
			getPositionableControlId: getPositionableControlId,
			getMetaModelEntityType: getMetaModelEntityType,
			getText: getText,
			getSpecializedText: getSpecializedText,
			getContextText: getContextText,
			getNavigationKeyProperties: fnGetNavigationKeyProperties,
			mergeNavigationKeyPropertiesWithValues: fnMergeNavigationKeyPropertiesWithValues,

			executeGlobalSideEffect: function() {
				if (oComponentUtils.isDraftEnabled()) {
					var oView = oController.getView();
					var oComponent = oController.getOwnerComponent();
					var oAppComponent = oComponent.getAppComponent();
					var bForceGlobalRefresh = oAppComponent.getForceGlobalRefresh();
					var oUIModel = oComponent.getModel("ui");
					oView.attachBrowserEvent(
							/* If the focus is on a button, enter can be used to press the button. In this case, the press event is triggered by the keydown,
							 * thus, to ensure side effect is executed before the handling of the button, we need to attach to the keydwon event (e.g. keyup would be
							 * too late).
							 */
							"keydown",
							function(oBrowserEvent) {
								var isSearchField = oBrowserEvent.target.type === "search";
								var isTextArea = oBrowserEvent.target.type === "textarea";
								var isRowAction = oBrowserEvent.target.id.indexOf("rowAction") > -1;
								var isColumnListItem = oBrowserEvent.target.id.indexOf("ColumnListItem") > -1;
								// CTRL key is checked with the ENTER key as CTRL + ENTER is used as a shortcut for adding entries to a table
								if (oBrowserEvent.keyCode === 13 && oBrowserEvent.ctrlKey !== true && oUIModel.getProperty("/editable") && !isSearchField && !isTextArea && !isRowAction && !isColumnListItem) {
									/* When editing data in a normal field (not a text area), the model change can also be triggered by enter. In case of a draft, the model
									 * change event triggers the merge. This has to happen before the global side effect (which actually refreshes all data, and otherwise would just
									 * override all changes). To ensure this, the side effect is postponed to the end of the thread (setTimeout).
									 * However, if the focus is on a button, this could lead to executing the press event handler before the side effect. To avoid this, we immediatly
									 * add a side effect promise to indicate that the side effect still has to run.
									 */
									oServices.oApplication.addSideEffectPromise(new Promise(function(fnResolve, fnReject){
										/* If ENTER is pressed from a smartField inside a smartForm, we make sure that the validation checks for all the fields inside that smartForm
										 * are completed before executing the side effects.
										 */
										var oSourceForm, oSourceControl, oBindingContext, bSkipPreparationAction = false, mAdditionalParameters = {
											draftRootContext : oComponentUtils.getMainComponentDetails().bindingContext, // send the root component binding for exexuting preparation action
											callPreparationOnDraftRoot : true // For now execute preparation only on draft root
										};
										// Get the control where the ENTER event occured.
										oSourceControl = controlHelper.getControlWithFocus();
										/**
										 * Iterate upwards to find whether the control is smartField and is present under smartForm or smartTable
										 * If present inside smart form (true for object page section cases) then pepare to call smartform validation
										 */
										while (oSourceControl) {
											if (controlHelper.isSmartField(oSourceControl)) {
												oBindingContext = oSourceControl.getBindingContext && oSourceControl.getBindingContext();
												if (oBindingContext.isTransient && oBindingContext.isTransient()) {
													// For smartField in transient row the content is local and not yet created in backend. So block sideeffect and draft preparation
													// Resolve the promise and exit the function
													return fnResolve();
												}
											} else if (controlHelper.isOverflowToolbar(oSourceControl) || controlHelper.isButton(oSourceControl) || controlHelper.isLink(oSourceControl) || (controlHelper.isMultiInputField(oSourceControl) && (oSourceControl._sTypedInValue && oSourceControl._sTypedInValue.length > 0))) {
												//Skip preparation action for controls : sap.m.OverflowToolbar, sap.m.Link, sap.m.Button.
												//Skip preparation action only if no user input for sap.m.MultiInput (using _sTypedInValue to check if user has entered any value).
												bSkipPreparationAction = true;
											} else if (controlHelper.isSmartForm(oSourceControl)) {
												oSourceForm = oSourceControl;
												break;
											} else if (controlHelper.isSmartTable(oSourceControl)) {
												// For smartField inside the smart table the iteration can be stopped at smartTable level as the row binding info is available
												break;
											}
											oSourceControl = oSourceControl.getParent();
										}
										if (bSkipPreparationAction) {
											// Continue with global side effect execution. Do not send parameters for preparation action.
											mAdditionalParameters = {};
										}
										/**
										 * Get the bindingContext from either one of
										 *  1. The actual event source (smart field only)
										 *  2. Smart form / Smart table
										 *  3. Object page (for controls present outside the smart form / smart table)
										 */
										oBindingContext = oBindingContext || (oSourceControl && oSourceControl.getBindingContext && oSourceControl.getBindingContext()) || oView.getBindingContext();
										/* The smartField inside a table is also of type 'text' but not present under the smart form. Hence validation is performed only if the source
										 * field is under smart form.
										 */
										var oCheckPromise = oSourceForm ? oSourceForm.check() : Promise.resolve();
										oCheckPromise.then(function(){
											setTimeout(function(){
												var oSideEffectPromise = oServices.oApplicationController.executeSideEffects(oBindingContext, null, null, bForceGlobalRefresh, mAdditionalParameters);
												oSideEffectPromise.then(function(){
													fnResolve();
													setTimeout(function() {
														var oSourceElement = document.getElementById(oBrowserEvent.target.id);
														if (oSourceElement){
															oSourceElement.focus(); //set focus back to the selected field if it still exists
														}
													});
												}, fnReject);
											});
										});
									}));
								}
							});
				}
			},
			setEnabledToolbarButtons: fnSetEnabledToolbarButtons,
			setEnabledFooterButtons: fnSetEnabledFooterButtons,
			fillEnabledMapForBreakoutActions: fnFillEnabledMapForBreakoutActions,
			getBreakoutActions: fnGetBreakoutActions,
			getSelectionPoints: getSelectionPoints,
			getDeleteRestrictions: fnGetDeleteRestrictions,
			getSmartTableDefaultVariant: fnGetSmartTableDefaultVariant,
			getSmartChartDefaultVariant: fnGetSmartChartDefaultVariant,
			setPrivateModelControlProperty: fnSetPrivateModelControlProperty,
			removePropertiesFromNavigationContext: fnRemovePropertiesFromNavigationContext,
			navigateFromListItem: fnNavigateFromListItem,
			navigateExternal: fnNavigateExternal,
			semanticObjectLinkNavigation: fnSemanticObjectLinkNavigation,

			getCustomData: function(oEvent) {
				var aCustomData = oEvent.getSource().getCustomData();
				var oCustomData = {};
				for (var i = 0; i < aCustomData.length; i++) {
					oCustomData[aCustomData[i].getKey()] = aCustomData[i].getValue();
				}
				return oCustomData;
			},

			getCustomDataText: function(oElement) {
				return new Promise(function (resolve, reject) {
					oElement.getCustomData().forEach(function(oCustomDataElement) {
						var sKey = oCustomDataElement.getKey();
						if (sKey === "text") {
							var oBinding = oCustomDataElement.getBinding("value");
							var oBindingInfo = !oBinding && oCustomDataElement.getBindingInfo("value");
							if (!oBinding && !oBindingInfo) {
								resolve(oCustomDataElement.getValue());
								return;
							}
							var fnChangeHandler = function(oEvent) {
								var oSource = oEvent.getSource();
								oSource.detachChange(fnChangeHandler);
								resolve(oSource.getExternalValue());
								return;
							};
							if (oBinding) {
								if (!oBinding.isInitial()) {
									// Binding is already initialized then you could access the value
									resolve(oBinding.getExternalValue());
									return;
								}

								oBinding.attachChange(fnChangeHandler);
							} else {
								oBindingInfo.events = {
									change: fnChangeHandler
								};
								for (var i = 0; i < oBindingInfo.parts.length; i++) {
									oBindingInfo.parts[i].targetType = "string";
								}
							}
						}
					});
				});
			},

			onBeforeRebindTableOrChart: onBeforeRebindTableOrChart,

			formatDraftLockText: formatDraftLockText,

			showDraftPopover: function(oBindingContext, oTarget) {
				getDraftPopover().then(function (oPopover) {
					var oAdminModel = oPopover.getModel("admin");
					oAdminModel.setProperty("/IsActiveEntity", oBindingContext.getProperty("IsActiveEntity"));
					oAdminModel.setProperty("/HasDraftEntity", oBindingContext.getProperty("HasDraftEntity"));
					oPopover.bindElement({
						path: oBindingContext.getPath() + "/DraftAdministrativeData"
					});
					if (oPopover.getBindingContext()) {
						oPopover.openBy(oTarget);
					} else {
						oPopover.getObjectBinding().attachDataReceived(function() {
							oPopover.openBy(oTarget);
						});
						// Todo: Error handling
					}
				});
			},

			// provide the density class that should be used according to the environment (may be "")
			getContentDensityClass: function() {
				return oServices.oApplication.getContentDensityClass();
			},

			// defines a dependency from oControl to the view
			attachControlToView: fnAttachControlToView,

			/**
			 *
			 * @function
			 * @name sap.suite.ui.generic.template.lib.CommonUtils.prototype.getSelectedContexts.getDialogFragment(sName,
			 *       oFragmentController, sModel)
			 * @param sName name of a fragment defining a dialog for the current view
			 * @param oFragmentController controller for the fragment containing event handlers and formatters used by the
			 *          fragment
			 * @param sModel optional, name of a model. If this parameter is truthy a JSON model with the given name will be
			 *          attached to the dialog
			 * @return an instance of the specififed fragment which is already attached to the current view. Note that each
			 *         fragment will only be instantiated once. Hence, when the method is called several times for the same
			 *         name the same fragment will be returned in each case. <b>Attention:</b> The parameters
			 *         <code>oFragmentController</code> and <code>sModel</code> are only evaluated when the method is
			 *         called for the first time for the specified fragment. Therefore, it is essential that the functions in
			 *         <code>oFragmentController</code> do not contain 'local state'.
			 */
			getDialogFragment: getDialogFragment,
			getDialogFragmentAsync: getDialogFragmentAsync,
			fnProcessDataLossOrDraftDiscardConfirmation: fnProcessDataLossOrDraftDiscardConfirmation,
			processDataLossTechnicalErrorConfirmation: fnProcessDataLossTechnicalErrorConfirmation,
			securedExecution: fnSecuredExecution,
			getOwnerControl: getOwnerControl,
			getOwnerPresentationControl: fnGetOwnerPresentationControl,
			refreshModel: fnRefreshModel,
			getElementCustomData: getElementCustomData,
			triggerAction: function(aContexts, sEntitySet, oCustomData, oPresentationControlHandler) {
				// Assuming that this action is triggered from an action inside a table row.
				// Also this action is intended for triggering an OData operation.
				// i.e: Action, ActionImport, Function, FunctionImport
				// We require some properties to be defined in the Button's customData:
				//   Action: Fully qualified name of an Action, ActionImport, Function or FunctionImport to be called
				//   Label: Used to display in error messages
				// Once the CRUDManager callAction promise is resolved, if we received a context back from the OData call
				// we check to see if the context that was sent (actionContext) and the context that is returned (oResponse.reponse.context).
				// If they are the same we do nothing. If they are different we trigger any required navigations and set the newly navigated
				// page to dirty using the setMeToDirty function of the NavigationController so as to enter into edit mode and set the page
				// to edit mode.
				oServices.oDataLossHandler.performIfNoDataLoss(function() {
					oServices.oCRUDManager.callAction({
						functionImportPath: oCustomData.Action,
						contexts: aContexts,
						sourceControlHandler: oPresentationControlHandler,
						label: oCustomData.Label,
						operationGrouping: ""
					}).then(function(aResponses) {
						if (aResponses && aResponses.length > 0) {
							var oResponse = aResponses[0];
							// For some apps the context object is placed inside the response object of the Response.
							if (oResponse.response && oResponse.response.context && (!oResponse.actionContext || oResponse.actionContext && oResponse.response.context.getPath() !== oResponse.actionContext.getPath())) {
								//Delaying the content call of the component that triggered the action as it is not needed immediately as we have already navigated to the other component.
								//We set the calling component to dirty which will trigger the refresh of the content once it is activated again.
								oServices.oApplication.getBusyHelper().getUnbusy().then(oServices.oViewDependencyHelper.setMeToDirty.bind(null, oController.getOwnerComponent(), sEntitySet));
							} else if (oResponse.context && (!oResponse.actionContext || oResponse.actionContext && oResponse.context.getPath() !== oResponse.actionContext.getPath())) {
								oServices.oApplication.getBusyHelper().getUnbusy().then(oServices.oViewDependencyHelper.setMeToDirty.bind(null, oController.getOwnerComponent(), sEntitySet));
							}
						}
					});
				}, Function.prototype, "Proceed", undefined, false);
			},
			checkToolbarIntentsSupported: fnCheckToolbarIntentsSupported,
			executeIfControlReady: fnExecuteIfControlReady,
			invokeActionsForExtensionAPI: fnInvokeActionsForExtensionAPI,
			isContextEditable: fnIsContextEditable,
			setExternalChevronRefreshBehaviour: setExternalChevronRefreshBehaviour,
			setComponentRefreshBehaviour: setComponentRefreshBehaviour,
			getStreamData: getStreamData,
			setStreamData: setStreamData,
			getControlStateWrapper: oControlStateWrapperFactory.getControlStateWrapper,
			filterActiveContexts: fnFilterActiveContexts,
			checkInverseNavigation: fnCheckInverseNavigation,
			getCustomDataFromEvent: fnGetCustomDataFromEvent,
			getControlStateWrapperById: oControlStateWrapperFactory.getControlStateWrapperById
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.CommonUtils", {
		constructor: function(oController, oServices, oComponentUtils) {
			extend(this, getMethods(oController, oServices, oComponentUtils));
		}
	});
});
