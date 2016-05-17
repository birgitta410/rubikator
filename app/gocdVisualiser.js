
var GocdVisualiser = function(rubikVisualiser) {

  var gocdDiv = rubikVisualiser.createNewColumn();
  gocdDiv.hide();

  function processNewDataGocd(gocdData) {
    console.log("data", gocdData);

    if(gocdData === undefined || gocdData.warning) {
      return;
    }

    var data = gocdData.historyAndActivity;
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

    // CURRENT ACTIVITY
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
          '<img class="gif float" src="' + data[0].working +'" loop="false"/>' +
          '<span class="heading">' + pipelineState.pipeline + '::' + activity.name + '</span>' +
          '</br><span>' +
          activity.info2 + (activity.gocdActivity ? ' (' + activity.gocdActivity + ')' : '')
          + '</span>';

        $('<div>' + boxText + '</div>').appendTo(newColumn);

        cell ++;

      });

    });

    var historyIndex = 0;
    // HISTORY
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
          '<img class="gif float" src="' + data[0].fail +'"/>' +
          '<span class="heading">' + pipelineState.pipeline + '</span>' +
          '</br>' +
          history.summary.result +
          '</br><span class="detail">Last success: ' +
          pipelineState.history.statistics.timeSinceLastSuccess.human +
          '</span></br><span class="detail">' + history.summary.text.substr(0, 65) + (history.summary.text.length > 65 ? '...' : '') + '</span>';

        $('<div>' + boxText + '</div>').appendTo(newColumn);

        cell ++;
        historyIndex ++;
      });

    });

    // ALL GOOD
    if (row === 0) {

      currentRow = rubikVisualiser.createNewRow(gocdDiv);
      var newColumn = rubikVisualiser.createNewColumn(currentRow);
      newColumn.addClass("content");
      newColumn.addClass(rubikVisualiser.randomColdColor());

      var boxText = '<h3>ALL GOOD</h3><img class="gif center" src="' + data[0].success +'"/>';
      $('<div>' + boxText + '</div>').appendTo(newColumn);

    }

    function resizeGifs() {
      // it's impossible to get the gif sizes right for all resolutions and box distributions with pure CSS
      var VERTICAL_ADJUSTMENT = 0.5;
      var HORIZONTAL_ADJUSTMENT = 0.9;

      $('.gif').each(function() {

        var parentBox = $(this).parents('.content');
        var parentMarginTop = parseInt(parentBox.css("margin-top")) || 0;

        var parentHeight = parentBox.height() - parentMarginTop;
        var parentWidth = parentBox.width();
        var parentRatio = parentBox.width()/parentBox.height();
        var isVertical = parentRatio <= 3;
        var heightAdjustmentFactor = isVertical ? VERTICAL_ADJUSTMENT : HORIZONTAL_ADJUSTMENT;

        var gifMargin = parseInt($(this).css("margin-top")) || 0;
        var newHeight = (parentHeight * heightAdjustmentFactor) - gifMargin - parentMarginTop;

        var enoughSpaceToCenter = isVertical && (newHeight * 2) < parentHeight;
        if(enoughSpaceToCenter) {
          $(this).removeClass("float");
          $(this).addClass("center");
        } else {
          $(this).removeClass("center");
          $(this).addClass("float");
        }

        var newWidth = newHeight * parentRatio;
        if(newWidth > parentWidth) {
          console.log("Calculated width is too wide!", newWidth, parentWidth);
          $(this).attr("width", parentWidth + 'px');
        } else {
          $(this).attr("height", newHeight + 'px');
        }

      });
    }

    resizeGifs();
    window.onresize = resizeGifs;

  }

  return {
    processNewData: processNewDataGocd
  };
};
