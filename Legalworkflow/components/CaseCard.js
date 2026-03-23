import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import { getCaseDueDate } from '../utils/deadlineEngine';

function getPriorityStyles(colors, priority) {
  switch (priority) {
    case 'High':
      return { bg: colors.errorLight, text: colors.error };
    case 'Medium':
      return { bg: colors.warningLight, text: colors.warning };
    case 'Low':
      return { bg: colors.successLight, text: colors.success };
    default:
      return { bg: colors.slate100, text: colors.slate500 };
  }
}

function urgencyBadge(colors, item) {
  const daysLeft = item._daysLeft;
  if (daysLeft === undefined || daysLeft === null) return null;
  if (item._overdue || daysLeft < 0)
    return { emoji: '🔴', text: `${Math.abs(daysLeft)}d overdue`, color: colors.error, bg: colors.errorLight };
  if (daysLeft === 0)
    return { emoji: '🔴', text: 'Due today', color: colors.error, bg: colors.errorLight };
  if (daysLeft <= 2)
    return { emoji: '🟡', text: `${daysLeft}d left`, color: colors.warning, bg: colors.warningLight };
  return { emoji: '🟢', text: `${daysLeft}d left`, color: colors.success, bg: colors.successLight };
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      marginVertical: theme.spacing.sm,
      ...theme.shadows.sm,
      borderWidth: 1,
      borderColor: colors.slate100,
    },
    header: {
      marginBottom: theme.spacing.md,
    },
    titleContainer: {
      flexDirection: 'column',
      gap: 6,
    },
    title: {
      ...typo.h3,
      color: colors.slate800,
    },
    priorityPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.radius.sm,
    },
    priorityText: {
      ...typo.tiny,
      fontWeight: '800',
    },
    divider: {
      height: 1,
      backgroundColor: colors.slate100,
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      gap: 16,
    },
    infoItem: {
      flex: 1,
    },
    label: {
      ...typo.tiny,
      color: colors.slate400,
      marginBottom: 2,
    },
    value: {
      ...typo.bodyBold,
      color: colors.slate600,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    statusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.slate50,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radius.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    dotOpen: { backgroundColor: colors.info },
    dotClosed: { backgroundColor: colors.success },
    dotOther: { backgroundColor: colors.slate400 },
    statusOpen: { backgroundColor: colors.infoLight },
    statusClosed: { backgroundColor: colors.successLight },
    statusOther: { backgroundColor: colors.slate100 },
    statusText: {
      ...typo.tiny,
      color: colors.slate800,
    },
    urgencyPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radius.sm,
    },
    urgencyText: {
      ...typo.bodyBold,
      fontSize: 11,
    },
  });
};

export default function CaseCard({ item, clientName, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  let enriched = item;
  if (item._daysLeft === undefined) {
    const due = getCaseDueDate(item);
    if (due) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const d = new Date(due);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      enriched = { ...item, _daysLeft: diff, _overdue: diff < 0 };
    }
  }

  const badge = urgencyBadge(colors, enriched);
  const pStyles = getPriorityStyles(colors, item.priority);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.case_title || 'Untitled Case'}
          </Text>
          <View style={[styles.priorityPill, { backgroundColor: pStyles.bg }]}>
            <Text style={[styles.priorityText, { color: pStyles.text }]}>{item.priority || 'Medium'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>CLIENT</Text>
          <Text style={styles.value} numberOfLines={1}>{clientName || 'N/A'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>COURT</Text>
          <Text style={styles.value} numberOfLines={1}>{item.court_name || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.statusTag, item.status === 'Open' ? styles.statusOpen : item.status === 'Closed' ? styles.statusClosed : styles.statusOther]}>
          <View style={[styles.dot, item.status === 'Open' ? styles.dotOpen : item.status === 'Closed' ? styles.dotClosed : styles.dotOther]} />
          <Text style={styles.statusText}>{item.status || 'Open'}</Text>
        </View>

        {badge && (
          <View style={[styles.urgencyPill, { backgroundColor: badge.bg }]}>
            <Text style={[styles.urgencyText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
