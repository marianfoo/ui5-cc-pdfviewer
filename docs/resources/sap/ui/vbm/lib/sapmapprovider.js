/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
sap.ui.define(["./sapvbi"],function(){"use strict";VBI.MapProviders=function(){var e={};e.vbiclass="MapProviders";e.m_MapProviderArray=[];e.clear=function(){for(var r=0;r<e.m_MapProviderArray.length;++r){e.m_MapProviderArray[r].clear()}e.m_MapProviderArray=[]};e.load=function(r,i){if(r.Set){var a;e.clear();if(r.Set.MapProvider){if(jQuery.type(r.Set.MapProvider)=="object"){a=new VBI.MapProvider;a.load(r.Set.MapProvider);e.Add(a)}else if(jQuery.type(r.Set.MapProvider)=="array"){for(var o=0;o<r.Set.MapProvider.length;++o){a=new VBI.MapProvider;a.load(r.Set.MapProvider[o]);e.Add(a)}}}}};e.Add=function(e){this.m_MapProviderArray.push(e)};e.GetMapProviderByName=function(r){for(var i=0;i<e.m_MapProviderArray.length;++i){if(e.m_MapProviderArray[i].m_Name==r){return e.m_MapProviderArray[i]}}return null};return e};VBI.MapProvider=function(e,r,i,a,o,t,n,l,m,u,c){var d={};d.vbiclass="MapProvider";d.m_SourceArray=[];d.m_Name=e;d.m_Description=r;d.m_Copyright=i;d.m_tileX=typeof a!=="undefined"?a:256;d.m_tileY=typeof o!=="undefined"?o:256;d.m_maxLOD=typeof n!=="undefined"?n:19;d.m_minLOD=typeof t!=="undefined"?t:0;d.m_nResolution=typeof m!="undefined"?m:256;d.m_nProjection=typeof u!="undefined"?u:1;d.m_Headers=c;if(l!=null){d.fillStyle=l}d.clear=function(){for(var e=0;e<d.m_SourceArray.length;++e){d.m_SourceArray[e].clear()}d.m_SourceArray=[]};d.GetCopyright=function(){return VBI.Utilities.AssembleCopyrightString(this.m_Copyright,this.m_CopyrightLink,this.m_CopyrightImage)};d.addMapBase=function(e,r,i,a,o,t){var n={};if(e){n.left=parseFloat(e)}if(r){n.right=parseFloat(r)}if(i){n.top=parseFloat(i)}if(a){n.bottom=parseFloat(a)}n.round=o!=undefined?parseFloat(o):0;n.xSize=r-e;n.ySize=i-a;if(t!=undefined){n.relXSize=n.xSize/t.xSize;n.relYSize=n.ySize/t.ySize}return n};d.addMapBaseBorder=function(e,r,i,a,o){e.leftBorder=r;e.rightBorder=i;e.bottomBorder=a;e.topBorder=o};d.load=function(e){if(e.name){d.m_Name=e.name}if(e.description){d.m_Description=e.description}if(e.copyright){d.m_Copyright=e.copyright}if(e.copyrightLink){d.m_CopyrightLink=e.copyrightLink}if(e.copyrightImage){d.m_CopyrightImage=e.copyrightImage}if(e.tileX){d.m_tileX=e.tileX}if(e.tileY){d.m_tileY=e.tileY}if(e.maxLOD){d.m_maxLOD=e.maxLOD}if(e.minLOD){d.m_minLOD=e.minLOD}if(e.resolution){d.m_nResolution=e.resolution}if(e.projection){if(e.projection==="Linear"){d.m_nProjection=2}else if(e.projection==="Elliptical"){d.m_nProjection=3}}if(e.Header){[].concat(e.Header).forEach(function(e){if(e.name){if(!d.m_Headers){d.m_Headers=[]}d.m_Headers.push(e)}})}var r=e.MapBase;d.m_StdMapBase=d.addMapBase(-1,1,1,-1,10);if(e.MapBase){d.m_MapBase=d.addMapBase(r.left,r.right,r.top,r.bottom,r.round,d.m_StdMapBase);d.addMapBaseBorder(d.m_MapBase,r.minX,r.maxX,r.minY,r.maxY)}else{d.m_MapBase=d.addMapBase(-180,180,90,-90,10,d.m_StdMapBase)}if(e.Source){var i;if(jQuery.type(e.Source)=="object"){i=new VBI.Source(null);d.m_bPosRequired=i.load(e.Source);d.Add(i)}else if(jQuery.type(e.Source)=="array"){d.m_bPosRequired=false;for(var a=0;a<e.Source.length;++a){i=new VBI.Source(null);d.m_bPosRequired=i.load(e.Source[a])||d.m_bPosRequired;d.Add(i)}}}};d.Add=function(e){this.m_SourceArray.push(e)};d.CombineUrlWPos=function(e,r,i,a,o,t,n,l,m,u){var c=1<<i;var f=10;if(d.m_MapBase){var p=d.m_StdMapBase;var _=d.m_MapBase;o[0]=(o[0]-p.left)*_.relXSize+_.left;o[1]=-((o[1]-p.bottom)*_.relYSize+_.bottom);t[0]=(t[0]-p.left)*_.relXSize+_.left;t[1]=-((t[1]-p.bottom)*_.relYSize+_.bottom);f=_.round}if(this.m_SourceArray.length==0){return null}return this.m_SourceArray[(r+e*c)%this.m_SourceArray.length].CombineUrlWPos(e,r,i,a,o,t,n,l,f,Math.min(m,d.m_nResolution),Math.min(u,d.m_nResolution))};d.CombineUrl=function(e,r,i){var a=1<<i;if(e<0||r<0||e>=a||r>=a){return null}if(this.m_SourceArray.length==0){return null}return this.m_SourceArray[(r+e*a)%this.m_SourceArray.length].CombineUrl(e,r,i)};d.GetMaxLOD=function(){return this.m_maxLOD};d.GetMinLOD=function(){return this.m_minLOD};return d};VBI.Source=function(e){var r={};r.vbiclass="Source";r.m_ID=null;r.m_Url=e;r.m_Callback=undefined;r.clear=function(){};r.load=function(e){if(e.url){r.m_Url=e.url}if(e.id){r.m_ID=e.id}if(e.callback&&e.callback instanceof Function){r.m_Callback=e.callback}r.m_bQuadkey=r.m_Url.indexOf("{QUAD}")>=0;r.m_bNumkey=r.m_Url.indexOf("{NUMT}")>=0;return r.m_Url.indexOf("LU_LAT")>=0||r.m_Url.indexOf("LU_LONG")>=0||r.m_Url.indexOf("RL_LAT")>=0||r.m_Url.indexOf("RL_LONG")>=0};r.CombineUrl=function(e,i,a){var o=r.m_Url;var t,n;if(r.m_bQuadkey){t=this.TileXYToQuadKey(e,i,a);o=o.replace("{QUAD}",t)}if(r.m_bNumkey){n=this.TileXYToNumKey(e,i,a);o=o.replace("{NUMT}",n)}if(r.m_Callback){var l=r.m_Callback(r.m_Url,e,i,a,t,(1<<a)-i-1,n);if(typeof l==="string"||l instanceof String){return l}else{jQuery.sap.log.error("The function referenced in the Map Provider source parameter 'callback' did not return a string. Fallback to url.")}}o=o.replace("{X}",e);o=o.replace("{Y}",i);o=o.replace("{-Y}",(1<<a)-i-1);o=o.replace("{LOD}",a);return o};r.CombineUrlWPos=function(e,i,a,o,t,n,l,m,u,c,d){var f=r.m_Url;var p=Math.pow(10,u);var _,s;var y=Math.round(t[0]*p)/p;var v=Math.round(t[1]*p)/p;var h=Math.round(n[0]*p)/p;var M=Math.round(n[1]*p)/p;if(r.m_bQuadkey){_=this.TileXYToQuadKey(e,i,a);f=f.replace("{QUAD}",_)}if(r.m_bNumkey){s=this.TileXYToNumKey(e,i,a);f=f.replace("{NUMT}",s)}if(r.m_Callback){var S=r.m_Callback(r.m_Url,e,i,a,c*l,d*m,_,(1<<a)-i-1,s,y,v,h,M);if(typeof S==="string"||S instanceof String){return S}else{jQuery.sap.log.error("The function referenced in the Map Provider source parameter 'callback' did not return a string. Fallback to url.")}}f=f.replace("{X}",e);f=f.replace("{Y}",i);f=f.replace("{-Y}",(1<<a)-i-1);f=f.replace("{LOD}",a);f=f.replace("{WIDTH}",c*l);f=f.replace("{HEIGHT}",d*m);f=f.replace("{LU_LONG}",y);f=f.replace("{LU_LAT}",v);f=f.replace("{RL_LONG}",h);f=f.replace("{RL_LAT}",M);return f};r.TileXYToQuadKey=function(e,r,i){var a=[];for(var o=i;o>0;--o){var t="0";var n=1<<o-1;if(e&n){t++}if(r&n){t++;t++}a.push(t)}var l=a.join("");return l};r.TileXYToNumKey=function(e,r,i){var a=0;for(var o=1;o<i;++o){a+=(1<<o)*(1<<o)}a+=r*(1<<i)+e+1;return a};return r}});
//# sourceMappingURL=sapmapprovider.js.map