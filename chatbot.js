document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChatButton = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatButton = document.getElementById('send-chat');

    // Translations for chatbot specific elements (add these to your existing translations object in index.html later)
    // This is a local copy for the chatbot.js itself. The main translations are in index.html.
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

    // Function to get current language from localStorage (assuming your existing logic uses this)
    function getCurrentLanguage() {
        return localStorage.getItem('cvLanguage') || 'de';
    }

    // Function to update chatbot UI based on language
    function updateChatbotUI() {
        const lang = getCurrentLanguage();
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

        // Update initial welcome message if it exists
        const welcomeMessageDiv = chatMessages.querySelector('[data-i18n-key="chatbot.welcomeMessage"]');
        if (welcomeMessageDiv) {
            welcomeMessageDiv.textContent = chatbotTranslations[lang].chatbot.welcomeMessage;
        }
    }

    let isChatOpen = false;

    chatbotToggle.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatWindow.classList.remove('hidden');
            setTimeout(() => { // Trigger transition
                chatWindow.classList.remove('translate-y-full', 'opacity-0');
                chatWindow.classList.add('translate-y-0', 'opacity-100');
            }, 10);
        } else {
            chatWindow.classList.remove('translate-y-0', 'opacity-100');
            chatWindow.classList.add('translate-y-full', 'opacity-0');
            chatWindow.addEventListener('transitionend', () => {
                if (!isChatOpen) chatWindow.classList.add('hidden');
            }, { once: true });
        }
        chatInput.focus();
        updateChatbotUI(); // Update UI on toggle in case language changed
    });

    closeChatButton.addEventListener('click', () => {
        isChatOpen = false;
        chatWindow.classList.remove('translate-y-0', 'opacity-100');
        chatWindow.classList.add('translate-y-full', 'opacity-0');
        chatWindow.addEventListener('transitionend', () => {
            if (!isChatOpen) chatWindow.classList.add('hidden');
        }, { once: true });
    });

    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('flex', sender === 'user' ? 'justify-end' : 'justify-start');

        const textBubble = document.createElement('div');
        textBubble.classList.add('p-2', 'rounded-lg', 'max-w-[80%]'); // Add the common classes first

        if (sender === 'user') {
            textBubble.classList.add('bg-cyan-600', 'text-white'); // Add individual classes for user messages
        } else {
            textBubble.classList.add('bg-slate-200', 'text-slate-800'); // Add individual classes for bot messages
        }

        textBubble.textContent = text; // Use textContent to prevent XSS if external content

        messageDiv.appendChild(textBubble);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    }

    async function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (userMessage === '') return;

        appendMessage('user', userMessage);
        chatInput.value = '';

        // Show thinking message
        const thinkingMessageDiv = document.createElement('div');
        thinkingMessageDiv.classList.add('flex', 'justify-start');
        const thinkingBubble = document.createElement('div');
        thinkingBubble.classList.add('bg-slate-200', 'p-2', 'rounded-lg', 'max-w-[80%]', 'animate-pulse');
        thinkingBubble.textContent = chatbotTranslations[getCurrentLanguage()].chatbot.thinking;
        thinkingMessageDiv.appendChild(thinkingBubble);
        chatMessages.appendChild(thinkingMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // Updated endpoint to match app.py
            const response = await fetch('https://omar-cv-chatbot-349165074208.europe-west1.run.app/chat', { // <-- ADDED /chat
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMessage, language: getCurrentLanguage() })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            chatMessages.removeChild(thinkingMessageDiv); // Remove thinking message
            appendMessage('bot', data.response);

        } catch (error) {
            console.error('Error sending message to chatbot backend:', error);
            chatMessages.removeChild(thinkingMessageDiv); // Remove thinking message
            appendMessage('bot', chatbotTranslations[getCurrentLanguage()].chatbot.error);
        }
    }

    sendChatButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initial update when script loads
    updateChatbotUI();
});