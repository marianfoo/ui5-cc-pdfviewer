sap.ui.define(["sap/ui/base/Object","sap/base/util/extend","sap/suite/ui/generic/template/js/AnnotationHelper"],function(t,n,e){"use strict";function a(t){function n(t,n,a,i){return e.getStableIdPartForDatafieldActionButton(t,a)+(n?e.getSuffixFromIconTabFilterKey(n):"")+(i?"::chart":"")}function a(t,e,a,i,o){var r=Object.create(null);var c=t.Action.String.split("/")[1];if((!t.Inline||t.Inline.Bool==="false")&&e.annotatedActions&&e.annotatedActions[c]){r={id:n(t,a,i,o),action:e.annotatedActions[c].command,callbackName:"._templateEventHandlers.onCallActionFromToolBar",annotatedAction:true}}return r}function i(e,a,i,o,r,c){if(!e.Inline||e.Inline.Bool==="false"){var l=Object.keys(a.outbounds||{}).find(function(n){var a=t.utils.getOutboundNavigationIntent(i,n);return a.semanticObject===e.SemanticObject.String&&a.action===e.Action.String});if(l){return{id:n(e,o,r,c),action:a.outbounds[l].command,callbackName:"._templateEventHandlers.onDataFieldForIntentBasedNavigation",outboundAction:true}}}return Object.create(null)}return{getToolbarDataFieldForActionCommandDetails:a,getToolbarDataFieldForIBNCommandDetails:i}}return t.extend("sap.suite.ui.generic.template.lib.CommandComponentUtils",{constructor:function(t){n(this,a(t))}})});
//# sourceMappingURL=CommandComponentUtils.js.map