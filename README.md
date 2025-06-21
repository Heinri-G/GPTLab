# My ChatGPT Clone

This project is a simple frontend implementation of a ChatGPT-like interface that interacts with the OpenAI API. It features chat history, model selection, and real-time token usage/cost display.

## Features

*   **Chat Interface:** Send messages to an AI model and receive responses.
*   **Chat History:** Conversations are saved in your browser's local storage. You can load previous chats, start new ones, and delete old ones.
*   **Model Selection:** Choose between different OpenAI models (e.g., GPT-3.5-Turbo, GPT-4).
*   **Token Usage & Cost:** See an estimate of token consumption and associated costs in real-time for the current chat session, based on the selected model.

## Setup and Usage

1.  **Clone the Repository (or download the files):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
    Or, simply download `index.html`, `style.css`, and `script.js` into the same folder.

2.  **Configure Your OpenAI API Key:**
    *   Open the `script.js` file in a text editor.
    *   Locate the following line:
        ```javascript
        const OPENAI_API_KEY = 'YOUR_API_KEY_HERE'; // <<< REPLACE THIS!
        ```
    *   Replace `'YOUR_API_KEY_HERE'` with your actual OpenAI API key.
    *   **IMPORTANT SECURITY NOTE:** This method of including the API key directly in frontend JavaScript is **NOT SECURE** for production applications. It exposes your API key to anyone who inspects the browser's code. For personal use or development, it might be acceptable, but for any public deployment, you should implement a backend proxy to handle API requests securely.

3.  **Open in Browser:**
    *   Open the `index.html` file in your web browser (e.g., by double-clicking it or using a local web server).

4.  **Start Chatting:**
    *   Select your desired model.
    *   Type your message in the input box and press Enter or click "Send".

## Files

*   `index.html`: The main HTML structure of the application.
*   `style.css`: Contains all the CSS styles for the application.
*   `script.js`: Handles all the JavaScript logic, including:
    *   API communication with OpenAI.
    *   Chat history management (using `localStorage`).
    *   Model selection.
    *   Token and cost calculation.
    *   DOM manipulation.

## Model Pricing

The `script.js` file contains a `MODEL_PRICING` object with example pricing for `gpt-3.5-turbo` and `gpt-4`.
```javascript
const MODEL_PRICING = {
    "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 }, // Per 1K tokens
    "gpt-4": { input: 0.03, output: 0.06 },           // Per 1K tokens
    // Add other models and their pricing here
};
```
You should verify and update these prices according to the latest [OpenAI pricing page](https://openai.com/pricing) if you need highly accurate cost tracking.

## Future Improvements (Security)

*   **Backend Proxy for API Key:** As mentioned, the most critical improvement for any non-personal use case is to create a backend service that securely stores your API key and proxies requests to OpenAI. This prevents your API key from being exposed in the frontend code.

## Disclaimer

This is a simplified clone for demonstration and personal use. Ensure you comply with OpenAI's API usage policies. Cost estimations are based on the pricing data in `script.js` and may not be perfectly accurate. Always refer to your OpenAI account dashboard for official usage and billing information.
