import React, { useState } from 'react';
import { MessageCircle, Plus, Settings, LogOut, Users, Search } from 'lucide-react';
import { AddFriend } from './AddFriend';
import type { ChatRoom, User } from '../../types';

interface ChatSidebarProps {
  chatRooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  onSignOut: () => void;
  user: any;
  onChatRoomsUpdate?: () => void;
}

export function ChatSidebar({ chatRooms, selectedRoom, onSelectRoom, onSignOut, user, onChatRoomsUpdate }: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Chats</h1>
              <p className="text-sm text-gray-500">{user?.attributes?.nickname || user?.attributes?.email || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowAddFriend(true)}
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
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedRoom?.id === room.id ? 'bg-green-50 border-r-4 border-green-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      room.type === 'group' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {room.type === 'group' ? (
                        <Users className="w-6 h-6 text-white" />
                      ) : (
                        <MessageCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 truncate">{room.name}</h3>
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
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}