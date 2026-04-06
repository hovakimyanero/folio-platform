import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ChatScreen({ route, navigation }) {
  const { partnerId, partnerName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await apiJson(`/messages/${partnerId}`);
      setMessages(data.messages || []);
    } catch (_) {}
  }, [partnerId]);

  useEffect(() => { load(); }, [load]);

  // Poll for new messages every 5s
  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    try {
      const data = await apiJson(`/messages/${partnerId}`, {
        method: 'POST',
        body: { content },
      });
      setMessages(prev => [...prev, data.message || data]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (_) {}
    setSending(false);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.id || item.sender?.id === user?.id;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.content}</Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
            {new Date(item.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => navigation.navigate('Profile', { username: partnerName })}
        >
          <Text style={styles.headerName}>{partnerName}</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id || String(item.createdAt)}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Начните диалог!</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Сообщение..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!text.trim() || sending}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 16,
    paddingBottom: 12, backgroundColor: '#fff', gap: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  messagesList: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 1, justifyContent: 'flex-end' },
  msgRow: { marginBottom: 6, alignItems: 'flex-start' },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', padding: 10, borderRadius: 16 },
  bubbleThem: { backgroundColor: '#fff', borderTopLeftRadius: 4 },
  bubbleMe: { backgroundColor: '#6C5CE7', borderTopRightRadius: 4 },
  msgText: { fontSize: 15, color: '#1a1a2e', lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#999' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingBottom: 28,
    backgroundColor: '#fff', gap: 8, borderTopWidth: 0.5, borderTopColor: '#eee',
  },
  input: {
    flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, color: '#1a1a2e', maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C5CE7',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
