import React, { useState, useCallback } from "react";
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
  const [activeTab, setActiveTab] = useState("Moments");
 
  const [moments, setMoments] = useState([]);
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
          // Fetch moments after profile is loaded
          fetchUserMoments(userData.email);
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

  const handleDeleteMoment = (momentId) => {
    Alert.alert(
      "Delete Moment",
      "Are you sure you want to delete this moment forever?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.deleteMoment(momentId);
              if (response.data.success) {
                // Locally update the UI so the moment disappears immediately
                setMoments((prev) => prev.filter((m) => m._id !== momentId));
              }
            } catch (error) {
              console.error("Delete Error:", error);
              Alert.alert("Error", "Could not delete moment.");
            }
          },
        },
      ],
    );
  };

  const fetchUserMoments = async (userEmail) => {
    try {
      console.log(userEmail);
      const response = await api.getMomentsByUser(userEmail);
      if (response.data.success) {
        setMoments(response.data.moments || []);
      }
    } catch (error) {
      console.error("Error fetching moments:", error);
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

  // Internal component for Settings items
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
          <View style={styles.guestContainer}>
            <View style={styles.guestHeaderCard}>
              <View style={styles.guestAvatarPlaceholder}>
                <Ionicons name="person" size={50} color="#CBD5E1" />
              </View>
              <Text style={[styles.guestTitle, { color: "#FFF" }]}>
                Welcome, Guest
              </Text>
              <TouchableOpacity
                style={styles.guestLoginBtn}
                onPress={() => navigation.navigate("SignIn")}
              >
                <Text style={styles.guestLoginBtnText}>Log In / Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* --- TOP PROFILE HEADER (RESTORED) --- */}
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

            {/* --- TAB SWITCHER (MIDDLE) --- */}
            <View
              style={[
                styles.tabBar,
                { borderBottomColor: dark ? "#334155" : "#F1F5F9" },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabItem,
                  activeTab === "Moments" && styles.activeTabItem,
                ]}
                onPress={() => setActiveTab("Moments")}
              >
                <Ionicons
                  name="grid"
                  size={20}
                  color={activeTab === "Moments" ? "#6366F1" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === "Moments" ? colors.text : "#94A3B8",
                    },
                  ]}
                >
                  Moments
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabItem,
                  activeTab === "Profile" && styles.activeTabItem,
                ]}
                onPress={() => setActiveTab("Profile")}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={activeTab === "Profile" ? "#6366F1" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === "Profile" ? colors.text : "#94A3B8",
                    },
                  ]}
                >
                  Settings
                </Text>
              </TouchableOpacity>
            </View>

            {/* --- CONDITIONAL CONTENT --- */}
            {activeTab === "Moments" ? (
              <View style={styles.gridContainer}>
                {moments.length > 0 ? (
                  <View style={styles.row}>
                    {moments.map((item, index) => (
                      <View key={item._id || index} style={styles.gridItem}>
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() =>
                            navigation.navigate("MomentDetail", {
                              moment: item,
                            })
                          }
                        >
                          <Image
                            source={{ uri: item.image }}
                            style={styles.gridImage}
                          />
                        </TouchableOpacity>

                        {/* TRASH ICON */}
                        <TouchableOpacity
                          style={styles.deleteBadge}
                          onPress={() => handleDeleteMoment(item._id)}
                        >
                          <Ionicons name="trash" size={12} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={40} color="#94A3B8" />
                    <Text style={{ color: "#94A3B8", marginTop: 10 }}>
                      No moments yet
                    </Text>
                  </View>
                )}
              </View>
            ) : (
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
                />

                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, marginTop: 20 },
                  ]}
                >
                  Preferences
                </Text>
                <SettingItem
                  onPress={toggleTheme}
                  icon={dark ? "moon" : "sunny"}
                  title="Appearance"
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

                {/* RESTORED ORIGINAL PATH: Security */}
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
            )}
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
  tabBar: { flexDirection: "row", borderBottomWidth: 1, marginTop: 10 },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  activeTabItem: { borderBottomWidth: 2, borderBottomColor: "#6366F1" },
  tabText: { marginLeft: 8, fontWeight: "700", fontSize: 14 },
  gridContainer: { padding: 2 },
  row: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "33.33%", aspectRatio: 1, padding: 2 },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#1E293B",
  },
  emptyState: { alignItems: "center", marginTop: 60 },
  section: { marginTop: 10, paddingHorizontal: 20 },
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
  guestContainer: { flex: 1, paddingHorizontal: 20, marginTop: 20 },
  guestHeaderCard: {
    padding: 30,
    borderRadius: 30,
    backgroundColor: "#6366F1",
    alignItems: "center",
    marginBottom: 10,
  },
  deleteBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(239, 68, 68, 0.8)", // Semi-transparent Red
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
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
  guestTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  guestLoginBtn: {
    backgroundColor: "#FFF",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
  },
  guestLoginBtnText: { color: "#6366F1", fontWeight: "bold", fontSize: 15 },
});

export default ProfilePage;
