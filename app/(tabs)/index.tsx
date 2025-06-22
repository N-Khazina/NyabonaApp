import { db } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  TriangleAlert as AlertTriangle,
  Bell,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>('Guest');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.uid) return;

    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) setUserName(snap.data().name ?? 'Guest');
    });

    const unsubscribeTrips = onSnapshot(
      query(
        collection(db, 'bookings'),
        where('clientId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ),
      (snap) => {
        const trips = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              pickup: data.pickup || {},
              destination: data.destination || {},
              status: data.status || '',
              amount: data.amount || 0,
              createdAt: data.createdAt,
              driverName: data.driverName || '',
            };
          })
          .filter((t) => t.status === 'completed');
        setRecentTrips(trips);
      }
    );

    const unsubscribeNotifications = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('clientId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ),
      (snap) => {
        const nots = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setNotifications(nots);

        // ✅ MODIFIED BLOCK START
        nots.forEach((n) => {
          if (!n.read) {
            const msg = (n.message || '').toLowerCase();

            if (msg.includes('accepted')) {
              Alert.alert('Trip Accepted', n.message, [
                {
                  text: 'Track Driver',
                  onPress: () =>
                    router.push({
                      pathname: '/clientMapScreen',
                      params: { bookingId: n.bookingId },
                    }),
                },
              ]);
              markRead(n.id, n.read);
            }

            if (msg.includes('assigned to another driver')) {
              Alert.alert('Trip Update', n.message);
              markRead(n.id, n.read);
            }

            if (n.status === 'info' && msg.includes('trip completed')) {
              const formattedAmount = `${n.amount} RWF`;
              Alert.alert(
                'Trip Completed',
                `Trip completed. Please proceed to payment.\nAmount: ${formattedAmount}`,
                [
                  {
                    text: 'Pay Now',
                    onPress: () =>
                      router.push({
                        pathname: '/paymentScreen',
                        params: {
                          bookingId: n.bookingId,
                          amount: String(n.amount),
                        },
                      }),
                  },
                  { text: 'Later', style: 'cancel' },
                ]
              );
              markRead(n.id, n.read);
            }
          }
        });
        // ✅ MODIFIED BLOCK END
      }
    );

    return () => {
      unsubscribeTrips();
      unsubscribeNotifications();
    };
  }, [user]);

  const markRead = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: !current });
    } catch (err) {
      console.error('Failed update read flag:', err);
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    const isInfo = item.status === 'info';

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          item.read && styles.notificationRead,
          isInfo && styles.notificationInfo,
        ]}
        onPress={() => markRead(item.id, item.read)}
      >
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {item.createdAt
            ? new Date(item.createdAt.seconds * 1000).toLocaleString()
            : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotifications((prev) => !prev)}
        >
          <Bell size={24} color="#212529" />
          {notifications.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* NOTIFICATIONS PANEL */}
      {showNotifications && (
        <View style={styles.notificationPanel}>
          {notifications.length === 0 ? (
            <Text style={styles.noNotificationsText}>No notifications</Text>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(i) => i.id}
              renderItem={renderNotification}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          )}
        </View>
      )}

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.emergencyCardContainer}>
          <LinearGradient
            colors={['#FF4757', '#FF6B81']}
            style={styles.emergencyCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >

            <View style={styles.emergencyCardContent}>
              <AlertTriangle size={24} color="#FFFFFF" />
              <View style={styles.emergencyTextContainer}>
                <Text style={styles.emergencyTitle}>Need Help?</Text>
                <Text style={styles.emergencyText}>
                  Press SOS button in emergency situations
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.sosButton}>
              <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          {/* Your existing quick action buttons */}
        </View>

        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {recentTrips.length > 0 ? (
          recentTrips.map((trip) => (
            <View key={trip.id} style={styles.rideHistoryCard}>
              <View style={styles.rideHistoryHeader}>
                <Text style={styles.rideDate}>
                  {new Date(trip.createdAt.seconds * 1000).toLocaleString()}
                </Text>
                <Text style={styles.rideAmount}>{trip.amount} RWF</Text>
              </View>
              <View style={styles.rideRoute}>
                <View style={styles.routePointContainer}>
                  <View style={[styles.routePoint, styles.startPoint]} />
                  <Text style={styles.routeText}>
                    {trip.pickup.address || 'Unknown'}
                  </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePointContainer}>
                  <View style={[styles.routePoint, styles.endPoint]} />
                  <Text style={styles.routeText}>
                    {trip.destination.address || 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.rideDriverContainer}>
                <Text style={styles.driverLabel}>Driver:</Text>
                <Text style={styles.driverName}>{trip.driverName}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No recent trips</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  userName: {
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
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationPanel: {
    maxHeight: 200,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  notificationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: 'white',
  },
  notificationRead: {
    backgroundColor: '#f0f0f0',
  },
  notificationMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#212529',
  },
  notificationTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  noNotificationsText: {
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    paddingVertical: 20,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  emergencyCardContainer: {
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 16,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  emergencyCardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emergencyTextContainer: { marginLeft: 16 },
  emergencyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  emergencyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  sosButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sosButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#FF4757',
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
    marginTop: 32,
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(95, 46, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
  },
  rideHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  rideHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rideDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  rideAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#212529',
  },
  rideRoute: { marginBottom: 16 },
  routePointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routePoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  startPoint: { backgroundColor: '#5F2EEA' },
  endPoint: { backgroundColor: '#FF8A00' },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#CED4DA',
    marginLeft: 5,
    marginVertical: 4,
  },
  routeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  rideDriverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    marginRight: 8,
  },
  driverName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212529',
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  notificationInfo: {
    backgroundColor: '#fff9db',
    opacity: 0.85,
  },
});
