
var http = require('http');
var _ = require('lodash');
var Q = require('q');
var request = require('request');
var configReader = require('./ymlHerokuConfig');
var logger = require('./logger');
var moment = require('moment');

function elkReader() {

  var logsConfig = configReader.create('logs').get();

  function parseUrl(urlPattern) {
    return urlPattern.replace('${date}', moment().format('YYYY.MM.DD'));
  }

  function countLogs(queryConfig, url, environment) {
    var queryAddendum = environment.queryAddition;
    var environmentTarget = environment.targets ? environment.targets[queryConfig.id] : undefined;

    logger.debug("Sending query", JSON.stringify(queryConfig), "to", url);
    var identifier = queryConfig.id;

    var defer = Q.defer();

    var requestOptions = {
      method: 'GET',
      body: JSON.stringify({
        "query": {
          "query_string": {
            "query": queryConfig.query + (queryAddendum ? ' ' + queryAddendum : ''),
            "analyze_wildcard": true
          }
        },
        "filter": {
          "range" : {
            "@timestamp" : {
              "gte" : queryConfig.timeSpan ? queryConfig.timeSpan : "now-1h",
              "lt" :  "now"
            }
          }
        }
      }),
      url: parseUrl(url)
    };

    function targetIsMet(environmentTarget, totalHits) {
      if(environmentTarget === undefined) {
        return undefined;
      }

      var range = (environmentTarget + "").split("-");
      if(range.length === 1) {
        return totalHits === Number(range[0]);
      } else if (range.length === 2) {
        return totalHits >= Number(range[0]) && totalHits <= Number(range[1]);
      }
    }

    request(requestOptions, function (error, response, body) {
      if(error) {
        console.log("ERROR", 'failed to get ' + requestOptions.url, error);
        defer.resolve(undefined);
      } else {
        var result = JSON.parse(body);
        var metric = {};

        var totalHits = result.hits ? result.hits.total || 0 : '?';

        metric[identifier] = {
          hits: totalHits,
          description: queryConfig.description,
          type: queryConfig.type,
          target: environmentTarget,
          targetIsMet: targetIsMet(environmentTarget, totalHits)
        };
        if(result.hits === undefined) {
          console.log("WARNING", "No hits for", requestOptions.url, queryConfig.query);
        }
        defer.resolve(metric);
      }
    });

    return defer.promise;

  }

  var getData = function() {

    return Q.all(_.map(logsConfig.environments, function(environment) {
      var url = environment.url;

      var queriesForEnvironment = environment.queries ? _.filter(logsConfig.queries, function(query) {
        return _.includes(environment.queries, query.id);
      }) : logsConfig.queries;

      var queryPromises = _.map(queriesForEnvironment, function(queryConfig) {
        return countLogs(queryConfig, url, environment);
      });

      return Q.all(queryPromises).then(function(metricsForEnvironment) {
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
      _.each(_.compact(envMetrics), function(envMetric) {
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
