import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb, makeId } from '../database/db';
import { getUrgentCases, getWeeklyCases, getTodayCases } from '../utils/deadlineEngine';
import { hashPassword, verifyPassword } from '../utils/crypto';
import {
  requestNotificationPermission,
  scheduleCaseAlerts,
  cancelCaseAlerts,
} from '../utils/notifications';

const AppContext = createContext(null);
const USER_SESSION_KEY = '@lawyer_session';

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);

  // -------- AUTH LOGIC (role-aware) --------
  const register = useCallback(async (name, email, password, role = 'lawyer') => {
    const db = await getDb();
    const id = makeId('u');
    const now = new Date().toISOString();
    let linked_client_id = null;

    if (role === 'client') {
      // Look up existing client record by email
      const clientRow = await db.getFirstAsync(
        'SELECT id FROM clients WHERE LOWER(email) = ?',
        [email.trim().toLowerCase()]
      );
      if (!clientRow) {
        return { success: false, error: 'Your lawyer has not added your profile yet. Please ask your lawyer to add your email in their Clients section first.' };
      }
      linked_client_id = clientRow.id;
    }

    try {
      const hashedPwd = hashPassword(password);
      await db.runAsync(
        'INSERT INTO users (id, name, email, password, created_at, role, linked_client_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name.trim(), email.trim().toLowerCase(), hashedPwd, now, role, linked_client_id]
      );
      const newUser = { id, name, email: email.trim().toLowerCase(), role, linked_client_id };
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch (e) {
      console.warn('Register error', e);
      return { success: false, error: 'Email already exists or database error.' };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const db = await getDb();
    try {
      const safeEmail = email.trim().toLowerCase();
      // Failsafe: if this is a demo account, ensure its password is reset to 'password123'
      // in case a previous hashing migration corrupted it locally.
      if (safeEmail === 'demo@gmail.com' || safeEmail === 'demo_client@gmail.com') {
        await db.runAsync("UPDATE users SET password = 'password123' WHERE email = ?", [safeEmail]);
      }

      const u = await db.getFirstAsync(
        'SELECT id, name, email, password, role, linked_client_id FROM users WHERE email = ?',
        [safeEmail]
      );
      if (u && verifyPassword(password, u.password)) {
        const sessionUser = { id: u.id, name: u.name, email: u.email, role: u.role || 'lawyer', linked_client_id: u.linked_client_id };
        await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password.' };
    } catch (e) {
      console.warn('Login error', e);
      return { success: false, error: 'Technical error during login.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    setUser(null);
  }, []);

  // -------- ACTIVITY LOG HELPER --------
  const logActivity = useCallback(async (entityType, entityId, action, description) => {
    try {
      const db = await getDb();
      await db.runAsync(
        'INSERT INTO activity_log (id, entity_type, entity_id, action, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [makeId('log'), entityType, entityId, action, description || '', new Date().toISOString()]
      );
    } catch (e) {
      console.warn('logActivity error', e);
    }
  }, []);

  /**
   * Load session and all core entities from SQLite.
   */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load Session
      const saved = await AsyncStorage.getItem(USER_SESSION_KEY);
      if (saved) setUser(JSON.parse(saved));

      // 2. Load Data
      const db = await getDb();
      const c = await db.getAllAsync(
        `SELECT * FROM cases ORDER BY datetime(updated_at) DESC`
      );
      const cl = await db.getAllAsync(
        `SELECT * FROM clients ORDER BY lower(name) ASC`
      );
      const t = await db.getAllAsync(
        `SELECT * FROM tasks ORDER BY completed ASC, datetime(due_date) ASC`
      );
      setCases(c ?? []);
      setClients(cl ?? []);
      setTasks(t ?? []);
    } catch (e) {
      console.error('loadAll error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // -------- CASE CRUD --------
  const createCase = useCallback(
    async (payload) => {
      const db = await getDb();
      const now = new Date().toISOString();
      const id = payload.id || makeId('case');
      await db.runAsync(
        `INSERT INTO cases (
          id, case_title, court_name, client_id,
          filing_date, next_hearing_date, deadline_date,
          priority, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          payload.case_title?.trim() || '',
          payload.court_name?.trim() || '',
          payload.client_id || null,
          payload.filing_date || null,
          payload.next_hearing_date || null,
          payload.deadline_date || null,
          payload.priority || 'Medium',
          payload.status || 'Open',
          payload.notes?.trim() || '',
          now,
          now,
        ]
      );

      await requestNotificationPermission().catch(() => { });
      await scheduleCaseAlerts({ ...payload, id }).catch(() => { });
      await logActivity('case', id, 'created', `Created case: ${payload.case_title?.trim() || 'Untitled'}`);
      await loadAll();
      return id;
    },
    [loadAll, logActivity]
  );

  const updateCase = useCallback(
    async (caseId, updates) => {
      const db = await getDb();
      const now = new Date().toISOString();
      const existing = await db.getFirstAsync('SELECT * FROM cases WHERE id = ?', caseId);
      if (!existing) return;

      const merged = { ...existing, ...updates, updated_at: now };
      await db.runAsync(
        `UPDATE cases SET
          case_title = ?, court_name = ?, client_id = ?,
          filing_date = ?, next_hearing_date = ?, deadline_date = ?,
          priority = ?, status = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
        [
          merged.case_title?.trim() || '',
          merged.court_name?.trim() || '',
          merged.client_id || null,
          merged.filing_date || null,
          merged.next_hearing_date || null,
          merged.deadline_date || null,
          merged.priority || 'Medium',
          merged.status || 'Open',
          merged.notes?.trim() || '',
          now,
          caseId,
        ]
      );

      await cancelCaseAlerts(caseId).catch(() => { });
      await requestNotificationPermission().catch(() => { });
      await scheduleCaseAlerts(merged).catch(() => { });
      await logActivity('case', caseId, 'updated', `Updated case: ${merged.case_title?.trim() || ''}`);
      await loadAll();
    },
    [loadAll, logActivity]
  );

  const deleteCase = useCallback(
    async (caseId) => {
      const db = await getDb();
      const c = await db.getFirstAsync('SELECT case_title FROM cases WHERE id = ?', caseId);
      await cancelCaseAlerts(caseId).catch(() => { });
      await db.runAsync('DELETE FROM cases WHERE id = ?', [caseId]);
      await logActivity('case', caseId, 'deleted', `Deleted case: ${c?.case_title || caseId}`);
      await loadAll();
    },
    [loadAll, logActivity]
  );

  const closeCase = useCallback(
    async (caseId, delay_notes = '', outcome = '') => {
      const db = await getDb();
      const c = await db.getFirstAsync('SELECT * FROM cases WHERE id = ?', caseId);
      if (!c) return;
      const now = new Date().toISOString();
      const start = c.created_at ? new Date(c.created_at) : new Date();
      const end = new Date();
      const durationDays = Math.max(
        0,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      await db.runAsync('UPDATE cases SET status = ?, updated_at = ? WHERE id = ?', [
        'Closed',
        now,
        caseId,
      ]);
      await db.runAsync(
        'INSERT INTO closed_cases (id, case_id, duration_days, delay_notes, close_date, outcome) VALUES (?, ?, ?, ?, ?, ?)',
        [makeId('closed'), caseId, durationDays, delay_notes?.trim() || '', now, outcome || '']
      );
      await cancelCaseAlerts(caseId).catch(() => { });
      await logActivity('case', caseId, 'closed', `Closed case: ${c.case_title} (${durationDays} days, ${outcome || 'no outcome'})`);
      await loadAll();
    },
    [loadAll, logActivity]
  );

  // -------- CLIENT CRUD --------
  const createClient = useCallback(
    async (payload) => {
      const db = await getDb();
      const id = payload.id || makeId('client');
      await db.runAsync(
        `INSERT INTO clients (id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          payload.name?.trim() || '',
          payload.phone?.trim() || '',
          payload.email?.trim() || '',
          payload.address?.trim() || '',
        ]
      );
      await logActivity('client', id, 'created', `Added client: ${payload.name?.trim() || ''}`);
      await loadAll();
      return id;
    },
    [loadAll, logActivity]
  );

  const updateClient = useCallback(
    async (clientId, updates) => {
      const db = await getDb();
      const existing = await db.getFirstAsync('SELECT * FROM clients WHERE id = ?', clientId);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      await db.runAsync(
        `UPDATE clients SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?`,
        [
          merged.name?.trim() || '',
          merged.phone?.trim() || '',
          merged.email?.trim() || '',
          merged.address?.trim() || '',
          clientId,
        ]
      );
      await logActivity('client', clientId, 'updated', `Updated client: ${merged.name?.trim() || ''}`);
      await loadAll();
    },
    [loadAll, logActivity]
  );

  const deleteClient = useCallback(
    async (clientId) => {
      const db = await getDb();
      const cl = await db.getFirstAsync('SELECT name FROM clients WHERE id = ?', clientId);
      await db.runAsync('DELETE FROM clients WHERE id = ?', [clientId]);
      await logActivity('client', clientId, 'deleted', `Deleted client: ${cl?.name || clientId}`);
      await loadAll();
    },
    [loadAll, logActivity]
  );

  // -------- TASK CRUD --------
  const addTask = useCallback(
    async (caseId, payload) => {
      const db = await getDb();
      const id = payload.id || makeId('task');
      await db.runAsync(
        `INSERT INTO tasks (id, case_id, title, due_date, completed, reminder_set) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          caseId,
          payload.title?.trim() || '',
          payload.due_date || null,
          payload.completed ? 1 : 0,
          payload.reminder_set ? 1 : 0,
        ]
      );
      await logActivity('task', id, 'created', `Added task: ${payload.title?.trim() || ''}`);
      await loadAll();
      return id;
    },
    [loadAll, logActivity]
  );

  const setTaskCompleted = useCallback(
    async (taskId, completed) => {
      const db = await getDb();
      await db.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, taskId]);
      const t = await db.getFirstAsync('SELECT title FROM tasks WHERE id = ?', taskId);
      await logActivity('task', taskId, completed ? 'completed' : 'reopened', `${completed ? 'Completed' : 'Reopened'} task: ${t?.title || taskId}`);
      await loadAll();
    },
    [loadAll, logActivity]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      const db = await getDb();
      const t = await db.getFirstAsync('SELECT title FROM tasks WHERE id = ?', taskId);
      await db.runAsync('DELETE FROM tasks WHERE id = ?', [taskId]);
      await logActivity('task', taskId, 'deleted', `Deleted task: ${t?.title || taskId}`);
      await loadAll();
    },
    [loadAll, logActivity]
  );

  // -------- CLIENT INTERACTIONS (CRM) --------
  const addInteraction = useCallback(
    async (clientId, payload) => {
      const db = await getDb();
      const id = makeId('interaction');
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO client_interactions (id, client_id, type, summary, interaction_date, follow_up_date, follow_up_done, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          clientId,
          payload.type || 'note',
          payload.summary?.trim() || '',
          payload.interaction_date || now,
          payload.follow_up_date || null,
          0,
          now,
        ]
      );
      await logActivity('interaction', id, 'created', `Logged ${payload.type}: ${payload.summary?.trim() || ''}`);
      return id;
    },
    [logActivity]
  );

  const getClientInteractions = useCallback(async (clientId) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM client_interactions WHERE client_id = ? ORDER BY datetime(interaction_date) DESC',
      [clientId]
    );
    return rows ?? [];
  }, []);

  const markFollowUpDone = useCallback(async (interactionId) => {
    const db = await getDb();
    await db.runAsync('UPDATE client_interactions SET follow_up_done = 1 WHERE id = ?', [interactionId]);
    await logActivity('interaction', interactionId, 'follow_up_done', 'Follow-up marked as done');
  }, [logActivity]);

  const getPendingFollowUps = useCallback(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT ci.*, c.name as client_name
       FROM client_interactions ci
       LEFT JOIN clients c ON ci.client_id = c.id
       WHERE ci.follow_up_date IS NOT NULL AND ci.follow_up_done = 0
       ORDER BY datetime(ci.follow_up_date) ASC`
    );
    return rows ?? [];
  }, []);

  // -------- ACTIVITY LOG --------
  const getActivityLog = useCallback(async (limit = 50) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM activity_log ORDER BY datetime(timestamp) DESC LIMIT ?',
      [limit]
    );
    return rows ?? [];
  }, []);

  // -------- CLOSED CASE ANALYTICS --------
  const getClosedCaseStats = useCallback(async () => {
    const db = await getDb();
    const all = await db.getAllAsync(
      `SELECT cc.*, cs.case_title, cs.court_name, cs.priority, cs.client_id
       FROM closed_cases cc
       LEFT JOIN cases cs ON cc.case_id = cs.id
       ORDER BY datetime(cc.close_date) DESC`
    );
    const rows = all ?? [];
    const totalClosed = rows.length;
    const avgDuration = totalClosed > 0
      ? Math.round(rows.reduce((s, r) => s + (r.duration_days || 0), 0) / totalClosed)
      : 0;

    // Group by court
    const byCourt = {};
    for (const r of rows) {
      const court = r.court_name || 'Unknown';
      if (!byCourt[court]) byCourt[court] = { count: 0, totalDays: 0 };
      byCourt[court].count++;
      byCourt[court].totalDays += r.duration_days || 0;
    }
    for (const k of Object.keys(byCourt)) {
      byCourt[k].avgDays = Math.round(byCourt[k].totalDays / byCourt[k].count);
    }

    return { rows, totalClosed, avgDuration, byCourt };
  }, []);

  // -------- DOCUMENT REQUESTS --------
  const createDocumentRequest = useCallback(async (caseId, title, description) => {
    const db = await getDb();
    const id = makeId('dreq');
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO document_requests (id, case_id, requested_by, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, caseId, user?.id || '', title.trim(), description?.trim() || '', 'Pending', now, now]
    );
    await logActivity('doc_request', id, 'created', `Requested document: ${title.trim()}`);
    return id;
  }, [user, logActivity]);

  const getDocumentRequests = useCallback(async (caseId) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT dr.*, d.name as doc_name, d.uri as doc_uri FROM document_requests dr LEFT JOIN documents d ON dr.uploaded_doc_id = d.id WHERE dr.case_id = ? ORDER BY datetime(dr.created_at) DESC',
      [caseId]
    );
    return rows ?? [];
  }, []);

  const getClientDocumentRequests = useCallback(async (clientId) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT dr.*, c.case_title, d.name as doc_name
       FROM document_requests dr
       LEFT JOIN cases c ON dr.case_id = c.id
       LEFT JOIN documents d ON dr.uploaded_doc_id = d.id
       WHERE c.client_id = ?
       ORDER BY datetime(dr.created_at) DESC`,
      [clientId]
    );
    return rows ?? [];
  }, []);

  const uploadDocumentForRequest = useCallback(async (requestId, documentId) => {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE document_requests SET status = ?, uploaded_doc_id = ?, updated_at = ? WHERE id = ?',
      ['Uploaded', documentId, now, requestId]
    );
    await logActivity('doc_request', requestId, 'uploaded', 'Client uploaded document');
  }, [logActivity]);

  const acceptDocumentUpload = useCallback(async (requestId) => {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE document_requests SET status = ?, updated_at = ? WHERE id = ?',
      ['Accepted', now, requestId]
    );
    await logActivity('doc_request', requestId, 'accepted', 'Lawyer accepted document');
  }, [logActivity]);

  // -------- IN-APP MESSAGING --------
  const sendMessage = useCallback(async (caseId, body) => {
    const db = await getDb();
    const id = makeId('msg');
    const now = new Date().toISOString();
    try {
      await db.runAsync(
        'INSERT INTO messages (id, case_id, sender_id, sender_role, body, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, caseId, user?.id || '', user?.role || 'lawyer', body.trim(), 0, now]
      );
    } catch (err) {
      console.warn('sendMessage fallback (missing is_read):', err);
      await db.runAsync(
        'INSERT INTO messages (id, case_id, sender_id, sender_role, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, caseId, user?.id || '', user?.role || 'lawyer', body.trim(), now]
      );
    }
    return id;
  }, [user]);

  const markMessagesAsRead = useCallback(async (caseId) => {
    const db = await getDb();
    // Mark messages from the OTHER role as read
    const otherRole = user?.role === 'lawyer' ? 'client' : 'lawyer';
    try {
      await db.runAsync(
        'UPDATE messages SET is_read = 1 WHERE case_id = ? AND sender_role = ?',
        [caseId, otherRole]
      );
    } catch (err) {}
  }, [user]);

  const getUnreadCounts = useCallback(async (caseId) => {
    const db = await getDb();
    const isLawyer = user?.role === 'lawyer';
    const otherRole = isLawyer ? 'client' : 'lawyer';
    
    // 1. Unread Messages
    let msgRow = null;
    try {
      msgRow = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM messages WHERE case_id = ? AND sender_role = ? AND is_read = 0',
        [caseId, otherRole]
      );
    } catch (err) {
      // is_read might not exist if migration failed
      msgRow = { count: 0 };
    }
    
    // 2. Pending Actions (Documents)
    let docRow;
    if (isLawyer) {
      // Lawyer sees documents 'Uploaded' by client as unread
      docRow = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM document_requests WHERE case_id = ? AND status = 'Uploaded'",
        [caseId]
      );
    } else {
      // Client sees 'Pending' requests from lawyer as unread
      docRow = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM document_requests WHERE case_id = ? AND status = 'Pending'",
        [caseId]
      );
    }

    return {
      messages: msgRow?.count || 0,
      documents: docRow?.count || 0,
    };
  }, [user]);

  const getMessages = useCallback(async (caseId) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT m.*, u.name as sender_name FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.case_id = ? ORDER BY datetime(m.created_at) ASC',
      [caseId]
    );
    return rows ?? [];
  }, []);

  // -------- PAYMENT TRACKING --------
  const createPayment = useCallback(async (caseId, clientId, payload) => {
    const db = await getDb();
    const id = makeId('pay');
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO payments (id, case_id, client_id, type, description, amount, status, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, caseId, clientId || null, payload.type || 'fee', payload.description?.trim() || '', payload.amount || 0, 'Pending', payload.due_date || null, now]
    );
    await logActivity('payment', id, 'created', `Added payment: ₹${payload.amount} - ${payload.description?.trim() || ''}`);
    return id;
  }, [logActivity]);

  const getPayments = useCallback(async (caseId) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM payments WHERE case_id = ? ORDER BY datetime(created_at) DESC',
      [caseId]
    );
    return rows ?? [];
  }, []);

  const getClientPayments = useCallback(async (clientId) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT p.*, c.case_title FROM payments p LEFT JOIN cases c ON p.case_id = c.id WHERE p.client_id = ? ORDER BY datetime(p.created_at) DESC`,
      [clientId]
    );
    return rows ?? [];
  }, []);

  const markPaymentPaid = useCallback(async (paymentId) => {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE payments SET status = ?, paid_date = ? WHERE id = ?', ['Paid', now, paymentId]);
    await logActivity('payment', paymentId, 'paid', 'Payment marked as paid');
  }, [logActivity]);

  // -------- CASE MILESTONES --------
  const addMilestone = useCallback(async (caseId, payload) => {
    const db = await getDb();
    const id = makeId('ms');
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO case_milestones (id, case_id, title, description, milestone_date, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, caseId, payload.title?.trim() || '', payload.description?.trim() || '', payload.milestone_date || now, payload.icon || '📌', now]
    );
    await logActivity('milestone', id, 'created', `Added milestone: ${payload.title?.trim() || ''}`);
    return id;
  }, [logActivity]);

  const getMilestones = useCallback(async (caseId) => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM case_milestones WHERE case_id = ? ORDER BY datetime(milestone_date) ASC',
      [caseId]
    );
    return rows ?? [];
  }, []);

  // -------- APPOINTMENTS --------
  const createAppointment = useCallback(async (clientId, payload) => {
    const db = await getDb();
    const id = makeId('appt');
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO appointments (id, client_id, lawyer_id, case_id, title, appointment_date, duration_minutes, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, clientId, payload.lawyer_id || null, payload.case_id || null, payload.title?.trim() || '', payload.appointment_date || '', payload.duration_minutes || 30, 'Requested', payload.notes?.trim() || '', now]
    );
    await logActivity('appointment', id, 'created', `Appointment requested: ${payload.title?.trim() || ''}`);
    return id;
  }, [logActivity]);

  const getAppointments = useCallback(async (filterObj = {}) => {
    const db = await getDb();
    let query = `SELECT a.*, c.name as client_name, cs.case_title
       FROM appointments a
       LEFT JOIN clients c ON a.client_id = c.id
       LEFT JOIN cases cs ON a.case_id = cs.id`;
    const params = [];
    if (filterObj.clientId) {
      query += ' WHERE a.client_id = ?';
      params.push(filterObj.clientId);
    }
    query += ' ORDER BY datetime(a.appointment_date) ASC';
    const rows = await db.getAllAsync(query, params);
    return rows ?? [];
  }, []);

  const updateAppointmentStatus = useCallback(async (appointmentId, status) => {
    const db = await getDb();
    await db.runAsync('UPDATE appointments SET status = ? WHERE id = ?', [status, appointmentId]);
    await logActivity('appointment', appointmentId, 'status_changed', `Appointment ${status.toLowerCase()}`);
  }, [logActivity]);

  // -------- FEEDBACK --------
  const submitFeedback = useCallback(async (caseId, clientId, rating, comment) => {
    const db = await getDb();
    const id = makeId('fb');
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT OR REPLACE INTO feedback (id, case_id, client_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, caseId, clientId, rating, comment?.trim() || '', now]
    );
    await logActivity('feedback', id, 'submitted', `Client rated case ${rating}/5`);
    return id;
  }, [logActivity]);

  const getFeedback = useCallback(async (caseId) => {
    const db = await getDb();
    const row = await db.getFirstAsync('SELECT * FROM feedback WHERE case_id = ?', [caseId]);
    return row || null;
  }, []);

  const getAllFeedback = useCallback(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT f.*, c.case_title, cl.name as client_name
       FROM feedback f
       LEFT JOIN cases c ON f.case_id = c.id
       LEFT JOIN clients cl ON f.client_id = cl.id
       ORDER BY datetime(f.created_at) DESC`
    );
    return rows ?? [];
  }, []);

  // -------- FIR HISTORY --------
  const getFirHistory = useCallback(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT f.*, c.case_title FROM firs f LEFT JOIN cases c ON f.case_id = c.id ORDER BY datetime(f.created_at) DESC`
    );
    return rows ?? [];
  }, []);

  // -------- GLOBAL UNREAD COUNTS --------
  const getGlobalUnreadCounts = useCallback(async () => {
    const db = await getDb();
    const isLawyer = user?.role === 'lawyer';
    const otherRole = isLawyer ? 'client' : 'lawyer';

    // 1. Unread messages
    const msgRow = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM messages WHERE sender_role = ? AND is_read = 0',
      [otherRole]
    );

    // 2. Pending documents
    let docCount = 0;
    if (isLawyer) {
      const docRow = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM document_requests WHERE status = 'Uploaded'"
      );
      docCount = docRow?.count || 0;
    } else {
      const docRow = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM document_requests WHERE status = 'Pending'"
      );
      docCount = docRow?.count || 0;
    }

    // 3. Appointment actions needed
    let apptCount = 0;
    if (isLawyer) {
      // Lawyer sees new appointment requests from clients
      const apptRow = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'Requested'"
      );
      apptCount = apptRow?.count || 0;
    } else {
      // Client sees confirmed appointments (new confirmations)
      const apptRow = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM appointments WHERE status = 'Confirmed'"
      );
      apptCount = apptRow?.count || 0;
    }

    return {
      messages: msgRow?.count || 0,
      documents: docCount,
      appointments: apptCount,
      total: (msgRow?.count || 0) + docCount + apptCount,
    };
  }, [user]);

  // -------- DEADLINE COMPANION --------
  const urgentCases = useMemo(() => getUrgentCases(cases), [cases]);
  const weeklyCases = useMemo(() => getWeeklyCases(cases), [cases]);
  const todayCases = useMemo(() => getTodayCases(cases), [cases]);

  const clientsById = useMemo(() => {
    const map = new Map();
    for (const cl of clients) map.set(cl.id, cl);
    return map;
  }, [clients]);

  const tasksByCaseId = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const list = map.get(t.case_id) || [];
      list.push(t);
      map.set(t.case_id, list);
    }
    return map;
  }, [tasks]);

  const value = {
    loading,
    user,
    cases,
    clients,
    tasks,
    urgentCases,
    weeklyCases,
    todayCases,
    clientsById,
    tasksByCaseId,
    loadAll,
    logActivity,
    // auth
    register,
    login,
    logout,
    // case
    createCase,
    updateCase,
    deleteCase,
    closeCase,
    // client
    createClient,
    updateClient,
    deleteClient,
    // task
    addTask,
    setTaskCompleted,
    deleteTask,
    // CRM
    addInteraction,
    getClientInteractions,
    markFollowUpDone,
    getPendingFollowUps,
    // analytics
    getActivityLog,
    getClosedCaseStats,
    // document requests
    createDocumentRequest,
    getDocumentRequests,
    getClientDocumentRequests,
    uploadDocumentForRequest,
    acceptDocumentUpload,
    // messaging
    sendMessage,
    getMessages,
    markMessagesAsRead,
    getUnreadCounts,
    // payments
    createPayment,
    getPayments,
    getClientPayments,
    markPaymentPaid,
    // milestones
    addMilestone,
    getMilestones,
    // appointments
    createAppointment,
    getAppointments,
    updateAppointmentStatus,
    // feedback
    submitFeedback,
    getFeedback,
    getAllFeedback,
    // FIR history
    getFirHistory,
    // global unread
    getGlobalUnreadCounts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
