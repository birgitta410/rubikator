
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

    function errorColor(numErrors, critical) {
      if(critical === true) {
        return 'red throb';
      } else if(critical === false) {
        return 'pink';
      } else if (numErrors === 0) {
        return 'green';
      } else if (numErrors <= 10) {
        return 'pink';
      } else if (numErrors <= critical) {
        return 'pink throb'
      } else {
        return 'red throb';
      }
    }

    function warnColor(numHits) {
      if(numHits < 10) {
        return 'grey';
      } else {
        return 'yellow';
      }
    }

    function infoColor(numHits, targetIsMet) {
      if(targetIsMet === true) {
        return 'dark-green';
      } else if(targetIsMet === false) {
        return 'orange';
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
        if(result.type === 'WARN') {
          colorConverter = warnColor;
        }

        outerBox.addClass(colorConverter(result.hits, result.targetIsMet));
        $('<div><span class="metric-description">' + result.description + '</span></br>' +
          '<span class="metric">' + result.hits + '</span></div>').appendTo(outerBox);
      }

      rubikVisualiser.createRowsOfBoxesForEnvironment(elkDiv, data, environmentId, appendMetrics, 3);

    });

  }

  return {
    processNewData: processNewDataLogs
  };
};
