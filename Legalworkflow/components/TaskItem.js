import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.slate100,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      borderColor: colors.slate300,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    checkboxOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    check: {
      color: colors.white,
      fontWeight: '900',
      fontSize: 14,
    },
    body: { flex: 1 },
    title: {
      ...typo.bodyBold,
      color: colors.slate800,
    },
    done: {
      textDecorationLine: 'line-through',
      color: colors.slate400,
    },
    meta: {
      ...typo.caption,
      marginTop: 4,
    },
    deleteBtn: {
      padding: theme.spacing.xs,
    },
    deleteText: {
      color: colors.slate400,
      fontWeight: '700',
      fontSize: 16,
    },
  });
};

export default function TaskItem({ task, onToggle, onDelete }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onToggle}
        style={[styles.checkbox, task.completed ? styles.checkboxOn : null]}
        activeOpacity={0.7}
      >
        {task.completed ? <Text style={styles.check}>✓</Text> : null}
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={[styles.title, task.completed ? styles.done : null]} numberOfLines={2}>
          {task.title}
        </Text>
        {!!task.due_date && (
          <Text style={styles.meta}>
            🗓 Due: {String(task.due_date).slice(0, 10)}
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={10}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
