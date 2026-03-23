import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, buildTypography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function EmptyState({ icon, title, description, action }) {
  const { colors } = useTheme();
  const typo = buildTypography(colors);
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.slate100 }]}>
        <Text style={styles.icon}>{icon || '📁'}</Text>
      </View>
      <Text style={[styles.title, typo.h3, { color: colors.slate800 }]}>{title}</Text>
      <Text style={[styles.description, typo.body, { color: colors.slate500 }]}>{description}</Text>
      {action && (
        <View style={styles.actionContainer}>
          {action}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 24,
  },
});
