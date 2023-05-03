/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/designtime/baseEditor/validator/IsValidBinding","sap/base/util/restricted/_isNil"],function(i,e){"use strict";return{async:false,errorMessage:"BASE_EDITOR.VALIDATOR.NOT_A_BOOLEAN",validate:function(a){return e(a)||typeof a==="boolean"||i.validate(a,{allowPlainStrings:false})}}});
//# sourceMappingURL=IsBoolean.js.map