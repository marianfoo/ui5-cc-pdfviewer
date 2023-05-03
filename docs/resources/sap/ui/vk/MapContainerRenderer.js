/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["./ContainerBaseRenderer","sap/ui/core/Renderer","sap/ui/Device"],function(e,r,o){"use strict";var a=r.extend(e);a.apiVersion=2;a.writeToolbarArea=function(r,a){r.openStart("div");r.class("sapUiVkMapContainerOverlay");r.attr("role",sap.ui.core.AccessibleRole.Presentation);r.openEnd();if(a.getShowNavbar()){r.openStart("div");r.class("sapUiVkMapContainerNavbarArea");r.attr("role",sap.ui.core.AccessibleRole.Presentation);r.openEnd();if(a.getShowMapLayer()&&a._shouldRenderMapLayerSwitch){r.renderControl(a._currentText);r.renderControl(a._selectionMap)}r.openStart("div");r.class("sapUiVkMapContainerNavbarContainer");r.attr("role",sap.ui.core.AccessibleRole.Navigation);r.openEnd();r.renderControl(a._oNavbar);r.close("div");r.close("div")}if(!o.system.phone&&a._shouldRenderListPanel){a._oScrollCont.addStyleClass("sapUiVkMapContainerListPanelArea");r.renderControl(a._oScrollCont)}e.writeToolbarArea(r,a);r.close("div");if(o.system.phone){r.openStart("div");r.attr("id",a.getId()+"-LPW");r.class("sapUiVkMapContainerLPW");r.openEnd();r.renderControl(a._oMenuCloseButton);a._oScrollCont.addStyleClass("sapUiVkMapContainerListPanelArea");r.renderControl(a._oScrollCont);r.close("div")}};return a},true);
//# sourceMappingURL=MapContainerRenderer.js.map