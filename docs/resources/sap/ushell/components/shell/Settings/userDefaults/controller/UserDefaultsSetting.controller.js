// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/base/Log","sap/base/util/deepExtend","sap/base/util/extend","sap/base/util/deepEqual","sap/m/Button","sap/m/FlexBox","sap/m/FlexItemData","sap/m/Input","sap/m/library","sap/ui/core/mvc/Controller","sap/ui/core/Configuration","sap/ui/comp/smartfield/SmartField","sap/ui/comp/smartfield/SmartLabel","sap/ui/comp/smartform/Group","sap/ui/comp/smartform/GroupElement","sap/ui/comp/smartvariants/PersonalizableInfo","sap/ui/Device","sap/ui/layout/GridData","sap/ui/model/json/JSONModel","sap/ui/model/odata/ODataModel","sap/ushell/resources","sap/m/MessageBox","./ExtendedValueDialog.controller"],function(e,t,a,r,n,i,s,o,d,l,u,h,m,f,c,p,g,v,y,P,M,S,b){"use strict";var C=d.ButtonType;function x(e,t){if(!(t.editorMetadata&&t.editorMetadata.groupId)){return-1}if(!(e.editorMetadata&&e.editorMetadata.groupId)){return 1}if(e.editorMetadata.groupId<t.editorMetadata.groupId){return-1}if(e.editorMetadata.groupId>t.editorMetadata.groupId){return 1}return 0}function D(e,t){if(!(t.editorMetadata&&t.editorMetadata.parameterIndex)){return-1}if(!(e.editorMetadata&&e.editorMetadata.parameterIndex)){return 1}return e.editorMetadata.parameterIndex-t.editorMetadata.parameterIndex}function V(e,t){var a=x(e,t);if(a===0){return D(e,t)}return a}return l.extend("sap.ushell.components.shell.Settings.userDefaults.controller.UserDefaultsSetting",{onInit:function(){this.oModelRecords={};this.oChangedParameters={};this.oBlockedParameters={};this.aDisplayedUserDefaults=[];this.oDirtyStateModel=new y({isDirty:false,selectedVariant:null});this.getView().setModel(this.oDirtyStateModel,"DirtyState");this.oOriginalParameters={};this.oCurrentParameters={};var t=this.getView();t.setBusy(true);t.setModel(M.getTranslationModel(),"i18n");this.getSystemContextsModel().then(function(e){t.setModel(e,"systemContexts");return this._fillGroups()}.bind(this)).then(this._saveIsSupportedPlatform.bind(this)).then(this._initializeSmartVariantManagement.bind(this)).then(function(){t.setBusy(false)}).catch(function(a){e.error("Error during UserDefaultsSetting controller initialization",a,"sap.ushell.components.shell.Settings.userDefaults.UserDefaultsSetting");t.setBusy(false)})},getSystemContextsModel:function(){var e=new y({systemContexts:[],selectedKey:""});var t=this._getContentProviderIds();var a=sap.ushell.Container.getServiceAsync("ClientSideTargetResolution");var r=sap.ushell.Container.getServiceAsync("UserDefaultParameters");return Promise.all([t,a,r]).then(function(t){var a=t[0];var r=t[1];var n=t[2];if(a.length===0){a.push("")}return Promise.all(a.map(function(t){return r.getSystemContext(t).then(function(t){var a=e.getProperty("/systemContexts");return n.hasRelevantMaintainableParameters(t).then(function(e){if(e){a.push(t)}})})})).then(function(){var t=e.getProperty("/systemContexts");if(t.length>0){e.setProperty("/selectedKey",t[0].id)}return e})})},_getContentProviderIds:function(){return sap.ushell.Container.getServiceAsync("CommonDataModel").then(function(e){return e.getContentProviderIds()}).catch(function(){return[""]})},handleSystemContextChanged:function(){if(this.oDirtyStateModel.getProperty("/isDirty")){var e=M.i18n.getText("userDefaultsSave");var t=M.i18n.getText("userDefaultsDiscard");S.show(M.i18n.getText("userDefaultsUnsavedChangesMessage"),{title:M.i18n.getText("userDefaultsUnsavedChangesTitle"),actions:[e,t,S.Action.CANCEL],emphasizedAction:e,icon:S.Icon.QUESTION,onClose:function(a){if(a===t){this._fillGroups();this._setDirtyState(false)}else if(a===e){this.onSave();this._fillGroups();this._setDirtyState(false)}else{this.getView().getModel("systemContexts").setProperty("/selectedKey",this.sLastSelectedKey)}}.bind(this)})}else{this._fillGroups()}},_fillGroups:function(){var e=this.getView().byId("userDefaultsForm");e.removeAllGroups();var a=this.getView().getModel("systemContexts").getProperty("/selectedKey");var r=this.getView().getModel("systemContexts").getProperty("/systemContexts").find(function(e){return e.id===a});return new Promise(function(a,n){sap.ushell.Container.getServiceAsync("UserDefaultParameters").then(function(n){n.editorGetParameters(r).done(function(r){this.oOriginalParameters=t({},r);this.oCurrentParameters=t({},r);this.oModel=new y(r);this.oModel.setDefaultBindingMode("TwoWay");this.getView().setModel(this.oModel,"MdlParameter");return this._getFormattedParameters(r,this.oModel).then(function(t){var a=this._getContent(t);a.forEach(function(t){e.addGroup(t)})}.bind(this)).then(a)}.bind(this))}.bind(this))}.bind(this))},_getFormattedParameters:function(a,r){var n=Object.keys(a).map(function(n,i){var s=t({},a[n]);s.parameterName=n;s.editorMetadata=s.editorMetadata||{};s.valueObject=t({value:""},s.valueObject);if(s.editorMetadata.editorInfo&&s.editorMetadata.editorInfo.propertyName){return this._createOdataModelBinding(s,r).then(function(e){s.modelBind=e;return s}).catch(function(){e.error("Metadata loading for parameter "+s.parameterName+" failed"+JSON.stringify(s.editorMetadata));s.modelBind=this._createPlainModelBinding(s,r);this.oBlockedParameters[s.parameterName]=false;return Promise.resolve(s)}.bind(this))}s.modelBind=this._createPlainModelBinding(s,r);return Promise.resolve(s)}.bind(this));return Promise.all(n).then(function(e){e.sort(V);this.aDisplayedUserDefaults=e;e.forEach(function(e){e.modelBind.model.setProperty(e.modelBind.sFullPropertyPath,e.valueObject.value);e.modelBind.model.bindTree(e.modelBind.sFullPropertyPath).attachChange(this.storeChangedData.bind(this))}.bind(this));return e}.bind(this))},_createPlainModelBinding:function(e,t){var a="/"+e.parameterName+"/valueObject/value";if(!t.getProperty("/"+e.parameterName+"/valueObject")){t.setProperty("/"+e.parameterName+"/valueObject",{})}var r={isOdata:false,model:t,extendedModel:t,sFullPropertyPath:a,sPropertyName:"{"+a+"}"};return r},_createOdataModelBinding:function(e,t){var a=e.editorMetadata.editorInfo,r=this._getODataServiceData(a.odataURL,e);return r.metadata.then(function(){var e={isOdata:true,model:r.model,extendedModel:t,sPropertyName:"{"+a.propertyName+"}",sFullPropertyPath:a.bindingPath+"/"+a.propertyName};return e})},_getODataServiceData:function(e,t){if(!this.oModelRecords[e]){var a=new P(e,{metadataUrlParams:{"sap-documentation":"heading,quickinfo","sap-value-list":"none","sap-language":u.getLanguageTag()},json:true});a.setDefaultCountMode("None");a.setDefaultBindingMode("TwoWay");this.oModelRecords[e]={attachedListeners:[],model:a,metadata:new Promise(function(e,t){a.attachMetadataLoaded(e);a.attachMetadataFailed(t)})}}if(this.oModelRecords[e].attachedListeners.indexOf(t.parameterName)===-1){this.oModelRecords[e].attachedListeners.push(t.parameterName);this.oModelRecords[e].model.attachRequestCompleted(this._overrideOdataModelValue.bind(this,t));this.oBlockedParameters[t.parameterName]=true}return this.oModelRecords[e]},_overrideOdataModelValue:function(e,t){var a=t.getSource(),r=t.getParameter("url").replace(/\?.*/,""),n=e.editorMetadata.editorInfo.bindingPath+"/"+e.editorMetadata.editorInfo.propertyName,i=e.editorMetadata.editorInfo.odataURL+e.editorMetadata.editorInfo.bindingPath;if(i!==r){return}if(a.getProperty(n)!==e.valueObject.value){a.setProperty(n,e.valueObject.value)}this.oBlockedParameters[e.parameterName]=false},_getContent:function(e){var t="nevermore";var a;var r={};var n=[];for(var i=0;i<e.length;++i){var s=e[i],o=s.modelBind;if(t!==s.editorMetadata.groupId){a=new f({label:s.editorMetadata.groupTitle||undefined,layoutData:new v({linebreak:false})});t=s.editorMetadata.groupId;n.push(a)}var d=new c({});d.setModel(o.model);if(o.isOdata){var l=s.editorMetadata.editorInfo.odataURL;if(!r[l]){var u=s.editorMetadata.editorInfo.bindingPath;d.bindElement(u);r[l]=s.modelBind.model.getContext(u)}else{d.setBindingContext(r[l])}}d.addElement(this._createControl(s));a.addGroupElement(d)}return n},_createControl:function(e){var t,a,r;if(e.editorMetadata.extendedUsage){r=new n({text:M.i18n.getText("userDefaultsExtendedParametersTitle"),tooltip:M.i18n.getText("userDefaultsExtendedParametersTooltip"),type:{parts:["MdlParameter>/"+e.parameterName+"/valueObject/extendedValue/Ranges"],formatter:function(e){return e&&e.length?C.Emphasized:C.Transparent}},press:function(t){b.openDialog(e,this.saveExtendedValue.bind(this))}.bind(this)}).addStyleClass("sapUshellExtendedDefaultParamsButton")}a=new m({width:g.system.phone?"auto":"12rem",textAlign:g.system.phone?"Left":"Right"});if(e.modelBind.isOdata&&e.editorMetadata.editorInfo){t=new h({value:e.modelBind.sPropertyName,name:e.parameterName,fieldGroupIds:["UserDefaults"]});a.setLabelFor(t)}else{t=new o({name:e.parameterName,value:e.modelBind.sPropertyName,fieldGroupIds:["UserDefaults"],type:"Text"});t.addAriaLabelledBy(a);a.setText((e.editorMetadata.displayText||e.parameterName)+":");a.setTooltip(e.editorMetadata.description||e.parameterName)}t.attachChange(this.storeChangedData.bind(this));t.attachChange(this._setDirtyState.bind(this,true),this);t.addStyleClass("sapUshellDefaultValuesSmartField");t.setLayoutData(new s({shrinkFactor:0}));var d=new i({width:g.system.phone?"100%":"auto",alignItems:g.system.phone?"Start":"Center",direction:g.system.phone&&!r?"Column":"Row",items:[a,t,r],wrap:"Wrap"});return d},saveExtendedValue:function(e){var a=e.getSource().getModel().getProperty("/parameterName"),r=this.oModel,n=e.getParameters().tokens||[],i="/"+a+"/valueObject/extendedValue/Ranges",s,o={extendedValue:{Ranges:[]}};t(this.oCurrentParameters[a].valueObject,o);s=n.map(function(e){var t=e.data("range");return{Sign:t.exclude?"E":"I",Option:t.operation!=="Contains"?t.operation:"CP",Low:t.value1,High:t.value2||null}});if(!r.getProperty("/"+a+"/valueObject/extendedValue")){r.setProperty("/"+a+"/valueObject/extendedValue",{})}r.setProperty(i,s);this.oChangedParameters[a]=true;if(e.getParameter("_tokensHaveChanged")){this._setDirtyState(true)}},_setDirtyState:function(e){this.oDirtyStateModel.setProperty("/isDirty",e);this._setSmartVariantModified(e);if(e){this.sLastSelectedKey=this.getView().getModel("systemContexts").getProperty("/selectedKey")}},_setSelectedVariant:function(e){this.oDirtyStateModel.setProperty("/selectedVariant",e);this.storeChangedData()},storeChangedData:function(){var e=this.aDisplayedUserDefaults||[],a,n,i;for(var s=0;s<e.length;++s){a=e[s].parameterName;n=this.oCurrentParameters[a].valueObject;i=e[s].modelBind;if(!this.oBlockedParameters[a]){var o={value:n&&n.value,extendedValue:n&&n.extendedValue};if(i&&i.model){var d=i.model;var l=i.extendedModel;var u=i.sFullPropertyPath;var h=d.getProperty(u)!==""?d.getProperty(u):undefined;var m={value:h,extendedValue:l.getProperty("/"+a+"/valueObject/extendedValue")||undefined};if(!r(m,o)){n.value=h;if(m.extendedValue){n.extendedValue={};t(n.extendedValue,m.extendedValue)}this.oChangedParameters[a]=true}}}}},onCancel:function(){this._setDirtyState(false);var e=Object.keys(this.oChangedParameters),a=this.aDisplayedUserDefaults,r,n,i;if(e.length>0){for(var s=0;s<a.length&&e.length>0;s++){r=a[s].parameterName;if(e.indexOf(r)>-1){i=this.oOriginalParameters[r];n=a[s].modelBind;n.model.setProperty(n.sFullPropertyPath,i.valueObject.value||"");if(i.editorMetadata&&i.editorMetadata.extendedUsage){n.extendedModel.setProperty("/"+r+"/valueObject/extendedValue",i.valueObject.extendedValue||{})}}}this.oCurrentParameters=t({},this.oOriginalParameters);this.oChangedParameters={}}this._setDefaultVariant()},onSave:function(){this.storeChangedData();this._setDirtyState(false);var e=Object.keys(this.oChangedParameters||{}).sort();var t;if(e.length===0){t=Promise.resolve()}else{t=sap.ushell.Container.getServiceAsync("ClientSideTargetResolution").then(function(e){return e.getSystemContext(this.sLastSelectedKey)}.bind(this)).then(function(t){this.oChangedParameters={};return this._saveParameterValues(e,t)}.bind(this))}return t.then(this._resetSmartVariantManagement.bind(this)).then(this._setDefaultVariant.bind(this))},_saveParameterValues:function(e,t){var a=[];var n;var i;var s;var o;for(var d=0;d<e.length;d++){n=e[d];s=this.oCurrentParameters[n].valueObject;o=this.oOriginalParameters[n].valueObject;if(!r(o,s)){if(s&&s.value===null||s&&s.value===""){s.value=undefined}if(s&&s.extendedValue&&Array.isArray(s.extendedValue.Ranges)&&s.extendedValue.Ranges.length===0){s.extendedValue=undefined}i=this._saveParameterValue(n,s,o,t);a.push(i)}}return Promise.all(a)},_saveParameterValue:function(e,t,a,r){return sap.ushell.Container.getServiceAsync("UserDefaultParameters").then(function(n){return new Promise(function(i,s){n.editorSetValue(e,t,r).done(function(){a.value=t.value;i()}).fail(s)})})},_setSmartVariantModified:function(e){if(!this._bIsSupportedPlatform){return}this.getView().byId("defaultSettingsVariantManagement").currentVariantSetModified(e)},_setDefaultVariant:function(){if(!this._bIsSupportedPlatform){return}var e=this.getView().byId("defaultSettingsVariantManagement");e.setCurrentVariantId(e.getDefaultVariantKey());this._setSelectedVariant(e.getDefaultVariantKey())},_resetSmartVariantManagement:function(){if(!this._bIsSupportedPlatform){return Promise.resolve()}this.getView().byId("defaultSettingsVariantManagement").removeAllPersonalizableControls();return this._initializeSmartVariantManagement()},_initializeSmartVariantManagement:function(){if(!this._bIsSupportedPlatform){return Promise.resolve()}var e=this.getView().byId("defaultSettingsVariantManagement"),t=function(){this._setSelectedVariant(e.getSelectionKey())}.bind(this);return new Promise(function(a){var r=this.getView().byId("userDefaultsForm"),n=new p({type:"wrapper",keyName:"persistencyKey",dataSource:"none",control:r});e.detachSelect(t).detachAfterSave(t).addPersonalizableControl(n).attachSelect(t).attachAfterSave(t).initialise(function(){e.setVisible(true);a()},r)}.bind(this)).then(t)},_saveIsSupportedPlatform:function(){var e=sap.ushell.Container.getLogonSystem().getPlatform();this._bIsSupportedPlatform=e!=="cdm";return Promise.resolve(this._bIsSupportedPlatform)},displayDiffText:function(){if(!this._bIsSupportedPlatform){return false}var e=this.getView().byId("defaultSettingsVariantManagement"),t=this.getView().byId("userDefaultsForm"),a=e.getStandardVariantKey(),n=e.getSelectionKey(),i,s;if(n===a){return false}i=e.getVariantContent(t,a);s=e.getVariantContent(t,n);delete s.executeOnSelection;return!r(i,s)}})});
//# sourceMappingURL=UserDefaultsSetting.controller.js.map