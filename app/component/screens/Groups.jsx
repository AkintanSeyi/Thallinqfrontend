import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, Image, StatusBar, ActivityIndicator, Dimensions,
  Modal, KeyboardAvoidingView, Platform, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useRoute, useNavigation, useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import * as api from "../../../api/index"; 

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = (width - 30) * 1.35; 

const CATEGORIES = [
  "All", 'Technology', 'Social', 'Fitness', 'Education', 'Gaming', 'Music', 'Travel',
  'Party', 'Nightlife', 'Food & Drink', 'Sports', 'Art & Design', 'Photography', 
  'Business', 'Fashion', 'Movies', 'Outdoors', 'Wellness', 'Pets', 'Anime'
];

// --- AUTH HEADER LOGO ---
const AuthHeader = () => (
  <View style={styles.headerLogoContainer}>
    <Image 
      source={{ uri: 'https://res.cloudinary.com/dvuq6vmiy/image/upload/v1767771541/1000002239-removebg-preview_mgilwd.png' }} 
      style={styles.headerLogoImage}
      resizeMode="contain"
    />
  </View>
);

const Groups = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  // --- STATE ---
  const [activeCategory, setActiveCategory] = useState('All');
  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [savedGroups, setSavedGroups] = useState([]);
  const [searchMode, setSearchMode] = useState('Groups'); 
  const [moments, setMoments] = useState([]);
  const [users, setUsers] = useState([]);

  // --- COMMENT & MENU STATE ---
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  // --- GUEST GUARD HELPER ---
  const checkAuth = (action) => {
    if (!userId) {
      Alert.alert("Action Required", "Please log in to interact with groups, post, or view details.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log In", onPress: () => navigation.navigate('SignIn') }
      ]);
      return;
    }
    action();
  };

  const handleBookmark = async (groupId) => {
  checkAuth(async () => {
    try {
      // Optimistic Update
      const isAlreadySaved = savedGroups.includes(groupId);
      if (isAlreadySaved) {
        setSavedGroups(prev => prev.filter(id => id !== groupId));
      } else {
        setSavedGroups(prev => [...prev, groupId]);
      }

      // API Call (itemType 'group' tells backend which array to use)
      const res = await api.toggleBookmark(userId, groupId, 'group');
      
      if (!res.data.success) {
        // Rollback if failed
        if (isAlreadySaved) setSavedGroups(prev => [...prev, groupId]);
        else setSavedGroups(prev => prev.filter(id => id !== groupId));
      }
    } catch (e) {
      Alert.alert("Error", "Could not save group.");
    }
  });
};



const fetchSavedGroups = async (userEmail) => {
  try {
    // We use the email here because your backend route is /user-profile/:email
    const res = await api.getUserProfile(userEmail); 
    
    if (res.data.success && res.data.user) {
      // Check for both savedPosts (Groups) and savedMoments
      const savedIds = [
        ...(res.data.user.savedPosts || []),
        ...(res.data.user.savedMoments || [])
      ].map(p => p._id || p);
      
      setSavedGroups(savedIds);
    }
  } catch (e) { 
    console.log("Error fetching bookmarks", e); 
  }
};

const fetchUserProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      const id = decoded.id || decoded.userId;
      const email = decoded.email; // Ensure your JWT includes the email field
      
      setUserId(id);

      if (email) {
        fetchSavedGroups(email);
      }
      return id;
    }
  } catch (e) { 
    console.log("Guest mode active"); 
  }
  return null;
};

  const fetchGroups = async (pageNum, isNewSearch = false, categoryToUse = activeCategory) => {
    if (loading) return;
    if (isNewSearch) {
      setIsInitialLoading(true);
      setGroups([]);
    }
    setLoading(true);
    try {
      const response = await api.getGroups(pageNum, categoryToUse, searchQuery, userId);
      const fetchedGroups = response.data.groups;
      setGroups(prev => {
        if (isNewSearch) return fetchedGroups;
        const newGroups = fetchedGroups.filter(fg => !prev.some(pg => pg._id === fg._id));
        return [...prev, ...newGroups];
      });
      setHasMore(pageNum < response.data.totalPages);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  // --- ACTION HANDLERS ---
  const handleLike = async (groupId) => {
    checkAuth(async () => {
      try {
        const response = await api.likeGroup(groupId, userId);
        if (response.data.success) {
          setGroups(prev => prev.map(g => g._id === groupId ? { ...g, likes: response.data.likes } : g));
        }
      } catch (e) { console.log(e); }
    });
  };

  const handleBlockUser = async (targetUserId) => {
    try {
      const res = await api.blockUser({ currentUserId: userId, blockUserId: targetUserId });
      if (res.data.success) {
        setGroups(prev => prev.filter(g => {
          const creatorId = g.creator?._id || g.creator;
          return String(creatorId) !== String(targetUserId);
        }));
        if (selectedPost) {
          setSelectedPost(prev => ({
            ...prev,
            comments: prev.comments.filter(c => String(c.user?._id || c.user) !== String(targetUserId))
          }));
        }
        setCommentModalVisible(false);
        Alert.alert("Blocked", "You won't see content from this user again.");
      }
    } catch (e) { Alert.alert("Error", "Action failed."); }
  };

  const handleOpenMenu = (item) => {
    checkAuth(() => {
      const creatorId = item.creator?._id || item.creator;
      if (String(creatorId) === String(userId)) return;
      Alert.alert("Options", "Select action", [
        { text: "Report / Flag", onPress: () => Alert.alert("Received", "Review started.") },
        { text: "Block User", style: "destructive", onPress: () => handleBlockUser(creatorId) },
        { text: "Cancel", style: "cancel" }
      ]);
    });
  };

  

  // --- COMMENT LOGIC ---
  const openComments = (post) => {
    checkAuth(() => {
      setSelectedPost(post);
      setCommentModalVisible(true);
    });
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const originalText = commentText;
    setCommentText("");
    try {
      const res = await api.commentOnGroup({ postId: selectedPost._id, userId: userId, text: originalText });
      if (res.data.success) {
        setGroups(prev => prev.map(g => g._id === selectedPost._id ? res.data.post : g));
        setSelectedPost(res.data.post);
      }
    } catch (err) { 
        Alert.alert("Error", "Could not post comment"); 
        setCommentText(originalText);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.deletehomeComment(selectedPost._id, commentId, userId);
      if (res.data.success) {
        setSelectedPost(res.data.post);
        setGroups(prev => prev.map(p => p._id === res.data.post._id ? res.data.post : p));
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
        { text: "Flag Comment", onPress: () => Alert.alert("Reported", "We will review this.") },
        { text: "Block User", style: "destructive", onPress: () => handleBlockUser(commentAuthorId) },
        { text: "Cancel", style: "cancel" }
      ]);
    }
  };

  // --- LIFECYCLE ---
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile().then(id => {
        const categoryFromParams = route.params?.selectedCategory;
        if (categoryFromParams) {
          setActiveCategory(categoryFromParams);
          setSearchQuery('');
          setPage(1);
          fetchGroups(1, true, categoryFromParams);
          navigation.setParams({ selectedCategory: undefined });
        } else if (groups.length === 0) {
          fetchGroups(1, true, activeCategory);
        }
      });
    }, [route.params?.selectedCategory])
  );

useEffect(() => {
  const delayDebounce = setTimeout(async () => {
    if (isInitialLoading) return;

    setPage(1); // Reset pagination on mode/search change

    if (searchMode === 'Groups') {
      fetchGroups(1, true, activeCategory);
    } else {
      // Path for Users
      if (!searchQuery.trim()) {
        setUsers([]); 
        return;
      }
      setLoading(true);
      try {
        const res = await api.searchUsers(searchQuery);
        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (e) {
        console.error("User search failed", e);
      } finally {
        setLoading(false);
      }
    }
  }, 500);

  return () => clearTimeout(delayDebounce);
}, [searchQuery, activeCategory, searchMode]);

  const renderGroupItem = ({ item }) => {
  const isLiked = item.likes?.includes(userId);
  const isBookmarked = savedGroups.includes(item._id);

  return (
    <View style={[styles.verticalCard, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: item.profilePicture }} style={styles.miniAvatar} />
          <View>
            <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
            <Text style={styles.groupCategoryLabel}>{item.category}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleOpenMenu(item)}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => checkAuth(() => navigation.navigate("GroupDetail", { id: item._id }))} activeOpacity={0.95}>
        <Image source={{ uri: item.profilePicture }} style={styles.groupImage} />
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <View style={styles.actionBar}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <View style={styles.leftActions}>
              <TouchableOpacity onPress={() => handleLike(item._id)} style={styles.actionButton}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#EF4444" : colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openComments(item)} style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Bookmark Toggle */}
            <TouchableOpacity onPress={() => handleBookmark(item._id)} style={styles.actionButton}>
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isBookmarked ? "#6366F1" : colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
           <Text style={[styles.memberCountText, { color: colors.text }]}>
             {item.likes?.length || 0} likes • {item.comments?.length || 0} comments • {item.memberCount || 1} members
           </Text>
        </View>
      </View>
    </View>
  );
};

const renderUserItem = ({ item }) => (
  <TouchableOpacity 
    style={[styles.userItemContainer, { borderBottomColor: dark ? '#374151' : '#F1F5F9' }]}
    // Changing to Profileview as requested
    onPress={() => navigation.navigate("Profileview", { userEmail: item.email })}
    activeOpacity={0.7}
  >
    <View style={styles.userAvatarWrapper}>
      <Image 
        // Fallback for different naming conventions
        source={{ uri: item.profilePicture || item.profileImage || 'https://via.placeholder.com/150' }} 
        style={styles.userAvatar} 
      />
    </View>
    
    <View style={styles.userInfo}>
      <Text style={[styles.userNameText, { color: colors.text }]}>{item.name}</Text>
      <Text style={styles.userBioText} numberOfLines={1}>
        {item.bio || "No bio available"}
      </Text>
    </View>
    
    <View style={styles.userActionIcon}>
       <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </View>
  </TouchableOpacity>
);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
    
       

<FlatList
  // Dynamic data source
  data={searchMode === 'Groups' ? groups : users}
  keyExtractor={(item) => item._id} 
  
  // Dynamic render item
  renderItem={searchMode === 'Groups' ? renderGroupItem : renderUserItem}
  
  contentContainerStyle={styles.listPadding}
  
  onEndReached={() => {
    // Only paginate for Groups (unless your user API supports pagination)
    if (searchMode === 'Groups' && hasMore && !loading) {
      fetchGroups(page + 1);
    }
  }}
  onEndReachedThreshold={0.5} 
  
  refreshControl={
    <RefreshControl 
      refreshing={isRefreshing} 
      onRefresh={() => { 
        setIsRefreshing(true); 
        if (searchMode === 'Groups') {
           setPage(1); 
           fetchGroups(1, true); 
        } else {
           // If in user mode, just stop the spinner or re-trigger search
           setIsRefreshing(false);
        }
      }} 
    />
  }
  ListHeaderComponent={
    <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Explore</Text>

      {/* MODE SWITCHER */}
      <View style={{ flexDirection: 'row', marginBottom: 15, paddingHorizontal: 5 }}>
        {['Groups', 'Users'].map((mode) => (
          <TouchableOpacity 
            key={mode}
            onPress={() => {
              setSearchMode(mode);
              setSearchQuery(''); // Clear search when switching modes
              setPage(1);
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 20,
              backgroundColor: searchMode === mode ? '#6366F1' : (dark ? '#374151' : '#E5E7EB'),
              marginRight: 10
            }}
          >
            <Text style={{ color: searchMode === mode ? '#FFF' : colors.text, fontWeight: 'bold' }}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchSection}>
        <TextInput
          placeholder={`Search ${searchMode.toLowerCase()}...`}
          placeholderTextColor={dark ? "#6B7280" : "#94A3B8"} 
          style={[styles.searchInput, { backgroundColor: dark ? '#1F2937' : '#F3F4F6', color: colors.text }]}        
          value={searchQuery} 
          onChangeText={setSearchQuery}                                    
        />                                    
      </View>

      {/* CATEGORIES - Hide when searching Users to save space */}
      {searchMode === 'Groups' && (
        <View style={styles.filterWrapper}>
          <FlatList
            data={CATEGORIES} 
            horizontal 
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setActiveCategory(item)}
                style={[
                  styles.filterPill, 
                  { backgroundColor: dark ? '#374151' : '#E5E7EB' }, 
                  activeCategory === item && (dark ? styles.activePillDark : styles.activePillLight)
                ]}
              >
                <Text style={[styles.pillText, activeCategory === item && styles.activePillText]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  }
  ListEmptyComponent={
    loading ? (
      <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 50}} />
    ) : (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={[styles.emptyText, { color: colors.text, opacity: 0.6 }]}>
          No {searchMode.toLowerCase()} found for "{searchQuery}"
        </Text>
      </View>
    )
  }
/>

      {/* COMMENT MODAL */}
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
                placeholderTextColor="#94A3B8" value={commentText} onChangeText={setCommentText} 
              />
              <TouchableOpacity onPress={handleAddComment}><Ionicons name="send" size={24} color="#6366F1" /></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <TouchableOpacity style={[styles.fab, { backgroundColor: dark ? '#6366F1' : '#0B0C1B' }]} onPress={() => checkAuth(() => navigation.navigate("CreateGroup"))}>
        <Ionicons name="add" size={35} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 70, paddingTop: Platform.OS === 'ios' ? 40 : 10 },
  headerLogoContainer: { marginLeft: -25 },
  headerLogoImage: { width: 140, height: 80 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9333EA', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  loginBtnText: { color: '#FFF', fontWeight: 'bold', marginRight: 6 },
  headerContainer: { 
    paddingBottom: 10, 
    borderBottomLeftRadius: 20,   
    borderBottomRightRadius: 20,    
    paddingTop: Platform.select({ ios: 60, android: 35 }) // ADDED SPACE AT TOP
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 15 },
  searchSection: { paddingHorizontal: 20, marginBottom: 15 },
  searchInput: { padding: 15, borderRadius: 12, fontSize: 16 },
  filterWrapper: { paddingLeft: 20, marginBottom: 10 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  activePillLight: { backgroundColor: "#0B0C1B" },
  activePillDark: { backgroundColor: "#6366F1" },
  pillText: { color: '#6B7280', fontWeight: '600' },
  activePillText: { color: '#fff' },
  listPadding: { paddingBottom: 120 }, 
  verticalCard: { marginHorizontal: 8, marginBottom: 25, borderRadius: 24, overflow: 'hidden', elevation: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  miniAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  groupName: { fontSize: 15, fontWeight: '700' },
  groupCategoryLabel: { fontSize: 12, color: '#64748B' },
  groupImage: { width: '100%', height: IMAGE_HEIGHT },
  cardContent: { paddingHorizontal: 16, paddingBottom: 15, paddingTop: 10 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  leftActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { marginRight: 15 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  memberCountText: { fontWeight: '700', fontSize: 14 },
  fab: { position: 'absolute', right: 25, bottom: 35, width: 65, height: 65, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  commentItem: { marginBottom: 15, paddingBottom: 10 },
  commentUser: { fontWeight: 'bold', fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#94A3B8' },
  userItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    // Removed border/card look
    backgroundColor: 'transparent', 
  },
  userAvatarWrapper: {
    position: 'relative',
  },
  userAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E5E7EB', // Placeholder color while loading
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  userBioText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '400',
  },
  userActionIcon: {
    paddingLeft: 10,
  },
  // Update your FlatList separator for Users
  userSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6', // Very light grey for light mode
    marginLeft: 85, // Aligns separator with text, not the avatar
    opacity: 0.5,
  }
});

export default Groups;