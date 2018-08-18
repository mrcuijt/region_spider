var http = require('http');
var url = require('url');
var util = require('util');
var mongodb = require("../modules/db"); // 引入数据库模块实例
var settings = require("../modules/settings");


let dbos = [];
let jsons = [];
function getConnect(){

	let promise = new Promise(function(resolve,reject){

		mongodb.connect('mongodb://'+settings.host+"/"+settings.db,function(err,db){
			if(err){
				return reject(err);
			}
			var dbo = db.db(settings.db);
			return resolve(dbo);
		});

	});

	return promise;
}

function main(){
	
	for(let i = 0; i < 1000 ; i++){
		let promise = getConnect();
		promise.then(function(dbo){
			dbos.push(dbo);
		});
		for(let j = 0; j < 100; i++){
			let json = {
				"_id": "5b2150e64cbdab33ac3d83cf",
				"text": "白马关村委会",
				"code": "110118110209",
				"level": 5,
				"parentCode": "110118110000",
				"typcCode": "220",
				"url": null,
				"urlname": null
			};
			jsons.push(json);
		}
	}
}

// 启动服务
http.createServer(function(req,res){
	
	console.log('请求到来，解析参数');
	var params = url.parse(req.url,true);
	console.log('解析完成');
	console.log(util.inspect(params));
	console.log('向客户端返回');
	res.writeHead(200,{'Content-Type':'text/plain;charset=utf-8'});
	res.write('先已建立的数据库连接数：' + dbos.length);
	res.end();
	
}).listen(3000);

 main();