/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./BaseContentRenderer","../library"],function(t,e){"use strict";var i=e.AttributesLayoutType;var n=t.extend("sap.ui.integration.cards.ListContentRenderer",{apiVersion:2});n.renderContent=function(t,e){t.renderControl(e.getAggregation("_content"));if(e.getAggregation("_legend")){t.renderControl(e.getAggregation("_legend"))}};n.getMinHeight=function(t,e,i){var n=i.getContentPageSize(t),r;if(!t||!t.item||!n){return this.DEFAULT_MIN_HEIGHT}r=this.getItemMinHeight(t,e);return n*r+"rem"};n.getItemMinHeight=function(t,e){if(!t||!t.item){return 0}var n=this.isCompact(e),r=t.item,o=n?1:1.125,a=n?1:1.625,g;if(r.icon&&!r.description){a=n?0:.75;o=2}if(r.description){a=2;o+=n?2:1.875}if(r.attributes){a=2.25;g=r.attributes.length/2;if(r.attributesLayoutType===i.OneColumn){g=r.attributes.length}g=Math.ceil(g);o+=g*1.5}if(r.chart){o+=1}if(r.actionsStrip){a=1;o+=n?3:3.75}o+=a;return o};return n});
//# sourceMappingURL=ListContentRenderer.js.map