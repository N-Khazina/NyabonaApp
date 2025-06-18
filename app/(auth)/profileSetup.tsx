import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
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

import { auth, db, storage } from '@/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uid, phone } = useLocalSearchParams<{ uid?: string; phone?: string }>();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    dob?: string;
    nationalId?: string;
    profileImage?: string;
    role?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validateDate = (date: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(date);

  const validateNationalId = (id: string): boolean => /^\d{16}$/.test(id);

  const isAtLeast18 = (date: Date) => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) return age - 1 >= 18;
    return age >= 18;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) newErrors.name = 'Full name is required';
    else if (name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters long';

    if (!dob.trim()) newErrors.dob = 'Date of birth is required';
    else if (!validateDate(dob.trim())) newErrors.dob = 'Date must be in YYYY-MM-DD format';
    else if (!isAtLeast18(new Date(dob.trim()))) newErrors.dob = 'You must be at least 18 years old';

    if (!nationalId.trim()) newErrors.nationalId = 'National ID is required';
    else if (!validateNationalId(nationalId.trim())) newErrors.nationalId = 'National ID must be 16 digits';

    if (!profileImage) newErrors.profileImage = 'Profile image is required';

    if (!role.trim()) newErrors.role = 'Please select your role';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Allow access to your media library to upload a profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
      setErrors((prev) => ({ ...prev, profileImage: undefined }));
    }
  };

  const uploadImageAsync = async (uri: string, userId: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const mimeType = blob.type.split('/')[1];
      const fileExtension = mimeType === 'jpeg' ? 'jpg' : mimeType;

      const imageRef = storageRef(storage, `profileImages/${userId}.${fileExtension}`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Image uploaded and accessible at:', downloadURL);
      return downloadURL;
    } catch (err) {
      console.error('Image upload failed:', err);
      throw err;
    }
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      const userId = user?.uid || uid;
      const phoneNumber = user?.phoneNumber || phone;

      console.log('userId:', userId);
      console.log('phoneNumber:', phoneNumber);
      console.log('name:', name);
      console.log('dob:', dob);
      console.log('nationalId:', nationalId);
      console.log('role:', role);
      console.log('profileImage:', profileImage);

      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      const imageUrl = await uploadImageAsync(profileImage!, userId);

      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        name: name.trim(),
        dob,
        nationalId: nationalId.trim(),
        role,
        phone: phoneNumber || '',
        profileImageURL: imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('User profile saved successfully');

      if (role === 'client') router.push('/(tabs)');
      else if (role === 'driver') router.push('/drivertabs');
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Error', 'Something went wrong while saving your profile.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      setDob(formattedDate);
      setErrors((prev) => ({ ...prev, dob: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#212529" />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Complete Profile</Text>
          <Text style={styles.headerSubtitle}>Finish setting up your account</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#ADB5BD"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6C757D" style={styles.inputIcon} />
              <Text style={styles.phoneDisplay}>{auth.currentUser?.phoneNumber || phone || ''}</Text>
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dobDisplay}>{dob || 'Select your date of birth'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}
            {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
          </View>

          {/* National ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>National ID</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your national ID"
                keyboardType="numeric"
                maxLength={16}
                value={nationalId}
                onChangeText={(text) => {
                  setNationalId(text);
                  setErrors((prev) => ({ ...prev, nationalId: undefined }));
                }}
              />
            </View>
            {errors.nationalId && <Text style={styles.errorText}>{errors.nationalId}</Text>}
          </View>

          {/* Profile Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Profile Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Text style={styles.imagePickerText}>Pick an image</Text>
              )}
            </TouchableOpacity>
            {errors.profileImage && <Text style={styles.errorText}>{errors.profileImage}</Text>}
          </View>

          {/* Role */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Role</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={role}
                onValueChange={(itemValue) => {
                  setRole(itemValue);
                  setErrors((prev) => ({ ...prev, role: undefined }));
                }}
                mode="dropdown"
              >
                <Picker.Item label="Select role..." value="" />
                <Picker.Item label="Client" value="client" />
                <Picker.Item label="Driver" value="driver" />
              </Picker>
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            disabled={loading}
            onPress={handleSaveProfile}
          >
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Profile'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 16,
    marginBottom: 12,
    width: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 14,
    color: '#495057',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#CED4DA',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  phoneDisplay: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    paddingVertical: 12,
  },
  dobDisplay: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    paddingVertical: 12,
  },
  errorText: {
    color: '#DC3545',
    marginTop: 4,
    fontSize: 12,
  },
  imagePicker: {
    height: 120,
    width: 120,
    borderRadius: 60,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  imagePickerText: {
    color: '#6C757D',
    fontSize: 16,
  },
  profileImage: {
    height: 120,
    width: 120,
    borderRadius: 60,
  },
  pickerContainer: {
    borderColor: '#CED4DA',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
