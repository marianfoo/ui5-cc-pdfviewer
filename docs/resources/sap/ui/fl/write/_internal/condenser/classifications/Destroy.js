/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/write/_internal/condenser/Utils"],function(e){"use strict";return{addToReconstructionMap:function(n,t){return e.getContainerElementIds(t.targetContainer,t.targetAggregation).then(function(i){var r=e.getInitialUIContainerElementIds(n,t.targetContainer,t.targetAggregation,i);if(r.length-1<t.sourceIndex){while(r.length-1<t.sourceIndex){var o=r.length;r.splice(r.length,0,e.PLACEHOLDER+o)}r[t.sourceIndex]=t.affectedControl}else{r.splice(t.sourceIndex,0,t.affectedControl)}})},simulate:function(n,t,i){var r=n.indexOf(t.affectedControl);if(r===-1){var o=e.PLACEHOLDER+i.indexOf(t.affectedControl);r=n.indexOf(o)}if(r>-1){n.splice(r,1)}}}});
//# sourceMappingURL=Destroy.js.map