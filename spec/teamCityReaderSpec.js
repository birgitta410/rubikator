const proxyquire = require('proxyquire');
const Q = require('q');
const xml2json = require('xml2json');

describe('teamCityReader', () => {

  let teamCityReader;
  let requestMock;
  let ccTrayReaderMock;
  var requestMockCalls = [];

  const configData = {
    host: 'http://my-teamcity',
    projects: [
      { id: 'project1', name: 'Group :: Subgroup' },
      { id: 'project2', name: 'Group :: AnotherSubgroup' }
    ],
    ccTrayUrl: 'http://my-teamcity/guestAuth/app/rest/cctray/projects.xml'
  };

  beforeEach(() => {
    requestMock = jasmine.createSpy('request');

    requestMock.and.callFake((function() {
      var callIndex = 0;
      return function(options, callback) {
        callback(undefined, {}, requestMockCalls[callIndex]);
        callIndex ++;
      }
    })());

    ccTrayReaderMock = jasmine.createSpyObj('ccTrayReader', ['readActivity']);
    var gocdApiMock = jasmine.createSpyObj('gocd', ['getCcTrayInstance']);
    gocdApiMock.getCcTrayInstance.and.returnValue(ccTrayReaderMock);

    const getConfigMock = jasmine.createSpy('get config');
    getConfigMock.and.returnValue(configData);
    const configMock = {
      create: () => {
        return {
          get: getConfigMock
        };
      }
    };
    const giphyReaderMock = jasmine.createSpyObj('giphyReader', ['getCache']);
    giphyReaderMock.getCache.and.returnValue({ success: 'success.gif', fail: 'fail.gif', working: 'working.gif'});
    teamCityReader = proxyquire('../server/teamCityReader', {
      'request': requestMock,
      'gocd-api': gocdApiMock,
      './ymlHerokuConfig': configMock,
      './giphyReader': giphyReaderMock
    });
  });

  it('try it', (testDone) => {
    var aBuildingStage = {
      name: "build name",
      activity: "Building",
      lastBuildStatus: "Success",
      lastBuildLabel: 2066,
      lastBuildTime: "2014-07-24T09:14:02",
      webUrl: "http://my-teamcity/xxx",
      buildNumber: "2066",
      info2: "[2066] build | Success"
    };
    var aSleepingStage = { name: "another build", activity: "Sleeping" };
    ccTrayReaderMock.readActivity.and.returnValue(new Q({
      activity: { stages: [ aBuildingStage, aSleepingStage ] }
    }));

    requestMockCalls[0] = `<buildTypes>
      <buildType id="project1_compileStep" name="compileStep" projectName="Group :: Subgroup" projectId="project1"
      href="/guestAuth/app/rest/buildTypes/id:project1_compileStep"
      webUrl="https://teamcity.rz.is/viewType.html?buildTypeId=project1_compileStep"/>
    </buildTypes>`;
    requestMockCalls[1] = '<buildTypes></buildTypes>';
    requestMockCalls[2] = {
      id: "86945",
      buildTypeId: "project1_compileStep",
      number: "2894",
      status: "FAILURE",
      state: "finished",
      statusText: "tests passed: 750",
      buildType: {
        id: "project1_compileStep", name: "compileStep", projectName: "Group :: Subgroup", projectId: "project1"
      },
      queuedDate: "20161128T155712+0100",
      startDate: "20161128T155718+0100"
    };
    var result = teamCityReader.getActivity();

    result.then((data) => {
      console.log("result", data);

      expect(ccTrayReaderMock.readActivity).toHaveBeenCalledWith(
        ['Group :: Subgroup', 'Group :: AnotherSubgroup'], jasmine.any(Function)
      );

      expect(data.historyAndActivity.length).toEqual(configData.projects.length);
      const firstProject = data.historyAndActivity[0];
      expect(firstProject.pipeline).toEqual(configData.projects[0].id);
      expect(firstProject.activity).toEqual([ aBuildingStage ]);

      var failedHistory = firstProject.history.boxes[0];
      expect(failedHistory.summary.text).toBeDefined();
      expect(failedHistory.summary.result).toEqual('failed');
      expect(firstProject.history.pipelineName).toEqual('project1');

      testDone();
    }).done();

  });
});
