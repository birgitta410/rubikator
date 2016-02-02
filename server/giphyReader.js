var request = require('request');

var giphyReaderModule = (function() {

  var giphyCache = {};

  function getRandomGiphy(key, searchTerms) {
    var randomSearchTerm = searchTerms[Math.floor(Math.random()*searchTerms.length)];
    var requestOptions = {
      url: "http://api.giphy.com/v1/gifs/search?q=" + randomSearchTerm + "&api_key=dc6zaTOxFJmzC"
    };

    request(requestOptions, function (error, response, body) {
      if(error) {
        console.log('failed to get ' + requestOptions.url, error);
      } else {
        var giphyData = JSON.parse(body);
        var randomIndex = Math.floor(Math.random()*giphyData.data.length);
        var gifUrl = giphyData.data[randomIndex].images.fixed_height.url;
        giphyCache[key] = gifUrl;
      }
    });
  }

  function updateGiphySuccess() {
    getRandomGiphy('success', ['success', 'win', 'yippee', 'boss', 'wow', 'joy']);
  }

  function updateGiphyFail() {
    getRandomGiphy('fail', ['fail', 'failure', 'epic+fail', 'broken', 'sad']);
  }

  function updateGiphyWorking() {
    getRandomGiphy('working', ['working', 'busy', 'typing', 'timelapse']);
  }

  var GIPHY_UPDATE_IN_MINUTES = 10;
  updateGiphyFail();
  updateGiphySuccess();
  updateGiphyWorking();
  setInterval(updateGiphySuccess, GIPHY_UPDATE_IN_MINUTES * 60 * 1000);
  setInterval(updateGiphyFail, GIPHY_UPDATE_IN_MINUTES * 60 * 1000);
  setInterval(updateGiphyWorking, GIPHY_UPDATE_IN_MINUTES * 60 * 1000);

  return {
    getCache: function() {
      return giphyCache;
    }
  };

})();

exports.getCache = giphyReaderModule.getCache;