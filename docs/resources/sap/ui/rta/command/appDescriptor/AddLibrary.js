/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/AppDescriptorCommand"],function(r){"use strict";var e=r.extend("sap.ui.rta.command.appDescriptor.AddLibrary",{metadata:{library:"sap.ui.rta",events:{}}});e.prototype.init=function(){this.setChangeType("appdescr_ui5_addLibraries")};e.prototype.execute=function(){var r=[];if(this.getParameters().libraries){var e=Object.keys(this.getParameters().libraries);e.forEach(function(e){r.push(sap.ui.getCore().loadLibrary(e,true))})}return Promise.all(r)};return e},true);
//# sourceMappingURL=AddLibrary.js.map