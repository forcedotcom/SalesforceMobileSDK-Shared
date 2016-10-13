/*
 * Copyright (c) 2016-present, salesforce.com, inc.
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
 *
 */
/**
 * 
 * Additional methods for force from force.js for file related operations
 * 
 * NB you need to include force.js before
 *
 */
var force = (function(force) {

    if (force === undefined) {
        throw new Error("You need to include force.js before force+files.js");
    }

    /*
     * Returns a page from the list of files owned by the specified user
     * @param userId a user id or 'me' - when null uses current user
     * @param page page number - when null fetches first page
     * @param successHandler
     * @param errorHandler
     */
    function ownedFilesList(userId, page, successHandler, errorHandler) {
        return force.request(
            {
                path:'/services/data/' + force.apiVersion + '/connect/files/users/' + (userId == null ? 'me' : userId),
                params: (page!=null ? {page:page} : {})
            },
            successHandler,
            errorHandler
        );
    }

    /*
     * Returns a page from the list of files from groups that the specified user is a member of
     * @param userId a user id or 'me' - when null uses current user
     * @param page page number - when null fetches first page
     * @param successHandler
     * @param errorHandler
     */
    function filesInUsersGroups(userId, page, successHandler, errorHandler) {
        return force.request(
            {
                path:'/services/data/' + force.apiVersion + '/connect/files/users/' + (userId == null ? 'me' : userId) +  '/filter/groups',
                params: (page!=null ? {page:page} : {})
            },
            successHandler,
            errorHandler
        );
     }

    /*
     * Returns a page from the list of files shared with the specified user
     * @param userId a user id or 'me' - when null uses current user
     * @param page page number - when null fetches first page
     * @param successHandler
     * @param errorHandler
     */
    function filesSharedWithUser(userId, page, successHandler, errorHandler) {
        return force.request(
            {
                path:'/services/data/' + force.apiVersion + '/connect/files/users/' + (userId == null ? 'me' : userId) +  '/filter/sharedwithme',
                params: (page!=null ? {page:page} : {})                
            },
            successHandler,
            errorHandler
        );
    }

    /*
     * Returns file details
     * @param fileId file's Id
     * @param version - when null fetches details of most recent version
     * @param successHandler
     * @param errorHandler
     */
    function fileDetails(fileId, version, successHandler, errorHandler) {
        return force.request(
            {
                path: '/services/data/' + force.apiVersion + '/connect/files/' + fileId,
                params: (version != null ? {versionNumber: version} : {})
            },
            successHandler,
            errorHandler
        );

    }

    /*
     * Returns file details for multiple files
     * @param fileIds file ids
     * @param successHandler
     * @param errorHandler
     */
    function batchFileDetails(fileIds, successHandler, errorHandler) {
        return force.request(
            {
                path: '/services/data/' + force.apiVersion + '/connect/files/batch/' + fileIds.join(',')
            },
            successHandler,
            errorHandler
        );
    }

    /**
     * Returns a page from the list of entities that this file is shared to
     *
     * @param fileId file's Id
     * @param page page number - when null fetches first page
     * @param successHandler
     * @param errorHandler
     */
    function fileShares(fileId, page, successHandler, errorHandler) {
        return force.request(
            {
                path: '/services/data/' + force.apiVersion + '/connect/files/' + fileId + '/file-shares',
                params: (page!=null ? {page:page} : {})                
            },
            successHandler,
            errorHandler
        );

    }

    /**
     * Adds a file share for the specified fileId to the specified entityId
     *
     * @param fileId file's Id
     * @param entityId Id of the entity to share the file to (e.g. a user or a group)
     * @param shareType the type of share (V - View, C - Collaboration)
     * @param successHandler
     * @param errorHandler
     */
    function addFileShare(fileId, entityId, shareType, successHandler, errorHandler) {
        return force.create("ContentDocumentLink",
                      {
                          ContentDocumentId:fileId,
                          LinkedEntityId:entityId,
                          ShareType:shareType},
                      successHandler,
                      errorHandler);
    }

    /**
     * Deletes the specified file share.
     * @param shareId Id of the file share record (aka ContentDocumentLink)
     * @param successHandler
     * @param errorHandler
     */
    function deleteFileShare(sharedId, successHandler, errorHandler) {
        return force.del("ContentDocumentLink",
                   sharedId,
                   successHandler,
                   errorHandler);
    }

    // The public API
    force.ownedFilesList = ownedFilesList;
    force.filesInUsersGroups = filesInUsersGroups;
    force.filesSharedWithUser =  filesSharedWithUser;
    force.fileDetails = fileDetails;
    force.batchFileDetails = batchFileDetails;
    force.fileShares = fileShares;
    force.addFileShare = addFileShare;
    force.deleteFileShare = deleteFileShare;

    return force;

})(window.force);
