
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

  function mapRelevantPipelineData(history) {

    var pipelineRuns = history.pipelineRuns ? history.pipelineRuns : history; // gocd-api interface change

    var keysDescending = _.keys(pipelineRuns).sort(compareNumbers).reverse();
    var latestRun = keysDescending.length > 0 ? pipelineRuns[keysDescending[0]] : undefined;

    var irrelevantForDisplay = latestRun && (latestRun.wasSuccessful() || latestRun.summary.result === 'unknown');
    if (irrelevantForDisplay) {
      return {
        boxes: [],
        pipelineName: history.pipelineName,
        statistics: history.statistics
      };
    } else {
      console.log("returning", history.pipelineName, history.statistics);
      return {
        boxes: [pipelineRuns[keysDescending[0]]],
        pipelineName: history.pipelineName,
        statistics: history.statistics
      };
    }

  }

  function mapRelevantActivityData(activity) {

    return _.where(activity.stages, function(entry) {
      var relevantForDisplay =
        entry.isBuilding && entry.isBuilding()
          || entry.activity === 'Building'
          || entry.isScheduled && entry.isScheduled();
      return relevantForDisplay;
    });

  }

  var readHistoryAndActivity = function(data) {
    console.log("reading history", data.pipeline);
    var activities = mapRelevantActivityData(data.activity);

    var history = mapRelevantPipelineData(data.history);
    var currentGiphys = giphyReader.getCache();
    return {
      activity: activities,
      history: history,
      pipeline: data.pipeline,
      success: currentGiphys['success'],
      fail: currentGiphys['fail'],
      working: currentGiphys['working']
    };
  };

  function getCurrentData() {
    console.log("Starting to read Go CD data for ", gocd.pipelineNames);
    var dataPromiseForEachPipeline = _.map(gocd.pipelineNames, gocd.readData);

    return Q.all(dataPromiseForEachPipeline).then(function (gocdData) {
      console.log("sending to /gocd");
      return _.map(gocdData, readHistoryAndActivity);
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
