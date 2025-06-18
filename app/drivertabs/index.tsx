import { db } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Bell, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DriverDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [assignedTrips, setAssignedTrips] = useState<any[]>([]);
  const [driverName, setDriverName] = useState('');
  const [available, setAvailable] = useState(true);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'trips'), where('driverId', '==', user.uid)),
      (snapshot) => {
        const trips = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const upcoming = trips.filter((trip) => trip.status !== 'completed');
        setAssignedTrips(upcoming);

        const totalEarnings = trips
          .filter((trip) => trip.status === 'completed')
          .reduce((sum, trip) => sum + (trip.amount || 0), 0);
        setEarnings(totalEarnings);
      }
    );

    const getDriverName = async () => {
      const driverRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(driverRef);
      if (docSnap.exists()) {
        setDriverName(docSnap.data().name || '');
      }
    };

    getDriverName();
    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.driverName}>{driverName || 'Driver'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color="#212529" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Available for Trips</Text>
        <Switch
          value={available}
          onValueChange={setAvailable}
          trackColor={{ false: '#E9ECEF', true: '#5F2EEA' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsValue}>{earnings.toLocaleString()} RWF</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Upcoming Trips</Text>
        {assignedTrips.length > 0 ? (
          assignedTrips.map((trip) => (
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
          ))
        ) : (
          <Text style={styles.noTripsText}>No upcoming trips assigned</Text>
        )}

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
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  driverName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
    marginTop: 4,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statusLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#212529',
  },
  earningsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  earningsLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  earningsValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#28A745',
    marginTop: 4,
  },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
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
  noTripsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 12,
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
