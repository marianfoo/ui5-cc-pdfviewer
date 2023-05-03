// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * @fileOverview The Personalization adapter for the local platform.
 *
 *
 * The local personalization adapter can be configured to store data either in
 * the local storage (default) or in memory.
 * @version 1.108.12
 */
 sap.ui.define([
    "sap/ushell/utils",
    "sap/ui/thirdparty/jquery"
], function (
    utils,
    jQuery
) {
    "use strict";
    var oMemoryPersData;
    function getLocalStorage () {
        var Storage = sap.ui.requireSync("sap/ui/util/Storage");
        return new Storage(Storage.Type.local, "com.sap.ushell.adapters.sandbox.Personalization");
    }
    function parse (sJson) {
        try {
            return JSON.parse(sJson);
        } catch (e) {
            return undefined;
        }
    }
    function stringify (oJson) {
        return JSON.stringify(oJson);
    }
    function clone (oJson) {
        if (oJson === undefined) {
            return undefined;
        }
        try {
            return JSON.parse(JSON.stringify(oJson));
        } catch (e) {
            return undefined;
        }
    }
    var AdapterContainer = function (sContainerKey, sStorageType, MemoryPersData) {
        oMemoryPersData = MemoryPersData;
        this._sContainerKey = sContainerKey;
        this._sStorageType = sStorageType;
        this._oItemMap = new utils.Map();
    };
    AdapterContainer.prototype.load = function () {
        var oDeferred = new jQuery.Deferred(),
            oLocalStorage,
            sItems,
            that = this;
        var PersonalizationAdapter = sap.ui.require("sap/ushell/adapters/local/PersonalizationAdapter");
        switch (this._sStorageType) {
            case PersonalizationAdapter.prototype.constants.storage.LOCAL_STORAGE:
                oLocalStorage = getLocalStorage();
                setTimeout(function () {
                    sItems = oLocalStorage.get(that._sContainerKey);
                    that._oItemMap.entries = parse(sItems) || {};
                    oDeferred.resolve(that);
                }, 0);
                break;
            case PersonalizationAdapter.prototype.constants.storage.MEMORY:
                setTimeout(function () {
                    that._oItemMap.entries = clone(oMemoryPersData[that._sContainerKey]) || {};
                    oDeferred.resolve(that);
                }, 0);
                break;
            default:
                setTimeout(function () {
                    oDeferred.reject("unknown storage type");
                }, 0);
        }
        return oDeferred.promise();
    };
    AdapterContainer.prototype.save = function () {
        var oDeferred = new jQuery.Deferred(),
            oLocalStorage,
            sItems,
            that = this;
        var PersonalizationAdapter = sap.ui.require("sap/ushell/adapters/local/PersonalizationAdapter");
        switch (this._sStorageType) {
            case PersonalizationAdapter.prototype.constants.storage.LOCAL_STORAGE:
                oLocalStorage = getLocalStorage();
                setTimeout(function () {
                    sItems = stringify(that._oItemMap.entries);
                    oLocalStorage.put(that._sContainerKey, sItems);
                    oDeferred.resolve();
                }, 0);
                break;
            case PersonalizationAdapter.prototype.constants.storage.MEMORY:
                setTimeout(function () {
                    oMemoryPersData[that._sContainerKey] = clone(that._oItemMap.entries);
                    oDeferred.resolve();
                }, 0);
                break;
            default:
                setTimeout(function () {
                    oDeferred.reject("unknown storage type");
                }, 0);
        }
        return oDeferred.promise();
    };
    AdapterContainer.prototype.del = function () {
        var oDeferred = new jQuery.Deferred(),
            oLocalStorage,
            that = this;
        var PersonalizationAdapter = sap.ui.require("sap/ushell/adapters/local/PersonalizationAdapter");
        switch (this._sStorageType) {
            case PersonalizationAdapter.prototype.constants.storage.LOCAL_STORAGE:
                oLocalStorage = getLocalStorage();
                setTimeout(function () {
                    oLocalStorage.remove(that._sContainerKey); // delete in storage
                    that._oItemMap.entries = {}; // delete container local data
                    oDeferred.resolve();
                }, 0);
                break;
            case PersonalizationAdapter.prototype.constants.storage.MEMORY:
                setTimeout(function () {
                    if (oMemoryPersData && oMemoryPersData[that._sContainerKey]) {
                        delete oMemoryPersData[that._sContainerKey]; // delete in storage
                    }
                    that._oItemMap.entries = {}; // delete container local data
                    oDeferred.resolve();
                }, 0);
                break;
            default:
                setTimeout(function () {
                    oDeferred.reject("unknown storage type");
                }, 0);
        }
        return oDeferred.promise();
    };
    AdapterContainer.prototype.getItemKeys = function () {
        return this._oItemMap.keys();
    };
    AdapterContainer.prototype.containsItem = function (sItemKey) {
        return this._oItemMap.containsKey(sItemKey);
    };
    AdapterContainer.prototype.getItemValue = function (sItemKey) {
        return this._oItemMap.get(sItemKey);
    };
    AdapterContainer.prototype.setItemValue = function (sItemKey, oItemValue) {
        this._oItemMap.put(sItemKey, oItemValue);
    };
    AdapterContainer.prototype.delItem = function (sItemKey) {
        this._oItemMap.remove(sItemKey);
    };
    return AdapterContainer;
}, false);
