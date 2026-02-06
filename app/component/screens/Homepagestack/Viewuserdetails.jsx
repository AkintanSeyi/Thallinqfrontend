import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView 
} from 'react-native';
import { useRoute, useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../api/index";

const Viewuserdetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const { userId } = route.params; 

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await getCurrentUser();
      await fetchProfile();
      setLoading(false);
    };
    initialize();
  }, [userId]);

  const getCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId || decoded.id); 
      }
    } catch (error) {
      console.error("Token Error:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.getUserPublicProfile(userId);
      if (response.data.success) {
        setUserData(response.data.user);
        setIsBlockedByMe(response.data.isBlockedByMe || false);
        setHasBlockedMe(response.data.hasBlockedMe || false);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  const handleBlockAction = async () => {
    const action = isBlockedByMe ? "Unblock" : "Block";
    Alert.alert(`${action} User`, `Are you sure?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: action, 
        style: isBlockedByMe ? "default" : "destructive",
        onPress: async () => {
          try {
            const payload = { currentUserId, blockUserId: userId };
            const response = isBlockedByMe 
              ? await api.unblockUser(payload) 
              : await api.blockUser(payload);

            if (response.data.success) {
              await fetchProfile(); 
            }
          } catch (error) {
            Alert.alert("Error", `Could not ${action.toLowerCase()} user.`);
          }
        } 
      }
    ]);
  };

  // --- FIXED MESSAGE LOGIC ---
// ... inside Viewuserdetails component ...

 const handleMessagePress = async () => {
  try {
    setLoading(true);

    // This call returns the OLD conversation if it exists!
    const response = await api.createConversation({
      senderId: currentUserId,
      receiverId: userId // The ID of the person whose profile you are viewing
    });

    if (response.data.success) {
      // Navigate using the ID from the database
      navigation.navigate("Message", { 
        conversationId: response.data.conversation._id, 
        currentUserId: currentUserId,
        name: userData?.name
      });
    }
  } catch (error) {
    Alert.alert("Error", "Could not load chat history.");
  } finally {
    setLoading(false);
  }
};
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // UI IF YOU BLOCKED THEM
  if (isBlockedByMe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.noticeContainer}>
          <View style={styles.iconCircleLarge}>
            <Ionicons name="eye-off" size={60} color="#94A3B8" />
          </View>
          <Text style={[styles.noticeText, { color: colors.text }]}>You blocked this user</Text>
          <Text style={styles.noticeSub}>Unblock them to see their bio and interests.</Text>
          <TouchableOpacity style={[styles.btn, styles.unblockBtn]} onPress={handleBlockAction}>
            <Ionicons name="unlock-outline" size={20} color="#FFF" />
            <Text style={styles.btnText}>Unblock User</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // UI IF THEY BLOCKED YOU
  if (hasBlockedMe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.noticeContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#94A3B8" />
          <Text style={[styles.noticeText, { color: colors.text }]}>User Not Found</Text>
        </View>
      </View>
    );
  }

  const isOwnProfile = currentUserId === userId;
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Image 
          source={{ uri: userData?.profileImage || 'https://via.placeholder.com/150' }} 
          style={styles.profileImg} 
        />
        <Text style={[styles.name, { color: colors.text }]}>{userData?.name}</Text>
        <Text style={styles.username}>@{userData?.username}</Text>
      </View>

      <View style={styles.contentSection}>
        {userData?.isPrivate && !isOwnProfile ? (
          <View style={styles.privateNotice}>
            <Ionicons name="lock-closed" size={50} color="#94A3B8" />
            <Text style={[styles.privateText, { color: colors.text }]}>This Account is Private</Text>
            <Text style={styles.privateSub}>Follow them to see bio and interests.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>About</Text>
              <View style={[styles.detailsBox, { backgroundColor: dark ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.bioText, { color: dark ? '#CBD5E1' : '#475569' }]}>
                  {userData?.bio || "No bio available."}
                </Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Interests</Text>
              <View style={styles.interestsList}>
                {userData?.interests?.map((item, index) => (
                  <View key={index} style={[styles.interestPill, { backgroundColor: dark ? '#312E81' : '#E0E7FF' }]}>
                    <Text style={[styles.interestText, { color: dark ? '#C7D2FE' : '#4338CA' }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {!isOwnProfile && (
          <View style={styles.buttonRow}>
            {/* FIXED MESSAGE BUTTON */}
            <TouchableOpacity
              onPress={handleMessagePress}
              activeOpacity={0.7}
              style={[
                styles.btn, 
                styles.msgBtn,
                // Gray out button if blocked
                (isBlockedByMe || hasBlockedMe) && { backgroundColor: '#94A3B8' }
              ]}
            >
              <Ionicons 
                name={isBlockedByMe || hasBlockedMe ? "chatbubble-off-outline" : "chatbubble-ellipses"} 
                size={20} 
                color="#FFF" 
              />
              <Text style={styles.btnText}>
                {isBlockedByMe || hasBlockedMe ? "Blocked" : "Message"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.blockBtn]} onPress={handleBlockAction}>
              <Ionicons name="ban" size={20} color="#FFF" />
              <Text style={styles.btnText}>Block</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 99 },
  profileImg: { width: 110, height: 110, borderRadius: 55, marginBottom: 15, borderWidth: 3, borderColor: '#6366F1' },
  name: { fontSize: 24, fontWeight: '800' },
  username: { color: '#94A3B8', fontSize: 15 },
  contentSection: { padding: 25 },
  noticeContainer: { alignItems: 'center', paddingHorizontal: 40 },
  iconCircleLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(148, 163, 184, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  noticeText: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  noticeSub: { color: '#94A3B8', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  sectionContainer: { marginBottom: 25 },
  sectionLabel: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  detailsBox: { padding: 16, borderRadius: 16 },
  bioText: { fontSize: 15, lineHeight: 22 },
  interestsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25 },
  interestText: { fontSize: 14, fontWeight: '600' },
  privateNotice: { alignItems: 'center', marginTop: 40 },
  privateText: { fontSize: 20, fontWeight: '700', marginTop: 15 },
  privateSub: { color: '#94A3B8', textAlign: 'center', marginTop: 8 },
  buttonRow: { flexDirection: 'row', marginTop: 20, gap: 15 },
  btn: { flex: 1, flexDirection: 'row', height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  msgBtn: { backgroundColor: '#6366F1' },
  blockBtn: { backgroundColor: '#EF4444' },
  unblockBtn: { backgroundColor: '#10B981', width: '100%', marginTop: 20 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default Viewuserdetails;