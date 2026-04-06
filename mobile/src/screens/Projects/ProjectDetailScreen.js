import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Dimensions, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson, api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ProjectDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { user: me } = useAuth();
  const [project, setProject] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson(`/projects/${id}`);
      setProject(data.project);
      setSimilar(data.similar || []);
      setIsLiked(data.project.isLiked || false);
      setLikesCount(data.project._count?.likes ?? data.project.likeCount ?? 0);

      const commData = await apiJson(`/comments/projects/${id}/comments`);
      setComments(commData.comments || []);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleLike = async () => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const res = await api(`/projects/${id}/like`, { method });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch {}
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const data = await apiJson('/comments', {
        method: 'POST',
        body: { content: commentText, projectId: id },
      });
      setComments(prev => [data, ...prev]);
      setCommentText('');
    } catch {}
    setSending(false);
  };

  const deleteComment = async (commentId) => {
    try {
      await api(`/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {}
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;
  }
  if (!project) {
    return <View style={styles.center}><Text>Проект не найден</Text></View>;
  }

  const mediaImages = (project.media || []).filter(m => m.url !== project.cover);

  return (
    <ScrollView style={styles.container}>
      {/* Cover */}
      <Image source={{ uri: project.cover }} style={styles.cover} resizeMode="cover" />

      <View style={styles.body}>
        {/* Title + Author */}
        <Text style={styles.title}>{project.title}</Text>

        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => project.author && navigation.navigate('Profile', { username: project.author.username })}
        >
          {project.author?.avatar && <Image source={{ uri: project.author.avatar }} style={styles.avatar} />}
          <Text style={styles.authorName}>{project.author?.displayName || project.author?.username}</Text>
        </TouchableOpacity>

        {/* Stats + Like */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.likeBtn} onPress={toggleLike}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? '#e74c3c' : '#666'} />
            <Text style={[styles.statNum, isLiked && { color: '#e74c3c' }]}>{likesCount}</Text>
          </TouchableOpacity>
          <View style={styles.stat}>
            <Ionicons name="eye" size={18} color="#999" />
            <Text style={styles.statNum}>{project.viewCount || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={18} color="#999" />
            <Text style={styles.statNum}>{comments.length}</Text>
          </View>
        </View>

        {/* Description */}
        {project.description ? <Text style={styles.description}>{project.description}</Text> : null}

        {/* Tags */}
        {project.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {project.tags.map((tag, i) => (
              <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>
        )}

        {/* Category */}
        {project.category && (
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{project.category.name}</Text>
          </View>
        )}

        {/* Media gallery */}
        {mediaImages.length > 0 && (
          <View style={styles.gallery}>
            <Text style={styles.sectionTitle}>Медиа</Text>
            {mediaImages.map((m) => (
              <Image key={m.id} source={{ uri: m.url }} style={styles.mediaImage} resizeMode="cover" />
            ))}
          </View>
        )}

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Комментарии ({comments.length})</Text>

          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              placeholder="Написать комментарий..."
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity onPress={addComment} disabled={sending || !commentText.trim()}>
              <Ionicons name="send" size={22} color={commentText.trim() ? '#6C5CE7' : '#ccc'} />
            </TouchableOpacity>
          </View>

          {comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <View style={styles.commentHeader}>
                {c.user?.avatar && <Image source={{ uri: c.user.avatar }} style={styles.commentAvatar} />}
                <Text style={styles.commentAuthor}>{c.user?.displayName || c.user?.username}</Text>
                {c.user?.id === me?.id && (
                  <TouchableOpacity onPress={() => deleteComment(c.id)} style={{ marginLeft: 'auto' }}>
                    <Ionicons name="trash-outline" size={16} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.commentText}>{c.content}</Text>
            </View>
          ))}
        </View>

        {/* Similar */}
        {similar.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Похожие проекты</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similar.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.similarCard}
                  onPress={() => navigation.push('ProjectDetail', { id: p.id })}
                >
                  <Image source={{ uri: p.cover }} style={styles.similarCover} />
                  <Text style={styles.similarTitle} numberOfLines={1}>{p.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cover: { width, height: width * 0.6, backgroundColor: '#f0f0f0' },
  body: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  authorName: { fontSize: 14, fontWeight: '600', color: '#6C5CE7' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNum: { fontSize: 14, color: '#666' },
  description: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { backgroundColor: '#f0edff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, color: '#6C5CE7' },
  categoryChip: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 16 },
  categoryText: { fontSize: 12, color: '#2e7d32' },
  gallery: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  mediaImage: { width: '100%', height: 250, borderRadius: 12, marginBottom: 8, backgroundColor: '#f0f0f0' },
  commentsSection: { marginTop: 8 },
  commentInput: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee',
    borderRadius: 12, padding: 10, marginBottom: 16, gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: '#1a1a2e', maxHeight: 80 },
  comment: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 8 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commentAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  commentText: { fontSize: 14, color: '#333', lineHeight: 20 },
  similarCard: { width: 140, marginRight: 12 },
  similarCover: { width: 140, height: 100, borderRadius: 8, backgroundColor: '#f0f0f0', marginBottom: 4 },
  similarTitle: { fontSize: 12, color: '#1a1a2e' },
});
