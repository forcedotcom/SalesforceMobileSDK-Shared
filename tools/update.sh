#!/bin/bash

if [ ! -d "tools" ]
then
    echo "You must run this tool from the root directory of your repo clone"
else
    echo "Splitting cordova.force.js"
    node tools/split.js libs/cordova.force.js gen/plugins/ false
    node tools/split.js libs/cordova.force.js gen/plugins_with_define/ true
fi
