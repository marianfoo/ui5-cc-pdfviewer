/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","sap/ui/Device","sap/ui/base/Object","./ObjectPageSubSection","./library","sap/base/Log","sap/base/util/isEmptyObject"],function(jQuery,e,i,t,o,s,r){"use strict";var a=i.extend("sap.uxap._helpers.LazyLoading",{constructor:function(e){this._oObjectPageLayout=e;this._$html=jQuery("html");this._iPreviousScrollTop=0;this._iScrollProgress=0;this._iPreviousScrollTimestamp=0;this._sLazyLoadingTimer=null;this._bSuppressed=false;this._oPrevSubSectionsInView={};this.setLazyLoadingParameters()},getInterface:function(){return this}});a.prototype.setLazyLoadingParameters=function(){this.LAZY_LOADING_DELAY=200;this.LAZY_LOADING_EXTRA_PAGE_SIZE=.5;this.LAZY_LOADING_EXTRA_SUBSECTION=this.LAZY_LOADING_DELAY*5;if(this._isPhone()){this.NUMBER_OF_SUBSECTIONS_TO_PRELOAD={FirstRendering:1,ScrollToSection:1}}else if(this._isTablet()){this.NUMBER_OF_SUBSECTIONS_TO_PRELOAD={FirstRendering:2,ScrollToSection:1}}else if(this._isTabletSize()){this.NUMBER_OF_SUBSECTIONS_TO_PRELOAD={FirstRendering:2,ScrollToSection:2}}else{this.NUMBER_OF_SUBSECTIONS_TO_PRELOAD={FirstRendering:3,ScrollToSection:3}}this.LAZY_LOADING_FAST_SCROLLING_THRESHOLD=5};a.prototype.suppress=function(){this._bSuppressed=true};a.prototype.resume=function(){this._bSuppressed=false};a.prototype._triggerVisibleSubSectionsEvents=function(){this._oPrevSubSectionsInView={};this._oObjectPageLayout._requestAdjustLayout(true);this.doLazyLoading()};a.prototype.lazyLoadDuringScroll=function(e,i,t,o){var r,a,n=false;if(this._bSuppressed){return}if(e){if(this._sLazyLoadingTimer){clearTimeout(this._sLazyLoadingTimer)}this._sLazyLoadingTimer=null;this.doLazyLoading();return}this._iScrollProgress=i-this._iPreviousScrollTop;r=Math.round(Math.abs(this._iScrollProgress)/o*100);if(r>=this.LAZY_LOADING_FAST_SCROLLING_THRESHOLD){n=true}this._iPreviousScrollTop=i;this._iPreviousScrollTimestamp=t||0;a=i===0?0:this.LAZY_LOADING_DELAY;if(n&&this._sLazyLoadingTimer){s.debug("ObjectPageLayout :: lazyLoading","delayed by "+a+" ms because of fast scroll");clearTimeout(this._sLazyLoadingTimer);this._sLazyLoadingTimer=null}if(!this._sLazyLoadingTimer){this._sLazyLoadingTimer=setTimeout(this.doLazyLoading.bind(this),a)}};a.prototype.doLazyLoading=function(){var e=this._oObjectPageLayout._getHeightRelatedParameters(),i=this._oObjectPageLayout.getUseIconTabBar(),t=sap.ui.getCore().byId(this._oObjectPageLayout.getSelectedSection()),o=this._oObjectPageLayout._oSectionInfo,a,n,_,u=this._iPreviousScrollTop>=e.iHeaderContentHeight,c,L=-1,h={},l={},d,g,S;if(this._bSuppressed){return}_=e.iScreenHeight-(u?e.iAnchorBarHeight:0)-(u?e.iHeaderTitleHeightStickied:0);a=e.iScrollTop;d=Date.now()-this._iPreviousScrollTimestamp;g=d<this.LAZY_LOADING_DELAY/2&&Math.abs(this._iScrollProgress)>5;if(g){if(this._iScrollProgress>=0){S=Math.round(Math.min(this._iScrollProgress*20,_/2))}else{S=-1*Math.round(Math.min(Math.abs(this._iScrollProgress)*20,_/2))}a+=S;s.debug("ObjectPageLayout :: lazyLoading","Visible page shifted from : "+S)}n=a+_;a+=16;jQuery.each(o,jQuery.proxy(function(e,o){if(!o.isSection&&o.sectionReference.getParent()&&o.sectionReference.getParent().getVisible()){if(i&&t&&t.indexOfSubSection(o.sectionReference)<0){return}if(o.positionTop<=n&&a<o.positionBottom-1){l[e]=e;if(!o.loaded){h[e]=e}}else if(!o.loaded&&o.positionTop>n&&o.positionTop<n+_*this.LAZY_LOADING_EXTRA_PAGE_SIZE&&(L==-1||o.positionTop<L)){L=o.positionTop;c=e}}},this));if(L!=-1&&r(h)){s.debug("ObjectPageLayout :: lazyLoading","extra section added : "+c);h[c]=c}jQuery.each(h,jQuery.proxy(function(e,i){s.debug("ObjectPageLayout :: lazyLoading","connecting "+i);sap.ui.getCore().byId(i).connectToModels();o[i].loaded=true},this));jQuery.each(l,jQuery.proxy(function(e,i){if(!this._oPrevSubSectionsInView[e]){s.debug("ObjectPageLayout :: lazyLoading","subSectionEnteredViewPort "+i);this._oObjectPageLayout.fireEvent("subSectionEnteredViewPort",{subSection:sap.ui.getCore().byId(i)})}},this));this._oPrevSubSectionsInView=l;if(g){this._sLazyLoadingTimer=setTimeout(this.doLazyLoading.bind(this),this.LAZY_LOADING_DELAY)}else{if(L){this._sLazyLoadingTimer=setTimeout(this.doLazyLoading.bind(this),this.LAZY_LOADING_EXTRA_SUBSECTION)}else{this._sLazyLoadingTimer=null}}};a.prototype.getSubsectionsToPreload=function(e,i){var o,s;if(i){o=this.NUMBER_OF_SUBSECTIONS_TO_PRELOAD.ScrollToSection;s=false}else{o=this.NUMBER_OF_SUBSECTIONS_TO_PRELOAD.FirstRendering;s=true}var r=[];e.some(function(e){if(!s&&i){s=e.getId()==i}if(s&&e instanceof t){if(e.getVisible()&&e._getInternalVisible()){r.push(e);o--}}return o<=0});return r};a.prototype.destroy=function(){if(this._sLazyLoadingTimer){clearTimeout(this._sLazyLoadingTimer)}};a.prototype._isPhone=function(){return o.Utilities.isPhoneScenario(this._oObjectPageLayout._getCurrentMediaContainerRange())};a.prototype._isTablet=function(){return e.system.tablet};a.prototype._isTabletSize=function(){return o.Utilities.isTabletScenario(this._oObjectPageLayout._getCurrentMediaContainerRange())};return a});
//# sourceMappingURL=LazyLoading.js.map