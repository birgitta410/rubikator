
var _ = require('lodash');
var Q = require('q');
var moment = require('moment');
var configReader = require('./ymlHerokuConfig');
var giphyReader = require('./giphyReader');
var goCdApi = require('gocd-api');

var gocdReaderModule = (function() {

  var gocd;
  var INIT_STARTED = false;
  var config = configReader.create('gocd').get();

  function compareNumbers(a, b) {
    // JS does lexicographical sorting by default, need to sort by number
    return a - b;
  }

  function mapRelevantHistoryData(pipelineHistory) {

    var pipelineRuns = pipelineHistory.pipelineRuns ? pipelineHistory.pipelineRuns : pipelineHistory; // gocd-api interface change

    var keysDescending = _.keys(pipelineRuns).sort(compareNumbers).reverse();
    var latestRun = keysDescending.length > 0 ? pipelineRuns[keysDescending[0]] : undefined;

    var irrelevantForDisplay = latestRun && (latestRun.wasSuccessful() || latestRun.summary.result === 'unknown');
    if (irrelevantForDisplay) {
      return {
        boxes: [],
        pipelineName: pipelineHistory.pipelineName,
        statistics: pipelineHistory.statistics
      };
    } else {
      console.log("returning", pipelineHistory.pipelineName, pipelineHistory.statistics);
      return {
        boxes: [pipelineRuns[keysDescending[0]]],
        pipelineName: pipelineHistory.pipelineName,
        statistics: pipelineHistory.statistics
      };
    }

  }

  var readFocusHistory = function(pipelineHistory) {
    var pipelineRuns = pipelineHistory.pipelineRuns ? pipelineHistory.pipelineRuns : pipelineHistory; // gocd-api interface change
    var focusStage = config.focus.split("::")[1];

    var keysDescending = _.keys(pipelineRuns).sort(compareNumbers).reverse();
    var stageRuns = _.map(keysDescending, function(runLabel) {
      var run = pipelineRuns[runLabel];
      return _.extend(_.find(run.stages, { name: focusStage }), {label: runLabel});
    });
    return stageRuns;
  };

  var mapFocusHistory = function(pipelineData) {
    var focusedPipelineName = config.focus ? config.focus.split("::")[0] : "NO_FOCUS";
    var focusedPipeline = _.find(pipelineData, { pipeline: focusedPipelineName});
    var focusHistory = focusedPipeline ? readFocusHistory(focusedPipeline.history) : undefined;
    var maxFocus = 20;
    if(focusHistory === undefined) {
      return undefined;
    }

    var toDrop = focusHistory.length - maxFocus;
    if(toDrop < 0) {
      toDrop = 0;
    }
    return _.dropRight(focusHistory, toDrop);

  }

  function mapRelevantActivityData(activity) {

    return _.filter(activity.stages, function(entry) {
      var relevantForDisplay =
        entry.isBuilding && entry.isBuilding()
          || entry.activity === 'Building'
          || entry.isScheduled && entry.isScheduled();
      return relevantForDisplay;
    });

  }

  var readRelevantHistoryAndActivity = function(pipelineData) {
    console.log("reading history", pipelineData.pipeline);
    var activities = mapRelevantActivityData(pipelineData.activity);

    var history = mapRelevantHistoryData(pipelineData.history);
    var historyFocus = {};
    historyFocus[config.focus] = ["hello"];

    var currentGiphys = giphyReader.getCache();
    return {
      activity: activities,
      history: history,
      pipeline: pipelineData.pipeline,
      success: currentGiphys['success'],
      fail: currentGiphys['fail'],
      working: currentGiphys['working']
    };
  };

  function getCurrentData() {
    console.log("Starting to read Go CD data for ", gocd.pipelineNames);
    var dataPromiseForEachPipeline = _.map(gocd.pipelineNames, gocd.readData);

    return Q.all(dataPromiseForEachPipeline).then(function (pipelineData) {
      console.log("sending to /gocd");
      var relevantHistoryAndActivity = _.map(pipelineData, readRelevantHistoryAndActivity);

      var focusHistory = mapFocusHistory(pipelineData);

      return {
        historyAndActivity: relevantHistoryAndActivity,
        focus: focusHistory
      };
    }).fail(function(error) {
      console.log("COULD NOT READ DATA!", error);
      return {error: error};
    });
  }

  function initAndGetFirstData() {
    console.log("GO CD not ready yet");

    if(INIT_STARTED) {
      return Q.resolve([]);
    }

    INIT_STARTED = true;
    return goCdApi.getInstance(config).then(function(instance) {
      console.log("GO CD DATA CACHE INITIALISED");
      gocd = instance;
      return getCurrentData();
    });

  }

  function getGocdData() {
    if(gocd === undefined) {
      return initAndGetFirstData();
    }
    return getCurrentData();

  }



  return {
    getGocdData: getGocdData
  }
}());

exports.getGocdData = gocdReaderModule.getGocdData;
