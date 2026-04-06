import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ProjectCard({ project, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: project.cover }}
        style={styles.cover}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
        <View style={styles.meta}>
          {project.author?.avatar && (
            <Image source={{ uri: project.author.avatar }} style={styles.avatar} />
          )}
          <Text style={styles.authorName} numberOfLines={1}>
            {project.author?.displayName || project.author?.username || ''}
          </Text>
          <View style={styles.stats}>
            <Ionicons name="heart" size={12} color="#e74c3c" />
            <Text style={styles.statText}>{project._count?.likes ?? project.likeCount ?? 0}</Text>
            <Ionicons name="eye" size={12} color="#999" style={{ marginLeft: 6 }} />
            <Text style={styles.statText}>{project.viewCount ?? 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cover: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: '#f0f0f0',
  },
  info: {
    padding: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 4,
  },
  authorName: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 2,
  },
});
