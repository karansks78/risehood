/**
 * Edit Profile Screen
 * Allows users to update their profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import InputField from '../components/InputField';
import Loader from '../components/Loader';

const EditProfileScreen = ({ navigation }) => {
  const { userProfile, updateProfile } = useAuth();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
    avatar: userProfile?.avatar || '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarLoading(true);
        const avatarURL = await uploadAvatar(result.assets[0].uri);
        setFormData(prev => ({ ...prev, avatar: avatarURL }));
        setAvatarLoading(false);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      setAvatarLoading(false);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    }
  };

  const uploadAvatar = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const filename = `users/${userProfile.uid}/avatar_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      return 'Display name is required';
    }
    
    if (!formData.username.trim()) {
      return 'Username is required';
    }
    
    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        avatar: formData.avatar,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Avatar
            uri={formData.avatar}
            size={100}
            name={formData.displayName || formData.username}
          />
          {avatarLoading && (
            <View style={styles.avatarLoader}>
              <Loader size="small" />
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.changeAvatarButton, { backgroundColor: theme.colors.primary }]}
          onPress={pickAvatar}
          disabled={avatarLoading}
        >
          <Text style={[styles.changeAvatarText, { color: theme.colors.background }]}>
            Change Photo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        <InputField
          label="Display Name"
          placeholder="Enter your display name"
          value={formData.displayName}
          onChangeText={(value) => handleInputChange('displayName', value)}
          maxLength={50}
        />

        <InputField
          label="Username"
          placeholder="Enter your username"
          value={formData.username}
          onChangeText={(value) => handleInputChange('username', value)}
          autoCapitalize="none"
          maxLength={30}
        />

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Bio
          </Text>
          <TextInput
            style={[
              styles.bioInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }
            ]}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.bio}
            onChangeText={(value) => handleInputChange('bio', value)}
            multiline
            maxLength={150}
          />
          <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
            {formData.bio.length}/150
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <Button
        title="Save Changes"
        onPress={handleSave}
        style={styles.saveButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
  },
  changeAvatarButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    marginTop: 8,
  },
});

export default EditProfileScreen;