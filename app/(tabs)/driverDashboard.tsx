import { Bell, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DriverDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [assignedTrips, setAssignedTrips] = useState<any[]>([]);

  useEffect(() => {
    setAssignedTrips([
      {
        id: 'TRIP001',
        from: 'Kimironko',
        to: 'Kacyiru',
        time: 'Today, 3:00 PM',
        status: 'Pending',
      },
      {
        id: 'TRIP002',
        from: 'Nyabugogo',
        to: 'Remera',
        time: 'Tomorrow, 10:00 AM',
        status: 'Scheduled',
      },
    ]);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Dashboard</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color="#212529" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Upcoming Trips</Text>
        {assignedTrips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            <Text style={styles.tripTime}>{trip.time}</Text>
            <View style={styles.routeRow}>
              <MapPin size={16} color="#5F2EEA" />
              <Text style={styles.routeText}>From: {trip.from}</Text>
            </View>
            <View style={styles.routeRow}>
              <MapPin size={16} color="#FF8A00" />
              <Text style={styles.routeText}>To: {trip.to}</Text>
            </View>
            <Text style={styles.tripStatus}>Status: {trip.status}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageText}>View Trip History</Text>
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
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
    marginBottom: 16,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  tripTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeText: {
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212529',
  },
  tripStatus: {
    marginTop: 8,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#0FCCCE',
  },
  manageButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  manageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
  },
});
