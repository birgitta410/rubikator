var MessengerVisualiser = function (rubikVisualiser) {

  var messageRow = rubikVisualiser.createNewMainRow('row-message');
  messageRow.removeClass('box-row');
  messageRow.removeClass('flexbox');
  messageRow.hide();

  function processMessenger(data) {
    console.log("MESSAGE", data, 'empty?', data === undefined || data === "");

    if (data === undefined || data === "" || data === "clear") {
      messageRow.hide();
    } else {
      messageRow.show();
      messageRow.html(data);
    }

  }

  return {
    processNewData: processMessenger
  };
};