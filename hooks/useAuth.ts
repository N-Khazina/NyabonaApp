import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, PhoneAuthProvider, signInWithCredential, updateProfile, User } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';

export function useAuth() {
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const recaptchaVerifier = useRef<any>(null);

  // Listen for auth state changes to keep user updated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const login = async (phone: string, recaptcha: any) => {
    const provider = new PhoneAuthProvider(auth);
    const fullPhone = `+250${phone}`;
    const id = await provider.verifyPhoneNumber(fullPhone, recaptcha);
    setVerificationId(id);
    setPhoneNumber(phone);
    recaptchaVerifier.current = recaptcha;
  };

  const resendCode = async () => {
    if (!phoneNumber || !recaptchaVerifier.current) {
      throw new Error('Missing phone number or verifier');
    }
    const provider = new PhoneAuthProvider(auth);
    const fullPhone = `+250${phoneNumber}`;
    const id = await provider.verifyPhoneNumber(fullPhone, recaptchaVerifier.current);
    setVerificationId(id);
  };

  // Added optional displayName parameter
  const verifyCode = async (code: string, displayName?: string) => {
    if (!verificationId) throw new Error('No verification ID');
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await signInWithCredential(auth, credential);

    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }
    // user state updates automatically via onAuthStateChanged listener
  };

  return {
    user,
    login,
    verifyCode,
    resendCode,
    verificationId,
  };
}
