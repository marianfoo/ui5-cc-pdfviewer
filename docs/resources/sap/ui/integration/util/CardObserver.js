/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/library","sap/ui/base/Object"],function(t,e){"use strict";var r=t.CardDataMode;var i=e.extend("sap.ui.integration.util.CardObserver",{constructor:function(t){e.call(this);this._oCard=t}});i.prototype.destroy=function(){e.prototype.destroy.apply(this,arguments);this._oCard=null;if(this.oObserver){this.oObserver.disconnect();this.oObserver=null}};i.prototype.createObserver=function(){if(!this.oObserver){this.oObserver=new window.IntersectionObserver(function(t){t.forEach(function(t){if(t.isIntersecting){this.loadManifest()}}.bind(this),{threshold:[.1]})}.bind(this))}};i.prototype.loadManifest=function(){var t=this._oCard.getDomRef();this._oCard.setDataMode(r.Active);this.oObserver.unobserve(t)};return i});
//# sourceMappingURL=CardObserver.js.map