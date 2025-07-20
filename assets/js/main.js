// =================================================================
// == Ultimate Diagnosis & Fix Script - vFinal                 ==
// == Goal: 100% reliability for the submit button function. ==
// =================================================================

// This script now waits for the entire window, including all resources, to be fully loaded.
window.addEventListener('load', () => {

    console.log('[DIAGNOSIS] Step 1: Window loaded. Script starting.');

    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const submitButton = document.getElementById('submit-button');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatContainer = document.getElementById('chat-container');

    if (!chatForm || !messageInput || !submitButton || !welcomeScreen || !chatContainer) {
        console.error('[DIAGNOSIS] CRITICAL ERROR: A required HTML element is missing. Check IDs.');
        return;
    }
    console.log('[DIAGNOSIS] Step 2: All required HTML elements found.');

    const API_URL = '/api/proxy'; // 必须使用代理来避免CORS跨域问题
    const API_KEY = '66ccd395-652d-43bc-90ee-c02109b71e05'; // 更新为新的API Key
    const conversationHistory = [];
    let isFirstMessage = true;

    // --- The Core Logic: Update button state based on input ---
    function updateState() {
        const message = messageInput.value.trim();
        console.log(`[DIAGNOSIS] Input detected. Current text length: ${message.length}`);

        // Adjust textarea height dynamically
        messageInput.style.height = 'auto';
        const newHeight = Math.min(messageInput.scrollHeight, 200);
        messageInput.style.height = newHeight + 'px';

        // Enable/disable button logic
        if (message.length > 0) {
            console.log('[DIAGNOSIS] Condition MET. Activating button.');
            submitButton.disabled = false;
            submitButton.classList.remove('bg-gray-300');
            submitButton.classList.add('bg-black');
        } else {
            console.log('[DIAGNOSIS] Condition NOT MET. Deactivating button.');
            submitButton.disabled = true;
            submitButton.classList.remove('bg-black');
            submitButton.classList.add('bg-gray-300');
        }
    }

    // --- Event Listeners: We listen to every possible input event ---
    messageInput.addEventListener('input', updateState);
    messageInput.addEventListener('keyup', updateState);
    messageInput.addEventListener('paste', updateState);
    console.log('[DIAGNOSIS] Step 3: Event listeners attached.');

    // --- Form Submission Logic ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[DIAGNOSIS] Submit event fired.');

        const message = messageInput.value.trim();
        if (!message) {
            console.log('[DIAGNOSIS] Submission aborted: message is empty.');
            return;
        }

        if (isFirstMessage) {
            welcomeScreen.style.display = 'none';
            isFirstMessage = false;
            console.log('[DIAGNOSIS] First message sent. Hiding welcome screen.');
        }

        appendMessage(message, 'user');
        conversationHistory.push({ role: 'user', content: message });
        
        // Reset input field and button state
        messageInput.value = '';
        updateState();

        const loadingElement = appendMessage('', 'ai', true);
        
        try {
            console.log('[DIAGNOSIS] Calling API...');
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    model: "doubao-seed-1-6-thinking-250715", 
                    messages: conversationHistory, 
                    stream: true,
                    apiKey: API_KEY // 在请求中加入API Key
                })
            });
            console.log('[DIAGNOSIS] API response received. Status:', response.status);
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';
            const aiContentContainer = loadingElement.querySelector('.content-body');
            aiContentContainer.innerHTML = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                console.log('[DIAGNOSIS] Chunk received:', chunk);
                // 增强解析（基于官方JSON结构）
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    let contentPart = '';
                    if (line.startsWith('data: ')) {
                        const jsonString = line.substring(6).trim();
                        if (jsonString === '[DONE]') break;
                        try {
                            const jsonData = JSON.parse(jsonString);
                            contentPart = jsonData.choices?.[0]?.delta?.content || jsonData.choices?.[0]?.message?.content || '';
                        } catch (e) { 
                            console.error('[DIAGNOSIS] Parse error:', e);
                            contentPart = jsonString; // fallback
                        }
                    } else if (line.trim()) {
                        contentPart = line;
                    }
                    if (contentPart) {
                        aiResponse += contentPart;
                        aiContentContainer.textContent = aiResponse;
                        scrollToBottom();
                    }
                }
            }
            if (aiResponse) {
                conversationHistory.push({ role: 'assistant', content: aiResponse });
            } else {
                console.log('[DIAGNOSIS] No response content');
                aiContentContainer.textContent = '无响应，请检查API Key或模型（参考官方示例）。';
            }
        } catch (error) {
            console.error('[DIAGNOSIS] An error occurred during API call:', error);
            const errorElement = loadingElement.querySelector('.content-body');
            if(errorElement) errorElement.textContent = '抱歉，服务暂时不可用：' + error.message;
        } finally {
            loadingElement.classList.remove('loading');
        }
    });

    function appendMessage(text, sender, isLoading = false) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `py-6 border-b border-gray-200 ${sender === 'ai' ? 'bg-gray-50' : ''}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'flex items-start gap-4 max-w-4xl mx-auto';
        
        const avatar = document.createElement('div');
        avatar.className = 'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center';
        if (sender === 'user') {
            avatar.classList.add('bg-blue-500', 'text-white');
            avatar.textContent = '你';
        } else {
            avatar.classList.add('bg-black', 'text-white');
            avatar.innerHTML = `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.0001 12.0001C22.0001 17.523 17.523 22.0001 12.0001 22.0001C6.47727 22.0001 2.00012 17.523 2.00012 12.0001C2.00012 6.47727 6.47727 2.00012 12.0001 2.00012C17.523 2.00012 22.0001 6.47727 22.0001 12.0001ZM12.0001 13.3334C11.2592 13.3334 10.6668 12.741 10.6668 12.0001C10.6668 11.2592 11.2592 10.6668 12.0001 10.6668C12.741 10.6668 13.3334 11.2592 13.3334 12.0001C13.3334 12.741 12.741 13.3334 12.0001 13.3334ZM7.3335 13.3334C6.59262 13.3334 6.00016 12.741 6.00016 12.0001C6.00016 11.2592 6.59262 10.6668 7.3335 10.6668C8.07437 10.6668 8.66683 11.2592 8.66683 12.0001C8.66683 12.741 8.07437 13.3334 7.3335 13.3334ZM16.6668 13.3334C15.926 13.3334 15.3335 12.741 15.3335 12.0001C15.3335 11.2592 15.926 10.6668 16.6668 10.6668C17.4077 10.6668 18.0002 11.2592 18.0002 12.0001C18.0002 12.741 17.4077 13.3334 16.6668 13.3334Z"></path></svg>`;
        }
        
        const messageBody = document.createElement('div');
        messageBody.className = 'content-body flex-1 pt-0.5';

        if (isLoading) {
            messageWrapper.classList.add('loading');
            messageBody.innerHTML = '<div class="dot-flashing-gpt"></div>';
        } else {
            messageBody.textContent = text; // Use textContent for plain text rendering
        }

        messageContent.appendChild(avatar);
        messageContent.appendChild(messageBody);
        messageWrapper.appendChild(messageContent);
        chatContainer.appendChild(messageWrapper);
        
        scrollToBottom();
        return messageWrapper;
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // --- Initial State Setup ---
    console.log('[DIAGNOSIS] Step 4: Initializing component state...');
    updateState(); // Set the initial state of the button
    
    const style = document.createElement('style');
    style.innerHTML = `
        .dot-flashing-gpt { position: relative; width: 6px; height: 6px; border-radius: 5px; background-color: #A9A9A9; color: #A9A9A9; animation: dot-flashing-gpt 1s infinite linear alternate; animation-delay: .5s; display: inline-block; }
        .dot-flashing-gpt::before, .dot-flashing-gpt::after { content: ''; display: inline-block; position: absolute; top: 0; }
        .dot-flashing-gpt::before { left: -10px; width: 6px; height: 6px; border-radius: 5px; background-color: #A9A9A9; color: #A9A9A9; animation: dot-flashing-gpt 1s infinite alternate; animation-delay: 0s; }
        .dot-flashing-gpt::after { left: 10px; width: 6px; height: 6px; border-radius: 5px; background-color: #A9A9A9; color: #A9A9A9; animation: dot-flashing-gpt 1s infinite alternate; animation-delay: 1s; }
        @keyframes dot-flashing-gpt { 0% { background-color: #A9A9A9; } 50%, 100% { background-color: #D3D3D3; } }
        .content-body { line-height: 1.75; white-space: pre-wrap; word-wrap: break-word; }
    `;
    document.head.appendChild(style);
    console.log('[DIAGNOSIS] Step 5: Setup complete. Ready for user input.');
});

