// var mongodb = require("./db"); // 引入数据库模块实例
var mongodb_pool = require("./db_pool");
var settings = require("./settings");

function SysLog(obj){
	this.url = obj.url;
	this.localCode = obj.localCode;
	this.localName = obj.localName;
	this.errMessage = obj.errMessage;
	this.status = obj.status;
	this.errType = obj.errType;
}

SysLog.prototype.save = function(callback){
	var sysLog={
		url : this.url,
		localCode : this.localCode,
		localName : this.localName,
		errMessage : this.errMessage,
		status : this.status,
		errType : this.errType,
	};
	mongodb_pool.acquire().then(function(client){
		let db = client.db(settings.db);
		db.collection("syslog").insertOne(sysLog,function(err,res){
			mongodb_pool.release(client);
			if(err){
				return callback(err);
			}
			callback(err,res);
		});
	},function(err){
		console.log(err);
	});

}

SysLog.prototype.find = function(obj){
	var promise = new Promise(function(resolve, reject) {
		mongodb.connect('mongodb://'+settings.host+"/"+settings.db,function(err,db){
			mongodb_pool.acquire().then(function(client){
				let db = client.db(settings.db);
				db.collection("syslog").find(obj).toArray(function(err,res){
					mongodb_pool.release(client);
					if(err){
						return reject(err);
					}else if(res && res.length > 0){
						return resolve(res);
					}else{
						return reject({"msg":"结果集查询为0","res":res});
					}
				});
		
			},function(err){
				console.log(err);
			});
		});
	});
	return promise;
}

module.exports.SysLog = SysLog;
