/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["./BaseController","sap/m/library","sap/ui/comp/library","./Util","sap/ui/comp/filterbar/VariantConverterTo","sap/ui/comp/filterbar/VariantConverterFrom","sap/base/util/merge","sap/ui/comp/smartfilterbar/FilterProvider","sap/ui/mdc/p13n/panels/FilterPanel","sap/base/util/UriParameters","sap/ui/comp/util/FormatUtil","sap/ui/core/library"],function(e,t,i,a,r,l,n,o,s,u,p,f){"use strict";var d=f.ValueState;var m=i.smartfilterbar.FilterType;var h=e.extend("sap.ui.comp.personalization.FilterController",{constructor:function(i,a){e.apply(this,arguments);this.setType(t.P13nPanelType.filter);this.setItemType(t.P13nPanelType.filter+"Items");this._aDropdownFields=[];this.aFilterItems=[];this._aSFBMultiInputs=[];this._aFilterPanelFields=[];this._aCustomColumnKeysWithSlash=[];this.aSFBControlConfig=[]},metadata:{events:{afterFilterModelDataChange:{}}}});h.prototype.setTable=function(t){e.prototype.setTable.apply(this,arguments)};h.prototype.getColumn2Json=function(e,t,r){if(this.getTableType()!==i.personalization.TableType.AnalyticalTable&&this.getTableType()!==i.personalization.TableType.Table&&this.getTableType()!==i.personalization.TableType.TreeTable){return null}if(!a.isFilterable(e)){return null}if(!e.getFiltered||e.getFiltered&&!e.getFiltered()){return null}return{columnKey:t,exclude:false,operation:e.getFilterOperator(),value1:e.getFilterValue(),value2:""}};h.prototype.getColumn2JsonTransient=function(e,t,r,l){if(!a.isFilterable(e)){return null}var n;if(this.getTableType()===i.personalization.TableType.AnalyticalTable||this.getTableType()===i.personalization.TableType.Table||this.getTableType()===i.personalization.TableType.TreeTable){if(a.getColumnType(e)==="boolean"){n=a._getCustomProperty(e,"values")}return{columnKey:t,text:r,tooltip:l!==r?l:undefined,maxLength:a._getCustomProperty(e,"maxLength"),precision:a._getCustomProperty(e,"precision"),scale:a._getCustomProperty(e,"scale"),type:a.getColumnType(e),typeInstance:a._getCustomProperty(e,"typeInstance"),values:n,nullable:a._getCustomProperty(e,"nullable")}}if(this.getTableType()===i.personalization.TableType.ResponsiveTable){if(a.getColumnType(e)==="boolean"){n=a._getCustomProperty(e,"values")}return{columnKey:t,text:r,tooltip:l!==r?l:undefined,maxLength:a._getCustomProperty(e,"maxLength"),precision:a._getCustomProperty(e,"precision"),scale:a._getCustomProperty(e,"scale"),type:a.getColumnType(e),typeInstance:a._getCustomProperty(e,"typeInstance"),values:n,nullable:a._getCustomProperty(e,"nullable")}}if(this.getTableType()===i.personalization.TableType.ChartWrapper){return{columnKey:t,text:r,tooltip:l!==r?l:undefined,maxLength:a._getCustomProperty(e,"maxLength"),precision:a._getCustomProperty(e,"precision"),scale:a._getCustomProperty(e,"scale"),type:a.getColumnType(e),typeInstance:a._getCustomProperty(e,"typeInstance"),values:n,nullable:a._getCustomProperty(e,"nullable")}}};h.prototype.handleIgnore=function(e,t){e.sort.sortItems.splice(t,1)};h.prototype.syncJson2Table=function(e){var t=this.getColumnMap();var a=n({},t);this.fireBeforePotentialTableChange();if(this.getTableType()===i.personalization.TableType.AnalyticalTable||this.getTableType()===i.personalization.TableType.Table||this.getTableType()===i.personalization.TableType.TreeTable){e.filter.filterItems.forEach(function(e){var i=t[e.columnKey];if(i){if(!i.getFiltered()){i.setFiltered(true)}delete a[e.columnKey]}});for(var r in a){var l=a[r];if(l&&l.getFiltered()){l.setFiltered(false)}}}this.fireAfterPotentialTableChange()};h.prototype.getDataSuiteFormat2Json=function(e){var t=this.createControlDataStructure();if(!e.SelectOptions||!e.SelectOptions.length){return t}t.filter.filterItems=e.SelectOptions.map(function(e){var t=l.convertOption(e.Ranges[0].Option,e.Ranges[0].Low);return{columnKey:e.PropertyName,exclude:e.Ranges[0].Sign==="E",operation:t.op,value1:t.v,value2:e.Ranges[0].High}});return t};h.prototype.getDataSuiteFormatSnapshot=function(e){var t=this.getUnionData(this.getControlDataInitial(),this.getControlData());if(!t.filter||!t.filter.filterItems||!t.filter.filterItems.length){return}t.filter.filterItems.forEach(function(t){var i=r.addRangeEntry(e,t.columnKey);r.addRanges(i,[t])})};h.prototype._getFilterPropertyFromColumn=function(e){var t,i,a,r=this._getColumnByKey(e);if(!r){a=this.getColumnMap();r=a&&a[e]}if(r){if(r.getFilterProperty){i=r.getFilterProperty()}t=r.data("p13nData");if(t&&!i){i=t["filterProperty"]}}return i};h.prototype._createFilterFieldControl=function(e){if(e.conditionType){e.control=e.conditionType.initializeFilterItem()}else if(!e.control&&e.fCreateControl){e.fCreateControl(e);delete e.fCreateControl}};h.prototype._getControlDataReduceFilterItems=function(){var e=this.getControlDataReduce();return e&&e.filter&&e.filter.filterItems};h.prototype._updateControlDataReduce=function(e){var t=this.getControlDataReduce();if(!e||!(t&&t.filter&&t.filter.filterItems)){return}e.reverse();t.filter.filterItems=e;this.setControlDataReduce2Model(t);this.fireAfterPotentialModelChange({json:t})};h.prototype._getColumnByKey=function(e){var t,i,a,r,l,n=this.getTable();if(n){t=n.getColumns();a=t.length;for(r=0;r<a;r++){i=t[r];l=i.data("p13nData");if(l&&l.columnKey===e){return i}}}return null};h.prototype._getIsCustomColumn=function(e){var t=this._getColumnByKey(e),i=t&&t.data("p13nData");return!i?false:!i.typeInstance};h.prototype._getFilterQueryPanelParameter=function(){return new u(window.location.search).getAll("sap-ui-xx-filterQueryPanel")[0]==="true"};h.prototype.getPanel=function(e){if(!a.hasFilterableColumns(this.getColumnMap())){return null}if(e&&e.column){var t=a.getColumnKey(e.column);if(t){var i=this.getTransientData();i.filter.filterItems.forEach(function(e){e["isDefault"]=e.columnKey===t})}}var r=this.getTable(),l=this._getSmartFilterBar();if(l&&l._oFilterProvider){this._aDropdownFields=l._oFilterProvider._aFilterBarDropdownFieldMetadata}else if(r&&r.oParent&&r.oParent._oTableProvider&&r.oParent._oTableProvider._aTableViewMetadata){this._aDropdownFields=r.oParent._oTableProvider._aTableViewMetadata.filter(function(e){return e.hasFixedValues})}return new Promise(function(e){sap.ui.require(["sap/ui/comp/p13n/P13nFilterPanel","sap/m/P13nItem","sap/m/P13nAnyFilterItem","sap/ui/comp/providers/ValueListProvider"],function(t,i,r,l){var n,u=true;if(u){var p,f,d;if(!this.oSmartTable){this.oSmartTable=this._getSmartTable()}if(!this.oSmartChart){this.oSmartChart=this._getSmartChart()}if(!this.oSmartFilterBar){this.oSmartFilterBar=this._getSmartFilterBar();this.aSFBControlConfig=this.oSmartFilterBar&&this.oSmartFilterBar.getControlConfiguration()}if(this.oSmartTable){d=this.oSmartTable}else if(this.oSmartChart){d=this.oSmartChart}if(d){p=d.getModel();f=d.getEntitySet();n=d.getId()}if(!f&&!d&&this.getTable()&&this.getTable().isA("sap.ui.table.AnalyticalTable")){p=this.getTable().getModel();f=this.getTable().getBinding("rows")&&this.getTable().getBinding("rows").getPath().slice(1).split("(")[0]}this.oMDCFilterPanel=new s({enableReorder:false,change:this._mdcFilterPanelChangeHandler.bind(this),itemFactory:this._itemFactoryHandler.bind(this)});this._detachFieldsFromMDCFilterPanel();if(!this.oFilterProviderPromise){this.oFilterProviderPromise=o._createFilterProvider({entitySet:f,model:p,defaultDropDownDisplayBehaviour:this.oSmartTable&&this.oSmartTable.data("defaultDropDownDisplayBehaviour"),defaultTokenDisplayBehaviour:this.oSmartTable&&this.oSmartTable.data("defaultTokenDisplayBehaviour"),defaultSingleFieldDisplayBehaviour:this.oSmartTable&&this.oSmartTable.data("defaultSingleFieldDisplayBehaviour"),dateFormatSettings:this.oSmartTable&&this.oSmartTable.data("dateFormatSettings"),useContainsAsDefaultFilter:this.oSmartTable&&this.oSmartTable.data("useContainsAsDefaultFilter"),annotationSuppressed:true,useDateRangeType:false,context:"mdcFilterPanel",smartContainerId:n})}this.oFilterProviderPromise.then(function(e){this._aActiveFilterPanelFieldNames=[];if(!e._aCustomFieldMetadata){e._aCustomFieldMetadata=[]}this.oFilterProvider=e;this.oMDCFilterPanel.setModel(e.oModel,e.sFilterModelName);if(!this._aSplitIntervalFields){this._aSplitIntervalFields=this._getSplitIntervalFieldNames()}this.oMDCFilterPanel.setP13nData(this._prepareP13nData());this._updateFilterData()}.bind(this));return e(this.oMDCFilterPanel)}else{var m=this.getColumnMap(true),h=new t({containerQuery:true,enableEmptyOperations:true,items:{path:"$sapmP13nPanel>/transientData/filter/filterItems",template:new i({columnKey:"{$sapmP13nPanel>columnKey}",text:"{$sapmP13nPanel>text}",tooltip:"{$sapmP13nPanel>tooltip}",maxLength:"{$sapmP13nPanel>maxLength}",precision:"{$sapmP13nPanel>precision}",scale:"{$sapmP13nPanel>scale}",type:"{$sapmP13nPanel>type}",typeInstance:"{$sapmP13nPanel>typeInstance}",isDefault:"{$sapmP13nPanel>isDefault}",values:"{$sapmP13nPanel>values}",nullable:"{$sapmP13nPanel>nullable}"})},filterItems:{path:"$sapmP13nPanel>/controlDataReduce/filter/filterItems",template:new r({key:"{$sapmP13nPanel>key}",columnKey:"{$sapmP13nPanel>columnKey}",exclude:"{$sapmP13nPanel>exclude}",operation:"{$sapmP13nPanel>operation}",value1:"{$sapmP13nPanel>value1}",value2:"{$sapmP13nPanel>value2}"})},messageStrip:this.getMessageStrip(),beforeNavigationTo:this.setModelFunction(),filterItemChanged:function(e){var t=e.getParameter("reason");var i=e.getParameter("index");var a=e.getParameter("itemData");var r=this.getControlDataReduce();if(a&&t==="added"){if(i>-1){r.filter.filterItems.splice(i,0,a)}else{r.filter.filterItems.push(a)}}if(t==="removed"&&i>-1){r[this.getType()][this.getItemType()].splice(i,1)}this.setControlDataReduce2Model(r);this.fireAfterPotentialModelChange({json:r})}.bind(this)});if(this._aDropdownFields&&this._aDropdownFields.length>0){this._aDropdownFields=this._aDropdownFields.filter(function(e){var t=m[e.name];return!!a._getCustomProperty(t,"fullName")})}h._oConditionPanel.data("dropdownFields",this._aDropdownFields);var g=function(e,t){var i=this.getColumnMap(true),r=i[t],n=a._getCustomProperty(r,"fullName"),o=this._getSmartFilterBar(),s,u=this._getSmartTable(),p,f=o&&o.getControlConfiguration(),d,m,g,c,y,F;if(e.isA("sap.m.ComboBox")||e.isA("sap.m.MultiComboBox")){d="items";m=false;if(o&&o._oFilterProvider){s=o._oFilterProvider;g=s._sTextArrangementDisplayBehaviour||"idOnly"}else if(u&&u._oTableProvider){s=u._oTableProvider;g=s._oDefaultDropDownDisplayBehaviour||"idOnly"}this._aDropdownFields.forEach(function(e){if(e.name===t){p=e["com.sap.vocabularies.Common.v1.Text"];if(p){g=s._oMetadataAnalyser.getTextArrangementValue(p)}else if(e["com.sap.vocabularies.UI.v1.TextArrangement"]){g=s._oMetadataAnalyser.getTextArrangementValue(e)}}});if(Array.isArray(f)&&f.length>0){for(F=0;F<f.length;F++){c=f[F];if(c.getKey()===t){g=c.getDisplayBehaviour();break}}}}else{d="suggestionRows";m=true}if(o&&o._oFilterProvider&&o._oFilterProvider._aFilterBarMultiValueFieldMetadata){y=o._oFilterProvider._aFilterBarMultiValueFieldMetadata.filter(function(e){return e.name===t})[0];if(y){h._oConditionPanel.setDisplayFormat(y.displayFormat)}}if(n){e.setShowSuggestion&&e.setShowSuggestion(true);e.setFilterSuggests&&e.setFilterSuggests(false);e.setModel(this.getTable().getModel());return new l({fieldName:t,control:e,model:this.getTable().getModel(),maxLength:a._getCustomProperty(r,"maxLength"),displayBehaviour:g,resolveInOutParams:false,loadAnnotation:true,fullyQualifiedFieldName:n,aggregation:d,typeAheadEnabled:m,enableShowTableSuggestionValueHelp:false})}}.bind(this);h._oConditionPanel._fSuggestCallback=g;h._enableEnhancedExcludeOperations();h.addStyleClass("sapUiSmallMarginTop");return e(h)}}.bind(this))}.bind(this))};h.prototype._getSplitIntervalFieldNames=function(){var e,t,i=[],a=this.oFilterProvider;if(a&&a.aAllFields){for(e=0;e<a.aAllFields.length;e++){t=a.aAllFields[e];if(t.filterRestriction===m.Interval&&t.type!=="Edm.DateTime"){i.push(t.name)}}}return i};h.prototype._getFieldMetadata=function(e,t){var i=null;if(Array.isArray(e)){e.some(function(e){if(e&&e.fields){e.fields.some(function(e){if(e&&e.name===t){i=e}return i!==null})}return i!==null})}return i};h.prototype._itemFactoryHandler=function(e){var t,i,a,r,l=e.name,n=this.oFilterProvider,o=this._getControlByName(l),s=this._getFilterPropertyFromColumn(l),u;if(s&&s.includes("/")){u=n._oMetadataAnalyser.extractNavigationPropertyField(s,n.sEntitySet);u=n._createFieldMetadata(u)}else{u=n._getFieldMetadata(s)}if(u&&s&&l!==s){u=Object.assign({},u)}this._aActiveFilterPanelFieldNames.push(l);if(!o){if(!u){if(!this._aViewMetadata){this._aViewMetadata=n._oMetadataAnalyser._getAllFilterableFieldsByEntityForAllEndpoints(n.sEntitySet,true,false,null)}u=this._getFieldMetadata(this._aViewMetadata,l);if(u){u=n._createFieldMetadata(u)}}u=this._updateFieldMetadata(u,e,s);if(this.aSFBControlConfig){for(t=0;t<this.aSFBControlConfig.length;t++){i=this.aSFBControlConfig[t];if(i.getKey()===u.fieldName){a=i.getDisplayBehaviour();if(a&&!i.isPropertyInitial("displayBehaviour")){r=Object.assign({},u);r.displayBehaviour=a}break}}}if(r){r.fCreateControl(r);o=r.control}else{u.fCreateControl(u);o=u.control}o._sControlName=e.name;this._aFilterPanelFields.push(o);if(o.isA("sap.m.Select")||o.isA("sap.m.TimePicker")){o.setWidth("100%")}if(o.isA("sap.m.MultiInput")){o.attachTokenUpdate(this._fieldChangeHandler.bind(this))}else{o.attachChange(this._fieldChangeHandler.bind(this))}}if(o.getValueState&&o.getValueState()===d.Error){o.setValueState(d.None)}return o};h.prototype._fieldChangeHandler=function(e){var t,i,a,r=[],l,n=this.oFilterProvider,o=n.getFilterData(),s=e.getSource(),u=s._sControlName,p={exclude:false,columnKey:u,operation:"EQ",value1:null,value2:null};setTimeout(function(){Promise.all(n._getCurrentValidationPromises()).then(function(){for(t in o){if(o.hasOwnProperty(t)){i=o[t];if(i){a=n._getFieldMetadata(t);if(a&&a.fieldNameOData&&t!==a.fieldNameOData){t=a.fieldNameOData}p.columnKey=t;if(p.columnKey&&p.columnKey.includes("___")){p.columnKey=p.columnKey.replaceAll("___","/")}l=Object.assign({},p);if(Array.isArray(i.ranges)&&i.ranges.length>0){r.push(this._createConditionForRanges(i.ranges))}if(Array.isArray(i.items)&&i.items.length>0){r.push(this._createConditionForItems(i.items,p))}if(i.hasOwnProperty("low")&&i.low){r.push(this._createConditionForIntervals(i,t,p))}if(i.value){if(s&&s.getValueState()!==d.Error){l=Object.assign({},p);l.value1=i.value;r.push(l)}}if(typeof i!=="object"||i instanceof Date){l=Object.assign({},p);l.value1=i;r.push(l)}}}}r=r.flat();this._updateControlDataReduce(r)}.bind(this))}.bind(this))};h.prototype._updateFieldMetadata=function(e,t,i){var a,r,l=t.name,n=this.oFilterProvider,o=this._getIsCustomColumn(l),s=this._getColumnByKey(l);if(e&&o){a=s&&(s.getHeader&&s.getHeader()||s.getLabel&&s.getLabel());if(a&&a.getText()){e.label=a.getText()}}if(i&&i.includes("/")){e=n._oMetadataAnalyser.extractNavigationPropertyField(i,n.sEntitySet);e=n._createFieldMetadata(e)}if(!e){l=this._getFilterPropertyFromColumn(l);r=n.aAllFields&&n.aAllFields.find(function(e){return e.name===l});r=n._createFieldMetadata(r);e=Object.assign({},r)}if(o){e=this._prepareFieldMetadataForCustomColumn(e,t)}return e};h.prototype._prepareFieldMetadataForCustomColumn=function(e,t){var i=t.name,r,l,n,o,s,u=t.name,p=this._getColumnByKey(u),f=this.oFilterProvider;if(u.includes("/")){this._aCustomColumnKeysWithSlash.push(u);u=u.replaceAll("/","___")}e.customColumnKey=i;e.fieldName=u;e.name=u;o=!!e.ui5Type&&e.ui5Type.oConstraints;e.label=p&&(p.getHeader?p.getHeader().getText():p.getLabel().getText());n=a._getCustomProperty(p,"maxLength");l=a._getCustomProperty(p,"scale");r=a._getCustomProperty(p,"precision");if(o&&(n||l||r)){s=e.ui5Type;e=Object.assign({},e,{ui5Type:Object.assign({},e.ui5Type,{oConstraints:Object.assign({},e.ui5Type.oConstraints)})});for(var d in s){if(!s.hasOwnProperty(d)){e.ui5Type[d]=s[d]}}}if(n){e.maxLength=n;if(o){e.ui5Type.oConstraints.maxLength=n}}if(l){e.scale=l;if(o){e.ui5Type.oConstraints.scale=l}}if(r){e.precision=r;if(o){e.ui5Type.oConstraints.precision=r}}f._aCustomFieldMetadata.push(e);this._updateFilterData();return e};h.prototype._prepareP13nData=function(){var e=[],t,i=this._getControlDataReduceFilterItems();this.getTransientData().filter.filterItems.forEach(function(a){t=i&&i.some(function(e){return e.columnKey===a.columnKey});if(a.isDefault){t=true}e.push({name:a.columnKey,label:a.text,active:t})});return e};h.prototype._mdcFilterPanelChangeHandler=function(e){if(e.getParameter("reason")===this.oMDCFilterPanel.CHANGE_REASON_REMOVE){this._handleFieldRemove(e)}};h.prototype._handleFieldRemove=function(e){var t=this.oFilterProvider,i=e.getParameter("item").name,a,r=t._getFieldMetadata(i),l=this._getControlByName(i),n=this._getControlDataReduceFilterItems();if(n&&n.length>0){n=n.filter(function(e){return e.columnKey!==i})}this._updateControlDataReduce(n);if(!r){a=this._getFilterPropertyFromColumn(i);r=t.aAllFields.find(function(e){return e.name===a});r=t._createFieldMetadata(r);r.name=i;r.fieldName=i;r.control=l}t._createInitialModelForField({},r);if(l&&l.getValue&&l.getValue()){l.setValue(null)}};h.prototype._detachFieldsFromMDCFilterPanel=function(){var e,t=this.oMDCFilterPanel.exit;this.oMDCFilterPanel.exit=function(){t.apply(this,arguments);this._aFilterPanelFields.forEach(function(t){if(t){e=t.getParent();if(e){e.removeContent(t)}}});if(this._aActiveFilterPanelFieldNames){this._aActiveFilterPanelFieldNames=null}}.bind(this)};h.prototype._createConditionForRanges=function(e){var t,i,a=[],r;for(t=0;t<e.length;t++){i=Object.assign({},e[t]);if(!i.columnKey){i.columnKey=i.keyField}r=this.oFilterProvider._getFieldMetadata(i.columnKey);if(r&&r.fieldNameOData){i.columnKey=r.fieldNameOData}if(i.columnKey&&i.columnKey.includes("___")){i.columnKey=i.columnKey.replaceAll("___","/")}delete i.keyField;delete i.tokenText;a.push(i)}return a};h.prototype._createConditionForItems=function(e,t){var i,a,r=[],l;for(i=0;i<e.length;i++){a=e[i];l=Object.assign({},t);l.value1=a.key;l.token=a.text;r.push(l)}return r};h.prototype._createConditionForIntervals=function(e,t,i){var a,r=this.oFilterProvider,l=[],n;a=Object.assign({},i);a.operation="BT";if(e.low&&e.high){a.value1=e.low;a.value2=e.high}else if(e.low){if(r._aFilterBarDateTimeFieldNames.indexOf(t)>-1){n=r._getFieldMetadata(t);l=p.parseDateTimeOffsetInterval(e.low);l[0]=n.ui5Type.parseValue(l[0],"string");if(l.length===2){l[1]=n.ui5Type.parseValue(l[1],"string")}}else{l=p.parseFilterNumericIntervalData(e.low)}if(l){a.value1=l[0];a.value2=l[1]}}return a};h.prototype._updateFilterData=function(e){var t,i,a,r,l,n,o=this.oFilterProvider,s,u=e?e:this._getControlDataReduceFilterItems();o.clear();n=Object.assign({},o.getFilterData());if(u&&u.length>0){for(t=0;t<u.length;t++){l=Object.assign({},u[t]);r=l.keyField?l.keyField:l.columnKey;if(this._aCustomColumnKeysWithSlash.includes(r)){r=r.replaceAll("/","___")}a=n[r];if(!l.keyField){l.keyField=l.columnKey;delete l.columnKey}if(l.token){i={key:l.value1,text:l.token};if(!a.items){a.items=[]}a.items.push(i)}else if(l.conditionTypeInfo){if(!l.conditionTypeInfo.data.operation){l.conditionTypeInfo.data.operation=l.conditionTypeInfo.data.operator}a.conditionTypeInfo=l.conditionTypeInfo;a.ranges.push(l)}else if(a&&a.hasOwnProperty("low")){if(o._aFilterBarDateTimeFieldNames&&o._aFilterBarDateTimeFieldNames.indexOf(r)>-1){s=o._getFieldMetadata(r);if(l.value1 instanceof Date){l.value1=s.ui5Type.formatValue(l.value1,"string")}if(l.value2 instanceof Date){l.value2=s.ui5Type.formatValue(l.value2,"string")}}if(this._aSplitIntervalFields&&this._aSplitIntervalFields.indexOf(l.keyField)>-1){i={low:l.value1+"-"+l.value2,high:null}}else{i={low:l.value1,high:l.value2}}n[r]=i}else if(a===null||typeof a!=="object"){n[r]=l.value1}else{if(!(a&&a.ranges)){a.ranges=[]}n[r].ranges.push(l)}}o.setFilterData(n)}};h.prototype._getControlByName=function(e){var t,i,a,r=this._aFilterPanelFields;for(t=0;t<r.length;t++){a=r[t];if(a._sControlName===e){i=a;break}}return i};h.prototype.getChangeType=function(e,t){if(!t||!t.filter||!t.filter.filterItems){return i.personalization.ChangeType.Unchanged}if(t&&t.filter&&t.filter.filterItems){t.filter.filterItems.forEach(function(e){delete e.key;delete e.source})}if(e&&e.filter&&e.filter.filterItems){e.filter.filterItems.forEach(function(e){delete e.key;delete e.source})}var a=JSON.stringify(e.filter.filterItems)!==JSON.stringify(t.filter.filterItems);return a?i.personalization.ChangeType.ModelChanged:i.personalization.ChangeType.Unchanged};h.prototype.getChangeData=function(e,t){if(!e||!e.filter||!e.filter.filterItems){return this.createControlDataStructure()}if(t&&t.filter&&t.filter.filterItems){t.filter.filterItems.forEach(function(e){delete e.key;delete e.source})}if(e&&e.filter&&e.filter.filterItems){e.filter.filterItems.forEach(function(e){delete e.key;delete e.source})}if(!t||!t.filter||!t.filter.filterItems){return{filter:a.copy(e.filter)}}if(JSON.stringify(e.filter.filterItems)!==JSON.stringify(t.filter.filterItems)){return{filter:a.copy(e.filter)}}return null};h.prototype.getUnionData=function(e,t){if(!t||!t.filter||!t.filter.filterItems){return{filter:a.copy(e.filter)}}return{filter:a.copy(t.filter)}};h.prototype._getSmartFilterBar=function(){var e,t=this.getTable();if(t){e=t.oParent&&t.oParent._oSmartFilter}if(!e&&t&&this.getTableType()===i.personalization.TableType.ChartWrapper){e=t.getChartObject()&&t.getChartObject().oParent&&t.getChartObject().oParent._oSmartFilter}return e?e:null};h.prototype._getSmartTable=function(){var e=this.getTable()&&this.getTable().getParent();return e&&e.isA("sap.ui.comp.smarttable.SmartTable")?e:null};h.prototype._getSmartChart=function(){var e=this.getTable();if(e&&this.getTableType()===i.personalization.TableType.ChartWrapper){return e&&e.getChartObject()&&e.getChartObject().getParent()}return null};h.prototype.exit=function(){e.prototype.exit.apply(this,arguments);this._aDropdownFields=null;this.aFilterItems=null;this._aSFBMultiInputs=null;this.oSmartChart=null;this.oSmartTable=null;this.oSmartFilterBar=null;this.aSFBControlConfig=null;this._aSplitIntervalFields=null;if(this.oFilterProviderPromise){this.oFilterProviderPromise=null}if(this.oFilterProvider&&this.oFilterProvider.destroy){this.oFilterProvider.destroy();this.oFilterProvider=null}if(this._aFilterPanelFields&&this._aFilterPanelFields.length>0){this._aFilterPanelFields.forEach(function(e){e.destroy()})}this._aFilterPanelFields=null;this._aActiveFilterPanelFieldNames=null;this._aViewMetadata=null;this._aCustomColumnKeysWithSlash=null};return h});
//# sourceMappingURL=FilterController.js.map