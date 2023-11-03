class ChatClient {
    static SOCKET_PATH = '/talkbox/socket.io';

    constructor() {
        this.ws = null;
        this.chatBox = document.getElementById('chatBox');
        this.usernameInput = document.getElementById('username');
        this.messageInput = document.getElementById('message');
        this.sendButton = document.getElementById('sendButton');

        this.bCommandReceived = false;
        this.updateTabTitle = this.updateTabTitle.bind(this);
        this.flashScreen = this.flashScreen.bind(this);

        this.triggerVibration = this.triggerVibration.bind(this);

        this.initUIHandlers();
        this.initWebSocket();

        document.addEventListener('visibilitychange', () => {
            this.updateTabTitle();
        });
        document.addEventListener('visibilitychange', this.updateTabTitle);
    }

    initUIHandlers() {
        this.usernameInput.value = localStorage.getItem('username') || '';


        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        this.usernameInput.addEventListener('blur', () => {
            localStorage.setItem('username', this.usernameInput.value);
        });

        this.messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.sendMessage();
            }
        });
    }

    initWebSocket() {
        this.ws = io({path: ChatClient.SOCKET_PATH});  // Use Socket.IO client to connect

        this.ws.on('connect', () => {
            // console.log('WebSocket connection opened');
        });

        this.ws.on('chat message', (messages) => {
            // console.log('Received messages:', messages);
            this.displayMessages(messages,);
        });

        this.ws.on('disconnect', () => {
            // console.log('WebSocket connection closed');
            // Optionally, implement reconnection logic
        });
    }

    sendMessage() {
        const username = this.usernameInput.value;
        const message = this.messageInput.value;
        const timestamp = Date.now();
        const msgObj = {username, message, timestamp};
        this.ws.emit('chat message', msgObj);
        this.messageInput.value = '';
        localStorage.setItem('username', username);
    }

    getColorFromUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = (hash << 5) - hash + userId.charCodeAt(i);
            hash |= 0;  // Convert to 32-bit integer
        }

        // Ensure a good spread of hue values by using the golden ratio
        const golden_ratio_conjugate = 0.618033988749895;
        const hue = Math.abs(hash * golden_ratio_conjugate % 1 * 360);

        // You might want to tweak these values to get the desired vibrancy
        const saturation = '100%';
        const lightness = '50%';

        return `hsl(${hue}, ${saturation}, ${lightness})`;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    createColoredTextNode(text, color) {
        const spanElement = document.createElement('span');
        spanElement.style.color = color;
        spanElement.textContent = text;
        return spanElement;
    }

    displayMessages(messages, timeColor = 'grey', messageColor = 'white') {
        // Input verification
        if (!Array.isArray(messages)) {
            console.error('Invalid input: messages is not an array');
            return;
        }
        // Check if the user is currently at the bottom of the chatBox
        const isAtBottom = this.chatBox.scrollHeight - this.chatBox.clientHeight <= this.chatBox.scrollTop + 1;

        this.chatBox.innerHTML = '';
        // Display each message
        messages.forEach((
            {
                username,
                message,
                command,
                timestamp,
                userId
            }, index) => {
            if (!username || !message || !timestamp) return;

            const formattedTimestamp = this.formatTimestamp(timestamp);
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';


            const timeTextNode = this.createColoredTextNode(`[${formattedTimestamp}] `, timeColor);
            const usernameTextNode = this.createColoredTextNode(`${username}:`, this.getColorFromUserId(userId));
            const messageTextNode = this.createColoredTextNode(` ${message}`, messageColor);

            messageElement.appendChild(timeTextNode);
            messageElement.appendChild(usernameTextNode);
            messageElement.appendChild(messageTextNode);

            this.chatBox.appendChild(messageElement);

            // If the message is a command, then handle client effects
            if (command === 'b' && index === messages.length - 1) {
                this.bCommandReceived = true;
                this.updateTabTitle();
                this.flashScreen();
            }
            this.updateTabTitle();
        });

        // If the user was already at the bottom, then scroll to the new bottom position
        if (isAtBottom) {
            this.chatBox.scrollTop = this.chatBox.scrollHeight - this.chatBox.clientHeight;
        }
    }

    updateTabTitle() {
        if (document.hidden && this.bCommandReceived) {
            // The tab is not active and a 'b' command has been received
            document.title = String.fromCodePoint(0x273D)
                + String.fromCodePoint(0x273D)
                + ' New Message '
                + String.fromCodePoint(0x273D)
                + String.fromCodePoint(0x273D);
        } else {
            // The tab is active or no 'b' command has been received
            document.title = 'Rylekor Talkbox';
            this.bCommandReceived = false;  // Reset the flag when the tab is active
        }
    }

    flashScreen() {
        const parentDiv = document.getElementById('chatBox');
        if (!parentDiv) return;  // Exit if the parent div is not found

        // Store the original background color to restore it later
        const originalBackgroundColor = parentDiv.style.backgroundColor;

        // Assuming userColor is the color you want to alternate with white
        const userColor = this.getColorFromUserId(this.usernameInput.value);  // JK it's actually the user's name

        // Define the CSS for the flash animation
        const css = `
        @keyframes flashAnimation {
            0% { background-color: ${userColor}; }
            25% { background-color: black; }
            50% { background-color: ${userColor}; }
            75% { background-color: black; }
            100% { background-color: ${userColor}; }
        }

        .flash {
            animation: flashAnimation 0.5s forwards;
        }
    `;

        // Create a stylesheet element and append it to the head
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = css;
        document.head.appendChild(styleSheet);

        // Apply the flash class to the parent div to start the animation
        parentDiv.classList.add('flash');

        // Define a function to handle the animationend event
        function handleAnimationEnd() {
            parentDiv.classList.remove('flash');
            document.head.removeChild(styleSheet);
            // Restore the original background color
            parentDiv.style.backgroundColor = originalBackgroundColor;

            // Remove the animationend event listener
            parentDiv.removeEventListener('animationend', handleAnimationEnd);
        }

        // Add the animationend event listener
        parentDiv.addEventListener('animationend', handleAnimationEnd);

        // this.triggerVibration();  // TODO: Check current best practices for vibration API
    }

    triggerVibration() {
        if (navigator.vibrate) {  // Check if the Vibration API is supported
            navigator.vibrate(200);
        } else {
            console.warn('Vibration API not supported');
        }
    }
}