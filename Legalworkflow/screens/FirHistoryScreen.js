import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import LoadingState from '../components/LoadingState';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';

export default function FirHistoryScreen() {
  const navigation = useNavigation();
  const { getFirHistory, cases } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rows = await getFirHistory();
    setFirs(rows || []);
    setLoading(false);
  }, [getFirHistory]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <LoadingState message="Loading FIR records..." />;
  }

  const renderFir = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Alert.alert('FIR Content', item.data?.slice(0, 500) + (item.data?.length > 500 ? '...' : ''), [{ text: 'Close' }])}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>📄</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            FIR — {item.case_title || 'Unlinked Case'}
          </Text>
          <Text style={styles.cardDate}>
            Created: {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Unknown'}
          </Text>
        </View>
        <View style={[styles.statusBadge, item.case_title ? styles.badgeLinked : styles.badgeUnlinked]}>
          <Text style={styles.statusText}>{item.case_title ? 'Linked' : 'Unlinked'}</Text>
        </View>
      </View>

      {/* Preview of FIR text */}
      <Text style={styles.preview} numberOfLines={3}>
        {item.data || 'No content'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="FIR History" showBack onBack={() => navigation.goBack()} />

      <FlatList
        data={firs}
        keyExtractor={(item) => item.id}
        renderItem={renderFir}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              No FIRs generated yet.
            </Text>
            <Text style={styles.emptyHint}>
              Use the FIR Builder to create your first FIR.
            </Text>
            <TouchableOpacity
              style={styles.goToBuilderBtn}
              onPress={() => navigation.navigate('FIR Builder')}
            >
              <Text style={styles.goToBuilderText}>Open FIR Builder</Text>
            </TouchableOpacity>
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
  listContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate100,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cardIcon: { fontSize: 28 },
  cardTitle: {
    ...typo.bodyBold,
    color: colors.slate800,
  },
  cardDate: {
    ...typo.tiny,
    color: colors.slate400,
    marginTop: 2,
    textTransform: 'none',
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeLinked: { backgroundColor: colors.successLight },
  badgeUnlinked: { backgroundColor: colors.warningLight },
  statusText: {
    ...typo.tiny,
    fontWeight: '800',
    fontSize: 9,
  },
  preview: {
    ...typo.caption,
    color: colors.slate500,
    backgroundColor: colors.slate50,
    padding: 10,
    borderRadius: theme.radius.md,
    lineHeight: 18,
  },

  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    ...typo.subtitle,
    color: colors.slate400,
    textAlign: 'center',
  },
  emptyHint: {
    ...typo.caption,
    color: colors.slate300,
    marginTop: 4,
    textAlign: 'center',
  },
  goToBuilderBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  goToBuilderText: {
    color: colors.white,
    fontWeight: '800',
  },
});
};
