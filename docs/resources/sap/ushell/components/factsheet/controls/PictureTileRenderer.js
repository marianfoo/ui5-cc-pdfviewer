// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["jquery.sap.global","sap/m/CustomTileRenderer","sap/ui/core/Renderer"],function(jQuery,e,r){"use strict";var t=r.extend(e);t.render=function(e,r){jQuery.sap.log.debug("PictureTileRenderer :: begin rendering");e.write("<div ");e.writeControlData(r);e.addClass("sapCaUiPictureTile");e.writeClasses();e.write(">");e.write("<div");e.addClass("sapCaUiPictureTileContent");e.writeClasses();e.write(">");e.write("<div id='"+r.getId()+"-wrapper'>");e.renderControl(r._oDeletePictureButton);this._renderContent(e,r);e.write("</div>");e.write("</div></div>")};t._renderContent=function(e,r){e.renderControl(r.getContent())};return t},true);
//# sourceMappingURL=PictureTileRenderer.js.map