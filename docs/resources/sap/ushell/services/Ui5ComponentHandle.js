// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(function(){"use strict";var t=function(t){this._oComponent=t};t.onBeforeApplicationInstanceCreated=function(){sap.ui.require(["sap/ushell/Fiori20AdapterTest"],function(){})};t.prototype.getInstance=function(){return this._oComponent};t.prototype.getMetadata=function(){return this._oComponent.getMetadata()};return t});
//# sourceMappingURL=Ui5ComponentHandle.js.map