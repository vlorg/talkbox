// noinspection JSValidateTypes

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const fs = require('fs').promises;  // Use fs.promises for async operations

const BUFFER_CAPACITY = 200;
const SERVER_PORT = 3000;
const BUFFER_FILE_PATH = './chatBuffer.json';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {path: '/talkbox/socket.io'});

app.use('/talkbox', express.static(__dirname + '/public'));

let isBufferLocked = false;

class MessageBuffer {
    constructor(capacity) {
        this.buffer = {};
        this.capacity = capacity;
        this.messageCount = 0;  // counter for the last message index
    }

    async init() {
        try {
            const data = await fs.readFile(BUFFER_FILE_PATH, 'utf8');
            const savedBuffer = JSON.parse(data);
            this.buffer = savedBuffer.buffer;
            this.messageCount = savedBuffer.messageCount;
        } catch (err) {
            console.error('Error reading buffer file:', err);
        }
    }

    addMessage(msg) {
        msg.index = this.messageCount;
        this.buffer[this.messageCount] = msg;
        this.messageCount += 1;
        // remove the oldest message if buffer capacity is reached
        if (this.messageCount > this.capacity) {
            const oldestMessageIndex = this.messageCount - this.capacity;
            delete this.buffer[oldestMessageIndex];
        }
        this.syncToFile()
            .catch(err => console.error('Error syncing to file:', err));
    }

    syncToFile() {
        if (isBufferLocked) {
            setTimeout(() => this.syncToFile(), 50);
            return Promise.resolve();  // Return a resolved promise immediately
        }

        isBufferLocked = true;
        // Directly use this.buffer for writing to file as it's already in the correct order
        return fs.writeFile(BUFFER_FILE_PATH, JSON.stringify({
            buffer: this.buffer,
            messageCount: this.messageCount
        }), 'utf8')
            .finally(() => {
                isBufferLocked = false;  // Ensure the lock is released
            });
    }

    clear() {
        this.buffer = {};  // Reset buffer object
        this.messageCount = 0;  // Reset message count
        this.syncToFile();
    }

    getRecentMessages() {
        // sort the messages by their indices before returning them
        return Object.values(this.buffer).filter(msg => msg !== null).sort((a, b) => a.index - b.index);
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
            case 'c':  // TODO: change the color of the user's name
                const color = `your color is now ${msg.message.slice(2)}! TAH-DAH!`;
                buffer.addMessage(createCommandMessage(timestamp, username, userId, color, 'c'));
                break;
            case 'e':  // send an emote
                const emote = msg.message.slice(2);
                buffer.addMessage(createCommandMessage(timestamp, username, userId, emote, 'e'));
                break;
            default:
                console.log(`Unknown command: ${command}`);
        }

        const recentMessages = buffer.getRecentMessages();
        io.emit('chat message', recentMessages);
    }
}

function createCommandMessage(timestamp, username, userId, message, command) {
    // add an index property to each message
    return {
        index: messageBuffer.messageCount,
        timestamp: timestamp,
        username: username,
        userId: userId,
        message: `--> ${message}`,
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