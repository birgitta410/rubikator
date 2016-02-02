
var path = require('path');
var yaml_config = require('node-yaml-config');
var _ = require('lodash');

function ymlHerokuConfigModule() {

  var HEROKU_VARS_SUPPORT = [
    'user', 'password', 'url', 'pipeline', 'stages', 'key', 'secret', 'account', 'debug', 'dangerZones', 'acceptableTimeFailed', 'timeDiff'
  ];

  var create = function (configKey) {

    var config;
    var id = configKey;

    init();

    var get = function () {
      return config[id];
    };

    function init() {

      try {
        config = yaml_config.load('config.yml');
      } catch (err) {
        console.log('could not read yml, trying Heroku vars', err);

        config = {};
        config[id] = {};
        _.each(HEROKU_VARS_SUPPORT, function(varName) {
          config[id][varName] = process.env[id.toUpperCase() + '_' + varName.toUpperCase()];
        });

        if(config[id].stages) {
          config[id].stages = config[id].stages.split(',');
        }

        if (!config[id].user || !config[id].password || !config[id].url) {
          console.log('ERROR: Not enough values in ' + id + ' config, cannot get data');
        }

      }

    }

    return {
      get: get
    };
  };

  return {
    create: create
  };
}

exports.create = ymlHerokuConfigModule().create;
