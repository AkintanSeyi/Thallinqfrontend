import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as api from "../../../../api/index";

const Adminview = () => {
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [groupId]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.getGroupAnalytics(groupId);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.log("Error fetching analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Group Insights</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={styles.label}>Total Members</Text>
          <Text style={[styles.value, { color: colors.primary }]}>{stats?.totalMembers}</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.statCard, { backgroundColor: colors.card, flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Joined This Week</Text>
            <Text style={[styles.value, { color: "#10B981" }]}>+{stats?.currentWeekJoins}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, flex: 1 }]}>
            <Text style={styles.label}>Joined Last Week</Text>
            <Text style={[styles.value, { color: "#F59E0B" }]}>+{stats?.lastWeekJoins}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 15 },
  statsGrid: { padding: 20 },
  statCard: { padding: 20, borderRadius: 16, marginBottom: 15, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginBottom: 5 },
  value: { fontSize: 28, fontWeight: '800' }
});

export default Adminview;