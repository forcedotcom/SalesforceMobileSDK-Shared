/*
 * Copyright (c) 2012, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * Build a function returning a promise from a function that takes a success and error callback as last arguments
 * The new function will take the same arguments as the original function minus the two callback functions
 */
if (typeof promiser === 'undefined') {

var promiser = function(object, methodName, noAssertionOnFailure) {
    var retfn = function () {
        console.log("In " + methodName);
        var self = this;
        var args = $.makeArray(arguments);
        var d = $.Deferred();
        args.push(function() {
            console.log(methodName + " succeeded");
            d.resolve.apply(d, arguments);
        });
        args.push(function() {
            console.log(methodName + " failed");
            //console.log("Failure-->" + JSON.stringify($.makeArray(arguments)));
            if (!noAssertionOnFailure) self.setAssertionFailed(methodName + " failed");
            d.reject.apply(d, arguments);
        });
        object[methodName].apply(object, args);
        return d.promise();
    };
    return retfn;
}

};

/**
 * SFTestStatus - Represents a particular test and its status information.
 */
if (typeof SFTestStatus === 'undefined') {

var SFTestStatus = function(testName) {
    this.testName = testName;
    this.testState = SFTestStatus.IDLE_TEST_STATE;
    this.successfulAssertions = 0;
    this.failedAssertions = 0;
    this.totalAssertions = 0;
	this.startTime = 0; //milliseconds since 1970
	this.endTime = 0; //milliseconds since 1970
	this.testDuration = 0; //milliseconds
};
    
SFTestStatus.IDLE_TEST_STATE = 'idle';
SFTestStatus.RUNNING_TEST_STATE = 'running';
SFTestStatus.FAIL_TEST_STATE = 'fail';
SFTestStatus.SUCCESS_TEST_STATE = 'success';

}

/**
 * SFTestModule - Represents a collection of tests.
 */
if (typeof SFTestModule === 'undefined') {

var SFTestModule = function(moduleName) {
    this.moduleName = moduleName;
    this.currentTestName = "";
    this.testStatusCollection = [];
    this.numTestsFinished = 0;
    this.numFailedTests = 0;
    this.numPassedTests = 0;
};

}

/**
 * A static collection of test modules, representing all of the test module runs
 * in a test application.
 */
if (typeof SFTestModuleCollection === 'undefined') {

var SFTestModuleCollection = {
    currentRunningModuleName: "",
    collection: []
};

}

/**
 * Abstract test suite
 * This file assumes that qunit.js has been previously loaded, as well as cordova.force.js.
 * To display results you'll need to load qunit.css.
 */
if (typeof SFTestSuite === 'undefined') {

/**
 * Constructor
 */
var SFTestSuite = function (moduleName) {
    // If module name is undefined, don't initialize the object.  Probably the inheritance
    // prototype call.
    if (typeof moduleName === 'undefined')
        return;
    
	this.module = new SFTestModule(moduleName);
    SFTestModuleCollection.collection[moduleName] = this.module;
	this.allTests = [];
};


/**
 * Method to run all the tests
 */
SFTestSuite.prototype.startTests = function() {
	console.log("In startTests");
	var self = this;

	//collect a list of testFoo methods by introspection
	for (var key in self) {
		//we specifically don't check hasOwnProperty here, to grab proto methods
		var val = self[key];
		if (typeof val === 'function') {
			if (key.indexOf("test") === 0 && (self.testsToRun == null || self.testsToRun.indexOf(key) >= 0)) {
				self.allTests.push(key);
                var testStatus = new SFTestStatus(key);
                self.module.testStatusCollection[key] = testStatus;
			}
		}
	}
	
	QUnit.init();
	QUnit.stop();//don't start running tests til they're all queued
	QUnit.module(self.module.moduleName);
    SFTestModuleCollection.currentRunningModuleName = self.module.moduleName;
	
	self.allTests.forEach(function(methName){
		console.log("Queueing: " + methName);
		QUnit.asyncTest(methName, function() {
			self.preRun(methName);
			self.runTest(methName);
		});
	});
	QUnit.start();//start qunit now that all tests are queued
	
};

/**
 * Method to run a single test
 */
SFTestSuite.prototype.startTest = function(methName) {
	console.log("In startTest: methName=" + methName);	
	var self = this;
	
	self.allTests.push(methName);
    var testStatus = new SFTestStatus(methName);
    self.module.testStatusCollection[methName] = testStatus;
	SFTestModuleCollection.currentRunningModuleName = self.module.moduleName;

	QUnit.init();
	QUnit.stop();//don't start running tests til they're all queued
	QUnit.module(this.module.moduleName);
	QUnit.asyncTest(methName, function() {
		self.preRun(methName);
		self.runTest(methName);
	});
    
	QUnit.start();//start qunit now that all tests are queued
};

/**
 * Method run before running a test
 */
SFTestSuite.prototype.preRun = function(methName) {
	console.log("In preRun: methName=" + methName);
	this.module.currentTestName = methName;
	var testStatus = this.module.testStatusCollection[methName];	
    testStatus.testState = SFTestStatus.RUNNING_TEST_STATE;
    testStatus.startTime = (new Date()).getTime();

}

/**
 * Method to run an actual test
 * Sub-classes should override this method if they need anything to be setup before running tests
 */
SFTestSuite.prototype.runTest = function (methName) {
	console.log("In runTest: methName=" + methName);
	this[methName]();
};

/**
 * Method to run after a test completes.
 *
 * Currently, this just unblocks QUnit to run the next test.  But other test clean-up logic could
 * go in here as well.
 */
SFTestSuite.prototype.finalizeTest = function() {
	var methName = this.module.currentTestName;
	console.log("In finalizeTest: methName=" + methName);

	var testStatus = this.module.testStatusCollection[methName];
	testStatus.endTime = (new Date()).getTime();
	testStatus.testDuration = testStatus.endTime - testStatus.startTime;

	//restart QUnit
    QUnit.start();
};
    
/**
 * Method called to report that the current test failed
 */
SFTestSuite.prototype.setAssertionFailed = function(error) {
	console.log("In setAssertionFailed: currentTestName=" + this.module.currentTestName + " , error=" + error);

    // navigator.testrunner.onTestComplete will be called back by QUnit.testDone
    
	// inform qunit that this test failed and unpause qunit
	QUnit.ok(false, error);
	QUnit.start();
};

/**
 * Method called to report that the current test succeeded
 */
SFTestSuite.prototype.setAssertionSuccess = function(message) {
    if (typeof message === 'undefined' || message === null)
        message = "";
    
	console.log("In setAssertionSuccess: currentTestName=" + this.module.currentTestName + ", message=" + message);

    // navigator.testrunner.onTestComplete will be called back by QUnit.testDone
	
	// unpause qunit
    QUnit.ok(true, message);
	QUnit.start();
};

/**
 * Method to test for the existence of a value in a collection.
 */
SFTestSuite.prototype.collectionContains = function(collection, value) {
    var foundValue = false;
    for (var key in collection) {
        if (value === collection[key]) {
            foundValue = true;
            break;
        }
    }
    if (foundValue) {
        this.setAssertionSuccess("Found '" + value + "' in collection.");
    } else {
        this.setAssertionFailed("Value '" + value + "' not found in collection.");
    }
};

/**
 * Called when a given test completes.
 */
QUnit.testDone = function(status) {
	var test = QUnit.config.current;
	var statsMsg = " failed: " + status.failed + " passed: " + status.passed;
	var countAssertions = test.assertions.length; 
	for (var i = 0; i < countAssertions; i++ ) {
		if (!test.assertions[i].result) {
			statsMsg += "\n" + (i+1) + "/" + countAssertions + ":" + test.assertions[i].message;
		}
	}
    console.log("testDone: " + status.name + statsMsg);
    
    var currentModuleName = SFTestModuleCollection.currentRunningModuleName;
    var currentModule = SFTestModuleCollection.collection[currentModuleName];
    var testStatus = currentModule.testStatusCollection[status.name];
    testStatus.successfulAssertions = status.passed;
    testStatus.failedAssertions = status.failed;
    testStatus.totalAssertions = status.total;
    if ((testStatus.failedAssertions > 0) || (testStatus.successfulAssertions === 0)) {
        testStatus.testState = SFTestStatus.FAIL_TEST_STATE;
        currentModule.numTestsFinished++;
        currentModule.numFailedTests++
        
        // let test runner know	
        if (navigator.testrunner) {
            navigator.testrunner.onTestComplete(status.name, false, statsMsg, testStatus);
        }
    } else {
        testStatus.testState = SFTestStatus.SUCCESS_TEST_STATE;    
        currentModule.numTestsFinished++;
        currentModule.numPassedTests++;
        
        if (navigator.testrunner) {
            navigator.testrunner.onTestComplete(status.name, true, "", testStatus);
        }
    }
};

/**
 * Called when a module of tests completes.
 */
QUnit.moduleDone = function(status) {
    console.log("In QUnit.moduleDone:");
    var testModule = SFTestModuleCollection.collection[SFTestModuleCollection.currentRunningModuleName];
    console.log("For module " + testModule.moduleName + ":");
    console.log("Tests finished: " + testModule.numTestsFinished);
    console.log("Tests passed: " + testModule.numPassedTests);
    console.log("Tests failed: " + testModule.numFailedTests);
    for (var testStatusName in testModule.testStatusCollection) {
        var testStatus = testModule.testStatusCollection[testStatusName];
        console.log("For test " + testStatus.testName + ":");
        console.log("Test state: " + testStatus.testState);
        console.log("Successful assertions: " + testStatus.successfulAssertions);
        console.log("Failed assertions: " + testStatus.failedAssertions);
        console.log("Total assertions: " + testStatus.totalAssertions);
        console.log(testStatus.testName + " completed in: " + (testStatus.testDuration/1000.0) + 's');

    }
};

}
