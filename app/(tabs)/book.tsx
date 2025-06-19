// MODIFIED: BookScreen with driver matching, trip amount, and notification creation with accept/reject feature
import { db } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import * as Location from 'expo-location';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCiXpzssUm4_XUC4FHX2A7ki5Ccub4SwL8';

export default function BookScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const { user } = useAuth();

  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [selecting, setSelecting] = useState<'pickup' | 'destination'>('pickup');
  const [distanceInKm, setDistanceInKm] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required.');
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
    if (pickup && destination) fetchRoute();
  }, [pickup, destination]);

  const fetchRoute = async () => {
    const origin = `${pickup?.latitude},${pickup?.longitude}`;
    const dest = `${destination?.latitude},${destination?.longitude}`;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.routes.length) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);

        const meters = data.routes[0].legs[0].distance.value;
        setDistanceInKm(meters / 1000);
      } else {
        setRouteCoords([]);
      }
    } catch (err) {
      console.error('Route fetch error:', err);
    }
  };

  const decodePolyline = (t: string): LatLng[] => {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const reverseGeocode = async (coord: LatLng): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.latitude},${coord.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      return data.results[0]?.formatted_address || '';
    } catch (error) {
      console.error('Geocoding failed:', error);
      return '';
    }
  };

  const handleMapPress = async (e: any) => {
    const coord = e.nativeEvent.coordinate;
    if (selecting === 'pickup') {
      setPickup(coord);
      setRouteCoords([]);
      const address = await reverseGeocode(coord);
      setPickupAddress(address);
      setSelecting('destination');
    } else {
      setDestination(coord);
      const address = await reverseGeocode(coord);
      setDestinationAddress(address);
    }
  };

  const findNearestAvailableDriver = async (pickup: LatLng): Promise<{ uid: string; currentLocation: LatLng } | null> => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, where('role', '==', 'driver'), where('available', '==', true)));
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

  const handleConfirmBooking = async () => {
    if (!pickup || !destination || !user?.uid || !distanceInKm) {
      Alert.alert('Missing Info', 'Select pickup, destination and ensure route is calculated.');
      return;
    }

    const nearestDriver = await findNearestAvailableDriver(pickup);
    if (!nearestDriver) {
      Alert.alert('No drivers', 'No available drivers found nearby.');
      return;
    }

    const amount = parseFloat((distanceInKm * 500).toFixed(2));

    try {
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        driverId: nearestDriver.uid,
        pickup: {
          coordinates: pickup,
          address: pickupAddress,
        },
        destination: {
          coordinates: destination,
          address: destinationAddress,
        },
        distance: distanceInKm,
        amount,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        driverId: nearestDriver.uid,
        message: `New trip from ${pickupAddress} to ${destinationAddress}`,
        bookingId: bookingRef.id,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert('Booking Sent', `Waiting for driver confirmation. Estimated price: ${amount} RWF`);
      setPickup(null);
      setPickupAddress('');
      setDestination(null);
      setDestinationAddress('');
      setRouteCoords([]);
      setSelecting('pickup');
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Tap on the map to select your pickup and destination locations.
        </Text>
        {pickupAddress ? <Text>Pickup: {pickupAddress}</Text> : null}
        {destinationAddress ? <Text>Destination: {destinationAddress}</Text> : null}
        {distanceInKm ? (
          <Text>Distance: {distanceInKm.toFixed(2)} km</Text>
        ) : null}
      </View>

      {currentLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
        >
          {pickup && <Marker coordinate={pickup} title="Pickup" pinColor="green" />}
          {destination && <Marker coordinate={destination} title="Destination" pinColor="red" />}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#5F2EEA" />
          )}
        </MapView>
      )}

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking}>
        <Text style={styles.confirmButtonText}>Confirm Booking</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  instructions: { padding: 16, backgroundColor: '#FFF' },
  instructionsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  map: { flex: 1 },
  confirmButton: {
    backgroundColor: '#5F2EEA',
    margin: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});
