import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Switch, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../../api/index"; 

const PrivacyAndSecurity = ({setIsLoggedIn}) => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          const response = await api.getUserProfile(decoded.email);
          if (response.data.success) {
            setIsPrivateProfile(response.data.user.isPrivate || false);
          }
        }
      } catch (error) {
        console.error("Error fetching privacy settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleTogglePrivacy = async (newValue) => {
    const previousValue = isPrivateProfile;
    setIsPrivateProfile(newValue); 

    try {
      const token = await AsyncStorage.getItem('token');
      const decoded = jwtDecode(token);
      
      const response = await api.updatePrivacy({
        email: decoded.email,
        isPrivate: newValue
      });

      if (!response.data.success) {
        throw new Error("Update failed");
      }
    } catch (error) {
      setIsPrivateProfile(previousValue); 
      Alert.alert("Error", "Could not update privacy setting. Please try again.");
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              await AsyncStorage.clear(); 
              if (setIsLoggedIn) setIsLoggedIn(false);
            } catch (error) {
              console.error("Logout Error:", error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // --- DELETE ACCOUNT HANDLER (Integrates your logout logic) ---
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and all your data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete My Account", 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('token');
              const decoded = jwtDecode(token);

              const response = await api.deleteAccount(decoded.email);

              if (response.data.success) {
                // Perform the same cleanup as your logout
                await AsyncStorage.clear(); 
                if (setIsLoggedIn) setIsLoggedIn(false); 
                
                Alert.alert("Account Deleted", "We're sorry to see you go.");
              }
            } catch (error) {
              Alert.alert("Error", "Could not delete account. Please contact support.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const SecuritySection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: dark ? '#94A3B8' : '#6B7280' }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );

  const SecurityItem = ({ icon, title, onPress, showArrow = true, toggleValue, onToggle }) => (
    <TouchableOpacity 
      style={[styles.itemRow, { borderBottomColor: dark ? '#1F2937' : '#F3F4F6' }]} 
      onPress={onPress} 
      disabled={onToggle !== undefined}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconBackground, { backgroundColor: dark ? '#1F2937' : '#F3F4F6' }]}>
          <Ionicons name={icon} size={20} color={dark ? '#818CF8' : "#0B0C1B"} />
        </View>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
      </View>
      
      {onToggle !== undefined ? (
        <Switch
          trackColor={{ false: '#D1D5DB', true: dark ? '#6366F1' : '#0B0C1B' }}
          thumbColor={'#fff'}
          onValueChange={onToggle}
          value={toggleValue}
        />
      ) : (
        showArrow && <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SecuritySection title="Security Settings">
          <SecurityItem 
            icon="key-outline" 
            title="Change Password" 
            onPress={() => navigation.navigate("ChangePassword")}
          />
          <SecurityItem 
            icon="log-out-outline" 
            title="Logout" 
            onPress={handleLogout}
          />
        </SecuritySection>

        <SecuritySection title="Privacy Controls">
          <SecurityItem 
            icon="lock-closed-outline" 
            title="Private Profile" 
            toggleValue={isPrivateProfile}
            onToggle={handleTogglePrivacy} 
          />
          <SecurityItem 
            icon="eye-off-outline" 
            title="Blocked Users" 
            onPress={() => navigation.navigate("BlockedUsers")}
          />
        </SecuritySection>

        <TouchableOpacity 
          style={styles.deleteAccount} 
          activeOpacity={0.7}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
        
        <Text style={[styles.footerNote, { color: dark ? '#64748B' : '#94A3B8' }]}>
          Your data is encrypted and stored securely. Read our Privacy Policy for more details.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: 16, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBackground: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemTitle: { fontSize: 15, fontWeight: '500' },
  deleteAccount: { marginTop: 10, padding: 15, alignItems: 'center' },
  deleteText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
  footerNote: { textAlign: 'center', fontSize: 12, marginTop: 20, lineHeight: 18, paddingHorizontal: 20 }
});

export default PrivacyAndSecurity;