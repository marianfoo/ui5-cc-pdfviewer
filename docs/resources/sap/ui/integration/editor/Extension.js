/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/Extension","sap/base/Log"],function(t,i){"use strict";var o=t.extend("sap.ui.integration.editor.Extension");o.prototype.init=function(){t.prototype.init.apply(this,arguments);this._oEditorInterface=null;this._oEditor=null};o.prototype.exit=function(){t.prototype.exit.apply(this,arguments);this._oEditorInterface=null;this._oEditor=null};o.prototype.setFormatters=function(o){t.prototype.setFormatters.apply(this,arguments);if(!this._oEditor){return}if(this._oEditor.getAggregation("_extension")!==this){i.error("Extension formatters must be set before the initialization of the editor. Do this inside Extension#init().")}};o.prototype.onEditorReady=function(){};o.prototype.getEditor=function(){return this._oEditorInterface};o.prototype._setEditor=function(t,i){this._oEditor=t;this._oEditorInterface=i};return o});
//# sourceMappingURL=Extension.js.map