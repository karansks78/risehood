/**
 * Create Post Screen
 * Handles media upload and post creation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/Button';
import Loader from '../components/Loader';

const CreatePostScreen = ({ navigation }) => {
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();

  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload media.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMedia(asset);
        setMediaType(asset.type);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMedia(asset);
        setMediaType(asset.type);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadMedia = async (mediaUri) => {
    try {
      const response = await fetch(mediaUri);
      const blob = await response.blob();
      
      const filename = `posts/${user.uid}/${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  };

  const createPost = async () => {
    if (!media) {
      Alert.alert('No Media', 'Please select an image or video to post.');
      return;
    }

    setLoading(true);
    try {
      // Upload media to Firebase Storage
      const mediaURL = await uploadMedia(media.uri);

      // Create post document
      const postData = {
        userId: user.uid,
        mediaURL,
        mediaType,
        caption: caption.trim(),
        likes: [],
        commentCount: 0,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'posts'), postData);

      // Update user's post count
      await updateDoc(doc(db, 'users', user.uid), {
        postsCount: increment(1)
      });

      // Reset form
      setMedia(null);
      setMediaType(null);
      setCaption('');

      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);

    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
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
      {/* Media Selection */}
      {!media ? (
        <View style={styles.mediaSelection}>
          <View style={[styles.mediaPlaceholder, { borderColor: theme.colors.border }]}>
            <Ionicons 
              name="camera-outline" 
              size={48} 
              color={theme.colors.textSecondary} 
            />
            <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
              Select media to share
            </Text>
          </View>

          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: theme.colors.primary }]}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={24} color={theme.colors.background} />
              <Text style={[styles.mediaButtonText, { color: theme.colors.background }]}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: theme.colors.secondary }]}
              onPress={pickMedia}
            >
              <Ionicons name="images" size={24} color={theme.colors.background} />
              <Text style={[styles.mediaButtonText, { color: theme.colors.background }]}>
                Choose Media
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.mediaPreview}>
          {mediaType === 'image' ? (
            <Image source={{ uri: media.uri }} style={styles.previewImage} />
          ) : (
            <Video
              source={{ uri: media.uri }}
              style={styles.previewVideo}
              useNativeControls
              resizeMode="contain"
              shouldPlay={false}
            />
          )}

          <TouchableOpacity
            style={[styles.changeMediaButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
              setMedia(null);
              setMediaType(null);
            }}
          >
            <Ionicons name="close" size={20} color={theme.colors.text} />
            <Text style={[styles.changeMediaText, { color: theme.colors.text }]}>
              Change Media
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Caption Input */}
      <View style={styles.captionSection}>
        <Text style={[styles.captionLabel, { color: theme.colors.text }]}>
          Caption
        </Text>
        <TextInput
          style={[
            styles.captionInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }
          ]}
          placeholder="Write a caption..."
          placeholderTextColor={theme.colors.textSecondary}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={500}
        />
        <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
          {caption.length}/500
        </Text>
      </View>

      {/* Post Button */}
      {media && (
        <Button
          title="Share Post"
          onPress={createPost}
          style={styles.postButton}
        />
      )}
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
  mediaSelection: {
    marginBottom: 24,
  },
  mediaPlaceholder: {
    height: 300,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mediaPreview: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewVideo: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  changeMediaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  captionSection: {
    marginBottom: 24,
  },
  captionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  captionInput: {
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
  postButton: {
    marginTop: 8,
  },
});

export default CreatePostScreen;