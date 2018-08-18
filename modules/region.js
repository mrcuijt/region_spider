const http = require('http')
const fs = require('fs')
const cheerio = require('cheerio')
const iconv = require('iconv-lite')
var mongodb_pool = require("./db_pool");
// var mongodb = require("./db"); // 引入数据库模块实例
var settings = require("./settings");
let request = require('request');

// 省市级省表格相关
const provincetable = ".provincetable";
const provincehead = ".provincehead";
const provincetr = ".provincetr";

// 市市辖区表格相关
const citytable = ".citytable";
const cityhead = ".cityhead";
const citytr = ".citytr";

// 区县市辖区表格相关
const countytable = ".countytable";
const countyhead = ".countyhead";
const countytr = ".countytr";

// 乡镇级街道办事处表格相关
const towntable = ".towntable";
const townhead = ".townhead";
const towntr = ".towntr";

// 社区居民委员会表格相关
const villagetable = ".villagetable";
const villagehead = ".villagehead";
const villagetr = ".villagetr";

var obj1 = {
	1:citytable,
	cityhead:cityhead,
	"r1":citytr
};

var obj2 = {
	2:countytable,
	countyhead:countyhead,
	"r2":countytr
};

var obj3 = {
	3:towntable,
	townhead:townhead,
	"r3":towntr
};

var obj4 = {
	4:villagetable,
	villagehead:villagehead,
	"r4":villagetr
};

var objs = [{},obj1,obj2,obj3,obj4];

const baseUrl = "http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2016/";

function Region(urlname,url,text,code,level,parentCode,typeCode){
	this.urlname=urlname,
	this.url=url,
	this.text=text,
	this.code=code,
	this.level=level,
	this.parentCode=parentCode,
	this.typeCode=typeCode
}

Region.prototype.save=function(callback){
	// 存入 mongodb 的文档
	var region={
		text:this.text,
		code:this.code,
		level:this.level,
		parentCode:this.parentCode,
		typeCode:this.typeCode,
		url:this.url,
		urlname:this.urlname
	};
	mongodb_pool.acquire().then(function(client){

		let db = client.db(settings.db);
		db.collection("regions").insertOne(region,function(err,res){
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

Region.prototype.findByCode = function(code,callback){

	var promise = new Promise(function(resolve, reject) {

		mongodb_pool.acquire().then(function(client){
			let db = client.db(settings.db);
			db.collection("regions").find({"code":code}).toArray(function(err,res){
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

var resources = [];

function getRegions(){

	var promise = new Promise(function(resolve, reject) {

		let hrefUrls = "http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2016/index.html";
		request({  
			url: hrefUrls,  
			headers: {  
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',  
			},  
			encoding: null  
		}, function(error, response, body) {  
			if (response && response.statusCode == 200) {  
				// 获取数据完毕后，使用iconv-lite转码，decedo中为Buffer对象，Buffer.concat为数组  
				const html1 = iconv.decode(body, 'gb2312');  
				const $ = cheerio.load(html1,{decodeEntities: false});  
				var $table = cheerio.load($(provincetable).html(),{decodeEntities: false});
				var aArry = $table("a");
				for(let i = 0; i < aArry.length; i++){
					
					// 资源名称
					let hrefname = aArry[i].attribs.href;
					// 资源地址
					let href = baseUrl + hrefname;
					// 地区名称
					let text = cheerio.load(aArry[i],{decodeEntities: false}).text();
					// 地区编号
					let code = hrefname.substring(0,hrefname.lastIndexOf("."))+"0000000000";

					var res = new Region(hrefname,href,text,code,1,null);
					
					resources.push(res);

				}
				return resolve(resources);
			}
		});  
    });
	return promise;
}

function getResource(url){

	try{

		let strLength = url.lastIndexOf("/");

		let str1Length = url.lastIndexOf(".");

		let str1 = url.substring(strLength+1,str1Length);

		return str1;

	}catch(e){

		console.log(e)
	}

}

var obj = {
	regions:getRegions,
	getResource:getResource,
	Region:Region,
	titles:objs
};

/** 
 * 剔除空格 
 * @param {*字符串} str  
 */  
function trim(str) {  
    return str.replace(/(^\s*)|(\s*$)/g, '').replace(/ /g, '')  
}  

module.exports = obj;
