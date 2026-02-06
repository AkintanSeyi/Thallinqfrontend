import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as api from "../../../api/index";
import AsyncStorage from '@react-native-async-storage/async-storage';

const OTP = ({ setIsLoggedIn , isLoggedIn }) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get email from the previous screen (CompleteProfile)
  const { email } = route.params || { email: 'user@example.com' };

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  // ✅ 1. Auto-send OTP when the page opens
  useEffect(() => {
    handleSendOTP();
  }, []);

  const handleSendOTP = async () => {
    try {
      setResending(true);
      const response = await api.sendOTP(email);
      if (response.data.success) {
        console.log("OTP Sent to:", email);
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send code");
    } finally {
      setResending(false);
    }
  };

  // ✅ 2. Handle OTP Verification
const handleVerifyOTP = async (finalOtp) => {
  const otpString = finalOtp || otp.join('');
  
  if (otpString.length < 6) {
    Alert.alert("Invalid", "Please enter the full 6-digit code");
    return;
  }

  setLoading(true);
  try {
    const response = await api.verifyOTP(email, otpString);
    
    // Check for success and the token
    if (response.data.token) {
      const { token } = response.data;
console.log(token , isLoggedIn)
     
      // 2. Save the new token
      await AsyncStorage.setItem('token', token);
      
      console.log("Token stored successfully" , isLoggedIn);

      // 3. Update the state passed from App.js
      // Wrapping this ensures the storage is 100% written before the UI swaps
      if (setIsLoggedIn) {
        setIsLoggedIn(true);
      } else {
        console.error("setIsLoggedIn prop missing - check your navigator!");
        // Backup: navigate to Login if state swap fails
        navigation.navigate("SignIn");
      }
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Invalid Code";
    Alert.alert("Verification Failed", errorMsg);
  } finally {
    setLoading(false);
  }
};

  const handleChange = (text, index) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    // Auto-focus next input
    if (cleanText && index < 5) {
      inputs.current[index + 1].focus();
    }

    // Auto-submit when last digit is entered
    if (newOtp.join('').length === 6) {
      Keyboard.dismiss();
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          We have sent a 6-digit verification code to your email{' '}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={[
                styles.input,
                { borderColor: otp[index] ? '#007AFF' : '#E0E0E0' }
              ]}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              value={digit}
              ref={(ref) => (inputs.current[index] = ref)}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.verifyButton, loading && { opacity: 0.7 }]}
          onPress={() => handleVerifyOTP()}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyButtonText}>Verify & Proceed</Text>}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleSendOTP} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.resendLink}>Resend</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, justifyContent: 'center' },
  content: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1B', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  emailText: { fontWeight: '600', color: '#1A1A1B' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  input: { 
    width: 48, height: 55, borderWidth: 1.5, borderRadius: 12, textAlign: 'center', 
    fontSize: 22, fontWeight: 'bold', color: '#000', backgroundColor: '#F9F9F9' 
  },
  verifyButton: { 
    backgroundColor: '#000', width: '100%', height: 55, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20 
  },
  verifyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resendContainer: { flexDirection: 'row', alignItems: 'center' },
  resendText: { color: '#666', fontSize: 14 },
  resendLink: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
});

export default OTP;