/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/base/util/LoaderExtensions",
	"sap/base/i18n/ResourceBundle",
	"sap/base/util/includes"
], function (LoaderExtensions, ResourceBundle, includes) {
	"use strict";

	/**
	 * @class
	 * @alias sap.ui.integration.editor.EditorResourceBundles
	 * @author SAP SE
	 * @since 1.94.0
	 * @version 1.108.8
	 * @private
	 * @experimental since 1.94.0
	 * @ui5-restricted
	 */
	var EditorResourceBundles = (function () {

		var _aEditorResourceBundles,
			_aLanguageList,
			_sResourceBundleURL;
		LoaderExtensions.loadResource("sap/ui/integration/editor/languages.json", {
			dataType: "json",
			failOnError: false,
			async: true
		}).then(function (o) {
			_aLanguageList = o;
		});

		function init() {
			_aEditorResourceBundles = [];
			//according to the language list, load each resource bundle
			for (var p in _aLanguageList) {
				var oResourceBundleTemp;
				if (_sResourceBundleURL) {
					var aFallbacks = [p];
					if (p.indexOf("-") > -1) {
						aFallbacks.push(p.substring(0, p.indexOf("-")));
					}
					//add en into fallbacks
					if (!includes(aFallbacks, "en")) {
						aFallbacks.push("en");
					}
					oResourceBundleTemp = ResourceBundle.create({
						url: _sResourceBundleURL,
						async: false,
						locale: p,
						supportedLocales: aFallbacks
					});
				}
				_aEditorResourceBundles[p] = {"language": _aLanguageList[p], "resourceBundle": oResourceBundleTemp};
			}
			return _aEditorResourceBundles;
		}

		return {
			getResourceBundleURL: function() {
				return _sResourceBundleURL;
			},
			setResourceBundleURL: function(sResourceBundleURL) {
				_sResourceBundleURL = sResourceBundleURL;
			},
			getInstance: function () {
				if (!_aEditorResourceBundles) {
					_aEditorResourceBundles = init();
				}
				return _aEditorResourceBundles;
			}
		};

	})();

	return EditorResourceBundles;
});