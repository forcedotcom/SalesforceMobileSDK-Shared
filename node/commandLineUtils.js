/*
 * Copyright (c) 2013-present, salesforce.com, inc.
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

/**
 * Parses an array of command line arguments, each of the form '--argName=argValue', or
 * optionally, '--argName'.
 *
 * @param {Array} argsArray The array of String arguments of the specified format.
 * @return A map in the form of { 'argName': 'argValue' [, ...] }
 */ 
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

/**
 * A method to process command line arguments interactively.  Any arguments that were not specified
 * on the command line will be prompted for on stdin, for the user to configure.
 *
 * @param {Array} argsArray The array of command line arguments (if any), of the form --argName=argValue, or --argName.
 * @param {ArgProcessorList} argProcessorList A list of arguments and their various processing characteristics.
 * @param {Function} callback The callback method to invoke once all arguments have been processed.
 */
var processArgsInteractive = function(argsArray, argProcessorList, callback) {
    // Get any initial arguments from the command line.
    var argsMap = parseArgs(argsArray);

    processArgsInteractiveHelper(argsMap, argProcessorList, callback, 0);
};

/**
 * (Recursive) helper function for processArgsInteractive.
 * @param argsMap A map of arguments in the form of { 'argName': 'argValue' [, ...] }.
 * @param {ArgProcessorList} argProcessorList A list of arguments and their various processing characteristics.
 * @param {Function} callback The callback method to invoke once all arguments have been processed.
 * @param {Number} currentIndex The index of the current argument being processed.
 */
var processArgsInteractiveHelper = function(argsMap, argProcessorList, callback, currentIndex) {
    if (currentIndex === argProcessorList.processorList.length)
        return callback(argsMap);

    var argProcessor = argProcessorList.processorList[currentIndex];
    var initialArgValue = argsMap[argProcessor.argName];

    // Arg preprocessors determine whether an arg should even be presented as an option.
    if (typeof argProcessor.preprocessorFunction === 'undefined') {
        // By default, process each argument.
        processArgument(initialArgValue, argsMap, argProcessor, function(resultArgValue) {
            argsMap[argProcessor.argName] = resultArgValue;
            processArgsInteractiveHelper(argsMap, argProcessorList, callback, currentIndex + 1);
        });
    } else {
        var shouldProcessArgument = argProcessor.preprocessorFunction(argsMap);
        if (shouldProcessArgument) {
            processArgument(initialArgValue, argsMap, argProcessor, function(resultArgValue) {
                argsMap[argProcessor.argName] = resultArgValue;
                processArgsInteractiveHelper(argsMap, argProcessorList, callback, currentIndex + 1);
            });
        } else {
            // If the user specified a value already, warn them that it won't be used.
            if (typeof initialArgValue !== 'undefined') {
                console.log(outputColors.yellow + 'WARNING: ' + outputColors.reset
                    + '\'' + argProcessor.argName + '\' is not a valid argument in this scenario, and its value will be ignored.');
                argsMap[argProcessor.argName] = undefined;
            }
            processArgsInteractiveHelper(argsMap, argProcessorList, callback, currentIndex + 1);
        }
    }
};

/**
 * Evaluates an argument value against its argument processor
 * @param {String} argValue The specified value of the argument.
 * @param argsMap A map of arguments in the form of { 'argName': 'argValue' [, ...] }.
 * @param {ArgProcessor} argProcessor The argument processor, used to evaluate the arg value.
 * @param {Function} postProcessingCallback The callback to invoke once a valid arg value has been determined.
 */
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

/**
 * Creates an instance of an ArgProcessorList.
 *
 * @constructor
 */
var ArgProcessorList = function() {
    this.processorList = [];
};

/**
 * Adds an ArgProcessor to the list of processors.
 *
 * @param {String} argName The name of the argument.
 * @param {String} inputPrompt The prompt to show the user, when interactively configuring the arg value.
 * @param {Function} processorFunction The function used to validate the arg value.
 * @param {Function} preprocessorFunction An optional function that can be used to determine whether the argument should be configured.
 * @return {ArgProcessorList} The updated ArgProcessorList, for chaining calls.
 */
ArgProcessorList.prototype.addArgProcessor = function(argName, inputPrompt, processorFunction, preprocessorFunction) {
    var argProcessor = new ArgProcessor(argName, inputPrompt, processorFunction, preprocessorFunction);
    this.processorList.push(argProcessor);
    return this;
};

/**
 * Creates an instance of the ArgProcessor object.
 *
 * @constructor
 * @param {String} argName The name of the argument.
 * @param {String} inputPrompt The prompt to show the user, when interactively configuring the arg value.
 * @param {Function} processorFunction The function used to validate the arg value.
 * @param {Function} preprocessorFunction An optional function that can be used to determine whether the argument should be configured.
 */
var ArgProcessor = function(argName, inputPrompt, processorFunction, preprocessorFunction) {
    if ((typeof argName !== 'string') || argName.trim() === '') {
        throw new Error('Invalid value for argName: \'' + argName + '\'.');
    }
    if ((typeof inputPrompt !== 'string') || (inputPrompt.trim() === '')) {
        throw new Error('Invalid value for inputPrompt: \'' + inputPrompt + '\'.');
    }
    if (typeof processorFunction !== 'function') {
        throw new Error('processorFunction should be a function.');
    }
    if ((typeof preprocessorFunction !== 'undefined') && (typeof preprocessorFunction !== 'function')) {
        throw new Error('If defined, preprocessorFunction should be a function.');
    }

    this.argName = argName;
    this.inputPrompt = inputPrompt;
    this.processorFunction = processorFunction;
    this.preprocessorFunction = preprocessorFunction;
};

/**
 * Creates an instance of the ArgProcessorOutput object, used to return the result of processing an arg value.
 *
 * @constructor
 * @param {Boolean} isValid Whether or not the arg value was a valid value.
 * @param {String} messageOrReplacementValue Optional value. If arg is not valid, a message explaining the failure.  If valid, an optional replacment value for the argument.
 */
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

// Exports

module.exports.parseArgs = parseArgs;
module.exports.ArgProcessorList = ArgProcessorList;
module.exports.processArgsInteractive = processArgsInteractive;
module.exports.ArgProcessorOutput = ArgProcessorOutput;
