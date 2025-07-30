import React, { useState, useRef, useEffect } from 'react';
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
  const [currentAvatarPath, setCurrentAvatarPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      let userData = null;
      // // Try direct access
      // let userData = null;
      // try {
      //   console.log('UserProfile: Attempting direct user data access...');
      //   const { data: directUserData } = await client.models.User.get({
      //     email: user.attributes.email
      //   });
      //   userData = directUserData;
      // } catch (directError) {
      //   console.log('UserProfile: Direct access failed:', directError);
      // }

      // Try Lambda
      try {
        const userResponse = await client.queries.verifyUser({
          email: user.attributes.email
        });
        console.log('email: ', user.attributes.email);
        console.log('userResponse', userResponse);
        userData = userResponse?.data;
        console.log('UserProfile: Lambda user data result:', userData);
      } catch (lambdaError) {
        console.error('UserProfile: Lambda fallback also failed:', lambdaError);
      }
      
      if (userData) {
        setNickname(userData.nickname || '');
        setDescription(userData.description || '');
        
        // Load profile picture if exists
        if (userData.avatar) {
          console.log('userData: ',userData)
          console.log('UserProfile: Avatar path found:', userData.avatar);
          setCurrentAvatarPath(userData.avatar); // Store the avatar path
          try {
            const { url } = await getUrl({
              key: userData.avatar
            });
            console.log('UserProfile: Avatar URL generated:', url.toString());
            setProfilePicture(url.toString());
          } catch (err) {
            console.error('UserProfile: Error loading profile picture:', err);
            setProfilePicture(null);
          }
        } else {
          console.log('UserProfile: No avatar path found');
          setCurrentAvatarPath(null);
          setProfilePicture(null);
        }
      } else {
        console.log('UserProfile: No user data found');
        // Set defaults
        setNickname(user.attributes.email || '');
        setDescription('');
        setCurrentAvatarPath(null);
        setProfilePicture(null);
      }
    } catch (err) {
      console.error('UserProfile: Error loading user data:', err);
      // Set defaults on error
      setNickname(user.attributes.email || '');
      setDescription('');
      setCurrentAvatarPath(null);
      setProfilePicture(null);
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
      const userEmail = user.attributes?.email || user.userId || user.username;
      const fileName = `public/profile-pictures/${userEmail}/avatar.${fileExtension}`;
      
      console.log('Uploading file to S3:', fileName);
      console.log('File details:', { name: file.name, type: file.type, size: file.size });
      
      // Step 1: Upload to S3 directly
      const { key } = await uploadData({
        key: fileName,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;

      console.log('File uploaded successfully. S3 key:', key);
      
      // Step 2: Get URL for immediate preview
      const { url } = await getUrl({
        key: key
      });
      
      console.log('Generated preview URL:', url.toString());
      setProfilePicture(url.toString());
      
      // Step 3: Update database using Lambda function to ensure proper authorization
      let updateSuccess = false;
      try {
        console.log('Updating database with avatar path via Lambda:', key);
        const updateResult = await client.mutations.updateUserProfile({
          email: user.attributes.email,
          nickname: nickname, // Keep current nickname
          description: description, // Keep current description
          avatar: key // Add avatar field
        });
        
        console.log('Lambda updateUserProfile result:', updateResult);
        if (updateResult?.errors && updateResult.errors.length > 0) {
          console.error('Lambda updateUserProfile errors:', updateResult.errors);
          throw new Error(`Lambda errors: ${updateResult.errors.map(e => e.message).join(', ')}`);
        }
        updateSuccess = true;
        setCurrentAvatarPath(key); // Update the current avatar path
        console.log('Database updated successfully via Lambda');
      } catch (updateError) {
        console.error('Failed to update database via Lambda:', updateError);
        setError('Failed to update profile in database');
        return;
      }
      
      // Step 4: Refresh user data
      if (updateSuccess) {
        console.log('Avatar upload successful, refreshing data...');
        
        try {
          await loadUserData();
          console.log('Avatar data refresh completed');
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError);
        }
        
        onProfileUpdate();
      }
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
      // Try Lambda first
      let updateSuccess = false;
      console.log('Trying Lambda updateUserProfile...errrrr');
      try {
        console.log('Trying Lambda updateUserProfile...');
        console.log('Updating profile with:', {
          email: user.attributes.email,
          nickname: nickname.trim(),
          description: description.trim(),
          avatar: currentAvatarPath,
        });
        const updateResult = await client.mutations.updateUserProfile({
          email: user.attributes.email,
          nickname: nickname.trim(),
          description: description.trim(),
          avatar: currentAvatarPath, // Include the current avatar path
        });
        console.log('Lambda updateUserProfile raw result:', updateResult);
        console.log('Lambda updateUserProfile errors:', updateResult?.errors);
        if (updateResult?.errors && updateResult.errors.length > 0) {
          updateResult.errors.forEach((error, index) => {
            console.log(`Lambda updateUserProfile error ${index + 1}:`, error.message);
            console.log('Error details:', error);
          });
          throw new Error(`Lambda errors: ${updateResult.errors.map(e => e.message).join(', ')}`);
        }
        updateSuccess = true;
        console.log('Lambda updateUserProfile succeeded');
      } catch (lambdaError) {
        console.error('Lambda updateUserProfile failed:', lambdaError);
        
        // If Lambda fails, try direct model update as fallback
        try {
          console.log('Trying direct User model update...');
          await client.models.User.update({
            email: user.attributes.email,
            nickname: nickname.trim(),
            description: description.trim(),
            avatar: currentAvatarPath, // Include the current avatar path
            owner: user.attributes.email, // Include owner for authorization
            updatedAt: new Date().toISOString()
          });
          updateSuccess = true;
          console.log('Direct User model update succeeded');
        } catch (directError) {
          console.error('Direct User model update also failed:', directError);
        }
      }

      if (updateSuccess) {
        console.log('Profile update successful, refreshing data...');
        
        // Refresh the user data to get the latest values from database
        try {
          await loadUserData();
          console.log('Profile data refresh completed');
        } catch (refreshError) {
          console.error('Failed to refresh user data after profile update:', refreshError);
          // Don't fail the whole operation if refresh fails
        }
        
        setIsEditing(false);
        onProfileUpdate();
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values by reloading user data with fresh data
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
              Status
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
                placeholder="Tell people about yourself"
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