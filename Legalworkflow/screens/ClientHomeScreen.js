import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';

export default function ClientHomeScreen() {
  const navigation = useNavigation();
  const { user, cases, clientsById, logout, getClientDocumentRequests, getClientPayments, getAppointments, getGlobalUnreadCounts } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);


  const clientId = user?.linked_client_id;
  const client = clientId ? clientsById.get(clientId) : null;

  const myCases = useMemo(() => {
    return cases.filter((c) => c.client_id === clientId);
  }, [cases, clientId]);

  const openCases = myCases.filter((c) => c.status !== 'Closed');
  const closedCases = myCases.filter((c) => c.status === 'Closed');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const [pendingDocs, setPendingDocs] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [globalUnread, setGlobalUnread] = useState({ messages: 0, documents: 0, appointments: 0, total: 0 });
  const [upcomingAppts, setUpcomingAppts] = useState(0);
  const [caseNotifications, setCaseNotifications] = useState({});

  const { getUnreadCounts } = useApp();

  const loadStats = useCallback(async () => {
    setRefreshing(true);
    setStatsLoading(true);
    try {
      const docs = await getClientDocumentRequests(clientId);
      setPendingDocs((docs || []).filter((d) => d.status === 'Pending').length);
      const pays = await getClientPayments(clientId);
      const pp = (pays || []).filter(p => p.status === 'Pending');
      setPendingPayments(pp.length);
      const unread = await getGlobalUnreadCounts();
      setGlobalUnread(unread);
      const appts = await getAppointments({ clientId });
      setUpcomingAppts((appts || []).filter((a) => a.status === 'Confirmed' || a.status === 'Requested').length);
      
      // Load per-case notifications
      const notifyMap = {};
      for (const c of myCases) {
        const counts = await getUnreadCounts(c.id);
        notifyMap[c.id] = (counts.messages || 0) + (counts.documents || 0);
      }
      setCaseNotifications(notifyMap);

    } catch (e) { } finally {
      setRefreshing(false);
      setStatsLoading(false);
    }
  }, [clientId, getClientDocumentRequests, getClientPayments, getAppointments, myCases, getUnreadCounts, getUnreadCounts]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  if (statsLoading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  const renderCase = ({ item }) => {
    const hasNotify = caseNotifications[item.id] > 0;
    return (
      <TouchableOpacity
        style={styles.caseCard}
        onPress={() => navigation.navigate('Client Case View', { caseId: item.id })}
      >
        <View style={styles.caseInfo}>
          <View style={[styles.priorityDot, item.priority === 'High' ? styles.dotHigh : item.priority === 'Low' ? styles.dotLow : styles.dotMed]} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.caseTitle} numberOfLines={1}>{item.case_title}</Text>
              {hasNotify && <View style={styles.redDot} />}
            </View>
            <Text style={styles.caseMeta}>{item.court_name || 'Court not specified'}</Text>
          </View>
        </View>
        <View style={styles.caseRight}>
          <View style={[styles.statusBadge, item.status === 'Closed' ? styles.statusClosed : styles.statusOpen]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          {item.deadline_date && (
            <Text style={styles.caseDate}>{String(item.deadline_date).slice(0, 10)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{client?.name || user?.name || 'Client'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {globalUnread.total > 0 && (
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const lines = [];
                if (globalUnread.messages > 0) lines.push(`💬 ${globalUnread.messages} unread message${globalUnread.messages > 1 ? 's' : ''}`);
                if (globalUnread.documents > 0) lines.push(`📄 ${globalUnread.documents} pending document${globalUnread.documents > 1 ? 's' : ''}`);
                if (globalUnread.appointments > 0) lines.push(`📅 ${globalUnread.appointments} confirmed appointment${globalUnread.appointments > 1 ? 's' : ''}`);
                Alert.alert('Notifications', lines.join('\n'));
              }}
            >
              <Text style={styles.bellIconText}>🔔</Text>
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeNum}>{globalUnread.total > 99 ? '99+' : globalUnread.total}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              logout();
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statPrimary]}>
            <Text style={styles.statNum}>{openCases.length}</Text>
            <Text style={styles.statLabel}>Active Cases</Text>
          </View>
          <View style={[styles.statCard, styles.statWarning]}>
            <Text style={styles.statNum}>{pendingDocs}</Text>
            <Text style={styles.statLabel}>Docs Requested</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statInfo]}>
            <Text style={styles.statNum}>{pendingPayments}</Text>
            <Text style={styles.statLabel}>Pending Fees</Text>
          </View>
          <View style={[styles.statCard, { borderBottomWidth: 3, borderBottomColor: colors.success }]}>
            <Text style={styles.statNum}>{upcomingAppts}</Text>
            <Text style={styles.statLabel}>Upcoming Appts</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.quickRow}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadStats} colors={[colors.primary]} />
            }
          >
            <TouchableOpacity 
              style={styles.quickBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Client Payments');
              }}
            >
              <Text style={styles.quickIcon}>💰</Text>
              <Text style={styles.quickLabel}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Client Appointments');
              }}
            >
              <Text style={styles.quickIcon}>📅</Text>
              <Text style={styles.quickLabel}>Appointments</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Client Documents');
              }}
            >
              <Text style={styles.quickIcon}>📚</Text>
              <Text style={styles.quickLabel}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Client Settings');
              }}
            >
              <Text style={styles.quickIcon}>⚙️</Text>
              <Text style={styles.quickLabel}>Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Active Cases */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Your Active Cases</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search cases by title or court..."
            placeholderTextColor={colors.slate400}
            style={styles.searchInput}
          />
          {openCases.filter(c => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return (c.case_title || '').toLowerCase().includes(q) ||
              (c.court_name || '').toLowerCase().includes(q);
          }).length === 0 ? (
            <EmptyState 
              icon="⚖️"
              title="No Active Cases"
              description={search ? "No cases match your search." : "You don't have any active cases in your portal right now."}
            />
          ) : (
            openCases.filter(c => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (c.case_title || '').toLowerCase().includes(q) ||
                (c.court_name || '').toLowerCase().includes(q);
            }).map((c) => (
              <View key={c.id}>{renderCase({ item: c })}</View>
            ))
          )}
        </View>

        {/* Closed Cases */}
        {closedCases.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Resolved Cases</Text>
            {closedCases.map((c) => (
              <View key={c.id}>{renderCase({ item: c })}</View>
            ))}
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
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: colors.surface, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    ...theme.shadows.sm,
  },
  greeting: { ...typo.caption, color: colors.slate400 },
  userName: { ...typo.h2, color: colors.slate950 },
  logoutBtn: {
    backgroundColor: colors.errorLight, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  logoutText: { color: colors.error, fontWeight: '800', fontSize: 13 },
  content: { padding: 20, paddingBottom: 40 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: theme.radius.lg,
    alignItems: 'center', borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm,
  },
  statPrimary: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  statWarning: { borderBottomWidth: 3, borderBottomColor: colors.warning },
  statInfo: { borderBottomWidth: 3, borderBottomColor: colors.info },
  statNum: { ...typo.h1, fontSize: 24, color: colors.slate800 },
  statLabel: { ...typo.tiny, color: colors.slate400, marginTop: 4, textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionHeader: { ...typo.tiny, color: colors.slate500, letterSpacing: 1, marginBottom: 12 },

  quickRow: { gap: 12, paddingRight: 20 },
  quickBtn: {
    backgroundColor: colors.surface, padding: 16, borderRadius: theme.radius.lg, alignItems: 'center',
    width: 90, borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm,
  },
  quickIcon: { fontSize: 24, marginBottom: 4 },
  quickLabel: { ...typo.tiny, fontSize: 9, color: colors.slate600, textAlign: 'center' },

  caseCard: {
    backgroundColor: colors.surface, padding: 16, borderRadius: theme.radius.lg,
    marginBottom: 10, borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  caseInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  dotHigh: { backgroundColor: colors.error },
  dotMed: { backgroundColor: colors.warning },
  dotLow: { backgroundColor: colors.success },
  caseTitle: { ...typo.bodyBold, color: colors.slate800 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, marginLeft: 2 },
  caseMeta: { ...typo.tiny, color: colors.slate400, marginTop: 2 },
  caseRight: { alignItems: 'flex-end', marginLeft: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusOpen: { backgroundColor: '#eef2ff' },
  statusClosed: { backgroundColor: colors.successLight },
  statusText: { ...typo.tiny, fontWeight: '800', fontSize: 9 },
  caseDate: { ...typo.tiny, color: colors.slate400, marginTop: 4 },

  emptyCard: { padding: 32, alignItems: 'center', backgroundColor: colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: colors.slate100 },
  emptyText: { ...typo.body, color: colors.slate400, textAlign: 'center' },

  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...typo.body,
    color: colors.slate800,
    marginBottom: 12,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellIconText: {
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
