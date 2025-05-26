import { Car as CarIcon, Fuel, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type CarProps = {
  name: string;
  seats: number;
  transmission: string;
  fuel: string;
  color?: string;
};

export default function Car({ name, seats, transmission, fuel, color = '#5F2EEA' }: CarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <CarIcon size={24} color={color} />
      </View>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Users size={16} color="#6C757D" />
          <Text style={styles.detailText}>{seats} seats</Text>
        </View>
        <View style={styles.detailItem}>
          <Fuel size={16} color="#6C757D" />
          <Text style={styles.detailText}>{fuel}</Text>
        </View>
      </View>
      <Text style={styles.transmission}>{transmission}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(95, 46, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#212529',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 4,
  },
  transmission: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#5F2EEA',
  },
});