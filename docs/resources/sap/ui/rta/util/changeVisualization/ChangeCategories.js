/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/changeHandler/common/ChangeCategories"],function(e){"use strict";var a={};a.ALL="all";var n={};n[e.ADD]=["createContainer","addDelegateProperty","reveal","addIFrame"];n[e.MOVE]=["move"];n[e.RENAME]=["rename"];n[e.COMBINESPLIT]=["combine","split"];n[e.REMOVE]=["remove"];n[e.OTHER]=[];var o={};o[a.ALL]="sap-icon://show";o[e.ADD]="sap-icon://add";o[e.MOVE]="sap-icon://move";o[e.RENAME]="sap-icon://edit";o[e.COMBINESPLIT]="sap-icon://combine";o[e.REMOVE]="sap-icon://less";o[e.OTHER]="sap-icon://key-user-settings";a.getCategories=function(){return n};a.getIconForCategory=function(e){return o[e]};return a});
//# sourceMappingURL=ChangeCategories.js.map