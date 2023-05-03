/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/p13n/Engine","./ItemBaseFlex"],function(e,n){"use strict";var t=Object.assign({},n);var r=function(n){if(n&&n.isA&&n.isA("sap.ui.mdc.Table")&&n.isTableBound()){if(!n._bWaitForBindChanges){n._bWaitForBindChanges=true;e.getInstance().waitForChanges(n).then(function(){n.rebind();delete n._bWaitForBindChanges})}}};t.findItem=function(e,n,t){return n.reduce(function(n,r){return n.then(function(n){if(!n){return Promise.resolve().then(e.getProperty.bind(e,r,"dataProperty")).then(function(e){if(e===t){return r}})}return n})},Promise.resolve())};t.afterApply=function(e,n,t){r(n)};t.addColumn=t.createAddChangeHandler();t.removeColumn=t.createRemoveChangeHandler();t.moveColumn=t.createMoveChangeHandler();return t});
//# sourceMappingURL=ColumnFlex.js.map