// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([],function(){"use strict";return{getIndexOfGroup:n,getModelPathOfGroup:r};function r(r,u){var t=n(r,u);if(t<0){return null}return"/groups/"+t}function n(r,n){for(var u=0;u<r.length;u++){if(r[u].groupId===n){return u}}return-1}});
//# sourceMappingURL=GroupsHelper.js.map