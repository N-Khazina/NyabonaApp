import { auth } from '@/firebaseConfig';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import {
  onAuthStateChanged,
  PhoneAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const sendVerificationCode = async (
    phone: string,
    recaptchaVerifier: React.RefObject<FirebaseRecaptchaVerifierModal | null>
  ) => {
    try {
      const provider = new PhoneAuthProvider(auth);
      const fullPhone = `+250${phone}`;
      if (!recaptchaVerifier.current) throw new Error('Recaptcha verifier not ready');

      const id = await provider.verifyPhoneNumber(fullPhone, recaptchaVerifier.current);
      setPhoneNumber(phone);
      setVerificationId(id);
      setError(null);
      return id;
    } catch (err) {
      console.error('Error sending code:', err);
      setError('Failed to send verification code.');
      throw err;
    }
  };

  const verifyCode = async (verificationIdArg: string, code: string) => {
    try {
      if (!verificationIdArg) throw new Error('Verification ID missing');

      const credential = PhoneAuthProvider.credential(verificationIdArg, code);
      const result = await signInWithCredential(auth, credential);
      setUser(result.user);
      setError(null);
      return result.user;
    } catch (err) {
      console.error('Invalid verification code:', err);
      setError('Invalid verification code.');
      throw err;
    }
  };

  const resendCode = async (
    recaptchaVerifier: React.RefObject<FirebaseRecaptchaVerifierModal | null>
  ): Promise<string> => {
    if (!phoneNumber) {
      const message = 'Phone number not available. Cannot resend code.';
      setError(message);
      throw new Error(message);
    }
    const id = await sendVerificationCode(phoneNumber, recaptchaVerifier);
    setVerificationId(id);
    return id;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
    });
    return unsubscribe;
  }, []);

  return {
    sendVerificationCode,
    verifyCode,
    resendCode,
    user,
    error,
    login: sendVerificationCode, // ✅ alias for login screen
  };
};

export default useAuth;
