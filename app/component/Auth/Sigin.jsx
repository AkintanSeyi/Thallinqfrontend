import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Image // Added Image import
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from "../../../api/index"; 

// 1. UPDATED HEADER: Removed text, added your logo URL, set to LEFT and BIG
const headerStyles = StyleSheet.create({
  header: {
    paddingTop: 10, 
    paddingBottom: 10,
    paddingHorizontal: 0,
    position: 'absolute',
    top: 0, 
    left: -20, // Moves it slightly left as per your SignUp style
    right: 0,
    zIndex: 10,
    alignItems: 'flex-start', 
  },
  headerLogo: {
    width: 180, // Bigger size
    height: 100, // Bigger size
  },
});

const AuthHeader = () => (
  <View style={headerStyles.header}>
    <Image 
      source={{ uri: 'https://res.cloudinary.com/dvuq6vmiy/image/upload/v1767771541/1000002239-removebg-preview_mgilwd.png' }} 
      style={headerStyles.headerLogo}
      resizeMode="contain"
    />
  </View>
);

export default function SignIn({setIsLoggedIn , isLoggedIn}) {
  const navigation = useNavigation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

const handleSignIn = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }

  setLoading(true);
  try {
    const response = await api.login({ email, password });
    const { token } = response.data;

    if (token) {
      // 1. Save token
      await AsyncStorage.setItem('token', token);
      
      // 2. Update state to trigger navigation to Home/Dashboard
      setIsLoggedIn(true); 
    }
  } catch (error) {
    const errorData = error.response?.data;
    // Removed verification redirect logic; just show the error message
    Alert.alert("Login Failed", errorData?.error || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.fullScreenWrapper}>
      <AuthHeader />
      
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
            value={password}
            onChangeText={setPassword}
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

        <TouchableOpacity onPress={() => navigation.navigate("SendEmail")} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenWrapper: {
    flex: 1,
    backgroundColor: '#0B0C1B',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 140, // Increased to make room for the big logo
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF4A57',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
  },
  signUpLink: {
    color: '#FF4A57',
    fontSize: 16,
    fontWeight: 'bold',
  },
});