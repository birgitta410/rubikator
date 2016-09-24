
const _ = require('lodash');
const Q = require('q');
const request = require('request');
const configReader = require('./ymlHerokuConfig');
const logger = require('./logger');
const moment = require('moment');

const elkReader = () => {

  const logsConfig = configReader.create('logs').get();

  const parseUrl = (urlPattern) =>
    urlPattern.replace('${date}', moment().format('YYYY.MM.DD'));

  const countLogs = (queryConfig, url, environment) => {
    const queryAddendum = environment.queryAddition;
    const environmentTarget = environment.targets ? environment.targets[queryConfig.id] : undefined;

    logger.debug('Sending query', JSON.stringify(queryConfig), 'to', url);
    const identifier = queryConfig.id;

    const defer = Q.defer();

    const requestOptions = {
      method: 'GET',
      body: JSON.stringify({
        query: {
          query_string: {
            query: queryConfig.query + (queryAddendum ? ' ' + queryAddendum : ''),
            analyze_wildcard: true
          }
        },
        filter: {
          range: {
            '@timestamp': {
              gte: queryConfig.timeSpan ? queryConfig.timeSpan : 'now-1h',
              lt: 'now'
            }
          }
        }
      }),
      url: parseUrl(url)
    };

    const targetIsMet = (totalHits) => {
      if(environmentTarget === undefined) {
        return undefined;
      }
      const range = (environmentTarget + '').split('-');
      if(range.length === 1) {
        return totalHits === Number(range[0]);
      } else if (range.length === 2 && range[1] === '*') {
        return totalHits >= Number(range[0]);
      } else if (range.length === 2) {
        return totalHits >= Number(range[0]) && totalHits <= Number(range[1]);
      }
      return undefined;
    };

    request(requestOptions, (error, response, body) => {
      if(error) {
        console.log('ERROR', 'failed to get ' + requestOptions.url, error);
        defer.resolve(undefined);
      } else {
        const result = JSON.parse(body);
        const metric = {};

        const totalHits = result.hits ? result.hits.total || 0 : '?';

        metric[identifier] = {
          hits: totalHits,
          description: queryConfig.description,
          type: queryConfig.type,
          target: environmentTarget,
          targetIsMet: targetIsMet(totalHits)
        };
        if(result.hits === undefined) {
          console.log('WARNING', 'No hits for', requestOptions.url, queryConfig.query);
        }
        defer.resolve(metric);
      }
    });
    return defer.promise;
  };

  const getData = () =>
    Q.all(_.map(logsConfig.environments, (environment) => {
      const url = environment.url;

      const queriesForEnvironment = environment.queries
        ? _.filter(logsConfig.queries, (query) => _.includes(environment.queries, query.id))
        : logsConfig.queries;

      const queryPromises = _.map(queriesForEnvironment, (queryConfig) => {
        return countLogs(queryConfig, url, environment);
      });

      return Q.all(queryPromises).then((metricsForEnvironment) => {
        let result = {};
        _.each(metricsForEnvironment, (metric) => {
          result = _.extend(result, metric);
        });

        const resultForOneEnvironment = {};
        resultForOneEnvironment[environment.id] = result;
        return resultForOneEnvironment;

      });
    })).then((envMetrics) => {
      let resultForAllEnvironments = {};
      _.each(_.compact(envMetrics), (envMetric) => {
        resultForAllEnvironments = _.extend(resultForAllEnvironments, envMetric);
      });
      return resultForAllEnvironments;
    }).fail((error) => {
      console.log('ERROR GETTING METRICS', error);
    });

  const getElkData = () => {
    return getData()
      .then((metricsData) => metricsData)
      .fail((error) => { return { error: error }; });
  };

  return {
    getElkData: getElkData
  };
};

exports.getElkData = elkReader().getElkData;
