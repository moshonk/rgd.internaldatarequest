﻿var mainApp = angular.module('mainApp', ['ngRoute', 'ngSanitize', 'angularUtils.directives.dirPagination', 'ng-file-model', 'angular-flot', 'sp-peoplepicker', 'ng.httpLoader']);
mainApp.config(['$routeProvider', '$httpProvider', 'httpMethodInterceptorProvider', function ($routeProvider, $httpProvider, httpMethodInterceptorProvider) {
    $routeProvider.

    when('/addRequest', {
        templateUrl: 'addRequest.html',
        controller: 'AddRequestController'
    }).

    when('/editRequest/:requestIndex', {
        templateUrl: 'addRequest.html',
        controller: 'EditRequestController'
    }).

    when('/reviewRequest/:requestIndex', {
        templateUrl: 'reviewRequest.html',
        controller: 'ReviewRequestController'
    }).

    when('/releaseData/:requestIndex', {
        templateUrl: 'releaseData.html',
        controller: 'ReleaseDataController'
    }).

    when('/listRequests', {
        templateUrl: 'listRequests.html',
        controller: 'ListRequestsController'
    }).

    when('/dashboard', {
        templateUrl: 'dashboard.html',
        controller: 'DashboardController'
    }).

    when('/report', {
        templateUrl: 'report.html',
        controller: 'ReportController'
    }).

    otherwise({
        redirectTo: '/dashboard'
    });

    httpMethodInterceptorProvider.whitelistLocalRequests();

    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);

mainApp.service('fileService', [function (fileService) {
    var fileService = {};

    fileService.getFile = function (obj) {
        var file = {};
        if (obj.length == 2) {
            file = obj[0].files[0];
        }
        return file;
    }

    fileService.getFileBuffer = function (file) {
        var deferred = $.Deferred();
        var reader = new FileReader();
        reader.onload = function (e) {
            deferred.resolve(e.target.result);
        };
        reader.onerror = function (e) {
            deferred.reject(e.target.error);
        };
        reader.readAsArrayBuffer(file);
        return deferred.promise();
    }

    return fileService;
}]);

mainApp.factory('utilService', ['$log', '$q', function ($log, $q) {
    var utilService = {};
    //utility function to get parameter from query string
    utilService.getQueryStringParameter = function (urlParameterKey) {
        var params = document.URL.split('?')[1].split('&');
        var strParams = '';
        for (var i = 0; i < params.length; i = i + 1) {
            var singleParam = params[i].split('=');
            if (singleParam[0] == urlParameterKey)
                return singleParam[1];
        }
    };

    utilService.getPrincipalInvestigator = function (request) {

        var deferred = $q.defer();

        var selectedInvestigators = [];

        angular.forEach(request.principalInvestigatorObj, function (value, key) {

            selectedInvestigators.push(value.Email);

        });

        if (selectedInvestigators.length == 0) {

            deferred.resolve(-1);

        } else {

            utilService.ensureUser(selectedInvestigators[0]).then(function (userId) {

                deferred.resolve(userId);

            }, function (error) {

                alert('Unable to add PI');
                $log.error(error);
                deferred.reject('Unable to add PI. ' + error);
                return -1;

            });

        }

        return deferred.promise;
    };

    /**
    The ensureUser() function adds the selected user to this site if they don't exist and returns their user id
    =============================================================================================================*/
    utilService.ensureUser = function (user) {
        var deferred = $.Deferred();

        if (user == undefined) { //If user has not been provided, set the user id to -1.
            deferred.resolve(-1);
        }

        var context = SP.ClientContext.get_current();
        var newUser = context.get_web().ensureUser(user);
        context.load(newUser);

        context.executeQueryAsync(function () {
            deferred.resolve(newUser.get_id());
        },

        function (sender, args) {
            deferred.reject('Unable to Ensure User. Reason: ' + args.get_message());
        });

        return deferred.promise();
    }

    utilService.showSuccessMessage = function (domSelector, message) {
        $(domSelector).append($('<div/>', { id: 'myAlerts' }).addClass('alert alert-success').append(message));
        setTimeout(function () {
            $("#myAlerts").fadeTo(3000, 0).slideUp(500, function () {
                $(this).alert('close');
            });
        }, 2000);
    }

    return utilService;
}]);

mainApp.factory('crudService', ['$rootScope', '$q', '$http', '$log', '$window', 'utilService', function ($rootScope, $q, $http, $log, $window, utilService) {
    var crudService = {};

    crudService.appWebUrl = decodeURIComponent(utilService.getQueryStringParameter('SPAppWebUrl')).split('#')[0];
    crudService.hostWebUrl = decodeURIComponent(utilService.getQueryStringParameter('SPHostUrl')).split('#')[0];

    crudService.getListItems = function (listTitle, queryParams) {
        return $http({
            method: 'GET',
            url: crudService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + listTitle + '\')/Items?' + queryParams + '&@target=\'' + crudService.hostWebUrl + '\'',
            headers: { Accept: 'application/json;odata=verbose' }
        }).then(function sendResponseData(response) {
            return response.data.d;
        }).catch(function handleError(response) {
            $log.error('http request error: ' + response.status);
            return $q.reject('Error: ' + response.status);
        });
    };

    crudService.getListProperties = function (listTitle, queryParams) {
        return $http({
            method: 'GET',
            url: crudService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + listTitle + '\')?' + queryParams + '&@target=\'' + crudService.hostWebUrl + '\'',
            headers: { Accept: 'application/json;odata=verbose' }
        }).then(function sendResponseData(response) {
            return response.data.d;
        }).catch(function handleError(response) {
            $log.error('http request error: ' + response.status);
            return $q.reject('Error: ' + response.status);
        });
    };

    crudService.retrieveFormDigest = function () {
        var contextInfoUri = crudService.appWebUrl + '/_api/contextinfo?$select=FormDigestValue';
        var deferred = $q.defer();

        $http({
            url: contextInfoUri,
            method: "POST",
            headers: { "Accept": "application/json; odata=verbose" }
        }).then(function (response) {
            formDigestValue = response.data.d.GetContextWebInformation.FormDigestValue;
            deferred.resolve(formDigestValue);
        }).catch(function (response) {
            var errMsg = "Error retrieving the form digest value: "
		                + response.data.error.message.value;
            $log.error(errMsg);
            deferred.reject('Error: ' + response.status + '. ' + errMsg);
        });

        return deferred.promise;
    }

    crudService.retrieveETagValue = function (operationUri) {
        var deferred = $q.defer();

        $http({
            url: operationUri,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        }).then(function (response) {
            eTag = response.data.d.__metadata["etag"];
            deferred.resolve(eTag);
        }).catch(function (response) {
            $log.error(response);
            var errMsg = "Error retrieving ETag value: "
		                + response.data.error.message.value;
            $log.error(errMsg);
            deferred.reject('Error: ' + response.status + '. ' + errMsg);
        });

        return deferred.promise;
    };

    crudService.getListItemEntityTypeFullName = function (listName) {
        var deferred = $q.defer();
        crudService.getListProperties(listName, '$select=ListItemEntityTypeFullName').then(function (response) {
            deferred.resolve(response.ListItemEntityTypeFullName);
        });

        return deferred.promise;
    };

    crudService.createNewListItem = function (listTitle, bodyContent) {
        var operationUri = crudService.appWebUrl + "/_api/web/lists/GetByTitle('" + listTitle + "')/Items" + '?@target=\'' +  crudService.hostWebUrl + '\'';
        var deferred = $q.defer();
        crudService.retrieveFormDigest().then(function (formDigestValue) {
            $http({
                url: operationUri,
                method: "POST",
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "Content-Length": bodyContent.length,
                    "X-RequestDigest": formDigestValue,
                },
                data: bodyContent
            }).then(function (response) {
                deferred.resolve(response);
            }).catch(function (response) {
                var errMessage = "Error adding List Item '"
                    				+ response.data.error.message.value + "'";
                $log.error(errMessage)
                deferred.reject('Error: ' + response.status + '. ' + errMessage);
            })
        });

        return deferred.promise;
    }

    crudService.updateListItem = function (listTitle, itemId, bodyContent) {
        var operationUri = crudService.appWebUrl +
            "/_api/SP.AppContextSite(@target)/web/lists/GetByTitle('" + listTitle + "')/Items(" + itemId + ")" + '?@target=\'' + crudService.hostWebUrl + '\'';
        
        crudService.retrieveFormDigest().then(function (formDigestValue) {

            crudService.retrieveETagValue(operationUri).then(function (eTag) {

                // Invoke the real update operation
                $http({
                    url: operationUri,
                    method: "POST",
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "content-type": "application/json;odata=verbose",
                        "content-length": bodyContent.length,
                        "X-RequestDigest": formDigestValue,
                        "X-HTTP-Method": "MERGE",
                        "IF-MATCH": eTag
                    },
                    data: bodyContent
                }).then(function (response) {
                    return response;
                }).catch(function (response, errorCode, errorMessage) {
                    var errMsg = "Error updating list item: " + response.data.error.message.value;
                    $log.error(errMsg);
                    return $q.reject('Error: ' + response.status + '. ' + errorMessage);
                });
            })
        });
    }

    crudService.deleteListItem = function (listTitle, itemId, bodyContent) {
        var operationUri = crudService.appWebUrl + "/_api/SP.AppContextSite(@target)/web/lists/GetByTitle('" + listTitle + "')/Items(" + itemId + ")" + '?@target=\'' + crudService.hostWebUrl + '\'';;
        var deferred = $q.defer();

        crudService.retrieveFormDigest().then(function (formDigestValue) {
            crudService.retrieveETagValue(operationUri).then(function (eTag) {
                $http({
                    url: operationUri,
                    method: "POST",
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "content-type": "application/json;odata=verbose",
                        "X-RequestDigest": formDigestValue,
                        "X-HTTP-Method": "DELETE",
                        "IF-MATCH": eTag
                    }
                }).then(function (response) {
                    $log.info('Deleted successfully');
                    deferred.resolve(response);
                }).catch(function (response) {
                    var errMessage = "Error deleting item: '";
                    +response.data.error.message.value + "'";
                    deferred.reject('Error: ' + errMessage);
                });
            });
        });

        return deferred.promise;
    }

    return crudService;

}]);

mainApp.factory('shptService', ['$rootScope', '$http', '$filter', '$log', 'crudService', 'utilService', function ($rootScope, $http, $filter, $log, crudService, utilService) {
    var shptService = {};
    var dataRequestListName = 'InternalDataRequest';
    var dataRequestListTitle = 'Internal Data Request List';

    shptService.appWebUrl = decodeURIComponent(utilService.getQueryStringParameter('SPAppWebUrl')).split('#')[0];
    shptService.hostWebUrl = decodeURIComponent(utilService.getQueryStringParameter('SPHostUrl')).split('#')[0];

    /**
    form digest operations since we aren't using the SharePoint MasterPage
    =======================================================================*/
    var formDigest = null;
    shptService.ensureFormDigest = function (callback) {
        $http.post(shptService.appWebUrl + '/_api/contextinfo?$select=FormDigestValue', {}, {
            headers: {
                'Accept': 'application/json; odata=verbose',
                'Content-Type': 'application/json; odata=verbose'
            }
        }).success(function (d) {
            formDigest = d.d.GetContextWebInformation.FormDigestValue;
            callback(formDigest);
        }).error(function (er) {
            alert('Error getting form digest value');
        });
    };

    var requests = null;
    var currentUser = null;
    shptService.getRequests = function (callback) {
        if (requests != null) {
            callback(requests);
        } else {
            shptService.getCurrentUser(function (user) {
                currentUser = user;
                shptService.ensureFormDigest(function (fDigest) {
                    var filterString = "";
                    if (currentUser.permissions.review != true) {
                        filterString = '$filter=Author eq ' + currentUser.id
                    }
                    $http({
                        method: 'GET',
                        url: shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + dataRequestListTitle + '\')/Items?' +
                            '$select=Id,Created,DataUseDescription,DataDescription,ApprovedProtocolSSCNo,ApprovedProtocolTitle,PrincipalInvestigatorId,PrincipalInvestigator/Name,PrincipalInvestigator/EMail,PrincipalInvestigator/Title,AssociatedStudyTitle,AssociatedStudySSCNo,IntendedDataUse,EstDataUseEndDate,RequestStatus,RequestApprovalDate,RequestApproverId,RequestApproverComments,DataReleaseDate,DataReleaserId,DataReleaserComments,AgreeTermsAndConditions,ObjectivesCovered,RequestType,AuthorId,Author/Name,Author,Author/Title,Attachments,AttachmentFiles' +
                            '&$expand=Author,AttachmentFiles,PrincipalInvestigator' +
                             '&' + filterString + '&' +
                            '@target=\'' +
                            shptService.hostWebUrl + '\'',
                        headers: {
                            'Accept': 'application/json; odata=verbose'
                        }
                    }).success(function (d) {
                        requests = [];
                        $(d.d.results).each(function (i, e) {

                            //Setting up the people picker value
                            var principalInvestigatorObj = []; 
                            principalInvestigatorObj.push({
                                "Login": e['PrincipalInvestigator'].Name,
                                "Name": e['PrincipalInvestigator'].Title,
                                "Email": e['PrincipalInvestigator'].EMail
                            });

                            requests.push({
                                id: e['Id'],
                                //requestType: e['RequestType'],
                                requestDate: $filter('date')(e['Created'], 'yyyy-MM-dd'),
                                requestor: e['AuthorId'],
                                requestorName: e.Author.Title,
                                approvedProtocolSSCNo: e['ApprovedProtocolSSCNo'],
                                approvedProtocolTitle: e['ApprovedProtocolTitle'],
                                principalInvestigator: e['PrincipalInvestigatorId'],
                                principalInvestigatorObj: principalInvestigatorObj,
                                associatedStudySSCNo: e['AssociatedStudySSCNo'],
                                associatedStudyTitle: e['AssociatedStudyTitle'],
                                intendedDataUse: e['IntendedDataUse'],
                                dataUseDescription: e['DataUseDescription'],
                                dataDescription: e['DataDescription'],
                                estDataUseEndDate: $filter('date')(e['EstDataUseEndDate'], 'yyyy-MM-dd'),
                                requestStatus: e['RequestStatus'],
                                requestApprovalDate: $filter('date')(e['RequestApprovalDate'], 'yyyy-MM-dd'),
                                requestApproverName: e['RequestApprover'],
                                requestApproverId: e['RequestApproverId'],
                                requestApproverComments: e['RequestApproverComments'],
                                dataReleaseDate: $filter('date')(e['DataReleaseDate'], 'yyyy-MM-dd'),
                                dataReleaser: e['DataReleaser'],
                                dataReleaserId: e['DataReleaserId'],
                                dataReleaserComments: e['DataReleaserComments'],
                                agreeTermsAndConditions: e['AgreeTermsAndConditions'],
                                objectivesCovered: e['ObjectivesCovered'],
                                requestType: e['RequestType'],
                                attachments: e['Attachments'],
                                attachmentFiles: e['AttachmentFiles'],
                                labelCss: shptService.getLabelCss(e['RequestStatus']),
                            });
                            //console.log(e);
                        });
                        if (callback) callback(requests);
                    }).error(function (er) {
                        alert('Error: ' + er);
                        console.log(er);
                    });
                });
            });
        }
    };


    shptService.getLabelCss = function (requestStatus) {
        var statusClass = 'warning';
        if (requestStatus == 'Approved') {
            statusClass = 'primary';
        }
        else if (requestStatus == 'Data Released') {
            statusClass = 'success';
        }
        else if (requestStatus == 'Rejected') {
            statusClass = 'danger'
        }
        return statusClass;
    };

    var users = null;
    var dgcMembersGroupId = 7;
    shptService.getUsers = function (callback) {
        if (users != null) {
            callback(users);
        } else {
            $http({
                method: 'GET',
                url: shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/Web/sitegroups(' + dgcMembersGroupId + ')/users?$expand=groups&@target=\'' + shptService.hostWebUrl + '\'',
                headers: {
                    'Accept': 'application/json; odata=verbose'
                }
            }).success(function (d) {
                var users = [];
                $(d.d.results).each(function (i, e) {
                    users.push({
                        id: e['Id'],
                        username: e['LoginName'].split('|')[1],
                        displayName: e['Title'],
                        groups: e['Groups'].results
                    });
                });

                callback(users);
            }).error(function (error) {
                alert('An error occurred while fetching the user list ' + error);
                //console.log(error)
            });
        }
    };

    var currentUser = null;
    shptService.getCurrentUser = function (callback) {
        if (currentUser != null) {
            callback(currentUser);
        }
        else {
            $http({
                method: 'GET',
                url: shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/Web/CurrentUser?$expand=groups&@target=\'' + shptService.hostWebUrl + '\'',
                headers: {
                    'Accept': 'application/json; odata=verbose'
                }
            }).success(function (d) {
                var user = {};
                user.username = d.d.LoginName.split('|')[1];
                user.displayName = d.d.Title;
                user.id = d.d.Id;
                user.groups = d.d.Groups.results;
                var permissions = {};
                permissions.review = shptService.userExistInGroup(user, 'Coordinators,DGC Members');
                permissions.releaseData = shptService.userExistInGroup(user, 'Data Managers');
                user.permissions = permissions;
                callback(user);
            }).error(function (err) {
                alert('An error occured while fetching the current user' + err);
                //console.log(err);
            });
        }
    }

    shptService.userExistInGroup = function (user, groupName) {
        var userInGroup = false;
        $.each(user.groups, function () {
            if (groupName.indexOf(this.LoginName) > -1) {
                userInGroup = true;
                return false; //break from $each iteration
            }
        });
        return userInGroup;
    }

    shptService.getUserById = function (id) {
        var user = {};
        //ensure form digest
        shptService.ensureFormDigest(function (fDigest) {
            $http({
                Method: 'GET',
                url: shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/GetUserById(' + id + ')?@target=\'' +
                shptService.hostWebUrl,
                headers: { "Accept": "application/json; odata=verbose" }
            }).success(function (d) {
                user.id = id,
                user.displayName = d.d.title;
                user.username = d.d.LoginName.split('|')[1];
                return (user);
            }).error(function (err) {
                alert("An error occured while fetching user information" + err);
            });
        });

    };

    shptService.addRequest = function (request, callback) {
        
        shptService.getCurrentUser(function (user) {

            request.requestorName = user.displayName;

            shptService.ensureFormDigest(function (fDigest) {
                $http.post(
                    shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + dataRequestListTitle + '\')/items?@target=\'' +
                shptService.hostWebUrl + '\'',
                    {
                        'Title': request.requestorName + ' New Data Request',
                        'RequestType': request.requestType,
                        'DataUseDescription': request.dataUseDescription,
                        'DataDescription': request.dataDescription,
                        'ApprovedProtocolSSCNo': request.approvedProtocolSSCNo,
                        'ApprovedProtocolTitle': request.approvedProtocolTitle,
                        'ApprovedProtocolDate': request.approvedProtocolDate,
                        'PrincipalInvestigatorId': request.principalInvestigator,
                        'AssociatedStudyTitle': request.associatedStudyTitle,
                        'AssociatedStudySSCNo': request.associatedStudySSCNo,
                        'IntendedDataUse': request.intendedDataUse,
                        'EstDataUseEndDate': request.estDataUseEndDate,
                        'RequestStatus': request.requestStatus,
                        'ObjectivesCovered': request.objectivesCovered,
                        'RequestType': request.requestType,
                        'RequestorId': request.requestor,
                        'RequestDate': request.requestDate,
                        'AgreeTermsAndConditions': request.agreeTermsAndConditions,
                        '__metadata': { 'type': shptService.getItemTypeForListName(dataRequestListName) }
                    },
                    {
                        headers: {
                            'Accept': 'application/json; odata=verbose',
                            'Content-type': 'application/json; odata=verbose',
                            'X-RequestDigest': fDigest
                        }
                    }
                    ).success(function (d) {
                        request.id = d.d.ID;
                        request.requestDate = $filter('date')(d.d.Created, 'yyyy-MM-dd');
                        request.requestor = d.d.AuthorId;
                        shptService.getCurrentUser(function (user) {
                            request.requestorName = user.displayName;
                        });

                        if (request.attachment) {
                            shptService.uploadFileToList(request, dataRequestListTitle).then(function () {
                                console.log(request);
                            });
                        }

                        requests.push(request);

                        if (callback) callback();
                    }).error(function (er) {
                        alert("Error while adding request " + er);
                        console.log(er);
                    });
            });

        });

    };

    shptService.editRequest = function (request, callback) {
        //ensure form digest
        shptService.ensureFormDigest(function (fDigest) {
            $http.post(
                shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + dataRequestListTitle + '\')/items(' + request.id + ')?@target=\'' +
                shptService.hostWebUrl + '\'',
                {
                    'RequestType': request.requestType,
                    'DataUseDescription': request.dataUseDescription,
                    'DataDescription': request.dataDescription,
                    'ApprovedProtocolSSCNo': request.approvedProtocolSSCNo,
                    'ApprovedProtocolTitle': request.approvedProtocolTitle,
                    'ApprovedProtocolDate': request.approvedProtocolDate,
                    'PrincipalInvestigatorId': request.principalInvestigator,
                    'AssociatedStudyTitle': request.associatedStudyTitle,
                    'AssociatedStudySSCNo': request.associatedStudySSCNo,
                    'IntendedDataUse': request.intendedDataUse,
                    'EstDataUseEndDate': request.estDataUseEndDate,
                    'RequestStatus': request.requestStatus,
                    'ObjectivesCovered': request.objectivesCovered,
                    'RequestType': request.requestType,
                    'RequestorId': request.requestor,
                    'RequestDate': request.requestDate,
                    'AgreeTermsAndConditions': request.agreeTermsAndConditions,
                    '__metadata': { 'type': shptService.getItemTypeForListName(dataRequestListName) }
                },
                {
                    headers: {
                        'Accept': 'application/json; odata=verbose',
                        'Content-Type': 'application/json; odata=verbose',
                        'X-RequestDigest': fDigest,
                        'X-Http-method': 'MERGE',
                        'IF-MATCH': '*'
                    }
                }
                ).success(function (d) {
                    if (request.principalInvestigator != null) {
                        shptService.updateTaskAssignee(request);
                    }

                    if (request.attachment) {
                        shptService.uploadFileToList(request, dataRequestListTitle).then(function (data) {
                            if (requests != null) {
                                $(requests).each(function (i, o) {
                                    if (o.id === request.id) {
                                        requests[i] = request;
                                        return false;
                                    }
                                });
                            }
                        });
                    }
                    callback(request);
                }).error(function (er) {
                    alert('An error occured while updating the request: ' + er);
                    console.log(er);
                });
        });
    };

    shptService.uploadFileToList = function (request, listName) {
        var deferred = $.Deferred();
        var file = request.attachment;
        /*$log.info(file);
        $log.info();*/
        shptService.ensureFormDigest(function (fDigest) {
            shptService.getFileBuffer(file).then(function (buffer) {
                var bytes = new Uint8Array(buffer);
                var binary = '';
                for (var b = 0; b < bytes.length; b++) {
                    binary += String.fromCharCode(bytes[b]);
                }

                $http({
                    url: shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + listName + '\')/items(' + request.id + ')/AttachmentFiles/add(FileName=\'' + file.name.replace("'","\'") + '\')?@target=\'' +
                    shptService.hostWebUrl + '\'',
                    method: 'POST',
                    binaryStringRequestBody: true,
                    data: buffer,
                    processData: false,
                    transformRequest: angular.identity,
                    headers: {
                        'Accept': 'application/json; odata=verbose',
                        'Content-type': 'application/json; odata=verbose',
                        'Content-length': buffer.bytelength,
                        'X-RequestDigest': fDigest
                    }
                }).success(function (data) {
                    request.attachments = true;
                    shptService.getListAttachment(request, listName).then(function (request) {
                        deferred.resolve(request);
                    });
                }).error(function (err) {
                    alert('An error occurred: ' + file.name + ' not uploaded');
                    console.log(err);
                    deferred.reject(err);
                });

            });
        });

        return deferred.promise();
    }

    shptService.getListAttachment = function (request, listName) {
        var deferred = $.Deferred();

        $http({
            url: shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + listName + '\')/items(' + request.id + ')/AttachmentFiles/?@target=\'' +
            shptService.hostWebUrl + '\'',
            method: 'GET',
            headers: {
                'Accept': 'application/json; odata=verbose',
                'Content-type': 'application/json; odata=verbose',
            }
        }).success(function (data) {
            request.attachments = true;
            request.attachmentFiles = data.d;

            deferred.resolve(request);
        }).error(function (err) {
            alert('An error occurred while fetching attachment');
            console.log(err);
            deferred.reject(err);
        });

        return deferred.promise();
    };

    shptService.removeListAttachment = function (request, callback) {

        shptService.ensureFormDigest(function (fDigest) {

            $http({
                url: shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + dataRequestListTitle + '\')/items(' + request.id + ')/AttachmentFiles/getbyFileName(\'' + request.attachmentFiles.results[0].FileName + '\')/?@target=\'' +
                shptService.hostWebUrl + '\'',
                method: 'POST',
                data: {
                    '__metadata': { 'type': shptService.getItemTypeForListName(dataRequestListName) }
                },
                headers: {
                    'Accept': 'application/json; odata=verbose',
                    /*'Content-type': 'application/json; odata=verbose',*/
                    'X-HTTP-method': 'DELETE',
                    'X-RequestDigest': fDigest
                }
            }).success(function (data) {
                request.attachments = false;
                callback(request);
            }).error(function (err) {
                alert('An error occurred while fetching attachment');
                console.log(err);
                callback(err);
            });

        });

    };

    shptService.getFileBuffer = function (file) {
        var deferred = $.Deferred();
        var reader = new FileReader();
        reader.onload = function (e) {
            deferred.resolve(e.target.result);
        };
        reader.onerror = function (e) {
            deferred.reject(e.target.error);
        };
        reader.readAsArrayBuffer(file);
        return deferred.promise();
    }

    shptService.updateRequestStatus = function (request, callback) {
        //Ensure form digest
        shptService.ensureFormDigest(function (fDigest) {
            $http.post(
                    shptService.appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists/getByTitle(\'' + dataRequestListTitle + '\')/items(' + request.id + ')?@target=\'' +
                    shptService.hostWebUrl + '\'',
                    {
                        'RequestStatus': request.requestStatus,
                        'RequestApproverId': request.requestApproverId,
                        'RequestApproverComments': request.requestApproverComments,
                        'RequestApprovalDate': request.requestApprovalDate,
                        'DataReleaserId': request.dataReleaserId,
                        'DataReleaseDate': request.dataReleaseDate,
                        'DataReleaserComments': request.dataReleaserComments,
                        '__metadata': { 'type': shptService.getItemTypeForListName(dataRequestListName) }
                    },
                    {
                        headers: {
                            'Accept': 'application/json; odata=verbose',
                            'Content-Type': 'application/json; odata=verbose',
                            'X-RequestDigest': fDigest,
                            'X-Http-Method': 'MERGE',
                            'IF-MATCH': '*'
                        }
                    }
                ).success(function (d) {
                    console.log(request);
                    request.labelCss = shptService.getLabelCss(request.requestStatus);
                    callback(request);
                }).error(function (err) {
                    alert('Unable to update data request status: ' + err);
                    console.log(err);
                    console.log(request);
                });
        });
    };

    shptService.getItemTypeForListName = function (name) {
        return "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1) + "ListItem";
    };

    shptService.updateTaskAssignee = function (request) {
        var taskId = -1;

        crudService.getListItems('Workflow Tasks', '$select=*&$orderBy=ID desc&$filter=PercentComplete eq 0').then(function (data) {
            //Retrieve the task Id for the task associated with this Item
            
            $.each(data.results, function (key, value) {
                var relatedItems = JSON.parse(value.RelatedItems)
                var relatedItemId = relatedItems[0].ItemId;
                if (relatedItemId == request.id) {
                    taskId = value.Id;
                    return false;
                }

            });

        }).then(function () {
            if (taskId > -1) {
                var userIds = [request.principalInvestigator];
                crudService.getListItemEntityTypeFullName('Workflow Tasks').then(function (listItemEntityTypeFullName) {
                    var data = {
                        'AssignedToId': { 'results': userIds },
                        '__metadata': { 'type': listItemEntityTypeFullName }
                    };
                    crudService.updateListItem('Workflow Tasks', taskId, JSON.stringify(data));
                });
            }
        });
    }

    return shptService;
}]);

mainApp.controller('AddRequestController', ["$scope", "$location", "shptService", "utilService", function ($scope, $location, shptService, utilService) {

    $scope.saveRequest = function () {

        var readyToContinue = false;
        var ayncProcessFailed = false;

        utilService.getPrincipalInvestigator($scope.request).then(function (userId) {
            if (userId > -1) {
                $scope.request.principalInvestigator = userId;
            }

            shptService.getCurrentUser(function (user) {
                shptService.addRequest({
                    requestType: $scope.request.requestType,
                    dataUseDescription: $scope.request.dataUseDescription,
                    dataDescription: $scope.request.dataDescription,
                    requestor: user.id,
                    requestDate: (new Date().toISOString()),
                    approvedProtocolSSCNo: $scope.request.approvedProtocolSSCNo,
                    approvedProtocolTitle: $scope.request.approvedProtocolTitle,
                    principalInvestigator: $scope.request.principalInvestigator,
                    principalInvestigatorObj: $scope.request.principalInvestigatorObj,
                    associatedStudyTitle: $scope.request.associatedStudyTitle,
                    associatedStudySSCNo: $scope.request.associatedStudySSCNo,
                    approvedProtocolDate: $scope.request.approvedProtocolDate,
                    intendedDataUse: $scope.request.intendedDataUse,
                    estDataUseEndDate: $scope.request.estDataUseEndDate,
                    attachment: $scope.request.attachment,
                    objectivesCovered: $scope.request.objectivesCovered,
                    agreeTermsAndConditions: $scope.request.agreeTermsAndConditions,
                    requestStatus: 'Pending',
                    labelCss: shptService.getLabelCss('Pending')
                }, function () {
                    utilService.showSuccessMessage('#notification-area', 'Request Added Successfully!');
                });

                $location.path("/listRequests");
            });

        });
       
    };

    $scope.cancel = function () {
        $location.path("/listRequests");

    }

    $scope.appWebUrl = shptService.appWebUrl;

}]);

mainApp.controller('EditRequestController', ['$scope', '$location', '$routeParams', 'shptService', 'utilService', function ($scope, $location, $routeParams, shptService, utilService) {

    var requestIndex = parseInt($routeParams.requestIndex);
    shptService.getRequests(function (data) {
        $(data).each(function (i, e) {
            if (e.id === requestIndex) {
                $scope.request = e;
                return false;
            }
        });
    });

    $scope.saveRequest = function () {
        utilService.getPrincipalInvestigator($scope.request).then(function (userId) {

            if (userId > -1) {

                $scope.request.principalInvestigator = userId;

            }

            shptService.editRequest($scope.request, function (request) {

                $scope.request = request;

            }, function () {

                utilService.showSuccessMessage('#notification-area', 'Request Updated Successfully!');

            });

        });

        $location.path('/listRequest/');
    };

    $scope.removeAttachment = function () {
        
        if (confirm('Are you sure you want to remove this attachment. It will be completely wiped out from the server.')) {

            shptService.removeListAttachment($scope.request, function (request) {

                $scope.request = request;

            });
        }

    };

    $scope.cancel = function () {

        $location.path('/listRequests');

    };

    $scope.appWebUrl = shptService.appWebUrl;

}]);

mainApp.controller('ReviewRequestController', ["$scope", "$location", "$routeParams", "shptService", function ($scope, $location, $routeParams, shptService) {

    var requestIndex = parseInt($routeParams.requestIndex);
    shptService.getRequests(function (data) {
        console.log(data);
        $(data).each(function (i, e) {
            if (e.id === requestIndex) {
                $scope.request = e;
                return false;
            }
        });
    });

    $scope.updateStatus = function (approvalStatus) {
        shptService.getCurrentUser(function (user) {
            shptService.updateRequestStatus({
                id: $scope.request.id,
                requestStatus: approvalStatus,
                requestApprovalDate: (new Date().toISOString()),
                requestApproverComments: $scope.request.requestApproverComments,
                requestApproverId: user.id
            }, function (request) {
                $scope.request.requestStatus = request.requestStatus;
                $scope.request.labelCss = request.labelCss;
                if (requests != null) {
                    $(requests).each(function (i, o) {
                        if (o.id === request.id) {
                            requests[i] = request;
                            return false;
                        }
                    });
                }

                $location.path("/listRequests");
            });
        });
    };

    $scope.cancel = function () {
        $location.path("/listRequests");

    }

}]);

mainApp.controller('ListRequestsController', ["$scope", "$location", "$filter", "shptService", function ($scope, $location, $filter, shptService) {
    $scope.requests = [];
    shptService.getRequests(function (data) {
        $scope.requests = data;
    });

    $scope.getRequest = function (index, action) {
        if (action == 'flagDataRelease') {
            $location.path('/releaseData/' + index);
        } else if (action == 'review') {
            $location.path('/reviewRequest/' + index);
        } else if (action == 'edit') {
            $location.path('/editRequest/' + index);
        }
    }

    var permissions = {};
    shptService.getCurrentUser(function (user) {
        $scope.user = user;
        permissions.review = shptService.userExistInGroup(user, 'Coordinators');
        permissions.releaseData = shptService.userExistInGroup(user, 'Data Managers');
        $scope.permissions = permissions;
        console.log(permissions);
    });

    $scope.parseInt = function (num) {
        if (isNaN(num)) {
            return -1;
        }
        else {
            return parseInt(num);
        }
    }

    $scope.currentPage = 1;
    $scope.pageSize = 10;

    $scope.today = $filter('date')(new Date(), 'yyyyMMdd_hhmmss')

    $scope.exportDataToCsv = function () {
        alasql.promise("SELECT " +
                        "requestDate as `Date Of Request`," +
                        "requestorName as `Requestor`," +
                        "requestType as `Request Type`," +
                        "objectivesCovered as `Objectives Covered by Protocol`," +
                        "intendedDataUse as `Intended Data Use`," +
                        "estDataUseEndDate as `Est. Data Use End Date`," +
                        "requestStatus as `Request Status`," +
                        "requestApprovalDate as `Approval Date`," +
                        "requestApproverName as `Approver`," +
                        "dataReleaseDate as `Data Release Date`," +
                        "dataReleaser as `Data Manager`," +
                        "attachments as Attachments " +
            "INTO xlsx('requestdata_" + $scope.today + ".xlsx', {headers:true}) FROM ?",
            [$scope.requests]).then(function (data) {
                console.log("Data Saved");
            }).catch(function (err) {
                console.log("Saving failed", err);
            });
    };

    $scope.hostWebUrl = shptService.hostWebUrl;

}]);

mainApp.controller('ReleaseDataController', ['$scope', '$location', '$routeParams', 'shptService', function ($scope, $location, $routeParams, shptService) {

    var requestIndex = parseInt($routeParams.requestIndex);
    shptService.getRequests(function (data) {
        $(data).each(function (i, e) {
            if (e.id === requestIndex) {
                $scope.request = e;
                return false;
            }
        });
    });

    $scope.updateStatus = function () {
        shptService.getCurrentUser(function (user) {
            shptService.updateRequestStatus({
                id: $scope.request.id,
                requestStatus: 'Data Released',
                dataReleaserId: user.id,
                dataReleaseDate: $scope.request.dataReleaseDate,
                dataReleaserComments: $scope.request.dataReleaserComments,
                dataReleaseAttachment: $scope.request.dataReleaseAttachment
            }, function (request) {
                $scope.request.requestStatus = request.requestStatus;
                $scope.request.labelCss = request.labelCss;
                if (requests != null) {
                    $(requests).each(function (i, o) {
                        if (o.id === request.id) {
                            requests[i] = request;
                            return false;
                        }
                    });
                }

                $location.path("/listRequests");
            });
        });
    };

    $scope.cancel = function () {
        $location.path("/listRequests");

    }

}]);

/**/
mainApp.controller('DashboardController', ['$scope', '$location', 'shptService', function ($scope, $location, shptService) {

    var pendingRequests = [];
    var approvedRequests = [];
    var finalizedRequests = [];
    var rejectedRequests = [];
    var dgcVotingRequests = [];
    var data = [[]];

    data.pop();

    var getPeriodFromDate = function (d) {
        var objDate = new Date(d),
                locale = 'en-us',
                monthName = objDate.toLocaleString(locale, { month: "short" }),
                year = objDate.toLocaleString(locale, { year: "numeric" }),
                requestPeriod = year + "-" + monthName;
        return requestPeriod;
    };

    $scope.loading = true;
    shptService.getRequests(function (requests) {
        /*
        * Get the last 12 months in the format yyyy-mm e.g. 2017-Feb
        **/
        var defaultPeriod = "";
        var months = 12;
        var d = new Date();
        d.setMonth(d.getMonth() - months);
        while (months > 0) {
            d.setMonth(d.getMonth() + 1);
            defaultPeriod = getPeriodFromDate(d);
            data.push([defaultPeriod, 0]);
            months--;

        }

        $(requests).each(function (i, e) {
            if (e.requestStatus === 'Pending') {
                pendingRequests.push(e);
            }
            else if (e.requestStatus === 'Approved') {
                approvedRequests.push(e);
            }
            else if (e.requestStatus === 'Data Released') {
                finalizedRequests.push(e);
            }
            else if (e.requestStatus === 'Rejected') {
                rejectedRequests.push(e)
            }
            else if (e.requestStatus === 'DGC Voting') {
                dgcVotingRequests.push(e);
            }

            var exists = false;
            var dataItem = [];
            var requestPeriod = "";

            requestPeriod = getPeriodFromDate(e.requestDate);

            $.each(data, function (x, o) {
                if (o[0] === requestPeriod) {
                    exists = true;
                    dataItem = [o, x];
                    return false;
                }
            });

           if (exists == true) {
                data[dataItem[1]][1] = data[dataItem[1]][1] + 1;
            }
            else {
                data.push([requestPeriod, 1]);
            }
        });

        $scope.allRequestsCount = requests.length;
        $scope.pendingRequestsCount = pendingRequests.length;
        $scope.approvedRequestsCount = approvedRequests.length;
        $scope.finalizedRequestsCount = finalizedRequests.length;
        $scope.rejectedRequestsCount = rejectedRequests.length;
        $scope.dgcVotingRequestsCount = dgcVotingRequests.length;

    });
    //$scope.spinner.active = false;
    $scope.dataset = [{ data: data, yaxis: 1, label: ' Requests trends for past 12 months' }];
    $scope.options = {
        legend: {
            show: true,
            container: "#legend"
        },
        points: {
            show: true
        },
        lines: {
            show: true
        },
        xaxis: {
            mode: 'categories',
            tickLength: 1,
            ticksize: 1
        },
        grid: {
            hoverable: true
        }
    };
    $scope.loading = false;
    $scope.hostWebUrl = shptService.hostWebUrl;

}]);

mainApp.controller('ReportController', ['$scope', function ($scope) {

}]);