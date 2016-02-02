
var Q = require('q');

var messenger = (function () {

  var currentMessage = '';

  function setNewMessage(message) {
    currentMessage = message;
  }

  function getMessage() {
    return Q.resolve(currentMessage);
  }

  return {
    getMessage: getMessage,
    setNewMessage: setNewMessage
  }

})();

exports.getMessage = messenger.getMessage;
exports.setNewMessage = messenger.setNewMessage;