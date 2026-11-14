import { sendChatMessage } from '../api.js';
import { parseMarkdown } from '../utils.js';

export function initChat() {
    const toggleBtn = document.getElementById("chat-toggle");
    const closeBtn = document.getElementById("close-chat");
    const chatWindow = document.getElementById("chat-window");
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("chat-send");
    const messagesBox = document.getElementById("chat-messages");

    toggleBtn.addEventListener("click", () => chatWindow.classList.toggle("hidden"));
    closeBtn.addEventListener("click", () => chatWindow.classList.add("hidden"));

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;
        
        input.value = "";
        messagesBox.innerHTML += `<div class="msg user">${text}</div>`;
        messagesBox.scrollTop = messagesBox.scrollHeight;

        const loadingId = "load-" + Date.now();
        messagesBox.innerHTML += `<div class="msg agent" id="${loadingId}">Thinking...</div>`;
        messagesBox.scrollTop = messagesBox.scrollHeight;

        try {
            const res = await sendChatMessage(text);
            document.getElementById(loadingId).innerHTML = parseMarkdown(res.response);
        } catch (e) {
            document.getElementById(loadingId).innerHTML = "Error connecting to agent.";
        }
        messagesBox.scrollTop = messagesBox.scrollHeight;
    };

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
}