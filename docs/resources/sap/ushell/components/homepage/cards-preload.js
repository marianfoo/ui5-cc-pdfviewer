//@ui5-bundle sap/ushell/components/homepage/cards-preload.js
sap.ui.require.preload({
	"sap/ushell/adapters/cdm/_LaunchPage/uri.transform.js":function(){
// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ui/thirdparty/URI"],function(r){"use strict";function e(e,n,f,v){var c=l(e)?new r(e):null;if(!c){return{error:"Error: Parameter sUri is empty or not a string, use case not supported."}}if(!i(c)){return t(e,null,null,null,e)}var h=l(n)?new r(n):null;if(h&&!i(h)){return t(e,n,null,null,c.absoluteTo(h))}var m=(new r).search("");if(m.toString()===""){m=new r("https://x.y.z:8443/sap/bc/ui5_ui5/ui2/ushell/test-resources/sap/ushell/shells/cdm/fioriCDM.html?params")}var p=l(f)?new r(s(f)):m;if(!i(p)&&!v){return t(e,n,r.joinPaths(h,c),o(p),r.joinPaths(h,c).absoluteTo(p))}var b=l(v)?new r(v):m;if(!p||!b.toString()){return{error:"Error: Parameter sUriNewBase is empty or not a string, use case not supported."}}if(i(b)){return{error:"Error: Parameter sUriNewBase is a relative uri, but must be absolute."}}if(i(p)&&!i(b)){p=p.absoluteTo(b)}if(!i(p)&&!i(b)){if(p.host()&&b.host()&&p.host()!=b.host()){return{error:"Error: Hosts of the parameters sUriBase and sUriNewBase are given but do not match."}}var g=new r(u(p)).relativeTo(u(b));var w;if(l(n)){w=c.absoluteTo(h.absoluteTo(g.absoluteTo(b)));var d=a(g,h);var T=a(d,c);return t(c,d,T,o(b),w)}w=c.absoluteTo(g.absoluteTo(b));var P=a(g,c);P.query(c.query());return t(P,null,P,o(b),w)}return{error:"Error: Parameter combination not supported."}}function t(r,e,t,n,i){var o={};if(r){o.uri=r.toString()}if(e){o.uriParent=e.toString()}if(t){o.uriRelative=t.toString()}if(n){o.uriBase=n.toString()}if(i){o.uriAbsolute=i.toString()}return o}function n(r){if(!r.is("relative")){return false}return r.toString()[0]==="/"}function i(r){return!r.is("absolute")&&!n(r)}function o(r){return r.filename("").search("").fragment("")}function a(){var e=new r("/1/2/3/4/5/6/7/8/9/");var t=e;for(var n=0;n<arguments.length;n++){t=r.joinPaths(t,arguments[n])}return t.relativeTo(e)}function u(e){var t=e.directory();if(t==="/"){return"/"}return r.joinPaths(t,"/").toString()}function s(e){var t=e;if(e){var n=new r(e);if(n.filename()&&n.filename().indexOf(".")===-1&&n.filename().slice(-1)!=="/"){t+="/"}}return t}function l(r){return r&&typeof r==="string"}return e});
},
	"sap/ushell/adapters/cdm/v3/AdapterBase.js":function(){
// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/adapters/cdm/v3/_LaunchPage/readHome","sap/ushell/adapters/cdm/v3/_LaunchPage/readVisualizations","sap/ushell/adapters/cdm/v3/_LaunchPage/readUtils","sap/m/GenericTile","sap/ui/core/ComponentContainer","sap/ushell/adapters/cdm/_LaunchPage/uri.transform","sap/ushell/Config","sap/ushell/EventHub","sap/ushell/navigationMode","sap/ushell/resources","sap/ushell/utils","sap/ushell/adapters/cdm/v3/utilsCdm","sap/base/util/Version","sap/ui/thirdparty/jquery","sap/base/util/isPlainObject","sap/base/util/isEmptyObject","sap/base/util/ObjectPath","sap/base/util/deepExtend","sap/base/util/deepClone","sap/base/Log","sap/ushell/UI5ComponentType"],function(e,t,i,r,o,n,s,a,l,u,p,d,c,jQuery,f,g,h,m,v,T,y){"use strict";var R=T.getLogger("sap/ushell/adapters/cdm/LaunchPageAdapter");var _=T.Level;var C="sap.ushell.components.tiles.cdm.applauncher";var b="sap.ushell.components.tiles.cdm.applauncherdynamic";function I(e,t,i){this.oAdapterConfiguration=i;this._mResolvedTiles={};this._mCatalogTilePromises={};this._mFailedResolvedCatalogTiles={};this._mFailedResolvedTiles={};this._mContentProviders={};this.TileType={Tile:"tile",Link:"link",Card:"card"}}I.prototype.getGroups=function(){var e=new jQuery.Deferred;this._ensureLoaded().done(function(t){p.setPerformanceMark("FLP - homepage groups processed");e.resolve(t)}).fail(function(){e.resolve([])});return e.promise()};I.prototype._ensureLoaded=function(){var t=this,i;if(this._ensureLoadedDeferred){return this._ensureLoadedDeferred.promise()}i=new jQuery.Deferred;this._ensureLoadedDeferred=i;this._getSiteData().done(function(i){if(!t.isSiteSupported(i)){throw new Error("Invalid CDM site version: Check the configuration of the launchpage adapter and the version of the FLP site")}var r=[];var o=e.getGroupsArrayFromSite(i);o=t._addDefaultGroup(o,i);o.forEach(function(e){r=t._ensureGroupItemsResolved(e,i).concat(r)});t._allPromisesDone(r).done(function(){t._ensureLoadedDeferred.resolve(o);delete t._ensureLoadedDeferred;t._logTileResolutionFailures(t._mFailedResolvedTiles)})}).fail(function(e){R.error("Delivering hompage groups failed - "+e);t._ensureLoadedDeferred.resolve([]);delete t._ensureLoadedDeferred});return i.promise()};I.prototype._ensureGroupItemsResolved=function(e,t){var i=[],r,o;if(e.payload&&e.payload.tiles){r=this._ensureGroupTilesResolved(e.payload.tiles,t);Array.prototype.push.apply(i,r)}if(e.payload&&e.payload.links){o=this._ensureGroupLinksResolved(e.payload.links,t);Array.prototype.push.apply(i,o)}return i};I.prototype._ensureGroupTilesResolved=function(e,t){return(e||[]).map(function(e,i){return this._resolveGroupTile(e,t).then(function(e){e.isLink=false;return e})},this)};I.prototype._ensureGroupLinksResolved=function(e,t){return(e||[]).map(function(e){return this._resolveGroupTile(e,t).then(function(e){e.isLink=true;return e})},this)};I.prototype._resolveGroupTile=function(e,t){var i=this._mResolvedTiles;var r=this._mFailedResolvedTiles;var o;function n(t){i[e.id]=t;if(r[e.id]){delete r[e.id]}return t}function s(e){var t=e.target;return t&&t.semanticObject==="Shell"&&t.action==="launchURL"}if(i[e.id]){return(new jQuery.Deferred).resolve(i[e.id]).promise()}if(e.target&&e.target.url){o=jQuery.when(this._getTileForUrl(e))}else if(e.isBookmark&&e.vizType===undefined){o=this._resolveTileByIntent(e,t)}else if(s(e)){o=this._resolveTileByIntent(e,t)}else{o=this._resolveTileByVizId(e,t)}var a=new jQuery.Deferred;o.done(function(e){a.resolve(n(e))}).fail(function(t){r[e.id]=t;a.reject(t)});return a.promise()};I.prototype._resolveTileByVizId=function(r,o){var n,a,u,c,g,h,T,y,R,C,b,I,D;function S(e,t){return(new jQuery.Deferred).reject({logLevel:e,message:t}).promise()}var L=new jQuery.Deferred;if(!f(o)){return S(_.ERROR,"Cannot resolve tile: oSite must be an object")}if(!f(r)){return S(_.ERROR,"Cannot resolve tile: oTile must be an object")}a=r.vizId;n=v(t.get(o,a||"")||{});c=r.vizType||t.getTypeId(n);u=t.getType(o,c);if(!u){return S(_.ERROR,"Cannot resolve tile '"+r.id+"': no visualization type found for vizTypeId '"+c+"'")}g=t.getAppId(n);if(g){h=t.getAppDescriptor(o,g);if(!h){return S(_.INFO,"Tile '"+r.id+"' filtered from result: no app descriptor found for appId '"+g+"' (dangling app reference)")}T=e.getInbound(h,t.getTarget(n).inboundId);if(!T){return S(_.ERROR,"Cannot resolve tile '"+r.id+"': app '"+g+"' has no navigation inbound")}y=d.mapOne(T.key,T.inbound,h,n,u,o);var P=y.resolutionResult.applicationType,G=y.resolutionResult.additionalInformation,F=s.last("/core/navigation/enableInPlaceForClassicUIs"),w=F?F[P]:false;R=l.computeNavigationModeForHomepageTiles(P,G,w);I=t.getOutbound(n,T.inbound);b=this._toHashFromOutbound(I)}else{n.vizConfig=m({},n.vizConfig,r.vizConfig);y=d.mapOne(undefined,undefined,undefined,n,u,o);if(t.startsExternalUrl(n)){D=p.getMember(n.vizConfig,"sap|flp.target.url")}}C=y.tileResolutionResult;C.navigationMode=R;C.isLink=false;if(!this._isFormFactorSupported(C)){return S(_.INFO,"Tile '"+r.id+"' filtered from result: form factor not supported")}if(D||b){L.resolve({tileResolutionResult:C,tileIntent:D||b})}else{if(!this._oUrlParsingPromise){this._oUrlParsingPromise=sap.ushell.Container.getServiceAsync("URLParsing")}this._oUrlParsingPromise.then(function(e){if(r.target){var t=v(r.target);b=d.toHashFromTarget(i.harmonizeTarget(t),e)}L.resolve({tileResolutionResult:C,tileIntent:b})})}return L.promise()};I.prototype._isFormFactorSupported=function(t){var i=p.getFormFactor();return e.supportsFormFactor(t,i)};I.prototype._getFirstInbound=function(e){var t=Object.keys(e["sap.app"].crossNavigation.inbounds).shift(),i=e["sap.app"].crossNavigation.inbounds[t];return{key:t,inbound:i}};I.prototype._resolveTileByIntent=function(e){var t=this._prepareTileHash(e);return this._getTileFromHash(t)};I.prototype._allPromisesDone=function(e){var t=new jQuery.Deferred,i;if(e.length===0){t.resolve([])}else{var r=e.map(function(e){i=new jQuery.Deferred;e.always(i.resolve.bind(i));return i.promise()});jQuery.when.apply(this,r).done(function(){var e=Array.prototype.slice.call(arguments);t.resolve(e)})}return t.promise()};I.prototype._logTileResolutionFailures=function(e){var t={};if(!e){return}Object.keys(_).filter(function(e){var t=_[e];return t>=_.FATAL&&t<=_.ALL}).forEach(function(e){t[_[e]]=""});Object.keys(e).forEach(function(i){var r=e[i];if(r.logLevel){t[r.logLevel]=t[r.logLevel].concat(r.message).concat("\n")}});if(t[_.FATAL]){R.fatal(t[_.FATAL])}if(t[_.ERROR]){R.error(t[_.ERROR])}if(t[_.WARNING]){R.warning(t[_.WARNING])}if(t[_.INFO]){R.info(t[_.INFO])}if(t[_.DEBUG]){R.debug(t[_.DEBUG])}if(t[_.TRACE]){R.trace(t[_.TRACE])}};I.prototype._isValidTitle=function(e){return typeof e==="string"&&e};I.prototype._isGroupPreset=function(t){return e.isGroupPreset(t)};I.prototype._isGroupLocked=function(t){return e.isGroupLocked(t)};I.prototype.getGroupTitle=function(t){return e.getGroupTitle(t)};I.prototype.getGroupId=function(t){return e.getGroupId(t)};I.prototype.isGroupVisible=function(t){return e.isGroupVisible(t)};I.prototype.getTileTitle=function(t){return e.getTileTitle(this._mResolvedTiles,t)};I.prototype.getTileContentProviderId=function(t){return e.getContentProviderId(t)};I.prototype.getTileSubtitle=function(t){return e.getTileSubtitle(this._mResolvedTiles,t)};I.prototype.getTileIcon=function(t){return e.getTileIcon(this._mResolvedTiles,t)};I.prototype.getTileInfo=function(t){return e.getTileInfo(this._mResolvedTiles,t)};I.prototype.getTileIndicatorDataSource=function(e){var t=this._mResolvedTiles[e.id],i={},r;if(e.indicatorDataSource){i.indicatorDataSource=m({},e.indicatorDataSource);if(e.dataSource){i.dataSource=m({},e.dataSource)}return i}if(!t){return i}r=t.tileResolutionResult;if(r.indicatorDataSource){i.indicatorDataSource=m({},r.indicatorDataSource);if(r.indicatorDataSource.hasOwnProperty("dataSource")){var o=r.indicatorDataSource.dataSource,s=r.dataSources;if(s&&s.hasOwnProperty(o)){i.dataSource=m({},s[o])}else{T.warning("datasource referenced but not found for tile: "+t.tileIntent)}}if(p.getMember(r,"runtimeInformation.componentProperties.url")){var a=p.getMember(i,"indicatorDataSource.path");var l=p.getMember(i,"dataSource.uri");var u=p.getMember(r,"runtimeInformation.componentProperties.url");var d=n(a,l,u,this.getWindowLocationHref());if(!d.error){if(a){i.indicatorDataSource.path=d.uri}if(l){i.dataSource.uri=d.uriParent}}}}return i};I.prototype.getWindowLocationHref=function(){return window.location.href};I.prototype.isGroupRemovable=function(e){return!this._isGroupPreset(e)};I.prototype.isGroupLocked=function(e){return this._isGroupLocked(e)};I.prototype.getGroupTiles=function(t){return e.getGroupTiles(t).concat(e.getGroupLinks(t))};I.prototype.getTileType=function(t){if(e.isLink(this._mResolvedTiles,t)){return this.TileType.Link}if(e.isCard(this._mResolvedTiles,t)){return this.TileType.Card}return this.TileType.Tile};I.prototype.getTileId=function(t){return e.getTileId(t)};I.prototype.getTileSize=function(t){return e.getTileSize(this._mResolvedTiles,t)||"1x1"};I.prototype.getTileTarget=function(t){var i=e.getTileId(t),r=this._mResolvedTiles[i];if(t.target&&t.target.url){return t.target.url}if(r){return r.tileIntent}T.warning("Could not find a target for Tile with id '"+i+"'","sap.ushell.adapters.cdm.LaunchPageAdapter");return""};I.prototype.isTileIntentSupported=function(e){return this._mFailedResolvedTiles[e.id]===undefined};I.prototype.setTileVisible=function(e,t){var i=this._mResolvedTiles[e.id];if(i){if(i.tileComponent){this._notifyTileAboutVisibility(i.tileComponent,t,i.visibility)}i.visibility=t}};I.prototype.getCardManifest=function(e){var t,i=this._mResolvedTiles[e.id];t=i.tileResolutionResult;return t.tileComponentLoadInfo};I.prototype._getTileUiComponentContainer=function(e,t,i){var n=this,s,l,p,d,c,f,g=new jQuery.Deferred;sap.ushell.Container.getServiceAsync("Ui5ComponentLoader").then(function(r){l=r;var o=this._createTileComponentData(e,i,t);return o}.bind(this)).then(function(t){return this._enhanceTileComponentData(e,t)}.bind(this)).then(function(h){s=t.tileResolutionResult;if(t.isLink){p=s.navigationMode;g.resolve(n._createLinkInstance(e,i,p,r,u));return}var m=this._createTileComponentProperties(h,s.tileComponentLoadInfo);if(!m.name){return Promise.reject("Cannot find name of tile component for tile with id: '"+e.id+"'")}if(m.manifest){h.properties=h.properties||{};h.properties.manifest=m.manifest}f=this._isCustomTileComponent(m.name);var v=function(t){var r;d=t.componentHandle.getInstance();c=new o({component:d,height:"100%"});if(!i){r=n._mResolvedTiles[e.id];r.tileComponent=d;if(typeof r.visibility==="boolean"){n._notifyTileAboutVisibility(d,r.visibility)}}return c};var T=function(){return l.createComponent({loadCoreExt:f,loadDefaultDependencies:false,componentData:h,url:m.url,applicationConfiguration:{},reservedParameters:{},applicationDependencies:m,ui5ComponentName:m.name},{},[],y.Visualization).then(v)};if(f){a.once("CoreResourcesComplementLoaded").do(function(){T().then(function(e){g.resolve(e)}).fail(function(e){g.reject(e)})})}else{T().then(function(e){g.resolve(e)}).fail(function(e){g.reject(e)})}}.bind(this)).catch(function(e){g.reject(e)});return g.promise()};I.prototype._createTileComponentProperties=function(e,t){var i={};if(!t||g(t)){if(e.properties.indicatorDataSource&&e.properties.indicatorDataSource.path){i.name=b}else{i.name=C}}else{i=t.componentProperties||{};i.name=t.componentName}return i};I.prototype.getTileView=function(e){var t=this;return new jQuery.Deferred(function(i){return t._getTileView(e,false).then(function(e){i.resolve(e)},function(t){var r="Tile with ID '"+e.id+"' could not be initialized"+(t?":\n"+t:".");T.error(r,null,e.tileType);i.reject(r)})}).promise()};I.prototype._getTileView=function(e){var t,i,r=new jQuery.Deferred;if(typeof e!=="object"||!e.id){i="Invalid input parameter passed to _getTileView: "+e;T.error(i);return r.reject(i).promise()}t=this._mResolvedTiles[e.id];if(!t){i="No resolved tile found for tile ID: "+e.id;T.error(i);return r.reject(i).promise()}return this._getTileUiComponentContainer(e,t,false)};I.prototype._createTileComponentData=function(e,t,i){var r=t?this.getCatalogTileTitle(e):this.getTileTitle(e),o=t?this.getCatalogTilePreviewSubtitle(e):this.getTileSubtitle(e),n=t?this.getCatalogTilePreviewIcon(e):this.getTileIcon(e),s=t?this.getCatalogTilePreviewInfo(e):this.getTileInfo(e),a=t?this.getCatalogTileTargetURL(e):this.getTileTarget(e),l=this.getTileIndicatorDataSource(e),u=e.numberUnit||i.tileResolutionResult&&i.tileResolutionResult.numberUnit,p={properties:{},startupParameters:{}};if(i.tileResolutionResult&&i.tileResolutionResult.isCustomTile===true&&i.tileResolutionResult.startupParameters){p.startupParameters=i.tileResolutionResult.startupParameters}if(r){p.properties.title=r}if(s){p.properties.info=s}if(o){p.properties.subtitle=o}if(n){p.properties.icon=n}if(a){p.properties.targetURL=a}if(u){p.properties.numberUnit=u}if(l.indicatorDataSource){p.properties.indicatorDataSource=l.indicatorDataSource;if(l.dataSource){p.properties.dataSource=l.dataSource}}if(i.tileResolutionResult){p.properties.navigationMode=i.tileResolutionResult.navigationMode;p.properties.contentProviderId=i.tileResolutionResult.contentProviderId||""}return p};I.prototype._enhanceTileComponentData=function(e,t){var i=Promise.resolve();var r=this.getTileContentProviderId(e);if(r){i=sap.ushell.Container.getServiceAsync("ClientSideTargetResolution").then(function(e){return e.getSystemContext(r)}).then(function(e){t.properties.indicatorDataSource.path=e.getFullyQualifiedXhrUrl(t.properties.indicatorDataSource.path)}).catch(function(){T.error("System Context not available")})}return i.then(function(){return t})};I.prototype._isGroupTile=function(t){return e.isGroupTile(t)};I.prototype._isCatalogTile=function(e){return!!(e&&e.isCatalogTile)};I.prototype._isFailedGroupTile=function(t){return!!(t&&this._mFailedResolvedTiles&&this._mFailedResolvedTiles[e.getTileId(t)])};I.prototype.getCatalogTileId=function(e){if(this._isGroupTile(e)){if(this._isFailedGroupTile(e)){return undefined}if(e.isBookmark&&h.get("target.url",e)){return e.target.url}return e.vizId||e.target&&e.target.url}if(this._isCatalogTile(e)){return e.id}return undefined};I.prototype.getCatalogTilePreviewTitle=function(e){if(this._isGroupTile(e)){return this.getTileTitle(e)}return e.tileResolutionResult&&e.tileResolutionResult.title||""};I.prototype.getCatalogTileTargetURL=function(e){if(!e){throw new Error("The given tile is falsy")}if(this._isCatalogTile(e)){if(e.tileResolutionResult&&e.tileResolutionResult.isCustomTile){if(!e.tileResolutionResult.targetOutbound){return""}return this._toHashFromOutbound(e.tileResolutionResult.targetOutbound)}return e.tileIntent||""}return this.getTileTarget(e)};I.prototype.isGroupFeatured=function(e){return!!e.isFeatured};I.prototype._getMember=function(e,t){return p.getMember(e,t)};I.prototype.getCdmVersionsSupported=function(){return{min:c("3.0.0"),max:c("3.1.0")}};I.prototype.isSiteSupported=function(e){if(!e._version||c(e._version).compareTo(this.getCdmVersionsSupported().min)<0||c(e._version).compareTo(this.getCdmVersionsSupported().max)>0){T.fatal("Invalid CDM site version: Only version 3.0.0 is supported");return false}return true};I.prototype._isCustomTileComponent=function(e){return!(e===C||e===b)};return I},false);
},
	"sap/ushell/adapters/cdm/v3/StaticGroupsAdapter.js":function(){
// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/adapters/cdm/v3/AdapterBase","sap/ui/thirdparty/jquery"],function(t,jQuery){"use strict";function e(e,r,o){t.call(this,e,r,o)}e.prototype=t.prototype;e.prototype._addDefaultGroup=function(t,e){return t};e.prototype._getSiteData=function(){var t=new jQuery.Deferred;return t.resolve(this.oAdapterConfiguration.config)};return e},false);
},
	"sap/ushell/adapters/cdm/v3/_LaunchPage/readHome.js":function(){
// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/utils/type","sap/ushell/adapters/cdm/v3/_LaunchPage/readApplications"],function(i,t){"use strict";var e={};e.getGroupsArrayFromSite=function(i){var t=[];i.site.payload.groupsOrder.forEach(function(e,n){var r=i.groups[e];if(r){r.payload=r.payload||{};t.push(r)}});return t};e.getGroupsMapFromSite=function(i){return i.groups};e.getGroupIdsFromSite=function(i){return i.site.payload.groupsOrder};e.getGroupFromSite=function(i,t){return i.groups[t]};e.getDefaultGroup=function(i){var t=i.filter(function(i){return i.payload.hasOwnProperty("isDefaultGroup")});if(t.length>0){return t[0]}};e.getGroupId=function(i){return i.identification&&i.identification.id};e.getGroupTitle=function(i){return i.identification.title};e.isGroupPreset=function(i){if(!i.payload.hasOwnProperty("isPreset")){return true}return!!i.payload.isPreset};e.isGroupLocked=function(i){return!!i.payload.locked};e.isGroupVisible=function(i){return!!(i.identification.isVisible===undefined||i.identification.isVisible===true)};e.getGroupTiles=function(t){if(t.payload.tiles&&i.isArray(t.payload.tiles)&&t.payload.tiles.length>0){return t.payload.tiles}return[]};e.getGroupLinks=function(t){if(t.payload.links&&i.isArray(t.payload.links)&&t.payload.links.length>0){return t.payload.links}return[]};e.getTileId=function(i){return i.id};e.getTileVizId=function(i){return i.vizId};e.getTileTitle=function(i,t){var e;if(t&&t.isBookmark){return t.title}e=i[t.id];if(e){return t.title||e.tileResolutionResult.title}};e.getContentProviderId=function(i){return i.contentProvider||undefined};e.getTileSubtitle=function(i,t){var e;if(t.isBookmark){return t.subTitle}e=i[t.id];if(e){return t.subTitle||e.tileResolutionResult.subTitle}};e.getTileInfo=function(i,t){var e;if(t.isBookmark){return t.info}e=i[t.id];if(e){return t.info||e.tileResolutionResult.info}};e.getTileIcon=function(i,t){var e;if(t.isBookmark){return t.icon}e=i[t.id];if(e){return t.icon||e.tileResolutionResult.icon}};e.getTileIndicatorDataSource=function(i,t){var e;if(t.isBookmark){return t.icon}e=i[t.id];if(e){return t.icon||e.tileResolutionResult.icon}};e.getTileSize=function(i,t){var e=i[t.id];if(e&&e.tileResolutionResult&&e.tileResolutionResult.size){return e.tileResolutionResult.size}};e.isLink=function(i,t){var e=i[t.id];if(e){return!!e.isLink}return false};e.isCard=function(i,t){var e=i[t.id];if(e){return!!e.tileResolutionResult.isCard}return false};e.isGroupTile=function(i){return!!(i&&i.id&&!i.isCatalogTile)};e.supportsFormFactor=function(i,t){return i.deviceTypes&&i.deviceTypes[t]};e.getInbound=function(i,e){var n=t.getInbound(i,e);return n&&{key:e,inbound:n}};return e},false);
},
	"sap/ushell/adapters/cdm/v3/_LaunchPage/readVisualizations.js":function(){
// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/utils","sap/base/util/ObjectPath"],function(t,e){"use strict";var n={};n.getMap=function(t){return t.visualizations};n.get=function(t,n){return e.get(["visualizations",n],t)};n.getTypeMap=function(t){return t.vizTypes};n.getType=function(t,n){return e.get(["vizTypes",n],t)};n.getTypeId=function(t){return e.get("vizType",t||{})};n.isStandardVizType=function(t){return t==="sap.ushell.StaticAppLauncher"||t==="sap.ushell.DynamicAppLauncher"};n.getSupportedDisplayFormats=function(t){return e.get(["sap.flp","vizOptions","displayFormats","supported"],t||{})};n.getDefaultDisplayFormat=function(t){return e.get(["sap.flp","vizOptions","displayFormats","default"],t||{})};n.getTileSize=function(t){return e.get(["sap.flp","tileSize"],t||{})};n.getConfig=function(t){return e.get("vizConfig",t||{})};n.getTarget=function(t){var n=this.getConfig(t);return e.get(["sap.flp","target"],n||{})};n.getAppId=function(t){var n=this.getTarget(t);return e.get("appId",n||{})};n.getInboundId=function(t){var n=this.getTarget(t);return e.get("inboundId",n||{})};n.getOutbound=function(t,e){var n={semanticObject:e.semanticObject,action:e.action,parameters:this.getTarget(t).parameters||{}};n.parameters["sap-ui-app-id-hint"]={value:{format:"plain",value:this.getAppId(t)}};return n};n.startsExternalUrl=function(t){var e=this.getTarget(t);return e&&e.type==="URL"};n.getAppDescriptor=function(t,n){return e.get(["applications",n],t)};n.getKeywords=function(e){var n=t.clone(e);n.splice(2,1);n.splice(0,1);return t.getNestedObjectProperty(n,["sap|app.tags.keywords","sap|app.tags.keywords"])};n.getTitle=function(e){return t.getNestedObjectProperty(e,["title","sap|app.title","title","sap|app.title"])};n.getSubTitle=function(e){return t.getNestedObjectProperty(e,["subTitle","sap|app.subTitle","subTitle","sap|app.subTitle"])};n.getIcon=function(e){return t.getNestedObjectProperty(e,["icon","sap|ui.icons.icon","icon","sap|ui.icons.icon"])};n.getNumberUnit=function(e){var n=t.clone(e);n.splice(2,2);return t.getNestedObjectProperty(n,["numberUnit","sap|flp.numberUnit"])};n.getInfo=function(e){return t.getNestedObjectProperty(e,["info","sap|app.info","info","sap|app.info"])};n.getShortTitle=function(e){var n=t.clone(e);n.splice(0,1);return t.getNestedObjectProperty(n,["sap|app.shortTitle","shortTitle","sap|app.shortTitle"])};n.getInstantiationData=function(t){return e.get(["vizConfig","sap.flp","_instantiationData"],t)};n.getIndicatorDataSource=function(t){return e.get(["vizConfig","sap.flp","indicatorDataSource"],t)};n.getDataSource=function(e,n){var i=t.clone(e);i.splice(2,1);i.splice(0,1);var r=t.getNestedObjectProperty(i,["sap|app.dataSources","sap|app.dataSources"])||{};return r[n]};n.getChipConfigFromVizReference=function(t){return e.get(["vizConfig","sap.flp","chipConfig"],t)};return n},false);
},
	"sap/ushell/adapters/cdm/v3/utilsCdm.js":function(){
// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/utils","sap/ushell/adapters/cdm/v3/_LaunchPage/readVisualizations","sap/ui/thirdparty/jquery","sap/base/util/deepExtend","sap/base/util/isEmptyObject","sap/base/util/ObjectPath","sap/base/util/merge","sap/base/util/deepEqual","sap/ushell/adapters/cdm/v3/_LaunchPage/readApplications","sap/ushell/utils/UrlParsing","sap/base/Log"],function(e,t,jQuery,a,i,r,s,n,o,p,u){"use strict";var l={};l.getMember=function(t,a){return e.getMember(t,a)};l.getNestedObjectProperty=function(t,a,i){return e.getNestedObjectProperty(t,a,i)};l.mapOne=function(e,r,n,p,u,l){var c=false;r=a({},r);n=a({},n);p=a({},p);u=a({},u);p=p||{};u=u||{};var m={};m.semanticObject=this.getMember(r,"semanticObject");m.action=this.getMember(r,"action");var f=t.getConfig(p);m.title=t.getTitle([undefined,f,r,n]);m.info=t.getInfo([undefined,f,r,n]);m.icon=t.getIcon([undefined,f,r,n]);m.subTitle=t.getSubTitle([undefined,f,r,n]);m.shortTitle=t.getShortTitle([undefined,f,r,n]);m.keywords=t.getKeywords([undefined,f,r,n]);m.numberUnit=t.getNumberUnit([undefined,f,undefined,undefined]);m.deviceTypes=this.getMember(n,"sap|ui.deviceTypes")||{};["desktop","tablet","phone"].forEach(function(e){if(Object.prototype.hasOwnProperty.call(this.getMember(r,"deviceTypes")||{},e)){m.deviceTypes[e]=r.deviceTypes[e]}if(!Object.prototype.hasOwnProperty.call(m.deviceTypes,e)){m.deviceTypes[e]=true}m.deviceTypes[e]=!!m.deviceTypes[e]}.bind(this));m.signature=this.getMember(r,"signature")||{};m.signature.parameters=this.getMember(m,"signature.parameters")||{};m.signature.additionalParameters=this.getMember(r,"signature.additionalParameters")||"allowed";var d=this.getMember(n,"sap|platform|runtime");m.resolutionResult=jQuery.extend(true,{},d);if(d){m.resolutionResult["sap.platform.runtime"]=jQuery.extend(true,{},d)}if(this.getMember(n,"sap|ui.technology")==="GUI"){m.resolutionResult["sap.gui"]=this.getMember(n,"sap|gui")}if(this.getMember(n,"sap|ui.technology")==="WDA"){m.resolutionResult["sap.wda"]=this.getMember(n,"sap|wda")}if(this.getMember(n,"sap|ui.technology")==="URL"){if(n["sap.url"]){m.resolutionResult["sap.platform.runtime"]=m.resolutionResult["sap.platform.runtime"]||{};m.resolutionResult.url=n["sap.url"].uri;m.resolutionResult["sap.platform.runtime"].url=n["sap.url"].uri}else if(d&&d.uri){m.resolutionResult["sap.platform.runtime"].url=d.uri;m.resolutionResult.url=d.uri}}if(!m.resolutionResult["sap.ui"]){m.resolutionResult["sap.ui"]={}}m.resolutionResult["sap.ui"].technology=this.getMember(n,"sap|ui.technology");m.resolutionResult.applicationType=this._formatApplicationType(m.resolutionResult,n);m.resolutionResult.systemAlias=m.resolutionResult.systemAlias||this.getMember(r,"systemAlias");m.resolutionResult.systemAliasSemantics="apply";m.resolutionResult.text=m.title;m.resolutionResult.appId=this.getMember(n,"sap|app.id");var g,h;var b=this.getMember(p,"vizConfig.sap|flp.indicatorDataSource");var y={};if(!i(u)){var v=this.getMember(u,"sap|app.type");if(v==="card"){c=true;y=s({},u,p.vizConfig)}else{y.componentName=this.getMember(u,"sap|ui5.componentName");var M=this.getMember(u,"sap|platform|runtime.componentProperties");if(M){y.componentProperties=M}if(this.getMember(u,"sap|platform|runtime.includeManifest")){y.componentProperties=y.componentProperties||{};y.componentProperties.manifest=s({},u,p.vizConfig);delete y.componentProperties.manifest["sap.platform.runtime"]}}}if(this.getMember(n,"sap|app.type")==="plugin"||this.getMember(n,"sap|flp.type")==="plugin"){return undefined}var O=this.getNestedObjectProperty([f,n,u],"sap|flp.tileSize");var T=this.getNestedObjectProperty([f,n,u],"sap|app.description");if(this.getMember(n,"sap|ui.technology")==="GUI"&&this.getMember(n,"sap|gui.transaction")){g=this.getMember(n,"sap|gui.transaction")}if(this.getMember(n,"sap|ui.technology")==="WDA"&&this.getMember(n,"sap|wda.applicationId")){g=this.getMember(n,"sap|wda.applicationId")}var R=this.getNestedObjectProperty([f,n,u],"sap|app.dataSources");if(this.getMember(n,"sap|app.id")){h=this.getMember(n,"sap|app.id")}var P=o.getContentProviderId(n)||"";m.tileResolutionResult={appId:h,title:m.title,subTitle:m.subTitle,icon:m.icon,size:O,info:m.info,keywords:m.keywords,tileComponentLoadInfo:y,indicatorDataSource:b,dataSources:R,description:T,runtimeInformation:d,technicalInformation:g,deviceTypes:m.deviceTypes,isCard:c,contentProviderId:P,numberUnit:m.numberUnit};var j=this.getMember(n,"sap|integration.urlTemplateId");var I=this.getTemplatePayloadFromSite(j,l);if(I){m.templateContext={payload:I,site:l,siteAppSection:n}}return m};l.getTemplatePayloadFromSite=function(e,t){if(!t||typeof e!=="string"){return null}var a=e.replace(/[.]/g,"|");return this.getMember(t.urlTemplates,a+".payload")};l._formatApplicationType=function(e,t){var a=e.applicationType;if(a){return a}var i=this.getMember(t,"sap|platform|runtime.componentProperties.self.name")||this.getMember(t,"sap|ui5.componentName");if(this.getMember(t,"sap|flp.appType")==="UI5"||this.getMember(t,"sap|ui.technology")==="UI5"){e.applicationType="SAPUI5";e.additionalInformation="SAPUI5.Component="+i;e.url=this.getMember(t,"sap|platform|runtime.componentProperties.url");e.applicationDependencies=this.getMember(t,"sap|platform|runtime.componentProperties");return"SAPUI5"}if(this.getMember(t,"sap|ui.technology")==="GUI"){e.applicationType="TR";e["sap.gui"]=this.getMember(t,"sap|gui");e.systemAlias=this.getMember(t,"sap|app.destination.name");return"TR"}if(this.getMember(t,"sap|ui.technology")==="WDA"){e.applicationType="WDA";e["sap.wda"]=this.getMember(t,"sap|wda");e.systemAlias=this.getMember(t,"sap|app.destination.name");return"WDA"}if(this.getMember(t,"sap|ui.technology")==="URL"){e.applicationType="URL";e.systemAlias=this.getMember(t,"sap|app.destination.name")}return"URL"};l.formatSite=function(e){var t=this;if(!e){return[]}var a=[];try{var i=Object.keys(e.applications||{}).sort();i.forEach(function(i){try{var r=e.applications[i];var s=this.getMember(r,"sap|app.crossNavigation.inbounds");if(s){var n=Object.keys(s).sort();n.forEach(function(i){var n=s[i];var p=t.mapOne(i,n,r,undefined,undefined,e);if(p){p.contentProviderId=o.getContentProviderId(r)||"";a.push(p)}})}}catch(e){u.error("Error in application "+i+": "+e,e.stack)}}.bind(this))}catch(e){u.error(e);u.error(e.stack);return[]}return a};l.toHashFromInbound=function(e){var t,a,i;t={target:{semanticObject:e.semanticObject,action:e.action},params:{}};a=r.get("signature.parameters",e)||{};Object.keys(a).forEach(function(e){if(a[e].filter&&Object.prototype.hasOwnProperty.call(a[e].filter,"value")&&(a[e].filter.format===undefined||a[e].filter.format==="plain")){t.params[e]=[a[e].filter.value]}if(a[e].launcherValue&&Object.prototype.hasOwnProperty.call(a[e].launcherValue,"value")&&(a[e].launcherValue.format===undefined||a[e].launcherValue.format==="plain")){t.params[e]=[a[e].launcherValue.value]}});i=p.constructShellHash(t);if(!i){return undefined}return i};l.toHashFromOutbound=function(e){var t,a,i;t={target:{semanticObject:e.semanticObject,action:e.action},params:{}};a=e.parameters||{};Object.keys(a).forEach(function(e){if(a.hasOwnProperty(e)&&typeof a[e].value==="object"){t.params[e]=[a[e].value.value]}});i=p.constructShellHash(t);if(!i){return undefined}return i};l.toHashFromVizData=function(e,t){var a,i;if(!e.target){return undefined}a=e.target;if(a.type==="URL"){return a.url}var r=a.appId;var s=a.inboundId;if(r&&s){var n=o.getInboundTarget(t,r,s);i={};if(n){i.semanticObject=n.semanticObject;i.action=n.action;i.parameters=a.parameters||{};i.parameters["sap-ui-app-id-hint"]={value:{value:r,format:"plain"}};i.appSpecificRoute=a.appSpecificRoute||""}}else if(a.semanticObject&&a.action){i=a}return l.toHashFromTarget(i)};l.toHashFromTarget=function(e){try{var t={};var a=r.get("parameters",e)||{};Object.keys(a).forEach(function(e){t[e]=Array.isArray(a[e].value.value)?a[e].value.value:[a[e].value.value]});var i={target:{semanticObject:e.semanticObject,action:e.action},params:t,appSpecificRoute:e.appSpecificRoute};return"#"+p.constructShellHash(i)}catch(e){return undefined}};l.toTargetFromHash=function(e){var t=p.parseShellHash(e);if(t!==undefined){var a=t.params||{};if(Object.keys(a).length>0){t.parameters=[];Object.keys(a).forEach(function(e){var i=Array.isArray(a[e])?a[e]:[a[e]];i.forEach(function(a){var i={name:e,value:a};t.parameters.push(i)})})}delete t.params}else{t={type:"URL",url:e}}return t};l.isSameTarget=function(e,t){var a;if(e.type!==t.type){return false}if(e.type==="URL"){a=e.url===t.url}else{a=e.semanticObject===t.semanticObject&&e.action===t.action&&e.appSpecificRoute===t.appSpecificRoute&&n(e.parameters,t.parameters)}return a};return l},false);
}
},"sap/ui/core/library-preload");
//# sourceMappingURL=cards-preload.js.map
