/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/UIComponent"],function(e){"use strict";return e.extend("sap.ui.fl.variants.context.Component",{metadata:{manifest:"json"},onInit:function(){var e=this.getModel("selectedContexts");e.setProperty("/selected",[]);e.setProperty("/showMessageStrip",true)},getSelectedContexts:function(){var e=this.getModel("selectedContexts").getProperty("/selected");var t=e.map(function(e){return e.id});return{role:t}},getSelectedContextsModel:function(){return this.getModel("selectedContexts")},setSelectedContexts:function(e){var t=e.role.map(function(e){return{id:e,description:""}});var s=this.getModel("selectedContexts");s.setProperty("/selected",t);s.refresh(true)},resetSelectedContexts:function(){var e=this.getModel("selectedContexts");e.setProperty("/selected",[]);e.refresh(true)},hasErrorsAndShowErrorMessage:function(){return false},showMessageStrip:function(e){var t=this.getModel("selectedContexts");t.setProperty("/showMessageStrip",e);t.refresh(true)}})});
//# sourceMappingURL=Component.js.map