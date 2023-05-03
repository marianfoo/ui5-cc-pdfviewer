sap.ui.define([
    "sap/ui/model/odata/AnnotationHelper",
    "sap/suite/ui/generic/template/js/AnnotationHelper"
], function (OdataAnnotationHelper, AnnotationHelper) {
    "use strict";
    /* Templating helper functions that are specific to the Stream support*/

    var oAnnotationHelperStreamSupport = {
        checkIfEntityOrAssociationHasStreamEnabled: function (oInterface, oEntitySet, oDataField) {
			if (oDataField.Value && oDataField.Value.Path) {
				var sDataFieldValuePath = oDataField.Value.Path;
				var oMetaModel = oInterface.getModel(0);
				var oAssociation;
				var oEntityType;
				//Check for '$value' in the end of the binding
				if (sDataFieldValuePath.endsWith("$value")) {
					var aDataFieldValuePathArray = sDataFieldValuePath.split("/");
					var iLength = aDataFieldValuePathArray.length;
					if (iLength > 1) {
						//Stream EntitySet is associated through navigation properties. Parse path to retrieve the entity
						for (var index = 0; index < iLength - 1; index++) {
							var sNavigationProperty = aDataFieldValuePathArray[index];
							oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
							var oAssociation = oMetaModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
							oEntityType = oMetaModel.getODataEntityType(oAssociation && oAssociation.type);
						}
					} else {
						//Current EntitySet itself will hold a stream
						var oMetaModel = oInterface.getModel(0);
						oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
					}
				}
				return oEntityType && oEntityType.hasStream === "true";
			}
		},

		getStreamEntitySet: function(oDataField){
			if (oDataField.Value && oDataField.Value.Path) {
				var sDataFieldValuePath = oDataField.Value.Path;
				// returns the navigation property on which the stream is enabled
				if (sDataFieldValuePath.endsWith("$value")) {
					var aDataFieldValuePathArray = sDataFieldValuePath.split("/");
					var iLength = aDataFieldValuePathArray.length;
					var sNavigationProperty = aDataFieldValuePathArray[iLength - 2];
					return sNavigationProperty;
				}
			}
		},

		getLinkTextForStream: function(oEntitySet, oDataField){
			var sNavigationProperty = oAnnotationHelperStreamSupport.getStreamEntitySet(oDataField);
			return sNavigationProperty ? "{= ${_templPriv>/generic/controlProperties/fileUploader/" + sNavigationProperty + "/fileName}}" : "{= ${_templPriv>/generic/controlProperties/fileUploader/" + oEntitySet.name + "/fileName}}";
		},

		getURLForStream: function(oEntitySet, oDataField){
			var sNavigationProperty = oAnnotationHelperStreamSupport.getStreamEntitySet(oDataField);
			return sNavigationProperty ? "{= ${_templPriv>/generic/controlProperties/fileUploader/" + sNavigationProperty + "/url}}" : "{= ${_templPriv>/generic/controlProperties/fileUploader/" + oEntitySet.name + "/url}}";
		},

		isStreamPresent: function(oInterface, oMediaType, oStreamContent, oEntitySet){
			var oEntityType = oEntitySet && oInterface.getModel(0).getODataEntityType(oEntitySet.entityType);
			var sFCPath = oEntityType && oEntityType["com.sap.vocabularies.Common.v1.FieldControl"] && oEntityType["com.sap.vocabularies.Common.v1.FieldControl"].Path;
			if (oStreamContent.value === "available") {
				return sFCPath ? '{= ${' + oMediaType + '} !== "" && ${' + sFCPath + '} >= "1"}' : '{= ${' + oMediaType + '} !== ""}';
			} else {
				return sFCPath ? '{= ${' + oMediaType + '} === "" && ${' + sFCPath + '} >= "1"}' : '{= ${' + oMediaType + '} === ""}';
			}
		},

		getIconForStreamForTableCells: function(oEntitySet, oDataField){
			return "{parts: [{path: '__metadata/content_type'}], formatter: 'sap.ui.core.IconPool.getIconForMimeType'}";
		},

		getIconForStream: function(oEntitySet, oDataField){
			var sNavigationProperty = oAnnotationHelperStreamSupport.getStreamEntitySet(oDataField);
			return sNavigationProperty ? "{= ${_templPriv>/generic/controlProperties/fileUploader/" + sNavigationProperty + "/icon}}" : "{= ${_templPriv>/generic/controlProperties/fileUploader/" + oEntitySet.name + "/icon}}";
		},

		isMimeTypeImage: function(oInterface, oMediaType, oDisplayType, oEntitySet){
			var oEntityType = oEntitySet && oInterface.getModel(0).getODataEntityType(oEntitySet.entityType);
			var sFCPath = oEntityType && oEntityType["com.sap.vocabularies.Common.v1.FieldControl"] && oEntityType["com.sap.vocabularies.Common.v1.FieldControl"].Path;
			var bIsImage = false;
			if (oEntityType && oEntityType["com.sap.vocabularies.UI.v1.IsImage"]) {
				if (oEntityType["com.sap.vocabularies.UI.v1.IsImage"].Bool) {
					bIsImage = oEntityType["com.sap.vocabularies.UI.v1.IsImage"].Bool;
				} else if (oEntityType["com.sap.vocabularies.UI.v1.IsImage"].Path) {
					bIsImage = oEntityType["com.sap.vocabularies.UI.v1.IsImage"].Path;
				} else {
					bIsImage = true;
				}
			}
			if (oDisplayType.value === "image") {
				if (typeof (bIsImage) === 'boolean' && bIsImage) {
					return sFCPath ? '{= ${' + oMediaType + '} !== ""  && ${' + sFCPath + '} >= "1"}' : '{= ${' + oMediaType + '} !== "" }';
				} else if (typeof (bIsImage) === 'string') {
					return sFCPath ? '{= ${' + oMediaType + '} !== ""  && ${' + sFCPath + '} >= "1" && ${' + bIsImage + '}}' : '{= ${' + oMediaType + '} !== "" && ${' + bIsImage + '}}';
				}
				return false;
			} else {
				if (typeof (bIsImage) === 'boolean' && bIsImage) {
					return false;
				} else if (typeof (bIsImage) === 'string') {
					return sFCPath ? '{= ${' + sFCPath + '} >= "1" && !${' + bIsImage + '}}' : '{= !${' + bIsImage + '}}';
				}
				return true;
			}
		},

		getFileName: function(oInterface, oEntitySet){
			var oEntityType = oInterface.getModel(0).getODataEntityType(oEntitySet.entityType);
			var oContentDisposition = oEntityType["Org.OData.Core.V1.ContentDisposition"];
			//if (oContentDisposition.RecordType === "Org.OData.Core.V1.ContentDispositionType") {
			if (oContentDisposition) {
				return "{" + oContentDisposition.Filename.Path + "}";
			}
		    return "{i18n>ST_STREAM_OPEN_FILE}";
		},

		getAcceptableMimeTypes: function(oInterface, oEntitySet){
			var oEntityType = oInterface.getModel(0).getODataEntityType(oEntitySet.entityType);
			var aAcceptableMediaTypes = oEntityType["Org.OData.Core.V1.AcceptableMediaTypes"];
			var sAcceptableMimeType = new String();
			for (var i = 0; i < aAcceptableMediaTypes.length; i++) {
				sAcceptableMimeType = sAcceptableMimeType.concat(aAcceptableMediaTypes[i].String).concat(",");
			}
			return sAcceptableMimeType.slice(0, -1);
		},

		getDeleteStreamVisibility: function(oInterface, oMediaType, bIsDraftEnabled, oEntitySet){
			var oEntityType = oEntitySet && oInterface.getModel(0).getODataEntityType(oEntitySet.entityType);
			var sFCPath = oEntityType && oEntityType["com.sap.vocabularies.Common.v1.FieldControl"] && oEntityType["com.sap.vocabularies.Common.v1.FieldControl"].Path;
			if (bIsDraftEnabled) {
				return sFCPath ? '{= ${' + oMediaType + '} !== "" && ${ui>/editable} && ${' + sFCPath + '} > "1"}' : '{= ${' + oMediaType + '} !== "" && ${ui>/editable}}';
			} else {
				return sFCPath ? '{= ${' + oMediaType + '} !== "" && !${ui>/editable} && ${' + sFCPath + '} > "1"}' : '{= ${' + oMediaType + '} !== "" && !${ui>/editable}}';
			}
		},

		getFileUploaderVisibility: function(oInterface, bIsDraftEnabled, oEntitySet){
			var oEntityType = oEntitySet && oInterface.getModel(1).getODataEntityType(oEntitySet.entityType);
			var sFCPath = oEntityType && oEntityType["com.sap.vocabularies.Common.v1.FieldControl"] && oEntityType["com.sap.vocabularies.Common.v1.FieldControl"].Path;
			var bRestrictions = AnnotationHelper.getUpdateRestrictions(oEntitySet);
			if (bIsDraftEnabled) {
				return sFCPath ? '{= ${ui>/editable} && ${' + sFCPath + '} > "1"}' : '{= ${ui>/editable}}';
			} else {
				if (typeof bRestrictions === "boolean") {
					if (bRestrictions) {
						return sFCPath ? '{= !${ui>/editable} && ${' + sFCPath + '} > "1"}' : '{= !${ui>/editable}}';
					} else {
						return false;
					}
				} else if (typeof bRestrictions === "string") {
					if (typeof sFCPath === "string") {
						return '{= !${ui>/editable} && ${' + sFCPath + '} > "1" && ${' + bRestrictions + '}}';
					}
					return '{= !${ui>/editable} && ${' + bRestrictions + '}}';
				}
			}
		}
    };

		oAnnotationHelperStreamSupport.checkIfEntityOrAssociationHasStreamEnabled.requiresIContext = true;
		oAnnotationHelperStreamSupport.getFileName.requiresIContext = true;
		oAnnotationHelperStreamSupport.getAcceptableMimeTypes.requiresIContext = true;
		oAnnotationHelperStreamSupport.getFileUploaderVisibility.requiresIContext = true;
		oAnnotationHelperStreamSupport.isStreamPresent.requiresIContext = true;
		oAnnotationHelperStreamSupport.getDeleteStreamVisibility.requiresIContext = true;
		oAnnotationHelperStreamSupport.isMimeTypeImage.requiresIContext = true;

    return oAnnotationHelperStreamSupport;
}, /* bExport= */ true);