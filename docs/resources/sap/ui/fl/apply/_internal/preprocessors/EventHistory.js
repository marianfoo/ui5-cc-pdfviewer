/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Core"],function(e){"use strict";var n=function(){};n._aEventIds=["ControlForPersonalizationRendered"];n._aUnsubscribedEventIds=[];n._oHistory={};n.start=function(){n._aEventIds.forEach(function(s){if(n._aUnsubscribedEventIds.indexOf(s)===-1){e.getEventBus().subscribe("sap.ui",s,n.saveEvent);n._oHistory[s]=[]}})};n.saveEvent=function(e,s,t){var r={channelId:e,eventId:s,parameters:t.getId()};if(n._oHistory[s]){var i=n._oHistory[s].some(function(e){return e.channelId===r.channelId&&e.eventId===r.eventId&&e.parameters===r.parameters});if(!i){n._oHistory[s].push(r)}}};n.getHistoryAndStop=function(s){e.getEventBus().unsubscribe("sap.ui",s,n.saveEvent);n._addUnsubscribedEvent(s);return n._oHistory[s]||[]};n._addUnsubscribedEvent=function(e){if(n._aUnsubscribedEventIds.indexOf(e)===-1){n._aUnsubscribedEventIds.push(e)}};return n});
//# sourceMappingURL=EventHistory.js.map