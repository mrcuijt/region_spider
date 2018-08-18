
var mongodb = require("./db"); // 引入数据库模块实例
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
	mongodb.connect('mongodb://'+settings.host+"/"+settings.db,function(err,db){
		if(err){
			// db.close();
			return callback(err);
		}
 		var dbo = db.db(settings.db);
		dbo.collection("syslog").insertOne(sysLog,function(err,res){
			if(err){
				db.close();
				return callback(err);
			}
			callback(err,res);
			db.close();
		});
	});

}

SysLog.prototype.find = function(obj){
	var promise = new Promise(function(resolve, reject) {
		mongodb.connect('mongodb://'+settings.host+"/"+settings.db,function(err,db){
			if(err){
				// db.close();
				return reject(err);
			}
			var dbo = db.db(settings.db);
			dbo.collection("syslog").find(obj).toArray(function(err,res){
				if(err){
					console.log(err);
					db.close();
					return reject(err);
				}
				if(res && res.length > 0){
					db.close();
					return resolve(res);
				}else{
					db.close();
					return reject({"msg":"结果集查询为0","res":res});
				}
				db.close();
			});
		});
	});
	return promise;
}

module.exports.SysLog = SysLog;