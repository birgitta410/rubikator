var _ = require("lodash");

function loggerModule() {

  function isDebugActivated() {
    return process.env.DEBUG === "true" || false;
  }

  var info = console.log;

  var error = console.error;

  var debug = function() {
    if(isDebugActivated()) {
      console.log(arguments);
    }
  };

  return {
    info: info,
    debug: debug,
    error: error
  }

}

module.exports = _.extend(module.exports, loggerModule());
