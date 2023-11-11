import {Ai} from './vendor/@cloudflare/ai.js';

/**
 * Responds to GET and POST requests.
 */
export default {
    async fetch(request, env) {
        try {
            if (request.method === 'GET') {
                return new Response(htmlPage(), {
                    headers: {'Content-Type': 'text/html'},
                });
            } else if (request.method === 'POST') {
                const formData = await request.formData();
                const message = formData.get('message');

                if (message.trim().length <= 0) {
                    return new Response(htmlPage(), {
                        headers: {'Content-Type': 'text/html'},
                    });
                }

                const ai = new Ai(env.AI);
                const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {prompt: message});
                const aiResponse = processAiResponse(response.response);
                return new Response(htmlPage(message, aiResponse), {
                    headers: {'Content-Type': 'text/html'},
                });
            } else {
                return new Response('Method not allowed', {status: 405});
            }
        } catch (error) {
            // Catch and handle any errors that occur during the fetch process
            return new Response(`Error: ${error.message}`, {status: 500});
        }
    }
};

function processAiResponse(aiResponse) {
    const headerRegex = /^\?\n\n(Answer:)?/;
    return aiResponse.replace(headerRegex, '').trim();
}

function htmlPage(prompt = '', response = '') {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Ask Llama</title>
            <link rel="icon" href="data:;base64,iVBORw0KGgo=">
            <style>
                body, input, textarea, .form-control { background-color: black; color: white;}
                input:focus, textarea:focus, .form-control:focus { background-color: black; color: white; }
                input::placeholder, textarea::placeholder, .form-control::placeholder { background-color: black; color: lightblue; opacity: 0.6 }
                .container {
                    padding-top: 5px;
                    opacity: 0;
                    transform: scale(0.9);
                    transition: opacity 2s ease-in-out, transform 2s ease-in-out;
                }
                #responseText { height: 600px; }
                .textarea-container {
                  position: relative;
                }
                .custom-textarea {
                  width: 100%;
                  height: 600px;
                  background-color: transparent;
                }
                .image-overlay {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  width: 95%; /* Make it as wide as the textarea */
                  height: 100%; /* Make it as tall as the textarea */
                  transform: translate(-50%, -50%);

                  background-image: url('https://rylekor.com/talkbox/assets/img/askLlamaWeb.png');
                  background-size: contain;
                  background-repeat: no-repeat;
                  background-position: center;
                  opacity: 0.3; 
                  z-index: -1; /* Place it behind the textarea */
                  pointer-events: none; /* Make it unclickable, so the textarea stays interactive */
                }
                button.custom-button {
                  background-image: url('https://rylekor.com/talkbox/assets/img/askLlamaButtonWeb.png');
                  background-size: contain;
                  background-color: transparent;
                  background-repeat: no-repeat;
                  opacity: 0.5;
                  border: none; 
                  width: 100px; 
                  height: 60px; 
                  cursor: pointer; /* Change the cursor to signify this is clickable */
                }
            </style>
        </head>
        <body>
            
            <div class="container">
                <div class="row my-3">
                    <div class="col-lg-12 textarea-container">
                        <textarea class="form-control custom-textarea" tabindex="-1" id="responseText" readonly>${response}</textarea>
                        <div class="image-overlay"></div>
                    </div>
                </div>

                <form action="llama" method="post">
                    <div class="row my-3">
                        <div class="col-lg-11 col-md-10 col-9">
                            <input type="text" class="form-control" tabindex="0" id="messageInput" name="message" placeholder="Ask your question" ${prompt}">
                        </div>
                        <div class="col-lg-1 col-md-2 col-3">
                            <button tabindex="1" id="sendButton" type="submit" class="custom-button"></button>
                        </div>
                    </div>
                </form>
            </div>
            
             <script>
              document.addEventListener('DOMContentLoaded', (e) => {
                const inputField = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const container = document.querySelector('.container');
                const form = document.querySelector('form');
                const fadeTimer = 500; // Milliseconds
                
                
                // Function to control the fade in and fade out
                function fade(action) {
                  container.style.transition = 'opacity ' + fadeTimer + 'ms';
                  container.style.opacity = action === 'in' ? '1' : '0';
                }
            
                // Fade in on page load
                fade('in');
            
                inputField.addEventListener('input', function() {
                  sendButton.disabled = inputField.value.trim().length <= 0;
                });
            
                inputField.addEventListener('keypress', (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fadeOutAndSubmit();
                  }
                });
            
                sendButton.addEventListener('click', (e) => {
                  e.preventDefault();
                  fadeOutAndSubmit();
                });
            
                sendButton.addEventListener('touchend', (e) => {
                  e.preventDefault(); // Prevent multiple triggers
                });
            
                function fadeOutAndSubmit() {
                  // Fade out the container
                  fade('out');
            
                  // Wait for the transition to finish before submitting
                  setTimeout(() => {
                    form.submit();
                  }, 500); // This should match the duration of the opacity transition
                }
              });
            </script>
                    
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
  `;
}