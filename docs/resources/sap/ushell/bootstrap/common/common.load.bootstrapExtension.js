// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/base/util/ObjectPath"],function(t){"use strict";function e(e){var i=t.get("bootstrap.extensionModule",e);if(!i||typeof i!=="string"){return}i=i.replace(/\./g,"/");sap.ui.require([i],function(t){if(t&&typeof t==="function"){t()}})}return e});
//# sourceMappingURL=common.load.bootstrapExtension.js.map