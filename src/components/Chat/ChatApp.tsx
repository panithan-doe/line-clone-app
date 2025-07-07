import React, { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { ChatSidebar } from './ChatSidebar';
import { ChatRoom } from './ChatRoom';
import { client } from '../../lib/amplify';
import type { ChatRoom as ChatRoomType, Message } from '../../types';

export function ChatApp() {
  const { user, signOut } = useAuthenticator();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  const fetchChatRooms = async () => {
    try {
      const { data } = await client.models.ChatRoom.list();
      setChatRooms(data as ChatRoomType[]);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatRoomId: string) => {
    try {
      const { data } = await client.models.Message.list({
        filter: { chatRoomId: { eq: chatRoomId } }
      });
      setMessages(data as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedRoom || !user) return;

    try {
      const newMessage = await client.models.Message.create({
        content,
        chatRoomId: selectedRoom.id,
        senderId: user.userId,
        senderNickname: user.username || 'Unknown',
        type: 'text'
      });

      if (newMessage.data) {
        setMessages(prev => [...prev, newMessage.data as Message]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <ChatSidebar
        chatRooms={chatRooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        onSignOut={signOut}
        user={user}
      />
      
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <ChatRoom
            room={selectedRoom}
            messages={messages}
            onSendMessage={sendMessage}
            currentUserId={user?.userId || ''}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome to LINE Clone
              </h2>
              <p className="text-gray-600">
                Select a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}