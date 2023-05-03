/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["./Measurement","./MeasurementType","./Utils"],function(t,i,o){"use strict";var e=function(i){t.apply(this,arguments);this._area=i&&"area"in i?i.area:0;this._position=i&&"position"in i?i.position.slice():[0,0,0];this._points=i&&"points"in i?i.points.slice():[]};e.prototype=Object.create(t.prototype);e.prototype.constructor=e;e.prototype.isArea=true;t._classMap.set(i.Area,e);e.prototype.getPoints=function(){return this._points};e.prototype.getPosition=function(){return this._position};e.prototype.getArea=function(){return this._area};e.prototype.duplicateLastPoint=function(){var t=this._points;var i=t.length-3;t.push(t[i]);t.push(t[i+1]);t.push(t[i+2]);this.updateContourPositionAndArea();return this};e.prototype.replaceLastPoints=function(t,i,o){if(t){this._points.splice(-t*3,t*3)}if(o){for(var e=i.length-3;e>=0;e-=3){this._points.push(i[e],i[e+1],i[e+2])}}else{this._points=this._points.concat(i)}this.updateContourPositionAndArea();return this};e.prototype.replaceLastPoint=function(t){var i=this._points;var o=i.length-3;i[o]=t[0];i[o+1]=t[1];i[o+2]=t[2];this.updateContourPositionAndArea();return this};e.prototype.deletePredLastPoints=function(t){var i=this._points;var o=i.pop();var e=i.pop();var s=i.pop();var n=(t-1)*3;if(n>0){this._points.splice(-n,n)}var r=i.length;if(r>=3){i[r-3]=s;i[r-2]=e;i[r-1]=o}this.updateContourPositionAndArea();return this};e.prototype.toString=function(){return"{ visible: "+this._visible+", area: "+this._area+", position: ["+this._position.join(", ")+"]"+", points: ["+this._points.join(", ")+"]"+" }"};e.prototype.updateContourPositionAndArea=function(){var t=this._points;var i=t.length;if(o.equalPoints(t,0,t,i-3)){i-=3}var e=0;var s=0;var n=0;var r;for(var a=0;a<i;a+=3){var p=a+3;if(p>=i){p=0}e+=t[a]*t[p+1]-t[a+1]*t[p];r=t[a]*t[p+1]-t[p]*t[a+1];s+=(t[a]+t[p])*r;n+=(t[a+1]+t[p+1])*r}e*=.5;r=i>=9?1/(6*e):0;this._position=[s*r,n*r,0];this._area=i<9?null:-Math.abs(e)};e.prototype.setFromFace=function(t){var i=t.getValue();var e=i.vertices;if(t.isClosedContour()){this._points=Array.from(e);this.updateContourPositionAndArea()}else{var s=i.triangles;var n,r,a=0;var p=[0,0,0];for(var u=0,h=s.length;u<h;u+=3){n=o.computeTriangleArea(e,s[u]*3,s[u+1]*3,s[u+2]*3);r=o.computeTriangleAverageCoordinate(e,s[u]*3,s[u+1]*3,s[u+2]*3);p[0]+=n*r[0];p[1]+=n*r[1];p[2]+=n*r[2];a+=n}this._area=a;this._position=o.scalePoint(p,1/a)}};e.prototype.finalize=function(){var t=this._points;if(o.isClosedContour(t)){t.pop();t.pop();t.pop()}this._area=Math.abs(this._area)};e.prototype.hasSelfIntersections=function(){return o.hasSelfIntersections(this._points,false)};e.prototype.hasSelfIntersectionsLastEdge=function(){return o.hasSelfIntersectionsLastEdge(this._points)};e.prototype.toJSON=function(){return{type:i.Area,id:this._id,visible:this._visible,area:this._area,position:Array.from(this._position),points:Array.from(this._points),features:this._features.map(function(t){return t!=null?t.toJSON():null})}};return e});
//# sourceMappingURL=Area.js.map