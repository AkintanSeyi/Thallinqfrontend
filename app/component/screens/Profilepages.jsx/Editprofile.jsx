import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, ScrollView, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../api/index"; 

const ALL_CATEGORIES = [
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

const EditProfile = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState([]);
  const [profileImage, setProfileImage] = useState(null); 
  const [selectedImage, setSelectedImage] = useState(null); 

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const response = await api.getUserProfile(decoded.email);
        const user = response.data.user;
        
        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone || "");
        setBio(user.bio || "");
        setInterests(user.interests || []);
        setProfileImage(user.profileImage);
      }
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. IMPROVED IMAGE PICKER
 const pickImage = async () => {
    try {
      // 1. Request Permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "We need your permission to open the gallery.");
        return;
      }

      // 2. Launch Picker with compatible syntax
      const result = await ImagePicker.launchImageLibraryAsync({
        // Using 'All' or 'Images' as a string is the most compatible way
        mediaTypes: 'images', 
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      console.log("Picker Result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri); 
        setSelectedImage(result.assets[0].uri); 
      }
    } catch (error) {
      console.error("Picker Error:", error);
      // Fallback: If 'images' string fails, try the old deprecated constant
      try {
        const fallbackResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
        if (!fallbackResult.canceled) {
          setProfileImage(fallbackResult.assets[0].uri);
          setSelectedImage(fallbackResult.assets[0].uri);
        }
      } catch (innerError) {
        Alert.alert("Error", "Could not open the image gallery.");
      }
    }
  };

  const toggleInterest = (cat) => {
    if (interests.includes(cat)) {
      setInterests(interests.filter(i => i !== cat));
    } else {
      setInterests([...interests, cat]);
    }
  };

  // 2. IMPROVED SAVE LOGIC
  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('name', name); 
      formData.append('phone', phone);
      formData.append('bio', bio);
      formData.append('interests', JSON.stringify(interests));

      if (selectedImage) {
        const uri = selectedImage;
        const filename = uri.split('/').pop();
        const type = `image/${filename.split('.').pop() || 'jpeg'}`;
        
        // Use a generic name if filename is weird
        const nameToUse = Platform.OS === 'ios' ? filename : `photo_${Date.now()}.jpg`;

        formData.append('profileImage', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: nameToUse,
          type: type,
        });
      }

      const response = await api.updateProfile(formData);
      
      if (response.data.success) {
        Alert.alert("Success", "Profile updated!");
        navigation.goBack();
      }
    } catch (error) {
      console.log("Full Error Object:", JSON.stringify(error, null, 2));
      Alert.alert("Upload Failed", "Check your internet or server connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{flex: 1}} />;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <View style={styles.form}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: profileImage || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuQWVd2N57kwCTsg0z5wCIdvXX5DRKu6w1RA&s" }} 
                style={[styles.avatar, { borderColor: colors.card }]} 
              />
              {/* Added hitslop to make the button easier to press */}
              <TouchableOpacity 
                onPress={pickImage} 
                style={styles.changePhotoButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: dark ? '#94A3B8' : '#6B7280' }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: dark ? '#94A3B8' : '#6B7280' }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: dark ? '#94A3B8' : '#6B7280' }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: dark ? '#94A3B8' : '#6B7280' }]}>Interests</Text>
            <View style={styles.interestsContainer}>
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = interests.includes(cat);
                return (
                  <TouchableOpacity 
                    key={cat} 
                    onPress={() => toggleInterest(cat)}
                    style={[
                      styles.interestPill, 
                      { backgroundColor: isSelected ? (dark ? '#6366F1' : '#0B0C1B') : (dark ? '#1F2937' : '#F3F4F6') }
                    ]}
                  >
                    <Text style={{ color: isSelected ? '#FFF' : (dark ? '#94A3B8' : '#64748B') }}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: dark ? '#6366F1' : '#0B0C1B' }]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3 },
  changePhotoButton: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: '#6366F1', width: 34, height: 34, 
    borderRadius: 17, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
    zIndex: 99,
    elevation: 5
  },
  form: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  textArea: { height: 80, paddingTop: 12 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestPill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  saveButton: { marginHorizontal: 20, marginVertical: 30, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditProfile;