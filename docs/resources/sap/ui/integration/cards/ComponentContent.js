/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/cards/BaseContent","./ComponentContentRenderer","sap/ui/core/ComponentContainer","sap/ui/core/Component"],function(n,t,e,a){"use strict";var i=n.extend("sap.ui.integration.cards.ComponentContent",{metadata:{library:"sap.ui.integration"},renderer:t});a._fnOnInstanceCreated=function(n){var t=n.getComponentData();if(t&&t["__sapUiIntegration_card"]&&n.onCardReady){n.onCardReady(t["__sapUiIntegration_card"])}};i.prototype.setConfiguration=function(t){n.prototype.setConfiguration.apply(this,arguments);t=this.getParsedConfiguration();if(!t){return}var a=new e({manifest:t.componentManifest,async:true,settings:{componentData:{__sapUiIntegration_card:this.getCardInstance()}},componentCreated:function(){this.fireEvent("_actionContentReady");this.fireEvent("_updated")}.bind(this),componentFailed:function(){this.fireEvent("_actionContentReady");this.handleError("Card content failed to create component")}.bind(this)});this.setAggregation("_content",a)};return i});
//# sourceMappingURL=ComponentContent.js.map