import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Car as CarIcon, MapPin, UserCheck } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(95, 46, 234, 0.1)', 'rgba(15, 204, 206, 0.1)']}
        style={styles.gradient}
      />
      
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Nyabona</Text>
        <Text style={styles.tagline}>Drive Safe, Drive Smart</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <UserCheck size={28} color="#5F2EEA" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Verified Drivers</Text>
            <Text style={styles.featureDescription}>All our drivers are verified and trained</Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <MapPin size={28} color="#5F2EEA" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Real-time Tracking</Text>
            <Text style={styles.featureDescription}>Track your driver in real-time</Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <CarIcon size={28} color="#5F2EEA" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Car Rental</Text>
            <Text style={styles.featureDescription}>Rent a car with or without a driver</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          activeOpacity={0.8}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          activeOpacity={0.8}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  logo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 42,
    color: '#5F2EEA',
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6C757D',
    marginTop: 8,
  },
  featuresContainer: {
    marginTop: 60,
    paddingHorizontal: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  featureIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(95, 46, 234, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#5F2EEA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5F2EEA',
  },
  secondaryButtonText: {
    color: '#5F2EEA',
  },
});