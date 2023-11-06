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
                title: 'Play Marbles',
                handler: () => this.loadMarbles(),
                mobileFriendly: true
            },
            {
                title: 'Play Chess Puzzles',
                handler: () => this.loadIframe('https://lichess.org/training/frame?theme=metal&bg=dark&pieceSet=california', 400, 444),
                mobileFriendly: true
            },
            {
                title: 'Play Q*bert',
                handler: () => this.loadIframe('https://archive.org/embed/arcade_qbert', 560, 600),
                mobileFriendly: false
            },
            {
                title: 'Play MsPacman and Galaga',
                handler: () => this.loadIframe('https://archive.org/embed/arcade_20pacgal', 560, 600),
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

    loadMarbles() {
        // Clear the button group and load the Marbles game
        this.loadGameCanvas('assets/js/app/marbles.js');
    }

    loadGameCanvas(scriptSrc) {
        this.canvasContainer.innerHTML = '';
        this.canvasContainer.classList.add('text-center');

        const canvas = document.createElement('canvas');
        canvas.setAttribute('id', 'canvas');
        this.canvasContainer.appendChild(canvas);

        const script = document.createElement('script');
        script.setAttribute('src', scriptSrc);
        document.body.appendChild(script);
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
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('allowtransparency', 'true');

        this.canvasContainer.appendChild(iframe);
    }
}