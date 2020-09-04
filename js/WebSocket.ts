enum State {
	connecting = 0,
	open = 1,
	closing = 2,
	closed = 3
}

class WebSocketConnection
{
	url: string = ''
	websocket: any = null
	isReconnection: boolean = false

	onOpen = (isReconnection: boolean) => {}
	onMessage = (data: string)  => {}
	onError = () => {}
	onClose = (code: number, reason: string) => {}

	constructor(url = '')
	{
		this.url = url
	}

	sendMessage(message: string|object, asJson = true)
	{
		if(!this.isConnected())
        	throw new Error("The connection of websocket has not been established yet!")
		
		if(asJson)
			this.websocket.send(JSON.stringify(message))
		else
			this.websocket.send(message)
	}

	private startConnect()
	{
		console.log("Websocket is connecting to: "+this.url)

		this.websocket = new WebSocket(this.url)
	
		this.websocket.onopen = () => {
			console.log("websocket has connected")
			this.onOpen(this.isReconnection)
		}
	
		this.websocket.onmessage = (e: any) => {
			this.onMessage(e.data)
		}
	
		this.websocket.onerror = () => {
			console.log("Websocket error");
			this.onError()
		}
	
		this.websocket.onclose = (e: any) => {
			let reason = e.reason
			let code = e.code

			if(code===1006)
				console.log("Websocket has unexpectedly disconnected")
			else
				console.log("Websocket has disconnected")

			this.isReconnection = true

			this.onClose(code, reason)
		}
	}

	setURL(url: string)
	{
		this.url = url
	}

	connect()
	{
		if(!this.isConnected()) {
			this.startConnect()
		}
	}

	disconnect()
	{
		if(this.isConnected()) {
			this.websocket.close()
		}
	}

	isConnected()
	{
		let ws = this.websocket

		return ws!=null && (ws.readyState == State.open || ws.readyState == State.connecting)
	}
	
	getPort()
	{
		let fragment = this.url.split(":")
		
		if(fragment.length==0)
			return -1
		
		if(fragment.length==1)
		{
			if(location.protocol.startsWith("http"))
				return 80
			if(location.protocol.startsWith("https"))
				return 443
			return -1
		}
		
		return parseInt(fragment[fragment.length-1])
	}
}

export default WebSocketConnection