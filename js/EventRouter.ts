interface RouteRule
{
	eventName: string
	persistent: boolean
	callback: (message: any, rule: RouteRule) => any
}

class EventRouter
{
	private table: Array<RouteRule>

	constructor() {
		this.table = []
	}

	addRouteRule(rule: RouteRule) {
		this.table.push(rule)
	}

	registerRouteRule(eventName: string, 
			persistent: boolean, 
			callback: (message: any, rule: RouteRule) => any)
	{
		this.table.push({
			eventName: eventName,
			persistent: persistent,
			callback: callback
		})
	}

	unregisterRouteRule(eventName: string) {
		let del: Array<any> = []

		for(let index in this.table) {
			let rule = this.table[index]

			if(rule.eventName == eventName) {
				del.push(index)
			}
		}

		for(let d of del) {
			this.table.splice(d, 1)
		}

	}

	getRouteRule(eventName: string) {
		for(let rule of this.table) {
			if(rule.eventName == eventName)
				return rule
		}
		return null
	}

	isRouteRuleRegistered(eventName: string) {
		return this.getRouteRule(eventName)
	}

	clearRouteRules(): void {
		let del: Array<any> = []

		for(let index in this.table) {
			let rule = this.table[index]

			if(!rule.persistent) {
				del.push(index)
			}
		}

		for(let d of del) {
			this.table.splice(d, 1)
		}
	}

	routeMessage(eventName: string, message: any)
	{
		for(let index in this.table) {
			let rule = this.table[index]

			if(rule.eventName == eventName) {
				if(rule.callback != null) {
					if(rule.callback(message, rule) == false) {
						this.unregisterRouteRule(eventName)
					}
				}
			}
		}
	}
}

export {
	RouteRule, 
	EventRouter
}