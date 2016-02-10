
var SampleVisualiser = function(rubikVisualiser) {

  var MAX_COLUMNS = 1;

  var sampleInfoDiv = rubikVisualiser.createNewColumn();
  sampleInfoDiv.addClass('small'); // add small or medium to indicate how wide the column for this is
  sampleInfoDiv.hide();

  // This will be called every time the 'sample' websocket receives data
  function processNewDataSample(data) {
    if(data.warning) {
      return;
    }

    sampleInfoDiv.show();
    sampleInfoDiv.empty();
    $('<div class="category horizontal"><div>SAMPLE INFO</div></div>').appendTo(sampleInfoDiv);

    // Example: What to do if your server data is organised by environment keys
    // { test: { ... }, qa: { ... }
    _.each(_.keys(data), function(envIdentifier) {

      function createSampleInfoBox(outerBox, environmentData, environmentDataKey) {
        var environmentValue = environmentData[environmentDataKey];
        $('<div>' + environmentValue + '</div>').appendTo(outerBox);
        outerBox.addClass('blue');
      }

      rubikVisualiser.createRowsOfBoxesForEnvironment(sampleInfoDiv, data, envIdentifier, createSampleInfoBox, MAX_COLUMNS);

    });

  }

  // Add visualisation to main.js like this, and it will be connected to sampleReader data:
  // new DataSource('sample', SampleVisualiser(rubikVis).processNewData, onConnectionLost, onDataError);

  return {
    processNewData: processNewDataSample
  };
};