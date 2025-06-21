import { db } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCiXpzssUm4_XUC4FHX2A7ki5Ccub4SwL8';

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * DriverMapScreen component provides an interactive map interface for drivers
 * to manage their assigned trips. It tracks the driver's location, fetches
 * routes, and updates trip status in real-time. The driver can notify the client
 * of their status (on the way, picked up, arrived) via notifications. The component
 * also displays the driver's current location, pickup and destination markers,
 * and the route on the map.
 */

/*******  52b17bd9-01a8-45ba-9e14-b3dbeee2f5af  *******/
export default function DriverMapScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string | undefined;

  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const sendNotificationToClient = async (message: string) => {
    if (!tripData?.clientId) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        clientId: tripData.clientId,
        driverId: user?.uid,
        bookingId,
        message,
        status: 'info',
        createdAt: serverTimestamp(),
        read: false,
        pickupAddress: tripData.pickup?.address || '',
        destinationAddress: tripData.destination?.address || '',
        amount: tripData.amount || 0,
        senderRole: 'driver',
      });
    } catch (error) {
      console.error('Failed to send notification', error);
    }
  };

  useEffect(() => {
    if (!bookingId) {
      Alert.alert('Error', 'No booking ID provided.');
      router.back();
      return;
    }

    const tripRef = doc(db, 'bookings', bookingId);
    const unsubscribe = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        setTripData(docSnap.data());
        setLoading(false);
      } else {
        Alert.alert('Error', 'Booking not found');
        router.back();
      }
    });

    return () => unsubscribe();
  }, [bookingId]);

  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        router.back();
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        async (location) => {
          const { latitude, longitude } = location.coords;
          const current = { latitude, longitude };
          setDriverLocation(current);

          if (tripData && ['heading_to_pickup', 'picked_up'].includes(tripData.status)) {
            await updateDoc(doc(db, 'bookings', bookingId!), {
              driverLocation: { ...current, updatedAt: serverTimestamp() },
            });
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

  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverLocation || !tripData) return;

      let destinationCoords;

      if (tripData.status === 'accepted' || tripData.status === 'heading_to_pickup') {
        destinationCoords = tripData.pickup?.coordinates;
      } else if (tripData.status === 'picked_up') {
        destinationCoords = tripData.destination?.coordinates;
      } else {
        setRouteCoords([]);
        return;
      }

      if (!destinationCoords?.latitude || !destinationCoords?.longitude) return;

      const origin = `${driverLocation.latitude},${driverLocation.longitude}`;
      const destination = `${destinationCoords.latitude},${destinationCoords.longitude}`;

      try {
        setRouteLoading(true);
        const resp = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_APIKEY}`
        );
        const json = await resp.json();
        if (json.routes.length) {
          const points = decodePolyline(json.routes[0].overview_polyline.points);
          setRouteCoords(points);
        } else {
          console.warn('No routes found in response');
          setRouteCoords([]);
        }
      } catch (error) {
        console.error('Failed to fetch directions', error);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [driverLocation, tripData?.status]);

  const decodePolyline = (t: string, e = 5) => {
    let points = [], index = 0, lat = 0, lng = 0;
    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const handleOnMyWay = async () => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId!), { status: 'heading_to_pickup' });
      await sendNotificationToClient('Driver is on the way to pick you up!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handlePickedUp = async () => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId!), { status: 'picked_up' });
      await sendNotificationToClient('Driver has picked you up. Trip started!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleArrived = async () => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId!), { status: 'completed' });
      await sendNotificationToClient('Trip completed. Please proceed to payment.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
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
          {tripData.pickup?.coordinates?.latitude && tripData.pickup?.coordinates?.longitude && (
            <Marker
              coordinate={tripData.pickup.coordinates}
              title="Pickup Location"
              pinColor="green"
            />
          )}
          {tripData.destination?.coordinates?.latitude && tripData.destination?.coordinates?.longitude && (
            <Marker
              coordinate={tripData.destination.coordinates}
              title="Destination"
              pinColor="red"
            />
          )}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />
          )}
        </MapView>
      )}

      <View style={styles.statusContainer}>
        <Text style={styles.tripStatusText}>Trip Status: {tripData.status}</Text>
        {routeLoading && <Text style={{ textAlign: 'center' }}>Fetching route...</Text>}
        {tripData.status === 'accepted' && <Button title="On my way" onPress={handleOnMyWay} />}
        {tripData.status === 'heading_to_pickup' && <Button title="Picked Up" onPress={handlePickedUp} />}
        {tripData.status === 'picked_up' && <Button title="Arrived" onPress={handleArrived} />}
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
