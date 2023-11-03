// noinspection JSValidateTypes

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const fs = require('fs').promises;  // Use fs.promises for async operations

const BUFFER_CAPACITY = 100;
const SERVER_PORT = 3000;
const BUFFER_FILE_PATH = './chatBuffer.json';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {path: '/talkbox/socket.io'});

app.use('/talkbox', express.static(__dirname + '/public'));

let isBufferLocked = false;

class MessageBuffer {
    constructor(capacity) {
        this.buffer = Array(capacity).fill(null);
        this.index = 0;
    }

    async init() {
        try {
            const data = await fs.readFile(BUFFER_FILE_PATH, 'utf8');
            const savedBuffer = JSON.parse(data);
            this.buffer = savedBuffer.buffer;
            this.index = savedBuffer.index;
        } catch (err) {
            console.error('Error reading buffer file:', err);
        }
    }

    addMessage(msg) {
        this.buffer[this.index] = msg;
        this.index = (this.index + 1) % this.buffer.length;
        this.syncToFile()
            .catch(err => console.error('Error syncing to file:', err));
    }

    syncToFile() {
        if (isBufferLocked) {
            setTimeout(() => this.syncToFile(), 50);
            return Promise.resolve();  // Return a resolved promise immediately
        }

        isBufferLocked = true;
        return fs.writeFile(BUFFER_FILE_PATH, JSON.stringify({buffer: this.buffer, index: this.index}), 'utf8')
            .finally(() => {
                isBufferLocked = false;  // Ensure the lock is released
            });
    }

    clear() {
        this.buffer.fill(null);
        this.syncToFile();
    }

    getRecentMessages() {
        return this.buffer.filter(msg => msg !== null);
    }
}

let messageBuffer = new MessageBuffer(BUFFER_CAPACITY);

class CommandHandler {
    static handleCommand(socket, msg, buffer) {
        const command = msg.message.slice(1, 2);
        const username = msg.username;
        const timestamp = msg.timestamp;
        const userId = msg.userId;

        switch (command) {
            case '_': // clear the buffer
                buffer.addMessage(createCommandMessage(timestamp, username, userId, 'CLEAR', '_'));
                buffer.clear();
                break;
            case 'b': // send a bong
                buffer.addMessage(createCommandMessage(timestamp, username, userId, 'BONG', 'b'));
                break;
            case 'e':  // send an emote
                const color = msg.message.slice(2);
                buffer.addMessage(createCommandMessage(timestamp, username, userId, color, 'c'));
                break;
            default:
                console.log(`Unknown command: ${command}`);
        }

        const recentMessages = buffer.getRecentMessages();
        io.emit('chat message', recentMessages);
    }
}

function createCommandMessage(timestamp, username, userId, message, command) {
    return {
        timestamp: timestamp,
        username: username,
        userId: userId,
        message: `---> ${message}`,
        command: command
    };
}

function md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}

io.use((socket, next) => {
    const request = socket.request;
    socket.clientIp = request.headers['cf-connecting-ip'] || "Unknown IP";
    socket.userId = md5(socket.clientIp);
    next();
});

io.on('connection', (socket) => {
    console.log('userId', socket.userId, 'connected from IP:', socket.clientIp);
    const recentMessages = messageBuffer.getRecentMessages();
    socket.emit('chat message', recentMessages);

    socket.on('disconnect', () => {
        console.log('userId', socket.userId, 'disconnected from IP:', socket.clientIp);
    });

    socket.on('chat message', (msg) => {
        msg.userId = socket.userId;
        console.log(msg);

        if (msg.message.startsWith('$')) {
            CommandHandler.handleCommand(socket, msg, messageBuffer);
        } else {
            messageBuffer.addMessage(msg);
            const recentMessages = messageBuffer.getRecentMessages();
            io.emit('chat message', recentMessages);
        }
    });
});

(async function initialize() {
    await messageBuffer.init();
    server.listen(SERVER_PORT, () => {
        console.log('listening on *:' + SERVER_PORT);
    });
})();