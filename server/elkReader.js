
var http = require('http');
var _ = require('lodash');
var Q = require('q');
var request = require('request');
var configReader = require('./ymlHerokuConfig');
var logger = require('./logger');

function elkReader() {

  var logsConfig = configReader.create('logs').get();

  function countLogs(queryConfig, url) {
    logger.debug("Sending query", JSON.stringify(queryConfig), "to", url);
    var identifier = queryConfig.id;

    var defer = Q.defer();

    var requestOptions = {
      method: 'GET',
      body: JSON.stringify({
        "query": {
          "query_string": {
            "query": queryConfig.query,
            "analyze_wildcard": true
          }
        },
        "filter": {
          "range" : {
            "@timestamp" : {
              "gte" : "now-1h",
              "lt" :  "now"
            }
          }
        }
      }),
      url: url
    };

    request(requestOptions, function (error, response, body) {
      if(error) {
        defer.reject('failed to get ' + requestOptions.url, error);
      } else {
        var result = JSON.parse(body);
        var metric = {};
        metric[identifier] = {
          hits: result.hits.total || 0,
          description: queryConfig.description,
          type: queryConfig.type
        };
        defer.resolve(metric);
      }
    });

    return defer.promise;

  }

  var getData = function() {

    return Q.all(_.map(logsConfig.environments, function(environment) {
      var url = environment.url;

      var queries = _.map(logsConfig.queries, function(query) {
        return countLogs(query, url);
      });

      return Q.all(queries).then(function(metricsForEnvironment) {
        var result = {};
        _.each(metricsForEnvironment, function(metric) {
          result = _.extend(result, metric);
        });

        var resultForOneEnvironment = {};
        resultForOneEnvironment[environment.id] = result;
        return resultForOneEnvironment;

      });
    })).then(function(envMetrics) {
      var resultForAllEnvironments = {};
      _.each(envMetrics, function(envMetric) {
        resultForAllEnvironments = _.extend(resultForAllEnvironments, envMetric);
      });
      return resultForAllEnvironments;
    }).fail(function(error) {
      console.log("ERROR GETTING METRICS", error);
    });

  };

  function getElkData() {
    return getData().then(function (metricsData) {
      return metricsData;

    }).fail(function(error) {
      console.log("COULD NOT CHECK LOG METRICS!", error);
      return {error: error};
    });

  }

  return {
    getElkData: getElkData
  };

}

exports.getElkData = elkReader().getElkData;