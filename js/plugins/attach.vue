<template>
	<div class="attach-form" style="display: none;">
		<div class="attach-attachments scroll-bar">
		
			<div class="attach-attachment" v-for="attach in attachs" >
				
				<div style="display: inline; height: 20px; width: 20px; outline: none" 
					title="新标签页打开">
					<a v-bind:href="attach.url" 
						target="_blank" 
						v-html="getHtml(attach)" >
					</a>
				</div>
				
				<div class="inline" style=" width: 444px; display: inline-block; line-height: 1; word-break: break-all; cursor: pointer; flex: 1; margin: 0px 5px;"
					title="插入"
					v-on:click="onClickPlace(attach)">
					<div style="font-size: 15px; ">
						{{attach.name}} ({{byteConvert(attach.length)}})
					</div>
				</div>
				
				<div v-on:click="onClickRemove(attach)">
					<i title="删除" class="fa fa-trash-o attach-attachment-actions" aria-hidden="true"></i>
				</div>
				
			</div>
			
		</div>
		
		<div class="attach-toolbar">
			<label>上传文件</label>
			<label class="attach-present" style="width: 340px; display: inline;">等待..</label>
			<div class="attach-file-input">
				<input id="attach-file-input-drop" type="file" class="attach-image-file" style="top: -9px;" accept="*/*" multiple="" ></input>
				<button id="attach-shangchuan" class="">上传</button>
			</div>
			
			<div style="float: right; display: inline">
				<button class="attach-button-refresh button">刷新</button>
				<button class="attach-button-close button">关闭</button>
			</div>
		</div>
	
		
	</div>
</template>

<style type="text/css">
	.attach-attachments {
		height: calc(100% - 65px);
		
		border: #0000004d solid 1px;
		border-radius: 4px;
		padding: 0px 2px 1px 2px;
		overflow-y: auto;
		overflow-x: hidden;
	}
	
	.attach-attachment {
		padding: 5px 2px 5px 2px;
		display: flex;
		border-radius: 4px;
	}
	
	.attach-attachment:hover {
		background-color: #cacaca;
	}
	
	.attach-attachment-actions {
		cursor: pointer;
		display: inline-block;
		padding: 2px 3px;
		user-select: none;
	}
	
	.attach-file-input {
		width: 75px;
		height: 32px;
		cursor: pointer;
		margin-left: 10px;
		position: relative;
		display: inline;
	}
	
	.attach-file-input input[type=file] {
		width: 75px;
		height: 32px;
		opacity: 0;
		cursor: pointer;
		background: #000;
		display: inline;
		position: absolute;
		top: 0;
		right: 10;
	}
	
	.attach-file-input button {
		min-width: 75px;
		padding: 7px 10px;
		
		cursor: pointer;
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 3px;
	}
	
	.attach-toolbar {
		margin: 15px 5px;
	}
	
	@media(prefers-color-scheme: dark) {
		.attach-attachments {
			border-color: #ffffff1a !important;
			color: #d4d4d4;
		}
		
		#attach-shangchuan {
			background-color: #515151;
			border-color: #555555;
			color: #d4d4d4;
		}
		
		.attach-attachment:hover {
			background-color: #5f5f5f !important;
		}
		
		.attach-binary-icon {
			color: #d4d4d4;
		}
	}
		
</style>

<script lang="ts">
import Vue from 'vue'
import * as $ from 'jquery'
import 'jquery-ui'
import { stateBar, eventRouter, websocket, fileBrowser } from '..'
import { bubble, getResourceServerUrlHeader, byteConvert } from '../utils'
import { RouteRule } from '../EventRouter';
import { PluginObject } from '../PluginSystem';
import { hye } from '../editor';

interface AttachObject
{
	name: string
	length: number
	url: string
	path: string
	isImage: boolean
}

// https://www.jianshu.com/p/49fb78bca621
function dateFormat(fmt: string, date: Date) 
{
	let ret;
	const opt: any = {
		'Y+': date.getFullYear().toString(),        // 年
		'm+': (date.getMonth() + 1).toString(),     // 月
		'd+': date.getDate().toString(),            // 日
		'H+': date.getHours().toString(),           // 时
		'M+': date.getMinutes().toString(),         // 分
		'S+': date.getSeconds().toString()          // 秒
		// 有其他格式化字符需求可以继续添加，必须转化成字符串
	};
	for (let k in opt) {
		ret = new RegExp('(' + k + ')').exec(fmt);
		if (ret) {
			fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, '0')))
		};
	};
	return fmt;
}

function arrayBufferToBase64(buffer: any)
{
	let binary = '';
	let bytes = new Uint8Array(buffer);
	for (let len = bytes.byteLength, i = 0; i < len; i++)
		binary += String.fromCharCode(bytes[i]);
	return window.btoa(binary);
}

function uploadBinaryFromMemory(binary: any, callback: (filename: string) => void, filename: string)
{
	bubble('aaaaa')

	if(!stateBar.linkstate) {
		bubble('当前已离线，无法进行上传')
		return
	}

	if(eventRouter.isRouteRuleRegistered('file_transfer')) {
		bubble('传输通道被占用，如果没有正在上传的任务请刷新一次')
		return
	}
	
	let display = $('.attach-present')
	let currPosition = 0
	let totalLength = binary.length
	let randomFileName = filename || dateFormat('YYYYmmddHHMMSS', new Date())+'.png'
	let packageSize = 1024*64


	let cb = (message: any, rule: RouteRule) => {
		if(message.sub_state == 'opened' || message.sub_state == 'wrote') {
			let startPoint = currPosition
			let endPoint = Math.min(totalLength, startPoint + packageSize)

			// show process
			display.html(Math.round(startPoint / totalLength * 10000) / 100.00 + '%')

			// transmisstion finished
			if(currPosition >= totalLength) {
				websocket.sendMessage({action:'upload_file', stage:'close_file'})

				display.html('100%')
				callback(randomFileName)
				
				return false // finish
			}
			
			let blob = binary.slice(startPoint, endPoint)
			websocket.sendMessage({
				action: 'upload_file', 
				stage: 'put_content', 
				content: btoa(blob)
			})
						
			currPosition += packageSize
		}
	}

	let routeRule = {
		eventName: 'file_transfer',
		persistent: false,
		callback: cb
	}

	eventRouter.addRouteRule(routeRule)

	websocket.sendMessage({
		action:'upload_file', 
		stage:'open_file', 
		path: fileBrowser.path, 
		attachment: randomFileName 
	})
}

function uploadFilesFromDisk(files: Array<any>, callback: () => void)
{
	if(!stateBar.linkstate) {
		bubble('当前已离线，无法进行上传')
		return
	}
	
	if(eventRouter.isRouteRuleRegistered('file_transfer')) {
		bubble('传输通道被占用，如果没有正在上传的任务请刷新一次')
		return
	}
	
	let display = $('.attach-present')
	// let files = files
	let index = 0
	let currPosition = 0
	let totalLength = 0
	let currFile: any = null
	let fileName = ''
	let reader: any = null
	let packageSize = 1024*64
	
	function next() {
		if(index < files.length) {
			let nextFile = files[index]
			currPosition = 0
			totalLength = nextFile.size
			fileName = nextFile.name
			currFile = nextFile
			reader = new FileReader()
			
			index += 1

			websocket.sendMessage({
				action: 'upload_file', 
				stage: 'open_file', 
				path: fileBrowser.path, 
				attachment: fileName,
			})
		}else{
			display.html('100%  '+index+'/'+files.length)
			callback()
			return false
		}
	}
	

	let cb = (message: any, rule: RouteRule) => {
		if(message.sub_state == 'opened' || message.sub_state == 'wrote') {
			let file = currFile
			let startPoint = currPosition
			let endPoint = Math.min(totalLength, startPoint+packageSize)

			// show process
			display.html(Math.round(startPoint / totalLength*10000) / 100.00 + '%  '+fileName+'('+index+'/'+files.length+')')

			let blob = null
			
			if(file.webkitSlice){
				blob = file.webkitSlice(startPoint, endPoint)
			}else if (file.mozSlice) {
				blob = file.mozSlice(startPoint, endPoint)
			}else {
				blob = file.slice(startPoint, endPoint)
			}

			if(currPosition >= totalLength) {
				websocket.sendMessage({
					action:'upload_file', 
					stage:'close_file'
				})
				if(next() == false)
					return false
				return
			}

			reader.readAsArrayBuffer(blob)
			reader.onload = function(e: any) {
				let ArrayBuffer = e.target.result
				let content = arrayBufferToBase64(ArrayBuffer)
				websocket.sendMessage({
					action: 'upload_file', 
					stage: 'put_content', 
					content: content
				})
			}

			currPosition += packageSize
		}
	}

	let routeRule = {
		eventName: 'file_transfer',
		persistent: false,
		callback: cb
	}

	eventRouter.addRouteRule(routeRule)
	
	if(next() == false)
		eventRouter.unregisterRouteRule(routeRule.eventName)
}

function requestAttachmentList(callback = () => {})
{
	let title = this.dialog.dialog('option', 'title')
	
	this.dialog.dialog({
		title: title + '(正在获取列表)'
	})

	let cb = (message: any, rule: RouteRule) => {
		this.attachs = []
		
		for(let attach of message.attachments) {
			let fileName = attach[0]
			let fileLength = attach[1]
			let path = message.path
			let url = getResourceServerUrlHeader() + path.replace(/\.md$/g, '') + '.assets/' + fileName
			
			let imgExts = new Array('png', 'jpg', 'jpeg', 'bmp', 'gif')
			let extSp = fileName.lastIndexOf('.')
			let ext = extSp != -1? fileName.substring(extSp + 1):''
			let isImage = ext!='' && $.inArray(ext, imgExts) != -1
			
			this.attachs.push({
				name: fileName,
				length: fileLength,
				url: url,
				path: path,
				isImage: isImage
			})
			
		}
		
		this.dialog.dialog({
			title: title
		})
		
		callback()

		return false
	}

	let routeRule = {
		eventName: 'attachment_list',
		persistent: false,
		callback: cb
	}

	eventRouter.addRouteRule(routeRule)
	
	websocket.sendMessage({
		action:'attachment_list', 
		path:fileBrowser.path
	})
}

function create() {
	this.dialog = $('.attach-form').dialog({
		title: '图片和附件',
		width: Math.min(550, document.body.clientWidth - 10),
		height: 450,
		modal: false,
		autoOpen: false,
		// position: { my: 'top', at: 'center top', of: '#container'},
		appendTo: '#' + this.pluginObject.containerId,
		open: (event: any, ui: any) => {
			this.requestAttachmentList()
			if(this.onOpenCallback) {
				this.onOpenCallback()
				this.onOpenCallback = null
			}
		},
		close: (event: any, ui: any) => {
			if(this.onCloseCallback) {
				this.onCloseCallback()
				this.onCloseCallback = null
			}
		},
		create: (event: any, ui: any) => {
			initDialog.bind(this)()
			if(this.onDestroyCallback) {
				this.onDestroyCallback()
				this.onDestroyCallback = null
			}
		}
	})
}

function initDialog() {

	$('#attach-file-input-drop').change((e: any) => {
		console.log(e.currentTarget.files)
		this.uploadFilesFromDisk(e.currentTarget.files, () => {
			this.requestAttachmentList()
		})
	})
	
	$('.attach-button-close').click((e: any) => {
		this.close()
	})
	
	$('.attach-button-refresh').click((e: any) => {
		this.requestAttachmentList(function() {
			bubble('已刷新')
		})
	})

}

function getHtml (attach: AttachObject) {
	if(attach.isImage)
		return '<img src="' + attach.url + '?thub=true" height="32px" width="32px" ></img>'
	return '<i class="attach-binary-icon fa fa-file-o" aria-hidden="true" style="font-size: 20px;" ></i>'
}

function onClickPlace(attach: AttachObject) {
	if(attach.isImage) {
		let dotPos = attach.name.lastIndexOf('.')
		let name = dotPos != -1?  attach.name.substring(0, dotPos):attach.name
		hye.replaceSelection('!['+name+']('+attach.url+')')
	} else {
		hye.replaceSelection('['+attach.name+']('+attach.url+')')
	}
}

function onClickRemove(attach: AttachObject) {
	if(confirm('真的要删除 ' +attach.name+' 吗?')) {
		websocket.sendMessage({
			action:'remove_attachment', 
			path:attach.path, 
			attachment:attach.name
		})
		
		this.requestAttachmentList()
	}
}

function open(callback = () => {}) {
    this.onOpenCallback = callback
    this.dialog.dialog('open')
}

function close(callback = () => {}) {
    this.onCloseCallback = callback
    this.dialog.dialog('close')
}

function destroy(callback = () => {}) {
    this.onDestroyCallback = callback
    this.dialog.dialog('destroy')
}

export default {
	data: function() {
        return {
            pluginObject: null as PluginObject ,
			dialog: null as any,
			attachs: [] as Array<AttachObject>,

			onOpenCallback: null as () => void,
			onCloseCallback: null as () => void,
			onDestroyCallback: null as () => void,
        }
	},
	methods: {
		init: create,
		requestAttachmentList: requestAttachmentList,
		uploadBinaryFromMemory: uploadBinaryFromMemory,
		uploadFilesFromDisk: uploadFilesFromDisk,
		getHtml: getHtml,
		byteConvert: byteConvert,
		onClickPlace: onClickPlace,
		onClickRemove: onClickRemove,
		open: open,
		close: close,
		destroy: destroy,
	}
}
</script>