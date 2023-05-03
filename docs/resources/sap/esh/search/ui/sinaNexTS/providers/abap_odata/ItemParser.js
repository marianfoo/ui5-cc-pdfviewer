/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["../../sina/SinaObject","../../core/util","./typeConverter","../tools/WhyfoundProcessor"],function(e,t,r,i){function a(e,t){if(!(e instanceof t)){throw new TypeError("Cannot call a class as a function")}}function u(e,t){for(var r=0;r<t.length;r++){var i=t[r];i.enumerable=i.enumerable||false;i.configurable=true;if("value"in i)i.writable=true;Object.defineProperty(e,i.key,i)}}function n(e,t,r){if(t)u(e.prototype,t);if(r)u(e,r);Object.defineProperty(e,"prototype",{writable:false});return e}function s(e,t){if(typeof t!=="function"&&t!==null){throw new TypeError("Super expression must either be null or a function")}e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:true,configurable:true}});Object.defineProperty(e,"prototype",{writable:false});if(t)o(e,t)}function o(e,t){o=Object.setPrototypeOf||function e(t,r){t.__proto__=r;return t};return o(e,t)}function l(e){var t=p();return function r(){var i=v(e),a;if(t){var u=v(this).constructor;a=Reflect.construct(i,arguments,u)}else{a=i.apply(this,arguments)}return f(this,a)}}function f(e,t){if(t&&(typeof t==="object"||typeof t==="function")){return t}else if(t!==void 0){throw new TypeError("Derived constructors may only return object or undefined")}return c(e)}function c(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function p(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}));return true}catch(e){return false}}function v(e){v=Object.setPrototypeOf?Object.getPrototypeOf:function e(t){return t.__proto__||Object.getPrototypeOf(t)};return v(e)}
/*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */var d=e["SinaObject"];var b=i["WhyfoundProcessor"];function g(e,t,r){if(r){return t?t(e):e}if(!e||!e.then){e=Promise.resolve(e)}return t?e.then(t):e}function y(e,t,r){if(r){return t?t(e()):e()}try{var i=Promise.resolve(e());return t?i.then(t):i}catch(e){return Promise.reject(e)}}var h=function(e){s(u,e);var i=l(u);function u(e){var t;a(this,u);t=i.call(this);t.provider=e;t.sina=e.sina;t.intentsResolver=t.sina._createFioriIntentsResolver();t.suvNavTargetResolver=t.sina._createSuvNavTargetResolver();return t}n(u,[{key:"parse",value:function e(t,r){if(r.ResultList.SearchResults===null){return Promise.resolve([])}var i=r.ResultList.SearchResults.results;return this.parseItems(i)}},{key:"parseItems",value:function e(t){var r=[];for(var i=0;i<t.length;++i){var a=t[i];var u=this.parseItem(a);r.push(u)}return Promise.all(r)}},{key:"parseItem",value:function e(i){var a=this;return y(function(){var e;var u={};var n=[];var s=[];var o=[];var l=[];var f=[];var c;var p=a.sina.getDataSource(i.DataSourceId);var v,d,y,h;var m=i.Score/100;var A=[];var T,_,O,I;var S={};var R={};var P=new b(a.sina);for(e=0;e<i.Attributes.results.length;e++){v=i.Attributes.results[e];d=p.getAttributeMetadata(v.Id);y=a.sina._createSearchResultSetItemAttribute({id:v.Id,label:d.label,value:r.odata2Sina(d.type,v.Value),valueFormatted:v.ValueFormatted!==undefined?v.ValueFormatted:v.Value,valueHighlighted:v.Snippet||"",isHighlighted:v.Snippet.indexOf("<b>")>-1&&v.Snippet.indexOf("</b>")>-1,metadata:d,groups:[]});u[y.id]=y;t.appendRemovingDuplicates(A,t.extractHighlightedTerms(y.valueHighlighted));if(d.suvUrlAttribute&&d.suvMimeTypeAttribute){O=u[d.suvUrlAttribute]||d.suvUrlAttribute.id;I=u[d.suvMimeTypeAttribute]||d.suvMimeTypeAttribute.id;S[v.Id]={suvThumbnailAttribute:y,suvTargetUrlAttribute:O,suvTargetMimeTypeAttribute:I}}if(d.usage.Navigation){if(d.usage.Navigation.mainNavigation){c=a.sina._createNavigationTarget({label:y.value,targetUrl:y.value,target:"_blank"})}}o.push(y);if(d.usage.Detail){l.push(y)}if(d.usage.Title){n.push(y)}if(d.usage.TitleDescription){s.push(y)}h=p.attributeMetadataMap[y.id]._private.semanticObjectType;if(h&&h.length>0){f.push({name:h,value:y.value,type:y.metadata.type})}if(y.isHighlighted||y.descriptionAttribute&&y.descriptionAttribute.isHighlighted){if(!a._isVisible(d)&&typeof R[y.id]==="undefined"){R[y.id]=[y.valueHighlighted]}}}for(_ in S){T=S[_];if(typeof T.suvTargetUrlAttribute==="string"){T.suvTargetUrlAttribute=u[T.suvTargetUrlAttribute]}if(typeof T.suvTargetMimeTypeAttribute==="string"){T.suvTargetMimeTypeAttribute=u[T.suvTargetMimeTypeAttribute]}if(!(T.suvTargetUrlAttribute||T.suvTargetMimeTypeAttribute)){delete S[_]}}n.sort(function(e,t){return e.metadata.usage.Title.displayOrder-t.metadata.usage.Title.displayOrder});l.sort(function(e,t){return e.metadata.usage.Detail.displayOrder-t.metadata.usage.Detail.displayOrder});a.suvNavTargetResolver.resolveSuvNavTargets(p,S,A);var j=a.sina._createSearchResultSetItem({dataSource:p,attributes:o,titleAttributes:n,titleDescriptionAttributes:s,detailAttributes:l,defaultNavigationTarget:c,navigationTargets:[],score:m});j._private.allAttributesMap=u;j._private.semanticObjectTypeAttributes=f;var w=a.sina._createItemPostParser({searchResultSetItem:j});var D=j.detailAttributes;return g(w.postParseResultSetItem(),function(e){R=a._pushAdditionalWhyFounds(i,R,D);return g(P.processAdditionalWhyfoundAttributes(R,e))})})}},{key:"_isVisible",value:function e(t){if(typeof t.usage.Title!=="undefined"||typeof t.usage.Detail!=="undefined"||typeof t.isDescription!=="undefined"){return true}if(Array.isArray(t.groups)){for(var r=0;r<t.groups.length;r++){var i=t.groups[r].group;if(this._isVisible(i)&&this._isInTamplate(t.id,i)){return true}}return false}return false}},{key:"_isInTamplate",value:function e(t,r){if(r.template&&r.attributes&&r.attributes.length>0){var i=this._getNameInGroup(t,r.attributes);if(i&&r.template.includes("{"+i+"}")){return true}}return false}},{key:"_getNameInGroup",value:function e(t,r){for(var i=0;i<r.length;i++){if(r[i].attribute.id===t){return r[i].nameInGroup}}return undefined}},{key:"_pushAdditionalWhyFounds",value:function e(t,r,i){if(t.HitAttributes&&Array.isArray(t.HitAttributes.results)){for(var a=0;a<t.HitAttributes.results.length;a++){var u=t.HitAttributes.results[a];if(typeof r[u.id]==="undefined"&&!this._isUngrouppedDetailAttribute(u.Id,i)){r[u.Id]=[u.Snippet]}}}return r}},{key:"_isUngrouppedDetailAttribute",value:function e(t,r){for(var i=0;i<r.length;i++){if(t===r[i].id){return true}}return false}}]);return u}(d);var m={__esModule:true};m.ItemParser=h;return m})})();
//# sourceMappingURL=ItemParser.js.map