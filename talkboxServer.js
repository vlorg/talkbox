const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');

const BUFFER_CAPACITY = 100;
const SERVER_PORT = 3000;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {path: '/talkbox/socket.io'});

app.use('/talkbox', express.static(__dirname + '/public'));

// Set up the circular buffer
const circularBuffer = Array(BUFFER_CAPACITY).fill(null);
let bufferIndex = 0;

// Middleware to capture CF-Connecting-IP header and attach to the socket
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

    // Send recent messages to newly connected client
    const recentMessages = circularBuffer.filter(msg => msg !== null);
    socket.emit('chat message', recentMessages);

    socket.on('disconnect', () => {
        console.log('userId', socket.userId, 'disconnected from IP:', socket.clientIp);
    });

    socket.on('chat message', (msg) => {
        // Append userId to the message
        msg.userId = socket.userId;
        console.log('Updated msg.userId:', msg);
        if (msg.message.startsWith('$')) {
            handleCommand(socket, msg);
        } else {
            // Store the message in the circular buffer
            circularBuffer[bufferIndex] = msg;
            bufferIndex = (bufferIndex + 1) % BUFFER_CAPACITY;
            console.log('Updated circularBuffer:', circularBuffer);

            // Get all non-null messages from the circular buffer
            const recentMessages = circularBuffer.filter(msg => msg !== null);
            console.log('Broadcasting recentMessages:', recentMessages);

            // Broadcast the entire chat log to all connected clients
            io.emit('chat message', recentMessages);
        }
    });
});

function handleCommand(socket, msg) {
    const command = msg.message.slice(1, 2);
    const username = msg.username;
    const timestamp = msg.timestamp;
    const userId = msg.userId;

    console.log({command, username, userId});

    switch (command) {
        case 'c':
            const clearMessageObject = {
                timestamp: timestamp,
                username: username,
                userId: userId,
                message: `---> CLEAR`,
                command: 'c'
            };
            circularBuffer[bufferIndex] = clearMessageObject;
            bufferIndex = (bufferIndex + 1) % BUFFER_CAPACITY;
            circularBuffer.fill(null);
            io.emit('chat message', circularBuffer);
            break;
        case 'b':
            const bongMessageObject = {
                timestamp: timestamp,
                username: username,
                userId: userId,
                message: `---> BONG`,
                command: 'b'
            };
            circularBuffer[bufferIndex] = bongMessageObject;
            bufferIndex = (bufferIndex + 1) % BUFFER_CAPACITY;
            const recentMessages = circularBuffer.filter(msg => msg !== null);
            io.emit('chat message', recentMessages);
            break;

        default:
            console.log(`Unknown command: ${command}`);
    }
}

server.listen(3000, () => {
    console.log('listening on *:' + SERVER_PORT);
});
