import {Ai} from './vendor/@cloudflare/ai.js';

/**
 * Responds to GET and POST requests.
 */
export default {
    async fetch(request, env) {
        try {
            if (request.method === 'GET') {
                // Check if there's a message query parameter to display the AI response
                const url = new URL(request.url);
                const message = url.searchParams.get('message');
                const aiResponse = url.searchParams.get('aiResponse');
                return new Response(htmlPage(message, aiResponse), {
                    headers: {'Content-Type': 'text/html'},
                });
            } else if (request.method === 'POST') {
                const formData = await request.formData();
                const message = sanitizeString(formData.get('message').trim());

                if (message.trim().length <= 0) {
                    // Redirect back to the GET page without processing
                    return Response.redirect(new URL(request.url), 303);
                }

                // Process the message with AI
                const ai = new Ai(env.AI);
                const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {prompt: message});
                const aiResponse = sanitizeString(processAiResponse(response.response));

                // Encode message and aiResponse in base64
                const encodedMessage = btoa(encodeURIComponent(message));
                const encodedAiResponse = btoa(encodeURIComponent(aiResponse));

                // Use encoded values in the URL
                const redirectUrl = new URL(request.url);
                redirectUrl.searchParams.set('message', encodedMessage);
                redirectUrl.searchParams.set('aiResponse', encodedAiResponse);
                return Response.redirect(redirectUrl, 303);

            } else {
                return new Response('Method not allowed', {status: 405});
            }
        } catch (error) {
            // Catch and handle any errors that occur during the fetch process
            return new Response(`Error: ${error.message}`, {status: 500});
        }
    }

};

function sanitizeString(str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function processAiResponse(aiResponse) {
    const headerRegex = /^(?:\?\n\n)?(Answer:)?/;
    return aiResponse.replace(headerRegex, '').trim();
}

function htmlPage(encodedPrompt = '', encodedResponse = '') {
    // Decode base64 encoded data
    const prompt = encodedPrompt ? decodeURIComponent(atob(encodedPrompt)) : '';
    const response = encodedResponse ? decodeURIComponent(atob(encodedResponse)) : '';
    const responseLength = response.length;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
            <title>Ask Llama</title>
            <link rel="icon" href="https://rylekor.com/talkbox/assets/img/rylekor.png">
            <style>
                body, input, textarea, .form-control { background-color: black; color: white;}
                input:focus, textarea:focus, .form-control:focus { background-color: black; color: white; }
                input::placeholder, textarea::placeholder, .form-control::placeholder { background-color: black; color: lightblue; opacity: 0.6 }
                .container {
                    padding-top: 5px;
                    opacity: 0;
                    transform: scale(0);
                }
                #responseText { height: 600px; }
                .textarea-container {
                  position: relative;
                  user-select: none;
                  pointer-events: none;
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
                
                // Adjust the opacity of .image-overlay based on aiResponse
                const aiResponse = "` + responseLength + `";
                const imageOverlay = document.querySelector('.image-overlay');
                
                if (aiResponse !== "0" && imageOverlay) {
                    imageOverlay.style.opacity = '0.2';
                } else {
                    imageOverlay.style.opacity = '1';
                }
                
                // Function to control the fade in and fade out
                function fade(action) {
                  const opacity = action === 'in' ? '1' : '0';
                  const scale = action === 'in' ? '1' : '0'; 
                  
                  container.style.transition = 'opacity ' + fadeTimer + 'ms, transform ' + fadeTimer + 'ms'; 
                  container.style.opacity = opacity;
                  container.style.transform = 'scale(' + scale + ')';
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
                  if(inputField.value.trim().length <= 0) return;
                  fadeOutAndSubmit();
                });
            
                sendButton.addEventListener('touchend', (e) => {
                  e.preventDefault();
                  sendButton.click();
                });
            
                function fadeOutAndSubmit() {
                  document.activeElement.blur();
                  fade('out');
            
                  setTimeout(() => {
                    form.submit();
                  }, fadeTimer);
                }
              });
            </script>
                    
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        </body>
        </html>
  `;
}