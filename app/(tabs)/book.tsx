import { db } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import * as Location from 'expo-location';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ChevronLeft, MapPin, Navigation, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_LOCATIONS = [
  { id: '1', name: 'Kigali Convention Centre', address: 'KG 2 Roundabout, Kigali' },
  { id: '2', name: 'Kigali International Airport', address: 'KK 15 Ave, Kigali' },
];

export default function BookScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to continue.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const filtered = MOCK_LOCATIONS.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleLocationSelect = (location: any) => {
    setDestination({
      name: location.name,
      address: location.address,
      latitude: currentLocation.latitude + (Math.random() - 0.5) * 0.01,
      longitude: currentLocation.longitude + (Math.random() - 0.5) * 0.01,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRequestDriver = async () => {
    if (!currentLocation || !destination || !user?.uid) {
      Alert.alert('Missing Info', 'Make sure you selected a destination and are logged in.');
      return;
    }

    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        pickup: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        destination: {
          name: destination.name,
          address: destination.address,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Driver request sent successfully!');
      setDestination(null);
    } catch (err) {
      console.error('Booking failed:', err);
      Alert.alert('Error', 'Could not send driver request. Try again later.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <ChevronLeft size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book a Driver</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <MapPin size={20} color="#5F2EEA" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Current Location"
            editable={false}
            value={currentLocation ? 'Current Location' : 'Getting location...'}
          />
        </View>

        <View style={styles.inputContainer}>
          <Navigation size={20} color="#FF8A00" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Where are you going?"
            value={destination ? destination.name : searchQuery}
            onChangeText={setSearchQuery}
          />
          {(searchQuery || destination) && (
            <TouchableOpacity onPress={() => { setDestination(null); setSearchQuery(''); }}>
              <X size={16} color="#6C757D" />
            </TouchableOpacity>
          )}
        </View>

        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleLocationSelect(item)}>
                <Text>{item.name}</Text>
                <Text style={{ color: '#6C757D' }}>{item.address}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {destination && (
        <TouchableOpacity style={styles.bookButton} onPress={handleRequestDriver}>
          <Text style={styles.bookButtonText}>Request Driver</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold', fontSize: 18, color: '#212529',
  },
  searchContainer: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8,
    paddingHorizontal: 12, marginBottom: 12,
  },
  input: {
    flex: 1, fontSize: 16, fontFamily: 'Inter-Regular', color: '#212529',
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  bookButton: {
    backgroundColor: '#5F2EEA', margin: 24,
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-Bold',
  },
});
