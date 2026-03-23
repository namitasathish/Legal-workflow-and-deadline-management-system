import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import ClientCard from '../components/ClientCard';
import Header from '../components/Header';
import { theme, buildTypography } from '../constants/theme';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';

export default function ClientsScreen() {
  const navigation = useNavigation();
  const { clients, cases, createClient, updateClient, deleteClient, loading } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // AppContext handles the data, so just a small delay to simulate refresh if needed, 
    // or we could add a specific refresh function to context if it fetched from API
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((c) => (c.name || '').toLowerCase().includes(query));
  }, [q, clients]);

  const [draft, setDraft] = useState({ id: null, name: '', phone: '', email: '', address: '' });
  const [showForm, setShowForm] = useState(false);
  const isEditing = !!draft.id;

  if (loading) {
    return <LoadingState message="Loading clients..." />;
  }

  const startEdit = (client) => {
    setDraft({ ...client });
    setShowForm(true);
  };
  const resetDraft = () => {
    setDraft({ id: null, name: '', phone: '', email: '', address: '' });
    setShowForm(false);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    if (isEditing) {
      await updateClient(draft.id, draft);
    } else {
      await createClient(draft);
    }
    resetDraft();
  };

  const confirmDelete = (clientId) => {
    const linkedCount = cases.filter((x) => x.client_id === clientId).length;
    Alert.alert(
      'System: Client Removal',
      linkedCount
        ? `This client is linked to ${linkedCount} active case(s). Removing the client will clear these links but keep the case files. Proceed?`
        : 'Are you sure you want to remove this client from your directory?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove Client', style: 'destructive', onPress: async () => deleteClient(clientId) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Client Directory"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.searchBar}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name..."
            placeholderTextColor={colors.slate400}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={styles.addToggleBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowForm(!showForm);
          }}
        >
          <Text style={styles.addToggleText}>{showForm ? '✕' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formHeader}>{isEditing ? 'UPDATE CLIENT PROFILE' : 'NEW CLIENT REGISTRATION'}</Text>
          <View style={styles.formCard}>
            <TextInput
              value={draft.name}
              onChangeText={(t) => setDraft((d) => ({ ...d, name: t }))}
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={colors.slate400}
            />
            <View style={styles.row}>
              <TextInput
                value={draft.phone}
                onChangeText={(t) => setDraft((d) => ({ ...d, phone: t }))}
                style={[styles.input, { flex: 1 }]}
                placeholder="Phone Number"
                placeholderTextColor={colors.slate400}
                keyboardType="phone-pad"
              />
              <TextInput
                value={draft.email}
                onChangeText={(t) => setDraft((d) => ({ ...d, email: t }))}
                style={[styles.input, { flex: 1.5 }]}
                placeholder="Email Address"
                placeholderTextColor={colors.slate400}
                autoCapitalize="none"
              />
            </View>
            <TextInput
              value={draft.address}
              onChangeText={(t) => setDraft((d) => ({ ...d, address: t }))}
              style={[styles.input, styles.textArea]}
              placeholder="Physical Address"
              placeholderTextColor={colors.slate400}
              multiline
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.saveBtn, !draft.name.trim() ? styles.btnDisabled : null]}
                onPress={save}
                disabled={!draft.name.trim()}
              >
                <Text style={styles.saveBtnText}>{isEditing ? 'Update Profile' : 'Register Client'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetDraft}>
                <Text style={styles.cancelBtnText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <View style={styles.clientItemContainer}>
            <ClientCard
              item={item}
              onPress={() => navigation.navigate('Client Detail', { clientId: item.id })}
            />
            <View style={styles.clientActionsRow}>
              <View style={styles.caseBadge}>
                <Text style={styles.caseBadgeText}>
                  {cases.filter((x) => x.client_id === item.id).length} Active Cases
                </Text>
              </View>
              <View style={styles.utilityBtns}>
                <TouchableOpacity onPress={() => startEdit(item)} style={styles.utilityBtn}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.utilityBtn}>
                  <Text style={styles.dangerLink}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState 
            icon="👥"
            title="No Clients Found"
            description={q ? "No clients match your search query." : "Your client directory is empty. Tap '+ Add' to register a new client."}
          />
        }
      />
    </View>
  );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, ...typo.body, color: colors.slate800, height: '100%' },
  addToggleBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  addToggleText: { ...typo.bodyBold, color: colors.white },

  formContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  formHeader: {
    ...typo.tiny,
    color: colors.slate500,
    letterSpacing: 1,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.slate100,
    ...theme.shadows.sm,
  },
  input: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typo.body,
    color: colors.slate800,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { ...typo.bodyBold, color: colors.white },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { ...typo.bodyBold, color: colors.slate500 },
  btnDisabled: { opacity: 0.6 },

  listContent: { paddingBottom: 40 },
  clientItemContainer: {
    marginBottom: 16,
  },
  clientActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg + 8,
    marginTop: -8,
  },
  caseBadge: {
    backgroundColor: colors.indigo50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  caseBadgeText: {
    ...typo.tiny,
    color: colors.indigo600,
    fontWeight: '700',
  },
  utilityBtns: { flexDirection: 'row', gap: 16 },
  utilityBtn: { padding: 4 },
  editLink: { ...typo.caption, color: colors.primary, fontWeight: '700' },
  dangerLink: { ...typo.caption, color: colors.error, fontWeight: '700' },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { ...typo.body, color: colors.slate400, textAlign: 'center' },
});
};

