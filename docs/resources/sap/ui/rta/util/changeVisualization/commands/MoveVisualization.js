/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/util/changeVisualization/ChangeVisualizationUtils","sap/ui/core/util/reflection/JsControlTreeModifier"],function(t,e){"use strict";var r={};r.getDescription=function(r,i,n){var o=sap.ui.getCore().getLibraryResourceBundle("sap.ui.rta");var a=o.getText("TXT_CHANGEVISUALIZATION_CHANGE_MOVE_WITHIN",t.shortenString(i));var T=o.getText("TXT_CHANGEVISUALIZATION_CHANGE_MOVE_WITHIN",i);var I;var N=n.appComponent;var A=r.sourceContainer&&e.getControlIdBySelector(r.sourceContainer,N);var C=r.targetContainer&&e.getControlIdBySelector(r.targetContainer,N);if(A!==C){a=o.getText("TXT_CHANGEVISUALIZATION_CHANGE_MOVE",t.shortenString(i));T=A&&o.getText("TXT_CHANGEVISUALIZATION_CHANGE_MOVE",i)||"";I=A&&o.getText("BTN_CHANGEVISUALIZATION_SHOW_DEPENDENT_CONTAINER_MOVE")}return{descriptionText:a,descriptionTooltip:T,buttonText:I}};return r});
//# sourceMappingURL=MoveVisualization.js.map