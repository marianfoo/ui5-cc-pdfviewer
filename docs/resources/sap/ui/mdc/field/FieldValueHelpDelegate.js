/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/field/FieldHelpBaseDelegate","sap/ui/model/FilterType"],function(e,i){"use strict";var n=Object.assign({},e);n.determineSearchSupported=function(e,i){};n.isSearchSupported=function(e,i){return false};n.executeSearch=function(e,i,n){};n.adjustSearch=function(e,i,n){return n};n.executeFilter=function(e,n,t,u,c){if(n.isA("sap.ui.model.json.JSONListBinding")){n.filter(t,i.Application);u()}else{n.attachEventOnce("dataReceived",u);n.initialize();n.filter(t,i.Application);n.getContexts(0,c)}};n.checkBindingsPending=function(e,i){return null};n.checkListBindingPending=function(e,i){if(i&&(i.isSuspended()||i.getLength()===0)){return false}return true};return n});
//# sourceMappingURL=FieldValueHelpDelegate.js.map