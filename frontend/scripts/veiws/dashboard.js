import { fetchOverview } from '../api.js';

export async function renderDashboard() {
    const container = document.getElementById("app-view");
    container.innerHTML = `<div class="view-header"><h1>Loading your readiness...</h1></div>`;

    try {
        const data = await fetchOverview();

        // Determine score color
        let scoreClass = "mid";
        if (data.readiness.score >= 85) scoreClass = "high";
        else if (data.readiness.score < 60) scoreClass = "low";

        // Build actions HTML
        const actionsHtml = (data.actions || []).map(a => `
            <li class="action-item ${a.priority}">
                <div>
                    <strong>${a.title}</strong>
                    <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">${a.detail}</p>
                </div>
            </li>
        `).join("");

        // Build AI Summary HTML
        const aiSummary = data.ai_summary 
            ? `<p style="margin-bottom:16px;">${data.ai_summary}</p>` 
            : `<p style="color:var(--text-muted);">Upload more documents to get AI advice.</p>`;

        container.innerHTML = `
            <div class="view-header">
                <h1>Welcome back</h1>
                <p>Here is your tender readiness overview.</p>
            </div>

            <div class="dashboard-grid">
                <!-- Readiness Score -->
                <div class="card">
                    <div class="card-title">Readiness Score</div>
                    <div class="readiness-score">
                        <div class="score-circle ${scoreClass}">${data.readiness.score}%</div>
                        <div class="score-label">${data.readiness.label}</div>
                    </div>
                    <div style="display:flex; justify-content:space-around; text-align:center; margin-top:16px;">
                        <div><strong>${data.readiness.verified}</strong><br><span style="font-size:12px; color:var(--success);">Verified</span></div>
                        <div><strong>${data.readiness.attention}</strong><br><span style="font-size:12px; color:var(--warning);">Attention</span></div>
                        <div><strong>${data.readiness.missing}</strong><br><span style="font-size:12px; color:var(--danger);">Missing</span></div>
                    </div>
                </div>

                <!-- AI Insights -->
                <div class="card">
                    <div class="card-title">AI Insights</div>
                    ${aiSummary}
                </div>

                <!-- Action Plan -->
                <div class="card" style="grid-column: 1 / -1;">
                    <div class="card-title">Action Plan</div>
                    ${actionsHtml ? `<ul class="action-list">${actionsHtml}</ul>` : `<p style="color:var(--success);">You are fully compliant! Ready to bid.</p>`}
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="view-header"><h1>Error</h1><p>Could not connect to the agent. Make sure your token is valid.</p></div>`;
    }
}