import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  StatusBar,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../api/index";

const Notification = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const decoded = jwtDecode(token);
      const userId = decoded.userId || decoded.id;

      const res = await api.getUserNotifications(userId);
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notiCard, 
        { backgroundColor: colors.card }, 
        !item.isRead && [styles.unreadCard, { borderLeftColor: dark ? '#818CF8' : '#0B0C1B' }]
      ]}
      onPress={() => {
        // Navigation disabled for all items
      }}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconCircle, 
        { backgroundColor: !item.isRead ? (dark ? '#312E81' : '#0B0C1B') : (dark ? '#374151' : '#E5E7EB') }
      ]}>
        <Ionicons 
          name={item.type === 'new_post' ? 'create-outline' : item.type === 'comment' ? 'chatbubble-outline' : 'notifications-outline'} 
          size={20} 
          color={!item.isRead ? '#fff' : (dark ? '#94A3B8' : '#6B7280')} 
        />
      </View>
      <View style={styles.notiContent}>
        <View style={styles.notiHeader}>
          <Text style={[styles.notiTitle, { color: colors.text }]}>
             {item.type === 'new_post' ? 'New Post' : 'Activity'}
          </Text>
          <Text style={styles.notiTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.notiMessage, { color: dark ? '#94A3B8' : '#6B7280' }]} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: dark ? '#818CF8' : '#0B0C1B' }]} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backButton, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: '#94A3B8' }]}>No notifications yet.</Text>
          }
          ListHeaderComponent={
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSpacer: { width: 40 },
  listContent: { paddingBottom: 30 },
  settingsSection: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  notiCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  unreadCard: { borderLeftWidth: 4 },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notiContent: { flex: 1 },
  notiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notiTitle: { fontSize: 14, fontWeight: 'bold' },
  notiTime: { fontSize: 12, color: '#94A3B8' },
  notiMessage: { fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 14 }
});

export default Notification;