/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/designtime/baseEditor/util/isValidBindingString"],function(i){"use strict";return{async:false,errorMessage:"BASE_EDITOR.VALIDATOR.INVALID_BINDING",validate:function(n,e){var t=(e||{}).allowPlainStrings!==false;return n===undefined||n===""||i(n.toString(),t)}}});
//# sourceMappingURL=IsValidBinding.js.map