
var _ = require('lodash');
var Q = require('q');
var moment = require('moment');
var configReader = require('./ymlHerokuConfig');
var giphyReader = require('./giphyReader');
var goCdApi = require('gocd-api');

var gocdReaderModule = (function() {

  var gocd;

  goCdApi.getInstance(configReader.create('gocd').get()).then(function(instance) {
    console.log("GO CD DATA CACHE INITIALISED");
    gocd = instance;
  }).done();

  function compareNumbers(a, b) {
    // JS does lexicographical sorting by default, need to sort by number
    return a - b;
  }

  var readHistoryAndActivity = function(data) {
    console.log("reading history", data.pipeline);
    var activities = mapActivityDataToFigures(data.activity);

    var history = mapPipelineDataToFigures(data.history);
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


  function mapPipelineDataToFigures(history) {

    var keysDescending = _.keys(history).sort(compareNumbers).reverse();
    var latestRun = keysDescending.length > 0 ? history[keysDescending[0]] : undefined;

    var ignoreLatestRun = latestRun && (latestRun.wasSuccessful() || latestRun.summary.result === 'unknown');
    if (! ignoreLatestRun) {
      return {
        boxes: [history[keysDescending[0]]]
      };
    } else {
      return {
        boxes: []
      };
    }

  }

  function mapActivityDataToFigures(activity) {

    return _.where(activity.stages, function(entry) {
      return entry.isBuilding && entry.isBuilding() || entry.activity === 'Building' || entry.isScheduled && entry.isScheduled();
    });

  }


  return {
    getGocdData: getGocdData
  }
}());

exports.getGocdData = gocdReaderModule.getGocdData;
