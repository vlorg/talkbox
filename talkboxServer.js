const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const BUFFER_CAPACITY = 100;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {path: '/talkbox/socket.io'});

app.use('/talkbox', express.static(__dirname + '/public'));

// Set up the circular buffer
const circularBuffer = Array(BUFFER_CAPACITY).fill(null);
let bufferIndex = 0;

io.on('connection', (socket) => {
    console.log('a user connected');

    // Send recent messages to newly connected client
    const recentMessages = circularBuffer.filter(msg => msg !== null);
    socket.emit('chat message', recentMessages);

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('chat message', (msg) => {
        console.log(msg);
        if (msg.message.startsWith('$')) {
            handleCommand(socket, msg);
        } else {
            // Store the message in the circular buffer
            circularBuffer[bufferIndex] = msg;
            bufferIndex = (bufferIndex + 1) % BUFFER_CAPACITY;

            // Get all non-null messages from the circular buffer
            const recentMessages = circularBuffer.filter(msg => msg !== null);

            // Broadcast the entire chat log to all connected clients
            // console.log('Broadcasting messages:', recentMessages);
            io.emit('chat message', recentMessages);
        }
    });

});

function handleCommand(socket, msg) {
    const command = msg.message.slice(1, 2);
    const username = msg.username;

    console.log({command, username});

    switch (command) {
        case 'b':
            const bongMessageObject = {
                username: username,
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
    console.log('listening on *:3000');
});
