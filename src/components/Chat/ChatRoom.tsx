import React from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { ChatRoom as ChatRoomType, Message } from '../../types';

interface ChatRoomProps {
  room: ChatRoomType;
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUserId: string;
}

export function ChatRoom({ room, messages, onSendMessage, currentUserId }: ChatRoomProps) {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader room={room} />
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}