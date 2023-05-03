sap.ui.define(["sap/ui/base/Object","sap/base/util/extend","sap/suite/ui/generic/template/genericUtilities/controlHelper","sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/SmartFilterBarWrapper","sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/SmartTableWrapper","sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/SmartChartWrapper","sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/DynamicPageWrapper","sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/SmartVariantManagementWrapper","sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/ObjectPageLayoutWrapper","sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/SearchFieldWrapper"],function(e,t,a,r,i,n,c,s,p,o){"use strict";var u={getState:Function.prototype,setState:Function.prototype,attachStateChanged:Function.prototype,detachStateChanged:Function.prototype,getLocalId:Function.prototype,isCurrentState:function(e){return true}};function g(e){var g={};function l(e){var a=false;var r={setState:function(t){a=true;e.setState(t);a=false},attachStateChanged:function(t){e.attachStateChanged(function(){if(!a){t()}})}};return t({},e,r)}var S={getSuppressChangeEventWhenApplyingWrapper:l,getControlStateWrapper:function(t,l){if(!t){return u}var f=e.getView().getLocalId(t.getId());if(!g[f]){var m;switch(true){case a.isSmartFilterBar(t):m=new r(t,S,l);break;case a.isSmartTable(t):m=new i(t,e,S);break;case a.isSmartChart(t):m=new n(t,e,S);break;case a.isDynamicPage(t):m=new c(t);break;case a.isSmartVariantManagement(t):m=new s(t,e,S,l);break;case a.isObjectObjectPageLayout(t):m=new p(t);break;case a.isSearchField(t):m=new o(t);break;default:m=u}m.getLocalId=function(){return f};m.isCurrentState=m.isCurrentState||function(e){return JSON.stringify(e)===JSON.stringify(m.getState())};g[f]=m}return g[f]},getControlStateWrapperById:function(t,a,l){if(!t||!a){return u}var f=e.getView().getLocalId(t);if(!g[f]){var m;switch(a){case"SmartFilterBar":m=new r(t,S,l);break;case"SmartTable":m=new i(t,e,S);break;case"SmartChart":m=new n(t,e,S);break;case"DynamicPage":m=new c;break;case"SmartVariantManagement":m=new s(t,e,S,l);break;case"ObjectPageLayout":m=new p(t);break;case"SearchField":m=new o(t);break;default:m=u}m.getLocalId=function(){return f};m.isCurrentState=m.isCurrentState||function(e){return JSON.stringify(e)===JSON.stringify(m.getState())};g[f]=m}return g[f]}};return S}return e.extend("sap.suite.ui.generic.template.genericUtilities.ControlStateWrapperFactory",{constructor:function(e){t(this,g(e))}})});
//# sourceMappingURL=ControlStateWrapperFactory.js.map