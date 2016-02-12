
var ElkVisualiser = function(rubikVisualiser) {

  var elkDiv = rubikVisualiser.createNewColumn();
  elkDiv.addClass('medium');
  elkDiv.hide();


  function processNewDataLogs(data) {
    if(data.warning) {
      return;
    }

    elkDiv.show();
    elkDiv.empty();
    $('<div class="category horizontal"><div>LOGS</div></div>').appendTo(elkDiv);

    function errorColor(numErrors) {
      if (numErrors === 0) {
        return 'green';
      } else if (numErrors <= 10) {
        return 'yellow';
      } else if (numErrors <= 20) {
        return 'pink throb'
      } else {
        return 'red throb';
      }
    }

    function infoColor(numHits, targetIsMet) {
      if(targetIsMet === true) {
        return 'dark-green';
      } else if(targetIsMet === false) {
        return 'yellow';
      } else if (numHits >= 30) {
        return 'blue';
      } else if (numHits >= 50) {
        return 'dark-blue';
      } else {
        return "grey";
      }
    }

    _.each(_.keys(data), function(environmentId) {

      function appendMetrics(outerBox, environmentData, environmentDataKey) {
        var queryId = environmentDataKey;

        var result = environmentData[queryId];
        var colorConverter = result.type === 'ERROR' ? errorColor : infoColor;

        outerBox.addClass(colorConverter(result.hits, result.targetIsMet));
        $('<div><span class="metric-description">' + result.description + '</span></br><span class="metric">' + result.hits + '</span></div>').appendTo(outerBox);
      }

      rubikVisualiser.createRowsOfBoxesForEnvironment(elkDiv, data, environmentId, appendMetrics, 4);

    });

  }

  return {
    processNewData: processNewDataLogs
  };
};