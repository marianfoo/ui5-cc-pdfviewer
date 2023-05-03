/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(t){"use strict";var e=t.extend("sap.ui.rta.command.AddIFrame",{metadata:{library:"sap.ui.rta",properties:{baseId:{type:"string",group:"content"},targetAggregation:{type:"string",group:"content"},index:{type:"int",group:"content"},url:{type:"string",group:"content"},width:{type:"string",group:"content"},height:{type:"string",group:"content"},changeType:{type:"string",defaultValue:"addIFrame"}},associations:{},events:{}}});e.prototype.applySettings=function(e){var n={};Object.keys(e).filter(function(t){return t!=="url"}).forEach(function(t){n[t]=e[t]});var r=[].slice.call(arguments);r[0]=n;t.prototype.applySettings.apply(this,r);this.setUrl(e.url)};e.prototype._getChangeSpecificData=function(){var e=t.prototype._getChangeSpecificData.call(this);var n=e.changeType;delete e.changeType;return{changeType:n,content:e}};return e},true);
//# sourceMappingURL=AddIFrame.js.map