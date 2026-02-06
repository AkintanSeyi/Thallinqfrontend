import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, Image, StatusBar, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useRoute, useNavigation, useTheme, useFocusEffect } from '@react-navigation/native';
import * as api from "../../../api/index"; 

const CATEGORIES = [
  "All",
  'Technology', 
  'Social', 
  'Fitness', 
  'Education', 
  'Gaming', 
  'Music', 
  'Travel',
  'Party',         // New: For events and gatherings
  'Nightlife',     // New: Clubs and bars
  'Food & Drink',  // New: Foodies and cooking
  'Sports',        // New: Football, Basketball, etc.
  'Art & Design',  // New: Creative groups
  'Photography',   // New: Visual arts
  'Business',      // New: Networking and startups
  'Fashion',       // New: Style and trends
  'Movies',        // New: Film buffs
  'Outdoors',      // New: Hiking and camping
  'Wellness',      // New: Yoga and mental health
  'Pets',          // New: Animal lovers
  'Anime'          // New: Otaku culture
];

const Groups = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  // --- STATE --- 
  const [activeCategory, setActiveCategory] = useState('All');
  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- 1. THE MAIN FETCH FUNCTION ---
  const fetchGroups = async (pageNum, isNewSearch = false, categoryToUse = activeCategory) => {
    if (loading) return;
    
    if (isNewSearch) {
      setIsInitialLoading(true);
      setGroups([]); // 🔥 CLEAR PREVIOUS DATA to prevent key conflicts
    }
    setLoading(true);

    try {
      const response = await api.getGroups(pageNum, categoryToUse, searchQuery);
      const fetchedGroups = response.data.groups;

      setGroups(prev => {
        if (isNewSearch) return fetchedGroups;
        
        // Prevent accidental duplicates from appending
        const newGroups = fetchedGroups.filter(
          fg => !prev.some(pg => pg._id === fg._id)
        );
        return [...prev, ...newGroups];
      });

      setHasMore(pageNum < response.data.totalPages);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

 
  // --- 1. REPLACE your existing useFocusEffect and useEffects with this single logic ---

useFocusEffect(
  useCallback(() => {
    const categoryFromParams = route.params?.selectedCategory;

    if (categoryFromParams) {
      // SCENARIO A: Navigated from Home with a category
      setActiveCategory(categoryFromParams);
      setSearchQuery('');
      setPage(1);
      fetchGroups(1, true, categoryFromParams);
      
      // Clear params so it doesn't re-trigger
      navigation.setParams({ selectedCategory: undefined });
    } else if (groups.length === 0) {
      // SCENARIO B: Direct Tab Press & no data yet
      // This ensures the page actually loads data on first visit
      fetchGroups(1, true, activeCategory);
    } else {
      // SCENARIO C: Returning to the tab, data already exists
      setIsInitialLoading(false); 
    }
  }, [route.params?.selectedCategory])
);

// --- 2. UPDATE your Search useEffect ---
// Remove 'isInitialLoading' check here so search actually works
useEffect(() => {
  // Only search if the component is mounted and not currently doing the focus-fetch
  const delayDebounce = setTimeout(() => {
    if (!isInitialLoading) {
      setPage(1);
      fetchGroups(1, true, activeCategory);
    }
  }, 500);

  return () => clearTimeout(delayDebounce);
}, [searchQuery, activeCategory]);

  // Add this inside your Groups component
useEffect(() => {
  if (route.params?.selectedCategory) {
    const incomingCategory = route.params.selectedCategory;
    
    console.log("NAVIGATED FROM HOME WITH:", incomingCategory);
    
    // 1. Update the UI pill
    setActiveCategory(incomingCategory);
    
    // 2. Reset the list and fetch new data
    setPage(1);
    fetchGroups(1, true, incomingCategory); // Pass category directly to avoid state delay

    // 3. Clear the params so it doesn't stay stuck on this category
    navigation.setParams({ selectedCategory: undefined });
  }
}, [route.params?.selectedCategory]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !isInitialLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGroups(nextPage);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    fetchGroups(1, true);
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity  
      onPress={() => navigation.navigate("GroupDetail", { id: item._id })} 
      style={[styles.verticalCard, { backgroundColor: colors.card }]}
    >
      <Image source={{ uri: item.profilePicture }} style={styles.groupImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="people" size={14} color={dark ? '#818CF8' : '#4F46E5'} />
            <Text style={{ marginLeft: 4, fontWeight: 'bold', color: dark ? '#818CF8' : '#4F46E5' }}>
              {item.memberCount || 1}
            </Text>
          </View>
        </View>
        <Text style={[styles.groupCategory, { color: colors.primary, marginBottom: 4 }]}>
          {item.category}
        </Text>
        <Text numberOfLines={2} style={[styles.groupDescription, { color: dark ? '#9CA3AF' : '#6B7280' }]}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <FlatList
        data={groups}
        keyExtractor={(item, index) => item._id || index.toString()} // Ensure unique keys
        renderItem={renderGroupItem}
        contentContainerStyle={styles.listPadding}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ListHeaderComponent={
          <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Explore Groups</Text>
            <View style={styles.searchSection}>
              <TextInput
                placeholder="Search groups..." 
                placeholderTextColor={dark ? "#6B7280" : "#94A3B8"} 
                style={[styles.searchInput, { backgroundColor: dark ? '#1F2937' : '#F3F4F6', color: colors.text }]}        
                value={searchQuery}              
                onChangeText={setSearchQuery}    
              />                                              
            </View>
            <View style={styles.filterWrapper}>
              <FlatList
                data={CATEGORIES}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setActiveCategory(item)}
                    style={[
                      styles.filterPill,
                      { backgroundColor: dark ? '#374151' : '#E5E7EB' },
                      activeCategory === item && (dark ? styles.activePillDark : styles.activePillLight)
                    ]}
                  >
                    <Text style={[styles.pillText, activeCategory === item && styles.activePillText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          isInitialLoading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={dark ? '#6366F1' : '#0B0C1B'} />
              <Text style={{ marginTop: 10, color: dark ? '#9CA3AF' : '#6B7280' }}>Fetching groups...</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No groups found.</Text>
          )
        }
        ListFooterComponent={
          loading && !isInitialLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ margin: 20 }} />
          ) : null
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: dark ? '#6366F1' : '#0B0C1B' }]}
        onPress={() => navigation.navigate("CreateGroup")}
      >
        <Ionicons name="add" size={35} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingTop: 60, 
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
  },
  filterWrapper: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activePillLight: { backgroundColor: "#0B0C1B" },
  activePillDark: { backgroundColor: "#6366F1" },
  pillText: { 
    color: '#6B7280', 
    fontWeight: '600' 
  },
  activePillText: { color: '#fff' },
  listPadding: { paddingBottom: 100 }, 
  verticalCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  groupImage: { width: '100%', height: 160 },
  cardContent: { padding: 15 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupName: { fontSize: 18, fontWeight: 'bold' },
  groupCategory: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  groupDescription: { fontSize: 14, lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' },
  centerLoader: {
    marginTop: 100, // Adjust this to center it perfectly on your screen
    alignItems: 'center',
    justifyContent: 'center'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});

export default Groups;