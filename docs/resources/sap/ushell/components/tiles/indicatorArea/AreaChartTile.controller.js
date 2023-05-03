// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/components/tiles/generic","sap/m/library","sap/suite/ui/microchart/AreaMicroChartItem","sap/suite/ui/microchart/AreaMicroChartPoint","sap/ui/thirdparty/jquery"],function(e,i,a,t,jQuery){"use strict";var l=i.FrameType;var r=i.LoadState;var s=e.extend("sap.ushell.components.tiles.indicatorArea.AreaChartTile",{onInit:function(){this.KPI_VALUE_REQUIRED=false},doProcess:function(e,i){this.onAfterFinalEvaluation(e,i)},doDummyProcess:function(){var e=this;this.setTextInTile();e._updateTileModel({footer:"",description:"",width:"100%",height:"100%",chart:{color:"Good",data:[{day:0,balance:0},{day:30,balance:20},{day:60,balance:20},{day:100,balance:80}]},target:{color:"Error",data:[{day:0,balance:0},{day:30,balance:30},{day:60,balance:40},{day:100,balance:90}]},maxThreshold:{color:"Good",data:[{day:0,balance:0},{day:30,balance:40},{day:60,balance:50},{day:100,balance:100}]},innerMaxThreshold:{color:"Error",data:[]},innerMinThreshold:{color:"Neutral",data:[]},minThreshold:{color:"Error",data:[{day:0,balance:0},{day:30,balance:20},{day:60,balance:30},{day:100,balance:70}]},minXValue:0,maxXValue:100,minYValue:0,maxYValue:100,firstXLabel:{label:"June 123",color:"Error"},lastXLabel:{label:"June 30",color:"Error"},firstYLabel:{label:"0M",color:"Good"},lastYLabel:{label:"80M",color:"Critical"},minLabel:{},maxLabel:{}});this.oKpiTileView.oGenericTile.setState(r.Loaded)},scheduleJob:function(e){if(this.chipCacheTime&&!sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(this.oConfig)){sap.ushell.components.tiles.indicatorTileUtils.util.scheduleFetchDataJob.call(this,this.oTileApi.visible.isVisible())}},onAfterFinalEvaluation:function(e,i){var s=this;var o=this.DEFINITION_DATA.EVALUATION.ODATA_ENTITYSET;var n=this.DEFINITION_DATA.EVALUATION.COLUMN_NAME;var c=sap.ushell.components.tiles.indicatorTileUtils.util.prepareFilterStructure(this.DEFINITION_DATA.EVALUATION_FILTERS,this.DEFINITION_DATA.ADDITIONAL_FILTERS);var u=this.DEFINITION_DATA.TILE_PROPERTIES.dimension;if(u==undefined){this.logError();return}var h=this.DEFINITION_DATA.EVALUATION.GOAL_TYPE;var E=this.DEFINITION_DATA.EVALUATION_VALUES;var T=sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(s.oConfig.TILE_PROPERTIES.id);if(sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(s.oConfig)){if(T){var d=T.Data&&JSON.parse(T.Data)}}var f=s.oTileApi.configuration.getParameterValueAsString("timeStamp");var g=sap.ushell.components.tiles.indicatorTileUtils.util.isCacheValid(s.oConfig.TILE_PROPERTIES.id,f,s.chipCacheTime,s.chipCacheTimeUnit,s.tilePressed);var m=n;if(this.DEFINITION_DATA.EVALUATION.VALUES_SOURCE=="MEASURE"){switch(h){case"MI":s.sWarningHigh=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"WH","MEASURE");s.sCriticalHigh=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"CH","MEASURE");s.sTarget=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"TA","MEASURE");s.sTrend=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"TC","MEASURE");if(s.sWarningHigh&&s.sCriticalHigh&&s.sTarget){m+=","+s.sWarningHigh+","+s.sCriticalHigh+","+s.sTarget}break;case"MA":s.sWarningLow=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"WL","MEASURE");s.sCriticalLow=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"CL","MEASURE");s.sTarget=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"TA","MEASURE");s.sTrend=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"TC","MEASURE");if(s.sWarningLow&&s.sCriticalLow&&s.sTarget){m+=","+s.sWarningLow+","+s.sCriticalLow+","+s.sTarget}break;case"RA":s.sWarningHigh=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"WH","MEASURE");s.sCriticalHigh=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"CH","MEASURE");s.sTarget=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"TA","MEASURE");s.sTrend=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"TC","MEASURE");s.sWarningLow=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"WL","MEASURE");s.sCriticalLow=sap.ushell.components.tiles.indicatorTileUtils.util.getEvalValueMeasureName(s.oConfig,"CL","MEASURE");if(s.sWarningLow&&s.sCriticalLow&&s.sTarget&&s.sWarningHigh&&s.sCriticalHigh){m+=","+s.sWarningLow+","+s.sCriticalLow+","+s.sTarget+","+s.sWarningHigh+","+s.sCriticalHigh}break}}var p=sap.ushell.components.tiles.indicatorTileUtils.util.getBoolValue(e);if(d&&!d.rightData||!T||!g&&s.oTileApi.visible.isVisible()||p||i&&s.oTileApi.visible.isVisible()||s.getView().getViewData().refresh){if(s.kpiValueFetchDeferred){s.kpiValueFetchDeferred=false;var C=sap.ushell.components.tiles.indicatorTileUtils.util.prepareQueryServiceUri(s.oRunTimeODataModel,o,m,u,c);if(C){this.queryUriForTrendChart=C.uri;var A={};try{this.trendChartODataReadRef=C.model.read(C.uri,null,null,true,function(e){s.kpiValueFetchDeferred=true;if(e&&e.results&&e.results.length){if(C.unit[0]){s.unit=e.results[0][C.unit[0].name];s.CURRENCY_CODE=s.unit;A.unit=C.unit[0];A.unit.name=C.unit[0].name}s.queryUriResponseForTrendChart=e;u=sap.ushell.components.tiles.indicatorTileUtils.util.findTextPropertyForDimension(s.oRunTimeODataModel,o,u);e.results.splice(10);e.firstXlabel=e.results[0][u];e.lastXlabel=e.results[e.results.length-1][u];A.data=e;if(A&&A.data&&A.data.results&&A.data.results.length){for(var i=0;i<A.data.results.length;i++){delete A.data.results[i].__metadata}}A.isCurM=s.isCurrencyMeasure(s.oConfig.EVALUATION.COLUMN_NAME);A.dimensionName=u;I(e,s.DEFINITION_DATA.EVALUATION.VALUES_SOURCE);var a={};s.cacheTime=sap.ushell.components.tiles.indicatorTileUtils.util.getUTCDate();a.ChipId=s.oConfig.TILE_PROPERTIES.id;a.Data=JSON.stringify(A);a.CacheMaxAge=Number(s.chipCacheTime);a.CacheMaxAgeUnit=s.chipCacheTimeUnit;a.CacheType=1;var t=s.getLocalCache(a);if(s.DEFINITION_DATA.TILE_PROPERTIES.frameType==l.TwoByOne){var n=sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(s.oConfig.TILE_PROPERTIES.id),c;if(n){if(!n.CachedTime){n.CachedTime=sap.ushell.components.tiles.indicatorTileUtils.util.getUTCDate()}c=n.Data;if(c){c=JSON.parse(c);c.rightData=A}n.Data=JSON.stringify(c);sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(s.oConfig.TILE_PROPERTIES.id,n)}else{c={};c.rightData=A;t.Data=JSON.stringify(c);sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(s.oConfig.TILE_PROPERTIES.id,t)}s.cacheWriteData=A;s.getView().getViewData().deferredObj.resolve()}else{sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(s.oConfig.TILE_PROPERTIES.id,t);var h=false;if(T){h=true}if(s.chipCacheTime){sap.ushell.components.tiles.indicatorTileUtils.util.writeFrontendCacheByChipAndUserId(s.oTileApi,s.oConfig.TILE_PROPERTIES.id,a,h,function(e){if(e){s.cacheTime=e&&e.CachedTime;sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(s.oConfig.TILE_PROPERTIES.id,e);s.setTimeStamp()}if(s.chipCacheTime&&!sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(s.oConfig)){jQuery.proxy(s.setTimeStamp(s.cacheTime),s)}})}s.oKpiTileView.oGenericTile.setState(r.Loaded);s.updateDatajobScheduled=false;var E=s.oConfig.TILE_PROPERTIES.id+"data";var d=sap.ushell.components.tiles.indicatorTileUtils.util.getScheduledJob(E);if(d){clearTimeout(d);d=undefined}jQuery.proxy(s.scheduleJob(s.cacheTime),s)}}else{s.setNoData()}},function(e){s.kpiValueFetchDeferred=true;if(e&&e.response){s.logError("Data call failed")}})}catch(e){s.kpiValueFetchDeferred=true;s.logError(e)}}else{s.kpiValueFetchDeferred=true;s.logError()}}}else if(T&&T.Data){try{var L;var N=s.oConfig&&s.oConfig.TILE_PROPERTIES&&s.oConfig.TILE_PROPERTIES.tileType;if(N.indexOf("DT-")==-1){L=T.Data&&JSON.parse(T.Data)}else{L=T.Data&&JSON.parse(T.Data);L=L.rightData}if(L.unit){s.unit=L.data.results[0][L.unit.name];s.CURRENCY_CODE=s.unit}s.cacheTime=T.CachedTime;if(s.chipCacheTime&&!sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(s.oConfig)){jQuery.proxy(s.setTimeStamp(s.cacheTime),s)}s.queryUriResponseForTrendChart=L.data;u=L.dimensionName;I(L.data,s.DEFINITION_DATA.EVALUATION.VALUES_SOURCE);if(s.oConfig.TILE_PROPERTIES.frameType==l.OneByOne){s.oKpiTileView.oGenericTile.setState(r.Loaded)}else{s.getView().getViewData().deferredObj.resolve()}jQuery.proxy(s.scheduleJob(s.cacheTime),s)}catch(e){s.logError(e)}}else{s.setNoData()}function I(e,i){var l=[];var r=[];var o=[];var c=[];var T=[];var d=[];var f=e.firstXlabel;var g,m,p,C,A;var L=e.lastXlabel;var N=Number(e.results[0][n]);var I=Number(e.results[e.results.length-1][n]);var U;for(U in e.results){e.results[U][u]=Number(U);e.results[U][n]=Number(e.results[U][n]);if(s.sWarningHigh){e.results[U][s.sWarningHigh]=Number(e.results[U][s.sWarningHigh])}if(s.sCriticalHigh){e.results[U][s.sCriticalHigh]=Number(e.results[U][s.sCriticalHigh])}if(s.sCriticalLow){e.results[U][s.sCriticalLow]=Number(e.results[U][s.sCriticalLow])}if(s.sWarningLow){e.results[U][s.sWarningLow]=Number(e.results[U][s.sWarningLow])}if(s.sTarget){e.results[U][s.sTarget]=Number(e.results[U][s.sTarget])}if(s.sWarningHigh){o.push(e.results[U][s.sWarningHigh])}if(s.sCriticalHigh){c.push(e.results[U][s.sCriticalHigh])}if(s.sCriticalLow){T.push(e.results[U][s.sCriticalLow])}if(s.sWarningLow){d.push(e.results[U][s.sWarningLow])}l.push(e.results[U][u]);r.push(e.results[U][n])}try{f=sap.ushell.components.tiles.indicatorTileUtils.util.formatOdataObjectToString(f);L=sap.ushell.components.tiles.indicatorTileUtils.util.formatOdataObjectToString(L)}catch(e){s.logError(e)}var b=Number(N);if(s.oConfig.EVALUATION.SCALING==-2){b*=100}var M=Math.min.apply(Math,r);var S=s.isCurrencyMeasure(s.oConfig.EVALUATION.COLUMN_NAME);var D=sap.ushell.components.tiles.indicatorTileUtils.util.getLocaleFormattedValue(b,s.oConfig.EVALUATION.SCALING,s.oConfig.EVALUATION.DECIMAL_PRECISION,S,s.CURRENCY_CODE);if(s.oConfig.EVALUATION.SCALING==-2){D+=" %"}var w=D.toString();var R=Number(I);if(s.oConfig.EVALUATION.SCALING==-2){R*=100}var O=Math.max.apply(Math,r);S=s.isCurrencyMeasure(s.oConfig.EVALUATION.COLUMN_NAME);var v=sap.ushell.components.tiles.indicatorTileUtils.util.getLocaleFormattedValue(R,s.oConfig.EVALUATION.SCALING,s.oConfig.EVALUATION.DECIMAL_PRECISION,S,s.CURRENCY_CODE);if(s.oConfig.EVALUATION.SCALING==-2){v+=" %"}var V=v.toString();try{var H=sap.ushell.components.tiles.indicatorTileUtils.util.formatOdataObjectToString(Math.min.apply(Math,l));var y=sap.ushell.components.tiles.indicatorTileUtils.util.formatOdataObjectToString(Math.max.apply(Math,l))}catch(e){s.logError(e)}if(i=="MEASURE"){if(o.length!=0){s.firstwH=o[H];s.lastwH=o[y]}if(c.length!=0){s.firstcH=c[H];s.lastcH=c[y]}if(T.length!=0){s.firstcL=T[H];s.lastcL=T[y]}if(d.length!=0){s.firstwL=d[H];s.lastwL=d[y]}}var F={width:"100%",height:"100%",unit:s.unit||"",chart:{color:"Neutral",data:e.results},size:"Auto",minXValue:H,maxXValue:y,minYValue:M,maxYValue:O,firstXLabel:{label:f+"",color:"Neutral"},lastXLabel:{label:L+"",color:"Neutral"},firstYLabel:{label:w+"",color:"Neutral"},lastYLabel:{label:V+"",color:"Neutral"},minLabel:{},maxLabel:{}};var P;switch(h){case"MA":for(U in E){if(E[U].TYPE=="CL"){F.minThreshold={color:"Error"};P={};P[u]="";P[n]=Number(E[U].FIXED);s.cl=Number(E[U].FIXED);F.minThreshold.data=i=="MEASURE"?e.results:[P];g=i=="MEASURE"?s.sCriticalLow:n}else if(E[U].TYPE=="WL"){F.maxThreshold={color:"Good"};P={};P[u]="";P[n]=Number(E[U].FIXED);F.maxThreshold.data=i=="MEASURE"?e.results:[P];m=i=="MEASURE"?s.sWarningLow:n;s.wl=Number(E[U].FIXED)}else if(E[U].TYPE=="TA"){P={};P[u]="";P[n]=Number(E[U].FIXED);F.target={color:"Neutral"};F.target.data=i=="MEASURE"?e.results:[P];A=i=="MEASURE"?s.sTarget:n}}F.innerMinThreshold={data:[]};F.innerMaxThreshold={data:[]};if(i=="FIXED"){F.firstYLabel.color=N<s.cl?"Error":s.cl<=N&&N<=s.wl?"Critical":N>s.wl?"Good":"Neutral";F.lastYLabel.color=I<s.cl?"Error":s.cl<=I&&I<=s.wl?"Critical":I>s.wl?"Good":"Neutral"}else if(i=="MEASURE"&&s.firstwL&&s.lastwL&&s.firstcL&&s.lastcL){F.firstYLabel.color=N<s.firstcL?"Error":s.firstcL<=N&&N<=s.firstwL?"Critical":N>s.firstwL?"Good":"Neutral";F.lastYLabel.color=I<s.lastcL?"Error":s.lastcL<=I&&I<=s.lastwL?"Critical":I>s.lastwL?"Good":"Neutral"}break;case"MI":for(U in E){if(E[U].TYPE=="CH"){P={};P[u]="";P[n]=Number(E[U].FIXED);s.ch=Number(E[U].FIXED);F.maxThreshold={color:"Error"};F.maxThreshold.data=i=="MEASURE"?e.results:[P];m=i=="MEASURE"?s.sCriticalHigh:n}else if(E[U].TYPE=="WH"){P={};P[u]="";P[n]=Number(E[U].FIXED);s.wh=Number(E[U].FIXED);F.minThreshold={color:"Good"};F.minThreshold.data=i=="MEASURE"?e.results:[P];g=i=="MEASURE"?s.sWarningHigh:n}else if(E[U].TYPE=="TA"){P={};P[u]="";P[n]=Number(E[U].FIXED);F.target={color:"Neutral"};F.target.data=i=="MEASURE"?e.results:[P];A=i=="MEASURE"?s.sTarget:n}}if(i=="FIXED"){F.firstYLabel.color=N>s.ch?"Error":s.wh<=N&&N<=s.ch?"Critical":N<s.wh?"Good":"Neutral";F.lastYLabel.color=I>s.ch?"Error":s.wh<=I&&I<=s.ch?"Critical":I<s.wh?"Good":"Neutral"}else if(i=="MEASURE"&&s.firstwH&&s.lastwH&&s.firstcH&&s.lastcH){F.firstYLabel.color=N>s.firstcH?"Error":s.firstwH<=N&&N<=s.firstcH?"Critical":N<s.firstwH?"Good":"Neutral";F.lastYLabel.color=I>s.lastcH?"Error":s.lastwH<=I&&I<=s.lastcH?"Critical":I<s.lastwH?"Good":"Neutral"}F.innerMaxThreshold={data:[]};F.innerMinThreshold={data:[]};break;case"RA":for(U in E){if(E[U].TYPE=="CH"){P={};P[u]="";P[n]=Number(E[U].FIXED);s.ch=Number(E[U].FIXED);F.maxThreshold={color:"Error"};F.maxThreshold.data=i=="MEASURE"?e.results:[P];m=i=="MEASURE"?s.sCriticalHigh:n}else if(E[U].TYPE=="WH"){P={};P[u]="";P[n]=Number(E[U].FIXED);s.wh=Number(E[U].FIXED);F.innerMaxThreshold={color:"Good"};F.innerMaxThreshold.data=i=="MEASURE"?e.results:[P];C=i=="MEASURE"?s.sWarningHigh:n}else if(E[U].TYPE=="WL"){P={};P[u]="";P[n]=Number(E[U].FIXED);s.wl=Number(E[U].FIXED);F.innerMinThreshold={color:"Good"};F.innerMinThreshold.data=i=="MEASURE"?e.results:[P];p=i=="MEASURE"?s.sWarningLow:n}else if(E[U].TYPE=="CL"){P={};P[u]="";P[n]=Number(E[U].FIXED);s.cl=Number(E[U].FIXED);F.minThreshold={color:"Error"};F.minThreshold.data=i=="MEASURE"?e.results:[P];g=i=="MEASURE"?s.sCriticalLow:n}else if(E[U].TYPE=="TA"){P={};P[u]="";P[n]=Number(E[U].FIXED);F.target={color:"Neutral"};F.target.data=i=="MEASURE"?e.results:[P];A=i=="MEASURE"?s.sTarget:n}}if(i=="FIXED"){F.firstYLabel.color=N>s.ch||N<s.cl?"Error":s.wh<=N&&N<=s.ch||s.cl<=N&&N<=s.wl?"Critical":N>=s.wl&&N<=s.wh?"Good":"Neutral";F.lastYLabel.color=I>s.ch||I<s.cl?"Error":s.wh<=I&&I<=s.ch||s.cl<=I&&I<=s.wl?"Critical":I>=s.wl&&I<=s.wh?"Good":"Neutral"}else if(i=="MEASURE"&&s.firstwL&&s.lastwL&&s.firstcL&&s.lastcL&&s.firstwH&&s.lastwH&&s.firstcH&&s.lastcH){F.firstYLabel.color=N>s.firstcH||N<s.firstcL?"Error":s.firstwH<=N&&N<=s.firstcH||s.firstcL<=N&&N<=s.firstwL?"Critical":N>=s.firstwL&&N<=s.firstwH?"Good":"Neutral";F.lastYLabel.color=I>s.lastcH||I<s.lastcL?"Error":s.lastwH<=I&&I<=s.lastcH||s.lastcL<=I&&I<=s.lastwL?"Critical":I>=s.lastwL&&I<=s.lastwH?"Good":"Neutral"}break}var _=function(e,i,l,r){return new a({color:"{/"+e+"/color}",points:{path:"/"+e+"/data",template:new t({x:"{"+i+"}",y:"{"+l+"}"})}})};var Y=s.getView().oNVConfContS;Y.setTarget(_("target",u,A));Y.setInnerMinThreshold(_("innerMinThreshold",u,p));Y.setInnerMaxThreshold(_("innerMaxThreshold",u,C));Y.setMinThreshold(_("minThreshold",u,g));Y.setMaxThreshold(_("maxThreshold",u,m));Y.setChart(_("chart",u,n));s.setTextInTile();if(s.getView().getViewData().parentController){s.getView().getViewData().parentController._updateTileModel(F)}else{s._updateTileModel(F)}}}});return s});
//# sourceMappingURL=AreaChartTile.controller.js.map