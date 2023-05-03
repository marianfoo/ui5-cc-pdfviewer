sap.ui.define(["sap/ui/base/Object","sap/suite/ui/generic/template/genericUtilities/controlHelper","sap/ui/dom/getFirstEditableInput","sap/base/util/extend"],function(e,t,n,i){"use strict";function r(e,i){var r="@$ui5.context.isTransient";var a;var o;var s=new Map;var u;var f=2;function c(){a=new Map}function l(e){return e.data("inlineCreationRows")==="true"}function g(e){return e.data("isEntityCreatableUsingBooleanRestrictions")==="true"&&e.data("isEntityCreatableUsingPathRestrictions")}function v(e){var t=e.getSource();var n=e.getParameters().bindingParams;var i=n.events.dataReceived||Function.prototype;n.events.dataReceived=function(e){i.call(this,e);d(t)}}function d(n){var r=e.getModel("ui");var a=n.getTable();var o=t.isMTable(a)||t.isUiTable(a);var s=i.oComponentUtils.isDraftEnabled();var u=l(n);if(o&&s&&u){b(n,r)}}function b(e,t){a.set(e.getId(),true);if(t.getProperty("/editable")){R(e).then(function(t){h(e,t)})}if(!u){t.bindProperty("/editable").attachChange(p.bind(null));u=true}}function p(e){if(e.getSource().getValue()){a.forEach(function(e,t){if(e){var n=sap.ui.getCore().byId(t);R(n).then(function(e){h(n,e)})}})}}function h(e,n){var i=e.getTable();var r=t.isMTable(i);var s=i.getBinding(r?"items":"rows");var u=r||s.isLengthFinal();var c=g(e);if(s.isFirstCreateAtEnd()===undefined&&u&&s.getContext()&&c){var l;for(l=0;l<f;l++){m(s,n,r?l!==0:true)}a.set(e.getId(),false)}var v=y.bind(null,i);P(i,v);o=o||new Set;if(!o.has(s)){C(e,s);o.add(s)}}function C(e,t){t.attachCreateActivate(function(){R(e).then(function(n){m(t,n,true);y(e.getTable())})})}function m(e,t,n){e.create(t,n,{inactive:true})}function R(e){return new Promise(function(t){var n=i.oServices.oCRUDManager.getDefaultValues(e,null,true);if(n instanceof Promise){n.then(function(e){var n=e[0];t(n)}).catch(function(){t(null)})}else{t(null)}})}function P(e,t){var n;if(e.getDomRef()){t()}else{n=e.addEventDelegate({onAfterRendering:function(){t();e.removeEventDelegate(n)}})}}function y(e){if(t.isMTable(e)){w(e)}}function w(e){var t,n=e.getId(),i=e.getItems().filter(function(e){var t=e.getBindingContext().isTransient();var n=e.getBinding("type")&&e.getBinding("type").getPath()===r;return t&&!n});if(i.length===0){return}if(s.get(n)){t=s.get(n)}else{t=i.at(0).getProperty("type");s.set(n,t)}i.forEach(function(e){var n=I.bind(null,e,t);P(e,n)})}function I(e,t){var n=e.getDeleteControl();e.bindProperty("type",{path:r,formatter:function(e){return e?"Inactive":t}});n&&n.bindProperty("visible",{path:r,formatter:function(e){return!e}});var a=e.getBindingContext().created();a&&a.then(function(){e.isSelected()&&i.oCommonUtils.setEnabledToolbarButtons(e)})}function x(e,t){var n=t.getFirstVisibleRow();var i=t.getVisibleRowCount();var r=e.getPath();for(var a=0;a<i;a++){if(t.getContextByIndex(n+a).getPath()===r){return t.getRows()[a]}}}function B(e){var t=e.getBinding("rows").getLength(),i=[],r=[];for(var a=0;a<t;a++){var o=e.getContextByIndex(a);i.push(o);r.push(o.isInactive())}var s=r.lastIndexOf(false);var u=r.indexOf(true);if(s!==-1){e.setFirstVisibleRow(s)}if(u!==-1){setTimeout(function(){var t=i[u];var r=x(t,e);var a=r&&n(r.getDomRef());if(a){a.focus()}},0)}}return{onBeforeRebindObjectPage:c,addCreationRowsImpl:h,onBeforeRebindControl:v,isInlineCreationRowsEnabled:l,scrollToLastPersistedRecord:B}}return e.extend("sap.suite.ui.generic.template.ObjectPage.controller.InlineCreationRowsHelper",{constructor:function(e,t){i(this,r(e,t))}})});
//# sourceMappingURL=InlineCreationRowsHelper.js.map