import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';

export default function LawyerPaymentsScreen() {
  const navigation = useNavigation();
  const { cases, getPayments, markPaymentPaid } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let masterList = [];
    for (const c of cases) {
      const ps = await getPayments(c.id);
      masterList = masterList.concat(ps.map(p => ({ ...p, case_title: c.case_title })));
    }
    // Sort by created_at desc
    masterList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setAllPayments(masterList);
    setLoading(false);
  }, [cases, getPayments]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <LoadingState message="Loading billing records..." />;
  }

  const stats = allPayments.reduce((acc, p) => {
    if (p.status === 'Paid') acc.paid += (p.amount || 0);
    else acc.pending += (p.amount || 0);
    return acc;
  }, { paid: 0, pending: 0 });

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.caseTitle}>{item.case_title}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.date}>{(item.paid_date || item.created_at)?.slice(0, 10)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.amount, item.status === 'Paid' ? styles.textPaid : styles.textPend]}>
          ₹{(item.amount || 0).toLocaleString()}
        </Text>
        {item.status === 'Pending' ? (
          <TouchableOpacity style={styles.markBtn} onPress={async () => { await markPaymentPaid(item.id); load(); }}>
            <Text style={styles.markText}>Recv Payment</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paidBagde}><Text style={styles.paidBadgeText}>PAID</Text></View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="All Billing" showBack onBack={() => navigation.goBack()} />
      <View style={styles.sumRow}>
        <View style={[styles.sumCard, { backgroundColor: '#ecfdf5' }]}>
          <Text style={styles.sumLabel}>REVENUE RECEIVED</Text>
          <Text style={[styles.sumVal, { color: '#059669' }]}>₹{stats.paid.toLocaleString()}</Text>
        </View>
        <View style={[styles.sumCard, { backgroundColor: '#fffbeb' }]}>
          <Text style={styles.sumLabel}>OUTSTANDING FEES</Text>
          <Text style={[styles.sumVal, { color: '#d97706' }]}>₹{stats.pending.toLocaleString()}</Text>
        </View>
      </View>

      <FlatList
        data={allPayments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={load}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>No financial records found.</Text></View>
        }
      />
    </View>
  );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sumRow: { flexDirection: 'row', padding: 16, gap: 12 },
  sumCard: { flex: 1, padding: 16, borderRadius: 12, ...theme.shadows.sm },
  sumLabel: { ...typo.tiny, color: colors.slate400, fontSize: 8, letterSpacing: 1 },
  sumVal: { ...typo.h2, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 60 },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm },
  caseTitle: { ...typo.tiny, color: colors.primary, fontWeight: '800' },
  desc: { ...typo.bodyBold, color: colors.slate800, marginTop: 2 },
  date: { ...typo.tiny, color: colors.slate400, marginTop: 2, fontWeight: '400', textTransform: 'none' },
  amount: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
  textPaid: { color: colors.success },
  textPend: { color: colors.warning },
  markBtn: { backgroundColor: colors.slate800, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  markText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  paidBagde: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#f0fdf4' },
  paidBadgeText: { color: '#16a34a', fontSize: 9, fontWeight: '900' },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { color: colors.slate400 },
});
};
