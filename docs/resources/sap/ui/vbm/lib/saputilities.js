/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
sap.ui.define(["./sapvbi"],function(){"use strict";VBI.Utilities=VBI.Utilities||{};HTMLCanvasElement.prototype.getPixelWidth=function(){if(this.m_pixelWidth){return this.m_pixelWidth}if(this.style.pixelWidth!==undefined){return this.style.pixelWidth}return parseInt(this.style.width,10)};HTMLCanvasElement.prototype.getPixelHeight=function(){if(this.m_pixelHeight){return this.m_pixelHeight}if(this.style.pixelHeight!==undefined){return this.style.pixelHeight}return parseInt(this.style.height,10)};HTMLCanvasElement.prototype.getPixelLeft=function(){if(this.m_pixelLeft){return this.m_pixelLeft}if(this.style.pixelLeft!==undefined){return this.style.pixelLeft}return parseInt(this.style.left,10)};HTMLCanvasElement.prototype.getPixelTop=function(){if(this.m_pixelTop){return this.m_pixelTop}if(this.style.pixelTop!==undefined){return this.style.pixelTop}return parseInt(this.style.top,10)};HTMLCanvasElement.prototype.setPixelWidth=function(e){this.m_pixelWidth=e;if(this.style.pixelWidth!==undefined){this.style.pixelWidth=e}else{this.style.width=e+"px"}};HTMLCanvasElement.prototype.setPixelHeight=function(e){this.m_pixelHeight=e;if(this.style.pixelHeight!==undefined){this.style.pixelHeight=e}else{this.style.height=e+"px"}};HTMLCanvasElement.prototype.setPixelLeft=function(e){this.m_pixelLeft=e;if(this.style.pixelLeft!==undefined){this.style.pixelLeft=e}else{this.style.left=e+"px"}};HTMLCanvasElement.prototype.setPixelTop=function(e){this.m_pixelTop=e;if(this.style.pixelTop!==undefined){this.style.pixelTop=e}else{this.style.top=e+"px"}};VBI.Utilities.CreateWifiObject=function(){var e=document.createElement("object");if(!e){return null}e.classid="CLSID:00100000-2013-0070-2000-651572487E69";return e};VBI.Utilities.CreateDOMElement=function(e,t,i,r){var l=document.createElement(e);l.style.height=i?i:"1px";l.style.width=r?r:"1px";l.id=t;return l};VBI.Utilities.GetDOMElement=function(e){var t=[];for(var i=0,r=arguments.length;i<r;i++){var l=arguments[i];if(typeof l=="string"){l=document.getElementById(l)}if(arguments.length==1){return l}t.push(l)}return t};VBI.Utilities.CreateDOMVBIDivElement=function(e,t,i){var r=document.createElement("div");r.setAttribute("role",sap.ui.core.AccessibleRole.Secondary);r.id=e;r.style.height="300x";r.style.width="300px";r.style.overflow="hidden";r.style.position="absolute";r.style.left="0px";r.style.top="0px";return r};VBI.Utilities.Create3DSceneDiv=function(e){var t=document.createElement("div");t.setAttribute("role",sap.ui.core.AccessibleRole.Img);t.id=e;t.style.left="0px";t.style.top="0px";t.style.width="100%";t.style.height="100%";t.style.position="relative";t.style.overflow="hidden";return t};VBI.Utilities.Create3DSceneCanvas=function(e,t,i,r,l,a){var n=document.createElement("canvas");n.setAttribute("role",sap.ui.core.AccessibleRole.Img);n.id=e;n.m_pixelLeft=n.m_pixelTop=0;n.width=n.m_pixelWidth=t?t:512;n.height=n.m_pixelHeight=i?i:512;n.style.left=n.style.top="0px";n.style.width=n.m_pixelWidth+"px";n.style.height=n.m_pixelHeight+"px";n.style.position="absolute";n.style.zIndex=r;n.style.touchaction="none";n.className="vbi-3Dscenecanvas";n.m_bNotInDOM=a!=undefined?a:false;n.m_CanvasValid=!n.m_bNotInDOM;if(n.m_bNotInDOM){n.m_nMoveCount=0}if(l!=undefined){n.tabIndex=l}return n};VBI.Utilities.CreateGeoSceneCanvas=function(e,t,i,r,l,a,n){var s=document.createElement("canvas");s.setAttribute("role",sap.ui.core.AccessibleRole.Img);s.id=e;s.m_pixelLeft=s.m_pixelTop=0;s.width=s.m_pixelWidth=t?t:512;s.height=s.m_pixelHeight=i?i:512;s.style.left=s.style.top="0px";s.style.width=s.m_pixelWidth+"px";s.style.height=s.m_pixelHeight+"px";s.style.position="absolute";s.style.touchaction="none";s.className="vbi-geoscenecanvas";if(a){s.className+=" "+a}if(n){s.setAttribute("aria-label",n)}s.m_bNotInDOM=l!=undefined?l:false;s.m_CanvasValid=!s.m_bNotInDOM;s.m_VBIType="L";if(s.m_bNotInDOM){s.m_nMoveCount=0}if(r!=undefined){s.tabIndex=r}return s};VBI.Utilities.Align=["","left","center","","right"];VBI.Utilities.CreateCaption=function(e,t,i,r,l,a,n,s,o,u){var c=document.createElement("div");c.setAttribute("role",sap.ui.core.AccessibleRole.Note);c.id=e;c.style.left=i+"px";c.style.top=r+"px";c.style.width=(l-i).toString()+"px";c.style.height=(a-r).toString()+"px";c.style.textAlign=VBI.Utilities.Align[u];c.style.title=n;switch(o){case 3:c.style.fontSize="14px";c.style.fontWeight="bold";break}c.className="vbi-2d-caption vbi-2d-common";c.innerHTML=jQuery.sap.encodeHTML(t);return c};VBI.Utilities.CreateLabel=function(e,t,i,r,l,a,n,s){var o=document.createElement("div");o.setAttribute("role",sap.ui.core.AccessibleRole.Description);o.id=e;o.style.left=i+"px";o.style.top=r+"px";o.style.width=(l-i).toString()+"px";o.style.height=(a-r).toString()+"px";o.style.textAlign=VBI.Utilities.Align[s];o.style.title=n;o.className="vbi-2d-label vbi-2d-common";o.innerHTML=jQuery.sap.encodeHTML(t);return o};VBI.Utilities.CreateLink=function(e,t,i,r,l,a,n,s,o){var u=document.createElement("a");u.setAttribute("role",sap.ui.core.AccessibleRole.Link);u.id=e;u.style.left=i+"px";u.style.top=r+"px";u.style.width=(l-i).toString()+"px";u.style.height=(a-r).toString()+"px";u.style.textAlign=VBI.Utilities.Align[o];u.className="vbi-2d-link vbi-2d-common";u.href=n?n:"javascrip"+"t:void(0)";u.title=s;u.innerHTML=jQuery.sap.encodeHTML(t);return u};VBI.Utilities.CreateImage=function(e,t,i,r,l,a,n,s){var o=t.cloneNode(true);o.setAttribute("role",sap.ui.core.AccessibleRole.Img);o.id=e;o.style.left=i+"px";o.style.top=r+"px";o.style.width=(l-i).toString()+"px";o.style.height=(a-r).toString()+"px";o.style.textAlign=VBI.Utilities.Align[s];o.className="vbi-2d-image vbi-2d-common";o.title=n;return o};VBI.Utilities.CreateButton=function(e,t,i,r,l,a,n,s){var o=document.createElement("button");o.id=e;o.style.left=i+"px";o.style.top=r+"px";o.style.width=(l-i).toString()+"px";o.style.height=(a-r).toString()+"px";o.style.textAlign=VBI.Utilities.Align[s];o.className="vbi-2d-button vbi-2d-common";o.innerHTML=jQuery.sap.encodeHTML(t);o.title=n;return o};VBI.Utilities.CreateContainer=function(e,t,i,r,l,a,n,s){var o=document.createElement("div");o.setAttribute("role",sap.ui.core.AccessibleRole.Group);o.id=e;o.style.left=i+"px";o.style.top=r+"px";o.title=n;o.style.position="absolute";if(!s){o.className="vbi-container-vo"}o.m_Key=t;return o};VBI.Utilities.CreateDetailPhone=function(e,t,i,r,l,a,n){var s=document.createElement("div");s.setAttribute("role",sap.ui.core.AccessibleRole.Directory);s.id=e;s.style.left=t+"px";s.style.top=i+"px";var o=12;var u=6;var c=14;o=VBI.Utilities.RemToPixel(.75);u=VBI.Utilities.RemToPixel(.375);c=VBI.Utilities.RemToPixel(.875);if(l){s.style.minHeight=l+c+4+u+2*o+"px"}s.className=".vbi-detail vbi-detail-phone";var v=document.createElement("div");v.setAttribute("role",sap.ui.core.AccessibleRole.Heading);v.id=e+"-window-header";v.className="vbi-detail-header-phone";s.appendChild(v);var f=document.createElement("div");f.setAttribute("role",sap.ui.core.AccessibleRole.Heading);f.id=e+"-window-title";f.className="vbi-detail-title-phone";f.innerHTML=jQuery.sap.encodeHTML(a);v.appendChild(f);var d=document.createElement("div");d.setAttribute("role",sap.ui.core.AccessibleRole.Button);d.id=e+"-window-close";d.className="vbi-detail-closebutton vbi-detail-closebutton-tablet";v.appendChild(d);var p=document.createElement("div");p.setAttribute("role",sap.ui.core.AccessibleRole.Secondary);p.id=e+"-window-content";p.className="vbi-detail-content";p.style.fontSize=VBI.Utilities.RemToPixel(.875)+"px";s.appendChild(p);return{m_Div:s,m_Content:p,m_CloseButton:d,m_Arrow:null,GetAnchorPoint:null}};VBI.Utilities.CreateDetail=function(e,t,i,r,l,a,n){if(VBI.m_bIsPhone){return VBI.Utilities.CreateDetailPhone(e,t,i,r,l,a,n)}var s=document.createElement("div");s.setAttribute("role",sap.ui.core.AccessibleRole.Secondary);s.id=e;s.style.left=t+"px";s.style.top=i+"px";var o=VBI.m_bIsPhone;if(!o){var u=16;var c=16;var v=16;u=VBI.Utilities.RemToPixel(1);c=VBI.Utilities.RemToPixel(1);v=VBI.Utilities.RemToPixel(1);if(r){s.style.width=r+2*u+"px"}if(l){s.style.minHeight=l+v+4+c+2*u+"px"}}else{var f=12;var d=6;var p=14;f=VBI.Utilities.RemToPixel(.75);d=VBI.Utilities.RemToPixel(.375);p=VBI.Utilities.RemToPixel(.875);if(l){s.style.minHeight=l+p+4+d+2*f+"px"}}s.className="vbi-detail vbi-detail-border";var h=document.createElement("div");h.setAttribute("role",sap.ui.core.AccessibleRole.Heading);h.id=e+"-window-header";h.className="vbi-detail-header";s.appendChild(h);var m=document.createElement("div");m.setAttribute("role",sap.ui.core.AccessibleRole.Heading);m.id=e+"-window-title";m.className="vbi-detail-title";m.innerHTML=jQuery.sap.encodeHTML(a);h.appendChild(m);var g=document.createElement("div");g.setAttribute("role",sap.ui.core.AccessibleRole.Button);g.id=e+"-window-close";var I=sap.ui.getCore().getLibraryResourceBundle("sap.ui.vbm.i18n");g.title=I.getText("WINDOW_CLOSE");g.setAttribute("aria-label",I.getText("WINDOW_CLOSE"));g.className="vbi-detail-closebutton vbi-detail-closebutton-"+(VBI.m_bIsMobile?"tablet":"desktop");h.appendChild(g);var b=document.createElement("div");b.setAttribute("role",sap.ui.core.AccessibleRole.Secondary);b.id=e+"-window-content";b.className="vbi-detail-content";s.appendChild(b);var y=document.createElement("b");y.setAttribute("role",sap.ui.core.AccessibleRole.Presentation);y.className="vbi-detail-arrow vbi-detail-left vbi-detail-border-arrow";if(!o){s.appendChild(y)}var B;B=document.createElement("b");B.setAttribute("role",sap.ui.core.AccessibleRole.Presentation);B.className="vbi-detail-arrow vbi-detail-left";if(!o){s.appendChild(B)}return{m_Div:s,m_Content:b,m_CloseButton:g,m_Arrow:B,GetAnchorPoint:function(){if(VBI.m_bIsRtl){return[this.m_Arrow.offsetLeft+this.m_Arrow.offsetWidth+2,this.m_Arrow.offsetTop+this.m_Arrow.offsetHeight/2]}else{return[this.m_Arrow.offsetLeft,this.m_Arrow.offsetTop+this.m_Arrow.offsetHeight/2]}}}};VBI.Utilities.CreateLegendPhone=function(e,t,i,r,l,a,n){};VBI.Utilities.CreateLegend=function(e,t,i,r,l){var a=document.createElement("div");a.setAttribute("role",sap.ui.core.AccessibleRole.Group);a.setAttribute("tabindex","0");a.id=e;if(VBI.m_bIsRtl){a.style.left="0px";a.style.right=""}else{a.style.right="0px";a.style.left=""}a.style.top=t+"px";a.className="vbi-legend";var n=sap.ui.getCore().getLibraryResourceBundle("sap.ui.vbm.i18n");var s=document.createElement("div");s.id=e+"-button-collapse";s.title=n.getText("LEGEND_COLLAPSE");s.setAttribute("role",sap.ui.core.AccessibleRole.Button);s.setAttribute("aria-label",s.title);s.className="vbi-legend-button vbi-legend-button-col";a.appendChild(s);var o=document.createElement("div");o.id=e+"-button-expand";o.title=n.getText("LEGEND_EXPAND");o.setAttribute("role",sap.ui.core.AccessibleRole.Button);o.setAttribute("aria-label",o.title);o.className="vbi-legend-button vbi-legend-button-exp";a.appendChild(o);o.style.visibility="hidden";var u=document.createElement("div");u.id=e+"-header";u.className="vbi-legend-header";u.setAttribute("role",sap.ui.core.AccessibleRole.Presentation);a.appendChild(u);var c=document.createElement("div");c.setAttribute("role",sap.ui.core.AccessibleRole.Heading);c.id=e+"-title";c.className="vbi-legend-title";c.innerHTML=jQuery.sap.encodeHTML(i);u.appendChild(c);var v=document.createElement("div");v.setAttribute("role",sap.ui.core.AccessibleRole.Presentation);v.id=e+"-content";v.className="vbi-legend-content";a.appendChild(v);var f=document.createElement("table");f.setAttribute("role",sap.ui.core.AccessibleRole.Grid);f.setAttribute("tabindex","0");f.id=e+"-table";f.className=l?"vbi-legend-table vbi-legend-table-click":"vbi-legend-table";v.appendChild(f);return{m_Div:a,m_Header:u,m_Content:v,m_Table:f,m_ButtonCol:s,m_ButtonExp:o}};VBI.Utilities.CreateGeoSceneDivCSS=function(e,t,i){var r=document.createElement("div");r.id=e;if(t){r.className=t}if(i){r.title=i}return r};VBI.Utilities.CreateDOMColorShiftedImageFromData=function(e,t,i,r,l){var a=null,n=i?VBI.Types.string2rhls(i):null;if(!n){a=i?VBI.Types.string2rgba(i):null}var s=null,o=r?VBI.Types.string2rhls(r):null;if(!o){s=r?VBI.Types.string2rgba(r):null}var u=document.createElement("img");var c=document.createElement("img");if(l){u.onload=function(){if(typeof l==="function"){l(u)}this.onload=null};c.onload=function(){var e=document.createElement("canvas");var t=e.getContext("2d");e.width=c.width;e.height=c.height;t.drawImage(c,0,0,c.naturalWidth,c.naturalHeight,0,0,c.width,c.height);var i=t.getImageData(0,0,c.width,c.height);var r=i.data;function l(e,t,i,r){var l=e[t];var a=e[t+1];var n=e[t+2];var s=e[t+3];if(i){var o=VBI.Utilities.RGB2HLS(l,a,n);var u=VBI.Utilities.HLS2RGB(o[0]+i[0],o[1]*i[1],o[2]*i[2]);e[t]=Math.min(Math.round(u[0]),255);e[t+1]=Math.min(Math.round(u[1]),255);e[t+2]=Math.min(Math.round(u[2]),255);e[t+3]=Math.min(Math.round(i[3]*s),255)}else if(r){e[t]=r[0];e[t+1]=r[1];e[t+2]=r[2];if(e[t+3]){e[t+3]=r[4]?Math.floor(Math.min(r[3]*255,255)):255}}}for(var v=0,f=c.width*c.height;v<f;++v){var d=v*4;if(n||a){l(r,d,n,a)}if(o||s){l(r,d,o,s)}}t.putImageData(i,0,0);u.src=e.toDataURL("image/png");this.onload=null}}c.src=e.indexOf("data:image")==0?e:"data:image"+t+";base64,"+e;return u};VBI.Utilities.CreateDOMImageFromData=function(e,t,i){var r=document.createElement("img");if(i){r.onload=function(){if(typeof i==="function"){i(r)}this.onload=null}}r.src=e.indexOf("data:image")==0?e:"data:image"+t+";base64,"+e;return r};VBI.Utilities.GetTransparentImage=function(){var e="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";if(!this.m_TransparentImage){this.m_TransparentImage=VBI.Utilities.CreateDOMImageFromData(e,"/png",null);this.m_TransparentImage.id="TransparentImage"}return this.m_TransparentImage};VBI.Utilities.PtOnRect=function(e,t){return e[0]>=t[0]&&e[0]<=t[2]&&e[1]>=t[1]&&e[1]<=t[3]?true:false};VBI.Utilities.PtInRect=function(e,t){return e[0]>t[0]&&e[0]<t[2]&&e[1]>t[1]&&e[1]<t[3]?true:false};VBI.Utilities.RectIntersect=function(e,t){return!(t[0]>e[2]||t[2]<e[0]||t[3]<e[1]||t[1]>e[3])};VBI.Utilities.RectOffset=function(e,t,i){e[0]+=t;e[1]+=i;e[2]+=t;e[3]+=i};VBI.Utilities.cImg;VBI.Utilities.GetImagePixelData=function(e){if(!VBI.Utilities.cImg){VBI.Utilities.cImg=document.createElement("canvas")}VBI.Utilities.cImg.width=e.naturalWidth;VBI.Utilities.cImg.height=e.naturalHeight;VBI.Utilities.cImg.style.width=e.naturalWidth+"px";VBI.Utilities.cImg.style.height=e.naturalHeight+"px";VBI.Utilities.cImg.style.top="0px";VBI.Utilities.cImg.style.left="0px";VBI.Utilities.cImg.style.position="absolute";var t=VBI.Utilities.cImg.getContext("2d");t.drawImage(e,0,0);var i=t.getImageData(0,0,VBI.Utilities.cImg.width,VBI.Utilities.cImg.height);return i};VBI.Utilities.pointOnLine=function(e,t,i,r,l){function a(e,t){return(e[0]-t[0])*(e[0]-t[0])+(e[1]-t[1])*(e[1]-t[1])}var n=-1,s=-1,o=r*r,u=o;var c,v,f;var d=VBI.Utilities.sqDistance;var p,h;for(p=0,h=e.length-1;p<h;++p){v=e[p];f=e[p+1];if((c=d(v[0],v[1],f[0],f[1],t,i))<o){o=c;n=p}}if(n>=0){if((c=a([t,i],e[n]))<u){u=c;s=n}if(a([t,i],e[n+1])<u){u=c;s=n+1}}if(l&&h>0){v=e[0];f=e[h];if((c=d(v[0],v[1],f[0],f[1],t,i))<o){o=c;n=p}if(n>=0){if((c=a([t,i],e[n]))<u){u=c;s=n}if(a([t,i],e[0])<u){u=c;s=0}}}return{m_edge:n,m_node:s}};VBI.Utilities.polyInPolygon=function(e,t,i){var r=false,l=false;for(var a=i.length-1;a>=0;--a){var n=i[a];r=false;if(VBI.Utilities.pointInPolygon(e,t[0][0]+n,t[0][1])){r=true;for(var s=0;s<t.length&&r&&!l;++s){var o=[t[s][0]+n,t[s][1]];var u=s+1==t.length?[t[0][0]+n,t[0][1]]:[t[s+1][0]+n,t[s+1][1]];var c,v;l=false;for(var f=0;f<e.length;++f){c=e[f];v=f+1==e.length?e[0]:e[f+1];if(VBI.Utilities.LineLineIntersection(o,u,c,v,true)){l=true}}}}if(r&&!l){break}}return r&&!l};VBI.Utilities.pointInPolygon=function(e,t,i){var r,l,a=e.length;var n,s,o,u,c,v;if(jQuery.type(e[0])=="array"){if(jQuery.type(e[0][0])=="array"){n=this.pointInPolygon(e[0],t,i);if(n){for(u=false,v=1,a=e.length;!u&&v<a;++v){u=this.pointInPolygon(e[v],t,i);if(u){n=false}}}}else{for(n=false,s=-1,o=a,c=o-1;++s<o;c=s){r=e[s];l=e[c];if((r[1]<=i&&i<l[1]||l[1]<=i&&i<r[1])&&t<(l[0]-r[0])*(i-r[1])/(l[1]-r[1])+r[0]){n=!n}}}}else{for(n=false,s=0,o=a,c=o-2;s<=o-2;s+=2){r=[e[s],e[s+1]];l=[e[c],e[c+1]];if((r[1]<=i&&i<l[1]||l[1]<=i&&i<r[1])&&t<(l[0]-r[0])*(i-r[1])/(l[1]-r[1])+r[0]){n=!n}c=s}}return n};VBI.Utilities.pointInTriangle=function(e,t){var i=e[2][0]-e[0][0];var r=e[2][1]-e[0][1];var l=e[1][0]-e[0][0];var a=e[1][1]-e[0][1];var n=t[0]-e[0][0];var s=t[1]-e[0][1];var o=i*i+r*r;var u=i*l+r*a;var c=i*n+r*s;var v=l*l+a*a;var f=l*n+a*s;var d=1/(o*v-u*u);var p=(v*c-u*f)*d;var h=(o*f-u*c)*d;return p>=0&&h>=0&&p+h<1};VBI.Utilities.INSIDE=0;VBI.Utilities.LEFT=1;VBI.Utilities.RIGHT=2;VBI.Utilities.BOTTOM=4;VBI.Utilities.TOP=8;VBI.Utilities.ComputeOutCode=function(e,t,i){var r=i[0];var l=i[2];var a=i[1];var n=i[3];var s=VBI.Utilities.INSIDE;if(e<r){s|=VBI.Utilities.LEFT}else if(e>l){s|=VBI.Utilities.RIGHT}if(t<a){s|=VBI.Utilities.BOTTOM}else if(t>n){s|=VBI.Utilities.TOP}return s};VBI.Utilities.LineIntersectRect=function(e,t,i,r,l){var a={};var n=l[0];var s=l[2];var o=l[1];var u=l[3];var c=VBI.Utilities.ComputeOutCode(e,t,l);var v=VBI.Utilities.ComputeOutCode(i,r,l);var f=false;var d=true;while(d){if(!(c|v)){f=true;break}else if(c&v){break}else{var p,h;var m=c?c:v;if(m&VBI.Utilities.TOP){p=e+(i-e)*(u-t)/(r-t);h=u}else if(m&VBI.Utilities.BOTTOM){p=e+(i-e)*(o-t)/(r-t);h=o}else if(m&VBI.Utilities.RIGHT){h=t+(r-t)*(s-e)/(i-e);p=s}else if(m&VBI.Utilities.LEFT){h=t+(r-t)*(n-e)/(i-e);p=n}if(m==c){e=p;t=h;c=VBI.Utilities.ComputeOutCode(e,t,l)}else{i=p;r=h;v=VBI.Utilities.ComputeOutCode(i,r,l)}}}a.bReturn=false;if(f){a.x0=e;a.y0=t;a.x1=i;a.y1=r;a.bReturn=true}return a};VBI.Utilities.LineLineIntersection=function(e,t,i,r,l){var a=t[1]-e[1];var n=e[0]-t[0];var s=a*e[0]+n*e[1];var o=r[1]-i[1];var u=i[0]-r[0];var c=o*i[0]+u*i[1];var v=a*u-o*n;if(!v){return null}var f=[(u*s-n*c)/v,(a*c-o*s)/v];if(l){var d=[],p=[],h=[],m=[];for(var g=0;g<=1;++g){if(e[g]<t[g]){d[g]=e[g];p[g]=t[g]}else{d[g]=t[g];p[g]=e[g]}if(i[g]<r[g]){h[g]=i[g];m[g]=r[g]}else{h[g]=r[g];m[g]=i[g]}}if(f[0]>=d[0]&&f[0]<=p[0]&&f[0]>=h[0]&&f[0]<=m[0]&&f[1]>=d[1]&&f[1]<=p[1]&&f[1]>=h[1]&&f[1]<=m[1]){return true}else{return false}}return[(u*s-n*c)/v,(a*c-o*s)/v]};VBI.Utilities.IsClockwise=function(e){var t=e.length;if(e.length%2){t-=1}var i,r,l,a,n;n=0;i=e[t-2];l=e[t-1];for(var s=0;s<t;s+=2){r=e[s];a=e[s+1];n+=(r-i)*(a+l);i=r;l=a}return n<0};VBI.Utilities.GetClippedPolygon=function(e,t,i){var r=t;var l=e.slice(0);var a=[];var n;for(var s=0;s<=3;++s,r=0){a=l.slice(0);l=[];var o=[a[a.length-2],a[a.length-1]];var u=[o[0]+r,o[1]];for(var c=0;c<=a.length-2;c+=2){o=[a[c],a[c+1]];var v=[o[0]+r,o[1]];var f=false;var d=false;var p=[];switch(s){case 0:f=v[1]>i[1];d=u[1]>i[1];p=[[i[0],i[1]],[i[2],i[1]]];break;case 1:f=v[0]<i[2];d=u[0]<i[2];p=[[i[2],i[1]],[i[2],i[3]]];break;case 2:f=v[1]<i[3];d=u[1]<i[3];p=[[i[0],i[3]],[i[2],i[3]]];break;case 3:f=v[0]>i[0];d=u[0]>i[0];p=[[i[0],i[1]],[i[0],i[3]]];break;default:break}if(f){if(!d){n=VBI.Utilities.LineLineIntersection(u,v,p[0],p[1],false);if(n){l.push(n[0],n[1])}}l.push(v[0],v[1])}else if(d){n=VBI.Utilities.LineLineIntersection(u,v,p[0],p[1],false);if(n){l.push(n[0],n[1])}}u=[v[0],v[1]]}}return l};VBI.Utilities.GetBarycenterForPolygon=function(e,t){var i=e.slice(0);var r=[i[0],i[1]];var l=[i[i.length-2],i[i.length-1]];if(r!=l){i.push(i[0],i[1])}var a=i.length-2;var n=0;var s=0;var o;var u;for(var c=0;c<a;c+=2){n+=(i[c]+t)*i[c+3]-(i[c+2]+t)*i[c+1]}s=n/2;if(s){n=0;for(var v=0;v<a;v+=2){n+=(i[v]+t+i[v+2]+t)*((i[v]+t)*i[v+3]-(i[v+2]+t)*i[v+1])}o=n/(s*6);n=0;for(var f=0;f<a;f+=2){n+=(i[f+1]+i[f+3])*((i[f]+t)*i[f+3]-(i[f+2]+t)*i[f+1])}u=n/(s*6)}if(o&&u){return[o,u]}return null};VBI.Utilities.GetMidpointForPolygon=function(e,t,i,r){var l=i;var a=[];var n=t[0];var s=t[1];var o=VBI.Utilities.PtInRect([n[0]+l,n[1]],r);var u=VBI.Utilities.PtInRect([s[0]+l,s[1]],r);if(!o||!u){e=VBI.Utilities.GetClippedPolygon(e,l,r);l=0}var c=VBI.Utilities.GetBarycenterForPolygon(e,l);if(c){var v=VBI.Utilities.getNextPoint(c[0],c[1],e,l);a.push(v);return{max:0,aPos:a}}return null};VBI.Utilities.GetClippedPolygons=function(e,t,i){var r=[];var l=e.slice(0);var a=l.length;var n=a-2;var s=VBI.Utilities.IsClockwise(e);if(s>0){l.push(i[0],i[1],i[2],i[1],i[2],i[3],i[0],i[3])}else{l.push(i[0],i[1],i[0],i[3],i[2],i[3],i[2],i[1])}var o=l.length;var u=[];var c=[];var v=[];var f=[];for(var d=0;d<a;d+=2){v.push(d)}var p,h,m,g;var I;p=[l[n]+t,l[n+1]];for(var b=0;b<=n;b+=2){h=[l[b]+t,l[b+1]];var y=VBI.Utilities.LineIntersectRect(p[0],p[1],h[0],h[1],i);if(y.bReturn==true){if((y.x0!=p[0]||y.y0!=p[1])&&(y.x1!=h[0]||y.y1!=h[1])){if(!(y.x0==y.x1&&y.y0==y.y1)){var B=l.push(y.x0,y.y0);I=l.push(y.x1,y.y1);u.push(B-2);c.push(I-2);var x=v.indexOf(b);v.splice(x,0,B-2,I-2)}}else if(y.x0!=p[0]||y.y0!=p[1]){if(y.x0!=h[0]||y.y0!=h[1]){I=l.push(y.x0,y.y0);u.push(I-2);var V=v.indexOf(b);v.splice(V,0,I-2)}}else if(y.x1!=h[0]||y.y1!=h[1]){I=l.push(y.x1,y.y1);c.push(I-2);var U=v.indexOf(b);v.splice(U,0,I-2)}}p=h}for(var A=a,C=0;C<4;A+=2,++C){var T=[];f.push(A);m=[l[A],l[A+1]];if(C==3){g=[l[a],l[a+1]]}else{g=[l[A+2],l[A+3]]}var R=m[0]==g[0]?1:0;var L=R?0:1;for(var w=o;w<=l.length-2;w+=2){if(l[w+L]==m[L]){T.push({pt:l[w+R],idx:w})}}if(C<2){T.sort(VBI.Utilities.StandardSort1)}else{T.sort(VBI.Utilities.StandardSort2)}for(var M=0;M<T.length;++M){f.push(T[M].idx)}m=g}for(var _=a;_<=l.length-2;_+=2){l[_]-=t}for(var E=0;E<u.length;++E){var P=[];var H=u[E];var S=v.indexOf(u[E]);var D=v;var N=f;var O=c;var k=u;P.push(l[u[E]],l[u[E]+1]);var G=0;var W=true;while(W){S++;if(S>D.length-1){S=0}if(D[S]==H){r.push(P);break}P.push(l[D[S]],l[D[S]+1]);var j=O.indexOf(D[S]);if(j>-1){G++;S=N.indexOf(D[S]);var Q=D;D=N;N=Q;Q=O;O=k;k=Q}}}return r};VBI.Utilities.StandardSort1=function(e,t){return e.pt-t.pt};VBI.Utilities.StandardSort2=function(e,t){return t.pt-e.pt};VBI.Utilities.GetMidpointsForPolygon=function(e,t,i,r){var l=[];var a=i;var n=[];var s=t[0];var o=t[1];if(VBI.Utilities.RectIntersect([s[0]+a,s[1],o[0]+a,o[1]],r)){var u=VBI.Utilities.PtOnRect([s[0]+a,s[1]],r);var c=VBI.Utilities.PtOnRect([o[0]+a,o[1]],r);if(!u||!c){l=VBI.Utilities.GetClippedPolygons(e,a,r);if(!l.length){var v=[r[0]+(r[2]-r[0])/2,r[1]+(r[3]-r[1])/2];if(VBI.Utilities.pointInPolygon(e,v[0],v[1])){n.push(v)}}}else{l.push(e)}for(var f=0;f<l.length;++f){var d=VBI.Utilities.GetBarycenterForPolygon(l[f],a);if(d){var p=VBI.Utilities.getNextPoint(d[0],d[1],l[f],a);n.push(p)}}if(n.length>0){return{max:0,aPos:n}}}return null};VBI.Utilities.GetMidpointsForLine=function(e,t,i){var r=[];var l={};var a=[Number.MAX_VALUE,Number.MAX_VALUE];var n=false;var s;var o=[];if(e.length>5){for(var u=0;u<=e.length-6;u+=3){var c=e[u];var v=e[u+1];var f=e[u+3];var d=e[u+4];l=VBI.Utilities.LineIntersectRect(c+t,v,f+t,d,i);if(l.bReturn==true){if(s&&n&&(l.x0!=a[0]||l.y0!=a[1])){o.push(s);n=false}if(!n){s=[];s.push(l.x0);s.push(l.y0);n=true}s.push(l.x1);a[0]=l.x1;s.push(l.y1);a[1]=l.y1}else if(n){o.push(s);n=false}}if(n){o.push(s);n=false}}var p=0;var h=0;for(var m=0;m<o.length;m++){var g=o[m];if(g.length>3){var I=0;var b;var y=[];for(var B=0;B<=g.length-4;B+=2){b=Math.sqrt(Math.pow(g[B+2]-g[B],2)+Math.pow(g[B+3]-g[B+1],2));I+=b;y.push(b)}var x=I;var V=I/2;var U=-1;var A=0;for(var C=y.length-1;C>=0;C--){I-=y[C];if(I<=V){A=V-I;U=C;break}}if(U>-1){var T=[g[U*2+2]-g[U*2],g[U*2+3]-g[U*2+1]];var R=Math.sqrt(Math.pow(T[0],2)+Math.pow(T[1],2));var L=[T[0]/R,T[1]/R];var w=[L[0]*A,L[1]*A];r.push([g[U*2]+parseInt(w[0],10),g[U*2+1]+parseInt(w[1],10)]);if(x>p){p=x;h=m}}}}return{max:h,aPos:r}};VBI.Utilities.updateBoundRect=function(e,t){var i,r=e.length;var l=t[0];var a=t[2];var n=t[1];var s=t[3];for(var o=0;o<r;++o){i=e[o];if(l>i[0]){l=i[0]}if(a<i[0]){a=i[0]}if(n>i[1]){n=i[1]}if(s<i[1]){s=i[1]}}t[0]=l;t[2]=a;t[1]=n;t[3]=s};VBI.Utilities.inflateRect=function(e,t){e[0]-=t;e[1]-=t;e[2]+=t;e[3]+=t};VBI.Utilities.sqDistance=function(e,t,i,r,l,a){var n=i-e;var s=r-t;var o=n*n+s*s;if(!o){return(l-e)*(l-e)+(a-t)*(a-t)}var u=((l-e)*n+(a-t)*s)/o;if(u>1){u=1}else if(u<0){u=0}var c=e+u*n-l;var v=t+u*s-a;return c*c+v*v};VBI.Utilities.getNextPoint=function(e,t,i,r){var l,a,n=i.length;var s=[];var o=[];var u=false;for(var c=0,v=n,f=v-2;c<=v-2;c+=2){l=[i[c]+r,i[c+1]];a=[i[f]+r,i[f+1]];var d=0;var p=[];var h=e-l[0];var m=t-l[1];var g=a[0]-l[0];var I=a[1]-l[1];var b=h*g+m*I;var y=g*g+I*I;if(!y){d=(e-l[0])*(e-l[0])+(t-l[1])*(t-l[1]);p=[l[0],l[1]]}else{var B=b/y;if(B<0){p=[l[0],l[1]]}else if(B>1){p=[a[0],a[1]]}else{p=[l[0]+B*g,l[1]+B*I]}var x=e-(l[0]+B*g);var V=t-(l[1]+B*I);d=x*x+V*V}s.push(p);o.push(d);if((l[1]<=t&&t<a[1]||a[1]<=t&&t<l[1])&&e<(a[0]-l[0])*(t-l[1])/(a[1]-l[1])+l[0]){u=!u}f=c}if(u){return[e,t]}else{var U=1e4;var A=-1;if(o.length){for(var C=0;C<o.length;++C){if(o[C]<U){A=C;U=o[C]}}if(A>-1){return s[A]}}return[i[0]+r,i[1]]}};VBI.Utilities.DrawSelectIndicator=function(e,t){var i=4;e.lineWidth=1;e.strokeStyle="rgba( 0, 0, 0, 1.0 )";e.fillStyle="rgba( 10, 10, 255, 1.0 )";e.beginPath();e.arc(t[0],t[1],i,0,2*Math.PI);e.closePath();e.fill();e.stroke()};VBI.Utilities.DrawDesignRect=function(e,t,i,r,l,a){var n,s,o=3,u=e.setLineDash?true:false;e.save();e.lineWidth=1;e.strokeStyle="rgba( 0, 0, 0, 1.0 )";if(typeof i=="object"){var c=i[2]-i[0];var v=i[3]-i[1];var f=c/2;var d=v/2;if(u){e.setLineDash([1,2])}e.strokeRect(i[0],i[1],c,v);var p="rgba( 255, 255, 255, 1.0 )";var h="rgba( 128, 128, 128, 1.0 )";if(u){e.setLineDash([0,0])}e.fillStyle=p;for(n=0;n<3;++n){for(s=0;s<3;++s){e.fillStyle=t[s*3+n]?p:h;if(n==1&&s==1){continue}e.beginPath();e.arc(i[0]+n*f,i[1]+s*d,o,0,2*Math.PI);e.closePath();e.fill();e.stroke()}}}else{e.strokeRect(i-1,r-1,l-i,a-r);e.strokeStyle="rgba( 255, 255, 255, 1.0 )";e.strokeRect(i,r,l-i,a-r)}e.restore()};VBI.Utilities.DrawFrameRect=function(e,t,i,r,l,a){e.lineWidth=1;e.strokeStyle=t;if(typeof i=="object"){e.strokeRect(i[0],i[1],i[2]-i[0],i[3]-i[1])}else{e.strokeRect(i,r,l-i,a-r)}};VBI.Utilities.AssembleCopyrightString=function(e,t,i){var r=/\{LINK\|IMG\}/;var l=/\{IMG\}/;var a=/\{LINK\|([^\}]+)\}/;if(e){if(!t&&!i){e=jQuery.sap.encodeHTML(e)}t=t?jQuery.sap.encodeHTML(t):t;i=i?jQuery.sap.encodeHTML(i):i;var n=e.replace(r,"<a href='"+t+"'><img src='"+i+"' width='10' height='10' border='none'></a>");n=n.replace(l,"<img src='"+i+"' width='10' height='10' border='none' >");return n.replace(a,"<a  href='"+t+"'>$1</a>")}return e};VBI.Utilities.DrawTrackingRect=function(e,t,i,r,l){e.save();e.strokeStyle="black";e.lineWidth=1;if(e.setLineDash){e.setLineDash([1,2])}e.beginPath();e.rect(t,i,r-t,l-i);e.stroke();e.fillStyle="rgba( 0, 192, 192, 0.2 )";e.fill();e.restore()};VBI.Utilities.DrawTrackingLasso=function(e,t){e.save();e.strokeStyle="black";e.lineWidth=1;if(e.setLineDash){e.setLineDash([1,2])}e.beginPath();e.moveTo(t[0][0],t[0][1]);for(var i=1;i<t.length;++i){e.lineTo(t[i][0],t[i][1])}e.closePath();e.stroke();e.fillStyle="rgba( 0, 192, 192, 0.2 )";e.fill();e.restore()};VBI.Utilities.RGB2HLS=function(e,t,i){e/=255;t/=255;i/=255;var r=Math.max(e,t,i);var l=Math.min(e,t,i);var a=0,n,s=(r+l)/2;if(r==l){a=n=0}else{var o=r-l;n=s>.5?o/(2-r-l):o/(r+l);switch(r){case e:a=(t-i)/o+(t<i?6:0);break;case t:a=(i-e)/o+2;break;case i:a=(e-t)/o+4;break}a/=6}return[a,s,n]};VBI.Utilities.HLS2RGB=function(e,t,i){var r=0,l=0,a=0;if(i==0){r=l=a=t}else{var n=t<.5?t*(1+i):t+i-t*i;var s=2*t-n;r=VBI.Utilities.HUE2RGB(s,n,e+1/3);l=VBI.Utilities.HUE2RGB(s,n,e);a=VBI.Utilities.HUE2RGB(s,n,e-1/3)}return[Math.round(r*255),Math.round(l*255),Math.round(a*255)]};VBI.Utilities.HUE2RGB=function(e,t,i){if(i<0){i+=1}else if(i>1){i-=1}if(i<1/6){return e+(t-e)*6*i}if(i<1/2){return t}if(i<2/3){return e+(t-e)*(2/3-i)*6}return e};VBI.Utilities.RemToPixel=function(e){return e*parseFloat(getComputedStyle(document.documentElement).fontSize)};VBI.Utilities.ColorHex2rgba=function(e){var t=e.charAt(0)==="#"?e.substring(1,7):e;return"rgba("+parseInt(t.substring(0,2),16)+","+parseInt(t.substring(2,4),16)+","+parseInt(t.substring(4,6),16)+",1.0)"};VBI.Utilities.String2VBColor=function(e){var t=VBI.Types.string2rgba(e);if(t[4]===1){return"RGBA("+t[0]+";"+t[1]+";"+t[2]+";"+parseInt(t[3]*255,10)+")"}else{return"RGB("+t[0]+";"+t[1]+";"+t[2]+")"}};VBI.Utilities.CompToHex=function(e){var t=e.toString(16);return t.length==1?"0"+t:t};VBI.Utilities.RgbToHex=function(e,t,i){return"#"+VBI.Utilities.CompToHex(e)+VBI.Utilities.CompToHex(t)+VBI.Utilities.CompToHex(i)}});
//# sourceMappingURL=saputilities.js.map