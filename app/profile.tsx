import { app } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import {
  Bell,
  ChevronRight,
  CreditCard,
  CircleHelp as HelpCircle,
  LogOut,
  Settings,
  Shield,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileData, setProfileData] = useState({ name: '', imageUrl: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.uid) return;
        const db = getFirestore(app);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            name: data.name || '',
            imageUrl: data.profileImageURL || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.uid]);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to log out?')) {
        logout();
        router.push('/(auth)');
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.push('/(auth)');
          },
        },
      ]);
    }
  };

  const handleEditProfile = () => {
    router.push('/profileSetup');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#212529" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileImageWrapper}>
            {profileData.imageUrl ? (
              <Image source={{ uri: profileData.imageUrl }} style={styles.largeProfileImage} />
            ) : (
              <View style={styles.largeProfileImagePlaceholder}>
                <User size={50} color="#5F2EEA" />
              </View>
            )}
            <Text style={styles.profileName}>{profileData.name || 'No Name'}</Text>
            <Text style={styles.profilePhone}>{user?.phoneNumber || '+250 xxxxxxxx'}</Text>
          </View>

          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(95, 46, 234, 0.1)' }]}>
                  <User size={20} color="#5F2EEA" />
                </View>
                <Text style={styles.menuItemText}>Personal Information</Text>
              </View>
              <ChevronRight size={20} color="#ADB5BD" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(15, 204, 206, 0.1)' }]}>
                  <CreditCard size={20} color="#0FCCCE" />
                </View>
                <Text style={styles.menuItemText}>Payment Methods</Text>
              </View>
              <ChevronRight size={20} color="#ADB5BD" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(255, 138, 0, 0.1)' }]}>
                  <Bell size={20} color="#FF8A00" />
                </View>
                <Text style={styles.menuItemText}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E9ECEF', true: '#5F2EEA' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(40, 167, 69, 0.1)' }]}>
                  <Shield size={20} color="#28A745" />
                </View>
                <Text style={styles.menuItemText}>Security</Text>
              </View>
              <ChevronRight size={20} color="#ADB5BD" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(15, 204, 206, 0.1)' }]}>
                  <HelpCircle size={20} color="#0FCCCE" />
                </View>
                <Text style={styles.menuItemText}>Help Center</Text>
              </View>
              <ChevronRight size={20} color="#ADB5BD" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(255, 138, 0, 0.1)' }]}>
                  <Shield size={20} color="#FF8A00" />
                </View>
                <Text style={styles.menuItemText}>Privacy Policy</Text>
              </View>
              <ChevronRight size={20} color="#ADB5BD" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#DC3545" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
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
  headerTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: '#212529' },
  settingsButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center',
  },
  scrollView: { flex: 1 },
  profileCard: {
    margin: 24, padding: 24, backgroundColor: '#FFFFFF',
    borderRadius: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 4,
  },
  profileImageWrapper: { alignItems: 'center', marginBottom: 16 },
  largeProfileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  largeProfileImagePlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(95, 46, 234, 0.1)', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  profileName: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#212529', marginBottom: 4 },
  profilePhone: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#6C757D' },
  editProfileButton: {
    marginTop: 12, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: '#5F2EEA', borderRadius: 50,
  },
  editProfileButtonText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 16 },
  section: { marginHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#212529', marginBottom: 12 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconContainer: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  menuItemText: { fontFamily: 'Inter-Medium', fontSize: 16, color: '#212529' },
  divider: { height: 1, backgroundColor: '#E9ECEF', marginHorizontal: 16 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 24, marginTop: 24, paddingVertical: 12,
    backgroundColor: 'rgba(220, 53, 69, 0.1)', borderRadius: 50,
  },
  logoutButtonText: {
    fontFamily: 'Poppins-SemiBold', color: '#DC3545', fontSize: 16, marginLeft: 8,
  },
  versionText: {
    textAlign: 'center', fontFamily: 'Inter-Regular', fontSize: 14, color: '#6C757D',
    marginTop: 12, marginBottom: 24,
  },
});
