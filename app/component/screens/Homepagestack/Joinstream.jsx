import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const CATEGORIES = [
  { name: 'Technology', icon: 'code-working', color: '#6366F1' },
  { name: 'Social', icon: 'people', color: '#EC4899' },
  { name: 'Fitness', icon: 'fitness', color: '#10B981' },
  { name: 'Gaming', icon: 'game-controller', color: '#F59E0B' },
  { name: 'Music', icon: 'musical-notes', color: '#8B5CF6' },
  { name: 'Education', icon: 'book', color: '#3B82F6' },
  { name: 'Nightlife', icon: 'moon', color: '#6B7280' },
  { name: 'Wellness', icon: 'leaf', color: '#06B6D4' },
];

const Joinstream = ({ currentUserId }) => { // Ensure you receive user ID if needed here
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const renderCategoryTile = ({ item }) => (
    <TouchableOpacity   
      activeOpacity={0.7}
      // CRITICAL: Ensure 'Explorestreampage' matches your Stack.Screen name exactly
      onPress={() => {
        console.log("Navigating to category:", item.name);
        navigation.navigate('Explorestreampage', { 
          category: item.name,
          currentUserId: currentUserId 
        });
      }}
      style={[styles.tile, { backgroundColor: dark ? '#1F2937' : '#FFFFFF' }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={[styles.tileText, { color: colors.text }]}>{item.name}</Text>
      <View style={styles.liveIndicatorRow}>
        <View style={styles.pulseDot} />
        <Text style={styles.liveCount}>Explore Live</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <FlatList
        data={CATEGORIES}
        renderItem={renderCategoryTile}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listPadding}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
                <Ionicons name="chevron-back" size={30} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text, marginBottom: 0 }]}>Explore</Text>
            </View>
            <Text style={styles.subtitle}>Choose a category to start watching</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { paddingHorizontal: 5, marginBottom: 25, marginTop: 20 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#94A3B8', marginTop: 5 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 20 },
  tile: { width: COLUMN_WIDTH, height: 160, borderRadius: 24, padding: 20, justifyContent: 'space-between', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
  iconCircle: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  tileText: { fontSize: 17, fontWeight: '700', marginTop: 10 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 6 },
  liveCount: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  streamItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' }
});

export default Joinstream;