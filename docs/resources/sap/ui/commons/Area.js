/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","./library","sap/ui/core/Element","sap/ui/dom/jquery/control"],function(jQuery,e,r){"use strict";var t=r.extend("sap.ui.commons.Area",{metadata:{library:"sap.ui.commons",deprecated:true,properties:{shape:{type:"string",group:"Misc",defaultValue:null},coords:{type:"string",group:"Misc",defaultValue:null},href:{type:"sap.ui.core.URI",group:"Misc",defaultValue:null},alt:{type:"string",group:"Misc",defaultValue:null}}}});t.prototype.onclick=function(e){var r=jQuery(e.target).control(0);this.getParent().firePress({areaId:r.getId()})};return t});
//# sourceMappingURL=Area.js.map