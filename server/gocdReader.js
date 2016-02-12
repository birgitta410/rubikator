
var _ = require('lodash');
var Q = require('q');
var moment = require('moment');
var configReader = require('./ymlHerokuConfig');
var giphyReader = require('./giphyReader');
var goCdApi = require('gocd-api');

var gocdReaderModule = (function() {

  var gocd;
  var INIT_STARTED = false;

  function compareNumbers(a, b) {
    // JS does lexicographical sorting by default, need to sort by number
    return a - b;
  }



  function mapPipelineData(history) {

    var pipelineRuns = history.pipelineRuns ? history.pipelineRuns : history; // gocd-api interface change

    var keysDescending = _.keys(pipelineRuns).sort(compareNumbers).reverse();
    var latestRun = keysDescending.length > 0 ? pipelineRuns[keysDescending[0]] : undefined;

    var ignoreLatestRun = latestRun && (latestRun.wasSuccessful() || latestRun.summary.result === 'unknown');
    if (! ignoreLatestRun) {
      console.log("returning", history.pipelineName, history.statistics);
      return {
        boxes: [pipelineRuns[keysDescending[0]]],
        pipelineName: history.pipelineName,
        statistics: history.statistics
      };
    } else {
      return {
        boxes: [],
        pipelineName: history.pipelineName,
        statistics: history.statistics
      };
    }

  }

  function mapActivityData(activity) {

    return _.where(activity.stages, function(entry) {
      return entry.isBuilding && entry.isBuilding() || entry.activity === 'Building' || entry.isScheduled && entry.isScheduled();
    });

  }

  var readHistoryAndActivity = function(data) {
    console.log("reading history", data.pipeline);
    var activities = mapActivityData(data.activity);

    var history = mapPipelineData(data.history);
    var currentGiphys = giphyReader.getCache();
    return Q.resolve({
      activity: activities,
      history: history,
      pipeline: data.pipeline,
      success: currentGiphys['success'],
      fail: currentGiphys['fail'],
      working: currentGiphys['working']
    });
  };

  function getGocdData() {
    if(gocd === undefined) {
      console.log("not ready yet");

      if(! INIT_STARTED) {
        goCdApi.getInstance(configReader.create('gocd').get()).then(function(instance) {
          console.log("GO CD DATA CACHE INITIALISED");
          gocd = instance;
        }).done();
        INIT_STARTED = true;
      }

      return Q.resolve([]);
    }

    console.log("Starting to read Go CD data for ", gocd.pipelineNames);
    var pipelines = gocd.pipelineNames;
    var all = _.map(pipelines, function(pipeline) {
      return gocd.readData(pipeline);
    });

    return Q.all(all).then(function (gocdData) {

      var transforms = _.map(gocdData, readHistoryAndActivity);
      return Q.all(transforms).then(function(transformedData) {
        console.log("sending to /gocd");
        return transformedData;
      });

    }).fail(function(error) {
      console.log("COULD NOT READ DATA!", error);
      return {error: error};
    });
  }



  return {
    getGocdData: getGocdData
  }
}());

exports.getGocdData = gocdReaderModule.getGocdData;
