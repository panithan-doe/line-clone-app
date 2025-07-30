import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isUnavailable?: boolean;
}

export function MessageInput({ onSendMessage, isUnavailable = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!isUnavailable && message.trim()) {
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

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Set cursor position after the emoji
      setTimeout(() => {
        const newPosition = start + emoji.length;
        input.setSelectionRange(newPosition, newPosition);
        input.focus();
      }, 0);
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        event.target &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.emoji-button')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isUnavailable) {
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">You are the only one in this chat</p>
            <p className="text-gray-400 text-xs mt-1">Messages cannot be sent</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center space-x-3">
        {/* <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Paperclip className="w-5 h-5 text-gray-600" />
        </button> */}
        
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button 
            onClick={toggleEmojiPicker}
            className={`emoji-button absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
              showEmojiPicker ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Smile className="w-4 h-4" />
          </button>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef}>
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
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