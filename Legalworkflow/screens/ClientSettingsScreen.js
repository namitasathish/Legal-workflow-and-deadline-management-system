import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },

    profileCard: {
      backgroundColor: colors.surface, padding: 24, borderRadius: theme.radius.xl,
      alignItems: 'center', ...theme.shadows.sm, borderWidth: 1, borderColor: colors.slate100,
      marginBottom: 20,
    },
    avatar: {
      width: 72, height: 72, borderRadius: 36, backgroundColor: colors.slate50,
      borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: { fontSize: 28, fontWeight: '800', color: colors.primary },
    name: { ...typo.h2, color: colors.slate950 },
    email: { ...typo.caption, color: colors.slate400, marginTop: 4 },
    roleBadge: {
      marginTop: 12, backgroundColor: colors.indigo50, paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: theme.radius.full,
    },
    roleText: { ...typo.tiny, color: colors.primary, fontWeight: '800' },

    appearanceCard: {
      backgroundColor: colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.slate100,
      ...theme.shadows.sm,
      marginBottom: 20,
    },
    appearanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    appearanceInfo: { flex: 1, paddingRight: 12 },
    appearanceTitle: { ...typo.bodyBold, color: colors.slate800 },
    appearanceSubtitle: { ...typo.caption, color: colors.slate500, marginTop: 4 },

    infoCard: {
      backgroundColor: colors.surface, padding: 20, borderRadius: theme.radius.xl,
      ...theme.shadows.sm, borderWidth: 1, borderColor: colors.slate100, marginBottom: 20,
    },
    infoTitle: { ...typo.subtitle, color: colors.slate800, marginBottom: 16 },
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.slate50,
    },
    infoLabel: { ...typo.caption, color: colors.slate400, fontWeight: '700' },
    infoValue: { ...typo.body, color: colors.slate700 },
    infoHint: { ...typo.caption, color: colors.slate300, marginTop: 12, textAlign: 'center', fontStyle: 'italic' },

    logoutBtn: {
      backgroundColor: colors.errorLight, borderRadius: theme.radius.md,
      paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca',
    },
    logoutText: { color: colors.error, fontWeight: '800', fontSize: 15 },

    version: { ...typo.tiny, color: colors.slate300, textAlign: 'center', marginTop: 24, fontWeight: '400', textTransform: 'none' },
  });
};

export default function ClientSettingsScreen() {
  const navigation = useNavigation();
  const { user, logout, clientsById } = useApp();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const client = user?.linked_client_id ? clientsById.get(user.linked_client_id) : null;

  return (
    <View style={styles.container}>
      <Header title="Settings" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(client?.name || user?.name)?.[0] || '?'}</Text>
          </View>
          <Text style={styles.name}>{client?.name || user?.name || 'Client'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>👤 Client Account</Text>
          </View>
        </View>

        <View style={styles.appearanceCard}>
          <View style={styles.appearanceRow}>
            <View style={styles.appearanceInfo}>
              <Text style={styles.appearanceTitle}>Dark mode</Text>
              <Text style={styles.appearanceSubtitle}>Easier on your eyes in dim environments</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => toggleTheme()}
              trackColor={{ false: colors.slate200, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {client && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Contact Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{client.phone || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{client.email || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{client.address || 'Not provided'}</Text>
            </View>
            <Text style={styles.infoHint}>Contact your lawyer to update your information.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Legal Workflow v1.0 • Client Portal</Text>
      </ScrollView>
    </View>
  );
}
