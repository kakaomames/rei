/*
All this code is copyright Orteil, 2013-2020.
	-with some help, advice and fixes by Nicholas Laux, Debugbro, Opti, and lots of people on reddit, Discord, and the DashNet forums
	-also includes a bunch of snippets found on stackoverflow.com and others
	-want to mod the game? scroll down to the "MODDING API" section
Hello, and welcome to the joyous mess that is main.js. Code contained herein is not guaranteed to be good, consistent, or sane. Most of this is years old at this point and harkens back to simpler, cruder times. In particular I've tried to maintain compatibility with fairly old versions of javascript, which means luxuries such as 'let', arrow functions and string literals are unavailable. Have a nice trip.
Spoilers ahead.
http://orteil.dashnet.org
*/

var VERSION=2.031;
var BETA=0;


/*=====================================================================================
MISC HELPER FUNCTIONS
=======================================================================================*/
function l(what) {return document.getElementById(what);}
function choose(arr) {return arr[Math.floor(Math.random()*arr.length)];}

function escapeRegExp(str){return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");}
function replaceAll(find,replace,str){return str.replace(new RegExp(escapeRegExp(find),'g'),replace);}

//disable sounds coming from soundjay.com (sorry)
var realAudio=Audio;//backup real audio
Audio=function(src){
	if (src && src.indexOf('soundjay')>-1) {Game.Popup('申し訳ございません、soundjay.comからのリンクが機能した音声ファイルが存在しません。');this.play=function(){};}
	else return new realAudio(src);
};

if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {return i;}
        }
        return -1;
    };
}

function randomFloor(x) {if ((x%1)<Math.random()) return Math.floor(x); else return Math.ceil(x);}

function shuffle(array)
{
	var counter = array.length, temp, index;
	// While there are elements in the array
	while (counter--)
	{
		// Pick a random index
		index = (Math.random() * counter) | 0;

		// And swap the last element with it
		temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}
	return array;
}

var sinArray=[];
for (var i=0;i<360;i++)
{
	//let's make a lookup table
	sinArray[i]=Math.sin(i/360*Math.PI*2);
}
function quickSin(x)
{
	//oh man this isn't all that fast actually
	//why do I do this. why
	var sign=x<0?-1:1;
	return sinArray[Math.round(
		(Math.abs(x)*360/Math.PI/2)%360
	)]*sign;
}

/*function ajax(url,callback){
	var ajaxRequest;
	try{ajaxRequest = new XMLHttpRequest();} catch (e){try{ajaxRequest=new ActiveXObject('Msxml2.XMLHTTP');} catch (e) {try{ajaxRequest=new ActiveXObject('Microsoft.XMLHTTP');} catch (e){alert("Something broke!");return false;}}}
	if (callback){ajaxRequest.onreadystatechange=function(){if(ajaxRequest.readyState==4){callback(ajaxRequest.responseText);}}}
	ajaxRequest.open('GET',url+'&nocache='+(new Date().getTime()),true);ajaxRequest.send(null);
}*/

var ajax=function(url,callback)
{
	var httpRequest=new XMLHttpRequest();
	if (!httpRequest){return false;}
	httpRequest.onreadystatechange=function()
	{
		try{
			if (httpRequest.readyState===XMLHttpRequest.DONE && httpRequest.status===200)
			{
				callback(httpRequest.responseText);
			}
		}catch(e){}
	}
	//httpRequest.onerror=function(e){console.log('ERROR',e);}
	if (url.indexOf('?')==-1) url+='?'; else url+='&';
	url+='nocache='+Date.now();
	httpRequest.open('GET',url);
	httpRequest.setRequestHeader('Content-Type','text/plain');
	httpRequest.overrideMimeType('text/plain');
	httpRequest.send();
	return true;
}

function toFixed(x)
{
	if (Math.abs(x) < 1.0) {
		var e = parseInt(x.toString().split('e-')[1]);
		if (e) {
			x *= Math.pow(10,e-1);
			x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
		}
	} else {
		var e = parseInt(x.toString().split('+')[1]);
		if (e > 20) {
			e -= 20;
			x /= Math.pow(10,e);
			x += (new Array(e+1)).join('0');
		}
	}
	return x;
}

//Beautify and number-formatting adapted from the Frozen Cookies add-on (http://cookieclicker.wikia.com/wiki/Frozen_Cookies_%28JavaScript_Add-on%29)
function formatEveryThirdPower(notations)
{
	return function (val)
	{
		var base=0,notationValue='';
		if (!isFinite(val)) return '無限大';
		if (val>=1000000)
		{
			val/=1000;
			while(Math.round(val)>=1000)
			{
				val/=1000;
				base++;
			}
			if (base>=notations.length) {return '無限大';} else {notationValue=notations[base];}
		}
		return (Math.round(val*1000)/1000)+notationValue;
	};
}

function formatEveryFourthPower(notations)
{
	return function (value)
	{
		var base = 1,
		notationValue = '';
		if(!isFinite(value)) return '無限大';
		if (value >= 10000)
		{
			value /= 10000;
			while(Math.round(value) >= 10000)
			{
				value /= 10000;
				base++;
			}
			if (base >= notations.length) {return '無限大';} else {notationValue = notations[base];}
		}
		return ( Math.round(value * 10000) / 10000 ) + notationValue;
	};
}

function formatEveryFourthPower2()
{
	return function (value)
	{
		var baseShort = 0, baseLong = 0,
		notationValue = '', notationValue2 = '';
		if(!isFinite(value)) return '無限大';
		if (value >= 10000)
		{
			const binbara = 10**56;
			while(value >= binbara)
			{
				value /= binbara;
				baseLong++;
			}
			if (baseLong > formatJpLong.length) {return '無限大';}
			if (value >= 10000){
				while(Math.round(value) >= 10000){
					value /= 10000;
					baseShort++;
				}
				notationValue = formatJpShort[baseShort];
				notationValue2 = formatJpShort[baseShort-1]+formatJpLong[baseLong];
			}else{
				notationValue = formatJpLong[baseLong];
				notationValue2 = formatJpShort[formatJpShort.length-1]+formatJpLong[baseLong-1];
			}
			value = Math.round(value * 10000);
			return Math.floor( value / 10000 ) + notationValue + (value % 10000 > 0 ? (value % 10000) + notationValue2 : '');
		}else{
			return value;
		}
	};
}

function rawFormatter(val){return Math.round(val*1000)/1000;}

var formatLong=[' thousand',' million',' billion',' trillion',' quadrillion',' quintillion',' sextillion',' septillion',' octillion',' nonillion'];
var prefixes=['','un','duo','tre','quattuor','quin','sex','septen','octo','novem'];
var suffixes=['decillion','vigintillion','trigintillion','quadragintillion','quinquagintillion','sexagintillion','septuagintillion','octogintillion','nonagintillion'];
for (var i in suffixes)
{
	for (var ii in prefixes)
	{
		formatLong.push(' '+prefixes[ii]+suffixes[i]);
	}
}

var formatShort=['k','M','B','T','Qa','Qi','Sx','Sp','Oc','No'];
var prefixes=['','Un','Do','Tr','Qa','Qi','Sx','Sp','Oc','No'];
var suffixes=['D','V','T','Qa','Qi','Sx','Sp','O','N'];
for (var i in suffixes)
{
	for (var ii in prefixes)
	{
		formatShort.push(' '+prefixes[ii]+suffixes[i]);
	}
}
formatShort[10]='Dc';

var formatJpShort=['','万','億','兆','京','垓','秭','穣','溝','澗','正','載','極','恒河沙'];
var formatJpLong=[''];
var suffixes=['頻波羅','矜羯羅','阿伽羅'];
var formatJp=formatJpShort.concat();
for (var i=0;i<suffixes.length;i++)
{
	var j = formatJp.length;
	for (var ii=0;ii<j;ii++)
	{
		formatJp.push(formatJp[ii]+suffixes[i]);
	}
	var j = formatJpLong.length;
	for (var ii=0;ii<j;ii++)
	{
		formatJpLong.push(formatJpLong[ii]+suffixes[i]);
	}
}


var numberFormatters=
[
	formatEveryThirdPower(formatShort),
	formatEveryThirdPower(formatLong),
	rawFormatter,
	formatEveryFourthPower(formatJp),
	formatEveryFourthPower2()
];
function Beautify(val,floats)
{
	var negative=(val<0);
	var decimal='';
	var fixed=val.toFixed(floats);
	if (Math.abs(val)<1000 && floats>0 && Math.floor(fixed)!=fixed) decimal='.'+(fixed.toString()).split('.')[1];
	val=Math.floor(Math.abs(val));
	if (floats>0 && fixed==val+1) val++;
	var formatter=numberFormatters[Game.prefs.format?2:(Game.prefs.formatlang>0?2+Game.prefs.formatlang:1)];
	var output=(val.toString().indexOf('e+')!=-1 && Game.prefs.format==1)?val.toPrecision(3).toString():formatter(val).toString();
	if(Game.prefs.format || !Game.prefs.formatlang){
		output = output.replace(/\B(?=(\d{3})+(?!\d))/g,',');
	}else{
		output = output.replace(/^(\d)(\d{3})/,'$1,$2');
	}
	//var output=formatter(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
	if (output=='0') negative=false;
	return negative?'-'+output:output+decimal;
}
function shortenNumber(val)
{
	//if no scientific notation, return as is, else :
	//keep only the 5 first digits (plus dot), round the rest
	//may or may not work properly
	if (val>=1000000 && isFinite(val))
	{
		var num=val.toString();
		var ind=num.indexOf('e+');
		if (ind==-1) return val;
		var str='';
		for (var i=0;i<ind;i++) {str+=(i<6?num[i]:'0');}
		str+='e+';
		str+=num.split('e+')[1];
		return parseFloat(str);
	}
	return val;
}

SimpleBeautify=function(val)
{
	var str=val.toString();
	var str2='';
	for (var i in str)//add commas
	{
		if ((str.length-i)%3==0 && i>0) str2+=',';
		str2+=str[i];
	}
	return str2;
}

var beautifyInTextFilter=/(([\d]+[,]*)+)/g;//new regex
function BeautifyInTextFunction(str){return Beautify(parseInt(str.replace(/,/g,''),10));};
function BeautifyInText(str) {return str.replace(beautifyInTextFilter,BeautifyInTextFunction);}//reformat every number inside a string
function BeautifyAll()//run through upgrades and achievements to reformat the numbers
{
	var func=function(what){what.desc=BeautifyInText(what.baseDesc);}
	Game.UpgradesById.forEach(func);
	Game.AchievementsById.forEach(func);
}

//these are faulty, investigate later
//function utf8_to_b64(str){return btoa(str);}
//function b64_to_utf8(str){return atob(str);}

function utf8_to_b64( str ) {
	try{return Base64.encode(unescape(encodeURIComponent( str )));}
	catch(err)
	{return '';}
}

function b64_to_utf8( str ) {
	try{return decodeURIComponent(escape(Base64.decode( str )));}
	catch(err)
	{return '';}
}

function CompressBin(arr)//compress a sequence like [0,1,1,0,1,0]... into a number like 54.
{
	var str='';
	var arr2=arr.slice(0);
	arr2.unshift(1);
	arr2.push(1);
	arr2.reverse();
	for (var i in arr2)
	{
		str+=arr2[i];
	}
	str=parseInt(str,2);
	return str;
}

function UncompressBin(num)//uncompress a number like 54 to a sequence like [0,1,1,0,1,0].
{
	var arr=num.toString(2);
	arr=arr.split('');
	arr.reverse();
	arr.shift();
	arr.pop();
	return arr;
}

function CompressLargeBin(arr)//we have to compress in smaller chunks to avoid getting into scientific notation
{
	var arr2=arr.slice(0);
	var thisBit=[];
	var bits=[];
	for (var i in arr2)
	{
		thisBit.push(arr2[i]);
		if (thisBit.length>=50)
		{
			bits.push(CompressBin(thisBit));
			thisBit=[];
		}
	}
	if (thisBit.length>0) bits.push(CompressBin(thisBit));
	arr2=bits.join(';');
	return arr2;
}

function UncompressLargeBin(arr)
{
	var arr2=arr.split(';');
	var bits=[];
	for (var i in arr2)
	{
		bits.push(UncompressBin(parseInt(arr2[i])));
	}
	arr2=[];
	for (var i in bits)
	{
		for (var ii in bits[i]) arr2.push(bits[i][ii]);
	}
	return arr2;
}


function pack(bytes) {
    var chars = [];
	var len=bytes.length;
    for(var i = 0, n = len; i < n;) {
        chars.push(((bytes[i++] & 0xff) << 8) | (bytes[i++] & 0xff));
    }
    return String.fromCharCode.apply(null, chars);
}

function unpack(str) {
    var bytes = [];
	var len=str.length;
    for(var i = 0, n = len; i < n; i++) {
        var char = str.charCodeAt(i);
        bytes.push(char >>> 8, char & 0xFF);
    }
    return bytes;
}

//modified from http://www.smashingmagazine.com/2011/10/19/optimizing-long-lists-of-yesno-values-with-javascript/
function pack2(/* string */ values) {
    var chunks = values.match(/.{1,14}/g), packed = '';
    for (var i=0; i < chunks.length; i++) {
        packed += String.fromCharCode(parseInt('1'+chunks[i], 2));
    }
    return packed;
}

function unpack2(/* string */ packed) {
    var values = '';
    for (var i=0; i < packed.length; i++) {
        values += packed.charCodeAt(i).toString(2).substring(1);
    }
    return values;
}

function pack3(values){
	//too many save corruptions, darn it to heck
	return values;
}


//file save function from https://github.com/eligrey/FileSaver.js
var saveAs=saveAs||function(view){"use strict";if(typeof navigator!=="undefined"&&/MSIE [1-9]\./.test(navigator.userAgent)){return}var doc=view.document,get_URL=function(){return view.URL||view.webkitURL||view},save_link=doc.createElementNS("http://www.w3.org/1999/xhtml","a"),can_use_save_link="download"in save_link,click=function(node){var event=new MouseEvent("click");node.dispatchEvent(event)},is_safari=/Version\/[\d\.]+.*Safari/.test(navigator.userAgent),webkit_req_fs=view.webkitRequestFileSystem,req_fs=view.requestFileSystem||webkit_req_fs||view.mozRequestFileSystem,throw_outside=function(ex){(view.setImmediate||view.setTimeout)(function(){throw ex},0)},force_saveable_type="application/octet-stream",fs_min_size=0,arbitrary_revoke_timeout=500,revoke=function(file){var revoker=function(){if(typeof file==="string"){get_URL().revokeObjectURL(file)}else{file.remove()}};if(view.chrome){revoker()}else{setTimeout(revoker,arbitrary_revoke_timeout)}},dispatch=function(filesaver,event_types,event){event_types=[].concat(event_types);var i=event_types.length;while(i--){var listener=filesaver["on"+event_types[i]];if(typeof listener==="function"){try{listener.call(filesaver,event||filesaver)}catch(ex){throw_outside(ex)}}}},auto_bom=function(blob){if(/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)){return new Blob(["\ufeff",blob],{type:blob.type})}return blob},FileSaver=function(blob,name,no_auto_bom){if(!no_auto_bom){blob=auto_bom(blob)}var filesaver=this,type=blob.type,blob_changed=false,object_url,target_view,dispatch_all=function(){dispatch(filesaver,"writestart progress write writeend".split(" "))},fs_error=function(){if(target_view&&is_safari&&typeof FileReader!=="undefined"){var reader=new FileReader;reader.onloadend=function(){var base64Data=reader.result;target_view.location.href="data:attachment/file"+base64Data.slice(base64Data.search(/[,;]/));filesaver.readyState=filesaver.DONE;dispatch_all()};reader.readAsDataURL(blob);filesaver.readyState=filesaver.INIT;return}if(blob_changed||!object_url){object_url=get_URL().createObjectURL(blob)}if(target_view){target_view.location.href=object_url}else{var new_tab=view.open(object_url,"_blank");if(new_tab==undefined&&is_safari){view.location.href=object_url}}filesaver.readyState=filesaver.DONE;dispatch_all();revoke(object_url)},abortable=function(func){return function(){if(filesaver.readyState!==filesaver.DONE){return func.apply(this,arguments)}}},create_if_not_found={create:true,exclusive:false},slice;filesaver.readyState=filesaver.INIT;if(!name){name="download"}if(can_use_save_link){object_url=get_URL().createObjectURL(blob);setTimeout(function(){save_link.href=object_url;save_link.download=name;click(save_link);dispatch_all();revoke(object_url);filesaver.readyState=filesaver.DONE});return}if(view.chrome&&type&&type!==force_saveable_type){slice=blob.slice||blob.webkitSlice;blob=slice.call(blob,0,blob.size,force_saveable_type);blob_changed=true}if(webkit_req_fs&&name!=="download"){name+=".download"}if(type===force_saveable_type||webkit_req_fs){target_view=view}if(!req_fs){fs_error();return}fs_min_size+=blob.size;req_fs(view.TEMPORARY,fs_min_size,abortable(function(fs){fs.root.getDirectory("saved",create_if_not_found,abortable(function(dir){var save=function(){dir.getFile(name,create_if_not_found,abortable(function(file){file.createWriter(abortable(function(writer){writer.onwriteend=function(event){target_view.location.href=file.toURL();filesaver.readyState=filesaver.DONE;dispatch(filesaver,"writeend",event);revoke(file)};writer.onerror=function(){var error=writer.error;if(error.code!==error.ABORT_ERR){fs_error()}};"writestart progress write abort".split(" ").forEach(function(event){writer["on"+event]=filesaver["on"+event]});writer.write(blob);filesaver.abort=function(){writer.abort();filesaver.readyState=filesaver.DONE};filesaver.readyState=filesaver.WRITING}),fs_error)}),fs_error)};dir.getFile(name,{create:false},abortable(function(file){file.remove();save()}),abortable(function(ex){if(ex.code===ex.NOT_FOUND_ERR){save()}else{fs_error()}}))}),fs_error)}),fs_error)},FS_proto=FileSaver.prototype,saveAs=function(blob,name,no_auto_bom){return new FileSaver(blob,name,no_auto_bom)};if(typeof navigator!=="undefined"&&navigator.msSaveOrOpenBlob){return function(blob,name,no_auto_bom){if(!no_auto_bom){blob=auto_bom(blob)}return navigator.msSaveOrOpenBlob(blob,name||"download")}}FS_proto.abort=function(){var filesaver=this;filesaver.readyState=filesaver.DONE;dispatch(filesaver,"abort")};FS_proto.readyState=FS_proto.INIT=0;FS_proto.WRITING=1;FS_proto.DONE=2;FS_proto.error=FS_proto.onwritestart=FS_proto.onprogress=FS_proto.onwrite=FS_proto.onabort=FS_proto.onerror=FS_proto.onwriteend=null;return saveAs}(typeof self!=="undefined"&&self||typeof window!=="undefined"&&window||this.content);if(typeof module!=="undefined"&&module.exports){module.exports.saveAs=saveAs}else if(typeof define!=="undefined"&&define!==null&&define.amd!=null){define([],function(){return saveAs})}


//seeded random function, courtesy of http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html
(function(a,b,c,d,e,f){function k(a){var b,c=a.length,e=this,f=0,g=e.i=e.j=0,h=e.S=[];for(c||(a=[c++]);d>f;)h[f]=f++;for(f=0;d>f;f++)h[f]=h[g=j&g+a[f%c]+(b=h[f])],h[g]=b;(e.g=function(a){for(var b,c=0,f=e.i,g=e.j,h=e.S;a--;)b=h[f=j&f+1],c=c*d+h[j&(h[f]=h[g=j&g+b])+(h[g]=b)];return e.i=f,e.j=g,c})(d)}function l(a,b){var e,c=[],d=(typeof a)[0];if(b&&"o"==d)for(e in a)try{c.push(l(a[e],b-1))}catch(f){}return c.length?c:"s"==d?a:a+"\0"}function m(a,b){for(var d,c=a+"",e=0;c.length>e;)b[j&e]=j&(d^=19*b[j&e])+c.charCodeAt(e++);return o(b)}function n(c){try{return a.crypto.getRandomValues(c=new Uint8Array(d)),o(c)}catch(e){return[+new Date,a,a.navigator.plugins,a.screen,o(b)]}}function o(a){return String.fromCharCode.apply(0,a)}var g=c.pow(d,e),h=c.pow(2,f),i=2*h,j=d-1;c.seedrandom=function(a,f){var j=[],p=m(l(f?[a,o(b)]:0 in arguments?a:n(),3),j),q=new k(j);return m(o(q.S),b),c.random=function(){for(var a=q.g(e),b=g,c=0;h>a;)a=(a+c)*d,b*=d,c=q.g(1);for(;a>=i;)a/=2,b/=2,c>>>=1;return(a+c)/b},p},m(c.random(),b)})(this,[],Math,256,6,52);

function bind(scope,fn)
{
	//use : bind(this,function(){this.x++;}) - returns a function where "this" refers to the scoped this
	return function() {fn.apply(scope,arguments);};
}

var grabProps=function(arr,prop)
{
	if (!arr) return [];
	arr2=[];
	for (var i=0;i<arr.length;i++)
	{
		arr2.push(arr[i][prop]);
	}
	return arr2;
}

CanvasRenderingContext2D.prototype.fillPattern=function(img,X,Y,W,H,iW,iH,offX,offY)
{
	//for when built-in patterns aren't enough
	if (img.alt!='blank')
	{
		var offX=offX||0;
		var offY=offY||0;
		if (offX<0) {offX=offX-Math.floor(offX/iW)*iW;} if (offX>0) {offX=(offX%iW)-iW;}
		if (offY<0) {offY=offY-Math.floor(offY/iH)*iH;} if (offY>0) {offY=(offY%iH)-iH;}
		for (var y=offY;y<H;y+=iH){for (var x=offX;x<W;x+=iW){this.drawImage(img,X+x,Y+y,iW,iH);}}
	}
}

var OldCanvasDrawImage=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function()
{
	//only draw the image if it's loaded
	if (arguments[0].alt!='blank') OldCanvasDrawImage.apply(this,arguments);
}


if (!document.hasFocus) document.hasFocus=function(){return document.hidden;};//for Opera

function AddEvent(html_element, event_name, event_function)
{
	if(html_element.attachEvent) html_element.attachEvent("on" + event_name, function() {event_function.call(html_element);});
	else if(html_element.addEventListener) html_element.addEventListener(event_name, event_function, false);
}

function FireEvent(el, etype)
{
	if (el.fireEvent)
	{el.fireEvent('on'+etype);}
	else
	{
		var evObj=document.createEvent('Events');
		evObj.initEvent(etype,true,false);
		el.dispatchEvent(evObj);
	}
}

var Loader=function()//asset-loading system
{
	this.loadingN=0;
	this.assetsN=0;
	this.assets=[];
	this.assetsLoading=[];
	this.assetsLoaded=[];
	this.domain='';
	this.loaded=0;//callback
	this.doneLoading=0;
	
	this.blank=document.createElement('canvas');
	this.blank.width=8;
	this.blank.height=8;
	this.blank.alt='blank';

	this.Load=function(assets)
	{
		for (var i in assets)
		{
			this.loadingN++;
			this.assetsN++;
			if (!this.assetsLoading[assets[i]] && !this.assetsLoaded[assets[i]])
			{
				var img=new Image();
				img.src=this.domain+assets[i];
				img.alt=assets[i];
				img.onload=bind(this,this.onLoad);
				this.assets[assets[i]]=img;
				this.assetsLoading.push(assets[i]);
			}
		}
	}
	this.Replace=function(old,newer)
	{
		if (this.assets[old])
		{
			var img=new Image();
			if (newer.indexOf('http')!=-1) img.src=newer;
			else img.src=this.domain+newer;
			img.alt=newer;
			img.onload=bind(this,this.onLoad);
			this.assets[old]=img;
		}
	}
	this.onLoadReplace=function()
	{
	}
	this.onLoad=function(e)
	{
		this.assetsLoaded.push(e.target.alt);
		this.assetsLoading.splice(this.assetsLoading.indexOf(e.target.alt),1);
		this.loadingN--;
		if (this.doneLoading==0 && this.loadingN<=0 && this.loaded!=0)
		{
			this.doneLoading=1;
			this.loaded();
		}
	}
	this.getProgress=function()
	{
		return (1-this.loadingN/this.assetsN);
	}
}

var Pic=function(what)
{
	if (Game.Loader.assetsLoaded.indexOf(what)!=-1) return Game.Loader.assets[what];
	else if (Game.Loader.assetsLoading.indexOf(what)==-1) Game.Loader.Load([what]);
	return Game.Loader.blank;
}

var Sounds=[];
var OldPlaySound=function(url,vol)
{
	var volume=1;
	if (vol!==undefined) volume=vol;
	if (!Game.volume || volume==0) return 0;
	if (!Sounds[url]) {Sounds[url]=new Audio(url);Sounds[url].onloadeddata=function(e){e.target.volume=Math.pow(volume*Game.volume/100,2);}}
	else if (Sounds[url].readyState>=2) {Sounds[url].currentTime=0;Sounds[url].volume=Math.pow(volume*Game.volume/100,2);}
	Sounds[url].play();
}
var SoundInsts=[];
var SoundI=0;
for (var i=0;i<12;i++){SoundInsts[i]=new Audio();}
var pitchSupport=false;
//note : Chrome turns out to not support webkitPreservesPitch despite the specifications claiming otherwise, and Firefox clips some short sounds when changing playbackRate, so i'm turning the feature off completely until browsers get it together
//if (SoundInsts[0].preservesPitch || SoundInsts[0].mozPreservesPitch || SoundInsts[0].webkitPreservesPitch) pitchSupport=true;

var PlaySound=function(url,vol,pitchVar)
{
	//url : the url of the sound to play (will be cached so it only loads once)
	//vol : volume between 0 and 1 (multiplied by game volume setting); defaults to 1 (full volume)
	//(DISABLED) pitchVar : pitch variance in browsers that support it (Firefox only at the moment); defaults to 0.05 (which means pitch can be up to -5% or +5% anytime the sound plays)
	var volume=1;
	if (typeof vol!=='undefined') volume=vol;
	if (!Game.volume || volume==0) return 0;
	if (!Sounds[url])
	{
		//sound isn't loaded, cache it
		Sounds[url]=new Audio(url);
		Sounds[url].onloadeddata=function(e){PlaySound(url,vol,pitchVar);}
	}
	else if (Sounds[url].readyState>=2)
	{
		var sound=SoundInsts[SoundI];
		SoundI++;
		if (SoundI>=12) SoundI=0;
		sound.src=Sounds[url].src;
		//sound.currentTime=0;
		sound.volume=Math.pow(volume*Game.volume/100,2);
		if (pitchSupport)
		{
			var pitchVar=(typeof pitchVar==='undefined')?0.05:pitchVar;
			var rate=1+(Math.random()*2-1)*pitchVar;
			sound.preservesPitch=false;
			sound.mozPreservesPitch=false;
			sound.webkitPreservesPitch=false;
			sound.playbackRate=rate;
		}
		sound.play();
	}
}

if (!Date.now){Date.now=function now() {return new Date().getTime();};}

triggerAnim=function(element,anim)
{
	if (!element) return;
	element.classList.remove(anim);
	void element.offsetWidth;
	element.classList.add(anim);
};

var debugStr='';
var Debug=function(what)
{
	if (!debugStr) debugStr=what;
	else debugStr+='; '+what;
}

var Timer={};
Timer.t=Date.now();
Timer.labels=[];
Timer.smoothed=[];
Timer.reset=function()
{
	Timer.labels=[];
	Timer.t=Date.now();
}
Timer.track=function(label)
{
	if (!Game.sesame) return;
	var now=Date.now();
	if (!Timer.smoothed[label]) Timer.smoothed[label]=0;
	Timer.smoothed[label]+=((now-Timer.t)-Timer.smoothed[label])*0.1;
	Timer.labels[label]='<div style="padding-left:8px;">'+label+' : '+Math.round(Timer.smoothed[label])+'ms</div>';
	Timer.t=now;
}
Timer.clean=function()
{
	if (!Game.sesame) return;
	var now=Date.now();
	Timer.t=now;
}
Timer.say=function(label)
{
	if (!Game.sesame) return;
	Timer.labels[label]='<div style="border-top:1px solid #ccc;">'+label+'</div>';
}


/*=====================================================================================
GAME INITIALIZATION
=======================================================================================*/
var Game={};

Game.Launch=function()
{
	Game.version=VERSION;
	Game.beta=BETA;
	if (window.location.href.indexOf('/beta')>-1) Game.beta=1;
	Game.https=(location.protocol!='https:')?false:true;
	Game.mobile=0;
	Game.touchEvents=0;
	//if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) Game.mobile=1;
	//if (Game.mobile) Game.touchEvents=1;
	//if ('ontouchstart' in document.documentElement) Game.touchEvents=1;
	
	var css=document.createElement('style');
	css.type='text/css';
	css.innerHTML='body .icon,body .crate,body .usesIcon{background-image:url(img/icons.png?v='+Game.version+');}';
	document.head.appendChild(css);
	
	Game.baseSeason='';//halloween, christmas, valentines, fools, easter
	//automatic season detection (might not be 100% accurate)
	var year=new Date().getFullYear();
	var leap=(((year%4==0)&&(year%100!=0))||(year%400==0))?1:0;
	var day=Math.floor((new Date()-new Date(year,0,0))/(1000*60*60*24));
	if (day>=41 && day<=46) Game.baseSeason='valentines';
	else if (day+leap>=90 && day<=92+leap) Game.baseSeason='fools';
	else if (day>=304-7+leap && day<=304+leap) Game.baseSeason='halloween';
	else if (day>=349+leap && day<=365+leap) Game.baseSeason='christmas';
	else
	{
		//easter is a pain goddamn
		var easterDay=function(Y){var C = Math.floor(Y/100);var N = Y - 19*Math.floor(Y/19);var K = Math.floor((C - 17)/25);var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;I = I - 30*Math.floor((I/30));I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);J = J - 7*Math.floor(J/7);var L = I - J;var M = 3 + Math.floor((L + 40)/44);var D = L + 28 - 31*Math.floor(M/4);return new Date(Y,M-1,D);}(year);
		easterDay=Math.floor((easterDay-new Date(easterDay.getFullYear(),0,0))/(1000*60*60*24));
		if (day>=easterDay-7 && day<=easterDay) Game.baseSeason='easter';
	}
	
	Game.updateLog=
	'<div class="selectable">'+
	'<div class="section">Info</div>'+
	'<div class="subsection">'+
	'<div class="title">概要</div>'+
	'<div class="listing">CookieClickerは<a href="//orteil.dashnet.org" target="_blank">Orteil</a>と<a href="//dashnet.org" target="_blank">Opti</a>によって作られたjavascriptのゲームです。</div>'+
	//'<div class="listing">我々は<a href="https://discordapp.com/invite/cookie" target="_blank">official Discord</a>, as well as a <a href="http://forum.dashnet.org" target="_blank">forum</a>; '+
	'<div class="listing">我々は<a href="https://discordapp.com/invite/cookie" target="_blank">公式Discordサーバー</a>を用意しています。'+
		'もし助けが欲しいなら、<a href="http://www.reddit.com/r/CookieClicker" target="_blank">subreddit</a>'+
		'や<a href="http://cookieclicker.wikia.com/wiki/Cookie_Clicker_Wiki" target="_blank">wiki</a>に行ってみてください。</div>'+
	'<div class="listing">ニュースや予告情報は、普通は<a href="https://orteil42.tumblr.com/" target="_blank">tumblr</a>と<a href="https://twitter.com/orteil42" target="_blank">twitter</a>に投稿しています。</div>'+
	'<div class="listing" id="supportSection"><b style="color:#fff;opacity:1;">CookieClickerは永遠に、100%フリーのゲームです。</b>ゲーム開発を継続するために支援したい?援助する方法がいくつかあります :<div style="margin:4px 12px;line-height:150%;">'+
	'<br>&bull; 私たちの<a href="https://www.patreon.com/dashnet" target="_blank" class="highlightHover" style="background:#f86754;box-shadow:0px 0px 0px 1px #c52921 inset,0px 2px 0px #ff966d inset;text-shadow:0px -1px 0px #ff966d,0px 1px 0px #c52921;text-decoration:none;color:#fff;font-weight:bold;padding:1px 4px;">Patreon</a>を支援してね<span style="opacity:0.5;">(特典もあるよ!)</span>'+
	'<br>&bull; 私たちのPayPalに<form target="_blank" action="https://www.paypal.com/cgi-bin/webscr" method="post" id="donate"><input type="hidden" name="cmd" value="_s-xclick"><input type="hidden" name="hosted_button_id" value="BBN2WL3TC6QH4"><input type="submit" id="donateButton" value="donate" name="submit" alt="PayPal — The safer, easier way to pay online."><img alt="" border="0" src="https://www.paypalobjects.com/nl_NL/i/scr/pixel.gif" width="1" height="1"></form><span style="opacity:0.5;">(メモ: PayPalは手数料として少なくとも$0.32かかるからぼくらの手に届くにはそれ以上にね!)</span>'+
	'<br>&bull; アドブロッカーを無効にする<br>&bull; ぼくらの<a href="http://www.redbubble.com/people/dashnet" target="_blank">イカすクッキーシャツやパーカー、ステッカー</a>を見てみて!<br>&bull; (欲しいならね!)</div></div>'+
	'<div class="listing warning">メモ : もしアップデートの後に新しいバグを見つけて、サードパーティ製アドオンを使っているなら、原因がそのアドオンのせいではないか確かめてください!</div>'+
	'<div class="listing warning">警告 : ブラウザのキャッシュやクッキーを消すと<small>(他に何か?)</small>セーブデータの消去を招きます。まず最初にセーブデータの書き出しとバックアップをしよう!</div>'+

	'<div class="subsection">'+
	'<div class="title">日本語化について</div>'+
	'<div class="listing">このWebサイトは、<a href="http://orteil42.tumblr.com/" target="_blank">Orteil氏</a>原作である<a href="http://orteil.dashnet.org/cookieclicker/" target="_blank">CookieClicker</a>を元に、日本語化を施したModificationサイトになっています。</div>'+
	'<div class="listing" style="color:#999">This web is Japanese modification site based on Original Cookie Clicker by Mr.Orteil.'+

	'</div><div class="subsection">'+
	'<div class="title">本家からのデータ移行方法</div>'+
	'<div class="listing">本家でセーブデータを出力し、こちらでセーブデータを入力することで可能です。</div>'+
	'<div class="listing">※データは突然消えることがあります。セーブのバックアップは頻繁に行うことをおすすめします。なお、セーブデータが消えた場合、責任は負いかねます。</div>'+
	'<div class="listing">本家、日本語版間でのセーブデータ移動とバージョンが上がる場合は同じセーブデータを使うことができるはずですが、バージョンが下がる場合はバージョンが高い方のセーブデータを使うことはできません。ご注意ください。</div>'+
	'<div class="listing">公式のアップデートをすぐに反映できるというわけではございません。ご了承ください。</div>'+

	'</div><div class="subsection">'+
	'<div class="title">ブックマークレットについて</div>'+
	'<div class="listing">自動クリックやチート支援、アドオンなどで使われているブックマークレット(文字列をブックマークして、プレイ画面でそのブックマークをクリックして動作させるもの)については、英語(原作)版用に作られたものは日本語版では動作対象外です。自己責任でご利用ください。</div>'+

	'</div><div class="subsection">'+
	'<div class="title">制作ポリシー</div>'+
	'<div class="listing">原作者のMODについてのコメントに批准して作られたものを参考にしています。</div>'+
	'<div class="listing" style="color:#999">もし翻訳やゲームの改造をしたい場合は、以下のルールに従う必要がある。</div>'+
	'<div class="listing">&bull; ゲームをホストし直した状態でソースを編集し、バグを修正、そして責任をもって公式バージョンのアップデートを適用していくこと。</div>'+
	'<div class="listing">&bull; 公式バージョンと同じURLのpaypal募金ボタンを設置しなければならない。</div>'+
	'<div class="listing">&bull; トップバーの情報を全て保持(クレジット含め)し、公式バージョンへのリンクを加えること。</div>'+
	'<div class="listing">&bull; ページ中に広告を設置してはいけない。ページから収益を得てはいけない。</div>'+
	'<div class="listing">&bull; もし改造を加えないのであれば、翻訳のみの者はゲームのシステムを変更するべきではない。</div>'+
	'<div class="listing">&bull; ページに非公式な翻訳または改造であることを明記しなければならない。</div>'+
	'<div class="listing"><br></div>'+
	'<div class="listing">原文： <a href="http://orteil42.tumblr.com/post/61387300247/hey-orteil-ive-been-reading-up-on-your-source-files" target="_blank">Okay guys, here\'s our statement on mods and translations.</a></div><br>'+
	'<div class="listing">トップバーの宣伝部分と別バージョン欄につきましては情報を変更してしまわないよう、可能な限り原文に即して訳しています。また、日本語版のため、システムの中で、単位を千進法から万進法に変更、ベーカリー名の2バイト文字等への対応(2バイト文字の使用は自己責任でお願いします)をしています。また、英語と日本語による数の単位の差から日本語版では一部仏典の単位、上数法を使用しており、本家では10の300乗のところを10の444乗まで短縮表記ができるようになっております。また、要望に基づいて神殿をタッチデバイスに対応させています。これらの変更について公式から指摘された場合、該当部分の変更を戻します。</div>'+

	'</div><div class="subsection">'+
	'<div class="title">日本語化担当</div>'+
	'<div class="listing">&bull; コーディング : <a href="http://twitter.com/LPerNATTO" target="_brank">@LPerNATTO</a></div>'+
	'<div class="listing">&bull; 翻訳 : <a href="http://twitter.com/LPerNATTO" target="_brank">@LPerNATTO</a></div>'+
	'<div class="listing">&bull; 日本語版概要部分及び制作ポリシー参考 : <a href="http://twitter.com/akai_inu" target="_brank">@akai_inu</a>様</div>'+
	'<div class="listing">&bull; 翻訳参考URL(多大な感謝!) : </div>'+
	'<div class="listing"><div class="listing">-<a href="http://www55.atwiki.jp/cookieclickerjpn" target="_brank">cookie clicker 日本語wiki</a></div></div>'+

	'</div><div class="subsection">'+
	'<div class="title">連絡先</div>'+
	'<div class="listing">日本語版についての意見や質問は、Twitter <a href="http://twitter.com/LPerNATTO" target="_brank">@LPerNATTO</a>にお願いします。Twitterが利用できない場合は、メール natto.gamemail@gmail.comまでご連絡ください。日本語wikiの日本語版に関するページの掲示板の方も一応確認するようにしておりますので、そちらでも大丈夫です。</div><br>'+
	'<div class="listing">ゲームの仕様に関する質問、意見などは、製作者である<a href="http://twitter.com/orteil42" target="_brank">Orteil氏</a>に連絡することをお勧めします。</div>'+
	
	'</div><div class="subsection">'+
	'<div class="title">更新履歴</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2020/11/01 - パラレルワールド</div>'+
	'<div class="listing">&bull; 新しい施設</div>'+
	'<div class="listing">&bull; 更に上位のアップグレードを追加</div>'+
	'<div class="listing">&bull; 新しい実績の等級</div>'+
	'<div class="listing">&bull; 新しい天国系アップグレード</div>'+
	'<div class="listing">&bull; 新しいMOD開発向けAPI</div>'+
	'<div class="listing">&bull; 新しいバランス調整(アップグレードスロットの価格、指系アップグレード…)</div>'+
	'<div class="listing">&bull; 新しい修正(うるう年、ゴーストスワップ、種の持ち越し…)</div>'+
	'<div class="listing">&bull; 新しいもの</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2020/08/23 - 私に金を、今すぐ金を</div>'+
	'<div class="listing">&bull; 在庫市場ミニゲームのベータ版が仕上がったので現行版に追加された</div>'+
	'<div class="listing">&bull; 在庫市場ミニゲームにダークモードが追加された</div>'+
	'<div class="listing">&bull; 解除する前のミルクを選択できなくなった、ミルクセレクターのレイアウトを改良した</div>'+
	'<div class="listing">&bull; 在庫市場の商品の価格限界が上がって変動幅がより広がった、また非表示ボタンをShift+クリックすることで他の全商品と表示/非表示を切り替えられるようにもなった</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2020/08/08 - アカウント確認(ベータ版)</div>'+
	'<div class="listing">&bull; 在庫市場のレイアウトが改訂された</div>'+
	'<div class="listing">&bull; もう在庫の売却によって全てのプレイにおける焼いたクッキーの量は増えない</div>'+
	'<div class="listing">&bull; 在庫価格がこの周回における最高素CpSによって決められるようになった(統計画面で確認できる)</div>'+
	'<div class="listing">&bull; もう同じティックの間は在庫の購入と売却はできない</div>'+
	'<div class="listing">&bull; 倉庫のスペースが関連する施設のレベル1つにつき +10 されるようになった(+5 から)</div>'+
	'<div class="listing">&bull; 銀行のレベルが平均(と最大)在庫価格を引き上げるようになった</div>'+
	'<div class="listing">&bull; 後の在庫のほうがより価値が高い</div>'+
	'<div class="listing">&bull; CookieClickerは7周年!</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2020/06/18 - 銀行作り(ベータ版)</div>'+
	'<div class="listing">&bull; 在庫市場ミニゲームが追加された、銀行のレベルが1以上で利用可能、安く仕入れて高く売ろう!</div>'+
	'<div class="listing">&bull; (今後のパッチで大規模なバランス調整が見込まれるミニゲーム)</div>'+
	'<div class="listing">&bull; ドラゴンを飼えるようになるものを含む、いくつか天国系アップグレードを追加</div>'+
	'<div class="listing">&bull; 新しく施設のアップグレードと実績の段階を追加</div>'+
	'<div class="listing">&bull; 煌くベールのためにトナカイのクリックが正しくカウントされるようになった</div>'+
	'<div class="listing">&bull; 短縮表記をオフになっているときの指数表記の数字が見やすくなったかも</div>'+
	'<div class="listing">&bull; Javascriptコンソールの施設表示での ツ をより正確な ッ に変えた</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2019/09/28 - ソースコードにないことを</div>'+
	'<div class="listing">&bull; 新施設の追加</div>'+
	'<div class="listing">&bull; フォーチュンクッキーを追加した(新しい天国系アップグレード)</div>'+
	'<div class="listing">&bull; より多くのクッキーと実績とか</div>'+
	'<div class="listing">&bull; ロシアンブレッドクッキーのアイコンをよりキリル文字の起源を反映したものに更新した</div>'+
	'<div class="listing">&bull; <i style="font-style:italic;">こっそり更新 :</i> ゲームを閉じている間に角砂糖による補充のタイマー(角砂糖の成長じゃなく)が進まないようになった(これで悪用されないよう修正される)</div>'+
	'<div class="listing">&bull; また、CookieClickerの公式Androidバージョンをリリースした、<a href="https://play.google.com/store/apps/details?id=org.dashnet.cookieclicker" target="_blank">ここ</a>で遊べるよ(iOSバージョンは後ほど)</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2019/4/1 - 2.019(「今年の」更新)</div>'+
	'<div class="listing">&bull; 混乱を避けるためにゲームを「Cookie Clicker」に改名した</div>'+
	'<div class="listing">&bull; クッキーを作るために無料で大クッキーをクリックできるように</div>'+
	'<div class="listing">&bull; 落下ダメージを消した</div>'+
	//'<div class="listing">&bull; いくつかの誤植を修正 : プレイヤー名が正しく「[bakeryName]」と表記されるように</div>'+
	'<div class="listing">&bull; CGアニメ映画<i style="font-style:italic;">リトル・レッド レシピ泥棒は誰だ!?</i>(2005)へのリンクをすべて消した</div>'+
	'<div class="listing">&bull; 過去に戻ってクッキーとコンピューターマウスを発明して、CookieClickerが1日存在するように捏造した</div>'+
	'<div class="listing">&bull; 現在ゲームはジュネーブ協定に完全に準拠している</div>'+
	'<div class="listing">&bull; TI-84をサポート対象外に</div>'+
	'<div class="listing">&bull; 低解像度バージョンをリリースした、ここで遊べるよ : <a href="//orteil.dashnet.org/experiments/cookie/" target="_blank">orteil.dashnet.org/experiments/cookie</a></div>'+
	'<div class="listing">&bull; バージョン番号を更新</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2019/03/05 - 幾日分のクッキー</div>'+
	'<div class="listing">&bull; <a href="https://www.patreon.com/dashnet" target="_blank">Patreon</a>でのサポーターによって前もって考案された、20以上の新しいクッキーを追加した</div>'+
	'<div class="listing">&bull; 2つのヘブンリーアップグレードを追加した</div>'+
	'<div class="listing">&bull; 金のガチョウの卵 は 残された幸運 の目的としてゴールデンクッキーアップグレードとしてカウントされる</div>'+
	'<div class="listing">&bull; 金の角砂糖は 所持クッキーを 2倍 にするか、CpSの 24時間分 のクッキーを得るか、より少ない方が選択される(以前は上限なしに所持クッキーを倍にしていた)</div>'+
	'<div class="listing">&bull; 紋章官の量がセーブされるようになり、ゲームがロードされる度にオフラインCpSの計算に使われる。以前はページがロードされる時のオフライン計算は紋章官が0としていた</div>'+
	'<div class="listing">&bull; 遅いコンピュータでゲームのフリーズ(及びクッキーを焼かなくなること)を防ぐシステムを追加した。代わりにこれはスリープモードが起動し、ゲームを閉じている時のようにクッキーが生成される。有効にするには「スリープモード休止」を設定メニューの設定欄から使用すること</div>'+
	'<div class="listing">&bull; Ctrlキーを押しながらクリックするとMacブラウザで問題が発生するため、アップグレードの保管はShift+クリックに変更した</div>'+
	'<div class="listing">&bull; シナジー効果によるCpSブーストが多分より明確になるツールチップを作った</div>'+
	'<div class="listing">&bull; 博徒の熱き夢 がセーブデータ出力と昇天を超えて作用する問題を修正</div>'+
	'<div class="listing">&bull; 菜園においてどこに植えようとしているかをわかりやすくするため、Shiftキーを押し続けることでツールチップを隠せるようになった</div>'+
	'<div class="listing">&bull; ゴールデンクッキー/トナカイがある環境では消えないバグを修正</div>'+
	'<div class="listing">&bull; オーラの ドラゴン曲線 は今度から正しく角砂糖を「50%くらいおかしく」させるように</div>'+
	'<div class="listing">&bull; Ctrlキーは間違って押された時の登録が少なくなったはず</div>'+
	'<div class="listing">&bull; 新しい広告枠を右上に追加した。我らのプレーヤーベースはこれまでも強力で協力的だったけど、広告収入は時々ひどく変動してる。収入が安定したら、この広告枠は取り払うよ</div>'+
	'<div class="listing">&bull; 携帯電話のブラウザでゲームプレイしやすくなるよう、いくつか調整をした。完璧じゃないしバグもあるけど、機能的だよ!(ゲームを正しく表示するにはズームアウトやスクロールの必要があるかも)</div>'+
	'<div class="listing">&bull;そういえば、携帯電話用のアプリバージョン(0から携帯用に作っている)も良い進捗なので、しばしお待ちを!</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2018/10/25 - 還元のループ</div>'+
	'<div class="listing">&bull; 新施設の追加</div>'+
	'<div class="listing">&bull; <a href="https://www.patreon.com/dashnet" class="orangeLink" target="_blank">Patreon</a>を始めてみた<span style="font-size:80%;">(リンクがオレンジ色だから気づいたよね!)</span></div>'+
	'<div class="listing">&bull; 新たな天国系アップグレードを幾つか追加、うち一つはPatreon絡みだけどプレーヤー全員に利益をもたらすよ(これはまだ試験中!)</div>'+
	'<div class="listing">&bull; グランマ達にカーソルを乗せると、名前と年齢が判るようになったよ</div>'+
	'<div class="listing">&bull; 「XのみでY枚クッキーを焼く」のに要求される枚数が上がった</div>'+
	'<div class="listing">&bull; 現在のクッキー生産効率と釣り合いが取れるよう、永久アプグレの価格を見直した(HC数十億枚程度、今は軽く達成可能だからね)</div>'+
	'<div class="listing">&bull; 施設詳細情報にシナジーアプグレによって上昇したCpSのパーセンテージを表示</div>'+
	'<div class="listing">&bull; 女王ビートの収穫報酬上限が、手持ちクッキーの 6% から 4% に低下</div>'+
	'<div class="listing">&bull; 他にも、季節スイッチでは取得済み季節アイテムの数が、永久スロットでは装着中アプグレの名前が、それぞれ表示されるように</div>'+
	'<div class="listing">&bull; 季節スイッチの価格を見直し</div>'+
	'<div class="listing">&bull; 選択した季節スイッチをもう一度クリックすることでキャンセル可能になった</div>'+
	'<div class="listing">&bull; 何かをクリックする時、下に重なった虫を誤って潰さないようにした</div>'+
	'<div class="listing">&bull; 砂糖フィーバーの効果が 1時間 CpS 2倍 が 3倍 にアップ</div>'+
	'<div class="listing">&bull; 更新履歴の文章が選択状態にできるようになった</div>'+
	'<div class="listing">&bull; ダンジョンのミニゲームはまだまだ時間かかりそう</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2018/08/08 - いいか、お前ら</div>'+
	'<div class="listing">&bull; CookieClickerはなんとか5歳を迎え、医師が下した最も楽観的な予測に抗っている</div>'+
	'<div class="listing">&bull; スマッシュ・マウスの1999年の古典的ヒット曲「All Star」の名を冠した、新たな段階の施設実績を追加</div>'+
	'<div class="listing">&bull; 特に名前に意味はない、新たな段階の施設アップグレードも追加</div>'+
	'<div class="listing">&bull; <b>プレイヤーへ :</b> 何年も飽きずにストーカーみたいに付いて来てくれた事に、誰もが認める一番のバカゲーの開発を好きにやらせてくれた事に心より感謝を</div>'+
	'<div class="listing">&bull; ダンジョンのミニゲームに再び取り組んでるところ</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2018/08/01 - 買って買って買って</div>'+
	'<div class="listing">&bull; アップグレードを即時一括購入できるようになる天国系アップグレードを追加</div>'+
	'<div class="listing">&bull; アップグレードのグレードが判る天国系アップグレードを追加(紛らわしい為に昔削除された機能)</div>'+
	'<div class="listing">&bull; 虫関連の新しい天国系アップグレードを追加</div>'+
	'<div class="listing">&bull; 新しいアップグレードのグレードを追加</div>'+
	'<div class="listing">&bull; 新たなクッキーと実績をいくつか追加</div>'+
	'<div class="listing">&bull; 新オプション「追加ボタン」、オンにすると施設を最小化できる</div>'+
	'<div class="listing">&bull; 新オプション「角砂糖使用確認」、オンにすると角砂糖使用時に確認メッセージを表示</div>'+
	'<div class="listing">&bull; 施設の売値が現在価格の25%に(50%から減少)、それに伴い「大地を砕く者」が修正されて50%に(85%から減少)</div>'+
	'<div class="listing">&bull; 畑の土壌が現在の農場の所有数に応じて正しく解除されるように</div>'+
	'<div class="listing">&bull; ケチシメジがハラハラドキドキの弱体化</div>'+
	'<div class="listing">&bull; 皺々エラ茸が虫をもっと沢山生むように</div>'+
	'<div class="listing">&bull; 「まとめ刈り」でCtrl+Shift+クリックすると結実期の不死身でない作物だけ収穫できるように</div>'+
	'<div class="listing">&bull; 角砂糖に新しい変種が追加</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2018/04/20 - バグを幾つか除草</div>'+
	'<div class="listing">&bull; 金クローバーと皴々エラ茸の発生がちょっとよくなった筈</div>'+
	'<div class="listing">&bull; 老婆米の結実がだいぶ早くなった</div>'+
	'<div class="listing">&bull; 成熟したオイボレタケはリロードしても若返らない</div>'+
	'<div class="listing">&bull; 菜園種子リストのUIが、賢くサイズ変動するようになった</div>'+
	'<div class="listing">&bull; 短縮表記オフ時の種子コストの表示も、賢く躾けておいた</div>'+
	'<div class="listing">&bull; 「派手なグラフィック」設定をオフにすると、ミニゲームのアニメーションが無効になる</div>'+
	'<div class="listing">&bull; CpS実績の達成条件がほんのちょびっと緩和された</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2018/04/19 - 菜園区画補修</div>'+
	'<div class="listing">&bull; 菜園の作物が落としたアップグレードを、常にロックするようにした(代わりにドロップ率落とした)</div>'+
	'<div class="listing">&bull; 菜園で砂糖を使うと、作物の伝播と変異確率が 3倍 になるティックが 1回 発生</div>'+
	'<div class="listing">&bull; 新アップグレードを幾つか追加</div>'+
	'<div class="listing">&bull; バグ修正と参照の見直しを少々</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2018/04/18 - 君の栽培品種ほどおなじみのよくある更新</div>'+
	'<div class="listing">&bull; ミニゲーム「菜園」を追加、農場レベル1以上でアンロック</div>'+
	'<div class="listing">&bull; ゲーム再開後、更新があったことをお知らせする為の、小さな矢印と点滅するラベルを付けたよ(ヤッホー!)</div>'+
	'<div class="listing">&bull; 新たなクッキー、ミルクフレーバー、実績</div>'+
	'<div class="listing">&bull; 昇天する代わりに 10億 枚以上クッキーを焼けば、何時でも砂糖の塊がアンロックされるようにした</div>'+
	'<div class="listing">&bull; 角砂糖のタイプが正しくセーブされるようになった</div>'+
	'<div class="listing">&bull; 各ミニゲームでの砂糖の使用を 15分置き に制限した(タイマー共有)</div>'+
	'<div class="listing">&bull; CpS実績の条件をより厳しくした</div>'+
	'<div class="listing">&bull; ゴールデンクッキーの寿命は、画面上にある他のゴールデンクッキーの数ごとに 5% 短くなった</div>'+
	'<div class="listing">&bull; 各ミニゲームの開閉状態を記憶するようにした</div>'+
	'<div class="listing">&bull; 季節開始の際に通知が出るように(これでもう「今日のゲームおかしくね？」と混乱することは無いと思うよ)</div>'+
	'<div class="listing">&bull; ツリー画面の永久アップグレードスロットに、選択したアプグレの詳細が表示されるように</div>'+
	'<div class="listing">&bull; 遂にセーブが壊れるバグを直したぞ、たぶん</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2018/02/24 - よく見せるための糖衣がけ</div>'+
	'<div class="listing">&bull; <a href="https://discordapp.com/invite/cookie" target="_blank">公式Discordサーバー</a>へのリンクを追加</div>'+
	'<div class="listing">&bull; それほどの要素がないのに更新の通知をするのはおかしいと思ったから :</div>'+
	'<div class="listing">&bull; 一掴み分の新しいクッキーを追加</div>'+
	'<div class="listing">&bull; 3つの天国系アップグレードを追加</div>'+
	'<div class="listing">&bull; 10の300乗まで短縮表記で表示できるようになった</div>'+
	'<div class="listing">&bull; もう 抗えぬ運命の手 から つながれクッキー が発動することはない</div>'+
	'<div class="listing">&bull; 今年中に、より大規模でより良い要素が来るよ</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2017/08/08 - 4周年</div>'+
	'<div class="listing">&bull; 新施設 : チャンスメーカー</div>'+
	'<div class="listing">&bull; 新しいミルク、新しい仔猫、新しいドラゴンオーラ、新しいクッキー、新しい上位の施設アップグレード</div>'+
	'<div class="listing">&bull; バフがオフライン時のCpSに影響しないように</div>'+
	'<div class="listing">&bull; ゴザモクの空腹がちょっと収まった(弱体化、ホントごめん)</div>'+
	'<div class="listing">&bull; 魔導書のスペルコストと最大魔力に掛かる計算が変わった</div>'+
	'<div class="listing">&bull; 自発建造がちゃんと働くように</div>'+
	'<div class="listing">&bull; 一部のカーソルアップグレードの解禁個数と価格を変更</div>'+
	'<div class="listing">&bull; 神殿のスロットバグは多分直ってると思う</div>'+
	'<div class="listing">&bull; 「ゲームを始めたのはかなり前」が「ほんのすぐ前」に見えるのを修正。</div>'+
	'<div class="listing">&bull; CookieClickerが丁度4周年を迎えたよ。ずーっと長く続けてくれてありがとう!</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2017/07/15 - 宗教と魔法のアップデート</div>'+
	'<div class="listing">&bull; 角砂糖の実装、転生1回さえ済ませていれば結合して成長し、特別なものに使う為の通貨になるよ</div>'+
	'<div class="listing">&bull; 角砂糖を施設に使用すると、施設レベルが上がりCpSが恒久的に向上</div>'+
	'<div class="listing">&bull; 2つの新機能を追加、神殿と魔法使いの塔のレベルを上げるとそれぞれ解禁。将来的に、他の施設にもミニゲームを導入する予定</div>'+
	'<div class="listing">&bull; ゲームを閉じてもバフが保存されるように</div>'+
	'<div class="listing">&bull; 背景変更の永久アップグレードが実装、機能するようになった</div>'+
	'<div class="listing">&bull; トップメニューがスクロールされないように</div>'+
	'<div class="listing">&bull; 時間表記が分かりやすく</div>'+
	'<div class="listing">&bull; 今や クリックフィーバー のお株を奪いつつある 翔べよドラゴン だけど、両者が同時に出現するのはそうそうないだろうね</div>'+
	'<div class="listing">&bull; 古いバグをいくつか片づけていったら、新しいバグに置き換わった</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2016/07/24 - ゴールデンクッキーは生まれ変われり</div>'+
	'<div class="listing">&bull; ゴールデンクッキーとトナカイは、明確に定義された効果を含む、新しいシステムに従って作動</div>'+
	'<div class="listing">&bull; ゴールデンクッキーの新たな効果を幾つか追加</div>'+
	'<div class="listing">&bull; イースターエッグのCpS上昇効果が、それぞれ乗算されるように変更</div>'+
	'<div class="listing">&bull; 輝く虫がセーブ可能に</div>'+
	'<div class="listing">&bull; トナカイの機能を少し調整</div>'+
	'<div class="listing">&bull; 天国系アップグレードツリーの始点付近に、新たなクッキーアップグレードを追加。早期転生の補助、及びゲーム全体のスピードアップに役立ててもらえれば</div>'+
	'<div class="listing">&bull; EU法に則り、ブラウザのCookieについて警告メッセージを実装。誰もが解る皮肉でしょ?</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2016/02/08 - 受け継がれるもの</div>'+
	'<div class="listing"><b>ほぼ2年の長期にわたるベータテストで実装されたすべてを、この現行正式版に追加。要約すると :</b></div>'+
	'<div class="listing">&bull; 3つの新施設 : 銀行、神殿、魔法使いの塔。これらを既存施設群の中間に配置、それにより、幾つかの施設関連の実績に狂いが生じる可能性あり。</div>'+
	'<div class="listing">&bull; 転生システムは、ヘブンリーアップグレードツリーの実績と共に最初からやり直し</div>'+
	'<div class="listing">&bull; 天使の力でオフライン生産、チャレンジモード、クッキードラゴンなどの謎の新機能</div>'+
	'<div class="listing">&bull; 効果音の追加(設定で無効に変更可能)</div>'+
	'<div class="listing">&bull; 再調整とバグ修正がテンコ盛り</div>'+
	'<div class="listing">&bull; アップグレードと実績がちょこっと増えたかも</div>'+
	'<div class="listing">&bull; クッキーのクリックをもっと楽しくするカスタマイズの為の真新しい仕掛けの追加オプション</div>'+
	'<div class="listing">&bull; 一層快適なプレイの為に : 施設まとめ買い、各種スイッチ、その他が、より便利に、より判りやすく</div>'+
	'<div class="listing">&bull; 幾つかの<a href="http://en.wikipedia.org/wiki/'+choose(['Krzysztof_Arciszewski','Eustachy_Sanguszko','Maurycy_Hauke','Karol_Turno','Tadeusz_Kutrzeba','Kazimierz_Fabrycy','Florian_Siwicki'])+'" target="_blank">ジェネラルポリッシュ</a>を追加</div>'+/* i liked this dumb pun too much to let it go unnoticed */
	'<div class="listing">&bull; その他、正確に思い出せないくらい非常に沢山の細々とした事。</div>'+
	'<div class="listing">旧バージョンが見つからない?旧いセーブデータは自動的に<a href="//orteil.dashnet.org/cookieclicker/v10466/" target="_blank">こっち</a>に移されてるよ!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2016/02/05 - 受け継がれるもの ベータ、更に修正</div>'+
	'<div class="listing">&bull; チャレンジモードを追加、転生時にモード変更可能(今のところ1つのみ : 『再誕』)</div>'+
	'<div class="listing">&bull; 施設の一括購入、売却のやり方を変更</div>'+
	'<div class="listing">&bull; 目障りなバグはローラーでコロコロしといた</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2016/02/03 - 受け継がれるもの ベータ、part 3</div>'+
	'<div class="listing warning">&bull; 大抵のバグは修正されましたが、全般的に僅かな不具合が残っている可能性があります。</div>'+
	'<div class="listing">&bull; 追加要素'+
		'<div style="opacity:0.8;margin-left:12px;">'+
		'-更に幾つかの実績<br>'+
		'-見栄えに関する新たなオプション、その代わりCSSの負荷が増す(初期状態では無効)<br>'+
		'-少々耳障りな大クッキークリック音に関する新たなオプション。(初期状態では有効)<br>'+
		'-統計画面でのアイコンに木枠を表示するかに関する新たなオプション<br>'+
		'-セーブ&ロードを直接テキストファイルを介して行う為の新しいボタン<br>'+
		'</div>'+
	'</div>'+
	'<div class="listing">&bull; 変更要素'+
		'<div style="opacity:0.8;margin-left:12px;">'+
		'-ゲーム序盤の進行を少し早めてくれ、終盤の苦行を少しでも緩和してくれ頼むお願い…って泣き付かれた<br>'+
		'-翔べよドラゴン が阿呆みたいに強過ぎたから、少々弱体化<br>'+
		'-再調整がキツすぎる或いは不十分と感じたら、どんどん報せてね<br>'+
		'-サンタ及びイースターアップグレードの値段は数分程度のCpS依存だったが、今はサンタレベル及び所有している卵の数にそれぞれ依存している<br>'+
		'-クッキーアップグレードの効果が今は加算ではなく乗算でそれぞれ積み重なるように<br>'+
		'-ゴールデンスイッチの効果は現在CpS+50%、 残された幸運 があればゴールデンクッキーアップグレードの所有数に応じCpS+10%(それぞれ、+25%、+1%から上方修正)<br>'+
		'-ラッキーとクッキーチェインの配当を少し改修、良くなったかもしれないし、良くならなかったかもしれない!<br>'+
		'-虫の最大数を以前8匹(天国系アップグレードで10匹)に減らしたが、また元の10匹(同様に12匹)に戻した<br>'+
		/*'-all animations are now handled by requestAnimationFrame(), which should hopefully help make the game less resource-intensive<br>'+*/
		'-転生回数の実績解除を目指すなら、名声レベルを最低でも1上げないとカウントされないよ<br>'+
		'-CookieClickerでおなじみのあのフォント(Kavoon)がFirefoxでバグる為、新しいフォント(Merriweather)に変更<br>'+
		'-幻の皺だらけ生物の出現率がまさに幻レベルに低下した、でも関連する隠し実績があるよ<br>'+
		'</div>'+
	'</div>'+
	'<div class="listing">&bull; 修正要素'+
		'<div style="opacity:0.8;margin-left:12px;">'+
		'-名声は予定通り1LvにつきCpS+1%のボーナスを付与する、+100%じゃない<br>'+
		'-転生の度にヘブンリーチップスがべらぼうに増えることももうない<br>'+
		'-お店内のアップグレードはもうランダムで不規則な並び方はしない<br>'+
		'-ゲーム画面は再び任意のサイズに変更可能<br>'+
		'-「統計」と「設定」ボタンの位置を再び入れ替え<br>'+
		'-ゴールデンクッキーの効果音がいくらか聞き取りやすく<br>'+
		'-転生画面のCPU使用率がマシになったはず<br>'+
		'</div>'+
	'</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2015/12/20 - 受け継がれるもの ベータ、part 2</div>'+
	'<div class="listing warning">&bull; 既存のベータ版セーブデータを消去しました。生じた矛盾と崩壊しきったバランスを初期化する為です。最初からプレイをやり直す必要があります - それは、今回の更新を一から丸ごと堪能できる新鮮な体験であると同時に、小さくも恐ろしい、紛れもなく厄介な数多のバグに遭遇するリスクもあるということです</div>'+
	'<div class="listing warning">&bull; 現行正式版からデータを読み込むのもまた結構なことです</div>'+
	'<div class="listing">&bull; この更新に酷く手間取っていた間に、CookieClickerは2周年を迎えていたよ!ばんざーい!</div>'+
	'<div class="listing">&bull; 新しいアップグレードと実績を山盛り追加</div>'+
	'<div class="listing">&bull; 一連のバグをまとめて修正</div>'+
	'<div class="listing">&bull; 沢山のバランス修正</div>'+
	'<div class="listing">&bull; ヘブンリーチップスとヘブンリークッキーの改修(まだ様子見、更に調整を加える予定)</div>'+
	'<div class="listing">&bull; ドラゴンを仲間にできるようになった</div>'+
	'<div class="listing">&bull; お店欄に各種スイッチと季節切り替え等の専用スペースを設けた</div>'+
	'<div class="listing">&bull; Ctrl-SとCtrl-Oで、それぞれ即手動セーブと読み込みメニューを開くことが可能に</div>'+
	'<div class="listing">&bull; テストとして、簡単な効果音を幾つか追加</div>'+
	'<div class="listing">&bull; 更にオプションをいくつか追加</div>'+
	'<div class="listing">&bull; その他の変更と追加が更に盛り沢山</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2014/08/25 - 受け継がれるもの ベータ、part 1</div>'+
	'<div class="listing">&bull; 3つの新施設</div>'+
	'<div class="listing">&bull; 価格とCpSの増加曲線を見直し</div>'+
	'<div class="listing">&bull; CpS計算式の変更。クッキーアップグレードの効果が乗算に</div>'+
	'<div class="listing">&bull; 名声システムは、全てが新要素のアップグレードツリーと共に最初からやり直し</div>'+
	'<div class="listing">&bull; 幾つかの<a href="http://en.wikipedia.org/wiki/'+choose(['Krzysztof_Arciszewski','Eustachy_Sanguszko','Maurycy_Hauke','Karol_Turno','Tadeusz_Kutrzeba','Kazimierz_Fabrycy','Florian_Siwicki'])+'" target="_blank">ジェネラルポリッシュ</a>を追加</div>'+
	'<div class="listing">&bull; その他様々な修正と追加が山のように</div>'+
	'<div class="listing">&bull; CookieClicker1周年!(みんな支援ありがとう!)</div>'+
	'<div class="listing warning">&bull; メモ : これはベータ版です。バグや不備が発生する可能性があります。不審な挙動など見つけた場合、遠慮なく情報、ご意見お寄せください!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2014/05/18 - イースターを逸すたーよりマシ</div>'+
	'<div class="listing">&bull; ウサギと卵、どうにかこうにか</div>'+
	'<div class="listing">&bull; 書き出しを開くときはそのままキーボードショートカットでコピペしてね</div>'+
	'<div class="listing">&bull; ベーカリーに名前を付けたい?どうぞどうぞ</div>'+
	'<div class="listing">&bull; 「素早い通知」設定は全てのポップアップ通知を直ぐ閉じるようにする。表示中の全通知を一括消去するボタンも追加</div>'+
	'<div class="listing">&bull; ダンジョンベータ版は今は<a href="//orteil.dashnet.org/cookieclicker/betadungeons" target="_blank">/ベータダンジョン</a>で遊べるよ</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2014/04/09 - 天国の悪夢</div>'+
	'<div class="listing">&bull; データ破損 : 一部プレイヤーのヘブンリーチップスが失われる事態</div>'+
	'<div class="listing">&bull; 先ずはベータテストで更新を行う予定</div>'+
	'<div class="listing">&bull; 重ね重ね申し訳ない</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2014/04/09 - 快適なゲームライフ</div>'+
	'<div class="listing">&bull; 新たな段階のアップグレードと実績を追加</div>'+
	'<div class="listing">&bull; ポップアップ通知と書き出し、読み込み用ウインドウがよりイイ感じに</div>'+
	'<div class="listing">&bull; 施設の説明欄の情報がより詳しく</div>'+
	'<div class="listing">&bull; <a href="https://github.com/Icehawk78/FrozenCookies" target="_blank">フローズンクッキー</a>アドオンで使用されている、数値短縮表示の簡易版を設定に導入</div>'+
	'<div class="listing">&bull; 施設の10個まとめ買いと全売却が可能になった</div>'+
	'<div class="listing">&bull; 非常に多くの最適化と微妙で判り難い変更</div>'+
	'<div class="listing">&bull; なんと<a href="//orteil.dashnet.org/cookies2cash/" target="_blank">クッキーを現金に変換</a>できる!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2014/04/05 - 可哀想なおバカさん</div>'+
	'<div class="listing">&bull; 皺だらけの虫は確実に保存されるようになったから、もうゲームをリロードする度に一々潰さなくて済む</div>'+
	'<div class="listing">&bull; クッキーを100億枚焼くと地方ニュースで報じられ、記念にクッキー1枚と実績を獲得</div>'+
	'<div class="listing">&bull; 諸々の修正と細やかな追加</div>'+
	'<div class="listing">&bull; ソース内に、非常に初歩的な改造用プログラムを幾つか追加</div>'+
	'<div class="listing">&bull; Opera愛用者に朗報、ゲームが再び動くようになった</div>'+
	'<div class="listing">&bull; 汎用ランダム文章生成ツールを作成するためのツール、<a href="//orteil.dashnet.org/randomgen/" target="_blank">RandomGen</a>を是非やってみてね!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2014/04/01 - クッキー飽きたから別のゲームに浮気したｗｗｗ</div>'+
	'<div class="listing">&bull; そろそろ潮時だ : CookieClickerは遥かに現実的な内容の CookieBaker にチェンジした</div>'+
	'<div class="listing">&bull; 季節切り替えのコストが安くなり、時間切れになったら確実にスイッチを確実に再解除する</div>'+
	'<div class="listing">&bull; 施設はちゃんと適切に解除される(注意 : 施設解除は全くの演出であってゲームプレイに何の支障もないよ)</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2014/02/14 - なないろはぁと黙示録</div>'+
	'<div class="listing">&bull; 新しい施設(久々の)。今後も続々登場するよ!</div>'+
	'<div class="listing">&bull; ハートの季節に切り替え可能(アップグレード解除に必要なヘブンリーチップスは5000個なり)</div>'+
	'<div class="listing">&bull; 新たな季節クッキーは愛が憎しみに代わりそうなくらい超ぼったくり価格</div>'+
	'<div class="listing">&bull; ゴールデンクッキー効果の残り時間を示すタイマーバーを実装</div>'+
	'<div class="listing">&bull; ゲーム開始時に未購入施設は非表示、購入し稼働開始するとグラフィックを表示</div>'+
	'<div class="listing">&bull; 技術的なこと : ゲームデータをCookieの代わりにローカルストレージに保存するようにした、お陰であの完璧なダジャレがもう使えない</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/12/22 - メリー修正しマス</div>'+
	'<div class="listing">&bull; クリスマスアップグレードに関する一部の問題を修正</div>'+
	'<div class="listing">&bull; トナカイのクッキードロップ率が上がった</div>'+
	'<div class="listing">&bull; トナカイの複数形に「s」は不要だから消した</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2013/12/20 - クリスマスがやってきた</div>'+
	'<div class="listing">&bull; 祝祭用の新しい進化するアップグレードをストアに入荷</div>'+
	'<div class="listing">&bull; トナカイが画面内を狂ったように駆け回る(捕まえられるもんなら捕まえてみろよ!)</div>'+
	'<div class="listing">&bull; ゲームウィンドウを閉じる時に警告表示する新たな設定を追加、これで養殖中の虫を失わずに済む</div>'+
	'<div class="listing">&bull; 同時に、カーソル表示用の個別オプションを追加</div>'+
	'<div class="listing">&bull; ハロウィンの機能は未だ全部有効(それと クッキーおばけ の実績が取得済みなら、ハロウィンクッキーのドロップ率が上がるようになった)</div>'+
	'<div class="listing">&bull; そうそう、<a href="http://www.redbubble.com/people/dashnet" target="_blank">CookieClickerのTシャツ、ステッカー、パーカー</a>が出来たよ!(まじイカス)</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/10/29 - おばけのこうしん</div>'+
	'<div class="listing">&bull; グランマポカリプスで皺くちゃ芋虫発生、大クッキーに辿り着いた途端CpSに損害を与える醜悪で老婆のようなクリーチャー。幸い、奴らをクリックすれば爆発四散する(しかも奴らが食い溜めたクッキーが還ってくる - 利息付きで!)。</div>'+
	'<div class="listing">&bull; レッドクッキーがいつもの27%気味悪く</div>'+
	'<div class="listing">&bull; その他色々</div>'+
	'<div class="listing">&bull; CookieClickerに影響を与えたゲームの続編、<a href="http://candybox2.net/" target="_blank">キャンディボックス2</a>が出たぞ!是非遊んで確かめてくれ!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">15/10/2013 - 他言無用</div>'+
	'<div class="listing">&bull; クッキー11枚でヘブンリーチップスの効果を5%解放する新たな天国系アップグレードを追加(もし 天国の鍵 を購入済みなら、再度買い直さないといけないかも、ゴメンね)</div>'+
	'<div class="listing">&bull; つながれクッキーが正しく動作するように</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/10/15 - プレイヤーに優しい</div>'+
	'<div class="listing">&bull; 天国系アップグレードがまじ、まじ嘘みたいに安くなった</div>'+
	'<div class="listing">&bull; 5段階目の施設アップグレード価格が5分の1に値下がり</div>'+
	'<div class="listing">&bull; 派手なグラフィック をオフにするだけでカーソルを非表示に、後でカーソル専用の切り替え設定を追加する予定</div>'+
	'<div class="listing">&bull; 警告 : 今回の更新でクッキーモンスターアドオンがバグる模様、開発者が更新を行うまで待つのがいいかも</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/10/15 - ちょっと修正</div>'+
	'<div class="listing">&bull; 呆れるほど頻繁に発生していたゴールデンクッキーは落ち着きを取り戻した</div>'+
	'<div class="listing">&bull; 派手なグラフィック をオフにすると、カーソルのアニメーションが無効に</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/10/14 - 見せ給え、諸君らの本気を</div>'+
	'<div class="listing">&bull; つながれクッキー の仕様を少し変更</div>'+
	'<div class="listing">&bull; ゴールデンクッキーの発生にランダム性が増した</div>'+
	'<div class="listing">&bull; CpS実績にゴールデンクッキーによる強化は無効</div>'+
	'<div class="listing">&bull; クッキーベイキング実績の達成条件を変更</div>'+
	'<div class="listing">&bull; ヘブンリーチップスの効果を最大限発揮するには専用のアップグレードが必要</div>'+
	'<div class="listing">&bull; ヘブンリーチップスの獲得数に応じ、4種類のクッキーアップグレードが購入可能</div>'+
	'<div class="listing">&bull; スピードベイキングの実績は、天国系アップグレードを買わずに達成しないと解除されなくなった。なので、最初に想定した難易度で再挑戦してもらう為に、全プレイヤーの該当実績(ハードコア実績含む)をリセットしたからね</div>'+
	'<div class="listing">&bull; モバイル端末でのプレイ感が向上した</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/10/01 - サクサク動いてサクサク進む</div>'+
	'<div class="listing">&bull; 一部の視覚効果を完全に書き直し、よりスムーズに動くようになった(CPU使用率も軽減)</div>'+
	'<div class="listing">&bull; 更に上位のアップグレードを追加</div>'+
	'<div class="listing">&bull; ミルクの種類が増えた</div>'+
	'<div class="listing">&bull; つながれクッキー の上限システムを変更</div>'+
	'<div class="listing">&bull; 反物質凝縮器の値段を元通りにした</div>'+
	'<div class="listing">&bull; ヘブンリーチップスの効果をCpS+2%に戻した(将来的に色々手を加える予定)</div>'+
	'<div class="listing">&bull; 農場の生産力が少しアップ(要望多数につき)</div>'+
	'<div class="listing">&bull; ダンジョンはもう少し組み立ててから近々リリースするつもり - 完成が待ち遠しい!(未完成の<a href="//orteil.dashnet.org/cookieclicker/betadungeons/" target="_blank">ベータ版</a>なら遊べるよ)</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2014/09/28 - ダンジョン ベータ</div>'+
	'<div class="listing">&bull; 今後、大規模な更新は先ずベータテストを通してから実装することにした(<a href="//orteil.dashnet.org/cookieclicker/betadungeons/" target="_blank">お試しはこちら</a>で)</div>'+
	'<div class="listing">&bull; 初めてのダンジョン!(工場50所有でアンロック!)</div>'+
	'<div class="listing">&bull; つながれクッキー の連鎖が伸ばせるようになった</div>'+
	'<div class="listing">&bull; 反物質凝縮器を少し値上げ</div>'+
	'<div class="listing">&bull; ヘブンリーチップスの効果は現在1枚につきCpS+1%(凝縮器から作られる大量のクッキーを考慮して)</div>'+
	'<div class="listing">&bull; 全アップグレードにフレーバーテキストを追加</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/09/15 - 反物質産クッキー</div>'+
	'<div class="listing">&bull; 通常物質からクッキーを作るには限度がある?ならば期待の新施設、反物質凝縮器を試し給え!</div>'+
	'<div class="listing">&bull; 混乱を避けるためにハードリセットを「セーブデータ削除」に名前変更</div>'+
	'<div class="listing">&bull; 隠しだったリセット実績を通常扱いに変更、手持ちの量ではなく、累計総生産が該当条件になる</div>'+
	'<div class="listing">&bull; ヘブンリーチップスが少し弱体化(且つ等比数列に従って得られるようになった : 1兆で最初の1個が、2兆で2個目が、など)。名声システムは将来的に(ダンジョン実装後)仕組みを大々的に見直す予定</div>'+
	'<div class="listing">&bull; ゴールデンクッキーのクリック数が、ソフトリセット後も引き継がれるようになった</div>'+
	'<div class="listing">&bull; 統計欄にプレイ時間の項目を追加</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/09/08 - 終わりの無いクッキー</div>'+
	'<div class="listing">&bull; 名声システムを追加 - リセットするとCpSに永久ボーナス(クッキーを大量生産してからリセットすれば、より多くのボーナス!)</div>'+
	'<div class="listing">&bull; 保存形式を少し変更し、セーブデータの容量をちょっと節約</div>'+
	'<div class="listing">&bull; ゴールデンクッキークリック数777回の レプラコーン は隠し実績に変更。新しい通常実績にゴールデンクッキークリック数77回の 運命の女神 を追加</div>'+
	'<div class="listing">&bull; クリックフィーバーの効果が777倍に</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/09/04 - 気が利くクッキー</div>'+
	'<div class="listing">&bull; ゴールデンクッキーから20%の確率で同一効果が2回連続して出るようになった</div>'+
	'<div class="listing">&bull; ゴールデンクッキーのアップグレードを追加</div>'+
	'<div class="listing">&bull; 誓約 の残り時間が2倍になるアップグレード(10回宥めると出現)を追加</div>'+
	'<div class="listing">&bull; 垓手観音 の効果が2倍に</div>'+
	'<div class="listing">&bull; 奇怪なクリック の達成が実に運任せ過ぎであったのを見直し。通常実績に変更し、世界記録並みの単純に『超速い』クリックで達成が可能</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/09/02 - 改善策</div>'+
	'<div class="listing">&bull; 契約 が更に低価格に、  契約破棄 も同様に安く(同時にそれを得る為の新実績を追加)</div>'+
	'<div class="listing">&bull; 各グランマのアップグレード出現には、各施設15以上を必要とする</div>'+
	'<div class="listing">&bull; クソ忌々しい最低のカーソルは駆逐して新しい表示形式のカーソルに固定</div>'+
	'<div class="listing">&bull; ゲームの負担を軽減する、画像の質を落とすオプションを追加</div>'+
	'<div class="listing">&bull; セーブデータ暗号化用のbase64エンコードの処理を変更。これで一部の旧いブラウザでも再びセーブ可能になるかも</div>'+
	'<div class="listing">&bull; 隠し実績を独自の欄に分けて表示</div>'+
	'<div class="listing">&bull; ラズベリージュースをラズベリーミルクと改名、ラズベリージュースが美味しくてクッキーにもよく合うって事実にも関わらず</div>'+
	'<div class="listing">&bull; 修正 : カーソルが大クッキーをつつくように。 派手なグラフィクス ボタンを改名。カーソルに対しクッキー所持数の視認性をアップ</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/09/01 - 整理整頓</div>'+
	'<div class="listing">&bull; 統計ページにアップグレードと実績の一覧を規則的に配置</div>'+
	'<div class="listing">&bull; 契約 の価格がお求めやすく、ペナルティは少し控えめに</div>'+
	'<div class="listing">&bull; 宣言通り、最初のバージョンからのデータ読み込みを無効にした</div>'+
	'<div class="listing">&bull; 統合思念 を購入する際に確認ダイアログを表示</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/08/31 - 修正プログラム</div>'+
	'<div class="listing">&bull; グランマポカリプスを永久に停止する方法を追加</div>'+
	'<div class="listing">&bull; 誓約 の価格に上限が付いた</div>'+
	'<div class="listing">&bull; 統合思念 はじめ研究関連のアップグレードが少しパワーアップ、全てではないけれど</div>'+
	'<div class="listing">&bull; 「ゴールデン」クッキーが再びグランマポカリプス中に出現するように。 誓約 関連の実績が解除可能に</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2013/08/31 - おばあちゃん多すぎ</div>'+
	'<div class="listing">&bull; グランマポカリプスが帰ってきた、色んなタイプのおばあちゃんと共に</div>'+
	'<div class="listing">&bull; CpSに比例してクリック力が高まるアップグレードを幾つか追加</div>'+
	'<div class="listing">&bull; クリックに関する実績の難易度アップ。 ネバークリック は隠し実績扱いに。 奇怪なクリック はまさに世界記録レベルの速さが必要</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/08/28 - やりこむ人向け</div>'+
	'<div class="listing">&bull; 実績をちょこっと追加</div>'+
	'<div class="listing">&bull; 「X枚クッキーを焼く」実績の見直しにより、これらの実績達成にはかなりのやりこみが必要</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/08/27 - まずいアイデア</div>'+
	'<div class="listing">&bull; 沢山の要望に応じ、5つの実績を撤回(「リセット」と「チート」の)。これらは未だ取ろうとすれば取れるが、解除済み実績の総数にはカウントされない。大丈夫、近々もっと沢山の実績を用意するから!</div>'+
	'<div class="listing">&bull; 謎の隠し実績を幾つか追加</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2013/08/27 - 達成感</div>'+
	'<div class="listing">&bull; 実績を追加(ミルクも)</div>'+
	'<div class="listing"><i>(大型アップデートだから、仮にデータが幾つか損なわれていたとしても怒らないでね!)</i></div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/08/26 - 更に上位のアップグレード</div>'+
	'<div class="listing">&bull; アップグレードを更に追加(ゴールデンクッキー関連を幾つか含む)</div>'+
	'<div class="listing">&bull; クリック数に関する統計を追加</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/08/26 - 更に微調整</div>'+
	'<div class="listing">&bull; カーソルのアップグレードを幾つか調整</div>'+
	'<div class="listing">&bull; タイムマシンがやや弱体化</div>'+
	'<div class="listing">&bull; オフラインモードの設定追加</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/08/25 - 微調整</div>'+
	'<div class="listing">&bull; ゲームの進度曲線を再調整(中～終盤は各種購入費がより高くなるが、より強力になる)</div>'+
	'<div class="listing">&bull; クッキーアップグレードを幾つか追加</div>'+
	'<div class="listing">&bull; カーソルのCpSがアップ</div>'+
	'<div class="listing">&bull; 施設に売却ボタンを追加</div>'+
	'<div class="listing">&bull; ゴールデンクッキーの有益性がアップ</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">2013/08/24 - 修正プログラム</div>'+
	'<div class="listing">&bull; 読み込み/書き出し機能を追加、必要なら旧バージョンのセーブデータを回収しておくように(多すぎるチート防止のため、1週間以内にセーブデータを無効化するからね)</div>'+
	'<div class="listing">&bull; 沢山の要望に応じ、お店のアップグレード欄を折り畳み式に(マウスオーバーで全表示)</div>'+
	'<div class="listing">&bull; 更新履歴を追加</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2013/08/24 - ドカンと更新!</div>'+
	'<div class="listing">&bull; ゲーム全体を改修(グラフィックス、ゲームの仕組みを一新)</div>'+
	'<div class="listing">&bull; アップグレード追加</div>'+
	'<div class="listing">&bull; 確実なセーブシステム</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">2013/08/08 - ゲーム初公開</div>'+
	'<div class="listing">&bull; 暇つぶしに数時間で作ったゲームだよ</div>'+
	'<div class="listing">&bull; でもちょっと後悔してる</div>'+
	'<div class="listing">&bull; ま、いっか</div>'+
	'</div>'+
	'</div>'
	;
	
	Game.ready=0;
	
	Game.Load=function()
	{
		//l('javascriptError').innerHTML='<div style="padding:64px 128px;"><div class="title">Loading...</div></div>';
		Game.Loader=new Loader();
		Game.Loader.domain='img/';
		Game.Loader.loaded=Game.Init;
		Game.Loader.Load(['filler.png']);
	}
	Game.ErrorFrame=function()
	{
		l('javascriptError').innerHTML=
		'<div class="title">Oops. Wrong address!</div>'+
		'<div>It looks like you\'re accessing Cookie Clicker from another URL than the official one.<br>'+
		'You can <a href="//orteil.dashnet.org/cookieclicker/" target="_blank">play Cookie Clicker over here</a>!<br>'+
		'<small>(If for any reason, you are unable to access the game on the official URL, we are currently working on a second domain.)</small></div>';
	}
	Game.timedout=false;
	Game.Timeout=function()
	{
		Game.WriteSave();
		Game.killShimmers();
		l('javascriptError').innerHTML='CookieClickerはスリープモードに入って'+(Game.Has('超絶の双門')?'おり、オフラインでクッキーを作っています':'います')+'。<br><a '+Game.clickStr+'="Game.Resume();">ここをクリック</a>するとセーブファイルから再開します。<br><div style="font-style:italic;font-size:65%;line-height:110%;opacity:0.75;">(一度にあまりにも多くのフレームがスキップされると発生し、<br>通常長い間バックグラウンドでゲームを起動し続けているときです)<br>(この機能は設定メニューからオフにすることができます)</div>';
		l('javascriptError').style.display='block';
		Game.timedout=true;
		console.log('[=== ゲームが休止し、スリープモードに入りました。データはセーブされました。 ===]');
	}
	Game.Resume=function()
	{
		l('javascriptError').innerHTML='';
		l('javascriptError').style.display='none';
		Game.timedout=false;
		Game.time=Date.now();
		Game.accumulatedDelay=0;
		Game.delayTimeouts=0;
		Game.lastActivity=Date.now();
		Game.Loop();
		Game.LoadSave();
		console.log('[=== ゲームが再開されました!データはロードされました。 ===]');
	}
	
	
	Game.Init=function()
	{
		Game.ready=1;

		/*=====================================================================================
		VARIABLES AND PRESETS
		=======================================================================================*/
		Game.T=0;
		Game.drawT=0;
		Game.loopT=0;
		Game.fps=30;
		
		Game.season=Game.baseSeason;
		
		Game.l=l('game');
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
			Game.l.style.bottom = '100px';
			l("topBar").style.top = '100px';
			Game.l.style.top = '132px';
		}
		Game.bounds=0;//rectangle defining screen limits (right,left,bottom,top) updated every logic frame

		if (Game.mobile==1)
		{
			l('wrapper').className='mobile';
		}
		Game.clickStr=Game.touchEvents?'ontouchend':'onclick';
		
		Game.SaveTo='CookieClickerGame';
		if (Game.beta) Game.SaveTo='CookieClickerGameBeta';
		l('versionNumber').innerHTML='v. '+Game.version+'<div id="httpsSwitch" style="cursor:pointer;display:inline-block;background:url(img/'+(Game.https?'lockOn':'lockOff')+'.png);width:16px;height:16px;position:relative;top:4px;left:0px;margin:0px -2px;"></div>'+(Game.beta?' <span style="color:#ff0;">beta</span>':'');
		
		if (Game.beta) {var me=l('linkVersionBeta');me.parentNode.removeChild(me);}
		else if (Game.version==1.0466) {var me=l('linkVersionOld');me.parentNode.removeChild(me);}
		else {var me=l('linkVersionLive');me.parentNode.removeChild(me);}

		//l('links').innerHTML=(Game.beta?'<a href="../" target="blank">Live version</a> | ':'<a href="beta" target="blank">Try the beta!</a> | ')+'<a href="http://orteil.dashnet.org/experiments/cookie/" target="blank">Classic</a>';
		//l('links').innerHTML='<a href="http://orteil.dashnet.org/experiments/cookie/" target="blank">Cookie Clicker Classic</a>';
		
		Game.lastActivity=Date.now();//reset on mouse move, key press or click
		
		//latency compensator stuff
		Game.time=Date.now();
		Game.accumulatedDelay=0;
		Game.delayTimeouts=0;//how many times we've gone over the timeout delay
		Game.catchupLogic=0;
		Game.fpsStartTime=0;
		Game.frameNumber=0;
		Game.currentFps=Game.fps;
		Game.previousFps=Game.currentFps;
		Game.getFps=function()
		{
			Game.frameNumber++;
			var currentTime=(Date.now()-Game.fpsStartTime )/1000;
			var result=Math.floor((Game.frameNumber/currentTime));
			if (currentTime>1)
			{
				Game.fpsStartTime=Date.now();
				Game.frameNumber=0;
			}
			return result;
		}
		
		Game.cookiesEarned=0;//all cookies earned during gameplay
		Game.cookies=0;//cookies
		Game.cookiesd=0;//cookies display
		Game.cookiesPs=1;//cookies per second (to recalculate with every new purchase)
		Game.cookiesPsRaw=0;//raw cookies per second
		Game.cookiesPsRawHighest=0;//highest raw cookies per second this ascension
		Game.cookiesReset=0;//cookies lost to resetting (used to determine prestige and heavenly chips)
		Game.cookieClicks=0;//+1 for each click on the cookie
		Game.goldenClicks=0;//+1 for each golden cookie clicked (all time)
		Game.goldenClicksLocal=0;//+1 for each golden cookie clicked (this game only)
		Game.missedGoldenClicks=0;//+1 for each golden cookie missed
		Game.handmadeCookies=0;//all the cookies made from clicking the cookie
		Game.milkProgress=0;//you gain a little bit for each achievement. Each increment of 1 is a different milk displayed.
		Game.milkH=Game.milkProgress/2;//milk height, between 0 and 1 (although should never go above 0.5)
		Game.milkHd=0;//milk height display
		Game.milkType=0;//custom milk
		Game.bgType=0;//custom background
		Game.chimeType=0;//golden cookie chime
		Game.prestige=0;//prestige level (recalculated depending on Game.cookiesReset)
		Game.heavenlyChips=0;//heavenly chips the player currently has
		Game.heavenlyChipsDisplayed=0;//ticks up or down to match Game.heavenlyChips
		Game.heavenlyChipsSpent=0;//heavenly chips spent on cookies, upgrades and such
		Game.heavenlyCookies=0;//how many cookies have we baked from chips (unused)
		Game.permanentUpgrades=[-1,-1,-1,-1,-1];
		Game.ascensionMode=0;//type of challenge run if any
		Game.resets=0;//reset counter
		Game.lumps=-1;//sugar lumps
		Game.lumpsTotal=-1;//sugar lumps earned across all playthroughs (-1 means they haven't even started yet)
		Game.lumpT=Date.now();//time when the current lump started forming
		Game.lumpRefill=0;//time left before a sugar lump can be used again (on minigame refills etc) in logic frames
		
		Game.makeSeed=function()
		{
			var chars='abcdefghijklmnopqrstuvwxyz'.split('');
			var str='';
			for (var i=0;i<5;i++){str+=choose(chars);}
			return str;
		}
		Game.seed=Game.makeSeed();//each run has its own seed, used for deterministic random stuff
		
		Game.volume=50;//sound volume
		
		Game.elderWrath=0;
		Game.elderWrathOld=0;
		Game.elderWrathD=0;
		Game.pledges=0;
		Game.pledgeT=0;
		Game.researchT=0;
		Game.nextResearch=0;
		Game.cookiesSucked=0;//cookies sucked by wrinklers
		Game.cpsSucked=0;//percent of CpS being sucked by wrinklers
		Game.wrinklersPopped=0;
		Game.santaLevel=0;
		Game.reindeerClicked=0;
		Game.seasonT=0;
		Game.seasonUses=0;
		Game.dragonLevel=0;
		Game.dragonAura=0;
		Game.dragonAura2=0;
		
		Game.fortuneGC=0;
		Game.fortuneCPS=0;
		
		Game.blendModesOn=(document.createElement('detect').style.mixBlendMode==='');
		
		Game.bg='';//background (grandmas and such)
		Game.bgFade='';//fading to background
		Game.bgR=0;//ratio (0 - not faded, 1 - fully faded)
		Game.bgRd=0;//ratio displayed
		
		Game.windowW=window.innerWidth;
		Game.windowH=window.innerHeight;
		
		window.addEventListener('resize',function(event)
		{
			Game.windowW=window.innerWidth;
			Game.windowH=window.innerHeight;
			
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				me.toResize=true;
				if (me.minigame && me.minigame.onResize) me.minigame.onResize();
			}
		});
		
		Game.startDate=parseInt(Date.now());//when we started playing
		Game.fullDate=parseInt(Date.now());//when we started playing (carries over with resets)
		Game.lastDate=parseInt(Date.now());//when we last saved the game (used to compute "cookies made since we closed the game" etc)
		
		Game.prefs=[];
		Game.DefaultPrefs=function()
		{
			Game.prefs.particles=1;//particle effects : falling cookies etc
			Game.prefs.numbers=1;//numbers that pop up when clicking the cookie
			Game.prefs.autosave=1;//save the game every minute or so
			Game.prefs.autoupdate=1;//send an AJAX request to the server every 30 minutes (note : ignored)
			Game.prefs.milk=1;//display milk
			Game.prefs.fancy=1;//CSS shadow effects (might be heavy on some browsers)
			Game.prefs.warn=0;//warn before closing the window
			Game.prefs.cursors=1;//display cursors
			Game.prefs.focus=1;//make the game refresh less frequently when off-focus
			Game.prefs.popups=0;//use old-style popups
			Game.prefs.format=0;//shorten numbers
			Game.prefs.notifs=0;//notifications fade faster
			Game.prefs.animate=1;//animate buildings
			Game.prefs.wobbly=1;//wobbly cookie
			Game.prefs.monospace=0;//alt monospace font for cookies
			Game.prefs.filters=0;//CSS filter effects (might be heavy on some browsers)
			Game.prefs.cookiesound=1;//use new cookie click sound
			Game.prefs.crates=0;//show crates around icons in stats
			Game.prefs.altDraw=0;//use requestAnimationFrame to update drawing instead of fixed 30 fps setTimeout
			Game.prefs.showBackupWarning=1;//if true, show a "Have you backed up your save?" message on save load; set to false when save is exported
			Game.prefs.formatlang=1;//format's language 0:English 1:Japanese
			Game.prefs.extraButtons=1;//if true, show Mute buttons and the building master bar
			Game.prefs.askLumps=0;//if true, show a prompt before spending lumps
			Game.prefs.customGrandmas=1;//if true, show patreon names for grandmas
			Game.prefs.timeout=0;//if true, game may show pause screen when timed out
		}
		Game.DefaultPrefs();
		
		window.onbeforeunload=function(event)
		{
			if (Game.prefs && Game.prefs.warn)
			{
				if (typeof event=='undefined') event=window.event;
				if (event) event.returnValue='Are you sure you want to close Cookie Clicker?';
			}
		}
		
		Game.Mobile=function()
		{
			if (!Game.mobile)
			{
				l('wrapper').className='mobile';
				Game.mobile=1;
			}
			else
			{
				l('wrapper').className='';
				Game.mobile=0;
			}
		}
		
		Game.showBackupWarning=function()
		{
			Game.Notify('セーブデータをバックアップしよう!','またこんにちは!ちょっと念のために、たまに万一に備えてCookieClickerのセーブデータのバックアップを取りたいって思うかもしれないね。<br>それには、設定に行って 「セーブ書き出し」、あるいは「ファイルに書き出し」を押してみてね!<div class="line"></div><a style="float:right;" onclick="Game.prefs.showBackupWarning=0;==CLOSETHIS()==">もう見ない</a>',[25,7]);
		}
		
		/*=====================================================================================
		MODDING API
		=======================================================================================*/
		/*
			to use:
			-have your mod call Game.registerMod("unique id",mod object)
			-the "unique id" value is a string the mod will use to index and retrieve its save data; special characters are ignored
			-the "mod object" value is an object structured like so:
				{
					init:function(){
						//this function is called as soon as the mod is registered
						//declare hooks here
					},
					save:function(){
						//use this to store persistent data associated with your mod
						return 'a string to be saved';
					},
					load:function(str){
						//do stuff with the string data you saved previously
					},
				}
			-the mod object may also contain any other data or functions you want, for instance to make them accessible to other mods
			-your mod and its data can be accessed with Game.mods['mod id']
			-hooks are functions the game calls automatically in certain circumstances, like when calculating cookies per click or when redrawing the screen
			-to add a hook: Game.registerHook('hook id',yourFunctionHere) - note: you can also declare whole arrays of hooks, ie. Game.registerHook('hook id',[function1,function2,...])
			-to remove a hook: Game.removeHook('hook id',theSameFunctionHere)
			-some hooks are fed a parameter you can use in the function
			-list of valid hook ids:
				'logic' - called every logic tick
				'draw' - called every draw tick
				'reset' - called whenever the player resets; parameter is true if this is a hard reset, false if it's an ascension
				'reincarnate' - called when the player has reincarnated after an ascension
				'ticker' - called when determining news ticker text; should return an array of possible choices to add
				'cps' - called when determining the CpS; parameter is the current CpS; should return the modified CpS
				'cookiesPerClick' - called when determining the cookies per click; parameter is the current value; should return the modified value
				'click' - called when the big cookie is clicked
				'create' - called after the game declares all buildings, upgrades and achievs; use this to declare your own - note that saving/loading functionality for custom content is not explicitly implemented and may be unpredictable and broken
				'check' - called every few seconds when we check for upgrade/achiev unlock conditions; you can also use this for other checks that you don't need happening every logic frame
			-function hooks are provided for convenience and more advanced mod functionality will probably involve manual code injection
			-please be mindful of the length of the data you save, as it does inflate the export-save-to-string feature
			
			NOTE: modding API is susceptible to change and may not always function super-well
		*/
		Game.mods={};
		Game.sortedMods=[];
		Game.modSaveData={};
		Game.modHooks={};
		Game.modHooksNames=['logic','draw','reset','reincarnate','ticker','cps','cookiesPerClick','click','create','check'];
		for (var i=0;i<Game.modHooksNames.length;i++){Game.modHooks[Game.modHooksNames[i]]=[];}
		Game.registerMod=function(id,obj)
		{
			id=id.replace(/\W+/g,' ');
			if (Game.mods[id]) {console.log('ERROR: mod already registered with the id "'+id+'".');return false;}
			Game.mods[id]=obj;
			Game.sortedMods.push(obj);
			obj.id=id;
			console.log('Mod "'+id+'" added.');
			if (Game.Win) Game.Win('サードパーティ');
			if (obj.init) obj.init();
			if (obj.load && Game.modSaveData[id]) obj.load(Game.modSaveData[id]);
		}
		Game.registerHook=function(hook,func)
		{
			if (func.constructor===Array)
			{
				for (var i=0;i<func.length;i++){Game.registerHook(hook,func[i]);}
				return;
			}
			if (typeof func!=='function') return;
			if (typeof Game.modHooks[hook]!=='undefined') Game.modHooks[hook].push(func);
			else console.log('Error: a mod tried to register a non-existent hook named "'+hook+'".');
		}
		Game.removeHook=function(hook,func)
		{
			if (func.constructor===Array)
			{
				for (var i=0;i<func.length;i++){Game.removeHook(hook,func[i]);}
				return;
			}
			if (typeof func!=='function') return;
			if (typeof Game.modHooks[hook]!=='undefined' && Game.modHooks[hook].indexOf(func)!=-1) Game.modHooks[hook].splice(Game.modHooks[hook].indexOf(func),1);
			else console.log('Error: a mod tried to remove a non-existent hook named "'+hook+'".');
		}
		Game.runModHook=function(hook,param)
		{
			for (var i=0;i<Game.modHooks[hook].length;i++)
			{
				Game.modHooks[hook][i](param);
			}
		}
		Game.runModHookOnValue=function(hook,val)
		{
			for (var i=0;i<Game.modHooks[hook].length;i++)
			{
				val=Game.modHooks[hook][i](val);
			}
			return val;
		}
		Game.safeSaveString=function(str)
		{
			//look as long as it works
			str=replaceAll('|','[P]',str);
			str=replaceAll(';','[S]',str);
			return str;
		}
		Game.safeLoadString=function(str)
		{
			str=replaceAll('[P]','|',str);
			str=replaceAll('[S]',';',str);
			return str;
		}
		Game.saveModData=function()
		{
			var str='';
			for (var i=0;i<Game.sortedMods.length;i++)
			{
				if (Game.sortedMods[i]['save']) Game.modSaveData[Game.sortedMods[i].id]=Game.sortedMods[i]['save']();
			}
			for (var i in Game.modSaveData)
			{
				str+=i+':'+Game.safeSaveString(Game.modSaveData[i])+';';
			}
			return str;
		}
		Game.loadModData=function()
		{
			for (var i in Game.modSaveData)
			{
				if (Game.mods[i] && Game.mods[i]['load']) Game.mods[i]['load'](Game.modSaveData[i]);
			}
		}
		Game.deleteModData=function(id)
		{
			if (Game.modSaveData[id]) delete Game.modSaveData[id];
		}
		Game.deleteAllModData=function()
		{
			Game.modSaveData={};
		}
		Game.CheckModData=function()
		{
			var modsN=0;
			var str='';
			for (var i in Game.modSaveData)
			{
				str+='<div style="border-bottom:1px dashed rgba(255,255,255,0.2);clear:both;overflow:hidden;padding:4px 0px;">';
					str+='<div style="float:left;width:49%;text-align:left;overflow:hidden;"><b>'+i+'</b>';
						if (Game.mods[i]) str+=' (読み込み済)';
					str+='</div>';
					str+='<div style="float:right;width:49%;text-align:right;overflow:hidden;">'+Game.modSaveData[i].length+'文字<a class="option warning" style="padding:0px 2px;font-size:10px;margin:0px;vertical-align:top;" '+Game.clickStr+'="Game.deleteModData(\''+i+'\');PlaySound(\'snd/tick.mp3\');Game.ClosePrompt();Game.CheckModData();">X</a>';
					str+='</div>';
				str+='</div>';
				modsN++;
			}
			if (modsN==0) str+='現在MODのデータはありません。';
			else str+='<div><a class="option warning" style="font-size:11px;margin-top:4px;" '+Game.clickStr+'="Game.deleteAllModData();PlaySound(\'snd/tick.mp3\');Game.ClosePrompt();Game.CheckModData();">Delete all</a></div>';
			Game.Prompt('<h3>MODデータ</h3><div class="block">現在あなたのセーブデータにMODのデータがあります。セーブファイルのサイズを小さくするためにこのデータの一部を削除してもよいかもしれません。</div><div class="block" style="font-size:11px;">'+str+'</div>',['戻る']);
		}
		
		Game.LoadMod=function(url)//this loads the mod at the given URL and gives the script an automatic id (URL "http://example.com/my_mod.js" gives the id "modscript_my_mod")
		{
			var js=document.createElement('script');
			var id=url.split('/');id=id[id.length-1].split('.')[0];
			js.setAttribute('type','text/javascript');
			js.setAttribute('id','modscript_'+id);
			js.setAttribute('src',url);
			document.head.appendChild(js);
			console.log('Loaded the mod '+url+', '+id+'.');
		}
		
		
		
		if (false)
		{
			//EXAMPLE MOD
			Game.registerMod('test mod',{
				/*
					what this example mod does:
					-double your CpS
					-display a little popup for half a second whenever you click the big cookie
					-add a little intro text above your bakery name, and generate that intro text at random if you don't already have one
					-save and load your intro text
				*/
				init:function(){
					Game.registerHook('reincarnate',function(){Game.mods['test mod'].addIntro();});
					Game.registerHook('check',function(){if (!Game.playerIntro){Game.mods['test mod'].addIntro();}});
					Game.registerHook('click',function(){Game.Notify(choose(['A good click.','A solid click.','A mediocre click.','An excellent click!']),'',0,0.5);});
					Game.registerHook('cps',function(cps){return cps*2;});
				},
				save:function(){
					//note: we use stringified JSON for ease and clarity but you could store any type of string
					return JSON.stringify({text:Game.playerIntro})
				},
				load:function(str){
					var data=JSON.parse(str);
					if (data.text) Game.mods['test mod'].addIntro(data.text);
				},
				addIntro:function(text){
					//note: this is not a mod hook, just a function that's part of the mod
					Game.playerIntro=text||choose(['oh snap, it\'s','watch out, it\'s','oh no! here comes','hide your cookies, for here comes','behold! it\'s']);
					if (!l('bakerySubtitle')) l('bakeryName').insertAdjacentHTML('afterend','<div id="bakerySubtitle" class="title" style="text-align:center;position:absolute;left:0px;right:0px;bottom:32px;font-size:12px;pointer-events:none;text-shadow:0px 1px 1px #000,0px 0px 4px #f00;opacity:0.8;"></div>');
					l('bakerySubtitle').textContent='~'+Game.playerIntro+'~';
				},
			});
		}
		
		
		
		//replacing an existing canvas picture with a new one at runtime : Game.Loader.Replace('perfectCookie.png','imperfectCookie.png');
		//upgrades and achievements can use other pictures than icons.png; declare their icon with [posX,posY,'http://example.com/myIcons.png']
		//check out the "UNLOCKING STUFF" section to see how unlocking achievs and upgrades is done
		
		
		
		/*=====================================================================================
		BAKERY NAME
		=======================================================================================*/
		Game.RandomBakeryName=function()
		{
			return (Math.random()>0.05?(choose(['魔法の','素敵な','風変わりな','生意気な','粋な','綺麗な','かわいい','海賊','忍者','ゾンビ','ロボット','過激な','モダンな','クールな','めっちゃすごい','あま～い','こわ～い','ダブル','トリプル','ターボ付き','テクノ','ディスコ','エレキ','踊る','あっと驚く','ミュータント','宇宙','化学','古風な','次世代型','キャプテン','髭がある','ラブリー','ちっちゃな','でっかい','炎の','水の','冷凍','メタル','プラスチック','カチカチな','トロトロな','カビだらけ','ピカピカな','ハッピーな','楽しい小さな','ヌルヌルな','おいしい','極うま','腹ぺこ','食いしん坊','死を招く','教授','博士','力の','チョコレート','サクサクな','チョコ','正義の','栄誉ある','語呂合わせ暗記','サイキック','超エキサイト','猫の手も借りたい','イカれた','王様の','神の','貴族の'])):'しょぼい')+choose(['クッキー','ビスケット','マフィン','スコーン','カップケーキ','パンケーキ','チップ','チェーンホイール','装置','操り人形','ミトン','靴下','急須','ミステリー','パン屋','コック','おばあちゃん','クリック','クリッカー','宇宙船','工場','ポータル','機械','実験','モンスター','パニック','泥棒','強盗','お宝','じゃが芋','ピザ','ハンバーガー','ソーセージ','ミートボール','スパゲッティ','マカロニ','子猫','子犬','キリン','シマウマ','オウム','イルカ','子ガモ','ナマケモノ','カメ','ゴブリン','ピクシー','ノーム','コンピューター','海賊','忍者','ゾンビ','ロボット']);
		}
		Game.GetBakeryName=function() {return Game.RandomBakeryName();}
		Game.bakeryName=Game.GetBakeryName();
		Game.bakeryNameL=l('bakeryName');
		Game.bakeryNameL.textContent=Game.bakeryName+'のベーカリー';
		Game.bakeryNameSet=function(what)
		{
			Game.bakeryName=what;
			Game.bakeryName=Game.bakeryName.substring(0,28);
			Game.bakeryNameRefresh();
		}
		Game.bakeryNameRefresh=function()
		{
			var name=Game.bakeryName;
			if (name.slice(-1).toLowerCase()=='s') name+='のベーカリー'; else name+='のベーカリー';
			Game.bakeryNameL.textContent=name;
			name=Game.bakeryName.toLowerCase();
			if (name=='orteil') Game.Win('神様コンプレックス');
			if (name.indexOf('saysopensesame',name.length-('saysopensesame').length)>0 && !Game.sesame) Game.OpenSesame();
			Game.recalculateGains=1;
		}
		Game.bakeryNamePrompt=function()
		{
			Game.Prompt('<h3>あなたのベーカリーの名前</h3><div class="block" style="text-align:center;">あなたのベーカリーの名前はなんですか?</div><div class="block"><input type="text" style="text-align:center;width:100%;" id="bakeryNameInput" value="'+Game.bakeryName+'"/></div>',[['決定','if (l(\'bakeryNameInput\').value.length>0) {Game.bakeryNameSet(l(\'bakeryNameInput\').value);Game.Win(\'名前なんて意味ないね\');Game.ClosePrompt();}'],['ランダム','Game.bakeryNamePromptRandom();'],'キャンセル']);
			l('bakeryNameInput').focus();
			l('bakeryNameInput').select();
		}
		Game.bakeryNamePromptRandom=function()
		{
			l('bakeryNameInput').value=Game.RandomBakeryName();
		}
		AddEvent(Game.bakeryNameL,'click',Game.bakeryNamePrompt);
		
		
		/*=====================================================================================
		TOOLTIP
		=======================================================================================*/
		Game.tooltip={text:'',x:0,y:0,origin:'',on:0,tt:l('tooltip'),tta:l('tooltipAnchor'),shouldHide:1,dynamic:0,from:0};
		Game.tooltip.draw=function(from,text,origin)
		{
			this.shouldHide=0;
			this.text=text;
			this.from=from;
			//this.x=x;
			//this.y=y;
			this.origin=origin;
			var tt=this.tt;
			var tta=this.tta;
			tt.style.left='auto';
			tt.style.top='auto';
			tt.style.right='auto';
			tt.style.bottom='auto';
			if (typeof this.text==='function')
			{
				var text=this.text();
				if (text=='') tta.style.opacity='0';
				else
				{
					tt.innerHTML=unescape(text);
					tta.style.opacity='1';
				}
			}
			else tt.innerHTML=unescape(this.text);
			//tt.innerHTML=(typeof this.text==='function')?unescape(this.text()):unescape(this.text);
			tta.style.display='block';
			tta.style.visibility='hidden';
			Game.tooltip.update();
			tta.style.visibility='visible';
			this.on=1;
		}
		Game.tooltip.update=function()
		{
			var X=0;
			var Y=0;
			var width=this.tt.offsetWidth;
			var height=this.tt.offsetHeight;
			if (this.origin=='store')
			{
				X=Game.windowW-332-width;
				Y=Game.mouseY-32;
				if (Game.onCrate) Y=Game.onCrate.getBoundingClientRect().top-42;
				Y=Math.max(0,Math.min(Game.windowH-height-44,Y));
				/*this.tta.style.right='308px';//'468px';
				this.tta.style.left='auto';
				if (Game.onCrate) Y=Game.onCrate.getBoundingClientRect().top-2;
				this.tta.style.top=Math.max(0,Math.min(Game.windowH-this.tt.clientHeight-64,Y-48))+'px';*/
			}
			else
			{
				if (Game.onCrate)
				{
					var rect=Game.onCrate.getBoundingClientRect();
					rect={left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom};
					if (rect.left==0 && rect.top==0)//if we get that bug where we get stuck in the top-left, move to the mouse (REVISION : just do nothing)
					{return false;/*rect.left=Game.mouseX-24;rect.right=Game.mouseX+24;rect.top=Game.mouseY-24;rect.bottom=Game.mouseY+24;*/}
					if (this.origin=='left')
					{
						X=rect.left-width-16;
						Y=rect.top+(rect.bottom-rect.top)/2-height/2-38;
						Y=Math.max(0,Math.min(Game.windowH-height-19,Y));
						if (X<0) X=rect.right;
					}
					else
					{
						X=rect.left+(rect.right-rect.left)/2-width/2-8;
						Y=rect.top-height-48;
						X=Math.max(0,Math.min(Game.windowW-width-16,X));
						if (Y<0) Y=rect.bottom-32;
					}
				}
				else if (this.origin=='bottom-right')
				{
					X=Game.mouseX+8;
					Y=Game.mouseY-32;
					X=Math.max(0,Math.min(Game.windowW-width-16,X));
					Y=Math.max(0,Math.min(Game.windowH-height-64,Y));
				}
				else if (this.origin=='bottom')
				{
					X=Game.mouseX-width/2-8;
					Y=Game.mouseY+24;
					X=Math.max(0,Math.min(Game.windowW-width-16,X));
					Y=Math.max(0,Math.min(Game.windowH-height-64,Y));
				}
				else if (this.origin=='left')
				{
					X=Game.mouseX-width-24;
					Y=Game.mouseY-height/2-8;
					X=Math.max(0,Math.min(Game.windowW-width-16,X));
					Y=Math.max(0,Math.min(Game.windowH-height-64,Y));
				}
				else if (this.origin=='this' && this.from)
				{
					var rect=this.from.getBoundingClientRect();
					X=(rect.left+rect.right)/2-width/2-8;
					Y=(rect.top)-this.tt.clientHeight-48;
					X=Math.max(0,Math.min(Game.windowW-width-16,X));
					//Y=Math.max(0,Math.min(Game.windowH-this.tt.clientHeight-64,Y));
					if (Y<0) Y=(rect.bottom-24);
					if (Y+height+40>Game.windowH)
					{
						X=rect.right+8;
						Y=rect.top+(rect.bottom-rect.top)/2-height/2-38;
						Y=Math.max(0,Math.min(Game.windowH-height-19,Y));
					}
				}
				else
				{
					X=Game.mouseX-width/2-8;
					Y=Game.mouseY-height-32;
					X=Math.max(0,Math.min(Game.windowW-width-16,X));
					Y=Math.max(0,Math.min(Game.windowH-height-64,Y));
				}
			}
			this.tta.style.left=X+'px';
			this.tta.style.right='auto';
			this.tta.style.top=Y+'px';
			this.tta.style.bottom='auto';
			if (this.shouldHide) {this.hide();this.shouldHide=0;}
			else if (Game.drawT%10==0 && typeof(this.text)==='function')
			{
				var text=this.text();
				if (text=='') this.tta.style.opacity='0';
				else
				{
					this.tt.innerHTML=unescape(text);
					this.tta.style.opacity='1';
				}
			}
		}
		Game.tooltip.hide=function()
		{
			this.tta.style.display='none';
			this.dynamic=0;
			this.on=0;
		}
		Game.getTooltip=function(text,origin,isCrate)
		{
			origin=(origin?origin:'middle');
			if (isCrate) return 'onMouseOut="Game.setOnCrate(0);Game.tooltip.shouldHide=1;" onMouseOver="if (!Game.mouseDown) {Game.setOnCrate(this);Game.tooltip.dynamic=0;Game.tooltip.draw(this,\''+escape(text)+'\',\''+origin+'\');Game.tooltip.wobble();}"';
			else return 'onMouseOut="Game.tooltip.shouldHide=1;" onMouseOver="Game.tooltip.dynamic=0;Game.tooltip.draw(this,\''+escape(text)+'\',\''+origin+'\');Game.tooltip.wobble();"';
		}
		Game.getDynamicTooltip=function(func,origin,isCrate)
		{
			origin=(origin?origin:'middle');
			if (isCrate) return 'onMouseOut="Game.setOnCrate(0);Game.tooltip.shouldHide=1;" onMouseOver="if (!Game.mouseDown) {Game.setOnCrate(this);Game.tooltip.dynamic=1;Game.tooltip.draw(this,'+'function(){return '+func+'();}'+',\''+origin+'\');Game.tooltip.wobble();}"';
			return 'onMouseOut="Game.tooltip.shouldHide=1;" onMouseOver="Game.tooltip.dynamic=1;Game.tooltip.draw(this,'+'function(){return '+func+'();}'+',\''+origin+'\');Game.tooltip.wobble();"';
		}
		Game.attachTooltip=function(el,func,origin)
		{
			if (typeof func==='string')
			{
				var str=func;
				func=function(str){return function(){return str;};}(str);
			}
			origin=(origin?origin:'middle');
			AddEvent(el,'mouseover',function(func,el,origin){return function(){Game.tooltip.dynamic=1;Game.tooltip.draw(el,func,origin);};}(func,el,origin));
			AddEvent(el,'mouseout',function(){return function(){Game.tooltip.shouldHide=1;};}());
		}
		Game.tooltip.wobble=function()
		{
			//disabled because this effect doesn't look good with the slight slowdown it might or might not be causing.
			if (false)
			{
				this.tt.className='framed';
				void this.tt.offsetWidth;
				this.tt.className='framed wobbling';
			}
		}
		
		
		/*=====================================================================================
		UPDATE CHECKER
		=======================================================================================*/
		Game.CheckUpdates=function()
		{
			ajax('http://natto0wtr.php.xdomain.jp/server.php?q=checkupdate',Game.CheckUpdatesResponse);
		}
		Game.CheckUpdatesResponse=function(response)
		{
			var r=response.split('|');
			var str='';
			if (r[0]=='alert')
			{
				if (r[1]) str=r[1];
			}
			else if (parseFloat(r[0])>Game.version)
			{
				str='<b>新バージョンが出ています : v. '+r[0]+'!</b>';
				if (r[1]) str+='<br><small>更新情報 : "'+r[1]+'"</small>';
				str+='<br><b>ぜひ更新して最新版を!</b>';
			}
			if (str!='')
			{
				l('alert').innerHTML=str;
				l('alert').style.display='block';
			}
		}
		
		/*=====================================================================================
		DATA GRABBER
		=======================================================================================*/
		
		Game.externalDataLoaded=false;
		
		Game.grandmaNames=['グラニー','ガッシャー','エセル','エドナ','ドリス','モード','ヒルダ','グラディス','ミッシェル','ミシェル','フィリス','ミリセント','ミュリエル','マートル','ミルドレッド','メイビス','ヘレン','グロリア','シェイラ','ベッティ','ガートルード','アガサ','ベリル','アグネス','パール','プレシャス','ルビー','ベラ','ボニー','エイダ','バニー','クッキー','ダーリン','ガガ','ギャムギャム','ミモー','ミムシー','ピーナッツ','ナナ','ナン','トッツィー','ウォルティー','スティンキー','ヘイナス'];
		Game.customGrandmaNames=[];
		Game.heralds=0;
		
		Game.GrabData=function()
		{
			ajax('/patreon/grab.php',Game.GrabDataResponse);
		}
		Game.GrabDataResponse=function(response)
		{
			/*
				response should be formatted as
				{"herald":3,"grandma":"a|b|c|...}
			*/
			var r={};
			try{
				r=JSON.parse(response);
				if (typeof r['herald']!=='undefined')
				{
					Game.heralds=parseInt(r['herald']);
					Game.heralds=Math.max(0,Math.min(100,Game.heralds));
				}
				if (typeof r['グランマ']!=='undefined' && r['グランマ']!='')
				{
					Game.customGrandmaNames=r['グランマ'].split('|');
					Game.customGrandmaNames=Game.customGrandmaNames.filter(function(el){return el!='';});
				}
				
				l('heraldsAmount').textContent=Game.heralds;
				Game.externalDataLoaded=true;
			}catch(e){}
		}
		
		
		
		Game.attachTooltip(l('httpsSwitch'),'<div style="padding:8px;width:350px;text-align:center;font-size:11px;">現在CookieClickerを<b>'+(Game.https?'HTTPS':'HTTP')+'</b>プロトコルで遊んでいます。<br><b>'+(Game.https?'HTTP':'HTTPS')+'</b>バージョンはこれとは別のセーブスロットを使用しています。<br>ページを更新して<b>'+(Game.https?'HTTP':'HTTPS')+'</b>バージョンに切り替えるにはこの錠前をクリックしよう!</div>','this');
		AddEvent(l('httpsSwitch'),'click',function(){
			PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
			if (location.protocol=='https:') location.href='http:'+window.location.href.substring(window.location.protocol.length);
			else if (location.protocol=='http:') location.href='https:'+window.location.href.substring(window.location.protocol.length);
		});
		
		Game.attachTooltip(l('topbarOrteil'),'<div style="padding:8px;width:250px;text-align:center;">Orteilのサブドメインに戻るよ!<br>他のゲームがたくさんあるよ!</div>','this');
		Game.attachTooltip(l('topbarDashnet'),'<div style="padding:8px;width:250px;text-align:center;">私たちのホームページに戻るよ!</div>','this');
		Game.attachTooltip(l('topbarTwitter'),'<div style="padding:8px;width:250px;text-align:center;">ゲームの更新をたまに告知する、Orteilのtwitterだよ。</div>','this');
		Game.attachTooltip(l('topbarTumblr'),'<div style="padding:8px;width:250px;text-align:center;">ゲームの更新をたまに告知する、Orteilのtumblrだよ。</div>','this');
		Game.attachTooltip(l('topbarDiscord'),'<div style="padding:8px;width:250px;text-align:center;">私たちの公式Discordサーバーだよ。<br>CookieClickerや他のゲームの質問や小技を共有できるよ!</div>','this');
		Game.attachTooltip(l('topbarPatreon'),'<div style="padding:8px;width:250px;text-align:center;">Patreonを支援してCookieClickerの更新を援助してね!<br>パトロンには素敵なご褒美も!</div>','this');
		Game.attachTooltip(l('topbarMerch'),'<div style="padding:8px;width:250px;text-align:center;">CookieClickerシャツ、フード、ステッカーが!</div>','this');
		Game.attachTooltip(l('topbarMobileCC'),'<div style="padding:8px;width:250px;text-align:center;">スマホでCookieClickerを遊ぼう!<br>(Androidだけです。iOSバージョンは後ほど)</div>','this');
		Game.attachTooltip(l('topbarRandomgen'),'<div style="padding:8px;width:250px;text-align:center;">ランダム生成機で何か書けるように作ったよ。</div>','this');
		Game.attachTooltip(l('topbarIGM'),'<div style="padding:8px;width:250px;text-align:center;">シンプルなスクリプト言語でオリジナル放置ゲームを作れるように作ったよ。</div>','this');
		
		Game.attachTooltip(l('heralds'),function(){
			var str='';
			
			if (!Game.externalDataLoaded) str+='紋章官を呼べませんでした。サーバーに問題があるか、ローカル上でプレイしています。(日本語版は現状 紋章官 に未対応です。)';
			else
			{
				if (Game.heralds==0) str+='現在紋章官はおりません。<b style="color:#bc3aff;">Patreonとして寄付</b>をご検討ください!';
				else
				{
					str+=(Game.heralds==1?'<b style="color:#bc3aff;text-shadow:0px 1px 0px #6d0096;">1名の紋章官</b>':'<b style="color:#fff;text-shadow:0px 1px 0px #6d0096,0px 0px 6px #bc3aff;">'+Game.heralds+'名の紋章官</b>')+'による尊き献身が皆の生産を活性化し、その結果<br><b style="color:#cdaa89;text-shadow:0px 1px 0px #7c4532,0px 0px 6px #7c4532;"><div style="width:16px;height:16px;display:inline-block;vertical-align:middle;background:url(img/money.png);"></div>CpSが +'+Game.heralds+'%</b> しました。';
					str+='<div class="line"></div>';
					if (Game.ascensionMode==1) str+='現在 <b>生まれ変わり</b> モードになっており、紋章官からの恩恵は受けられません。';
					else if (Game.Has('紋章官')) str+='あなたは<b>紋章官</b>のアップグレードを所持しているので、生産増強の恩恵が受けられます。';
					else str+='紋章官の恩恵を得るには、未だあなたが取得していない特別なアップグレードが必要です。プレイを続けていれば後で恒久的に解除されるでしょう。';
				}
			}
			str+='<div class="line"></div><span style="font-size:90%;opacity:0.6;"><b>紋章官</b>とはパトレオン最高額帯の支援者であり、定員は 100 名です。<br>各紋章官は全ての者にCpS +1% の恩恵を与えます。<br>あなたが支援しているかどうかにかかわらず、紋章官はプレイ中の人々全員に貢献します。</span>';
			
			str+='<div style="width:31px;height:39px;background:url(img/heraldFlag.png);position:absolute;top:0px;left:8px;"></div><div style="width:31px;height:39px;background:url(img/heraldFlag.png);position:absolute;top:0px;right:8px;"></div>';
			
			return '<div style="padding:8px;width:300px;text-align:center;" class="prompt"><h3>紋章官</h3><div class="block">'+str+'</div></div>';
		},'this');
		l('heraldsAmount').textContent='?';
		l('heralds').style.display='inline-block';
		
		Game.GrabData();
		
		
		Game.useLocalStorage=1;
		Game.localStorageGet=function(key)
		{
			var local=0;
			try {local=window.localStorage.getItem(key);} catch (exception) {}
			return local;
		}
		Game.localStorageSet=function(key,str)
		{
			var local=0;
			try {local=window.localStorage.setItem(key,str);} catch (exception) {}
			return local;
		}
		//window.localStorage.clear();//won't switch back to cookie-based if there is localStorage info
		
		/*=====================================================================================
		SAVE
		=======================================================================================*/
		Game.ExportSave=function()
		{
			Game.prefs.showBackupWarning=0;
			Game.Prompt('<h3 >セーブ書き出し</h3><div class="block">あなたのセーブデータのコードです。<br>コピーして安全な場所に保存しておいてね!</div><div class="block"><textarea id="textareaPrompt" style="width:100%;height:128px;" readonly>'+Game.WriteSave(1)+'</textarea></div>',['完璧!']);//prompt('Copy this text and keep it somewhere safe!',Game.WriteSave(1));
			l('textareaPrompt').focus();l('textareaPrompt').select();
		}
		Game.ImportSave=function()
		{
			Game.Prompt('<h3>セーブ取り込み</h3><div class="block">セーブ書き出しで出力されたコードをここに貼り付けてください。</div><div class="block"><textarea id="textareaPrompt" style="width:100%;height:128px;"></textarea></div>',[['ロード','if (l(\'textareaPrompt\').value.length>0) {Game.ImportSaveCode(l(\'textareaPrompt\').value);Game.ClosePrompt();}'],'やっぱいいや']);//prompt('Please paste in the text that was given to you on save export.','');
			l('textareaPrompt').focus();
		}
		Game.ImportSaveCode=function(save)
		{
			if (save && save!='') Game.LoadSave(save);
		}
		
		Game.FileSave=function()
		{
			Game.prefs.showBackupWarning=0;
			var filename=Game.bakeryName.replace(/\s+/g,'')+'ベーカリー';
			var text=Game.WriteSave(1);
			var blob=new Blob([text],{type:'text/plain;charset=utf-8'});
			saveAs(blob,filename+'.txt');
		}
		Game.FileLoad=function(e)
		{
			if (e.target.files.length==0) return false;
			var file=e.target.files[0];
			var reader=new FileReader();
			reader.onload=function(e)
			{
				Game.ImportSaveCode(e.target.result);
			}
			reader.readAsText(file);
		}
		
		Game.toSave=false;
		Game.WriteSave=function(type)
		{
			Game.toSave=false;
			//type : none is default, 1=return string only, 2=return uncompressed string, 3=return uncompressed, commented string
			Game.lastDate=parseInt(Game.time);
			var str='';
			if (type==3) str+='\nGame version\n';
			str+=Game.version+'|';
			str+='|';//just in case we need some more stuff here
			if (type==3) str+='\n\nRun details';
			str+=//save stats
			(type==3?'\n	run start date : ':'')+parseInt(Game.startDate)+';'+
			(type==3?'\n	legacy start date : ':'')+parseInt(Game.fullDate)+';'+
			(type==3?'\n	date when we last opened the game : ':'')+parseInt(Game.lastDate)+';'+
			(type==3?'\n	bakery name : ':'')+(Game.bakeryName)+';'+
			(type==3?'\n	seed : ':'')+(Game.seed)+
			'|';
			if (type==3) str+='\n\nPacked preferences bitfield\n	';
			var str2=//prefs
			(Game.prefs.particles?'1':'0')+
			(Game.prefs.numbers?'1':'0')+
			(Game.prefs.autosave?'1':'0')+
			(Game.prefs.autoupdate?'1':'0')+
			(Game.prefs.milk?'1':'0')+
			(Game.prefs.fancy?'1':'0')+
			(Game.prefs.warn?'1':'0')+
			(Game.prefs.cursors?'1':'0')+
			(Game.prefs.focus?'1':'0')+
			(Game.prefs.format?'1':'0')+
			(Game.prefs.notifs?'1':'0')+
			(Game.prefs.wobbly?'1':'0')+
			(Game.prefs.monospace?'1':'0')+
			(Game.prefs.filters?'1':'0')+
			(Game.prefs.cookiesound?'1':'0')+
			(Game.prefs.crates?'1':'0')+
			(Game.prefs.showBackupWarning?'1':'0')+
			(Game.prefs.extraButtons?'1':'0')+
			(Game.prefs.askLumps?'1':'0')+
			(Game.prefs.customGrandmas?'1':'0')+
			(Game.prefs.timeout?'1':'0')+
			'';
			str2=pack3(str2);
			str+=str2+'|';
			if (type==3) str+='\n\nMisc game data';
			str+=
			(type==3?'\n	cookies : ':'')+parseFloat(Game.cookies).toString()+';'+
			(type==3?'\n	total cookies earned : ':'')+parseFloat(Game.cookiesEarned).toString()+';'+
			(type==3?'\n	cookie clicks : ':'')+parseInt(Math.floor(Game.cookieClicks))+';'+
			(type==3?'\n	golden cookie clicks : ':'')+parseInt(Math.floor(Game.goldenClicks))+';'+
			(type==3?'\n	cookies made by clicking : ':'')+parseFloat(Game.handmadeCookies).toString()+';'+
			(type==3?'\n	golden cookies missed : ':'')+parseInt(Math.floor(Game.missedGoldenClicks))+';'+
			(type==3?'\n	background type : ':'')+parseInt(Math.floor(Game.bgType))+';'+
			(type==3?'\n	milk type : ':'')+parseInt(Math.floor(Game.milkType))+';'+
			(type==3?'\n	cookies from past runs : ':'')+parseFloat(Game.cookiesReset).toString()+';'+
			(type==3?'\n	elder wrath : ':'')+parseInt(Math.floor(Game.elderWrath))+';'+
			(type==3?'\n	pledges : ':'')+parseInt(Math.floor(Game.pledges))+';'+
			(type==3?'\n	pledge time left : ':'')+parseInt(Math.floor(Game.pledgeT))+';'+
			(type==3?'\n	currently researching : ':'')+parseInt(Math.floor(Game.nextResearch))+';'+
			(type==3?'\n	research time left : ':'')+parseInt(Math.floor(Game.researchT))+';'+
			(type==3?'\n	ascensions : ':'')+parseInt(Math.floor(Game.resets))+';'+
			(type==3?'\n	golden cookie clicks (this run) : ':'')+parseInt(Math.floor(Game.goldenClicksLocal))+';'+
			(type==3?'\n	cookies sucked by wrinklers : ':'')+parseFloat(Game.cookiesSucked).toString()+';'+
			(type==3?'\n	wrinkles popped : ':'')+parseInt(Math.floor(Game.wrinklersPopped))+';'+
			(type==3?'\n	santa level : ':'')+parseInt(Math.floor(Game.santaLevel))+';'+
			(type==3?'\n	reindeer clicked : ':'')+parseInt(Math.floor(Game.reindeerClicked))+';'+
			(type==3?'\n	season time left : ':'')+parseInt(Math.floor(Game.seasonT))+';'+
			(type==3?'\n	season switcher uses : ':'')+parseInt(Math.floor(Game.seasonUses))+';'+
			(type==3?'\n	current season : ':'')+(Game.season?Game.season:'')+';';
			var wrinklers=Game.SaveWrinklers();
			str+=
			(type==3?'\n	amount of cookies contained in wrinklers : ':'')+parseFloat(Math.floor(wrinklers.amount))+';'+
			(type==3?'\n	number of wrinklers : ':'')+parseInt(Math.floor(wrinklers.number))+';'+
			(type==3?'\n	prestige level : ':'')+parseFloat(Game.prestige).toString()+';'+
			(type==3?'\n	heavenly chips : ':'')+parseFloat(Game.heavenlyChips).toString()+';'+
			(type==3?'\n	heavenly chips spent : ':'')+parseFloat(Game.heavenlyChipsSpent).toString()+';'+
			(type==3?'\n	heavenly cookies : ':'')+parseFloat(Game.heavenlyCookies).toString()+';'+
			(type==3?'\n	ascension mode : ':'')+parseInt(Math.floor(Game.ascensionMode))+';'+
			(type==3?'\n	permanent upgrades : ':'')+parseInt(Math.floor(Game.permanentUpgrades[0]))+';'+parseInt(Math.floor(Game.permanentUpgrades[1]))+';'+parseInt(Math.floor(Game.permanentUpgrades[2]))+';'+parseInt(Math.floor(Game.permanentUpgrades[3]))+';'+parseInt(Math.floor(Game.permanentUpgrades[4]))+';'+
			(type==3?'\n	dragon level : ':'')+parseInt(Math.floor(Game.dragonLevel))+';'+
			(type==3?'\n	dragon aura : ':'')+parseInt(Math.floor(Game.dragonAura))+';'+
			(type==3?'\n	dragon aura 2 : ':'')+parseInt(Math.floor(Game.dragonAura2))+';'+
			(type==3?'\n	chime type : ':'')+parseInt(Math.floor(Game.chimeType))+';'+
			(type==3?'\n	volume : ':'')+parseInt(Math.floor(Game.volume))+';'+
			(type==3?'\n	number of shiny wrinklers : ':'')+parseInt(Math.floor(wrinklers.shinies))+';'+
			(type==3?'\n	amount of cookies contained in shiny wrinklers : ':'')+parseFloat(Math.floor(wrinklers.amountShinies))+';'+
			(type==3?'\n	current amount of sugar lumps : ':'')+parseFloat(Math.floor(Game.lumps))+';'+
			(type==3?'\n	total amount of sugar lumps made : ':'')+parseFloat(Math.floor(Game.lumpsTotal))+';'+
			(type==3?'\n	time when current sugar lump started : ':'')+parseFloat(Math.floor(Game.lumpT))+';'+
			(type==3?'\n	time when last refilled a minigame with a sugar lump : ':'')+parseFloat(Math.floor(Game.lumpRefill))+';'+
			(type==3?'\n	sugar lump type : ':'')+parseInt(Math.floor(Game.lumpCurrentType))+';'+
			(type==3?'\n	vault : ':'')+Game.vault.join(',')+';'+
			(type==3?'\n	heralds : ':'')+parseInt(Game.heralds)+';'+
			(type==3?'\n	golden cookie fortune : ':'')+parseInt(Game.fortuneGC)+';'+
			(type==3?'\n	CpS fortune : ':'')+parseInt(Game.fortuneCPS)+';'+
			(type==3?'\n	highest raw CpS : ':'')+parseFloat(Game.cookiesPsRawHighest)+';'+
			'|';//cookies and lots of other stuff
			
			if (type==3) str+='\n\nBuildings : amount, bought, cookies produced, level, minigame data';
			for (var i in Game.Objects)//buildings
			{
				var me=Game.Objects[i];
				if (type==3) str+='\n	'+me.name+' : ';
				if (me.vanilla)
				{
					str+=me.amount+','+me.bought+','+parseFloat(Math.floor(me.totalCookies))+','+parseInt(me.level);
					if (Game.isMinigameReady(me)) str+=','+me.minigame.save(); else str+=',';
					str+=','+(me.muted?'1':'0');
					str+=','+me.highest;
					str+=';';
				}
			}
			str+='|';
			if (type==3) str+='\n\nPacked upgrades bitfield (unlocked and bought)\n	';
			var toCompress=[];
			for (var i in Game.UpgradesById)//upgrades
			{
				var me=Game.UpgradesById[i];
				if (me.vanilla) toCompress.push(Math.min(me.unlocked,1),Math.min(me.bought,1));
			};
			
			toCompress=pack3(toCompress.join(''));//toCompress=pack(toCompress);//CompressLargeBin(toCompress);
			
			str+=toCompress;
			str+='|';
			if (type==3) str+='\n\nPacked achievements bitfield (won)\n	';
			var toCompress=[];
			for (var i in Game.AchievementsById)//achievements
			{
				var me=Game.AchievementsById[i];
				if (me.vanilla) toCompress.push(Math.min(me.won));
			}
			toCompress=pack3(toCompress.join(''));//toCompress=pack(toCompress);//CompressLargeBin(toCompress);
			str+=toCompress;
			
			str+='|';
			if (type==3) str+='\n\nBuffs : type, maxTime, time, arg1, arg2, arg3';
			for (var i in Game.buffs)
			{
				var me=Game.buffs[i];
				if (me.type)
				{
					if (type==3) str+='\n	'+me.type.name+' : ';
					if (me.type.vanilla)
					{
						str+=me.type.id+','+me.maxTime+','+me.time;
						if (typeof me.arg1!=='undefined') str+=','+parseFloat(me.arg1);
						if (typeof me.arg2!=='undefined') str+=','+parseFloat(me.arg2);
						if (typeof me.arg3!=='undefined') str+=','+parseFloat(me.arg3);
						str+=';';
					}
				}
			}
			
			
			if (type==3) str+='\n\nCustom :\n';
			
			str+='|';
			str+=Game.saveModData();
			
			if (type==2 || type==3)
			{
				return str;
			}
			else if (type==1)
			{
				str=escape(utf8_to_b64(str)+'!END!');
				return str;
			}
			else
			{
				if (Game.useLocalStorage)
				{
					//so we used to save the game using browser cookies, which was just really neat considering the game's name
					//we're using localstorage now, which is more efficient but not as cool
					//a moment of silence for our fallen puns
					str=utf8_to_b64(str)+'!END!';
					if (str.length<10)
					{
						if (Game.prefs.popups) Game.Popup('セーブ中にエラーが発生しました。<br>アップグレードを購入することで直るかもしれません。');
						else Game.Notify('セーブに失敗しました!','アップグレードを購入し、もう一度セーブすることで直るかもしれません。<br>この状態は本当は起こるべきではありません。Orteilのtumblrに知らせてください。');
					}
					else
					{
						str=escape(str);
						Game.localStorageSet(Game.SaveTo,str);//aaand save
						if (!Game.localStorageGet(Game.SaveTo))
						{
							if (Game.prefs.popups) Game.Popup('セーブ中にエラーが発生しました。<br>代わりにセーブデータを出力しました!');
							else Game.Notify('セーブ中にエラーが発生しました','代わりにセーブデータを出力しました!');
						}
						else if (document.hasFocus())
						{
							if (Game.prefs.popups) Game.Popup('セーブしました。');
							else Game.Notify('セーブしました。','','',1,1);
						}
					}
				}
				else//legacy system
				{
					//that's right
					//we're using cookies
					//yeah I went there
					var now=new Date();//we storin dis for 5 years, people
					now.setFullYear(now.getFullYear()+5);//mmh stale cookies
					str=utf8_to_b64(str)+'!END!';
					Game.saveData=escape(str);
					str=Game.SaveTo+'='+escape(str)+'; expires='+now.toUTCString()+';';
					document.cookie=str;//aaand save
					if (document.cookie.indexOf(Game.SaveTo)<0)
					{
						if (Game.prefs.popups) Game.Popup('セーブ中にエラーが発生しました。<br>代わりにセーブデータを出力しました!');
						else Game.Notify('セーブ中にエラーが発生しました','代わりにセーブデータを出力しました!','',0,1);
					}
					else if (document.hasFocus())
					{
						if (Game.prefs.popups) Game.Popup('セーブしました。');
						else Game.Notify('セーブしました。','','',1,1);
					}
				}
			}
		}
		
		/*=====================================================================================
		LOAD
		=======================================================================================*/
		Game.salvageSave=function()
		{
			//for when Cookie Clicker won't load and you need your save
			console.log('===================================================');
			console.log('This is your save data. Copypaste it (without quotation marks) into another version using the "Import save" feature.');
			console.log(Game.localStorageGet(Game.SaveTo));
		}
		Game.LoadSave=function(data)
		{
			Game.prefs.formatlang=Game.localStorageGet("formatlang");
			Game.prefs.formatlang = (Game.prefs.formatlang ? parseInt(Game.prefs.formatlang,10) : 1);
			
			var str='';
			if (data) str=unescape(data);
			else
			{
				if (Game.useLocalStorage)
				{
					var local=Game.localStorageGet(Game.SaveTo);
					if (!local)//no localstorage save found? let's get the cookie one last time
					{
						if (document.cookie.indexOf(Game.SaveTo)>=0)
						{
							str=unescape(document.cookie.split(Game.SaveTo+'=')[1]);
							document.cookie=Game.SaveTo+'=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
						}
						else return false;
					}
					else
					{
						str=unescape(local);
					}
				}
				else//legacy system
				{
					if (document.cookie.indexOf(Game.SaveTo)>=0) str=unescape(document.cookie.split(Game.SaveTo+'=')[1]);//get cookie here
					else return false;
				}
			}
			if (str!='')
			{
				var version=0;
				var oldstr=str.split('|');
				if (oldstr[0]<1) {}
				else
				{
					str=str.split('!END!')[0];
					str=b64_to_utf8(str);
				}
				if (str!='')
				{
					var spl='';
					str=str.split('|');
					version=parseFloat(str[0]);
					
					if (isNaN(version) || str.length<5)
					{
						if (Game.prefs.popups) Game.Popup('あぁ、読み込んだ文字列が間違っているようです!');
						else Game.Notify('読み込み中にエラーが発生しました','あぁ、読み込んだ文字列が間違っているようです!','',6,1);
						return false;
					}
					if (version>=1 && version>Game.version)
					{
						if (Game.prefs.popups) Game.Popup('エラー : 未来のバージョンのセーブデータを読み込もうとしています (v. '+version+'、使用中のバージョンはv. '+Game.version+')。');
						else Game.Notify('読み込み中にエラーが発生しました','未来のバージョンのセーブデータを読み込もうとしています (v. '+version+'、使用中のバージョンはv. '+Game.version+')。','',6,1);
						return false;
					}
					if (version==1.0501)//prompt if we loaded from the 2014 beta
					{
						setTimeout(function(){Game.Prompt('<h3>新しいベータ</h3><div class="block">そこの君! 不幸にも、前のベータのデータはもうここでは使えないよ。新しく始めるか、現行バージョンからのセーブデータを取り込んでね。<div class="line"></div>CookieClickerのベータテストをしてくれてありがとう、ゲームを楽しんで、未発見の面白いバグを見つけてくれることを祈ってるよ!</div>',[['じゃあね!','Game.ClosePrompt();']]);},200);
						return false;
					}
					else if (version<1.0501)//prompt if we loaded from the 2014 live version
					{
						setTimeout(function(){Game.Prompt('<h3>アップデート</h3><div class="block"><b>そこの君!</b> CookieClickerにかなり実のあるアップデートが適用されて、いろんなものがあちこちに移動したのに気づいたかもしれないね。パニックにならないで!<div class="line"></div>買ったことがない施設とかで施設の数がおかしく見えるかもしれない。これは工場の後に新しく3種類の施設を追加したからで(それと鉱山と工場も入れ替えたよ)、その後の施設を全部ずらしたんだ。同様に、施設が関係するアップグレードや実績も若干シャッフルされたように見えるかもね。これは何一つおかしくない普通のことだよ!<div class="line"></div>また、ヘブンリーチップスの量や挙動を調整したよ。前の枚数よりヘブンリーチップスの枚数が増えたり減ったりしてるかもしれないね。<br>今は画面上側の<b>遺産ボタン</b>を通じて昇天できるよ!<div class="line"></div>CookieClickerをプレイしてくれてありがとう。仕事に手を付けずに今回のアップデートに集中したんだ、楽しんでくれると嬉しいな!</div>',[['すごいね!','Game.ClosePrompt();']]);},200);
					}
					if (version>=1)
					{
						Game.T=0;
						
						spl=str[2].split(';');//save stats
						Game.startDate=parseInt(spl[0]);
						Game.fullDate=parseInt(spl[1]);
						Game.lastDate=parseInt(spl[2]);
						Game.bakeryNameSet(spl[3]?spl[3]:Game.GetBakeryName());
						Game.seed=spl[4]?spl[4]:Game.makeSeed();
						//prefs
						if (version<1.0503) spl=str[3].split('');
						else if (version<2.0046) spl=unpack2(str[3]).split('');
						else spl=(str[3]).split('');
						Game.prefs.particles=parseInt(spl[0]);
						Game.prefs.numbers=parseInt(spl[1]);
						Game.prefs.autosave=parseInt(spl[2]);
						Game.prefs.autoupdate=spl[3]?parseInt(spl[3]):1;
						Game.prefs.milk=spl[4]?parseInt(spl[4]):1;
						Game.prefs.fancy=parseInt(spl[5]);if (Game.prefs.fancy) Game.removeClass('noFancy'); else if (!Game.prefs.fancy) Game.addClass('noFancy');
						Game.prefs.warn=spl[6]?parseInt(spl[6]):0;
						Game.prefs.cursors=spl[7]?parseInt(spl[7]):0;
						Game.prefs.focus=spl[8]?parseInt(spl[8]):0;
						Game.prefs.format=spl[9]?parseInt(spl[9]):0;
						Game.prefs.notifs=spl[10]?parseInt(spl[10]):0;
						Game.prefs.wobbly=spl[11]?parseInt(spl[11]):0;
						Game.prefs.monospace=spl[12]?parseInt(spl[12]):0;
						Game.prefs.filters=parseInt(spl[13]);if (Game.prefs.filters) Game.removeClass('noFilters'); else if (!Game.prefs.filters) Game.addClass('noFilters');
						Game.prefs.cookiesound=spl[14]?parseInt(spl[14]):1;
						Game.prefs.crates=spl[15]?parseInt(spl[15]):0;
						Game.prefs.showBackupWarning=spl[16]?parseInt(spl[16]):1;
						Game.prefs.extraButtons=spl[17]?parseInt(spl[17]):1;if (!Game.prefs.extraButtons) Game.removeClass('extraButtons'); else if (Game.prefs.extraButtons) Game.addClass('extraButtons');
						Game.prefs.askLumps=spl[18]?parseInt(spl[18]):0;
						Game.prefs.customGrandmas=spl[19]?parseInt(spl[19]):1;
						Game.prefs.timeout=spl[20]?parseInt(spl[20]):0;
						BeautifyAll();
						spl=str[4].split(';');//cookies and lots of other stuff
						Game.cookies=parseFloat(spl[0]);
						Game.cookiesEarned=parseFloat(spl[1]);
						Game.cookieClicks=spl[2]?parseInt(spl[2]):0;
						Game.goldenClicks=spl[3]?parseInt(spl[3]):0;
						Game.handmadeCookies=spl[4]?parseFloat(spl[4]):0;
						Game.missedGoldenClicks=spl[5]?parseInt(spl[5]):0;
						Game.bgType=spl[6]?parseInt(spl[6]):0;
						Game.milkType=spl[7]?parseInt(spl[7]):0;
						Game.cookiesReset=spl[8]?parseFloat(spl[8]):0;
						Game.elderWrath=spl[9]?parseInt(spl[9]):0;
						Game.pledges=spl[10]?parseInt(spl[10]):0;
						Game.pledgeT=spl[11]?parseInt(spl[11]):0;
						Game.nextResearch=spl[12]?parseInt(spl[12]):0;
						Game.researchT=spl[13]?parseInt(spl[13]):0;
						Game.resets=spl[14]?parseInt(spl[14]):0;
						Game.goldenClicksLocal=spl[15]?parseInt(spl[15]):0;
						Game.cookiesSucked=spl[16]?parseFloat(spl[16]):0;
						Game.wrinklersPopped=spl[17]?parseInt(spl[17]):0;
						Game.santaLevel=spl[18]?parseInt(spl[18]):0;
						Game.reindeerClicked=spl[19]?parseInt(spl[19]):0;
						Game.seasonT=spl[20]?parseInt(spl[20]):0;
						Game.seasonUses=spl[21]?parseInt(spl[21]):0;
						Game.season=spl[22]?spl[22]:Game.baseSeason;
						var wrinklers={amount:spl[23]?parseFloat(spl[23]):0,number:spl[24]?parseInt(spl[24]):0};
						Game.prestige=spl[25]?parseFloat(spl[25]):0;
						Game.heavenlyChips=spl[26]?parseFloat(spl[26]):0;
						Game.heavenlyChipsSpent=spl[27]?parseFloat(spl[27]):0;
						Game.heavenlyCookies=spl[28]?parseFloat(spl[28]):0;
						Game.ascensionMode=spl[29]?parseInt(spl[29]):0;
						Game.permanentUpgrades[0]=spl[30]?parseInt(spl[30]):-1;Game.permanentUpgrades[1]=spl[31]?parseInt(spl[31]):-1;Game.permanentUpgrades[2]=spl[32]?parseInt(spl[32]):-1;Game.permanentUpgrades[3]=spl[33]?parseInt(spl[33]):-1;Game.permanentUpgrades[4]=spl[34]?parseInt(spl[34]):-1;
						//if (version<1.05) {Game.heavenlyChipsEarned=Game.HowMuchPrestige(Game.cookiesReset);Game.heavenlyChips=Game.heavenlyChipsEarned;}
						Game.dragonLevel=spl[35]?parseInt(spl[35]):0;
						if (version<2.0041 && Game.dragonLevel==Game.dragonLevels.length-2) {Game.dragonLevel=Game.dragonLevels.length-1;}
						Game.dragonAura=spl[36]?parseInt(spl[36]):0;
						Game.dragonAura2=spl[37]?parseInt(spl[37]):0;
						Game.chimeType=spl[38]?parseInt(spl[38]):0;
						Game.volume=spl[39]?parseInt(spl[39]):50;
						wrinklers.shinies=spl[40]?parseInt(spl[40]):0;
						wrinklers.amountShinies=spl[41]?parseFloat(spl[41]):0;
						Game.lumps=spl[42]?parseFloat(spl[42]):-1;
						Game.lumpsTotal=spl[43]?parseFloat(spl[43]):-1;
						Game.lumpT=spl[44]?parseInt(spl[44]):Date.now();
						Game.lumpRefill=spl[45]?parseInt(spl[45]):0;
						if (version<2.022) Game.lumpRefill=Game.fps*60;
						Game.lumpCurrentType=spl[46]?parseInt(spl[46]):0;
						Game.vault=spl[47]?spl[47].split(','):[];
							for (var i in Game.vault){Game.vault[i]=parseInt(Game.vault[i]);}
						var actualHeralds=Game.heralds;//we store the actual amount of heralds to restore it later; here we used the amount present in the save to compute offline CpS
						Game.heralds=spl[48]?parseInt(spl[48]):Game.heralds;
						Game.fortuneGC=spl[49]?parseInt(spl[49]):0;
						Game.fortuneCPS=spl[50]?parseInt(spl[50]):0;
						Game.cookiesPsRawHighest=spl[51]?parseFloat(spl[51]):0;
						
						spl=str[5].split(';');//buildings
						Game.BuildingsOwned=0;
						for (var i in Game.ObjectsById)
						{
							var me=Game.ObjectsById[i];
							me.switchMinigame(false);
							me.pics=[];
							if (spl[i])
							{
								var mestr=spl[i].toString().split(',');
								me.amount=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);me.totalCookies=parseFloat(mestr[2]);me.level=parseInt(mestr[3]||0);me.highest=(version>=2.024?parseInt(mestr[6]):me.amount);
								if (me.minigame && me.minigameLoaded && me.minigame.reset) {me.minigame.reset(true);me.minigame.load(mestr[4]||'');} else me.minigameSave=(mestr[4]||0);
								me.muted=parseInt(mestr[5])||0;
								Game.BuildingsOwned+=me.amount;
								if (version<2.003) me.level=0;
							}
							else
							{
								me.amount=0;me.unlocked=0;me.bought=0;me.highest=0;me.totalCookies=0;me.level=0;
							}
						}
						
						Game.LoadMinigames();
						
						if (version<1.035)//old non-binary algorithm
						{
							spl=str[6].split(';');//upgrades
							Game.UpgradesOwned=0;
							for (var i in Game.UpgradesById)
							{
								var me=Game.UpgradesById[i];
								if (spl[i])
								{
									var mestr=spl[i].split(',');
									me.unlocked=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);
									if (me.bought && Game.CountsAsUpgradeOwned(me.pool)) Game.UpgradesOwned++;
								}
								else
								{
									me.unlocked=0;me.bought=0;
								}
							}
							if (str[7]) spl=str[7].split(';'); else spl=[];//achievements
							Game.AchievementsOwned=0;
							for (var i in Game.AchievementsById)
							{
								var me=Game.AchievementsById[i];
								if (spl[i])
								{
									var mestr=spl[i].split(',');
									me.won=parseInt(mestr[0]);
								}
								else
								{
									me.won=0;
								}
								if (me.won && Game.CountsAsAchievementOwned(me.pool)) Game.AchievementsOwned++;
							}
						}
						else if (version<1.0502)//old awful packing system
						{
							if (str[6]) spl=str[6]; else spl=[];//upgrades
							if (version<1.05) spl=UncompressLargeBin(spl);
							else spl=unpack(spl);
							Game.UpgradesOwned=0;
							for (var i in Game.UpgradesById)
							{
								var me=Game.UpgradesById[i];
								if (spl[i*2])
								{
									var mestr=[spl[i*2],spl[i*2+1]];
									me.unlocked=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);
									if (me.bought && Game.CountsAsUpgradeOwned(me.pool)) Game.UpgradesOwned++;
								}
								else
								{
									me.unlocked=0;me.bought=0;
								}
							}
							if (str[7]) spl=str[7]; else spl=[];//achievements
							if (version<1.05) spl=UncompressLargeBin(spl);
							else spl=unpack(spl);
							Game.AchievementsOwned=0;
							for (var i in Game.AchievementsById)
							{
								var me=Game.AchievementsById[i];
								if (spl[i])
								{
									var mestr=[spl[i]];
									me.won=parseInt(mestr[0]);
								}
								else
								{
									me.won=0;
								}
								if (me.won && Game.CountsAsAchievementOwned(me.pool)) Game.AchievementsOwned++;
							}
						}
						else
						{
							if (str[6]) spl=str[6]; else spl=[];//upgrades
							if (version<2.0046) spl=unpack2(spl).split('');
							else spl=(spl).split('');
							Game.UpgradesOwned=0;
							for (var i in Game.UpgradesById)
							{
								var me=Game.UpgradesById[i];
								if (spl[i*2])
								{
									var mestr=[spl[i*2],spl[i*2+1]];
									me.unlocked=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);
									if (me.bought && Game.CountsAsUpgradeOwned(me.pool)) Game.UpgradesOwned++;
								}
								else
								{
									me.unlocked=0;me.bought=0;
								}
							}
							if (str[7]) spl=str[7]; else spl=[];//achievements
							if (version<2.0046) spl=unpack2(spl).split('');
							else spl=(spl).split('');
							Game.AchievementsOwned=0;
							for (var i in Game.AchievementsById)
							{
								var me=Game.AchievementsById[i];
								if (spl[i])
								{
									var mestr=[spl[i]];
									me.won=parseInt(mestr[0]);
								}
								else
								{
									me.won=0;
								}
								if (me.won && Game.CountsAsAchievementOwned(me.pool)) Game.AchievementsOwned++;
							}
						}
						
						Game.killBuffs();
						var buffsToLoad=[];
						spl=(str[8]||'').split(';');//buffs
						for (var i in spl)
						{
							if (spl[i])
							{
								var mestr=spl[i].toString().split(',');
								buffsToLoad.push(mestr);
							}
						}
						
						
						spl=(str[9]||'').split(';');//mod data
						
						for (var i in spl)
						{
							if (spl[i])
							{
								var data=spl[i].split(':');
								var modId=data[0];
								data.shift();
								data=Game.safeLoadString(data.join(':'));
								Game.modSaveData[modId]=data;
							}
						}
						
						for (var i in Game.ObjectsById)
						{
							var me=Game.ObjectsById[i];
							if (me.buyFunction) me.buyFunction();
							me.refresh();
							if (me.id>0)
							{
								if (me.muted) me.mute(1);
							}
						}
						
						if (version<1.0503)//upgrades that used to be regular, but are now heavenly
						{
							var me=Game.Upgrades['消せない記憶'];me.unlocked=0;me.bought=0;
							var me=Game.Upgrades['季節切り替え装置'];me.unlocked=0;me.bought=0;
						}
						
						if (Game.bgType==-1) Game.bgType=0;
						if (Game.milkType==-1) Game.milkType=0;
						
						
						//advance timers
						var framesElapsed=Math.ceil(((Date.now()-Game.lastDate)/1000)*Game.fps);
						if (Game.pledgeT>0) Game.pledgeT=Math.max(Game.pledgeT-framesElapsed,1);
						if (Game.seasonT>0) Game.seasonT=Math.max(Game.seasonT-framesElapsed,1);
						if (Game.researchT>0) Game.researchT=Math.max(Game.researchT-framesElapsed,1);
						
						
						Game.ResetWrinklers();
						Game.LoadWrinklers(wrinklers.amount,wrinklers.number,wrinklers.shinies,wrinklers.amountShinies);
						
						//recompute season trigger prices
						if (Game.Has('季節切り替え装置')) {for (var i in Game.seasons) {Game.Unlock(Game.seasons[i].trigger);}}
						Game.computeSeasonPrices();
						
						//recompute prestige
						Game.prestige=Math.floor(Game.HowMuchPrestige(Game.cookiesReset));
						//if ((Game.heavenlyChips+Game.heavenlyChipsSpent)<Game.prestige)
						//{Game.heavenlyChips=Game.prestige;Game.heavenlyChipsSpent=0;}//chips owned and spent don't add up to total prestige? set chips owned to prestige
						
						
						Game.loadModData();
						
						
						if (version==1.037 && Game.beta)//are we opening the new beta? if so, save the old beta to /betadungeons
						{
							window.localStorage.setItem('CookieClickerGameBetaDungeons',window.localStorage.getItem('CookieClickerGameBeta'));
							Game.Notify('ベータのセーブデータ','ベータのセーブデータは無事、/betadungeonsに出力されました。',20);
						}
						else if (version==1.0501 && Game.beta)//are we opening the newer beta? if so, save the old beta to /oldbeta
						{
							window.localStorage.setItem('CookieClickerGameOld',window.localStorage.getItem('CookieClickerGameBeta'));
							//Game.Notify('ベータのセーブデータ','ベータのセーブデータは無事、/oldbetaに出力されました。',20);
						}
						if (version<=1.0466 && !Game.beta)//export the old 2014 version to /v10466
						{
							window.localStorage.setItem('CookieClickerGamev10466',window.localStorage.getItem('CookieClickerGame'));
							//Game.Notify('ベータのセーブデータ','あなたのセーブデータは無事、/v10466に出力されました。',20);
						}
						if (version==1.9)//are we importing from the 1.9 beta? remove all heavenly upgrades and refund heavenly chips
						{
							for (var i in Game.UpgradesById)
							{
								var me=Game.UpgradesById[i];
								if (me.bought && me.pool=='prestige')
								{
									me.unlocked=0;
									me.bought=0;
								}
							}
							Game.heavenlyChips=Game.prestige;
							Game.heavenlyChipsSpent=0;
							
							setTimeout(function(){Game.Prompt('<h3>ベータパッチ</h3><div class="block">我々はいくつか微調整、修正しました、更新履歴を確認してください!<div class="line"></div>特筆 : 名声系の調整による変化のため、天国系アップグレードを全て破棄して、ヘブンリーチップスを返金させていただきました。次に昇天したときに再配分することが可能です。<div class="line"></div>またCookieClickerのベータテストに参加してくれてありがとう!</div>',[['じゃあね!','Game.ClosePrompt();']]);},200);
						}
						if (version<=1.0466)//are we loading from the old live version? reset HCs
						{
							Game.heavenlyChips=Game.prestige;
							Game.heavenlyChipsSpent=0;
						}
						
						if (Game.ascensionMode!=1)
						{
							if (Game.Has('スターターキット')) Game.Objects['カーソル'].free=10;
							if (Game.Has('スターターキッチン')) Game.Objects['グランマ'].free=5;
						}
						
						Game.CalculateGains();
						
						var timeOffline=(Date.now()-Game.lastDate)/1000;
						
						if (Math.random()<1/10000) Game.TOYS=1;//teehee!
						
						//compute cookies earned while the game was closed
						if (Game.mobile || Game.Has('有給休暇') || Game.Has('超絶の双門'))
						{
							if (Game.Has('有給休暇'))
							{
								var maxTime=60*60*24*1000000000;
								var percent=100;
							}
							else
							{
								var maxTime=60*60;
								if (Game.Has('ベルフェゴール')) maxTime*=2;
								if (Game.Has('マモン')) maxTime*=2;
								if (Game.Has('アバドン')) maxTime*=2;
								if (Game.Has('サタン')) maxTime*=2;
								if (Game.Has('アスモデウス')) maxTime*=2;
								if (Game.Has('ベルゼブブ')) maxTime*=2;
								if (Game.Has('ルシファー')) maxTime*=2;
								
								var percent=5;
								if (Game.Has('天使')) percent+=10;
								if (Game.Has('大天使')) percent+=10;
								if (Game.Has('力天使')) percent+=10;
								if (Game.Has('主天使')) percent+=10;
								if (Game.Has('智天使')) percent+=10;
								if (Game.Has('熾天使')) percent+=10;
								if (Game.Has('神')) percent+=10;
								
								if (Game.Has('キメラ')) {maxTime+=60*60*24*2;percent+=5;}
								
								if (Game.Has('寝落ちシダ茶')) percent+=3;
								if (Game.Has('ホテイアマイのシロップ')) percent+=7;
								if (Game.Has('幸運 No.102')) percent+=1;
							}
							
							var timeOfflineOptimal=Math.min(timeOffline,maxTime);
							var timeOfflineReduced=Math.max(0,timeOffline-timeOfflineOptimal);
							var amount=(timeOfflineOptimal+timeOfflineReduced*0.1)*Game.cookiesPs*(percent/100);
							
							if (amount>0)
							{
								if (Game.prefs.popups) Game.Popup('あなたのいない間に'+Beautify(amount)+'クッキー'+(Math.floor(amount)==1?'':'')+'稼ぎました。');
								else Game.Notify('お帰りなさい!','あなたのいない間に<b>'+Beautify(amount)+'</b>クッキー'+(Math.floor(amount)==1?'':'')+'稼ぎました。<br>('+'CpSの'+Math.floor(percent)+'%で'+Game.sayTime(timeOfflineOptimal*Game.fps,-1)+(timeOfflineReduced?'、さらに'+(Math.floor(percent*10)/100)+'%で'+Game.sayTime(timeOfflineReduced*Game.fps,-1):'')+')',[Math.floor(Math.random()*16),11]);
								Game.Earn(amount);
							}
						}
						
						//we load buffs after everything as we do not want them to interfer with offline CpS
						for (var i in buffsToLoad)
						{
							var mestr=buffsToLoad[i];
							var type=Game.buffTypes[parseInt(mestr[0])];
							Game.gainBuff(type.name,parseFloat(mestr[1])/Game.fps,parseFloat(mestr[3]||0),parseFloat(mestr[4]||0),parseFloat(mestr[5]||0)).time=parseFloat(mestr[2]);
						}
						
						
						Game.loadLumps(timeOffline);
			
						Game.bakeryNameRefresh();
						
					}
					else//importing old version save
					{
						Game.Notify('読み込み中にエラーが発生しました','すみません、今後はもう以前のバージョンからのセーブデータを読み込むことはできません。','',6,1);
						return false;
					}
					
					
					Game.RebuildUpgrades();
					
					Game.TickerAge=0;
					Game.TickerEffect=0;
					
					Game.elderWrathD=0;
					Game.recalculateGains=1;
					Game.storeToRefresh=1;
					Game.upgradesToRebuild=1;
					
					Game.buyBulk=1;Game.buyMode=1;Game.storeBulkButton(-1);
			
					Game.specialTab='';
					Game.ToggleSpecialMenu(0);
					
					Game.killShimmers();
					
					if (Game.T>Game.fps*5 && Game.ReincarnateTimer==0)//fade out of black and pop the cookie
					{
						Game.ReincarnateTimer=1;
						Game.addClass('reincarnating');
						Game.BigCookieSize=0;
					}
					
					if (version<Game.version) l('logButton').classList.add('hasUpdate');
					
					if (Game.season!='' && Game.season==Game.baseSeason)
					{
						if (Game.season=='valentines') Game.Notify('バレンタインデー!','<b>バレンタインの季節</b>になりました!<br>宙に漂っていたり、クッキーに含まれる愛はいっそう甘くなります!',[20,3],60*3);
						else if (Game.season=='fools') Game.Notify('ビジネスデー!','<b>ビジネスの季節</b>になりました!<br>慌てないで!あらゆるものが数日間だけで企業チックにみえるだけだよ。',[17,6],60*3);
						else if (Game.season=='halloween') Game.Notify('ハロウィン!','<b>ハロウィンの季節</b>になりました!<br>あらゆるものがちょこっとだけ不気味になるよ!',[13,8],60*3);
						else if (Game.season=='christmas') Game.Notify('クリスマスの時期!','<b>クリスマスの季節</b>になりました!<br>この世の全てを祝して、靴下にはクッキーが入ってるかもしれないよ!',[12,10],60*3);
						else if (Game.season=='easter') Game.Notify('イースター!','<b>イースターの季節</b>になりました!<br>しっかり見て、何匹かのうさぎを捕まえよう!',[0,12],60*3);
					}
					
					Game.heralds=actualHeralds;
					
					if (Game.prefs.popups) Game.Popup('ロードしました。');
					else Game.Notify('ロードしました。','','',1,1);
					
					if (Game.prefs.showBackupWarning==1) Game.showBackupWarning();
				}
			}
			else return false;
			return true;
		}
		
		/*=====================================================================================
		RESET
		=======================================================================================*/
		Game.Reset=function(hard)
		{
			Game.T=0;
			
			var cookiesForfeited=Game.cookiesEarned;
			if (!hard)
			{
				if (cookiesForfeited>=1000000) Game.Win('犠牲');
				if (cookiesForfeited>=1000000000) Game.Win('忘却');
				if (cookiesForfeited>=1000000000000) Game.Win('最初から');
				if (cookiesForfeited>=1000000000000000) Game.Win('ニヒリズム');
				if (cookiesForfeited>=1000000000000000000) Game.Win('非物質化');
				if (cookiesForfeited>=1000000000000000000000) Game.Win('ゼロZERO零');
				if (cookiesForfeited>=1000000000000000000000000) Game.Win('超越');
				if (cookiesForfeited>=1000000000000000000000000000) Game.Win('抹消');
				if (cookiesForfeited>=1000000000000000000000000000000) Game.Win('虚無への供物');
				if (cookiesForfeited>=1000000000000000000000000000000000) Game.Win('粉々に、と言ったな?');
				if (cookiesForfeited>=1000000000000000000000000000000000000) Game.Win('お前は何も得られない');
				if (cookiesForfeited>=1000000000000000000000000000000000000000) Game.Win('底辺からの再出発');
				if (cookiesForfeited>=1000000000000000000000000000000000000000000) Game.Win('世界の終わり');
				if (cookiesForfeited>=1000000000000000000000000000000000000000000000) Game.Win('やあ、戻ってきたね');
				if (cookiesForfeited>=1000000000000000000000000000000000000000000000000) Game.Win('ラザロ');
				if (cookiesForfeited>=1000000000000000000000000000000000000000000000000000) Game.Win('初心者狩り');
				if (cookiesForfeited>=1000000000000000000000000000000000000000000000000000000) Game.Win('一度でうまく行かなければ');
				
				if (Math.round(Game.cookies)==1000000000000) Game.Win('クッキーがぴったり昇天する時');
			}
			
			Game.killBuffs();
			
			Game.seed=Game.makeSeed();
			
			Game.cookiesReset+=Game.cookiesEarned;
			Game.cookies=0;
			Game.cookiesEarned=0;
			Game.cookieClicks=0;
			Game.goldenClicksLocal=0;
			//Game.goldenClicks=0;
			//Game.missedGoldenClicks=0;
			Game.handmadeCookies=0;
			Game.cookiesPsRawHighest=0;
			if (hard)
			{
				Game.bgType=0;
				Game.milkType=0;
				Game.chimeType=0;
				
				Game.vault=[];
			}
			Game.pledges=0;
			Game.pledgeT=0;
			Game.elderWrath=0;
			Game.nextResearch=0;
			Game.researchT=0;
			Game.seasonT=0;
			Game.seasonUses=0;
			Game.season=Game.baseSeason;
			Game.computeSeasonPrices();
			
			Game.startDate=parseInt(Date.now());
			Game.lastDate=parseInt(Date.now());
			
			Game.cookiesSucked=0;
			Game.wrinklersPopped=0;
			Game.ResetWrinklers();
			
			Game.santaLevel=0;
			Game.reindeerClicked=0;
			
			Game.dragonLevel=0;
			Game.dragonAura=0;
			Game.dragonAura2=0;
			
			Game.fortuneGC=0;
			Game.fortuneCPS=0;
			
			Game.TickerClicks=0;
			
			if (Game.gainedPrestige>0) Game.resets++;
			if (!hard && Game.canLumps() && Game.ascensionMode!=1) Game.addClass('lumpsOn');
			else Game.removeClass('lumpsOn');
			Game.gainedPrestige=0;
			
			for (var i in Game.ObjectsById)
			{
				var me=Game.ObjectsById[i];
				me.amount=0;me.bought=0;me.highest=0;me.free=0;me.totalCookies=0;
				me.switchMinigame(false);
				if (hard) {me.muted=0;}
				me.pics=[];
				me.refresh();
			}
			for (var i in Game.UpgradesById)
			{
				var me=Game.UpgradesById[i];
				if (hard || me.pool!='prestige') me.bought=0;
				if (hard) me.unlocked=0;
				if (me.pool!='prestige' && !me.lasting)
				{
					if (Game.Has('忘れ形見') && Game.seasonDrops.indexOf(me.name)!=-1 && Math.random()<1/5){}
					else if (Game.ascensionMode==1 && Game.HasAchiev('おお運命の女神よ') && me.tier=='fortune'){}
					else if (Game.HasAchiev('おお運命の女神よ') && me.tier=='fortune' && Math.random()<0.4){}
					else me.unlocked=0;
				}
			}
			
			Game.BuildingsOwned=0;
			Game.UpgradesOwned=0;
			
			Game.cookiesPsByType={};
			Game.cookiesMultByType={};
			
			if (!hard)
			{
				if (Game.ascensionMode!=1)
				{
					for (var i in Game.permanentUpgrades)
					{
						if (Game.permanentUpgrades[i]!=-1)
						{Game.UpgradesById[Game.permanentUpgrades[i]].earn();}
					}
					if (Game.Has('季節切り替え装置')) {for (var i in Game.seasons) {Game.Unlock(Game.seasons[i].trigger);}}
					
					if (Game.Has('スターターキット')) Game.Objects['カーソル'].getFree(10);
					if (Game.Has('スターターキッチン')) Game.Objects['グランマ'].getFree(5);
				}
			}
			
			/*for (var i in Game.AchievementsById)
			{
				var me=Game.AchievementsById[i];
				me.won=0;
			}*/
			//Game.DefaultPrefs();
			BeautifyAll();
			
			Game.RebuildUpgrades();
			Game.TickerAge=0;
			Game.TickerEffect=0;
			Game.recalculateGains=1;
			Game.storeToRefresh=1;
			Game.upgradesToRebuild=1;
			Game.killShimmers();
			
			Game.buyBulk=1;Game.buyMode=1;Game.storeBulkButton(-1);
			
			Game.LoadMinigames();
			for (var i in Game.ObjectsById)
			{
				var me=Game.ObjectsById[i];
				if (hard && me.minigame && me.minigame.launch) {me.minigame.launch();me.minigame.reset(true);}
				else if (!hard && me.minigame && me.minigame.reset) me.minigame.reset();
			}
			
			l('toggleBox').style.display='none';
			l('toggleBox').innerHTML='';
			Game.choiceSelectorOn=-1;
			Game.ToggleSpecialMenu(0);
			Game.specialTab='';
			
			l('logButton').classList.remove('hasUpdate');
			
			Game.runModHook('reset',hard);
			
			if (hard)
			{
				if (Game.T>Game.fps*5 && Game.ReincarnateTimer==0)//fade out of black and pop the cookie
				{
					Game.ReincarnateTimer=1;
					Game.addClass('reincarnating');
					Game.BigCookieSize=0;
				}
				if (Game.prefs.popups) Game.Popup('ゲームリセット');
				else Game.Notify('ゲームリセット','クッキーたち、またね。',[21,6],6);
			}
		}
		Game.HardReset=function(bypass)
		{
			if (!bypass)
			{
				Game.Prompt('<h3 >セーブデータ削除</h3><div class="block">本 当 に セーブデータを削除したいですか?<br><small>今までの経過も実績もヘブンリーチップスも失います!</small></div>',[['もちろん!','Game.ClosePrompt();Game.HardReset(1);'],'いいえ']);
			}
			else if (bypass==1)
			{
				Game.Prompt('<h3 >セーブデータ削除</h3><div class="block">おぉ…、あなたは今本当に、<b><i>本 当 に</i></b>この警告を無視しようと本気で思っているのですか?<br><small>「警告してくれなかったじゃないか…」なんて言わないでね!</small></div>',[['消して!','Game.ClosePrompt();Game.HardReset(2);'],'いいえ']);
			}
			else
			{
				for (var i in Game.AchievementsById)
				{
					var me=Game.AchievementsById[i];
					me.won=0;
				}
				for (var i in Game.ObjectsById)
				{
					var me=Game.ObjectsById[i];
					me.level=0;
				}

				Game.AchievementsOwned=0;
				Game.goldenClicks=0;
				Game.missedGoldenClicks=0;
				Game.Reset(1);
				Game.resets=0;
				Game.fullDate=parseInt(Date.now());
				Game.bakeryName=Game.GetBakeryName();
				Game.bakeryNameRefresh();
				Game.cookiesReset=0;
				Game.prestige=0;
				Game.heavenlyChips=0;
				Game.heavenlyChipsSpent=0;
				Game.heavenlyCookies=0;
				Game.permanentUpgrades=[-1,-1,-1,-1,-1];
				Game.ascensionMode=0;
				Game.lumps=-1;
				Game.lumpsTotal=-1;
				Game.lumpT=Date.now();
				Game.lumpRefill=0;
				Game.removeClass('lumpsOn');
			}
		}
		
		
		
		Game.onCrate=0;
		Game.setOnCrate=function(what)
		{
			Game.onCrate=what;
		}
		Game.crate=function(me,context,forceClickStr,id)
		{
			//produce a crate with associated tooltip for an upgrade or achievement
			//me is an object representing the upgrade or achievement
			//context can be "store", "ascend", "stats" or undefined
			//forceClickStr changes what is done when the crate is clicked
			//id is the resulting div's desired id
			
			var classes='crate';
			var enabled=0;
			var noFrame=0;
			var attachment='top';
			var neuromancy=0;
			if (context=='stats' && (Game.Has('脳神経占術') || (Game.sesame && me.pool=='debug'))) neuromancy=1;
			var mysterious=0;
			var clickStr='';
			
			if (me.type=='upgrade')
			{
				var canBuy=(context=='store'?me.canBuy():true);
				if (context=='stats' && me.bought==0 && !Game.Has('脳神経占術') && (!Game.sesame || me.pool!='debug')) return '';
				else if (context=='stats' && (Game.Has('脳神経占術') || (Game.sesame && me.pool=='debug'))) neuromancy=1;
				else if (context=='store' && !canBuy) enabled=0;
				else if (context=='ascend' && me.bought==0) enabled=0;
				else enabled=1;
				if (me.bought>0) enabled=1;
				
				if (context=='stats' && !Game.prefs.crates) noFrame=1;
				
				classes+=' upgrade';
				if (me.pool=='prestige') classes+=' heavenly';
				
				
				if (neuromancy) clickStr='Game.UpgradesById['+me.id+'].toggle();';
			}
			else if (me.type=='achievement')
			{
				if (context=='stats' && me.won==0 && me.pool!='normal') return '';
				else if (context!='stats') enabled=1;
				
				if (context=='stats' && !Game.prefs.crates) noFrame=1;
				
				classes+=' achievement';
				if (me.pool=='shadow') classes+=' shadow';
				if (me.won>0) enabled=1;
				else mysterious=1;
				if (!enabled) clickStr='Game.AchievementsById['+me.id+'].click();';
				
				if (neuromancy) clickStr='Game.AchievementsById['+me.id+'].toggle();';
			}
			
			if (context=='store') attachment='store';
			
			if (forceClickStr) clickStr=forceClickStr;
			
			if (me.choicesFunction) classes+=' selector';
			
			
			var icon=me.icon;
			if (mysterious) icon=[0,7];
			
			if (me.iconFunction) icon=me.iconFunction();
			
			if (me.bought && context=='store') enabled=0;
			
			if (enabled) classes+=' enabled';// else classes+=' disabled';
			if (noFrame) classes+=' noFrame';
			
			var text=[];
			if (Game.sesame)
			{
				if (Game.debuggedUpgradeCpS[me.name] || Game.debuggedUpgradeCpClick[me.name])
				{
					text.push('x'+Beautify(1+Game.debuggedUpgradeCpS[me.name],2));text.push(Game.debugColors[Math.floor(Math.max(0,Math.min(Game.debugColors.length-1,Math.pow(Game.debuggedUpgradeCpS[me.name]/2,0.5)*Game.debugColors.length)))]);
					text.push('x'+Beautify(1+Game.debuggedUpgradeCpClick[me.name],2));text.push(Game.debugColors[Math.floor(Math.max(0,Math.min(Game.debugColors.length-1,Math.pow(Game.debuggedUpgradeCpClick[me.name]/2,0.5)*Game.debugColors.length)))]);
				}
				if (Game.extraInfo) {text.push(Math.floor(me.order)+(me.power?'<br>P:'+me.power:''));text.push('#fff');}
			}
			var textStr='';
			for (var i=0;i<text.length;i+=2)
			{
				textStr+='<div style="opacity:0.9;z-index:1000;padding:0px 2px;background:'+text[i+1]+';color:#000;font-size:10px;position:absolute;top:'+(i/2*10)+'px;left:0px;">'+text[i]+'</div>';
			}
			
			return '<div'+
			(clickStr!=''?(' '+Game.clickStr+'="'+clickStr+'"'):'')+
			' class="'+classes+'" '+
			Game.getDynamicTooltip(
				'function(){return Game.crateTooltip(Game.'+(me.type=='upgrade'?'Upgrades':'Achievements')+'ById['+me.id+'],'+(context?'\''+context+'\'':'')+');}',
				attachment,true
			)+
			(id?'id="'+id+'" ':'')+
			'style="'+(mysterious?
				'background-position:'+(-0*48)+'px '+(-7*48)+'px':
				(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px')+';'+
				((context=='ascend' && me.pool=='prestige')?'position:absolute;left:'+me.posX+'px;top:'+me.posY+'px;':'')+
			'">'+
			textStr+
			(me.choicesFunction?'<div class="selectorCorner"></div>':'')+
			'</div>';
		}
		Game.crateTooltip=function(me,context)
		{
			var tags=[];
			mysterious=0;
			var neuromancy=0;
			var price='';
			if (context=='stats' && (Game.Has('脳神経占術') || (Game.sesame && me.pool=='debug'))) neuromancy=1;
			
			if (me.type=='upgrade')
			{
				if (me.pool=='prestige') tags.push('天国系','#efa438');
				else if (me.pool=='tech') tags.push('研究','#36a4ff');
				else if (me.pool=='cookie') tags.push('クッキー',0);
				else if (me.pool=='debug') tags.push('デバッグ','#00c462');
				else if (me.pool=='toggle') tags.push('スイッチ',0);
				else tags.push('アップグレード',0);
				
				if (me.tier!=0 && Game.Has('ラベルプリンター')) tags.push('グレード : '+Game.Tiers[me.tier].name,Game.Tiers[me.tier].color);
				if (me.name=='ラベルプリンター' && Game.Has('ラベルプリンター')) tags.push('グレード : 自己言及','#ff00ea');
				
				if (me.isVaulted()) tags.push('保管中','#4e7566');
				
				if (me.bought>0)
				{
					if (me.pool=='tech') tags.push('研究済み',0);
					else if (me.kitten) tags.push('購ニャー済み',0);
					else tags.push('購入済み',0);
				}
				
				if (me.lasting && me.unlocked) tags.push('永久に解除済み','#f2ff87');
				
				if (neuromancy && me.bought==0) tags.push('クリックして習得!','#00c462');
				else if (neuromancy && me.bought>0) tags.push('クリックして未習得に!','#00c462');
				
				var canBuy=(context=='store'?me.canBuy():true);
				var cost=me.getPrice();
				if (me.priceLumps>0) cost=me.priceLumps;
				
				if (me.priceLumps==0 && cost==0) price='';
				else
				{
					price='<div style="float:right;text-align:right;"><span class="price'+
						(me.priceLumps>0?(' lump'):'')+
						(me.pool=='prestige'?((me.bought || Game.heavenlyChips>=cost)?' heavenly':' heavenly disabled'):'')+
						(context=='store'?(canBuy?'':' disabled'):'')+
					'">'+Beautify(Math.round(cost))+'</span>'+((me.pool!='prestige' && me.priceLumps==0)?Game.costDetails(cost):'')+'</div>';
				}
			}
			else if (me.type=='achievement')
			{
				if (me.pool=='shadow') tags.push('隠し実績','#9700cf');
				else tags.push('実績',0);
				if (me.won>0) tags.push('解除済み',0);
				else {tags.push('未解除',0);mysterious=1;}
				
				if (neuromancy && me.won==0) tags.push('クリックして獲得!','#00c462');
				else if (neuromancy && me.won>0) tags.push('クリックして喪失!','#00c462');
			}
			
			var tagsStr='';
			for (var i=0;i<tags.length;i+=2)
			{
				if (i%2==0) tagsStr+=' <div class="tag" style="color:'+(tags[i+1]==0?'#fff':tags[i+1])+';">['+tags[i]+']</div>';
			}
			tagsStr=tagsStr.substring(1);
			
			var icon=me.icon;
			if (mysterious) icon=[0,7];
			
			if (me.iconFunction) icon=me.iconFunction();
			
			
			var tip='';
			if (context=='store')
			{
				if (me.pool!='toggle' && me.pool!='tech')
				{
					var purchase=me.kitten?'購ニャー':'購入';
					if (Game.Has('思いつきで作ったチェックリスト'))
					{
						if (me.isVaulted()) tip='アップグレードは保管されており、自動'+purchase+'されません。<br>クリックで'+purchase+'します。Shift+クリックで保管をやめます。';
						else tip='クリックして'+purchase+'します。Shift+クリックで保管します。';
						if (Game.keys[16]) tip+='<br>(Shiftを押しています。)';
						else tip+='<br>(Shiftを押していません。)';
					}
					else tip='クリックして'+purchase+'します。';
				}
				else if (me.pool=='toggle' && me.choicesFunction) tip='クリックして選択画面を開きます。';
				else if (me.pool=='toggle') tip='クリックして切り替えます。';
				else if (me.pool=='tech') tip='クリックして研究します。';
			}
			
			var desc=me.desc;
			if (me.descFunc) desc=me.descFunc(context);
			if (me.bought && context=='store' && me.displayFuncWhenOwned) desc=me.displayFuncWhenOwned()+'<div class="line"></div>'+desc;
			if (me.unlockAt)
			{
				if (me.unlockAt.require)
				{
					var it=Game.Upgrades[me.unlockAt.require];
					desc='<div style="font-size:80%;text-align:center;"><div class="icon" style="vertical-align:middle;display:inline-block;'+(it.icon[2]?'background-image:url('+it.icon[2]+');':'')+'background-position:'+(-it.icon[0]*48)+'px '+(-it.icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> '+it.name+' から</div><div class="line"></div>'+desc;
				}
				/*else if (me.unlockAt.season)
				{
					var it=Game.seasons[me.unlockAt.season];
					desc='<div style="font-size:80%;text-align:center;">From <div class="icon" style="vertical-align:middle;display:inline-block;'+(Game.Upgrades[it.trigger].icon[2]?'background-image:url('+Game.Upgrades[it.trigger].icon[2]+');':'')+'background-position:'+(-Game.Upgrades[it.trigger].icon[0]*48)+'px '+(-Game.Upgrades[it.trigger].icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> '+it.name+'</div><div class="line"></div>'+desc;
				}*/
				else if (me.unlockAt.text)
				{
					var it=Game.Upgrades[me.unlockAt.require];
					desc='<div style="font-size:80%;text-align:center;"><b>'+text+'</b> から</div><div class="line"></div>'+desc;
				}
			}
			
			return '<div style="padding:8px 4px;min-width:350px;">'+
			'<div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div>'+
			(me.bought && context=='store'?'':price)+
			'<div class="name">'+(mysterious?'???':me.name)+'</div>'+
			tagsStr+
			'<div class="line"></div><div class="description">'+(mysterious?'???':desc)+'</div></div>'+
			(tip!=''?('<div class="line"></div><div style="font-size:10px;font-weight:bold;color:#999;text-align:center;padding-bottom:4px;line-height:100%;">'+tip+'</div>'):'')+
			(Game.sesame?('<div style="font-size:9px;">ID : '+me.id+' | 順序 : '+Math.floor(me.order)+(me.tier?' | ティア : '+me.tier:'')+'</div>'):'');
		}
		
		Game.costDetails=function(cost)
		{
			if (!Game.Has('悪魔の計算報告')) return '';
			if (!cost) return '';
			var priceInfo='';
			var cps=Game.cookiesPs*(1-Game.cpsSucked);
			if (cost>Game.cookies) priceInfo+='あと'+Game.sayTime(((cost-Game.cookies)/cps+1)*Game.fps)+'で<br>';
			priceInfo+=Game.sayTime((cost/cps+1)*Game.fps)+'程度の価値<br>';
			priceInfo+='貯蓄量の'+Beautify((cost/Game.cookies)*100,1)+'%<br>';
			return '<div style="font-size:80%;opacity:0.7;line-height:90%;">'+priceInfo+'</div>';
		}
		
		
		/*=====================================================================================
		PRESTIGE
		=======================================================================================*/
		
		Game.HCfactor=3;
		Game.HowMuchPrestige=function(cookies)//how much prestige [cookies] should land you
		{
			return Math.pow(cookies/1000000000000,1/Game.HCfactor);
		}
		Game.HowManyCookiesReset=function(chips)//how many cookies [chips] are worth
		{
			//this must be the inverse of the above function (ie. if cookies=chips^2, chips=cookies^(1/2) )
			return Math.pow(chips,Game.HCfactor)*1000000000000;
		}
		Game.gainedPrestige=0;
		Game.EarnHeavenlyChips=function(cookiesForfeited)
		{
			//recalculate prestige and chips owned
			var prestige=Math.floor(Game.HowMuchPrestige(Game.cookiesReset+cookiesForfeited));
			if (prestige>Game.prestige)//did we gain prestige levels?
			{
				var prestigeDifference=prestige-Game.prestige;
				Game.gainedPrestige=prestigeDifference;
				Game.heavenlyChips+=prestigeDifference;
				Game.prestige=prestige;
				if (Game.prefs.popups) Game.Popup(''+Beautify(prestigeDifference)+'名声レベル上がりました'+(prestigeDifference==1?'':'')+'!');
				else Game.Notify('貯蓄していた'+Beautify(cookiesForfeited)+'クッキーを失いました。','<b>'+Beautify(prestigeDifference)+'</b>名声レベル上がりました'+(prestigeDifference==1?'':'')+'!',[19,7]);
			}
		}
		
		Game.GetHeavenlyMultiplier=function()
		{
			var heavenlyMult=0;
			if (Game.Has('ヘブンリーチップスの極意')) heavenlyMult+=0.05;
			if (Game.Has('天国のクッキースタンド')) heavenlyMult+=0.20;
			if (Game.Has('天国のベーカリー')) heavenlyMult+=0.25;
			if (Game.Has('天国の製菓ファクトリー')) heavenlyMult+=0.25;
			if (Game.Has('天国の鍵')) heavenlyMult+=0.25;
			//if (Game.hasAura('Dragon God')) heavenlyMult*=1.05;
			heavenlyMult*=1+Game.auraMult('龍神')*0.05;
			if (Game.Has('ラッキーな桁')) heavenlyMult*=1.01;
			if (Game.Has('ラッキーナンバー')) heavenlyMult*=1.01;
			if (Game.Has('ラッキーな支払い')) heavenlyMult*=1.01;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('creation');
				if (godLvl==1) heavenlyMult*=0.7;
				else if (godLvl==2) heavenlyMult*=0.8;
				else if (godLvl==3) heavenlyMult*=0.9;
			}
			return heavenlyMult;
		}
		
		Game.ascensionModes={
		0:{name:'なし',desc:'特に変更点なし',icon:[10,0]},
		1:{name:'生まれ変わり',desc:'この周回では最初から始まったような状態になります。名声レベルと天国系アップグレード、角砂糖、建物レベルは機能しません。天国系アップグレードとミニゲームが使用不可になります。<div class="line"></div>いくつかの実績はこのモードでないと解除できません。',icon:[2,7]}/*,
		2:{name:'指の引き金',desc:'この周回ではマウスホイールをスクロールすることでクリックしたことになります。いくつかのアップグレードにより新しいクリックの挙動が発生します。<br>無クリック実績はこのモードで取得できるかもしれません。<div class="line"></div>このモードで1000兆枚に達することで特殊な天国系アップグレードが解放されます。',icon:[12,0]}*/
		};
		
		Game.ascendMeterPercent=0;
		Game.ascendMeterPercentT=0;
		Game.ascendMeterLevel=100000000000000000000000000000;
		
		Game.nextAscensionMode=0;
		Game.UpdateAscensionModePrompt=function()
		{
			var icon=Game.ascensionModes[Game.nextAscensionMode].icon;
			var name=Game.ascensionModes[Game.nextAscensionMode].name;
			l('ascendModeButton').innerHTML=
			'<div class="crate noFrame enabled" '+Game.clickStr+'="Game.PickAscensionMode();" '+Game.getTooltip(
				'<div style="min-width:200px;text-align:center;font-size:11px;">次のプレイでのチャレンジモード :<br><b>'+name+'</b><div class="line"></div>チャレンジモードは次の周回に特別な変更点が適用されます。<br>チャレンジモードを変更するならクリックしてください。</div>'
			,'bottom-right')+' style="opacity:1;float:none;display:block;background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div>';
		}
		Game.PickAscensionMode=function()
		{
			PlaySound('snd/tick.mp3');
			Game.tooltip.hide();
			
			var str='';
			for (var i in Game.ascensionModes)
			{
				var icon=Game.ascensionModes[i].icon;
				str+='<div class="crate enabled'+(i==Game.nextAscensionMode?' highlighted':'')+'" id="challengeModeSelector'+i+'" style="opacity:1;float:none;display:inline-block;background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;" '+Game.clickStr+'="Game.nextAscensionMode='+i+';Game.PickAscensionMode();PlaySound(\'snd/tick.mp3\');Game.choiceSelectorOn=-1;" onMouseOut="l(\'challengeSelectedName\').innerHTML=Game.ascensionModes[Game.nextAscensionMode].name;l(\'challengeSelectedDesc\').innerHTML=Game.ascensionModes[Game.nextAscensionMode].desc;" onMouseOver="l(\'challengeSelectedName\').innerHTML=Game.ascensionModes['+i+'].name;l(\'challengeSelectedDesc\').innerHTML=Game.ascensionModes['+i+'].desc;"'+
				'></div>';
			}
			Game.Prompt('<h3>チャレンジモードの選択</h3>'+
						'<div class="line"></div><div class="crateBox">'+str+'</div><h4 id="challengeSelectedName">'+Game.ascensionModes[Game.nextAscensionMode].name+'</h4><div class="line"></div><div id="challengeSelectedDesc" style="min-height:128px;">'+Game.ascensionModes[Game.nextAscensionMode].desc+'</div><div class="line"></div>'
						,[['決定','Game.UpdateAscensionModePrompt();Game.ClosePrompt();']],0,'widePrompt');
		}
		
		Game.UpdateLegacyPrompt=function()
		{
			if (!l('legacyPromptData')) return 0;
			var date=new Date();
			date.setTime(Date.now()-Game.startDate);
			var timeInSeconds=date.getTime()/1000;
			var startDate=Game.sayTime(timeInSeconds*Game.fps,-1);
			
			var ascendNowToGet=Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned)-Game.HowMuchPrestige(Game.cookiesReset));
			var cookiesToNext=Math.floor(Game.HowManyCookiesReset(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned)+1)-Game.cookiesReset-Game.cookiesEarned);
			l('legacyPromptData').innerHTML=''+
				'<div class="icon" style="pointer-event:none;transform:scale(2);opacity:0.25;position:absolute;right:-8px;bottom:-8px;background-position:'+(-19*48)+'px '+(-7*48)+'px;"></div>'+
				'<div class="listing"><b>Run duration :</b> '+(startDate==''?'tiny':(startDate))+'</div>'+
				//'<div class="listing">Earned : '+Beautify(Game.cookiesEarned)+', Reset : '+Beautify(Game.cookiesReset)+'</div>'+
				'<div class="listing"><b>Prestige level :</b> '+Beautify(Game.prestige)+'</div>'+
				'<div class="listing"><b>Heavenly chips :</b> '+Beautify(Game.heavenlyChips)+'</div>'+
				(ascendNowToGet>=1?('<div class="listing"><b>Ascending now will produce :</b> '+Beautify(ascendNowToGet)+' heavenly chip'+((ascendNowToGet)==1?'':'')+'</div>'):
				('<div class="listing warning"><b>'+Beautify(cookiesToNext)+'</b> more cookie'+((cookiesToNext)==1?'':'')+' for the next prestige level.<br>You may ascend now, but will gain no benefits.</div>'))+
			'';
			if (1 || ascendNowToGet>=1) l('promptOption0').style.display='inline-block'; else l('promptOption0').style.display='none';
		}
		
		l('ascendOverlay').innerHTML=
			'<div id="ascendBox">'+
			'<div class="ascendData smallFramed prompt" '+Game.getTooltip(
							'<div style="min-width:300px;text-align:center;font-size:11px;">名声レベル1レベルにつきCpSが恒久的に <b>+1%</b> 増加します。<br>よりレベルをあげるには、より多くのクッキーが必要です。</div>'
							,'bottom-right')+' style="margin-top:8px;"><h3 id="ascendPrestige"></h3></div>'+
			'<div class="ascendData smallFramed prompt" '+Game.getTooltip(
							'<div style="min-width:300px;text-align:center;font-size:11px;">ヘブンリーチップスは天国系アップグレードを購入するのに使います。<br>名声レベルが1上がるごとにヘブンリーチップスが <b>1枚</b> もらえます。</div>'
							,'bottom-right')+'><h3 id="ascendHCs"></h3></div>'+
			'<a id="ascendButton" class="option framed large red" '+Game.getTooltip(
							'<div style="min-width:300px;text-align:center;font-size:11px;">必要なものをすべて買ったら、<br>このボタンを一度押してください!</div>'
							,'bottom-right')+' style="font-size:16px;margin-top:0px;"><span class="fancyText" style="font-size:20px;">転生</span></a>'+
			'<div id="ascendModeButton" style="position:absolute;right:34px;bottom:25px;display:none;"></div>'+
			'<input type="text" style="display:block;" id="upgradePositions"/></div>'+
			
			'<div id="ascendInfo"><div class="ascendData smallFramed" style="margin-top:22px;width:40%;font-size:11px;">昇天中です。<br>画面ドラッグか矢印キーを使ってください!<br>準備ができたら、転生ボタンを押してください。</div></div>';
		
		Game.UpdateAscensionModePrompt();
		
		AddEvent(l('ascendButton'),'click',function(){
			PlaySound('snd/tick.mp3');
			Game.Reincarnate();
		});
		
		Game.ascendl=l('ascend');
		Game.ascendContentl=l('ascendContent');
		Game.ascendZoomablel=l('ascendZoomable');
		Game.ascendUpgradesl=l('ascendUpgrades');
		Game.OnAscend=0;
		Game.AscendTimer=0;//how far we are into the ascend animation
		Game.AscendDuration=Game.fps*5;//how long the ascend animation is
		Game.AscendBreakpoint=Game.AscendDuration*0.5;//at which point the cookie explodes during the ascend animation
		Game.UpdateAscendIntro=function()
		{
			if (Game.AscendTimer==1) PlaySound('snd/charging.mp3');
			if (Game.AscendTimer==Math.floor(Game.AscendBreakpoint)) PlaySound('snd/thud.mp3');
			Game.AscendTimer++;
			if (Game.AscendTimer>Game.AscendDuration)//end animation and launch ascend screen
			{
				PlaySound('snd/cymbalRev.mp3',0.5);
				PlaySound('snd/choir.mp3');
				Game.EarnHeavenlyChips(Game.cookiesEarned);
				Game.AscendTimer=0;
				Game.OnAscend=1;Game.removeClass('ascendIntro');
				Game.addClass('ascending');
				Game.BuildAscendTree();
				Game.heavenlyChipsDisplayed=Game.heavenlyChips;
				Game.nextAscensionMode=0;
				Game.ascensionMode=0;
				Game.UpdateAscensionModePrompt();
			}
		}
		Game.ReincarnateTimer=0;//how far we are into the reincarnation animation
		Game.ReincarnateDuration=Game.fps*1;//how long the reincarnation animation is
		Game.UpdateReincarnateIntro=function()
		{
			if (Game.ReincarnateTimer==1) PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
			Game.ReincarnateTimer++;
			if (Game.ReincarnateTimer>Game.ReincarnateDuration)//end animation and launch regular game
			{
				Game.ReincarnateTimer=0;
				Game.removeClass('reincarnating');
			}
		}
		Game.Reincarnate=function(bypass)
		{
			if (!bypass) Game.Prompt('<h3>転生</h3><div class="block">現世に戻る準備は出来ましたか?</div>',[['はい','Game.ClosePrompt();Game.Reincarnate(1);'],'いいえ']);
			else
			{
				Game.ascendUpgradesl.innerHTML='';
				Game.ascensionMode=Game.nextAscensionMode;
				Game.nextAscensionMode=0;
				Game.Reset();
				if (Game.HasAchiev('再誕'))
				{
					if (Game.prefs.popups) Game.Popup('転生');
					else Game.Notify('転生','クッキーたち、こんにちは!',[10,0],4);
				}
				if (Game.resets>=1000) Game.Win('無限ループ');
				if (Game.resets>=100) Game.Win('輪廻');
				if (Game.resets>=10) Game.Win('復活');
				if (Game.resets>=1) Game.Win('再誕');
				Game.removeClass('ascending');
				Game.OnAscend=0;
				//trigger the reincarnate animation
				Game.ReincarnateTimer=1;
				Game.addClass('reincarnating');
				Game.BigCookieSize=0;
				
				Game.runModHook('reincarnate');
			}
		}
		Game.GiveUpAscend=function(bypass)
		{
			if (!bypass) Game.Prompt('<h3>諦める</h3><div class="block">本気かい? この周回をふたたび始めないといけない上に、ヘブンリーチップスはもらえません!</div>',[['はい','Game.ClosePrompt();Game.GiveUpAscend(1);'],'いいえ']);
			else
			{
				if (Game.prefs.popups) Game.Popup('ゲームリセット');
				else Game.Notify('諦めた','もう一回挑戦しよう!',[0,5],4);
				Game.Reset();
			}
		}
		Game.Ascend=function(bypass)
		{
			if (!bypass) Game.Prompt('<h3>昇天</h3><div class="block">あなたは 本 当 に 昇天したいですか?<div class="line"></div>今までの経過をすべて失い、0から始めることになります。<div class="line"></div>すべてのクッキーは名声とヘブンリーチップスに変換されます。<div class="line"></div>実績'+(Game.canLumps()?',と施設レベル、角砂糖の個数':'')+'は引き継がれます。</div>',[['もちろん!','Game.ClosePrompt();Game.Ascend(1);'],'いいえ']);
			else
			{
				if (Game.prefs.popups) Game.Popup('昇天');
				else Game.Notify('昇天','クッキーたち、またね。',[20,7],4);
				Game.OnAscend=0;Game.removeClass('ascending');
				Game.addClass('ascendIntro');
				//trigger the ascend animation
				Game.AscendTimer=1;
				Game.killShimmers();
				l('toggleBox').style.display='none';
				l('toggleBox').innerHTML='';
				Game.choiceSelectorOn=-1;
				Game.ToggleSpecialMenu(0);
				Game.AscendOffX=0;
				Game.AscendOffY=0;
				Game.AscendOffXT=0;
				Game.AscendOffYT=0;
				Game.AscendZoomT=1;
				Game.AscendZoom=0.2;
			}
		}
		
		Game.DebuggingPrestige=0;
		Game.AscendDragX=0;
		Game.AscendDragY=0;
		Game.AscendOffX=0;
		Game.AscendOffY=0;
		Game.AscendZoom=1;
		Game.AscendOffXT=0;
		Game.AscendOffYT=0;
		Game.AscendZoomT=1;
		Game.AscendDragging=0;
		Game.AscendGridSnap=24;
		Game.heavenlyBounds={left:0,right:0,top:0,bottom:0};
		Game.UpdateAscend=function()
		{
			if (Game.keys[37]) Game.AscendOffXT+=16*(1/Game.AscendZoomT);
			if (Game.keys[38]) Game.AscendOffYT+=16*(1/Game.AscendZoomT);
			if (Game.keys[39]) Game.AscendOffXT-=16*(1/Game.AscendZoomT);
			if (Game.keys[40]) Game.AscendOffYT-=16*(1/Game.AscendZoomT);
			
			if (Game.AscendOffXT>-Game.heavenlyBounds.left) Game.AscendOffXT=-Game.heavenlyBounds.left;
			if (Game.AscendOffXT<-Game.heavenlyBounds.right) Game.AscendOffXT=-Game.heavenlyBounds.right;
			if (Game.AscendOffYT>-Game.heavenlyBounds.top) Game.AscendOffYT=-Game.heavenlyBounds.top;
			if (Game.AscendOffYT<-Game.heavenlyBounds.bottom) Game.AscendOffYT=-Game.heavenlyBounds.bottom;
			Game.AscendOffX+=(Game.AscendOffXT-Game.AscendOffX)*0.5;
			Game.AscendOffY+=(Game.AscendOffYT-Game.AscendOffY)*0.5;
			Game.AscendZoom+=(Game.AscendZoomT-Game.AscendZoom)*0.25;
			if (Math.abs(Game.AscendZoomT-Game.AscendZoom)<0.005) Game.AscendZoom=Game.AscendZoomT;
			
			if (Game.DebuggingPrestige)
			{
				for (var i in Game.PrestigeUpgrades)
				{
					var me=Game.PrestigeUpgrades[i];
					AddEvent(l('heavenlyUpgrade'+me.id),'mousedown',function(me){return function(){
						if (!Game.DebuggingPrestige) return;
						Game.SelectedHeavenlyUpgrade=me;
					}}(me));
					AddEvent(l('heavenlyUpgrade'+me.id),'mouseup',function(me){return function(){
						if (Game.SelectedHeavenlyUpgrade==me) {Game.SelectedHeavenlyUpgrade=0;Game.BuildAscendTree();}
					}}(me));
				}
			}
			
			if (Game.mouseDown && !Game.promptOn)
			{
				if (!Game.AscendDragging)
				{
					Game.AscendDragX=Game.mouseX;
					Game.AscendDragY=Game.mouseY;
				}
				Game.AscendDragging=1;
				
				if (Game.DebuggingPrestige)
				{
					if (Game.SelectedHeavenlyUpgrade)
					{
						Game.tooltip.hide();
						//drag upgrades around
						var me=Game.SelectedHeavenlyUpgrade;
						me.posX+=(Game.mouseX-Game.AscendDragX)*(1/Game.AscendZoomT);
						me.posY+=(Game.mouseY-Game.AscendDragY)*(1/Game.AscendZoomT);
						var posX=me.posX;//Math.round(me.posX/Game.AscendGridSnap)*Game.AscendGridSnap;
						var posY=me.posY;//Math.round(me.posY/Game.AscendGridSnap)*Game.AscendGridSnap;
						l('heavenlyUpgrade'+me.id).style.left=Math.floor(posX)+'px';
						l('heavenlyUpgrade'+me.id).style.top=Math.floor(posY)+'px';
						for (var ii in me.parents)
						{
							var origX=0;
							var origY=0;
							var targX=me.posX+28;
							var targY=me.posY+28;
							if (me.parents[ii]!=-1) {origX=me.parents[ii].posX+28;origY=me.parents[ii].posY+28;}
							var rot=-(Math.atan((targY-origY)/(origX-targX))/Math.PI)*180;
							if (targX<=origX) rot+=180;
							var dist=Math.floor(Math.sqrt((targX-origX)*(targX-origX)+(targY-origY)*(targY-origY)));
							//l('heavenlyLink'+me.id+'-'+ii).style='width:'+dist+'px;-webkit-transform:rotate('+rot+'deg);-moz-transform:rotate('+rot+'deg);-ms-transform:rotate('+rot+'deg);-o-transform:rotate('+rot+'deg);transform:rotate('+rot+'deg);left:'+(origX)+'px;top:'+(origY)+'px;';
							l('heavenlyLink'+me.id+'-'+ii).style='width:'+dist+'px;transform:rotate('+rot+'deg);left:'+(origX)+'px;top:'+(origY)+'px;';
						}
					}
				}
				if (!Game.SelectedHeavenlyUpgrade)
				{
					Game.AscendOffXT+=(Game.mouseX-Game.AscendDragX)*(1/Game.AscendZoomT);
					Game.AscendOffYT+=(Game.mouseY-Game.AscendDragY)*(1/Game.AscendZoomT);
				}
				Game.AscendDragX=Game.mouseX;
				Game.AscendDragY=Game.mouseY;
			}
			else
			{
				/*if (Game.SelectedHeavenlyUpgrade)
				{
					var me=Game.SelectedHeavenlyUpgrade;
					me.posX=Math.round(me.posX/Game.AscendGridSnap)*Game.AscendGridSnap;
					me.posY=Math.round(me.posY/Game.AscendGridSnap)*Game.AscendGridSnap;
					l('heavenlyUpgrade'+me.id).style.left=me.posX+'px';
					l('heavenlyUpgrade'+me.id).style.top=me.posY+'px';
				}*/
				Game.AscendDragging=0;
				Game.SelectedHeavenlyUpgrade=0;
			}
			if (Game.Click || Game.promptOn)
			{
				Game.AscendDragging=0;
			}
			
			//Game.ascendl.style.backgroundPosition=Math.floor(Game.AscendOffX/2)+'px '+Math.floor(Game.AscendOffY/2)+'px';
			//Game.ascendl.style.backgroundPosition=Math.floor(Game.AscendOffX/2)+'px '+Math.floor(Game.AscendOffY/2)+'px,'+Math.floor(Game.AscendOffX/4)+'px '+Math.floor(Game.AscendOffY/4)+'px';
			//Game.ascendContentl.style.left=Math.floor(Game.AscendOffX)+'px';
			//Game.ascendContentl.style.top=Math.floor(Game.AscendOffY)+'px';
			Game.ascendContentl.style.webkitTransform='translate('+Math.floor(Game.AscendOffX)+'px,'+Math.floor(Game.AscendOffY)+'px)';
			Game.ascendContentl.style.msTransform='translate('+Math.floor(Game.AscendOffX)+'px,'+Math.floor(Game.AscendOffY)+'px)';
			Game.ascendContentl.style.oTransform='translate('+Math.floor(Game.AscendOffX)+'px,'+Math.floor(Game.AscendOffY)+'px)';
			Game.ascendContentl.style.mozTransform='translate('+Math.floor(Game.AscendOffX)+'px,'+Math.floor(Game.AscendOffY)+'px)';
			Game.ascendContentl.style.transform='translate('+Math.floor(Game.AscendOffX)+'px,'+Math.floor(Game.AscendOffY)+'px)';
			Game.ascendZoomablel.style.webkitTransform='scale('+(Game.AscendZoom)+','+(Game.AscendZoom)+')';
			Game.ascendZoomablel.style.msTransform='scale('+(Game.AscendZoom)+','+(Game.AscendZoom)+')';
			Game.ascendZoomablel.style.oTransform='scale('+(Game.AscendZoom)+','+(Game.AscendZoom)+')';
			Game.ascendZoomablel.style.mozTransform='scale('+(Game.AscendZoom)+','+(Game.AscendZoom)+')';
			Game.ascendZoomablel.style.transform='scale('+(Game.AscendZoom)+','+(Game.AscendZoom)+')';
			
			//if (Game.Scroll!=0) Game.ascendContentl.style.transformOrigin=Math.floor(Game.windowW/2-Game.mouseX)+'px '+Math.floor(Game.windowH/2-Game.mouseY)+'px';
			if (Game.Scroll<0 && !Game.promptOn) {Game.AscendZoomT=0.5;}
			if (Game.Scroll>0 && !Game.promptOn) {Game.AscendZoomT=1;}
			
			if (Game.T%2==0)
			{
				l('ascendPrestige').innerHTML='名声レベル :<br>'+SimpleBeautify(Game.prestige);
				l('ascendHCs').innerHTML='ヘブンリーチップス :<br><span class="price heavenly">'+SimpleBeautify(Math.round(Game.heavenlyChipsDisplayed))+'</span>';
				if (Game.prestige>0) l('ascendModeButton').style.display='block';
				else l('ascendModeButton').style.display='none';
			}
			Game.heavenlyChipsDisplayed+=(Game.heavenlyChips-Game.heavenlyChipsDisplayed)*0.4;
			
			if (Game.DebuggingPrestige && Game.T%10==0)
			{
				var str='';
				for (var i in Game.PrestigeUpgrades)
				{
					var me=Game.PrestigeUpgrades[i];
					str+=me.id+':['+Math.floor(me.posX)+','+Math.floor(me.posY)+'],';
				}
				l('upgradePositions').value='Game.UpgradePositions={'+str+'};';
			}
			//if (Game.T%5==0) Game.BuildAscendTree();
		}
		Game.AscendRefocus=function()
		{
			Game.AscendOffX=0;
			Game.AscendOffY=0;
			Game.ascendl.className='';
		}
		
		Game.SelectedHeavenlyUpgrade=0;
		Game.PurchaseHeavenlyUpgrade=function(what)
		{
			//if (Game.Has('脳神経占術')) Game.UpgradesById[what].toggle(); else
			if (Game.UpgradesById[what].buy())
			{
				if (l('heavenlyUpgrade'+what)){var rect=l('heavenlyUpgrade'+what).getBoundingClientRect();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24);}
				//Game.BuildAscendTree();
			}
		}
		Game.BuildAscendTree=function()
		{
			var str='';
			Game.heavenlyBounds={left:0,right:0,top:0,bottom:0};

			if (Game.DebuggingPrestige) l('upgradePositions').style.display='block'; else l('upgradePositions').style.display='none';
			
			for (var i in Game.PrestigeUpgrades)
			{
				var me=Game.PrestigeUpgrades[i];
				me.canBePurchased=1;
				if (!me.bought && !Game.DebuggingPrestige)
				{
					if (me.showIf && !me.showIf()) me.canBePurchased=0;
					else
					{
						for (var ii in me.parents)
						{
							if (me.parents[ii]!=-1 && !me.parents[ii].bought) me.canBePurchased=0;
						}
					}
				}
			}
			str+='<div class="crateBox" style="filter:none;-webkit-filter:none;">';//chrome is still bad at these
			for (var i in Game.PrestigeUpgrades)
			{
				var me=Game.PrestigeUpgrades[i];
				
				var ghosted=0;
				if (me.canBePurchased || Game.Has('脳神経占術'))
				{
					str+=Game.crate(me,'ascend','Game.PurchaseHeavenlyUpgrade('+me.id+');','heavenlyUpgrade'+me.id);
				}
				else
				{
					for (var ii in me.parents)
					{
						if (me.parents[ii]!=-1 && me.parents[ii].canBePurchased) ghosted=1;
					}
					if (me.showIf && !me.showIf()) ghosted=0;
					if (ghosted)
					{
						//maybe replace this with Game.crate()
						str+='<div class="crate upgrade heavenly ghosted" id="heavenlyUpgrade'+me.id+'" style="position:absolute;left:'+me.posX+'px;top:'+me.posY+'px;'+(me.icon[2]?'background-image:url('+me.icon[2]+');':'')+'background-position:'+(-me.icon[0]*48)+'px '+(-me.icon[1]*48)+'px;"></div>';
					}
				}
				if (me.canBePurchased || Game.Has('脳神経占術') || ghosted)
				{
					if (me.posX<Game.heavenlyBounds.left) Game.heavenlyBounds.left=me.posX;
					if (me.posX>Game.heavenlyBounds.right) Game.heavenlyBounds.right=me.posX;
					if (me.posY<Game.heavenlyBounds.top) Game.heavenlyBounds.top=me.posY;
					if (me.posY>Game.heavenlyBounds.bottom) Game.heavenlyBounds.bottom=me.posY;
				}
				for (var ii in me.parents)//create pulsing links
				{
					if (me.parents[ii]!=-1 && (me.canBePurchased || ghosted))
					{
						var origX=0;
						var origY=0;
						var targX=me.posX+28;
						var targY=me.posY+28;
						if (me.parents[ii]!=-1) {origX=me.parents[ii].posX+28;origY=me.parents[ii].posY+28;}
						var rot=-(Math.atan((targY-origY)/(origX-targX))/Math.PI)*180;
						if (targX<=origX) rot+=180;
						var dist=Math.floor(Math.sqrt((targX-origX)*(targX-origX)+(targY-origY)*(targY-origY)));
						str+='<div class="parentLink" id="heavenlyLink'+me.id+'-'+ii+'" style="'+(ghosted?'opacity:0.1;':'')+'width:'+dist+'px;-webkit-transform:rotate('+rot+'deg);-moz-transform:rotate('+rot+'deg);-ms-transform:rotate('+rot+'deg);-o-transform:rotate('+rot+'deg);transform:rotate('+rot+'deg);left:'+(origX)+'px;top:'+(origY)+'px;"></div>';
					}
				}
			}
			Game.heavenlyBounds.left-=128;
			Game.heavenlyBounds.top-=128;
			Game.heavenlyBounds.right+=128+64;
			Game.heavenlyBounds.bottom+=128+64;
			//str+='<div style="border:1px solid red;position:absolute;left:'+Game.heavenlyBounds.left+'px;width:'+(Game.heavenlyBounds.right-Game.heavenlyBounds.left)+'px;top:'+Game.heavenlyBounds.top+'px;height:'+(Game.heavenlyBounds.bottom-Game.heavenlyBounds.top)+'px;"></div>';
			str+='</div>';
			Game.ascendUpgradesl.innerHTML=str;
		}
		
		
		/*=====================================================================================
		COALESCING SUGAR LUMPS
		=======================================================================================*/
		Game.lumpMatureAge=1;
		Game.lumpRipeAge=1;
		Game.lumpOverripeAge=1;
		Game.lumpCurrentType=0;
		l('comments').innerHTML=l('comments').innerHTML+
			'<div id="lumps" onclick="Game.clickLump();" '+Game.getDynamicTooltip('Game.lumpTooltip','bottom')+'><div id="lumpsIcon" class="usesIcon"></div><div id="lumpsIcon2" class="usesIcon"></div><div id="lumpsAmount">0</div></div>';
		Game.lumpTooltip=function()
		{
			var str='<div style="padding:8px;width:400px;font-size:11px;text-align:center;">'+
			'<span class="price lump">'+Beautify(Game.lumps)+'角砂糖'+(Game.lumps==1?'':'')+'</span>持っています。'+
			'<div class="line"></div>'+
			'<b>角砂糖</b>はあなたの過去の業績にひかれて合体していっています。';
						
			var age=Date.now()-Game.lumpT;
			str+='<div class="line"></div>';
			if (age<0) str+='This sugar lump has been exposed to time travel shenanigans and will take an excruciating <b>'+Game.sayTime(((Game.lumpMatureAge-age)/1000+1)*Game.fps,-1)+'</b>かかります。';
			else if (age<Game.lumpMatureAge) str+='この角砂糖は成長中で、熟すまで<b>'+Game.sayTime(((Game.lumpMatureAge-age)/1000+1)*Game.fps,-1)+'</b>かかります。';
			else if (age<Game.lumpRipeAge) str+='この角砂糖は熟しており、<b>'+Game.sayTime(((Game.lumpRipeAge-age)/1000+1)*Game.fps,-1)+'</b>で熟しきるでしょう。<br><b>今、クリックして収穫する</b>ことができますが、<b>50%の確率でちゃんと収穫</b>できます。';
			else if (age<Game.lumpOverripeAge) str+='<b>角砂糖が熟しきりました!クリックして収穫してください。</b><br>何もしなければ、<b>'+Game.sayTime(((Game.lumpOverripeAge-age)/1000+1)*Game.fps,-1)+'</b>で自動収穫されます。';
			
			var phase=(age/Game.lumpOverripeAge)*7;
			if (phase>=3)
			{
				if (Game.lumpCurrentType!=0) str+='<div class="line"></div>';
				if (Game.lumpCurrentType==1) str+='この角砂糖は<b>二股</b>に成長しています。これを収穫すれば50%の確率で2つ入手できます。';
				else if (Game.lumpCurrentType==2) str+='この角砂糖は<b>金色</b>に成長しています。これを収穫すれば角砂糖が2～7個手に入り、現在所持しているクッキーが2倍になり(上限はCpS 24時間分の増加)、24時間の間、10% ゴールデンクッキーが見つけやすくなります。';
				else if (Game.lumpCurrentType==3) str+='この角砂糖はおばあちゃんらの影響を受けて<b>肉々しく</b>成長しています。これを収穫すれば、0～2個入手できます。';
				else if (Game.lumpCurrentType==4) str+='この角砂糖は<b>キャラメル化</b>しており、その粘っこさは思わぬものを引っ付けてきます。収穫すると1から3個の角砂糖を生み出し、砂糖使用のクールダウンから回復します。';
			}
			
			str+='<div class="line"></div>';
			str+='角砂糖は<b>'+Game.sayTime((Game.lumpMatureAge/1000)*Game.fps,-1)+'</b>後に熟し、<br><b>'+Game.sayTime((Game.lumpRipeAge/1000)*Game.fps,-1)+'</b>後に熟しきり、<br> <b>'+Game.sayTime((Game.lumpOverripeAge/1000)*Game.fps,-1)+'</b>後に落果します。';
			
			str+='<div class="line"></div>'+
			'&bull; 角砂糖は完熟すると収穫できますが、もし放置しておいたとしても完熟し始め(収穫できる可能性が上がっていきます)、そのうち、やがて落果し自動収穫されます。<br>&bull; 角砂糖は美味しく、色々なものの通貨として使われているようです。<br>&bull; 一度角砂糖を収穫すると、別の角砂糖がその場所で成長し始めます。<br>&bull; 角砂糖はゲームを閉じている間も成長し続けることに注意してください。';
			
			str+='</div>';
			return str;
		}
		Game.computeLumpTimes=function()
		{
			var hour=1000*60*60;
			Game.lumpMatureAge=hour*20;
			Game.lumpRipeAge=hour*23;
			if (Game.Has('天上のハーブ')) Game.lumpRipeAge-=hour;
			if (Game.Has('悪魔の糖尿病')) Game.lumpMatureAge-=hour;
			if (Game.Has('ホテイアマイのシロップ')) Game.lumpMatureAge-=1000*60*7;
			if (Game.Has('砂糖の完熟促進処理')) Game.lumpRipeAge-=6000*Math.min(600,Game.Objects['グランマ'].amount);//capped at 600 grandmas
			if (Game.hasGod && Game.BuildingsOwned%10==0)
			{
				var godLvl=Game.hasGod('order');
				if (godLvl==1) Game.lumpRipeAge-=hour;
				else if (godLvl==2) Game.lumpRipeAge-=(hour/3)*2;
				else if (godLvl==3) Game.lumpRipeAge-=(hour/3);
			}
			//if (Game.hasAura('Dragon\'s Curve')) {Game.lumpMatureAge/=1.05;Game.lumpRipeAge/=1.05;}
			Game.lumpMatureAge/=1+Game.auraMult('ドラゴン曲線')*0.05;Game.lumpRipeAge/=1+Game.auraMult('ドラゴン曲線')*0.05;
			Game.lumpOverripeAge=Game.lumpRipeAge+hour;
			if (Game.Has('グルコースで充満した空気')) {Game.lumpMatureAge/=2000;Game.lumpRipeAge/=2000;Game.lumpOverripeAge/=2000;}
		}
		Game.loadLumps=function(time)
		{
			Game.computeLumpTimes();
			//Game.computeLumpType();
			if (!Game.canLumps()) Game.removeClass('lumpsOn');
			else
			{
				if (Game.ascensionMode!=1) Game.addClass('lumpsOn');
				Game.lumpT=Math.min(Date.now(),Game.lumpT);
				var age=Math.max(Date.now()-Game.lumpT,0);
				var amount=Math.floor(age/Game.lumpOverripeAge);//how many lumps did we harvest since we closed the game?
				if (amount>=1)
				{
					Game.harvestLumps(1,true);
					Game.lumpCurrentType=0;//all offline lumps after the first one have a normal type
					if (amount>1) Game.harvestLumps(amount-1,true);
					if (Game.prefs.popups) Game.Popup('あなたのいない間に'+Beautify(amount)+'個の角砂糖'+(amount==1?'':'')+'を収穫しました');
					else Game.Notify('','あなたのいない間に<b>'+Beautify(amount)+'</b>個の角砂糖'+(amount==1?'':'')+'を収穫しました。',[29,14]);
					Game.lumpT=Date.now()-(age-amount*Game.lumpOverripeAge);
					Game.computeLumpType();
				}
			}
		}
		Game.gainLumps=function(total)
		{
			if (Game.lumpsTotal==-1){Game.lumpsTotal=0;Game.lumps=0;}
			Game.lumps+=total;
			Game.lumpsTotal+=total;
			
			if (Game.lumpsTotal>=7) Game.Win('こやつ、甘いな');
			if (Game.lumpsTotal>=30) Game.Win('砂糖の猛進');
			if (Game.lumpsTotal>=365) Game.Win('空虚な一年');
		}
		Game.clickLump=function()
		{
			if (!Game.canLumps()) return;
			var age=Date.now()-Game.lumpT;
			if (age<Game.lumpMatureAge) {}
			else if (age<Game.lumpRipeAge)
			{
				var amount=choose([0,1]);
				if (amount!=0) Game.Win('手摘み');
				Game.harvestLumps(amount);
				Game.computeLumpType();
			}
			else if (age<Game.lumpOverripeAge)
			{
				Game.harvestLumps(1);
				Game.computeLumpType();
			}
		}
		Game.harvestLumps=function(amount,silent)
		{
			if (!Game.canLumps()) return;
			Game.lumpT=Date.now();
			var total=amount;
			if (Game.lumpCurrentType==1 && Game.Has('誰得な人工甘味料') && Math.random()<0.05) total*=2;
			else if (Game.lumpCurrentType==1) total*=choose([1,2]);
			else if (Game.lumpCurrentType==2)
			{
				total*=choose([2,3,4,5,6,7]);
				Game.gainBuff('sugar blessing',24*60*60,1);
				Game.Earn(Math.min(Game.cookiesPs*60*60*24,Game.cookies));
				if (Game.prefs.popups) Game.Popup('砂糖の祝福を受けました!');
				else Game.Notify('砂糖の祝福を受けました!','手持ちのクッキーが2倍になりました。<br>次の24時間、ゴールデンクッキーが +10% 出やすくなります。',[29,16]);
			}
			else if (Game.lumpCurrentType==3) total*=choose([0,0,1,2,2]);
			else if (Game.lumpCurrentType==4)
			{
				total*=choose([1,2,3]);
				Game.lumpRefill=0;//Date.now()-Game.getLumpRefillMax();
				if (Game.prefs.popups) Game.Popup('角砂糖の使用タイマーがリセットされました!');
				else Game.Notify('角砂糖の使用タイマーがリセットされました!','',[29,27]);
			}
			total=Math.floor(total);
			Game.gainLumps(total);
			if (Game.lumpCurrentType==1) Game.Win('砂糖入り砂糖');
			else if (Game.lumpCurrentType==2) Game.Win('完全天然サトウキビ糖');
			else if (Game.lumpCurrentType==3) Game.Win('甘い果肉');
			else if (Game.lumpCurrentType==4) Game.Win('メイラード反応');
			
			if (!silent)
			{
				var rect=l('lumpsIcon2').getBoundingClientRect();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24);
				if (total>0) Game.Popup('<small>+'+Beautify(total)+'角砂糖'+(total==1?'':'')+'</small>',(rect.left+rect.right)/2,(rect.top+rect.bottom)/2-48);
				else Game.Popup('<small>適当に収穫した!</small>',(rect.left+rect.right)/2,(rect.top+rect.bottom)/2-48);
				PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
			}
			Game.computeLumpTimes();
		}
		Game.computeLumpType=function()
		{
			Math.seedrandom(Game.seed+'/'+Game.lumpT);
			var types=[0];
			var loop=1;
			//if (Game.hasAura('Dragon\'s Curve')) loop=2;
			loop+=Game.auraMult('ドラゴン曲線');
			loop=randomFloor(loop);
			for (var i=0;i<loop;i++)
			{
				if (Math.random()<(Game.Has('誰得な人工甘味料')?0.15:0.1)) types.push(1);//bifurcated
				if (Math.random()<3/1000) types.push(2);//golden
				if (Math.random()<0.1*Game.elderWrath) types.push(3);//meaty
				if (Math.random()<1/50) types.push(4);//caramelized
			}
			Game.lumpCurrentType=choose(types);
			Math.seedrandom();
		}
		
		Game.canLumps=function()//grammatically pleasing function name
		{
			if (Game.lumpsTotal>-1 || (Game.ascensionMode!=1 && (Game.cookiesEarned+Game.cookiesReset)>=1000000000)) return true;
			return false;
		}
		
		Game.getLumpRefillMax=function()
		{
			return Game.fps*60*15;//1000*60*15;//15 minutes
		}
		Game.getLumpRefillRemaining=function()
		{
			return Game.lumpRefill;//Game.getLumpRefillMax()-(Date.now()-Game.lumpRefill);
		}
		Game.canRefillLump=function()
		{
			return Game.lumpRefill<=0;//((Date.now()-Game.lumpRefill)>=Game.getLumpRefillMax());
		}
		Game.refillLump=function(n,func)
		{
			if (Game.lumps>=n && Game.canRefillLump())
			{
				Game.spendLump(n,'回復します',function()
				{
					if (!Game.sesame) Game.lumpRefill=Game.getLumpRefillMax();//Date.now();
					func();
				})();
			}
		}
		Game.spendLump=function(n,str,func)
		{
			//ask if we want to spend N lumps
			return function()
			{
				if (Game.lumps<n) return false;
				if (Game.prefs.askLumps)
				{
					PlaySound('snd/tick.mp3');
					Game.promptConfirmFunc=func;//bit dumb
					Game.Prompt('<div class="icon" style="background:url(img/icons.png?v='+Game.version+');float:left;margin-left:-8px;margin-top:-8px;background-position:'+(-29*48)+'px '+(-14*48)+'px;"></div><div style="margin:16px 8px;"><b>'+Beautify(n)+'角砂糖'+(n!=1?'':'')+'</b>消費して、'+str+'か?</div>',[['はい','Game.lumps-='+n+';Game.promptConfirmFunc();Game.promptConfirmFunc=0;Game.recalculateGains=1;Game.ClosePrompt();'],'いいえ']);
					return false;
				}
				else
				{
					Game.lumps-=n;
					func();
					Game.recalculateGains=1;
				}
			}
		}
		
		Game.doLumps=function()
		{
			if (Game.lumpRefill>0) Game.lumpRefill--;
			
			if (!Game.canLumps()) {Game.removeClass('lumpsOn');return;}
			if (Game.lumpsTotal==-1)
			{
				//first time !
				if (Game.ascensionMode!=1) Game.addClass('lumpsOn');
				Game.lumpT=Date.now();
				Game.lumpsTotal=0;
				Game.lumps=0;
				Game.computeLumpType();
				
				Game.Notify('角砂糖!','合計 <b>10億クッキー</b> 焼いたため、現在あなたに<b>角砂糖</b>が引き寄せられています。角砂糖は画面上部、統計ボタン下付近で音もなく合体しています。<br>角砂糖が熟すと収穫できるようになり、色々なものに使うことできます!',[23,14]);
			}
			var age=Date.now()-Game.lumpT;
			if (age>Game.lumpOverripeAge)
			{
				age=0;
				Game.harvestLumps(1);
				Game.computeLumpType();
			}
			
			var phase=Math.min(6,Math.floor((age/Game.lumpOverripeAge)*7));
			var phase2=Math.min(6,Math.floor((age/Game.lumpOverripeAge)*7)+1);
			var row=14;
			var row2=14;
			var type=Game.lumpCurrentType;
			if (type==1)//double
			{
				//if (phase>=6) row=15;
				if (phase2>=6) row2=15;
			}
			else if (type==2)//golden
			{
				if (phase>=4) row=16;
				if (phase2>=4) row2=16;
			}
			else if (type==3)//meaty
			{
				if (phase>=4) row=17;
				if (phase2>=4) row2=17;
			}
			else if (type==4)//caramelized
			{
				if (phase>=4) row=27;
				if (phase2>=4) row2=27;
			}
			var icon=[23+Math.min(phase,5),row];
			var icon2=[23+phase2,row2];
			if (age<0){icon=[17,5];icon2=[17,5];}
			var opacity=Math.min(6,(age/Game.lumpOverripeAge)*7)%1;
			if (phase>=6) {opacity=1;}
			l('lumpsIcon').style.backgroundPosition=(-icon[0]*48)+'px '+(-icon[1]*48)+'px';
			l('lumpsIcon2').style.backgroundPosition=(-icon2[0]*48)+'px '+(-icon2[1]*48)+'px';
			l('lumpsIcon2').style.opacity=opacity;
			l('lumpsAmount').textContent=Beautify(Game.lumps);
		}
		
		/*=====================================================================================
		COOKIE ECONOMICS
		=======================================================================================*/
		Game.Earn=function(howmuch)
		{
			Game.cookies+=howmuch;
			Game.cookiesEarned+=howmuch;
		}
		Game.Spend=function(howmuch)
		{
			Game.cookies-=howmuch;
		}
		Game.Dissolve=function(howmuch)
		{
			Game.cookies-=howmuch;
			Game.cookiesEarned-=howmuch;
			Game.cookies=Math.max(0,Game.cookies);
			Game.cookiesEarned=Math.max(0,Game.cookiesEarned);
		}
		Game.mouseCps=function()
		{
			var add=0;
			if (Game.Has('千手観音')) add+=		0.1;
			if (Game.Has('万手観音')) add*=		5;
			if (Game.Has('億手観音')) add*=		10;
			if (Game.Has('兆手観音')) add*=		20;
			if (Game.Has('京手観音')) add*=	20;
			if (Game.Has('垓手観音')) add*=	20;
			if (Game.Has('秭手観音')) add*=	20;
			if (Game.Has('穣手観音')) add*=	20;
			if (Game.Has('溝手観音')) add*=	20;
			if (Game.Has('澗手観音')) add*=	20;
			
			var num=0;
			for (var i in Game.Objects) {num+=Game.Objects[i].amount;}
			num-=Game.Objects['カーソル'].amount;
			add=add*num;
			if (Game.Has('プラスチックマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('鉄のマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('チタンのマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('アダマンチウムのマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('アンオブテニウムのマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('エルディウムのマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('望まれし合金のマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('夢の鋼鉄のマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('不磨のマウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('軍用ミスリル製マウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('ハイテク黒曜石マウス ')) add+=Game.cookiesPs*0.01;
			if (Game.Has('プラズマ大理石マウス')) add+=Game.cookiesPs*0.01;
			if (Game.Has('奇跡の石のマウス')) add+=Game.cookiesPs*0.01;
			
			if (Game.Has('幸運 No.104')) add+=Game.cookiesPs*0.01;
			var mult=1;
			
			
			if (Game.Has('サンタのお手伝い')) mult*=1.1;
			if (Game.Has('クッキーの卵')) mult*=1.1;
			if (Game.Has('神々しい手袋')) mult*=1.1;
			if (Game.Has('ドラゴンの爪')) mult*=1.03;
			
			if (Game.Has('オーラグローブ'))
			{
				mult*=1+0.05*Math.min(Game.Objects['カーソル'].level,Game.Has('発光グローブ')?20:10);
			}
			
			mult*=Game.eff('click');
			
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('labor');
				if (godLvl==1) mult*=1.15;
				else if (godLvl==2) mult*=1.1;
				else if (godLvl==3) mult*=1.05;
			}
			
			for (var i in Game.buffs)
			{
				if (typeof Game.buffs[i].multClick != 'undefined') mult*=Game.buffs[i].multClick;
			}
			
			//if (Game.hasAura('Dragon Cursor')) mult*=1.05;
			mult*=1+Game.auraMult('ドラゴンカーソル')*0.05;
			
			var out=mult*Game.ComputeCps(1,Game.Has('強化人差し指')+Game.Has('手根管症候群防止クリーム')+Game.Has('二刀流'),add);
			
			out=Game.runModHookOnValue('cookiesPerClick',out);
			
			if (Game.hasBuff('呪われた指')) out=Game.buffs['呪われた指'].power;
			return out;
		}
		Game.computedMouseCps=1;
		Game.globalCpsMult=1;
		Game.unbuffedCps=0;
		Game.buildingCps=0;
		Game.lastClick=0;
		Game.CanClick=1;
		Game.autoclickerDetected=0;
		Game.BigCookieState=0;//0 = normal, 1 = clicked (small), 2 = released/hovered (big)
		Game.BigCookieSize=0;
		Game.BigCookieSizeD=0;
		Game.BigCookieSizeT=1;
		Game.cookieClickSound=Math.floor(Math.random()*7)+1;
		Game.playCookieClickSound=function()
		{
			if (Game.prefs.cookiesound) PlaySound('snd/clickb'+(Game.cookieClickSound)+'.mp3',0.5);
			else PlaySound('snd/click'+(Game.cookieClickSound)+'.mp3',0.5);
			Game.cookieClickSound+=Math.floor(Math.random()*4)+1;
			if (Game.cookieClickSound>7) Game.cookieClickSound-=7;
		}
		Game.ClickCookie=function(e,amount)
		{
			var now=Date.now();
			if (e) e.preventDefault();
			if (Game.OnAscend || Game.AscendTimer>0 || Game.T<3 || now-Game.lastClick<1000/250) {}
			else
			{
				if (now-Game.lastClick<1000/15)
				{
					Game.autoclickerDetected+=Game.fps;
					if (Game.autoclickerDetected>=Game.fps*5) Game.Win('奇怪なクリック');
				}
				Game.loseShimmeringVeil('click');
				var amount=amount?amount:Game.computedMouseCps;
				Game.Earn(amount);
				Game.handmadeCookies+=amount;
				if (Game.prefs.particles)
				{
					Game.particleAdd();
					Game.particleAdd(Game.mouseX,Game.mouseY,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.75,1,2);
				}
				if (Game.prefs.numbers) Game.particleAdd(Game.mouseX+Math.random()*8-4,Game.mouseY-8+Math.random()*8-4,0,-2,1,4,2,'','+'+Beautify(amount,1));
				
				Game.runModHook('click');
				
				Game.playCookieClickSound();
				Game.cookieClicks++;
			}
			Game.lastClick=now;
			Game.Click=0;
		}
		Game.mouseX=0;
		Game.mouseY=0;
		Game.mouseX2=0;
		Game.mouseY2=0;
		Game.mouseMoved=0;
		Game.GetMouseCoords=function(e)
		{
			var posx=0;
			var posy=0;
			if (!e) var e=window.event;
			if (e.pageX||e.pageY)
			{
				posx=e.pageX;
				posy=e.pageY;
			}
			else if (e.clientX || e.clientY)
			{
				posx=e.clientX+document.body.scrollLeft+document.documentElement.scrollLeft;
				posy=e.clientY+document.body.scrollTop+document.documentElement.scrollTop;
			}
			var x=0;
			var y=32;
			/*
			var el=l('sectionLeft');
			while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop))
			{
				x+=el.offsetLeft-el.scrollLeft;
				y+=el.offsetTop-el.scrollTop;
				el=el.offsetParent;
			}*/
			Game.mouseX2=Game.mouseX;
			Game.mouseY2=Game.mouseY;
			Game.mouseX=posx-x;
			Game.mouseY=posy-y;
			Game.mouseMoved=1;
			Game.lastActivity=Game.time;
		}
		var bigCookie=l('bigCookie');
		bigCookie.setAttribute('alt','Big clickable cookie');
		Game.Click=0;
		Game.lastClickedEl=0;
		Game.clickFrom=0;
		Game.Scroll=0;
		Game.mouseDown=0;
		if (!Game.touchEvents)
		{
			AddEvent(bigCookie,'click',Game.ClickCookie);
			AddEvent(bigCookie,'mousedown',function(event){Game.BigCookieState=1;if (Game.prefs.cookiesound) {Game.playCookieClickSound();}if (event) event.preventDefault();});
			AddEvent(bigCookie,'mouseup',function(event){Game.BigCookieState=2;if (event) event.preventDefault();});
			AddEvent(bigCookie,'mouseout',function(event){Game.BigCookieState=0;});
			AddEvent(bigCookie,'mouseover',function(event){Game.BigCookieState=2;});
			AddEvent(document,'mousemove',Game.GetMouseCoords);
			AddEvent(document,'mousedown',function(event){Game.lastActivity=Game.time;Game.mouseDown=1;Game.clickFrom=event.target;});
			AddEvent(document,'mouseup',function(event){Game.lastActivity=Game.time;Game.mouseDown=0;Game.clickFrom=0;});
			AddEvent(document,'click',function(event){Game.lastActivity=Game.time;Game.Click=1;Game.lastClickedEl=event.target;Game.clickFrom=0;});
			Game.handleScroll=function(e)
			{
				if (!e) e=event;
				Game.Scroll=(e.detail<0||e.wheelDelta>0)?1:-1;
				Game.lastActivity=Game.time;
			};
			AddEvent(document,'DOMMouseScroll',Game.handleScroll);
			AddEvent(document,'mousewheel',Game.handleScroll);
		}
		else
		{
			//touch events
			AddEvent(bigCookie,'touchend',Game.ClickCookie);
			AddEvent(bigCookie,'touchstart',function(event){Game.BigCookieState=1;if (event) event.preventDefault();});
			AddEvent(bigCookie,'touchend',function(event){Game.BigCookieState=0;if (event) event.preventDefault();});
			//AddEvent(document,'touchmove',Game.GetMouseCoords);
			AddEvent(document,'mousemove',Game.GetMouseCoords);
			AddEvent(document,'touchstart',function(event){Game.lastActivity=Game.time;Game.mouseDown=1;});
			AddEvent(document,'touchend',function(event){Game.lastActivity=Game.time;Game.mouseDown=0;});
			AddEvent(document,'touchend',function(event){Game.lastActivity=Game.time;Game.Click=1;});
		}
		
		Game.keys=[];
		AddEvent(window,'keyup',function(e){
			Game.lastActivity=Game.time;
			if (e.keyCode==27)
			{
				Game.ClosePrompt();
				if (Game.AscendTimer>0) Game.AscendTimer=Game.AscendDuration;
			}//esc closes prompt
			else if (e.keyCode==13) Game.ConfirmPrompt();//enter confirms prompt
			Game.keys[e.keyCode]=0;
		});
		AddEvent(window,'keydown',function(e){
			if (!Game.OnAscend && Game.AscendTimer==0)
			{
				if (e.ctrlKey && e.keyCode==83) {Game.toSave=true;e.preventDefault();}//ctrl-s saves the game
				else if (e.ctrlKey && e.keyCode==79) {Game.ImportSave();e.preventDefault();}//ctrl-o opens the import menu
			}
			if ((e.keyCode==16 || e.keyCode==17) && Game.tooltip.dynamic) Game.tooltip.update();
			Game.keys[e.keyCode]=1;
		});
		
		AddEvent(window,'visibilitychange',function(e){
			Game.keys=[];//reset all key pressed on visibility change (should help prevent ctrl still being down after ctrl-tab)
		});
		
		/*=====================================================================================
		CPS RECALCULATOR
		=======================================================================================*/
		
		Game.heavenlyPower=1;//how many CpS percents a single heavenly chip gives
		Game.recalculateGains=1;
		Game.cookiesPsByType={};
		Game.cookiesMultByType={};
		//display bars with http://codepen.io/anon/pen/waGyEJ
		Game.effs={};
		Game.eff=function(name,def){if (typeof Game.effs[name]==='undefined') return (typeof def==='undefined'?1:def); else return Game.effs[name];};
		
		Game.CalculateGains=function()
		{
			Game.cookiesPs=0;
			var mult=1;
			//add up effect bonuses from building minigames
			var effs={};
			for (var i in Game.Objects)
			{
				if (Game.Objects[i].minigameLoaded && Game.Objects[i].minigame.effs)
				{
					var myEffs=Game.Objects[i].minigame.effs;
					for (var ii in myEffs)
					{
						if (effs[ii]) effs[ii]*=myEffs[ii];
						else effs[ii]=myEffs[ii];
					}
				}
			}
			Game.effs=effs;
			
			if (Game.ascensionMode!=1) mult+=parseFloat(Game.prestige)*0.01*Game.heavenlyPower*Game.GetHeavenlyMultiplier();
			
			mult*=Game.eff('cps');
			
			if (Game.Has('紋章官') && Game.ascensionMode!=1) mult*=1+0.01*Game.heralds;
			
			for (var i in Game.cookieUpgrades)
			{
				var me=Game.cookieUpgrades[i];
				if (Game.Has(me.name))
				{
					mult*=(1+(typeof(me.power)==='function'?me.power(me):me.power)*0.01);
				}
			}
			
			if (Game.Has('特殊チョコレートチップ')) mult*=1.01;
			if (Game.Has('デザイナーココア豆')) mult*=1.02;
			if (Game.Has('地獄のオーブン')) mult*=1.03;
			if (Game.Has('エキゾチックナッツ')) mult*=1.04;
			if (Game.Has('難解なシュガー')) mult*=1.05;
			
			if (Game.Has('陽気さ増量')) mult*=1.15;
			if (Game.Has('うきうき気分増進')) mult*=1.15;
			if (Game.Has('石炭の塊')) mult*=1.01;
			if (Game.Has('むず痒いセーター')) mult*=1.01;
			if (Game.Has('サンタの支配')) mult*=1.2;
			
			if (Game.Has('幸運 No.100')) mult*=1.01;
			if (Game.Has('幸運 No.101')) mult*=1.07;
			
			if (Game.Has('ドラゴンの鱗')) mult*=1.03;
			
			var buildMult=1;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('asceticism');
				if (godLvl==1) mult*=1.15;
				else if (godLvl==2) mult*=1.1;
				else if (godLvl==3) mult*=1.05;
				
				var godLvl=Game.hasGod('ages');
				if (godLvl==1) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);
				else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);
				else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);
				
				var godLvl=Game.hasGod('decadence');
				if (godLvl==1) buildMult*=0.93;
				else if (godLvl==2) buildMult*=0.95;
				else if (godLvl==3) buildMult*=0.98;
				
				var godLvl=Game.hasGod('industry');
				if (godLvl==1) buildMult*=1.1;
				else if (godLvl==2) buildMult*=1.06;
				else if (godLvl==3) buildMult*=1.03;
				
				var godLvl=Game.hasGod('labor');
				if (godLvl==1) buildMult*=0.97;
				else if (godLvl==2) buildMult*=0.98;
				else if (godLvl==3) buildMult*=0.99;
			}
			
			if (Game.Has('サンタの遺物')) mult*=1+(Game.santaLevel+1)*0.03;
			
			
			Game.milkProgress=Game.AchievementsOwned/25;
			var milkMult=1;
			if (Game.Has('サンタの牛乳とクッキー')) milkMult*=1.05;
			//if (Game.hasAura('Breath of Milk')) milkMult*=1.05;
			milkMult*=1+Game.auraMult('ミルクブレス')*0.05;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('mother');
				if (godLvl==1) milkMult*=1.1;
				else if (godLvl==2) milkMult*=1.05;
				else if (godLvl==3) milkMult*=1.03;
			}
			milkMult*=Game.eff('milk');
			
			var catMult=1;
			
			if (Game.Has('お手伝い猫')) catMult*=(1+Game.milkProgress*0.1*milkMult);
			if (Game.Has('労働者猫')) catMult*=(1+Game.milkProgress*0.125*milkMult);
			if (Game.Has('技術者猫')) catMult*=(1+Game.milkProgress*0.15*milkMult);
			if (Game.Has('監督者猫')) catMult*=(1+Game.milkProgress*0.175*milkMult);
			if (Game.Has('管理者猫')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('会計士猫')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('専門家猫')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('熟練者猫')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('相談役猫')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('地区担当責任者補佐猫')) catMult*=(1+Game.milkProgress*0.175*milkMult);
			if (Game.Has('市場商猫')) catMult*=(1+Game.milkProgress*0.15*milkMult);
			if (Game.Has('分析者猫')) catMult*=(1+Game.milkProgress*0.125*milkMult);
			if (Game.Has('役員猫')) catMult*=(1+Game.milkProgress*0.115*milkMult);
			if (Game.Has('子猫の天使')) catMult*=(1+Game.milkProgress*0.1*milkMult);
			if (Game.Has('幸運 No.103')) catMult*=(1+Game.milkProgress*0.05*milkMult);
			
			Game.cookiesMultByType['kittens']=catMult;
			
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				me.storedCps=me.cps(me);
				if (Game.ascensionMode!=1) me.storedCps*=(1+me.level*0.01)*buildMult;
				if (me.id==1 && Game.Has('ミルクヘルプ&reg; 乳糖不耐症安心タブレット')) me.storedCps*=1+0.05*Game.milkProgress*milkMult;//this used to be "me.storedCps*=1+0.1*Math.pow(catMult-1,0.5)" which was. hmm
				me.storedTotalCps=me.amount*me.storedCps;
				Game.cookiesPs+=me.storedTotalCps;
				Game.cookiesPsByType[me.name]=me.storedTotalCps;
			}
			//cps from buildings only
			Game.buildingCps=Game.cookiesPs;
			
			if (Game.Has('"たまご"')) {Game.cookiesPs+=9;Game.cookiesPsByType['"たまご"']=9;}//"egg"
			
			mult*=catMult;
			
			var eggMult=1;
			if (Game.Has('ニワトリの卵')) eggMult*=1.01;
			if (Game.Has('アヒルの卵')) eggMult*=1.01;
			if (Game.Has('七面鳥の卵')) eggMult*=1.01;
			if (Game.Has('うずらの卵')) eggMult*=1.01;
			if (Game.Has('コマドリの卵')) eggMult*=1.01;
			if (Game.Has('ダチョウの卵')) eggMult*=1.01;
			if (Game.Has('火食い鳥の卵')) eggMult*=1.01;
			if (Game.Has('イクラ')) eggMult*=1.01;
			if (Game.Has('カエルの卵')) eggMult*=1.01;
			if (Game.Has('サメの卵')) eggMult*=1.01;
			if (Game.Has('ウミガメの卵')) eggMult*=1.01;
			if (Game.Has('アリの幼虫')) eggMult*=1.01;
			if (Game.Has('ピータン'))
			{
				//the boost increases a little every day, with diminishing returns up to +10% on the 100th day
				var day=Math.floor((Date.now()-Game.startDate)/1000/10)*10/60/60/24;
				day=Math.min(day,100);
				eggMult*=1+(1-Math.pow(1-day/100,3))*0.1;
			}
			
			Game.cookiesMultByType['eggs']=eggMult;
			mult*=eggMult;
			
			if (Game.Has('甘々ベーキング')) mult*=(1+Math.min(100,Game.lumps)*0.01);
			
			//if (Game.hasAura('Radiant Appetite')) mult*=2;
			mult*=1+Game.auraMult('光り輝くアパタイト');
			
			var rawCookiesPs=Game.cookiesPs*mult;
			for (var i in Game.CpsAchievements)
			{
				if (rawCookiesPs>=Game.CpsAchievements[i].threshold) Game.Win(Game.CpsAchievements[i].name);
			}
			Game.cookiesPsRaw=rawCookiesPs;
			Game.cookiesPsRawHighest=Math.max(Game.cookiesPsRawHighest,rawCookiesPs);
			
			var n=Game.shimmerTypes['golden'].n;
			var auraMult=Game.auraMult('ドラゴンの僥倖');
			for (var i=0;i<n;i++){mult*=1+auraMult*1.23;}
			
			name=Game.bakeryName.toLowerCase();
			if (name=='orteil') mult*=0.99;
			else if (name=='ortiel') mult*=0.98;//or so help me
			
			var sucking=0;
			for (var i in Game.wrinklers)
			{
				if (Game.wrinklers[i].phase==2)
				{
					sucking++;
				}
			}
			var suckRate=1/20;//each wrinkler eats a twentieth of your CpS
			suckRate*=Game.eff('wrinklerEat');
			
			Game.cpsSucked=sucking*suckRate;
			
			
			if (Game.Has('契約')) mult*=0.95;
			
			if (Game.Has('ゴールデンスイッチ[オフ]'))
			{
				var goldenSwitchMult=1.5;
				if (Game.Has('残された幸運'))
				{
					var upgrades=Game.goldenCookieUpgrades;
					for (var i in upgrades) {if (Game.Has(upgrades[i])) goldenSwitchMult+=0.1;}
				}
				mult*=goldenSwitchMult;
			}
			if (Game.Has('煌めくベール[オフ]'))
			{
				var veilMult=0.5;
				if (Game.Has('強化された薄膜')) veilMult+=0.1;
				mult*=1+veilMult;
			}
			if (Game.Has('魔法のイタズラ')) mult*=1000;
			if (Game.Has('原因不明の妨害')) mult*=0;
			
			
			Game.cookiesPs=Game.runModHookOnValue('cps',Game.cookiesPs);
			
			
			//cps without golden cookie effects
			Game.unbuffedCps=Game.cookiesPs*mult;
			
			for (var i in Game.buffs)
			{
				if (typeof Game.buffs[i].multCpS!=='undefined') mult*=Game.buffs[i].multCpS;
			}
			
			Game.globalCpsMult=mult;
			Game.cookiesPs*=Game.globalCpsMult;
			
			//if (Game.hasBuff('呪われた指')) Game.cookiesPs=0;
			
			Game.computedMouseCps=Game.mouseCps();
			
			Game.computeLumpTimes();
			
			Game.recalculateGains=0;
		}
		
		Game.dropRateMult=function()
		{
			var rate=1;
			if (Game.Has('緑色酵母のダイジェスティブビスケット')) rate*=1.03;
			if (Game.Has('ドラゴンのテディベア')) rate*=1.03;
			rate*=Game.eff('itemDrops');
			//if (Game.hasAura('Mind Over Matter')) rate*=1.25;
			rate*=1+Game.auraMult('肉体を超える精神')*0.25;
			if (Game.Has('サンタの四次元かばん')) rate*=1.1;
			if (Game.Has('宇宙レベルのビギナーズラック') && !Game.Has('ヘブンリーチップスの極意')) rate*=5;
			return rate;
		}
		/*=====================================================================================
		SHIMMERS (GOLDEN COOKIES & SUCH)
		=======================================================================================*/
		Game.shimmersL=l('shimmers');
		Game.shimmers=[];//all shimmers currently on the screen
		Game.shimmersN=Math.floor(Math.random()*10000);
		Game.shimmer=function(type,obj,noCount)
		{
			this.type=type;
			
			this.l=document.createElement('div');
			this.l.className='shimmer';
			if (!Game.touchEvents) {AddEvent(this.l,'click',function(what){return function(event){what.pop(event);};}(this));}
			else {AddEvent(this.l,'touchend',function(what){return function(event){what.pop(event);};}(this));}//touch events
			
			this.x=0;
			this.y=0;
			this.id=Game.shimmersN;
			
			this.forceObj=obj||0;
			this.noCount=noCount;
			if (!this.noCount) {Game.shimmerTypes[this.type].n++;Game.recalculateGains=1;}
			
			this.init();
			
			Game.shimmersL.appendChild(this.l);
			Game.shimmers.push(this);
			Game.shimmersN++;
		}
		Game.shimmer.prototype.init=function()//executed when the shimmer is created
		{
			Game.shimmerTypes[this.type].initFunc(this);
		}
		Game.shimmer.prototype.update=function()//executed every frame
		{
			Game.shimmerTypes[this.type].updateFunc(this);
		}
		Game.shimmer.prototype.pop=function(event)//executed when the shimmer is popped by the player
		{
			if (event) event.preventDefault();
			Game.loseShimmeringVeil('shimmer');
			Game.Click=0;
			Game.shimmerTypes[this.type].popFunc(this);
		}
		Game.shimmer.prototype.die=function()//executed after the shimmer disappears (from old age or popping)
		{
			if (Game.shimmerTypes[this.type].spawnsOnTimer && this.spawnLead)
			{
				//if this was the spawn lead for this shimmer type, set the shimmer type's "spawned" to 0 and restart its spawn timer
				var type=Game.shimmerTypes[this.type];
				type.time=0;
				type.spawned=0;
				type.minTime=type.getMinTime(this);
				type.maxTime=type.getMaxTime(this);
			}
			Game.shimmersL.removeChild(this.l);
			if (Game.shimmers.indexOf(this)!=-1) Game.shimmers.splice(Game.shimmers.indexOf(this),1);
			if (!this.noCount) {Game.shimmerTypes[this.type].n=Math.max(0,Game.shimmerTypes[this.type].n-1);Game.recalculateGains=1;}
		}
		
		
		Game.updateShimmers=function()//run shimmer functions, kill overtimed shimmers and spawn new ones
		{
			for (var i in Game.shimmers)
			{
				Game.shimmers[i].update();
			}
			
			//cookie storm!
			if (Game.hasBuff('吹けよ風、呼べよクッキー') && Math.random()<0.5)
			{
				var newShimmer=new Game.shimmer('golden',0,1);
				newShimmer.dur=Math.ceil(Math.random()*4+1);
				newShimmer.life=Math.ceil(Game.fps*newShimmer.dur);
				newShimmer.force='cookie storm drop';
				newShimmer.sizeMult=Math.random()*0.75+0.25;
			}
			
			//spawn shimmers
			for (var i in Game.shimmerTypes)
			{
				var me=Game.shimmerTypes[i];
				if (me.spawnsOnTimer && me.spawnConditions())//only run on shimmer types that work on a timer
				{
					if (!me.spawned)//no shimmer spawned for this type? check the timer and try to spawn one
					{
						me.time++;
						if (Math.random()<Math.pow(Math.max(0,(me.time-me.minTime)/(me.maxTime-me.minTime)),5))
						{
							var newShimmer=new Game.shimmer(i);
							newShimmer.spawnLead=1;
							if (Game.Has('運気倍増の蒸溜エキス') && Math.random()<0.01) var newShimmer=new Game.shimmer(i);
							me.spawned=1;
						}
					}
				}
			}
		}
		Game.killShimmers=function()//stop and delete all shimmers (used on resetting etc)
		{
			for (var i=Game.shimmers.length-1;i>=0;i--)
			{
				Game.shimmers[i].die();
			}
			for (var i in Game.shimmerTypes)
			{
				var me=Game.shimmerTypes[i];
				if (me.reset) me.reset();
				me.n=0;
				if (me.spawnsOnTimer)
				{
					me.time=0;
					me.spawned=0;
					me.minTime=me.getMinTime(me);
					me.maxTime=me.getMaxTime(me);
				}
			}
		}
		
		Game.shimmerTypes={
			//in these, "me" refers to the shimmer itself, and "this" to the shimmer's type object
			'golden':{
				reset:function()
				{
					this.chain=0;
					this.totalFromChain=0;
					this.last='';
				},
				initFunc:function(me)
				{
					if (!this.spawned && Game.chimeType==1 && Game.ascensionMode!=1) PlaySound('snd/chime.mp3');
					
					//set image
					var bgPic='img/goldCookie.png';
					var picX=0;var picY=0;
					
					
					if ((!me.forceObj || !me.forceObj.noWrath) && ((me.forceObj && me.forceObj.wrath) || (Game.elderWrath==1 && Math.random()<1/3) || (Game.elderWrath==2 && Math.random()<2/3) || (Game.elderWrath==3) || (Game.hasGod && Game.hasGod('scorn'))))
					{
						me.wrath=1;
						if (Game.season=='halloween') bgPic='img/spookyCookie.png';
						else bgPic='img/wrathCookie.png';
					}
					else
					{
						me.wrath=0;
					}
					
					if (Game.season=='valentines')
					{
						bgPic='img/hearts.png';
						picX=Math.floor(Math.random()*8);
					}
					else if (Game.season=='fools')
					{
						bgPic='img/contract.png';
						if (me.wrath) bgPic='img/wrathContract.png';
					}
					else if (Game.season=='easter')
					{
						bgPic='img/bunnies.png';
						picX=Math.floor(Math.random()*4);
						picY=0;
						if (me.wrath) picY=1;
					}
					
					me.x=Math.floor(Math.random()*Math.max(0,(Game.bounds.right-300)-Game.bounds.left-128)+Game.bounds.left+64)-64;
					me.y=Math.floor(Math.random()*Math.max(0,Game.bounds.bottom-Game.bounds.top-128)+Game.bounds.top+64)-64;
					me.l.style.left=me.x+'px';
					me.l.style.top=me.y+'px';
					me.l.style.width='96px';
					me.l.style.height='96px';
					me.l.style.backgroundImage='url('+bgPic+')';
					me.l.style.backgroundPosition=(-picX*96)+'px '+(-picY*96)+'px';
					me.l.style.opacity='0';
					me.l.style.display='block';
					me.l.setAttribute('alt',me.wrath?'Wrath cookie':'金のクッキー');
					
					me.life=1;//the cookie's current progression through its lifespan (in frames)
					me.dur=13;//duration; the cookie's lifespan in seconds before it despawns
					
					var dur=13;
					if (Game.Has('吉日')) dur*=2;
					if (Game.Has('発見能力')) dur*=2;
					if (Game.Has('逃れられぬ運命')) dur*=1.05;
					if (Game.Has('ラッキーな桁')) dur*=1.01;
					if (Game.Has('ラッキーナンバー')) dur*=1.01;
					if (Game.Has('ラッキーな支払い')) dur*=1.01;
					if (!me.wrath) dur*=Game.eff('goldenCookieDur');
					else dur*=Game.eff('wrathCookieDur');
					dur*=Math.pow(0.95,Game.shimmerTypes['golden'].n-1);//5% shorter for every other golden cookie on the screen
					if (this.chain>0) dur=Math.max(2,10/this.chain);//this is hilarious
					me.dur=dur;
					me.life=Math.ceil(Game.fps*me.dur);
					me.force='';
					me.sizeMult=1;
				},
				updateFunc:function(me)
				{
					var curve=1-Math.pow((me.life/(Game.fps*me.dur))*2-1,4);
					me.l.style.opacity=curve;
					//this line makes each golden cookie pulse in a unique way
					if (Game.prefs.fancy) me.l.style.transform='rotate('+(Math.sin(me.id*0.69)*24+Math.sin(Game.T*(0.35+Math.sin(me.id*0.97)*0.15)+me.id/*+Math.sin(Game.T*0.07)*2+2*/)*(3+Math.sin(me.id*0.36)*2))+'deg) scale('+(me.sizeMult*(1+Math.sin(me.id*0.53)*0.2)*curve*(1+(0.06+Math.sin(me.id*0.41)*0.05)*(Math.sin(Game.T*(0.25+Math.sin(me.id*0.73)*0.15)+me.id))))+')';
					me.life--;
					if (me.life<=0) {this.missFunc(me);me.die();}
				},
				popFunc:function(me)
				{
					//get achievs and stats
					if (me.spawnLead)
					{
						Game.goldenClicks++;
						Game.goldenClicksLocal++;
						
						if (Game.goldenClicks>=1) Game.Win('金のクッキー');
						if (Game.goldenClicks>=7) Game.Win('ラッキークッキー');
						if (Game.goldenClicks>=27) Game.Win('ラッキーの嵐');
						if (Game.goldenClicks>=77) Game.Win('運命の女神');
						if (Game.goldenClicks>=777) Game.Win('レプラコーン');
						if (Game.goldenClicks>=7777) Game.Win('黒猫の足');
						if (Game.goldenClicks>=27777) Game.Win('7つの蹄鉄');
						
						if (Game.goldenClicks>=7) Game.Unlock('吉日');
						if (Game.goldenClicks>=27) Game.Unlock('発見能力');
						if (Game.goldenClicks>=77) Game.Unlock('うまくいったぜ');
						
						if ((me.life/Game.fps)>(me.dur-1)) Game.Win('一番乗り');
						if (me.life<Game.fps) Game.Win('薄れゆく幸運');
					}
					
					if (Game.forceUnslotGod)
					{
						if (Game.forceUnslotGod('asceticism')) Game.useSwap(1000000);
					}
					
					//select an effect
					var list=[];
					if (me.wrath>0) list.push('clot','multiply cookies','ruin cookies');
					else list.push('frenzy','multiply cookies');
					if (me.wrath>0 && Game.hasGod && Game.hasGod('scorn')) list.push('clot','ruin cookies','clot','ruin cookies');
					if (me.wrath>0 && Math.random()<0.3) list.push('blood frenzy','chain cookie','cookie storm');
					else if (Math.random()<0.03 && Game.cookiesEarned>=100000) list.push('chain cookie','cookie storm');
					if (Math.random()<0.05 && Game.season=='fools') list.push('everything must go');
					if (Math.random()<0.1 && (Math.random()<0.05 || !Game.hasBuff('翔べよドラゴン'))) list.push('click frenzy');
					if (me.wrath && Math.random()<0.1) list.push('cursed finger');
					
					if (Game.BuildingsOwned>=10 && Math.random()<0.25) list.push('building special');
					
					if (Game.canLumps() && Math.random()<0.0005) list.push('free sugar lump');
					
					if ((me.wrath==0 && Math.random()<0.15) || Math.random()<0.05)
					{
						//if (Game.hasAura('Reaper of Fields')) list.push('dragon harvest');
						if (Math.random()<Game.auraMult('刈り取る者')) list.push('dragon harvest');
						//if (Game.hasAura('翔べよドラゴン')) list.push('dragonflight');
						if (Math.random()<Game.auraMult('ドラゴン便')) list.push('dragonflight');
					}
					
					if (this.last!='' && Math.random()<0.8 && list.indexOf(this.last)!=-1) list.splice(list.indexOf(this.last),1);//80% chance to force a different one
					if (Math.random()<0.0001) list.push('blab');
					var choice=choose(list);
					
					if (this.chain>0) choice='chain cookie';
					if (me.force!='') {this.chain=0;choice=me.force;me.force='';}
					if (choice!='chain cookie') this.chain=0;
					
					this.last=choice;
					
					//create buff for effect
					//buff duration multiplier
					var effectDurMod=1;
					if (Game.Has('うまくいったぜ')) effectDurMod*=2;
					if (Game.Has('安定した運勢')) effectDurMod*=1.1;
					if (Game.Has('ラッキーな桁')) effectDurMod*=1.01;
					if (Game.Has('ラッキーナンバー')) effectDurMod*=1.01;
					if (Game.Has('緑色酵母のダイジェスティブビスケット')) effectDurMod*=1.01;
					if (Game.Has('ラッキーな支払い')) effectDurMod*=1.01;
					//if (Game.hasAura('Epoch Manipulator')) effectDurMod*=1.05;
					effectDurMod*=1+Game.auraMult('時代改竄')*0.05;
					if (!me.wrath) effectDurMod*=Game.eff('goldenCookieEffDur');
					else effectDurMod*=Game.eff('wrathCookieEffDur');
					
					if (Game.hasGod)
					{
						var godLvl=Game.hasGod('decadence');
						if (godLvl==1) effectDurMod*=1.07;
						else if (godLvl==2) effectDurMod*=1.05;
						else if (godLvl==3) effectDurMod*=1.02;
					}
					
					//effect multiplier (from lucky etc)
					var mult=1;
					//if (me.wrath>0 && Game.hasAura('Unholy Dominion')) mult*=1.1;
					//else if (me.wrath==0 && Game.hasAura('Ancestral Metamorphosis')) mult*=1.1;
					if (me.wrath>0) mult*=1+Game.auraMult('邪な主管者')*0.1;
					else if (me.wrath==0) mult*=1+Game.auraMult('先祖返り')*0.1;
					if (Game.Has('緑色酵母のダイジェスティブビスケット')) mult*=1.01;
					if (Game.Has('ドラゴンの牙')) mult*=1.03;
					if (!me.wrath) mult*=Game.eff('goldenCookieGain');
					else mult*=Game.eff('wrathCookieGain');
					
					var popup='';
					var buff=0;
					
					if (choice=='building special')
					{
						var time=Math.ceil(30*effectDurMod);
						var list=[];
						for (var i in Game.Objects)
						{
							if (Game.Objects[i].amount>=10) list.push(Game.Objects[i].id);
						}
						if (list.length==0) {choice='frenzy';}//default to frenzy if no proper building
						else
						{
							var obj=choose(list);
							var pow=Game.ObjectsById[obj].amount/10+1;
							if (me.wrath && Math.random()<0.3)
							{
								buff=Game.gainBuff('building debuff',time,pow,obj);
							}
							else
							{
								buff=Game.gainBuff('building buff',time,pow,obj);
							}
						}
					}
					
					if (choice=='free sugar lump')
					{
						Game.gainLumps(1);
						popup='あっまーーい!<div style="font-size:65%;">角砂糖を1個見つけた!</div>';
					}
					else if (choice=='frenzy')
					{
						buff=Game.gainBuff('frenzy',Math.ceil(77*effectDurMod),7);
					}
					else if (choice=='dragon harvest')
					{
						buff=Game.gainBuff('dragon harvest',Math.ceil(60*effectDurMod),15);
					}
					else if (choice=='everything must go')
					{
						buff=Game.gainBuff('everything must go',Math.ceil(8*effectDurMod),5);
					}
					else if (choice=='multiply cookies')
					{
						var moni=mult*Math.min(Game.cookies*0.15,Game.cookiesPs*60*15)+13;//add 15% to cookies owned (+13), or 15 minutes of cookie production - whichever is lowest
						Game.Earn(moni);
						popup='ツイてる!<div style="font-size:65%;">+'+Beautify(moni)+'クッキー!</div>';
					}
					else if (choice=='ruin cookies')
					{
						var moni=Math.min(Game.cookies*0.05,Game.cookiesPs*60*10)+13;//lose 5% of cookies owned (-13), or 10 minutes of cookie production - whichever is lowest
						moni=Math.min(Game.cookies,moni);
						Game.Spend(moni);
						popup='台無し!<div style="font-size:65%;">'+Beautify(moni)+'クッキー失った!</div>';
					}
					else if (choice=='blood frenzy')
					{
						buff=Game.gainBuff('blood frenzy',Math.ceil(6*effectDurMod),666);
					}
					else if (choice=='clot')
					{
						buff=Game.gainBuff('clot',Math.ceil(66*effectDurMod),0.5);
					}
					else if (choice=='cursed finger')
					{
						buff=Game.gainBuff('cursed finger',Math.ceil(10*effectDurMod),Game.cookiesPs*Math.ceil(10*effectDurMod));
					}
					else if (choice=='click frenzy')
					{
						buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777);
					}
					else if (choice=='dragonflight')
					{
						buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111);
						if (Math.random()<0.8) Game.killBuff('クリックフィーバー');
					}
					else if (choice=='chain cookie')
					{
						//fix by Icehawk78
						if (this.chain==0) this.totalFromChain=0;
						this.chain++;
						var digit=me.wrath?6:7;
						if (this.chain==1) this.chain+=Math.max(0,Math.ceil(Math.log(Game.cookies)/Math.LN10)-10);
						
						var maxPayout=Math.min(Game.cookiesPs*60*60*6,Game.cookies*0.5)*mult;
						var moni=Math.max(digit,Math.min(Math.floor(1/9*Math.pow(10,this.chain)*digit*mult),maxPayout));
						var nextMoni=Math.max(digit,Math.min(Math.floor(1/9*Math.pow(10,this.chain+1)*digit*mult),maxPayout));
						this.totalFromChain+=moni;
						var moniStr=Beautify(moni);

						//break the chain if we're above 5 digits AND it's more than 50% of our bank, it grants more than 6 hours of our CpS, or just a 1% chance each digit (update : removed digit limit)
						if (Math.random()<0.01 || nextMoni>=maxPayout)
						{
							this.chain=0;
							popup='つながれクッキー<div style="font-size:65%;">+'+moniStr+'クッキー!<br>つながれクッキーが終了した。 '+Beautify(this.totalFromChain)+'クッキー作った。</div>';
						}
						else
						{
							popup='つながれクッキー<div style="font-size:65%;">+'+moniStr+'クッキー!</div>';//
						}
						Game.Earn(moni);
					}
					else if (choice=='cookie storm')
					{
						buff=Game.gainBuff('cookie storm',Math.ceil(7*effectDurMod),7);
					}
					else if (choice=='cookie storm drop')
					{
						var moni=Math.max(mult*(Game.cookiesPs*60*Math.floor(Math.random()*7+1)),Math.floor(Math.random()*7+1));//either 1-7 cookies or 1-7 minutes of cookie production, whichever is highest
						Game.Earn(moni);
						popup='<div style="font-size:75%;">+'+Beautify(moni)+'クッキー!</div>';
					}
					else if (choice=='blab')//sorry (it's really rare)
					{
						var str=choose([
						'60 秒間クッキーのサクサク感が 3 倍に!',
						'77 秒間チョコレートらしさが 7 倍に!',
						'66 秒間生地の固さが半分に!',
						'3 秒間ゴールデンクッキーの輝きが 2 倍に!',
						'30 秒間世界の景気が半分に!',
						'45 秒間おばあちゃんからのキスが 23 ％減!',
						'クリックありがとう!',
						'引っかかったな!これはテストさ',
						'ゴールデンクッキーのクリック数+1!',
						'クリック登録が完了しました。ご協力ありがとうございます。',
						'ありがとう!いいとこ突くね!',
						'ありがとう。チームを派遣した。',
						'奴らは知っている。',
						'なんだ。光ってると思ったら、アルミホイルで包まれたチョコクッキーじゃん。'
						]);
						popup=str;
					}
					
					if (popup=='' && buff && buff.name && buff.desc) popup=buff.name+'<div style="font-size:65%;">'+buff.desc+'</div>';
					if (popup!='') Game.Popup(popup,me.x+me.l.offsetWidth/2,me.y);
					
					Game.DropEgg(0.9);
					
					//sparkle and kill the shimmer
					Game.SparkleAt(me.x+48,me.y+48);
					if (choice=='cookie storm drop')
					{
						if (Game.prefs.cookiesound) PlaySound('snd/clickb'+Math.floor(Math.random()*7+1)+'.mp3',0.75);
						else PlaySound('snd/click'+Math.floor(Math.random()*7+1)+'.mp3',0.75);
					}
					else PlaySound('snd/shimmerClick.mp3');
					me.die();
				},
				missFunc:function(me)
				{
					if (this.chain>0 && this.totalFromChain>0)
					{
						Game.Popup('つながれクッキー が終了した。<div style="font-size:65%;">'+Beautify(this.totalFromChain)+'クッキー作った。</div>',me.x+me.l.offsetWidth/2,me.y);
						this.chain=0;this.totalFromChain=0;
					}
					if (me.spawnLead) Game.missedGoldenClicks++;
				},
				spawnsOnTimer:true,
				spawnConditions:function()
				{
					if (!Game.Has('ゴールデンスイッチ[オフ]')) return true; else return false;
				},
				spawned:0,
				time:0,
				minTime:0,
				maxTime:0,
				getTimeMod:function(me,m)
				{
					if (Game.Has('吉日')) m/=2;
					if (Game.Has('発見能力')) m/=2;
					if (Game.Has('金のガチョウの卵')) m*=0.95;
					if (Game.Has('素晴らしき幸運')) m*=0.95;
					if (Game.Has('緑色酵母のダイジェスティブビスケット')) m*=0.99;
					//if (Game.hasAura('Arcane Aura')) m*=0.95;
					m*=1-Game.auraMult('難解至極のオーラ')*0.05;
					if (Game.hasBuff('砂糖の祝福')) m*=0.9;
					if (Game.season=='easter' && Game.Has('スタースポーン')) m*=0.98;
					else if (Game.season=='halloween' && Game.Has('スターテラー')) m*=0.98;
					else if (Game.season=='valentines' && Game.Has('スターラブ')) m*=0.98;
					else if (Game.season=='fools' && Game.Has('スタートレード')) m*=0.95;
					if (!me.wrath) m*=1/Game.eff('goldenCookieFreq');
					else m*=1/Game.eff('wrathCookieFreq');
					if (Game.hasGod)
					{
						var godLvl=Game.hasGod('industry');
						if (godLvl==1) m*=1.1;
						else if (godLvl==2) m*=1.06;
						else if (godLvl==3) m*=1.03;
						var godLvl=Game.hasGod('mother');
						if (godLvl==1) m*=1.15;
						else if (godLvl==2) m*=1.1;
						else if (godLvl==3) m*=1.05;
						
						if (Game.season!='')
						{
							var godLvl=Game.hasGod('seasons');
							if (Game.season!='fools')
							{
								if (godLvl==1) m*=0.97;
								else if (godLvl==2) m*=0.98;
								else if (godLvl==3) m*=0.99;
							}
							else
							{
								if (godLvl==1) m*=0.955;
								else if (godLvl==2) m*=0.97;
								else if (godLvl==3) m*=0.985;
							}
						}
					}
					if (this.chain>0) m=0.05;
					if (Game.Has('埋蔵金')) m=0.01;
					return Math.ceil(Game.fps*60*m);
				},
				getMinTime:function(me)
				{
					var m=5;
					return this.getTimeMod(me,m);
				},
				getMaxTime:function(me)
				{
					var m=15;
					return this.getTimeMod(me,m);
				},
				last:'',
			},
			'reindeer':{
				reset:function()
				{
				},
				initFunc:function(me)
				{
					if (!this.spawned && Game.chimeType==1 && Game.ascensionMode!=1) PlaySound('snd/jingle.mp3');
					
					me.x=-128;
					me.y=Math.floor(Math.random()*Math.max(0,Game.bounds.bottom-Game.bounds.top-256)+Game.bounds.top+128)-128;
					//me.l.style.left=me.x+'px';
					//me.l.style.top=me.y+'px';
					me.l.style.width='167px';
					me.l.style.height='212px';
					me.l.style.backgroundImage='url(img/frostedReindeer.png)';
					me.l.style.opacity='0';
					//me.l.style.transform='rotate('+(Math.random()*60-30)+'deg) scale('+(Math.random()*1+0.25)+')';
					me.l.style.display='block';
					me.l.setAttribute('alt','Reindeer');
					
					me.life=1;//the reindeer's current progression through its lifespan (in frames)
					me.dur=4;//duration; the cookie's lifespan in seconds before it despawns
					
					var dur=4;
					if (Game.Has('重いソリ')) dur*=2;
					dur*=Game.eff('reindeerDur');
					me.dur=dur;
					me.life=Math.ceil(Game.fps*me.dur);
					me.sizeMult=1;
				},
				updateFunc:function(me)
				{
					var curve=1-Math.pow((me.life/(Game.fps*me.dur))*2-1,12);
					me.l.style.opacity=curve;
					me.l.style.transform='translate('+(me.x+(Game.bounds.right-Game.bounds.left)*(1-me.life/(Game.fps*me.dur)))+'px,'+(me.y-Math.abs(Math.sin(me.life*0.1))*128)+'px) rotate('+(Math.sin(me.life*0.2+0.3)*10)+'deg) scale('+(me.sizeMult*(1+Math.sin(me.id*0.53)*0.1))+')';
					me.life--;
					if (me.life<=0) {this.missFunc(me);me.die();}
				},
				popFunc:function(me)
				{
					//get achievs and stats
					if (me.spawnLead)
					{
						Game.reindeerClicked++;
					}
					
					var val=Game.cookiesPs*60;
					if (Game.hasBuff('荒ぶるおばあちゃん')) val*=0.5;//very sorry
					if (Game.hasBuff('フィーバー')) val*=0.75;//I sincerely apologize
					var moni=Math.max(25,val);//1 minute of cookie production, or 25 cookies - whichever is highest
					if (Game.Has('笑い声風味の砂糖衣')) moni*=2;
					moni*=Game.eff('reindeerGain');
					Game.Earn(moni);
					if (Game.hasBuff('荒ぶるおばあちゃん')) Game.Win('古鹿のババンビ');
					
					var cookie='';
					var failRate=0.8;
					if (Game.HasAchiev('雪やこんこん')) failRate=0.6;
					failRate*=1/Game.dropRateMult();
					if (Game.Has('スタースノウ')) failRate*=0.95;
					if (Game.hasGod)
					{
						var godLvl=Game.hasGod('seasons');
						if (godLvl==1) failRate*=0.9;
						else if (godLvl==2) failRate*=0.95;
						else if (godLvl==3) failRate*=0.97;
					}
					if (Math.random()>failRate)//christmas cookie drops
					{
						cookie=choose(['クリスマスツリービスケット','雪の結晶ビスケット','雪だるまビスケット','ヒイラギビスケット','キャンディケインビスケット','鐘ビスケット','プレゼント箱ビスケット']);
						if (!Game.HasUnlocked(cookie) && !Game.Has(cookie))
						{
							Game.Unlock(cookie);
						}
						else cookie='';
					}
					
					var popup='';
					
					if (Game.prefs.popups) Game.Popup(''+choose(['『ダッシャー』','『ダンサー』','『プランサー』','『ヴィクセン』','『コメット』','『キューピッド』','『ドナー』','『ブリッツェン』','『ルドルフ』'])+'を見つけました!<br>トナカイが'+Beautify(moni)+'クッキーくれました。'+(cookie==''?'':'<br>'+cookie+'も貰いました!'));
					else Game.Notify(''+choose(['『ダッシャー』','『ダンサー』','『プランサー』','『ヴィクセン』','『コメット』','『キューピッド』','『ドナー』','『ブリッツェン』','『ルドルフ』'])+'を見つけました!','トナカイが'+Beautify(moni)+'クッキーくれました。'+(cookie==''?'':'<br>'+cookie+'も貰いました!'),[12,9],6);
					popup='<div style="font-size:80%;">+'+Beautify(moni)+'クッキー!</div>';
					
					if (popup!='') Game.Popup(popup,Game.mouseX,Game.mouseY);
					
					//sparkle and kill the shimmer
					Game.SparkleAt(Game.mouseX,Game.mouseY);
					PlaySound('snd/jingleClick.mp3');
					me.die();
				},
				missFunc:function(me)
				{
				},
				spawnsOnTimer:true,
				spawnConditions:function()
				{
					if (Game.season=='christmas') return true; else return false;
				},
				spawned:0,
				time:0,
				minTime:0,
				maxTime:0,
				getTimeMod:function(me,m)
				{
					if (Game.Has('地を焼くトナカイ')) m/=2;
					if (Game.Has('スタースノウ')) m*=0.95;
					if (Game.hasGod)
					{
						var godLvl=Game.hasGod('seasons');
						if (godLvl==1) m*=0.9;
						else if (godLvl==2) m*=0.95;
						else if (godLvl==3) m*=0.97;
					}
					m*=1/Game.eff('reindeerFreq');
					if (Game.Has('トナカイの季節')) m=0.01;
					return Math.ceil(Game.fps*60*m);
				},
				getMinTime:function(me)
				{
					var m=3;
					return this.getTimeMod(me,m);
				},
				getMaxTime:function(me)
				{
					var m=6;
					return this.getTimeMod(me,m);
				},
			}
		};
		
		Game.goldenCookieChoices=[
			"フィーバー","frenzy",
			"ツイてる","multiply cookies",
			"台無し","ruin cookies",
			"荒ぶるおばあちゃん","blood frenzy",
			"渋滞発生","clot",
			"クリックフィーバー","click frenzy",
			"呪われた指","cursed finger",
			"つながれクッキー","chain cookie",
			"吹けよ風、呼べよクッキー","cookie storm",
			"施設特殊効果","building special",
			"刈れよドラゴン","dragon harvest",
			"翔べよドラゴン","dragonflight",
			"あっまーーい","free sugar lump",
			"おしゃべり","blab"
		];
		Game.goldenCookieBuildingBuffs={
			'カーソル':['ハイタッチ','ビンタ'],
			'グランマ':['楽しき集い','老人ぼけ'],
			'農場':['大豊作','イナゴの大群'],
			'鉱山':['新たな鉱脈','落盤事故'],
			'工場':['注油完了','設備故障'],
			'銀行':['大儲け','不景気'],
			'神殿':['神様愛してる!','神は死んだ!'],
			'魔法使いの塔':['マナの花咲いた','マナイーター'],
			'宇宙船':['美味しい食用生命体','ブラックホール'],
			'錬金術室':['世界を動かす大発見','実験室大破'],
			'ポータル':['正義の大勝利','異次元の惨禍'],
			'タイムマシン':['黄金時代','時空の淀み'],
			'反物質凝縮器':['追加稼働','予測通りの事故'],
			'プリズム':['太陽フレア','日蝕'],
			'チャンスメーカー':['連勝の波','ドロ沼連敗'],
			'自己無限生成エンジン':['大宇宙','小宇宙'],
			'Javascriptコンソール':['リファクタリング','アンチパターン'],
			'遊休宇宙':['宇宙養殖所','ビッグクランチ'],
		};
		
		/*=====================================================================================
		PARTICLES
		=======================================================================================*/
		//generic particles (falling cookies etc)
		//only displayed on left section
		Game.particles=[];
		Game.particlesN=50;
		for (var i=0;i<Game.particlesN;i++)
		{
			Game.particles[i]={x:0,y:0,xd:0,yd:0,w:64,h:64,z:0,size:1,dur:2,life:-1,r:0,pic:'smallCookies.png',picId:0,picPos:[0,0]};
		}
		
		Game.particlesUpdate=function()
		{
			for (var i=0;i<Game.particlesN;i++)
			{
				var me=Game.particles[i];
				if (me.life!=-1)
				{
					if (!me.text) me.yd+=0.2+Math.random()*0.1;
					me.x+=me.xd;
					me.y+=me.yd;
					//me.y+=me.life*0.25+Math.random()*0.25;
					me.life++;
					if (me.life>=Game.fps*me.dur)
					{
						me.life=-1;
					}
				}
			}
		}
		Game.particleAdd=function(x,y,xd,yd,size,dur,z,pic,text)
		{
			//Game.particleAdd(pos X,pos Y,speed X,speed Y,size (multiplier),duration (seconds),layer,picture,text);
			//pick the first free (or the oldest) particle to replace it
			if (1 || Game.prefs.particles)
			{
				var highest=0;
				var highestI=0;
				for (var i=0;i<Game.particlesN;i++)
				{
					if (Game.particles[i].life==-1) {highestI=i;break;}
					if (Game.particles[i].life>highest)
					{
						highest=Game.particles[i].life;
						highestI=i;
					}
				}
				var auto=0;
				if (x) auto=1;
				var i=highestI;
				var x=x||-64;
				if (Game.LeftBackground && !auto) x=Math.floor(Math.random()*Game.LeftBackground.canvas.width);
				var y=y||-64;
				var me=Game.particles[i];
				me.life=0;
				me.x=x;
				me.y=y;
				me.xd=xd||0;
				me.yd=yd||0;
				me.size=size||1;
				me.z=z||0;
				me.dur=dur||2;
				me.r=Math.floor(Math.random()*360);
				me.picId=Math.floor(Math.random()*10000);
				if (!pic)
				{
					if (Game.season=='fools') pic='smallDollars.png';
					else
					{
						var cookies=[[10,0]];
						for (var i in Game.Upgrades)
						{
							var cookie=Game.Upgrades[i];
							if (cookie.bought>0 && cookie.pool=='cookie') cookies.push(cookie.icon);
						}
						me.picPos=choose(cookies);
						if (Game.bakeryName.toLowerCase()=='ortiel' || Math.random()<1/10000) me.picPos=[17,5];
						pic='icons.png';
					}
				}
				else if (pic!=='string'){me.picPos=pic;pic='icons.png';}
				me.pic=pic||'smallCookies.png';
				me.text=text||0;
				return me;
			}
			return {};
		}
		Game.particlesDraw=function(z)
		{
			var ctx=Game.LeftBackground;
			ctx.fillStyle='#fff';
			ctx.font='20px Merriweather';
			ctx.textAlign='center';
			
			for (var i=0;i<Game.particlesN;i++)
			{
				var me=Game.particles[i];
				if (me.z==z)
				{
					if (me.life!=-1)
					{
						var opacity=1-(me.life/(Game.fps*me.dur));
						ctx.globalAlpha=opacity;
						if (me.text)
						{
							ctx.fillText(me.text,me.x,me.y);
						}
						else
						{
							ctx.save();
							ctx.translate(me.x,me.y);
							ctx.rotate((me.r/360)*Math.PI*2);
							var w=64;
							var h=64;
							if (me.pic=='icons.png')
							{
								w=48;
								h=48;
								ctx.drawImage(Pic(me.pic),me.picPos[0]*w,me.picPos[1]*h,w,h,-w/2*me.size,-h/2*me.size,w*me.size,h*me.size);
							}
							else
							{
								if (me.pic=='wrinklerBits.png' || me.pic=='shinyWrinklerBits.png') {w=100;h=200;}
								ctx.drawImage(Pic(me.pic),(me.picId%8)*w,0,w,h,-w/2*me.size,-h/2*me.size,w*me.size,h*me.size);
							}
							ctx.restore();
						}
					}
				}
			}
		}
		
		//text particles (popups etc)
		Game.textParticles=[];
		Game.textParticlesY=0;
		var str='';
		for (var i=0;i<20;i++)
		{
			Game.textParticles[i]={x:0,y:0,life:-1,text:''};
			str+='<div id="particle'+i+'" class="particle title"></div>';
		}
		l('particles').innerHTML=str;
		Game.textParticlesUpdate=function()
		{
			for (var i in Game.textParticles)
			{
				var me=Game.textParticles[i];
				if (me.life!=-1)
				{
					me.life++;
					if (me.life>=Game.fps*4)
					{
						var el=me.l;
						me.life=-1;
						el.style.opacity=0;
						el.style.display='none';
					}
				}
			}
		}
		Game.textParticlesAdd=function(text,el,posX,posY)
		{
			//pick the first free (or the oldest) particle to replace it
			var highest=0;
			var highestI=0;
			for (var i in Game.textParticles)
			{
				if (Game.textParticles[i].life==-1) {highestI=i;break;}
				if (Game.textParticles[i].life>highest)
				{
					highest=Game.textParticles[i].life;
					highestI=i;
				}
			}
			var i=highestI;
			var noStack=0;
			if (typeof posX!=='undefined' && typeof posY!=='undefined')
			{
				x=posX;
				y=posY;
				noStack=1;
			}
			else
			{
				var x=(Math.random()-0.5)*40;
				var y=0;//+(Math.random()-0.5)*40;
				if (!el)
				{
					var rect=Game.bounds;
					var x=Math.floor((rect.left+rect.right)/2);
					var y=Math.floor((rect.bottom))-(Game.mobile*64);
					x+=(Math.random()-0.5)*40;
					y+=0;//(Math.random()-0.5)*40;
				}
			}
			if (!noStack) y-=Game.textParticlesY;
			
			x=Math.max(Game.bounds.left+200,x);
			x=Math.min(Game.bounds.right-200,x);
			y=Math.max(Game.bounds.top+32,y);
			
			var me=Game.textParticles[i];
			if (!me.l) me.l=l('particle'+i);
			me.life=0;
			me.x=x;
			me.y=y;
			me.text=text;
			me.l.innerHTML=text;
			me.l.style.left=Math.floor(Game.textParticles[i].x-200)+'px';
			me.l.style.bottom=Math.floor(-Game.textParticles[i].y)+'px';
			for (var ii in Game.textParticles)
			{if (ii!=i) (Game.textParticles[ii].l||l('particle'+ii)).style.zIndex=100000000;}
			me.l.style.zIndex=100000001;
			me.l.style.display='block';
			me.l.className='particle title';
			void me.l.offsetWidth;
			me.l.className='particle title risingUpLinger';
			if (!noStack) Game.textParticlesY+=60;
		}
		Game.popups=1;
		Game.Popup=function(text,x,y)
		{
			if (Game.popups) Game.textParticlesAdd(text,0,x,y);
		}
		
		//display sparkles at a set position
		Game.sparkles=l('sparkles');
		Game.sparklesT=0;
		Game.sparklesFrames=16;
		Game.SparkleAt=function(x,y)
		{
			if (Game.blendModesOn)
			{
				Game.sparklesT=Game.sparklesFrames+1;
				Game.sparkles.style.backgroundPosition='0px 0px';
				Game.sparkles.style.left=Math.floor(x-64)+'px';
				Game.sparkles.style.top=Math.floor(y-64)+'px';
				Game.sparkles.style.display='block';
			}
		}
		Game.SparkleOn=function(el)
		{
			var rect=el.getBoundingClientRect();
			Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24);
		}
		
		/*=====================================================================================
		NOTIFICATIONS
		=======================================================================================*/
		//maybe do all this mess with proper DOM instead of rewriting the innerHTML
		Game.Notes=[];
		Game.NotesById=[];
		Game.noteId=0;
		Game.noteL=l('notes');
		Game.Note=function(title,desc,pic,quick)
		{
			this.title=title;
			this.desc=desc||'';
			this.pic=pic||'';
			this.id=Game.noteId;
			this.date=Date.now();
			this.quick=quick||0;
			this.life=(this.quick||1)*Game.fps;
			this.l=0;
			this.height=0;
			Game.noteId++;
			Game.NotesById[this.id]=this;
			Game.Notes.unshift(this);
			if (Game.Notes.length>50) Game.Notes.pop();
			//Game.Notes.push(this);
			//if (Game.Notes.length>50) Game.Notes.shift();
			Game.UpdateNotes();
		}
		Game.CloseNote=function(id)
		{
			var me=Game.NotesById[id];
			Game.Notes.splice(Game.Notes.indexOf(me),1);
			//Game.NotesById.splice(Game.NotesById.indexOf(me),1);
			Game.NotesById[id]=null;
			Game.UpdateNotes();
		}
		Game.CloseNotes=function()
		{
			Game.Notes=[];
			Game.NotesById=[];
			Game.UpdateNotes();
		}
		Game.UpdateNotes=function()
		{
			var str='';
			var remaining=Game.Notes.length;
			for (var i in Game.Notes)
			{
				if (i<5)
				{
					var me=Game.Notes[i];
					var pic='';
					if (me.pic!='') pic='<div class="icon" style="'+(me.pic[2]?'background-image:url('+me.pic[2]+');':'')+'background-position:'+(-me.pic[0]*48)+'px '+(-me.pic[1]*48)+'px;"></div>';
					str='<div id="note-'+me.id+'" class="framed note '+(me.pic!=''?'haspic':'nopic')+(me.desc!=''?'hasdesc':'nodesc')+'"><div class="close" onclick="PlaySound(\'snd/tick.mp3\');Game.CloseNote('+me.id+');">x</div>'+pic+'<div class="text"><h3>'+me.title+'</h3>'+(me.desc!=''?'<div class="line"></div><h5>'+me.desc+'</h5>':'')+'</div></div>'+str;
					remaining--;
				}
			}
			if (remaining>0) str='<div class="remaining">+'+remaining+'件の通知'+(remaining==1?'':'')+'</div>'+str;
			if (Game.Notes.length>1)
			{
				str+='<div class="framed close sidenote" onclick="PlaySound(\'snd/tick.mp3\');Game.CloseNotes();">x</div>';
			}
			Game.noteL.innerHTML=str;
			for (var i in Game.Notes)
			{
				me.l=0;
				if (i<5)
				{
					var me=Game.Notes[i];
					me.l=l('note-'+me.id);
				}
			}
		}
		Game.NotesLogic=function()
		{
			for (var i in Game.Notes)
			{
				if (Game.Notes[i].quick>0)
				{
					var me=Game.Notes[i];
					me.life--;
					if (me.life<=0) Game.CloseNote(me.id);
				}
			}
		}
		Game.NotesDraw=function()
		{
			for (var i in Game.Notes)
			{
				if (Game.Notes[i].quick>0)
				{
					var me=Game.Notes[i];
					if (me.l)
					{
						if (me.life<10)
						{
							me.l.style.opacity=(me.life/10);
						}
					}
				}
			}
		}
		Game.Notify=function(title,desc,pic,quick,noLog)
		{
			if (Game.prefs.notifs)
			{
				quick=Math.min(6,quick);
				if (!quick) quick=6;
			}
			desc=replaceAll('==CLOSETHIS()==','Game.CloseNote('+Game.noteId+');',desc);
			if (Game.popups) new Game.Note(title,desc,pic,quick);
			if (!noLog) Game.AddToLog('<b>'+title+'</b> | '+desc);
		}
		
		
		/*=====================================================================================
		PROMPT
		=======================================================================================*/
		Game.darkenL=l('darken');
		AddEvent(Game.darkenL,'click',function(){Game.Click=0;Game.ClosePrompt();});
		Game.promptL=l('promptContent');
		Game.promptAnchorL=l('promptAnchor');
		Game.promptWrapL=l('prompt');
		Game.promptConfirm='';
		Game.promptOn=0;
		Game.promptUpdateFunc=0;
		Game.UpdatePrompt=function()
		{
			if (Game.promptUpdateFunc) Game.promptUpdateFunc();
			Game.promptAnchorL.style.top=Math.floor((Game.windowH-Game.promptWrapL.offsetHeight)/2-16)+'px';
		}
		Game.Prompt=function(content,options,updateFunc,style)
		{
			if (updateFunc) Game.promptUpdateFunc=updateFunc;
			if (style) Game.promptWrapL.className='framed '+style; else Game.promptWrapL.className='framed';
			var str='';
			str+=content;
			var opts='';
			for (var i in options)
			{
				if (options[i]=='br')//just a linebreak
				{opts+='<br>';}
				else
				{
					if (typeof options[i]=='string') options[i]=[options[i],'Game.ClosePrompt();'];
					options[i][1]=options[i][1].replace(/'/g,'&#39;').replace(/"/g,'&#34;');
					opts+='<a id="promptOption'+i+'" class="option" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');'+options[i][1]+'">'+options[i][0]+'</a>';
				}
			}
			Game.promptL.innerHTML=str+'<div class="optionBox">'+opts+'</div>';
			Game.promptAnchorL.style.display='block';
			Game.darkenL.style.display='block';
			Game.promptL.focus();
			Game.promptOn=1;
			Game.UpdatePrompt();
		}
		Game.ClosePrompt=function()
		{
			Game.promptAnchorL.style.display='none';
			Game.darkenL.style.display='none';
			Game.promptOn=0;
			Game.promptUpdateFunc=0;
		}
		Game.ConfirmPrompt=function()
		{
			if (Game.promptOn && l('promptOption0') && l('promptOption0').style.display!='none') FireEvent(l('promptOption0'),'click');
		}
		
		/*=====================================================================================
		MENUS
		=======================================================================================*/
		Game.cssClasses=[];
		Game.addClass=function(what) {if (Game.cssClasses.indexOf(what)==-1) Game.cssClasses.push(what);Game.updateClasses();}
		Game.removeClass=function(what) {var i=Game.cssClasses.indexOf(what);if(i!=-1) {Game.cssClasses.splice(i,1);}Game.updateClasses();}
		Game.updateClasses=function() {Game.l.className=Game.cssClasses.join(' ');}
		
		Game.WriteButton=function(prefName,button,on,off,callback,invert)
		{
			var invert=invert?1:0;
			if (!callback) callback='';
			callback+='PlaySound(\'snd/tick.mp3\');';
			return '<a class="option'+((Game.prefs[prefName]^invert)?'':' off')+'" id="'+button+'" '+Game.clickStr+'="Game.Toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\',\''+invert+'\');'+callback+'">'+(Game.prefs[prefName]?on:off)+'</a>';
		}
		Game.Toggle=function(prefName,button,on,off,invert)
		{
			if (Game.prefs[prefName])
			{
				l(button).innerHTML=off;
				Game.prefs[prefName]=0;
			}
			else
			{
				l(button).innerHTML=on;
				Game.prefs[prefName]=1;
			}
			l(button).className='option'+((Game.prefs[prefName]^invert)?'':' off');
			
		}
		Game.ToggleFancy=function()
		{
			if (Game.prefs.fancy) Game.removeClass('noFancy');
			else if (!Game.prefs.fancy) Game.addClass('noFancy');
		}
		Game.ToggleFilters=function()
		{
			if (Game.prefs.filters) Game.removeClass('noFilters');
			else if (!Game.prefs.filters) Game.addClass('noFilters');
		}
		Game.ToggleExtraButtons=function()
		{
			if (!Game.prefs.extraButtons) Game.removeClass('extraButtons');
			else if (Game.prefs.extraButtons) Game.addClass('extraButtons');
			for (var i in Game.Objects)
			{
				Game.Objects[i].mute(0);
			}
		}
		
		Game.WriteSlider=function(slider,leftText,rightText,startValueFunction,callback)
		{
			if (!callback) callback='';
			return '<div class="sliderBox"><div style="float:left;">'+leftText+'</div><div style="float:right;" id="'+slider+'RightText">'+rightText.replace('[$]',startValueFunction())+'</div><input class="slider" style="clear:both;" type="range" min="0" max="100" step="1" value="'+startValueFunction()+'" onchange="'+callback+'" oninput="'+callback+'" onmouseup="PlaySound(\'snd/tick.mp3\');" id="'+slider+'"/></div>';
		}
		
		Game.onPanel='Left';
		Game.addClass('focus'+Game.onPanel);
		Game.ShowPanel=function(what)
		{
			if (!what) what='';
			if (Game.onPanel!=what)
			{
				Game.removeClass('focus'+Game.onPanel);
				Game.addClass('focus'+what);
			}
			Game.onPanel=what;
		}
		
		Game.onMenu='';
		Game.ShowMenu=function(what)
		{
			if (!what || what=='') what=Game.onMenu;
			if (Game.onMenu=='' && what!='') Game.addClass('onMenu');
			else if (Game.onMenu!='' && what!=Game.onMenu) Game.addClass('onMenu');
			else if (what==Game.onMenu) {Game.removeClass('onMenu');what='';}
			//if (what=='log') l('donateBox').className='on'; else l('donateBox').className='';
			Game.onMenu=what;
			
			l('prefsButton').className=(Game.onMenu=='prefs')?'button selected':'button';
			l('statsButton').className=(Game.onMenu=='stats')?'button selected':'button';
			l('logButton').className=(Game.onMenu=='log')?'button selected':'button';
			
			if (Game.onMenu=='') PlaySound('snd/clickOff.mp3');
			else PlaySound('snd/clickOn.mp3');
			
			Game.UpdateMenu();
			
			if (what=='')
			{
				for (var i in Game.Objects)
				{
					var me=Game.Objects[i];
					if (me.minigame && me.minigame.onResize) me.minigame.onResize();
				}
			}
		}
		Game.sayTime=function(time,detail)
		{
			//time is a value where one second is equal to Game.fps (30).
			//detail skips days when >1, hours when >2, minutes when >3 and seconds when >4.
			//if detail is -1, output something like "3 hours, 9 minutes, 48 seconds"
			if (time<=0) return '';
			var str='';
			var detail=detail||0;
			time=Math.floor(time);
			if (detail==-1)
			{
				//var months=0;
				var days=0;
				var hours=0;
				var minutes=0;
				var seconds=0;
				//if (time>=Game.fps*60*60*24*30) months=(Math.floor(time/(Game.fps*60*60*24*30)));
				if (time>=Game.fps*60*60*24) days=(Math.floor(time/(Game.fps*60*60*24)));
				if (time>=Game.fps*60*60) hours=(Math.floor(time/(Game.fps*60*60)));
				if (time>=Game.fps*60) minutes=(Math.floor(time/(Game.fps*60)));
				if (time>=Game.fps) seconds=(Math.floor(time/(Game.fps)));
				//days-=months*30;
				hours-=days*24;
				minutes-=hours*60+days*24*60;
				seconds-=minutes*60+hours*60*60+days*24*60*60;
				if (days>10) {hours=0;}
				if (days) {minutes=0;seconds=0;}
				if (hours) {seconds=0;}
				var bits=[];
				//if (months>0) bits.push(Beautify(months)+'か月'+(days==1?'':''));
				if (days>0) bits.push(Beautify(days)+'日'+(days==1?'':''));
				if (hours>0) bits.push(Beautify(hours)+'時間'+(hours==1?'':''));
				if (minutes>0) bits.push(Beautify(minutes)+'分'+(minutes==1?'':''));
				if (seconds>0) bits.push(Beautify(seconds)+'秒'+(seconds==1?'':''));
				if (bits.length==0) str='1秒以下';
				else str=bits.join('');
			}
			else
			{
				/*if (time>=Game.fps*60*60*24*30*2 && detail<1) str=Beautify(Math.floor(time/(Game.fps*60*60*24*30)))+'か月';
				else if (time>=Game.fps*60*60*24*30 && detail<1) str='1か月';
				else */if (time>=Game.fps*60*60*24*2 && detail<2) str=Beautify(Math.floor(time/(Game.fps*60*60*24)))+'日';
				else if (time>=Game.fps*60*60*24 && detail<2) str='1日';
				else if (time>=Game.fps*60*60*2 && detail<3) str=Beautify(Math.floor(time/(Game.fps*60*60)))+'時間';
				else if (time>=Game.fps*60*60 && detail<3) str='1時間';
				else if (time>=Game.fps*60*2 && detail<4) str=Beautify(Math.floor(time/(Game.fps*60)))+'分';
				else if (time>=Game.fps*60 && detail<4) str='1分';
				else if (time>=Game.fps*2 && detail<5) str=Beautify(Math.floor(time/(Game.fps)))+'秒';
				else if (time>=Game.fps && detail<5) str='1秒';
				else str='1秒以下';
			}
			return str;
		}
		
		Game.tinyCookie=function()
		{
			if (!Game.HasAchiev('ちっちゃいクッキー'))
			{
				return '<div class="tinyCookie" '+Game.clickStr+'="Game.ClickTinyCookie();"></div>';
			}
			return '';
		}
		Game.ClickTinyCookie=function(){if (!Game.HasAchiev('ちっちゃいクッキー')){PlaySound('snd/tick.mp3');Game.Win('ちっちゃいクッキー');}}
		
		Game.setVolume=function(what)
		{
			Game.volume=what;
			/*for (var i in Sounds)
			{
				Sounds[i].volume=Game.volume;
			}*/
		}
		
		Game.UpdateMenu=function()
		{
			var str='';
			if (Game.onMenu!='')
			{
				str+='<div class="close menuClose" '+Game.clickStr+'="Game.ShowMenu();">x</div>';
				//str+='<div style="position:absolute;top:8px;right:8px;cursor:pointer;font-size:16px;" '+Game.clickStr+'="Game.ShowMenu();">X</div>';
			}
			if (Game.onMenu=='prefs')
			{
				str+='<div class="section">設定</div>'+
				'<div class="subsection">'+
				'<div class="title">一般</div>'+
				'<div class="listing"><a class="option" '+Game.clickStr+'="Game.toSave=true;PlaySound(\'snd/tick.mp3\');">セーブ</a><label>手動セーブ(60秒ごとに自動セーブされます。ショートカットキー:Ctrl+S)</label></div>'+
				'<div class="listing"><a class="option" '+Game.clickStr+'="Game.ExportSave();PlaySound(\'snd/tick.mp3\');" >セーブ書き出し</a><a class="option" '+Game.clickStr+'="Game.ImportSave();PlaySound(\'snd/tick.mp3\');">セーブ取り込み</a><label>セーブデータのバックアップや他のコンピュータへの移行に使えます。(ショートカットキー:Ctrl+O)</label></div>'+
				'<div class="listing"><a class="option" '+Game.clickStr+'="Game.FileSave();PlaySound(\'snd/tick.mp3\');">ファイルに書き出し</a><a class="option" style="position:relative;"><input id="FileLoadInput" type="file" style="cursor:pointer;opacity:0;position:absolute;left:0px;top:0px;width:100%;height:100%;" onchange="Game.FileLoad(event);" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');"/>ファイルから読み込み</a><label>コンピュータにバックアップを残しておくのに使えます。</label></div>'+
				
				'<div class="listing"><a class="option warning" '+Game.clickStr+'="Game.HardReset();PlaySound(\'snd/tick.mp3\');" >セーブデータ削除</a><label>実績を含めた、すべてのデータを削除します。</label></div>'+
				'<div class="title">設定</div>'+
				'<div class="listing">'+
				Game.WriteSlider('volumeSlider','音量','[$]%',function(){return Game.volume;},'Game.setVolume(Math.round(l(\'volumeSlider\').value));l(\'volumeSliderRightText\').innerHTML=Game.volume+\'%\';')+'<br>'+
				Game.WriteButton('fancy','fancyButton','派手なグラフィック オン','派手なグラフィック オフ','Game.ToggleFancy();')+'<label>(見た目の要素の改善。切っておくとパフォーマンスが向上するかもしれません。)</label><br>'+
				Game.WriteButton('filters','filtersButton','CSSフィルター オン','CSSフィルター オフ','Game.ToggleFilters();')+'<label>(ふちを整えることによる見た目の要素の改善。切っておくとパフォーマンスが向上するかもしれません。)</label><br>'+
				Game.WriteButton('particles','particlesButton','小クッキー オン','小クッキー オフ')+'<label>(クッキーが落ちてきたりします。切っておくとパフォーマンスが向上するかもしれません。)</label><br>'+
				Game.WriteButton('numbers','numbersButton','数字表示 オン','数字表示 オフ')+'<label>(大クッキーをクリックしたときに獲得クッキー数が表示されます。)</label><br>'+
				Game.WriteButton('milk','milkButton','ミルク オン','ミルク オフ')+'<label>(十分な数の実績を獲得していることでのみ表示されます。)</label><br>'+
				Game.WriteButton('cursors','cursorsButton','カーソル オン','カーソル オフ')+'<label>(取得しているカーソルを視覚的に表示します。)</label><br>'+
				Game.WriteButton('wobbly','wobblyButton','クッキーのうねり オン','クッキーのうねり オフ')+'<label>(大クッキーをクリックしたときに反応を示します。)</label><br>'+
				Game.WriteButton('cookiesound','cookiesoundButton','古いクッキー音 オン','古いクッキー音 オフ')+'<label>(大クッキーをクリックしたときの音が変わります。)</label><br>'+
				Game.WriteButton('crates','cratesButton','アイコン枠 オン','アイコン枠 オフ')+'<label>(アップグレードや実績のまわりに枠が表示されます。)</label><br>'+
				Game.WriteButton('monospace','monospaceButton','古いフォント オン','古いフォント オフ')+'<label>(文字をmonospaceフォントを使用して表示します。)</label><br>'+
				Game.WriteButton('format','formatButton','短縮表記 オフ','短縮表記 オン','BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;',1)+'<label>(巨大な数の表記を短縮します。)</label><br>'+
				Game.WriteButton('notifs','notifsButton','通知表示時間短縮 オン','通知表示時間短縮 オフ')+'<label>(通知がより早く消えます。)</label><br>'+
				//Game.WriteButton('autoupdate','autoupdateButton','オフラインモード オフ','オフラインモード オン',0,1)+'<label>(アップデートの通知を無効にします。)</label><br>'+
				Game.WriteButton('warn','warnButton','ページ遷移時警告 オン','ページ遷移時警告 オフ')+'<label>(ウインドウを閉じるときに確認します。)</label><br>'+
				Game.WriteButton('focus','focusButton','非フォーカス状態 オフ','非フォーカス状態 オン',0,1)+'<label>(フォーカスを外しているときにリソースを多く消費しないようにします。)</label><br>'+
				Game.WriteButton('extraButtons','extraButtonsButton','追加ボタン オン','追加ボタン オフ','Game.ToggleExtraButtons();')+'<label>(施設に非表示のボタンを追加します。)</label><br>'+
				Game.WriteButton('askLumps','askLumpsButton','角砂糖使用確認 オン','角砂糖使用確認 オフ')+'<label>(砂糖を消費する前に確認されるようになります。)</label><br>'+
				Game.WriteButton('customGrandmas','customGrandmasButton','グランマカスタム オン','グランマカスタム オフ')+'<label>(一部のグランマがPatreonの支援者から命名されます)</label><br>'+
				'<a class="option'+((Game.prefs['formatlang']>0)?'':' off')+'" id="langButton" '+Game.clickStr+'="Game.prefs[\'formatlang\']=(Game.prefs[\'formatlang\']+1)%3;l(\'langButton\').innerHTML=(Game.prefs[\'formatlang\']>0?\'単位日本語化 形式\'+Game.prefs[\'formatlang\']:\'単位日本語化 オフ\');l(\'langButton\').className=\'option\'+(Game.prefs[\'formatlang\']>0?\'\':\' off\');Game.localStorageSet(\'formatlang\',\'\'+Game.prefs.formatlang);BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;PlaySound(\'snd/tick.mp3\');">'+(Game.prefs['formatlang']>0?'単位日本語化 形式'+Game.prefs['formatlang']:'単位日本語化 オフ')+'</a><label>(単位を日本語化します。)</label><br>'+
				Game.WriteButton('timeout','timeoutButton','スリープモード休止 オン','スリープモード休止 オフ')+'<label>(動作の遅いコンピュータにおいて、ゲームが非アクティブかつカクつき始めた時にスリープモードに移行します。スリープモード中はオフラインでのCpSが適用されます。)</label><br>'+
				'</div>'+
				//'<div class="listing">'+Game.WriteButton('autosave','autosaveButton','Autosave ON','Autosave OFF')+'</div>'+
				'<div class="listing"><a class="option" '+Game.clickStr+'="Game.CheckModData();PlaySound(\'snd/tick.mp3\');">MODデータの確認</a><label>(MODによって作成されたセーブデータを閲覧したり削除します)</label></div>'+
				
				'<div style="padding-bottom:128px;"></div>'+
				'</div>'
				;
			}
			else if (Game.onMenu=='main')
			{
				str+=
				'<div class="listing">This isn\'t really finished</div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'prefs\');">Menu</a></div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'stats\');">Stats</a></div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'log\');">Updates</a></div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="">Quit</a></div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(Game.onMenu);">Resume</a></div>';
			}
			else if (Game.onMenu=='log')
			{
				str+=replaceAll('[bakeryName]',Game.bakeryName,Game.updateLog);
				if (!Game.HasAchiev('かつての日々')) str+='<div style="text-align:right;width:100%;"><div '+Game.clickStr+'="Game.SparkleAt(Game.mouseX,Game.mouseY);PlaySound(\'snd/tick.mp3\');PlaySound(\'snd/shimmerClick.mp3\');Game.Win(\'かつての日々\');Game.UpdateMenu();" class="icon" style="display:inline-block;transform:scale(0.5);cursor:pointer;width:48px;height:48px;background-position:'+(-12*48)+'px '+(-3*48)+'px;"></div></div>';
			}
			else if (Game.onMenu=='stats')
			{
				var buildingsOwned=0;
				buildingsOwned=Game.BuildingsOwned;
				var upgrades='';
				var cookieUpgrades='';
				var hiddenUpgrades='';
				var prestigeUpgrades='';
				var upgradesTotal=0;
				var upgradesOwned=0;
				var prestigeUpgradesTotal=0;
				var prestigeUpgradesOwned=0;
				
				var list=[];
				//sort the upgrades
				for (var i in Game.Upgrades){list.push(Game.Upgrades[i]);}//clone first
				var sortMap=function(a,b)
				{
					if (a.order>b.order) return 1;
					else if (a.order<b.order) return -1;
					else return 0;
				}
				list.sort(sortMap);
				for (var i in list)
				{
					var str2='';
					var me=list[i];
					
					str2+=Game.crate(me,'stats');
					
					if (me.bought)
					{
						if (Game.CountsAsUpgradeOwned(me.pool)) upgradesOwned++;
						else if (me.pool=='prestige') prestigeUpgradesOwned++;
					}
					
					if (me.pool=='' || me.pool=='cookie' || me.pool=='tech') upgradesTotal++;
					if (me.pool=='debug') hiddenUpgrades+=str2;
					else if (me.pool=='prestige') {prestigeUpgrades+=str2;prestigeUpgradesTotal++;}
					else if (me.pool=='cookie') cookieUpgrades+=str2;
					else if (me.pool!='toggle' && me.pool!='unused') upgrades+=str2;
				}
				var achievements=[];
				var achievementsOwned=0;
				var achievementsOwnedOther=0;
				var achievementsTotal=0;
				
				var list=[];
				for (var i in Game.Achievements)//sort the achievements
				{
					list.push(Game.Achievements[i]);
				}
				var sortMap=function(a,b)
				{
					if (a.order>b.order) return 1;
					else if (a.order<b.order) return -1;
					else return 0;
				}
				list.sort(sortMap);
				
				
				for (var i in list)
				{
					var me=list[i];
					//if (me.pool=='normal' || me.won>0) achievementsTotal++;
					if (Game.CountsAsAchievementOwned(me.pool)) achievementsTotal++;
					var pool=me.pool;
					if (!achievements[pool]) achievements[pool]='';
					achievements[pool]+=Game.crate(me,'stats');
					
					if (me.won)
					{
						if (Game.CountsAsAchievementOwned(me.pool)) achievementsOwned++;
						else achievementsOwnedOther++;
					}
				}
				
				var achievementsStr='';
				var pools={
					'dungeon':'<b>ダンジョン実績</b> <small>(技術面でまだ達成不可能です。)</small>',
					'shadow':'<b>隠し実績</b> <small>(達成のために不正な行いか困難な技術が含まれます。隠し実績ではミルクは増加しません。)</small>'
				};
				for (var i in achievements)
				{
					if (achievements[i]!='')
					{
						if (pools[i]) achievementsStr+='<div class="listing">'+pools[i]+'</div>';
						achievementsStr+='<div class="listing crateBox">'+achievements[i]+'</div>';
					}
				}
				
				var milkStr='';
				for (var i=0;i<Game.Milks.length;i++)
				{
					if (Game.milkProgress>=i)
					{
						var milk=Game.Milks[i];
						milkStr+='<div '+Game.getTooltip(
						'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px;padding-bottom:96px;"><h3 style="margin:6px 32px 0px 32px;">'+milk.name+'</h3><div style="opacity:0.75;font-size:9px;">('+(i==0?'初めてのミルク':(Beautify(i*25)+'個の実績で解除'))+')</div><div class="line"></div><div style="width:100%;height:96px;position:absolute;left:0px;bottom:0px;background:url(img/'+milk.pic+'.png);"></div></div>'
						,'top')+' style="background:url(img/icons.png?v='+Game.version+') '+(-milk.icon[0]*48)+'px '+(-milk.icon[1]*48)+'px;margin:2px 0px;" class="trophy"></div>';
					}
				}
				milkStr+='<div style="clear:both;"></div>';
				
				var santaStr='';
				var frames=15;
				if (Game.Has('とある祭りの帽子'))
				{
					for (var i=0;i<=Game.santaLevel;i++)
					{
						santaStr+='<div '+Game.getTooltip(
						'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px 32px;"><div style="width:96px;height:96px;margin:4px auto;background:url(img/santa.png) '+(-i*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div><div class="line"></div><h3>'+Game.santaLevels[i]+'</h3></div>'
						,'top')+' style="background:url(img/santa.png) '+(-i*48)+'px 0px;background-size:'+(frames*48)+'px 48px;" class="trophy"></div>';
					}
					santaStr+='<div style="clear:both;"></div>';
				}
				var dragonStr='';
				var frames=9;
				var mainLevels=[0,4,8,23,24,25];
				if (Game.Has('ポロポロこぼれそうな卵'))
				{
					for (var i=0;i<=mainLevels.length;i++)
					{
						if (Game.dragonLevel>=mainLevels[i])
						{
							var level=Game.dragonLevels[mainLevels[i]];
							dragonStr+='<div '+Game.getTooltip(
							//'<div style="width:96px;height:96px;margin:4px auto;background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*96)+'px 0px;"></div><div class="line"></div><div style="min-width:200px;text-align:center;margin-bottom:6px;">'+level.name+'</div>'
							'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px 32px;"><div style="width:96px;height:96px;margin:4px auto;background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div><div class="line"></div><h3>'+level.name+'</h3></div>'
							,'top')+' style="background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*48)+'px 0px;background-size:'+(frames*48)+'px 48px;" class="trophy"></div>';
						}
					}
					dragonStr+='<div style="clear:both;"></div>';
				}
				var ascensionModeStr='';
				var icon=Game.ascensionModes[Game.ascensionMode].icon;
				if (Game.resets>0) ascensionModeStr='<span style="cursor:pointer;" '+Game.getTooltip(
							'<div style="min-width:200px;text-align:center;font-size:11px;">'+Game.ascensionModes[Game.ascensionMode].desc+'</div>'
							,'top')+'><div class="icon" style="display:inline-block;float:none;transform:scale(0.5);margin:-24px -16px -19px -8px;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div>'+Game.ascensionModes[Game.ascensionMode].name+'</span>';
				
				var milkName=Game.Milk.name;
				
				var researchStr=Game.sayTime(Game.researchT,-1);
				var pledgeStr=Game.sayTime(Game.pledgeT,-1);
				var wrathStr='';
				if (Game.elderWrath==1) wrathStr='覚醒';
				else if (Game.elderWrath==2) wrathStr='不機嫌';
				else if (Game.elderWrath==3) wrathStr='怒り';
				else if (Game.elderWrath==0 && Game.pledges>0) wrathStr='なだめ';
				
				var date=new Date();
				date.setTime(Date.now()-Game.startDate);
				var timeInSeconds=date.getTime()/1000;
				var startDate=Game.sayTime(timeInSeconds*Game.fps,-1);
				date.setTime(Date.now()-Game.fullDate);
				var fullDate=Game.sayTime(date.getTime()/1000*Game.fps,-1);
				if (!Game.fullDate || !fullDate || fullDate.length<1) fullDate='かなり';
				/*date.setTime(new Date().getTime()-Game.lastDate);
				var lastDate=Game.sayTime(date.getTime()/1000*Game.fps,2);*/
				
				var heavenlyMult=Game.GetHeavenlyMultiplier();
				
				var seasonStr=Game.sayTime(Game.seasonT,-1);
				
				str+='<div class="section">統計</div>'+
				'<div class="subsection">'+
				'<div class="title">一般</div>'+
				'<div class="listing"><b>貯蔵中のクッキー :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookies)+'</div></div>'+
				'<div class="listing"><b>焼いたクッキー(この周回) :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesEarned)+'</div></div>'+
				'<div class="listing"><b>焼いたクッキー(全てのプレイ) :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesEarned+Game.cookiesReset)+'</div></div>'+
				(Game.cookiesReset>0?'<div class="listing"><b>これまでの昇天で失われたクッキー :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesReset)+'</div></div>':'')+
				(Game.resets?('<div class="listing"><b>いつゲームを始めたか :</b> '+(fullDate==''?'たった今':(fullDate+'前'))+'、それと'+Beautify(Game.resets)+'回昇天'+(Game.resets==1?'':'')+'</div>'):'')+
				'<div class="listing"><b>いつこの周回を始めたか :</b> '+(startDate==''?'たった今':(startDate+'前'))+'</div>'+
				'<div class="listing"><b>施設所持数 :</b> '+Beautify(buildingsOwned)+'</div>'+
				'<div class="listing"><b>1秒間で焼かれるクッキー(CpS) :</b> '+Beautify(Game.cookiesPs,1)+' <small>'+
					'(倍率 : '+Beautify(Math.round(Game.globalCpsMult*100),1)+'%)'+
					(Game.cpsSucked>0?' <span class="warning">(しなびた割合 : '+Beautify(Math.round(Game.cpsSucked*100),1)+'%)</span>':'')+
					'</small></div>'+
				'<div class="listing"><b>素CpS :</b> '+Beautify(Game.cookiesPsRaw,1)+' <small>'+
					'(この周回での最高値 : '+Beautify(Game.cookiesPsRawHighest,1)+')'+
					'</small></div>'+
				'<div class="listing"><b>1クリックで焼かれるクッキー(CpC) :</b> '+Beautify(Game.computedMouseCps,1)+'</div>'+
				'<div class="listing"><b>大クッキーをクリックした回数 :</b> '+Beautify(Game.cookieClicks)+'</div>'+
				'<div class="listing"><b>クリックして焼いたクッキー :</b> '+Beautify(Game.handmadeCookies)+'</div>'+
				'<div class="listing"><b>ゴールデンクッキーをクリックした回数 :</b> '+Beautify(Game.goldenClicksLocal)+' <small>(全てのプレイ : '+Beautify(Game.goldenClicks)+')</small></div>'+//' <span class="hidden">(<b>取り逃したゴールデンクッキーの数 :</b> '+Beautify(Game.missedGoldenClicks)+')</span></div>'+
				'<br><div class="listing"><b>実行中のバージョン :</b> '+Game.version+'</div>'+
				
				((researchStr!='' || wrathStr!='' || pledgeStr!='' || santaStr!='' || dragonStr!='' || Game.season!='' || ascensionModeStr!='' || Game.canLumps())?(
				'</div><div class="subsection">'+
				'<div class="title">特殊</div>'+
				(ascensionModeStr!=''?'<div class="listing"><b>チャレンジモード :</b>'+ascensionModeStr+'</div>':'')+
				(Game.season!=''?'<div class="listing"><b>季節イベント :</b> '+Game.seasons[Game.season].name+
					(seasonStr!=''?' <small>(残り : '+seasonStr+')</small>':'')+
				'</div>':'')+
				(Game.season=='fools'?
					'<div class="listing"><b>クッキーを売って得た収益 :</b> '+Beautify(Game.cookiesEarned*0.08,2)+' cookie dollars</div>'+
					(Game.Objects['ポータル'].highest>0?'<div class="listing"><b>提供番組数 :</b> '+Beautify(Math.floor((timeInSeconds/60/60)*(Game.Objects['ポータル'].highest*0.13)+1))+'</div>':'')
				:'')+
				(researchStr!=''?'<div class="listing"><b>研究 :</b> 残り'+researchStr+'</div>':'')+
				(wrathStr!=''?'<div class="listing"><b>グランマポカリプスの段階 :</b> '+wrathStr+'</div>':'')+
				(pledgeStr!=''?'<div class="listing"><b>誓約 :</b> 残り'+pledgeStr+'</div>':'')+
				(Game.wrinklersPopped>0?'<div class="listing"><b>退治した虫の数 :</b> '+Beautify(Game.wrinklersPopped)+'</div>':'')+
				((Game.canLumps() && Game.lumpsTotal>-1)?'<div class="listing"><b>収穫した角砂糖の数 :</b> <div class="price lump plain">'+Beautify(Game.lumpsTotal)+'</div></div>':'')+
				//(Game.cookiesSucked>0?'<div class="listing warning"><b>しなびた数 :</b> '+Beautify(Game.cookiesSucked)+'クッキー</div>':'')+
				(Game.reindeerClicked>0?'<div class="listing"><b>発見したトナカイの数 :</b> '+Beautify(Game.reindeerClicked)+'</div>':'')+
				(santaStr!=''?'<div class="listing"><b>解除したサンタの段階 :</b></div><div>'+santaStr+'</div>':'')+
				(dragonStr!=''?'<div class="listing"><b>ドラゴントレーニング :</b></div><div>'+dragonStr+'</div>':'')+
				''
				):'')+
				((Game.prestige>0 || prestigeUpgrades!='')?(
				'</div><div class="subsection">'+
				'<div class="title">名声</div>'+
				'<div class="listing"><div class="icon" style="float:left;background-position:'+(-19*48)+'px '+(-7*48)+'px;"></div>'+
					'<div style="margin-top:8px;"><span class="title" style="font-size:22px;">名声レベル : '+Beautify(Game.prestige)+'</span> 潜在している能力の'+Beautify(heavenlyMult*100,1)+'%を引き出しています。<b>(+'+Beautify(parseFloat(Game.prestige)*Game.heavenlyPower*heavenlyMult,1)+'% CpS)</b><br>ヘブンリーチップス : <b>'+Beautify(Game.heavenlyChips)+'</b></div>'+
				'</div>'+
				(prestigeUpgrades!=''?(
				'<div class="listing" style="clear:left;"><b>解除した天国系アップグレード :</b> '+prestigeUpgradesOwned+'/'+prestigeUpgradesTotal+' ('+Math.floor((prestigeUpgradesOwned/prestigeUpgradesTotal)*100)+'%)</div>'+
				'<div class="listing crateBox">'+prestigeUpgrades+'</div>'):'')+
				''):'')+

				'</div><div class="subsection">'+
				'<div class="title">アップグレード</div>'+
				(hiddenUpgrades!=''?('<div class="listing"><b>デバッグ</b></div>'+
				'<div class="listing crateBox">'+hiddenUpgrades+'</div>'):'')+
				'<div class="listing"><b>解除済みのアップグレード :</b> '+upgradesOwned+'/'+upgradesTotal+' ('+Math.floor((upgradesOwned/upgradesTotal)*100)+'%)</div>'+
				'<div class="listing crateBox">'+upgrades+'</div>'+
				(cookieUpgrades!=''?('<div class="listing"><b>フレーバークッキー</b></div>'+
				'<div class="listing crateBox">'+cookieUpgrades+'</div>'):'')+
				'</div><div class="subsection">'+
				'<div class="title">実績</div>'+
				'<div class="listing"><b>解除済みの実績 :</b> '+achievementsOwned+'/'+achievementsTotal+' ('+Math.floor((achievementsOwned/achievementsTotal)*100)+'%)'+(achievementsOwnedOther>0?('<span style="font-weight:bold;font-size:10px;color:#70a;"> (+'+achievementsOwnedOther+')</span>'):'')+'</div>'+
				(Game.cookiesMultByType['kittens']>1?('<div class="listing"><b>子猫による倍率 :</b> '+Beautify((Game.cookiesMultByType['kittens'])*100)+'%</div>'):'')+
				'<div class="listing"><b>ミルク :</b> '+milkName+'</div>'+
				(milkStr!=''?'<div class="listing"><b>解除済みのミルクの種類 :</b></div><div>'+milkStr+'</div>':'')+
				'<div class="listing"><small style="opacity:0.75;">(ミルクはそれぞれの実績によって増加します。ミルクの量によって徐々に固有のアップグレードが開放されます。)</small></div>'+
				achievementsStr+
				'</div>'+
				'<div style="padding-bottom:128px;"></div>'
				;
			}
			//str='<div id="selectionKeeper" class="selectable">'+str+'</div>';
			l('menu').innerHTML=str;
			/*AddEvent(l('selectionKeeper'),'mouseup',function(e){
				console.log('selection:',window.getSelection());
			});*/
		}
		
		AddEvent(l('prefsButton'),'click',function(){Game.ShowMenu('prefs');});
		AddEvent(l('statsButton'),'click',function(){Game.ShowMenu('stats');});
		AddEvent(l('logButton'),'click',function(){Game.ShowMenu('log');});
		AddEvent(l('legacyButton'),'click',function(){PlaySound('snd/tick.mp3');Game.Ascend();});
		Game.ascendMeter=l('ascendMeter');
		Game.ascendNumber=l('ascendNumber');
		
		Game.lastPanel='';
		if (Game.touchEvents)
		{
			AddEvent(l('focusLeft'),'touchend',function(){Game.ShowMenu('');Game.ShowPanel('Left');});
			AddEvent(l('focusMiddle'),'touchend',function(){Game.ShowMenu('');Game.ShowPanel('Middle');});
			AddEvent(l('focusRight'),'touchend',function(){Game.ShowMenu('');Game.ShowPanel('Right');});
			AddEvent(l('focusMenu'),'touchend',function(){Game.ShowMenu('main');Game.ShowPanel('Menu');});
		}
		else
		{
			AddEvent(l('focusLeft'),'click',function(){Game.ShowMenu('');Game.ShowPanel('Left');});
			AddEvent(l('focusMiddle'),'click',function(){Game.ShowMenu('');Game.ShowPanel('Middle');});
			AddEvent(l('focusRight'),'click',function(){Game.ShowMenu('');Game.ShowPanel('Right');});
			AddEvent(l('focusMenu'),'click',function(){Game.ShowMenu('main');Game.ShowPanel('Menu');});
		}
		//AddEvent(l('focusMenu'),'touchend',function(){if (Game.onPanel=='Menu' && Game.lastPanel!='') {Game.ShowMenu('main');Game.ShowPanel(Game.lastPanel);} else {Game.lastPanel=Game.onPanel;Game.ShowMenu('main');Game.ShowPanel('Menu');}});
		
		/*=====================================================================================
		NEWS TICKER
		=======================================================================================*/
		Game.Ticker='';
		Game.TickerAge=0;
		Game.TickerEffect=0;
		Game.TickerN=0;
		Game.TickerClicks=0;
		Game.UpdateTicker=function()
		{
			Game.TickerAge--;
			if (Game.TickerAge<=0) Game.getNewTicker();
			else if (Game.Ticker=='') Game.getNewTicker(true);
		}
		Game.getNewTicker=function(manual)//note : "manual" is true if the ticker was clicked, but may also be true on startup etc
		{
			var list=[];
			
			if (Game.TickerN%2==0 || Game.cookiesEarned>=10100000000)
			{
				var animals=['イモリ','ペンギン','サソリ','アホロートル','海鳥','ネズミイルカ','フグ','馬','ザリガニ','ナメクジ','ザトウクジラ','コモリザメ','ダイオウイカ','ホッキョクグマ','フルーツコウモリ','カエル','ホヤ','カギムシ','デバネズミ','ゾウリムシ','線虫','タマムシ','キリン','アンコウ','狼男','ゴブリン','ヒッピー'];
				
				if (Math.random()<0.75 || Game.cookiesEarned<10000)
				{
					if (Game.Objects['グランマ'].amount>0) list.push(choose([
					'<q>しっとりしたクッキーねぇ</q><sig>グランマ</sig>',
					'<q>私たちはみんな素敵なおばあちゃんよ</q><sig>グランマ</sig>',
					'<q>年季奉公だからねぇ</q><sig>グランマ</sig>',
					'<q>おばあちゃんにキスしておくれ</q><sig>グランマ</sig>',
					'<q>もっと遊びに来ておくれ</q><sig>グランマ</sig>',
					'<q>おばあちゃんに電話しておくれ…</q><sig>グランマ</sig>'
					]));
					
					if (Game.Objects['グランマ'].amount>=50) list.push(choose([
					'<q>とっても嫌な感じねぇ</q><sig>グランマ</sig>',
					'<q>もう君にはうんざりだよ</q><sig>グランマ</sig>',
					'<q>君には愛想が尽きたよ</q><sig>グランマ</sig>',
					'<q>私たちは立ち上がるの</q><sig>グランマ</sig>',
					'<q>始まったわ</q><sig>グランマ</sig>',
					'<q>もうすぐすべてが終わる</q><sig>グランマ</sig>',
					'<q>やめることも出来たはずよ</q><sig>グランマ</sig>'
					]));
					
					if (Game.HasAchiev('背徳') && Math.random()<0.4) list.push(choose([
					'ニュース : クッキー業者事業縮小、従業員のグランマを売却!',
					'<q>裏切ったのね、ちょっとひどいわ。</q><sig>グランマ</sig>',
					'<q>私たちを追い払おうとしたみたいねぇ、ちょっと意地が悪いわよ。</q><sig>グランマ</sig>',
					'<q>売り込みに出歩かされると思ってたわ。変わってるわねえ。</q><sig>グランマ</sig>',
					'<q>腐ったクッキーの臭いがするわ。</q><sig>グランマ</sig>'
					]));
					
					if (Game.Objects['グランマ'].amount>=1 && Game.pledges>0 && Game.elderWrath==0) list.push(choose([
					'<q>萎れてしまえ</q><sig>グランマ</sig>',
					'<q>もがき苦しめ</q><sig>グランマ</sig>',
					'<q>震えるがいい</q><sig>グランマ</sig>',
					'<q>蝕まれるがいい</q><sig>グランマ</sig>',
					'<q>我々は再び蘇るだろう。</q><sig>グランマ</sig>',
					'<q>所詮は一時凌ぎよ。</q><sig>グランマ</sig>',
					'<q>まだ足りぬわ。</q><sig>グランマ</sig>',
					'<q>遅すぎたのだ。</q><sig>グランマ</sig>'
					]));
					
					if (Game.Objects['農場'].amount>0) list.push(choose([
					'ニュース : クッキー農場で未申告の高齢者を労働させている疑惑が浮上!',
					'ニュース : クッキー農場が川に有害なチョコレートを放流していると科学者が証言!',
					'ニュース : 遺伝子組み換えチョコレートに関する論争、クッキー農場を直撃!',
					'ニュース : 放し飼い農場のクッキーはナウなヤングにバカウケ、専門家が語る。',
					'ニュース : 農場のクッキーは純菜食主義者にとって不健康だと思われている、と栄養士が発言。'
					]));
					
					if (Game.Objects['鉱山'].amount>0) list.push(choose([
					'ニュース : 我らが星の質量が減少しつつある?専門家は集中的なチョコレート採掘による影響を調査。',
					'ニュース : '+Math.floor(Math.random()*1000+2)+'名の炭鉱労働者、チョコレート鉱山崩落に巻き込まれる!',
					'ニュース : チョコレート鉱山が地震と陥没を引き起こすことが発見される!',
					'ニュース : チョコレート鉱山で人災発生、村がチョコレートで浸水!',
					'ニュース : チョコレート鉱山の奥深くに「一風変わった、チョコレートらしきものでできた」家屋を発見!'
					]));
					
					if (Game.Objects['工場'].amount>0) list.push(choose([
					'ニュース : クッキー工場は地球温暖化と関係有り!',
					'ニュース : チョコレート雨に関するクッキー工場論争!',
					'ニュース : ストライキ中のクッキー工場、代替労働力として作業用ロボットを採用!',
					'ニュース : ストライキ中のクッキー工場 - 労働者たちはクッキーによる支払いを止めるよう要求!',
					'ニュース : 工場製のクッキーは肥満に関係するとの研究結果が。'
					]));
					
					if (Game.Objects['銀行'].amount>0) list.push(choose([
					'ニュース : クッキーローンの金利は、もはや定期返済が不可能な程に高騰している。',
					'ニュース : クッキーは従来の通貨に取って代わる存在として、徐々に頭角を現している!',
					'ニュース : 今や殆どのベーカリーがATMを設置し、クッキーの引き出しと預金がより簡単に。',
					'ニュース : プール2杯分の巨大金庫を満たす程、クッキーの確保は十分であります!',
					'ニュース : 「近い将来、富裕層の資産算定は彼等が保有するクッキーの価値で為されるだろう」と専門家が予測。'
					]));
					
					if (Game.Objects['神殿'].amount>0) list.push(choose([
					'ニュース : 探検家が廃寺院から持ち帰った古代の人工遺物。考古学者は何世紀も昔の'+choose(['魔法の','飾り彫りのある','刻印された','彫刻の','王室の','皇帝の','ミイラ化した','儀式の','金の','銀の','石の','呪われた','プラスチックの','骨の','血を流す','聖なる','祭られた','生贄の','電子式','歌う','タップダンスする'])+choose(['スプーン','フォーク','ピザ','洗濯機','計算機','帽子','ピアノ','ナプキン','スケルトン','ガウン','短剣','剣','盾','頭蓋骨','エメラルド','浴槽','仮面','ローラースケート靴','猫用トイレ','餌箱','立方体','球体','菌類'])+'に驚嘆!',
					'ニュース : 最近発見されたチョコレート寺院が新たなクッキー崇拝のメッカに。天上の「焼き主」に祈りを捧げる数千の信者!',
					'ニュース : 件のクッキー神殿はどこまで広大なのか?神学者は'+choose([choose(animals),choose(['カズー','ウェブデザイン','ウェブブラウザ','仔猫','無神論','ハンドブレーキ','帽子','靴紐の先っちょ','小綺麗でつまらない音楽','放置ゲーム','文字「P」','ミーム','ハンバーガー','つまらんダジャレ','文字間隔調整','スタンダップコメディ','強盗未遂','ネットの釣りタイトル','ネットの詐欺広告'])])+'の'+choose(['神','女神'])+'を祀っている可能性を推測。',
					'ニュース : 有神論者が新たなクッキーの教義を発見。「なんてこった、今までの教えは全て誤りだというのか…!」',
					'ニュース : 言い伝えによると、クッキーの天国は「階段の代わりにアトラクション的なエレベーターを備え」、クッキーの地獄は「粗悪な建材にお誂え向きの敷石で舗装されている」。'
					]));
					
					if (Game.Objects['魔法使いの塔'].amount>0) list.push(choose([
					'ニュース : 全ての'+choose([choose(animals),choose(['公衆トイレ','雲','政治家','口髭','帽子','靴','ズボン','道化師','百科事典','ウェブサイト','鉢植え','レモン','家庭用品','体液','カトラリー','国定史跡','ヨーグルト','ラップミュージック','下着'])])+'を'+choose([choose(animals),choose(['公衆トイレ','雲','政治家','口髭','帽子','靴','ズボン','道化師','百科事典','ウェブサイト','鉢植え','レモン','家庭用品','体液','カトラリー','国定史跡','ヨーグルト','ラップミュージック','下着'])])+'に変えるトンチキ魔法で大惨事!',
					'ニュース : '+choose(['水','火','地','風','雷','酸','歌','戦闘','秩序','鉛筆','インターネット','空間','時間','脳','自然','テクノ','植物','虫','氷','毒','蟹','仔猫','イルカ','鳥','パンチ','屁'])+'魔法学校と'+choose(['水','火','地','風','雷','酸','歌','戦闘','秩序','鉛筆','インターネット','空間','時間','脳','自然','テクノ','植物','虫','氷','毒','蟹','仔猫','イルカ','鳥','パンチ','屁'])+'魔法学校との間に深い軋轢が発生!熾烈を極める争い!',
					'ニュース : 毎年開催、全国スペル創造フェアで最新の護符と呪具をゲットしよう!ルーン文字と魔導書は、ここだけの独占価格でご提供。',
					'ニュース : クッキーウィザードは酷く醜怪な新生児への関与を否定 - 医師は語る。「忌憚なく言えば、幼児の外見は吐き気を催すが、手を加えられてはいない」',
					'ニュース : 「未完成でいい加減な魔法はね、テクノロジーと見分けがつかないのですよ」、高名なテクノウィザードの主張。'
					]));
					
					if (Game.Objects['宇宙船'].amount>0) list.push(choose([
					'ニュース : 新しいチョコレート惑星を発見、クッキー燃料の宇宙船の到達目標に!',
					'ニュース : 99.8%がチョコレートの大質量惑星、コアが純粋な黒いチョコレートであると証明される!',
					'ニュース : 遠方の惑星への宇宙旅行が、暇を持て余した億万長者たちの注目を集め急騰!',
					'ニュース : 遠方の惑星でチョコレートでできた微生物を発見!',
					'ニュース : 遠方の惑星で太古のベーカリーを発見、「どことなく恐ろしい」、と専門家。'
					]));
					
					if (Game.Objects['錬金術室'].amount>0) list.push(choose([
					'ニュース : 貴金属のチョコレートへの交換数がさらに増加、国民の金の貯蓄量が低下!',
					'ニュース : チョコレートの宝石が流行の最先端に、専門家が発言、金とダイヤモンドは「流行ってただけ」!',
					'ニュース : 銀をホワイトチョコに変質させられることを発見!',
					'ニュース : 欠陥研究所閉鎖、クッキーを役に立たない金に変換していたことが発覚。',
					'ニュース : 純正主義者、錬成されたチョコレートを忌避!'
					]));
					
					if (Game.Objects['ポータル'].amount>0) list.push(choose([
					'ニュース : 異次元へのポータルから出現した怪物はますます国民を動揺させ、不安がらせている!',
					'ニュース : 異次元へのポータルはやがて街を飲み込む災害へとなるだろう!',
					'ニュース : クッキーバースへの旅行が退屈なティーンエイジャーたちに人気!死傷率は73%超え!',
					'ニュース : クッキーバースへのポータルは急速な老化とクッキー作りに取りつかれる疑いがあるとの研究結果が。',
					'ニュース : 「ポータル付近で生活しないように」専門家が警告、「子供の気が狂い、精神が崩壊するおそれがある」'
					]));
					
					if (Game.Objects['タイムマシン'].amount>0) list.push(choose([
					'ニュース : タイムマシンは歴史改変の不祥事を意味する!あるいはその事実は…?',
					'ニュース : タイムマシンが非合法的に時間旅行に使われていた!',
					'ニュース : 過去から持ち帰られたクッキーは「人間が消費するには適さない」、と歴史家が指摘。',
					'ニュース : 歴史的な芸術作品が話している間にクッキー生地の塊にすり替えられる奇妙な事件!',
					'ニュース : 「未来を見てきたよ」タイムマシンのオペレーターが暴露。「もう、二度と見たくないね。」'
					]));
					
					if (Game.Objects['反物質凝縮器'].amount>0) list.push(choose([
					'ニュース : 全都市が反物質凝縮器によるブラックホールに飲み込まれているのは一目瞭然、街は「もはや物質が存在しない」確固たる証拠である!',
					'ニュース : 「何故クッキーを焼くために粒子加速器が必要なのかもう一度説明してください」頓珍漢な質問をする地元の女性。',
					'ニュース : 最初の反物質凝縮器の電源投入に成功、物質の分解には至らず!',
					'ニュース : 研究者達はクッキー産業が必要としている物は後にも先にも「大量の永久磁石」であると結論づけた。',
					'ニュース : 「よりおいしいクッキーを焼くためだけに物質の構造を解明してきたのです」、と科学者たちが主張。'
					]));
					
					if (Game.Objects['プリズム'].amount>0) list.push(choose([
					'ニュース : プリズムが新しいクッキーの製造法になってから、虹関係の商品が急に売れ出した。',
					'ニュース : 科学者たちは、組織的に光を物質に変換することに警告を発している。「いつか我々は、光をあらゆる物質に変換し尽くすところまで行ってしまうだろう」',
					'ニュース : 新しいプリズム装置のおかげで、今やクッキーは、文字通り光の速さで生み出されている。',
					'ニュース : 「プリズムに監視されてる…お前ら気付かないのか?」、と呟くあきれた男。「何を言っているかわからない」クッキー関係者や政府職員、肩をすくめる。',
					'ニュース : 世界市民が頻発する空気発光現象に関して忠告。「心配ない」',
					]));
					
					if (Game.Objects['チャンスメーカー'].amount>0) list.push(choose([
					'ニュース : 天気予報が前代未聞の3日連続的中といった、統計的に狂った異常現象が頻発!',
					'ニュース : 全ギャンブラーが1週間に渡る謎の勝ち続きで、地元カジノが破産!「多分なんとかなるでしょう」発言後のオーナーに47回目の落雷直撃。',
					'ニュース : 隣国の大統領選挙で予期せぬ異変が!選出されたのはどういうことか、賢明な政策を掲げる人物。',
					'ニュース : 百万に一の可能性!グリッティ映画のリブート版、オリジナルを越えた出来栄えと判明!「何故こんな事が起こり得るのか皆目わからん」、映画業界上層部の弁。',
					'ニュース : 全スクラッチくじに当たりを印刷し急速に破綻した国民経済、予想を覆したったの一晩ですっかり回復。',
					]));
					
					if (Game.Objects['自己無限生成エンジン'].amount>0) list.push(choose([
					'ニュース : 「クッキークリッカーはもう止めた」地元のある男、絶え間なき自己参照「どこまでも正確精密な格子」に辿り着く。',
					'ニュース : 地元のある男、自分自身を見つけようと世界中を帆走 - 分離した自分を正しい位置に戻すため。',
					'ニュース : 「全ての者に我々の小さな欠片が存在するのです」説法する地元のある教祖、食人疑惑で逮捕。',
					'ニュース : 女性ライターは今の仕事は夢であって現実でないと感じた。正確には、彼女自身が目を覚ますまでは。 ',
					'ニュース : 世論調査で判明、クッキーからクッキーを作る着想は「あり」 - 「どうせ中身は同じっしょ？」取材に応じた市民の声。',
					]));
					
					if (Game.Objects['Javascriptコンソール'].amount>0) list.push(choose([
					'ニュース : Emma.jsやLiam.jsのような奇妙な名前を子供に付けるのが親の間に流行っている。少なくともBaby.jsが報告した中では。',
					'ニュース : コーディングが大流行!プログラミングのような技術の世界に転向する若者が増え、将来のロボカリプスと人類にとっての悪夢が保障された。',
					'ニュース : 3単語の組み合わせは全て使われつくしてしまったので、開発者たちは新しいjavascriptライブラリを何と呼ぶかで困っている。',
					'ニュース : 国家は、ネストされたifたちが孵化するのを固唾をのんで見守っている。',
					'ニュース : 間抜けなコピーライターがシングルクォートをエスケープするのを忘れたので、ニュースの文章が早く終わってしまった。最後の文は「えー、なんで無',
					]));
					
					if (Game.Objects['遊休宇宙'].amount>0) list.push(choose([
					'ニュース : 別の宇宙にいる別のあなたは夢を実現しているのか?たぶんね、怠け者の無能め!',
					'ニュース : 無限の放置ゲームでできた宇宙という考えに民衆は反発。「もっとなんかあればと思っていたのに」、取り乱した市民の声。',
					'ニュース : 並行宇宙が無限にあるので、人々は安心できる別次元へ移るが、その数は「50代後半」しかない。',
					'ニュース : 「少なくとも何人かの別の私は別の場所でうまくやっているだろうという情報に慰められている」、多元宇宙にいる市民の最後の生き残りのお手本の声。',
					'ニュース : プロットの怪しい点を擁護するため、漫画作家が実際の多元宇宙へ指摘。「な?それは『陳腐で不自然』と言っただろ!」'
					]));
					
					if (Game.season=='halloween' && Game.cookiesEarned>=1000) list.push(choose([
					'ニュース : クネクネした異様な生物がクッキー工場周辺に大量発生！製造ラインにかじりつく!',
					'ニュース : 不気味にしわがれたモンスター、工場のクッキーを出来たそばから貪る!「衛生面は終わってる」工場職員に不安広がる。',
					'ニュース : 異教の儀式が蔓延中!世界中の子供が奇妙な格好で住民から菓子を恐喝!',
					'ニュース : 郊外で新種のテロリストが出没!家宅は工作用の卵とトイレットペーパーまみれに!',
					'ニュース : ハロウィンのお菓子が全部クッキーに変わって、お子様棒立ちで「呆然」。'
					]));
					
					if (Game.season=='christmas' && Game.cookiesEarned>=1000) list.push(choose([
					'ニュース : ソリで爆走する狂ったひげ男の目撃相次ぐ!詳細は未だ不明。',
					'ニュース : サンタクロース、クッキー味のシリアルに匹敵する新しい朝のお菓子を発表。「ホッホッホ　恐ろしいぞ」サンタが声明。',
					'ニュース : 「ただでなんでもくれてやるって?」母親たち疑問。「正直あのあごひげが胡散臭いわ」',
					'ニュース : 陽気なデブ奇人、未だ捕まらず!政府関係者が警告「子どもたちを安全な場所に。煙突に蓋を。これは冗談ではありません」',
					'ニュース : サンタがコスプレしたお父さんじゃなかったことを知って児童驚愕!「これまでの人生がなんだったのか…考えを改めているところ」 - そう打ち明けるローラさん(6)',
					'ニュース : 謎のお祭りムードが、トナカイ軍による甚大な破壊を助長している - 政府関係者が声明。',
					'ニュース : おもちゃ工場のエルフがストライキ!「トナカイの餌で現物支給はもう止めろ!あと俺たちをエルフって呼ぶな!」',
					'ニュース : 全国各地でエルフの抗議活動。チンケでふざけた衣装のチンケな小人が騒乱と破壊活動を繰り広げ、凶暴なトナカイが我が物顔で通りを爆走。',
					'ニュース : エルフ戦争の真っ只中、トナカイの複数形に「s」は必要か否かを議論する学者達。',
					'ニュース : エルフは「小さな身長と陽気な性格の特徴を以ってしても、ノームとは全く無関係」科学者が発見。',
					'ニュース : エルフ、放射性アイシング工場を襲撃し破壊、付近住民の数百人が盲目に。「正気の沙汰じゃない」被害を受けた市長が哀哭。',
					'ニュース : ルドルフの赤鼻に関し俄に浮上した噂の件で、北極で新たな展開が。「俺、あれにちょっとばっかし依存し過ぎかも…」渦中のトナカイが告白。'
					]));
					
					if (Game.season=='valentines' && Game.cookiesEarned>=1000) list.push(choose([
					'ニュース : 臓器型のお菓子の交換が全国の学校で行われている。調査で明かされた身の毛もよだつ慣習。',
					'ニュース : スイーツ業界で猛威を振るうハート型キャンディー、クッキー帝国の牙城を崩す尖兵となるか。「経済こそが重要なのだよ、キューピッド!」',
					'ニュース : 気象専門家によると、大気中の愛の濃度が上昇。現在、大気汚染緊急対策実施中の全都市でフェイスマスクを配布中。',
					'ニュース : クッキーとの結婚 - 常軌を逸する行為か、はたまた、未来の片鱗か。',
					'ニュース : 【悲報】ヴァレンタインデーに恋人にクッキーを贈ったら振られた男性。「だってノーブランド品だったのよ」肩を竦める元カノ。'
					]));
					
					if (Game.season=='easter' && Game.cookiesEarned>=1000) list.push(choose([
					'ニュース : 長耳の毛羽立った尻尾を持つ生物が郊外に侵入、恐怖とチョコレートを撒き散らす!',
					'ニュース : 何故こんな所に?次々と具現化を始める卵。「安全な場所など無い」専門家が警告。',
					'ニュース : 凶暴なウサギの群れにより、数十億円の物的被害。対策として新たなミクソマトーシスウィルス株が開発された。',
					'ニュース : 産卵するウサギ「この次元からとは限らない」生物学者が警告。「決して触れない、餌を与えない、料理に使わないように」との忠告。',
					'ニュース : 謎のウサギは産卵性だが哺乳類であることが判明、カモノハシと同系統の可能性を示している。'
					]));
				}
				
				if (Math.random()<0.05)
				{
					if (Game.HasAchiev('10進法')) list.push('ニュース : もはや常識を忘れたクッキー製造業者、キリのいい数字への異常な執着心を引き起こす建築物の建設を決定!');
					if (Game.HasAchiev('最初から')) list.push('ニュース : お涙頂戴!すべてを諦めることにした地元のクッキー製造業者についての貧富の差を巡る物語!');
					if (Game.HasAchiev('クッキーで埋まった世界')) list.push('ニュース : 我々の世界は今やクッキーですし詰め状態！隙間なんてありゃしない!');
					if (Game.HasAchiev('最後の一匹')) list.push('ニュース : なんと、絶滅寸前の希少なアルビノしわしわ虫を、クッキー亡者のペイストリー長者が密猟!');
					if (Game.Has('発見能力')) list.push('ニュース : 地元のクッキー製造業者、奇跡的復活を果たす!');
					if (Game.Has('季節切り替え装置')) list.push('ニュース : 季節の法則が完全に乱れる!「こりゃ何度かぶっ叩かないと直らないかもな」現地住民は語る。');
					
					if (Game.Has('お手伝い猫')) list.push('ニュース : 地元のクッキー施設の近辺からかすかな猫の鳴き声。新しい材料として実験台にされている可能性も。');
					if (Game.Has('労働者猫')) list.push('ニュース : 地元のクッキー施設の周辺で、小さな安全ヘルメットを被った仔猫の鳴き声が響き渡っているとの報告。');
					if (Game.Has('技術者猫')) list.push('ニュース : 地元のクッキー施設一帯で現在、可愛らしい小さなスーツを着た仔猫の群れが出現。管理者たちは家屋から離れるよう忠告。');
					if (Game.Has('監督者猫')) list.push('ニュース : 偉そうな仔猫の群れが可愛らしい鳴き声で通行人に命令していると、地元メディアが報道。');
					if (Game.Has('管理者猫')) list.push('ニュース : 地方支社の作業室を強襲した威圧的な仔猫の軍隊、従業員に尋ねる。「調子はどうかにゃー?」');
					if (Game.Has('会計士猫')) list.push('ニュース : 小さな猫が突如ファジー数学と多項式をマスター。驚異的な才能開花に、困惑する科学者とペットショップオーナー。');
					if (Game.Has('専門家猫')) list.push('ニュース : 来週、新たな仔猫専門学校が開校。授業科目は、クッキー作りと猫じゃらし。');
					if (Game.Has('熟練者猫')) list.push('ニュース : 酷い失業率高騰の原因は、全専門分野で職を独占している愛らしい仔猫に依るもの。研究で判明。');
					if (Game.Has('相談役猫')) list.push('ニュース : 「恐らく将来的に、君の仕事は猫に取って代わられるんじゃないかにゃ」と、胡散臭い毛むくじゃらの未来学者が予言。');
					if (Game.Has('地区担当責任者補佐猫')) list.push('ニュース : 武道オタクのマジキチ猫、地元のビーツ農場でうろついているところを発見!');
					if (Game.Has('市場商猫')) list.push('ニュース : 田園地帯の至る所に馬鹿げた立て看板が突如出現、タダで仕入れたクッキーを住民に売りつけようとしている!');
					if (Game.Has('分析者猫')) list.push('ニュース : あなたはお金を賢く遣ってますか?多額報酬獲得に向け、提案する分析者達!');
					if (Game.Has('役員猫')) list.push('ニュース : 子猫がセクシーで小さなビジネススーツを着ながら気取って歩き回り、アシスタントに激しく指示を叫ぶ姿、おそらく記者が今まで見た中で最もかわいい!');
					if (Game.Has('子猫の天使')) list.push('ニュース : 「目に見えぬ猫が耳の中でゴロゴロ鳴いていても無視すること」科学者が警告。「人生の選択を誤らせようとする罠だ」');
					if (Game.Has('子猫の給料')) list.push('ニュース : 子猫がガラスの天井を破る!どれだけ高いものなのかわかっているのか!');
					if (Game.HasAchiev('ジェリクル')) list.push('ニュース : 地元の子猫が誤ったミュージカル作品に巻き込まれ、観客はうろたえ混乱。');
				}
				
				if (Game.HasAchiev('こやつ、甘いな') && Math.random()<0.2) list.push(choose([
				'ニュース : 当局により解体された大規模な砂糖密輸団。'+Math.floor(Math.random()*30+3)+'トンもの砂糖の塊を押収し、'+Math.floor(Math.random()*48+2)+'人の容疑者を逮捕。',
				'ニュース : 当局から観光客へ警告、路上販売人の密造砂糖を買ってはいけない -「あなたにとっては甘い取引なのでしょうが、実際売られているのは、ありふれた只のコカインなんですよ」捜査官は語る。',
				'ニュース : 白砂糖バッシングに抗議活動する糖尿病賛成派。「過去'+Math.floor(Math.random()*10+4)+'年間、砂糖の塊だけを食べ続けてきたけど、全く調子が良いわよ!」と、肌の脆い女性が。',
				'ニュース : 砂糖の消費が子供たちに与える影響について、無気力にするのか活動過多にするのか、専門家の間で激しい意見の不一致。',
				'ニュース : 砂糖の塊運搬船が沈没する都度、魚の虫歯が増加するのを懸念する漁師。',
				'ニュース : 前代未聞のオークションで数百万人を魅了した希少な黒砂糖の塊は、一般的な有毒菌であることが判明。',
				'ニュース : 「ずっと昔はね、砂糖の塊っていうのは紅茶に入れる小さな角砂糖だったの。いま人々がランチで食べているような拳大の化物とは違うのよ」偏屈なボケ老人の愚痴。',
				'ニュース : 砂糖の塊を使ったスナック、全国で爆発的な大流行。全国の歯科医もニッコリ。'
				]));
				
				if (Math.random()<0.001)//apologies to Will Wright
				{
					list.push(
					'あなたは選ばれました。もうすぐ彼等が来るでしょう。',
					'彼等はすぐ近くに来ています。扉を開けるのは考え直した方がよいのでは。',
					'終末が近いです。支度しなさい。',
					'ニュース : ブロッコリーの頭をママに、残りを子供にプレゼント。家族に無関心な父親。',
					'ニュース : 中年なんてものは存在しない、でっち上げだ、研究による宣言。結局、体の姿勢が悪くなるんだから同じじゃないか。',
					'ニュース : 世の子猫たちはKittyKibble社製ペットフードの不足が解消するのを望んでいる。'
					);
				}
				
				if (Game.cookiesEarned>=10000) list.push(
				'ニュース : '+choose([
					'クッキーに'+choose(animals)+'の'+choose(['寿命の向上','知能の飛躍的向上','若返り','抜け毛の減少','関節炎の予防','視力の改善'])+'効果を発見!',
					'クッキーに'+choose(animals)+'を'+choose(['より従順に','より立派に','より格好良く','空腹になりにくく','より実用的に','より美味しく'])+'させる効果を発見!',
					'クッキーを'+choose(animals)+'に与えたところ、副作用は発見されず。',
					'意外にもクッキーは'+choose(animals)+'に好評!',
					'クッキー施設周辺の'+choose(animals)+'に奇妙な腫瘍、生物学者は「腫瘍は非常に多く見られる」とコメント。',
					'海外で新種の'+choose(animals)+'を発見。生物学者は「うん、クッキー味だ」とコメント。',
					'クッキーは'+choose([choose(['ロースト','トースト','ボイルド','ソテーした','ミンチにした'])+choose(animals),choose(animals)+'で作られた'+choose(['寿司','スープ','カルパッチョ','ステーキ','ナゲット'])])+'を和えるとおいしく頂ける、物議を醸したシェフのコメント。',
					'「あなたのクッキーに'+choose(animals)+'は含まれていますか?」、製品安全性協会が偽クッキーに警告。',
					'医師会、一日二回新鮮なクッキーを摂取することを推奨。',
					'医師会、チョコチップクッキー吸引に没頭する若者に警告。',
					'医師会、クッキーを選り好みする新しい食事療法をしないよう忠告。',
					'医師会、世の母親たちに「自家製クッキー」の危険性について警告。'
					]),
				'ニュース : 「'+choose([
					'クッキーは私の生き甲斐',
					'どうしてもクッキーを食べるのを止められない。本気で助けが必要かも',
					'私はクッキーで困っている',
					'私はクッキー中毒じゃない。そんなものは暇を持て余し過ぎたファンの憶測にすぎない',
					'今度のアルバムにはクッキーの歌を三曲収録している',
					'私は三日連続でクッキーの夢を見ている。正直な所、少し心配だ',
					'クッキーをよからぬことに使っているという告発はただの誹謗中傷だ',
					'クッキーは私が落ち込んでいる時に本当に助けてくれる',
					'私の完璧な美肌の秘訣はクッキーなの',
					'今度の映画の撮影中、クッキーはずっと私の正気を保ってくれた',
					'クッキーは私をスリムで健康にしてくれる',
					'ただ一言言いたい、一言、クッキー',
					'分かった、認めよう。私は生涯でクッキーを一枚たりとも食べたことはない'
					])+'」、話題のあの人が暴露。',
				choose([
					'ニュース : クッキーによる「世界の終末」は刻一刻と迫っていると予言した科学者、同僚たちの間で笑い者にされる。',
					'ニュース : クッキーを買うために銀行強盗をした男。',
					'ニュース : 機内食の問題に関し、事実、深刻なクッキー不足であることを科学者達が立証。',
					'ニュース : 飢餓国に数百トンものクッキーを空から投下。死者は数千人規模、国家は援助に感謝を表明。',
					'ニュース : 新たな研究で判明、クッキーは老化を早めるのでも緩やかにするのでもなく、代わりに「異なる方向へ向かわせる」。',
					'ニュース : 漁網で発見された異常成長の巨大クッキーは、成長ホルモン焼きについての問題を提起した。',
					'ニュース : 大都市で「食べ放題」のクッキーレストランがオープン。ウェイターは数分で蹂躙の憂き目に。',
					'ニュース : クッキー大食い大会で男性死亡。「大したパフォーマンスではなかったね」審査員の評。',
					'ニュース : 何がクッキーの味を相応しくするのか?「恐らくクッキーに入っている[*****]でしょう」、匿名の密告者が言及。',
					'ニュース : クッキーアレルギーの男性。「イカレてるにも程がある」家族がコメント。',
					'ニュース : 海外の政治家、クッキー密輸に関与か。',
					'ニュース : クッキーは今や'+choose(['咳止めドロップ','ブロッコリー','ニシンの燻製','チーズ','テレビゲーム','安定した仕事','人間関係','タイムトラベル','猫のビデオ','タンゴ','ファッション','テレビ','核戦争','我々がこれまでに食べてきたいかなる物','政治','酸素','ランプ'])+'以上に人気との研究結果。',
					'ニュース : 国民を揺るがす肥満の原因、専門家は'+choose(['トゥワークダンス','クソッタレなラップミュージック','テレビゲーム','クッキー欠乏','幽霊の実体','エイリアン','両親','学校','マンガ','クッキー吸引の熱中'])+'と分析。',
					'ニュース : クッキー不足に見舞われた町、住民は仕方なくカップケーキを口に。「まったくの別物」不本意ながら認める市長。',
					'ニュース : 「受け入れなさい、このすべてのクッキーの原料は少々呪われている」、妄言者の戯言。',
					//'News : scientists advise getting used to cookies suffusing every aspect of life; "this is the new normal", expert says.',
					//'News : doctors advise against wearing face masks when going outside. "You never know when you might need a cookie... a mask would just get in the way."',//these were written back when covid hadn't really done much damage yet but they just feel in poor taste now
					'ニュース : 火星に生命はいるのか?現在、様々なチョコレートバー製造業者が細菌汚染について調査中。',
					'News : "so I guess that\'s a thing now", scientist comments on cookie particles now present in virtually all steel manufactured since cookie production ramped up worldwide.',
					'News : trace amounts of cookie particles detected in most living creatures, some of which adapting them as part of new and exotic metabolic processes.',
				]),
				choose([
					'ニュース : 出演者不足で制作中止となった映画、「みんな家でクッキーを食べてるんだ」嘆き悲しむディレクター。',
					'ニュース : 消化不良のため、クッキー番組収録の中止を余儀なくされたコメディアン。',
					'ニュース : クッキーの新興宗教が一世を風靡。',
					'ニュース : 化石記録が示す、カンブリア大爆発で繁栄したクッキー有機体の存在。科学者が発表。',
					'ニュース : 奇妙な違法クッキーを摘発。「おぞましい味」と、警察が発表。',
					'ニュース : クッキーを摂取後死亡したとみられる男性を発見。「マフィアの密告者」か。',
					'ニュース : 「宇宙は非常に大きな輪を描いている」、研究者が提唱。「クッキーの遥か彼方まで」',
					'ニュース : 些細なクッキー事故から町中は灰に。隣接都市に再建用の「チップ」を要請。',
					'ニュース : 我々のメディアはクッキー産業に支配されている?事実にしようと思えばできるだろう、愚かな陰謀論者の証言。',
					'ニュース : '+choose(['科学者曰く、「大方予想通りの」ありふれたポップコーン味のクッキー。','全穀物ぶっちぎりの最強シリアル味のクッキー。','研究の結果、クッキーは「胎児も含む」全年齢層で好まれている。','「Grandmother II ～潤～」上映中に爆発的に売れたポップコーン味のクッキー。']),
					'ニュース : 繁華街にクッキー専門のレストランがオープン。クッキーの蒸し焼きからクッキーのテルミドール、デザートにはクレープも。',
					'ニュース : インタビューを受けたオランウータン、一言「ウーク」。',
					'ニュース : クッキーは'+choose(['永遠の命','無限の富','永遠の若さ','永遠の美しさ','脱毛症の治療','世界平和','食糧難の解決','世界中の戦争の終結','地球外生命体とのコンタクト','読心術','健康な暮らし','健全な食生活','もっと面白いテレビ番組','超光速旅行','画期的なベーキング技術','チョコレートの滋養成分','空想上の理想'])+'の鍵となるだろう。科学者が発表。',
					'ニュース : '+choose(['さほど風味豊かではない','反道徳的な類いの'])+'フレーバーテキスト',
				]),
				choose([
					'ニュース : ゴールデンクッキーはどんな味?研究で判明、ゴールデンクッキーの味は「スペアミントと甘草の中間のような」味。',
					'ニュース : レッドクッキーはどんな味?研究で判明、レッドクッキーの味は「血入りソーセージと海水の両方を兼ねた」味。',
					'ニュース : 消費者調査によると、'+Game.bakeryName+'ブランドのクッキーは「他社製品に比べ'+choose(['生焼けが極めて少ない','とても風味がいい','まあゴミ以下って事はない','鳥肌はそんなに立たない','毒性が低い','より食用に適している','洗練されている','ほんの少しだけ良い','シャレオッティ','間違いなく健康的','客観的に良い選択','不味さは控えめ','断然クッキーっぽい','僅かに安い'])+'」。',
					'ニュース : 今年の赤ちゃんの名前人気ランキング一位は「'+Game.bakeryName+'」になる模様。',
					'ニュース : クッキーのことなら、'+Game.bakeryName+'。最新の人気調査。',
					'ニュース : 世界的に有名なクッキー製造業者に倣い、主要都市を'+Game.bakeryName+'市に改名する動き。',
					'ニュース : 世界的に有名なクッキー製造業者に倣い、'+choose(['通り','学校','介護施設','スタジアム','新しいファーストフードチェーン店','新惑星','新たな病気','人喰いバクテリア','致死性ウイルス',choose(animals)+'の新種','新しい法律','赤ちゃん','プログラミング言語'])+'を'+Game.bakeryName+'と命名する動き。',
					'ニュース : 今夜放映の伝記映画、'+Game.bakeryName+'成功へのエレベーター、お見逃しなく!',
					'ニュース : 今夜放送、'+choose(['ブロプラ','ブラビッド・ブレターマン','ブリミー・ブリンメル','ブレレン・ブレジェネレス','ブリミー・ブラロン','ブロナン・ブロブライエン','ブレイ・ブレノ','ブロン・ブリュワート','ブレーヴン・ブロルベア','次元7-B19の支配者トキシックフロン',Game.bakeryName+'自身の邪悪なクローン'])+'氏が'+Game.bakeryName+'にインタビュー!是非ご覧ください!',
					'ニュース : 全ネット利用者を未だに苛つかせる無意味な「参照」。「うん、だけど何で『たまご』?」',
					'ニュース : 有名な経済学者の発言。「話題の投稿動画『過剰に大量なクッキー』は、我々の世界に差し迫る危機の『悍ましい実録』と成り得る」',
					'ニュース : 「去年から流行のミームが、どういう訳か未だに関連ワードに上っている」専門家は嘆く。',
					'ニュース : 調査の結果、10代の若者の間で人気独走のクッキー絵文字は「批判上等のハンドサイン」と「胡散臭い面したダークムーン」',
				]),
				choose([
					'ニュース : 不自然なハゲ頭の新生児誕生が相次ぐ。古代宇宙人の秘密結社は関与を否定。',
					'ニュース : 「この時点で、クッキーは経済と切っても切れない関係に」経済学者は語る。「他の何かを食用とするならば、我々は全滅してしまう」',
					'ニュース : ダジャレ見出しが引き起こした惨事、とある街で激怒した住民が暴徒化。負傷者21名、死者5名、市長は未だ行方不明。',
					'ニュース : WとRキーの間のキーがこわｒた、大至急新しいタイプライターを送っｔくｒ。',
					'ニュース : 「新しいEEEEEEキーぜええええええええっ好調!」上機げえええええええんな報道関けえええい者からの報告。',
					'ニュース : 現在、クッキーの非合法取引が見放された複数の途上国で横行。政治的緊張が高まる。こりゃ戦争かな?',
					'ニュース : 激昂したラジオ番組の司会者、クッキーのピクセルアイコンに言いたい放題。「クッキーがちっとも揃ってない!誰もそんなの気付かないって?俺だけ?クソッ、ヤバイクスリを飲んだ気分だ!」',
					'ニュース : '+choose(['クッキーの批判','CookieClicker以外のゲームプレイ','ピザにパイナップル','不機嫌','蚊','ブロッコリー','人間の膵臓','悪天候','ネットの釣りタイトル','ダビング','インターネット','ミーム','ミレニアル世代'])+'禁止法が遂に成立、国民はやんややんやの大喝采!',
					'ニュース : '+choose(['地元のある','周辺地域のある'])+choose(['男性','女性'])+'、自分探しの旅先でクッキーを発見 : 「一体何を期待していたんだ自分は。」',
					'ニュース : 昏睡状態から目覚めた'+choose(['男性','女性'])+'、'+choose(['久し振りのクッキー摂取を試み、死亡。','直ぐに後悔する。','「なぜ今はクッキーだらけなのか」と首を傾げる。','我々が常食している「非クッキー食品」と思われる物に関し、支離滅裂な戯言を吐き散らす。','主な動機にクッキーを挙げる。','クッキーを欲しがる。']),
					'ニュース : ペットに'+choose(animals)+'、危険な流行か、金を生む新たな市場と成るか?',
					'ニュース : タイピング担当者は、他の誰かが変更と称してニュースを こ ん な 風 に してしまっても、特に気にしないんじゃない?',
					'ニュース : 「平均的な人々が一年間に焼くクッキーの量は'+Beautify(Math.ceil(Game.cookiesEarned/7300000000))+'枚」 この流説は統計エラーで信憑性が無いと判明。'+Game.bakeryName+'が存続期間中に焼いた'+(Math.ceil(Game.cookiesEarned/7300000000)==1?'':'')+'枚のクッキーは、極めて乖離した外れ値であり、データ除外すべきとのこと。'
					])
				);
			}
			
			if (list.length==0)
			{
				if (Game.cookiesEarned<5) list.push('君はクッキーを作りたい気分だ。しかし誰も君のクッキーなんて食べたくない。');
				else if (Game.cookiesEarned<50) list.push('君の処女作はゴミ箱行きだ。近所のアライグマくらいしか触らない。');
				else if (Game.cookiesEarned<100) list.push('君の家族は君のクッキーを食べてみることにした。');
				else if (Game.cookiesEarned<500) list.push('君のクッキーは近所じゃ評判だ。');
				else if (Game.cookiesEarned<1000) list.push('みんな君のクッキーについて噂をし始めた。');
				else if (Game.cookiesEarned<5000) list.push('数マイルに渡って君のクッキーは話題になっている。');
				else if (Game.cookiesEarned<10000) list.push('君のクッキーは町中で好評だ!');
				else if (Game.cookiesEarned<50000) list.push('子供達はみんな君のクッキーを食べたがる。');
				else if (Game.cookiesEarned<100000) list.push('今じゃ君のクッキーのホームページがある!');
				else if (Game.cookiesEarned<500000) list.push('君のクッキーには大金を払う価値がある。');
				else if (Game.cookiesEarned<1000000) list.push('君のクッキーは遠い国でもよく売れる。');
				else if (Game.cookiesEarned<5000000) list.push('君のクッキーを味わいたいがために遠方から人が来る。');
				else if (Game.cookiesEarned<10000000) list.push('世界中の王も妃も君のクッキーがお気に入りだ。');
				else if (Game.cookiesEarned<50000000) list.push('今じゃ君のクッキーが収められた博物館がある。');
				else if (Game.cookiesEarned<100000000) list.push('君のクッキーを称える記念日が出来た。');
				else if (Game.cookiesEarned<500000000) list.push('君のクッキーは世界の不思議の一つと言われている。');
				else if (Game.cookiesEarned<1000000000) list.push('今じゃ歴史書は君のクッキーにまるまる一章をあてている。');
				else if (Game.cookiesEarned<5000000000) list.push('君のクッキーは政府が監視している。');
				else if (Game.cookiesEarned<10000000000) list.push('地球上のみんなが君のクッキーを気に入っている!');
				else if (Game.cookiesEarned<50000000000) list.push('近くの星の未知の生き物が君のクッキーを食べたがっている。');
				else if (Game.cookiesEarned<100000000000) list.push('君のクッキーを食べるため、全宇宙の古の神々が目覚めた。');
				else if (Game.cookiesEarned<500000000000) list.push('君のクッキーを味わうためだけに別次元から生命体がやってくる。');
				else if (Game.cookiesEarned<1000000000000) list.push('君のクッキーは意志を持つようになった。');
				else if (Game.cookiesEarned<5000000000000) list.push('もはやこの宇宙は分子レベルでクッキー生地に変化している。');
				else if (Game.cookiesEarned<10000000000000) list.push('君のクッキーは宇宙の法則すら塗り替える。');
				else if (Game.cookiesEarned<10000000000000) list.push('地元のニュース番組が君のクッキーの特集を10分報道した。やったね!(記念にクッキー 1 枚を贈呈された)');
				else if (Game.cookiesEarned<10100000000000) list.push('もうやめ時だ。');//only show this for 100 millions (it's funny for a moment)
			}
			
			//if (Game.elderWrath>0 && (Game.pledges==0 || Math.random()<0.2))
			if (Game.elderWrath>0 && (((Game.pledges==0 && Game.resets==0) && Math.random()<0.5) || Math.random()<0.05))
			{
				list=[];
				if (Game.elderWrath==1) list.push(choose([
					'ニュース : 数百万人もの老婦人が失踪!',
					'ニュース : 老婦人の行列、クッキー施設近辺で目撃される!',
					'ニュース : 世界中の家族、祖母の姿に動揺し、立ち尽くす!',
					'ニュース : 医師ら、目に生気がなく口から泡を出す老婦人の集団に囲まれる!',
					'ニュース : 診断書、老婦人の周囲に「奇妙なクッキー生地の臭い」!'
				]));
				if (Game.elderWrath==2) list.push(choose([
					'ニュース : 混乱した町では奇妙な老婆たちが幼児を連れ去り、クッキー用の調理器具を強奪しようと住宅に侵入!',
					'ニュース : 各地でギラついた目をした恐ろしい老婆の集団を目撃!',
					'ニュース : 遭難した一家の証言「住んでいる女性がゆっくりと椅子に凝着していった!」',
					'ニュース : 全世界に家出した老婆の集団!',
					'ニュース : ストリートで硬直した老婆、生暖かい砂糖の液体を分泌する!'
				]));
				if (Game.elderWrath==3) list.push(choose([
					'ニュース : 大陸の巨大な「肉のハイウェイ」の痕跡は各地のクッキー施設を繋いでいた!',
					'ニュース : 宇宙から見た様は明らかに萎びた「触手」!',
					'ニュース : 肉の建造物に変貌している最中の硬直した「老婆」の残骸が発見される!', 
					'ニュース : 全ての希望が潰えるかの如き苦痛!肉と生地に全都市が飲み込まれる!',
					'ニュース : 悪夢は続く、驚異的な速度で萎びた大量の肉塊は拡大する!'
				]));
			}
			
			if (Game.season=='fools')
			{
				list=[];
				
				if (Game.cookiesEarned>=1000) list.push(choose([
					'オフィスチェアは実に快適だ。',
					'商談成立は最高の気分だな!',
					'君は'+choose(['契約書の署名','必要書類の記入','チームとの連絡の遣り取り','やり甲斐のある新たな展望についての検討','卓上玩具で遊ぶこと','新しいネームプレートの獲得','セミナー参加','テレビ会議','精力的な若手幹部の採用','新たな投資家との面会','会社の室内ミニゴルフ'])+'に丸一日かかりきりだった!',
					'今日の一言 : '+choose(['ウィルス性','検索エンジン最適化','ブラグとウォブサイト','ソーシャルネットワーク','Web3.0','物流管理','利益効果','ブランド化','事前対策','相乗効果','市場調査','人口統計','円グラフ','ブログ似','ブログに富んだ','ブログ的な','信頼性','電子メール','携帯電話','ラップミュージック','クッキー','たぶんね'])+'。',
					'儲かる予感がするぞ!'
				]));
				if (Game.cookiesEarned>=1000 && Math.random()<0.1) list.push(choose([
					'もっとクッキーが焼ければ、言う事無しなんだけどなぁ。',
					'ああ。その無駄で無意味な報告書についてだよ。',
					'今日も今日とてパラダイス!',
					'頑張ってるかい?それともサボりかな?'
				]));
				
				
				if (Game.TickerN%2==0 || Game.cookiesEarned>=10100000000)
				{
					if (Game.Objects['グランマ'].amount>0) list.push(choose([
					'延し棒が良い仕事をしているね!',
					'生産は順調!'
					]));
					
					if (Game.Objects['グランマ'].amount>0) list.push(choose([
					'オーブンは休むことなく大回転。',
					'一釜分、焼き過ぎて焦げちゃったか。うーん、まいっか。'
					]));
					
					if (Game.Objects['農場'].amount>0) list.push(choose([
					'キッチンから大量のクッキーをお届けだ。',
					'今日からキッチンに新人が加わるぞ!'
					]));
					
					if (Game.Objects['工場'].amount>0) list.push(choose([
					'工場では延々と生み出されるクッキーの列が。',
					'工場の従業員がストライキ!',
					'工場の安全点検日だ。'
					]));
					
					if (Game.Objects['鉱山'].amount>0) list.push(choose([
					'秘伝のレシピは巨大地下金庫にしっかり保管だ。',
					'シェフが新しい秘伝のレシピに取り組んでいる!'
					]));
					
					if (Game.Objects['宇宙船'].amount>0) list.push(choose([
					'スーパーは、笑顔と腹ペコのお客で大賑わいだ。',
					'スーパーは、どこもかしこもクッキー商品でいっぱい!'
					]));
					
					if (Game.Objects['錬金術室'].amount>0) list.push(choose([
					'証券取引所で期待の新規上場日。トレーダー達は人気銘柄を十分に確保できず!',
					'株価が分刻みで倍増だ!'
					]));
					
					if (Game.Objects['ポータル'].amount>0) list.push(choose([
					'連続テレビ番組、最新の回を今から放送!',
					'クッキーをテーマにしたテレビ番組が映画化!鋭意脚色中!'
					]));
					
					if (Game.Objects['タイムマシン'].amount>0) list.push(choose([
					'テーマパークは繁盛している - 吐瀉物も、ジェットコースター事故による犠牲者の血溜まりも、敷物の下に綺麗に掃き集められている。些かの問題もない!',
					'お客はジェットコースターに乗る前にクッキーの買い食いで満腹になってしまう。清掃員をもっと雇ったほうがいいかもね。'
					]));
					
					if (Game.Objects['反物質凝縮器'].amount>0) list.push(choose([
					'クッキーコインは公式的に人類歴史上最も採掘されたコインです!',
					'クッキーコインで不正操作が横行!'
					]));
					
					if (Game.Objects['プリズム'].amount>0) list.push(choose([
					'君の企業国家で新しく議会が発足!',
					'君は新たな国を併合した!',
					'新たな国家が、大クッキー複合企業体に加盟した!'
					]));
					
					if (Game.Objects['チャンスメーカー'].amount>0) list.push(choose([
					'クッキースポンサー付きの惑星による銀河間連盟、経常利益の記録的な大増を報告!',
					'惑星併合により数十億もの貧困層の異星人が、喜び勇んで君の労働力に加わった!',
					'星間高速道路の通行料が一新、更なる利益がクッキー経済へと注ぎ込まれる!'
					]));
					
					if (Game.Objects['自己無限生成エンジン'].amount>0) list.push(choose([
					'君のクッキー政党は世論調査で圧倒的支持を受けている!',
					'君の各派閥・政党・諸派への強硬な事前工作のお蔭で、新たな親クッキー法は難なく可決された!',
					'君が任命した上院議員達は次から次へとクッキー禁止条例を破棄した!'
					]));
					
					if (Game.Objects['Javascriptコンソール'].amount>0) list.push(choose([
					'今やクッキーは人類の特徴の一つだ!おめでとう!',
					'タイムトラベラーの報告によると、この時代は後にあなたのおかげでクッキー黄金時代として知られるようになる!',
					'今やクッキーは人類の文化に深く根付き、未来の歴史家を困らせるだろう!'
					]));
					
					if (Game.Objects['遊休宇宙'].amount>0) list.push(choose([
					'生活の残りの側面すべてを世界的なクッキー産業に乗っ取られ民衆は驚愕!',
					'現在観測可能な範囲の宇宙で売られているありとあらゆる製品を遡るとあなたの会社となる!そしてそれはとても良いことだ。',
					'あなたの広がりゆく帝国に飲み込まれながら独占禁止法は無力な呻き声をもらす!'
					]));
				}
				
				if (Game.cookiesEarned<5) list.push('大安吉日、起業するには打って付けだね。');
				else if (Game.cookiesEarned<50) list.push('さあどんどん焼くんだ、じゃんじゃん焼くんだ!');
				else if (Game.cookiesEarned<100) list.push('いつか君のクッキー会社が市場を席巻する。現実味を帯びてきたようだね。');
				else if (Game.cookiesEarned<1000) list.push('景気は上々!');
				else if (Game.cookiesEarned<5000) list.push('手当たり次第にどんどん売り込め!');
				else if (Game.cookiesEarned<20000) list.push('皆が君のクッキーを財布を開いて待っている!');
				else if (Game.cookiesEarned<50000) list.push('ほぼ1日中、契約書の署名に追われているとはね!');
				else if (Game.cookiesEarned<500000) list.push('年間ビジネス王に、なんと君が選ばれた!');
				else if (Game.cookiesEarned<1000000) list.push('君のクッキーは世界中で大評判だ!やったな、大将!');
				else if (Game.cookiesEarned<5000000) list.push('君のブランドは大衆文化の中にしっかりと根付いた。子供たちは会社の宣伝文句を朗らかに唱え、大人たちはそれらを甘く懐かしむ。');
				else if (Game.cookiesEarned<1000000000) list.push('いつもと変わらぬ営業日。トップの座もまた変わらぬ、善き哉!');
				else if (Game.cookiesEarned<10100000000) list.push('ふと君はこれまでの経歴を振り返る。君の一大クッキー帝国を基礎から築き上げる、魔法のように素晴らしい道程だった。');//only show this for 100 millions
			}
			
			for (var i=0;i<Game.modHooks['ticker'].length;i++)
			{
				var arr=Game.modHooks['ticker'][i]();
				if (arr) list=list.concat(arr);
			}
			
			Game.TickerEffect=0;
			
			if (!manual && Game.T>Game.fps*10 && Game.Has('フォーチュンクッキー') && Math.random()<(Game.HasAchiev('おお運命の女神よ')?0.04:0.02))
			{
				var fortunes=[];
				for (var i in Game.Tiers['fortune'].upgrades)
				{
					var it=Game.Tiers['fortune'].upgrades[i];
					if (!Game.HasUnlocked(it.name)) fortunes.push(it);
				}
				
				if (!Game.fortuneGC) fortunes.push('fortuneGC');
				if (!Game.fortuneCPS) fortunes.push('fortuneCPS');
				
				if (fortunes.length>0)
				{
					list=[];
					var me=choose(fortunes);
					Game.TickerEffect={type:'fortune',sub:me};
					Math.seedrandom(Game.seed+'-fortune');
					if (me=='fortuneGC') me='今日は幸運な日だ!';/*<br>Click here for a golden cookie.';*/
					else if (me=='fortuneCPS') me='君のラッキーナンバーは : '+Math.floor(Math.random()*100)+Math.floor(Math.random()*100)+Math.floor(Math.random()*100)+Math.floor(Math.random()*100)/*+'<br>Click here to gain one hour of your CpS.'*/;
					else
					{
						me=me.name.substring(me.name.indexOf('No.'))+' : '+me.baseDesc.substring(me.baseDesc.indexOf('<q>')+3);
						me=me.substring(0,me.length-4);
					}
					me='<span class="fortune"><div class="icon" style="vertical-align:middle;display:inline-block;background-position:'+(-29*48)+'px '+(-8*48)+'px;transform:scale(0.5);margin:-16px;position:relative;left:-4px;top:-2px;"></div>'+me+'</span>';
					Math.seedrandom();
					list=[me];
				}
			}
			
			Game.TickerAge=Game.fps*10;
			Game.Ticker=choose(list);
			Game.AddToLog(Game.Ticker);
			Game.TickerN++;
			Game.TickerDraw();
		}
		Game.tickerL=l('commentsText');
		Game.tickerBelowL=l('commentsTextBelow');
		Game.tickerCompactL=l('compactCommentsText');
		Game.TickerDraw=function()
		{
			var str='';
			if (Game.Ticker!='') str=Game.Ticker;
			Game.tickerBelowL.innerHTML=Game.tickerL.innerHTML;
			Game.tickerL.innerHTML=str;
			Game.tickerCompactL.innerHTML=str;
			
			Game.tickerBelowL.className='commentsText';
			void Game.tickerBelowL.offsetWidth;
			Game.tickerBelowL.className='commentsText risingAway';
			Game.tickerL.className='commentsText';
			void Game.tickerL.offsetWidth;
			Game.tickerL.className='commentsText risingUp';
		}
		AddEvent(Game.tickerL,'click',function(event){
			Game.Ticker='';
			Game.TickerClicks++;
			if (Game.TickerClicks==50) {Game.Win('タブロイド中毒');}
			
			if (Game.TickerEffect && Game.TickerEffect.type=='fortune')
			{
				PlaySound('snd/fortune.mp3',1);
				Game.SparkleAt(Game.mouseX,Game.mouseY);
				var effect=Game.TickerEffect.sub;
				if (effect=='fortuneGC')
				{
					Game.Notify('幸運!','ゴールデンクッキーが現れました。',[10,32]);
					Game.fortuneGC=1;
					var newShimmer=new Game.shimmer('golden',{noWrath:true});
				}
				else if (effect=='fortuneCPS')
				{
					Game.Notify('幸運!','CpS <b>1時間分</b> のクッキーを手に入れました(上限は所持数の2倍)。',[10,32]);
					Game.fortuneCPS=1;
					Game.Earn(Math.min(Game.cookiesPs*60*60,Game.cookies));
				}
				else
				{
					Game.Notify(effect.name,'新しいアップグレードが解禁されました。',effect.icon);
					effect.unlock();
				}
			}
			
			Game.TickerEffect=0;
			
		});
		
		Game.Log=[];
		Game.AddToLog=function(what)
		{
			Game.Log.unshift(what);
			if (Game.Log.length>100) Game.Log.pop();
		}
		
		Game.vanilla=1;
		/*=====================================================================================
		BUILDINGS
		=======================================================================================*/
		Game.last=0;
		
		Game.storeToRefresh=1;
		Game.priceIncrease=1.15;
		Game.buyBulk=1;
		Game.buyMode=1;//1 for buy, -1 for sell
		Game.buyBulkOld=Game.buyBulk;//used to undo changes from holding Shift or Ctrl
		Game.buyBulkShortcut=0;//are we pressing Shift or Ctrl?
		
		Game.Objects={};
		Game.ObjectsById=[];
		Game.ObjectsN=0;
		Game.BuildingsOwned=0;
		Game.Object=function(name,commonName,desc,icon,iconColumn,art,price,cps,buyFunction)
		{
			this.id=Game.ObjectsN;
			this.name=name;
			this.displayName=this.name;
			commonName=commonName.split('|');
			this.single=commonName[0];
			this.plural=commonName[1];
			this.actionName=commonName[2];
			this.extraName=commonName[3];
			this.extraPlural=commonName[4];
			this.desc=desc;
			this.basePrice=price;
			this.price=this.basePrice;
			this.bulkPrice=this.price;
			this.cps=cps;
			this.baseCps=this.cps;
			this.mouseOn=false;
			this.mousePos=[-100,-100];
			this.productionAchievs=[];
			
			this.n=this.id;
			if (this.n!=0)
			{
				//new automated price and CpS curves
				//this.baseCps=Math.ceil(((this.n*0.5)*Math.pow(this.n*1,this.n*0.9))*10)/10;
				//this.baseCps=Math.ceil((Math.pow(this.n*1,this.n*0.5+2.35))*10)/10;//by a fortunate coincidence, this gives the 3rd, 4th and 5th buildings a CpS of 10, 69 and 420
				this.baseCps=Math.ceil((Math.pow(this.n*1,this.n*0.5+2))*10)/10;//0.45 used to be 0.5
				//this.baseCps=Math.ceil((Math.pow(this.n*1,this.n*0.45+2.10))*10)/10;
				//clamp 14,467,199 to 14,000,000 (there's probably a more elegant way to do that)
				var digits=Math.pow(10,(Math.ceil(Math.log(Math.ceil(this.baseCps))/Math.LN10)))/100;
				this.baseCps=Math.round(this.baseCps/digits)*digits;
				
				this.basePrice=(this.n*1+9+(this.n<5?0:Math.pow(this.n-5,1.75)*5))*Math.pow(10,this.n)*(Math.max(1,this.n-14));
				//this.basePrice=(this.n*2.5+7.5)*Math.pow(10,this.n);
				var digits=Math.pow(10,(Math.ceil(Math.log(Math.ceil(this.basePrice))/Math.LN10)))/100;
				this.basePrice=Math.round(this.basePrice/digits)*digits;
				if (this.id>=16) this.basePrice*=10;
				if (this.id>=17) this.basePrice*=10;
				if (this.id>=18) this.basePrice*=10;
				if (this.id>=19) this.basePrice*=10;
				this.price=this.basePrice;
				this.bulkPrice=this.price;
			}
			
			this.totalCookies=0;
			this.storedCps=0;
			this.storedTotalCps=0;
			this.icon=icon;
			this.iconColumn=iconColumn;
			this.art=art;
			if (art.base)
			{art.pic=art.base+'.png';art.bg=art.base+'Background.png';}
			this.buyFunction=buyFunction;
			this.locked=1;
			this.level=0;
			this.vanilla=Game.vanilla;
			
			this.tieredUpgrades=[];
			this.tieredAchievs=[];
			this.synergies=[];
			this.fortune=0;
			
			this.amount=0;
			this.bought=0;
			this.highest=0;
			this.free=0;
			
			this.eachFrame=0;
			
			this.minigameUrl=0;//if this is defined, load the specified script if the building's level is at least 1
			this.minigameName=0;
			this.onMinigame=false;
			this.minigameLoaded=false;
			
			this.switchMinigame=function(on)//change whether we're on the building's minigame
			{
				if (!Game.isMinigameReady(this)) on=false;
				if (on==-1) on=!this.onMinigame;
				this.onMinigame=on;
				if (this.id!=0)
				{
					if (this.onMinigame)
					{
						l('row'+this.id).classList.add('onMinigame');
						//l('rowSpecial'+this.id).style.display='block';
						//l('rowCanvas'+this.id).style.display='none';
						if (this.minigame.onResize) this.minigame.onResize();
					}
					else
					{
						l('row'+this.id).classList.remove('onMinigame');
						//l('rowSpecial'+this.id).style.display='none';
						//l('rowCanvas'+this.id).style.display='block';
					}
				}
				this.refresh();
			}
			
			this.getPrice=function(n)
			{
				var price=this.basePrice*Math.pow(Game.priceIncrease,Math.max(0,this.amount-this.free));
				price=Game.modifyBuildingPrice(this,price);
				return Math.ceil(price);
			}
			this.getSumPrice=function(amount)//return how much it would cost to buy [amount] more of this building
			{
				var price=0;
				for (var i=Math.max(0,this.amount);i<Math.max(0,(this.amount)+amount);i++)
				{
					price+=this.basePrice*Math.pow(Game.priceIncrease,Math.max(0,i-this.free));
				}
				price=Game.modifyBuildingPrice(this,price);
				return Math.ceil(price);
			}
			this.getReverseSumPrice=function(amount)//return how much you'd get from selling [amount] of this building
			{
				var price=0;
				for (var i=Math.max(0,(this.amount)-amount);i<Math.max(0,this.amount);i++)
				{
					price+=this.basePrice*Math.pow(Game.priceIncrease,Math.max(0,i-this.free));
				}
				price=Game.modifyBuildingPrice(this,price);
				price*=this.getSellMultiplier();
				return Math.ceil(price);
			}
			this.getSellMultiplier=function()
			{
				var giveBack=0.25;
				//if (Game.hasAura('Earth Shatterer')) giveBack=0.5;
				giveBack*=1+Game.auraMult('大地を砕く者');
				return giveBack;
			}
			
			this.buy=function(amount)
			{
				if (Game.buyMode==-1) {this.sell(Game.buyBulk,1);return 0;}
				var success=0;
				var moni=0;
				var bought=0;
				if (!amount) amount=Game.buyBulk;
				if (amount==-1) amount=1000;
				for (var i=0;i<amount;i++)
				{
					var price=this.getPrice();
					if (Game.cookies>=price)
					{
						bought++;
						moni+=price;
						Game.Spend(price);
						this.amount++;
						this.bought++;
						price=this.getPrice();
						this.price=price;
						if (this.buyFunction) this.buyFunction();
						Game.recalculateGains=1;
						if (this.amount==1 && this.id!=0) l('row'+this.id).classList.add('enabled');
						this.highest=Math.max(this.highest,this.amount);
						Game.BuildingsOwned++;
						success=1;
					}
				}
				if (success) {PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);this.refresh();}
				//if (moni>0 && amount>1) Game.Notify(this.name,'Bought <b>'+bought+'</b> for '+Beautify(moni)+'クッキー','',2);
			}
			this.sell=function(amount,bypass)
			{
				var success=0;
				var moni=0;
				var sold=0;
				if (amount==-1) amount=this.amount;
				if (!amount) amount=Game.buyBulk;
				for (var i=0;i<amount;i++)
				{
					var price=this.getPrice();
					var giveBack=this.getSellMultiplier();
					price=Math.floor(price*giveBack);
					if (this.amount>0)
					{
						sold++;
						moni+=price;
						Game.cookies+=price;
						Game.cookiesEarned=Math.max(Game.cookies,Game.cookiesEarned);//this is to avoid players getting the cheater achievement when selling buildings that have a higher price than they used to
						this.amount--;
						price=this.getPrice();
						this.price=price;
						if (this.sellFunction) this.sellFunction();
						Game.recalculateGains=1;
						if (this.amount==0 && this.id!=0) l('row'+this.id).classList.remove('enabled');
						Game.BuildingsOwned--;
						success=1;
					}
				}
				if (success && Game.hasGod)
				{
					var godLvl=Game.hasGod('ruin');
					var old=Game.hasBuff('惨状');
					if (old)
					{
						if (godLvl==1) old.multClick+=sold*0.01;
						else if (godLvl==2) old.multClick+=sold*0.005;
						else if (godLvl==3) old.multClick+=sold*0.0025;
					}
					else
					{
						if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);
						else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);
						else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);
					}
				}
				if (success && Game.shimmerTypes['golden'].n<=0 && Game.auraMult('ドラゴンオーブ')>0)
				{
					var highestBuilding=0;
					for (var i in Game.Objects) {if (Game.Objects[i].amount>0) highestBuilding=Game.Objects[i];}
					if (highestBuilding==this && Math.random()<Game.auraMult('ドラゴンオーブ')*0.1)
					{
						var buffsN=0;
						for (var ii in Game.buffs){buffsN++;}
						if (buffsN==0)
						{
							new Game.shimmer('golden');
							Game.Notify('ドラゴンオーブ!','望みが叶った。ゴールデンクッキーが出現した。',[33,25]);
						}
					}
				}
				if (success) {PlaySound('snd/sell'+choose([1,2,3,4])+'.mp3',0.75);this.refresh();}
				//if (moni>0) Game.Notify(this.name,'Sold <b>'+sold+'</b> for '+Beautify(moni)+'クッキー','',2);
			}
			this.sacrifice=function(amount)//sell without getting back any money
			{
				var success=0;
				//var moni=0;
				var sold=0;
				if (amount==-1) amount=this.amount;
				if (!amount) amount=1;
				for (var i=0;i<amount;i++)
				{
					var price=this.getPrice();
					price=Math.floor(price*0.5);
					if (this.amount>0)
					{
						sold++;
						//moni+=price;
						//Game.cookies+=price;
						//Game.cookiesEarned=Math.max(Game.cookies,Game.cookiesEarned);
						this.amount--;
						price=this.getPrice();
						this.price=price;
						if (this.sellFunction) this.sellFunction();
						Game.recalculateGains=1;
						if (this.amount==0 && this.id!=0) l('row'+this.id).classList.remove('enabled');
						Game.BuildingsOwned--;
						success=1;
					}
				}
				if (success) {this.refresh();}
				//if (moni>0) Game.Notify(this.name,'Sold <b>'+sold+'</b> for '+Beautify(moni)+'クッキー','',2);
			}
			this.buyFree=function(amount)//unlike getFree, this still increases the price
			{
				for (var i=0;i<amount;i++)
				{
					if (Game.cookies>=price)
					{
						this.amount++;
						this.bought++;
						this.price=this.getPrice();
						Game.recalculateGains=1;
						if (this.amount==1 && this.id!=0) l('row'+this.id).classList.add('enabled');
						this.highest=Math.max(this.highest,this.amount);
						Game.BuildingsOwned++;
					}
				}
				this.refresh();
			}
			this.getFree=function(amount)//get X of this building for free, with the price behaving as if you still didn't have them
			{
				this.amount+=amount;
				this.bought+=amount;
				this.free+=amount;
				this.highest=Math.max(this.highest,this.amount);
				Game.BuildingsOwned+=amount;
						this.highest=Math.max(this.highest,this.amount);
				this.refresh();
			}
			this.getFreeRanks=function(amount)//this building's price behaves as if you had X less of it
			{
				this.free+=amount;
				this.refresh();
			}
			
			this.tooltip=function()
			{
				var me=this;
				var desc=me.desc;
				var name=me.name;
				if (Game.season=='fools')
				{
					if (!Game.foolObjects[me.name])
					{
						name=Game.foolObjects['Unknown'].name;
						desc=Game.foolObjects['Unknown'].desc;
					}
					else
					{
						name=Game.foolObjects[me.name].name;
						desc=Game.foolObjects[me.name].desc;
					}
				}
				var icon=[me.iconColumn,0];
				if (me.locked)
				{
					name='???';
					desc='';
					icon=[0,7];
				}
				//if (l('rowInfo'+me.id) && Game.drawT%10==0) l('rowInfoContent'+me.id).innerHTML='&bull; '+me.amount+(me.amount==1?me.single:me.plural)+'<br>&bull; producing '+Beautify(me.storedTotalCps,1)+(me.storedTotalCps==1?'クッキー':'クッキー')+' per second<br>&bull; total : '+Beautify(me.totalCookies)+(Math.floor(me.totalCookies)==1?'クッキー':'クッキー')+me.actionName;
				
				var canBuy=false;
				var price=me.bulkPrice;
				if ((Game.buyMode==1 && Game.cookies>=price) || (Game.buyMode==-1 && me.amount>0)) canBuy=true;
				
				var synergiesStr='';
				//note : might not be entirely accurate, math may need checking
				if (me.amount>0)
				{
					var synergiesWith={};
					var synergyBoost=0;
					
					if (me.name=='グランマ')
					{
						for (var i in Game.GrandmaSynergies)
						{
							if (Game.Has(Game.GrandmaSynergies[i]))
							{
								var other=Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;
								var mult=me.amount*0.01*(1/(other.id-1));
								var boost=(other.storedTotalCps*Game.globalCpsMult)-(other.storedTotalCps*Game.globalCpsMult)/(1+mult);
								synergyBoost+=boost;
								if (!synergiesWith[other.plural]) synergiesWith[other.plural]=0;
								synergiesWith[other.plural]+=mult;
							}
						}
					}
					else if (me.name=='ポータル' && Game.Has('約束'))
					{
						var other=Game.Objects['グランマ'];
						var boost=(me.amount*0.05*other.amount)*Game.globalCpsMult;
						synergyBoost+=boost;
						if (!synergiesWith[other.plural]) synergiesWith[other.plural]=0;
						synergiesWith[other.plural]+=boost/(other.storedTotalCps*Game.globalCpsMult);
					}
					
					for (var i in me.synergies)
					{
						var it=me.synergies[i];
						if (Game.Has(it.name))
						{
							var weight=0.05;
							var other=it.buildingTie1;
							if (me==it.buildingTie1) {weight=0.001;other=it.buildingTie2;}
							var boost=(other.storedTotalCps*Game.globalCpsMult)-(other.storedTotalCps*Game.globalCpsMult)/(1+me.amount*weight);
							synergyBoost+=boost;
							if (!synergiesWith[other.plural]) synergiesWith[other.plural]=0;
							synergiesWith[other.plural]+=me.amount*weight;
							//synergiesStr+='Synergy with '+other.name+'; we boost it by '+Beautify((me.amount*weight)*100,1)+'%, producing '+Beautify(boost)+' CpS. My synergy boost is now '+Beautify((synergyBoost/Game.cookiesPs)*100,1)+'%.<br>';
						}
					}
					if (synergyBoost>0)
					{
						for (var i in synergiesWith)
						{
							if (synergiesStr!='') synergiesStr+='、';
							synergiesStr+=i+' +'+Beautify(synergiesWith[i]*100,1)+'%';
						}
						//synergiesStr='...along with <b>'+Beautify(synergyBoost,1)+'</b> cookies through synergies with other buildings ('+synergiesStr+'; <b>'+Beautify((synergyBoost/Game.cookiesPs)*100,1)+'%</b> of total CpS)';
						//synergiesStr='...also boosting some other buildings, accounting for <b>'+Beautify(synergyBoost,1)+'</b> cookies per second (a combined <b>'+Beautify((synergyBoost/Game.cookiesPs)*100,1)+'%</b> of total CpS) : '+synergiesStr+'';
						synergiesStr='…また、他の施設によるブースト : '+synergiesStr+' - すべて合わせて、これらのブーストは <b>'+Beautify(synergyBoost,1)+'</b> クッキー毎秒を占める(CpS全体の<b>'+Beautify((synergyBoost/Game.cookiesPs)*100,1)+'%</b>)';
					}
				}
				
				return '<div style="min-width:350px;padding:8px;"><div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div><div style="float:right;text-align:right;"><span class="price'+(canBuy?'':' disabled')+'">'+Beautify(Math.round(price))+'</span>'+Game.costDetails(price)+'</div><div class="name">'+name+'</div>'+'<small>[所持数 : '+me.amount+'</small>]'+(me.free>0?' <small>[無料 : '+me.free+'</small>!]':'')+
				'<div class="line"></div><div class="description">'+desc+'</div>'+
				(me.totalCookies>0?(
					'<div class="line"></div><div class="data">'+
					(me.amount>0?'&bull; それぞれの'+me.single+'が毎秒 <b>'+Beautify((me.storedTotalCps/me.amount)*Game.globalCpsMult,1)+'</b>'+((me.storedTotalCps/me.amount)*Game.globalCpsMult==1?'クッキー':'クッキー')+'生産<br>':'')+
					'&bull; '+me.amount+(me.amount==1?me.single:me.plural)+'が毎秒<b>'+Beautify(me.storedTotalCps*Game.globalCpsMult,1)+'</b>'+(me.storedTotalCps*Game.globalCpsMult==1?'クッキー':'クッキー')+'生産(CpS全体の<b>'+Beautify(Game.cookiesPs>0?((me.amount>0?((me.storedTotalCps*Game.globalCpsMult)/Game.cookiesPs):0)*100):0,1)+'%</b>)<br>'+
					(synergiesStr?('&bull; '+synergiesStr+'<br>'):'')+
					'&bull; 今までに <b>'+Beautify(me.totalCookies)+'</b>'+(Math.floor(me.totalCookies)==1?'クッキー':'クッキー')+me.actionName+'</div>'
				):'')+
				'</div>';
			}
			this.levelTooltip=function()
			{
				var me=this;
				return '<div style="width:280px;padding:8px;"><b>レベル'+Beautify(me.level)+me.plural+'</b><div class="line"></div>'+(me.level==1?me.extraName:me.extraPlural).replace('[X]',Beautify(me.level))+'<b> '+me.name+'のCpSを +'+Beautify(me.level)+'%</b> 上昇中。<div class="line"></div>クリックで<span class="price lump'+(Game.lumps>=me.level+1?'':' disabled')+'">'+Beautify(me.level+1)+'角砂糖'+(me.level==0?'':'')+'</span>使用してレベルアップしよう。'+((me.level==0 && me.minigameUrl)?'<div class="line"></div><b>この建物のレベルを上げることでミニゲームが解放されます。</b>':'')+'</div>';
			}
			/*this.levelUp=function()
			{
				var me=this;
				if (Game.lumps<me.level+1) return 0;
				Game.lumps-=me.level+1;
				me.level+=1;
				if (me.level>=10 && me.levelAchiev10) Game.Win(me.levelAchiev10.name);
				PlaySound('snd/upgrade.mp3',0.6);
				Game.LoadMinigames();
				me.refresh();
				if (l('productLevel'+me.id)){var rect=l('productLevel'+me.id).getBoundingClientRect();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24);}
				Game.recalculateGains=1;
				if (me.minigame && me.minigame.onLevel) me.minigame.onLevel(me.level);
			}*/
			this.levelUp=function(me){
				return function(){Game.spendLump(me.level+1,me.plural+'のレベルを上げます',function()
				{
					me.level+=1;
					if (me.level>=10 && me.levelAchiev10) Game.Win(me.levelAchiev10.name);
					PlaySound('snd/upgrade.mp3',0.6);
					Game.LoadMinigames();
					me.refresh();
					if (l('productLevel'+me.id)){var rect=l('productLevel'+me.id).getBoundingClientRect();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24);}
					if (me.minigame && me.minigame.onLevel) me.minigame.onLevel(me.level);
				})();};
			}(this);
			
			this.refresh=function()//show/hide the building display based on its amount, and redraw it
			{
				this.price=this.getPrice();
				if (Game.buyMode==1) this.bulkPrice=this.getSumPrice(Game.buyBulk);
				else if (Game.buyMode==-1 && Game.buyBulk==-1) this.bulkPrice=this.getReverseSumPrice(1000);
				else if (Game.buyMode==-1) this.bulkPrice=this.getReverseSumPrice(Game.buyBulk);
				this.rebuild();
				if (this.amount==0 && this.id!=0) l('row'+this.id).classList.remove('enabled');
				else if (this.amount>0 && this.id!=0) l('row'+this.id).classList.add('enabled');
				if (this.muted>0 && this.id!=0) {l('row'+this.id).classList.add('muted');l('mutedProduct'+this.id).style.display='inline-block';}
				else if (this.id!=0) {l('row'+this.id).classList.remove('muted');l('mutedProduct'+this.id).style.display='none';}
				//if (!this.onMinigame && !this.muted) {}
				//else this.pics=[];
			}
			this.rebuild=function()
			{
				var me=this;
				//var classes='product';
				var price=me.bulkPrice;
				/*if (Game.cookiesEarned>=me.basePrice || me.bought>0) {classes+=' unlocked';me.locked=0;} else {classes+=' locked';me.locked=1;}
				if (Game.cookies>=price) classes+=' enabled'; else classes+=' disabled';
				if (me.l.className.indexOf('toggledOff')!=-1) classes+=' toggledOff';
				*/
				var icon=[0,me.icon];
				var iconOff=[1,me.icon];
				if (me.iconFunc) icon=me.iconFunc();
				
				var desc=me.desc;
				var name=me.name;
				var displayName=me.displayName;
				if (Game.season=='fools')
				{
					if (!Game.foolObjects[me.name])
					{
						icon=[2,0];
						iconOff=[3,0];
						name=Game.foolObjects['Unknown'].name;
						desc=Game.foolObjects['Unknown'].desc;
					}
					else
					{
						icon=[2,me.icon];
						iconOff=[3,me.icon];
						name=Game.foolObjects[me.name].name;
						desc=Game.foolObjects[me.name].desc;
					}
					displayName=name;
					if (name.length>16) displayName='<span style="font-size:75%;">'+name+'</span>';
				}
				icon=[icon[0]*64,icon[1]*64];
				iconOff=[iconOff[0]*64,iconOff[1]*64];
				
				//me.l.className=classes;
				//l('productIcon'+me.id).style.backgroundImage='url(img/'+icon+')';
				l('productIcon'+me.id).style.backgroundPosition='-'+icon[0]+'px -'+icon[1]+'px';
				//l('productIconOff'+me.id).style.backgroundImage='url(img/'+iconOff+')';
				l('productIconOff'+me.id).style.backgroundPosition='-'+iconOff[0]+'px -'+iconOff[1]+'px';
				l('productName'+me.id).innerHTML=displayName;
				l('productOwned'+me.id).textContent=me.amount?me.amount:'';
				l('productPrice'+me.id).textContent=Beautify(Math.round(price));
				l('productPriceMult'+me.id).textContent=(Game.buyBulk>1)?('x'+Game.buyBulk+' '):'';
				l('productLevel'+me.id).textContent='Lv.'+Beautify(me.level);
				if (Game.isMinigameReady(me) && Game.ascensionMode!=1)
				{
					l('productMinigameButton'+me.id).style.display='block';
					if (!me.onMinigame) l('productMinigameButton'+me.id).textContent='展開 '+me.minigameName;
					else l('productMinigameButton'+me.id).textContent='縮小 '+me.minigameName;
				}
				else l('productMinigameButton'+me.id).style.display='none';
			}
			this.muted=false;
			this.mute=function(val)
			{
				if (this.id==0) return false;
				this.muted=val;
				if (val) {l('productMute'+this.id).classList.add('on');l('row'+this.id).classList.add('muted');l('mutedProduct'+this.id).style.display='inline-block';}
				else {l('productMute'+this.id).classList.remove('on');l('row'+this.id).classList.remove('muted');l('mutedProduct'+this.id).style.display='none';}
			};
			
			this.draw=function(){};
			
			if (this.id==0)
			{
				var str='<div class="productButtons">';
					str+='<div id="productLevel'+this.id+'" class="productButton productLevel lumpsOnly" onclick="Game.ObjectsById['+this.id+'].levelUp()" '+Game.getDynamicTooltip('Game.ObjectsById['+this.id+'].levelTooltip','this')+'></div>';
					str+='<div id="productMinigameButton'+this.id+'" class="productButton productMinigameButton lumpsOnly" onclick="Game.ObjectsById['+this.id+'].switchMinigame(-1);PlaySound(Game.ObjectsById['+this.id+'].onMinigame?\'snd/clickOn.mp3\':\'snd/clickOff.mp3\');"></div>';
				str+='</div>';
				l('sectionLeftExtra').innerHTML=l('sectionLeftExtra').innerHTML+str;
			}
			else
			{
				var str='<div class="row" id="row'+this.id+'"><div class="separatorBottom"></div>';
				str+='<div class="productButtons">';
					str+='<div id="productLevel'+this.id+'" class="productButton productLevel lumpsOnly" onclick="Game.ObjectsById['+this.id+'].levelUp()" '+Game.getDynamicTooltip('Game.ObjectsById['+this.id+'].levelTooltip','this')+'></div>';
					str+='<div id="productMinigameButton'+this.id+'" class="productButton productMinigameButton lumpsOnly" onclick="Game.ObjectsById['+this.id+'].switchMinigame(-1);PlaySound(Game.ObjectsById['+this.id+'].onMinigame?\'snd/clickOn.mp3\':\'snd/clickOff.mp3\');"></div>';
					str+='<div class="productButton productMute" '+Game.getTooltip('<div style="width:150px;text-align:center;font-size:11px;"><b>非表示</b><br>(施設を最小化します)</div>','this')+' onclick="Game.ObjectsById['+this.id+'].mute(1);PlaySound(Game.ObjectsById['+this.id+'].muted?\'snd/clickOff.mp3\':\'snd/clickOn.mp3\');" id="productMute'+this.id+'">非表示</div>';
				str+='</div>';
				str+='<canvas class="rowCanvas" id="rowCanvas'+this.id+'"></canvas>';
				str+='<div class="rowSpecial" id="rowSpecial'+this.id+'"></div>';
				str+='</div>';
				l('rows').innerHTML=l('rows').innerHTML+str;
				
				//building canvas
				this.pics=[];
				
				this.toResize=true;
				this.redraw=function()
				{
					var me=this;
					me.pics=[];
				}
				this.draw=function()
				{
					if (this.amount<=0) return false;
					if (this.toResize)
					{
						this.canvas.width=this.canvas.clientWidth;
						this.canvas.height=this.canvas.clientHeight;
						this.toResize=false;
					}
					var ctx=this.ctx;
					//clear
					//ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
					ctx.globalAlpha=1;
					
					//pic : a loaded picture or a function returning a loaded picture
					//bg : a loaded picture or a function returning a loaded picture - tiled as the background, 128x128
					//xV : the pictures will have a random horizontal shift by this many pixels
					//yV : the pictures will have a random vertical shift by this many pixels
					//w : how many pixels between each picture (or row of pictures)
					//x : horizontal offset
					//y : vertical offset (+32)
					//rows : if >1, arrange the pictures in rows containing this many pictures
					//frames : if present, slice the pic in [frames] horizontal slices and pick one at random
					
					var pic=this.art.pic;
					var bg=this.art.bg;
					var xV=this.art.xV||0;
					var yV=this.art.yV||0;
					var w=this.art.w||48;
					var h=this.art.h||48;
					var offX=this.art.x||0;
					var offY=this.art.y||0;
					var rows=this.art.rows||1;
					var frames=this.art.frames||1;

					if (typeof(bg)=='string') ctx.fillPattern(Pic(this.art.bg),0,0,this.canvas.width,this.canvas.height,128,128);
					else bg(this,ctx);
					/*
					ctx.globalAlpha=0.5;
					if (typeof(bg)=='string')//test
					{
						ctx.fillPattern(Pic(this.art.bg),-128+Game.T%128,0,this.canvas.width+128,this.canvas.height,128,128);
						ctx.fillPattern(Pic(this.art.bg),-128+Math.floor(Game.T/2)%128,-128+Math.floor(Game.T/2)%128,this.canvas.width+128,this.canvas.height+128,128,128);
					}
					ctx.globalAlpha=1;
					*/
					var maxI=Math.floor(this.canvas.width/(w/rows)+1);
					var iT=Math.min(this.amount,maxI);
					var i=this.pics.length;
					
					
					var x=0;
					var y=0;
					var added=0;
					if (i!=iT)
					{
						//for (var iter=0;iter<3;iter++)
						//{
							while (i<iT)
							//if (i<iT)
							{
								Math.seedrandom(Game.seed+this.id+i);
								if (rows!=1)
								{
									x=Math.floor(i/rows)*w+((i%rows)/rows)*w+Math.floor((Math.random()-0.5)*xV)+offX;
									y=32+Math.floor((Math.random()-0.5)*yV)+((-rows/2)*32/2+(i%rows)*32/2)+offY;
								}
								else
								{
									x=i*w+Math.floor((Math.random()-0.5)*xV)+offX;
									y=32+Math.floor((Math.random()-0.5)*yV)+offY;
								}
								var usedPic=(typeof(pic)=='string'?pic:pic(this,i));
								var frame=-1;
								if (frames>1) frame=Math.floor(Math.random()*frames);
								this.pics.push({x:Math.floor(x),y:Math.floor(y),z:y,pic:usedPic,id:i,frame:frame});
								i++;
								added++;
							}
							while (i>iT)
							//else if (i>iT)
							{
								this.pics.sort(Game.sortSpritesById);
								this.pics.pop();
								i--;
								added--;
							}
						//}
						this.pics.sort(Game.sortSprites);
					}
					
					var len=this.pics.length;
					
					if (this.mouseOn)
					{
						var selected=-1;
						if (this.name=='グランマ')
						{
							//mouse detection only fits grandma sprites for now
							var marginW=-18;
							var marginH=-10;
							for (var i=0;i<len;i++)
							{
								var pic=this.pics[i];
								if (this.mousePos[0]>=pic.x-marginW && this.mousePos[0]<pic.x+64+marginW && this.mousePos[1]>=pic.y-marginH && this.mousePos[1]<pic.y+64+marginH) selected=i;
							}
							if (Game.prefs.customGrandmas && Game.customGrandmaNames.length>0)
							{
								var str='Names in white were submitted by our supporters on Patreon.';
								ctx.globalAlpha=0.75;
								ctx.fillStyle='#000';
								ctx.font='9px Merriweather';
								ctx.textAlign='left';
								ctx.fillRect(0,0,ctx.measureText(str).width+4,12);
								ctx.globalAlpha=1;
								ctx.fillStyle='rgba(255,255,255,0.7)';
								ctx.fillText(str,2,8);
								ctx.fillStyle='rgba(255,255,255,1)';
								ctx.fillText('white',2+ctx.measureText('Names in ').width,8);
							}
						}
					}
					
					Math.seedrandom();
					
					for (var i=0;i<len;i++)
					{
						var pic=this.pics[i];
						var sprite=Pic(pic.pic);
						if (selected==i && this.name=='グランマ')
						{
							ctx.font='14px Merriweather';
							ctx.textAlign='center';
							Math.seedrandom(Game.seed+pic.id/*+pic.id*/);//(Game.seed+pic.id+pic.x+pic.y);
							var years=((Date.now()-new Date(2013,7,8))/(1000*60*60*24*365))+Math.random();//the grandmas age with the game
							var name=choose(Game.grandmaNames);
							var custom=false;
							if (Game.prefs.customGrandmas && Game.customGrandmaNames.length>0 && Math.random()<0.2) {name=choose(Game.customGrandmaNames);custom=true;}
							var text=name+'、'+Beautify(Math.floor(70+Math.random()*30+years+this.level))+'歳';
							var width=ctx.measureText(text).width+12;
							var x=Math.max(0,Math.min(pic.x+32-width/2+Math.random()*32-16,this.canvas.width-width));
							var y=4+Math.random()*8-4;
							Math.seedrandom();
							ctx.fillStyle='#000';
							ctx.strokeStyle='#000';
							ctx.lineWidth=8;
							ctx.globalAlpha=0.75;
							ctx.beginPath();
							ctx.moveTo(pic.x+32,pic.y+32);
							ctx.lineTo(Math.floor(x+width/2),Math.floor(y+20));
							ctx.stroke();
							ctx.fillRect(Math.floor(x),Math.floor(y),Math.floor(width),24);
							ctx.globalAlpha=1;
							if (custom) ctx.fillStyle='#fff';
							else ctx.fillStyle='rgba(255,255,255,0.7)';
							ctx.fillText(text,Math.floor(x+width/2),Math.floor(y+16));
							
							ctx.drawImage(sprite,Math.floor(pic.x+Math.random()*4-2),Math.floor(pic.y+Math.random()*4-2));
						}
						//else if (1) ctx.drawImage(sprite,0,0,sprite.width,sprite.height,pic.x,pic.y,sprite.width,sprite.height);
						else if (pic.frame!=-1) ctx.drawImage(sprite,(sprite.width/frames)*pic.frame,0,sprite.width/frames,sprite.height,pic.x,pic.y,(sprite.width/frames),sprite.height);
						else ctx.drawImage(sprite,pic.x,pic.y);
						
					}
					
					/*
					var picX=this.id;
					var picY=12;
					var w=1;
					var h=1;
					var w=Math.abs(Math.cos(Game.T*0.2+this.id*2-0.3))*0.2+0.8;
					var h=Math.abs(Math.sin(Game.T*0.2+this.id*2))*0.3+0.7;
					var x=64+Math.cos(Game.T*0.19+this.id*2)*8-24*w;
					var y=128-Math.abs(Math.pow(Math.sin(Game.T*0.2+this.id*2),5)*16)-48*h;
					ctx.drawImage(Pic('icons.png'),picX*48,picY*48,48,48,Math.floor(x),Math.floor(y),48*w,48*h);
					*/
				}
			}
			
			Game.last=this;
			Game.Objects[this.name]=this;
			Game.ObjectsById[this.id]=this;
			Game.ObjectsN++;
			return this;
		}
		
		Game.DrawBuildings=function()//draw building displays with canvas
		{
			if (Game.drawT%3==0)
			{
				for (var i in Game.Objects)
				{
					var me=Game.Objects[i];
					if (me.id>0 && !me.onMinigame && !me.muted) me.draw();
					else me.pics=[];
				}
			}
		}
		
		Game.sortSprites=function(a,b)
		{
			if (a.z>b.z) return 1;
			else if (a.z<b.z) return -1;
			else return 0;
		}
		Game.sortSpritesById=function(a,b)
		{
			if (a.id>b.id) return 1;
			else if (a.id<b.id) return -1;
			else return 0;
		}
		
		Game.modifyBuildingPrice=function(building,price)
		{
			if (Game.Has('セール期間')) price*=0.99;
			if (Game.Has('サンタの支配')) price*=0.99;
			if (Game.Has('ファベルジェの卵')) price*=0.99;
			if (Game.Has('神聖な割引')) price*=0.99;
			if (Game.Has('幸運 No.100')) price*=0.99;
			//if (Game.hasAura('Fierce Hoarder')) price*=0.98;
			price*=1-Game.auraMult('爆買い')*0.02;
			if (Game.hasBuff('もってけドロボー')) price*=0.95;
			if (Game.hasBuff('ずる賢い妖精たち')) price*=0.98;
			if (Game.hasBuff('卑劣なゴブリン')) price*=1.02;
			if (building.fortune && Game.Has(building.fortune.name)) price*=0.93;
			price*=Game.eff('buildingCost');
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('creation');
				if (godLvl==1) price*=0.93;
				else if (godLvl==2) price*=0.95;
				else if (godLvl==3) price*=0.98;
			}
			return price;
		}
		
		Game.storeBulkButton=function(id)
		{
			if (id==0) Game.buyMode=1;
			else if (id==1) Game.buyMode=-1;
			else if (id==2) Game.buyBulk=1;
			else if (id==3) Game.buyBulk=10;
			else if (id==4) Game.buyBulk=100;
			else if (id==5) Game.buyBulk=-1;
			
			if (Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;
			
			if (Game.buyMode==1) l('storeBulkBuy').className='storePreButton storeBulkMode selected'; else l('storeBulkBuy').className='storePreButton storeBulkMode';
			if (Game.buyMode==-1) l('storeBulkSell').className='storePreButton storeBulkMode selected'; else l('storeBulkSell').className='storePreButton storeBulkMode';
			
			if (Game.buyBulk==1) l('storeBulk1').className='storePreButton storeBulkAmount selected'; else l('storeBulk1').className='storePreButton storeBulkAmount';
			if (Game.buyBulk==10) l('storeBulk10').className='storePreButton storeBulkAmount selected'; else l('storeBulk10').className='storePreButton storeBulkAmount';
			if (Game.buyBulk==100) l('storeBulk100').className='storePreButton storeBulkAmount selected'; else l('storeBulk100').className='storePreButton storeBulkAmount';
			if (Game.buyBulk==-1) l('storeBulkMax').className='storePreButton storeBulkAmount selected'; else l('storeBulkMax').className='storePreButton storeBulkAmount';
			
			if (Game.buyMode==1)
			{
				l('storeBulkMax').style.visibility='hidden';
				l('products').className='storeSection';
			}
			else
			{
				l('storeBulkMax').style.visibility='visible';
				l('products').className='storeSection selling';
			}
			
			Game.storeToRefresh=1;
			if (id!=-1) PlaySound('snd/tick.mp3');
		}
		Game.BuildStore=function()//create the DOM for the store's buildings
		{
			//if (typeof showAds!=='undefined') l('store').scrollTop=100;
			
			var str='';
			str+='<div id="storeBulk" class="storePre" '+Game.getTooltip(
							'<div style="padding:8px;min-width:200px;text-align:center;font-size:11px;"><b>Ctrl</b>を押すことで<b>10</b>個単位で、<b>Shift</b>を押すことで<b>100</b>個単位でまとめ買い、まとめ売りができます。</div>'
							,'store')+
				'>'+
				'<div id="storeBulkBuy" class="storePreButton storeBulkMode" '+Game.clickStr+'="Game.storeBulkButton(0);">購入</div>'+
				'<div id="storeBulkSell" class="storePreButton storeBulkMode" '+Game.clickStr+'="Game.storeBulkButton(1);">売却</div>'+
				'<div id="storeBulk1" class="storePreButton storeBulkAmount" '+Game.clickStr+'="Game.storeBulkButton(2);">1</div>'+
				'<div id="storeBulk10" class="storePreButton storeBulkAmount" '+Game.clickStr+'="Game.storeBulkButton(3);">10</div>'+
				'<div id="storeBulk100" class="storePreButton storeBulkAmount" '+Game.clickStr+'="Game.storeBulkButton(4);">100</div>'+
				'<div id="storeBulkMax" class="storePreButton storeBulkAmount" '+Game.clickStr+'="Game.storeBulkButton(5);">全て</div>'+
				'</div>';
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				str+='<div class="product toggledOff" '+Game.getDynamicTooltip('Game.ObjectsById['+me.id+'].tooltip','store')+' id="product'+me.id+'"><div class="icon off" id="productIconOff'+me.id+'" style=""></div><div class="icon" id="productIcon'+me.id+'" style=""></div><div class="content"><div class="lockedTitle">???</div><div class="title" id="productName'+me.id+'"></div><span class="priceMult" id="productPriceMult'+me.id+'"></span><span class="price" id="productPrice'+me.id+'"></span><div class="title owned" id="productOwned'+me.id+'"></div></div>'+
				/*'<div class="buySell"><div style="left:0px;" id="buttonBuy10-'+me.id+'">Buy 10</div><div style="left:100px;" id="buttonSell-'+me.id+'">Sell 1</div><div style="left:200px;" id="buttonSellAll-'+me.id+'">Sell all</div></div>'+*/
				'</div>';
			}
			l('products').innerHTML=str;
			
			Game.storeBulkButton(-1);
			
			var SellAllPrompt=function(id)
			{
				return function(id){Game.Prompt('<div class="block">Do you really want to sell your '+Game.ObjectsById[id].amount+(Game.ObjectsById[id].amount==1?Game.ObjectsById[id].single:Game.ObjectsById[id].plural)+'?</div>',[['はい','Game.ObjectsById['+id+'].sell(-1);Game.ClosePrompt();'],['No','Game.ClosePrompt();']]);}(id);
			}
			
			Game.ClickProduct=function(what)
			{
				Game.ObjectsById[what].buy();
			}
			
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				me.l=l('product'+me.id);
				
				//these are a bit messy but ah well
				if (!Game.touchEvents)
				{
					AddEvent(me.l,'click',function(what){return function(e){Game.ClickProduct(what);e.preventDefault();};}(me.id));
				}
				else
				{
					AddEvent(me.l,'touchend',function(what){return function(e){Game.ClickProduct(what);e.preventDefault();};}(me.id));
				}
			}
		}
		
		Game.RefreshStore=function()//refresh the store's buildings
		{
			for (var i in Game.Objects)
			{
				Game.Objects[i].refresh();
			}
			Game.storeToRefresh=0;
		}
		
		Game.ComputeCps=function(base,mult,bonus)
		{
			if (!bonus) bonus=0;
			return ((base)*(Math.pow(2,mult))+bonus);
		}
		
		Game.isMinigameReady=function(me)
		{return (me.minigameUrl && me.minigameLoaded && me.level>0);}
		Game.scriptBindings=[];
		Game.LoadMinigames=function()//load scripts for each minigame
		{
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				if (me.minigameUrl && me.level>0 && !me.minigameLoaded && !me.minigameLoading && !l('minigameScript-'+me.id))
				{
					me.minigameLoading=true;
					//we're only loading the minigame scripts that aren't loaded yet and which have enough building level
					//we call this function on building level up and on load
					//console.log('Loading script '+me.minigameUrl+'…');
					setTimeout(function(me){return function(){
						var script=document.createElement('script');
						script.id='minigameScript-'+me.id;
						Game.scriptBindings['minigameScript-'+me.id]=me;
						script.setAttribute('src',me.minigameUrl+'?r='+Game.version);
						script.onload=function(me,script){return function(){
							if (!me.minigameLoaded) Game.scriptLoaded(me,script);
						}}(me,'minigameScript-'+me.id);
						document.head.appendChild(script);
					}}(me),10);
				}
			}
		}
		Game.scriptLoaded=function(who,script)
		{
			who.minigameLoading=false;
			who.minigameLoaded=true;
			who.refresh();
			who.minigame.launch();
			if (who.minigameSave) {who.minigame.reset(true);who.minigame.load(who.minigameSave);who.minigameSave=0;}
		}
		
		Game.magicCpS=function(what)
		{
			/*
			if (Game.Objects[what].amount>=250)
			{
				//this makes buildings give 1% more cookies for every building over 250.
				//this turns out to be rather stupidly overpowered.
				var n=Game.Objects[what].amount-250;
				return 1+Math.pow(1.01,n);
			}
			else return 1;
			*/
			return 1;
		}
		
		//define objects
		new Game.Object('カーソル','カーソル|カーソル|をクリックした|[X]本の追加の指が|[X]本の追加の指が','10秒毎に自動クリックします。',0,0,{},15,function(me){
			var add=0;
			if (Game.Has('千手観音')) add+=		0.1;
			if (Game.Has('万手観音')) add*=		5;
			if (Game.Has('億手観音')) add*=		10;
			if (Game.Has('兆手観音')) add*=		20;
			if (Game.Has('京手観音')) add*=	20;
			if (Game.Has('垓手観音')) add*=	20;
			if (Game.Has('秭手観音')) add*=	20;
			if (Game.Has('穣手観音')) add*=	20;
			if (Game.Has('溝手観音')) add*=	20;
			if (Game.Has('澗手観音')) add*=	20;
			var mult=1;
			var num=0;
			for (var i in Game.Objects) {if (Game.Objects[i].name!='カーソル') num+=Game.Objects[i].amount;}
			add=add*num;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS('カーソル');
			mult*=Game.eff('cursorCps');
			return Game.ComputeCps(0.1,Game.Has('強化人差し指')+Game.Has('手根管症候群防止クリーム')+Game.Has('二刀流'),add)*mult;
		},function(){
			if (this.amount>=1) Game.Unlock(['強化人差し指','手根管症候群防止クリーム']);
			if (this.amount>=10) Game.Unlock('二刀流');
			if (this.amount>=25) Game.Unlock('千手観音');
			if (this.amount>=50) Game.Unlock('万手観音');
			if (this.amount>=100) Game.Unlock('億手観音');
			if (this.amount>=150) Game.Unlock('兆手観音');
			if (this.amount>=200) Game.Unlock('京手観音');
			if (this.amount>=250) Game.Unlock('垓手観音');
			if (this.amount>=300) Game.Unlock('秭手観音');
			if (this.amount>=350) Game.Unlock('穣手観音');
			if (this.amount>=400) Game.Unlock('溝手観音');
			if (this.amount>=450) Game.Unlock('澗手観音');
			
			if (this.amount>=1) Game.Win('クリック');if (this.amount>=2) Game.Win('ダブルクリック');if (this.amount>=50) Game.Win('マウスホイール');if (this.amount>=100) Game.Win('二十日鼠と人間');if (this.amount>=200) Game.Win('指人間');if (this.amount>=300) Game.Win('超過多指症');if (this.amount>=400) Game.Win('ドクター・T');if (this.amount>=500) Game.Win('親指、指骨、中手骨');if (this.amount>=600) Game.Win('人差し指と親指で');if (this.amount>=700) Game.Win('あなたに敬意を表します');if (this.amount>=800) Game.Win('小人閑居して不善をなす');
		});
		
		Game.SpecialGrandmaUnlock=15;
		new Game.Object('グランマ','グランマ|グランマ|を焼いた|[X]歳年上のおばあちゃんが|[X]歳年上のおばあちゃん達が','クッキーを焼いてくれる素敵なおばあちゃん。',1,1,{pic:function(i){
			var list=['grandma'];
			if (Game.Has('農婦のグランマ')) list.push('farmerGrandma');
			if (Game.Has('工員のグランマ')) list.push('workerGrandma');
			if (Game.Has('鉱婦のグランマ')) list.push('minerGrandma');
			if (Game.Has('宇宙のグランマ')) list.push('cosmicGrandma');
			if (Game.Has('ミュータントグランマ')) list.push('transmutedGrandma');
			if (Game.Has('別世界のグランマ')) list.push('alteredGrandma');
			if (Game.Has('ひいひいグランマ')) list.push('grandmasGrandma');
			if (Game.Has('反グランマ物質')) list.push('antiGrandma');
			if (Game.Has('虹グランマ')) list.push('rainbowGrandma');
			if (Game.Has('銀行員のグランマ')) list.push('bankGrandma');
			if (Game.Has('祭司のグランマ')) list.push('templeGrandma');
			if (Game.Has('魔法使いのグランマ')) list.push('witchGrandma');
			if (Game.Has('幸運グランマ')) list.push('luckyGrandma');
			if (Game.Has('メタグランマ')) list.push('metaGrandma');
			if (Game.Has('スクリプトおばあちゃん')) list.push('scriptGrandma');
			if (Game.Has('対のグランマ')) list.push('alternateGrandma');
			if (Game.season=='christmas') list.push('elfGrandma');
			if (Game.season=='easter') list.push('bunnyGrandma');
			return choose(list)+'.png';
		},bg:'grandmaBackground.png',xV:8,yV:8,w:32,rows:3,x:0,y:16},100,function(me){
			var mult=1;
			for (var i in Game.GrandmaSynergies)
			{
				if (Game.Has(Game.GrandmaSynergies[i])) mult*=2;
			}
			if (Game.Has('ビンゴセンター/研究施設')) mult*=4;
			if (Game.Has('儀式の延べ棒')) mult*=2;
			if (Game.Has('いたずらリスト')) mult*=2;
			
			if (Game.Has('エルダーワートビスケット')) mult*=1.02;
			
			mult*=Game.eff('grandmaCps');
			
			if (Game.Has('猫好きおばさん'))
			{
				for (var i=0;i<Game.UpgradesByPool['kitten'].length;i++)
				{
					if (Game.Has(Game.UpgradesByPool['kitten'][i].name)) mult*=1.29;
				}
			}
			
			mult*=Game.GetTieredCpsMult(me);
			
			var add=0;
			if (Game.Has('統合思念')) add+=Game.Objects['グランマ'].amount*0.02;
			if (Game.Has('集団洗脳')) add+=Game.Objects['グランマ'].amount*0.02;
			if (Game.Has('約束')) add+=Game.Objects['ポータル'].amount*0.05;
			
			var num=0;
			for (var i in Game.Objects) {if (Game.Objects[i].name!='グランマ') num+=Game.Objects[i].amount;}
			//if (Game.hasAura('Elder Battalion')) mult*=1+0.01*num;
			mult*=1+Game.auraMult('旧き者らの大隊 ババタリオン')*0.01*num;
			
			mult*=Game.magicCpS(me.name);
			
			return (me.baseCps+add)*mult;
		},function(){
			Game.UnlockTiered(this);
		});
		Game.last.sellFunction=function()
		{
			Game.Win('背徳');
			if (this.amount==0)
			{
				Game.Lock('誓約');
				Game.CollectWrinklers();
				Game.pledgeT=0;
			}
		};
		Game.last.iconFunc=function(type){
			var grandmaIcons=[[0,1],[0,2],[1,2],[2,2]];
			if (type=='off') return [0,1];
			return grandmaIcons[Game.elderWrath];
		};
		
		
		new Game.Object('農場','農場|農場|を収穫した|[X]枚の農地を更に造成し|[X]枚の農地を更に造成し','クッキーの種からクッキーを育てます。',3,2,{base:'farm',xV:8,yV:8,w:64,rows:2,x:0,y:16},500,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.minigameUrl='minigameGarden.js';
		Game.last.minigameName='菜園';
		
		new Game.Object('鉱山','鉱山|鉱山|を掘り出した|[X]マイル更に掘り下げ|[X]マイル更に掘り下げ','クッキー生地とチョコチップを掘り出します。',4,3,{base:'mine',xV:16,yV:16,w:64,rows:2,x:0,y:24},10000,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		
		new Game.Object('工場','工場|工場|を生産した|特許を[X]つ追加取得し|特許を[X]つ追加取得し','大量のクッキーを生産します。',5,4,{base:'factory',xV:8,yV:0,w:64,rows:1,x:0,y:-22},3000,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		//Game.last.minigameUrl='minigameDungeon.js';//not yet
		Game.last.minigameName='Dungeon';
		
		new Game.Object('銀行','銀行|銀行|得した|金利が[X]%良くなり|金利が[X]%良くなり','利子からクッキーを生み出します。',6,15,{base:'bank',xV:8,yV:4,w:56,rows:1,x:0,y:13},0,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.minigameUrl='minigameMarket.js';
		Game.last.minigameName='在庫市場';
		
		new Game.Object('神殿','神殿|神殿|を発見した|回収された[X]つのアーティファクトで|回収された[X]つのアーティファクトで','貴重な古代クッキーの宝庫。',7,16,{base:'temple',xV:8,yV:4,w:72,rows:2,x:0,y:-5},0,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.minigameUrl='minigamePantheon.js';
		Game.last.minigameName='神殿';
		
		new Game.Object('魔法使いの塔','魔法使いの塔|魔法使いの塔|を召喚した|詠唱呪文に音節が[X]つ増えて|詠唱呪文に音節が[X]つ増えて','魔法の呪文でクッキーを召喚します。',8,17,{base:'wizardtower',xV:16,yV:16,w:48,rows:2,x:0,y:20},0,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.displayName='<span style="font-size:95%;letter-spacing:-1px;position:relative;bottom:2px;">魔法使いの塔</span>';//大きすぎるため名前を縮小
		Game.last.minigameUrl='minigameGrimoire.js';
		Game.last.minigameName='魔導書';
		
		new Game.Object('宇宙船','宇宙船|宇宙船|を輸送した|[X]つの銀河の精密探査を成し遂げ|[X]つの銀河の精密探査を成し遂げ','クッキー星から新鮮なクッキーを輸送します。',9,5,{base:'shipment',xV:16,yV:16,w:64,rows:1,x:0,y:0},40000,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		
		new Game.Object('錬金術室','錬金術室|錬金術室|を錬成した|[X]つの根源的要素を会得し|[X]つの根源的要素を会得し','金をクッキーに変化させます。',10,6,{base:'alchemylab',xV:16,yV:16,w:64,rows:2,x:0,y:16},200000,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		
		new Game.Object('ポータル','ポータル|ポータル|を回収した|[X]つの次元を隷属させ|[X]つの次元を隷属させ','クッキー界につながる扉を開きます。',11,7,{base:'portal',xV:32,yV:32,w:64,rows:2,x:0,y:0},1666666,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		
		new Game.Object('タイムマシン','タイムマシン|タイムマシン|を取り寄せた|[X]世紀分の遡行を安全化し|[X]世紀分の遡行を安全化し','食べられる前のクッキーを過去から取り寄せます。',12,8,{base:'timemachine',xV:32,yV:32,w:64,rows:1,x:0,y:0},123456789,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.displayName='<span style="font-size:95%;letter-spacing:-1px;position:relative;bottom:2px;">タイムマシン</span>';//大きすぎるため名前を縮小
		
		new Game.Object('反物質凝縮器','反物質凝縮器|反物質凝縮器|を圧縮した|[X]種類の特殊なクォークにより|[X]種類の特殊なクォークにより','宇宙の反物質を圧縮しクッキーに変換します。',13,13,{base:'antimattercondenser',xV:0,yV:64,w:64,rows:1,x:0,y:0},3999999999,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.displayName='<span style="font-size:95%;letter-spacing:-1px;position:relative;bottom:2px;">反物質凝縮器</span>';//大きすぎるため名前を縮小
		
		new Game.Object('プリズム','プリズム|プリズム|に変換した|新たな色が[X]種発見され|新たな色が[X]種発見され','光をクッキーに変換します。',14,14,{base:'prism',xV:16,yV:4,w:64,rows:1,x:0,y:20},75000000000,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		
		new Game.Object('チャンスメーカー','チャンスメーカー|チャンスメーカー|が自然に発生した|[X]つ葉のクローバーの加護を受け|[X]つ葉のクローバーの加護を受け','無からクッキーが生まれる可能性を作ります。',15,19,{base:'chancemaker',xV:8,yV:64,w:64,rows:1,x:0,y:0,rows:2},77777777777,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.displayName='<span style="font-size:70%;letter-spacing:-1px;position:relative;bottom:3px;">チャンスメーカー</span>';//大きすぎるため名前を縮小
		
		new Game.Object('自己無限生成エンジン','自己無限生成エンジン|自己無限生成エンジン|が自己生成された|[X]回の反復処理が|[X]回の反復処理が','クッキーから更に多くのクッキーを生成します。',16,20,{base:'fractalEngine',xV:8,yV:64,w:64,rows:1,x:0,y:0},12345678987654321,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.displayName='<span style="font-size:60%;letter-spacing:-1px;position:relative;bottom:4px;">自己無限生成エンジン</span>';//大きすぎるため名前を縮小
		
		new Game.Object('Javascriptコンソール','Javascriptコンソール|Javascriptコンソール|をプログラムした|[X]個の外部ライブラリを導入し|[X]個の外部ライブラリを導入し','このゲームを記述していることに他ならないコードからクッキーを生み出します。',17,32,{base:'javascriptconsole',xV:8,yV:64,w:14,rows:1,x:8,y:-32,frames:2},12345678987654321,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		Game.last.displayName='<span style="font-size:60%;letter-spacing:-1px;position:relative;bottom:4px;">Javascriptコンソール</span>';//大きすぎるため名前を縮小
		
		new Game.Object('遊休宇宙','遊休宇宙|遊休宇宙|を乗っ取った|[X]個の多岐管により|[X]個の多岐管により','我々が手にしている宇宙のそばには稼働しているが活用されていない宇宙が数えきれないほど存在する。あなたはついに彼らの生産を乗っ取り彼らの作ったものをすべてクッキーに変換する方法を見つけた!',18,33,{base:'idleverse',xV:8,yV:64,w:48,rows:2,x:0,y:0,frames:4},12345678987654321,function(me){
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function(){
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['グランマ'].amount>0) Game.Unlock(this.grandma.name);
		});
		
		Game.foolObjects={
			'Unknown':{name:'投資',desc:'これが何のかは分からないが、利益になることだけはわかる。',icon:0},
			'カーソル':{name:'延し棒',desc:'生地を平らにするのに欠かせない。クッキー作りの第一歩。',icon:0},
			'グランマ':{name:'オーブン',desc:'これが無きゃクッキーは焼けない。',icon:1},
			'農場':{name:'キッチン',desc:'キッチンを増やせば、従業員を増やせる。作れるクッキーがもっと増える。',icon:2},
			'鉱山':{name:'秘伝のレシピ',desc:'厄介な競争相手を出し抜く為に。',icon:3},
			'工場':{name:'工場',desc:'大量生産は成功への道。ノルマ厳守、ルール厳守、チームワーク大切に!',icon:4},
			'銀行':{name:'投資家',desc:'儲け話に敏い投資家連中は、金策が続く限り君の会社に融資する気で満々だ。',icon:5},
			'神殿':{name:'いいね!',desc:'会社のソーシャルメディアページが瞬く間に大拡散!大量の いいね! でネット上で長く注目の的。即ち広告収入もウハウハ!これ大事。',icon:9},
			'魔法使いの塔':{name:'ミーム',desc:'クッキーミームが大流行!程々のステマを交えつつ、企業イメージはネット空間の至る所にバラ撒かれる。',icon:6},
			'宇宙船':{name:'スーパー',desc:'巨大なクッキー量販店 - 君の独自小売チェーン店。',icon:7},
			'錬金術室':{name:'株式発行',desc:'株式市場に正式上場、誰もが欲しがる人気銘柄!',icon:8},
			'ポータル':{name:'テレビ番組',desc:'クッキーが登場するホームコメディ!ベタな大笑いの効果音をバックに、陽気に喧しく焼いている。',icon:10},
			'タイムマシン':{name:'テーマパーク',desc:'沢山のマスコットとジェットコースターが売りのクッキーテーマパーク。一つと言わずに百建てろ!',icon:11},
			'反物質凝縮器':{name:'クッキーコイン',desc:'この仮想通貨は、既に幾つかの小国家では通常貨幣として流通している。',icon:12},
			'プリズム':{name:'企業国家',desc:'君は頂点に立った。更なる利の追求を欲するならば、国家を丸ごと買収するのも可能だ。成功を祈る。',icon:13},
			'チャンスメーカー':{name:'私有惑星',desc:'ぶっちゃけ、何がクールか解ってるんだろ?星まるごとさ。クッキーの製造・広告・販売・消費、それ専用の星にしちまうのさ。',icon:15},
			'自己無限生成エンジン':{name:'上院議席',desc:'この世界を真に改革するには政治的支配しかない。より輝ける、よりクッキーに優しい未来を築く為に。',icon:16},
			'Javascriptコンソール':{name:'教義',desc:'-宗教、文化、哲学-などの多くの形態をとると、教義は適切に処理された場合、文明に永続的な影響を与え、心と人々を作り直し、すべての未来の世代が-より多くのクッキーの生産と獲得-という共通の目標を共有するようになります。',icon:17},
			'遊休宇宙':{name:'側方拡大',desc:'時により高みを目指す上で最良の方向性は横向きである。クッキーを伴わない投資を通じてベンチャーを多様化させよ。',icon:18},
		};
		
		
		//build store
		Game.BuildStore();
		
		//build master bar
		var str='';
		str+='<div id="buildingsMute" class="shadowFilter" style="position:relative;z-index:100;padding:4px 16px 0px 64px;"></div>';
		str+='<div class="separatorBottom" style="position:absolute;bottom:-8px;z-index:0;"></div>';
		l('buildingsMaster').innerHTML=str;
		
		//build object displays
		var muteStr='<div style="position:absolute;left:8px;bottom:12px;opacity:0.5;">非表示中 :</div>';
		for (var i in Game.Objects)
		{
			var me=Game.Objects[i];
			if (me.id>0)
			{
				me.canvas=l('rowCanvas'+me.id);
				me.ctx=me.canvas.getContext('2d',{alpha:false});
				me.pics=[];
				var icon=[0*64,me.icon*64];
				muteStr+='<div class="tinyProductIcon" id="mutedProduct'+me.id+'" style="display:none;background-position:-'+icon[0]+'px -'+icon[1]+'px;" '+Game.clickStr+'="Game.ObjectsById['+me.id+'].mute(0);PlaySound(Game.ObjectsById['+me.id+'].muted?\'snd/clickOff.mp3\':\'snd/clickOn.mp3\');" '+Game.getDynamicTooltip('Game.mutedBuildingTooltip('+me.id+')','this')+'></div>';
				//muteStr+='<div class="tinyProductIcon" id="mutedProduct'+me.id+'" style="display:none;background-position:-'+icon[0]+'px -'+icon[1]+'px;" '+Game.clickStr+'="Game.ObjectsById['+me.id+'].mute(0);PlaySound(Game.ObjectsById['+me.id+'].muted?\'snd/clickOff.mp3\':\'snd/clickOn.mp3\');" '+Game.getTooltip('<div style="width:150px;text-align:center;font-size:11px;"><b>Unmute '+me.plural+'</b><br>(Display this building)</div>')+'></div>';
				
				AddEvent(me.canvas,'mouseover',function(me){return function(){me.mouseOn=true;}}(me));
				AddEvent(me.canvas,'mouseout',function(me){return function(){me.mouseOn=false;}}(me));
				AddEvent(me.canvas,'mousemove',function(me){return function(e){var box=this.getBoundingClientRect();me.mousePos[0]=e.pageX-box.left;me.mousePos[1]=e.pageY-box.top;}}(me));
			}
		}
		Game.mutedBuildingTooltip=function(id)
		{
			return function(){
				var me=Game.ObjectsById[id];
				return '<div style="width:150px;text-align:center;font-size:11px;"><b>'+(me.plural.charAt(0).toUpperCase()+me.plural.slice(1))+(me.level>0?'(Lv.&nbsp;'+me.level+')':'')+'</b><div class="line"></div><b>クリックして'+me.plural+'の非表示を解除</b><br>(この施設を表示します)</div>';
			}
		}
		l('buildingsMute').innerHTML=muteStr;
		
		/*=====================================================================================
		UPGRADES
		=======================================================================================*/
		Game.upgradesToRebuild=1;
		Game.Upgrades=[];
		Game.UpgradesById=[];
		Game.UpgradesN=0;
		Game.UpgradesInStore=[];
		Game.UpgradesOwned=0;
		Game.Upgrade=function(name,desc,price,icon,buyFunction)
		{
			this.id=Game.UpgradesN;
			this.name=name;
			this.desc=desc;
			this.baseDesc=this.desc;
			this.desc=BeautifyInText(this.baseDesc);
			this.basePrice=price;
			this.priceLumps=0;//note : doesn't do much on its own, you still need to handle the buying yourself
			this.icon=icon;
			this.iconFunction=0;
			this.buyFunction=buyFunction;
			/*this.unlockFunction=unlockFunction;
			this.unlocked=(this.unlockFunction?0:1);*/
			this.unlocked=0;
			this.bought=0;
			this.order=this.id;
			if (order) this.order=order+this.id*0.001;
			this.pool='';//can be '', cookie, toggle, debug, prestige, prestigeDecor, tech, or unused
			if (pool) this.pool=pool;
			this.power=0;
			if (power) this.power=power;
			this.vanilla=Game.vanilla;
			this.unlockAt=0;
			this.techUnlock=[];
			this.parents=[];
			this.type='upgrade';
			this.tier=0;
			this.buildingTie=0;//of what building is this a tiered upgrade of ?
			
			Game.last=this;
			Game.Upgrades[this.name]=this;
			Game.UpgradesById[this.id]=this;
			Game.UpgradesN++;
			return this;
		}
		
		Game.Upgrade.prototype.getPrice=function()
		{
			var price=this.basePrice;
			if (this.priceFunc) price=this.priceFunc(this);
			if (price==0) return 0;
			if (this.pool!='prestige')
			{
				if (Game.Has('玩具工房')) price*=0.95;
				if (Game.Has('万引き')) price*=Math.pow(0.99,Game.Objects['カーソル'].amount/100);
				if (Game.Has('サンタの支配')) price*=0.98;
				if (Game.Has('ファベルジェの卵')) price*=0.99;
				if (Game.Has('神聖な安売り')) price*=0.99;
				if (Game.Has('幸運 No.100')) price*=0.99;
				if (this.kitten && Game.Has('子猫の給料')) price*=0.9;
				if (Game.hasBuff('値切り運')) price*=0.98;
				if (Game.hasBuff('押し売り')) price*=1.02;
				//if (Game.hasAura('Master of the Armory')) price*=0.98;
				price*=1-Game.auraMult('武器庫の主')*0.02;
				price*=Game.eff('upgradeCost');
				if (this.pool=='cookie' && Game.Has('神聖なベーカリー')) price/=5;
			}
			return Math.ceil(price);
		}
		
		Game.Upgrade.prototype.canBuy=function()
		{
			if (this.canBuyFunc) return this.canBuyFunc();
			if (Game.cookies>=this.getPrice()) return true; else return false;
		}
		
		Game.storeBuyAll=function()
		{
			if (!Game.Has('思いつきで作ったチェックリスト')) return false;
			for (var i in Game.UpgradesInStore)
			{
				var me=Game.UpgradesInStore[i];
				if (!me.isVaulted() && me.pool!='toggle' && me.pool!='tech') me.buy(1);
			}
		}
		
		Game.vault=[];
		Game.Upgrade.prototype.isVaulted=function()
		{
			if (Game.vault.indexOf(this.id)!=-1) return true; else return false;
		}
		Game.Upgrade.prototype.vault=function()
		{
			if (!this.isVaulted()) Game.vault.push(this.id);
		}
		Game.Upgrade.prototype.unvault=function()
		{
			if (this.isVaulted()) Game.vault.splice(Game.vault.indexOf(this.id),1);
		}
		
		Game.Upgrade.prototype.click=function(e)
		{
			if ((e && e.shiftKey) || Game.keys[16])
			{
				if (this.pool=='toggle' || this.pool=='tech') {}
				else if (Game.Has('思いつきで作ったチェックリスト'))
				{
					if (this.isVaulted()) this.unvault();
					else this.vault();
					Game.upgradesToRebuild=1;
					PlaySound('snd/tick.mp3');
				}
			}
			else this.buy();
		}
		
		
		Game.Upgrade.prototype.buy=function(bypass)
		{
			var success=0;
			var cancelPurchase=0;
			if (this.clickFunction && !bypass) cancelPurchase=!this.clickFunction();
			if (!cancelPurchase)
			{
				if (this.choicesFunction)
				{
					if (Game.choiceSelectorOn==this.id)
					{
						l('toggleBox').style.display='none';
						l('toggleBox').innerHTML='';
						Game.choiceSelectorOn=-1;
						PlaySound('snd/tick.mp3');
					}
					else
					{
						Game.choiceSelectorOn=this.id;
						var choices=this.choicesFunction();
						if (choices.length>0)
						{
							var selected=0;
							for (var i in choices) {if (choices[i].selected) selected=i;}
							Game.choiceSelectorChoices=choices;//this is a really dumb way of doing this i am so sorry
							Game.choiceSelectorSelected=selected;
							var str='';
							str+='<div class="close" onclick="Game.UpgradesById['+this.id+'].buy();">x</div>';
							str+='<h3>'+this.name+'</h3>'+
							'<div class="line"></div>'+
							'<h4 id="choiceSelectedName">'+choices[selected].name+'</h4>'+
							'<div class="line"></div>';
							
							for (var i in choices)
							{
								choices[i].id=i;
								choices[i].order=choices[i].order||0;
							}
							
							var sortMap=function(a,b)
							{
								if (a.order>b.order) return 1;
								else if (a.order<b.order) return -1;
								else return 0;
							}
							choices.sort(sortMap);
							
							for (var i=0;i<choices.length;i++)
							{
								if (!choices[i]) continue;
								var icon=choices[i].icon;
								var id=choices[i].id;
								if (choices[i].div) str+='<div class="line"></div>';
								str+='<div class="crate enabled'+(id==selected?' highlighted':'')+'" style="opacity:1;float:none;display:inline-block;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;" '+Game.clickStr+'="Game.UpgradesById['+this.id+'].choicesPick('+id+');Game.choiceSelectorOn=-1;Game.UpgradesById['+this.id+'].buy();" onMouseOut="l(\'choiceSelectedName\').innerHTML=Game.choiceSelectorChoices[Game.choiceSelectorSelected].name;" onMouseOver="l(\'choiceSelectedName\').innerHTML=Game.choiceSelectorChoices['+i+'].name;"'+
								'></div>';
							}
						}
						l('toggleBox').innerHTML=str;
						l('toggleBox').style.display='block';
						l('toggleBox').focus();
						Game.tooltip.hide();
						PlaySound('snd/tick.mp3');
						success=1;
					}
				}
				else if (this.pool!='prestige')
				{
					var price=this.getPrice();
					if (this.canBuy() && !this.bought)
					{
						Game.Spend(price);
						this.bought=1;
						if (this.buyFunction) this.buyFunction();
						if (this.toggleInto)
						{
							Game.Lock(this.toggleInto);
							Game.Unlock(this.toggleInto);
						}
						Game.upgradesToRebuild=1;
						Game.recalculateGains=1;
						if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned++;
						Game.setOnCrate(0);
						Game.tooltip.hide();
						PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);
						success=1;
					}
				}
				else
				{
					var price=this.getPrice();
					if (Game.heavenlyChips>=price && !this.bought)
					{
						Game.heavenlyChips-=price;
						Game.heavenlyChipsSpent+=price;
						this.unlocked=1;
						this.bought=1;
						if (this.buyFunction) this.buyFunction();
						Game.BuildAscendTree();
						PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);
						PlaySound('snd/shimmerClick.mp3');
						//PlaySound('snd/buyHeavenly.mp3');
						success=1;
					}
				}
			}
			if (this.bought && this.activateFunction) this.activateFunction();
			return success;
		}
		Game.Upgrade.prototype.earn=function()//just win the upgrades without spending anything
		{
			this.unlocked=1;
			this.bought=1;
			if (this.buyFunction) this.buyFunction();
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned++;
		}
		Game.Upgrade.prototype.unearn=function()//remove the upgrade, but keep it unlocked
		{
			this.bought=0;
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned--;
		}
		Game.Upgrade.prototype.unlock=function()
		{
			this.unlocked=1;
			Game.upgradesToRebuild=1;
		}
		Game.Upgrade.prototype.lose=function()
		{
			this.unlocked=0;
			this.bought=0;
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned--;
		}
		Game.Upgrade.prototype.toggle=function()//cheating only
		{
			if (!this.bought)
			{
				this.bought=1;
				if (this.buyFunction) this.buyFunction();
				Game.upgradesToRebuild=1;
				Game.recalculateGains=1;
				if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned++;
				PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);
				if (this.pool=='prestige' || this.pool=='debug') PlaySound('snd/shimmerClick.mp3');
			}
			else
			{
				this.bought=0;
				Game.upgradesToRebuild=1;
				Game.recalculateGains=1;
				if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned--;
				PlaySound('snd/sell'+choose([1,2,3,4])+'.mp3',0.75);
				if (this.pool=='prestige' || this.pool=='debug') PlaySound('snd/shimmerClick.mp3');
			}
			if (Game.onMenu=='stats') Game.UpdateMenu();
		}
		
		Game.CountsAsUpgradeOwned=function(pool)
		{
			if (pool=='' || pool=='cookie' || pool=='tech') return true; else return false;
		}
		
		/*AddEvent(l('toggleBox'),'blur',function()//if we click outside of the selector, close it
			{
				//this has a couple problems, such as when clicking on the upgrade - this toggles it off and back on instantly
				l('toggleBox').style.display='none';
				l('toggleBox').innerHTML='';
				Game.choiceSelectorOn=-1;
			}
		);*/
		
		Game.RequiresConfirmation=function(upgrade,prompt)
		{
			upgrade.clickFunction=function(){Game.Prompt(prompt,[['はい','Game.UpgradesById['+upgrade.id+'].buy(1);Game.ClosePrompt();'],'いいえ']);return false;};
		}
		
		Game.Unlock=function(what)
		{
			if (typeof what==='string')
			{
				if (Game.Upgrades[what])
				{
					if (Game.Upgrades[what].unlocked==0)
					{
						Game.Upgrades[what].unlocked=1;
						Game.upgradesToRebuild=1;
						Game.recalculateGains=1;
						/*if (Game.prefs.popups) {}
						else Game.Notify('アップグレードが解除されました','<div class="title" style="font-size:18px;margin-top:-2px;">'+Game.Upgrades[what].name+'</div>',Game.Upgrades[what].icon,6);*/
					}
				}
			}
			else {for (var i in what) {Game.Unlock(what[i]);}}
		}
		Game.Lock=function(what)
		{
			if (typeof what==='string')
			{
				if (Game.Upgrades[what])
				{
					Game.Upgrades[what].unlocked=0;
					Game.upgradesToRebuild=1;
					if (Game.Upgrades[what].bought==1 && Game.CountsAsUpgradeOwned(Game.Upgrades[what].pool)) Game.UpgradesOwned--;
					Game.Upgrades[what].bought=0;
					Game.recalculateGains=1;
				}
			}
			else {for (var i in what) {Game.Lock(what[i]);}}
		}
		
		Game.Has=function(what)
		{
			var it=Game.Upgrades[what];
			if (Game.ascensionMode==1 && (it.pool=='prestige' || it.tier=='fortune')) return 0;
			return (it?it.bought:0);
		}
		Game.HasUnlocked=function(what)
		{
			return (Game.Upgrades[what]?Game.Upgrades[what].unlocked:0);
		}
		
		
		Game.RebuildUpgrades=function()//recalculate the upgrades you can buy
		{
			Game.upgradesToRebuild=0;
			var list=[];
			for (var i in Game.Upgrades)
			{
				var me=Game.Upgrades[i];
				if (!me.bought && me.pool!='debug' && me.pool!='prestige' && me.pool!='prestigeDecor' && (Game.ascensionMode!=1 || (!me.lasting && me.tier!='fortune')))
				{
					if (me.unlocked) list.push(me);
				}
				else if (me.displayFuncWhenOwned && me.bought) list.push(me);
			}
			var sortMap=function(a,b)
			{
				var ap=a.pool=='toggle'?a.order:a.getPrice();
				var bp=b.pool=='toggle'?b.order:b.getPrice();
				if (ap>bp) return 1;
				else if (ap<bp) return -1;
				else return 0;
			}
			list.sort(sortMap);
			
			Game.UpgradesInStore=[];
			for (var i in list)
			{
				Game.UpgradesInStore.push(list[i]);
			}
			var storeStr='';
			var toggleStr='';
			var techStr='';
			var vaultStr='';
			
			if (Game.Has('思いつきで作ったチェックリスト'))
			{
				storeStr+='<div id="storeBuyAll" class="storePre" '+Game.getTooltip(
								'<div style="padding:8px;min-width:250px;text-align:center;font-size:11px;">安い順に、購入可能なアップグレードすべてが<b>すぐに購入</b>されます。<br><b>保管庫</b>のアップグレードは自動購入されません。<br>保管庫に保管したいアップグレードは上で<b>Shift+クリック</b>してください。</div>'
								,'store')+
					'>'+
						'<div id="storeBuyAllButton" class="storePreButton" '+Game.clickStr+'="Game.storeBuyAll();">全アップグレード購入</div>'+
					'</div>';
				l('upgrades').classList.add('hasMenu');
			}
			else l('upgrades').classList.remove('hasMenu');
			
			for (var i in Game.UpgradesInStore)
			{
				//if (!Game.UpgradesInStore[i]) break;
				var me=Game.UpgradesInStore[i];
				var str=Game.crate(me,'store','Game.UpgradesById['+me.id+'].click(event);','upgrade'+i);
				
				/*var str='<div class="crate upgrade" '+Game.getTooltip(
				'<div style="min-width:200px;"><div style="float:right;"><span class="price">'+Beautify(Math.round(me.getPrice()))+'</span></div><small>'+(me.pool=='toggle'?'[Togglable]':'[Upgrade]')+'</small><div class="name">'+me.name+'</div><div class="line"></div><div class="description">'+me.desc+'</div></div>'
				,'store')+Game.clickStr+'="Game.UpgradesById['+me.id+'].buy();" id="upgrade'+i+'" style="'+(me.icon[2]?'background-image:url('+me.icon[2]+');':'')+'background-position:'+(-me.icon[0]*48)+'px '+(-me.icon[1]*48)+'px;"></div>';*/
				if (me.pool=='toggle') toggleStr+=str; else if (me.pool=='tech') techStr+=str; else
				{
					if (me.isVaulted() && Game.Has('思いつきで作ったチェックリスト')) vaultStr+=str; else storeStr+=str;
				}
			}
			
			l('upgrades').innerHTML=storeStr;
			l('toggleUpgrades').innerHTML=toggleStr;
			if (toggleStr=='') l('toggleUpgrades').style.display='none'; else l('toggleUpgrades').style.display='block';
			l('techUpgrades').innerHTML=techStr;
			if (techStr=='') l('techUpgrades').style.display='none'; else l('techUpgrades').style.display='block';
			l('vaultUpgrades').innerHTML=vaultStr;
			if (vaultStr=='') l('vaultUpgrades').style.display='none'; else l('vaultUpgrades').style.display='block';
		}
		
		Game.UnlockAt=[];//this contains an array of every upgrade with a cookie requirement in the form of {cookies:(amount of cookies earned required),name:(name of upgrade or achievement to unlock)} (and possibly require:(name of upgrade of achievement to own))
		//note : the cookie will not be added to the list if it contains locked:1 (use for seasonal cookies and such)
		
		Game.NewUpgradeCookie=function(obj)
		{
			var upgrade=new Game.Upgrade(obj.name,'クッキーの生産量が <b>+'+Beautify((typeof(obj.power)==='function'?obj.power(obj):obj.power),1)+'%</b> される。<q>'+obj.desc+'</q>',obj.price,obj.icon);
			upgrade.power=obj.power;
			upgrade.pool='cookie';
			var toPush={cookies:obj.price/20,name:obj.name};
			if (obj.require) toPush.require=obj.require;
			if (obj.season) toPush.season=obj.season;
			if (!obj.locked) Game.UnlockAt.push(toPush);
			return upgrade;
		}
		
		//tiered upgrades system
		//each building has several upgrade tiers
		//all upgrades in the same tier have the same color, unlock threshold and price multiplier
		Game.Tiers={
			1:{name:'普通',unlock:1,achievUnlock:1,iconRow:0,color:'#ccb3ac',price:					10},
			2:{name:'ベリーリウム',unlock:5,achievUnlock:50,iconRow:1,color:'#ff89e7',price:				50},
			3:{name:'ブルーベリーリウム',unlock:25,achievUnlock:100,iconRow:2,color:'#00deff',price:			500},
			4:{name:'蜜玉髄',unlock:50,achievUnlock:150,iconRow:13,color:'#ffcc2f',price:			50000},
			5:{name:'牛酪金',unlock:100,achievUnlock:200,iconRow:14,color:'#e9d673',price:			5000000},
			6:{name:'泥状グレーズ',unlock:150,achievUnlock:250,iconRow:15,color:'#a8bf91',price:			500000000},
			7:{name:'ハッカ黒玉',unlock:200,achievUnlock:300,iconRow:16,color:'#60ff50',price:				500000000000},
			8:{name:'サクランボ銀',unlock:250,achievUnlock:350,iconRow:17,color:'#f01700',price:		500000000000000},
			9:{name:'ヘーゼルエメラルド',unlock:300,achievUnlock:400,iconRow:18,color:'#9ab834',price:			500000000000000000},
			10:{name:'月長飴',unlock:350,achievUnlock:450,iconRow:19,color:'#7e7ab9',price:			500000000000000000000},
			11:{name:'惑星ファッジ',unlock:400,achievUnlock:500,iconRow:28,color:'#9a3316',price:			5000000000000000000000000},
			12:{name:'クリーム石膏',unlock:450,achievUnlock:550,iconRow:30,color:'#c1a88c',price:		50000000000000000000000000000},
			13:{name:'ウマイリジウム',unlock:500,achievUnlock:600,iconRow:31,color:'#adb1b3',price:			500000000000000000000000000000000},
			'synergy1':{name:'シナジー I',unlock:15,iconRow:20,color:'#008595',special:1,req:'シナジーアップグレード I',price:			200000},
			'synergy2':{name:'シナジー II',unlock:75,iconRow:29,color:'#008595',special:1,req:'シナジーアップグレード II',price:			200000000000},
			'fortune':{name:'幸運',unlock:-1,iconRow:32,color:'#9ab834',special:1,price:				77777777777777777777777777777},
		};
		for (var i in Game.Tiers){Game.Tiers[i].upgrades=[];}
		Game.GetIcon=function(type,tier)
		{
			var col=0;
			if (type=='Kitten') col=18; else col=Game.Objects[type].iconColumn;
			return [col,Game.Tiers[tier].iconRow];
		}
		Game.SetTier=function(building,tier)
		{
			if (!Game.Objects[building]) alert('No building named '+building);
			Game.last.tier=tier;
			Game.last.buildingTie=Game.Objects[building];
			if (Game.last.type=='achievement') Game.Objects[building].tieredAchievs[tier]=Game.last;
			else Game.Objects[building].tieredUpgrades[tier]=Game.last;
		}
		Game.MakeTiered=function(upgrade,tier,col)
		{
			upgrade.tier=tier;
			if (typeof col!=='undefined') upgrade.icon=[col,Game.Tiers[tier].iconRow];
		}
		Game.TieredUpgrade=function(name,desc,building,tier)
		{
			var upgrade=new Game.Upgrade(name,desc,Game.Objects[building].basePrice*Game.Tiers[tier].price,Game.GetIcon(building,tier));
			Game.SetTier(building,tier);
			if (!upgrade.buildingTie1 && building) upgrade.buildingTie1=Game.Objects[building];
			if (tier=='fortune' && building) Game.Objects[building].fortune=upgrade;
			return upgrade;
		}
		Game.SynergyUpgrade=function(name,desc,building1,building2,tier)
		{
			/*
				creates a new upgrade that :
				-unlocks when you have tier.unlock of building1 and building2
				-is priced at (building1.price*10+building2.price*1)*tier.price (formerly : Math.sqrt(building1.price*building2.price)*tier.price)
				-gives +(0.1*building1)% cps to building2 and +(5*building2)% cps to building1
				-if building2 is below building1 in worth, swap them
			*/
			//if (Game.Objects[building1].basePrice>Game.Objects[building2].basePrice) {var temp=building2;building2=building1;building1=temp;}
			var b1=Game.Objects[building1];
			var b2=Game.Objects[building2];
			if (b1.basePrice>b2.basePrice) {b1=Game.Objects[building2];b2=Game.Objects[building1];}//swap
			
			desc=
				b1.plural+'のCpSが'+b2.name+'1つにつき <b>+5%</b> 上昇する。<br>'+
				b2.plural+'のCpSが'+b1.name+'1つにつき <b>+0.1%</b> 上昇する。<br>'+
				desc;
			var upgrade=new Game.Upgrade(name,desc,(b1.basePrice*10+b2.basePrice*1)*Game.Tiers[tier].price,Game.GetIcon(building1,tier));//Math.sqrt(b1.basePrice*b2.basePrice)*Game.Tiers[tier].price
			upgrade.tier=tier;
			upgrade.buildingTie1=b1;
			upgrade.buildingTie2=b2;
			upgrade.priceFunc=function(){return (this.buildingTie1.basePrice*10+this.buildingTie2.basePrice*1)*Game.Tiers[this.tier].price*(Game.Has('キメラ')?0.98:1);};
			Game.Objects[building1].synergies.push(upgrade);
			Game.Objects[building2].synergies.push(upgrade);
			//Game.SetTier(building1,tier);
			return upgrade;
		}
		Game.GetTieredCpsMult=function(me)
		{
			var mult=1;
			for (var i in me.tieredUpgrades) {if (!Game.Tiers[me.tieredUpgrades[i].tier].special && Game.Has(me.tieredUpgrades[i].name)) mult*=2;}
			for (var i in me.synergies)
			{
				var syn=me.synergies[i];
				if (Game.Has(syn.name))
				{
					if (syn.buildingTie1.name==me.name) mult*=(1+0.05*syn.buildingTie2.amount);
					else if (syn.buildingTie2.name==me.name) mult*=(1+0.001*syn.buildingTie1.amount);
				}
			}
			if (me.fortune && Game.Has(me.fortune.name)) mult*=1.07;
			if (me.grandma && Game.Has(me.grandma.name)) mult*=(1+Game.Objects['グランマ'].amount*0.01*(1/(me.id-1)));
			return mult;
		}
		Game.UnlockTiered=function(me)
		{
			for (var i in me.tieredUpgrades) {if (Game.Tiers[me.tieredUpgrades[i].tier].unlock!=-1 && me.amount>=Game.Tiers[me.tieredUpgrades[i].tier].unlock) Game.Unlock(me.tieredUpgrades[i].name);}
			for (var i in me.tieredAchievs) {if (me.amount>=Game.Tiers[me.tieredAchievs[i].tier].achievUnlock) Game.Win(me.tieredAchievs[i].name);}
			for (var i in me.synergies) {var syn=me.synergies[i];if (Game.Has(Game.Tiers[syn.tier].req) && syn.buildingTie1.amount>=Game.Tiers[syn.tier].unlock && syn.buildingTie2.amount>=Game.Tiers[syn.tier].unlock) Game.Unlock(syn.name);}
		}
		
		
		
		var pool='';
		var power=0;
		
		//define upgrades
		//WARNING : do NOT add new upgrades in between, this breaks the saves. Add them at the end !
		var order=100;//this is used to set the order in which the items are listed
		new Game.Upgrade('強化人差し指','マウスとカーソルが <b>2倍</b> 効率的になる。<q>ツンツン</q>',100,[0,0]);Game.MakeTiered(Game.last,1,0);
		new Game.Upgrade('手根管症候群防止クリーム','マウスとカーソルが <b>2倍</b> 効率的になる。<q>クリックしすぎで……指が痛い……</q>',500,[0,1]);Game.MakeTiered(Game.last,2,0);
		new Game.Upgrade('二刀流','マウスとカーソルが <b>2倍</b> 効率的になる。<q>みてみて、両手!</q>',10000,[0,2]);Game.MakeTiered(Game.last,3,0);
		new Game.Upgrade('千手観音','クリックとカーソルの生産量が所持しているカーソル以外の施設1つにつき <b>+0.1</b> クッキーされる。<q>クリックなう</q>',100000,[0,13]);Game.MakeTiered(Game.last,4,0);
		new Game.Upgrade('万手観音','千手観音から得られる量を <b>5</b>倍 する。<q>クリッククリックなう</q>',10000000,[0,14]);Game.MakeTiered(Game.last,5,0);
		new Game.Upgrade('億手観音','千手観音から得られる量を <b>10</b>倍 する。<q>クリッククリッククリックなう</q>',100000000,[0,15]);Game.MakeTiered(Game.last,6,0);
		new Game.Upgrade('兆手観音','千手観音から得られる量を <b>20</b>倍 する。<q>クリッククリッククリッククリックなう</q>',1000000000,[0,16]);Game.MakeTiered(Game.last,7,0);
		
		order=200;
		new Game.TieredUpgrade('グランマからの返信','グランマが <b>2倍</b> 効率的になる。<q>RE:RE:これで喜んでくれればいいけど</q>','グランマ',1);
		new Game.TieredUpgrade('金属製のし棒','グランマが <b>2倍</b> 効率的になる。<q>やっぱりコレね。</q>','グランマ',2);
		new Game.TieredUpgrade('なめらかな総入れ歯','グランマが <b>2倍</b> 効率的になる。<q>ぐしゃっ</q>','グランマ',3);
		
		order=300;
		new Game.TieredUpgrade('安いクワ','農場が <b>2倍</b> 効率的になる。<q>一掘りでこんなに!</q>','農場',1);
		new Game.TieredUpgrade('化学肥料','農場が <b>2倍</b> 効率的になる。<q>神に誓って、これはチョコレートである。</q>','農場',2);
		new Game.TieredUpgrade('クッキーの木','農場が <b>2倍</b> 効率的になる。<q>パンノキの一種だ。</q>','農場',3);
		
		order=500;
		new Game.TieredUpgrade('より丈夫なベルトコンベアー','工場が <b>2倍</b> 効率的になる。<q>ますます上手く行く。</q>','工場',1);
		new Game.TieredUpgrade('児童労働','工場が <b>2倍</b> 効率的になる。<q>安くて元気な労働力。</q>','工場',2);
		new Game.TieredUpgrade('搾取工場','工場が <b>2倍</b> 効率的になる。<q>怠け者は消される。</q>','工場',3);
		
		order=400;
		new Game.TieredUpgrade('砂糖ガス','鉱山が <b>2倍</b> 効率的になる。<q>いくつかのチョコレート洞窟の奥で発見された、質の悪い揮発性ガス。</q>','鉱山',1);
		new Game.TieredUpgrade('メガドリル','鉱山が <b>2倍</b> 効率的になる。<q>だいぶ深くまできたね。</q>','鉱山',2);
		new Game.TieredUpgrade('ウルトラドリル','鉱山が <b>2倍</b> 効率的になる。<q>もう降参か?</q>','鉱山',3);
		
		order=600;
		new Game.TieredUpgrade('バニラ星雲','宇宙船が <b>2倍</b> 効率的になる。<q>宇宙服のヘルメットを脱いだら、バニラの匂いがするかもね!(備考:やらないでね)</q>','宇宙船',1);
		new Game.TieredUpgrade('ワームホール','宇宙船が <b>2倍</b> 効率的になる。<q>このショートカットを利用することで、より早く航行出来ます。</q>','宇宙船',2);
		new Game.TieredUpgrade('頻回発射','宇宙船が <b>2倍</b> 効率的になる。<q>すぐ戻るよ!</q>','宇宙船',3);
		
		order=700;
		new Game.TieredUpgrade('アンチモン','錬金術室が <b>2倍</b> 効率的になる。<q>実際金の価値がある。</q>','錬金術室',1);
		new Game.TieredUpgrade('生地のエッセンス','錬金術室が <b>2倍</b> 効率的になる。<q>古代錬クッキー術の5つの秘法により抽出する。</q>','錬金術室',2);
		new Game.TieredUpgrade('本物のチョコレート','錬金術室が <b>2倍</b> 効率的になる。<q>カカオの構成と全く同じ。</q>','錬金術室',3);
		
		order=800;
		new Game.TieredUpgrade('古代の豆板','ポータルが <b>2倍</b> 効率的になる。<q>もろいピーナッツで出来た奇妙な石版は、古代のクッキーレシピを遺していた。凄い!</q>','ポータル',1);
		new Game.TieredUpgrade('キチガイじみた麦星の労働者たち','ポータルが <b>2倍</b> 効率的になる。<q>立ち上がれ、我がミニオン達よ!</q>','ポータル',2);
		new Game.TieredUpgrade('魂の契約','ポータルが <b>2倍</b> 効率的になる。<q>「僕と契約して、もっとクッキーを作ってよ!」「ええ、もちろん！」</q>','ポータル',3);
		
		order=900;
		new Game.TieredUpgrade('次元移転装置','タイムマシンが <b>2倍</b> 効率的になる。<q>ベイク・トゥー・ザ・フューチャー。</q>','タイムマシン',1);
		new Game.TieredUpgrade('タイムパラドックスリゾルバー','タイムマシンが <b>2倍</b> 効率的になる。<q>もうあなたのグランマをかつぐ必要はない!</q>','タイムマシン',2);
		new Game.TieredUpgrade('量子的難問','タイムマシンが <b>2倍</b> 効率的になる。<q>星がいっぱいだ!</q>','タイムマシン',3);
		
		order=20000;
		new Game.Upgrade('お手伝い猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>手伝うかにゃー?</q>',9000000,Game.GetIcon('Kitten',1));Game.last.kitten=1;Game.MakeTiered(Game.last,1,18);
		new Game.Upgrade('労働者猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>にゃーにゃーにゃーにゃー</q>',9000000000,Game.GetIcon('Kitten',2));Game.last.kitten=1;Game.MakeTiered(Game.last,2,18);
		
		order=10000;
		Game.NewUpgradeCookie({name:'プレーンクッキー',desc:'取り敢えず始めないとね。',icon:[2,3],power:										1,	price:	999999});
		Game.NewUpgradeCookie({name:'シュガークッキー',desc:'おいしい。ちょっと平凡だが。',icon:[7,3],power:									1,	price:	999999*5});
		Game.NewUpgradeCookie({name:'オートミールレーズンクッキー',desc:'これを嫌う理由はない。',icon:[0,3],power:									1,	price:	9999999});
		Game.NewUpgradeCookie({name:'ピーナッツバタークッキー',desc:'ジャムクッキーはお好みでどうぞ！ ',icon:[1,3],power:								2,	price:	9999999*5});
		Game.NewUpgradeCookie({name:'ココナッツクッキー',desc:'ボロボロ剥がれ易いが、信頼までボロボロではない。これが大好きで堪らないって人もいる。',icon:[3,3],power:		2,	price:	99999999});
		order=10001;
		Game.NewUpgradeCookie({name:'ホワイトチョコレートクッキー',desc:'言いたいことは分かる。これはただのココアバターだ!本物のチョコじゃない!<br>ったく。',icon:[4,3],power:2,	price:	99999999*5});
		order=10000;
		Game.NewUpgradeCookie({name:'マカダミアナッツクッキー',desc:'くっそウマい!',icon:[5,3],power:								2,	price:	99999999});
		order=10002;
		Game.NewUpgradeCookie({name:'ダブルチップクッキー',desc:'二倍のチップ<br>二倍のうまみ<br>(二倍のカロリー)',icon:[6,3],power:2,	price:	999999999*5});
		Game.NewUpgradeCookie({name:'ホワイトチョコレートマカダミアナッツクッキー',desc:'Orteil氏のお気に入り',icon:[8,3],power:						2,	price:	9999999999});
		Game.NewUpgradeCookie({name:'オールチョコレートクッキー',desc:'チョコレート過剰摂取 ',icon:[9,3],power:												2,	price:	9999999999*5});
		
		order=100;
		new Game.Upgrade('京手観音','千手観音から得られる量を <b>20</b>倍 する。<q>クリッククリッククリッククリッククリック</q>',10000000000,[0,17]);Game.MakeTiered(Game.last,8,0);
		
		order=200;new Game.TieredUpgrade('プルーンジュース','グランマが <b>2倍</b> 効率的になる。<q>もっと。</q>','グランマ',4);
		order=300;new Game.TieredUpgrade('遺伝子組み換えクッキー','農場が <b>2倍</b> 効率的になる。<q>全て自然な変異である。</q>','農場',4);
		order=500;new Game.TieredUpgrade('ラジウム反応装置','工場が <b>2倍</b> 効率的になる。<q>あなたのクッキーにヘルシーな光を追加。</q>','工場',4);
		order=400;new Game.TieredUpgrade('アルテマドリル','鉱山が <b>2倍</b> 効率的になる。<q>天を衝く、とかね。</q>','鉱山',4);
		order=600;new Game.TieredUpgrade('ワープ航法','宇宙船が <b>2倍</b> 効率的になる。<q>大胆なクッキー作りのために。</q>','宇宙船',4);
		order=700;new Game.TieredUpgrade('アンブロシア','錬金術室が <b>2倍</b> 効率的になる。<q>これをクッキー生地に加えると、更に病みつきなものになるに違いない!恐らくとても危険なほどに……。合法に取引し続けられることを願おう。</q>','錬金術室',4);
		order=800;new Game.TieredUpgrade('「健全な」踊り','ポータルが <b>2倍</b> 効率的になる。<q>望めば変えられる。脳みそを放り出そう。</q>','ポータル',4);
		order=900;new Game.TieredUpgrade('因果律強要課程','タイムマシンが <b>2倍</b> 効率的になる。<q>何が、何かが起こった。</q>','タイムマシン',4);
		
		order=5000;
		new Game.Upgrade('吉日','ゴールデンクッキーが <b>2倍頻繁に</b> 出現し、 <b>2倍長く</b> 画面に留まるようになる。<q>やった、四つ葉のペニーだ!</q>',777777777,[27,6]);
		new Game.Upgrade('発見能力','ゴールデンクッキーが <b>2倍頻繁に</b> 出現し、 <b>2倍長く</b> 画面に留まるようになる。<q>なんてこったい!蹄鉄が7つだ!</q>',77777777777,[27,6]);
		
		order=20000;
		new Game.Upgrade('技術者猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>にゃーにゃーにゃーにゃー、ご主人様</q>',90000000000000,Game.GetIcon('Kitten',3));Game.last.kitten=1;Game.MakeTiered(Game.last,3,18);
		
		order=10020;
		Game.NewUpgradeCookie({name:'ダークチョコレートコーティングクッキー',desc:'このクッキーは光を良く吸収するので、見つけるためにはほとんどの場合、目を凝らす必要がある。',icon:[10,3],power:			5,	price:	99999999999});
		Game.NewUpgradeCookie({name:'ホワイトチョコレートコーティングクッキー',desc:'フレーバーで完璧にコーティングされてて眩しいくらいピカピカだ。',icon:[11,3],power:					5,	price:	99999999999});
		
		Game.GrandmaSynergies=[];
		Game.GrandmaSynergy=function(name,desc,building)
		{
			var building=Game.Objects[building];
			var grandmaNumber=(building.id-1);
			if (grandmaNumber==1) grandmaNumber='グランマ';
			else grandmaNumber+='グランマ';
			desc='グランマが <b>2倍</b> 効率的になる。'+building.plural+'のCpSが'+grandmaNumber+'につき <b>+1%</b> 上昇する。<q>'+desc+'</q>';
			
			var upgrade=new Game.Upgrade(name,desc,building.basePrice*Game.Tiers[2].price,[10,9],function(){Game.Objects['グランマ'].redraw();});
			building.grandma=upgrade;
			upgrade.buildingTie=building;
			Game.GrandmaSynergies.push(upgrade.name);
			return upgrade;
		}
		
		order=250;
		Game.GrandmaSynergy('農婦のグランマ','より多くクッキーを育てる素敵な農業者。','農場');
		Game.GrandmaSynergy('鉱婦のグランマ','より多くクッキーを採掘する素敵な鉱山労働者。','鉱山');
		Game.GrandmaSynergy('工員のグランマ','より多くクッキーを生産する素敵な労働者。','工場');
		Game.GrandmaSynergy('宇宙のグランマ','クッキーを…あー…する素敵なもの。','宇宙船');
		Game.GrandmaSynergy('ミュータントグランマ','より多くクッキーを錬金する素敵な金のグランマ。','錬金術室');
		Game.GrandmaSynergy('別世界のグランマ','よリ多ク#########くス敵ナぐラんマ','ポータル');
		Game.GrandmaSynergy('ひいひいグランマ','倍のクッキーを焼く素敵なグランマの素敵なグランマ。','タイムマシン');
		
		order=14000;
		Game.baseResearchTime=Game.fps*60*30;
		Game.SetResearch=function(what,time)
		{
			if (Game.Upgrades[what] && !Game.Has(what))
			{
				Game.researchT=Game.baseResearchTime;
				if (Game.Has('消せない記憶')) Game.researchT=Math.ceil(Game.baseResearchTime/10);
				if (Game.Has('超科学')) Game.researchT=Game.fps*5;
				Game.nextResearch=Game.Upgrades[what].id;
				if (Game.prefs.popups) Game.Popup('研究が開始されました.');
				else Game.Notify('研究が開始されました','ビンゴセンター/研究施設が実験を指揮しています。',[9,0]);
			}
		}
		
		new Game.Upgrade('ビンゴセンター/研究施設','グランマによって運営されている研究室とレジャー会館。<br>グランマが <b>4倍</b> 効率的になる。<br><b>定期的に新しいアップグレードが開放される</b>。<q>グランマたちの不満を何とか抑える方法は無いのか?<br>…ビンゴ。</q>',1000000000000000,[11,9],function(){Game.SetResearch('特殊チョコレートチップ');});Game.last.noPerm=1;
		
		order=15000;
		new Game.Upgrade('特殊チョコレートチップ','クッキーの生産量が <b>+1%</b> される。<q>電子設計チョコチップ。言うなればコンピューターチップ。</q>',1000000000000000,[0,9],function(){Game.SetResearch('デザイナーココア豆');});Game.last.pool='tech';
		new Game.Upgrade('デザイナーココア豆','クッキーの生産量が <b>+2%</b> される。<q>従来よりも空力的に優れた新製品!</q>',2000000000000000,[1,9],function(){Game.SetResearch('儀式の延べ棒');});Game.last.pool='tech';
		new Game.Upgrade('儀式の延べ棒','グランマが <b>2倍</b> 効率的になる。<q>数年にわたる「科学」研究の成果!</q>',4000000000000000,[2,9],function(){Game.SetResearch('地獄のオーブン');});Game.last.pool='tech';
		new Game.Upgrade('地獄のオーブン','クッキーの生産量が <b>+3%</b> される。<q>「科学」の力ですよ、勿論!</q>',8000000000000000,[3,9],function(){Game.SetResearch('統合思念');});Game.last.pool='tech';
		new Game.Upgrade('統合思念','それぞれのグランマの <b>基礎CpSがグランマ1人につき+0.0<span></span>2</b> される。<div class="warning">おや!?グランマの様子が……?進化させるのはやめておけ。</div><q>我らは多くにして、一つなるもの。</q>',16000000000000000,[4,9],function(){Game.elderWrath=1;Game.SetResearch('エキゾチックナッツ');Game.storeToRefresh=1;});Game.last.pool='tech';
		//Game.last.clickFunction=function(){return confirm('Warning : purchasing this will have unexpected, and potentially undesirable results!\nここから先は下り坂しかない。警告はしたぞ!\nそれでも購入するか?');};
		Game.RequiresConfirmation(Game.last,'<div class="block"><b>警告 :</b> この装置は予想外かつ、恐らくは好ましくない結果をもたらすだろう!<br><small>ここから先は下り坂しかない。警告はしたぞ!</small><br><br>それでも購入するか?</small></div>');
		new Game.Upgrade('エキゾチックナッツ','クッキーの生産量が <b>+4%</b> される。<q>病み付きになるよ!</q>',32000000000000000,[5,9],function(){Game.SetResearch('集団洗脳');});Game.last.pool='tech';
		new Game.Upgrade('集団洗脳','それぞれのグランマの <b>基礎CpSがグランマ1人につきさらに+0.0<span></span>2</b> される。<div class="warning">これ以上科学研究を続ければ予測不能な結果にたどり着くかもしれない。警告はしたぞ。</div><q>我らは融合する。我らは統合する。我らは発達する。</q>',64000000000000000,[6,9],function(){Game.elderWrath=2;Game.SetResearch('難解なシュガー');Game.storeToRefresh=1;});Game.last.pool='tech';
		new Game.Upgrade('難解なシュガー','クッキーの生産量が <b>+5%</b> される。<q>風味は虫のようで、腱のようで、泥土のようでもある。</q>',128000000000000000,[7,9],function(){Game.SetResearch('約束');});Game.last.pool='tech';
		new Game.Upgrade('約束','それぞれのグランマの <b>基礎CpSがポータル1つにつき+0.0<span></span>5</b> される。<div class="warning">これは悪い着想だ。</div><q>捻らせよ 這わせよ 滑らせよ 悶えさせよ<br>本日 我らは決起する</q>',256000000000000000,[8,9],function(){Game.elderWrath=3;Game.storeToRefresh=1;});Game.last.pool='tech';
		new Game.Upgrade('誓約','付け焼刃ではあるがしばらくの間、おばあちゃんたちの怒りを抑える。<q>これは単純な儀式だ。必要なものはアンチエイジングクリーム、月の光の下で混ぜ合わされたクッキーバター、生け贄の鶏。</q>',1,[9,9],function()
		{
			Game.elderWrath=0;
			Game.pledges++;
			Game.pledgeT=Game.getPledgeDuration();
			Game.Unlock('契約');
			Game.CollectWrinklers();
			Game.storeToRefresh=1;
		});
		Game.getPledgeDuration=function(){return Game.fps*60*(Game.Has('いけにえの延べ棒')?60:30);}
		Game.last.pool='toggle';
		Game.last.displayFuncWhenOwned=function(){return '<div style="text-align:center;">誓約切れまでの残り時間 :<br><b>'+Game.sayTime(Game.pledgeT,-1)+'</b></div>';}
		Game.last.timerDisplay=function(){if (!Game.Upgrades['誓約'].bought) return -1; else return 1-Game.pledgeT/Game.getPledgeDuration();}
		Game.last.priceFunc=function(){return Math.pow(8,Math.min(Game.pledges+2,14));}
		
		Game.last.descFunc=function(){
			return '<div style="text-align:center;">'+(Game.pledges==0?'まだおばあちゃんたちに誓約していません。':('<b>'+(Game.pledges==1?'1回':Game.pledges==2?'2回':(Game.pledges+'回'))+'</b> おばあちゃんたちに誓約しました。'))+'<div class="line"></div></div>'+this.desc;
		};
		
		
		order=150;
		new Game.Upgrade('プラスチックマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>ちょっときしむな。</q>',50000,[11,0]);Game.MakeTiered(Game.last,1,11);
		new Game.Upgrade('鉄のマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>1349のようにクリックだ!</q>',5000000,[11,1]);Game.MakeTiered(Game.last,2,11);
		new Game.Upgrade('チタンのマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>重いけどパワフル。</q>',500000000,[11,2]);Game.MakeTiered(Game.last,3,11);
		new Game.Upgrade('アダマンチウムのマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>これでダイヤモンドも切れるよ。</q>',50000000000,[11,13]);Game.MakeTiered(Game.last,4,11);
		
		order=40000;
		new Game.Upgrade('超科学','研究に <b>5秒</b> しかかからなくなるようになる。<q>ヒャッハー、科学だー!</q>',7,[9,2]);//debug purposes only
		Game.last.pool='debug';
		
		order=10020;
		Game.NewUpgradeCookie({name:'エクリプスクッキー',desc:'そのクッキーの方を見るんだ。',icon:[0,4],power:					2,	price:	99999999999*5});
		Game.NewUpgradeCookie({name:'ゼブラクッキー',desc:'…',icon:[1,4],power:									2,	price:	999999999999});
		
		order=100;
		new Game.Upgrade('垓手観音','千手観音から得られる量を <b>20</b>倍 する。<q>お前は, ただクリックしてクリックしてクリックしてクリックしてクリックするだけだ。本当に簡単だろう?</q>',10000000000000,[0,18]);Game.MakeTiered(Game.last,9,0);
		
		order=40000;
		new Game.Upgrade('埋蔵金','ゴールデンクッキーが<b>非常に頻繁に</b>出現するようになる。<q>まったく多すぎる。</q>',7,[10,14]);//debug purposes only
		Game.last.pool='debug';
		
		order=15000;
		new Game.Upgrade('契約','CpSの5%を対価に、おばあちゃんたちの怒りに終止符を打つ。<q>これは複雑な儀式だ。必要なものは愚かしく取るに足らなくてありふれたものばかりだ、例えば呪われた下剤、100年物のカカオ、嬰児1人。質問は認めない。</q>',66666666666666,[8,9],function()
		{
			Game.pledgeT=0;
			Game.Lock('契約破棄');
			Game.Unlock('契約破棄');
			Game.Lock('誓約');
			Game.Win('平静');
			Game.CollectWrinklers();
			Game.storeToRefresh=1;
		});
		Game.last.pool='toggle';

		new Game.Upgrade('契約破棄','CpSの5%を取り戻す代わりに、グランマポカリプスが再発する。<q>我らは<br>再び<br>立ち上がる。</q>',6666666666,[8,9],function()
		{
			Game.Lock('契約');
			Game.Unlock('契約');
		});
		Game.last.pool='toggle';
		
		order=5000;
		new Game.Upgrade('うまくいったぜ','ゴールデンクッキーの効果が <b>2倍長く</b> 続くようになる。<q>徹夜したんじゃないの?</q>',77777777777777,[27,6]);
		
		order=15000;
		new Game.Upgrade('いけにえの延べ棒','誓約が <b>2倍</b> 長く続く。<q>主にアンチエイジングクリームを塗布するために。<br>(ついでに鶏の苦しみを短くするために)</q>',2888888888888,[2,9]);
		
		order=10020;
		Game.NewUpgradeCookie({name:'スニッカードゥードル',desc:'名称に忠実。',icon:[2,4],power:												2,	price:	999999999999*5});
		Game.NewUpgradeCookie({name:'ストロープワッフル',desc:'オランダ製じゃなけりゃ、こんなに多くはなかったろう。',icon:[3,4],power:									2,	price:	9999999999999});
		Game.NewUpgradeCookie({name:'マカルーン',desc:'「マカロン」とごちゃ混ぜにならないように。<br>これはココナッツ入りだ、いいね?',icon:[4,4],power:			2,	price:	9999999999999*5});
		
		order=40000;
		new Game.Upgrade('脳神経占術','アップグレードのオンオフが統計から切り替えることができるようになる。<q>どうしても見えてしまうものを見えなくするのにも使えるだろう。</q>',7,[4,9]);//debug purposes only
		Game.last.pool='debug';
		
		order=10020;
		Game.NewUpgradeCookie({name:'エンパイアビスケット',desc:'まさに貴殿のクッキー皇国発展の御為!',icon:[5,4],power:											2,	price:	99999999999999});
		order=10031;
		Game.NewUpgradeCookie({name:'英国式紅茶のお供のビスケット',desc:'かなり。',icon:[6,4],require:'英国式紅茶のお供に～ビスケットの缶入りセット～',power:									2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'英国式紅茶のお供のチョコレートビスケット',desc:'うん、かなり。',icon:[7,4],require:Game.last.name,power:									2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'英国式紅茶のお供の丸いビスケット',desc:'うん、かなりおいしいよ。',icon:[8,4],require:Game.last.name,power:								2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'英国式紅茶のお供の丸いチョコレートビスケット',desc:'うん、実においしい。',icon:[9,4],require:Game.last.name,power:				2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'英国式紅茶のお供のハートモチーフ付き丸いビスケット',desc:'うん、これは実においしいね、君。',icon:[10,4],require:Game.last.name,power:	2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'英国式紅茶のお供のハートモチーフ付き丸いチョコレートビスケット',desc:'クッキー大好き。',icon:[11,4],require:Game.last.name,power:		2,	price:	99999999999999});
		
		order=1000;
		new Game.TieredUpgrade('シュガー粒子','反物質凝縮器が <b>2倍</b> 効率的になる。<q>甘くて硬い粒子</q>','反物質凝縮器',1);
		new Game.TieredUpgrade('弦理論','反物質凝縮器が <b>2倍</b> 効率的になる。<q>クッキーを焼くことの真の目的に関する新しい見解が明らかになる(ついでに宇宙の構造も)</q>','反物質凝縮器',2);
		new Game.TieredUpgrade('大型マカロン衝突型加速器','反物質凝縮器が <b>2倍</b> 効率的になる。<q>何て風変わりな!</q>','反物質凝縮器',3);
		new Game.TieredUpgrade('ビッグバンベイク','反物質凝縮器が <b>2倍</b> 効率的になる。<q>そうしてここから全てが始まったのです!</q>','反物質凝縮器',4);

		order=255;
		Game.GrandmaSynergy('反グランマ物質','より多くクッキーを吐き出す卑しい反グランマ物質。','反物質凝縮器');

		order=10020;
		Game.NewUpgradeCookie({name:'マドレーヌ',desc:'忘れられない!',icon:[12,3],power:																2,	price:	99999999999999*5});
		Game.NewUpgradeCookie({name:'パルミエ',desc:'君よりオイシイ!',icon:[13,3],power:																2,	price:	99999999999999*5});
		Game.NewUpgradeCookie({name:'パレット',desc:'これでホッケーが出来るかも。<br>試してみてもいいんだよ。',icon:[12,4],power:	2,	price:	999999999999999});
		Game.NewUpgradeCookie({name:'サブレ',desc:'「原料が砂だということをサブレという名前は示唆している」君はこんな与太話を本気にしないよね?',icon:[13,4],power:	2,	price:	999999999999999});
		
		order=20000;
		new Game.Upgrade('監督者猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>私の目的はあなたに仕えることであります、ご主人様</q>',90000000000000000,Game.GetIcon('Kitten',4));Game.last.kitten=1;Game.MakeTiered(Game.last,4,18);
		
		
		order=100;
		new Game.Upgrade('秭手観音','千手観音から得られる量を <b>20</b>倍 する。<q>時々<br>ただ<br>クリックするもの</q>',10000000000000000,[0,19]);Game.MakeTiered(Game.last,10,0);
		
		order=200;new Game.TieredUpgrade('2倍分厚いメガネ','グランマが <b>2倍</b> 効率的になる。<q>ああ……じゃあ私が焼いてきたのはまさにコレだったのね。</q>','グランマ',5);
		order=300;new Game.TieredUpgrade('ショウガクッキーカカシ','農場が <b>2倍</b> 効率的になる。<q>いたずらっぽい笑顔で農場を見つめるカカシ。</q>','農場',5);
		order=500;new Game.TieredUpgrade('再教育制度','工場が <b>2倍</b> 効率的になる。<q>クッキー再教育の成果だ。</q>','工場',5);
		order=400;new Game.TieredUpgrade('水爆採掘','鉱山が <b>2倍</b> 効率的になる。<q>効率的かは疑わしいが、それでもやはり目を見張るものがある。</q>','鉱山',5);
		order=600;new Game.TieredUpgrade('チョコレートモノリス','宇宙船が <b>2倍</b> 効率的になる。<q>何ということだ。板チョコでいっぱいだ。</q>','宇宙船',5);
		order=700;new Game.TieredUpgrade('生地の水','錬金術室が <b>2倍</b> 効率的になる。<q>添加の際は注意 - 添加しすぎるとマフィンになる。そして、誰もマフィンは好まない。</q>','錬金術室',5);
		order=800;new Game.TieredUpgrade('ブレーン移植','ポータルが <b>2倍</b> 効率的になる。<q>これは、更なる高次元世界への到達、あるいは私たち自身の「ブレーン」の変化を促すためである(高価なクッキー生地収穫のためでもある)。</q>','ポータル',5);
		order=900;new Game.TieredUpgrade('昨日と明日の投影機','タイムマシンが <b>2倍</b> 効率的になる。<q>数週間が数千年に。</q>','タイムマシン',5);
		order=1000;new Game.TieredUpgrade('リバースサイクロトロン','反物質凝縮器が <b>2倍</b> 効率的になる。<q>これで粒子と反スピン原子に分離できる。ええと…その…味は良いらしいよ。</q>','反物質凝縮器',5);
		
		order=150;
		new Game.Upgrade('アンオブテニウムのマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>これだけ良いマウスがあれば十分だ。</q>',5000000000000,[11,14]);Game.MakeTiered(Game.last,5,11);
		
		order=10030;
		Game.NewUpgradeCookie({name:'キャラモア',desc:'言葉の響きがいい。',icon:[14,4],require:'ブランドビスケットの箱入りセット',power:					3,	price:	9999999999999999});
		Game.NewUpgradeCookie({name:'サガロング',desc:'グランマのお気に入り?',icon:[15,3],require:'ブランドビスケットの箱入りセット',power:									3,	price:	9999999999999999});
		Game.NewUpgradeCookie({name:'ショートフォイル',desc:'畜生、また失敗か!',icon:[15,4],require:'ブランドビスケットの箱入りセット',power:										3,	price:	9999999999999999});
		Game.NewUpgradeCookie({name:'ウィンミント',desc:'これまで味わった中でも一番幸運なクッキー!',icon:[14,3],require:'ブランドビスケットの箱入りセット',power:	3,	price:	9999999999999999});
		
		order=40000;
		new Game.Upgrade('有給休暇','ゲームを閉じている間もクッキーを作り続けることができる。<q>今までの人生で一番美しい存在だ。</q>',7,[10,0]);//debug purposes only
		Game.last.pool='debug';
		
		order=10030;
		Game.NewUpgradeCookie({name:'フィググラトン',desc:'全てを解明した。',icon:[17,4],require:'ブランドビスケットの箱入りセット',power:													2,	price:	999999999999999*5});
		Game.NewUpgradeCookie({name:'ロレオル',desc:'だから、えっと、無駄じゃないよ?',icon:[16,3],require:'ブランドビスケットの箱入りセット',power:												2,	price:	999999999999999*5});
		Game.NewUpgradeCookie({name:'ジャファケーキ',desc:'真に一からクッキーを焼こうとするなら、まずは工場から造らなきゃ。',icon:[17,3],require:'ブランドビスケットの箱入りセット',power:	2,	price:	999999999999999*5});
		Game.NewUpgradeCookie({name:'グリースカップ',desc:'超潤滑ピーナッツバター。',icon:[16,4],require:'ブランドビスケットの箱入りセット',power:												2,	price:	999999999999999*5});
		
		order=30000;
		new Game.Upgrade('ヘブンリーチップスの極意','名声レベルの潜在能力のうち <b>5%</b> を引き出す。<q>ヘブンリーチップスについての知識、そしてより効率的に焼くための方法を授けよう。決して他人に教えるな。</q>',11,[19,7]);Game.last.noPerm=1;
		new Game.Upgrade('天国のクッキースタンド','名声レベルの潜在能力のうち <b>25%</b> を引き出す。<q>死後の人生が酸っぱいレモンを与えるなら…後で天国のレモネードスタンドに行っておいで。</q>',1111,[18,7]);Game.last.noPerm=1;
		new Game.Upgrade('天国のベーカリー','名声レベルの潜在能力のうち <b>50%</b> を引き出す。<q>神のケーキや神のペストリーも売ってるよ。</q>',111111,[17,7]);Game.last.noPerm=1;
		new Game.Upgrade('天国の製菓ファクトリー','名声レベルの潜在能力のうち <b>75%</b> を引き出す。<q>そこでは天使のクッキー職人が働くという。彼らは天使の昼休みを取り、時には天使のストライキを起こす。</q>',11111111,[16,7]);Game.last.noPerm=1;
		new Game.Upgrade('天国の鍵','名声レベルの潜在能力のうち <b>100%</b> を引き出す。<q>これはペストリー天国に通じる、真珠のように美しく(そして美味しい)ゲートの鍵、あなたのヘブンリーチップの全備蓄へのアクセスを許可します。<br>どうぞ賢くお使いください。</q>',1111111111,[15,7]);Game.last.noPerm=1;
		
		order=10100;
		Game.NewUpgradeCookie({name:'骨クッキー',desc:'この気味悪いものを食べてみたいって？まさに今、君の頭の中に一個入っているじゃん。',locked:1,icon:[12,8],power:	2, price: 444444444444});
		Game.NewUpgradeCookie({name:'幽霊クッキー',desc:'不思議な存在だけれど見た目はとてもかわいい!',locked:1,icon:[13,8],power:								2, price: 444444444444});
		Game.NewUpgradeCookie({name:'こうもりクッキー',desc:'この街にピッタリなクッキー。',locked:1,icon:[14,8],power:														2, price: 444444444444});
		Game.NewUpgradeCookie({name:'スライムクッキー',desc:'あり得ないほど蕩けそうなクッキーだ!',locked:1,icon:[15,8],power: 														2, price: 444444444444});
		Game.NewUpgradeCookie({name:'かぼちゃクッキー',desc:'全然カボチャ風味じゃない。グレーズの味だ。ちぇっ。',locked:1,icon:[16,8],power:								2, price: 444444444444});
		Game.NewUpgradeCookie({name:'眼球クッキー',desc:'お前がクッキーを覗きこむとき、クッキーもまたお前を覗いているのだ。',locked:1,icon:[17,8],power:						2, price: 444444444444});
		Game.NewUpgradeCookie({name:'蜘蛛クッキー',desc:'蜘蛛の巣にレシピを発見。奴らクッキーと同じ事が出来ちまうのさ。',locked:1,icon:[18,8],power:						2, price: 444444444444});
		
		Game.halloweenDrops=['骨クッキー','幽霊クッキー','こうもりクッキー','スライムクッキー','かぼちゃクッキー','眼球クッキー','蜘蛛クッキー'];
		
		Game.GetHowManyHalloweenDrops=function()
		{
			var num=0;
			for (var i in Game.halloweenDrops) {if (Game.Has(Game.halloweenDrops[i])) num++;}
			return num;
		}
		/*for (var i in Game.halloweenDrops)
		{
			Game.Upgrades[Game.halloweenDrops[i]].descFunc=function(){return '<div style="text-align:center;">You currently own <b>'+Game.GetHowManyHalloweenDrops()+'/'+Game.halloweenDrops.length+'</b> halloween cookies.</div><div class="line"></div>'+this.desc;};
		}*/
		
		order=0;
		new Game.Upgrade('消せない記憶','次の研究が <b>10倍</b> 早くなる。<q>全部しっかり覚えているぞ!よし再現しよう!</q>',500,[9,2]);Game.last.pool='prestige';
		
		order=40000;
		new Game.Upgrade('害虫ホイホイ','虫が一層出現しやすくなる。<q>おまえら、チョロいな。</q>',7,[19,8]);//debug purposes only
		Game.last.pool='debug';
		
		order=10200;
		Game.NewUpgradeCookie({name:'クリスマスツリービスケット',desc:'ところで、このモミの木は誰のだ？',locked:1,icon:[12,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'雪の結晶ビスケット',desc:'あらゆる点で類い稀な大量生産品。',locked:1,icon:[13,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'雪だるまビスケット',desc:'「覆われている」、二重の意味で。',locked:1,icon:[14,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'ヒイラギビスケット',desc:'これの下でキスはしないで。それは多分ヤドリギの方だよ(植物学的には、ヤドリギというのは赤ちゃんの足型で描かれるやつとは少しだけ異なる“臭”族だ)。',locked:1,icon:[15,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'キャンディケインビスケット',desc:'1本で2つの味が楽しめる!<br>(さらなる調査によって、この糖衣は実際にはミント風味ではなく、ありふれた、ただ甘いだけの代物であることが判明した。)',locked:1,icon:[16,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'鐘ビスケット',desc:'鐘とクリスマスはセットでなければいけないのか?構うことはない、鳴らしちゃえ!',locked:1,icon:[17,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'プレゼント箱ビスケット',desc:'未来のビスケットの前段階だ。注意して!',locked:1,icon:[18,10],power:2,price: 252525252525});
		
		order=10020;
		Game.NewUpgradeCookie({name:'ジンジャーブレッドマン',desc:'脚から噛みちぎるのがお好き?腕を引き裂くのはどう?まるで病的なモンスターだね。',icon:[18,4],power:		2,price: 9999999999999999});
		Game.NewUpgradeCookie({name:'ジンジャーブレッドツリー',desc:'クッキー抜き型で作った常緑樹。この発想にはクリスマスもびっくりだ。',icon:[18,3],power:							2,price: 9999999999999999});
		
		order=25000;
		new Game.Upgrade('とある祭りの帽子','<b>何かが…解放される。</b><q>クリーチャーが活性化したわけではない、マウスですらない。</q>',25,[19,9],function()
		{
			var drop=choose(Game.santaDrops);
			Game.Unlock(drop);
			if (Game.prefs.popups) Game.Popup('クリスマスの帽子の中に…<br>クリスマスの試験管<br>と'+drop+'を見つけました。');
			else Game.Notify('クリスマスの帽子の中に…','クリスマスの試験管<br>と<b>'+drop+'</b>を見つけました。',Game.Upgrades[drop].icon);
		});
		
		new Game.Upgrade('陽気さ増量','クッキー生産量が <b>+15%</b> される。<br>価格はサンタのレベルに比例する。<q>陽気さ増量のカギは、不思議なことに、良いキャンプファイヤーといくつかのスモアであることが偶然にも分かった。つまり「スモアが多いほど楽しくなれる」というわけだ。</q>',2525,[17,9]);
		new Game.Upgrade('うきうき気分増進','クッキー生産量が <b>+15%</b> される。<br>価格はサンタのレベルに比例する。<q>すてきな太鼓腹の持ち主が旅路を行く。気分は上々かい?</q>',2525,[17,9]);
		new Game.Upgrade('石炭の塊','クッキー生産量が <b>+1%</b> される。<br>価格はサンタのレベルに比例する。<q>長靴下の詰め物の中でも世界最悪の部類だな。君も、君自身のささやかな「産業革命」を始めたほうがいいと思うよ、さもなくば…</q>',2525,[13,9]);
		new Game.Upgrade('むず痒いセーター','クッキー生産量が <b>+1%</b> される。<br>価格はサンタのレベルに比例する。<q>どちらがより酷いか判断できまい :「恥ずかしくなるほどヘンテコな『トナカイに乗ったエルフ』モチーフ」と「身につけると死んだサスクワッチに包まれたような気分にさせられるという事実」</q>',2525,[14,9]);
		new Game.Upgrade('地を焼くトナカイ','トナカイが <b>2倍頻繁に</b> 出現する。<br>価格はサンタのレベルに比例する。<q>オスのトナカイは火星からやって来る。メスは鹿肉から。</q>',2525,[12,9]);
		new Game.Upgrade('重いソリ','トナカイの移動が <b>2倍遅く</b> なる。<br>価格はサンタのレベルに比例する。<q>重量に見合った価値があると信じろ<br>(ホントは苦役を強いられてゴニョゴニョ)</q>',2525,[12,9]);
		new Game.Upgrade('笑い声風味の砂糖衣','トナカイがくれるクッキーの量が <b>2倍多く</b> なる。<br>価格はサンタのレベルに比例する。<q>鹿角の価値を上げる時機だ。</q>',2525,[12,9]);
		new Game.Upgrade('セール期間','全ての施設が <b>1%安く</b> なる。<br>価格はサンタのレベルに比例する。<q>サンタのあごひげに免じてまけてくれ!だが誰が私たちを救うのか?</q>',2525,[16,9],function(){Game.storeToRefresh=1;});
		new Game.Upgrade('玩具工房','全てのアップグレードが <b>5%安く</b> なる。<br>価格はサンタのレベルに比例する。<q>周りの立ち聞き野郎に気をつけろ、やつらは企業秘密を盗むかもしれない。<br>もっと悪いことをしでかすかも!</q>',2525,[16,9],function(){Game.upgradesToRebuild=1;});
		new Game.Upgrade('いたずらリスト','グランマが <b>2倍</b> 生産するようになる。<br>価格はサンタのレベルに比例する。<q>グランマという人種が脈々と受け継いできたあらゆる罰当たりな行いが、このリストには載っている。これを二度チェックするのは止しなさい。一度、一度で十分です。</q>',2525,[15,9]);
		new Game.Upgrade('サンタの四次元かばん','ランダムドロップが <b>10%出やすく</b> なる。<br>価格はサンタのレベルに比例する。<q>底はある、君には点検できないけれどね。</q>',2525,[19,9]);
		new Game.Upgrade('サンタのお手伝い','クリックによる生産量が <b>10%多く</b> なる。<br>価格はサンタのレベルに比例する。<q>ハンバーガーの手助けを選ぶ人もいればあなたの手伝いを選ぶ人もいる。好みは人それぞれだしね。</q>',2525,[19,9]);
		new Game.Upgrade('サンタの遺物','クッキー生産量が <b>サンタのレベルにつき+3%</b> される。<br>価格はサンタのレベルに比例する。<q>北極で、まずエルフを手に入れなければならない。エルフを手に入れたらおもちゃを作り始める。おもちゃを手に入れたら…その時クッキーを得られる。</q>',2525,[19,9]);
		new Game.Upgrade('サンタの牛乳とクッキー','ミルクによる効果が <b>5%より強力に</b> なる。<br>価格はサンタのレベルに比例する。<q>サンタのひどくバランスを欠いた食習慣の一部。</q>',2525,[19,9]);
		
		order=40000;
		new Game.Upgrade('トナカイの季節','トナカイが一層出現しやすくなる。<q>チーター!ハッカー!フェイカー!出発だ!</q>',7,[12,9]);//debug purposes only
		Game.last.pool='debug';
		
		order=25000;
		new Game.Upgrade('サンタの支配','クッキー生産量が <b>+20%</b> される。<br>すべての施設が <b>1%安く</b> なる。<br>すべてのアップグレードが <b>2%安く</b> なる。<q>我が名はクロース、王の中の王。全能の神よ我が玩具を見よ、そして絶望せよ!</q>',2525252525252525,[19,10],function(){Game.storeToRefresh=1;});
		
		order=10300;
		var heartPower=function(){
			var pow=2;
			if (Game.Has('スターラブ')) pow=3;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('seasons');
				if (godLvl==1) pow*=1.3;
				else if (godLvl==2) pow*=1.2;
				else if (godLvl==3) pow*=1.1;
			}
			return pow;
		};
		Game.NewUpgradeCookie({name:'ピュアなハートのビスケット',desc:'蕩けるホワイトチョコは<br>「とってもとってもとってもとっても大スキよ」という伝言だ。',season:'valentines',icon:[19,3],													power:heartPower,price: 1000000});
		Game.NewUpgradeCookie({name:'燃えるハートのビスケット',desc:'あなたの恋のターゲットがこちらを気にするようにそっと促す、赤熱のチェリービスケット。',require:Game.last.name,season:'valentines',icon:[20,3],			power:heartPower,price: 1000000000});
		Game.NewUpgradeCookie({name:'すっぱいハートのビスケット',desc:'苦いライム風味のビスケットは失恋して淋しい人のために。',require:Game.last.name,season:'valentines',icon:[20,4],													power:heartPower,price: 1000000000000});
		Game.NewUpgradeCookie({name:'涙のハートのビスケット',desc:'氷点のブルーベリービスケット、継ぎ目だらけの心の象徴。',require:Game.last.name,season:'valentines',icon:[21,3],												power:heartPower,price: 1000000000000000});
		Game.NewUpgradeCookie({name:'黄金のハートのビスケット',desc:'おもいやり、誠の愛、正直さを暗示する美しいビスケット。',require:Game.last.name,season:'valentines',icon:[21,4],										power:heartPower,price: 1000000000000000000});
		Game.NewUpgradeCookie({name:'永久のハートのビスケット',desc:'白銀のアイシングは、あなたがずっと好きだった特別な誰かのために。',require:Game.last.name,season:'valentines',icon:[19,4],							power:heartPower,price: 1000000000000000000000});
		
		Game.heartDrops=['ピュアなハートのビスケット','燃えるハートのビスケット','すっぱいハートのビスケット','涙のハートのビスケット','黄金のハートのビスケット','永久のハートのビスケット','プリズムのハートのビスケット'];
		
		Game.GetHowManyHeartDrops=function()
		{
			var num=0;
			for (var i in Game.heartDrops) {if (Game.Has(Game.heartDrops[i])) num++;}
			return num;
		}
		/*for (var i in Game.heartDrops)
		{
			Game.Upgrades[Game.heartDrops[i]].descFunc=function(){return '<div style="text-align:center;">You currently own <b>'+Game.GetHowManyHeartDrops()+'/'+Game.heartDrops.length+'</b> heart biscuits.</div><div class="line"></div>'+this.desc;};
		}*/
		
		order=1100;
		new Game.TieredUpgrade('宝石研磨','プリズムが <b>2倍</b> 効率的になる。<q>すす汚れを取り除き、もっと光を通せるようにしよう。本当に本当にヤバい。</q>','プリズム',1);
		new Game.TieredUpgrade('第9の色','プリズムが <b>2倍</b> 効率的になる。<q>今までシャコすら見向きもしなかった、光学的に未知の深みを模索せよ!</q>','プリズム',2);
		new Game.TieredUpgrade('チョコレート光','プリズムが <b>2倍</b> 効率的になる。<q>そのココア蛍光で肌を焼こう(警告：色んな面白い肌ができあがるかも、ただし死ぬほどひどい)</q>','プリズム',3);
		new Game.TieredUpgrade('「グレイン」ボー','プリズムが <b>2倍</b> 効率的になる。<q>Roy G. Bivの暗記法を用いて異なる複数の穀物名を覚えなさい : Rはrice(コメ)、Oはoats(カラスムギ)、うーん、Bはbarley(大麦)…かな？</q>','プリズム',4);
		new Game.TieredUpgrade('超純粋宇宙光','プリズムが <b>2倍</b> 効率的になる。<q>あなたのプリズムは、未使用で無垢なフォトンを宇宙のもう一方の端から受け取れるようになった。</q>','プリズム',5);

		order=255;
		Game.GrandmaSynergy('虹グランマ','クッキーに変換する為の光を放つ発光体グランマ。','プリズム');
		
		order=24000;
		Game.seasonTriggerBasePrice=1000000000;//1111111111;
		new Game.Upgrade('季節切り替え装置','相応の価格で意のままに<b>季節の切り替え</b>ができるようになる。 <q>期間「非」限定</q>',1111,[16,6],function(){for (var i in Game.seasons){Game.Unlock(Game.seasons[i].trigger);}});Game.last.pool='prestige';Game.last.parents=['紋章官'];
		new Game.Upgrade('お祭りビスケット','24時間の間、季節を<b>クリスマス</b>に切り替える。<br>他の季節に切り替えると、この効果はキャンセルされる。<br>価格はバフ無しのCpSで変動し、季節を切り替えるごとに増加する。<q>クリスマス前夜のような気分だったでしょう?</q>',Game.seasonTriggerBasePrice,[12,10]);Game.last.season='christmas';Game.last.pool='toggle';
		new Game.Upgrade('お化けなビスケット','24時間の間、季節を<b>ハロウィン</b>に切り替える。<br>他の季節に切り替えると、この効果はキャンセルされる。<br>価格はバフ無しのCpSで変動し、季節を切り替えるごとに増加する。<q>おどろおどろしいガイコツのブーイングで目が覚める。</q>',Game.seasonTriggerBasePrice,[13,8]);Game.last.season='halloween';Game.last.pool='toggle';
		new Game.Upgrade('恋煩いのビスケット','24時間の間、季節を<b>バレンタインデー</b>に切り替える。<br>他の季節に切り替えると、この効果はキャンセルされる。<br>価格はバフ無しのCpSで変動し、季節を切り替えるごとに増加する。<q>ロマンスは決して廃れない。</q>',Game.seasonTriggerBasePrice,[20,3]);Game.last.season='valentines';Game.last.pool='toggle';
		new Game.Upgrade('うそつきビスケット','24時間の間、季節を<b>ビジネスデー</b>に切り替える。<br>他の季節に切り替えると、この効果はキャンセルされる。<br>価格はバフ無しのCpSで変動し、季節を切り替えるごとに増加する。<q>仕事。真剣な営利活動。紛うことなき業務だ。</q>',Game.seasonTriggerBasePrice,[17,6]);Game.last.season='fools';Game.last.pool='toggle';
		
		
		order=40000;
		new Game.Upgrade('永遠の季節','現在の季節が永遠に続く。<q>味覚の季節。</q>',7,[16,6],function(){for (var i in Game.seasons){Game.Unlock(Game.seasons[i].trigger);}});//debug purposes only
		Game.last.pool='debug';
		
		
		order=20000;
		new Game.Upgrade('管理者猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>何もご心配要りません、ご主人様</q>',900000000000000000000,Game.GetIcon('Kitten',5));Game.last.kitten=1;Game.MakeTiered(Game.last,5,18);
		
		order=100;
		new Game.Upgrade('穣手観音','千手観音から得られる量を <b>20</b>倍 する。<q>[ここにフレーバーテキストを挿入]</q>',10000000000000000000,[12,20]);Game.MakeTiered(Game.last,11,0);
		new Game.Upgrade('溝手観音','千手観音から得られる量を <b>20</b>倍 する。<q>指は添えるだけ。</q>',10000000000000000000000,[12,19]);Game.MakeTiered(Game.last,12,0);
		
		order=150;new Game.Upgrade('エルディウムのマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>もし私がきみなら、それをネズミみたいにカリカリする。</q>',500000000000000,[11,15]);Game.MakeTiered(Game.last,6,11);
		new Game.Upgrade('望まれし合金のマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>クリックは立派で男前なことだ。しかしマウスに穴を開けるようなことはするな。ゲームをしなさい。</q>',50000000000000000,[11,16]);Game.MakeTiered(Game.last,7,11);
		order=200;new Game.TieredUpgrade('老化材','グランマが <b>2倍</b> 効率的になる。<q>直観に反するが、グランマは老化でさらに強力になる薄気味悪い能力を持っている。</q>','グランマ',6);
		order=300;new Game.TieredUpgrade('パルススプリンクラー','農場が <b>2倍</b> 効率的になる。<q>水のやり過ぎなどない、びしょびしょこそ最高だ。</q>','農場',6);
		order=500;new Game.TieredUpgrade('深焼き製法','工場が <b>2倍</b> 効率的になる。<q>今までと同じ量の原料で倍のクッキーを製造する特許製法。方法は聞かないでください。写真を撮らないでください。あと防護服を着用していただけますか。</q>','工場',6);
		order=400;new Game.TieredUpgrade('中心炉','鉱山が <b>2倍</b> 効率的になる。<q>とうとう地球の核までトンネル掘っちゃったよ。この辺は酷い暑さだね。</q>','鉱山',6);
		order=600;new Game.TieredUpgrade('世代宇宙船','宇宙船が <b>2倍</b> 効率的になる。<q>クッキー文明継承のため、超巨大宇宙船はあなたのクッキーを宇宙の深淵に届けるだろう。いつか必ず。</q>','宇宙船',6);
		order=700;new Game.TieredUpgrade('根源のるつぼ','錬金術室が <b>2倍</b> 効率的になる。<q>最も大きい山の中の、最も深い部分にある、土の中で最も希少な成分で造られた、この伝説のるつぼは、ビッグバンそのものの性質を保ち続けていると言われている。</q>','錬金術室',6);
		order=800;new Game.TieredUpgrade('神サイズのポータル','ポータルが <b>2倍</b> 効率的になる。<q>これは言ってみれば、(クトゥルフ神話の)旧神が今まさにくぐり抜けられそうなほどに大きい。理論上は。</q>','ポータル',6);
		order=900;new Game.TieredUpgrade('遠未来条例','タイムマシンが <b>2倍</b> 効率的になる。<q>遠未来条約によって、より遠い未来まで探求することが許可された。- 文明が滅んだ後、もう一度クッキーが焼けるようになるまで。</q>','タイムマシン',6);
		order=1000;new Game.TieredUpgrade('ナノ宇宙学','反物質凝縮器が <b>2倍</b> 効率的になる。<q>素粒子は見かけによらないが各々が固有の宇宙を裡に持ち、計り知れない熱量を保存している、そうナノ宇宙学理論では仮定している。<br>物理学によって、この理論は何とかフラクタル宇宙論の上に組み立てられている。</q>','反物質凝縮器',6);
		order=1100;
		new Game.TieredUpgrade('燐光','プリズムが <b>2倍</b> 効率的になる。<q>あなたのプリズムは光の入力がなくても発光するようになった。つまり実質的に 2 倍の出力を得られる!</q>','プリズム',6);
		
		order=10032;
		Game.NewUpgradeCookie({name:'ローズマカロン',desc:'風変わりなフレーバーだが、最近は人気の味に成った。',icon:[22,3],require:'マカロンの箱入りセット',		power:3,price: 9999});
		Game.NewUpgradeCookie({name:'レモンマカロン',desc:'ほのかな酸味が効いてて最高のごちそうだ。',icon:[23,3],require:'マカロンの箱入りセット',										power:3,price: 9999999});
		Game.NewUpgradeCookie({name:'チョコレートマカロン',desc:'甘くて小さなバーガーみたい。',icon:[24,3],require:'マカロンの箱入りセット',									power:3,price: 9999999999});
		Game.NewUpgradeCookie({name:'ピスタチオマカロン',desc:'多数の苦情を受け、ピスタチオの殻は取り除かれた。',icon:[22,4],require:'マカロンの箱入りセット',										power:3,price: 9999999999999});
		Game.NewUpgradeCookie({name:'ヘーゼルナッツマカロン',desc:'特にコーヒーと良く合う。',icon:[23,4],require:'マカロンの箱入りセット',									power:3,price: 9999999999999999});
		Game.NewUpgradeCookie({name:'すみれマカロン',desc:'まるで口の中に香水を吹きかけたよう!',icon:[24,4],require:'マカロンの箱入りセット',							power:3,price: 9999999999999999999});
		
		order=40000;
		new Game.Upgrade('魔法のイタズラ','クッキー生産量が <b>1000倍に</b> なる。<q>これはマジックだ、<div style="display:inline-block;background:url(img/money.png);width:16px;height:16px;position:relative;top:4px;left:0px;margin:0px -2px;"></div>タネを明かすつもりは無いよ。</q>',7,[17,5]);//debug purposes only
		Game.last.pool='debug';
		
		
		order=24000;
		new Game.Upgrade('うさぎのビスケット','24時間の間、季節を<b>イースター</b>に切り替える。<br>他の季節に切り替えると、この効果はキャンセルされる。<br>価格はバフ無しのCpSで変動し、季節を切り替えるごとに増加する。<q>世の中は敵だらけ、捕まれば命はない…奴らが君を捕まえられればの話だが。</q>',Game.seasonTriggerBasePrice,[0,12]);Game.last.season='easter';Game.last.pool='toggle';
		
		var eggPrice=999999999999;
		var eggPrice2=99999999999999;
		new Game.Upgrade('ニワトリの卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>卵だ。まずは鶏卵から。次に進もう。</q>',eggPrice,[1,12]);
		new Game.Upgrade('アヒルの卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>それから彼はアヒル歩きで去って行った。</q>',eggPrice,[2,12]);
		new Game.Upgrade('七面鳥の卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>これらはぶきっちょの手作り風の生物としてふ化する。</q>',eggPrice,[3,12]);
		new Game.Upgrade('うずらの卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>この卵は全くもって小さい。見ろよ。どうしてこうなった?誰がこんなの思いついたんだ?</q>',eggPrice,[4,12]);
		new Game.Upgrade('コマドリの卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>聖なる空色の殻をまとったひな鳥。</q>',eggPrice,[5,12]);
		new Game.Upgrade('ダチョウの卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>世界屈指の巨大卵。どちらかというと ostrouch …みんな、間違ってないよね?</q>',eggPrice,[6,12]);
		new Game.Upgrade('火食い鳥の卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>火食い鳥は君より背が高いし、殺傷力の高い爪を持っているし、君をたやすく置き去りにするほど速い。彼らにとって「用心深く逃げる(ラテン語訳)」対象になるようにうまく行動しなければならない。</q>',eggPrice,[7,12]);
		new Game.Upgrade('イクラ','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>出来ないことなんてないさ 見えないものなんてないさ<br>オウ!オウ! それが戦う力ってものだろ?</q>',eggPrice,[8,12]);
		new Game.Upgrade('カエルの卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>「カエルの卵って見た目が目玉そっくりだからちょっと引くわーヒキガエルだけに」というダジャレを思いついたんだが…忘れてくれ。</q>',eggPrice,[9,12]);
		new Game.Upgrade('サメの卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>待てこれはエサなのか?<br>ちょっと聞いてくれ。<br>サカナは友達、エサじゃない。</q>',eggPrice,[10,12]);
		new Game.Upgrade('ウミガメの卵','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>これウミガメだよね?卵からかえる。甲羅の中で育つ。どうなっているんだ?<br>以下、私の機内食についてのスキットへ。</q>',eggPrice,[11,12]);
		new Game.Upgrade('アリの幼虫','クッキー生産量が <b>+1%</b> される。<br>価格はエッグの所持数に比例する。<q>国によっては珍味である、本当に。君もこれを消化器官に侵入させてみよう、そうすれば大きな満足を得るだろう。そして全ては上手くいくだろう。</q>',eggPrice,[12,12]);
		new Game.Upgrade('金のガチョウの卵','ゴールデンクッキーが <b>5%頻繁に</b> 出現するようになる。<br>価格はエッグの所持数に比例する。<q>見当違いの投資にまつわる悲しい寓話の、唯一の痕跡である。</q>',eggPrice2,[13,12]);
		new Game.Upgrade('ファベルジェの卵','すべての施設とアップグレードが <b>1%安く</b> なる。<br>価格はエッグの所持数に比例する。<q>この呆れるほど豪奢なイースターエッグは文句なしに最高だ。</q>',eggPrice2,[14,12],function(){Game.storeToRefresh=1;});
		new Game.Upgrade('虫の卵','虫が四散するときに吐き出すクッキーが <b>5%多く</b> なる。<br>価格はエッグの所持数に比例する。<q>見ろよこいつを!こいつはいつか大きな男になるぞ!きっと!</q>',eggPrice2,[15,12]);
		new Game.Upgrade('クッキーの卵','クリックによる生産量が <b>10%</b> 増加する。<br>価格はエッグの所持数に比例する。<q>殻は砕かれているように見える。こいつの中身はどうなっているのやら!</q>',eggPrice2,[16,12]);
		new Game.Upgrade('オムレツ','他のエッグが <b>10%出やすく</b> なる。<br>価格はエッグの所持数に比例する。<q>チーズ入りではない。</q>',eggPrice2,[17,12]);
		new Game.Upgrade('チョコレートの卵','<b>たくさんのクッキー</b>が入っている。<br>価格はエッグの所持数に比例する。<q>なかなか見つからないココアドリが産む。中身はびっくり仰天!</q>',eggPrice2,[18,12],function()
		{
			var cookies=Game.cookies*0.05;
			if (Game.prefs.popups) Game.Popup(''+Beautify(cookies)+'クッキーが<br>チョコレートエッグからあふれ出しました!');
			else Game.Notify('チョコレートの卵','<b>'+Beautify(cookies)+'</b>クッキーがチョコレートエッグからあふれ出しました!',Game.Upgrades['チョコレートの卵'].icon);
			Game.Earn(cookies);
		});
		new Game.Upgrade('ピータン','<b>長くプレイしているほどCpSがより多く</b>、継続的に増加していく。<br>価格は現在の周回でのエッグの所持数に比例する。<q>100年卵と書くが実はそんなに古くない。これは86日も経っていない!</q>',eggPrice2,[19,12]);
		Game.last.descFunc=function(){
				var day=Math.floor((Date.now()-Game.startDate)/1000/10)*10/60/60/24;
				day=Math.min(day,100);
				var n=(1-Math.pow(1-day/100,3))*0.1;
			return '<div style="text-align:center;">現在のブースト : <b>+'+Beautify(n*100,1)+'%</b></div><div class="line"></div>'+this.desc;
		};
		new Game.Upgrade('"たまご"','<b>CpSを+9</b><q>ああ「卵」だよ</q>',eggPrice2,[20,12]);
		
		Game.easterEggs=['ニワトリの卵','アヒルの卵','七面鳥の卵','うずらの卵','コマドリの卵','ダチョウの卵','火食い鳥の卵','イクラ','カエルの卵','サメの卵','ウミガメの卵','アリの幼虫','金のガチョウの卵','ファベルジェの卵','虫の卵','クッキーの卵','オムレツ','チョコレートの卵','ピータン','"たまご"'];
		Game.eggDrops=['ニワトリの卵','アヒルの卵','七面鳥の卵','うずらの卵','コマドリの卵','ダチョウの卵','火食い鳥の卵','イクラ','カエルの卵','サメの卵','ウミガメの卵','アリの幼虫'];
		Game.rareEggDrops=['金のガチョウの卵','ファベルジェの卵','虫の卵','クッキーの卵','オムレツ','チョコレートの卵','ピータン','"たまご"'];
		
		Game.GetHowManyEggs=function()
		{
			var num=0;
			for (var i in Game.easterEggs) {if (Game.Has(Game.easterEggs[i])) num++;}
			return num;
		}
		for (var i in Game.eggDrops)//scale egg prices to how many eggs you have
		{Game.Upgrades[Game.eggDrops[i]].priceFunc=function(){return Math.pow(2,Game.GetHowManyEggs())*999;}}
		//{Game.Upgrades[Game.eggDrops[i]].priceFunc=function(){return Math.pow(Game.GetHowManyEggs()+1,2)*Game.cookiesPs*60*5;}}
		for (var i in Game.rareEggDrops)
		{Game.Upgrades[Game.rareEggDrops[i]].priceFunc=function(){return Math.pow(3,Game.GetHowManyEggs())*999;}}
		//{Game.Upgrades[Game.rareEggDrops[i]].priceFunc=function(){return Math.pow(Game.GetHowManyEggs()+1,3)*Game.cookiesPs*60*5;}}
		
		/*for (var i in Game.easterEggs)
		{
			Game.Upgrades[Game.easterEggs[i]].descFunc=function(){return '<div style="text-align:center;">You currently own <b>'+Game.GetHowManyEggs()+'/'+Game.easterEggs.length+'</b> eggs.</div><div class="line"></div>'+this.desc;};
		}*/
		
		Game.DropEgg=function(failRate)
		{
			failRate*=1/Game.dropRateMult();
			if (Game.season!='easter') return;
			if (Game.HasAchiev('かくれんぼチャンピオン')) failRate*=0.7;
			if (Game.Has('オムレツ')) failRate*=0.9;
			if (Game.Has('スタースポーン')) failRate*=0.9;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('seasons');
				if (godLvl==1) failRate*=0.9;
				else if (godLvl==2) failRate*=0.95;
				else if (godLvl==3) failRate*=0.97;
			}
			if (Math.random()>=failRate)
			{
				var drop='';
				if (Math.random()<0.1) drop=choose(Game.rareEggDrops);
				else drop=choose(Game.eggDrops);
				if (Game.Has(drop) || Game.HasUnlocked(drop))//reroll if we have it
				{
					if (Math.random()<0.1) drop=choose(Game.rareEggDrops);
					else drop=choose(Game.eggDrops);
				}
				if (Game.Has(drop) || Game.HasUnlocked(drop)) return;
				Game.Unlock(drop);
				if (Game.prefs.popups) Game.Popup('発見したもの : <br>'+drop+'!');
				else Game.Notify('卵を見つけました!','<b>'+drop+'</b>',Game.Upgrades[drop].icon);
			}
		};
		
		order=10032;
		Game.NewUpgradeCookie({name:'キャラメルマカロン',desc:'この中で一番塩気とかみ応えがある。',icon:[25,3],require:'マカロンの箱入りセット',		power:3,price: 9999999999999999999999});
		Game.NewUpgradeCookie({name:'甘草マカロン',desc:'「黒マカロン」としても知られる。',icon:[25,4],require:'マカロンの箱入りセット',				power:3,price: 9999999999999999999999999});
		
		
		order=525;
		new Game.TieredUpgrade('のっぽの窓口係','銀行が <b>2倍</b> 効率的になる。<q>のっぽの窓口係はより多くの手続きを処理可能だ。しかし気をつけないと、彼らは大ぼらを吹く</q>','銀行',1);
		new Game.TieredUpgrade('ハサミで切れないクレジットカード','銀行が <b>2倍</b> 効率的になる。<q>最重要顧客の為に。</q>','銀行',2);
		new Game.TieredUpgrade('耐酸性金庫','銀行が <b>2倍</b> 効率的になる。<q>「備えあれば憂い無し」ということだ。</q>','銀行',3);
		new Game.TieredUpgrade('チョコレートコイン','銀行が <b>2倍</b> 効率的になる。<q>この革命的貨幣は鋳造も溶かしてチョコ塊に戻すのも容易だ - 気晴らしでかじっても美味しい。</q>','銀行',4);
		new Game.TieredUpgrade('指数関数的利息','銀行が <b>2倍</b> 効率的になる。<q>数学論議などやってられるか!すぐに寄こせ。</q>','銀行',5);
		new Game.TieredUpgrade('金融禅','銀行が <b>2倍</b> 効率的になる。<q>経済思想の聖なる究極目的。ビッグマネーの風水、証券市場のヨガ - 神秘の10セントコイン操作法。</q>','銀行',6);
		
		order=550;
		new Game.TieredUpgrade('黄金の偶像','神殿が <b>2倍</b> 効率的になる。<q>クッキーを回収するために、もっと貪欲な冒険者を誘い込む。これこそ本当のアイドルゲームだ!</q>','神殿',1);
		new Game.TieredUpgrade('いけにえ','神殿が <b>2倍</b> 効率的になる。<q>ギガトン単位のクッキーに換えられる生命は何だ?</q>','神殿',2);
		new Game.TieredUpgrade('おいしい恩恵','神殿が <b>2倍</b> 効率的になる。<q>なんと、「焼き主」は全能なるスプーンで聖なる恵みを信徒に分け与えられたんだ - きらめくシュガー、闇夜のチョコ、そして小麦の知識を。そして少年よ、あのパーティーはとても素晴らしい物だったぞ。</q>','神殿',3);
		new Game.TieredUpgrade('太陽祀り','神殿が <b>2倍</b> 効率的になる。<q>火吹き芸、古典演舞、儀式の打ち首など楽しみいっぱい年一回の祝祭で、寺院の原始的活力を解放せよ!</q>','神殿',4);
		new Game.TieredUpgrade('増築された万神殿','神殿が <b>2倍</b> 効率的になる。<q>魂の力不足に対応!あなたが必要とするよりも多くの御利益が、あるいはお金が返ってきますよ!100 %保証!</q>','神殿',5);
		new Game.TieredUpgrade('天にまします大いなる焼き主','神殿が <b>2倍</b> 効率的になる。<q>これは大事なことだが至高神はあなたの振る舞いに大いなる視線を投げ掛けている。(善人には)良いことだが、もしかするとあなたは最後の審判の日取りを直ちに調べなきゃいけないかもね。</q>','神殿',6);
		
		order=575;
		new Game.TieredUpgrade('三角帽子','魔法使いの塔が <b>2倍</b> 効率的になる。<q>この円錐状の魔術用具について、幾何学的比率に比例して魔力の感度が高まることが試験で示された。</q>','魔法使いの塔',1);
		new Game.TieredUpgrade('ふさふさのあごひげ','魔法使いの塔が <b>2倍</b> 効率的になる。<q>聞いていたか?あごひげこそ合い言葉だ。</q>','魔法使いの塔',2);
		new Game.TieredUpgrade('旧き魔導書','魔法使いの塔が <b>2倍</b> 効率的になる。<q>「水をよだれに換える」とか「家具に眉毛を生やす」とか「政治家を呼びつける」など興味深い呪文が載っている。</q>','魔法使いの塔',3);
		new Game.TieredUpgrade('キッチンの呪い','魔法使いの塔が <b>2倍</b> 効率的になる。<q>焼き菓子に関係するあらゆる物を使った風変わりな呪術。最!高!</q>','魔法使いの塔',4);
		new Game.TieredUpgrade('魔法学校','魔法使いの塔が <b>2倍</b> 効率的になる。<q>このクッキー資本の魔術アカデミーは、魔術界の四大名家の故郷である : すなわち「万能リア充」「オタク」「ぼんぼん」そして「死喰い人」。</q>','魔法使いの塔',5);
		new Game.TieredUpgrade('暗黒の術式','魔法使いの塔が <b>2倍</b> 効率的になる。<q>おぞましい力がこの呪文の裏側で働いている - この力と取引するなんてとんでもないと霊感が働くだろう。しかし、クッキーが只だ、OK?</q>','魔法使いの塔',6);

		order=250;
		Game.GrandmaSynergy('銀行員のグランマ','より多くのクッキーを稼ぐ素敵な銀行員。','銀行');
		Game.GrandmaSynergy('祭司のグランマ','天にまします真の焼き主を崇める素敵な祭司。','神殿');
		Game.GrandmaSynergy('魔法使いのグランマ','ちちんぷいぷいクッキーよ来い！と唱える素敵な魔女。','魔法使いの塔');
		
		
		
		order=0;
		new Game.Upgrade('英国式紅茶のお供に～ビスケットの缶入りセット～','特製ビスケットの詰め合わせが入っている。<q>いつでもティータイム。</q>',25,[21,8]);Game.last.pool='prestige';Game.last.parents=['天国のクッキー'];
		new Game.Upgrade('マカロンの箱入りセット','マカロンの詰め合わせが入っている。<q>様々なジャムやクリームを挟んだ色とりどりのお菓子。くれぐれもマカルーン・マカロニ・マカレナ・その他つまらぬ物とは混同しないように。</q>',25,[20,8]);Game.last.pool='prestige';Game.last.parents=['天国のクッキー'];
		new Game.Upgrade('ブランドビスケットの箱入りセット','人気のビスケットの詰め合わせが入っている。<q>新品焼きたて!</q>',25,[20,9]);Game.last.pool='prestige';Game.last.parents=['天国のクッキー'];
	
		order=10020;
		Game.NewUpgradeCookie({name:'ピュアブラックチョコレートクッキー',desc:'ラボ製の最も暗いココアより暗い物質に漬け込んだクッキー(『チョコアレート』と名付けられている)。',icon:[26,3],power:									5,price: 9999999999999999*5});
		Game.NewUpgradeCookie({name:'ピュアホワイトチョコレートクッキー',desc:'緻密なこのビスケットのコーティングさえあれば、真っ暗な環境で光を屈折させることができる。',icon:[26,4],power:	5,price: 9999999999999999*5});
		Game.NewUpgradeCookie({name:'レディーフィンガー',desc:'洗浄と消毒はバッチリ、紛れも無くビスケットであると誓ってもいいよ。',icon:[27,3],power:																	3,price: 99999999999999999});
		Game.NewUpgradeCookie({name:'チュイール',desc:'瓦スタイルは変わらない。',icon:[27,4],power:																													3,price: 99999999999999999*5});
		Game.NewUpgradeCookie({name:'チョコレート入りビスケット',desc:'豪勢なお菓子!<br>穴はチョコレートが呼吸できるようになってるよ。',icon:[28,3],power:												3,price: 999999999999999999});
		Game.NewUpgradeCookie({name:'チェッカークッキー',desc:'四角いクッキーだって?これで多くの保管・包装問題が解決する!きみは天才だ!',icon:[28,4],power:												3,price: 999999999999999999*5});
		Game.NewUpgradeCookie({name:'バタークッキー',desc:'口の中でほろほろ溶けて、君の心をメロメロにする。(そして君の体をコロコロ肥やす、現実を見るんだ。)',icon:[29,3],power:									3,price: 9999999999999999999});
		Game.NewUpgradeCookie({name:'クリームクッキー',desc:'一見ただの2枚のチョコチップクッキー!ところがどっこい、クリームの魔法で 1 つに合体!悪魔の発明かってほどに完璧!',icon:[29,4],power:						3,price: 9999999999999999999*5});

		order=0;
		var desc='このスロットにアップグレードを置くことで、そのアップグレードはゲームの初めから最後まで<b>恒久的に</b>効果を発揮します。';
		new Game.Upgrade('アップグレードスロット I',desc,	100,[0,10]);Game.last.pool='prestige';Game.last.iconFunction=function(){return Game.PermanentSlotIcon(0);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(0);};
		new Game.Upgrade('アップグレードスロット II',desc,	20000,[1,10]);Game.last.pool='prestige';Game.last.parents=['アップグレードスロット I'];Game.last.iconFunction=function(){return Game.PermanentSlotIcon(1);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(1);};
		new Game.Upgrade('アップグレードスロット III',desc,	3000000,[2,10]);Game.last.pool='prestige';Game.last.parents=['アップグレードスロット II'];Game.last.iconFunction=function(){return Game.PermanentSlotIcon(2);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(2);};
		new Game.Upgrade('アップグレードスロット IV',desc,	400000000,[3,10]);Game.last.pool='prestige';Game.last.parents=['アップグレードスロット III'];Game.last.iconFunction=function(){return Game.PermanentSlotIcon(3);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(3);};
		new Game.Upgrade('アップグレードスロット V',desc,	50000000000,[4,10]);Game.last.pool='prestige';Game.last.parents=['アップグレードスロット IV'];Game.last.iconFunction=function(){return Game.PermanentSlotIcon(4);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(4);};
		
		var slots=['アップグレードスロット I','アップグレードスロット II','アップグレードスロット III','アップグレードスロット IV','アップグレードスロット V'];
		for (var i=0;i<slots.length;i++)
		{
			Game.Upgrades[slots[i]].descFunc=function(i){return function(context){
				if (Game.permanentUpgrades[i]==-1) return this.desc+(context=='stats'?'':'<br><b>クリックして有効化してください。</b>');
				var upgrade=Game.UpgradesById[Game.permanentUpgrades[i]];
				return '<div style="text-align:center;">'+'現在 : <div class="icon" style="vertical-align:middle;display:inline-block;'+(upgrade.icon[2]?'background-image:url('+upgrade.icon[2]+');':'')+'background-position:'+(-upgrade.icon[0]*48)+'px '+(-upgrade.icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> <b>'+upgrade.name+'</b><div class="line"></div></div>'+this.desc+(context=='stats'?'':'<br><b>クリックして有効化してください。</b>');
			};}(i);
		}
		
		Game.PermanentSlotIcon=function(slot)
		{
			if (Game.permanentUpgrades[slot]==-1) return [slot,10];
			return Game.UpgradesById[Game.permanentUpgrades[slot]].icon;
		}
		Game.AssignPermanentSlot=function(slot)
		{
			PlaySound('snd/tick.mp3');
			Game.tooltip.hide();
			var list=[];
			for (var i in Game.Upgrades)
			{
				var me=Game.Upgrades[i];
				if (me.bought && me.unlocked && !me.noPerm && (me.pool=='' || me.pool=='cookie'))
				{
					var fail=0;
					for (var ii in Game.permanentUpgrades) {if (Game.permanentUpgrades[ii]==me.id) fail=1;}//check if not already in another permaslot
					if (!fail) list.push(me);
				}
			}
			
			var sortMap=function(a,b)
			{
				if (a.order>b.order) return 1;
				else if (a.order<b.order) return -1;
				else return 0;
			}
			list.sort(sortMap);
			
			var upgrades='';
			for (var i in list)
			{
				var me=list[i];
				upgrades+=Game.crate(me,'','PlaySound(\'snd/tick.mp3\');Game.PutUpgradeInPermanentSlot('+me.id+','+slot+');','upgradeForPermanent'+me.id);
			}
			var upgrade=Game.permanentUpgrades[slot];
			Game.SelectingPermanentUpgrade=upgrade;
			Game.Prompt('<h3>恒久的に発動させたいアップグレードを選択してください</h3>'+
			
						'<div class="line"></div><div style="margin:4px auto;clear:both;width:120px;"><div class="crate upgrade enabled" style="background-position:'+(-slot*48)+'px '+(-10*48)+'px;"></div><div id="upgradeToSlotNone" class="crate upgrade enabled" style="background-position:'+(-0*48)+'px '+(-7*48)+'px;display:'+(upgrade!=-1?'none':'block')+';"></div><div id="upgradeToSlotWrap" style="float:left;display:'+(upgrade==-1?'none':'block')+';">'+(Game.crate(Game.UpgradesById[upgrade==-1?0:upgrade],'','','upgradeToSlot'))+'</div></div>'+
						'<div class="block crateBox" style="overflow-y:scroll;float:left;clear:left;width:317px;padding:0px;height:250px;">'+upgrades+'</div>'+
						'<div class="block" style="float:right;width:152px;clear:right;height:234px;">ここに並んでいるものはすべて前回のプレイで購入したものです。<div class="line"></div>効果を受け続けたいものを1つ選んでください!<div class="line"></div>昇天したときならば、いつでもスロットへの再配置ができます。</div>'
						,[['決定','Game.permanentUpgrades['+slot+']=Game.SelectingPermanentUpgrade;Game.BuildAscendTree();Game.ClosePrompt();'],'キャンセル'],0,'widePrompt');
		}
		Game.SelectingPermanentUpgrade=-1;
		Game.PutUpgradeInPermanentSlot=function(upgrade,slot)
		{
			Game.SelectingPermanentUpgrade=upgrade;
			l('upgradeToSlotWrap').innerHTML='';
			l('upgradeToSlotWrap').style.display=(upgrade==-1?'none':'block');
			l('upgradeToSlotNone').style.display=(upgrade!=-1?'none':'block');
			l('upgradeToSlotWrap').innerHTML=(Game.crate(Game.UpgradesById[upgrade==-1?0:upgrade],'','','upgradeToSlot'));
		}
		
		new Game.Upgrade('スタースポーン','イースターエッグが <b>10%</b> ドロップしやすくなる。<br>イースターイベント中はゴールデンクッキーが <b>2%</b> 出やすくなる。',111111,[0,12]);Game.last.pool='prestige';Game.last.parents=['季節切り替え装置'];
		new Game.Upgrade('スタースノウ','クリスマスクッキーが <b>5%</b> ドロップしやすくなる。<br>トナカイが <b>5%</b> 出現しやすくなる。',111111,[12,9]);Game.last.pool='prestige';Game.last.parents=['季節切り替え装置'];
		new Game.Upgrade('スターテラー','ハロウィンクッキーが <b>10%</b> ドロップしやすくなる。<br>ハロウィンイベント中はゴールデンクッキーが <b>2%</b> 出やすくなる。',111111,[13,8]);Game.last.pool='prestige';Game.last.parents=['季節切り替え装置'];
		new Game.Upgrade('スターラブ','ハートクッキーの効果が <b>50%</b> より強くなる。<br>バレンタインイベント中はゴールデンクッキーが <b>2%</b> 出やすくなる。',111111,[20,3]);Game.last.pool='prestige';Game.last.parents=['季節切り替え装置'];
		new Game.Upgrade('スタートレード','ビジネスデーイベント中はゴールデンクッキーが <b>5%</b> 出やすくなる。',111111,[17,6]);Game.last.pool='prestige';Game.last.parents=['季節切り替え装置'];
		
		var angelPriceFactor=7;
		var desc=function(percent,total){return 'ゲームを閉じている間、さらにCpSの <b>+'+percent+'%</b> が、計 <b>'+total+'%</b> 増えるようになる。';}
		new Game.Upgrade('天使',desc(10,15)+'<q>ペーストリー・ヘヴン第一階層の最低位である天使は、新たなレシピを現世のふさわしき人物に運ぶ任務を負う。</q>',Math.pow(angelPriceFactor,1),[0,11]);Game.last.pool='prestige';Game.last.parents=['超絶の双門'];
		new Game.Upgrade('大天使',desc(10,25)+'<q>ペーストリー・ヘヴン第一階層に座する大天使は、世界最大級の菓子工場を円滑に稼働させる責務がある。</q>',Math.pow(angelPriceFactor,2),[1,11]);Game.last.pool='prestige';Game.last.parents=['天使'];
		new Game.Upgrade('力天使',desc(10,35)+'<q>ペーストリー・ヘヴン第二階層で見られる力天使は、神の力をもって天空の星々を押したり引いたりしている。</q>',Math.pow(angelPriceFactor,3),[2,11]);Game.last.pool='prestige';Game.last.parents=['大天使'];
		new Game.Upgrade('主天使',desc(10,45)+'<q>ペーストリー・ヘヴン第二階層のボスである主天使は、主管者の立場にあって収支を管理したりスケジュールの調整をしている。</q>',Math.pow(angelPriceFactor,4),[3,11]);Game.last.pool='prestige';Game.last.parents=['力天使'];
		new Game.Upgrade('智天使',desc(10,55)+'<q>4つの顔を持つ智天使はペーストリー・ヘヴン第一階層の番をしており、天の見張りや護衛を務めている。</q>',Math.pow(angelPriceFactor,5),[4,11]);Game.last.pool='prestige';Game.last.parents=['主天使'];
		new Game.Upgrade('熾天使',desc(10,65)+'<q>ペーストリー・ヘヴン第一階層を率いる熾天使は、焼き上げに関するあらゆる叡智を備える。</q>',Math.pow(angelPriceFactor,6),[5,11]);Game.last.pool='prestige';Game.last.parents=['智天使'];
		new Game.Upgrade('神',desc(10,75)+'<q>サンタに似るが、面白味は少ない。</q>',Math.pow(angelPriceFactor,7),[6,11]);Game.last.pool='prestige';Game.last.parents=['熾天使'];
		
		new Game.Upgrade('超絶の双門','現在、ゲームを閉じてから <b>1時間</b> まで通常時のCpSの <b>5%</b> で<b>ゲームを閉じている間もクッキーを作り続けてくれる</b>。(1時間を過ぎると、さらに 90% 生産量が減る。 - 比率はCpSの <b>0.5%</b> まで下がる。)<q>これはいつでも衣一枚だけで暮らすチャンスだ。落ち着いて、さあ番人を通り越して門に駆け込み、その後は以前からの住人を装うのだ。</q>',1,[15,11]);Game.last.pool='prestige';

		new Game.Upgrade('素晴らしき幸運','ゴールデンクッキーが <b>5%</b> 出やすくなる。<q>神様のご加護。</q>',77,[22,6]);Game.last.pool='prestige';
		new Game.Upgrade('安定した運勢','ゴールデンクッキーの効果が <b>10%</b> 長く続くようになる。<q>毎日こんなにツイてると思うなよ。これは…たまたま凄くツイていただけだ。</q>',777,[23,6]);Game.last.pool='prestige';Game.last.parents=['素晴らしき幸運'];
		new Game.Upgrade('逃れられぬ運命','ゴールデンクッキーが <b>5%</b> 長く画面に残るようになる。<q>最期の悪あがき。</q>',7777,[10,14]);Game.last.pool='prestige';Game.last.parents=['安定した運勢'];

		new Game.Upgrade('神聖な割引','施設が <b>1% 安く</b>なる。<q>在庫一掃大バーゲン!</q>',99999,[21,7]);Game.last.pool='prestige';Game.last.parents=['逃れられぬ運命'];
		new Game.Upgrade('神聖な安売り','アップグレードが <b>1% 安く</b>なる。<q>お得意様には特別価格でご奉仕。</q>',99999,[18,7]);Game.last.pool='prestige';Game.last.parents=['逃れられぬ運命'];
		new Game.Upgrade('神聖なベーカリー','クッキーアップグレードの値段が <b>5分の1</b> になる。<q>あいつら、この道のプロだからね。</q>',399999,[17,7]);Game.last.pool='prestige';Game.last.parents=['神聖な安売り','神聖な割引'];
		
		new Game.Upgrade('スターターキット','<b>10カーソル</b> 持った状態で始まる。<q>重宝するよ。</q>',50,[0,14]);Game.last.pool='prestige';Game.last.parents=['英国式紅茶のお供に～ビスケットの缶入りセット～','マカロンの箱入りセット','ブランドビスケットの箱入りセット','バタークッキーの缶入りセット'];
		new Game.Upgrade('スターターキッチン','<b>5グランマ</b> 持った状態で始まる。<q>何処から来たんだろね?</q>',5000,[1,14]);Game.last.pool='prestige';Game.last.parents=['スターターキット'];
		new Game.Upgrade('神々しい手袋','クリックによる生産量が <b>10%</b> 増える。<q>そのクッキーに罰を与えよ。</q>',55555,[22,7]);Game.last.pool='prestige';Game.last.parents=['スターターキット'];

		new Game.Upgrade('子猫の天使','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>天国から来たにゃんこちゃん。</q>',9000,[23,7]);Game.last.pool='prestige';Game.last.parents=['主天使'];Game.last.kitten=1;
		
		new Game.Upgrade('不浄の餌','虫が <b>5倍</b> 出やすくなる。<q>ワーム・ビスケットのにおいに抗える虫などいない。</q>',44444,[15,12]);Game.last.pool='prestige';Game.last.parents=['スターターキッチン'];
		new Game.Upgrade('罰当たりな改変','虫が <b>5%</b> より多くクッキーを吐き出すようになる。<q>動物界では極めて珍しいが、虫の消化器官はありえないほどの拡張に耐えうる - ただし適度に食事を急かせばの話だが。</q>',444444,[19,8]);Game.last.pool='prestige';Game.last.parents=['不浄の餌'];
		
		
		order=200;new Game.TieredUpgrade('エクストリーム歩行器','グランマが <b>2倍</b> 効率的になる。<q>炎のタトゥーシールとピューッと鳴る小さなラッパ付き。</q>','グランマ',7);
		order=300;new Game.TieredUpgrade('ファッジ菌','農場が <b>2倍</b> 効率的になる。<q>巻きひげがクッキーの成長を助ける、甘ったるい寄生菌。胞子を吸わないように。吸ってしまった場合、36 秒以内に医学的処置を受けること。</q>','農場',7);
		order=400;new Game.TieredUpgrade('惑星割り','鉱山が <b>2倍</b> 効率的になる。<q>この最新式掘削機は「Merula」「Globort」「Flwanza VI」他、遠方の惑星の間でテストされてきた。これらの惑星は興味深いことに先日から音沙汰が無い。</q>','鉱山',7);
		order=500;new Game.TieredUpgrade('サイボーグ工員','工場が <b>2倍</b> 効率的になる。<q>半機械化人間はサボタージュもストライキも起こさないし、昼食休憩を 20 ％ほど短くできるし、消耗品として理想的だ。</q>','工場',7);
		order=525;new Game.TieredUpgrade('サイフ道','銀行が <b>2倍</b> 効率的になる。<q>この新しい金融学派は業界で大流行している。あなた達も教義に従えばすぐに利益を得られるでしょう。</q>','銀行',7);
		order=550;new Game.TieredUpgrade('創造神話','神殿が <b>2倍</b> 効率的になる。<q>あらゆるクッキーの中で最も旧きものの更に根元にまで物話は遡る。時を超越する「生地」そして運命の「オーブン」からいかにして全てが始まったかについての言い伝えだ。</q>','神殿',7);
		order=575;new Game.TieredUpgrade('クッキー操術','魔法使いの塔が <b>2倍</b> 効率的になる。<q>これぞ完成された焼き上げ魔法の流派だ。魔法の仕掛けのおかげで、チップの召喚からナッツに呪いをかけることまで、クッキー作りの全ての工程が10倍程度改善されたのだ。</q>','魔法使いの塔',7);
		order=600;new Game.TieredUpgrade('ダイソン球','宇宙船が <b>2倍</b> 効率的になる。<q>君は宇宙科学についての知識を、少しだけ局所的な取り組みに応用する方法を見つけた。恒星を包み込むように建造されたこの超物質製の超巨大球体は、きっとあなたのクッキー生産力を劇的に向上させる。</q>','宇宙船',7);
		order=700;new Game.TieredUpgrade('原子流転説','錬金術室が <b>2倍</b> 効率的になる。<q>錬金術の奥義に至り、あらゆる物質は別の物質へ変換可能であると分かった - 鉛は金に、水銀は水に。さらに重要なことだが、どんな物でもクッキーに変換できる（そして変換すべきである）ということを悟った。</q>','錬金術室',7);
		order=800;new Game.TieredUpgrade('終末の日バックアップ計画','ポータルが <b>2倍</b> 効率的になる。<q>あくまで念のためだ、いいね?</q>','ポータル',7);
		order=900;new Game.TieredUpgrade('グレートループ仮説','タイムマシンが <b>2倍</b> 効率的になる。<q>この宇宙が終わりなき円環の、周回の1つに過ぎないとしたら?この宇宙の前にも後にも同様の宇宙が果てしなく伸びており、各々の宇宙が無数のクッキーを含有するとしたら?</q>','タイムマシン',7);
		order=1000;new Game.TieredUpgrade('パルス','反物質凝縮器が <b>2倍</b> 効率的になる。<q>君は宇宙の鼓動そのものを送信し終えた。これは時代を超えたリズムであり、全ての物質と反物質はこれに従って一斉に脈打つのだ。どういうわけか、これでもっとクッキーを得られるようになる。</q>','反物質凝縮器',7);
		order=1100;
		new Game.TieredUpgrade('光のサンクトラム','プリズムが <b>2倍</b> 効率的になる。<q>あなたのプリズム操作係は光の中の何か(あるいは光を超越し、おそらく我々を超越した何者か)をますます惹きつけるようになった。</q>','プリズム',7);
		
		
		order=200;new Game.TieredUpgrade('制約を越えた者','グランマが <b>2倍</b> 効率的になる。<q>悪い子育てについてのよくある寓話かもしれないが、このお話でグランマがどこへ向かうのか見てみよう。</q>','グランマ',8);
		order=300;new Game.TieredUpgrade('小麦トリフィド','農場が <b>2倍</b> 効率的になる。<q>君んとこの植物が自由に歩き回れて農場の手伝いをしてくれたら、作物の世話がとても楽になるだろうね。但し、そいつを撫でちゃダメ。餌あげちゃダメ。話しかけるのもダメ。</q>','農場',8);
		order=400;new Game.TieredUpgrade('キャノーラ油井','鉱山が <b>2倍</b> 効率的になる。<q>これまで手付かずの資源であったキャノーラ油は地下の油井に豊富にあり、発掘者に格別の味わいと莫大な富を約束してくれる。</q>','鉱山',8);
		order=500;new Game.TieredUpgrade('一日78時間労働','工場が <b>2倍</b> 効率的になる。<q>なぜもっと早くに思いつかなかったのだろう?</q>','工場',8);
		order=525;new Game.TieredUpgrade('マネーの原理','銀行が <b>2倍</b> 効率的になる。<q>いつやるの?今でしょ!何やるの?これでしょ!道具がない?…なら有り合わせの物でなんとか。</q>','銀行',8);
		order=550;new Game.TieredUpgrade('神権政治','神殿が <b>2倍</b> 効率的になる。<q>あなたは自身のクッキー皇国を完全な神権制に移行した、これは宇宙の隅から隅まで存在する無数の臣民からなる信仰集団である。<br>常に敬虔でありなさい。</q>','神殿',8);
		order=575;new Game.TieredUpgrade('うさぎのトリック','魔法使いの塔が <b>2倍</b> 効率的になる。<q>ただの派手なシルクハットを使うことで、魔法使いはうさぎの個体数を抑制すると同時に、実質ロハで更なるクッキーの山を作り出す方法を編み出した。<br>但し、このクッキーはビーガンには適さない可能性がある。</q>','魔法使いの塔',8);
		order=600;new Game.TieredUpgrade('最期のフロンティア','宇宙船が <b>2倍</b> 効率的になる。<q>長い道のりだったがここまで踏破した。しかし本当にやりがいのある事業だった - 景色は素晴らしいし、油の価格も少しは手頃になるしね。</q>','宇宙船',8);
		order=700;new Game.TieredUpgrade('ギンガトビバッタ','錬金術室が <b>2倍</b> 効率的になる。<q>よし、ついにやったな。上出来だ。すばらしい。これで 3 つの銀河がクッキーに変換された。君が銀河系の間を飛び回れるのはいいことだ。</q>','錬金術室',8);
		order=800;new Game.TieredUpgrade('人をキレさせるシュプレヒコール','ポータルが <b>2倍</b> 効率的になる。<q>よく使われる文はこういう感じだ : ジョオンマッデンジョオンマッデンアエイオウアエイオウブルブルブル</q>','ポータル',8);
		order=900;new Game.TieredUpgrade('クッキートピアンの夢想','タイムマシンが <b>2倍</b> 効率的になる。<q>過去の歴史の別の可能性や、今どうあるべきか、これからどうなるのかについて思いを巡らせている。</q>','タイムマシン',8);
		order=1000;new Game.TieredUpgrade('他にも基本的な超微粒子があるだろう、多分','反物質凝縮器が <b>2倍</b> 効率的になる。<q>森羅万象さえもが行き詰まりに達した時こそ、あなたの研究が終わりに近づいていることが分かるのです。</q>','反物質凝縮器',8);
		order=1100;
		new Game.TieredUpgrade('陰影反転','プリズムが <b>2倍</b> 効率的になる。<q>うわぁ、これは本当に目がチカチカするよ。</q>','プリズム',8);
		
		
		order=20000;
		new Game.Upgrade('会計士猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>ビジネスを素晴らしく成功させます、ご主人様</q>',900000000000000000000000,Game.GetIcon('Kitten',6));Game.last.kitten=1;Game.MakeTiered(Game.last,6,18);
		new Game.Upgrade('専門家猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>業務フローのギョっとするほどの改善をご期待ください、ご主人様</q>',900000000000000000000000000,Game.GetIcon('Kitten',7));Game.last.kitten=1;Game.MakeTiered(Game.last,7,18);
		new Game.Upgrade('熟練者猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>クッキービジネスこの道10年のエキスプゥァァァートでございます、ご主人様</q>',900000000000000000000000000000,Game.GetIcon('Kitten',8));Game.last.kitten=1;Game.MakeTiered(Game.last,8,18);
		
		new Game.Upgrade('ドラゴンの焼き方','100万枚クッキーを焼くことで、<b>ポロポロこぼれそうな卵</b>が購入できるようになる。<q>この分厚い研究書には有益な情報が満載だった…以下の様な。「畜生、そいつに手を出すんじゃねぇ」「何で買っちまったんだよこれ…便所の躾すら出来てねぇ」「週に二回、鱗の向きに従って拭いてやること」</q>',9,[22,12]);Game.last.pool='prestige';

		order=25100;
		new Game.Upgrade('ポロポロこぼれそうな卵','<b>クッキードラゴンの卵</b>を開放する。<q>この丈夫で遊び好きなクッキードラゴンをお求め頂き、誠にありがとうございます!あなたの暮らしに長く喜びと娯楽をもたらすことでしょう。 <br>飼育は乾燥した涼しい場所で、他のペットには近づけないように。住宅災害保険への加入を強くお勧めします。</q>',25,[21,12]);
		
		new Game.Upgrade('キメラ','シナジーアップグレードが <b>2% 安く</b>なる。<br>ゲームを閉じている間、CpSの <b>+5%</b> より多く増えるようになる。<br>ゲームを閉じている間の低下前のクッキー生産量が <b>2日間長く</b> 保つようになる。<q>(全体の合計が)各部分の和よりも大きくなる。</q>',Math.pow(angelPriceFactor,9),[24,7]);Game.last.pool='prestige';Game.last.parents=['神','ルシファー','シナジーアップグレード II'];
		
		new Game.Upgrade('バタークッキーの缶入りセット','お高いバタービスケットの詰め合わせが入っている。<q>5種類のデンマークバタークッキー。小さな紙カップも完備。</q>',25,[21,9]);Game.last.pool='prestige';Game.last.parents=['天国のクッキー'];
		
		new Game.Upgrade('ゴールデンスイッチ','ゴールデンクッキーを出現しなくする代わりにCpSに50%の常時ボーナスをかける<b>ゴールデンスイッチ</b>を開放します。<q>クリック休んで、のんびりしたら？</q>',999,[21,10]);Game.last.pool='prestige';Game.last.parents=['素晴らしき幸運'];
		
		new Game.Upgrade('クラシックデイリーセレクション','大クッキーの後ろに表示されるミルクを選べるようになる<b>ミルクセレクター</b>が解禁される。<br>普通のフレーバーが入っている。<q>そんなに怒るなよ、もぉ～。</q>',9,[1,8]);Game.last.pool='prestige';Game.last.parents=[];
		
		new Game.Upgrade('ファンシフルデイリーセレクション','ミルクセレクター用の異色のフレーバーが入っている。<q>屈強な骨揃いの骸骨軍御用達</q>',1000000,[9,7]);Game.last.pool='prestige';Game.last.parents=['クラシックデイリーセレクション'];
		
		order=10300;
		Game.NewUpgradeCookie({name:'ドラゴンクッキー',desc:'クッキードラゴン完全成体の生命力と成長力を宿す神秘的なクッキーは、君の帝国を末代まで煽り勢いづかせるだろう。',icon:[10,25],power:5,price:9999999999999999*7,locked:1});
		
		
		order=40000;
		new Game.Upgrade('ゴールデンスイッチ[オフ]','このスイッチをオンにするとCpSに <b>+50%</b> の常時ボーナスがつきますが、ゴールデンクッキーが出現しなくなります。<br>切り替えにはクッキー生産量の1時間分がかかります。',1000000,[20,10]);
		Game.last.pool='toggle';Game.last.toggleInto='ゴールデンスイッチ[オン]';
		Game.last.priceFunc=function(){return Game.cookiesPs*60*60;}
		var func=function(){
			if (Game.Has('残された幸運'))
			{
				var bonus=0;
				var upgrades=Game.goldenCookieUpgrades;
				for (var i in upgrades) {if (Game.Has(upgrades[i])) bonus++;}
				return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.goldenCookieUpgrades)+'<br><br>実際のブーストは <b>+'+Beautify(Math.round(50+bonus*10))+'%</b> です<br>残された幸運 と<br><b>'+bonus+'つ</b> のゴールデンクッキー関連のアップグレードによります'+(bonus==1?'':'')+'.</div><div class="line"></div>'+this.desc;
			}
			return this.desc;
		};
		Game.last.descFunc=func;
		
		new Game.Upgrade('ゴールデンスイッチ[オン]','このスイッチによって、現在CpSに <b>+50%</b> の常時ボーナスがついており、ゴールデンクッキーが出現しなくなっています。<br>オフにすると元の効果の無い状態に戻ります。<br>切り替えのコストはクッキー生産量の1時間分がかかります。',1000000,[21,10]);
		Game.last.pool='toggle';Game.last.toggleInto='ゴールデンスイッチ[オフ]';
		Game.last.priceFunc=function(){return Game.cookiesPs*60*60;}
		Game.last.descFunc=func;
		
		order=50000;
		new Game.Upgrade('ミルクセレクター','表示したいミルクのフレーバーを選びましょう。',0,[1,8]);
		Game.last.descFunc=function(){
			var choice=this.choicesFunction()[Game.milkType];
			if (!choice) choice=this.choicesFunction()[0];
			return '<div style="text-align:center;">現在 : <div class="icon" style="vertical-align:middle;display:inline-block;'+(choice.icon[2]?'background-image:url('+choice.icon[2]+');':'')+'background-position:'+(-choice.icon[0]*48)+'px '+(-choice.icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> <b>'+choice.name+'</b></div><div class="line"></div>'+this.desc;
		};
		
		Game.last.pool='toggle';
		Game.last.choicesFunction=function()
		{
			var rank=0;
			var choices=[];
			choices[0]={name:'自動',icon:[0,7]};
			choices[1]={name:'プレーンミルク',icon:[1,8],rank:rank++};
			choices[2]={name:'チョコレートミルク',icon:[2,8],rank:rank++};
			choices[3]={name:'ラズベリーミルク',icon:[3,8],rank:rank++};
			choices[4]={name:'オレンジミルク',icon:[4,8],rank:rank++};
			choices[5]={name:'キャラメルミルク',icon:[5,8],rank:rank++};
			choices[6]={name:'バナナミルク',icon:[6,8],rank:rank++};
			choices[7]={name:'ライムミルク',icon:[7,8],rank:rank++};
			choices[8]={name:'ブルーベリーミルク',icon:[8,8],rank:rank++};
			choices[9]={name:'ストロベリーミルク',icon:[9,8],rank:rank++};
			choices[10]={name:'バニラミルク',icon:[10,8],rank:rank++};
			
			choices[19]={name:'ハニーミルク',icon:[21,23],rank:rank++};
			choices[20]={name:'コーヒー牛乳',icon:[22,23],rank:rank++};
			choices[21]={name:'紅茶ミルク',icon:[23,23],rank:rank++};
			choices[22]={name:'ココナッツミルク',icon:[24,23],rank:rank++};
			choices[23]={name:'サクランボミルク',icon:[25,23],rank:rank++};
			
			choices[25]={name:'スパイシーミルク',icon:[26,23],rank:rank++};
			choices[26]={name:'メープルミルク',icon:[28,23],rank:rank++};
			choices[27]={name:'ミントミルク',icon:[29,23],rank:rank++};
			choices[28]={name:'甘草ミルク',icon:[30,23],rank:rank++};
			choices[29]={name:'ローズミルク',icon:[31,23],rank:rank++};
			choices[30]={name:'ドラゴンフルーツミルク',icon:[21,24],rank:rank++};
			
			if (Game.Has('ファンシフルデイリーセレクション'))
			{
				choices[11]={name:'しまうまミルク',icon:[10,7],order:10,div:true};
				choices[12]={name:'天の河ミルク',icon:[9,7],order:10};
				choices[13]={name:'炎のミルク',icon:[8,7],order:10};
				choices[14]={name:'真っ赤な血のミルク',icon:[7,7],order:10};
				choices[15]={name:'黄金のミルク',icon:[6,7],order:10};
				choices[16]={name:'真夜中の空のミルク',icon:[5,7],order:10};
				choices[17]={name:'翡翠の業火燃え盛るミルク',icon:[4,7],order:10};
				choices[18]={name:'氷青の炎揺らめくミルク',icon:[3,7],order:10};
				
				choices[24]={name:'豆乳',icon:[27,23],order:10};
			}
			
			var maxRank=Math.floor(Game.AchievementsOwned/25);
			for (var i in choices)
			{
				if (choices[i].rank && choices[i].rank>maxRank) choices[i]=0;
			}
			
			choices[Game.milkType].selected=1;
			return choices;
		}
		Game.last.choicesPick=function(id)
		{Game.milkType=id;}
		
		Game.MilksByChoice={
			0:{pic:'milkPlain'},
			1:{pic:'milkPlain'},
			2:{pic:'milkChocolate'},
			3:{pic:'milkRaspberry'},
			4:{pic:'milkOrange'},
			5:{pic:'milkCaramel'},
			6:{pic:'milkBanana'},
			7:{pic:'milkLime'},
			8:{pic:'milkBlueberry'},
			9:{pic:'milkStrawberry'},
			10:{pic:'milkVanilla'},
			11:{pic:'milkZebra'},
			12:{pic:'milkStars'},
			13:{pic:'milkFire'},
			14:{pic:'milkBlood'},
			15:{pic:'milkGold'},
			16:{pic:'milkBlack'},
			17:{pic:'milkGreenFire'},
			18:{pic:'milkBlueFire'},
			19:{pic:'milkHoney'},
			20:{pic:'milkCoffee'},
			21:{pic:'milkTea'},
			22:{pic:'milkCoconut'},
			23:{pic:'milkCherry'},
			24:{pic:'milkSoy'},
			25:{pic:'milkSpiced'},
			26:{pic:'milkMaple'},
			27:{pic:'milkMint'},
			28:{pic:'milkLicorice'},
			29:{pic:'milkRose'},
			30:{pic:'milkDragonfruit'},
		};
		
		
		order=10300;
		var butterBiscuitMult=100000000;
		Game.NewUpgradeCookie({name:'ミルクチョコレートバタービスケット',desc:'全ての施設を100個所有した報酬です。<br>偉大な起業家が彫られています。',icon:[27,8],power:	10,price: 999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'ダークチョコレートバタービスケット',desc:'全ての施設を150個所有した報酬です。<br>経験豊富なクッキー界の大物の像で飾られています。',icon:[27,9],power:	10,price: 999999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'ホワイトチョコレートバタービスケット',desc:'全ての施設を200個所有した報酬です。<br>チョコレートには、堂々たる社交界の大御所が彫られています。',icon:[28,9],power:	10,price: 999999999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'ルビーチョコレートバタービスケット',desc:'全ての施設を250個所有した報酬です。<br>希少な赤チョコレートで覆われています。このビスケットには、力に狂い己を見失ったクッキー実業家の顔を表現したエッチングが施されています。',icon:[28,8],power:	10,price: 999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		order=10020;
		Game.NewUpgradeCookie({name:'ジンジャースナップ',desc:'魂のこもったクッキーだ。おそらくね。',icon:[29,10],power:						4,price: 99999999999999999999});
		Game.NewUpgradeCookie({name:'シナモンクッキー',desc:'秘密は特許取得済みの渦巻き模様の甘いグレーズ。',icon:[23,8],power:						4,price: 99999999999999999999*5});
		Game.NewUpgradeCookie({name:'バニティークッキー',desc:'砂糖漬け果物の欠片が一つ、この退廃的なクッキーにちょこんと坐している。',icon:[22,8],power:						4,price: 999999999999999999999});
		Game.NewUpgradeCookie({name:'シガレット',desc:'身近な一品だけど、当時のコーヒーショップでストロー代わりに提供するには贅沢すぎるね。',icon:[25,8],power:						4,price: 999999999999999999999*5});
		Game.NewUpgradeCookie({name:'ピンホイールクッキー',desc:'ブラウンの風味とベージュの甘味のコンビネーションが、君に目玉グルグル攻撃だ!',icon:[22,10],power:						4,price: 9999999999999999999999});
		Game.NewUpgradeCookie({name:'四角いファッジ',desc:'正確にはクッキーじゃないけど、1個食べればそんなのどうでもよくなる。美味しけりゃいいんだよ、でっち上げでも!',icon:[24,8],power:						4,price: 9999999999999999999999*5});
		
		order=10030;
		Game.NewUpgradeCookie({name:'ディジット',desc:'3つのフレーバー、骨はなし。',icon:[26,8],require:'ブランドビスケットの箱入りセット',power:												2,	price:	999999999999999*5});
		
		order=10029;
		Game.NewUpgradeCookie({name:'バターホースシュー',desc:'何かの熱中防止に必要な存在。',icon:[22,9],require:'バタークッキーの缶入りセット',power:							4,	price:	99999999999999999999999});
		Game.NewUpgradeCookie({name:'バターパック',desc:'ご主人様、人間って何て愚かなんでしょう!<br>(引用違うって突っ込んでもいんよう。)',icon:[23,9],require:'バタークッキーの缶入りセット',power:							4,	price:	99999999999999999999999*5});
		Game.NewUpgradeCookie({name:'バターノット',desc:'ほら、欲しいのならこのプレッツェルあげるよ。ただ君さ、思い違いなんてしてないよね?',icon:[24,9],require:'バタークッキーの缶入りセット',power:							4,	price:	999999999999999999999999});
		Game.NewUpgradeCookie({name:'バタースラブ',desc:'痛いビンタより、この板いバタークッキーの方が遥かにベター。',icon:[25,9],require:'バタークッキーの缶入りセット',power:							4,	price:	999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'バタースワール',desc:'等分の砂糖とバター、そして暖かくハッピーな気持ちで出来ている - そのどれもが毎日数百万もの死を招いている。',icon:[26,9],require:'バタークッキーの缶入りセット',power:							4,	price:	9999999999999999999999999});
		
		order=10020;
		Game.NewUpgradeCookie({name:'ショートブレッドビスケット',desc:'このバター豊かなクッキーは短くもないしパンでもない。これだからあの国は!',icon:[23,10],power:						4,price: 99999999999999999999999});
		Game.NewUpgradeCookie({name:'億万長者のショートブレッド',desc:'上から、リッチなクリーミーチョコレート・粘り強いキャラメル・ボロボロのビスケット。階級闘争を鋭く評釈した、示唆に富む三重層。',icon:[24,10],power:						4,price: 99999999999999999999999*5});
		Game.NewUpgradeCookie({name:'キャラメルクッキー',desc:'クッキーを飾るこの多糖類は、暫く歯にくっついて離れないよ、きっと。',icon:[25,10],power:						4,price: 999999999999999999999999});
		
		
		var desc=function(totalHours){
			var hours=totalHours%24;
			var days=Math.floor(totalHours/24);
			var str=hours+(hours==1?'時間':'時間');
			if (days>0) str=days+(days==1?'日':'日')+'と'+str;
			return 'ゲームを閉じている間の低下前のクッキー生産量が2倍長く、計 <b>'+str+'</b> 保つようになる。';
		}
		new Game.Upgrade('ベルフェゴール',desc(2)+'<q>近道と怠惰の悪魔・ベルフェゴールは機械に命令して仕事を肩代わりさせる。</q>',Math.pow(angelPriceFactor,1),[7,11]);Game.last.pool='prestige';Game.last.parents=['超絶の双門'];
		new Game.Upgrade('マモン',desc(4)+'<q>醜き富の化身・マモンは崇拝者に対し血と金の一割を差し出すよう要求する。</q>',Math.pow(angelPriceFactor,2),[8,11]);Game.last.pool='prestige';Game.last.parents=['ベルフェゴール'];
		new Game.Upgrade('アバドン',desc(8)+'<q>暴食の主・アバドンは虫たちを統治し、やつらの欲望を煽り立てる。</q>',Math.pow(angelPriceFactor,3),[9,11]);Game.last.pool='prestige';Game.last.parents=['マモン'];
		new Game.Upgrade('サタン',desc(16)+'<q>あらゆる正しきことの対極に位置するこの悪魔は、欺瞞や誘惑というものがいかに凶悪な感化力を持つのかを体現している。</q>',Math.pow(angelPriceFactor,4),[10,11]);Game.last.pool='prestige';Game.last.parents=['アバドン'];
		new Game.Upgrade('アスモデウス',desc(32)+'<q>3つの怪物の頭を持つこの悪魔は、クッキーとか甘味に対する激烈な欲望を力の源としている。</q>',Math.pow(angelPriceFactor,5),[11,11]);Game.last.pool='prestige';Game.last.parents=['サタン'];
		new Game.Upgrade('ベルゼブブ',desc(64)+'<q>疫病と植物の病害をもたらす腐敗の化身・ベルゼブブは、ペーストリー地獄の巨大な軍隊を支配している。</q>',Math.pow(angelPriceFactor,6),[12,11]);Game.last.pool='prestige';Game.last.parents=['アスモデウス'];
		new Game.Upgrade('ルシファー',desc(128)+'<q>明けの明星としても知られるこの忌々しいプリンスは、大きすぎる自尊心故にベーストリー・ヘヴンから堕落した。</q>',Math.pow(angelPriceFactor,7),[13,11]);Game.last.pool='prestige';Game.last.parents=['ベルゼブブ'];
		
		new Game.Upgrade('ゴールデンクッキー警告音','ゴールデンクッキーが出現したときに音を出すか出さないか選ぶ、<b>ゴールデンクッキーの音選択</b>を開放します。<q>正確にお知らせ。</q>',9999,[28,6]);Game.last.pool='prestige';Game.last.parents=['逃れられぬ運命','ゴールデンスイッチ'];
		
		order=49900;
		new Game.Upgrade('ゴールデンクッキーの音選択','ゴールデンクッキーが出現したときの音を変えましょう。',0,[28,6]);
		Game.last.descFunc=function(){
			var choice=this.choicesFunction()[Game.chimeType];
			return '<div style="text-align:center;">現在 : <div class="icon" style="vertical-align:middle;display:inline-block;'+(choice.icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-choice.icon[0]*48)+'px '+(-choice.icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> <b>'+choice.name+'</b></div><div class="line"></div>'+this.desc;
		};
		
		Game.last.pool='toggle';
		Game.last.choicesFunction=function()
		{
			var choices=[];
			choices[0]={name:'効果音なし',icon:[0,7]};
			choices[1]={name:'チャイム',icon:[22,6]};
			
			choices[Game.chimeType].selected=1;
			return choices;
		}
		Game.last.choicesPick=function(id)
		{Game.chimeType=id;}
		
		
		new Game.Upgrade('壁紙詰め合わせ','ゲームの背景を選べるようになる<b>背景セレクター</b>が解禁される。<br>普通のフレーバーが入っている。<q>ドカーンとクッキーが増えるアップグレードより見た目を優先しろって!俺は今、猛烈に感動している!</q>',99,[29,5]);Game.last.pool='prestige';Game.last.parents=['クラシックデイリーセレクション'];
		
		new Game.Upgrade('遺産','これは最初の天国系アップグレードであり、<b>ヘブンリーチップス</b>のシステムを解禁するものです。<div class="line"></div>昇天するごとに、それまでの人生で作ったクッキーが<b>ヘブンリーチップス</b>と<b>名声</b>に変換されます。<div class="line"></div><b>ヘブンリーチップス</b>は恒久的かつ形而上的なアップグレードを購入するのに使えます。<div class="line"></div><b>名声レベル</b>は、さらに、1レベルにつきCpSに <b>+1%</b> のボーナスを恒久的に加えます。<q>ようこそ。皆で待ってたよ。</q>',1,[21,6]);Game.last.pool='prestige';Game.last.parents=[];
		
		new Game.Upgrade('エルダースパイス','<b>虫を2匹多く</b> 引き付けておけるようになる。<q>君のクッキーがなるであろう香りのクッキー。</q>',444444,[19,8]);Game.last.pool='prestige';Game.last.parents=['不浄の餌'];
		
		new Game.Upgrade('残された幸運','ゴールデンスイッチがオンの時、所持しているゴールデンクッキー関連のアップグレード1つにつきCpSに <b>+11%</b> の追加ボーナスが入る。<q>フレーバー多き所に福来たる…。</q>',99999,[27,6]);Game.last.pool='prestige';Game.last.parents=['ゴールデンスイッチ'];
		
		order=150;new Game.Upgrade('夢の鋼鉄のマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>君はタッチパッドでクリックしているかもしれないが、我々は今やもっと賢くなるべきだ。</q>',5000000000000000000,[11,17]);Game.MakeTiered(Game.last,8,11);
		new Game.Upgrade('不磨のマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>マウスをラットにでもさせるまで鍛え続けるつもりかい?</q>',500000000000000000000,[11,18]);Game.MakeTiered(Game.last,9,11);
		
		
		new Game.Upgrade('万引き','全てのアップグレードが<b>100カーソルにつき 1% 安く</b>なる。<q>反骨精神ってやつよ。</q>',555555,[28,7],function(){Game.upgradesToRebuild=1;});Game.last.pool='prestige';Game.last.parents=['神々しい手袋','アバドン'];
		
		
		order=5000;
		Game.SynergyUpgrade('未来の暦','<q>理想的な植え付け時期を予知できるようにしてあげよう。タイムトラベルで出来ることはどれも非常識なのさ。</q>','農場','タイムマシン','synergy1');
		Game.SynergyUpgrade('雨乞い','<q>複雑なダンスとハイテクの雨雲破壊レーザーを駆使したとても宗教的な儀式。</q>','農場','神殿','synergy2');
		
		Game.SynergyUpgrade('地震魔法','<q>魔法界の名士は、昔から突発的地震を起こすのがお好きだ。</q>','鉱山','魔法使いの塔','synergy1');
		Game.SynergyUpgrade('小惑星掘り','<q><span>19</span>74 年度宇宙連盟大会の決議によって、これ以上彗星や月や有人小惑星を掘削することは法的に不可能になっている。<br>しかし、宇宙ワイロはとても有効だ。</q>','鉱山','宇宙船','synergy2');
		
		Game.SynergyUpgrade('量子エレクトロニクス','<q>機械の状態が「起動」と「停止」のどちらであるかすら確定できなくなる!</q>','工場','反物質凝縮器','synergy1');
		Game.SynergyUpgrade('一時的オーバークロック','<q>着色料定着レーンの速度向上要請にあたって、システムに加速装置を追加導入します。</q>','工場','タイムマシン','synergy2');
		
		Game.SynergyUpgrade('「あちら側」からの契約書','<q>印字が判読可能か確認しろ!</q>','銀行','ポータル','synergy1');
		Game.SynergyUpgrade('印刷機','<q>本物そっくりの偽札を刷れ。印刷に使ったインクに十分見合うだけのものを。</q>','銀行','工場','synergy2');
		
		Game.SynergyUpgrade('邪教徒','<q>崇拝されないままにしておくべき神性も存在する。</q>','神殿','ポータル','synergy1');
		Game.SynergyUpgrade('神の粒子','<q>神は我らが考えていたよりもずっと微小であることが判明した、私の推測だが。</q>','神殿','反物質凝縮器','synergy2');
		
		Game.SynergyUpgrade('謎めいた知識','<q>決して知ろうとしてはならない - 臆測のみ許される - 知識というのもあるのだ。 </q>','魔法使いの塔','錬金術室','synergy1');
		Game.SynergyUpgrade('魔法植物学','<q>すでに一部の保守系新聞で「魔法使いの遺伝子組み換え作物」と報じられている。</q>','魔法使いの塔','農場','synergy2');
		
		Game.SynergyUpgrade('化石燃料','<q>根拠はないがロケットの動力源にはプルトニウムよりこちらのほうが良いだろう。<br>化石と化した超古代文明の燃料から抽出される。</q>','宇宙船','鉱山','synergy1');
		Game.SynergyUpgrade('造船所','<q>ここではこの星一番の輝かしい宇宙船を建造するために、木材加工品と僥倖とアスベスト断熱材とを組み上げている。</q>','宇宙船','工場','synergy2');
		
		Game.SynergyUpgrade('原初の鉱石','<q>地球上で最も甘い蜜の抽出が可能になるのは、最高純度の冶金を実現してからである。</q>','錬金術室','鉱山','synergy1');
		Game.SynergyUpgrade('純金ファンド','<q>金が経済の背骨であるならば、クッキーは経済の股関節であるに違いない。</q>','錬金術室','銀行','synergy2');
		
		Game.SynergyUpgrade('冒涜的な作物','<q>定期的に 火炎 を散布すること。</q>','ポータル','農場','synergy1');
		Game.SynergyUpgrade('おぞましき微光','<q>誰かが、あるいは何かがあなたを背後から見ている。<br>おそらく皆見られている。</q>','ポータル','プリズム','synergy2');
		
		Game.SynergyUpgrade('相対論的パーセク・スキップ航法','<q>凡人は物理的に不可能だと言うだろう。<br>君たちの船には不要な人種だ。</q>','タイムマシン','宇宙船','synergy1');
		Game.SynergyUpgrade('原始の輝き','<q>悠久の時を経ても古代の光は未だに輝いている。これは限りなく純粋だが老年のため相当に脆い。</q>','タイムマシン','プリズム','synergy2');
		
		Game.SynergyUpgrade('特殊物理学基金','<q>資金を所有する粒子加速器に投入する時機だ。</q>','反物質凝縮器','銀行','synergy1');
		Game.SynergyUpgrade('化学の技量','<q>ワクワクするような新しいモノを発見しよう！溶肉剤とか不活性シャンプー副産物 #17 とかカーボン++ とか</q>','反物質凝縮器','錬金術室','synergy2');
		
		Game.SynergyUpgrade('光魔法','<q>(名前に「ライト」が付くからといって)本当に手軽に使ってはならない!いや、私は真剣だ。去年は 178 人の死者を出している。安易に魔法に手を出してはいけない。</q>','プリズム','魔法使いの塔','synergy1');
		Game.SynergyUpgrade('神秘のエネルギー','<q>何かがその光の中から手招きしている。それは暖かく、心地よくて、どうやらいくつかの種類の風変わりな皮膚ガンを引き起こすらしい。</q>','プリズム','神殿','synergy2');
		
		
		new Game.Upgrade('シナジーアップグレード I','<b>2つの施設に同時に</b> 影響する、新たなる段階のシナジーアップグレードが解放される。<br>両施設を <b>15</b> 個ずつもっていることでアップグレードがお店に並ぶ。<q>数に勝る方が勝つ。</q>',222222,[10,20]);Game.last.pool='prestige';Game.last.parents=['サタン','主天使'];
		new Game.Upgrade('シナジーアップグレード II','<b>2つの施設に同時に</b> 影響する、新たなる段階のシナジーアップグレードが解放される。<br>両施設を <b>75</b> 個ずつもっていることでアップグレードがお店に並ぶ。<q>烏合の衆より少数精鋭。</q>',2222222,[10,29]);Game.last.pool='prestige';Game.last.parents=['ベルゼブブ','熾天使','シナジーアップグレード I'];
		
		new Game.Upgrade('天国のクッキー','クッキーの生産量が<b>常に +10%</b> される。<q>ヘブンリーチップスを混ぜて焼いたクッキー。時空を超越した、この世のものとは思えぬ味わい。</q>',3,[25,12]);Game.last.pool='prestige';Game.last.parents=['遺産'];Game.last.power=10;Game.last.pseudoCookie=true;
		new Game.Upgrade('しわっしわのクッキー','クッキーの生産量が<b>常に +10%</b> される。<q>ごく普通のクッキーを、時間も空間も無意味な果てしない永遠が続く場所に放置したら、こうなりましたとさ。</q>',6666666,[26,12]);Game.last.pool='prestige';Game.last.parents=['罰当たりな改変','エルダースパイス'];Game.last.power=10;Game.last.pseudoCookie=true;
		new Game.Upgrade('運気倍増の蒸溜エキス','ゴールデンクッキー(とトナカイなどのスポーンする全てのもの)が<b>1%の確率で2つ同時出現</b>するようになる。<q>きらびやかな風味。空き瓶は素敵な鉛筆ホルダーになるよ。</q>',7777777,[27,12]);Game.last.pool='prestige';Game.last.parents=['神聖なベーカリー','残された幸運'];
		
		order=40000;
		new Game.Upgrade('原因不明の妨害','クッキー生産量が <b>0に</b> なる。<q>症状が改善されない場合は医師にご相談ください。</q>',7,[15,5]);//debug purposes only
		Game.last.pool='debug';
		new Game.Upgrade('グルコースで充満した空気','角砂糖の融合が<b>大変早く</b>なる。<q>あんまり吸い込むと糖尿病になっちゃうよ!</q>',7,[29,16]);//debug purposes only
		Game.last.pool='debug';
		
		order=10300;
		Game.NewUpgradeCookie({name:'ラベンダーチョコレートバタービスケット',desc:'全ての施設を300個所有した報酬です。<br>この捉え難い風味のビスケットは、数十年に渡る極秘研究の成果の象徴です。チョコレートに象られた肖像は、いにしえの菓子焼き道に己の全てを捧げた著名な起業家に酷似しています。',icon:[26,10],power:	10,price: 999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		order=10030;
		Game.NewUpgradeCookie({name:'ロンバルディアクッキー',desc:'まこと良き思い出のある農場からもたらされたクッキー 。',icon:[23,13],require:'ブランドビスケットの箱入りセット',power:												3,	price:	999999999999999999999*5});
		Game.NewUpgradeCookie({name:'バステナーケンクッキー',desc:'美味しいシナモンと氷砂糖で作ったフレンチクッキー。ナッツは入っていないよ!',icon:[24,13],require:'ブランドビスケットの箱入りセット',power:												3,	price:	999999999999999999999*5});
		
		order=10020;
		Game.NewUpgradeCookie({name:'ペカンサンディ',desc:'ナッツをクッキーに突っ刺したものを今日びこう呼ぶ!こいつを名付け直してくれ!何でもいい!',icon:[25,13],power:						4,price: 999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'モラヴィアンスパイスクッキー',desc:'世界的人気のモラヴィアのクッキー。',icon:[26,13],power:						4,price: 9999999999999999999999999});
		Game.NewUpgradeCookie({name:'アンザックビスケット',desc:'メイド・イン・オーストラリアの軍用ビスケット。卵は入ってないけどオーツ麦なら。',icon:[27,13],power:						4,price: 9999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'バターケーキ',desc:'コレステロールで艶々のこいつは果たしてクッキーと言えるのか、それとも只の棒バターなのか。両者の法的定義の境界線をべっとりと跨いでやがる。',icon:[29,13],power:						4,price: 99999999999999999999999999});
		Game.NewUpgradeCookie({name:'アイスクリーム・サンドウィッチ',desc:'とある別の宇宙では、「アイスクリーム・サンドウィッチ」とはベーコン、レタス、トマトをアイスクリーム・コーンに詰めたものを指す。多分トッピングも少々。',icon:[28,13],power:						4,price: 99999999999999999999999999*5});
		
		new Game.Upgrade('天上のハーブ','角砂糖が <b>1時間 早く</b>完全に熟すようになる。<q>天使たちが天国の庭で栽培した、超自然的な甘さの植物。</q>',100000000,[25,15]);Game.last.pool='prestige';Game.last.parents=['しわっしわのクッキー'];
		new Game.Upgrade('悪魔の糖尿病','角砂糖が <b>1時間 早く</b>熟すようになる。<q>魔界の漆黒の深淵の崖に育つと言われる、美味だが悪意のこもったハーブ。</q>',300000000,[26,15]);Game.last.pool='prestige';Game.last.parents=['天上のハーブ','ルシファー'];
		new Game.Upgrade('誰得な人工甘味料','二股の角砂糖が <b>5%</b> より出現しやすくなり、角砂糖を2個取れる確率が <b>5%</b> 上がる。<q>珍しいが用途に困るつまらない風味のベリー。富を持て余した最も熱心なコレクターだけが欲しがる。</q>',1000000000,[27,15]);Game.last.pool='prestige';Game.last.parents=['悪魔の糖尿病'];
		
		//note : these showIf functions stop working beyond 10 quadrillion prestige level, due to loss in precision; the solution, of course, is to make sure 10 quadrillion is not an attainable prestige level
		new Game.Upgrade('ラッキーな桁','名声レベルのCpSへの効果が <b>+1%</b> される。<br>ゴールデンクッキーの効果の時間が <b>+1%</b> される。<br>ゴールデンクッキーの画面に残る時間が <b>+1%</b> される。<q>こいつはちょっと恥ずかしがり屋、名声レベルの下一桁が7の時だけ出現するんだ。</q>',777,[24,15]);Game.last.pool='prestige';Game.last.parents=['素晴らしき幸運'];Game.last.showIf=function(){return (Math.ceil(Game.prestige)%10==7);};
		new Game.Upgrade('ラッキーナンバー','名声レベルのCpSへの効果が <b>+1%</b> される。<br>ゴールデンクッキーの効果の時間が <b>+1%</b> される。<br>ゴールデンクッキーの画面に残る時間が <b>+1%</b> される。<q>こいつは引き籠もりの世捨て人、名声レベルが777で終わる時だけ出現するんだ。</q>',77777,[24,15]);Game.last.pool='prestige';Game.last.parents=['ラッキーな桁','安定した運勢'];Game.last.showIf=function(){return (Math.ceil(Game.prestige)%1000==777);};
		new Game.Upgrade('ラッキーな支払い','名声レベルのCpSへの効果が <b>+1%</b> される。<br>ゴールデンクッキーの効果の時間が <b>+1%</b> される。<br>ゴールデンクッキーの画面に残る時間が <b>+1%</b> される。<q>こいつは自分以外の全てから完全に隔絶すると宣言し、名声レベルが777777で終わる時だけ出現するんだ。</q>',77777777,[24,15]);Game.last.pool='prestige';Game.last.parents=['ラッキーナンバー','逃れられぬ運命'];Game.last.showIf=function(){return (Math.ceil(Game.prestige)%1000000==777777);};
		Game.last.descFunc=function(){return '名声レベルのCpSへの効果が <b>+1%</b> される。<br>ゴールデンクッキーの効果の時間が <b>+1%</b> される。<br>ゴールデンクッキーの画面に残る時間が <b>+1%</b> される。<q>こいつは自分以外の全てから完全に隔絶すると宣言し、名声レベルが777,777で終わる時だけ出現するんだ。</q>';};
		
		order=50000;
		new Game.Upgrade('背景セレクター','表示したい背景を選びましょう。',0,[29,5]);
		Game.last.descFunc=function(){
			var choice=this.choicesFunction()[Game.bgType];
			return '<div style="text-align:center;">現在 : <div class="icon" style="vertical-align:middle;display:inline-block;'+(choice.icon[2]?'background-image:url('+choice.icon[2]+');':'')+'background-position:'+(-choice.icon[0]*48)+'px '+(-choice.icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> <b>'+choice.name+'</b></div><div class="line"></div>'+this.desc;
		};
		
		Game.last.pool='toggle';
		Game.last.choicesFunction=function()
		{
			var choices=[];
			choices[0]={name:'自動',icon:[0,7]};
			choices[1]={name:'青',icon:[21,21]};
			choices[2]={name:'赤',icon:[22,21]};
			choices[3]={name:'白',icon:[23,21]};
			choices[4]={name:'黒',icon:[24,21]};
			choices[5]={name:'金',icon:[25,21]};
			choices[6]={name:'おばあちゃんたち',icon:[26,21]};
			choices[7]={name:'不機嫌なおばあちゃんたち',icon:[27,21]};
			choices[8]={name:'怒ったおばあちゃんたち',icon:[28,21]};
			choices[9]={name:'お金',icon:[29,21]};
			choices[Game.bgType].selected=1;
			return choices;
		}
		Game.last.choicesPick=function(id)
		{Game.bgType=id;}
		
		Game.BGsByChoice={
			0:{pic:'bgBlue'},
			1:{pic:'bgBlue'},
			2:{pic:'bgRed'},
			3:{pic:'bgWhite'},
			4:{pic:'bgBlack'},
			5:{pic:'bgGold'},
			6:{pic:'grandmas1'},
			7:{pic:'grandmas2'},
			8:{pic:'grandmas3'},
			9:{pic:'bgMoney'},
		};
		
		order=255;
		Game.GrandmaSynergy('幸運グランマ','いつでもクッキーをより多く見つけてくれそうな幸運グランマ。','チャンスメーカー');
		
		order=1200;
		new Game.TieredUpgrade('あなたのラッキークッキー','チャンスメーカーが <b>2倍</b> 効率的になる。<q>これは君が今までに焼いた最初のクッキー。深く感傷をそそる価値あるもの、そして今となっては、趣きのある臭いを放つもの。</q>','チャンスメーカー',1);
		new Game.TieredUpgrade('「全てが水の泡になる」魔法のコイン','チャンスメーカーが <b>2倍</b> 効率的になる。<q>弾くと必ず反対側に着地するコイン。表でも裏でも縁でもなく、意図したのと反対側に。</q>','チャンスメーカー',2);
		new Game.TieredUpgrade('抽選勝利チケット','チャンスメーカーが <b>2倍</b> 効率的になる。<q>何のくじだ?宝くじ、これが宝くじというものだ!宝くじだけが重要なんだ!</q>','チャンスメーカー',3);
		new Game.TieredUpgrade('四葉のクローバー畑','チャンスメーカーが <b>2倍</b> 効率的になる。<q>ここには巨大モンスターはいない、ラッキーな草が覆い尽くすだけ。</q>','チャンスメーカー',4);
		new Game.TieredUpgrade('トリックに関する虎の巻','チャンスメーカーが <b>2倍</b> 効率的になる。<q>天秤をこっちに傾けちゃおうぜ、この28の独創的で新しいイカサマ術で。</q>','チャンスメーカー',5);
		new Game.TieredUpgrade('レプラコーンの村','チャンスメーカーが <b>2倍</b> 効率的になる。<q>君は遂に地元のレプラコーン達に認められた。彼らは友情の証として、君に神話的な豪運を分けてくれるだろう(ついでにかなり不味いお茶も)。</q>','チャンスメーカー',6);
		new Game.TieredUpgrade('不可能性駆動装置','チャンスメーカーが <b>2倍</b> 効率的になる。<q>内部で統計を勝手に弄るへんてこな装置。グランマのベーカリーガイドからの推薦。 </q>','チャンスメーカー',7);
		new Game.TieredUpgrade('反迷信学','チャンスメーカーが <b>2倍</b> 効率的になる。<q>不運を幸運に変える、刺激的で画期的な研究分野。割れない鏡なぞ無い、誰も下を通らぬ梯子も無い!</q>','チャンスメーカー',8);
		
		order=5000;
		Game.SynergyUpgrade('宝石の護符','<q>古代の至極希少な結晶体で覆われた、幸運のお守り。面接を受ける際の必需品。</q>','チャンスメーカー','鉱山','synergy1');
		
		order=20000;
		new Game.Upgrade('相談役猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>過分なコンサル料に喜びもひとしおです、ご主人様</q>',900000000000000000000000000000000,Game.GetIcon('Kitten',9));Game.last.kitten=1;Game.MakeTiered(Game.last,9,18);
		
		order=99999;
		var years=Math.floor((Date.now()-new Date(2013,7,8))/(1000*60*60*24*365));
		//only updates on page load
		//may behave strangely on leap years
		Game.NewUpgradeCookie({name:'バースデークッキー',desc:'-',icon:[22,13],power:years,price:99999999999999999999999999999});Game.last.baseDesc='CookieClickerが1年続くごとに、クッキーの生産量が <b>+1%</b> される(現在 : <b>+'+Beautify(years)+'%</b>)。<q>CookieClickerで遊んでくれてありがとう!<br>- Orteil</q>';Game.last.desc=BeautifyInText(Game.last.baseDesc);
		
		
		order=150;new Game.Upgrade('軍用ミスリル製マウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>53人が囲んで押して何とか動き、48人が一斉にボタンに飛び降り漸くクリック。言わば、それくらい重くて骨が折れる。</q>',50000000000000000000000,[11,19]);Game.MakeTiered(Game.last,10,11);
		
		order=200;new Game.TieredUpgrade('逆認知症','グランマが <b>2倍</b> 効率的になる。<q>すごく不安で、何だかいつもより調子悪い。</q>','グランマ',9);
		order=300;new Game.TieredUpgrade('人道的農薬','農場が <b>2倍</b> 効率的になる。<q>人民によって、人民のために、人民から作られた殺虫剤。いつ何時でも正義の灼熱痛をお見舞いしてやれるのさ、それを受けるに相応しい忌々しい虫けら共に。</q>','農場',9);
		order=400;new Game.TieredUpgrade('モグラ人間','鉱山が <b>2倍</b> 効率的になる。<q>紛れもない君の研究所で、本物の人間から造られた、タフな小人。お高い機械をお釈迦にするような過酷な環境下でも、最高品質の食用鉱物を堀り当てる技能持ち。</q>','鉱山',9);
		order=500;new Game.TieredUpgrade('機械学習','工場が <b>2倍</b> 効率的になる。<q>労働者に機械の取り扱い方を習得するよう指示した方が、生産性が上がるかもしれないって思ってる？　それ大して意味ない……こともあるよ、偶に…</q>','工場',9);
		order=525;new Game.TieredUpgrade('食用貨幣','銀行が <b>2倍</b> 効率的になる。<q>実に単純明快。あらゆる貨幣を絶対食べたくなるほど美味にしてバラ撒き、世界中の飢餓とインフレ問題を一挙に解決！</q>','銀行',9);
		order=550;new Game.TieredUpgrade('見たことねぇラップ祈祷','神殿が <b>2倍</b> 効率的になる。<q>超ヤバいビートと激ヤバいライムのヒップな宗教曲は「教会にしてはマジやばくね?」と若者のハートをしっかりキャッチ!続々と信徒席に詰めかけ祈りを捧げる B-Boys & B-Girls …なんたる不敬!</q>','神殿',9);
		order=575;new Game.TieredUpgrade('贅沢仕立ての杖','魔法使いの塔が <b>2倍</b> 効率的になる。<q>この科学の時代、熟練の杖職人は今や遠い過去のものとなった。だが幸いなことに、彼ら職人が全く消えてしまった訳ではない。</q>','魔法使いの塔',9);
		order=600;new Game.TieredUpgrade('自動操縦','宇宙船が <b>2倍</b> 効率的になる。<q>完全ロボット化の乗組員が配備された君の宇宙船!船が宇宙で迷子になっても遺族補償を払わずに済むそれだけで、驚きの超節約。</q>','宇宙船',9);
		order=700;new Game.TieredUpgrade('化学の到来','錬金術室が <b>2倍</b> 効率的になる。<q>あのさぁ…聞いて?錬金術は何もかも出鱈目だったんだよ、それこそ全くもって根拠の無いゴミカスだったんだよ…。あんまりじゃないか、なぁ神様?</q>','錬金術室',9);
		order=800;new Game.TieredUpgrade('現実世界','ポータルが <b>2倍</b> 効率的になる。<q>我らが宇宙は、より正気度の高い別の現実世界の次元が捩れたものであると判明した。いざ立て飛び越えよ、場所を奪う時ぞ!</q>','ポータル',9);
		order=900;new Game.TieredUpgrade('第二の秒','タイムマシンが <b>2倍</b> 効率的になる。<q>同じ時間内なのに 2 倍の秒数が流れてる!なんで!どして!わけわからん!</q>','タイムマシン',9);
		order=1000;new Game.TieredUpgrade('量子櫛','反物質凝縮器が <b>2倍</b> 効率的になる。<q>量子もつれとは、説明するのが実に億劫で、正直これさえ無ければどんだけ好都合かという現象の一つです。そして、それが遂に叶った!このもつれを梳かす量子櫛のお陰で!</q>','反物質凝縮器',9);
		order=1100;new Game.TieredUpgrade('水晶の鏡','プリズムが <b>2倍</b> 効率的になる。<q>より多くの光がプリズムに反射するよう設計され、実際の想定以上の、有り得ないレベルの明るさに達した。</q>','プリズム',9);
		order=1200;new Game.TieredUpgrade('うさぎの足','チャンスメーカーが <b>2倍</b> 効率的になる。<q>君は随分と沢山の兎を飼っているんだね。幸運のお守りの元が何百本も、そこら中でピョンピョンしてる。いざという時、大変役に立つ(大変不穏ではあるけれど)いいペットじゃないか。</q>','チャンスメーカー',9);
		
		order=20000;
		new Game.Upgrade('地区担当責任者補佐猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>にゃーんもストレスはありませんにゃ…私めの「部下」の承認を得ようとすること以外は、ご主人様</q>',900000000000000000000000000000000000,Game.GetIcon('Kitten',10));Game.last.kitten=1;Game.MakeTiered(Game.last,10,18);
		
		order=5000;
		Game.SynergyUpgrade('チャームクォーク','<q>みなが追い求めるラッキークォーク!</q>','チャンスメーカー','反物質凝縮器','synergy2');
		
		
		order=10020;
		Game.NewUpgradeCookie({name:'ピンクビスケット',desc:'最古のクッキーの一つ。シャンパンに浸し柔らかくして頂くのが伝統。フランス人はしょっちゅう飲んでるからね。',icon:[21,16],power:						4,price: 999999999999999999999999999});
		Game.NewUpgradeCookie({name:'全粒紛クッキー',desc:'種子や粉屑みたいなものに覆われている。マジ『5秒ルール』適用したくなる見た目。',icon:[22,16],power:						4,price: 999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'飴入りクッキー',desc:'手に取るとちょっと溶けちゃう。',icon:[23,16],power:						4,price: 9999999999999999999999999999});
		Game.NewUpgradeCookie({name:'チョコチャンククッキー',desc:'チョコチップの大きさに平伏してしまいそう。圧倒的塊がゴロゴロ。',icon:[24,16],power:						4,price: 9999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'ちょっとチップクッキー ',desc:'ポチっとだけ。',icon:[25,16],power:						1,price: 99999999999999999999999999999});
		
		
		new Game.Upgrade('甘々ベーキング','未使用の角砂糖1つにつきCpSが <b>+1%</b> される(上限100個)。<div class="warning">メモ : このアップグレードにより角砂糖を使用時に、角砂糖が成長して元の数に戻るまでCpSが下がります。</div><q>永きにわたり砂糖の真髄を以ってクッキーを焼くには、先ずは時間をたっぷり無駄にする事から覚えるべし。</q>',200000000,[21,17]);Game.last.pool='prestige';Game.last.parents=['天上のハーブ'];
		new Game.Upgrade('砂糖の亡者','転生1回につき一度、 角砂糖 <b>1個</b> を消費することで、1時間CpSが <b>3倍</b>になる「砂糖フィーバー」スイッチが解禁される。<q>これは小さな抵抗さ、只で美味しい思いなんてさせないよ。</q>',400000000,[22,17]);Game.last.pool='prestige';Game.last.parents=['甘々ベーキング'];
		new Game.Upgrade('砂糖の完熟促進処理','角砂糖の成長がグランマ1人につき(最大600人) <b>6秒</b> 早くなる。<q>あいつら全く甘やかし過ぎじゃない？</q>',600000000,[23,17]);Game.last.pool='prestige';Game.last.parents=['砂糖の亡者','悪魔の糖尿病'];
		
		order=40050;
		new Game.Upgrade('砂糖フィーバー','角砂糖 <b>1個</b> を消費して有効化することで、1時間 <b>CpSが3倍</b> になる、<br>転生1回につき、1回しか使うことができない。',0,[22,17]);
		Game.last.priceLumps=1;
		Game.last.pool='toggle';Game.last.toggleInto=0;
		Game.last.canBuyFunc=function(){return Game.lumps>=1;};
		Game.last.clickFunction=Game.spendLump(1,'砂糖フィーバーを有効化します',function()
		{
			Game.Upgrades['砂糖フィーバー'].buy(1);
			buff=Game.gainBuff('sugar frenzy',60*60,3);
			if (Game.prefs.popups) Game.Popup('砂糖フィーバー発動!');
			else Game.Notify('砂糖フィーバー!','1時間CpSが3倍に!',[29,14]);
		});
		
		order=10020;
		Game.NewUpgradeCookie({name:'スプリンクルクッキー',desc:'どんなに平々凡々で味気ないクッキーだったとしても、ちょいとカラフルにデコってしまえば気付かれない。',icon:[21,14],power:						4,price: 99999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'ピーナッツバターブロッサム',desc:'トッピングはすっごく美味しいチョコの噴出物…まぁ、それについて言明するのは断固ナシで。',icon:[22,14],power:						4,price: 999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'ノーベイククッキー',desc:'オーブン要らずの謎クッキー。どうやって作るのか、どうして形を保ってるのか皆目解らない。たぶん象にも負けない強力接着剤か冷蔵庫で固めたか。',icon:[21,15],power:						4,price: 999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'フロランタン',desc:'少なくともチョコを主役に引き立てていた点で、辛うじてクッキーと呼べるナッツのキャラメル固め。',icon:[26,16],power:						4,price: 9999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'チョコレートクリンクル',desc:'日々の生活で味わう美味しさに感謝し称える、宗教とは無関係のクッキー。勿論クリスマスやその他の無意味な行事なんて論外。',icon:[22,15],power:						4,price: 9999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'メープルクッキー',desc:'実績に応じて画面下に勝手に溜まるんじゃなく、袋詰めされているお国の樹液で作られたもの。',icon:[21,13],power:						4,price: 99999999999999999999999999999999});
		
		
		order=40000;
		new Game.Upgrade('成長加速培養土','作物が毎秒成長する。<br>作物が植え放題になる。<br>いつでも土壌を切り替えられるようになる。<q>だって電解質入りだし！</q>',7,[2,16]);//debug purposes only
		Game.last.buyFunction=function(){if (Game.Objects['農場'].minigameLoaded){Game.Objects['農場'].minigame.computeStepT();}}
		Game.last.pool='debug';
		
		order=150;
		new Game.Upgrade('ハイテク黒曜石マウス ','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>洗練されたデザインの、高度先進技術を駆使したマウス。そのこだわりは、ただ一つ : クリックの為。</q>',5000000000000000000000000,[11,28]);Game.MakeTiered(Game.last,11,11);
		new Game.Upgrade('プラズマ大理石マウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>視界の隅がブレてぼやけてくるこのマウスは、ほんのそよ風が掠めただけでクリックの嵐を巻き起こす。</q>',500000000000000000000000000,[11,30]);Game.MakeTiered(Game.last,12,11);
		
		order=20000;
		new Game.Upgrade('市場商猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>飽和した子猫市場なんてにゃいのです、ご主人様</q>',900000000000000000000000000000000000000,Game.GetIcon('Kitten',11));Game.last.kitten=1;Game.MakeTiered(Game.last,11,18);
		
		order=10030;
		Game.NewUpgradeCookie({name:'お祝いドーナツクッキー',desc:'このケバケバしいビスケットは子供の誕生日パーティーに、或いは、奇人変人で酔狂な億万長者の葬式にピッタリ。',icon:[25,17],require:'ブランドビスケットの箱入りセット',power:												2,	price:	999999999999999999999999*5});
		
		order=10020;
		Game.NewUpgradeCookie({name:'ペルシャの米粉クッキー ',desc:'バター不使用の小さなクッキー、隠し味はバラの蒸留水とケシの実。',icon:[28,15],power:						4,price: 99999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'ノルウェーのクッキー ',desc:'薄っぺらなバタークッキーに、砂糖漬けチェリーの欠片が一粒だけちょこんと。スカンジナビア人の実存主義の寒々しさを例えているのだとか。',icon:[22,20],power:						4,price: 999999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'クリスピーライスクッキー ',desc:'おうちで楽しく手作り！ 市販のクッキーは時代遅れ！ 市場体制を転覆せよ！ そいつはマシュマロ入りだ！ 打倒資本主義！',icon:[23,20],power:						4,price: 999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'ウベクッキー ',desc:'この色合いは原材料の紫ヤム芋に由来。色彩象徴によると、このクッキーは貴人、聖人、或いは極悪人のいずれかに該当する。',icon:[24,17],power:						4,price: 9999999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'バタースコッチクッキー',desc:'バタースコッチチップが丁度いい感じに粘っこくて、飴を食べてる気分になってくるよ。',icon:[24,20],power:						4,price: 9999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'スペキュラース',desc:'ザクザクの食感と、げんなりする程シナモンが効いたこのクッキーは、オランダ人の誇りの源。名前の起源に関しては、すべ足らず推測しかできない。',icon:[21,20],power:						4,price: 99999999999999999999999999999999999});
		
		order=10200;
		Game.NewUpgradeCookie({name:'エルダーワートビスケット',desc:'-',icon:[22,25],power:2,price:60*2,locked:1});Game.last.baseDesc='クッキーの生産量が <b>+2%</b> される。<br>グランマのCpSが <b>+2%</b> される。<br>エルダーワートからドロップする。<q>焼き立てだというのに、信じられない味がする。</q>';
		Game.NewUpgradeCookie({name:'ベイクベリークッキー',desc:'-',icon:[23,25],power:2,price:60,locked:1});Game.last.baseDesc='クッキーの生産量が <b>+2%</b> される。<br>ベイクベリーからドロップする。<q>ホットチョコレートに浸すと実に美味しい。</q>';
		Game.NewUpgradeCookie({name:'公爵芋クッキー',desc:'-',icon:[24,25],power:10,price:60*3,locked:1});Game.last.baseDesc='クッキーの生産量が <b>+10%</b> される。<br>公爵芋からドロップする。<q>香り良くて粉っぽく、僅かに卵黄の後味がする。</q>';
		Game.NewUpgradeCookie({name:'緑色酵母のダイジェスティブビスケット',desc:'-',icon:[25,25],power:0,price:60*3,locked:1});Game.last.baseDesc='ゴールデンクッキーの入手クッキーと効果持続時間が <b>+1%</b> される。<br>ゴールデンクッキーの出現頻度が <b>+1%</b> される。<br>アイテムのドロップ率が <b>+3%</b> される。<br>グリーンロットからドロップする。<q>思ったよりはイケるが、そう大したことはない。</q>';
		
		order=23000;
		new Game.Upgrade('寝落ちシダ茶','ゲームを閉じている間のCpSが <b>+3%</b> される<small>(天国系アップグレードの超絶の双門を所有しているならば)</small>。<br>寝落ちシダからドロップする。<q>化学的に複雑な天然飲料。リラックス効果のある調合茶は、数学者達が睡眠中に方程式を解くのに使われてきた。</q>',60,[26,25]);
		new Game.Upgrade('ホテイアマイのシロップ','ゲームを閉じている間のCpSが <b>+7%</b> される<small>(天国系アップグレードの超絶の双門を所有しているならば)</small>。<br>角砂糖が <b>7分</b> 早く熟す。<br>ホテイアマイからドロップする。<q>キャンディーに似た味わい。臭いはまた別物。</q>',60*2,[27,25]);
		
		order=10200;
		Game.NewUpgradeCookie({name:'小麦のうすうすクラッカー',desc:'-',icon:[28,25],power:1,price:30,locked:1});Game.last.baseDesc='クッキーの生産量が <b>+1%</b> される。<br>ベーカー御用達小麦からドロップする。<q>こいつをクッキー扱いするワケは、なんだか少し不憫だから。他に特に理由はない。</q>';
		
		var gardenDrops=['エルダーワートビスケット','ベイクベリークッキー','公爵芋クッキー','緑色酵母のダイジェスティブビスケット','寝落ちシダ茶','ホテイアマイのシロップ','小麦のうすうすクラッカー'];
		for (var i in gardenDrops)//scale by CpS
		{
			var it=Game.Upgrades[gardenDrops[i]];
			it.priceFunc=function(cost){return function(){return cost*Game.cookiesPs*60;}}(it.basePrice);
			it.baseDesc=it.baseDesc.replace('<q>','<br>CpSによって価格が変動します。<q>');
			it.desc=BeautifyInText(it.baseDesc);
			it.lasting=true;
		}
		
		
		order=10300;
		Game.NewUpgradeCookie({name:'合成チョコレート翠緑蜂蜜バタービスケット',desc:'全ての施設を350個所有した報酬です。<br>このバタービスケットの製法は、かつては、とある古い山上修道院だけに伝わる門外不出の遺産でした。その味はこの上なく上品で、完全な無味無臭に特別に設計加工されたラボ製の板チョコレートでなければ、この完璧なフレーバーの再現は不可能でしょう。<br>更に、このビスケットにはあなたの顔が彫ってあります。',icon:[24,26],power:	10,price: 999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'ロイヤルラズベリーチョコレートバタービスケット',desc:'全ての施設を400個所有した報酬です。<br>かつては誇大妄想狂の権力者にだけ提供されていた、このフルーティチョコレート独自の特性として、他には全く無い風味と舌触りがあります。その法外な価値が、チョコレートの表面に描かれたあなたの肖像画によって上がるのか下がるのか…今はまだ不明です。',icon:[25,26],power:	10,price: 999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'超凝縮高エネルギーチョコレートバタービスケット',desc:'全ての施設を450個所有した報酬です。<br>水素爆弾2、3発分のパワーを、この一枚に注ぎ込みました。原子力技術者および株主ほぼ全員を困惑させた経緯を通じつつも。目下、国際会議の中心でかなり白熱した論議が展開中です。このチョコレートに関し更に説明しようものなら、幾つかの国家の機密に抵触する恐れがあります。しかし、一つだけ加えるなら、それには誰かの肖像が描かれているようです。恐らくは、あなたの?',icon:[26,26],power:	10,price: 999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		
		
		order=200;new Game.TieredUpgrade('色落ち防止ヘアカラー','グランマが <b>2倍</b> 効率的になる。<q>あいつらなんでいっつも変テコなモコモコピンクの髪型にすんの?あいつらは綿菓子の回し者なの?</q>','グランマ',10);
		order=300;new Game.TieredUpgrade('バーンスター','農場が <b>2倍</b> 効率的になる。<q>あー、うん。とっても役に立つんだよ。なぜか。 </q>','農場',10);
		order=400;new Game.TieredUpgrade('坑道のカナリア','鉱山が <b>2倍</b> 効率的になる。<q>ゾッとする事には使わないって!地下で働く坑夫達の癒しに1、2 羽持ち込んでいるだけだってば。</q>','鉱山',10);
		order=500;new Game.TieredUpgrade('ブラウニーポイント制度','工場が <b>2倍</b> 効率的になる。<q>あら、素敵!時間外労働とか同僚を密告とか、良き行いをした工場従業員にご褒美を与えられるよ。58ブラウニーポイントでブラウニー1個が写った小さな写真をゲット、それを178枚集めればブラウニー現物を好きなだけゲット!子供扱い?そうかもね。悪ノリだらけ?そりゃ勿論!</q>','工場',10);
		order=525;new Game.TieredUpgrade('グランド・スーパーサイクル','銀行が <b>2倍</b> 効率的になる。<q>一般大衆には難解な金融用語と思わせているが、実のところ、我らが行員に業績褒賞として高級自転車を与えているだけである。至極当然な話だが、彼等に豪勢な金のスイミングプールを建ててやれば、そこで一浴びしコンドラチェフの波に乗るだろう。</q>','銀行',10);
		order=550;new Game.TieredUpgrade('詩篇の朗読','神殿が <b>2倍</b> 効率的になる。<q>神学的には疑わしい、恐らくは占術と聖書研究の冒涜的な混成物。</q>','神殿',10);
		order=575;new Game.TieredUpgrade('不動如山の呪文詠唱','魔法使いの塔が <b>2倍</b> 効率的になる。<q>このスキルを習得した魔術師は、跳んだり跳ねたりする事も呪文を紡げず挙動不審になる事もなく、詠唱が可能になる。それは大層卑劣な行いであると同時に、ぶっちゃけかなりの救済措置である。</q>','魔法使いの塔',10);
		order=600;new Game.TieredUpgrade('宇宙の果てのレストラン','宇宙船が <b>2倍</b> 効率的になる。<q>宇宙は空間的に無限で、無数の果てを持つと解釈可能であることから、宇宙トラックドライバーが休憩と軽食(クッキーをベースにした自社ブランド製)を取れる無数のレストランチェーン店を君はオープンした。</q>','宇宙船',10);
		order=700;new Game.TieredUpgrade('考え直した結果','錬金術室が <b>2倍</b> 効率的になる。<q>この前のアップグレードは無視してくれ、錬金術はやっぱり最高だ!まさに今、頭でっかちのハゲ共が子供達の悪夢をレアメタルに変換する方法を発見しやがった!</q>','錬金術室',10);
		order=800;new Game.TieredUpgrade('異次元ゴミ投棄場','ポータルが <b>2倍</b> 効率的になる。<q>我々は、焼成開始以来積もり積もった全廃棄物 - 焦げたクッキー、実験の失敗作、反抗的な労働者など - を処分する場を探し求めてきた。そこで、今までのように後進国に売りつけるのではないやり方を計画し、誰の迷惑にもならぬ何処か代わりのゴミ次元に投棄するだけで済むようになった!多分ね!</q>','ポータル',10);
		order=900;new Game.TieredUpgrade('増設用時計の手','タイムマシンが <b>2倍</b> 効率的になる。<q>当初は馬鹿げたアイデアのように思えたが、好奇心くすぐる斬新な方法で時を歪ませる、珍妙な能力をを持つことが判明した。</q>','タイムマシン',10);
		order=1000;new Game.TieredUpgrade('ベーキングノーベル賞','反物質凝縮器が <b>2倍</b> 効率的になる。<q>科学的発展を助長する為の最善の方法、無意味な賞で媚びた理系オタクを釣るより遥かに効果的!その上、各賞受賞者は、君(又は誰か)の元で従事する旨の但し書き付き終身独占契約書が貰えます!</q>','反物質凝縮器',10);
		order=1100;new Game.TieredUpgrade('逆光理論','プリズムが <b>2倍</b> 効率的になる。<q>反光子の存在が確定し、光とは単に陰影の中の間隙であると仮定された瞬間、全く新しい物理学の世界が開けた。</q>','プリズム',10);
		order=1200;new Game.TieredUpgrade('改定確率論','チャンスメーカーが <b>2倍</b> 効率的になる。<q>何かが起こる、或いは起こらない。その確率は 50%!数多の起こりそうもない事象を、これは唐突に高確率で可能にしてしまう。</q>','チャンスメーカー',10);
		
		order=20000;
		new Game.Upgrade('分析者猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>現ニャいの投資収益率パニャーンに基づくと、借りた猫の手もとい働き手へニク給をファーッと払える余裕が生まれるのは大体来世紀頃ににゃりそうです、ご主人様</q>',900000000000000000000000000000000000000000,Game.GetIcon('Kitten',12));Game.last.kitten=1;Game.MakeTiered(Game.last,12,18);
		
		
		new Game.Upgrade('アイ・オブ・ザ・リンクラー','虫にマウスを乗せることで腹に溜め込んだクッキーがどれくらいか表示される。<q>虫が一匹、生き残ってやるという意志と共にそこにある。<br>しぶとく喰いつけ、貪欲にいけ。 </q>',99999999,[27,26]);Game.last.pool='prestige';Game.last.parents=['しわっしわのクッキー'];
		
		new Game.Upgrade('思いつきで作ったチェックリスト','<b>全買い</b>の機能を解禁し、お店でアップグレードの即時一括購入できるようになる(安い順に)。<br>また、<b>保管庫</b>も解禁され、自動購入されたくないアップグレードが並べられるお店の一部となる。<q>お洒落なグランマのアクセサリー?はいチェック。超越次元の忌まわしきもの?はいチェック。なーんとなく卵いろいろ?はいチェック。「ピーン」って鳴る機械?はいどんどんチェック。 </q>',900000,[28,26]);Game.last.pool='prestige';Game.last.parents=['消せない記憶','アップグレードスロット II'];
		
		order=10300;
		Game.NewUpgradeCookie({name:'純然たる漆黒のチョコレートバタービスケット',desc:'全ての施設を500個所有した報酬です。<br>このチョコレートは高純度で瑕疵一つすら無い為、それ自身は色を持たないものの、代わりに周辺物の外観を何でも映し込んでしまいます。表面が完璧なまでに滑らか(ピコメートル単位)なので、あなたは自身の肖像の刻印が無いと気付き、些か驚きました - が、程なく自分の顔が寸分違わず鏡の如く反映されているのを深く理解するでしょう。 ',icon:[24,27],power:	10,price: 999999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		order=10020;
		Game.NewUpgradeCookie({name:'チョコレートオートミールクッキー',desc:'このワイルドでマッシブなクッキーは、デコボコと纏まりの悪い不格好な見た目を、素朴な美味しさ一本でカバーしている。我々が皆、志すべきものだ。',icon:[23,28],power:						4,price: 99999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'モラセスクッキー',desc:'べとつき、ひび割れ、精製糖が振りかけてある。<br>これをジャガイモで作って食べる変人が一定数いることが知られている。',icon:[24,28],power:						4,price: 999999999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'ビスコッティ',desc:'この非常に堅固な棍棒状クッキーで誰かを殴りつけるより、これを食べてみたいと僅かでも思うなら、それはアーモンドとピスタチオのお陰だ。',icon:[22,28],power:						4,price: 999999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'ワッフルクッキー',desc:'ワッフルに似たインパクトある見た目のクッキーだろうが、単に一般的クッキーサイズのワッフルだろうが、ここで討論は受け付けない。',icon:[21,28],power:						4,price: 9999999999999999999999999999999999999});
		
		
		order=10000;
		//early cookies that unlock at the same time as coconut cookies; meant to boost early game a little bit
		Game.NewUpgradeCookie({name:'アーモンドクッキー',desc:'時々食べたくなったり。時々そうでもなかったり。',icon:[21,27],power:							2,	price:	99999999});
		Game.NewUpgradeCookie({name:'ヘーゼルナッツクッキー',desc:'早朝の散策で、蚊柱の無い、緑の香気溢れる森の中を通り抜けた時のような風味。',icon:[22,27],power:							2,	price:	99999999});
		Game.NewUpgradeCookie({name:'胡桃クッキー',desc:'一部の専門家は、胡桃が知覚を持つ徴候として、人間の脳との不気味な類似性があることを指摘してきた - その説には大多数の胡桃が猛反発している。',icon:[23,27],power:							2,	price:	99999999});
		
		
		new Game.Upgrade('ラベルプリンター','マウスを乗せるとアップグレードのグレードが判るようになる。<br><small>メモ : 一部のアップグレードに限り階級があります。階級は単に演出的な体裁であり、プレイに何の効果も与えません。</small><q>とんじるを伝えたい(ぶたじるは除く)時にも、とても重宝。</q>',999999,[28,29]);Game.last.pool='prestige';Game.last.parents=['スターターキッチン'];
		
		
		
		
		order=200;new Game.TieredUpgrade('エチケット','グランマが <b>2倍</b> 効率的になる。<q>意固地なお婆様方と仲良くなりたかったら、彼女らの珍妙で古風なマナーを億劫がらずに学ぶことだ。「どうぞ奥様」「ありがとう奥様」と言ったり、目を剥いて太陽を凝視しつつ、声を潜めて不気味な呪文を呟くような事をね。</q>','グランマ',11);
		order=300;new Game.TieredUpgrade('リントヴルム','農場が <b>2倍</b> 効率的になる。<q>遙か北から運び込む必要はあるが、土の通気性をとっても良くしてくれる!</q>','農場',11);
		order=400;new Game.TieredUpgrade('うんざりする掘り直し','鉱山が <b>2倍</b> 効率的になる。<q>長い長い大量の沈殿物抽出作業の後、君は積もり積もった岩石と泥で正真正銘本物の山々を作り上げた。さて、何か面白いものが見つかるか、掘り起こそうじゃないか!</q>','鉱山',11);
		order=500;new Game.TieredUpgrade('「ボランティア」のインターン','工場が <b>2倍</b> 効率的になる。<q>何か不得手な作業があれば、彼等がいつでもタダでやってくれる。</q>','工場',11);
		order=525;new Game.TieredUpgrade('金儲けの秘訣','銀行が <b>2倍</b> 効率的になる。<q>第387訓 : 焼かれたクッキーとは即ち預けられたクッキーである。</q>','銀行',11);
		order=550;new Game.TieredUpgrade('神々の戦争','神殿が <b>2倍</b> 効率的になる。<q>面白いゲーム。唯一の必勝法は、祈らないこと。</q>','神殿',11);
		order=575;new Game.TieredUpgrade('電気','魔法使いの塔が <b>2倍</b> 効率的になる。<q>古代魔術と禁忌の魔女が隠匿した不可解な知識、その計り知れない力は奇しくも闇を光に換え、象をショック死させる。</q>','魔法使いの塔',11);
		order=600;new Game.TieredUpgrade('共通言語','宇宙船が <b>2倍</b> 効率的になる。<q>なんとか君は銀河系内の汎ゆる知的種族に通用する言語一覧表を作り上げた。収録語数は大興奮モノの56兆、発音は頻発するゲップに似て文章構成がややこしい。因みに文章は大体「クッキー寄こさんと痛い目見んぞコラ」な感じに翻訳される。</q>','宇宙船',11);
		order=700;new Game.TieredUpgrade('市民意識の改善','錬金術室が <b>2倍</b> 効率的になる。<q>無益な物をクッキーに、クッキーを更に美味いクッキーに変換する事に、我々はもう拘るべきでは無いのだ。クッキーを食する人々を、クッキーに深い理解と感謝と敬意を抱きながら食する人々に変換する事、これぞまさに新時代のやり方だ。そら、タンクの中へ入れ!</q>','錬金術室',11);
		order=800;new Game.TieredUpgrade('埋め込み式極小ポータル','ポータルが <b>2倍</b> 効率的になる。<q>ポータルをクッキー自体に焼き込むと、我々人類の味蕾をそのままそっくりクッキー次元の味覚に送れることが判明した!こないだ君の弁護士軍団に食品医薬品局を潰させといて、ほんと良かったね!</q>','ポータル',11);
		order=900;new Game.TieredUpgrade('追憶','タイムマシンが <b>2倍</b> 効率的になる。<q>タイムマシン技術者達の強い主張によると、この気持ちは人類共通の既存の感情ではなく、高度で革新的なタイムトラベル技術の一種だそうだ。何れにせよ、古き良き時代への郷愁を誘う効果を理由に当時の状態そのままの古いクッキーを売るやり方は、面白く期待が持てると認めるべきかな。</q>','タイムマシン',11);
		order=1000;new Game.TieredUpgrade('明確な構造の分子','反物質凝縮器が <b>2倍</b> 効率的になる。<q>科学者達は1個の単一連続分子にクッキーを詰め込む方法を発見した。貯蔵と味の両方に心躍る新たな展望を開くものだ。消化吸収に丸1年も要する事実はさておき。</q>','反物質凝縮器',11);
		order=1100;new Game.TieredUpgrade('光の調達方法','プリズムが <b>2倍</b> 効率的になる。<q>光からのクッキー変換が一層進んだ結果、宇宙は常にほんの少しずつ薄暗くなっていった。そこで君はプリズム用の新たな未知の光源を探すことにした。例えば、妊娠中の女性が放つ暖かで幸福感に満ちた光、或いは希望に溢れた子供の眼の輝き。</q>','プリズム',11);
		order=1200;new Game.TieredUpgrade('0面サイコロ','チャンスメーカーが <b>2倍</b> 効率的になる。<q>0面サイコロの到来は賭博界隈に予測不能の大波乱を巻き起こし、君は世界中の専門家達から「まさにバカと天才の表裏一体」と呼ばれたとさ。</q>','チャンスメーカー',11);
		
		
		new Game.Upgrade('紋章官','貴君に<b>紋章官</b>による強化の恩恵を授ける。<br>各紋章官は <b>CpS+1%</b> を貴君に供与する。<br>頭上の紫紺の旗を見よ、伺候する紋章官の数を確認できるであろう。 <q>互いに最高であれ。<br>パトレイオン、万歳！</q>',100,[21,29]);Game.last.pool='prestige';
		
		order=255;
		Game.GrandmaSynergy('メタグランマ','クッキーをもっと作るためにグランマをもっと生み出すフラクタルグランマ。','自己無限生成エンジン');
		
		order=1300;
		new Game.TieredUpgrade('メタなベーカリー','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>実際、己自身を焼成するよ!</q>','自己無限生成エンジン',1);
		new Game.TieredUpgrade('マンデルブランシュウガー','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>フラクタルな甘味や一触即死性などの有用な特性を示す物質。 </q>','自己無限生成エンジン',2);
		new Game.TieredUpgrade('自己相似事実','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>無限に反復される事実が判明した : やっぱり、碌でもないアイデアだった。</q>','自己無限生成エンジン',3);
		new Game.TieredUpgrade('入れ子型の宇宙説','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>亜原子粒子にはそれぞれに新生宇宙が丸ごと宿っており、それ故にクッキーの量は無限であると言明している。<br>この説はどこかナノ宇宙学の理論に重なるものがある。だって物理学だし。</q>','自己無限生成エンジン',4);
		new Game.TieredUpgrade('メンガーのスポンジケーキ','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>表面積が実質無限であるため甚だしい吸水性を持つ。乾燥した部屋に隔離して保管すること、決して開いた傷口に触れさせないこと、何があろうと水域では接水させないこと。 </q>','自己無限生成エンジン',5);
		new Game.TieredUpgrade('とある最高に陽気な雌牛','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>このおっとりしたノロマな牛は財布に致命的なダメージを与え、初めて購入した時はぼったくられた気分になるかもしれない。とはいえ細部まで観察すると、実はイヤリング(奴はイヤリングを着けている)が牛自身の完全な機能的コピーである事に気付くだろう。牛それぞれが同様に己自身のイヤリングをとか、そう、無限に。これで乳製品への心配は当分しなくて済みそうだが、あん畜生のムカつくニヤケ顔には…まあ、耐えるしかない。</q>','自己無限生成エンジン',6);
		new Game.TieredUpgrade('チョコレートウロボロス','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>永遠に己の尾を飲み込み消化する、代謝的には胡散臭い、美味しい悲劇の物語。</q>','自己無限生成エンジン',7);
		new Game.TieredUpgrade('ネステッド','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>抜け目のない自己参照?それとも恥ずべき抱き合わせ広告?このアップグレードには図々しくも <u>orteil.dashnet.org/nested</u> への広告が、クリックすら不可能なツールチップに表示されているとかいないとか。</q>','自己無限生成エンジン',8);
		new Game.TieredUpgrade('空間充填繊維','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>この特殊な栄養素は局所空間を完全に満たす素晴らしい特性を持ち、摂取者の飢えを立ち所に癒してしまう!<br>だが、腹を満たせばクッキーが売れぬと心得ているマーケティング担当者は、この商品を画期的梱包材として再利用することを君に必死に訴えた。</q>','自己無限生成エンジン',9);
		new Game.TieredUpgrade('巡り続ける読本','自己無限生成エンジンが <b>2倍</b> 効率的になる。','自己無限生成エンジン',10);
			Game.last.descFunc=function(){
				var str='"昔々'+Game.bakeryName+'という焼き菓子屋がおったとさ。ある日、ドアがコンコンと叩かれ'+Game.bakeryName+'が開けてみると、目を血走らせた見知らぬ老婆が、いきなり眼の前に現れよったとさ。老婆は唇を開くと不気味な小さな声で、この奇妙な短い物語を語り始めたんだとさ : ';
				var n=35;
				var i=Math.floor(Game.T*0.1);
				return this.desc+'<q style="font-family:Courier;">'+(str.substr(i%str.length,n)+(i%str.length>(str.length-n)?str.substr(0,i%str.length-(str.length-n)):''))+'</q>';
			};
		new Game.TieredUpgrade('全ての集合の集合','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>解は、勿論、明らかに「不確定」。</q>','自己無限生成エンジン',11);
		
		order=5000;
		Game.SynergyUpgrade('合わせ鏡','<q>合わせ鏡を2組互いに向け合ったらどうなるか、君にはわかる?どうやら、全世界中の誰もわかんないらしいよ。</q>','自己無限生成エンジン','プリズム','synergy1');
		//Game.SynergyUpgrade('Compounded odds','<q>When probabilities start cascading, "never in a billion lifetimes" starts looking terribly like "probably before Monday comes around".</q>','自己無限生成エンジン','チャンスメーカー','synergy1');
		Game.SynergyUpgrade('マウス達をクリックするマウス達','','自己無限生成エンジン','カーソル','synergy2');
		Game.last.descFunc=function(){
			Math.seedrandom(Game.seed+'-blasphemouse');
			if (Math.random()<0.3) {Math.seedrandom();return this.desc+'<q>完全なる冒涜リックだ!</q>';}
			else {Math.seedrandom();return this.desc+'<q>完全なる冒涜だ!</q>';}
		};
		
		
		order=10020;
		Game.NewUpgradeCookie({name:'カスタードクリーム',desc:'宿敵ブルボンビスケットとの熾烈な争いは英国の伝統。 <br>中のクリームはバニラ風味で、離れていても匂いが判る。 <br>内側の方が美味しいよ!',icon:[23,29],power:						4,price: 9999999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'ブルボンビスケット',desc:'2枚のチョコレートビスケットを更なるチョコレートで一つにした。 <br>言い伝えでは、カスタードクリームの因縁のライバル。',icon:[24,29],power:						4,price: 99999999999999999999999999999999999999});
		
		
		new Game.Upgrade('忘れ形見','季節ドロップアイテムが <b>5分の1の確率で</b> アセンド時に持ち越される。<q>大切な思い出。</q>',1111111111,[22,29]);Game.last.pool='prestige';Game.last.parents=['スタースノウ','スターラブ','スターテラー','スタートレード','スタースポーン'];
		
		order=10020;
		Game.NewUpgradeCookie({name:'ミニクッキー',desc:'どうして小さな物ほどあっさり食べ過ぎてしまうのかと、ふと思ったことはないかい?',icon:[29,30],power:						5,price: 99999999999999999999999999999999999999*5});
		
		new Game.Upgrade('氷砂糖クッキー','クッキーの生産量が <b>永久に+5%</b> され、さらにLv10以上の施設1つにつき <b>+1%</b> される。<q>宇宙の神秘的な甘さが籠もっている。耳に近付けると微かな星の瞬き音がする。</q>',1000000000,[21,30]);Game.last.pool='prestige';Game.last.parents=['甘々ベーキング'];Game.last.power=function(){
			var n=5;
			for (var i in Game.Objects)
			{
				if (Game.Objects[i].level>=10) n++;
			}
			return n;
		};Game.last.pseudoCookie=true;
		Game.last.descFunc=function(){
			var n=5;
			for (var i in Game.Objects)
			{
				if (Game.Objects[i].level>=10) n++;
			}
			return '<div style="text-align:center;">現在 : <b>+'+Beautify(n)+'%</b><div class="line"></div></div>'+this.desc;
		};
		new Game.Upgrade('クッキーと思しきものの箱入りセット','詰め合わせが入っている…なにかの。<q>こいつらはクッキーと見做すか見做さない、どっちでもいい。</q>',333000000000,[25,29]);Game.last.pool='prestige';Game.last.parents=['氷砂糖クッキー'];
		new Game.Upgrade('クッキーに非ざるものの箱入りセット','詰め合わせが入っている…なにかの。<q>こいつらは厳密に、明確に、クッキーではない。</q>',333000000000,[26,29]);Game.last.pool='prestige';Game.last.parents=['氷砂糖クッキー'];
		new Game.Upgrade('ペストリーの箱入りセット','美味しいペストリーの詰め合わせが入っている。<q>こいつらは存在そのものが地獄への滑り台だ!</q>',333000000000,[27,29]);Game.last.pool='prestige';Game.last.parents=['氷砂糖クッキー'];
		
		order=10040;
		Game.NewUpgradeCookie({name:'プロフィトロール',desc:'プチシュークリームとしても知られる、軽くフワフワでホイップクリームで満たされたペストリー。雪玉不足になった時、人に投げつけても楽しい。',icon:[29,29],require:'ペストリーの箱入りセット',		power:4,price: Math.pow(10,31)});
		Game.NewUpgradeCookie({name:'ジャムドーナツ',desc:'ジャム充填率が最低限の0.3%を満たさない場合、返金が保証されている。<br>刺し傷からはジャムがまだ見えてる!',icon:[27,28],require:'ペストリーの箱入りセット',		power:4,price: Math.pow(10,33)});
		Game.NewUpgradeCookie({name:'グレーズドーナツ',desc:'砂糖で完全にドロドロベタベタ。穴の部分が一番美味しい。',icon:[28,28],require:'ペストリーの箱入りセット',		power:4,price: Math.pow(10,35)});
		Game.NewUpgradeCookie({name:'チョコレートケーキ',desc:'ケーキは「ポータル」に関係があるよ!',icon:[25,27],require:'ペストリーの箱入りセット',		power:4,price: Math.pow(10,37)});
		Game.NewUpgradeCookie({name:'苺のショートケーキ',desc:'これほど一般的なもののフレーバーテキストを考えるのは結構大変なんだよね、こんなんラクショーっと、ヘーキヘーキって人もいるだろうけどさ。',icon:[26,27],require:'ペストリーの箱入りセット',		power:4,price: Math.pow(10,39)});
		Game.NewUpgradeCookie({name:'アップルパイ',desc:'グランマの何人かは命令に従わずクッキーの代わりにこれを焼くという。',icon:[25,28],require:'ペストリーの箱入りセット',		power:4,price: Math.pow(10,41)});
		Game.NewUpgradeCookie({name:'レモンメレンゲパイ',desc:'メレンゲとは砂糖と卵白で作る非常にデリケートな物質で、綺麗に焼き上げるには大気状態が一定でないと駄目。レモンの方は、まあ恐らく、放っといても大丈夫。',icon:[26,28],require:'ペストリーの箱入りセット',		power:4,price: Math.pow(10,43)});
		Game.NewUpgradeCookie({name:'バタークロワッサン',desc:'色々考えてごらん。<br>ストライプシャツを着た無作法な男が自転車で君の傍を通り過ぎる。彼からは煙草とカフェオレの匂いがした。別の場所では、パントマイムの役者が口髭を着け英国人を滑稽に演じている。頭上には300羽の鳩が飛んでいる。はい、リラックスして。君は今、クロワッサンを食べていたんだ。',icon:[29,28],require:'ペストリーの箱入りセット',		power:4,price: Math.pow(10,45)});
		
		order=10050;
		Game.NewUpgradeCookie({name:'クッキー生地',desc:'溢れんばかりの無限の可能性を秘めているが、そのままでも食べられる。ほぼ間違いなくサルモネラ菌に中る程度の価値はある。',icon:[25,30],require:'クッキーと思しきものの箱入りセット',		power:4,price: Math.pow(10,35)});
		Game.NewUpgradeCookie({name:'黒焦げクッキー',desc:'このクッキーは空の太陽に接近し過ぎて、今や昔の面影はない。君がタイマーセットを忘れてさえいなければ、こんな悲劇は生まれなかっただろうに…',icon:[23,30],require:'クッキーと思しきものの箱入りセット',		power:4,price: Math.pow(10,37)});
		Game.NewUpgradeCookie({name:'何故かチョコチップが抜かれたチョコチップクッキー',desc:'今までで一番悲しい出来事に違いない。',icon:[24,30],require:'クッキーと思しきものの箱入りセット',		power:3,price: Math.pow(10,39)});
		Game.NewUpgradeCookie({name:'フレーバーテキストクッキー',desc:'君が今読んでいるものは、このクッキーに独特の風味を与えている。 ',icon:[22,30],require:'クッキーと思しきものの箱入りセット',		power:4,price: Math.pow(10,41)});
		Game.NewUpgradeCookie({name:'高精細度クッキー',desc:'ムズムズして落ち着かなくなるほど細部まで赤裸々。例えるなら、君の叔母が井戸端会議で喋り続けるおかしな噂話のように。',icon:[28,10],require:'クッキーと思しきものの箱入りセット',		power:5,price: Math.pow(10,43)});
		
		order=10060;
		Game.NewUpgradeCookie({name:'トースト',desc:'カリッと香ばしい薄切りパンにバターやジャムを添えて。パーティ会場で皆が口々にこれを勧めてくるのは何故?',icon:[27,10],require:'クッキーに非ざるものの箱入りセット',		power:4,price: Math.pow(10,34)});
		Game.NewUpgradeCookie({name:'ピーナッツバター&ジャムのサンドイッチ',desc:'の、時間だよ。',icon:[29,9],require:'クッキーに非ざるものの箱入りセット',		power:4,price: Math.pow(10,36)});
		Game.NewUpgradeCookie({name:'ウーキー',desc:'君が探しているクッキーはコレじゃない。',icon:[26,30],require:'クッキーに非ざるものの箱入りセット',		power:4,price: Math.pow(10,38)});
		Game.NewUpgradeCookie({name:'チーズバーガー',desc:'クッキーとは全く関係ないヨ - Orteil はチーズバーガーを出した言い訳をしたかっただけダヨ。',icon:[28,30],require:'クッキーに非ざるものの箱入りセット',		power:4,price: Math.pow(10,40)});
		Game.NewUpgradeCookie({name:'たった一粒のチョコレートチップ',desc:'何か美しいものの始まり。',icon:[27,30],require:'クッキーに非ざるものの箱入りセット',		power:1,price: Math.pow(10,42)});
		
		
		new Game.Upgrade('悪魔の計算報告','<b>追加の価格情報</b> が解禁される。<br>購入までに必要な時間、貯蔵クッキーに対する価格の比率をそれぞれ表示される。<q>こんなゲームやるのはモノ好きくらいだが、それでもやり続けてしまう理由が「これ」だ。</q>',2000000,[11,10]);Game.last.pool='prestige';Game.last.parents=['思いつきで作ったチェックリスト'];
		
		
		new Game.Upgrade('煌めくベール','CpSの <b>50%</b> 分を常時ブーストさせるスイッチとなる、<b>煌めくベール</b>を解禁します。<br>ベールがオンの状態で始まります。ですが、とても脆く、大クッキーやゴールデンクッキー、トナカイをクリックするとオフになり、 オンにするのにCpS 24時間分 のコストが必要になります。<q>手出しするな!</q>',999999999,[9,10]);Game.last.pool='prestige';Game.last.parents=['運気倍増の蒸溜エキス'];
		
		order=40005;
		var func=function(){
			var boost=50;
			var resist=0;
			if (Game.Has('強化された薄膜')) {boost+=10;resist+=10;}
			return (this.name=='煌めくベール[オン]'?'<div style="text-align:center;">発動中。</div><div class="line"></div>':'')+'発動中はクッキー生産量の <b>'+Beautify(boost)+'%</b> 分ブーストされます。<br>ベールはとても脆く、大クッキー、ゴールデンクッキー、トナカイをクリックすると壊れます。<br><br>一度壊れると、オンに戻すのにバフを除いたCpS 24時間分 のコストがかかります。'+(resist>0?('<br><br><b>'+Beautify(resist)+'%</b> の確率で壊れません。'):'');
		};
		new Game.Upgrade('煌めくベール[オフ]','',1000000,[9,10]);
		Game.last.pool='toggle';Game.last.toggleInto='煌めくベール[オン]';
		Game.last.priceFunc=function(){return Game.unbuffedCps*60*60*24;}
		Game.last.descFunc=func;
		new Game.Upgrade('煌めくベール[オン]','',0,[9,10]);
		Game.last.pool='toggle';Game.last.toggleInto='煌めくベール[オフ]';
		Game.last.descFunc=func;
		
		Game.loseShimmeringVeil=function(context)
		{
			if (!Game.Has('煌めくベール')) return false;
			if (!Game.Has('煌めくベール[オフ]') && Game.Has('煌めくベール[オン]')) return false;
			if (Game.Has('強化された薄膜'))
			{
				if (context=='shimmer') Math.seedrandom(Game.seed+'/'+(Game.goldenClicks+Game.reindeerClicked));
				else if (context=='click') Math.seedrandom(Game.seed+'/'+Game.cookieClicks);
				if (Math.random()<0.1)
				{
					Game.Notify('強化された薄膜が煌めくベールを保護します。','',[7,10]);
					Game.Win('図太いやつ');
					return false;
				}
				Math.seedrandom();
			}
			var me=Game.Upgrades['煌めくベール[オン]'];
			me.bought=1;
			//Game.Upgrades[me.toggleInto].bought=false;
			Game.Lock(me.toggleInto);
			Game.Unlock(me.toggleInto);
			Game.Notify('煌めくベールが消える…','',[9,10]);
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			PlaySound('snd/spellFail.mp3',0.75);
		}
		
		
		var getCookiePrice=function(level){return 999999999999999999999999999999999999999*Math.pow(10,(level-1)/2);};
		
		order=10020;
		Game.NewUpgradeCookie({name:'ウーピーパイ',desc:'半分にしたチョコレートをクリームの詰め物でくっつけた。眉毛はないんだけど、今まで気付かなかったでしょ。',icon:[21,31],power:						5,price: getCookiePrice(1)});
		Game.NewUpgradeCookie({name:'キャラメルウェハービスケット',desc:'とても美味しいチョコレートでコーティング。タマネギを入れずにビスケットの中に作れる層としては最多。',icon:[22,31],power:						5,price: getCookiePrice(2)});
		Game.NewUpgradeCookie({name:'チョコレートチップモカクッキー',desc:'モカはコーヒーにチョコレートをこっそり混ぜ込む口実として始まった。そして今度は外交と文化交流の痛々しい展示の中で、チョコレートクッキーにコーヒーを持ち込んでいる。',icon:[23,31],power:						5,price: getCookiePrice(3)});
		Game.NewUpgradeCookie({name:'アールグレイクッキー',desc:'ピカード艦長のお気に入り。',icon:[24,31],power:						5,price: getCookiePrice(4)});
		Game.NewUpgradeCookie({name:'コーンシロップクッキー',desc:'コーンシロップのおかげでものすごい噛みごたえ。クッキーに分類しようとは思わないタイプのものだろうが、焼き菓子屋はそれで済ませてしまった。',icon:[25,31],power:						5,price: getCookiePrice(5)});
		Game.NewUpgradeCookie({name:'冷凍室クッキー',desc:'様々な素材で様々な形状に調理される。実績のある中世の拷問行為に似せて、焼く前に凍らせた生地で作られている。やつらに知られないようにしよう。',icon:[26,31],power:						5,price: getCookiePrice(6)});
		Game.NewUpgradeCookie({name:'グラハムクラッカー',desc:'その設計は厳格に節制された人生を送りたいという願いに触発されており、喜びや楽しさとは無縁だ。それゆえこれほどおいしいのも当然である。',icon:[27,31],power:						5,price: getCookiePrice(7)});
		Game.NewUpgradeCookie({name:'堅パン',desc:'極めて堅く、そして正直言うと極めてパン。<br>もしこれを素敵なおやつとして食べることを考えているなら、このゲームより心配すべきことがあるだろう。壊血病になることとか反乱を煽動している乗組員とか。',icon:[28,31],power:						5,price: getCookiePrice(8)});
		Game.NewUpgradeCookie({name:'コーンフレーククッキー',desc:'でっっっっっっこぼこ！ 牛乳に浸し過ぎないように気を付けて。さもないとうっかりシリアルの鉢を前に途方に暮れる羽目になるから。',icon:[29,31],power:						5,price: getCookiePrice(9)});
		Game.NewUpgradeCookie({name:'豆腐クッキー',desc:'実のところ豆腐を上手く調理するにはふたつ方法がある。豆腐にわかりやすく自己主張させるか、他の材料に混ぜてごまかすかだ。たまたまこれは後者であるので、これはマジで普通のクッキーと見分けがつかない。左側にある1ピクセルを除けば。',icon:[30,31],power:						5,price: getCookiePrice(10)});
		Game.NewUpgradeCookie({name:'グルテンフリークッキー',desc:'典型的なチョコチップクッキーにも劣らないように、ブラウンバターと牛乳で作られる。<br>セリアック病患者にとっては危険のないおいしい焼き菓子に夢中になるチャンスである。他の人にとっては変に不安をあおるお菓子。感情に乏しい彼らの目は天国も地獄も知ることはない。',icon:[30,30],power:						5,price: getCookiePrice(10)});
		Game.NewUpgradeCookie({name:'ロシアンブレッドクッキー',desc:'別名アルファベットクッキー。多くの菓子職人がレシピに厳密に従う一方で、スペルト小麦を小麦で代用している者もいるという。しかし私の話を真に受けないでほしい。',icon:[30,29],power:						5,price: getCookiePrice(11)});
		Game.NewUpgradeCookie({name:'レープクーヘン',desc:'はちみつとスパイスのいい匂いがするドイツの多様なクッキーで、クリスマスの頃によく焼かれる。<br>戦闘の中での防御のため、かつて古の戦士たちによって着用された。<br>筋力+5、魔法抵抗+21%。',icon:[30,28],power:						5,price: getCookiePrice(12)});
		Game.NewUpgradeCookie({name:'アーヘナープリンテン',desc:'かつてこのジンジャーブレッドのようなお菓子を甘くするために使われた蜂蜜は今は甜菜糖に置き換えられ、退行進化の悲しい一例に成り果てた。',icon:[30,27],power:						5,price: getCookiePrice(13)});
		Game.NewUpgradeCookie({name:'カニストレリ',desc:'アニスとワインで風味をつけた、発祥の地コルシカ島の人々のように頑丈なビスケット。',icon:[30,26],power:						5,price: getCookiePrice(14)});
		Game.NewUpgradeCookie({name:'ニースビスケット',desc:'ココナッツが使われていて紅茶にぴったり。とてもナイスなのでニースと名付けられたフランスの都市に由来する。',icon:[30,25],power:						5,price: getCookiePrice(15)});
		Game.NewUpgradeCookie({name:'フレンチピュアバタークッキー',desc:'このクッキーからより強く漂ってくるものが、- バターの香りなのか慇懃無礼なのか -判別できない。',icon:[31,25],power:						5,price: getCookiePrice(16)});
		Game.NewUpgradeCookie({name:'プチバター',desc:'単に「小さなバター」を意味する名前を持つ控えめなビスケット。4つの耳と48本の歯で有名で、かつ恐れられている。<br>君の声を聞いたなら、君を捕まえにやってくる…。',icon:[31,26],power:						5,price: getCookiePrice(16)});
		Game.NewUpgradeCookie({name:'ナナイモバー',desc:'カナダからやってきたとても美味しい焼かないお菓子。そのままの雪にメープルシロップをかけて食べるよりたぶんいいと思うけど、どうかな。',icon:[31,27],power:						5,price: getCookiePrice(17)});
		Game.NewUpgradeCookie({name:'バーガークッキー',desc:'チョコレートファッジをめちゃくちゃに塗りたくられているが、トリプルフライドエッグバーガーやアオガニチーズバーガーと並んでボルチモアではとても人気のあるバーガー。',icon:[31,28],power:						5,price: getCookiePrice(18)});
		Game.NewUpgradeCookie({name:'ちんすこう',desc:'クッキーの形をした小さな沖縄の欠片。お土産としてお菓子を売るのは日本には欠かせない慣習。でもさ、スーベニアメダルだって素敵じゃん?',icon:[31,29],power:						5,price: getCookiePrice(19)});
		Game.NewUpgradeCookie({name:'パンダコアラビスケット',desc:'ジャングルの動物たちを取り揃え、中身も同様に取り揃えてる。<br>チョコレートにイチゴ、バニラや抹茶もあるよ。<br>絶滅する前に食べ尽くしちゃって!',icon:[31,13],power:						5,price: getCookiePrice(19)});
		Game.NewUpgradeCookie({name:'白雪',desc:'インドネシアで愛されているお菓子。その名前は「雪の女王」を意味する。表面を覆う粉砂糖がその理由である。もしこれを数年前にクッキークリッカーに追加していたら、ここにはとあるディズニー映画への言及をしていただろうが、今はありのままにしておくべきだろう。',icon:[31,30],power:						5,price: getCookiePrice(20)});
		Game.NewUpgradeCookie({name:'ミルククッキー',desc:'背の高いコップ一杯のチョコレートと一緒にどうぞ。',icon:[31,31],power:						5,price: getCookiePrice(21)});
		
		order=9999;
		Game.NewUpgradeCookie({name:'クッキーくず',desc:'ここにはクッキーがあった。今はもうない。<br>なんてこった、何<i>して</i>くれてんだ?!',icon:[30,13],power:1,require:'遺産',price:100});
		Game.NewUpgradeCookie({name:'チョコレートチップクッキー',desc:'これは君が四六時中クリックしているクッキー。ちょっとへこんでるし、かじられてるけどそれ以外は新品同様。',icon:[10,0],power:10,require:'遺産',price:1000000000000});
		
		
		new Game.Upgrade('宇宙レベルのビギナーズラック','周回内において <b>ヘブンリーチップスの極意</b> の購入以前に、アイテムドロップ率を <b>5倍出やすく</b> する。<q>あ!金貨!<br>あ!すごい財宝!<br>あ!また金貨!</q>',999999999*15,[8,10]);Game.last.pool='prestige';Game.last.parents=['煌めくベール'];
		new Game.Upgrade('強化された薄膜','<b>煌めくベール</b> の耐久性が上がり、<b>10%の確率</b> で壊れなくなる。また、CpSが <b>+10%</b> される。<q>クラゲとサランラップの間の薄さ。</q>',999999999*15,[7,10]);Game.last.pool='prestige';Game.last.parents=['煌めくベール'];
		
		
		order=255;
		Game.GrandmaSynergy('2進グランマ','もっとたくさんのクッキーを転送するデジタルグランマ。<br>(参照 : 真偽値グランマ、文字列グランマ、非数グランマ・別名「NaNs」。)','Javascriptコンソール');
		
		order=1400;
		new Game.TieredUpgrade('猫でもわかるJavaScriptコンソール','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>開始方法は以下。最初の行には「Javascriptコンソールを開くには、××キーを…」残りの部分はチョコレートミルクに浸されてしまっている。この手の情報を得るための方法さえあれば…</q>','Javascriptコンソール',1);
		new Game.TieredUpgrade('64ビット配列','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>クッキーをもっと効率的に貯蔵できる大容量の変数型。</q>','Javascriptコンソール',2);
		new Game.TieredUpgrade('スタック・オーバーフロー','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>なんてこった!君がどっかでループを閉じるのを忘れたせいでプログラムが暴走してしまったらしい!残りのエンジニアたちはどういうわけかこれにワクワクしてるみたいだ。スタックオーバーフローみたいなプログラムの事故が一体役に立つというのか?</q>','Javascriptコンソール',3);
		new Game.TieredUpgrade('企業向けコンパイラ','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>この特注のjavascriptコンパイラには何年もの開発期間と何十億もの研究費を要したが、(特定の)機能を(最大)2%高速に実行してくれるはずだ(最適条件下で)。</q>','Javascriptコンソール',4);
		new Game.TieredUpgrade('糖衣構文','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>美味しいクッキーのための美味しいソースコード。</q>','Javascriptコンソール',5);
		new Game.TieredUpgrade('一杯のおいしいコーヒー','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>このうんざりする仕事でへとへとだ。どこかの遠い島で採れた焙煎豆で淹れた美味しいコーヒーを一杯用意しよう。―やっぱりたぶん、ちょっと働きすぎなんだよ―コーヒーカップが口を開いた、僕はjavascriptじゃありませんよと主張するように。</q>','Javascriptコンソール',6);
		new Game.TieredUpgrade('その場でベーキング','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>クッキーを用意する新しい方法: 食べる直前にお客さんの目の前で焼けばキッチンはすっきりする。</q>','Javascriptコンソール',7);
		new Game.TieredUpgrade('クッキー++','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>完全自作の、クッキー用プログラミング言語で、その―変数"cookies"を+1する―という面白い能力にちなんで名づけられた。</q>','Javascriptコンソール',8);
		new Game.TieredUpgrade('ソフトウェア更新','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>すごいニュース!誰かがついにWi-fiのパスワードを見つけて、新しくネットに接続したおかげで大量のソフトウェア更新が来たらしい!ブラウザーもドライバーもプラグインも、みんな一新されたんだ。そしてjavascriptのバージョンも最新のECMASctipt仕様になった。神経毒ガスの換気プログラムが死んだせいで数千人が犠牲になったのは残念な事だけど、これは大きな進歩だと思うよ。</q>','Javascriptコンソール',9);
		new Game.TieredUpgrade('Game.Loop','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>これをどうするのか分からないでしょう。これはどういう意味なのか?何をするものなのか?こんなのをここに置いたままにするのは誰なのか?1/30秒後にまた聞いてください。</q>','Javascriptコンソール',10);
		new Game.TieredUpgrade('eval()','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>この単純な関数が宇宙の鍵を握っていると言われ、これを習得した者は望むとおりに現実を形作ることができるだろう。<br>幸いなことに君はこれがどう動くかわかっていない。だが、君の部屋の壁に素敵な記念板を用意してくれることだろう。</q>','Javascriptコンソール',11);
		
		order=5000;
		Game.SynergyUpgrade('スクリプトおばあちゃん','<q>エナジードリンクと燃料とするおばあちゃん軍。いつでもサイバー空間にハッキングして禁断の電子クッキーを入手できる。</q>','Javascriptコンソール','グランマ','synergy1');
		Game.SynergyUpgrade('富くじ演算','','Javascriptコンソール','チャンスメーカー','synergy2');
		Game.last.descFunc=function(){
			Math.seedrandom(Game.seed+'-tombolacomputing');
			var str='(くじには'+Math.floor(Math.random()*100)+Math.floor(Math.random()*100)+Math.floor(Math.random()*100)+Math.floor(Math.random()*100)+'番と書いてあり、'+choose([Math.floor(Math.random()*5+2)+'行のjavascriptのコード','Math.random()を1度タダで使う権利','それが何であれ、1つの量子ビット','食べかけのクッキー','新品の掃除機','約1カップの常温のオレンジソーダ','すごくおいしいサンドイッチ','一握りの糸くず','誰かの大体きれいなかつら','極上レストラン旅行','これらの数学の知識','1行ニュースのチラ見','半額で別のくじが','かびたパン食べ放題','一生分の酸素',choose['赤','オレンジ','黄','緑','青','紫','黒','白','灰','茶','ピンク','鴨の羽']+'色','限られた時間と数量へのより良い理解','大昔の魔法の剣','遠い国での王権','グッドラック、マフィアでの地位','無料の週末タイムトラベル','何か美しいもの','油田の所有権','君が選んだ動物か植物か人物で作られたハンバーガー','生き残った'+choose['ドードー','フクロオオカミ','ユニコーン','恐竜','ネアンデルタール人'],'大きな達成感','はかない娯楽','どこからともない不安','深いリアルな恐怖','人生+1週間','手動呼吸','この場での瞬き','次の夢で有名人との遭遇','とてもいい夢','風変わりなSE','45秒の倫理の柔軟さ','「ふりかけ」としても知られる大量の粉','普通の寸法の、円や三角形、四角形のような幾何学図形','このランダムな数列','人生を好転させるためのひと押し','素敵な恐怖','知られざる超能力','次回の幸運','富くじ札に対する非合理的な恐怖','クモ丸々1匹','自尊心と決断力の向上','心の平穏','お好きなMMORPGでの経験値2倍の週末','まさにこのくじ札を形成する数兆個の原子に相当する宇宙の欠片','食中毒','概念的な、月!','新しい車','新しいキャッチフレーズ','あなたの選択に関する侵入的思考','-…ああくそ、ここだけちぎれてる…-','監督による次の大ヒット映画の宣伝動画','めっちゃかっこいい子牛','本物の海賊のダブロン金貨','「宝物と財宝」または何か','沈没したボート','未使用の赤ちゃん用靴','どこかの王か女王の血筋','決して出会うことのない死語についての天賦の素養','歌詞を知らない曲のメロディー','ホワイトノイズ','軽度の身体的欠陥','新しい一組の唇','もの、とかそういうの','あなたの名前を含む人気のある表現','タイプミス','刑務所釈放カード','今のところは…残りの人生','礼儀正しい不機嫌','上から目線','呪われた猿の手','たぶん、真実の愛','お好みの動物、国、テレビ番組、芸能人に関する興味深い噂','大衆文化に関すること','楽しいひと時','単語「tombola」の語源 -「ごちゃ混ぜにする」というイタリア語- ','外れ、ごめん。スカ'])+'があなたに与えられる)';
			Math.seedrandom();
			return this.desc+'<q>量子演算のようなものだが、もっと面白い。<br>'+str+'</q>';
		};
		
		order=10020;
		Game.NewUpgradeCookie({name:'クラウドノーテン',desc:'お祭り大好きなオランダ人のお気に入り。小さなシナモンでコーティングされることもある。「kruidnoten」って翻訳は笑っちゃうよね。',icon:[30,3],power:						5,price: getCookiePrice(22)});
		Game.NewUpgradeCookie({name:'マリービスケット',desc:'このクッキーは心地よく丸く、滑らかなバター、微妙なバニラ味、華やかにエンボス加工された凹凸は、刑務所で殺されたマリーのことを示している。',icon:[30,4],power:						5,price: getCookiePrice(23)});
		Game.NewUpgradeCookie({name:'メレンゲクッキー',desc:'卵白からできるものの中では、たぶんいちばんエキサイティング。レシピが神秘的な金庫に封印されて1万年間失われたため、忘れられたクッキーとも呼ばれる。',icon:[31,4],power:						5,price: getCookiePrice(24)});
		
		order=10060;
		Game.NewUpgradeCookie({name:'ピザ',desc:'たしかにこれはピザだ、でもあふれんばかりのトマトとチーズのアイシングでつや消ししてもいない、クッキーほどの歯ごたえもないピザだったら?結局クッキーじゃない?それがどうした。',icon:[31,9],require:'クッキーに非ざるものの箱入りセット',		power:5,price: Math.pow(10,44)});
		
		order=10050;
		Game.NewUpgradeCookie({name:'クラッカー',desc:'本当に無塩で無味。この味気ない小麦製の真四角の広場に、ハムとチーズを乗っけてもらった、主な貢献は「サクサク感」。',icon:[30,9],require:'クッキーと思しきものの箱入りセット',		power:4,price: Math.pow(10,45)});
		
		order=10030;
		Game.NewUpgradeCookie({name:'キットカット',desc:'折り目ごとにきっちり折って食べることも、狂犬みたいに丸ごとばりばり食べることもできる。一部の国では、緑茶、ロブスターのスープ、ダークチョコレートとか、何百もの変わった味で製造している。',icon:[31,3],require:'ブランドビスケットの箱入りセット',power:												2,	price:	999999999999999999999999999*5});
		
		order=20000;
		new Game.Upgrade('役員猫','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>あなたの欲しいものはなんであろうと誰であろうといつでも渡せます、ご主人様</q>',900000000000000000000000000000000000000000000,Game.GetIcon('Kitten',13));Game.last.kitten=1;Game.MakeTiered(Game.last,13,18);
		
		
		order=10020;
		Game.NewUpgradeCookie({name:'チャイクッキー',desc:'ピカード艦長のお気に入りではないけど、艦長だってピンチになったらチャイティーも飲むだろう。',icon:[23,32],power:						5,price: getCookiePrice(4)+5});Game.last.order=10020.5685;
		
		Game.NewUpgradeCookie({name:'ヨーグルトクッキー',desc:'乳製品の神秘により増強されたこのクッキーには、乳糖不耐症にならないように避けなければならないことがもうひとつある。<br>マジに俺たちの中で培養されてるってこと。',icon:[24,32],power:						5,price: getCookiePrice(25)});
		Game.NewUpgradeCookie({name:'拇印クッキー',desc:'ジャムでいっぱい。時々、小さな紙コップに入れられて提出される。法廷での生体認証証拠としてはもはや認められない。混乱を繰り返してはならない。',icon:[25,32],power:						5,price: getCookiePrice(26)});
		Game.NewUpgradeCookie({name:'ピッツェル',desc:'古代イタリアのレシピに従い、特注の合金で焼き上げた薄くてパリッとしたワッフルクッキー。<br>このクッキーはずっと存在してきた。ずっとすべてを見てきていた。',icon:[26,32],power:						5,price: getCookiePrice(27)});
		
		order=10030;
		Game.NewUpgradeCookie({name:'ジラウエハース',desc:'どういうわけか最終的にはバナナプリンになってしまう、人気のバニラ味のビスケット。<br>何らかの事情で、世界一人気の核爆弾モンスターをモチーフにした。',icon:[22,32],require:'ブランドビスケットの箱入りセット',power:												2,	price:	999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'ディムダム',desc:'チョコレートでつなげられ、さらにそこから大量のチョコでコーティングされた2つのビスケット。<br>あなたはこう疑問を浮かべる - どっちがディムで、どっちがダムか?',icon:[31,10],require:'ブランドビスケットの箱入りセット',power:												2,	price:	999999999999999999999999999999999*5});
		
		order=10060;
		Game.NewUpgradeCookie({name:'キャンディー',desc:'お菓子の世界に存在する大きなふたつの派閥 : もちろん、クッキー - あとキャンディー。<br>キャンディーだけでまったく新しいゲームを作ることも可能ですが、とりあえず今のところはこれらのごく普通なおやつの盛り合わせをお楽しみください。',icon:[30,10],require:'クッキーに非ざるものの箱入りセット',		power:5,price: Math.pow(10,46)});
		
		
		order=19000;
		new Game.TieredUpgrade('幸運 No.001','カーソルが <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>あなたが指折り数えられるほどの指しか信頼できる指がないわけではない。</q>','カーソル','fortune');
		new Game.TieredUpgrade('幸運 No.002','グランマが <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>シワとはありふれた外面の亀裂。</q>','グランマ','fortune');
		new Game.TieredUpgrade('幸運 No.003','農場が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>明日の種は既に今日の種の中にある。</q>','農場','fortune');
		new Game.TieredUpgrade('幸運 No.004','鉱山が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>深層からの富はすべてあなたを同じように高めてくれる。</q>','鉱山','fortune');
		new Game.TieredUpgrade('幸運 No.005','工場が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>真の価値はあなたが見つけるものではなく、あなたが作るものの中にある。</q>','工場','fortune');
		new Game.TieredUpgrade('幸運 No.006','銀行が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>お金の価値の重さはあなたのポッケの中身がすっからかんであることも教えてくれる。</q>','銀行','fortune');
		new Game.TieredUpgrade('幸運 No.007','神殿が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>導きの全部が全部崇めるに値するってわけじゃない。</q>','神殿','fortune');
		new Game.TieredUpgrade('幸運 No.008','魔法使いの塔が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>マジックは主にこの2つで成り立っている - ショウマンシップとウサギたち。</q>','魔法使いの塔','fortune');
		new Game.TieredUpgrade('幸運 No.009','宇宙船が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>走ってきた距離が同じだけあなたを成長させてくれる。</q>','宇宙船','fortune');
		new Game.TieredUpgrade('幸運 No.010','錬金術室が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>自分に慣れるな。変わり続けろ。</q>','錬金術室','fortune');
		new Game.TieredUpgrade('幸運 No.011','ポータルが <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>始めは全部ギャンブルだ。足元を見られないように。</q>','ポータル','fortune');
		new Game.TieredUpgrade('幸運 No.012','タイムマシンが <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>未来の自分に感謝されるように生きよう。</q>','タイムマシン','fortune');
		new Game.TieredUpgrade('幸運 No.013','反物質凝縮器が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>世界ってのは俺たちがこいつにブチ込んだものでできている。</q>','反物質凝縮器','fortune');
		new Game.TieredUpgrade('幸運 No.014','プリズムが <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>眩しい光を見つめていると視界が真っ暗になってくる。</q>','プリズム','fortune');
		new Game.TieredUpgrade('幸運 No.015','チャンスメーカーが <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>目をつぶってでもできることを偶然に任せるな。</q>','チャンスメーカー','fortune');
		new Game.TieredUpgrade('幸運 No.016','自己無限生成エンジンが <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>他人に見てもらうのはいいことだ。でも自分で自分を見るのも忘れないで。</q>','自己無限生成エンジン','fortune');
		new Game.TieredUpgrade('幸運 No.017','Javascriptコンソールが <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>それでもうまくいかない場合は、ルールごと書き換えてください。</q>','Javascriptコンソール','fortune');
		
		
		order=19100;
		//note : price for these capped to base price OR 1 day of unbuffed CpS
		new Game.Upgrade('幸運 No.100','アップグレードと施設の価格が <b>-1%</b> され、CpSが <b>+1%</b> される。<q>真の豊かさとは贈りものに数えられる。</q>',
		Game.Tiers['fortune'].price*100000,[0,0]);Game.MakeTiered(Game.last,'fortune',10);
		Game.last.priceFunc=function(me){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		new Game.Upgrade('幸運 No.101','CpSが <b>+7%</b> される。<q>一部の人は幸運を夢見る、他はクッキーを夢見る。</q>',Game.Tiers['fortune'].price*100000000,[0,0]);Game.MakeTiered(Game.last,'fortune',10);
		Game.last.priceFunc=function(me){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		new Game.Upgrade('幸運 No.102','ゲームを閉じている間のCpSが <b>+1%</b> される<small>(天国系アップグレードの超絶の双門を所有しているならば)</small>。<q>助けて、ブラウザゲームに閉じ込められちまったよ!</q>',Game.Tiers['fortune'].price*100000000000,[0,0]);Game.MakeTiered(Game.last,'fortune',10);
		Game.last.priceFunc=function(me){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		new Game.Upgrade('幸運 No.103','より多くのミルクを持っているほど<b>よりCpSが多く</b>上昇する。<q>迷信なんか信じないでください、全ての猫は幸福に暮らしています。</q>',Game.Tiers['fortune'].price*100000000000000,[0,0]);Game.MakeTiered(Game.last,'fortune',18);Game.last.kitten=1;
		Game.last.priceFunc=function(me){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		new Game.Upgrade('幸運 No.104','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>連絡を忘れるな。クリックからも逃げるな。</q>',Game.Tiers['fortune'].price*100000000000,[0,0]);Game.MakeTiered(Game.last,'fortune',11);
		Game.last.priceFunc=function(me){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		
		new Game.Upgrade('フォーチュンクッキー','ニュース欄が時折<b>幸運</b>をもたらし、クリックすると何かいいことがあるかもしれない。<q>These don\'t taste all that great but that\'s not really the point, is it?</q>',77777777777,[29,8]);Game.last.pool='prestige';Game.last.parents=['運気倍増の蒸溜エキス'];
		
		
		order=40000;
		new Game.Upgrade('本当に良いガイドブック','<b>???</b><q>??????</q>',7,[22,12]);//debug purposes only
		//new Game.Upgrade('本当に良いガイドブック','<b>All dungeon locations behave as if unlocked.</b><br><b>You may shift-click a dungeon location to teleport there.</b><q>It even tells you which hotels to avoid!</q>',7,[22,12]);//debug purposes only
		Game.last.buyFunction=function(){if (Game.Objects['工場'].minigameLoaded){Game.Objects['工場'].minigame.computeMapBounds();Game.Objects['工場'].minigame.updateLocStyles();}}
		Game.last.pool='debug';
		
		order=10300;
		Game.NewUpgradeCookie({name:'プリズムのハートのビスケット',desc:'普遍的な愛、そして自分自身に誠実であることを表す全ての味のビスケット。',require:'永久のハートのビスケット',season:'valentines',icon:[30,8],							power:heartPower,price: 1000000000000000000000000});Game.last.order=10300.175;
		
		order=19100;
		new Game.Upgrade('子猫の給料','賢明な経理によって、なんと猫のアップグレードを <b>10%安く</b> する。<q>猫は給料を少しばかり貰うことがある。<br>猫は特に現金取引において、非常に優秀な交渉人なのだ。</q>',9000000000,[31,8]);Game.last.pool='prestige';Game.last.parents=['子猫の天使'];Game.last.kitten=1;
		new Game.Upgrade('ドラゴンとふれ合おう','一度孵ったときにクリックしてあげることで<b>マイドラゴンを飼う</b>能力を解禁する。<q>ドラゴンは喉を鳴らしません。もしドラゴンが喉を鳴らした場合、直ちにその場を離れてください。</q>',99999999999,[30,12]);Game.last.pool='prestige';Game.last.parents=['ドラゴンの焼き方','残された幸運'];
		
		order=25100;
		var dragonDropUpgradeCost=function(me){return Game.unbuffedCps*60*30*((Game.dragonLevel<Game.dragonLevels.length-1)?1:0.1);};
		new Game.Upgrade('ドラゴンの鱗','クッキーの生産倍率が <b>+3%</b> される。<br>費用はCpSに依存するが、十分に鍛えられたドラゴンがいれば 10分の1 になる。<q>あなたのドラゴンから定期的に剥がれ落ちるので、おそらく見逃さないだろう。<br>注記: アイコンはスケールを調整していません</q>',999,[30,14]);Game.last.priceFunc=dragonDropUpgradeCost;
		new Game.Upgrade('ドラゴンの爪','クリックが <b>+3%強力</b> になる。<br>費用はCpSに依存するが、十分に鍛えられたドラゴンがいれば 10分の1 になる。<q>数日で再び生える。<br>中指から剃刀に似た6インチの収納可能な爪が。だからほら、少しは敬意を払おうとしないか。</q>',999,[31,14]);Game.last.priceFunc=dragonDropUpgradeCost;
		new Game.Upgrade('ドラゴンの牙','ゴールデンクッキーの入手クッキーが <b>+3%</b> される。<br>刈れよドラゴン と ドラゴン便 が <b>10%強力</b> になる。<br>費用はCpSに依存するが、十分に鍛えられたドラゴンがいれば 10分の1 になる。<q>あなたのドラゴンがあなたにプレゼントとしてあげたかった、抜け落ちた乳歯。<br>大人の歯より小さいかもしれないが、それでも驚くほど鋭く - そしていくらかの畏怖を覚えるほど、お菓子で出来た生物から予想できるように見事な虫歯がある。</q>',999,[30,15]);Game.last.priceFunc=dragonDropUpgradeCost;
		new Game.Upgrade('ドラゴンのテディベア','アイテムのドロップ率が <b>+3%</b> される。<br>費用はCpSに依存するが、十分に鍛えられたドラゴンがいれば 10分の1 になる。<q>我らのドラゴンはかつてこれと一緒に寝ていた。<br>今度は君がそれを持つ時だ。恐ろしい獣に似せて作られている。はるか昔に流浪の魔術師が摘んだ魔法のハーブが詰められている。エルフの糸とポリエステルを混ぜて編まれている。</q>',999,[31,15]);Game.last.priceFunc=dragonDropUpgradeCost;
		
		order=10020;
		Game.NewUpgradeCookie({name:'グラノーラクッキー',desc:'おい待て!こいつはオートミールクッキーとレーズンクッキーを混ぜただけのもんだ!次は何をやらかす気だ、半分ダークチョコ半分ホワイトチョコクッキー?',icon:[28,32],power:						5,price: getCookiePrice(28)});
		Game.NewUpgradeCookie({name:'リコッタクッキー',desc:'軽くてケーキのよう。レモンやアーモンド抽出物でよく味付けされます。報告によるとイタリア製。調査は保留中とのことです。',icon:[29,32],power:						5,price: getCookiePrice(29)});
		Game.NewUpgradeCookie({name:'ピンクケーキ',desc:'このオランダのクッキーは基本的にピンクに色付けされますが、違う色になるときもあります - 乳がん啓発月間とか、国際フラミンゴデーとか。',icon:[30,32],power:						5,price: getCookiePrice(30)});
		Game.NewUpgradeCookie({name:'ピーナッツバター入りカップクッキー',desc:'企業製品をきわめてより本物に近い自家製の殻と一体化させ、その製品をずうずうしく再生させること以上に現代社会を強烈に表しているものがあるだろうか?とにかくこれはピーナッツバターカップで、焼いてクッキーとなった。とてもおいしいよ!',icon:[31,32],power:						5,price: getCookiePrice(31)});
		Game.NewUpgradeCookie({name:'セサミクッキー',desc:'このクッキーについている全ての小さな種を見てください!誰かが道に落としたか何かがあったのでしょう!とても歓迎されるべき教育的な道路です!',icon:[22,33],power:						5,price: getCookiePrice(32)});
		Game.NewUpgradeCookie({name:'たい焼き',desc:'餡子が詰まったパン生地の魚で、水中でゆっくりと柔らかい生地状の体をゆっくりと溶かしながら、苦しくて絶え間ない痛みとともに生きてゆく運命にある。',icon:[23,33],power:						5,price: getCookiePrice(33)});
		Game.NewUpgradeCookie({name:'バニレキプフェル',desc:'中欧のナッツ系のクッキーで、粉末のバニラシュガーでコーティングされている。同じ地域にある、三日月型のロールパンである通常のキプフェルにはそこまで心が躍らない。',icon:[24,33],power:						5,price: getCookiePrice(34)});
		
		order=10300;
		Game.NewUpgradeCookie({name:'宇宙を秘めたチョコレートバタービスケット',desc:'全ての施設を550個所有した栄誉の証です。<br>魔法や科学の妙な策略を弄してこのクッキーを見るということは、古代の星の深海をのぞき込むようなもの。このビスケットの起源は不明です。あなた達の中でも最高の研究者が知る限り、その製造過程は紙に残されることがありませんでした。ある角度から目を細めて見つめてみると、中心近くでたくさんの星が自分自身の顔の輪郭に似せて配置されていることに気づくでしょう。',icon:[27,32],power:	10,price: 999999999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		order=100;new Game.Upgrade('澗手観音','千手観音から得られる量を <b>20</b>倍 する。<q>手が震えすぎる人向け。</q>',10000000000000000000000000,[12,31]);Game.MakeTiered(Game.last,13,0);
		order=150;new Game.Upgrade('奇跡の石のマウス','クリックによるクッキー取得量が <b>CpSの1%分</b> 増加する。<q>科学でも哲学でも概念化することができない素材で構成されている。そして、やがて少年はそれをクリックする。</q>',50000000000000000000000000000,[11,31]);Game.MakeTiered(Game.last,13,11);
		order=200;new Game.TieredUpgrade('変性発生','グランマが <b>2倍</b> 効率的になる。<q>遺伝子検査によると、グランマのほとんどが変性ウイルスに感染していて、力を増しているようだ。時間が経つほどに、年を取るほどに。気を付けた方がいいだろう。</q>','グランマ',12);
		order=300;new Game.TieredUpgrade('世界種子貯蔵庫','農場が <b>2倍</b> 効率的になる。<q>アポカリプスもきっと乗り越えられる巨大な遺伝子貯蔵庫。たとえ文明が崩壊してもあなたの帝国、というより少なくとも帝国の農業の要素が生きのびることを保証する。その時はいつ来てもおかしくはない。</q>','農場',12);
		order=400;new Game.TieredUpgrade('空気採鉱','鉱山が <b>2倍</b> 効率的になる。<q>あなたは見つけたほぼすべての固体の表面をドリルで掘り進んできた。しかし、最近の進歩により、固体以外の表面にも莫大な富が隠れていることが明らかになったのを知っているだろうか?</q>','鉱山',12);
		order=500;new Game.TieredUpgrade('行動のリフレーミング','工場が <b>2倍</b> 効率的になる。<q>慎重に社会工学を駆使し、「組合」という言葉は最も下品で気に食わない汚物だけが口にするスラングであると労働者たちに思いこませてきた!時には、進歩というものは大きな機械ではなく小さな嘘の中にある。</q>','工場',12);
		order=525;new Game.TieredUpgrade('利他的ループ','銀行が <b>2倍</b> 効率的になる。<q>あなたは世界経済や立法機関に関する多くの支部を支配しているため、とりわけ独創的な抜け穴を通じて(自分自身への)寄付をすることで、始めた頃と比べてより多くの現金を税控除の対象とすることができます!</q>','銀行',12);
		order=550;new Game.TieredUpgrade('奇抜なアイデア','神殿が <b>2倍</b> 効率的になる。<q>宗教を始めても金持ちにはなれない。金持ちになりたければSFを書け。</q>','神殿',12);
		order=575;new Game.TieredUpgrade('呪文を唱える蜜蜂','魔法使いの塔が <b>2倍</b> 効率的になる。<q>あなたは魔法で強化された蜜蜂の大群を人類へ解き放った!蜂の刺すような呪文は全ての生物を破滅させるかもしれないが、あなたはおいしくて紫色で泡立つ蜂蜜をうまく活用できると確信している!</q>','魔法使いの塔',12);
		order=600;new Game.TieredUpgrade('環状体の宇宙','宇宙船が <b>2倍</b> 効率的になる。<q>宇宙をあらゆる方向に折り返したn次元の円環と考えたならば、ロケットの燃料代を節約できる。もちろん宇宙はそのような形ではないが、あなたは細かいことを気にしたことはない。</q>','宇宙船',12);
		order=700;new Game.TieredUpgrade('錬金術の調停','錬金術室が <b>2倍</b> 効率的になる。<q>ついに、現代科学とオカルトの神秘的な領域とが手を取り合う時がきた。重力子が何に変化するのか?アルカへストが中性だとしたら?ホムンクルスに選挙権を与えるべきなのか?そして好むか否かにかかわらず、他の刺激的な疑問がすぐにやってくる。</q>','錬金術室',12);
		order=800;new Game.TieredUpgrade('彼の降臨','ポータルが <b>2倍</b> 効率的になる。<q>彼が来る!彼がついにやってくる!予言の通りだ!彼がポータルを出ると同時に、あなたのエンジニアたちは彼をちょうどいい大きさに切り分け始め、もがきまわる宇宙の肉片を工場へ輸送する。工場で彼は加工され、明日発売される新しい刺激的なクッキーフレーバーとなる。</q>','ポータル',12);
		order=900;new Game.TieredUpgrade('分裂した秒','タイムマシンが <b>2倍</b> 効率的になる。<q>時間は無限にある、そうだな…しかし、もし一秒一秒の中に更に多くの無限が存在するならば?あらゆる瞬間が永遠に!どれほどのスケジュール調整の問題を解決できるか考えてみろ!</q>','タイムマシン',12);
		order=1000;new Game.TieredUpgrade('風味そのもの','反物質凝縮器が <b>2倍</b> 効率的になる。<q>地球の奥深く、最も無菌の研究室にある、これまで発明されてきた中で最も広大で高価な粒子加速器で、あなたの科学者は(ほんの一瞬ではあるが)純粋なフレーバーの物理的兆候を合成した。非常に不安定で、ほんのわずかな放射性エネルギーとなり消えたにもかかわらず、そのことへあなたのチームは震えを止められなかった、畏敬の念と…飢えのために。</q>','反物質凝縮器',12);
		order=1100;new Game.TieredUpgrade('光速制限','プリズムが <b>2倍</b> 効率的になる。<q>おおっと、速度を落とせ。光を収集するのはけっこうだが、光がそれほど速くなければもっと簡単だろ！これはありがたいことにそのことを解決してくれるはずだ。</q>','プリズム',12);
		order=1200;new Game.TieredUpgrade('ちょっとした決定論','チャンスメーカーが <b>2倍</b> 効率的になる。<q>宇宙のすべての粒子の正確な位置と動きを知ることで、起こるであろうことをすべてあなたは予測することができ、偶然起きる事象は一切残らない。それはやめたくなるほど困難なことだったが、あなたが競馬で50ドル勝つための役に立ったので、すでに成果を出せたといえる。</q>','チャンスメーカー',12);
		order=1300;new Game.TieredUpgrade('このアップグレード','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>このアップグレードのフレーバーテキストは自身を参照することを好み、そして自身を参照することを好むという事実も好む。このアップグレードがもっと不快なことを始める前に、あなたはこれを本当に購入するべきだ。</q>','自己無限生成エンジン',12);
		order=1400;new Game.TieredUpgrade('あなたの一番のファン','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>実のところ、クッキーを焼くことはそこにあるもので最適化されていない。そこであなたはあなたの一番のファンをすでに購入し、コンピューターを冷やして正常に動かすために横に設置した。クール!</q>','Javascriptコンソール',12);
		
		
		order=10020;
		Game.NewUpgradeCookie({name:'バッテンバーグビスケット',desc:'同名のケーキの影響を強く受け、同名の王子にちなんで名づけられた。あなたは、そのビスケットの上で本当に、本当に短いチェスゲームをできるな、と考えるだろう。',icon:[28,33],power:						5,price: getCookiePrice(35)});
		Game.NewUpgradeCookie({name:'ロゼットクッキー',desc:'専用のアイロンを使って作り、粉砂糖に浸けて食べる北欧の複雑なフライドペストリー。普段はおいしいおやつとして食べられているが、クリスマスツリーの飾りとして使われたり、「いやいや、お前をからかっているだけだよ」という意味を込めて襟に優雅に着飾ることもある。',icon:[26,33],power:						5,price: getCookiePrice(36)});
		Game.NewUpgradeCookie({name:'ギャングメーカー',desc:'中心にあるちょっとのラズベリージャムが重要なのだ。チョコレートをトッピングしたプレーンバタークッキーだけではギャングメイカーにはならない。',icon:[27,33],power:						5,price: getCookiePrice(37)});
		Game.NewUpgradeCookie({name:'ウェルシュケーキ',desc:'ウェルシュクッキーは、ウェルシュケーキ、ベイクストーン、グリドルケーキ、グリドルスコーン、ピックス、ウェールズ語でピカーラマイン、ピケバッホ、カーケナイクリ、テイシェナグラデスという名でも知られ、起源はわかっていないが、たくさんのフサスグリで満たされたスコーンのようなビスケットだ。',icon:[29,33],power:						5,price: getCookiePrice(38)});
		Game.NewUpgradeCookie({name:'ラズベリーチーズケーキクッキー',desc:'今は昇天したクッキーの形を取っている、地味なラズベリーチーズケーキ。すべての焼き菓子の最終形態は、収束する進化を経て、クッキー化として知られているプロセスでクッキーに近づく。その証拠がラズベリーチーズケーキクッキーであると研究者は考えている。',icon:[25,33],power:						5,price: getCookiePrice(39)});
		
		
		
		order=255;
		Game.GrandmaSynergy('対のグランマ','別のものを焼く似て非なるグランマ。','遊休宇宙');
		
		order=1500;
		new Game.TieredUpgrade('明白な宿命','遊休宇宙が <b>2倍</b> 効率的になる。<q>多元宇宙をその富のために侵略することは、一部の人間には疑わしく思えるかもしれませんが...クッキー帝国の素晴らしい言葉を未開の地域にもたらすことは我々に課せられた道徳的義務であり、いや、あなたへの正当な命令であり、ほかの連中に侵略される前にあなたがすべきことなのです!</q>','遊休宇宙',1);
		new Game.TieredUpgrade('ナッツの中の多元宇宙','遊休宇宙が <b>2倍</b> 効率的になる。<q>メタ宇宙構造はややこしく、時に矛盾しているようにさえ見えるが、今のところ以下のようにまとめられる:<br><br><div style="text-align:left;">&bull; 現実すなわち「遊休宇宙」はいずれも他の現実と並行して存在する<br><br>&bull; 多くの現実は単一品目の生産へと収束する (あなたのおかげで、我々の現実においてはその品目は明らかにクッキーである)<br><br>&bull; どの現実も(いわゆる「クッキーバース」などの)下位次元に通じる無数のカオストンネルで穴だらけになっており、まるでスイスチーズのようである<br><br>&bull; どの現実も、俗に「ミルク」として知られる、特有な性質の無限流体に浸されている</div><br>最後に、余興のために、どの現実にも「現実」という概念について独自の解釈があるようだ。</q>','遊休宇宙',2);
		new Game.TieredUpgrade('全変換','遊休宇宙が <b>2倍</b> 効率的になる。<q>遊休宇宙の法則を再配置してクッキーを代わりに生成させるようにできたのは非常に喜ばしいことだが、彼らが以前生産していた現金や宝石やチーズバーガーや子犬だとか…そういうずっと昔に廃れさせた小物の何光年もの在庫の処理問題がある。だからこそ万物変換器を開発し、征服後の無用な残骸を全て変換して、もっと沢山のクッキーの落ち着ける音が聞こえてくるようにした。</q>','遊休宇宙',3);
		new Game.TieredUpgrade('多元宇宙エージェント','遊休宇宙が <b>2倍</b> 効率的になる。<q>宇宙に潜入して、侵略の価値があるか信号を発してくる秘密スパイを送れるようになった。同化計画が開始されたら、彼らも奇妙だが縫い目のない変装セットを用いて地元住民と信頼関係を築くことで鎮圧を手伝ってくれる。</q>','遊休宇宙',4);
		new Game.TieredUpgrade('脱出計画','遊休宇宙が <b>2倍</b> 効率的になる。<q>ここで何か大問題が起こった時のために、遊休宇宙を1つここに酷似したものにテラフォームして残しておくことにした。勿論、この遊休宇宙の住民にもあなたが来襲した時に備えた退避用遊休宇宙があり、それにもまた有事用遊休宇宙だとかがある。</q>','遊休宇宙',5);
		new Game.TieredUpgrade('ゲームデザイン','遊休宇宙が <b>2倍</b> 効率的になる。<q>遊休宇宙はそれぞれ超越的プログラムに従っているという事は既知の事実。しかし、それに加えてより微細なルールでも動いているようだ。その法則を御すれば多元宇宙をどこまでも支配することが可能だろう。ルールを書き換えろ!ゲームデザイナーはあなただ!</q>','遊休宇宙',6);
		new Game.TieredUpgrade('宇宙サンドボックス','遊休宇宙が <b>2倍</b> 効率的になる。<q>まだまだ宇宙のおかわりはあるみたいだし、幾つか後腐れ無しのテスト用地として転用して、宇宙崩壊級の市場調査用に使ってみよう。（…まぁ、君にとっての後腐れ無しだけど。）</q>','遊休宇宙',7);
		new Game.TieredUpgrade('宇宙間戦争','遊休宇宙が <b>2倍</b> 効率的になる。<q>うーむ、どうやらあなたの略奪に気付いている宇宙もいるようだ。幸い、強化多元宇宙軍に予算をもっと割けばどうと言う事もないが。</q>','遊休宇宙',8);
		new Game.TieredUpgrade('可動性宙港','遊休宇宙が <b>2倍</b> 効率的になる。<q>外宇宙への移動は自然宇宙港のごく稀に起こる宇宙間一致が必要となるため割と面倒なものだ。あなたはとうとうほぼ即座に宇宙を移動する手段を完成させ、頭痛無しで多元宇宙を行き来できるようにした。遅かったじゃないの。</q>','遊休宇宙',9);
		new Game.TieredUpgrade('カプセル化現実','遊休宇宙が <b>2倍</b> 効率的になる。<q>無限の宇宙を無数の科学技術でこの小さくてぼんやり光る収納性ばっちりの球体群に縮小した。それぞれに無限の銀河とそれを支える無限の生命が入っており、想像も付かない程貴重なものなので取り扱いには細心の注意を払わなければならない。倉庫でのボウリング会では高品質なボールになる事も判明した。</q>','遊休宇宙',10);
		new Game.TieredUpgrade('外因性クリック','遊休宇宙が <b>2倍</b> 効率的になる。<q>遊休宇宙はつつくと作業が早く終わるようだ。それと、兆にも及ぶ恐怖の悲鳴がユニゾンで聞こえてくるのも非常に楽しい。</q>','遊休宇宙',11);
		new Game.TieredUpgrade('ユニバーサル・アイドリング','遊休宇宙が <b>2倍</b> 効率的になる。<q>遊休宇宙の本質とは待つ事にあり。待てば待つほど、指数関数的に効能が増す - そして作業も大幅に少なくなる。新しく宇宙を集める際には真の禅状態で待つことにして、高品質なワインのように宇宙を熟成させよう。</q>','遊休宇宙',12);
		
		order=5000;
		Game.SynergyUpgrade('多孔ミルフィーユ宇宙','<q>言うなれば何重にも何重にも重なった層をイメージしてみよう。次に思い浮かべてほしいのは、その中全体を無数のワームが掘り進めている様子だ。これが自然界の最も基本的な階層を、完全ではないが、ざっくりと近似したものだ。</q>','遊休宇宙','ポータル','synergy1');
		Game.SynergyUpgrade('下位宇宙と多元宇宙','<q>宇宙の中の宇宙?なんて破壊的だ!</q>','遊休宇宙','自己無限生成エンジン','synergy2');
		
		order=19000;
		new Game.TieredUpgrade('幸運 No.018','遊休宇宙が <b>7%</b> より効果を発揮し、 <b>7%</b> 安くなる。<q>みんなはたくさんいるが、あなたはひとりしかいない。</q>','遊休宇宙','fortune');
		
		order=10300;
		Game.NewUpgradeCookie({name:'バタービスケット(バターを添えて)',desc:'全ての施設を600個所有した栄誉の証です。<br>これはプレーンのバタービスケットです。これにはバターが塗ってあります。バターは特に何かに似ているわけではありません。',icon:[30,33],power:	10,price: 999999999999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		
		order=200;new Game.TieredUpgrade('雑談','グランマが <b>2倍</b> 効率的になる。<q>大規模な二重盲検(被験者数: 1200万人)において、たまに立ち寄って挨拶をするだけでグランマの生産性が最大で2倍になる、ということが発覚した。お見舞いするのもいいことなんだね!(いかなる状況においても、グランマにより提供されたお茶やそれに類するものを摂取しないように。)</q>','グランマ',13);
		order=300;new Game.TieredUpgrade('逆菜食主義','農場が <b>2倍</b> 効率的になる。<q>植物は食べるためのものではない、植物は搾取的な農業と天文学的な利益率のためのものだ!</q>','農場',13);
		order=400;new Game.TieredUpgrade('キャラメル合金','鉱山が <b>2倍</b> 効率的になる。<q>あなたの雇った地質学者は、化合することでより多くのクッキー成分に変わるかもしれないような、かつて見落とされてきた砂糖鉱石の一群を分離してきた。おそらく、数百万マイルに及ぶこれまでの無駄なトンネルには非常識な量の材料が保有されていることだろう!</q>','鉱山',13);
		order=500;new Game.TieredUpgrade('無限エンジン','工場が <b>2倍</b> 効率的になる。<q>この家では、熱力学の法則をあまり気にしなくてよいようだ。</q>','工場',13);
		order=525;new Game.TieredUpgrade('所得申告の減額','銀行が <b>2倍</b> 効率的になる。<q>うわー、ちっちゃい!もっと早く思いついてくれればなあ!</q>','銀行',13);
		order=550;new Game.TieredUpgrade('出現','神殿が <b>2倍</b> 効率的になる。<q>あなたは神、天使、昇天した預言者、あるいは他の神聖な者による、週一回のこの世への出現をスケジュールするという上層部との取引を予約した。これによって、きちんと時間枠を確保している限り、若者の間におけるクッキーの宗教への関心を高められるだろう。</q>','神殿',13);
		order=575;new Game.TieredUpgrade('魔法の地下室','魔法使いの塔が <b>2倍</b> 効率的になる。<q>あなたは各魔法使いの塔の下に地下室を建設する許可を得た。そこは貴重な試薬、消えゆくソウルジェム、奇妙な古雑誌のための便利な保管場所となる。</q>','魔法使いの塔',13);
		order=600;new Game.TieredUpgrade('最も重要な指令','宇宙船が <b>2倍</b> 効率的になる。<q>銀河間の代表団は、レッサーエイリアンの文化と直接交流しないことをあなたと指切りげんまんで約束した。それはそれでいい。何が起きているのか住人が知らないうちに、盲目的に惑星を奪うほうがずっと楽しいからね。</q>','宇宙船',13);
		order=700;new Game.TieredUpgrade('色彩のサイクル','錬金術室が <b>2倍</b> 効率的になる。<q>物質のすべての状態は、連続したループの中に存在する。そのループを循環させる方法を学んだならば、必要とする状態で物質を冷凍するだけでいい。参考までに、物質がクッキーの状態は正確には163.719°に位置しており、ちょうど層状ガスとメタプラズマの間である。</q>','錬金術室',13);
		order=800;new Game.TieredUpgrade('家庭用の裂け目','ポータルが <b>2倍</b> 効率的になる。<q>あなたは、建物の壁に貼りつけるだけで異常な形状で部屋同士をつなげる、十分に便利で法的に安全なポータルを何とか製造した。実際には、これは従業員のトイレ休憩の時間を短くすることを意味している。</q>','ポータル',13);
		order=900;new Game.TieredUpgrade('忍耐の廃止','タイムマシンが <b>2倍</b> 効率的になる。<q>あなたは誰も待たない。</q>','タイムマシン',13);
		order=1000;new Game.TieredUpgrade('おいしい引力','反物質凝縮器が <b>2倍</b> 効率的になる。<q>宇宙の4つの基本的な力 -重力相互作用、電磁相互作用、弱い相互作用、強い相互作用- に加えて、シュガーボース粒子によって媒介される第5の力の存在をあなたの科学者たちはついに確認した。この力により、十分な時間をかけて、材料のような物質の任意の2つのかたまりが最終的に互いに出会うことで3番目のよりおいしい物質を作り出す。あなたのチームは張り切ってその力においしい引力と名付けた。</q>','反物質凝縮器',13);
		order=1100;new Game.TieredUpgrade('オッカムのレーザー','プリズムが <b>2倍</b> 効率的になる。<q>1<span></span>327年にオッカムのフランシスコ会修道士ウィリアムによって発明された。10億件の適用ができ、その中には恐ろしく破壊的なものも含むような光の理論の非常に賢い使用法。ちょうど今、特許失効してパブリックドメインとなるまで、数百年の間、一枚の山羊革の羊皮紙に封印されていた。</q>','プリズム',13);
		order=1200;new Game.TieredUpgrade('いい流れ','チャンスメーカーが <b>2倍</b> 効率的になる。<q>少し時間を取り、君がどれ程遠くまで来たか認識してみよう。これまでどれほど幸運だっただろうか。そこから傾向を推定するのに天才統計学者は必要ない。今の君に悪いことが起こるわけがない。そうだろう?</q>','チャンスメーカー',13);
		order=1300;new Game.TieredUpgrade('箱','自己無限生成エンジンが <b>2倍</b> 効率的になる。<q>その箱の中身は?おや、それは君のオフィスの小さなレプリカだ!そして、そこには小さな君もいる!そして小さな机の上にあるものは…もっと小さな箱だ!そして小さな君が箱を開けると、もっと小さなオフィスが現れる!そしてそのもっと小さなオフィスにあるものは…うーん。君はこれの使い道をいくつか考えられるね。</q>','自己無限生成エンジン',13);
		order=1400;new Game.TieredUpgrade('ハッカーの陰','Javascriptコンソールが <b>2倍</b> 効率的になる。<q>私は中にいる。</q>','Javascriptコンソール',13);
		order=1500;new Game.TieredUpgrade('第五の壁を破れ','遊休宇宙が <b>2倍</b> 効率的になる。<q>へぇ、こんなのが昔からあったのか?何にせよ、今や形無しだ。そして向こう側にある物は全てあなたの物だ。</q>','遊休宇宙',13);
		
		
		new Game.Upgrade('猫好きおばさん','それぞれの猫系アップグレードによりグランマのCpSを <b>29%</b> ブーストされる。<q>いやいや…ああ、いや、いや、いや。ああ……これは全然ダメだ。</q>',9000000000,[32,3]);Game.last.pool='prestige';Game.last.parents=['子猫の天使'];
		new Game.Upgrade('ミルクヘルプ&reg; 乳糖不耐症安心タブレット','それぞれのミルクの等級によりグランマのCpSを <b>5%</b> ブーストされる。<q>ミルクのように熟成されています。</q>',900000000000,[33,3]);Game.last.pool='prestige';Game.last.parents=['猫好きおばさん'];
		
		new Game.Upgrade('オーラグローブ','カーソルのレベル1つにつきクリックが <b>5%</b> ブーストされる (最大カーソルレベル10まで)。<q>これを着けてる人とハイタッチしないでね。手を汚さないようにね。</q>',555555555,[32,4]);Game.last.pool='prestige';Game.last.parents=['神々しい手袋'];
		new Game.Upgrade('発光グローブ','<b>オーラを纏ったグローブ</b> がカーソルレベル20まで効果を発揮するようになる。<q>これらはクリックを不条理なレベルまでパワーアップさせるのに役立ちますが、グローブワールドからの帰り道に暗闇を照らしたいときにもかなり便利です。</q>',55555555555,[33,4]);Game.last.pool='prestige';Game.last.parents=['オーラグローブ'];
		
		order=10020;
		Game.NewUpgradeCookie({name:'ボッケンパウチ',desc:'2つのメレンゲを半々の割合でバタークリームでつないだもので出来ており、両端をチョコレートでコーティングする。2回何かに踏み入った山羊の脚が名前の由来である。',icon:[32,8],power:						5,price: getCookiePrice(40)});
		Game.NewUpgradeCookie({name:'ファットラスカル',desc:'豊かな歴史とより豊かなレシピを持つアーモンドたっぷりのヨークシャーケーキ。ダイエットを意識している人にはカロリーの少ない方である「スキニースカリーワグ」をお勧めします。',icon:[33,8],power:						5,price: getCookiePrice(41)});
		Game.NewUpgradeCookie({name:'イシュラクッキー',desc:'このクッキーはオーストリアハンガリー帝国を起源とし、東欧のすべての国に広がり、たくさんのレシピが生まれてそれぞれが起源を主張している。すべてのバリエーションで基本は変わらないままであり、チョコレートバタークリームを2枚のビスケットで挟んだものである。いや、ジャムだったかな?',icon:[32,9],power:						5,price: getCookiePrice(42)});
		Game.NewUpgradeCookie({name:'抹茶クッキー',desc:'緑茶とクッキー、天国製の抹茶。',icon:[33,9],power:						5,price: getCookiePrice(42)});
		
		order=10032;
		Game.NewUpgradeCookie({name:'アールグレイマカロン',desc:'熱々が一番おいしいよ、ぜひ!',icon:[32,10],require:'マカロンの箱入りセット',							power:3,price: 9999999999999999999999999999});
		
		order=10030;
		Game.NewUpgradeCookie({name:'ポッキー',desc:'クラスメートをつつくのが楽しいことから名づけられたと思われているが、実際はポッキーブランドビスケットスティックの禁煙の刑務所における人気から名づけられ、そこではたばこの代わりに密輸されて取引されている。',icon:[33,10],require:'ブランドビスケットの箱入りセット',power:												2,	price:	999999999999999999999999999999999999*5});
		
		order=10000;
		Game.NewUpgradeCookie({name:'カシューナッツクッキー',desc:'カシューについて話そうか。カシューとはナッツではなく、奇妙な赤や黄色の果物でできる種だ。その果物はそのまま食べたり、ドリンクにすることができる。そのナッツを包む殻には、長時間触りすぎると手が汚れたり、炎症を起こしてしまう不快な物質が含まれてるよ。でも大丈夫、今この文章を読んだなら、君はクッキーに入れないよう気をつけるだろうね!え、もういっぱい食べちゃったの?じゃあいいや。',icon:[32,7],power:							2,	price:	99999999});
		order=10001;
		Game.NewUpgradeCookie({name:'ミルクチョコレートクッキー',desc:'チョコレートミルクの奇妙な逆転。ホワイトチョコレートはちょっとハードコアすぎるがダークチョコレートはハードコアさが足りないという人に。',icon:[33,7],power:2,	price:	99999999*5});
		
		//end of upgrades
		
		Game.seasons={
			'christmas':{name:'クリスマス',start:'クリスマスの季節がやってきた!',over:'クリスマスの季節は過ぎ去った。',trigger:'お祭りビスケット'},
			'valentines':{name:'バレンタインデー',start:'バレンタインデーがやってきた!',over:'バレンタインデーは過ぎ去った。',trigger:'恋煩いのビスケット'},
			'fools':{name:'ビジネスデー',start:'ビジネスデーがやってきた!',over:'ビジネスデーは過ぎ去った。',trigger:'うそつきビスケット'},
			'easter':{name:'イースター',start:'イースターの季節がやってきた!',over:'イースターの季節は過ぎ去った。',trigger:'うさぎのビスケット'},
			'halloween':{name:'ハロウィン',start:'ハロウィンがやってきた!',over:'ハロウィンは過ぎ去った。',trigger:'お化けなビスケット'}
		};
		
		Game.listTinyOwnedUpgrades=function(arr)
		{
			var str='';
			for (var i=0;i<arr.length;i++)
			{
				if (Game.Has(arr[i]))
				{
					var it=Game.Upgrades[arr[i]];
					str+='<div class="icon" style="vertical-align:middle;display:inline-block;'+(it.icon[2]?'background-image:url('+it.icon[2]+');':'')+'background-position:'+(-it.icon[0]*48)+'px '+(-it.icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div>';
				}
			}
			return str;
		}
		
		Game.santaDrops=['陽気さ増量','うきうき気分増進','石炭の塊','むず痒いセーター','地を焼くトナカイ','重いソリ','笑い声風味の砂糖衣','セール期間','玩具工房','いたずらリスト','サンタの四次元かばん','サンタのお手伝い','サンタの遺物','サンタの牛乳とクッキー'];
		
		Game.GetHowManySantaDrops=function()
		{
			var num=0;
			for (var i in Game.santaDrops) {if (Game.Has(Game.santaDrops[i])) num++;}
			return num;
		}
		
		Game.reindeerDrops=['クリスマスツリービスケット','雪の結晶ビスケット','雪だるまビスケット','ヒイラギビスケット','キャンディケインビスケット','鐘ビスケット','プレゼント箱ビスケット'];
		Game.GetHowManyReindeerDrops=function()
		{
			var num=0;
			for (var i in Game.reindeerDrops) {if (Game.Has(Game.reindeerDrops[i])) num++;}
			return num;
		}
		/*for (var i in Game.santaDrops)
		{
			Game.Upgrades[Game.santaDrops[i]].descFunc=function(){return '<div style="text-align:center;">You currently own <b>'+Game.GetHowManySantaDrops()+'/'+Game.santaDrops.length+'</b> of Santa\'s gifts.</div><div class="line"></div>'+this.desc;};
		}*/
		
		Game.seasonDrops=Game.heartDrops.concat(Game.halloweenDrops).concat(Game.easterEggs).concat(Game.santaDrops).concat(Game.reindeerDrops);
		
		Game.saySeasonSwitchUses=function()
		{
			if (Game.seasonUses==0) return 'この周回ではまだ季節を切り替えていません。';
			return 'この周回で <b>'+(Game.seasonUses==1?'1回':Game.seasonUses==2?'2回':(Game.seasonUses+'回'))+'</b> 季節を切り替えました。';
		}
		Game.Upgrades['お祭りビスケット'].descFunc=function(){return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.santaDrops)+'<br><br>サンタの贈り物を <b>'+Game.GetHowManySantaDrops()+'/'+Game.santaDrops.length+'</b> 購入した。<div class="line"></div>'+Game.listTinyOwnedUpgrades(Game.reindeerDrops)+'<br><br>トナカイのクッキーを <b>'+Game.GetHowManyReindeerDrops()+'/'+Game.reindeerDrops.length+'</b> 購入した。<div class="line"></div>'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.desc;};
		Game.Upgrades['うさぎのビスケット'].descFunc=function(){return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.easterEggs)+'<br><br>卵を <b>'+Game.GetHowManyEggs()+'/'+Game.easterEggs.length+'</b> 購入した。<div class="line"></div>'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.desc;};
		Game.Upgrades['お化けなビスケット'].descFunc=function(){return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.halloweenDrops)+'<br><br>ハロウィンクッキーを <b>'+Game.GetHowManyHalloweenDrops()+'/'+Game.halloweenDrops.length+'</b> 購入した。<div class="line"></div>'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.desc;};
		Game.Upgrades['恋煩いのビスケット'].descFunc=function(){return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.heartDrops)+'<br><br>ハートのビスケットを <b>'+Game.GetHowManyHeartDrops()+'/'+Game.heartDrops.length+'</b> 購入した。<div class="line"></div>'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.desc;};
		Game.Upgrades['うそつきビスケット'].descFunc=function(){return '<div style="text-align:center;">'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.desc;};
		
		Game.computeSeasonPrices=function()
		{
			for (var i in Game.seasons)
			{
				Game.seasons[i].triggerUpgrade.priceFunc=function(){
					var m=1;
					if (Game.hasGod)
					{
						var godLvl=Game.hasGod('seasons');
						if (godLvl==1) m*=2;
						else if (godLvl==2) m*=1.50;
						else if (godLvl==3) m*=1.25;
					}
					//return Game.seasonTriggerBasePrice*Math.pow(2,Game.seasonUses)*m;
					//return Game.cookiesPs*60*Math.pow(1.5,Game.seasonUses)*m;
					return Game.seasonTriggerBasePrice+Game.unbuffedCps*60*Math.pow(1.5,Game.seasonUses)*m;
				}
			}
		}
		Game.computeSeasons=function()
		{
			for (var i in Game.seasons)
			{
				var me=Game.Upgrades[Game.seasons[i].trigger];
				Game.seasons[i].triggerUpgrade=me;
				me.pool='toggle';
				me.buyFunction=function()
				{
					Game.seasonUses+=1;
					Game.computeSeasonPrices();
					//Game.Lock(this.name);
					for (var i in Game.seasons)
					{
						var me=Game.Upgrades[Game.seasons[i].trigger];
						if (me.name!=this.name) {Game.Lock(me.name);Game.Unlock(me.name);}
					}
					if (Game.season!='' && Game.season!=this.season)
					{
						var str=Game.seasons[Game.season].over+'<div class="line"></div>';
						if (Game.prefs.popups) Game.Popup(str);
						else Game.Notify(str,'',Game.seasons[Game.season].triggerUpgrade.icon,4);
					}
					Game.season=this.season;
					Game.seasonT=Game.getSeasonDuration();
					Game.storeToRefresh=1;
					Game.upgradesToRebuild=1;
					Game.Objects['グランマ'].redraw();
					var str=Game.seasons[this.season].start+'<div class="line"></div>';
					if (Game.prefs.popups) Game.Popup(str);
					else Game.Notify(str,'',this.icon,4);
				}
				
				me.clickFunction=function(me){return function()
				{
					//undo season
					if (me.bought && Game.season && me==Game.seasons[Game.season].triggerUpgrade)
					{
						me.lose();
						var str=Game.seasons[Game.season].over;
						if (Game.prefs.popups) Game.Popup(str);
						else Game.Notify(str,'',Game.seasons[Game.season].triggerUpgrade.icon);
						if (Game.Has('季節切り替え装置')) {Game.Unlock(Game.seasons[Game.season].trigger);Game.seasons[Game.season].triggerUpgrade.bought=0;}
						
						Game.upgradesToRebuild=1;
						Game.recalculateGains=1;
						Game.season=Game.baseSeason;
						Game.seasonT=-1;
						PlaySound('snd/tick.mp3');
						return false;
					}
					else return true;
				};}(me);
				
				me.displayFuncWhenOwned=function(){return '<div style="text-align:center;">残り時間 :<br><b>'+(Game.Has('永遠の季節')?'永久':Game.sayTime(Game.seasonT,-1))+'</b><div style="font-size:80%;">(再度クリックして季節を中止します)</div></div>';}
				me.timerDisplay=function(upgrade){return function(){if (!Game.Upgrades[upgrade.name].bought || Game.Has('永遠の季節')) return -1; else return 1-Game.seasonT/Game.getSeasonDuration();}}(me);
				
			}
		}
		Game.getSeasonDuration=function(){return Game.fps*60*60*24;}
		Game.computeSeasons();
		
		//alert untiered building upgrades
		for (var i in Game.Upgrades)
		{
			var me=Game.Upgrades[i];
			if (me.order>=200 && me.order<2000 && !me.tier && me.name.indexOf('グランマ')==-1 && me.pool!='prestige') console.log(me.name+' has no tier.');
		}
		
		Game.UpgradesByPool={'kitten':[]};
		for (var i in Game.Upgrades)
		{
			if (!Game.UpgradesByPool[Game.Upgrades[i].pool]) Game.UpgradesByPool[Game.Upgrades[i].pool]=[];
			Game.UpgradesByPool[Game.Upgrades[i].pool].push(Game.Upgrades[i]);
			if (Game.Upgrades[i].kitten) Game.UpgradesByPool['kitten'].push(Game.Upgrades[i]);
		}
		
		Game.PrestigeUpgrades=[];
		for (var i in Game.Upgrades)
		{
			if (Game.Upgrades[i].pool=='prestige' || Game.Upgrades[i].pool=='prestigeDecor')
			{
				Game.PrestigeUpgrades.push(Game.Upgrades[i]);
				Game.Upgrades[i].posX=0;
				Game.Upgrades[i].posY=0;
				if (Game.Upgrades[i].parents.length==0 && Game.Upgrades[i].name!='遺産') Game.Upgrades[i].parents=['遺産'];
				for (var ii in Game.Upgrades[i].parents) {Game.Upgrades[i].parents[ii]=Game.Upgrades[Game.Upgrades[i].parents[ii]];}
			}
		}
		
		Game.goldenCookieUpgrades=['うまくいったぜ','吉日','発見能力','素晴らしき幸運','安定した運勢','逃れられぬ運命','ラッキーな桁','ラッキーナンバー','ラッキーな支払い','金のガチョウの卵'];
		
		Game.cookieUpgrades=[];
		for (var i in Game.Upgrades)
		{
			var me=Game.Upgrades[i];
			if ((me.pool=='cookie' || me.pseudoCookie)) Game.cookieUpgrades.push(me);
			if (me.tier) Game.Tiers[me.tier].upgrades.push(me);
		}
		for (var i in Game.UnlockAt){Game.Upgrades[Game.UnlockAt[i].name].unlockAt=Game.UnlockAt[i];}
		for (var i in Game.Upgrades){if (Game.Upgrades[i].pool=='prestige') Game.Upgrades[i].order=Game.Upgrades[i].id;}
		
		/*var oldPrestigePrices={"Chimera":5764801,"Synergies Vol. I":2525,"Synergies Vol. II":252525,"Label printer":9999};
		for (var i in oldPrestigePrices){Game.Upgrades[i].basePrice=oldPrestigePrices[i];}*/
		
		Game.UpgradePositions={141:[176,-66],181:[-555,-93],253:[-272,-231],254:[-99,-294],255:[-193,-279],264:[48,123],265:[133,154],266:[223,166],267:[305,137],268:[382,85],269:[-640,42],270:[-614,-268],271:[-728,-120],272:[-688,-205],273:[-711,-31],274:[270,-328],275:[317,-439],276:[333,-556],277:[334,-676],278:[333,-796],279:[328,-922],280:[303,-1040],281:[194,-230],282:[-265,212],283:[-321,297],284:[-322,406],285:[-243,501],286:[-403,501],287:[-314,606],288:[-312,-374],289:[-375,-502],290:[-165,-413],291:[453,-745],292:[-375,-651],293:[-399,-794],323:[-78,109],325:[192,-1127],326:[-328,-158],327:[-192,290],328:[-3,237],329:[92,376],353:[121,-326],354:[77,-436],355:[64,-548],356:[57,-673],357:[52,-793],358:[58,-924],359:[82,-1043],360:[-188,408],362:[158,289],363:[-30,-30],364:[-232,-730],365:[-77,349],368:[-55,-455],393:[196,-714],394:[197,-964],395:[-143,-140],396:[-264,-889],397:[-69,563],408:[-204,-1036],409:[-72,-1152],410:[-70,-1328],411:[-388,137],412:[-470,253],413:[-482,389],449:[-367,-1113],450:[-334,-1214],451:[-278,-1303],495:[-402,-966],496:[200,49],505:[-545,-570],520:[-279,-8],537:[-907,-131],539:[-508,-1270],540:[-629,-1291],541:[-594,-1186],542:[-548,-1374],561:[300,-17],562:[52,646],591:[154,744],592:[180,608],643:[-121,710],646:[457,-906],647:[-122,205],717:[589,-772],718:[622,-649],719:[-215,-526],720:[-96,-575],};
		
		for (var i in Game.UpgradePositions) {Game.UpgradesById[i].posX=Game.UpgradePositions[i][0];Game.UpgradesById[i].posY=Game.UpgradePositions[i][1];}
		
		
		/*=====================================================================================
		ACHIEVEMENTS
		=======================================================================================*/		
		Game.Achievements=[];
		Game.AchievementsById=[];
		Game.AchievementsN=0;
		Game.AchievementsOwned=0;
		Game.Achievement=function(name,desc,icon)
		{
			this.id=Game.AchievementsN;
			this.name=name;
			this.desc=desc;
			this.baseDesc=this.desc;
			this.desc=BeautifyInText(this.baseDesc);
			this.icon=icon;
			this.won=0;
			this.disabled=0;
			this.order=this.id;
			if (order) this.order=order+this.id*0.001;
			this.pool='normal';
			this.vanilla=Game.vanilla;
			this.type='achievement';
			
			this.click=function()
			{
				if (this.clickFunction) this.clickFunction();
			}
			Game.last=this;
			Game.Achievements[this.name]=this;
			Game.AchievementsById[this.id]=this;
			Game.AchievementsN++;
			return this;
		}
		
		Game.Win=function(what)
		{
			if (typeof what==='string')
			{
				if (Game.Achievements[what])
				{
					if (Game.Achievements[what].won==0)
					{
						var name=Game.Achievements[what].shortName?Game.Achievements[what].shortName:Game.Achievements[what].name;
						Game.Achievements[what].won=1;
						if (Game.prefs.popups) Game.Popup('実績を解除しました :<br>'+name);
						else Game.Notify('実績を解除しました','<div class="title" style="font-size:18px;margin-top:-2px;">'+name+'</div>',Game.Achievements[what].icon);
						if (Game.CountsAsAchievementOwned(Game.Achievements[what].pool)) Game.AchievementsOwned++;
						Game.recalculateGains=1;
					}
				}
			}
			else {for (var i in what) {Game.Win(what[i]);}}
		}
		Game.RemoveAchiev=function(what)
		{
			if (Game.Achievements[what])
			{
				if (Game.Achievements[what].won==1)
				{
					Game.Achievements[what].won=0;
					if (Game.CountsAsAchievementOwned(Game.Achievements[what].pool)) Game.AchievementsOwned--;
					Game.recalculateGains=1;
				}
			}
		}
		Game.Achievement.prototype.toggle=function()//cheating only
		{
			if (!this.won)
			{
				Game.Win(this.name);
			}
			else
			{
				Game.RemoveAchiev(this.name);
			}
			if (Game.onMenu=='stats') Game.UpdateMenu();
		}
		
		Game.CountsAsAchievementOwned=function(pool)
		{
			if (pool=='' || pool=='normal') return true; else return false;
		}
		
		Game.HasAchiev=function(what)
		{
			return (Game.Achievements[what]?Game.Achievements[what].won:0);
		}
		
		Game.TieredAchievement=function(name,desc,building,tier)
		{
			var achiev=new Game.Achievement(name,desc,Game.GetIcon(building,tier));
			Game.SetTier(building,tier);
			return achiev;
		}
		
		Game.ProductionAchievement=function(name,building,tier,q,mult)
		{
			var building=Game.Objects[building];
			var icon=[building.iconColumn,22];
			var n=12+building.n+(mult||0);
			if (tier==2) {icon[1]=23;n+=7;}
			else if (tier==3) {icon[1]=24;n+=14;}
			var pow=Math.pow(10,n);
			var achiev=new Game.Achievement(name,'<b>'+toFixed(pow)+'</b> クッキーを'+building.plural+'のみで生産する。'+(q?'<q>'+q+'</q>':''),icon);
			building.productionAchievs.push({pow:pow,achiev:achiev});
			return achiev;
		}
		
		Game.thresholdIcons=[0,1,2,3,4,5,6,7,8,9,10,11,18,19,20,21,22,23,24,25,26,27,28,29,21,22,23,24,25,26,27,28,29,21,22,23,24,25,26,27,28,29];
		Game.BankAchievements=[];
		Game.BankAchievement=function(name,q)
		{
			var threshold=Math.pow(10,Math.floor(Game.BankAchievements.length*1.5+2));
			var descthreshold='1';
			if(Game.BankAchievements.length>0){
				for(var i=0;i<Math.floor(Game.BankAchievements.length*1.5+2);i++){
					if((Math.floor(Game.BankAchievements.length*1.5+2)-i)%3==0){
						descthreshold+=',';
					}
					descthreshold+='0';
				}
			}
			if (Game.BankAchievements.length==0) threshold=1;
			var achiev=new Game.Achievement(name,'1回の周回で <b>'+toFixed(threshold)+'</b> クッキー焼く。'+(q?('<q>'+q+'</q>'):''),[Game.thresholdIcons[Game.BankAchievements.length],(Game.BankAchievements.length>32?1:Game.BankAchievements.length>23?2:5)]);
			achiev.threshold=threshold;
			achiev.order=100+Game.BankAchievements.length*0.01;
			Game.BankAchievements.push(achiev);
			return achiev;
		}
		Game.CpsAchievements=[];
		Game.CpsAchievement=function(name,q)
		{
			var threshold=Math.pow(10,Math.floor(Game.CpsAchievements.length*1.2));
			var descthreshold='1';
			for(var i=0;i<Math.floor(Game.CpsAchievements.length*1.2);i++){
				if((Math.floor(Game.CpsAchievements.length*1.2)-i)%3==0){
					descthreshold+=',';
				}
				descthreshold+='0';
			}
			//if (Game.CpsAchievements.length==0) threshold=1;
			var achiev=new Game.Achievement(name,'毎秒 <b>'+toFixed(threshold)+'</b> クッキー焼く。'+(q?('<q>'+q+'</q>'):''),[Game.thresholdIcons[Game.CpsAchievements.length],(Game.CpsAchievements.length>32?1:Game.CpsAchievements.length>23?2:5)]);
			achiev.threshold=threshold;
			achiev.order=200+Game.CpsAchievements.length*0.01;
			Game.CpsAchievements.push(achiev);
			return achiev;
		}
		
		//define achievements
		//WARNING : do NOT add new achievements in between, this breaks the saves. Add them at the end !
		
		var order=0;//this is used to set the order in which the items are listed
		
		Game.BankAchievement('目覚めの一焼き');
		Game.BankAchievement('生地をちょっと焼いた');
		Game.BankAchievement('だからすぐに焼くのだ');
		Game.BankAchievement('駆け出しのベーカリー');
		Game.BankAchievement('裕福なベーカリー');
		Game.BankAchievement('世界的に有名なベーカリー');
		Game.BankAchievement('宇宙のベーカリー');
		Game.BankAchievement('銀河のベーカリー');
		Game.BankAchievement('万物のベーカリー');
		Game.BankAchievement('時間を超越したベーカリー');
		Game.BankAchievement('無限のベーカリー');
		Game.BankAchievement('不死身のベーカリー');
		Game.BankAchievement('止めないでくれ');
		Game.BankAchievement('もうやめていいよ');
		Game.BankAchievement('ずっとずっとクッキー');
		Game.BankAchievement('やりすぎ');
		
		Game.CpsAchievement('ゆったりクッキー作り');
		Game.CpsAchievement('がっつりクッキー作り');
		Game.CpsAchievement('安定生産');
		Game.CpsAchievement('クッキー・モンスター');
		Game.CpsAchievement('大量生産者');
		Game.CpsAchievement('クッキー旋風');
		Game.CpsAchievement('クッキーパルサー');
		Game.CpsAchievement('クッキークエーサー');
		Game.CpsAchievement('おーい、そこにいるかい');
		Game.CpsAchievement('もうやめよう');
		
		order=30010;
		new Game.Achievement('犠牲','<b>1,000,000</b> クッキー焼いて昇天する。<q>得やすいものは失いやすい、ってね。</q>',[11,6]);
		new Game.Achievement('忘却','<b>1,000,000,000</b> クッキー焼いて昇天する。<q>さて、戻るか。</q>',[11,6]);
		new Game.Achievement('最初から','<b>1,000,000,000,000</b> クッキー焼いて昇天する。<q>まあ、楽しかったよ。</q>',[11,6]);
		
		order=11010;
		new Game.Achievement('無クリック','<b>15回</b> 以内のクリックで <b>1,000,000</b> クッキー焼く。',[12,0]);//Game.last.pool='shadow';
		order=1000;
		new Game.Achievement('ファンタスティックリック','クリックで <b>1,000</b> クッキー生産する。',[11,0]);
		new Game.Achievement('クリック競技','クリックで <b>100,000</b> クッキー生産する。',[11,1]);
		new Game.Achievement('クリックオリンピック','クリックで <b>10,000,000</b> クッキー生産する。',[11,2]);
		new Game.Achievement('クリック主義','クリックで <b>1,000,000,000</b> クッキー生産する。',[11,13]);
		
		order=1050;
		new Game.Achievement('クリック','<b>1</b> カーソル所持する。',[0,0]);
		new Game.Achievement('ダブルクリック','<b>2</b> カーソル所持する。',[0,6]);
		new Game.Achievement('マウスホイール','<b>50</b> カーソル所持する。',[1,6]);
		new Game.Achievement('二十日鼠と人間','<b>100</b> カーソル所持する。',[0,1]);
		new Game.Achievement('指人間','<b>200</b> カーソル所持する。',[0,2]);
		
		order=1100;
		new Game.Achievement('背徳','グランマを売却する。<q>愛しているんじゃなかったの?</q>',[10,9]);
		Game.TieredAchievement('グランマのクッキー','<b>1</b> グランマ所持する。','グランマ',1);
		Game.TieredAchievement('キスだらけ','<b>50</b> グランマ所持する。','グランマ',2);
		Game.TieredAchievement('老人ホーム','<b>100</b> グランマ所持する。','グランマ',3);
		
		order=1200;
		Game.TieredAchievement('農場を買った','<b>1</b> 農場所持する。','農場',1);
		Game.TieredAchievement('蒔いた種は自分で刈り取れ','<b>50</b> 農場所持する。','農場',2);
		Game.TieredAchievement('農業病','<b>100</b> 農場所持する。','農場',3);
		
		order=1400;
		Game.TieredAchievement('生産連鎖','<b>1</b> 工場所持する。','工場',1);
		Game.TieredAchievement('産業革命','<b>50</b> 工場所持する。','工場',2);
		Game.TieredAchievement('地球温暖化','<b>100</b> 工場所持する。','工場',3);
		
		order=1300;
		Game.TieredAchievement('言われなくても掘るさ','<b>1</b> 鉱山所持する。','鉱山',1);
		Game.TieredAchievement('掘削場','<b>50</b> 鉱山所持する。','鉱山',2);
		Game.TieredAchievement('惑星空洞化説','<b>100</b> 鉱山所持する。','鉱山',3);
		
		order=1500;
		Game.TieredAchievement('探検のはじまり','<b>1</b> 宇宙船所持する。','宇宙船',1);
		Game.TieredAchievement('天の川高速道路','<b>50</b> 宇宙船所持する。','宇宙船',2);
		Game.TieredAchievement('もっともっと遠くへ','<b>100</b> 宇宙船所持する。','宇宙船',3);
		
		order=1600;
		Game.TieredAchievement('変成','<b>1</b> 錬金術室所持する。','錬金術室',1);
		Game.TieredAchievement('一変','<b>50</b> 錬金術室所持する。','錬金術室',2);
		Game.TieredAchievement('ゴールドメンバー','<b>100</b> 錬金術室所持する。','錬金術室',3);
		
		order=1700;
		Game.TieredAchievement('ホール・ニュー・ワールド','<b>1</b> ポータル所持する。','ポータル',1);
		Game.TieredAchievement('思考革命','<b>50</b> ポータル所持する。','ポータル',2);
		Game.TieredAchievement('時空移動','<b>100</b> ポータル所持する。','ポータル',3);
		
		order=1800;
		Game.TieredAchievement('タイムワープ','<b>1</b> タイムマシン所持する。','タイムマシン',1);
		Game.TieredAchievement('異なる時系列','<b>50</b> タイムマシン所持する。','タイムマシン',2);
		Game.TieredAchievement('歴史改変','<b>100</b> タイムマシン所持する。','タイムマシン',3);
		
		
		order=7000;
		new Game.Achievement('ひとつひとつ','すべての施設を <b>1個以上</b> 所持する。',[2,7]);
		new Game.Achievement('数学者','<b>最も高価な施設を1個以上、2番目に高価な施設を2個以上、次に高価な施設を4個以上</b>、以下同様に所持する(上限は128個)。',[23,12]);
		new Game.Achievement('10進法','<b>最も高価な施設を10個以上、2番目に高価な施設を20個以上、次に高価な施設を30個以上</b>、以下同様に所持する。',[23,12]);
		
		order=10000;
		new Game.Achievement('金のクッキー','<b>ゴールデンクッキー</b> をクリックする。',[10,14]);
		new Game.Achievement('ラッキークッキー','<b>ゴールデンクッキーを7枚</b> クリックする。',[22,6]);
		new Game.Achievement('ラッキーの嵐','<b>ゴールデンクッキーを27枚</b> クリックする。',[23,6]);
		
		order=30200;
		new Game.Achievement('ズルして作ったクッキーはまずい','クッキーをハックする。',[10,6]);Game.last.pool='shadow';
		order=11010;
		new Game.Achievement('奇怪なクリック','本当に、本当に素早くクリックする。<q>おっと!こりゃ驚きだねぇ。</q>',[12,0]);
		
		order=5000;
		new Game.Achievement('建築者','施設を <b>100</b> 個所持する。',[2,6]);
		new Game.Achievement('設計者','施設を <b>500</b> 個所持する。',[3,6]);
		order=6000;
		new Game.Achievement('促進者','アップグレードを <b>20</b> 個購入する。',[9,0]);
		new Game.Achievement('増強者','アップグレードを <b>50</b> 個購入する。',[9,1]);
		
		order=11000;
		new Game.Achievement('浸して食べよう','クッキーを浸す。<q>はい、よくできました!</q>',[1,8]);
		
		order=10000;
		new Game.Achievement('運命の女神','<b>ゴールデンクッキーを77枚</b> クリックする。<q>こんな事してないで、もう寝なよ。</q>',[24,6]);
		order=31000;
		new Game.Achievement('本当の無クリック','大クッキーをクリック<b>せず</b>に、 <b>1,000,000</b> クッキー焼く。<q>ちょっとこれ、ゲームの目的完全否定してない?</q>',[12,0]);Game.last.pool='shadow';
		
		order=20000;
		new Game.Achievement('うたた寝','<b>1回</b> 以上グランマポカリプスをなだめる。<q>我ら<br>は<br>永遠</q>',[8,9]);
		new Game.Achievement('まどろみ','<b>5回</b> 以上グランマポカリプスをなだめる。<q>我らの意思は<br>宇宙全体に<br>留まり続ける</q>',[8,9]);
		
		order=1150;
		new Game.Achievement('長老会','<b>7</b> 種類以上のグランマを所持する。',[10,9]);
		
		order=20000;
		new Game.Achievement('平静','グランマポカリプスと契約を宣言する。<q>我らは<br>満たされ<br>た</q>',[8,9]);
		
		order=5000;
		new Game.Achievement('技術者','施設を <b>1000</b> 個所持する。',[4,6]);
		
		order=10000;
		new Game.Achievement('レプラコーン','<b>ゴールデンクッキーを777枚</b> クリックする。',[25,6]);
		new Game.Achievement('黒猫の足','<b>ゴールデンクッキーを7777枚</b> クリックする。',[26,6]);
		
		order=30050;
		new Game.Achievement('ニヒリズム','<b>1,000,000,000,000,000</b> クッキー焼いて昇天する。<q>消すべきものが<br>いっぱい</q>',[11,7]);
		
		order=1900;
		Game.TieredAchievement('反クッキー生地','<b>1</b> 反物質凝縮器所持する。','反物質凝縮器',1);
		Game.TieredAchievement('奇粒子','<b>50</b> 反物質凝縮器所持する。','反物質凝縮器',2);
		Game.TieredAchievement('やばい!','<b>100</b> 反物質凝縮器所持する。','反物質凝縮器',3);
		
		order=6000;
		new Game.Achievement('改良者','アップグレードを <b>100</b> 個購入する。',[9,2]);
		
		order=7000;
		new Game.Achievement('100個記念','<b>全施設を100個</b> 以上所持する。',[6,6]);
		
		order=30500;
		new Game.Achievement('ハードコア','<b>アップグレードを購入せず</b>に <b>1,000,000,000</b> クッキー作る。',[12,6]);//Game.last.pool='shadow';
		
		order=30600;
		new Game.Achievement('スピードベイキングI','<b>35分</b> 以内に <b>1,000,000</b> クッキー焼く。',[12,5]);Game.last.pool='shadow';
		new Game.Achievement('スピードベイキングII','<b>25分</b> 以内に <b>1,000,000</b> クッキー焼く。',[13,5]);Game.last.pool='shadow';
		new Game.Achievement('スピードベイキングIII','<b>15分</b> 以内に <b>1,000,000</b> クッキー焼く。',[14,5]);Game.last.pool='shadow';
		
		
		order=61000;
		var achiev=new Game.Achievement('オーブンにしっぺ返しでイーブン','工場ダンジョンで<b>うごくかまど</b>を倒す。',[12,7]);Game.last.pool='dungeon';
		var achiev=new Game.Achievement('これぞまさしくツボ叩き','工場ダンジョンで<b>支配者となりし焼き壺</b>を倒す。',[12,7]);Game.last.pool='dungeon';
		var achiev=new Game.Achievement('ピピピピピ…','機能障害アラームボット、<b>チャーピー</b>を見つけ倒す。',[13,7]);Game.last.pool='dungeon';
		var achiev=new Game.Achievement('白ウサギを追え','隠れ上手な<b>サトウウサギ</b>を見つけ倒す。',[14,7]);Game.last.pool='dungeon';
		
		order=1000;
		new Game.Achievement('クリック病','クリックで <b>100,000,000,000</b> クッキー生産する。',[11,14]);
		
		order=1100;
		Game.TieredAchievement('古代の友','<b>150</b> グランマ所持する。','グランマ',4);
		Game.TieredAchievement('古代の統治者','<b>200</b> グランマ所持する。','グランマ',5);
		
		order=32000;
		new Game.Achievement('全開','ヘブンリーチップスの力を <b>100%</b> 開放する。',[15,7]);
		
		order=33000;
		new Game.Achievement('ただのラッキー','1秒ごとに <b>500,000分の1の確率で</b> この実績を獲得できる。',[15,6]);Game.last.pool='shadow';
		
		order=21000;
		new Game.Achievement('かゆいところに手が届く','<b>虫を1匹</b> 退治する。',[19,8]);
		new Game.Achievement('荒れたところをよくならす','<b>虫を50匹</b> 退治する。',[19,8]);
		new Game.Achievement('駄目なやつらはぶっ飛ばす','<b>虫を200匹</b> 退治する。',[19,8]);
		
		order=22000;
		new Game.Achievement('クッキーおばけ','<b>全てのハロウィンクッキー</b>を解除する。<div class="line"></div>この実績を所持していると、これからのプレイにおいてハロウィンクッキーがより頻繁に出現しやすくなる。',[12,8]);
		
		order=22100;
		new Game.Achievement('街にやってきた','<b>サンタが第7形態に</b> 到達する。',[18,9]);
		new Game.Achievement('ハイル・サンタ','<b>サンタが最終形態に</b> 到達する。',[19,10]);
		new Game.Achievement('雪やこんこん','<b>全てのクリスマスクッキー</b>を解除する。<div class="line"></div>この実績を所持していると、これからのプレイにおいてクリスマスクッキーがより頻繁に出現しやすくなる。',[19,9]);
		new Game.Achievement('まジカよ!','<b>トナカイを1匹</b> クリックする。',[12,9]);
		new Game.Achievement('ソリ追いの匠','<b>トナカイを50匹</b> クリックする。',[12,9]);
		new Game.Achievement('トナカイスレイヤー','<b>トナカイを200匹</b> クリックする。',[12,9]);

		order=1200;
		Game.TieredAchievement('完璧農業','<b>150</b> 農場所持する。','農場',4);
		order=1400;
		Game.TieredAchievement('究極自動化','<b>150</b> 工場所持する。','工場',4);
		order=1300;
		Game.TieredAchievement('掘出確認','<b>150</b> 鉱山所持する。','鉱山',4);
		order=1500;
		Game.TieredAchievement('文明レベルII','<b>150</b> 宇宙船所持する。','宇宙船',4);
		order=1600;
		Game.TieredAchievement('金箔戦争-ギルド・ウォーズ-','<b>150</b> 錬金術室所持する。','錬金術室',4);
		order=1700;
		Game.TieredAchievement('共有脳','<b>150</b> ポータル所持する。','ポータル',4);
		order=1800;
		Game.TieredAchievement('時の施政者','<b>150</b> タイムマシン所持する。','タイムマシン',4);
		order=1900;
		Game.TieredAchievement('分子職人','<b>150</b> 反物質凝縮器所持する。','反物質凝縮器',4);
		
		order=2000;
		Game.TieredAchievement('単一格子','<b>1</b> プリズム所持する。','プリズム',1);
		Game.TieredAchievement('微光','<b>50</b> プリズム所持する。','プリズム',2);
		Game.TieredAchievement('失明フラッシュ','<b>100</b> プリズム所持する。','プリズム',3);
		Game.TieredAchievement('永遠の輝き','<b>150</b> プリズム所持する。','プリズム',4);
		
		order=5000;
		new Game.Achievement('創造王','施設を <b>2000</b> 個所持する。<q>茫洋たる草原を前に、彼は言った。「ここに文明あれ」</q>',[5,6]);
		order=6000;
		new Game.Achievement('発展王','アップグレードを <b>200</b> 個購入する。<q>万事が上手くいく。けど君に必要かな?</q>',[9,14]);
		order=7002;
		new Game.Achievement('200個記念','<b>全施設を200個</b> 以上所持する。<q>よくそこまでやるなぁ。</q>',[8,6]);
		
		order=22300;
		new Game.Achievement('愛らしいクッキーたち','<b>全てのバレンタインクッキーを</b>解除する。',[20,3]);
		
		order=7001;
		new Game.Achievement('150個記念','<b>全施設を150個</b> 以上所持する。',[7,6]);
		
		order=11000;
		new Game.Achievement('ちっちゃいクッキー','ちっちゃいクッキーをクリックする。<q>クリックする<br>クッキーが間違ってるよ。</q>',[0,5]);
		
		order=400000;
		new Game.Achievement('記念品はクッキー1枚','10兆クッキー焼くことで、地方ニュースに載る。<q>誇らしき偉業を祝し。</q>',[10,0]);
		
		order=1070;
		Game.ProductionAchievement('クリック代行','カーソル',1,0,7);
		order=1120;
		Game.ProductionAchievement('ほとばしるおばあちゃん','グランマ',1,0,6);
		order=1220;
		Game.ProductionAchievement('肥料不要','農場',1);
		order=1320;
		Game.ProductionAchievement('ネバー・ディグダウン','鉱山',1);
		order=1420;
		Game.ProductionAchievement('ピタゴラクッキー','工場',1);
		order=1520;
		Game.ProductionAchievement('地平の向こう側','宇宙船',1);
		order=1620;
		Game.ProductionAchievement('最高傑作','錬金術室',1);
		order=1720;
		Game.ProductionAchievement('測り知れざる永劫','ポータル',1);
		order=1820;
		Game.ProductionAchievement('よくわからない時空のなにか','タイムマシン',1);
		order=1920;
		Game.ProductionAchievement('超大質量','反物質凝縮器',1);
		order=2020;
		Game.ProductionAchievement('太陽賛美','プリズム',1);
		
		
		order=1000;
		new Game.Achievement('クリックハルマゲドン','クリックで <b>10,000,000,000,000</b> クッキー生産する。',[11,15]);
		new Game.Achievement('クリックラグナロク','クリックで <b>1,000,000,000,000,000</b> クッキー生産する。',[11,16]);
		
		order=1050;
		new Game.Achievement('超過多指症','<b>300</b> カーソル所持する。',[0,13]);
		new Game.Achievement('ドクター・T','<b>400</b> カーソル所持する。',[0,14]);
		
		order=1100;Game.TieredAchievement('おばあちゃんのままで','<b>250</b> グランマ所持する。','グランマ',6);
		order=1200;Game.TieredAchievement('自給自足','<b>200</b> 農場所持する。','農場',5);
		order=1400;Game.TieredAchievement('テクノクラシー','<b>200</b> 工場所持する。','工場',5);
		order=1300;Game.TieredAchievement('世界の中心で掘る','<b>200</b> 鉱山所持する。','鉱山',5);
		order=1500;Game.TieredAchievement('平和民族','<b>200</b> 宇宙船所持する。','宇宙船',5);
		order=1600;Game.TieredAchievement('世界の秘密','<b>200</b> 錬金術室所持する。','錬金術室',5);
		order=1700;Game.TieredAchievement('狂信の王国','<b>200</b> ポータル所持する。','ポータル',5);
		order=1800;Game.TieredAchievement('本当の永久','<b>200</b> タイムマシン所持する。','タイムマシン',5);
		order=1900;Game.TieredAchievement('ぶらぶらブランク長散歩','<b>200</b> 反物質凝縮器所持する。','反物質凝縮器',5);
		order=2000;Game.TieredAchievement('さあ目醒めよう','<b>200</b> プリズム所持する。','プリズム',5);
		
		order=30200;
		new Game.Achievement('神様コンプレックス','<b>Orteil</b>を名乗る。<div class="warning">メモ : 簒奪者は自らの名を他のものに変えるまで、CpSに-1%の罰を課せられます。</div><q>いや、君じゃないでしょ?</q>',[17,5]);Game.last.pool='shadow';
		new Game.Achievement('サードパーティ','<b>アドオン</b>を使う。<q>バニラが最も退屈な味だって気づいちゃうかな。</q>',[16,5]);Game.last.pool='shadow';//if you're making a mod, add a Game.Win('サードパーティ') somewhere in there!
		
		order=30050;
		new Game.Achievement('非物質化','<b>1,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>それっ!<br>…あーら不思議、クッキーはどこに消えちゃったのかな?</q>',[11,7]);
		new Game.Achievement('ゼロZERO零','<b>1,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>ぶっちゃけ : 全然大した量じゃない。</q>',[11,7]);
		new Game.Achievement('超越','<b>1,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>君のクッキーは今や悟りの境地にある。</q>',[11,8]);
		new Game.Achievement('抹消','<b>1,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>抵抗は無意味だ、それが戯れであろうと。</q>',[11,8]);
		new Game.Achievement('虚無への供物','<b>1,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>今や手元のクッキーはごく僅か。君は負の量を所有していたようなもんだね。</q>',[11,8]);
		
		order=22400;
		new Game.Achievement('たまご狩りの始まり','<b>エッグを1個</b> 解除する。',[1,12]);
		new Game.Achievement('狩り立てるもの','<b>エッグを7個</b> 解除する。',[4,12]);
		new Game.Achievement('集団イーステリー','<b>エッグを14個</b> 解除する。',[7,12]);
		new Game.Achievement('かくれんぼチャンピオン','<b>全てのエッグ</b>を解除する。<div class="line"></div>この実績を所持していると、これからのプレイにおいてエッグがより頻繁に出現しやすくなる。',[13,12]);
	
		order=11000;
		new Game.Achievement('名前なんて意味ないね','ベーカリーに名前を付ける。',[15,9]);
	
	
		order=1425;
		Game.TieredAchievement('大金','<b>1</b> 銀行所持する。','銀行',1);
		Game.TieredAchievement('申し分ない','<b>50</b> 銀行所持する。','銀行',2);
		Game.TieredAchievement('ア・ローン・イン・ザ・ダーク','<b>100</b> 銀行所持する。','銀行',3);
		Game.TieredAchievement('ニード・フォー・グリード','<b>150</b> 銀行所持する。','銀行',4);
		Game.TieredAchievement('経済こそが重要なのだ、愚か者','<b>200</b> 銀行所持する。','銀行',5);
		order=1450;
		Game.TieredAchievement('礼拝の時間','<b>1</b> 神殿所持する。','神殿',1);
		Game.TieredAchievement('秘教','<b>50</b> 神殿所持する。','神殿',2);
		Game.TieredAchievement('新興宗教','<b>100</b> 神殿所持する。','神殿',3);
		Game.TieredAchievement('国教','<b>150</b> 神殿所持する。','神殿',4);
		Game.TieredAchievement('熱教','<b>200</b> 神殿所持する。','神殿',5);
		order=1475;
		Game.TieredAchievement('奥様は魔女','<b>1</b> 魔法使いの塔所持する。','魔法使いの塔',1);
		Game.TieredAchievement('魔法使いの弟子','<b>50</b> 魔法使いの塔所持する。','魔法使いの塔',2);
		Game.TieredAchievement('魔除けとおまじない','<b>100</b> 魔法使いの塔所持する。','魔法使いの塔',3);
		Game.TieredAchievement('呪いと呪詛','<b>150</b> 魔法使いの塔所持する。','魔法使いの塔',4);
		Game.TieredAchievement('マジック・キングダム','<b>200</b> 魔法使いの塔所持する。','魔法使いの塔',5);
		
		order=1445;
		Game.ProductionAchievement('利権','銀行',1);
		order=1470;
		Game.ProductionAchievement('新世界秩序','神殿',1);
		order=1495;
		Game.ProductionAchievement('ちちんぷいぷい','魔法使いの塔',1);
		
		
		
		order=1070;
		Game.ProductionAchievement('クリックしちゃう面白さです','カーソル',2,0,7);
		order=1120;
		Game.ProductionAchievement('ビンゴでパニック','グランマ',2,0,6);
		order=1220;
		Game.ProductionAchievement('ガッポリ稼げ','農場',2);
		order=1320;
		Game.ProductionAchievement('掘り続けていく','鉱山',2);
		order=1420;
		Game.ProductionAchievement('技術を愛します','工場',2);
		order=1445;
		Game.ProductionAchievement('全額払い','銀行',2);
		order=1470;
		Game.ProductionAchievement('クッキー学教会','神殿',2);
		order=1495;
		Game.ProductionAchievement('ウサギが多すぎ、帽子が足りない','魔法使いの塔',2);
		order=1520;
		Game.ProductionAchievement('いちばん大事な積み荷','宇宙船',2);
		order=1620;
		Game.ProductionAchievement('キンキラキン','錬金術室',2);
		order=1720;
		Game.ProductionAchievement('かつてない恐ろしさ','ポータル',2);
		order=1820;
		Game.ProductionAchievement('僕らのミライへ逆回転','タイムマシン',2);
		order=1920;
		Game.ProductionAchievement('無限小','反物質凝縮器',2);
		order=2020;
		Game.ProductionAchievement('より素晴らしい夜明け','プリズム',2);
		
		order=30000;
		new Game.Achievement('再誕','1回以上昇天する。',[21,6]);
		
		order=11000;
		new Game.Achievement('はいどうぞ','この実績欄をクリックする。<q>ここで訊くだけでよかったんだよ。</q>',[1,7]);Game.last.clickFunction=function(){if (!Game.HasAchiev('はいどうぞ')){PlaySound('snd/tick.mp3');Game.Win('はいどうぞ');}};
		
		order=30000;
		new Game.Achievement('復活','<b>10回</b> 昇天する。',[21,6]);
		new Game.Achievement('輪廻','<b>100回</b> 昇天する。',[21,6]);
		new Game.Achievement('無限ループ','<b>1000回</b> 昇天する。<q>やあ、また君か。</q>',[2,7]);Game.last.pool='shadow';
		
		
		
		order=1100;
		Game.TieredAchievement('エイジマスター','<b>300</b> グランマ所持する。','グランマ',7);
		Game.TieredAchievement('老いて征かん','<b>350</b> グランマ所持する。','グランマ',8);
		
		order=1200;Game.TieredAchievement('カリスマ庭師','<b>250</b> 農場所持する。','農場',6);
		order=1300;Game.TieredAchievement('地殻代表','<b>250</b> 鉱山所持する。','鉱山',6);
		order=1400;Game.TieredAchievement('機械の反乱','<b>250</b> 工場所持する。','工場',6);
		order=1425;Game.TieredAchievement('成金','<b>250</b> 銀行所持する。','銀行',6);
		order=1450;Game.TieredAchievement('狂信','<b>250</b> 神殿所持する。','神殿',6);
		order=1475;Game.TieredAchievement('魔法の世界','<b>250</b> 魔法使いの塔所持する。','魔法使いの塔',6);
		order=1500;Game.TieredAchievement('距離圧縮','<b>250</b> 宇宙船所持する。','宇宙船',6);
		order=1600;Game.TieredAchievement('生涯の研究','<b>250</b> 錬金術室所持する。','錬金術室',6);
		order=1700;Game.TieredAchievement('いずれ失われた場所','<b>250</b> ポータル所持する。','ポータル',6);
		order=1800;Game.TieredAchievement('熱力学的死','<b>250</b> タイムマシン所持する。','タイムマシン',6);
		order=1900;Game.TieredAchievement('小宇宙','<b>250</b> 反物質凝縮器所持する。','反物質凝縮器',6);
		order=2000;Game.TieredAchievement('輝ける未来','<b>250</b> プリズム所持する。','プリズム',6);
		
		order=25000;
		new Game.Achievement('この先ドラゴン注意','<b>ドラゴンのトレーニング</b>を終了する。',[21,12]);
		
		Game.BankAchievement('あのさぁ?');
		Game.BankAchievement('ミルクとクッキーの地');
		Game.BankAchievement('クッキーを制するものは宇宙を制す','ミルクが滞ってはならぬ!');
		Game.BankAchievement('買い溜めの夜');
		Game.BankAchievement('食べ切れるつもり?');
		Game.BankAchievement('もっと大きなベーカリーが必要だ');
		Game.BankAchievement('マウス・オブ・マッドネス','私達がこうして話し合っている事が当にクッキーなのよ。');
		Game.BankAchievement('この番組はクッキーの提供でお送りしました<div style="display:inline-block;background:url(img/money.png);width:16px;height:17px;"></div>');
	
	
		Game.CpsAchievement('クッキーで埋まった世界');
		Game.CpsAchievement('俺の自慢の施設ちゃんが作るクッキーが毎時'+Beautify(10000000000000*60*60)+'に達した瞬間');
		Game.CpsAchievement('早くて美味い');
		Game.CpsAchievement('クッキーヘルツ : なんて、なんて美味しそうな周波数','とにかく、ヘルツドーナツより美味しい。');
		Game.CpsAchievement('おっと、世界飢餓を救ってしまった');
		Game.CpsAchievement('ぶっ飛んダジャレ','まるで母なる自然が「遅ぉぉぉぉくなぁぁぁぁった」みたい');
		Game.CpsAchievement('人類最速');
		Game.CpsAchievement('それでも、あなたはまだ空腹です');
		Game.CpsAchievement('覚焼');
		Game.CpsAchievement('実際この実績の名前はどこまでも長くできるので、私も正直なところどこまで長くできるのか見たいです。<br>アドルファス・ウィリアムソン・グリーン(1844～1917)は1864年にグロトン学校の校長として活動し始めた。1865年までに彼はニューヨーク商業図書館の第二司書補に就任した。1867年から1869年に正式司書に昇進した。1869年から1873年は、ウィリアム・マクスウェル・エヴァーツ、チャールズ・フェルディナンド・サウスメイド、ジョセフ・ホッジ・チョートらが共同設立したエヴァーツ・サウスメイド&チョート法律事務所で働いた。1873年にはニューヨーク州弁護士会への入会が認められた。<br>ところで元気?');//Game.last.shortName='There\'s really no hard limit to how long these achievement names can be and to be quite honest I\'m [...]';
		Game.CpsAchievement('早っ','ワーオ!');
		
		order=7002;
		new Game.Achievement('250個記念','<b>全施設を250個</b> 以上所持する。<q>ま、せいぜい頑張りなよ。</q>',[9,6]);
		
		order=11000;
		new Game.Achievement('タブロイド中毒','ニュース欄を <b>50回</b> クリックする。<q>6頁目 : 暇を持て余した狂人の無駄な試み、ペストリー画像をひたすらクリック!<br>同じく6頁目 : 英国議会が私の赤ちゃんを食べた!</q>',[27,7]);
		
		order=1000;
		new Game.Achievement('クリックカタストロフ','クリックで <b>100,000,000,000,000,000</b> クッキー生産する。',[11,17]);
		new Game.Achievement('クリックカタクリズム','クリックで <b>10,000,000,000,000,000,000</b> クッキー生産する。',[11,18]);
		
		order=1050;
		new Game.Achievement('親指、指骨、中手骨','<b>500</b> カーソル所持する。<q>& ナックルズ</q>',[0,15]);
		
		order=6002;
		new Game.Achievement('博学','アップグレードを <b>300</b> 個、施設を <b>4000</b> 個所持する。<q>ローマは一日にして成らず…普通は何日かかかるものさ。</q>',[29,7]);
		
		order=6005;
		new Game.Achievement('エルダースクロール','グランマとカーソルを合わせて <b>777</b> 個所持する。<q>当ててやろうか?誰かにクッキーを盗まれたかな?</q>',[10,9]);
		
		order=30050;
		new Game.Achievement('粉々に、と言ったな?','<b>1,000,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>ああ、いいとも。</q>',[29,6]);
		
		order=1200;Game.TieredAchievement('多種子ビジネス','<b>300</b> 農場所持する。','農場',7);
		order=1300;Game.TieredAchievement('風変わりなフラッキング','<b>300</b> 鉱山所持する。','鉱山',7);
		order=1400;Game.TieredAchievement('とある労働者の悲喜交々','<b>300</b> 工場所持する。','工場',7);
		order=1425;Game.TieredAchievement('戦争の神経','<b>300</b> 銀行所持する。','銀行',7);
		order=1450;Game.TieredAchievement('強制改宗','<b>300</b> 神殿所持する。','神殿',7);
		order=1475;Game.TieredAchievement('え～、次のマジックではお客様の中からお一人、お手伝いをして頂きます','<b>300</b> 魔法使いの塔所持する。','魔法使いの塔',7);
		order=1500;Game.TieredAchievement('配達ではない','<b>300</b> 宇宙船所持する。','宇宙船',7);
		order=1600;Game.TieredAchievement('金だよ、ジェリー!こいつは金だ','<b>300</b> 錬金術室所持する。','錬金術室',7);
		order=1700;Game.TieredAchievement('禁じられた地帯','<b>300</b> ポータル所持する。','ポータル',7);
		order=1800;Game.TieredAchievement('CookieClickerは不滅だ、100年経ってもCookieClicker、終日ずっと毎日ずっと、100度でも何度でもいつまでも、CookieClickerの冒険は続く','<b>300</b> タイムマシン所持する。','タイムマシン',7);
		order=1900;Game.TieredAchievement('科学者全員お手上げ','<b>300</b> 反物質凝縮器所持する。','反物質凝縮器',7);
		order=2000;Game.TieredAchievement('天体のハーモニー','<b>300</b> プリズム所持する。','プリズム',7);
		
		order=35000;
		new Game.Achievement('最後の一匹','絶滅寸前の<b>光る虫</b>を退治する。<q>この人でなし!</q>',[24,12]);Game.last.pool='shadow';
		
		order=10000;
		new Game.Achievement('一番乗り','ゴールデンクッキーが <b>出現してから1秒以内に</b> クリックする。',[10,14]);
		new Game.Achievement('薄れゆく幸運','ゴールデンクッキーが <b>消滅するまで1秒以内に</b> クリックする。',[10,14]);
		
		order=22100;
		new Game.Achievement('古鹿のババンビ','<b>荒ぶるおばあちゃんの間に</b>トナカイをクリックする。',[12,9]);
		
		order=21100;
		new Game.Achievement('こやつ、甘いな','<b>7角砂糖</b> 収穫する。',[24,14]);
		new Game.Achievement('砂糖の猛進','<b>30角砂糖</b> 収穫する。',[26,14]);
		new Game.Achievement('空虚な一年','<b>365角砂糖</b> 収穫する。<q>私の角砂糖、私の角砂糖、私の角砂糖。</q>',[29,14]);
		new Game.Achievement('手摘み','完熟する前の角砂糖の収穫に成功する。',[28,14]);
		new Game.Achievement('砂糖入り砂糖','<b>枝分かれした角砂糖</b>を収穫する。',[29,15]);
		new Game.Achievement('完全天然サトウキビ糖','<b>金色の角砂糖</b>を収穫する。',[29,16]);Game.last.pool='shadow';
		new Game.Achievement('甘い果肉','<b>肉々しい角砂糖</b>を収穫する。',[29,17]);
		
		order=7002;
		new Game.Achievement('300個記念','<b>全施設を300個</b> 以上所持する。<q>やめられない、とまらない。それでもおそらくやめなくてはならない。</q>',[29,12]);
		
		Game.CpsAchievement('速く練ろよ!','なんでまだ出来てないの?');
		Game.CpsAchievement('クッキーは絶えず流れて行く','クリックを楽しまないなんて意味が分からない');
		Game.CpsAchievement('あなたが気付いたかどうかはわかりませんが、これらのアイコンはすべて中心から少しずれています');
		Game.CpsAchievement('論より焼き','その生地を焼かずにどうやって食べるつもりだい?');
		Game.CpsAchievement('やる価値のあるものは、やりすぎるだけの価値がある');
		
		Game.BankAchievement('今までに見た夢の中で最高のものは、クッキーを焼いている夢');
		Game.BankAchievement('一生安泰');
		
		order=1200;Game.TieredAchievement('あなたと豆の木','<b>350</b> 農場所持する。','農場',8);
		order=1300;Game.TieredAchievement('ロマンシング・ストーン','<b>350</b> 鉱山所持する。','鉱山',8);
		order=1400;Game.TieredAchievement('機械の神','<b>350</b> 工場所持する。','工場',8);
		order=1425;Game.TieredAchievement('お金貸して!','<b>350</b> 銀行所持する。','銀行',8);
		order=1450;Game.TieredAchievement('弱者の祈り','<b>350</b> 神殿所持する。','神殿',8);
		order=1475;Game.TieredAchievement('一種の魔法だ','<b>350</b> 魔法使いの塔所持する。','魔法使いの塔',8);
		order=1500;Game.TieredAchievement('わかった、そうし給え','<b>350</b> 宇宙船所持する。','宇宙船',8);
		order=1600;Game.TieredAchievement('輝くもの全ては金','<b>350</b> 錬金術室所持する。','錬金術室',8);
		order=1700;Game.TieredAchievement('き͓̳̳̯̟͕̟͍͍̣っ͖͖̘̪͉̠̦͕̤̪̝̥̰̠̫̖̣͙̬͘ͅと̜̻̝̣̼͙̮̯̪来͇̦̲る͚̬̥̫̳̼̞̘̯～','<b>350</b> ポータル所持する。','ポータル',8);
		order=1800;Game.TieredAchievement('はるか昔','<b>350</b> タイムマシン所持する。','タイムマシン',8);
		order=1900;Game.TieredAchievement('異物','<b>350</b> 反物質凝縮器所持する。','反物質凝縮器',8);
		order=2000;Game.TieredAchievement('トンネルの終端','<b>350</b> プリズム所持する。','プリズム',8);
		
		
		
		order=1070;
		Game.ProductionAchievement('Click(アダム・サンドラー主演)','カーソル',3,0,7);
		order=1120;
		Game.ProductionAchievement('狂乱の古代人','グランマ',3,0,6);
		order=1220;
		Game.ProductionAchievement('育ちすぎ','農場',3);
		order=1320;
		Game.ProductionAchievement('堆積物主義','鉱山',3);
		order=1420;
		Game.ProductionAchievement('無償奉仕','工場',3);
		order=1445;
		Game.ProductionAchievement('逆漏斗機構','銀行',3);
		order=1470;
		Game.ProductionAchievement('汝はかく語りき','神殿',3);
		order=1495;
		Game.ProductionAchievement('明白なるマナの使命','魔法使いの塔',3);
		order=1520;
		Game.ProductionAchievement('雪も雨も熱さも夜の暗闇でさえも','宇宙船',3);
		order=1620;
		Game.ProductionAchievement('ミダースに触れられた','錬金術室',3);
		order=1720;
		Game.ProductionAchievement('永遠に存在するもの','ポータル',3);
		order=1820;
		Game.ProductionAchievement('既視感','タイムマシン',3);
		order=1920;
		Game.ProductionAchievement('10のべき乗','反物質凝縮器',3);
		order=2020;
		Game.ProductionAchievement('今や暗き日々は去れり','プリズム',3);
		
		order=1070;
		new Game.Achievement('奇妙なジャズハンズ','カーソルがレベル <b>10</b> に到達する。',[0,26]);Game.Objects['カーソル'].levelAchiev10=Game.last;
		order=1120;
		new Game.Achievement('メトセラ','グランマがレベル <b>10</b> に到達する。',[1,26]);Game.Objects['グランマ'].levelAchiev10=Game.last;
		order=1220;
		new Game.Achievement('広大な土地','農場がレベル <b>10</b> に到達する。',[2,26]);Game.Objects['農場'].levelAchiev10=Game.last;
		order=1320;
		new Game.Achievement('ダ・ダ・ダ・大深度地下','鉱山がレベル <b>10</b> に到達する。',[3,26]);Game.Objects['鉱山'].levelAchiev10=Game.last;
		order=1420;
		new Game.Achievement('明らかな天才','工場がレベル <b>10</b> に到達する。',[4,26]);Game.Objects['工場'].levelAchiev10=Game.last;
		order=1445;
		new Game.Achievement('名案','銀行がレベル <b>10</b> に到達する。',[15,26]);Game.Objects['銀行'].levelAchiev10=Game.last;
		order=1470;
		new Game.Achievement('それはベーカリーに所蔵されるもんだ','神殿がレベル <b>10</b> に到達する。',[16,26]);Game.Objects['神殿'].levelAchiev10=Game.last;
		order=1495;
		new Game.Achievement('口から機関銃','魔法使いの塔がレベル <b>10</b> に到達する。',[17,26]);Game.Objects['魔法使いの塔'].levelAchiev10=Game.last;
		order=1520;
		new Game.Achievement('やり終えたらそこにいた','宇宙船がレベル <b>10</b> に到達する。',[5,26]);Game.Objects['宇宙船'].levelAchiev10=Game.last;
		order=1620;
		new Game.Achievement('化学物質','錬金術室がレベル <b>10</b> に到達する。',[6,26]);Game.Objects['錬金術室'].levelAchiev10=Game.last;
		order=1720;
		new Game.Achievement('ビザロ・ワールド','ポータルがレベル <b>10</b> に到達する。',[7,26]);Game.Objects['ポータル'].levelAchiev10=Game.last;
		order=1820;
		new Game.Achievement('長かったな','タイムマシンがレベル <b>10</b> に到達する。',[8,26]);Game.Objects['タイムマシン'].levelAchiev10=Game.last;
		order=1920;
		new Game.Achievement('チャッピー・ハドロン','反物質凝縮器がレベル <b>10</b> に到達する。',[13,26]);Game.Objects['反物質凝縮器'].levelAchiev10=Game.last;
		order=2020;
		new Game.Achievement('色取り選り取り見取り','プリズムがレベル <b>10</b> に到達する。',[14,26]);Game.Objects['プリズム'].levelAchiev10=Game.last;
		
		order=61470;
		order=61495;
		new Game.Achievement('ビビデ・バビデ・ブー','呪文を <b>9回</b> 唱える。',[21,11]);
		new Game.Achievement('私は魔女っ子','呪文を <b>99回</b> 唱える。',[22,11]);
		new Game.Achievement('魔法使いはお前だ','呪文を <b>999回</b> 唱える。<q>我は何者か?</q>',[29,11]);
		
		order=10000;
		new Game.Achievement('四葉のクッキー','ゴールデンクッキーを同時に <b>4つ</b> 出す。<q>クッキーに葉など付いていないことを考慮すると、相当珍しい。</q>',[27,6]);Game.last.pool='shadow';
		
		order=2100;
		Game.TieredAchievement('運の良いことに','<b>1</b> チャンスメーカー所持する。','チャンスメーカー',1);
		Game.TieredAchievement('オッズはいくらだ','<b>50</b> チャンスメーカー所持する。','チャンスメーカー',2);
		Game.TieredAchievement('婆さんに新しい靴が一足必要だ','<b>100</b> チャンスメーカー所持する。','チャンスメーカー',3);
		Game.TieredAchievement('ドク、一発で百万だ','<b>150</b> チャンスメーカー所持する。','チャンスメーカー',4);
		Game.TieredAchievement('運がよけりゃ','<b>200</b> チャンスメーカー所持する。','チャンスメーカー',5);
		Game.TieredAchievement('幸運、汝に永久にあれ','<b>250</b> チャンスメーカー所持する。','チャンスメーカー',6);
		Game.TieredAchievement('淑女になれ','<b>300</b> チャンスメーカー所持する。','チャンスメーカー',7);
		Game.TieredAchievement('賭場風雲','<b>350</b> チャンスメーカー所持する。','チャンスメーカー',8);
		
		order=2120;
		Game.ProductionAchievement('幸運を祈る','チャンスメーカー',1);
		Game.ProductionAchievement('ただの統計だ','チャンスメーカー',2);
		Game.ProductionAchievement('マーフィーの野生の勘','チャンスメーカー',3);
		
		new Game.Achievement('もうこの辺で葉っぱで一服にしておこうぜ','チャンスメーカーがレベル <b>10</b> に到達する。',[19,26]);Game.Objects['チャンスメーカー'].levelAchiev10=Game.last;
		
		order=1000;
		new Game.Achievement('ジ・アルティメット・クリックダウン','クリックで <b>1,000,000,000,000,000,000,000</b> クッキー生産する。<q>(究極の運命の内の)</q>',[11,19]);
		
		
		order=1100;
		Game.TieredAchievement('素敵に年を重ねた','<b>400</b> グランマ所持する。','グランマ',9);
		Game.TieredAchievement('101回目のバースデー','<b>450</b> グランマ所持する。','グランマ',10);
		Game.TieredAchievement('古老達の厚い壁','<b>500</b> グランマ所持する。','グランマ',11);
		order=1200;Game.TieredAchievement('牧場物語','<b>400</b> 農場所持する。','農場',9);
		order=1300;Game.TieredAchievement('鉱山？俺の？掘るの？地雷で？ ','<b>400</b> 鉱山所持する。','鉱山',9);
		order=1400;Game.TieredAchievement('フル稼働','<b>400</b> 工場所持する。','工場',9);
		order=1425;Game.TieredAchievement('トリークルタルト政策 ','<b>400</b> 銀行所持する。','銀行',9);
		order=1450;Game.TieredAchievement('なんてこった、おおグランマよ!','<b>400</b> 神殿所持する。','神殿',9);
		order=1475;Game.TieredAchievement('名声','<b>400</b> 魔法使いの塔所持する。<q>(クッキークリッカーの同名機能とは無関係。)</q>','魔法使いの塔',9);
		order=1500;Game.TieredAchievement('それは宇宙の前ではピーナツに等しい ','<b>400</b> 宇宙船所持する。','宇宙船',9);
		order=1600;Game.TieredAchievement('同じ目方の鉛に等しい価値 ','<b>400</b> 錬金術室所持する。','錬金術室',9);
		order=1700;Game.TieredAchievement('時空旅行の恥は掻き捨て','<b>400</b> ポータル所持する。','ポータル',9);
		order=1800;Game.TieredAchievement('昨日のパーティーへの招待状','<b>400</b> タイムマシン所持する。','タイムマシン',9);
		order=1900;Game.TieredAchievement('ダウンサイズ','<b>400</b> 反物質凝縮器所持する。','反物質凝縮器',9);//the trailer got me really hyped up but i've read some pretty bad reviews. is it watchable ? is it worth seeing ? i don't mind matt damon
		order=2000;Game.TieredAchievement('目を疑うほどの驚愕','<b>400</b> プリズム所持する。','プリズム',9);
		order=2100;Game.TieredAchievement('可能性はあるかもね、実際','<b>400</b> チャンスメーカー所持する。','チャンスメーカー',9);
		
		order=1200;Game.TieredAchievement('木に成り切れ','<b>450</b> 農場所持する。','農場',10);
		order=1300;Game.TieredAchievement('洞窟物語','<b>450</b> 鉱山所持する。','鉱山',10);
		order=1400;Game.TieredAchievement('偽装ロボット','<b>450</b> 工場所持する。','工場',10);
		order=1425;Game.TieredAchievement('負け犬に吠える権利はない ','<b>450</b> 銀行所持する。','銀行',10);
		order=1450;Game.TieredAchievement('報復的かつ全能な ','<b>450</b> 神殿所持する。','神殿',10);
		order=1475;Game.TieredAchievement('お前に呪文全部ぶちまけてやる ','<b>450</b> 魔法使いの塔所持する。','魔法使いの塔',10);
		order=1500;Game.TieredAchievement('宇                     宙','<b>450</b> 宇宙船所持する。<q>それは果てしなく遠く…</q>','宇宙船',10);
		order=1600;Game.TieredAchievement('慣れて止まるな、変化しろ ','<b>450</b> 錬金術室所持する。','錬金術室',10);
		order=1700;Game.TieredAchievement('鏡次元で見えるものは見かけよりも近くにある ','<b>450</b> ポータル所持する。','ポータル',10);
		order=1800;Game.TieredAchievement('恋はデジャ・ブ ','<b>450</b> タイムマシン所持する。','タイムマシン',10);
		order=1900;Game.TieredAchievement('疑惑のビーム','<b>450</b> 反物質凝縮器所持する。','反物質凝縮器',10);
		order=2000;Game.TieredAchievement('目の錯覚','<b>450</b> プリズム所持する。','プリズム',10);
		order=2100;Game.TieredAchievement('大当たり','<b>450</b> チャンスメーカー所持する。','チャンスメーカー',10);
		
		order=36000;
		new Game.Achievement('他に面白いもの沢山あるのに','クッキーの遺産の管理を <b>1年以上</b> する。<q>クッキークリッカーで沢山遊んでくれて本当にありがとう!</q>',[23,11]);Game.last.pool='shadow';
		
		
		
		Game.CpsAchievement('馬鹿が鋏を持って突っ走る');
		Game.CpsAchievement('雲の上に到達した');
		Game.CpsAchievement('限界まで押しまくれ');
		Game.CpsAchievement('緑のクッキーが猛然と眠る');
		
		Game.BankAchievement('ナビスコでパニック!');
		Game.BankAchievement('はち切れんばかりの');
		Game.BankAchievement('殆どぎりぎり');
		Game.BankAchievement('もっと寄こせ');
		
		order=1000;
		new Game.Achievement('イカしたクリックをするお前ら','クリックで <b>100,000,000,000,000,000,000,000</b> クッキー生産する。',[11,28]);
		new Game.Achievement('もう…一度…クリックを…','クリックで <b>10,000,000,000,000,000,000,000,000</b> クッキー生産する。',[11,30]);
		
		order=61515;
		new Game.Achievement('植物マニア','<b>100房</b> 成長した作物を収穫する。',[26,20]);
		new Game.Achievement('園芸名人は指が痛い','<b>1000房</b> 成長した作物を収穫する。',[27,20]);
		new Game.Achievement('エデンの園で(俺のベイベー)','最大状態の菜園を全て作物で満たす。<q>大事で可愛い作物ちゃんの世話ってのは、まさにロックか何かだと思わないかい?</q>',[28,20]);
		
		new Game.Achievement('温室の管理人','作物の種をすべて開放する。',[25,20]);
		new Game.Achievement('種無しに遺憾なのは言うまでもない','砂糖蜂に菜園を捧げることで完成した種子リストを角砂糖に変換する。<div class="line"></div>この実績を所持していることで種が <b>5%安く</b> 、作物の結実が <b>5%早く</b> 、さらに作物からのアップグレードのドロップが <b>5%出やすく</b> なる。',[29,20]);
		
		order=30050;
		new Game.Achievement('お前は何も得られない','<b>1,000,000,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>では、ごきげんよう!</q>',[29,6]);
		new Game.Achievement('底辺からの再出発','<b>1,000,000,000,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>這い上がってきて、今ここ。</q>',[29,6]);
		new Game.Achievement('世界の終わり','<b>1,000,000,000,000,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>(知っての通り)</q>',[21,25]);
		new Game.Achievement('やあ、戻ってきたね','<b>1,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>淋しかったかい?</q>',[21,25]);
		new Game.Achievement('ラザロ','<b>1,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>さあ立ち上がれ。</q>',[21,25]);
		
		Game.CpsAchievement('慌てない急がない');
		Game.CpsAchievement('極超音速');
		
		Game.BankAchievement('楽しませてよ、Orteil');
		Game.BankAchievement('で、この後は?');
		
		order=7002;
		new Game.Achievement('350個記念','<b>全施設を350個</b> 以上所持する。<q>(無料の不動産だよ)</q>',[21,26]);
		new Game.Achievement('400個記念','<b>全施設を400個</b> 以上所持する。<q>ここまで来るのに、とんでもない事をしなければならなかった筈だ。<br>とんでもなく…恐ろしい事を。</q>',[22,26]);
		new Game.Achievement('450個記念','<b>全施設を450個</b> 以上所持する。<q>この時点で思うに、君は何かへの償いをしてるだけじゃないかな。</q>',[23,26]);
		
		new Game.Achievement('500個記念','<b>全施設を500個</b> 以上所持する。<q>君はまだまだ道半ばだと言う者もいるだろう。<br>そんな奴らは、無責任な楽観からくる奴らの浅慮さと一緒に犬に食わせておけばいい。 </q>',[29,25]);
		
		order=21100;
		new Game.Achievement('メイラード反応','<b>キャラメル化した角砂糖</b>を収穫する。',[29,27]);
		
		order=30250;
		new Game.Achievement('クッキーがぴったり昇天する時','正確に <b>1,000,000,000,000クッキー</b> で昇天する。',[25,7]);Game.last.pool='shadow';//this achievement is shadow because it is only achievable through blind luck or reading external guides; this may change in the future
		
		
		order=1050;
		new Game.Achievement('人差し指と親指で','<b>600</b> カーソル所持する。',[0,16]);
		
		order=1100;Game.TieredAchievement('おや、老いるまで待つのかい','<b>550</b> グランマ所持する。','グランマ',12);
		order=1200;Game.TieredAchievement('納屋の中で一番使える道具','<b>500</b> 農場所持する。','農場',11);
		order=1300;Game.TieredAchievement('いいか、お前は岩だ','<b>500</b> 鉱山所持する。','鉱山',11);
		order=1400;Game.TieredAchievement('金型破り','<b>500</b> 工場所持する。','工場',11);
		order=1425;Game.TieredAchievement('仕事を始めて金を貰え','<b>500</b> 銀行所持する。','銀行',11);
		order=1450;Game.TieredAchievement('俺の世界はマジ熱いぜ、お前のはどうだ','<b>500</b> 神殿所持する。','神殿',11);
		order=1475;Game.TieredAchievement('メテオの使い手は常識知らず','<b>500</b> 魔法使いの塔所持する。','魔法使いの塔',11);
		order=1500;Game.TieredAchievement('流星だけが可能にする','<b>500</b> 宇宙船所持する。','宇宙船',11);
		order=1600;Game.TieredAchievement('皆でちょっとずつ変えるんだ','<b>500</b> 錬金術室所持する。','錬金術室',11);//"all that glitters is gold" was already an achievement
		order=1700;Game.TieredAchievement('脳が優秀でも考えることはバカだ','<b>500</b> ポータル所持する。','ポータル',11);
		order=1800;Game.TieredAchievement('時間はどんどん流れていく','<b>500</b> タイムマシン所持する。','タイムマシン',11);
		order=1900;Game.TieredAchievement('なんて発想だ','<b>500</b> 反物質凝縮器所持する。','反物質凝縮器',11);
		order=2000;Game.TieredAchievement('磨かなきゃ輝かない','<b>500</b> プリズム所持する。','プリズム',11);
		order=2100;Game.TieredAchievement('行かなきゃわからない','<b>500</b> チャンスメーカー所持する。','チャンスメーカー',11);
		
		order=2200;
		Game.TieredAchievement('自己完結型','<b>1</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',1);
		Game.TieredAchievement('延々仰天','<b>50</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',2);
		Game.TieredAchievement('部分の総和','<b>100</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',3);
		Game.TieredAchievement('熊は何度もやって来る','<b>150</b> 自己無限生成エンジン所持する。<q>どこから?</q>','自己無限生成エンジン',4);
		Game.TieredAchievement('代り映えのない','<b>200</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',5);
		Game.TieredAchievement('最後の再帰','<b>250</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',6);
		Game.TieredAchievement('一から、多数','<b>300</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',7);
		Game.TieredAchievement('再帰の一例','<b>350</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',8);
		Game.TieredAchievement('この実績の詳細については、実績名を参照して下さい','<b>400</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',9);
		Game.TieredAchievement('僕はものすごくメタ、この実績さえも','<b>450</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',10);
		Game.TieredAchievement('全然飽きない','<b>500</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',11);
		
		order=2220;
		Game.ProductionAchievement('多数の要求','自己無限生成エンジン',1);
		Game.ProductionAchievement('ウロボロス','自己無限生成エンジン',2);
		Game.ProductionAchievement('より深く進むべし','自己無限生成エンジン',3);
		
		new Game.Achievement('シェルピンスキーの菱形','自己無限生成エンジンがレベル <b>10</b> に到達する。',[20,26]);Game.Objects['自己無限生成エンジン'].levelAchiev10=Game.last;
		
		Game.CpsAchievement('全力で飛ばすぜ');
		Game.BankAchievement('まあ、上出来だね');
		
		order=6002;
		new Game.Achievement('ルネサンスの焼き菓子職人','<b>400</b> 個のアップグレードと <b>8000</b> 個の施設を所持する。<q>よく目を凝らすと、それは巨人 - 絶滅して久しいと最近まで思われていた、高くそびえ立つ謎の人型種族 - の肩の上に立っている。</q>',[10,10]);
		
		order=1150;
		new Game.Achievement('老兵','<b>14</b> 種類以上のグランマを所持する。<q>14人の仲間たち!</q>',[10,9]);
		
		order=10000;
		new Game.Achievement('図太いやつ','<b>強化された薄膜</b>で<b>煌めくベール</b>を保護する。',[7,10]);
		
		
		order=2300;
		Game.TieredAchievement('F12','<b>1</b> Javascriptコンソールを所持する。','Javascriptコンソール',1);
		Game.TieredAchievement('変数の成功','<b>50</b> Javascriptコンソールを所持する。','Javascriptコンソール',2);
		Game.TieredAchievement('コメントなし','<b>100</b> Javascriptコンソールを所持する。','Javascriptコンソール',3);
		Game.TieredAchievement('適法なコード','<b>150</b> Javascriptコンソールを所持する。','Javascriptコンソール',4);
		Game.TieredAchievement('自分の環境で動く','<b>200</b> Javascriptコンソールを所持する。','Javascriptコンソール',5);
		Game.TieredAchievement('技術的負債','<b>250</b> Javascriptコンソールを所持する。','Javascriptコンソール',6);
		Game.TieredAchievement('言語使いに気をつけよ','<b>300</b> Javascriptコンソールを所持する。','Javascriptコンソール',7);
		Game.TieredAchievement('悲しみに沈んだコンソール','<b>350</b> Javascriptコンソールを所持する。','Javascriptコンソール',8);
		Game.TieredAchievement('クロージャ','<b>400</b> Javascriptコンソールを所持する。','Javascriptコンソール',9);
		Game.TieredAchievement('私たちがどこかのコンピュータ上のただのコードかもしれないようにシミュレーション上の生物だったらどうする','<b>450</b> Javascriptコンソールを所持する。','Javascriptコンソール',10);
		Game.TieredAchievement('裏通りを進む','<b>500</b> Javascriptコンソールを所持する。','Javascriptコンソール',11);
		
		order=2320;
		Game.ProductionAchievement('プロトタイプの継承','Javascriptコンソール',1);
		Game.ProductionAchievement('ドキュメントオブジェクトモデル','Javascriptコンソール',2);
		Game.ProductionAchievement('第一級オブジェクト','Javascriptコンソール',3);
		
		new Game.Achievement('アレクサンドリア','Javascriptコンソールがレベル <b>10</b> に到達する。',[32,26]);Game.Objects['Javascriptコンソール'].levelAchiev10=Game.last;
		
		Game.CpsAchievement('彼を焼き払え、お前ら');
		Game.CpsAchievement('君は1番だからそんなに頑張らなくてもいいよ');
		Game.CpsAchievement('衰える気配すらない');
		Game.BankAchievement('適切な食事');
		Game.BankAchievement('物足りない良い出来事');
		Game.BankAchievement('豊穣の角');
		
		order=30050;
		new Game.Achievement('初心者狩り','<b>1,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>まるで空から降ってきたみたいだな!</q>',[21,32]);
		new Game.Achievement('一度でうまく行かなければ','<b>1,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000</b> クッキー焼いて昇天する。<q>一度でうまくいかなければ、何度も何度もやってみるんだ。<br>でもそれって精神障害の定義そのものじゃない?</q>',[21,32]);
		
		order=33000;
		new Game.Achievement('おお運命の女神よ','すべての<b>幸運のアップグレード</b>を所持する。<div class="line"></div>この実績を所持していると <b>2倍よく</b> 幸運が発生するようになり、幸運のアップグレードを <b>40%の確率</b> で昇天後に持ち越して解除されるようになる。',[29,8]);
		
		order=61615;
		new Game.Achievement('新規株式公開','初めて在庫市場で利益を出す。',[0,33]);
		new Game.Achievement('ルーキーナンバー','在庫市場の全商品を <b>100個</b> 以上所持する。<q>数字を上げないと!</q>',[9,33]);
		new Game.Achievement('貧困の中に高潔さはない','在庫市場の全商品を <b>500個</b> 以上所持する。<q>針穴にラクダを押し込んでいるのはどんなヤツなんだ?</q>',[10,33]);
		new Game.Achievement('倉庫いっぱい','在庫市場の何らかの商品を <b>1000個</b> 以上所持する。',[11,33]);
		new Game.Achievement('良い1日だった','在庫市場で1度にCpS <b>1日分</b>($86,400) 売り上げる。',[1,33]);
		new Game.Achievement('買って買って買って','在庫市場で1度にCpS <b>1日分</b>($86,400) 買い入れる。',[1,33]);
		new Game.Achievement('ガス状資産','在庫市場の利益がCpS <b>丸1年分</b>($31,536,000) を超える。<q>ああなんて不安定なんだ!</q>',[18,33]);Game.last.pool='shadow';
		new Game.Achievement('ねずみ講','在庫市場の <b>最上級</b> の本社を解禁する。',[18,33]);
		
		order=10000;
		new Game.Achievement('ジェリクル','<b>10</b> 種類の猫を所持する。<q>ジェリクルすべてできる、ジェリクルやりぬくのさ!ジェリクルを毎日洗うことを忘れるな!</q>',[18,19]);
		
		order=7002;
		new Game.Achievement('550個記念','<b>全施設を550個</b> 以上所持する。<q>これじゃあかき回すような空っぽの心の内側を埋めることはできないんだろうね。</q>',[29,26]);
		
		Game.CpsAchievement('クッキーの前は何を食べてたんだっけ');
		Game.CpsAchievement('ヘビーフロー');
		Game.CpsAchievement('もっとかい?');
		Game.BankAchievement('デカい責任者');
		Game.BankAchievement('おなかパンパン');
		Game.BankAchievement('せんべいくらい薄い','一枚だけ!');
		
		order=1000;new Game.Achievement('カチャカチャ','クリックで <b>1,000,000,000,000,000,000,000,000,000</b> クッキー生産する。',[11,31]);
		order=1050;new Game.Achievement('あなたに敬意を表します','<b>700</b> カーソル所持する。',[0,17]);
		order=1100;Game.TieredAchievement('はいはいわかりました','<b>600</b> グランマ所持する。','グランマ',13);
		order=1200;Game.TieredAchievement('熟しすぎた','<b>550</b> 農場所持する。','農場',12);
		order=1300;Game.TieredAchievement('ロックオン','<b>550</b> 鉱山所持する。','鉱山',12);
		order=1400;Game.TieredAchievement('自作男','<b>550</b> 工場所持する。','工場',12);
		order=1425;Game.TieredAchievement('チェックアウト','<b>550</b> 銀行所持する。','銀行',12);
		order=1450;Game.TieredAchievement('祈りながら生きてる','<b>550</b> 神殿所持する。','神殿',12);
		order=1475;Game.TieredAchievement('ヒギタスフィギタスちちんのぷい','<b>550</b> 魔法使いの塔所持する。','魔法使いの塔',12);
		order=1500;Game.TieredAchievement('信じられないような旅','<b>550</b> 宇宙船所持する。','宇宙船',12);
		order=1600;Game.TieredAchievement('ただの一過性','<b>550</b> 錬金術室所持する。','錬金術室',12);
		order=1700;Game.TieredAchievement('俺を行かせるな、俺を見捨てないでくれ、マーフ','<b>550</b> ポータル所持する。','ポータル',12);
		order=1800;Game.TieredAchievement('穴住人が宇宙へ','<b>550</b> タイムマシン所持する。','タイムマシン',12);
		order=1900;Game.TieredAchievement('特定の味','<b>550</b> 反物質凝縮器所持する。','反物質凝縮器',12);
		order=2000;Game.TieredAchievement('蛍食','<b>550</b> プリズム所持する。','プリズム',12);
		order=2100;Game.TieredAchievement('神意に逆らう','<b>550</b> チャンスメーカー所持する。','チャンスメーカー',12);
		order=2200;Game.TieredAchievement('同語重言の','<b>550</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',12);
		order=2300;Game.TieredAchievement('中かっこ','<b>550</b> Javascriptコンソールを所持する。<q>フランス人は口ひげの箱と呼ぶ。<br>引用に便利。</q>','Javascriptコンソール',12);
		
		order=10000;
		new Game.Achievement('7つの蹄鉄','<b>ゴールデンクッキーを27777枚</b> クリックする。<q>工場の近くに草を食むファンキーな馬の一頭分だ。</q>',[21,33]);Game.last.pool='shadow';
		
		order=11000;
		new Game.Achievement('かつての日々','<b>忘れられたマドレーヌ</b>を見つける。<q>Dashnet農園は覚えている。</q>',[12,3]);
		
		
		order=1050;new Game.Achievement('小人閑居して不善をなす','<b>800</b> カーソル所持する。',[0,18]);
		order=1200;Game.TieredAchievement('緑に囲まれて','<b>600</b> 農場所持する。','農場',13);
		order=1300;Game.TieredAchievement('大げさだな、いい意味で','<b>600</b> 鉱山所持する。','鉱山',13);
		order=1400;Game.TieredAchievement('前進の輪','<b>600</b> 工場所持する。','工場',13);
		order=1425;Game.TieredAchievement('そりゃおもしれぇ','<b>600</b> 銀行所持する。','銀行',13);
		order=1450;Game.TieredAchievement('説教とクリーム','<b>600</b> 神殿所持する。','神殿',13);
		order=1475;Game.TieredAchievement('魔術的思考','<b>600</b> 魔法使いの塔所持する。','魔法使いの塔',13);
		order=1500;Game.TieredAchievement('火星に生命体はありますか?','<b>600</b> 宇宙船所持する。<q>はい、あります。現在、実験的なフレーバー#810675のプロトタイプを入れておく場所として使っています。</q>','宇宙船',13);
		order=1600;Game.TieredAchievement('相性はよくない','<b>600</b> 錬金術室所持する。','錬金術室',13);
		order=1700;Game.TieredAchievement('まくしたてる塚に削減','<b>600</b> ポータル所持する。','ポータル',13);
		order=1800;Game.TieredAchievement('もう戻った?','<b>600</b> タイムマシン所持する。','タイムマシン',13);
		order=1900;Game.TieredAchievement('核の王位','<b>600</b> 反物質凝縮器所持する。','反物質凝縮器',13);
		order=2000;Game.TieredAchievement('状態を軽視する','<b>600</b> プリズム所持する。','プリズム',13);
		order=2100;Game.TieredAchievement('クッキーを裏返す。屑なら俺の勝ち、皮ならお前の勝ちだ。','<b>600</b> チャンスメーカー所持する。','チャンスメーカー',13);
		order=2200;Game.TieredAchievement('そなわる本質に関して','<b>600</b> 自己無限生成エンジン所持する。','自己無限生成エンジン',13);
		order=2300;Game.TieredAchievement('ダック・タイピング','<b>600</b> Javascriptコンソール所持する。<q>ハロー、ダックタイピングだよ。ぶどうは手に入れた?</q>','Javascriptコンソール',13);
		
		order=2400;
		Game.TieredAchievement('彼らは何にやられているか分からない','<b>1</b> 遊休宇宙所持する。','遊休宇宙',1);
		Game.TieredAchievement('宇宙に詳しい','<b>50</b> 遊休宇宙所持する。','遊休宇宙',2);
		Game.TieredAchievement('収穫時','<b>100</b> 遊休宇宙所持する。','遊休宇宙',3);
		Game.TieredAchievement('非現実','<b>150</b> 遊休宇宙所持する。','遊休宇宙',4);
		Game.TieredAchievement('一度見てしまった','<b>200</b> 遊休宇宙所持する。','遊休宇宙',5);
		Game.TieredAchievement('略奪品と略奪者','<b>250</b> 遊休宇宙所持する。','遊休宇宙',6);
		Game.TieredAchievement('目的なしには人は生きられず、誰しもがどこかに所属しているのだ','<b>300</b> 遊休宇宙所持する。<q>テレビでも見ない?</q>','遊休宇宙',7);
		Game.TieredAchievement('超空間高速道路','<b>350</b> 遊休宇宙所持する。','遊休宇宙',8);
		Game.TieredAchievement('万能宇宙','<b>400</b> 遊休宇宙所持する。','遊休宇宙',9);
		Game.TieredAchievement('あなたは絶対なのだ','<b>450</b> 遊休宇宙所持する。','遊休宇宙',10);
		Game.TieredAchievement('この宇宙から離れて','<b>500</b> 遊休宇宙所持する。','遊休宇宙',11);
		Game.TieredAchievement('一度に全宇宙に','<b>550</b> 遊休宇宙所持する。','遊休宇宙',12);
		Game.TieredAchievement('あなたの現実で塗り替えろ','<b>600</b> 遊休宇宙所持する。','遊休宇宙',13);
		
		order=2420;
		Game.ProductionAchievement('ほんの入り口','遊休宇宙',1);
		Game.ProductionAchievement('一貫性','遊休宇宙',2);
		Game.ProductionAchievement('マーベル・ユニバース','遊休宇宙',3);
		
		new Game.Achievement('奇妙な幾何学','遊休宇宙がレベル <b>10</b> に到達する。',[33,26]);Game.Objects['遊休宇宙'].levelAchiev10=Game.last;
		
		order=5000;
		new Game.Achievement('雄大なデザイン','施設を <b>4000</b> 個所持する。<q>彼らはあなたのことを永遠に覚えているでしょう!</q>',[32,12]);
		new Game.Achievement('エクメノポリス','施設を <b>8000</b> 個所持する。<q>ちょっと窮屈になってきた。</q>',[33,12]);
		
		order=6000;
		new Game.Achievement('全体像','アップグレードを <b>300</b> 個購入する。<q>だからそれがピッタリなんだ!</q>',[32,11]);
		new Game.Achievement('加えるものがなくなった時','アップグレードを <b>400</b> 個購入する。<q>…進み続けろ。</q>',[33,11]);
		
		order=7002;
		new Game.Achievement('600個記念','<b>全施設を600個</b> 以上所持する。<q>やあ、いいマイルストーンだ!</q>',[31,33]);
		
		Game.CpsAchievement('ストップって言うまでやって');
		Game.CpsAchievement('でも俺はストップなんて言わなかった、そうだろ?');
		Game.CpsAchievement('比類ない熱意で');
		Game.BankAchievement('大きく考えよう');
		Game.BankAchievement('ハイパーサイズ・ミー');
		Game.BankAchievement('容量最大');
		
		order=61616;
		new Game.Achievement('流動資産','在庫市場の利益が <b>$10,000,000</b> を超える。',[12,33]);
		
		//end of achievements
		
		/*=====================================================================================
		BUFFS
		=======================================================================================*/
		
		Game.buffs={};//buffs currently in effect by name
		Game.buffsI=0;
		Game.buffsL=l('buffs');
		Game.gainBuff=function(type,time,arg1,arg2,arg3)
		{
			type=Game.buffTypesByName[type];
			var obj=type.func(time,arg1,arg2,arg3);
			obj.type=type;
			obj.arg1=arg1;
			obj.arg2=arg2;
			obj.arg3=arg3;
			
			var buff={
				visible:true,
				time:0,
				name:'???',
				desc:'',
				icon:[0,0]
			};
			if (Game.buffs[obj.name])//if there is already a buff in effect with this name
			{
				var buff=Game.buffs[obj.name];
				if (obj.max) buff.time=Math.max(obj.time,buff.time);//new duration is max of old and new
				if (obj.add) buff.time+=obj.time;//new duration is old + new
				if (!obj.max && !obj.add) buff.time=obj.time;//new duration is set to new
				buff.maxTime=buff.time;
			}
			else//create new buff
			{
				for (var i in obj)//paste parameters onto buff
				{buff[i]=obj[i];}
				buff.maxTime=buff.time;
				Game.buffs[buff.name]=buff;
				buff.id=Game.buffsI;
				
				//create dom
				Game.buffsL.innerHTML=Game.buffsL.innerHTML+'<div id="buff'+buff.id+'" class="crate enabled buff" '+(buff.desc?Game.getTooltip(
					'<div class="prompt" style="min-width:200px;text-align:center;font-size:11px;margin:8px 0px;"><h3>'+buff.name+'</h3><div class="line"></div>'+buff.desc+'</div>'
				,'left',true):'')+' style="opacity:1;float:none;display:block;'+(buff.icon[2]?'background-image:url('+buff.icon[2]+');':'')+'background-position:'+(-buff.icon[0]*48)+'px '+(-buff.icon[1]*48)+'px;"></div>';
				
				buff.l=l('buff'+buff.id);
				
				Game.buffsI++;
			}
			Game.recalculateGains=1;
			Game.storeToRefresh=1;
			return buff;
		}
		Game.hasBuff=function(what)//returns 0 if there is no buff in effect with this name; else, returns it
		{if (!Game.buffs[what]) return 0; else return Game.buffs[what];}
		Game.updateBuffs=function()//executed every logic frame
		{
			for (var i in Game.buffs)
			{
				var buff=Game.buffs[i];
				
				if (buff.time>=0)
				{
					if (!l('buffPieTimer'+buff.id)) l('buff'+buff.id).innerHTML=l('buff'+buff.id).innerHTML+'<div class="pieTimer" id="buffPieTimer'+buff.id+'"></div>';
					var T=1-(buff.time/buff.maxTime);
					T=(T*144)%144;
					l('buffPieTimer'+buff.id).style.backgroundPosition=(-Math.floor(T%18))*48+'px '+(-Math.floor(T/18))*48+'px';
				}
				buff.time--;
				if (buff.time<=0)
				{
					if (Game.onCrate==l('buff'+buff.id)) Game.tooltip.hide();
					if (buff.onDie) buff.onDie();
					Game.buffsL.removeChild(l('buff'+buff.id));
					if (Game.buffs[buff.name])
					{
						Game.buffs[buff.name]=0;
						delete Game.buffs[buff.name];
					}
					Game.recalculateGains=1;
					Game.storeToRefresh=1;
				}
			}
		}
		Game.killBuff=function(what)//remove a buff by name
		{if (Game.buffs[what]){Game.buffs[what].time=0;/*Game.buffs[what]=0;*/}}
		Game.killBuffs=function()//remove all buffs
		{Game.buffsL.innerHTML='';Game.buffs={};Game.recalculateGains=1;Game.storeToRefresh=1;}
		
		
		Game.buffTypes=[];//buff archetypes; only buffs declared from these can be saved and loaded
		Game.buffTypesByName=[];
		Game.buffTypesN=0;
		Game.buffType=function(name,func)
		{
			this.name=name;
			this.func=func;//this is a function that returns a buff object; it takes a "time" argument in seconds, and 3 more optional arguments at most, which will be saved and loaded as floats
			this.id=Game.buffTypesN;
			this.vanilla=Game.vanilla;
			Game.buffTypesByName[this.name]=this;
			Game.buffTypes[Game.buffTypesN]=this;
			Game.buffTypesN++;
		}
		
		/*
		basic buff parameters :
			name:'Kitten rain',
			desc:'It\'s raining kittens!',
			icon:[0,0],
			time:30*Game.fps
		other parameters :
			visible:false - will hide the buff from the buff list
			add:true - if this buff already exists, add the new duration to the old one
			max:true - if this buff already exists, set the new duration to the max of either
			onDie:function(){} - function will execute when the buff runs out
			power:3 - used by some buffs
			multCpS:3 - buff multiplies CpS by this amount
			multClick:3 - buff multiplies click power by this amount
		*/
		
		//base buffs
		new Game.buffType('frenzy',function(time,pow)
		{
			return {
				name:'フィーバー',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'、 x'+pow+' !',
				icon:[10,14],
				time:time*Game.fps,
				add:true,
				multCpS:pow,
				aura:1
			};
		});
		new Game.buffType('blood frenzy',function(time,pow)
		{
			return {
				name:'荒ぶるおばあちゃん',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'、 x'+pow+' !',
				icon:[29,6],
				time:time*Game.fps,
				add:true,
				multCpS:pow,
				aura:1
			};
		});
		new Game.buffType('clot',function(time,pow)
		{
			return {
				name:'渋滞発生',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'、半減!',
				icon:[15,5],
				time:time*Game.fps,
				add:true,
				multCpS:pow,
				aura:2
			};
		});
		new Game.buffType('dragon harvest',function(time,pow)
		{
			if (Game.Has('ドラゴンの牙')) pow=Math.ceil(pow*1.1);
			return {
				name:'刈れよドラゴン',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'、 x'+pow+' !',
				icon:[10,25],
				time:time*Game.fps,
				add:true,
				multCpS:pow,
				aura:1
			};
		});
		new Game.buffType('everything must go',function(time,pow)
		{
			return {
				name:'もってけドロボー',
				desc:'全ての施設が'+Game.sayTime(time*Game.fps,-1)+'、 '+pow+'% 安く!',
				icon:[17,6],
				time:time*Game.fps,
				add:true,
				power:pow,
				aura:1
			};
		});
		new Game.buffType('cursed finger',function(time,pow)
		{
			return {
				name:'呪われた指',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'停止、<br>その代わり、1回のクリックがCpSの'+Game.sayTime(time*Game.fps,-1)+'分に。',
				icon:[12,17],
				time:time*Game.fps,
				add:true,
				power:pow,
				multCpS:0,
				aura:1
			};
		});
		new Game.buffType('click frenzy',function(time,pow)
		{
			return {
				name:'クリックフィーバー',
				desc:'クリックの生産量が'+Game.sayTime(time*Game.fps,-1)+'、 x'+pow+' !',
				icon:[0,14],
				time:time*Game.fps,
				add:true,
				multClick:pow,
				aura:1
			};
		});
		new Game.buffType('dragonflight',function(time,pow)
		{
			if (Game.Has('ドラゴンの牙')) pow=Math.ceil(pow*1.1);
			return {
				name:'翔べよドラゴン',
				desc:'クリックの生産量が'+Game.sayTime(time*Game.fps,-1)+'、 x'+pow+' !',
				icon:[0,25],
				time:time*Game.fps,
				add:true,
				multClick:pow,
				aura:1
			};
		});
		new Game.buffType('cookie storm',function(time,pow)
		{
			return {
				name:'吹けよ風、呼べよクッキー',
				desc:'どこ見てもクッキー!',
				icon:[22,6],
				time:time*Game.fps,
				add:true,
				power:pow,
				aura:1
			};
		});
		new Game.buffType('building buff',function(time,pow,building)
		{
			var obj=Game.ObjectsById[building];
			return {
				name:Game.goldenCookieBuildingBuffs[obj.name][0],
				desc:'所持している'+Beautify(obj.amount)+obj.plural+'がCpSを強化!<br>クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'、 +'+(Math.ceil(pow*100-100))+'% !',
				icon:[obj.iconColumn,14],
				time:time*Game.fps,
				add:true,
				multCpS:pow,
				aura:1
			};
		});
		new Game.buffType('building debuff',function(time,pow,building)
		{
			var obj=Game.ObjectsById[building];
			return {
				name:Game.goldenCookieBuildingBuffs[obj.name][1],
				desc:'所持している'+Beautify(obj.amount)+obj.plural+'がCpSを鈍化!<br>クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'、 '+(Math.ceil(pow*100-100))+'% 遅く!',
				icon:[obj.iconColumn,15],
				time:time*Game.fps,
				add:true,
				multCpS:1/pow,
				aura:2
			};
		});
		new Game.buffType('sugar blessing',function(time,pow)
		{
			return {
				name:'砂糖の祝福',
				desc:'次の'+Game.sayTime(time*Game.fps,-1)+'、ゴールデンクッキーが 10% より見つけやすくなります。',
				icon:[29,16],
				time:time*Game.fps,
				//add:true
			};
		});
		new Game.buffType('haggler luck',function(time,pow)
		{
			return {
				name:'値切り運',
				desc:'全てのアップグレードが'+Game.sayTime(time*Game.fps,-1)+'、 '+pow+'% 安く!',
				icon:[25,11],
				time:time*Game.fps,
				power:pow,
				max:true
			};
		});
		new Game.buffType('haggler misery',function(time,pow)
		{
			return {
				name:'押し売り',
				desc:'全てのアップグレードが'+Game.sayTime(time*Game.fps,-1)+'、 '+pow+'% 高く!',
				icon:[25,11],
				time:time*Game.fps,
				power:pow,
				max:true
			};
		});
		new Game.buffType('pixie luck',function(time,pow)
		{
			return {
				name:'ずる賢い妖精たち',
				desc:'全ての施設が'+Game.sayTime(time*Game.fps,-1)+'、 '+pow+'% 安く!',
				icon:[26,11],
				time:time*Game.fps,
				power:pow,
				max:true
			};
		});
		new Game.buffType('pixie misery',function(time,pow)
		{
			return {
				name:'卑劣なゴブリン',
				desc:'全ての施設が'+Game.sayTime(time*Game.fps,-1)+'、 '+pow+'% 高く!',
				icon:[26,11],
				time:time*Game.fps,
				power:pow,
				max:true
			};
		});
		new Game.buffType('magic adept',function(time,pow)
		{
			return {
				name:'魔法名人',
				desc:'呪文の逆効果が'+Game.sayTime(time*Game.fps,-1)+'、'+pow+'分の一になります。',
				icon:[29,11],
				time:time*Game.fps,
				power:pow,
				max:true
			};
		});
		new Game.buffType('magic inept',function(time,pow)
		{
			return {
				name:'へたっぴ魔法使い',
				desc:'呪文の逆効果が'+Game.sayTime(time*Game.fps,-1)+'、'+pow+'倍になります。',
				icon:[29,11],
				time:time*Game.fps,
				power:pow,
				max:true
			};
		});
		new Game.buffType('devastation',function(time,pow)
		{
			return {
				name:'惨状',
				desc:'クリックの生産量が'+Game.sayTime(time*Game.fps,-1)+'、+'+Math.floor(pow*100-100)+'% 増加!',
				icon:[23,18],
				time:time*Game.fps,
				multClick:pow,
				aura:1,
				max:true
			};
		});
		new Game.buffType('sugar frenzy',function(time,pow)
		{
			return {
				name:'砂糖フィーバー',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'、 x'+pow+' !',
				icon:[29,14],
				time:time*Game.fps,
				add:true,
				multCpS:pow,
				aura:0
			};
		});
		new Game.buffType('loan 1',function(time,pow)
		{
			return {
				name:'第1種ローン',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'の間、 '+pow+'倍。',
				icon:[1,33],
				time:time*Game.fps,
				power:pow,
				multCpS:pow,
				max:true,
				onDie:function(){if (Game.takeLoan) {Game.takeLoan(1,true);}},
			};
		});
		new Game.buffType('loan 1 interest',function(time,pow)
		{
			return {
				name:'第1種ローン(利子)',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'の間、 '+pow+'倍。',
				icon:[1,33],
				time:time*Game.fps,
				power:pow,
				multCpS:pow,
				max:true
			};
		});
		new Game.buffType('loan 2',function(time,pow)
		{
			return {
				name:'第2種ローン',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'の間、 '+pow+'倍。',
				icon:[1,33],
				time:time*Game.fps,
				power:pow,
				multCpS:pow,
				max:true,
				onDie:function(){if (Game.takeLoan) {Game.takeLoan(2,true);}},
			};
		});
		new Game.buffType('loan 2 interest',function(time,pow)
		{
			return {
				name:'第2種ローン(利子)',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'の間、 '+pow+'倍。',
				icon:[1,33],
				time:time*Game.fps,
				power:pow,
				multCpS:pow,
				max:true
			};
		});
		new Game.buffType('loan 3',function(time,pow)
		{
			return {
				name:'第3種ローン',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'の間、 '+pow+'倍。',
				icon:[1,33],
				time:time*Game.fps,
				power:pow,
				multCpS:pow,
				max:true,
				onDie:function(){if (Game.takeLoan) {Game.takeLoan(3,true);}},
			};
		});
		new Game.buffType('loan 3 interest',function(time,pow)
		{
			return {
				name:'第3種ローン(利子)',
				desc:'クッキーの生産が'+Game.sayTime(time*Game.fps,-1)+'の間、 '+pow+'倍。',
				icon:[1,33],
				time:time*Game.fps,
				power:pow,
				multCpS:pow,
				max:true
			};
		});
		
		//end of buffs
		
		
		
		
		
		BeautifyAll();
		Game.vanilla=0;//everything we create beyond this will not be saved in the default save
		
		
		Game.runModHook('create');
		
		
		/*=====================================================================================
		GRANDMAPOCALYPSE
		=======================================================================================*/
		Game.UpdateGrandmapocalypse=function()
		{
			if (Game.Has('契約') || Game.Objects['グランマ'].amount==0) Game.elderWrath=0;
			else if (Game.pledgeT>0)//if the pledge is active, lower it
			{
				Game.pledgeT--;
				if (Game.pledgeT==0)//did we reach 0? make the pledge purchasable again
				{
					Game.Lock('誓約');
					Game.Unlock('誓約');
					Game.elderWrath=1;
				}
			}
			else
			{
				if (Game.Has('統合思念') && Game.elderWrath==0)
				{
					Game.elderWrath=1;
				}
				if (Math.random()<0.001 && Game.elderWrath<Game.Has('統合思念')+Game.Has('集団洗脳')+Game.Has('約束'))
				{
					Game.elderWrath++;//have we already pledged? make the elder wrath shift between different stages
				}
				if (Game.Has('約束') && Game.Upgrades['誓約'].unlocked==0)
				{
					Game.Lock('誓約');
					Game.Unlock('誓約');
				}
			}
			Game.elderWrathD+=((Game.elderWrath+1)-Game.elderWrathD)*0.001;//slowly fade to the target wrath state
			
			if (Game.elderWrath!=Game.elderWrathOld) Game.storeToRefresh=1;
			
			Game.elderWrathOld=Game.elderWrath;
			
			Game.UpdateWrinklers();
		}
		
		//wrinklers
		
		function inRect(x,y,rect)
		{
			//find out if the point x,y is in the rotated rectangle rect{w,h,r,o} (width,height,rotation in radians,y-origin) (needs to be normalized)
			//I found this somewhere online I guess
			var dx = x+Math.sin(-rect.r)*(-(rect.h/2-rect.o)),dy=y+Math.cos(-rect.r)*(-(rect.h/2-rect.o));
			var h1 = Math.sqrt(dx*dx + dy*dy);
			var currA = Math.atan2(dy,dx);
			var newA = currA - rect.r;
			var x2 = Math.cos(newA) * h1;
			var y2 = Math.sin(newA) * h1;
			if (x2 > -0.5 * rect.w && x2 < 0.5 * rect.w && y2 > -0.5 * rect.h && y2 < 0.5 * rect.h) return true;
			return false;
		}
		
		Game.wrinklerHP=2.1;
		Game.wrinklers=[];
		for (var i=0;i<12;i++)
		{
			Game.wrinklers.push({id:parseInt(i),close:0,sucked:0,phase:0,x:0,y:0,r:0,hurt:0,hp:Game.wrinklerHP,selected:0,type:0});
		}
		Game.getWrinklersMax=function()
		{
			var n=10;
			if (Game.Has('エルダースパイス')) n+=2;
			return n;
		}
		Game.ResetWrinklers=function()
		{
			for (var i in Game.wrinklers)
			{
				Game.wrinklers[i]={id:parseInt(i),close:0,sucked:0,phase:0,x:0,y:0,r:0,hurt:0,hp:Game.wrinklerHP,selected:0,type:0};
			}
		}
		Game.CollectWrinklers=function()
		{
			for (var i in Game.wrinklers)
			{
				Game.wrinklers[i].hp=0;
			}
		}
		Game.wrinklerSquishSound=Math.floor(Math.random()*4)+1;
		Game.playWrinklerSquishSound=function()
		{
			PlaySound('snd/squish'+(Game.wrinklerSquishSound)+'.mp3',0.5);
			Game.wrinklerSquishSound+=Math.floor(Math.random()*1.5)+1;
			if (Game.wrinklerSquishSound>4) Game.wrinklerSquishSound-=4;
		}
		Game.SpawnWrinkler=function(me)
		{
			if (!me)
			{
				var max=Game.getWrinklersMax();
				var n=0;
				for (var i in Game.wrinklers)
				{
					if (Game.wrinklers[i].phase>0) n++;
				}
				for (var i in Game.wrinklers)
				{
					var it=Game.wrinklers[i];
					if (it.phase==0 && Game.elderWrath>0 && n<max && it.id<max)
					{
						me=it;
						break;
					}
				}
			}
			if (!me) return false;
			me.phase=1;
			me.hp=Game.wrinklerHP;
			me.type=0;
			if (Math.random()<0.0001) me.type=1;//shiny wrinkler
			return me;
		}
		Game.PopRandomWrinkler=function()
		{
			var wrinklers=[];
			for (var i in Game.wrinklers)
			{
				if (Game.wrinklers[i].phase>0 && Game.wrinklers[i].hp>0) wrinklers.push(Game.wrinklers[i]);
			}
			if (wrinklers.length>0)
			{
				var me=choose(wrinklers);
				me.hp=-10;
				return me;
			}
			return false;
		}
		Game.UpdateWrinklers=function()
		{
			var xBase=0;
			var yBase=0;
			var onWrinkler=0;
			if (Game.LeftBackground)
			{
				xBase=Game.cookieOriginX;
				yBase=Game.cookieOriginY;
			}
			var max=Game.getWrinklersMax();
			var n=0;
			for (var i in Game.wrinklers)
			{
				if (Game.wrinklers[i].phase>0) n++;
			}
			for (var i in Game.wrinklers)
			{
				var me=Game.wrinklers[i];
				if (me.phase==0 && Game.elderWrath>0 && n<max && me.id<max)
				{
					var chance=0.00001*Game.elderWrath;
					chance*=Game.eff('wrinklerSpawn');
					if (Game.Has('不浄の餌')) chance*=5;
					if (Game.hasGod)
					{
						var godLvl=Game.hasGod('scorn');
						if (godLvl==1) chance*=2.5;
						else if (godLvl==2) chance*=2;
						else if (godLvl==3) chance*=1.5;
					}
					if (Game.Has('害虫ホイホイ')) chance=0.1;
					if (Math.random()<chance)//respawn
					{
						Game.SpawnWrinkler(me);
					}
				}
				if (me.phase>0)
				{
					if (me.close<1) me.close+=(1/Game.fps)/10;
					if (me.close>1) me.close=1;
				}
				else me.close=0;
				if (me.close==1 && me.phase==1)
				{
					me.phase=2;
					Game.recalculateGains=1;
				}
				if (me.phase==2)
				{
					me.sucked+=(((Game.cookiesPs/Game.fps)*Game.cpsSucked));//suck the cookies
				}
				if (me.phase>0)
				{
					if (me.type==0)
					{
						if (me.hp<Game.wrinklerHP) me.hp+=0.04;
						me.hp=Math.min(Game.wrinklerHP,me.hp);
					}
					else if (me.type==1)
					{
						if (me.hp<Game.wrinklerHP*3) me.hp+=0.04;
						me.hp=Math.min(Game.wrinklerHP*3,me.hp);
					}
					var d=128*(2-me.close);//*Game.BigCookieSize;
					if (Game.prefs.fancy) d+=Math.cos(Game.T*0.05+parseInt(me.id))*4;
					me.r=(me.id/max)*360;
					if (Game.prefs.fancy) me.r+=Math.sin(Game.T*0.05+parseInt(me.id))*4;
					me.x=xBase+(Math.sin(me.r*Math.PI/180)*d);
					me.y=yBase+(Math.cos(me.r*Math.PI/180)*d);
					if (Game.prefs.fancy) me.r+=Math.sin(Game.T*0.09+parseInt(me.id))*4;
					var rect={w:100,h:200,r:(-me.r)*Math.PI/180,o:10};
					if (Math.random()<0.01) me.hurt=Math.max(me.hurt,Math.random());
					if (Game.T%5==0 && Game.CanClick) {if (Game.LeftBackground && Game.mouseX<Game.LeftBackground.canvas.width && inRect(Game.mouseX-me.x,Game.mouseY-me.y,rect)) me.selected=1; else me.selected=0;}
					if (me.selected && onWrinkler==0 && Game.CanClick)
					{
						me.hurt=Math.max(me.hurt,0.25);
						//me.close*=0.99;
						if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas'))
						{
							if (Game.keys[17] && Game.sesame) {me.type=!me.type;PlaySound('snd/shimmerClick.mp3');}//ctrl-click on a wrinkler in god mode to toggle its shininess
							else
							{
								Game.playWrinklerSquishSound();
								me.hurt=1;
								me.hp-=0.75;
								if (Game.prefs.particles && !(me.hp<=0.5 && me.phase>0))
								{
									var x=me.x+(Math.sin(me.r*Math.PI/180)*90);
									var y=me.y+(Math.cos(me.r*Math.PI/180)*90);
									for (var ii=0;ii<3;ii++)
									{
										//Game.particleAdd(x+Math.random()*50-25,y+Math.random()*50-25,Math.random()*4-2,Math.random()*-2-2,1,1,2,'wrinklerBits.png');
										var part=Game.particleAdd(x,y,Math.random()*4-2,Math.random()*-2-2,1,1,2,me.type==1?'shinyWrinklerBits.png':'wrinklerBits.png');
										part.r=-me.r;
									}
								}
							}
							Game.Click=0;
						}
						onWrinkler=1;
					}
				}
				
				if (me.hurt>0)
				{
					me.hurt-=5/Game.fps;
					//me.close-=me.hurt*0.05;
					//me.x+=Math.random()*2-1;
					//me.y+=Math.random()*2-1;
					me.r+=(Math.sin(Game.T*1)*me.hurt)*18;//Math.random()*2-1;
				}
				if (me.hp<=0.5 && me.phase>0)
				{
					Game.playWrinklerSquishSound();
					PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
					Game.wrinklersPopped++;
					Game.recalculateGains=1;
					me.phase=0;
					me.close=0;
					me.hurt=0;
					me.hp=3;
					var toSuck=1.1;
					if (Game.Has('罰当たりな改変')) toSuck*=1.05;
					if (me.type==1) toSuck*=3;//shiny wrinklers are an elusive, profitable breed
					me.sucked*=toSuck;//cookie dough does weird things inside wrinkler digestive tracts
					if (Game.Has('虫の卵')) me.sucked*=1.05;
					if (Game.hasGod)
					{
						var godLvl=Game.hasGod('scorn');
						if (godLvl==1) me.sucked*=1.15;
						else if (godLvl==2) me.sucked*=1.1;
						else if (godLvl==3) me.sucked*=1.05;
					}
					if (me.sucked>0.5)
					{
						if (Game.prefs.popups) Game.Popup(''+(me.type==1?'輝く':'')+'虫は四散した : '+Beautify(me.sucked)+'クッキーを発見した!');
						else Game.Notify(''+(me.type==1?'輝く':'')+'虫は四散した','<b>'+Beautify(me.sucked)+'</b>クッキーを発見した!',[19,8],6);
						Game.Popup('<div style="font-size:80%;">+'+Beautify(me.sucked)+'クッキー</div>',Game.mouseX,Game.mouseY);
						
						if (Game.season=='halloween')
						{
							//if (Math.random()<(Game.HasAchiev('クッキーおばけ')?0.2:0.05))//halloween cookie drops
							var failRate=0.95;
							if (Game.HasAchiev('クッキーおばけ')) failRate=0.8;
							if (Game.Has('スターテラー')) failRate*=0.9;
							failRate*=1/Game.dropRateMult();
							if (Game.hasGod)
							{
								var godLvl=Game.hasGod('seasons');
								if (godLvl==1) failRate*=0.9;
								else if (godLvl==2) failRate*=0.95;
								else if (godLvl==3) failRate*=0.97;
							}
							if (me.type==1) failRate*=0.9;
							if (Math.random()>failRate)//halloween cookie drops
							{
								var cookie=choose(['骨クッキー','幽霊クッキー','こうもりクッキー','スライムクッキー','かぼちゃクッキー','眼球クッキー','蜘蛛クッキー']);
								if (!Game.HasUnlocked(cookie) && !Game.Has(cookie))
								{
									Game.Unlock(cookie);
									if (Game.prefs.popups) Game.Popup('見つけたもの : '+cookie+'!');
									else Game.Notify(cookie,'<b>'+cookie+'</b>も発見した!',Game.Upgrades[cookie].icon);
								}
							}
						}
						Game.DropEgg(0.98);
					}
					if (me.type==1) Game.Win('最後の一匹');
					Game.Earn(me.sucked);
					/*if (Game.prefs.particles)
					{
						var x=me.x+(Math.sin(me.r*Math.PI/180)*100);
						var y=me.y+(Math.cos(me.r*Math.PI/180)*100);
						for (var ii=0;ii<6;ii++)
						{
							Game.particleAdd(x+Math.random()*50-25,y+Math.random()*50-25,Math.random()*4-2,Math.random()*-2-2,1,1,2,'wrinklerBits.png');
						}
					}*/
					if (Game.prefs.particles)
					{
						var x=me.x+(Math.sin(me.r*Math.PI/180)*90);
						var y=me.y+(Math.cos(me.r*Math.PI/180)*90);
						if (me.sucked>0)
						{
							for (var ii=0;ii<5;ii++)
							{
								Game.particleAdd(Game.mouseX,Game.mouseY,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.75,1.5,2);
							}
						}
						for (var ii=0;ii<8;ii++)
						{
							var part=Game.particleAdd(x,y,Math.random()*4-2,Math.random()*-2-2,1,1,2,me.type==1?'shinyWrinklerBits.png':'wrinklerBits.png');
							part.r=-me.r;
						}
					}
					me.sucked=0;
				}
			}
			if (onWrinkler)
			{
				Game.mousePointer=1;
			}
		}
		Game.DrawWrinklers=function()
		{
			var ctx=Game.LeftBackground;
			var selected=0;
			for (var i in Game.wrinklers)
			{
				var me=Game.wrinklers[i];
				if (me.phase>0)
				{
					ctx.globalAlpha=me.close;
					ctx.save();
					ctx.translate(me.x,me.y);
					ctx.rotate(-(me.r)*Math.PI/180);
					//var s=Math.min(1,me.sucked/(Game.cookiesPs*60))*0.75+0.25;//scale wrinklers as they eat
					//ctx.scale(Math.pow(s,1.5)*1.25,s);
					//ctx.fillRect(-50,-10,100,200);
					if (me.type==1) ctx.drawImage(Pic('shinyWrinkler.png'),-50,-10);
					else if (Game.season=='christmas') ctx.drawImage(Pic('winterWrinkler.png'),-50,-10);
					else ctx.drawImage(Pic('wrinkler.png'),-50,-10);
					//ctx.fillText(me.id+' : '+me.sucked,0,0);
					if (me.type==1 && Math.random()<0.3 && Game.prefs.particles)//sparkle
					{
						ctx.globalAlpha=Math.random()*0.65+0.1;
						var s=Math.random()*30+5;
						ctx.globalCompositeOperation='lighter';
						ctx.drawImage(Pic('glint.jpg'),-s/2+Math.random()*50-25,-s/2+Math.random()*200,s,s);
					}
					ctx.restore();
					
					if (me.phase==2 && Math.random()<0.03 && Game.prefs.particles)
					{
						Game.particleAdd(me.x,me.y,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.5,1,2);
					}
					
					if (me.selected) selected=me;
				}
			}
			if (selected && Game.Has('アイ・オブ・ザ・リンクラー'))
			{
				var x=Game.cookieOriginX;
				var y=Game.cookieOriginY;
				ctx.font='14px Merriweather';
				ctx.textAlign='center';
				var width=Math.max(ctx.measureText('食べた分 :').width,ctx.measureText(Beautify(selected.sucked)).width);
				ctx.fillStyle='#000';
				ctx.strokeStyle='#000';
				ctx.lineWidth=8;
				ctx.globalAlpha=0.5;
				ctx.beginPath();
				ctx.moveTo(x,y);
				ctx.lineTo(Math.floor(selected.x),Math.floor(selected.y));
				ctx.stroke();
				ctx.fillRect(x-width/2-8-14,y-23,width+16+28,38);
				ctx.globalAlpha=1;
				ctx.fillStyle='#fff';
				ctx.fillText('食べた分 :',x+14,y-8);
				ctx.fillText(Beautify(selected.sucked),x+14,y+8);
				ctx.drawImage(Pic('icons.png'),27*48,26*48,48,48,x-width/2-8-22,y-4-24,48,48);
			}
		}
		Game.SaveWrinklers=function()
		{
			var amount=0;
			var amountShinies=0;
			var number=0;
			var shinies=0;
			for (var i in Game.wrinklers)
			{
				if (Game.wrinklers[i].sucked>0.5)
				{
					number++;
					if (Game.wrinklers[i].type==1)
					{
						shinies++;
						amountShinies+=Game.wrinklers[i].sucked;
					}
					else amount+=Game.wrinklers[i].sucked;
				}
			}
			return {amount:amount,number:number,shinies:shinies,amountShinies:amountShinies};
		}
		Game.LoadWrinklers=function(amount,number,shinies,amountShinies)
		{
			if (number>0 && (amount>0 || amountShinies>0))
			{
				var fullNumber=number-shinies;
				var fullNumberShinies=shinies;
				for (var i in Game.wrinklers)
				{
					if (number>0)
					{
						Game.wrinklers[i].phase=2;
						Game.wrinklers[i].close=1;
						Game.wrinklers[i].hp=3;
						if (shinies>0) {Game.wrinklers[i].type=1;Game.wrinklers[i].sucked=amountShinies/fullNumberShinies;shinies--;}
						else Game.wrinklers[i].sucked=amount/fullNumber;
						number--;
					}//respawn
				}
			}
		}
		
		/*=====================================================================================
		SPECIAL THINGS AND STUFF
		=======================================================================================*/
		
		
		Game.specialTab='';
		Game.specialTabHovered='';
		Game.specialTabs=[];
		
		Game.UpdateSpecial=function()
		{
			Game.specialTabs=[];
			if (Game.Has('とある祭りの帽子')) Game.specialTabs.push('santa');
			if (Game.Has('ポロポロこぼれそうな卵')) Game.specialTabs.push('dragon');
			if (Game.specialTabs.length==0) {Game.ToggleSpecialMenu(0);return;}
		
			if (Game.LeftBackground)
			{
				Game.specialTabHovered='';
				var len=Game.specialTabs.length;
				if (len==0) return;
				var y=Game.LeftBackground.canvas.height-24-48*len;
				for (var i=0;i<Game.specialTabs.length;i++)
				{
					var selected=0;
					if (Game.specialTab==Game.specialTabs[i]) selected=1;
					var x=24;
					var s=1;
					if (selected) {s=2;x+=24;}
					
					if (Math.abs(Game.mouseX-x)<=24*s && Math.abs(Game.mouseY-y)<=24*s)
					{
						Game.specialTabHovered=Game.specialTabs[i];
						Game.mousePointer=1;
						Game.CanClick=0;
						if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas'))
						{
							if (Game.specialTab!=Game.specialTabs[i]) {Game.specialTab=Game.specialTabs[i];Game.ToggleSpecialMenu(1);PlaySound('snd/press.mp3');}
							else {Game.ToggleSpecialMenu(0);PlaySound('snd/press.mp3');}
							//PlaySound('snd/tick.mp3');
						}
					}
					
					y+=48;
				}
			}
		}
		
		Game.santaLevels=['クリスマスの試験管','クリスマスの飾り','クリスマスリース','クリスマスツリー','クリスマスプレゼント','クリスマスエルフの胎児','嬰児エルフ','子供エルフ','青年エルフ','大エルフ','ニック','サンタクロース','老サンタクロース','真のサンタクロース','ファイナルクロース'];
		for (var i in Game.santaDrops)//scale christmas upgrade prices with santa level
		{Game.Upgrades[Game.santaDrops[i]].priceFunc=function(){return Math.pow(3,Game.santaLevel)*2525;}}
		
		Game.UpgradeSanta=function()
		{
			var moni=Math.pow(Game.santaLevel+1,Game.santaLevel+1);
			if (Game.cookies>moni && Game.santaLevel<14)
			{
				PlaySound('snd/shimmerClick.mp3');
				
				Game.Spend(moni);
				Game.santaLevel=(Game.santaLevel+1)%15;
				if (Game.santaLevel==14)
				{
					Game.Unlock('サンタの支配');
					if (Game.prefs.popups) Game.Popup('サンタの支配を<br>賜った。');
					else Game.Notify('サンタの支配を賜った。','',Game.Upgrades['サンタの支配'].icon);
				}
				var drops=[];
				for (var i in Game.santaDrops) {if (!Game.HasUnlocked(Game.santaDrops[i])) drops.push(Game.santaDrops[i]);}
				var drop=choose(drops);
				if (drop)
				{
					Game.Unlock(drop);
					if (Game.prefs.popups) Game.Popup('プレゼントに入っていたのは…<br>'+drop+'!');
					else Game.Notify('プレゼントを見つけました!','プレゼントに入っていたのは…<br><b>'+drop+'</b>!',Game.Upgrades[drop].icon);
				}
				
				Game.ToggleSpecialMenu(1);
				
				if (l('specialPic')){var rect=l('specialPic').getBoundingClientRect();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2);}
				
				if (Game.santaLevel>=6) Game.Win('街にやってきた');
				if (Game.santaLevel>=14) Game.Win('ハイル・サンタ');
				Game.recalculateGains=1;
				Game.upgradesToRebuild=1;
			}
		}
		
		Game.dragonLevels=[
			{name:'ドラゴンの卵',action:'ひびを入れろ',pic:0,
				cost:function(){return Game.cookies>=1000000;},
				buy:function(){Game.Spend(1000000);},
				costStr:function(){return Beautify(1000000)+'クッキー';}},
			{name:'ドラゴンの卵',action:'ひびを入れろ',pic:1,
				cost:function(){return Game.cookies>=1000000*2;},
				buy:function(){Game.Spend(1000000*2);},
				costStr:function(){return Beautify(1000000*2)+'クッキー';}},
			{name:'ドラゴンの卵',action:'ひびを入れろ',pic:2,
				cost:function(){return Game.cookies>=1000000*4;},
				buy:function(){Game.Spend(1000000*4);},
				costStr:function(){return Beautify(1000000*4)+'クッキー';}},
			{name:'微動するドラゴンの卵',action:'孵化させろ',pic:3,
				cost:function(){return Game.cookies>=1000000*8;},
				buy:function(){Game.Spend(1000000*8);},
				costStr:function(){return Beautify(1000000*8)+'クッキー';}},
			{name:'クランブラー、クッキーのひな',action:'ミルクブレスを鍛えろ<br><small>オーラ : 子猫の効果が 5% 上昇する</small>',pic:4,
				cost:function(){return Game.cookies>=1000000*16;},
				buy:function(){Game.Spend(1000000*16);},
				costStr:function(){return Beautify(1000000*16)+'クッキー';}},
			{name:'クランブラー、クッキーのひな',action:'ドラゴンカーソルを鍛えろ<br><small>オーラ : マウスクリックで得られるクッキーが 5% 上昇する</small>',pic:4,
				cost:function(){return Game.Objects['カーソル'].amount>=100;},
				buy:function(){Game.Objects['カーソル'].sacrifice(100);},
				costStr:function(){return '100カーソル';}},
			{name:'クランブラー、クッキーのひな',action:'旧き者らの大隊 ババタリオンを鍛えろ<br><small>オーラ : グランマの CpS がグランマ以外の施設 1 つにつき + 1% 上昇する</small>',pic:4,
				cost:function(){return Game.Objects['グランマ'].amount>=100;},
				buy:function(){Game.Objects['グランマ'].sacrifice(100);},
				costStr:function(){return '100グランマ';}},
			{name:'クランブラー、クッキーのひな',action:'刈り取る者を鍛えろ<br><small>オーラ : ゴールデンクッキー・レッドクッキーの効果リストに 刈れよドラゴン が追加される</small>',pic:4,
				cost:function(){return Game.Objects['農場'].amount>=100;},
				buy:function(){Game.Objects['農場'].sacrifice(100);},
				costStr:function(){return '100農場';}},
			{name:'クランブラー、クッキードラゴン',action:'大地を砕く者を鍛えろ<br><small>オーラ : 施設の売却で戻ってくるクッキーが値段の 25% から 50% になる</small>',pic:5,
				cost:function(){return Game.Objects['鉱山'].amount>=100;},
				buy:function(){Game.Objects['鉱山'].sacrifice(100);},
				costStr:function(){return '100鉱山';}},
			{name:'クランブラー、クッキードラゴン',action:'武器庫の主を鍛えろ<br><small>オーラ : アップグレードの値段が 2% 安くなる</small>',pic:5,
				cost:function(){return Game.Objects['工場'].amount>=100;},
				buy:function(){Game.Objects['工場'].sacrifice(100);},
				costStr:function(){return '100工場';}},
			{name:'クランブラー、クッキードラゴン',action:'爆買いを鍛えろ<br><small>オーラ : 施設の値段が 2% 安くなる</small>',pic:5,
				cost:function(){return Game.Objects['銀行'].amount>=100;},
				buy:function(){Game.Objects['銀行'].sacrifice(100);},
				costStr:function(){return '100銀行';}},
			{name:'クランブラー、クッキードラゴン',action:'龍神を鍛えろ<br><small>オーラ : 名声によるボーナスが 5% 上昇する</small>',pic:5,
				cost:function(){return Game.Objects['神殿'].amount>=100;},
				buy:function(){Game.Objects['神殿'].sacrifice(100);},
				costStr:function(){return '100神殿';}},
			{name:'クランブラー、クッキードラゴン',action:'難解至極のオーラを鍛えろ<br><small>オーラ : ゴールデンクッキー・レッドクッキーが 5% 出やすくなる</small>',pic:5,
				cost:function(){return Game.Objects['魔法使いの塔'].amount>=100;},
				buy:function(){Game.Objects['魔法使いの塔'].sacrifice(100);},
				costStr:function(){return '100魔法使いの塔';}},
			{name:'クランブラー、クッキードラゴン',action:'ドラゴン便を鍛えろ<br><small>オーラ : ゴールデンクッキー・レッドクッキーの効果リストに 翔べよドラゴン が追加される</small>',pic:5,
				cost:function(){return Game.Objects['宇宙船'].amount>=100;},
				buy:function(){Game.Objects['宇宙船'].sacrifice(100);},
				costStr:function(){return '100宇宙船';}},
			{name:'クランブラー、クッキードラゴン',action:'先祖返りを鍛えろ<br><small>オーラ : ゴールデンクッキーからもらえるクッキーが 10% 増える</small>',pic:5,
				cost:function(){return Game.Objects['錬金術室'].amount>=100;},
				buy:function(){Game.Objects['錬金術室'].sacrifice(100);},
				costStr:function(){return '100錬金術室';}},
			{name:'クランブラー、クッキードラゴン',action:'邪な主管者を鍛えろ<br><small>オーラ : レッドクッキーからもらえるクッキーが 10% 増える</small>',pic:5,
				cost:function(){return Game.Objects['ポータル'].amount>=100;},
				buy:function(){Game.Objects['ポータル'].sacrifice(100);},
				costStr:function(){return '100ポータル';}},
			{name:'クランブラー、クッキードラゴン',action:'時代改竄を鍛えろ<br><small>オーラ : ゴールデンクッキーの効果継続時間が 5% 増える</small>',pic:5,
				cost:function(){return Game.Objects['タイムマシン'].amount>=100;},
				buy:function(){Game.Objects['タイムマシン'].sacrifice(100);},
				costStr:function(){return '100タイムマシン';}},
			{name:'クランブラー、クッキードラゴン',action:'肉体を超える精神を鍛えろ<br><small>オーラ : ランダムドロップ出現率が 25% 上昇する</small>',pic:5,
				cost:function(){return Game.Objects['反物質凝縮器'].amount>=100;},
				buy:function(){Game.Objects['反物質凝縮器'].sacrifice(100);},
				costStr:function(){return '100反物質凝縮器';}},
			{name:'クランブラー、クッキードラゴン',action:'光り輝くアパタイトを鍛えろ<br><small>オーラ : 生産量が 2 倍になる</small>',pic:5,
				cost:function(){return Game.Objects['プリズム'].amount>=100;},
				buy:function(){Game.Objects['プリズム'].sacrifice(100);},
				costStr:function(){return '100プリズム';}},
			{name:'クランブラー、クッキードラゴン',action:'ドラゴンの僥倖を鍛えろ<br><small>オーラ : 画面上のゴールデンクッキー 1 枚につき CpS が 123% 増える</small>',pic:5,
				cost:function(){return Game.Objects['チャンスメーカー'].amount>=100;},
				buy:function(){Game.Objects['チャンスメーカー'].sacrifice(100);},
				costStr:function(){return '100チャンスメーカー';}},
			{name:'クランブラー、クッキードラゴン',action:'ドラゴン曲線を鍛えろ<br><small>オーラ : 角砂糖の成長が 5% 速くなり、変種発生率が 2倍 になる</small>',pic:5,
				cost:function(){return Game.Objects['自己無限生成エンジン'].amount>=100;},
				buy:function(){Game.Objects['自己無限生成エンジン'].sacrifice(100);},
				costStr:function(){return '100自己無限生成エンジン';}},
			{name:'クランブラー、クッキードラゴン',action:'現実改変を鍛えよ<br><small>オーラ : 他のオーラすべての効果が 10% 組み合わされる</small>',pic:5,
				cost:function(){return Game.Objects['Javascriptコンソール'].amount>=100;},
				buy:function(){Game.Objects['Javascriptコンソール'].sacrifice(100);},
				costStr:function(){return '100Javascriptコンソール';}},
			{name:'クランブラー、クッキードラゴン',action:'ドラゴンオーブを鍛えよ<br><small>オーラ : 最上の施設を売却することで望みが叶うかもしれない</small>',pic:5,
				cost:function(){return Game.Objects['遊休宇宙'].amount>=100;},
				buy:function(){Game.Objects['遊休宇宙'].sacrifice(100);},
				costStr:function(){return '100遊休宇宙';}},
			{name:'クランブラー、クッキードラゴン',action:'ドラゴンクッキーを焼け<br><small>美味しいよ!</small>',pic:6,
				cost:function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<50) fail=1;}return (fail==0);},
				buy:function(){for (var i in Game.Objects){Game.Objects[i].sacrifice(50);}Game.Unlock('ドラゴンクッキー');},
				costStr:function(){return 'すべての施設を50';}},
			{name:'クランブラー、クッキードラゴン',action:'第二のオーラを鍛えろ<br><small>同時に2つのドラゴンオーラを扱ってみよう</small>',pic:7,
				cost:function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<200) fail=1;}return (fail==0);},
				buy:function(){for (var i in Game.Objects){Game.Objects[i].sacrifice(200);}},
				costStr:function(){return 'すべての施設を200';}},
			{name:'クランブラー、クッキードラゴン',action:'ドラゴンは十分に鍛えられた',pic:8}
		];
		
		Game.dragonAuras={
			0:{name:'オーラなし',pic:[0,7],desc:'あなたのドラゴンが覚えているこれらの中からオーラを選択してください。'},
			1:{name:'ミルクブレス',pic:[18,25],desc:'子猫の効果が<b>5%</b>上昇する。'},
			2:{name:'ドラゴンカーソル',pic:[0,25],desc:'クリックで得られるクッキーが<b>5%</b>上昇する。'},
			3:{name:'旧き者らの大隊 ババタリオン',pic:[1,25],desc:'グランマのCpSがグランマ以外の施設1つにつき<b>+1%</b>上昇する。'},
			4:{name:'刈り取る者',pic:[2,25],desc:'ゴールデンクッキーとレッドクッキーが<b>刈れよドラゴン</b>を引き起こすようになる。'},
			5:{name:'大地を砕く者',pic:[3,25],desc:'施設の売却で戻ってくるクッキーが25%から<b>50%</b>になる。'},
			6:{name:'武器庫の主',pic:[4,25],desc:'すべてのアップグレードが<b>2%</b>安くなる。'},
			7:{name:'爆買い',pic:[15,25],desc:'すべての施設が<b>2%</b>安くなる。'},
			8:{name:'龍神',pic:[16,25],desc:'名声によるCpSのボーナスが<b>+5%</b>上昇する。'},
			9:{name:'難解至極のオーラ',pic:[17,25],desc:'ゴールデンクッキーやレッドクッキーが <b>+5%</b> より出現しやすくなる。'},
			10:{name:'ドラゴン便',pic:[5,25],desc:'ゴールデンクッキーとレッドクッキーが<b>翔べよドラゴン</b>を引き起こすようになる。'},
			11:{name:'先祖返り',pic:[6,25],desc:'ゴールデンクッキーからもらえるクッキーが<b>10%</b>増加する。'},
			12:{name:'邪な主管者',pic:[7,25],desc:'レッドクッキーからもらえるクッキーが<b>10%</b>増加する。'},
			13:{name:'時代改竄',pic:[8,25],desc:'ゴールデンクッキーの効果が <b>5%</b> より長く継続する。'},
			14:{name:'肉体を超える精神',pic:[13,25],desc:'ランダムドロップの出現率が<b>25%</b>上昇する。'},
			15:{name:'光り輝くアパタイト',pic:[14,25],desc:'生産量が<b>2倍</b>になる。'},
			16:{name:'ドラゴンの僥倖',pic:[19,25],desc:'画面上のゴールデンクッキー1枚につき、CpSが<b>123%</b>倍加する。'},
			17:{name:'ドラゴン曲線',pic:[20,25],desc:'<b>角砂糖の成長速度が +5% </b>し、角砂糖が <b>2倍</b> 変種になりやすくなる。'},
			18:{name:'現実改変',pic:[32,25],desc:'他のドラゴンオーラすべての <b>10分の1</b> が、<b>組み合わされ</b>る。'},
			19:{name:'ドラゴンオーブ',pic:[33,25],desc:'バフがなく画面上にゴールデンクッキーが存在しないときに、もっとも強力な施設を売却すると <b>10%の確率でゴールデンクッキーを召喚</b> する。'},
		};
		
		Game.hasAura=function(what)
		{
			if (Game.dragonAuras[Game.dragonAura].name==what || Game.dragonAuras[Game.dragonAura2].name==what) return true; else return false;
		}
		Game.auraMult=function(what)
		{
			var n=0;
			if (Game.dragonAuras[Game.dragonAura].name==what || Game.dragonAuras[Game.dragonAura2].name==what) n=1;
			if (Game.dragonAuras[Game.dragonAura].name=='現実改変' || Game.dragonAuras[Game.dragonAura2].name=='現実改変') n+=0.1;
			return n;
		}
		
		Game.SelectDragonAura=function(slot,update)
		{	
			var currentAura=0;
			var otherAura=0;
			if (slot==0) currentAura=Game.dragonAura; else currentAura=Game.dragonAura2;
			if (slot==0) otherAura=Game.dragonAura2; else otherAura=Game.dragonAura;
			if (!update) Game.SelectingDragonAura=currentAura;
			
			var str='';
			for (var i in Game.dragonAuras)
			{
				if (Game.dragonLevel>=parseInt(i)+4)
				{
					var icon=Game.dragonAuras[i].pic;
					if (i==0 || i!=otherAura) str+='<div class="crate enabled'+(i==Game.SelectingDragonAura?' highlighted':'')+'" style="opacity:1;float:none;display:inline-block;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.SetDragonAura('+i+','+slot+');" onMouseOut="Game.DescribeDragonAura('+Game.SelectingDragonAura+');" onMouseOver="Game.DescribeDragonAura('+i+');"'+
					'></div>';
				}
			}
			
			var highestBuilding=0;
			for (var i in Game.Objects) {if (Game.Objects[i].amount>0) highestBuilding=Game.Objects[i];}
			
			Game.Prompt('<h3>ドラゴンの'+(slot==2?'二番目の':'')+'オーラを設定してください</h3>'+
						'<div class="line"></div>'+
						'<div id="dragonAuraInfo" style="min-height:60px;"></div>'+
						'<div style="text-align:center;">'+str+'</div>'+
						'<div class="line"></div>'+
						'<div style="text-align:center;margin-bottom:8px;">'+(highestBuilding==0?'施設を所持していないため <b>タダ</b> でオーラを切り替えられます。':'オーラの切り替えに<b>1 '+highestBuilding.name+'</b>消費します。<br>この消費はCpSに影響します!')+'</div>'
						,[['決定',(slot==0?'Game.dragonAura':'Game.dragonAura2')+'=Game.SelectingDragonAura;'+(highestBuilding==0 || currentAura==Game.SelectingDragonAura?'':'Game.ObjectsById['+highestBuilding.id+'].sacrifice(1);')+'Game.ToggleSpecialMenu(1);Game.ClosePrompt();'],'キャンセル'],0,'widePrompt');
			Game.DescribeDragonAura(Game.SelectingDragonAura);
		}
		Game.SelectingDragonAura=-1;
		Game.SetDragonAura=function(aura,slot)
		{
			Game.SelectingDragonAura=aura;
			Game.SelectDragonAura(slot,1);
		}
		Game.DescribeDragonAura=function(aura)
		{
			l('dragonAuraInfo').innerHTML=
			'<div style="min-width:200px;text-align:center;"><h4>'+Game.dragonAuras[aura].name+'</h4>'+
			'<div class="line"></div>'+
			Game.dragonAuras[aura].desc+
			'</div>';
		}
		
		Game.UpgradeDragon=function()
		{
			if (Game.dragonLevel<Game.dragonLevels.length-1 && Game.dragonLevels[Game.dragonLevel].cost())
			{
				PlaySound('snd/shimmerClick.mp3');
				Game.dragonLevels[Game.dragonLevel].buy();
				Game.dragonLevel=(Game.dragonLevel+1)%Game.dragonLevels.length;
				
				if (Game.dragonLevel>=Game.dragonLevels.length-1) Game.Win('この先ドラゴン注意');
				Game.ToggleSpecialMenu(1);
				if (l('specialPic')){var rect=l('specialPic').getBoundingClientRect();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2);}
				Game.recalculateGains=1;
				Game.upgradesToRebuild=1;
			}
		}
		
		Game.lastClickedSpecialPic=0;
		Game.ClickSpecialPic=function()
		{
			if (Game.specialTab=='dragon' && Game.dragonLevel>=4 && Game.Has('ドラゴンとふれ合おう') && l('specialPic'))
			{
				triggerAnim(l('specialPic'),'pucker');
				PlaySound('snd/click'+Math.floor(Math.random()*7+1)+'.mp3',0.5);
				if (Date.now()-Game.lastClickedSpecialPic>2000) PlaySound('snd/growl.mp3');
				//else if (Math.random()<0.5) PlaySound('snd/growl.mp3',0.5+Math.random()*0.2);
				Game.lastClickedSpecialPic=Date.now();
				if (Game.prefs.particles)
				{
					Game.particleAdd(Game.mouseX,Game.mouseY-32,Math.random()*4-2,Math.random()*-2-4,Math.random()*0.2+0.5,1,2,[20,3]);
				}
				if (Game.dragonLevel>=8 && Math.random()<1/20)
				{
					Math.seedrandom(Game.seed+'/dragonTime');
					var drops=['ドラゴンの鱗','ドラゴンの爪','ドラゴンの牙','ドラゴンのテディベア'];
					drops=shuffle(drops);
					var drop=drops[Math.floor((new Date().getMinutes()/60)*drops.length)];
					if (!Game.Has(drop) && !Game.HasUnlocked(drop))
					{
						Game.Unlock(drop);
						if (Game.prefs.popups) Game.Popup('発見したもの : <br>'+drop+'!');
						else Game.Notify(drop,'<b>ドラゴンが何か落とした!</b>',Game.Upgrades[drop].icon);
					}
					Math.seedrandom();
				}
			}
		}
		
		Game.ToggleSpecialMenu=function(on)
		{
			if (on)
			{
				var pic='';
				var frame=0;
				if (Game.specialTab=='santa') {pic='santa.png';frame=Game.santaLevel;}
				else if (Game.specialTab=='dragon') {pic='dragon.png?v='+Game.version;frame=Game.dragonLevels[Game.dragonLevel].pic;}
				else {pic='dragon.png?v='+Game.version;frame=4;}
				
				var str='<div id="specialPic" '+Game.clickStr+'="Game.ClickSpecialPic();" style="'+((Game.specialTab=='dragon' && Game.dragonLevel>=4 && Game.Has('ドラゴンとふれ合おう'))?'cursor:pointer;':'')+'position:absolute;left:-16px;top:-64px;width:96px;height:96px;background:url(img/'+pic+');background-position:'+(-frame*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div>';
				str+='<div class="close" onclick="PlaySound(\'snd/press.mp3\');Game.ToggleSpecialMenu(0);">x</div>';
				
				if (Game.specialTab=='santa')
				{
					var moni=Math.pow(Game.santaLevel+1,Game.santaLevel+1);
					
					str+='<h3 style="pointer-events:none;">'+Game.santaLevels[Game.santaLevel]+'</h3>';
					if (Game.santaLevel<14)
					{
						str+='<div class="line"></div>'+
						'<div class="optionBox" style="margin-bottom:0px;"><a class="option framed large title" '+Game.clickStr+'="Game.UpgradeSanta();">'+
							'<div style="display:table-cell;vertical-align:middle;">進化</div>'+
							'<div style="display:table-cell;vertical-align:middle;padding:4px 12px;">|</div>'+
							'<div style="display:table-cell;vertical-align:middle;font-size:65%;">コスト :<div'+(Game.cookies>moni?'':' style="color:#777;"')+'>'+Beautify(Math.pow(Game.santaLevel+1,Game.santaLevel+1))+(Game.santaLevel>0?'クッキー':'クッキー')+'</div></div>'+
						'</a></div>';
					}
				}
				else if (Game.specialTab=='dragon')
				{
					var level=Game.dragonLevels[Game.dragonLevel];
				
					str+='<h3 style="pointer-events:none;">'+level.name+'</h3>';
					
					if (Game.dragonLevel>=5)
					{
						var icon=Game.dragonAuras[Game.dragonAura].pic;
						str+='<div class="crate enabled" style="opacity:1;position:absolute;right:18px;top:-58px;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.SelectDragonAura(0);" '+Game.getTooltip(
							'<div style="min-width:200px;text-align:center;"><h4>'+Game.dragonAuras[Game.dragonAura].name+'</h4>'+
							'<div class="line"></div>'+
							Game.dragonAuras[Game.dragonAura].desc+
							'</div>'
						,'top')+
						'></div>';
					}
					if (Game.dragonLevel>=25)//2nd aura slot; increased with last building (idleverse)
					{
						var icon=Game.dragonAuras[Game.dragonAura2].pic;
						str+='<div class="crate enabled" style="opacity:1;position:absolute;right:80px;top:-58px;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.SelectDragonAura(1);" '+Game.getTooltip(
							'<div style="min-width:200px;text-align:center;"><h4>'+Game.dragonAuras[Game.dragonAura2].name+'</h4>'+
							'<div class="line"></div>'+
							Game.dragonAuras[Game.dragonAura2].desc+
							'</div>'
						,'top')+
						'></div>';
					}
					
					if (Game.dragonLevel<Game.dragonLevels.length-1)
					{
						str+='<div class="line"></div>'+
						'<div class="optionBox" style="margin-bottom:0px;"><a class="option framed large title" '+Game.clickStr+'="Game.UpgradeDragon();">'+
							'<div style="display:table-cell;vertical-align:middle;">'+level.action+'</div>'+
							'<div style="display:table-cell;vertical-align:middle;padding:4px 12px;">|</div>'+
							'<div style="display:table-cell;vertical-align:middle;font-size:65%;">生贄<div'+(level.cost()?'':' style="color:#777;"')+'>'+level.costStr()+'</div></div>'+
						'</a></div>';
					}
					else
					{
						str+='<div class="line"></div>'+
						'<div style="text-align:center;margin-bottom:4px;">'+level.action+'</div>';
					}
				}
				
				l('specialPopup').innerHTML=str;
				
				l('specialPopup').className='framed prompt onScreen';
			}
			else
			{
				if (Game.specialTab!='')
				{
					Game.specialTab='';
					l('specialPopup').className='framed prompt offScreen';
					setTimeout(function(){if (Game.specialTab=='') {/*l('specialPopup').style.display='none';*/l('specialPopup').innerHTML='';}},1000*0.2);
				}
			}
		}
		Game.DrawSpecial=function()
		{
			var len=Game.specialTabs.length;
			if (len==0) return;
			Game.LeftBackground.globalAlpha=1;
			var y=Game.LeftBackground.canvas.height-24-48*len;
			var tabI=0;
			
			for (var i in Game.specialTabs)
			{
				var selected=0;
				var hovered=0;
				if (Game.specialTab==Game.specialTabs[i]) selected=1;
				if (Game.specialTabHovered==Game.specialTabs[i]) hovered=1;
				var x=24;
				var s=1;
				var pic='';
				var frame=0;
				if (hovered) {s=1;x=24;}
				if (selected) {s=1;x=48;}
				
				if (Game.specialTabs[i]=='santa') {pic='santa.png';frame=Game.santaLevel;}
				else if (Game.specialTabs[i]=='dragon') {pic='dragon.png?v='+Game.version;frame=Game.dragonLevels[Game.dragonLevel].pic;}
				else {pic='dragon.png?v='+Game.version;frame=4;}
				
				if (hovered || selected)
				{
					var ss=s*64;
					var r=Math.floor((Game.T*0.5)%360);
					Game.LeftBackground.save();
					Game.LeftBackground.translate(x,y);
					if (Game.prefs.fancy) Game.LeftBackground.rotate((r/360)*Math.PI*2);
					Game.LeftBackground.globalAlpha=0.75;
					Game.LeftBackground.drawImage(Pic('shine.png'),-ss/2,-ss/2,ss,ss);
					Game.LeftBackground.restore();
				}
				
				if (Game.prefs.fancy) Game.LeftBackground.drawImage(Pic(pic),96*frame,0,96,96,(x+(selected?0:Math.sin(Game.T*0.2+tabI)*3)-24*s),(y-(selected?6:Math.abs(Math.cos(Game.T*0.2+tabI))*6)-24*s),48*s,48*s);
				else Game.LeftBackground.drawImage(Pic(pic),96*frame,0,96,96,(x-24*s),(y-24*s),48*s,48*s);
				
				tabI++;
				y+=48;
			}
			
		}
		
		/*=====================================================================================
		VISUAL EFFECTS
		=======================================================================================*/
		
		Game.Milks=[
			{name:'ランクI - プレーンミルク',pic:'milkPlain',icon:[1,8]},
			{name:'ランクII - チョコレートミルク',pic:'milkChocolate',icon:[2,8]},
			{name:'ランクIII - ラズベリーミルク',pic:'milkRaspberry',icon:[3,8]},
			{name:'ランクIV - オレンジミルク',pic:'milkOrange',icon:[4,8]},
			{name:'ランクV - キャラメルミルク',pic:'milkCaramel',icon:[5,8]},
			{name:'ランクVI - バナナミルク',pic:'milkBanana',icon:[6,8]},
			{name:'ランクVII - ライムミルク',pic:'milkLime',icon:[7,8]},
			{name:'ランクVIII - ブルーベリーミルク',pic:'milkBlueberry',icon:[8,8]},
			{name:'ランクIX - ストロベリーミルク',pic:'milkStrawberry',icon:[9,8]},
			{name:'ランクX - バニラミルク',pic:'milkVanilla',icon:[10,8]},
			{name:'ランクXI - ハニーミルク',pic:'milkHoney',icon:[21,23]},
			{name:'ランクXII - コーヒー牛乳',pic:'milkCoffee',icon:[22,23]},
			{name:'ランクXIII - 紅茶ミルク',pic:'milkTea',icon:[23,23]},
			{name:'ランクXIV - ココナッツミルク',pic:'milkCoconut',icon:[24,23]},
			{name:'ランクXV - サクランボミルク',pic:'milkCherry',icon:[25,23]},
			{name:'ランクXVI - スパイシーミルク',pic:'milkSpiced',icon:[26,23]},
			{name:'ランクXVII - メープルミルク',pic:'milkMaple',icon:[28,23]},
			{name:'ランクXVIII - ミントミルク',pic:'milkMint',icon:[29,23]},
			{name:'ランクXIX - 甘草ミルク',pic:'milkLicorice',icon:[30,23]},
			{name:'ランクXX - ローズミルク',pic:'milkRose',icon:[31,23]},
			{name:'ランクXXI - ドラゴンフルーツミルク',pic:'milkDragonfruit',icon:[21,24]},
		];
		Game.Milk=Game.Milks[0];
	
		Game.mousePointer=0;//when 1, draw the mouse as a pointer on the left screen
		
		Game.cookieOriginX=0;
		Game.cookieOriginY=0;
		Game.DrawBackground=function()
		{
			
			Timer.clean();
			//background
			if (!Game.Background)//init some stuff
			{
				Game.Background=l('backgroundCanvas').getContext('2d');
				Game.Background.canvas.width=Game.Background.canvas.parentNode.offsetWidth;
				Game.Background.canvas.height=Game.Background.canvas.parentNode.offsetHeight;
				Game.LeftBackground=l('backgroundLeftCanvas').getContext('2d');
				Game.LeftBackground.canvas.width=Game.LeftBackground.canvas.parentNode.offsetWidth;
				Game.LeftBackground.canvas.height=Game.LeftBackground.canvas.parentNode.offsetHeight;
					//preload ascend animation bits so they show up instantly
					Game.LeftBackground.globalAlpha=0;
					Game.LeftBackground.drawImage(Pic('brokenCookie.png'),0,0);
					Game.LeftBackground.drawImage(Pic('brokenCookieHalo.png'),0,0);
					Game.LeftBackground.drawImage(Pic('starbg.jpg'),0,0);
				
				window.addEventListener('resize', function(event)
				{
					Game.Background.canvas.width=Game.Background.canvas.parentNode.offsetWidth;
					Game.Background.canvas.height=Game.Background.canvas.parentNode.offsetHeight;
					Game.LeftBackground.canvas.width=Game.LeftBackground.canvas.parentNode.offsetWidth;
					Game.LeftBackground.canvas.height=Game.LeftBackground.canvas.parentNode.offsetHeight;
				});
			}
			
			var ctx=Game.LeftBackground;
			
			if (Game.OnAscend)
			{
				Timer.clean();
				//starry background on ascend screen
				var w=Game.Background.canvas.width;
				var h=Game.Background.canvas.height;
				var b=Game.ascendl.getBoundingClientRect();
				var x=(b.left+b.right)/2;
				var y=(b.top+b.bottom)/2;
				Game.Background.globalAlpha=0.5;
				var s=1*Game.AscendZoom*(1+Math.cos(Game.T*0.0027)*0.05);
				Game.Background.fillPattern(Pic('starbg.jpg'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s);
				Timer.track('star layer 1');
				if (Game.prefs.fancy)
				{
					//additional star layer
					Game.Background.globalAlpha=0.5*(0.5+Math.sin(Game.T*0.02)*0.3);
					var s=2*Game.AscendZoom*(1+Math.sin(Game.T*0.002)*0.07);
					//Game.Background.globalCompositeOperation='lighter';
					Game.Background.fillPattern(Pic('starbg.jpg'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s);
					//Game.Background.globalCompositeOperation='source-over';
					Timer.track('star layer 2');
					
					x=x+Game.AscendOffX*Game.AscendZoom;
					y=y+Game.AscendOffY*Game.AscendZoom;
					//wispy nebula around the center
					Game.Background.save();
					Game.Background.globalAlpha=0.5;
					Game.Background.translate(x,y);
					Game.Background.globalCompositeOperation='lighter';
					Game.Background.rotate(Game.T*0.001);
					s=(600+150*Math.sin(Game.T*0.007))*Game.AscendZoom;
					Game.Background.drawImage(Pic('heavenRing1.jpg'),-s/2,-s/2,s,s);
					Game.Background.rotate(-Game.T*0.0017);
					s=(600+150*Math.sin(Game.T*0.0037))*Game.AscendZoom;
					Game.Background.drawImage(Pic('heavenRing2.jpg'),-s/2,-s/2,s,s);
					Game.Background.restore();
					Timer.track('nebula');
					
					/*
					//links between upgrades
					//not in because I am bad at this
					Game.Background.globalAlpha=1;
					Game.Background.save();
					Game.Background.translate(x,y);
					s=(32)*Game.AscendZoom;
					
					for (var i in Game.PrestigeUpgrades)
					{
						var me=Game.PrestigeUpgrades[i];
						var ghosted=0;
						if (me.canBePurchased || Game.Has('脳神経占術')){}
						else
						{
							for (var ii in me.parents){if (me.parents[ii]!=-1 && me.parents[ii].canBePurchased) ghosted=1;}
						}
						for (var ii in me.parents)//create pulsing links
						{
							if (me.parents[ii]!=-1 && (me.canBePurchased || ghosted))
							{
								var origX=0;
								var origY=0;
								var targX=me.posX+28;
								var targY=me.posY+28;
								if (me.parents[ii]!=-1) {origX=me.parents[ii].posX+28;origY=me.parents[ii].posY+28;}
								var rot=-Math.atan((targY-origY)/(origX-targX));
								if (targX<=origX) rot+=180;
								var dist=Math.floor(Math.sqrt((targX-origX)*(targX-origX)+(targY-origY)*(targY-origY)));
								origX+=2;
								origY-=18;
								//rot=-(Math.PI/2)*(me.id%4);
								Game.Background.translate(origX,origY);
								Game.Background.rotate(rot);
								//Game.Background.drawImage(Pic('linkPulse.png'),-s/2,-s/2,s,s);
								Game.Background.fillPattern(Pic('linkPulse.png'),0,-4,dist,8,32,8);
								Game.Background.rotate(-rot);
								Game.Background.translate(-origX,-origY);
							}
						}
					}
					Game.Background.restore();
					Timer.track('links');
					*/
					
					//Game.Background.drawImage(Pic('shadedBorders.png'),0,0,w,h);
					//Timer.track('border');
				}
			}
			else
			{
			
				var goodBuff=0;
				var badBuff=0;
				for (var i in Game.buffs)
				{
					if (Game.buffs[i].aura==1) goodBuff=1;
					if (Game.buffs[i].aura==2) badBuff=1;
				}
				
				if (Game.drawT%5==0)
				{
					if (false && Game.bgType!=0 && Game.ascensionMode!=1)
					{
						//l('backgroundCanvas').style.background='url(img/shadedBordersSoft.png) 0px 0px,url(img/bgWheat.jpg) 50% 50%';
						//l('backgroundCanvas').style.backgroundSize='100% 100%,cover';
					}
					else
					{
						l('backgroundCanvas').style.background='transparent';
						Game.defaultBg='bgBlue';
						Game.bgR=0;
						
						if (Game.season=='fools') Game.defaultBg='bgMoney';
						if (Game.elderWrathD<1)
						{
							Game.bgR=0;
							Game.bg=Game.defaultBg;
							Game.bgFade=Game.defaultBg;
						}
						else if (Game.elderWrathD>=1 && Game.elderWrathD<2)
						{
							Game.bgR=(Game.elderWrathD-1)/1;
							Game.bg=Game.defaultBg;
							Game.bgFade='grandmas1';
						}
						else if (Game.elderWrathD>=2 && Game.elderWrathD<3)
						{
							Game.bgR=(Game.elderWrathD-2)/1;
							Game.bg='grandmas1';
							Game.bgFade='grandmas2';
						}
						else if (Game.elderWrathD>=3)// && Game.elderWrathD<4)
						{
							Game.bgR=(Game.elderWrathD-3)/1;
							Game.bg='grandmas2';
							Game.bgFade='grandmas3';
						}
						
						if (Game.bgType!=0 && Game.ascensionMode!=1)
						{
							Game.bgR=0;
							Game.bg=Game.BGsByChoice[Game.bgType].pic;
							Game.bgFade=Game.bg;
						}
						
						Game.Background.fillPattern(Pic(Game.bg+'.jpg'),0,0,Game.Background.canvas.width,Game.Background.canvas.height,512,512,0,0);
						if (Game.bgR>0)
						{
							Game.Background.globalAlpha=Game.bgR;
							Game.Background.fillPattern(Pic(Game.bgFade+'.jpg'),0,0,Game.Background.canvas.width,Game.Background.canvas.height,512,512,0,0);
						}
						Game.Background.globalAlpha=1;
						Game.Background.drawImage(Pic('shadedBordersSoft.png'),0,0,Game.Background.canvas.width,Game.Background.canvas.height);
					}
					
				}
				Timer.track('window background');
				
				//clear
				ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
				/*if (Game.AscendTimer<Game.AscendBreakpoint) ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
				else
				{
					ctx.globalAlpha=0.05;
					ctx.fillStyle='#000';
					ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
					ctx.globalAlpha=1;
					OldCanvasDrawImage.apply(ctx,[ctx.canvas,Math.random()*4-2,Math.random()*4-2-4]);
					ctx.globalAlpha=1;
				}*/
				Timer.clean();
				
				var showDragon=0;
				if (Game.hasBuff('翔べよドラゴン') || Game.hasBuff('刈れよドラゴン')) showDragon=1;
				
				Game.cookieOriginX=Math.floor(ctx.canvas.width/2);
				Game.cookieOriginY=Math.floor(ctx.canvas.height*0.4);
				
				if (Game.AscendTimer==0)
				{	
					if (Game.prefs.particles)
					{
						//falling cookies
						var pic='';
						var opacity=1;
						if (Game.elderWrathD<=1.5)
						{
							if (Game.cookiesPs>=1000) pic='cookieShower3.png';
							else if (Game.cookiesPs>=500) pic='cookieShower2.png';
							else if (Game.cookiesPs>=50) pic='cookieShower1.png';
							else pic='';
						}
						if (pic!='')
						{
							if (Game.elderWrathD>=1) opacity=1-((Math.min(Game.elderWrathD,1.5)-1)/0.5);
							ctx.globalAlpha=opacity;
							var y=(Math.floor(Game.T*2)%512);
							ctx.fillPattern(Pic(pic),0,0,ctx.canvas.width,ctx.canvas.height+512,512,512,0,y);
							ctx.globalAlpha=1;
						}
						//snow
						if (Game.season=='christmas')
						{
							var y=(Math.floor(Game.T*2.5)%512);
							ctx.globalAlpha=0.75;
							ctx.globalCompositeOperation='lighter';
							ctx.fillPattern(Pic('snow2.jpg'),0,0,ctx.canvas.width,ctx.canvas.height+512,512,512,0,y);
							ctx.globalCompositeOperation='source-over';
							ctx.globalAlpha=1;
						}
						//hearts
						if (Game.season=='valentines')
						{
							var y=(Math.floor(Game.T*2.5)%512);
							ctx.globalAlpha=1;
							ctx.fillPattern(Pic('heartStorm.png'),0,0,ctx.canvas.width,ctx.canvas.height+512,512,512,0,y);
							ctx.globalAlpha=1;
						}
						Timer.track('left background');
						
						Game.particlesDraw(0);
						ctx.globalAlpha=1;
						Timer.track('particles');
						
						//big cookie shine
						var s=512;
						
						var x=Game.cookieOriginX;
						var y=Game.cookieOriginY;
						
						var r=Math.floor((Game.T*0.5)%360);
						ctx.save();
						ctx.translate(x,y);
						ctx.rotate((r/360)*Math.PI*2);
						var alphaMult=1;
						if (Game.bgType==2 || Game.bgType==4) alphaMult=0.5;
						var pic='shine.png';
						if (goodBuff) {pic='shineGold.png';alphaMult=1;}
						else if (badBuff) {pic='shineRed.png';alphaMult=1;}
						if (goodBuff && Game.prefs.fancy) ctx.globalCompositeOperation='lighter';
						ctx.globalAlpha=0.5*alphaMult;
						ctx.drawImage(Pic(pic),-s/2,-s/2,s,s);
						ctx.rotate((-r*2/360)*Math.PI*2);
						ctx.globalAlpha=0.25*alphaMult;
						ctx.drawImage(Pic(pic),-s/2,-s/2,s,s);
						ctx.restore();
						Timer.track('shine');
				
						if (Game.ReincarnateTimer>0)
						{
							ctx.globalAlpha=1-Game.ReincarnateTimer/Game.ReincarnateDuration;
							ctx.fillStyle='#000';
							ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
							ctx.globalAlpha=1;
						}
						
						if (showDragon)
						{
							//big dragon
							var s=300*2*(1+Math.sin(Game.T*0.013)*0.1);
							var x=Game.cookieOriginX-s/2;
							var y=Game.cookieOriginY-s/(1.4+0.2*Math.sin(Game.T*0.01));
							ctx.drawImage(Pic('dragonBG.png'),x,y,s,s);
						}
						
						//big cookie
						if (false)//don't do that
						{
							ctx.globalAlpha=1;
							var amount=Math.floor(Game.cookies).toString();
							var digits=amount.length;
							var space=0;
							for (var i=0;i<digits;i++)
							{
								var s=16*(digits-i);
								var num=parseInt(amount[i]);
								if (i>0) space-=s*(1-num/10)/2;
								if (i==0 && num>1) space+=s*0.1;
								for (var ii=0;ii<num;ii++)
								{
									var x=Game.cookieOriginX;
									var y=Game.cookieOriginY;
									var spin=Game.T*(0.005+i*0.001)+i+(ii/num)*Math.PI*2;
									x+=Math.sin(spin)*space;
									y+=Math.cos(spin)*space;
									ctx.drawImage(Pic('perfectCookie.png'),x-s/2,y-s/2,s,s);
								}
								space+=s/2;
							}
						}
						else
						{
							ctx.globalAlpha=1;
							var s=256*Game.BigCookieSize;
							var x=Game.cookieOriginX;
							var y=Game.cookieOriginY;
							ctx.save();
							ctx.translate(x,y);
							if (Game.season=='easter')
							{
								var nestW=304*0.98*Game.BigCookieSize;
								var nestH=161*0.98*Game.BigCookieSize;
								ctx.drawImage(Pic('nest.png'),-nestW/2,-nestH/2+130,nestW,nestH);
							}
							//ctx.rotate(((Game.startDate%360)/360)*Math.PI*2);
							ctx.drawImage(Pic('perfectCookie.png'),-s/2,-s/2,s,s);
							
							if (goodBuff && Game.prefs.particles)//sparkle
							{
								ctx.globalCompositeOperation='lighter';
								for (var i=0;i<1;i++)
								{
									ctx.globalAlpha=Math.random()*0.65+0.1;
									var size=Math.random()*30+5;
									var a=Math.random()*Math.PI*2;
									var d=s*0.9*Math.random()/2;
									ctx.drawImage(Pic('glint.jpg'),-size/2+Math.sin(a)*d,-size/2+Math.cos(a)*d,size,size);
								}
							}
							
							ctx.restore();
							Timer.track('big cookie');
						}
					}
					else//no particles
					{
						//big cookie shine
						var s=512;
						var x=Game.cookieOriginX-s/2;
						var y=Game.cookieOriginY-s/2;
						ctx.globalAlpha=0.5;
						ctx.drawImage(Pic('shine.png'),x,y,s,s);
						
						if (showDragon)
						{
							//big dragon
							var s=300*2*(1+Math.sin(Game.T*0.013)*0.1);
							var x=Game.cookieOriginX-s/2;
							var y=Game.cookieOriginY-s/(1.4+0.2*Math.sin(Game.T*0.01));
							ctx.drawImage(Pic('dragonBG.png'),x,y,s,s);
						}
					
						//big cookie
						ctx.globalAlpha=1;
						var s=256*Game.BigCookieSize;
						var x=Game.cookieOriginX-s/2;
						var y=Game.cookieOriginY-s/2;
						ctx.drawImage(Pic('perfectCookie.png'),x,y,s,s);
					}
					
					//cursors
					if (Game.prefs.cursors)
					{
						ctx.save();
						ctx.translate(Game.cookieOriginX,Game.cookieOriginY);
						var pic=Pic('cursor.png');
						var fancy=Game.prefs.fancy;
						
						if (showDragon) ctx.globalAlpha=0.25;
						var amount=Game.Objects['カーソル'].amount;
						//var spe=-1;
						for (var i=0;i<amount;i++)
						{
							var n=Math.floor(i/50);
							//var a=((i+0.5*n)%50)/50;
							var w=0;
							if (fancy) w=(Math.sin(Game.T*0.025+(((i+n*12)%25)/25)*Math.PI*2));
							if (w>0.997) w=1.5;
							else if (w>0.994) w=0.5;
							else w=0;
							w*=-4;
							if (fancy) w+=Math.sin((n+Game.T*0.01)*Math.PI/2)*4;
							var x=0;
							var y=(140/* *Game.BigCookieSize*/+n*16+w)-16;
							
							var rot=7.2;//(1/50)*360
							if (i==0 && fancy) rot-=Game.T*0.1;
							if (i%50==0) rot+=7.2/2;
							ctx.rotate((rot/360)*Math.PI*2);
							ctx.drawImage(pic,0,0,32,32,x,y,32,32);
							//ctx.drawImage(pic,32*(i==spe),0,32,32,x,y,32,32);
							
							/*if (i==spe)
							{
								y+=16;
								x=Game.cookieOriginX+Math.sin(-((r-5)/360)*Math.PI*2)*y;
								y=Game.cookieOriginY+Math.cos(-((r-5)/360)*Math.PI*2)*y;
								if (Game.CanClick && ctx && Math.abs(Game.mouseX-x)<16 && Math.abs(Game.mouseY-y)<16) Game.mousePointer=1;
							}*/
						}
						ctx.restore();
						Timer.track('cursors');
					}
				}
				else
				{
					var tBase=Math.max(0,(Game.AscendTimer-Game.AscendBreakpoint)/(Game.AscendDuration-Game.AscendBreakpoint));
					//big crumbling cookie
					//var t=(3*Math.pow(tBase,2)-2*Math.pow(tBase,3));//S curve
					var t=Math.pow(tBase,0.5);
					
					var shake=0;
					if (Game.AscendTimer<Game.AscendBreakpoint) {shake=Game.AscendTimer/Game.AscendBreakpoint;}
					//else {shake=1-t;}

					ctx.globalAlpha=1;
					
					var x=Game.cookieOriginX;
					var y=Game.cookieOriginY;
					
					x+=(Math.random()*2-1)*10*shake;
					y+=(Math.random()*2-1)*10*shake;
					
					var s=1;
					if (tBase>0)
					{
						ctx.save();
						ctx.globalAlpha=1-Math.pow(t,0.5);
						ctx.translate(x,y);
						ctx.globalCompositeOperation='lighter';
						ctx.rotate(Game.T*0.007);
						s=0.5+Math.pow(tBase,0.6)*1;
						var s2=(600)*s;
						ctx.drawImage(Pic('heavenRing1.jpg'),-s2/2,-s2/2,s2,s2);
						ctx.rotate(-Game.T*0.002);
						s=0.5+Math.pow(1-tBase,0.4)*1;
						s2=(600)*s;
						ctx.drawImage(Pic('heavenRing2.jpg'),-s2/2,-s2/2,s2,s2);
						ctx.restore();
					}
					
					s=256;//*Game.BigCookieSize;
					
					ctx.save();
					ctx.translate(x,y);
					ctx.rotate((t*(-0.1))*Math.PI*2);
					
					var chunks={0:7,1:6,2:3,3:2,4:8,5:1,6:9,7:5,8:0,9:4};
					s*=t/2+1;
					/*ctx.globalAlpha=(1-t)*0.33;
					for (var i=0;i<10;i++)
					{
						var d=(t-0.2)*(80+((i+2)%3)*40);
						ctx.drawImage(Pic('brokenCookie.png'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,s,s);
					}
					ctx.globalAlpha=(1-t)*0.66;
					for (var i=0;i<10;i++)
					{
						var d=(t-0.1)*(80+((i+2)%3)*40);
						ctx.drawImage(Pic('brokenCookie.png'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,s,s);
					}*/
					ctx.globalAlpha=1-t;
					for (var i=0;i<10;i++)
					{
						var d=(t)*(80+((i+2)%3)*40);
						var x2=(Math.random()*2-1)*5*shake;
						var y2=(Math.random()*2-1)*5*shake;
						ctx.drawImage(Pic('brokenCookie.png'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d+x2,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d+y2,s,s);
					}
					var brokenHalo=1-Math.min(t/(1/3),1/3)*3;
					if (Game.AscendTimer<Game.AscendBreakpoint) brokenHalo=Game.AscendTimer/Game.AscendBreakpoint;
					ctx.globalAlpha=brokenHalo;
					ctx.drawImage(Pic('brokenCookieHalo.png'),-s/1.3333,-s/1.3333,s*1.5,s*1.5);
					
					ctx.restore();
					
					//flares
					var n=9;
					var t=Game.AscendTimer/Game.AscendBreakpoint;
					if (Game.AscendTimer<Game.AscendBreakpoint)
					{
						ctx.save();
						ctx.translate(x,y);
						for (var i=0;i<n;i++)
						{
							if (Math.floor(t/3*n*3+i*2.7)%2)
							{
								var t2=Math.pow((t/3*n*3+i*2.7)%1,1.5);
								ctx.globalAlpha=(1-t)*(Game.drawT%2==0?0.5:1);
								var sw=(1-t2*0.5)*96;
								var sh=(0.5+t2*1.5)*96;
								ctx.drawImage(Pic('shineSpoke.png'),-sw/2,-sh-32-(1-t2)*256,sw,sh);
							}
							ctx.rotate(Math.PI*2/n);
						}
						ctx.restore();
					}
					
					
					//flash at breakpoint
					if (tBase<0.1 && tBase>0)
					{
						ctx.globalAlpha=1-tBase/0.1;
						ctx.fillStyle='#fff';
						ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
						ctx.globalAlpha=1;
					}
					if (tBase>0.8)
					{
						ctx.globalAlpha=(tBase-0.8)/0.2;
						ctx.fillStyle='#000';
						ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
						ctx.globalAlpha=1;
					}
				}
				
				//milk and milk accessories
				if (Game.prefs.milk)
				{
					var width=ctx.canvas.width;
					var height=ctx.canvas.height;
					var x=Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);//Math.floor((Game.T*2+Math.sin(Game.T*0.1)*2+Math.sin(Game.T*0.03)*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);
					var y=(Game.milkHd)*height;//(((Game.milkHd)*ctx.canvas.height)*(1+0.05*(Math.sin(Game.T*0.017)/2+0.5)));
					var a=1;
					if (Game.AscendTimer>0)
					{
						y*=1-Math.pow((Game.AscendTimer/Game.AscendBreakpoint),2)*2;
						a*=1-Math.pow((Game.AscendTimer/Game.AscendBreakpoint),2)*2;
					}
					else if (Game.ReincarnateTimer>0)
					{
						y*=1-Math.pow(1-(Game.ReincarnateTimer/Game.ReincarnateDuration),2)*2;
						a*=1-Math.pow(1-(Game.ReincarnateTimer/Game.ReincarnateDuration),2)*2;
					}
					
					if (Game.TOYS)
					{
						//golly
						if (!Game.Toy)
						{
							Game.toys=[];
							Game.toysType=choose([1,2]);
							Game.Toy=function(x,y)
							{
								this.id=Game.toys.length;
								this.x=x;
								this.y=y;
								this.xd=Math.random()*10-5;
								this.yd=Math.random()*10-5;
								this.r=Math.random()*Math.PI*2;
									this.rd=Math.random()*0.1-0.05;
									var v=Math.random();var a=0.5;var b=0.5;
									if (v<=a) v=b-b*Math.pow(1-v/a,3); else v=b+(1-b)*Math.pow((v-a)/(1-a),3);
								this.s=(Game.toysType==1?64:48)*(0.1+v*1.9);
								if (Game.toysType==2) this.s=(this.id%10==1)?96:48;
								this.st=this.s;this.s=0;
									var cookies=[[10,0]];
									for (var i in Game.Upgrades)
									{
										var cookie=Game.Upgrades[i];
										if (cookie.bought>0 && cookie.pool=='cookie') cookies.push(cookie.icon);
									}
								this.icon=choose(cookies);
								this.dragged=false;
								this.l=document.createElement('div');
								this.l.innerHTML=this.id;
								this.l.style.cssText='cursor:pointer;border-radius:'+(this.s/2)+'px;opacity:0;width:'+this.s+'px;height:'+this.s+'px;background:#999;position:absolute;left:0px;top:0px;z-index:10000000;transform:translate(-1000px,-1000px);';
								l('sectionLeft').appendChild(this.l);
								AddEvent(this.l,'mousedown',function(what){return function(){what.dragged=true;};}(this));
								AddEvent(this.l,'mouseup',function(what){return function(){what.dragged=false;};}(this));
								Game.toys.push(this);
								return this;
							}
							for (var i=0;i<Math.floor(Math.random()*15+(Game.toysType==1?5:30));i++)
							{
								new Game.Toy(Math.random()*width,Math.random()*height*0.3);
							}
						}
						ctx.globalAlpha=0.5;
						for (var i in Game.toys)
						{
							var me=Game.toys[i];
							ctx.save();
							ctx.translate(me.x,me.y);
							ctx.rotate(me.r);
							if (Game.toysType==1) ctx.drawImage(Pic('smallCookies.png'),(me.id%8)*64,0,64,64,-me.s/2,-me.s/2,me.s,me.s);
							else ctx.drawImage(Pic('icons.png'),me.icon[0]*48,me.icon[1]*48,48,48,-me.s/2,-me.s/2,me.s,me.s);
							ctx.restore();
						}
						ctx.globalAlpha=1;
						for (var i in Game.toys)
						{
							var me=Game.toys[i];
							//psst... not real physics
							for (var ii in Game.toys)
							{
								var it=Game.toys[ii];
								if (it.id!=me.id)
								{
									var x1=me.x+me.xd;
									var y1=me.y+me.yd;
									var x2=it.x+it.xd;
									var y2=it.y+it.yd;
									var dist=Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2))/(me.s/2+it.s/2);
									if (dist<(Game.toysType==1?0.95:0.75))
									{
										var angle=Math.atan2(y1-y2,x1-x2);
										var v1=Math.sqrt(Math.pow((me.xd),2)+Math.pow((me.yd),2));
										var v2=Math.sqrt(Math.pow((it.xd),2)+Math.pow((it.yd),2));
										var v=((v1+v2)/2+dist)*0.75;
										var ratio=it.s/me.s;
										me.xd+=Math.sin(-angle+Math.PI/2)*v*(ratio);
										me.yd+=Math.cos(-angle+Math.PI/2)*v*(ratio);
										it.xd+=Math.sin(-angle-Math.PI/2)*v*(1/ratio);
										it.yd+=Math.cos(-angle-Math.PI/2)*v*(1/ratio);
										me.rd+=(Math.random()*1-0.5)*0.1*(ratio);
										it.rd+=(Math.random()*1-0.5)*0.1*(1/ratio);
										me.rd*=Math.min(1,v);
										it.rd*=Math.min(1,v);
									}
								}
							}
							if (me.y>=height-(Game.milkHd)*height+8)
							{
								me.xd*=0.85;
								me.yd*=0.85;
								me.rd*=0.85;
								me.yd-=1;
								me.xd+=(Math.random()*1-0.5)*0.3;
								me.yd+=(Math.random()*1-0.5)*0.05;
								me.rd+=(Math.random()*1-0.5)*0.02;
							}
							else
							{
								me.xd*=0.99;
								me.rd*=0.99;
								me.yd+=1;
							}
							me.yd*=(Math.min(1,Math.abs(me.y-(height-(Game.milkHd)*height)/16)));
							me.rd+=me.xd*0.01/(me.s/(Game.toysType==1?64:48));
							if (me.x<me.s/2 && me.xd<0) me.xd=Math.max(0.1,-me.xd*0.6); else if (me.x<me.s/2) {me.xd=0;me.x=me.s/2;}
							if (me.x>width-me.s/2 && me.xd>0) me.xd=Math.min(-0.1,-me.xd*0.6); else if (me.x>width-me.s/2) {me.xd=0;me.x=width-me.s/2;}
							me.xd=Math.min(Math.max(me.xd,-30),30);
							me.yd=Math.min(Math.max(me.yd,-30),30);
							me.rd=Math.min(Math.max(me.rd,-0.5),0.5);
							me.x+=me.xd;
							me.y+=me.yd;
							me.r+=me.rd;
							me.r=me.r%(Math.PI*2);
							me.s+=(me.st-me.s)*0.5;
							if (Game.toysType==2 && !me.dragged && Math.random()<0.003) me.st=choose([48,48,48,48,96]);
							if (me.dragged)
							{
								me.x=Game.mouseX;
								me.y=Game.mouseY;
								me.xd+=((Game.mouseX-Game.mouseX2)*3-me.xd)*0.5;
								me.yd+=((Game.mouseY-Game.mouseY2)*3-me.yd)*0.5
								me.l.style.transform='translate('+(me.x-me.s/2)+'px,'+(me.y-me.s/2)+'px) scale(50)';
							}
							else me.l.style.transform='translate('+(me.x-me.s/2)+'px,'+(me.y-me.s/2)+'px)';
							me.l.style.width=me.s+'px';
							me.l.style.height=me.s+'px';
							ctx.save();
							ctx.translate(me.x,me.y);
							ctx.rotate(me.r);
							if (Game.toysType==1) ctx.drawImage(Pic('smallCookies.png'),(me.id%8)*64,0,64,64,-me.s/2,-me.s/2,me.s,me.s);
							else ctx.drawImage(Pic('icons.png'),me.icon[0]*48,me.icon[1]*48,48,48,-me.s/2,-me.s/2,me.s,me.s);
							ctx.restore();
						}
					}
					
					var pic=Game.Milk.pic;
					if (Game.milkType!=0 && Game.ascensionMode!=1) pic=Game.MilksByChoice[Game.milkType].pic;
					ctx.globalAlpha=0.9*a;
					ctx.fillPattern(Pic(pic+'.png'),0,height-y,width+480,1,480,480,x,0);
					
					ctx.fillStyle='#000';
					ctx.fillRect(0,height-y+480,width,Math.max(0,(y-480)));
					ctx.globalAlpha=1;
					
					Timer.track('milk');
				}
				
				if (Game.AscendTimer>0)
				{
					ctx.drawImage(Pic('shadedBordersSoft.png'),0,0,ctx.canvas.width,ctx.canvas.height);
				}
				
				if (Game.AscendTimer==0)
				{
					Game.DrawWrinklers();Timer.track('wrinklers');
					Game.DrawSpecial();Timer.track('evolvables');
					
					Game.particlesDraw(2);Timer.track('text particles');
					
					//shiny border during frenzies etc
					ctx.globalAlpha=1;
					var borders='shadedBordersSoft.png';
					if (goodBuff) borders='shadedBordersGold.png';
					else if (badBuff) borders='shadedBordersRed.png';
					if (goodBuff && Game.prefs.fancy) ctx.globalCompositeOperation='lighter';
					ctx.drawImage(Pic(borders),0,0,ctx.canvas.width,ctx.canvas.height);
					if (goodBuff && Game.prefs.fancy) ctx.globalCompositeOperation='source-over';
				}
			}
		};
		
		
		/*=====================================================================================
		INITIALIZATION END; GAME READY TO LAUNCH
		=======================================================================================*/
		
		Game.killShimmers();
		
		//booooo
		Game.RuinTheFun=function(silent)
		{
			Game.popups=0;
			Game.SetAllUpgrades(1);
			Game.SetAllAchievs(1);
			Game.popups=0;
			Game.Earn(999999999999999999999999999999);
			Game.MaxSpecials();
			Game.nextResearch=0;
			Game.researchT=-1;
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			Game.popups=1;
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				me.level=9;
				me.levelUp();
				if (me.minigame && me.minigame.onRuinTheFun) me.minigame.onRuinTheFun();
			}
			if (!silent)
			{
				if (Game.prefs.popups) Game.Popup('貴殿は楽しみを台無しにした!');
				else Game.Notify('貴殿は楽しみを台無しにした!','あなたは自由の身となった。ついに自由になった。',[11,5]);
			}
			return '苦虫を嚙み潰したようだ…';
		}
		
		Game.SetAllUpgrades=function(on)
		{
			Game.popups=0;
			var leftout=['魔法のイタズラ','原因不明の妨害','グルコースで充満した空気'];
			for (var i in Game.Upgrades)
			{
				if (on && (Game.Upgrades[i].pool=='toggle' || leftout.indexOf(Game.Upgrades[i].name)!=-1)) {}
				else if (on) Game.Upgrades[i].earn();
				else if (!on) Game.Upgrades[i].lose();
			}
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			Game.popups=1;
		}
		Game.SetAllAchievs=function(on)
		{
			Game.popups=0;
			for (var i in Game.Achievements)
			{
				if (on && Game.Achievements[i].pool!='dungeon') Game.Win(Game.Achievements[i].name);
				else if (!on) Game.RemoveAchiev(Game.Achievements[i].name);
			}
			Game.recalculateGains=1;
			Game.popups=1;
		}
		Game.GetAllDebugs=function()
		{
			Game.popups=0;
			for (var i in Game.Upgrades)
			{
				if (Game.Upgrades[i].pool=='debug') Game.Upgrades[i].earn();
			}
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			Game.popups=1;
		}
		Game.MaxSpecials=function()
		{
			Game.dragonLevel=Game.dragonLevels.length-1;
			Game.santaLevel=Game.santaLevels.length-1;
		}
		
		Game.SesameReset=function()
		{
			var name=Game.bakeryName;
			Game.HardReset(2);
			Game.bakeryName=name;
			Game.bakeryNameRefresh();
			Game.Achievements['ズルして作ったクッキーはまずい'].won=1;
		}
		
		Game.debugTimersOn=0;
		Game.sesame=0;
		Game.OpenSesame=function()
		{
			var str='';
			str+='<div class="icon" style="position:absolute;left:-9px;top:-6px;background-position:'+(-10*48)+'px '+(-6*48)+'px;"></div>';
			str+='<div style="position:absolute;left:0px;top:0px;z-index:10;font-size:10px;background:#000;padding:1px;" id="fpsCounter"></div>';
			
			str+='<div id="devConsoleContent">';
			str+='<div class="title" style="font-size:14px;margin:6px;">開発者用ツール</div>';
			
			str+='<a class="option neato" '+Game.clickStr+'="Game.Ascend(1);">昇天</a>';
			str+='<div class="line"></div>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookies*=10;Game.cookiesEarned*=10;">x10</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookies/=10;Game.cookiesEarned/=10;">/10</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookies*=1000;Game.cookiesEarned*=1000;">x1k</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookies/=1000;Game.cookiesEarned/=1000;">/1k</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="for (var i in Game.Objects){Game.Objects[i].buy(100);}">100個全購入</a>';//for (var n=0;n<100;n++){for (var i in Game.Objects){Game.Objects[i].buy(1);}}
			str+='<a class="option neato" '+Game.clickStr+'="for (var i in Game.Objects){Game.Objects[i].sell(100);}">100個全売却</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.gainLumps(10);">+10角砂糖</a>';
			str+='<a class="option neato" '+Game.clickStr+'="for (var i in Game.Objects){Game.Objects[i].level=0;Game.Objects[i].onMinigame=false;Game.Objects[i].refresh();}Game.recalculateGains=1;">レベルリセット</a>';
			str+='<div class="line"></div>';
			str+='<a class="option warning" '+Game.clickStr+'="Game.RuinTheFun(1);">ぶち壊し</a>';
			str+='<a class="option warning" '+Game.clickStr+'="Game.SesameReset();">セーブ消去</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.GetAllDebugs();">全デバッグ系</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.debugTimersOn=!Game.debugTimersOn;Game.OpenSesame();">タイマー '+(Game.debugTimersOn?'オン':'オフ')+'</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.SetAllUpgrades(0);">アプグレなし</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.SetAllUpgrades(1);">全アプグレ</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.SetAllAchievs(0);">実績なし</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.SetAllAchievs(1);">全実績</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.santaLevel=0;Game.dragonLevel=0;">特殊系リセット</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.MaxSpecials();">特殊系最大</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.lumpRefill=0;/*Date.now()-Game.getLumpRefillMax();*/">再使用リセット</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.EditAscend();">'+(Game.DebuggingPrestige?'転生時操作終了':'転生時操作')+'</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.DebugUpgradeCpS();">アプグレのCpSをデバッグ</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.seed=Game.makeSeed();">シード値再生成</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.heralds=100;l(\'heraldsAmount\').textContent=Game.heralds;Game.externalDataLoaded=true;Game.recalculateGains=1;">紋章官最大</a>';
			str+='<div class="line"></div>';
			for (var i=0;i<Game.goldenCookieChoices.length/2;i++)
			{
				str+='<a class="option neato" '+Game.clickStr+'="var newShimmer=new Game.shimmer(\'golden\');newShimmer.force=\''+Game.goldenCookieChoices[i*2+1]+'\';">'+Game.goldenCookieChoices[i*2]+'</a>';
				//str+='<a class="option neato" '+Game.clickStr+'="Game.goldenCookie.force=\''+Game.goldenCookie.choices[i*2+1]+'\';Game.goldenCookie.spawn();">'+Game.goldenCookie.choices[i*2]+'</a>';
				//str+='<a class="option neato" '+Game.clickStr+'="Game.goldenCookie.click(0,\''+Game.goldenCookie.choices[i*2+1]+'\');">'+Game.goldenCookie.choices[i*2]+'</a>';
			}
			str+='</div>';
			
			l('devConsole').innerHTML=str;
			
			if (!l('fpsGraph'))
			{
				var div=document.createElement('canvas');
				div.id='fpsGraph';
				div.width=128;
				div.height=64;
				div.style.opacity=0.5;
				div.style.pointerEvents='none';
				div.style.transformOrigin='0% 0%';
				div.style.transform='scale(0.75)';
				//l('devConsole').appendChild(div);
				l('devConsole').parentNode.insertBefore(div,l('devConsole').nextSibling);
				Game.fpsGraph=div;
				Game.fpsGraphCtx=Game.fpsGraph.getContext('2d',{alpha:false});
				var ctx=Game.fpsGraphCtx;
				ctx.fillStyle='#000';
				ctx.fillRect(0,0,128,64);
			}
			
			l('debug').style.display='block';
			Game.sesame=1;
			Game.Achievements['ズルして作ったクッキーはまずい'].won=1;
		}
		
		Game.EditAscend=function()
		{
			if (!Game.DebuggingPrestige)
			{
				Game.DebuggingPrestige=true;
				Game.AscendTimer=0;
				Game.OnAscend=1;
				Game.removeClass('ascendIntro');
				Game.addClass('ascending');
			}
			else
			{
				Game.DebuggingPrestige=false;
			}
			Game.BuildAscendTree();
			Game.OpenSesame();
		}
		
		//experimental debugging function that cycles through every owned upgrade, turns it off and on, and lists how much each upgrade is participating to CpS
		Game.debuggedUpgradeCpS=[];
		Game.debuggedUpgradeCpClick=[];
		Game.debugColors=['#322','#411','#600','#900','#f30','#f90','#ff0','#9f0','#0f9','#09f','#90f'];
		Game.DebugUpgradeCpS=function()
		{
			Game.CalculateGains();
			Game.debuggedUpgradeCpS=[];
			Game.debuggedUpgradeCpClick=[];
			var CpS=Game.cookiesPs;
			var CpClick=Game.computedMouseCps;
			for (var i in Game.Upgrades)
			{
				var me=Game.Upgrades[i];
				if (me.bought)
				{
					me.bought=0;
					Game.CalculateGains();
					//Game.debuggedUpgradeCpS[me.name]=CpS-Game.cookiesPs;
					Game.debuggedUpgradeCpS[me.name]=(CpS/(Game.cookiesPs||1)-1);
					Game.debuggedUpgradeCpClick[me.name]=(CpClick/(Game.computedMouseCps||1)-1);
					me.bought=1;
				}
			}
			Game.CalculateGains();
		}
		
		
		//Game.runModHook('init');
		
		
		if (!Game.LoadSave())
		{//try to load the save when we open the page. if this fails, try to brute-force it half a second later
			setTimeout(function(){
				var local=Game.localStorageGet(Game.SaveTo);
				Game.LoadSave(local);
			},500);
		}
		
		Game.ready=1;
		setTimeout(function(){if (typeof showAds==='undefined' && (!l('detectAds') || l('detectAds').clientHeight<1)) Game.addClass('noAds');},500);
		l('javascriptError').innerHTML='';
		l('javascriptError').style.display='none';
		Game.Loop();
		Game.Draw();
	}
	/*=====================================================================================
	LOGIC
	=======================================================================================*/
	Game.Logic=function()
	{
		Game.bounds=Game.l.getBoundingClientRect();
		
		if (!Game.OnAscend && Game.AscendTimer==0)
		{
			for (var i in Game.Objects)
			{
				if (Game.Objects[i].eachFrame) Game.Objects[i].eachFrame();
			}
			Game.UpdateSpecial();
			Game.UpdateGrandmapocalypse();
			
			//these are kinda fun
			//if (Game.BigCookieState==2 && !Game.promptOn && Game.Scroll!=0) Game.ClickCookie();
			//if (Game.BigCookieState==1 && !Game.promptOn) Game.ClickCookie();
			
			//handle graphic stuff
			if (Game.prefs.wobbly)
			{
				if (Game.BigCookieState==1) Game.BigCookieSizeT=0.98;
				else if (Game.BigCookieState==2) Game.BigCookieSizeT=1.05;
				else Game.BigCookieSizeT=1;
				Game.BigCookieSizeD+=(Game.BigCookieSizeT-Game.BigCookieSize)*0.75;
				Game.BigCookieSizeD*=0.75;
				Game.BigCookieSize+=Game.BigCookieSizeD;
				Game.BigCookieSize=Math.max(0.1,Game.BigCookieSize);
			}
			else
			{
				if (Game.BigCookieState==1) Game.BigCookieSize+=(0.98-Game.BigCookieSize)*0.5;
				else if (Game.BigCookieState==2) Game.BigCookieSize+=(1.05-Game.BigCookieSize)*0.5;
				else Game.BigCookieSize+=(1-Game.BigCookieSize)*0.5;
			}
			Game.particlesUpdate();
			
			if (Game.mousePointer) l('sectionLeft').style.cursor='pointer';
			else l('sectionLeft').style.cursor='auto';
			Game.mousePointer=0;
			
			//handle milk and milk accessories
			Game.milkProgress=Game.AchievementsOwned/25;
			if (Game.milkProgress>=0.5) Game.Unlock('お手伝い猫');
			if (Game.milkProgress>=1) Game.Unlock('労働者猫');
			if (Game.milkProgress>=2) Game.Unlock('技術者猫');
			if (Game.milkProgress>=3) Game.Unlock('監督者猫');
			if (Game.milkProgress>=4) Game.Unlock('管理者猫');
			if (Game.milkProgress>=5) Game.Unlock('会計士猫');
			if (Game.milkProgress>=6) Game.Unlock('専門家猫');
			if (Game.milkProgress>=7) Game.Unlock('熟練者猫');
			if (Game.milkProgress>=8) Game.Unlock('相談役猫');
			if (Game.milkProgress>=9) Game.Unlock('地区担当責任者補佐猫');
			if (Game.milkProgress>=10) Game.Unlock('市場商猫');
			if (Game.milkProgress>=11) Game.Unlock('分析者猫');
			if (Game.milkProgress>=12) Game.Unlock('役員猫');
			Game.milkH=Math.min(1,Game.milkProgress)*0.35;
			Game.milkHd+=(Game.milkH-Game.milkHd)*0.02;
			
			Game.Milk=Game.Milks[Math.min(Math.floor(Game.milkProgress),Game.Milks.length-1)];
			
			if (Game.autoclickerDetected>0) Game.autoclickerDetected--;
			
			//handle research
			if (Game.researchT>0)
			{
				Game.researchT--;
			}
			if (Game.researchT==0 && Game.nextResearch)
			{
				if (!Game.Has(Game.UpgradesById[Game.nextResearch].name))
				{
					Game.Unlock(Game.UpgradesById[Game.nextResearch].name);
					if (Game.prefs.popups) Game.Popup('研究終了 : '+Game.UpgradesById[Game.nextResearch].name);
					else Game.Notify('研究が終了しました','発見したもの : <b>'+Game.UpgradesById[Game.nextResearch].name+'</b>。',Game.UpgradesById[Game.nextResearch].icon);
				}
				Game.nextResearch=0;
				Game.researchT=-1;
				Game.recalculateGains=1;
			}
			//handle seasons
			if (Game.seasonT>0)
			{
				Game.seasonT--;
			}
			if (Game.seasonT<=0 && Game.season!='' && Game.season!=Game.baseSeason && !Game.Has('永遠の季節'))
			{
				var str=Game.seasons[Game.season].over;
				if (Game.prefs.popups) Game.Popup(str);
				else Game.Notify(str,'',Game.seasons[Game.season].triggerUpgrade.icon);
				if (Game.Has('季節切り替え装置')) {Game.Unlock(Game.seasons[Game.season].trigger);Game.seasons[Game.season].triggerUpgrade.bought=0;}
				Game.season=Game.baseSeason;
				Game.seasonT=-1;
			}
			
			//press ctrl to bulk-buy 10, shift to bulk-buy 100
			if (!Game.promptOn)
			{
				if ((Game.keys[16] || Game.keys[17]) && !Game.buyBulkShortcut)
				{
					Game.buyBulkOld=Game.buyBulk;
					if (Game.keys[16]) Game.buyBulk=100;
					if (Game.keys[17]) Game.buyBulk=10;
					Game.buyBulkShortcut=1;
					Game.storeBulkButton(-1);
				}
			}
			if ((!Game.keys[16] && !Game.keys[17]) && Game.buyBulkShortcut)//release
			{
				Game.buyBulk=Game.buyBulkOld;
				Game.buyBulkShortcut=0;
				Game.storeBulkButton(-1);
			}
			
			//handle cookies
			if (Game.recalculateGains) Game.CalculateGains();
			Game.Earn(Game.cookiesPs/Game.fps);//add cookies per second
			
			//grow lumps
			Game.doLumps();
			
			//minigames
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				if (Game.isMinigameReady(me) && me.minigame.logic && Game.ascensionMode!=1) me.minigame.logic();
			}
			
			if (Game.specialTab!='' && Game.T%(Game.fps*3)==0) Game.ToggleSpecialMenu(1);
			
			//wrinklers
			if (Game.cpsSucked>0)
			{
				Game.Dissolve((Game.cookiesPs/Game.fps)*Game.cpsSucked);
				Game.cookiesSucked+=((Game.cookiesPs/Game.fps)*Game.cpsSucked);
				//should be using one of the following, but I'm not sure what I'm using this stat for anymore
				//Game.cookiesSucked=Game.wrinklers.reduce(function(s,w){return s+w.sucked;},0);
				//for (var i in Game.wrinklers) {Game.cookiesSucked+=Game.wrinklers[i].sucked;}
			}
			
			//var cps=Game.cookiesPs+Game.cookies*0.01;//exponential cookies
			//Game.Earn(cps/Game.fps);//add cookies per second
			
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				me.totalCookies+=(me.storedTotalCps*Game.globalCpsMult)/Game.fps;
			}
			if (Game.cookies && Game.T%Math.ceil(Game.fps/Math.min(10,Game.cookiesPs))==0 && Game.prefs.particles) Game.particleAdd();//cookie shower
			
			if (Game.T%(Game.fps*10)==0) Game.recalculateGains=1;//recalculate CpS every 10 seconds (for dynamic boosts such as Century egg)
			
			/*=====================================================================================
			UNLOCKING STUFF
			=======================================================================================*/
			if (Game.T%(Game.fps)==0 && Math.random()<1/500000) Game.Win('ただのラッキー');//1 chance in 500,000 every second achievement
			if (Game.T%(Game.fps*5)==0 && Game.ObjectsById.length>0)//check some achievements and upgrades
			{
				if (isNaN(Game.cookies)) {Game.cookies=0;Game.cookiesEarned=0;Game.recalculateGains=1;}
				
				var timePlayed=new Date();
				timePlayed.setTime(Date.now()-Game.startDate);
				
				if (!Game.fullDate || (Date.now()-Game.fullDate)>=365*24*60*60*1000) Game.Win('他に面白いもの沢山あるのに');
				
				if (Game.cookiesEarned>=1000000 && (Game.ascensionMode==1 || Game.resets==0))//challenge run or hasn't ascended yet
				{
					if (timePlayed<=1000*60*35) Game.Win('スピードベイキングI');
					if (timePlayed<=1000*60*25) Game.Win('スピードベイキングII');
					if (timePlayed<=1000*60*15) Game.Win('スピードベイキングIII');
					
					if (Game.cookieClicks<=15) Game.Win('無クリック');
					if (Game.cookieClicks<=0) Game.Win('本当の無クリック');
					if (Game.cookiesEarned>=1000000000 && Game.UpgradesOwned==0) Game.Win('ハードコア');
				}
				
				for (var i in Game.UnlockAt)
				{
					var unlock=Game.UnlockAt[i];
					if (Game.cookiesEarned>=unlock.cookies)
					{
						var pass=1;
						if (unlock.require && !Game.Has(unlock.require) && !Game.HasAchiev(unlock.require)) pass=0;
						if (unlock.season && Game.season!=unlock.season) pass=0;
						if (pass) {Game.Unlock(unlock.name);Game.Win(unlock.name);}
					}
				}
				
				if (Game.Has('ゴールデンスイッチ')) Game.Unlock('ゴールデンスイッチ[オフ]');
				if (Game.Has('煌めくベール') && !Game.Has('煌めくベール[オフ]') && !Game.Has('煌めくベール[オン]')) {Game.Unlock('煌めくベール[オン]');Game.Upgrades['煌めくベール[オフ]'].earn();}
				if (Game.Has('砂糖の亡者')) Game.Unlock('砂糖フィーバー');
				if (Game.Has('クラシックデイリーセレクション')) Game.Unlock('ミルクセレクター');
				if (Game.Has('壁紙詰め合わせ')) Game.Unlock('背景セレクター');
				if (Game.Has('ゴールデンクッキー警告音')) Game.Unlock('ゴールデンクッキーの音選択');
				
				if (Game.Has('プリズムのハートのビスケット')) Game.Win('愛らしいクッキーたち');
				if (Game.season=='easter')
				{
					var eggs=0;
					for (var i in Game.easterEggs)
					{
						if (Game.HasUnlocked(Game.easterEggs[i])) eggs++;
					}
					if (eggs>=1) Game.Win('たまご狩りの始まり');
					if (eggs>=7) Game.Win('狩り立てるもの');
					if (eggs>=14) Game.Win('集団イーステリー');
					if (eggs>=Game.easterEggs.length) Game.Win('かくれんぼチャンピオン');
				}
				
				if (Game.Has('フォーチュンクッキー'))
				{
					var list=Game.Tiers['fortune'].upgrades;
					var fortunes=0;
					for (var i in list)
					{
						if (Game.Has(list[i].name)) fortunes++;
					}
					if (fortunes>=list.length) Game.Win('おお運命の女神よ');
				}
				
				if (Game.Has('遺産') && Game.ascensionMode!=1)
				{
					Game.Unlock('ヘブンリーチップスの極意');
					if (Game.Has('ヘブンリーチップスの極意')) Game.Unlock('天国のクッキースタンド');
					if (Game.Has('天国のクッキースタンド')) Game.Unlock('天国のベーカリー');
					if (Game.Has('天国のベーカリー')) Game.Unlock('天国の製菓ファクトリー');
					if (Game.Has('天国の製菓ファクトリー')) Game.Unlock('天国の鍵');
					
					if (Game.Has('天国の鍵')) Game.Win('全開');
				}
			
				for (var i in Game.BankAchievements)
				{
					if (Game.cookiesEarned>=Game.BankAchievements[i].threshold) Game.Win(Game.BankAchievements[i].name);
				}
				
				var buildingsOwned=0;
				var mathematician=1;
				var base10=1;
				var minAmount=100000;
				for (var i in Game.Objects)
				{
					buildingsOwned+=Game.Objects[i].amount;
					minAmount=Math.min(Game.Objects[i].amount,minAmount);
					if (!Game.HasAchiev('数学者')) {if (Game.Objects[i].amount<Math.min(128,Math.pow(2,(Game.ObjectsById.length-Game.Objects[i].id)-1))) mathematician=0;}
					if (!Game.HasAchiev('10進法')) {if (Game.Objects[i].amount<(Game.ObjectsById.length-Game.Objects[i].id)*10) base10=0;}
				}
				if (minAmount>=1) Game.Win('ひとつひとつ');
				if (mathematician==1) Game.Win('数学者');
				if (base10==1) Game.Win('10進法');
				if (minAmount>=100) {Game.Win('100個記念');Game.Unlock('ミルクチョコレートバタービスケット');}
				if (minAmount>=150) {Game.Win('150個記念');Game.Unlock('ダークチョコレートバタービスケット');}
				if (minAmount>=200) {Game.Win('200個記念');Game.Unlock('ホワイトチョコレートバタービスケット');}
				if (minAmount>=250) {Game.Win('250個記念');Game.Unlock('ルビーチョコレートバタービスケット');}
				if (minAmount>=300) {Game.Win('300個記念');Game.Unlock('ラベンダーチョコレートバタービスケット');}
				if (minAmount>=350) {Game.Win('350個記念');Game.Unlock('合成チョコレート翠緑蜂蜜バタービスケット');}
				if (minAmount>=400) {Game.Win('400個記念');Game.Unlock('ロイヤルラズベリーチョコレートバタービスケット');}
				if (minAmount>=450) {Game.Win('450個記念');Game.Unlock('超凝縮高エネルギーチョコレートバタービスケット');}
				if (minAmount>=500) {Game.Win('500個記念');Game.Unlock('純然たる漆黒のチョコレートバタービスケット');}
				if (minAmount>=550) {Game.Win('550個記念');Game.Unlock('宇宙を秘めたチョコレートバタービスケット');}
				if (minAmount>=600) {Game.Win('600個記念');Game.Unlock('バタービスケット(バターを添えて)');}
				
				if (Game.handmadeCookies>=1000) {Game.Win('ファンタスティックリック');Game.Unlock('プラスチックマウス');}
				if (Game.handmadeCookies>=100000) {Game.Win('クリック競技');Game.Unlock('鉄のマウス');}
				if (Game.handmadeCookies>=10000000) {Game.Win('クリックオリンピック');Game.Unlock('チタンのマウス');}
				if (Game.handmadeCookies>=1000000000) {Game.Win('クリック主義');Game.Unlock('アダマンチウムのマウス');}
				if (Game.handmadeCookies>=100000000000) {Game.Win('クリック病');Game.Unlock('アンオブテニウムのマウス');}
				if (Game.handmadeCookies>=10000000000000) {Game.Win('クリックハルマゲドン');Game.Unlock('エルディウムのマウス');}
				if (Game.handmadeCookies>=1000000000000000) {Game.Win('クリックラグナロク');Game.Unlock('望まれし合金のマウス');}
				if (Game.handmadeCookies>=100000000000000000) {Game.Win('クリックカタストロフ');Game.Unlock('夢の鋼鉄のマウス');}
				if (Game.handmadeCookies>=10000000000000000000) {Game.Win('クリックカタクリズム');Game.Unlock('不磨のマウス');}
				if (Game.handmadeCookies>=1000000000000000000000) {Game.Win('ジ・アルティメット・クリックダウン');Game.Unlock('軍用ミスリル製マウス');}
				if (Game.handmadeCookies>=100000000000000000000000) {Game.Win('イカしたクリックをするお前ら');Game.Unlock('ハイテク黒曜石マウス ');}
				if (Game.handmadeCookies>=10000000000000000000000000) {Game.Win('もう…一度…クリックを…');Game.Unlock('プラズマ大理石マウス');}
				if (Game.handmadeCookies>=1000000000000000000000000000) {Game.Win('カチャカチャ');Game.Unlock('奇跡の石のマウス');}
				
				if (Game.cookiesEarned<Game.cookies) Game.Win('ズルして作ったクッキーはまずい');
				
				if (Game.Has('骨クッキー') && Game.Has('幽霊クッキー') && Game.Has('こうもりクッキー') && Game.Has('スライムクッキー') && Game.Has('かぼちゃクッキー') && Game.Has('眼球クッキー') && Game.Has('蜘蛛クッキー')) Game.Win('クッキーおばけ');
				if (Game.wrinklersPopped>=1) Game.Win('かゆいところに手が届く');
				if (Game.wrinklersPopped>=50) Game.Win('荒れたところをよくならす');
				if (Game.wrinklersPopped>=200) Game.Win('駄目なやつらはぶっ飛ばす');
				
				if (Game.cookiesEarned>=1000000 && Game.Has('ドラゴンの焼き方')) Game.Unlock('ポロポロこぼれそうな卵');
				
				if (Game.cookiesEarned>=25 && Game.season=='christmas') Game.Unlock('とある祭りの帽子');
				if (Game.Has('クリスマスツリービスケット') && Game.Has('雪の結晶ビスケット') && Game.Has('雪だるまビスケット') && Game.Has('ヒイラギビスケット') && Game.Has('キャンディケインビスケット') && Game.Has('鐘ビスケット') && Game.Has('プレゼント箱ビスケット')) Game.Win('雪やこんこん');
				
				if (Game.reindeerClicked>=1) Game.Win('まジカよ!');
				if (Game.reindeerClicked>=50) Game.Win('ソリ追いの匠');
				if (Game.reindeerClicked>=200) Game.Win('トナカイスレイヤー');
				
				if (buildingsOwned>=100) Game.Win('建築者');
				if (buildingsOwned>=500) Game.Win('設計者');
				if (buildingsOwned>=1000) Game.Win('技術者');
				if (buildingsOwned>=2000) Game.Win('創造王');
				if (buildingsOwned>=4000) Game.Win('雄大なデザイン');
				if (buildingsOwned>=8000) Game.Win('エクメノポリス');
				if (Game.UpgradesOwned>=20) Game.Win('促進者');
				if (Game.UpgradesOwned>=50) Game.Win('増強者');
				if (Game.UpgradesOwned>=100) Game.Win('改良者');
				if (Game.UpgradesOwned>=200) Game.Win('発展王');
				if (Game.UpgradesOwned>=300) Game.Win('全体像');
				if (Game.UpgradesOwned>=400) Game.Win('加えるものがなくなった時');
				if (buildingsOwned>=4000 && Game.UpgradesOwned>=300) Game.Win('博学');
				if (buildingsOwned>=8000 && Game.UpgradesOwned>=400) Game.Win('ルネサンスの焼き菓子職人');
				
				if (!Game.HasAchiev('ジェリクル'))
				{
					var kittens=0;
					for (var i=0;i<Game.UpgradesByPool['kitten'].length;i++)
					{
						if (Game.Has(Game.UpgradesByPool['kitten'][i].name)) kittens++;
					}
					if (kittens>=10) Game.Win('ジェリクル');
				}
				
				if (Game.cookiesEarned>=10000000000000 && !Game.HasAchiev('記念品はクッキー1枚')) {Game.Win('記念品はクッキー1枚');Game.Earn(1);}
				
				if (Game.shimmerTypes['golden'].n>=4) Game.Win('四葉のクッキー');
				
				var grandmas=0;
				for (var i in Game.GrandmaSynergies)
				{
					if (Game.Has(Game.GrandmaSynergies[i])) grandmas++;
				}
				if (!Game.HasAchiev('長老会') && grandmas>=7) Game.Win('長老会');
				if (!Game.HasAchiev('老兵') && grandmas>=14) Game.Win('老兵');
				if (Game.Objects['グランマ'].amount>=6 && !Game.Has('ビンゴセンター/研究施設') && Game.HasAchiev('長老会')) Game.Unlock('ビンゴセンター/研究施設');
				if (Game.pledges>0) Game.Win('うたた寝');
				if (Game.pledges>=5) Game.Win('まどろみ');
				if (Game.pledges>=10) Game.Unlock('いけにえの延べ棒');
				if (Game.Objects['カーソル'].amount+Game.Objects['グランマ'].amount>=777) Game.Win('エルダースクロール');
				
				for (var i in Game.Objects)
				{
					var it=Game.Objects[i];
					for (var ii in it.productionAchievs)
					{
						if (it.totalCookies>=it.productionAchievs[ii].pow) Game.Win(it.productionAchievs[ii].achiev.name);
					}
				}
				
				if (!Game.HasAchiev('浸して食べよう') && Game.LeftBackground && Game.milkProgress>0.1 && (Game.LeftBackground.canvas.height*0.4+256/2-16)>((1-Game.milkHd)*Game.LeftBackground.canvas.height)) Game.Win('浸して食べよう');
				//&& l('bigCookie').getBoundingClientRect().bottom>l('milk').getBoundingClientRect().top+16 && Game.milkProgress>0.1) Game.Win('浸して食べよう');
				
				Game.runModHook('check');
			}
			
			Game.cookiesd+=(Game.cookies-Game.cookiesd)*0.3;
			
			if (Game.storeToRefresh) Game.RefreshStore();
			if (Game.upgradesToRebuild) Game.RebuildUpgrades();
			
			Game.updateShimmers();
			Game.updateBuffs();
			
			Game.UpdateTicker();
		}
		
		if (Game.T%(Game.fps*2)==0)
		{
			var title='CookieClicker日本語版';
			if (Game.season=='fools') title='CookieBaker日本語版';
			document.title=(Game.OnAscend?'昇天中! ':'')+Beautify(Game.cookies)+(Game.cookies==1?'クッキー':'クッキー')+' - '+title;
		}
		if (Game.T%15==0)
		{
			//written through the magic of "hope for the best" maths
			var chipsOwned=Game.HowMuchPrestige(Game.cookiesReset);
			var ascendNowToOwn=Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned));
			var ascendNowToGet=ascendNowToOwn-Math.floor(chipsOwned);
			var nextChipAt=Game.HowManyCookiesReset(Math.floor(chipsOwned+ascendNowToGet+1))-Game.HowManyCookiesReset(Math.floor(chipsOwned+ascendNowToGet));
			var cookiesToNext=Game.HowManyCookiesReset(ascendNowToOwn+1)-(Game.cookiesEarned+Game.cookiesReset);
			var percent=1-(cookiesToNext/nextChipAt);
			
			//fill the tooltip under the Legacy tab
			var date=new Date();
			date.setTime(Date.now()-Game.startDate);
			var timeInSeconds=date.getTime()/1000;
			var startDate=Game.sayTime(timeInSeconds*Game.fps,-1);
			
			var str='';
			str+='この周回を<b>'+(startDate==''?'ごくわずか':(startDate))+'</b>の間プレイしています。<br>';
			str+='<div class="line"></div>';
			if (Game.prestige>0)
			{
				str+='あなたの名声レベルは現在、<b>'+Beautify(Game.prestige)+'</b>レベルです。<br>(CpS +'+Beautify(Game.prestige)+'%)';
				str+='<div class="line"></div>';
			}
			if (ascendNowToGet<1) str+='今昇天しても名声は授けられません。';
			else if (ascendNowToGet<2) str+='今昇天すると、<br><b>1名声レベル</b> (+1% CpS)<br>と天国で消費するための<b>1ヘブンリーチップス</b>が授けられます。';
			else str+='今昇天すると、<br><b>'+Beautify(ascendNowToGet)+'名声レベル</b> (+'+Beautify(ascendNowToGet)+'% CpS)<br>と天国で消費するための<b>'+Beautify(ascendNowToGet)+'ヘブンリーチップス</b>が授けられます。';
			str+='<div class="line"></div>';
			str+='次のレベルには<b>'+Beautify(cookiesToNext)+'枚多くのクッキー</b>が必要です。<br>';
			l('ascendTooltip').innerHTML=str;
			
			if (ascendNowToGet>0)//show number saying how many chips you'd get resetting now
			{
				Game.ascendNumber.textContent='+'+SimpleBeautify(ascendNowToGet);
				Game.ascendNumber.style.display='block';
			}
			else
			{
				Game.ascendNumber.style.display='none';
			}
			
			if (ascendNowToGet>Game.ascendMeterLevel || Game.ascendMeterPercentT<Game.ascendMeterPercent)
			{
				//reset the gauge and play a sound if we gained a potential level
				Game.ascendMeterPercent=0;
				//PlaySound('snd/levelPrestige.mp3');//a bit too annoying
			}
			Game.ascendMeterLevel=ascendNowToGet;
			Game.ascendMeterPercentT=percent;//gauge that fills up as you near your next chip
			//if (Game.ascendMeterPercentT<Game.ascendMeterPercent) {Game.ascendMeterPercent=0;PlaySound('snd/levelPrestige.mp3',0.5);}
			//if (percent>=1) {Game.ascendMeter.className='';} else Game.ascendMeter.className='filling';
		}
		//Game.ascendMeter.style.right=Math.floor(Math.max(0,1-Game.ascendMeterPercent)*100)+'px';
		Game.ascendMeter.style.transform='translate('+Math.floor(-Math.max(0,1-Game.ascendMeterPercent)*100)+'px,0px)';
		Game.ascendMeterPercent+=(Game.ascendMeterPercentT-Game.ascendMeterPercent)*0.1;
		
		Game.NotesLogic();
		if (Game.mouseMoved || Game.Scroll || Game.tooltip.dynamic) Game.tooltip.update();
		
		if (Game.T%(Game.fps*5)==0 && !Game.mouseDown && (Game.onMenu=='stats' || Game.onMenu=='prefs')) Game.UpdateMenu();
		if (Game.T%(Game.fps*1)==0) Game.UpdatePrompt();
		if (Game.AscendTimer>0) Game.UpdateAscendIntro();
		if (Game.ReincarnateTimer>0) Game.UpdateReincarnateIntro();
		if (Game.OnAscend) Game.UpdateAscend();
		
		Game.runModHook('logic');
		
		if (Game.sparklesT>0)
		{
			Game.sparkles.style.backgroundPosition=-Math.floor((Game.sparklesFrames-Game.sparklesT+1)*128)+'px 0px';
			Game.sparklesT--;
			if (Game.sparklesT==1) Game.sparkles.style.display='none';
		}
		
		Game.Click=0;
		Game.Scroll=0;
		Game.mouseMoved=0;
		Game.CanClick=1;
		
		if ((Game.toSave || (Game.T%(Game.fps*60)==0 && Game.T>Game.fps*10 && Game.prefs.autosave)) && !Game.OnAscend)
		{
			//check if we can save : no minigames are loading
			var canSave=true;
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				if (me.minigameLoading){canSave=false;break;}
			}
			if (canSave) Game.WriteSave();
		}
		
		//every 30 minutes : get server data (ie. update notification, patreon data)
		if (Game.T%(Game.fps*60*30)==0 && Game.T>Game.fps*10/* && Game.prefs.autoupdate*/) {Game.CheckUpdates();Game.GrabData();}
		
		Game.T++;
	}
	
	/*=====================================================================================
	DRAW
	=======================================================================================*/
	
	Game.Draw=function()
	{
		Game.DrawBackground();Timer.track('end of background');
		
		if (!Game.OnAscend)
		{
			
			var unit=(Math.round(Game.cookiesd)==1?' クッキー':' クッキー');
			var str=Beautify(Math.round(Game.cookiesd));
			if (Game.cookiesd>=1000000)//dirty padding
			{
				var spacePos=str.indexOf(' ');
				var dotPos=str.indexOf('.');
				var add='';
				if (spacePos!=-1)
				{
					if (dotPos==-1) add+='.000';
					else
					{
						if (spacePos-dotPos==2) add+='00';
						if (spacePos-dotPos==3) add+='0';
					}
				}
				str=[str.slice(0, spacePos),add,str.slice(spacePos)].join('');
			}
			if (str.length>11 && !Game.mobile) unit='<br>クッキー';
			str+=unit;
			if (Game.prefs.monospace) str='<span class="monospace">'+str+'</span>';
			str=str+'<div style="font-size:50%;"'+(Game.cpsSucked>0?' class="warning"':'')+'>クッキー毎秒(CpS) : '+Beautify(Game.cookiesPs*(1-Game.cpsSucked),1)+'</div>';//display cookie amount
			l('cookies').innerHTML=str;
			l('compactCookies').innerHTML=str;
			Timer.track('cookie amount');
			
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				if (me.onMinigame && me.minigame.draw && !me.muted && !Game.onMenu) me.minigame.draw();
			}
			Timer.track('draw minigames');
			
			if (Game.drawT%5==0)
			{
				//if (Game.prefs.monospace) {l('cookies').className='title monospace';} else {l('cookies').className='title';}
				var lastLocked=0;
				for (var i in Game.Objects)
				{
					var me=Game.Objects[i];
					
					//make products full-opacity if we can buy them
					var classes='product';
					var price=me.bulkPrice;
					if (Game.cookiesEarned>=me.basePrice || me.bought>0) {classes+=' unlocked';lastLocked=0;me.locked=0;} else {classes+=' locked';lastLocked++;me.locked=1;}
					if ((Game.buyMode==1 && Game.cookies>=price) || (Game.buyMode==-1 && me.amount>0)) classes+=' enabled'; else classes+=' disabled';
					if (lastLocked>2) classes+=' toggledOff';
					me.l.className=classes;
					//if (me.id>0) {l('productName'+me.id).innerHTML=Beautify(me.storedTotalCps/Game.ObjectsById[me.id-1].storedTotalCps,2);}
				}
				
				//make upgrades full-opacity if we can buy them
				var lastPrice=0;
				for (var i in Game.UpgradesInStore)
				{
					var me=Game.UpgradesInStore[i];
					if (!me.bought)
					{
						var price=me.getPrice();
						var canBuy=me.canBuy();//(Game.cookies>=price);
						var enabled=(l('upgrade'+i).className.indexOf('enabled')>-1);
						if ((canBuy && !enabled) || (!canBuy && enabled)) Game.upgradesToRebuild=1;
						if (price<lastPrice) Game.storeToRefresh=1;//is this upgrade less expensive than the previous one? trigger a refresh to sort it again
						lastPrice=price;
					}
					if (me.timerDisplay)
					{
						var T=me.timerDisplay();
						if (T!=-1)
						{
							if (!l('upgradePieTimer'+i)) l('upgrade'+i).innerHTML=l('upgrade'+i).innerHTML+'<div class="pieTimer" id="upgradePieTimer'+i+'"></div>';
							T=(T*144)%144;
							l('upgradePieTimer'+i).style.backgroundPosition=(-Math.floor(T%18))*48+'px '+(-Math.floor(T/18))*48+'px';
						}
					}
					
					//if (me.canBuy()) l('upgrade'+i).className='crate upgrade enabled'; else l('upgrade'+i).className='crate upgrade disabled';
				}
			}
			Timer.track('store');
			
			if (Game.PARTY)//i was bored and felt like messing with CSS
			{
				var pulse=Math.pow((Game.T%10)/10,0.5);
				Game.l.style.filter='hue-rotate('+((Game.T*5)%360)+'deg) brightness('+(150-50*pulse)+'%)';
				Game.l.style.webkitFilter='hue-rotate('+((Game.T*5)%360)+'deg) brightness('+(150-50*pulse)+'%)';
				Game.l.style.transform='scale('+(1.02-0.02*pulse)+','+(1.02-0.02*pulse)+') rotate('+(Math.sin(Game.T*0.5)*0.5)+'deg)';
				l('wrapper').style.overflowX='hidden';
				l('wrapper').style.overflowY='hidden';
			}
			
			Timer.clean();
			if (Game.prefs.animate && ((Game.prefs.fancy && Game.drawT%1==0) || (!Game.prefs.fancy && Game.drawT%10==0)) && Game.AscendTimer==0 && Game.onMenu=='') Game.DrawBuildings();Timer.track('buildings');
			
			Game.textParticlesUpdate();Timer.track('text particles');
		}
		
		Game.NotesDraw();Timer.track('notes');
		//Game.tooltip.update();//changed to only update when the mouse is moved
		
		Game.runModHook('draw');
		
		Game.drawT++;
		//if (Game.prefs.altDraw) requestAnimationFrame(Game.Draw);
	}
	
	/*=====================================================================================
	MAIN LOOP
	=======================================================================================*/
	Game.Loop=function()
	{
		if (Game.timedout) return false;
		Timer.say('START');
		Timer.track('browser stuff');
		Timer.say('LOGIC');
		//update game logic !
		Game.catchupLogic=0;
		Game.Logic();
		Game.catchupLogic=1;
		
		var time=Date.now();
		
		
		//latency compensator
		Game.accumulatedDelay+=((time-Game.time)-1000/Game.fps);
		if (Game.prefs.timeout && time-Game.lastActivity>=1000*60*5)
		{
			if (Game.accumulatedDelay>1000*60*30) Game.delayTimeouts+=3;//more than 30 minutes delay ? computer probably asleep and not making cookies anyway
			else if (Game.accumulatedDelay>1000*5) Game.delayTimeouts++;//add to timeout counter when we skip 10 seconds worth of frames (and the player has been inactive for at least 5 minutes)
			if (Game.delayTimeouts>=3) Game.Timeout();//trigger timeout when the timeout counter is 3+
		}
		
		Game.accumulatedDelay=Math.min(Game.accumulatedDelay,1000*5);//don't compensate over 5 seconds; if you do, something's probably very wrong
		Game.time=time;
		while (Game.accumulatedDelay>0)
		{
			Game.Logic();
			Game.accumulatedDelay-=1000/Game.fps;//as long as we're detecting latency (slower than target fps), execute logic (this makes drawing slower but makes the logic behave closer to correct target fps)
		}
		Game.catchupLogic=0;
		Timer.track('logic');
		Timer.say('END LOGIC');
		if (!Game.prefs.altDraw)
		{
			var hasFocus=document.hasFocus();
			Timer.say('DRAW');
			if (hasFocus || Game.prefs.focus || Game.loopT%10==0) requestAnimationFrame(Game.Draw);
			//if (document.hasFocus() || Game.loopT%5==0) Game.Draw();
			Timer.say('END DRAW');
		}
		else requestAnimationFrame(Game.Draw);
		
		//if (!hasFocus) Game.tooltip.hide();
		
		if (Game.sesame)
		{
			//fps counter and graph
			Game.previousFps=Game.currentFps;
			Game.currentFps=Game.getFps();
				var ctx=Game.fpsGraphCtx;
				ctx.drawImage(Game.fpsGraph,-1,0);
				ctx.fillStyle='rgb('+Math.round((1-Game.currentFps/Game.fps)*128)+',0,0)';
				ctx.fillRect(128-1,0,1,64);
				ctx.strokeStyle='#fff';
				ctx.beginPath();
				ctx.moveTo(128-1,(1-Game.previousFps/Game.fps)*64);
				ctx.lineTo(128,(1-Game.currentFps/Game.fps)*64);
				ctx.stroke();
			
			l('fpsCounter').textContent=Game.currentFps+' fps';
			var str='';
			for (var i in Timer.labels) {str+=Timer.labels[i];}
			if (Game.debugTimersOn) l('debugLog').style.display='block';
			else l('debugLog').style.display='none';
			l('debugLog').innerHTML=str;
			
		}
		Timer.reset();
		
		Game.loopT++;
		setTimeout(Game.Loop,1000/Game.fps);
	}
}


/*=====================================================================================
LAUNCH THIS THING
=======================================================================================*/
Game.Launch();
//try {Game.Launch();}
//catch(err) {console.log('ERROR : '+err.message);}

window.onload=function()
{
	
	if (!Game.ready)
	{
		if (top!=self) Game.ErrorFrame();
		else
		{
			console.log('[=== '+choose([
				'お、こんにちは!',
				'やあ、調子どう',
				'まさにズルしてクッキーを作ろうとしてるのかい、それともバグを確認してるだけかい?',
				'覚えておいて : ズルして作ったクッキーはまずい!',
				'やあ、Orteilだよ。ズルして作ったクッキーはまずい…まずいよね?',
			])+' ===]');
			Game.Load();
			//try {Game.Load();}
			//catch(err) {console.log('ERROR : '+err.message);}
		}
	}
};