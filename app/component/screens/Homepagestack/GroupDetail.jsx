
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,  Linking ,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useNavigation, useRoute, useTheme, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import * as Clipboard from 'expo-clipboard';

import * as api from "../../../../api/index";

const GroupDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, dark } = useTheme();
  const { id } = route.params;

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null); 
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState("Feed");

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [memberSearch, setMemberSearch] = useState(""); 

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
 const [shareModalVisible, setShareModalVisible] = useState(false);

const handleSocialShare = async (platform) => {
  // Use the group name or the specific post content
  const shareName = selectedPost ? `Post by ${selectedPost.author?.name}` : group?.name;
  const shareMessage = `Check out ${shareName} on ThaLinq!`;
  const shareUrl = `https://thalinq.com/group/${id}`; // Link to the group
  
  let url = '';
  switch(platform) {
    case 'Facebook':
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      break;
    case 'X': 
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`; 
      break;
    case 'LinkedIn': 
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`; 
      break;
    case 'Instagram': 
      url = Platform.OS === 'ios' ? 'instagram://' : 'https://www.instagram.com/'; 
      break;
  case 'Copy Link':
      try {
        // This is the line that actually copies the link
        await Clipboard.setStringAsync(shareUrl); 
        Alert.alert("Link Copied", "Group link copied to clipboard!");
      } catch (err) {
        Alert.alert("Error", "Failed to copy link.");
      }
      setShareModalVisible(false);
      return;
  }
  
  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert("Error", "App not installed. Opening browser...");
    // Fallback if app isn't found (for X/Facebook/LinkedIn)
    if (url.startsWith('http')) await Linking.openURL(url);
  }
  setShareModalVisible(false);
};

  useFocusEffect(
    useCallback(() => {
      if (id) {
        initialize();
      }
    }, [id])
  );

  useEffect(() => {
    initialize();
  }, [id]);

  const initialize = async () => {
    if (!group) setLoading(true); 
    await fetchGroupDetails();
    await fetchPosts(); 
    setLoading(false);
  };

  useEffect(() => {
    if (isMember || (group && !group.isPrivate)) {
      fetchPosts();
    }
  }, [isMember, group?.isPrivate]);

  const fetchGroupDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const decoded = jwtDecode(token);
      const userId = decoded.userId || decoded.id || decoded.sub;
      setCurrentUserId(String(userId));
      setCurrentUserEmail(decoded.email);

      const response = await api.getGroupDetails(id);
      if (response.data.success) {
        const groupData = response.data.group;
        setGroup(groupData);
        const memberFound = groupData.members.some(
          (m) => String(m.user._id || m.user) === String(userId)
        );
        setIsMember(memberFound);
        const memberData = groupData.members.find(
          (m) => String(m.user._id || m.user) === String(userId)
        );
        setNotificationsEnabled(memberData?.notificationsEnabled ?? false);
      }
    } catch (error) { console.error("Error group details", error); }
  };



  const fetchPosts = async () => {
    if (!id || !currentUserId) return; // Safety check
    try {
      // Pass both group ID and current user ID for blocking logic
      const response = await api.getGroupPosts(id, currentUserId);
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error("Error fetching filtered posts:", error);
    }
  };

const handleBlockUser = async (targetUserId) => {
  try {
    const res = await api.blockUser({ 
      currentUserId: currentUserId, 
      blockUserId: targetUserId 
    });

    if (res.data.success) {
      // 1. Remove posts from the main feed
      setPosts((prevPosts) => 
        prevPosts.filter((post) => {
          const authorId = post.author?._id || post.author;
          return String(authorId) !== String(targetUserId);
        })
      );

      // 2. Remove comments from the currently open Modal (selectedPost)
      if (selectedPost) {
        setSelectedPost(prev => ({
          ...prev,
          comments: prev.comments.filter(c => {
            const commentAuthorId = c.user?._id || c.user;
            return String(commentAuthorId) !== String(targetUserId);
          })
        }));
      }

      Alert.alert("Success", "User blocked. Their content has been removed from your view.");
    }
  } catch (error) {
    Alert.alert("Error", "Could not block user.");
  }
};

  // --- MENU HANDLERS ---
const handleOpenGroupMenu = () => {
    const creatorId = group?.creator?._id || group?.creator;
    const isCreator = String(creatorId) === String(currentUserId);

    Alert.alert("Group Options", "Select an action", [
      { text: "Flag Content / Report", onPress: () => Alert.alert("Reported", "Report received. We will take action within 24 hours") },
      // Only show block if you aren't the creator yourself
      ...(!isCreator ? [{
        text: "Block Creator",
        style: "destructive",
        onPress: () => {
          Alert.alert("Block", "Block this group creator?", [
            { text: "Cancel", style: "cancel" },
            { text: "Block", style: "destructive", onPress: () => handleBlockUser(creatorId) }
          ]);
        }
      }] : []),
      { text: "Cancel", style: "cancel" }
    ]);
  };
  const handleDeleteComment = async (commentId) => {
  try {
    // We send the currentUserId in the 'data' property for Axios DELETE
    const res = await api.deleteComment(selectedPost._id, commentId, currentUserId);
    
    if (res.data.success) {
      const updatedPost = res.data.post;

      // Update the local Modal view
      setSelectedPost(updatedPost);

      // Update the main list in the background so the comment count is accurate
      setPosts(prevPosts => prevPosts.map(p => 
        p._id === updatedPost._id ? updatedPost : p
      ));

      Alert.alert("Success", "Comment deleted.");
    }
  } catch (error) {
    Alert.alert("Error", error.response?.data?.message || "Failed to delete comment");
  }
};

const handleDeletePost = async (postId) => {
    try {
      // Pass both ID and currentUserId for backend verification
      const res = await api.deletePost(postId, currentUserId);
      
      if (res.data.success) {
        // Update local state so the post disappears immediately
        setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
        Alert.alert("Deleted", "Your post has been removed.");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Could not delete post.";
      Alert.alert("Error", errorMsg);
    }
  };

const handleOpenPostMenu = (post) => {
    // Determine the author's ID safely
    const authorId = post.author?._id || post.author;
    const isMyPost = String(authorId) === String(currentUserId);

    if (isMyPost) {
      Alert.alert("Your Post", "Manage your content", [
        { 
          text: "Delete Post", 
          style: "destructive", 
          onPress: () => {
            Alert.alert(
              "Delete Post",
              "Are you sure? This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeletePost(post._id) }
              ]
            );
          } 
        },
        { text: "Cancel", style: "cancel" }
      ]);
    } else {
      Alert.alert("Post Options", "Select an action", [
        { text: "Flag Post / Report", onPress: () => Alert.alert("Reported", "Report received. We will take action within 24 hours") },
        { 
          text: "Block Author", 
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Block User",
              "You will no longer see posts from this user in any group. Continue?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Block", 
                  style: "destructive", 
                  onPress: () => handleBlockUser(authorId) 
                }
              ]
            );
          } 
        },
        { text: "Cancel", style: "cancel" }
      ]);
    }
  };

const handleOpenCommentMenu = (comment) => {
    const commentAuthorId = comment.user?._id || comment.user;
    const isMyComment = String(commentAuthorId) === String(currentUserId);

    if (isMyComment) {
      Alert.alert("Your Comment", "Manage your content", [
        { 
          text: "Delete Comment", 
          style: "destructive", 
          onPress: () => {
            Alert.alert("Confirm", "Delete this comment?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => handleDeleteComment(comment._id) }
            ]);
          } 
        },
        { text: "Cancel", style: "cancel" }
      ]);
    } else {
      Alert.alert("Comment Options", "Select an action", [
        { text: "Flag Comment", onPress: () => Alert.alert("Reported", "Report received. We will take action within 24 hours") },
        { 
          text: "Block User", 
          style: "destructive",
          onPress: () => {
            Alert.alert("Block User", "You won't see their posts or comments anymore.", [
              { text: "Cancel", style: "cancel" },
              { text: "Block", style: "destructive", onPress: () => handleBlockUser(commentAuthorId) }
            ]);
          }
        },
        { text: "Cancel", style: "cancel" }
      ]);
    }
  };

  const handleJoinAndPay = async () => {
    if (isMember) {
      handleToggleMembership();
      return;
    }
    try {
      setProcessingPayment(true);
      if (!group?.isPrivate || group?.price <= 0) {
        const res = await api.toggleMembership({ groupId: id, userEmail: currentUserEmail });
        if (res.data.success) {
          Alert.alert("Success", "Welcome to the community!");
          setIsMember(res.data.isMember);
          fetchGroupDetails();
        }
      } else {
        const res = await api.createPaymentIntent({ groupId: id, userId: currentUserId });
        if (res.data.success) {
          const verifyRes = await api.verifyPaymentAndJoin({
            groupId: id,
            userId: currentUserId,
            paymentIntentId: "mock_success"
          });
          if (verifyRes.data.success) {
            Alert.alert("Success", "Welcome to the group!");
            setIsMember(true);
            fetchGroupDetails();
          }
        }
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Action failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleToggleMembership = async () => {
    if (isMember) {
      Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: async () => executeToggle() }
      ]);
    } else {
      executeToggle();
    }
  };

  const executeToggle = async () => {
    try {
      const res = await api.toggleMembership({ groupId: id, userEmail: currentUserEmail });
      if (res.data.success) {
        setIsMember(res.data.isMember);
        fetchGroupDetails();
        if (!res.data.isMember) Alert.alert("Success", "You have left the group.");
      }
    } catch (error) { Alert.alert("Error", error.response?.data?.message || "Action failed"); }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.toggleLikePost(postId, currentUserId);
      if (res.data.success) {
        setPosts(posts.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p));
      }
    } catch (err) { console.log("Like error", err); }
  };

  
  const handleDeleteGroup = () => {
    Alert.alert("Delete Group", "Permanently delete this group?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const res = await api.deleteGroup(id, currentUserId);
          if (res.data.success) navigation.goBack();
      }}
    ]);
  };

  const handleRemoveUser = (targetUserId, targetUserName) => {
    Alert.alert("Remove Member", `Remove ${targetUserName}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          const res = await api.removeUserFromGroup(id, currentUserId, targetUserId);
          if (res.data.success) fetchGroupDetails();
      }}
    ]);
  };

  const handleToggleNotifications = async () => {
    try {
      const previousState = notificationsEnabled;
      setNotificationsEnabled(!previousState);
      const res = await api.toggleGroupNotifications(id, currentUserId);
      if (!res.data.success) setNotificationsEnabled(previousState);
    } catch (error) { setNotificationsEnabled(!notificationsEnabled); }
  };

  const openComments = (post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.addComment({ postId: selectedPost._id, userId: currentUserId, text: commentText });
      if (res.data.success) { fetchPosts(); setCommentText(""); setCommentModalVisible(false); }
    } catch (err) { Alert.alert("Error", "Could not post comment"); }
  };

  const handleEditGroup = () => navigation.navigate("EditGroup", { groupId: id });

  const filteredMembers = group?.members?.filter(m => 
    m.user?.name?.toLowerCase().includes(memberSearch.toLowerCase())
  ) || [];

 const renderPost = ({ item }) => {
  const isLiked = item.likes?.includes(currentUserId);
  
  return (
    <View style={[styles.postCard, { backgroundColor: dark ? "#1E293B" : "#F8FAFC" }]}>
      <View style={styles.postHeader}>
        <Image 
          source={{ uri: item.author?.profileImage || "https://via.placeholder.com/40" }} 
          style={styles.postAvatar} 
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.postUser, { color: colors.text }]}>
            {item.author?.name || "User"}
          </Text>
          <Text style={styles.postTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <TouchableOpacity onPress={() => handleOpenPostMenu(item)}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.postContent, { color: dark ? "#CBD5E1" : "#475569" }]}>
        {item.content}
      </Text>

      <View style={styles.postActions}>
        {/* Like Button */}
        <TouchableOpacity style={styles.actionItem} onPress={() => handleLike(item._id)}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={isLiked ? "#EF4444" : "#94A3B8"} 
          />
          <Text style={[styles.actionText, { color: isLiked ? "#EF4444" : "#94A3B8" }]}>
            {item.likes?.length || 0}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity style={styles.actionItem} onPress={() => openComments(item)}>
          <Ionicons name="chatbubble-outline" size={20} color="#94A3B8" />
          <Text style={styles.actionText}>{item.comments?.length || 0} Comments</Text>
        </TouchableOpacity>

        {/* Share Button - ADDED THIS */}
        <TouchableOpacity 
          style={[styles.actionItem, { marginLeft: 'auto' }]} 
          onPress={() => {
            setSelectedPost(item);
            setShareModalVisible(true);
          }}
        >
          <Ionicons name="paper-plane-outline" size={20} color="#94A3B8" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  const renderMember = ({ item }) => {
    const groupCreatorId = group?.creator?._id || group?.creator;
    const amILeader = String(groupCreatorId) === String(currentUserId);
    const isThisMemberLeader = String(item.user?._id || item.user) === String(groupCreatorId);

    return (
      <TouchableOpacity
        style={[styles.memberCard, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate("Viewuserdetails", { userId: item.user._id })}
      >
        <View style={styles.memberLeftSection}>
          <Image source={{ uri: item.user.profileImage || "https://via.placeholder.com/150" }} style={styles.memberImg} />
          <View style={styles.memberInfo}>
            <Text style={[styles.memberName, { color: colors.text }]}>{item.user.name}</Text>
            <Text style={[styles.memberRole, { color: colors.primary }]}>{isThisMemberLeader ? 'Leader' : 'Member'}</Text>
          </View>
        </View>
        {amILeader && !isThisMemberLeader ? (
          <TouchableOpacity onPress={() => handleRemoveUser(item.user._id, item.user.name)} style={styles.removeUserBtn}>
            <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.text} opacity={0.3} />
        )}
      </TouchableOpacity>
    );
  };

  const handleJoinLive = async () => {
  setLoading(true);
  try {
    const response = await api.joinGroupLive(id);
    if (response.data.success) {
      navigation.navigate("LiveStream", { 
        groupId: id,
        token: response.data.token,
        channelName: response.data.channelName,
        uid: response.data.uid,
        role: 'audience', // Set as audience
        currentUserId: currentUserId
      });
    }
  } catch (error) {
    Alert.alert("Error", "This live stream might have just ended.");
  } finally {
    setLoading(false);
  }
};

const handleStartLive = async () => {
  setLoading(true);
  try {
    const response = await api.startGroupLive(id, currentUserId);

    if (response.data.success) {
      // FIX: Pass the UID from the response!
      navigation.navigate("LiveStream", { 
        groupId: id,
        token: response.data.token,
        channelName: response.data.channelName,
        uid: response.data.uid, // <--- ADD THIS LINE
        role: 'broadcaster',
        currentUserId: currentUserId
      });
    }
  } catch (error) {
    Alert.alert("Error", "Could not start live session.");
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  const ListHeader = useMemo(() => {
    const groupCreatorId = group?.creator?._id || group?.creator;
    const isCreator = groupCreatorId && currentUserId && String(groupCreatorId) === String(currentUserId);

    return (
      <View style={{ backgroundColor: colors.card }}>
        <View style={styles.coverSection}>
          <Image source={{ uri: group?.profilePicture }} style={styles.coverImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topMenuButton} onPress={handleOpenGroupMenu}>
            <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.identityContainer}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.groupTitle, { color: colors.text }]}>{group?.name}</Text>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{group?.category} • {group?.memberCount} members</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isCreator && (
   <TouchableOpacity 
  onPress={handleStartLive} // Use the new function here
  style={styles.liveBtn}
>
  <Ionicons name="videocam" size={18} color="#FFF" />
  <Text style={styles.liveBtnText}>Start Live</Text>
</TouchableOpacity>
    )}
    
{!isCreator && group?.isLive && (
  <TouchableOpacity 
    style={[styles.liveBtn, { backgroundColor: '#EF4444' }]} 
    onPress={handleJoinLive} // Call the function instead of 
  >
    <Ionicons name="pulse" size={18} color="#FFF" />
    <Text style={styles.liveBtnText}>Join Live</Text>
  </TouchableOpacity>
)}
                {isMember && (
                <TouchableOpacity onPress={handleToggleNotifications} style={[styles.notifBtn, { borderColor: colors.border, marginRight: 8 }]}>
                    <Ionicons name={notificationsEnabled ? "notifications" : "notifications-off-outline"} size={22} color={notificationsEnabled ? colors.primary : "#94A3B8"} />
                </TouchableOpacity>
                )}
                {!isCreator && (
                <TouchableOpacity onPress={handleToggleMembership} style={[styles.notifBtn, { borderColor: colors.border, backgroundColor: isMember ? 'transparent' : colors.primary }]}>
                    <Ionicons name={isMember ? "exit-outline" : "person-add-outline"} size={22} color={isMember ? colors.text : "#FFF"} />
                </TouchableOpacity>
                )} 
                {isCreator && (
                    <TouchableOpacity onPress={handleEditGroup} style={[styles.notifBtn, { borderColor: colors.border, marginLeft: 8 }]}>
                    <Ionicons name="create-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View> 
          </View>
          <Text style={[styles.groupDesc, { color: dark ? "#94A3B8" : "#64748B" }]}>{group?.description}</Text>
        </View>
        <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
          {["Feed", "Members"].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && { color: colors.text }]}>{tab === "Feed" ? "Posts" : "Members"}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {activeTab === "Members" && (
          <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: dark ? "#334155" : "#F1F5F9" }]}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginLeft: 12 }} />
              <TextInput placeholder="Search members..." placeholderTextColor="#94A3B8" style={[styles.searchInput, { color: colors.text }]} value={memberSearch} onChangeText={setMemberSearch} />
              {memberSearch.length > 0 && (
                <TouchableOpacity onPress={() => setMemberSearch("")}><Ionicons name="close-circle" size={18} color="#94A3B8" style={{ marginRight: 12 }} /></TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }, [group, isMember, notificationsEnabled, activeTab, memberSearch, colors, dark, currentUserId]);

  if (loading) return (
    <View style={[styles.mainContainer, { justifyContent: "center", backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  const groupCreatorId = group?.creator?._id || group?.creator;
  const isCreator = groupCreatorId && currentUserId && String(groupCreatorId) === String(currentUserId);
  const displayPrice = group?.price ? `$${group.price.toFixed(2)}` : "Join Group";

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <FlatList
        data={activeTab === "Feed" ? ((isMember || !group?.isPrivate) ? posts : []) : filteredMembers}
        renderItem={activeTab === "Feed" ? renderPost : renderMember}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={activeTab === "Feed" && !isMember ? (
          <View style={styles.paywallContainer}>
            <Ionicons name={group?.isPrivate ? "lock-closed" : "people-outline"} size={60} color={colors.primary} />
            <Text style={[styles.paywallTitle, { color: colors.text }]}>{group?.isPrivate ? "Private Feed" : "Join the Community"}</Text>
            <Text style={styles.paywallSubtitle}>
                {group?.isPrivate ? "This group's posts are only visible to members. Join now to unlock exclusive content." : "Become a member of this group to start posting and interacting with others!"}
            </Text>
            <TouchableOpacity style={[styles.joinBtn, { backgroundColor: colors.primary }]} onPress={handleJoinAndPay} disabled={processingPayment}>
              {processingPayment ? <ActivityIndicator color="#FFF" /> : <Text style={styles.joinBtnText}>{group?.price > 0 ? `Pay ${displayPrice} to Join` : "Join Group Free"}</Text>}
            </TouchableOpacity>
            {group?.price > 0 && (
              <View style={styles.stripeInfoRow}>
                <Ionicons name="shield-checkmark" size={14} color="#94A3B8" />
                <Text style={styles.stripeText}> Secure payment via Stripe</Text>
              </View>
            )}
          </View>
        ) : (activeTab === "Feed" && posts.length === 0 && (isMember || !group?.isPrivate)) ? (
          <Text style={styles.emptyText}>Nothing here yet.</Text>
        ) : null}
        showsVerticalScrollIndicator={false}
      />

      {isCreator && (
        <TouchableOpacity onPress={() => navigation.navigate("Adminview", { groupId: id })} style={[styles.adminFab, { backgroundColor: colors.text }]}>
          <Ionicons name="shield-checkmark" size={26} color={colors.background} />
        </TouchableOpacity>
      )}

      {isMember && activeTab === "Feed" && (
        <TouchableOpacity onPress={() => navigation.navigate("Postingroup", { groupId: id, currentUserId: currentUserId })} style={[styles.fab, { backgroundColor: colors.primary }]}>
          <Ionicons name="create" size={26} color="#FFF" />
        </TouchableOpacity>
      )}

      <Modal animationType="slide" transparent={true} visible={commentModalVisible} onRequestClose={() => setCommentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
       <FlatList
  data={selectedPost?.comments || []} // No need for complex external lists
  keyExtractor={(item) => item._id}
  renderItem={({ item }) => {
    // Safety check: ensure the user exists before rendering
    if (!item.user) return null;

    return (
      <View style={styles.commentItem}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.commentUser, { color: colors.text }]}>
            {item.user?.name || "User"}
          </Text>
          <TouchableOpacity onPress={() => handleOpenCommentMenu(item)}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <Text style={{ color: "#94A3B8", marginTop: 4 }}>{item.text}</Text>
      </View>
    );
  }}
/>
            <View style={styles.inputRow}>
              <TextInput style={[styles.commentInput, { color: colors.text, borderColor: colors.border }]} placeholder="Write a comment..." placeholderTextColor="#94A3B8" value={commentText} onChangeText={setCommentText} />
              <TouchableOpacity onPress={handleAddComment}><Ionicons name="send" size={24} color={colors.primary} /></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      {/* SHARE MODAL */}
<Modal
  animationType="fade"
  transparent={true}
  visible={shareModalVisible}
  onRequestClose={() => setShareModalVisible(false)}
>
  <TouchableOpacity 
    style={styles.modalOverlay} 
    activeOpacity={1} 
    onPress={() => setShareModalVisible(false)}
  >
    <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>Share to Socials</Text>
        <TouchableOpacity onPress={() => setShareModalVisible(false)}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingBottom: 30 }}>
        {[
          { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
          { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
          { name: 'X', icon: 'logo-twitter', color: '#000000' },
          { name: 'LinkedIn', icon: 'logo-linkedin', color: '#0077B5' },
          { name: 'Copy Link', icon: 'link-outline', color: '#64748B' },
        ].map((p) => (
          <TouchableOpacity 
            key={p.name}
            style={[styles.inputRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingVertical: 15 }]} 
            onPress={() => handleSocialShare(p.name)}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.color, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
              <Ionicons name={p.icon} size={20} color="#FFF" />
            </View>
            <Text style={{ color: colors.text, fontSize: 16, flex: 1 }}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </TouchableOpacity>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  coverSection: { height: 200, width: '100%' },
  coverImage: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  topMenuButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  identityContainer: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  groupTitle: { fontSize: 24, fontWeight: '800' },
  categoryText: { fontSize: 14, marginTop: 4 },
  notifBtn: { padding: 8, borderRadius: 20, borderWidth: 1 },
  groupDesc: { marginTop: 15, fontSize: 15, lineHeight: 22 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#6366F1' },
  tabText: { fontWeight: '600', color: '#94A3B8' },
  postCard: { marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 16 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  postUser: { fontWeight: "700" },
  postTime: { fontSize: 11, color: "#94A3B8" },
  postContent: { fontSize: 15, lineHeight: 22 },
  postActions: { flexDirection: "row", marginTop: 15, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#E2E8F0" },
  actionItem: { flexDirection: "row", alignItems: "center", marginRight: 25 },
  actionText: { marginLeft: 6, fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  memberCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, marginHorizontal: 20, marginTop: 10, borderRadius: 12 },
  memberLeftSection: { flexDirection: 'row', alignItems: 'center' },
  memberImg: { width: 50, height: 50, borderRadius: 25 },
  memberInfo: { marginLeft: 15 },
  memberName: { fontWeight: '700', fontSize: 16 },
  memberRole: { fontSize: 12, marginTop: 2 },
  removeUserBtn: { padding: 8 },
  fab: { position: "absolute", bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 5 },
  adminFab: { position: "absolute", bottom: 100, right: 25, width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 5 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  commentItem: { marginBottom: 15 },
  commentUser: { fontWeight: 'bold', fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  searchSection: { paddingHorizontal: 20, paddingVertical: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, height: 45 },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 14 },
  paywallContainer: { padding: 40, alignItems: 'center', marginTop: 20 },
  paywallTitle: { fontSize: 20, fontWeight: '800', marginTop: 15 },
  paywallSubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20, marginBottom: 25 },
  joinBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, width: '100%', alignItems: 'center' },
  joinBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  stripeInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  liveBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  shadowColor: '#EF4444',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
},// Add these inside your StyleSheet.create
liveBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#EF4444', // Red for Live
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 20,
  marginRight: 8,
  // Optional shadow for depth
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
},
liveBtnText: {
  color: '#FFF',
  fontWeight: 'bold',
  fontSize: 12,
  marginLeft: 4,
},
// Ensure your notifBtn doesn't have a fixed margin if it's pushing things around
notifBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
  stripeText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' }
});

export default GroupDetail;