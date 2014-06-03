/*
 * Copyright (c) 2014, salesforce.com, inc.
 * All rights reserved.
 * Redistribution and use of this software in source and binary forms, with or
 * without modification, are permitted provided that the following conditions
 * are met:
 * - Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * - Neither the name of salesforce.com, inc. nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission of salesforce.com, inc.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

// Script to break up cordova.force.js into the individual js modules used by Cordova
// Usage: node script.js <path cordova.force.js> <path to put the js modules files in> <true|false wrap in cordova.define(...){... }>
//  e.g.: node script.js cordova.force.js www/com.salesforce/ true

var fs = require('fs');

var cordovaForcePath = process.argv[2];
var jsModulesPath = process.argv[3];
var addDefine = process.argv[4] == 'true';

fs.readFile(cordovaForcePath, 'utf8', function (err, data) { 
    var lines = data.split(/\n/);

    var copyrightVersionLines = [];
    var i = 0;

    // Copyright + Version
    while (i < lines.length) {
        line = lines[i++];
        copyrightVersionLines.push(line);

        var matchVersion = line.match(/var SALESFORCE_MOBILE_SDK_VERSION =/);
        if (matchVersion) {
            break;
        }
    }

    // Defines
    while (i < lines.length) {
        var moduleName = null;
        var currentFileName = null;
        var currentFileLines = [];
        while (i < lines.length) {
            line = lines[i++];

            // Done with block
            var matchEndDefine = line.match(/^\}\);/);
            if (matchEndDefine) {
                break;
            }

            // In block
            if (currentFileName != null) {
                currentFileLines.push(line.substring(4));
            }

            // Starting block
            var matchDefine = line.match(/cordova.define\("(.*)"/);
            if (matchDefine) {
                moduleName = matchDefine[1];
                currentFileName = moduleName + '.js';
                currentFileLines = copyrightVersionLines.slice(0); // clone
            }
        }
        if (currentFileName) {
            console.log('Creating ' + jsModulesPath + currentFileName);
            var fileContent = (addDefine ? "cordova.define(\"" + moduleName + "\", function(require, exports, module) {\n" : "") 
                + currentFileLines.join('\n') 
                + (addDefine ? "\n});" : "");

            fs.writeFile(jsModulesPath + currentFileName, fileContent, function (err) { 
                if (err) { 
                    console.log(err); 
                } 
            });
        }
    }

});
