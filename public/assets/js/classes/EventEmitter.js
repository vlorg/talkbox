class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        (this.events[event] || (this.events[event] = [])).push(listener);
    }

    emit(event, arg) {
        (this.events[event] || []).slice().forEach(lsn => lsn(arg));
    }
}