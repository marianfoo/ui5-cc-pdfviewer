/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./AnalyticsCloudContentRenderer","./BaseContent","sap/ui/integration/library","sap/ui/core/HTML","sap/ui/integration/util/BindingResolver","sap/base/Log"],function(t,i,r,h,e,a){"use strict";var s=r.CardActionArea;var n=i.extend("sap.ui.integration.cards.AnalyticsCloudContent",{metadata:{library:"sap.ui.integration"},renderer:t});n.prototype.init=function(){i.prototype.init.apply(this,arguments);var t=this.getId()+"-highchartContainer";this._oHighchartContainer=new h(t,{content:"<div id="+t+" class='sapFCardAnalyticsCloudContentHCC'></div>"});this.setAggregation("_content",this._oHighchartContainer)};n.prototype.exit=function(){i.prototype.exit.apply(this,arguments);if(this._oHighchart){this._oHighchart.destroy();this._oHighchart=null}if(this._oHighchartContainer){this._oHighchartContainer.destroy();this._oHighchartContainer=null}};n.prototype.loadDependencies=function(t){return this._loadHighcharts()};n.prototype.setConfiguration=function(t){i.prototype.setConfiguration.apply(this,arguments);t=this.getParsedConfiguration();this.fireEvent("_actionContentReady");this._oActions.attach({area:s.Content,actions:t.actions,control:this})};n.prototype.onAfterRendering=function(){this._createHighchart()};n.prototype._loadHighcharts=function(){var t=this.getCardInstance(),i=n.SAC_DESTINATION_KEY,r=t.resolveDestination(i);return r.then(function(t){return n.loadHighcharts(t)},function(t){return Promise.reject("Destination with key '"+i+"' is required for AnalyticsCloud card. It could not be resolved. Reason: '"+t+"'")})};n.prototype._createHighchart=function(){if(this._bIsBeingDestroyed){return}var t=this.getCardInstance(),i=this.getParsedConfiguration(),r=this.getBindingContext(),h,s;if(!t.isReady()){t.attachEventOnce("_ready",this._createHighchart,this);return}if(!window.Highcharts){this.handleError("There was a problem with loading Highcharts library. Could not initialize AnalyticsCloud card content.");return}if(!this._oHighchartContainer){a.error("Highcharts container is not created or destroyed.");return}if(r){h=r.getPath()}s=e.resolveValue(i.options,this,h);this._oHighchart=new window.Highcharts.Chart(this._oHighchartContainer.getId(),s)};n.SAC_DESTINATION_KEY="sac";n.HIGHCHART_MODULES={"highcharts/highstock":{amd:true,exports:"Highcharts"},"highcharts/highcharts-more":{deps:["highcharts/highstock"]},"highcharts/solid-gauge":{deps:["highcharts/highstock","highcharts/highcharts-more"]},"highcharts/histogram-bellcurve":{deps:["highcharts/highstock"]},"highcharts/no-data-to-display":{deps:["highcharts/highstock"]},"highcharts/wordcloud":{deps:["highcharts/highstock"]},"highcharts/variable-pie":{deps:["highcharts/highstock"]},"highcharts/heatmap":{deps:["highcharts/highstock"]},"highcharts/treemap":{deps:["highcharts/highstock"]},"highcharts/variwide":{deps:["highcharts/highstock"]},"highcharts/pattern-fill":{deps:["highcharts/highstock"]},"highcharts/highcharts-3d":{deps:["highcharts/highstock"]},"highcharts/grouped-categories":{deps:["highcharts/highstock"]}};n.loadHighcharts=function(t){var i=t.trim().replace(/\/$/,""),r=i,h=this._isHighchartsIncluded(r),e=this._isHighchartsIncludedByThirdParty();if(h){return this._pLoadModules}if(e){return Promise.resolve()}this._sIncludedFrom=r;this._pLoadModules=this._loadModules(r);return this._pLoadModules};n._isHighchartsIncluded=function(t){var i=this._sIncludedFrom;if(i&&i===t){return true}if(i&&i!==t){a.warning("Highcharts library is already included from '"+i+"'. The included version will be used and will not load from '"+t+"'","sap.ui.integration.widgets.Card#AnalyticsCloud");return true}return false};n._isHighchartsIncludedByThirdParty=function(){if(window.Highcharts){a.warning("Highcharts library is already included on the page. The included version will be used and will not load another one.","sap.ui.integration.widgets.Card#AnalyticsCloud");return true}return false};n._loadModules=function(t){var i=this.HIGHCHART_MODULES,r=Object.getOwnPropertyNames(i);sap.ui.loader.config({paths:{highcharts:t+"/highcharts"},async:true,shim:i});return this._require(r).catch(function(){return Promise.reject("There was a problem with loading of the Highcharts library files.")})};n._require=function(t){return new Promise(function(i,r){sap.ui.require(t,function(){i(arguments)},function(t){r(t)})})};return n});
//# sourceMappingURL=AnalyticsCloudContent.js.map