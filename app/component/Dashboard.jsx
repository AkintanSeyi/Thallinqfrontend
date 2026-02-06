import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StatusBar,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- AUTH HEADER COMPONENT --- 

const headerLogoStyles = StyleSheet.create({
  headerLogoContainer: {
    position: 'absolute',
    top: 0, 
    left: -20, 
    zIndex: 10,
    alignItems: 'flex-start', 
  },
  headerLogoImage: {
    width: 150, 
    height: 100, 
  },
});

const AuthHeader = () => (
  <View style={headerLogoStyles.headerLogoContainer}>
    <Image 
      source={{ uri: 'https://res.cloudinary.com/dvuq6vmiy/image/upload/v1767771541/1000002239-removebg-preview_mgilwd.png' }} 
      style={headerLogoStyles.headerLogoImage}
      resizeMode="contain"
    />
  </View>
);

const FEATURED_DATA = [
  { id: '1', title: 'Tech Hub', category: 'Technology', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600' },
  { id: '2', title: 'Social Life', category: 'Social', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600' },
  { id: '5', title: 'Pro Gamers', category: 'Gaming', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600' },
  { id: '7', title: 'Wanderlust', category: 'Travel', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600' },
  { id: '20', title: 'Otaku Zone', category: 'Anime', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600' },
];

const TESTIMONIES = [
  { id: 't1', name: 'Sarah Jenkins', role: 'Product Designer', text: "I didn't just find a group; I found my co-founder. We connected over shared interests and launched our MVP three months later!", avatar: 'https://i.prafhgjhvatar.cc/150?u=sarauuh' },
  { id: 't2', name: 'David Chen', role: 'Software Engineer', text: "Moving to a new city was tough until I joined the Tech Hub. Now I have a solid circle of friends who share my passion for coding.", avatar: 'https://i.prathgjhvatar.cc/150?u=daiivid' },
  { id: 't3', name: 'Elena Rodriguez', role: 'Digital Nomad', text: "The Wanderlust group connected me with locals in Tokyo who showed me hidden gems I never would have found alone. Pure magic!", avatar: 'https://i.pravahjktar.cc/150?u=eleniia' }
];

const SocialPartyPlatform = () => {
  const navigation = useNavigation();

  const handleAuthRedirect = () => {
    navigation.navigate('SignIn');
  };

  const Header = () => (
    <View style={styles.header}>
      {/* Replaced Text with AuthHeader Logo */}
      <AuthHeader />
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={handleAuthRedirect}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>
        <Ionicons name="person-circle-outline" size={28} color="#FFF" style={{ marginLeft: 15 }} />
      </View>
    </View>
  );

  const FeaturedCard = ({ item }) => (
    <TouchableOpacity style={styles.featuredCard} onPress={handleAuthRedirect}>
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cardOverlay} />
      <View style={styles.cardTextContainer}>
        <Text style={styles.featuredCategory}>{item.category}</Text>
        <Text style={styles.featuredTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const TestimonyCard = ({ item }) => (
    <View style={styles.testimonyCard}>
      <Ionicons name="quote" size={24} color="#9333EA" style={{ marginBottom: 10 }} />
      <Text style={styles.testimonyText}>"{item.text}"</Text>
      <View style={styles.testimonyUserRow}>
        <Image source={{ uri: item.avatar }} style={styles.testimonyAvatar} />
        <View>
          <Text style={styles.testimonyName}>{item.name}</Text>
          <Text style={styles.testimonyRole}>{item.role}</Text>
        </View>
      </View>
    </View>
  );

  const ContactsFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.footerLogo}>CONNECT</Text>
      <Text style={styles.footerTagline}>Building the future of social experiences.</Text>
      
      <View style={styles.contactInfo}>
        <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:support@connectapp.com')}>
          <Ionicons name="mail-outline" size={20} color="#9333EA" />
          <Text style={styles.contactText}>support@Thalinq.com</Text>
        </TouchableOpacity>
        
        <View style={styles.contactItem}>
          <Ionicons name="location-outline" size={20} color="#9333EA" />
          <Text style={styles.contactText}>San Francisco, CA</Text>
        </View>
      </View>

    

      <Text style={styles.copyright}>© 2025 Connect App. All rights reserved.</Text>
    </View>
  );

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0B0C1B', '#220033', '#000000']} style={styles.backgroundGradient} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.heroSection}>
          <Text style={styles.joinPartyTitle}>FIND YOUR VIBE</Text>
          <Text style={styles.joinPartySubtitle}>Meet up, join groups, and share your experiences</Text>
          <TouchableOpacity style={styles.mainCtaButton} onPress={handleAuthRedirect}>
            <Text style={styles.mainCtaButtonText}>Get Started</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHTOTysHxkqUZSCbZ8_ZBLE7CKW49G-Si7SQ&s' }}
            style={styles.centeredPromoImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Featured Experiences</Text>
          <FlatList
            data={FEATURED_DATA}
            renderItem={FeaturedCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListPadding}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Member Stories</Text>
          <FlatList
            data={TESTIMONIES}
            renderItem={TestimonyCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.8 + 20}
            decelerationRate="fast"
            contentContainerStyle={styles.horizontalListPadding}
          />
        </View>

        <View style={styles.finalCtaContainer}>
          <Text style={styles.finalCtaTitle}>Ready to Connect?</Text>
          <TouchableOpacity style={styles.mainCtaButton} onPress={handleAuthRedirect}>
            <Text style={styles.mainCtaButtonText}>Sign Up Now</Text>
          </TouchableOpacity>
        </View>

        <ContactsFooter />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1, backgroundColor: '#000' },
  backgroundGradient: { ...StyleSheet.absoluteFillObject },
  scrollContent: { paddingBottom: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', // Pushes Nav to the right since logo is absolute left
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    height: 100 
  },
  headerNav: { flexDirection: 'row', alignItems: 'center' },
  loginText: { color: '#FFF', fontWeight: '600' },
  heroSection: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  joinPartyTitle: { color: '#FFF', fontSize: 38, fontWeight: '900', textAlign: 'center' },
  joinPartySubtitle: { color: '#D1D5DB', fontSize: 16, textAlign: 'center', marginVertical: 15 },
  mainCtaButton: { backgroundColor: '#9333EA', paddingHorizontal: 35, paddingVertical: 15, borderRadius: 30, marginTop: 10 },
  mainCtaButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  centeredPromoImage: { width: width - 40, height: 220, borderRadius: 20, marginTop: 40 },
  section: { marginTop: 40 },
  sectionHeader: { color: '#FFF', fontSize: 22, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 15 },
  horizontalListPadding: { paddingHorizontal: 10 },
  featuredCard: { width: width * 0.65, height: 300, marginHorizontal: 10, borderRadius: 20, overflow: 'hidden' },
  featuredImage: { width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject },
  cardTextContainer: { position: 'absolute', bottom: 20, left: 20 },
  featuredCategory: { color: '#A855F7', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12 },
  featuredTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  testimonyCard: { width: width * 0.8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginHorizontal: 10 },
  testimonyText: { color: '#E5E7EB', fontSize: 15, fontStyle: 'italic', marginBottom: 20 },
  testimonyUserRow: { flexDirection: 'row', alignItems: 'center' },
  testimonyAvatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12 },
  testimonyName: { color: '#FFF', fontWeight: 'bold' },
  testimonyRole: { color: '#9CA3AF', fontSize: 12 },
  finalCtaContainer: { marginTop: 60, padding: 40, alignItems: 'center' },
  finalCtaTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  
  // Footer Styles
  footerContainer: { padding: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  footerLogo: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 3, marginBottom: 10 },
  footerTagline: { color: '#9CA3AF', fontSize: 14, marginBottom: 30, textAlign: 'center' },
  contactInfo: { width: '100%', marginBottom: 30 },
  contactItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  contactText: { color: '#D1D5DB', marginLeft: 10, fontSize: 14 },
  socialRow: { flexDirection: 'row', marginBottom: 30 },
  socialIcon: { marginHorizontal: 15, backgroundColor: 'rgba(147, 51, 234, 0.2)', padding: 10, borderRadius: 50 },
  copyright: { color: '#4B5563', fontSize: 12 },
});

export default SocialPartyPlatform;