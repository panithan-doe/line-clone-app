// import React, { useState, useEffect } from 'react';
// import { useAuthenticator } from '@aws-amplify/ui-react';
// import { ChatSidebar } from './ChatSidebar';
// import { ChatRoom } from './ChatRoom';
// import { client } from '../../lib/amplify';
// import type { ChatRoom as ChatRoomType, Message } from '../../types';
// import { set } from 'date-fns';

// export function ChatApp() {
//   const { user, signOut } = useAuthenticator();
//   const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
//   const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [loading, setLoading] = useState(true);

//   // useEffect(() => {
//   //   fetchChatRooms();
//   // }, []);

//   // useEffect(() => {
//   //   if (selectedRoom) {
//   //     fetchMessages(selectedRoom.id);
//   //   }
//   // }, [selectedRoom]);

//   // const fetchChatRooms = async () => {
//   //   try {
//   //     const { data } = await client.models.ChatRoom.list();
//   //     setChatRooms(data as ChatRoomType[]);
//   //   } catch (error) {
//   //     console.error('Error fetching chat rooms:', error);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // const fetchMessages = async (chatRoomId: string) => {
//   //   try {
//   //     const { data } = await client.models.Message.list({
//   //       filter: { chatRoomId: { eq: chatRoomId } }
//   //     });
//   //     setMessages(data as Message[]);
//   //   } catch (error) {
//   //     console.error('Error fetching messages:', error);
//   //   }
//   // };

//   // const sendMessage = async (content: string) => {
//   //   if (!selectedRoom || !user) return;

//   //   try {
//   //     const newMessage = await client.models.Message.create({
//   //       content,
//   //       chatRoomId: selectedRoom.id,
//   //       senderId: user.userId,
//   //       senderNickname: user.username || 'Unknown',
//   //       type: 'text'
//   //     });

//   //     if (newMessage.data) {
//   //       setMessages(prev => [...prev, newMessage.data as Message]);
//   //     }
//   //   } catch (error) {
//   //     console.error('Error sending message:', error);
//   //   }
//   // };

//   // if (loading) {
//   //   return (
//   //     <div className="h-screen flex items-center justify-center bg-gray-100">
//   //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
//   //     </div>
//   //   );
//   // }

//   // Mock data

//   return (
//     <div className="h-screen flex bg-gray-100">
//       <ChatSidebar
//         chatRooms={chatRooms}
//         selectedRoom={selectedRoom}
//         onSelectRoom={setSelectedRoom}
//         onSignOut={signOut}
//         user={user}
//       />

//       <div className="flex-1 flex flex-col">
//         {selectedRoom ? (
//           <ChatRoom
//             room={selectedRoom}
//             messages={messages}
//             onSendMessage={sendMessage}
//             currentUserId={user?.userId || ''}
//           />
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-center">
//               <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <MessageCircle className="w-12 h-12 text-gray-400" />
//               </div>
//               <h2 className="text-2xl font-semibold text-gray-800 mb-2">
//                 Welcome to LINE Clone
//               </h2>
//               <p className="text-gray-600">
//                 Select a chat to start messaging
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatRoom } from "./ChatRoom";
// import { client } from '../../lib/amplify';
import type { ChatRoom as ChatRoomType, Message, User } from "../../types";

export function ChatApp() {
  // Mock current user data
  const mockUser: User = {
    id: "current-user",
    email: "john.doe@example.com",
    nickname: "John Doe",
    avatar: "",
    status: "online",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  };

  const [user] = useState<User>(mockUser);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data
  const mockChatRooms: ChatRoomType[] = [
    {
      id: "room-1",
      name: "General Chat",
      type: "group",
      description: "General discussion for everyone",
      avatar: "",
      lastMessage: "Hey everyone! How are you doing today?",
      lastMessageAt: "2024-01-15T10:30:00Z",
      createdAt: "2024-01-10T09:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "room-2",
      name: "John Smith",
      type: "private",
      description: "",
      avatar: "",
      lastMessage: "Thanks for the help yesterday!",
      lastMessageAt: "2024-01-15T09:15:00Z",
      createdAt: "2024-01-12T14:20:00Z",
      updatedAt: "2024-01-15T09:15:00Z",
    },
    {
      id: "room-3",
      name: "Project Team",
      type: "group",
      description: "Team discussion for the current project",
      avatar: "",
      lastMessage: "The deadline has been moved to next Friday",
      lastMessageAt: "2024-01-15T08:45:00Z",
      createdAt: "2024-01-08T11:30:00Z",
      updatedAt: "2024-01-15T08:45:00Z",
    },
    {
      id: "room-4",
      name: "Sarah Johnson",
      type: "private",
      description: "",
      avatar: "",
      lastMessage: "See you at the meeting tomorrow",
      lastMessageAt: "2024-01-14T16:20:00Z",
      createdAt: "2024-01-11T13:45:00Z",
      updatedAt: "2024-01-14T16:20:00Z",
    },
    {
      id: "room-5",
      name: "Tech Support",
      type: "group",
      description: "Technical support and IT discussions",
      avatar: "",
      lastMessage: "Server maintenance completed successfully",
      lastMessageAt: "2024-01-14T12:10:00Z",
      createdAt: "2024-01-05T10:15:00Z",
      updatedAt: "2024-01-14T12:10:00Z",
    },
  ];

  const mockMessages: { [key: string]: Message[] } = {
    "room-1": [
      {
        id: "msg-1",
        content: "Good morning everyone!",
        type: "text",
        chatRoomId: "room-1",
        senderId: "user-1",
        senderNickname: "Alice Wilson",
        isRead: true,
        createdAt: "2024-01-15T09:00:00Z",
        updatedAt: "2024-01-15T09:00:00Z",
      },
      {
        id: "msg-2",
        content: "Morning Alice! Ready for the new week?",
        type: "text",
        chatRoomId: "room-1",
        senderId: "user-2",
        senderNickname: "Bob Chen",
        isRead: true,
        createdAt: "2024-01-15T09:05:00Z",
        updatedAt: "2024-01-15T09:05:00Z",
      },
      {
        id: "msg-3",
        content:
          "Absolutely! I have some exciting updates to share about the project.",
        type: "text",
        chatRoomId: "room-1",
        senderId: "user-1",
        senderNickname: "Alice Wilson",
        isRead: true,
        createdAt: "2024-01-15T09:10:00Z",
        updatedAt: "2024-01-15T09:10:00Z",
      },
      {
        id: "msg-4",
        content: "Hey everyone! How are you doing today?",
        type: "text",
        chatRoomId: "room-1",
        senderId: "user-3",
        senderNickname: "Carol Davis",
        isRead: false,
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
      },
    ],
    "room-2": [
      {
        id: "msg-5",
        content: "Hi there! How did the presentation go?",
        type: "text",
        chatRoomId: "room-2",
        senderId: "user-4",
        senderNickname: "John Smith",
        isRead: true,
        createdAt: "2024-01-15T08:30:00Z",
        updatedAt: "2024-01-15T08:30:00Z",
      },
      {
        id: "msg-6",
        content: "It went really well! The client loved our proposal.",
        type: "text",
        chatRoomId: "room-2",
        senderId: user.id,
        senderNickname: user.nickname,
        isRead: true,
        createdAt: "2024-01-15T08:45:00Z",
        updatedAt: "2024-01-15T08:45:00Z",
      },
      {
        id: "msg-7",
        content: "That's fantastic! I knew you'd nail it.",
        type: "text",
        chatRoomId: "room-2",
        senderId: "user-4",
        senderNickname: "John Smith",
        isRead: true,
        createdAt: "2024-01-15T09:00:00Z",
        updatedAt: "2024-01-15T09:00:00Z",
      },
      {
        id: "msg-8",
        content: "Thanks for the help yesterday!",
        type: "text",
        chatRoomId: "room-2",
        senderId: "user-4",
        senderNickname: "John Smith",
        isRead: false,
        createdAt: "2024-01-15T09:15:00Z",
        updatedAt: "2024-01-15T09:15:00Z",
      },
    ],
    "room-3": [
      {
        id: "msg-9",
        content: "Team meeting scheduled for 2 PM today",
        type: "text",
        chatRoomId: "room-3",
        senderId: "user-5",
        senderNickname: "Mike Johnson",
        isRead: true,
        createdAt: "2024-01-15T08:00:00Z",
        updatedAt: "2024-01-15T08:00:00Z",
      },
      {
        id: "msg-10",
        content: "Got it! I'll be there.",
        type: "text",
        chatRoomId: "room-3",
        senderId: "user-6",
        senderNickname: "Emma Brown",
        isRead: true,
        createdAt: "2024-01-15T08:15:00Z",
        updatedAt: "2024-01-15T08:15:00Z",
      },
      {
        id: "msg-11",
        content: "The deadline has been moved to next Friday",
        type: "text",
        chatRoomId: "room-3",
        senderId: "user-5",
        senderNickname: "Mike Johnson",
        isRead: false,
        createdAt: "2024-01-15T08:45:00Z",
        updatedAt: "2024-01-15T08:45:00Z",
      },
    ],
    "room-4": [
      {
        id: "msg-12",
        content: "How was your weekend?",
        type: "text",
        chatRoomId: "room-4",
        senderId: "user-7",
        senderNickname: "Sarah Johnson",
        isRead: true,
        createdAt: "2024-01-14T15:30:00Z",
        updatedAt: "2024-01-14T15:30:00Z",
      },
      {
        id: "msg-13",
        content: "It was great! Went hiking with some friends.",
        type: "text",
        chatRoomId: "room-4",
        senderId: user.id,
        senderNickname: user.nickname,
        isRead: true,
        createdAt: "2024-01-14T15:45:00Z",
        updatedAt: "2024-01-14T15:45:00Z",
      },
      {
        id: "msg-14",
        content: "Sounds fun! I need to get outdoors more.",
        type: "text",
        chatRoomId: "room-4",
        senderId: "user-7",
        senderNickname: "Sarah Johnson",
        isRead: true,
        createdAt: "2024-01-14T16:00:00Z",
        updatedAt: "2024-01-14T16:00:00Z",
      },
      {
        id: "msg-15",
        content: "See you at the meeting tomorrow",
        type: "text",
        chatRoomId: "room-4",
        senderId: "user-7",
        senderNickname: "Sarah Johnson",
        isRead: false,
        createdAt: "2024-01-14T16:20:00Z",
        updatedAt: "2024-01-14T16:20:00Z",
      },
    ],
    "room-5": [
      {
        id: "msg-16",
        content: "Server maintenance scheduled for tonight",
        type: "text",
        chatRoomId: "room-5",
        senderId: "user-8",
        senderNickname: "Tech Admin",
        isRead: true,
        createdAt: "2024-01-14T10:00:00Z",
        updatedAt: "2024-01-14T10:00:00Z",
      },
      {
        id: "msg-17",
        content: "How long will it take?",
        type: "text",
        chatRoomId: "room-5",
        senderId: "user-9",
        senderNickname: "Dave Wilson",
        isRead: true,
        createdAt: "2024-01-14T10:15:00Z",
        updatedAt: "2024-01-14T10:15:00Z",
      },
      {
        id: "msg-18",
        content: "Approximately 2 hours, from 11 PM to 1 AM",
        type: "text",
        chatRoomId: "room-5",
        senderId: "user-8",
        senderNickname: "Tech Admin",
        isRead: true,
        createdAt: "2024-01-14T10:30:00Z",
        updatedAt: "2024-01-14T10:30:00Z",
      },
      {
        id: "msg-19",
        content: "Server maintenance completed successfully",
        type: "text",
        chatRoomId: "room-5",
        senderId: "user-8",
        senderNickname: "Tech Admin",
        isRead: false,
        createdAt: "2024-01-14T12:10:00Z",
        updatedAt: "2024-01-14T12:10:00Z",
      },
    ],
  };

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setChatRooms(mockChatRooms);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      // Simulate loading messages
      const roomMessages = mockMessages[selectedRoom.id] || [];
      setMessages(roomMessages);
    }
  }, [selectedRoom]);

  const signOut = () => {
    // Mock sign out function
    console.log("Signing out...");
    // In a real app, you'd handle sign out logic here
  };

  const sendMessage = async (content: string) => {
    if (!selectedRoom || !user) return;

    try {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content,
        type: "text",
        chatRoomId: selectedRoom.id,
        senderId: user.id,
        senderNickname: user.nickname,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Update the last message in the chat room
      setChatRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoom.id
            ? {
                ...room,
                lastMessage: content,
                lastMessageAt: new Date().toISOString(),
              }
            : room
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
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
            currentUserId={user.id}
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
              <p className="text-gray-600">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
