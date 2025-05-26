import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { TriangleAlert as AlertTriangle, Bell, Car as CarIcon, Clock, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [recentRides, setRecentRides] = useState<any[]>([]);

  // Fetch user's active and recent rides
  useEffect(() => {
    // Mock data for MVP
    setActiveRides([]);
    setRecentRides([
      {
        id: '1',
        date: 'Yesterday',
        driver: 'Emmanuel K.',
        from: 'Remera, Kigali',
        to: 'Nyamirambo, Kigali',
        amount: 4500,
        status: 'completed',
      },
      {
        id: '2',
        date: 'Last week',
        driver: 'Jean Paul M.',
        from: 'Kacyiru, Kigali',
        to: 'Kimihurura, Kigali',
        amount: 3200,
        status: 'completed',
      },
    ]);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.userName}>{user?.displayName || 'Guest'}</Text>

        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color="#212529" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

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
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/book')}
          >
            <View style={styles.quickActionIconContainer}>
              <MapPin size={24} color="#5F2EEA" />
            </View>
            <Text style={styles.quickActionText}>Book a Driver</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/rental')}
          >
            <View style={styles.quickActionIconContainer}>
              <CarIcon size={24} color="#0FCCCE" />
            </View>
            <Text style={styles.quickActionText}>Rent a Car</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIconContainer, { backgroundColor: 'rgba(255, 138, 0, 0.1)' }]}>
              <Clock size={24} color="#FF8A00" />
            </View>
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
        </View>
        
        {activeRides.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active Ride</Text>
            <View style={styles.activeRideCard}>
              {/* Active ride content here */}
            </View>
          </>
        )}
        
        <Text style={styles.sectionTitle}>Recent Rides</Text>
        {recentRides.length > 0 ? (
          recentRides.map((ride) => (
            <View key={ride.id} style={styles.rideHistoryCard}>
              <View style={styles.rideHistoryHeader}>
                <Text style={styles.rideDate}>{ride.date}</Text>
                <Text style={styles.rideAmount}>{ride.amount} RWF</Text>
              </View>
              
              <View style={styles.rideRoute}>
                <View style={styles.routePointContainer}>
                  <View style={[styles.routePoint, styles.startPoint]} />
                  <Text style={styles.routeText}>{ride.from}</Text>
                </View>
                
                <View style={styles.routeLine} />
                
                <View style={styles.routePointContainer}>
                  <View style={[styles.routePoint, styles.endPoint]} />
                  <Text style={styles.routeText}>{ride.to}</Text>
                </View>
              </View>
              
              <View style={styles.rideDriverContainer}>
                <Text style={styles.driverLabel}>Driver:</Text>
                <Text style={styles.driverName}>{ride.driver}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No recent rides</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4757',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
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
  emergencyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emergencyTextContainer: {
    marginLeft: 16,
  },
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
  activeRideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
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
  rideRoute: {
    marginBottom: 16,
  },
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
  startPoint: {
    backgroundColor: '#5F2EEA',
  },
  endPoint: {
    backgroundColor: '#FF8A00',
  },
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
});