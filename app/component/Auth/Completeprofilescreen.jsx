import React, { useState , useEffect} from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, Image, ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import * as api from "../../../api/index"; // Ensure this path is correct


const CompleteProfileScreen = ({ route , setIsLoggedIn , isLoggedIn }) => {
  const navigation = useNavigation();
  
  // We need the user's email from the previous screen (SignUp) to identify them
  // If you aren't passing it via route, you'll need to get it from your global state/storage
  const { email } = route?.params || {}; 

  const [profileImage, setProfileImage] = useState(null);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const interestOptions = 
  
 [
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


  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // Reduced slightly for faster upload
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

 const handleFinish = async () => {
    // 1. Validation Checks
    if (!profileImage) {
      Alert.alert("Missing Info", "Please upload a profile photo.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Missing Info", "Please enter your phone number.");
      return;
    }
    if (!bio.trim()) {
      Alert.alert("Missing Info", "Please write a short bio.");
      return;
    }
    if (interests.length === 0) {
      Alert.alert("Missing Info", "Please select at least one interest.");
      return;
    }
    if (!isAgreed) {
      Alert.alert("Agreement Required", "Please accept the terms to continue.");
      return;
    }
    if (!email) {
      Alert.alert("Error", "User identification (email) is missing.");
      return;
    }

    setLoading(true);

    // 2. Prepare Multipart Form Data
    const formData = new FormData();
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('bio', bio);
    formData.append('isAgreed', isAgreed);
    formData.append('interests', JSON.stringify(interests)); 

    const filename = profileImage.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('profileImage', {
      uri: profileImage,
      name: filename || 'photo.jpg',
      type: type,
    });

    try {
      const response = await api.completeProfile(formData);
      
      if (response.data.success) {
        Alert.alert("Success", "Profile updated successfully!");
        navigation.navigate("OTP", { email: email }); 
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to update profile";
      Alert.alert("Upload Error", msg);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    if (!email) {
      Alert.alert("Error", "Session expired. Please sign up again.");
      navigation.navigate("SignUp");
    }
  }, [email]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Complete Your Profile</Text>

      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        <View style={styles.imagePlaceholder}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <Text style={styles.imageText}>Upload Photo</Text>
          )}
        </View>
      </TouchableOpacity>

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="+1 234 567 890"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Tell us about yourself..."
        multiline
        value={bio}
        onChangeText={setBio}
      />

      <Text style={styles.label}>Interests</Text>
      <View style={styles.interestContainer}>
        {interestOptions.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => toggleInterest(item)}
            style={[styles.chip, interests.includes(item) && styles.chipSelected]}
          >
            <Text style={interests.includes(item) ? styles.chipTextSelected : styles.chipText}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => setIsAgreed(!isAgreed)}
      >
        <View style={[styles.customCheck, isAgreed && styles.customCheckActive]}>
          {isAgreed && <Text style={{color: 'white', fontSize: 12}}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>I agree to the Terms and Conditions</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.blackButton} 
        onPress={handleFinish}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// ... (Styles remain the same as your provided code)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40, textAlign: 'center' },
  imageContainer: { alignSelf: 'center', marginBottom: 20 },
  imagePlaceholder: { 
    width: 110, height: 110, borderRadius: 55, backgroundColor: '#f0f0f0', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd',
    overflow: 'hidden' 
  },
  avatar: { width: '100%', height: '100%' },
  imageText: { fontSize: 12, color: '#888' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  bioInput: { height: 80, textAlignVertical: 'top' },
  interestContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#000', marginRight: 10, marginBottom: 10 },
  chipSelected: { backgroundColor: '#000' },
  chipText: { color: '#000' },
  chipTextSelected: { color: '#fff' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  customCheck: { width: 22, height: 22, borderWidth: 2, borderColor: '#000', borderRadius: 4, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  customCheckActive: { backgroundColor: '#000' },
  checkboxLabel: { fontSize: 14, color: '#666' },
  blackButton: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default CompleteProfileScreen;