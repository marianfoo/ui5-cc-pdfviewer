sap.ui.define(["sap/ui/base/Object","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/base/util/extend","sap/suite/ui/generic/template/lib/MessageUtils","sap/ui/model/json/JSONModel"],function(e,t,n,r,o,i){"use strict";var a=new t({filters:[new t({path:"type",operator:n.EQ,value1:sap.ui.core.MessageType.Warning}),new t({path:"type",operator:n.EQ,value1:sap.ui.core.MessageType.Error})],and:false});var s=new t({path:"type",operator:n.EQ,value1:sap.ui.core.MessageType.Error});var u="model";function c(e,n,r){var c,l;var g;var f=function(){var t=n.getOwnerComponent();var r=e.componentRegistry[t.getId()];return!!(r.methods.showConfirmationOnDraftActivate&&r.methods.showConfirmationOnDraftActivate())}();function p(t){var n=e.oNavigationControllerProxy.getActiveComponents();var r;for(var o=0;o<n.length&&!r;o++){var i=n[o];var a=e.componentRegistry[i];r=a.viewLevel&&(a.methods.getScrollFunction||Function.prototype)(t)}return r||null}function v(f,v,m){var d=m&&m.messagesForUserDecison;return new Promise(function(y){var h,C,M;r.getDialogFragmentAsync("sap.suite.ui.generic.template.fragments.MessageInfluencingCRUDAction",{onMessageSelect:function(){C.setProperty("/backbtnvisibility",true)},onBackButtonPress:function(){M.navigateBack();C.setProperty("/backbtnvisibility",false)},onAccept:function(){(c||Function.prototype)();h.close()},onReject:function(){(l||Function.prototype)();h.close()},isPositionable:function(e){return!!(e&&p(e))},titlePressed:function(e){h.close();var t=e.getParameter("item");var n=t.getBindingContext("msg").getObject();var r=p(n.controlIds);(r||Function.prototype)();h.close()},afterClose:function(){c=null;l=null;M.navigateBack()}},u,function(e){M=e.getContent()[0];e.setModel(sap.ui.getCore().getMessageManager().getMessageModel(),"msg");g=e.getContent()[0].getBinding("items")}).then(function(c){h=c;C=h.getModel(u);var l=d?new i(d):sap.ui.getCore().getMessageManager().getMessageModel();c.setModel(l,"msg");C.setProperty("/situation",f);C.setProperty("/backbtnvisibility",false);var p=a;var M=s;var b=n.getOwnerComponent().getModel("ui");var P=b.getProperty("/createMode");g=c.getContent()[0].getBinding("items");if(!d){var w=[];var A=e.oNavigationControllerProxy.getActiveComponents();var E=f<3;for(var D=0;D<A.length;D++){var F=A[D];var x=e.componentRegistry[F];if(x.oController===n||f!==2){var O=(x.methods.getMessageFilters||Function.prototype)(E);w=O?w.concat(O):w}}if(w.length===0){y(null);return}p=w.length===1?w[0]:new t({filters:w,and:false})}if(f===3){M=new t({filters:[p,s],and:true});p=new t({filters:[p,a],and:true});var T;switch(v){case"Delete":T=r.getText("DELETE");break;case"BOPFAction":T=m.actionName;break;default:if(P){T=r.getText("CREATE")}else{T=r.getText("SAVE")}}C.setProperty("/CRUDAction",T);if(g.filter(M).getLength()===0){C.setProperty("/situation",4)}}g.filter(p);var B=g.getCurrentContexts().map(function(e){return e.getObject()});var R=o.getMessageDialogTitleAndSeverity(B,e);C.setProperty("/title",R.sTitle);C.setProperty("/messageType",R.sSeverity);y(g.getLength()&&h)})})}function m(e){return new Promise(function(t,n){var r;v(e?1:2).then(function(o){r=o;if(r){r.open();return n()}if(!(e&&f)){return t()}v(3).then(function(e){r=e;if(r){c=t;l=n;r.open()}else{t()}})})})}function d(t,n){e.oApplicationProxy.performAfterSideEffectExecution(function(){m(t).then(n)},true)}function y(t,n,r,o){c=t;l=n;return v(3,r,o).then(function(t){if(t){e.oBusyHelper.getUnbusy().then(function(){t.open()},function(){t.open()})}else{n()}})}function h(e,t,n,r,o){if(e===4){return y(t,n,r,o)}else{return d(e===1,t)}}function C(){return new Promise(function e(t){v(1).then(function(e){t(!!e)})})}return{handleCRUDScenario:h,hasValidationMessageOnDetailsViews:C}}return e.extend("sap.suite.ui.generic.template.lib.CRUDActionHandler",{constructor:function(e,t,n){r(this,c(e,t,n))}})});
//# sourceMappingURL=CRUDActionHandler.js.map