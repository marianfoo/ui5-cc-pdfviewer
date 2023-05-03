/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/EventProvider"],function(t){"use strict";var e="StateHandlerRegistry: This class is a singleton and should not be used without an AdaptationProvider. Please use 'sap.ui.mdc.p13n.Engine.getInstance().stateHandlerRegistry' instead";var n;var a=t.extend("sap.ui.mdc.p13n.modules.StateHandlerRegistry",{constructor:function(){if(n){throw Error(e)}t.call(this)}});a.prototype.attachChange=function(e){return t.prototype.attachEvent.call(this,"stateChange",e)};a.prototype.detachChange=function(e){return t.prototype.detachEvent.call(this,"stateChange",e)};a.prototype.fireChange=function(e){return t.prototype.fireEvent.call(this,"stateChange",{control:e})};a.getInstance=function(){if(!n){n=new a}return n};return a});
//# sourceMappingURL=StateHandlerRegistry.js.map