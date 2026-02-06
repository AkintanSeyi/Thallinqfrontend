import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import * as api from "../../../../api/index"; // Ensure this path is correct

const PersonalInfo = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          const response = await api.getUserProfile(decoded.email);
          setUserData(response.data.user);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const DetailItem = ({ label, value, icon, isTags = false }) => (
    <View style={styles.detailGroup}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={18} color={dark ? "#94A3B8" : "#6B7280"} style={styles.labelIcon} />
        <Text style={[styles.label, { color: dark ? "#64748B" : "#94A3B8" }]}>{label}</Text>
      </View>
      <View style={[
        styles.valueContainer, 
        { backgroundColor: dark ? '#1F2937' : '#F9FAFB', borderColor: dark ? '#374151' : '#F3F4F6' }
      ]}>
        {isTags ? (
          <View style={styles.tagWrapper}>
            {value?.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: dark ? '#312E81' : '#EEF2FF' }]}>
                <Text style={[styles.tagText, { color: dark ? '#818CF8' : '#4F46E5' }]}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.valueText, { color: colors.text }]}>{value || 'Not provided'}</Text>
        )}
      </View>
    </View>
  );

  if (loading) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: dark ? '#334155' : '#EEE' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Personal Details</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionDescription, { color: dark ? '#9CA3AF' : '#6B7280' }]}>
          These details are verified and linked to your account.
        </Text>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <DetailItem label="Full Name" value={userData?.name} icon="person-outline" />
          <DetailItem label="Email Address" value={userData?.email} icon="mail-outline" />
          <DetailItem label="Phone Number" value={userData?.phone} icon="call-outline" />
          <DetailItem label="Bio" value={userData?.bio} icon="document-text-outline" />
          
          {/* CATEGORIES / INTERESTS SECTION */}
          <DetailItem 
            label="Interests & Categories" 
            value={userData?.interests} 
            icon="pricetags-outline" 
            isTags={true} 
          />
        </View>

        <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate("HelpCenter")}>
           <Text style={[styles.supportButtonText, { color: dark ? '#818CF8' : '#4F46E5' }]}>
             Contact Support
           </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Add these to your StyleSheet
const styles = StyleSheet.create({
  // --- Merged Tag Styles ---
  tagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // --- Existing Container Styles ---
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  detailGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueContainer: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  supportButton: {
    marginTop: 30,
    padding: 15,
    alignItems: 'center',
  },
  supportButtonText: {
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default PersonalInfo;