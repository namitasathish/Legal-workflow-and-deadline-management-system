// frontend/js/app.js
// All the JavaScript magic for the main user-facing page

const API_BASE = 'http://localhost:5000/api';

// ──────────────────────────────────────────────────────────
// NAVBAR: Add scrolled shadow effect
// ──────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.style.boxShadow = window.scrollY > 20
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 2px 12px rgba(0,0,0,0.3)';
  }
});

// ──────────────────────────────────────────────────────────
// HELPER: Smooth scroll to a section
// ──────────────────────────────────────────────────────────
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ──────────────────────────────────────────────────────────
// HELPER: Show result in a box
// ──────────────────────────────────────────────────────────
function showResult(elementId, html, type = 'success') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = html;
  el.className = `result-box ${type}`;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResult(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

function showLoader(loaderId) {
  const el = document.getElementById(loaderId);
  if (el) el.style.display = 'flex';
}

function hideLoader(loaderId) {
  const el = document.getElementById(loaderId);
  if (el) el.style.display = 'none';
}

// ──────────────────────────────────────────────────────────
// DEMO: Fill case ID for demonstration
// ──────────────────────────────────────────────────────────
function fillDemo(caseId) {
  document.getElementById('caseId').value = caseId;
  trackCase();
}

// ──────────────────────────────────────────────────────────
// TRACK CASE: Fetch case status from backend
// ──────────────────────────────────────────────────────────
async function trackCase() {
  const caseId = document.getElementById('caseId').value.trim();

  if (!caseId) {
    showResult('trackResult', '⚠️ Please enter a Case ID before clicking Track.', 'error');
    return;
  }

  hideResult('trackResult');
  showLoader('trackLoader');

  try {
    const response = await fetch(`${API_BASE}/case/${caseId}`);
    const result = await response.json();
    hideLoader('trackLoader');

    if (result.success) {
      const d = result.data;
      const statusClass = `status-${d.status.split(' ')[0]}`;
      showResult('trackResult', `
        <div style="margin-bottom: 0.75rem;">
          <strong>✅ Case Found!</strong> Here are the details:
        </div>
        <div class="case-result-grid">
          <div class="case-result-item">
            <span class="case-result-label">Case ID</span>
            <span class="case-result-value" style="font-family:monospace;font-size:0.78rem;">${d.caseId}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Status</span>
            <span class="status-badge ${statusClass}">${d.status}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Category</span>
            <span class="case-result-value">${d.category}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Court</span>
            <span class="case-result-value">${d.court}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Judge</span>
            <span class="case-result-value">${d.judge}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Next Hearing</span>
            <span class="case-result-value">${d.hearingDate}</span>
          </div>
          <div class="case-result-item" style="grid-column: span 2;">
            <span class="case-result-label">Next Action</span>
            <span class="case-result-value">${d.nextAction}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Filed On</span>
            <span class="case-result-value">${d.filedAt}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Last Updated</span>
            <span class="case-result-value">${d.lastUpdated}</span>
          </div>
        </div>
      `, 'success');
    } else {
      showResult('trackResult', `
        <strong>❌ ${result.message}</strong><br/>
        <small>Make sure you have the correct Case ID. It was provided when you filed your complaint.</small>
      `, 'error');
    }
  } catch (err) {
    hideLoader('trackLoader');
    showResult('trackResult', `
      ⚠️ <strong>Could not connect to the server.</strong><br/>
      Make sure the backend is running at <code>${API_BASE}</code>.<br/>
      <small>Run: <code>cd backend && npm start</code></small>
    `, 'error');
  }
}

// Allow pressing Enter in the case ID input
document.addEventListener('DOMContentLoaded', () => {
  const caseInput = document.getElementById('caseId');
  if (caseInput) {
    caseInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') trackCase();
    });
  }

  // Char counters
  setupCharCounter('caseTitle', 'titleCount', 200);
  setupCharCounter('description', 'descCount', 2000);
});

function setupCharCounter(inputId, countId, max) {
  const el = document.getElementById(inputId);
  const counter = document.getElementById(countId);
  if (!el || !counter) return;
  el.addEventListener('input', () => {
    counter.textContent = `${el.value.length}/${max}`;
  });
}

// ──────────────────────────────────────────────────────────
// FILE CASE: Submit anonymous complaint to backend
// ──────────────────────────────────────────────────────────
async function fileCase() {
  const title = document.getElementById('caseTitle').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value;
  const complainantName = document.getElementById('complainantName').value.trim();

  // Frontend validation
  if (!title) {
    showResult('fileResult', '⚠️ Please give your complaint a title.', 'error');
    document.getElementById('caseTitle').focus();
    return;
  }

  if (title.length < 5) {
    showResult('fileResult', '⚠️ Title is too short. Please be a bit more descriptive.', 'error');
    return;
  }

  if (!description) {
    showResult('fileResult', '⚠️ Please describe what happened in the complaint description.', 'error');
    document.getElementById('description').focus();
    return;
  }

  if (description.length < 20) {
    showResult('fileResult', '⚠️ Description is too short. Please provide at least 20 characters.', 'error');
    return;
  }

  if (!category) {
    showResult('fileResult', '⚠️ Please select a category for your complaint.', 'error');
    return;
  }

  hideResult('fileResult');
  showLoader('fileLoader');

  try {
    const response = await fetch(`${API_BASE}/file-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, complainantName }),
    });

    const result = await response.json();
    hideLoader('fileLoader');

    if (result.success) {
      const d = result.data;
      showResult('fileResult', `
        <div style="margin-bottom:1rem;">
          <strong>🎉 Complaint Filed Successfully!</strong><br/>
          <small>Please save your Case ID — it is the <strong>only way</strong> to track your complaint.</small>
        </div>
        <div style="background:rgba(255,255,255,0.6); border-radius:8px; padding:1rem; margin:1rem 0;">
          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.5rem; opacity:0.7;">Your Case ID (SAVE THIS!)</div>
          <div style="font-family:monospace; font-size:1.2rem; font-weight:800; letter-spacing:1px; color:#14532d;">${d.caseId}</div>
        </div>
        <div class="case-result-grid">
          <div class="case-result-item">
            <span class="case-result-label">Status</span>
            <span class="status-badge status-Pending">${d.status}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Court Assigned</span>
            <span class="case-result-value">${d.court}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Filed On</span>
            <span class="case-result-value">${d.filedAt}</span>
          </div>
          <div class="case-result-item">
            <span class="case-result-label">Expected Hearing</span>
            <span class="case-result-value">${d.expectedHearing}</span>
          </div>
        </div>
        <div style="margin-top:1rem; font-size:0.8rem; opacity:0.8;">
          🔒 ${d.importantNote}
        </div>
      `, 'success');
      clearForm();
    } else {
      showResult('fileResult', `❌ <strong>${result.message}</strong>`, 'error');
    }
  } catch (err) {
    hideLoader('fileLoader');
    showResult('fileResult', `
      ⚠️ <strong>Could not connect to the server.</strong><br/>
      Make sure the backend is running.<br/>
      <small>Run: <code>cd backend && npm start</code></small>
    `, 'error');
  }
}

// ──────────────────────────────────────────────────────────
// CLEAR FORM
// ──────────────────────────────────────────────────────────
function clearForm() {
  ['caseTitle', 'description', 'category', 'complainantName'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('titleCount').textContent = '0/200';
  document.getElementById('descCount').textContent = '0/2000';
}
