sap.ui.define(["sap/suite/ui/generic/template/js/AnnotationHelper"], function(oGenericAnnotationHelper) {
	"use strict";
	/* Templating helper functions that are specific to the ListReport Template */
	var AnnotationHelper = {
		resolveMetaModelPath: function(oContext) {
			var sPath = oContext.getObject();
			var oModel = oContext.getModel();
			var oMetaModel = oModel.getProperty("/metaModel");
			return oMetaModel.createBindingContext(sPath);
		},
		/* The context definition for the ListReport
			1. only check if there is a default presentation variant for now. If it exists we
			   need to check if it has a LineItem annotation and use this one rather than the default LineItem annotation
			Compare with similar function in AnalyticalListReport
		*/
		createWorkingContext: function(oContext) {
			var oParameter = oContext.getObject(),
				oSettings = oParameter.settings,
				oModel = oContext.getModel(),
				oMetaModel = oModel.getProperty("/metaModel"),
				oEntitySet = oMetaModel.getODataEntitySet(oParameter.entitySet),
				oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType),
				sAnnotationPath = "",
				oWorkingContext = {};
			/* Determine PresentationVariant */
			var sPresentationVariant = AnnotationHelper.getRelevantPresentationVariantPath(oEntityType, oSettings.annotationPath);
			sAnnotationPath = oEntityType.$path + "/" + sPresentationVariant;
			oWorkingContext.presentationVariantQualifier = sAnnotationPath.split("#")[1] || "";
			oWorkingContext.presentationVariant = oMetaModel.getObject(sAnnotationPath);
			oWorkingContext.presentationVariantPath = sAnnotationPath;
			/* Determine LineItem and Chart via PV */
			if (oWorkingContext.presentationVariant && oWorkingContext.presentationVariant.Visualizations) {
				oWorkingContext.presentationVariant.Visualizations.forEach(function(visualization) {
					/* get rid of the @ and put a / in front */
					var sPath = "/" + visualization.AnnotationPath.slice(1);
					if (sPath.indexOf("com.sap.vocabularies.UI.v1.LineItem") > -1) {
						sAnnotationPath = oEntityType.$path + sPath;
						oWorkingContext.lineItem = oMetaModel.getObject(sAnnotationPath);
						oWorkingContext.lineItemPath = sAnnotationPath;
						oWorkingContext.lineItemQualifier = sAnnotationPath.split("#")[1] || "";
					}
				});
			}
			/* Fall back to defaults without qualifier */
			if (!oWorkingContext.lineItem) {
				sAnnotationPath = oEntityType.$path + "/com.sap.vocabularies.UI.v1.LineItem";
				oWorkingContext.lineItem = oMetaModel.getObject(sAnnotationPath);
				oWorkingContext.lineItemPath = sAnnotationPath;
				oWorkingContext.lineItemQualifier = "";
			}

			oWorkingContext.tableChartTabs = [];
			var sAnnotation, oVariants, i, oItem, oVariant;
			oVariants = oParameter && oParameter.manifest && oParameter.manifest["sap.ui.generic.app"] && oParameter.manifest["sap.ui.generic.app"].pages && oParameter.manifest["sap.ui.generic.app"].pages[0].component &&
				oParameter.manifest["sap.ui.generic.app"].pages[0].component.settings && oParameter.manifest["sap.ui.generic.app"].pages[0].component.settings.quickVariantSelectionX &&
				oParameter.manifest["sap.ui.generic.app"].pages[0].component.settings.quickVariantSelectionX.variants;
			for (i in oVariants) {
				oVariant = {};
				sAnnotation = "";
				oItem = {};
				oItem.key = oVariants[i].key;
				oItem.variantAnnotationPath = oVariants[i].annotationPath;
				oItem.variantQualifier = oItem.variantAnnotationPath.split("#")[1] || "";
				if (!!oVariants[i].entitySet) {
					oItem.entitySet = oVariants[i].entitySet;
					oEntitySet = oMetaModel.getODataEntitySet(oItem.entitySet);
					//support for reducing entitySet - skip if entitySet not present in metadata
					if (oEntitySet) {
						oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
					} else {
						continue;
					}
				}

				oVariant = oEntityType[oItem.variantAnnotationPath];
				// oVariant is SelectionPresentationVariant
				if (oVariant && oVariant.PresentationVariant) {
					// for the case that under PresentationVariant an annotation path is specified to the presentation variant
					// comment 2017/11/30: annotation path is not correct. the presentation variant should be referenced via path
					// see BCP:1780445623
					var oPresentationVariantAnnotation;
					if (oVariant.PresentationVariant.Path) {
						var sPresentationVariantPath = oVariant.PresentationVariant.Path.split("@")[1];
						oPresentationVariantAnnotation = sPresentationVariantPath && oEntityType[sPresentationVariantPath];
						oItem.presentationVariantQualifier = sPresentationVariantPath.split("#")[1] || "";
					} else {
						oPresentationVariantAnnotation = oVariant.PresentationVariant;
					}
					sAnnotation = oPresentationVariantAnnotation.Visualizations && oPresentationVariantAnnotation.Visualizations[0].AnnotationPath;
				} else if (oVariant && oVariant.Visualizations) {
					// oVariant is PresentationVariant
					sAnnotation =  oVariant.Visualizations[0].AnnotationPath;
				}
				if (sAnnotation) {
					// get rid of the @ and put a / in front
					var sRelativePath = "/" + sAnnotation.slice(1);

					if (sAnnotation.indexOf("com.sap.vocabularies.UI.v1.Chart") > -1) {
						oItem.smartControl = "chart";
						oItem.chartAbsolutePath = oEntityType.$path + sRelativePath;
					} else if (sAnnotation.indexOf("com.sap.vocabularies.UI.v1.LineItem") > -1) {
						oItem.smartControl = "table";
						sAnnotationPath = oEntityType.$path + sRelativePath;
						oItem.lineItem = oMetaModel.getObject(sAnnotationPath);
						oItem.lineItemPath = sAnnotationPath;
						oItem.lineItemQualifier = sAnnotationPath.split("#")[1] || "";
					}
				}

				/* Fall back to default lineItem without qualifier */
				if (!(oItem.chartAbsolutePath || oItem.lineItemPath)) {
					sAnnotationPath = oEntityType.$path + "/com.sap.vocabularies.UI.v1.LineItem";
					oItem.lineItem = oMetaModel.getObject(sAnnotationPath);
					oItem.lineItemPath = sAnnotationPath;
					oItem.lineItemQualifier = "";
				}
				oItem.controlQualifier = sAnnotation && sAnnotation.split("#")[1] || "";
				oWorkingContext.tableChartTabs.push(oItem);
			}

			oModel.setProperty("/workingContext", oWorkingContext);
			return "/workingContext";
		},

		getRelevantPresentationVariantPath: function(oEntityType, sAnnotationPath) {
			var sPath = "com.sap.vocabularies.UI.v1.PresentationVariant";
			if (sAnnotationPath && sAnnotationPath.indexOf('com.sap.vocabularies.UI.v1.SelectionPresentationVariant') > -1) {
				// SelectionPresentationVariant with inline definition of PresentationVariant is not supported intentionally
				// In cases where the PresentationVariant is defined inline, we fallback to the PresentationVariant without a qualifier
				var sReferenceAnnotationPath = oEntityType[sAnnotationPath] && (oEntityType[sAnnotationPath].PresentationVariant.Path || oEntityType[sAnnotationPath].PresentationVariant.AnnotationPath);
				sPath = sReferenceAnnotationPath ? sReferenceAnnotationPath.split("@")[1] : "com.sap.vocabularies.UI.v1.PresentationVariant";
			} else if (sAnnotationPath && sAnnotationPath.indexOf('com.sap.vocabularies.UI.v1.PresentationVariant') > -1) {
				sPath = sAnnotationPath;
			}
			return sPath;
		},

		getValidPresentationVariantForSingleView: function (oEntityType, sVariantAnnotationPath) {
			var sPresentationVariantPath = AnnotationHelper.getRelevantPresentationVariantPath(oEntityType, sVariantAnnotationPath);
			var oVariant = oEntityType[sPresentationVariantPath];
			var oPresentationVariant = oGenericAnnotationHelper.getPresentationVariant(oVariant, oEntityType);
			return oPresentationVariant;
		},

		checkIfChartQualifier: function(oWorkingContext, iTabItem) {
			return !!(AnnotationHelper.getChartQualifier(oWorkingContext, iTabItem));
		},

		getChartQualifier: function(oWorkingContext, iTabItem) {
			var sChartQualifier, i, sKey;
			for (i in oWorkingContext.tableChartTabs) {
				sKey = oWorkingContext.tableChartTabs[i].key;
				if (sKey === iTabItem.key) {
					sChartQualifier = oWorkingContext.tableChartTabs[i].controlQualifier;
					break;
				}
			}
			return sChartQualifier;
		},

		getPresentationVariantQualifier: function(oWorkingContext, iTabItem) {
			var sVariantQualifier, i, sKey;
			for (i in oWorkingContext.tableChartTabs) {
				sKey = oWorkingContext.tableChartTabs[i].key;
				if (sKey === iTabItem.key) {
					sVariantQualifier = oWorkingContext.tableChartTabs[i].variantQualifier;
					break;
				}
			}
			return sVariantQualifier;
		},

		getChartAnnotationPath: function(iTabItem) {
			var sChartAnnotationPath, oModel, oObject, i, aTableTabs, sVariantAnnotationPath, sChartAnnotationPath, sChartActionsAnnotationPath, oBindingContextPath;
			oModel = iTabItem.getModel();
			var oMetaModel = oModel.getProperty("/metaModel");
			oObject = oModel.getObject(iTabItem.sPath);
			aTableTabs = oModel.getData("workingContext")["workingContext"].tableChartTabs;
			for (i in aTableTabs) {
				sVariantAnnotationPath = aTableTabs[i].variantAnnotationPath;
				if (sVariantAnnotationPath === oObject.annotationPath) {
					sChartAnnotationPath = aTableTabs[i].chartAbsolutePath;
					sChartActionsAnnotationPath = sChartAnnotationPath + '/Actions';
					oBindingContextPath = oMetaModel.createBindingContext(sChartActionsAnnotationPath);
					return oBindingContextPath;
				}
			}
		},

		/*
		 * so far it is only possible to have a SmartChart on the List Report in different views (i.e. multi-tabs) mode
		 * multi-tabs mode can be with one entitySet or with different entitySets ( each tab has its own entitySet)
		 * external navigation is supported in both cases
		 * internal navigation is only supported in one entity use case
		 */
		checkIfChartNavigationIsEnabled: function(oItabItem, aSubPages, sChartEntitySet, oQuickVariantSelectionX) {
			var bTemp = oItabItem.showItemNavigationOnChart;
			if (!bTemp) {
				return false;
			}

			sChartEntitySet = !!oItabItem.entitySet ? oItabItem.entitySet : sChartEntitySet;

			//enable external navigation for both one entitySet and different entitySets use case
			for (var i = 0; i < aSubPages.length; i++) {
				if (aSubPages[i].entitySet === sChartEntitySet && aSubPages[i].navigation && aSubPages[i].navigation['display']) {
					return true;
				}
			}

			//internal navigation should be enabled for one entitySet use case only
			// Only one subpage is allowed in the list report that is why no loop over the aSubPages
				if (!AnnotationHelper.checkIfDiffEntitySetsMode(oQuickVariantSelectionX) && aSubPages && aSubPages[0] && aSubPages[0].entitySet === sChartEntitySet && (!aSubPages[0].navigation || aSubPages[0].navigation && !aSubPages[0].navigation['display'])) { // check that the internal navigation is not overwritten by the external one
					return true;
				}
			return false;
		},


		/*
		 * it is possible to have different entitySets in multi-tab mode on the List Report
		 * different entitySets mode is switched on if there is an entry for the entitySet in at least one tab definition in manifest under quickVariantSelectionX/variants
		 */
		checkIfDiffEntitySetsMode: function(oQuickVariantSelectionX) {
			var i;
			var oVariants = oQuickVariantSelectionX && oQuickVariantSelectionX.variants;
			for (i in oVariants) {
				if (oVariants[i].entitySet) {
					return true;
				}
			}
		},

		/*
		 * for analytical table, grid table and tree table only
		 * applies if the document.body is in "sapUiSizeCompact" mode and condencedTableLayout mode in manifest/settings is set
		 */
		setSizeCondensedCssClass: function(bCondencedTableLayout) {
			var sCompactClass = "sapUiSizeCompact", sCondensedClass = "sapUiSizeCondensed", oBody;
			if (!bCondencedTableLayout) {
				return;
			}
			oBody = document.body;
			if (oBody.classList.contains(sCompactClass) ) {
				return sCondensedClass;
			}
		},

		/*
		 * in case different entitySets are defined in the manifest for different tabs we have to change entityTypeContext which
		 * has been set in the function createXMLView (TemplateComponent.js)
		 */
		getEntityType: function(oTabItem) {
			var oModel, oData, oTabItemObject, sEntitySet, oMetaModel, oEntitySet, sEntityType, oEntityTypeContext;
			oModel = oTabItem.getModel();
			oData = oModel.getData();
			oTabItemObject = oTabItem.getObject();
			sEntitySet = oTabItemObject && oTabItemObject.entitySet;
			oMetaModel = oData.metaModel;
			if (!!sEntitySet) {
				oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
				sEntityType = oEntitySet && oEntitySet.entityType;
			} else {
				sEntityType = oData.entityType;
			}
			oEntityTypeContext = oMetaModel.createBindingContext(oMetaModel.getODataEntityType(sEntityType, true));

			return oEntityTypeContext;
		},

		/*
		 * in case different entitySets are defined in the manifest for different tabs we have to change entitySetContext which
		 * has been set in the function createXMLView (TemplateComponent.js)
		 */
		getEntitySet: function(oTabItem) {
			var oModel, oData, oTabItemObject, sEntitySet, oMetaModel, oEntitySetContext;
			oModel = oTabItem.getModel();
			oData = oModel.getData();
			oTabItemObject = oTabItem.getObject();
			sEntitySet = oTabItemObject && oTabItemObject.entitySet;
			oMetaModel = oData.metaModel;
			if (!sEntitySet) {
				sEntitySet = oData.entitySet;
			}
			oEntitySetContext = oMetaModel.createBindingContext(oMetaModel.getODataEntitySet(sEntitySet, true));
			return oEntitySetContext;
		},

		getTableAnnotationPath: function(iTabItem) {
			var sTableAnnotationPath, oModel, oObject, oWorkingContext, i, aTableTabs, sTableAnnotationPath;
			oModel = iTabItem.getModel();
			var oData = oModel.getData();
			var oMetaModel = oData.metaModel;
			oObject = oModel.getObject(iTabItem.sPath);
			oWorkingContext = oModel.getData("workingContext")["workingContext"];
			aTableTabs = oWorkingContext.tableChartTabs;
			for (i in aTableTabs) {
				if (aTableTabs[i].key === oObject.key) {
					sTableAnnotationPath = aTableTabs[i].lineItemPath;
					var oTableAnnotationPathContext = oMetaModel.createBindingContext(sTableAnnotationPath);
					return oTableAnnotationPathContext;
				}
			}
		}
	};

	return AnnotationHelper;
}, /* bExport= */ true);
