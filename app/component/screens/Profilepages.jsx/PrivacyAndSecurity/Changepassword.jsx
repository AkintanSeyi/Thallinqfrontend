import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../../api/index"; // Adjust path to your api folder

const PasswordInput = ({ label, value, field, placeholder, showPassword, toggleVisibility, onChangeText }) => {
  const { colors, dark } = useTheme();
  
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: dark ? '#E5E7EB' : '#374151' }]}>{label}</Text>
      <View style={[
        styles.inputWrapper, 
        { 
          backgroundColor: dark ? '#1F2937' : '#F9FAFB', 
          borderColor: dark ? '#374151' : '#E5E7EB' 
        }
      ]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={(text) => onChangeText(field, text)}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => toggleVisibility(field)} style={styles.eyeIcon}>
          <Ionicons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color="#94A3B8" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ChangePassword = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleTextChange = useCallback((field, text) => {
    setPasswords(prev => ({ ...prev, [field]: text }));
  }, []);

  const toggleVisibility = useCallback((field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Validation Logic
  const isButtonDisabled = 
    !passwords.current || 
    !passwords.new || 
    passwords.new !== passwords.confirm || 
    passwords.new.length < 6;

  const handleUpdatePassword = async () => {
    setLoading(true);
    try {
      // 1. Get user email from token
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error("No session found");
      
      const decoded = jwtDecode(token);
      const email = decoded.email;

      // 2. Call API
      const response = await api.changePassword({
        email: email,
        currentPassword: passwords.current,
        newPassword: passwords.new
      });

      if (response.data.success) {
        Alert.alert(
          "Success", 
          "Your password has been updated.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update password. Please check your current password.";
      Alert.alert("Update Failed", errorMsg);
      console.log("Password Update Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backButton, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: dark ? '#94A3B8' : '#6B7280' }]}>
          Your new password must be different from previous used passwords and at least 6 characters long.
        </Text>

        <PasswordInput 
          label="Current Password" 
          field="current" 
          value={passwords.current}
          placeholder="Enter current password"
          showPassword={showPassword.current}
          toggleVisibility={toggleVisibility}
          onChangeText={handleTextChange}
        />

        <View style={[styles.divider, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]} />

        <PasswordInput 
          label="New Password" 
          field="new" 
          value={passwords.new}
          placeholder="Enter new password"
          showPassword={showPassword.new}
          toggleVisibility={toggleVisibility}
          onChangeText={handleTextChange}
        />

        <PasswordInput 
          label="Confirm New Password" 
          field="confirm" 
          value={passwords.confirm}
          placeholder="Re-type new password"
          showPassword={showPassword.confirm}
          toggleVisibility={toggleVisibility}
          onChangeText={handleTextChange}
        />

        {/* Feedback for password mismatch */}
        {passwords.confirm.length > 0 && passwords.new !== passwords.confirm && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}

        <TouchableOpacity 
          style={[
            styles.updateButton, 
            { backgroundColor: dark ? '#6366F1' : '#0B0C1B' },
            (isButtonDisabled || loading) && [styles.disabledButton, { backgroundColor: dark ? '#334155' : '#94A3B8' }]
          ]}
          onPress={handleUpdatePassword}
          disabled={isButtonDisabled || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.updateButtonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  description: { fontSize: 14, marginBottom: 30, lineHeight: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  input: { flex: 1, padding: 15, fontSize: 16 },
  eyeIcon: { padding: 15 },
  divider: { height: 1, marginVertical: 10 },
  updateButton: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
  },
  disabledButton: { elevation: 0 },
  updateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: -10, marginBottom: 10, fontWeight: '600' }
});

export default ChangePassword;