let blessed = require('blessed'),
  contrib = require('blessed-contrib'),
  gocdReader = require('../server/gocdReader'),
  _ = require("lodash"),
  pipeline = require('./pipeline-widget.js'),
  screen = blessed.screen({ log: 'log.log' });//, log: true });

screen.log("Let's get started: ", screen.program);

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
  rows: 2,
  cols: 1,
  screen: screen
});

let log = grid.set(0, 0, 1, 1, contrib.log, {
  fg: "green",
  selectedFg: "green",
  label: 'DATA FROM GO.CD'
});
screen.append(log);

let gauge = grid.set(1, 0, 1, 1, pipeline, {
  label: 'ACTIVITY',
  fill: 'black'
});
screen.append(gauge);

function render(gocdData) {

  let data = gocdData.historyAndActivity;
  let activities = _.chain(data)
    .map((pipelineState) => {
      pipelineState.activity.pipeline = pipelineState.pipeline;
      return pipelineState.activity;
    })
    .flatten()
    .value();

  log.log("Data: " + JSON.stringify(data));

  // =====================================

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

  gauge.setStack(gaugeData);
  screen.render();
}

function update() {
  gocdReader.getGocdData().then(render).done();
}

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

update();
setInterval(update, 5000);
