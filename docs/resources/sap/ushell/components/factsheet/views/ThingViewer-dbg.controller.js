// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/model/odata/ODataModel"
], function (ODataModel) {
    "use strict";

    sap.ui.controller("sap.ushell.components.factsheet.views.ThingViewer", {
        setService: function (sUri) {
            this.getView().setModel(new ODataModel(sUri));
        }
    });
});
