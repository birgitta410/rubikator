
var GocdVisualiser = function(rubikVisualiser) {
  function processNewDataGocd(data) {
    console.log("data", data);
    if(_.isEmpty(data)) {
      return;
    }

    var container = $('.container');
    $('.build-row').remove();

    var cell = 0;
    var maxColumns = 3;
    var row = 0;
    _.each(data, function(pipelineState) {

      _.each(pipelineState.activity, function(activity) {

        if(cell % maxColumns === 0) {
          row++;
          $('<div class="box-row flexbox build-row" id="row' +row+ '"></div>').appendTo(container);
        }

        var boxText = pipelineState.pipeline + '::' + activity.name + '</br><span class="smaller">' +
          activity.info2 + (activity.gocdActivity ? ' (' + activity.gocdActivity + ')' : '') + '</span>' +
          '<span class="giphy"><img src="' + data[0].working +'"/></span>';

        var newBox = $(rubikVisualiser.createBoxHtmlInfo(boxText)).appendTo($('#row' + row));
        newBox.addClass(rubikVisualiser.randomColdColor());
        newBox.addClass('throb');
        cell ++;

      });

    });

    var historyIndex = 0;
    _.each(data, function(pipelineState) {

      _.each(_.compact(pipelineState.history.boxes), function(history) {
        if(cell % maxColumns === 0 || historyIndex === 0) {
          row++;
          $('<div class="box-row flexbox build-row" id="row' +row+ '"></div>').appendTo(container);
        }

        var boxText =
          '<u>' + pipelineState.pipeline + '</u>' +
          '</br>'+ history.summary.stageNotSuccessful + ' ' + history.summary.result +
          '</br>' +
          '<span class="giphy"><img src="' + data[0].fail +'"/></span>' +
          '<span class="smaller">' +
          history.summary.text.substr(0, 100) + (history.summary.text.length > 100 ? '...' : '') + '</br>' +
          '</span>';

        var newBox = $(rubikVisualiser.createBoxHtmlInfo(boxText)).appendTo($('#row' + row));
        newBox.addClass(rubikVisualiser.randomWarmColor());

        cell ++;
        historyIndex ++;
      });

    });

    if (row === 0) {
      row++;
      $('<div class="box-row flexbox build-row" id="row' +row+ '"></div>').appendTo(container);
      var newBox = $(rubikVisualiser.createBoxHtmlInfo('ALL GOOD <img src="' + data[0].success +'"/>')).appendTo($('#row' + row));
      newBox.addClass(rubikVisualiser.randomColdColor());
    }

    $('.giphy').each(function() {
      var parentHeight = $(this).parents('.box-wrapper').height();
      var parentWidth = $(this).parents('.box-wrapper').width();
      var parentRatio = parentWidth/parentHeight;
      var heightFactor = parentRatio > 3 ? 0.8 : 0.5;

      var giphy = $(this).find('img');
      giphy.attr("height", (parentHeight * heightFactor) + 'px');
    });

  }
  
  return {
    processNewData: processNewDataGocd
  };
};