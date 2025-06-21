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
import haversine from 'haversine-distance';
import React, { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import MapView, { LatLng, Marker, Polyline, Region } from 'react-native-maps';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCiXpzssUm4_XUC4FHX2A7ki5Ccub4SwL8';

export default function ClientMapScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string | undefined;

  const [tripData, setTripData] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [clientLocation, setClientLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [eta, setEta] = useState<string>('');
  const [region, setRegion] = useState<Region | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const getClientLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setClientLocation(coords);
    };
    getClientLocation();
  }, []);

  useEffect(() => {
    if (!bookingId) {
      router.replace('/(tabs)');
      return;
    }

    const tripRef = doc(db, 'bookings', bookingId);
    const unsubscribe = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTripData(data);
        if (data.driverLocation) {
          const coords = {
            latitude: data.driverLocation.latitude,
            longitude: data.driverLocation.longitude,
          };
          setDriverLocation(coords);
        }
        setLoading(false);
      } else {
        router.replace('/(tabs)');
      }
    });

    return () => unsubscribe();
  }, [bookingId]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverLocation || !tripData) return;

      let originCoords = driverLocation;
      let destinationCoords;

      if (tripData.status === 'accepted' || tripData.status === 'heading_to_pickup') {
        destinationCoords = tripData.pickup?.coordinates;
      } else if (tripData.status === 'picked_up') {
        originCoords = tripData.pickup?.coordinates;
        destinationCoords = tripData.destination?.coordinates;
      } else {
        setRouteCoords([]);
        return;
      }

      if (!originCoords || !destinationCoords) return;

      const origin = `${originCoords.latitude},${originCoords.longitude}`;
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
          const duration = json.routes[0].legs[0]?.duration?.text;
          if (duration) setEta(duration);

          // Calculate distance so far
          if (points.length > 1) {
            let distance = 0;
            for (let i = 1; i < points.length; i++) {
              distance += haversine(points[i - 1], points[i]);
            }
            setDistanceTraveled(distance / 1000); // in km
          }
        } else {
          setRouteCoords([]);
        }
      } catch (error) {
        console.error('Failed to fetch route', error);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [driverLocation, tripData?.status]);

  const centerMap = () => {
    if (mapRef.current && driverLocation && clientLocation) {
      mapRef.current.fitToCoordinates([driverLocation, clientLocation], {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    }
  };

  const decodePolyline = (t: string, e = 5) => {
    let points = [], index = 0, lat = 0, lng = 0;
    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };
const handleCancelTrip = async () => {
  try {
    const baseFare = 500;
    const ratePerKm = 300;
    const pickupFee = 0.15;
    const tripFare = baseFare + distanceTraveled * ratePerKm;
    const pickupLoss = tripData?.amount * pickupFee;
    const totalDue = Math.round(tripFare + pickupLoss);

    await updateDoc(doc(db, 'bookings', bookingId!), {
      status: 'completed',
      amount: totalDue,
    });

    await addDoc(collection(db, 'notifications'), {
      clientId: tripData.clientId,
      driverId: tripData.driverId,
      bookingId,
      status: 'info',
      read: false,
      message: `Trip cancelled. Distance traveled: ${distanceTraveled.toFixed(2)} km. You are charged RWF ${totalDue} including 15% pickup compensation.`,
      amount: totalDue,
      pickupAddress: tripData.pickup?.address || '',
      destinationAddress: tripData.destination?.address || '',
      senderRole: 'system',  // Since system triggers the cancellation notification
      createdAt: serverTimestamp(),
    });

    router.replace('/(tabs)');
  } catch (error) {
    console.error('Trip cancelation failed', error);
  }
};

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading trip details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        region={region ?? undefined}
      >
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Driver" pinColor="blue" />
        )}
        {tripData.pickup?.coordinates && (
          <Marker coordinate={tripData.pickup.coordinates} title="Pickup" pinColor="green" />
        )}
        {tripData.destination?.coordinates && (
          <Marker coordinate={tripData.destination.coordinates} title="Destination" pinColor="red" />
        )}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />
        )}
      </MapView>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Trip Status: {tripData.status}</Text>
        {eta && <Text style={{ textAlign: 'center' }}>ETA: {eta}</Text>}

        <Button title="Zoom to Fit" onPress={centerMap} />

        {tripData.status !== 'completed' && tripData.status !== 'cancelled' && (
          <View style={{ marginTop: 10 }}>
            <Button title="Cancel Trip" onPress={handleCancelTrip} color="red" />
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          <Button title="Go Back Home" onPress={handleGoHome} />
        </View>

        {(tripData.status === 'completed' || tripData.status === 'cancelled') && (
          <Text style={{ textAlign: 'center', marginTop: 10 }}>
            Trip {tripData.status}.
          </Text>
        )}

        {routeLoading && (
          <Text style={{ textAlign: 'center', marginTop: 10 }}>Loading route...</Text>
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
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
