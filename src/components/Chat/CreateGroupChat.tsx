import React, { useState, useEffect } from 'react';
import { X, Search, ArrowRight, ArrowLeft, Users, Check } from 'lucide-react';
import { client } from '../../lib/amplify';

interface CreateGroupChatProps {
  currentUser: any;
  onClose: () => void;
  onGroupCreated: () => void;
}

interface Friend {
  id: string;
  email: string;
  nickname: string;
}

type Step = 'select-friends' | 'name-group';

export function CreateGroupChat({ currentUser, onClose, onGroupCreated }: CreateGroupChatProps) {
  const [step, setStep] = useState<Step>('select-friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch friends (users who have private chats with current user)
  useEffect(() => {
    fetchFriends();
  }, [currentUser.attributes.email]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      
      // Get all chat room memberships for current user
      const { data: myMemberships } = await client.models.ChatRoomMember.list({
        filter: {
          userId: {
            eq: currentUser.attributes.email
          }
        }
      });

      const friendsSet = new Set<string>();
      const friendsMap = new Map<string, Friend>();

      // For each membership, check if it's a private chat and get the other user
      for (const membership of myMemberships) {
        if (!membership.chatRoomId) continue;

        // Get the chat room
        const { data: rooms } = await client.models.ChatRoom.list({
          filter: {
            id: { eq: membership.chatRoomId ?? undefined }
          }
        });

        const room = rooms[0];
        if (!room || room.type !== 'private') continue;

        // Get all members of this private chat
        const { data: allMembers } = await client.models.ChatRoomMember.list({
          filter: {
            chatRoomId: { eq: room.id ?? undefined }
          }
        });

        // Find the other user
        const otherMember = allMembers.find(member => 
          member.userId && member.userId !== currentUser.attributes.email
        );

        if (otherMember && otherMember.userId) {
          friendsSet.add(otherMember.userId);
          friendsMap.set(otherMember.userId, {
            id: otherMember.userId,
            email: otherMember.userId,
            nickname: otherMember.userNickname || otherMember.userId
          });
        }
      }

      setFriends(Array.from(friendsMap.values()));
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFriendSelection = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleNext = () => {
    if (selectedFriends.size === 0) {
      setError('Please select at least one friend');
      return;
    }
    setError('');
    setStep('name-group');
  };

  const handleBack = () => {
    setStep('select-friends');
    setError('');
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedFriends.size === 0) {
      setError('Please select at least one friend');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create the group chat room
      const { data: newRoom } = await client.models.ChatRoom.create({
        name: groupName.trim(),
        type: 'group',
        description: `Group chat: ${groupName.trim()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

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

        // Add current user as admin
        await client.models.ChatRoomMember.create({
          chatRoomId: newRoom.id ?? '',
          userId: currentUser.attributes.email,
          userNickname: currentUserNickname,
          role: 'admin',
          joinedAt: new Date().toISOString(),
        });

        // Add selected friends as members
        const memberPromises = Array.from(selectedFriends).map(async (friendId) => {
          const friend = friends.find(f => f.id === friendId);
          let friendNickname = friend?.nickname || friendId;
          
          // Get friend's current nickname from User table
          try {
            const { data: friendData } = await client.models.User.get({
              email: friendId
            });
            if (friendData?.nickname) {
              friendNickname = friendData.nickname;
            }
          } catch (err) {
            console.error('Error loading friend nickname:', err);
          }
          
          return client.models.ChatRoomMember.create({
            chatRoomId: newRoom.id ?? '',
            userId: friendId,
            userNickname: friendNickname,
            role: 'member',
            joinedAt: new Date().toISOString(),
          });
        });

        await Promise.all(memberPromises);

        onGroupCreated();
        onClose();
      }
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {step === 'name-group' && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {step === 'select-friends' ? 'Select Friends' : 'Name Your Group'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'select-friends' ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Selected count */}
            {selectedFriends.size > 0 && (
              <div className="mb-4 text-sm text-blue-600">
                {selectedFriends.size} friend{selectedFriends.size !== 1 ? 's' : ''} selected
              </div>
            )}

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {friends.length === 0 ? 'No friends found' : 'No friends match your search'}
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => toggleFriendSelection(friend.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFriends.has(friend.id) 
                        ? 'bg-blue-50 border-2 border-blue-500' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{friend.nickname}</p>
                      <p className="text-sm text-gray-500">{friend.email}</p>
                    </div>
                    {selectedFriends.has(friend.id) && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                ))
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-4">{error}</p>
            )}

            {/* Next button */}
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={handleNext}
                disabled={selectedFriends.size === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 mb-4">
                Creating group with {selectedFriends.size} friend{selectedFriends.size !== 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={createGroup}
              disabled={loading || !groupName.trim()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}