import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.slate200,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      height: 48,
      ...theme.shadows.sm,
    },
    icon: {
      fontSize: 16,
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      ...typo.body,
      color: colors.slate800,
      height: '100%',
    },
  });
};

export default function SearchBar({ value, onChangeText, placeholder = 'Search entries...' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.slate400}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}
