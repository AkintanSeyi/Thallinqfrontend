import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, Image, ActivityIndicator, Platform 
} from 'react-native';
import { useNavigation, useTheme, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from "../../../../api/index";

const CATEGORIES = [
  'Technology', 'Social', 'Fitness', 'Education', 'Gaming', 'Music', 
  'Travel', 'Party', 'Nightlife', 'Food & Drink', 'Sports', 'Art & Design', 
  'Photography', 'Business', 'Fashion', 'Movies', 'Outdoors', 'Wellness', 'Pets', 'Anime'
];

const EditGroup = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params;
  const { colors, dark } = useTheme();

  // Form States
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  
  // Logic States
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 1. Get User ID
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUserId(decoded.id || decoded.userId);
      }

      // 2. Fetch current group details to fill inputs
      const response = await api.getGroupDetails(groupId);
      if (response.data.success) {
        const g = response.data.group;
        setGroupName(g.name);
        setDescription(g.description);
        setCategory(g.category);
        setExistingImage(g.profilePicture);
      }
    } catch (e) {
      console.error("Load error", e);
      Alert.alert("Error", "Failed to load group data");
    } finally {
      setFetching(false);
    }
  };

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

 const handleUpdateGroup = async () => {
  if (!groupName || !description || !userId) {
    Alert.alert("Error", "Name and Description are required");
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("description", description);
    formData.append("category", category);

    if (image) {
      const uri = Platform.OS === 'android' ? image : image.replace('file://', '');
      const filename = image.split('/').pop();
      
      // Infer type from extension or default to jpeg
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("profilePicture", {
        uri: uri,
        name: filename || 'group_photo.jpg',
        type: type,
      });
    }

    // IMPORTANT: console.log the groupId and userId to make sure they aren't undefined
    console.log("Sending to:", groupId, userId);

    const response = await api.updateGroup(groupId, userId, formData);

    if (response.data.success) {
      Alert.alert("Success", "Group updated successfully");
      navigation.goBack();
    }
  } catch (error) {
    // Better debugging for Network Error
    if (error.response) {
      console.log("Data:", error.response.data);
      console.log("Status:", error.response.status);
    } else {
      console.error("Network or Setup Error:", error.message);
    }
    Alert.alert("Error", "Network error: Could not reach server.");
  } finally {
    setLoading(false);
  }
};
  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Group</Text>
      </View>

      <View style={styles.form}>
        {/* Image Picker */}
        <TouchableOpacity 
          style={[styles.imageUpload, { backgroundColor: colors.card, borderColor: dark ? '#374151' : '#E5E7EB' }]} 
          onPress={pickImage}
        >
          {image || existingImage ? (
            <Image source={{ uri: image || existingImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera" size={40} color={dark ? '#9CA3AF' : '#6B7280'} />
              <Text style={{ color: dark ? '#9CA3AF' : '#6B7280', marginTop: 8 }}>Change Group Cover</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Group Name */}
        <Text style={[styles.label, { color: colors.text }]}>Group Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={groupName}
          onChangeText={setGroupName}
        />

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
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Save Button */}
        <TouchableOpacity 
          disabled={loading}
          style={[styles.button, { backgroundColor: dark ? '#6366F1' : '#0B0C1B', opacity: loading ? 0.7 : 1 }]}
          onPress={handleUpdateGroup}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
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
    height: 180, width: '100%', borderRadius: 15, borderWidth: 1, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20, marginTop: 10
  },
  previewImage: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  uploadPlaceholder: { alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { padding: 15, borderRadius: 12, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  button: { marginTop: 30, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 50, height: 60, justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});

export default EditGroup;