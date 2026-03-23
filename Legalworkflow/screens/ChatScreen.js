import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, AppState } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';

const POLL_INTERVAL = 5000; // Poll every 5 seconds

function formatDateGroup(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { caseId, caseTitle } = route.params || {};
  const { user, getMessages, sendMessage, markMessagesAsRead } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);


  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const flatListRef = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const msgs = await getMessages(caseId);
      setMessages(msgs || []);
      await markMessagesAsRead(caseId);
    } finally {
      setLoading(false);
    }
  }, [caseId, getMessages, markMessagesAsRead]);

  // Auto-poll for new messages
  useFocusEffect(
    useCallback(() => {
      load();
      pollRef.current = setInterval(load, POLL_INTERVAL);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load])
  );

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(caseId, text);
    setText('');
    await load();
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Group messages by date, inserting separator items
  const messagesWithDateHeaders = React.useMemo(() => {
    const result = [];
    let lastDateGroup = '';
    for (const msg of messages) {
      const dateGroup = formatDateGroup(msg.created_at);
      if (dateGroup !== lastDateGroup) {
        result.push({ id: `date_${msg.id}`, type: 'date_header', label: dateGroup });
        lastDateGroup = dateGroup;
      }
      result.push({ ...msg, type: 'message' });
    }
    return result;
  }, [messages]);

  const renderItem = ({ item }) => {
    if (item.type === 'date_header') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateLabel}>{item.label}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const isMe = item.sender_id === user?.id;
    const isRead = item.is_read === 1;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        <Text style={styles.senderName}>
          {isMe ? 'You' : (item.sender_name || (item.sender_role === 'lawyer' ? 'Lawyer' : 'Client'))}
        </Text>
        <Text style={styles.msgText}>{item.body}</Text>
        <View style={styles.msgFooter}>
          <Text style={styles.msgTime}>{formatTime(item.created_at)}</Text>
          {isMe && (
            <Text style={[styles.readReceipt, isRead && styles.readReceiptSeen]}>
              {isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading && messagesWithDateHeaders.length === 0) {
    return <LoadingState message="Loading messages..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Header title={caseTitle ? `Chat • ${caseTitle}` : 'Chat'} showBack onBack={() => navigation.goBack()} />

      <FlatList
        ref={flatListRef}
        data={messagesWithDateHeaders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet.</Text>
            <Text style={styles.emptyHint}>Start a conversation about this case.</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={colors.slate400}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendDisabled]} onPress={handleSend} disabled={!text.trim()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1, justifyContent: 'flex-end' },

  // Date separator
  dateSeparator: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 16, paddingHorizontal: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: colors.slate200 },
  dateLabel: {
    ...typo.tiny, color: colors.slate400, marginHorizontal: 12,
    fontWeight: '700', textTransform: 'none', fontSize: 11,
  },

  // Bubbles
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
  bubbleLeft: {
    backgroundColor: colors.surface, alignSelf: 'flex-start',
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.slate100,
  },
  bubbleRight: {
    backgroundColor: '#eef2ff', alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  senderName: { ...typo.tiny, color: colors.primary, marginBottom: 4 },
  msgText: { ...typo.body, color: colors.slate800 },
  msgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 6 },
  msgTime: { ...typo.tiny, color: colors.slate400, fontWeight: '400', textTransform: 'none' },
  readReceipt: { fontSize: 12, color: colors.slate400, fontWeight: '700' },
  readReceiptSeen: { color: colors.primary },

  // Input bar
  inputBar: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.slate100,
  },
  input: {
    flex: 1, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200,
    borderRadius: theme.radius.lg, paddingHorizontal: 16, paddingVertical: 10,
    ...typo.body, maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 20,
    borderRadius: theme.radius.lg, justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: colors.white, fontWeight: '800' },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { ...typo.subtitle, color: colors.slate400 },
  emptyHint: { ...typo.caption, color: colors.slate300, marginTop: 4 },
});
};
