class ChatClient {
    constructor() {
        this.eventEmitter = new EventEmitter();
        this.uiHandler = new UIHandler(this.eventEmitter);
        this.webSocketHandler = new WebSocketHandler(this.eventEmitter, this.uiHandler);
    }
}