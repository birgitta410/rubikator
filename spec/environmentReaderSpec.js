const proxyquire = require('proxyquire');

describe('environmentReader', function () {

  var environmentReader, requestMock, mockConfigData = {
    testEnvironment: [
      { id: 'backend', url: 'https://my-test-env-host/health', pattern: 'buildVersion = "([0-9a-zA-Z]{1,})"'},
      { id: 'client', url: 'http://my-test-env-host/build.js', pattern: 'buildVersion = "([0-9a-zA-Z]{1,})";' }
    ]
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
    environmentReader = proxyquire('../server/environmentReader', {
      'request': requestMock,
      './ymlHerokuConfig': configMock
    });
  });

  function mockRequestAndGetOptions(num, data) {
    const requestArgs = requestMock.calls.argsFor(num);
    requestArgs[1](undefined, {}, data);
    return requestArgs[0];
  }

  it('should send requests to the configured environmentURLs', function () {
    environmentReader.checkHealthAndUpdateClients();

    const requestOptionsEnvironment1 = mockRequestAndGetOptions(0, 'bla buildversion = "1234" bla');
    const requestOptionsEnvironment2 = mockRequestAndGetOptions(1, 'bla buildversion = "1234" bla');

    expect(requestOptionsEnvironment1.url).toBe('https://my-test-env-host/health');
    expect(requestOptionsEnvironment2.url).toBe('http://my-test-env-host/build.js');
  });

  it('should send requests to the configured environmentURLs', function (testDone) {
    const whenEnvironmentDataReceived = environmentReader.checkHealthAndUpdateClients();

    const requestOptionsEnvironment1 = mockRequestAndGetOptions(0, 'bla buildVersion = "b1234" bla');
    const requestOptionsEnvironment2 = mockRequestAndGetOptions(1, 'does not match the pattern');

    whenEnvironmentDataReceived.then(function(data) {
      const dataService1 = data.testEnvironment[0];
      expect(dataService1.id).toBe('backend');
      expect(dataService1.env).toBe('testEnvironment');
      expect(dataService1.status).toBe('OK');

      const dataService2 = data.testEnvironment[1];
      expect(dataService2.id).toBe('client');
      expect(dataService2.env).toBe('testEnvironment');
      expect(dataService2.status).toBe('NOT OK');

      testDone();
    }).done()
  });

});
