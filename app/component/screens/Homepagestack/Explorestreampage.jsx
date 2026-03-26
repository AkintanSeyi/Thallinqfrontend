import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, ActivityIndicator, 
  Image, TouchableOpacity, Alert 
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as api from "../../../../api/index";

const Explorestreampage = ({ route }) => {
  // SAFETY CHECK: Ensure params exist to prevent crash
  const { category, currentUserId } = route?.params || {};
  
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [streams, setStreams] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (category) {
      loadStreams(1);
    } else {
      console.warn("No category provided to Explorestreampage");
    }
  }, [category]);

  const loadStreams = async (pageNum) => {
    if (loading || !category) return;
    
    setLoading(true);
    try {
      const res = await api.getExploreStreams(category, pageNum);
      
      if (res.data && res.data.success) {
        setStreams(prev => pageNum === 1 ? res.data.groups : [...prev, ...res.data.groups]);
        setHasMore(res.data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinStream = async (groupId) => {
    try {
      const res = await api.joinGroupLive(groupId);
      if (res.data.success) {
        // Match the keys your backend returns: { token, uid, channelName }
        navigation.navigate('LiveStream', {
          groupId: groupId,
          currentUserId: currentUserId,
          token: res.data.token,
          channelName: res.data.channelName,
          uid: res.data.uid,
          role: 'audience' 
        });
      }
    } catch (err) {
      Alert.alert("Offline", "This stream has ended.");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card }]} 
      onPress={() => handleJoinStream(item._id)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.profilePicture }} style={styles.thumb} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={styles.members}>{item.memberCount || 0} members</Text>
      </View>
      <View style={styles.badge}><Text style={styles.badgeText}>LIVE</Text></View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{category || 'Explore'} Live</Text>
      </View>

      <FlatList
        data={streams}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        onEndReached={() => hasMore && !loading && loadStreams(page + 1)}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => loading && <ActivityIndicator color="#6366F1" style={{ marginVertical: 20 }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off-outline" size={50} color="#94A3B8" />
            <Text style={styles.emptyText}>No live {category} streams right now.</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 15 },
  backBtn: { marginRight: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  list: { paddingHorizontal: 20, paddingBottom: 50 },
  card: { flexDirection: 'row', padding: 12, borderRadius: 20, marginBottom: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  thumb: { width: 65, height: 65, borderRadius: 15, backgroundColor: '#e1e1e1' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 17, fontWeight: 'bold' },
  members: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  badge: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: 'white', fontSize: 11, fontWeight: '900' },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 16, marginTop: 10 }
});

export default Explorestreampage;