class ColorGenerator {
    static getColorFromUserId(userId) {
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
}