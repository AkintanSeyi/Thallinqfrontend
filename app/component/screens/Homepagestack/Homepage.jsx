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
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { jwtDecode } from "jwt-decode";
import * as Notifications from "expo-notifications";
import * as Device from 'expo-device';
import Constants from "expo-constants";

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from "../../../../api/index";

const { width } = Dimensions.get('window');

const registerForPushNotificationsAsync = async () => {
  let token;
  if (!Device.isDevice) return null;

  // Inside your registerForPushNotificationsAsync in HomePage.js
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('messages', { // Changed name
    name: 'Messages',
    importance: Notifications.AndroidImportance.MAX, // High priority pop-up
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366F1',
  });
}

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
};

// 2. Inside your Screen component (e.g., HomeScreen or FeedScreen)
const FeedScreen = () => {
  // ... your existing state (isLoggedIn, etc.)

  useEffect(() => {
    const checkNotifications = async () => {
      // Get current user ID from token or state
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) return;
      
      const user = jwtDecode(storedToken);
      const storageKey = `asked_notifications_${user.id}`;
      const alreadyAsked = await AsyncStorage.getItem(storageKey);

      if (!alreadyAsked) {
        Alert.alert(
          "Stay Updated",
          "Enable notifications to see when people like your posts or go live!",
          [
            { text: "Later", onPress: () => AsyncStorage.setItem(storageKey, "true") },
            { 
              text: "Enable", 
              onPress: async () => {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                  await api.updateUserPushToken(user.id, token);
                }
                await AsyncStorage.setItem(storageKey, "true");
              }
            }
          ]
        );
      }
    };

    checkNotifications();
  }, []);

  
}


// --- DUMMY ADS DATA --- 
const DUMMY_ADS = [
  {
    _id: 'ad-1',
    isAd: true,
    title: 'Upgrade Your Gear',
    description: 'Get 20% off on all pro audio equipment this week only!',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    cta: 'Shop Now'
  },
  {
    _id: 'ad-2',
    isAd: true,
    title: 'Join the Creative Hub',
    description: 'Connect with over 10k creators worldwide in our new community.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    cta: 'Learn More'
  }
];

const DUMMY_STORIES = [
  { id: '1', name: 'Your Story', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', isMe: true },
  { id: '2', name: 'Live', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', isLive: true },
  { id: '3', name: 'Creator', image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200' },
  { id: '4', name: 'Design', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200' },
  { id: '5', name: 'Tech', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200' },
  { id: '6', name: 'Gaming', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
];

const AuthHeader = () => (
  <View style={styles.headerLogoContainer}>
    <Image 
      source={{ uri: 'https://res.cloudinary.com/dvuq6vmiy/image/upload/v1767771541/1000002239-removebg-preview_mgilwd.png' }} 
      style={styles.headerLogoImage}
      resizeMode="contain"
    />
  </View>
);

// --- CUSTOM AD COMPONENT ---
const AdItem = ({ item, colors }) => (
  <View style={[styles.adCard, { backgroundColor: colors.card, borderColor: '#6366F1' }]}>
    <View style={styles.adBadge}>
      <Text style={styles.adBadgeText}>SPONSORED</Text>
    </View>
    <Image source={{ uri: item.image }} style={styles.adImage} />
    <View style={styles.adContent}>
      <Text style={[styles.adTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={styles.adDescription}>{item.description}</Text>
      <TouchableOpacity style={styles.adCTA}>
        <Text style={styles.adCTAText}>{item.cta}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const onShare = async () => {
    try {
      await Share.share({
        message: `Check out this group on ThaLinq: ${item.name}`,
        url: `thalinq://group/${item._id}`, // If you have deep linking set up
      });
    } catch (error) {
      console.log(error.message);
    }
  };


const PostItem = memo(({ item, userId, colors, onLike, onMenu, onNavigate, onOpenComments }) => {
  const isLiked = item.likes?.includes(userId);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const handleSocialShare = async (platform) => {
    const shareMessage = `Check out this group: ${item.name} on ThaLinq!`;
    const shareUrl = `https://thalinq.com/group/${item._id}`;
    
    let url = '';
    switch(platform) {
      case 'Facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'TikTok':
        url = Platform.OS === 'ios' ? 'snssdk1128://' : 'https://www.tiktok.com/';
        break;
      case 'Instagram': 
        url = Platform.OS === 'ios' ? 'instagram://' : 'https://www.instagram.com/'; 
        break;
      case 'X': 
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`; 
        break;
      case 'LinkedIn': 
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`; 
        break;
      case 'Copy Link':
        
        Alert.alert("Link Copied", "Group link copied to clipboard!");
        setShareModalVisible(false);
        return;
    }
    
    try {
      if (platform === 'Copy Link') return;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to browser
        const browserUrl = (platform === 'Facebook' || platform === 'LinkedIn' || platform === 'X') 
          ? url 
          : `https://www.google.com/search?q=${platform}`;
        await Linking.openURL(browserUrl);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open the application.");
    }
    setShareModalVisible(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* CARD HEADER */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: item.profilePicture }} style={styles.avatarSmall} />
          <View>
            <Text style={[styles.userNameText, { color: colors.text }]}>{item.name}</Text>
            <Text style={styles.categoryText}>{item.category || 'Community'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onMenu(item)}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* MAIN IMAGE */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigate(item._id)}>
        <Image 
          source={{ uri: item.profilePicture || 'https://via.placeholder.com/600/800' }} 
          style={styles.mainImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* ACTION BAR */}
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
          <TouchableOpacity onPress={() => setShareModalVisible(true)}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.text} style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.cardFooter}>
        <Text style={[styles.memberCount, { color: colors.text }]}>
          {item.likes?.length || 0} likes • {item.comments?.length || 0} comments
        </Text>
      </View>

      {/* SHARE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShareModalVisible(false)}
        >
          <View style={[styles.shareModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Share to Socials</Text>
              <View style={{ width: 24 }} /> 
            </View>

            <Image source={{ uri: item.profilePicture }} style={styles.sharePreviewImage} />
            <Text style={[styles.sharePreviewText, { color: colors.text }]}>
              Check out "{item.name}" on ThaLinq! 
            </Text>

            {/* Added ScrollView wrapper for better spacing/scrolling if list grows */}
            <FlatList
              data={[
                { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
                { name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
                { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
                { name: 'X', icon: 'logo-twitter', color: '#000000' },
                { name: 'LinkedIn', icon: 'logo-linkedin', color: '#0077B5' },
                { name: 'Copy Link', icon: 'link-outline', color: '#64748B' },
              ]}
              keyExtractor={(p) => p.name}
              style={{ width: '100%' }}
              contentContainerStyle={{ paddingBottom: 40 }} // THIS ADDS THE SPACE AT THE BOTTOM
              renderItem={({ item: p }) => (
                <TouchableOpacity 
                  style={styles.platformRow} 
                  onPress={() => handleSocialShare(p.name)}
                >
                  <View style={[styles.platformIcon, { backgroundColor: p.color }]}>
                    <Ionicons name={p.icon} size={20} color="#FFF" />
                  </View>
                  <Text style={[styles.platformName, { color: colors.text }]}>{p.name}</Text>
                 
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});




const StoryBar = ({ colors }) => (
  <FlatList
    horizontal
    showsHorizontalScrollIndicator={false}
    data={DUMMY_STORIES}
    keyExtractor={(item) => item.id}
    contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 10 }}
    renderItem={({ item }) => (
      <TouchableOpacity style={styles.storyContainer}>
        <View style={[
          styles.storyRing,  
          { borderColor:  '#6366F1' }
        ]}> 
          <Image source={{ uri: item.image }} style={styles.storyImage} />
         
        </View>
        <Text numberOfLines={1} style={[styles.storyName, { color: colors.text }]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    )}
  />
);

const LiveGroupsBar = ({ groups, colors, navigation, currentUserId }) => {
  if (groups.length === 0) return null; // Hide the bar if no groups are live

  const handleJoinLive = async (groupId) => {
    try {
      const response = await api.joinGroupLive(groupId); // Reuse your join logic
      if (response.data.success) {
        navigation.navigate("LiveStream", { 
          groupId,
          token: response.data.token,
          channelName: response.data.channelName,
          uid: response.data.uid,
          role: 'audience',
          currentUserId: currentUserId
        });
      }
    } catch (error) {
      Alert.alert("Error", "This live stream might have ended.");
    }
  };

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ marginLeft: 15, marginTop: 10, fontWeight: 'bold', color: '#314ce4' }}>
        LIVE NOW
      </Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={groups}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.storyContainer} 
            onPress={() => handleJoinLive(item._id)}
          >
            <View style={[styles.storyRing, { borderColor: '#314ce4', borderWidth: 2 }]}> 
              <Image source={{ uri: item.profilePicture }} style={styles.storyImage} />
              <View style={styles.liveBadgeSmall}>
                 <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.storyName, { color: colors.text }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

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
  const [liveGroups, setLiveGroups] = useState([]);
  const [shareModalVisible, setShareModalVisible] = useState(false);
 
// Inside your HomePage component

const setupNotifications = async (currentUserId) => {
  if (!currentUserId || typeof currentUserId !== 'string') {
     console.error("CRITICAL: currentUserId is invalid:", currentUserId);
     return;
  }
  try {
    // 1. Check the DATABASE first
    const response = await api.getUserProfileById(currentUserId);
    const userInDb = response.data.user;

    // 2. Logic: If token exists in DB, just refresh it silently and STOP.
    if (false) {
      console.log("Token exists in DB. Skipping Alert.");
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await api.updateUserPushToken(currentUserId, token);
      }
      return; // <--- This exits the function so the Alert never runs
    }

    // 3. Fallback: Only ask if there is NO token in the database
    const storageKey = `asked_${currentUserId}`;
    const alreadyAsked = await AsyncStorage.getItem(storageKey);

    if (!alreadyAsked) {
      Alert.alert(
        "Stay Updated",
        "Enable notifications?",
        [
          { text: "Later", onPress: () => AsyncStorage.setItem(storageKey, "true") },
          { 
            text: "Enable", 
            onPress: async () => {
              const token = await registerForPushNotificationsAsync();
              if (token) await api.updateUserPushToken(currentUserId, token);
              await AsyncStorage.setItem(storageKey, "true");
            } 
          }
        ]
      );
    }
  } catch (err) {
    console.log("Notification Logic Error:", err);
  }
};

useEffect(() => {
  const loadData = async () => {
    // We get the ID from the token first
    const id = await fetchUserProfile(); 
    
    if (id) {
      // These run in parallel to keep the app fast
      fetchGroups(false, id);
      fetchLiveGroups(id);
      
      // We wait a tiny bit (1.5 seconds) before showing the alert 
      // so the user isn't spammed immediately upon opening the app
      // setTimeout(() => {
      //   setupNotifications(id); 
      // }, 1500);
    } else {
      fetchGroups(false, null);
    }
  };
  loadData();
}, []);

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
  // OLD: const adData = DUMMY_ADS[adCounter % DUMMY_ADS.length];
  
  // NEW: Pick a truly random ad from the array
  const randomIndex = Math.floor(Math.random() * DUMMY_ADS.length);
  const adData = DUMMY_ADS[randomIndex];
  
  dataWithAds.push({ 
    ...adData, 
    _id: `ad-pos-${index}-${Math.random()}` // Added random suffix to ensure unique keys
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
  const fetchLiveGroups = async (currentId) => {
  if (!currentId) return;
  try {
    const res = await api.getMyLiveGroups(currentId);
    if (res.data.success) {
      setLiveGroups(res.data.liveGroups);
    }
  } catch (e) {
    console.error("Live Groups Error:", e);
  }
};

const handleSocialShare = (platform) => {
  const shareMessage = encodeURIComponent(`Check out this group: ${item.name} on ThaLinq!`);
  const shareUrl = encodeURIComponent(`https://thalinq.com/group/${item._id}`);
  
  let url = '';
  switch(platform) {
    case 'Instagram': url = `https://www.instagram.com/`; break;
    case 'X': url = `https://twitter.com/intent/tweet?text=${shareMessage}&url=${shareUrl}`; break;
    case 'LinkedIn': url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`; break;
    case 'YouTube': url = `https://www.youtube.com/`; break;
  }
  
  Linking.openURL(url);
  setShareModalVisible(false);
};

useEffect(() => {
  const loadData = async () => {
    const id = await fetchUserProfile();
    fetchGroups(false, id);
    fetchLiveGroups(id); // Fetch the live groups here
  };
  loadData();
}, []);

  const renderItem = ({ item }) => {
    if (item.isAd) {
      return <AdItem item={item} colors={colors} />;
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
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Joinstreams')}>
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
  ListHeaderComponent={
    <LiveGroupsBar 
      groups={liveGroups} 
      colors={colors} 
      navigation={navigation} 
      currentUserId={userId}
    />
  }
  refreshControl={
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={() => {
        fetchGroups(true, userId);
        fetchLiveGroups(userId); // Refresh live groups too
      }} 
    />
  } contentContainerStyle={{ paddingBottom: 40 }}
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
  container: { 
    flex: 1, 
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight 
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 70,
    zIndex: 10
  },
  headerLogoContainer: { marginLeft: -25 },
  headerLogoImage: { width: 140, height: 80 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333EA',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20
  },
  loginBtnText: { color: '#FFF', fontWeight: 'bold', marginRight: 6 },
  card: { marginHorizontal: 8, marginBottom: 20, borderRadius: 15, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  userNameText: { fontWeight: '700', fontSize: 15 },
  categoryText: { color: '#6366F1', fontSize: 12, fontWeight: '500' },
  mainImage: { 
    width: '100%', 
    height: (Dimensions.get('window').width - 30) * 1.35 
  },
  actionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12 },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 15 },
  cardFooter: { paddingHorizontal: 15, paddingBottom: 15 },
  memberCount: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '75%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  commentItem: { marginBottom: 16 },
  adCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    paddingBottom: 15
  },
  adBadge: {
    backgroundColor: '#6366F1',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 10
  },
  adBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  liveBadgeSmall: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#000', // Or match your card background
    alignSelf: 'center',
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  storyContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  storyName: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  adImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover'
  },
  adContent: {
    padding: 12
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  adDescription: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 12
  },
  adCTA: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  adCTAText: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  storyContainer: {
  alignItems: 'center',
  marginRight: 15,
  width: 70,
},
storyRing: {
  width: 68,
  height: 68,
  borderRadius: 34,
  borderWidth: 2,
  padding: 2,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 4,
},
storyImage: {
  width: 58,
  height: 58,
  borderRadius: 29,
},
storyName: {
  fontSize: 11,
  textAlign: 'center',
},
addStoryBadge: {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: '#6366F1',
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#FFF',
  justifyContent: 'center',
  alignItems: 'center',
},
shareModalContent: {
  width: '100%',
  height: '80%',
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
  padding: 20,
  alignItems: 'center',
},
sharePreviewImage: {
  width: 150,
  height: 150,
  borderRadius: 20,
  marginTop: 20,
},
sharePreviewText: {
  color: '#94A3B8',
  textAlign: 'center',
  marginVertical: 15,
  paddingHorizontal: 30,
},
platformList: {
  width: '100%',
  marginTop: 10,
},
platformRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 15,
  backgroundColor: '#F8FAFC10',
  borderRadius: 15,
  marginBottom: 10,
},
platformIcon: {
  width: 35,
  height: 35,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 15,
},
platformName: {
  flex: 1,
  fontSize: 16,
  fontWeight: '600',
},
publishBtn: {
  backgroundColor: '#6366F1',
  width: '100%',
  padding: 15,
  borderRadius: 20,
  alignItems: 'center',
  marginTop: 'auto',
},
publishBtnText: {
  color: '#FFF',
  fontSize: 18,
  fontWeight: 'bold',
},
  commentUser: { fontWeight: '700', fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  commentInput: { flex: 1, height: 45, borderWidth: 1, borderRadius: 25, paddingHorizontal: 20, marginRight: 12, fontSize: 14 }
});