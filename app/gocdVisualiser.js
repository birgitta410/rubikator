
var GocdVisualiser = function(rubikVisualiser) {

  var gocdDiv = rubikVisualiser.createNewColumn();
  gocdDiv.hide();

  function processNewDataGocd(data) {
    console.log("data", data);
    if(_.isEmpty(data)) {
      return;
    }

    gocdDiv.show();
    gocdDiv.empty();
    $('<div class="category horizontal"><div>BUILD</div></div>').appendTo(gocdDiv);

    var cell = 0;
    var maxColumns = 2;
    var row = 0;
    var currentRow;
    _.each(data, function(pipelineState) {

      _.each(pipelineState.activity, function(activity) {

        if(cell % maxColumns === 0) {
          row++;
          currentRow = rubikVisualiser.createNewRow(gocdDiv);
        }

        var newColumn = rubikVisualiser.createNewColumn(currentRow);
        newColumn.addClass("content");
        newColumn.addClass('throb');
        newColumn.addClass(rubikVisualiser.randomColdColor());

        var boxText =
          '<span class="heading">' + pipelineState.pipeline + '::' + activity.name + '</span>' +
          '<img src="' + data[0].working +'"/>' +
          '</br>' +
          activity.info2 + (activity.gocdActivity ? ' (' + activity.gocdActivity + ')' : '');

        $('<div>' + boxText + '</div>').appendTo(newColumn);

        cell ++;

      });

    });

    var historyIndex = 0;
    _.each(data, function(pipelineState) {

      _.each(_.compact(pipelineState.history.boxes), function(history) {
        if(cell % maxColumns === 0 || historyIndex === 0) {
          row++;
          currentRow = rubikVisualiser.createNewRow(gocdDiv);
        }

        var newColumn = rubikVisualiser.createNewColumn(currentRow);
        newColumn.addClass("content");
        newColumn.addClass(rubikVisualiser.randomWarmColor());

        var boxText =
          '<span class="heading">' + pipelineState.pipeline + '</span>' +
          '<img src="' + data[0].fail +'"/>' +
          '</br>' +
          history.summary.result +
          '</br><span class="detail">' + history.summary.text.substr(0, 65) + (history.summary.text.length > 65 ? '...' : '') + '</span>';

        $('<div>' + boxText + '</div>').appendTo(newColumn);

        cell ++;
        historyIndex ++;
      });

    });

    if (row === 0) {

      currentRow = rubikVisualiser.createNewRow(gocdDiv);
      var newColumn = rubikVisualiser.createNewColumn(currentRow);
      newColumn.addClass("content");
      newColumn.addClass(rubikVisualiser.randomColdColor());

      var boxText = '<img src="' + data[0].success +'"/>ALL GOOD';
      $('<div>' + boxText + '</div>').appendTo(newColumn);

      //$('<div class="box-row flexbox build-row" id="row' +row+ '"></div>').appendTo(container);
      //var newBox = $(rubikVisualiser.createBoxHtmlInfo('ALL GOOD <img src="' + data[0].success +'"/>')).appendTo($('#row' + row));
      //newBox.addClass(rubikVisualiser.randomColdColor());
    }

    //$('.giphy').each(function() {
    //  var parentHeight = $(this).parents('.box-wrapper').height();
    //  var parentWidth = $(this).parents('.box-wrapper').width();
    //  var parentRatio = parentWidth/parentHeight;
    //  var heightFactor = parentRatio > 3 ? 0.8 : 0.5;
    //
    //  var giphy = $(this).find('img');
    //  giphy.attr("height", (parentHeight * heightFactor) + 'px');
    //});

  }
  
  return {
    processNewData: processNewDataGocd
  };
};