/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/includes"],function(e){"use strict";return{async:false,errorMessage:"BASE_EDITOR.VALIDATOR.DUPLICATE_KEY",validate:function(n,r){return r.currentKey===undefined||!e(r.keys,n)||n===undefined||n===r.currentKey}}});
//# sourceMappingURL=IsUniqueKey.js.map