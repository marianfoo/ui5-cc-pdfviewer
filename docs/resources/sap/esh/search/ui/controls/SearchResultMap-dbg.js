/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/base/Log", "sap/m/Button", "sap/m/library", "sap/ui/layout/HorizontalLayout", "sap/ui/core/Control", "sap/ui/vk/MapContainer", "sap/ui/vk/ContainerContent", "sap/ui/vbm/GeoMap", "sap/ui/vbm/Container", "sap/ui/vbm/Containers", "sap/ui/vbm/Spot", "sap/ui/vbm/Spots"], function (Log, Button, sap_m_library, HorizontalLayout, Control, MapContainer, ContainerContent, GeoMap, Container, Containers, Spot, Spots) {
  function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

  var ButtonType = sap_m_library["ButtonType"];

  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchResultMap = Control.extend("sap.esh.search.ui.controls.SearchResultMap", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        oControl.loadObjects();
        oRm.openStart("div", oControl);
        oRm["class"]("sapUshellSearchResultMap");
        oRm.openEnd();

        if (oControl.mapContainer) {
          // eslint-disable-line no-lonely-if
          oRm.renderControl(oControl.myMapContainer);
        } else {
          oRm.renderControl(oControl.myMap);
        }

        oRm.close("div");
      }
    },
    metadata: {
      aggregations: {
        _map: {
          type: "sap.ui.core.Control",
          multiple: false,
          visibility: "hidden"
        }
      }
    },
    init: function _init() {
      // default map configuration
      var oMapConfig = {
        MapProvider: [{
          name: "OPENSTREETMAP",
          type: "",
          description: "",
          tileX: "256",
          tileY: "256",
          maxLOD: "19",
          copyright: "© openstreetmap",
          Source: [{
            id: "s1",
            url: "http://a.tile.openstreetmap.org/{LOD}/{X}/{Y}.png"
          }, {
            id: "s2",
            url: "http://b.tile.openstreetmap.org/{LOD}/{X}/{Y}.png"
          }, {
            id: "s3",
            url: "http://c.tile.openstreetmap.org/{LOD}/{X}/{Y}.png"
          }]
        }],
        MapLayerStacks: [{
          name: "DEFAULT",
          MapLayer: {
            name: "Open Street Map Layer",
            refMapProvider: "OPENSTREETMAP",
            opacity: "1",
            colBkgnd: "RGB(255,255,255)"
          }
        }]
      };

      try {
        this.mapContainer = new MapContainer();
        this.containerContent = new ContainerContent();
      } catch (e) {// cannot find vk library
      }

      this.geoMap = new GeoMap(this.getId() + "-sapUshellSearchGeoMap", {
        legendVisible: false,
        scaleVisible: false,
        refMapLayerStack: "DEFAULT",
        mapConfiguration: {
          parts: [{
            path: "/config/mapProvider"
          }],
          formatter: function formatter(mapProviderConfig) {
            // adapt user configured map provider
            if (mapProviderConfig !== undefined && _typeof(mapProviderConfig) === "object" && mapProviderConfig.name && mapProviderConfig.name.length > 0) {
              oMapConfig.MapProvider.push(mapProviderConfig);
              oMapConfig.MapLayerStacks[0].MapLayer.refMapProvider = mapProviderConfig.name;
            }

            return oMapConfig;
          }
        }
      });

      if (this.mapContainer && this.containerContent) {
        var cc = new ContainerContent("", {
          content: this.geoMap
        });
        this.myMapContainer = new MapContainer("", {
          content: [cc],
          showRectangularZoom: true,
          showHome: true,
          showFullScreen: false,
          showSettings: false,
          showSelection: false
        });
        this.myMap = this.myMapContainer.getContent()[0].getAggregation("content");
        this.setAggregation("_map", this.myMapContainer);
      } else {
        this.setAggregation("_map", this.geoMap);
        this.myMap = this.getAggregation("_map");
      }
    },
    deg2rad: function _deg2rad(deg) {
      return Math.PI * deg / 180;
    },
    getSpotList: function _getSpotList() {
      var spotList = new Containers();
      var oResults = this.getModel().getProperty("boResults");
      var iNrLocations = 0;
      var oResultItem, oLoc4326, sTitle, aCoordinates, lon, lat, spot, minLon, maxLon, minLat, maxLat;

      for (var i = 0; i < oResults.length; i++) {
        oResultItem = oResults[i];
        oLoc4326 = {};

        if (!oResultItem.geoJson) {
          // on same level as navigationTargets
          continue;
        }

        if (typeof oResultItem.geoJson.value === "string") {
          oLoc4326 = JSON.parse(oResultItem.geoJson.value);
        } else {
          // KF demo
          oLoc4326.coordinates = oResultItem.geoJson.value.coordinates;
        }

        sTitle = oResultItem.geoJson.label;

        if (sTitle === "LOC_4326" || sTitle === "LOCATION" || sTitle === undefined) {
          sTitle = oResultItem.title;
        }

        if (sTitle === "LOC_4326" || sTitle === "LOCATION" || sTitle === undefined) {
          for (var j = 0; j < oResultItem.itemattributes.length; j++) {
            if (oResultItem.itemattributes[j].isTitle === true) {
              sTitle = oResultItem.itemattributes[j].value;
              break;
            }
          }
        }

        if (sTitle === undefined || typeof sTitle !== "string") {
          sTitle = "unlabeled location";
        } else {
          sTitle = sTitle.replace(/<[^>]*>/g, ""); // remove html
        }

        aCoordinates = oLoc4326.coordinates;

        if (!aCoordinates || aCoordinates.length === 0) {
          continue;
        }

        lon = aCoordinates[0];
        lat = aCoordinates[1];

        if (isNaN(lat) || isNaN(lon)) {
          continue;
        }

        this.iNrLocations++;

        if (this.iNrLocations === 1) {
          minLon = lon;
          maxLon = lon;
          minLat = lat;
          maxLat = lat;
        } else {
          if (lon < minLon) {
            minLon = lon;
          }

          if (lon > maxLon) {
            maxLon = lon;
          }

          if (lat < minLat) {
            minLat = lat;
          }

          if (lat > maxLat) {
            maxLat = lat;
          }
        }

        this.minLon = minLon;
        this.maxLon = maxLon;
        this.minLat = minLat;
        this.maxLat = maxLat;
        var oText = new Button({
          text: sTitle // tooltip: sAddress

        });
        var oButton0 = new Button({
          icon: "sap-icon://map",
          type: ButtonType.Emphasized
        });
        var oSpot = new HorizontalLayout({
          content: [oButton0, oText]
        });
        spot = new Container("", {
          position: lon + ";" + lat + ";0",
          item: oSpot,
          alignment: "6" // bottom left

        });
        spotList.addItem(spot);
      }

      this.iNrLocations = iNrLocations;

      if (iNrLocations === 0) {
        spotList = this.getSpotList2();
      }

      return spotList;
    },
    getSpotList2: function _getSpotList2() {
      // legacy variation
      var oResults = this.getModel().getProperty("origBoResults").elements;
      var spotList = new Containers();
      var iNrLocations = 0;
      var oResultItem, oLoc4326, sTitle, aCoordinates, lon, lat, spot;
      var minLon, maxLon, minLat, maxLat; // find index locations of data in listing tree

      var cnt = 0;

      for (var key in oResults) {
        if (!Object.prototype.hasOwnProperty.call(oResults, key)) {
          // eslint-disable-line no-prototype-builtins
          continue;
        }

        oResultItem = oResults[key];

        if (!oResultItem.LOC_4326) {
          continue;
        }

        oLoc4326 = oResultItem.LOC_4326;

        for (var key2 in oResultItem) {
          if (!Object.prototype.hasOwnProperty.call(oResultItem, key2)) {
            // eslint-disable-line no-prototype-builtins
            continue;
          }

          var oAttribute = oResultItem[key2];
          sTitle = "";
          var titleFound = false;

          if (oAttribute.$$MetaData$$) {
            var arPresentationusage = oAttribute.$$MetaData$$.presentationUsage;

            if (arPresentationusage && typeof arPresentationusage.length !== "undefined") {
              for (var j = 0; j < arPresentationusage.length; j++) {
                if (arPresentationusage[j] == "Title") {
                  sTitle = oAttribute.value;
                  sTitle = sTitle.replace(/<[^>]*>/g, ""); // remove html

                  titleFound = true;
                  break;
                }
              }
            }
          }

          if (titleFound) {
            break;
          }
        }

        aCoordinates = null;

        try {
          aCoordinates = JSON.parse(oLoc4326.value).coordinates;
        } catch (e) {// do nothing
        }

        if (!aCoordinates || aCoordinates.length === 0) {
          continue;
        }

        this.iNrLocations++;
        lon = aCoordinates[0];
        lat = aCoordinates[1];

        if (isNaN(lat) || isNaN(lon)) {
          continue;
        }

        cnt++;

        if (cnt === 1) {
          minLon = lon;
          maxLon = lon;
          minLat = lat;
          maxLat = lat;
        } else {
          if (lon < minLon) {
            minLon = lon;
          }

          if (lon > maxLon) {
            maxLon = lon;
          }

          if (lat < minLat) {
            minLat = lat;
          }

          if (lat > maxLat) {
            maxLat = lat;
          }
        }

        this.minLon = minLon;
        this.maxLon = maxLon;
        this.minLat = minLat;
        this.maxLat = maxLat;
        var oText = new Button({
          text: sTitle
        });
        var oButton0 = new Button({
          icon: "sap-icon://map",
          type: ButtonType.Emphasized
        });
        var oSpot = new HorizontalLayout({
          content: [oButton0, oText]
        });
        spot = new Container("", {
          position: lon + ";" + lat + ";0",
          item: oSpot,
          alignment: "6" // bottom left

        });
        spotList.addItem(spot);
      }

      this.iNrLocations = iNrLocations;
      return spotList;
    },
    loadObjects: function _loadObjects() {
      var spotList = this.getSpotList();
      Log.debug("++++++");
      Log.debug("number of locations: " + this.iNrLocations);
      this.myMap.removeAllVos();
      this.myMap.addVo(spotList);
      var parameters = this.getModel().getProperty("config").parseUrlParameters();

      for (var parameter in parameters) {
        if (parameter === "box" && parameters[parameter] !== "false") {
          this.showBoundariesAndCenter();
        }
      }
    },
    setVisualFrame: function _setVisualFrame() {
      var oVisFrame = {
        minLon: this.minLon * 0.5,
        maxLon: this.maxLon * 1.2,
        minLat: this.minLat * 0.8,
        maxLat: this.maxLat * 1.2,
        minLOD: 1,
        // minimal Level of Detail for visual frame
        maxLOD: 10,
        // maximal Level of Detail for visual frame
        maxFraction: 0.5 // maximal fraction [0..1] of minLOD which is acceptable, otherwise minLOD is rounded upwards

      };
      this.myMap.setVisualFrame(oVisFrame);
    },
    showBoundariesAndCenter: function _showBoundariesAndCenter() {
      var center = new Spots({
        items: [new Spot("", {
          type: "Error",
          text: "center",
          position: this.centerLon + " ;  " + this.centerLat + ";0" // click: onClick

        }), new Spot("", {
          type: "Error",
          text: "TLeft",
          position: this.minLon + " ;  " + this.maxLat + ";0" // click: onClick

        }), new Spot({
          type: "Error",
          text: "TRight",
          position: this.maxLon + " ;  " + this.maxLat + ";0" // click: onClick

        }), new Spot({
          type: "Error",
          text: "BLeft",
          position: this.minLon + " ;  " + this.minLat + ";0" // click: onClick

        }), new Spot({
          type: "Error",
          text: "BRight",
          position: this.maxLon + " ;  " + this.minLat + ";0" // click: onClick

        })]
      });
      this.myMap.addVo(center);
    },
    resizeMap: function _resizeMap() {
      var h = $(".sapUshellSearchResultListsContainer").parent().parent().height();
      h = 0.85 * h;
      var hString = "".concat(h, "px");
      var searchGeoMapId = document.querySelectorAll('[id$="-sapUshellSearchGeoMap"]')[0].id; // ToDo:: ID --> always matches first instance of search control

      sap.ui.getCore().byId(searchGeoMapId).setHeight(hString); // ToDo: any

      var w = $(".sapUshellSearchResultListsContainer").parent().parent().width();
      var wString = "".concat(w, "px");
      sap.ui.getCore().byId(searchGeoMapId).setWidth(wString); // ToDo: any
    },
    onAfterRendering: function _onAfterRendering() {
      // ensure that the containing object has a height (not 0!)
      this.resizeMap();
      window.onresize = this.resizeMap;
    }
  });
  return SearchResultMap;
});
})();