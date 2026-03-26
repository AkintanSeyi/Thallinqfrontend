import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Keyboard, SafeAreaView, Alert, ActivityIndicator 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as api from "../../../api/index";

const VerifyFPotpADChnagepw = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { email } = route.params || { email: '' };

  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  
  // --- NEW STATE FOR VISIBILITY ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputs = useRef([]);

  useEffect(() => {
    if (email) {
      autoSendOTP();
    } else {
      Alert.alert("Error", "No email found. Please go back.", [
        { text: "Go Back", onPress: () => navigation.goBack() }
      ]);
    }
  }, []);

  const autoSendOTP = async () => {
    try {
      const response = await api.sendOTP(email);
      if (response.data.success) {
        console.log("OTP sent!");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Server Error (500)";
      console.error("Auto-send OTP error:", errorMsg);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.verifyOTP(email, code);
      if (response.data.success) {
        setIsVerified(true); 
      }
    } catch (error) {
      Alert.alert("Verification Failed", error.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwords.new || !passwords.confirm) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }
    if (passwords.new.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const code = otp.join('');
      await api.resetPassword(email, code, passwords.new);
      Alert.alert("Success", "Password updated!", [
        { text: "OK", onPress: () => navigation.navigate("SignIn") }
      ]);
    } catch (error) {
      Alert.alert("Reset Failed", error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);
    if (cleanText && index < 5) inputs.current[index + 1].focus();
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!isVerified ? (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>Enter the code sent to {email}</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[styles.otpInput, { borderColor: otp[index] ? '#000' : '#E1E8ED' }]}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  value={digit}
                  ref={(ref) => (inputs.current[index] = ref)}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={verifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify Code</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={autoSendOTP} style={{marginTop: 20}}>
              <Text style={{textAlign: 'center', color: '#666'}}>
                Didn't get code? <Text style={{fontWeight: 'bold', color: '#000'}}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>Set a strong new password for your account.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  secureTextEntry={!showPassword}
                  value={passwords.new}
                  onChangeText={(text) => setPasswords({...passwords, new: text})}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  secureTextEntry={!showConfirmPassword}
                  value={passwords.confirm}
                  onChangeText={(text) => setPasswords({...passwords, confirm: text})}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 25, flex: 1, justifyContent: 'center' },
  stepContainer: { width: '100%' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 30 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  otpInput: {
    width: 45, height: 55, borderWidth: 1.5, borderRadius: 10,
    textAlign: 'center', fontSize: 20, fontWeight: 'bold', backgroundColor: '#F9F9F9'
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  // UPDATED WRAPPER AND INPUT FOR EYE BUTTON
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  input: {
    height: 55, backgroundColor: '#F5F7FA', borderRadius: 12,
    paddingHorizontal: 16, borderWidth: 1, borderColor: '#E1E8ED',
    width: '100%'
  },
  eyeButton: { position: 'absolute', right: 15 },
  eyeText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  primaryButton: {
    backgroundColor: '#000', height: 55, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 10
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});

export default VerifyFPotpADChnagepw;