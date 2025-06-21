document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesArea = document.getElementById('messages-area');
    const chatHistoryUl = document.getElementById('chat-history');
    const modelSelect = document.getElementById('model-select');
    const tokenCountSpan = document.getElementById('token-count');
    const costDisplaySpan = document.getElementById('cost-display');

    // --- Hardcoded API Key (FOR DEVELOPMENT ONLY) ---
    // IMPORTANT: Replace this with a secure method of handling API keys in a production environment!
    // For example, use a backend proxy.
    const OPENAI_API_KEY = 'YOUR_API_KEY_HERE'; // <<< REPLACE THIS!

    if (OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
        alert("Please replace 'YOUR_API_KEY_HERE' with your actual OpenAI API key in script.js.");
        sendButton.disabled = true;
        messageInput.disabled = true;
    }

    let currentChat = [];
    let chatHistories = {}; // Store multiple chat sessions
    let currentChatId = null;
    let totalTokens = 0;
    let totalCost = 0.0;

    // Pricing per 1K tokens (example, update with actual OpenAI pricing)
    const MODEL_PRICING = {
        "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 }, // Example pricing for gpt-3.5-turbo
        "gpt-4": { input: 0.03, output: 0.06 },           // Example pricing for gpt-4
        // Add other models and their pricing here
    };

    // --- Event Listeners ---
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    modelSelect.addEventListener('change', () => {
        // Potentially reset chat or warn user if changing model mid-chat
        console.log("Model changed to:", modelSelect.value);
        // Reset token and cost if model changes, or handle context differently
        resetTokenCost();
    });

    // --- Core Functions ---
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
            alert("API Key not configured. Please set it in script.js");
            return;
        }

        displayMessage(messageText, 'user');
        currentChat.push({ role: 'user', content: messageText });
        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset height after sending

        // Show loading indicator (optional)
        displayMessage("Thinking...", 'assistant', true);


        fetchOpenAIResponse(currentChat);
        saveCurrentChat(); // Save history after sending a message
    }

    async function fetchOpenAIResponse(chatMessages) {
        const selectedModel = modelSelect.value;
        const apiUrl = 'https://api.openai.com/v1/chat/completions';

        // Prepare messages for the API (only send a reasonable history to save tokens)
        // For simplicity, sending the whole currentChat here.
        // In a real app, you might want to truncate or summarize older messages.
        const messagesForAPI = chatMessages.map(msg => ({ role: msg.role, content: msg.content }));

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: messagesForAPI
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                removeLoadingMessage();
                displayMessage(`Error: ${errorData.error.message}`, 'assistant system-error');
                return;
            }

            const data = await response.json();
            removeLoadingMessage();

            if (data.choices && data.choices.length > 0) {
                const assistantMessage = data.choices[0].message.content;
                displayMessage(assistantMessage, 'assistant');
                currentChat.push({ role: 'assistant', content: assistantMessage });

                // Update token usage and cost
                if (data.usage) {
                    const inputTokens = data.usage.prompt_tokens;
                    const outputTokens = data.usage.completion_tokens;
                    updateTokenAndCost(inputTokens, outputTokens, selectedModel);
                }
                saveCurrentChat(); // Save history after receiving a response
            } else {
                displayMessage('No response received.', 'assistant system-error');
            }

        } catch (error) {
            removeLoadingMessage();
            console.error("Fetch Error:", error);
            displayMessage('Failed to connect to the API. Check console for details.', 'assistant system-error');
        }
    }

    function displayMessage(text, sender, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        if (isLoading) {
            messageDiv.classList.add('loading');
        }
        messageDiv.textContent = text; // Using textContent for security (prevents XSS)
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight; // Scroll to bottom
    }

    function removeLoadingMessage() {
        const loadingMessage = messagesArea.querySelector('.message.loading');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    // --- Token and Cost Calculation ---
    function updateTokenAndCost(inputTokens, outputTokens, model) {
        totalTokens += inputTokens + outputTokens;
        tokenCountSpan.textContent = totalTokens;

        const pricing = MODEL_PRICING[model];
        if (pricing) {
            const costForRequest = (inputTokens / 1000 * pricing.input) + (outputTokens / 1000 * pricing.output);
            totalCost += costForRequest;
            costDisplaySpan.textContent = totalCost.toFixed(4); // Display cost with more precision
        }
    }

    function resetTokenCost() {
        totalTokens = 0;
        totalCost = 0.0;
        tokenCountSpan.textContent = '0';
        costDisplaySpan.textContent = '0.00';
    }

    // --- Chat History Management ---
    function saveCurrentChat() {
        if (!currentChatId) {
            currentChatId = `chat_${Date.now()}`;
            const chatTitle = currentChat.length > 0 ? currentChat[0].content.substring(0, 30) : "New Chat";
            chatHistories[currentChatId] = { title: chatTitle, messages: [...currentChat] };
            addChatToHistoryList(currentChatId, chatTitle);
        } else {
            chatHistories[currentChatId].messages = [...currentChat];
            // If the title needs updating (e.g., based on the first message)
            if (currentChat.length > 0 && chatHistories[currentChatId].title === "New Chat") {
                chatHistories[currentChatId].title = currentChat[0].content.substring(0, 30) + "...";
                updateChatHistoryListDisplay();
            }
        }
        localStorage.setItem('chatHistories', JSON.stringify(chatHistories));
    }

    function loadChatHistories() {
        const storedHistories = localStorage.getItem('chatHistories');
        if (storedHistories) {
            chatHistories = JSON.parse(storedHistories);
            updateChatHistoryListDisplay();
            // Optionally, load the last active chat or a new chat
            if (Object.keys(chatHistories).length > 0) {
                // Load the most recent chat (can be improved)
                const lastChatId = Object.keys(chatHistories).sort().pop();
                if (lastChatId) loadChat(lastChatId);
            } else {
                startNewChat();
            }
        } else {
            startNewChat();
        }
    }

    function addChatToHistoryList(chatId, title) {
        const listItem = document.createElement('li');
        listItem.textContent = title;
        listItem.dataset.chatId = chatId;
        listItem.addEventListener('click', () => loadChat(chatId));

        // Add delete button to chat history item
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.classList.add('delete-chat-button');
        deleteButton.onclick = (event) => {
            event.stopPropagation(); // Prevent li click event when deleting
            deleteChat(chatId);
        };
        listItem.appendChild(deleteButton);

        chatHistoryUl.prepend(listItem); // Add new chats to the top
    }

    function updateChatHistoryListDisplay() {
        chatHistoryUl.innerHTML = ''; // Clear existing list
        Object.entries(chatHistories).forEach(([id, chat]) => {
            addChatToHistoryList(id, chat.title);
        });
    }

    function loadChat(chatId) {
        if (chatHistories[chatId]) {
            currentChatId = chatId;
            currentChat = [...chatHistories[chatId].messages];
            messagesArea.innerHTML = ''; // Clear current messages
            currentChat.forEach(msg => displayMessage(msg.content, msg.role));
            resetTokenCost(); // Reset token/cost for the loaded chat (or implement per-chat tracking)
            console.log(`Loaded chat: ${chatId}`);
        }
    }

    function startNewChat() {
        currentChatId = null; // Important: ensures saveCurrentChat creates a new ID
        currentChat = [];
        messagesArea.innerHTML = '';
        displayMessage("Hello! How can I help you today?", 'assistant'); // Initial greeting
        currentChat.push({ role: 'assistant', content: "Hello! How can I help you today?"});
        resetTokenCost();
        // Don't save here, save when user sends the first message
    }

    function deleteChat(chatId) {
        if (confirm(`Are you sure you want to delete the chat "${chatHistories[chatId].title}"?`)) {
            delete chatHistories[chatId];
            localStorage.setItem('chatHistories', JSON.stringify(chatHistories));
            updateChatHistoryListDisplay();

            if (currentChatId === chatId) {
                startNewChat(); // Start a new chat if the active one was deleted
            }
        }
    }


    // Auto-adjust textarea height
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto'; // Reset height
        messageInput.style.height = `${messageInput.scrollHeight}px`; // Set to scroll height
    });


    // --- Initialization ---
    loadChatHistories(); // Load chats when the page loads

    // Add a "New Chat" button
    const newChatButton = document.createElement('button');
    newChatButton.textContent = '+ New Chat';
    newChatButton.id = 'new-chat-button';
    newChatButton.addEventListener('click', startNewChat);
    sidebar.insertBefore(newChatButton, sidebar.childNodes[1]); // Insert after the H2

    // Add some styles for the new chat button and delete button in CSS if needed
    const styleSheet = document.styleSheets[0];
    try {
        styleSheet.insertRule(`
            #new-chat-button {
                display: block;
                width: calc(100% - 10px); /* Adjust width as needed */
                padding: 10px 5px;
                margin-bottom: 15px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                text-align: center;
                font-size: 0.9em;
            }
        `, styleSheet.cssRules.length);
        styleSheet.insertRule(`
            #new-chat-button:hover {
                background-color: #0056b3;
            }
        `, styleSheet.cssRules.length);
        styleSheet.insertRule(`
            .sidebar { position: relative; }
        `, styleSheet.cssRules.length);
        styleSheet.insertRule(`
            #chat-history li {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-right: 5px; /* Space for delete button */
            }
        `, styleSheet.cssRules.length);
        styleSheet.insertRule(`
            .delete-chat-button {
                background: transparent;
                border: none;
                color: #ff6b6b; /* Light red for delete */
                cursor: pointer;
                font-size: 0.8em;
                padding: 2px 5px;
            }
        `, styleSheet.cssRules.length);
        styleSheet.insertRule(`
            .delete-chat-button:hover {
                color: #ff0000; /* Brighter red on hover */
            }
        `, styleSheet.cssRules.length);
         styleSheet.insertRule(`
            .message.assistant.system-error {
                background-color: #ffebee; /* Light red background for errors */
                color: #c62828; /* Darker red text */
                border: 1px solid #ef9a9a;
            }
        `, styleSheet.cssRules.length);
    } catch (e) {
        console.error("Failed to insert CSS rules:", e);
        // Fallback or alert if critical styles cannot be applied
    }

});
