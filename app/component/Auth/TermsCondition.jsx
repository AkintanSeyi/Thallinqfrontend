import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';

const TermsCondition = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Terms & Conditions (EULA)</Text>
        <Text style={styles.appName}>Thalinq: Party Hub</Text>
        <Text style={styles.date}>Effective Date: January 2026</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>1. Eligibility</Text>
          <Text style={styles.body}>
            By using Thalinq, you represent and warrant that you are at least 18 years of age. 
            If you are under 18, you are not authorized to use this app under any circumstances.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>2. User-Generated Content & Zero Tolerance</Text>
          <Text style={styles.body}>
            Thalinq allows users to create groups and post content. There is <Text style={{fontWeight: 'bold'}}>zero tolerance for objectionable content or abusive users</Text>. You agree not to:{"\n"}
            • Harass, bully, or threaten other members.{"\n"}
            • Post defamatory, obscene, or sexually explicit material.{"\n"}
            • Post content that promotes violence or illegal activities.{"\n"}
            Any user found violating these terms will be ejected and banned immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>3. Reporting & Moderation</Text>
          <Text style={styles.body}>
            Users can flag any content they find objectionable. Thalinq moderators will 
            review all reports and <Text style={{fontWeight: 'bold'}}>act on objectionable content reports within 24 hours</Text> by removing the content and/or ejecting the user who provided the offending content.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>4. Blocking Users</Text>
          <Text style={styles.body}>
            Thalinq provides a mechanism for users to block abusive users. Blocking a user 
            will instantly remove that user's content from your feed and prevent them 
            from contacting you.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>5. Safety & Disclaimer</Text>
          <Text style={styles.body}>
            Thalinq is not liable for interactions between users. Please exercise caution 
            when meeting group members in person.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>6. Account Termination</Text>
          <Text style={styles.body}>
            We reserve the right to terminate or suspend your account at any time, 
            without prior notice, for any violation of these terms.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000' },
  appName: { fontSize: 18, color: '#6200ee', fontWeight: '600', marginBottom: 5 },
  date: { fontSize: 14, color: '#888', marginBottom: 20 },
  section: { marginBottom: 25 },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  body: { fontSize: 15, lineHeight: 22, color: '#444' },
});

export default TermsCondition;