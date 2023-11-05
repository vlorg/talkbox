class UIHandler {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;

        // UI related stuff
        this.chatBox = document.getElementById('chatBox');
        this.usernameInput = document.getElementById('username');
        this.messageInput = document.getElementById('message');
        this.sendButton = document.getElementById('sendButton');
        this.initDateTimeDisplay();

        // Sanitize inputs
        this.usernameInput.value = this.sanitizeInput(this.usernameInput.value);
        this.messageInput.value = this.sanitizeInput(this.messageInput.value);
        this.sendButton.value = this.sanitizeInput(this.sendButton.value);

        // Bong related stuff
        this.bCommandReceived = false;
        this.updateTabTitle = this.updateTabTitle.bind(this);
        this.flashScreen = this.flashScreen.bind(this);

        // Vibration related stuff
        this.triggerVibration = this.triggerVibration.bind(this);

        // Event Listeners
        document.addEventListener('visibilitychange', () => {
            this.updateTabTitle();
        });
        document.addEventListener('visibilitychange', this.updateTabTitle);

        this.initUIHandlers();
        this.eventEmitter.on('messageSent', this.onMessageSent.bind(this));
    }

    sanitizeInput(input) {
        return input.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    initDateTimeDisplay() {
        this.updateDateTime();  // Update the time initially
        setInterval(this.updateDateTime.bind(this), 1000);  // Then update every second
    }

    updateDateTime() {
        const now = new Date();
        // Convert to Mountain Time
        const mtNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Denver"}));
        const year = mtNow.getFullYear();
        const month = String(mtNow.getMonth() + 1).padStart(2, '0');  // Months are 0-based
        const day = String(mtNow.getDate()).padStart(2, '0');
        const hours = String(mtNow.getHours()).padStart(2, '0');
        const minutes = String(mtNow.getMinutes()).padStart(2, '0');
        const seconds = String(mtNow.getSeconds()).padStart(2, '0');

        // Combine date and time parts
        document.getElementById('header').textContent = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    onSendButtonClick() {
        this.usernameInput.value = this.sanitizeInput(this.usernameInput.value);
        const username = this.usernameInput.value;
        const message = this.messageInput.value;
        this.eventEmitter.emit('sendMessage', {username, message});
    }

    onMessageSent(username) {
        this.usernameInput.value = this.sanitizeInput(this.usernameInput.value);
        this.messageInput.value = '';
        localStorage.setItem('username', username);
    }

    onUsernameInputBlur() {
        this.usernameInput.value = this.sanitizeInput(this.usernameInput.value);
        if (this.usernameInput.value === '') return;
        localStorage.setItem('username', this.usernameInput.value);
    }

    initUIHandlers() {
        this.usernameInput.value = localStorage.getItem('username') || '';

        this.sendButton.addEventListener('click', () => {
            this.onSendButtonClick();
        });

        this.usernameInput.addEventListener('blur', () => {
            this.onUsernameInputBlur();
        });

        this.messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.onSendButtonClick();
            }
        });
    }

    createColoredTextNode(text, color) {
        const spanElement = document.createElement('span');
        spanElement.style.color = color;
        spanElement.textContent = text;
        return spanElement;
    }

    createColoredHTMLNode(html, color) {
        const spanElement = document.createElement('span');
        spanElement.style.color = color;
        spanElement.innerHTML = html;
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

            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';

            // Format the timestamp and message
            const formattedTimestamp = MessageFormatter.formatTimestamp(timestamp);
            const formattedMessage = MessageFormatter.convertLinksToAnchors(message);
            const formattedMessageWithEmojis = MessageFormatter.convertTextToEmojis(formattedMessage);

            // Create the text nodes
            const timeTextNode = this.createColoredTextNode(`[${formattedTimestamp}]`, timeColor);
            const usernameTextNode = this.createColoredTextNode(`${username}:`, ColorGenerator.getColorFromUserId(userId));
            const messageTextNode = this.createColoredHTMLNode(` ${formattedMessageWithEmojis}`, messageColor);

            messageElement.appendChild(timeTextNode);
            messageElement.appendChild(usernameTextNode);
            messageElement.appendChild(messageTextNode);

            this.chatBox.appendChild(messageElement);

            // If the message is a BONG command, then handle client effects
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
            document.title = 'Talkbox';
            this.bCommandReceived = false;  // Reset the flag when the tab is active
        }
    }

    flashScreen() {
        const parentDiv = document.getElementById('chatBox');
        if (!parentDiv) return;  // Exit if the parent div is not found

        // Store the original background color to restore it later
        const originalBackgroundColor = parentDiv.style.backgroundColor;

        // Assuming userColor is the color you want to alternate with white
        const userColor = ColorGenerator.getColorFromUserId(this.usernameInput.value);  // JK it's actually the user's name

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