import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../database/db';
import { requestNotificationPermission } from '../utils/notifications';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';

const NOTIFICATIONS_ENABLED_KEY = '@law_notifications_enabled';

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: theme.spacing.lg, paddingBottom: 60 },
    section: { marginBottom: theme.spacing.xl },
    sectionHeader: {
      ...typo.tiny,
      color: colors.slate500,
      letterSpacing: 1,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.slate100,
      ...theme.shadows.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowInfo: { flex: 1 },
    rowTitle: { ...typo.bodyBold, color: colors.slate800 },
    rowSubtitle: { ...typo.caption, color: colors.slate500 },
    divider: {
      height: 1,
      backgroundColor: colors.slate100,
      marginVertical: 16,
    },
    hint: { ...typo.caption, color: colors.slate400, fontStyle: 'italic' },

    infoRow: { marginBottom: 16 },
    infoLabel: { ...typo.tiny, color: colors.slate400, marginBottom: 4 },
    infoValue: { ...typo.subtitle, color: colors.slate800 },

    outlineBtn: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    outlineBtnText: { ...typo.bodyBold, color: colors.primary },

    dangerText: { ...typo.caption, color: colors.slate500, marginBottom: 16 },
    dangerBtn: {
      backgroundColor: colors.errorLight,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    dangerBtnText: { ...typo.bodyBold, color: colors.error },

    footer: { alignItems: 'center', marginTop: 20, opacity: 0.5 },
    versionText: { ...typo.tiny, color: colors.slate400 },
    legalText: { ...typo.tiny, color: colors.slate300, fontSize: 8 },
  });
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useApp();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      setNotifEnabled(raw === 'true');
      setLoading(false);
    })();
  }, []);

  const toggleNotif = async (value) => {
    if (value) {
      const ok = await requestNotificationPermission();
      if (!ok) {
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
        setNotifEnabled(false);
        return;
      }
    }
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, value ? 'true' : 'false');
    setNotifEnabled(value);
  };

  const clearAllData = () => {
    Alert.alert('System Reset', 'This will delete all cases, clients, and task history. Significant data loss will occur. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Everything',
        style: 'destructive',
        onPress: async () => {
          const db = await getDb();
          await db.execAsync(`
            DELETE FROM tasks;
            DELETE FROM closed_cases;
            DELETE FROM cases;
            DELETE FROM clients;
          `);
          navigation.navigate('Home');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Dark mode</Text>
                <Text style={styles.rowSubtitle}>Use a dark background to reduce glare in low light</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => toggleTheme()}
                trackColor={{ false: colors.slate200, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Alerts & Notifications</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Case Deadlines</Text>
                <Text style={styles.rowSubtitle}>Priority-based smart alerts</Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={toggleNotif}
                disabled={loading}
                trackColor={{ false: colors.slate200, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.divider} />
            <Text style={styles.hint}>
              Smart alerts trigger 7, 2, and 0 days before High priority deadlines, 2 and 0 for Medium, and same-day for Low.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Organization Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PRACTICING COUNSEL</Text>
              <Text style={styles.infoValue}>{user?.name || 'Guest User'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>LICENSE ID</Text>
              <Text style={styles.infoValue}>{user?.email || 'Individual License'}</Text>
            </View>
            <TouchableOpacity style={styles.outlineBtn} onPress={logout}>
              <Text style={styles.outlineBtnText}>Sign Out of LegalWorkflow</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Advanced Data Operations</Text>
          <View style={styles.card}>
            <Text style={styles.dangerText}>
              System reset will wipe the local SQLite database. Ensure you have backups of important documents.
            </Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={clearAllData}>
              <Text style={styles.dangerBtnText}>Reset Local Database</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>LegalWorkflow v2.0.0 Pro</Text>
          <Text style={styles.legalText}>Designed for Professional Legal Practice</Text>
        </View>
      </ScrollView>
    </View>
  );
}
