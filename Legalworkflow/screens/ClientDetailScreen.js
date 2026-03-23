import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';

const INTERACTION_TYPES = [
    { key: 'call', icon: '📞', label: 'Call' },
    { key: 'email', icon: '📧', label: 'Email' },
    { key: 'meeting', icon: '🤝', label: 'Meeting' },
    { key: 'note', icon: '📝', label: 'Note' },
];

export default function ClientDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const clientId = route.params?.clientId;

    const {
        cases, clientsById, updateClient, deleteClient,
        addInteraction, getClientInteractions, markFollowUpDone,
    } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);


    const client = clientsById.get(clientId) || null;
    const linkedCases = cases.filter((c) => c.client_id === clientId);

    const [interactions, setInteractions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState({ type: 'note', summary: '', follow_up_date: '' });
    const [editingInfo, setEditingInfo] = useState(false);
    const [editDraft, setEditDraft] = useState({ name: '', phone: '', email: '', address: '' });

    const loadInteractions = useCallback(async () => {
        if (!clientId) return;
        const rows = await getClientInteractions(clientId);
        setInteractions(rows);
    }, [clientId, getClientInteractions]);

    useEffect(() => {
        loadInteractions();
    }, [loadInteractions]);

    useEffect(() => {
        if (client) {
            setEditDraft({ name: client.name || '', phone: client.phone || '', email: client.email || '', address: client.address || '' });
        }
    }, [client]);

    if (!client) {
        return (
            <View style={styles.container}>
                <Header title="Error" showBack onBack={() => navigation.goBack()} />
                <View style={styles.centered}><Text style={styles.empty}>Client profile not found.</Text></View>
            </View>
        );
    }

    const handleSaveInfo = async () => {
        if (!editDraft.name.trim()) return;
        await updateClient(clientId, editDraft);
        setEditingInfo(false);
    };

    const handleDelete = () => {
        const count = linkedCases.length;
        Alert.alert(
            'Confirm Removal',
            count ? `This client is linked to ${count} cases. Removing them will clear the links but keep the case data. Proceed?` : 'Are you sure you want to remove this client profile?',
            [
                { text: 'Keep Profile', style: 'cancel' },
                { text: 'Remove Permanent', style: 'destructive', onPress: async () => { await deleteClient(clientId); navigation.goBack(); } },
            ]
        );
    };

    const handleAddInteraction = async () => {
        if (!draft.summary.trim()) return;
        await addInteraction(clientId, draft);
        setDraft({ type: 'note', summary: '', follow_up_date: '' });
        setShowForm(false);
        await loadInteractions();
    };

    const handleFollowUpDone = async (id) => {
        await markFollowUpDone(id);
        await loadInteractions();
    };

    const pendingFollowUps = interactions.filter((i) => i.follow_up_date && !i.follow_up_done);

    return (
        <View style={styles.container}>
            <Header
                title={editingInfo ? 'Edit Profile' : 'Client Profile'}
                showBack
                onBack={() => navigation.goBack()}
                action={editingInfo ? 'Cancel' : 'Edit'}
                onAction={() => setEditingInfo(!editingInfo)}
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroCard}>
                    {editingInfo ? (
                        <View style={styles.editForm}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Full Legal Name</Text>
                                <TextInput style={styles.input} value={editDraft.name} onChangeText={(t) => setEditDraft((d) => ({ ...d, name: t }))} placeholder="Client Name *" placeholderTextColor={colors.slate400} />
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputWrapper, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Phone</Text>
                                    <TextInput style={styles.input} value={editDraft.phone} onChangeText={(t) => setEditDraft((d) => ({ ...d, phone: t }))} placeholder="N/A" keyboardType="phone-pad" placeholderTextColor={colors.slate400} />
                                </View>
                                <View style={[styles.inputWrapper, { flex: 1.5 }]}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput style={styles.input} value={editDraft.email} onChangeText={(t) => setEditDraft((d) => ({ ...d, email: t }))} placeholder="N/A" autoCapitalize="none" placeholderTextColor={colors.slate400} />
                                </View>
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Registered Address</Text>
                                <TextInput style={[styles.input, styles.textArea]} value={editDraft.address} onChangeText={(t) => setEditDraft((d) => ({ ...d, address: t }))} placeholder="Enter address details..." multiline placeholderTextColor={colors.slate400} />
                            </View>
                            <View style={[styles.btnRow, { marginTop: 8 }]}>
                                <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSaveInfo}>
                                    <Text style={styles.saveBtnText}>Update Information</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
                                    <Text style={styles.deleteLinkText}>Remove Record</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.heroContent}>
                            <View style={styles.avatarLarge}>
                                <Text style={styles.avatarLargeText}>{client.name?.[0]}</Text>
                            </View>
                            <Text style={styles.clientName}>{client.name}</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNum}>{linkedCases.length}</Text>
                                    <Text style={styles.statLabel}>Cases</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statNum}>{interactions.length}</Text>
                                    <Text style={styles.statLabel}>Activities</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {!editingInfo && (
                    <>
                        {/* Quick Contact */}
                        <View style={styles.quickContactRow}>
                            <TouchableOpacity
                                style={[styles.contactBtn, !client.phone && styles.btnDisabled]}
                                disabled={!client.phone}
                                onPress={() => Linking.openURL(`tel:${client.phone}`)}
                            >
                                <Text style={styles.contactBtnIcon}>📞</Text>
                                <Text style={styles.contactBtnText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.contactBtn, !client.email && styles.btnDisabled]}
                                disabled={!client.email}
                                onPress={() => Linking.openURL(`mailto:${client.email}`)}
                            >
                                <Text style={styles.contactBtnIcon}>📧</Text>
                                <Text style={styles.contactBtnText}>Email</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.contactBtn} onPress={() => setShowForm(!showForm)}>
                                <Text style={styles.contactBtnIcon}>📝</Text>
                                <Text style={styles.contactBtnText}>Action</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Pending Follow-ups */}
                        {pendingFollowUps.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Immediate Attention</Text>
                                {pendingFollowUps.map((fu) => (
                                    <View key={fu.id} style={styles.followUpCard}>
                                        <View style={styles.followUpIndicator} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.followUpDate}>Follow-up: {fu.follow_up_date?.slice(0, 10)}</Text>
                                            <Text style={styles.followUpSummary}>{fu.summary}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleFollowUpDone(fu.id)} style={styles.doneBtn}>
                                            <Text style={styles.doneBtnText}>Resolved</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Linked Cases */}
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Active Case Files</Text>
                            {linkedCases.length === 0 ? (
                                <View style={styles.emptyCard}><Text style={styles.emptyText}>No case files linked to this client.</Text></View>
                            ) : (
                                linkedCases.map((c) => (
                                    <TouchableOpacity key={c.id} style={styles.caseSmallCard} onPress={() => navigation.navigate('Case Detail', { caseId: c.id })}>
                                        <View style={styles.caseSmallInfo}>
                                            <Text style={styles.caseSmallName} numberOfLines={1}>{c.case_title}</Text>
                                            <Text style={styles.caseSmallMeta}>{c.court_name || 'No Court Specified'}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, c.status === 'Open' ? styles.statusOpen : styles.statusClosed]}>
                                            <Text style={styles.statusBadgeText}>{c.status}</Text>
                                        </View>
                                        <Text style={styles.caseArrow}>→</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        {/* Interaction Logger */}
                        {showForm && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Log New Interaction</Text>
                                <View style={styles.logCard}>
                                    <View style={styles.typeRow}>
                                        {INTERACTION_TYPES.map((t) => (
                                            <TouchableOpacity
                                                key={t.key}
                                                style={[styles.typePill, draft.type === t.key ? styles.typePillActive : null]}
                                                onPress={() => setDraft((d) => ({ ...d, type: t.key }))}
                                            >
                                                <Text style={[styles.typePillText, draft.type === t.key ? styles.typePillTextActive : null]}>
                                                    {t.icon} {t.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { backgroundColor: colors.slate50 }]}
                                        value={draft.summary}
                                        onChangeText={(t) => setDraft((d) => ({ ...d, summary: t }))}
                                        placeholder="Summary of interaction..."
                                        placeholderTextColor={colors.slate400}
                                        multiline
                                    />
                                    <View style={styles.row}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, backgroundColor: colors.slate50 }]}
                                            value={draft.follow_up_date}
                                            onChangeText={(t) => setDraft((d) => ({ ...d, follow_up_date: t }))}
                                            placeholder="Follow-up YYYY-MM-DD"
                                            placeholderTextColor={colors.slate400}
                                        />
                                        <TouchableOpacity
                                            style={[styles.logSubmitBtn, !draft.summary.trim() ? styles.btnDisabled : null]}
                                            onPress={handleAddInteraction}
                                            disabled={!draft.summary.trim()}
                                        >
                                            <Text style={styles.logSubmitText}>Log Entry</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* History Timeline */}
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Engagement History</Text>
                            {interactions.length === 0 ? (
                                <Text style={styles.emptyTextFade}>No entries recorded in the timeline.</Text>
                            ) : (
                                <View style={styles.timelineContainer}>
                                    <View style={styles.timelineSpine} />
                                    {interactions.map((i, idx) => {
                                        const typeInfo = INTERACTION_TYPES.find((t) => t.key === i.type) || INTERACTION_TYPES[3];
                                        return (
                                            <View key={i.id} style={styles.timelineItem}>
                                                <View style={styles.timelineMarker}>
                                                    <View style={styles.timelineDot}>
                                                        <Text style={styles.timelineIcon}>{typeInfo.icon}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.timelineContentCard}>
                                                    <View style={styles.timelineHeader}>
                                                        <Text style={styles.timelineMeta}>{(i.interaction_date || i.created_at)?.slice(0, 10)}</Text>
                                                        <Text style={styles.timelineTag}>{typeInfo.label}</Text>
                                                    </View>
                                                    <Text style={styles.timelineBody}>{i.summary}</Text>
                                                    {i.follow_up_date && (
                                                        <View style={[styles.followUpBadge, i.follow_up_done ? styles.fuDone : styles.fuPending]}>
                                                            <Text style={[styles.fuText, i.follow_up_done ? styles.fuTextDone : styles.fuTextPending]}>
                                                                {i.follow_up_done ? '✓ Follow-up complete' : `⏳ Follow-up: ${i.follow_up_date?.slice(0, 10)}`}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: theme.spacing.lg, paddingBottom: 60 },

    heroCard: {
        backgroundColor: colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: colors.slate100,
        ...theme.shadows.md,
        marginBottom: theme.spacing.xl,
    },
    heroContent: { alignItems: 'center' },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.slate50,
        borderWidth: 1,
        borderColor: colors.slate100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarLargeText: { ...typo.h1, color: colors.slate400, fontSize: 32 },
    clientName: { ...typo.h2, color: colors.slate950, marginBottom: 16, textAlign: 'center' },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.slate50, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radius.full },
    statItem: { alignItems: 'center', paddingHorizontal: 12 },
    statNum: { ...typo.subtitle, color: colors.slate800 },
    statLabel: { ...typo.tiny, color: colors.slate400 },
    statDivider: { width: 1, height: 20, backgroundColor: colors.slate200 },

    editForm: { width: '100%' },
    inputWrapper: { marginBottom: 12 },
    inputLabel: { ...typo.tiny, color: colors.slate500, marginBottom: 4, fontWeight: '700' },
    input: {
        backgroundColor: colors.slate50,
        borderWidth: 1,
        borderColor: colors.slate200,
        borderRadius: theme.radius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        ...typo.body,
        color: colors.slate800,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 10 },
    btnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionBtn: { flex: 1, borderRadius: theme.radius.md, paddingVertical: 14, alignItems: 'center' },
    saveBtn: { backgroundColor: colors.primary },
    saveBtnText: { ...typo.bodyBold, color: colors.white },
    deleteLink: { paddingHorizontal: 12 },
    deleteLinkText: { ...typo.caption, color: colors.error, fontWeight: '700' },

    quickContactRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.xl },
    contactBtn: {
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.slate200,
        borderRadius: theme.radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    contactBtnIcon: { fontSize: 20, marginBottom: 4 },
    contactBtnText: { ...typo.caption, color: colors.slate700, fontWeight: '800' },
    btnDisabled: { opacity: 0.4 },

    section: { marginBottom: theme.spacing.xl },
    sectionHeader: {
        ...typo.tiny,
        color: colors.slate500,
        letterSpacing: 1,
        marginBottom: 12,
        textTransform: 'uppercase',
    },

    followUpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FEF3C7',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.sm,
    },
    followUpIndicator: { width: 4, height: '80%', backgroundColor: '#F59E0B', borderRadius: 2, marginRight: 12 },
    followUpDate: { ...typo.caption, color: '#92400E', fontWeight: '800' },
    followUpSummary: { ...typo.body, color: '#B45309', marginTop: 2 },
    doneBtn: { backgroundColor: '#F59E0B', borderRadius: theme.radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
    doneBtnText: { ...typo.tiny, color: colors.white, fontWeight: '800' },

    caseSmallCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.slate100,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: 8,
        ...theme.shadows.sm,
    },
    caseSmallInfo: { flex: 1 },
    caseSmallName: { ...typo.bodyBold, color: colors.slate800 },
    caseSmallMeta: { ...typo.tiny, color: colors.slate400, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginHorizontal: 8 },
    statusOpen: { backgroundColor: colors.indigo50 },
    statusClosed: { backgroundColor: colors.emerald50 },
    statusBadgeText: { ...typo.tiny, fontWeight: '800', fontSize: 9 },
    caseArrow: { color: colors.slate300, fontSize: 18 },

    logCard: {
        backgroundColor: colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: colors.slate100,
        ...theme.shadows.sm,
    },
    typeRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    typePill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.radius.full,
        backgroundColor: colors.slate50,
        borderWidth: 1,
        borderColor: colors.slate100,
    },
    typePillActive: { backgroundColor: colors.slate800, borderColor: colors.slate800 },
    typePillText: { ...typo.tiny, color: colors.slate600, fontWeight: '700' },
    typePillTextActive: { color: colors.white },
    logSubmitBtn: { backgroundColor: colors.primary, borderRadius: theme.radius.md, paddingHorizontal: 16, justifyContent: 'center' },
    logSubmitText: { ...typo.caption, color: colors.white, fontWeight: '800' },

    timelineContainer: { paddingLeft: 8 },
    timelineSpine: {
        position: 'absolute',
        left: 17,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: colors.slate100
    },
    timelineItem: { flexDirection: 'row', marginBottom: 20 },
    timelineMarker: { width: 20, alignItems: 'center', marginRight: 16 },
    timelineDot: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.slate200,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    timelineIcon: { fontSize: 16 },
    timelineContentCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: colors.slate100,
        ...theme.shadows.sm,
    },
    timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    timelineMeta: { ...typo.tiny, color: colors.slate400 },
    timelineTag: { ...typo.tiny, color: colors.primary, fontWeight: '800' },
    timelineBody: { ...typo.body, color: colors.slate700 },
    followUpBadge: { marginTop: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    fuPending: { backgroundColor: '#FEF3C7' },
    fuDone: { backgroundColor: colors.emerald50 },
    fuText: { ...typo.tiny, fontWeight: '800' },
    fuTextPending: { color: '#B45309' },
    fuTextDone: { color: colors.emerald700 },

    emptyText: { ...typo.caption, color: colors.slate400, textAlign: 'center' },
    emptyTextFade: { ...typo.caption, color: colors.slate300, textAlign: 'center', fontStyle: 'italic' },
    emptyCard: { padding: 24, alignItems: 'center' },
});
};
