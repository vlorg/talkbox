/*
 * Marbles.js
 * Copyright (c) vlorg <vlorg@rylekor.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

class ButtonManager {
    static BUTTON_COLORS = ['#793c13', '#008000', '#a96600', '#f35c53', '#800080', '#4A9AFF'];
    static VIBRATION_TIME = 10;

    constructor(ctx, buttonAreaHeight) {
        this.ctx = ctx;
        this.buttonAreaHeight = buttonAreaHeight;
        this.buttons = [];
        this.initializeButtons();
        this.currentlyPressedButtonIndex = null;
    }

    initializeButtons() {
        const numButtonsPerRow = 6;
        const buttonWidth = this.ctx.canvas.width / numButtonsPerRow;
        const buttonHeight = this.buttonAreaHeight / 2;

        for (let i = 0; i < numButtonsPerRow * 2; i++) {
            const x = (i % numButtonsPerRow) * buttonWidth;
            const y = Math.floor(i / numButtonsPerRow) * buttonHeight;
            const baseColor = ButtonManager.BUTTON_COLORS[i % numButtonsPerRow];
            const color = i < numButtonsPerRow ? this.lightenColor(baseColor, 40) : baseColor;

            this.buttons.push({
                x, y,
                width: buttonWidth,
                height: buttonHeight,
                color,
                originalColor: color,
                originalWidth: buttonWidth,
                originalHeight: buttonHeight,
                originalX: x,
                originalY: y
            });
        }
    }


    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = ((num >> 8) & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
    }

    renderButtons() {
        const labels = ['Gravity', 'Friction', 'Radius', 'Mass', 'Attract', 'Repel'];
        const textColor = '#212121'; // Dark gray text
        const font = 'bold 12px Arial'; // Set the font size and style

        // Draw buttons with 3D bevel effect
        this.buttons.forEach((button, index) => {
            // Draw button
            this.ctx.fillStyle = button.color;
            this.ctx.fillRect(button.x, button.y, button.width, button.height);

            // Draw 3D bevel effect
            this.ctx.strokeStyle = this.lightenColor(button.color, 20);
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(button.x, button.y, button.width, button.height);
            this.ctx.strokeStyle = this.lightenColor(button.color, -20);
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(button.x + 2, button.y + 2, button.width - 4, button.height - 4);

            // Draw text label
            this.ctx.fillStyle = textColor;
            this.ctx.font = font;
            let text = labels[index % labels.length];
            text += index < labels.length ? " +" : " -"; // Append "+" for top buttons, "-" for bottom buttons
            const textWidth = this.ctx.measureText(text).width;
            const x = button.x + (button.width - textWidth) / 2;
            const y = button.y + (button.height + 8) / 2; // 8 is approximately the height of the text in pixels
            this.ctx.fillText(text, x, y);

            // Redraw the currently pressed button to make it appear on top
            if (this.currentlyPressedButtonIndex !== null) {
                const button = this.buttons[this.currentlyPressedButtonIndex];
                this.ctx.fillStyle = button.color;
                this.ctx.fillRect(button.x, button.y, button.width, button.height);
                this.drawText(button, this.currentlyPressedButtonIndex); // Redraw text
            }
        });
    }

    drawText(button, index) {
        const labels = ['Gravity', 'Friction', 'Radius', 'Mass', 'Attract', 'Repel'];
        const textColor = '#212121';
        const font = 'bold 14px Arial';
        this.ctx.fillStyle = textColor;
        this.ctx.font = font;
        let text = labels[index % labels.length];
        text += index < labels.length ? " +" : " -";
        const textWidth = this.ctx.measureText(text).width;
        const x = button.x + (button.width - textWidth) / 2;
        const y = button.y + (button.height + 8) / 2;
        this.ctx.fillText(text, x, y);
    }

    handleButtonClick(event) {
        const x = event.clientX;
        const y = event.clientY;
        this.buttons.forEach((button, index) => {
            if (x > button.x && x < button.x + button.width && y > button.y && y < button.y + button.height) {
                // Haptic feedback: Vibration
                if (navigator.vibrate) {
                    navigator.vibrate(ButtonManager.VIBRATION_TIME);
                }

                // Cancel any existing timeout for this button
                if (button.timeoutId) {
                    clearTimeout(button.timeoutId);
                }

                // Store original dimensions and coordinates
                const originalWidth = button.width;
                const originalHeight = button.height;
                const originalX = button.x;
                const originalY = button.y;

                // Visual feedback: Change color
                button.color = this.lightenColor(button.originalColor, 20);

                // Mark this button as currently pressed
                this.currentlyPressedButtonIndex = index;

                // Enlarge the button from the center
                button.width *= 1.1;
                button.height *= 1.1;
                button.x -= (button.width * 0.1) / 2;
                button.y -= (button.height * 0.1) / 2;

                // Redraw the buttons
                this.renderButtons();

                // Restore original color, size, and position after 100ms
                button.timeoutId = setTimeout(() => {
                    button.color = button.originalColor;
                    button.width = originalWidth;
                    button.height = originalHeight;
                    button.x = originalX;
                    button.y = originalY;
                    this.renderButtons();
                    button.timeoutId = null;  // Clear the timeout ID
                }, 100);

                this.userInputManager.handleButtonAction(index);
            }
        });
    }

    handleButtonRelease() {
        if (this.currentlyPressedButtonIndex !== null) {
            const button = this.buttons[this.currentlyPressedButtonIndex];

            // Haptic feedback: Vibration
            if (navigator.vibrate) {
                navigator.vibrate(ButtonManager.VIBRATION_TIME);
            }

            // Clear any existing timeout for this button
            if (button.timeoutId) {
                clearTimeout(button.timeoutId);
                button.timeoutId = null;
            }

            // Restore original dimensions and coordinates
            button.width = button.originalWidth;
            button.height = button.originalHeight;
            button.x = button.originalX;
            button.y = button.originalY;
            button.color = button.originalColor;

            // Reset the currently pressed button index
            this.currentlyPressedButtonIndex = null;

            // Redraw the buttons
            this.renderButtons();
        }
    }

    setUserInputManager(userInputManager) {
        this.userInputManager = userInputManager;
    }
}

class CanvasManager {
    canvas;
    buttonAreaHeight;

    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.canvasContainer = document.getElementById(containerId);
        this.resizeCanvas();
        window.addEventListener('resize', this.debounce(() => this.resizeCanvas(), 100));
    }

    debounce(func, delay = Config.debounceDelay) {
        let debounceTimer;
        return function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, arguments), delay);
        };
    }

    resizeCanvas() {
        this.canvas.width = this.canvasContainer.clientWidth;
        this.canvas.height = this.canvasContainer.clientHeight;
        this.buttonAreaHeight = this.canvas.height * 0.08; // 8% of total canvas height
    }

    getButtonAreaHeight() {
        return this.buttonAreaHeight;
    }

    getContext() {
        return this.canvas.getContext('2d');
    }
}

class Circle {
    constructor(x, y, radius, color, mass = 1) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = {x: 0, y: 0};
        this.acceleration = {x: 0, y: 0};
        this.mass = mass;
    }

    render(ctx) {
        // Draw the main circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class CircleManager {
    circles;

    constructor() {
        this.circles = [];
    }

    addCircle(circle) {
        if (this.circles.length >= Config.maxCircles) {
            this.circles.shift();
        }
        this.circles.push(circle);
        // console.log("Total circles: " + this.circles.length);
    }

    addRandomCircle(x, y) {
        const minRadius = 1;
        const maxRadius = Config.maxRadius;
        const radius = Config.getRandomRadius(minRadius, maxRadius);

        // Make mass proportional to the square of the radius, scaled by Config.maxMass
        const mass = Math.pow(radius, 2) * Config.maxMass;

        // Set color based on mass
        const color = Config.getColorByMass(mass);

        const circle = new Circle(x, y, radius, color, mass);
        this.addCircle(circle);
    }

    updateSuperGravityPoint(x, y, distanceMultiplier) {
        // console.log("updateSuperGravityPoint called");
        const superGravityPoint = Config.gravityPoints[0];
        if (x === null || y === null) {
            superGravityPoint.mass = 0;  // Disable gravity
        } else {
            superGravityPoint.x = x;
            superGravityPoint.y = y;
            superGravityPoint.mass = Config.maxGravityPointMass * distanceMultiplier;
        }
        // console.log("Updating super gravity point with x:", x, "y:", y, "distanceMultiplier:", distanceMultiplier);
    }

    renderCircles(ctx) {
        for (const circle of this.circles) {
            circle.render(ctx);
        }
    }
}

class Game {
    static STATES = {
        INIT: 'INIT',
        RUNNING: 'RUNNING',
        PAUSED: 'PAUSED',
        STOPPED: 'STOPPED'
    };

    constructor(ctx, circleManager, buttonAreaHeight, buttonManager, userInputManager) {
        this.currentState = Game.STATES.INIT;
        this.ctx = ctx;
        this.gameField = new GameField(ctx.canvas.width, ctx.canvas.height, buttonAreaHeight);
        this.buttonManager = buttonManager;
        this.userInputManager = userInputManager;
        this.buttonUpdateCounter = 0;
        this.buttonUpdateThreshold = 8;
        this.physics = Physics.getInstance();
        this.circleManager = circleManager;
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
    }

    setState(newState) {
        this.currentState = newState;
    }

    gameLoop(timestamp) {
        if (this.currentState === Game.STATES.RUNNING) {
            const deltaTime = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;
            this.updatePhysics(deltaTime);
            this.render();

            if (this.userInputManager && this.userInputManager.heldButtonIndex !== null) {
                this.buttonUpdateCounter++;
                if (this.buttonUpdateCounter >= this.buttonUpdateThreshold) {
                    this.userInputManager.updateHeldButton();
                    this.buttonUpdateCounter = 0;
                }
            }

        } else if (this.currentState === Game.STATES.PAUSED) {
            // Handle paused state if needed, e.g., show a pause menu
        } else if (this.currentState === Game.STATES.STOPPED) {
            // Handle stopped state if needed, e.g., show a game over screen
            return; // Exit the game loop
        }

        requestAnimationFrame(this.gameLoop);
    }

    updatePhysics(deltaTime) {
        const circles = this.circleManager.circles;
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                this.physics.applyAttraction(circles[i], circles[j], deltaTime);
                this.physics.applyRepulsion(circles[i], circles[j], deltaTime);
            }
            this.physics.applyGravity(circles[i], deltaTime, Config.gravityPoints);
            this.physics.applyFriction(circles[i], deltaTime);
            this.physics.limitSpeed(circles[i], Config.maxSpeed);
            this.physics.updatePosition(circles[i], deltaTime);
        }
        this.gameField.constrainCircles(circles);
        this.resolveCollisions(circles);
    }

    resolveCollisions(circles) {
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                const circle1 = circles[i];
                const circle2 = circles[j];

                const dx = circle2.x - circle1.x;
                const dy = circle2.y - circle1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const overlap = circle1.radius + circle2.radius - distance;

                if (overlap > 0) {
                    // Collision detected, resolve it
                    const angle = Math.atan2(dy, dx);

                    // Calculate the total mass
                    const totalMass = circle1.mass + circle2.mass;

                    // Calculate how much each circle should move (inverse mass proportion)
                    const moveAway1 = (circle2.mass / totalMass) * overlap;
                    const moveAway2 = (circle1.mass / totalMass) * overlap;

                    // Move circles out of collision
                    circle1.x -= moveAway1 * Math.cos(angle);
                    circle1.y -= moveAway1 * Math.sin(angle);
                    circle2.x += moveAway2 * Math.cos(angle);
                    circle2.y += moveAway2 * Math.sin(angle);

                    if (distance < circle1.radius + circle2.radius) {
                        // Collision detected, resolve it
                        const angle = Math.atan2(dy, dx);
                        const speed1 = Math.sqrt(circle1.velocity.x ** 2 + circle1.velocity.y ** 2);
                        const speed2 = Math.sqrt(circle2.velocity.x ** 2 + circle2.velocity.y ** 2);

                        const direction1 = Math.atan2(circle1.velocity.y, circle1.velocity.x);
                        const direction2 = Math.atan2(circle2.velocity.y, circle2.velocity.x);

                        const velocity1 = speed1 * Math.cos(direction1 - angle);
                        const velocity2 = speed2 * Math.cos(direction2 - angle);

                        const totalMass = circle1.mass + circle2.mass;

                        const velocity1Final = ((circle1.mass - circle2.mass) * velocity1 + 2 * circle2.mass * velocity2) / totalMass;
                        const velocity2Final = ((circle2.mass - circle1.mass) * velocity2 + 2 * circle1.mass * velocity1) / totalMass;

                        circle1.velocity.x = Math.cos(angle) * velocity1Final + Math.cos(angle + Math.PI / 2) * (speed1 * Math.sin(direction1 - angle));
                        circle1.velocity.y = Math.sin(angle) * velocity1Final + Math.sin(angle + Math.PI / 2) * (speed1 * Math.sin(direction1 - angle));
                        circle2.velocity.x = Math.cos(angle) * velocity2Final + Math.cos(angle + Math.PI / 2) * (speed2 * Math.sin(direction2 - angle));
                        circle2.velocity.y = Math.sin(angle) * velocity2Final + Math.sin(angle + Math.PI / 2) * (speed2 * Math.sin(direction2 - angle));
                    }
                }
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        buttonManager.renderButtons();
        this.circleManager.renderCircles(this.ctx);
    }

    start() {
        this.setState(Game.STATES.RUNNING);
        requestAnimationFrame(this.gameLoop);
    }

    pause() {
        this.setState(Game.STATES.PAUSED);
    }

    stop() {
        this.setState(Game.STATES.STOPPED);
    }
}

class GameField {
    constructor(width, height, buttonAreaHeight) {
        this.width = width;
        this.height = height;
        this.buttonAreaHeight = buttonAreaHeight;
    }

    constrainCircle(circle) {
        if (circle.x - circle.radius < 0 || circle.x + circle.radius > this.width) {
            circle.velocity.x = -circle.velocity.x;
            circle.x = Math.min(Math.max(circle.radius, circle.x), this.width - circle.radius);
        }

        if (circle.y - circle.radius < this.buttonAreaHeight || circle.y + circle.radius > this.height) {
            circle.velocity.y = -circle.velocity.y;
            circle.y = Math.min(Math.max(this.buttonAreaHeight + circle.radius, circle.y), this.height - circle.radius);
        }
    }

    constrainCircles(circles) {
        circles.forEach(circle => this.constrainCircle(circle));
    }
}

class GravityPoint {
    constructor(x, y, mass) {
        this.x = x;
        this.y = y;
        this.mass = mass;
    }
}

class Physics {
    constructor() {
        if (Physics.instance) {
            return Physics.instance;
        }
        Physics.instance = this;
        this.friction = Config.maxFriction;
        this.attractionConstant = Config.maxAttraction;
        this.repulsionConstant = Config.maxRepulsion;
    }

    static getInstance() {
        if (!Physics.instance) {
            Physics.instance = new Physics();
        }
        return Physics.instance;
    }

    updatePosition(object, deltaTime) {
        object.x += object.velocity.x * deltaTime * 10;
        object.y += object.velocity.y * deltaTime * 10;
    }

    updateVelocity(object, acceleration, deltaTime) {
        object.velocity.x += acceleration.x * deltaTime;
        object.velocity.y += acceleration.y * deltaTime;
    }

    limitSpeed(object, maxSpeed = Config.maxSpeed) {
        const speed = Math.sqrt(object.velocity.x ** 2 + object.velocity.y ** 2);

        if (speed > maxSpeed) {
            const ratio = maxSpeed / speed;
            object.velocity.x *= ratio;
            object.velocity.y *= ratio;
        }
    }

    applyGravity(object, deltaTime, gravityPoints) {
        // Apply gravity from each gravity point
        for (const point of gravityPoints) {
            const dx = point.x - object.x;
            const dy = point.y - object.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Avoid division by zero and self-gravity
            if (distance === 0) continue;

            const force = (point.mass * object.mass) / (distance * distance);
            const acceleration = force / object.mass;

            const ax = (dx / distance) * acceleration;
            const ay = (dy / distance) * acceleration;

            object.velocity.x += ax * deltaTime;
            object.velocity.y += ay * deltaTime;
        }
    }

    applyFriction(object, deltaTime) {
        this.friction = Config.maxFriction;
        object.velocity.x *= 1 - this.friction * deltaTime;
        object.velocity.y *= 1 - this.friction * deltaTime;
    }

    applyAttraction(object1, object2, deltaTime) {
        this.attractionConstant = Config.maxAttraction;
        const dx = object2.x - object1.x;
        const dy = object2.y - object1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        const force = this.attractionConstant * object1.mass * object2.mass / (distance * distance);
        const forceX = force * dx / distance;
        const forceY = force * dy / distance;

        object1.velocity.x += forceX * deltaTime / object1.mass;
        object1.velocity.y += forceY * deltaTime / object1.mass;
        object2.velocity.x -= forceX * deltaTime / object2.mass;
        object2.velocity.y -= forceY * deltaTime / object2.mass;
    }

    applyRepulsion(object1, object2, deltaTime) {
        this.repulsionConstant = Config.maxRepulsion;
        const dx = object2.x - object1.x;
        const dy = object2.y - object1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        const force = this.repulsionConstant * object1.mass * object2.mass / (distance * distance);
        const forceX = force * dx / distance;
        const forceY = force * dy / distance;

        object1.velocity.x -= forceX * deltaTime / object1.mass;
        object1.velocity.y -= forceY * deltaTime / object1.mass;
        object2.velocity.x += forceX * deltaTime / object2.mass;
        object2.velocity.y += forceY * deltaTime / object2.mass;
    }
}

class UserInputManager {
    constructor(canvas, circleManager, buttonAreaHeight) {
        this.canvas = canvas;
        this.circleManager = circleManager;
        this.buttonAreaHeight = buttonAreaHeight;
        this.isDragging = false;
        this.lastTouchTime = 0;
        this.frameCount = 0;
        this.tapTimes = [];
        this.heldButtonIndex = null;
        this.initialPressDelay = 100;
        this.initialPressTimer = null;
        this.holdInterval = null;

        // Unified event handlers for touch and mouse events
        this.canvas.addEventListener('touchstart', (event) => this.handleGenericStart(event));
        this.canvas.addEventListener('touchmove', (event) => this.handleGenericDrag(event));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

        this.canvas.addEventListener('mousedown', (event) => this.handleGenericStart(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleGenericDrag(event));
        this.canvas.addEventListener('mouseup', () => this.handleTouchEnd());

        window.addEventListener('deviceorientation', (event) => this.handleTilt(event));

        // Disable browser's pull-to-refresh gesture
        document.addEventListener('touchmove', function (event) {
            if (event.scale !== 1) {
                event.preventDefault();
            }
        }, {passive: false});
    }

    // Normalize event object for touch and mouse events
    normalizeEvent(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        return {clientX: x, clientY: y};
    }

    handleGenericStart(event) {
        const normalizedEvent = this.normalizeEvent(event);
        const y = normalizedEvent.clientY;

        if (event.touches && event.touches.length === 4) {
            this.handleFourFingerTap(event);
            return;
        }

        if (y <= this.buttonAreaHeight) {
            this.buttonManager.handleButtonClick(normalizedEvent);
            this.holdInterval = setInterval(() => {
                this.handleButtonAction(this.heldButtonIndex);
            }, this.initialPressDelay);
        } else {
            this.handleMultipleTaps(event);
            this.startDragging(event);
        }
    }

    handleGenericDrag(event) {
        if (!this.isDragging) return;

        this.frameCount++;
        if (this.frameCount % 2 === 0) {
            const normalizedEvent = this.normalizeEvent(event);
            this.circleManager.addRandomCircle(normalizedEvent.clientX, normalizedEvent.clientY);
        }
    }

    setButtonManager(buttonManager) {
        this.buttonManager = buttonManager;
    }

    createRandomCircle(event, tapCount = 1) {
        const normalizedEvent = this.normalizeEvent(event);
        const x = normalizedEvent.clientX;
        const y = normalizedEvent.clientY;

        if (y > this.buttonAreaHeight) {
            for (let i = 0; i < tapCount; i++) {
                this.circleManager.addRandomCircle(x, y);
            }
        }
    }

    startDragging(event) {
        let y;

        if (event.touches) {  // Touch event
            y = event.touches[0].clientY;
        } else {  // Mouse event
            y = event.clientY;
        }

        if (y > this.buttonAreaHeight) {
            this.isDragging = true;
        }
    }

    drag(event) {
        if (!this.isDragging) return;

        this.frameCount++;
        if (this.frameCount % 2 === 0) {
            const touch = event.touches[0];
            this.circleManager.addRandomCircle(touch.clientX, touch.clientY);
        }
    }

    stopDragging() {
        this.isDragging = false;
        this.frameCount = 0;
    }

    updateHeldButton() {
        if (this.initialPressTimer === null) {
            this.handleButtonAction(this.heldButtonIndex);
        }
    }

    handleMultipleTaps(event) {
        if (this.isDragging) {
            return; // Exit the function if dragging is in progress
        }

        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTouchTime;

        if (tapLength < 200 && tapLength > 0) {
            this.tapCount++;
        } else {
            this.tapCount = 1; // Reset tap count if time between taps is too long
        }

        this.lastTouchTime = currentTime;
        if (tapLength > 0 && this.tapCount > 1) {  // Added this.tapCount > 1 condition
            this.createRandomCircle(event, this.tapCount * 10);
        }
    }

    handleFourFingerTap(event) {
        if (event.touches.length === 4) {
            location.reload();
        }
    }

    handleTouchEnd() {
        this.buttonManager.handleButtonRelease();
        this.stopDragging();
        this.heldButtonIndex = null;
        if (this.holdInterval) {  // Clear the interval when the button is released
            clearInterval(this.holdInterval);
            this.holdInterval = null;
        }
    }

    handleTilt(event) {
        // console.log("handleTilt called");
        const DEAD_ZONE = 3;
        const RADIUS_MULTIPLIER = 10;
        const MASS_EXPONENT = 0.5;  // Controls the rate of mass increase

        const {beta, gamma} = event;

        // Check if the device supports orientation events
        if (beta === null && gamma === null) {
            // console.log("Orientation not supported");  // Debugging line

            // Set the gravity point to the 180-degree location on the circle
            const x = this.canvas.width / 2;
            const y = this.canvas.height / 2 + (this.canvas.height / 2 * RADIUS_MULTIPLIER);
            const distanceMultiplier = Config.maxDistanceMultiplier;

            // Update the gravity point
            this.circleManager.updateSuperGravityPoint(x, y, distanceMultiplier);
            return;
        }

        // If the phone is nearly flat, disable gravity
        if (Math.abs(beta) < DEAD_ZONE && Math.abs(gamma) < DEAD_ZONE) {
            // console.log("Gravity disabled");
            this.circleManager.updateSuperGravityPoint(null, null, 0);
            return;
        }

        // Normalize the beta and gamma values to a range of [-1, 1]
        const normalizedBeta = this.map(beta, -180, 180, -1, 1);
        const normalizedGamma = this.map(gamma, -90, 90, -1, 1);

        // Calculate the tilt magnitude
        const tiltMagnitude = Math.sqrt(normalizedBeta ** 2 + normalizedGamma ** 2);

        // Use a power function to control the rate of mass increase
        const distanceMultiplier = Math.pow(this.map(tiltMagnitude, 0, 1, 1, Config.maxGravityPointMass), MASS_EXPONENT);

        // Calculate the radius of the circle
        const radius = RADIUS_MULTIPLIER * (this.canvas.height / 2);

        // Calculate the angle based on the tilt
        const angle = Math.atan2(normalizedBeta, normalizedGamma);

        // Calculate the new x and y positions for the gravity point
        const x = this.canvas.width / 2 + radius * Math.cos(angle);
        const y = this.canvas.height / 2 + radius * Math.sin(angle);

        // console.log("Calculated x=" + x + ", y=" + y + ", distanceMultiplier=" + distanceMultiplier);  // Debug log

        // Update the gravity point
        this.circleManager.updateSuperGravityPoint(x, y, distanceMultiplier);
    }

    // Utility function to map a value from one range to another
    map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }

    handleButtonAction(index) {
        const FRICTION_INCREMENT = 1;
        const RADIUS_INCREMENT = 1;
        const RADIUS_MULTIPLIER = 10;
        const MASS_INCREMENT = 5;
        const POINT_MASS_INCREMENT = 500000;
        const ATTRACTION_INCREMENT = 5;
        const REPULSION_INCREMENT = 5;

        let propertyName = '';
        let oldValue = 0;
        let newValue = 0;
        this.heldButtonIndex = index;

        const increment = index < 6;  // Top buttons are indices 0-5
        switch (Math.floor(index % 6)) {  // Use modulo to group pairs
            case 0: // GravityPointMass
                propertyName = 'maxGravityPointMass';
                oldValue = Config.maxGravityPointMass;
                Config.setMaxGravityPointMass(increment ? Config.maxGravityPointMass + POINT_MASS_INCREMENT : Math.max(1, Config.maxGravityPointMass - POINT_MASS_INCREMENT));
                newValue = Config.maxGravityPointMass;
                // Set the gravity point to the 180-degree location on the circle
                const x = this.canvas.width / 2;
                const y = this.canvas.height / 2 + (this.canvas.height / 2 * RADIUS_MULTIPLIER);
                const distanceMultiplier = Config.maxDistanceMultiplier;
                this.circleManager.updateSuperGravityPoint(x, y, distanceMultiplier);
                break;
            case 1:  // Friction
                propertyName = 'maxFriction';
                oldValue = Config.maxFriction;
                Config.setMaxFriction(increment ? Config.maxFriction + FRICTION_INCREMENT : Math.max(0, Config.maxFriction - FRICTION_INCREMENT));
                newValue = Config.maxFriction;
                break;
            case 2:  // Radius
                propertyName = 'maxRadius';
                oldValue = Config.maxRadius;
                Config.setMaxRadius(increment ? Config.maxRadius + RADIUS_INCREMENT : Math.max(1, Config.maxRadius - RADIUS_INCREMENT));
                newValue = Config.maxRadius;
                break;
            case 3:  // Mass
                propertyName = 'maxMass';
                oldValue = Config.maxMass;
                Config.setMaxMass(increment ? Config.maxMass + MASS_INCREMENT : Math.max(1, Config.maxMass - MASS_INCREMENT));
                newValue = Config.maxMass;
                break;
            case 4:  // Attraction
                propertyName = 'maxAttraction';
                oldValue = Config.maxAttraction;
                Config.setMaxAttraction(increment ? Config.maxAttraction + ATTRACTION_INCREMENT : Math.max(0, Config.maxAttraction - ATTRACTION_INCREMENT));
                newValue = Config.maxAttraction;
                break;
            case 5:  // Repulsion
                propertyName = 'maxRepulsion';
                oldValue = Config.maxRepulsion;
                Config.setMaxRepulsion(increment ? Config.maxRepulsion + REPULSION_INCREMENT : Math.max(0, Config.maxRepulsion - REPULSION_INCREMENT));
                newValue = Config.maxRepulsion;
                break;
        }
        // console.log("Button " + index + " clicked. " + (increment ? "Incrementing" : "Decrementing") + " " + propertyName + " from " + oldValue + " to " + newValue);

        if (this.initialPressTimer === null) {
            this.initialPressTimer = setTimeout(() => {
                this.initialPressTimer = null;
            }, this.initialPressDelay);
        }
    }
}

// INFO: Configuration
class Config {
    static maxDistanceMultiplier = 200;
    static maxGravityPointMass = 5e6;
    static maxFriction = 1;
    static maxMass = 10;
    static maxAttraction = 0;
    static maxRepulsion = 0;
    static maxRadius = 5;

    static maxSpeed = 100;
    static maxCircles = 1100;
    static defaultColor = 'white';
    static debounceDelay = 100;
    static gravityPoints; // Lazy initialization

    static initialize() {
        // console.log(['maxDistanceMultiplier', 'maxGravityPointMass', 'maxFriction', 'maxMass', 'maxAttraction', 'maxRepulsion', 'maxRadius'].map(prop => prop + ': ' + Config[prop]).join(', '));
    }

    static initializeSuperGravity(canvasWidth, canvasHeight) {
        const x = canvasWidth / 2;
        const y = canvasHeight * 10;

        // Create a single gravity point with a large mass value
        this.gravityPoints = [new GravityPoint(x, y, Config.maxGravityPointMass)];
        // console.log("Super Gravity point: x=" + x + ", y=" + y);
    }

    static setMaxGravityPointMass(newVal) {
        this.maxGravityPointMass = newVal;
    }

    static setMaxFriction(newVal) {
        this.maxFriction = newVal;
    }

    static setMaxMass(newVal) {
        this.maxMass = newVal;
    }

    static setMaxAttraction(newVal) {
        this.maxAttraction = newVal;
    }

    static setMaxRepulsion(newVal) {
        this.maxRepulsion = newVal;
    }

    static setMaxRadius(newVal) {
        this.maxRadius = newVal;
    }

    static getColorByMass(mass) {
        // Calculate the maximum possible mass based on the maximum radius
        const maxPossibleMass = Math.pow(Config.maxRadius, 2);

        // Normalize the mass to fit within the hue range of 45 to 345
        const normalizedMass = ((mass / maxPossibleMass) * (345 - 45)) + 45;

        // Calculate the hue based on the normalized mass
        const hue = Math.floor(normalizedMass);

        // Keep saturation and lightness constant to get vivid colors
        const saturation = 100;
        const lightness = 50;

        // console.log("Mass: " + mass + ", Normalized Mass: " + normalizedMass + ", Hue: " + hue);
        return "hsl(" + hue + ", " + saturation + "%, " + lightness + "%)";
    }

    static getRandomValue(min = 1, max) {
        return Math.random() * (max - min) + min;
    }

    static getRandomRadius(min = 1, max = Config.maxRadius) {
        return this.getRandomValue(min, max);
    }

}


// INFO: Main code
Config.initialize();  // Let's fire the baby up!
const canvasManager = new CanvasManager('canvas', 'canvas-container');
const ctx = canvasManager.getContext();
Config.initializeSuperGravity(ctx.canvas.width, ctx.canvas.height);
const circleManager = new CircleManager();
const buttonAreaHeight = canvasManager.getButtonAreaHeight();
const buttonManager = new ButtonManager(ctx, buttonAreaHeight);
const userInputManager = new UserInputManager(canvasManager.canvas, circleManager, buttonAreaHeight);

buttonManager.setUserInputManager(userInputManager);
userInputManager.setButtonManager(buttonManager);

const game = new Game(ctx, circleManager, buttonAreaHeight, buttonManager, userInputManager);
game.start();