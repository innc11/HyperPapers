import * as $ from 'jquery'
import { bubble } from './utils'
import Vue from 'vue'
import { CreateElement } from 'vue'

interface PluginObject
{
	containerId: string,
	name: string,
	manager: PluginSystem,
	inited: boolean,
	vue: any,
}

class PluginSystem
{
	private loadedPlugins: any = {}
	private pluginPath: string

	constructor(path: string = './plugins')
	{
		this.pluginPath = path
	}

	isPluginLoaded(pluginName: string)
	{
		return pluginName in this.loadedPlugins
	}

	getPlugin(pluginName: string): PluginObject
	{
		return this.isPluginLoaded(pluginName)? this.loadedPlugins[pluginName]: null
	}

	initPlugin(pluginName: string)
	{
		if (this.isPluginLoaded(pluginName)) {
			let pluginObject = this.getPlugin(pluginName)
			if(pluginObject.inited) {
				throw "The plugin '" + pluginName + "' has already initialized!"
			}
			if('init' in pluginObject.vue)
				pluginObject.vue.init()
		}else{
			throw "The plugin '" + pluginName + "' not loaded yet!"
		}
	}

	loadPlugin(pluginName: string, 
		callback = (_plugin: PluginObject) => {},
		execute = true,
		into = 'body' )
	{
		if(this.isPluginLoaded(pluginName)) {
			bubble('The plugin '+pluginName+' is trying to load repeatedly')
			return
		}

		let path = this.pluginPath + '/' + pluginName + '.vue'

		console.log('loading plugin: ' + path)
		
		let container = document.createElement("div")
		container.id = 'pluginspace-' + pluginName
		
		let slot = document.createElement("div")
		slot.id = container.id + '-slot'

		container.appendChild(slot)
		document.querySelector(into).append(container)

		let pluginTemplate = require(path + '')

		let plugin = new Vue({
			el: '#' + slot.id,
			render: (e: CreateElement) => {
				return e(pluginTemplate.default)
			}
		}).$children[0] as any

		let pluginObject = {
			'containerId':  container.id,
			'name': pluginName,
			'manager': this,
			'inited': false,
			'vue': plugin,
		}

		plugin.pluginObject = pluginObject
			
		this.loadedPlugins[pluginName] = pluginObject
		
		if(execute)
			this.initPlugin(pluginName)

		callback(pluginObject)
	}

	unloadPlugin(pluginName: string)
	{
		if (this.isPluginLoaded(pluginName)) {
			let pluginObject = this.getPlugin(pluginName)

			pluginObject.vue.$destroy()
			$(pluginObject.containerId).remove()
			
			delete this.loadedPlugins[pluginName]
		}else{
			throw "The plugin '" + pluginName + "' not loaded yet!"
		}
		
	}

}

export {
	PluginSystem as MyPluginSystem,
	PluginObject
}