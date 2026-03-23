import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';

function escapeHtml(value) {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN');
}

function formatMoney(value) {
  const num = Number(value || 0);
  try {
    return `₹${num.toLocaleString()}`;
  } catch {
    return `₹${num}`;
  }
}

function buildCaseSummaryText({
  caseData,
  clientName,
  tasks,
  milestones,
  docRequests,
  appointments,
  payments,
  viewerName,
}) {
  const c = caseData || {};
  const title = c.case_title || 'Untitled Case';

  const header = [
    'LegalWorkflow - Case Summary',
    `Exported by: ${viewerName || 'User'}`,
    `Generated: ${new Date().toLocaleString('en-IN')}`,
    '',
    `Case: ${title}`,
    `Priority: ${(c.priority || 'Medium').toUpperCase()}`,
    `Status: ${c.status || 'N/A'}`,
    `Court: ${c.court_name || 'N/A'}`,
    `Filing Date: ${formatDate(c.filing_date)}`,
    `Next Hearing: ${formatDate(c.next_hearing_date)}`,
    `Deadline: ${formatDate(c.deadline_date)}`,
    `Client: ${clientName || 'Unlinked'}`,
  ];

  const notes = c.notes ? [``, 'Lawyer Notes:', c.notes] : [];

  const taskLines = (tasks || []).length
    ? [
        '',
        'Checklist / Tasks:',
        ...(tasks || []).map((t) => {
          const done = t.completed ? '✓' : '⏳';
          const due = t.due_date ? ` | Due: ${formatDate(t.due_date)}` : '';
          return `- ${done} ${t.title || 'Untitled task'}${due}`;
        }),
      ]
    : ['', 'Checklist / Tasks: None'];

  const milestoneLines = (milestones || []).length
    ? [
        '',
        'Case Timeline / Milestones:',
        ...(milestones || []).map((m) => {
          const date = m.milestone_date ? formatDate(m.milestone_date) : 'N/A';
          return `- ${m.icon || '📌'} ${m.title || 'Untitled'} (${date})${m.description ? `: ${m.description}` : ''}`;
        }),
      ]
    : ['', 'Case Timeline / Milestones: None'];

  const docRequestLines = (docRequests || []).length
    ? [
        '',
        'Document Requests:',
        ...(docRequests || []).map((dr) => {
          const uploaded = dr.doc_name ? ` | Uploaded: ${dr.doc_name}` : '';
          return `- ${dr.title || 'Untitled'} | Status: ${dr.status || 'N/A'}${uploaded}`;
        }),
      ]
    : ['', 'Document Requests: None'];

  const appointmentLines = (appointments || []).length
    ? [
        '',
        'Appointments:',
        ...(appointments || []).map((a) => {
          const date = a.appointment_date ? formatDate(a.appointment_date) : 'N/A';
          return `- ${a.title || 'Appointment'} | ${date} | Status: ${a.status || 'N/A'}`;
        }),
      ]
    : ['', 'Appointments: None'];

  const paymentsSafe = payments || [];
  const paymentLines = paymentsSafe.length
    ? [
        '',
        'Payments:',
        ...(paymentsSafe || []).map((p) => {
          return `- ${p.status || 'N/A'} | ${formatMoney(p.amount)} | ${p.description || 'No description'}${p.due_date ? ` | Due: ${formatDate(p.due_date)}` : ''}${p.paid_date ? ` | Paid: ${formatDate(p.paid_date)}` : ''}`;
        }),
      ]
    : ['', 'Payments: None'];

  return [...header, ...notes, ...taskLines, ...milestoneLines, ...docRequestLines, ...appointmentLines, ...paymentLines].join(
    '\n'
  );
}

export async function generateCaseSummaryExportFiles({
  caseData,
  clientName,
  tasks,
  milestones,
  docRequests,
  appointments,
  payments,
  viewerName,
}) {
  const text = buildCaseSummaryText({
    caseData,
    clientName,
    tasks,
    milestones,
    docRequests,
    appointments,
    payments,
    viewerName,
  });

  const safeTitle = (caseData?.case_title || 'case_summary').replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
  const ts = Date.now();
  const txtFile = new File(Paths.cache, `${safeTitle}_${ts}.txt`);
  txtFile.write(text);

  const html = `
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; padding: 24px; color: #111827;">
        <h2 style="margin: 0 0 12px 0;">LegalWorkflow - Case Summary</h2>
        <p style="margin: 0 0 18px 0; color: #6b7280; font-size: 12px;">Generated: ${escapeHtml(
          new Date().toLocaleString('en-IN')
        )}</p>
        <pre style="white-space: pre-wrap; font-size: 12px; line-height: 1.4;">${escapeHtml(text)}</pre>
      </body>
    </html>
  `;

  const result = await Print.printToFileAsync({
    html,
    width: 612,
    height: 792,
  });

  // Prefer expo-print generated uri; txt uses our explicit cache path.
  return { pdfUri: result.uri, txtUri: txtFile.uri };
}

