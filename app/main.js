
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

  function createRowsOfBoxesForEnvironment(rootDiv, data, environmentId, contentAppender, maxColumns) {
    var environmentData = data[environmentId];
    maxColumns = maxColumns || 3;

    var outerColumn = $('<div class="flex-column"></div>').appendTo(rootDiv);
    $('<div class="flex-row details title small">' + environmentId + '</div>').appendTo(outerColumn);

    var flexRow = '<div class="flex-row"></div>';

    var cell = 0;
    var row = 0;

    var currentRow;

    _.each(_.keys(environmentData), function(environmentDataKey) {
      if(cell % maxColumns === 0) {
        currentRow = $(flexRow).appendTo(outerColumn);
        row ++;
      }
      var newBox = $('<div class="content flex-column detail"></div>').appendTo(currentRow);
      contentAppender(newBox, environmentData, environmentDataKey);

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
    return $('<div class="box-row flexbox" id="' + id + '"></div>').appendTo($('#container'));
  }

  function createNewRow(container) {
    return $('<div class="flex-row"></div>').appendTo(container || $('#container'));
  }

  function createNewColumn(container) {
    return $('<div class="flex-column"></div>').appendTo(container || $('#container'));
  }

  function createContentBoxSmall(parent) {
    return $('<div class="content flex-column detail"></div>').appendTo(parent);
  }

  return {
    randomColdColor: randomColdColor,
    randomWarmColor: randomWarmColor,
    createBoxHtmlInfo: createBoxHtmlInfo,
    createBoxHtml: createBoxHtml,
    createRowsOfBoxesForEnvironment: createRowsOfBoxesForEnvironment,
    createNewMainRow: createNewMainRow,
    createNewRow: createNewRow,
    createNewColumn: createNewColumn,
    createContentBoxSmall: createContentBoxSmall
  };

};


/***********************/

var rubikVis = new RubikVisualisation();

function onDataError(error) {
  $('#error-message').text("Rubikator error | " + error);
  $('#error-message').show();
  setTimeout(function () {
    $('#error-message').fadeOut();
  }, 30 * 1000);
}

function onConnectionLost() {
  onDataError("connection to server lost");
}

var messenger = MessengerVisualiser(rubikVis);
new DataSource('messenger', messenger.processNewData, onConnectionLost, onDataError);

var environments = EnvironmentsVisualiser(rubikVis);
new DataSource('environments', environments.processNewData, onConnectionLost, onDataError);

var elk = ElkVisualiser(rubikVis);
new DataSource('logs', elk.processNewData, onConnectionLost, onDataError);

var gocd = GocdVisualiser(rubikVis);
var gocdFocus = GocdFocusVisualiser(rubikVis);
function processGocd(data) {
  gocd.processNewData(data);
  gocdFocus.processNewData(data);
}
new DataSource('gocd', processGocd, onConnectionLost, onDataError);


// TODO: Rename GocdVisualiser to BuildStatusVisualiser
var teamcity = GocdVisualiser(rubikVis);
new DataSource('teamcity', teamcity.processNewData, onConnectionLost, onDataError);
