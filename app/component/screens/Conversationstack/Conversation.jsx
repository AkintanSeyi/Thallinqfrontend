import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  useNavigation,
  useTheme,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { Ionicons } from "@expo/vector-icons";
import * as api from "../../../../api/index";

const Conversation = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  // 1. Load User ID and Conversations
  const loadInbox = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setIsGuest(false);
        const decoded = jwtDecode(token);
        const myId = decoded.userId || decoded.id;
        setCurrentUserId(myId);

        const response = await api.getConversations(myId);
        setConversations(response.data);
      } else {
        setIsGuest(true);
      }
    } catch (error) {
      console.error("Inbox Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, []),
  );

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderItem = ({ item }) => {
    const otherUser = item.participants?.find((m) => m._id !== currentUserId);

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          { borderBottomColor: dark ? "#1E293B" : "#F3F4F6" },
        ]}
        onPress={() =>
          navigation.navigate("Message", {
            conversationId: item._id,
            currentUserId: currentUserId,
            name: otherUser?.name,
          })
        }
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: otherUser?.profileImage || "https://via.placeholder.com/150",
            }}
            style={[
              styles.avatar,
              { backgroundColor: dark ? "#334155" : "#E5E7EB" },
            ]}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.userName, { color: colors.text }]}
              numberOfLines={1}
            >
              {otherUser?.name || "Unknown User"}
            </Text>
            <Text style={styles.time}>{formatTime(item.updatedAt)}</Text>
          </View>

          <View>
            <View style={styles.messageRow}>
              <Text
                style={[
                  styles.lastMessage,
                  { color: dark ? "#94A3B8" : "#6B7280" },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage?.text || "Started a new conversation"}
              </Text>

              {item.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // --- GUEST VIEW COMPONENT ---
  const GuestView = () => (
    <View style={styles.guestContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="chatbubbles-outline" size={80} color="#6366F1" />
      </View>
      <Text style={[styles.guestTitle, { color: colors.text }]}>
        Join the Conversation
      </Text>
      <Text style={styles.guestSubtitle}>
        Log in to send messages and connect with group members.
      </Text>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate("SignIn")}
      >
        <Text style={styles.loginButtonText}>Sign In / Register</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : isGuest ? (
        <GuestView />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptyText,
                  { color: dark ? "#475569" : "#94A3B8" },
                ]}
              >
                No messages yet. Start a conversation!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  pageTitle: { fontSize: 28, fontWeight: "800", paddingHorizontal: 20 },
  listPadding: { paddingBottom: 100 },
  chatItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
  },
  avatarContainer: { position: "relative" },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  content: { flex: 1, marginLeft: 15 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  userName: { fontSize: 17, fontWeight: "700", maxWidth: "70%" },
  time: { fontSize: 12, color: "#94A3B8" },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: { fontSize: 14, flex: 1, marginRight: 10 },
  badge: {
    backgroundColor: "#6366F1",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "white", fontSize: 11, fontWeight: "bold" },
  emptyContainer: { flex: 1, marginTop: 100, alignItems: "center" },
  emptyText: { fontSize: 16, textAlign: "center" },
  // Guest Styles
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});

export default Conversation;
