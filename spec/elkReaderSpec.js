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
      url: 'http://myprod.org/_search',
      query: ' AND HOSTNAME:"PROD"'
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

  function mockRequestAndGetOptions(num, data) {
    const requestArgs = requestMock.calls.argsFor(num);
    requestArgs[1](undefined, {}, data);
    return requestArgs[0];
  }

  it('should create a request based on configuration data', function () {
    var whenElkDataReceived = elkReader.getElkData();

    const requestOptions = mockRequestAndGetOptions(0, '{"hits": { "total": 2 } }');

    expect(requestOptions).toBeDefined();

    const requestBody = JSON.parse(requestOptions.body);
    expect(requestBody.query.query_string.query).toBe('level:"ERROR"  AND HOSTNAME:"PROD"');
    expect(requestBody.filter.range["@timestamp"].gte).toBe('now-2h');

  });

  it('should combine the response data to expected metrics data', function (done) {
    var whenElkDataReceived = elkReader.getElkData();

    const requestOptions = mockRequestAndGetOptions(0, '{"hits": { "total": 2 } }');

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
