#!/bin/bash

#set -x

OPT_VERSION=""
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

usage ()
{
    echo "Use this script to set Mobile SDK version number in source files"
    echo "Usage: $0 -v <version>"
    echo "  where: version is the version e.g. 7.2.0"
}

parse_opts ()
{
    while getopts v:d: command_line_opt
    do
        case ${command_line_opt} in
            v)  OPT_VERSION=${OPTARG};;
        esac
    done

    if [ "${OPT_VERSION}" == "" ]
    then
        echo -e "${RED}You must specify a value for the version.${NC}"
        usage
        exit 1
    fi
}

# Helper functions
update_package_json ()
{
    local file=$1
    local version=$2
    gsed -i "s/\"version\":.*\"[^\"]*\"/\"version\": \"${version}\"/g" ${file}
}

update_cordova_plugins ()
{
    local file=$1
    local version=$2
    gsed -i "s/\"com.salesforce\":.*\"[^\"]*\"/\"com.salesforce\": \"${version}\"/g" ${file}
}

update_mock_sdk_info ()
{
    local file=$1
    local version=$2
    gsed -i "s/new\ SDKInfo(\"[^\"]*\"/new SDKInfo(\"${version}\"/g" ${file}
}

update_sdk_info_test_suite ()
{
    local file=$1
    local version=$2
    gsed -i "s/sdkInfo\.sdkVersion\.indexOf(\"[^\"]*\")/sdkInfo.sdkVersion.indexOf(\"${version}\")/g" ${file}
}

update_salesforce_mobile_sdk_version ()
{
    local file=$1
    local version=$2
    gsed -i "s/var\ SALESFORCE_MOBILE_SDK_VERSION = \"[^\"]*\"/var SALESFORCE_MOBILE_SDK_VERSION = \"${version}\"/g" ${file}
}

parse_opts "$@"

echo -e "${YELLOW}*** SETTING VERSION TO ${OPT_VERSION} ***${NC}"
echo "*** Updating package.json ***"
update_package_json "./package.json" "${OPT_VERSION}"

echo "*** Updating bower.json ***"
update_package_json "./tools/bower.json" "${OPT_VERSION}"

echo "*** Updating cordova_plugins.js ***"
update_cordova_plugins "./gen/cordova_plugins.js" "${OPT_VERSION}"

echo "*** Updating MockSDKInfo test ***"
update_mock_sdk_info "./test/MockSDKInfo.js" "${OPT_VERSION}"

echo "*** Updating SFSDKInfoTestSuite.js ***"
update_sdk_info_test_suite "./test/SFSDKInfoTestSuite.js" "${OPT_VERSION}"

echo "*** Updating SALESFORCE_MOBILE_SDK_VERSION ***"
update_salesforce_mobile_sdk_version "./test/SFTestRunnerPlugin.js" "${OPT_VERSION}"
update_salesforce_mobile_sdk_version "./libs/cordova.force.js" "${OPT_VERSION}"

echo "*** Updating generated plugin files ***"
./tools/update.sh
