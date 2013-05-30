/*
 * Copyright (c) 2013, salesforce.com, inc.
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

// Helper module for parsing the command line arguments to our package front-end.

var readline = require('readline');
var outputColors = require('./outputColors');

var parseArgs = function(argsArray) {
    var argMap = {};
    for (var i = 0; i < argsArray.length; i++) {
        var fullArg = argsArray[i];
        var argSplitRegExp = /^--([^=]+)(=(.+))?$/;
        if (!argSplitRegExp.test(fullArg)) {
            throw new Error('Illegal argument: ' + fullArg);
        }
        var argName = fullArg.replace(argSplitRegExp, "$1");
        argName = argName.toLocaleLowerCase();
        var argVal = fullArg.replace(argSplitRegExp, "$3");
        argMap[argName] = argVal;
    }

    return argMap;
};
module.exports.parseArgs = parseArgs;

module.exports.requiredArgsPresent = function(argMap, argNamesArray) {
    var allRequiredArgsPresent = true;
    for (var i = 0; i < argNamesArray.length; i++) {
        var argNameObj = argNamesArray[i];
        var valueRequired = true;
        var argName;
        if (typeof argNameObj === 'string') {
            argName = argNameObj;
        } else {
            // Additional options for arg parsing.
            if (!validateExtendedArgObject(argNameObj)) {
                return false;
            }
            argName = argNameObj.name;
            valueRequired = argNameObj.valueRequired;
        }

        var argVal = argMap[argName];
        if (typeof argVal === 'undefined') {
            console.log('The required argument \'' + argName + '\' is not present.');
            allRequiredArgsPresent = false;
        } else if ((argVal === null || argVal.trim() === '') && valueRequired) {
            console.log('The argument \'' + argName + '\' requires a value.');
            allRequiredArgsPresent = false;
        }
    }
    
    return allRequiredArgsPresent;
};

function validateExtendedArgObject(arg) {
    if (typeof arg !== 'object') {
        console.log('Extended arg is not an object (' + (typeof arg) + ').');
        return false;
    }
    if (typeof arg.name !== 'string') {
        console.log('Extended arg\'s \'name\' property must be a string (currently \'' + (typeof arg.name) + '\').');
        return false;
    }
    if (arg.name.trim() === '') {
        console.log('Arg name cannot be empty.');
        return false;
    }
    if (typeof arg.valueRequired !== 'boolean') {
        console.log('Extended arg\'s \'valueRequired\' property must be a boolean (currently \'' + (typeof arg.valueRequired) + '\').');
        return false;
    }

    return true;
}

module.exports.processArgsInteractive = function(argsArray, argProcessorList, callback) {
    // Get any initial arguments from the command line.
    var argsMap = parseArgs(argsArray);

    processArgsInteractiveHelper(argsMap, argProcessorList, callback, 0);
};

var processArgsInteractiveHelper = function(argsMap, argProcessorList, callback, currentIndex) {
    if (currentIndex === argProcessorList.processorList.length)
        return callback(argsMap);

    var argProcessor = argProcessorList.processorList[currentIndex];
    var initialArgValue = argsMap[argProcessor.argName];
    processArgument(initialArgValue, argsMap, argProcessor, function(resultArgValue) {
        argsMap[argProcessor.argName] = resultArgValue;
        processArgsInteractiveHelper(argsMap, argProcessorList, callback, currentIndex + 1);
    })
};

var processArgument = function(argValue, argsMap, argProcessor, postProcessingCallback) {
    // NB: If argValue is undefined (i.e. no initial command line input), even for optional arguments the user must
    // be prompted at least once.
    var processingResult = null;
    if (typeof argValue !== 'undefined') {
        processingResult = argProcessor.processorFunction(argValue, argsMap);
        if (!(processingResult instanceof ArgProcessorOutput)) {
            throw new Error ('Expecting processing result of type ArgProcessorOutput.  Got \'' + (typeof processingResult) + '\'.');
        }
        if (processingResult.isValid) {
            if (typeof processingResult.replacementValue !== 'undefined') {
                return postProcessingCallback(processingResult.replacementValue);
            } else {
                return postProcessingCallback(argValue);
            }
        }
    }

    // Otherwise, arg value was either not present, or not valid.  If the user actually entered an invalid value, show the error prompt.
    if (processingResult && !processingResult.isValid) {
        if (typeof processingResult.message !== 'undefined') {
            console.log(outputColors.red + processingResult.message + outputColors.reset);
        } else {
            console.log(outputColors.red + 'Invalid value for \'' + argProcessor.argName + '\'.' + outputColors.reset);
        }
    }
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(argProcessor.inputPrompt + ' ', function(answer) {
        rl.close();
        processArgument(answer, argsMap, argProcessor, postProcessingCallback);
    });
};

var ArgProcessorList = function() {
    this.processorList = [];
};

ArgProcessorList.prototype.addArgProcessor = function(argName, inputPrompt, processorFunction) {
    var argProcessor = new ArgProcessor(argName, inputPrompt, processorFunction);
    this.processorList.push(argProcessor);
    return this;
};
module.exports.ArgProcessorList = ArgProcessorList;

var ArgProcessor = function(argName, inputPrompt, processorFunction) {
    if ((typeof argName !== 'string') || argName.trim() === '') {
        throw new Error('Invalid value for argName: \'' + argName + '\'.');
    }
    if ((typeof inputPrompt !== 'string') || (inputPrompt.trim() === '')) {
        throw new Error('Invalid value for inputPrompt: \'' + inputPrompt + '\'.');
    }
    if (typeof processorFunction !== 'function') {
        throw new Error('processorFunction should be a function.');
    }

    this.argName = argName;
    this.inputPrompt = inputPrompt;
    this.processorFunction = processorFunction;
};

var ArgProcessorOutput = function(isValid, messageOrReplacementValue) {

    // If an argument is valid (isValid == true), there won't need to be a message
    // assocated with it.  And if it's not valid, you wouldn't provide a replacement
    // value for it (at least in the workflow as defined—replacement values imply a
    // "valid" alternative argument value).  Hence the single second argument serving
    // two masters.  But we'll normalize the value for consumption.  NB: In either
    // use case, this argument can be optional.

    if (typeof isValid !== 'boolean') {
        throw new Error('isValid should be a boolean value.');
    }
    this.isValid = isValid;

    if (typeof messageOrReplacementValue !== 'undefined') {
        if (this.isValid)
            this.replacementValue = messageOrReplacementValue;
        else
            this.message = messageOrReplacementValue;
    }
};
module.exports.ArgProcessorOutput = ArgProcessorOutput;
