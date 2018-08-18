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
module.exports.getResource = getResource;