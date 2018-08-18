const http = require('http');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const request = require('request');
const async = require('async');
let region = require("../modules/region");
let titles = require("../modules/region").titles;
let Region = require("../modules/region").Region;
let SysLog = require("../modules/syslog").SysLog;
let count = 1;

function main(){

	for(let i = 0; i<9999; i++){
		q.push({"url":"https://www.baidu.com"},asyncCallback);
	}
}

// create a queue object with concurrency 2
var q = async.queue(function (region, callback) {

	console.log("开始 : " + count);
	console.log("已有任务数 : " + q.length());
	count++;
	request({  
		url: region.url,  
		headers: {  
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',  
		},  
		encoding: null,
		timeout: 10000
	},function(error, response, body){
		if(error){
			console.log(error);
			callback();
			return;
		}
		if(response){
			console.log(response.statusCode);
		}
		callback();	
	});
	

	//console.log('hello ' + task.name);

}, 20);

// assign a callback
q.drain = function() {
    console.log('all items have been processed');
}

// add some items to the queue
//q.push({name: 'foo'}, function (err) {
    //console.log('finished processing foo');
//});

function asyncCallback(err,regions){

	if(err){
		console.error(err);
		return;
	}

}


main();