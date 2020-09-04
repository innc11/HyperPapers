import * as $ from 'jquery'
import 'jquery-ui'
import { stateBar, fileBrowser, websocket } from '.';
import { bubble } from './utils';

export function updateContextMenu() {
	$.contextMenu('destroy', ".file-item");
	$.contextMenu('destroy', "#filebrowser");
	
	$.contextMenu({
		selector: '.file-item', 
		animation: {duration: 100, show: 'fadeIn', hide: 'fadeOut'},
		callback: function(key: string, _options: any) {
			let isfile = $(this).attr("isfile")!=''
			let path = $(this).attr('path')
			let filename = $(this).attr('filename')
			
			switch(key) {
				case "cut": 
					stateBar.clipboard = path
					stateBar.clipboardMoveMode = true
					break
				case "copy": 
					stateBar.clipboard = path
					stateBar.clipboardMoveMode = false
					break
				case "delete": 
					if(fileBrowser.editing) { bubble("编辑状态下不能删除自己"); break; }
					if(confirm("删除 "+path+" ?")) websocket.sendMessage({"action":"delete_file", "path":path})
					break
				case "rename":
					if(fileBrowser.editing) { bubble("编辑状态下不能进行重命名"); break; }
					let ph = filename
					if(!stateBar.debugMode) {
						let dotPos = ph.lastIndexOf('.')
						if(dotPos != -1) {
							ph = ph.substring(0, dotPos)
						}
					}
					let result = prompt("重命名", ph)
					if(result==null) break 
					if(filename==result) { bubble("文件名未变更!"); break; }
					if(isfile && !result.endsWith(".md")) result += ".md"
					websocket.sendMessage({"action":"rename_file", "path":path, "new_name":result})
					break
			}
		},
		items: {
			"cut": {name: "剪切", icon: "fa-scissors"},
			"copy": {name: "复制", icon: "fa-files-o"},
			"rename": {name: "重命名", icon: "fa-code"},
			"delete": {name: "删除", icon: "delete"},
		}
	});
	
	$.contextMenu({
		selector: '#filebrowser', 
		animation: {duration: 100, show: 'fadeIn', hide: 'fadeOut'},
		callback: function(key: string, _options: any) {
			let folderPath = fileBrowser.folder
			let path = folderPath + (folderPath!=""?"/":"")
			
			switch(key){
				case "create-file":
					let result = prompt("输入文件名", "")
					if(result==null || result=="") break
					if(!result.endsWith(".md")) result += ".md"
					websocket.sendMessage({"action":"create_file", "path":path + result})
					break
				case "create-folder":
					let result2 = prompt("输入文件夹", "")
					if(result==null || result=="") break
					websocket.sendMessage({"action":"create_folder", "path":path + result2})
					break
				case "paste":
					if(stateBar.clipboard=="") { bubble("剪切板是空的"); break; }
					websocket.sendMessage({
						"action": stateBar.clipboardMoveMode? "move_file":"copy_file", 
						"from":stateBar.clipboard, 
						"to":fileBrowser.folder,
					})
					stateBar.clipboard = ''
					break;
			}
		},
		items: {
			"create": {
				name: "创建", 
				icon: "fa-cube",
				items: {
					"create-file": {name: "文件", icon: "fa-file-o"},
					"create-folder": {name: "文件夹", icon: "fa-folder-o"},
				}
			},
			"paste": {name:"粘贴", icon: "fa-clipboard"},
		}
	});
	
}

