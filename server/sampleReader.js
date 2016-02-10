
var Q = require('q');
var configReader = require('./ymlHerokuConfig');

var sampleDataSource = (function () {

  var sampleConfig = configReader.create('sample').get();

  function readDataForClients() {
    return Q.resolve({
      test: [
        sampleConfig["test"].value + ' box 1', // box 1
        sampleConfig["test"].value + ' box 2'// box 1
      ],
      qa: [
        sampleConfig["qa"].value
      ]
    });
  }

  return {
    readDataForClients: readDataForClients
  };

  // Add source to rubikator like this:
  //webSocketDataSource('sample', require('./server/sampleReader').readDataForClients, server, CHECK_FOR_CONFIG_FIRST);

})();

exports.readDataForClients = sampleDataSource.readDataForClients;