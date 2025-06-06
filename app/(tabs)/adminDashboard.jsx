import { Bell, Car, FileBarChart2, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);

  useEffect(() => {
    // Mock data
    setTotalDrivers(25);
    setTotalTrips(320);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color="#212529" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.card}>
            <Users size={28} color="#5F2EEA" />
            <Text style={styles.cardTitle}>Total Drivers</Text>
            <Text style={styles.cardValue}>{totalDrivers}</Text>
          </View>
          <View style={styles.card}>
            <Car size={28} color="#0FCCCE" />
            <Text style={styles.cardTitle}>Total Trips</Text>
            <Text style={styles.cardValue}>{totalTrips}</Text>
          </View>
          <View style={styles.card}>
            <FileBarChart2 size={28} color="#FF8A00" />
            <Text style={styles.cardTitle}>Reports</Text>
            <Text style={styles.cardValue}>12</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Manage</Text>
        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageText}>View Driver List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageText}>View Trip Reports</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
  },
  notificationButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center', alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8, right: 8,
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4757',
  },
  content: { padding: 24 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 4,
  },
  cardTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6C757D',
    marginTop: 8,
  },
  cardValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#212529',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
    marginBottom: 16,
  },
  manageButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  manageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
  },
});
