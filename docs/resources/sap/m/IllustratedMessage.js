/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./library","sap/m/Text","sap/m/Title","sap/m/FormattedText","sap/m/Illustration","sap/base/Log","sap/ui/core/Control","sap/ui/core/Core","sap/ui/core/library","sap/ui/core/ResizeHandler","sap/ui/thirdparty/jquery","./IllustratedMessageRenderer"],function(e,t,i,s,a,r,l,o,n,u,jQuery,p){"use strict";var d=e.IllustratedMessageSize;var T=e.IllustratedMessageType;var I=n.TextAlign;var g=l.extend("sap.m.IllustratedMessage",{metadata:{library:"sap.m",properties:{description:{type:"string",group:"Misc",defaultValue:""},enableFormattedText:{type:"boolean",group:"Appearance",defaultValue:false},enableVerticalResponsiveness:{type:"boolean",group:"Appearance",defaultValue:false},illustrationSize:{type:"sap.m.IllustratedMessageSize",group:"Appearance",defaultValue:d.Auto},illustrationType:{type:"string",group:"Appearance",defaultValue:T.NoSearchResults},title:{type:"string",group:"Misc",defaultValue:""}},aggregations:{additionalContent:{type:"sap.m.Button",multiple:true},_formattedText:{type:"sap.m.FormattedText",multiple:false,visibility:"hidden"},_illustration:{type:"sap.m.Illustration",visibility:"hidden",multiple:false},_text:{type:"sap.m.Text",multiple:false,visibility:"hidden"},_title:{type:"sap.m.Title",multiple:false,visibility:"hidden"}},associations:{illustrationAriaLabelledBy:{type:"sap.ui.core.Control",multiple:true,singularName:"illustrationAriaLabelledBy"}},dnd:{draggable:false,droppable:true}},renderer:p});g.ORIGINAL_TEXTS={UnableToLoad:"UnableToLoad",UnableToUpload:"UnableToUpload",NoActivities:"NoActivities",BeforeSearch:"BeforeSearch",NoSearchResults:"NoSearchResults",NoEntries:"NoEntries",NoData:"NoData",NoNotifications:"NoNotifications",BalloonSky:"BalloonSky",SuccessScreen:"SuccessScreen",NoMail:"NoMail",NoSavedItems:"NoSavedItems",NoTasks:"NoTasks"};g.FALLBACK_TEXTS={ReloadScreen:g.ORIGINAL_TEXTS.UnableToLoad,Connection:g.ORIGINAL_TEXTS.UnableToLoad,ErrorScreen:g.ORIGINAL_TEXTS.UnableToUpload,EmptyCalendar:g.ORIGINAL_TEXTS.NoActivities,SearchEarth:g.ORIGINAL_TEXTS.BeforeSearch,SearchFolder:g.ORIGINAL_TEXTS.NoSearchResults,EmptyList:g.ORIGINAL_TEXTS.NoEntries,Tent:g.ORIGINAL_TEXTS.NoData,SleepingBell:g.ORIGINAL_TEXTS.NoNotifications,SimpleBalloon:g.ORIGINAL_TEXTS.BalloonSky,SimpleBell:g.ORIGINAL_TEXTS.NoNotifications,SimpleCalendar:g.ORIGINAL_TEXTS.NoActivities,SimpleCheckMark:g.ORIGINAL_TEXTS.SuccessScreen,SimpleConnection:g.ORIGINAL_TEXTS.UnableToLoad,SimpleEmptyDoc:g.ORIGINAL_TEXTS.NoData,SimpleEmptyList:g.ORIGINAL_TEXTS.NoEntries,SimpleError:g.ORIGINAL_TEXTS.UnableToUpload,SimpleMagnifier:g.ORIGINAL_TEXTS.BeforeSearch,SimpleMail:g.ORIGINAL_TEXTS.NoMail,SimpleNoSavedItems:g.ORIGINAL_TEXTS.NoSavedItems,SimpleNotFoundMagnifier:g.ORIGINAL_TEXTS.NoSearchResults,SimpleReload:g.ORIGINAL_TEXTS.UnableToLoad,SimpleTask:g.ORIGINAL_TEXTS.NoTasks,SuccessBalloon:g.ORIGINAL_TEXTS.BalloonSky,SuccessCheckMark:g.ORIGINAL_TEXTS.SuccessScreen,SuccessHighFive:g.ORIGINAL_TEXTS.BalloonSky};g.PREPENDS={DESCRIPTION:"IllustratedMessage_DESCRIPTION_",TITLE:"IllustratedMessage_TITLE_"};g.BREAK_POINTS={DIALOG:679,SPOT:319,DOT:259,BASE:159};g.BREAK_POINTS_HEIGHT={DIALOG:451,SPOT:296,DOT:154,BASE:87};g.MEDIA={BASE:"sapMIllustratedMessage-Base",DOT:"sapMIllustratedMessage-Dot",SPOT:"sapMIllustratedMessage-Spot",DIALOG:"sapMIllustratedMessage-Dialog",SCENE:"sapMIllustratedMessage-Scene"};g.RESIZE_HANDLER_ID={CONTENT:"_sContentResizeHandlerId"};g.prototype.init=function(){this._sLastKnownMedia=null;this._updateInternalIllustrationSetAndType(this.getIllustrationType());o.getEventBus().subscribe("sapMIllusPool-assetLdgFailed",this._handleMissingAsset.bind(this))};g.prototype.onBeforeRendering=function(){this._detachResizeHandlers()};g.prototype.onAfterRendering=function(){this._updateDomSize();this._attachResizeHandlers();this._preventWidowWords(this._getTitle().getDomRef());this._preventWidowWords(this._getDescription().getDomRef())};g.prototype.exit=function(){this._detachResizeHandlers()};g.prototype.setIllustrationType=function(e){if(this.getIllustrationType()===e){return this}this._updateInternalIllustrationSetAndType(e);return this.setProperty("illustrationType",e)};g.prototype._getDefaultDescription=function(){return this._findDefaultText(g.PREPENDS.DESCRIPTION)};g.prototype._getDefaultTitle=function(){return this._findDefaultText(g.PREPENDS.TITLE)};g.prototype._findDefaultText=function(e){var t=this._getResourceBundle();return t.getText(e+this._sIllustrationType,null,true)||t.getText(e+this._sIllustrationType.substr(0,this._sIllustrationType.indexOf("_v")),null,true)||t.getText(e+g.FALLBACK_TEXTS[this._sIllustrationType],null,true)};g.prototype._getDescription=function(){return this.getEnableFormattedText()?this._getFormattedText():this._getText()};g.prototype._getFormattedText=function(){var e=this.getDescription(),t=this.getAggregation("_formattedText");if(!t){t=new s({textAlign:I.Center});this.setAggregation("_formattedText",t)}if(e){t.setHtmlText(e)}else{t.setHtmlText(this._getDefaultDescription())}return t};g.prototype._getIllustration=function(){var e=this.getAggregation("_illustration");if(!e){e=new a;this.setAggregation("_illustration",e)}return e};g.prototype._getResourceBundle=function(){return o.getLibraryResourceBundle("sap.m")};g.prototype._getText=function(){var e=this.getDescription(),i=this.getAggregation("_text");if(!i){i=new t({textAlign:I.Center});this.setAggregation("_text",i)}if(e){i.setText(e)}else{i.setText(this._getDefaultDescription())}return i};g.prototype._getTitle=function(){var e=this.getTitle(),t=this.getAggregation("_title");if(!t){t=new i({wrapping:true});this.setAggregation("_title",t)}if(e){t.setText(e)}else{t.setText(this._getDefaultTitle())}return t};g.prototype._preventWidowWords=function(e){var t,i,s=window.HTMLElement;if(!(s&&e instanceof s)){return}t=jQuery(e);i=t.html();i=i.replace(/ ([^ ]*)$/,"&nbsp;$1");t.html(i)};g.prototype._updateDomSize=function(){var e=this.getDomRef(),t,i;if(e){t=this.getIllustrationSize();if(t===d.Auto){this._updateMedia(e.getBoundingClientRect().width,e.getBoundingClientRect().height)}else{i=g.MEDIA[t.toUpperCase()];this._updateSymbol(i);this._updateMediaStyle(i)}}};g.prototype._updateInternalIllustrationSetAndType=function(e){var t=e.split("-");this._sIllustrationSet=t[0];this._sIllustrationType=t[1]};g.prototype._onResize=function(e){var t=e.size.width,i=e.size.height;this._updateMedia(t,i)};g.prototype._updateMedia=function(e,t){var i=this.getEnableVerticalResponsiveness(),s;if(!e&&!t){return}if(e<=g.BREAK_POINTS.BASE||t<=g.BREAK_POINTS_HEIGHT.BASE&&i){s=g.MEDIA.BASE}else if(e<=g.BREAK_POINTS.DOT||t<=g.BREAK_POINTS_HEIGHT.DOT&&i){s=g.MEDIA.DOT}else if(e<=g.BREAK_POINTS.SPOT||t<=g.BREAK_POINTS_HEIGHT.SPOT&&i){s=g.MEDIA.SPOT}else if(e<=g.BREAK_POINTS.DIALOG||t<=g.BREAK_POINTS_HEIGHT.DIALOG&&i){s=g.MEDIA.DIALOG}else{s=g.MEDIA.SCENE}this._updateSymbol(s);this._updateMediaStyle(s)};g.prototype._updateMediaStyle=function(e){if(this._sLastKnownMedia!==e){this._sLastKnownMedia=e}else{return}Object.keys(g.MEDIA).forEach(function(t){var i=e===g.MEDIA[t];this.toggleStyleClass(g.MEDIA[t],i)},this)};g.prototype._updateSymbol=function(e){if(e===g.MEDIA.BASE){return}var t=e.substring(e.indexOf("-")+1);this._getIllustration().setSet(this._sIllustrationSet,true).setMedia(t,true).setType(this._sIllustrationType)};g.prototype._getFallbackMedia=function(){var e=this._sLastKnownMedia,t=Object.values(g.MEDIA),i=t.indexOf(e);if(i>-1&&i<t.length-1){return t[i+1]}else{return t[t.length-1]}};g.prototype._handleMissingAsset=function(){var e,t=Object.values(g.MEDIA),i="";if(this._sLastKnownMedia!==t[t.length-1]){e=this._getIllustration();i=this._getFallbackMedia();e.setMedia(i.substring(i.indexOf("-")+1));r.warning(this._sLastKnownMedia+" is unavailable, retrying with larger size...",this)}else{r.warning("No larger fallback asset available, no SVG will be displayed.",this)}};g.prototype._attachResizeHandlers=function(){var e=this.getIllustrationSize();if(this.getDomRef()&&e===d.Auto){this._registerResizeHandler(g.RESIZE_HANDLER_ID.CONTENT,this,this._onResize.bind(this))}};g.prototype._detachResizeHandlers=function(){this._deRegisterResizeHandler(g.RESIZE_HANDLER_ID.CONTENT)};g.prototype._registerResizeHandler=function(e,t,i){if(!this[e]){this[e]=u.register(t,i)}};g.prototype._deRegisterResizeHandler=function(e){if(this[e]){u.deregister(this[e]);this[e]=null}};g.prototype.getAccessibilityReferences=function(){return{title:this._getTitle().getId(),description:this._getDescription().getId()}};g.prototype.getAccessibilityInfo=function(){var e=this._getTitle().getText(),t=this._getDescription().getText(),i=this.getAdditionalContent();return{type:this._getResourceBundle().getText("ACC_CTR_ILLUSTRATED_MESSAGE"),description:e+". "+t,focusable:!!i.length,children:i}};g.prototype.addIllustrationAriaLabelledBy=function(e){this.addAssociation("ariaLabelledBy",e,true);var t=this._getIllustration();t.addAriaLabelledBy(e);return this};g.prototype.removeIllustrationAriaLabelledBy=function(e){this.removeAssociation("ariaLabelledBy",e,true);var t=this._getIllustration();t.removeAriaLabelledBy(e);return this};g.prototype.removeAllAriaLabelledBy=function(e){this.removeAssociation("ariaLabelledBy",e,true);var t=this._getIllustration();t.removeAllAriaLabelledBy(e);return this};return g});
//# sourceMappingURL=IllustratedMessage.js.map