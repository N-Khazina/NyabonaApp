import { db } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DriverDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [assignedTrips, setAssignedTrips] = useState<any[]>([]);
  const [driverName, setDriverName] = useState('');
  const [available, setAvailable] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState<Location.LocationSubscription | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleAvailabilityToggle = async (value: boolean) => {
    setAvailable(value);
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { available: value });
      } catch (error) {
        console.error('Failed to update availability:', error);
        Alert.alert('Error', 'Failed to update availability.');
      }
    }
  };

  const manageLocationTracking = async (shouldTrack: boolean) => {
    if (!user?.uid) return;

    if (shouldTrack) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required.');
        return;
      }

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 20,
        },
        async (location) => {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              currentLocation: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                updatedAt: serverTimestamp(),
              },
            });
          } catch (err) {
            console.error('Location update failed:', err);
          }
        }
      );
      setLocationWatcher(watcher);
    } else {
      if (locationWatcher) {
        locationWatcher.remove();
        setLocationWatcher(null);
      }
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribeTrips = onSnapshot(
      query(collection(db, 'bookings'), where('driverId', '==', user.uid)),
      (snapshot) => {
        const trips = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            pickup: data.pickup || {},
            destination: data.destination || {},
            status: data.status || 'unknown',
            amount: typeof data.amount === 'number' ? data.amount : 0,
            createdAt: data.createdAt || null,
          };
        });

        const upcoming = trips.filter((trip) => trip.status !== 'completed');
        setAssignedTrips(upcoming);
        setIsBusy(upcoming.length > 0);

        const totalEarnings = trips
          .filter((trip) => trip.status === 'completed')
          .reduce((sum, trip) => sum + trip.amount, 0);
        setEarnings(totalEarnings);
      }
    );

    const unsubscribeNotifications = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('driverId', '==', user.uid),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    const getDriverData = async () => {
      const driverRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(driverRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDriverName(data.name || '');
        setAvailable(data.available ?? true);
      }
    };

    getDriverData();

    return () => {
      unsubscribeTrips();
      unsubscribeNotifications();
    };
  }, [user?.uid]);

  useEffect(() => {
    const shouldTrack = available || isBusy;
    manageLocationTracking(shouldTrack);
    return () => {
      if (locationWatcher) {
        locationWatcher.remove();
      }
    };
  }, [available, isBusy]);

  const handleAcceptNotification = async (notificationId: string, bookingId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { status: 'accepted' });
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'accepted' });
      Alert.alert('Booking accepted');
      setShowNotifications(false);
      router.push({ pathname: '/drivertabs/driverMapScreen', params: { tripId: bookingId } });
    } catch (error) {
      console.error('Error accepting notification:', error);
      Alert.alert('Error', 'Failed to accept booking');
    }
  };

  const handleRejectNotification = async (notificationId: string, bookingId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { status: 'rejected' });
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'rejected' });
      Alert.alert('Booking rejected');
      setShowNotifications(false);
    } catch (error) {
      console.error('Error rejecting notification:', error);
      Alert.alert('Error', 'Failed to reject booking');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> {/* ...rest unchanged... */} </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4757',
  },
  notificationsContainer: {
    maxHeight: 250,
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  noNotificationsText: {
    textAlign: 'center',
    color: '#6C757D',
    fontFamily: 'Inter-Regular',
  },
  notificationItem: {
    paddingVertical: 8,
    borderBottomColor: '#E9ECEF',
    borderBottomWidth: 1,
  },
  notificationMessage: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212529',
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
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
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    marginHorizontal: 24,
  },
});
