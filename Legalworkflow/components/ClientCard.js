import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.slate100,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      marginVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.slate100,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: {
      ...typo.subtitle,
      color: colors.slate600,
    },
    content: {
      flex: 1,
    },
    name: {
      ...typo.bodyBold,
      color: colors.slate950,
    },
    metaRow: {
      flexDirection: 'row',
      marginTop: 4,
    },
    meta: {
      ...typo.tiny,
      color: colors.slate500,
    },
    chevron: {
      color: colors.slate300,
      fontSize: 18,
      marginLeft: 8,
    },
  });
};

export default function ClientCard({ item, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name?.[0] || 'C'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          {!!item.phone && <Text style={styles.meta}>📞 {item.phone}</Text>}
          {!!item.email && <Text style={[styles.meta, { marginLeft: 12 }]}>✉️ {item.email?.split('@')[0]}</Text>}
        </View>
      </View>
      <Text style={styles.chevron}>→</Text>
    </TouchableOpacity>
  );
}
