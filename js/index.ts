import {EventRouter, RouteRule} from './DataRouter'
import * as $ from 'jquery'
import WebSocketConnection from './WebSocket'
import Vue from 'vue'
import FileBrowser from './templates/FileBrowser.vue'
import StateBar from './templates/StateBar.vue'
import {MyPluginSystem} from './PluginSystem'
import { CreateElement } from 'vue/types/umd'
import { hye, initHypermd } from './editor'
import { getResourceServerUrlHeader, bubble } from './utils'
import { updateContextMenu } from './contextMenu'
import '../css/dark.css'
import '../css/for-bulma.css'
import '../css/for-content-menu.css'
import '../css/for-hypermd.css'
import '../css/for-jqueryui.css'
import '../css/index.css'
import '../css/scrollbar.css'
import icon from '../icons/paper-file.png'

export let stateBar: any = null
export let fileBrowser: any = null
export let pluginSystem = new MyPluginSystem()
export let websocket = new WebSocketConnection()
export let eventRouter = new EventRouter()

$(function() {
	
	// window.onerror = function(_message, source, lineno, _colno, error) {
	// 	bubble(error+'\n'+source+' '+lineno)
	// }

	setTimeout(function() {
		stateBar.alternateWindow = !stateBar.alternateWindow
	}, 50)

	fileBrowser = new Vue({
		el: "#browser",
		render: (e: CreateElement) => {
			return e(FileBrowser)
		}
	}).$children[0]

	stateBar = new Vue({
		el: "#statebar",
		render: (e: CreateElement) => {
			return e(StateBar)
		}
	}).$children[0]

	setTimeout(function() {
		fileBrowser.updateTitle()
	}, 100)

	initHypermd()
	
	pluginSystem.loadPlugin('auth', function(plugin) {})
	
	pluginSystem.loadPlugin('attach', function(plugin) {})

	pluginSystem.loadPlugin('notify', function(plugin) {})
	
	eventRouter.registerRouteRule('dir_content', true, function(message: any, rule: RouteRule) {
		fileBrowser.a_files = []
		
		for(let v of message.contents) {
			fileBrowser.a_files.push({
				filename: v[0],
				isfile: v[1],
				size: v[2]
			})
		}
		
		updateContextMenu()
	})

	eventRouter.registerRouteRule('read_file', true, function(message: any, rule: RouteRule) {
		function parseImageURL(text: string, path: string) {
			let reg = new RegExp("(?<=\\[.*\\]\\()(?=[^:/]*/.*\\))", "g") // 使用插入的方式，正则表达式匹配的结果的'长度'应该是0
			return text.replace(reg, getResourceServerUrlHeader()+path+"/") // 把本地图片链接转换成网络图片链接，在保存的时候会再转回去
		}

		if(message.success) {
			let content = message.content
			let path = message.path.split("/")

			path = path.slice(0, path.length - 1)
			path = path.join("/")
			
			content = parseImageURL(content, path)
			
			fileBrowser.contentLoaded = true
			stateBar.alternateWindow = false
			
			setTimeout(function() {
				hye.setValue(content) // 加载笔记内容
				fileBrowser.contentModified = false
			}, 50)
		}else{
			fileBrowser.editing = false
			fileBrowser.back()
			alert(message.reason)
		}
	})

	eventRouter.registerRouteRule('file_writen', true, function(message: any, rule: RouteRule) {
		if(!fileBrowser.contentSaving)
			return
			
		fileBrowser.contentSaving = false
		fileBrowser.contentModified = false
		
		fileBrowser.onSavedCallback()
	})

	eventRouter.registerRouteRule('alert', true, function(message: any, rule: RouteRule) {
		alert(message.content) // 显示服务端发来的通知
	})

	eventRouter.registerRouteRule('bubble', true, function(message: any, rule: RouteRule) {
		bubble(message.content, message.time) // 显示服务端发来的消息弹框
	})


	eventRouter.registerRouteRule('authenticated', true, function(message: any, rule: RouteRule) {
		bubble("已登录 "+message.user)
		
		stateBar.keepConnection = true
		stateBar.authenticating = false
		stateBar.user = message.user
	})

	websocketInit()

})


function websocketInit()
{
	websocket = new WebSocketConnection()
	
	websocket.onOpen = function(isReconnection) {
		stateBar.linkstate = true

		if(pluginSystem.isPluginLoaded('auth'))
			pluginSystem.getPlugin('auth').vue.updateState()
		
		authenticate()
		
		if(fileBrowser.a_paths.length == 0)
			websocket.sendMessage({action:"access_path", path: '.'})
	}
	
	websocket.onMessage = function(data) {
		// console.log("date recevied: "+data)
		let message = JSON.parse(data)
		eventRouter.routeMessage(message.action, message)
	}
	
	websocket.onClose = function(code, reason) {
		stateBar.linkstate = false
		
		if(pluginSystem.isPluginLoaded('auth'))
			pluginSystem.getPlugin('auth').vue.updateState()
	
		eventRouter.clearRouteRules()
		
		if (!stateBar.keepConnection)
		{
			bubble("连接已断开", 5000)
		}else{
			bubble("重连失败")
		}

		// 自动重连机制
		if (stateBar.keepConnection)
		{
			let startTime = new Date().getTime() + 5000

			let timer = setInterval(() => {
				let timeDiff = startTime - new Date().getTime()

				if (timeDiff>0)
				{
					stateBar.nextReconnection = timeDiff
				}else{
					stateBar.nextReconnection = 0
					clearInterval(timer)
					websocket.connect()
				}

				fileBrowser.updateTitle()
			}, 200)

		}
	}
}

function authenticate()
{
	let user = $.cookie('user')
	let password = $.cookie('password')
	
	stateBar.authenticating = true
	
	websocket.sendMessage({
		action: "auth", 
		user: user, 
		password: password
	})
}


if(!('WebSocket' in window))
	alert("浏览器不支持WebSocket!")

window.onbeforeunload = function(event: any) {
	if(fileBrowser.contentModified) {
		fileBrowser.back()
		return "记得保存笔记!"
	}
	
	if(websocket.isConnected())
		websocket.disconnect()
}

