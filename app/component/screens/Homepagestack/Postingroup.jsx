import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useTheme, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../../../../api/index'; 

const Postingroup = () => {
  const { colors, dark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();

  // Extract params passed from GroupDetail.js
  const { groupId, currentUserId } = route.params || {};

  const [content, setContent] = useState('');
  const [issubmitting, setIsSubmitting] = useState(false);

  const handlePost = async () => {
    // Basic validation
    if (!content.trim()) {
      Alert.alert("Wait", "Please write something before posting.");
      return;
    }

    if (!groupId || !currentUserId) {
      Alert.alert("Error", "Missing Group or User information. Please try again.");
      console.error("Missing Data:", { groupId, currentUserId });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createPost({ 
        groupId, 
        author: currentUserId, 
        content 
      });

      if (res.data.success) {
        Alert.alert("Success", "Your post is live!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      console.log("Post Error:", err.response?.data || err.message);
      Alert.alert("Post Failed", "Server error (500). Make sure the backend route is correct.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.centerWrapper}>
        
        {/* --- CENTERED POST BOX --- */}
        <View style={[styles.postBoxContainer, { backgroundColor: colors.card, borderColor: dark ? '#334155' : '#E2E8F0' }]}>
          <View style={styles.inputHeader}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.postAsText, { color: colors.text }]}> Create a new post</Text>
            <TouchableOpacity 
               style={{marginLeft: 'auto'}} 
               onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="What's on your mind?"
            placeholderTextColor="#94A3B8"
            style={[styles.textArea, { color: colors.text }]}
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            autoFocus={true}
          />

          <View style={[styles.divider, { backgroundColor: dark ? '#334155' : '#E2E8F0' }]} />

          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>{content.length} characters</Text>
            
            <TouchableOpacity 
              onPress={handlePost} 
              disabled={issubmitting || !content.trim()}
              style={[
                styles.publishBtn, 
                { backgroundColor: content.trim() ? '#6366F1' : '#94A3B8' }
              ]}
            >
              {issubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.publishBtnText}>Post to Group</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerWrapper: {
    flexGrow: 1,
    justifyContent: 'center', // This puts the box in the middle of the screen
    paddingHorizontal: 20,
  },
  postBoxContainer: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    // Shadow for depth
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  postAsText: { fontSize: 16, fontWeight: '700' },
  textArea: {
    fontSize: 18,
    minHeight: 150,
    paddingTop: 10,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  publishBtn: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
  },
  publishBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Postingroup;