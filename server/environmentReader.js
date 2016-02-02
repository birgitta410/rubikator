
var http = require('http');
var _ = require('lodash');
var Q = require('q');
var request = require('request');
var configReader = require('./ymlHerokuConfig');
var logger = require('./logger');

function environmentReader() {

  var envs = configReader.create('environments').get();

  function checkUrl(checkConfig) {
    var defer = Q.defer();

    var requestOptions = {
      url: checkConfig.url,
      rejectUnauthorized: false,
      timeout: 10000
    };

    logger.debug("Checking", checkConfig.url);
    request(requestOptions, function (error, response, body) {
      if(error) {
        defer.reject('failed to get ' + requestOptions.url, error);
      } else {
        defer.resolve(body);
      }
    });

    return defer.promise;

  }


  var parseHealthCheck = function(result, pattern) {
    var buildVersionFromHealth = new RegExp(pattern, 'g');

    var matchBuildVersion = buildVersionFromHealth.exec(result);

    if(matchBuildVersion && matchBuildVersion.length >= 2) {
      return {
        value: matchBuildVersion[1],
        status: 'OK'
      };

    } else {
      return {
        status: 'NOT OK'
      };
    }
  };

  var parseResult = function(checkConfig, result) {
    return parseHealthCheck(result, checkConfig.pattern);
  };

  var checkAllEnvironments = function() {
    var allChecks = _.flatten(_.map(_.keys(envs), function(envKey) {

      var checkUrls = envs[envKey];

      return _.map(checkUrls, function(checkConfig) {
        return checkUrl(checkConfig).then(function(result) {
          var healthData = parseResult(checkConfig, result);

          healthData.env = envKey;
          healthData.url = checkConfig.url;
          healthData.id = checkConfig.id;
          return healthData;
        }).fail(function(message) {
          return {
            env: envKey,
            id: checkConfig.id,
            status: 'NOT OK',
            message: message
          };
        });
      });

    }));

    return Q.all(allChecks);

  };

  function checkHealthAndUpdateClients() {
    return checkAllEnvironments().then(function (environmentData) {

      var result = {};
      _.each(environmentData, function(data) {
        result[data.env] = result[data.env] || [];
        result[data.env].push(data);
      });

      return result;

    }).fail(function(error) {
      console.log("COULD NOT CHECK ENVIRONMENTS!", error);
      return {error: error};
    });

  }

  return {
    checkHealthAndUpdateClients: checkHealthAndUpdateClients
  }

}

exports.checkHealthAndUpdateClients = environmentReader().checkHealthAndUpdateClients;