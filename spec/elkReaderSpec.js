const proxyquire = require('proxyquire');

describe('elkReader', () => {

  let elkReader;
  let requestMock;
  const mockConfigData = {
    queries: [{
      id: 'errors',
      description: 'ERROR',
      query: 'level:"ERROR"',
      timeSpan: 'now-2h',
      type: 'ERROR'
    }, {
      id: 'warnings',
      description: 'WARNINGS',
      query: 'level:"ERROR"',
      type: 'WARN'
    }],
    environments: [{
      id: 'PROD',
      url: 'http://myprod.org/_search',
      queryAddition: ' AND HOSTNAME:"PROD"'
    }, {
      id: 'DEV',
      url: 'http://myprod.org/a-timed-index-${date}/_search',
      queries: ['errors']
    }]
  };

  beforeEach(() => {
    requestMock = jasmine.createSpy('request');
    const getConfigMock = jasmine.createSpy('get config');
    getConfigMock.and.returnValue(mockConfigData);
    const configMock = {
      create: () => {
        return {
          get: getConfigMock
        };
      }
    };
    elkReader = proxyquire('../server/elkReader', {
      'request': requestMock,
      './ymlHerokuConfig': configMock
    });
  });

  const mockRequestAndGetOptions = (num, data) => {
    const requestArgs = requestMock.calls.argsFor(num);
    requestArgs[1](undefined, {}, data);
    return requestArgs[0];
  };

  it('should create a request based on configuration data', () => {
    const baseTime = new Date(2015, 0, 1);
    jasmine.clock().mockDate(baseTime);

    elkReader.getElkData();

    const requestOptionsEnvironment1 = mockRequestAndGetOptions(0, '{"hits": { "total": 2 } }');
    const requestOptionsEnvironment2 = mockRequestAndGetOptions(2, '{"hits": { "total": 2 } }');

    expect(requestOptionsEnvironment1.url).toBe('http://myprod.org/_search');
    expect(requestOptionsEnvironment2.url).toBe('http://myprod.org/a-timed-index-2015.01.01/_search');

    const requestBody = JSON.parse(requestOptionsEnvironment1.body);
    expect(requestBody.query.query_string.query).toBe('level:"ERROR"  AND HOSTNAME:"PROD"');
    expect(requestBody.filter.range['@timestamp'].gte).toBe('now-2h');

  });

  it('should combine the response data to expected metrics data', (done) => {
    const whenElkDataReceived = elkReader.getElkData();

    mockRequestAndGetOptions(0, '{"hits": { "total": 2 } }');
    mockRequestAndGetOptions(1, '{"hits": { "total": 2 } }');
    mockRequestAndGetOptions(2, '{"hits": { "total": 2 } }');

    whenElkDataReceived.then((result) => {
      const envId = mockConfigData.environments[0].id;
      const queryId = mockConfigData.queries[0].id;

      expect(result[envId][queryId]).toBeDefined();
      expect(result[envId][queryId].description).toBe('ERROR');
      expect(result[envId][queryId].type).toBe('ERROR');
      expect(result[envId][queryId].hits).toBe(2);

      expect(result[mockConfigData.environments[0].id][mockConfigData.queries[1].id]).toBeDefined();
      expect(result[mockConfigData.environments[1].id][mockConfigData.queries[0].id]).toBeDefined();

      done();
    }).done();
  });

});
