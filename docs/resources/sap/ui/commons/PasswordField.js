/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","./TextField","./library","./PasswordFieldRenderer","sap/ui/Device"],function(jQuery,e,t,o,p){"use strict";var r=e.extend("sap.ui.commons.PasswordField",{metadata:{library:"sap.ui.commons",deprecated:true}});r.prototype.onfocusin=function(t){e.prototype.onfocusin.apply(this,arguments);if(!p.support.input.placeholder&&this.getPlaceholder()){jQuery(this.getInputDomRef()).attr("type","password")}};r.prototype.onsapfocusleave=function(t){if(!p.support.input.placeholder&&this.getPlaceholder()){var o=jQuery(this.getInputDomRef());if(!o.val()){o.removeAttr("type")}}e.prototype.onsapfocusleave.apply(this,arguments)};return r});
//# sourceMappingURL=PasswordField.js.map