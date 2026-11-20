import { fetchOverview, uploadDocument } from '../api.js';

export async function renderVault() {
    const container = document.getElementById("app-view");
    container.innerHTML = `<div class="view-header"><h1>Loading vault...</h1></div>`;

    try {
        const data = await fetchOverview();
        const checklist = data.checklist || [];

        const listHtml = checklist.map(item => {
            const badgeClass = item.level === "verified" ? "verified" : 
                               item.level === "missing" ? "missing" : 
                               item.level === "processing" ? "processing" : "attention";
            
            const badgeText = item.level.toUpperCase();

            return `
                <div class="vault-item">
                    <div class="vault-icon"><img src="icons/doc.svg" alt="Doc"></div>
                    <div class="vault-info">
                        <h3>${item.label}</h3>
                        <p>${item.hint}</p>
                    </div>
                    <div class="badge ${badgeClass}">${badgeText}</div>
                    <label style="cursor:pointer; padding: 8px 12px; background: var(--primary); color: white; border-radius: 6px; font-size: 12px;">
                        Upload
                        <input type="file" style="display:none;" onchange="window.uploadDoc(event, '${item.key}')">
                    </label>
                </div>
            `;
        }).join("");

        container.innerHTML = `
            <div class="view-header">
                <h1>Document Vault</h1>
                <p>Upload your compliance documents here. The AI will verify them.</p>
            </div>
            <div class="vault-grid">
                ${listHtml}
            </div>
        `;

        // Attach upload function to window for inline HTML access
        window.uploadDoc = async (event, docType) => {
            const file = event.target.files[0];
            if (!file) return;

            // Show loading state
            event.target.parentElement.innerHTML = "Uploading...";

            try {
                await uploadDocument(file, docType);
                // Re-render to show 'processing' status
                renderVault();
            } catch (e) {
                alert("Upload failed. Check console.");
            }
        };

    } catch (e) {
        container.innerHTML = `<div class="view-header"><h1>Error</h1><p>Could not load vault.</p></div>`;
    }
}