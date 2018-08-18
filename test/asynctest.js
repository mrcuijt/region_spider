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
			//console.log(regions);
			regions.forEach(function(item,index){
				console.log(index + " " + item);
				// add some items to the queue
				q.push(item, function (err) {
					//console.log('finished processing foo');
						
				});
			});
			
		},
		function(err){
			console.error(err);
		}
	);

}

// create a queue object with concurrency 2
var q = async.queue(function (region, callback) {
    
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
			let trRegionLength = $(ctr).length;

			console.log(trRegionLength);
		}
	});

	// 确认当前任务执行完后调用当前任务对应执行完成的回调函数
	// 所有任务执行完成之后，调用自身全部任务完成时的事件
	// queue 对象存在，即使在所有任务执行完成后仍然可以继续使用
	// 新增的任务执行完毕后仍会调用，自身全部任务完成时的事件
    callback();
}, 2);

// assign a callback
q.drain = function() {
    console.log('all items have been processed');
}

// add some items to the queue
//q.push({name: 'foo'}, function (err) {
    //console.log('finished processing foo');
//});


main();