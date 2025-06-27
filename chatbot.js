// --- START: Complete and Merged chatbot.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SELECTORS FOR NEW UI ELEMENTS ---
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatOpenIcon = document.getElementById('chat-open-icon');
    const chatCloseIcon = document.getElementById('chat-close-icon');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatButton = document.getElementById('send-chat');

    // --- 2. TRANSLATION LOGIC (from your original file) ---
    const chatbotTranslations = {
        de: {
            chatbot: {
                toggleAlt: "Chatbot öffnen",
                title: "Omar fragen",
                welcomeMessage: "Hallo! Ich bin Omars CV-Chatbot. Fragen Sie mich etwas über Omars Erfahrung, Projekte oder Fähigkeiten!",
                inputPlaceholder: "Stellen Sie eine Frage über Omar...",
                sendButton: "Senden",
                thinking: "Omar denkt nach...",
                error: "Entschuldigung, es gab ein Problem beim Abrufen der Antwort. Bitte versuchen Sie es später erneut.",
                noInfo: "Ich habe zu dieser Frage leider keine Informationen in Omars Lebenslauf gefunden. Vielleicht möchten Sie eine andere Frage stellen oder Omar direkt kontaktieren?",
            }
        },
        en: {
            chatbot: {
                toggleAlt: "Open Chatbot",
                title: "Ask Omar",
                welcomeMessage: "Hello! I'm Omar's CV chatbot. Ask me anything about Omar's experience, projects, or skills!",
                inputPlaceholder: "Ask a question about Omar...",
                sendButton: "Send",
                thinking: "Omar is thinking...",
                error: "Sorry, there was an issue retrieving the answer. Please try again later.",
                noInfo: "I'm afraid I don't have information on that specific question in Omar's CV. Perhaps you'd like to ask something else or contact Omar directly?",
            }
        }
    };

    function getCurrentLanguage() {
        return localStorage.getItem('cvLanguage') || 'de';
    }

    function updateChatbotUI() {
        const lang = getCurrentLanguage();
        // Update all elements with data-i18n-key attributes
        document.querySelectorAll('[data-i18n-key^="chatbot."]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            const keys = key.split('.');
            let text = chatbotTranslations[lang];
            for (const k of keys) {
                if (text && text[k] !== undefined) {
                    text = text[k];
                } else {
                    text = '';
                    break;
                }
            }
            if (element.hasAttribute('data-i18n-placeholder')) {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });
    }

    // --- 3. NEW UI TOGGLE LOGIC ---
    let isChatOpen = false;

    const toggleChatWindow = () => {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatWindow.classList.remove('hidden');
            setTimeout(() => { // Delay to allow CSS transition
                chatWindow.style.transform = 'scale(1)';
                chatWindow.style.opacity = '1';
                chatWindow.classList.add('flex');
            }, 10);

            chatbotToggle.style.transform = 'rotate(180deg)';
            chatOpenIcon.classList.add('hidden');
            chatCloseIcon.classList.remove('hidden');
            chatInput.focus();
            updateChatbotUI(); // Update UI text when opening
        } else {
            chatbotToggle.style.transform = 'rotate(0deg)';
            chatOpenIcon.classList.remove('hidden');
            chatCloseIcon.classList.add('hidden');
            chatWindow.style.transform = 'scale(0.95)';
            chatWindow.style.opacity = '0';
            setTimeout(() => { // Wait for transition to finish before hiding
                chatWindow.classList.add('hidden');
                chatWindow.classList.remove('flex');
            }, 300);
        }
    };

    // --- 4. MESSAGE HANDLING & API CALLS (Merged Logic) ---

    // **UPDATED** to create new styled bubbles
    const appendMessage = (sender, text) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('flex', sender === 'user' ? 'justify-end' : 'justify-start');

        let bubbleClasses = 'p-3 max-w-[85%]';
        if (sender === 'user') {
            bubbleClasses += ' bg-cyan-600 text-white rounded-l-lg rounded-tr-lg';
        } else {
            bubbleClasses += ' bg-slate-100 text-slate-800 rounded-r-lg rounded-tl-lg';
        }

        messageDiv.innerHTML = `<div class="${bubbleClasses}"><p>${text}</p></div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    };
    
    // **NEW** helper function for the animated thinking indicator
    const showThinkingIndicator = () => {
        const thinkingElement = document.createElement('div');
        thinkingElement.id = 'thinking-bubble';
        thinkingElement.className = 'flex justify-start';
        thinkingElement.innerHTML = `
             <div class="bg-slate-100 p-3 rounded-r-lg rounded-tl-lg">
                <div class="flex items-center justify-center space-x-1">
                    <span class="h-2 w-2 bg-slate-400 rounded-full animate-pulse" style="animation-delay: -0.3s;"></span>
                    <span class="h-2 w-2 bg-slate-400 rounded-full animate-pulse" style="animation-delay: -0.15s;"></span>
                    <span class="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(thinkingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // **NEW** helper function to remove the indicator
    const hideThinkingIndicator = () => {
        const thinkingBubble = document.getElementById('thinking-bubble');
        if (thinkingBubble) {
            thinkingBubble.remove();
        }
    };

    // **UPDATED** sendMessage function to use the new thinking indicator
    async function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (userMessage === '') return;

        appendMessage('user', userMessage);
        chatInput.value = '';
        chatInput.focus();

        showThinkingIndicator(); // Use the new thinking indicator

        try {
            const response = await fetch('https://omar-cv-chatbot-349165074208.europe-west1.run.app/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    language: getCurrentLanguage()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            hideThinkingIndicator();
            appendMessage('bot', data.response);

        } catch (error) {
            console.error('Error sending message to chatbot backend:', error);
            hideThinkingIndicator();
            appendMessage('bot', chatbotTranslations[getCurrentLanguage()].chatbot.error);
        }
    }

    // --- 5. EVENT LISTENERS ---
    chatbotToggle.addEventListener('click', toggleChatWindow);
    sendChatButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initial UI text update on page load
    updateChatbotUI();
});
