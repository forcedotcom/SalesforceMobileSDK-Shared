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

cordova.define("salesforce/plugin/testrunner", function(require, exports, module) {
    // Version this js was shipped with
    var SDK_VERSION = "1.5";
    var SERVICE = "com.salesforce.testrunner";
    var exec = require("salesforce/util/exec").exec;

    // Private
    var _testSuiteClassName = null;
    var _testSuite = null;

    // ====== Test and Suite setup ======
    var setTestSuite = function (suiteClassName) {
	    if (_testSuiteClassName !== suiteClassName) {
		    console.log("TestRunner.setTestSuite: " + suiteClassName);
		    _testSuiteClassName = suiteClassName;
		    _testSuite = new window[suiteClassName]();
	    }
    };

    var onReadyForTests = function (successCB, errorCB) {
        console.log("TestRunner.onReadyForTests");
        exec(SDK_VERSION,
             successCB, errorCB, 
             SERVICE,
             "onReadyForTests",
             []
            );                  
    };

    var startTest =  function(testName) {
        console.log("TestRunner.startTest: " + testName);
        _testSuite.startTest(testName);
    };

    var onTestComplete = function (testName, success, message, status, successCB, errorCB) {
        console.log("TestRunner.onTestComplete: " + testName + ",success:" + success);
        exec(SDK_VERSION,
             successCB, errorCB, 
             SERVICE,
             "onTestComplete",
             [{
                 "testName": testName, 
                 "success": success, 
                 "message": message, 
                 "testDuration": status.testDuration
             }]
            );
    };

    module.exports = {
        setTestSuite: setTestSuite,
        onReadyForTests: onReadyForTests,
        startTest: startTest,
        onTestComplete: onTestComplete
    };
});

// For backward compatibility
navigator.testrunner = cordova.require("salesforce/plugin/testrunner");
