/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["./Viewer","./ContentResource"],function(e,t){"use strict";sap.ui.getCore().attachInit(function(){var c=new URLSearchParams(location.search);new e({toolbarTitle:c.get("title"),showSceneTree:false,contentResources:[new t({sourceType:c.get("sourceType"),source:c.get("source"),veid:c.get("veid")})]}).placeAt("content")})});
//# sourceMappingURL=EmbeddedViewer.js.map