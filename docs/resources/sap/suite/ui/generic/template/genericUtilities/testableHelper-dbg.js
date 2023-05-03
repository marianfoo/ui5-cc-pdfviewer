sap.ui.define([	"sap/suite/ui/generic/template/genericUtilities/FeError"
], function(FeError) {
	"use strict";

/*
 * This class provides facilities that support unit testing. Note thate the class provides methods which have to be called in the productive code
 * and methods which have to be called in the test code.
 * 1. This class provides the facility to define private functions that are nevertheless accessible for unit tests.
 * More precisely: We consider it as best practice to define private methods of classes in a closure to prevent illegal use by
 * other classes.
 * Moreover, it is best practice to write unit tests for public methods.
 * However, sometimes a private method is used several times inside a class. Therefore, it is demanded to make this private method
 * accessible to unit tests.
 * Actually, making a private method accessible to unit tests has two aspects:
 * - Call this method directly in a unit test in order to test it
 * - Define a stub/spy for the private method in a unit test for another method in order to test that the private method is invoked correctly
 *   (and prevent the private method from being executed in the context of this test)
 *
 * Check method testable in order to find out, how a private method can be made accessible for unit tests.
 * Check method startTest in order to find out, how to access a private method (prepared this way) can be accessed in a unit test
 *
 * Note: When testing private methods it might also be necessary to access private attributes of the class. This can also be achieved using this class.
 * Just write a private function accessing the private attribute and make it accessible for unit tests via this class.
 *
 * 2. This class provides the possibility to spy or stub constructors of external classes (e.g. UI5).
 * Check method observableConstructor in order to find out, how this can be achieved.
 */

	var iTestMode = 0;
	var oPossessor;
	var mStartedApps = {};
	var iCount = 0;
	var oStaticFunctions = {};
	var aConstructors = [];
	var	sClassName = "genericUtilities.testableHelper";

	function createLogAccessFunction(oConstructor){
		return function(oInstance){
			if (iTestMode >= 0){
				return null;
			}
			var aLog = oConstructor.log || [];
			for (var i = 0; i < aLog.length; i++){
				var oLog = aLog[i];
				if (oLog.me === oInstance){
					return oLog.args;
				}
			}
		};
	}

	function removeConstructorObservation(oConstructor){
		delete oConstructor.replace;
		delete oConstructor.observer;
		if (oConstructor.log){
			if (oConstructor.isStatic){
				var aNewLog = [];
				for (var i = 0; i < oConstructor.log.length; i++){
					var oLog = oConstructor.log[i];
					if (oLog.testMode === 0){
						aNewLog.push(oLog);
					}
				}
				if (aNewLog.length > 0){
					oConstructor.log = aNewLog;
				} else {
					delete oConstructor.log;
				}
			} else {
				delete oConstructor.log;
			}
		}
	}

	function removeConstructorObservations(){
		aConstructors.forEach(removeConstructorObservation);
	}

	function fnObservableConstructor(fnConstructor, bStatic){
		var oConstructor;
		for (var i = 0; i < aConstructors.length; i++){
			oConstructor = aConstructors[i];
			if (oConstructor.fnConstructor === fnConstructor){
				oConstructor.isStatic = oConstructor.isStatic || bStatic;
				return oConstructor;
			}
		}
		oConstructor = {
			fnConstructor: fnConstructor,
			isStatic: bStatic
		};
		oConstructor.observable = function(){
			var fnConstructorEffective = oConstructor.replace ? oConstructor.observer : fnConstructor;
			var oRet = Object.create(fnConstructorEffective.prototype);
			oRet = fnConstructorEffective.apply(oRet, arguments) || oRet;
			if (iTestMode < 0 || (iTestMode === 0 && oConstructor.isStatic)){
				var oLog = {
					me: oRet,
					args: arguments,
					testMode: iTestMode
				};
				oConstructor.log = oConstructor.log || [];
				oConstructor.log.push(oLog);
				if (oConstructor.observer && !oConstructor.replace){
					oConstructor.observer(oRet, arguments);
				}
			}
			return oRet;
		};
		aConstructors.push(oConstructor);
		return oConstructor;
	}

	return {
	    // Call this method at the beginning of the setup of your unit test.
	    // This method returns a stub object. This stub possesses all functions prepared via testable as methods.
	    // Thereby, the name of the method is derived from the parameter sName of testable.
	    // Thus, when testing the private method just test the corresponding method of the stub.
	    // When defining a stub or spy for the private method, just define a stub or spy for the corresponding method of the stub object.
		startTest: function() {
			if (iTestMode !== 0) {
				return null;
			}
			iTestMode = -1;
			oPossessor = { };
			return oPossessor;
		},

        // Call this method at the end of the teardown of your unit test.
		endTest: function() {
			if (iTestMode < 0) {
				iTestMode = 0;
				oPossessor = null;
				removeConstructorObservations();
			}
		},

        // This method is called at the startup of a real app (in TemplateAssembler). If this method is called before startTest is called,
        // startTest has no effect anymore. Thus, private methods are not accessible in real tests.
		startApp: function() {
			if (iTestMode < 0) {
				return {};
			}
			iTestMode++;
			iCount++;
			var oRet = { id: iCount };
			mStartedApps[iCount] = oRet;
			return oRet;
		},

        // End the effect of startApp
		endApp: function(oAppId) {
			if (iTestMode > 0) {
			    var id = oAppId.id;
			    if (oAppId === mStartedApps[id]){
				    iTestMode--;
				    delete mStartedApps[id];
			    }
			}
		},

        // Use this method to define a private instance method that should be accessible to unit tests.
        // Parameter fnFunction is the implementation of the function that should be made accessible to unit tests.
        // Parameter sName is the name which can be used to access the function
        // This method returns a wrapper for fnFunction that should be used whereever the functionality of fnFunction is required.
		testable: function(fnFunction, sName) {
			if (iTestMode === -1) {
				oPossessor[sName] = oPossessor[sName] || fnFunction; //Do not overwrite a pre-set function
				return function() {
					return oPossessor[sName].apply(null, arguments);
				};
			}
			return fnFunction;
		},

		// Use this method to define a private static method that should be accessible to unit tests.
        // Parameter fnFunction is the implementation of the function that should be made accessible to unit tests.
        // Parameter sName is the name which can be used to access the function during tests. Note that this name must be unique for the whole project.
        // This method returns a wrapper for fnFunction that should be used whereever the functionality of fnFunction is required.
		testableStatic: function(fnFunction, sName){
		    if (iTestMode > 0 || (iTestMode === 0 && oStaticFunctions[sName])) {
		        return fnFunction;
		    }
		    oStaticFunctions[sName] = oStaticFunctions[sName] || fnFunction;
			return function() {
				return oStaticFunctions[sName].apply(null, arguments);
			};
		},

		// This method must only be used while a test is running (see method startTest). It returns a stub object that possesses all (static) methods
		// which have been defined via testableStatic.
		getStaticStub: function(){
			return iTestMode === -1 && oStaticFunctions;
		},


		// Use this method to make a constructor which is used in an implementation accessible for unit tests. This is in particular
		// important for constructors of classes belonging to other software packages (e.g. sap.m), since there is no other way to
		// spy/stub on these contructors.
		// As an example let us assume that a class provides a public method that produces instances of sap.ui.model.Filter (via constructor).
		// A unit test for this method can easily test whether the method really provides an instance of sap.ui.model.Filter.
		// However, a unit test should also be able to test, whether the Filter instance was created with the correct parameters.
		// In order to achieve this the class to be tested has to be enhanced as follows:
		// sap.ui.define([..., "sap/ui/model/Filter", ..."sap/suite/ui/generic/template/genericUtilities/testableHelper"],
		//      function(..., Filter, ..., testableHelper){        // normal declaration of dependency to sap.ui.model.Filter
		//
		//           Filter = testableHelper.observableConstructor(Filter);   // allow unit tests for this class to spy on constructor of Filter
		//
		// });
		// In the unit test use method observeConstructor (see below) in order to spy or stub the constructor
		// Normally only constructor calls that have been performed after a test was started can be spied via this facility. Sometimes constructors
		// are already called in order to define static members of the class to be tested. In these cases it is necessary to have also access to
		// these static calls. Therefore, parameter bStatic should be set to true in these cases.
		// However, note that this parameter should only be used if really necessary, as it produces additional effort at runtime, too.
		observableConstructor: function(fnConstructor, bStatic){
			if (iTestMode > 0){
				return fnConstructor;
			}
			return fnObservableConstructor(fnConstructor, bStatic).observable;
		},

		// This method must only be used while a test is running (see method startTest).
		// During tests this method provides access to instances created for constructor fnConstructor, provided the constructor has been
		// wrapped via method observableConstructor.
		// There are three way that access to these instances is possible:
		// 1. observeConstructor returns a function fnParameterAccess that provides access to the arguments that have been passed to
		//    the constructor when an instance was created. Call fnParameterAccess(oInstance) with oInstance being the instance that
		//    should be analyzed.
		// 2. Provide a spy function fnObserver that is called immediately after the instance was created. Two parameters are passed to fnObserver
		//    The first parameter is the newly created instance, the second parameter represents the arguments having been passed to the constructor
		// 3. If parameter bReplace is truthy fnObserver is actually treated as a stub for the constructor. That means that the real constructor
		//    is not called.
		// Note: There can always be only one observer for a constructor. Therefore, this method throws an exception when fnObserver is truthy and
		// another observer is already registered. Deregister an observer by calling this method with parameter fnObserver being faulty.
		// Moreover, all observers are automatically deregistered when a test ends.
		observeConstructor: function(fnConstructor, fnObserver, bReplace){
			if (iTestMode >= 0){
				return null;
			}
			var oConstructor = fnObservableConstructor(fnConstructor);
			if (fnObserver && oConstructor.observer){
				throw new FeError(sClassName, "Constructor is already observed");
			}
			oConstructor.observer = fnObserver;
			oConstructor.replace = fnObserver && bReplace;
			return createLogAccessFunction(oConstructor);
		}
	};
});
