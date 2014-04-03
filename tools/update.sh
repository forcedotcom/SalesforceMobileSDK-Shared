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
    node tools/split.js libs/cordova.force.js gen/plugins/ false
    node tools/split.js libs/cordova.force.js gen/plugins_with_define/ true
fi
