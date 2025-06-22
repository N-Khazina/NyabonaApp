import { Picker } from '@react-native-picker/picker'; // npm install @react-native-picker/picker
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { app } from '@/firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams();
  const amount = Number(params.amount);
  const tripId = params.bookingId as string;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel'>('mtn');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!phoneNumber) {
      Alert.alert('Validation', 'Please enter your mobile money phone number.');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Validation', 'Please select a payment method.');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Missing Amount', 'Trip amount not found or invalid.');
      return;
    }

    if (!tripId) {
      Alert.alert('Missing Trip ID', 'Trip ID not found.');
      return;
    }

    setLoading(true);

    try {
      const functions = getFunctions(app);
      const initiatePayment = httpsCallable(functions, 'initiateMoMoPayment');

      const response = await initiatePayment({
        amount,
        phoneNumber,
        paymentMethod,
        tripId,
      });

      const data = response.data as {
        success: boolean;
        message?: string;
        status?: string;
        referenceId?: string;
      };

      setLoading(false);

      if (data.success) {
        Alert.alert(
          'Payment Initiated',
          data.message ?? 'Payment request sent. Check your phone to approve.'
        );
        router.back();
      } else {
        Alert.alert('Payment Failed', data.message ?? 'Something went wrong.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Payment error:', error);
      Alert.alert(
        'Error',
        'Failed to initiate payment. Please make sure you entered a valid number and try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Payment</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Amount (RWF)</Text>
          <TextInput
            style={[styles.input, styles.readonlyInput]}
            value={isNaN(amount) ? '' : amount.toFixed(2)}
            editable={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mobile Money Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+250 78 123 4567"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={paymentMethod}
              onValueChange={(itemValue) =>
                setPaymentMethod(itemValue === 'airtel' ? 'airtel' : 'mtn')
              }
              mode="dropdown"
            >
              <Picker.Item label="MTN Mobile Money" value="mtn" />
              <Picker.Item label="Airtel Money" value="airtel" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.payButtonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { padding: 24, flexGrow: 1 },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#212529',
    marginBottom: 24,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  readonlyInput: {
    color: '#6C757D',
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  payButton: {
    marginTop: 24,
    backgroundColor: '#5F2EEA',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
  },
  payButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
