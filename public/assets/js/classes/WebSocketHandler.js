class WebSocketHandler {
    SOCKET_PATH = '/talkbox/socket.io';

    constructor(eventEmitter, uiHandler) {
        this.eventEmitter = eventEmitter;
        this.uiHandler = uiHandler;
        this.eventEmitter.on('sendMessage', this.sendMessage.bind(this));
        this.ws = null;
        this.initWebSocket();
    }

    initWebSocket() {
        this.ws = io({path: this.SOCKET_PATH});  // Use Socket.IO client to connect

        this.ws.on('connect', () => {
            // console.log('WebSocket connection opened');
        });

        this.ws.on('chat message', (messages) => {
            // console.log('Received messages:', messages);
            this.uiHandler.displayMessages(messages);
        });

        this.ws.on('disconnect', () => {
            // console.log('WebSocket connection closed');
            // Optionally, implement reconnection logic
        });
    }

    sendMessage({username, message}) {
        const timestamp = Date.now();
        const msgObj = {username, message, timestamp};
        this.ws.emit('chat message', msgObj);
        this.eventEmitter.emit('messageSent', username);
    }

}