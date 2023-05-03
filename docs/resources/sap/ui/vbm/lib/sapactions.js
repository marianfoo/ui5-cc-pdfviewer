/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
sap.ui.define(["./sapvbi"],function(){"use strict";VBI.Actions=function(){var e={};e.m_actions=[];e.clear=function(){for(var t=0;t<e.m_actions.length;++t){e.m_actions[t].clear()}e.m_actions=[]};e.Set=function(t,n,r){if(n){var i;if(i=e.findById(n)){i.load(t,r)}else{i=new VBI.Actions.Action;i.load(t,r);e.m_actions.push(i)}return}};e.Remove=function(t,n,r){if(n){var i;if(i=e.findById(n)){e.m_actions.splice(i.m_nArrayIndex,1)}return}};e.load=function(t,n){var r;if(t.Remove){if(jQuery.type(t.Remove)=="array"){for(r=0;r<t.Remove.length;++r){e.Remove(t.Remove[r],t.Remove[r].id,n)}}}if(t.Set){if(jQuery.type(t.Set)=="array"){for(r=0;r<t.Set.length;++r){e.Set(t.Set[r].Action,t.Set[r].id,n)}return}if(!t.Set.id){e.clear()}if(jQuery.type(t.Set.Action)=="object"){e.Set(t.Set.Action,t.Set.Action.id,n)}else if(jQuery.type(t.Set.Action)=="array"){for(r=0;r<t.Set.Action.length;++r){e.Set(t.Set.Action[r],t.Set.Action[r].id,n)}}}};e.findById=function(t){var n=e.m_actions,r=n.length;for(var i=0;i<r;++i){var o=n[i];if(o&&o.m_id==t){o.m_nArrayIndex=i;return o}}};e.findAction=function(t,n,r,i){var o=null;if(jQuery.type(r)=="object"){o=r.m_ID}else if(jQuery.type(r)=="string"){o=r}var a,c=e.m_actions.length;for(var f=0;f<c;++f){a=e.m_actions[f];if((t?a.m_refEvent==t:true)&&(n?a.m_refScene==n.m_ID:true)&&(r?a.m_refVO==o:true)&&(i?a.m_id==i:true)){return a}}return null};VBI.Actions.Action=function(){var e={};e.m_id=0;e.m_name=null;e.m_refScene=null;e.m_refVO=null;e.m_refEvent=null;e.m_additionalProperties=[];e.clear=function(){e.m_addProperties=null};e.load=function(t,n){e.m_id=t.id;e.m_name=t.name;e.m_refScene=t.refScene;e.m_refVO=t.refVO;e.m_refEvent=t.refEvent;e.m_additionalProperties=[];if(t.AddActionProperty){if(jQuery.type(t.AddActionProperty)=="object"){e.m_additionalProperties.push(t.AddActionProperty.name)}else if(jQuery.type(t.AddActionProperty)=="array"){for(var r=0;r<t.AddActionProperty.length;++r){e.m_additionalProperties.push(t.AddActionProperty[r].name)}}}};return e};return e}});
//# sourceMappingURL=sapactions.js.map