/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/util/changeVisualization/ChangeVisualizationUtils"],function(i){"use strict";var e={};e.getDescription=function(e,t){var a=sap.ui.getCore().getLibraryResourceBundle("sap.ui.rta");var r=e.originalLabel?"TXT_CHANGEVISUALIZATION_CHANGE_RENAME_FROM_TO":"TXT_CHANGEVISUALIZATION_CHANGE_RENAME_TO";var n=a.getText(r,[i.shortenString(e.newLabel)||t,i.shortenString(e.originalLabel)]);var o=a.getText(r,[e.newLabel||t,e.originalLabel]);return{descriptionText:n,descriptionTooltip:o}};return e});
//# sourceMappingURL=RenameVisualization.js.map