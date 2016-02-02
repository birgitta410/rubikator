
var ws = require('ws');
var https = require('https');
var http = require('http');
var express = require('express');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Q = require('q');
var configReader = require('./server/ymlHerokuConfig');

var messenger = require('./server/messenger');

function dashboardServer() {

  var WebSocketServer = ws.Server
    , app = express();

  var CHECK_FOR_CONFIG_FIRST = true;

  var UPDATE_INTERVAL = 10000;
  var USES_SSL = false;
  var port = process.env.PORT || 5555;

  function createServer() {
    var rootDir = path.resolve(path.dirname(module.uri));
    app.use(express.static(rootDir + '/app/'));

    try {
      var credentials = {
        key: fs.readFileSync('rubikator-key.pem'),
        cert: fs.readFileSync('rubikator-cert.pem')
      };
      USES_SSL = true;
      return https.createServer(credentials, app);
    } catch(couldNotReadKeyAndCert) {
      console.log("WARNING - could not use SSL, provide dashboard-key.pem and dashboard-cert.pem", JSON.stringify(couldNotReadKeyAndCert));
      return http.createServer(app);
    }

  }

  function webSocketDataSource(identifier, getDataToSendToClients, server, checkForConfigFirst) {

    function configureListener(wss) {
      wss.on('connection', function(ws) {
        console.log('A new client connecting to /' + identifier);

        function newClient() {

          function updateClient() {

            getDataToSendToClients().then(function (data) {
              var result = {};
              result[identifier] = data;
              try {
                ws.send(data.error ? JSON.stringify(data) : JSON.stringify(result));
              } catch(alreadyClosed) {
                console.log("WARNING - cannot send anymore, client might have closed connection", alreadyClosed);
              }
            }).done();
          }
          updateClient();
          var clientId = setInterval(updateClient, UPDATE_INTERVAL);
          return clientId;
        }

        var clientId = newClient();

        ws.on('message', function(msg) {
          if(msg === 'ping') {
            console.log('PING');
            ws.send(JSON.stringify({ping: 'success'}));
          }
        });

        ws.on('close', function() {
          console.log('websocket connection close on ' + ws.upgradeReq.url);
          clearInterval(clientId);
        });
      });
    }

    if(checkForConfigFirst && configReader.create(identifier).get() === undefined) {
      console.log("WARNING", "Skipping", identifier, "websocket, no configuration found");
      getDataToSendToClients = function() {
        return Q.resolve({ warning: identifier + ' NOT AVAILABLE, no configuration' });
      }
    }

    var wssEnvironments = new WebSocketServer({server: server, path: '/' + identifier });
    console.log('/' + identifier + ' websocket server created');
    configureListener(wssEnvironments);

  }

  var server = createServer();
  console.log((USES_SSL ? 'https' : 'http') + ' server listening on %d', port);

  webSocketDataSource('gocd', require('./server/gocdReader').getGocdData, server, CHECK_FOR_CONFIG_FIRST);
  webSocketDataSource('environments', require('./server/environmentReader').checkHealthAndUpdateClients, server, CHECK_FOR_CONFIG_FIRST);
  webSocketDataSource('logs', require('./server/elkReader').getElkData, server, CHECK_FOR_CONFIG_FIRST);
  webSocketDataSource('messenger', require('./server/messenger').getMessage, server);

  /** ENDPOINTS ************************/

  app.get('/alive',
    function(req, res) {
      console.log('life sign');
      res.send('OK');
    });

  app.get('/messenger',
    function(req, res) {
      console.log('message');
      if(req.query.message) {
        messenger.setNewMessage(req.query.message);
        res.send('Received message ' + req.query.message);
      } else {
        res.send('Please send a ?message')
      }

    });

  server.listen(port);

}

dashboardServer();
