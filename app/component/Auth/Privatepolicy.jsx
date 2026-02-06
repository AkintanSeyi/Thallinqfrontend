import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';

const Privatepolicy = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Privacy Policy for Thalinq</Text>
        <Text style={styles.date}>Last Updated: October 2023</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>1. Age Requirement</Text>
          <Text style={styles.body}>
            Thalinq is strictly for individuals aged **18 and older**. We do not knowingly 
            collect data from anyone under 18. If we discover a minor is using the app, 
            we will terminate the account immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>2. Information We Collect</Text>
          <Text style={styles.body}>
            • **Account Information:** Name, email, and date of birth.{"\n"}
            • **Group Activity:** Content, photos, and messages shared in the party hub.{"\n"}
            • **Connections:** Data regarding the groups you create or join.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>3. How We Use Data</Text>
          <Text style={styles.body}>
            We use your information to facilitate group interactions, ensure user safety, 
            and provide notifications about your "party hub" activities.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>4. Data Sharing</Text>
          <Text style={styles.body}>
            Your profile and group contributions are visible to other members of the groups 
            you join. We do not sell your personal data to third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>5. Contact Us</Text>
          <Text style={styles.body}>
            If you have questions regarding your privacy, please contact our support team.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
});

export default Privatepolicy;