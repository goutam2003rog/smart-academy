
// =====================================
// SMART ACADEMY AI CHATBOT
// =====================================

console.log("SMART ACADEMY CHATBOT JS LOADED");
const chatbotLauncher = document.getElementById("chatbotLauncher");
const chatbotWidget = document.querySelector(".chatbot-widget");
const chatbotWindow = document.getElementById("chatbotWindow");
const chatbotClose = document.getElementById("chatbotClose");

const chatbotForm = document.getElementById("chatbotForm");
const chatbotInput = document.getElementById("chatbotInput");
const chatbotMessages = document.getElementById("chatbotMessages");
const chatbotSend = document.getElementById("chatbotSend");
const chatbotStatus = document.getElementById("chatbotStatus");
const chatbotFooter = document.querySelector(".chatbot-footer");

const suggestionButtons = document.querySelectorAll(".chat-suggestion");

// Backend API URL
const CHAT_API_URL = "http://localhost:5000/api/chat";

// Store conversation history
let conversationHistory = [];

function setChatbotOpen(isOpen) {
    if (!chatbotWindow || !chatbotLauncher || !chatbotWidget) {
        console.error("Chatbot elements not found!");
        return;
    }

    chatbotWindow.classList.toggle("active", isOpen);
    chatbotWidget.classList.toggle("is-open", isOpen);

    chatbotLauncher.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    chatbotWindow.setAttribute(
        "aria-hidden",
        String(!isOpen)
    );

    if (isOpen && chatbotInput) {
        chatbotInput.focus();
    }

    if (!isOpen) {
        chatbotLauncher.focus();
    }

    console.log("Chatbot open:", isOpen);
}

chatbotLauncher.addEventListener("click", () => {
    setChatbotOpen(true);
});

chatbotClose.addEventListener("click", () => {
    setChatbotOpen(false);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chatbotWindow.classList.contains("active")) {
        setChatbotOpen(false);
    }
});

// Display message
function displayMessage(message, sender) {
    const messageElement = document.createElement("div");

    messageElement.classList.add(
        sender === "user" ? "user-message" : "bot-message"
    );

    // textContent keeps messages safe from HTML injection
    messageElement.textContent = message;

    chatbotMessages.appendChild(messageElement);

    // Scroll to latest message
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Show loading message
function showTyping() {
    const typingElement = document.createElement("div");

    typingElement.className = "bot-message";
    typingElement.id = "chatbotTyping";
    typingElement.textContent = "Smart Academy is typing...";

    chatbotMessages.appendChild(typingElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Remove loading message
function removeTyping() {
    const typingElement = document.getElementById("chatbotTyping");

    if (typingElement) {
        typingElement.remove();
    }
}

// Send message to AI
async function sendChatMessage(message) {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    // Show user message
    displayMessage(cleanMessage, "user");

    // Save user message
    conversationHistory.push({
        role: "user",
        content: cleanMessage
    });

    chatbotInput.value = "";
    chatbotSend.disabled = true;

    showTyping();

    try {
        const response = await fetch(CHAT_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error("The chat server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(data.error || "Server error");
        }

        if (!data.reply) {
            throw new Error("The AI returned an empty response.");
        }

        // Save AI response
        conversationHistory.push({
            role: "assistant",
            content: data.reply
        });

        if (chatbotStatus) {
            chatbotStatus.textContent = data.mode === "offline"
                ? "Offline help"
                : "Online Assistant";
            const statusIndicator = chatbotStatus.previousElementSibling;
            if (statusIndicator) {
                statusIndicator.classList.toggle("offline", data.mode === "offline");
            }
        }
        if (chatbotFooter) {
            chatbotFooter.textContent = data.mode === "offline"
                ? "Showing answers from website information"
                : "Powered by Smart Academy AI";
        }

        removeTyping();

        // Display AI response
        displayMessage(data.reply, "bot");

    } catch (error) {
        console.error("Chatbot error:", error);

        removeTyping();

        const errorMessage = error instanceof TypeError
            ? "I can't connect to the chat server. Please make sure the chatbot backend is running, then try again."
            : error.message;
        displayMessage(errorMessage, "bot");

        let failedMessageIndex = conversationHistory.length - 1;
        while (
            failedMessageIndex >= 0 &&
            (conversationHistory[failedMessageIndex].role !== "user" ||
                conversationHistory[failedMessageIndex].content !== cleanMessage)
        ) {
            failedMessageIndex -= 1;
        }
        if (failedMessageIndex !== -1) {
            conversationHistory.splice(failedMessageIndex, 1);
        }

    } finally {
        chatbotSend.disabled = false;
        chatbotInput.focus();
    }
}

// Handle form submission
chatbotForm.addEventListener("submit", (event) => {
    event.preventDefault();

    sendChatMessage(chatbotInput.value);
});

// Handle suggestion buttons
suggestionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        sendChatMessage(button.textContent);
    });
});
