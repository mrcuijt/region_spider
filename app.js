const http = require('http');
const fs = require('fs');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const async = require('async');
// var mongodb = require("./modules/db"); // 引入数据库模块实例
var mongodb_pool = require("./modules/db_pool");
var settings = require("./modules/settings");
let request = require('request');
let region = require("./modules/region");
let titles = require("./modules/region").titles;
let Region = require("./modules/region").Region;
let SysLog = require("./modules/syslog").SysLog;
let count = 1;
/*
 * 从数据库加载基础数据源
 */
function initRegions(obj){

	let promise = new Promise(function(resolve,reject){
		mongodb_pool.acquire().then(function(client){
			let db = client.db(settings.db);
			db.collection("regions").find(obj).toArray(function(err,res){
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

	return promise;
}

function main(){

	let promise = initRegions({"level":1});

//	promise.then(
//		function(regions){
//			console.log(regions);
//		},
//		function(err){
//			console.error(err);
//		}
//	);

	promise.then(
		function(regions){
			try{
			//console.log(regions);
			regions.forEach(function(item,index){

				//console.log(index);
				if(index == 0)
					return;
				// add some items to the queue
				q.push(item, asyncCallback);
				// throw "";
			});
			}catch(e){
				console.error(e);
			}
		},
		function(err){
			console.error(err);
		}
	);

}

function load(region){

	if(region || region.url){
		return;
	}

	// 得到本层数据的请求地址的URI
	let baseURI = region.url.substring(0,region.url.lastIndexOf("/"))+"/";

	request({  
		url: region.url,  
		headers: {  
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',  
		},  
		encoding: null  
	}, function(error, response, body) {  

		if(err){
			console.error(err);

			let obj = {
				"url":region.url,
				"localCode":region.code,
				"localName":region.text,
				"errMessage":err.toString(),
				"status":0,
				"errType":"1"
			};
			let sysLog = new SysLog(obj);
			sysLog.save(saveCallback);
			console.log("只是来自 request 的错误消息！");
			return;
		}

		if(response && (response.statusCode == 404 || response.statusCode == 500)){

			let obj = {
				"url":region.url,
				"localCode":region.code,
				"localName":region.text,
				"errMessage":"response code : " + response.statusCode,
				"status":0,
				"errType":"3"
			};

			let sysLog = new SysLog(obj);

			sysLog.save(saveCallback);

			return;
		}

		if (response && response.statusCode == 200) {  
			
			let ctable = titles[region.level][region.level];
			let ctr = titles[region.level]["r"+region.level];

			// 获取数据完毕后，使用iconv-lite转码，decedo中为Buffer对象，Buffer.concat为数组  
			const html1 = iconv.decode(body, 'gb2312');  
			const $ = cheerio.load(html1,{decodeEntities: false}); 

			let obj = {};

			// 得到所有的 tr 循环处理
			$(ctr).each(function(i,elem){

				// 得到处理每个 tr
				let $tr = cheerio.load(elem,{decodeEntities: false});
				
				obj.level = region.level+1;

				obj.parentCode = region.code;

				if($tr("a").length){

					// 资源名称
					let lhref = $tr("a")[0].attribs.href;

					let href = baseURI + lhref;

					obj.hrefname = lhref;

					obj.href = href;

					$tr("a").each(function(j,elema){
						if(j == 0){
							// 地区名称
							obj.code = cheerio.load(this,{decodeEntities: false}).text();
						}else if(j == 1){
							// 地区编号
							obj.text = cheerio.load(this,{decodeEntities: false}).text();
						}
					});

				}else{

					if($tr("td").length > 2){
						$tr("td").each(function(j,elema){
							if(j == 0){
								// 地区名称
								obj.code = cheerio.load(this,{decodeEntities: false}).text();
							}else if(j == 1){
								// 城乡分类代码
								obj.typcCode = cheerio.load(this,{decodeEntities: false}).text();
							}else if(j == 2){
								// 地区编号
								obj.text = cheerio.load(this,{decodeEntities: false}).text();
							}
						});
					}else{
						$tr("td").each(function(j,elema){
							if(j == 0){
								// 地区名称
								obj.code = cheerio.load(this,{decodeEntities: false}).text();
							}else if(j == 1){
								// 地区编号
								obj.text = cheerio.load(this,{decodeEntities: false}).text();
							}
						});
					}
				}

				let rRes = new Region(obj.hrefname,obj.href,obj.text,obj.code,obj.level,obj.parentCode,obj.typcCode);

				let promise = rRes.findByCode(rRes.code);

				promise.then(function(res){

					// console.log(res);

					if(res.length > 0){
						console.log("数据已存在！");
					}else{
						rRes.save(saveCallback);
						console.log(rRes.href);
					}
				},function(err){
					console.log(err.msg + "" + err.res);
					if(err.res && err.res.length == 0){
						rRes.save(saveCallback);
					}
				});

				load(rRes);

			});
		}
	});
}

// create a queue object with concurrency 2
var q = async.queue(function (region, callback) {

    if(!region || !region.url){
		callback();
		return;
	}

	//console.log("开始 : " + count);
	console.log("已有任务数 : " + q.length());

	//console.log('hello ' + task.name);

	request({  
		url: region.url,  
		headers: {  
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',  
		},  
		encoding: null,
		timeout: 20000
	}, function(error, response, body) {  
		
		if(error){
			console.error(error);

			let obj = {
				"url":region.url,
				"localCode":region.code,
				"localName":region.text,
				"errMessage":error.toString(),
				"status":0,
				"errType":"1"
			};
			let sysLog = new SysLog(obj);
			sysLog.save(saveCallback);

			callback();

			return;
		}

		if(response && (response.statusCode == 404 || response.statusCode == 500)){

			let obj = {
				"url":region.url,
				"localCode":region.code,
				"localName":region.text,
				"errMessage":"response code : " + response.statusCode,
				"status":0,
				"errType":"3"
			};

			let sysLog = new SysLog(obj);

			sysLog.save(saveCallback);

			callback();

			return;
		}

		if (response && response.statusCode == 200) {  
			
			console.log("statusCode" + response.statusCode);
			let ctable = titles[region.level][region.level];
			let ctr = titles[region.level]["r"+region.level];

			// 获取数据完毕后，使用iconv-lite转码，decedo中为Buffer对象，Buffer.concat为数组  
			const html1 = iconv.decode(body, 'gb2312');  
			const $ = cheerio.load(html1,{decodeEntities: false}); 

			let regArry = [];

			let obj = {};

			// 得到本层数据的请求地址的URI
			let baseURI = region.url.substring(0,region.url.lastIndexOf("/"))+"/";

			// 得到所有的 tr 循环处理
			$(ctr).each(function(i,elem){

				// 得到处理每个 tr
				let $tr = cheerio.load(elem,{decodeEntities: false});
				
				obj.level = region.level+1;

				obj.parentCode = region.code;

				if($tr("a").length){

					// 资源名称
					let lhref = $tr("a")[0].attribs.href;

					let href = baseURI + lhref;

					obj.hrefname = lhref;

					obj.href = href;

					$tr("a").each(function(j,elema){
						if(j == 0){
							// 地区名称
							obj.code = cheerio.load(this,{decodeEntities: false}).text();
						}else if(j == 1){
							// 地区编号
							obj.text = cheerio.load(this,{decodeEntities: false}).text();
						}
					});

				}else{

					if($tr("td").length > 2){
						$tr("td").each(function(j,elema){
							if(j == 0){
								// 地区名称
								obj.code = cheerio.load(this,{decodeEntities: false}).text();
							}else if(j == 1){
								// 城乡分类代码
								obj.typcCode = cheerio.load(this,{decodeEntities: false}).text();
							}else if(j == 2){
								// 地区编号
								obj.text = cheerio.load(this,{decodeEntities: false}).text();
							}
						});
					}else{
						$tr("td").each(function(j,elema){
							if(j == 0){
								// 地区名称
								obj.code = cheerio.load(this,{decodeEntities: false}).text();
							}else if(j == 1){
								// 地区编号
								obj.text = cheerio.load(this,{decodeEntities: false}).text();
							}
						});
					}
				}

				let rRes = new Region(obj.hrefname,obj.href,obj.text,obj.code,obj.level,obj.parentCode,obj.typcCode);
				let promise = rRes.findByCode(rRes.code);

				promise.then(function(res){

					// console.log(res);

					if(res.length > 0){
						console.log("数据已存在！");
					}else{
						rRes.save(saveCallback);
						console.log(rRes.href);
					}
				},function(err){
					console.log(err.msg + "" + err.res);
					if(err.res && err.res.length == 0){
						rRes.save(saveCallback);
					}
				});

				regArry.push(rRes);

			});

			callback(null,regArry);
			return;
		}

		callback();
		return;
	});
    
}, 30);

// assign a callback
q.drain = function() {
    console.log('all items have been processed');
}

function asyncCallback(err,regions){

	if(err){
		console.error(err);
		return;
	}

	if(regions){
		regions.forEach(function(item,index){
			q.push(item,function(err,regions){
				asyncCallback(err,regions);
			});
		});
	}

}

function saveCallback(err,res){
	if(err){
		console.log(err);
		return;
	}
	console.log("添加成功！");
}

function existsCallback(err,res){

	var promise = new Promise(function(resolve, reject) {

		if(err){
			console.log(err);
			return reject(resources);
		}
		if(res && res.length > 0){
			return resolve(resources);
		}

	});

	return promise;
}

main();