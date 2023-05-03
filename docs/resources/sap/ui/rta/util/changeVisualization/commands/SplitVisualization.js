/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Core","sap/ui/rta/util/changeVisualization/ChangeVisualizationUtils"],function(t,e){"use strict";var i={};i.getDescription=function(i,r){var T=t.getLibraryResourceBundle("sap.ui.rta");var a=T.getText("TXT_CHANGEVISUALIZATION_CHANGE_SPLIT",e.shortenString(r));var n=T.getText("TXT_CHANGEVISUALIZATION_CHANGE_SPLIT",r);var u=T.getText("BTN_CHANGEVISUALIZATION_SHOW_DEPENDENT_CONTAINER_SPLIT");return{descriptionText:a,descriptionTooltip:n,buttonText:u}};return i});
//# sourceMappingURL=SplitVisualization.js.map