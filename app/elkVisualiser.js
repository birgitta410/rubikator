
var ElkVisualiser = function(rubikVisualiser) {
  var rowDiv = rubikVisualiser.createNewMainRow('row-metrics');
  rowDiv.addClass('medium');
  rowDiv.hide();

  function processNewDataLogs(data) {
    if(data.warning) {
      return;
    }

    rowDiv.show();
    rowDiv.empty();
    $(rubikVisualiser.createBoxHtmlInfo('LOGS', 'small default-color')).appendTo(rowDiv);

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

    function infoColor(numHits) {
      if (numHits >= 30) {
        return 'blue';
      } else if (numHits >= 50) {
        return 'dark-blue';
      } else {
        return "grey";
      }
    }

    _.each(_.keys(data), function(environmentId) {

      function createMetricBox(environmentData, environmentDataKey) {
        var queryId = environmentDataKey;

        var result = environmentData[queryId];
        var colorConverter = result.type === 'ERROR' ? errorColor : infoColor;

        return '<div class="' + colorConverter(result.hits) + '">' +
        result.description + '</br>' +
        '<span class="metric">' + result.hits + '</span>' +
        '</div>';
      }

      rubikVisualiser.createRowsOfBoxesForEnvironment(rowDiv, data, environmentId, createMetricBox);

    });

  }

  return {
    processNewData: processNewDataLogs
  };
};