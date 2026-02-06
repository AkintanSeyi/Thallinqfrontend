import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as api from "../../../api/index"; // Ensure this path is correct

const SendEmailOtpforgetpassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Logic: Handle Submit ---
  const handleSendCode = async () => {
    if (email.trim() === '') {
      Alert.alert("Input Required", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Call the backend API
      const response = await api.generateResetCode(email.trim().toLowerCase());
      
      if (response.status === 200) {
        Alert.alert("Success", "Reset code has been sent to your email.");
        
        // Navigate to the Verify screen and pass the email
        navigation.navigate("Verify", { email: email.trim().toLowerCase() });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to send reset code. Please try again.";
      Alert.alert("Error", errorMsg);
      console.error("Reset Code Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.inner}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address below. We will send you a 6-digit code to reset your password.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. name@example.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => setEmail(text)}
              editable={!loading} // Disable input while loading
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleSendCode}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate("SignIn")} 
            style={styles.backButton}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ... (Styles remain the same as your provided code)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 60, flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 40 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8, marginLeft: 4 },
  input: { 
    height: 55, backgroundColor: '#F5F7FA', borderRadius: 12, 
    paddingHorizontal: 16, fontSize: 16, color: '#000', borderWidth: 1, borderColor: '#E1E8ED' 
  },
  button: { 
    backgroundColor: '#000', height: 55, borderRadius: 12, justifyContent: 'center', 
    alignItems: 'center', marginTop: 10, elevation: 3 
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  backButton: { marginTop: 25, alignSelf: 'center' },
  backButtonText: { color: '#666', fontSize: 15, fontWeight: '500' },
});

export default SendEmailOtpforgetpassword;