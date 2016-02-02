
var EnvironmentsVisualiser = function(rubikVisualiser) {

  var rowDiv = rubikVisualiser.createNewMainRow('row-environments');
  rowDiv.addClass('small');
  rowDiv.hide();

  function processNewDataEnvironments(data) {
    if(data.warning) {
      return;
    }

    rowDiv.show();
    rowDiv.empty();

    _.each(_.keys(data), function(envIdentifier) {

      function createStatusBox(environmentData, environmentDataKey) {

        var checkResult = environmentData[environmentDataKey];

        var color = checkResult.status === 'OK' ? 'green' : 'red';
        return '<div class="sub-status flex-box ' + color + '">' +
          checkResult.id + '</br>' +
          (checkResult.value || '-')+ '</div>';

      }

      rubikVisualiser.createRowsOfBoxesForEnvironment(rowDiv, data, envIdentifier, createStatusBox);

    });

    $(rubikVisualiser.createBoxHtmlInfo('ENVS', 'small default-color')).appendTo(rowDiv);

  }

  return {
    processNewData: processNewDataEnvironments
  };
};