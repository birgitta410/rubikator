
var GocdFocusVisualiser = function(rubikVisualiser) {

  var gocdFocusDiv = rubikVisualiser.createNewColumn();
  gocdFocusDiv.addClass('small');
  gocdFocusDiv.hide();
  
  function processNewDataGocd(gocdData) {
    console.log("data", gocdData);

    if(gocdData === undefined || gocdData.warning) {
      return;
    }

    var data = gocdData.focus;
    if(_.isEmpty(data)) {
      return;
    }


    gocdFocusDiv.show();
    gocdFocusDiv.empty();

    var focusedStageName = data[0].name;
    $('<div class="category horizontal"><div>' + focusedStageName + '</div></div>').appendTo(gocdFocusDiv);


    var outerColumn = $('<div class="flex-column"></div>').appendTo(gocdFocusDiv);
    //$('<div class="flex-row details title small">' + environmentId + '</div>').appendTo(outerColumn);

    var flexRow = '<div class="flex-row"></div>';

    _.each(data, function(stageData) {

      var currentRow = $(flexRow).appendTo(outerColumn);

      var newBox = $('<div class="content flex-column detail"></div>').appendTo(currentRow);
      var color = stageData.result === 'Passed' ? 'green' : 'red';
      newBox.addClass(color);
      $('<div>' + stageData.result + '</br>' + stageData.label + '</br>').appendTo(newBox);

    });


  }

  return {
    processNewData: processNewDataGocd
  };
};
