/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery"],function(jQuery){"use strict";var n={};n.waitTransition=function(n,e){if(!(n instanceof jQuery)){throw new Error("$element should be wrapped into jQuery object")}if(typeof e!=="function"){throw new Error("fnCallback should be a function")}return new Promise(function(i){n.one("transitionend",i);var r;var t=function(n){if(!r){r=n}if(n!==r){e()}else{window.requestAnimationFrame(t)}};window.requestAnimationFrame(t)})};return n},true);
//# sourceMappingURL=Animation.js.map