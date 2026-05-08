import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, 
  ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRoute, useNavigation, useTheme } from '@react-navigation/native';
import * as api from '../../../api/index'; 

const MomentDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const { moment: initialMoment, userId } = route.params;
  
  const [item, setItem] = useState(initialMoment);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isLiked = item.likes?.some(id => String(id) === String(userId));
  // 1. ADD THIS: Check if the media is a video
  const isVideo = item.mediaType === 'video' || item.mediaUrl?.toLowerCase().endsWith('.mp4');

  // 2. ADD THIS: Initialize the video player
  const player = useVideoPlayer(item.mediaUrl, (player) => {
    player.loop = true;
    player.play(); // Auto-play when entering detail view
  });

  useEffect(() => {
    const fetchLatestMomentData = async () => {
      try {
        const response = await api.getMomentById(initialMoment._id); 
        if (response.data.success) {
          setItem(response.data.moment);
        }
      } catch (e) {
        console.error("Fetch Detail Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestMomentData();
  }, [initialMoment._id]);

  const handleLike = async () => {
    if (!userId) return Alert.alert("Login Required", "Please log in to like.");
    try {
      const response = await api.likeMoment(item._id, userId);
      if (response.data.success) {
        setItem(prev => ({ ...prev, likes: response.data.likes }));
      }
    } catch (e) {
      console.error("Like Error:", e);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const res = await api.commentOnMoment({ 
        momentId: item._id, 
        userId: userId, 
        text: commentText 
      });
      
      if (res.data.success) {
        setItem(res.data.moment); 
        setCommentText("");
      }
    } catch (err) {
      console.error("Comment Error:", err);
      Alert.alert("Error", "Could not post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !item) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Moment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.authorRow}>
          <Image source={{ uri: item.author?.profileImage }} style={styles.avatar} />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{item.author?.name}</Text>
            <Text style={styles.subText}>Moment</Text>
          </View>
        </View>

        <View style={styles.mediaContainer}>
          {isVideo ? (
            <VideoView
              player={player}
              style={styles.mainImage} // Reusing your existing style
              contentFit="contain"
              allowsFullscreen
              allowsPictureInPicture
              showsPlaybackControls={true}
            />
          ) : (
            <Image 
              source={{ uri: item.mediaUrl }} 
              style={styles.mainImage} 
              resizeMode="contain" 
            />
          )}
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={28} 
              color={isLiked ? "#EF4444" : colors.text} 
            />
            <Text style={[styles.count, { color: colors.text }]}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>
          <View style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
            <Text style={[styles.count, { color: colors.text }]}>{item.comments?.length || 0}</Text>
          </View>
        </View>

        {item.caption && (
          <Text style={[styles.caption, { color: colors.text }]}>
            <Text style={{ fontWeight: 'bold' }}>{item.author?.name} </Text>{item.caption}
          </Text>
        )}

        <View style={styles.commentsSection}>
          <Text style={[styles.commentTitle, { color: colors.text }]}>Comments</Text>
          {item.comments && item.comments.length > 0 ? (
            item.comments.map((c, index) => {
              // 1. Check if it's an object (populated)
              const isPopulated = c.user && typeof c.user === 'object';
              
              // 2. Check if the ID matches YOUR ID
              const isMe = String(isPopulated ? c.user._id : c.user) === String(userId);

              // 3. Fallback Logic: If it's me but not populated, we pull your name from your session/item author
              const displayName = isPopulated 
                ? c.user.name 
                : (isMe ? "You" : "User"); 

              const displayImage = isPopulated 
                ? c.user.profileImage 
                : (isMe ? item.author?.profileImage : 'https://via.placeholder.com/150');

              return (
                <View key={c._id || index.toString()} style={styles.commentItem}>
                  <Image 
                    source={{ uri: displayImage || 'https://via.placeholder.com/150' }} 
                    style={styles.commentAvatar} 
                  />
                  <View style={[styles.commentBubble, { backgroundColor: colors.card }]}>
                    <Text style={[styles.commentUser, { color: colors.text }]}>
                      {displayName}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 14 }}>{c.text}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
          placeholder="Add a comment..."
          placeholderTextColor="#667"
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim() || isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <Text style={[styles.sendText, { opacity: commentText.trim() ? 1 : 0.5 }]}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ... Styles stay the same

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  authorRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  subText: { fontSize: 12, color: '#667' },
  mainImage: { width: '100%', aspectRatio: 1 },
  mediaContainer: {
    width: '100%',
    backgroundColor: '#000', // Keeps it clean if the video is vertical
    aspectRatio: 1, 
    justifyContent: 'center',
  },
  mainImage: { 
    width: '100%', 
    aspectRatio: 1 
  },
  actionBar: { flexDirection: 'row', padding: 15 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  count: { marginLeft: 5, fontWeight: '600' },
  caption: { paddingHorizontal: 15, fontSize: 15, marginBottom: 20 },
  commentsSection: { paddingHorizontal: 15, paddingBottom: 30 },
  commentTitle: { fontWeight: 'bold', marginBottom: 15, fontSize: 16 },
  commentItem: { flexDirection: 'row', marginBottom: 15 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  commentBubble: { flex: 1, padding: 10, borderRadius: 15 },
  commentUser: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
  noComments: { textAlign: 'center', color: '#667', marginTop: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 0.5, paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, maxHeight: 100, marginRight: 10 },
  sendText: { color: '#6366F1', fontWeight: 'bold', paddingRight: 5 }
});

export default MomentDetail;