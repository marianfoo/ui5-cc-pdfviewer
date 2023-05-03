/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/library","./Validators","./BindingResolver","sap/base/Log"],function(e,t,r,n){"use strict";var a=e.ValueState;function i(e){if(e.isA("sap.m.ComboBox")){return{key:e.getSelectedKey(),value:e.getValue()}}else{return e.getValue()}}function o(e){switch(e.type){case"ComboBox":return"keyValuePair";default:return"string"}}function s(e,t){var r="/"+e._oItem.id,n=t.getData(),i,o=false;e.setValueState(a.None);for(i=0;i<n.records.length;i++){if(n.records[i].bindingPath===r){n.records.splice(i,1);o=true;break}}if(o){t.setData(n)}}function u(e){var t=e.getProperty("/records");e.setProperty("/hasErrors",!!t.find(function(e){return e.type===a.Error}));e.setProperty("/hasWarnings",!!t.find(function(e){return e.type===a.Warning}))}function f(e,t){var r;if(!e.startsWith("extension.")){n.error("Validation function should start with 'extension.'");return false}if(!t){n.error("Extension is not defined.");return false}r=e.replace("extension.","");if(!t[r]){n.error("No such function.",r,"sap.ui.integration.widgets.Card");return false}return r}var l={validateControl:function(e,n,l){var d=i(e),g=n.getModel("messages"),c=n.getModel("i18n").getResourceBundle(),p=n.getAggregation("_extension"),v=e._oItem,h,V,y,x,b,S,m,P=false,w,B;s(e,g);if(!v||!v.validations){return}B=r.resolveValue(v.validations,e,e.getBindingContext().getPath());h=o(v);V=t[h];B.forEach(function(t){for(var r in t){if(P){return}y=t[r];if(r==="validate"){var n=f(y,p);if(n){x=p[n]}}else{x=V[r]}if(typeof x!=="function"){continue}m=x(d,y);if(!m){b=t.type||a.Error;S=t.message||c.getText(V[r+"Txt"],y);w=g.getData();w.records.push({message:S,type:b,bindingPath:"/"+v.id});g.setData(w);if(l||e._bShowValueState){e._bShowValueState=true;e.setValueState(b);e.setValueStateText(S)}P=true}}});u(g)},getRequiredValidationValue:function(e){var t=e.validations||[],r,n,a;for(n=0;n<t.length;n++){r=t[n];for(a in r){if(a==="required"){return r[a]}}}return false}};return l});
//# sourceMappingURL=Forms.js.map