// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ui/core/mvc/View","sap/m/GenericTile","sap/m/TileContent","sap/m/NumericContent","sap/m/library"],function(e,t,r,i,o){"use strict";var n=o.ValueColor;return e.extend("sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile",{getControllerName:function(){return"sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile"},createContent:function(e){this.setHeight("100%");this.setWidth("100%");if(this.getContent().length===1){return this.getContent()[0]}return new t({size:"Auto",header:"{/properties/title}",scope:"{/properties/scope}",subheader:"{/properties/subtitle}",sizeBehavior:"{/properties/sizeBehavior}",frameType:"{/properties/frameType}",wrappingType:"{/properties/wrappingType}",url:{parts:["/properties/targetURL"],formatter:e.formatters&&e.formatters.leanURL},tileContent:new r({size:"Auto",footer:"{/properties/info}",footerColor:{path:"/properties/infoState",formatter:function(e){if(e==="Positive"){e=n.Good}if(e==="Negative"){e=n.Error}if(!n[e]){e=n.Neutral}return e}},unit:"{/properties/number_unit}",content:new i({truncateValueTo:5,scale:"{/properties/number_factor}",value:"{/properties/number_value}",indicator:"{/properties/number_state_arrow}",valueColor:{path:"/properties/number_value_state",formatter:function(e){if(!e||e==="Neutral"||!n[e]){return n.None}return e}},icon:"{/properties/icon}",withMargin:false,width:"100%"})}),additionalTooltip:"{/properties/contentProviderLabel}",press:[e.onPress,e]})}})});
//# sourceMappingURL=DynamicTile.view.js.map