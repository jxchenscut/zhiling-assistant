document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.getElementById('chat-container');
    const submitButton = document.getElementById('submit-button');
    const welcomeScreen = document.getElementById('welcome-screen');

    // API配置
    const API_URL = '/api/proxy'; 
    const API_KEY = '60db0a4b-6261-4b00-8727-34890003e8d1';
    
    const conversationHistory = [];
    const md = window.markdownit();

    let isFirstMessage = true;

    // ---- 动态调整输入框高度 和 控制提交按钮状态 ----
    messageInput.addEventListener('input', () => {
        // 自适应高度
        messageInput.style.height = 'auto';
        const newHeight = Math.min(messageInput.scrollHeight, 200); // 限制最大高度
        messageInput.style.height = newHeight + 'px';

        // 控制按钮状态
        if (messageInput.value.trim().length > 0) {
            submitButton.disabled = false;
            submitButton.classList.remove('bg-gray-300');
            submitButton.classList.add('bg-black');
        } else {
            submitButton.disabled = true;
            submitButton.classList.remove('bg-black');
            submitButton.classList.add('bg-gray-300');
        }
    });
    
    // ---- 阻止Textarea默认的回车换行 ----
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // ---- 表单提交事件 ----
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;
        
        // 如果是第一条消息，隐藏欢迎界面
        if (isFirstMessage) {
            welcomeScreen.style.display = 'none';
            isFirstMessage = false;
        }

        // 重置输入框和按钮
        messageInput.value = '';
        messageInput.dispatchEvent(new Event('input')); 
        
        appendMessage(message, 'user');
        conversationHistory.push({ role: 'user', content: message });
        
        const loadingElement = appendMessage('', 'ai', true);
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "doubao-pro-4k",
                    messages: conversationHistory,
                    stream: true
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';
            
            const aiContentContainer = loadingElement.querySelector('.markdown-body');
            aiContentContainer.innerHTML = ''; // 清空加载动画

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonString = line.substring(6);
                        if (jsonString === '[DONE]') break;
                        try {
                            const jsonData = JSON.parse(jsonString);
                            if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                                 const contentPart = jsonData.choices[0].delta.content;
                                 aiResponse += contentPart;
                                 aiContentContainer.innerHTML = md.render(aiResponse);
                                 scrollToBottom();
                            }
                        } catch (e) { /* 忽略无法解析的JSON */ }
                    }
                }
            }
            
            if (aiResponse) {
                conversationHistory.push({ role: 'assistant', content: aiResponse });
            }

        } catch (error) {
            console.error('API Error:', error);
            const errorMessage = '抱歉，服务暂时不可用。';
            loadingElement.querySelector('.markdown-body').textContent = errorMessage;
        } finally {
            loadingElement.classList.remove('loading');
        }
    });

    function appendMessage(text, sender, isLoading = false) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `py-6 border-b border-gray-200 ${sender === 'ai' ? 'bg-gray-50' : ''}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'flex items-start gap-4 max-w-4xl mx-auto';
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center';
        if (sender === 'user') {
            avatar.classList.add('bg-blue-500', 'text-white');
            avatar.textContent = '你';
        } else {
            avatar.classList.add('bg-black', 'text-white');
             avatar.innerHTML = `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.0001 12.0001C22.0001 17.523 17.523 22.0001 12.0001 22.0001C6.47727 22.0001 2.00012 17.523 2.00012 12.0001C2.00012 6.47727 6.47727 2.00012 12.0001 2.00012C17.523 2.00012 22.0001 6.47727 22.0001 12.0001ZM12.0001 13.3334C11.2592 13.3334 10.6668 12.741 10.6668 12.0001C10.6668 11.2592 11.2592 10.6668 12.0001 10.6668C12.741 10.6668 13.3334 11.2592 13.3334 12.0001C13.3334 12.741 12.741 13.3334 12.0001 13.3334ZM7.3335 13.3334C6.59262 13.3334 6.00016 12.741 6.00016 12.0001C6.00016 11.2592 6.59262 10.6668 7.3335 10.6668C8.07437 10.6668 8.66683 11.2592 8.66683 12.0001C8.66683 12.741 8.07437 13.3334 7.3335 13.3334ZM16.6668 13.3334C15.926 13.3334 15.3335 12.741 15.3335 12.0001C15.3335 11.2592 15.926 10.6668 16.6668 10.6668C17.4077 10.6668 18.0002 11.2592 18.0002 12.0001C18.0002 12.741 17.4077 13.3334 16.6668 13.3334Z"></path></svg>`;
        }
        
        // Message Body
        const messageBody = document.createElement('div');
        messageBody.className = 'markdown-body flex-1 pt-0.5';

        if (isLoading) {
            messageWrapper.classList.add('loading');
            messageBody.innerHTML = '<div class="dot-flashing-gpt"></div>';
        } else {
            messageBody.innerHTML = md.render(text);
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
    
    // 触发一次input事件，确保初始按钮状态正确
    messageInput.dispatchEvent(new Event('input'));
    
    // 注入加载动画样式
    const style = document.createElement('style');
    style.innerHTML = `
        /* 新的加载动画 */
        .dot-flashing-gpt { position: relative; width: 6px; height: 6px; border-radius: 5px; background-color: #A9A9A9; color: #A9A9A9; animation: dot-flashing-gpt 1s infinite linear alternate; animation-delay: .5s; display: inline-block; }
        .dot-flashing-gpt::before, .dot-flashing-gpt::after { content: ''; display: inline-block; position: absolute; top: 0; }
        .dot-flashing-gpt::before { left: -10px; width: 6px; height: 6px; border-radius: 5px; background-color: #A9A9A9; color: #A9A9A9; animation: dot-flashing-gpt 1s infinite alternate; animation-delay: 0s; }
        .dot-flashing-gpt::after { left: 10px; width: 6px; height: 6px; border-radius: 5px; background-color: #A9A9A9; color: #A9A9A9; animation: dot-flashing-gpt 1s infinite alternate; animation-delay: 1s; }
        @keyframes dot-flashing-gpt { 0% { background-color: #A9A9A9; } 50%, 100% { background-color: #D3D3D3; } }
        /* Markdown 样式 */
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body { line-height: 1.75; }
    `;
    document.head.appendChild(style);
});
