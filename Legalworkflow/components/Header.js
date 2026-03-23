import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
    },
    leftCol: {
      flex: 1,
      alignItems: 'flex-start',
    },
    centerCol: {
      flex: 3,
      alignItems: 'center',
    },
    rightCol: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
    },
    title: {
      ...typo.h3,
      color: colors.slate800,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backArrow: {
      fontSize: 20,
      color: colors.primary,
      marginRight: 4,
      marginTop: -2,
    },
    actionText: {
      ...typo.bodyBold,
      color: colors.primary,
    },
    rightActionText: {
      ...typo.bodyBold,
      color: colors.primary,
    },
    placeholder: {
      width: 40,
    },
    bellBtn: {
      position: 'relative',
      padding: 4,
    },
    bellIcon: {
      fontSize: 22,
    },
    badge: {
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
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
      lineHeight: 12,
    },
  });
};

export default function Header({ title, rightAction, onRightPress, showBack, onBack, notificationCount, onNotificationPress }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const totalBadge = notificationCount || 0;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, theme.spacing.md) }]}>
      <View style={styles.content}>
        <View style={styles.leftCol}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.actionBtn} hitSlop={15}>
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.actionText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightCol}>
          {totalBadge > 0 && (
            <TouchableOpacity onPress={onNotificationPress} style={styles.bellBtn} hitSlop={10}>
              <Text style={styles.bellIcon}>🔔</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalBadge > 99 ? '99+' : totalBadge}</Text>
              </View>
            </TouchableOpacity>
          )}
          {rightAction ? (
            <TouchableOpacity onPress={onRightPress} style={styles.actionBtn} hitSlop={15}>
              <Text style={styles.rightActionText}>{rightAction}</Text>
            </TouchableOpacity>
          ) : (
            !totalBadge && <View style={styles.placeholder} />
          )}
        </View>
      </View>
    </View>
  );
}
