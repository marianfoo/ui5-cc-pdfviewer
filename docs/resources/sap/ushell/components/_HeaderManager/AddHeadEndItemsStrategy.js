// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/base/Log"],function(e){"use strict";function t(t,n){var r=0,i,o;if(!t||!n){return false}var a=n.some(function(t){var n=!sap.ui.getCore().byId(t);if(n){e.warning("Failed to find control with id '{id}'".replace("{id}",t))}return n});if(a){return false}if(n.length===1&&n[0]==="endItemsOverflowBtn"){return true}for(i=0;i<t.length;i++){o=t[i];if(o!=="endItemsOverflowBtn"){r++}if(r+n.length>10){e.warning("maximum of six items has reached, cannot add more items.");return false}if(n.indexOf(o)>-1){return false}}return true}function n(e,t){var n=e.concat(t);var r={sf:-3,copilotBtn:-1,NotificationsCountButton:1,endItemsOverflowBtn:2,meAreaHeaderButton:3,productSwitchBtn:4};n.sort(function(e,t){var n=r[e]||0,i=r[t]||0;if(n===i){return e.localeCompare(t)}return n-i});return n}function r(e,r){var i=e;if(t(e,r)){i=n(e,r)}return i}return{execute:r}});
//# sourceMappingURL=AddHeadEndItemsStrategy.js.map