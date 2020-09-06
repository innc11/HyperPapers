import * as $ from 'jquery'
import * as HyperMD from 'hypermd'
import { bubble, getResourceServerUrlHeader } from './utils'
import { fileBrowser, websocket, pluginSystem } from '.'

interface UploadTask
{
	name: string,
	url: string,
	placeholder: HTMLImageElement
}

let hye: any = null

function fileUploadHandler(files: Array<any>, action: any)
{
	// 检测空格
	let space = false
	for (let file of files) {
		space = space || file.name.indexOf(' ') != -1
	}
	if(space) {
		bubble('文件名不能包含空格')
		return false
	}
	
	if(!fileBrowser.editing) {
		bubble('没有文件被打开，无法上传文件')
		return false
	}
	
	let spinGIF = 'data:image/gif;base64,R0lGODlhEAAQAMMMAAQEBIGBgby8vEJCQtzc3GJiYqCgoC8vL8zMzFRUVBkZGY+Pj+rq6nJycq2trQAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJDAAPACwAAAAAEAAQAAAEVvDJSat9rDV2JSOPcRzGg4AUUwxnkjACcKASMQwCFShATiG+CSERSBE4HYohsegQEEhDoXl5ohjQpOVpYSAnjECD9iA4gpNFACTIwRBJxmLx1Z60eEkEACH5BAkIAA8ALAEAAQAOAA4AAARQ8EnJQmAzM/LEOMJDYFRTEITFCMdAEkUSTotyIBMyT4wzb6SMBLFAOBoG4eQAGAiQSgkzAYyKFpzHRhmUGLAaBG7iWGDEWkRWaXBYM4RxJgIAIfkECQwADwAsAQABAA4ADgAABE/wScnWYjNPkZJ4BDYtQWgxyJCITFAQmXEMsEQg2iPgtpgjC4Qg8Mk9BooCsJhDNkBGm6HG8NkSgYxjmmkAAEyEA0OAOQCKmkYoEag15VwEACH5BAkIAA8ALAEAAQAOAA4AAARO8EnJjGMzT9IaeQQ2OcZHPkjRiI+xfJOQFCwBZwKi7RTCEI6bpjEIAHW8xmHByzB8ExbFgZQgoBOD4nAj+BCHA0IQFkoCAAAzxCMkEuYIACH5BAkMAA8ALAEAAQAOAA4AAARP8MmJ0LyXhcWwFEIHPsTWSY5BXEjTnA+zYsjsYTLDCDa2DCre7RFIGIYTBuJU7D0Elg8A0Lg4DoMZQQFQDQYIwSABI1gWCsWRALsQCg1nBAAh+QQJCAAPACwBAAEADgAOAAAETPDJSci82BlMkUQeYTgXyFzEsl0nVn2LwEkMwQzAMT9G4+C6WU/AWFhmtRbC0ZoIjg/CQbGSCBKFlvRADAQYiEKjWXsIDgOZDeltSiIAIfkECQwADwAsAQABAA4ADgAABE7wyUnIvI8gKTbOCuA8jMU43iMAQHMRzjg1ifUyErKkWPkUisGHExAAE0PVjmCwDZ0IwQfhJAwGslyjgSNdBYzFotRYXHyCREKaJIm7kwgAIfkEBQgADwAsAQABAA4ADgAABE3wSUlKITMzHABYmcQMh0AMA4ZgEnIo4MQgSCY4TJiLyB5mgUHj13IQgkMiwTjzEScEwY/AelQSUujCIGsUeg4Dg7FwaDCERqP6NJhDEQA7';
	let errorPNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAP1BMVEWIioX29/bu7uz+//79/f3S0tL09PPy8vHw8O74+fjMAADU2ND6+vr39/bY3NW9vrzp6ubl5+Pi5N/e4duytLE6MtxfAAAAbUlEQVQY022PSRLDMAgEgZBhMXLW/781cqKDYrtvdPWBoRvNbOflD+qCZ7rQdX09H3dxcClvxeKQgX2LRSRFPGdhaRnmgiHcIgMw559wQ0Y2hrUheh+9YdQQaFFa1aCnf+jh0+sE77co0Xs3/wNPXARclYchfgAAAABJRU5ErkJggg==';
	
	let placeholderUploadingClass = 'hmd-file-uploading';
	let placeholderUploadedClass = 'hmd-file-uploaded';
	
	let unfinishedCount = 0;
	
	let placeholderForAll = document.createElement('span');
	placeholderForAll.className = 'smms-hosted-items';
	
	action.setPlaceholder(placeholderForAll);
	
	let uploads: Array<UploadTask> = [];
	for (let file of files) {
		let blobURL = spinGIF;
		let name_1 = file.name.match(/[^\\\/]+\.\w+$/)[0];
		
		let placeholder = document.createElement('img');
		placeholder.onload = resize; // img size changed
		placeholder.className = placeholderUploadingClass;
		placeholder.src = blobURL;
		placeholderForAll.appendChild(placeholder);
		
		let task = {
			name: name_1,
			url: '',
			placeholder: placeholder
		}
		
		uploads.push(task);
		unfinishedCount++;
		
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function (e) {
			let fileBase64 = e.target.result;
			Upload_One(fileBase64 as string, name_1, uploadCallback.bind(null, task));
		};
	}
	
	return uploads.length > 0;

	// 上传到我的服务器进行存储
	function Upload_One(file: string, filename: string, callback: (url: string) => void) {
		let attachPlugin = pluginSystem.getPlugin('attach')
		let b64 = file.split(',')[1]

		filename = filename != 'image.png'? filename:null

		bubble('正在上传: '+filename)
		
		attachPlugin.vue.open(() => {
			attachPlugin.vue.uploadBinaryFromMemory(window.atob(b64), (Filename: string) => {
				let url = getResourceServerUrlHeader() + (fileBrowser.path.replace(/\.md$/g, ''))+'.assets/' + Filename
				callback(url)
				attachPlugin.vue.close()
			}, filename)
		})
	}

	// 调整
	function resize() {
		action.resize();
	}


	// 上传图片成功url载入
	function uploadCallback(task: UploadTask, url: string) {
		task.url = url != ''? url:'error';
		let placeholder = task.placeholder;
		placeholder.className = placeholderUploadedClass;
		let _preloadDone = preloadCallback.bind(null, task);
		if (url) {
			let img = document.createElement('img');
			img.addEventListener('load', _preloadDone, false);
			img.addEventListener('error', _preloadDone, false);
			img.src = url;
		}else {
			placeholder.src = errorPNG;
			_preloadDone();
		}
	}

	// 插入markdown图片地址
	function preloadCallback(_task: UploadTask) {
		if (--unfinishedCount === 0) {
			let texts = uploads.map(function (it) {
				let imgExts = new Array('png', 'jpg', 'jpeg', 'bmp', 'gif')
				let extSp = it.url.lastIndexOf('.')
				let ext = extSp != -1? it.url.substring(extSp + 1):''
				let isImage = ext!='' && $.inArray(ext, imgExts) != -1

				return (isImage? '!':'') + '[' + it.name + '](' + it.url + ')';
			});
			action.finish(texts.join(' ') + ' ');
		}
	}
}


function initHypermd() {
	
	let myTextarea: any = document.getElementById('hypermdtextarea')
	hye = HyperMD.fromTextArea(myTextarea, {
	  // for code fence highlighting
	  hmdModeLoader: 'https://cdn.jsdelivr.net/npm/codemirror/',
	})
	
	hye.setSize(null, '100%') // set height
	// hye.focus()
	
	hye.on('change', function(_instance: any, changeObj: any) {
		if(typeof(changeObj.origin) != 'undefined') {
			if(fileBrowser.editing) {
				fileBrowser.contentModified = true
			}
		}
	})
	
	// 上传文件处理回调
	// https://github.com/LuRenJiasWorld/Wp-HyperMD/blob/ad935695da1a1957b8bcf7569e364000be926239/assets/Config/HyperMD.js
	hye.setOption('hmdInsertFile', {
		byPaste: true, //粘贴上传
		byDrop: true, //拖拽上传
		fileHandler: fileUploadHandler
	})
	
	hye.setOption('hmdClick', {
		enabled: true,
		handler: function(clickinfo: any, cm: any) {
			if(clickinfo.type == 'todo') {
				if(fileBrowser.editing) {
					fileBrowser.contentModified = true
				}
			}
		}
	})
}

function hye_save(callback = () => {}, tip = false)
{
	if(!websocket.isConnected()) {
		bubble('当前已离线，无法进行保存')
		callback()
		return
	}
	
	if(!fileBrowser.editing) {
		bubble('没有文件被打开')
		callback()
		return
	}
	
	if(!fileBrowser.contentModified) {
		if(tip) bubble('内容没有变动')
		callback()
		return
	}
	
	if(!fileBrowser.contentLoaded) {
		bubble('内容还未加载完成，无法进行保存')
		callback()
		return
	}
	
	function parseImageURL(content: string) {
		let i = getResourceServerUrlHeader()//.replace(/\./g, '\\.')
		let r = '(?<=\\[.*\\]\\()('+i+').*?(?=[^/]*/[^/]*\\))'
		let reg = new RegExp(r, 'g')
		return content.replace(reg, '')
	}
	
	fileBrowser.contentSaving = true
	
	fileBrowser.onSavedCallback = () => {
		callback()
	}
	
	// 5.5s 后显示保存超时信息
	setTimeout(() => {
		if(!fileBrowser.contentSaving) return
		fileBrowser.contentSaving = false
		bubble('保存超时', 10000)
	}, 5500)
	
	let message = {
		action:'write_file', 
		path:fileBrowser.path, 
		'content': parseImageURL(hye.getValue())
	}
	websocket.sendMessage(message)
}

export {
	initHypermd,
	hye_save,
	hye
}