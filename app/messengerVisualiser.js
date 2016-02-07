var MessengerVisualiser = function () {

  var messageRow = $('<div class="flex-column"></div>').prependTo($('.box-container'));
  messageRow.addClass('small');
  var contentDiv = $('<div class="message grey"><div></div></div>').appendTo(messageRow);
  messageRow.hide();

  function processMessenger(data) {
    console.log("MESSAGE", data, 'empty?', data === undefined || data === "");

    if (data === undefined || data === "" || data === "clear") {
      messageRow.hide();
    } else {
      messageRow.show();
      contentDiv.html(data);
    }

  }

  return {
    processNewData: processMessenger
  };
};