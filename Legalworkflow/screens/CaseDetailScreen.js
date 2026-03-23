import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import TaskItem from '../components/TaskItem';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import LoadingState from '../components/LoadingState';
import * as Sharing from 'expo-sharing';
import { generateCaseSummaryExportFiles } from '../utils/caseSummaryExport';

// Moved inside component for theme-awareness

export default function CaseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const caseId = route.params?.caseId;

  const {
    user, cases, clientsById, tasksByCaseId,
    deleteCase, closeCase, addTask, setTaskCompleted, deleteTask,
    // Document Requests
    createDocumentRequest, getDocumentRequests, acceptDocumentUpload,
    // Milestones
    addMilestone, getMilestones,
    // Payments
    createPayment, getPayments, markPaymentPaid,
    // Appointments
    getAppointments, createAppointment,
    // Notifications
    getUnreadCounts
  } = useApp();

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const reqStatusColors = useMemo(() => ({
    Pending: { bg: colors.warningLight, text: colors.warning },
    Uploaded: { bg: colors.infoLight, text: colors.info },
    Accepted: { bg: colors.successLight, text: colors.success },
  }), [colors]);

  const c = useMemo(() => cases.find((x) => x.id === caseId) || null, [cases, caseId]);
  const client = c?.client_id ? clientsById.get(c.client_id) : null;
  const caseTasks = tasksByCaseId.get(caseId) || [];
  const isClient = user?.role === 'client';

  const [newTask, setNewTask] = useState('');
  const [delayNotes, setDelayNotes] = useState('');
  const [outcome, setOutcome] = useState('');

  // Document Request state
  const [docRequests, setDocRequests] = useState([]);
  const [showDocReqForm, setShowDocReqForm] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');

  // Notifications
  const [unreadCounts, setUnreadCounts] = useState({ messages: 0, documents: 0 });

  // Milestones
  const [milestones, setMilestones] = useState([]);
  const [showMsForm, setShowMsForm] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msIcon, setMsIcon] = useState('📌');

  // Appointments
  const [appointments, setAppointments] = useState([]);

  const [extrasLoading, setExtrasLoading] = useState(true);

  const [exporting, setExporting] = useState(false);

  // Payments
  const [payments, setPayments] = useState([]);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payDesc, setPayDesc] = useState('');
  const [payAmount, setPayAmount] = useState('');

  // Appointment form state
  const [showApptForm, setShowApptForm] = useState(false);
  const [apptTitle, setApptTitle] = useState('');
  const [apptDateObj, setApptDateObj] = useState(new Date());
  const [showApptDatePicker, setShowApptDatePicker] = useState(false);
  const [showApptTimePicker, setShowApptTimePicker] = useState(false);


  const loadExtras = useCallback(async () => {
    if (!caseId) return;
    try {
      const dr = await getDocumentRequests(caseId);
      setDocRequests(dr || []);
      const ms = await getMilestones(caseId);
      setMilestones(ms || []);
      const pays = await getPayments(caseId);
      setPayments(pays || []);

      const counts = await getUnreadCounts(caseId);
      setUnreadCounts(counts);

      const appts = await getAppointments();
      setAppointments((appts || []).filter(a => a.case_id === caseId));
    } catch (e) { }
    finally {
      setExtrasLoading(false);
    }
  }, [caseId, getDocumentRequests, getMilestones, getPayments, getUnreadCounts, getAppointments]);

  useFocusEffect(
    useCallback(() => {
      loadExtras();
    }, [loadExtras])
  );

  if (!c) {
    return (
      <View style={styles.container}>
        <Header title="Case Detail" showBack onBack={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Case not found.</Text>
        </View>
      </View>
    );
  }

  if (extrasLoading) {
    return <LoadingState message="Loading case details..." />;
  }

  if (exporting) {
    return <LoadingState message="Preparing case export..." />;
  }

  const handleQuickExport = async () => {
    setExporting(true);
    try {
      const viewerName = user?.name || 'User';
      const { pdfUri, txtUri } = await generateCaseSummaryExportFiles({
        caseData: c,
        clientName: client?.name,
        tasks: caseTasks,
        milestones,
        docRequests,
        appointments,
        payments,
        viewerName,
      });

      Alert.alert('Export Case Summary', 'Choose a format to share:', [
        {
          text: 'PDF',
          onPress: async () => {
            await Sharing.shareAsync(pdfUri);
          },
        },
        {
          text: 'Text',
          onPress: async () => {
            await Sharing.shareAsync(txtUri);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (e) {
      Alert.alert('Export failed', 'Unable to generate the case summary right now.');
      // eslint-disable-next-line no-console
      console.warn('case export error', e);
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete Case', 'This will permanently remove the case and all associated tasks. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCase(c.id); navigation.goBack(); } },
    ]);
  };

  const confirmClose = () => {
    if (!outcome) {
      Alert.alert('Outcome Required', 'Please select an outcome before closing the case.');
      return;
    }
    Alert.alert('Close Case', 'Mark this case as resolved and archive it in analytics?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close Case', style: 'default', onPress: async () => { await closeCase(c.id, delayNotes, outcome); } },
    ]);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addTask(c.id, { title: newTask.trim() });
    setNewTask('');
  };

  const handleRequestDoc = async () => {
    if (!reqTitle.trim()) return;
    await createDocumentRequest(caseId, reqTitle, reqDesc);
    setReqTitle('');
    setReqDesc('');
    setShowDocReqForm(false);
    await loadExtras();
  };

  const handleAcceptDoc = async (requestId) => {
    await acceptDocumentUpload(requestId);
    await loadExtras();
  };

  const handleAddMilestone = async () => {
    if (!msTitle.trim()) return;
    await addMilestone(caseId, { title: msTitle, description: msDesc, icon: msIcon });
    setMsTitle('');
    setMsDesc('');
    setMsIcon('📌');
    setShowMsForm(false);
    await loadExtras();
  };

  const handleAddPayment = async () => {
    if (!payDesc.trim() || !payAmount.trim()) return;
    await createPayment(caseId, c.client_id, { description: payDesc, amount: parseFloat(payAmount) || 0 });
    setPayDesc('');
    setPayAmount('');
    setShowPayForm(false);
    await loadExtras();
  };

  const handleMarkPaid = async (paymentId) => {
    await markPaymentPaid(paymentId);
    await loadExtras();
  };

  const handleCreateAppointment = async () => {
    if (!apptTitle.trim()) return;
    const fullDateTime = apptDateObj.toISOString();
    await createAppointment(c.client_id, {
      case_id: caseId,
      title: apptTitle.trim(),
      appointment_date: fullDateTime,
      lawyer_id: user?.id,
    });
    setApptTitle('');
    setApptDateObj(new Date());
    setShowApptForm(false);
    await loadExtras();
    Alert.alert('Success', 'Appointment scheduled and client notified.');
  };

  const MILESTONE_ICONS = ['📌', '📋', '🏛️', '⚖️', '📝', '✅', '🔍', '💼'];

  return (
    <View style={styles.container}>
      <Header
        title="Details"
        showBack
        onBack={() => navigation.goBack()}
        rightAction="Edit"
        onRightPress={() => navigation.navigate('Add Case', { caseId: c.id })}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Case Hero Section */}
        <View style={styles.heroCard}>
          <View style={[styles.priorityTag, c.priority === 'High' ? styles.tagHigh : c.priority === 'Low' ? styles.tagLow : styles.tagMed]}>
            <Text style={[styles.tagText, c.priority === 'High' ? styles.textHigh : c.priority === 'Low' ? styles.textLow : styles.textMed]}>
              {c.priority.toUpperCase()} PRIORITY
            </Text>
          </View>
          <Text style={styles.caseTitle}>{c.case_title}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>CLIENT</Text>
              <Text style={styles.metaValue}>{client?.name || 'Unlinked'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>COURT</Text>
              <Text style={styles.metaValue}>{c.court_name || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.dateBanner}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>DEADLINE</Text>
              <Text style={styles.dateValue}>{c.deadline_date ? String(c.deadline_date).slice(0, 10) : 'None'}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>STATUS</Text>
              <Text style={styles.dateValue}>{c.status}</Text>
            </View>
          </View>
        </View>

        {/* Action Quick Bar */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.secondaryActionBtn}
            onPress={() => navigation.navigate('Case Documents', { caseId: c.id, caseTitle: c.case_title })}>
            <Text style={styles.secondaryActionText}>📄 Documents</Text>
            {unreadCounts.documents > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCounts.documents}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryActionBtn}
            onPress={() => navigation.navigate('Chat', { caseId: c.id, caseTitle: c.case_title })}>
            <Text style={styles.secondaryActionText}>💬 Chat</Text>
            {unreadCounts.messages > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCounts.messages}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryActionBtn}
            onPress={() => navigation.navigate(isClient ? 'Client Appointments' : 'Lawyer Appointments', { caseId: c.id })}>
            <Text style={styles.secondaryActionText}>🗓️ Appts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleQuickExport}>
            <Text style={styles.secondaryActionText}>📤 Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerActionBtn} onPress={confirmDelete}>
            <Text style={styles.dangerActionText}>🗑</Text>
          </TouchableOpacity>
        </View>

        {/* Notes Section */}
        {!!c.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Case Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{c.notes}</Text>
            </View>
          </View>
        )}

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist</Text>
          <View style={styles.taskAddRow}>
            <TextInput value={newTask} onChangeText={setNewTask} style={styles.input} placeholder="Add a next step..." placeholderTextColor={colors.slate400} />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddTask} disabled={!newTask.trim()}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.taskList}>
            {caseTasks.length === 0 ? (
              <Text style={styles.emptySmall}>No tasks assigned yet.</Text>
            ) : (
              caseTasks.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={() => setTaskCompleted(t.id, !t.completed)} onDelete={() => deleteTask(t.id)} />
              ))
            )}
          </View>
        </View>

        {/* Document Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Document Requests</Text>
            {!isClient && (
              <TouchableOpacity onPress={() => setShowDocReqForm(!showDocReqForm)}>
                <Text style={styles.linkText}>{showDocReqForm ? 'Close' : '+ Request'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {showDocReqForm && (
            <View style={styles.miniForm}>
              <TextInput style={styles.input} value={reqTitle} onChangeText={setReqTitle} placeholder="Document name (e.g. Aadhaar Card)" placeholderTextColor={colors.slate400} />
              <TextInput style={[styles.input, { marginTop: 8, minHeight: 60, textAlignVertical: 'top' }]} value={reqDesc} onChangeText={setReqDesc} placeholder="Description for client..." placeholderTextColor={colors.slate400} multiline />
              <TouchableOpacity style={[styles.miniBtn, !reqTitle.trim() && { opacity: 0.5 }]} onPress={handleRequestDoc} disabled={!reqTitle.trim()}>
                <Text style={styles.miniBtnText}>Send Request to Client</Text>
              </TouchableOpacity>
            </View>
          )}

          {docRequests.length === 0 && !showDocReqForm && (
            <Text style={styles.emptySmall}>No document requests yet.</Text>
          )}

          {docRequests.map((dr) => {
            const sc = reqStatusColors[dr.status] || reqStatusColors.Pending;
            return (
              <View key={dr.id} style={styles.reqCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqTitle}>{dr.title}</Text>
                  {!!dr.description && <Text style={styles.reqDesc}>{dr.description}</Text>}
                  <View style={[styles.reqBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.reqBadgeText, { color: sc.text }]}>{dr.status}</Text>
                  </View>
                  {dr.status === 'Uploaded' && dr.doc_name && (
                    <Text style={styles.reqDocName}>📎 {dr.doc_name}</Text>
                  )}
                </View>
                {!isClient && dr.status === 'Uploaded' && (
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptDoc(dr.id)}>
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Milestones Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Case Timeline</Text>
            <TouchableOpacity onPress={() => setShowMsForm(!showMsForm)}>
              <Text style={styles.linkText}>{showMsForm ? 'Close' : '+ Add'}</Text>
            </TouchableOpacity>
          </View>

          {showMsForm && (
            <View style={styles.miniForm}>
              <TextInput style={styles.input} value={msTitle} onChangeText={setMsTitle} placeholder="Milestone title" placeholderTextColor={colors.slate400} />
              <TextInput style={[styles.input, { marginTop: 8 }]} value={msDesc} onChangeText={setMsDesc} placeholder="Description (optional)" placeholderTextColor={colors.slate400} />
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {MILESTONE_ICONS.map((ic) => (
                  <TouchableOpacity key={ic} style={[styles.iconPill, msIcon === ic && styles.iconPillActive]} onPress={() => setMsIcon(ic)}>
                    <Text style={{ fontSize: 18 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.miniBtn, !msTitle.trim() && { opacity: 0.5 }]} onPress={handleAddMilestone} disabled={!msTitle.trim()}>
                <Text style={styles.miniBtnText}>Add Milestone</Text>
              </TouchableOpacity>
            </View>
          )}

          {milestones.map((ms) => (
            <View key={ms.id} style={styles.msCard}>
              <Text style={styles.msIcon}>{ms.icon || '📌'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.msTitle}>{ms.title}</Text>
                {!!ms.description && <Text style={styles.msDesc}>{ms.description}</Text>}
                <Text style={styles.msDate}>{ms.milestone_date?.slice(0, 10)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Appointments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {!isClient && (
              <TouchableOpacity onPress={() => setShowApptForm(!showApptForm)}>
                <Text style={styles.linkText}>{showApptForm ? 'Close' : '+ Book'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {showApptForm && (
            <View style={styles.miniForm}>
              <TextInput style={styles.input} value={apptTitle} onChangeText={setApptTitle} placeholder="Meeting Title (e.g. Strategy Review)" placeholderTextColor={colors.slate400} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowApptDatePicker(true)}>
                  <Text style={{ color: colors.slate800 }}>📅 {apptDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowApptTimePicker(true)}>
                  <Text style={{ color: colors.slate800 }}>⏰ {apptDateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
                </TouchableOpacity>
              </View>
              {showApptDatePicker && (
                <DateTimePicker value={apptDateObj} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => { setShowApptDatePicker(Platform.OS === 'ios'); if (d) setApptDateObj(prev => { const n = new Date(prev); n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); return n; }); }} />
              )}
              {showApptTimePicker && (
                <DateTimePicker value={apptDateObj} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => { setShowApptTimePicker(Platform.OS === 'ios'); if (d) setApptDateObj(prev => { const n = new Date(prev); n.setHours(d.getHours(), d.getMinutes()); return n; }); }} />
              )}
              <TouchableOpacity style={[styles.miniBtn, !apptTitle.trim() && { opacity: 0.5 }]} onPress={handleCreateAppointment} disabled={!apptTitle.trim()}>
                <Text style={styles.miniBtnText}>Schedule Meeting</Text>
              </TouchableOpacity>
            </View>
          )}

          {appointments.length === 0 && !showApptForm && (
            <Text style={styles.emptySmall}>No upcoming appointments for this case.</Text>
          )}

          {appointments.map((a) => (
            <View key={a.id} style={styles.miniCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniTitle}>{a.title}</Text>
                <Text style={styles.miniMeta}>📅 {a.appointment_date?.slice(0, 16).replace('T', ' ')}</Text>
              </View>
              <View style={[styles.miniStatus, a.status === 'Confirmed' ? styles.bgConf : styles.bgReq]}>
                <Text style={styles.miniStatusText}>{a.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Payments & Fees</Text>
            <TouchableOpacity onPress={() => setShowPayForm(!showPayForm)}>
              <Text style={styles.linkText}>{showPayForm ? 'Close' : '+ Add'}</Text>
            </TouchableOpacity>
          </View>

          {showPayForm && (
            <View style={styles.miniForm}>
              <TextInput style={styles.input} value={payDesc} onChangeText={setPayDesc} placeholder="Fee description" placeholderTextColor={colors.slate400} />
              <TextInput style={[styles.input, { marginTop: 8 }]} value={payAmount} onChangeText={setPayAmount} placeholder="Amount (₹)" placeholderTextColor={colors.slate400} keyboardType="numeric" />
              <TouchableOpacity style={[styles.miniBtn, (!payDesc.trim() || !payAmount.trim()) && { opacity: 0.5 }]} onPress={handleAddPayment} disabled={!payDesc.trim() || !payAmount.trim()}>
                <Text style={styles.miniBtnText}>Add Fee</Text>
              </TouchableOpacity>
            </View>
          )}

          {payments.map((p) => (
            <View key={p.id} style={styles.payCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.payDesc}>{p.description}</Text>
                <Text style={styles.payAmount}>₹{(p.amount || 0).toLocaleString()}</Text>
              </View>
              {p.status === 'Pending' ? (
                <TouchableOpacity style={styles.markPaidBtn} onPress={() => handleMarkPaid(p.id)}>
                  <Text style={styles.markPaidText}>Mark Paid</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>✅ Paid</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Closure Section */}
        {c.status !== 'Closed' && (
          <View style={[styles.section, styles.closureSection]}>
            <Text style={styles.sectionTitle}>Resolution & Closure</Text>
            <Text style={styles.label}>Select Outcome</Text>
            <View style={styles.outcomeRow}>
              {['Won', 'Lost', 'Settled', 'Withdrawn'].map((o) => (
                <TouchableOpacity key={o} style={[styles.outcomeChip, outcome === o && styles.outcomeChipActive]} onPress={() => setOutcome(outcome === o ? '' : o)}>
                  <Text style={[styles.outcomeChipText, outcome === o && styles.chipTextActive]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Delay / Closure Notes</Text>
            <TextInput value={delayNotes} onChangeText={setDelayNotes} style={[styles.input, styles.textArea]} multiline placeholder="Reason for delays or final summary..." placeholderTextColor={colors.slate400} />

            <TouchableOpacity style={[styles.closeBtn, !outcome && styles.btnDisabled]} onPress={confirmClose} disabled={!outcome}>
              <Text style={styles.closeBtnText}>Finalize & Close Case</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 60 },
  heroCard: {
    backgroundColor: colors.surface, padding: theme.spacing.xl, borderRadius: theme.radius.xl,
    ...theme.shadows.md, marginBottom: theme.spacing.lg,
  },
  priorityTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.sm, marginBottom: 12 },
  tagHigh: { backgroundColor: colors.errorLight },
  tagMed: { backgroundColor: colors.warningLight },
  tagLow: { backgroundColor: colors.successLight },
  tagText: { ...typo.tiny, fontWeight: '800' },
  textHigh: { color: colors.error },
  textMed: { color: colors.warning },
  textLow: { color: colors.success },

  caseTitle: { ...typo.h1, color: colors.slate950, marginBottom: 20 },
  metaGrid: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  metaItem: { flex: 1 },
  metaLabel: { ...typo.tiny, color: colors.slate400, marginBottom: 4 },
  metaValue: { ...typo.subtitle, color: colors.slate800 },

  dateBanner: { flexDirection: 'row', backgroundColor: colors.slate50, borderRadius: theme.radius.md, padding: 16, alignItems: 'center' },
  dateBlock: { flex: 1, alignItems: 'center' },
  dateDivider: { width: 1, height: 24, backgroundColor: colors.slate200 },
  dateLabel: { ...typo.tiny, color: colors.slate400, marginBottom: 4 },
  dateValue: { ...typo.bodyBold, color: colors.slate800 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: theme.spacing.xl },
  secondaryActionBtn: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
    padding: 14, borderRadius: theme.radius.md, alignItems: 'center',
    position: 'relative', // for badge positioning
  },
  secondaryActionText: { ...typo.bodyBold, color: colors.primary, fontSize: 13 },
  badge: {
    position: 'absolute', top: -8, right: -8,
    backgroundColor: colors.error, minWidth: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.surface,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  dangerActionBtn: {
    flex: 1,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error,
    padding: 14, borderRadius: theme.radius.md, alignItems: 'center', paddingHorizontal: 18,
  },
  dangerActionText: { ...typo.bodyBold, color: colors.error },

  section: { marginBottom: theme.spacing.xl },
  sectionTitle: { ...typo.subtitle, color: colors.slate800, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLink: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  miniCard: {
    backgroundColor: colors.surface, padding: 12, borderRadius: theme.radius.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: colors.slate100,
  },
  miniTitle: { ...typo.bodyBold, color: colors.slate800 },
  miniMeta: { ...typo.tiny, color: colors.slate400, marginTop: 2 },
  miniStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniStatusText: { ...typo.tiny, fontWeight: '800', fontSize: 9 },
  bgConf: { backgroundColor: '#dcfce7' },
  bgReq: { backgroundColor: '#fef3c7' },
  notesCard: { backgroundColor: colors.surface, padding: 16, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: colors.slate100 },
  notesText: { ...typo.body, color: colors.slate600 },

  taskAddRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.slate200,
    borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 12, ...typo.body,
  },
  addBtn: { backgroundColor: colors.slate800, paddingHorizontal: 16, borderRadius: theme.radius.md, justifyContent: 'center' },
  addBtnText: { ...typo.bodyBold, color: colors.white },
  taskList: { backgroundColor: colors.surface, borderRadius: theme.radius.lg, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.slate100 },
  emptySmall: { paddingVertical: 20, textAlign: 'center', color: colors.slate400 },

  // Document Requests
  miniForm: { backgroundColor: colors.slate50, padding: 12, borderRadius: theme.radius.lg, marginBottom: 12, borderWidth: 1, borderColor: colors.slate100 },
  miniBtn: { backgroundColor: colors.primary, borderRadius: theme.radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  miniBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  reqCard: {
    backgroundColor: colors.surface, padding: 14, borderRadius: theme.radius.lg, marginBottom: 8,
    borderWidth: 1, borderColor: colors.slate100, flexDirection: 'row', alignItems: 'center',
  },
  reqTitle: { ...typo.bodyBold, color: colors.slate800 },
  reqDesc: { ...typo.caption, color: colors.slate500, marginTop: 2 },
  reqBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  reqBadgeText: { ...typo.tiny, fontWeight: '800' },
  reqDocName: { ...typo.caption, color: colors.primary, marginTop: 4 },
  acceptBtn: { backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.md, marginLeft: 10 },
  acceptBtnText: { color: colors.white, fontWeight: '800', fontSize: 12 },

  // Milestones
  iconPill: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  iconPillActive: { borderColor: colors.primary, backgroundColor: colors.indigo50 },
  msCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    padding: 12, borderRadius: theme.radius.lg, marginBottom: 8, borderWidth: 1, borderColor: colors.slate100,
  },
  msIcon: { fontSize: 22 },
  msTitle: { ...typo.bodyBold, color: colors.slate800 },
  msDesc: { ...typo.caption, color: colors.slate500, marginTop: 2 },
  msDate: { ...typo.tiny, color: colors.slate400, marginTop: 4, fontWeight: '400', textTransform: 'none' },

  // Payments
  payCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: 14, borderRadius: theme.radius.lg, marginBottom: 8, borderWidth: 1, borderColor: colors.slate100,
  },
  payDesc: { ...typo.bodyBold, color: colors.slate800 },
  payAmount: { ...typo.caption, color: colors.warning, fontWeight: '800', marginTop: 2 },
  markPaidBtn: { backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.md, marginLeft: 10 },
  markPaidText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  paidBadge: { backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 10 },
  paidText: { ...typo.tiny, color: '#166534', fontWeight: '800' },

  // Closure
  closureSection: { backgroundColor: '#fffbeb', padding: 20, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: '#fef3c7' },
  label: { ...typo.tiny, color: colors.slate500, marginTop: 16, marginBottom: 8 },
  outcomeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  outcomeChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.slate200, paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.full },
  outcomeChipActive: { backgroundColor: colors.warning, borderColor: colors.warning },
  outcomeChipText: { ...typo.caption, color: colors.slate700 },
  chipTextActive: { color: colors.white, fontWeight: '800' },
  textArea: { height: 100, textAlignVertical: 'top' },
  closeBtn: { marginTop: 20, backgroundColor: colors.warning, paddingVertical: 16, borderRadius: theme.radius.md, alignItems: 'center', ...theme.shadows.sm },
  btnDisabled: { opacity: 0.5 },
  closeBtnText: { ...typo.subtitle, color: colors.white },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typo.body, color: colors.slate400 },
});
};
