import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, MapPin, Navigation, X } from 'lucide-react-native';
import * as Location from 'expo-location';

// Only define map types when not on web
type MapViewType = any;
type MarkerType = any;
type ProviderType = any;

// Only import map components on native platforms
let MapView: MapViewType = null;
let Marker: MarkerType = null;
let PROVIDER_GOOGLE: ProviderType = null;

// Ensure this code block never runs on web
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps?.default;
  Marker = Maps?.Marker;
  PROVIDER_GOOGLE = Maps?.PROVIDER_GOOGLE;
}

// Mock driver data for MVP
const MOCK_DRIVERS = [
  {
    id: '1',
    name: 'Jean Paul',
    rating: 4.8,
    distance: '5 min away',
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    vehicle: 'Toyota Corolla',
    vehicleColor: 'White',
    licensePlate: 'RAC 123 A',
  },
  {
    id: '2',
    name: 'Marie Claire',
    rating: 4.9,
    distance: '8 min away',
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    vehicle: 'Honda Civic',
    vehicleColor: 'Silver',
    licensePlate: 'RAE 456 B',
  },
  {
    id: '3',
    name: 'Emmanuel',
    rating: 4.7,
    distance: '12 min away',
    profileImage: 'https://randomuser.me/api/portraits/men/67.jpg',
    vehicle: 'Hyundai Elantra',
    vehicleColor: 'Blue',
    licensePlate: 'RAF 789 C',
  },
];

// Mock locations for search
const MOCK_LOCATIONS = [
  { id: '1', name: 'Kigali Convention Centre', address: 'KG 2 Roundabout, Kigali' },
  { id: '2', name: 'Kigali International Airport', address: 'KK 15 Ave, Kigali' },
  { id: '3', name: 'Nyamirambo Stadium', address: 'Nyamirambo, Kigali' },
  { id: '4', name: 'Kigali Heights', address: 'KG 7 Ave, Kacyiru, Kigali' },
  { id: '5', name: 'Remera Bus Station', address: 'KK 500 St, Remera, Kigali' },
];

export default function BookScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [bookingStage, setBookingStage] = useState<'initial' | 'searching' | 'driverFound' | 'driverConfirmed'>('initial');

  // Request location permissions and get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Filter locations based on search query
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
    // In a real app, we would geocode the address to get coordinates
    // For MVP, we'll just use mock coordinates
    setDestination({
      latitude: currentLocation.latitude + (Math.random() - 0.5) * 0.01,
      longitude: currentLocation.longitude + (Math.random() - 0.5) * 0.01,
      name: location.name,
      address: location.address,
    });
    setSearchQuery('');
    setSearchResults([]);

    // Fit map to show both points
    if (Platform.OS !== 'web' && currentLocation && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [currentLocation, destination],
        {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        }
      );
    }
  };

  const handleRequestDriver = () => {
    setBookingStage('searching');
    
    // Simulate finding a driver after 2 seconds
    setTimeout(() => {
      setSelectedDriver(MOCK_DRIVERS[0]);
      setBookingStage('driverFound');
      setShowModal(true);
    }, 2000);
  };

  const handleConfirmDriver = () => {
    setBookingStage('driverConfirmed');
  };

  const handleCancelBooking = () => {
    setBookingStage('initial');
    setSelectedDriver(null);
    setShowModal(false);
  };

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.map, styles.webMapPlaceholder]}>
          <Text style={styles.webMapText}>Maps are not supported on web platform</Text>
          {currentLocation && (
            <Text style={styles.webLocationText}>
              Current Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          )}
          {destination && (
            <Text style={styles.webLocationText}>
              Destination: {destination.name}
            </Text>
          )}
        </View>
      );
    }

    // Only render map components on native platforms
    if (Platform.OS !== 'web' && MapView && Marker && currentLocation) {
      return (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="#5F2EEA"
          />
          {destination && (
            <Marker
              coordinate={destination}
              title={destination.name}
              pinColor="#FF8A00"
            />
          )}
        </MapView>
      );
    }

    return null;
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
        <View style={styles.locationInputs}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <MapPin size={20} color="#5F2EEA" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Your current location"
              value={currentLocation ? "Current Location" : "Loading..."}
              editable={false}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Navigation size={20} color="#FF8A00" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Where are you going?"
              value={destination ? destination.name : searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchResults(searchQuery.length > 2 ? MOCK_LOCATIONS : [])}
            />
            {(searchQuery || destination) && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery('');
                  setDestination(null);
                }}
              >
                <X size={16} color="#6C757D" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => handleLocationSelect(item)}
                >
                  <MapPin size={20} color="#6C757D" />
                  <View style={styles.searchResultTextContainer}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultAddress}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {renderMap()}

      {destination && bookingStage === 'initial' && (
        <View style={styles.bookButtonContainer}>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={handleRequestDriver}
          >
            <Text style={styles.bookButtonText}>Request Sober Driver</Text>
          </TouchableOpacity>
        </View>
      )}

      {bookingStage === 'searching' && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Finding drivers near you...</Text>
        </View>
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {bookingStage === 'driverFound' ? 'Driver Found!' : 'Your Driver is Coming'}
              </Text>
              {bookingStage === 'driverFound' && (
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowModal(false)}
                >
                  <X size={20} color="#6C757D" />
                </TouchableOpacity>
              )}
            </View>
            
            {selectedDriver && (
              <>
                <View style={styles.driverInfoContainer}>
                  <Image 
                    source={{ uri: selectedDriver.profileImage }}
                    style={styles.driverImage}
                  />
                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{selectedDriver.name}</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingText}>{selectedDriver.rating} ★</Text>
                      <Text style={styles.distanceText}>{selectedDriver.distance}</Text>
                    </View>
                    <View style={styles.vehicleContainer}>
                      <Text style={styles.vehicleText}>
                        {selectedDriver.vehicle} • {selectedDriver.vehicleColor}
                      </Text>
                      <Text style={styles.licensePlateText}>{selectedDriver.licensePlate}</Text>
                    </View>
                  </View>
                </View>
                
                {destination && (
                  <View style={styles.tripDetailsContainer}>
                    <Text style={styles.tripDetailsTitle}>Trip Details</Text>
                    <View style={styles.tripDetailsContent}>
                      <View style={styles.routePointContainer}>
                        <View style={[styles.routePoint, styles.startPoint]} />
                        <Text style={styles.routeText}>Current Location</Text>
                      </View>
                      
                      <View style={styles.routeLine} />
                      
                      <View style={styles.routePointContainer}>
                        <View style={[styles.routePoint, styles.endPoint]} />
                        <Text style={styles.routeText}>{destination.name}</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {bookingStage === 'driverFound' ? (
                  <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={handleCancelBooking}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={handleConfirmDriver}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.driverContactContainer}>
                    <TouchableOpacity style={styles.contactButton}>
                      <Text style={styles.contactButtonText}>Call Driver</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.contactButton}>
                      <Text style={styles.contactButtonText}>Send Message</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.contactButton, styles.cancelRideButton]}
                      onPress={handleCancelBooking}
                    >
                      <Text style={styles.cancelRideButtonText}>Cancel Ride</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#212529',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 1,
  },
  locationInputs: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#212529',
  },
  clearButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 16,
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchResultTextContainer: {
    marginLeft: 12,
  },
  searchResultName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212529',
  },
  searchResultAddress: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  map: {
    flex: 1,
    zIndex: 0,
  },
  webMapPlaceholder: {
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 16,
  },
  webLocationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
    marginVertical: 4,
  },
  bookButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  bookButton: {
    backgroundColor: '#5F2EEA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bookButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#212529',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#212529',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  driverImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FF8A00',
    marginRight: 8,
  },
  distanceText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  vehicleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
  },
  licensePlateText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#212529',
  },
  tripDetailsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tripDetailsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#212529',
    marginBottom: 16,
  },
  tripDetailsContent: {},
  routePointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#6C757D',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#5F2EEA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  driverContactContainer: {
    marginTop: 16,
  },
  contactButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  contactButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#5F2EEA',
  },
  cancelRideButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  cancelRideButtonText: {
    color: '#DC3545',
  },
});