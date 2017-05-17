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

//var cloudant = require('cloudant')("https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix:30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61@daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com");

//var cloudant = Cloudant({url:"https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix:30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61@daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com"});

//var cloudant = Cloudant({
//		account: "daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com",
//		key: "daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix",
//		password: "30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61"});
//express.use(bodyParser.json());
//express.use(bodyParser.urlencoded({
//  extended: true
//}));

//var db = cloudant.db.use("chatrecord");




//var mongoose = require('mongoose');

/*mongoose.connect('mongodb://localhost:27017/chat', function(err){
	if(err)
		{
		console.log(err);
		}else{
			console.log("connected to mongodb");
		}
});

var Schema = mongoose.Schema;

var chatSchema = new Schema({
	  name: String,
	  phonemunber: String,
	  issue: String,
	  location: String,
	  created_at: Date
});

var Chat = mongoose.model('Chat', chatSchema);*/


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

		}
		
//		if(data.context.onload === 'true'){
//		checkForLookupRequests(payload, function(err, data){
//			if (err) {
//				return res.status(err.code || 500).json(err);
//			}else{
//
//				var consoleStr = {};
//				//consoleStr.input = data.input;
//				consoleStr.intent = data.intents;
//				//console.log('consoleStr --' + consoleStr.intent);
//				//consoleStr.output = data.output.text[0];
//
//				//phonenumber = data.output.context.phonenumber;
//
//				conversationTranscript.push(consoleStr);
//				//var convTranscript = JSON.stringify(conversationTranscript)
//				//console.log("Intent in the var "+JSON.stringify(conversationTranscript));
//				console.log("look up actions done");
//				return res.json(data);
//			}
//		});
//		}
		callconversation(payload);
	
	});
	

	// Send the input to the conversation service
	function callconversation(payload) {
		var query_input = JSON.stringify(payload.input);
		var context_input = JSON.stringify(payload.context);
				conversation.message(payload, function(err, data) {
					//console.log("data after call to conversation"+util.inspect(data, false, null))
				if (err) {
					return res.status(err.code || 500).json(err);
				}else{
					//console.log('conversation.message :: ',JSON.stringify(data));
					
					//return res.send();

					//lookup actions 
					console.log("Before checkForLookupRequests");
					checkForLookupRequests(res, data, function(err, data){
						if (err) {
							console.log("Inside checkForLookupRequests if err");
							return res.status(err.code || 500).json(err);
						}else{
							console.log("Inside checkForLookupRequests else");
							var consoleStr = {};
							//consoleStr.input = data.input;
							consoleStr.intent = data.intents;
							//console.log('consoleStr --' + consoleStr.intent);
							//consoleStr.output = data.output.text[0];
			
							//phonenumber = data.output.context.phonenumber;

							conversationTranscript.push(consoleStr);
							const util = require('util');
							//var convTranscript = JSON.stringify(conversationTranscript)
							//console.log("Intent in the var "+JSON.stringify(conversationTranscript));
							//console.log("look up actions done");
							console.log("data before res.json"+util.inspect(data, false, null));
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
	//console.log('checkForLookupRequests');
	const util = require('util');
	//console.log("data in checkForLookupRequests"+util.inspect(data, false, null))
	
	//if(data.context && data.context.action && data.context.action.lookup && data.context.action.lookup!= 'complete'){
		var workspace = process.env.WORKSPACE_ID || WORKSPACE_ID;
	    var payload = {
			workspace_id : workspace,
			context : data.context,
			input : data.input
		}
		
	    
		//conversation requests a data lookup action
		if(data.context.onload === 'true'){
			data.context.onload = 'false';
			console.log('************** R&R *************** InputText : ');
			
			////////////////////////////////////////////
			var cloudant = require('cloudant')("https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix:30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61@daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com");
			var db = cloudant.use("chatrecord");
			var out = [];
			
			var restler = require('restler');
			restler.get('https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com:443/chatrecord/_all_docs?include_docs=true', {
			    username: 'daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix',
			    password: '30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61'
			}).on('complete', function(data1, response) {
				  //console.log(response.headers);
				//console.log("Intent after read "+util.inspect(data, false, null));

				var rowslength = data1.rows.length;
				
				for(var i=0; i < rowslength; i++) {
					var chattranscriptlength = data1.rows[i].doc.chattranscript.length;
					for(var j=0; j<chattranscriptlength;j++)
						{
						if(data1.rows[i].doc.chattranscript[j].intent.length !==0)
						conversationTranscript1.push(data1.rows[i].doc.chattranscript[j].intent);
						}
					
				}
				var myNewArray3 = [];
				for (var i = 0; i < conversationTranscript1.length; ++i) {
				  for (var j = 0; j < conversationTranscript1[i].length; ++j)
				    myNewArray3.push(conversationTranscript1[i][j]);
				}

				  
				  var sl = myNewArray3;
				  

				  for (var i = 0, l = sl.length; i < l; i++) {
				      var unique = true;
				      for (var j = 0, k = out.length; j < k; j++) {

				          if ((sl[i].intent === out[j].intent) && (sl[i].confidence === out[j].confidence)) {
				              unique = false;
				          }
				      }
				      if (unique) {
				          out.push(sl[i]);
				      }
				  }
			});

//				  console.log("Intent in out--"+ util.inspect(out, false, null));

				  ///////////////////////////////////////
				  //readQuestions(data,out);:

					
					var queryString = 'NetworkFailure';
//					const util = require('util');
//					console.log("read Questions");
//					var intentQuestionsMapping = '{"NetworkFailure" : ["Not able to connect to 4g data","Not able to connect to 3g","Call Drop"]}';

					//console.log("intentQuestionsMapping--"+util.inspect(intentQuestionsMapping, false, null))
//					var objArray = new Array();
//					objArray = JSON.parse(intentQuestionsMapping);
//					var questionsArray = new Array();
//					var keys = Object.keys(objArray);
					
//					for (var i = 0; i < keys.length; i++) {
//						if(keys[i] === queryString)
//							{
//							var count = 1;
//							var questionArray = new Array();
//							questionArray = objArray[keys[i]];
//							for(var j=0; j<questionArray.length;j++,count++)
//								{
						    //searchDocuments(questionArray[j],responseTxtAppend);
								/////////////////////////////
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
								    	//console.log("I am inside before res.json"+ util.inspect(data, false, null));
								    	
								    	}
								    return res.json(data);
								  }
								  
								  

								});
//console.log("questionArray.length"+questionArray.length);
//								console.log("count --"+count);
//								if(count === questionArray.length)
//									{
//									console.log("I am inside before res.json"+ util.inspect(data, false, null));
//									return res.json(data);
//									
//									}
								//////////////////////////////
								//}

							
							
							
							
							//}

						//}
					

				  
				  ////////////////////////////////////////////

				

			console.log("Out of Cloudant");
			
//			if(responseTxtAppend != ''){
//				  console.log("responseTxtAppend before pushing"+ responseTxtAppend);
//					console.log("data --"+util.inspect(data, false, null));
//							  //if(data.output.text){
//					data.output.text.push(responseTxtAppend);
//									
//								//}
//								//clear the context's action since the lookup and append was completed.
//					data.context.action = {};
//							}
//			callback(null, data);
//			return;
		}
		
		else{
			callback(null, data);
			return;
		}
}



/*function readQuestions(data,queryString)
{	
	var responseTxtAppend = '';
	
	var queryString = 'NetworkFailure';
	const util = require('util');
	console.log("read Questions");
	var intentQuestionsMapping = '{"NetworkFailure" : ["Not able to connect to 4g data","Not able to connect to 3g","Call Drop"]}';

	//console.log("intentQuestionsMapping--"+util.inspect(intentQuestionsMapping, false, null))
	var objArray = new Array();
	objArray = JSON.parse(intentQuestionsMapping);
	var questionsArray = new Array();
	var keys = Object.keys(objArray);
	
	for (var i = 0; i < keys.length; i++) {
		if(keys[i] === queryString)
			{
			var questionArray = new Array();
			questionArray = objArray[keys[i]];
			for(var j=0; j<questionArray.length;j++)
				{
		    //searchDocuments(questionArray[j],responseTxtAppend);
				/////////////////////////////
				// search documents
				var query = solrClient.createQuery().q(questionArray[j]).rows(3);
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
						responseTxtAppend  += searchResponse.response.docs[k].contentHtml;
															
				  }
				  


					
					//clear the context's action since the lookup was completed.
					//data.context.action = {};
					//return;
				});
				console.log("responseTxtAppend after query"+responseTxtAppend);
				//return;
				//////////////////////////////
				}
			}
		
		

		}
	console.log("responseTxtAppend before pushing"+ responseTxtAppend);
	  if(responseTxtAppend != ''){
			//console.log("data --"+util.inspect(data, false, null));
					  //if(data.output.text){
							data.output.text.push(responseTxtAppend);
							
						//}
						//clear the context's action since the lookup and append was completed.
						data.context.action = {};
					}
}


function searchDocuments(question,responseTxtAppend)
{

    const util = require('util');
	//console.log("Inside searchDocuments"+question);
	
	
	// search documents
	var query = solrClient.createQuery().q(question).rows(3);
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
			responseTxtAppend  += searchResponse.response.docs[k].contentHtml;
												
	  }
	  console.log("responseTxtAppend"+responseTxtAppend);

		
		//clear the context's action since the lookup was completed.
		//data.context.action = {};
		//return;
	});
}*/


/*function callSvc(res,headers, dataString, options){
	// console.log(options);
	var reqPost = https.request(options, function(resPost) {
		resPost.setEncoding('UTF-8');

		var responseString = '';

		resPost.on('data', function(data) {
		  responseString += data;
		});

		resPost.on('end', function() {
		   //console.log('Received response: ' + responseString);
		   //console.log('Response status: '+ resPost.statusCode);
		  
		  if (resPost.statusCode === 200) {
		  	var responseObject = {};
		  	if (responseString != ""){
		  		responseObject = JSON.parse(responseString);
			}
			res.status(200).send(responseObject);
		  }
		  else {
			res.status(resPost.statusCode).send(responseString);
		  }
		  
		});
	});

	reqPost.write(dataString);
	reqPost.end();
	reqPost.on('error', function(e) {
		console.error(e);
	});	
}*/

//app.post("/api/view", function(req,res){

	//console.log("I am in /api/view");
	
	/*var headers = {};
	
	var headers = { 
	  'Authorization': 'Basic ' + new Buffer("daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix" + ':' + "30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61").toString('base64')
	  };

	var options = {
			//host: cloudant_credentials.host,
			host: "daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com",
			port: 443,
			path: 'https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com/chatrecord',
			//path: 'https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com/chatrecord/_all_docs?include_docs=true&descending=true',
			//path: 'https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com/chatrecord/_find',
			//path: 'https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com/chatrecord/_find',
			//https://$USERNAME.cloudant.com/$DATABASE/_all_docs
			method: "GET",
			headers: headers
//			body: {
//			       "selector":{"id":"9449812446"},
//			       "sort":[{"timestamp": "desc"}],
//			       "limit":"1"
//			     }
			};*/
	//callSvc(res,headers,"",options);
	
//	https.get("https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix:30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61@daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com", function(res) {
//	    console.log("Received response from /api/view: " + res.statusCode);
//	});
	
	
	
	/*var reqPost = https.get(
			{
				host: "daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com",
				port: 443,
				path: "https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com/chatrecord/_all_docs",
				method: "GET",
				url: "https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix:30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61@daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com"
			},
			function(res)
			{
				var output = '';

			    res.on('data', function (chunk) {
			        output += chunk;
			    });

			    res.on('end', function () {
			        console.log('Request complete:');
			
//			var jsonfile = require('jsonfile');
//			var outputFilename = '/Users/raghavendradeshpande/Documents/my.json';
//			console.log("JSON.stringify(data)--"+ output);
//			jsonfile.writeFile(outputFilename, output,
//			 function(err) {
//			    if(err) {
//			      console.log(err);
//			    } else {
//			      console.log("JSON saved to " + outputFilename);
//			    }
//			});
			        console.log(output);
			    });
				
			}
	
	);
	
	reqPost.on('error', function (err) {
	    console.log(err);
	    //console.log('error: ' + err.message);
	});
	reqPost.end();*/
	
	/*var cloudant = require('cloudant')("https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix:30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61@daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com");
	var db = cloudant.use("chatrecord");
	const util = require('util');
	var restler = require('restler');
	restler.get('https://daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix.cloudant.com:443/chatrecord/_all_docs?include_docs=true', {
	    username: 'daf8e660-c3e1-4ae5-825b-b50ac51cbcc1-bluemix',
	    password: '30360dac426354fb75929c7a4ac0c3758e39fb4fef5348ed37320ed688fe8a61'
	}).on('complete', function(data, response) {
		  //console.log(response.headers);
		console.log("Intent after read "+util.inspect(data, false, null));

		var rowslength = data.rows.length;
		
		
		for(var i=0; i < rowslength; i++) {
			var chattranscriptlength = data.rows[i].doc.chattranscript.length;
			for(var j=0; j<chattranscriptlength;j++)
				{
				if(data.rows[i].doc.chattranscript[j].intent.length !==0)
				conversationTranscript1.push(data.rows[i].doc.chattranscript[j].intent);
				}
			
		}
		var myNewArray3 = [];
		for (var i = 0; i < conversationTranscript1.length; ++i) {
		  for (var j = 0; j < conversationTranscript1[i].length; ++j)
		    myNewArray3.push(conversationTranscript1[i][j]);
		}

		  
		  var sl = myNewArray3;
		  var out = [];

		  for (var i = 0, l = sl.length; i < l; i++) {
		      var unique = true;
		      for (var j = 0, k = out.length; j < k; j++) {

		          if ((sl[i].intent === out[j].intent) && (sl[i].confidence === out[j].confidence)) {
		              unique = false;
		          }
		      }
		      if (unique) {
		          out.push(sl[i]);
		      }
		  }

		  //console.log("Intent in out--"+ util.inspect(out, false, null));

		  readQuestions(out);
		});
	
	
});*/
module.exports = app;
