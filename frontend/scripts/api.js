const AGENT_URL = "http://129.151.181.87:9000";

function getToken() {
    return localStorage.getItem("access_token") || "";
}

export async function fetchOverview() {
    const res = await fetch(`${AGENT_URL}/agent/overview`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to fetch overview");
    return res.json();
}

export async function uploadDocument(file, docType) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    const res = await fetch(`${AGENT_URL}/agent/vault/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` },
        body: formData
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
}

export async function sendChatMessage(message) {
    const res = await fetch(`${AGENT_URL}/agent/chat`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ message, session_id: "ui-session" })
    });
    if (!res.ok) throw new Error("Chat failed");
    return res.json();
}

export async function fetchTenders() {
    const res = await fetch(`${AGENT_URL}/agent/tenders`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to fetch tenders");
    return res.json();
}