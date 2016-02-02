
var RubikVisualisation = function() {

  var WARM_COLORS = ['red', 'yellow', 'pink', 'orange'];
  var COLD_COLORS = ['blue', 'dark-blue', 'purple'];
  function randomWarmColor(except) {
    var colors = _.without(WARM_COLORS, except);
    return colors[Math.floor(Math.random() * colors.length)];
  }
  function randomColdColor(except) {
    var colors = _.without(COLD_COLORS, except);
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function createBoxHtmlInfo(innerHtml, extraClasses) {
    extraClasses = extraClasses || '';
    return '<div class="box-wrapper ' +extraClasses+ '">' +
    '<div class="info">' +
      innerHtml +
    '</div>' +
    '</div>'
  }

  function createRowsOfBoxesForEnvironment(rootDiv, data, environmentId, createSubBox) {
    var environmentData = data[environmentId];

    var boxWrapper = $('<div class="box-wrapper flex-column environment-box default-color"></div>').appendTo(rootDiv);

    var flexRow = '<div class="sub-boxes flex-row flex-box"></div>';

    var cell = 0;
    var maxColumns = 3;
    var row = 0;

    $('<div class="flex-box environment-title">' + environmentId + '</div>').appendTo(boxWrapper);

    var currentRow;

    _.each(_.keys(environmentData), function(environmentDataKey) {
      if(cell % maxColumns === 0) {
        currentRow = $(flexRow).appendTo(boxWrapper);
        row ++;
      }
      var newBox = $(createSubBox(environmentData, environmentDataKey)).appendTo(currentRow);
      newBox.addClass('sub-status');
      newBox.addClass('flex-box');
      cell ++;
    });

  }

  function createBoxHtml(innerHtml, extraClasses) {
    extraClasses = extraClasses || '';
    return '<div class="box-wrapper ' +extraClasses+ '">' +
      innerHtml +
      '</div>'
  }

  function createNewMainRow(id) {
    return $('<div class="box-row flexbox" id="' + id + '"></div>').appendTo($('.container'));
  }

  return {
    randomColdColor: randomColdColor,
    randomWarmColor: randomWarmColor,
    createBoxHtmlInfo: createBoxHtmlInfo,
    createBoxHtml: createBoxHtml,
    createRowsOfBoxesForEnvironment: createRowsOfBoxesForEnvironment,
    createNewMainRow: createNewMainRow
  };

};


/***********************/

var rubikVis = new RubikVisualisation();

function onDataError(error) {
  $('#error-message').text(error);
  $('#error-message').show();
}

function onConnectionLost() {
  onDataError("connection to server lost");
}

var messenger = MessengerVisualiser(rubikVis);
var environments = EnvironmentsVisualiser(rubikVis);
var elk = ElkVisualiser(rubikVis);
var gocd = GocdVisualiser(rubikVis);

new DataSource('messenger', messenger.processNewData, onConnectionLost, onDataError);
new DataSource('environments', environments.processNewData, onConnectionLost, onDataError);
new DataSource('logs', elk.processNewData, onConnectionLost, onDataError);
new DataSource('gocd', gocd.processNewData, onConnectionLost, onDataError);

