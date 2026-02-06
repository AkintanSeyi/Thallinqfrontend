import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation, useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../api/index"; // Ensure path is correct

const Conversation = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // 1. Load User ID and Conversations
  const loadInbox = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const myId = decoded.userId || decoded.id;
        setCurrentUserId(myId);

        // Fetch using your api format
        const response = await api.getConversations(myId);
        // Backend returns "participants", so we ensure data is handled correctly
        setConversations(response.data);
      }
    } catch (error) {
      console.error("Inbox Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Refresh inbox when user focuses this screen
  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, [])
  );

  // 3. Helper to format message time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time (e.g., 10:30 AM)
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If yesterday or older, show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }) => {
    // FIX: Changed "item.members" to "item.participants" to match backend logs
    const otherUser = item.participants?.find(m => m._id !== currentUserId);

    return (
      <TouchableOpacity 
        style={[styles.chatItem, { borderBottomColor: dark ? '#1E293B' : '#F3F4F6' }]}
        onPress={() => navigation.navigate('Message', {
            conversationId: item._id,
            currentUserId: currentUserId,
            name: otherUser?.name
        })}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: otherUser?.profileImage || 'https://via.placeholder.com/150' }} 
            style={[styles.avatar, { backgroundColor: dark ? '#334155' : '#E5E7EB' }]} 
          />
          {/* Green dot placeholder for online status */}
          {/* <View style={styles.onlineDot} /> */}
        </View>
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {/* This now correctly picks 'Akintan Se' or 'Fola' */}
              {otherUser?.name || 'Unknown User'}
            </Text>
            <Text style={styles.time}>{formatTime(item.updatedAt)}</Text>
          </View>
          
          <View className="flex flex-col">
            <View style={styles.messageRow}>
                <Text style={[styles.lastMessage, { color: dark ? '#94A3B8' : '#6B7280' }]} numberOfLines={1}>
                {item.lastMessage?.text || "Started a new conversation"}
                </Text>
                
                {/* Logic for unread badge */}
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: dark ? '#475569' : '#94A3B8' }]}>
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
  container: { 
    flex: 1 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    paddingTop: 60, 
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  pageTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    paddingHorizontal: 20 
  },
  listPadding: {
    paddingBottom: 100 // Extra space for bottom tabs
  },
  chatItem: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    alignItems: 'center'
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30 
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  content: { 
    flex: 1, 
    marginLeft: 15 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 4 
  },
  userName: { 
    fontSize: 17, 
    fontWeight: '700',
    maxWidth: '70%'
  },
  time: { 
    fontSize: 12, 
    color: '#94A3B8' 
  },
  messageRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  lastMessage: { 
    fontSize: 14, 
    flex: 1, 
    marginRight: 10 
  },
  badge: { 
    backgroundColor: '#6366F1',
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 6
  },
  badgeText: { 
    color: 'white', 
    fontSize: 11, 
    fontWeight: 'bold' 
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center'
  }
});

export default Conversation;