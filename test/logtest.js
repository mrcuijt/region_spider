let request = require('request');
let SysLog = require('../modules/syslog').SysLog;

function main(){

	let url = "http://localhost:3000/";

	requestUrl(url);

}

/**
 * 随机数生成
 */
function getRound() {
	var max = 9999999;
	return parseInt(Math.random() * max, 10) + 1;
}

function requestUrl(url,options){
	
	if(url){

	request(
		{
			url:url,
			headers: {  
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',  
			},  
			encoding: null  
		}
	,function(err,response,body){

		if(response){
			console.log(response.statusCode);
		}

		if(err){
			console.error(err);

			let obj = {
				"url":url,
				"localCode":"",
				"localName":"",
				"errMessage":err.toString(),
				"status":0,
				"errType":"1"
			};
			let sysLog = new SysLog(obj);
			sysLog.save(callback);
			console.log("只是来自 request 的错误消息！");
			return;
		}

		if(response && (response.statusCode == 404 || response.statusCode == 500)){

			let obj = {
				"url":url,
				"localCode":"",
				"localName":"",
				"errMessage":"response code : " + response.statusCode,
				"status":0,
				"errType":"3"
			};

			let sysLog = new SysLog(obj);

			sysLog.save(callback);

			return;
		}
		
		
		if(response && response.statusCode == 200){
			console.log(body);
		}

	});

	}

}

function callback(err,res){
	if(err){
		console.log(err);
		return;
	}
	console.log("添加成功！");
}

main();