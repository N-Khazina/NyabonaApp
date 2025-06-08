import { auth } from '@/firebaseConfig';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRouter } from 'expo-router';
import { PhoneAuthProvider } from 'firebase/auth';
import { ChevronLeft, Phone } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{ phone?: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { phone?: string } = {};
    if (!phoneNumber || phoneNumber.length < 9) newErrors.phone = 'Please enter a valid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const fullPhone = `+250${phoneNumber}`;
      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(fullPhone, recaptchaVerifier.current!);
      router.push({
        pathname: '/(auth)/verify',
        params: {
          verificationId: id,
          phone: fullPhone,
        },
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      setErrors({ phone: 'Failed to send verification code. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={auth.app.options}
          attemptInvisibleVerification={true}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#212529" />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Login</Text>
          <Text style={styles.headerSubtitle}>Access your Nyabona account</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Phone size={16} color="#6C757D" />
                <Text style={styles.countryCodeText}>+250</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="78XXXXXXX"
                placeholderTextColor="#ADB5BD"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setErrors({ ...errors, phone: undefined });
                }}
                editable={!loading}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Sending...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  backButton: {
    marginTop: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerContainer: { marginTop: 32 },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#212529',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6C757D',
  },
  formContainer: { marginTop: 48 },
  inputGroup: { marginBottom: 24 },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRightWidth: 1,
    borderRightColor: '#CED4DA',
  },
  countryCodeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#212529',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#DC3545',
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: '#5F2EEA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  registerLink: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#5F2EEA',
    marginLeft: 4,
  },
});
