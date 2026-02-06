import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  Alert, StatusBar, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../../api/index"; 

const BlockedUsers = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const [blockedList, setBlockedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const response = await api.getBlockedUsers(decoded.email);
        if (response.data.success) {
          setBlockedList(response.data.blockedUsers);
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = (user) => {
    Alert.alert(
      "Unblock User",
      `Unblock ${user.name}? They will be able to interact with you again.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unblock", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const decoded = jwtDecode(token);
              
              // Call API to remove from blockedUsers array
             // Inside BlockedUsers.js -> handleUnblock
const response = await api.unblockUser({
  currentUserId: decoded.userId || decoded.id, // Use the ID from token
  blockUserId: user._id                        // The ID of the person to unblock
});

              if (response.data.success) {
                // Remove from local UI state
                setBlockedList(prev => prev.filter(item => item._id !== user._id));
              }
            } catch (error) {
              Alert.alert("Error", "Could not unblock user.");
            }
          }, 
          style: "destructive" 
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={[styles.userCard, { backgroundColor: colors.card }]}>
      <View style={styles.userInfo}>
        <Image 
          source={{ uri: item.profileImage || 'https://via.placeholder.com/150' }} 
          style={styles.avatar} 
        />
        <View>
          <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.userHandle, { color: dark ? '#94A3B8' : '#6B7280' }]}>{item.email}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.unblockButton, { borderColor: dark ? '#374151' : '#E5E7EB' }]} 
        onPress={() => handleUnblock(item)}
      >
        <Text style={[styles.unblockText, { color: colors.text }]}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator style={{flex: 1}} size="large" />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={blockedList}
        keyExtractor={(item) => item._id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={[styles.description, { color: dark ? '#94A3B8' : '#6B7280' }]}>
            Blocked users cannot find your profile or message you.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={60} color={dark ? '#374151' : '#D1D5DB'} />
            <Text style={[styles.emptyText, { color: dark ? '#4B5563' : '#94A3B8' }]}>No blocked users yet.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userHandle: {
    fontSize: 14,
  },
  unblockButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
  },
});

export default BlockedUsers;