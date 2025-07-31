import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Settings, LogOut, Users, Search, User as UserIcon } from 'lucide-react';
import { getUrl } from 'aws-amplify/storage';
import { AddFriend } from './AddFriend';
import { ActionMenu } from './ActionMenu';
import { CreateGroupChat } from './CreateGroupChat';
import { UserProfile } from '../Profile/UserProfile';
import { client } from '../../lib/amplify';
import type { ChatRoom, User } from '../../types';

interface ChatSidebarProps {
  chatRooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  onSignOut: () => void;
  user: any;
  onChatRoomsUpdate?: () => void;
  unreadCounts: Record<string, number>;
}

export function ChatSidebar({ chatRooms, selectedRoom, onSelectRoom, onSignOut, user, onChatRoomsUpdate, unreadCounts }: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userDescription, setUserDescription] = useState('');
  const [userNickname, setUserNickname] = useState('');

  const filteredRooms = chatRooms
    .filter(room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by lastMessageAt in descending order (newest first)
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });

  // Load user profile data
  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      
      // Use Lambda method (same as UserProfile component)
      let userData = null;
      try {
        const userResponse = await client.queries.verifyUser({
          email: user.attributes.email
        });
        userData = userResponse?.data;
      } catch (error) {
        console.error('ChatSidebar: Error loading user profile via Lambda:', error);
      }
      
      
      if (userData) {
        setUserDescription(userData.description || '');
        setUserNickname(userData.nickname || '');
        
        // Load profile picture if exists
        if (userData.avatar) {
          try {
            const { url } = await getUrl({
              key: userData.avatar
            });
            setProfilePicture(url.toString());
          } catch (err) {
          }
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <button
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-green-500 transition-all flex-shrink-0"
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-green-500 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-800 truncate">
                {userNickname || user.attributes.email || 'User'}
              </h1>
              <p className="text-sm text-gray-500 truncate">
                {userDescription || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowActionMenu(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={onSignOut}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No chats yet</p>
            <p className="text-sm text-gray-400">Start a new conversation</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRooms.map((room) => {
              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-green-50 border-r-4 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {room.type === 'group' ? (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      ) : room.otherUserAvatar ? (
                        <img
                          src={room.otherUserAvatar}
                          alt={`${room.name} profile`}
                          className="w-full h-full object-cover"
                          onLoad={() => console.log('Other user avatar loaded:', room.otherUserAvatar)}
                          onError={(e) => console.error('Other user avatar failed to load:', room.otherUserAvatar, e)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800 truncate">{room.name}</h3>
                        {unreadCounts[room.id] > 0 && (
                          <div className="min-w-[20px] h-5 bg-green-500 rounded-full flex items-center justify-center px-1.5">
                            <span className="text-xs font-semibold text-white">
                              {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {room.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Action Menu Modal */}
      {showActionMenu && (
        <ActionMenu
          onAddFriend={() => {
            setShowActionMenu(false);
            setShowAddFriend(true);
          }}
          onCreateGroup={() => {
            setShowActionMenu(false);
            setShowCreateGroup(true);
          }}
          onClose={() => setShowActionMenu(false)}
        />
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <AddFriend
          currentUser={user}
          onClose={() => setShowAddFriend(false)}
          onChatCreated={() => {
            setShowAddFriend(false);
            if (onChatRoomsUpdate) {
              onChatRoomsUpdate();
            }
          }}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupChat
          currentUser={user}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={() => {
            setShowCreateGroup(false);
            if (onChatRoomsUpdate) {
              onChatRoomsUpdate();
            }
          }}
        />
      )}

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile
          user={user}
          onClose={() => setShowProfile(false)}
          onProfileUpdate={() => {
            loadUserProfile();
            if (onChatRoomsUpdate) {
              onChatRoomsUpdate();
            }
          }}
        />
      )}
    </div>
  );
}