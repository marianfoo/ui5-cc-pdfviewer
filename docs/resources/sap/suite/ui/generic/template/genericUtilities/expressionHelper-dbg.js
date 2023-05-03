
sap.ui.define([
    "sap/ui/model/odata/AnnotationHelper",
    "sap/m/Text"
], function(AnnotationHelperModel, Text) {
    "use strict";
    //fnGetPropertySetting evaluates and returns the property setting using the oData API
    //Any i18n expression is replaced with i18n text
    function fnGetPropertySetting(oModel, sEntitySet, sAnnotation, oResourceBundle) {
        var oMetaModel = oModel.getMetaModel();
        var oMetaModelContext = oMetaModel.getContext(oMetaModel.getMetaContext("/" + sEntitySet).getPath() + sAnnotation);
        var sPropertySetting = AnnotationHelperModel.format(oMetaModelContext);
        if (sPropertySetting) {
            //match returns an array of length = 1
            var aMatch = sPropertySetting.match(/{@i18n>.+}/gi);
            //aMatch will be null if no i18n expresion present
            if (aMatch) {
                var sSplitText = "{@i18n>";
                aMatch[0].split(sSplitText).forEach(function(sItem) {
                    if (sItem) {
                        //if resource bundle not present set the i18n text to empty string
                        //sItem always ends with "}". Example: @GeneralInfoFacetLabel}
                        var nEndIndex = sItem.indexOf("}");
                        var sI18nKey = sItem.substring(0, nEndIndex);
                        var sI18Text = oResourceBundle ? oResourceBundle.getText(sI18nKey) : "";
                        sPropertySetting = sPropertySetting.replace(sSplitText + sItem.substring(0, nEndIndex + 1), sI18Text);
                    } 
                });
            }
        }
        //Return "" if no Annotation present in metamodel
        return sPropertySetting || "";
    }
    var oExpressionHelper = {
        /** 
        * This method creates an UI5 control on the fly, applies the annotation expression uisng oControl.applySettings, creating a property binding in the control.
        * This binding is re-evaluated each time the binding context changes.
        * @param {object} oModel - Model object
        * @param {string} sEntitySet - entitySet which has the annotation
        * @param {string} sAnnotation - Ex: "/com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value"
        * @param {object} oResourceBundle - Optional parameter, required if annotation has i18n text
        * 
        * @return {object} has two methods: 1. format - takes context and returns formatted text. 2. done - cleanup after formatter is no longer required
        */
        getAnnotationFormatter: function(oModel, sEntitySet, sAnnotation, oResourceBundle) {
            //Creating UI5 control on the fly is necessary as currently no direct API is available to evaluate expression in JS code.
            var oHelperControl = new Text();
            oHelperControl.applySettings({text : fnGetPropertySetting(oModel, sEntitySet, sAnnotation, oResourceBundle)});
            oHelperControl.setModel(oModel);
            return {
                format: function(oContext) {
                    //UI5 control evaluates the property expression each time the binding context changes.
                    oHelperControl.setBindingContext(oContext);
                    //setBindingContext is synchronous, thus resolved text can be extracted immediately using oControl.getText()
                    return oHelperControl.getText();
                },
                done: function() {
                    oHelperControl.destroy();//Destroy UI5 control as per UI5 documentation
                }
            };   
        }      
    };
    return oExpressionHelper;
});
