import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getOverdueCases } from '../utils/deadlineEngine';
import CaseCard from '../components/CaseCard';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';

const PRIORITIES = ['All', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Open', 'In Progress', 'On Hold', 'Closed', 'Archived'];

export default function HomeScreen() {
  const navigation = useNavigation();
  const {
    cases, clients, urgentCases, todayCases, loading,
    getPendingFollowUps, getActivityLog, clientsById, user,     getGlobalUnreadCounts
  } = useApp();

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [followUps, setFollowUps] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [globalUnread, setGlobalUnread] = useState({ messages: 0, documents: 0, appointments: 0, total: 0 });

  const loadExtras = useCallback(async () => {
    setRefreshing(true);
    try {
      const fu = await getPendingFollowUps();
      setFollowUps(fu || []);
      const al = await getActivityLog(5);
      setRecentActivity(al || []);
      const unread = await getGlobalUnreadCounts();
      setGlobalUnread(unread);
    } catch (e) { 
    } finally {
      setRefreshing(false);
    }
  }, [getPendingFollowUps, getActivityLog, getGlobalUnreadCounts]);

  useFocusEffect(
    useCallback(() => {
      loadExtras();
    }, [loadExtras])
  );

  const overdueCases = useMemo(() => getOverdueCases(cases), [cases]);
  const openCount = useMemo(() => cases.filter((c) => c.status !== 'Closed').length, [cases]);
  const closedCount = useMemo(() => cases.filter((c) => c.status === 'Closed').length, [cases]);

  const filtered = useMemo(() => {
    let list = cases;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        (c.case_title || '').toLowerCase().includes(q) ||
        (c.court_name || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q) ||
        (clientsById.get(c.client_id)?.name || '').toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== 'All') list = list.filter((c) => c.priority === priorityFilter);
    if (statusFilter !== 'All') list = list.filter((c) => c.status === statusFilter);
    return list;
  }, [cases, search, priorityFilter, statusFilter, clientsById]);

  const getClientName = (clientId) => clientsById.get(clientId)?.name || '';

  const ListHeader = () => (
    <View style={styles.contentPadding}>
      {/* Stats Dashboard */}
      <View style={styles.statsGrid}>

        <View style={styles.statsColumn}>
          <View style={[styles.statItem, styles.statMain]}>
            <Text style={styles.statLabel}>TOTAL CASES</Text>
            <Text style={styles.statNum}>{cases.length}</Text>
          </View>
          <View style={[styles.statItem, styles.statError]}>
            <Text style={[styles.statLabel, styles.textError]}>OVERDUE</Text>
            <Text style={[styles.statNum, styles.textError]}>{overdueCases.length}</Text>
          </View>
        </View>
        <View style={styles.statsColumn}>
          <View style={[styles.statItem, styles.statPrimary]}>
            <Text style={[styles.statLabel, styles.textPrimary]}>OPEN</Text>
            <Text style={[styles.statNum, styles.textPrimary]}>{openCount}</Text>
          </View>
          <View style={[styles.statItem, styles.statSuccess]}>
            <Text style={[styles.statLabel, styles.textSuccess]}>CLOSED</Text>
            <Text style={[styles.statNum, styles.textSuccess]}>{closedCount}</Text>
          </View>
        </View>
      </View>

      {/* Today Section */}
      {todayCases.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Today's Deadlines</Text>
          {todayCases.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.alertCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Case Detail', { caseId: c.id });
              }}
            >
              <View style={styles.alertIndicator} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle} numberOfLines={1}>{c.case_title}</Text>
                <Text style={styles.alertSub}>Due by end of day</Text>
              </View>
              <Text style={styles.alertArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Navigation Shortcuts */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Quick Access</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutScroll}>
          {[
            { id: 'weekly', title: 'Weekly', icon: '📆', screen: 'Weekly Planner', color: '#3b82f6' },
            { id: 'appts', title: 'Appts', icon: '📅', screen: 'Lawyer Appointments', color: '#8b5cf6' },
            { id: 'billing', title: 'Billing', icon: '💰', screen: 'Lawyer Payments', color: '#10b981' },
            { id: 'feedback', title: 'Ratings', icon: '⭐', screen: 'Lawyer Feedback', color: '#f59e0b' },
            { id: 'docs', title: 'Library', icon: '📚', screen: 'Documents', color: '#06b6d4' },
            { id: 'acts', title: 'Bare Acts', icon: '🏛️', screen: 'Bare Acts', color: '#6366f1' },
            { id: 'fir', title: 'FIR Tool', icon: '📄', screen: 'FIR Builder', color: '#ef4444' },
            { id: 'firHistory', title: 'My FIRs', icon: '📋', screen: 'FIR History', color: '#b91c1c' },
            { id: 'archive', title: 'Archive', icon: '📁', screen: 'Closed Cases', color: '#64748b' },
            { id: 'stats', title: 'Stats', icon: '📊', screen: 'Analytics', color: '#ec4899' },
            { id: 'clients', title: 'Clients', icon: '👥', screen: 'Clients', color: '#a855f7' },
            { id: 'activity', title: 'Activity', icon: '📋', screen: 'Activity Log', color: '#f43f5e' },
          ].map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.shortcutBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(item.screen);
              }}
            >
              <Text style={styles.shortcutIcon}>{item.icon}</Text>
              <Text style={styles.shortcutText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Urgent Cases */}
      {urgentCases.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Priority Attention</Text>
          {urgentCases.slice(0, 3).map((c) => (
            <CaseCard 
              key={c.id} 
              item={c} 
              clientName={getClientName(c.client_id)} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Case Detail', { caseId: c.id });
              }} 
            />
          ))}
        </View>
      )}

      {/* Search & Filter Section */}
      <View style={styles.searchContainer}>
        <Text style={styles.sectionHeader}>All Cases</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title, court, or client..."
          placeholderTextColor={colors.slate400}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterChip, priorityFilter === p && styles.filterChipActive]}
              onPress={() => setPriorityFilter(p)}
            >
              <Text style={[styles.filterChipText, priorityFilter === p && styles.filterChipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingState message="Loading your cases..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>LegalWorkflow</Text>
            <Text style={styles.headerUser}>Counsel {user?.name?.split(' ')[0] || 'Lawyer'}</Text>
          </View>
          <View style={styles.headerActions}>
            {globalUnread.total > 0 && (
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const lines = [];
                  if (globalUnread.messages > 0) lines.push(`💬 ${globalUnread.messages} unread message${globalUnread.messages > 1 ? 's' : ''}`);
                  if (globalUnread.documents > 0) lines.push(`📄 ${globalUnread.documents} pending document${globalUnread.documents > 1 ? 's' : ''}`);
                  if (globalUnread.appointments > 0) lines.push(`📅 ${globalUnread.appointments} appointment request${globalUnread.appointments > 1 ? 's' : ''}`);
                  Alert.alert('Notifications', lines.join('\n'));
                }}
              >
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.badgeCircle}>
                  <Text style={styles.badgeNum}>{globalUnread.total > 99 ? '99+' : globalUnread.total}</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.settingsBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Settings');
              }}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.primaryAddBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Add Case');
              }}
            >
              <Text style={styles.primaryAddBtnText}>+ New Case</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadExtras} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <CaseCard 
              item={item} 
              clientName={getClientName(item.client_id)} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Case Detail', { caseId: item.id });
              }} 
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState 
            icon="⚖️"
            title="No Cases Found"
            description={search ? "No cases match your filters." : "Your case directory is empty. Tap '+ New Case' to get started."}
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
  header: {
    paddingTop: 60,
    backgroundColor: colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    ...theme.shadows.sm,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsBtn: {
    padding: 8,
    backgroundColor: colors.slate50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  settingsIcon: {
    fontSize: 18,
  },
  headerTitle: {
    ...typo.h2,
    color: colors.slate950,
  },
  headerUser: {
    ...typo.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  primaryAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    ...theme.shadows.md,
  },
  primaryAddBtnText: {
    ...typo.bodyBold,
    color: colors.white,
  },
  listContent: {
    paddingBottom: 40,
  },
  contentPadding: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  statsColumn: {
    flex: 1,
    gap: 12,
  },
  statItem: {
    backgroundColor: colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.slate100,
    ...theme.shadows.sm,
  },
  statMain: { borderLeftWidth: 4, borderLeftColor: colors.slate800 },
  statPrimary: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  statError: { borderLeftWidth: 4, borderLeftColor: colors.error },
  statSuccess: { borderLeftWidth: 4, borderLeftColor: colors.success },
  statLabel: {
    ...typo.tiny,
    color: colors.slate400,
    marginBottom: 4,
  },
  statNum: {
    ...typo.h1,
    fontSize: 28,
  },
  textPrimary: { color: colors.primary },
  textError: { color: colors.error },
  textSuccess: { color: colors.success },

  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    ...typo.tiny,
    color: colors.slate500,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca', // Red 200
  },
  alertIndicator: {
    width: 4,
    height: 32,
    backgroundColor: colors.error,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typo.bodyBold,
    color: colors.slate800,
  },
  alertSub: {
    ...typo.caption,
    color: colors.error,
  },
  alertArrow: {
    fontSize: 20,
    color: colors.error,
    fontWeight: '700',
  },

  shortcutScroll: {
    gap: 12,
    paddingRight: 20,
  },
  shortcutBtn: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    width: 80,
    borderWidth: 1,
    borderColor: colors.slate100,
    ...theme.shadows.sm,
  },
  shortcutIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  shortcutText: {
    ...typo.tiny,
    fontSize: 9,
    color: colors.slate600,
    textAlign: 'center',
  },

  searchContainer: {
    marginTop: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: theme.radius.md,
    padding: 12,
    ...typo.body,
    marginBottom: theme.spacing.md,
  },
  filterBar: {
    marginBottom: theme.spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.slate800,
    borderColor: colors.slate800,
  },
  filterChipText: {
    ...typo.caption,
    color: colors.slate600,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.slate200,
    marginHorizontal: 8,
    alignSelf: 'center',
  },

  cardWrapper: {
    paddingHorizontal: theme.spacing.lg,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...typo.body,
    color: colors.slate400,
    textAlign: 'center',
  },

  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginBottom: 12,
    gap: 10,
  },
  notifIcon: { fontSize: 22 },
  notifText: {
    ...typo.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellIcon: {
    fontSize: 22,
  },
  badgeCircle: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeNum: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});
};
