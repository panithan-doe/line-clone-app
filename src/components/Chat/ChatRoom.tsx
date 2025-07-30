import React, { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { GroupMembersModal } from './GroupMembersModal';
import type { ChatRoom as ChatRoomType, Message } from '../../types';

interface ChatRoomProps {
  room: ChatRoomType;
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUserId: string;
  currentUser: any;
  onRemoveChat: (roomId: string) => void;
  userRole?: string;
  isUnavailable?: boolean;
}

export function ChatRoom({ room, messages, onSendMessage, currentUserId, currentUser, onRemoveChat, userRole, isUnavailable }: ChatRoomProps) {
  const [showGroupMembers, setShowGroupMembers] = useState(false);

  const handleShowGroupMembers = () => {
    if (room.type === 'group') {
      setShowGroupMembers(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        room={room} 
        currentUser={currentUser} 
        onRemoveChat={onRemoveChat} 
        userRole={userRole}
        onShowGroupMembers={handleShowGroupMembers}
      />
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput onSendMessage={onSendMessage} isUnavailable={isUnavailable} />
      
      {/* Group Members Modal */}
      {showGroupMembers && room.type === 'group' && (
        <GroupMembersModal
          room={room}
          currentUser={currentUser}
          onClose={() => setShowGroupMembers(false)}
        />
      )}
    </div>
  );
}