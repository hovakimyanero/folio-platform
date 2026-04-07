import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Dimensions, FlatList, Modal,
  StatusBar, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson, api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width, height: screenHeight } = Dimensions.get('window');

export default function ProjectDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { user: me } = useAuth();
  const [project, setProject] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await apiJson(`/projects/${id}`);
      if (data.requiresPassword) {
        setRequiresPassword(true);
        setLoading(false);
        return;
      }
      setProject(data.project);
      setSimilar(data.similar || []);
      setIsLiked(data.project.isLiked || false);
      setIsSaved(data.project.isSaved || false);
      setLikesCount(data.project._count?.likes ?? data.project.likeCount ?? 0);
      setSaveCount(data.project.saveCount || 0);

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

  const toggleSave = async () => {
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await api(`/saves/${id}`, { method });
      if (res.ok) {
        setIsSaved(!isSaved);
        setSaveCount(prev => isSaved ? prev - 1 : prev + 1);
      }
    } catch {}
  };

  const handleRepost = async () => {
    try {
      await Share.share({
        message: `${project?.title || 'Проект'} — смотри на Folio!\nhttps://folioplatform.ru/projects/${id}`,
      });
    } catch {}
  };

  const unlockPassword = async () => {
    try {
      const data = await apiJson(`/projects/${id}?password=${encodeURIComponent(passwordInput)}`);
      if (data.project) {
        setRequiresPassword(false);
        setProject(data.project);
        setSimilar(data.similar || []);
        setIsLiked(data.project.isLiked || false);
        setIsSaved(data.project.isSaved || false);
        setLikesCount(data.project._count?.likes ?? data.project.likeCount ?? 0);
        setSaveCount(data.project.saveCount || 0);
        const commData = await apiJson(`/comments/projects/${id}/comments`);
        setComments(commData.comments || []);
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

  if (requiresPassword) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed" size={48} color="#6C5CE7" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 16, marginBottom: 8 }}>Защищённый проект</Text>
        <Text style={{ fontSize: 14, color: '#999', marginBottom: 16 }}>Введите пароль для доступа</Text>
        <TextInput
          style={[styles.input, { width: 250, textAlign: 'center' }]}
          placeholder="Пароль"
          placeholderTextColor="#999"
          secureTextEntry
          value={passwordInput}
          onChangeText={setPasswordInput}
        />
        <TouchableOpacity style={{ backgroundColor: '#6C5CE7', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 12 }} onPress={unlockPassword}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Открыть</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!project) {
    return <View style={styles.center}><Text>Проект не найден</Text></View>;
  }

  const mediaImages = (project.media || []).filter(m => m.url !== project.cover);
  const blocks = project.blocks || [];

  const openImage = (uri) => {
    setViewerImage(uri);
    setViewerVisible(true);
  };

  return (
    <>
    <ScrollView style={styles.container}>
      {/* Cover */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => openImage(project.cover)} style={{ margin: 8 }}>
        <Image source={{ uri: project.cover }} style={styles.cover} resizeMode="contain" />
      </TouchableOpacity>

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

        {/* Stats + Like + Save + Repost */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.likeBtn} onPress={toggleLike}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? '#e74c3c' : '#666'} />
            <Text style={[styles.statNum, isLiked && { color: '#e74c3c' }]}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeBtn} onPress={toggleSave}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? '#f39c12' : '#666'} />
            <Text style={[styles.statNum, isSaved && { color: '#f39c12' }]}>{saveCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeBtn} onPress={handleRepost}>
            <Ionicons name="share-outline" size={20} color="#666" />
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

        {/* Case study blocks */}
        {blocks.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            {blocks.map((block, idx) => {
              switch (block.type) {
                case 'HEADING': return <Text key={idx} style={{ fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginVertical: 8 }}>{block.content}</Text>;
                case 'TEXT': return <Text key={idx} style={{ fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 8 }}>{block.content}</Text>;
                case 'IMAGE': return (
                  <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => openImage(block.url)} style={{ marginHorizontal: -8, marginVertical: 4 }}>
                    <Image source={{ uri: block.url }} style={{ width: '100%', aspectRatio: 4/3 }} resizeMode="contain" />
                  </TouchableOpacity>
                );
                case 'IMAGE_GALLERY': return (
                  <View key={idx}>
                    {(block.urls || []).map((u, i) => (
                      <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => openImage(u)} style={{ marginHorizontal: -8, marginVertical: 4 }}>
                        <Image source={{ uri: u }} style={{ width: '100%', aspectRatio: 4/3 }} resizeMode="contain" />
                      </TouchableOpacity>
                    ))}
                  </View>
                );
                case 'QUOTE': return (
                  <View key={idx} style={{ borderLeftWidth: 3, borderLeftColor: '#6C5CE7', paddingLeft: 12, marginVertical: 8 }}>
                    <Text style={{ fontSize: 15, fontStyle: 'italic', color: '#555' }}>{block.content}</Text>
                  </View>
                );
                case 'DIVIDER': return <View key={idx} style={{ height: 1, backgroundColor: '#eee', marginVertical: 16 }} />;
                case 'CODE': return (
                  <View key={idx} style={{ backgroundColor: '#1a1a2e', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <Text style={{ fontFamily: 'monospace', fontSize: 13, color: '#e0e0e0' }}>{block.content}</Text>
                  </View>
                );
                default: return null;
              }
            })}
          </View>
        )}

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
            {mediaImages.map((m) => (
              <TouchableOpacity key={m.id} activeOpacity={0.9} onPress={() => openImage(m.url)}>
                <Image source={{ uri: m.url }} style={styles.mediaImage} resizeMode="contain" />
              </TouchableOpacity>
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

    {/* Fullscreen Image Viewer */}
    <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
      <View style={styles.viewerOverlay}>
        <StatusBar hidden={viewerVisible} />
        <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        {viewerImage && (
          <Image source={{ uri: viewerImage }} style={styles.viewerImage} resizeMode="contain" />
        )}
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cover: { width: '100%', aspectRatio: 4/3, borderRadius: 8 },
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
  mediaImage: { width: '100%', aspectRatio: 4/3, marginVertical: 4 },
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
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: width, height: screenHeight * 0.8 },
});
