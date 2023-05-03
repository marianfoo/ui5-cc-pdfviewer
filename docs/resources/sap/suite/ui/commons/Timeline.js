/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/thirdparty/jquery","./library","sap/ui/core/Control","sap/ui/core/ResizeHandler","sap/ui/core/format/DateFormat","sap/ui/model/ClientListBinding","sap/ui/model/FilterType","sap/suite/ui/commons/TimelineNavigator","sap/suite/ui/commons/util/DateUtils","sap/suite/ui/commons/util/ManagedObjectRegister","sap/ui/model/json/JSONModel","sap/ui/model/Sorter","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/base/ManagedObject","sap/suite/ui/commons/TimelineItem","sap/suite/ui/commons/TimelineRenderManager","sap/ui/core/delegate/ScrollEnablement","sap/ui/base/Object","sap/base/assert","sap/base/Log","./TimelineRenderer"],function(jQuery,t,e,i,r,s,o,n,a,l,u,h,p,g,c,f,d,_,m,y,D,F){"use strict";var I=t.TimelineScrollingFadeout,S=t.TimelineAlignment,T=t.TimelineGroupType,b=t.TimelineFilterType,M=t.TimelineAxisOrientation;var v=e.extend("sap.suite.ui.commons.Timeline",{metadata:{library:"sap.suite.ui.commons",properties:{alignment:{type:"sap.suite.ui.commons.TimelineAlignment",group:"Misc",defaultValue:"Right"},axisOrientation:{type:"sap.suite.ui.commons.TimelineAxisOrientation",group:"Misc",defaultValue:"Vertical"},data:{type:"object",group:"Misc",defaultValue:null,deprecated:true},enableAllInFilterItem:{type:"boolean",group:"Behavior",defaultValue:true,deprecated:true},enableBackendFilter:{type:"boolean",group:"Misc",defaultValue:true,deprecated:true},enableBusyIndicator:{type:"boolean",group:"Misc",defaultValue:true},enableDoubleSided:{type:"boolean",group:"Misc",defaultValue:false},enableModelFilter:{type:"boolean",group:"Misc",defaultValue:true},enableScroll:{type:"boolean",group:"Misc",defaultValue:true},enableSocial:{type:"boolean",group:"Misc",defaultValue:false},filterTitle:{type:"string",group:"Misc",defaultValue:null},forceGrowing:{type:"boolean",group:"Misc",defaultValue:false},group:{type:"boolean",group:"Misc",defaultValue:false,deprecated:true},groupBy:{type:"string",group:"Misc",defaultValue:null},groupByType:{type:"sap.suite.ui.commons.TimelineGroupType",group:"Misc",defaultValue:"None"},growing:{type:"boolean",group:"Misc",defaultValue:true,deprecated:true},growingThreshold:{type:"int",group:"Misc",defaultValue:5},height:{type:"sap.ui.core.CSSSize",group:"Misc",defaultValue:""},lazyLoading:{type:"boolean",group:"Dimension",defaultValue:false},noDataText:{type:"string",group:"Misc",defaultValue:null},scrollingFadeout:{type:"sap.suite.ui.commons.TimelineScrollingFadeout",group:"Misc",defaultValue:"None"},showFilterBar:{type:"boolean",group:"Misc",defaultValue:true,deprecated:true},showHeaderBar:{type:"boolean",group:"Misc",defaultValue:true},showIcons:{type:"boolean",group:"Misc",defaultValue:true},showItemFilter:{type:"boolean",group:"Misc",defaultValue:true},showSearch:{type:"boolean",group:"Misc",defaultValue:true},showSort:{type:"boolean",group:"Misc",defaultValue:true},showSuggestion:{type:"boolean",group:"Behavior",defaultValue:true,deprecated:true},showTimeFilter:{type:"boolean",group:"Misc",defaultValue:true},sort:{type:"boolean",group:"Misc",defaultValue:true},dateTimePath:{type:"string",group:"Misc",defaultValue:""},sortOldestFirst:{type:"boolean",group:"Misc",defaultValue:false},textHeight:{type:"string",group:"Misc",defaultValue:""},width:{type:"sap.ui.core.CSSSize",group:"Dimension",defaultValue:"100%"}},defaultAggregation:"content",aggregations:{content:{type:"sap.suite.ui.commons.TimelineItem",multiple:true,singularName:"content"},customFilter:{type:"sap.ui.core.Control",multiple:false},filterList:{type:"sap.suite.ui.commons.TimelineFilterListItem",multiple:true,singularName:"filterList"},suggestionItems:{type:"sap.m.StandardListItem",multiple:true,singularName:"suggestionItem",deprecated:true}},events:{addPost:{deprecated:true,parameters:{value:{type:"string"}}},customMessageClosed:{},filterOpen:{},filterSelectionChange:{parameters:{type:{type:"sap.suite.ui.commons.TimelineFilterType"},searchTerm:{type:"string"},selectedItem:{type:"string"},selectedItems:{type:"object"},timeKeys:{type:"object"},clear:{type:"boolean"}}},grow:{},itemFiltering:{parameters:{item:{type:"sap.suite.ui.commons.TimelineItem"},reasons:{type:"object"},dataKeys:{type:"object"},timeKeys:{type:"object"},searchTerm:{type:"string"}}},select:{parameters:{selectedItem:{type:"sap.suite.ui.commons.TimelineItem"},userAction:{type:"boolean"}}},suggest:{deprecated:true,parameters:{suggestValue:{type:"string"}}},suggestionItemSelected:{deprecated:true,parameters:{selectedItem:{type:"sap.ui.core.Item"}}}},associations:{ariaLabelledBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaLabelledBy"}},designTime:true}});function C(t,e){var i;Object.defineProperty(t,e,{get:function(){return typeof i==="function"?i():i},set:function(t){i=t}})}var w=sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons"),B=Object.freeze({ASCENDING:"ASCENDING",DESCENDING:"DESCENDING"}),N=Object.freeze({UP:"UP",DOWN:"DOWN",NONE:"NONE"}),G={Year:r.getDateInstance({pattern:"yyyy"}),Quarter:r.getDateInstance({pattern:"QQQQ yyyy"}),Month:r.getDateInstance({format:"yyyyMMMM"}),Week:r.getDateInstance({pattern:"w"}),Day:r.getDateInstance({style:"long"}),MonthDay:r.getDateInstance({style:"medium"})};function x(t,e){var i;y(Array.isArray(t),"aArray must be an array.");if(typeof t.findIndex==="function"){return t.findIndex(e)}for(i=0;i<t.length;i++){if(e(t[i],i,t)){return i}}return-1}v.prototype.init=function(){this.aPrevFilters=[];this._objects=new l;this.reset();C(this,"_endDate");C(this,"_startDate");this._initControls();this.setBusyIndicatorDelay(0)};v.prototype.resetTimeLimits=function(){this._maxDate=null;this._minDate=null};v.prototype.setCustomModelFilter=function(t,e){var i=this.getBinding("content");if(i){var r=i.aFilters||[];var s=x(r,function(e){return e._customTimelineId===t});if(s!==-1){r.splice(s,1)}if(e!==null){e._customTimelineId=t;r.push(e)}i.filter(r,o.Control)}};v.prototype.setCustomGrouping=function(t){var e=this.getBindingInfo("content");this._fnCustomGroupBy=t;if(e){this._bindGroupingAndSorting(e);this.updateAggregation("content")}};v.prototype.setCurrentTimeFilter=function(t){this._startDate=t.from;this._endDate=t.to;this._rangeFilterType=t.type};v.prototype.setCurrentSearch=function(t){this._objects.getSearchField().setValue(t)};v.prototype.setCurrentFilter=function(t){var e=this,i=function(e){for(var i=0;i<t.length;i++){if(t[i]===e){return true}}return false};if(!t){return}if(!Array.isArray(t)){t=[t]}if(this._aFilterList.length===0){this._setFilterList()}e._currentFilterKeys=[];this._aFilterList.forEach(function(t){var r=t.key;if(i(r)){e._currentFilterKeys.push({key:r,text:t.text?t.text:t.key})}})};v.prototype.getGroups=function(){return this._useBinding()?this.getContent().filter(function(t){return t._isGroupHeader}):this._aGroups};v.prototype.exit=function(){this._objects.destroyAll();this.aPrevFilters=undefined;if(this.oItemNavigation){this.removeDelegate(this.oItemNavigation);this.oItemNavigation.destroy();this.oItemNavigation=null}if(this._oScroller){this._oScroller.destroy();this._oScroller=null}if(this.oResizeListener){i.deregister(this.oResizeListener);this.oResizeListener=null}};v.prototype.adjustUI=function(){this._performUiChanges(true)};v.prototype.setModelFilterMessage=function(t,e){if(t===b.Data){this._dataMessage=e}if(t===b.Time){this._rangeMessage=e}};v.prototype.setCustomFilterMessage=function(t){this._customFilterMessage=t};v.prototype.setModelFilter=function(t){switch(t.type){case b.Data:this._dataFilter=t.filter;break;case b.Time:this._rangeDataFilter=t.filter;break;case b.Search:this._searchFilter=t.filter;break;default:}if(t.refresh!==false){this.recreateFilter()}};v.prototype.getAggregation=function(t){switch(t){case"headerBar":return this.getHeaderBar();case"searchField":return this._objects.getSearchField();case"sortIcon":return this._objects.getSortIcon();case"filterIcon":return this._objects.getFilterIcon();default:return e.prototype.getAggregation.apply(this,arguments)}};v.prototype._formatGroupBy=function(t,e){if(this._fnCustomGroupBy){return this._fnCustomGroupBy(t)}var i=t,r=t;if(t instanceof Date){switch(e){case T.Year:i=t.getFullYear();r=G.Year.format(t);break;case T.Quarter:i=t.getFullYear()+"/"+Math.floor(t.getMonth()/4);r=G.Quarter.format(t);break;case T.Month:i=t.getFullYear()+"/"+t.getMonth();r=G.Month.format(t);break;case T.Week:var s=new Date(t),o=new Date(t),n=t.getFullYear(),a=G.Week.format(t),l=t.getDate()-t.getDay(),u=l+6,h=new Date(s.setDate(l)),p=new Date(o.setDate(u));i=n+"/"+a;r=G.MonthDay.format(h)+" – "+G.MonthDay.format(p);break;case T.Day:i=t.getFullYear()+"/"+t.getMonth()+"/"+t.getDate();r=G.Day.format(t);break;default:}}return{key:i,title:r,date:t}};v.prototype._fnDateDiff=function(t,e,i){var r,s,o,n,a=0;e=e||this._minDate;i=i||this._maxDate;switch(t){case T.Year:a=i.getFullYear()-e.getFullYear();break;case T.Month:r=(i.getFullYear()-e.getFullYear())*12;r+=i.getMonth()-e.getMonth();a=r<=0?0:r;break;case T.Quarter:s=(i.getFullYear()-e.getFullYear())*4;o=Math.floor(e.getMonth()/3);n=Math.floor(i.getMonth()/3);a=s+(n-o);break;case T.Day:var l=24*60*60*1e3;a=Math.round(Math.abs((e.getTime()-i.getTime())/l));break;default:}return a};v.prototype._fnAddDate=function(t,e){var i,r,s,o=function(t,e,i){this.setHours(t);this.setMinutes(e);this.setSeconds(i)},n=function(t,i,r){if(e===N.UP){o.call(r,23,59,59);return new Date(Math.min.apply(null,[this._maxDate,r]))}if(e===N.DOWN){o.call(i,0,0,0);return new Date(Math.max.apply(null,[this._minDate,i]))}return t};switch(this._rangeFilterType){case T.Year:i=new Date(new Date(this._minDate).setFullYear(this._minDate.getFullYear()+t));r=new Date(i.getFullYear(),0,1);s=new Date(i.getFullYear(),11,31);break;case T.Month:i=new Date(new Date(this._minDate).setMonth(this._minDate.getMonth()+t));r=new Date(i.getFullYear(),i.getMonth(),1);s=new Date(i.getFullYear(),i.getMonth()+1,0);break;case T.Quarter:i=new Date(new Date(this._minDate).setMonth(this._minDate.getMonth()+t*3));var a=i.getMonth()%3;r=new Date(i.getFullYear(),i.getMonth()-a,1);s=new Date(i.getFullYear(),i.getMonth()+(2-a)+1,0);break;case T.Day:i=r=s=new Date(new Date(this._minDate).setDate(this._minDate.getDate()+t));break;default:}return n.call(this,i,r,s)};v.prototype._calculateRangeTypeFilter=function(){var t=this._fnDateDiff(T.Day);if(t>500){return T.Year}else if(t>200){return T.Quarter}else if(t>62){return T.Month}return T.Day};v.prototype._setRangeFilter=function(){var t=this._fnDateDiff(this._rangeFilterType);this._objects.getTimeRangeSlider().setMin(0);this._objects.getTimeRangeSlider().setMax(t);this._objects.getTimeRangeSlider().setRange([0,t]);this._objects.getTimeRangeSlider().invalidate();var e=this._objects.getTimeRangeSlider().getRange();if(e[1]-e[0]===0){this._objects.getTimeRangeSlider().addStyleClass("sapTimelineRangeFilterNoDiff")}else{this._objects.getTimeRangeSlider().removeStyleClass("sapTimelineRangeFilterNoDiff")}};v.prototype._sortClick=function(){var t,e;this._sortOrder=this._sortOrder===B.ASCENDING?B.DESCENDING:B.ASCENDING;this._objects.getSortIcon().setIcon(this._sortOrder===B.ASCENDING?"sap-icon://arrow-bottom":"sap-icon://arrow-top");this._objects.getSortIcon().setTooltip(this._sortOrder===B.ASCENDING?w.getText("TIMELINE_SORT_ASCENDING"):w.getText("TIMELINE_SORT_DESCENDING"));if(this._useModelFilter()){t=this.getBinding("content");e=this._findDateTimeBindingPath();t.sort(this._getDefaultSorter(e,this._sortOrder===B.ASCENDING))}else{this.invalidate()}};v.prototype._sort=function(t,e){var i=e||this._sortOrder;t.sort(function(t,e){var r=t.getDateTime(),s=e.getDateTime(),o=i===B.ASCENDING?-1:1;return r<s?1*o:-1*o});return t};v.prototype._loadMore=function(){this._loadMoreDone=true;var t,e,i=function(){var t=this._displayShowMore()?this.getGrowingThreshold():this._calculateItemCountToLoad(this.$());this._iItemCount+=t;this._iItemCount=Math.min(this._getMaxItemsCount(),this._iItemCount)}.bind(this);this._lastScrollPosition.more=this._isVertical()?this._$content.get(0).scrollTop:this._$content.get(0).scrollLeft;this._setBusy(true);this.fireGrow();if(this._useBinding()){if(this._isMaxed()){this._setBusy(false);return}i();t=this.getBindingInfo("content");t.startIndex=0;if(!this._loadAllData()){t.length=this._iItemCount}e=this.getBinding("content").getContexts(0,t.length);if(e&&e.dataRequested){return}this.updateAggregation("content")}else{i();this.invalidate()}this.oItemNavigation.refocusOnNextUpdate()};v.prototype.recreateFilter=function(t){var e=this.getBinding("content"),i=this,r=[],s=[];if(e){if(!t){r=e.aFilters.length!=0?e.aFilters:this.aPrevFilters||[]}if(this._dataFilter){s.push(this._dataFilter)}if(this._rangeDataFilter){s.push(this._rangeDataFilter)}if(this._searchFilter){s.push(this._searchFilter)}if(this._filter&&!t){var n=x(r,function(t){return t===i._filter});if(n!==-1){r.splice(n,1)}}if(s.length>0){this._filter=new p(s,true);r.push(this._filter)}this.aPrevFilters=r;e.filter(r,o.Control)}else{this.invalidate()}};v.prototype._getRangeMessage=function(){var t=this._rangeMessage;if(!t){var e=this._formatGroupBy(this._startDate,this._rangeFilterType).title,i=this._formatGroupBy(this._endDate,this._rangeFilterType).title;if(sap.ui.getCore().getConfiguration().getTimezone()!==Intl.DateTimeFormat().resolvedOptions().timeZone&&e instanceof Date&&i instanceof Date){e=r.getDateTimeWithTimezoneInstance().format(e);i=r.getDateTimeWithTimezoneInstance().format(i)}t=w.getText("TIMELINE_RANGE_SELECTION")+" (";t+=e+" - "+i+")"}return t};v.prototype._getFilterMessage=function(){var t="",e=null;if(this._dataMessage){t=this._dataMessage}else if(this._currentFilterKeys.length>0){t=this._currentFilterKeys.map(function(t){return t.text?t.text:t.key}).join(", ");t=this._getFilterTitle()+" ("+t+")"}if(this._rangeDataFilter||this._rangeMessage||this._startDate&&this._endDate){t=t?t+", ":"";t+=this._getRangeMessage()}if(this._customFilterMessage){t=t?t+", "+this._customFilterMessage:this._customFilterMessage}if(t){e=w.getText("TIMELINE_FILTER_INFO_BY",t)}return e};v.prototype.refreshContent=function(){var t=this.getBinding("content"),e=this.getBindingInfo("content"),i=this.getGrowingThreshold();this._setBusy(true);if(t&&e){this._iItemCount=t.sOperationMode==="Default"||t.sOperationMode==="Server"?0:this._iItemCount;t.getContexts(0,i);e.length=i;t.attachEventOnce("dataReceived",jQuery.proxy(function(){this.updateAggregation("content")},this))}else{this.updateAggregation("content")}};v.prototype.updateContent=function(){this._setBusy(false);this._updateDone=true;this.updateAggregation("content");var t=this._objects.getSortIcon();if(this.getAggregation("content").length<=1){t.setEnabled(false)}else{t.setEnabled(true)}this.invalidate()};v.prototype.destroyContent=function(){var t=this.$("line"),e=this.$().find(".sapSuiteUiCommonsTimelineItemGetMoreButton");if(t.get(0)){t.remove()}if(e.get(0)){e.remove()}this.destroyAggregation("content");return this};v.prototype._search=function(t){var e=this,i,r,s,o,n=[];this._searchValue=t;if(this._useModelFilter()){i=this._fireSelectionChange({searchTerm:this._searchValue,type:b.Search});if(i){this._searchFilter=null;if(this._searchValue){r=this._findBindingPaths("text");s=this._findBindingPaths("title");o=this._findBindingPaths("userName");if(r.length>0){n.push(r)}if(s.length>0){n.push(s)}if(o.length>0){n.push(o)}if(n.length>0){this._searchFilter=new p(n.map(function(t){return new p(t.map(function(t){return new p(t,g.Contains,e._searchValue)}),false)}))}}this.recreateFilter()}}else{this.invalidate()}};v.prototype._filterData=function(t){var e,i;this._dataMessage="";if(this._useModelFilter()){this._dataFilter=null;e=this._fireSelectionChange({selectedItem:this._currentFilterKeys[0]?this._currentFilterKeys[0].key:"",selectedItems:this._currentFilterKeys,type:b.Data});if(e){if(this._currentFilterKeys.length>0){i=this._findBindingPath("filterValue");if(i){this._dataFilter=new p(this._currentFilterKeys.map(function(t){return new p(i,g.EQ,t.key)}),false)}}}this._rangeDataFilter=null;if(t){e=this._fireSelectionChange({type:b.Time,timeKeys:{from:this._startDate,to:this._endDate}});if(e){i=this._findDateTimeBindingPath();if(i){this._rangeDataFilter=new p({path:i,operator:g.BT,value1:this._startDate,value2:this._endDate})}}}this._setBusy(true);this.recreateFilter()}else{this.invalidate()}};v.prototype._filterRangeData=function(){var t,e;this._rangeMessage="";if(this._useModelFilter()){t=this._fireSelectionChange({from:this._startDate,to:this._endDate,type:b.Time});if(t){e=this._findDateTimeBindingPath();this._rangeDataFilter=null;if(e){this._rangeDataFilter=new p({path:e,operator:g.BT,value1:this._startDate,value2:this._endDate})}this._setBusy(true);this.recreateFilter()}}else{this.invalidate()}};v.prototype.applySettings=function(t,e){c.prototype.applySettings.apply(this,[t,e]);this._settingsApplied=true;if(this._bindOptions){this.bindAggregation("content",this._bindOptions);this._bindOptions=null}};v.prototype._setFilterList=function(){var t=false,e,i,r,s={},o,n;this._aFilterList=[];if(this._useModelFilter()){this._aFilterList=this.getFilterList().map(function(t){return{key:t.getProperty("key"),text:t.getProperty("text")}});if(this._aFilterList.length===0){n=this._findBindingData("filterValue");o=this.getBinding("content");if(n&&o){e=o.getDistinctValues(n.path);if(Array.isArray(e)){this._aFilterList=e.map(function(t){return{key:t,text:n.formatter?n.formatter(t):t}});this._aFilterList=this._aFilterList.filter(function(t){return t.key})}t=true}}}else{i=this.getContent();t=true;for(var a=0;a<i.length;a++){r=i[a].getFilterValue();if(!r){continue}if(!(r in s)){s[r]=1;this._aFilterList.push({key:r,text:r})}}}if(t){this._aFilterList.sort(function(t,e){if(t.text.toLowerCase){return t.text.toLowerCase().localeCompare(e.text.toLowerCase())}else{return t.text>e.text}})}};v.prototype._clearFilter=function(){var t=function(){var t,e=this._objects.getTimeRangeSlider();this._startDate=null;this._endDate=null;this._rangeMessage=null;e.setRange([e.getMin(),e.getMax()]);if(this._useModelFilter()){t=this._fireSelectionChange({clear:true,timeKeys:{from:null,to:null},type:b.Range})}return t}.bind(this),e=function(){var t;this._currentFilterKeys=[];if(this._useModelFilter()){t=this._fireSelectionChange({clear:true,selectedItems:[],selectedItem:"",type:b.Data})}return t}.bind(this);var i=e(),r=t();this._customFilterMessage="";if(i||r){if(i){this._dataFilter=null}if(r){this._rangeDataFilter=null}this.recreateFilter(true)}else{this.invalidate()}this._objects.destroyObject("FilterContent");this._setupFilterDialog()};v.prototype._getTimeFilterData=function(){var t=this,e,i,r,s,o=function(e,i){return l(e,t[i]).then(function(e){if(e){if(!t._objects.getTimeFilterSelect().getEnabled()){t._objects.getTimeFilterSelect().setEnabled(true)}var r=a.parseDate(e);if(r instanceof Date){t[i]=r}}}).catch(function(){t._objects.getTimeFilterSelect().setEnabled(false)})},n=function(e){var i,r,s,o,n,l="sap_suite_ui_commons_Timeline";i=this.getBinding("content").getModel();if(!i){return Promise.reject()}r=this._findDateTimeBindingPath();if(!r){return}s=new h(r,e);o=this.getBinding("content");if(!o){return Promise.reject()}if(i.submitBatch){n={$$groupId:l}}var u=i.bindList(o.getPath(),o.getContext(),s,undefined,n);u.initialize();var g=u.getContexts(0,1);if(m.isA(u,"sap.ui.model.json.JSONListBinding")&&g.length===0){return Promise.reject()}else if(g.length>0){return Promise.resolve(a.parseDate(g[0].getProperty(r)))}else if(m.isA(u,"sap.ui.model.odata.v4.ODataListBinding")){t._setBusy(true);return new Promise(function(e,s){i.submitBatch(l).then(function(){t._setBusy(false);p(u,r,e,s)})})}else if(u&&u.attachDataReceived){t._setBusy(true);return new Promise(function(e,i){u.attachDataReceived(function(){t._setBusy(false);p(u,r,e,i)})})}return Promise.reject()}.bind(this),l=function(t,e){if(e){return Promise.resolve(e)}return n(t==="max")},u=function(){e=this.getContent();if(e.length>0){this._minDate=e[0].getDateTime();this._maxDate=e[0].getDateTime();for(var t=1;t<e.length;t++){s=e[t].getDateTime();if(s<this._minDate){this._minDate=s}if(s>this._maxDate){this._maxDate=s}}}},p=function(t,e,i,r){var s=t.getContexts(0,1);if(s.length>0){i(a.parseDate(s[0].getProperty(e)))}else{r()}};return new Promise(function(e,s){if(!t._maxDate||!t._minDate){if(t._useModelFilter()){i=o("min","_minDate",i);r=o("max","_maxDate",r);Promise.all([i,r]).then(function(){e()}).catch(function(){s()})}else{u.call(t);e()}}else{e()}})};v.prototype._openFilterDialog=function(){var t=this.getCustomFilter();if(t){if(typeof t.openBy==="function"){t.openBy(this._objects.getFilterIcon())}else if(typeof t.open==="function"){t.open()}else{D.error("CustomFilter is expected to have an openBy or open function. The provided instance doesn't have either.")}this.fireFilterOpen();return}this._filterState={data:false,range:false};this._objects.getFilterContent().open();this._objects.getTimestampFilterPicker().resizeDialog(this._objects);this.fireFilterOpen()};v.prototype._createGroupHeader=function(t,e){var i=this.getId()+"-timelinegroupheader-"+this._groupId,r=t.key,s=new f(i,{text:"GroupHeader",dateTime:t.date,userName:r,title:t.title,icon:"sap-icon://arrow-down"});s._isGroupHeader=true;if(e){s.setParent(this,"content");this._aGroups.push(s)}else{this.addAggregation("content",s,false)}this._groupId++;return s};v.prototype._getDefaultSorter=function(t,e){var i=this;if(t){return new h(t,!e,function(e){var r=e.getProperty(t),s=a.parseDate(r);return s instanceof Date?i._formatGroupBy(s,i.getGroupByType()):{date:s}})}};v.prototype._findBindingInfoFromTemplate=function(t,e){if(!e){var i=this.getBindingInfo("content");if(i){e=i.template}}if(e){var r=e.getBindingInfo(t);if(r&&r.parts&&r.parts[0]){return r}}return null};v.prototype._findBindingPaths=function(t,e){var i=this._findBindingInfoFromTemplate(t,e);if(i&&i.parts){return i.parts.map(function(t){return t.path})}return[]};v.prototype._findDateTimeBindingPath=function(t){var e=this.getDateTimePath();if(e){return e}var i=this._findBindingInfoFromTemplate("dateTime",t);if(i){return i.parts[0].path}return null};v.prototype._findBindingPath=function(t,e){var i=this._findBindingInfoFromTemplate(t,e);if(i){return i.parts[0].path}return null};v.prototype._findBindingData=function(t,e){var i=this._findBindingInfoFromTemplate(t,e);if(i){return{path:i.parts[0].path,formatter:i.formatter}}return null};v.prototype._bindGroupingAndSorting=function(t){if(!this._isGrouped()&&this.getSort()){var e=this._findDateTimeBindingPath(t.template);if(e){t.sorter=this._getDefaultSorter(e,this.getSortOldestFirst())}}t.groupHeaderFactory=null;if(this._isGrouped()){t.sorter=this._getDefaultSorter(this.getGroupBy(),this.getSortOldestFirst());t.groupHeaderFactory=jQuery.proxy(this._createGroupHeader,this)}};v.prototype.updateBindingContext=function(){this.reset();return c.prototype.updateBindingContext.apply(this,arguments)};v.prototype.bindAggregation=function(t,e){if(t==="content"){if(!this._settingsApplied){this._bindOptions=e;return null}this._bindGroupingAndSorting(e);if(this._lazyLoading()){this._iItemCount=this._calculateItemCountToLoad(jQuery(window));if(!this._loadAllData(true)){e.length=this._iItemCount}}else if(this._displayShowMore()&&!this._loadAllData(e.template||e.factory)){this._iItemCount=this.getGrowingThreshold();e.length=this._iItemCount}this._oOptions=e}return c.prototype.bindAggregation.apply(this,[t,e])};v.prototype._calculateItemCountToLoad=function(t){var e=M.Vertical===this.getAxisOrientation(),i=e?t.height():t.width(),r=this.getEnableDoubleSided(),s=r?.6:1,o=e?1200:2e3,n=e?120:280,a=13*s,l;if(!i){i=o}l=i/(n*s)*1.5;return Math.floor(Math.max(l,a))};v.prototype.onBeforeRendering=function(){var t=this.getGrowingThreshold(),e;this._bRtlMode=sap.ui.getCore().getConfiguration().getRTL();this._objects.getSortIcon().setIcon(this._sortOrder===B.ASCENDING?"sap-icon://arrow-bottom":"sap-icon://arrow-top");this._objects.getSortIcon().setTooltip(this._sortOrder===B.ASCENDING?w.getText("TIMELINE_SORT_ASCENDING"):w.getText("TIMELINE_SORT_DESCENDING"));this._aGroups=[];this._bRendered=false;e=this.getContent();if(!this._iItemCount&&!this._useBinding()&&this._lazyLoading()){this._iItemCount=this._calculateItemCountToLoad(jQuery(window))}if(!this._iItemCount){if(t!==0){this._iItemCount=t}}if(!this._iItemCount||!this._useGrowing()){this._iItemCount=e.filter(function(t){return!t._isGroupHeader}).length}this._setOutput(e)};v.prototype.addContentGroup=function(t){};v.prototype._performScroll=function(t){var e=this,i=this._isVertical()?this._$content.get(0).scrollTop+t:this._$content.get(0).scrollLeft+t;i=Math.max(i,0);if(this._isVertical()){this._$content.get(0).scrollTop=i}else{this._$content.get(0).scrollLeft=i}if(this._manualScrolling){setTimeout(e._performScroll.bind(e,t),50)}};v.prototype._moveScrollBar=function(t){if(this._lastScrollPosition.more||this._lastScrollPosition.backup){if(t){this._lastScrollPosition.more=this._lastScrollPosition.backup}if(!t){this._lastScrollPosition.backup=this._lastScrollPosition.more}this._lastScrollPosition.more=0}};v.prototype.onAfterRendering=function(){var t=this.$();if(this._isVertical()){this._$content=this.$("content");this._$scroll=this.$("scroll")}else{this._$content=this.$("contentH");this._$scroll=this.$("scrollH")}if(this._updateDone||this._loadMoreDone){this.setBusy(false);this._updateDone=false;this._loadMoreDone=false}if(!this._oScroller){this._oScroller=new _(this,this._$scroll.attr("id"),{})}this._oScroller._$Container=this._$scroll.parent();this._oScroller.setVertical(this._isVertical());this._oScroller.setHorizontal(!this._isVertical());this._startItemNavigation();this._scrollersSet=false;this._scrollMoreEvent=true;this._lastStateDblSided=null;this._showCustomMessage();this._setupScrollEvent();this._performUiChanges();this._moveScrollBar();this._bRendered=true;t.css("opacity",1)};v.prototype._clientFilter=function(t){var e=[],i,r,s,o,n,a,l,u,h,p;function g(t){return t.key===i.getProperty("filterValue")}for(var c=0;c<t.length;c++){i=t[c];r=false;s={};if(this._currentFilterKeys.length>0){o=x(this._currentFilterKeys,g);if(o===-1){r=true;s[b.Data]=1}}if(this._startDate&&this._endDate){n=i.getDateTime();if(n<this._startDate||n>this._endDate){r=true;s[b.Time]=1}}if(this._searchValue){a=this._searchValue.toLowerCase();l=i.getProperty("text")||"";u=i.getProperty("title")||"";h=i.getProperty("userName")||"";if(!(l.toLowerCase().indexOf(a)!==-1||u.toLowerCase().indexOf(a)!==-1||h.toLowerCase().indexOf(a)!==-1)){r=true;s[b.Search]=1}}p=!this.fireEvent("itemFiltering",{item:i,reasons:s,dataKeys:this._currentFilterKeys,timeKeys:{from:this._startDate,to:this._endDate},searchTerm:this._searchValue},true);if(p){r=!r}if(!r){e.push(i)}}return e};v.prototype._setOutput=function(t){var e;var i=function(){var t=0,i=[],r=0;if(this._iItemCount!==e.length){for(;r<e.length;r++){if(!e[r]._isGroupHeader){t++}if(t>this._iItemCount){break}i.push(e[r])}e=i}},r=function(){var t=[],i,r,s={key:""};for(var o=0;o<e.length;o++){i=e[o];r=this._formatGroupBy(i.getDateTime(),this.getGroupByType());if(r.key!=s.key){t.push(this._createGroupHeader(r,true));s=r}t.push(i)}return t},s=function(){var e;if(!this._maxDate&&!this._minDate){if(this.getSort()||this._isGrouped()){for(var i=0;i<t.length;i++){e=t[i];if(!e._isGroupHeader){this._sortOrder===B.ASCENDING?this._minDate=e.getDateTime():this._maxDate=e.getDateTime();break}}}}},o,n,a,l;s.call(this);if((!this._useBinding()||!this._useModelFilter())&&this.getSort()){t=this._sort(t)}e=this._useModelFilter()?t:this._clientFilter(t);e=e.filter(function(t){return!t._isGroupHeader});this._showMore=this.getForceGrowing();if(!this._showMore&&this._displayShowMore()){this._showMore=e.length>this._iItemCount;if(!this._showMore&&this._useModelFilter()){this._showMore=e.length===this._iItemCount&&this._iItemCount<this._getMaxItemsCount()}}e=e.filter(function(t){return t.getVisible()});i.call(this);this._outputItem=[];if(this._isGrouped()){if(!this._useBinding()){t=r.call(this)}var u=t.filter(function(t){return t._isGroupHeader});this._groupCount=u.length;for(var h=0;h<u.length;h++){o=u[h];a=o.getUserName();l=true;o._groupID=a;for(var p=0;p<e.length;p++){var g=e[p];n=this._formatGroupBy(g.getDateTime(),this.getGroupByType());if(n.key==a&&!g._isGroupHeader){if(l){this._outputItem.push(o);l=false}g._groupID=a;this._outputItem.push(g)}}}}else{this._outputItem=jQuery.extend(true,[],e)}};v.prototype._getMaxItemsCount=function(){var t=this.getBinding("content"),e,i,r;if(t){r=t.getLength()||0;e=t.getModel();i=e&&e.iSizeLimit;return Math.min(r,i||r)}return this.getContent().length};v.prototype._showCustomMessage=function(){var t=!!this._customMessage,e=this._objects.getMessageStrip().$();this._objects.getMessageStrip().setVisible(t);this._objects.getMessageStrip().setText(this._customMessage);if(t){e.show()}else{e.hide()}};v.prototype._performExpandCollapse=function(t,e){var i=this,r,s,o=this.$(),n=e?"slideDown":"slideUp",a=250;o.find('li[groupid="'+t+'"][nodeType="GroupHeaderBar"]').each(function(t,i){var r=jQuery(i);if(!e){r.addClass("sapSuiteUiCommonsTimelineItemGroupCollapsedBar")}else{r.removeClass("sapSuiteUiCommonsTimelineItemGroupCollapsedBar")}});r=o.find('li[groupid="'+t+'"][nodeType!="GroupHeader"][nodeType!="GroupHeaderBar"]');if(this.getAxisOrientation()==="Vertical"){s=r.parent()}return new Promise(function(t,o){if(i._noAnimation){if(e){if(s){s.show()}else{r.show()}}else{if(s){s.hide()}else{r.hide()}}t()}else{if(i._isVertical()){r[n](a)}else{r.animate({width:"toggle"},350)}r.promise().done(function(){t()})}})};v.prototype._itemRendered=function(){if(this._bRendered){this.adjustUI()}};v.prototype._startItemNavigation=function(t){var e=this._getItemsForNavigation(),i=this.$("content").get(0)||this.$("contentH").get(0),r=function(t,e){return e.filter(function(e){return e.getFocusDomRef()===t})};if(!this.oItemNavigation){this.oItemNavigation=new n(i,e.items,false,e.rows);this.oItemNavigation.setPageSize(10);this.oItemNavigation.attachEvent("AfterFocus",function(t){var e=this.oItemNavigation.getItemDomRefs()[t.getParameter("index")],i=r(e,this._outputItem);if(i[0]){this.fireSelect({selectedItem:i[0],userAction:t.mParameters.event&&t.mParameters.event.type==="mousedown"})}},this);this.oItemNavigation.attachEvent("Enter",function(t){var e=r(t.getParameter("domRef"),this._outputItem);if(e[0]){this.fireSelect({selectedItem:e[0],userAction:true})}},this);this.addDelegate(this.oItemNavigation)}else{this.oItemNavigation.updateReferences(i,e.items,e.rows)}if(e.columns){this.oItemNavigation.setColumns(e.columns,false)}};v.prototype._getItemsForNavigation=function(){var t={},e,i,r,s,o;if(this._renderDblSided){if(this._isVertical()){t.items=this._outputItem;t.rows=[];s=[];t.items.forEach(function(e){var i=e.$(),r=i.hasClass("sapSuiteUiCommonsTimelineItemWrapperVLeft")||i.hasClass("sapSuiteUiCommonsTimelineItemOdd");if(r&&s.length===1){s.push(null)}else if(!r&&s.length===0){s.push(null)}if(s.length>1){t.rows.push(s);s=[]}s.push(e)});if(s.length>0){t.rows.push(s)}}else{i=[];r=[];this._outputItem.forEach(function(t){if(t._placementLine==="top"){i.push(t)}else{while(r.length+1<i.length){r.push(null)}r.push(t)}});t.items=this._outputItem;t.rows=[i,r]}}else{t.items=this._outputItem}t.items=t.items.map(function(t){return t.getFocusDomRef()});if(t.rows){o=0;t.rows=t.rows.map(function(t){if(t.length>o){o=t.length}return t.map(function(t){return t===null?null:t.getFocusDomRef()})});t.rows.forEach(function(t){while(t.length<o){t.push(null)}})}if(this._showMore){e=this._objects.getMoreButton().getFocusDomRef();t.items.push(e);if(t.rows){if(this._isVertical()){if(t.rows.length>0){t.rows.push(t.rows[0].map(function(t,i,r){if(i===r.length-1){return e}else{return null}}))}else{t.rows.push([e])}}else{t.rows.forEach(function(t,i,r){if(i===r.length-1){t.push(e)}else{t.push(null)}})}}}return t};v.prototype.setShowItemFilter=function(t){this.setProperty("showItemFilter",t,true);if(this._objects.isObjectInitialized("FilterContent")){this._setupFilterFirstPage(this._objects.getFilterContent())}this._objects.getFilterIcon().setVisible(t||this.getShowTimeFilter());return this};v.prototype.setShowTimeFilter=function(t){this.setProperty("showTimeFilter",t,true);if(this._objects.isObjectInitialized("FilterContent")){this._setupFilterFirstPage(this._objects.getFilterContent())}this._objects.getFilterIcon().setVisible(t||this.getShowItemFilter());return this};v.prototype._getFilterTitle=function(){var t=this.getFilterTitle();if(!t){t=w.getText("TIMELINE_FILTER_ITEMS")}return t};v.prototype.getNoDataText=function(){var t=this.getProperty("noDataText");if(!t){t=w.getText("TIMELINE_NO_DATA")}return t};v.prototype.setSortOldestFirst=function(t){this._sortOrder=t?B.ASCENDING:B.DESCENDING;this._objects.getSortIcon().setIcon(this._sortOrder===B.ASCENDING?"sap-icon://arrow-bottom":"sap-icon://arrow-top");this._objects.getSortIcon().setTooltip(this._sortOrder===B.ASCENDING?w.getText("TIMELINE_SORT_ASCENDING"):w.getText("TIMELINE_SORT_DESCENDING"));this.setProperty("sortOldestFirst",t);return this};v.prototype.setGrowingThreshold=function(t){this.setProperty("growingThreshold",t,true);this._iItemCount=t;return this};v.prototype.setShowHeaderBar=function(t){this.setProperty("showHeaderBar",t,true);this._objects.getHeaderBar().setVisible(t);return this};v.prototype.setSort=function(t){this.setProperty("sort",t);this._objects.getSortIcon().setVisible(t&&this.getShowSort());return this};v.prototype.setAxisOrientation=function(t){this.setProperty("axisOrientation",t);if(this._oScroller){this._oScroller.destroy();this._oScroller=null}return this};v.prototype.setEnableDoubleSided=function(t){this.setProperty("enableDoubleSided",t);this._renderDblSided=t;return this};v.prototype.getCurrentFilter=function(){return this._currentFilterKeys.map(function(t){return{key:t.key,text:t.text||t.key}})};v.prototype.reset=function(){this._iItemCount=0;this._aFilterList=[];this._collapsedGroups={};this._renderDblSided=null;this._groupId=0;this._lastScrollPosition={x:0,y:0,more:0};this._sortOrder=this.getSortOldestFirst()?B.ASCENDING:B.DESCENDING;this._scrollersSet=false;this._currentFilterKeys=[];this._bRendered=false;this._noAnimation=true};v.prototype.setShowFilterBar=function(t){this.setProperty("showFilterBar",t,true);this.setShowHeaderBar(t);return this};v.prototype.setShowSearch=function(t){this.setProperty("showSearch",t,true);this._objects.getSearchField().setVisible(!!t);return this};v.prototype.setShowSort=function(t){this.setProperty("showSort",t,true);this._objects.getSortIcon().setVisible(this.getSort()&&t);return this};v.prototype.setCustomMessage=function(t){this._customMessage=t;this._showCustomMessage();return this};v.prototype.getHeaderBar=function(){return this._objects.getHeaderBar()};v.prototype.getMessageStrip=function(){return this._objects.getMessageStrip()};v.prototype.setContent=function(t){this.removeAllContent();var e=0;for(var i=0;i<t.length;i++){var r=t[i];if(r instanceof f){if(this._isGrouped()){var s=this._formatGroupBy(r.getDateTime(),this.getGroupByType());if(s.key!==e.key){this._createGroupHeader(s);e=s}}this.addContent(r)}}this._iItemCount=0;return this};v.prototype.setData=function(t){var e="sapsuiteuicommonsTimelineInternalModel",i=new u,r,s,o=function(t,e){var i=new f({dateTime:e.getProperty("dateTime"),icon:e.getProperty("icon"),userName:e.getProperty("userName"),title:e.getProperty("title"),text:e.getProperty("text"),filterValue:e.getProperty("filterValue")});if(e.getProperty("content")){i.setEmbeddedControl(e.getProperty("content"))}return i},n=function(t,e){var i=t;if(e){i=e+">"+t}return i};if(typeof t==="undefined"){return this}r=n("/",e);i.setData(t);this.setModel(i,e);this.setProperty("data",t,true);s={path:r,sorter:this._getDefaultSorter("dateTime",this.getSortOldestFirst()),factory:jQuery.proxy(o,this)};if(this._isGrouped()){s.groupHeaderFactory=jQuery.proxy(this._getGroupHeader,this)}this.bindAggregation("content",s);return this};v.prototype.getSuspendSocialFeature=function(){return this._suspenseSocial};v.prototype.setSuspendSocialFeature=function(t){this._suspenseSocial=t;if(!this.getEnableSocial()){return}var e=this.getContent();for(var i=0;i<e.length;i++){e[i]._objects.getReplyLink().setEnabled(!t)}this.invalidate();return this};v.prototype.updateFilterList=function(){this.updateAggregation("filterList");this._setFilterList()};v.prototype.setGroupByType=function(t){var e=this.getBindingInfo("content");this.setProperty("groupByType",t);if(e){this._bindGroupingAndSorting(e);this.updateAggregation("content")}return this};v.prototype.getGroup=function(){return this.getGroupByType()!=="None"};v.prototype.setGroup=function(t){if(t&&this.getGroupByType()===T.None){this.setGroupByType(T.Year)}if(!t){this.setGroupByType(T.None)}return this};v.prototype.setGrowing=function(t){if(!t){this.setGrowingThreshold(0)}return this};v.prototype.getGrowing=function(t){return this.getGrowingThreshold()!==0};v.prototype.setEnableBackendFilter=function(t){this.setProperty("enableModelFilter",t);return this};v.prototype.getEnableBackendFilter=function(){return this.getProperty("enableModelFilter")};v.prototype._isGrouped=function(){return(this.getGroupByType()!==T.None||this._fnCustomGroupBy)&&this.getGroupBy()!==""};v.prototype._lazyLoading=function(){return this.getEnableScroll()&&this.getLazyLoading()};v.prototype._loadAllData=function(t){return!this._useModelFilter(t)};v.prototype._isVertical=function(){return M.Vertical===this.getAxisOrientation()};v.prototype._displayShowMore=function(){return this.getForceGrowing()||this.getGrowingThreshold()!==0&&!this._lazyLoading()};v.prototype._useGrowing=function(){return this.getForceGrowing()||this.getGrowingThreshold()!==0||this._lazyLoading()};v.prototype._isMaxed=function(){return this._iItemCount>=this._getMaxItemsCount()};v.prototype._useModelFilter=function(t){return this.getEnableModelFilter()&&(t||this._useTemplateBinding()||this._useFactoryBinding())};v.prototype._scrollingFadeout=function(t){return this.getScrollingFadeout()!==I.None&&this.getEnableScroll()};v.prototype._setBusy=function(t){if(this.getEnableBusyIndicator()){this.setBusy(t)}};v.prototype._fireSelectionChange=function(t){return this.fireEvent("filterSelectionChange",t,true)};v.prototype._isLeftAlignment=function(){return this.getAlignment()===S.Left||this.getAlignment()===S.Top};v.prototype._useBinding=function(t){return this.getBindingInfo("content")!=null};v.prototype._useTemplateBinding=function(){var t=this.getBindingInfo("content");return t&&t.template!=null};v.prototype._useFactoryBinding=function(){var t=this.getBindingInfo("content");return t&&t.factory!=null};v.prototype._useAutomaticHeight=function(){return this.getTextHeight().toLowerCase()==="automatic"&&!this._isVertical()};v.prototype._getItemsCount=function(){return this._outputItem?this._outputItem.length:0};d.extendTimeline(v);return v});
//# sourceMappingURL=Timeline.js.map