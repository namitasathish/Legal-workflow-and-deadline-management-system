import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';

export default function LoadingState({ message = 'Loading...', center = true, testID }) {
  const { colors } = useTheme();
  const typo = buildTypography(colors);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        center ? styles.center : null,
        { backgroundColor: colors.background },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, typo.body, { color: colors.slate500 }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
  message: { marginTop: 10, textAlign: 'center' },
});

