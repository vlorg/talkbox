class MessageFormatter {

    static emojiMap = {
        ':)': '😊',
        ':(': '☹️',
        ':D': '😄',
        // ... other emoji mappings ...
    };

    static convertTextToEmojis(text) {
        const emojiRegex = /(:\)|:\(|:D)/g;
        return text.replace(emojiRegex, (match) => {
            return this.emojiMap[match] || match;
        });
    }

    static formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    static convertLinksToAnchors(text) {
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank">${url}</a>`;
        });
    }
}
