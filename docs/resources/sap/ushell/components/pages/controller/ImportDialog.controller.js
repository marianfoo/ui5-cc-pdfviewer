// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/base/Log","sap/ui/core/mvc/Controller","sap/ui/core/Fragment","sap/ui/model/json/JSONModel","sap/ushell/components/pages/MyHomeImport","sap/ushell/Config","sap/ushell/library","sap/ushell/resources","sap/ushell/utils/WindowUtils"],function(e,t,i,s,n,a,r,o,u){"use strict";var l=r.DisplayFormat;var c={"X-SAP-UI2-CHIP:SSB_NUMERIC":"ssuite/smartbusiness/tiles/numeric","X-SAP-UI2-CHIP:SSB_CONTRIBUTION":"ssuite/smartbusiness/tiles/contribution","X-SAP-UI2-CHIP:SSB_TREND":"ssuite/smartbusiness/tiles/trend","X-SAP-UI2-CHIP:SSB_DEVIATION":"ssuite/smartbusiness/tiles/deviation","X-SAP-UI2-CHIP:SSB_COMPARISON":"ssuite/smartbusiness/tiles/comparison","X-SAP-UI2-CHIP:SSB_BLANK":"ssuite/smartbusiness/tiles/blank","X-SAP-UI2-CHIP:SSB_DUAL":"ssuite/smartbusiness/tiles/dual"};return t.extend("sap.ushell.components.pages.controller.ImportDialog",{open:function(){if(!this._pFragmentLoad){this._pFragmentLoad=i.load({name:"sap.ushell.components.pages.view.ImportDialog",controller:this}).then(function(e){this._oDialog=e;this._oDialog.setModel(o.i18nModel,"i18n");this._oDialog.setModel(new s({busy:true,groups:[],PersonalizedGroups:[]}));n.getData().then(function(t){e.getModel().setData({busy:false,groups:t,PersonalizedGroups:t.map(function(e){return{title:e.isDefault?o.i18n.getText("my_group"):e.title,description:e.id,selected:true}})})}).catch(function(e){return sap.ushell.Container.getServiceAsync("Message").then(function(t){t.error(e)})});return this._oDialog}.bind(this))}return Promise.all([sap.ushell.Container.getServiceAsync("URLParsing").then(function(e){this._oURLParsingService=e}.bind(this)),this._pFragmentLoad]).then(function(){this._oDialog.open();return this._oDialog}.bind(this))},close:function(){if(this._oDialog){this._oDialog.close()}},doImport:function(){var e=this._oDialog.getModel();var t=[];e.getProperty("/PersonalizedGroups").forEach(function(e){if(e.selected){t.push(e.description)}});var i=this._prepareImport(t);this._saveImport(i)},_moveVisualization:function(e,t,i,s,n){var a=this._getSectionIndex(e,t,i,n);var r=this._getDefaultSectionIndex(e);var o=this._getDefaultSection(e);var u=0;if(o&&o.visualizations&&o.visualizations.length){u=o.visualizations.length-1}return e.moveVisualization(this.iPageIndex,r,u,a,s)},_updateVisualization:function(e,t,i,s,n,a){if(i.bUpdateNeeded){var r=this._getSectionIndex(e,t,s,a);return e.updateVisualization(this.iPageIndex,r,n,i)}return Promise.resolve()},_addVisualization:function(e,t,i,s,n,a,r){if(t.isABookmark){if(t.isCustomBookmark){this.aPromiseChain.push(function(){return n.bookmark.addCustomBookmark(t.vizType,t,a).then(this._moveVisualization.bind(this,n.pages,e,s,i,r)).then(this._updateVisualization.bind(this,n.pages,e,t,s,i,r))}.bind(this))}else{this.aPromiseChain.push(function(){return n.bookmark.addBookmark(t,a).then(this._moveVisualization.bind(this,n.pages,e,s,i,r)).then(this._updateVisualization.bind(this,n.pages,e,t,s,i,r))}.bind(this))}}else{this.aPromiseChain.push(function(){var a=this._getSectionIndex(n.pages,e,s,r);var o=n.pages.getModel().getProperty("/pages/"+this.iPageIndex+"/sections/"+a+"/id");return n.pages.addVisualization(this.sPageId,o,t.vizId).then(this._updateVisualization.bind(this,n.pages,e,t,s,i,r))}.bind(this))}},_addToPresetSection:function(e,t,i,s,n){var a=this._getPresetSection(i.pages);var r=a.visualizations.filter(function(e){return e.displayFormatHint!=="compact"}).length;var o=a.visualizations.filter(function(e){return e.displayFormatHint==="compact"}).length;for(var u=0;u<e.tiles.length;++u){this._addVisualization(e,e.tiles[u],u+r,t,i,s,n)}for(var l=0;l<e.links.length;++l){this._addVisualization(e,e.links[l],l+o+r+e.tiles.length,t,i,s,n)}},_addSection:function(e,t,i,s,n){this.aPromiseChain.push(function(){var s=this._getSectionIndex(i.pages,e,t,n);return i.pages.addSection(this.iPageIndex,s,{title:e.title})}.bind(this));for(var a=0,r=e.tiles.length;a<r;++a){this._addVisualization(e,e.tiles[a],a,t,i,s,n)}for(var o=0,u=e.links.length;o<u;++o){this._addVisualization(e,e.links[o],o+e.tiles.length,t,i,s,n)}},_getMyHomeContentNode:function(e){var t=a.last("/core/spaces/myHome/myHomeSpaceId");return e.getContentNodes().then(function(e){var i=e.find(function(e){return e.id===t});if(!i){return null}return i.children.find(function(e){return e.id===this.sPageId}.bind(this))}.bind(this))},_saveImport:function(e){this._oDialog.setBusy(true);var t;this.sPageId=a.last("/core/spaces/myHome/myHomePageId");this.aPromiseChain=[];return Promise.all([sap.ushell.Container.getServiceAsync("Bookmark"),sap.ushell.Container.getServiceAsync("Message"),sap.ushell.Container.getServiceAsync("Pages"),sap.ushell.Container.getServiceAsync("UserInfo")]).then(function(e){t={bookmark:e[0],message:e[1],pages:e[2],userInfo:e[3]};return this._getMyHomeContentNode(t.bookmark)}.bind(this)).then(function(i){this.iPageIndex=t.pages.getPageIndex(this.sPageId);t.pages.enableImplicitSave(false);this._performImportOperations(e,t,i);return this._executeSequentially(this.aPromiseChain)}.bind(this)).then(function(){return this._savePersonalizations(t.pages)}.bind(this)).then(function(){t.message.info(o.i18n.getText("MyHome.InitialPage.Message.ImportSuccessful"));t.userInfo.getUser().setImportBookmarksFlag("done");return t.userInfo.updateUserPreferences()}).then(function(){u.refreshBrowser()}).catch(function(e){t.message.error(e)}).finally(function(){this._oDialog.setBusy(false);this.close()}.bind(this))},_performImportOperations:function(e,t,i){var s;var n=false;for(var a=0,r=e.length;a<r;++a){s=e[a];if(s.isDefault){this._addToPresetSection(s,a,t,i,n);n=true}else{this._addSection(s,a,t,i,n)}}},_executeSequentially:function(t){return t.reduce(function(t,i){return t.then(function(){return i()}).catch(function(t){e.error(t)})},Promise.resolve())},_getSectionIndex:function(e,t,i,s){var n=this._getPresetSectionIndex(e);if(!t.isDefault&&!t.isLocked&&!s){return n+i+1}return n+i},_getPresetSectionIndex:function(e){var t=e.getModel().getProperty("/pages/"+this.iPageIndex+"/sections/");return t.findIndex(function(e){return e.id===a.last("/core/spaces/myHome/presetSectionId")})},_getDefaultSectionIndex:function(e){var t=e.getModel().getProperty("/pages/"+this.iPageIndex+"/sections/");return t.findIndex(function(e){return e.default})},_getPresetSection:function(e){var t=e.getModel().getProperty("/pages/"+this.iPageIndex+"/sections/");return t.find(function(e){return e.id===a.last("/core/spaces/myHome/presetSectionId")})},_getDefaultSection:function(e){var t=e.getModel().getProperty("/pages/"+this.iPageIndex+"/sections/");return t.find(function(e){return e.default})},_gatherVizDataObjectFromChipInstance:function(t){var i;var s;var n={vizId:t.chipId,isABookmark:!!t.configuration};var r=a.last("/core/stableIDs/enabled");if(r){var o=t.Chip&&t.Chip.referenceChipId;if(o&&o!=="O"){n.vizId=t.Chip.referenceChipId}}if(n.isABookmark){n.isCustomBookmark=["X-SAP-UI2-CHIP:/UI2/STATIC_APPLAUNCHER","X-SAP-UI2-CHIP:/UI2/DYNAMIC_APPLAUNCHER"].indexOf(t.chipId)===-1;i=JSON.parse(JSON.parse(t.configuration).tileConfiguration);n.title=i.display_title_text;n.url=i.navigation_target_url;n.icon=i.display_icon_url;n.info=i.display_info_text;n.subtitle=i.display_subtitle_text;n.serviceUrl=i.service_url;n.serviceRefreshInterval=i.service_refresh_interval;n.numberUnit=i.display_number_unit;n.vizConfig=t.configuration}if(n.isCustomBookmark){if(i.TILE_PROPERTIES){try{var u=JSON.parse(i.TILE_PROPERTIES);if(!n.url&&u.semanticObject&&u.semanticAction){var l={};if(u.evaluationId){l.EvaluationId=u.evaluationId}n.url="#"+this._oURLParsingService.constructShellHash({target:{semanticObject:u.semanticObject,action:u.semanticAction},params:l})}if(u.title){n.title=u.title}if(u.subtitle){n.subtitle=u.subtitle}}catch(t){e.error("Could not create URL for custom bookmark with title: "+n.title+", Error Message: "+t.message)}}n.vizConfig={};n.loadManifest=true;n.vizType=c[t.chipId];n.chipConfig={chipId:t.chipId,bags:{},configuration:JSON.parse(t.configuration)}}s=t.ChipInstanceBags.results;if(s.length){n.bUpdateNeeded=!n.isABookmark;if(n.isCustomBookmark){s.forEach(function(e){n.chipConfig.bags[e.id]={properties:{},texts:{}};e.ChipInstanceProperties.results.forEach(function(t){if(t.translatable==="X"){n.chipConfig.bags[e.id].texts[t.name]=t.value}else{n.chipConfig.bags[e.id].properties[t.name]=t.value}})})}s.filter(function e(t){return t.id==="tileProperties"}).forEach(function(e){e.ChipInstanceProperties.results.forEach(function(e){switch(e.name){case"display_title_text":n.title=e.value;break;case"display_subtitle_text":n.subtitle=e.value;break;case"display_info_text":n.info=e.value;break;case"display_search_keywords":n.searchKeyword=e.value;break;default:break}})});s.filter(function e(t){return t.id==="sb_tileProperties"}).forEach(function(e){e.ChipInstanceProperties.results.forEach(function(e){switch(e.name){case"title":n.title=e.value;break;case"description":n.subtitle=e.value;break;default:break}})})}return n},_savePersonalizations:function(e){e.enableImplicitSave(true);return e.savePersonalization(this.sPageId).then(function(){e.enableImplicitSave(false)})},_prepareImport:function(e){var t={};var i=this._oDialog.getModel();var s=i.getProperty("/groups");var n;var a;s.forEach(function(i){if(e.indexOf(i.id)===-1){return}n={};i.chips.forEach(function(e){a=this._gatherVizDataObjectFromChipInstance(e);n[e.instanceId]=a}.bind(this));i.tiles=[];i.tileOrder.forEach(function(e){a=n[e];if(a){delete n[e];i.tiles.push(a)}});i.links=[];i.linkOrder.forEach(function(e){a=n[e];if(a){delete n[e];a.displayFormatHint=l.Compact;a.bUpdateNeeded=true;i.links.push(a)}});Object.keys(n).map(function(e){i.tiles.push(n[e])});t[i.id]=i}.bind(this));var r=[];var o;e.forEach(function(e){o=t[e];if(o){r.push(o)}});return r}})});
//# sourceMappingURL=ImportDialog.controller.js.map