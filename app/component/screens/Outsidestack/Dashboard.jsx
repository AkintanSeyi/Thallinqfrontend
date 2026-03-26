import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  ActivityIndicator, 
  RefreshControl,   
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from "../../../../api/index";

const { width } = Dimensions.get('window');


// --- DUMMY INTERNAL ADS DATA ---
const DUMMY_ADS = [
  {
    _id: 'ad-1',
    isAd: true,
    title: 'Featured Community: Tech Hub',
    description: 'Join the fastest growing tech group on the platform.',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    cta: 'Explore Now'
  },
  {
    _id: 'ad-2',
    isAd: true,
    title: 'Premium Upgrade',
    description: 'Get verified and boost your group visibility today.',
    imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800',
    cta: 'Learn More'
  }
];

// --- AUTH HEADER COMPONENT --- 
const AuthHeader = () => (
  <View style={styles.headerLogoContainer}>
    <Image 
      source={{ uri: 'https://res.cloudinary.com/dvuq6vmiy/image/upload/v1767771541/1000002239-removebg-preview_mgilwd.png' }} 
      style={styles.headerLogoImage}
      resizeMode="contain"
    />
  </View>
);

// --- NEW INTERNAL AD COMPONENT (DIFFERENT FROM POSTS) ---
const InternalAdItem = ({ item, colors }) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderLeftWidth: 5, borderLeftColor: '#6366F1' }]}>
    <View style={styles.adHeaderContainer}>
       <Text style={styles.adBadgeText}>SPONSORED</Text>
       <Ionicons name="sparkles" size={14} color="#6366F1" />
    </View>
    <Image source={{ uri: item.imageUrl }} style={styles.adMainImage} resizeMode="cover" />
    <View style={styles.adContent}>
       <Text style={[styles.adTitle, { color: colors.text }]}>{item.title}</Text>
       <Text style={styles.adDescription}>{item.description}</Text>
       <TouchableOpacity style={styles.adCta}>
          <Text style={styles.adCtaText}>{item.cta}</Text>
       </TouchableOpacity>
    </View>
  </View>
);

// 1. PERFORMANCE COMPONENT
const PostItem = memo(({ item, userId, colors, onLike, onMenu, onNavigate, onOpenComments }) => {
  const isLiked = item.likes?.includes(userId);
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: item.profilePicture }} style={styles.avatarSmall} />
          <View>
            <Text style={[styles.userNameText, { color: colors.text }]}>{item.name}</Text>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onMenu(item)}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigate(item._id)}>
        <Image 
          source={{ uri: item.profilePicture || 'https://via.placeholder.com/600/800' }} 
          style={styles.mainImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity onPress={() => onLike(item._id)}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={26} 
              color={isLiked ? "#EF4444" : colors.text} 
              style={styles.icon} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onOpenComments(item)}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.memberCount, { color: colors.text }]}>
          {item.likes?.length || 0} likes • {item.comments?.length || 0} comments • {item.memberCount || 0} members
        </Text>
      </View>
    </View>
  );
});

export default function HomePage() {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const checkAuth = (action) => {
    if (!userId) {
      Alert.alert("Join the Party", "Please log in to interact with groups.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log In", onPress: () => navigation.navigate('SignIn') }
      ]);
      return;
    }
    action();
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const id = decoded.id || decoded.userId || decoded.sub;
        setUserId(id);
        const response = await api.getUserProfile(decoded.email);
        if (response.data.success) {
          setUserName(response.data.user.name.split(' ')[0]);
        }
        return id;
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const fetchGroups = async (isRefreshingAction = false, currentId = userId) => {
    if (isRefreshingAction) setRefreshing(true);
    try {
      const response = await api.getLatestGroups(currentId);
      if (response.data.success) {
        const fetchedGroups = response.data.groups;
        
        let dataWithAds = [];
        let adCounter = 0;

        fetchedGroups.forEach((group, index) => {
          dataWithAds.push(group);
          
          if ((index + 1) % 4 === 0) {
            // Cycle through DUMMY_ADS array
            const adToInject = DUMMY_ADS[adCounter % DUMMY_ADS.length];
            dataWithAds.push({ 
              ...adToInject,
              _id: `internal-ad-${index}-${adCounter}` 
            });
            adCounter++;
          }
        });

        setGroups(dataWithAds);
      }
    } catch (e) { 
      console.error("Fetch Groups Error:", e); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const openComments = useCallback((post) => {
    checkAuth(() => {
      setSelectedPost(post);
      setCommentModalVisible(true);
    });
  }, [userId]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.commentOnGroup({ postId: selectedPost._id, userId: userId, text: commentText });
      if (res.data.success) {
        setGroups(prev => prev.map(g => g._id === selectedPost._id ? res.data.post : g));
        setSelectedPost(res.data.post);
        setCommentText("");
      }
    } catch (err) { Alert.alert("Error", "Could not post comment"); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.deletehomeComment(selectedPost._id, commentId, userId);
      if (res.data.success) {
        setSelectedPost(res.data.post);
        setGroups(prev => prev.map(p => p._id === res.data.post._id ? res.data.post : p));
        Alert.alert("Success", "Comment deleted.");
      }
    } catch (error) { Alert.alert("Error", "Failed to delete comment"); }
  };

  const handleOpenCommentMenu = (comment) => {
    const commentAuthorId = comment.user?._id || comment.user;
    const isMyComment = String(commentAuthorId) === String(userId);

    if (isMyComment) {
      Alert.alert("Your Comment", "Manage content", [
        { text: "Delete", style: "destructive", onPress: () => handleDeleteComment(comment._id) },
        { text: "Cancel", style: "cancel" }
      ]);
    } else {
      Alert.alert("Comment Options", "Select action", [
        { text: "Flag Comment", onPress: () => Alert.alert("Reported", "Review started.") },
        { text: "Block User", style: "destructive", onPress: () => handleBlockUser(commentAuthorId) },
        { text: "Cancel", style: "cancel" }
      ]);
    }
  };

  const handleLike = useCallback(async (groupId) => {
    checkAuth(async () => {
      try {
        const response = await api.likeGroup(groupId, userId);
        if (response.data.success) {
          setGroups(prev => prev.map(g => g._id === groupId ? { ...g, likes: response.data.likes } : g));
        }
      } catch (e) { console.log(e); }
    });
  }, [userId]);

  const handleBlockUser = async (targetUserId) => {
    try {
      const res = await api.blockUser({ currentUserId: userId, blockUserId: targetUserId });
      if (res.data.success) {
        setGroups(prev => prev.filter(g => String(g.creator?._id || g.creator) !== String(targetUserId)));
        if (commentModalVisible) setCommentModalVisible(false);
        Alert.alert("Blocked", "Content removed.");
      }
    } catch (e) { Alert.alert("Error", "Action failed."); }
  };

  const handleOpenMenu = useCallback((item) => {
    checkAuth(() => {
      const creatorId = item.creator?._id || item.creator;
      if (String(creatorId) === String(userId)) return;

      Alert.alert("Options", "Select action", [
        { text: "Report / Flag", onPress: () => Alert.alert("Received", "We will review this.") },
        { text: "Block User", style: "destructive", onPress: () => handleBlockUser(creatorId) },
        { text: "Cancel", style: "cancel" }
      ]);
    });
  }, [userId]);

  const handleNavigate = useCallback((id) => {
    checkAuth(() => {
      navigation.navigate('GroupDetail', { id });
    });
  }, [navigation, userId]);

  useEffect(() => {
    const loadData = async () => {
      const id = await fetchUserProfile();
      fetchGroups(false, id);
    };
    loadData();
  }, []);

  const renderItem = ({ item }) => {
    if (item.isAd) {
      return <InternalAdItem item={item} colors={colors} />;
    }

    return (
      <PostItem 
        item={item} 
        userId={userId} 
        colors={colors} 
        onLike={handleLike} 
        onMenu={handleOpenMenu} 
        onNavigate={handleNavigate}
        onOpenComments={openComments}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      <View style={styles.headerWrapper}>
        <AuthHeader />  
       {userId && (
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.loginBtnText}> Join Streams </Text>
            <Ionicons name="radio-outline" size={26} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#6366F1" />
      ) : (
        <FlatList
          data={groups}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchGroups(true, userId)} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={5}
        />
      )}

      <Modal animationType="slide" transparent={true} visible={commentModalVisible} onRequestClose={() => setCommentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Comments ({selectedPost?.comments?.length || 0})</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <FlatList
              data={selectedPost?.comments || []}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.commentUser, { color: colors.text }]}>{item.user?.name || "User"}</Text>
                    <TouchableOpacity onPress={() => handleOpenCommentMenu(item)}>
                      <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: "#94A3B8", marginTop: 4 }}>{item.text}</Text>
                </View>
              )}
            />
            <View style={styles.inputRow}>
              <TextInput 
                style={[styles.commentInput, { color: colors.text, borderColor: colors.border }]} 
                placeholder="Write a comment..." 
                placeholderTextColor="#94A3B8" 
                value={commentText} 
                onChangeText={setCommentText} 
              />
              <TouchableOpacity onPress={handleAddComment}><Ionicons name="send" size={24} color="#6366F1" /></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10 },
  headerWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 },
  headerLogoContainer: { marginLeft: -20 },
  headerLogoImage: { width: 140, height: 70 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9333EA', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25 },
  loginBtnText: { color: '#FFF', fontWeight: 'bold', marginRight: 8 },
  card: { marginHorizontal: 15, marginBottom: 20, borderRadius: 15, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  userNameText: { fontWeight: '700', fontSize: 15 },
  categoryText: { color: '#6366F1', fontSize: 12, fontWeight: '500' },
mainImage: { 
    width: '100%', 
    height: (Dimensions.get('window').width - 30) * 1.35 
  },
  actionBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 18 },
  cardFooter: { paddingHorizontal: 15, paddingBottom: 15 },
  memberCount: { fontSize: 14, fontWeight: '600' },
  
  // AD SPECIFIC STYLES
  adHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center' },
  adBadgeText: { color: '#6366F1', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  adMainImage: { width: '100%', height: 180 },
  adContent: { padding: 15 },
  adTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  adDescription: { color: '#94A3B8', fontSize: 13, marginBottom: 15 },
  adCta: { backgroundColor: '#6366F1', padding: 12, borderRadius: 10, alignItems: 'center' },
  adCtaText: { color: '#FFF', fontWeight: 'bold' },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  commentItem: { marginBottom: 15, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  commentUser: { fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 }
});