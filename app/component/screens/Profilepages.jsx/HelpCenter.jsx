import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HelpCenter = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    {
      id: '1',
      question: 'How do I join a tech group?',
      answer: 'Navigate to the Groups tab, select a group that interests you, and tap the "Join Group" button.'
    },
    {
      id: '2',
      question: 'Can I create my own community?',
      answer: 'Yes! Tap the "+" icon on the Groups main page to start setting up your own community.'
    },
    {
      id: '3',
      question: 'Is my data secure?',
      answer: 'Absolutely. We use industry-standard encryption to protect your personal information and messages.'
    }
  ];

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const ContactCard = ({ icon, title, value, onPress }) => (
    <TouchableOpacity 
      style={[
        styles.contactCard, 
        { backgroundColor: colors.card, borderColor: dark ? '#374151' : '#E5E7EB' }
      ]} 
      onPress={onPress}
    >
      <View style={[styles.contactIconCircle, { backgroundColor: dark ? '#1F2937' : '#F3F4F6' }]}>
        <Ionicons name={icon} size={20} color={dark ? '#818CF8' : '#0B0C1B'} />
      </View>
      <View>
        <Text style={[styles.contactLabel, { color: dark ? '#94A3B8' : '#6B7280' }]}>{title}</Text>
        <Text style={[styles.contactValue, { color: colors.text }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backButton, { backgroundColor: dark ? '#374151' : '#F3F4F6' }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Support</Text>
        <View style={styles.contactContainer}>
          <ContactCard 
            icon="mail-outline" 
            title="Email us at" 
            value="support@communityapp.com"
            onPress={() => Linking.openURL('mailto:support@communityapp.com')}
          />
          <ContactCard 
            icon="call-outline" 
            title="Call us at" 
            value="+1 (800) 123-4567"
            onPress={() => Linking.openURL('tel:+18001234567')}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20, color: colors.text }]}>Common Questions</Text>
        {faqs.map((faq) => (
          <TouchableOpacity 
            key={faq.id} 
            style={[styles.faqCard, { backgroundColor: colors.card }]} 
            onPress={() => toggleExpand(faq.id)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
              <Ionicons 
                name={expandedId === faq.id ? "remove-circle-outline" : "add-circle-outline"} 
                size={22} 
                color={expandedId === faq.id ? (dark ? '#818CF8' : '#0B0C1B') : "#94A3B8"} 
              />
            </View>
            {expandedId === faq.id && (
              <View style={[styles.answerContainer, { borderTopColor: dark ? '#374151' : '#F3F4F6' }]}>
                <Text style={[styles.faqAnswer, { color: dark ? '#94A3B8' : '#6B7280' }]}>{faq.answer}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Available Mon-Fri, 9am - 6pm EST</Text>
        </View>
      </ScrollView>
    </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  contactContainer: { marginBottom: 10 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactLabel: { fontSize: 12, marginBottom: 2 },
  contactValue: { fontSize: 15, fontWeight: '600' },
  faqCard: {
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: { fontSize: 15, fontWeight: '600', flex: 1, paddingRight: 10 },
  answerContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  faqAnswer: { fontSize: 14, lineHeight: 20 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#94A3B8', fontSize: 12 },
});

export default HelpCenter;