/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/Change"],function(e){"use strict";var n="$sap.ui.fl.changes";function t(t){var r=t&&t.getEntry&&t.getEntry(n)&&t.getEntry(n).descriptor||[];return r.map(function(n){return new e(n)})}var r={applyChanges:function(e,n,t){return t.registry().then(function(e){var t=n.map(function(n){return e[n.getChangeType()]&&e[n.getChangeType()]()});return Promise.all(t)}).then(function(r){r.forEach(function(r,a){try{var s=n[a];e=r.applyChange(e,s);if(!r.skipPostprocessing&&s.getTexts()){e=t.processTexts(e,s.getTexts())}}catch(e){t.handleError(e)}});return e})},applyChangesIncludedInManifest:function(e,r){var a=t(e);var s=e.getJson();delete s[n];if(a.length>0){return this.applyChanges(s,a,r).then(function(){return})}return Promise.resolve()}};return r});
//# sourceMappingURL=Applier.js.map