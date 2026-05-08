import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator,
  StatusBar,
  Alert,

  Modal,      
  FlatList,   
  Linking,    
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';
import * as api from "../../../api/index";
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const Profileview = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, dark } = useTheme();
  
  // Assuming userEmail is passed to view someone else's profile
  const { userEmail } = route.params || {}; 
  console.log(userEmail , "Hiii")

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [moments, setMoments] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [taggedMoments, setTaggedMoments] = useState([]);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const isOwnProfile = !userEmail || currentUserEmail === userEmail;

  useEffect(() => {
  const init = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      let myEmail = null;

      if (token) {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.id || decoded._id);
        setCurrentUserEmail(decoded.email);
        myEmail = decoded.email;
      }

      // GUARD: Only fetch if we actually have a target
      const targetEmail = userEmail || myEmail;
      
      if (targetEmail && targetEmail !== "undefined") {
        await fetchProfileData(targetEmail);
      } else {
        // If we get here, it means the token isn't ready or params are missing
        console.log("Waiting for email/token...");
      }
    } catch (err) {
      console.error("Init Error:", err);
    } finally {
      setLoading(false);
    }
  };

  init();
}, [userEmail]); // Only depend on the route param
 

const handleSocialShare = async (platform) => {
  const shareMessage = `Connect with ${user.name} on ThaLinq!`;
  const shareUrl = `https://thalinq.com/profile/${user.name?.toLowerCase().replace(/\s/g, '')}`;
  let url = '';

  if (platform === 'Copy Link') {
    try {
      await Clipboard.setStringAsync(shareUrl); // Ensure expo-clipboard is installed
      Alert.alert("Success", "Profile link copied!");
    } catch (err) {
      Alert.alert("Error", "Failed to copy");
    }
    setShareModalVisible(false);
    return;
  }

  const platformURLs = {
    'Facebook': `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    'X': `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`,
    'LinkedIn': `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    'Instagram': Platform.OS === 'ios' ? 'instagram://user?username=' : 'https://www.instagram.com',
  };

  url = platformURLs[platform] || `https://www.google.com/search?q=${platform}`;

  try {
    // Check if the app is installed, else fall back to browser
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback for Instagram/TikTok etc to open in browser
      const browserUrl = platform === 'Instagram' ? 'https://www.instagram.com' : url;
      await Linking.openURL(browserUrl);
    }
  } catch (error) {
    Alert.alert("Error", "Could not open link.");
  }
  setShareModalVisible(false);
};

const handleFollowToggle = async () => {
  // Prevent following yourself
  if (currentUserId === user._id) {
    Alert.alert("Action Not Allowed", "You cannot follow your own profile.");
    return;
  }

  if (!currentUserId) {
    Alert.alert("Error", "You must be logged in to follow users.");
    return;
  }

  try {
    const isNowFollowing = !isFollowing;
    setIsFollowing(isNowFollowing);

    const res = await api.toggleFollow(currentUserId, user._id);

    if (res.data.success) {
      setUser(prev => ({
        ...prev,
        followers: res.data.isFollowing 
          ? [...(prev.followers || []), currentUserId] 
          : (prev.followers || []).filter(id => id !== currentUserId)
      }));
    } else {
      setIsFollowing(!isNowFollowing);
    }
  } catch (error) {
    console.error("Follow Toggle Error:", error);
    setIsFollowing(isFollowing); 
    Alert.alert("Error", "Could not process follow request.");
  }
};

// const fetchProfileData = async () => {
//   try {
//     setLoading(true);
//     const res = await api.getUserProfile(userEmail);
//     if (res.data.success) {
//       const profileUser = res.data.user;
//       setUser(profileUser);

//       // Check if current user's ID exists in the fetched user's followers array
//       // We use a small timeout or check inside the useEffect to ensure currentUserId is ready
//       const token = await AsyncStorage.getItem('token');
//       if (token) {
//         const decoded = jwtDecode(token);
//         const myId = decoded.id || decoded._id;
//         const alreadyFollowing = profileUser.followers?.some(id => id === myId);
//         setIsFollowing(!!alreadyFollowing);
//       }

//       const momentsRes = await api.getMomentsByUser(userEmail);
//       setMoments(momentsRes.data.moments || []);
//     }
//   } catch (e) {
//     console.error("Fetch Profile Error:", e);
//   } finally {
//     setLoading(false);
//   }
// };

// const getFilteredMoments = () => {
//   if (activeTab === 'Videos') {
//     return moments.filter(m => {
//       // 1. Check mediaType (case-insensitive)
//       const isVideoType = m.mediaType?.toLowerCase() === 'video';
//       // 2. Fallback: check if the URL itself ends in .mp4
//       const isVideoUrl = m.mediaUrl?.toLowerCase().trim().endsWith('.mp4');
      
//       return isVideoType || isVideoUrl;
//     });
//   }

//   if (activeTab === 'Posts') {
//     // Show everything (Images and Videos)
//     return moments; 
//   }

//   return []; // For 'Tags'
// };


// Accept 'email' as a parameter so it works for both Self and Others
const fetchProfileData = async (email) => {
  try {
    setLoading(true);
    const res = await api.getUserProfile(email);
    if (res.data.success) {
      setUser(res.data.user);

      const [postsRes, tagsRes] = await Promise.all([
        api.getMomentsByUser(email, 'posts'),
        api.getMomentsByUser(email, 'tags')
      ]);

      setMoments(postsRes.data.moments || []);
      setTaggedMoments(tagsRes.data.moments || []);
    }
  } catch (e) {
    console.error("Fetch Profile Error:", e);
  } finally {
    setLoading(false);
  }
};

// 3. Update the filter to use the separate arrays
const getFilteredMoments = () => {
  if (activeTab === 'Videos') {
    return moments.filter(m => m.mediaType?.toLowerCase() === 'video' || m.mediaUrl?.endsWith('.mp4'));
  }
  if (activeTab === 'Posts') {
    return moments;
  }
  if (activeTab === 'Tags') {
    return taggedMoments; // Now displays the specific tagged data
  }
  return [];
};

const handleMessagePress = async () => {
 
  try {
    setLoading(true);
    const response = await api.createConversation({
      senderId: currentUserId,
      receiverId: user?._id 
    });

    if (response.data.success) {
      navigation.navigate("Message", { 
        conversationId: response.data.conversation._id, 
        currentUserId: currentUserId,
        name: user?.name
      });
    }
  } catch (error) {
    console.error("Chat Error:", error);
    Alert.alert("Error", "Could not start conversation.");
  } finally {
    setLoading(false);
  }
};

const filteredMoments = getFilteredMoments();

  if (loading || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      
      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
     <Text style={[styles.headerName, { color: colors.text }]}>
          {isOwnProfile ? "My Profile" : user?.name}
        </Text>
      {/* Only show Follow/Unfollow if it's NOT my profile */}
{isOwnProfile ? (
          // SETTINGS ICON for your own profile
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          // FOLLOW BUTTON for others
          <TouchableOpacity onPress={handleFollowToggle}>
            <Text style={[styles.followTopBtn, { color: isFollowing ? '#94A3B8' : '#6366F1' }]}>
              {isFollowing ? "Unfollow" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header Section */}
        <View style={styles.profileSection}> 
          <View style={styles.avatarContainer}> 
            <View> 
             <Image  
  source={{ uri: user.profilePicture || user.profileImage || 'https://via.placeholder.com/150' }} 
  style={styles.profileImage} 
/>
            </View>
          </View>

          <View style={styles.nameContainer}>
            <Text style={[styles.displayName, { color: colors.text }]}>{user.name} <Ionicons name="checkmark-circle" size={16} color="#6366F1" /></Text>
            <Text style={styles.handleText}>@{user.name?.toLowerCase().replace(/\s/g, '')}</Text>
          </View>

          <Text style={[styles.bioText, { color: colors.text }]}>
            {user.bio || "Digital Creator | Sharing creativity. 📍 Lagos, Nigeria"}
          </Text>
          
          <TouchableOpacity>
             <Text style={styles.linkText}>connectly.me/{user.name?.toLowerCase().replace(/\s/g, '')}</Text>
          </TouchableOpacity>

          {/* Stats Row */}
         <View style={styles.statsContainer}>
  <Text style={[styles.statItem, { color: colors.text }]}><Text style={styles.boldStat}>{moments.length}</Text> Posts</Text>
  
  {/* Dynamic Followers */}
  <Text style={[styles.statItem, { color: colors.text }]}>
    <Text style={styles.boldStat}>{user.followers?.length || 0}</Text> Followers
  </Text>
  
  {/* Dynamic Following */}
  <Text style={[styles.statItem, { color: colors.text }]}>
    <Text style={styles.boldStat}>{user.following?.length || 0}</Text> Following
  </Text>
</View>

          {/* Action Buttons */}
    <View style={styles.actionRow}>
 {isOwnProfile ? (
          <TouchableOpacity 
            style={[styles.mainBtn, { backgroundColor: colors.text }]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={[styles.mainBtnText, { color: colors.background }]}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.mainBtn, { backgroundColor: '#6366F1' }]}
            onPress={handleMessagePress}
          >
            <Text style={[styles.mainBtnText, { color: '#FFF' }]}>Message</Text>
          </TouchableOpacity>
        )}

  <TouchableOpacity 
    style={[styles.mainBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155' }]}
  onPress={() => setShareModalVisible(true)}
  >
    <Text style={[styles.mainBtnText, { color: colors.text }]}>Share Profile</Text>
  </TouchableOpacity>
</View>
        </View>

       

        {/* Custom Tabs */}
        <View style={styles.tabBar}>
          {['Posts', 'Videos', 'Tags'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.text }]}
            >
              <Ionicons 
                name={tab === 'Posts' ? "grid" : tab === 'Videos' ? "play-circle" : "person-add"} 
                size={22} 
                color={activeTab === tab ? colors.text : '#94A3B8'} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Grid */}
       {/* Content Grid */}
{/* Content Grid */}
{/* Content Grid */}
<View style={styles.gridContainer}>
{filteredMoments.map((item, index) => {
  const cleanUrl = item.mediaUrl?.trim();
  const isVideo = cleanUrl?.toLowerCase().endsWith('.mp4');
  
  let displayUrl = cleanUrl;

  if (isVideo) {
    // 1. We use the REQUIRED ImageKit thumbnail path
    // 2. We add a dummy query param ending in .jpg to trick the React Native decoder
    displayUrl = `${cleanUrl}/ik-thumbnail.jpg?tr=so-1,w-400&extension=.jpg`;
  }

  return (
    <TouchableOpacity 
      key={item._id || index} 
      style={styles.gridBox}
      onPress={() => navigation.navigate("MomentDetail", { moment: item })}
    >
      <View style={styles.gridImageContainer}>
        <Image 
          source={{ uri: displayUrl }} 
          style={styles.gridImage}
          // If this still gives a 400, your ImageKit Video settings ARE OFF.
          onError={(e) => console.log("FINAL ATTEMPT ERROR:", e.nativeEvent.error, "URL:", displayUrl)}
        />
        
        {isVideo && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play" size={16} color="#FFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
})}
</View>
      </ScrollView>
     <Modal animationType="slide" transparent={true} visible={shareModalVisible}>
  <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShareModalVisible(false)}>
    <View style={[styles.shareModalContent, { backgroundColor: colors.card }]}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => setShareModalVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.modalTitle, { color: colors.text }]}>Share Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.shareProfilePreview}>
        <Image source={{ uri: user.profilePicture || user.profileImage || 'https://via.placeholder.com/150' }} style={styles.shareAvatar} />
        <Text style={[styles.shareName, { color: colors.text }]}>{user.name}</Text>
        <Text style={styles.shareHandle}>@{user.name?.toLowerCase().replace(/\s/g, '')}</Text>
      </View>

      <FlatList
        data={[
          { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
          { name: 'X', icon: 'logo-twitter', color: '#000' },
          { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
          { name: 'LinkedIn', icon: 'logo-linkedin', color: '#0077B5' },
          { name: 'Copy Link', icon: 'link-outline', color: '#64748B' }
        ]}
        renderItem={({ item: p }) => (
          <TouchableOpacity style={styles.platformRow} onPress={() => handleSocialShare(p.name)}>
            <View style={[styles.platformIcon, { backgroundColor: p.color }]}><Ionicons name={p.icon} size={20} color="#FFF" /></View>
            <Text style={[styles.platformName, { color: colors.text }]}>{p.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.name}
      />
    </View>
  </TouchableOpacity>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerName: { fontSize: 18, fontWeight: '700' },
  followTopBtn: { fontWeight: 'bold', fontSize: 16 },
  profileSection: { alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  avatarContainer: { marginBottom: 15 },
  blueRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  profileImage: { width: 95, height: 95, borderRadius: 47.5 },
  nameContainer: { alignItems: 'center' },
  displayName: { fontSize: 22, fontWeight: 'bold' },
  handleText: { color: '#94A3B8', fontSize: 14, marginTop: 2 },
  bioText: { textAlign: 'center', marginTop: 12, fontSize: 14, lineHeight: 20 },
  linkText: { color: '#6366F1', fontWeight: '600', marginTop: 5 },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10
  },
  statItem: { fontSize: 14 },
  boldStat: { fontWeight: 'bold' },
 actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  mainBtn: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 7,
  },
  mainBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  storiesWrapper: { marginTop: 25, paddingBottom: 10 },
  storyTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 15, marginBottom: 15 },
  storyItem: { alignItems: 'center', marginRight: 18 },
  storyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#0F172A'
  },
  storyLabel: { fontSize: 11, width: 70, textAlign: 'center' },
  tabBar: {
    flexDirection: 'row',
    marginTop: 20,
    borderTopWidth: 0.3,
    borderTopColor: '#334155'
  },
  tabItem: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  gridBox: { width: COLUMN_WIDTH, height: COLUMN_WIDTH, padding: 1 },
 gridImage: { 
  width: '100%', 
  height: '100%', 
  resizeMode: 'cover',
  backgroundColor: '#1e293b' // Keep a dark background so you see it's loading
},
  gridImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#334155', // Placeholder color while loading
  },
  videoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareProfilePreview: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  shareAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  shareName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareHandle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Profileview;