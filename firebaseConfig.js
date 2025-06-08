import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: 'AIzaSyAIvdS8nh1ljtNijeObVZkRW2kbI-rhTq4',
  authDomain: 'nyabonaapp.firebaseapp.com',
  projectId: 'nyabonaapp',
  storageBucket: 'nyabonaapp.firebasestorage.app',
  messagingSenderId: '291572996388',
  appId: '1:291572996388:android:7756e8c5761a594a0ebbb1',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
