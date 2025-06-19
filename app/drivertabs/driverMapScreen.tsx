import { db } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCiXpzssUm4_XUC4FHX2A7ki5Ccub4SwL8';

export default function DriverMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();

  // Expect tripId from navigation params
  const { tripId } = route.params as { tripId: string };

  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Helper to send notification to client
  const sendNotificationToClient = async (message: string) => {
    if (!tripData?.clientId) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        clientId: tripData.clientId,
        driverId: user?.uid,
        tripId,
        message,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to send notification', error);
    }
  };

  // Load trip data from Firestore
  useEffect(() => {
    if (!tripId) {
      Alert.alert('Error', 'No trip ID provided');
      navigation.goBack();
      return;
    }

    const tripRef = doc(db, 'bookings', tripId);

    const unsubscribe = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTripData(data);
        setLoading(false);
      } else {
        Alert.alert('Error', 'Trip not found');
        navigation.goBack();
      }
    });

    return () => unsubscribe();
  }, [tripId]);

  // Request location permission and start location tracking
  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to track your position.');
        navigation.goBack();
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        async (location) => {
          const { latitude, longitude } = location.coords;
          setDriverLocation({ latitude, longitude });

          // Update driver location in trip doc if status picked_up or enroute
          if (tripData && ['heading_to_pickup', 'picked_up'].includes(tripData.status)) {
            try {
              await updateDoc(doc(db, 'bookings', tripId), {
                driverLocation: {
                  latitude,
                  longitude,
                  updatedAt: serverTimestamp(),
                },
              });
            } catch (error) {
              console.error('Error updating driver location:', error);
            }
          }
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [tripData?.status]);

  // Fetch directions from driver location to pickup or destination
  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverLocation || !tripData) return;

      let destinationCoords;

      if (tripData.status === 'accepted' || tripData.status === 'heading_to_pickup') {
        // Route to pickup location
        destinationCoords = tripData.pickup;
      } else if (tripData.status === 'picked_up') {
        // Route to destination
        destinationCoords = tripData.destination;
      } else {
        setRouteCoords([]);
        return;
      }

      if (!destinationCoords?.latitude || !destinationCoords?.longitude) return;

      const origin = `${driverLocation.latitude},${driverLocation.longitude}`;
      const destination = `${destinationCoords.latitude},${destinationCoords.longitude}`;

      try {
        const resp = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_APIKEY}`
        );
        const json = await resp.json();
        if (json.routes.length) {
          const points = decodePolyline(json.routes[0].overview_polyline.points);
          setRouteCoords(points);
        }
      } catch (error) {
        console.error('Failed to fetch directions', error);
      }
    };

    fetchRoute();
  }, [driverLocation, tripData]);

  // Decode Google polyline to LatLng[]
  const decodePolyline = (t: string, e = 5) => {
    let points = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < t.length) {
      let b, shift = 0,
        result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  // Status update handlers
  const handleOnMyWay = async () => {
    try {
      await updateDoc(doc(db, 'bookings', tripId), { status: 'heading_to_pickup' });
      await sendNotificationToClient('Driver is on the way to pick you up!');
      Alert.alert('Status updated', 'You are on the way to pickup location.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
      console.error(error);
    }
  };

  const handlePickedUp = async () => {
    try {
      await updateDoc(doc(db, 'bookings', tripId), { status: 'picked_up' });
      await sendNotificationToClient('Driver has picked you up. Trip started!');
      Alert.alert('Status updated', 'Trip started.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
      console.error(error);
    }
  };

  const handleArrived = async () => {
    try {
      await updateDoc(doc(db, 'bookings', tripId), { status: 'completed' });
      await sendNotificationToClient('Trip completed. Please proceed to payment.');
      Alert.alert('Status updated', 'You have arrived at the destination.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading trip info...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {driverLocation && (
        <MapView
          style={styles.map}
          showsUserLocation
          followsUserLocation
          region={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Pickup Marker */}
          {tripData.pickup?.latitude && tripData.pickup?.longitude && (
            <Marker
              coordinate={{ latitude: tripData.pickup.latitude, longitude: tripData.pickup.longitude }}
              title="Pickup Location"
              pinColor="green"
            />
          )}

          {/* Destination Marker */}
          {tripData.destination?.latitude && tripData.destination?.longitude && (
            <Marker
              coordinate={{ latitude: tripData.destination.latitude, longitude: tripData.destination.longitude }}
              title="Destination"
              pinColor="red"
            />
          )}

          {/* Route Polyline */}
          {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />}
        </MapView>
      )}

      {/* Status & Action Buttons */}
      <View style={styles.statusContainer}>
        <Text style={styles.tripStatusText}>Trip Status: {tripData.status}</Text>

        {tripData.status === 'accepted' && (
          <Button title="On my way" onPress={handleOnMyWay} />
        )}

        {tripData.status === 'heading_to_pickup' && (
          <Button title="Picked Up" onPress={handlePickedUp} />
        )}

        {tripData.status === 'picked_up' && (
          <Button title="Arrived" onPress={handleArrived} />
        )}

        {(tripData.status === 'completed' || tripData.status === 'cancelled') && (
          <Text style={{ textAlign: 'center', marginTop: 10 }}>
            Trip {tripData.status === 'completed' ? 'completed' : 'cancelled'}.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  statusContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  tripStatusText: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
