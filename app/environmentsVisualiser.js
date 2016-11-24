
var EnvironmentsVisualiser = function(rubikVisualiser) {

  var environmentsDiv = rubikVisualiser.createNewColumn();
  environmentsDiv.addClass('small');
  environmentsDiv.hide();

  function processNewDataEnvironments(data) {
    if(data.warning) {
      return;
    }

    environmentsDiv.show();
    environmentsDiv.empty();
    $('<div class="category horizontal"><div>ENVS</div></div>').appendTo(environmentsDiv);

    _.each(_.keys(data), function(envIdentifier) {

      function createStatusBox(outerBox, environmentData, environmentDataKey) {

        var checkResult = environmentData[environmentDataKey];

        var color = checkResult.status === 'OK' ? 'green' : 'red';
        outerBox.addClass(color);
        $('<div>' +
          checkResult.id + '</br><div class="flex-row metric">' +
          (rubikVisualiser.textToSvgs(checkResult.value) || '-')+ '</div></div>').appendTo(outerBox);

      }

      rubikVisualiser.createRowsOfBoxesForEnvironment(environmentsDiv, data, envIdentifier, createStatusBox, 2);

    });

  }

  return {
    processNewData: processNewDataEnvironments
  };
};
