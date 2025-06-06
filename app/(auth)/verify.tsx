import { firebaseConfig } from '@/firebaseConfig';
import useAuth from '@/hooks/useAuth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESEND_COOLDOWN = 30;

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, verificationId: initialVerificationId } = useLocalSearchParams<{
    phone: string;
    verificationId: string;
  }>();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(
    initialVerificationId || null
  );

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null!);

  const { verifyCode, resendCode, error } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResendOtp = async () => {
    if (!canResend || !phone) return;

    try {
      if (!recaptchaVerifier.current) throw new Error('Recaptcha not ready');
      const newVerificationId = await resendCode(recaptchaVerifier);
      setVerificationId(newVerificationId);
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend error:', err);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length === 1 && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!verificationId) {
      console.warn('Verification ID missing');
      return;
    }

    const otpString = otp.join('');
    if (!/^\d{6}$/.test(otpString)) {
      console.warn('Invalid OTP format');
      return;
    }

    try {
      const user = await verifyCode(verificationId, otpString);

      if (user) {
        const { creationTime, lastSignInTime } = user.metadata;

        const isNewUser = creationTime === lastSignInTime;
        if (isNewUser) {
          router.replace('/profileSetup'); // ✅
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  const errorText = error ? error : null;

  return (
    <>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#212529" />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Verification</Text>
          <Text style={styles.headerSubtitle}>
            We have sent a verification code to your phone
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref: TextInput | null) => {
                inputRefs.current[index] = ref;
              }}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              returnKeyType="done"
              autoFocus={index === 0}
            />
          ))}
        </View>

        {errorText && <Text style={styles.errorText}>{errorText}</Text>}

        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleResendOtp}
          disabled={!canResend}
        >
          <Text style={[styles.resendText, !canResend && { opacity: 0.5 }]}>
            {canResend ? 'Resend Code' : `Resend code in ${countdown}s`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.verifyButton} activeOpacity={0.8} onPress={handleVerify}>
          <Text style={styles.verifyButtonText}>Verify</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    marginTop: 32,
  },
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 12,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    color: '#212529',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#DC3545',
    marginTop: 16,
    textAlign: 'center',
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#5F2EEA',
  },
  verifyButton: {
    backgroundColor: '#5F2EEA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 48,
  },
  verifyButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
