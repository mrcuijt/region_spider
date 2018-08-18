const http = require('http');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const request = require('request');
const async = require('async');
let region = require("../modules/region");
let titles = require("../modules/region").titles;
let Region = require("../modules/region").Region;
let SysLog = require("../modules/syslog").SysLog;

function main(){

	let promise = region.regions();

	promise.then(
		function(regions){
			try{
			//console.log(regions);
			regions.forEach(function(item,index){
				console.log(index + " " + item);
				// add some items to the queue
				q.push(item, asyncCallback);
				throw "";
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

// create a queue object with concurrency 2
var q = async.queue(function (region, callback) {

	console.log(region);

    if(!region || !region.url){
		return;
	}

	//console.log('hello ' + task.name);

	request({  
		url: region.url,  
		headers: {  
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',  
		},  
		encoding: null  
	}, function(error, response, body) {  
		
		if(error){
			console.error(error);
			callback();
			return;
		}

		if (response && (response.statusCode == 404 || response.statusCode == 500)) {
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

				regArry.push(rRes);

			});

			callback(null,regArry);
			return;
		}

		callback();
		return;
	});
    
}, 2);

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

	regions.forEach(function(item,index){
		q.push(item,function(err,regions){
			asyncCallback(err,regions);
		});
	});

}


main();