import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatRoom } from "./ChatRoom";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { client } from "../../lib/amplify";
import type { ChatRoom as ChatRoomType, Message, User as AppUser } from "../../types";

interface ChatAppProps {
  user: any; // User from Cognito with attributes
}

export function ChatApp({ user }: ChatAppProps) {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Helper function to convert Amplify data to Message type
  const convertToMessage = (amplifyMessage: any): Message => {
    const now = new Date().toISOString();
    return {
      id: amplifyMessage.id || '',
      content: amplifyMessage.content || '',
      type: amplifyMessage.type || 'text',
      chatRoomId: amplifyMessage.chatRoomId || '',
      senderId: amplifyMessage.senderId || '',
      senderNickname: amplifyMessage.senderNickname || '',
      isRead: amplifyMessage.isRead || false,
      createdAt: amplifyMessage.createdAt || now,
      updatedAt: amplifyMessage.updatedAt || now,
    };
  };

  // Helper function to convert Amplify data to ChatRoom type
  const convertToChatRoom = (amplifyRoom: any): ChatRoomType => {
    const now = new Date().toISOString();
    return {
      id: amplifyRoom.id || '',
      name: amplifyRoom.name || '',
      type: amplifyRoom.type || 'private',
      description: amplifyRoom.description || '',
      lastMessage: amplifyRoom.lastMessage || '',
      lastMessageAt: amplifyRoom.lastMessageAt || '',
      createdAt: amplifyRoom.createdAt || now,
      updatedAt: amplifyRoom.updatedAt || now,
    };
  };

  // Fetch unread message counts for all chat rooms
  const fetchUnreadCounts = async (roomIds: string[]) => {
    try {
      const counts: Record<string, number> = {};
      
      for (const roomId of roomIds) {
        // Get the chat room to check if it's private or group
        const { data: rooms } = await client.models.ChatRoom.list({
          filter: {
            id: {
              eq: roomId
            }
          }
        });
        
        const room = rooms[0];
        if (!room) continue;
        
        if (room.type === 'private') {
          // For private chats, use the existing isRead logic
          const { data: unreadMessages } = await client.models.Message.list({
            filter: {
              chatRoomId: {
                eq: roomId
              },
              senderId: {
                ne: user.attributes.email // Not sent by current user
              },
              isRead: {
                eq: false
              }
            }
          });
          
          counts[roomId] = unreadMessages ? unreadMessages.length : 0;
        } else {
          // For group chats, check MessageReadStatus
          const { data: allMessages } = await client.models.Message.list({
            filter: {
              chatRoomId: {
                eq: roomId
              },
              senderId: {
                ne: user.attributes.email // Not sent by current user
              }
            }
          });
          
          if (allMessages) {
            let unreadCount = 0;
            for (const message of allMessages) {
              if (message.id) {
                // Check if current user has read this message
                const { data: readStatus } = await client.models.MessageReadStatus.list({
                  filter: {
                    messageId: {
                      eq: message.id
                    },
                    userId: {
                      eq: user.attributes.email
                    }
                  }
                });
                
                if (!readStatus || readStatus.length === 0) {
                  unreadCount++;
                }
              }
            }
            counts[roomId] = unreadCount;
          } else {
            counts[roomId] = 0;
          }
        }
      }
      
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  // Fetch chat rooms where the current user is a member
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      
      // Get all chat room memberships for the current user
      const { data: memberships } = await client.models.ChatRoomMember.list({
        filter: {
          userId: {
            eq: user.attributes.email
          }
        }
      });

      if (memberships && memberships.length > 0) {
        // Get the actual chat rooms with proper display names
        const roomPromises = memberships.map(async (membership) => {
          if (!membership.chatRoomId) return null;
          
          const { data: rooms } = await client.models.ChatRoom.list({
            filter: {
              id: {
                eq: membership.chatRoomId
              }
            }
          });
          
          const room = rooms[0];
          if (!room) return null;
          
          // For private chats, get the other user's name
          if (room.type === 'private') {
            // Get all members of this chat room
            const { data: allMembers } = await client.models.ChatRoomMember.list({
              filter: {
                chatRoomId: {
                  eq: room.id ?? undefined
                }
              }
            });
            
            // Find the other user (not current user)
            const otherMember = allMembers.find(member => 
              member.userId && member.userId !== user.attributes.email
            );
            
            if (otherMember) {
              // Use the other user's nickname for display
              return {
                ...room,
                name: otherMember.userNickname || otherMember.userId
              };
            }
          }
          
          return room;
        });

        const rooms = await Promise.all(roomPromises);
        const validRooms = rooms
          .filter(room => room !== null && room !== undefined)
          .map(room => convertToChatRoom(room));
        
        setChatRooms(validRooms);
        
        // Fetch unread counts for all rooms
        const roomIds = validRooms.map(room => room.id);
        await fetchUnreadCounts(roomIds);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  // Mark messages as read
  const markMessagesAsRead = async (roomId: string) => {
    try {
      // Get the chat room to check if it's private or group
      const { data: rooms } = await client.models.ChatRoom.list({
        filter: {
          id: {
            eq: roomId
          }
        }
      });
      
      const room = rooms[0];
      if (!room) return;
      
      if (room.type === 'private') {
        // For private chats, use the existing isRead logic
        const { data: unreadMessages } = await client.models.Message.list({
          filter: {
            chatRoomId: {
              eq: roomId
            },
            senderId: {
              ne: user.attributes.email // Not sent by current user
            },
            isRead: {
              eq: false
            }
          }
        });

        // Mark all unread messages as read
        for (const message of unreadMessages) {
          if (message.id) {
            await client.models.Message.update({
              id: message.id,
              isRead: true
            });
          }
        }
      } else {
        // For group chats, create MessageReadStatus entries
        const { data: allMessages } = await client.models.Message.list({
          filter: {
            chatRoomId: {
              eq: roomId
            },
            senderId: {
              ne: user.attributes.email // Not sent by current user
            }
          }
        });
        
        if (allMessages) {
          for (const message of allMessages) {
            if (message.id) {
              // Check if current user has already read this message
              const { data: existingReadStatus } = await client.models.MessageReadStatus.list({
                filter: {
                  messageId: {
                    eq: message.id
                  },
                  userId: {
                    eq: user.attributes.email
                  }
                }
              });
              
              // If not read yet, create read status
              if (!existingReadStatus || existingReadStatus.length === 0) {
                await client.models.MessageReadStatus.create({
                  messageId: message.id,
                  userId: user.attributes.email,
                  readAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      }

      // Update unread count for this room
      setUnreadCounts(prev => ({
        ...prev,
        [roomId]: 0
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Fetch messages for selected room
  const fetchMessages = async (roomId: string) => {
    try {
      const { data: roomMessages } = await client.models.Message.list({
        filter: {
          chatRoomId: {
            eq: roomId
          }
        }
      });
      
      // Convert to Message type and sort by creation time
      const convertedMessages = roomMessages
        .map(msg => convertToMessage(msg))
        .sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
      
      setMessages(convertedMessages);
      
      // Mark messages as read when room is opened
      await markMessagesAsRead(roomId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  const sendMessage = async (content: string) => {
    if (!selectedRoom || !user) return;

    try {
      // Create the message in the database
      const { data: newMessage } = await client.models.Message.create({
        content,
        type: "text",
        chatRoomId: selectedRoom.id,
        senderId: user.attributes.email,
        senderNickname: user.attributes.nickname || user.attributes.email,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (newMessage) {
        // Convert to Message type and add to local state
        const convertedMessage = convertToMessage(newMessage);
        setMessages((prev) => [...prev, convertedMessage]);

        // Update the chat room's last message
        await client.models.ChatRoom.update({
          id: selectedRoom.id,
          lastMessage: content,
          lastMessageAt: new Date().toISOString(),
        });

        // Update local state for chat rooms
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

        // For other users, this message will be unread, but we don't need to update our local unread count
        // since we're the sender and we don't count our own messages as unread
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload(); // force logout and trigger AuthWrapper to re-check
    } catch (error) {
      console.error("Sign out failed:", error);
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
        onSignOut={handleSignOut}
        user={user}
        onChatRoomsUpdate={fetchChatRooms}
        unreadCounts={unreadCounts}
      />

      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <ChatRoom
            room={selectedRoom}
            messages={messages}
            onSendMessage={sendMessage}
            currentUserId={user.attributes.email}
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