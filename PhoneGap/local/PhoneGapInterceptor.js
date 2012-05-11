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

/*
  PhoneGap Interceptor

  When running outside the container, include this file after the phonegap.js to prevent actual calls to the 
  non-existent container.
*/

// Block calls to container (they use javascript prompt on Android)
window.prompt = function(msg, arg) { 
    SFHybridApp.logToConsole("Called prompt with " + msg + ":" + arg); 
}

/**
  Call PhoneGap.completeInitalization() to finish initialization while outsite the container e.g.

    $(function() {
        //Add event listener
		document.addEventListener("deviceready", onDeviceReady,false);

        // Without a container, we have to do some of the initialization ourselves
        PhoneGap.completeInitalization();
    });
*/
PhoneGap.completeInitalization = function() {
    // Without a container, we have to do some of the initialization ourselves
    PhoneGap.Channel.join(function() { 
        PhoneGap.onPhoneGapInit.fire(); // run constructor
        PhoneGap.onDeviceReady.fire();  // done
    }, [ PhoneGap.onDOMContentLoaded ]);
};

/**
  Call PhoneGap.interceptExec to provide an alternative implementation for an container service/action
  @param service
  @param action
  @param func that should take three arguments successCB, errorCB, args

*/
PhoneGap.interceptors = {};
PhoneGap.interceptExec = function(service, action, func) {
    PhoneGap.interceptors[service + ":" + action] = func;
};

/**
   Overriding PhoneGap exec to call the functions registered with interceptExec
   @param successCB
   @param errorCB
   @param service
   @param action
   @param args
*/
PhoneGap.exec = function(successCB, errorCB, service, action, args) {
    SFHybridApp.logToConsole("PhoneGap.exec " + service + ":" + action);

    var found = false;
    var req = service + ":" + action;
    for (var key in PhoneGap.interceptors) {
        if (key === req) {
            PhoneGap.interceptors[key](successCB, errorCB, args);
            found = true;
            break;
        }
    }

    if (!found) {
        SFHybridApp.logToConsole("No mock for " + service + ":" + action);
        return;
    }
};
