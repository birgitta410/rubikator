let blessed = require('blessed'),
  contrib = require('blessed-contrib'),
  gocdReader = require('../server/gocdReader'),
  _ = require("lodash"),
  pipeline = require('./pipeline-widget.js'),
  screen = blessed.screen({ log: 'log.log' });//, log: true });

screen.log("Let's get started!");

let actualConsole = console.log;
let myLog = function() {
  if(screen.program) {
      return screen.log.apply(screen, arguments);
  } else {
    actualConsole.apply(actualConsole, arguments);
  }

};
console.log = myLog;

let grid = new contrib.grid({
  rows: 3,
  cols: 1,
  screen: screen
});

let log = grid.set(0, 0, 1, 1, contrib.log, {
  fg: "green",
  selectedFg: "green",
  label: 'DATA FROM GO.CD'
});
screen.append(log);

let gaugeActivities = grid.set(1, 0, 1, 1, pipeline, {
  label: 'ACTIVITY',
  fill: 'black'
});
screen.append(gaugeActivities);

let gaugeHistory = grid.set(2, 0, 1, 1, pipeline, {
  label: 'HISTORY',
  fill: 'black'
});
screen.append(gaugeHistory);

screen.on('resize', function() {
  gaugeActivities.emit('attach');
  gaugeHistory.emit('attach');
  log.emit('attach');
});

function render(gocdData) {

  let data = gocdData.historyAndActivity;
  log.log("Data: " + JSON.stringify(data));

  let activities = _.chain(data)
    .map((pipelineState) => {
      return _.map(pipelineState.activity, (activity) => {
        activity.pipeline = pipelineState.pipeline;
        return activity;
      });
    })
    .flatten()
    .value();
  updateActivities(activities);

  let histories = _.chain(data)
    .map((pipelineState) => {
      return _.map(_.compact(pipelineState.history.boxes), (history) => {
        history.timeSinceLastSuccess = pipelineState.history.statistics.timeSinceLastSuccess.human;
        history.title = history.title || pipelineState.pipeline;
        return history;
      });
    })
    .flatten()
    .value();
  updateHistory(histories);

  screen.render();
}

function updateHistory(histories) {
  let stackColors = [[190, 221, 234], [138, 113, 150], [193, 177, 191]];

  var gaugeData = _.map(histories, function(history) {

      var lastSuccess = history.timeSinceLastSuccess
        ? ' (Last success: ' + history.timeSinceLastSuccess + ')'
        : '';

      var boxText =
        (history.title || pipelineState.pipeline) + ': ' + history.summary.result
        + lastSuccess
        + '\n' + history.summary.text.substr(0, 65) + (history.summary.text.length > 65 ? '...' : '');
      return {
        label: boxText,
        percent: 100/histories.length,
        stroke: stackColors[2]
      };
    });

  if(gaugeData.length === 0) {
    gaugeData = [
      {percent: 100, label: 'ALL GOOD!', stroke: stackColors[0]}
    ];
  }

  gaugeHistory.setStack(gaugeData);

}

function updateActivities(activities) {
  let stackColors = [[190, 221, 234], [138, 113, 150], [193, 177, 191]];

  let gaugeData = _.map(activities, (activity, index) => {
    screen.log("Percent", 100/activities.length);
    var boxText =
      activity.pipeline + '::' + activity.name + ' | '
      + activity.info2 + (activity.gocdActivity ? ' (' + activity.gocdActivity + ')' : '');
    return {
      percent: 100 / activities.length,
      stroke: stackColors[index],
      label: boxText
    }
  });

  if(gaugeData.length === 0) {
    gaugeData = [
      {percent: 100, label: 'no activity', stroke: stackColors[0]}
    ];
  }

  gaugeActivities.setStack(gaugeData);
}

function update() {
  gocdReader.getGocdData().then(render).done();
}

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

update();
setInterval(update, 5000);
