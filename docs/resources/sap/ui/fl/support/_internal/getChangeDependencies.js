/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Component","sap/ui/fl/ChangePersistenceFactory","sap/ui/fl/apply/_internal/changes/FlexCustomData","sap/ui/fl/support/_internal/extractChangeDependencies","sap/ui/fl/Utils"],function(e,n,t,r,a){"use strict";return function(){return a.getUShellService("AppLifeCycle").then(function(t){var a;if(t){a=t.getCurrentApplication().componentInstance}else{var i=e.registry.filter(function(e){return e.getManifestObject().getRawJson()["sap.app"].type==="application"});if(i.length===1){a=i[0]}}if(a){var p=a.oContainer.getComponentInstance();var s=n.getChangePersistenceForControl(p);return r(s)}return{}})}});
//# sourceMappingURL=getChangeDependencies.js.map