import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../api/index";

const GroupsUserBelong = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchMyGroups(1, true); // Load first page on mount
  }, []);

  const fetchMyGroups = async (pageNum, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        // Call API with email and page number
        const response = await api.getMyMemberships(decoded.email, pageNum);
        
        if (response.data.success) {
          const newGroups = response.data.groups;
          
          // If we receive fewer than 10 groups, we know there are no more to load
          if (newGroups.length < 10) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          setGroups(prev => isInitial ? newGroups : [...prev, ...newGroups]);
          setPage(pageNum);
        }
      }
    } catch (error) {
      console.error("Error fetching memberships:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    // Only load more if not currently loading, and if there is more data
    if (!loadingMore && hasMore) {
      fetchMyGroups(page + 1);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.groupRow, 
        { 
          backgroundColor: colors.card, 
          borderColor: dark ? '#334155' : '#F1F5F9' 
        }
      ]}
      onPress={() => navigation.navigate('GroupDetail', { id: item._id })}
        
  
    >
      <Image 
        source={{ uri: item.profilePicture || 'https://via.placeholder.com/150' }} 
        style={styles.groupThumb} 
      />
      
      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.memberCount}>
          {item.memberCount || 0} members • {item.category || 'General'}
        </Text>
      </View>

      <View style={[styles.arrowCircle, { backgroundColor: dark ? '#1E2937' : '#F8FAFC' }]}>
        <Ionicons name="chevron-forward" size={18} color={dark ? '#818CF8' : '#6366F1'} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Your Memberships</Text>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item._id}
        // Removed scrollEnabled={false} because pagination requires scrolling
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3} // Load more when 30% from the bottom
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: '#94A3B8', textAlign: 'center' }}>
              You haven't joined any groups yet.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure the container takes full height for the list to scroll
    marginTop: 35,
    paddingHorizontal: 25,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  groupThumb: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 15,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  memberCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listPadding: {
    paddingBottom: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center'
  }
});

export default GroupsUserBelong;