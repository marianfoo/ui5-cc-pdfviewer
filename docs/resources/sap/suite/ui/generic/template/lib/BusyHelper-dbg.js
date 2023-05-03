sap.ui.define(["sap/ui/base/Object",
	"sap/suite/ui/generic/template/lib/MessageUtils",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/extend",
	"sap/base/util/isEmptyObject",
	"sap/suite/ui/generic/template/genericUtilities/FeError"
	], function(BaseObject, MessageUtils, testableHelper, FeLogger, extend, isEmptyObject, FeError) {
		"use strict";
		var	sClassName = "lib.BusyHelper";

	    var oFeLogger = new FeLogger(sClassName);
	    var oLogger = oFeLogger.getLogger();
	    var oLevel = oFeLogger.Level;
		// Class for busy handling
		// This class enables the notion of a 'busy session'.
		// More precisely: At each point in time the app is either in a busy session or is not.
		// Reasons for being in a busy session can be set by calling methods setBusy or setBusyReason (see below).
		// Note that each busy reason has a lifetime.
		// A new busy session is started, as soon as the two following two conditions are fulfilled:
		// - The app is currently not in a busy session
		// - There is at least one (living) busy reason
		// A busy session potentially ends when the number of living busy reasons is reduced to zero. However, the end of the busy session is
		// postponed until a navigation which is currently active has finished and the current thread execution has come to an end. When a new
		// busy reason has been set meanwhile (and is still alive) the busy session is prolonged accordingly.
		// The busy session is indicated by either placeholder screens or busy indicators, in cases like loading of a component or navigation
		// placeholder screens are shown, if the application has enabled placeholders. In other cases, a busy indicator is shown
		// Showing and unshowing of busy indicator will be handled by this class
		// Showing of placeholder will automatically done by UI5 as we have configured in the routingHelper class in method createTarget
		// Removing the placeholders are handled by Fe in controllerimplementation and iappstatehandler
		// 
		// in a busy session we can have more then one busy reason, which wants to show a busy indicator and placeholders respectively, in navigation scenarios to reach the components the 
		// busy reasons are handled in a way to not set physical busy indicator, and this is handled at the caller
		// in all other action scenarios, and navigations that occur as a result of CRUD actions within the object page, only busy indicators are shown.
		//
		// bStartsANavigationSession is used as a parameter in the setBusy and setBusyReason methods, indicates if the busy session is start of a navigation scenario
		// the value for this variable is set by the callers, that determine if the physical busy should be shown or not
		//
		// The following features are connected to a busy session:
		// - A busy indication is displayed while the app is in a busy session. This busy indication may either be displayed immediately or with the standard
		//   busy delay (can be parameterized when setting the busy reason)
		// - When a busy session starts all transient messages are removed from the Apps message model
		// - When a busy session ends all transient messages being contained in the message model are displayed to the user and removed from the message model
		// - It is possible to set parameters for a busy session (see parameter oSessionParams of setBusy and setBusyReason).
		//   oSessionParams may be an arbitrary object. However, currently only property actionLabel is evaluated. This may contain a human readable string
		//   that identifies the action that causes the busy session.
		// - the topics specified in oTemplateContract.mBusyTopics (see comment in class AppComponent for details) will be handled accordingly
		// Moreover, this class provides the possibility to interact with busy sessions/reasons (see methods isBusy and getUnbusy).
		function getMethods(oTemplateContract) {
			var iCount = 0;  // count the busy calls for debugging reasons
			var mBusyReasons = Object.create(null); // Maps currently living busy reasons of type string to a function that should be called when the reason is removed
			var bIsBusy = false; // is the app in a busy session
			var bBusyDirty = false; // is it already ensured that fnApplyBusy will be called
			var iBusyPromiseCount = 0; // number of currently living busy reasons of type Promise
			oTemplateContract.oNavigationHost.setBusyIndicatorDelay(0); // This is only a temporary solution .
			//var iBusyDelay = oTemplateContract.oNavigationHost.getBusyIndicatorDelay(); // standard busy delay of the App
			var oUnbusyPromise = Promise.resolve(); // a Promise which is resolved as soon as no busy session is running
			var fnUnbusyResolve = Function.prototype; // function to be called when the current busy session ends
			var oBusySessionParams = {}; // params of this busy session
			var bIsOnlyLogicalBusyNeeded; // holds the value that determines if a physical busy indicator should be shown
			
			// Returns information whether there is currently a living busy reason
			function isBusy(){
				return iBusyPromiseCount !== 0 || !isEmptyObject(mBusyReasons);
			}

			var fnApplyBusyImmediately; // declare here to avoid use before declaration. Function that calls fnApplyBusy with bImmediate = true.

			// This function has the following tasks:
			// - If a busy session is running but no busy reason is available -> end the busy session (and thus display transient messages)
			// - Is a busy session is running set the app to busy, otherwise set it to unbusy
			// Note that ending the busy session will be postponed if a navigation is currently active and parameter bImmediate is false.
			// In this case the busy session might be prolonged if a new busy reason is set in the meantime
			function fnApplyBusy(bImmediate) {
				var bIsBusyNew = isBusy();
				if (bIsBusyNew || bImmediate) {
					bBusyDirty = false;
					// app should be physically busy if it is logically busy and no placeholder is shown 
					var bPhysicalBusyState = bIsBusyNew && !bIsOnlyLogicalBusyNeeded;
					oTemplateContract.oNavigationHost.setBusy(bPhysicalBusyState);
					oLogger.info("Physical busy state has been changed to " + bPhysicalBusyState);
					if (bIsBusyNew !== bIsBusy) {
						bIsBusy = bIsBusyNew;
						if (!bIsBusy){ // end of a busy session
							//oTemplateContract.oNavigationHost.setBusyIndicatorDelay(iBusyDelay);
							var aActiveComponents = oTemplateContract && oTemplateContract.oNavigationControllerProxy && oTemplateContract.oNavigationControllerProxy.getActiveComponents();
							if (aActiveComponents){
								for (var iActiveComponent = 0; iActiveComponent < aActiveComponents.length; iActiveComponent++) {
									var sActiveComponent = aActiveComponents[iActiveComponent];
									if (!sActiveComponent) {
										continue;
									}
									var oController = oTemplateContract.componentRegistry && oTemplateContract.componentRegistry[sActiveComponent] && oTemplateContract.componentRegistry[sActiveComponent].oController;
									oController && oController.adaptTransientMessageExtension && oController.adaptTransientMessageExtension();
									}
								}
							// exchanging this Promise ensures that the popup for sending the transient messages will be shown before all other popups which are waiting for the busy session to be ended will be displayed
							oUnbusyPromise = Promise.resolve();
							var aTransientMessages = oTemplateContract.oApplicationProxy.getTransientMessages();
							var bHasEtagMessage = fnModifyETagMessagesOnly(aTransientMessages);
							var oRefreshActivePagesConfig = bHasEtagMessage ? {
								action: oTemplateContract.oViewDependencyHelper.setActivePagesToDirty,
								actionLabel: oTemplateContract.getText("ETAG_REFRESH_BUTTON")
							} : null;

							oUnbusyPromise = MessageUtils.handleTransientMessages(oTemplateContract, oBusySessionParams.actionLabel, oRefreshActivePagesConfig);
							oBusySessionParams = {};
							oUnbusyPromise.then(fnUnbusyResolve);
						}
					}
				} else { // postpone removal of busy indicator until navigation visualization is finished
					var oNavigationFinishedPromise = oTemplateContract.oNavigationObserver.getProcessFinished(true);
					oNavigationFinishedPromise.then(fnApplyBusyImmediately, fnApplyBusyImmediately);
				}
				
			}
			fnApplyBusyImmediately = fnApplyBusy.bind(null, true);
			
			// Ensure that method fnApplyBusy is called
			// If bImmediate is true the busy delay is temporarily set to 0 and fnApplyBusy is called synchronously.
			// Otherwise the call of fnApplyBusy is postponed until the current thread is finished.
			function fnEnsureApplyBusy(bImmediate) {
				if (bImmediate) {
					//oTemplateContract.oNavigationHost.setBusyIndicatorDelay(0);
					fnApplyBusy();
				} else if (!bBusyDirty) {
					bBusyDirty = true;
					setTimeout(fnApplyBusy, 0);
				}
			}

			// function to be called when any Promise that serves as a busy reason is settled
			function fnBusyPromiseResolved() {
				iBusyPromiseCount--;
				if (!iBusyPromiseCount) {
					fnEnsureApplyBusy(false);
				}
			}
			
			// function which modify e-Tag messages only.
			// returns : true, if any e-Tag message is modified, otherwise false.
			function fnModifyETagMessagesOnly(aTransientMessages) {
				var sEtagMessage = oTemplateContract.getText("ETAG_MESSAGE");
				var bMessagesModified = false;
				aTransientMessages.forEach(function(oMessage) {
					if (MessageUtils.isMessageETagMessage(oMessage)){
						bMessagesModified = true;
						oMessage.setMessage(sEtagMessage);
						// This is to ensure that no technical information is shown.
						oMessage.setDescription(undefined);
						oMessage.setDescriptionUrl(undefined);
					}
				});
				return bMessagesModified;
			}

			// this method is called when a busy reason is set. It starts a busy session unless the App is already in a busy session.
			function fnMakeBusy(bStartsANavigationSession, sMethod, oBusyEndedPromise, sReason){
				logSupportInfo(sMethod, oBusyEndedPromise, sReason);
				if (bIsBusy){
					return;  // App is already in a busy session
				}
				// Start a new busy session
				bIsBusy = true;
				bIsOnlyLogicalBusyNeeded = bStartsANavigationSession && oTemplateContract.bEnablePlaceholder;
				// All transient messages still being contained in the message model belong to previous actions.
				// Therefore, we remove them. If they have not been shown yet, it is anyway to late to show them when this busy session has ended.
				oTemplateContract.oApplicationProxy.removeTransientMessages();
				oTemplateContract.oApplicationProxy.deregisterForMessageNavigation(); // When starting a new busy session it does no longer wait for focussing on a message target
				fnPrepareUnbusyPromiseAndEnsureTopicHandling();
			}
			
			// Set instance variables oUnbusyPromise and fnUnbusyResolve and implement the 'busy topics' infrastructure
			function fnPrepareUnbusyPromiseAndEnsureTopicHandling(){
				var mBusyTopicsData = Object.create(null); // Maps topic to the beforeData for this topic
				for (var sTopic in oTemplateContract.mBusyTopics){ // fill mBusyTopicsData
					var oTopic = oTemplateContract.mBusyTopics[sTopic];
					mBusyTopicsData[sTopic] = (oTopic.getBeforeData || Function.prototype)();
				}
				oUnbusyPromise = new Promise(function(fnResolve){
					fnUnbusyResolve = function(){
						fnUnbusyResolve = Function.prototype;
						var aExecutors = []; // list of functions that should be called according to the registered topics (parameters already bound accordingly)
						for (var sTopic in oTemplateContract.mBusyTopics){ // build aExecutors
							var oTopicsData = mBusyTopicsData[sTopic];
							var oTopic = oTemplateContract.mBusyTopics[sTopic];
							var fnFallback = (oTopic.fallback || Function.prototype).bind(null, oTopicsData);
							aExecutors.push(oTopic.oneTimer ? oTopic.oneTimer.bind(null, oTopicsData, fnFallback) : fnFallback);
							delete oTopic.oneTimer;
						}
						aExecutors.forEach(function(fnExecute){ // execute the prepared functions
							fnExecute();
						});
						fnResolve(); // resolve oUnbusyPromise	
					};
				});								
			}

			function logSupportInfo(method, busyEndedPromise, reason) {
				if (!sap.ui.support) { // Only if support assistant is loaded
					return;
				}
				iCount++;
				var aStack = [],
					sCaller = "",
					sElementId = oTemplateContract.oNavigationHost.getId(),
					sType = "sap.suite.ui.generic.template.busyHandling";

				// Throw an error to get the caller from the stack
				try {
					throw new FeError(sClassName, "Get the stack");
				} catch (e) {
					aStack = e.stack.split(method, 2);
					if (aStack.length >= 2) {
						aStack = aStack[1].split("\n");
						aStack.shift();
					}
					if (aStack.length) {
						sCaller = aStack[0].trim();
					}
				}

				// Make sure that the log level for our "component" is at least INFO, so that the info messages with support info are logged
				if (oLogger.getLevel(sType) < oLevel.INFO) {
					oLogger.setLevel(oLevel.INFO, sType);
				}
				oLogger.info("busyHandling: " + method, reason + " called (count: " + iCount + ")", sType, function() {
					var oSupportInfo = {
						method: method,
						reason: reason,
						promise: busyEndedPromise,
						promisePending: true,
						caller: sCaller,
						callStack: aStack,
						elementId: sElementId,
						type: sType
					};
					function fnPromiseSettled() {
						oSupportInfo.promisePending = false;
					}
					oSupportInfo.promise.then(fnPromiseSettled, fnPromiseSettled);
					return oSupportInfo;
				});
			}

			// Sets or resets a busy reason of type string (parameter sReason).
			// Parameter bIsActive determines whether the busy reason is set or reset.
			// Note that resetting a reason applies to all living reasons using the same string (so calling this method with the same reason does not accumulate)
			// bImmediate is only evaluated when bIsActive is true. In this case it determines whether the busy indication should be displayed immediately or with
			// the usual delay.
			// oSessionParams (optional) can be used to set/overwrite additional params for the busy session. It is also only evaluated when bIsActive is true.
			// Note that it is preferred to use method setBusy to set a busy reason
			function setBusyReason(sReason, bIsActive, bImmediate, oSessionParams, bStartsANavigationSession) {
				if (bIsActive) {
					extend(oBusySessionParams, oSessionParams);
					if (!mBusyReasons[sReason]) {
						// Put a promise in the log and memorize the resolve function
						var oBusyEndedPromise = new Promise(function(resolve) { mBusyReasons[sReason] = resolve; });
						fnMakeBusy(bStartsANavigationSession, "setBusyReason", oBusyEndedPromise, sReason);
					}
				} else {
					if (mBusyReasons[sReason]) {
						mBusyReasons[sReason](); // support assistant: resolve promise
						delete mBusyReasons[sReason];
					}
				}
				fnEnsureApplyBusy(bIsActive && bImmediate);
			}

			// Sets a Promise (oBusyEndedPromise) as busy reason. This busy reason is alive until the promise is settled.
			// bImmediate determines whether the busy indication should be displayed immediately or with the usual delay.
			// oSessionParams (optional) can be used to set/overwrite additional params for the busy session.
			// Edge case: oBusyEndedPromise is already settled when this method is called (and the app is currently not in a busy session).
			// In this case, nevertheless a (probably short-living) busy session is started, such that the interaction with the message model is as defined above
			function setBusy(oBusyEndedPromise, bImmediate, oSessionParams, bStartsANavigationSession) {
				extend(oBusySessionParams, oSessionParams);
				iBusyPromiseCount++;
				fnMakeBusy(bStartsANavigationSession, "setBusy", oBusyEndedPromise, "");
				oBusyEndedPromise.then(fnBusyPromiseResolved, fnBusyPromiseResolved);
				fnEnsureApplyBusy(bImmediate);
			}

			function getBusyDelay() {
				//return iBusyDelay;
				return 0;
			}

			return {
				setBusyReason: setBusyReason,
				setBusy: setBusy,
				isBusy: isBusy,
				getUnbusy: function(){ // returns a Promise that is resolved as soon as the App is not in a busy session
					return oUnbusyPromise;
				},
				getBusyDelay: getBusyDelay
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.lib.BusyHelper", {
			constructor: function(oTemplateContract) {
				extend(this, (testableHelper.testableStatic(getMethods, "BusyHelper"))(oTemplateContract));
			}
		});
	});
