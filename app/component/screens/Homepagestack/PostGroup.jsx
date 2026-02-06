import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from "../../../../api/index";

const CATEGORIES = [
  'Technology', 'Social', 'Fitness', 'Education', 'Gaming', 
  'Music', 'Travel', 'Party', 'Nightlife', 'Food & Drink', 
  'Sports', 'Art & Design', 'Photography', 'Business', 
  'Fashion', 'Movies', 'Outdoors', 'Wellness', 'Pets', 'Anime'
];

const PostGroup = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  // Form States
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Social');
  
  // Logic: Always default to false for Free membership
  const [isPaid, setIsPaid] = useState(false); 
  const [price, setPrice] = useState(''); 
  const [image, setImage] = useState(null);
  
  // Logic States
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getCreatorFromToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          const extractedId = decoded.userId || decoded.id || decoded.sub;
          if (extractedId) {
            setUserId(String(extractedId)); 
          }
        }
      } catch (e) {
        console.error("Token decode error", e);
      }
    };
    getCreatorFromToken();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreateGroup = async () => {
    // Validation
    if (!groupName || !description || !image || !userId) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      formData.append("name", groupName);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("creator", userId);
      
      // LOGIC: These values ensure the backend creates a FREE group
      formData.append("price", "0"); 
      formData.append("isPrivate", "false");

      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("profilePicture", {
        uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
        name: filename || 'upload.jpg',
        type: type,
      });

      const response = await api.createGroup(formData);

      if (response.data.success) {
        Alert.alert("Success", "Group created successfully!");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Error", "Could not create group. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create Group</Text>
      </View>

      <View style={styles.form}>
        {/* Image Picker */}
        <TouchableOpacity 
          style={[styles.imageUpload, { backgroundColor: colors.card, borderColor: dark ? '#374151' : '#E5E7EB' }]} 
          onPress={pickImage}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera" size={40} color={dark ? '#9CA3AF' : '#6B7280'} />
              <Text style={{ color: dark ? '#9CA3AF' : '#6B7280', marginTop: 8 }}>Add Group Cover</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Group Name */}
        <Text style={[styles.label, { color: colors.text }]}>Group Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Name your group"
          placeholderTextColor={dark ? "#6B7280" : "#94A3B8"}
          value={groupName}
          onChangeText={setGroupName}
        />

        {/* Membership Type - SECTION HIDDEN FROM UI BUT LOGIC REMAINS */}
        {/* <Text style={[styles.label, { color: colors.text }]}>Membership Type</Text>
        <View style={styles.toggleContainer}>
          <View 
            style={[
                styles.typePill, 
                { backgroundColor: dark ? '#6366F1' : '#0B0C1B', borderColor: 'transparent', marginRight: 0 }
            ]}
          >
            <Text style={[styles.typeText, { color: '#fff' }]}>Free</Text>
          </View>
        </View>
        */}

        {/* Categories */}
        <Text style={[styles.label, { color: colors.text }]}>Category</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((item) => {
            const isSelected = category === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryPill,
                  { 
                    backgroundColor: isSelected ? (dark ? '#6366F1' : '#0B0C1B') : (dark ? '#374151' : '#E5E7EB'),
                    borderWidth: 1,
                    borderColor: isSelected ? (dark ? '#818CF8' : '#0B0C1B') : 'transparent',
                  }
                ]}
              >
                <Text style={{ color: isSelected ? '#fff' : (dark ? '#9CA3AF' : '#6B7280'), fontWeight: isSelected ? '700' : '400' }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* About */}
        <Text style={[styles.label, { color: colors.text }]}>About</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="What's the goal of this group?"
          placeholderTextColor={dark ? "#6B7280" : "#94A3B8"}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Submit Button */}
        <TouchableOpacity 
          disabled={loading}
          style={[styles.button, { backgroundColor: dark ? '#6366F1' : '#0B0C1B', opacity: loading ? 0.7 : 1 }]}
          onPress={handleCreateGroup}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Publish Group</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginLeft: 15 },
  form: { paddingHorizontal: 20 },
  imageUpload: {
    height: 180,
    width: '100%',
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 10
  },
  previewImage: { width: '100%', height: '100%' },
  uploadPlaceholder: { alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { padding: 15, borderRadius: 12, fontSize: 16 },
  toggleContainer: { flexDirection: 'row', marginBottom: 5 },
  typePill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
  },
  typeText: { fontSize: 15, fontWeight: '700' },
  priceInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    paddingHorizontal: 15 
  },
  currencySymbol: { fontSize: 18, fontWeight: 'bold', marginRight: 5 },
  priceInput: { flex: 1, paddingVertical: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  button: { marginTop: 30, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 50, height: 60, justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});

export default PostGroup;