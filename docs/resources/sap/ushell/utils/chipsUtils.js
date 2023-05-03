// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/base/Log","sap/base/util/ObjectPath"],function(e,t){"use strict";var i="X-SAP-UI2-CHIP:/UI2/DYNAMIC_APPLAUNCHER",r="X-SAP-UI2-CHIP:/UI2/STATIC_APPLAUNCHER";var n={};n.getCatalogTilePreviewTitle=function(e){var t=n.getBagText(e,"tileProperties","display_title_text");return t||!e.isStub()&&e.getContract("preview")&&e.getContract("preview").getPreviewTitle()||undefined};n.getCatalogTilePreviewSubtitle=function(e){var t=n.getBagText(e,"tileProperties","display_subtitle_text");return t||!e.isStub()&&e.getContract("preview")&&e.getContract("preview").getPreviewSubtitle()||undefined};n.getCatalogTilePreviewIcon=function(e){var t=n._getConfigurationProperty(e,"tileConfiguration","display_icon_url");return t||!e.isStub()&&e.getContract("preview")&&e.getContract("preview").getPreviewIcon()||undefined};n.getCatalogTileTargetURL=function(e){var t=n._getConfigurationProperty(e,"tileConfiguration","navigation_target_url");return t||!e.isStub()&&e.getContract("preview")&&e.getContract("preview").getTargetUrl()||undefined};n.getCatalogTileNumberUnit=function(e){return n._getConfigurationProperty(e,"tileConfiguration","display_number_unit")};n.getCatalogTilePreviewInfo=function(e){return n.getBagText(e.getChip(),"tileProperties","display_info_text")};n.getCatalogTileSize=function(e){return n.getTileSize(e)};n.getCatalogTilePreviewIndicatorDataSource=function(e){var t;var i=n._getAppLauncherTileConfiguration(e);if(n._isAppLauncher(e)&&i&&i.service_url){t={path:i.service_url,refresh:i.service_refresh_interval}}return t};n._getConfigurationProperty=function(e,t,i){var r,n;try{r=e.getConfigurationParameter(t);n=JSON.parse(r)}catch(e){return}if(n[i]!==undefined){return n[i]}};n.getBagText=function(e,t,i){if(e.getBagIds().indexOf(t)>-1&&e.getBag(t).getTextNames().indexOf(i)>-1){return e.getBag(t).getText(i)}};n.getTileSize=function(e){var t=!e.isStub()&&e.getConfigurationParameter("row")||"1",i=!e.isStub()&&e.getConfigurationParameter("col")||"1";return t+"x"+i};n._getAppLauncherTileConfiguration=function(t){var i,r=t.getConfigurationParameter("tileConfiguration");try{i=JSON.parse(r||"{}")}catch(i){e.error("Tile with ID '"+t.getId()+"' has a corrupt configuration containing a 'tileConfiguration' value '"+r+"' which could not be parsed. If present, a (stringified) JSON is expected as value.",i.message,"sap.ushell_abap.adapters.abap.LaunchPageAdapter");return{}}return i};n._isAppLauncher=function(e){var t=e.getChip().getBaseChipId();return t===i||t===r};n.getTileConfigurationFromSimplifiedChip=function(e){var t;try{t=JSON.parse(e.configuration.tileConfiguration)}catch(e){t={}}return t};n.getTargetUrlFromSimplifiedChip=function(e,t){var i=this.getCustomTileTargetFromSimplified(e);if(i){return"#"+t.constructShellHash(i)}var r=this.getTileConfigurationFromSimplifiedChip(e);return r.navigation_target_url};n.getIndicatorDataSourceFromSimplifiedChip=function(e){var t=this.getTileConfigurationFromSimplifiedChip(e);var i=t.service_url;if(!i){return undefined}return{path:i,refresh:t.service_refresh_interval}};n.getTileSizeFromSimplifiedChip=function(e){var t=e.configuration;var i=t.row||1;var r=t.col||1;return i+"x"+r};n.getNumberUnitFromSimplifiedChip=function(e){var t=this.getTileConfigurationFromSimplifiedChip(e);return t.display_number_unit};n.getInfoFromSimplifiedChip=function(e){var t=e.bags.tileProperties;return t&&t.texts.display_info_text};n.getKeywordsFromSimplifiedChip=function(e){var t=e.bags.tileProperties;var i=t&&t.texts.display_search_keywords;if(i){return i.trim().split(/\s*,\s*/g)}return[]};n.isCustomTileFromSimplifiedChip=function(e){var t=e.chipId;return t!==i&&t!==r};n.loadChipInstanceFromSimplifiedChip=function(e){var t=e.bags;var i={chipId:e.chipId,configuration:e.configuration?JSON.stringify(e.configuration):"{}"};return sap.ushell.Container.getServiceAsync("PageBuilding").then(function(e){var r=e.getFactory();var n=r.createChipInstance(i);this.addBagDataToChipInstance(n,t);return new Promise(function(e,t){n.load(e,t)}).then(function(){return n})}.bind(this))};n.addBagDataToChipInstance=function(t,i){if(!i){return}var r;for(var n in i){var a=i[n];var o=t.getBag(n);try{for(r in a.properties){o.setProperty(r,a.properties[r])}for(r in a.texts){o.setText(r,a.texts[r])}}catch(t){e.error("chipsUtils.addBagDataToChipInstance: "+t.toString())}}};n.getCustomTileTargetFromSimplified=function(e){if(e.chipId==="X-SAP-UI2-CHIP:/UI2/AR_SRVC_NEWS"){return{target:{semanticObject:"NewsFeed",action:"displayNewsList"}}}var t=JSON.parse(e.configuration.tileConfiguration||"{}");var i=JSON.parse(t.TILE_PROPERTIES||"{}");if(i.semanticObject&&i.semanticAction){return{target:{semanticObject:i.semanticObject,action:i.semanticAction},params:{EvaluationId:[i.evaluationId]}}}return null};return n},true);
//# sourceMappingURL=chipsUtils.js.map