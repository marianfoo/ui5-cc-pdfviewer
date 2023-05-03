sap.ui.define(["sap/ui/model/Context", "../../js/QuickTemplates/QuickActionBaseController", "../../js/QuickTemplates/AnnotationHelper", "../../js/QuickTemplates/ODataModelHelper", "sap/ui/model/json/JSONModel", "sap/base/util/each"], function(Context, BaseController, AnnotationHelper, ODataModelHelper, JSONModel, each) {
	"use strict";


	return BaseController.extend("sap.suite.ui.generic.template.QuickView.view.QuickView", {

		onInit: function() {
			if (!this._bIsInitialized) {
				BaseController.prototype.onInit.apply(this);
				this.sEntityPath = decodeURIComponent(this.oComponent.getComponentData().startupParameters["entityPath"]);
				this.sEntityPath = "/" + ODataModelHelper.createKeyFromPath(this.sEntityPath, this.getView().getModel().getMetaModel(), this.sEntitySet);
				var badgeModel = new JSONModel({});
				badgeModel.setProperty("/badgeVisible", false);
				badgeModel.setProperty("/fallbackBadgeVisible", false);
				this._sBadgeModelName = "badge";

				this.getView().setModel(badgeModel, this._sBadgeModelName);
			}
		},

		_onMetaModelLoaded: function() {
			var oContext = new Context(this.getView().getModel(), this.sEntityPath);
			this.bindView(oContext);

			oContext.getModel().attachRequestCompleted(this._resolveBadgeModel, this);
		},

		bindView: function(oContext) {
			var oInterface = this._getFormatterInterface(oContext);

			var facetPaths = AnnotationHelper.getNavigationPathsFromFacet(oInterface, this.oEntityTypeMeta.namespace + "." + this.oEntityTypeMeta.name, "FieldGroup");
			var heuristicPaths = AnnotationHelper.getNavigationPathsUsingAnnotationHeuristics(oContext, this.oEntityTypeMeta.namespace + "." + this.oEntityTypeMeta.name);

			var oCombined = {};
			each(facetPaths, function(index, path) {
				oCombined[path] = "";
			});

			each(heuristicPaths, function(index, path) {
				oCombined[path] = "";
			});

			var expandParam = AnnotationHelper.formatExpandPaths(Object.keys(oCombined));

			this.oContext = oContext;

			this.getView().bindElement({
				path: oContext.getPath(),
				parameters: {
					expand: expandParam
				}
			});

		},

		_resolveBadgeModel: function() {
			if (this._badgeResolved) {
				this.oContext.getModel().detachRequestCompleted(this._resolveBadgeModel, this);
				return;
			}
			var oContext = this.oContext;

			var ContextualManagedObject = this.oComponent.ContextualManagedObject;
			var badgeModel = this.getView().getModel(this._sBadgeModelName);
			if (ContextualManagedObject) {
				var oContextualManagedObject = new ContextualManagedObject({
					serviceUrl: (oContext.getModel().sServiceUrl) ? oContext.getModel().sServiceUrl : null,
					path: oContext.getPath(),
					entitytype: this.oEntitySetMeta.entityType,
					uiGroup: "Main Object",
					priority: "1"
				});

				// need to set model and binding context on managed object
				oContextualManagedObject.setModel(oContext.getModel());
				oContextualManagedObject.setBindingContext(oContext);
				oContextualManagedObject.resolveAnnotations();

				badgeModel.setProperty("/imgUrlDefined", (oContextualManagedObject.getProperty("imgUrl") != undefined && oContextualManagedObject.getProperty("imgUrl").indexOf("sap-icon") < 0));
				badgeModel.setProperty("/imgUrl", oContextualManagedObject.getProperty("imgUrl"));

				badgeModel.setProperty("/typeImgUrlDefined", (oContextualManagedObject.getProperty("typeImgUrl") != undefined && !badgeModel.getProperty("/imgUrlDefined")));
				badgeModel.setProperty("/typeImgUrl", oContextualManagedObject.getProperty("typeImgUrl"));

				if (!badgeModel.getProperty("/imgUrlDefined") && !badgeModel.getProperty("/typeImgUrlDefined")) {
					badgeModel.setProperty("/typeImgUrl", "sap-icon://form");
					badgeModel.setProperty("/typeImgUrlDefined", true);
				}

				badgeModel.setProperty("/title", oContextualManagedObject.getProperty("title"));
				if (oContextualManagedObject.getProperty("typeName")) {
					badgeModel.setProperty("/typeName", oContextualManagedObject.getProperty("typeName"));
				} else if (oContextualManagedObject.getProperty("titleMetadata") && oContextualManagedObject.getProperty("titleMetadata")["sap:label"]) {
					badgeModel.setProperty("/typeName", oContextualManagedObject.getProperty("titleMetadata")["sap:label"]);
				} else {
					badgeModel.setProperty("/typeName", "");
				}
				badgeModel.setProperty("/subtitle", oContextualManagedObject.getProperty("headline"));
				badgeModel.setProperty("/badgeVisible", true);

			} else {
				badgeModel.setProperty("/fallbackBadgeVisible", true);
			}
			this._badgeResolved = true;
		}

	});
}, /* bExport= */ true);
