import * as $ from 'jquery'
import { bubble } from './utils'

class MyPluginSystem
{
	loadedPlugins: any = {}
	pluginPath: string

	constructor(path: string = 'js/myplugins')
	{
		this.pluginPath = path
	}

	isPluginLoaded(pluginName: string)
	{
		return pluginName in this.loadedPlugins
	}

	getPlugin(pluginName: string)
	{
		return this.isPluginLoaded(pluginName)? this.loadedPlugins[pluginName]: null
	}

	executePlugin(pluginName: string)
	{
		if (this.isPluginLoaded(pluginName)) {
			let plugin = this.getPlugin(pluginName)
			let fun_name = "myplugin_"+pluginName
			let fun = eval(fun_name)
			
			if(typeof(fun) == "function"){
				$.proxy(fun, plugin)()
			}else{
				throw "The function '" + fun_name + "' not found"
			}
		}else{
			throw "The resource '" + pluginName + "' not found"
		}
	}

	loadPlugin(pluginName: string, 
		callback = (_plugin: object) => {}, 
		into = 'body', 
		execute = true )
	{
		if(this.isPluginLoaded(pluginName)) {
			bubble('插件 '+pluginName+' 正在尝试重复加载')
			return
		}

		let path = this.pluginPath + '/' + pluginName + '.js'
		
		let container = document.createElement("div")
		container.id = "myplugin-" + pluginName
		
		let script  = document.createElement("script")
		script.type = "text/javascript"
		script.src  = path
		
		script.onload = () => {
			let plugin = {
				'containerId':  container.id,
				'name': pluginName,
				'manager': this
			}
			
			this.loadedPlugins[pluginName] = plugin

			if(execute)
				this.executePlugin(pluginName)

			callback(plugin)
		}
		
		container.appendChild(script)
		document.querySelector(into).append(container)
	}

	unloadPlugin(pluginName: string)
	{
		let plugin = this.getPlugin(pluginName)
		$(plugin.containerId).remove()
		delete this.loadedPlugins[pluginName]
	}

	loadElement(pluginName: string, element: string, callback = (_plugin: any) => {}, into = '')
	{
		// let node = $(element).filter(":first").prop("tagName").toLowerCase()

		let plugin = this.getPlugin(pluginName)
		let el = $(element)
		let triggered = false
		
		el.attr("onload", () => {
			if(!triggered) {
				triggered = true
				callback(plugin)
			}
		})
		
		if(into=='') {
			$("#"+plugin.containerId).append(el);
		}else{
			$(into).append(el);
		}
	}

}

export default MyPluginSystem