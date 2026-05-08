import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Appearance,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Settingshow = ({ setIsLoggedIn, isGuest }) => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const handleNavigate = (screen) => {
    if (isGuest) {
      Alert.alert("Login Required", "Please log in to access this feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log In", onPress: () => navigation.navigate("SignIn") },
      ]);
      return;
    }
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
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
        style: "destructive",
      },
    ]);
  };

  const toggleTheme = () => {
    const nextScheme = dark ? "light" : "dark";
    Appearance.setColorScheme(nextScheme);
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    destructive = false,
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          backgroundColor: colors.card,
          borderColor: dark ? "#334155" : "#F1F5F9",
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconContainer,
          destructive
            ? styles.destructiveIcon
            : { backgroundColor: dark ? "#312E81" : "#EEF2FF" },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? "#EF4444" : "#6366F1"}
        />
      </View>
      <View style={styles.settingTextContainer}>
        <Text
          style={[
            styles.settingTitle,
            { color: colors.text },
            destructive && styles.destructiveText,
          ]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <View style={[styles.navBar, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.navTitle, { color: colors.text }]}>Settings</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <SettingItem
            onPress={() => handleNavigate("MyGroups")}
            icon="people-outline"
            title="Groups"
          />
          <SettingItem
            onPress={() => handleNavigate("PersonalInfo")}
            icon="person-outline"
            title="Personal Info"
          />

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Preferences</Text>
          <SettingItem
            onPress={toggleTheme}
            icon={dark ? "moon" : "sunny"}
            title="Appearance"
            rightElement={
              <View style={[styles.toggleTrack, { backgroundColor: dark ? "#6366F1" : "#CBD5E1" }]}>
                <View style={[styles.toggleKnob, { alignSelf: dark ? "flex-end" : "flex-start" }]} />
              </View>
            }
          />
          <SettingItem
            onPress={() => handleNavigate("Notification")}
            icon="notifications-outline"
            title="Notifications"
          />
          <SettingItem
            onPress={() => handleNavigate("Privacy")}
            icon="shield-checkmark-outline"
            title="Privacy & Security"
          />
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            destructive
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settingshow;

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  titleContainer: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 40 },
  navTitle: { fontSize: 18, fontWeight: "700" },
  scrollContainer: { paddingBottom: 40 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.6,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  destructiveIcon: { backgroundColor: "#FEE2E2" },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: "600" },
  settingSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  destructiveText: { color: "#EF4444" },
  toggleTrack: { width: 38, height:  22, borderRadius: 12, padding: 2, justifyContent: "center" },
  toggleKnob: { width: 18, height: 18, backgroundColor: "#FFF", borderRadius: 10 },
});