import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';

const STATUS_STYLES = {
  Pending: { bg: '#fef3c7', text: '#92400e', icon: '⏳' },
  Uploaded: { bg: '#dbeafe', text: '#1e40af', icon: '📤' },
  Accepted: { bg: '#dcfce7', text: '#166534', icon: '✅' },
};

export default function ClientDocumentsScreen() {
  const navigation = useNavigation();
  const { user, getClientDocumentRequests } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const clientId = user?.linked_client_id;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await getClientDocumentRequests(clientId);
      setRequests(rows || []);
    } finally {
      setLoading(false);
    }
  }, [clientId, getClientDocumentRequests]);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }) => {
    const sc = STATUS_STYLES[item.status] || { bg: colors.slate50, text: colors.slate600, icon: '📄' };
    const canUpload = item.status === 'Pending';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title || 'Untitled Document'}
            </Text>
            <Text style={styles.caseTitle} numberOfLines={1}>
              📋 {item.case_title || 'Unlinked Case'}
            </Text>
            {!!item.description && (
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            {!!item.doc_name && (
              <Text style={styles.docName} numberOfLines={1}>
                📎 {item.doc_name}
              </Text>
            )}
          </View>

          <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {sc.icon} {item.status}
            </Text>
          </View>
        </View>

        {canUpload && (
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() =>
              navigation.navigate('Client Doc Upload', {
                requestId: item.id,
                caseId: item.case_id,
                title: item.title,
                description: item.description,
              })
            }
          >
            <Text style={styles.uploadBtnText}>Upload Document</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Loading document requests..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Document Requests" showBack onBack={() => navigation.goBack()} />
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No document requests</Text>
            <Text style={styles.emptyText}>When your lawyer requests documents, they will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { paddingHorizontal: 16, paddingBottom: 40 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.slate100,
      padding: 14,
      marginBottom: 12,
      ...theme.shadows.sm,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    title: { ...buildTypography(colors).bodyBold, color: colors.slate800, flex: 1 },
    caseTitle: { ...buildTypography(colors).tiny, color: colors.slate400, marginTop: 4 },
    desc: { ...buildTypography(colors).caption, color: colors.slate500, marginTop: 8 },
    docName: { ...buildTypography(colors).caption, color: colors.primary, marginTop: 6, fontWeight: '800' },
    statusPill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusText: { ...buildTypography(colors).tiny, fontWeight: '900' },
    uploadBtn: {
      marginTop: 12,
      backgroundColor: colors.primary,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    uploadBtnText: { color: colors.white, fontWeight: '900', fontSize: 13 },
    emptyCard: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { ...buildTypography(colors).bodyBold, color: colors.slate800, textAlign: 'center' },
    emptyText: { ...buildTypography(colors).body, color: colors.slate400, textAlign: 'center', marginTop: 6 },
  });

