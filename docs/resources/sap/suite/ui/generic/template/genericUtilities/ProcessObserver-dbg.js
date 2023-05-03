// This class provides the possibility to observe a process.
// More precisely it provides the possibility to find out whether a process is currently running.
// If this is the case one can register for a point in time when the process has stopped.
// When creating an instance of this class one of two possibilities must be used to define the lifecycle of the process to be observed:
// 1. Single process: A single process is defined by calling startProcess and stopProcess directly
//    For convenience it is also possible to register for events that inform about start resp. stop of this process.
// 2. Compound process: A compound process is built out of several processes.
//    It is considered to be running when at least one of the contained processes is running.

sap.ui.define([
	"sap/ui/base/Object",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/extend"
], function(BaseObject, FeLogger, extend) {
		"use strict";

	var oLog = new FeLogger("genericUtilities.ProcessObserver").getLogger();

		function getMethods(oSettings) {
			var oProcessFinishedPromise;	// If this is truthy, a process is running and oProcessFinishedPromise is a Promise that resolves when the process ends.
											// Moreover, the content of the variable remains unchanged until the process ends.
											// If the variable is faulty:
											// - For single processes the process is running
											// - For compound processes we actually do not know whether the process is running
			var fnProcessFinished; // truthy exactly if oProcessFinishedPromise is truthy. In this case it is the function that resolves that Promise.

			function fnProcessStart(){ // called when it is detected that a process is running.
				if (oSettings.processName){
					oLog.info("Process " + oSettings.processName + " started");
				}
				// If oProcessFinishedPromise is already truthy, we do not have to do anything. Otherwise create oProcessFinishedPromise.
				oProcessFinishedPromise = oProcessFinishedPromise || new Promise(function(fnResolve){
					fnProcessFinished = fnResolve;
				});
			}

			function fnProcessStop(){ // called when it is detected when a process is stopped
				if (oSettings.processName){
					oLog.info("Process " + oSettings.processName + " stopped");
				}
				// If oProcessFinishedPromise is already faulty, we do not have to do anything. Otherwise resolve oProcessFinishedPromise and make variable oProcessFinishedPromise faulty.
				if (oProcessFinishedPromise){
					fnProcessFinished(); // resolve oProcessFinishedPromise
					oProcessFinishedPromise = null; // set back variable oProcessFinishedPromise to faulty as the process is not running anymore
					fnProcessFinished = null;
				}
			}

			// Register event handlers for single processes
			if (oSettings.eventHandlers){
				oSettings.eventHandlers.attachProcessStart(fnProcessStart);
				oSettings.eventHandlers.attachProcessStop(fnProcessStop);
			}

			// This method is only called for compound processes.
			// It ensures that variable oProcessFinishedPromise is truthy exactly when the process is running.
			// Moreover, it ensures that we will not miss the end of the process if it is actually running.
			function fnHandleCompound(){
				// First we check whether any of the contained processes is currently running. Thereby, we stop as soon as we have found one.
				var oPromise = null;
				for (var i = 0; i < oSettings.processObservers.length && !oPromise; i++){
					var oProcessObserver = oSettings.processObservers[i];
					oPromise = oProcessObserver.getProcessFinished();
				}
				if (oPromise){ // At least one process contained in the compound process is running. oPromise will be resolved when this process is stopped.
					fnProcessStart(); // Ensure that oProcessFinishedPromise (and fnProcessFinished) are created if necessary
					oPromise.then(fnHandleCompound); // Ensure that we will check again at next chance
				} else { // no process is currently running
					fnProcessStop(); // ensure that oProcessFinishedPromise is resolved and set the variable to faulty
				}
			}

			// This is the method provided by this class.
			// It returns a faulty value, if the process is not currently running (resp. a resolved Promise if bAlwysReturnAPromise is true)
			// When the process is currently running it returns a Promise that is resolved as soon as the process is not running anymore.
			function getProcessFinished(bAlwysReturnAPromise){
				if (!oProcessFinishedPromise && oSettings.processObservers){ // this is the only case, in which we do not know whether oProcessFinishedPromise is already correct.
					fnHandleCompound(); // So we end this uncertainty
				}
				return oProcessFinishedPromise || (bAlwysReturnAPromise && Promise.resolve());
			}

			function addObserver(oObserver){
				oSettings.processObservers.push(oObserver);
			}

			return {
				startProcess: fnProcessStart, // must not be used for compound processes
				stopProcess: fnProcessStop, // must not be used for compound processes
				getProcessFinished: getProcessFinished,
				addObserver: addObserver // must only be called for compound processes
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.genericUtilities.ProcessObserver", {
			// Creates an instance of this class.
			// For single processes oSettings must be faulty or an object not not containing a property processObservers.
			// For convenience oSettings might contain a property eventHandlers. In this case this subobject must contain two functions
			// namely attachProcessStart and attachProcessStop which are used to attach to the start and the stop of the process.
			// For compound processes oSettings must contain a property processObservers which must be an array of ProcessObservers representing
			// the processes contained in the compound process.
			constructor: function(oSettings) {
				extend(this, getMethods(oSettings || {}));
			}
		});
	});
