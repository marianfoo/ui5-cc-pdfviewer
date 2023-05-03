/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/base/Log","sap/ui/base/EventProvider","sap/ui/core/Core","sap/ui/core/format/NumberFormat","../getResourceBundle","./Measurement","../glMatrix","./Settings","./Utils"],function(e,t,r,i,a,n,s,o,u){"use strict";var m=6;var c=16;var l="http://www.w3.org/2000/svg";var d=t.extend("sap.ui.vk.measurements.Surface",{metadata:{library:"sap.ui.vk"},constructor:function(){t.call(this);var e=document.createElementNS(l,"svg");e._surface=this;e.classList.add("sapUiVizKitMeasurementSurface");e.innerHTML="<defs>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-start-highlighted'>"+"<polygon points='6 0, 6 4, 0 2'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-end-highlighted'>"+"<polygon points='0 0, 6 2, 0 4'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-start0'>"+"<polygon points='6 0, 6 4, 0 2'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-end0'>"+"<polygon points='0 0, 6 2, 0 4'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-start1'>"+"<polygon points='6 0, 6 4, 0 2'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-end1'>"+"<polygon points='0 0, 6 2, 0 4'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-start2'>"+"<polygon points='6 0, 6 4, 0 2'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-end2'>"+"<polygon points='0 0, 6 2, 0 4'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-start3'>"+"<polygon points='6 0, 6 4, 0 2'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-end3'>"+"<polygon points='0 0, 6 2, 0 4'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-start4'>"+"<polygon points='6 0, 6 4, 0 2'/>"+"</marker>"+"<marker markerWidth='6' markerHeight='4' refX='3' refY='2' orient='auto' id='arrow-end4'>"+"<polygon points='0 0, 6 2, 0 4'/>"+"</marker>"+"</defs>";var r=document.createElementNS(l,"g");var i=document.createElementNS(l,"g");var a=document.createElementNS(l,"g");e.append(r,i,a);this._svgDomRef=e;this._featuresDomRef=r;this._measurementsDomRef=i;this._measurementsUnderConstructionDomRef=a;this._features=[];this._measurements=[];this._measurementsUnderConstruction=[];this._settings=o.load();this._settings.scale=1}});d.prototype.destroy=function(){if(this._svgDomRef!=null){this._svgDomRef.remove();this._svgDomRef._surface=null}this._svgDomRef=null;this._featuresDomRef=null;this._measurementsDomRef=null;this._measurementsUnderConstructionDomRef=null;this._features=null;this._measurements=null;this._measurementsUnderConstruction=null;this._settings=null;t.prototype.destroy(this)};d.prototype.getDomRef=function(){return this._svgDomRef};d.prototype.addMeasurement=function(e){this._addMeasurement(e,false);this.fireMeasurementsAdded({measurements:[e]});return this};d.prototype._addMeasurement=function(e,t){var r;if(e.isDistance){r=document.createElementNS(l,"g");r.dataset.sapUiVkMeasurement=true;var i=document.createElementNS(l,"line");var a=document.createElementNS(l,"rect");var n=document.createElementNS(l,"text");n.appendChild(document.createTextNode(""));r.append(i,a,n)}else if(e.isAngle){r=document.createElementNS(l,"g");r.dataset.sapUiVkMeasurement=true;var s=document.createElementNS(l,"path");var o=document.createElementNS(l,"path");o.classList.add("sapUiVizKitMeasurementDashed");var u=document.createElementNS(l,"path");u.classList.add("sapUiVizKitMeasurementDotted");var m=document.createElementNS(l,"path");var c=document.createElementNS(l,"rect");var d=document.createElementNS(l,"text");d.appendChild(document.createTextNode(""));r.append(s,o,u,m,c,d)}else if(e.isArea){r=document.createElementNS(l,"g");r.dataset.sapUiVkMeasurement=true;var h=document.createElementNS(l,"path");h.classList.add("sapUiVizKitMeasurementFill");h.setAttribute("opacity",.5);var v=document.createElementNS(l,"path");v.classList.add("sapUiVizKitMeasurementStroke");v.setAttribute("opacity",.5);var f=document.createElementNS(l,"path");f.classList.add("sapUiVizKitMeasurementArea");var p=document.createElementNS(l,"path");p.classList.add("sapUiVizKitMeasurementAreaEdgeIntersecting");var g=document.createElementNS(l,"rect");var y=document.createElementNS(l,"text");y.appendChild(document.createTextNode(""));r.append(h,v,f,p,g,y)}else{throw new Error("Unknown measurement object")}if(t){this._measurementsUnderConstruction.push(e);this._measurementsUnderConstructionDomRef.appendChild(r)}else{this._measurements.push(e);this._measurementsDomRef.appendChild(r)}r._measurement=e;return this};d.prototype.removeMeasurement=function(e){this.fireMeasurementsRemoving({measurements:[e]});this._removeMeasurement(e,false);return this};d.prototype._removeMeasurement=function(e,t){var r;var i;if(t){r=this._measurementsUnderConstruction;i=this._measurementsUnderConstructionDomRef}else{r=this._measurements;i=this._measurementsDomRef}var a=r.indexOf(e);if(a>=0){r.splice(a,1);i.children[a].remove()}e.getFeatures().forEach(function(e){if(e){this.removeFeature(e)}},this);return this};d.prototype.beginMeasurementConstruction=function(e){this._addMeasurement(e,true);return this};d.prototype.endMeasurementConstruction=function(e){var t=this._measurementsUnderConstruction.indexOf(e);if(t>=0){this._measurementsUnderConstruction.splice(t,1);this._measurements.push(e);this._measurementsDomRef.appendChild(this._measurementsUnderConstructionDomRef.children[t]);this.fireMeasurementsAdded({measurements:[e]})}return this};d.prototype.cancelMeasurementConstruction=function(e){this._removeMeasurement(e,true);return this};d.prototype.highlightMeasurement=function(e,t,r,i){var a=this._measurements;var n=a.indexOf(e);if(n<0){return}e.setHighlighted(t);var s=this._measurementsDomRef.children[n];var o=s.children[0];var u=this.getMeasurementArrowColorCode();if(t){if(u!==""){s.classList.remove("sapUiVizKitMeasurement"+u)}s.classList.add("sapUiVizKitMeasurementHighlighted");if(e.isArea){s.children[2].removeAttribute("opacity")}else{o.setAttribute("marker-start","url(#arrow-start-highlighted)");o.setAttribute("marker-end","url(#arrow-end-highlighted)")}e.getFeatures().forEach(function(e){if(e){this.addFeature(e);var t=this._features.indexOf(e);if(t>=0){h(this._featuresDomRef.children[t],e,r,i,this._settings)}}},this)}else{s.classList.remove("sapUiVizKitMeasurementHighlighted");if(u!==""){s.classList.add("sapUiVizKitMeasurement"+u)}if(e.isArea){s.children[2].setAttribute("opacity",.5)}else{o.setAttribute("marker-start","url(#arrow-start"+u+")");o.setAttribute("marker-end","url(#arrow-end"+u+")")}e.getFeatures().forEach(function(e){if(e){this.removeFeature(e)}},this)}};d.prototype.getMeasurements=function(){return this._measurements};d.prototype.getMeasurementById=function(e){return this._measurements.find(function(t){return t.getId()===e})};d.prototype.addFeature=function(e){if(this._features.indexOf(e)>=0){return this}var t;if(e.isVertex){t=document.createElementNS(l,"circle")}else if(e.isEdge){t=document.createElementNS(l,"line")}else if(e.isFace){t=document.createElementNS(l,"g");var r=document.createElementNS(l,"path");var i=document.createElementNS(l,"path");i.classList.add("sapUiVizKitMeasurementContour");t.append(r,i)}else{throw new Error("Unknown measurement feature")}this._features.push(e);this._featuresDomRef.append(t);return this};d.prototype.removeFeature=function(e){var t=this._features;var r=t.indexOf(e);if(r>=0){t.splice(r,1);this._featuresDomRef.children[r].remove()}return this};function h(e,t,r,i,a){var n=null;if(t.isVertex){n=D}else if(t.isEdge){n=V}else if(t.isFace){n=x}if(n!=null){n(e,t,r,i,a)}}d.prototype.update=function(e,t){var r;var i;var a=this._measurements;var n=this._measurementsDomRef.children;for(var s=0;s<2;++s){for(r=0,i=a.length;r<i;++r){var o=a[r];var u=n[r];if(o.getVisible()){u.setAttribute("visibility","visible")}else{u.setAttribute("visibility","hidden");continue}var m=null;if(o.isDistance){m=y}else if(o.isAngle){m=E}else if(o.isArea){m=k}if(m!=null){m(u,o,e,t,this._settings)}}a=this._measurementsUnderConstruction;n=this._measurementsUnderConstructionDomRef.children}var c=this._features;var l=this._featuresDomRef.children;for(r=0,i=c.length;r<i;++r){h(l[r],c[r],e,t,this._settings)}return this};var v=new Map;r.attachLocalizationChanged(function(){v.clear()});function f(e,t){var r=t.precision;var n=t.units;var s=t.scale*u.getUnitFactor(n);var o=v.get(r);if(o==null){o=i.getFloatInstance({minFractionDigits:r,maxFractionDigits:r});v.set(r,o)}var m=a().getText("MEASUREMENTS_DISTANCE_VALUE",[o.format(e*s),u.translateUnits(n)]);return m}function p(e,t,r,i,a,n){e.childNodes[0].data=r;var s=e.getBBox().width+10;var o=26;var u=i-s*.5;var m=a-o*.5;if(n&&n.x>=u&&n.x<=u+s&&n.y>=m&&n.y<=m+o){a-=o;m-=o}t.x.baseVal.value=u;t.y.baseVal.value=m;t.width.baseVal.value=s;e.setAttribute("x",i);e.setAttribute("y",a)}function g(e,t,r){var i=r?"sapUiVizKitMeasurementHighlighted":"sapUiVizKitMeasurement"+t;if(!e.classList.contains(i)){e.classList.forEach(function(e,t,r){r.remove(e)});e.classList.add(i)}}function y(e,t,r,i,a){var n=U(a);var s=t.getHighlighted();g(e,n,s);var o=t.getPoint1();var u=t.getPoint2();var c=r.projectToScreen(o[0],o[1],o[2],i);var l=r.projectToScreen(u[0],u[1],u[2],i);var d=e.children[0];if(t.getShowArrows()){var h=l.x-c.x;var v=l.y-c.y;var y=Math.sqrt(h*h+v*v);if(Math.abs(y)<1e-5){e.setAttribute("visibility","hidden");return this}var b=m*h/y;var A=m*v/y;d.x1.baseVal.value=c.x+b;d.y1.baseVal.value=c.y+A;d.x2.baseVal.value=l.x-b;d.y2.baseVal.value=l.y-A;d.setAttribute("marker-start",s?"url(#arrow-start-highlighted)":"url(#arrow-start"+n+")");d.setAttribute("marker-end",s?"url(#arrow-end-highlighted)":"url(#arrow-end"+n+")")}else{d.x1.baseVal.value=c.x;d.y1.baseVal.value=c.y;d.x2.baseVal.value=l.x;d.y2.baseVal.value=l.y;d.removeAttribute("marker-start");d.removeAttribute("marker-end")}e.removeAttribute("visibility");var M=(c.x+l.x)*.5;var _=(c.y+l.y)*.5;p(e.children[2],e.children[1],f(t.getDistance(),a),M,_,c);return this}function b(e,t,r,i){var a=i|0;var n=e.projectToScreen(r[a+0],r[a+1],r[a+2],t);return[n.x,n.y,0]}function A(e,t,r){var i=r|0;var a=s.vec3.fromValues(t[i],t[i+1],t[i+2]);s.vec3.transformMat4(a,a,e);return a}function M(e,t,r,i){var a=A(r,i);return b(e,t,a)}function _(e,t){return s.vec3.fromValues(t*Math.cos(e),t*Math.sin(e),0)}function E(e,t,r,n,o){var l=U(o);var d=t.getHighlighted();g(e,l,d);var h=t.getPoints();var f=[h[6],h[7],h[8]];var y=[h[9],h[10],h[11]];var b=u.pointMinusPoint(f,y);b=u.pointMinusPoint(h,b);var E=[h[15],h[16],h[17]];var S=u.normalize(u.crossProduct(u.computeEdgeDirection(y,b),u.computeEdgeDirection(y,E)));var k=s.mat4.create();var D=s.quat.create();s.quat.rotationTo(D,s.vec3.fromValues(0,0,1),s.vec3.fromValues(S[0],S[1],S[2]));s.mat4.fromRotationTranslation(k,D,s.vec3.fromValues(y[0],y[1],y[2]));var V=s.mat4.create();s.mat4.invert(V,k);var x=A(V,h,0);var w=A(V,h,3);var R=A(V,f);var C=A(V,y);var N=A(V,h,12);var L=A(V,h,15);var P=M(r,n,k,x);var T=M(r,n,k,w);var F="M"+P[0]+" "+P[1]+" L"+T[0]+" "+T[1];var H=u.computePointToPointDistance(x,w);var I=u.computePointToPointDistance(C,N);var z=u.computePointToPointDistance(C,L);var K=I>z?I:z;var j=t.getState();if(j>0&&H>0&&K>0){var W=M(r,n,k,N);var X=W;var Y=T;if(X[0]!==Y[0]||X[1]!==Y[1]){F+=" M"+X[0]+" "+X[1]}var O=M(r,n,k,L);F+=" L"+O[0]+" "+O[1];var B=u.computeEdgeDirection(w,x);var q=u.computeEdgeDirection(N,L);var J=t.getRadiusScale();var Z=J<0;var G=K*Math.abs(J);var Q=u.angleBetweenVectors2D(1,0,B[0],B[1]);var $=u.angleBetweenVectors2D(B[0],B[1],q[0],q[1]);if($<0){Q=u.angleBetweenVectors2D(B[0],B[1],-1,0);$=-$}var ee=Q+$/2;var te=t.getAngle();var re=Math.PI/180;X=M(r,n,k,_(ee,G));Y=M(r,n,k,_(ee+re,G));var ie=re*m/u.computePointToPointDistance(X,Y);if(Z){ee+=Math.PI;te=2*Math.PI-te;$=$-2*Math.PI;ie=-ie}var ae=Math.ceil(Math.abs($)/(Math.PI/2));var ne=Q+ie;var se=($-ie-ie)/ae;var oe="";for(var ue=0;ue<ae;++ue){var me=_(ne+se*ue,G);var ce=_(ne+se*(1+ue),G);var le=me[0];var de=me[1];var he=ce[0];var ve=ce[1];var fe=le*le+de*de;var pe=fe+le*he+de*ve;var ge=4/3*(Math.sqrt(2*fe*pe)-pe)/(le*ve-de*he);var ye=[le-ge*de,de+ge*le,0];var be=[he+ge*ve,ve-ge*he,0];if(ue===0){me=M(r,n,k,me);oe+=" M"+me[0]+" "+me[1]}ye=M(r,n,k,ye);be=M(r,n,k,be);ce=M(r,n,k,ce);oe+=" C"+ye[0]+" "+ye[1]+" "+be[0]+" "+be[1]+" "+ce[0]+" "+ce[1]}var Ae=e.children[0];Ae.setAttribute("d",oe);Ae.setAttribute("marker-start",d?"url(#arrow-start-highlighted)":"url(#arrow-start"+l+")");Ae.setAttribute("marker-end",d?"url(#arrow-end-highlighted)":"url(#arrow-end"+l+")");Ae.setAttribute("opacity",j===1?.5:1);Ae.removeAttribute("visibility");Ae=e.children[1];var Me=M(r,n,k,R);var _e=M(r,n,k,C);var Ee=Me[0]!==_e[0]||Me[1]!==_e[1];X=_e;Y=M(r,n,k,_(Q,G));var Se=u.computePointToPointDistance(X,Y)+c;var ke=u.computeEdgeDirection(X,Y);var De=u.pointPlusPoint(u.scalePoint(ke,Se),X);var Ve="";if(Ee){Ve="M"+X[0]+" "+X[1]+" L"+De[0]+" "+De[1]}else if(u.computeEdgeToPointDistance2(P,T,De)>.001){Ve="M"+P[0]+" "+P[1]+" L"+De[0]+" "+De[1]}X=_e;Y=M(r,n,k,_(Q+$,G));Se=u.computePointToPointDistance(X,Y)+c;ke=u.computeEdgeDirection(X,Y);De=u.pointPlusPoint(u.scalePoint(ke,Se),X);if(u.computeEdgeToPointDistance2(W,O,De)>.001){Ve+="M"+O[0]+" "+O[1]+" L"+De[0]+" "+De[1]}if(Ve.length>0){Ae.setAttribute("d",Ve);Ae.removeAttribute("visibility")}else{Ae.setAttribute("d","");Ae.setAttribute("visibility","hidden")}Ae=e.children[2];if(Ee){X=Me;Y=_e;Ae.setAttribute("d","M"+X[0]+" "+X[1]+" L"+Y[0]+" "+Y[1]);Ae.removeAttribute("visibility")}else{Ae.setAttribute("d","");Ae.setAttribute("visibility","hidden")}var xe=o.precision;var Ue=v.get(xe);if(Ue==null){Ue=i.getFloatInstance({minFractionDigits:xe,maxFractionDigits:xe});v.set(xe,Ue)}var we=a().getText("MEASUREMENTS_ANGLE_VALUE",Ue.format(180*te/Math.PI));X=M(r,n,k,_(ee,G));p(e.children[5],e.children[4],we,X[0],X[1],null);e.children[3].removeAttribute("visibility");e.children[4].removeAttribute("visibility");e.children[5].removeAttribute("visibility")}else{e.children[0].setAttribute("visibility","hidden");e.children[1].setAttribute("visibility","hidden");e.children[2].setAttribute("visibility","hidden");e.children[4].setAttribute("visibility","hidden");e.children[5].setAttribute("visibility","hidden")}var Re=e.children[3];Re.setAttribute("d",F);g(Re,"StrokeColor"+l,false);Re.removeAttribute("visibility");return this}function S(e,t){var r=t.precision;var n=t.units;var s=t.scale*u.getUnitFactor(n);var o=v.get(r);if(o==null){o=i.getFloatInstance({minFractionDigits:r,maxFractionDigits:r});v.set(r,o)}var m=a().getText("MEASUREMENTS_AREA_VALUE",[o.format(e*s*s),u.translateUnits(n,"2")]);return m}function k(e,t,r,i,a){var n=U(a);var s=t.getHighlighted();g(e,n,s);var o=t.getArea();var u=o&&o<0;if(u){o=-o}var m=t.getPoints();var c=e.children[2];var l=m?m.length:0;if(l>=6){var d="";for(var h=0;h<l;h+=3){var v=b(r,i,m,h);d+=(h===0?"M":" L")+v[0]+" "+v[1]}if(!u){d+=" Z"}c.setAttribute("d",d);c.removeAttribute("visibility")}else{c.setAttribute("visibility","hidden")}c.classList.remove("sapUiVizKitMeasurementAreaSelfIntersecting");var f=t.hasSelfIntersections();if(f){c.classList.add("sapUiVizKitMeasurementAreaSelfIntersecting")}var y=e.children[3];if(l>=6&&t.hasSelfIntersectionsLastEdge()){var A=b(r,i,m,l-6);var M=b(r,i,m,l-3);y.setAttribute("d","M"+A[0]+" "+A[1]+" L"+M[0]+" "+M[1]);y.removeAttribute("visibility")}else{y.setAttribute("visibility","hidden")}var _=t.getFeatures();if(_&&Array.isArray(_)&&_.length===1&&_[0].isFace){x(e,_[0],r,i,null)}else{e.children[0].setAttribute("d","");e.children[1].setAttribute("d","")}if(s||u){c.removeAttribute("opacity")}else{c.setAttribute("opacity",.5)}var E=e.children[4];var k=e.children[5];if(o&&!f){var D=b(r,i,t.getPosition());p(k,E,S(o,a),D[0],D[1],null);k.removeAttribute("visibility");E.removeAttribute("visibility")}else{k.setAttribute("visibility","hidden");E.setAttribute("visibility","hidden")}return this}function D(e,t,r,i,a){var n=t.getValue();var s=r.projectToScreen(n[0],n[1],n[2],i);e.cx.baseVal.value=s.x;e.cy.baseVal.value=s.y;return this}function V(e,t,r,i,a){var n=t.getValue();var s=r.projectToScreen(n[0],n[1],n[2],i);e.x1.baseVal.value=s.x;e.y1.baseVal.value=s.y;s=r.projectToScreen(n[3],n[4],n[5],i);e.x2.baseVal.value=s.x;e.y2.baseVal.value=s.y;return this}function x(e,t,r,i,a){var n=t.getValue();var s=n.vertices;var o=n.triangles;var u=n.edges;var m;var c;var l;var d;var h;h="";for(l=0,d=o?o.length:0;l<d;l+=3){m=o[l]*3;c=r.projectToScreen(s[m],s[m+1],s[m+2],i);h+="M"+c.x+" "+c.y;m=o[l+1]*3;c=r.projectToScreen(s[m],s[m+1],s[m+2],i);h+=" L"+c.x+" "+c.y;m=o[l+2]*3;c=r.projectToScreen(s[m],s[m+1],s[m+2],i);h+=" L"+c.x+" "+c.y+" Z "}e.children[0].setAttribute("d",h);h="";for(l=0,d=u?u.length:0;l<d;l+=2){m=u[l]*3;c=r.projectToScreen(s[m],s[m+1],s[m+2],i);h+="M"+c.x+" "+c.y;m=u[l+1]*3;c=r.projectToScreen(s[m],s[m+1],s[m+2],i);h+=" L"+c.x+" "+c.y}e.children[1].setAttribute("d",h);return this}d.prototype.hitTest=function(e,t){var r=this._svgDomRef;var i=r.getBoundingClientRect();var a=r.style;a.pointerEvents="auto";var n=document.elementFromPoint(e+i.x,t+i.y);a.pointerEvents="none";var s=n&&n.parentElement;return s!=null&&s.dataset.sapUiVkMeasurement==="true"?s:null};d.prototype.updateSettings=function(e){Object.assign(this._settings,e);return this};d.prototype.getScale=function(){return this._settings.scale};d.prototype.setScale=function(e){if(e!==this._settings.scale){var t={oldScale:this._settings.scale,newScale:e};this._settings.scale=e;this.fireScaleChanged(t)}return this};function U(e){return e.color}d.prototype.getMeasurementArrowColorCode=function(){return U(this._settings)};d.prototype.toJSON=function(e){var t=Array.isArray(e)?e:this._measurements;return{scale:this._settings.scale,measurements:t.map(function(e){return e.toJSON()})}};d.prototype.fromJSON=function(t,r){if("scale"in t){if(t.scale>0){this.setScale(t.scale)}else{e.error("Incorrect 'scale' value: "+t.scale)}}var i=t.measurements.map(n.createFromJSON);var a;if(r){a=this._measurements.slice()}else{a=t.measurements.map(function(e){return e.id}).map(this.getMeasurementById,this).filter(function(e){return e!=null})}if(a.length>0){this.fireMeasurementsRemoving({measurements:a});a.forEach(function(e){this._removeMeasurement(e,false)},this)}if(i.length>0){i.forEach(function(e){this._addMeasurement(e,false)},this);this.fireMeasurementsAdded({measurements:i})}};var w={measurementsAdded:"measurementsAdded",measurementsRemoving:"measurementsRemoving",scaleChanged:"scaleChanged"};d.prototype.attachMeasurementsAdded=function(e,t,r){return this.attachEvent(w.measurementsAdded,e,t,r)};d.prototype.detachMeasurementsAdded=function(e,t){return this.detachEvent(w.measurementsAdded,e,t)};d.prototype.fireMeasurementsAdded=function(e){return this.fireEvent(w.measurementsAdded,e)};d.prototype.attachMeasurementsRemoving=function(e,t,r){return this.attachEvent(w.measurementsRemoving,e,t,r)};d.prototype.detachMeasurementsRemoving=function(e,t){return this.detachEvent(w.measurementsRemoving,e,t)};d.prototype.fireMeasurementsRemoving=function(e){return this.fireEvent(w.measurementsRemoving,e)};d.prototype.attachScaleChanged=function(e,t,r){return this.attachEvent(w.scaleChanged,e,t,r)};d.prototype.detachScaleChanged=function(e,t){return this.detachEvent(w.scaleChanged,e,t)};d.prototype.fireScaleChanged=function(e){return this.fireEvent(w.scaleChanged,e)};return d});
//# sourceMappingURL=Surface.js.map