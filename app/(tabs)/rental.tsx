import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Car, User, Filter } from 'lucide-react-native';

// Mock car data for MVP
const MOCK_CARS = [
  {
    id: '1',
    name: 'Toyota RAV4',
    image: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    price: 35000,
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Hybrid',
    year: 2022,
    category: 'SUV',
    available: true,
  },
  {
    id: '2',
    name: 'Honda Civic',
    image: 'https://images.pexels.com/photos/1104768/pexels-photo-1104768.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    price: 25000,
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2021,
    category: 'Sedan',
    available: true,
  },
  {
    id: '3',
    name: 'Mercedes C-Class',
    image: 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    price: 50000,
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Diesel',
    year: 2023,
    category: 'Luxury',
    available: true,
  },
  {
    id: '4',
    name: 'Hyundai Tucson',
    image: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    price: 30000,
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Petrol',
    year: 2022,
    category: 'SUV',
    available: true,
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'suv', name: 'SUV' },
  { id: 'sedan', name: 'Sedan' },
  { id: 'luxury', name: 'Luxury' },
  { id: 'compact', name: 'Compact' },
];

export default function RentalScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRentalType, setSelectedRentalType] = useState<'self' | 'driver'>('self');

  const filteredCars = selectedCategory === 'all' 
    ? MOCK_CARS 
    : MOCK_CARS.filter(car => car.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rent a Car</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#212529" />
        </TouchableOpacity>
      </View>

      <View style={styles.rentalTypeContainer}>
        <TouchableOpacity 
          style={[
            styles.rentalTypeButton, 
            selectedRentalType === 'self' && styles.selectedRentalTypeButton
          ]}
          onPress={() => setSelectedRentalType('self')}
        >
          <Car 
            size={20} 
            color={selectedRentalType === 'self' ? '#FFFFFF' : '#212529'} 
          />
          <Text 
            style={[
              styles.rentalTypeText,
              selectedRentalType === 'self' && styles.selectedRentalTypeText
            ]}
          >
            Self-Drive
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.rentalTypeButton, 
            selectedRentalType === 'driver' && styles.selectedRentalTypeButton
          ]}
          onPress={() => setSelectedRentalType('driver')}
        >
          <User 
            size={20} 
            color={selectedRentalType === 'driver' ? '#FFFFFF' : '#212529'} 
          />
          <Text 
            style={[
              styles.rentalTypeText,
              selectedRentalType === 'driver' && styles.selectedRentalTypeText
            ]}
          >
            With Driver
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.categoryButton,
                selectedCategory === item.id && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text 
                style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.selectedCategoryText
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredCars}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.carsList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.carCard}>
            <Image 
              source={{ uri: item.image }}
              style={styles.carImage}
            />
            <View style={styles.carInfo}>
              <View style={styles.carNamePriceContainer}>
                <Text style={styles.carName}>{item.name}</Text>
                <Text style={styles.carPrice}>{item.price.toLocaleString()} RWF/day</Text>
              </View>
              
              <View style={styles.carDetails}>
                <View style={styles.carDetailItem}>
                  <User size={16} color="#6C757D" />
                  <Text style={styles.carDetailText}>{item.seats} seats</Text>
                </View>
                
                <View style={styles.carDetailItem}>
                  <Calendar size={16} color="#6C757D" />
                  <Text style={styles.carDetailText}>{item.year}</Text>
                </View>
                
                <View style={styles.carDetailItem}>
                  <Car size={16} color="#6C757D" />
                  <Text style={styles.carDetailText}>{item.transmission}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.rentButton}>
                <Text style={styles.rentButtonText}>Rent Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
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
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#212529',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rentalTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  rentalTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  selectedRentalTypeButton: {
    backgroundColor: '#5F2EEA',
  },
  rentalTypeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212529',
    marginLeft: 8,
  },
  selectedRentalTypeText: {
    color: '#FFFFFF',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  categoriesList: {
    paddingHorizontal: 24,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: 'rgba(95, 46, 234, 0.1)',
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6C757D',
  },
  selectedCategoryText: {
    color: '#5F2EEA',
  },
  carsList: {
    padding: 24,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  carImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  carInfo: {
    padding: 16,
  },
  carNamePriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  carName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212529',
  },
  carPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#5F2EEA',
  },
  carDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  carDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  carDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 4,
  },
  rentButton: {
    backgroundColor: '#5F2EEA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rentButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});