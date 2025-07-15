import React from 'react';
import { Phone, Video, MoreVertical, Users, User } from 'lucide-react';
import type { ChatRoom } from '../../types';

interface ChatHeaderProps {
  room: ChatRoom;
}

export function ChatHeader({ room }: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
          {room.type === 'group' ? (
            <div className="w-full h-full bg-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          ) : room.otherUserAvatar ? (
            <img
              src={room.otherUserAvatar}
              alt={`${room.name} profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">{room.name}</h2>
          <p className="text-sm text-gray-500">
            {room.type === 'group' ? 'Group Chat' : ''}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Phone className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Video className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}