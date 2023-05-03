/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var t={string:{maxLength:function(t,e){return t.length<=e},maxLengthTxt:"EDITOR_VAL_MAXLENGTH",minLength:function(t,e){return t.length>=e},minLengthTxt:"EDITOR_VAL_MINLENGTH",pattern:function(t,e){var i=new RegExp(e);return i.test(t)},patternTxt:"EDITOR_VAL_NOMATCH",required:function(t,e){return!e||!!t},requiredTxt:"EDITOR_VAL_TEXTREQ",validateTxt:"EDITOR_VAL_NOMATCH"},"string[]":{maxLength:function(t,e){return Array.isArray(t)&&t.length<=e},maxLengthTxt:"EDITOR_VAL_LISTMAXLENGTH",minLength:function(t,e){return Array.isArray(t)&&t.length>=e},minLengthTxt:"EDITOR_VAL_LISTMINLENGTH",required:function(t,e){return Array.isArray(t)&&t.length>0},requiredTxt:"EDITOR_VAL_LISTREQ"},integer:{maximum:function(t,e,i){if(i.exclusiveMaximum){i._txt="maximumExclusiveTxt";return t<e}return t<=e},maximumTxt:"EDITOR_VAL_MAX",maximumExclusiveTxt:"EDITOR_VAL_MAX_E",minimum:function(t,e,i){if(i.exclusiveMinimum){i._txt="minimumExclusiveTxt";return t>e}return t>=e},minimumTxt:"EDITOR_VAL_MIN",minimumExclusiveTxt:"EDITOR_VAL_MIN_E",multipleOf:function(t,e){return t%e===0},multipleOfTxt:"EDITOR_VAL_MULTIPLE",required:function(t,e){return!isNaN(t)&&t!==""},requiredTxt:"EDITOR_VAL_NUMBERREQ",validateTxt:"EDITOR_VAL_NOMATCH"},number:{maximum:function(t,e,i){if(i.exclusiveMaximum){i._txt="maximumExclusiveTxt";return t<e}return t<=e},maximumTxt:"EDITOR_VAL_MAX",maximumExclusiveTxt:"EDITOR_VAL_MAX_E",minimum:function(t,e,i){if(i.exclusiveMinimum){i._txt="minimumExclusiveTxt";return t>e}return t>=e},minimumTxt:"EDITOR_VAL_MIN",minimumExclusiveTxt:"EDITOR_VAL_MAX_E",multipleOf:function(t,e){return t%e===0},multipleOfTxt:"EDITOR_VAL_MULTIPLE",required:function(t,e){return!isNaN(t)&&t!==""},requiredTxt:"EDITOR_VAL_NUMBERREQ",validateTxt:"EDITOR_VAL_NOMATCH"},keyValuePair:{required:function(t,e){return!e||!!t.value},requiredTxt:"EDITOR_VAL_FIELDREQ",restrictToPredefinedOptions:function(t,e){return e&&!t.value&&!t.key||e&&!!t.key},restrictToPredefinedOptionsTxt:"EDITOR_ONLY_LISTED_VALUES_ALLOWED"}};return t});
//# sourceMappingURL=Validators.js.map