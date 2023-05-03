/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 */
(function () {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    function Plugin () {
      global.add('colorpicker', function () {
      });
    }

    Plugin();

}());
