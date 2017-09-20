mainApp.service("requestService", ["$rootScope", "shptService", function ($rootScope, shptService) {
    var svc = {};

    var data = [
          {
              requestType: 'Internal',
              requestDate: '2016-29-01',
              requestor: 'kochieng',
              protocolSSCNo: '',
              protocolTitle: '',
              institution: '',
              investigator: '',
              estEndDataUse: '',
              requestStatus: 'Pending',
              requestApprovalDate: '',
              requestApprover: '',
              requestApproverComments: ''
          },
          {
              requestType: 'Internal',
              requestDate: '2016-29-01',
              requestor: 'kochieng',
              protocolSSCNo: '21547852',
              protocolTitle: 'Proteosis xxxxx',
              institution: 'EDD',
              investigator: '',
              estEndDataUse: '',
              requestStatus: 'Pending',
              requestApprovalDate: '',
              requestApprover: '',
              requestApproverComments: ''
          },
          {
              requestType: 'Internal',
              requestDate: '2016-29-01',
              requestor: 'kochieng',
              protocolSSCNo: '',
              protocolTitle: '',
              institution: '',
              investigator: '',
              estEndDataUse: '',
              requestStatus: 'Pending',
              requestApprovalDate: '',
              requestApprover: '',
              requestApproverComments: ''
          }
    ];

    svc.getRequests = function () {
        return data;
    };

    svc.addRequest = function (request) {
        data.push(request);
    };

    svc.editRequest = function (requestIndex, request) {
        data[requestIndex] = request;
    }

    return svc;
}]);