/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/field/FieldHelpBase"],function(e){"use strict";var t=e.extend("sap.ui.mdc.field.CustomFieldHelp",{metadata:{library:"sap.ui.mdc",properties:{},aggregations:{content:{type:"sap.ui.core.Control",multiple:false}},defaultAggregation:"content",events:{beforeOpen:{}}}});t.prototype._createPopover=function(){var t=e.prototype._createPopover.apply(this,arguments);if(t){t._getAllContent=function(){var e=this.getParent();if(e){var t=[];t.push(e.getContent());return t}else{return this.getContent()}}}return t};t.prototype.fireSelectEvent=function(e){this.close();this.fireSelect({conditions:e})};t.prototype.open=function(t){this.fireBeforeOpen();e.prototype.open.apply(this,arguments)};return t});
//# sourceMappingURL=CustomFieldHelp.js.map