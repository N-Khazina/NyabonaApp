import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Briefcase, Calendar, ChevronLeft, ImageIcon, User } from 'lucide-react-native';
import { useState } from 'react';
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

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState<{ name?: string; dob?: string; avatarUrl?: string; role?: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!dob.trim()) newErrors.dob = 'Date of birth is required';
    if (!avatarUrl.trim()) newErrors.avatarUrl = 'Avatar URL is required';
    if (!role.trim()) newErrors.role = 'Role selection is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log({ name, dob, avatarUrl, role });

      // Navigate based on role
      if (role === 'client' || role === 'passenger') {
        router.push('/(tabs)');
      } else if (role === 'driver') {
        router.push('/(tabs)/driverDashboard');
      } else if (role === 'admin') {
        router.push('/(tabs)/adminDashboard');
      }
    } catch (error) {
      console.error('Profile save error:', error);
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
                placeholder="Enter your name"
                placeholderTextColor="#ADB5BD"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrors({ ...errors, name: undefined });
                }}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* DOB */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#ADB5BD"
                value={dob}
                onChangeText={(text) => {
                  setDob(text);
                  setErrors({ ...errors, dob: undefined });
                }}
              />
            </View>
            {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
          </View>

          {/* Avatar */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Avatar URL</Text>
            <View style={styles.inputContainer}>
              <ImageIcon size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Paste your avatar image URL"
                placeholderTextColor="#ADB5BD"
                value={avatarUrl}
                onChangeText={(text) => {
                  setAvatarUrl(text);
                  setErrors({ ...errors, avatarUrl: undefined });
                }}
              />
            </View>
            {errors.avatarUrl && <Text style={styles.errorText}>{errors.avatarUrl}</Text>}
          </View>

          {/* Role Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Role</Text>
            <View style={[styles.inputContainer, { paddingHorizontal: 0 }]}>
              <Briefcase size={20} color="#6C757D" style={[styles.inputIcon, { marginLeft: 16 }]} />
              <Picker
                selectedValue={role}
                style={{ flex: 1, marginLeft: 8 }}
                onValueChange={(itemValue) => {
                  setRole(itemValue);
                  setErrors({ ...errors, role: undefined });
                }}
              >
                <Picker.Item label="Choose a role..." value="" />
                <Picker.Item label="Client / Passenger" value="client" />
                <Picker.Item label="Driver" value="driver" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>{loading ? 'Saving...' : 'Save Profile'}</Text>
          </TouchableOpacity>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 12,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
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
  registerButton: {
    backgroundColor: '#5F2EEA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
