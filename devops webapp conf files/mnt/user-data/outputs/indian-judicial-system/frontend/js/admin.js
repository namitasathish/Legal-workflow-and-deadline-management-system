// frontend/js/admin.js
// JavaScript for the Admin Panel — view all filed cases, update status

const API_BASE = 'http://localhost:5000/api';
let currentPage = 1;
let selectedCaseId = '';

// ──────────────────────────────────────────────────────────
// LOAD STATS
// ──────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    const result = await res.json();
    if (result.success) {
      const d = result.data;
      document.getElementById('statTotal').textContent = d.total;
      document.getElementById('statPending').textContent = d.pending;
      document.getElementById('statHearing').textContent = d.hearingScheduled;
      document.getElementById('statClosed').textContent = d.closed;
      document.getElementById('statAnon').textContent = d.anonymous;
    }
  } catch (e) {
    console.warn('Could not load stats:', e.message);
  }
}

// ──────────────────────────────────────────────────────────
// LOAD CASES TABLE
// ──────────────────────────────────────────────────────────
async function loadCases(page = 1) {
  currentPage = page;
  const status = document.getElementById('filterStatus').value;
  const category = document.getElementById('filterCategory').value;

  const tbody = document.getElementById('casesBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-row">⏳ Loading cases...</td></tr>';

  try {
    let url = `${API_BASE}/admin/cases?page=${page}&limit=10`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const res = await fetch(url);
    const result = await res.json();

    if (!result.success) {
      tbody.innerHTML = `<tr><td colspan="8" class="loading-row">❌ ${result.message}</td></tr>`;
      return;
    }

    const { cases, pagination } = result.data;

    if (cases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-row">📭 No cases found matching your filters.</td></tr>';
      renderPagination(pagination);
      return;
    }

    tbody.innerHTML = cases.map(c => `
      <tr>
        <td><span class="case-id-cell">${c.caseId}</span></td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</td>
        <td>${c.category}</td>
        <td>${c.complainantName === 'Anonymous' ? '<em style="color:#94a3b8;">Anonymous</em>' : escapeHtml(c.complainantName)}</td>
        <td><span class="status-badge status-${c.status.split(' ')[0]}">${c.status}</span></td>
        <td style="white-space:nowrap;">${formatDate(c.filedAt)}</td>
        <td>${escapeHtml(c.court)}</td>
        <td>
          <button class="demo-btn" onclick="openModal('${c.caseId}', '${c.status}')">✏️ Update</button>
        </td>
      </tr>
    `).join('');

    renderPagination(pagination);

  } catch (err) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="loading-row">
        ⚠️ Could not connect to backend.<br/>
        <small>Make sure the server is running: <code>cd backend && npm start</code></small>
      </td></tr>
    `;
  }
}

// ──────────────────────────────────────────────────────────
// PAGINATION
// ──────────────────────────────────────────────────────────
function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!pagination || pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= pagination.totalPages; i++) {
    html += `<button class="page-btn ${i === pagination.currentPage ? 'active' : ''}" onclick="loadCases(${i})">${i}</button>`;
  }
  container.innerHTML = `<span style="font-size:0.8rem;color:#64748b;margin-right:0.5rem;">Page ${pagination.currentPage}/${pagination.totalPages}</span>${html}`;
}

// ──────────────────────────────────────────────────────────
// MODAL: Update Case Status
// ──────────────────────────────────────────────────────────
function openModal(caseId, currentStatus) {
  selectedCaseId = caseId;
  document.getElementById('modalCaseId').textContent = `Case: ${caseId}`;
  document.getElementById('newStatus').value = currentStatus;
  document.getElementById('newJudge').value = '';
  document.getElementById('newNextAction').value = '';
  document.getElementById('modalResult').innerHTML = '';
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  selectedCaseId = '';
}

async function updateStatus() {
  const status = document.getElementById('newStatus').value;
  const judge = document.getElementById('newJudge').value.trim();
  const nextAction = document.getElementById('newNextAction').value.trim();
  const resultEl = document.getElementById('modalResult');

  try {
    const res = await fetch(`${API_BASE}/admin/cases/${selectedCaseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, judge, nextAction }),
    });

    const result = await res.json();

    if (result.success) {
      resultEl.innerHTML = `<div style="color:#14532d;font-weight:600;margin-top:0.5rem;">✅ Updated successfully!</div>`;
      setTimeout(() => {
        closeModal();
        loadCases(currentPage);
        loadStats();
      }, 1200);
    } else {
      resultEl.innerHTML = `<div style="color:#7f1d1d;margin-top:0.5rem;">❌ ${result.message}</div>`;
    }
  } catch (err) {
    resultEl.innerHTML = `<div style="color:#7f1d1d;margin-top:0.5rem;">⚠️ Server error. Please try again.</div>`;
  }
}

// Close modal on overlay click
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ──────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ──────────────────────────────────────────────────────────
// INIT: Load everything on page load
// ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadCases();
});
