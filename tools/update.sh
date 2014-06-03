#!/bin/bash

# Run update if you have made certain changes to this repo
# We check-in gen/ and dependencies/ because we don't want to require consumer of the repo to run npm install or grunt

if [ ! -d "tools" ]
then
    echo "You must run this tool from the root directory of your repo clone"
else
    echo "Updating dependencies"
    cd tools
    npm install .
    grunt
    cd ..
    echo "Splitting cordova.force.js"
    mkdir -p gen/plugins/com.salesforce
    mkdir -p gen/plugins_with_define/com.salesforce
    node tools/split.js libs/cordova.force.js gen/plugins/com.salesforce/ false
    node tools/split.js libs/cordova.force.js gen/plugins_with_define/com.salesforce/ true
fi
