class ChatClient {
    static SOCKET_PATH = '/talkbox/socket.io';

    constructor() {
        this.ws = null;
        this.chatBox = document.getElementById('chatBox');
        this.usernameInput = document.getElementById('username');
        this.messageInput = document.getElementById('message');
        this.sendButton = document.getElementById('sendButton');

        this.initUIHandlers();
        this.initWebSocket();
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
            this.displayMessages(messages);
        });

        this.ws.on('disconnect', () => {
            // console.log('WebSocket connection closed');
            // Optionally, implement reconnection logic
        });
    }

    sendMessage() {
        const username = this.usernameInput.value;
        const message = this.messageInput.value;
        const msgObj = {username, message};
        this.ws.emit('chat message', msgObj);  // Change this line
        this.messageInput.value = '';
        localStorage.setItem('username', username);
    }

    getColorFromUsername(username) {
        let sum = 0;
        for (let i = 0; i < username.length; i++) {
            sum += username.charCodeAt(i);
        }
        const hue = sum % 360;
        return `hsl(${hue}, 100%, 60%)`; // Bright colors on a black background
    }

    displayMessages(messages) {
        // Input verification
        if (!Array.isArray(messages)) {
            console.error('Invalid input: messages is not an array');
            return;
        }
        // Check if the user is currently at the bottom of the chatBox
        const isAtBottom = this.chatBox.scrollHeight - this.chatBox.clientHeight <= this.chatBox.scrollTop + 1;

        this.chatBox.innerHTML = '';
        // console.log(messages);
        // Display each message
        messages.forEach(({username, message, command}, index) => {
            if (!username || !message) return;

            const color = this.getColorFromUsername(username);
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.style.color = color;

            // Create text nodes to prevent XSS
            const strongElement = document.createElement('strong');
            strongElement.style.color = color;
            strongElement.textContent = `${username}:`;
            messageElement.appendChild(strongElement);

            const textNode = document.createTextNode(` ${message}`);
            messageElement.appendChild(textNode);

            this.chatBox.appendChild(messageElement);

            // If the message is a command, then add a special class
            if (command === 'b' && index === messages.length - 1) {
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
        if (document.hidden) {
            // The tab is not active
            document.title = String.fromCodePoint(0x273D) + String.fromCodePoint(0x273D) + ' New Message ' + String.fromCodePoint(0x273D) + String.fromCodePoint(0x273D);
        } else {
            // The tab is active
            document.title = 'Rylekor TalkBox';
        }
    }

    flashScreen() {
        const parentDiv = document.getElementById('chatBox');
        if (!parentDiv) return;  // Exit if the parent div is not found

        // Store the original background color to restore it later
        const originalBackgroundColor = parentDiv.style.backgroundColor;

        // Assuming userColor is the color you want to alternate with white
        const userColor = this.getColorFromUsername(this.usernameInput.value);  // Assuming this method returns the desired color

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

        this.triggerVibration();
    }

    triggerVibration() {
        if (navigator.vibrate) {  // Check if the Vibration API is supported
            navigator.vibrate(200);
        } else {
            console.warn('Vibration API not supported');
        }
    }
}