import { renderDashboard } from './views/dashboard.js';
import { renderVault } from './views/vault.js';
import { initChat } from './views/chat.js';

// 1. AUTH CHECK
const LOGIN_URL = "http://129.151.181.87:8009";

function checkAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    
    if (urlToken) {
        localStorage.setItem("access_token", urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = LOGIN_URL;
        return false;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.sub || payload.email || "U";
        document.querySelector(".avatar").textContent = email.substring(0, 2).toUpperCase();
        return true;
    } catch (e) {
        localStorage.removeItem("access_token");
        window.location.href = LOGIN_URL;
        return false;
    }
}

// 2. ROUTER
const routes = {
    "dashboard": renderDashboard,
    "vault": renderVault,
    "tenders": () => {
        document.getElementById("app-view").innerHTML = `<div class="view-header"><h1>Matched Tenders</h1><p>Loading...</p></div>`;
        // We will add the tenders view later
    }
};

function navigate(viewName) {
    // Update active nav button
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.view === viewName) btn.classList.add("active");
    });

    // Render the view
    if (routes[viewName]) {
        routes[viewName]();
    }
}

// 3. THEME TOGGLE
function initTheme() {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);

    document.getElementById("theme-toggle").addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const newTheme = isDark ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    });
}

// 4. BOOTSTRAP APP
window.addEventListener("DOMContentLoaded", () => {
    if (!checkAuth()) return;

    initTheme();
    initChat();

    // Attach click listeners to sidebar
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => navigate(btn.dataset.view));
    });

    // Load default view
    navigate("dashboard");
});