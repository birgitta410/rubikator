
const _ = require('lodash');
const Q = require('q');
const request = require('request');
const configReader = require('./ymlHerokuConfig');
const logger = require('./logger');

const environmentReader = () => {

  const envs = configReader.create('environments').get();

  const checkUrl = (checkConfig) => {
    const defer = Q.defer();

    const requestOptions = {
      url: checkConfig.url,
      rejectUnauthorized: false,
      timeout: 10000
    };

    logger.debug('Checking', checkConfig.url);
    request(requestOptions, (error, response, body) => {
      if(error) {
        defer.reject(`failed to get ${requestOptions.url}`, error);
      } else {
        defer.resolve(body);
      }
    });
    return defer.promise;
  };

  const parseHealthCheck = (result, pattern) => {
    const buildVersionFromHealth = new RegExp(pattern, 'g');
    const matchBuildVersion = buildVersionFromHealth.exec(result);

    if(matchBuildVersion && matchBuildVersion.length >= 2) {
      return {
        value: matchBuildVersion[1],
        status: 'OK'
      };
    }

    return {
      status: 'NOT OK'
    };
  };

  const parseResult = (checkConfig, result) =>
    parseHealthCheck(result, checkConfig.pattern);

  const checkAllEnvironments = () => {
    const allChecks = _.flatten(_.map(_.keys(envs), (envKey) => {

      const checkUrls = envs[envKey];

      return _.map(checkUrls, (checkConfig) =>
        checkUrl(checkConfig).then((result) => {
          const healthData = parseResult(checkConfig, result);

          healthData.env = envKey;
          healthData.url = checkConfig.url;
          healthData.id = checkConfig.id;
          return healthData;
        }).fail((message) => {
          return {
            env: envKey,
            id: checkConfig.id,
            status: 'NOT OK',
            message: message
          };
        })
      );
    }));

    return Q.all(allChecks);

  };

  const checkHealthAndUpdateClients = () =>
    checkAllEnvironments().then((environmentData) => {

      const result = {};
      _.each(environmentData, (data) => {
        result[data.env] = result[data.env] || [];
        result[data.env].push(data);
      });

      return result;

    }).fail((error) => {
      console.log('COULD NOT CHECK ENVIRONMENTS!', error);
      return { error: error };
    });

  return {
    checkHealthAndUpdateClients: checkHealthAndUpdateClients
  };

};

exports.checkHealthAndUpdateClients = environmentReader().checkHealthAndUpdateClients;
