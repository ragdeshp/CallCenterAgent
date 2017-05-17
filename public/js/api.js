// The Api module is designed to handle all interactions with the server

var Api = (function() {
  var requestPayload;
  var responsePayload;
  var messageEndpoint = '/api/message';
  var context;

  // Publicly accessible methods defined
  return {

     sendRequest: sendRequest,
     view: view,
    //logChat: logChat,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr, userContext) {
      requestPayload = JSON.parse(newPayloadStr);
      context = userContext;
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr, userContext) {
      responsePayload = JSON.parse(newPayloadStr);
      context = userContext
    }
  };

  // Send a message request to the server
  function sendRequest(text, context, myUserContext) {
    // Build request payload
    var payloadToWatson = {};
    var userContext ;
    if (text) {
      payloadToWatson.input = {
        text: text
      };
    }
    if (context) {
      payloadToWatson.context = context;
    }
     if(myUserContext)
     {
       userContext = myUserContext;
       payloadToWatson.userContext = myUserContext;
     }

    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {

      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        Api.setResponsePayload(http.responseText, userContext);
      }

    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      Api.setRequestPayload(params, userContext);
    }

    // Send request
    http.send(params);
  }

  /*function logChat(logString)
  {
  	// Built http requestvar payloadToWatson = {};

     var payloadTolog = {"text":logString};

    var http = new XMLHttpRequest();
    http.open('POST', '/api/log', true);
    http.setRequestHeader('Content-type', 'application/json');

    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
      }
    };
     var params = JSON.stringify(payloadTolog);
    // Send request
    http.send(params);
  }*/

  function view()
  {
	  //var payloadTolog = {"text":logString};
    var params = {};
    var http = new XMLHttpRequest();
    http.open('POST', '/api/view');
    http.setRequestHeader('Content-type', 'application/json');

    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
      }
    };
     //var params = JSON.stringify(payloadTolog);
    // Send request
    //http.send(params);
    http.send(params);
  }
}

());
