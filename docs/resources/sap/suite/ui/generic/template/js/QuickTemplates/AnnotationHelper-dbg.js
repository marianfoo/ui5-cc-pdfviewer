sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Context",
			"sap/ui/model/odata/AnnotationHelper", "sap/ui/model/json/JSONModel",
			"sap/base/util/each"
    ],
    function (BaseObject, Context, ODataAnnoHelper, JSONModel, each) {
      "use strict";

    /*eslint camelcase: [2, {properties: "never"}]*/
    var AnnotationHelper = BaseObject.extend("sap.suite.ui.generic.template.js.QuickTemplates.AnnotationHelper");

    AnnotationHelper.TITLE_ANNO_HEURISTIC = [
      "com.sap.vocabularies.UI.v1.Badge/Title/Value",
      "com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value",
      "com.sap.vocabularies.UI.v1.Identification/0/Value"
    ];

    AnnotationHelper.HEADLINE_ANNO_HEURISTIC = [
      "com.sap.vocabularies.UI.v1.Badge/HeadLine/Value",
      "com.sap.vocabularies.Communication.v1.Contact/role",
      "com.sap.vocabularies.UI.v1.HeaderInfo/Description/Value",
      "com.sap.vocabularies.UI.v1.Identification/0/Value",
      "com.sap.vocabularies.UI.v1.Identification/1/Value"
    ];
    AnnotationHelper.IMAGEURL_ANNO_HEURISTIC = [
      "com.sap.vocabularies.UI.v1.Badge/ImageUrl/Value",
      "com.sap.vocabularies.UI.v1.HeaderInfo/ImageUrl/Value"
    ];
    AnnotationHelper.ICONURL_ANNO_HEURISTIC = [
      "com.sap.vocabularies.UI.v1.Badge/TypeImageUrl/Value"
    ];
    AnnotationHelper.TYPENAME_ANNO_HEURISTIC = [
      "com.sap.vocabularies.UI.v1.HeaderInfo/TypeName/Value",
      "com.sap.vocabularies.Common.v1.SemanticObject/String"
    ];

    AnnotationHelper._getAnnotationItem = function (oContext, sVocabularyName, sFieldName, sFieldValue) {
      if (oContext && sVocabularyName && sFieldName) {
        var oVocabularyItem = oContext.getProperty(sVocabularyName);
        if (sFieldValue && oVocabularyItem && oVocabularyItem[sFieldName]) {
          var oItem = oVocabularyItem[sFieldName];
          return oItem[sFieldValue];
        }
        return oVocabularyItem ? oVocabularyItem[sFieldName] : null;
      }
      return undefined;
    };

    AnnotationHelper.getAnnotationItemForVocabulary = function (oContext, sVocabularyFullName) {
      if (sVocabularyFullName) {
        var aParts = sVocabularyFullName.split("/");
        return AnnotationHelper._getAnnotationItem(oContext, aParts[0], aParts.length > 1 ? aParts[1] : null, aParts.length > 2 ? aParts[2] : null);
      }
      return undefined;
    };

    AnnotationHelper.getAnnotationFirstItemFromVocabularies = function (oContext, aVocabularyList, oSkipObject) {
      var oItem = null;
      if (aVocabularyList && Array.isArray(aVocabularyList)) {
        for (var i = 0; !oItem && i < aVocabularyList.length; ++i) {
          oItem = AnnotationHelper.getAnnotationItemForVocabulary(oContext, aVocabularyList[i]);
          if (oSkipObject && oItem && AnnotationHelper._isEqualValues(oSkipObject, oItem)) {
            oItem = null; // Skip this object
          }
        }
      }
      return oItem;
    };

    AnnotationHelper._resolveBadgeImgUrl = function (oContext) {
      return AnnotationHelper.getAnnotationFirstItemFromVocabularies(oContext, AnnotationHelper.IMAGEURL_ANNO_HEURISTIC);
    };

    AnnotationHelper._resolveBadgeIconUrl = function (oContext) {
      var oImageUrl = AnnotationHelper.getAnnotationFirstItemFromVocabularies(oContext, AnnotationHelper.ICONURL_ANNO_HEURISTIC);
      if (!oImageUrl) {
        // Default unknown icon
        oImageUrl = "sap-icon://form";
      }
      return oImageUrl;
    };

    AnnotationHelper._resolveBadgeTitle = function (oContext) {
      return AnnotationHelper.getAnnotationFirstItemFromVocabularies(oContext, AnnotationHelper.TITLE_ANNO_HEURISTIC);
    };

    AnnotationHelper._resolveBadgeTypeName = function (oContext) {
      return AnnotationHelper.getAnnotationFirstItemFromVocabularies(oContext, AnnotationHelper.TYPENAME_ANNO_HEURISTIC);
    };

    AnnotationHelper._resolveBadgeHeadline = function (oContext, sTitle) {
      return AnnotationHelper.getAnnotationFirstItemFromVocabularies(oContext, AnnotationHelper.HEADLINE_ANNO_HEURISTIC, sTitle);
    };

    // Supports old and new Annotation version (Label/Value)
    AnnotationHelper._getAnnotationObject = function (oItem) {
      if (oItem) {
        var oPathObj = {};
        if (oItem.Label) {
          oPathObj.Path = oItem.Label.Path || oItem.Label;
        } else if (oItem.Value) {
          oPathObj.Path = oItem.Value.Path || oItem.Value;
        } else if (oItem.String) {
          oPathObj.String = oItem.String;
        } else if (oItem.Path) {
          oPathObj.Path = oItem.Path;
        } else {
          oPathObj.String = oItem;
        }
        return oPathObj;
      }
      return undefined;
    };

    AnnotationHelper._isEqualValues = function (oItem1, oItem2) {
      if (oItem1 && oItem2) {
        if (oItem1.String && oItem2.String) {
          return oItem1.String === oItem2.String;
        }
        if (oItem1.Value && oItem2.Value) {
          return oItem1.Value.Path === oItem2.Value.Path;
        }
        if (oItem1.Label && oItem2.Label) {
          return oItem1.Label.Path === oItem2.Label.Path;
        }
      }
      return false;
    };

    AnnotationHelper._createBadgeContext = function (oImageUrl, oTypeIconUrl, oTitle, oTypeName, oSubTitle) {
      var oModel = new JSONModel();

      var oBadgeContext = new Context(oModel, "/");
      var oItem = {};
      var sImgUrl = AnnotationHelper._getAnnotationObject(oImageUrl);
      var sTypeUrl = AnnotationHelper._getAnnotationObject(oTypeIconUrl);

      // If the Image URL is set to a sap icon ignore to avoid broken image
      if (sImgUrl && sImgUrl.String && sImgUrl.String.toLowerCase().indexOf("sap-icon://") < 0) {
        oItem.ImageUrl = sImgUrl;
      } else {
        oItem.TypeImageUrl = sTypeUrl || sImgUrl;
      }

      oItem.Title = AnnotationHelper._getAnnotationObject(oTitle);
      oItem.TypeName = AnnotationHelper._getAnnotationObject(oTypeName);
      oItem.SubTitle = AnnotationHelper._getAnnotationObject(oSubTitle);

      oModel.setData(oItem);

      return oBadgeContext;
    };

    AnnotationHelper.resolveBadgeTarget = function (oContext) {
      if (oContext) {
        var sImageUrl = AnnotationHelper._resolveBadgeImgUrl(oContext);
        var sTypeImageUrl = AnnotationHelper._resolveBadgeIconUrl(oContext);
        var sTitle = AnnotationHelper._resolveBadgeTitle(oContext);
        var sTypeName = AnnotationHelper._resolveBadgeTypeName(oContext);
        var sHeadline = AnnotationHelper._resolveBadgeHeadline(oContext, sTitle);
        return AnnotationHelper._createBadgeContext(sImageUrl, sTypeImageUrl, sTitle, sTypeName, sHeadline);
      }
      return undefined;
    };

    AnnotationHelper.resolveFieldGroupTarget = function (oContext) {
      var facet = AnnotationHelper._getFacetOfType(oContext, "FieldGroup");
      if (facet) {
        return ODataAnnoHelper.resolvePath(oContext.getModel().createBindingContext(oContext.getPath() + "/" + facet.index + "/Target"));
      }
      return null;
    };

    AnnotationHelper.resolveLineItemTarget = function (oContext) {
      var facet = AnnotationHelper._getFacetOfType(oContext, "LineItem");
      if (facet) {
        return ODataAnnoHelper.resolvePath(oContext.getModel().createBindingContext(oContext.getPath() + "/" + facet.index + "/Target"));
      }
      return null;
    };

    AnnotationHelper.resolveFieldGroupFacet = function (oContext) {
      var facet = AnnotationHelper._getFacetOfType(oContext, "FieldGroup");
      if (facet) {
        return oContext.getPath() + "/" + facet.index;
      }
      return undefined;
    };

    AnnotationHelper.resolveLineItemFacet = function (oContext) {
      var facet = AnnotationHelper._getFacetOfType(oContext, "LineItem");
      if (facet) {
        return oContext.getPath() + "/" + facet.index;
      }
      return undefined;
    };

    AnnotationHelper.getTooltip = function (value) {
      var sTooltip = "";
      if (value.String) {
        sTooltip = value.String;
      }
      return sTooltip;
    };

    AnnotationHelper._getFacetOfType = function (oContext, facetType) {
      var facets = oContext.getObject();

      var targetIndex = -1;
      var targetFacet = null;
      if (Array.isArray(facets)) {
        each(facets, function (i, facet) {
          if (facet.Target && facet.Target.AnnotationPath && facet.Target.AnnotationPath.indexOf(facetType) >= 0) {
            targetIndex = i;
            targetFacet = facet;
          }
        });
      }

      if (targetIndex >= 0) {
        return {
          facet: targetFacet,
          index: targetIndex
        };

      }
      return undefined;
    };

    AnnotationHelper.getAllPropertyPathsFromFacet = function (context, facetType) {
      var oInterface = AnnotationHelper.createFormatterInterface(context);

      var oMetaModel = context.getModel().getMetaModel();
      var oMetaData = AnnotationHelper.getMetaDataForContext(context);
      var oMetaDataContext = AnnotationHelper.getMetaModelContextForFacetType(oInterface,
        oMetaData.entityType.namespace + "." + oMetaData.entityType.name, facetType);

      var oResolvedPath = ODataAnnoHelper.resolvePath(oMetaDataContext);
      var oResolvedProperty = oMetaModel.getProperty(oResolvedPath);

      var array = oResolvedProperty.Data || oResolvedProperty;

      var propertyPaths = [];

      if (array && Array.isArray(array)) {
        each(array, function (index, anno) {
          if (anno.RecordType === 'com.sap.vocabularies.UI.v1.DataField' && anno.Value && anno.Value.Path) {
            propertyPaths.push(anno.Value.Path);
          }
        });
      }

      return propertyPaths;
    };

    AnnotationHelper.getMetaModelContextForFacetType = function (oInterface, entityType, facetType) {
      var oMetaModel = oInterface.getModel() || oInterface.getModel(0);

      var oEntityTypeMeta = oMetaModel.getODataEntityType(entityType);

      var aSupportedQuickActions = ["QuickCreate", "QuickView"];

      var sFacetKey = "";
      var oMetaDataContext = null;

      var facets = null;

      for (var i = 0; i < aSupportedQuickActions.length; i++) {
        sFacetKey = "com.sap.vocabularies.UI.v1." + aSupportedQuickActions[i] + "Facets";
        if (oEntityTypeMeta[sFacetKey]) {
          facets = oEntityTypeMeta[sFacetKey];
          break;
        }
      }

      if (facets) {
        var targetIndex = -1;
        if (Array.isArray(facets)) {
          each(facets, function (i, facet) {
            if (facet.Target && facet.Target.AnnotationPath && facet.Target.AnnotationPath.indexOf(facetType) >= 0) {
              targetIndex = i;
            }
          });
        }

        if (targetIndex >= 0) {
          oMetaDataContext = new Context(oMetaModel, oEntityTypeMeta.$path + "/" + sFacetKey + "/" + targetIndex + "/Target");
        }
      }

      return oMetaDataContext;
    };

    AnnotationHelper.formatExpandBindingPathForHeaderObject = function (oInterface, entityType) {

      var headerPaths = AnnotationHelper.getNavigationPathsFromFacet(oInterface, entityType, "FieldGroup");

      return AnnotationHelper.formatExpandPaths(headerPaths);

    };

    AnnotationHelper.getMetaDataForContext = function (oContext) {

      var oMetaModel = oContext.getModel().getMetaModel();

      var oEntityTypeMeta = oMetaModel.getODataEntityType(oContext.getObject().__metadata.type);

      var sEntitySetName = null;
      var oEntitySets = oMetaModel.getProperty(oMetaModel.getODataEntityContainer(true)).entitySet;
      each(oEntitySets, function (i, eSet) {
        if (eSet.entityType === oContext.getObject().__metadata.type) {
          sEntitySetName = eSet.name;
        }
      });

      var oEntitySetMeta = oMetaModel.getODataEntitySet(sEntitySetName);

      return {
        entityType: oEntityTypeMeta,
        entitySet: oEntitySetMeta
      };
    };

    AnnotationHelper.getNavigationPathsUsingAnnotationHeuristics = function (oObjectContext, entityType) {

      var oMetaData = {};
      var oMetaModel = oObjectContext.getModel().getMetaModel();
      if (oObjectContext && oObjectContext.getObject()) {
        oMetaData = AnnotationHelper.getMetaDataForContext(oObjectContext);
      } else if (entityType) {
        oMetaData.entityType = oMetaModel.getODataEntityType(entityType);
      }

      var oNavPathsMap = {};
      if (oMetaData && oMetaData.entityType) {
        var aTitleAndHeadlineAnnos = AnnotationHelper.TITLE_ANNO_HEURISTIC.concat(
          AnnotationHelper.HEADLINE_ANNO_HEURISTIC);

        // foreach annotation in heuristic
        var i = 0;
        for (; i < aTitleAndHeadlineAnnos.length; i++) {
          var metaContext = new Context(oMetaModel, oMetaData.entityType.$path + "/" + aTitleAndHeadlineAnnos[i]);
          var navPath = ODataAnnoHelper.getNavigationPath(metaContext);
          if (navPath) {
            navPath = navPath.replace(/[{}]/g, '');
            if (navPath) {
              oNavPathsMap[navPath] = "";
            }
          }
        }
      }
      return Object.keys(oNavPathsMap);
    };

    AnnotationHelper.getNavigationPathsFromFacet = function (oInterface, entityType, facetType) {
      var oMetaModel = oInterface.getModel() || oInterface.getModel(0);
      var oMetaDataContext = AnnotationHelper.getMetaModelContextForFacetType(oInterface, entityType, facetType);

      if (!oMetaDataContext) {
        return [];
      }

      var oResolvedPath = ODataAnnoHelper.resolvePath(oMetaDataContext);
      var oResolvedProperty = oMetaModel.getProperty(oResolvedPath);
      var oNavPaths = {};
      var pathComponent = "/";
      if (oResolvedProperty.Data) {
        pathComponent += "Data/";
      }
      var array = oResolvedProperty.Data || oResolvedProperty;

      if (array && Array.isArray(array)) {
        each(array, function (i, dataField) {
          if (dataField.RecordType == 'com.sap.vocabularies.UI.v1.DataField' && dataField.Value && dataField.Value.Path) {
            var metaContext = new Context(oMetaModel, oResolvedPath + pathComponent + i + "/Value");
            var navPath = ODataAnnoHelper.getNavigationPath(metaContext);
            navPath = navPath.replace(/[{}]/g, '');
            if (navPath) {
              oNavPaths[navPath] = "";
            }
          }
        });
      }

      return Object.keys(oNavPaths);

    };

    AnnotationHelper.getLineItemsNavPropertyName = function (oInterface, entityType) {
      var oMetaDataContext = AnnotationHelper.getMetaModelContextForFacetType(oInterface, entityType, "LineItem");
      if (oMetaDataContext) {
        var sChildPropertyPath = ODataAnnoHelper.getNavigationPath(oMetaDataContext);
        sChildPropertyPath = sChildPropertyPath.replace(/[{}]/g, '');
        return sChildPropertyPath;
      }
      return undefined;
    };

    AnnotationHelper.formatBindingPathForLineItems = function (oInterface, entityType, bIsDraft) {

      var sLineItemProperty = AnnotationHelper.getLineItemsNavPropertyName(oInterface, entityType);

      if (arguments.length === 2) {
        bIsDraft = false;
      }

      if (bIsDraft) {
        var lineItemNavPaths = AnnotationHelper.getNavigationPathsFromFacet(oInterface, entityType, "LineItem");
        if (lineItemNavPaths && lineItemNavPaths.length > 0) {
          return "{path: '" + sLineItemProperty + "', parameters : {expand:'" +
            AnnotationHelper.formatExpandPaths(lineItemNavPaths) +
            "'}}";
        }
      }

      return "{path: '" + sLineItemProperty + "'}";

    };

    AnnotationHelper.formatExpandPaths = function (aExpandPaths) {
      var sExpandParam = "";
      for (var i = 0; i < aExpandPaths.length; i++) {
        sExpandParam += aExpandPaths[i];
        if (i < aExpandPaths.length - 1) {
          sExpandParam += ",";
        }
      }
      return sExpandParam;
    };

    AnnotationHelper.createFormatterInterface = function (oBindingContext) {

      var oMetaContext = oBindingContext.getModel().getMetaModel().getMetaContext(oBindingContext.getPath());

      var oInterface = {
        getModel: function () {
          return oBindingContext.getModel().getMetaModel();
        },

        getContext: function () {
          return oMetaContext;
        },

        getPath: function () {
          return oMetaContext.getPath();
        }
      };

      return oInterface;

    };

    AnnotationHelper.formatBindingPathForLineItems.requiresIContext = true;
    AnnotationHelper.getMetaModelContextForFacetType.requiresIContext = true;
    AnnotationHelper.formatExpandBindingPathForHeaderObject.requiresIContext = true;
    AnnotationHelper.resolveFieldGroupTarget.requiresIContext = true;
    AnnotationHelper.resolveLineItemTarget.requiresIContext = true;
    AnnotationHelper.resolveLineItemFacet.requiresIContext = true;
    AnnotationHelper.resolveFieldGroupFacet.requiresIContext = true;
    AnnotationHelper.resolveBadgeTarget.requiresIContext = true;

    return AnnotationHelper;

  }, true);
