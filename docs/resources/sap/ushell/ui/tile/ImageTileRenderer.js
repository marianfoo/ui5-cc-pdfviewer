// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ui/core/Renderer","./TileBaseRenderer"],function(e,r){"use strict";var t=e.extend(r);t.apiVersion=2;t.renderPart=function(e,r){e.voidStart("img");e.class("sapUshellImageTile");e.attr("src",r.getImageSource());e.attr("alt"," ");e.voidEnd()};return t});
//# sourceMappingURL=ImageTileRenderer.js.map