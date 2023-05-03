sap.ui.define(["sap/ui/layout/DynamicSideContent","sap/suite/ui/generic/template/js/StableIdHelper","sap/suite/ui/generic/template/genericUtilities/controlHelper","sap/suite/ui/generic/template/lib/info/CommonInfo","sap/suite/ui/generic/template/genericUtilities/FeLogger"],function(e,t,n,i,o){"use strict";function r(e,t,n,i,o,r){var c={bWaitForViewportEnter:t,waitFor:{bLayoutFinished:e,bStateApplied:n,bRebindCompleted:i},activeHandler:o||function(e,t){var n=a(e);var i;if(n.length&&n[0].getBindingContext()===null){s(undefined,e);i=true}if(i||t.getRefreshRequired()){t.refresh(null,true,true)}},inActiveHandler:r||function(e,t){s(null,e)}};return c}function a(e){var t=e.getBlocks().concat(e.getMoreBlocks()).concat(e.getActions());return t}function s(e,t){var n=a(t);n.forEach(function(t){t.setBindingContext(e)})}function c(o,a,s,c){var u;var l;var g;var f;var d=true;var C=new i(["subSection","subSectionNotWaitingForViewPort"],b);function p(){C.pushCategory("subSection",true);if(o.sideContentSettings){g=s.oSideContentHandler.initSideContentInfoObject(o.sideContentSettings)}var e=o.blocks||[];e=e.concat(o.moreBlocks||[]);e.forEach(function(e){if(e.tableSettings){c.initializeSmartTableInfoObject(e)}else if(e.chartSettings){c.initializeSmartChartInfoObject(e)}});var t=o.loadingStrategy;switch(t){case"lazyLoadingAfterHeader":f=r(true,true,false,true);break;case"activateAfterHeaderDataReceived":f=r(true,false,false,true);break;case"activateWithBindingChange":f=r(false,false,false,true);break;case"reuseComponent":f=r(true,true,false,true,S,h);break;case"lazyLoading":f=r(false,true,false,true);break;default:f=r(false,false,false,false,Function.prototype,Function.prototype);break}if(!f.bWaitForViewportEnter){C.pushCategory("subSectionNotWaitingForViewPort",true)}}function b(t){l=t;if(g){var n=l.getBlocks();if(n&&n.length>0&&n[0]instanceof e){g.setControl(n[0])}}}function S(e){var t=e.getBlocks()[0];s.oComponentUtils.onVisibilityChangeOfReuseComponent(true,t)}function h(e){var t=e.getBlocks()[0];s.oComponentUtils.onVisibilityChangeOfReuseComponent(false,t)}function v(t,i,o,r){if(r instanceof e){r=r.getMainContent()[0]}else if(!r.getContent){return}r.getContent().forEach(function(e){if(n.isSmartTable(e)){if(i||t[e.getEntitySet()]){d=false;if(e.isInitialised()){s.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(e).refresh(null,o)}else{e.attachInitialise(s.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(e).refresh.bind(null,null,o))}if(!i&&a.getOwnerComponent().getBindingContext()){s.oServices.oApplicationController.executeSideEffects(a.getOwnerComponent().getBindingContext(),[],[e.getTableBindingPath()])}}}})}function y(e,t,n){C.getControlAsync().then(function(){var i=l.getBlocks().concat(l.getMoreBlocks()).concat(l.getActions());var o=v.bind(null,e,t,n);i.forEach(o)})}function m(){if(!u){var e;if(o.loadingStrategy==="reuseComponent"||o.extensionPointNamePrefix){e=o.id}else{e=t.getStableId({type:"ObjectPage",subType:"SubSection",sFacet:o.additionalData.facetId})}u=a.getView().createId(e)}return u}function k(){return f}p();return{restrictedObject:{setControl:C.setControl,getControlAsync:C.getControlAsync,getId:m,refresh:y,getLoadingStrategy:k,getSettings:function(){return o},getRefreshRequired:function(){return d}},getCategories:C.getCategories,pushCategory:function(e){return C.pushCategory(e)},getSupportedCategories:C.getSupportedCategories,getPendingExecutions:C.getPendingExecutions,pushPendingExecutions:C.pushPendingExecutions}}return c});
//# sourceMappingURL=SubSectionInfo.js.map