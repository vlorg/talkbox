class ArcadeLoader {
    mobileBreakpoint = 768;

    constructor() {
        this.canvasContainer = document.getElementById('canvas-container');
        this.initCanvasContainer();
    }

    initCanvasContainer() {
        // Clear existing content if any
        this.canvasContainer.innerHTML = '';

        // Create the button group container
        const buttonGroup = this.createButtonGroup();

        // Define games with respective titles and handlers
        const games = [
            {
                title: 'Tetris',
                handler: () => this.loadIframe('https://rylekor.com/tetris', 560, 800),
                mobileFriendly: true
            },
            {
                title: 'Super Q*bert',
                handler: () => this.loadIframe('https://archive.org/embed/arcade_sqbert', 560, 800),
                mobileFriendly: false
            },
            {
                title: 'Q*bert',
                handler: () => this.loadIframe('https://archive.org/embed/arcade_qbert', 560, 800),
                mobileFriendly: false
            },
            {
                title: 'Mr. Do!',
                handler: () => this.loadIframe('https://archive.org/embed/arcade_mrdo', 560, 800),
                mobileFriendly: false
            },
            {
                title: 'Mappy',
                handler: () => this.loadIframe('https://archive.org/embed/mappy_mame', 560, 800),
                mobileFriendly: false
            },
            {
                title: 'MsPacman and Galaga',
                handler: () => this.loadIframe('https://archive.org/embed/arcade_20pacgal', 560, 800),
                mobileFriendly: false
            },
            {
                title: 'Super Pinball Action',
                handler: () => this.loadIframe('https://archive.org/embed/arcade_spbactn', 450, 800),
                mobileFriendly: false
            }
        ];

        // Detect current breakpoint
        const isMobile = window.innerWidth < this.mobileBreakpoint

        games.forEach(game => {
            // If the game is mobile-friendly, or we're not on a mobile device, add the button
            if (game.mobileFriendly || !isMobile) {
                const button = this.createButton(game.title, game.handler);
                buttonGroup.appendChild(button);
            }
        });

        // Append the button group to the canvas container
        this.canvasContainer.appendChild(buttonGroup);
    }

    createButtonGroup() {
        const buttonGroup = document.createElement('div');
        buttonGroup.setAttribute('class', 'button-group-center');
        return buttonGroup;
    }

    createButton(text, handler) {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('btn', 'btn-primary', 'm-2');
        button.addEventListener('click', handler);
        return button;
    }

    loadIframe(src, width, height) {
        // Clear the button group and load the iframe
        this.canvasContainer.innerHTML = '';
        this.canvasContainer.classList.add('text-center');

        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', src);
        iframe.style.width = '100%';
        iframe.style.maxWidth = `${width}px`;
        iframe.style.height = `${height}px`;
        iframe.style.overflow = 'hidden';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('allowtransparency', 'true');

        this.canvasContainer.appendChild(iframe);
    }
}