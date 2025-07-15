import React, { useState, useRef } from 'react';
import { X, Camera, Edit2, Check, User } from 'lucide-react';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { client } from '../../lib/amplify';

interface UserProfileProps {
  user: any;
  onClose: () => void;
  onProfileUpdate: () => void;
}

export function UserProfile({ user, onClose, onProfileUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current user data
  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: userData } = await client.models.User.get({
        email: user.attributes.email
      });
      
      if (userData) {
        setNickname(userData.nickname || '');
        setDescription(userData.description || '');
        
        // Load profile picture if exists
        if (userData.avatar) {
          try {
            const { url } = await getUrl({
              key: userData.avatar,
              options: {
                accessLevel: 'guest'
              }
            });
            setProfilePicture(url.toString());
          } catch (err) {
            console.error('Error loading profile picture:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fileExtension = file.name.split('.').pop();
      // Use user's email as the unique identifier
      const userIdentifier = user.attributes?.email || user.userId || user.username;
      const fileName = `profile-pictures/${userIdentifier}/avatar.${fileExtension}`;
      
      console.log('Uploading file:', fileName);
      console.log('User object:', user);
      
      // Upload to S3
      const { key } = await uploadData({
        key: fileName,
        data: file,
        options: {
          accessLevel: 'guest',
          contentType: file.type,
        }
      }).result;

      console.log('Upload key:', key);
      
      // Get URL for preview
      const { url } = await getUrl({
        key: key,
        options: {
          accessLevel: 'guest'
        }
      });
      
      setProfilePicture(url.toString());
      
      // Update user record with new avatar path
      await client.models.User.update({
        email: user.attributes.email,
        avatar: key,
      });
      
      console.log('Updated user avatar path:', key);

      onProfileUpdate();
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError('Nickname is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await client.models.User.update({
        email: user.attributes.email,
        nickname: nickname.trim(),
        description: description.trim(),
      });

      setIsEditing(false);
      onProfileUpdate();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values by reloading user data
    loadUserData();
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Profile</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Click camera to change photo</p>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nickname
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                }`}
                placeholder="Enter your nickname"
              />
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description Status
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isEditing}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
                  isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                }`}
                placeholder="Tell people about yourself..."
                maxLength={200}
              />
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/200 characters
              </p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.attributes.email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !nickname.trim()}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}