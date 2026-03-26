import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Appearance,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useTheme,
  useFocusEffect,
} from "@react-navigation/native";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as api from "../../../api/index";

const ProfilePage = ({ setIsLoggedIn }) => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState({
    name: "",
    email: "",
    profileImage: "",
  });

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, []),
  );

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setIsGuest(false);
        const decoded = jwtDecode(token);
        const response = await api.getUserProfile(decoded.email);

        if (response.data.success) {
          const userData = response.data.user;
          setUser({
            name: userData.name,
            email: userData.email,
            profileImage: userData.profileImage,
          });
        }
      } else {
        setIsGuest(true);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  };

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
          ]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );

  // --- GUEST VIEW COMPONENT ---
  const GuestProfileView = () => (
    <View style={styles.guestContainer}>
      <View style={styles.guestHeaderCard}>
        <View style={styles.guestAvatarPlaceholder}>
          <Ionicons name="person" size={50} color="#CBD5E1" />
        </View>
        <Text style={[styles.guestTitle, { color: colors.text }]}>
          Welcome, Guest
        </Text>
        <Text style={styles.guestSubtitle}>
          Sign in to customize your profile, manage groups, and save your
          preferences.
        </Text>
        <TouchableOpacity
          style={styles.guestLoginBtn}
          onPress={() => navigation.navigate("SignIn")}
        >
          <Text style={styles.guestLoginBtnText}>Log In / Sign Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Preferences
        </Text>
        <SettingItem
          onPress={toggleTheme}
          icon={dark ? "moon" : "sunny"}
          title="Appearance"
          subtitle={dark ? "Dark mode" : "Light mode"}
          rightElement={
            <View
              style={[
                styles.toggleTrack,
                { backgroundColor: dark ? "#6366F1" : "#CBD5E1" },
              ]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  { alignSelf: dark ? "flex-end" : "flex-start" },
                ]}
              />
            </View>
          }
        />
      </View>
    </View>
  );

  if (loading && !user.name && !isGuest) {
    return (
      <View
        style={[
          styles.mainWrapper,
          { backgroundColor: colors.background, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <View style={[styles.navBar, { backgroundColor: colors.card }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.navTitle, { color: colors.text }]}>Profile</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {isGuest ? (
          <GuestProfileView />
        ) : (
          <>
            <View
              style={[
                styles.profileHeaderCard,
                { backgroundColor: colors.card },
              ]}
            >
              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri:
                      user.profileImage ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuQWVd2N57kwCTsg0z5wCIdvXX5DRKu6w1RA&s",
                  }}
                  style={styles.avatar}
                />
                <TouchableOpacity
                  style={styles.cameraBadge}
                  onPress={() => handleNavigate("EditProfile")}
                >
                  <Ionicons name="camera" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.userName, { color: colors.text }]}>
                {user.name || "User Name"}
              </Text>
              <Text style={styles.userEmail}>
                {user.email || "email@example.com"}
              </Text>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleNavigate("EditProfile")}
              >
                <Ionicons
                  name="pencil"
                  size={14}
                  color="#FFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Account
              </Text>
              <SettingItem
                onPress={() => handleNavigate("MyGroups")}
                icon="people-outline"
                title="Groups"
              />
              <SettingItem
                onPress={() => handleNavigate("PersonalInfo")}
                icon="person-outline"
                title="Personal Info"
                subtitle="Manage your account data"
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Preferences
              </Text>
              <SettingItem
                onPress={toggleTheme}
                icon={dark ? "moon" : "sunny"}
                title="Appearance"
                subtitle={dark ? "Dark mode is on" : "Light mode is on"}
                rightElement={
                  <View
                    style={[
                      styles.toggleTrack,
                      { backgroundColor: dark ? "#6366F1" : "#CBD5E1" },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        { alignSelf: dark ? "flex-end" : "flex-start" },
                      ]}
                    />
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
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Support
              </Text>
              <SettingItem
                icon="log-out-outline"
                title="Sign Out"
                destructive
                onPress={handleLogout}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: Platform.OS === "ios" ? 50 : 40,
    bottom: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: { fontSize: 25, fontWeight: "800" },
  profileHeaderCard: {
    alignItems: "center",
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 3,
  },
  avatarWrapper: { position: "relative", marginBottom: 15, marginTop: 10 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#F1F5F9",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6366F1",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  userName: { fontSize: 22, fontWeight: "900" },
  userEmail: { fontSize: 14, color: "#64748B", marginTop: 2 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 18,
  },
  editBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  section: { marginTop: 30, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  destructiveIcon: { backgroundColor: "#FEF2F2" },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: "700" },
  destructiveText: { color: "#EF4444" },
  settingSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
  },

  // Guest Styles
  guestContainer: { flex: 1, paddingHorizontal: 20, marginTop: 20 },
  guestHeaderCard: {
    padding: 30,
    borderRadius: 30,
    backgroundColor: "#6366F1",
    alignItems: "center",
    marginBottom: 10,
  },
  guestAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  guestSubtitle: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  guestLoginBtn: {
    backgroundColor: "#FFF",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
  },
  guestLoginBtnText: { color: "#6366F1", fontWeight: "bold", fontSize: 15 },
});

export default ProfilePage;
