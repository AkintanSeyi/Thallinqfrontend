import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { io } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker'; // Required: npx expo install expo-image-picker
import * as api from '../../../../api/index';

const SOCKET_URL = "https://tlbackend.onrender.com"; 

const Messages = ({ route, navigation }) => {
  const { conversationId, currentUserId, name } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null); // For previewing before send
  const [isSending, setIsSending] = useState(false);
  const socket = useRef(null);

 useEffect(() => {
  socket.current = io(SOCKET_URL);
  socket.current.emit("join_room", conversationId);
  fetchMessageHistory();

  // Listen for messages
  socket.current.on("receive_message", (newMessage) => {
    // Only add to list if it's from the other person
    if (newMessage.sender._id !== currentUserId) {
      setMessages((prev) => [newMessage, ...prev]);
    }
  });

  // --- ADD THIS FOR NOTIFICATIONS ---
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    const data = notification.request.content.data;
    // If the notification is for the chat I'm ALREADY in, don't show the alert
    if (data.type === 'chat' && data.conversationId === conversationId) {
      // Logic to perhaps "read" the message or just ignore the vibration
    }
  });

  return () => {
    if (socket.current) socket.current.disconnect();
    subscription.remove(); // Clean up the listener
  };
}, [conversationId]);

  const fetchMessageHistory = async () => {
    try {
      const response = await api.getMessages(conversationId);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

 const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    // FIX: Use the new array format to remove the Warning
    mediaTypes: ['images'], 
    allowsEditing: true,
    quality: 0.7,
  });

  if (!result.canceled) {
    setImagePreview(result.assets[0].uri);
  }
};

const handleSend = async () => {
  if (!inputText.trim() && !imagePreview) return;
  setIsSending(true);

  // 1. Create FormData
  const formData = new FormData();
  formData.append('conversationId', conversationId);
  formData.append('senderId', currentUserId);
  formData.append('text', inputText || ""); // Ensure no nulls
  formData.append('messageType', imagePreview ? 'image' : 'text');

  if (imagePreview) {
    const filename = imagePreview.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    
    // Format the file object exactly how Multer expects it
    formData.append('image', {
      uri: Platform.OS === 'ios' ? imagePreview.replace('file://', '') : imagePreview,
      name: filename,
      type: type,
    });
  }

  // 2. Optimistic UI (Instant update)
  const tempMsg = {
    _id: Date.now().toString(),
    text: inputText,
    fileUrl: imagePreview, 
    sender: { _id: currentUserId },
    createdAt: new Date(),
    messageType: imagePreview ? 'image' : 'text'
  };
  
  setMessages((prev) => [tempMsg, ...prev]);
  setInputText('');
  setImagePreview(null);

  try {
    // 3. Send to Backend
    await api.sendMessage(formData); 
  } catch (error) {
    // If you see Network Error here, check if your computer IP matches SOCKET_URL
    console.log("Full Error Detail:", error.message);
    if (error.response) {
      console.log("Server Error Data:", error.response.data);
    }
  } finally {
    setIsSending(false);
  }
};
  const renderMessage = ({ item }) => {
    const isMe = item.sender._id === currentUserId || item.sender === currentUserId;
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {item.messageType === 'image' ? (
            <Image source={{ uri: item.fileUrl }} style={styles.messageImage} />
          ) : null}
          {item.text ? (
            <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
              {item.text}
            </Text>
          ) : null}
        </View>
        <Text style={styles.timeText}>
           {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.topSafeArea} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{name || 'Chat'}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color="#007AFF" />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            inverted
          />
        )}

        {/* --- IMAGE PREVIEW SECTION --- */}
        {imagePreview && (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: imagePreview }} style={styles.imagePreviewBox} />
            <TouchableOpacity style={styles.closePreview} onPress={() => setImagePreview(null)}>
              <Ionicons name="close-circle" size={28} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            <Ionicons name="image" size={26} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            onPress={handleSend} 
            style={[styles.sendButton, (!inputText && !imagePreview) && { opacity: 0.5 }]}
            disabled={!inputText && !imagePreview || isSending}
          >
            {isSending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <SafeAreaView style={styles.bottomSafeArea} />
    </View>
  );
};

export default Messages;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF' },
  topSafeArea: { backgroundColor: '#FFF' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTextContainer: { marginLeft: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingVertical: 20 },
  messageWrapper: { marginVertical: 4, maxWidth: '80%' },
  myWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  myBubble: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#E5E7EB', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: '#FFF' },
  theirText: { color: '#1F2937' },
  messageImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 5, resizeMode: 'cover' },
  timeText: { fontSize: 10, color: '#9CA3AF', marginTop: 4, marginHorizontal: 4 },
  imagePreviewWrapper: { padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center' },
  imagePreviewBox: { width: 60, height: 60, borderRadius: 8 },
  closePreview: { position: 'absolute', top: 5, left: 65 },
  inputContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, fontSize: 15, maxHeight: 100, color: '#1F2937' },
  sendButton: { backgroundColor: '#007AFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bottomSafeArea: { backgroundColor: '#FFF' }
});