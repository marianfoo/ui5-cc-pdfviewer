/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/ui/mdc/enum/ConditionValidated"],function(i,t){"use strict";var e={createItemCondition:function(i,e,n,a,r){var o=t.NotValidated;var s=[i,e];if(e===null||e===undefined){s.pop()}else{o=t.Validated}return this.createCondition("EQ",s,n,a,o,r)},createCondition:function(i,t,e,n,a,r){var o={operator:i,values:t,isEmpty:null,validated:a};if(e){o.inParameters=e}if(n){o.outParameters=n}if(r){o.payload=r}return o},compareConditions:function(i,t){var e={isEmpty:undefined};var n=JSON.stringify(Object.assign({},i,e));var a=JSON.stringify(Object.assign({},t,e));return n===a},_removeEmptyConditions:function(i){for(var t=i.length-1;t>-1;t--){if(i[t].isEmpty){i.splice(parseInt(t),1)}}return i},_removeInitialFlags:function(i){for(var t=i.length-1;t>-1;t--){if(i[t].isInitial){delete i[t].isInitial}}return i}};return e},true);
//# sourceMappingURL=Condition.js.map