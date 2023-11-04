class ColorGenerator {
    static getColorFromUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = (hash << 5) - hash + userId.charCodeAt(i);
            hash |= 0;  // Convert to 32-bit integer
        }

        // Convert the hash to a positive integer
        hash = Math.abs(hash);

        // Use the hash to calculate a hue value
        const hue = hash % 360;

        // You might want to tweak these values to get the desired vibrancy
        const saturation = '100%';
        const lightness = '70%';

        return `hsl(${hue}, ${saturation}, ${lightness})`;
    }
}
