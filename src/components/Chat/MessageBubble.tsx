import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
        isOwn
          ? 'bg-green-500 text-white rounded-br-sm'
          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
      }`}>
        {!isOwn && (
          <p className="text-xs font-semibold mb-1 text-gray-600">
            {message.senderNickname}
          </p>
        )}
        <p className="text-sm">{message.content}</p>
        <p className={`text-xs mt-1 ${
          isOwn ? 'text-green-100' : 'text-gray-500'
        }`}>
          {message.createdAt && formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}