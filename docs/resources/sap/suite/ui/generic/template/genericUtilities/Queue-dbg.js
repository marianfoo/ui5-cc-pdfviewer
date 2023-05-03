// This class provides a simple queue implementation

sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/ProcessObserver",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper"
], function(BaseObject, extend, ProcessObserver, testableHelper) {
		"use strict";

	function getMethods(oQueue) {
		var oDonePromise = Promise.resolve();
		var oStoppedObserver = new ProcessObserver(); // when this process is running the queue is stopped

		// Adds an entry to the queue.
		// Returns a Promise that
		// - stays pending if fnEntry is not executed or must not return a result according to the rules of the queue
		// - behaves like the Promise returned by fnEntry if fnEntry returns a Promise
		// - resolves to the result of fnEntry, if fnEntry does not return a Promise
		function addEntry(fnEntry){
			var fnExecute = function(){
				var oStopped = isStopped(); // if queue is stopped a Promise for restart, otherwise a faulty value
				var oExecuted = oStopped ? oStopped.then(fnExecute) : fnEntry();
				return (oExecuted instanceof Promise) ? oExecuted.then(function(oRet){ // if the execution is processed asynchronously, the result may come when the queue is stopped
					return oStoppedObserver.getProcessFinished(true).then(function(){
						return oRet;
					});	
				}, function(oError){
					return oStoppedObserver.getProcessFinished(true).then(function(){
						return Promise.reject(oError);
					});	
				}) : oExecuted;
			};
			oDonePromise = oDonePromise.then(fnExecute, fnExecute);
			return oDonePromise;
		}
		
		// Transforms a given function fnQueued into a function that puts the execution of fnQueued with given arguments and caller into the queue.
		// The transformed function will return a Promise which behaves like the return value of fnQueued, if fnQueued already returns a Promise.
		// Otherwise the returned Promise will resolve to the value returned by fnQueued.
		function fnMakeQueuable(fnQueued){
			return function(){
				var aArgs = arguments;
				var caller = this;
				var fnEntry = function(){
					return fnQueued.apply(caller, aArgs);
				};
				return addEntry(fnEntry);
			};
		}
		
		// A queue is either in the started or in the stopped state. The stopped state is the initial one.
		// In the started state all entries in the queue will be processed sequentially.
		// In the stopped state the queue still accepts new entries, but does not process entries until it is brought back to the started state.
		// An entry which is already executed when the queue is stopped will not be interrupted, but the result will be hold back until the queue is started again. 
		// For convenience the queue itself is returned.
		function setStartStop(bStart){
			oStoppedObserver[bStart ? "stopProcess" : "startProcess"]();
			return oQueue;
		}
		setStartStop(); // initial state is stopped
		
		// If the queue is in started state it returns a faulty value. If it is in stopped state it returns a Promise which resolves when it changes to the started state.
		function isStopped(){
			return oStoppedObserver.getProcessFinished(); 
		}
		
		return {
			addEntry: addEntry,
			makeQueuable: fnMakeQueuable,
			setStartStop: setStartStop,
			start: setStartStop.bind(null, true), // for convenience
			stop: setStartStop.bind(null, false), // for convenience
			isStopped: isStopped
		};
	}
	
	return BaseObject.extend("sap.suite.ui.generic.template.genericUtilities.Queue", {
		constructor: function() {
			extend(this, (testableHelper.testableStatic(getMethods, "Queue"))(this));
		}
	});
});