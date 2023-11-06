class UIHandler {

    static COMMAND_COLOR = 'limegreen';
    static TIME_COLOR = 'grey';
    static MESSAGE_COLOR = 'white';

    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;

        // UI related stuff
        this.chatBox = document.getElementById('chatBox');
        this.usernameInput = document.getElementById('username');
        this.messageInput = document.getElementById('message');
        this.sendButton = document.getElementById('sendButton');
        this.lastUserId = null;
        this.initDateTimeDisplay();
        this.arcadeLoader = new ArcadeLoader();

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

    createColoredTextNode(text, color, isTimestamp = false) {
        const spanElement = document.createElement('span');
        spanElement.style.color = color;
        spanElement.textContent = text;

        // If the node is a timestamp, we won't append it immediately but instead return it
        // for conditional appending based on user interaction.
        if (isTimestamp) {
            spanElement.className = 'timestamp';
            return spanElement;
        }

        return spanElement;
    }

    createColoredHTMLNode(html, color) {
        const spanElement = document.createElement('span');
        spanElement.style.color = color;
        spanElement.innerHTML = html;
        return spanElement;
    }

    displayMessages(messages, timeColor = UIHandler.TIME_COLOR, messageColor = UIHandler.MESSAGE_COLOR) {
        if (!Array.isArray(messages)) {
            console.error('Invalid input: messages is not an array');
            return;
        }

        const isAtBottom = this.isUserAtBottom();

        // Clear current messages
        this.chatBox.innerHTML = '';

        // Iterate over the messages and create their elements
        messages.forEach((messageData, index) => {
            if (this.isValidMessage(messageData)) {
                // Override the message color if it's a command
                let currentMessageColor = messageColor;
                if (messageData.message.startsWith('-->')) {
                    currentMessageColor = UIHandler.COMMAND_COLOR;
                }
                const messageElement = this.createMessageElement(messageData, timeColor, currentMessageColor);
                this.addMessageToChatBox(messageElement);
                this.handleSpecialCommand(messageData, index, messages.length);
            }
        });

        // Maintain scroll position
        this.scrollToBottomIfNeeded(isAtBottom);
    }

    isUserAtBottom() {
        return this.chatBox.scrollHeight - this.chatBox.clientHeight <= this.chatBox.scrollTop + 1;
    }

    isValidMessage({username, message, timestamp}) {
        return username && message && timestamp;
    }

    createMessageElement({username, message, timestamp, userId}, timeColor, messageColor) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.tabIndex = -1;

        const formattedTimestamp = MessageFormatter.formatTimestamp(timestamp);
        const formattedMessage = MessageFormatter.convertLinksToAnchors(message);
        const formattedMessageWithEmojis = MessageFormatter.convertTextToEmojis(formattedMessage);

        const timeTextNode = this.createColoredTextNode(`[${formattedTimestamp}]`, timeColor, true);
        const usernameTextNode = this.createColoredTextNode(`${username}:`, ColorGenerator.getColorFromUserId(userId));
        const messageTextNode = this.createColoredHTMLNode(` ${formattedMessageWithEmojis}`, messageColor);

        messageElement.appendChild(usernameTextNode);
        messageElement.appendChild(messageTextNode);

        this.setupTimestampInteraction(messageElement, timeTextNode);

        return messageElement;
    }

    setupTimestampInteraction(messageElement, timeTextNode) {
        // Add all the interaction event listeners
        const showTimestamp = () => {
            if (!messageElement.contains(timeTextNode)) {
                messageElement.insertBefore(timeTextNode, messageElement.firstChild);
            }
        };

        const hideTimestamp = () => {
            if (messageElement.contains(timeTextNode)) {
                messageElement.removeChild(timeTextNode);
            }
        };

        // Mouse events don't need to be passive
        messageElement.addEventListener('mouseenter', showTimestamp);
        messageElement.addEventListener('mouseleave', hideTimestamp);

        // Touch events should be passive to avoid scroll-blocking warning
        messageElement.addEventListener('touchstart', showTimestamp, {passive: true});
        messageElement.addEventListener('touchend', () => {
            setTimeout(hideTimestamp, 2000);
        }, {passive: true});
    }

    addMessageToChatBox(messageElement) {
        this.chatBox.appendChild(messageElement);
    }

    handleSpecialCommand({userId, command}, index, length) {
        console.log({userId, command, index, length});
        if (command === 'b' && index === length - 1) {
            this.lastUserId = userId;
            this.bCommandReceived = true;
            this.updateTabTitle();
            this.flashScreen();
        }
    }

    scrollToBottomIfNeeded(isAtBottom) {
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
        const originalBackgroundColor = getComputedStyle(parentDiv).backgroundColor;

        // Prepare the parent div for transition
        parentDiv.style.transition = 'background-color 0.5s ease-in-out';

        // Function to trigger the inner flash effect
        const triggerInnerFlash = () => {
            // Define the keyframe for the inner flash animation
            const css = `
            @keyframes innerFlashAnimation {
                0%, 100% { box-shadow: inset 0 0 -5px ${ColorGenerator.getColorFromUserId(this.lastUserId)}; }
                50% { box-shadow: inset 0 0 90px ${ColorGenerator.getColorFromUserId(this.lastUserId)}; }
            }
        
            .innerFlash {
                animation: innerFlashAnimation 0.125s ease-in-out 4;
            }
            `;

            // Insert the style into the document head
            const styleSheet = document.createElement('style');
            styleSheet.type = 'text/css';
            styleSheet.innerText = css;
            document.head.appendChild(styleSheet);

            // Add the innerFlash class to the chatBox to start the effect
            parentDiv.classList.add('innerFlash');

            // Event listener to clean up after the animation
            parentDiv.addEventListener('animationend', () => {
                parentDiv.classList.remove('innerFlash');
                document.head.removeChild(styleSheet);
            });
        };

        // Execute the function to trigger the flash effect
        triggerInnerFlash();


        // Event handler for the end of the transition
        const handleTransitionEnd = () => {
            parentDiv.style.transition = '';
            parentDiv.style.backgroundColor = originalBackgroundColor;
            parentDiv.removeEventListener('transitionend', handleTransitionEnd);
        };

        // Listen for the transition end to restore the original background color
        parentDiv.addEventListener('transitionend', handleTransitionEnd);

        // Uncomment the following line if the vibration feature is needed
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