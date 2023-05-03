/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Control"],function(e){"use strict";var t=e.extend("sap.ui.integration.cards.filters.FilterBar",{metadata:{library:"sap.ui.integration",properties:{},aggregations:{content:{type:"sap.ui.core.Control",multiple:false}}},renderer:{apiVersion:2,render:function(e,t){e.openStart("div",t).class("sapFCardFilterBar").openEnd();e.renderControl(t.getContent());e.close("div")}}});t.prototype.showLoadingPlaceholders=function(){this._getFilters().forEach(function(e){e.showLoadingPlaceholders()})};t.prototype.hideLoadingPlaceholders=function(){this._getFilters().forEach(function(e){e.hideLoadingPlaceholders()})};t.prototype.refreshData=function(){this._getFilters().forEach(function(e){e.refreshData()})};t.prototype._getFilters=function(){var e=this.getContent();return e.getItems?e.getItems():e.getContent()};return t});
//# sourceMappingURL=FilterBar.js.map