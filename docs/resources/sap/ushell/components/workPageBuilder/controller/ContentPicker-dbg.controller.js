// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/EventHub",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/core/CustomData",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/base/util/uid"
], function (EventHub, Controller, Fragment, CustomData, Filter, FilterOperator, uid) {

    "use strict";

    return Controller.extend("sap.ushell.components.workPageBuilder.controller.ContentPicker", {

        /**
         * Loads the content picker dialog and set its model.
         * @return {Promise} A promise that resolves when the dialog fragment is loaded.
         * @private
         */
        _getDialog: function () {
            if (!this._oContentPickerDialog) {
                return new Promise(function (resolve, reject) {
                    Fragment.load({ name: "sap.ushell.components.workPageBuilder.view.ContentPicker", controller: this })
                        .then(function (oContentPickerDialog) {
                            var oCustomData = new CustomData("rowBindingContext", { key: "columnControl", value: this._oProvider.oColumn });
                            this._oContentPickerDialog = oContentPickerDialog;
                            this._oContentPickerDialog.setModel(this._oProvider.oWorkPageBuilderView.getModel());
                            this._oContentPickerDialog.setModel(this._oProvider.oWorkPageBuilderView.getModel("i18n"), "i18n");
                            this._oContentPickerDialog.bindElement({ path: this._oProvider.sCatalogRootPath });
                            this._oContentPickerDialog.addCustomData(oCustomData);
                            resolve(this._oContentPickerDialog);
                        }.bind(this));
                }.bind(this));
            }
            return Promise.resolve(this._oContentPickerDialog);
        },


        /**
         * Open the content picker dialog and set the custom data.
         * @return {Promise} A promise that resolves when the dialog fragment is loaded.
         */
        openDialog: function () {
            return this._getDialog().then(function (oContentPickerDialog) {
                oContentPickerDialog.getCustomData()[0].setValue(this._oProvider.oColumn);
                oContentPickerDialog.open();
            }.bind(this));
        },

        /**
        * Filter the list
        * @param {sap.base.Event} oEvent The "search" event.
        */
        onSearch: function (oEvent) {
            var sValue = oEvent.getSource().getValue();
            var oFilterTitle = new Filter("Descriptor/sap.app/title", FilterOperator.Contains, sValue);
            var oFilterSubtitle = new Filter("Descriptor/sap.app/subTitle", FilterOperator.Contains, sValue);
            var oFilters = new Filter([oFilterTitle, oFilterSubtitle], false);

            var oList = this._oContentPickerDialog.getContent()[0];
            oList.getBinding("items").filter(oFilters);
        },



        /**
        * Get and add the selected widget to the UI and close the dialog
        */
        onConfirm: function () {
            var oModel = this._oProvider.oWorkPageBuilderView.getModel(),
                oList = this._oContentPickerDialog.getContent()[0],
                oColumn = this._oContentPickerDialog.getCustomData()[0].getValue(),
                sColumnPath = oColumn.getBindingContext().getPath(),
                oColumnData = oModel.getProperty(sColumnPath),
                bWasEmpty = false,
                oSelectedItem = oList.getSelectedItem(),
                oSelectedItemData = oSelectedItem.getBindingContext().getObject(),

                oWidgetData = {
                    Id: uid(),
                    Descriptor: {},
                    Visualization: {
                        Id: oSelectedItemData.Id
                    }
                },

                sVizSelectedItemPath = this._oProvider.sVizRootPath + "/" + oSelectedItemData.Id;

            if (!oModel.getProperty(sVizSelectedItemPath)) {
                oModel.setProperty(sVizSelectedItemPath, oSelectedItemData);
            }

            if (!oColumnData.Cells) {
                oColumnData.Cells = [];
            }

            oColumnData.Cells.push({
                Id: uid(),
                Widgets: [oWidgetData]
            });

            oModel.setProperty(sColumnPath, oColumnData);

            // Inform ushell that content was changed during editing.
            EventHub.emit("WorkPageHasChanges", true);

            if (bWasEmpty) {
                // @TODO: unfortunately required if column was empty! Check how it can be removed.
                oColumn.rerender();
            }

            this.closeDialog();
        },

        /**
        * Close the dialog and clean the list filter and the search field
        */
        closeDialog: function () {
            var oList = this._oContentPickerDialog.getContent()[0];
            var oSearchField = this._oContentPickerDialog.getCustomHeader().getContent()[2];

            oList.removeSelections(true);
            oList.getBinding("items").filter(null);
            oSearchField.setValue("");

            this._oContentPickerDialog.close();
        },

        onCancel: function () {
           this.closeDialog();
        },


        setProvider: function (oProvider) {
            this._oProvider = oProvider;
        },

        getProvider: function () {
            return this._oProvider;
        }


    });

});
