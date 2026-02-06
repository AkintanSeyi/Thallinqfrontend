import React, { useState, useEffect, useCallback } from 'react';
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
  Alert
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Path
import * as api from "../../../../api/index";

const { width } = Dimensions.get('window');

// Static Data for the Horizontal Scroll
const FEATURED_DATA = [
  { id: '1', title: 'Tech Hub', category: 'Technology', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600' },
  { id: '2', title: 'Social Life', category: 'Social', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600' },
  { id: '3', title: 'Fit Club', category: 'Fitness', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600' },
  { id: '4', title: 'Study Group', category: 'Education', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600' },
  { id: '5', title: 'Pro Gamers', category: 'Gaming', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600' },
  { id: '6', title: 'Music Jam', category: 'Music', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600' },
  { id: '7', title: 'Wanderlust', category: 'Travel', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600' },
  { id: '8', title: 'House Party', category: 'Party', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600' },
  { id: '9', title: 'City Lights', category: 'Nightlife', image: 'https://images.unsplash.com/photo-1514525253361-bee8718a300c?auto=format&fit=crop&w=600' },
  { id: '10', title: 'Foodie Squad', category: 'Food & Drink', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600' },
  { id: '11', title: 'Game Day', category: 'Sports', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=600' },
  { id: '12', title: 'Creative Mind', category: 'Art & Design', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600' },
  { id: '13', title: 'Lens Masters', category: 'Photography', image: 'https://images.unsplash.com/photo-1452784444945-3f422708fe5e?auto=format&fit=crop&w=600' },
  { id: '14', title: 'Startups', category: 'Business', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600' },
  { id: '15', title: 'Trendsetters', category: 'Fashion', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600' },
  { id: '16', title: 'Cinema Club', category: 'Movies', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600' },
  { id: '17', title: 'Wild Trails', category: 'Outdoors', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600' },
  { id: '18', title: 'Zen Space', category: 'Wellness', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600' },
  { id: '19', title: 'Paws & Play', category: 'Pets', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=600' },
  { id: '20', title: 'Otaku Zone', category: 'Anime', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600' },
];

export default function HomePage({ setIsLoggedIn }) {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  
  // --- STATE ---
  const [userInterests, setUserInterests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // --- FILTERING LOGIC ---
  // Filter FEATURED_DATA based on the interests we got from the DB
  const filteredFeatured = FEATURED_DATA.filter(item => 
    userInterests.includes(item.category)
  );

  // If the user has picked interests, show only those. Otherwise, show everything.
  const displayData = filteredFeatured.length > 0 ? filteredFeatured : FEATURED_DATA;

  // --- FETCH LOGIC ---
  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const response = await api.getUserProfile(decoded.email);
        if (response.data.success) {
          setUserName(response.data.user.name);
          // Set user interests from MongoDB (the array of strings)
          setUserInterests(response.data.user.interests || []); 
        }
      }
    } catch (error) {
      console.error("Profile Fetch Error:", error);
    }
  };

  const fetchGroups = async (isRefreshingAction = false) => {
    if (isRefreshingAction) setRefreshing(true);
    try {
      const response = await api.getLatestGroups();
      if (response.data.success) {
        setGroups(response.data.groups);
      }
    } catch (error) {
      console.error("Fetch Groups Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchUserProfile(), fetchGroups()]);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchUserProfile(), fetchGroups(true)]).finally(() => {
      setRefreshing(false);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              await AsyncStorage.clear(); 
              if (setIsLoggedIn) setIsLoggedIn(false);
            } catch (error) {
              console.error("Logout Error:", error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // --- RENDER PIECES ---
  const FeaturedCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredCard} 
      activeOpacity={0.9}
      onPress={() => {
        navigation.navigate('Groups', { 
          screen: 'Groups', 
          params: { selectedCategory: item.category } 
        });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <View style={styles.cardOverlay}>
        <Text style={styles.featuredCategory}>{item.category}</Text>
        <Text style={styles.featuredTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.verticalCard, 
        { 
          backgroundColor: colors.card, 
          borderColor: dark ? '#334155' : '#F1F5F9',
          borderWidth: 1 
        }
      ]} 
      onPress={() => navigation.navigate('GroupDetail', { id: item._id })}
    >
      <Image 
        source={{ uri: item.profilePicture || 'https://via.placeholder.com/400/200' }} 
        style={styles.groupImage} 
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
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
        <Text 
          numberOfLines={2} 
          style={[styles.groupDescription, { color: dark ? '#9CA3AF' : '#6B7280' }]}
        >
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      
      <View style={[styles.iceHeader, { backgroundColor: colors.card }]}>
        <View style={styles.topNav}>
          <View>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              {userName || "User"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.iconBtn, { backgroundColor: dark ? '#1E2937' : '#F1F5F9' }]} 
              onPress={() => navigation.navigate('Notification')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconBtn, { marginLeft: 10, backgroundColor: dark ? '#1E2937' : '#F1F5F9' }]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
          ListHeaderComponent={
            <>
              <View style={styles.featuredSection}>
                <Text style={[styles.sectionHeaderLabel, { color: colors.text }]}>
                  {filteredFeatured.length > 0 ? "Picked For You" : "Explore Categories"}
                </Text>
                <FlatList
                  data={displayData} 
                  renderItem={FeaturedCard}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                />
              </View>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Groups</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
                  <Text style={[styles.seeMore, { color: dark ? '#818CF8' : '#6366F1' }]}>View All</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No groups found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  iceHeader: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeLabel: { fontSize: 14, color: '#94A3B8' },
  welcomeText: { fontSize: 20, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row' },
  iconBtn: { padding: 10, borderRadius: 12 },
  notifDot: { position: 'absolute', right: 12, top: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { paddingBottom: 30 },
  featuredSection: { marginTop: 20 },
  sectionHeaderLabel: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15 },
  featuredList: { paddingHorizontal: 15 },
  featuredCard: { width: width * 0.75, height: 180, marginHorizontal: 8, borderRadius: 24, overflow: 'hidden' },
  featuredImage: { width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', padding: 20, justifyContent: 'flex-end' },
  featuredCategory: { color: '#FFF', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  featuredTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  seeMore: { fontWeight: '600' },
  verticalCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, overflow: 'hidden' },
  groupImage: { width: '100%', height: 160 },
  cardContent: { padding: 15 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupName: { fontSize: 17, fontWeight: 'bold', flex: 1, marginRight: 10 },
  groupCategory: { fontSize: 13, fontWeight: '600' },
  groupDescription: { fontSize: 14, lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});