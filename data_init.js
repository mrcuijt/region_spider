const http = require('http');
var mongodb = require("./modules/db");
var app = require("./modules/region");


function main(){

	let promise = app.regions();
	promise.then(function(res){
		//console.log(res);
		for(let i = 0; i < res.length; i++){
			res[i].save(callback);
		}
	});

}

function callback(err,res){
	if(err){
		console.log(err);
		return;
	}
	console.log("添加成功！");
}

// main();