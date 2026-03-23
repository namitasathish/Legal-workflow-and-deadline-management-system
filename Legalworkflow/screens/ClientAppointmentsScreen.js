import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';

const DURATIONS = [15, 30, 45, 60];

export default function ClientAppointmentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { caseId: paramCaseId } = route.params || {};

  const { user, cases, getAppointments, createAppointment } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const clientId = user?.linked_client_id;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!paramCaseId);
  const [draft, setDraft] = useState({
    title: '',
    duration_minutes: 30,
    case_id: paramCaseId || '',
    notes: ''
  });
  const [apptDateObj, setApptDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const myCases = cases.filter((c) => c.client_id === clientId && c.status !== 'Closed');

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await getAppointments({ clientId });
      let filtered = rows || [];
      if (paramCaseId) {
        filtered = filtered.filter(a => a.case_id === paramCaseId);
      }
      setAppointments(filtered);
    } finally {
      setLoading(false);
    }
  }, [clientId, getAppointments, paramCaseId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <LoadingState message="Loading appointments..." />;
  }

  const handleSubmit = async () => {
    if (!draft.title.trim()) {
      Alert.alert('Required', 'Please fill in a title.');
      return;
    }
    const payload = {
      ...draft,
      appointment_date: apptDateObj.toISOString(),
    };
    await createAppointment(clientId, payload);
    setDraft({ title: '', duration_minutes: 30, case_id: '', notes: '' });
    setApptDateObj(new Date());
    setShowForm(false);
    await load();
    Alert.alert('Requested!', 'Your appointment request has been sent to your lawyer.');
  };

  const upcoming = appointments.filter((a) => a.status === 'Requested' || a.status === 'Confirmed');
  const past = appointments.filter((a) => a.status === 'Completed' || a.status === 'Cancelled');

  const STATUS_STYLE = {
    Requested: { bg: '#fef3c7', text: '#92400e', icon: '⏳' },
    Confirmed: { bg: '#dcfce7', text: '#166534', icon: '✅' },
    Completed: { bg: colors.slate50, text: colors.slate500, icon: '✓' },
    Cancelled: { bg: colors.errorLight, text: colors.error, icon: '✕' },
  };

  return (
    <View style={styles.container}>
      <Header title="Appointments" showBack onBack={() => navigation.goBack()} rightAction={showForm ? 'Close' : '+ Book'} onRightPress={() => setShowForm(!showForm)} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Booking Form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Request an Appointment</Text>

            <Text style={styles.label}>Title / Subject *</Text>
            <TextInput style={styles.input} value={draft.title} onChangeText={(t) => setDraft((d) => ({ ...d, title: t }))} placeholder="e.g. Case Discussion" placeholderTextColor={colors.slate400} />

            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: colors.slate800 }}>📅 {apptDateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={apptDateObj} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setApptDateObj(prev => { const n = new Date(prev); n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); return n; }); }} />
            )}

            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowTimePicker(true)}>
              <Text style={{ color: colors.slate800 }}>⏰ {apptDateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker value={apptDateObj} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => { setShowTimePicker(Platform.OS === 'ios'); if (d) setApptDateObj(prev => { const n = new Date(prev); n.setHours(d.getHours(), d.getMinutes()); return n; }); }} />
            )}

            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <TouchableOpacity key={d} style={[styles.durationPill, draft.duration_minutes === d && styles.durationActive]} onPress={() => setDraft((x) => ({ ...x, duration_minutes: d }))}>
                  <Text style={[styles.durationText, draft.duration_minutes === d && styles.durationTextActive]}>{d} min</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Link to Case (Optional)</Text>
            <View style={styles.caseRow}>
              <TouchableOpacity style={[styles.casePill, !draft.case_id && styles.casePillActive]} onPress={() => setDraft((d) => ({ ...d, case_id: '' }))}>
                <Text style={[styles.casePillText, !draft.case_id && styles.casePillTextActive]}>None</Text>
              </TouchableOpacity>
              {myCases.slice(0, 10).map((c) => (
                <TouchableOpacity key={c.id} style={[styles.casePill, draft.case_id === c.id && styles.casePillActive]} onPress={() => setDraft((d) => ({ ...d, case_id: c.id }))}>
                  <Text style={[styles.casePillText, draft.case_id === c.id && styles.casePillTextActive]} numberOfLines={1}>{c.case_title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} value={draft.notes} onChangeText={(t) => setDraft((d) => ({ ...d, notes: t }))} placeholder="Any additional info..." placeholderTextColor={colors.slate400} multiline />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Upcoming</Text>
            {upcoming.map((a) => {
              const ss = STATUS_STYLE[a.status] || STATUS_STYLE.Requested;
              return (
                <View key={a.id} style={styles.apptCard}>
                  <View style={styles.apptHeader}>
                    <Text style={styles.apptTitle}>{a.title}</Text>
                    <View style={[styles.apptBadge, { backgroundColor: ss.bg }]}>
                      <Text style={[styles.apptBadgeText, { color: ss.text }]}>{ss.icon} {a.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.apptDate}>📅 {a.appointment_date?.slice(0, 16).replace('T', ' ')}</Text>
                  <Text style={styles.apptDuration}>⏱ {a.duration_minutes} minutes</Text>
                  {!!a.case_title && <Text style={styles.apptCase}>📋 {a.case_title}</Text>}
                  {!!a.notes && <Text style={styles.apptNotes}>{a.notes}</Text>}
                </View>
              );
            })}
          </View>
        )}

        {/* Past */}
        {past.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Past Appointments</Text>
            {past.map((a) => {
              const ss = STATUS_STYLE[a.status] || STATUS_STYLE.Completed;
              return (
                <View key={a.id} style={[styles.apptCard, { opacity: 0.6 }]}>
                  <View style={styles.apptHeader}>
                    <Text style={styles.apptTitle}>{a.title}</Text>
                    <View style={[styles.apptBadge, { backgroundColor: ss.bg }]}>
                      <Text style={[styles.apptBadgeText, { color: ss.text }]}>{ss.icon} {a.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.apptDate}>📅 {a.appointment_date?.slice(0, 16).replace('T', ' ')}</Text>
                </View>
              );
            })}
          </View>
        )}

        {appointments.length === 0 && !showForm && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No appointments yet.</Text>
            <Text style={styles.emptyHint}>Tap "+ Book" to request a meeting with your lawyer.</Text>
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
  content: { padding: 16, paddingBottom: 40 },

  formCard: {
    backgroundColor: colors.surface, padding: 16, borderRadius: theme.radius.xl,
    borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm, marginBottom: 24,
  },
  formTitle: { ...typo.h3, color: colors.slate800, marginBottom: 12 },
  label: { ...typo.tiny, color: colors.slate500, marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200,
    borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10,
    ...typo.body, color: colors.slate800,
  },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50,
  },
  durationActive: { backgroundColor: colors.slate800, borderColor: colors.slate800 },
  durationText: { ...typo.caption, color: colors.slate600 },
  durationTextActive: { color: colors.white, fontWeight: '700' },
  caseRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  casePill: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50,
  },
  casePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  casePillText: { ...typo.tiny, color: colors.slate600, fontWeight: '700' },
  casePillTextActive: { color: colors.white },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: theme.radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  submitText: { color: colors.white, fontWeight: '800' },

  section: { marginBottom: 24 },
  sectionHeader: { ...typo.tiny, color: colors.slate500, letterSpacing: 1, marginBottom: 12 },
  apptCard: {
    backgroundColor: colors.surface, padding: 16, borderRadius: theme.radius.lg,
    marginBottom: 10, borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm,
  },
  apptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  apptTitle: { ...typo.bodyBold, color: colors.slate800, flex: 1 },
  apptBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  apptBadgeText: { ...typo.tiny, fontWeight: '800' },
  apptDate: { ...typo.caption, color: colors.slate600, marginBottom: 2 },
  apptDuration: { ...typo.caption, color: colors.slate500 },
  apptCase: { ...typo.tiny, color: colors.primary, marginTop: 4 },
  apptNotes: { ...typo.caption, color: colors.slate400, marginTop: 4, fontStyle: 'italic' },

  emptyCard: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { ...typo.subtitle, color: colors.slate400 },
  emptyHint: { ...typo.caption, color: colors.slate300, marginTop: 4 },
});
};
