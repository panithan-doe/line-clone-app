import React, { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { client } from '../../lib/amplify';

interface AddFriendProps {
  currentUser: any;
  onClose: () => void;
  onChatCreated: () => void;
}

export function AddFriend({ currentUser, onClose, onChatCreated }: AddFriendProps) {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Search for users by email
      const { data: users } = await client.models.User.list({
        filter: {
          email: {
            eq: searchEmail.toLowerCase()
          }
        }
      });

      if (users && users.length > 0) {
        // Filter out the current user
        const filteredUsers = users.filter(
          user => user.email !== currentUser.attributes.email
        );
        setSearchResults(filteredUsers);
        
        if (filteredUsers.length === 0) {
          setError('No users found with this email');
        }
      } else {
        setError('No users found with this email');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Error searching for users');
    } finally {
      setLoading(false);
    }
  };

  const createPrivateChat = async (targetUser: any) => {
    setLoading(true);
    setError('');

    try {
      // Check if a private chat already exists between these users
      const { data: existingMembers } = await client.models.ChatRoomMember.list({
        filter: {
          userId: {
            eq: currentUser.attributes.email
          }
        }
      });

      // Check if there's already a private chat with this user
      for (const membership of existingMembers) {
        if (!membership.chatRoomId) continue;
        const { data: otherMembers } = await client.models.ChatRoomMember.list({
          filter: {
            and: [
              { chatRoomId: { eq: membership.chatRoomId } },
              { userId: { eq: targetUser.email } }
            ]
          }
        });

        if (otherMembers.length > 0) {
          // Check if it's a private chat
          const { data: rooms } = await client.models.ChatRoom.list({
            filter: {
              and: [
                { id: { eq: membership.chatRoomId } },
                { type: { eq: 'private' } }
              ]
            }
          });

          if (rooms.length > 0) {
            setError('You already have a chat with this user');
            return;
          }
        }
      }

      // Create a new private chat room
      const { data: newRoom } = await client.models.ChatRoom.create({
        name: targetUser.nickname || targetUser.email,
        type: 'private',
        description: `Private chat with ${targetUser.nickname || targetUser.email}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('New private chat room created:', newRoom);

      if (newRoom && newRoom.id) {
        // Get current user's nickname from User table
        let currentUserNickname = currentUser.attributes.email;
        try {
          const { data: currentUserData } = await client.models.User.get({
            email: currentUser.attributes.email
          });
          if (currentUserData?.nickname) {
            currentUserNickname = currentUserData.nickname;
          }
        } catch (err) {
          console.error('Error loading current user nickname:', err);
        }

        // Add both users as members
        await client.models.ChatRoomMember.create({
          chatRoomId: newRoom.id,
          userId: currentUser.attributes.email,
          userNickname: currentUserNickname,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });

        await client.models.ChatRoomMember.create({
          chatRoomId: newRoom.id,
          userId: targetUser.email,
          userNickname: targetUser.nickname || targetUser.email,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });

        onChatCreated();
        onClose();
      }
    } catch (err) {
      console.error('Error creating private chat:', err);
      setError('Error creating chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Friend</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter friend's email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={searchUsers}
              disabled={loading || !searchEmail.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.nickname || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => createPrivateChat(user)}
                    disabled={loading}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}