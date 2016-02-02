

var DataSource = function(identifier, onData, onConnectionLost, onError) {

  var LAST_PING = new Date();
  var PING_INTERVAL = 2 * 60 * 1000;

  var OPEN = false;

  function processMessage(event) {
    var data = JSON.parse(event.data);
    var statusMessage = $('#status-message');
    var statusProgress = $('#status-progress');
    if (data[identifier]) {
      statusMessage.hide();
      statusProgress.text('.');

      onData(data[identifier]);

    } else if(data.error) {
      console.log('ERROR', data.error);
      if(onError) {
        onError(data.error);
      }
    } else if (data.ping) {
      LAST_PING = new Date();
      console.log('ping success - still connected to server', LAST_PING);
    }
  }

  function initPing() {
    // Let server know we're still watching (Keep alive Heroku)
    function ping() {

      var timeSinceLastPing = new Date() - LAST_PING;
      if (timeSinceLastPing > (PING_INTERVAL * 1.1)) {
        console.log('Last successful ping too long ago', timeSinceLastPing);
        onConnectionLost();
        window.location = window.location;
      }

      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET", location.origin + '/alive', false);
      xmlHttp.send(null);

      try {
        ws.send('ping');
      } catch(error) {
        console.log("ERROR pinging", JSON.stringify(error));
      }

    }
    setInterval(ping, PING_INTERVAL);
  }


  var wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  var wsHost = wsProtocol + '//' + window.location.host;

  console.log("Starting to connect to", wsHost + '/' + identifier);
  var ws = new WebSocket(wsHost + '/' + identifier);
  ws.onmessage = function (event) {
    processMessage(event);
  };

  ws.onerror = function(error) {
    if(!OPEN) {
      console.log("could not open connection to", identifier, error);
    } else {
      onError(JSON.stringify(arguments));
    }
  };

  ws.onopen = function () {
    OPEN = true;
    console.log("Connection to ", identifier, "is open");
  };


  initPing();

};
