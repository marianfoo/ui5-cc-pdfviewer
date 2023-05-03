/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/suite/ui/generic/template/designtime/utils/designtimeHelper","sap/base/util/deepExtend"],function(e,a){"use strict";var t={};var o={"sap.uxap.ObjectPageLayout":{properties:["showAnchorBar","useIconTabBar","showHeaderContent","alwaysShowContentHeader"]},"sap.uxap.ObjectPageHeaderActionButton":{actions:["combine"],properties:["visible"]},"sap.m.Avatar":{properties:["displayShape"]},"sap.m.VBox":{properties:["visible"]},"sap.m.HBox":{properties:["visible"]},"sap.ui.layout.Grid":{properties:["defaultSpan"]},"sap.uxap.ObjectPageSection":{properties:["showTitle","titleUppercase","title"]},"sap.uxap.ObjectPageSubSection":{properties:["title"]},"sap.ui.comp.smarttable.SmartTable":{properties:["useExportToExcel","editable"]},"sap.m.Table":{properties:["growingThreshold","popinLayout","includeItemInSelection"]},"sap.m.Column":{properties:["width","hAlign"]},"sap.ui.table.Column":{properties:["width","hAlign"]},"sap.m.Button":{actions:["combine"],properties:["visible","icon","activeIcon","type"]},"sap.m.OverflowToolbarButton":{properties:["visible","icon","activeIcon","type"]},"sap.m.OverflowToolbar":{aggregations:{content:{actions:["move"]}}}};var r={"sap.uxap.ObjectPageLayout":{properties:["showAnchorBarPopover","headerContentPinnable"]},"sap.uxap.ObjectPageHeader":{properties:["objectTitle"]},"sap.uxap.ObjectPageHeaderActionButton":{properties:["enabled","icon","text"]},"sap.m.VBox":{properties:["width"]},"sap.m.Avatar":{properties:["src"]},"sap.m.Label":{properties:["width","wrapping"]},"sap.m.Text":{properties:["text","wrapping"]},"sap.m.Title":{properties:["text"]},"sap.ui.comp.smartmicrochart.SmartMicroChart":{properties:["size"]},"sap.ui.comp.smartform.Group":{properties:["label"]},"sap.ui.comp.smartfield.SmartField":{properties:["textInEditModeSource","showValueHelp"]},"sap.ui.comp.smarttable.SmartTable":{properties:["header","ignoreFromPersonalisation","showTablePersonalisation","editable","showRowCount","wrap","ignoredFields","exportType","width","demandPopin"]},"sap.m.Table":{properties:["noDataText","growingScrollToLoad","growing"]},"sap.ui.table.Table":{properties:["selectionMode"]},"sap.ui.table.AnalyticalTable":{properties:["selectionMode","minAutoRowCount","visibleRowCountMode"]},"sap.ui.table.AnalyticalColumn":{properties:["width","minWidth"]},"sap.ui.comp.smartchart.SmartChart":{properties:["showDownloadButton","header","ignoredChartTypes","useTooltip"]},"sap.m.Button":{properties:["enabled","text","blocked"]},"sap.m.OverflowToolbarButton":{properties:["enabled","text","blocked"]}};var i={"sap.uxap.ObjectPageHeader":{aggregations:{actions:{actions:["move"]}}},"sap.uxap.ObjectPageDynamicHeaderTitle":{aggregations:{actions:{actions:["move"]}}},"sap.uxap.AnchorBar":{aggregations:{content:{actions:["move"]}}},"sap.m.Button":{actions:["remove","reveal","rename","getResponsibleElement","actionsFromResponsibleElement"]},"sap.m.MenuButton":{actions:["remove","reveal","rename","getResponsibleElement","actionsFromResponsibleElement","split"]},"sap.m.Toolbar":{actions:["moveControls"]},"sap.uxap.ObjectPageLayout":{aggregations:{headerContent:{actions:["addIFrame","move"]},sections:{actions:["addIFrame","move"]}}},"sap.ui.fl.util.IFrame":{actions:["settings","remove","reveal"]},"sap.m.VBox":{actions:["remove","reveal"],aggregations:{items:{actions:["move"]}}},"sap.m.FlexBox":{actions:["remove","reveal"],aggregations:{items:{actions:["move"]}}},"sap.uxap.ObjectPageSection":{actions:["rename","remove","reveal"],aggregations:{subSections:{actions:["move"]}}},"sap.uxap.ObjectPageSubSection":{actions:["rename","remove","reveal"]},"sap.ui.comp.smartform.SmartForm":{aggregations:{groups:{actions:["move","createContainer","remove"]}}},"sap.ui.comp.smartform.Group":{actions:["rename","remove"],aggregations:{formElements:{actions:["add","move","remove"]}}},"sap.ui.comp.smartform.GroupElement":{actions:["rename","remove","reveal","combine","split"]},"sap.ui.comp.smartvariants.SmartVariantManagement":{actions:["compVariant"]},"sap.ui.comp.smarttable.SmartTable":{actions:["compVariant"]},"sap.ui.comp.smartchart.SmartChart":{actions:["compVariant"]},"sap.m.Title":{actions:["rename"]}};var s={"sap.ui.comp.smartvariants.SmartVariantManagement":{actions:["compVariant"]},"sap.ui.comp.smarttable.SmartTable":{actions:["compVariant"]},"sap.ui.comp.smartchart.SmartChart":{actions:["compVariant"]}};if(e.getRtaModeValue("fiori-tools-rta-mode")==="true"){t=s}else{t=e.getMergedAllowList([o,r,i])}return e.getViewDesignTime(t)});
//# sourceMappingURL=ObjectPage.designtime.js.map