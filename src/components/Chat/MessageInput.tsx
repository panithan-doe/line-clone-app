import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center space-x-3">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Paperclip className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Smile className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className={`p-2 rounded-full transition-colors ${
            message.trim()
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}