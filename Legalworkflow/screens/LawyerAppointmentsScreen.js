import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';

export default function LawyerAppointmentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { caseId: paramCaseId } = route.params || {};
  const { user, cases, getAppointments, createAppointment, updateAppointmentStatus } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [apptDateObj, setApptDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(paramCaseId || '');

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await getAppointments();
    let filtered = rows || [];
    if (paramCaseId) {
      filtered = filtered.filter(a => a.case_id === paramCaseId);
    }
    setAppointments(filtered);
    setLoading(false);
  }, [getAppointments, paramCaseId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <LoadingState message="Loading appointments..." />;
  }

  const handleStatusUpdate = async (id, status) => {
    await updateAppointmentStatus(id, status);
    await load();
  };

  const handleCreate = async () => {
    if (!title.trim() || !selectedCaseId) {
      Alert.alert('Incomplete', 'Please fill in title and select a case.');
      return;
    }
    const c = cases.find(x => x.id === selectedCaseId);
    if (!c) return;

    await createAppointment(c.client_id, {
      case_id: selectedCaseId,
      title: title.trim(),
      appointment_date: apptDateObj.toISOString(),
      lawyer_id: user?.id,
    });

    setTitle('');
    setApptDateObj(new Date());
    setShowForm(false);
    await load();
    Alert.alert('Success', 'Appointment scheduled.');
  };

  const renderItem = ({ item }) => {
    const isRequested = item.status === 'Requested';
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{item.client_name || 'Generic'}</Text>
            <Text style={styles.apptTitle}>{item.title}</Text>
          </View>
          <View style={[styles.statusBadge, 
            item.status === 'Requested' ? styles.bgReq : 
            item.status === 'Confirmed' ? styles.bgConf : 
            item.status === 'Cancelled' ? styles.bgCanc : styles.bgDone
          ]}>
            <Text style={[styles.statusText, 
              item.status === 'Requested' ? styles.textReq : 
              item.status === 'Confirmed' ? styles.textConf : 
              item.status === 'Cancelled' ? styles.textCanc : styles.textDone
            ]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detail}>📅 {item.appointment_date?.slice(0, 16).replace('T', ' ')}</Text>
          <Text style={styles.detail}>⏱ {item.duration_minutes} min</Text>
        </View>

        {!!item.case_title && (
          <Text style={styles.caseBadge}>📋 {item.case_title}</Text>
        )}

        {!!item.notes && (
          <Text style={styles.notes}>"{item.notes}"</Text>
        )}

        {isRequested && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => handleStatusUpdate(item.id, 'Confirmed')}>
              <Text style={styles.btnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn} onPress={() => handleStatusUpdate(item.id, 'Cancelled')}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'Confirmed' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={() => handleStatusUpdate(item.id, 'Completed')}>
              <Text style={styles.btnText}>Mark Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn} onPress={() => handleStatusUpdate(item.id, 'Cancelled')}>
              <Text style={styles.declineText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title={paramCaseId ? "Case Appts" : "All Appointments"} 
        showBack 
        onBack={() => navigation.goBack()} 
        rightAction={showForm ? "Cancel" : "Book"}
        onRightPress={() => setShowForm(!showForm)}
      />

      {showForm && (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.formLabel}>Meeting Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Strategy Session" placeholderTextColor={colors.slate400} />
          
          <Text style={styles.formLabel}>Date & Time</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: colors.slate800 }}>📅 {apptDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowTimePicker(true)}>
              <Text style={{ color: colors.slate800 }}>⏰ {apptDateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker value={apptDateObj} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setApptDateObj(prev => { const n = new Date(prev); n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); return n; }); }} />
          )}
          {showTimePicker && (
            <DateTimePicker value={apptDateObj} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { setShowTimePicker(Platform.OS === 'ios'); if (d) setApptDateObj(prev => { const n = new Date(prev); n.setHours(d.getHours(), d.getMinutes()); return n; }); }} />
          )}

          {!paramCaseId && (
            <>
              <Text style={styles.formLabel}>Link to Case</Text>
              <View style={styles.casePicker}>
                {cases.filter(c => c.status !== 'Closed').map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.caseOption, selectedCaseId === c.id && styles.caseOptionActive]}
                    onPress={() => setSelectedCaseId(c.id)}
                  >
                    <Text style={[styles.caseOptionText, selectedCaseId === c.id && styles.caseOptionTextActive]}>{c.case_title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
            <Text style={styles.submitBtnText}>Confirm Appointment</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={load}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📅</Text>
            <Text style={styles.emptyText}>No appointments scheduled.</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  card: {
    backgroundColor: colors.surface, padding: 16, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.slate100,
    ...theme.shadows.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  clientName: { ...typo.tiny, color: colors.primary, fontWeight: '800' },
  apptTitle: { ...typo.bodyBold, color: colors.slate950, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { ...typo.tiny, fontWeight: '800', fontSize: 9 },
  bgReq: { backgroundColor: '#fef3c7' }, textReq: { color: '#92400e' },
  bgConf: { backgroundColor: '#dcfce7' }, textConf: { color: '#166534' },
  bgCanc: { backgroundColor: colors.errorLight }, textCanc: { color: colors.error },
  bgDone: { backgroundColor: colors.slate100 }, textDone: { color: colors.slate500 },
  detailRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  detail: { ...typo.caption, color: colors.slate600 },
  caseBadge: { ...typo.tiny, color: colors.slate400, marginTop: 4, fontWeight: '600' },
  notes: { ...typo.caption, color: colors.slate500, fontStyle: 'italic', marginTop: 8, backgroundColor: colors.slate50, padding: 8, borderRadius: 6 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  confirmBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  doneBtn: { flex: 1, backgroundColor: colors.success, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  declineBtn: { paddingHorizontal: 16, justifyContent: 'center' },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  declineText: { color: colors.error, fontWeight: '800', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { ...typo.body, color: colors.slate400 },

  formContainer: { backgroundColor: colors.slate50, borderBottomWidth: 1, borderBottomColor: colors.slate100, maxHeight: 400 },
  formLabel: { ...typo.tiny, color: colors.slate500, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.slate200, borderRadius: 8, padding: 12, ...typo.body },
  casePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  caseOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.slate200 },
  caseOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  caseOptionText: { ...typo.tiny, color: colors.slate600 },
  caseOptionTextActive: { color: colors.white, fontWeight: '800' },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 10 },
  submitBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
};
