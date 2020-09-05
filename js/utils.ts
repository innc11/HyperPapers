import * as $ from 'jquery'
import { websocket, pluginSystem } from '.'

export function getResourceServerUrlHeader(): string
{
	let user = $.cookie('user')
	
	if(typeof(user)=="undefined")
		user = "NO_USER"
	
	let protocol = location.protocol.split(":")[0]
	let reg = new RegExp("^\\w+(?=:)", "g") // http or https

	return websocket.url.replace(reg, protocol)+"/_/"+user+"/"
}

// https://www.cnblogs.com/baiyygynui/p/5836461.html
export function bubble(message: string, duration: number = 2000)
{
	if(pluginSystem.isPluginLoaded('notify'))
		pluginSystem.getPlugin('notify').vue.addMessage(message, duration)

	console.log("bubble: " + message)
}

// https://blog.csdn.net/qq_32279193/java/article/details/80983202
export function byteConvert(bytes: number, space = ' ') 
{
	if (isNaN(bytes)) {
		return '';
	}
	let symbols = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
	let exp = Math.floor(Math.log(bytes)/Math.log(2));
	if (exp < 1) {
		exp = 0;
	}
	let i = Math.floor(exp / 10);
	bytes = bytes / Math.pow(2, 10 * i);

	let t: string

	if (bytes.toString().length > bytes.toFixed(2).toString().length) {
		t = bytes.toFixed(1);
	}
	return t + space + symbols[i];
};


// https://www.cnblogs.com/hjbky/p/9552494.html
export function guid()
{
	function S4() {
	   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	}
	return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}







// https://blog.csdn.net/zidasine/java/article/details/8151649
export function printCallStack() {
let i = 0;
let fun = arguments.callee;
do {
fun = fun.arguments.callee.caller;
console.log(++i + ': ' + fun);
} while (fun);
}

