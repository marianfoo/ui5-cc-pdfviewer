// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ui/core/service/ServiceFactory"],function(e){"use strict";var r={_servicePromises:{},createServiceFactory:function(r){var i=this._servicePromises;var c=e.extend("sap.ushell.ui5Service."+r+"Factory",{createInstance:function(){var e=i[r];if(!e){e=new Promise(function(e,i){sap.ui.require(["sap/ushell/ui5service/"+r],function(r){var c;if(!r){i()}c=new r;e(c)})});i[r]=e}return e}});return new c}};return r});
//# sourceMappingURL=Ui5NativeServiceFactory.js.map