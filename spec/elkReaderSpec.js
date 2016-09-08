const proxyquire = require('proxyquire');

describe('elkReader', function () {

  var elkReader, requestMock, mockConfigData = {
    queries: [{
      id: 'errors',
      description: 'ERROR',
      query: 'level:"ERROR"',
      timeSpan: 'now-2h',
      type: 'WARN'
    }],
    environments: [{
      id: 'PROD',
      url: 'http://myprod.org/_search'
    }]
  };

  beforeEach(function() {
    requestMock = jasmine.createSpy('request');
    var getConfigMock = jasmine.createSpy('get config');
    getConfigMock.and.returnValue(mockConfigData);
    const configMock = {
      create: function() {
        return {
          get: getConfigMock
        }
      }
    }
    elkReader = proxyquire('../server/elkReader', {
      'request': requestMock,
      './ymlHerokuConfig': configMock
    });
  });

  function mockRequest(num, data) {
    const requestCallback = requestMock.calls.argsFor(num)[1];
    requestCallback(undefined, {}, data);
  }

  it('should return activity data', function (done) {
    var whenElkDataReceived = elkReader.getElkData()

    mockRequest(0, '{"hits": { "total": 2 } }'); // 1 query x 1 environment

    whenElkDataReceived.then(function(result) {
      const envId = mockConfigData.environments[0].id;
      const queryId = mockConfigData.queries[0].id;
      expect(result[envId]).toBeDefined();
      expect(result[envId][queryId]).toBeDefined();
      expect(result[envId][queryId].description).toBe('ERROR');
      expect(result[envId][queryId].type).toBe('WARN');
      expect(result[envId][queryId].hits).toBe(2);
      done();
    }).done();
  });

});
