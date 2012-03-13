/*
 * Copyright (c) 2011, salesforce.com, inc.
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



if (!PhoneGap.hasResource("testrunner")) {

PhoneGap.addResource("testrunner");

var TestRunner = function () {
    SFHybridApp.logToConsole("new TestRunner");
	this.testSuiteClassName = null;
	this.testSuite = null;
};
 
// ====== Test and Suite setup ======

TestRunner.prototype.setTestSuite = function (suiteClassName) {
	if (this.testSuiteClassName !== suiteClassName) {
		SFHybridApp.logToConsole("TestRunner.setTestSuite: " + suiteClassName);
	    
		this.testSuiteClassName = suiteClassName;
		this.testSuite = new window[suiteClassName]();
	}
};

TestRunner.prototype.onReadyForTests = function (successCB, errorCB) {
    SFHybridApp.logToConsole("TestRunner.onReadyForTests");
    
    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.testrunner",
                  "onReadyForTests",
                  []
                  );                  
};

TestRunner.prototype.onTestComplete = function (testName, success, message, status, successCB, errorCB) {
    SFHybridApp.logToConsole("TestRunner.onTestComplete");

    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.testrunner",
                  "onTestComplete",
                  [{
                   "testName": testName, 
                   "success": success, 
                   "message": message, 
                   "testDuration": status.testDuration
                   }]
                  );
};


//======Plugin creation / installation ======
    
    
PhoneGap.addConstructor(function () {
        SFHybridApp.logToConsole("TestRunner pre-install");
         if (typeof navigator.testrunner === 'undefined') {
             SFHybridApp.logToConsole("TestRunner.install");
             navigator.testrunner = new TestRunner();
         }
});

}