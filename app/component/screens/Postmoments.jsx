import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, Image, ActivityIndicator, Platform 
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from "../../../api/index";

const FEELINGS = [
  { name: 'Happy', emoji: '😊' }, { name: 'Excited', emoji: '🤩' },
  { name: 'Chilling', emoji: '😎' }, { name: 'Loved', emoji: '🥰' },
  { name: 'Blessed', emoji: '😇' }, { name: 'Productive', emoji: '💪' },
  { name: 'Tired', emoji: '😴' }, { name: 'Sad', emoji: '😢' }
];

const Postmoments = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUserId(decoded.userId || decoded.id);
      }
    };
    fetchUser();
  }, []);

const pickMedia = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All, // Correct: allows video + image
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled) {
    const asset = result.assets[0];
    setImage(asset.uri);
    // asset.type will be 'image' or 'video'
    setMediaType(asset.type); 
  }
};

 const handlePublish = async () => {
  if (!image || !userId) return Alert.alert("Error", "Please select a file to share");

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("author", userId);
    formData.append("caption", caption);
    
    // Pass mediaType to the backend ('image' or 'video')
    // Ensure you have a mediaType state variable from your picker
    formData.append("mediaType", mediaType || 'image');

    if (selectedFeeling) {
      formData.append("feelingName", selectedFeeling.name);
      formData.append("feelingEmoji", selectedFeeling.emoji);
    }

    const filename = image.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : (mediaType === 'video' ? 'mp4' : 'jpg');
    
    // Determine the correct MIME type
    const type = mediaType === 'video' ? `video/${ext}` : `image/${ext}`;

    formData.append("image", { // Keep key as "image" to match your Multer config
      uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
      name: filename || `moment_${Date.now()}.${ext}`,
      type: type,
    });

    const response = await api.createMoment(formData);

    if (response.data.success) {
      setCaption('');
      setImage(null);
      setSelectedFeeling(null);
      // If you added setMediaType state, reset it here
      // setMediaType(null); 

      Alert.alert("Success", "Moment shared!");
      navigation.goBack();
    }
  } catch (error) {
    console.error("Post Moment Error:", error);
    Alert.alert("Error", "Failed to post moment. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Moment</Text>
        <TouchableOpacity onPress={handlePublish} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <Text style={styles.postBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ENHANCED CAMERA/IMAGE SECTION */}
      <View style={styles.imageContainer}>
        <TouchableOpacity 
          style={[
            styles.imageBox, 
            !image && styles.imageBoxEmpty,
            { borderColor: dark ? '#334155' : '#CBD5E1' }
          ]} 
          onPress={pickMedia}
          activeOpacity={0.8}
        >
        {image ? (
  <>
    {/* Conditional rendering to handle video previews */}
    {mediaType === 'video' ? (
      <View style={[styles.fullImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="play-circle" size={48} color="#FFF" />
        <Text style={{ color: '#FFF', marginTop: 8, fontSize: 12 }}>Video Selected</Text>
      </View>
    ) : (
      <Image source={{ uri: image }} style={styles.fullImage} />
    )}

    <View style={styles.editOverlay}>
      <Ionicons name="camera" size={18} color="#FFF" />
      <Text style={styles.editText}>Change</Text>
    </View>
  </>
) : (
  /* Your original placeholder remains untouched */
  <View style={styles.placeholderContainer}>
    <View style={styles.iconCircle}>
      <Ionicons name="camera-outline" size={32} color="#6366F1" />
    </View>
    <Text style={styles.placeholderText}>Tap to select a file</Text>
    <Text style={styles.placeholderSubText}>Square file look best</Text>
  </View>
)}
        </TouchableOpacity>
      </View>

      {/* INPUT SECTION */}
      <View style={styles.inputSection}>
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor="#94A3B8"
          style={[styles.input, { color: colors.text }]}
          multiline
          value={caption}
          onChangeText={setCaption}
          autoCapitalize="none"
        />
      </View>

      {/* FEELINGS SECTION */}
      <Text style={[styles.label, { color: colors.text, paddingHorizontal: 20 }]}>
        How are you feeling?
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.feelingScroll}>
        {FEELINGS.map((f) => (
          <TouchableOpacity 
            key={f.name} 
            style={[
              styles.feelingPill, 
              selectedFeeling?.name === f.name && styles.activePill
            ]}
            onPress={() => setSelectedFeeling(selectedFeeling?.name === f.name ? null : f)}
          >
            <Text style={{ 
                color: selectedFeeling?.name === f.name ? '#fff' : (dark ? '#CBD5E1' : '#1E293B'),
                fontWeight: selectedFeeling?.name === f.name ? 'bold' : 'normal'
            }}>
                {f.emoji} {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* BOTTOM SPACING */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center' 
  },
  title: { fontSize: 18, fontWeight: '700' },
  postBtnText: { color: '#6366F1', fontWeight: 'bold', fontSize: 16 },
  
  // IMAGE BOX STYLES
  imageContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  imageBox: { 
    height: 350, 
    width: '100%', 
    backgroundColor: '#1E2035', 
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  imageBoxEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(30, 32, 53, 0.5)',
  },
  fullImage: { width: '100%', height: '100%' },
  placeholderContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderSubText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: 'bold',
  },

  // OTHER STYLES
  input: { padding: 20, fontSize: 16, minHeight: 100 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 10 },
  feelingScroll: { paddingLeft: 20, marginTop: 10 },
  feelingPill: { 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#E5E7EB', 
    marginRight: 10, 
    height: 40, 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  activePill: { 
    backgroundColor: '#6366F1',
    borderColor: '#FFF'
  }
});

export default Postmoments;