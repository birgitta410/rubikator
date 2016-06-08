
var http = require('http');
var _ = require('lodash');
var Q = require('q');
var request = require('request');
var configReader = require('./ymlHerokuConfig');
var logger = require('./logger');

function kubeReader() {

  var kubeConfig = configReader.create('kube').get();

  function callKubeApi(podInfo, path) {
    var defer = Q.defer();

    var requestOptions = {
      url: podInfo.url + path,
      rejectUnauthorized: false,
      timeout: 10000
    };

    logger.debug("Checking", podInfo.url);
    request(requestOptions, function (error, response, body) {
      if(error) {
        defer.reject('failed to get ' + requestOptions.url, error);
      } else {
        defer.resolve(JSON.parse(body));
      }
    });

    return defer.promise;

  }

  function getPodsList(podInfo) {
    return callKubeApi(podInfo, "/api/v1/namespaces/" + podInfo.configName + "/pods/");
  }

  function getPodInfo(podInfo, podName) {
    console.log("trying to get status of pod", podName);
    return callKubeApi(podInfo, "/api/v1/namespaces/" + podInfo.configName + "/pods/" + podName);
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
    var allChecks = _.flatten(_.map(_.keys(kubeConfig), function(envKey) {

      var checkPodsForEnv = kubeConfig[envKey];

      return _.map(checkPods, function(podConfig) {
        podConfig.configName = checkPodsForEnv.configName;
        podConfig.url = checkPodsForEnv.url;
        return getPodsList(podConfig).then(function(allPodsInfo) {
          var targetPodLabel = podInfo.id;
          var targetPodInfo = _.filter(allPodsInfo.items, function(item) {
            return item.metadata
              && item.metadata.labels
              && item.metadata.labels.name === "targetPodName";
          }

          return getPodInfo(podConfig, targetPodInfo.metadata.name).then(function() {
            healthData.env = envKey;
            healthData.url = podInfo.url;
            healthData.id = podInfo.id;
            return healthData;
          });


        }).fail(function(message) {
          return {
            env: envKey,
            id: podInfo.id,
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

exports.checkHealthAndUpdateClients = kubeReader().checkHealthAndUpdateClients;
