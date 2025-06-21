import { db } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Bell, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LatLng = { latitude: number; longitude: number };

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  try {
    return timestamp.toDate().toLocaleString();
  } catch {
    return String(timestamp);
  }
};

const cleanupOldNotifications = async (notifications: any[]) => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  for (const notif of notifications) {
    const createdAt = notif.createdAt?.toDate?.();
    if (createdAt && now - createdAt.getTime() > oneDayMs) {
      await deleteDoc(doc(db, 'notifications', notif.id));
    }
  }
};

const findNearestAvailableDriver = async (
  pickup: LatLng
): Promise<{ uid: string; currentLocation: LatLng } | null> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(
    query(usersRef, where('role', '==', 'driver'), where('available', '==', true))
  );
  let nearestDriver: { uid: string; currentLocation: LatLng } | null = null;
  let minDistance = Infinity;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const location = data.currentLocation;
    if (location) {
      const distance = Math.sqrt(
        Math.pow(location.latitude - pickup.latitude, 2) +
          Math.pow(location.longitude - pickup.longitude, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestDriver = { uid: docSnap.id, currentLocation: location };
      }
    }
  });
  return nearestDriver;
};

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
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), { available: value });
    } catch (error) {
      console.error('Failed to update availability:', error);
      Alert.alert('Error', 'Failed to update availability.');
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
      locationWatcher?.remove();
      setLocationWatcher(null);
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
            createdAt: data.createdAt,
            clientId: data.clientId || null,
          };
        });
        const upcoming = trips
          .filter((trip) => trip.status !== 'completed')
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAssignedTrips(upcoming);
        setIsBusy(upcoming.length > 0);
        const totalEarnings = trips
          .filter((trip) => trip.status === 'completed')
          .reduce((sum, trip) => sum + trip.amount, 0);
        setEarnings(totalEarnings);
      }
    );

    const unsubscribeNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('driverId', '==', user.uid)),
      async (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotifications(notifs);
        cleanupOldNotifications(notifs);
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
    return () => locationWatcher?.remove();
  }, [available, isBusy]);

  const handleAcceptNotification = async (notificationId: string, bookingId: string) => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    try {
      const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
      const bookingData = bookingSnap.data();
      const clientId = bookingData?.clientId || null;
      const { pickup, destination, amount } = bookingData || {};

      await updateDoc(doc(db, 'notifications', notificationId), { status: 'accepted', read: true });
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'accepted' });

      if (clientId) {
        await addDoc(collection(db, 'notifications'), {
          clientId,
          bookingId,
          status: 'info',
          read: false,
          senderRole: 'driver',
          createdAt: serverTimestamp(),
          message: 'Trip has been accepted, driver is on his way to pick you up at the pickup location.',
          amount,
          pickupAddress: pickup?.address,
          destinationAddress: destination?.address,
        });
      }

      Alert.alert('Booking accepted');
      setShowNotifications(false);
      router.push({ pathname: '/drivertabs/driverMapScreen', params: { bookingId } });
    } catch (error) {
      console.error('Error accepting notification:', error);
      Alert.alert('Error', 'Failed to accept booking');
    }
  };

  const handleRejectNotification = async (notificationId: string, bookingId: string) => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    try {
      const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
      const bookingData = bookingSnap.data();
      if (!bookingData) throw new Error('Booking not found');

      const clientId = bookingData.clientId || null;
      const { pickup, destination, amount } = bookingData;

      // Update booking to pending and reset driverId to null for reassignment
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'pending', driverId: null });

      // Update notification status for current driver
      await updateDoc(doc(db, 'notifications', notificationId), { status: 'rejected', read: true });

      // Notify current driver about reassignment
      await addDoc(collection(db, 'notifications'), {
        driverId: user.uid,
        bookingId,
        status: 'info',
        read: false,
        senderRole: 'system',
        createdAt: serverTimestamp(),
        message: 'Trip was reassigned to another driver.',
        amount,
        pickupAddress: pickup?.address,
        destinationAddress: destination?.address,
      });

      // Notify client trip is reassigned (not rejected)
      if (clientId) {
        await addDoc(collection(db, 'notifications'), {
          clientId,
          bookingId,
          status: 'info',
          read: false,
          senderRole: 'system',
          createdAt: serverTimestamp(),
          message: 'Your trip is now assigned to another driver.',
          amount,
          pickupAddress: pickup?.address,
          destinationAddress: destination?.address,
        });
      }

      // Find nearest available driver and assign trip
      if (pickup) {
        const nearestDriver = await findNearestAvailableDriver(pickup);
        if (nearestDriver) {
          await updateDoc(doc(db, 'bookings', bookingId), { driverId: nearestDriver.uid });
          await updateDoc(doc(db, 'users', nearestDriver.uid), { available: false });

          // Notify newly assigned driver
          await addDoc(collection(db, 'notifications'), {
            driverId: nearestDriver.uid,
            bookingId,
            status: 'pending',
            read: false,
            senderRole: 'system',
            createdAt: serverTimestamp(),
            message: `New trip request from ${pickup?.address} to ${destination?.address}`,
            amount,
            pickupAddress: pickup?.address,
            destinationAddress: destination?.address,
          });
        }
      }
      setShowNotifications(false);
    } catch (error) {
      console.error('Error rejecting notification:', error);
      Alert.alert('Error', 'Failed to reject booking');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.driverName}>{driverName || 'Driver'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={24} color="#212529" />
          {notifications.some((n) => !n.read) && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      {showNotifications && (
        <View style={styles.notificationsContainer}>
          {notifications.length === 0 ? (
            <Text style={styles.noNotificationsText}>No notifications</Text>
          ) : (
            <ScrollView>
              {notifications.map((notification) => {
                const isPending = notification.status === 'pending';
                const isAccepted = notification.status === 'accepted';
                const isRejected = notification.status === 'rejected';

                return (
                  <View
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      isAccepted && styles.acceptedNotification,
                      isRejected && styles.rejectedNotification,
                    ]}
                  >
                    <Text style={styles.notificationMessage}>
                      {isPending && notification.message}
                      {isAccepted && 'Trip accepted'}
                      {isRejected && 'Trip rejected'}
                      {!isPending && !isAccepted && !isRejected && notification.message}
                    </Text>
                    <Text style={styles.notificationDetail}>
                      Pickup: {notification.pickupAddress || 'Unknown'}
                    </Text>
                    <Text style={styles.notificationDetail}>
                      Destination: {notification.destinationAddress || 'Unknown'}
                    </Text>
                    <Text style={styles.notificationDetail}>
                      Requested at: {formatTimestamp(notification.createdAt)}
                    </Text>

                    {isPending && (
                      <View style={styles.notificationActions}>
                        <TouchableOpacity
                          onPress={() =>
                            handleAcceptNotification(notification.id, notification.bookingId)
                          }
                          style={[styles.actionButton, { backgroundColor: '#28A745' }]}
                        >
                          <Text style={styles.actionText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleRejectNotification(notification.id, notification.bookingId)
                          }
                          style={[styles.actionButton, { backgroundColor: '#FF4757' }]}
                        >
                          <Text style={styles.actionText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Available for Trips</Text>
        <Switch
          value={available}
          onValueChange={handleAvailabilityToggle}
          trackColor={{ false: '#E9ECEF', true: '#5F2EEA' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsValue}>{earnings.toLocaleString()} RWF</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.sectionTitle}>Upcoming Trips</Text>
        {assignedTrips.length > 0 ? (
          assignedTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <Text style={styles.tripTime}>{formatTimestamp(trip.createdAt)}</Text>
              <View style={styles.routeRow}>
                <MapPin size={16} color="#5F2EEA" />
                <Text style={styles.routeText}>From: {trip.pickup?.address || 'Unknown'}</Text>
              </View>
              <View style={styles.routeRow}>
                <MapPin size={16} color="#FF8A00" />
                <Text style={styles.routeText}>To: {trip.destination?.address || 'Unknown'}</Text>
              </View>
              <Text style={styles.tripStatus}>Status: {trip.status}</Text>
              <Text style={styles.tripStatus}>Amount: {trip.amount} RWF</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noTripsText}>No upcoming trips assigned</Text>
        )}
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
    maxHeight: 300,
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
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  acceptedNotification: {
    backgroundColor: '#D4EDDA', // greenish background
  },
  rejectedNotification: {
    backgroundColor: '#F8D7DA', // reddish background
  },
  notificationMessage: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212529',
  },
  notificationDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#495057',
    marginTop: 2,
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
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
  },
  earningsLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
  },
  earningsValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#212529',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginLeft: 24,
    marginBottom: 12,
    color: '#212529',
  },
  tripCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  tripTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  routeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 6,
    color: '#212529',
  },
  tripStatus: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginTop: 6,
    color: '#495057',
  },
  noTripsText: {
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  
});