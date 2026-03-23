import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';

export default function ClientPaymentsScreen() {
  const navigation = useNavigation();
  const { user, getClientPayments } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const clientId = user?.linked_client_id;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await getClientPayments(clientId);
      setPayments(rows || []);
    } finally {
      setLoading(false);
    }
  }, [clientId, getClientPayments]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <LoadingState message="Loading payments..." />;
  }

  const pending = payments.filter((p) => p.status === 'Pending');
  const paid = payments.filter((p) => p.status === 'Paid');
  const totalPending = pending.reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaid = paid.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <View style={styles.container}>
      <Header title="Payments & Fees" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.pendingCard]}>
            <Text style={styles.summaryLabel}>OUTSTANDING</Text>
            <Text style={[styles.summaryAmount, { color: colors.warning }]}>₹{totalPending.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, styles.paidCard]}>
            <Text style={styles.summaryLabel}>PAID</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>₹{totalPaid.toLocaleString()}</Text>
          </View>
        </View>

        {/* Pending Payments */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Pending Payments</Text>
            {pending.map((p) => (
              <View key={p.id} style={styles.paymentCard}>
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentIcon}>⏳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentDesc}>{p.description}</Text>
                  {!!p.case_title && <Text style={styles.paymentCase}>📋 {p.case_title}</Text>}
                  {!!p.due_date && <Text style={styles.paymentDue}>Due: {p.due_date?.slice(0, 10)}</Text>}
                </View>
                <Text style={styles.paymentAmount}>₹{(p.amount || 0).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Paid */}
        {paid.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Payment History</Text>
            {paid.map((p) => (
              <View key={p.id} style={[styles.paymentCard, styles.paidRow]}>
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentIcon}>✅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentDesc}>{p.description}</Text>
                  {!!p.case_title && <Text style={styles.paymentCase}>📋 {p.case_title}</Text>}
                  {!!p.paid_date && <Text style={styles.paymentDue}>Paid: {p.paid_date?.slice(0, 10)}</Text>}
                </View>
                <Text style={[styles.paymentAmount, { color: colors.success }]}>₹{(p.amount || 0).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {payments.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No payment records yet.</Text>
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

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1, backgroundColor: colors.surface, padding: 20, borderRadius: theme.radius.xl,
    alignItems: 'center', ...theme.shadows.sm, borderWidth: 1, borderColor: colors.slate100,
  },
  pendingCard: { borderBottomWidth: 3, borderBottomColor: colors.warning },
  paidCard: { borderBottomWidth: 3, borderBottomColor: colors.success },
  summaryLabel: { ...typo.tiny, color: colors.slate400, marginBottom: 8 },
  summaryAmount: { fontSize: 22, fontWeight: '800' },

  section: { marginBottom: 24 },
  sectionHeader: { ...typo.tiny, color: colors.slate500, letterSpacing: 1, marginBottom: 12 },

  paymentCard: {
    backgroundColor: colors.surface, padding: 16, borderRadius: theme.radius.lg,
    marginBottom: 10, borderWidth: 1, borderColor: colors.slate100,
    flexDirection: 'row', alignItems: 'center', ...theme.shadows.sm,
  },
  paidRow: { opacity: 0.7 },
  paymentLeft: { marginRight: 12 },
  paymentIcon: { fontSize: 24 },
  paymentDesc: { ...typo.bodyBold, color: colors.slate800 },
  paymentCase: { ...typo.tiny, color: colors.slate400, marginTop: 2 },
  paymentDue: { ...typo.tiny, color: colors.slate400, marginTop: 2, fontWeight: '400', textTransform: 'none' },
  paymentAmount: { ...typo.h2, color: colors.warning, marginLeft: 10 },

  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { ...typo.body, color: colors.slate400 },
});
};
