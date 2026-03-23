import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';
import * as Sharing from 'expo-sharing';
import { generateCaseSummaryExportFiles } from '../utils/caseSummaryExport';

const STATUS_COLORS = {
  Pending: { bg: '#fef3c7', text: '#92400e' },
  Uploaded: { bg: '#dbeafe', text: '#1e40af' },
  Accepted: { bg: '#dcfce7', text: '#166534' },
};

export default function ClientCaseViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const caseId = route.params?.caseId;

  const { cases, clientsById, user } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
 

  const c = useMemo(() => cases.find((x) => x.id === caseId) || null, [cases, caseId]);
  const client = c?.client_id ? clientsById.get(c.client_id) : null;

  // State
  const [docRequests, setDocRequests] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [payments, setPayments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({ messages: 0, documents: 0 });

  const { getMessages, sendMessage, getDocumentRequests, getMilestones, getPayments, submitFeedback, getFeedback, getUnreadCounts, markMessagesAsRead, getAppointments } = useApp();

  const loadData = useCallback(async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const [docs, ms, pays, fb, counts, appts] = await Promise.all([
        getDocumentRequests(caseId).catch(e => { console.warn('docs error', e); return []; }),
        getMilestones(caseId).catch(e => { console.warn('ms error', e); return []; }),
        getPayments(caseId).catch(e => { console.warn('pays error', e); return []; }),
        getFeedback(caseId).catch(e => { console.warn('fb error', e); return null; }),
        getUnreadCounts(caseId).catch(e => { console.warn('unread error', e); return { messages: 0, documents: 0 }; }),
        getAppointments({ clientId: user?.linked_client_id }).catch(e => { console.warn('appts error', e); return []; }),
      ]);
      setDocRequests(docs || []);
      setMilestones(ms || []);
      setPayments(pays || []);
      setAppointments((appts || []).filter(a => a.case_id === caseId && (a.status === 'Requested' || a.status === 'Confirmed')));
      setUnreadCounts(counts || { messages: 0, documents: 0 });
      if (fb) {
        setFeedback(fb);
        setRating(fb.rating);
        setComment(fb.comment);
      }
    } catch (err) {
      console.error('Fatal loadData error', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, getDocumentRequests, getMilestones, getPayments, getFeedback, getUnreadCounts, getAppointments, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    await submitFeedback(caseId, user?.linked_client_id, rating, comment);
    await loadData();
    Alert.alert('Thank You!', 'Your feedback has been submitted.');
  };

  const handleQuickExport = async () => {
    setExporting(true);
    try {
      const viewerName = user?.name || 'User';
      const { pdfUri, txtUri } = await generateCaseSummaryExportFiles({
        caseData: c,
        clientName: client?.name,
        tasks: [],
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

  if (!c) {
    return (
      <View style={styles.container}>
        <Header title="Case" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}><Text style={styles.emptyText}>Case not found.</Text></View>
      </View>
    );
  }

  if (loading) {
    return <LoadingState message="Loading case details..." />;
  }

  if (exporting) {
    return <LoadingState message="Preparing case export..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Case Details" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Case Hero */}
        <View style={styles.heroCard}>
          <View style={[styles.priorityTag, c.priority === 'High' ? styles.tagHigh : c.priority === 'Low' ? styles.tagLow : styles.tagMed]}>
            <Text style={[styles.tagText, c.priority === 'High' ? styles.textHigh : c.priority === 'Low' ? styles.textLow : styles.textMed]}>
              {c.priority?.toUpperCase()} PRIORITY
            </Text>
          </View>
          <Text style={styles.caseTitle}>{c.case_title}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>COURT</Text>
              <Text style={styles.metaValue}>{c.court_name || 'N/A'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>STATUS</Text>
              <Text style={styles.metaValue}>{c.status}</Text>
            </View>
          </View>

          <View style={styles.dateBanner}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>DEADLINE</Text>
              <Text style={styles.dateValue}>{c.deadline_date ? String(c.deadline_date).slice(0, 10) : 'None'}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>FILED</Text>
              <Text style={styles.dateValue}>{c.filing_date ? String(c.filing_date).slice(0, 10) : 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Action Quick Bar */}
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.secondaryActionBtn}
            onPress={() => navigation.navigate('Chat', { caseId: c.id, caseTitle: c.case_title })}
          >
            <Text style={styles.secondaryActionText}>💬 Messages</Text>
            {unreadCounts.messages > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCounts.messages}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryActionBtn}
            onPress={() => navigation.navigate('Client Appointments', { caseId: c.id })}
          >
            <Text style={styles.secondaryActionText}>🗓️ Appts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleQuickExport}>
            <Text style={styles.secondaryActionText}>📤 Export</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        {!!c.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lawyer's Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{c.notes}</Text>
            </View>
          </View>
        )}

        {/* Case Timeline / Milestones */}
        {milestones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Case Timeline</Text>
            <View style={styles.timeline}>
              {milestones.map((ms, i) => (
                <View key={ms.id} style={styles.timelineItem}>
                  <View style={styles.timelineLine}>
                    <View style={styles.timelineDot}>
                      <Text style={styles.timelineIcon}>{ms.icon || '📌'}</Text>
                    </View>
                    {i < milestones.length - 1 && <View style={styles.timelineConnector} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{ms.title}</Text>
                    {!!ms.description && <Text style={styles.timelineDesc}>{ms.description}</Text>}
                    <Text style={styles.timelineDate}>{ms.milestone_date?.slice(0, 10)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          </View>
          {appointments.length === 0 ? (
            <Text style={styles.emptySmall}>No upcoming appointments for this case.</Text>
          ) : (
            appointments.map((a) => (
              <View key={a.id} style={styles.miniCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniTitle}>{a.title}</Text>
                  <Text style={styles.miniMeta}>📅 {a.appointment_date?.slice(0, 16).replace('T', ' ')}</Text>
                </View>
                <View style={[styles.miniStatus, a.status === 'Confirmed' ? styles.bgConf : styles.bgReq]}>
                  <Text style={styles.miniStatusText}>{a.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Document Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Document Requests</Text>
            {unreadCounts.documents > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.badgeText}>{unreadCounts.documents}</Text>
              </View>
            )}
          </View>
          {docRequests.length === 0 ? (
            <Text style={styles.emptySmall}>No document requests from your lawyer.</Text>
          ) : (
            docRequests.map((dr) => {
              const sc = STATUS_COLORS[dr.status] || STATUS_COLORS.Pending;
              return (
                <View key={dr.id} style={styles.docCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{dr.title}</Text>
                    {!!dr.description && <Text style={styles.docDesc}>{dr.description}</Text>}
                    <View style={[styles.docStatus, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.docStatusText, { color: sc.text }]}>{dr.status}</Text>
                    </View>
                    {dr.status === 'Uploaded' && dr.doc_name && (
                      <Text style={styles.docFileName}>📎 {dr.doc_name}</Text>
                    )}
                  </View>
                  {dr.status === 'Pending' && (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => navigation.navigate('Client Doc Upload', { requestId: dr.id, caseId, title: dr.title, description: dr.description })}
                    >
                      <Text style={styles.uploadBtnText}>Upload</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Satisfaction Feedback (only for closed cases) */}
        {c.status === 'Closed' && !feedback && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackPrompt}>How satisfied are you with the handling of this case?</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Text style={[styles.star, s <= rating && styles.starActive]}>{s <= rating ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.feedbackInput, { marginTop: 12 }]}
                value={comment}
                onChangeText={setComment}
                placeholder="Optional comments..."
                placeholderTextColor={colors.slate400}
                multiline
              />
              <TouchableOpacity style={styles.submitFbBtn} onPress={handleSubmitFeedback}>
                <Text style={styles.submitFbText}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {feedback && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Feedback</Text>
            <View style={styles.feedbackCard}>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Text key={s} style={[styles.star, s <= feedback.rating && styles.starActive]}>
                    {s <= feedback.rating ? '★' : '☆'}
                  </Text>
                ))}
              </View>
              {!!feedback.comment && <Text style={styles.feedbackComment}>{feedback.comment}</Text>}
            </View>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 60 },

  heroCard: {
    backgroundColor: colors.surface, padding: 20, borderRadius: theme.radius.xl,
    ...theme.shadows.md, marginBottom: 20,
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
  metaGrid: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  metaItem: { flex: 1 },
  metaLabel: { ...typo.tiny, color: colors.slate400, marginBottom: 4 },
  metaValue: { ...typo.subtitle, color: colors.slate800 },
  dateBanner: { flexDirection: 'row', backgroundColor: colors.slate50, borderRadius: theme.radius.md, padding: 16, alignItems: 'center' },
  dateBlock: { flex: 1, alignItems: 'center' },
  dateDivider: { width: 1, height: 24, backgroundColor: colors.slate200 },
  dateLabel: { ...typo.tiny, color: colors.slate400, marginBottom: 4 },
  dateValue: { ...typo.bodyBold, color: colors.slate800 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  secondaryActionBtn: {
    flex: 1, backgroundColor: colors.surface, paddingVertical: 14,
    borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm,
    flexDirection: 'row', gap: 6, position: 'relative',
  },
  secondaryActionText: { ...typo.bodyBold, color: colors.slate800, fontSize: 13 },
  badge: {
    position: 'absolute', top: -10, right: -5,
    backgroundColor: colors.error, minWidth: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, borderWidth: 2, borderColor: colors.surface,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },

  section: { marginBottom: 24 },
  sectionTitle: { ...typo.subtitle, color: colors.slate800, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
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
  countBadge: {
    backgroundColor: colors.error, minWidth: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notesCard: { backgroundColor: colors.surface, padding: 16, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: colors.slate100 },
  notesText: { ...typo.body, color: colors.slate600 },

  // Timeline
  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLine: { width: 34, alignItems: 'center' },
  timelineDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineIcon: { fontSize: 14 },
  timelineConnector: { width: 2, flex: 1, backgroundColor: colors.slate200, marginTop: -2 },
  timelineContent: { flex: 1, marginLeft: 12, paddingBottom: 24, marginTop: 2 },
  timelineTitle: { ...typo.bodyBold, color: colors.slate800 },
  timelineDesc: { ...typo.caption, color: colors.slate500, marginTop: 2 },
  timelineDate: { ...typo.tiny, color: colors.slate400, marginTop: 4 },

  // Document Requests
  docCard: {
    backgroundColor: colors.surface, padding: 14, borderRadius: theme.radius.lg, marginBottom: 10,
    borderWidth: 1, borderColor: colors.slate100, flexDirection: 'row', alignItems: 'center', ...theme.shadows.sm,
  },
  docTitle: { ...typo.bodyBold, color: colors.slate800 },
  docDesc: { ...typo.caption, color: colors.slate500, marginTop: 2 },
  docStatus: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8 },
  docStatusText: { ...typo.tiny, fontWeight: '800' },
  docFileName: { ...typo.caption, color: colors.primary, marginTop: 4 },
  uploadBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.md, marginLeft: 10 },
  uploadBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },

  // Feedback
  feedbackCard: { backgroundColor: colors.surface, padding: 20, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm },
  feedbackPrompt: { ...typo.body, color: colors.slate600, marginBottom: 12, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star: { fontSize: 36, color: colors.slate300 },
  starActive: { color: '#f59e0b' },
  feedbackInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.slate200, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10, ...typo.body },
  submitFbBtn: { backgroundColor: colors.primary, borderRadius: theme.radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  submitFbText: { color: colors.white, fontWeight: '800' },
  feedbackComment: { ...typo.body, color: colors.slate600, marginTop: 12, textAlign: 'center' },

  emptyText: { ...typo.body, color: colors.slate400, textAlign: 'center' },
  emptySmall: { color: colors.slate400, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
};
