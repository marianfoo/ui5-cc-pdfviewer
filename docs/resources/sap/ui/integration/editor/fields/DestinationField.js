/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/editor/fields/BaseField","sap/m/Select","sap/ui/core/ListItem"],function(e,t,i){"use strict";var n=e.extend("sap.ui.integration.editor.fields.DestinationField",{metadata:{library:"sap.ui.integration"},renderer:e.getMetadata().getRenderer()});n.prototype.initVisualization=function(e){var n=e.visualization;if(!n){n={type:t,settings:{busy:{path:"currentSettings>_loading"},selectedKey:{path:"currentSettings>value"},forceSelection:false,width:"100%",items:{path:"currentSettings>_values",template:new i({text:"{currentSettings>name}",key:"{currentSettings>name}"})}}}}this._visualization=n};return n});
//# sourceMappingURL=DestinationField.js.map