import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';

const priorities = ['High', 'Medium', 'Low'];
const statuses = ['Open', 'In Progress', 'On Hold', 'Closed', 'Archived'];

const createDpStyles = (colors) => StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.slate700, marginBottom: 8 },
  touchable: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.slate200,
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14,
  },
  text: { fontSize: 15, color: colors.slate800 },
  placeholder: { color: colors.slate400 },
  icon: { fontSize: 16 },
  clearBtn: { marginTop: 4, alignSelf: 'flex-end' },
  clearText: { fontSize: 12, color: colors.error, fontWeight: '700' },
});

function DatePickerField({ label, value, onChange }) {
  const { colors } = useTheme();
  const dpStyles = useMemo(() => createDpStyles(colors), [colors]);
  const [show, setShow] = useState(false);
  const dateObj = value ? new Date(value) : null;
  const displayText = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  const handleChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate.toISOString().slice(0, 10));
    }
  };

  return (
    <View style={dpStyles.wrapper}>
      <Text style={dpStyles.label}>{label}</Text>
      <TouchableOpacity style={dpStyles.touchable} onPress={() => setShow(true)}>
        <Text style={[dpStyles.text, !displayText && dpStyles.placeholder]}>
          {displayText || 'Tap to select date'}
        </Text>
        <Text style={dpStyles.icon}>📅</Text>
      </TouchableOpacity>
      {value ? (
        <TouchableOpacity onPress={() => onChange('')} style={dpStyles.clearBtn}>
          <Text style={dpStyles.clearText}>Clear</Text>
        </TouchableOpacity>
      ) : null}
      {show && (
        <DateTimePicker
          value={dateObj && !isNaN(dateObj.getTime()) ? dateObj : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

export default function AddCaseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const editCaseId = route.params?.caseId || null;

  const { cases, clients, createCase, updateCase } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const existing = useMemo(() => cases.find((c) => c.id === editCaseId) || null, [cases, editCaseId]);

  const [caseTitle, setCaseTitle] = useState(existing?.case_title || '');
  const [courtName, setCourtName] = useState(existing?.court_name || '');
  const [clientId, setClientId] = useState(existing?.client_id || '');
  const [filingDate, setFilingDate] = useState(existing?.filing_date || '');
  const [nextHearing, setNextHearing] = useState(existing?.next_hearing_date || '');
  const [deadline, setDeadline] = useState(existing?.deadline_date || '');
  const [priority, setPriority] = useState(existing?.priority || 'Medium');
  const [status, setStatus] = useState(existing?.status || 'Open');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!caseTitle.trim()) return;
    setSaving(true);
    try {
      const payload = {
        case_title: caseTitle,
        court_name: courtName,
        client_id: clientId || null,
        filing_date: filingDate || null,
        next_hearing_date: nextHearing || null,
        deadline_date: deadline || null,
        priority,
        status,
        notes,
      };
      if (existing) {
        await updateCase(existing.id, payload);
      } else {
        await createCase(payload);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={existing ? 'Edit Case' : 'New Case'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>General Information</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Case Title *</Text>
            <TextInput
              value={caseTitle}
              onChangeText={setCaseTitle}
              style={styles.input}
              placeholder="e.g. State vs John Doe"
              placeholderTextColor={colors.slate400}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Court / Forum</Text>
            <TextInput
              value={courtName}
              onChangeText={setCourtName}
              style={styles.input}
              placeholder="e.g. High Court, Bench III"
              placeholderTextColor={colors.slate400}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Client Connection</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            <TouchableOpacity
              style={[styles.pill, !clientId ? styles.pillActive : null]}
              onPress={() => setClientId('')}
            >
              <Text style={[styles.pillText, !clientId ? styles.pillTextActive : null]}>Unlinked</Text>
            </TouchableOpacity>
            {clients.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.pill, clientId === c.id ? styles.pillActive : null]}
                onPress={() => setClientId(c.id)}
              >
                <Text style={[styles.pillText, clientId === c.id ? styles.pillTextActive : null]} numberOfLines={1}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.hint}>Clients can be managed in the directory.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Timelines & Deadlines</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <DatePickerField label="Filing Date" value={filingDate} onChange={setFilingDate} />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerField label="Next Hearing" value={nextHearing} onChange={setNextHearing} />
            </View>
          </View>
          <DatePickerField label="Final Deadline" value={deadline} onChange={setDeadline} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Priority & Status</Text>
          <View style={styles.pillsRow}>
            {priorities.map((p) => (
              <TouchableOpacity key={p} style={[styles.pill, priority === p ? styles.pillActive : null]} onPress={() => setPriority(p)}>
                <Text style={[styles.pillText, priority === p ? styles.pillTextActive : null]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.pillsRow, { marginTop: 12 }]}>
            {statuses.map((s) => (
              <TouchableOpacity key={s} style={[styles.pill, status === s ? styles.pillActive : null]} onPress={() => setStatus(s)}>
                <Text style={[styles.pillText, status === s ? styles.pillTextActive : null]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes & Brief</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.textArea]}
            multiline
            placeholder="Add relevant case details..."
            placeholderTextColor={colors.slate400}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (!caseTitle.trim() || saving) ? styles.btnDisabled : null]}
          onPress={handleSave}
          disabled={!caseTitle.trim() || saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving Entries...' : 'Save Case Information'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 60 },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    ...typo.tiny,
    color: colors.slate500,
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    ...typo.caption,
    color: colors.slate700,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typo.body,
    color: colors.slate800,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: theme.radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: colors.slate800,
    borderColor: colors.slate800,
  },
  pillText: {
    ...typo.caption,
    color: colors.slate600,
  },
  pillTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  hint: {
    ...typo.tiny,
    color: colors.slate400,
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 12,
    ...theme.shadows.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...typo.subtitle,
    color: colors.white,
  },
});
};

