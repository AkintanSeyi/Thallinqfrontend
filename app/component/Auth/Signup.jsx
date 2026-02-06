import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; 
import * as api from "../../../api/index";

// 1. SHARED HEADER COMPONENT
const AuthHeader = () => (
  <View style={headerStyles.header}>
    <Image 
      source={{ uri: 'https://res.cloudinary.com/dvuq6vmiy/image/upload/v1767771541/1000002239-removebg-preview_mgilwd.png' }} 
      style={headerStyles.headerLogo}
      resizeMode="contain"
    />
  </View>
);

export default function SignUp({ setIsLoggedIn , isLoggedIn }) {
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmpassword: ''
  });
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const handleSignUp = async () => {
  const { name, email, password, confirmpassword } = formData;

  if (!name || !email || !password || !confirmpassword) {
    Alert.alert("Required", "All fields are mandatory.");
    return;
  }

  if (password !== confirmpassword) {
    Alert.alert("Mismatch", "Passwords do not match.");
    return;
  }

  setLoading(true);
  try {
    const response = await api.signup(formData);
    
    // Check for the token in the response
    if (response.data && response.data.token) {
      const { token } = response.data;

      // 1. Save token to local storage
      await AsyncStorage.setItem('token', token);
      
      // 2. Flip the global login state (This takes user to Home/Dashboard)
      if (setIsLoggedIn) {
        setIsLoggedIn(true);
      }
    } else {
      // Fallback: if no token, go to SignIn
      navigation.navigate("SignIn");
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || "Check your internet connection.";
    Alert.alert("Error", errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.fullScreenWrapper}
    >
      <AuthHeader />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#999"
            style={styles.input}
            onChangeText={(val) => setFormData({ ...formData, name: val })}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(val) => setFormData({ ...formData, email: val })}
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
              onChangeText={(val) => setFormData({ ...formData, password: val })}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)} 
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={24} 
                color="#999" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
              onChangeText={(val) => setFormData({ ...formData, confirmpassword: val })}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={24} 
                color="#999" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.footerLink}> Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>By signing up, you agree to our </Text>
            <TouchableOpacity onPress={() => navigation.navigate('terms&condition')}>
              <Text style={styles.legalLink}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}> and </Text>
            <TouchableOpacity onPress={() => navigation.navigate('privatepolicy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// STYLES
const headerStyles = StyleSheet.create({
  header: {
    paddingTop: 10, 
    paddingBottom: 10,
    paddingHorizontal: 0,
    position: 'absolute',
    top: 0, left: -20, right: 0,
    zIndex: 10,
    alignItems: 'flex-start', // Puts the logo to the LEFT
  },
  headerLogo: {
    width: 180, // Increased size (Bigger)
    height: 100,  // Increased size (Bigger)
  },
});

const styles = StyleSheet.create({
  fullScreenWrapper: {
    flex: 1,
    backgroundColor: '#0B0C1B',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 140, // Increased to ensure the bigger logo doesn't hit the title
    paddingBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1A1B2D',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2B3D',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1B2D',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2B3D',
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: '#FF4A57',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
  },
  footerLink: {
    color: '#FF4A57',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  legalText: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
  },
  legalLink: {
    color: '#FF4A57',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});