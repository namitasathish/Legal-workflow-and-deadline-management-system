import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';

export default function LawyerFeedbackScreen() {
  const navigation = useNavigation();
  const { getAllFeedback } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await getAllFeedback();
    setFeedback(rows || []);
    setLoading(false);
  }, [getAllFeedback]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <LoadingState message="Loading feedback..." />;
  }

  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : 'N/A';

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.caseTitle}>{item.case_title}</Text>
        <View style={styles.starRow}>
          {[1,2,3,4,5].map(s => (
            <Text key={s} style={[styles.star, s <= item.rating && styles.starOn]}>{s <= item.rating ? '★' : '☆'}</Text>
          ))}
        </View>
      </View>
      <Text style={styles.clientInfo}>by {item.client_name || 'Incognito'}</Text>
      {!!item.comment && (
        <View style={styles.bubble}>
          <Text style={styles.comment}>"{item.comment}"</Text>
        </View>
      )}
      <Text style={styles.date}>{item.created_at?.slice(0, 10)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Client Feedback" showBack onBack={() => navigation.goBack()} />
      <View style={styles.statsCard}>
        <Text style={styles.avgLabel}>OVERALL RATING</Text>
        <Text style={styles.avgVal}>{avgRating}</Text>
        <Text style={styles.count}>{feedback.length} reviews submitted</Text>
      </View>

      <FlatList
        data={feedback}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={load}
        refreshing={loading}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No feedback yet.</Text></View>}
      />
    </View>
  );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statsCard: { margin: 16, backgroundColor: colors.slate950, padding: 24, borderRadius: 20, alignItems: 'center' },
  avgLabel: { ...typo.tiny, color: colors.slate400, letterSpacing: 2 },
  avgVal: { fontSize: 42, color: colors.white, fontWeight: '900', marginVertical: 8 },
  count: { ...typo.caption, color: colors.slate500 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, ...theme.shadows.sm, borderWidth: 1, borderColor: colors.slate100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  caseTitle: { ...typo.bodyBold, color: colors.slate800, flex: 1 },
  starRow: { flexDirection: 'row' },
  star: { fontSize: 16, color: colors.slate200 },
  starOn: { color: '#f59e0b' },
  clientInfo: { ...typo.tiny, color: colors.slate400 },
  bubble: { backgroundColor: colors.slate50, padding: 12, borderRadius: 12, marginTop: 12, borderLeftWidth: 3, borderLeftColor: colors.primary },
  comment: { ...typo.body, color: colors.slate700, fontStyle: 'italic' },
  date: { ...typo.tiny, color: colors.slate300, marginTop: 12, textAlign: 'right', fontWeight: '400', textTransform: 'none' },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { color: colors.slate400 },
});
};
