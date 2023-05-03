// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([],function(){"use strict";function t(){var t,e;function i(t){this.size=0;if(typeof t=="number"){this.limit=t}else{this.limit=10}this.map={};this.head=null;this.tail=null}i.prototype.LRUnode=function(t,e){if(typeof t!="undefined"&&t!==null){this.key=t}if(typeof e!="undefined"&&e!==null){this.value=e}this.prev=null;this.next=null};i.prototype.setHead=function(t){t.next=this.head;t.prev=null;if(this.head!==null){this.head.prev=t}this.head=t;if(this.tail===null){this.tail=t}this.size++;this.map[t.key]=t};i.prototype.set=function(t,n){var s=new i.prototype.LRUnode(t,n);if(this.map[t]){this.map[t].value=s.value;this.remove(s.key)}else if(this.size>=this.limit){var h=this.map[this.tail.key];delete this.map[this.tail.key];this.size--;this.tail=this.tail.prev;this.tail.next=null;if(e){e(h)}}this.setHead(s)};i.prototype.get=function(t){if(this.map[t]){var e=this.map[t].value;var n=new i.prototype.LRUnode(t,e);this.remove(t);this.setHead(n);return e}else{return null}};i.prototype.remove=function(t){var e=this.map[t];if(e.prev!==null){e.prev.next=e.next}else{this.head=e.next}if(e.next!==null){e.next.prev=e.prev}else{this.tail=e.prev}delete this.map[t];this.size--};i.prototype.removeAll=function(t){this.size=0;this.map={};this.head=null;this.tail=null;if(typeof t=="number"){this.limit=t}};i.prototype.forEach=function(t){var e=this.head,i=0;while(e){t.apply(this,[e,i,this]);i++;e=e.next}};i.prototype.toJSON=function(){var t=[],e=this.head;while(e){t.push({key:e.key,value:e.value});e=e.next}return t};i.prototype.toString=function(){var t="",e=this.head;while(e){t+=String(e.key)+":"+e.value;e=e.next;if(e){t+="\n"}}return t};this.init=function(n,s){t=new i(n);e=s};this.get=function(e){return t.get(e)};this.set=function(e,i){t.set(e,i)};this.remove=function(e){t.remove(e)};this.forEach=function(e){t.forEach(e)};this.length=function(){return t.size}}return new t},true);
//# sourceMappingURL=Storage.js.map