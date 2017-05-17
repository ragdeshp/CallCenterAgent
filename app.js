/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/*eslint-env browser */
/*globals CanvasJS */
'use strict';

require('dotenv').config({
	silent : true
});

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var watson = require('watson-developer-cloud'); // watson sdk
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
const util = require('util');

var vcapServices = require('vcap_services');
var cloudant_credentials = vcapServices.getCredentials("cloudantNoSQLDB");

//details for chatlog
var conversationTranscript= new Array();
var conversationTranscript1 = new Array();
var predictiveResults = new Array();
var phonenumber="";
var logsessionid="";

var url = require('url'), bodyParser = require('body-parser'),
	http = require('http'),
	https = require('https'),
	numeral = require('numeral');

var bankingServices = require('./banking_services');

var CONVERSATION_USERNAME = '',
	CONVERSATION_PASSWORD = '',
	TONE_ANALYZER_USERNAME = '',
	TONE_ANALYZER_PASSWORD = '';

var WORKSPACE_ID = 'a00e0470-bd7c-43cd-bb51-69aeb0e9c00e';

var LOOKUP_BALANCE = 'balance';
var LOOKUP_TRANSACTIONS = 'transactions';

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//credentials
var conversation_credentials = vcapServices.getCredentials('conversation');

// Create the service wrapper
var conversation = watson.conversation({
	url : 'https://gateway.watsonplatform.net/conversation/api',
	username : '909905f6-2017-4472-a78d-abf2108bcfe6',
	password : 'VqNzUbdWNkIV',
	version_date : '2016-07-11',
	version : 'v1'
});

/********* R&R *************/
var rnr= require('watson-developer-cloud/retrieve-and-rank/v1');

var retrieve = new rnr({
  password: "F4RvQUACbggV",
  username: "0d5b9112-4a7b-4fc9-b3dc-9c17dc290fbc"
});

var solrClient = retrieve.createSolrClient({
  cluster_id: 'sca3657a02_1eff_413b_af04_a2f41751c94d',
  collection_name: 'Ideacollection',
  wt: 'json'
});



// Endpoint to be called from the client side
app.post('/api/message', function(req, res) {
	var workspace = process.env.WORKSPACE_ID || WORKSPACE_ID;

	if ( !workspace || workspace === '<workspace-id>' ) {
		return res.json( {
		  'output': {
			'text': 'Your app is running but it is yet to be configured with a <b>WORKSPACE_ID</b> environment variable. '+
					'These instructions will be provided in your lab handout <b>on the day of your lab.</b>'
			}
		} );
	}
bankingServices.getPerson(7829706, function(err, person){

		if(err){
			console.log('Error occurred while getting person data ::', err);
			return res.status(err.code || 500).json(err);
		}

		var payload = {
			workspace_id : workspace,
			context : {
				'person' : person,
				'onload' : 'true'
			},
			input : {},
			userContext : {},
			output:
			   { log_messages: [],
			     text: [ ],
			     nodes_visited: [ ] }
		};

		if (req.body) {
			if (req.body.input) {
				payload.input = req.body.input;
			}
			if (req.body.context) {
				// The client must maintain context/state
				payload.context = req.body.context;
			}
			if (req.body.userContext) {
				// The client must maintain userContext
				payload.userContext = req.body.userContext;
			}

		}
   callconversation(payload);

	});


	// Send the input to the conversation service
	function callconversation(payload) {
				conversation.message(payload, function(err, data) {
				if (err) {
					return res.status(err.code || 500).json(err);
				}else{
					//lookup actions
					data.userContext = payload.userContext;
					checkForLookupRequests(res, data, function(err, data){
						if (err) {
							return res.status(err.code || 500).json(err);
						}else{
							var consoleStr = {};
							consoleStr.intent = data.intents;
							conversationTranscript.push(consoleStr);
							return res.json(data);
						}
					});
				}
			});
	}
});

/**
*
* Looks for actions requested by conversation service and provides the requested data.
*
**/
function checkForLookupRequests(res, data, callback){

	var responseTxtAppend = '';
		var workspace = process.env.WORKSPACE_ID || WORKSPACE_ID;
	    var payload = {
			workspace_id : workspace,
			context : data.context,
			input : data.input
		}

		//conversation requests a data lookup action
		if(data.context.onload === 'true'){
			data.context.onload = 'false';
			//var cloudant = require('cloudant')("https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix:30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61@daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com");
			//var db = cloudant.use("chatrecord");
			var out = [];
			var myNewArray3 = [];
			Array.prototype.contains = function(obj) {
					var i = this.length;
					while (i--) {
							if (this[i] === obj) {
									return true;
							}
					}
					return false;
			}
			var restler = require('restler');
			restler.get('https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com:443/chatrecord/_all_docs?include_docs=true', {
			    username: 'daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix',
			    password: '30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61'
			}).on('complete', function(data1, response) {
				var rowslength = data1.rows.length;
				//console.log("data1--"+util.inspect(data1, false, null));
				for(var i=0; i < rowslength; i++) {
					var chattranscriptlength = data1.rows[i].doc.chattranscript.length;
					//console.log("chattranscriptlength--"+chattranscriptlength);
					for(var j=0; j<chattranscriptlength;j++)
						{
						if(data1.rows[i].doc.chattranscript[j].intent.length !==0 && (data1.rows[i].doc.chattranscript[j].customerId === data.context.person.customer_id))
						conversationTranscript1.push(data1.rows[i].doc.chattranscript[j].intent);
						}
				}


				var arrValues = ["NetworkFailure","DataPackIssue"];
				for (var i = 0; i < conversationTranscript1.length; ++i) {
				  for (var j = 0; j < conversationTranscript1[i].length; ++j)
					  {
					  if(arrValues.contains(conversationTranscript1[i][j].intent))
						  {
						  	myNewArray3.push(conversationTranscript1[i][j]);
						  	break;
						  }
					  }
				}
			//console.log("conversationTranscript1::"+ JSON.stringify(conversationTranscript1));

				myNewArray3.push(conversationTranscript1)

//			var sl = myNewArray3;
//			for (var i = 0, l = sl.length; i < l; i++) {
//			      var unique = true;
//			      for (var j = 0, k = out.length; j < k; j++) {
//
//			          if ((sl[i].intent === out[j].intent) && (sl[i].confidence === out[j].confidence)) {
//			              unique = false;
//			          }
//			      }
//			      if (unique) {
//			          out.push(sl[i].intent);
//			      }
//			  }

					var queryString = myNewArray3[0].intent;
				//console.log("queryString"+util.inspect(queryString, false, null));
					// search documents
					var query = solrClient.createQuery().q(queryString).rows(3);
								//query.q({ '*' : '*' });
								solrClient.get('fcselect', query, function(err, searchResponse) {
								  if(err) {
								    console.log('Error searching for documents: ' + err);
								    responseTxtAppend = 'Sorry, currently I am unable to respond for this.';
								  } else {
								    console.log('Found ' + searchResponse.response.numFound + ' document(s).');
								    //console.log('Document(s): ' + JSON.stringify(searchResponse.response.docs, null, 2));
								    //responseTxtAppend = 'Here are some relevant information for your query.<br/>';

								    for(var k=0 ; k< searchResponse.response.numFound; k++)
								    	{
								    	data.output.text.push(searchResponse.response.docs[k].contentHtml);
								    	}
								    return res.json(data);
								  }
							});
			//console.log("Out of Cloudant");
			});
		}
		else{
			//console.log("data.userContext--"+data.userContext);
			if(data.userContext === "textInput1")
			{
				var rnr1= require('watson-developer-cloud/retrieve-and-rank/v1');

				var retrieve1 = new rnr({
				  password: "8zoXiMiUkrmg",
				  username: "ab42db4f-a431-45c2-ab9a-46a4c27a60e7"
				});

				var solrClient1 = retrieve1.createSolrClient({
				  cluster_id: 'sc5178208c_605d_41f3_8657_b925477ce410',
				  collection_name: 'AgentChatBot',
				  wt: 'json'
				});

				var queryString = data.input;
				//console.log("data input"+ queryString);
				//console.log("queryString"+util.inspect(queryString, false, null));
				// search documents
				var query = solrClient1.createQuery().q(queryString).rows(3);
							//query.q({ '*' : '*' });
							solrClient1.get('fcselect', query, function(err, searchResponse) {
								if(err) {
									console.log('Error searching for documents: ' + err);
									responseTxtAppend = 'Sorry, currently I am unable to respond for this.';
								} else {
									console.log('Found ' + searchResponse.response.numFound + ' document(s).');
									//console.log('Document(s): ' + JSON.stringify(searchResponse.response.docs, null, 2));
									//responseTxtAppend = 'Here are some relevant information for your query.<br/>';

									for(var k=0 ; k< searchResponse.response.numFound; k++)
										{
										data.output.text.push(searchResponse.response.docs[k].contentHtml);
										}
									return res.json(data);
								}
						});
			}else {
				callback(null, data);
				return;
			}

		}
}
module.exports = app;
